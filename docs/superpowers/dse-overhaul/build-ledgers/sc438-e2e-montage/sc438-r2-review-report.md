# SC-438 r2 review: e2e and jsdom coverage of the montage tracker and its three modals

## Executive summary
- **Verdict: NOT LAND-READY.** One short fix round, tests and manifest only. The gates are green, the product diff only adds attributes, and every marker is honest.
- **Findings:** 0 CRITICAL / 0 HIGH / 1 MEDIUM / 5 LOW / 5 INFO. **New product bugs: 0.** One scope note for SC-626: it also reproduces in Live Preview (INFO-1).
- **M-1:** the branch presses Enter on End round and on "Log an action..." but the manifest does not list those pairs. `focus.e2e.ts` sends both keys to the page and marks the block with `embeddedTarget`, so the coverage gate's "unmanifested" check never sees them.
- **Gates at `0bbc1948`:** tsc rc 0 · lint rc 0 · jest `12099 passed / 1 skipped` (shots cache present, so this equals the implementer's fresh 12098 / 2), rc 0, loadavg 2.3 to 10.9 · e2e run 1 and run 2 both `406/418 ok, 0 failed, 12 known-bug, coverage: 230/230 pairs`, rc 0, no flake · lifecycle 21 + 16 + 9 + 4 + 7 + 4 + 3 = **64/64** (part 7 in one run, G-S91 passed on the first try). Shots, freeze and parity were not re-run: data attributes do not change pixels, and the implementer's numbers match the baseline.
- **Pair count:** I counted 230 myself (29 + 12 + 7 + 6 = 54 new). Every interactive node has an id. One real container handler has no real-Obsidian driver (L-5).
- **Censuses:** an un-id'd button with a click listener in the board, and another in Add a hero, turns both censuses red (jsdom 21 tests, CENSUS-10 and CENSUS-12). No allowlist uses a blanket prefix.
- **Mutation probes:** I broke 12 handlers. Every relevant plain e2e test went red, and the control tests stayed green. One test is vacuous: MONT-L03 passes with the chip handler deleted (L-1).
- **Markers:** all 9 e2e markers and 4 jsdom markers fail today for the stated reason. Under one simulated fix per bug, all 13 flip. The other 65 montage e2e tests and the 391 jsdom tests (montage + census) stay green. The S07 no-write and the SC-626 focus loss both reproduce in real Obsidian, and the file's mtime does not change.

## Findings

### MEDIUM

**M-1. Keyboard activation of End round and "Log an action..." is exercised but not declared, and the specs route around the coverage gate.**
- Where: `e2e/specs/montage/focus.e2e.ts:15-16` (F01) and `:43-44` (F03). Both call `dse.embeddedTarget(FRESH, MONTAGE)` and then `dse.press('Enter')` with no target. The comments say "End round x Enter is no manifest pair" and "Log an action x Enter is no manifest pair". The manifest rows are `e2e/manifest/montage.ts:45` (`montage.bar.log`: click, click-disabled) and `:48` (`montage.bar.end-round`: click).
- Failure scenario: `run.mjs` `coverageGate` fails any drive of a pair that no manifest declares, unless the control is `(page)`. The specs got past that check by sending the key to the page. They also borrowed `embeddedTarget`, which is meant for a note that embeds another one, to mark the block as edited. So two real keyboard interactions that the branch's own tests perform are missing from the manifest, and their only drivers are known-bug tests. A regression in keyboard activation of End round would not appear in coverage. The Done bar says "a manifest lists every (control, interaction) pair". The SC-437 precedent declares `init.round.advance` / `init.reset-turns` as `press:Enter`, with its F rows on those pairs (`e2e/manifest/initiative.ts:24-25`).
- Probe: I read `run.mjs:421-440` (the unmanifested filter excludes `(page)`) and the manifests.
- Fix: add `press:Enter` to `montage.bar.end-round` and `montage.bar.log` (and, for consistency, to the other bar buttons with an F or R row). Add one plain driver each, such as R10 "Enter on the focused End round writes `current_round: 2` and the chip reads Round 2 / 3" and R11 "Enter on the focused Log an action... opens the sheet for the first hero yet to act". In F01 and F03, use `dse.press('Enter', end)` / `dse.press('Enter', log)` and drop `embeddedTarget`. Coverage then reads 232/232, or more if you add the other bar buttons.

### LOW

**L-1. MONT-L03 passes with the Result chip's click handler deleted.**
- Where: `e2e/specs/montage/log-modal.e2e.ts:53`. The test clicks Failure, then Success, and asserts that Success is pressed and a success is logged. Success is the new sheet's default, so the clicks are not needed for the test to pass.
- Probe: mutation group A (`this.selectedResult = rc.value` removed, `LogActionModal.ts:202`). L02 went red. L03 stayed green (`pmutA2-e2e.log`). `montage.log.result.success x click` is still honestly driven by L05 (edit Failure to Success), so coverage is real. Only L03 is vacuous.
- Fix: assert the state between the two clicks (Failure pressed, Success not), or end on a chip that is not the default (Success, Failure, then Assist, logs an assist).

**L-2. Three keyboard-submit pairs check the screen only by "the modal is gone".**
- Where: `montage.log.submit x press:Enter` (the only plain driver is L10, `log-modal.e2e.ts:157`), `montage.add-hero.submit x press:Enter` (H06, `add-hero-modal.e2e.ts:73`), and `montage.limits.save x press:Enter` (S06, `limits-modal.e2e.ts:77`). Each asserts the note and that the modal closed, but nothing on the board.
- Failure scenario: suppose a regression writes the note on Enter but the rebuild fails to draw the result (a stale board). The ticket asks that each pair's driver assert the note and the screen, and these three would still pass.
- Fix: add one board assertion each: L10 `cellOf(root,'Kira',1)` `data-kind="success"`; H06 an Osric `.dse-mt__board-name` row; S06 a success track with 7 slots.

**L-3. The SC-629 marker's regex would stay red under a reasonable neutral rewording.**
- Where: `e2e/specs/montage/wrong-values.e2e.ts:29`: `expect(/failure/i.test(word)).toBe(/failure/i.test(rule))`.
- Failure scenario: a fix keeps "Not started" and rewrites the rule line neutrally as "No successes or failures were logged". `/failure/i` matches "failures", so the marker stays red even though word and rule now agree. That conflicts with the ruling ("neither claims a result"; never a specific wording). My simulated fix, "Nothing was logged — no Victories awarded.", did flip it.
- Fix: test for the verdict, not the substring: `/\btotal failure\b/i` on both strings (or `/\bfailure\b/` with a word boundary that excludes the plural).

**L-4. `[MONT-B10${kind[0]}]` ids are invisible to the runner's title pre-scan.**
- Where: `e2e/specs/montage/board.e2e.ts:115` (a template-literal title in a `for` loop).
- Failure scenario: `run.mjs` `TITLE_RE` / `scanSpec` (`:115-124`) reads only literal titles. `npm run e2e -- --only=MONT-B10s` exits 2 ("unknown test id"; I hit this, `pmutA-e2e.log`). The scenario-id uniqueness guard (SC-436) cannot see MONT-B10s/f/a either, so a parallel branch could reuse the ids without a start-up error. The pattern has precedent (`CALL-N0x`, `pool-conditions [${id}]`), so this is LOW.
- Fix: write three literal `it('[MONT-B10s] …')` titles, or a table whose rows carry literal `[MONT-B10s]` strings that the pre-scan can match.

**L-5. The board's `focusin` keep-in-view handler has no real-Obsidian driver.**
- Where: `src/elements/montage/BoardView.ts:180` (`keepFocusedCellInView`, SC-326 r3 / SC-490). It is a real keyboard-driven handler: Tab onto a round cell that is partly hidden scrolls it fully into view, past the pinned column. jsdom pins it with mocked geometry (`test/dom/elements/montage.test.ts:1979-2110`). MONT-B12 scrolls by script (`scrollLeft = 300`), and no e2e test Tabs across `wide.md`.
- Failure scenario: this behaviour depends on Chromium layout and the pinned column's real width, which jsdom only fakes. A layout change that breaks it stays green.
- Fix (optional, test-only): MONT-B13 on `Montage/wide.md`: Tab from the bar backwards (or forwards) to a cell under the pinned column, then assert `cell.left >= frame.left + pinnedWidth` and `cell.right <= frame.right`.

### INFO

- **INFO-1. SC-626 also reproduces in Live Preview** (probe `zlp.e2e.ts`, `pzlp-head.log`). After Enter on End round, `document.activeElement` is `BODY` in Live Preview as well as in Reading view. The SC-602 Live Preview focus carry (`src/framework/host/livePreviewFocusCarry.ts:57-70`) reads control ids, but it cannot help here. The montage's `commit()` rebuilds the root (`view.ts:532-535`) before the write lands, so focus is already on `<body>` when the carry looks for it. The new ids therefore cause no behaviour change, which addresses item 7. Owner: note on SC-626 that its fix must cover Live Preview too; F01-F03 are Reading view only.
- **INFO-2.** The real-Obsidian modal censuses (CENSUS-11/12, `_census.e2e.ts:231,251`) accept `ALL_IDS` (every manifest's ids), so an id from another surface inside a montage modal would pass them. This pattern predates the branch (SC-436/437). The jsdom census checks each modal against its own ids and catches it.
- **INFO-3.** The jsdom census checks only the NEW Log sheet; the edit sheet (Remove) is only collected for ids. The edit sheet is censused in real Obsidian (CENSUS-11, second half). Coverage is complete across the two.
- **INFO-4.** Two small manifest asymmetries, neither of which has its own handler: `montage.strip` lists `press:Enter` but `montage.guide` does not (both are native `<button>` headers); `press:Escape` is listed for the note and name fields but not for the skill or limit fields (Escape belongs to the modal's Scope, not to any field). Optional, for consistency.
- **INFO-5.** `MONT-B11` (quick failure on the second hero) asserts the entry and both cells but not the `failures` tally. B10f covers the tally.

## Product bugs
New: **none**. I tried these in the surface hunt, and none was a bug:
- a brief with an internal link, a URL and a tag: no un-id'd listener (ZPRB-04);
- unchanged Set limits Save: the file's mtime is unchanged on disk (ZPRB-01);
- Back to round, Undo after a past-round log, correction delta math, Remove clamping at 0 (`applyTallyDelta`, `model.ts:423`);
- the row button's keyboard reveal (`styles-source.css:4789-4790`, `:focus-visible`);
- an external edit while a sheet is open (the view is replaced and `openManagedModal` closes the sheet).

Known tickets confirmed:
- SC-625 (top-level and entry keys dropped): reproduced in e2e and jsdom.
- SC-626 (focus to `<body>`): reproduced in real Obsidian, in Reading view and Live Preview.
- SC-627, SC-628 (title and quoted rounds), SC-629, SC-631: each reproduced.
- SC-606 and SC-610 stay fixed (jsdom `[L11]` and `montage.test.ts`, green).

## What I verified, item by item
1. **Surface completeness.** I enumerated `view.ts` (bar: Log, Undo, Back, End round, Reopen, Clear all; the 4 chrome items; the strip `onToggle` rebuild), `BoardView.ts` (Heroes "+", row button, `role=button` cells with click and keydown, the socket with a whole-cell click, the quick trio with stopPropagation, the board's `focusin` and `scroll` listeners), `StripView`/`GuideView` (kit `collapsible`, a native `<button>` header), `HeadView`/`OutcomeBandView` (nothing interactive; the brief's rendered markdown adds no listener, ZPRB-04), `LogActionModal.ts` (3 chips, skill input, note textarea, Remove / Cancel / Log or Save), and `ConfigModals.ts` (name input; 2 number inputs; Cancel / Add, Cancel / Save). Every interactive node carries an id. Gaps in the manifest: M-1 (Enter on bar buttons) and L-5 (the `focusin` container handler). The `scroll` listener only tracks state, so it needs no pair.
2. **Censuses.** In a scratch worktree I added a rogue `<button>` with a click listener in the board corner and another in Add a hero (`probe-census.py`). jsdom: 21 SC-438 census tests went red (`pcensus-jest.log`). Real Obsidian: CENSUS-10 red on "RogueB", CENSUS-12 red on "RogueM", CENSUS-11 green as expected (`pcensus-e2e.log`). No prefix allowlist (`censusProblems`, `e2eCensus.test.ts:60-73`; `MONTAGE_IDS` = montage + chrome manifests).
3. **Manifest honesty / mutations.** Group A (`probe-handlers.py A`): Undo, Add a hero submit, Set limits save, Remove, strip onToggle, cell keydown, and the chip click. Red: R03, H01, H06, S01, S06, L06, G02, B06, B07, L02. Stayed green: L03 (L-1) and the controls R06, L10, B11, C05. Group B: quick log, End round, Log submit, chrome Reset progress, Back. Red: R07, B11, X01, X06, R06, L01, L10, C05, C06, R05. Controls R03, H01, B06, G02, S01, L06 stayed green. The runner enforces plain-only coverage (`run.mjs:434-437`).
4. **jsdom matrix.** The expectations are literal tables ([O] 14 rows of word, tails, slots and chip; [B] cell-code grids; [R] bar ids; [H] and [S] typed-value tables). None is computed from the product. The matrix has no plain row that pins a filed bug as correct: under all six simulated fixes, 391/395 jsdom tests stayed green, and the 4 that failed are exactly the K markers.
5. **Markers.** Today's failure text (`.out/20261114-025131-ad00/*/error.txt` in the branch worktree): H07 shows 2 Kiras. W01 shows the error card "existing". W02 received 31. W03 shows the word and the rule disagreeing. X09 has no `table_notes`. X10 has no `dc`. F01 and F02 show `Received: null`. F03 shows `inMontage false`. Each obeys its ledger ruling: SC-627 asserts only refusal; SC-629 asserts no wording (but see L-3); SC-628 and SC-625 have one marker per case. Simulated fixes (`probe-fixes.py`): every marker flips ("appears fixed"), and every plain test stays green (`pfix-e2e.log` 65/74 with the 9 markers as the only failures; `pfix-jest.log`).
6. **Bug hunt.** See "Product bugs" above.
7. **Product diff.** 6 files, +35/-8. Every hunk is a `control:` option or a `stampControl` call. The `stampControl(cell, …)` ternary (`BoardView.ts:356`) stamps exactly the shapes that already had listeners, plus read-only `aria-disabled` cells. The product code that reads ids (`controlFocus`, `livePreviewFocusCarry`, `windowHandoff`) shows no observable change (INFO-1).
8. **Integrity.** jsdom [X01]-[X04] check the prose and the other block byte for byte across 7 write paths, for distinct blocks and identical twins. e2e X01-X05 cover Reading view and Live Preview. The driver's invariant (`noteFences.integrityProblems`) runs after every test. I confirmed that it catches a stray edit on montage notes: an edit to the prose below → ZPRB-02 red, and an edit inside the twin → ZPRB-03 red ("fence #1 changed but is not a block this test declared"). Content above and below the block, a second block, and an identical twin are all covered.
9. **Scenario ids.** `[MONT-*]` appears only on this branch. `[CENSUS-10..12]` is unique: develop, SC-614 (`283cb2f5`) and SC-569 (`27a65b45`) stop at 09. No duplicate ids. No bracketed ticket id in a title (only the `knownBug` wrapper's own suffix). origin/develop is still `27120710`. The exception is L-4.
10. **Gates.** Below.

## Gate logs
All logs are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc438-rev-r2/`. The branch worktree was clean and at `0bbc1948` before and after.
- tsc `tsc.log` rc 0. lint `lint.log` rc 0.
- jest `jest.log`: `Test Suites: 1 skipped, 279 passed, 279 of 280 total; Tests: 1 skipped, 12099 passed, 12100 total; 87.5 s`, rc 0. Loadavg 2.30 at the start, 10.85 at the end (`jest.load`).
- e2e run 1 `e2e1.log` and run 2 `e2e2.log`: `OBSIDIAN-E2E done: 406/418 ok, 0 failed, 12 known-bug, coverage: 230/230 pairs`, rc 0 both. Loadavg 8.8-12.1 for run 1 and 9.1-11.7 for run 2.
- lifecycle `lc1.log`..`lc7.log`: 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3 = 64/64, all rc 0. `appearance.json` was clean before part 6. Part 7 ran once on a quiet host (loadavg 0.8).
- Probes: `pcensus-jest.log`, `pcensus-e2e.log`, `pmutA2-e2e.log` (`pmutA-e2e.log` is the rc 2 template-id run, L-4), `pmutB-e2e.log`, `pfix-e2e.log`, `pfix-jest.log`, `pzprb-e2e.log`, `pzlp-head.log`.
- Probe sources: `probe-census.py`, `probe-handlers.py`, `probe-fixes.py`, `zz-review-probe.e2e.ts`, `zlp.e2e.ts`, `zprobe-link-fixture.md`, `zprobe-lp-fixture.md`. I removed the scratch git worktree with `git worktree remove`.

## r4

### Summary (scoped re-review of the r3 delta `87e6be42..d5acaabb`)
- **Verdict: LAND-READY.** All 9 r2 findings that were to be folded are fixed as prescribed, and each fix bites (probes below). One new LOW (r4-L1: MONT-B13 never reaches the handler's right-edge branch) and one INFO. Neither blocks; folding r4-L1 is one test.
- **Rebase clean:** `git range-diff 27120710..0bbc1948 506786cb..87e6be42` gives `=` for all 6 commits. `src/` is unchanged since Phase A (the 6 product files, +35/-8, are the same as at r2). origin/develop is still `506786cb`.
- **Superproject:** `66b35823` has parent `075b61e3` (= origin/main). The diff is ONE gitlink line (`506786cb` to `d5acaabb`), `git status` is clean, and no AI trailer appears in any commit.
- **e2e full run (mine, at `d5acaabb`):** `OBSIDIAN-E2E done: 413/426 ok, 0 failed, 13 known-bug, coverage: 233/233 pairs`, rc 0, loadavg 1.2 to 14.4. This matches the expected numbers exactly; the +3 pairs are `bar.end-round` / `bar.log` / `guide` `press:Enter`.
- **Mutation probe** (one build, 4 mutants; `r4-mut-e2e.log`):
  - Chip handler deleted: MONT-L03 red (L-1 fixed).
  - Success track capped at 6 slots: MONT-S06 red (expects 7), while MONT-S01 (expects 6) stays green. This proves the new L-2 screen assertion is what catches it.
  - A neutral SC-629 wording ("No successes or failures were logged — …"): MONT-W03 reports "appears fixed" (L-3 fixed).
  - focusin handler disabled: MONT-B14 red (`>= 669`, received 650), MONT-B13 green.
  - `--only=MONT-B10s` now works (L-4 fixed).
  - Unrelated controls stayed green: L10, H06, B10s.

### Findings
**r4-L1 (LOW). MONT-B13 checks Chromium's own scrolling, not the board's handler; the handler's right-edge branch has no real-Obsidian driver.**
- Where: `e2e/specs/montage/board.e2e.ts:183`. B13 Tabs onto a round-10 cell that is wholly hidden past the right edge. Chromium scrolls a wholly hidden focused element by itself, so B13 stays green with the handler disabled (my probe and the implementer's).
- `keepFocusedCellInView` (`src/elements/montage/BoardView.ts:180-196`) has two branches. The left one (`box.left < left + pinned`) is B14's case, and B14 bites. The right one (`box.right > right`) is the original SC-326 r3 MED-2 shape: a cell with a few px showing at the right edge, which Chromium leaves partly hidden. No real-Obsidian test reaches it.
- Probe `ZB13-01` (`r4-zb13.e2e.ts`): scroll so 12 px of Kira's round-10 cell show at the right edge, focus round 5 by script, then press a real Tab. At head the test is green (right edge 1272 moves to 1201 = frame right). With the handler disabled it is red (it stays at 1272). Logs: `r4-zb13-head.log`, `r4-zb13-mut.log`.
- Does B13 earn its place as written? No: its assertions only re-check browser behaviour, which B12 and the layout already imply.
- Fix: reshape B13 to the partly visible right-edge shape (`ZB13-01` is a drop-in body). Also correct the comment at `board.e2e.ts:173` to say which test guards which branch. Test-only change; coverage stays 233.

**r4-INFO-1.** `e2e/driver/montage.ts:16`: the `WIDE_ENTRIES` comment says "entries in rounds 10 and 11", but the fixture (`Montage/wide-entries.md`) logs rounds 4, 5 and 10. The README row is correct.

### Delta checked as honest
- **R10:** Enter on End round, then one write, `current_round: 2`, and the chip reads Round 2 / 3.
- **R11:** Enter on Log, then no write, and the Bram · round 2 sheet opens.
- **G05:** Enter on the guide, then no write, `aria-expanded` true, and the body is displayed.
- **F04:** Live Preview `knownBug('SC-626')` with `failsWith /Received: null/`; it passed as known-bug in my run.
- **F01/F03:** now press on the button itself, and `embeddedTarget` is gone (M-1).
- **L10 / H06 / S06:** each gained a board assertion (L-2).
- **B11:** asserts 0 / 1 (INFO-5).
- **B10s/f/a:** literal titles (L-4).

### Logs (all in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc438-rev-r2/`)
- `r4-e2e.log`/`.rc`/`.load`: the full run.
- `r4-mut-e2e.log`: the mutation probe. Source: `r4-probe-mut.py`.
- `r4-zb13-mut.log`, `r4-zb13-head.log`: the B13 shape probe. Spec: `r4-zb13.e2e.ts`.
- I removed the scratch worktree `r4wt` with `git worktree remove`. The branch worktree is clean at `d5acaabb` before and after.

## r6

### Summary (scoped re-check of r5 at dse `f6e504c7`, on develop `6785fa06`)
- **Verdict: LAND-READY.** 0 findings.
- **r4-L1 fixed as prescribed.** MONT-B13 (`e2e/specs/montage/board.e2e.ts`) is now the body of my probe ZB13-01, line for line; only the title and three comments differ (checked with `diff`). That body went red in r4 with `keepFocusedCellInView` disabled (`r4-zb13-mut.log`) and green at head. The block comment above B13/B14 now says B13 guards the right-edge branch and B14 the left / pinned-column branch. MONT-B14 is unchanged.
- **r4-INFO-1 fixed.** `e2e/driver/montage.ts:16` now reads "Kira's entries in rounds 4, 5 and 10", matching `Montage/wide-entries.md`.
- **The r5 commit `f6e504c7` touches only those two files** (+18/-11).
- **Rebase is clean.** `git range-diff 506786cb..87e6be42 6785fa06..a3c1570b` gives `=` for all 6 commits, so the README fixture-table merge with SC-569 changed nothing beyond context. `range-diff 87e6be42..d5acaabb a3c1570b..8a4333ba` gives `=` for both r3 commits. `src/` is the same 6 files (+35/-8). origin/develop is `6785fa06`.
- **Superproject `8c0b63a5`** has parent `f219c18c` (= origin/main). `diff --stat origin/main HEAD` is one line (`draw-steel-elements`, `6785fa06` to `f6e504c7`), status is clean, and no commit has a Co-Authored-By trailer.
- **Targeted run at head:** `npm run e2e -- --only=MONT-B13,MONT-B14` gave `2/2 ok, 0 failed`, rc 0, loadavg 1.7. Log: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc438-rev-r2/r6-b13b14.log`.
- No scratch worktree was needed. The branch worktree was clean before and after.
