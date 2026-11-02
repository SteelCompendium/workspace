#!/usr/bin/env bash
# variant.sh <name> <file-rel> <python-replace-old> <python-replace-new>: temporarily edit one source file, build bundles/<name>, restore the file.
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc522-r1-ab29016d2a82150ae
W=/home/scott/code/steelCompendium/worktrees/sc522-lp-embed-scroll/draw-steel-elements
N=$1; F=$2; OLD=$3; NEW=$4
cp "$W/$F" "$S/variant-save-$N.txt"
python3 - "$W/$F" "$OLD" "$NEW" <<'EOF'
import sys
p, old, new = sys.argv[1:4]
s = open(p).read()
assert s.count(old) == 1, ('old text count', s.count(old))
open(p, 'w').write(s.replace(old, new))
EOF
prc=$?
if [ $prc -eq 0 ]; then bash "$S/build.sh" "$N"; else echo "variant $N: replace failed"; fi
cp "$S/variant-save-$N.txt" "$W/$F"
git -C "$W" diff --stat
