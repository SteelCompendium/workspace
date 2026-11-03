#!/bin/bash
# SC-551 r6: non-exec wrapper as DSE_LIFECYCLE_BIN and as DSE_CAMERA_BIN (default port 0), control /usr/bin/obsidian.
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc551-r1-impl
P=/home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race/draw-steel-elements
E=/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r6-evidence
export XVFB_BIN=$P/.devbox/nix/profile/default/bin/Xvfb
unset DSE_LIFECYCLE_PORT DSE_CAMERA_PORT
DSE_LIFECYCLE_BIN=$S/obsidian-wrapper.sh timeout 200 node $P/visual-harness/obsidian-lifecycle.mjs --only=G-S6b > $E/wrapper-lifecycle.log 2>&1; echo "lifecycle wrapper rc=$?"
command grep -a 'OBSIDIAN-LIFECYCLE' $E/wrapper-lifecycle.log | cut -c1-240
DSE_LIFECYCLE_BIN=/usr/bin/obsidian timeout 200 node $P/visual-harness/obsidian-lifecycle.mjs --only=G-S6b > $E/wrapper-lifecycle-control.log 2>&1; echo "lifecycle control rc=$?"
command grep -a 'OBSIDIAN-LIFECYCLE' $E/wrapper-lifecycle-control.log | cut -c1-240
