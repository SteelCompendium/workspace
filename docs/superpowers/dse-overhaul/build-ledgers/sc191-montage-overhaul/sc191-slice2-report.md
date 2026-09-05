# SC-191 slice 2 report — head, board, outcome band, fixtures

## Executive summary

STATUS: DONE. Base `69eb5f7` (matched dispatch expectation, no rebase needed). Commit
`b2f696e917f4a2cd209fe15c1cbdc5603b92e141` on `sc191-montage-overhaul`, not pushed, no tag.
Replaced `RoundTrackView`/`ParticipantsView` with `HeadView`/`BoardView`/`OutcomeBandView` on
the settled `roster`/`merged` design (spec §A), landed the `pending` outcome band (model.ts
fix), the two-tier `.dse-mt__*` CSS (structural + Steel-skin), the four new fixtures
(`mid`/`done`/`failed`/`old-shape`) plus `montage-narrow`, and the docs image repoint. Every
board write control (add-hero, log-action, cell sockets, correction chip) is a real,
disabled, aria-labelled control — slice 4 lifts `disabled` and wires the sheet. Full battery
green: tsc/lint clean, jest 3559/1 skipped/191(192) suites, shots 498 PNGs/0 FAIL/byte-
identical ×2, freeze exactly the 2 expected montage lines (0 others), parity 0/0/16.
`rebaseline.txt` + 4 before/after crops delivered to the ledger dir.

## Base / commit

- `git fetch origin develop`: tip `69eb5f709f695bc5f1a3d5d3ce70578e34fdb732` — matched the
  dispatch-expected `69eb5f7` exactly. No rebase, no `npm ci` needed.
- Branch tip before this slice: `d154b9f` (slice 1). Slice 2 commit:
  `b2f696e917f4a2cd209fe15c1cbdc5603b92e141` — "SC-191 slice 2 — head, board, outcome band,
  fixtures". Not pushed. No tag/release created. Superproject pointer untouched (verified:
  `git diff --cached --stat` in the superproject worktree is empty; only the inherent
  working-tree submodule-pointer diff exists, never staged or committed).

## Scope delivered

- **`model.ts`** (spec §I slice 2 explicitly assigns this fix here): `montageOutcome` gains
  the fourth `pending` band — `successes === 0 && failures === 0` reads "Not started"
  (neutral crest) instead of the old 3-band `'failure'` misread, checked first and
  unconditionally, mirroring mock6.js's `derive()`. `MontageOutcome` type and `BAND_WORD` both
  widened. **This reopens a file slice 1 shipped** (the brief's "do not re-open §B" refers to
  the *schema* section, §B — this is §I's own explicitly-assigned fix, not a schema change;
  nothing in §B moved).
- **`slice-1 test files` also touched** (`montage-tally.test.ts`, `montage-serialize.test.ts`):
  slice 1 deliberately shipped one documentation test per file pinning the *old* 0/0
  `'failure'` behavior as a "red-to-green marker for slice 2" — both are updated red→green to
  assert `'pending'` now (shown red against the pre-fix `model.ts` via `git stash`, see
  Tests below), plus two new tests for the unconditional/round-independent nature of the
  `pending` check. No other line in either file changed.
