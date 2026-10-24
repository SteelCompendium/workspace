#!/usr/bin/env bash
# build-scratch.sh <name> <git-rev> [mutation-python-file]: bundle from a git archive of <rev> in scratch; the worktree is never touched.
set -u
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc479-r6-aa25
D=/home/scott/code/steelCompendium/worktrees/sc479-embed-scroll-pin/draw-steel-elements
PIN=src/framework/host/previewScrollPin.ts
N=$1; REV=$2; MUT=${3:-}
rm -rf "$S/src/$N"
mkdir -p "$S/src/$N" "$S/bundles/$N"
git -C "$D" archive "$REV" | tar -x -C "$S/src/$N"
ln -sfn "$D/node_modules" "$S/src/$N/node_modules"
if [ -n "$MUT" ]; then python3 -I "$MUT" "$S/src/$N/$PIN" || exit 7; fi
( cd "$S/src/$N" && node esbuild.config.mjs production ) > "$S/build-$N.log" 2>&1
rc=$?
cp "$S/src/$N/main.js" "$S/src/$N/styles.css" "$S/src/$N/manifest.json" "$S/bundles/$N/"
echo "$N rc=$rc rev=$REV main.js $(sha256sum < "$S/bundles/$N/main.js" | cut -c1-12) styles.css $(sha256sum < "$S/bundles/$N/styles.css" | cut -c1-12)" >> "$S/bundles.sums"
exit $rc
