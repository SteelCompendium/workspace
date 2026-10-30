# SC-527 r2 impl report — COMPLETE (resumed after pause)

## Executive summary
1. STATUS: DONE. dse branch `sc527-hostleak-state-kinds` @ `369b3a3` on origin/develop `71437da` (SC-479), 2 commits (`044dd8e` b33616d cherry-pick; `369b3a3` r2 comments + 5 jest tests). Not pushed. Tree clean.
2. Superproject worktree ff'd to origin/main `3eca7d31`; only dirt ` M draw-steel-elements`; not committed.
3. tsc 0, lint 0; jest 6132 passed / 1 skipped / 247 of 248 (+5 over 6127); lifecycle 40/40 (20+20); e2e 124/124, 0 failed, 0 known-bug, 87/87.
4. shots rc 0, 592 PNGs sha256-identical to base, 0 FAIL; button 157 / 942, 34-record boundary; modal 228; input 15/176; checkbox 7/116; prose 106 [212].
5. freeze OK (280/280); parity 0 gaps / 0 undeclared / 24 declared (LAST).
6. Can-fail (wrong target) re-measured on final head: rc 1, 2 named lines per scheme; reverted. 3 jest breaks proven rc 1.
7. Drive-by fixes: none. Follow-ups: none new.

## Commits (dse)
- `044dd8e` SC-527 r1 proto (shoot.mjs +155/-2), cherry-pick of b33616d.
- `369b3a3` SC-527 r2: shoot.mjs comment block (button-sweep-only rationale, parity gates run with host sheet in, hero stepper compared since SC-513 via another node, SC-530 aria-checked gap, SC-526 ordering / self-contained block); entry.ts `galleryExtra` comment names SC-527 sections (comment only); 5 jest tests in `test/dom/visual-harness/fixtures.test.ts` (new describe "state-only kind sections for the button host-leak sweep (SC-527)", plus `fs`/`path` imports). Test pre-rebase hash was efe0f33.

