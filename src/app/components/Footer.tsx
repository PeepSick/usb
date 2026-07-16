import Link from "next/link";
import { Github, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-slate-950/70 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <img
                src="/usb-logo.png"
                alt="USB — Universal Skill Bridge"
                className="h-9 w-auto drop-shadow-[0_0_20px_rgba(34,211,238,0.25)]"
              />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              A plug-and-play skill bridge for AI agents. 9 hand-written core skills + 520 generated from a 65-domain × 8-workflow matrix — npm install into any of 16 runtimes.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <img
                src="/peepsicklabs-logo.png"
                alt="PeepSick Labs"
                className="h-5 w-auto rounded opacity-80"
              />
              <span>· A PeepSick Labs product.</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">
              Contact
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0 text-slate-500" />
                <a
                  href="mailto:info@peepsickai.com"
                  className="hover:text-cyan-300"
                >
                  info@peepsickai.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">
              Platform
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>
                <Link href="/" className="hover:text-cyan-300">
                  Skill Catalog
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-cyan-300">
                  About
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-cyan-300">
                  Privacy &amp; KVKK
                </Link>
              </li>
              <li>
                <Link
                  href="/api/skills?target=generic"
                  className="hover:text-cyan-300"
                >
                  Manifest JSON
                </Link>
              </li>
              <li>
                <Link
                  href="/api/version"
                  className="hover:text-cyan-300"
                >
                  Version API
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/PeepSick"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-cyan-300"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">
              Legal
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>License: MIT</li>
              <li>© 2026 PeepSick Labs</li>
              <li>Pack v0.4.1 · 529 skills</li>
              <li className="text-xs text-slate-500">
                All skill content original. Inspired by{" "}
                <a
                  href="https://mcpservers.org/agent-skills"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-dotted hover:text-cyan-300"
                >
                  mcpservers.org
                </a>{" "}
                ecosystem.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-2 border-t border-white/5 pt-6 text-center text-xs text-slate-500 sm:flex-row sm:justify-between">
          <span>
            Built in public · Universal Skill Bridge is a PeepSick Labs
            product.
          </span>
          <span className="font-mono">
            16 provider targets · 1 portable pack
          </span>
        </div>
      </div>
    </footer>
  );
}