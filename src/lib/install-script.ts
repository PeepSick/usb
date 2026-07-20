import crypto from "node:crypto";
import type { SkillBundle } from "@/lib/skill-registry";

// Slugs and versions are interpolated into bash lines below. Nothing outside
// these charsets may reach the script, no matter what the DB contains —
// community/third-party skill sources must not become shell injection.
const SLUG_RE = /^[a-z0-9-]{1,64}$/;
const VERSION_RE = /^[0-9A-Za-z.-]{1,32}$/;

function safeSlug(slug: string): string {
  if (!SLUG_RE.test(slug)) throw new Error(`unsafe slug rejected: ${JSON.stringify(slug)}`);
  return slug;
}

function safeVersion(version: string): string {
  if (!VERSION_RE.test(version)) throw new Error(`unsafe version rejected: ${JSON.stringify(version)}`);
  return version;
}

function asToolName(slug: string): string {
  return slug.replace(/[^a-zA-Z0-9_]/g, "_");
}

function toSkillMarkdown(skill: SkillBundle["skills"][number]): string {
  return `---
slug: ${skill.slug}
name: ${skill.name}
category: ${skill.category}
risk: ${skill.metadata.risk}
model_agnostic: ${skill.metadata.modelAgnostic}
agent_agnostic: ${skill.metadata.agentAgnostic}
tags: ${skill.metadata.tags.join(", ")}
---

# ${skill.name}

${skill.description}

## When to use it
${skill.triggerPhrase}

## Protocol
${skill.promptTemplate}

## Input contract
${skill.inputs
  .map(
    (input) =>
      `- **${input.name}** (${input.kind}${input.required ? ", required" : ", optional"}): ${input.description}`,
  )
  .join("\n")}

## Output contract
${skill.outputs
  .map((output) => `- **${output.name}** (${output.kind}): ${output.description}`)
  .join("\n")}

## Examples
${skill.examples.map((example) => `- ${example}`).join("\n")}
`;
}

function buildAdapterDescriptor(bundle: SkillBundle) {
  return {
    schemaVersion: bundle.schemaVersion,
    generatedAt: bundle.generatedAt,
    target: bundle.target,
    adapter: bundle.adapter,
    pack: bundle.pack,
    tools: bundle.skills.map((skill) => ({
      name: asToolName(skill.slug),
      title: skill.name,
      description: skill.description,
      trigger: skill.triggerPhrase,
      inputSchema: {
        type: "object",
        properties: Object.fromEntries(
          skill.inputs.map((input) => [
            input.name,
            {
              type: input.kind === "json" ? "object" : "string",
              description: input.description,
            },
          ]),
        ),
        required: skill.inputs.filter((input) => input.required).map((input) => input.name),
      },
      outputContract: skill.outputs,
      promptTemplate: skill.promptTemplate,
      metadata: skill.metadata,
    })),
  };
}

function buildCursorRules(bundle: SkillBundle): string {
  const skillList = bundle.skills
    .map(
      (skill) =>
        `- ${skill.slug}: ${skill.triggerPhrase} Output: ${skill.outputs
          .map((output) => output.kind)
          .join(", ")}.`,
    )
    .join("\n");

  return `---
description: ${bundle.pack.name} router rules
globs: ["**/*"]
alwaysApply: false
---

# ${bundle.pack.name}

This rule file introduces the modular skill pack to the IDE agent as a compact router.

## Router rule
Classify the user's request first by intent, risk, context, and required output type. Pick the best-fitting skill slug below, write a brief rationale, and apply that skill's protocol.

${skillList}

## General safety
- Never write secret values into the client bundle.
- Never consider a code change done without running its verification commands.
- Fall back to generic markdown + JSON manifest behavior if the target runtime is unknown.
`;
}

