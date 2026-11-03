#!/bin/bash
# usage: pair.sh <label> <tree: fixwt|basewt> <tries> <port|default> [scenario] [barrier-lead-seconds]
# The r1 implementer's pair harness (sc551-r1-evidence/pair.sh), pointed at the r3 reviewer's PRIVATE clones
# (instrumented with the implementer's temp patches, Xvfb range :5440-:5454) and the r3 scratch dir.
LABEL=$1; TREE=$2; TRIES=$3; PORTARG=$4; SCEN=${5:-G-S6b}; LEAD=${6:-14}
R=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc551-r3-review
P=$R/$TREE
O=$R/pairs
mkdir -p $O
export XVFB_BIN=/home/scott/code/steelCompendium/workspace/draw-steel-elements/.devbox/nix/profile/default/bin/Xvfb
unset DSE_LIFECYCLE_PORT
for i in $(seq 1 $TRIES); do
  BAR=$(( $(date +%s%3N) + LEAD*1000 ))
  if [ "$PORTARG" != "default" ]; then export DSE_LIFECYCLE_PORT=$PORTARG; fi
  for tag in A B; do
    ( TMP_BARRIER=$BAR TMP_TAG=$tag timeout 300 node $P/visual-harness/obsidian-lifecycle.mjs --only=$SCEN > $O/$LABEL-try$i-$tag.log 2>&1; echo $? > $O/$LABEL-try$i-$tag.rc ) &
  done
  wait
  echo "try $i: A rc=$(cat $O/$LABEL-try$i-A.rc) B rc=$(cat $O/$LABEL-try$i-B.rc)"
  for tag in A B; do grep -a 'TMPLOG\|OBSIDIAN-LIFECYCLE' $O/$LABEL-try$i-$tag.log | cut -c1-260 | sed "s/^/   [$tag] /"; done
done
