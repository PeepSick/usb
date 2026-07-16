/**
 * @peepsick/usb-sdk — Universal Skill Bridge SDK
 *
 * Build an agent that discovers, scores, evolves and shares USB skills.
 *
 * Usage:
 *
 *   import { Agent, SkillRegistry } from "@peepsick/usb-sdk";
 *
 *   class MyAgent extends Agent {
 *     name = "my-agent";
 *     skills = ["intent-router", "react-state-build", "code-reviewer"];
 *
 *     async onLoad(registry) {
 *       const intent = await registry.get("intent-router");
 *       console.log("loaded:", intent.name, intent.promptTemplate);
 *     }
 *   }
 *
 *   await new MyAgent().start();
 */

export type SkillRisk = "low" | "medium" | "high";

export type SkillMetadata = {
  risk?: SkillRisk;
  tags?: string[];
  modelAgnostic?: boolean;
  agentAgnostic?: boolean;
  [k: string]: unknown;
};

export type Skill = {
  slug: string;
  name: string;
  category: string;
  description: string;
  triggerPhrase: string;
  promptTemplate: string;
  inputs: Array<{ name: string; kind: string; required?: boolean; description?: string }>;
  outputs: Array<{ name: string; kind: string; description?: string }>;
  examples: string[];
  metadata: SkillMetadata;
};

export type AgentTarget =
  | "leosis"
  | "claude"
  | "hermes"
  | "openai"
  | "anthropic"
  | "langchain"
  | "cursor"
  | "mcp"
  | "openrouter"
  | "groq"
  | "mistral"
  | "ollama"
  | "lm-studio"
  | "vllm"
  | "auto"
  | "generic";

export type AgentOptions = {
  /** USB catalog base URL. Default: https://usb.peepsicklabs.com */
  baseUrl?: string;
  /** Default runtime target. Default: auto (auto-detect on the server). */
  target?: AgentTarget;
  /** Where to drop installed skill files. Default: $HOME/.ai-skills */
  installDir?: string;
};

export class SkillRegistry {
  private readonly baseUrl: string;
  private readonly target: AgentTarget;
  private readonly installDir: string;

  constructor(options: AgentOptions = {}) {
    this.baseUrl = (options.baseUrl ?? "https://usb.peepsicklabs.com").replace(/\/$/, "");
    this.target = options.target ?? "auto";
    this.installDir = options.installDir ?? `${process.env.HOME ?? "/tmp"}/.ai-skills`;
  }

  /** Fetch the full catalog manifest. */
  async manifest(): Promise<Skill[]> {
    const res = await fetch(`${this.baseUrl}/api/skills?target=${this.target}`);
    if (!res.ok) throw new Error(`USB manifest fetch failed: ${res.status}`);
    const json = (await res.json()) as { bundle: { skills: Skill[] } };
    return json.bundle.skills;
  }

  /** Find one skill by slug. Returns null if not found. */
  async get(slug: string): Promise<Skill | null> {
    const res = await fetch(`${this.baseUrl}/api/audit/${encodeURIComponent(slug)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`USB audit fetch failed: ${res.status}`);
    const json = (await res.json()) as { skill: Skill };
    return json.skill;
  }

  /** Search the catalog by free-text query. */
  async search(query: string, limit = 20): Promise<Skill[]> {
    const all = await this.manifest();
    const q = query.toLowerCase();
    return all
      .filter(
        (s) =>
          s.slug.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q),
      )
      .slice(0, limit);
  }

  /** Render the install script for a filter expression (slug, domain, preset, etc). */
  async renderInstallScript(filter: Partial<Record<"slug" | "domain" | "category" | "preset" | "core" | "exclude", string>>): Promise<string> {
    const qs = new URLSearchParams({ target: this.target, ...filter as Record<string, string> });
    const res = await fetch(`${this.baseUrl}/api/install?${qs.toString()}`);
    if (!res.ok) throw new Error(`USB install render failed: ${res.status}`);
    return await res.text();
  }

  /** Pull + execute the install script via bash (POSIX only). */
  async install(filter: Parameters<SkillRegistry["renderInstallScript"]>[0]): Promise<{ ok: true; output: string } | { ok: false; error: string }> {
    const script = await this.renderInstallScript(filter);
    const { spawnSync } = await import("node:child_process");
    const r = spawnSync("bash", ["-c", script], { encoding: "utf-8" });
    if (r.status === 0) return { ok: true, output: r.stdout };
    return { ok: false, error: r.stderr };
  }
}

/**
 * Base class for USB-aware agents. Subclass and override `onLoad` to
 * install + introspect skills. Subclass and override `onPrompt` to inject
 * skill prompt templates into your LLM prompt context.
 */
export class Agent {
  /** Display name of this agent. */
  name = "usb-agent";
  /** Skills to install on start. Each entry is a slug. */
  skills: string[] = [];
  /** Optional preset(s) to install on start, e.g. ["web-dev", "core-only"]. */
  presets: string[] = [];
  /** Agent options. Override via super({...}) in the constructor. */
  options: AgentOptions = {};

  protected registry!: SkillRegistry;

  /** Lifecycle hook: called once after `start()` resolves. */
  async onLoad(_registry: SkillRegistry): Promise<void> {
    // Subclass override.
  }

  /** Lifecycle hook: called for each prompt before it goes to the LLM. */
  async onPrompt(prompt: string): Promise<string> {
    return prompt;
  }

  async start(): Promise<void> {
    this.registry = new SkillRegistry(this.options);
    // Install declared skills + presets.
    for (const skill of this.skills) {
      await this.registry.install({ slug: skill });
    }
    for (const preset of this.presets) {
      await this.registry.install({ preset });
    }
    await this.onLoad(this.registry);
  }
}

export const version = "0.0.1";
