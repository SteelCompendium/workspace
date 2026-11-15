# SC-662 r3 fix report (implementer I1)

**Executive summary**
- Verdict: DONE. All nine ruled findings are folded (MED-1, MED-2, LOW-1..4, INFO-1, OOS-1). Rebased onto `bab0dbb2` (SC-652 landed); one conflict, resolved so both behaviours survive.
- Final dse head `944fda6a` on `bab0dbb2`, branch `sc662-sidebar-pending-saves`, 11 commits above develop. Nothing pushed. The OOS-1 fix does not touch `pipeline.ts`, `collapsedKey.ts` or `prefOverrides.ts`.
- Full battery once, at `944fda6a`: tsc + lint clean; jest **13653 passed / 1 skipped** (shots cache; expected 13607 + 46 new); lifecycle **64/64** in seven parts (G-S61 passed this time, at load average about 16-20; it had failed twice at `5245240c` and once on base); e2e **`637/646 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs`** (+10 tests, +1 pair); shots 592, host-leak 163/978, modal host-leak 40/240, clip 147; freeze 280/280; parity 0 / 0 / 24.
- Before / after the rebase (tsc, lint, jest, e2e): before, at pre-rebase head `e0b5bc79` (`5245240c` plus r3): tsc 0, lint 0, jest 13494 / 1 skipped, e2e `632/641 ok, 0 failed, 9 known-bug, coverage: 418/418`. After at `944fda6a`: tsc 0, lint 0, jest 13653 / 1, e2e `637/646 ok, 0 failed, 9 known-bug, coverage: 418/418`.
- Red on `5245240c` for the new tests: jest 10 red (PS24, PS26, PS28, PS29, PS30, SF01 and four anchor-sweep cases: conditions, resource, tokens, surges); the other new tests are branch tests or controls (PS22, PS23, PS25, PS27, SF02), killed by mutants instead. e2e 3 of 4 changed (OE04, OE05, OE09; OE10 is the control).
- Mutants: 10 new, all killed by a named test (table below). The reviewer's surviving mutants N1, N12 and N5 are now killed.
- New pair: `cond.strip.add` x `press:Enter` (surface `conditions-strip`); coverage 417 to 418.
- Extra finding folded into OOS-1: not only conditions dropped `_dse_anchor` on its first own save; **resource, surges and tokens did too** (same one-line passthrough, fixed). Initiative, montage, negotiation, encounter, project, party, counter, stamina bar, hero already kept it (sweep over all 13).

## Fixes (file, behaviour)

