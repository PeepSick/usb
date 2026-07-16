import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Github,
  Globe,
  Heart,
  Mail,
  MapPin,
  Scale,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About — Universal Skill Bridge",
  description:
    "PeepSick Labs builds Universal Skill Bridge: 529 open-source AI skills installable into any agent runtime.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to catalog
      </Link>

      <header className="mt-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
          <Building2 className="h-4 w-4" />
          PeepSick Labs · Building in public
        </div>
        <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-6xl">
          About Universal Skill Bridge
        </h1>
        <p className="mt-6 text-xl leading-relaxed text-slate-300">
          We build portable, installable AI skill cards that work across every
          agent runtime — open source, transparent, and free.
        </p>
      </header>

      <section className="mt-14 space-y-12">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Heart className="h-6 w-6 text-cyan-300" />
            Philosophy
          </h2>
          <div className="mt-4 space-y-4 text-slate-300 leading-relaxed">
            <p>
Every domain in this catalog is hand-researched from real engineering
              experience — no scraping, no derivative work, just carefully
              distilled failure patterns and best practices for the things our
              team actually does day-to-day: ship React apps, run Kubernetes,
              debug RLS policies, tune Postgres queries, automate Chromium.
              Each domain is then systematically expanded across 8 workflows
              by a template generator, not re-authored by hand 529 times.
            </p>
            <p>
              We follow the inspiration of Anthropic&apos;s Claude Code skill
              format and the{" "}
              <a
                href="https://mcpservers.org/agent-skills"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-300 underline decoration-dotted hover:text-cyan-200"
              >
                mcpservers.org
              </a>{" "}
              ecosystem for the <em>shape</em> of the system. The substance —
              65 engineering domains × 8 workflows + 9 core orchestration
              skills = 529 unique capabilities — is original.
            </p>
          </div>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Globe className="h-6 w-6 text-cyan-300" />
            Reach
          </h2>
          <p className="mt-4 text-slate-300 leading-relaxed">
            Universal Skill Bridge installs with a single{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm text-cyan-200">
              curl | bash
            </code>{" "}
            command into Claude Code, Hermes, Cursor IDE, OpenAI Agents, MCP,
            Anthropic Messages API, LangChain, OpenRouter, Groq, Mistral,
            Ollama, LM Studio, vLLM, and any generic runtime — plus our own
            LeoSIS Native integration as the recommended default for PeepSick
            Labs deployments.
          </p>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Scale className="h-6 w-6 text-cyan-300" />
            Open source commitment
          </h2>
          <p className="mt-4 text-slate-300 leading-relaxed">
            Universal Skill Bridge is MIT licensed. Every skill, every adapter
            descriptor, every install script is in this repository. You can
            fork it, extend it, ship it commercially — and we ask only that
            derivative works respect the same transparency about their own
            inspirations.
          </p>
          <a
            href="https://github.com/PeepSick"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:text-cyan-100"
          >
            <Github className="h-4 w-4" />
            Follow PeepSick Labs on GitHub
          </a>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
            <MapPin className="h-6 w-6 text-cyan-300" />
            Contact
          </h2>
          <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">
              PeepSick LABS
            </p>
            <ul className="mt-4 space-y-3 text-slate-200">
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 flex-shrink-0 text-slate-500" />
                <a
                  href="mailto:info@peepsickai.com"
                  className="hover:text-cyan-300"
                >
                  info@peepsickai.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Github className="h-5 w-5 flex-shrink-0 text-slate-500" />
                <a
                  href="https://github.com/PeepSick"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-cyan-300"
                >
                  github.com/PeepSick
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}