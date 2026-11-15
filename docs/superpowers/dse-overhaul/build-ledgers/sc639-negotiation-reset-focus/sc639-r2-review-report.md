# SC-639 r2 independent review: Reset focus fix (dse 8ef9b641 on e1be1775)

## Executive summary

- **Verdict: LAND.** 0 BLOCKER, 0 HIGH, 0 MEDIUM, 2 LOW, 5 INFO. The LOWs are test hardening only and can ride along in the r3 rebase round.
- Real Obsidian 1.14.4, Reading view and Live Preview, Enter- and Space-opened menus: after Reset, focus is on the NEW card's options button (ring shown). It is still there at 0, 100, 300, 600, 1000, 1500 and 2500 ms after the write. Tab goes to the Patience seal (value 3) and Shift+Tab comes back. On the base, focus is on BODY and Tab starts at the top of the note.
- No pull-in and no cross-talk. Tested: page focus, editor caret (LP), focus on block B with Reset on block A (RV), identical twins in RV and LP, and focus on twin 1 with a mouse Reset on twin 0 (LP).
- Escape: no change from develop. RV keeps focus on the same button node. LP sends focus to the editor in both base and fix; that is pre-existing (INFO-1).
- Mouse path, as the owner ruled. Page focus plus mouse Reset: nothing moves. Tab-reached seal plus mouse press on the options button plus mouse Reset: the new options button, with `:focus-visible` true and a visible 2 px solid outline ring around it.
- Revert probe: with the fix reverted, jest shows 5 red (K05 and new tests 1, 2, 3, 6), or 6 red with focusRules also reverted. e2e shows F01, F05, F06, L03 and L07 red. The unconditional-restore mutant reddens jsdom tests 4 and 7 and e2e F07 and L08.
- Gates on 8ef9b641 match r1 exactly. tsc 0, lint 0; jest fresh 13335 passed / 2 skipped; e2e full `603/616 ok, 0 failed, 13 known-bug, coverage: 417/417 pairs`. Negotiation e2e 68/72 ok (4 known-bug); the 7 SC-639 e2e tests passed 3 out of 3 repeat runs.
- Scope is clean: 7 files, nothing in `NegotiationData.ts`, `ArgumentView.ts` or `src/framework/`, and Reset's semantics are unchanged. The worktree was clean before and after (`git status --porcelain` empty); HEAD is still 8ef9b641.

## Findings

### LOW-1: the owner-ruled mouse path has no real-Obsidian test

- Where: `e2e/specs/negotiation/focus.e2e.ts`, `live-preview.e2e.ts`. Only the jsdom test "focus on another control of the card when the menu opened" (`test/dom/elements/negotiation-matrix.test.ts`, SC-639 describe, test 3) covers it.
- Scenario: the ruling "focus on a card control + mouse press on the options button + mouse Reset lands on the new options button" depends on two real-Obsidian behaviours that jsdom cannot show. First, the click shield cancels `mousedown` on the options button, so the seal keeps focus while the menu opens. Second, the menu item's mousedown does not blur. The jsdom test calls `seal.focus()` and `button.click()` directly. If a future change to the click shield or the menu let the mouse press move focus, that would break the ruled behaviour without any test going red.
- Measured: the behaviour is correct today. In probes R2P-MSRV and R2P-MSLP, focus goes from the seal (value 1), through the open menu (focus still on the seal), to the new options button in RV and LP. It is stable to 2.5 s and the ring is shown.
- Fix: add NEGO-F08 (RV) and NEGO-L09 (LP). Tab or `focusByScript` to a Patience seal, `openMenu(root)`, then `chooseReset`, and expect `{ inCard: true, ctl: 'negotiation.menu' }`.

### LOW-2: nothing tests the focus ring after Reset

- Where: `src/elements/negotiation/view.ts:204` passes `ring: focusAtOpen.ring`. `focusState()` and `focusAnywhere()` (`e2e/driver/negotiation.ts`) do not read `:focus-visible`, and no jsdom test checks the ring.
- Scenario: a mutant `ring: false` (or `true`) at view.ts:204 survives every test (from reading the tests; I did not run this mutant). With `ring: false`, the mouse-from-seal path would land with no visible ring, and no test would notice. The kit's rule is that the ring follows what the old node showed (`controlFocus.ts` header).
- Fix: add a `ring` field to `focusState` / `focusAnywhere` (`a.matches(':focus-visible')`) and assert `ring: true` in NEGO-F01 and NEGO-L03, and in the LOW-1 tests if they are added.

