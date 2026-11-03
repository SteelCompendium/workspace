#!/bin/bash
P=/home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race/draw-steel-elements
E=/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r2-evidence
export XVFB_BIN=$P/.devbox/nix/profile/default/bin/Xvfb
unset DSE_LIFECYCLE_PORT
node $P/visual-harness/obsidian-lifecycle.mjs --only=G-S6b > $E/r2-lifecycle-default-port.log 2>&1; echo "rc=$?"
command grep -a 'OBSIDIAN-LIFECYCLE' $E/r2-lifecycle-default-port.log
