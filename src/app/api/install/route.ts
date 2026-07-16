import { renderFinalInstallScript } from "@/lib/install-script";
import { applyFilter, filterSummary, parseFilterFromUrl, type FilterableSkill } from "@/lib/filter";
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

    const bundle = {
      ...fullBundle,
      skills: filteredSkills,
    };

    const verifyUrl = `${origin}/api/install-sha256${url.search}`;
    const script = renderFinalInstallScript(bundle, verifyUrl, summary, url.search);

    return new Response(script, {
      headers: {
        "Content-Type": "text/x-shellscript; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to render install script", error);
    return new Response(
      "#!/usr/bin/env bash\necho 'Installer could not be generated.'\nexit 1\n",
      {
        status: 500,
        headers: {
          "Content-Type": "text/x-shellscript; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}