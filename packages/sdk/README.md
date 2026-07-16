# @peepsick/usb-sdk — Universal Skill Bridge SDK

> Build agents that discover, score, evolve and share USB skills.

The SDK is a thin TypeScript wrapper around the USB HTTP API. It gives your agent:

- A `SkillRegistry` for browsing, searching and installing USB skills.
- An `Agent` base class for declaring skills + presets and reacting to lifecycle hooks.
- Zero hidden state — every call goes through the public `/api/*` endpoints.

## Install

```bash
npm install @peepsick/usb-sdk
```

## Minimal example

```typescript
import { Agent, SkillRegistry } from "@peepsick/usb-sdk";

class ReviewAgent extends Agent {
  name = "review-agent";
  skills = ["intent-router", "code-reviewer", "react-state-build"];

  async onLoad(registry) {
    const intent = await registry.get("intent-router");
    console.log("Loaded:", intent?.name, `(${intent?.promptTemplate.length} chars)`);
  }

  async onPrompt(prompt: string): Promise<string> {
    // Inject skill context before sending to the LLM.
    return [
      "You have these USB skills installed:",
      this.skills.map((s) => ` - ${s}`).join("\n"),
      "",
      prompt,
    ].join("\n");
  }
}

await new ReviewAgent().start();
```

## CLI usage

The companion CLI (`usb`) covers the same operations in shell:

```bash
npm install -g @peepsick/usb-cli
# or, without npm: curl -fsSL https://usb.peepsicklabs.com/usb -o /usr/local/bin/usb && chmod +x /usr/local/bin/usb

usb install intent-router
usb search oauth
usb info react-state-build
```

## Plugin system

Anyone can publish a community agent that extends `Agent`:

```typescript
import { Agent } from "@peepsick/usb-sdk";

export class MyOAuthAgent extends Agent {
  name = "oauth-agent";
  presets = ["security"];
  skills = ["oauth-flows", "prompt-injection-defense"];

  async onLoad(registry) {
    // Custom setup — e.g. register an MCP tool, validate env, etc.
  }
}
```

Submit your agent as a PR to `github.com/PeepSick/usb` under `packages/community/`. Add a `package.json`, an `index.ts`, and a short `README.md` — see [`packages/community/README.md`](https://github.com/PeepSick/usb/tree/main/packages/community) for the manifest convention. Listing is currently manual (reviewed and merged like any PR), not yet automated.

## API surface

```typescript
class SkillRegistry {
  manifest(): Promise<Skill[]>
  get(slug: string): Promise<Skill | null>
  search(query: string, limit?: number): Promise<Skill[]>
  renderInstallScript(filter: object): Promise<string>
  install(filter: object): Promise<{ ok: true; output: string } | { ok: false; error: string }>
}

class Agent {
  name: string
  skills: string[]
  presets: string[]
  options: AgentOptions
  onLoad(registry: SkillRegistry): Promise<void>
  onPrompt(prompt: string): Promise<string>
  start(): Promise<void>
}
```

## License

MIT — part of the USB open-source project.
