#!/usr/bin/env bash
# disc.sh <variant...>: 2 runs each of --only=G-S8,G-S15,G-S18,G-S42 against bundles/<variant>
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc479-r4-aa25
D=/home/scott/code/steelCompendium/worktrees/sc479-embed-scroll-pin/draw-steel-elements
cd "$D" || exit 9
for v in "$@"; do
  for i in 1 2; do
    LOG="$S/disc-$v-run$i.log"
    DSE_LIFECYCLE_PORT=9482 DSE_LIFECYCLE_BUNDLE="$S/bundles/$v" node visual-harness/obsidian-lifecycle.mjs --only=G-S8,G-S15,G-S18,G-S42 > "$LOG" 2>&1
    rc=$?
    echo "rc=$rc" >> "$LOG"
    echo "$v run $i rc=$rc :: $(grep -E 'OBSIDIAN-LIFECYCLE (G-|done)' "$LOG" | cut -c1-60 | tr '\n' '|')" >> "$S/disc-summary.log"
  done
done
echo "$*" > "$S/disc-done-$1.rc"
