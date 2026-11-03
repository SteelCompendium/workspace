#!/bin/bash
# usage: lc.sh <logfile> <only-ids> <bundle-label>  runs the worktree's lifecycle harness on bundle-<label>, port 9652
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc552-r1-diag-q4n8
W=/home/scott/code/steelCompendium/worktrees/sc552-twin-form-after-click/draw-steel-elements
log="$1"; only="$2"; label="$3"
: > "$log"
start=$(date +%s)
export DSE_LIFECYCLE_BUNDLE="$S/bundle-$label"
echo "bundle=$DSE_LIFECYCLE_BUNDLE sha=$(sha256sum $S/bundle-$label/main.js | cut -c1-16) load=$(cat /proc/loadavg)" >> "$log"
DSE_LIFECYCLE_PORT=9652 node "$W/visual-harness/obsidian-lifecycle.mjs" "--only=$only" >> "$log" 2>&1
rc=$?
end=$(date +%s)
echo "rc=$rc elapsed=$((end-start))s" >> "$log"
grep -E "OBSIDIAN-LIFECYCLE .*(FAIL|done|kept)|^rc=" "$log"
