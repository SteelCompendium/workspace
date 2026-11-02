S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r2-review
node $S/sc546-r2-mixed-orch.mjs 20 > $S/sc546-r2-mixed.log 2>&1
echo "rc=$?" >> $S/sc546-r2-mixed.log
ps -eo pid,args | grep -a 'Xvfb :53[4-7][0-9]' | grep -av grep >> $S/sc546-r2-mixed.log
