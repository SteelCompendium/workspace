#!/bin/bash
# SC-551 r5 probe: lifecycle (r4 private clone, Xvfb range moved to :5440-:5454 in the clone only) with
# DSE_LIFECYCLE_BIN = a non-exec wrapper script, default port 0. r4 requires the DevTools LISTEN socket to be
# under /proc/<child.pid>/fd; with a wrapper, child.pid is bash, the socket belongs to its child.
# Control: the same run with DSE_LIFECYCLE_BIN=/usr/bin/obsidian.
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc551-r5
W=$S/r4wt
export XVFB_BIN=/home/scott/code/steelCompendium/workspace/draw-steel-elements/.devbox/nix/profile/default/bin/Xvfb
unset DSE_LIFECYCLE_PORT
chmod +x $S/obsidian-wrapper.sh
DSE_LIFECYCLE_BIN=$S/obsidian-wrapper.sh timeout 200 node $W/visual-harness/obsidian-lifecycle.mjs --only=G-S6b > $S/wrapper-run.log 2>&1
echo "wrapper: rc=$?"
grep -a 'OBSIDIAN-LIFECYCLE' $S/wrapper-run.log | cut -c1-240
DSE_LIFECYCLE_BIN=/usr/bin/obsidian timeout 200 node $W/visual-harness/obsidian-lifecycle.mjs --only=G-S6b > $S/wrapper-control.log 2>&1
echo "control: rc=$?"
grep -a 'OBSIDIAN-LIFECYCLE' $S/wrapper-control.log | cut -c1-240
