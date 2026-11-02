#!/bin/bash
# r2run.sh <bundle-variant> <cases comma list|ALL> <tag> [port]
V=$1; CASES=$2; TAG=$3; PORT=${4:-9547}
W=/home/scott/code/steelCompendium/worktrees/sc540-lp-callout-click-source/draw-steel-elements
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc540-r4-review-r1
H=$S/harness-$TAG-$V.mjs
node "$S/r4mkharness.cjs" "$W/visual-harness/obsidian-lifecycle.mjs" "$H" "$S/r4probe.mjs.txt" "$S/r4probe2.mjs.txt" > "$S/logs/mk-$TAG-$V.log" 2>&1 || { echo mk-failed; cat "$S/logs/mk-$TAG-$V.log"; exit 9; }
LOG="$S/logs/run-$TAG-$V.log"
if [ "$CASES" = "ALL" ]; then C=""; else C="$CASES"; fi
mkdir -p "$S/out"
env S540_REPO="$W" R540_OUT="$S/out" R540_VARIANT="$TAG-$V" R540_CASES="$C" DSE_LIFECYCLE_PORT=$PORT DSE_LIFECYCLE_BUNDLE="$S/bundles/$V" timeout 590 node "$H" --only=R540 > "$LOG" 2>&1
rc=$?
echo "rc=$rc" >> "$LOG"
grep -v "^$" "$LOG" | cut -c1-600 | tail -8
echo "rc=$rc log=$LOG"
