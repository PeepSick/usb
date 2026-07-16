import {
  buildInstallCommand,
  getOriginFromRequest,
  normalizeTarget,
} from "@/lib/skill-registry";

export const dynamic = "force-dynamic";

type InstallationBody = {
  target?: string;
  source?: string;
};

const LOGGING_ENABLED = process.env.USB_LOG_INSTALLATIONS === "on";

export async function GET() {
  // Public read endpoint intentionally removed. By default we do not expose
  // any installation log; if you need to debug opt-in logs, query the
  // `skill_installations` table directly with a privileged DB client.
  return new Response(
    JSON.stringify(
      {
        ok: true,
        message: "Public installation log endpoint is disabled by default.",
        enabled: LOGGING_ENABLED,
      },
      null,
      2,
    ) + "\n",
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function POST(request: Request) {
  if (!LOGGING_ENABLED) {
    return new Response(
      JSON.stringify(
        {
          ok: false,
          error: "Installation logging is disabled. Set USB_LOG_INSTALLATIONS=on to enable.",
        },
        null,
        2,
      ) + "\n",
      {
        status: 403,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as InstallationBody;
    const target = normalizeTarget(body.target);
    const origin = getOriginFromRequest(request);

    // Lazy import to avoid the DB write path when logging is off
    const { recordInstallation } = await import("@/lib/skill-registry");
    const installation = await recordInstallation(target, origin, {
      source: body.source ?? "web-console",
      userAgent: request.headers.get("user-agent") ?? "unknown",
    });

    return new Response(
      JSON.stringify(
        {
          ok: true,
          command: buildInstallCommand(origin, target),
          installation: {
            id: installation.id,
            target: installation.target,
            installedAt: installation.installedAt.toISOString(),
          },
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
  } catch (error) {
    console.error("Failed to record installation", error);
    return new Response(
      JSON.stringify(
        { ok: false, error: "Installation could not be recorded." },
        null,
        2,
      ) + "\n",
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    );
  }
}