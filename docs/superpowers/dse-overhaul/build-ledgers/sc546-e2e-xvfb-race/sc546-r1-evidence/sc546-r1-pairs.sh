# usage: bash sc546-r1-pairs.sh <label> <firstPair> <lastPair>   (run under devbox; temp-edited trees)
LABEL="$1"; FIRST="$2"; LAST="$3"
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r1-impl
T1=/home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements
T2=$S/sc546-r1-tree2
for i in $(seq $FIRST $LAST); do
  BAR=$(( $(date +%s%3N) + 40000 ))
  export SC546_BARRIER=$BAR
  L1=$S/sc546-r1-$LABEL-pair$i-A.log; L2=$S/sc546-r1-$LABEL-pair$i-B.log
  ( cd $T1 && node e2e/run.mjs --only=CTR-F01 --shards=1 > $L1 2>&1; echo "rc=$?" >> $L1 ) &
  ( cd $T2 && node e2e/run.mjs --only=CTR-F01 --shards=1 > $L2 2>&1; echo "rc=$?" >> $L2 ) &
  wait
  echo "pair $i: A: $(grep -a -o 'display :[0-9]*' $L1 | head -1) $(grep -a -o 'OBSIDIAN-E2E done: [^,]*, [0-9]* failed' $L1) $(grep -a '^rc=' $L1) | B: $(grep -a -o 'display :[0-9]*' $L2 | head -1) $(grep -a -o 'OBSIDIAN-E2E done: [^,]*, [0-9]* failed' $L2) $(grep -a '^rc=' $L2)" | tee -a $S/sc546-r1-$LABEL-pairs-summary.log
done
