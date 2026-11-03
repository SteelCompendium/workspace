#!/bin/bash
W=/home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race/draw-steel-elements
for p in 2354593 2353425 2354196 2354594 2354989 2367371 2413467 2413762 2413960; do
  [ -d /proc/$p ] || { echo "$p gone"; continue; }
  cmd=$(tr '\0' ' ' < /proc/$p/cmdline)
  cwd=$(readlink /proc/$p/cwd)
  case "$cmd" in
    *"const http=require('http'),fs=require('fs')"*|'bash -c "$0" -e "$1" "$2" "$3"; true '*)
      if [ "$cwd" = "$W" ]; then kill -KILL $p && echo "killed $p (cwd ok)"; else echo "SKIP $p cwd=$cwd"; fi;;
    *) echo "SKIP $p unexpected cmdline: ${cmd:0:80}";;
  esac
done
