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
  # "syntaxerror" and the fallback warnings are here because a broken inline
  # Python snippet (a \" that reaches Python literally inside an f-string)
  # printed a SyntaxError and then silently degraded to a raw-grep fallback,
  # still exiting 0 — an earlier version of this check looked only for
  # tracebacks and passed it.
  if echo "$output" | grep -qiE "traceback|jsondecodeerror|errno [0-9]|syntaxerror|python3 not available|could not load"; then
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
check "usb list"                             "${USB[@]}" list
check "usb install intent-router --dry-run"  "${USB[@]}" install intent-router --dry-run
check "usb install web-dev --dry-run"        "${USB[@]}" install web-dev --dry-run

# The installer's interactive picker has its own dedicated regression suite —
# it needs a pseudo-terminal to test honestly, which is awkward in bash.
# See scripts/check-installer-prompt.py (also wired into CI).

# The CLI's own menu shares the CRLF hazard: Windows terminals deliver Enter
# as \r\n, leaving a trailing \r that stops `select` matching an option.
# Option 8 (Exit) needs no follow-up input and no network side effects, so it
# isolates that cleanly.
echo "── usb CLI: interactive menu accepts CRLF input"
crlf_out=$(printf '8\r\n' | timeout 30 "${USB[@]}" i 2>&1)
if [ $? != 0 ]; then
  echo "❌ FAILED (non-zero exit or hang on CRLF input)"
  echo "$crlf_out" | tail -20
  FAILED=1
elif echo "$crlf_out" | grep -q "Invalid choice"; then
  echo "❌ FAILED (CRLF input rejected — the trailing \\r is not being stripped)"
  echo "$crlf_out" | tail -20
  FAILED=1
elif ! echo "$crlf_out" | grep -q "Bye!"; then
  echo "❌ FAILED (menu never acted on the selection)"
  echo "$crlf_out" | tail -20
  FAILED=1
else
  echo "✅ OK"
fi

echo
if [ "$FAILED" = "1" ]; then
  echo "README examples FAILED ❌"
  exit 1
fi
echo "README examples passed ✅"
