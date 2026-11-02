# SC-546 r2: caller-level failure paths and signal leaks, run in the throwaway head tree (cfb16433 + temp e2e range :5340-:5379).
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r2-review
T=$S/sc546-r2-tree-head-A
L=$S/sc546-r2-callers.log
: > $L
printf '#!/bin/sh\necho "fake xvfb: lost" >&2\nexit 1\n' > $S/sc546-r2-exit1-xvfb.sh
chmod 755 $S/sc546-r2-exit1-xvfb.sh
leftovers() {
  echo "  leftovers: sockets=[$(ls /tmp/.X11-unix | grep -a 'X53[4-7][0-9]' | tr '\n' ' ')] locks=[$(ls -a /tmp | grep -a '^\.X53[4-7][0-9]-lock' | tr '\n' ' ')] xvfb=[$(ps -eo pid,args | grep -a 'Xvfb :53[4-7][0-9]' | grep -av grep | tr '\n' ' ')] sleep60=[$(pgrep -f -x 'sleep 60' | tr '\n' ' ')] treeProcs=[$(ps -eo pid,args | grep -a "sc546-r2-tree-head-A" | grep -av grep | grep -av 'sc546-r2-callers' | wc -l)]" >> $L
}
waitfor() { # <log> <pattern> <max s>
  for i in $(seq 1 $(( $3 * 10 ))); do grep -aq "$2" $1 && return 0; sleep 0.1; done; return 1
}

echo "== E1 e2e, XVFB_BIN=fake that always exits 1 (every number lost)" >> $L
T0=$(date +%s%3N)
( cd $T && XVFB_BIN=$S/sc546-r2-exit1-xvfb.sh node e2e/run.mjs --only=CTR-F01 --shards=1 > $S/sc546-r2-callers-E1.log 2>&1; echo "rc=$?" >> $S/sc546-r2-callers-E1.log )
echo "  wall_ms=$(( $(date +%s%3N) - T0 )) $(grep -a 'environment:\|^rc=' $S/sc546-r2-callers-E1.log | tr '\n' ' ')" >> $L
leftovers

echo "== E2 e2e, XVFB_BIN=existing non-executable file (EACCES on spawn)" >> $L
T0=$(date +%s%3N)
( cd $T && XVFB_BIN=$S/sc546-r2-noexec-xvfb node e2e/run.mjs --only=CTR-F01 --shards=1 > $S/sc546-r2-callers-E2.log 2>&1; echo "rc=$?" >> $S/sc546-r2-callers-E2.log )
echo "  wall_ms=$(( $(date +%s%3N) - T0 )) $(grep -a 'environment:\|^rc=' $S/sc546-r2-callers-E2.log | tr '\n' ' ')" >> $L
leftovers

echo "== E3 e2e, XVFB_BIN=hang (never writes the fd); SIGTERM the runner while it waits" >> $L
( cd $T && XVFB_BIN=$S/sc546-r2-hang-xvfb.sh exec node e2e/run.mjs --only=CTR-F01 --shards=1 > $S/sc546-r2-callers-E3.log 2>&1 ) &
RP=$!
for i in $(seq 1 600); do HP=$(pgrep -P $RP -x sleep); [ -n "$HP" ] && break; sleep 0.1; done
echo "  runner=$RP hung-xvfb(sleep)=$HP" >> $L
sleep 2
kill -TERM $RP
wait $RP; echo "  runner rc=$?  $(grep -a 'environment:' $S/sc546-r2-callers-E3.log | tr '\n' ' ')" >> $L
sleep 0.5
echo "  hung child still alive? $( [ -n "$HP" ] && [ -d /proc/$HP ] && echo YES || echo no)" >> $L
leftovers

echo "== E4 e2e, real Xvfb; SIGINT mid-run (after the wdio start line)" >> $L
( cd $T && exec node e2e/run.mjs --only=CTR-F01 --shards=1 > $S/sc546-r2-callers-E4.log 2>&1 ) &
RP=$!
waitfor $S/sc546-r2-callers-E4.log 'OBSIDIAN-E2E start:' 120
XP=$(pgrep -P $RP -f 'Xvfb :53')
echo "  runner=$RP xvfb=$XP $(grep -a -o 'display :[0-9]*' $S/sc546-r2-callers-E4.log | head -1)" >> $L
sleep 4
kill -INT $RP
wait $RP; echo "  runner rc=$?  $(grep -a 'environment:\|reaped' $S/sc546-r2-callers-E4.log | tr '\n' ' ')" >> $L
sleep 0.5
echo "  xvfb still alive? $( [ -n "$XP" ] && [ -d /proc/$XP ] && echo YES || echo no)" >> $L
leftovers

