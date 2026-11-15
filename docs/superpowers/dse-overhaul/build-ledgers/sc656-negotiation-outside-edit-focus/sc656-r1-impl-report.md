# SC-656 r1 implementation report

## Executive summary
- STATUS DONE_WITH_CONCERNS. dse branch `sc656-negotiation-outside-edit-focus` head `79a6b241` on base `42c26272` (origin/develop unchanged, no rebase). Not pushed; superproject untouched.
- Behaviour: an outside redraw of a `ds-negotiation` card (Reading view, Live Preview, pinned sidebar) while a card control had focus now puts focus on the same control of the redrawn card. No Notice. Focus outside the card is never pulled in.
- Mechanism: `windowHandoff.ts` reused (additive: `silent` option, `rememberFocus`, `handOffAfterOutsideRedraw`); negotiation view remembers token + slot while focus is inside, hands off from its unload; pinned sidebar fixed inside `NegotiationView.update()` (no sidebar file touched).
- Tests: jest +17 (`negotiation-outside-edit.test.ts` OE01..OE17), e2e +9 (`NEGO-O01..O09`). Red on base: jest 12/17 (the 5 negatives pass on base by design), e2e 7/9.
- Gates: tsc/lint clean · jest 13464 passed/2 skipped fresh, 13465/1 with shots cache · e2e `631/640 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` · shots 592, host-leak 163/978, modal 40/240, clip 147 · freeze 280/280 · parity 0/0/24 · lifecycle 63/64: G-S61 red, ALSO red on clean base `42c26272` (SC-668), all other 63 green.
- Concern for owner: Complete Argument comes back DISABLED in a redrawn card (tier choice is view-only state), so its focus lands on the first Motivation chip (SC-642 fallback), not on the button itself.

## Commits (dse repo, oldest first)
- `955d7c74` fix(negotiation): outside redraw keeps focus on the same control (view.ts, windowHandoff.ts, jest OE01..OE16)
- `8a491da0` test: e2e NEGO-O01..O08 (RV + LP)
- `af139520` fix: pinned sidebar in-place refresh keeps focus (`NegotiationView.update`), NEGO-O09, OE17
- `2bab2763` test: OE09 pins the user-moved cancel; `redraw()` lets focusout settle before unload (mutants M3/M6 were surviving)
- `79a6b241` docs: `.repo-docs/architecture.md` windowHandoff row

## Design
- `windowHandoff.ts` (additive only; no existing export renamed or changed in signature/behaviour): `OutsideCloseHandoff.silent?: boolean` (guards the two `new Notice` sites); `rememberFocus(owner, root, elementId, families)` returns a reader of `FocusMemory {focus, slot}`; `handOffAfterOutsideRedraw({memory, own, oldRoot, families?, fallbacks?, owner})` = `handOffAfterOutsideClose` with `silent: true`, `ownContent: ''`, `notice: ''`. Everything else reused: slot lookup, immediate look + 3 s watch, settle re-claim, focus-is-free / user-moved cancel, count guard, plugin-owned cancel.
- Window-less trigger / token recording: `rememberFocus` listens (registerDomEvent on the view) for `focusin` on the card root: `captureControlFocus` + `slotOf` at that moment. `focusout` clears the memory one microtask later ONLY if the root is still connected and focus is not inside it (a card that merely left the document keeps its memory; a user blur to the page clears it; control-to-control moves pass through body and are re-set by the next focusin). Listeners installed once (root outlives every rebuild).
- `NegotiationView`: publishes a `WindowRootRecord` at the END of `onMount`; ctor registers an unload callback (runs before the base flush, LIFO) that starts the hand-off with `NEGOTIATION_FOCUS_FALLBACKS`. Skipped when the view called `persist()` less than 3000 ms before unload (own write: Live Preview rebuilds the widget on every save and the SC-602 carry hands focus on; Reading view adopts). `persist()` overridden only to stamp `lastPersistAt`.
- Pinned sidebar: `SidebarPanel.handleExternalChange` fast path calls `view.update(model)` with a new model (no unload). `NegotiationView.update` now captures focus when `model !== this.model` and restores it after the rebuild (Reset passes its own model, so SC-639 is untouched; mutant M8 killed by the SC-639 jest test).
- Measured surfaces (before my change, on base behaviour): Reading view and Live Preview both dropped focus to BODY on an outside edit (e2e red on base: O01-O03, O05-O07). LP: SC-602 `livePreviewFocusCarry` covers own saves only (needs a claim ticket), so it did NOT cover this. Pinned sidebar: negotiation is pinnable (experimental pref); focus was lost (O09 red before the `update` override, green after).

