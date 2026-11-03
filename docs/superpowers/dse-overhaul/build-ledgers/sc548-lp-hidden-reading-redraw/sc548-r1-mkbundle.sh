#!/bin/bash
# sc548 r1: sc548-r1-mkbundle.sh <name> [<patcher.py> ...]
#  Exports dse 0698550f (git archive) to bundles/<name>/tree, runs each python patcher on the tree (exact-once
#  replacements), builds there (esbuild production) and copies main.js/styles.css/manifest.json to bundles/<name>/.
#  node_modules is symlinked from the main checkout (package-lock.json identical to 0698550f's). Never edits the worktree.
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc548-r1-reviewer
W=/home/scott/code/steelCompendium/worktrees/sc548-lp-hidden-reading-redraw/draw-steel-elements
NM=/home/scott/code/steelCompendium/workspace/draw-steel-elements/node_modules
N=$1; shift
T="$S/bundles/$N/tree"
mkdir -p "$T"
git -C "$W" archive 0698550f | tar -x -C "$T"
ln -sfn "$NM" "$T/node_modules"
for P in "$@"; do
  python3 -I "$P" "$T" || { echo "$N: patcher $P failed"; exit 8; }
done
cd "$T" || exit 9
node esbuild.config.mjs production > "$S/bundles/$N/build.log" 2>&1
rc=$?
for f in main.js styles.css manifest.json; do cp "$T/$f" "$S/bundles/$N/$f"; done
echo "$N main.js $(sha256sum "$S/bundles/$N/main.js" | cut -c1-12) styles.css $(sha256sum "$S/bundles/$N/styles.css" | cut -c1-12) rc=$rc patchers=[$*]" | tee -a "$S/sc548-r1-bundles-summary.log"
exit $rc
