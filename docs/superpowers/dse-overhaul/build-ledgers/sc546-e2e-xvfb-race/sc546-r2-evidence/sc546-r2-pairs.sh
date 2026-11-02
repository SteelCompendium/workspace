# usage: bash sc546-r2-pairs.sh <label> <first> <last>   (run under devbox; trees from sc546-r2-trees.sh)
LBL="$1"; FIRST="$2"; N="$3"
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r2-review
TA=$S/sc546-r2-tree-$LBL-A; TB=$S/sc546-r2-tree-$LBL-B
SUM=$S/sc546-r2-$LBL-pairs-summary.log
[ "$FIRST" = 1 ] && : > $SUM
for i in $(seq $FIRST $N); do
  export SC546_BARRIER=$(( $(date +%s%3N) + 45000 ))
  L1=$S/sc546-r2-$LBL-pair$i-A.log; L2=$S/sc546-r2-$LBL-pair$i-B.log
  ( cd $TA && node e2e/run.mjs --only=CTR-F01 --shards=1 > $L1 2>&1; echo "rc=$?" >> $L1 ) &
  ( cd $TB && node e2e/run.mjs --only=CTR-F01 --shards=1 > $L2 2>&1; echo "rc=$?" >> $L2 ) &
  wait
  DA=$(grep -a -o 'display :[0-9]*' $L1 | head -1); DB=$(grep -a -o 'display :[0-9]*' $L2 | head -1)
  SAME=distinct; [ "$DA" = "$DB" ] && SAME=SHARED
  echo "pair $i: $SAME | A: $DA $(grep -a -o 'OBSIDIAN-E2E done: [^,]*, [0-9]* failed' $L1) $(grep -a '^rc=' $L1) | B: $DB $(grep -a -o 'OBSIDIAN-E2E done: [^,]*, [0-9]* failed' $L2) $(grep -a '^rc=' $L2)" >> $SUM
done
echo "TOTAL $LBL after pair $N: $(grep -c "SHARED |" $SUM)/$N pairs shared a display" >> $SUM
ls /tmp/.X11-unix | grep -a 'X53[4-7][0-9]' >> $SUM
ps -eo pid,args | grep -a 'Xvfb :53[4-7][0-9]' | grep -av grep >> $SUM
