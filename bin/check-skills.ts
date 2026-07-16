// Quick sanity check — local DEFAULT_SKILLS count
import { DEFAULT_SKILLS } from "../src/lib/default-skillpack";

const slugs = DEFAULT_SKILLS.map((s) => s.slug);
const unique = new Set(slugs);

console.log("DEFAULT_SKILLS.length:", DEFAULT_SKILLS.length);
console.log("Unique slugs:", unique.size);

if (unique.size !== slugs.length) {
  const seen = new Set<string>();
  const dups: string[] = [];
  for (const s of slugs) {
    if (seen.has(s)) dups.push(s);
    else seen.add(s);
  }
  console.log("DUPLICATE SLUGS:", dups);
}

console.log("First 10 slugs:", slugs.slice(0, 10).join(", "));
console.log("Last 10 slugs:", slugs.slice(-10).join(", "));

const cats = Array.from(new Set(DEFAULT_SKILLS.map((s) => s.category)));
console.log("Categories (" + cats.length + "):", cats.sort().join(", "));
