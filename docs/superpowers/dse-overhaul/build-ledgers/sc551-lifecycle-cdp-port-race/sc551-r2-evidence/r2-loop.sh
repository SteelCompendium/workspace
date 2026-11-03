#!/bin/bash
# usage: r2-loop.sh <label> <tries> <port-base> [camera args...]
P=/home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race/draw-steel-elements
E=/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r2-evidence
L=$1; N=$2; PB=$3; shift 3
for i in $(seq 1 $N); do
  node $E/r2-camera-repro.mjs $P $L$i $PB $((PB+1)) 5400 "$@" > $E/$L-$i.log 2>&1
  echo "try $i: $(command grep -a 'RESULT' $E/$L-$i.log | sed 's/.*RESULT //')"
done
