#!/bin/bash
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc551-r1-impl
E=/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r4-evidence
export SCRATCH=$S/r4scratch
TRIES=3 OFFSET=0 node $E/p-two-cameras-r4.mjs $S/before-wt before-0 :5460 > $E/H1-before-offset0.log 2>&1
TRIES=3 OFFSET=300 node $E/p-two-cameras-r4.mjs $S/before-wt before-300 :5461 > $E/H1-before-offset300.log 2>&1
command grep -a 'try [0-9] [AB]:\|SUMMARY' $E/H1-before-offset0.log $E/H1-before-offset300.log | sed "s|$E/||" | cut -c1-260
