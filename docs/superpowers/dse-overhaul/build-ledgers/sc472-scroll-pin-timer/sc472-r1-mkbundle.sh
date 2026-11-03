#!/bin/bash
# sc472 r1: mkbundle.sh <name> [<tree-dir>]
#  no tree-dir: export dse ad018cd (git archive) to bundles/<name>/tree and build there.
#  tree-dir:    build that (already exported/edited) tree in place and copy its outputs.
# node_modules is symlinked from the main checkout (package-lock.json identical to ad018cd's).
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc472-r1-a5d5f8c00377afd62
W=/home/scott/code/steelCompendium/worktrees/sc472-scroll-pin-timer/draw-steel-elements
NM=/home/scott/code/steelCompendium/workspace/draw-steel-elements/node_modules
N=$1
mkdir -p "$S/bundles/$N"
if [ -n "$2" ]; then
  T=$2
else
  T="$S/bundles/$N/tree"
  mkdir -p "$T"
  git -C "$W" archive ad018cd | tar -x -C "$T"
fi
ln -sfn "$NM" "$T/node_modules"
cd "$T" || exit 9
node esbuild.config.mjs production > "$S/bundles/$N/build.log" 2>&1
rc=$?
for f in main.js styles.css manifest.json; do cp "$T/$f" "$S/bundles/$N/$f"; done
echo "$N tree=$T main.js $(sha256sum "$S/bundles/$N/main.js" | cut -c1-12) styles.css $(sha256sum "$S/bundles/$N/styles.css" | cut -c1-12) rc=$rc" | tee -a "$S/bundles-summary.log"
exit $rc
