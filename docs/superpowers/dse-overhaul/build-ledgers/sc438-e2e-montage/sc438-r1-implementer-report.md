# SC-438 round 1 (Phase A) implementer report

## Executive summary
- STATUS: NEEDS_CONTEXT (Phase A done, stopped for the pair list and bug list). Branch `sc438-e2e-montage` in draw-steel-elements, head `6510f6ab` (three commits on `27120710`; origin/develop still `27120710`, no rebase). Nothing pushed, superproject untouched.
- Gates: tsc rc 0; lint rc 0; jest `12090 passed / 2 skipped / 0 failed` (279 of 280 suites, rc 0) vs baseline 11892 / 2 skipped: +198 (176 matrix + 22 census). The 2 skips are the fresh-worktree no-`obsidian-app.css` skips, expected. Census suite alone 48/48.
- Controls: 34 new `data-dse-control` ids (19 on the montage surface, 15 in the three modals) plus the host ids `modal.close` / `modal.backdrop` reused per modal manifest.
- Pairs: 54 new (coverage 176 -> 230 expected: `230/230`; measured by loading every manifest and de-duplicating (control, kind)). Ticket said about 55.
- Bugs: 7 candidates (3 Medium, 4 Low), all reproduced in jsdom except the focus loss, which is jsdom-confirmed and needs a real-Obsidian check. None matches a known open ticket (the focus one is the montage analogue of SC-615/SC-614). SC-606 and SC-610 regressions: both still fixed.
- Product change is attribute-only (ids), no behavior change. The real-Obsidian census (`_census.e2e.ts`) and the `montage.ts` driver are written and type-check but were NOT run (no e2e in Phase A).
- Census ids taken: `[CENSUS-10]`, `[CENSUS-11]`, `[CENSUS-12]` (develop's highest is 09; SC-614 and SC-569 worktrees use at most 09). Scenario ids `[MONT-*]`: none used yet (grep clean on every worktree).

## Commits (draw-steel-elements)
- `b62f4b0e` feat(SC-438): data-dse-control ids on every interactive node of the montage and its three modals; manifests; fixtures; both censuses scoped by the montage root and each modal root
- `be0ce49a` docs(SC-438): fixture table rows for the montage notes in e2e/README.md
- `6510f6ab` test(SC-438): jsdom matrix for the montage tracker (outcome band, board, action bar, chrome items, disclosures, Log an action sheet, Add a hero, Set limits, note integrity)

Diff vs `27120710`: 29 files, +2105 / -8. Product files (ids only): `src/elements/montage/{view,BoardView,StripView,GuideView,LogActionModal,ConfigModals}.ts` (+35 / -8 lines combined).

## Controls added (34 ids)
Naming deviation from the ruling (say why): the ruling gave `montage.log.*` for the sheet. The bar's "Log an action..." button and the chrome items would collide with the modal prefixes by name (`montage.log` / `montage.add-hero`), so the bar is `montage.bar.*` and the chrome panel `montage.chrome.*`; a `montage.log.*`, `montage.add-hero.*` or `montage.limits.*` id therefore always means a modal control.

- Chrome panel items (ChromeMenuItem `control`): `montage.chrome.add-round`, `montage.chrome.add-hero`, `montage.chrome.set-limits`, `montage.chrome.reset-progress`.
- Board: `montage.board.add-hero` (Heroes "+"), `montage.board.row-act` (per hero, `nth`), `montage.cell` (the `role=button` div cells: filled, and empty past cells), `montage.cell.socket` (the open socket of the round in play: no role, no tabindex, whole-cell click listener; stamped only when the host can persist), `montage.quick.success`, `montage.quick.failure`, `montage.quick.assist` (one id per outcome kind so each kind is driven).
- Action bar: `montage.bar.log`, `montage.bar.undo`, `montage.bar.back`, `montage.bar.end-round`, `montage.bar.reopen`, `montage.bar.clear-all`.
- Disclosures (kit `collapsible` `control` option, already existed): `montage.strip`, `montage.guide`.
- Log an action sheet: `montage.log.result.success`, `montage.log.result.failure`, `montage.log.result.assist` (the chips), `montage.log.skill`, `montage.log.note`, `montage.log.remove`, `montage.log.cancel`, `montage.log.submit` (one id for both the "Log" and "Save" button).
- Add a hero: `montage.add-hero.name`, `montage.add-hero.cancel`, `montage.add-hero.submit`.
- Set limits: `montage.limits.success`, `montage.limits.failure`, `montage.limits.cancel`, `montage.limits.save`.
- Not stamped because not interactive: the board's total cells, round headers, strip and guide content, outcome band, notes list, head. The census proves nothing else is.

## Manifest pairs (54 new)
Files: `e2e/manifest/montage.ts` (29), `montage-log-modal.ts` (12), `montage-add-hero-modal.ts` (7), `montage-limits-modal.ts` (6) (the per-file count counts a pair under the file that declares it first; `montage.chrome.add-hero`, `montage.board.add-hero`, `montage.chrome.set-limits` appear first in the modal files as `reach` rows). Each modal manifest also lists `modal.close` (click, press:Escape) and `modal.backdrop` (click), already counted, so no extra pairs. Rows annotate scenario groups: C chrome, B board, R bar, G strip/guide, L log sheet, H add hero, S set limits.

1. montage.add-hero.name x type
2. montage.add-hero.name x press:Escape
3. montage.add-hero.cancel x click
4. montage.add-hero.cancel x press:Enter
5. montage.add-hero.submit x click
6. montage.add-hero.submit x click-disabled
7. montage.add-hero.submit x press:Enter
8. montage.chrome.add-hero x click
9. montage.board.add-hero x click
10. montage.limits.success x type
11. montage.limits.failure x type
12. montage.limits.cancel x click
13. montage.limits.cancel x press:Enter
14. montage.limits.save x click
15. montage.limits.save x press:Enter
16. montage.chrome.set-limits x click
17. montage.log.result.success x click
18. montage.log.result.failure x click
19. montage.log.result.assist x click
20. montage.log.skill x type
21. montage.log.note x type
22. montage.log.note x press:Escape
23. montage.log.remove x click
24. montage.log.cancel x click
25. montage.log.cancel x press:Enter
26. montage.log.submit x click
27. montage.log.submit x click-disabled
28. montage.log.submit x press:Enter
29. montage.cell x click
30. montage.cell.socket x click
31. montage.board.row-act x click
32. montage.bar.log x click
33. montage.chrome.add-round x click
34. montage.chrome.add-round x press:Enter
35. montage.chrome.add-hero x press:Enter
36. montage.chrome.set-limits x press:Enter
37. montage.chrome.reset-progress x click
38. montage.chrome.reset-progress x press:Enter
39. montage.board.row-act x click-disabled
40. montage.cell x press:Enter
41. montage.cell x press:Space
42. montage.quick.success x click
43. montage.quick.failure x click
44. montage.quick.assist x click
45. montage.bar.log x click-disabled
46. montage.bar.undo x click
47. montage.bar.undo x click-disabled
48. montage.bar.back x click
49. montage.bar.end-round x click
50. montage.bar.reopen x click
51. montage.bar.clear-all x click
52. montage.strip x click
53. montage.strip x press:Enter
54. montage.guide x click

Reach rows (pairs already counted, host `montage`): log modal <- `montage.cell`, `montage.cell.socket`, `montage.board.row-act`, `montage.bar.log`; add-hero <- `montage.chrome.add-hero`, `montage.board.add-hero`; limits <- `montage.chrome.set-limits`.

Choices for the owner to review:
- `click-disabled` pairs and the fixture each needs in Phase B: `montage.bar.log` (`acted.md`), `montage.bar.undo` (`fresh.md`), `montage.board.row-act` (`done.md`), `montage.add-hero.submit` (blank name), `montage.log.submit` (an unrecognised-result entry: `hand-written.md`, Bram round 1).
- `montage.cell.socket x click` must land on the socket's padding, not the quick trio in its centre: Phase B uses `dse.click(el, { inset: 2 })`.
- `press:Enter` / `press:Space` are listed only where a hand-written key handler exists (`montage.cell`) or for the primary native buttons the way the SC-437 modal manifest did; chrome items and `montage.strip` carry `press:Enter` like `init.reset-turns` does.
- Enter inside the Add a hero name field does nothing (no key handler), so no `press:Enter` pair is listed on `montage.add-hero.name`; see Follow-ups.
- `montage.log.note x press:Escape` and `montage.add-hero.name x press:Escape`: Escape typed into the field closes the modal and drops the draft (pinned in jsdom [L13], [H05]).
- Read-only (canvas) host: nothing is a reachable e2e state (cells keep `montage.cell` with `aria-disabled`, no pair).
- No `hover` pair: the chrome panel reveal is a prerequisite (`dse.hover(root.root)`), as in SC-437.

## Census changes
- jsdom `test/dom/e2eCensus.test.ts` (+184 lines, new describe `SC-438 census: the montage tracker and its three modals, scoped by container`, 22 tests): scope is the montage root (`census(root)` = `censusProblems(root, montageIds, INTERACTIVE, false)`: chrome panel included, no CSS-class lookup) and each modal's `.modal-content`. Tests: (1) the census bites: an un-id'd `<button>` appended to the board, the action bar, a name cell, the outcome band and the root is a finding each, so is a tabindex div and a foreign id; (2) the census bites inside each modal: an un-id'd button in the Log sheet, Add a hero and Set limits is a finding each, plus a foreign id each (this is the "one in the board, one in a modal" regression test the brief asks for); (3) every `e2e/vaults/shipped/Montage/*.md` fixture (13, read from disk, so a new fixture is covered automatically) mounted writable and read-only; (4) the five `src/elements/montage/fixture-*.yaml` / `example.yaml` files; (5) chrome panel items carry `montage.chrome.*` and are in scope; (6) no dead manifest row (every `montage.*` id of the main manifest is stamped by some fixture; every modal id by some open modal, new + edit sheet); (7) reach rows are declared and real; (8) repetition counts (4 row-act, 4 cells, 4 sockets, a trio per socket); (9) read-only host. The test file silences `console.warn` for the hand-written fixture's deliberate unrecognised result.
- Real-Obsidian `e2e/specs/_census.e2e.ts` (+75 lines): `ALL_IDS` gains the four montage manifests; `MONTAGE_SCOPE = '.markdown-reading-view [data-dse-element="montage"] *'` with `MONTAGE_IDS` = montage manifest + chrome ids; `[CENSUS-10]` whole montage (mid-game, then an out-of-rounds note for the Reopen / Clear all bar), `[CENSUS-11]` the Log sheet new then edit, `[CENSUS-12]` Add a hero and Set limits. NOT RUN: written against the SC-437 pattern, passes `tsc -p e2e` and lint; Phase B runs it. `e2e/driver/dse.ts` `MODAL_KINDS` gained `montage-log`, `montage-add-hero`, `montage-limits` (+4 lines); new `e2e/driver/montage.ts` (fixture constants + `openMontage`, `clickChrome`, `openLogFromBar`, `openAddHero`, `openLimits`; shaped on `driver/pool.ts`, nothing extended).

## jsdom matrix tests (`test/dom/elements/montage-matrix.test.ts`, 1239 lines, 176 tests; ids `[O01]`.. in titles, same style as `initiative-matrix.test.ts`)
Driven through the real pipeline with real clicks on control ids; writes read back from `host.replaceSource` bytes, integrity through a real `ReadingModeBlockHost` over a fake vault.
- [O] outcome band: 14 table rows (successes x failures x limits x round: pending / partial / failure live, total / failure complete at the limit, past both limits, no limits, out of rounds with a lead of 1 and of 2, failure limit with a lead of 2, every tail and rule sentence), hero-actions-left, notes ordering.
- [B] board: round progress x entries (5 grids of cell codes C / S / -), tallies, no heroes, hero with / without / no skills list, quick trio x kind (success / failure / assist: tally, entry shape, skills untouched, one write), socket opens the sheet, row-act (new / edit / disabled when complete), cell click / Enter / Space / Ctrl+Enter / other key / repeat, past empty cell, unrecognised result cell, header "+", read-only host (stubs disabled, nothing writes).
- [R] action bar: 7 states (which buttons, which disabled), labels, Log targets the first hero yet to act, disabled buttons never act, Undo x 4 result shapes + last-entry order, End round (mid / last), Back to round (3 starts), Reopen, Clear all.
- [C] chrome items: Add a round (and on an out-of-rounds montage), Reset progress (exact written object), Add a hero / Set limits only open modals.
- [G] strip and guide: toggles never write, "pinned" hint, guide dedup, state survives a write, read-only.
- [L] Log sheet: defaults, 9 result x skill x note rows, chip group, reuse warning x 4 inputs and "warn, never block", edit 3x3 result matrix (tallies as deltas), pre-fill + unchanged Save, skill / note clearing x 4, Remove x 3 result kinds, unrecognised-result entry (Save disabled until a chip, Remove works), SC-606 regression (hero with no skills list), Cancel / Escape x new / edit, Escape typed in the note, duplicate (hero, round) and out-of-range round disabled, sub-line by round kind.
- [H] Add a hero: disabled / enabled, 6 names (trimmed, `007`, `true`, `- dash`, with colon), empty / blank x3, 4 roster shapes (none, one, non-list `participants: Kira`, non-hero items kept), Cancel / Escape / Escape in field, new hero has a socket.
- [S] Set limits: pre-fill + number field min 0, 8 typed-value rows (plain, 0, cleared, negative, fraction, exponent), 6 below / above-current rows (stored tallies never touched), Cancel / Escape.
- [X] integrity (see below).
Mutation check (reverted): zeroing the tally delta fails 21 matrix tests; removing the duplicate-entry guard fails `[L14]`.
Not duplicated here: the existing 2639-line `montage.test.ts` already pins the pinned hero column and board scroll (SC-326 / SC-490), SC-610 and the hover-preview modals; I added no scroll test.

## Fixtures added (`e2e/vaults/shipped/Montage/`, rows added to `e2e/README.md`)
`empty.md` (no heroes, no limits), `fresh.md` (2 heroes, nothing logged, 3 rounds, limits 3 / 2), `mid.md` (title + brief, 4 heroes: skills / skills / no `skills_used` key / an empty past cell, round 2, a note, an assist), `brink.md` (one success from total), `acted.md` (everyone has acted: Log disabled), `done.md` (Total Success, not reopenable), `failed.md` (Total Failure at the failure limit), `exhausted.md` (out of rounds, partial, Back + Reopen), `over-limit.md` (hand-edited past both limits), `wide.md` (12 rounds, board scrolls, pinned column), `hand-written.md` (scalar `skills_used`, a hero with no list, an unrecognised result), `two-blocks.md`, `twins.md` (identical twins). Prose `ABOVE` / `BETWEEN` / `BELOW` around every block.

## Integrity probes (each result)
Jsdom probes through a real `ReadingModeBlockHost` over a fake vault (matrix [X01]-[X08] pin the passing ones):
1. Content above / below survives every write: PASS (7 write paths x the two-blocks note, [X01]; the single-block fence lines and prose, [X04]).
2. Two blocks in one note do not cross-talk: PASS for distinct blocks and for IDENTICAL twins, writing the first or second ([X02], [X03], 6 write paths each; Reset progress is skipped on twins since a fresh twin has nothing to reset).
3. Hand-edited block survives a re-trigger: PASS for scalar `skills_used`, a hero with no list, an entry with an unrecognised result, a participant with extra keys (`player: Sam`), and a hand edit to the prose above the block after the view drew ([X05]-[X07]). FAIL for unknown top-level keys and for extra keys inside an `entries:` item (bugs 1 and 2).
4. Logging into a montage whose YAML has unknown keys keeps them: FAIL, see bugs 1 and 2.
5. Odd text round-trips through a write and a re-mount: PASS (hero names `007`, `true`, `null`, `1e3`, `~`, `yes`, `Zoe: the Bold`, `- dash`, `#hash`; skills `123`, `yes`, `a: b`; notes `true`, `null`, `# not a comment`, a two-line note, `- dash`, `12`).
6. Old-shape block (`successes: 4`, no entries) logs one action as 5, not 1: already pinned by the existing suite (`montage.test.ts` "integrity probe 5").

## Bugs found (7; owner files; severities are my call)
1. **Unknown top-level keys are deleted by every write** (Medium: user data loss). Repro: block `title: T` / `table_notes: keep me` / `rounds: 3` ... `participants: [Kira]`; click a quick-log (or any write). The written block has no `table_notes` (a YAML comment is lost too, as with other elements). File: `src/elements/montage/model.ts:276` (`serialize` rebuilds `ordered` from a fixed key list) with `parseModel` `model.ts:237-253` copying only known keys. `participants` items DO keep their extra keys (verified), so it is inconsistent inside the one block. Ready probe: scratch `PROBE1` (`keep/zz-scratch-montage-probe-r1.test.ts.txt`).
2. **Extra keys inside an `entries:` item are deleted by every write** (Medium). Repro: an entry `{hero: Kira, round: 1, result: success, skill: Nature, dc: 12}`; log another action; the written entry lacks `dc` and every other entry too. File: `model.ts:162` (`sanitizeEntry` builds a fresh object with the five known fields). Same family as 1; the owner may want one ticket or two.
3. **Keyboard focus falls to `<body>` after every write, strip toggle, and modal close that wrote** (Medium; jsdom confirmed, needs a real-Obsidian check). Repro: focus `montage.bar.end-round` (or `montage.strip`), press Enter / click: after the rebuild `document.activeElement` is `BODY`, the focused control is gone. The initiative tracker fixed this with `captureControlFocus` / `restoreControlFocus` (SC-615 / SC-614); the montage uses no such helper. Files: `src/elements/montage/view.ts:532` (`commit()` -> `update()` empties and rebuilds the root), `view.ts:109` (the strip's `onToggle` rebuild). A NEW ticket linking SC-615 / SC-614 (per the ledger). A keyboard user loses their place after every action.
4. **"Add a hero" accepts a name that is already on the board** (Medium-Low). Repro: Add a hero "Kira" on a board that has Kira: the file gets a second `- name: Kira`; the board draws two rows that both show Kira's entries (cells are looked up by name), the header says "2 heroes", a quick-log on either row fills both rows, and the second row can never be logged separately. File: `model.ts:533` (`addMontageHero` has no duplicate check), `src/elements/montage/ConfigModals.ts:32-37` (Add only checks non-empty). (Case variants "kira" are accepted and are separate heroes: a design question, not part of this bug.)
5. **A non-string `title` makes the whole block fail to render** (Low). Repro: `title: 2024` or `title: true` -> error card "Montage Test tracker: failed to render (render)", message `_a.trim is not a function`. `description: 5` is handled (guarded by `typeof`), `title` is not. File: `src/elements/montage/HeadView.ts:27` (`this.model.title?.trim()`), with `model.ts:238` (`model.title = d.title` unchecked). Nothing is lost (the card says what failed), a Director edits the line.
6. **Quoted numbers concatenate** (Low). Repro: `rounds: "3"` and `current_round: "1"` (a hand-typed quoted number): Add a round writes `rounds: "31"` (31 columns), End round writes `current_round: "11"`. Files: `model.ts:528` (`m.rounds += 1`), `model.ts:579` (`m.current_round += 1`); `parseModel` (`model.ts:240`, `d.rounds ?? 2`) does not coerce.
7. **A montage whose rounds ran out with nothing logged says "Final result: Not started" and "Total Failure — no Victories awarded."** (Low, text contradiction). Repro: `rounds: 2`, `current_round: 3`, no entries: eyebrow "Final result", verdict word "Not started", rule line "Total Failure — no Victories awarded.", "2 rounds used". The word comes from `montageOutcome` (`pending` at 0 / 0), the rule line from `OutcomeBandView.buildRule`'s complete branch (non-total, non-partial = failure text). Files: `src/elements/montage/OutcomeBandView.ts` (`buildRule`, `buildTop`) with `model.ts` `montageOutcome`. Probe `PROBE19`.

Not bugs, checked: a hand-edited counter (`successes: 9`) is a delta base (Undo gives 8), by design; `rounds: 0` / negative render an empty board (complete at once); a matching skill typed in a different case does not warn (see Follow-ups).

Known tickets: nothing here matches SC-384, SC-467, SC-521, SC-562, SC-380, SC-458; SC-615 / SC-614 are the neighbours of bug 3. SC-606 and SC-610 stay fixed (jsdom `[L11]`, the existing `montage.test.ts` blocks).

## Drive-by fixes:
None.

## Follow-ups:
- Reset progress and Clear all discard every logged action with no confirmation (the initiative's Reset encounter has `ResetEncounterModal`) and no undo toast; one mis-click in the hover panel loses the whole montage log. Design question, may already be ruled (SC-191 ledger).
- Enter in the Add a hero name field does nothing (no key handler; the modal stays open). Likewise Enter in the limit fields. A form-submit convention gap, not listed as a pair.
- The skill-reuse warning is case-sensitive (`wouldReuseSkill`, `model.ts:453`): "nature" after "Nature" does not warn. Low; the rule is "warn, never block".
- "Save" in Set limits with nothing changed still calls the vault write (one `modify` with identical bytes). Probe `PROBE7`. Low; initiative's no-change title edit writes nothing.
- A cleared limit field saves as 0 = "no limit set" (and can reopen a montage that ended on its limit). Pinned in jsdom [S02]/[S03] as today's behaviour; say if it should refuse blank.
- Phase B notes: SC-384 (modal closes on a pending write in Live Preview) may also bite the montage sheet; the driver `dse.blur` is hard-wired to the modal title (the SC-437 `away` target applies if a montage blur pair appears; none listed).

## Gates
Scratch/log folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc438-impl-r1/`
- tsc (`npm run tsc`, covers `tsc -p e2e`): rc 0. `tsc-r1b.log`, `tsc-r1b.rc`.
- lint (`npm run lint`): rc 0, no findings. `lint-r1b.log`, `lint-r1b.rc`.
- jest full: `Test Suites: 1 skipped, 279 passed, 279 of 280 total; Tests: 2 skipped, 12090 passed, 12092 total; Snapshots: 3 passed; Time: 98.161 s`, rc 0. `jest-full-r1.log`, `jest-full-r1.rc`. (The stack traces in the log are the visual-harness script tests' own expected error paths; 0 FAIL lines.) Baseline 11892 / 2 skipped.
- jsdom census alone (`e2eCensus.test.ts`): 48 passed. `jest-census-r1.log`.
- matrix alone: 176 passed. `jest-matrix-r1.log`.
- Pair count: `count-pairs-r1.log` (`TOTAL unique pairs 230 | montage-prefixed pairs 54`).
- Scratch bug probes (not committed): `keep/zz-scratch-montage-probe-r1.test.ts.txt` (PROBE1-PROBE18; PROBE19 was a one-off).
- No e2e, lifecycle, shots or parity run (Phase A).

## Phase B plan (for reference)
e2e specs in `e2e/specs/montage/` (MONT-C / B / R / G / L / H / S / X groups, one plain driver per pair), the `_census.e2e.ts` run, markers for the keys the owner files (ready assertions: bug 1 and 2 `toMatchObject` / byte checks of the written block, bug 3 `document.activeElement` after Enter on `montage.bar.end-round`, bug 4 two rows after the add, bug 5 error card, bug 6 `rounds: "31"`, bug 7 verdict word), then the full battery (lifecycle 7 parts, e2e coverage `230/230`, shots 592, freeze 280/280, parity last).

## Phase B

### Executive summary
- STATUS: DONE (Phase B). Branch `sc438-e2e-montage`, head `0bbc1948` (six commits on `27120710`; origin/develop still `27120710` at the start of the battery and at the end, no rebase). Nothing pushed, superproject untouched.
- e2e (full run, twice): `406/418 ok, 0 failed, 12 known-bug, coverage: 230/230 pairs` both runs, rc 0 both (baseline 338/341, 3 known-bug, 176/176). Known bugs: SC-257, SC-355, SC-384 (old) plus 9 new markers (below).
- Real-Obsidian census `[CENSUS-10]`..`[CENSUS-12]` pass. 74 montage e2e tests (418 vs 341 total = those plus the 3 census tests) (`[MONT-C/B/R/G/L/H/S/X/F/W]`), every one of the 54 pairs driven by a plain test.
- SC-626 REPRODUCES in real Obsidian: three `knownBug('SC-626')` markers (End round, strip header, Log sheet). Set limits unchanged Save writes nothing in real Obsidian (`expectNoWrite` passes, `[MONT-S07]`), so no stop.
- tsc rc 0, lint rc 0, jest `12098 passed / 2 skipped / 0 failed` (baseline 11892 / 2), lifecycle `64/64` (21+16+9+4+7+4+3, no red, part 7 ran once, loadavg 7.9 at its start), shots 592 / 0 FAIL, host-leak 163/978, modal host-leak 40/240 (unchanged), capture clip 147, freeze 280/280, parity 0/0/24.
- No product change beyond the Phase A ids. No new bugs found in Phase B.

### Commits added in Phase B
- `0f3675fa` test(SC-438): e2e specs for the montage (chrome, board, action bar, disclosures, Log sheet, Add a hero, Set limits, integrity, focus), unknown-keys fixture, driver helpers
- `6fba9b36` test(SC-438): e2e wrong-value fixtures and markers, jsdom known-bug markers, disclosure state reset, row button helpers
- `0bbc1948` test(SC-438): the row button is driven by id (nth)
Diff vs `27120710`: 43 files, +3287 / -8.

### e2e specs (`e2e/specs/montage/`)
- `chrome.e2e.ts` C01-C06: the four chrome items by click and by Enter (Add a round writes rounds 4; Add a hero / Set limits open their window, Set limits pre-filled 4 / 3; Reset progress by click and by Enter on `mid.md`).
- `board.e2e.ts` B01-B12: Heroes "+", row button (new / edit / disabled on a complete montage), cell click / Enter / Space, past empty cell, socket (click on its edge), quick trio x3 + second hero, and the wide board (pinned hero column while scrolled, scroll held across a write).
- `action-bar.e2e.ts` R01-R09: Log (first hero yet to act), Log disabled, Undo (tally + skill given back), Undo disabled, Back, End round, winning success -> Complete bar, Reopen, Clear all.
- `disclosures.e2e.ts` G01-G04: strip / guide click, strip Enter, state across a write; no write.
- `log-modal.e2e.ts` L01-L11: three chips, skill reuse warning (Log stays enabled), edit Save, Remove, Cancel (click, Enter), Escape in the note / aimed at the X / X / backdrop, disabled Save for an unrecognised result, keyboard Log, past-round sheet.
- `add-hero-modal.e2e.ts` H01-H07, `limits-modal.e2e.ts` S01-S07 (typed, negative / fraction, below-tally completes, Cancel, every way out, keyboard, unchanged Save = no write).
- `integrity.e2e.ts` X01-X10: two blocks, identical twins (first and second, Reading view), Live Preview twins and the sheet, hand-written YAML, participant extra key, a hand edit inside the block made while drawn, two SC-625 markers.
- `focus.e2e.ts` F01-F03 (SC-626 markers), `wrong-values.e2e.ts` W01-W03 (SC-628 x2, SC-629).
- New fixtures: `unknown-keys.md`, `wrong-title.md`, `quoted-rounds.md`, `no-action.md` (README rows added; the jsdom census reads fixtures from disk, all 17 pass).

### Markers (all pass as expected-failures today)
- SC-625: e2e `[MONT-X09]` (top-level `table_notes`), `[MONT-X10]` (entry `dc: 12`); jsdom `[K01]`, `[K02]` (`test.failing`).
- SC-626 (reproduces in real Obsidian): e2e `[MONT-F01]` End round Enter, `[MONT-F02]` strip header Enter (both `failsWith /Received: null/`), `[MONT-F03]` Log from the keyboard (`failsWith /Received: false/`); jsdom `[K03]`. Focus ends on `<body>` after the rebuild.
- SC-627: e2e `[MONT-H07]` (a second "Kira" is refused). SC-628: `[MONT-W01]` (`title: 2024` does not give an error card), `[MONT-W02]` (Add a round on `rounds: "3"` reaches 4). SC-629: `[MONT-W03]` (word and rule agree, no wording asserted). SC-631: jsdom `[K04]`.
- No marker (per ruling): SC-630 (Reset / Clear all are driven as plain tests), SC-632.

### Notes
- The strip / guide open state lives in the plugin session store keyed by the block, so it outlives a test: `closeDisclosures` (driver) starts every disclosure and F02 test closed. Without it a G test failed when run after G02 (an e2e test-isolation fact, not a product bug).
- A hero's row button has `opacity: 0` until the name cell is hovered (`hoverHero` first); `montage.cell.socket` is clicked with `{ inset: 3 }` to miss the quick trio.
- Key presses on `montage.bar.end-round` / `montage.bar.log` are sent to the page (`dse.press('Enter')` after `tabTo`) because those pairs are not in the manifest (the focus checks need a key, the manifest lists click only); the block is declared edited with `dse.embeddedTarget`.
- An outside prose edit (above the block) is rejected by the driver's note invariant, so the "hand edit survives" scenario edits INSIDE the block (`[MONT-X08]`).

### Gates (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc438-impl-r1/`)
- tsc `tsc-r1c.log` rc 0; lint `lint-r1c.log` rc 0.
- jest full `jest-full-r1b.log`: `Test Suites: 1 skipped, 279 passed; Tests: 2 skipped, 12098 passed, 12100 total`, rc 0, 87.9 s. (The 2 skips are the no-`obsidian-app.css` skips; a shots run followed, so a re-run now would read 2 fewer skips.)
- e2e run 1 `e2e-full-2.log`, run 2 `e2e-full-3.log` (the earlier `e2e-full-1.log` failed the coverage gate on the row button driven by a CSS ref, fixed in `0bbc1948`): both `OBSIDIAN-E2E done: 406/418 ok, 0 failed, 12 known-bug, coverage: 230/230 pairs`, rc 0. Element runs `e2e-montage-a.log`, `e2e-montage-b.log`.
- lifecycle `lifecycle-p1..p7.log`: 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3 = 64/64, all rc 0. `demo-vault/.obsidian/appearance.json` clean before part 6.
- shots `shots-r1.log`: 592 `ok`, 0 FAIL, button host-leak 163 kinds / 978 comparisons, modal button host-leak 40 / 240, capture clip 147, rc 0.
- freeze `freeze-r1.log`: `freeze OK (280/280 frozen print PNGs byte-identical)`.
- parity `parity-r1.log` (run last): `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0.
- Nothing moved: attribute-only product change left every print byte, host-leak and modal sweep number as at baseline.

### Drive-by fixes:
None.

### Follow-ups:
- None new. (Phase A follow-ups are ticketed: SC-630, SC-631, SC-632.)

## Round 3

### Executive summary
- STATUS: DONE. dse head `d5acaabb` (rebased onto origin/develop `506786cb`, no conflicts, package.json unchanged; 9 commits). Superproject commit `66b35823` on `sc438-e2e-montage`, parent `075b61e3` (= workspace origin/main after a fast-forward); `git diff --stat origin/main HEAD` shows exactly one line, `draw-steel-elements`; `git status --short` is clean afterwards. Nothing pushed.
- All r2 findings folded (M-1, L-1..L-5, INFO-1, INFO-4, INFO-5); tests and manifests only, `src/` unchanged since Phase A.
- Pairs: 233 (230 + `montage.bar.end-round` press:Enter + `montage.bar.log` press:Enter = 232, + `montage.guide` press:Enter from INFO-4 = 233). L-5 adds no pair (a Tab is no control interaction; the keys go to the page).
- Gates: tsc rc 0, lint rc 0, jest `12107 passed / 1 skipped` (shots cache present, baseline 11900 / 1), lifecycle 64/64 (21+16+9+4+7+4+3, no red; part 7 ran once at loadavg 1.6), e2e twice `413/426 ok, 0 failed, 13 known-bug, coverage: 233/233 pairs`, shots 592 / 0 FAIL, host-leak 163/978, modal host-leak 40/240, clip 147, freeze 280/280, parity 0/0/24.

### Findings, one by one
- M-1: `montage.bar.end-round` and `montage.bar.log` now list `press:Enter`; new plain tests `[MONT-R10]` (Enter on End round writes round 2, chip reads Round 2 / 3) and `[MONT-R11]` (Enter on Log opens the sheet for Bram, no write). `[MONT-F01]` / `[MONT-F03]` press on the buttons themselves; `embeddedTarget` is gone.
- L-1: `[MONT-L03]` now checks Failure pressed / Success not, then Assist pressed / Failure not, and logs an assist (the chip handler must work for it to pass). Success's click stays driven by L05.
- L-2: `[MONT-L10]` asserts the Kira round-1 cell is `success`; `[MONT-H06]` asserts the Osric board row; `[MONT-S06]` asserts 7 success slots.
- L-3: the SC-629 marker `[MONT-W03]` tests the phrase `\btotal failure\b` on the word and the rule line (still asserts only that they agree); "failures" no longer counts.
- L-4: `[MONT-B10s]`, `[MONT-B10f]`, `[MONT-B10a]` are three literal `it` titles (helper `quickLog`), visible to `--only` and the uniqueness scan.
- L-5: `[MONT-B13]` real Tab onto Kira's round-10 cell on the new `Montage/wide-entries.md` (rounds 4, 5, 10 logged): scrolled into view. `[MONT-B14]` real Shift+Tab onto a cell sticking 20 px under the pinned hero column: it ends clear of the column. Mutation check: with the `focusin` handler disabled (reverted), B14 went red (`Expected >= 669, Received 650`); B13 stayed green (Chromium scrolls a wholly hidden cell by itself), so B14 is the one that bites.
- INFO-1: `[MONT-F04]` Live Preview `knownBug('SC-626')`, Enter on End round (`failsWith /Received: null/`); jsdom `[K03]` unchanged. SC-626 reproduces in Live Preview as the reviewer found.
- INFO-4: `montage.guide` lists `press:Enter` with plain driver `[MONT-G05]`; the Escape asymmetry was dropped (Escape belongs to the modal scope, not a field).
- INFO-5: `[MONT-B11]` asserts successes 0 / failures 1.
- INFO-2 / INFO-3: no action.

### Commits added in Round 3 (rebased shas)
- `bc1091b3` test(SC-438): r2 findings: press:Enter pairs ..., literal B10 ids, stronger L03 / L10 / H06 / S06 / B11, SC-629 marker neutral to wording, Tab-into-view and Live Preview focus scenarios
- `d5acaabb` test(SC-438): B13 / B14 drive the board's Tab-into-view handler in real Obsidian (wide-entries fixture)
(the Phase A / B commits are the same six, rebased: `87e6be42` is the old `0bbc1948`.)

### Gates (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc438-impl-r1/`)
- tsc `tsc-r1c.log` rc 0; lint `lint-r1c.log` rc 0 (the same files, re-run after the last commit).
- jest `jest-full-r3.log`: `Test Suites: 1 skipped, 279 passed; Tests: 1 skipped, 12107 passed, 12108 total`, rc 0, 87.4 s. The shots cache (`visual-harness/dist/obsidian-app.css`) was present.
- e2e `e2e-full-4.log`, `e2e-full-5.log`: both `OBSIDIAN-E2E done: 413/426 ok, 0 failed, 13 known-bug, coverage: 233/233 pairs`, rc 0. Montage element run `e2e-montage-c.log`; mutation runs `e2e-mut-b13.log`, `e2e-mut-b14.log`.
- lifecycle `lifecycle-r3p1..p7.log`: 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3 = 64/64.
- shots `shots-r3.log` (592 ok, 0 FAIL, 163/978, 40/240, clip 147); freeze `freeze-r3.log` (280/280); parity `parity-r3.log` (`0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`), run last.

### Superproject
`/home/scott/code/steelCompendium/worktrees/sc438-e2e-montage`: fetched, fast-forwarded to origin/main `075b61e3` (it had no commits of its own), then one commit `66b35823` "chore: bump draw-steel-elements to d5acaabb (SC-438: real-Obsidian e2e and jsdom tests for the montage and its three windows)", staging only the gitlink. `git diff --stat origin/main HEAD`: `draw-steel-elements | 2 +-`. `git status --short` after: clean (no other submodule shows as modified).

### Drive-by fixes:
None.
### Follow-ups:
None.

## Round 5

### Executive summary
- STATUS: DONE. dse head `f6e504c7` (rebased onto origin/develop `6785fa06`; the README fixture-row conflict resolved itself, both the SC-569 `two-squads.md` row and the Montage rows are present). Superproject commit `8c0b63a5` on `sc438-e2e-montage`, parent `f219c18c` (= workspace origin/main); `git diff --stat origin/main HEAD` is exactly `draw-steel-elements | 2 +-`; `git status --short` clean. Nothing pushed.
- r4-L1: `[MONT-B13]` now scrolls until 12 px of Kira's round-10 cell show at the right edge, focuses her round-5 cell and presses a real Tab; the cell must end inside the frame (the reviewer's probe, id kept). The comment names the split: B13 right-edge branch, B14 left / pinned-column branch. r4-INFO-1: the `WIDE_ENTRIES` comment now says rounds 4, 5 and 10.
- Mutation (focusin handler disabled, then reverted): B13 red (`Expected <= 1202, Received 1272`) AND B14 red (`Expected >= 669, Received 650`); reverted, both green in the full runs. Log `e2e-mut-r5.log`.
- Gates on the rebased head: tsc rc 0, lint rc 0, jest `12125 passed / 1 skipped` (shots cache present), full e2e `415/428 ok, 0 failed, 13 known-bug, coverage: 233/233 pairs` (rc 0), lifecycle 64/64 (21+16+9+4+7+4+3, no red; part 7 once, loadavg 1.4). No shots/freeze/parity (src unchanged). The earlier pre-rebase mutation run is superseded for gating.

### Commits
- `f6e504c7` test(SC-438): B13 drives the handler's right-edge branch (12 px showing), comments name which test guards which branch (the others are the rebased r1-r3 commits).

### Logs (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc438-impl-r1/`)
`e2e-mut-r5.log`, `jest-full-r5.log`, `e2e-full-6.log`, `lifecycle-r5p1.log` .. `lifecycle-r5p7.log`, `tsc-r1c.log`, `lint-r1c.log`.

### Drive-by fixes:
None.
### Follow-ups:
None.
