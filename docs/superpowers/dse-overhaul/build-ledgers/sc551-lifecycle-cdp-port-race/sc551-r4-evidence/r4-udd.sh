#!/bin/bash
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc551-r1-impl
P=/home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race/draw-steel-elements
E=/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r4-evidence
export SCRATCH=$S/r4scratch
node $E/p-shared-udd-r4.mjs $P after :5463 > $E/H1-helper-shared-udd-after.log 2>&1
command grep -a 'try [0-9]*\|SUMMARY' $E/H1-helper-shared-udd-after.log | cut -c1-400
