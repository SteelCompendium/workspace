cd /home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r2-review
L=$S/sc546-r2-jest5.log
: > $L
echo "pwd=$(pwd)" >> $L
echo "tmp dirs before: $(ls -d /tmp/dse-xvfb-owned-test-* 2>/dev/null | wc -l)" >> $L
echo "sleep30 before: $(pgrep -f -x 'sleep 30' | wc -l)" >> $L
echo "X11-unix X530x before: $(ls /tmp/.X11-unix | grep -c '^X530[0-9]$')" >> $L
for i in 1 2 3 4 5; do
  T0=$(date +%s%3N)
  npx jest test/unit/build/xvfbOwned.test.ts > $S/sc546-r2-jest5-run$i.log 2>&1
  RC=$?
  T1=$(date +%s%3N)
  echo "run $i rc=$RC ms=$((T1-T0)) $(grep -a '^Tests:' $S/sc546-r2-jest5-run$i.log)" >> $L
done
echo "--- 6 parallel copies (load)" >> $L
for i in 1 2 3 4 5 6; do
  ( npx jest test/unit/build/xvfbOwned.test.ts > $S/sc546-r2-jest5-par$i.log 2>&1; echo "par $i rc=$? $(grep -a '^Tests:' $S/sc546-r2-jest5-par$i.log)" >> $L ) &
done
wait
sleep 1
echo "tmp dirs after: $(ls -d /tmp/dse-xvfb-owned-test-* 2>/dev/null | wc -l)" >> $L
echo "sleep30 after: $(pgrep -f -x 'sleep 30' | wc -l)" >> $L
echo "X11-unix X530x after: $(ls /tmp/.X11-unix | grep -c '^X530[0-9]$')" >> $L
