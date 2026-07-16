# @peepsick/usb-community-oauth-agent

> OAuth + token rotation hardening built on [USB — Universal Skill Bridge](https://github.com/PeepSick/usb).

## Install

```bash
npm install @peepsick/usb-sdk
npm install @peepsick/usb-community-oauth-agent
```

## Usage

```typescript
import { OAuthAgent } from "@peepsick/usb-community-oauth-agent";

const agent = new OAuthAgent();
await agent.start();

// Now use `agent` inside your own prompt loop — it injects OAuth-aware context
// before each LLM call.
```

## What it does

- Installs the `security` preset (OAuth, RLS, prompt injection, secrets, hardening)
- Adds targeted skills: `oauth-flows`, `prompt-injection-defense`, `secrets-rotation`
- Wraps every prompt with OAuth + token rotation guardrails

## License

MIT — PeepSick Labs.
