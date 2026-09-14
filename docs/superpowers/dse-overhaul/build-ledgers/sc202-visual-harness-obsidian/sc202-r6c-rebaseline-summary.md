# SC-202 r6c — rebaseline summary

`sc202-r6c-rebaseline.txt`: 252 `<sha256>  <filename>` lines, the full frozen print/twin
class, generated on the final committed tree (`f8bc63a` on `709151a` on `8a9e130` on
`d0fed38`). Deterministic across **three** independent clean `npm run shots` sweeps (not
just the required two) — every hash byte-identical each time; `sha256sum -c` against the
shots dir it was generated from reports all 252 `OK`.

## Moved vs. unchanged

**All 252 of 252 lines moved.** 0 unchanged. This matches the brief's own expectation
("most of the 252 + 8 widening") and Scott's sanctioned cost ("202 of 210 frozen lines move
once" — the 2026-09-04 ruling, scaled from the then-210-line baseline to today's 252-line
one after the SC-191 widening).

`check-freeze.sh` on the final tree: **`FREEZE VIOLATED (252 checksum mismatches, 0
missing)`** — expected, this round's whole point; every one of the 252 mismatched names is
present in `sc202-r6c-rebaseline.txt` (verified: the freeze check's own mismatch list and
the rebaseline file's name column are the same 252-name set, diffed empty both ways).

## The 8 widening lines (additions-only class — separate files, updated content)

The four widened fixtures (`feature-list`, `title-nested`, `treasure-hr` from r3;
`perk-links` from r4) also moved, since the font/leak fixes reach them too. Updated hash
files (same `<sha256>  <filename>` shape as the originals, ready for the dispatcher to
apply over `sc202-r3-widening.txt`/`sc202-r4-widening.txt` at landing — additions-only, no
sanction needed for a widening, but the CONTENT changed and needs updating alongside the
frozen-class rebaseline since both move for the same underlying cause):

- `sc202-r6c-r3widening-update.txt` (6 lines: `feature-list`, `title-nested`,
  `treasure-hr` × print/realprint)
- `sc202-r6c-r4widening-update.txt` (2 lines: `perk-links` × print/realprint)

## Grouped by cause

Every one of the 252 moved lines traces to one or both of this round's two commits:

1. **Realprint re-point (all 252, `feat(harness)` commit `709151a`)** — `--steel-realprint`
   changed from "the twin's own bytes, forced" (SC-170's byte-parity gate) to genuinely
   independent real-print-media rendering: real DOM chain (`.print` wrapper, forced
   `theme-light`, the real pinned app.css unconditionally on), so its own 130 lines move
   for a structural/rendering reason, not merely a color/font swap.
2. **Twin under the sheet (all 252, same commit)** — `--steel-print` (the twin) gained the
   real pinned app.css + the real `.markdown-preview-view` DOM chain for the first time
   (previously print/realprint were the round's own scope fence, untouched by r6b); its
   130 lines move for the same "real cascade, first time" reason r6b's screen combos moved
   in the prior round.
3. **Print font token (`fix(theme)` commit `f8bc63a`)** — nearly every one of the 252 moved
   lines ALSO reflects this: removing the print exclusion from the five font-slot consumer
   rules makes body/title/label/card-body text render "Source Serif 4" (serif) instead of
   falling through to an ambient host font under print — touches virtually every capture
   with visible text, compounding with causes 1/2 above rather than being separable from
   them in the byte diff.
4. **The two genuine leak fixes (`.dse-stamina__pill`, `.dse-init__portrait-fallback`,
   same commit)** — narrow, only the stamina-bar-family and initiative-family fixtures
   that actually render these two classes.

Given every line reflects causes 1+2 together (the realprint re-point and the twin's own
new sheet exposure are the SAME commit and cannot be separated in the byte diff — a pure
DOM-chain change with no visible token difference would still move bytes, since the
capture is genuinely different pixels now), and cause 3 (the font fix) independently
touches nearly all 252 too, this round's move is NOT decomposable into "bucket A moved
only for reason X" the way some past single-cause rebaselines were — it is closer to "the
entire class moved because the surface itself changed," which is exactly what option C
asked for.

## Self-consistency proof

```
$ sha256sum -c sc202-r6c-rebaseline.txt   # run from visual-harness/shots/
... 252 lines, all "OK"
```

## Never touched

`.superpowers/sdd/freeze-baseline.sha256` — untouched by this worker. Applying
`sc202-r6c-rebaseline.txt` (and the two widening-update files) to it is the dispatcher's
job, after Scott's sanction.
