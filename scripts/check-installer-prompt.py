#!/usr/bin/env python3
"""Regression tests for the installer's interactive runtime picker.

Two real bugs shipped here, both invisible to a naive test:

1. `curl ... | bash` makes the installer's stdin the pipe carrying its own
   script text. A bare `select` reads those leftover lines as answers,
   prints "Invalid choice" once per line (81605 times in the reported case),
   never waits for the user, and exits as if it succeeded.

2. Windows terminals deliver Enter as CRLF, leaving a trailing \\r in REPLY
   that stops `select` from matching it to an option.

The first bug survived an earlier "verified" test because that test ran
`bash install.sh` (script as an argument, stdin free) instead of the path
users actually take. These tests therefore drive the *real* invocation,
`curl ... | bash`, and feed CRLF specifically.

Run: python3 scripts/check-installer-prompt.py [base_url]
"""

import os
import shutil
import select
import subprocess
import sys
import tempfile
import time

BASE_URL = (sys.argv[1] if len(sys.argv) > 1 else "https://usb.peepsicklabs.com").rstrip("/")
INSTALL_URL = f"{BASE_URL}/api/install?target=auto"

# The picker only appears when several runtimes are detected, so every test
# runs against a HOME faked to look like a machine with three of them.
FAKE_RUNTIME_DIRS = (".claude", ".hermes", ".cursor")

failures = []


def make_fake_home():
    home = tempfile.mkdtemp(prefix="usb-prompt-test-")
    for d in FAKE_RUNTIME_DIRS:
        os.makedirs(os.path.join(home, d), exist_ok=True)
    return home


def report(name, ok, detail=""):
    print(f"── {name}")
    if ok:
        print("✅ OK")
    else:
        print(f"❌ FAILED: {detail}")
        failures.append(name)


def test_non_interactive_does_not_loop():
    """No tty (CI, cron, `| bash` from a script): must fall back, never spin."""
    name = "curl | bash with no terminal falls back instead of looping"
    home = make_fake_home()
    try:
        proc = subprocess.run(
            ["bash", "-c", f'curl -fsSL "{INSTALL_URL}" | bash'],
            env={**os.environ, "HOME": home},
            capture_output=True,
            text=True,
            timeout=180,
            stdin=subprocess.DEVNULL,
        )
    except subprocess.TimeoutExpired:
        report(name, False, "timed out — the picker is looping on a non-tty stdin again")
        shutil.rmtree(home, ignore_errors=True)
        return
    out = proc.stdout + proc.stderr
    shutil.rmtree(home, ignore_errors=True)

    invalid = out.count("Invalid choice")
    if invalid:
        report(name, False, f'printed "Invalid choice" {invalid}x — it is consuming its own script text as input')
        return
    if "installed for target" not in out:
        report(name, False, f"never completed an install; tail:\n{out[-600:]}")
        return
    report(name, True)


def test_interactive_crlf_selection():
    """Real terminal + Windows-style CRLF: must wait, then select correctly."""
    name = "curl | bash on a terminal accepts CRLF input and installs"
    try:
        import pty
    except ImportError:
        print(f"── {name}")
        print("⏭️  SKIPPED (no pty on this platform — run this check on Linux/macOS)")
        return

    home = make_fake_home()
    pid, fd = pty.fork()
    if pid == 0:
        os.environ["HOME"] = home
        os.execvp("bash", ["bash", "-c", f'curl -fsSL "{INSTALL_URL}" | bash'])

    out = b""
    sent = False
    deadline = time.time() + 180
    while time.time() < deadline:
        r, _, _ = select.select([fd], [], [], 0.5)
        if r:
            try:
                chunk = os.read(fd, 8192)
            except OSError:
                break
            if not chunk:
                break
            out += chunk
        if not sent and b"number)" in out:
            time.sleep(0.3)
            os.write(fd, b"1\r\n")  # CRLF on purpose — this is the Windows case
            sent = True
        if b"installed for target" in out:
            time.sleep(1)
            break

    try:
        os.kill(pid, 9)
        os.waitpid(pid, 0)
    except OSError:
        pass
    shutil.rmtree(home, ignore_errors=True)

    text = out.decode(errors="replace")
    if "number)" not in text:
        report(name, False, f"the picker prompt never appeared; tail:\n{text[-600:]}")
        return
    invalid = text.count("Invalid choice")
    if invalid:
        report(name, False, f'rejected valid CRLF input {invalid}x — the trailing \\r is not being stripped')
        return
    if not sent:
        report(name, False, "never reached a point where input could be sent")
        return
    if "installed for target" not in text:
        report(name, False, f"selection did not lead to an install; tail:\n{text[-600:]}")
        return
    report(name, True)


print(f"Checking installer prompt against {BASE_URL}\n")
test_non_interactive_does_not_loop()
test_interactive_crlf_selection()

print()
if failures:
    print(f"Installer prompt checks FAILED ❌ ({len(failures)}: {', '.join(failures)})")
    sys.exit(1)
print("Installer prompt checks passed ✅")
