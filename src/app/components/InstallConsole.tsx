"use client";

import type { AgentTarget } from "@/db/schema";
import { Check, Copy, ExternalLink, Sparkles, Terminal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type TargetOption = {
  target: AgentTarget;
  label: string;
  notes: string;
  installPath: string;
};

type InstallConsoleProps = {
  origin: string;
  targets: TargetOption[];
};

type Toast = {
  tone: "success" | "info" | "error";
  title: string;
  description: string;
};

export function InstallConsole({ origin, targets }: InstallConsoleProps) {
  const [target, setTarget] = useState<AgentTarget>("auto");
  const [installMode, setInstallMode] = useState<"npm" | "recommended" | "fast">(
    "npm",
  );
  const [toast, setToast] = useState<Toast | null>(null);
  const [copied, setCopied] = useState(false);
  const fallbackInputRef = useRef<HTMLInputElement>(null);

  const cleanOrigin = useMemo(() => origin.replace(/\/$/, ""), [origin]);
  // Recommended: download → verify SHA-256 → inspect → run.
  // Each step has explicit error handling baked into the upstream script;
  // the bash `&&` chain short-circuits on any failure.
  const recommendedCommand = useMemo(
    () =>
      [
        `curl -fsSL "${cleanOrigin}/api/install?target=${target}" -o install.sh`,
        `EXPECTED=$(curl -fsSL "${cleanOrigin}/api/install-sha256?target=${target}")`,
        `echo "$EXPECTED  install.sh" | sha256sum -c -`,
        `less install.sh`,
        `bash install.sh`,
      ].join(" && \\\n    "),
    [cleanOrigin, target],
  );
  // Fast path: trust the publisher. Same effect, fewer guard rails.
  const fastCommand = useMemo(
    () => `curl -fsSL "${cleanOrigin}/api/install?target=${target}" | bash`,
    [cleanOrigin, target],
  );
  // npm: same installer, packaged as a published CLI — no raw curl | bash.
  const npmCommand = useMemo(
    () =>
      target === "auto"
        ? `npm install -g @peepsick/usb-cli && usb install`
        : `npm install -g @peepsick/usb-cli && usb install --target=${target}`,
    [target],
  );
  const command =
    installMode === "npm"
      ? npmCommand
      : installMode === "recommended"
        ? recommendedCommand
        : fastCommand;
  const manifestUrl = useMemo(
    () => `${cleanOrigin}/api/skills?target=${target}`,
    [cleanOrigin, target],
  );
  const scriptUrl = useMemo(
    () => `${cleanOrigin}/api/install?target=${target}`,
    [cleanOrigin, target],
  );

  const selectedTarget = targets.find((item) => item.target === target) ?? targets[0];

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function copyCommand() {
    let success = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(command);
        success = true;
      }
    } catch {
      success = false;
    }

    if (!success) {
      try {
        if (fallbackInputRef.current) {
          fallbackInputRef.current.select();
          fallbackInputRef.current.setSelectionRange(0, 99999);
          document.execCommand("copy");
          success = true;
        }
      } catch {
        success = false;
      }
    }

    if (success) {
      setCopied(true);
      setToast({
        tone: "success",
        title: "Command Copied! 🚀",
        description: "Paste it in your terminal to install immediately.",
      });
      setTimeout(() => setCopied(false), 2500);
    } else {
      setToast({
        tone: "error",
        title: "Copy Permission Required",
        description: "Select the command below and copy it manually (Ctrl+C / Cmd+C).",
      });
    }
  }

  return (
    <section className="relative rounded-[2.5rem] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/50 backdrop-blur-xl md:p-8">
      {toast ? (
        <div className="absolute -top-16 left-0 right-0 z-50 animate-bounce px-4">
          <div
            className={`mx-auto flex items-center gap-3 rounded-2xl border p-4 shadow-lg backdrop-blur-md ${
              toast.tone === "success"
                ? "border-emerald-400/30 bg-emerald-950/90 text-emerald-100 shadow-emerald-950/50"
                : toast.tone === "error"
                  ? "border-rose-400/30 bg-rose-950/90 text-rose-100 shadow-rose-950/50"
                  : "border-cyan-400/30 bg-cyan-950/90 text-cyan-100 shadow-cyan-950/50"
            }`}
          >
            <Sparkles className="h-6 w-6 flex-shrink-0 text-cyan-300" />
            <div>
              <p className="font-bold text-white">{toast.title}</p>
              <p className="text-xs text-slate-200">{toast.description}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-cyan-300 uppercase">
            <Terminal className="h-4 w-4" /> One-Click Bridge
          </div>
          <h2 className="mt-1 text-2xl font-black text-white md:text-3xl">
            Pick Your Agent Platform
          </h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 font-mono text-sm text-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          No telemetry by default
        </div>
      </div>

      <label className="mt-6 block text-sm font-semibold text-slate-300" htmlFor="target-select">
        Which runtime are you using?
      </label>
      <div className="relative mt-2">
        <select
          id="target-select"
          value={target}
          onChange={(event) => setTarget(event.target.value as AgentTarget)}
          className="w-full appearance-none rounded-2xl border border-white/15 bg-slate-950 px-5 py-4 font-semibold text-white outline-none ring-cyan-400/40 transition hover:border-white/30 focus:ring-4"
        >
          {targets.map((item) => (
            <option key={item.target} value={item.target}>
              {item.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
          ▼
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-cyan-500/30 bg-black/90 p-5 shadow-inner">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>Install Command</span>
          <span className="text-emerald-400">● Live</span>
        </div>

        <div
          role="tablist"
          aria-label="Install mode"
          className="mt-3 flex gap-1 rounded-xl border border-white/10 bg-slate-950/60 p-1 text-xs font-bold"
        >
          <button
            type="button"
            role="tab"
            aria-selected={installMode === "npm"}
            onClick={() => setInstallMode("npm")}
            className={`flex-1 rounded-lg px-3 py-2 transition ${
              installMode === "npm"
                ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            npm · recommended
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={installMode === "recommended"}
            onClick={() => setInstallMode("recommended")}
            className={`flex-1 rounded-lg px-3 py-2 transition ${
              installMode === "recommended"
                ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            curl · verify first
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={installMode === "fast"}
            onClick={() => setInstallMode("fast")}
            className={`flex-1 rounded-lg px-3 py-2 transition ${
              installMode === "fast"
                ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            curl · fast path
          </button>
        </div>

        <code className="mt-4 block whitespace-pre-wrap font-mono text-sm leading-relaxed text-cyan-200 select-all break-all">
          {command}
        </code>
        <input
          ref={fallbackInputRef}
          value={command}
          readOnly
          className="absolute -left-9999 opacity-0"
          aria-hidden="true"
        />
        <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
          {installMode === "npm"
            ? "Published on the npm registry as @peepsick/usb-cli — no raw curl | bash, auditable like any other package."
            : installMode === "recommended"
              ? "Each step fails loudly: download → verify SHA-256 → inspect with less → run."
              : "One curl, no checksum. Use only if you already trust the publisher (us)."}
        </p>
      </div>

      <button
        type="button"
        onClick={copyCommand}
        className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 font-bold transition shadow-lg ${
          copied
            ? "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
            : "bg-cyan-400 text-slate-950 hover:bg-cyan-300 hover:shadow-cyan-400/25"
        }`}
      >
        {copied ? <Check className="h-5 w-5 stroke-[3]" /> : <Copy className="h-5 w-5" />}
        {copied ? "Copied!" : "Copy Command"}
      </button>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 pt-2">
        <a
          href={manifestUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/20 bg-cyan-950/40 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-900/60"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Export Payload JSON
        </a>
        <a
          href={scriptUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-purple-400/20 bg-purple-950/40 px-3 py-2 text-xs font-semibold text-purple-200 transition hover:bg-purple-900/60"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Open Bash Script
        </a>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
        <p className="font-bold text-white flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400" /> {selectedTarget?.label}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{selectedTarget?.notes}</p>
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">
            Target Install Directory
          </p>
          <p className="mt-1 font-mono text-xs text-cyan-200 break-all bg-black/40 p-2 rounded-xl border border-white/5">
            {selectedTarget?.installPath}
          </p>
        </div>
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">
            Privacy
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            The installer writes skill markdown, adapter manifest, cursor rule,
            and a local <code className="font-mono">installed.json</code> into{" "}
            <code className="font-mono">~/.ai-skills/&lt;pack&gt;/</code> plus your runtime-specific
            folder (e.g. <code className="font-mono">~/.claude/skills/</code>,{" "}
            <code className="font-mono">~/.leosis/skills/</code>, …). Nothing leaves your device
            unless you opt in with <code className="font-mono">USB_TELEMETRY=on</code>.
          </p>
        </div>
      </div>
    </section>
  );
}