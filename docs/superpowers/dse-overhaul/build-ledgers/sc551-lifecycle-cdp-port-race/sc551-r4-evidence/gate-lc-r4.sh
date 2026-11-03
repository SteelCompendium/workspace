#!/bin/bash
# usage: gate-lc.sh <part 1|2|3> <port> <runtag>
P=/home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race/draw-steel-elements
E=/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r4-evidence
case $1 in
  1) IDS=G-S7a,G-S7b,G-S6a,G-S6b,G-S6u,G-S28,G-S5n,G-S1,G-S2,G-S3,G-S4,G-S5,G-S6c,G-S6d,G-S6e,G-S6f,G-S6g,G-S6h,G-S6i,G-S8,G-S9a ;;
  2) IDS=G-S9b,G-S9d,G-S9e,G-S9f,G-S9c,G-S10,G-S11,G-S12,G-S13,G-S15,G-S14,G-S18,G-S32,G-S36,G-S33,G-S40 ;;
  3) IDS=G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52 ;;
  4) IDS=G-S57,G-S62,G-S61,G-S56 ;;
esac
cd $P
npm run build-no-check > $E/gate-lc$1-$3-build.log 2>&1; echo "build rc=$?"
t0=$(date +%s)
if [ "$2" = default ]; then unset DSE_LIFECYCLE_PORT; else export DSE_LIFECYCLE_PORT=$2; fi
node visual-harness/obsidian-lifecycle.mjs --only=$IDS > $E/gate-lc$1-$3.log 2>&1; echo "lifecycle part $1 rc=$? in $(( $(date +%s) - t0 )) s"
command grep -a 'OBSIDIAN-LIFECYCLE done\|FAIL\|environment' $E/gate-lc$1-$3.log | head
command grep -ac ' ok (' $E/gate-lc$1-$3.log
