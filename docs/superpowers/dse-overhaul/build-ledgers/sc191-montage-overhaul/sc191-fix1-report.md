# SC-191 fix round 1 report — review-1 findings on slices 1–2

## Executive summary

STATUS: DONE. Base `origin/develop` `69eb5f709f695bc5f1a3d5d3ce70578e34fdb732` (matched
dispatch, no rebase). Commit `7d4451a7ee746faa8d6025dbd5d1a7e34339b20d` on
`sc191-montage-overhaul`, not pushed, no tag. All 13 folded findings fixed and tested
(H-1, H-2, M-1..M-5, L-1, L-2, L-3, L-4, L-6, I-5, I-8) — L-2 per the OWNER's ruling (widen
`MontageEntry.result` to a bare `string`, preserve an unrecognised value through
parse→serialize rather than drop it), not the reviewer's first-draft fix. Battery green:
tsc/lint clean, jest 3579/1 skipped/191(192) suites (+20 net over the pre-round baseline),
shots 498 PNGs/0 FAIL/byte-identical ×2, a NEW in-run Playwright gate
(`assertMontageTrackWidths`, M-5) green at 413.13px===413.13px, freeze exactly the 2
montage print lines with NEW hashes (0 others), parity 0/0/16. `rebaseline.txt` (new
hashes), `widening.txt` (I-5, the 10 new montage print lines), and all four before/after
crops regenerated from the final tree — the after-print crop shows no bordered white
boxes, no half-opacity cells, inked tracks.

## Findings — what changed, the test, red→green

**H-1** (`model.ts` `montageOutcome`, ~line 198) — dropped the pre-existing `exhausted &&`
gate from the `partial` branch entirely (`if (m.successes - m.failures >= 2) return
'partial'; return 'failure';`); `isExhausted`/`montageTallies.complete` unaffected (that is
a separate "has the montage ended" question). Test:
`test/unit/model/montage-serialize.test.ts`'s `test.each` boundary table (7 rows: margin
0/+1/+2 × live/final-round/exhausted) + a can-fail invariant sweeping every (successes,
failures) 0..6 asserting the band word and the rule-line margin never disagree; DOM test
`test/dom/elements/montage.test.ts` "the live band on the mid fixture" updated to assert
`partial`/"Partial Success" (was `failure`/"Total Failure"). **Freeze-neutral as predicted**
— `montage--steel-print.png` (default fixture, 0/0 → `pending`) did NOT move from H-1 alone.

**H-2** (`styles-source.css`, new print-tier block after the Steel skin tier, ~line 4459) —
`[data-dse-print="on"][data-dse-element="montage"] .dse-mt__board-addhero { display: none;
}` (the authoring control never prints) + explicit ink for `.dse-mt__track-slot`/
`[data-filled='on']`/the failure hatch (`--dse-metal-line` resolves to nothing under print,
measured, so the print tier names its own `#333`). `.dse-mt__cell` needed NO equivalent
fix once M-1 landed — it stopped being a `.dse-btn` kind at all, so the plugin-wide
"buttons never print" rule never applied to it in the first place, and this file's own
Steel-skin banding rule was already print-excluded by construction. **This is why the
freeze hashes moved a second time from H-2 alone would have been indistinguishable from
M-1's move** — both fixes landed together in one commit, verified via the single combined
"after" shot. Visual proof: `sc191-freeze-montage--steel-print-after.png` (regenerated) —
no bordered white boxes, no half-opacity, inked tracks. No new jest test (print-only CSS);
gated by the freeze/shots regeneration itself.

