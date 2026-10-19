# SC-260 round 1 — implement report

**Executive summary**
- Verdict: DONE. Branch `sc260-noop-write` (draw-steel-elements), head `f79c0d6` (one commit on base `c78a06b`; origin/develop still `c78a06b`, no rebase). Not pushed.
- Fix: `ReadingModeBlockHost.replaceSource` now pins inside the `vault.process` callback, gated `section && changedContent`; a no-op write takes no pin. Return value / claim-ticket drop unchanged (O-1..O-3).
- Gates: tsc (incl. e2e) clean · lint clean · jest 4790 passed / 1 skipped / 227 of 228 suites (base 4787 + 3 new) · lifecycle 25/25 · e2e `63/73 ok, 0 failed, 10 known-bug, coverage: 47/47 pairs` · shots 572 PNGs, 0 FAIL · freeze `OK (276/276)` · parity 0 GAPs / 0 undeclared / 24 DECLARED.
- Red-then-green: all 3 new tests fail on the unmodified src (3 failed / 12 passed), pass with the fix (15/15).
- Note: a fresh worktree lacks `visual-harness/dist/obsidian-app.css` (gitignored); first jest gave 4789 passed / 2 skipped until `npm run host-css` was run, then 4790 / 1 skipped.

## Change
- `src/framework/host/ReadingModeBlockHost.ts`: removed the pre-`vault.process` `pin`; added `if (section && changedContent) this.scrollPin?.pin(this.containerEl);` in the callback right after `changedContent` is computed (still synchronous, before Obsidian writes). `section` capture untouched. SC-198 comment updated with the SC-260 reason.
- `PreviewScrollPin.pin` is fail-safe: `closest`, `defaultView`, then early returns, else `setProperty`/`setAttribute`/`setTimeout`; no throwing path of its own. A throw in the callback would reject `vault.process` and the existing `finally` drops the ticket (same as any callback throw).
- `test/dom/framework/previewScrollPin.test.ts` (SC-198 host describe): (a) no-op write: no pin, no PIN_ATTR, resolves true, note unchanged, 0 live tickets; (b) changing write: pin exactly once, order `process-start, pin(disk=old), callback-returns, process-done`; (c) 'miss' and 'abort' targets: no pin.
- `CHANGELOG.md`: no `## Unreleased` heading exists; the `7.0.0 (unreleased)` section carries the `[FIX]` bullets, so added one SC-260 `[FIX]` bullet at its top.

## Red evidence (test a)
Log: sc260-r1-jest-new-RED-1792430584.log — src stashed, `npx jest test/dom/framework/previewScrollPin.test.ts` -> `Tests: 3 failed, 12 passed, 15 total` (a, b, c all red; b's order is `pin, process-start, ...` on old code). Green: sc260-r1-jest-new-green-1792430584.log, 15 passed.

## O-4 (SidebarBlockHost)
No scroll pin there, so no pin cost. Observation only (not fixed): `replaceSource` sets `lastWritten = newSource` and returns `wrote = true` even when the splice is byte-identical; since no `modify` fires on a no-op, `lastWritten` is not consumed by a self-echo. Disk already equals that body, so no concrete bug found.

Drive-by fixes: none.
Follow-ups: none required.

## Logs (all in /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc260-noop-write/)
sc260-r1-tsc-1792430609.log, sc260-r1-lint-1792430609.log, sc260-r1-jest-1792430609.log (first run, 2 skipped), sc260-r1-jest2-*.log (final, 4790), sc260-r1-lifecycle-*.log, sc260-r1-e2e-*.log, sc260-r1-shots-1792431143.log, sc260-r1-freeze-1792431143.log, sc260-r1-parity-1792431143.log, rc files sc260-r1-rc*-*.log.