- **MED-1** form Save: `BlockWriteOptions.expectBody` (`src/framework/host/BlockHost.ts`); `FormModal.save` passes `{ expectBody: this.source }` when it has no pin (`src/authoring/FormModal.ts`); `SidebarBlockHost.replaceSource` refuses when the note's block is not that body (same `lost` path: dropped-write Notice, never rate limited for a form, form stays open). Reading view ignores the option, its path is unchanged. Tests: jest `SF01`, `SF02` in `formSaveRedraw.test.ts`; `formModal.test.ts` assertion for the pin-less host now expects `{ expectBody }`; e2e `SIDE-OE09` (refused, outside edit kept, form open, Notice) and `SIDE-OE10` (elsewhere: lands).
- **MED-2** stale Undo: `ElementView.undoIsStale(model)` (`src/framework/view.ts`): when the pinned sidebar replaced the model since the toast was made, the Undo is refused with the dropped-write Notice and touches nothing; used in the four closures of `stamina-bar/view.ts` (recoveries, catch breath) and `hero/view.ts` (recoveries, catch breath). Reading view never replaces a model, so its Undo path is unchanged (its undo tests are in the green full jest run). Tests: jest `PS26` (RV-U02 shape: card shows 22/30, note unchanged, one Notice), `PS27` (edit elsewhere: Undo works), `PS30` (hero). No e2e for the toast (not reachable in the existing sidebar specs without new driver code).
- **LOW-1** focus: `control: 'cond.strip.add'` on the strip's add button (`src/elements/conditions/panel.ts`, so the hero's Conditions slot too), manifest `e2e/manifest/conditions-strip.ts` (`press:Enter`). jest `PS29`; `SIDE-OE04` now opens with a real Enter on the pinned button and asserts `focusedControl() === 'cond.strip.add'` and that it is in the sidebar. The jsdom census (`e2eCensus.test.ts`) and `_census.e2e.ts` are green with it; coverage gate Y/Y with Y = 418.
- **LOW-2**: `SidebarPanel.handleExternalChange` returns after the settle when `host.lastMountedChild !== view` (the view was forgotten by `handleAnchorLost`). I first also bailed when the panel was flagged unavailable; that broke the SC-288 race test (a still-mounted view on a flagged panel must go on to the remount), so the final condition is the view check only. Test `PS24` (the reviewer's RJ08).
- **LOW-3**: `PS22` (conditions) and `PS23` (stamina) are the reviewer's RJ03 / RJ04 (the remount branch).
- **LOW-4**: `queueExternalChange` logs `console.error('Draw Steel Elements: sidebar refresh failed', error)` instead of swallowing.
- **INFO-1**: `PS25` (away from the view's last written text and back to it: redraws each time, the next press still writes) kills N5.
- **OOS-1** `_dse_anchor`: `conditions/model.ts` (field, parse, serialize last), and the same in `resource/model.ts`, `surges/model.ts`, `tokens/model.ts`. `SidebarBlockHost.ts` needed no change. Tests: `PS28` (after Done the note keeps the anchor, the panel is live, and a window opened afterwards stays open on an outside edit elsewhere); `persistedAnchorPassthrough.test.ts` sweeps all 13 persisted elements (curated example plus an anchor goes through parse then serialize); `SIDE-OE05` extended (anchor in the note, panel not the degrade card, strip button present).

## Rebase onto `bab0dbb2` (SC-652)

- One conflict, `src/framework/sidebar/SidebarPanel.ts`, in the fast path of `handleExternalChange`. SC-652 had made `prepareModel`'s result feed `previous.setSerializer(withReservedKeys(def.serialize, ...))` right before `previous.update(model)`; my rewrite had moved the work around that point. Resolution: keep both. The reserved-key wrapper is built from the same `prepareModel` read, but applied only AFTER the view's own pending save has been settled (`nextSerializer?.()` just before `refreshFromOutside`): that save belongs to the block as it was and has to serialize with the old wrapper. `withReservedKeys` import kept.
- `montage/view.ts`, `initiative/view.ts` (SC-652 changed their `setSerializer` / disk record): auto-merged, my 5-line `ownsOutsideWindows()` hunks sit untouched next to SC-652's change. `pipeline.ts` not touched by this branch.
- Post-rebase: all SC-652 tests and mine are green in the same full jest run (13653).

## Mutants (jest: sidebarPendingSave, montage / initiative outside-edit, sidebarInitiative, sidebarBlockHost, formSaveRedraw, persistedAnchorPassthrough)

| mutant | killed by |
|---|---|
| R1 no `expectBody` guard in the host | SF01 |
| R2 the form passes no `expectBody` | SF01 |
| R3 `undoIsStale` always false | PS26, PS30 |
| R4 no bail after the settle | PS24 |
| R5 conditions serialize drops the anchor | PS28, sweep (conditions) |
| R6 no control id on the strip button | PS29 |
| R7 resource drops the anchor | sweep (heroic-resource) |
| N1 remount branch does not close windows | PS22, PS23 |
| N12 remount branch shows no Notice | PS22, PS23 |
| N5 `adoptViewBody` keeps the echo record | PS25 |

(The first run of each also showed sidebarInitiative's SC-288 LOW-2 test red: that was the over-eager bail and is fixed, see LOW-2; the final R4 run is clean except PS24.) Logs `mut-*.log`, summaries `mutants-r3-batch1.out`, `mutants.out`.

## Shared-file hunks (for SC-656)

`src/framework/chrome/windowHandoff.ts` (unchanged since r1, additive only): import line pulls `restoreControlFocus` and the `ControlFocusRules` type; new export `finishOutsideRefresh(root, closed, rules)` at the end of the file. No hunk added in r3.

`src/framework/sidebar/SidebarPanel.ts`: r1 hunks as before (imports, queued wiring, `mount()` adopt, rewritten `handleExternalChange`, `handleAnchorLost` one line) plus, in r3: (1) `handleExternalChange`: a bail `if (view && host.lastMountedChild !== view) return;` after the settle; (2) the SC-652 `withReservedKeys` serializer rebuild, applied through `nextSerializer` after the settle (rebase resolution above); (3) `queueExternalChange`'s catch now logs. Also in r3, outside `sidebar/`: `SidebarBlockHost.replaceSource` gained the `expectBody` guard and `BlockHost.ts` the option; `view.ts` gained `undoIsStale`.

## Drive-by fixes:
None beyond the three sibling anchor passthroughs (resource, surges, tokens), which are the OOS-1 sweep's own finding (same one-line fix, same files class, covered by the sweep test).

## Follow-ups:
- Undo toasts for other elements: only the stamina bar and the hero have them (checked); nothing else to do.
- The recoveries popover (pref default off) is still not exercised after an outside refresh (r1 follow-up 3).
- G-S61: green at the final head (one run, load average about 16), red at `5245240c` twice and on base once: still SC-668's flake.
- `rm` slips: I ran `rm -f` on a non-existent / already-finished marker file in the scratch dir twice (`battery.done` in r1, `mutants.done` in r3, the second of which did exist). Both were my own marker files; no other file was touched.

## Artifacts (scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc662-r1-I1/`)

- Final battery: `r3bat-*.log`, `r3bat-*.rc`, `r3battery.progress`, `r3bat-head.txt` (= `944fda6a...`).
- Pre-rebase numbers: `pre-tsc.log`, `pre-lint.log`, `pre-jest.log`, `pre-e2e.log`, `pre-head.txt`.
- Red on `5245240c`: `jest-r3red.log`, `e2e-r3red.log`.
- Mutants: `mut-R*.log`, `mut-N*.log`, `mutants-r3-batch1.out`, `mutants.out`, scripts `mut.py`, `mutants.sh`.
- e2e iteration logs: `e2e-r3a.log` .. `e2e-r3d.log`.
