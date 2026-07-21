#!/usr/bin/env python3
"""Crawl the live site's own pages and fail if any internal <a href> 404s.

This is the check that would have caught the "Try It Live" button bug:
verify-readme.sh tests CLI commands and check-encoding.py tests the catalog
API, but neither one ever visited the website's own pages and followed its
navigation — this script does exactly that.

Scope: fetches a fixed set of entry pages, collects every internal <a href>
found on them, dedupes, and checks each one resolves to a non-error status.
External links (github.com, npmjs.com, mailto:, ...) are skipped on purpose
— this is about catching our own broken links, not policing the internet.
"""
import sys
import urllib.error
import urllib.request
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse

# Force UTF-8 stdout regardless of the host console's default codepage —
# see scripts/check-encoding.py for why this matters on Windows.
sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "https://usb.peepsicklabs.com"
ENTRY_PAGES = ["/", "/about", "/privacy", "/playground/intent-router"]
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; usb-ci-check/1.0)"}


class LinkExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.hrefs: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag != "a":
            return
        for name, value in attrs:
            if name == "href" and value:
                self.hrefs.append(value)


def fetch(url: str) -> tuple[int, str]:
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status, resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, ""


def is_internal(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme in ("mailto", "tel"):
        return False
    if parsed.path.startswith("/cdn-cgi/"):
        # Cloudflare rewrites mailto: links into /cdn-cgi/l/email-protection#...
        # server-side (its bot-scraping countermeasure) and decodes them back
        # client-side via injected JS. A crawler GET-ing that path directly
        # 404s by design — it was never meant to be fetched, only decoded.
        return False
    if not parsed.netloc:
        return True
    return parsed.netloc == urlparse(BASE_URL).netloc


def main() -> int:
    all_links: set[str] = set()

    for page in ENTRY_PAGES:
        url = urljoin(BASE_URL, page)
        status, html = fetch(url)
        if status >= 400:
            print(f"❌ FAILED — entry page itself is broken: {url} -> {status}")
            return 1
        parser = LinkExtractor()
        parser.feed(html)
        for href in parser.hrefs:
            absolute = urljoin(url, href).split("#", 1)[0]
            if is_internal(absolute):
                all_links.add(absolute)

    print(f"Found {len(all_links)} unique internal links across {len(ENTRY_PAGES)} entry pages.")

    broken = []
    for link in sorted(all_links):
        status, _ = fetch(link)
        marker = "✅" if status < 400 else "❌"
        print(f"  {marker} {status} {link}")
        if status >= 400:
            broken.append((link, status))

    if broken:
        print(f"\n❌ FAILED — {len(broken)} broken internal link(s):")
        for link, status in broken:
            print(f"  {link} -> {status}")
        return 1

    print(f"\n✅ OK — all {len(all_links)} internal links resolve.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