echo "== E5 e2e, real Xvfb; SIGTERM right after the display line (pointer park / wdio spawn window)" >> $L
( cd $T && exec node e2e/run.mjs --only=CTR-F01 --shards=1 > $S/sc546-r2-callers-E5.log 2>&1 ) &
RP=$!
for i in $(seq 1 1200); do XP=$(pgrep -P $RP -f 'Xvfb :53'); [ -n "$XP" ] && break; sleep 0.05; done
kill -TERM $RP
wait $RP; echo "  runner=$RP xvfb=$XP rc=$?  $(grep -a 'environment:\|pointer' $S/sc546-r2-callers-E5.log | tr '\n' ' ')" >> $L
sleep 0.5
echo "  xvfb still alive? $( [ -n "$XP" ] && [ -d /proc/$XP ] && echo YES || echo no)" >> $L
leftovers

echo "== L1 lifecycle, XVFB_BIN=fake that always exits 1" >> $L
T0=$(date +%s%3N)
( cd $T && DSE_LIFECYCLE_PORT=9473 XVFB_BIN=$S/sc546-r2-exit1-xvfb.sh node visual-harness/obsidian-lifecycle.mjs --only=G-S1 > $S/sc546-r2-callers-L1.log 2>&1; echo "rc=$?" >> $S/sc546-r2-callers-L1.log )
echo "  wall_ms=$(( $(date +%s%3N) - T0 )) $(grep -a 'environment\|^rc=' $S/sc546-r2-callers-L1.log | tr '\n' ' ')" >> $L
leftovers

echo "== L2 lifecycle, XVFB_BIN=hang; SIGTERM while it waits" >> $L
( cd $T && DSE_LIFECYCLE_PORT=9473 XVFB_BIN=$S/sc546-r2-hang-xvfb.sh exec node visual-harness/obsidian-lifecycle.mjs --only=G-S1 > $S/sc546-r2-callers-L2.log 2>&1 ) &
RP=$!
for i in $(seq 1 600); do HP=$(pgrep -P $RP -x sleep); [ -n "$HP" ] && break; sleep 0.1; done
sleep 2
kill -TERM $RP
wait $RP; echo "  runner=$RP hung=$HP rc=$?  $(grep -a 'environment' $S/sc546-r2-callers-L2.log | tr '\n' ' ')" >> $L
sleep 0.5
echo "  hung child still alive? $( [ -n "$HP" ] && [ -d /proc/$HP ] && echo YES || echo no)" >> $L
leftovers

echo "== L3 lifecycle, real Xvfb (:160-:199); SIGINT mid-run" >> $L
( cd $T && DSE_LIFECYCLE_PORT=9473 exec node visual-harness/obsidian-lifecycle.mjs --only=G-S1,G-S2,G-S3 > $S/sc546-r2-callers-L3.log 2>&1 ) &
RP=$!
waitfor $S/sc546-r2-callers-L3.log 'start: display' 60
XP=$(pgrep -P $RP -f 'Xvfb :1[6-9][0-9]')
echo "  runner=$RP xvfb=$XP $(grep -a -o 'start: display :[0-9]*' $S/sc546-r2-callers-L3.log | head -1)" >> $L
sleep 5
kill -INT $RP
wait $RP; echo "  rc=$?  $(grep -a 'environment' $S/sc546-r2-callers-L3.log | tr '\n' ' ')" >> $L
sleep 0.5
echo "  xvfb still alive? $( [ -n "$XP" ] && [ -d /proc/$XP ] && echo YES || echo no); obsidian on port 9473: $(ps -eo args | grep -a 'remote-debugging-port=9473' | grep -av grep | wc -l)" >> $L
leftovers

echo "== D1 docs-shots, XVFB_BIN=fake that always exits 1 (returns null -> XVFB_HELP + failure)" >> $L
( cd $T && XVFB_BIN=$S/sc546-r2-exit1-xvfb.sh DSE_DOCS_DISPLAY=:5360 node visual-harness/docs-shots.mjs --only=settings-index.png > $S/sc546-r2-callers-D1.log 2>&1; echo "rc=$?" >> $S/sc546-r2-callers-D1.log )
echo "  $(grep -a 'Xvfb up\|Xvfb unavailable\|failed\|^rc=' $S/sc546-r2-callers-D1.log | tr '\n' ' ')" >> $L
leftovers

echo "== D2 docs-shots, real Xvfb, preferred DSE_DOCS_DISPLAY=:5360 (free) -> one obsidian shot" >> $L
( cd $T && DSE_DOCS_DISPLAY=:5360 node visual-harness/docs-shots.mjs --only=settings-index.png > $S/sc546-r2-callers-D2.log 2>&1; echo "rc=$?" >> $S/sc546-r2-callers-D2.log )
echo "  $(grep -a 'Xvfb up\|written\|failed\|^rc=' $S/sc546-r2-callers-D2.log | tr '\n' ' ')" >> $L
sleep 3.5
leftovers
echo "== end" >> $L
