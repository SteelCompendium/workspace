#!/bin/bash
# sc472 r1 runner: run.sh <bundle> <only-ids> <tag> [env assignments...]
# Writes logs/<tag>-<bundle>.log and logs/<tag>-<bundle>.rc (unique per run tag). Never edits the tree.
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc472-r1-a5d5f8c00377afd62
D=/home/scott/code/steelCompendium/worktrees/sc472-scroll-pin-timer/draw-steel-elements
V=$1; ONLY=$2; TAG=$3; shift 3
mkdir -p "$S/logs" "$S/h"
H="$S/h/harness-$TAG-$V.mjs"
LOG="$S/logs/$TAG-$V.log"
RC="$S/logs/$TAG-$V.rc"
node "$S/mkharness.cjs" "$D/visual-harness/obsidian-lifecycle.mjs" "$H" "$S/p472-block.mjs.txt" > "$LOG" 2>&1 || { echo "rc=9 mk-failed" > "$RC"; exit 9; }
echo "loadavg-start: $(cat /proc/loadavg) date: $(date +%T)" >> "$LOG"
env "$@" P472_REPO="$D" DSE_LIFECYCLE_PORT=${P472_PORT:-9472} DSE_LIFECYCLE_BUNDLE="$S/bundles/$V" node "$H" --only="$ONLY" >> "$LOG" 2>&1
rc=$?
echo "loadavg-end: $(cat /proc/loadavg) date: $(date +%T)" >> "$LOG"
echo "rc=$rc" >> "$LOG"
echo "porcelain-after: [$(git -C "$D" status --porcelain | tr '\n' ' ')] head: $(git -C "$D" rev-parse --short HEAD)" >> "$LOG"
echo "rc=$rc" > "$RC"
exit $rc
