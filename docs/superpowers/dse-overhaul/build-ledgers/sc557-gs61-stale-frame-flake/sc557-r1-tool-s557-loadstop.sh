#!/bin/bash
# stops the busy loops recorded in the pid file, by literal PID, only if the process is still ours
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc557-r1-impl-a7k2q9
PIDF=$S/load.pids
[ -s "$PIDF" ] || { echo "no pids"; exit 0; }
for pid in $(cat "$PIDF"); do
  if tr '\0' ' ' < /proc/$pid/cmdline 2>/dev/null | grep -q 'sc557-r1-load-busy'; then
    kill "$pid" && echo "killed $pid"
  else
    echo "skip $pid (not ours / gone)"
  fi
done
sleep 1
: > "$PIDF"
cat /proc/loadavg
