"use client";

import { useMemo, useState } from "react";

type CatalogSkill = {
  slug: string;
  name: string;
  category: string;
  description: string;
  triggerPhrase: string;
  metadata: {
    risk: "low" | "medium" | "high";
    tags: string[];
  };
};

type SkillCatalogProps = {
  skills: CatalogSkill[];
  packName: string;
  packDescription: string;
  sourceUrl: string;
};

const INITIAL_LIMIT = 96;
const LIMIT_STEP = 96;

export function SkillCatalog({ skills, packName, packDescription, sourceUrl }: SkillCatalogProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [limit, setLimit] = useState(INITIAL_LIMIT);

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(skills.map((skill) => skill.category))).sort()],
    [skills],
  );

  const filteredSkills = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return skills.filter((skill) => {
      const matchesCategory = category === "all" || skill.category === category;
      const haystack = `${skill.name} ${skill.slug} ${skill.category} ${skill.description} ${skill.triggerPhrase} ${skill.metadata.tags.join(" ")}`.toLowerCase();
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, query, skills]);

  const visibleSkills = filteredSkills.slice(0, limit);

  function resetFilters() {
    setQuery("");
    setCategory("all");
    setLimit(INITIAL_LIMIT);
  }

  return (
    <section className="px-6 pb-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">Skill Catalog</p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{packName}</h2>
            <p className="mt-3 max-w-2xl text-slate-300">{packDescription}</p>
          </div>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-100"
          >
            GitHub: Universal Skill Bridge
          </a>
        </div>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 md:p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_260px_auto] md:items-center">
            <label className="sr-only" htmlFor="skill-search">
              Search skills
            </label>
            <input
              id="skill-search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setLimit(INITIAL_LIMIT);
              }}
              placeholder="Search skills: nextjs, mcp, security, browser, docs..."
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none ring-cyan-300/40 transition placeholder:text-slate-500 focus:ring-4"
            />
            <label className="sr-only" htmlFor="skill-category">
              Filter by category
            </label>
            <select
              id="skill-category"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setLimit(INITIAL_LIMIT);
              }}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none ring-cyan-300/40 transition focus:ring-4"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "All categories" : item}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Reset
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
            <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-cyan-100">Total {skills.length} skills</span>
            <span className="rounded-full bg-white/10 px-3 py-1">Filtered {filteredSkills.length}</span>
            <span className="rounded-full bg-white/10 px-3 py-1">Showing {visibleSkills.length}</span>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {visibleSkills.map((skill) => (
            <article
              key={skill.slug}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-cyan-300/40 hover:bg-white/[0.07]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">{skill.category}</p>
                  <h3 className="mt-2 text-xl font-bold text-white">{skill.name}</h3>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs ${
                    skill.metadata.risk === "high"
                      ? "border-rose-300/20 bg-rose-300/10 text-rose-100"
                      : skill.metadata.risk === "medium"
                        ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
                        : "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                  }`}
                >
                  {skill.metadata.risk}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{skill.description}</p>
              <div className="mt-4 rounded-2xl bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Trigger</p>
                <p className="mt-2 text-sm text-slate-300">{skill.triggerPhrase}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {skill.metadata.tags.slice(0, 6).map((tag) => (
                  <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        {visibleSkills.length < filteredSkills.length ? (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setLimit((value) => value + LIMIT_STEP)}
              className="rounded-2xl bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              Show more skills
            </button>
          </div>
        ) : null}

        {filteredSkills.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-slate-300">
            No skills match your filters. Try clearing the search and selecting a different category.
          </div>
        ) : null}
      </div>
    </section>
  );
}