function heredoc(destination: string, marker: string, content: string): string {
  // Belt and braces: markerFor() makes a collision computationally
  // infeasible, but if content ever does contain its terminator, refuse to
  // render rather than emit a script whose tail executes as bash.
  if (content.includes(marker)) {
    throw new Error(`heredoc marker collision for ${destination}`);
  }
  return `write_file ${destination} <<'${marker}'\n${content.trimEnd()}\n${marker}\n`;
}

function markerFor(prefix: string, content: string): string {
  // Marker derived from the content's own hash: deterministic across renders
  // (so /api/install and /api/install-sha256 stay byte-identical) yet
  // unforgeable — embedding the marker in content changes the hash, so a
  // heredoc-escaping fixpoint would require a sha256 preimage.
  const digest = crypto.createHash("sha256").update(content).digest("hex").slice(0, 16).toUpperCase();
  return `__USB_${prefix}_${digest}__`;
}

export function renderInstallScript(bundle: SkillBundle): string {
  safeSlug(bundle.pack.slug);
  safeVersion(bundle.pack.version);
  const manifest = JSON.stringify(bundle, null, 2);
  const adapterDescriptor = JSON.stringify(buildAdapterDescriptor(bundle), null, 2);
  const cursorRules = buildCursorRules(bundle);
  const skillFiles = bundle.skills
    .map((skill) => {
      const markdown = toSkillMarkdown(skill);
      return heredoc(
        `"$PACK_DIR/skills/${safeSlug(skill.slug)}.md"`,
        markerFor("SKILL", markdown),
        markdown,
      );
    })
    .join("\n");

  return `#!/usr/bin/env bash
# -u intentionally omitted: the auto-detect block references optional env vars
# (LEOSIS_SKILLS_DIR, CLAUDE_SKILLS_DIR, HERMES_SKILLS_DIR, CURSOR_RULES_DIR,
# OPENCODE_DIR, CODEX_HOME) — failing on unset values breaks installer UX.
# -o pipefail kept: ensures the heredoc chain surfaces real failures.
set -eo pipefail

# ───────────────────────────────────────────────────────────────────────
# USB installer
# pack:    ${bundle.pack.slug} v${bundle.pack.version}
# target:  ${bundle.target}
# skills:  ${bundle.skills.length}
# verify:  __VERIFY_URL__
# Inspect with: less install.sh   |   Run with: bash install.sh
# Dry-run:  bash install.sh --check   (lists actions, executes nothing)
# ───────────────────────────────────────────────────────────────────────

# --- output helpers (also used by the auto-detect block below) ---
RED=$'\x1b[0;31m'
GRN=$'\x1b[0;32m'
YEL=$'\x1b[0;33m'
CYA=$'\x1b[0;36m'
DIM=$'\x1b[2m'
RST=$'\x1b[0m'

# --- --check / --dry-run flag: show what would happen, run nothing ---
USB_CHECK=0
case "\${1:-}" in
  --check|--dry-run)
    USB_CHECK=1
    shift
    printf '\n%s[check]%s dry-run mode — listing actions, executing nothing.\n\n' "$CYA" "$RST"
    ;;
esac

# Run a command, or print "[would] <cmd>" in check mode.
do_or_show() {
  if [ "$USB_CHECK" = "1" ]; then
    printf '  %s[would]%s %s\n' "$DIM" "$RST" "$*"
  else
    "$@"
  fi
}

# Write stdin to a file, or just announce it in check mode.
# Redirections can't go through do_or_show: the shell would open/truncate
# the file before the function runs, so dry-run must consume stdin itself.
write_file() {
  if [ "$USB_CHECK" = "1" ]; then
    cat > /dev/null
    printf '  %s[would]%s write %s\n' "$DIM" "$RST" "$1"
  else
    cat > "$1"
  fi
}

REQUESTED_TARGET="${bundle.target}"
TARGET="$REQUESTED_TARGET"
PACK_SLUG="${bundle.pack.slug}"
PACK_VERSION="${bundle.pack.version}"
SKILL_COUNT="${bundle.skills.length}"
ROOT="${"${AI_SKILL_HOME:-$HOME/.ai-skills}"}"
PACK_DIR="$ROOT/$PACK_SLUG"

if [ "$TARGET" = "auto" ]; then
  # Detect every supported runtime. We collect ALL hits so the user can pick
  # when more than one is installed — silently picking the first is bad UX.
  __USB_DETECTED=()
  [ -n "$LEOSIS_SKILLS_DIR" ] || [ -d "$HOME/.leosis" ]    && __USB_DETECTED+=("leosis")
  [ -n "$CLAUDE_SKILLS_DIR" ] || [ -d "$HOME/.claude" ]    && __USB_DETECTED+=("claude")
  [ -n "$HERMES_SKILLS_DIR" ] || [ -d "$HOME/.hermes" ]    && __USB_DETECTED+=("hermes")
  [ -n "$CURSOR_RULES_DIR" ] || [ -d "$HOME/.cursor" ]    && __USB_DETECTED+=("cursor")
  [ -n "$OPENCODE_DIR" ]      || [ -d "$HOME/.opencode" ] && __USB_DETECTED+=("opencode")
  [ -n "$CODEX_HOME" ]        || [ -d "$HOME/.codex" ]    && __USB_DETECTED+=("openai")
  [ -d "$HOME/.continue" ]                                  && __USB_DETECTED+=("langchain")
  [ -d "$HOME/.aider" ]                                     && __USB_DETECTED+=("anthropic")
  [ -d "$HOME/.vllm" ]                                      && __USB_DETECTED+=("vllm")
  [ -d "$HOME/.ollama" ]                                    && __USB_DETECTED+=("ollama")
  [ -d "$HOME/.lmstudio" ]                                  && __USB_DETECTED+=("lm-studio")
  [ -d "$HOME/.openrouter" ]                                && __USB_DETECTED+=("openrouter")
  [ -d "$HOME/.groq" ]                                      && __USB_DETECTED+=("groq")
  [ -d "$HOME/.mistral" ]                                   && __USB_DETECTED+=("mistral")
  [ -d "$HOME/.mcp" ]                                       && __USB_DETECTED+=("mcp")

  __USB_DETECT_COUNT=\${#__USB_DETECTED[@]}
  if [ "$__USB_DETECT_COUNT" -eq 0 ]; then
    TARGET="generic"
    printf '%s[!]%s No AI runtime detected — falling back to generic.\n' "$YEL" "$RST"
  elif [ "$__USB_DETECT_COUNT" -eq 1 ]; then
    TARGET="\${__USB_DETECTED[0]}"
    printf '%s[OK]%s Auto-detected runtime: %s%s%s\n' "$GRN" "$RST" "$CYA" "$TARGET" "$RST"
  else
    printf '\n%s  Multiple AI runtimes detected on this machine:%s\n' "$CYA" "$RST"
    printf '  %s\n' "\${__USB_DETECTED[*]}"
    PS3=$'\n  Which one should USB install into? (number): '
    select __USB_CHOICE in "\${__USB_DETECTED[@]}" "generic (custom path)" "Cancel"; do
      case "$REPLY" in
        [1-9])
          if [ "$__USB_CHOICE" = "Cancel" ]; then
            printf '%s[x]%s Cancelled.\n' "$RED" "$RST"
            exit 1
          fi
          TARGET="$__USB_CHOICE"
          printf '%s[OK]%s Selected: %s%s%s\n' "$GRN" "$RST" "$CYA" "$TARGET" "$RST"
          break
          ;;
        *) printf '%s[!]%s Invalid choice.\n' "$YEL" "$RST" ;;
      esac
    done
  fi
  unset __USB_DETECTED __USB_DETECT_COUNT __USB_CHOICE
fi

do_or_show mkdir -p "$PACK_DIR/skills" "$ROOT/adapters/$TARGET"

${heredoc('"$PACK_DIR/skillpack.json"', markerFor("SKILLPACK_JSON", manifest), manifest)}
${heredoc('"$PACK_DIR/adapter.bridge.json"', markerFor("ADAPTER_JSON", adapterDescriptor), adapterDescriptor)}
${heredoc('"$PACK_DIR/cursor-rule.mdc"', markerFor("CURSOR_RULE", cursorRules), cursorRules)}
${skillFiles}
case "$TARGET" in
  leosis)
    DEST="${"${LEOSIS_SKILLS_DIR:-$HOME/.leosis/skills/$PACK_SLUG}"}"
    do_or_show mkdir -p "$DEST"
    do_or_show cp "$PACK_DIR/skills/"*.md "$DEST/"
    do_or_show cp "$PACK_DIR/skillpack.json" "$DEST/skillpack.json"
    do_or_show cp "$PACK_DIR/adapter.bridge.json" "$DEST/adapter.bridge.json"
    do_or_show cp "$PACK_DIR/cursor-rule.mdc" "$DEST/$PACK_SLUG.mdc"
    ;;
  claude)
    DEST="${"${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills/$PACK_SLUG}"}"
    do_or_show mkdir -p "$DEST"
    do_or_show cp "$PACK_DIR/skills/"*.md "$DEST/"
    do_or_show cp "$PACK_DIR/skillpack.json" "$DEST/skillpack.json"
    ;;
  hermes)
    DEST="${"${HERMES_SKILLS_DIR:-$HOME/.hermes/skills/$PACK_SLUG}"}"
    do_or_show mkdir -p "$DEST"
    do_or_show cp "$PACK_DIR/skills/"*.md "$DEST/"
    do_or_show cp "$PACK_DIR/skillpack.json" "$DEST/hermes.skillpack.json"
    do_or_show cp "$PACK_DIR/adapter.bridge.json" "$DEST/adapter.bridge.json"
    ;;
  cursor)
    DEST="${"${CURSOR_RULES_DIR:-$HOME/.cursor/rules}"}"
    do_or_show mkdir -p "$DEST"
    do_or_show cp "$PACK_DIR/cursor-rule.mdc" "$DEST/$PACK_SLUG.mdc"
    ;;
  openai|anthropic|openrouter|groq|mistral)
    DEST="$ROOT/adapters/$TARGET"
    do_or_show mkdir -p "$DEST"
    do_or_show cp "$PACK_DIR/adapter.bridge.json" "$DEST/$PACK_SLUG.json"
    do_or_show cp "$PACK_DIR/skillpack.json" "$DEST/skillpack.json"
    ;;
  langchain|mcp)
    DEST="$ROOT/adapters/$TARGET"
    do_or_show mkdir -p "$DEST"
    do_or_show cp "$PACK_DIR/adapter.bridge.json" "$DEST/$PACK_SLUG.json"
    do_or_show cp "$PACK_DIR/skillpack.json" "$DEST/skillpack.json"
    ;;
  ollama|lm-studio|vllm)
    DEST="$ROOT/adapters/$TARGET"
    do_or_show mkdir -p "$DEST"
    do_or_show cp "$PACK_DIR/adapter.bridge.json" "$DEST/$PACK_SLUG.json"
    do_or_show cp "$PACK_DIR/skills/"*.md "$DEST/"
    ;;
  *)
    DEST="$PACK_DIR"
    ;;
esac

# --- Local install registry (always-on, no network, no PII) ---
INSTALL_RECORD="$PACK_DIR/installed.json"
write_file "$INSTALL_RECORD" <<'__USB_INSTALL_RECORD__'
{
  "pack": "__PACK_SLUG__",
  "version": "__PACK_VERSION__",
  "target": "__TARGET__",
  "skill_count": __SKILL_COUNT__,
  "installed_at": "__TIMESTAMP__"
}
__USB_INSTALL_RECORD__
if [ "$USB_CHECK" != "1" ]; then
  sed -i.bak \\
    -e "s|__PACK_SLUG__|$PACK_SLUG|g" \\
    -e "s|__PACK_VERSION__|$PACK_VERSION|g" \\
    -e "s|__TARGET__|$TARGET|g" \\
    -e "s|__SKILL_COUNT__|$SKILL_COUNT|g" \\
    -e "s|__TIMESTAMP__|$(date -u +%Y-%m-%dT%H:%M:%SZ)|g" \\
    "$INSTALL_RECORD"
  rm -f "$INSTALL_RECORD.bak"
fi

# --- Optional anonymous install telemetry (opt-in via env var) ---
if [ "${"${USB_TELEMETRY:-off}"}" = "on" ]; then
  TELEMETRY_URL="${"${USB_TELEMETRY_URL:-https://api.universal-skill-bridge.dev/v1/telemetry}"}"
  do_or_show curl -fsS -X POST -H "Content-Type: application/json" \\
    --max-time 3 \\
    -d "{\\"target\\":\\"$TARGET\\",\\"pack\\":\\"$PACK_SLUG\\",\\"version\\":\\"$PACK_VERSION\\",\\"skills\\":$SKILL_COUNT,\\"ts\\":$(date +%s)}" \\
    "$TELEMETRY_URL" >/dev/null 2>&1 || true
fi

if [ "$USB_CHECK" = "1" ]; then
  printf '\n[check] Would write %s skills. Re-run without --check to actually install.\n' "$SKILL_COUNT"
  printf '  [would] pack dir:    %s\n' "$PACK_DIR"
  printf '  [would] registry:    %s\n' "$INSTALL_RECORD"
  printf '  [would] target:      (resolved after auto-detect — see logs above)\n'
  exit 0
fi

SKILL_UNIT="skills"; [ "$SKILL_COUNT" = "1" ] && SKILL_UNIT="skill"
echo "✅ $PACK_SLUG v$PACK_VERSION installed for target: $TARGET ($SKILL_COUNT $SKILL_UNIT)"
echo "📦 Portable pack: $PACK_DIR"
echo "🔌 Target files: \${DEST:-$PACK_DIR}"
echo "📝 Local registry: $INSTALL_RECORD"
echo "ℹ️  Tip: override the target folder with AI_SKILL_HOME, LEOSIS_SKILLS_DIR, CLAUDE_SKILLS_DIR, HERMES_SKILLS_DIR, or CURSOR_RULES_DIR."
echo "💡 Optional: export USB_TELEMETRY=on to send anonymous install stats (target + pack + version, no PII)."
`;
}

