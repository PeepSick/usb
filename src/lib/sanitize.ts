/**
 * Lightweight output sanitizer for skill payloads.
 *
 * Strips control characters, escapes prompt-injection markers, and normalises
 * stringified JSON values so they cannot smuggle executable instructions into a
 * downstream LLM or shell that consumes a /api/* response.
 */

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

const INJECTION_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /<\s*script[\s\S]*?>/i, label: "html-script-tag" },
  { pattern: /<\s*\/\s*script\s*>/i, label: "html-script-close" },
  { pattern: /ignore (?:all )?previous instructions/i, label: "prompt-ignore" },
  { pattern: /system:\s*you are/i, label: "prompt-system-override" },
  { pattern: /```\s*bash[\s\S]*?```/i, label: "bash-code-fence" },
  { pattern: /`\s*\$\([^)]+\)/, label: "shell-command-substitution" },
];

export type SanitizeReport = {
  cleaned: boolean;
  removedControlChars: number;
  injectionFlags: string[];
};

export function sanitizeString(input: string): { value: string; report: SanitizeReport } {
  const removed = input.match(CONTROL_CHARS);
  const cleaned = input.replace(CONTROL_CHARS, "");
  const flags: string[] = [];
  for (const { pattern, label } of INJECTION_PATTERNS) {
    if (pattern.test(cleaned)) flags.push(label);
  }
  return {
    value: cleaned,
    report: {
      cleaned: !!removed || flags.length > 0,
      removedControlChars: removed ? removed.length : 0,
      injectionFlags: flags,
    },
  };
}

export function sanitizeJson<T>(value: T): { value: T; reports: SanitizeReport[] } {
  const reports: SanitizeReport[] = [];
  const seen = new WeakSet<object>();

  const walk = (node: unknown): unknown => {
    if (typeof node === "string") {
      const { value, report } = sanitizeString(node);
      if (report.cleaned) reports.push(report);
      return value;
    }
    if (Array.isArray(node)) {
      return node.map((item) => walk(item));
    }
    if (node && typeof node === "object") {
      if (seen.has(node as object)) return node;
      seen.add(node as object);
      const out: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(node as Record<string, unknown>)) {
        out[key] = walk(val);
      }
      return out;
    }
    return node;
  };

  return { value: walk(value) as T, reports };
}

export function sanitizeReportSummary(reports: SanitizeReport[]): {
  total: number;
  cleaned: number;
  flagged: string[];
} {
  const flagged = new Set<string>();
  for (const r of reports) {
    for (const f of r.injectionFlags) flagged.add(f);
  }
  return {
    total: reports.length,
    cleaned: reports.filter((r) => r.cleaned).length,
    flagged: Array.from(flagged),
  };
}