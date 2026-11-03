#!/bin/bash
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc472-r1-a5d5f8c00377afd62
T=$S/vtrees/plain-dbg
mkdir -p $T
tar -C $S/vtrees/proto-plain --exclude=./node_modules -cf - . | tar -C $T -xf -
python3 -I - $T/src/framework/host/redrawBackstop.ts <<'EOF'
import sys
p = sys.argv[1]; s = open(p).read()
for a, b in [("this.timer = null;\n\t\tthis.frames = 0;", "this.timer = null; (window as any).__p472dbg?.push('deadline');\n\t\tthis.frames = 0;"),
             ("this.raf = null;\n\t\t\tthis.frames++;", "this.raf = null; (window as any).__p472dbg?.push('tick', this.frames);\n\t\t\tthis.frames++;"),
             ("private done(): void {\n", "private done(): void {\n\t\t(window as any).__p472dbg?.push('done');\n")]:
    assert s.count(a) == 1, a
    s = s.replace(a, b)
open(p, 'w').write(s)
EOF
bash $S/mkbundle.sh plain-dbg $T
