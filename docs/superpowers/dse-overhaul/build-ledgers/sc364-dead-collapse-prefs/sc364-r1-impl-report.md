# SC-364 round 1 — implementer report

**Executive summary**
- STATUS: DONE. Head sha: `a22300d` (dse branch sc364-dead-collapse-prefs, one commit on base develop `71ac43a`; origin/develop unchanged, no rebase). Not pushed; superproject pointer untouched.
- Deleted `resolveCollapsePrefs` (catalog.ts) and the `declaredCollapsePrefs` WeakMap + its accessor, `DeclaredCollapsePrefs` type and constructor write site (ComponentWrapper.ts); orphaned import removed.
- Gates: tsc clean; lint clean; jest 5257 passed / 1 skipped / 229 of 230 suites (= base, 0 tests deleted); lifecycle 27/27; e2e 83/87 ok, 0 failed, 4 known-bug, coverage 57/57 pairs; shots 572, 0 FAIL, pressed toggle parity OK (96 comparisons); freeze OK (276/276); parity 0 gap(s) / 0 undeclared / 24 declared.
- main.js sha256 (npm run build): base 6ae775ca1a3b72b291cc61eef1de93bd57f91e7643415e00d6a0aa53c4dcb08b ; head 42f1445cb45163749640192ef5edd3cad7d6cb8706ebf47fabeaf773955d13b0.
- Note: first jest run in the fresh worktree read 5256 passed / 2 skipped (a local-only test skips when visual-harness/dist/obsidian-app.css is absent); re-run after `npm run shots` cached it: 5257 / 1.

## Premise grep (whole plugin excl. node_modules/.git/shots/built main.js)
Pattern: resolveCollapsePrefs|declaredCollapsePrefs|CollapsePrefs. Production (src/) hits, all inside the deleted code itself:
- src/prefs/catalog.ts:23 (import), :766,:772,:777,:779 (the helper + its comments)
- src/model/ComponentWrapper.ts:15,26,39,47,54,58,59,92 (docblock, DeclaredCollapsePrefs interface, WeakMap, accessor, constructor .set)
No other src/ reader or wrapper/accessor existed; no hits in e2e/, scripts/, docs/, visual-harness/. Non-production hits (comments only): .repo-docs/architecture.md:399, test/dom/framework/pref-overrides.test.ts:7,8,428, kit-lifecycle.test.ts:59, stamina-bar.test.ts:68, and test/dom/elements/skills.test.ts:77 (accurate historical note about SC-255, left alone).

## Files changed (6, +26/-110)
- src/prefs/catalog.ts — helper + import deleted.
- src/model/ComponentWrapper.ts — side channel removed; the 40-line D4 amendment docblock replaced by a 6-line note on why fields stay concrete booleans and where declared-ness is decided now (collapsedKey.ts extractCollapseKeys).
- .repo-docs/architecture.md (~l.398) — now points at extractCollapseKeys.
- test/dom/framework/kit-lifecycle.test.ts, test/dom/elements/stamina-bar.test.ts — makeDeps() comment rewritten (framework chrome reads the descriptors, not StaminaBarView/resolveCollapsePrefs).
- test/dom/framework/pref-overrides.test.ts — header comment, describe title ("declared-ness read from the raw block keys"), and l.428 comment updated.
CHANGELOG.md: no entry (internal refactor, not user-facing; changelog is user-facing only).

## Deleted tests
None. No test called the helper or accessor directly; the pref-overrides collapse tests drive the real pipeline/chrome and stay (they still pass unchanged).

## Gate logs (all in /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc364-r1-impl-a7f3)
sc364-r1-tsc.log, sc364-r1-lint.log, sc364-r1-jest.log (first run, 5256/2 skipped), sc364-r1-jest2.log (after shots, 5257/1), sc364-r1-lifecycle.log, sc364-r1-e2e.log, sc364-r1-shots.log, sc364-r1-freeze.log, sc364-r1-parity.log, sc364-r1-buildbase.log, sc364-r1-buildhead.log, sc364-r1-mainjs-base.txt, sc364-r1-mainjs-head.txt. Run order: tsc, lint, build, jest, lifecycle, e2e, shots, freeze, jest again, parity last. Lifecycle used DSE_LIFECYCLE_PORT=9364. Button host-leak line: 112 kinds / 672 comparisons (drifted from the skill's older 114/684 figure; not related to this change, shots otherwise identical to base).

## Drive-by fixes
None.

## Follow-ups
- A fresh worktree's first `npx jest` reports 1 extra skipped test (printTwinDeltaAllowedSet local-only sheet check) until `npm run host-css`/`shots` caches visual-harness/dist/obsidian-app.css; the dse-verify "5257 passed / 1 skipped" expectation implicitly assumes the cache. Possibly worth a line in the skill.
- Button host-leak counts (112/672) differ from the skill's quoted 114/684; stale doc figure only.