## Fallback table (all tested)
| case | result | test |
|---|---|---|
| same control present | same control (family + position) | OE01-04, OE13, e2e O01/O02/O05/O06 |
| Complete Argument focused, tier chosen | redrawn button is disabled (no tier) -> first Motivation chip (SC-642 rule) | OE05, O03, O07 |
| control gone, siblings remain | last chip of its kind | OE06 |
| everything gone | card root, `tabindex=-1`, never body | OE07 |
| negotiation count in the pane changed | no focus move | OE08 |
| user moved focus before the new card arrived | no focus move | OE09 |
| focus was outside the card / left it for body earlier | nothing pulled in | OE11, OE12, e2e O04/O08 |
| own write then redraw within 3 s | no hand-off; after 3001 ms hand-off | OE14 |
| plugin unloaded while pending | cancelled | OE15 |
| Sync burst (second redraw) | second card keeps focus | OE16 |
| LP order (unload first, card ~45 ms later) | focus once built | OE10 |

## Text-input draft finding
Negotiation has NO text input (only checkboxes `negotiation.mod.*`, chips, seals, tier radios, tabs, menu button). Nothing typed can be lost. The only unsaved view-only state across an outside redraw is the CHOSEN TIER (`ArgumentView.selectedId`, not in the note): it resets, which is why Complete Argument comes back disabled. Checkbox/chip/seal state is in the note and follows the outside edit.

## Other-elements survey (scratch e2e, not committed; copy at `.../scratchpad/sc656-r1-impl/scratch-spec/survey.e2e.ts.txt`)
Method: focus the first enabled `[data-dse-control]` of the element, `externalEdit` inserts a YAML comment line after the opening fence, wait 1.5 s, read `document.activeElement` (10/10 ran; log `survey.log`).
| element (note) | control focused | Reading view after | Live Preview after |
|---|---|---|---|
| counter (Counter/counter.md) | counter.dec | BODY | BODY |
| stamina-bar (Stamina/basic.md) | stamina.bar | BODY | BODY |
| initiative (Initiative/tracker.md) | init.title | BODY | BODY |
| montage (Montage/fresh.md) | montage.strip | BODY | BODY |
| feature (Feature/feature.md) | chrome.collapse (pipeline chrome) | BODY | BODY |
All five drop focus to BODY on a window-less outside redraw, in both modes. (Initiative/montage only carry focus when a window was open: SC-608/SC-650.) Elements not surveyed: display, hero/party/encounter etc. have no `control:` ids in their element dir. One Backlog ticket candidate: generalise `rememberFocus` / `handOffAfterOutsideRedraw` for every element with controls; the pinned-sidebar `update()` path would need the same per element.

## Red on base (revert `src`, run, restore)
- jest: 11 of the first 16 failed on base (OE01-OE07, OE10, OE13, OE14, OE16); OE17 = same as mutant M7 (sidebar update not capturing) red. The negatives OE08, OE09, OE11, OE12, OE15 pass on base by design (log `jest-base1.log`: "11 failed, 5 passed").
- e2e on base (log `e2e-base.log`, "2/8 ok, 6 failed"): O01, O02, O03, O05, O06, O07 red; O04, O08 (negatives) pass. O09 red with the view hand-off alone (`e2e-nego2.log` before the override: FAIL ctl null), green after.

