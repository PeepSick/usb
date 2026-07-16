import { getSkillRegistry } from "@/lib/skill-registry";

const ACTION_KEYWORDS: { pattern: RegExp; verb: string }[] = [
  { pattern: /\b(read|fetch|load|inspect)\b/i, verb: "read" },
  { pattern: /\b(write|create|emit|produce|save)\b/i, verb: "write" },
  { pattern: /\b(modify|patch|edit|update|change)\b/i, verb: "modify" },
  { pattern: /\b(run|execute|invoke|trigger|spawn)\b/i, verb: "execute" },
  { pattern: /\b(deploy|publish|release|ship)\b/i, verb: "deploy" },
  { pattern: /\b(validate|verify|check|lint|audit)\b/i, verb: "verify" },
  { pattern: /\b(log|print|stream|emit)\b/i, verb: "log" },
  { pattern: /\b(scan|crawl|harvest|scrape)\b/i, verb: "scan" },
];

const FILE_PATTERN = /[\w./-]+\.[a-z0-9]{1,6}/gi;
const COMMAND_PATTERN = /\b(?:curl|npm|pnpm|yarn|psql|sqlite3|docker|kubectl|terraform|git|node|python|tsc|eslint|npx|playwright|puppeteer)(?:\s+[^\n]{1,80})?/gi;

function estimateActions(text: string): string[] {
  if (!text) return [];
  const found = new Set<string>();
  for (const { pattern, verb } of ACTION_KEYWORDS) {
    if (pattern.test(text)) found.add(verb);
  }
  return [...found];
}

function collectFileMentions(text: string): string[] {
  if (!text) return [];
  const matches = text.match(FILE_PATTERN) ?? [];
  const cleaned = matches
    .map((m) => m.trim())
    .filter((m) => m.length > 3 && !m.startsWith(".") && !m.endsWith("."));
  return Array.from(new Set(cleaned)).slice(0, 12);
}

function collectCommandMentions(text: string): string[] {
  if (!text) return [];
  const matches = text.match(COMMAND_PATTERN) ?? [];
  return Array.from(new Set(matches.map((m) => m.trim()))).slice(0, 8);
}

/**
 * Builds the dry-run audit report for a single skill, in-process (no network hop).
 * Shared by the /api/audit/[slug] route and the MCP `usb_audit_skill` tool so that
 * neither has to make a server-side HTTP request (which would be vulnerable to
 * SSRF via a spoofed request origin).
 */
export async function buildAuditReport(
  slug: string,
): Promise<{ status: number; report: unknown }> {
  const { skills, pack } = await getSkillRegistry();
  const skill = skills.find((s) => s.slug === slug);
  if (!skill) {
    return {
      status: 404,
      report: {
        ok: false,
        error: `Skill "${slug}" not found in pack "${pack.slug}".`,
        availableCount: skills.length,
      },
    };
  }

  const corpus = [
    skill.name,
    skill.description,
    skill.triggerPhrase,
    skill.promptTemplate,
    ...(skill.examples ?? []),
  ].join("\n");

  const actions = estimateActions(corpus);
  const files = collectFileMentions(corpus);
  const commands = collectCommandMentions(corpus);

  const destructive = ["write", "modify", "execute", "deploy"].some((v) =>
    actions.includes(v),
  );

  const report = {
    ok: true,
    mode: "dry-run",
    pack: { slug: pack.slug, version: pack.version, name: pack.name },
    skill: {
      slug: skill.slug,
      name: skill.name,
      category: skill.category,
      risk: skill.metadata.risk,
      tags: skill.metadata.tags,
      modelAgnostic: skill.metadata.modelAgnostic,
      agentAgnostic: skill.metadata.agentAgnostic,
    },
    estimate: {
      actions,
      files,
      commands,
      destructive,
      requiresReview: skill.metadata.risk !== "low" || destructive,
    },
    preview: {
      description: skill.description,
      trigger: skill.triggerPhrase,
      firstExample: skill.examples?.[0] ?? null,
      outputKinds: skill.outputs.map((o) => o.kind),
      inputCount: skill.inputs.length,
      outputCount: skill.outputs.length,
    },
    warnings: [
      ...(skill.metadata.risk === "high"
        ? ["HIGH risk skill — manual review required before run"]
        : []),
      ...(destructive
        ? ["Skill may write/modify/deploy — run in sandbox first"]
        : []),
    ],
    notice:
      "This is a static preview of intent. It does not execute the skill or access any external system.",
  };

  return { status: 200, report };
}
