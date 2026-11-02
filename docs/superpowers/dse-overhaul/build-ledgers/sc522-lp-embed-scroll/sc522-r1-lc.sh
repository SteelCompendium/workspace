#!/usr/bin/env bash
# lc.sh <tag> <only-ids>: the IN-TREE lifecycle harness against the in-tree build (built by build.sh proto first)
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc522-r1-ab29016d2a82150ae
W=/home/scott/code/steelCompendium/worktrees/sc522-lp-embed-scroll/draw-steel-elements
T=$1; ONLY=$2
LOG="$S/lc-$T.log"
echo "main.js $(sha256sum "$W/main.js" | cut -c1-12) styles.css $(sha256sum "$W/styles.css" | cut -c1-12)" > "$LOG"
DSE_LIFECYCLE_PORT=9522 timeout 590 node "$W/visual-harness/obsidian-lifecycle.mjs" --only="$ONLY" >> "$LOG" 2>&1
rc=$?
echo "rc=$rc" >> "$LOG"
echo "rc=$rc" > "$S/lc-$T.rc"
grep -E "OBSIDIAN-LIFECYCLE" "$LOG" | sed -E 's/^(OBSIDIAN-LIFECYCLE [^ ]+ ok).*/\1/' | cut -c1-400
echo "rc=$rc"
