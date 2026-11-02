# SC-546 r2: repeat "signal the runner while startOwnedXvfb waits on its child" and count processes of that run
# still alive 3 s after the runner exited (orphans). usage: bash sc546-r4-orphan.sh <e2e|lc> <hang|slow> <reps>
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r4-rereview
T=/home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements
WHO="$1"; KIND="$2"; N="$3"
L=$S/sc546-r4-orphan-$WHO-$KIND.log
: > $L
BIN=$S/sc546-r4-hang-xvfb.sh; [ "$KIND" = slow ] && BIN=$S/sc546-r4-slow-xvfb.sh
NEEDLE="XVFB_BIN=$BIN"
for r in $(seq 1 $N); do
  if [ "$WHO" = e2e ]; then
    ( cd $T && XVFB_BIN=$BIN exec node e2e/run.mjs --only=CTR-F01 --shards=1 > $S/sc546-r4-orphan-run.log 2>&1 ) &
  else
    ( cd $T && DSE_LIFECYCLE_PORT=9581 XVFB_BIN=$BIN exec node visual-harness/obsidian-lifecycle.mjs --only=G-S1 > $S/sc546-r4-orphan-run.log 2>&1 ) &
  fi
  RP=$!
  for i in $(seq 1 1200); do WP=$(pgrep -P $RP -f "sc546-r4-(hang|slow)-xvfb|sleep 60"); [ -n "$WP" ] && break; sleep 0.05; done
  sleep 0.7
  kill -TERM $RP
  wait $RP; RC=$?
  sleep 3
  ORPH=""; OPIDS=""
  for p in $(ls /proc | grep -E '^[0-9]+$'); do
    tr '\0' '\n' < /proc/$p/environ 2>/dev/null | grep -aqx "$NEEDLE" && OPIDS="$OPIDS $p" && ORPH="$ORPH $p:$(tr '\0' ' ' < /proc/$p/cmdline 2>/dev/null | cut -c1-60)"
  done
  echo "rep $r: runner rc=$RC firstChild=$WP orphans=[$ORPH ] log: $(grep -a "environment" $S/sc546-r4-orphan-run.log | tr '\n' ' ')" >> $L
  for o in $OPIDS; do kill -TERM $o 2>/dev/null; done
  sleep 0.5
done
echo "SUMMARY $WHO/$KIND: $(grep -c 'orphans=\[ [0-9]' $L)/$N reps left an orphan" >> $L
