# SC-505 r4 fix report

## Executive summary
- STATUS: DONE. dse `a0365a4` on origin/develop `38f94f4` (SC-500); superproject `b18b254` (CHANGELOG only, no pointer bump) on origin/main `2bb85df`, rebased without conflict. Nothing pushed.
- Commits (pre-rebase shas on 7046eb0 -> post-rebase): LOW-C `8829618` -> `88ab9fd`; LOW-D `d2941e0` -> `09f4d2a`; LOW-E `d686d97` -> `a0365a4`.
- Red evidence: LOW-C jest test red on ec354f4 (`r4-red1.log`). K9 and K10 tests red with their branch removed (`r4-mut-K9.log`, `r4-mut-K10.log`), green otherwise. LOW-E: eslint warning `77:39 obsidianmd/prefer-active-doc` before, silent after (`r4-lint-before.log`).
- Gates on a0365a4: tsc clean; lint silent (rc 0, no warning); jest 6052 passed / 1 skipped / 244 of 245; lifecycle 36/36; e2e 123/123 ok, 0 failed, 0 known-bug, coverage 87/87 pairs; shots 592 0 FAIL; freeze OK (280/280); parity 0 gaps / 0 undeclared / 24 declared.
- jest delta: 6052 passed. The owner's figures (6049 base+r4-new, or 6027 base + 25 branch tests) both land on 6052: the branch adds 25 tests over the 38f94f4 base (12 r1, 5 r2, 5 r3, 3 r4).
- e2e delta: coverage 87/87 = 82 base pairs (SC-500's manifest included) + my 5 chrome pairs; 123 tests = 114 base + 9 (CHR-F01..F09).

## Rebase onto 38f94f4 (range-diff 7046eb0..d686d97 vs 38f94f4..a0365a4)
Commits 3-7 and 9-13 are `=`. Commits 1, 2 and 8 differ only by the hand-merges below (all additive):
1. `src/framework/chrome/types.ts` (`ChromeMenuItem`): SC-500 added the same `control?: string`. Resolved to ONE field with SC-500's doc comment plus my widened `onClick: (evt?: MouseEvent) => void` (approved by the owner).
2. `src/framework/chrome/mountChrome.ts` `pushItem`: auto-merged, my line and SC-500's were identical. Final line: `{ icon: item.icon, label: item.label, variant: 'ghost', control: item.control, onClick: item.onClick },`. `iconButton` calls `opts.onClick(evt)`, so the click event reaches `item.onClick` (the Pin handler's `isKeyboardClick(evt)` still works; CHR-F04/F05/F06/F08/F09 green).
3. `test/dom/e2eCensus.test.ts`: kept all imports (`initiativeManifest`, `ResetEncounterModal`, `chromeManifest`); the initiative id set is `[...modalManifest, ...conditionsManifest, ...initiativeManifest, ...chromeIds]`.
4. `e2e/specs/_census.e2e.ts`: `ALL_IDS` is the union of bar, modal, conditions, initiative and chrome manifests.
5. `e2e/driver/dse.ts`: auto-merged. SC-500's `dse.hover(el)` equals my local `hoverBlock`, so I kept SC-500's name and replaced my two callers (`await dse.hover(root.root)`), removing `hoverBlock` and the `Scope` import from `chrome-focus.e2e.ts`. In the LOW-A commit the same spec conflicted (my `embedIndexOfFocus` helper next to the removed `hoverBlock`); kept `embedIndexOfFocus`, dropped `hoverBlock`.
No other conflicts in src/ or test/.

## Findings
- LOW-C (`focusHandoff.ts`): each request holds `ours: WeakSet<Element>` (pressed button + every button the claim focused, added before the focus call). The focusin guard keeps the request only for `ours`; its scope clause is gone. Test: "focus that jumps straight to ANOTHER block's Pin in the same pane cancels the request ..." (two blocks, one fake pane).
- LOW-D: claim now `if (!btn || doc.activeElement === btn) return;` (the `isConnected` test was dead; `focusControl` refuses a detached node). New jest tests: K9 "a Pin that wrote nothing drops the request itself" (blur to body, rebuild, no focus call) and K10 "a Pin that wrote waits only about 3 s ... a rebuild at 3.5 s does not move focus". Each goes red with its branch removed.
- LOW-E: `?? activeDocument`.

## Gate lines (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc505-r1-impl-q7x2/`)
- `g-tsc.log`, `g-lint.log` rc 0 (lint prints only the .eslintignore deprecation notice).
- `r4b-jest.log`: `Test Suites: 1 skipped, 244 passed, 244 of 245 total; Tests: 1 skipped, 6052 passed, 6053 total`.
- `r4b-lifecycle.log`: `OBSIDIAN-LIFECYCLE done: 36/36 ok, 0 failed`.
- `r4b-e2e.log`: `OBSIDIAN-E2E done: 123/123 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`.
- `r4b-shots.log` rc 0, 592 PNGs, 0 FAIL, in-run lines as before. freeze: `freeze OK (280/280 frozen print PNGs byte-identical ...)`. `r4b-parity.log`: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.

Drive-by fixes: none. Follow-ups: none.
