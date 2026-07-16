# @peepsick/usb-cli

> The Universal Skill Bridge command line.

Install 529 original agent skills (65 hand-researched domains × 8 workflows,
plus 9 core skills) into Claude Code, Hermes, LeoSIS, Cursor, OpenAI, Anthropic,
LangChain, MCP, OpenRouter, Groq, Mistral, Ollama, LM Studio, vLLM, or any
custom path — with one command.

## Install

```bash
npm install -g @peepsick/usb-cli
```

Or skip the package and grab the standalone bash script:

```bash
curl -fsSL https://usb.peepsicklabs.com/usb -o /usr/local/bin/usb && chmod +x /usr/local/bin/usb
```

## Usage

```bash
# Interactive picker — pick what to install
usb

# Install the whole pack (auto-detects runtime)
usb install

# Install one skill by slug
usb install intent-router

# Install one domain (8 workflows)
usb install react-state

# Install a curated preset
usb install web-dev
usb install backend
usb install security

# Just the 9 core orchestration skills
usb install core-only

# Search the catalog
usb search oauth

# Show details about one skill
usb info intent-router

# Show pack version
usb version
```

## How it works

The CLI is a thin bash wrapper (~6 KB, zero dependencies beyond `curl` and
`bash`) that talks to the public [USB catalog](https://usb.peepsicklabs.com).
No local state, no API keys, no telemetry by default.

## License

MIT — part of the USB open-source project.
