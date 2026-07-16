import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Cookie,
  Database,
  Globe,
  Mail,
  Shield,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy & KVKK — Universal Skill Bridge",
  description:
    "Privacy policy and KVKK / GDPR disclosure for Universal Skill Bridge, operated by PeepSick LABS.",
};

export default function PrivacyPage() {
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
          <Shield className="h-4 w-4" />
          Privacy &amp; KVKK Disclosure
        </div>
        <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-6xl">
          Privacy Policy
        </h1>
        <p className="mt-6 text-slate-300">
          Last updated: June 2026. This page explains what data Universal Skill
          Bridge collects, how it is used, and your rights under KVKK and
          GDPR.
        </p>
      </header>

      <section className="mt-12 space-y-12">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Database className="h-6 w-6 text-cyan-300" />
            1. What we collect
          </h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>
              Universal Skill Bridge operates as a public skill catalog. The
              data we process is:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                <strong>No personal data</strong> is required to browse the
                catalog or download skills.
              </li>
              <li>
                <strong>Anonymous installation records</strong> (target, pack
                slug, version, timestamp) are stored only if you click
                “Record Installation” in the interactive console. These
                contain no personal data.
              </li>
              <li>
                <strong>Optional telemetry</strong> (opt-in via{" "}
                <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm text-cyan-200">
                  USB_TELEMETRY=on
                </code>
                ) sends target + pack + version + skill count to a public
                endpoint. No IP, no user agent, no PII.
              </li>
            </ul>
          </div>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Cookie className="h-6 w-6 text-cyan-300" />
            2. Cookies &amp; local storage
          </h2>
          <p className="mt-4 text-slate-300">
            We do not set tracking cookies. The catalog uses standard browser
            storage only for UI preferences (search query, category filter).
            Clear cookies → preferences reset.
          </p>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Globe className="h-6 w-6 text-cyan-300" />
            3. Third-party services
          </h2>
          <ul className="mt-4 ml-6 list-disc space-y-2 text-slate-300">
            <li>
              <strong>Cloudflare</strong>: DNS, CDN, SSL termination.
              Cloudflare may log request metadata (IP, user agent, path) for
              DDoS protection. See{" "}
              <a
                href="https://www.cloudflare.com/privacypolicy/"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-300 underline decoration-dotted hover:text-cyan-200"
              >
                Cloudflare Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong>PostgreSQL</strong>: data is stored on PeepSick Labs
              infrastructure (self-hosted, no third-party DB).
            </li>
            <li>
              We do not sell, rent, or share any data with advertising
              networks.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Users className="h-6 w-6 text-cyan-300" />
            4. Your rights (KVKK / GDPR)
          </h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>You have the right to:</p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                Access any personal data we hold about you (we hold none by
                default).
              </li>
              <li>
                Request deletion of installation records associated with you.
              </li>
              <li>
                Object to processing or withdraw consent at any time.
              </li>
              <li>
                Lodge a complaint with your local data protection authority.
              </li>
            </ul>
          </div>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Shield className="h-6 w-6 text-cyan-300" />
            5. Security
          </h2>
          <ul className="mt-4 ml-6 list-disc space-y-2 text-slate-300">
            <li>HTTPS-only with HSTS preload-ready headers.</li>
            <li>
              Strict Content-Security-Policy, X-Frame-Options DENY, no
              cross-origin framing.
            </li>
            <li>Optional SHA-256 verification of install scripts.</li>
            <li>Self-hosted PostgreSQL on PeepSick Labs infrastructure.</li>
          </ul>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Mail className="h-6 w-6 text-cyan-300" />
            6. Data Controller
          </h2>
          <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">
              PeepSick LABS — Veri Sorumlusu
            </p>
            <ul className="mt-4 space-y-3 text-slate-200">
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 flex-shrink-0 text-slate-500" />
                <a
                  href="mailto:info@peepsickai.com"
                  className="text-cyan-300 hover:text-cyan-200"
                >
                  info@peepsickai.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}