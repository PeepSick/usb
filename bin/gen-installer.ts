// Offline installer generation test — mirrors getSkillBundle() without the DB.
// Usage: npx tsx bin/gen-installer.ts [target] [outFile]
import { writeFileSync } from "node:fs";
import { renderInstallScript } from "../src/lib/install-script";
import {
  DEFAULT_ADAPTERS,
  DEFAULT_PACK,
  DEFAULT_PACK_RELEASED_AT,
  DEFAULT_SKILLS,
} from "../src/lib/default-skillpack";
import type { SkillBundle } from "../src/lib/skill-registry";

const target = (process.argv[2] ?? "claude") as SkillBundle["target"];
const outFile = process.argv[3] ?? "install.sh";
const origin = "http://localhost:3000";

const adapter =
  DEFAULT_ADAPTERS.find((a) => a.target === target) ??
  DEFAULT_ADAPTERS.find((a) => a.target === "generic") ??
  DEFAULT_ADAPTERS[DEFAULT_ADAPTERS.length - 1];

const bundle: SkillBundle = {
  schemaVersion: "skill-bridge/v1",
  // Stable, not `new Date()` — this harness mirrors getSkillBundle(), which
  // uses the seeded pack row's createdAt so the rendered script hashes
  // identically across requests/runs. See DEFAULT_PACK_RELEASED_AT.
  generatedAt: DEFAULT_PACK_RELEASED_AT,
  source: origin,
  installCommand: `curl -fsSL "${origin}/api/install?target=${target}" | bash`,
  target,
  adapter,
  pack: {
    slug: DEFAULT_PACK.slug,
    name: DEFAULT_PACK.name,
    description: DEFAULT_PACK.description,
    version: DEFAULT_PACK.version,
    author: DEFAULT_PACK.author,
  },
  adapters: DEFAULT_ADAPTERS,
  skills: DEFAULT_SKILLS.map((s) => ({
    slug: s.slug,
    name: s.name,
    category: s.category,
    description: s.description,
    triggerPhrase: s.triggerPhrase,
    promptTemplate: s.promptTemplate,
    inputs: s.inputs,
    outputs: s.outputs,
    examples: s.examples,
    metadata: s.metadata,
  })),
};

const script = renderInstallScript(bundle).replace(
  "__VERIFY_URL__",
  `${origin}/api/install-sha256?target=${target}`,
);
writeFileSync(outFile, script, "utf8");
console.log(
  `wrote ${outFile}: target=${target} skills=${bundle.skills.length} bytes=${script.length}`,
);
