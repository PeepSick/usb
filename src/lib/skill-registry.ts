import { db } from "@/db";
import {
  skillInstallations,
  skillPacks,
  skills,
  type AgentAdapter,
  type AgentTarget,
  type Skill,
  type SkillInstallation,
  type SkillPack,
} from "@/db/schema";
import {
  DEFAULT_ADAPTERS,
  DEFAULT_PACK,
  DEFAULT_SKILLS,
  DEFAULT_TARGETS,
} from "@/lib/default-skillpack";
import { asc, count, desc, eq } from "drizzle-orm";

export type SkillBundle = {
  schemaVersion: "skill-bridge/v1";
  generatedAt: string;
  source: string;
  installCommand: string;
  target: AgentTarget;
  adapter: AgentAdapter;
  pack: Pick<SkillPack, "slug" | "name" | "description" | "version" | "author">;
  adapters: AgentAdapter[];
  skills: Array<
    Pick<
      Skill,
      | "slug"
      | "name"
      | "category"
      | "description"
      | "triggerPhrase"
      | "promptTemplate"
      | "inputs"
      | "outputs"
      | "examples"
      | "metadata"
    >
  >;
};

export type InstallationMeta = Record<string, string | number | boolean | null>;

export function normalizeTarget(value: string | null | undefined): AgentTarget {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return "generic";
  }

  if (DEFAULT_TARGETS.includes(normalized as AgentTarget)) {
    return normalized as AgentTarget;
  }

  return "generic";
}

export function buildInstallCommand(origin: string, target: AgentTarget): string {
  const safeOrigin = origin.replace(/\/$/, "");
  return `curl -fsSL "${safeOrigin}/api/install?target=${target}" | bash`;
}

export function getOriginFromRequest(request: Request): string {
  const pinned = process.env.USB_PUBLIC_ORIGIN;
  if (pinned) return pinned.replace(/\/$/, "");

  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? url.host;
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

export async function ensureSkillRegistrySeeded(): Promise<number> {
  const existing = await db
    .select({ id: skillPacks.id })
    .from(skillPacks)
    .where(eq(skillPacks.slug, DEFAULT_PACK.slug))
    .limit(1);

  let packId = existing[0]?.id;

  if (!packId) {
    const inserted = await db
      .insert(skillPacks)
      .values({
        slug: DEFAULT_PACK.slug,
        name: DEFAULT_PACK.name,
        description: DEFAULT_PACK.description,
        version: DEFAULT_PACK.version,
        author: DEFAULT_PACK.author,
        targets: DEFAULT_TARGETS,
        adapters: DEFAULT_ADAPTERS,
      })
      .onConflictDoNothing({ target: skillPacks.slug })
      .returning({ id: skillPacks.id });

    packId = inserted[0]?.id;

    if (!packId) {
      const conflicted = await db
        .select({ id: skillPacks.id })
        .from(skillPacks)
        .where(eq(skillPacks.slug, DEFAULT_PACK.slug))
        .limit(1);
      packId = conflicted[0]?.id;
    }
  }

  if (!packId) {
    throw new Error("Skill pack seed could not be created.");
  }

  // Optimize skill check by counting
  const [skillCountRow] = await db
    .select({ total: count() })
    .from(skills)
    .where(eq(skills.packId, packId));

  const currentCount = skillCountRow?.total ?? 0;

  if (currentCount < DEFAULT_SKILLS.length) {
    // We need to seed missing skills in optimized chunks
    const seededSkills = await db
      .select({ slug: skills.slug })
      .from(skills)
      .where(eq(skills.packId, packId));
    const seededSlugs = new Set(seededSkills.map((skill) => skill.slug));
    const missingSkills = DEFAULT_SKILLS.filter((skill) => !seededSlugs.has(skill.slug));

    const CHUNK_SIZE = 50;
    for (let i = 0; i < missingSkills.length; i += CHUNK_SIZE) {
      const chunk = missingSkills.slice(i, i + CHUNK_SIZE);
      await db
        .insert(skills)
        .values(chunk.map((skill) => ({ ...skill, packId })))
        .onConflictDoNothing({ target: skills.slug });
    }
  }

  return packId;
}

export async function getSkillRegistry(): Promise<{
  pack: SkillPack;
  skills: Skill[];
}> {
  await ensureSkillRegistrySeeded();

  const [pack] = await db
    .select()
    .from(skillPacks)
    .where(eq(skillPacks.slug, DEFAULT_PACK.slug))
    .limit(1);

  if (!pack) {
    throw new Error("Skill pack could not be loaded.");
  }

  const skillRows = await db
    .select()
    .from(skills)
    .where(eq(skills.packId, pack.id))
    .orderBy(asc(skills.category), asc(skills.name));

  // Recent installations are intentionally NOT exposed to public callers.
  // Installation logging is opt-in via USB_LOG_INSTALLATIONS=on and even then
  // the data stays in the `skill_installations` table — it is not returned
  // by the public read path.
  return { pack, skills: skillRows };
}

export async function getSkillBundle(target: AgentTarget, origin: string): Promise<SkillBundle> {
  const { pack, skills: skillRows } = await getSkillRegistry();
  const adapter =
    pack.adapters.find((item) => item.target === target) ??
    pack.adapters.find((item) => item.target === "generic") ??
    DEFAULT_ADAPTERS[DEFAULT_ADAPTERS.length - 1];

  return {
    schemaVersion: "skill-bridge/v1",
    // Stable per-pack-row timestamp (set once at seed time), NOT `new Date()`.
    // The install script is byte-for-byte re-hashed by /api/install-sha256 on
    // every request, so anything that changes per-request (like "now") makes
    // the advertised `sha256sum -c` verification flow permanently fail.
    generatedAt: pack.createdAt.toISOString(),
    source: origin.replace(/\/$/, ""),
    installCommand: buildInstallCommand(origin, target),
    target,
    adapter,
    pack: {
      slug: pack.slug,
      name: pack.name,
      description: pack.description,
      version: pack.version,
      author: pack.author,
    },
    adapters: pack.adapters,
    skills: skillRows.map((skill) => ({
      slug: skill.slug,
      name: skill.name,
      category: skill.category,
      description: skill.description,
      triggerPhrase: skill.triggerPhrase,
      promptTemplate: skill.promptTemplate,
      inputs: skill.inputs,
      outputs: skill.outputs,
      examples: skill.examples,
      metadata: skill.metadata,
    })),
  };
}

export async function recordInstallation(
  target: AgentTarget,
  origin: string,
  meta: InstallationMeta = {},
): Promise<SkillInstallation> {
  const packId = await ensureSkillRegistrySeeded();
  const manifest = await getSkillBundle(target, origin);
  const command = buildInstallCommand(origin, target);
  const [installation] = await db
    .insert(skillInstallations)
    .values({
      packId,
      target,
      command,
      manifest,
      meta,
    })
    .returning();

  if (!installation) {
    throw new Error("Installation record could not be created.");
  }

  return installation;
}
