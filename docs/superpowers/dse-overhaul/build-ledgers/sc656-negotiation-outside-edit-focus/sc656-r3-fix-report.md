# SC-656 r3 fix report

## Executive summary
- STATUS DONE. dse branch `sc656-negotiation-outside-edit-focus`, head `bdab956e`, rebased onto origin/develop `bab0dbb2` (SC-652; rebase clean, no conflicts). Not pushed; superproject untouched.
- Commits on top of bab0dbb2: `babe384c` r1 fix, `f4fc8d6d` r1 e2e, `ecd5da25` r1 sidebar, `c29973be` r1 test fixes, `fae048c3` r1 docs, `39f1cc55` r3 fix + jest, `62938b83` r3 e2e, `bdab956e` r3 docs.
- All six r2 findings and Q12 folded (table below). Tests: jest +9 (OE18..OE26, OE14 rewritten, OE08/OE20 Notice asserts; file now 26 tests), e2e +7 (NEGO-O10..O16; O03 and O07 expectations changed to Complete kept).
- Red on 79a6b241: jest 5 of the new/changed (OE14, OE18, OE19, OE22, OE26); e2e 7 of 9 re-run (O03, O07, O10, O11, O13, O14, O15; O12, O16 pass on 79a6b241 by design: fallback/negatives).
- Mutants: 13 valid, all killed (H3 was a compile error, discarded and covered by H1/H2).
- Gates at bdab956e (docs-only last commit; src identical to `62938b83`): tsc/lint rc 0 · jest `1 skipped, 13633 passed` (13607+26) · lifecycle 64/64 in seven parts (G-S61 passed this time) · e2e `643/652 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` (627+16).
- Shots/freeze/parity not re-run: no CSS, no static DOM output, no kit file changed.
- Shared files: `windowHandoff.ts` (additive: 2 optional fields + 1 line in `act` + `carry` passthrough), `livePreviewFocusCarry.ts` (+6, additive export `ownSaveCarried`). None of SC-662's files touched.

## Finding -> fix -> test
| finding | fix | tests |
|---|---|---|
| HIGH-1 stale memory pulls focus into another card | view records `atChange` at the vault `modify` for its note (`focusNow()`: root connected AND focus inside, also refreshes the slot); unload uses the live `rememberFocus` memory only when the root is still connected with focus inside (Live Preview), else only `atChange` (Reading view); cleared after use; `update()` clears it; no timer | jest OE18 (scrolled-away card, modify while detached, other card at the slot: no hand-off started, focus stays on body); `redraw()` fires `modify()` first; e2e NEGO-O13 (RV), O14 (LP) long note, top card focused, scrolled to the end, outside edit to it -> `<body>` |
| MED-1 3 s own-write timer | removed `lastPersistAt`, the `persist()` override, `OWN_WRITE_WINDOW_MS`; `host/livePreviewFocusCarry.ts` adds `carried` WeakSet + exported `ownSaveCarried(root)`, set when `carryOwnSaveFocus` arms; view skips only on `ownSaveCarried(root)` | jest OE14 rewritten (real `carryOwnSaveFocus` with a fake entry -> 0 hand-offs; outside edit 500 ms after an adopted own write -> 1 hand-off, same chip); e2e NEGO-O10 (RV chip press, outside edit 500 ms later -> same chip) |
| MED-2 same/reuse disabled -> body | `NEGOTIATION_FOCUS_FALLBACKS`: `negotiation.mod.same` and `.reuse` -> `['negotiation.mod.lie', 'negotiation.appeal.motivation']` | jest OE19 (both boxes); e2e NEGO-O11 |
| LOW-1 silent guard in `noticeForNewRoot` | OE08 asserts no Notice; new OE20 (block above deleted + this one changed, host knows the block text via `lastKnownBody`, so a missing guard would show the Notice) | OE08, OE20 |
| LOW-2 sidebar `update()` fallbacks | OE21: Complete focused, tier chosen, outside edit moves the standing (tier dropped) -> first Motivation chip | OE21; e2e NEGO-O16 |
| LOW-3 `redraw()` order | focusout dispatched while connected, then `remove()`, then one microtask, then unload | `redraw()` in the jest file |
| Q12 tier carry | `NegotiationData.argumentKey()` (standing, argument fields, spent flags, motivation/pitfall names); `ArgumentView.chosenTier()` / `chooseTier()` (no-op unless selectable; remounts the roll); `NegotiationView` keeps `this.argument`; unload passes `carry {tier, key}` through `handOffAfterOutsideRedraw`; additive `WindowRootRecord.receive?` called in `act` on the claimed root before `focusSuccessor`, only while the pane's root count is unchanged; sidebar `update()` captures and re-applies on a key match before restoring focus | jest OE22 (kept, Complete enabled + focused), OE23 (EMPTY argument completed elsewhere: Patience lower -> dropped), OE24 (chip toggled; motivation spent -> dropped), OE25 (count changed -> not carried), OE26 (sidebar keeps/drops), OE05, OE21; e2e NEGO-O03/O07 (kept), O12 (dropped), O15 (sidebar kept), O16 (sidebar dropped) |

