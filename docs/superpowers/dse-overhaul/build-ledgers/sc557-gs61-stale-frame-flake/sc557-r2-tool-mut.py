#!/usr/bin/env python3
"""usage: r2-mut.py <src-root> <M2|M3|M4sc544> -- one SC-544 control on an exported copy (never the worktree).
M2 / M3 are SC-544 r3's mut.py m2 / m3 verbatim; M4sc544 is SC-544 r3's m4 verbatim (sibling-based, DOM test on the sibling's root),
re-anchored to the 31d8f779 indentation (the skip line sits one tab deeper inside SC-544 r4's try/finally)."""
import re, sys

root, which = sys.argv[1], sys.argv[2]
R = f'{root}/src/framework/host/ReadingModeBlockHost.ts'
G = f'{root}/src/framework/host/viewRegistry.ts'
call = "\t\tthis.registry?.flushPendingWrites(this.ctx.sourcePath, this.entry);\n"

def sub(path, a, b):
    s = open(path).read()
    assert s.count(a) == 1, f'{which}: anchor matched {s.count(a)} times in {path}'
    open(path, 'w').write(s.replace(a, b, 1))
    print(f'applied {which} to {path}')

if which == 'M2':
    sub(R, call, '')
    sub(R, "\t\t\tsettled = true;\n", "\t\t\tsettled = true;\n\t" + call)
elif which == 'M3':
    sub(R, call, "\t\tif (options?.fromView === true) this.registry?.flushPendingWrites(this.ctx.sourcePath, this.entry);\n")
elif which == 'M4sc544':
    s = open(G).read()
    m = re.findall(r"^(\t+)if \(entry === except \|\| entry\.released \|\| entry\.host\.sourcePath !== sourcePath\) continue;\n", s, re.M)
    assert len(m) == 1, m
    ind = m[0]
    a = f"{ind}if (entry === except || entry.released || entry.host.sourcePath !== sourcePath) continue;\n"
    sub(G, a, a + f"{ind}if (!entry.root.closest('.cm-callout')) continue; // MUTANT M4: only Live Preview callout views\n")
else:
    raise SystemExit('unknown ' + which)
