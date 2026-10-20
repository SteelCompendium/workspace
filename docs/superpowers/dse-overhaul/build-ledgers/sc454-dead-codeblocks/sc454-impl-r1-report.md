# SC-454 impl r1 report — DONE

Executive summary
- Branch sc454-dead-codeblocks, head 68e3f1e (one commit on base ab34293, which is still origin/develop). Submodule only; superproject pointer untouched.
- Deleted src/utils/CodeBlocks.ts (132 lines) and test/unit/utils/code-blocks.test.ts (103 lines; 5 tests, 2 of them test.failing).
- The one real caller (test-only) was test/dom/views/minion-stamina-pool-modal.test.ts setup() persist:true callback; per owner option (a) it now writes via vault.read -> fenceLine.replaceFenceBody(content, lineStart, lineEnd, stringifyYaml(data).trim()) -> vault.modify (helper persistBlock). CB-2/DC-6/SC-340 assertions unchanged.
- Red/green: no-op callback -> 2 failed (CB-2, DC-6); body replaced by a bogus string -> 1 failed (DC-6); original -> 70/70 green.
- Comments reworded past-tense in 12 files; .repo-docs/architecture.md row removed, rows 117/151 past tense.
- Gates: tsc/lint clean; jest 5257 passed / 1 skipped / 229 of 230 suites (5262-5); lifecycle 27/27; e2e 83/87, 0 failed, 4 known-bug, 57/57; shots 572, 0 FAIL, pressed toggle parity OK (96); freeze OK 276/276; parity 0 GAP / 0 undeclared / 24 DECLARED.
- main.js sha256 identical at base and head: 6ae775ca1a3b72b291cc61eef1de93bd57f91e7643415e00d6a0aa53c4dcb08b.

## Details
- Grep (src, test, e2e, visual-harness, scripts, esbuild/jest config, tools, docs): no import in src/, e2e/, visual-harness/ or config. Only the test import above. CHANGELOG.md:1426 hit is the unrelated word "inline-codeblocks".
- Tests removed: 5 (3 pass + 2 test.failing CB-5/CB-3), 1 suite. 5262 - 5 = 5257 passed, skipped 1, suites 230 -> 229 of 230 (231 -> 230 total).
- First full jest run in the fresh worktree read 5256 passed / 2 skipped: the SC-127 r9 LOW-C local-only test (printTwinDeltaAllowedSet.test.ts:374) skips when visual-harness/dist/obsidian-app.css is absent. After npm run shots populated dist/, a re-run read 5257 / 1 skipped. Environment, not the change.
- Red/green check was done by editing the test callback in place (original saved, restored byte-identical; git diff confirms only the intended change).
- main.js: base built from git archive ab34293 in a scratch dir (node_modules symlinked), head built in the worktree, both with node esbuild.config.mjs production; the lifecycle gate's own build at head had the same hash.
- Drive-by fixes: none. Follow-ups: test/dom/views/minion-stamina-pool-modal.test.ts persistBlock is a test-local stand-in (no vault-level helper exists in fenceLine.ts); no ticket needed. The owner's pre-grep was truncated (head -30), so it missed this caller.
- npm ci was run in the worktree (node_modules was missing); no tracked change from it.

## Evidence (all under /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc454-impl-r1/)
sc454-impl-r1-tsc.log, -lint.log, -jest.log (first run), -jest2.log (final), -lifecycle.log, -e2e.log, -shots.log, -freeze.log, -parity.log, -pool-green.log, -pool-red-noop.log, -pool-red-bogus.log, -build-base.log, -build-head.log, -mainjs-head-lifecycle.sha, -npmci.log

---
# r2 fix round — DONE, head 71ac43a (on 68e3f1e)

Summary
- LOW-1, NIT-1, NIT-2, INFO-1 folded as ruled; comment/test-assertion only, 8 files.
- INFO-1: also applied to the identical sibling at the DC-6 test (same vacuous `slice(indexOf('enemy_groups:'))` pattern, same file) — 2 asserts added, flagged so the owner can object.
- Gates: tsc/lint clean; jest 5257 passed / 1 skipped / 229 of 230 suites; lifecycle 27/27; e2e 83/87 ok, 0 failed, 4 known-bug, 57/57 pairs; main.js sha256 6ae775ca1a3b72b291cc61eef1de93bd57f91e7643415e00d6a0aa53c4dcb08b (unchanged). Shots/freeze/parity not re-run (main.js unchanged).
- Logs: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc454-impl-r2/sc454-impl-r2-{tsc,lint,jest,lifecycle,e2e,build-head}.log
