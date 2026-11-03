#!/bin/bash
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc551-r1-impl
E=/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r4-evidence
cd $S/before-wt
git rev-parse HEAD
npm run build-no-check > $E/r4-base-711f740d-build.log 2>&1; echo build rc=$?
sha256sum main.js styles.css