## Jest tests (read SC527_* literals out of shoot.mjs source, as printTwinDeltaAllowedSet does)
1. withSc527States appends the 6 sections last after SC-512/513 extras; unique indexes for duplicate ids; capture mounts none.
2. One call site (button sweep), order in assertBtnHostLeak: withSc527States(withSc513Mounts( < reachStateKindsForSweep < mountClickRevealedForSweep < tagButtons < assertSc513Tagged < assertSc527Tagged.
3. First click target exists in each section; no reach-assertion selector matches at load.
4. The sweep's full click sequence in the real fixtures (jsdom click) reaches every asserted state.
5. SC527_EXPECT: 12 unique keys, hero stepper key absent, element prefixes are SC-527 sections.

## Jest break proofs (each reverted with git checkout; logs in scratch)
- A: negotiation click `.dse-pr__row` -> `.dse-nt__pitfall`: rc 1, 1 failed (test 4, `found: false`). `jest-break-A.log`
- B: swap `reachStateKindsForSweep` / `mountClickRevealedForSweep` call lines: rc 1, 1 failed (test 2). `jest-break-B.log`
- C: `withSc527States` prepends instead of appends: rc 1, 3 failed. `jest-break-C.log`
(Breaks A–C ran on the ed368f6 base before the rebase; tests/source unchanged by the rebase.)

## Gate results (final head 369b3a3 on 71437da)
- tsc (incl. -p e2e): rc 0 (`tsc.rc`)
- lint: rc 0 (`lint.rc`)
- jest: `Tests: 1 skipped, 6132 passed, 6133 total`; `Test Suites: 1 skipped, 247 passed, 247 of 248 total` (`jest.log`). The `findDriftedTokens` TypeErrors in the log are expected negative-path stderr.
- lifecycle: `OBSIDIAN-LIFECYCLE done: 20/20 ok, 0 failed` x2 (`lifecycle-h1.log`: G-S7a..G-S8; `lifecycle-h2.log`: G-S9a..G-S42), union 40/40.
- e2e: `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` (`e2e.log`).
  - Earlier pre-rebase run on ed368f6 head: first run `123/124 ok, 1 failed` (RECOV-R07 expected 1 received 2, stamina-recoveries spec, load average ~30 from other agents); re-run 124/124. Those runs are on the superseded base (`ed368f6-runs/`), not counted.
- shots: rc 0 (`shots.rc`), 592 PNGs, sha256 list `shots-final.sha256` diffs EMPTY vs `.../sc527-r1-abb0c6465158755e8/shots-base.sha256`. 0 FAIL lines.
  - `button host-leak OK (157 button kinds x 3 states x dark/light = 942 comparisons ...)`, "34 of those (kind,state) records sampled the node at rest..."
  - `modal button host-leak OK (... 228 comparisons ...)`; `input host-leak OK (15 input kinds ... 176 comparisons ...)`; `checkbox host-leak OK (7 ... 116 comparisons)`; `prose host-leak OK (106 bare <p> [212] + 9 <img> [18] + 7 root props [476] ...)`.
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)` (`freeze.log`).
- parity (LAST): `**0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).**`, rc 0 (`parity.log`).
- Boundary (34 = 32 focus-visible disabled + 2 hover no-hit): featureblock/feature/hero/roll/statblock `…rollbar__reset|disabled` and `…stepper__btn|disabled` (x2 each; party stepper too), `hero|dse-btn|disabled`, `montage|dse-btn.dse-btn--accent|disabled`, `montage|dse-btn.dse-btn--icon.dse-mt__board-rowact|disabled`, `montage|dse-btn|disabled`, `negotiation|dse-btn|disabled` (all x2), plus hover no-hit `initiative|dse-btn.dse-init__stamina` x2. The three new SC-527 kinds are `hero|dse-btn|disabled`, `montage|…accent|disabled`, `montage|…rowact|disabled` (28 base + 6).
- Can-fail (final head 369b3a3): `.dse-pr__row` -> `.dse-nt__pitfall`, shots rc 1 (`shots-canfail.log`, diff `canfail.diff`), reverted (git checkout; tree clean). Lines (dark, and the same for light):
  - `SC-527 negotiation: appeal to the first Motivation, mark the second spent, pick a Power Roll tier — could not click \`.dse-nt__pitfall\` #0 in the extra negotiation section (TimeoutError: locator.click: Timeout 5000ms exceeded.)`
  - `the sweep tagged no \`negotiation|dse-btn.dse-btn--accent\` button — a state reached only by a click (SC-527) would go unchecked`
  - PNGs after the probe run still identical (`shots-after-canfail.sha256` == `shots-final.sha256`).

Drive-by fixes: none. Follow-ups: none new.

## Commits (dse)
- `044dd8e` SC-527 r1 proto (shoot.mjs +155/-2), cherry-pick of b33616d.
- `369b3a3` SC-527 r2: shoot.mjs comment block (button-sweep-only rationale, parity gates run with host sheet in, hero stepper compared since SC-513 via another node, SC-530 aria-checked gap, SC-526 ordering / self-contained block); entry.ts `galleryExtra` comment names SC-527 sections (comment only); 5 jest tests in `test/dom/visual-harness/fixtures.test.ts` (new describe "state-only kind sections for the button host-leak sweep (SC-527)", plus `fs`/`path` imports). Test pre-rebase hash was efe0f33.

