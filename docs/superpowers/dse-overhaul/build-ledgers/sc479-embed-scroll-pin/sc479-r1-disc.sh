#!/usr/bin/env bash
# SC-479 r1 discrimination: s479-disc.sh <reps> <only-ids> <variant...>; one log per (variant, rep) + a summary line each.
# Runs the IN-TREE harness (which holds G-S42 while the prototype is applied) against bundles/<variant>; no probes.
set -u
N=$1; ONLY=$2; shift 2
D=/home/scott/code/steelCompendium/worktrees/sc479-embed-scroll-pin/draw-steel-elements
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc479-r1-ab09d580
cd "$D" || exit 9
for v in "$@"; do
  for i in $(seq 1 "$N"); do
    LOG="$S/s479-disc$i-$v.log"
    DSE_LIFECYCLE_PORT=9479 DSE_LIFECYCLE_BUNDLE="$S/bundles/$v" node visual-harness/obsidian-lifecycle.mjs --only="$ONLY" > "$LOG" 2>&1
    rc=$?
    echo "rc=$rc" >> "$LOG"
    echo "$v run $i rc=$rc :: $(grep -E 'OBSIDIAN-LIFECYCLE (G-|done|temp)' "$LOG" | tr '\n' ' ')" >> "$S/s479-disc-summary.log"
  done
done
