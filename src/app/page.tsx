import { InstallConsole } from "@/app/components/InstallConsole";
import { SkillCatalog } from "@/app/components/SkillCatalog";
import { DEFAULT_SKILL_SOURCE } from "@/lib/default-skillpack";
import { getSkillRegistry } from "@/lib/skill-registry";
import { Sparkles, Terminal } from "lucide-react";
import Link from "next/link";
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

export default async function HomePage() {
  const [{ pack, skills }, origin] = await Promise.all([
    getSkillRegistry(),
    getPageOrigin(),
  ]);

  const targetOptions = pack.adapters.map((adapter) => ({
    target: adapter.target,
    label: adapter.label,
    notes: adapter.notes,
    installPath: adapter.installPath,
  }));

  const catalogSkills = skills.map((skill) => ({
    slug: skill.slug,
    name: skill.name,
    category: skill.category,
    description: skill.description,
    triggerPhrase: skill.triggerPhrase,
    metadata: skill.metadata,
  }));

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white select-none">
      <section className="relative isolate px-6 py-10 sm:py-14 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_35%),radial-gradient(circle_at_75%_20%,rgba(168,85,247,0.18),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_45%,#111827_100%)]" />
        <div className="absolute left-1/2 top-0 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-6 flex items-center gap-4">
              <img
                src="/usb-logo.png"
                alt="USB — Universal Skill Bridge"
                className="h-24 w-auto drop-shadow-[0_0_40px_rgba(34,211,238,0.35)] sm:h-32"
              />
              <div className="hidden flex-col sm:flex">
                <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300">Presented by</span>
                <span className="text-sm font-semibold text-white">PeepSick Labs</span>
                <span className="text-[10px] text-slate-400">Building in public</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 shadow-lg backdrop-blur-md">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
                Universal Skill Bridge v{pack.version}
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-300/25 bg-purple-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-100">
                Plug &amp; Play
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100">
                MIT
              </div>
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
              One skill format. Every agent runtime.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 select-text">
              <strong className="text-cyan-200">Write a skill once, install it everywhere.</strong> USB is the bridge: a single portable skill format with sha256-verified installers for 16 runtimes — Claude Code, Cursor, MCP, LangChain, local models, and more — backed by a {skills.length}-skill catalog, one <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm text-cyan-200">npm install</code> away.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/playground/intent-router"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-500 px-6 py-4 font-bold text-slate-950 transition hover:opacity-90 shadow-lg shadow-cyan-500/20 active:scale-98"
              >
                <Sparkles className="h-5 w-5 fill-slate-950" />
                Try It Live
              </a>
              <a
                href="/api/install?target=auto"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-6 py-4 font-bold text-white transition hover:bg-white/10 active:scale-98 backdrop-blur-md"
              >
                <Terminal className="h-5 w-5 text-cyan-300" />
                View Installer
              </a>
              <a
                href="/api/skills?target=generic"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-6 py-4 font-bold text-white transition hover:bg-white/10 active:scale-98 backdrop-blur-md"
              >
                <Terminal className="h-5 w-5 text-cyan-300" />
                Manifest JSON
              </a>
            </div>
          </div>

          <InstallConsole
            origin={origin}
            targets={targetOptions}
          />
        </div>
      </section>

      <section className="px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Demo</p>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">From catalog to running agent in 30 seconds.</h2>
            </div>
            <Link
              href="/playground/intent-router"
              className="hidden text-sm text-cyan-300 transition hover:text-cyan-200 sm:inline"
            >
              Open the live playground →
            </Link>
          </div>
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 shadow-2xl">
            <img
              src="/usb-demo.gif"
              alt="USB demo: browse the catalog, try any skill live, install with one npm install command."
              className="block w-full"
            />
          </div>
          <p className="mt-4 text-sm text-slate-400">
            <strong className="text-cyan-200">Step 1:</strong> Browse 529 skills, 65 domains, 14 categories, or 6 curated presets. &nbsp;
            <strong className="text-cyan-200">Step 2:</strong> Try any skill live — inspect the prompt template, inputs, outputs and examples before you install. &nbsp;
            <strong className="text-cyan-200">Step 3:</strong> One <code className="rounded bg-white/10 px-1 font-mono text-xs text-cyan-200">npm install</code> — auto-detects your runtime and drops the right files into <code className="rounded bg-white/10 px-1 font-mono text-xs text-cyan-200">~/.leosis/skills/</code> (or <code className="rounded bg-white/10 px-1 font-mono text-xs text-cyan-200">~/.claude/</code>, <code className="rounded bg-white/10 px-1 font-mono text-xs text-cyan-200">~/.hermes/</code>, …). Prefer raw bash? A curl-and-verify path is one click away.
          </p>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02] px-6 py-10 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Modular Skills", skills.length.toString(), "Seeded active agent capabilities"],
            ["Agent Adapters", pack.adapters.length.toString(), "Different runtimes & platforms"],
            ["Live Endpoints", "8", "Skills, Install, Audit, Version, SHA-256, Health"],
            ["Database", "PostgreSQL", "Fully typed via Drizzle ORM"],
          ].map(([label, value, caption]) => (
            <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-xl backdrop-blur-sm transition hover:border-cyan-400/30 hover:bg-white/[0.05]">
              <p className="text-xs uppercase font-bold tracking-[0.24em] text-cyan-300">{label}</p>
              <p className="mt-3 text-4xl font-black text-white tracking-tight">{value}</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{caption}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Architecture</p>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Plugin-Like Modular Bridge</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              This system stores agent capabilities database-side, independent of model or runtime. A single-line bash script auto-detects your orchestrator (Claude, Hermes, Cursor, LangChain, etc.) and writes the correct configuration files — no manual setup required.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              ["1", "PostgreSQL Database", "Skill bundles and installation records are stored in relational tables with typed JSONB fields via Drizzle ORM."],
              ["2", "Dynamic Manifest", "`/api/skills` compiles the contract for all 529 capabilities into a portable JSON bundle targeted at your platform."],
              ["3", "Terminal Installer", "`/api/install` analyses your environment and writes the correct markdown, manifest, and rule files to the appropriate folders."],
              ["4", "Instant Activation", "Your AI agent automatically discovers and executes the new capabilities without any reconfiguration."],
            ].map(([step, title, text]) => (
              <div key={step} className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 shadow-xl transition hover:border-cyan-400/30">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400 text-base font-black text-slate-950 shadow-lg shadow-cyan-400/20">
                  {step}
                </div>
                <h3 className="mt-5 text-xl font-bold text-white">{title}</h3>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-400 select-text">{text}</p>
              </div>
            ))}
          </div>

          {/* Mermaid architecture diagram */}
          <div className="mt-14 rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-md">
            <pre className="mermaid text-xs leading-relaxed text-cyan-100 overflow-x-auto">
{`flowchart LR
    U(["Developer or AI Agent"]) -->|picks skill or filter| A["USB Catalog API<br/>/api/skills?slug=..."]
    A -->|applyFilter| F["Filter Engine<br/>529 → 1-N skills"]
    F -->|renderInstallScript| S["Bash Installer<br/>/api/install"]
    S -->|"curl ... | bash"| I["Agent Skill Dir<br/>~/.leosis/skills/"]
    I -->|discovered| M["AI Model<br/>Claude, Hermes, Cursor, ..."]
    classDef user fill:#0f172a,stroke:#22d3ee,stroke-width:2px,color:#fff;
    classDef api fill:#1e293b,stroke:#a855f7,stroke-width:2px,color:#fff;
    classDef agent fill:#1e293b,stroke:#f472b6,stroke-width:2px,color:#fff;
    class U user;
    class A,F,S api;
    class I,M agent;`}
            </pre>
          </div>
        </div>
      </section>

      {/* Dynamic skill catalog */}
      <SkillCatalog
        skills={catalogSkills}
        packName={pack.name}
        packDescription={pack.description}
        sourceUrl={DEFAULT_SKILL_SOURCE}
      />
    </main>
  );
}
