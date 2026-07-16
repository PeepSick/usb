/**
 * Minimal MCP server endpoint exposing USB catalog tools over JSON-RPC 2.0.
 *
 * Compatible with the Model Context Protocol's tools capability. Any MCP client
 * (Cursor, Claude Code, custom agents) can talk to this endpoint to discover
 * and call USB skills at runtime.
 *
 *   POST /api/mcp  Content-Type: application/json
 *   {
 *     "jsonrpc": "2.0",
 *     "id": 1,
 *     "method": "tools/list"
 *   }
 */
import { getSkillBundle, getOriginFromRequest, normalizeTarget } from "@/lib/skill-registry";
import { applyFilter, parseFilterFromUrl } from "@/lib/filter";
import { buildAuditReport } from "@/lib/audit";
import type { FilterableSkill } from "@/lib/filter";

export const dynamic = "force-dynamic";

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
};

type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

const USB_TOOLS = [
  {
    name: "usb_search",
    description:
      "Search the USB catalog by free-text. Matches against skill slug, name, category and description.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search term" },
        limit: { type: "number", description: "Maximum results (default 20)" },
      },
      required: ["query"],
    },
  },
  {
    name: "usb_get_skill",
    description:
      "Fetch the full record of a single skill by its slug — including the full prompt template, inputs, outputs and examples.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Skill slug, e.g. 'intent-router'" },
      },
      required: ["slug"],
    },
  },
  {
    name: "usb_audit_skill",
    description:
      "Dry-run audit for a single skill: shows what files would be created, which shell commands would run, and any risk warnings — without actually installing.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Skill slug" },
      },
      required: ["slug"],
    },
  },
  {
    name: "usb_render_install",
    description:
      "Render a portable bash installer for a subset of the catalog. Filter by slug, domain, category, preset, or core.",
    inputSchema: {
      type: "object",
      properties: {
        target: {
          type: "string",
          description: "Runtime target: leosis, claude, hermes, cursor, openai, anthropic, langchain, mcp, openrouter, groq, mistral, ollama, lm-studio, vllm, auto, generic",
        },
        slug: { type: "string", description: "Single skill slug" },
        domain: { type: "string", description: "Single domain (e.g. 'react-state')" },
        category: { type: "string", description: "Comma-separated categories (e.g. 'Audit,Security')" },
        preset: { type: "string", description: "Curated preset (core-only, web-dev, backend, infra, security, data)" },
        core: { type: "boolean", description: "Always include the 9 core orchestration skills" },
        exclude: { type: "string", description: "Comma-separated slugs / prefixes to exclude (e.g. 'python-*,node-*')" },
      },
    },
  },
];

function rpcOk(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function rpcErr(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message, data } };
}

async function handleCall(name: string, args: Record<string, unknown>, origin: string) {
  switch (name) {
    case "usb_search": {
      const query = String(args.query ?? "");
      const limit = Number(args.limit ?? 20);
      const target = normalizeTarget(typeof args.target === "string" ? args.target : "generic");
      const bundle = await getSkillBundle(target, origin);
      const q = query.toLowerCase();
      const matches = bundle.skills
        .filter(
          (s) =>
            s.slug.toLowerCase().includes(q) ||
            s.name.toLowerCase().includes(q) ||
            s.category.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q),
        )
        .slice(0, limit)
        .map((s) => ({ slug: s.slug, name: s.name, category: s.category, description: s.description }));
      return { count: matches.length, results: matches };
    }

    case "usb_get_skill": {
      const slug = String(args.slug ?? "");
      const target = normalizeTarget(typeof args.target === "string" ? args.target : "generic");
      const bundle = await getSkillBundle(target, origin);
      const skill = bundle.skills.find((s) => s.slug === slug);
      if (!skill) return { found: false, slug };
      return { found: true, skill };
    }

    case "usb_audit_skill": {
      const slug = String(args.slug ?? "");
      const { status, report } = await buildAuditReport(slug);
      if (status === 404) return { found: false, slug };
      if (status !== 200) throw new Error(`audit failed: ${status}`);
      return report;
    }

    case "usb_render_install": {
      const target = normalizeTarget(typeof args.target === "string" ? args.target : "auto");
      const filter = parseFilterFromUrl(new URL("http://x/?" + new URLSearchParams(args as Record<string, string>)));
      const bundle = await getSkillBundle(target, origin);
      const filtered = applyFilter(
        bundle.skills as unknown as FilterableSkill[],
        filter,
      );
      // Strip the promptTemplate / examples to keep this response small and safe.
      const nameBySlug = new Map(bundle.skills.map((s) => [s.slug, s.name]));
      const slim = (filtered as unknown as Array<{ slug: string; category: string }>).map((s) => ({
        slug: s.slug,
        name: nameBySlug.get(s.slug) ?? s.slug,
        category: s.category,
      }));
      const installUrl = `${origin}/api/install?${new URLSearchParams(
        { target, ...(filter as Record<string, string>) },
      ).toString()}`;
      return {
        installCommand: `curl -fsSL "${installUrl}" | bash`,
        count: slim.length,
        skills: slim,
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function handleRpc(req: JsonRpcRequest, origin: string): Promise<JsonRpcResponse> {
  const id = req.id ?? null;
  try {
    switch (req.method) {
      case "initialize":
        return rpcOk(id, {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "usb", version: "0.4.1" },
        });

      case "notifications/initialized":
        // Client hello — no response needed.
        return rpcOk(id, {});

      case "tools/list":
        return rpcOk(id, { tools: USB_TOOLS });

      case "tools/call": {
        const params = req.params ?? {};
        const name = String(params.name ?? "");
        const args = (params.arguments ?? {}) as Record<string, unknown>;
        const result = await handleCall(name, args, origin);
        return rpcOk(id, {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        });
      }

      case "ping":
        return rpcOk(id, { pong: true });

      default:
        return rpcErr(id, -32601, `Method not found: ${req.method}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return rpcErr(id, -32603, `Internal error: ${message}`);
  }
}

export async function POST(request: Request) {
  const origin = getOriginFromRequest(request);
  let body: JsonRpcRequest | JsonRpcRequest[];
  try {
    body = (await request.json()) as JsonRpcRequest | JsonRpcRequest[];
  } catch {
    return Response.json(
      rpcErr(null, -32700, "Parse error: invalid JSON"),
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (Array.isArray(body) && body.length > 20) {
    return Response.json(
      rpcErr(null, -32600, "Batch too large (max 20)"),
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const requests = Array.isArray(body) ? body : [body];
  const responses = await Promise.all(requests.map((r) => handleRpc(r, origin)));

  // Notifications get no response. For batched single requests we always reply.
  if (Array.isArray(body)) {
    return Response.json(responses.filter((r) => r.id !== null), {
      headers: { "Cache-Control": "no-store" },
    });
  }
  const single = responses[0]!;
  if (single.id === null) {
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  }
  return Response.json(single, { headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  // Discovery / health probe for clients that want to confirm the endpoint is up.
  return Response.json(
    {
      ok: true,
      name: "usb-mcp",
      version: "0.4.1",
      transport: "http",
      endpoint: "/api/mcp",
      methods: ["initialize", "tools/list", "tools/call", "ping"],
      tools: USB_TOOLS.map((t) => t.name),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}