#!/bin/bash
# usage: s557-reps.sh <build-label> <bundle-dir|-> <load|idle> <first-rep> <last-rep>
# runs G-S61 alone <n> times; one log per run in $S/logs, header/footer with /proc/loadavg
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc557-r1-impl-a7k2q9
PL=/home/scott/code/steelCompendium/worktrees/sc557-gs61-stale-frame-flake/draw-steel-elements
label="$1"; bundle="$2"; kind="$3"; first="$4"; last="$5"
mkdir -p "$S/logs"
cd "$PL" || exit 9
rep="$first"
while [ "$rep" -le "$last" ]; do
  out="$S/logs/gs61-$label-$kind-rep$rep.log"
  start=$(date +%s)
  {
    echo "HEAD $(git -C $PL rev-parse HEAD) label=$label kind=$kind rep=$rep bundle=$bundle start=$(date -Is) loadavg_start=$(cat /proc/loadavg)"
    if [ "$bundle" = "-" ]; then
      node visual-harness/obsidian-lifecycle.mjs --only=G-S61
    else
      DSE_LIFECYCLE_BUNDLE="$bundle" node visual-harness/obsidian-lifecycle.mjs --only=G-S61
    fi
    echo "rc=$? elapsed=$(( $(date +%s) - start ))s loadavg_end=$(cat /proc/loadavg)"
  } > "$out" 2>&1
  grep -E "^rc=" "$out"
  rep=$((rep + 1))
done
