#!/usr/bin/env bash
# disc.sh <bundle> <run#> [only]: one lifecycle run of G-S52 (or <only>) against bundles/<bundle>, harness = the worktree's edited copy (scratch copy, no probes)
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc522-r1-ab29016d2a82150ae
V=$1; N=$2; ONLY=${3:-G-S52}
S522_PROBES="$S/probe-none.txt" bash "$S/run.sh" "$V" "$ONLY" "disc$N" > /dev/null 2>&1
rc=$?
LOG="$S/run-disc$N-$V.log"
echo "== $V run $N rc=$rc"
grep -E "OBSIDIAN-LIFECYCLE (G-S|done|temp)" "$LOG" | sed 's/ | /\n    | /g; s/; (/;\n    (/g' | cut -c1-420
echo "$V run$N rc=$rc $(grep -o 'OBSIDIAN-LIFECYCLE done.*' "$LOG")" >> "$S/disc-summary.log"
