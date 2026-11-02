#!/usr/bin/env bash
# SC-522 r1 runner: run.sh <bundle-variant> <only-ids> <tag> [env assignments...]
# Builds a scratch harness copy (probe blocks injected) and runs it against bundles/<variant>. The tree is never edited.
# HSRC env selects the harness source (default: the in-tree one). PROBES env = space-separated probe block files (default: common + lp).
set -u
V=$1; ONLY=$2; TAG=$3; shift 3
W=/home/scott/code/steelCompendium/worktrees/sc522-lp-embed-scroll/draw-steel-elements
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc522-r1-ab29016d2a82150ae
HSRC=${S522_HSRC:-$W/visual-harness/obsidian-lifecycle.mjs}
PROBES=${S522_PROBES:-"$S/probe-common.mjs.txt $S/probe-lp.mjs.txt"}
H=$S/harness-$TAG-$V.mjs
node "$S/mkharness.cjs" "$HSRC" "$H" $PROBES > "$S/mk-$TAG-$V.log" 2>&1 || { echo "mk-failed"; cat "$S/mk-$TAG-$V.log"; exit 9; }
LOG="$S/run-$TAG-$V.log"
mkdir -p "$S/out"
env "$@" S522_REPO="$W" P522_OUT="$S/out" P522_VARIANT="$V-$TAG" DSE_LIFECYCLE_PORT=${S522_PORT:-9522} DSE_LIFECYCLE_BUNDLE="$S/bundles/$V" timeout 580 node "$H" --only="$ONLY" > "$LOG" 2>&1
rc=$?
echo "rc=$rc" >> "$LOG"
echo "rc=$rc" > "$S/run-$TAG-$V.rc"
echo "porcelain-after: [$(git -C "$W" status --porcelain | tr '\n' ' ')] head: $(git -C "$W" rev-parse --short HEAD)" >> "$LOG"
grep -E "OBSIDIAN-LIFECYCLE (start|done|temp)|FAIL" "$LOG" | cut -c1-600
echo "rc=$rc log=$LOG"
exit $rc
