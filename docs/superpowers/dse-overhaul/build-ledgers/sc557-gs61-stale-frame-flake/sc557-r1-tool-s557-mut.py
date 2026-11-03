#!/usr/bin/env python3
"""usage: s557-mut.py <src-root> <M1|M2|M3|M4> -- applies one SC-544 control to an exported copy (never the worktree)."""
import sys

R = 'src/framework/host/ReadingModeBlockHost.ts'
CALL = "\t\tthis.registry?.flushPendingWrites(this.ctx.sourcePath, this.entry);\n"
SETTLED = "\t\t\tsettled = true;\n"

MUTANTS = {
    # M1: no flush call
    'M1': [(R, CALL, "")],
    # M2: flush after the await Vault.process
    'M2': [(R, CALL, ""), (R, SETTLED, SETTLED + "\t\t\tthis.registry?.flushPendingWrites(this.ctx.sourcePath, this.entry);\n")],
    # M3: flush only for the view's own write
    'M3': [(R, CALL, "\t\tif (options?.fromView === true) this.registry?.flushPendingWrites(this.ctx.sourcePath, this.entry);\n")],
    # M4 (sibling-based, as in SC-544's r3 control): flushPendingWrites flushes only siblings that are Live Preview callout widgets. r1 used host.livePreviewCalloutWidget() as the test; SC-544's exact line is: if (!entry.root.closest('.cm-callout')) continue; (same phase set on 31d8f779: (f) only, pending only). Not a writer-based test.
    'M4': [('src/framework/host/viewRegistry.ts', "\t\t		if (entry === except || entry.released || entry.host.sourcePath !== sourcePath) continue;\n", "\t\t		if (entry === except || entry.released || entry.host.sourcePath !== sourcePath) continue;\n\t\t		if (!(entry.host as unknown as { livePreviewCalloutWidget(): Element | null }).livePreviewCalloutWidget()) continue;\n")],
}

root, n = sys.argv[1], sys.argv[2]
for path, a, b in MUTANTS[n]:
    p = f'{root}/{path}'
    s = open(p).read()
    assert s.count(a) == 1, f'{n}: anchor matched {s.count(a)} times'
    open(p, 'w').write(s.replace(a, b))
    print(f'applied {n} to {path}')
