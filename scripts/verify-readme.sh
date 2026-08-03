#!/usr/bin/env bash
# Runs the commands documented in README.md's Quickstart / "See it in action"
# sections and fails the build if any of them:
#   - exits non-zero
#   - leaks an error (Python traceback, JSON decode error, errno) into stdout
#     instead of failing loudly — this is how the cmd_search heredoc/pipe
#     stdin bug slipped through silently before it was caught by hand
#   - contains leftover non-English text (e.g. untranslated Turkish strings)
#
# This hardcodes the commands rather than parsing README.md directly. Keep
# the two in sync by hand for now; a real README-block-driven harness is
# tracked as a follow-up (see ## Roadmap in README.md).
#
# Deliberately no `set -e`/`set -u`/`set -o pipefail` here: with large
# command-substitution output (the web-dev dry-run alone is ~750KB), bash
# has been observed to silently truncate `output=$(...)` under pipefail,
# which defeats the checks below without any error. Failures are instead
# caught explicitly via exit codes and content greps.

USB=(${USB_BIN:-bash packages/cli/bin/usb.sh})
FAILED=0

check() {
  local desc="$1"
  shift
  echo "── $desc"
  local output
  if ! output=$("$@" 2>&1); then
    echo "❌ FAILED (non-zero exit): $desc"
    echo "$output" | tail -20
    FAILED=1
    return
  fi
  if echo "$output" | grep -qiE "traceback|jsondecodeerror|errno [0-9]"; then
    echo "❌ FAILED (error output leaked through): $desc"
    echo "$output" | tail -20
    FAILED=1
    return
  fi
  # Python, not `grep -P`: grep -P's Unicode character-class matching has
  # been observed to false-positive on plain emoji (✅ 📦 🔌 💡) in some
  # locale/PCRE combinations, which would make this check untrustworthy.
  # Python's re operates on properly decoded text, so it doesn't.
  if ! printf '%s' "$output" | python3 -c "
import sys
sys.stdin.reconfigure(encoding='utf-8')
turkish = set('çğıöşüÇĞİÖŞÜ')
hits = [line.rstrip() for line in sys.stdin if any(ch in turkish for ch in line)]
if hits:
    print('\n'.join(hits))
    sys.exit(1)
"; then
    echo "❌ FAILED (non-English text found): $desc"
    FAILED=1
    return
  fi
  echo "✅ OK"
}

check "usb version"                          "${USB[@]}" version
check "usb search postgres"                  "${USB[@]}" search postgres
check "usb info intent-router"               "${USB[@]}" info intent-router
check "usb install intent-router --dry-run"  "${USB[@]}" install intent-router --dry-run
check "usb install web-dev --dry-run"        "${USB[@]}" install web-dev --dry-run

# --- CRLF regression checks ---------------------------------------------------
# Windows terminals (PowerShell/CMD via Git Bash) can deliver Enter as \r\n,
# leaving a trailing \r in whatever `select`/`read` captured. `case "$REPLY"
# in [1-9])` never matches "1\r", so every interactive picker looped forever
# printing "Invalid choice" instead of ever accepting input — it worked fine
# on Unix and was invisible in CI until a real Windows user hit it. Simulate
# that exact input (a literal "1\r\n", not "1\n") against both pickers so
# this can't silently come back.
check_crlf_picker() {
  local desc="$1" input="$2" success_marker="$3"
  shift 3
  echo "── $desc"
  local output
  output=$(printf "$input" | timeout 20 "$@" 2>&1)
  local rc=$?
  if [ "$rc" != 0 ]; then
    echo "❌ FAILED (non-zero exit or timed out — CRLF input likely hung the picker): $desc"
    echo "$output" | tail -20
    FAILED=1
    return
  fi
  if echo "$output" | grep -q "Invalid choice"; then
    echo "❌ FAILED (CRLF input rejected — the Windows infinite-loop bug is back): $desc"
    echo "$output" | tail -20
    FAILED=1
    return
  fi
  if ! echo "$output" | grep -q "$success_marker"; then
    echo "❌ FAILED (expected success marker '$success_marker' not found): $desc"
    echo "$output" | tail -20
    FAILED=1
    return
  fi
  echo "✅ OK"
}

# The server-rendered install script's runtime picker only appears when
# multiple runtimes are auto-detected, so fake a HOME with several present.
crlf_fake_home=$(mktemp -d)
mkdir -p "$crlf_fake_home/.claude" "$crlf_fake_home/.cursor" "$crlf_fake_home/.hermes"
curl -fsSL "https://usb.peepsicklabs.com/api/install?target=auto" -o "$crlf_fake_home/install.sh" 2>/dev/null
check_crlf_picker "install script: multi-runtime picker accepts CRLF input" \
  '1\r\n' "installed for target: claude" \
  env HOME="$crlf_fake_home" bash "$crlf_fake_home/install.sh"
rm -rf "$crlf_fake_home"

# Option 8 (Exit) needs no follow-up input and no network side effects, so
# it isolates the same select/REPLY bug in the CLI's own menu cleanly.
check_crlf_picker "usb CLI: interactive menu accepts CRLF input" \
  '8\r\n' "Bye!" \
  "${USB[@]}" i

echo
if [ "$FAILED" = "1" ]; then
  echo "README examples FAILED ❌"
  exit 1
fi
echo "README examples passed ✅"
