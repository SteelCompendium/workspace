# SC-570 r2 implementer report

**Executive summary**
- STATUS: DONE. dse branch `sc570-recov-r07-double-write`, rebased onto origin/develop `e5b6f9f2` (develop moved from `79da77f8` mid-task, per the owner's message; every gate below was measured on the rebased head).
- Commits: `3d39bd24` test(stamina-bar) jest pins (3 cases) · `ce4937ef` test(stamina-bar) RECOV-R07 settle + pin. Tree clean, no probe or mutant files left.
- Red-on-base (rebased, `e5b6f9f2`, stamina-recoveries spec alone, 25 ids): lag 250 ms and CPU 12x both FAIL RECOV-R07 `Expected: 1 Received: 2` on the base spec, 25/25 with the fix.
- Jest mutants: short debounce (1 failed), click-time snapshot (3 failed), drop-while-in-flight (1 failed); real code 31/31 in the file.
- tsc (incl. e2e) rc 0, lint rc 0 · jest **7286 passed / 2 skipped** (fresh worktree, css not cached; 7283 + 3) · lifecycle **56/56** (21 + 16 + 9 + 4 + 6) · e2e **`OBSIDIAN-E2E done: 264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`** (132 s, loadavg 0.9 to 7.7).
- `main.js` sha256 `3c44cb8bf123a5699728963d2ade1cb655838f948f7ffbb504aab9075b536238`, `styles.css` sha256 `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27`, identical to a clean `e5b6f9f2` build. Shots / freeze / parity carry; not run.
- Skill proposal: `sc570-skill-proposal.md` (same dir).

## Changes
- `e2e/specs/stamina-bar/stamina-recoveries.e2e.ts` RECOV-R07: r1's prescribed change verbatim (`await dse.settle();` and `expectNoteBlock(REC, BAR).toMatchObject({ current_stamina: 12, recoveries: 4 })` before the Catch breath `waitForWrite`). Title untouched.
- `test/dom/elements/staminaRecoveries.test.ts`: new `describe('SC-570: popover steppers then Catch breath ...')` at the end, three tests, one local helper `pressSteppers(hold)` (opens the popover via the pips, dec/inc/inc, asserts 0 writes). Reuses the file's `makeDeps`, `makeHost({ replaceSource })`, `pips`, `PERSIST_DEBOUNCE_MS`. Fixture is the e2e one (12/30, 3 of 6).
  - P1: Catch breath at 399 ms: writes `[[3,22]]`.
  - P2: after the window: `[[4,12]]` then `[[4,12],[3,22]]`.
  - P3: stepper write held in flight across the Catch breath press and its write, released out of order (1 then 0): `[[4,12],[3,22]]` before and after the release (no stale re-write).
  - Each asserts the `[recoveries, current_stamina]` of every recorded write, so count and content are both pinned. P4 / P5 not added.

## Evidence
Scratch dir S = `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc570-r2-impl-x4Qm`.

Red-on-base (r1 driver probe `k7q2-driver-probe.diff` applied temporarily, then `git checkout --` of the 3 driver files; verified `git status` clean):
| Condition | Spec | Result | Log |
|---|---|---|---|
| lag 250 | base (`git show e5b6f9f2:` spec) | 24/25, RECOV-R07 FAIL Expected 1 Received 2 | `S/e2e-lag250-base.log` |
| lag 250 | fix | 25/25 | `S/e2e-lag250-fix.log` |
| cpu 12x | base | 24/25, RECOV-R07 FAIL Expected 1 Received 2 | `S/e2e-cpu12-base.log` |
| cpu 12x | fix | 25/25 | `S/e2e-cpu12-fix.log` |
Failure bundles: `S/bundle-rebased-lag250-base-RECOV-R07`, `S/bundle-lag250-base-RECOV-R07` and `S/bundle-cpu12-base-RECOV-R07` (the last two from the first run on `79da77f8`, same result; those logs are in `S/void-79da77f8/redonbase/`). Page event logs: `S/k7q2-events-*.jsonl`.

Jest mutants (on `src/framework/view.ts`, reverted by `git checkout --`; run on `79da77f8` base, view.ts is unchanged by the rebase):
- M1 persist timer `PERSIST_DEBOUNCE_MS / 4`: 1 failed (P1) `S/jest-mutant-M1-shortdebounce.log`
- M2 flush serializes the first click-time snapshot of a round: 3 failed (P1, P2, P3) `S/jest-mutant-M2-clicksnapshot.log`
- M3 flush dropped while a write is in flight: 1 failed (P3) `S/jest-mutant-M3-dropwhileinflight.log`
- Real code: `S/jest-one-real.log` 31/31.

Gates on `e5b6f9f2`-rebased head `ce4937ef`:
- tsc: `npm run tsc` (includes `-p e2e`) rc 0, `S/tsc.log` (npm banner only), `S/tsc-e2e.log` empty. lint rc 0 (`S/lint.log`, only the pre-existing .eslintignore warning). `S/static.log`.
- jest full: `Test Suites: 1 skipped, 262 passed; Tests: 2 skipped, 7286 passed, 7288 total; 52 s`, `S/jest-full.log`. css not cached (fresh worktree). Expected 7283 + 3 = 7286.
- lifecycle (five foreground parts; every `--only` id list taken from the SCENARIOS order in `obsidian-lifecycle.mjs`):
  - part 1 `G-S7a … G-S9a`: 21/21, 184 s (`S/lifecycle-part1.log`)
  - part 2 `G-S9b … G-S40`: 16/16, 324 s
  - part 3 `G-S45 … G-S64`: 9/9, 404 s
  - part 4 `G-S57 G-S62 G-S61 G-S56`: 4/4, 298 s
  - part 5 `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87`: 6/6, 347 s
  - loadavg at starts 0.8 to 8.8; no re-runs needed.
- e2e full: `OBSIDIAN-E2E done: 264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`, rc 0, 16:05:22 to 16:07:34 (132 s), loadavg 0.88 at start, 7.72 at end. `S/e2e-full.log`.
- Build identity: ran `node esbuild.config.mjs production` in the worktree and in a scratch `git worktree add --detach` of `e5b6f9f2` (node_modules symlinked), both `rm -f` of main.js/styles.css/main.css first. Hashes in `S/build-sha.txt`; identical. The scratch worktree was removed after (`git worktree remove`; `worktree list` shows only the effort worktree).

Voided (on `79da77f8`, kept for reference only): `S/void-79da77f8/` (first lifecycle 55/55 five parts, jest 7264 / 2, first red-on-base logs).

## Notes
- Foreground tool calls auto-background after 180 s in this harness (even with a 600 s timeout); I waited on each lifecycle process by pid (`tail --pid`), no polling on scratch files, and each part was its own run.
- The rebase changed no e2e driver or stamina-recoveries spec file, but the red-on-base runs were repeated on the rebased head anyway.

Drive-by fixes: none.
Follow-ups: none new. (The dse-verify CURRENT block at SKILL.md line ~1416 still mentions the old RECOV-R07 flake as history; leave as dated history.)
