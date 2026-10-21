# SC-474 impl-r1 report

## Executive summary
- STATUS: DONE. Behaviour-only fix in ConditionsModal.ts; no CSS touched; freeze 276/276 unchanged.
- Reproduced in real Obsidian 1.14.4 on unfixed code: COND-E04 (cog) and COND-E05 (swatch) both FAIL, 2 of 2 attempts (deterministic).
- Fix: an outside primary mousedown only ARMS the close; the dropdown collapses on the document-level CAPTURE click that completes the gesture (mouseup fallback timer for a drag with no click; right/middle press still closes at once).
- Capture click keeps the old focus order (collapse + focus "+ Add" first, then the target's own handler), so SC-468 swatch focus holds.
- Gates: tsc/lint clean; jest 5343 passed / 1 skipped / 230 of 231 (5336 + 7 new); lifecycle 28/28; e2e 87/91 ok, 0 failed, 4 known-bug, 63/63 pairs; shots 572 0 FAIL; freeze 276/276; parity 0/0/24.
- dse head 8af4f9a; superproject head da932cd (dse pointer NOT bumped).

## Commits
dse (branch sc474-conditions-dropdown-click, base 3480231 = origin/develop, no rebase needed):
- cedd6b6 fix: close on click not mousedown (ConditionsModal.ts + jsdom tests)
- ab701ff e2e COND-E04/E05 + drop Escape workaround in conditions-pick-focus.e2e.ts
- 8af4f9a dse CHANGELOG.md (draw-steel-elements/CHANGELOG.md, 7.0.0 unreleased list)
superproject (/home/scott/code/steelCompendium/worktrees/sc474-conditions-dropdown-click): da932cd CHANGELOG.md Unreleased bullet.

## Reproduction (unfixed code)
- Spec e2e/specs/initiative/conditions-dropdown-click.e2e.ts. Run 1: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc474-impl-r1-k7q2/k7q2-e2e-unfixed.log; run 2: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc474-impl-r1-k7q2/k7q2-e2e-unfixed2.log.
- COND-E04 FAIL: after clicking the cog with the dropdown open, cond.swatch returned 0 elements (editor never opened).
- COND-E05 FAIL: swatch click with editor + dropdown open: "no write to Initiative/tracker.md after the action".
- Failure bundle copy: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc474-impl-r1-k7q2/k7q2-unfixed-bundle-run1/ (COND-E04, COND-E05: screenshots, DOM, events).
- After the fix both pass (log /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc474-impl-r1-k7q2/k7q2-e2e-fixed.log, 5/5 incl. COND-E01/E02/E03).

## Mechanism and why
SC-186 HIGH-2 history (git log -L): document mousedown was added in 1f298c1 instead of focusout; item picks use their own mousedown+preventDefault (no focus/blur race). The document mousedown collapsed the menu synchronously, shrinking and re-centring the modal between press and release.
New (src/views/ConditionsModal.ts, onOpen):
- document mousedown: always disarm first; if dropdown open and press is outside addWrapEl (composedPath, unchanged): button!==0 -> closeAdd() immediately (unchanged right-click behaviour); else arm.
- document click (capture): if armed -> disarm + closeAdd(). Capture so the collapse + focus-to-Add happens BEFORE the cog/swatch handler, which keeps the last word on focus (same order the old mousedown-close produced; SC-468 focus after pick unchanged). The click target is fixed at mouseup, so the DOM change cannot divert it.
- document mouseup: if armed, 0ms timer (fires only if no click followed) -> close. Handles a drag that ends with no click. Timer cleared via lifecycle.register on modal close.
- A new mousedown inside the add control drops any stale armed close.
- Mouse pick on menu item, Escape (SC-431 consumer), focusout-independence: untouched.
- activeWindow is not defined in jsdom, so the timer uses activeDocument.defaultView.
- HIGH-2 header comment and onOpen comment rewritten to describe the new mechanism.

## Tests
- test/dom/views/conditions-modal.test.ts: 1 changed + 7 new (describe "SC-474"): mousedown does not collapse / click does; cog full gesture runs handler + closes + focus on cog; swatch full gesture writes colour + focus on swatch + closes; mousedown inside never closes (even after click); right-click closes at once; drag with no click closes after timer; stale-armed close dropped by an inside press.
- Changed assertion: "SC-186 fix-round HIGH-2: outside-close is a DOCUMENT-level mousedown, not focusout" asserted close right after mousedown alone. Now dispatches mousedown+mouseup+click (title updated) because the close deliberately waits for the click.
- Pre-fix jsdom: 4 of the new tests fail; the swatch test passes pre-fix (jsdom has no layout shift) and pins non-regression of focus/write order.
- e2e: new e2e/specs/initiative/conditions-dropdown-click.e2e.ts (COND-E04 cog, COND-E05 swatch). No new manifest pairs (cond.edit click, cond.swatch click already declared).
- Workaround removed in e2e/specs/initiative/conditions-pick-focus.e2e.ts: the Escape + note at L25-26 existed ONLY to dodge this bug (SC-431 Escape stays covered by COND-E01 in conditions-escape.e2e.ts); openDazedEditor now clicks the cog with the dropdown open. COND-E02/E03 still pass.

## Gates (measured vs expected)
- tsc (incl. -p e2e): clean (/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc474-impl-r1-k7q2/k7q2-tsc.log). lint (incl. e2e): clean (/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc474-impl-r1-k7q2/k7q2-lint.log).
- jest fresh worktree (before shots): 5342 passed / 2 skipped / 230 of 231 (/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc474-impl-r1-k7q2/k7q2-jest-full.log); after shots: 5343 passed / 1 skipped / 230 of 231 (expected 5336 + 7 = 5343) (/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc474-impl-r1-k7q2/k7q2-jest-full2.log).
- lifecycle: 28/28 ok, 0 failed (DSE_LIFECYCLE_PORT=9291) (/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc474-impl-r1-k7q2/k7q2-lifecycle.log).
- e2e: OBSIDIAN-E2E done: 87/91 ok, 0 failed, 4 known-bug, coverage: 63/63 pairs (85/89 + 2 new) (/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc474-impl-r1-k7q2/k7q2-e2e-full.log).
- shots: 572 PNGs, 0 FAIL (/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc474-impl-r1-k7q2/k7q2-shots.log).
- freeze: freeze OK (276/276 ...) (/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc474-impl-r1-k7q2/k7q2-freeze.log).
- parity: 0 gap(s), 0 undeclared warning(s), 24 declared deferral(s) (/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc474-impl-r1-k7q2/k7q2-parity.log).

## Drive-by fixes
none.

## Follow-ups
- None filed. Observation: a drag that begins inside the add control and ends outside still never closes the dropdown (unchanged from before).
