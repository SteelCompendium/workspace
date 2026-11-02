# SC-546 r2: (a) lifecycle SIGINT mid-run with a real Xvfb; (b) a signal during startOwnedXvfb orphans a REAL Xvfb on the
# next number, shown with a slow-starting real Xvfb (wrapper: sleep 2, then exec the real binary).
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r2-review
T=$S/sc546-r2-tree-head-A
L=$S/sc546-r2-signal2.log
: > $L
REAL=$(which Xvfb)
printf '#!/bin/sh\nsleep 2\nexec %s "$@"\n' "$REAL" > $S/sc546-r2-slow-xvfb.sh
chmod 755 $S/sc546-r2-slow-xvfb.sh
leftovers() {
  echo "  leftovers: sockets=[$(ls /tmp/.X11-unix | grep -a 'X53[4-7][0-9]' | tr '\n' ' ')] xvfb534x=[$(ps -eo pid,ppid,args | grep -a 'Xvfb :53[4-7][0-9]' | grep -av grep | tr '\n' ' ')] xvfb16x-ours=[$(ps -eo pid,args | grep -a 'Xvfb :1[6-9][0-9]' | grep -av grep | while read p rest; do tr '\0' '\n' < /proc/$p/environ 2>/dev/null | grep -aq 'DSE_LIFECYCLE_PORT=9473' && echo "$p $rest"; done | tr '\n' ' ')] slowwrappers=[$(pgrep -f sc546-r2-slow-xvfb | tr '\n' ' ')]" >> $L
}
waitfor() { for i in $(seq 1 $(( $3 * 10 ))); do grep -aq "$2" $1 && return 0; sleep 0.1; done; return 1; }

echo "== L3b lifecycle, real Xvfb (:160-:199); SIGINT mid-run" >> $L
( cd $T && DSE_LIFECYCLE_PORT=9473 exec node visual-harness/obsidian-lifecycle.mjs --only=G-S1,G-S2,G-S3,G-S4,G-S5 > $S/sc546-r2-signal2-L3b.log 2>&1 ) &
RP=$!
waitfor $S/sc546-r2-signal2-L3b.log 'OBSIDIAN-LIFECYCLE start:' 60
XP=$(pgrep -P $RP -f 'Xvfb :1[6-9][0-9]')
echo "  runner=$RP xvfb=$XP $(grep -a -o 'display :[0-9]*' $S/sc546-r2-signal2-L3b.log | head -1)" >> $L
sleep 3
kill -INT $RP
wait $RP; echo "  rc=$?  $(grep -a 'environment\|done:' $S/sc546-r2-signal2-L3b.log | tr '\n' ' ')" >> $L
sleep 0.5
echo "  xvfb still alive? $( [ -n "$XP" ] && [ -d /proc/$XP ] && echo YES || echo no); obsidian on port 9473: $(ps -eo args | grep -a 'remote-debugging-port=9473' | grep -av grep | wc -l)" >> $L
leftovers

echo "== X1 e2e, XVFB_BIN=slow real Xvfb; SIGTERM the runner during startOwnedXvfb" >> $L
( cd $T && XVFB_BIN=$S/sc546-r2-slow-xvfb.sh exec node e2e/run.mjs --only=CTR-F01 --shards=1 > $S/sc546-r2-signal2-X1.log 2>&1 ) &
RP=$!
for i in $(seq 1 600); do WP=$(pgrep -P $RP -f sc546-r2-slow-xvfb); [ -n "$WP" ] && break; sleep 0.05; done
sleep 0.5
kill -TERM $RP
wait $RP; echo "  runner=$RP firstWrapper=$WP rc=$?  $(grep -a 'environment:' $S/sc546-r2-signal2-X1.log | tr '\n' ' ')" >> $L
sleep 4
leftovers

echo "== X2 lifecycle, XVFB_BIN=slow real Xvfb; SIGTERM the runner during startOwnedXvfb" >> $L
( cd $T && DSE_LIFECYCLE_PORT=9473 XVFB_BIN=$S/sc546-r2-slow-xvfb.sh exec node visual-harness/obsidian-lifecycle.mjs --only=G-S1 > $S/sc546-r2-signal2-X2.log 2>&1 ) &
RP=$!
for i in $(seq 1 600); do WP=$(pgrep -P $RP -f sc546-r2-slow-xvfb); [ -n "$WP" ] && break; sleep 0.05; done
sleep 0.5
kill -TERM $RP
wait $RP; echo "  runner=$RP firstWrapper=$WP rc=$?  $(grep -a 'environment' $S/sc546-r2-signal2-X2.log | tr '\n' ' ')" >> $L
sleep 4
leftovers
echo "== end" >> $L