Behaviour notes: Complete Argument now keeps its tier and holds focus after an outside edit that leaves the argument and standing alone (OE05/O03/O07 expectations changed per ruling). The tier carry applies only when focus was inside the card at the change (it rides the focus hand-off), so a mouse-only user (tier rows take no focus on a pointer press) gets no tier carry in Reading view / Live Preview; the pinned sidebar path carries it regardless of focus.

## Red on 79a6b241
- jest (`jest-vs-79a6b241.log`): 5 failed / 21 passed on the 26-test file: OE14, OE18, OE19, OE22, OE26. The others pass on 79a6b241 by design: the negatives and fallbacks that old code already satisfied (OE08/OE20 Notice, OE21, OE23-OE25) and every earlier test.
- e2e (`e2e-vs-79a6b241.log`, six src files reverted to 79a6b241, restored, status clean): `2/9 ok, 7 failed`: O03, O07, O10, O11, O13, O14, O15 red; O12, O16 pass.

## Mutants (jest: negotiation-outside-edit + negotiation-matrix, 418 tests)
| mutant | killed by |
|---|---|
| H1 always use live memory at unload | OE18 |
| H2 no Live Preview live path (atChange only) | OE10 |
| MED1-skip-always | 14 tests (OE01-07, 10, 13, 14, 16, 19, 22, 23) |
| MED1-skip-never | OE14 |
| Q12 key ignores standing | OE05, OE21, OE23, OE26 |
| Q12 key ignores argument | OE24 |
| Q12 key ignores spent flags | OE24 |
| Q12 no `receive` call | OE22 |
| Q12 no count guard on the carry | OE25 |
| X6 silent guard in `noticeForNewRoot` dropped | OE20 |
| X7 sidebar `update()` without fallbacks | OE21 |
| MED-2 chains removed | OE19 |
| sidebar `update()` never re-applies the tier | OE26 |
| H3 (invalid: referenced a non-existent method, compile error) | discarded; H1 and H2 cover the guard |
Source restored after every mutant (`git checkout -- src`, status clean). Log: `mutants.out`, `mut-*.log`.

## Gates (at bab0dbb2 base; bdab956e head)
- tsc `g-tsc.log` rc 0; lint `g-lint.log` rc 0.
- jest `g-jest.log`: `Tests: 1 skipped, 13633 passed, 13634 total` (13607 base + 26), 297 suites passed.
- lifecycle seven `--only=` parts: part1 21/21, part2 16/16, part3 9/9, part4 4/4 (G-S61 green on this run; red in r1 on this host, SC-668), part5 7/7, part6 4/4, part7 3/3 = 64/64.
- e2e full `e2e-full.log`: `OBSIDIAN-E2E done: 643/652 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs`. No new manifest pair.
- Shots, freeze, parity: not re-run (no CSS or static DOM output changed; `styles-source.css`, kit, and DOM builders untouched; the only DOM-affecting change is `chooseTier` re-mounting the roll on a carried tier at runtime).
- SC-652 interplay checked: `argumentKey()` reads the model, not block text; `SidebarPanel.update` path still exercised by e2e NEGO-O09/O15/O16 (green on bab0dbb2).

## Shared files touched (hunks)
- `src/framework/chrome/windowHandoff.ts`: additive. `WindowRootRecord.receive?`; `OutsideCloseHandoff.carry?`; one line in `act` (`if (o.carry !== undefined && count unchanged) mounted.get(root)?.receive?.(o.carry)` before `focusSuccessor`); `carry` passthrough in `handOffAfterOutsideRedraw`. SC-662's `finishOutsideRefresh` is a separate export: trivial merge expected.
- `src/framework/host/livePreviewFocusCarry.ts`: +6 lines (`carried` WeakSet, exported `ownSaveCarried`, one `carried.add(root)`).
- Negotiation-only: `NegotiationView` (`view.ts`), `focusRules.ts`, `ArgumentView.ts` (+13), `src/model/NegotiationData.ts` (+16, `argumentKey()`).
- Not touched: `SidebarPanel.ts`, `SidebarBlockHost.ts`, `framework/view.ts`, `managedModal.ts`, initiative/montage `view.ts`.

## Drive-by fixes
None.

## Follow-ups
- Tier carry needs focus in the card at the change (mouse-only tier choice is not carried in Reading view / Live Preview). A focus-less carry would need a hand-off started without a focus token; not done (ruling said ride the focus hand-off).
- SC-670 (other elements): HIGH-1's trap applies (use `atChange`, never the focusin-time memory alone).
- The scratch e2e long note `Negotiation/long-top-bottom.md` is created at runtime by NEGO-O13/O14; the driver removes it with the next `openNote` (as the pinned-sidebar notes).

## Logs (/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc656-r3-impl/)
tsc1.log, tsc2.log, jest-new1.log, jest-vs-79a6b241.log, mutants.out, mut-*.log, e2e-o.log, e2e-o11.log, e2e-vs-79a6b241.log, g-tsc.log, g-lint.log, g-jest.log, lc-part1..7.log, e2e-full.log
