#!/usr/bin/env python3
"""usage: r2-probe-patch.py <in.mjs> <out.mjs> -- SC-557 r3 PROBE harness (scratch only; r2 patch re-anchored for the r3 recorder): the G-S61 recorder unchanged, plus
env-driven fault injection into the OBSERVED system (never into the recorder's judgement):
  SC557_DOC_DELAY_MS=D  while a recorder runs, every editor transaction that changes the document is held back D ms; the held changes are
                        coalesced (prefix/suffix diff from the doc at apply time to the newest target doc), so the editor's document lags the disk by ~D ms.
  SC557_INJ=b:v:ms      from the first write of the note, for ms ms, the card of block b shows v (its input's value is overwritten every frame), then restored.
  SC557_BADREAD=1|alt   the recorder's disk read fails every frame (1) or every other frame (alt) - simulates fs/getFullPath failing or torn reads.
The outcome line gets ' probe{...}' with what the probe did."""
import sys

src, dst = sys.argv[1], sys.argv[2]
s = open(src).read()

def sub(a, b):
    global s
    assert s.count(a) == 1, f'anchor matched {s.count(a)}: {a[:80]}'
    s = s.replace(a, b, 1)

sub("\t\t\tconst CATCH_UP_CAP_MS = 1000;\n",
    "\t\t\tconst CATCH_UP_CAP_MS = 1000;\n"
    "\t\t\tconst SC557 = { delay: Number(process.env.SC557_DOC_DELAY_MS ?? 0), inj: process.env.SC557_INJ ?? '', badread: process.env.SC557_BADREAD ?? '' };\n")
sub("${rec.odd.length ? '; counted: ' + rec.odd.join(', ') : ''}]`;",
    "${rec.odd.length ? '; counted: ' + rec.odd.join(', ') : ''}]` + ` probe{delayed ${rec.probe?.delayed}, applied ${rec.probe?.applied}, injected ${rec.probe?.injected}, badreads ${rec.probe?.badreads}, applyErr ${rec.probe?.err}}`;")
sub("\t\t\t\t\tconst R = (P.rec = { frames: 0,",
    "\t\t\t\t\tconst PR = ${J(SC557)};\n"
    "\t\t\t\t\tconst PS = (window.__sc557ps = { delayed: 0, applied: 0, injected: 0, badreads: 0, err: '' });\n"
    "\t\t\t\t\twindow.__sc557on = true;\n"
    "\t\t\t\t\tconst cm0 = leaf.view.editor.cm;\n"
    "\t\t\t\t\tif (PR.delay > 0 && !cm0.__sc557wrapped) {\n"
    "\t\t\t\t\t\tcm0.__sc557wrapped = true;\n"
    "\t\t\t\t\t\tconst orig = cm0.dispatch;\n"
    "\t\t\t\t\t\tlet target = null;\n"
    "\t\t\t\t\t\tlet timer = null;\n"
    "\t\t\t\t\t\tconst applyHeld = () => {\n"
    "\t\t\t\t\t\t\ttimer = null;\n"
    "\t\t\t\t\t\t\tconst want = target; target = null;\n"
    "\t\t\t\t\t\t\tconst have = cm0.state.doc.toString();\n"
    "\t\t\t\t\t\t\tif (want === null || want === have) return;\n"
    "\t\t\t\t\t\t\tlet a = 0; while (a < have.length && a < want.length && have[a] === want[a]) a++;\n"
    "\t\t\t\t\t\t\tlet b = 0; while (b < have.length - a && b < want.length - a && have[have.length - 1 - b] === want[want.length - 1 - b]) b++;\n"
    "\t\t\t\t\t\t\ttry { orig.call(cm0, { changes: { from: a, to: have.length - b, insert: want.slice(a, want.length - b) } }); window.__sc557ps.applied++; } catch (e) { window.__sc557ps.err = String(e).slice(0, 80); }\n"
    "\t\t\t\t\t\t};\n"
    "\t\t\t\t\t\tcm0.dispatch = function (...args) {\n"
    "\t\t\t\t\t\t\tif (!window.__sc557on) return orig.apply(cm0, args);\n"
    "\t\t\t\t\t\t\tlet tr;\n"
    "\t\t\t\t\t\t\ttry { tr = args.length === 1 && args[0] && args[0].startState ? args[0] : cm0.state.update(...args); } catch (e) { return orig.apply(cm0, args); }\n"
    "\t\t\t\t\t\t\tif (!tr.docChanged) return orig.apply(cm0, args);\n"
    "\t\t\t\t\t\t\tif (tr.startState !== cm0.state) return orig.apply(cm0, args);\n"
    "\t\t\t\t\t\t\ttarget = tr.newDoc.toString();\n"
    "\t\t\t\t\t\t\twindow.__sc557ps.delayed++;\n"
    "\t\t\t\t\t\t\tif (timer === null) timer = setTimeout(applyHeld, PR.delay);\n"
    "\t\t\t\t\t\t};\n"
    "\t\t\t\t\t}\n"
    "\t\t\t\t\tconst R = (P.rec = { frames: 0,")
