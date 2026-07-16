# Contributing to USB

First off — thanks for even opening this file. USB is built in public by a tiny
team, and every issue, question, and PR genuinely moves the project forward.

You don't need to be an expert. You don't even need to write code. Honest bug
reports are some of the most valuable contributions we get.

## Ways to contribute

**No code required:**

- **Report a broken install.** Tell us your OS, runtime (Claude Code, Cursor,
  Ollama, …), the exact command you ran, and what happened. That's a great issue.
- **Improve the docs.** If something in the README confused you, it will confuse
  the next person too. PRs that fix wording are always welcome.
- **Request a runtime.** Using an agent runtime we don't have an adapter for?
  Open an issue and describe how it discovers skills/rules on disk.

**Code contributions:**

- **New runtime adapters** — `src/lib/default-skillpack.ts` defines the 16
  current targets. An adapter describes which files a runtime expects and where
  they live. Small, self-contained, very reviewable.
- **New skill domains** — the catalog is a matrix: each domain (React, Docker,
  RAG, …) carries a hand-researched failure pattern, best practice, and
  verification command, then expands across 8 workflow templates into 8 skills.
  Adding one well-researched domain adds 8 skills. Research quality matters more
  than quantity here.
- **Core skills** — the 9 hand-written orchestration skills. The bar is higher:
  these are individually authored, not generated.
- **Installer & SDK hardening** — `src/lib/install-script.ts` renders the bash
  installer; `packages/sdk` and `packages/cli` consume it. Security-minded PRs
  (escaping, validation, verification) are especially appreciated.

## Our honesty rule

One thing we don't negotiate: **generated content is labeled as generated.**
9 of our skills are hand-written; 520 are produced by a domain × workflow
template matrix — and the README says so. If your PR adds generated or
AI-assisted content, that's completely fine (this project is co-developed with
AI), just say so in the PR description. You're responsible for verifying
whatever you submit.

## Development setup

You'll need Node.js 18+ and PostgreSQL.

```bash
git clone https://github.com/PeepSick/usb.git
cd usb
npm install

# point DATABASE_URL at your local Postgres
echo 'DATABASE_URL=postgres://user:pass@localhost:5432/usb' > .env

npm run dev        # seeds the skill catalog into Postgres on first run
```

Before opening a PR, make sure these pass:

```bash
npx tsc --noEmit   # strict type check
npm run build      # production build
```

## Project layout

| Path | What it is |
| :--- | :--- |
| `src/lib/default-skillpack.ts` | The skill matrix: domains, workflows, adapters, core skills |
| `src/lib/install-script.ts` | Renders the bash installer served by `/api/install` |
| `src/lib/skill-registry.ts` | DB access + bundle assembly |
| `src/app/api/` | Public endpoints: skills, install, sha256, audit, mcp, health |
| `packages/sdk/` | `@peepsick/usb-sdk` — typed client + agent base class |
| `packages/cli/` | `@peepsick/usb-cli` — the `usb` terminal command |

## Pull request guidelines

- Keep PRs small and focused — one topic per PR.
- Say **what** changed and **why**. A short paragraph beats a wall of text.
- If it touches the installer, include the output of a real install run
  (`bash install.sh --check` is your friend — it's a dry run).
- Be patient with review: small team, but we do respond.

## Community skills

We'd love to accept community-submitted skills — but we're not opening that
pipeline until the installer's content-embedding path is hardened enough to
safely carry third-party content (skill content is embedded into bash heredocs,
and we take that seriously). If you want to help get us there faster, that
hardening work is a fantastic place to contribute. Until then: open an issue
with your skill idea and we'll figure it out together.

## Security issues

Found a vulnerability? **Please don't open a public issue.** Email
[info@peepsickai.com](mailto:info@peepsickai.com) and we'll respond as fast as
we can. We're a small shop — responsible disclosure gives us a fair chance to
fix things before they're public.

## Code of conduct, the short version

Be kind. Assume good faith. Criticize code, not people. We're all here to make
a small, honest tool better.

---

*USB is MIT licensed — by contributing, you agree your contributions are too.*
