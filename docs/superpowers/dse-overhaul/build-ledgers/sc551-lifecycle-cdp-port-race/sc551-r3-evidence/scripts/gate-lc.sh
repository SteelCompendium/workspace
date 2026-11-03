#!/bin/bash
# usage: gate-lc.sh <label> <port|default> <only-list>
# One lifecycle gate run in the SC-551 fix worktree (unmodified), output to the r3 scratch dir.
LABEL=$1; PORTARG=$2; ONLY=$3
P=/home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race/draw-steel-elements
R=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc551-r3-review
export XVFB_BIN=$P/.devbox/nix/profile/default/bin/Xvfb
unset DSE_LIFECYCLE_PORT
if [ "$PORTARG" != "default" ]; then export DSE_LIFECYCLE_PORT=$PORTARG; fi
npm --prefix $P run --silent build-no-check > $R/$LABEL-build.log 2>&1 || { echo "build failed"; exit 9; }
timeout 580 node $P/visual-harness/obsidian-lifecycle.mjs --only=$ONLY > $R/$LABEL.log 2>&1
RC=$?
echo "rc=$RC"
grep -a -E 'OBSIDIAN-LIFECYCLE (start|done|environment)|FAIL' $R/$LABEL.log | cut -c1-240
exit $RC
