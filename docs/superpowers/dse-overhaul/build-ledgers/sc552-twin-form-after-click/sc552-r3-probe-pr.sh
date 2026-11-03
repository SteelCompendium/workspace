#!/bin/bash
# usage: pr.sh <run-name> <bundle-label> <cases csv>
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc552-r3-ad6d3563992bb99bd
run="$1"; label="$2"; cases="$3"
OUTD="$S/runs/$run"
mkdir -p "$OUTD/shots"
python3 "$S/mkharness.py" "$S/scenario.mjs" "$S/fixtures.js" "$OUTD/harness.mjs" PR_OUT > "$OUTD/mk.log" 2>&1 || { cat "$OUTD/mk.log"; exit 3; }
start=$(date +%s)
echo "bundle=$label sha=$(sha256sum $S/bundle-$label/main.js | cut -c1-16) load=$(cat /proc/loadavg)" > "$OUTD/lifecycle.log"
PR_OUT="$OUTD" PR_PAGE="$S/page.js" PR_CASES="$cases" DSE_LIFECYCLE_BUNDLE="$S/bundle-$label" node "$OUTD/harness.mjs" --only=PR552R3 >> "$OUTD/lifecycle.log" 2>&1
rc=$?
end=$(date +%s)
echo "rc=$rc elapsed=$((end-start))s" >> "$OUTD/lifecycle.log"
grep -E "^PR552R3 [^ ]+: |OBSIDIAN-LIFECYCLE (done|PR552R3|environment)|^rc=" "$OUTD/lifecycle.log" | cut -c1-900