## Mutants (jest: new file + negotiation-matrix + initiative/montage outside-edit; baseline 478 passed)
| mutant | result |
|---|---|
| M1 never hand off | 11 failed (OE01-07,10,13,14,16) |
| M2 focus-outside still handed off (never clear memory on focusout) | killed: OE12 |
| M3 skip user-moved cancel (shared file) | killed: OE09 + O11, O23, OW21 (first run survived my OE09; fixed in `2bab2763`, rerun 5 failed) |
| M4 skip count guard (shared file) | killed: OE08 + O20, O21, OW18 |
| M5 own write not skipped | killed: OE14 |
| M6 focusout clears even when card left the document | survived first (redraw helper did not let the microtask run); fixed, rerun 10 failed |
| M7 sidebar update does not capture | killed: OE17 |
| M8 sidebar update captures on own rebuild | killed: SC-639 test (negotiation-matrix "focus on another control of the card when the menu opened") |
All 8 killed after the fixes; sources restored with `git checkout -- src` after each (status clean). Logs `mut-*.log`, `mutants.out`, `mutants2.out`.

## Gates (worktree `.../worktrees/sc656-negotiation-outside-edit-focus/draw-steel-elements`)
- tsc (`npm run tsc`, incl. e2e): clean, rc 0 (`g-tsc.log`). lint: clean, rc 0 (`g-lint.log`).
- jest fresh: `Tests: 2 skipped, 13464 passed, 13466 total` (13447+17), 295 suites passed (`g-jest.log`); after shots: `1 skipped, 13465 passed` (`g-jest2.log`).
- lifecycle, seven `--only=` parts: part1 21/21, part2 16/16, part3 9/9, part4 3/4 (G-S61 FAIL "(c)... recorder's disk read was torn in 9 frames in a row", rerun alone FAIL "(a) ... torn in 3 frames", run on clean `42c26272` src FAIL "(a) ... torn in 6 frames": base-red on this host, SC-668), part5 7/7, part6 4/4, part7 3/3. Union 63/64, G-S61 base-red. No G-S147 added.
- e2e full: `OBSIDIAN-E2E done: 631/640 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` (`e2e-full.log`; 622+9). No new manifest pair.
- shots: 592 ok; host-leak 163 kinds/978; modal host-leak 40/240; `capture clip OK (147 ...)` (`shots.log`).
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical)` (`freeze.log`).
- parity (last): `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0 (`parity.log`).
- No flakes encountered (NEGO-R05, INIT-W10, G-S91, G-S115 all passed).

## Shared files touched
- `src/framework/chrome/windowHandoff.ts`: additive only (new `silent` field, `FocusMemory`, `rememberFocus`, `handOffAfterOutsideRedraw`; two `!o.silent` guards inside `act` and `noticeForNewRoot`; import of `captureControlFocus`). SC-662 adds `finishOutsideRefresh` there: expect a trivial merge.
- Not touched: `SidebarPanel.ts`, sidebar host files, `framework/view.ts`, `managedModal.ts`, initiative/montage `view.ts`.

## Drive-by fixes
None.

## Follow-ups
- Backlog: every other element with controls drops focus to BODY on a window-less outside redraw (table above); generalise the new helpers (and an `update()` capture for the pinned sidebar).
- Owner decision: Complete Argument lands on first Motivation chip after an outside redraw (button is disabled; tier choice is view-only). Alternative would be persisting the tier, out of scope.
- G-S61 base-red on this host (SC-668), pre-existing.
- LP own-save skip uses a 3 s window from the last `persist()` call (same length as the registry claim window): an outside edit within 3 s of the user's own last action gets no carry. Could be tightened with the registry's write tickets if wanted.
- Real Chromium may fire `focusout` on removal of the focused node; handled (`root.isConnected` check, OE tests dispatch it), not otherwise measured.

## Logs (all under /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc656-r1-impl/)
npmci.log, jest-new1.log, jest-base1.log, e2e-nego1.log, e2e-base.log, e2e-nego2.log, mut-*.log, mutants.out, mutants2.out, survey.log, g-tsc.log, g-lint.log, g-jest.log, g-jest2.log, lc-part1..7.log, lc-part4-rerun-s61.log, lc-s61-base.log, e2e-full.log, shots.log, freeze.log, parity.log
