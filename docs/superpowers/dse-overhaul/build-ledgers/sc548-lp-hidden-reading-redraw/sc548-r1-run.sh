#!/bin/bash
# sc548 r1 runner: sc548-r1-run.sh <bundle> <only-ids> <tag> [env assignments...]
# The harness copy lives in the stock export's visual-harness/ (so ../scripts and node_modules resolve inside the scratch
# export), takes the bundle from bundles/<bundle>/ and the in-tree lifecycle harness of the worktree as its source.
# Writes logs/sc548-r1-<tag>.log and .rc (unique per tag). Never edits the worktree.
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc548-r1-reviewer
W=/home/scott/code/steelCompendium/worktrees/sc548-lp-hidden-reading-redraw/draw-steel-elements
HT="$S/bundles/stock/tree"
V=$1; ONLY=$2; TAG=$3; shift 3
mkdir -p "$S/logs"
H="$HT/visual-harness/sc548-r1-h-$TAG.mjs"
LOG="$S/logs/sc548-r1-$TAG.log"
RC="$S/logs/sc548-r1-$TAG.rc"
[ -e "$LOG" ] && { echo "log exists: $LOG"; exit 7; }
node "$S/sc548-r1-mkharness.cjs" "$W/visual-harness/obsidian-lifecycle.mjs" "$H" "$S/sc548-r1-probe-block.mjs.txt" > "$LOG" 2>&1 || { echo "rc=9 mk-failed" > "$RC"; exit 9; }
echo "bundle: $V main.js $(sha256sum "$S/bundles/$V/main.js" | cut -c1-12) only=$ONLY env=[$*]" >> "$LOG"
echo "loadavg-start: $(cat /proc/loadavg) date: $(date +%T)" >> "$LOG"
env "$@" XVFB_BIN=/home/scott/code/steelCompendium/workspace/draw-steel-elements/.devbox/nix/profile/default/bin/Xvfb DSE_LIFECYCLE_BUNDLE="$S/bundles/$V" timeout 590 node "$H" --only="$ONLY" >> "$LOG" 2>&1
rc=$?
echo "loadavg-end: $(cat /proc/loadavg) date: $(date +%T)" >> "$LOG"
echo "rc=$rc" >> "$LOG"
echo "porcelain-after: [$(git -C "$W" status --porcelain | tr '\n' ' ')] head: $(git -C "$W" rev-parse --short HEAD)" >> "$LOG"
echo "rc=$rc" > "$RC"
grep -E "OBSIDIAN-LIFECYCLE (done|start)|FAIL" "$LOG" | cut -c1-600
exit $rc
