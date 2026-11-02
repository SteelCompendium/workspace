# downstream symptom: A short (CTR-F01), B long (stamina-bar element). Retry until both pick the same display.
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r1-impl
T1=/home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements
T2=$S/sc546-r1-tree2
for i in 1 2 3 4; do
  BAR=$(( $(date +%s%3N) + 40000 )); export SC546_BARRIER=$BAR
  L1=$S/sc546-r1-B-down-try$i-A.log; L2=$S/sc546-r1-B-down-try$i-B.log
  ( cd $T1 && node e2e/run.mjs --only=CTR-F01 --shards=1 > $L1 2>&1; echo "rc=$?" >> $L1 ) &
  ( cd $T2 && node e2e/run.mjs --element=stamina-bar --shards=1 > $L2 2>&1; echo "rc=$?" >> $L2 ) &
  wait
  DA=$(grep -a -o 'display :[0-9]*' $L1 | head -1); DB=$(grep -a -o 'display :[0-9]*' $L2 | head -1)
  echo "try $i: A $DA | B $DB | B: $(grep -a -o 'OBSIDIAN-E2E done: [^,]*, [0-9]* failed' $L2) $(grep -a '^rc=' $L2)"
  [ "$DA" = "$DB" ] && break
done
