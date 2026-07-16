import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Footer } from "@/app/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "USB — Universal Skill Bridge | Plug-and-play AI agent skills",
  description:
    "One portable skill format, installed with sha256-verified installers into 16 agent runtimes — Claude Code, Cursor, MCP, LangChain, and more. 9 hand-written core skills plus 520 generated from a 65-domain × 8-workflow matrix.",
  applicationName: "USB — Universal Skill Bridge",
  authors: [{ name: "PeepSick Labs" }],
  keywords: [
    "AI skills",
    "agent skills",
    "Claude Code",
    "MCP",
    "LeoSIS",
    "OpenAI Agents",
    "Hermes",
    "Anthropic",
    "OpenRouter",
    "skill bridge",
    "USB",
    "Universal Skill Bridge",
    "PeepSick Labs",
  ],
  openGraph: {
    title: "USB — Universal Skill Bridge",
    description:
      "One portable skill format, installed with sha256-verified installers into 16 agent runtimes. 9 hand-written core skills + 520 generated from a 65-domain × 8-workflow matrix.",
    images: ["/usb-og.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "USB — Universal Skill Bridge",
    description:
      "One portable skill format, installed with sha256-verified installers into 16 agent runtimes. 9 hand-written core skills + 520 generated from a 65-domain × 8-workflow matrix.",
    images: ["/usb-og.png"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"
          async
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('DOMContentLoaded', function() {
                if (window.mermaid) {
                  window.mermaid.initialize({ startOnLoad: true, theme: 'dark', themeVariables: { primaryColor: '#0f172a', primaryTextColor: '#fff', primaryBorderColor: '#22d3ee', lineColor: '#22d3ee', secondaryColor: '#1e293b', tertiaryColor: '#0f172a' } });
                }
              });
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <div className="flex min-h-screen flex-col">
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}