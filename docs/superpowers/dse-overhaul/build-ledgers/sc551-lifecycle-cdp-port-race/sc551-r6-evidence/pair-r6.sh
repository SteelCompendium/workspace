#!/bin/bash
# usage: pair.sh <label> <tries> <port|default> [scenario] [barrier-lead-seconds]
# Two lifecycle runs started together (wall-clock barrier), logs in the evidence dir.
LABEL=$1; TRIES=$2; PORTARG=$3; SCEN=${4:-G-S6b}; LEAD=${5:-14}
P=/home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race/draw-steel-elements
E=/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r6-evidence
export XVFB_BIN=$P/.devbox/nix/profile/default/bin/Xvfb
unset DSE_LIFECYCLE_PORT
for i in $(seq 1 $TRIES); do
  BAR=$(( $(date +%s%3N) + LEAD*1000 ))
  if [ "$PORTARG" != "default" ]; then export DSE_LIFECYCLE_PORT=$((PORTARG)); fi
  for tag in A B; do
    ( TMP_BARRIER=$BAR TMP_TAG=$tag timeout 300 node $P/visual-harness/obsidian-lifecycle.mjs --only=$SCEN > $E/$LABEL-try$i-$tag.log 2>&1; echo $? > $E/$LABEL-try$i-$tag.rc ) &
  done
  wait
  echo "try $i: A rc=$(cat $E/$LABEL-try$i-A.rc) B rc=$(cat $E/$LABEL-try$i-B.rc)"
  for tag in A B; do command grep -a 'TMPLOG\|OBSIDIAN-LIFECYCLE' $E/$LABEL-try$i-$tag.log | cut -c1-260 | sed "s/^/   [$tag] /"; done
done
