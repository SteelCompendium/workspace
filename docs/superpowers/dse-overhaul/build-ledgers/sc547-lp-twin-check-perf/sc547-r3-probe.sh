#!/bin/bash
# usage: probe.sh <run-name> <bundle-label> <cases csv> [gsi]   runs the r2 probe harness on $R/bundle-<label> into $R/runs/<run-name>/
R=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc547-r3-impl-a2
W=/home/scott/code/steelCompendium/worktrees/sc547-lp-twin-check-perf/draw-steel-elements
run="$1"; label="$2"; cases="$3"; gsi="$4"
OUTD="$R/runs/$run"
mkdir -p "$OUTD/shots"
cp "$R/harness-r2.mjs" "$OUTD/harness.mjs"
cd "$W" || exit 9
uptime > "$OUTD/uptime-before.txt"
start=$(date +%s)
if [ "$gsi" = gsi ]; then
  R537_GSI=1 R537_OUT="$OUTD" R537_CASES="$cases" R537_INSTR="$R/r3-instr.js" DSE_LIFECYCLE_BUNDLE="$R/bundle-$label" node "$OUTD/harness.mjs" --only=R537 > "$OUTD/lifecycle.log" 2>&1
else
  R537_OUT="$OUTD" R537_CASES="$cases" R537_INSTR="$R/r3-instr.js" DSE_LIFECYCLE_BUNDLE="$R/bundle-$label" node "$OUTD/harness.mjs" --only=R537 > "$OUTD/lifecycle.log" 2>&1
fi
rc=$?
end=$(date +%s)
uptime > "$OUTD/uptime-after.txt"
echo "rc=$rc elapsed=$((end-start))s" >> "$OUTD/lifecycle.log"
exit $rc