- **`HeadView.ts`** (new): extracted from `view.ts`'s old `buildHead` — kit `cardHead` +
  crest (hourglass live / trophy on `total`) + the new `leftDeck` ("N heroes · one action
  each per round") + `rightEyebrow` round chip ("Round N / M" / "Complete"). The ⋯ Reset menu
  is **unchanged** (still the hand-rolled `Menu` — SC-169 chrome replacement is slice 4);
  Reset now also clears `entries` (necessary consequence of adding entries to a field this
  slice's own `view.ts` rewrite already touches — a stale-entries-after-reset board would
  visibly contradict a zeroed outcome band).
- **`BoardView.ts`** (new): the `roster` grid (Heroes+`+` | round columns | Tally), one
  `--dse-mt-cols` `setProperty` geometry seam, read from `model.entries`. Every real
  `<button>` (add-hero, per-row log, cell sockets) goes through `kit/iconButton` — not a
  hand-rolled `<button>` (spec §D; also the only way to inherit the SC-203/205 host
  re-grounding, see Drive-by note below) — and is real-disabled per the brief's stub rule.
- **`OutcomeBandView.ts`** (new): the `merged` band — verdict (crest/eyebrow/word + the one
  non-tally stat), the two tracks on ONE shared CSS grid (`.dse-mt__prog { display:
  contents }` inside `.dse-mt__outcome-tracks`'s 3-column grid) so success/failure render
  equal-width **at any pair of limits**, not the mock's fixed 6-slot literal — a
  generalization beyond the mock, necessary because `success_limit`/`failure_limit` are
  Director-authored and unbounded. Rule line, notes list, brink alert all included.
- **`.dse-mt__*` CSS** (`styles-source.css`, replacing the old ~145-line block): a structural
  base tier (`[data-dse-element="montage"] .dse-mt`, layout only, reaches print) plus a
  Steel-only decoration tier (`[data-dse-theme='steel'][data-dse-element="montage"]:not(…)
  .dse-mt`, colour/border/background/typography). `container-type/name: dse-mt` +
  `@container dse-mt (max-width: 420px)` per spec (never a viewport `@media`). No variant
  attributes (`data-crest`/`data-seal`/`data-dedupe`) — the winners are the only code path.
- **Fixtures**: `src/elements/montage/fixture-{mid,done,failed,old-shape}.yaml` (new files,
  `example.yaml` untouched), wired into `visual-harness/entry.ts`'s `FIXTURES.montage` map +
  `NARROW_SHOTS` (`montage-narrow`, fixture `mid`, 300px). `docs-manifest.mjs`'s
  `montage.png` repointed to `fixture: 'mid'`.

## Tests

- `test/unit/model/montage-tally.test.ts` / `montage-serialize.test.ts`: the two red-to-green
  markers updated + 3 new tests (pending is round/limit-independent; one recorded result
  leaves pending). **Shown red first**: `git stash push -- model.ts`, ran
  `montage-tally.test.ts` → 2 failed/13 passed
  (`.../scratchpad/sc191-slice2/jest-pending-red.log`); `git stash pop`, re-ran → 15/15
  green, then the full `test/unit/model/` suite caught ONE more pre-existing test
  (`montage-serialize.test.ts`'s "unset limit never reads as instantly reached") that also
  needed its expectation flipped to `'pending'` — same live bug, updated in place.
- `test/dom/elements/montage.test.ts`: wholesale rewrite (the old steppers/record-form
  helpers no longer exist) — 36 tests: HeadView (title/deck/round-chip/crest, unnamed
  montage, description brief), BoardView (rows×rounds, past/noted/assist cells, the current
  socket's disabled-stub shape, future dash, tally sums, complete-montage "no action",
  stubbed add-hero/log-action, empty-roster fallback), OutcomeBandView (pending/live/
  complete/failed bands, equal-width track slot counts, tensed tail phrasing, brink alert,
  notes list, the §B.4 old-shape migration proof), Reset (clears entries too, persists),
  read-only (no menu, zero writes), the persisted write path (surrounding note bytes
  intact), **spec §C integrity probe 2** (two blocks, no cross-talk — new), registered-once
  (unchanged), source hygiene + the two-tier CSS contract. **Shown red**: this is a wholesale
  replacement of the pre-existing suite — run against the OLD (pre-slice-2) `view.ts` +
  sub-views, it fails to even reference the deleted classes; the more direct comparison is
  the OLD test file against the OLD code (7 passed/14 failed, captured before rewriting) vs.
  the NEW file against the NEW code (36/36 green) — recorded in
  `.../scratchpad/sc191-slice2/jest-old-dom-test.log` and `jest-new-dom-test3.log`.

## Gates — full `dse-verify` battery, in order (final tree, post-commit)

| Gate | Expected (dispatch) | Measured | Log |
|---|---|---|---|
| `npm run tsc` | clean | **clean** | `1-tsc-final.log` |
| `npm run lint` | clean, exit 0 | **clean, exit 0** | `2-lint-final.log` |
| `rm -f main.js styles.css && npx jest` | 3537 + new, on `69eb5f7` | **3559 passed / 1 skipped / 191 of 192 suites** (jest's own summary line; +22 net over the slice-1 baseline after removing the old stepper/record-form suite and adding 36+ new tests) | `3-jest-final2.log` |
| `npm run shots` ×2 | 478 + new ids, 0 FAIL, byte-identical | **498 PNGs both runs (478 + 4 new fixtures×4 + montage-narrow×4), 0 FAIL; `sha256sum` of all 498 files identical across the two runs (0-line diff)** | `shots-final-run1.log` (`6b-shots-restore.log`), `shots-final-run2.log`, `shots-final-run1.sha256`, `shots-final-run2.sha256`, `shots-final-diff.txt` (empty) |
| `check-freeze.sh` | 210/210, 0 mismatches pre-slice; **exactly the 2 montage lines expected to move this slice, 0 others** | **`FREEZE VIOLATED: montage--steel-print.png: FAILED, montage--steel-realprint.png: FAILED` — exactly those 2, nothing else** | `6-freeze-final.log` |
| `npm run parity` (last) | 0 GAPs / 0 undeclared / 16 declared | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)** (composition unchanged — montage owns none of the 16) | `7-parity.log` |

**Freeze — the exactly-2-lines acceptance criterion, verified directly:**

```
FREEZE VIOLATED:
montage--steel-print.png: FAILED
montage--steel-realprint.png: FAILED
```

No other line failed. `rebaseline.txt`:
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/rebaseline.txt`

```
0ba0ceb991790209a7e2f2ae93cfa7b367e078e8cdbe76661108e282a8757104  montage--steel-print.png
0ba0ceb991790209a7e2f2ae93cfa7b367e078e8cdbe76661108e282a8757104  montage--steel-realprint.png
```

Both hashes: (a) identical to the final tree's actual `visual-harness/shots/` bytes; (b)
identical across two independent clean `npm run shots` runs on the final (post-commit) tree;
(c) twin === realprint within the pair, satisfying SC-170's invariant. The "before" hashes
were independently re-derived by `git stash`-ing every slice-2 change, rebuilding, and
re-shooting the OLD `view.ts`/sub-views — both came back `8e5cc6ae8362160692d9705c6cf765889d397c044cfbe22b458f988c79264123`, byte-identical to the CURRENT frozen baseline line, confirming the "before" crop is the real frozen state and not a stale render.

## Before/after crops (ledger dir)

- `sc191-freeze-montage--steel-print-before.png` / `-after.png`
- `sc191-freeze-montage--steel-realprint-before.png` / `-after.png`

All four at
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/`.

## Integrity probes (spec §C — mandatory, this slice touches persistence via Reset)

1. **Content above/below the block survives a write** — PASS. DOM test: a note with
   "Before text." / "After text." around the `ds-montage` fence, Reset clicked, exactly one
   `Vault.modify` call, both surrounding strings byte-intact in the result.
2. **Two `ds-montage` blocks in one note don't cross-talk** — PASS (new test this slice). Two
   independent `ReadingModeBlockHost`s (`makeFakeContext(..., blockIndex)`) on one note;
   resetting block A (`mid` fixture) writes exactly once; block B's (`done` fixture) raw YAML
   bytes in the note are asserted byte-identical to its pre-write text.
3. **A hand-edited YAML value survives a re-trigger and the next write** — PASS, by
   construction + existing coverage. `resetProgress()` only ever assigns
   `successes`/`failures`/`current_round`/`entries`/`skills_used` — never `title`,
   `description`, `rounds`, `success_limit`, `failure_limit`, or the participant roster
   shape; the Reset DOM test explicitly asserts title/description survive. The model-level
   hand-edit contract itself (a value the parser doesn't recognize as needing a default stays
   exactly as authored) is slice 1's `montage-serialize.test.ts`, unmodified and still green.
4. **A user-deleted block regenerates cleanly from a fresh paste of the example** — PASS,
   unaffected: `example.yaml` is untouched by this slice (deliberately — it doubles as the
   `default` harness fixture), and the pre-existing "renders through the wired processor"
   end-to-end test still pastes it fresh and renders without error.
5. **An old-shape block upgraded on write loses nothing** — PASS, split across two layers.
   The WRITE-side guarantee (a delta write never assigns `successes = entries.length`) is
   slice 1's `montage-tally.test.ts`, unmodified and still green — slice 2 adds no new write
   path for entries (that's slice 4's sheet). The READ-side proof — new this slice — is the
   `old-shape` fixture DOM test: an old-shape block (`successes: 4`, no `entries`) renders an
   **empty board** but the outcome band's tracks fill 4/5 and 2/3 from the stored scalars,
   the honest "provenance unknown" reading (§B.3).
6. **A block whose entries disagree with its scalars keeps the scalars (no silent recount)**
   — PASS: slice 1's model-level test, re-verified green; the `old-shape` DOM test above is
   the same invariant at the UI layer.
7. **Read-only hosts render zero write affordances, zero writes** — PASS. `canPersist: false`
   DOM test: no Reset menu button at all; `host.replaceSource` never called. (Every board
   control is already real-disabled regardless of `canPersist` this slice — nothing on the
   board distinguishes read-only from read-write yet, since nothing on the board is live;
   that distinction returns in slice 4 alongside the sheet.)
8. **Rapid clicks coalesce into one debounced write** — PASS by inheritance, not re-tested
   here: the only live write path this slice is Reset, a single whole-model mutation
   identical in shape to the pre-existing (pre-SC-191) Reset, whose debounce is the
   framework's generic `persist()` mechanism (`PERSIST_DEBOUNCE_MS`, unmodified). No new
   coalescing path was introduced.

## Drive-by fixes

None. Two build-time issues surfaced during this slice were both **in code this slice
itself introduced** (not pre-existing bugs in a touched file), so neither qualifies as a
"drive-by fix" under the brief's four-part test — both are fixes to my own new work,
folded into the delivered code rather than listed separately:

- The nested-corner-radius shots assertion (`.dse-mt__verdict-alert` inside
  `.dse-mt__outcome`) — my own new CSS, fixed by naming `--dse-mt-outcome-radius` in `rem`
  and deriving the child's corner with `calc(... - 1px)`, mirroring `--dse-plate-radius`/
  `--dse-region-radius`.
- The font-size-contract "widened slot" gate flagged my own new
  `.dse-mt__board-who { font-family: var(--dse-font-title) }` as an un-print-excluded nested
  consumer (the gate's own parser is not nesting-aware) — fixed with the same `, inherit`
  belt-and-braces fallback `.dse-sb__band .dse-collapse__title` already uses.
- The button host-leak gate flagged my three hand-rolled `<button>`s — fixed architecturally
  (not patched): every board button now goes through `kit/iconButton`, which is also what
  spec §D asked for ("every button… never a bare `<button>`") and is the *established*
  pattern for a large clickable grid cell (`initiative`'s `.dse-init__cell` is an
  `iconButton` with a second class layered on, not a hand-rolled element) — I hadn't
  followed it on the first pass; this is a correction to my own uncommitted work, not a
  fix to pre-existing code.

## Follow-ups (left for the ticket-owner to judge)

- **User docs**: the brief's §2 out-of-scope list explicitly assigns "user docs" to slice 4,
  but Scott's standing working-preferences rule ("anything we are delaying needs to get
  clearly documented … what works / what deliberately doesn't yet") argues for an interim
  note if slices 2-3 could ever be reviewed or land independently of slice 4. I followed the
  brief's explicit slice boundary (no docs touched) rather than the standing rule, since the
  brief is the more specific instruction for this dispatch — flagging the tension rather than
  resolving it unilaterally.
- **Test coverage regression, expected and temporary**: the pre-existing roll-driven record
  tests and the multi-item Reset-menu tests were necessarily deleted with
  `ParticipantsView`/the old menu structure; `cx.roll` reachability and the SC-169 chrome's
  five items have no coverage again until slice 4 rebuilds their surfaces. Spec's own
  sequencing (§I), not a gap introduced by this slice — noting it so it isn't mistaken for
  forgotten coverage at final review.
- No other in-scope tangents met the drive-by bar; nothing else was found and left.

## Scope notes (interpretation calls made, not spec inconsistencies)

- **Stub shape for every not-yet-wired board control**: rendered as a real, `iconButton`-
  based, aria-labelled, **disabled** control rather than either (a) a live control with a
  no-op handler (forbidden by the brief's read-only rule) or (b) omitting the control
  entirely (would understate the settled design's shape ahead of slice 4). This is the
  literal reading of "render the affordance the spec says with the behavior stubbed."
- **Equal-width tracks generalized beyond the mock**: mock5/6.css hardcode `--mt5-trackw:
  10.7em`, measured off one fixture's fixed 6-slot success track. Since `success_limit`/
  `failure_limit` are Director-authored and unbounded in the shipped element, I replaced the
  literal with a shared-grid mechanism (`.dse-mt__prog { display: contents }` inside one
  parent grid) so the two tracks are equal-width **by construction** at any pair of limits —
  documented in both the CSS and the DOM test.
- **Reset now clears `entries`**: not explicitly named in spec §I, but a necessary
  consequence of Reset zeroing `successes`/`failures` while the board now reads `entries` —
  leaving stale entries would render a board visibly contradicting its own outcome band.
- Colourblind rule (Scott is colourblind, prose per brief): outcome state is a ring style
  (solid / pressed-hatched / dashed) **plus** a glyph (check / x / ringed-plus) **plus** the
  skill word — colour (green/red) is the last, reinforcing channel only. The `pending` band's
  crest is neutral grey/metal, never a colour value on its own.

## Artifacts

- Commit: `b2f696e917f4a2cd209fe15c1cbdc5603b92e141` (branch `sc191-montage-overhaul`,
  worktree `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements`)
- This report:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-slice2-report.md`
- `rebaseline.txt`:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/rebaseline.txt`
- Before/after crops (4 PNGs): `sc191-freeze-montage--steel-{print,realprint}-{before,after}.png`
  in the ledger dir.
- Sample rendered PNGs (for reviewer eyeballing, not gate artifacts):
  `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements/visual-harness/shots/montage-mid--steel-dark.png`,
  `montage--steel-dark.png` (pending), `montage-done--steel-dark.png` (total success),
  `montage-old-shape--steel-dark.png` (migration proof), `montage-narrow--steel-dark.png`.
- Gate logs (all under
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/sc191-slice2/`):
  `1-tsc-final.log`, `2-lint-final.log`, `3-jest-final2.log`, `6b-shots-restore.log` +
  `shots-final-run2.log`, `shots-final-run1.sha256`, `shots-final-run2.sha256`,
  `shots-final-diff.txt` (empty), `6-freeze-final.log`, `7-parity.log`,
  `jest-pending-red.log` (model.ts red-before-green), `jest-old-dom-test.log` (old suite vs.
  old code, 7/21), `jest-new-dom-test3.log` (new suite vs. new code, 35/35 before the
  cross-talk probe was added; final count 36/36 in `jest-crosstalk.log`), `commit.log`.