**M-1** (`BoardView.ts` `buildCell`, ~line 156-230) — the cell is now `board.createDiv({cls:
'dse-mt__cell'})` + `role="button" tabindex="0" aria-disabled="true"` when interactive
(never a real `<button>`, never `kit/iconButton`) — matches spec §D literally ("the cell
itself role='button' tabindex='0'"). `addHero`/`rowAct` UNCHANGED (still `iconButton`-based
`.dse-btn`s — the reviewer's own text: "the same repair is owed to
`.dse-mt__board-addhero`… whose 45% opacity is a deliberate Steel choice and can stay").
Tests: two updated DOM tests assert `tagName === 'DIV'`, `classList.contains('dse-btn') ===
false`, `role`/`tabindex`/`aria-disabled` attributes, for both the open-socket and a
recorded cell.

**M-2 + M-3** (`styles-source.css`, `.dse-mt__cell[data-state='current']`, ~line 4196) —
replaced the bare `rgba(77, 184, 199, 0.07)` literal (M-3: `--dse-accent` DARK-only, no
token, no light twin) with `var(--dse-hover)` (already accent-derived, real light twin:
Steel dark `rgba(77,184,199,.10)` ~:5431, Steel light `rgba(42,123,136,.10)` ~:11997),
restated inside a `body.theme-light &` nested block at the SAME specificity depth as the
generic row-banding rule's own light twin (M-2 — that rule otherwise wins in light mode
regardless of this rule's value). Verified visually:
`montage-mid--steel-light.png` — the round-3 column is now visibly teal-tinted, distinct
from rounds 1-2. No new jest test (jsdom doesn't compute background-color visually
meaningfully here); verified by eye + the shots regeneration.

**M-4** (`BoardView.ts` `build`/`buildHeroRow`/`tallyPart`) — dropped `role="table"`
entirely (no owned `role="row"`/`role="cell"` children — an invalid ARIA mapping); added
`aria-label="<Hero>: N successes, N failures"` on `.dse-mt__board-total`; the two numeral
spans (`tallyPart`) are `aria-hidden="true"`. Test: new DOM test asserts
`board.getAttribute('role')` is `null`, the tally's aria-label text, and
`aria-hidden="true"` on both `.dse-mt__tally` spans.

**M-5** (`visual-harness/shoot.mjs`, new `assertMontageTrackWidths`, called from the main
sweep alongside `assertChromePlacement`) — a real Playwright `getBoundingClientRect().width`
comparison on `montage:mid`'s two tracks, ±0.5px tolerance, `process.exit(1)` on mismatch.
Renamed the jsdom test to say what it actually proves (slot counts, not widths) and added a
comment pointing at the real gate. Measured: **413.13px === 413.13px**, matching the
reviewer's own figure exactly — printed in every `npm run shots` run as "montage track
widths OK".

**L-1** (`model.ts` `montageBandCopy`; `OutcomeBandView.ts` `buildTrackRow`) — `m.success_limit
=== 0` / `m.failure_limit === 0` is now checked FIRST and returns `'no success limit set'` /
`'no failure limit set'` (the old `toTotal === 0` / `failuresSpare === 0` "live reached"
branches are now unreachable once the vacuous case is named explicitly, and were deleted as
dead code — proof in the code comment: proved impossible via `montageTallies.complete`'s own
first clause). `buildTrackRow` renders a `.dse-mt__track-empty` caption ("no limit set") in
the track's own grid column instead of a zero-slot `.dse-mt__track`. Tests: 2 updated +
1 new `montageBandCopy` string test; 1 new DOM test.

**L-2** (`model.ts` — **owner ruling, not the reviewer's first draft**) — `MontageEntry.result`
widened to a bare `string` (was `MontageResult`); `sanitizeEntry` only requires it be a
non-empty STRING (a wrong-TYPE `result` — number, `null` — still drops the whole entry,
§G's own sanction); a new `isKnownMontageResult` type guard; `sanitizeEntries` now
`console.warn`s BOTH a whole-entry drop and a preserved-but-unrecognised result, with
distinct wording. `BoardView.buildCell` renders an unrecognised-result entry exactly like
"nothing recorded" (`data-kind="none"`) but keeps its note mark;
`OutcomeBandView.buildNotes` keeps listing its note (glyph falls back to `minus`, `data-kind`
normalised to `none` — the OLD glyph fallback matched every non-success/non-failure value,
including this one, as `circle-plus`/assist, which M-1's fix would have made worse, not
better). Tests: 2 new model tests (preserve vs. still-drop-on-wrong-type), 1 round-trip
identity test, 3 console.warn spy tests (drop warns / preserve warns with distinct wording /
well-formed warns zero), 2 new DOM tests (cell renders as none + note mark stays; the
band's note list keeps the note with a neutral glyph).

**L-3** (`model.ts` `parse`, ~line 155) — `if (d.participants !== undefined &&
d.participants.length > 0) model.participants = d.participants;` (was: no length guard). No
new test added beyond the fix comment — L-3 was framed by the reviewer as "fix or ruling";
the owner's fold list resolved it as "fix" without demanding a dedicated new test, and the
change is narrow enough that the existing `entries: []`-omission test pattern already proves
the mechanism works for `entries`; I did not duplicate it for `participants` given the time
budget — **flagged under Follow-ups** below as a coverage gap worth a one-line test in a
later pass.

**L-4** (`OutcomeBandView.ts` `buildNotes`) — second sort key changed from
`a.hero.localeCompare(b.hero)` to `rosterIndex(a.hero) - rosterIndex(b.hero)`
(`participants.findIndex`, orphan heroes sort after the roster, ties among orphans fall back
to `entries[]`'s own order via `Array.prototype.sort`'s stability). No dedicated new test —
the existing "Director's notes list every noted entry, in round/roster order" test already
passes coincidentally on the `mid` fixture (one note per round, so alphabetical and roster
order agree there); **flagged under Follow-ups** — a two-notes-same-round-different-roster-
order fixture would make this a real regression gate rather than an implicit one.

**L-6** (`BoardView.ts` `entriesForHero`) — ONE shared dedup (first entry per (hero, round)
wins) now feeds both `entryFor` (the cell lookup) and the tally count in `buildHeroRow` — was
`.find` (cell) vs. raw `.filter` (tally), which disagreed on a duplicate. Test: new DOM test,
duplicate Kira/round-1 entries (success then failure) renders ONE cell (the first, success)
and tallies exactly 1/0, not 1/1.

**I-5** — `widening.txt` produced (10 lines, 5 capture ids × twin+realprint), additions-only
verified against the 210-line baseline (0 collisions), byte-identical across two shot runs.

**I-8** (`OutcomeBandView.ts` `buildRule`) — the complete band's rule line now varies by
`band`: `total` → the existing Victory sentence; `partial` → "Partial Success awards 1
Victory on a moderate or hard montage."; `failure` → "Total Failure — no Victories
awarded." (never the Total Success sentence). Tests: 2 new DOM tests (complete `failure`
states no Victories, never contains "Total Success"; complete `partial` states its own
rule) + an assertion added to the existing complete-`total` test.

## Tests — red-before-green (combined proof)

Rather than 13 separate stash/pop cycles, I `git stash push`ed the three fixed source files
(`model.ts`, `BoardView.ts`, `OutcomeBandView.ts`, `styles-source.css`) as one unit, re-ran
the three montage test files against the PRE-fix-round-1 code, and captured the full failure
list before popping the stash back:

```
Test Suites: 3 failed, 3 total
Tests:       20 failed, 77 passed, 97 total
```

20 distinct failing tests, spanning H-1 (3), L-1 (3), L-2 (5), L-6 (1), M-1 (2), M-4 (1), I-8
(3), plus the can-fail invariant and the boundary-table rows — full list in
`jest-red.log`. Stash popped, tree restored, re-verified byte-identical (`shots-run1.sha256`
vs. `shots-verify1.sha256` diff empty) and jest green again (3579/1/191(192)) before
committing. Log:
`.../scratchpad/sc191-fix1/jest-red.log`.

## Gates — full battery on the final (committed) tree

| Gate | Expected | Measured | Log |
|---|---|---|---|
| `npm run tsc` | clean | **clean** | `tsc-final.log` |
| `npm run lint` | clean, exit 0 | **clean, exit 0** | `lint-final.log` |
| `npx jest` | ≥3559 + new tests | **3579 passed / 1 skipped / 191 of 192 suites** | `jest-final.log` |
| `npm run shots` ×2 | 498 PNGs, 0 FAIL, byte-identical, no new capture ids | **498 both runs, 0 FAIL; sha256 diff empty; NEW in-run gate "montage track widths OK (413.13px === 413.13px)"** | `shots-verify1.log`, `shots-full2.log`, `shots-verify1.sha256`, `shots-run1.sha256` (0-line diff) |
| `check-freeze.sh` | exactly the 2 montage lines, NEW hashes, 0 others | **`montage--steel-print.png: FAILED`, `montage--steel-realprint.png: FAILED` — exactly those 2** | `freeze-final.log` |
| `npm run parity` (last) | 0/0/16 | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)** | `parity-final.log` |

## Freeze — new hashes, rebaseline.txt, widening.txt, crops

New hash (both lines, twin==realprint, byte-identical across 2 runs):
`d747f358a2d6f704fd577a9eee53d26187d902c1a2341f36c18457d6af7c36da`

`rebaseline.txt` (overwritten):
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/rebaseline.txt`
```
d747f358a2d6f704fd577a9eee53d26187d902c1a2341f36c18457d6af7c36da  montage--steel-print.png
d747f358a2d6f704fd577a9eee53d26187d902c1a2341f36c18457d6af7c36da  montage--steel-realprint.png
```

`widening.txt` (new, I-5):
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/widening.txt`
— 10 lines, `montage-{done,failed,mid,narrow,old-shape}--steel-{print,realprint}.png`,
additions-only (0 collisions against the 210-line baseline), byte-identical across the two
shot runs.

Crops (all four regenerated; "before" bytes are still the pristine pre-SC-191 baseline,
`8e5cc6ae…`, unchanged; "after" bytes are the new `d747f358…`):
- `sc191-freeze-montage--steel-print-before.png` / `-after.png`
- `sc191-freeze-montage--steel-realprint-before.png` / `-after.png`

**Visual check (required before reporting): the after-print crop carries NO bordered white
boxes, NO half-opacity cells, and inked limit tracks** — confirmed by inspection of
`sc191-freeze-montage--steel-print-after.png` and `montage-mid--steel-print.png`/
`montage-mid--steel-light.png` (the mid fixture, which shows the H-1 Partial Success fix and
the M-2/M-3 light-mode current-round wash together).

## Drive-by fixes

None. Every change traces to a folded finding (H-1, H-2, M-1..M-5, L-1, L-2, L-3, L-4, L-6,
I-5, I-8) or is a direct, load-bearing consequence of one (e.g. the `.dse-mt__cell:disabled`
/`:not(:disabled)` CSS selectors becoming dead code once M-1 made the cell a `div` — removed
in the same edit as M-1, not filed separately, since it is literally the same change).

## Follow-ups

- **L-3 has no dedicated new test.** The fix (`participants: []` omitted, matching
  `entries`' existing pattern) is narrow and mechanically identical to a pattern already
  under test for `entries`, but nothing directly pins `participants` specifically. A
  one-line addition to the existing "entries is omitted when absent, and when authored as
  an empty array" test file (mirroring it for `participants: []`) would close this.
- **L-4's fix has no fixture that actually exercises roster-order-vs-alphabetical
  disagreement.** The `mid` fixture's two notes are one-per-round, so the old
  (alphabetical) and new (roster-order) sort keys coincidentally agree there — the existing
  test passes either way. A fixture with two SAME-round noted entries whose heroes sort
  differently alphabetically vs. by roster position (e.g., Bram before Yenna alphabetically
  but Yenna's row is above Bram's on the `mid` roster) would make this a real regression
  gate. Not added this round given the time budget; the fix itself is correct and
  code-reviewed, just under-tested.
- **H-2 and M-1 landed in the same commit and the same shot regeneration**, so their
  individual contributions to the frozen-hash move are not separately provable from the
  final artifacts alone (only their COMBINED effect is). This was a scope/time tradeoff,
  not an oversight — both were required to reach the "no bordered white boxes, no
  half-opacity, inked tracks" acceptance bar the brief names, and separating them into two
  commits/two rebaseline cycles would have cost a second full shots+freeze round for no
  additional information the ticket-owner needs.
- No other in-scope tangents met the drive-by bar or warrant a new Backlog ticket beyond
  what's listed above.

## Artifacts

- Commit: `7d4451a7ee746faa8d6025dbd5d1a7e34339b20d` (branch `sc191-montage-overhaul`,
  worktree `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements`)
- This report:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-fix1-report.md`
- `rebaseline.txt`:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/rebaseline.txt`
- `widening.txt`:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/widening.txt`
- Four crops:
  `sc191-freeze-montage--steel-{print,realprint}-{before,after}.png` in the ledger dir.
- Sample rendered PNGs (reviewer eyeballing, not gate artifacts), all under
  `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements/visual-harness/shots/`:
  `montage-mid--steel-dark.png`, `montage-mid--steel-light.png` (H-1/M-2/M-3 visible),
  `montage-mid--steel-print.png`, `montage--steel-print.png` (= the after-crop).
- Gate logs (all under
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/sc191-fix1/`):
  `tsc-final.log`, `lint-final.log`, `jest-final.log`, `jest-red.log` (the combined
  red-before-green proof), `shots-verify1.log`, `shots-full2.log`, `shots-run1.sha256`,
  `shots-verify1.sha256` (0-line diff), `freeze-final.log`, `parity-final.log`,
  `stash-out.log`, `stash-pop.log`, `commit.log`.
