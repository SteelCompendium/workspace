# SC-191 re-review 3 — scoped re-check of the fix-4 delta (reviewer-L)

**COMPLETE.**

Worktree: `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements`
Branch `sc191-montage-overhaul` @ `c2a5cec`, base `origin/develop` `9227dd9`.
Delta: `git diff eeabdc9..c2a5cec` — one commit, `c2a5cec SC-191 fix 4 — print pip fill, complete-state round headers`.
Tree clean before and after (`git status --short` empty both times).

## Executive summary

**Verdict: LAND-READY.** Both re-review-2 findings are fixed exactly as prescribed, each
proved by running the thing and each with a can-fail proof. **M-A:** the print pip
`::after` now computes `rgb(138,106,0)` (`#8a6a00`) on the un-pinned, pinned, print-twin
and real-print cases; pip crops that measured **0 gold pixels** at `eeabdc9` now measure
**55–66 px of `#896A00`** for both ▲ and ▼; the fill rule is flat at brace depth 0 — no
specificity trap; deleting it OR repointing it at `--dse-metal-line` both turn the new test
red. **2c:** the guard moved into `roundState()` (mock parity) — all three completeness
shapes (success-limit-ended, failure-limit-ended, and a constructed round-exhausted one)
give all-`past` headers, while `fixture-mid` and `example.yaml` keep `current`/"in play".
**Delta hygiene:** exactly the 4 named files, nothing else. **Regressions: none** — the
screen-side pip is byte-identical, and 0 non-montage shots moved. **Battery** all matches:
tsc/lint clean; jest **3697 / 1 skipped / 195 suites** (+3 = the delta's 3 new tests);
shots 508, 0 ERROR, 2 runs byte-identical, pin 1.14.0 / 678 / input OK; freeze **exactly
the 2 montage print lines**, 0 others; parity 0/0/16. Freeze package: 16/16 `sha256sum -c`
OK against my run, 0 collisions; **all 16 lines moved** (+4 non-frozen screen captures).
Pips are plainly visible on the seals in both after-crops. No further finding.

## Progress log

- [x] Worktree/sha verified, delta enumerated
- [x] §2.3 delta hygiene
- [x] §2.1 M-A
- [x] §2.2 2c
- [x] §2.4 regressions
- [x] §3 battery + freeze package

## §2.3 Delta hygiene — CLEAN

`git diff eeabdc9..c2a5cec --stat` — **4 files, +70/−6**, one commit
(`c2a5cec SC-191 fix 4 — print pip fill, complete-state round headers`):

```
 src/elements/montage/BoardView.ts       |  6 ++++++
 styles-source.css                       | 19 ++++++++++++------
 test/dom/elements/montage-strip.test.ts | 16 +++++++++++++++
 test/dom/elements/montage.test.ts       | 35 +++++++++++++++++++++++++++++++++
```

Exactly the set the brief names (CHANGELOG.md untouched — correct, neither fix is a
user-facing behaviour change beyond what the existing entry already describes). **Nothing
outside that set.** No new files, no deletions, no rebase (base still `9227dd9`).

## §3 Battery — full run on `c2a5cec` (logs in `…/scratchpad/rereview3/logs/`)

| Gate | Expected | Actual | Verdict |
|---|---|---|---|
| `npm run tsc` | clean, exit 0 | clean, `tsc_exit=0` | MATCH |
| `npm run lint` | clean, exit 0 | clean (only the pre-existing `.eslintignore` deprecation notice), `lint_exit=0` | MATCH |
| `rm -f main.js styles.css && npx jest` | fix-4 report's 3697 / 1 skipped / 195 suites | `Test Suites: 1 skipped, 194 passed, 194 of 195 total`; `Tests: 1 skipped, 3697 passed, 3698 total`; 3 snapshots; `jest_exit=0` | MATCH (**+3 vs re-review 2's 3694** = the 3 new tests in the delta, exactly) |
| `npm run shots` ×2 | 508 PNGs, 0 ERROR, byte-identical | 508 / 508, 0 ERROR both, `diff shots1.sha shots2.sha` **empty (508/508 byte-identical)**, both exit 0 | MATCH |
| in-run gates | pin 1.14.0 / 678 / input | `host-copy pin OK (… verbatim Obsidian 1.14.0 … 0 unclassifiable)`; `button host-leak OK (113 kinds × 3 states × dark/light = **678** comparisons)`; `input host-leak OK (13 kinds × 6 states × dark/light = 154 comparisons … Obsidian 1.14.0)`; plus `montage track widths OK`, `chrome host-leak OK`, `print-twin parity OK (126 ids)`, `nested corner-radius OK` — all present in BOTH runs | MATCH |
| `check-freeze.sh` | exactly 2 montage print lines FAILED | exactly `montage--steel-print.png` + `montage--steel-realprint.png`; **`: FAILED` count = 2, `: FAILED open or read` count = 0** — 0 others; exit 1 (the expected sanctioned-rebaseline signal) | MATCH |
| `npm run parity` | 0 / 0 / 16 | `**0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**`, `parity_exit=0` | MATCH |