sub("\t\t\t\t\tconst diskFile = app.vault.adapter.getFullPath(leaf.view.file.path);\n",
    "\t\t\t\t\tconst diskFile0 = app.vault.adapter.getFullPath(leaf.view.file.path);\n"
    "\t\t\t\t\tlet rf = 0;\n"
    "\t\t\t\t\tif (PR.inj) {\n"
    "\t\t\t\t\t\tconst [ib, iv, ims] = PR.inj.split(':').map(Number);\n"
    "\t\t\t\t\t\tlet t0 = null;\n"
    "\t\t\t\t\t\tlet done = false;\n"
    "\t\t\t\t\t\tconst inj = (ts) => {\n"
    "\t\t\t\t\t\t\tif (R.stop || done) return;\n"
    "\t\t\t\t\t\t\tif (P.mods.length && t0 === null) t0 = ts;\n"
    "\t\t\t\t\t\t\tconst c = P.cardsRaw(leaf).find((x) => x.block === ib);\n"
    "\t\t\t\t\t\t\tconst inp = c ? Array.from(c.root.querySelectorAll('input')).find((i) => i.value !== '') : null;\n"
    "\t\t\t\t\t\t\tif (t0 !== null && ts - t0 <= ims) {\n"
    "\t\t\t\t\t\t\t\tif (inp && inp.value !== String(iv)) { if (inp.__sc557orig === undefined) inp.__sc557orig = inp.value; inp.value = String(iv); }\n"
    "\t\t\t\t\t\t\t\tif (inp) window.__sc557ps.injected++;\n"
    "\t\t\t\t\t\t\t} else if (t0 !== null) {\n"
    "\t\t\t\t\t\t\t\tfor (const cc of P.cardsRaw(leaf)) for (const i of Array.from(cc.root.querySelectorAll('input'))) if (i.__sc557orig !== undefined) { i.value = i.__sc557orig; delete i.__sc557orig; }\n"
    "\t\t\t\t\t\t\t\tdone = true;\n"
    "\t\t\t\t\t\t\t\treturn;\n"
    "\t\t\t\t\t\t\t}\n"
    "\t\t\t\t\t\t\trequestAnimationFrame(inj);\n"
    "\t\t\t\t\t\t};\n"
    "\t\t\t\t\t\trequestAnimationFrame(inj);\n"
    "\t\t\t\t\t}\n")
sub("\t\t\t\t\t\t\tconst read = valuesOf(fs.readFileSync(diskFile, 'utf8'));\n",
    "\t\t\t\t\t\t\trf++;\n"
    "\t\t\t\t\t\t\tconst diskFile = (PR.badread === '1' || (PR.badread === 'alt' && rf % 2 === 0)) ? diskFile0 + '.sc557-missing' : diskFile0;\n"
    "\t\t\t\t\t\t\tif (diskFile !== diskFile0) window.__sc557ps.badreads++;\n"
    "\t\t\t\t\t\t\tconst read = valuesOf(fs.readFileSync(diskFile, 'utf8'));\n")
sub("P.recStop = () => { const R = P.rec; if (!R) return null; R.stop = true; return {",
    "P.recStop = () => { const R = P.rec; if (!R) return null; R.stop = true; window.__sc557on = false; return { probe: { ...window.__sc557ps },")
open(dst, 'w').write(s)
print('wrote', dst)
