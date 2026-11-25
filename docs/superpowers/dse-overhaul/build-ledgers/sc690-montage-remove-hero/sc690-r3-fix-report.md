# SC-690 r3 fix report

**Executive summary**
- STATUS: DONE. All six findings and both nits fixed. Plugin head `a84fa7a5` (base `develop` @ `aee83dc1`); superproject head `980ac82c` (CHANGELOG only, no pointer bump).
- Full battery at the final head: tsc (+`tsc -p e2e`) and lint clean; jest 14480 passed / 1 skipped (r1: 14471); lifecycle 64/64 (seven parts); shots 592; freeze 280/280, 0 FAILED; parity 0 / 0 / 24.
- e2e: `OBSIDIAN-E2E done: 817/828 ok, 0 failed, 11 known-bug, coverage: 486/486 pairs`, **exit 0, no "coverage gate FAILED" line** (last 5 lines below).
- Red first this time: the new unit and DOM tests failed (8 of 41: 3 unit, 5 DOM) with the source stashed; the new e2e D17 failed with the list cap removed from the CSS; mutant M5 (trim/case-insensitive entry match) is now killed by the new unit test.
- O6 done: the button reads "Remove" (disabled) before a pick, "Remove <name>" after, accessible name identical, long name cut with an ellipsis. The line is a never-hidden live region outside the scrolling body; in a 620px window with 12 heroes only the list scrolls (one scrollbar) and the line and button stay on screen.
- Evidence regenerated (B1, B2, D long-name, D short viewport) in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc690-montage-remove-hero/evidence/`. Logs: `.../sc690-r3-logs/`.

## e2e gate, last 5 lines of `r3-e2e-full.log` and exit code
```
OBSIDIAN-E2E RECOV-R09 ok (587 ms)
OBSIDIAN-E2E RECOV-R08 ok (542 ms)
OBSIDIAN-E2E done: 817/828 ok, 0 failed, 11 known-bug, coverage: 486/486 pairs
OBSIDIAN-E2E coverage driven: 499 (control, kind) pair(s) -> .../e2e/.out/coverage.json
e2e exit 0
```
`grep -c "gate FAILED"` on the log: 0. (+2 tests over r1: MONT-D17, MONT-D18; pairs 485 -> 486 with the `press:Escape` pair.)

## Findings
- **HIGH-1 (coverage gate): fixed.** `e2e/manifest/montage-remove-hero-modal.ts`: `montage.remove-hero.hero` now `c(['click','press:Enter','press:Escape'], ['D02','D03','D05','D06','D17','D18'])`. Pinned by the full e2e gate itself (exit 0, 486/486); r1's red gate was my error (I quoted only the `done:` line).
- **MED-1 (exact-name match unpinned): fixed (test).** `test/unit/model/montage-remove-hero.test.ts` "actions are matched the way the board matches them…": `kira`, `"Kira "`, `" Kira"` stay, `{actions: 1}`, tally drops by one success. Mutant M5 (both `entry.hero === name` lines made trim/lower-case) applied: that test FAILS (`r3-m5.log`: 1 failed, 20 passed); restored.
- **LOW-1 (same-name chip): fixed.** `removeMontageHero(m, name, rosterIndex?)` removes the hero at that `montageRoster` place and returns false if no hero with that name stands there. The modal passes each chip's index; `view.ts` re-checks at Remove time through the same call (SC-627/650 rule: a roster that changed removes nothing, no write). Tests: unit (second Kira goes with `[Nature]` kept; first goes; index counts heroes only, skipped items ignored; mismatched / out-of-range index removes nothing), DOM (second chip of two Kiras with different `skills_used`; an outside reorder that puts another hero at the picked place writes nothing), e2e MONT-D18.
- **LOW-2 (docs overclaim): fixed.** Plugin `CHANGELOG.md`, superproject `/home/scott/code/steelCompendium/worktrees/sc690-montage-remove-hero/CHANGELOG.md`, `docs/gm-trackers.md`: "success or failure limit"; "Removing a hero cannot be undone. Cancel or Escape closes the window and changes nothing."; keys "are kept ... written after the montage's own keys as with every save" (no "exactly as they were"); the button is described as "Remove Kira".
- **LOW-3 (line scrolls away, two scrollbars): fixed, no kit change.** The line is created on `contentEl` between the body and the footer (outside the scroll area). `.dse-mt__sheet-herolist` is the only scroller: `max-height: min(70vh, calc(85vh - 12em)); overflow-y: auto` (Obsidian's `.modal` caps at 85vh, so it no longer scrolls too). Measured in real Obsidian at 620px, 12 heroes, 80-char name picked: dialog/body scroll 0, list scroll 79px, list 347px, line 465-496, footer 512-536, dialog 67-553 (window 620), one scrollbar (image). Pinned by MONT-D17 (red when the list cap is removed: `r3-e2e-d17red.log`).
- **LOW-4 (status line hidden until first pick): fixed.** `role="status" aria-live="polite" aria-atomic="true"`, present and not hidden from the moment the window opens, empty until a pick (`:empty` drops its margin; never `display:none`). DOM test "the line … is in the accessibility tree from the start"; MONT-D01 asserts it is empty at open.
- **O6: done.** "Remove" / disabled before a pick; "Remove <name>" after; `aria-label` identical (set with `setLabel`), control id unchanged. CSS: `.dse-mt__sheet-removebtn .dse-btn__text { max-width: 16em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }`. 80-char name: button 221px wide, text cut, label whole (MONT-D17 asserts `scrollWidth > clientWidth`, label `Remove <full name>`, button inside the dialog). DOM tests: plain "Remove"/aria-label at open; "Remove Bram" then "Remove Osric"; long name label/text whole.
- **INFO nits: fixed.** `e2eCensus.test.ts:470` title "four modals"; manifest: Cancel row cites only D04.

## Tests added / changed
Unit +5 (`montage-remove-hero.test.ts`: 21 total), DOM +4 (`montage-remove-hero.test.ts`; two existing assertions updated: the "hidden" line and the Remove text), e2e D17, D18 new, D01/D02 extended. jest delta: +9 (14471 -> 14480).
Red evidence: sources stashed -> `r3-dom-red.log` (8 failed of 41, the 3 unit + 5 DOM new tests) and `r3-unit-red.log` (3 failed); D17 red in `r3-e2e-d17red.log`; M5 in `r3-m5.log`.

## Gates at plugin head `a84fa7a5` (logs in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc690-montage-remove-hero/sc690-r3-logs/`)
- tsc / `tsc -p e2e` / lint: exit 0, 0, 0.
- jest: `Tests: 1 skipped, 14480 passed, 14481 total` (313 suites passed).
- lifecycle (seven `--only` parts): 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3 = 64/64 ok, 0 failed.
- e2e: above.
- shots: 592 `ok` lines, exit 0. freeze: `freeze OK (280/280 ...)`. parity (last): `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, exit 0.

## Files changed in r3
`src/elements/montage/model.ts`, `ConfigModals.ts`, `view.ts`, `styles-source.css`; `test/unit/model/montage-remove-hero.test.ts`, `test/dom/elements/montage-remove-hero.test.ts`, `test/dom/e2eCensus.test.ts`; `e2e/manifest/montage-remove-hero-modal.ts`, `e2e/specs/montage/remove-hero-modal.e2e.ts`; `docs/gm-trackers.md`, plugin `CHANGELOG.md`; superproject `CHANGELOG.md`.

Drive-by fixes: none.
Follow-ups: none new. (`focusRules.ts` comment still accurate; Notice text unchanged per ruling.)
