#!/bin/bash
# usage: pr-run.sh <run-name> <bundle-label> <cases csv> [proto js]
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc552-r1-diag-q4n8
run="$1"; label="$2"; cases="$3"; proto="$4"
OUTD="$S/runs/$run"
mkdir -p "$OUTD/shots"
python3 "$S/mkharness.py" "$S/p552-scenario.mjs" "$S/p552-fixtures.js" "$OUTD/harness.mjs" PR_OUT > "$OUTD/mk.log" 2>&1
echo "mk rc=$?" >> "$OUTD/mk.log"
start=$(date +%s)
echo "bundle=$label sha=$(sha256sum $S/bundle-$label/main.js | cut -c1-16) proto=$proto load=$(cat /proc/loadavg)" > "$OUTD/lifecycle.log"
if [ -n "$proto" ]; then export PR_PROTO="$S/$proto"; fi
PR_OUT="$OUTD" PR_PAGE="$S/p552-page.js" PR_CASES="$cases" DSE_LIFECYCLE_BUNDLE="$S/bundle-$label" DSE_LIFECYCLE_PORT=9652 node "$OUTD/harness.mjs" --only=PR552 >> "$OUTD/lifecycle.log" 2>&1
rc=$?
end=$(date +%s)
echo "rc=$rc elapsed=$((end-start))s" >> "$OUTD/lifecycle.log"
grep -E "^PR552|OBSIDIAN-LIFECYCLE (done|PR552|environment)|^rc=" "$OUTD/lifecycle.log"
