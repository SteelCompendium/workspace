#!/bin/bash
# run3.sh <variant bundle> <tag>
M=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc540-r3-impl-a1
W=/home/scott/code/steelCompendium/worktrees/sc540-lp-callout-click-source/draw-steel-elements
node $M/mkharness.cjs $W/visual-harness/obsidian-lifecycle.mjs $M/visual-harness/harness-p3-$2.mjs $M/probe3.mjs.txt > /dev/null || exit 9
mkdir -p $M/out
S540_REPO=$W P3_OUT=$M/out P3_VAR=$2 DSE_LIFECYCLE_PORT=9544 DSE_LIFECYCLE_BUNDLE=$M/bundles/$1 timeout 300 node $M/visual-harness/harness-p3-$2.mjs --only=P3 > $M/logs/p3-$2.log 2>&1
echo "rc=$?" >> $M/logs/p3-$2.log
grep -E "P3 |advance:|projroll:|FAIL|rc=" $M/logs/p3-$2.log | cut -c1-500
