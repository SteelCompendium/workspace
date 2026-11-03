#!/bin/bash
P=/home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race/draw-steel-elements
E=/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r6-evidence
cd $P
npm run tsc > $E/r6-gate-tsc.log 2>&1; echo "tsc rc=$?"
npm run lint > $E/r6-gate-lint.log 2>&1; echo "lint rc=$?"
npx jest > $E/r6-gate-jest.log 2>&1; echo "jest rc=$?"
