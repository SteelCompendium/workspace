# SC-191 re-review 1 — scoped re-review of the fix-1 delta (`b2f696e..7d4451a`)

## Executive summary

VERDICT: **CLEAR-FOR-SLICE-3** — 0 new HIGH, 0 new MEDIUM, 0 regressions.
All 13 folded findings **VERIFIED-FIXED by execution**, not by reading: H-1 (0 band/rule
contradictions across an exhaustive 324-state sweep; `mid` and `old-shape` now render
"Partial Success"), H-2 (print: 0 visible buttons, cell `opacity 1` / no border, track slots
inked `#333` with the failure hatch preserved), M-1 (cell is a `div`, `isDseBtn false`,
`opacity 1`), M-2/M-3 (light current-column wash now `rgba(42,123,136,.1)` vs past
`rgba(0,0,0,.01)` — distinguishable in both schemes), M-4 (`role` null, tally
`aria-label "Kira: 2 successes, 0 failures"`), M-5 (new in-run gate green **and proven able
to fail**: breaking `display:contents` printed `MONTAGE EQUAL-WIDTH TRACKS VIOLATED … 0.00px
vs 175.38px`, exit 1), L-1/L-2/L-3/L-4/L-6/I-5/I-8.
L-2's owner-ruled path verified end to end: `result: sucess` round-trips **byte-identical**,
the note survives on the cell mark and in the band, one distinctly-worded `console.warn`, and
a wrong-*type* result still drops. Battery: tsc/lint clean, jest **3579/1 skipped**, shots 498
0 FAIL byte-identical across **three** sweeps, freeze exactly the 2 montage lines, parity
0/0/16. `rebaseline.txt` (2) and `widening.txt` (10) both hash-match my run; additions-only,
0 collisions; the after-print crop meets its acceptance bar. Tree clean.

---

## Per-finding verification

