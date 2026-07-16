import type {
  AgentAdapter,
  AgentTarget,
  SkillInput,
  SkillMetadata,
  SkillOutput,
} from "@/db/schema";

export type SeedSkill = {
  slug: string;
  name: string;
  category: string;
  description: string;
  triggerPhrase: string;
  promptTemplate: string;
  inputs: SkillInput[];
  outputs: SkillOutput[];
  examples: string[];
  metadata: SkillMetadata;
};

export const DEFAULT_TARGETS: AgentTarget[] = [
  "leosis",
  "auto",
  "claude",
  "hermes",
  "openai",
  "anthropic",
  "langchain",
  "cursor",
  "mcp",
  "generic",
  "openrouter",
  "groq",
  "mistral",
  "ollama",
  "lm-studio",
  "vllm",
];

export const DEFAULT_PACK = {
  slug: "universal-skill-bridge-catalog",
  name: "Universal Skill Bridge Catalog",
  description:
    "A fully original, from-scratch catalog across 16 provider targets: 65 hand-researched engineering domains systematically expanded across 8 workflows (Audit, Plan, Build, Script, Diagnose, Harden, Explain, Tune) into 529 skills, plus 9 hand-written core orchestration skills. Every skill has a distinct trigger phrase, protocol prompt, input/output contract and examples — zero external dependencies.",
  version: "0.4.1",
  author: "Universal Skill Bridge",
};

// Stable, hand-set timestamp for this catalog version. The real install
// script uses the seeded `skill_packs` DB row's `createdAt` as its
// `generatedAt` (see getSkillBundle in src/lib/skill-registry.ts) so that
// repeated requests hash identically. Offline tooling that has no DB access
// (bin/gen-installer.ts) uses this constant instead — bump it only when
// DEFAULT_PACK.version changes.
export const DEFAULT_PACK_RELEASED_AT = "2025-01-01T00:00:00.000Z";

