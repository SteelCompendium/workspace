#!/bin/bash
# usage: cam-loop.sh <label> <tree: fixwt|basewt> <tries> <port-base> [stale]
# The r2 implementer's camera decoy harness (sc551-r2-evidence/r2-camera-repro.mjs, unmodified), run against the r3
# reviewer's private clone, private displays :5465-:5474, private ports, logs in the r3 scratch dir.
R=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc551-r3-review
E=/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r2-evidence
L=$1; W=$R/$2; N=$3; PB=$4
mkdir -p $R/cam
if [ "$5" = "stale" ]; then export R2_MODE=stale; fi
for i in $(seq 1 $N); do
  node $E/r2-camera-repro.mjs $W $L$i $PB $((PB+1)) 5465 > $R/cam/$L-$i.log 2>&1
  echo "try $i: $(grep -a 'RESULT' $R/cam/$L-$i.log | sed 's/.*RESULT //')"
done