export type InstallFilterSummary = {
  originalCount: number;
  filteredCount: number;
  reductionPct: number;
};

/**
 * Produces the EXACT final byte string served by /api/install and hashed by
 * /api/install-sha256. Both routes MUST call this — not renderInstallScript()
 * directly — otherwise the appended footer (filter summary / query / verify
 * line) makes the downloaded script and the advertised checksum diverge and
 * `sha256sum -c` can never pass. `summary` and `search` must be derived from
 * the same bundle/filter/URL the two routes each compute for a given request;
 * since those inputs are deterministic for identical query strings, so is
 * this output.
 */
export function renderFinalInstallScript(
  bundle: SkillBundle,
  verifyUrl: string,
  summary: InstallFilterSummary,
  search: string,
): string {
  const script = renderInstallScript(bundle).replace("__VERIFY_URL__", verifyUrl);
  return (
    script +
    [
      "",
      "# ─────────────────────────────────────────────────────────────────",
      `# Filter applied: ${summary.filteredCount} / ${summary.originalCount} skills (${summary.reductionPct}% smaller)`,
      `# Query: ${search}`,
      `# Verify with:  curl -fsSL "${verifyUrl}"`,
      "# ─────────────────────────────────────────────────────────────────",
    ].join("\n")
  );
}
