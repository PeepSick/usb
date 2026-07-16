/**
 * Filter logic for the Universal Skill Bridge.
 *
 * Lets a user install a single skill, a domain, a category, a preset, or any
 * combination — instead of always pulling the full 529-skill pack.
 *
 * Supported query params (used by /api/install, /api/install-sha256, /api/skills):
 *   - ?slug=intent-router           → exactly 1 skill
 *   - ?domain=react-state           → 1 domain × 8 workflows = up to 8 skills
 *   - ?category=Audit,Security      → one or more categories
 *   - ?preset=web-dev               → curated domain bundle
 *   - ?core=true                    → only the 9 core orchestration skills
 *   - ?exclude=python-*,node-*      → exclude by domain prefix
 *   - combination allowed, e.g. ?preset=backend&core=true
 */

import type { Skill } from "@/db/schema";

export type { Skill };

export type FilterOptions = {
  slug?: string;
  domain?: string;
  category?: string;
  preset?: string;
  core?: boolean;
  exclude?: string;
};

const CORE_SKILLS = new Set<string>([
  "intent-router",
  "reasoning-architect",
  "adapter-smith",
  "api-contract-smith",
  "codebase-navigator",
  "implementation-sprint",
  "memory-compressor",
  "verification-runner",
  "incident-debugger",
]);

/**
 * Curated domain presets — hand-picked so a fresh user can install a useful
 * working set without thinking about taxonomy.
 */
export const PRESETS: Record<string, { label: string; description: string; domains: string[] }> = {
  "core-only": {
    label: "Core only (9 meta-skills)",
    description: "Router + planner + memory + verification — the orchestration layer without any domain knowledge.",
    domains: [],
  },
  "web-dev": {
    label: "Web Dev Pack (~40 skills)",
    description: "React, Next.js, TypeScript, CSS, browser automation — front-end focused.",
    domains: [
      "react-state",
      "react-server-components",
      "css-layout",
      "typescript-generics",
      "nextjs-data-fetching",
      "nextjs-middleware",
      "nextjs-api-routes",
      "browser-devtools",
    ],
  },
  "backend": {
    label: "Backend Pack (~40 skills)",
    description: "Node.js, Python, FastAPI, SQL, Redis — server-side focused.",
    domains: [
      "node-error-handling",
      "node-streams",
      "fastapi-dependencies",
      "python-async",
      "python-file-io",
      "sql-query-optimization",
      "redis-caching",
      "drizzle-schema-design",
    ],
  },
  "infra": {
    label: "Infra & DevOps Pack (~40 skills)",
    description: "Docker, Kubernetes, Terraform, GitHub Actions, AWS, Azure — platform focused.",
    domains: [
      "docker-multistage",
      "docker-compose-networking",
      "kubernetes-pod-lifecycle",
      "kubernetes-hpa",
      "terraform-state",
      "github-actions-pipeline",
      "aws-lambda-cold-start",
      "azure-bicep",
    ],
  },
  "security": {
    label: "Security Pack (~50 skills)",
    description: "OAuth, RLS, prompt injection, secrets, hardening — defensive focused.",
    domains: [
      "oauth-flows",
      "prompt-injection-defense",
      "secrets-rotation",
      "supabase-rls",
      "shell-script-robustness",
      "rag-chunking",
      "rate-limiting-proxy",
      "stripe-webhook-idempotency",
    ],
  },
  "data": {
    label: "Data & AI Pack (~40 skills)",
    description: "SQL, RAG, vector search, OpenAPI, GraphQL, prompt engineering — data heavy.",
    domains: [
      "sql-query-optimization",
      "rag-chunking",
      "openapi-spec",
      "graphql-n-plus-one",
      "redis-caching",
      "message-queues",
      "rate-limiting-proxy",
      "multi-tenant-isolation",
    ],
  },
};

function parseList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export type FilterableSkill = { slug: string; category: string };

export function applyFilter(
  skills: FilterableSkill[],
  options: FilterOptions,
): FilterableSkill[] {
  let result: FilterableSkill[] = skills;

  if (options.slug) {
    const wanted = new Set(parseList(options.slug));
    result = result.filter((s) => wanted.has(s.slug));
  }

  if (options.domain) {
    const domains = parseList(options.domain);
    result = result.filter((s) => {
      if (domains.includes(s.slug)) return true;
      return domains.some((d) => s.slug === d || s.slug.startsWith(`${d}-`));
    });
  }

  if (options.category) {
    const cats = new Set(parseList(options.category));
    result = result.filter((s) => cats.has(s.category));
  }

  if (options.preset) {
    const presets = parseList(options.preset);
    const domainSet = new Set<string>();
    let coreOnly = false;
    for (const key of presets) {
      if (key === "core-only") {
        coreOnly = true;
        continue;
      }
      const preset = PRESETS[key];
      if (!preset) continue;
      for (const d of preset.domains) domainSet.add(d);
    }
    if (coreOnly) {
      result = result.filter((s) => CORE_SKILLS.has(s.slug));
    }
    if (domainSet.size > 0) {
      result = result.filter((s) => {
        if (CORE_SKILLS.has(s.slug)) return true;
        return [...domainSet].some(
          (d) => s.slug === d || s.slug.startsWith(`${d}-`),
        );
      });
    }
  }

  if (options.core === true) {
    const existingSlugs = new Set(result.map((s) => s.slug));
    const cores = skills.filter(
      (s) => CORE_SKILLS.has(s.slug) && !existingSlugs.has(s.slug),
    );
    result = [...result, ...cores];
  }

  if (options.exclude) {
    const patterns = parseList(options.exclude);
    result = result.filter((s) => {
      return !patterns.some((p) => {
        if (p.endsWith("*")) {
          return s.slug.startsWith(p.slice(0, -1));
        }
        return s.slug === p || s.slug.startsWith(`${p}-`);
      });
    });
  }

  return result;
}

export function parseFilterFromUrl(url: URL): FilterOptions {
  const opts: FilterOptions = {};
  const slug = url.searchParams.get("slug");
  const domain = url.searchParams.get("domain");
  const category = url.searchParams.get("category");
  const preset = url.searchParams.get("preset");
  const core = url.searchParams.get("core");
  const exclude = url.searchParams.get("exclude");
  if (slug) opts.slug = slug;
  if (domain) opts.domain = domain;
  if (category) opts.category = category;
  if (preset) opts.preset = preset;
  if (core === "true" || core === "1") opts.core = true;
  if (exclude) opts.exclude = exclude;
  return opts;
}

export function filterSummary(
  original: FilterableSkill[],
  filtered: FilterableSkill[],
): {
  originalCount: number;
  filteredCount: number;
  reductionPct: number;
} {
  const originalCount = original.length;
  const filteredCount = filtered.length;
  const reductionPct =
    originalCount === 0
      ? 0
      : Math.round(((originalCount - filteredCount) / originalCount) * 100);
  return { originalCount, filteredCount, reductionPct };
}