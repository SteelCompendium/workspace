#!/bin/bash
# usage: s557-loadstart.sh <count>   -- starts <count> busy loops, records each PID to the pid file
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc557-r1-impl-a7k2q9
PIDF=$S/load.pids
if [ -s "$PIDF" ]; then echo "pid file not empty: $PIDF"; exit 3; fi
n="$1"
i=0
while [ "$i" -lt "$n" ]; do
  nohup sh -c 'while :; do :; done # sc557-r1-load-busy' > /dev/null 2>&1 &
  echo $! >> "$PIDF"
  i=$((i + 1))
done
sleep 1
echo "started $n loops: $(tr '\n' ' ' < "$PIDF")"
cat /proc/loadavg
