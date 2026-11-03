#!/bin/bash
# usage: s557-probe.sh <tag> <bundle-dir> <harness-file> [VAR=value ...]
# runs G-S61 alone with the (probe) harness and the given env, log in logs/gs61-<tag>.log
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc557-r1-impl-a7k2q9
PL=/home/scott/code/steelCompendium/worktrees/sc557-gs61-stale-frame-flake/draw-steel-elements
tag="$1"; bundle="$2"; harness="$3"; shift 3
cd "$PL" || exit 9
out="$S/logs/gs61-$tag.log"
start=$(date +%s)
{
  echo "HEAD $(git -C $PL rev-parse HEAD) tag=$tag bundle=$bundle harness=$harness env=$* start=$(date -Is) loadavg_start=$(cat /proc/loadavg)"
  env "$@" DSE_LIFECYCLE_BUNDLE="$bundle" node "$harness" --only=G-S61
  echo "rc=$? elapsed=$(( $(date +%s) - start ))s loadavg_end=$(cat /proc/loadavg)"
} > "$out" 2>&1
grep -E "^rc=" "$out"
