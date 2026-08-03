#!/usr/bin/env python3
"""Checks that what the installer writes matches what each runtime can read.

This is the layer the other checks were missing. verify-readme.sh proves the
installer exits 0 and prints no errors; check-installer-prompt.py proves it
waits for input. Neither asks whether the files it produced are in a shape
the target runtime actually loads — so USB shipped writing 529 loose .md
files into ~/.claude/skills/, which Claude Code silently ignored because it
discovers skills as <skill-name>/SKILL.md directories.

Each check below encodes a published requirement of the target runtime:

  Claude Code  https://code.claude.com/docs/en/skills
    "Each skill is a directory with SKILL.md as the entrypoint"
    "~/.claude/skills/<skill-name>/SKILL.md"
    frontmatter `description` is what Claude uses to decide when to load it

  Cursor       https://cursor.com/docs/context/rules
    "Project rules live in .cursor/rules as .mdc files"
    user-level rules are Settings-UI only, never read from disk

Run: python3 scripts/check-target-formats.py [base_url]
"""

import os
import re
import shutil
import subprocess
import sys
import tempfile

BASE_URL = (sys.argv[1] if len(sys.argv) > 1 else "https://usb.peepsicklabs.com").rstrip("/")

failures = []


def report(name, ok, detail=""):
    print(f"── {name}")
    if ok:
        print("✅ OK")
    else:
        print(f"❌ FAILED: {detail}")
        failures.append(name)


def run_install(target, home, extra_args=None, cwd=None):
    """Run the real installer for one target into a throwaway HOME."""
    url = f"{BASE_URL}/api/install?target={target}"
    if extra_args:
        url += "&" + extra_args
    script = os.path.join(home, "install.sh")
    fetch = subprocess.run(
        ["curl", "-fsSL", url, "-o", script], capture_output=True, text=True, timeout=180
    )
    if fetch.returncode != 0:
        return None, f"could not fetch installer: {fetch.stderr.strip()}"
    proc = subprocess.run(
        ["bash", script],
        env={**os.environ, "HOME": home},
        cwd=cwd or home,
        capture_output=True,
        text=True,
        timeout=300,
        stdin=subprocess.DEVNULL,
    )
    if proc.returncode != 0:
        return None, f"installer exited {proc.returncode}: {(proc.stdout + proc.stderr)[-500:]}"
    return proc.stdout + proc.stderr, None


def frontmatter(path):
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    if not text.startswith("---"):
        return None
    end = text.find("\n---", 3)
    if end == -1:
        return None
    block = text[3:end]
    fields = {}
    for line in block.splitlines():
        m = re.match(r"^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$", line)
        if m:
            fields[m.group(1)] = m.group(2).strip()
    return fields


def check_claude_single():
    """One skill should install as ~/.claude/skills/<slug>/SKILL.md."""
    name = "claude: a single skill installs as <slug>/SKILL.md"
    home = tempfile.mkdtemp(prefix="usb-fmt-")
    try:
        _, err = run_install("claude", home, extra_args="slug=intent-router")
        if err:
            report(name, False, err)
            return
        skill_md = os.path.join(home, ".claude", "skills", "intent-router", "SKILL.md")
        if not os.path.isfile(skill_md):
            listing = []
            root = os.path.join(home, ".claude", "skills")
            for dirpath, _, files in os.walk(root):
                for f in files[:5]:
                    listing.append(os.path.relpath(os.path.join(dirpath, f), root))
            report(name, False, f"no {skill_md!r}; found instead: {listing[:8]}")
            return
        fm = frontmatter(skill_md)
        if not fm or not fm.get("description"):
            report(name, False, "SKILL.md has no `description` in frontmatter — Claude can't decide when to load it")
            return
        report(name, True)
    finally:
        shutil.rmtree(home, ignore_errors=True)


def check_claude_catalog():
    """The full catalog should install as one router skill, not loose files."""
    name = "claude: the catalog installs as a router skill with SKILL.md"
    home = tempfile.mkdtemp(prefix="usb-fmt-")
    try:
        _, err = run_install("claude", home, extra_args="preset=web-dev")
        if err:
            report(name, False, err)
            return
        skills_root = os.path.join(home, ".claude", "skills")
        router = os.path.join(skills_root, "usb", "SKILL.md")
        if not os.path.isfile(router):
            report(name, False, f"no router at {router!r}")
            return
        fm = frontmatter(router)
        if not fm or not fm.get("description"):
            report(name, False, "router SKILL.md has no `description` in frontmatter")
            return
        # Nothing may sit directly in ~/.claude/skills as a loose file, and
        # every directory there must carry a SKILL.md or Claude ignores it.
        stray = [e for e in os.listdir(skills_root) if os.path.isfile(os.path.join(skills_root, e))]
        if stray:
            report(name, False, f"loose files in ~/.claude/skills that Claude ignores: {stray[:5]}")
            return
        for entry in os.listdir(skills_root):
            d = os.path.join(skills_root, entry)
            if os.path.isdir(d) and not os.path.isfile(os.path.join(d, "SKILL.md")):
                report(name, False, f"~/.claude/skills/{entry}/ has no SKILL.md — Claude ignores it")
                return
        report(name, True)
    finally:
        shutil.rmtree(home, ignore_errors=True)


def check_cursor_project_scoped():
    """Cursor only reads .cursor/rules from inside the project."""
    name = "cursor: the rule lands in the project's .cursor/rules, not $HOME"
    home = tempfile.mkdtemp(prefix="usb-fmt-")
    project = tempfile.mkdtemp(prefix="usb-proj-")
    try:
        _, err = run_install("cursor", home, extra_args="slug=intent-router", cwd=project)
        if err:
            report(name, False, err)
            return
        rules_dir = os.path.join(project, ".cursor", "rules")
        mdc = [f for f in os.listdir(rules_dir)] if os.path.isdir(rules_dir) else []
        if not mdc:
            report(name, False, f"no .mdc written to the project's {rules_dir!r}")
            return
        home_rules = os.path.join(home, ".cursor", "rules")
        if os.path.isdir(home_rules) and os.listdir(home_rules):
            report(name, False, "still writing to ~/.cursor/rules, which Cursor never reads")
            return
        fm = frontmatter(os.path.join(rules_dir, mdc[0]))
        if not fm or "description" not in fm:
            report(name, False, "the .mdc has no `description` frontmatter")
            return
        report(name, True)
    finally:
        shutil.rmtree(home, ignore_errors=True)
        shutil.rmtree(project, ignore_errors=True)


print(f"Checking installed layouts against runtime requirements ({BASE_URL})\n")
check_claude_single()
check_claude_catalog()
check_cursor_project_scoped()

print()
if failures:
    print(f"Target format checks FAILED ❌ ({len(failures)}: {', '.join(failures)})")
    sys.exit(1)
print("Target format checks passed ✅")
