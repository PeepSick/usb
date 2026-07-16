import { applyFilter, filterSummary, parseFilterFromUrl, type FilterableSkill } from "@/lib/filter";
import {
  getOriginFromRequest,
  getSkillBundle,
  normalizeTarget,
} from "@/lib/skill-registry";

export const dynamic = "force-dynamic";

function prettyJson(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(JSON.stringify(data, null, 2) + "\n", {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const target = normalizeTarget(url.searchParams.get("target"));
    const filter = parseFilterFromUrl(url);
    const fullBundle = await getSkillBundle(target, getOriginFromRequest(request));
    const filteredSkills = applyFilter(
      fullBundle.skills as unknown as FilterableSkill[],
      filter,
    ) as typeof fullBundle.skills;
    const summary = filterSummary(
      fullBundle.skills as unknown as FilterableSkill[],
      filteredSkills,
    );

    return prettyJson({
      ok: true,
      filter: {
        applied: Object.keys(filter).length > 0,
        options: filter,
        summary,
      },
      bundle: { ...fullBundle, skills: filteredSkills },
    });
  } catch (error) {
    console.error("Failed to load skills", error);
    return prettyJson(
      { ok: false, error: "Skill registry could not be loaded." },
      500,
    );
  }
}