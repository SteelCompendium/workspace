#!/bin/bash
# usage: probe547.sh <run-name> <bundle-dir> <cases csv>   runs the cost probe on a bundle into $S/runs/<run-name>/ (OS-assigned CDP port)
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc547-r1-impl-a1
W=/home/scott/code/steelCompendium/worktrees/sc547-lp-twin-check-perf/draw-steel-elements
run="$1"; bundle="$2"; cases="$3"
OUTD="$S/runs/$run"
mkdir -p "$OUTD/shots"
python3 "$S/mk547.py" > "$OUTD/mk.log" 2>&1
echo "mk rc=$?" >> "$OUTD/mk.log"
cp "$S/harness-r547.mjs" "$OUTD/harness.mjs"
cd "$W" || exit 9
uptime > "$OUTD/uptime-before.txt"
start=$(date +%s)
R537_OUT="$OUTD" R537_CASES="$cases" R537_INSTR="$S/r3-instr.js" DSE_LIFECYCLE_BUNDLE="$bundle" node "$S/harness-r547.mjs" --only=R537 > "$OUTD/lifecycle.log" 2>&1
rc=$?
end=$(date +%s)
uptime > "$OUTD/uptime-after.txt"
echo "rc=$rc elapsed=$((end-start))s" >> "$OUTD/lifecycle.log"
