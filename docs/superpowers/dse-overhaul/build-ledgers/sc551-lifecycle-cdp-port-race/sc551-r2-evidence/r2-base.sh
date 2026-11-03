#!/bin/bash
P=/home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race/draw-steel-elements
E=/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r2-evidence
node --version
node $P/visual-harness/notes-gen.mjs > $E/notes-gen.log 2>&1; echo notes-gen rc=$?
node $E/r2-camera-repro.mjs $P base1 47401 47402 5400 > $E/B-camera-base-1.log 2>&1; echo repro rc=$?
