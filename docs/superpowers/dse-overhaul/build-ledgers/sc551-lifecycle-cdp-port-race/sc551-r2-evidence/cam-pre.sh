#!/bin/bash
P=/home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race/draw-steel-elements
E=/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r2-evidence
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc551-r1-impl
node -e "require('net').createServer(s=>s.end()).listen(47451,()=>console.log('up'))" > $E/cam-pre-listener.log 2>&1 &
LP=$!
sleep 1
DSE_CAMERA_PORT=47451 DSE_CAMERA_TMP=$S/camtmp-pre DSE_CAMERA_DISPLAY=:5439 node $P/visual-harness/obsidian-camera.mjs --element=stamina-bar --bg=dark > $E/cam-pre-busy.log 2>&1; echo "busy port rc=$?"
kill $LP
DSE_CAMERA_PORT=abc DSE_CAMERA_TMP=$S/camtmp-pre DSE_CAMERA_DISPLAY=:5439 node $P/visual-harness/obsidian-camera.mjs --element=stamina-bar --bg=dark > $E/cam-pre-bad.log 2>&1; echo "bad value rc=$?"
cat $E/cam-pre-busy.log $E/cam-pre-bad.log
