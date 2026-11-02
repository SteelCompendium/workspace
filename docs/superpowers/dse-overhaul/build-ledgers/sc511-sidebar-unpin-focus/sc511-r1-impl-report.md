# SC-511 r1 implementer report

## Executive summary
- r2 (below): STATUS DONE; dse head eafe76e1 (on 423e798d, unmoved), superproject 93326c34 (rebased onto origin/main baab5315). r1 text follows, numbers measured at c37d9b49.
- STATUS: DONE. Keyboard "Unpin from sidebar" (and the degrade card's "Remove panel") hands focus to a neighbouring panel; pointer press unchanged; ring added per owner ruling.
- dse head c37d9b49 on base 423e798d (origin/develop unchanged); superproject 1420432e on c20ab3f3 (CHANGELOG bullet only; submodule pointer NOT bumped).
- Base measurement (423e798d, real Obsidian, 3 pinned panels): keyboard Unpin of middle / last / only panel -> `document.activeElement` = body in all three. Real-mouse Unpin of the middle: body (unchanged by the fix). After: middle -> note link of the panel that took its place; last -> note link of the panel above; only -> `.dse-sidebar__empty` (tabindex -1), ring shown on each.
- Gates: tsc (incl. e2e) rc 0; lint rc 0 silent; jest 6287 passed / 1 skipped / 251 of 252 suites (6272 + 15: 13 new suite + 2 kit-index, after shots); lifecycle 46/46 (21 + 16 + 9, own port 9291); e2e `128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs` (124+4, 87+2); shots 592 PNGs, 0 FAIL, button host-leak 161/966; freeze 280/280; parity 0 gaps / 0 undeclared / 24 declared (last). No gate number moved except the additions.
- Evidence crops (dark and light, ring on the next panel's note link after keyboard Unpin of the middle of 3): see paths below.
- Environment note: my first lifecycle part-1 run failed 20/21 because another session (sc472 worktree, pid 1755012) held CDP port 9262; I re-ran everything on `DSE_LIFECYCLE_PORT=9291`. The failed run's numbers are not counted.

## Commits
dse (branch sc511-sidebar-unpin-focus):
- 13507efa fix(sidebar): keyboard Unpin from sidebar / Remove panel hands focus to a neighbouring panel (SC-511)
- c37d9b49 fix(sidebar): focus ring for the sidebar note link and the empty-state message (SC-511)
superproject:
- 1420432e docs: changelog bullet for SC-511 (keyboard Unpin keeps focus in the sidebar)

## Files changed
- src/framework/pipeline.ts: Unpin item passes `isKeyboardClick(evt)`, adds `control: 'chrome.unpin'` (3 lines only; SC-540 overlap kept minimal).
- src/framework/host/BlockHost.ts, host/SidebarBlockHost.ts: `requestRemoval(keyboard?)` threaded through.
- src/framework/sidebar/SidebarPanel.ts: `onRemoveRequested(keyboard?)`; degrade "Remove panel" passes `isKeyboardClick(evt)`; `holdsFocus()`, `focusEntry()` (note link, else first focusable outside `.dse-chrome`).
- src/framework/sidebar/DseSidebarView.ts: `removePanel(panel, {keyboard})` reads focus before teardown, `handOffFocusAfterRemoval(index)`; empty state gets `tabindex="-1"`.
- src/framework/chrome/focusHandoff.ts: `focusIsFree` exported only.
- styles-source.css: `.dse-sidebar__panel-note:focus-visible` and `.dse-sidebar__empty:focus-visible` added as arms of the kit's one shared ring rule (no new ring rule/token/colour); each element re-declares `--dse-focus-ring: var(--interactive-accent, currentcolor)` on itself.
- e2e: manifest/chrome.ts (`chrome.unpin` press:Enter, click), specs/sidebar/sidebar-unpin-focus.e2e.ts (SBR-F01..F04), vaults/shipped/Sidebar/three-counters.md.
- test: test/dom/framework/sidebarUnpinFocus.test.ts (new, 13 tests), test/dom/kit/kit-index.test.ts (+2 selectors in the covered list, +2 token guards via test.each).
- CHANGELOG.md (superproject): one bullet under Unreleased.

## Design choice
Removal is synchronous (splice + removeChild + updateEmptyState), so no request/arming mechanism. Focus is read before teardown; moved right after only when keyboard AND (focus was inside the removed panel OR is body/null). Target: panel now at the removed index, else index-1, else the empty-state element. Inside a panel: header note link; fallback first focusable not inside `.dse-chrome`. All moves through `focusControl` (HANDOFF_FOCUS). Other removePanel callers (deleted file, orphan eviction) pass no flag and move nothing.

## CSS scope check (owner's request)
The shared ring rule is a plain selector list (no ancestor scope), so the two arms match in the sidebar without widening it for anything else. The real catch: `--dse-focus-ring` is declared on `:root` as `var(--interactive-accent)`, which is unresolvable there (Obsidian declares the accent on `body`), and these two elements are outside every element root, so the outline would have been invalid (the same bug the undo toast hit, SC-203 tail). Fix: each re-declares the token on itself with a `currentcolor` fallback, copied from `.dse-undo-notice__action`. Ring measured in real Obsidian (outline solid, `:focus-visible` true) on the note link and the empty state; the crops show a 2px accent ring in both dark and light. Obsidian's own link styling does not fight it (no outline/box-shadow on these nodes before).

## Real-keys test choice
e2e, not G-S63: the e2e harness can open the sidebar (script `setViewState` + `addPanel` on three fixed-anchor counters, no note writes; experimental via `dse.setPrefs`) and drive real Tab + Enter on the Unpin button. No lifecycle scenario added, so no dse-verify number change except e2e (124 -> 128, pairs 87 -> 89) and jest (6272 -> 6287, suites 250 -> 251 of 252); no proposal file written because SKILL.md numbers only need the CURRENT-block bump at landing: jest 6287/1/251 of 252, e2e 128/128 89/89.

## Red evidence
- jest (mutate, run, restore): hand-off neutralised -> 8 of 13 fail; keyboard-only guard removed -> 3 fail; focus-free/inside-panel guard removed -> 1 fail; chrome filter in `focusEntry` removed -> 1 fail (test places the chrome first in tab order); tabindex removed -> 3 fail. kit-index with styles-source.css reverted -> 3 fail.
- e2e on base 423e798d: SBR-F01/F02/F03 FAIL (received "body"), SBR-F04 ok. With the focus change but before the CSS: F01..F03 FAIL on the ring only (outline none, box-shadow none); with CSS all four ok.

## Drive-by fixes
None.

## Follow-ups
- Before this change the note link was a Tab stop with no visible focus ring anywhere; the new arm also fixes that for plain Tab use (user-visible, in the CHANGELOG sentence).
- The Unpin button lives in hover-revealed chrome; keyboard focus reveals it via focus-within (unchanged).

## Evidence artifacts (scratch: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc511-r1-impl-a1/)
- sc511-ring-crop-dark-keyboard-unpin-middle.png (requested crop, dark)
- sc511-ring-crop-light-keyboard-unpin-middle.png (light, extra)
- e2e-base.log (base measurement), e2e-fix.log / e2e-probe.log (ring-missing measurement), e2e-fix2.log (4/4 with CSS), e2e-full.log (128/128, 89/89)
- jest-full.log, jest-red1..5.log, jest-kit.log, jest-kit-red.log
- g-tsc.log, g-lint.log, shots.log (592, 161/966), freeze.log (280/280), lc1.log, lc2.log, lc3.log (21+16+9), parity.log
- e2e failure bundles from the pre-CSS run: /home/scott/code/steelCompendium/worktrees/sc511-sidebar-unpin-focus/draw-steel-elements/e2e/.out/20261102-171528-4f2b/ and .../20261102-171546-a8a7/

## r2 section (owner folds from the r1 review)
- LOW-1: CHANGELOG bullet reworded ("show a focus ring in your theme's accent colour when focused"); colour unchanged. Superproject commit amended and rebased: 93326c34 on origin/main baab5315 (rebase with autostash; HEAD's submodule pointer is still 423e798d, the worktree's dse at eafe76e1 stays an unstaged pointer change for the dispatcher).
- INFO focusHandoff.ts header: new paragraph naming the sidebar removal hand-off. dse commit eafe76e1 (comment only). origin/develop still 423e798d (no dse rebase needed).
- INFO dse-verify: proposal written to /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc511-sidebar-unpin-focus/sc511-dse-verify-proposal.md (e2e row 128/128 89/89; CURRENT block jest 6287/1/251 of 252). SKILL.md not edited.
- Gates for the delta: tsc rc 0; lint rc 0 silent; jest sidebarUnpinFocus + kit-index 96/96 (logs r2-tsc.log, r2-lint.log, r2-jest.log in the scratch dir). Full battery not re-run (comment + CHANGELOG only; dse not rebased).
