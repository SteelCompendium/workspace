#!/bin/bash
# usage: count3.sh <label>: process count before / after 3 jest runs of the cdpOwned test file
P=/home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race/draw-steel-elements
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc551-r1-impl
cnt() { ps -eo args | command grep -a "const http=require('http'),fs=require('fs')\|^bash -c \"\$0\" -e" | command grep -av grep | wc -l; }
echo "$1 before: leaked processes = $(cnt)"
for i in 1 2 3; do
  (cd $P && npx jest test/unit/build/cdpOwned.test.ts > $S/count3-$1-$i.log 2>&1)
  echo "$1 run $i: $(command grep -a '^Tests:' $S/count3-$1-$i.log)  leaked processes now = $(cnt)"
done
