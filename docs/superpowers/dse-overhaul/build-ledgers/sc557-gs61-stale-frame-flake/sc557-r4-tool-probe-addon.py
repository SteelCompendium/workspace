#!/usr/bin/env python3
"""usage: r4-probe-addon.py <r3-probe.mjs> <out.mjs> -- SC-557 r4 add-on to the r3 probe harness (scratch only). Adds:
  SC557_INJF=b:v:n     from 300 ms after the note's first write, the card of block b shows v for EXACTLY n recorder frames (frame-precise:
                       the injector's rAF runs before the recorder's in every frame), then its value is restored. window.__sc557idx = 1..n on
                       those frames, 0 otherwise.
  SC557_TORNAT=k       the recorder's disk read is TORN (last value dropped) on the k-th injected frame only.
  SC557_BADREAD=torn   every disk read is torn (last value dropped).
Fault injection into the observed system / the read the recorder sees; the recorder's judgement is unchanged."""
import sys

src, dst = sys.argv[1], sys.argv[2]
s = open(src).read()

def sub(a, b):
    global s
    assert s.count(a) == 1, f'anchor matched {s.count(a)}: {a[:80]}'
    s = s.replace(a, b, 1)

sub("badread: process.env.SC557_BADREAD ?? '' };",
    "badread: process.env.SC557_BADREAD ?? '', injf: process.env.SC557_INJF ?? '', tornat: Number(process.env.SC557_TORNAT ?? 0) };")
sub("\t\t\t\t\tlet rf = 0;\n",
    "\t\t\t\t\tlet rf = 0;\n"
    "\t\t\t\t\twindow.__sc557idx = 0;\n"
    "\t\t\t\t\tif (PR.injf) {\n"
    "\t\t\t\t\t\tconst [fb, fv, fn] = PR.injf.split(':').map(Number);\n"
    "\t\t\t\t\t\tlet k = 0; let orig = null; let inpRef = null; let tw = null;\n"
    "\t\t\t\t\t\tconst injf = (ts) => {\n"
    "\t\t\t\t\t\t\tif (R.stop) return;\n"
    "\t\t\t\t\t\t\twindow.__sc557idx = 0;\n"
    "\t\t\t\t\t\t\tif (P.mods.length && tw === null) tw = ts;\n"
    "\t\t\t\t\t\t\tif (tw !== null && ts - tw >= 300 && k <= fn) {\n"
    "\t\t\t\t\t\t\t\tif (k < fn) {\n"
    "\t\t\t\t\t\t\t\t\tconst c = P.cardsRaw(leaf).find((x) => x.block === fb);\n"
    "\t\t\t\t\t\t\t\t\tconst inp = c ? Array.from(c.root.querySelectorAll('input')).find((i) => i.value !== '') : null;\n"
    "\t\t\t\t\t\t\t\t\tif (inp) { if (orig === null) { orig = inp.value; inpRef = inp; } inp.value = String(fv); k++; window.__sc557idx = k; window.__sc557ps.injected++; }\n"
    "\t\t\t\t\t\t\t\t} else { if (inpRef) inpRef.value = orig; k++; }\n"
    "\t\t\t\t\t\t\t}\n"
    "\t\t\t\t\t\t\trequestAnimationFrame(injf);\n"
    "\t\t\t\t\t\t};\n"
    "\t\t\t\t\t\trequestAnimationFrame(injf);\n"
    "\t\t\t\t\t}\n")
sub("\t\t\t\t\t\t\tconst read = valuesOf(fs.readFileSync(diskFile, 'utf8'));\n",
    "\t\t\t\t\t\t\tlet read = valuesOf(fs.readFileSync(diskFile, 'utf8'));\n"
    "\t\t\t\t\t\t\tif (PR.badread === 'torn' || (PR.tornat > 0 && window.__sc557idx === PR.tornat)) { read = read.slice(0, -1); window.__sc557ps.badreads++; }\n")
open(dst, 'w').write(s)
print('wrote', dst)
