#!/usr/bin/env python3
# usage: mut.py <mutant> <file>  apply one SC-547 r2 mutant to ReadingModeBlockHost.ts (in place)
import sys
m, p = sys.argv[1], sys.argv[2]
s = open(p).read()


def rep(a, b):
    global s
    assert a in s, (m, a[:80])
    s = s.replace(a, b, 1)


if m == 'drop':
    # (a) drop the fence cache entirely
    rep("\tconst cached = cache?.get(key);\n\tif (cached) return cached;\n", "\tconst cached = undefined as readonly FenceSpan[] | undefined;\n\tif (cached) return cached;\n")
elif m == 'hoist':
    # (b) the fence and windowEnds caches survive across passes (one module-level map each)
    rep("export const newPassMemo = (): PassMemo => ({ blocks: new Map(), fences: new Map(), windowEnds: new Map() });",
        "const HOIST_F = new Map<string, readonly FenceSpan[]>();\nconst HOIST_E = new Map<number, number>();\nexport const newPassMemo = (): PassMemo => ({ blocks: new Map(), fences: HOIST_F, windowEnds: HOIST_E });")
elif m == 'hoist-fences':
    rep("export const newPassMemo = (): PassMemo => ({ blocks: new Map(), fences: new Map(), windowEnds: new Map() });",
        "const HOIST_F = new Map<string, readonly FenceSpan[]>();\nexport const newPassMemo = (): PassMemo => ({ blocks: new Map(), fences: HOIST_F, windowEnds: new Map() });")
elif m == 'hoist-ends':
    rep("export const newPassMemo = (): PassMemo => ({ blocks: new Map(), fences: new Map(), windowEnds: new Map() });",
        "const HOIST_E = new Map<number, number>();\nexport const newPassMemo = (): PassMemo => ({ blocks: new Map(), fences: new Map(), windowEnds: HOIST_E });")
elif m == 'nokey-lineend':
    # cache key without lineEnd: does any test notice a window-bounds collision?
    rep("const key = `${section.lineStart}:${section.lineEnd}:${language}`;", "const key = `${section.lineStart}:${language}`;")
elif m == 'nokey-lang':
    rep("const key = `${section.lineStart}:${section.lineEnd}:${language}`;", "const key = `${section.lineStart}:${section.lineEnd}`;")
elif m == 'fixkey':
    # r2 prescribed fix (scratch only): a hit counts only for the same lines array it was read from
    rep("\tconst cached = cache?.get(key);\n\tif (cached) return cached;\n", "\tconst hit = cache?.get(key) as { lines: readonly string[]; spans: readonly FenceSpan[] } | undefined;\n\tif (hit && hit.lines === lines) return hit.spans;\n")
    rep("\tcache?.set(key, fences);\n", "\tcache?.set(key, { lines, spans: fences } as never);\n")
else:
    raise SystemExit('unknown mutant ' + m)
open(p, 'w').write(s)
print('applied', m)
