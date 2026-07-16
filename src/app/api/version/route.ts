import { DEFAULT_PACK } from "@/lib/default-skillpack";

export const dynamic = "force-dynamic";

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

function isSemver(value: string): boolean {
  return SEMVER_PATTERN.test(value);
}

function compareSemver(a: string, b: string): number {
  const [aMajor, aMinor, aPatch] = a.split(".").map(Number);
  const [bMajor, bMinor, bPatch] = b.split(".").map(Number);
  if (aMajor !== bMajor) return aMajor - bMajor;
  if (aMinor !== bMinor) return aMinor - bMinor;
  return aPatch - bPatch;
}

export async function GET() {
  const current = DEFAULT_PACK.version;
  const latest = process.env.USB_LATEST_VERSION ?? current;
  const minSupported = process.env.USB_MIN_SUPPORTED_VERSION ?? "0.3.0";
  const updateAvailable =
    isSemver(current) && isSemver(latest) && compareSemver(latest, current) > 0;
  const baseUrl =
    process.env.USB_BASE_URL ?? "https://usb.peepsicklabs.com";
  const commitSha = process.env.USB_COMMIT_SHA ?? null;

  return new Response(
    JSON.stringify(
      {
        ok: true,
        current,
        latest,
        minSupported,
        updateAvailable,
        slug: DEFAULT_PACK.slug,
        name: DEFAULT_PACK.name,
        releasedAt: process.env.USB_RELEASED_AT ?? new Date().toISOString(),
        commitSha,
        install: {
          scriptUrl: `${baseUrl}/api/install?target=auto`,
          sha256Url: `${baseUrl}/api/install-sha256?target=auto`,
          // Convenience: how to fetch the script, verify it, then run it.
          // Each step has explicit error handling so a 404 or stale CDN
          // fails loudly instead of silently running an unchecked script.
          verifyCommand:
            `curl -fsSL ${baseUrl}/api/install?target=auto -o install.sh ` +
            `|| { echo '❌ Failed to download installer' >&2; exit 1; } && ` +
            `EXPECTED=$(curl -fsSL ${baseUrl}/api/install-sha256?target=auto) ` +
            `|| { echo '❌ Failed to fetch checksum' >&2; exit 1; } && ` +
            `echo "$EXPECTED  install.sh" | sha256sum -c - ` +
            `|| { echo '❌ Checksum mismatch — installer tampered with or stale' >&2; exit 1; } && ` +
            `less install.sh && bash install.sh`,
        },
        upgradeCommand: updateAvailable
          ? `curl -fsSL "${baseUrl}/api/install?target=auto" | USB_TARGET_VERSION=${latest} bash`
          : null,
      },
      null,
      2,
    ) + "\n",
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}