## Jest tests (read SC527_* literals out of shoot.mjs source, as printTwinDeltaAllowedSet does)
1. withSc527States appends the 6 sections last after SC-512/513 extras; unique indexes for duplicate ids; capture mounts none.
2. One call site (button sweep), order in assertBtnHostLeak: withSc527States(withSc513Mounts( < reachStateKindsForSweep < mountClickRevealedForSweep < tagButtons < assertSc513Tagged < assertSc527Tagged.
3. First click target exists in each section; no reach-assertion selector matches at load.
4. The sweep's full click sequence in the real fixtures (jsdom click) reaches every asserted state.
5. SC527_EXPECT: 12 unique keys, hero stepper key absent, element prefixes are SC-527 sections.

## Jest break proofs (each reverted with git checkout; logs in scratch)
- A: negotiation click `.dse-pr__row` -> `.dse-nt__pitfall`: rc 1, 1 failed (test 4, `found: false`). `jest-break-A.log`
- B: swap `reachStateKindsForSweep` / `mountClickRevealedForSweep` call lines: rc 1, 1 failed (test 2). `jest-break-B.log`
- C: `withSc527States` prepends instead of appends: rc 1, 3 failed. `jest-break-C.log`
(Breaks A–C ran on the ed368f6 base before the rebase; tests/source unchanged by the rebase.)

## Gate results (final head 369b3a3 on 71437da)
- tsc (incl. -p e2e): rc 0 (`tsc.rc`)
- lint: rc 0 (`lint.rc`)
- jest: `Tests: 1 skipped, 6132 passed, 6133 total`; `Test Suites: 1 skipped, 247 passed, 247 of 248 total` (`jest.log`). The `findDriftedTokens` TypeErrors in the log are expected negative-path stderr.
- lifecycle: `OBSIDIAN-LIFECYCLE done: 20/20 ok, 0 failed` x2 (`lifecycle-h1.log`: G-S7a..G-S8; `lifecycle-h2.log`: G-S9a..G-S42), union 40/40.
- e2e: `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` (`e2e.log`).
  - Earlier pre-rebase run on ed368f6 head: first run `123/124 ok, 1 failed` (RECOV-R07 expected 1 received 2, stamina-recoveries spec, load average ~30 from other agents); re-run 124/124. Those runs are on the superseded base (`ed368f6-runs/`), not counted.
- shots: rc 0 (`shots.rc`), 592 PNGs, sha256 list `shots-final.sha256` diffs EMPTY vs `.../sc527-r1-abb0c6465158755e8/shots-base.sha256`. 0 FAIL lines.
  - `button host-leak OK (157 button kinds x 3 states x dark/light = 942 comparisons ...)`, "34 of those (kind,state) records sampled the node at rest..."
  - `modal button host-leak OK (... 228 comparisons ...)`; `input host-leak OK (15 input kinds ... 176 comparisons ...)`; `checkbox host-leak OK (7 ... 116 comparisons)`; `prose host-leak OK (106 bare <p> [212] + 9 <img> [18] + 7 root props [476] ...)`.
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)` (`freeze.log`).
- parity (LAST): `**0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).**`, rc 0 (`parity.log`).
- Boundary (34 = 32 focus-visible disabled + 2 hover no-hit): featureblock/feature/hero/roll/statblock `…rollbar__reset|disabled` and `…stepper__btn|disabled` (x2 each; party stepper too), `hero|dse-btn|disabled`, `montage|dse-btn.dse-btn--accent|disabled`, `montage|dse-btn.dse-btn--icon.dse-mt__board-rowact|disabled`, `montage|dse-btn|disabled`, `negotiation|dse-btn|disabled` (all x2), plus hover no-hit `initiative|dse-btn.dse-init__stamina` x2. The three new SC-527 kinds are `hero|dse-btn|disabled`, `montage|…accent|disabled`, `montage|…rowact|disabled` (28 base + 6).
- Can-fail (final head 369b3a3): `.dse-pr__row` -> `.dse-nt__pitfall`, shots rc 1 (`shots-canfail.log`, diff `canfail.diff`), reverted (git checkout; tree clean). Lines (dark, and the same for light):
  - `SC-527 negotiation: appeal to the first Motivation, mark the second spent, pick a Power Roll tier — could not click \`.dse-nt__pitfall\` #0 in the extra negotiation section (TimeoutError: locator.click: Timeout 5000ms exceeded.)`
  - `the sweep tagged no \`negotiation|dse-btn.dse-btn--accent\` button — a state reached only by a click (SC-527) would go unchecked`
  - PNGs after the probe run still identical (`shots-after-canfail.sha256` == `shots-final.sha256`).