### INFO-1: in Live Preview, Escape out of the options menu sends focus to the editor (pre-existing, not changed)

- Probe R2P-ESCLP, on both base (view.ts reverted) and fix: Enter opens the menu, then Escape. Focus is on `.cm-content` (the editor), not the options button (`sameNode: false`). In RV (R2P-ESCRV) focus stays on the same button node in both.
- Not in SC-639 scope; the fix changes nothing here. Owner: check it against SC-659 (the filed "Space-opened menu, first Escape" ticket), or file it as a Backlog ticket.

### INFO-2: a Reset chosen from a menu that stayed open across an outside edit shows the Notice but resets nothing (pre-existing)

- Probe R2P-EXTMENU, on both base and fix, Reading view, Patience at 1. Enter opens the menu, then `vault.process` changes `initial_interest` 3 to 2 while the menu is open. The card is rebuilt (old root disconnected), focus falls to BODY, and the menu stays open. ArrowDown and Enter on Reset then show the Notice "Negotiation reset to initial state" (captured on the base run), but the note still has `current_patience: 1` 1.5 s later. The item's closure is bound to the old, unloaded view.
- Focus was not pulled anywhere in either run, so the fix is not involved. Candidate Backlog ticket: close the menu, or ignore its item, once its view has unloaded.

### INFO-3: focus ring in the mouse case (the owner asked for it in words)

- R2P-SHOT: Tab-reached seal, then a mouse press on the options button, then a mouse click on Reset. The new options button matches `:focus-visible` and has a computed `outline: solid 2px`. On screen it shows as a rounded outline ring around the options button in the card's top-right corner (`r2-ring-mouse-from-seal-card.png`). It looks the same after a keyboard Reset (`r2-ring-keyboard-card.png`); the blurred control has `outline: none`. This is the kit rule: the seal showed the ring, so the landing shows it.

### INFO-4: stale state, debounce, unload: no issues

- The "was focus in the card" token is a closure local to each `onClick` (view.ts:156), so it lives only as long as that menu. R2P-LEAK: open from the keyboard, Escape, blur to BODY, then a mouse seal write, an outside edit (rebuild) and a mouse Reset from the page. Focus was BODY at every sample.
- R2P-QTRV and R2P-QTLP: Tab pressed 120 ms after choosing Reset, before the debounced write lands. Focus had already moved to the new options button at 120 ms. Tab moved it to the seal and it stayed there through the write, the RV adoption and the LP redraw. Nothing pulled it back.
- R2P-RELOAD: plugin disabled and enabled, then a keyboard Reset lands on the options button.
- No listeners are added.
- The restore sits inside the `try` before `persist()`, the same shape as `initiative/view.ts` `rebuildAndPersist`.

### INFO-5: numbers after the rebase (for the r3 round)

- Develop 2777484c is jest 13334/2 and e2e 597/612 with 15 known-bug. SC-639 adds 8 jsdom tests, 5 new e2e tests and 2 flipped markers. If nothing else lands, expect jest **13342 passed / 2 skipped** fresh and e2e **604/617 ok, 13 known-bug, 417/417 pairs**. Re-measure on the rebased head.

## Probes (real Obsidian 1.14.4, pinned; temporary spec, never committed)

The fix column is the branch head. The base column is `view.ts` checked out from e1be1775 and restored afterwards.

| Probe | Fix: focus at t = 0..2500 ms after the write | Base |
|---|---|---|
| RV Enter / RV Space | new options button, card 0, ring; Tab goes to seal 3; Shift+Tab back to the button | BODY; Tab goes to a button outside the card |
| LP Enter / LP Space | new options button, card 0, ring; Tab goes to seal 3; no tab character in the note | BODY |
| Untouched Reset, RV / LP (second Reset, no write) | options button, ring, stable | fails: focus already lost after the first Reset |
| Mouse, Tab-reached seal, RV / LP | new options button, ring | BODY |
| Mouse, page focus, RV (focus on `markdown-preview-view`) | unchanged (that div) | same |
| Two blocks RV: focus on B's button, mouse Reset on A | B's button, untouched | same |
| Two blocks RV and LP: keyboard Reset on B, then on A | lands on B, then on A | n/a |
| Twins RV 0 / 1, LP 0 / 1: keyboard Reset | lands on the same twin's button (card 0 / card 1) | BODY |
| Twins LP: focus on twin 1 seal 3, mouse Reset on twin 0 | twin 1 seal 3, untouched | same |
| LP caret in the editor (line 2, ch 2), mouse Reset | editor keeps focus, caret unchanged | same |
| Escape RV / LP | same button node / editor | same / same |

