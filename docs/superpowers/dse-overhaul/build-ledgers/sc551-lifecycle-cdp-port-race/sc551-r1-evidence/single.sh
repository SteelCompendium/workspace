#!/bin/bash
# usage: single.sh <label> <mode: tcp-any|tcp-v4|fakecdp|free> <port> [scenario]
# One lifecycle run with a pinned port; tcp-* = a plain node TCP listener already holds it (iii);
# fakecdp = a fake CDP server starts listening after the pre-check, before Obsidian spawns (iv, temp edit TMP_FAKE_CDP);
# free = nothing holds it (control: must pass).
LABEL=$1; MODE=$2; PORT=$3; SCEN=${4:-G-S6b}
P=/home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race/draw-steel-elements
E=/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r1-evidence
export XVFB_BIN=$P/.devbox/nix/profile/default/bin/Xvfb
LPID=""
case $MODE in
  tcp-any) node -e "require('net').createServer(s=>s.end()).listen($PORT,()=>console.log('listener up $PORT'))" > $E/$LABEL-listener.log 2>&1 & LPID=$! ;;
  tcp-v4)  node -e "require('net').createServer(s=>s.end()).listen($PORT,'127.0.0.1',()=>console.log('listener up $PORT'))" > $E/$LABEL-listener.log 2>&1 & LPID=$! ;;
esac
sleep 1
[ -n "$LPID" ] && echo "listener pid=$LPID: $(cat $E/$LABEL-listener.log)"
t0=$(date +%s)
if [ "$MODE" = fakecdp ]; then export TMP_FAKE_CDP=1; fi
DSE_LIFECYCLE_PORT=$PORT TMP_TAG=S timeout 300 node $P/visual-harness/obsidian-lifecycle.mjs --only=$SCEN > $E/$LABEL.log 2>&1
echo "rc=$? after $(( $(date +%s) - t0 )) s"
[ -n "$LPID" ] && kill $LPID
command grep -a 'TMPLOG\|OBSIDIAN-LIFECYCLE' $E/$LABEL.log | cut -c1-300