## Where I stopped / what is left
Pause arrived while shots was running; it finished (rc 0), I then only read logs and hashed PNGs (no new gate). Resume: (1) freeze `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc527-hostleak-state-kinds/draw-steel-elements/visual-harness/shots` -> expect `freeze OK (280/280 ...)`; (2) can-fail wrong-target probe once (edit then `git checkout`); (3) list the 34 boundary records from `shots.log`; (4) parity LAST (`npm run parity`) -> expect 0 GAPs / 0 undeclared / 24 DECLARED; (5) confirm superproject dirt is only ` M draw-steel-elements`.
A killed early shots run on ed368f6 (superseded by the rebase) is in `ed368f6-runs/shots-killed.log`; its processes were killed by PID (cwd in my worktree), none remain.

Drive-by fixes: none.

Follow-ups: none new (SC-530 aria-checked already filed; SC-526 popover out of scope). Note for owner: RECOV-R07 flaked once under load ~30 on ed368f6 head (passed on re-run).

## Evidence (scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc527-r2-impl/`)
`tsc.{log,rc}`, `lint.{log,rc}`, `jest.{log,rc}`, `lifecycle-h1.*`, `lifecycle-h2.*`, `lc-ids.txt`, `e2e.{log,rc}`, `shots.{log,rc}`, `shots-final.sha256`, `shots-after-canfail.sha256`, `freeze.log`, `parity.log`, `shots-canfail.log`, `canfail.diff`, `jest-break-{A,B,C}.log`, `jest-sc527.log`, `ed368f6-runs/` (superseded runs), run scripts `run-*.sh`.

---

# r4 fix round (2026-10-29)

## r4 executive summary
1. STATUS: DONE. dse `sc527-hostleak-state-kinds` @ `4f73043` on origin/develop `9be397e` (SC-518); 3 commits: `c39e314` (proto), `48f6671` (r2), `4f73043` (r4, one commit). Not pushed. Tree clean.
2. Fixes (shoot.mjs only): LOW-1 hero-entry comment (selector `[data-dse-harness-extra="hero"]` matches two sections; address by `data-dse-harness-index` / probe id); LOW-2 "(owner ruled: fold, SC-527 r1)"; INFO-1 reach check is now `page.waitForFunction` 5 s, named FAIL (same text) on timeout.
3. tsc (incl. e2e) rc 0; lint rc 0; jest 6153 passed / 1 skipped / 248 of 249 (= 6148 + 5).
4. shots rc 0, 592 PNGs identical to `shots-final.sha256`, 0 FAIL; button 157/942 with the same 34-record boundary (log lines byte-identical to r2 run); modal 228; input 15/176; checkbox 7/116; prose 106 [212]. freeze OK 280/280. parity LAST 0 gap / 0 undeclared / 24 declared.
5. Can-fail x2 (rc 1, reverted): wrong click target (named click line + "tagged no" line, dark+light); and a never-matching reach selector (exercises the new waitForFunction path: "the state was not reached: nothing in the extra hero section matches ..." dark+light).
6. Lifecycle 41/41 + e2e 124/124 CARRIED from develop 9be397e: built main.js + styles.css at 4f73043 and at clean 9be397e are byte-identical (diff touches only test/, visual-harness/): main.js sha256 `9c3f3fcc37726f563372d6f28bdf4b23841ad910b317226fd6f58071b63d2aac`, styles.css `ae45354b6369168ebb3c80d26be6f0d665becdc3a34756d6f9e688af0a6ad5b0`.
7. Superproject worktree ff'd to origin/main; only dirt ` M draw-steel-elements`. Drive-by fixes: none. Follow-ups: none.

## Evidence (scratch dir above; r4 files in `r4/`)
`tsc.*`, `lint.*`, `jest.*`, `shots.*` (r4 run; r2 runs renamed `r2-*`), `r4/shots-r4.sha256`, `freeze.*`, `parity.*`, `r4/canfail.diff` + `r4/shots-canfail-click.log`, `r4/canfail-reach.diff` + `r4/shots-canfail-reach.log`, `r4/build-{head,base}.{log,rc}`, `r4/hash-{head,base}.txt`.