## Gates (measured on 8ef9b641)

- `npm run tsc` RC 0; `npm run lint` RC 0.
- jest fresh (build artifacts and the `obsidian-app.css` cache moved aside, then restored): `Test Suites: 1 skipped, 291 passed`; `Tests: 2 skipped, 13335 passed, 13337 total`; RC 0.
- e2e full: `OBSIDIAN-E2E done: 603/616 ok, 0 failed, 13 known-bug, coverage: 417/417 pairs`, RC 0, 77 spec files in 5:30.
- e2e `--element=negotiation`: `68/72 ok, 0 failed, 4 known-bug`.
- NEGO-F01, F05, F06, F07, L03, L07, L08 run 3 times: 7/7 each time.
- Not run: lifecycle (the diff touches no `src/framework/` file, which is the brief's condition for it) and shots/freeze/parity (no CSS or render change). r1's numbers stand for those: 64/64; 592 / 163/978 / 40/240 / 147; 280/280; 0/0/24.

## Revert probe and mutant

- `view.ts` reverted: jest negotiation suites `5 failed, 397 passed`. Red: K05; "focus is on the NEW options button…"; "the answer is taken when the menu OPENS…"; "focus on another control of the card…"; "a second Reset…".
- `view.ts` and `focusRules.ts` reverted: `6 failed`; the fallback-chain test also goes red.
- e2e with `view.ts` reverted: NEGO-F01 and F05 red (`ctl null, inCard false`), F06 red (focus lost before the second Reset), L03 and L07 red (timed out waiting for focus on the options button). F07 and L08 stay green, as guards should.
- M3, restore unconditionally (view.ts:204 without the `if`, `ring: true`): jsdom "focus on the page when the menu opened" and "a menu opened and dismissed…" red; e2e NEGO-F07 (`inCard true`) and NEGO-L08 (`inNego true`) red.
- Every revert was restored with `git checkout 8ef9b641 -- <file>` plus `git reset -q`. Status was empty after each one (status files below).

## Scope

`git diff --stat e1be1775..8ef9b641` lists 7 files: `e2e/driver/negotiation.ts`, `e2e/specs/negotiation/focus.e2e.ts`, `live-preview.e2e.ts`, `src/elements/negotiation/focusRules.ts`, `src/elements/negotiation/view.ts`, `test/dom/elements/negotiation-bugs.test.ts` and `negotiation-matrix.test.ts`. None of `NegotiationData.ts`, `ArgumentView.ts` or `src/framework/` is touched. `resetData()`, `update()` and `persist()` are unchanged and keep their order; only the hand-back is inserted between them. Turning K05 into a plain `test` follows the K03/K04 precedent in the same file.

## Evidence

All files are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc639-r2-a4a46cd240c97ef4f/`:

- Gates: `tsc.log`, `lint.log`, `jest-full.log`, `e2e-full.log`, `e2e-nego.log`, `e2e-rep1.log`, `e2e-rep2.log`, `e2e-rep3.log`.
- Revert and mutant: `rev-view.log`, `rev-both.log`, `e2e-rev.log`, `m3-jest.log`, `m3-e2e.log`, and their `*.status-during.txt` / `*.status-after.txt` files.
- Probe spec: `zz-r2probe.e2e.ts.txt`. Scripts: `probe.sh`, `e2e-only.sh`, `revert-jest.sh`, `jest-fresh.sh`, `mutant-m3.sh`, `gate.sh`, `summ.py`.
- Probe results: `probe-fix1.json` and `probe-fix1.summary.txt` (fix), `probe-base1.json` and `probe-base1.summary.txt` (base), `probe-qt.json` and `probe-qt.summary.txt` (Tab before the write), `probe-shot.json`.
- Screenshots: `r2-ring-mouse-from-seal-card.png`, `r2-ring-keyboard-card.png`, `r2-ring-none-blurred-card.png`.
