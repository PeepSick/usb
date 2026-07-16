import { NextResponse } from "next/server";
import { buildAuditReport } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const { status, report } = await buildAuditReport(slug);

    if (status !== 200) {
      return NextResponse.json(report, { status });
    }

    return new Response(JSON.stringify(report, null, 2) + "\n", {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Audit endpoint failed", error);
    return NextResponse.json(
      { ok: false, error: "Audit could not be performed." },
      { status: 500 },
    );
  }
}
