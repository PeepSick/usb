import Link from "next/link";
import { notFound } from "next/navigation";
import { Terminal, Sparkles, ArrowLeft, ShieldCheck, Tag } from "lucide-react";
import { getSkillRegistry } from "@/lib/skill-registry";
import type { SkillInput, SkillOutput } from "@/db/schema";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

async function getPageOrigin() {
  const pinned = process.env.USB_PUBLIC_ORIGIN;
  if (pinned) return pinned.replace(/\/$/, "");
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export default async function PlaygroundPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { skills, pack } = await getSkillRegistry();
  const origin = await getPageOrigin();
  const skill = skills.find((s) => s.slug === slug);

  if (!skill) {
    notFound();
  }

  const installUrl = `${origin}/api/install?target=auto&slug=${slug}`;
  const installAll = `${origin}/api/install?target=auto`;

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white select-none">
      <section className="relative isolate px-6 py-10 sm:py-14 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_35%),radial-gradient(circle_at_75%_20%,rgba(168,85,247,0.18),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_45%,#111827_100%)]" />

        <div className="mx-auto max-w-5xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-cyan-300 transition hover:text-cyan-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to catalog
          </Link>

          <div className="mt-6 flex items-start gap-5">
            <div className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 text-2xl font-black text-slate-950 shadow-xl shadow-cyan-500/30">
              {skill.name[0]}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 font-bold uppercase tracking-wider text-cyan-100">
                  {skill.category}
                </span>
                <span className="rounded-full border border-purple-300/25 bg-purple-300/10 px-2.5 py-1 font-bold uppercase tracking-wider text-purple-100">
                  {skill.metadata?.risk ?? "low"} risk
                </span>
                {(skill.metadata?.tags as string[] | undefined)?.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-slate-300"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                {skill.name}
              </h1>
              <p className="mt-2 text-base leading-relaxed text-slate-300 select-text">
                {skill.description}
              </p>
            </div>
          </div>

          {/* Trigger phrase */}
          <div className="mt-8 rounded-3xl border border-emerald-300/20 bg-emerald-300/5 p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
              <Sparkles className="h-4 w-4" />
              Trigger phrase
            </div>
            <code className="mt-2 block font-mono text-base text-emerald-100 select-text">
              {skill.triggerPhrase}
            </code>
          </div>

          {/* Prompt template */}
          <div className="mt-6 rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
                <Terminal className="h-4 w-4" />
                Prompt template
              </div>
              <span className="text-[10px] text-slate-500">
                {skill.promptTemplate.length.toLocaleString()} chars
              </span>
            </div>
            <pre className="mt-3 max-h-[500px] overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-950/80 p-5 font-mono text-xs leading-relaxed text-slate-200 select-text">
{skill.promptTemplate}
            </pre>
          </div>

          {/* I/O contract */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Inputs</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                {skill.inputs.map((input: SkillInput) => (
                  <li key={input.name} className="rounded-xl bg-white/5 p-3">
                    <div className="flex items-center justify-between">
                      <code className="font-mono text-xs text-cyan-200">{input.name}</code>
                      <span className="text-[10px] text-slate-500">{input.kind}</span>
                    </div>
                    {input.description && (
                      <p className="mt-1 text-xs leading-relaxed text-slate-400 select-text">{input.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Outputs</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                {skill.outputs.map((output: SkillOutput) => (
                  <li key={output.name} className="rounded-xl bg-white/5 p-3">
                    <div className="flex items-center justify-between">
                      <code className="font-mono text-xs text-cyan-200">{output.name}</code>
                      <span className="text-[10px] text-slate-500">{output.kind}</span>
                    </div>
                    {output.description && (
                      <p className="mt-1 text-xs leading-relaxed text-slate-400 select-text">{output.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Examples */}
          {skill.examples.length > 0 && (
            <div className="mt-6 rounded-3xl border border-white/10 bg-slate-900/40 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Examples</h3>
              <ul className="mt-3 space-y-2">
                {skill.examples.map((ex, idx) => (
                  <li
                    key={idx}
                    className="rounded-xl bg-white/5 p-3 text-sm leading-relaxed text-slate-200 select-text"
                  >
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Install CTA */}
          <div className="mt-10 rounded-3xl border-2 border-cyan-300/30 bg-gradient-to-br from-cyan-400/10 to-purple-500/10 p-6 shadow-2xl shadow-cyan-500/10">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
              <ShieldCheck className="h-4 w-4" />
              Install this skill
            </div>
            <p className="mt-2 text-sm text-slate-300 select-text">
              Auto-detects your runtime (LeoSIS → Claude → Hermes → Cursor → generic), drops just this skill into the right folder.
            </p>
            <pre className="mt-4 overflow-auto rounded-2xl bg-slate-950/80 p-4 font-mono text-xs text-cyan-200">
{`# Install ONLY ${skill.slug} (1 skill)
curl -fsSL "${installUrl}" | bash

# Install the full ${pack.name} (${skills.length} skills)
curl -fsSL "${installAll}" | bash`}
            </pre>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={installUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:opacity-90"
              >
                <Terminal className="h-4 w-4" />
                View install script
              </a>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Browse all {skills.length} skills
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}