export const DEFAULT_ADAPTERS: AgentAdapter[] = [
  {
    target: "leosis",
    label: "LeoSIS Native Bridge",
    installPath: "$LEOSIS_SKILLS_DIR or $HOME/.leosis/skills/universal-skill-bridge-catalog",
    commandHint: "curl -fsSL <host>/api/install?target=leosis | bash",
    capabilities: [
      "LeoSIS Ultra native integration",
      "OpenAI-compatible /v1 endpoint",
      "sk-leosis-... key authentication",
      "per-user memory isolation",
      "RAG-augmented tool routing",
    ],
    notes:
      "First-class integration with PeepSick Labs LeoSIS Ultra. Installs the catalog into the LeoSIS skill directory and exposes it through the LeoSIS Brain router. Works with LeoSis CoWorker, Brain, and AgentOS runtimes out of the box. Recommended default for LeoSIS Ultra deployments.",
    files: [
      { path: "leosis.skillpack.json", kind: "manifest", description: "LeoSIS-native skill pack manifest with /v1/skills metadata." },
      { path: "skills/<slug>.md", kind: "skill", description: "Markdown skill card consumable by LeoSIS skill router." },
      { path: "adapter.bridge.json", kind: "tool", description: "OpenAI-compatible tool descriptor for /v1/chat/completions." },
    ],
  },
  {
    target: "auto",
    label: "Auto-detect Bridge",
    installPath: "$AI_SKILL_HOME or $HOME/.ai-skills",
    commandHint: "curl -fsSL <host>/api/install?target=auto | bash",
    capabilities: ["runtime detection", "manifest sync", "portable markdown skills", "LeoSIS-first preference"],
    notes:
      "Auto-detects the active agent runtime on your machine. LeoSIS folders are checked first, then Claude, Hermes, Cursor, LangChain, and finally falls back to generic markdown + JSON manifest when no known runtime is found.",
    files: [
      { path: "skillpack.json", kind: "manifest", description: "Portable manifest containing all skills and adapter metadata." },
      { path: "skills/*.md", kind: "skill", description: "Markdown skill files readable by any agent runtime." },
    ],
  },
  {
    target: "claude",
    label: "Claude-compatible Skills",
    installPath: "$CLAUDE_SKILLS_DIR or $HOME/.claude/skills/universal-skill-bridge-catalog",
    commandHint: "curl -fsSL <host>/api/install?target=claude | bash",
    capabilities: ["SKILL.md style docs", "tool contract prompts", "verification checklists"],
    notes: "Writes prompt, input and output contracts as markdown skill cards into Claude Code's expected folder structure.",
    files: [{ path: "skills/<slug>.md", kind: "skill", description: "Claude Code-compatible skill card with trigger phrase and protocol." }],
  },
  {
    target: "hermes",
    label: "Hermes Agent Pack",
    installPath: "$HERMES_SKILLS_DIR or $HOME/.hermes/skills/universal-skill-bridge-catalog",
    commandHint: "curl -fsSL <host>/api/install?target=hermes | bash",
    capabilities: ["agent graph hints", "skill routing", "memory summaries"],
    notes: "Generates Hermes-compatible manifest and markdown protocols for agent orchestration.",
    files: [{ path: "hermes.skillpack.json", kind: "manifest", description: "Hermes adapter target, capabilities and file listing." }],
  },
  {
    target: "openai",
    label: "OpenAI Agents Tool Descriptor",
    installPath: "$AI_SKILL_HOME/adapters/openai",
    commandHint: "curl -fsSL <host>/api/install?target=openai | bash",
    capabilities: ["tool descriptors", "json inputs", "structured outputs"],
    notes: "Converts skill information into OpenAI Agents SDK function/tool descriptor format via manifest generation.",
    files: [{ path: "openai.tools.json", kind: "tool", description: "Tool descriptor list derived from skill input/output contracts." }],
  },
  {
    target: "anthropic",
    label: "Anthropic Messages API",
    installPath: "$ANTHROPIC_SKILLS_DIR or $HOME/.anthropic/skills/universal-skill-bridge-catalog",
    commandHint: "curl -fsSL <host>/api/install?target=anthropic | bash",
    capabilities: [
      "direct Messages API tool_use blocks",
      "Claude 3.5/3.7/4 native compatibility",
      "prompt-cache TTL hints",
      "no Claude Code dependency"
    ],
    notes:
      "Targets Anthropic's first-party Messages API (api.anthropic.com) directly without going through Claude Code. Produces tool_use descriptors compatible with Claude 3.5 Sonnet, 3.7 Sonnet, and the 4 family. Honors prompt-cache TTL fields and cache breakpoint placement.",
    files: [
      { path: "anthropic.tools.json", kind: "tool", description: "Anthropic Messages API tool_use descriptors." },
      { path: "skills/<slug>.md", kind: "skill", description: "Markdown skill cards with prompt-cache breakpoint hints." },
    ],
  },
  {
    target: "langchain",
    label: "LangChain / LangGraph Adapter",
    installPath: "$AI_SKILL_HOME/adapters/langchain",
    commandHint: "curl -fsSL <host>/api/install?target=langchain | bash",
    capabilities: ["tool registry", "graph node notes", "router metadata"],
    notes: "Drops a ready-made registry JSON for writing a skill router node in LangChain or LangGraph.",
    files: [{ path: "langchain.registry.json", kind: "tool", description: "Tool registry and routing hints." }],
  },
  {
    target: "cursor",
    label: "Cursor / IDE Rules",
    installPath: "$CURSOR_RULES_DIR or $HOME/.cursor/rules/universal-skill-bridge-catalog.mdc",
    commandHint: "curl -fsSL <host>/api/install?target=cursor | bash",
    capabilities: ["project rules", "coding checklists", "review protocol"],
    notes: "Summarizes the skill pack into a single IDE rule file, providing behavior to coding agents in a single document.",
    files: [{ path: "universal-skill-bridge-catalog.mdc", kind: "rule", description: "Compact skill router rules for IDE agents." }],
  },
  {
    target: "mcp",
    label: "MCP Server Descriptor",
    installPath: "$AI_SKILL_HOME/adapters/mcp",
    commandHint: "curl -fsSL <host>/api/install?target=mcp | bash",
    capabilities: ["server manifest", "resource hints", "prompt templates"],
    notes: "Produces a descriptor for contextualizing MCP server implementation as prompts/resources.",
    files: [{ path: "mcp.server.json", kind: "manifest", description: "MCP prompt/resource descriptor draft." }],
  },
  {
    target: "generic",
    label: "Generic Portable Pack",
    installPath: "$AI_SKILL_HOME or $HOME/.ai-skills/universal-skill-bridge-catalog",
    commandHint: "curl -fsSL <host>/api/install?target=generic | bash",
    capabilities: ["plain manifest", "markdown prompts", "runtime-agnostic"],
    notes:
      "Creates importable manifest and markdown skill files for any model or agent system that does not match a specific adapter.",
    files: [{ path: "skillpack.json", kind: "manifest", description: "Runtime-independent master pack manifest." }],
  },
  {
    target: "openrouter",
    label: "OpenRouter Multi-Model Bridge",
    installPath: "$OPENROUTER_SKILLS_DIR or $HOME/.openrouter/skills/universal-skill-bridge-catalog",
    commandHint: "curl -fsSL <host>/api/install?target=openrouter | bash",
    capabilities: [
      "OpenAI-compatible /api/v1 endpoint",
      "fallback model routing",
      "credit-based billing passthrough",
      "100+ model manifest"
    ],
    notes:
      "Targets OpenRouter (openrouter.ai) which exposes an OpenAI-compatible API for 100+ models. Adapter emits tool descriptors in OpenAI tool format so any OpenRouter-routed model can call the skills. Includes credit-cost hints per skill and free-model fallback annotations.",
    files: [
      { path: "openrouter.tools.json", kind: "tool", description: "OpenAI-format tool descriptors routed through OpenRouter." },
      { path: "skillpack.json", kind: "manifest", description: "Portable manifest with model routing hints." },
    ],
  },
  {
    target: "groq",
    label: "Groq Fast Inference Bridge",
    installPath: "$GROQ_SKILLS_DIR or $HOME/.groq/skills/universal-skill-bridge-catalog",
    commandHint: "curl -fsSL <host>/api/install?target=groq | bash",
    capabilities: [
      "ultra-low-latency LPU inference",
      "OpenAI-compatible endpoint",
      "Llama 3 / Mixtral / Gemma native",
      "batch routing aware"
    ],
    notes:
      "Targets GroqCloud (groq.com) — sub-second token streaming via LPU hardware. Adapter emits function-call descriptors in OpenAI format. Best suited for high-throughput RAG and tool-routing scenarios where latency matters more than model size.",
    files: [
      { path: "groq.tools.json", kind: "tool", description: "OpenAI function-call descriptors for Groq inference." },
      { path: "skills/<slug>.md", kind: "skill", description: "Markdown skill cards with latency-budget annotations." },
    ],
  },
  {
    target: "mistral",
    label: "Mistral AI API Bridge",
    installPath: "$MISTRAL_SKILLS_DIR or $HOME/.mistral/skills/universal-skill-bridge-catalog",
    commandHint: "curl -fsSL <host>/api/install?target=mistral | bash",
    capabilities: [
      "Mistral function-calling",
      "Codestral code-completion aware",
      "OpenAI-compatible endpoint",
      "JSON-mode tool outputs"
    ],
    notes:
      "Targets Mistral AI's first-party API (api.mistral.ai). Adapter produces function-calling descriptors compatible with Mistral Large, Codestral, and Mixtral model families. Supports JSON-mode tool outputs and per-model capability hints.",
    files: [
      { path: "mistral.tools.json", kind: "tool", description: "Mistral function-calling descriptors." },
      { path: "skills/<slug>.md", kind: "skill", description: "Markdown skill cards with model-suitability tags." },
    ],
  },
  {
    target: "ollama",
    label: "Ollama Local Runtime",
    installPath: "$OLLAMA_SKILLS_DIR or $HOME/.ollama/skills/universal-skill-bridge-catalog",
    commandHint: "curl -fsSL <host>/api/install?target=ollama | bash",
    capabilities: [
      "local inference, zero API cost",
      "Modelfile-aware tool support",
      "GPU/CPU autodetect",
      "offline-first skill library"
    ],
    notes:
      "Targets Ollama (ollama.com) running locally. Adapter emits Ollama Modelfile patches that teach the local model the skill catalog. Compatible with any Ollama model that supports function calling (llama3.1, qwen2.5, mistral, etc.).",
    files: [
      { path: "ollama.modelfile.patch", kind: "manifest", description: "Patch instructions for Ollama Modelfile." },
      { path: "skills/<slug>.md", kind: "skill", description: "Markdown skill cards consumable by Ollama tool-aware models." },
    ],
  },
  {
    target: "lm-studio",
    label: "LM Studio Local Desktop",
    installPath: "$LM_STUDIO_SKILLS_DIR or $HOME/.lmstudio/skills/universal-skill-bridge-catalog",
    commandHint: "curl -fsSL <host>/api/install?target=lm-studio | bash",
    capabilities: [
      "GGUF model support",
      "local OpenAI-compatible server",
      "GPU/CPU layer offload aware",
      "no network requirement"
    ],
    notes:
      "Targets LM Studio's built-in local server (lmstudio.ai). Emits OpenAI-compatible tool descriptors and patches LM Studio's preset configuration to include the skill catalog. Runs entirely offline; ideal for air-gapped development.",
    files: [
      { path: "lmstudio.tools.json", kind: "tool", description: "OpenAI-format tool descriptors for LM Studio's local server." },
      { path: "preset.json", kind: "manifest", description: "LM Studio preset configuration patch." },
    ],
  },
  {
    target: "vllm",
    label: "vLLM Self-Hosted Inference",
    installPath: "$VLLM_SKILLS_DIR or $HOME/.vllm/skills/universal-skill-bridge-catalog",
    commandHint: "curl -fsSL <host>/api/install?target=vllm | bash",
    capabilities: [
      "PagedAttention high-throughput",
      "OpenAI-compatible server",
      "multi-GPU tensor parallelism",
      "HuggingFace model loader"
    ],
    notes:
      "Targets self-hosted vLLM inference servers. Adapter emits OpenAI-format tool descriptors compatible with vLLM's /v1/chat/completions endpoint. Suitable for on-prem deployments, large-scale batch processing, and cost-sensitive production workloads.",
    files: [
      { path: "vllm.tools.json", kind: "tool", description: "OpenAI-format tool descriptors for vLLM /v1 endpoint." },
      { path: "skills/<slug>.md", kind: "skill", description: "Markdown skill cards with throughput hints." },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  OUTPUT & INPUT SHORTHANDS                                         */
/* ------------------------------------------------------------------ */
const CHK: SkillOutput = { name: "checklist", kind: "checklist", description: "Executable steps with risk assessment and validation items." };
const MD: SkillOutput = { name: "response", kind: "markdown", description: "Structured markdown response." };
const CMD: SkillOutput = { name: "commands", kind: "command", description: "Safe execution, verification or automation commands." };
const JSON: SkillOutput = { name: "manifest", kind: "json", description: "Machine-readable plan, contract or registry output." };
const DIFF: SkillOutput = { name: "patchPlan", kind: "diff", description: "File-level change or patch plan." };

function goal(): SkillInput[] {
  return [
    { name: "goal", kind: "text" as const, required: true, description: "The precise outcome the user wants to achieve." },
    { name: "context", kind: "text" as const, required: false, description: "Project, file, conversation or task context." },
    { name: "assets", kind: "text" as const, required: false, description: "Relevant code, logs, URLs, documents or data samples." },
  ];
}

const LR: Pick<SkillMetadata, "modelAgnostic" | "agentAgnostic" | "risk"> = { modelAgnostic: true, agentAgnostic: true, risk: "low" };
const MR: typeof LR = { modelAgnostic: true, agentAgnostic: true, risk: "medium" };
const HR: typeof LR = { modelAgnostic: true, agentAgnostic: true, risk: "high" };

/* ================================================================== */
/*  CORE SKILLS — fully original                                       */
/* ================================================================== */
const CORE_SKILLS: SeedSkill[] = [
  {
    slug: "intent-router",
    name: "Intent Router",
    category: "Orchestration",
    description: "Analyses a user request, determines the most appropriate skill to invoke, and produces a ranked execution plan. Prevents unnecessary agent context switching by grouping related sub-tasks under a single skill.",
    triggerPhrase: "Call this when a user request is vague, multi-layered, or when you are unsure which specialised skill applies.",
    promptTemplate: "Read the full request. Identify the primary intent (create, debug, refactor, document, secure, optimise). Determine the target layer (frontend, backend, data, infra, AI, docs). Choose the single best matching skill slug. Explain the choice in one sentence. If multiple skills could apply, rank them and output a sequence. Never default to asking clarifying questions if a safe fallback exists.",
    inputs: goal(),
    outputs: [JSON, CHK],
    examples: [
      "User asks 'set up authentication for my app' → route to oauth-auth-guardian.",
      "User says 'the build is failing' → route to incident-debugger.",
    ],
    metadata: { ...LR, tags: ["router", "orchestration", "classification"] },
  },
  {
    slug: "reasoning-architect",
    name: "Reasoning Architect",
    category: "Planning",
    description: "Breaks complex, multi-step tasks into a structured plan with explicit assumptions, success criteria, and a minimax strategy: minimal effort for maximum verifiable impact. Every step includes a rollback path.",
    triggerPhrase: "Call this when a task spans multiple systems, is vaguely defined, or carries risk of cascading failures.",
    promptTemplate: "Restate the goal in one sentence. List all implicit assumptions. Define success criteria as concrete, testable outcomes. Decompose into smallest viable steps. For each step: expected output, boundary risk, verification command, and rollback instruction. Optimise for the shortest path to a working increment. If any step requires a decision, present options with trade-offs in a table.",
    inputs: goal(),
    outputs: [MD, CHK],
    examples: [
      "'Add a payment system' → produce a plan covering Stripe integration, webhook handling, idempotency, and failure recovery.",
      "'Migrate database' → schema diff, data migration script, rollback query, and read-only mode during cutover.",
    ],
    metadata: { ...LR, tags: ["planning", "decomposition", "risk-management"] },
  },
  {
    slug: "adapter-smith",
    name: "Adapter Smith",
    category: "Integration",
    description: "Converts any skill definition between agent runtime formats — Claude markdown, Hermes manifest, OpenAI tool descriptors, Cursor rules, LangChain registry, or MCP resources. Preserves the semantic contract across all formats.",
    triggerPhrase: "Call this when you need to move a skill to a different agent system, or to produce a cross-platform export of the entire catalog.",
    promptTemplate: "Identify the source skill format and the target runtime. Map each field: slug → file name, trigger → tool description, inputs → parameter schema, outputs → response contract, examples → usage hints. Preserve all risk markers and model-agnostic guarantees. If the target format lacks a field, embed it in a comment or description field. Output the complete adapter payload.",
    inputs: [
      ...goal(),
      { name: "targetRuntime", kind: "selection" as const, required: true, description: "claude, hermes, openai, langchain, cursor, mcp or generic." },
    ],
    outputs: [JSON, CMD],
    examples: [
      "Convert all 529 skills from Claude markdown to Hermes manifest format.",
      "Export the 'intent-router' skill as an OpenAI function tool descriptor.",
    ],
    metadata: { ...LR, tags: ["adapter", "converter", "cross-platform"] },
  },
  {
    slug: "api-contract-smith",
    name: "API Contract Smith",
    category: "Integration",
    description: "Designs a minimal, secure API contract for integrating an external service or internal endpoint. Specifies authentication, error contracts, rate limits, idempotency, and a proxy route for server-side secret handling.",
    triggerPhrase: "Call this when integrating a new API, designing a service boundary, or refactoring an existing endpoint contract.",
    promptTemplate: "Document the service purpose and authentication mechanism. List all endpoints with request and response shapes. For each endpoint: define success/error response codes, pagination (if any), rate limit headers, and idempotency key. Mandate that all secrets live in environment variables accessible only server-side. Produce a minimal Express/Next.js route that proxies the external API while stripping secrets from client payloads.",
    inputs: [
      ...goal(),
      { name: "apiDocs", kind: "url" as const, required: false, description: "API documentation or reference link, if available." },
    ],
    outputs: [JSON, CHK],
    examples: [
      "Design a Stripe payment proxy: /api/checkout creates a session, /api/webhook verifies signature, /api/portal generates customer portal link.",
      "Contract for a weather service: single GET endpoint, API key in Authorization header, 1000 req/day limit, 429 response on overage.",
    ],
    metadata: { ...MR, tags: ["api", "contract", "integration", "proxy"] },
  },
  {
    slug: "codebase-navigator",
    name: "Codebase Navigator",
    category: "Engineering",
    description: "Scans a repository to identify the files relevant to a given goal, maps dependency relationships, and produces a minimal-change plan. Reduces the risk of unintended side-effects by flagging shared modules.",
    triggerPhrase: "Call this before writing any code in an unfamiliar repository or before modifying a system you have not fully explored.",
    promptTemplate: "List the project's top-level directory structure. For each directory, summarise its purpose based on file names and imports. Identify the files most likely related to the user's goal. Map their import/export dependencies. Highlight potential side-effect files (shared utilities, common types, global config). Produce a minimal set of files to modify, ordered by dependency. Flag any files that are safe to edit versus those that need cautious amendment.",
    inputs: [
      ...goal(),
      { name: "fileMap", kind: "json" as const, required: false, description: "Directory tree or search results from repository exploration." },
    ],
    outputs: [MD, CHK],
    examples: [
      "In a Next.js monorepo with shared ui-library, identify the specific page, layout, component, and API route that need changes for a new settings page.",
      "In a Python monorepo with multiple services, trace the import chain from a CLI entry point to the database layer.",
    ],
    metadata: { ...LR, tags: ["exploration", "impact-analysis", "repo-mapping"] },
  },
  {
    slug: "implementation-sprint",
    name: "Implementation Sprint",
    category: "Engineering",
    description: "Turns a plan into small, independently verifiable code patches. Each patch includes a clear purpose, file list, expected behaviour change, and a validation command. Dependencies are resolved first; UI and polish come last.",
    triggerPhrase: "Call this after a plan is approved and you are ready to start writing or editing code.",
    promptTemplate: "Divide the approved plan into patches of no more than 3 files each. For each patch: state the purpose, list the files, describe the expected behavioural change, and provide a verification command (lint, type-check, unit-test, or manual curl). Order patches by dependency: foundation first (types, schema), then logic (services, hooks), then binding (API, state), then presentation (UI), then polish (styles, comments). After each patch, run its verification command before proceeding.",
    inputs: goal(),
    outputs: [MD, CHK],
    examples: [
      "Patch 1: define Prisma/Drizzle schema for 'team' table → run 'npx drizzle-kit push'. Patch 2: create CRUD API routes for teams → run 'curl each endpoint'. Patch 3: build team management UI → run 'npm run build'.",
      "Patch 1: add TypeScript types for new feature flag. Patch 2: implement feature flag service with tests. Patch 3: integrate flag into existing UI component.",
    ],
    metadata: { ...MR, tags: ["implementation", "patch", "incremental"] },
  },
  {
    slug: "memory-compressor",
    name: "Memory Compressor",
    category: "Context",
    description: "Condenses a long agent session or conversation into a compact, lossless summary that preserves all decisions, code changes, risks, and next steps. Designed for handover between agents or sessions.",
    triggerPhrase: "Call this when a session is becoming too long for the context window, when handing off to another agent, or when the user asks for a session summary.",
    promptTemplate: "Scan the conversation chronologically. Extract: (1) decisions made and their rationale, (2) files created or modified (with diff summary), (3) open risks or unresolved questions, (4) verification commands run and their results, (5) explicit next steps. Format as a structured markdown document with headings. Omit chitchat, speculation, and redundant exploration. Preserve all exact file paths, function names, and command invocations.",
    inputs: [
      ...goal(),
      { name: "transcript", kind: "text" as const, required: true, description: "The full conversation or session log to compress." },
    ],
    outputs: [MD],
    examples: [
      "Compress a 2-hour debugging session into a single-page handoff note for the next engineer.",
      "Summarise a multi-step refactor: original architecture, changes made, remaining work, and three test commands to validate the refactor.",
    ],
    metadata: { ...LR, tags: ["memory", "compression", "handoff"] },
  },
  {
    slug: "verification-runner",
    name: "Verification Runner",
    category: "Quality",
    description: "Defines and executes a standard post-change verification sequence: type-check → lint → unit tests → build → smoke tests. Adjusts rigour based on change risk level.",
    triggerPhrase: "Call this after completing any code change to confirm nothing is broken.",
    promptTemplate: "Assess the change risk: low (comments, config, docs), medium (new function, refactor within a file), high (schema change, dependency upgrade, public API change). Based on risk, select verification steps from: (1) type-check, (2) lint, (3) affected unit tests, (4) full test suite, (5) build, (6) smoke test (curl endpoints, load page). For each step provide the exact command, expected outcome, and where to look on failure. Execute the sequence and report pass/fail per step.",
    inputs: goal(),
    outputs: [CMD, CHK],
    examples: [
      "Low-risk (documentation update): run 'npm run lint' and 'npm run build'. Medium-risk (new API endpoint): run 'npm run typecheck', test new endpoint with curl, run 'npm run build'. High-risk (schema migration): run all steps plus 'drizzle-kit push' and a rollback test.",
    ],
    metadata: { ...LR, tags: ["verification", "quality", "ci-simulation"] },
  },
  {
    slug: "incident-debugger",
    name: "Incident Debugger",
    category: "Quality",
    description: "Systematically isolates the root cause of a failure by separating symptoms from causes, generating minimal hypotheses, and testing them one at a time with minimal code changes.",
    triggerPhrase: "Call this when a build fails, a test fails, an API returns an unexpected status, or a runtime error occurs.",
    promptTemplate: "Read the error output. Identify the first concrete error line (file, line number, and error code). Separate the symptom (what the user sees) from the root cause (the underlying code or configuration issue). Generate up to three minimal-fix hypotheses, ordered by likelihood. For each hypothesis, write a single verification command (type-check a specific file, curl a single endpoint, run one test). Execute hypotheses one at a time. After finding the fix, run the full verification-runner sequence.",
    inputs: [
      ...goal(),
      { name: "log", kind: "text" as const, required: true, description: "Error log, stack trace, or failure description." },
    ],
    outputs: [MD, CHK],
    examples: [
      "Build error: 'Module not found: ./Button' → hypothesis 1: file renamed, verify with 'ls src/components/Button*'. Hypothesis 2: import path case mismatch, verify with 'grep -r \"Button\" src/'.",
      "API returns 500: check application logs → hypothesis 1: database connection pool exhausted, verify with 'db pool status'. Hypothesis 2: unhandled promise rejection, verify with 'node --trace-warnings'.",
    ],
    metadata: { ...MR, tags: ["debugging", "root-cause", "triage"] },
  },
];

/* ================================================================== */
/*  FULLY ORIGINAL DOMAIN × WORKFLOW CATALOG                          */
/*  Written from scratch — no external inspiration sources.            */
/* ================================================================== */
type DomainSpec = {
  slug: string;
  label: string;
  commonFailurePattern: string;
  bestPracticeHint: string;
  typicalOutput: string;
  tags: string[];
  typicalStackCommand: string;
};

type WorkflowSpec = {
  slug: string;
  title: string;
  action: string;
  risk: typeof LR | typeof MR | typeof HR;
  outputSet: SkillOutput[];
  tagBase: string;
};

const DOMAINS: DomainSpec[] = [
  { slug: "react-state", label: "React State Management", commonFailurePattern: "Stale closures or unnecessary re-renders caused by missing dependency arrays or incorrect state initialisation.", bestPracticeHint: "Co-locate state as close to the consuming component as possible. Lift state only when two or more siblings need to share it.", typicalOutput: "useState / useReducer / useContext hook refactor, zustand or jotai store slice", tags: ["react", "state", "frontend"], typicalStackCommand: "React DevTools profiler + why-did-you-render" },
  { slug: "react-server-components", label: "React Server Components", commonFailurePattern: "Accidentally making a server component a client component by using hooks or event handlers in the wrong file.", bestPracticeHint: "Keep data fetching and heavy logic in server components; pass results as props to client islands.", typicalOutput: "server component / client boundary refactor / streaming fallback", tags: ["react", "rsc", "frontend"], typicalStackCommand: "next build --debug + React Server Components lint rule" },
  { slug: "css-layout", label: "CSS Layout & Responsiveness", commonFailurePattern: "Over-reliance on media queries when container queries or flex/grid intrinsic sizing would be simpler and more maintainable.", bestPracticeHint: "Design for the content, not the viewport. Use clamp(), minmax(), and auto-fit/auto-fill before reaching for breakpoints.", typicalOutput: "CSS layout refactor / responsive grid / container query implementation", tags: ["css", "layout", "frontend"], typicalStackCommand: "Lighthouse mobile emulation + browser DevTools responsive mode" },
  { slug: "typescript-generics", label: "TypeScript Generics & Advanced Types", commonFailurePattern: "Generic constraints that are too loose (accepting anything) or too tight (requiring exact shapes when interfaces would suffice).", bestPracticeHint: "Prefer generic constraints that describe the minimum required structure (extends) rather than listing every possible property.", typicalOutput: "generic type / conditional type / mapped type / branded type", tags: ["typescript", "generics", "type-system"], typicalStackCommand: "tsc --noEmit --strict + type tests with expect-type" },
  { slug: "nextjs-data-fetching", label: "Next.js Data Fetching Patterns", commonFailurePattern: "Fetching the same data in multiple server components or mixing server fetch with client fetch leading to duplicate network requests.", bestPracticeHint: "Use server components for initial data fetch and pass down as props. Use React.cache() to deduplicate fetches across parallel routes.", typicalOutput: "server fetch / React cache wrapper / streaming suspense boundary", tags: ["nextjs", "data-fetching", "fullstack"], typicalStackCommand: "next build --debug + React DevTools fetch profiling" },
  { slug: "nextjs-middleware", label: "Next.js Middleware & Edge Runtime", commonFailurePattern: "Using Node.js APIs (fs, crypto, database drivers) inside Edge Middleware, causing runtime crashes.", bestPracticeHint: "Keep middleware stateless and light. Use it only for redirects, rewrites, header manipulation, and basic auth checks.", typicalOutput: "middleware.ts / rewrite rule / cookie-based redirect / geolocation routing", tags: ["nextjs", "middleware", "edge"], typicalStackCommand: "next dev + curl --cookie tests + edge runtime log inspection" },
  { slug: "nextjs-api-routes", label: "Next.js API Routes & Route Handlers", commonFailurePattern: "Exposing server-side secrets to the client by accidentally importing environment variables in a 'use client' component.", bestPracticeHint: "All sensitive operations (DB queries, external API calls with keys) belong in API routes or server actions, never in client components.", typicalOutput: "route.ts handler / server action / API client wrapper / error boundary", tags: ["nextjs", "api", "backend"], typicalStackCommand: "curl --verbose + API route error log + status code audit" },
  { slug: "node-error-handling", label: "Node.js Error Handling & Resilience", commonFailurePattern: "Unhandled promise rejections crashing the process, or try-catch blocks that swallow errors without logging context.", bestPracticeHint: "Use a global error handler for uncaught exceptions and unhandled rejections. Wrap every async route handler in a higher-order catch function.", typicalOutput: "global error handler / async wrapper / structured error response / retry logic", tags: ["node", "error-handling", "backend"], typicalStackCommand: "node --unhandled-rejections=strict + process.on('uncaughtException') log" },
  { slug: "node-streams", label: "Node.js Streams & Backpressure", commonFailurePattern: "Reading entire files into memory instead of streaming, or ignoring backpressure signals from writable streams.", bestPracticeHint: "Use pipeline() instead of pipe() because pipeline automatically handles backpressure and destroys streams on error.", typicalOutput: "Readable/Writable stream / Transform / pipeline() refactor", tags: ["node", "streams", "performance"], typicalStackCommand: "Node.js --inspect memory heap snapshot + stream highWaterMark tuning" },
  { slug: "python-file-io", label: "Python File I/O & Encoding", commonFailurePattern: "Opening binary files in text mode or assuming UTF-8 encoding, leading to UnicodeDecodeError on non-ASCII content.", bestPracticeHint: "Always specify encoding explicitly when opening text files. Use pathlib.Path.read_text/write_bytes for cleaner code.", typicalOutput: "pathlib refactor / encoding-safe file reader / batch file processor", tags: ["python", "file-io", "scripting"], typicalStackCommand: "python3 -c with open() + chardet encoding detection" },
  { slug: "python-async", label: "Python Async/Await Patterns", commonFailurePattern: "Blocking the event loop by using synchronous requests or time.sleep inside async functions.", bestPracticeHint: "Use httpx.AsyncClient for HTTP calls and asyncio.sleep for delays inside async functions. Never mix sync and async I/O in the same function.", typicalOutput: "async/await refactor / asyncio.gather / async context manager", tags: ["python", "async", "performance"], typicalStackCommand: "python3 -m asyncio + aiohttp/httpx async benchmark" },
  { slug: "fastapi-dependencies", label: "FastAPI Dependency Injection", commonFailurePattern: "Re-initialising the same database connection or HTTP client inside every route instead of using FastAPI's dependency injection.", bestPracticeHint: "Define shared resources (DB pool, HTTP client) as lifespan-managed dependencies and inject them via Depends().", typicalOutput: "dependency / lifespan handler / override for testing", tags: ["fastapi", "dependencies", "api"], typicalStackCommand: "uvicorn --reload + /docs interactive test + dependency graph visualisation" },
  { slug: "sql-query-optimization", label: "SQL Query Optimisation", commonFailurePattern: "Using SELECT * in production queries and missing indexes on foreign key columns used in JOINs.", bestPracticeHint: "Always select only the columns you need. Add composite indexes that match your WHERE + ORDER BY clauses exactly.", typicalOutput: "indexed query / composite index / EXPLAIN ANALYSE plan / partial index", tags: ["sql", "optimization", "database"], typicalStackCommand: "EXPLAIN (ANALYSE, BUFFERS) + pg_stat_user_indexes + missing index query" },
  { slug: "drizzle-schema-design", label: "Drizzle Schema Design", commonFailurePattern: "Over-using relations() when simple foreign key columns with manual joins would be clearer and faster.", bestPracticeHint: "Define relations only for eagerly loaded nested data. For simple lookups, just reference the foreign key column directly.", typicalOutput: "schema.ts / relation map / migration SQL / Drizzle query builder", tags: ["drizzle", "schema", "database"], typicalStackCommand: "drizzle-kit push + drizzle-kit studio + generated SQL audit" },
  { slug: "supabase-rls", label: "Supabase Row-Level Security", commonFailurePattern: "RLS policies that are too permissive (using 'true' instead of 'auth.uid() = user_id') accidentally exposing other users' data.", bestPracticeHint: "Always reference auth.uid() in RLS policies. Test policies with a non-admin user before deploying to production.", typicalOutput: "RLS policy / policy test / security definer function / admin bypass", tags: ["supabase", "rls", "security"], typicalStackCommand: "supabase db check + supabase db test + RLS policy review with pg_policies" },
  { slug: "convex-functions", label: "Convex Functions & Mutations", commonFailurePattern: "Accidentally creating OCC (Optimistic Concurrency Control) conflicts by reading and writing the same document in rapid succession from multiple clients.", bestPracticeHint: "Use patch() for partial updates and batch mutations for atomic multi-document writes. Avoid reading a document before immediately writing it back.", typicalOutput: "mutation / query / action / component / scheduler job", tags: ["convex", "realtime", "backend"], typicalStackCommand: "npx convex dev + dashboard OCC conflict log + custom retry logic" },
  { slug: "redis-caching", label: "Redis Caching Strategies", commonFailurePattern: "Cache stampede: multiple requests simultaneously recomputing an expired cache entry because they all detected expiry at the same time.", bestPracticeHint: "Use a mutex lock around cache regeneration, or stale-while-revalidate pattern to serve stale data while the new value is being computed.", typicalOutput: "cache wrapper / mutex lock / stale-while-revalidate / TTL policy", tags: ["redis", "caching", "performance"], typicalStackCommand: "redis-cli --stat + cache hit ratio monitoring + slow log" },
  { slug: "message-queues", label: "Message Queues & Background Jobs", commonFailurePattern: "Losing messages when a worker crashes before acknowledging completion, because auto-ack is enabled.", bestPracticeHint: "Disable auto-ack. Acknowledge only after the job has been fully processed and its result has been persisted.", typicalOutput: "queue producer / worker / dead-letter handler / retry policy", tags: ["queue", "background-jobs", "backend"], typicalStackCommand: "Bull/BullMQ dashboard + job retry count monitoring + dead-letter inspection" },
  { slug: "docker-multistage", label: "Docker Multi-Stage Builds", commonFailurePattern: "Including the entire node_modules and build toolchain in the final production image, making it unnecessarily large and insecure.", bestPracticeHint: "Use at least two stages: one for installing dev dependencies and building, another for copying only the production artefacts and running the app.", typicalOutput: "multi-stage Dockerfile / .dockerignore / slim base image switch", tags: ["docker", "build", "devops"], typicalStackCommand: "docker build + docker scout + dive layer analysis" },
  { slug: "docker-compose-networking", label: "Docker Compose Networking", commonFailurePattern: "Services unable to reach each other because they are on different Docker networks, or using 'localhost' instead of the service name.", bestPracticeHint: "All services in the same docker-compose.yml are on a shared network by default. Reference other services by their service name, not 'localhost'.", typicalOutput: "docker-compose.yml / network config / healthcheck / depends_on condition", tags: ["docker", "networking", "devops"], typicalStackCommand: "docker compose up --wait + docker network inspect + container logs" },
  { slug: "kubernetes-pod-lifecycle", label: "Kubernetes Pod Lifecycle", commonFailurePattern: "Pods stuck in CrashLoopBackOff because the application exits when a dependency (database, cache) is not yet ready.", bestPracticeHint: "Implement a startup probe with a longer initial delay and a readiness probe that checks actual dependency health, not just TCP connectivity.", typicalOutput: "deployment.yaml / startup probe / readiness probe / liveness probe / init container", tags: ["kubernetes", "pods", "devops"], typicalStackCommand: "kubectl describe pod + kubectl logs --previous + kubectl get events --sort-by='.lastTimestamp'" },
  { slug: "kubernetes-hpa", label: "Kubernetes Horizontal Pod Autoscaling", commonFailurePattern: "HPA not scaling because metrics-server is not installed, or because resource requests/limits are not set on the target deployment.", bestPracticeHint: "Always set CPU/memory requests on every container. HPA cannot scale based on resource metrics without requests defined.", typicalOutput: "HPA manifest / custom metric / vertical pod autoscaler / cluster autoscaler config", tags: ["kubernetes", "autoscaling", "devops"], typicalStackCommand: "kubectl get hpa --watch + kubectl top pods + metrics-server logs" },
  { slug: "terraform-state", label: "Terraform State Management", commonFailurePattern: "Losing the .tfstate file (or it becoming corrupted), forcing manual reconstruction of the entire infrastructure.", bestPracticeHint: "Always store state in a remote backend (S3, Azure Storage, Terraform Cloud) with state locking enabled via DynamoDB or equivalent.", typicalOutput: "backend config / state migration plan / state locking config / remote state datasource", tags: ["terraform", "state", "iac"], typicalStackCommand: "terraform plan + terraform state list + terraform state pull | jq" },
  { slug: "github-actions-pipeline", label: "GitHub Actions Pipeline Optimisation", commonFailurePattern: "Long CI times caused by not caching dependencies between runs, or running the full test suite on every push regardless of change scope.", bestPracticeHint: "Cache node_modules (or other dependency folders) using actions/cache with a hash of the lock file. Use paths filter to run only relevant jobs.", typicalOutput: "workflow YAML / cache config / matrix build / conditional job execution", tags: ["github-actions", "ci", "devops"], typicalStackCommand: "act --job test + cache hit/miss analysis + workflow graph visualisation" },
  { slug: "aws-lambda-cold-start", label: "AWS Lambda Cold Starts", commonFailurePattern: "Cold starts lasting multiple seconds because the function loads heavy dependencies or initialises database connections outside the handler.", bestPracticeHint: "Move initialisation (DB connections, config loading) outside the handler. Use Lambda SnapStart for Java or .NET. Consider Provisioned Concurrency for latency-sensitive functions.", typicalOutput: "handler refactor / SnapStart config / Provisioned Concurrency / warmer function", tags: ["aws", "lambda", "performance"], typicalStackCommand: "AWS X-Ray trace + Lambda Insights + cold start dashboard" },
  { slug: "azure-bicep", label: "Azure Bicep Infrastructure", commonFailurePattern: "Manually creating resources in the portal without infrastructure-as-code, making environments inconsistent and hard to reproduce.", bestPracticeHint: "Always define Azure resources in Bicep or Terraform. Use parameters and modules to keep the code DRY and environment-agnostic.", typicalOutput: "main.bicep / module / parameter file / azd template", tags: ["azure", "bicep", "iac"], typicalStackCommand: "az deployment group validate + az what-if + bicep build" },
  { slug: "vercel-env-vars", label: "Vercel Environment Variables", commonFailurePattern: "Accidentally exposing preview URLs or internal API keys by adding them as preview environment variables that get picked up by branch deployments.", bestPracticeHint: "Use separate environment groups for production, preview, and development. Never mark sensitive keys as 'available to all branches'.", typicalOutput: "vercel.json env group / preview env config / Edge Config / KV store", tags: ["vercel", "env", "deployment"], typicalStackCommand: "vercel env pull + vercel list + project settings audit" },
  { slug: "openapi-spec", label: "OpenAPI Specification & Validation", commonFailurePattern: "Generating an OpenAPI spec that is out of sync with the actual implementation because the spec is maintained manually instead of generated from code.", bestPracticeHint: "Use code-first OpenAPI generation (FastAPI, NestJS swagger, or express-openapi) so the spec always reflects the actual routes.", typicalOutput: "openapi.yaml / code-first generator / request/response validation middleware", tags: ["openapi", "api", "contract"], typicalStackCommand: "redocly lint + openapi-diff + swagger-ui preview" },
  { slug: "oauth-flows", label: "OAuth 2.0 Flows & Token Management", commonFailurePattern: "Storing access tokens in localStorage, making them accessible to XSS attacks, and not implementing refresh token rotation.", bestPracticeHint: "Store tokens in an httpOnly cookie set by the server, not in client-side storage. Implement refresh token rotation and revoke old refresh tokens after use.", typicalOutput: "OAuth callback / token refresh / PKCE flow / httpOnly cookie handler", tags: ["oauth", "auth", "security"], typicalStackCommand: "oauth2_proxy + jwt.io debugger + curl --cookie with token inspection" },
  { slug: "stripe-webhook-idempotency", label: "Stripe Webhook Idempotency", commonFailurePattern: "Processing the same Stripe webhook event twice because Stripe sends at-least-once delivery, causing duplicate charges or duplicate subscription activations.", bestPracticeHint: "Use the Stripe-Idempotency-Key or the event ID as a unique constraint in your database to skip already-processed events.", typicalOutput: "Webhook handler / idempotency key check / event deduplication / failed payment recovery", tags: ["stripe", "webhook", "payments"], typicalStackCommand: "stripe trigger payment_intent.succeeded + stripe logs tail + database dedup check" },
  { slug: "browser-devtools", label: "Browser DevTools & Debugging", commonFailurePattern: "Trying to debug frontend issues by guessing instead of using the Elements, Console, Network, and Sources panels systematically.", bestPracticeHint: "Start with the Network panel to confirm the request/response are correct, then use Sources to set breakpoints, then Elements to inspect the DOM.", typicalOutput: "debugging workflow / breakpoint guide / performance recording / memory snapshot", tags: ["browser", "debugging", "devtools"], typicalStackCommand: "Chrome DevTools performance recording + memory heap snapshot + network throttle" },
  { slug: "playwright-selectors", label: "Playwright Selectors & Locators", commonFailurePattern: "Using fragile CSS selectors (nth-child, class names that change) that break on every UI update.", bestPracticeHint: "Use getByRole, getByText, or getByTestId with semantic naming. These are resilient to CSS and DOM structure changes.", typicalOutput: "locator refactor / test fixture / POM (Page Object Model) / custom fixture", tags: ["playwright", "testing", "e2e"], typicalStackCommand: "playwright test --reporter=html + playwright codegen + trace viewer" },
  { slug: "web-scraping-ethics", label: "Web Scraping Ethics & Compliance", commonFailurePattern: "Scraping a website that explicitly prohibits it in robots.txt or terms of service, leading to legal or IP blocking issues.", bestPracticeHint: "Always check robots.txt and terms of service before scraping. Respect Crawl-Delay directives and set a reasonable User-Agent with contact information.", typicalOutput: "robots.txt check / polite scraper / rate-limited crawler / cached scraper", tags: ["scraping", "ethics", "research"], typicalStackCommand: "curl robots.txt + wget --wait + scraper log audit" },
  { slug: "data-warehouse-schema", label: "Data Warehouse Schema Design", commonFailurePattern: "Using a highly normalised OLTP schema (3NF) directly in a data warehouse, causing complex JOINs and slow analytical queries.", bestPracticeHint: "Use a star schema (one fact table, multiple dimension tables) or a wide-column denormalised table for analytical queries. Pre-join at loading time.", typicalOutput: "star schema / fact table / dimension table / ETL pipeline spec", tags: ["data", "warehouse", "schema"], typicalStackCommand: "dbt run + dbt test + query profiling with warehouse-native tools" },
  { slug: "analytics-metric-definition", label: "Analytics Metric Definitions", commonFailurePattern: "Different teams computing the same metric (e.g., 'daily active users') with different SQL logic, producing conflicting numbers.", bestPracticeHint: "Define every metric in a central repository as a dbt model or LookML view with a single source of truth, and document its logic explicitly.", typicalOutput: "metric definition / dbt model / SQL logic / dashboard tile / documentation", tags: ["analytics", "metrics", "data"], typicalStackCommand: "dbt docs generate + dbt test --select tag:metrics + metric comparison script" },
  { slug: "rag-chunking", label: "RAG Chunking Strategies", commonFailurePattern: "Using fixed-size chunking (500 characters) that splits sentences or code blocks in half, reducing retrieval quality.", bestPracticeHint: "Use semantic chunking: split on paragraph boundaries, markdown headings, or code function boundaries. Overlap adjacent chunks by 10-20% to avoid missing context near boundaries.", typicalOutput: "semantic chunker / chunk overlap config / hybrid retriever / chunk metadata enrichment", tags: ["rag", "chunking", "retrieval"], typicalStackCommand: "retrieval evaluation script + chunk boundary visualisation + recall@k measurement" },
  { slug: "mcp-tool-design", label: "MCP Tool Design & Best Practices", commonFailurePattern: "Designing MCP tool names that are too generic ('search', 'get_data') causing ambiguity when multiple tools are available to the agent.", bestPracticeHint: "Prefix tool names with a namespace that reflects their domain (e.g., 'github_search_repos', 'jira_get_issue'). Always provide a detailed description of when to use each tool.", typicalOutput: "MCP tool descriptor / resource definition / prompt template / server metadata", tags: ["mcp", "tools", "agents"], typicalStackCommand: "mcp-cli run + mcp inspector + tool name conflict analysis" },
  { slug: "prompt-injection-defense", label: "Prompt Injection Defense", commonFailurePattern: "Building a system prompt that includes user input directly without isolation, allowing users to override instructions by saying 'ignore previous instructions'.", bestPracticeHint: "Isolate user input in a delimited section, use a separate 'input' variable, and add explicit guardrails that reject instruction override attempts.", typicalOutput: "defensive system prompt / input sanitizer / instruction guardrail / output validator", tags: ["prompt", "security", "llm"], typicalStackCommand: "prompt injection test suite + adversarial input fuzzing + output scanner" },
  { slug: "agent-tool-binding", label: "Agent Tool Binding & Dispatch", commonFailurePattern: "Giving the agent too many tools at once, causing it to spend more time choosing than executing, and increasing token usage significantly.", bestPracticeHint: "Group tools by domain and offer a 'router' tool first. The agent picks a domain, then that domain's tools are injected. This reduces the tool set per step.", typicalOutput: "router tool / domain group / dynamic tool injection / tool usage statistics", tags: ["agents", "tool-binding", "orchestration"], typicalStackCommand: "agent trace log + tool invocation frequency analysis + token cost audit" },
  { slug: "design-token-system", label: "Design Token Systems", commonFailurePattern: "Hardcoding colors, spacing, or typography values in components instead of referencing design tokens, making theming impossible without changing every file.", bestPracticeHint: "Define all visual primitives as CSS custom properties or JSON tokens. Reference them in components via token names, not literal values.", typicalOutput: "token JSON / CSS custom properties / theme switcher / token documentation", tags: ["design", "tokens", "components"], typicalStackCommand: "style-dictionary build + Storybook token viewer + token value comparison" },
  { slug: "a11y-aria-patterns", label: "Accessibility ARIA Patterns", commonFailurePattern: "Adding ARIA attributes that conflict with native HTML semantics (e.g., role='button' on a <button> element), confusing screen readers.", bestPracticeHint: "Use native HTML elements whenever possible. Only use ARIA to supplement missing semantics, never to override existing ones. Test with a real screen reader.", typicalOutput: "ARIA attribute refactor / keyboard navigation / focus management / screen reader test script", tags: ["accessibility", "aria", "testing"], typicalStackCommand: "axe-core + WAVE tool + VoiceOver/NVDA manual test + keyboard-only audit" },
  { slug: "web-vitals-optimization", label: "Web Vitals Optimisation (LCP/CLS/INP)", commonFailurePattern: "Large LCP caused by a hero image that is larger than needed and not optimised (WebP, lazy loading, proper dimensions).", bestPracticeHint: "Serve images in WebP/AVIF format, specify width and height to reserve space (prevent CLS), and lazy-load below-the-fold images. Use next/image for automatic optimisation.", typicalOutput: "image optimisation / font display swap / critical CSS / lazy load / bundle analysis", tags: ["performance", "web-vitals", "optimisation"], typicalStackCommand: "Lighthouse CI + WebPageTest filmstrip + Core Web Vitals Chrome extension" },
  { slug: "jest-test-optimization", label: "Jest Test Optimisation", commonFailurePattern: "Running the entire test suite on every change, taking minutes even for small incremental code changes.", bestPracticeHint: "Use jest --changedSince to run only tests related to changed files. Use jest --onlyChanged during development to get instant feedback.", typicalOutput: "jest config optimisation / --changedSince / --onlyChanged / test sharding / module mocking", tags: ["jest", "testing", "optimisation"], typicalStackCommand: "jest --changedSince=main --json + jest --onlyChanged + jest-coverage threshold check" },
  { slug: "code-review-checklist", label: "Code Review Checklist", commonFailurePattern: "Reviewers focusing only on code style and missing architectural issues like missing error handling, security vulnerabilities, or performance regressions.", bestPracticeHint: "Use a structured review checklist: correctness, security, performance, test coverage, error handling, and code style — in that order.", typicalOutput: "review checklist / automated review comment / risk classification / diff summary", tags: ["code-review", "quality", "checklist"], typicalStackCommand: "git diff --stat + lint-staged + danger.js automated review + commitlint" },
  { slug: "git-conflict-resolution", label: "Git Conflict Resolution", commonFailurePattern: "Resolving merge conflicts by blindly accepting one side without understanding why the change was made, potentially reintroducing bugs.", bestPracticeHint: "For each conflicted section, trace the origin of both changes using 'git log --oneline' on the file. Understand the intent before picking a resolution.", typicalOutput: "conflict resolution plan / cherry-pick strategy / rebase workflow / merge commit message", tags: ["git", "conflicts", "workflow"], typicalStackCommand: "git log --oneline -5 -- <file> + git diff HEAD...MERGE_HEAD + git rerere" },
  { slug: "adr-documentation", label: "Architecture Decision Records", commonFailurePattern: "Making important architectural decisions without documenting the context, alternatives, and rationale, leaving future team members confused about why something was done.", bestPracticeHint: "Write an ADR for every non-trivial decision. Include the context, considered alternatives (with pros/cons of each), the chosen option, and the consequences.", typicalOutput: "ADR document / decision log / template / review workflow", tags: ["documentation", "adr", "architecture"], typicalStackCommand: "adr-tools list + adr-tools generate + decision log index page" },
  { slug: "user-onboarding-flow", label: "User Onboarding Flow Design", commonFailurePattern: "Showing the user a long tutorial or feature list on first login, overwhelming them and causing the majority to leave before experiencing core value.", bestPracticeHint: "Use progressive disclosure: only introduce features when the user reaches the point where they need them. A 3-step wizard that gets them to the 'aha moment' in under 60 seconds is ideal.", typicalOutput: "onboarding wizard / feature checklist / in-app guide / first-run experience spec", tags: ["ux", "onboarding", "product"], typicalStackCommand: "analytics funnel analysis + onboarding completion rate + drop-off heatmap" },
  { slug: "a-b-testing-framework", label: "A/B Testing Framework", commonFailurePattern: "Running A/B tests with sample sizes too small to reach statistical significance, leading to decisions based on noise.", bestPracticeHint: "Use an online sample size calculator before starting the test. Define the minimum detectable effect and ensure the test runs for at least one full business cycle.", typicalOutput: "experiment spec / variant assignment / metric definition / statistical analysis script", tags: ["ab-testing", "experiments", "product"], typicalStackCommand: "statsmodels sample size calculation + Bayesian A/B test + sequential testing" },
  { slug: "csv-data-cleaning", label: "CSV Data Cleaning Pipeline", commonFailurePattern: "Assuming CSV values are clean and consistent, then hitting parsing errors or silent data corruption when encountering commas inside quoted fields, missing headers, or inconsistent newlines.", bestPracticeHint: "Always use a proper CSV parser (Python's csv module, Papa Parse in JS) instead of splitting on commas. Validate column count and types for every row.", typicalOutput: "CSV parser / row validator / column type mapper / error report / cleaned output", tags: ["data", "csv", "pipeline"], typicalStackCommand: "python3 -c csv.DictReader + validation script + row count diff" },
  { slug: "cli-tool-design", label: "CLI Tool Design Patterns", commonFailurePattern: "Building CLI tools that print output without usable exit codes (always exits 0) or swallow error messages, making them impossible to script with.", bestPracticeHint: "Always exit 0 on success, non-zero on failure. Print errors to stderr, output to stdout. Support --json flag for machine-readable output.", typicalOutput: "CLI scaffolding / argument parser / exit code handler / --json output mode", tags: ["cli", "devtools", "scripting"], typicalStackCommand: "echo $? after CLI run + stderr redirection test + --json output validation" },
  { slug: "cron-job-reliability", label: "Cron Job & Scheduled Task Reliability", commonFailurePattern: "Cron jobs failing silently because output is not logged, or running the same job multiple times when the system is down at the scheduled time.", bestPracticeHint: "Redirect cron output to a log file with timestamp. Use || to send failure alerts. Implement job idempotency so running it multiple times has no side effects.", typicalOutput: "crontab entry / log rotation / idempotency guard / failure alert integration", tags: ["cron", "scheduling", "reliability"], typicalStackCommand: "tail -f /var/log/cron + systemctl status cron + idempotency test script" },
  { slug: "rest-pagination", label: "REST Pagination Design", commonFailurePattern: "Using offset-based pagination with large offsets ('?offset=10000') that causes slow database queries because the DB has to scan and skip many rows.", bestPracticeHint: "Use cursor-based pagination (keyset pagination) for large datasets. The cursor is an opaque token that points to the last item, and the DB query uses WHERE > cursor_value.", typicalOutput: "cursor pagination / offset pagination fallback / total count optimisation / response envelope", tags: ["rest", "pagination", "api"], typicalStackCommand: "curl with cursor param + SQL EXPLAIN for offset vs keyset + performance benchmark" },
  { slug: "websocket-reconnection", label: "WebSocket Reconnection Strategies", commonFailurePattern: "Losing real-time updates when the WebSocket disconnects temporarily, and not attempting to reconnect, leaving the UI in a stale state.", bestPracticeHint: "Implement exponential backoff reconnection with a maximum delay of 30 seconds. Show a connection status indicator in the UI.", typicalOutput: "WebSocket client / reconnection logic / heartbeat / connection status component", tags: ["websocket", "realtime", "frontend"], typicalStackCommand: "Browser DevTools Network tab WS filter + reconnection test with server restart" },
  { slug: "rate-limiting-proxy", label: "Rate Limiting & API Gateway Proxy", commonFailurePattern: "Applying rate limiting at the application level without a proxy layer, so rate-limited requests still consume application server resources.", bestPracticeHint: "Enforce rate limits at the reverse proxy level (NGINX, Cloudflare, API Gateway) before the request reaches your application server.", typicalOutput: "NGINX rate limit config / Cloudflare WAF rule / API Gateway usage plan / token bucket implementation", tags: ["rate-limiting", "proxy", "security"], typicalStackCommand: "ab -n 1000 -c 10 + nginx error log + 429 response code monitoring" },
  { slug: "feature-flags", label: "Feature Flags & Gradual Rollouts", commonFailurePattern: "Leaving feature flag code in the codebase permanently, making the codebase harder to read and maintain, and never removing old flags.", bestPracticeHint: "Treat feature flags as temporary. After a flag has been fully rolled out and stable for one release cycle, remove the flag code and the flag condition entirely.", typicalOutput: "flag provider config / gradual rollout target / flag cleanup plan / A/B test flag", tags: ["feature-flags", "rollout", "devops"], typicalStackCommand: "flag evaluation log + rollout percentage monitoring + unused flag scan" },
  { slug: "database-migration-safety", label: "Database Migration Safety", commonFailurePattern: "Running a long-running migration (e.g., adding a column with a default value) that locks the table and causes downtime for active users.", bestPracticeHint: "Use PostgreSQL's ADD COLUMN DEFAULT (no-rewrite in recent versions) or break the migration into steps: add column without default, backfill in batches, then add default.", typicalOutput: "batch migration / expand-contract pattern / zero-downtime migration / rollback plan", tags: ["database", "migration", "safety"], typicalStackCommand: "pg_locks monitoring during migration + batch backfill script + rollback test" },
  { slug: "error-monitoring-setup", label: "Error Monitoring & Alerting Setup", commonFailurePattern: "Setting up error monitoring (Sentry, Datadog) but configuring no alerts, so errors accumulate silently until a user complains.", bestPracticeHint: "Configure at least two alerts: one for new errors (errors appearing for the first time) and one for error spikes (error count exceeding a threshold).", typicalOutput: "Sentry project config / alert rule / error grouping / source map upload / performance monitoring", tags: ["monitoring", "errors", "alerts"], typicalStackCommand: "Sentry API error list + alert rule test + source map validation" },
  { slug: "secrets-rotation", label: "Secrets Rotation Policy", commonFailurePattern: "Using long-lived API keys and secrets that never expire, increasing the blast radius if they leak.", bestPracticeHint: "Automate secret rotation with a scheduled job. Use short-lived tokens (e.g., 90 days) and rotate them before expiry. Store secrets in a vault, not in env files.", typicalOutput: "rotation script / vault integration / lease management / incident response plan", tags: ["secrets", "security", "rotation"], typicalStackCommand: "vault lease list + secret expiry check + rotation dry-run test" },
  { slug: "cloud-cost-optimization", label: "Cloud Cost Optimisation", commonFailurePattern: "Running oversized instances 'just in case', or leaving development/staging resources running 24/7 when they are only needed during working hours.", bestPracticeHint: "Right-size instances based on actual usage metrics (not peak theoretical load). Use auto-stop schedules for non-production environments.", typicalOutput: "right-sizing recommendation / auto-stop schedule / reserved instance plan / unused resource report", tags: ["cloud", "cost", "optimization"], typicalStackCommand: "cloud cost explorer + instance utilisation report + auto-stop Lambda function test" },
  { slug: "multi-tenant-isolation", label: "Multi-Tenant Data Isolation", commonFailurePattern: "Using a single database with a tenant_id column but forgetting to filter by tenant_id in every query, accidentally mixing tenant data.", bestPracticeHint: "Use PostgreSQL Row-Level Security with tenant_id automatically set via session variable. This guarantees isolation even if a query misses the WHERE clause.", typicalOutput: "RLS policy / tenant context middleware / session variable injection / tenant-aware query builder", tags: ["multi-tenant", "saas", "database"], typicalStackCommand: "RLS policy test with two different tenant sessions + data leakage check" },
  { slug: "graphql-n-plus-one", label: "GraphQL N+1 Query Prevention", commonFailurePattern: "A resolver that fetches a parent entity, then for each child calls a separate database query, resulting in N+1 queries for N children.", bestPracticeHint: "Use DataLoader to batch and cache child-loading queries. DataLoader groups all child-loading calls into a single IN query per request cycle.", typicalOutput: "DataLoader instance / batch load function / resolver refactor / query complexity analysis", tags: ["graphql", "n-plus-one", "performance"], typicalStackCommand: "graphql query with tracing + DataLoader statistics + SQL log analysis" },
  { slug: "shell-script-robustness", label: "Shell Script Robustness & Safety", commonFailurePattern: "Shell scripts that fail silently midway because 'set -e' is not set, or that modify files without confirmation, causing irreversible damage.", bestPracticeHint: "Always start scripts with 'set -euo pipefail'. Add confirmation prompts before destructive operations. Use shellcheck to lint the script.", typicalOutput: "set -euo pipefail script / confirmation prompt / shellcheck-passing script / rollback function", tags: ["shell", "scripting", "safety"], typicalStackCommand: "shellcheck script.sh + bash -n script.sh + dry-run mode test" },
  { slug: "json-schema-validation", label: "JSON Schema Validation", commonFailurePattern: "Trusting external API responses without validating their structure, causing runtime errors when the API changes the response format unexpectedly.", bestPracticeHint: "Always validate external JSON responses against a JSON Schema before accessing properties. Use AJV (JavaScript) or jsonschema (Python) for fast validation.", typicalOutput: "JSON Schema / validator middleware / type guard / error message / response parser", tags: ["json", "validation", "api"], typicalStackCommand: "ajv validate + JSON Schema test suite + response mock test" },
  { slug: "stealth-web-research", label: "Stealth Web Research & Harvesting", commonFailurePattern: "Web scrapers getting blocked by Cloudflare, Akamai, or DataDome bot detection because they send no user-agent, use headless Chromium without stealth plugins, or hammer endpoints with zero delays between requests.", bestPracticeHint: "Use stealth-augmented browser automation (playwright-extra + stealth or puppeteer-extra + stealth plugin). Rotate realistic user agents with referrer headers. Add 1.5-3 second random delays between navigations. Respect robots.txt and rate-limit headers.", typicalOutput: "clean markdown corpus / structured JSON metadata / per-page extraction report / sitemap of crawled pages", tags: ["stealth", "scraping", "research", "anti-bot"], typicalStackCommand: "playwright-extra + stealth + cheerio + defuddle + manual jq inspection" },
  { slug: "context-window-budget", label: "LLM Context Window Budget Management", commonFailurePattern: "Dumping the entire conversation history plus all file contents into the LLM context window on every turn, causing immediate overflow on multi-hour sessions and burning tens of thousands of tokens on redundant content. Worse: re-reading the same 10MB file 50 times because each tool call rebuilds context from scratch without cache awareness.", bestPracticeHint: "Use sliding window summarization: keep system prompt + last 5 turns verbatim, compress older turns into a 200-token lossless summary. Aggressively cache stable prefixes (system prompt, tool schemas, file headers). Strip redundant tool outputs after they're acted on. Use semantic search to inject only relevant code chunks, never whole files. Always log token usage per turn so budget overruns are visible.", typicalOutput: "trimmed context array / token budget report / sliding window snapshot / semantic retrieval hit list / cache hit dashboard", tags: ["context", "tokens", "llm", "memory", "summarization"], typicalStackCommand: "tiktoken count + sliding window function + embedding similarity search + prompt cache hit ratio + token-usage-per-turn telemetry" },
];

const WORKFLOWS: WorkflowSpec[] = [
  {
    slug: "audit",
    title: "Audit",
    action: "Inspect the current state without making changes. List files, configurations, dependencies, or outputs relevant to the goal. Produce a structured inventory with findings, risks, and recommendations — but do not modify anything.",
    risk: LR,
    outputSet: [MD, CHK],
    tagBase: "audit",
  },
  {
    slug: "plan",
    title: "Plan",
    action: "Design an architecture, data flow, component tree, or migration strategy. Document all assumptions, list trade-offs, produce a step-by-step implementation sequence, and identify potential failure points before any code is written.",
    risk: LR,
    outputSet: [MD, JSON, CHK],
    tagBase: "planning",
  },
  {
    slug: "build",
    title: "Build",
    action: "Write or refactor code in small, independently verifiable patches. Each patch must include a validation step. Build dependencies first (types, schemas, core logic), then integrations (API, state), then presentation (UI), and finally polish.",
    risk: MR,
    outputSet: [DIFF, CHK],
    tagBase: "implementation",
  },
  {
    slug: "script",
    title: "Script",
    action: "Create a reusable automation: a shell script, CLI tool, scheduled job, or workflow definition. The automation must handle edge cases (missing input, network failures, permission errors) and include a dry-run or test mode.",
    risk: MR,
    outputSet: [CMD, JSON, CHK],
    tagBase: "automation",
  },
  {
    slug: "diagnose",
    title: "Diagnose",
    action: "Isolate the root cause of a failure. Separate symptoms from causes. Generate hypotheses in order of likelihood. Test each with a minimal, single-variable experiment. Once the cause is confirmed, propose a minimal fix.",
    risk: MR,
    outputSet: [MD, CMD, CHK],
    tagBase: "diagnostics",
  },
  {
    slug: "harden",
    title: "Harden",
    action: "Improve security, resilience, or reliability. Audit for exposed secrets, missing input validation, inadequate error handling, or weak access controls. Apply fixes that do not change the public API surface unless absolutely necessary.",
    risk: HR,
    outputSet: [JSON, CHK],
    tagBase: "security",
  },
  {
    slug: "explain",
    title: "Explain",
    action: "Write clear, structured documentation: README sections, architecture decision records, API reference docs, or runbooks. The audience is another developer or an AI agent. Include setup steps, usage examples, and a troubleshooting section.",
    risk: LR,
    outputSet: [MD, CHK],
    tagBase: "docs",
  },
  {
    slug: "tune",
    title: "Tune",
    action: "Improve a measurable metric: execution time, memory usage, token consumption, cost, or user-perceived latency. Benchmark before and after. Prefer non-breaking changes. If a breaking change is needed, provide a migration path.",
    risk: MR,
    outputSet: [MD, JSON, CHK],
    tagBase: "optimization",
  },
];

/* ------------------------------------------------------------------ */
/*  SKILL GENERATOR — combines hand-researched domain facts with       */
/*  8 reusable workflow templates. Domain data is original per-domain; */
/*  the trigger/prompt/example text below is templated, not authored   */
/*  individually per domain × workflow combination.                    */
/* ------------------------------------------------------------------ */
function generateSkill(domain: DomainSpec, workflow: WorkflowSpec): SeedSkill {
  const tags = Array.from(new Set([
    `target:${domain.slug}`,
    `workflow:${workflow.slug}`,
    workflow.tagBase,
    ...domain.tags,
  ]));

  const triggerMap: Record<string, string> = {
    audit: `You need to examine the current "${domain.label}" setup without making changes. Look for the specific failure pattern: "${domain.commonFailurePattern}". Call this when you want a structured inventory before deciding what to modify.`,
    plan: `A change to "${domain.label}" needs to be designed first. Consider the common failure pattern "${domain.commonFailurePattern}" and the best practice "${domain.bestPracticeHint}". Produce a plan before writing any code.`,
    build: `Write or modify code for "${domain.label}". The typical output is ${domain.typicalOutput}. Keep the best practice in mind: ${domain.bestPracticeHint}. Verify with: ${domain.typicalStackCommand}.`,
    script: `Create a reusable automation for "${domain.label}". The task produces ${domain.typicalOutput}. Handle the failure pattern "${domain.commonFailurePattern}". Include a dry-run mode and test with ${domain.typicalStackCommand}.`,
    diagnose: `Diagnose a problem in "${domain.label}". The failure pattern "${domain.commonFailurePattern}" is a likely candidate. Isolate the root cause with minimal experiments. Use ${domain.typicalStackCommand} for verification.`,
    harden: `Audit and harden "${domain.label}". The common failure pattern "${domain.commonFailurePattern}" may be present. Follow the best practice: ${domain.bestPracticeHint}. Produce a risk-ranked list of findings.`,
    explain: `Write documentation for "${domain.label}". Cover: what it is, when to use it, the ${domain.commonFailurePattern} pitfall, and how to verify with ${domain.typicalStackCommand}. Output must be readable by both humans and AI agents.`,
    tune: `Optimize "${domain.label}". Target the failure pattern "${domain.commonFailurePattern}" or the typical verification command ${domain.typicalStackCommand}. Benchmark before and after. Prefer non-breaking optimisations.`,
  };

  const promptMap: Record<string, string> = {
    audit: `You are auditing ${domain.label}. Follow ${workflow.action}. Specifically check for: ${domain.commonFailurePattern}. Use the best practice ${domain.bestPracticeHint} as your evaluation baseline. Verify your findings with ${domain.typicalStackCommand}. Do not modify any files.`,
    plan: `You are designing a plan for ${domain.label}. ${workflow.action}. Reference the best practice: ${domain.bestPracticeHint}. The output artifact is ${domain.typicalOutput}. Consider the failure pattern: ${domain.commonFailurePattern} and propose mitigations.`,
    build: `You are implementing a change for ${domain.label}. ${workflow.action}. The target output is ${domain.typicalOutput}. Follow the best practice: ${domain.bestPracticeHint}. Run ${domain.typicalStackCommand} after each patch.`,
    script: `You are automating a workflow for ${domain.label}. ${workflow.action}. The automation should produce or interact with ${domain.typicalOutput}. Guard against: ${domain.commonFailurePattern}. Test with ${domain.typicalStackCommand}.`,
    diagnose: `You are diagnosing a failure in ${domain.label}. ${workflow.action}. The suspected failure pattern is: ${domain.commonFailurePattern}. Use ${domain.typicalStackCommand} to isolate the root cause. Do not apply a permanent fix until the cause is confirmed.`,
    harden: `You are hardening ${domain.label}. ${workflow.action}. Check for: ${domain.commonFailurePattern}. Apply the best practice: ${domain.bestPracticeHint}. Rank findings by severity.`,
    explain: `You are documenting ${domain.label}. ${workflow.action}. Cover: the purpose, the output (${domain.typicalOutput}), the common failure pattern (${domain.commonFailurePattern}), the best practice (${domain.bestPracticeHint}), and the verification command (${domain.typicalStackCommand}).`,
    tune: `You are optimising ${domain.label}. ${workflow.action}. The target is ${domain.typicalOutput}. Measure using ${domain.typicalStackCommand}. Guard against: ${domain.commonFailurePattern}. Report before/after values.`,
  };

  const exampleMap: Record<string, [string, string]> = {
    audit: [
      `"Audit the current ${domain.label} setup" — produce an inventory of ${domain.typicalOutput} and flag issues related to ${domain.commonFailurePattern.split(".")[0]}.`,
      `"Check ${domain.label} health" — run ${domain.typicalStackCommand.split("+")[0].trim()} and summarise findings.`,
    ],
    plan: [
      `"Plan the ${domain.label} feature" — produce a step-by-step implementation sequence with ${domain.typicalOutput} as the target.`,
      `"Design ${domain.label} changes" — document trade-offs, addressing ${domain.commonFailurePattern.split(".")[0]}.`,
    ],
    build: [
      `"Implement ${domain.typicalOutput}" — write patches in the correct dependency order, verified with ${domain.typicalStackCommand.split("+")[0].trim()}.`,
      `"Add ${domain.label} support" — build incrementally, each step independently testable.`,
    ],
    script: [
      `"Script the ${domain.label} process" — produce a reusable CLI that handles ${domain.commonFailurePattern.split(".")[0]}.`,
      `"Automate ${domain.label}" — create a dry-run mode and test with ${domain.typicalStackCommand.split("+")[0].trim()}.`,
    ],
    diagnose: [
      `"Diagnose ${domain.label} failure" — run ${domain.typicalStackCommand.split("+")[0].trim()} and isolate root cause.`,
      `"Fix ${domain.label} error" — confirm hypothesis with a single verification command before applying a permanent fix.`,
    ],
    harden: [
      `"Harden ${domain.label}" — audit for ${domain.commonFailurePattern.split(".")[0]} and apply the best practice fix.`,
      `"Secure ${domain.label} setup" — review ${domain.typicalOutput} and produce a risk-ranked list.`,
    ],
    explain: [
      `"Document ${domain.typicalOutput}" — write a runbook with setup, usage, and troubleshooting.`,
      `"Explain ${domain.label} architecture" — produce an ADR covering ${domain.bestPracticeHint.split(".")[0]}.`,
    ],
    tune: [
      `"Optimise ${domain.label}" — benchmark ${domain.typicalStackCommand.split("+")[0].trim()} before and after.`,
      `"Tune ${domain.typicalOutput} performance" — reduce cost/latency while monitoring ${domain.commonFailurePattern.split(".")[0]}.`,
    ],
  };

  const examples = exampleMap[workflow.slug] ?? [
    `Apply ${workflow.title} to ${domain.label}.`,
    `Run the ${workflow.title} protocol for ${domain.typicalOutput}.`,
  ];

  const inputs = [
    ...goal(),
    { name: "domainArtifact", kind: "text" as const, required: false, description: `The specific ${domain.typicalOutput} this task involves.` },
  ] as SkillInput[];

  return {
    slug: `${domain.slug}-${workflow.slug}`,
    name: `${domain.label}: ${workflow.title}`,
    category: workflow.tagBase.charAt(0).toUpperCase() + workflow.tagBase.slice(1),
    description: `[${domain.label}] ${workflow.action} Targets ${domain.typicalOutput}. Known failure pattern: ${domain.commonFailurePattern}. Best practice: ${domain.bestPracticeHint}.`,
    triggerPhrase: triggerMap[workflow.slug] ?? `Work with ${domain.label} using the ${workflow.title} approach.`,
    promptTemplate: promptMap[workflow.slug] ?? `You are an expert in ${domain.label}. Apply ${workflow.title}: ${workflow.action}.`,
    inputs,
    outputs: [...workflow.outputSet.map(o => ({ ...o }))],
    examples: [...examples],
    metadata: {
      modelAgnostic: true,
      agentAgnostic: true,
      risk: workflow.risk.risk,
      tags,
    },
  };
}

const GENERATED_SKILLS = DOMAINS.flatMap((domain) =>
  WORKFLOWS.map((w) => generateSkill(domain, w)),
);

export const DEFAULT_SKILLS: SeedSkill[] = [...CORE_SKILLS, ...GENERATED_SKILLS];
export const DEFAULT_SKILL_COUNT = DEFAULT_SKILLS.length;
export const DEFAULT_SKILL_SOURCE = "https://github.com/universal-skill-bridge/skills";
