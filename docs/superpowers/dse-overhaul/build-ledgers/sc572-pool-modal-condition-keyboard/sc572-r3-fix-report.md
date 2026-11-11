# SC-572 r3 fix report

## Executive summary
- STATUS DONE. Head `f62e1f5e` (code `2581768f`, changelog line `f62e1f5e`) on base `97a9c93b` (origin/develop unchanged). Tree clean, not pushed, no tag.
- MEDIUM-1, LOW-1, LOW-2, LOW-3, INFO-2 all fixed in `2581768f`.
- Mutants caught: M5 any key removes (jsdom 1 fail + e2e C04/C05), M9 focus-ring line dropped (e2e C04/C05), M8 CSS reset dropped (shots `MODAL BUTTON HOST-LEAK VIOLATED`, rc 1), no focus hand-off (jsdom 2 fail + e2e C04/C05/C06). All reverted, clean tree.
- tsc (+e2e) rc 0, lint rc 0. jest 7055 passed / 1 skipped (full run: 2 SC-568 load timeouts, both suites 78/78 alone).
- lifecycle 21/21 + 16/16 + 9/9 + 4/4 + 2/2 = 52/52.
- e2e `252/262 ok, 0 failed, 10 known-bug, coverage: 163/163 pairs` (one earlier full run had RECOV-R07 fail at loadavg 27, see below).
- shots 592, rc 0; `button host-leak OK (163 … 978 …)`; `modal button host-leak OK (… 39 button kinds … 234 comparisons)`; `capture clip OK (147 …)`; all 592 PNG sha256 identical to the reviewer's clean-head set; freeze `280/280`; parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.

## Findings to commits (all `2581768f`)
- MEDIUM-1 (focus on `<body>` after keyboard removal): `src/views/MinionStaminaPoolModal.ts` click handler takes the event, records the icon's index before `container.empty()`, and when `isKeyboardClick(evt)` calls new `handOffConditionFocus`: the icon now at `min(index, n-1)`; with none left, the first enabled button/input/tabindex control that follows the row in `contentEl` (kill checkbox of a later row, else footer), else the first one in the modal. Uses `focusControl` / `isKeyboardClick` from `framework/chrome/focusHandoff`. Mouse click path unchanged. Tests: e2e POOL-C04/C05 assert `dse.focusedControl() === 'pool.condition'` and aria-label "Remove Dazed"; new POOL-C06 removes both conditions by keyboard (Enter then Space) and asserts focus is inside `.modal-container .dse-modal` and not body; POOL-C01 asserts a mouse click leaves focus off the icons; jsdom: 4 tests in `describe('focus after a removal')` (middle icon, last icon, only icon, pointer click leaves focus unchanged).
- LOW-1: POOL-C04/C05 `expectNoWrite` around `browser.keys('a')` + `ArrowRight` on the focused icon, then conditions still `['Grabbed','Dazed']` (`browser.keys`, not `dse.press`, so no `press:a` pair is recorded); jsdom `keys that are not Enter or Space leave the condition alone` (a, Delete, Backspace, ArrowRight, Tab keydown/keyup; no removal, no persist).
- LOW-2: POOL-C04/C05 assert computed `outlineStyle outlineWidth` is `solid 2px` after `tabTo`.
- LOW-3: `visual-harness/entry.ts` fight fixture: Goblin #4 gets `conditions: [{ key: bleeding, color: crimson }]` (header comment added). Modal host-leak now mounts `.condition-icon`.
- INFO-2: `conditionTitles` renamed `conditionNames` (`e2e/driver/pool.ts`, `pool-conditions.e2e.ts`).
- Manifest: `pool.condition` now `['click','press:Enter','press:Space']`, ids `C01 C04 C05 C06`.
- `f62e1f5e`: CHANGELOG bullet says focus moves to the next icon.

## Mutants (applied in place, reverted with `git checkout -- <file>`)
| Mutant | jsdom (pool suites) | e2e `--element=minion-pool` | shots |
|---|---|---|---|
| M5 keydown of any non-Tab/Enter/Space/Shift key clicks the icon | 1 failed / 166 | C04, C05 failed (33/35) | - |
| M9 `.condition-icon:focus-visible,` line removed | 166 pass (CSS) | C04, C05 failed (33/35) | - |
| no focus hand-off (call dropped) | 2 failed / 166 | C04, C05, C06 failed (32/35) | - |
| M8 whole CSS reset block removed | - | - | rc 1, `MODAL BUTTON HOST-LEAK VIOLATED`, `dark\|MinionStaminaPoolModal\|rest\|modal:(none)\|condition-icon` w 20.00 vs 24.00, boxShadow, padding `1px 6px` vs `4px 12px`, borderWidth 2px vs 0px |

## Gates (final head, measured)
- jest full: `Tests: 2 failed, 1 skipped, 7053 passed, 7056 total`; the 2 failures were `initiative-default-keys` and `twin-reuse` (Exceeded timeout 5000 ms, loadavg 24-27); `-w 2` alone: `Tests: 78 passed, 78 total`. Union 7055 passed / 1 skipped (= 7050 + 5 new jsdom tests).
- e2e: run 1 `251/262 ok, 1 failed` (RECOV-R07, stamina-bar Catch breath write count 2 vs 1, loadavg 27; unrelated to the pool modal); RECOV-R07 alone at loadavg 28: failed once; with src/e2e/test reverted to 97a9c93b: passed (1/1); back on head at loadavg ~20: passed twice; full run 2: `OBSIDIAN-E2E done: 252/262 ok, 0 failed, 10 known-bug, coverage: 163/163 pairs`.
- Montage-wheel shots gate (SC-521) did not fire this round.

## Drive-by fixes
None.

## Follow-ups
- RECOV-R07 (`e2e/specs/stamina-bar/stamina-recoveries.e2e.ts:344`, `expect(w.count).toBe(1)` got 2) failed in two consecutive runs at loadavg 27-28 and passes at loadavg ~20, so it looks load-sensitive (a second write landing inside the wait window); worth a ticket.
- dse-verify CURRENT numbers after landing: e2e `252/262`, 10 known-bug, 163/163; modal host-leak `39 button kinds … 234 comparisons`.

## Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc572-r1-impl-a917bb127a70492b5/`)
`r3-jest1.log`, `r3-jest-final.log`, `r3-jest-alone.log`, `r3-e2e-pool.log`, `r3-M5-jest.log`, `r3-M5-e2e.log`, `r3-M9-jest.log`, `r3-M9-e2e.log`, `r3-Mfocus-jest.log`, `r3-Mfocus-e2e.log`, `r3-shots-M8.log`, `r3-e2e-run1-RECOV-flake.log`, `r3-e2e-recov-BASE97a9c93b.log`, `r3-e2e-run2.log`, `r3-shots.log`, `r3-shots.sha256`, `freeze.log`, `parity.log`, `r3-lc1.log`..`r3-lc5.log`.
