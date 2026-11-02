# SC-546 r3 fix report

STATUS: DONE. Rebased onto dse develop eaf64ba6; old shas 9dfffa3d-era map: 07f52a75->9dfffa3d, 7fec3fc7->9d0098dc, f05658f0->ce6e122f, 212a0c6f->5a81713f, cfb16433->3ad905a9. New HEAD 4b14600d (3 new commits). Nothing pushed.
- LOW-1, INFO-4 (6df4f7c6): mixed-fleet sentence in both READMEs and the dse-verify proposal; r1 report got an appended "Correction (r3)"; helper comment says "alive for at least ~1 s ... depends on lock-file timing".
- LOW-2, INFO-1, INFO-2 (4f136318 helper+tests, 4b14600d callers): shouldStop option; spawn error => XvfbSpawnError ("could not execute <bin>: EACCES|ENOENT"), search stops; 4 new tests + the 6 old = 10.
- Gates at 4b14600d: tsc rc0, lint rc0, jest 6271 passed / 2 skipped / 250 of 251 (fresh), lifecycle 21+16+9 = 46/46, e2e 124/124 x2, sha256 main.js/styles.css identical to an eaf64ba6 build, helper stress 4x25: 0 shared, 0 leaks.

## Per finding
| Finding | Commit | Proof |
|---|---|---|
| LOW-1 docs | 6df4f7c6 (+ ledger edits, not in branch) | e2e/README.md, visual-harness/README.md, sc546-r1-dse-verify-proposal.md, sc546-r1-impl-report.md "Correction (r3)" |
| LOW-2 shouldStop | 4f136318, 4b14600d | sc546-r3-orphan.log: fake Xvfb that never writes + SIGTERM during start: e2e spawned=1 orphans=0 (rc 2); lifecycle 4 runs each spawned=1 orphans=0 (rc 2). Flags verified: e2e `interrupted` set (run.mjs signal handler) before reapAll; lifecycle `shuttingDownOnSignal` set before cleanup(). docs-shots has no signal path, passes nothing. Unit test + mutation M3. |
| INFO-1 spawn error | 4f136318, 4b14600d | sc546-r3-spawnerr.log: non-executable file and missing binary, each caller's own startXvfb text: 1-9 ms, e2e EnvError / lifecycle envFail / docs null (+ message on stderr), all naming the binary (EACCES / ENOENT). Real runs with XVFB_BIN=non-executable: e2e rc 2 "OBSIDIAN-E2E environment: could not execute <bin>: EACCES"; lifecycle rc 2, total 152 ms, same message. (A missing XVFB_BIN path is ignored by resolveXvfb and falls back to which, so that case is function-level only.) |
| INFO-2 tests | 4f136318 | sc546-r3-jest-new.log (10 passed). Mutations (sc546-r3-mutations.log), each reverts one guarded line and fails exactly 1 of 10 tests: M1 belt hasSocket dropped; M2 wrong-number check -> finish(true); M3 shouldStop check; M4 spawnError throw; M5 spawn error listener in ownsDisplay. Tree clean afterwards. |
| INFO-4 wording | 6df4f7c6 | scripts/xvfb-owned.mjs header |
| INFO-3, INFO-5 | not touched (dropped) | |

New tests: wrong number (9999) not ours, next tried; hasSocket false -> null; shouldStop stops before further spawns; unexecutable / missing bin fails fast naming it.

## Gates (4b14600d, logs in sc546-r3-evidence/)
- tsc (incl. -p e2e) rc=0; lint rc=0 (existing .eslintignore warning only).
- jest: Test Suites 1 skipped, 250 passed, 250 of 251; Tests 2 skipped, 6271 passed, 6273 total. Arithmetic: base 6262 / 1 skipped / 249 of 250 + 10 tests in xvfbOwned.test.ts (6 r1 + 4 r3) = 6272 / 1 on a shots-cached tree; this fresh tree reads one fewer passed, 2 skipped = 6271 / 2; +1 suite.
- lifecycle (DSE_LIFECYCLE_PORT=9393, three calls): "start: display :163 ... 21 scenario(s)" done 21/21 ok, 0 failed; display :162, 16/16; display :162, 9/9. Union 46/46, displays in :160-:199.
- e2e x2: both "OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs", rc=0, display :200, "pointer parked at 0,0 on :200" lines present.
- sha256 HEAD 4b14600d vs build of eaf64ba6: main.js aa4efdf671c9292c01f7f217b66b66447a3ce1b23a0ade217843dce014662fda, styles.css ae45354b6369168ebb3c80d26be6f0d665becdc3a34756d6f9e688af0a6ad5b0 on both.
- helper stress 4 procs x 25 rounds on the final helper (sc546-r3-gate-stress.log): 100 displays, 0 rounds shared, 0 without display, 242 Xvfb spawned, 0 leaked procs, 0 leaked lock/socket files.

Drive-by fixes: none.
Follow-ups: none new (resolveXvfb duplication stays dropped per ruling).
Scratch: throwaway worktree at eaf64ba6 for the sha build was removed; the worktree list shows only the real one.

## r5 (comment/docs only)
- Commit 423e798d (on 4b14600d; origin/develop still eaf64ba6): `scripts/xvfb-owned.mjs` the `Inclusive integer range` doc comment moved back above `displayRange` (INFO-A); `visual-harness/README.md` and `e2e/README.md` caveat now reads "an un-rebased lifecycle or docs-shots run ... so rebase before running either concurrently" (INFO-C; the e2e sentence also named lifecycle alone and also mentions docs-shots, so it got the same wording).
- Diff: 3 files, 4 insertions, 4 deletions. run.mjs, obsidian-lifecycle.mjs, the proposal file untouched.
- Gates: tsc rc0, lint rc0, jest xvfbOwned.test.ts 10/10, build ok; sha256 main.js aa4efdf671c9292c01f7f217b66b66447a3ce1b23a0ade217843dce014662fda, styles.css ae45354b6369168ebb3c80d26be6f0d665becdc3a34756d6f9e688af0a6ad5b0 (unchanged). Logs: sc546-r5-evidence/. No lifecycle/e2e re-run (no runtime change).