### Freeze package on `c2a5cec`

- `rebaseline.txt` — 2 lines, both `c8493be6b39a3fc6df213ae659c37733a945e1c1ac06184b5bbdfb93ac9085d7`.
  `sha256sum -c` against MY shots dir: both `OK`, exit 0.
- `widening.txt` — 14 lines (`montage-{mid,done,failed,old-shape,narrow,guide-open,strip-pinned}` ×
  print/realprint). `sha256sum -c` against MY run: **14/14 OK**, exit 0; twin == realprint
  within every pair.
- Collisions with the 210-line baseline: **0** (`comm -12` of filename sets).
- `freeze-baseline.sha256` untouched by me and by the branch.

### Which lines moved vs my re-review-2 hashes (`rereview2b/logs/shots1.sha` @ `eeabdc9`)

Full 508-file comparison: **20 files changed, 0 added, 0 removed. Every one is a montage capture.**

- **All 16 freeze-package lines moved** — 2 rebaseline (`montage--steel-{print,realprint}`)
  + all 14 widening. Matches the fix-4 report's claim exactly. Cause: the pip fill reaches
  every strip-bearing print capture, and print force-opens the strip on all of them.
  Old rebaseline hash `74176eb8…` → new `c8493be6…`.
- **4 further, non-frozen, screen-only captures moved:**
  `montage-done--steel-{dark,light}` and `montage-failed--steel-{dark,light}` — the 2c
  header fix. Both fixtures are COMPLETE montages, so their round headers change on screen
  too. Correct and expected; neither name is in the baseline or the widening, so neither
  needs a sanction.
- **Nothing else in the 508 moved** — no other element's bytes, and crucially
  `montage-{mid,narrow,old-shape,guide-open,strip-pinned}--steel-{dark,light}` and
  `montage--steel-{dark,light}` are all **unchanged**: those fixtures are not complete, so
  the 2c fix correctly leaves them alone, and the pip fill is print-scoped so it cannot
  reach a screen capture.

## §2.1 M-A (print pip fill) — **VERIFIED-FIXED**

Fix as applied: `styles-source.css:5091-5093`, exactly the declaration I prescribed —

```css
[data-dse-print="on"][data-dse-element="montage"] .dse-mt__tier-pip::after {
	background: var(--dse-vp);
}
```

**Flat, not nested — no specificity trap.** Scripted brace-depth check on the raw source:
the fill rule at line 5091 sits at **brace depth 0** (top level), as does the shared
geometry rule at 5086; both selectors are written out in full with no leading tab and no
enclosing block. The fill rule is *after* the geometry rule in source order at identical
specificity, and the geometry rule declares no `background`, so there is nothing for it to
lose to. The misleading "already exist in the Steel rule" comment was rewritten to state
the real reason the restatement is needed. Verified empirically as well — the measurements
below are the compiled sheet as the harness actually loads it.

**Computed `::after` background under print** (probe `…/rereview3/probe-h1.mjs`, output
`…/rereview3/logs/probe-h1.json`; all 7 pips, both riders):

