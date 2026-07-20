#!/usr/bin/env python3
"""Scan the full live skill catalog for encoding corruption.

Not a blanket "no non-ASCII" check — this project intentionally ships
emoji, arrows, and em-dashes in CLI output and skill content, so a raw
`grep -P "[^\\x00-\\x7F]"` would flag correct text as often as broken text.

Instead this looks for the specific byte-sequence tells of UTF-8 text that
got decoded as Latin-1/CP1252 and re-encoded as UTF-8 (double-encoding
mojibake) — e.g. an em-dash "—" corrupting into "Ã¢â‚¬â€" — plus the
U+FFFD replacement character, which only appears when a real decode
failure already happened. Both are unambiguous signs of corruption; a
legitimate arrow, checkmark, or Turkish-domain-content* character never
matches these patterns.

  (*none should exist post-translation anyway — see scripts/verify-readme.sh)
"""
import json
import sys
import urllib.request

# Force UTF-8 stdout regardless of the host console's default codepage —
# e.g. Windows Terminal often defaults to a locale-specific codepage (cp1254,
# cp1252, ...) that can't encode the ✅/❌ this script prints, crashing before
# it ever reports a result. Linux CI runners default to UTF-8 already; this
# just makes local runs on Windows behave the same way.
sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "https://usb.peepsicklabs.com"

MOJIBAKE_MARKERS = [
    "Ã¢â‚¬",  # em/en-dash, curly quotes double-encoded
    "â€™", "â€œ", "â€\x9d", "â€“", "â€”",
    "Ã©", "Ã¼", "Ã¶", "Ã§", "Ã¡", "Ã­", "Ã³", "Ãº",
    "�",  # U+FFFD replacement character — always a real decode failure
]


def fetch_catalog() -> list[dict]:
    # Cloudflare blocks urllib's default User-Agent with a 403; a browser-like
    # one is required (same story as every other automated fetch in this repo).
    req = urllib.request.Request(
        f"{BASE_URL}/api/skills?target=generic",
        headers={"User-Agent": "Mozilla/5.0 (compatible; usb-ci-check/1.0)"},
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.load(resp)
    return data["bundle"]["skills"]


def main() -> int:
    skills = fetch_catalog()
    print(f"Scanning {len(skills)} skills for encoding corruption...")

    hits: list[tuple[str, str]] = []
    for skill in skills:
        blob = json.dumps(skill, ensure_ascii=False)
        for marker in MOJIBAKE_MARKERS:
            if marker in blob:
                hits.append((skill["slug"], marker))

    if hits:
        print(f"❌ FAILED — {len(hits)} encoding corruption hit(s):")
        for slug, marker in hits:
            print(f"  {slug}: {marker!r}")
        return 1

    print(f"✅ OK — no encoding corruption across {len(skills)} skills.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
