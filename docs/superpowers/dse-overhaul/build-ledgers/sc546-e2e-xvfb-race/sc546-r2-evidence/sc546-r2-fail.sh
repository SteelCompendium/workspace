S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r2-review
L=$S/sc546-r2-fail.log
: > $L
Xvfb -version >> $L 2>&1
for c in success badarg missing noexec hang alltaken stalelock stalesocket livelock hang-default; do
  T0=$(date +%s%3N)
  timeout 90 node $S/sc546-r2-fail-worker.mjs $c > $S/sc546-r2-fail-$c.out 2>&1
  RC=$?
  T1=$(date +%s%3N)
  RET=$(grep -a '^RETURNED_AT ' $S/sc546-r2-fail-$c.out | awk '{print $2}')
  echo "case=$c rc=$RC wall_ms=$((T1-T0)) exit_after_return_ms=$(( T1 - ${RET:-$T1} ))" >> $L
  grep -a '^RESULT ' $S/sc546-r2-fail-$c.out >> $L
  grep -av '^RESULT \|^RETURNED_AT ' $S/sc546-r2-fail-$c.out | head -5 >> $L
done
echo "--- leftovers in :5340-:5379 after all cases" >> $L
ls -la /tmp/.X11-unix/ | grep -a 'X53[4-7][0-9]' >> $L
ls -la /tmp/ | grep -a '\.X53[4-7][0-9]-lock' >> $L
ps -eo pid,args | grep -a 'Xvfb :53[4-7][0-9]\|sleep 60' | grep -av grep >> $L
echo "--- end" >> $L
