/**
 * OAuth Agent — OAuth + token rotation hardening built on USB.
 *
 *   import { OAuthAgent } from "@peepsick/usb-community-oauth-agent";
 *   await new OAuthAgent().start();
 *
 * Declares the `security` preset plus two targeted skills so a fresh install
 * has everything it needs to harden a project's OAuth surface out of the box.
 */
import { Agent } from "@peepsick/usb-sdk";

export class OAuthAgent extends Agent {
  name = "oauth-agent";
  version = "0.1.0";
  description = "OAuth + token rotation hardening.";

  presets = ["security"];
  skills = [
    "oauth-flows",
    "prompt-injection-defense",
    "secrets-rotation",
  ];

  async onPrompt(prompt: string): Promise<string> {
    return [
      "You are operating inside an OAuth-aware workspace.",
      "USB skills installed:",
      ...this.skills.map((s) => `  - ${s}`),
      "",
      "When recommending OAuth flows, prefer authorization code with PKCE.",
      "When discussing tokens, recommend short-lived access tokens + rotation.",
      "",
      "---",
      "",
      prompt,
    ].join("\n");
  }
}

export default OAuthAgent;
