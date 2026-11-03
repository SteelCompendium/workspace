#!/bin/bash
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc551-r1-impl
P=/home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race/draw-steel-elements
E=/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r6-evidence
export SCRATCH=$S/r6scratch
TRIES=3 OFFSET=0 node $E/p-two-cameras-r4.mjs $P r6-0 :5460 > $E/H1-r6-offset0.log 2>&1
command grep -a 'try [0-9] [AB]:\|SUMMARY\|environment' $E/H1-r6-offset0.log | cut -c1-300
