#!/usr/bin/env bash
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc479-r6-aa25
D=/home/scott/code/steelCompendium/worktrees/sc479-embed-scroll-pin/draw-steel-elements
: > "$S/bundles.sums"
HEADREV=$(git -C "$D" rev-parse HEAD)
bash "$S/build-scratch.sh" head "$HEADREV"
bash "$S/build-scratch.sh" base origin/develop
bash "$S/build-scratch.sh" nogate "$HEADREV" "$S/mut-nogate.py"
bash "$S/build-scratch.sh" ctl-noanchor "$HEADREV" "$S/mut-noanchor.py"
bash "$S/build-scratch.sh" ctl-nohost "$HEADREV" "$S/mut-nohost.py"
bash "$S/build-scratch.sh" ctl-scroller "$HEADREV" "$S/mut-scroller.py"
echo done > "$S/build-all.rc"
