#!/bin/bash
# usage: s557-mkb.sh <label> <rev> [M1|M2|M3|M4]
# exports <rev> of the plugin repo into src-<label>, applies a control, builds a production bundle into bundle-<label>
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc557-r1-impl-a7k2q9
W=/home/scott/code/steelCompendium/worktrees/sc557-gs61-stale-frame-flake/draw-steel-elements
label="$1"; rev="$2"; mut="$3"
log="$S/mkb-$label.log"
src="$S/src-$label"
if [ -e "$src" ]; then echo "exists: $src"; exit 3; fi
mkdir -p "$src"
git -C "$W" archive "$rev" | tar -x -C "$src" || exit 4
ln -s "$W/node_modules" "$src/node_modules"
{
  if [ -n "$mut" ]; then python3 -I "$S/s557-mut.py" "$src" "$mut"; echo "mut rc=$?"; fi
  cd "$src" || exit 9
  node esbuild.config.mjs production
  echo "build rc=$?"
  mkdir -p "$S/bundle-$label"
  cp main.js styles.css manifest.json "$S/bundle-$label/"
  echo "copy rc=$?"
  sha256sum "$S/bundle-$label/main.js" "$S/bundle-$label/styles.css"
} > "$log" 2>&1
cat "$log"
