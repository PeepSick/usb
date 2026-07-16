import crypto from "node:crypto";
import { applyFilter, filterSummary, parseFilterFromUrl, type FilterableSkill } from "@/lib/filter";
import { renderFinalInstallScript } from "@/lib/install-script";
import {
  getOriginFromRequest,
  getSkillBundle,
  normalizeTarget,
} from "@/lib/skill-registry";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const target = normalizeTarget(url.searchParams.get("target"));
    const origin = getOriginFromRequest(request);
    const filter = parseFilterFromUrl(url);

    const fullBundle = await getSkillBundle(target, origin);
    const filteredSkills = applyFilter(
      fullBundle.skills as unknown as FilterableSkill[],
      filter,
    ) as typeof fullBundle.skills;
    const summary = filterSummary(
      fullBundle.skills as unknown as FilterableSkill[],
      filteredSkills,
    );
    const bundle = { ...fullBundle, skills: filteredSkills };
    const verifyUrl = `${origin}/api/install-sha256${url.search}`;
    // Must byte-for-byte match what /api/install serves — same shared
    // renderer, same bundle/verifyUrl/summary/search inputs — otherwise the
    // hash advertised here can never match the downloaded script.
    const script = renderFinalInstallScript(bundle, verifyUrl, summary, url.search);
    const hash = crypto.createHash("sha256").update(script).digest("hex");
    return new Response(hash + "\n", {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to compute install SHA-256", error);
    return new Response("error: checksum unavailable\n", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}