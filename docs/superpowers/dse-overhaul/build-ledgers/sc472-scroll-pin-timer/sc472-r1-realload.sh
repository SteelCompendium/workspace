#!/bin/bash
# realload.sh <nloops> <bundle> <only> <tag> [env...]: start <nloops> busy loops (PIDs recorded), run run.sh, kill exactly those PIDs.
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc472-r1-a5d5f8c00377afd62
N=$1; shift
PIDF="$S/logs/realload-$3-$1.pids"
: > "$PIDF"
for i in $(seq 1 "$N"); do
  bash -c 'while :; do :; done' &
  echo $! >> "$PIDF"
done
cleanup() { for p in $(cat "$PIDF"); do kill "$p" 2>/dev/null; done; }
trap cleanup EXIT
sleep 3
bash "$S/run.sh" "$@"
rc=$?
echo "busy loops: $(tr '\n' ' ' < "$PIDF")" >> "$S/logs/$3-$1.log"
exit $rc
