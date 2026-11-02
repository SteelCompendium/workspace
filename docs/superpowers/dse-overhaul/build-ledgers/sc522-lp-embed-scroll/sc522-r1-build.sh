#!/usr/bin/env bash
# build.sh <variant>: build the plugin from the worktree's current source and copy main.js/styles.css/manifest.json to bundles/<variant>
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc522-r1-ab29016d2a82150ae
W=/home/scott/code/steelCompendium/worktrees/sc522-lp-embed-scroll/draw-steel-elements
V=$1
LOG="$S/build-$V.log"
(cd "$W" && node esbuild.config.mjs production) > "$LOG" 2>&1
rc=$?
echo "rc=$rc" >> "$LOG"
mkdir -p "$S/bundles/$V"
for f in main.js styles.css manifest.json; do cp "$W/$f" "$S/bundles/$V/$f"; done
echo "$V main.js $(sha256sum "$S/bundles/$V/main.js" | cut -c1-12) styles.css $(sha256sum "$S/bundles/$V/styles.css" | cut -c1-12) head $(git -C "$W" rev-parse --short HEAD) porcelain [$(git -C "$W" status --porcelain | tr '\n' ' ')] rc=$rc" | tee -a "$S/build-summary.log"
