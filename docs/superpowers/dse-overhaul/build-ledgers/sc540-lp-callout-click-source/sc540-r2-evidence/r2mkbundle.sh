#!/bin/bash
# r2mkbundle.sh <name> <git-rev> [file old new]: git archive <rev> into bundles/<name>/tree, optional one exact replacement, build.
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc540-r2-review-r1
W=/home/scott/code/steelCompendium/worktrees/sc540-lp-callout-click-source/draw-steel-elements
N=$1; REV=$2
D="$S/bundles/$N/tree"
mkdir -p "$D" "$S/logs"
git -C "$W" archive "$REV" | tar -x -C "$D"
ln -sfn "$W/node_modules" "$D/node_modules"
if [ -n "$3" ]; then
python3 - "$D/$3" "$4" "$5" <<'EOF'
import sys
p, old, new = sys.argv[1:4]
s = open(p).read()
assert s.count(old) == 1, ('old text count', s.count(old))
open(p, 'w').write(s.replace(old, new))
EOF
[ $? -eq 0 ] || { echo "variant $N: replace failed"; exit 8; }
fi
cd "$D" || exit 9
node esbuild.config.mjs production > "$S/bundles/$N/build.log" 2>&1
rc=$?
for f in main.js styles.css manifest.json; do cp "$D/$f" "$S/bundles/$N/$f"; done
echo "$N rev=$REV main.js $(sha256sum $S/bundles/$N/main.js | cut -c1-12) rc=$rc interactive-child-count $(grep -o 'cm-embed-block.cm-callout' $S/bundles/$N/main.js | wc -l)" | tee -a "$S/logs/bundles-summary.log"