| Case | `::after` background | inset | clip-path |
|---|---|---|---|
| `default` print twin (**un-pinned**) | **`rgb(138, 106, 0)`** = `#8a6a00` | 0px | ▲ `polygon(50% 0, 100% 100%, 0 100%)` / ▼ `polygon(0 0, 100% 0, 50% 100%)` |
| `default` **real print** (`emulateMedia`) | `rgb(138, 106, 0)` | 0px | same |
| `strip-pinned` print twin | `rgb(138, 106, 0)` | 0px | same |
| `mid` print twin | `rgb(138, 106, 0)` | 0px | same |
| `strip-pinned` **screen** (regression check) | `rgb(224, 176, 80)`, rim `::before` `rgba(176,183,187,0.5)` | 1px | same — **unchanged from re-review 2** |

**Pixel histograms** of the 25×22 px crop centred on each pip (`magick … histogram`), the
same crops that measured **0 gold pixels** at `eeabdc9`:

| Crop | gold pixels now | at `eeabdc9` |
|---|---|---|
| default print twin, **▲ reward** | **61 px `#896A00`** + 10 blend | 0 |
| default print twin, **▼ consequence** | **55 px `#896A00`** + 25 blend | 0 |
| default **realprint**, ▲ / ▼ | 61 / 55 px `#896A00` (byte-identical to the twin) | 0 |
| strip-pinned print twin, **▲** | **66 px `#8A6A00`** + 10 blend | 0 |
| strip-pinned print twin, **▼** | **64 px `#896A00`** + 11 blend | 0 |
| strip-pinned **screen**, ▲ | 45 px `#DDB053` + 8 blend | 45 px (unchanged) |

Both riders, both print classes, both the un-pinned and the pinned fixture. Fill only —
the `::before` rim stays `rgba(0,0,0,0)` under print, which is the documented intent
(`--dse-metal-line` resolves to `none` on paper).

**Can-fail (`…/rereview3/canfail.sh`, breaks applied to `styles-source.css`, reverted):**

| Break | Result |
|---|---|
| delete the dedicated print `::after` fill rule entirely | `montage-strip.test.ts` **1 failed / 19 passed** — "M-A: the print ::after pip rule carries its own fill (var(--dse-vp))" |
| keep the rule but point it at the print-dead token (`background: var(--dse-metal-line)`) — the exact trap the original comment fell into | `montage-strip.test.ts` **1 failed / 19 passed**, same test |

The second variant matters: the test does not merely check that *some* `background` exists,
it requires `var(--dse-vp)` specifically, so the failure mode that shipped in fix 3 cannot
recur in a differently-spelled form.

## §2.2 2c (complete-state round headers) — **VERIFIED-FIXED**

Fix as applied: `src/elements/montage/BoardView.ts:317-322` — the guard moved into the
shared `roundState()` helper, matching `mock6.js:1704`:

```ts
if (montageTallies(this.model).complete) return 'past';
```

Measured through the real `ElementPipeline` (probe `…/rereview3/zz-rereview3-probe.test.ts`,
5/5 green, log `…/rereview3/logs/probe-2c.log`). `[round, data-state, sub-text]`:

| Fixture | Completeness shape | Headers |
|---|---|---|
| `montage-done` | complete, **success-limit-ended mid-round** (succ 6/6, cr 3, rounds 3) | `[1 past done] [2 past done] [3 past done]` |
| `montage-failed` | complete, **failure-limit-ended mid-round** (fail 3/3, cr 3, rounds 3) | `[1 past done] [2 past done] [3 past done]` |
| constructed **round-exhausted** (limits raised to 9/9, `current_round: 4`) — `montageReopenable === true`, proving it is round-exhausted and not limit-ended | complete, no limit hit | `[1 past done] [2 past done] [3 past done]` |
| `fixture-mid` (regression) | **not** complete (succ 5/6, cr 3) | `[1 past done] [2 past done] [3 **current** **in play**]` |
| `example.yaml` (regression) | not started, cr 1 of 2 | `[1 **current** **in play**] [2 future to come]` |

All three completeness shapes read `past`; both in-progress fixtures keep `current`/"in
play". Neither shipped fixture is round-exhausted, so I constructed that third shape — the
delta's own two tests cover only the limit-ended and in-progress cases.

