#!/bin/bash
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc551-r1-impl
for m in "D3a tcp-any 47263" "D3b tcp-v4 47264" "D4 fakecdp 47265" "D5 free 47266"; do
  echo "=== $m"
  bash $S/single.sh $m
done
