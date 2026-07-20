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

USB=(${USB_BIN:-bash packages/cli/bin/usb})
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
  if echo "$output" | grep -qP '[çğıöşüÇĞİÖŞÜ]'; then
    echo "❌ FAILED (non-English text found): $desc"
    echo "$output" | grep -P '[çğıöşüÇĞİÖŞÜ]'
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

echo
if [ "$FAILED" = "1" ]; then
  echo "README examples FAILED ❌"
  exit 1
fi
echo "README examples passed ✅"
