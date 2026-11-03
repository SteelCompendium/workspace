#!/usr/bin/env python3
# usage: mkharness.py <scenario.mjs> <fixtures.js> <out harness path> <OUT env name> [harness source]
# A scratch copy of the worktree lifecycle harness with one extra scenario injected. The worktree file is never touched.
import sys
P = '/home/scott/code/steelCompendium/worktrees/sc552-twin-form-after-click/draw-steel-elements'
scen, fx, out, envname = sys.argv[1:5]
src = sys.argv[5] if len(sys.argv) > 5 else P + '/visual-harness/obsidian-lifecycle.mjs'
s = open(src).read()
def rep(a, b):
    global s
    assert s.count(a) == 1, a[:60]
    s = s.replace(a, b, 1)
rep("from '../scripts/xvfb-owned.mjs';", "from '%s/scripts/xvfb-owned.mjs';" % P)
rep("const dir = path.dirname(fileURLToPath(import.meta.url));", "const dir = '%s/visual-harness';" % P)
rep("const shotsDir = path.join(work, 'shots');", "const shotsDir = path.join(process.env.%s, 'shots');" % envname)
rep("\t\tif (fs.existsSync(shotsDir)) {\n\t\t\tconsole.log(`OBSIDIAN-LIFECYCLE temp dir kept", "\t\tif (false) {\n\t\t\tconsole.log(`OBSIDIAN-LIFECYCLE temp dir kept")
rep("// ------------------------------------------------------------------ note integrity", open(fx).read() + "\n// ------------------------------------------------------------------ note integrity")
anchor = "\n];\n\n// ---------------------------------------------------------------------------- main"
rep(anchor, "\n" + open(scen).read().rstrip('\n') + anchor)
open(out, 'w').write(s)
print('built', out)
