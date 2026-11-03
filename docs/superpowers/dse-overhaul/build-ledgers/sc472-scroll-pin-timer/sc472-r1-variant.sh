#!/bin/bash
# variant.sh <name> <src-tree> <file-rel> [<old> <new>]...: copy <src-tree> to vtrees/<name> (no node_modules), apply each
# exact-once replacement in <file-rel>, build it into bundles/<name> via mkbundle.sh.
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc472-r1-a5d5f8c00377afd62
N=$1; SRC=$2; F=$3; shift 3
T="$S/vtrees/$N"
mkdir -p "$T"
tar -C "$SRC" --exclude=./node_modules -cf - . | tar -C "$T" -xf -
while [ $# -ge 2 ]; do
python3 -I - "$T/$F" "$1" "$2" <<'EOF'
import sys
p, old, new = sys.argv[1:4]
s = open(p).read()
assert s.count(old) == 1, ('old text count', old, s.count(old))
open(p, 'w').write(s.replace(old, new))
EOF
[ $? -eq 0 ] || { echo "variant $N: replace failed"; exit 8; }
shift 2
done
bash "$S/mkbundle.sh" "$N" "$T"
