#!/usr/bin/env bash
# SC-479 r1 runner: s479-run.sh <variant> <only-ids> <tag> [extra-env-assignments...]
# Builds a scratch harness copy (probe blocks injected) and runs it against bundles/<variant>. The tree is never edited.
set -u
V=$1; ONLY=$2; TAG=$3; shift 3
D=/home/scott/code/steelCompendium/worktrees/sc479-embed-scroll-pin/draw-steel-elements
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc479-r1-ab09d580
HSRC=${S479_HSRC:-$D/visual-harness/obsidian-lifecycle.mjs}
H=$S/s479-harness-$TAG-$V.mjs
node "$S/s479-mkharness.cjs" "$HSRC" "$H" "$S/s479-probe-common.mjs.txt" "$S/s479-probe-dom.mjs.txt" "$S/s479-probe-repro.mjs.txt" "$S/s479-probe-dbg.mjs.txt" "$S/s479-probe-cost.mjs.txt" > "$S/s479-mk-$TAG-$V.log" 2>&1 || { echo "mk-failed" > "$S/s479-run-$TAG-$V.rc"; exit 9; }
LOG="$S/s479-$TAG-$V.log"
mkdir -p "$S/out"
env "$@" S479_REPO="$D" P479_OUT="$S/out" P479_VARIANT="$V-$TAG" DSE_LIFECYCLE_PORT=9479 DSE_LIFECYCLE_BUNDLE="$S/bundles/$V" node "$H" --only="$ONLY" > "$LOG" 2>&1
rc=$?
echo "rc=$rc" >> "$LOG"
echo "rc=$rc" > "$S/s479-run-$TAG-$V.rc"
echo "porcelain-after: [$(git -C "$D" status --porcelain | tr '\n' ' ')] head: $(git -C "$D" rev-parse --short HEAD)" >> "$LOG"
exit $rc