**Can-fail:** removing the guard line from `roundState()` → `montage.test.ts` **1 failed /
76 passed**, "on a complete montage (montage-done, limit-ended mid-round), every round
header reads past/'done'" — `Expected: "past" / Received: "current"`. Only one of the two
new tests goes red, which is correct: the second is the no-regression guard on `fixture-mid`
and passes with or without the fix.

## §2.4 Regressions — NONE

- **Screen-side pip intact.** `montage-strip-pinned--steel-dark.png` hash
  `b11e753e86e06922…` is **identical** to my re-review-2 run at `eeabdc9`; so is
  `montage-strip-pinned--steel-light.png` (`e9edc5bd…`). Computed styles confirm it: screen
  `::after` still `rgb(224,176,80)` at `inset: 1px` with the `rgba(176,183,187,.5)` rim.
- **Non-montage shots moved: 0** of 508.
- `montage--steel-{dark,light}`, `montage-mid--steel-{dark,light}`, `montage-narrow`,
  `montage-old-shape`, `montage-guide-open` screen captures all unchanged.
- The 4 screen captures that DID move (`montage-done`/`montage-failed` dark+light) are the
  intended 2c effect on the only two complete fixtures.
- jest 3697/3698 green — no shipped test regressed; the +3 is exactly the delta's 3 new tests.

## After-crop descriptions — **pips ARE visible on the seals**

Both crops are byte-identical to my own regenerated shots (`sc191-freeze-montage--steel-{print,realprint}-after.png`
= `c8493be6…` = my `montage--steel-{print,realprint}.png`; `sc191-freeze-montage-strip-pinned--steel-print-after.png`
= `b3e221eb…` = my `montage-strip-pinned--steel-print.png`). They ARE the sanction bytes.

**`sc191-freeze-montage--steel-print-after.png`** (1520×2510, `example.yaml`, strip
un-pinned). Same laid-out tier table as fix 3 — head `Easy | Medium | Hard`, four badge-keyed
rows `≤11` / `12-16` / `17+` / `crit`, green ✓ and red ✗ circle seals with their two stacked
words — **but every rider seal now carries its gold-brown triangle riding the seal's
bottom-right corner**, painted in the print ink `#8a6a00`. Counted on the page: **three ▼
(point-down)** pips on the three "with a consequence" cells (≤11/Easy on a green success
seal, ≤11/Hard on a red failure seal, 12-16/Medium on a green seal), and **four ▲
(point-up)** pips on the four "with a reward" cells (17+/Easy and all three crit-row cells).
The five non-rider cells (12-16/Easy, ≤11/Medium, 12-16/Hard, 17+/Medium, 17+/Hard) show a
bare seal with no mark — so the mark is present exactly where the words say it should be,
and the printed legend below ("a rider rides the seal's corner: ▲ with a reward · ▼ with a
consequence") now points at something the paper actually carries. The ▲/▼ distinction is
legible at 100% and the gold reads clearly against both the green and the red seal rings.
Everything below the strip is unchanged from re-review 2 (board `Round 1 in play` / `Round 2
to come` — correct, this fixture is Not started, not complete; outcome band; guide showing
only the stub).

**`sc191-freeze-montage-strip-pinned--steel-print-after.png`** (1520×3606, `mid` + strip
pinned). Identical tier table with the **same 7 pips in the same 7 cells** (three ▼, four ▲,
gold-brown, on the seal corners) — confirming the fill reaches the pinned print capture as
well as the un-pinned one. Below it, unchanged from re-review 2: the five-hero board
(`Round 1 done | Round 2 done | Round 3 in play | Tally` — round 3 still reads "in play",
which is **correct**: `fixture-mid` is successes 5/6, not complete, so 2c does not touch
it), the ✓/✗/⊕ marks over their skill words, the outcome band with the hatched failure
slots, the Notes block, and the foot guide showing only the "Each test" stub.

## Bounds

Fix nothing — I applied no fix. Every temporary break reverted with `git checkout --`.
Probe test file `test/dom/elements/zz-rereview3-probe.test.ts` created, run, copied to
scratch, and **deleted**. `git status --short` empty at the end. No rebase, no commit, no
tag, no push, no tracker call. `freeze-baseline.sha256` untouched.
