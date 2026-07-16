# Community agents

This directory holds community-maintained agents that build on top of
[`@peepsick/usb-sdk`](../sdk/). Each agent is a self-contained folder with an
`index.ts` that exports a class extending `Agent`.

## Submit yours

1. Fork [github.com/PeepSick/usb](https://github.com/PeepSick/usb)
2. Create a folder here: `packages/community/<your-agent-name>/`
3. Add `package.json`, `index.ts`, and a short `README.md`
4. Open a PR — title format: `[community] <YourAgentName>`
5. Maintainer will review and merge within 48h

## Quality bar

- Agent class extends `Agent` from `@peepsick/usb-sdk`
- Declares at least one preset or skill (don't ship an empty agent)
- No network calls outside the documented `@peepsick/usb-sdk` surface
- README explains the use case in 3 sentences or fewer

## Discovery

Merged agents are listed manually in the table below and installed via the
skills/presets they declare (`usb install <preset>` or `usb install <skill>`).
There is no automated ingest pipeline yet — this `manifest.json` convention
documents each agent's metadata for humans and is a planned input for future
catalog automation, not a live one today.

## Listed agents

| Agent | Author | Skills / Preset | Use case |
|-------|--------|------------------|----------|
| `oauth-agent` | PeepSick Labs | security preset + oauth-flows | OAuth + token rotation hardening |

## Manifest convention

Each agent documents its metadata at `packages/community/<name>/manifest.json`:

```json
{
  "name": "oauth-agent",
  "version": "0.1.0",
  "author": "PeepSick Labs",
  "description": "OAuth + token rotation hardening.",
  "skills": ["oauth-flows", "prompt-injection-defense"],
  "presets": ["security"],
  "tags": ["auth", "security", "oauth"],
  "minUsbVersion": "0.4.0"
}
```
