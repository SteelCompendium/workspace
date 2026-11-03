#!/bin/bash
P=/home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race/draw-steel-elements
E=/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r2-evidence
R2_MODE=stale node $E/r2-camera-repro.mjs $P stale1 47421 47422 5400 > $E/F-camera-stale-1.log 2>&1
command grep -a 'STALE\|attached\|cdp:\|spawned\|RESULT\|all .* shots\|DECOY' $E/F-camera-stale-1.log | cut -c1-260