| # | Status | Proof (executed) |
|---|---|---|
| **H-1** outcome band contradicts its rule line | **VERIFIED-FIXED** | `model.ts:200` is now `if (m.successes - m.failures >= 2) return 'partial';` — the `exhausted &&` gate is gone. Exhaustive probe over 324 states (s 0-8 × f 0-8 × cr 1-4): **0 contradictions** (no `failure` with margin ≥ 2, no `partial` with margin < 2). Rendered: `mid` → `data-band="partial"` / "If it ended now" / **"Partial Success"** over "currently +3"; `old-shape` → partial over "+2"; `failed` → "Final result" / "Total Failure"; `done` → "Final result" / "Total Success". Freeze-neutral as predicted — the frozen `default` fixture is 0/0 → `pending`. |
| **H-2** print: button boxes + inkless tracks | **VERIFIED-FIXED** | Computed style under `emulateMedia('print')`, both `print=1` and real print: `addHero display:none`, `rowAct display:none`, `menu display:none`, **`visibleBtns: 0`**; `.dse-mt__cell` `display:flex, opacity:1, border:0px none, background:transparent` (no box, no dimming); `.dse-mt__track-slot` empty `border:1px solid rgb(51,51,51)`, filled-success `background:rgb(51,51,51)`, filled-failure `repeating-linear-gradient(135deg, rgb(51,51,51)…)` — the colourblind hatch survives print. New tier at `styles-source.css:4459-4487`. |
| **M-1** cell wore `.dse-btn` chrome + 50 % opacity | **VERIFIED-FIXED** | Measured on `mid`/steel-dark: cell `tag DIV`, `cls "dse-mt__cell"`, `isDseBtn false`, `role="button" tabindex="0" aria-disabled="true"`, `border ""`, `borderRadius 0px`, `boxShadow none`, **`opacity 1`** (every cell — `cellOpacities: ["1"]`). 15/15 cells are divs, 0 are buttons. Element button count 22 → **7**; the in-run button host-leak sweep independently dropped 111 → **110** kinds. Visually confirmed in `montage-mid--steel-light.png`: flat cells, row separators only, full-saturation rings — the approved `sc191-r6-card-light.png` composition. |
| **M-2** light scheme lost the current-round wash | **VERIFIED-FIXED** | dark: current `rgba(77,184,199,0.1)` vs past `rgba(255,255,255,0.016)` → distinguishable. light: current `rgba(42,123,136,0.1)` vs past `rgba(0,0,0,0.01)` → **distinguishable** (was identical). The nested `body.theme-light &` at `styles-source.css:4197-4201` now matches the row-banding twin's specificity. |
| **M-3** hard-coded accent-hue literal | **VERIFIED-FIXED** | `rgba(77, 184, 199, 0.07)` is gone from the sheet; the rule reads `background: var(--dse-hover)`. Token resolves per scheme: dark `rgba(77,184,199,0.10)`, light `rgba(42,123,136,0.10)` — i.e. the wash now tracks Steel light's own accent `#2a7b88`, which the literal never did. |
| **M-4** invalid `role="table"`; tally reads "20" | **VERIFIED-FIXED** | `boardRole: null`; board children `{"<div>": 30}` (no orphan `role`); `.dse-mt__board-total` `aria-label "Kira: 2 successes, 0 failures"` (correctly singular at 1: "Kira: 1 success, 0 failures"); both `.dse-mt__tally` spans `aria-hidden="true"`. |
| **M-5** equal-width ruling ungated | **VERIFIED-FIXED** | New `assertMontageTrackWidths` (`visual-harness/shoot.mjs:416-459`, called at `:1779`) printed `montage track widths OK (success 413.13px === failure 413.13px, montage:mid, 6/3 limits)` on **all three** of my shot sweeps. Independently measured equal on `mid` 413.13/413.13, `old-shape` 413.13/413.13, `failed` 371.86/371.86, `done` 381.42/381.42, narrow-300 202.81/202.81. |
| **L-1** vacuous-limit copy | **VERIFIED-FIXED** | `model.ts` checks `limit === 0` first → `"no success limit set"` / `"no failure limit set"`; `OutcomeBandView` renders a `.dse-mt__track-empty` "no limit set" caption instead of a zero-slot track. **15,876-state sweep** (sl 0-6 × fl 0-6 × s 0-8 × f 0-8 × cr 1-4): 0 violations — no live-but-"reached" string, no `NaN`/`undefined`, and every `limit === 0` state produced the vacuous tail. The removed "reached"-while-live branches are confirmed unreachable, not merely untested. |
| **L-2** malformed entry silently dropped | **VERIFIED-FIXED (owner's path, verified specifically)** | `result: sucess` with a note: model keeps `{hero, round, result:"sucess", note}`; `serialize(parse(x)) === x` **byte-identical**; exactly one warn, distinctly worded (`…has an unrecognised result "sucess" — preserved as-is, rendered as unrecorded`). Rendered: cell `data-kind="none"`, `data-noted="on"`, note mark present, face "no action", aria-label `…unrecognised result "sucess". Note: …`; band note listed with `data-kind="none"` and the neutral `minus` glyph — never the old assist fallback. Raw value never leaks into non-aria DOM. Wrong-*type* (`result: 7`) still drops the whole entry and warns with the **drop** wording. A well-formed block warns **zero** times. |
| **L-3** `participants: []` emitted | **VERIFIED-FIXED** | `participants: []` → key absent from the model and from `serialize` output; a populated roster still round-trips. |
| **L-4** notes tie-break alphabetical | **VERIFIED-FIXED (code)** | Own probe with roster `[Yenna, Bram]` and two **same-round** notes (alphabetical would give Bram first): board row order `["Yenna","Bram"]`, notes order `["Yenna","Bram"]` — roster order wins. *Verification detail, not a finding:* reverting the sort key to `localeCompare` broke **0** tests, confirming the implementer's own follow-up that the existing test cannot distinguish the two orders. Per the ledger that gap is already folded into slice 3, so it is not raised here. |
| **L-6** duplicate hero+round disagreed | **VERIFIED-FIXED** | Two `Kira/round 1` entries (success then failure): exactly **1** cell rendered, `data-kind="success"` (first wins), tally `aria-label "Kira: 1 success, 0 failures"` — board and tally now agree. |
| **I-5** widening file | **VERIFIED-FIXED** | `widening.txt` = 10 lines, `montage-{done,failed,mid,narrow,old-shape}--steel-{print,realprint}.png`. All 10 hashes equal my own run. Scripted collision check against the 210-line baseline: **0 collisions**. `rebaseline.txt` + `widening.txt` filename set is **exactly** the set of producible montage print-class captures (sorted diff empty both ways). |
| **I-8** complete band printed the wrong rule | **VERIFIED-FIXED** | `failed` → `"Total Failure — no Victories awarded."`; `done` → the Total Success Victory sentence; a complete `partial` gets its own sentence (covered by a new DOM test, proven red below). Live branch unchanged. |

### New tests are capable of failing (each break reverted; sources `diff`-identical after)

| Break | Result |
|---|---|
| H-1: restore the `exhausted &&` gate | **5 failed** — 2 `test.each` boundary rows (the "exact H-1 regression case" and the final-round case), the repo's own can-fail invariant, my exhaustive probe, and the DOM "Partial Success" band test |
| M-1 (`.dse-btn` back) + M-4 (`role="table"` back) + L-6 (dedup reverted) | **4 failed** — open-socket shape, recorded-cell shape, the M-4 a11y test, the L-6 duplicate test |
| L-2 (strict `result` again) + L-1 (vacuous branch removed) | **9 failed** — preserve-vs-drop, both warn-wording tests, the typo round-trip test, both "no limit set" tail tests, the complete-but-vacuous test, and both DOM tests (cell face + band note) |
| I-8 (rule line always the Total Success sentence) | **2 failed** — the complete-`partial` and complete-`failure` rule-line tests |
| M-5: `.dse-mt__prog { display: contents }` → `display: grid` | **`npm run shots` exit 1**, `MONTAGE EQUAL-WIDTH TRACKS VIOLATED — success 0.00px vs failure 175.38px (diff 175.38px) on montage:mid (6/3 limits)` with an actionable remedy pointing at the two responsible selectors |

*(L-4's test does not fail on a revert — stated above, folded into slice 3 by ruling.)*

### Regression sweep on the slice-1/2 surfaces

No regressions. Re-ran review-1's own PASS items against the delta: all four round-trip
shapes still `serialize(parse(x)) === x` byte-identical (old-shape, new-shape-all-optionals,
orphan-hero entry, `_dse_anchor`-only); §B.5 top-level and entry key order still exact from
reverse-authored input; `montageTallies` still reads scalars only when `entries` disagree
(4/2 kept, not recounted); §C probes re-run through a real `ReadingModeBlockHost` + FakeVault
— rendering writes 0 times, surrounding `## Above` / `## Below` byte-intact, hand-edited
`success_limit: 9` / `rounds: 4` survive, three rapid Resets coalesce to **1** write,
`canPersist:false` performs 0 writes and shows no ⋯ menu.

Two things I checked and cleared rather than raise:
- The 15 cells are now `tabindex="0"` + `aria-disabled="true"` (previously native `disabled`,
  hence unfocusable), so they are keyboard tab stops that do nothing while stubbed. This is
  spec §D's literal mapping and `aria-disabled` announces the state; the ledger's I-6 ruling
  ("disabled+badged affordances ARE Scott's explicit read-only states rule") covers the shape.
  Not raised.
- A read-only jsdom render reports 2 enabled buttons. Enumerated them: they are the framework
  chrome's `Expand`/`Collapse Montage Test tracker`, present on every element and read-only
  safe. Both montage board controls (`Add a hero`, `Log an action for Kira`) carry the real
  `disabled` property **and** attribute in both persist modes. Not a montage issue.

### Freeze package

- `npm run shots` ×2 on the pristine tree, then a third sweep after the M-5 break was
  reverted: **498 PNGs, 0 FAIL every time; all 498 sha256 identical across all three**
  (both diffs 0 lines).
- `check-freeze.sh` → `FREEZE VIOLATED: montage--steel-print.png: FAILED /
  montage--steel-realprint.png: FAILED` — **exactly those 2, 0 others, 0 missing**. Re-run
  after the restore sweep: identical result.
- `rebaseline.txt` hashes == my run:
  `d747f358a2d6f704fd577a9eee53d26187d902c1a2341f36c18457d6af7c36da` for both lines,
  twin == realprint.
- `widening.txt` hashes == my run, all 10 (`198df5c3…` old-shape, `333fcb0c…` narrow,
  `82dde720…` mid, `b617def5…` done, `b8e812df…` failed — each a twin/realprint pair).
- Baseline **not edited**: still 210 lines, md5 `6f6a6657db6c7766a917cfe5a1d64de8`, montage
  lines still the pristine `8e5cc6ae…`. No tag created.

**The "after" print crop (`sc191-freeze-montage--steel-print-after.png`), in words.** The
`+ Add a hero` control is gone from beside "Hero" — no 44 px box. The round-1 socket reads as
plain "to act" text on the card ground, not a filled grey block, and "Kira", "Round 1 / in
play", "Round 2 / to come", the "−" future dash and "✓0 ✕0" all sit at the same weight as the
surrounding body text: no half-opacity anywhere. The outcome band shows an hourglass crest
with "This montage / Not started" and "2 hero actions left". Both limit tracks are inked and
countable: **five** thin-outlined skewed slots on the Successes row and **three** wider ones
on Failures (the `default` fixture's 5/3 limits), none filled at 0/0, both rows spanning the
same horizontal extent with the failure slots visibly wider — the equal-width ruling, legible
on paper. The rule line reads "Partial Success needs successes to lead failures by 2 —
currently +0." The dark ground with light body ink is the documented shared harness capture
artifact (ledger-dropped I-7), unchanged from the "before". **Acceptance bar met: no bordered
white boxes, no half-opacity cells, inked limit tracks.**

### Battery — measured on `7d4451a`, base `origin/develop` `69eb5f7`

| Gate | Expected | Measured | Log |
|---|---|---|---|
| `npm run tsc` | clean | **clean, exit 0** | `1-tsc.log` |
| `npm run lint` | clean | **clean, exit 0** | `2-lint.log` |
| `rm -f main.js styles.css && npx jest` | ≥ 3579 | **3579 passed / 1 skipped / 3580 total; 191 of 192 suites; 3 snapshots**, exit 0 | `3-jest.log` |
| `npm run shots` ×2 (+1 restore) | 498, 0 FAIL, byte-identical | **498 all three runs, 0 FAIL, sha256 identical across all three**; in-run gates OK incl. the new `montage track widths OK (413.13px === 413.13px)`, `button host-leak OK (110 kinds × 3 × 2 = 660)`, `print-twin parity OK (124)`, `nested corner-radius OK`, `chrome placement OK`, `host-copy pin OK` | `4-shots-run1.log`, `5-shots-run2.log`, `8-shots-restore.log`, `shots-diff.txt` + `shots-restore-diff.txt` (both empty) |
| `check-freeze.sh` | exactly 2 montage lines | **exactly 2, 0 others, 0 missing**, exit 1 | `6-freeze.log`, `9-freeze-restore.log` |
| `npm run parity` (last) | 0/0/16 | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)**, exit 0 | `7-parity.log`, `10-parity-final.log` |

Machine load at jest time `0.89 2.43 3.12` — the load-sensitive-suite footgun does not apply.

---

## Artifacts

Report:
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-rereview1-report.md`

All under
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/sc191-rereview1/`:

- Gates: `1-tsc.log` `2-lint.log` `3-jest.log` `4-shots-run1.log` `5-shots-run2.log`
  `6-freeze.log` `7-parity.log` `8-shots-restore.log` `9-freeze-restore.log`
  `10-parity-final.log` `shots-run1.sha256` `shots-run2.sha256` `shots-restore.sha256`
  `shots-diff.txt` `shots-restore-diff.txt` `produced.txt` `covered.txt`
- Can-fail proofs: `canfail-H1.log` `canfail-M1-M4-L6.log` `canfail-L1-L2.log`
  `canfail-I8-L4.log` `canfail-M5.log`, restore oracles in `orig/`
  (`model.ts`, `BoardView.ts`, `OutcomeBandView.ts`, `styles-source.css` — all `diff`-clean
  against the live tree afterwards)
- Probes: `zz-rereview1-probe.test.ts` + `probe-model.log` (H-1 boundary + 324-state
  invariant, L-1 15,876-state sweep, L-2, L-3, regression sweep);
  `zz-rereview1-dom.test.ts` + `probe-dom.log` (L-4 roster order, L-2 end to end, L-6, §C
  probes); `zz-rereview1-ro.test.ts` + `probe-ro.log` / `probe-ro2.log` (button enumeration);
  `measure.mjs` + `measure.log` (M-1/M-2/M-3/M-4/M-5/H-1/H-2/I-8, read-only, narrow)
- Delta reading: `d-model.diff` `d-views.diff` `d-css.diff`

All three probe test files were copied here and **deleted** from the worktree.
`git status --porcelain` in
`/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements` is
**empty**. Every temporary break was reverted and byte-verified. Nothing was fixed; the
freeze baseline was not touched; no tag was created.
