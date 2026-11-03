#!/bin/bash
# SC-551 r5 L-2 probe: docs-shots (r4 private clone) with ONLY an obsidian entry and a camera environment failure
# (DSE_CAMERA_PORT not a number -> camera exit 2 before any spawn). Expected: docs-shots exits 2, not 1.
# Second case: a held pinned port (any listener) -> camera exit 2 -> docs-shots 2.
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc551-r5
W=$S/r4wt
export XVFB_BIN=/home/scott/code/steelCompendium/workspace/draw-steel-elements/.devbox/nix/profile/default/bin/Xvfb
export DSE_DOCS_DISPLAY=:5463
export DSE_CAMERA_TMP=$S/l2-camtmp
DSE_CAMERA_PORT=notaport node $W/visual-harness/docs-shots.mjs --only=simple_feature_power_roll.png > $S/l2-badport.log 2>&1
echo "bad port: docs-shots rc=$?"
node -e "require('net').createServer().listen(48801,'127.0.0.1',()=>console.log('held'));setTimeout(()=>process.exit(0),60000)" > $S/l2-holder.log 2>&1 &
HOLDER=$!
sleep 1
DSE_CAMERA_PORT=48801 node $W/visual-harness/docs-shots.mjs --only=simple_feature_power_roll.png > $S/l2-busyport.log 2>&1
echo "busy port: docs-shots rc=$?"
kill $HOLDER
grep -a -E 'environment|exited|failed' $S/l2-badport.log $S/l2-busyport.log | cut -c1-220
