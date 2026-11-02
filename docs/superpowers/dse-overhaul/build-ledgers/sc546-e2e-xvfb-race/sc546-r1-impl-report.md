# SC-546 r1 implementer report

STATUS: DONE. Branch sc546-e2e-xvfb-race (plugin worktree draw-steel-elements), base rebased to origin/develop dabfb518 (was 97284051; moved mid-task per owner message, rebased before any commit; Xvfb code untouched by the move).
Commits (on dabfb518): 07f52a75 helper+tests, 7fec3fc7 e2e, f05658f0 lifecycle, 212a0c6f docs-shots, cfb16433 READMEs. Nothing pushed/tagged.
Root cause (measured): a race LOSER started without -displayfd often does NOT exit; it stays alive holding no socket (7/12 simultaneous pairs), so the old exitCode guard never fires and the poll adopts the winner's socket.
Fix: scripts/xvfb-owned.mjs startOwnedXvfb(): spawn "Xvfb :n <caller args> -displayfd 3"; display is ours only when OUR child writes "n\n"; child exit first or timeout -> kill, next n; belt = child still running + socket exists. All three callers use it.
Measured: base e2e 7/10 real pairs shared a display (one pair showed the downstream failure: 3/86 ok, 83 failed); fixed 0/10 shared, all 20 runs 0 failed; helper stress 4 procs x 25 rounds: 0 shared, 0 leaks.
Gates at cfb16433: tsc rc0, lint rc0, jest 6267 passed / 2 skipped / 250 of 251 suites (fresh tree; = 6262+6 new tests, 1 skipped on a shots-cached tree), lifecycle 21+16+9 = 46/46, e2e 124/124 x2, main.js/styles.css byte-identical to a dabfb518 build.

## A. Measured Xvfb 21.1.24 (probe: sc546-r1-evidence/sc546-r1-probeA.log, probeA2.log, sim-*.log)
- "-displayfd 3" with explicit ":n": writes "n\n" to fd 3 once listening; latency 25-42 ms (10 sequential starts: 26,32,28,31,25,25,26,29,25,27 ms), value always exactly n.
- n already held by a live Xvfb: loser exits code 1 in 3-8 ms, writes nothing; stderr "_XSERVTransMakeAllCOTSServerListeners: server already running ... Cannot establish any listening sockets".
- "-displayfd" Xvfb creates NO /tmp/.X<n>-lock at all. Without -displayfd the lock exists: 11 bytes "   <pid>\n" (10-char right-aligned pid + newline), mode 444. So the lock-PID belt is unavailable for the fd path (belt replaced by "child alive + socket exists").
- SIGTERM: exit 0, socket (and lock if any) removed. SIGKILL: socket file LEFT BEHIND (no lock for -displayfd Xvfb); a new Xvfb starts fine on the stale socket (fd line written). Pre-check skips stale numbers anyway (existing behaviour kept).
- Truly simultaneous spawn on same :n from two processes, WITHOUT -displayfd (sim-nofd.log, 12 rounds): both Xvfb alive after 900 ms in 7/12; the "loser" listens on nothing (ground truth via /proc/net/unix). WITH -displayfd (sim-fd.log, 12 rounds): 0/12 both alive, loser exits code 1 in 3-8 ms, only the winner wrote the fd and holds both sockets (@abstract + file).
- Mixed old/new: -displayfd Xvfb on a number held by an old-style Xvfb exits 1; old-style on one held by -displayfd Xvfb exits 1 (both arbitrated by the socket bind). So SC-534-era base runners and fixed runners cannot both end up on one display.

## B. Base reproduction (97284051/dabfb518 code, temp private range :5300-:5339 + wall-clock barrier, reverted; git diff empty before C)
- Real e2e, two runners (second throwaway git worktree of the same sha), 10 pairs, --only=CTR-F01 --shards=1: SAME display in 7/10 pairs (2,3,4,6,7,8,9); sc546-r1-evidence/sc546-r1-B-pairs-summary.log + per-run logs sc546-r1-B-pair<i>-{A,B}.log.
- Downstream symptom (sc546-r1-evidence/sc546-r1-B-down-try{1..4}-{A,B}.log): A short (CTR-F01), B long (--element=stamina-bar). Tries 1-3 distinct displays (B 86/86). Try 4 both on :5300: B "done: 3/86 ok, 83 failed", rc=1 (screen disappeared when A tore down).
- Function level (verbatim startXvfb text extracted from each caller file, private range, barrier, 40 rounds each): e2e 24/40 same display (0 with a dead own Xvfb); lifecycle 40/40 same display (always picks the first free n; 16/40 returned a display whose own Xvfb had exited); docs-shots 40/40 same (14/40 own Xvfb dead). Logs sc546-r1-B-fnrace-base-{e2e,lifecycle,docs}.log. Lifecycle/docs confirm the ledger note "same race"; lifecycle is worse (no retry).

## C. Commits
- 07f52a75 test(harness): scripts/xvfb-owned.mjs + test/unit/build/xvfbOwned.test.ts (6 tests, fake sh Xvfb, node subprocess pattern like checkNoDynamicScript.test.ts). Location: scripts/ is a neutral dir both e2e/ and visual-harness/ can import (neither harness dir imports the other; scripts/ already holds repo-level .mjs used by the build).
- 7fec3fc7 fix(e2e): run.mjs startXvfb via helper; keeps xvfbPid, spawned (every spawned child pushed via onSpawn), EnvError messages, -noreset, exit-2 semantics; --headed untouched.
- f05658f0 fix(lifecycle): startXvfb via helper over displayRange(160,199); liveXvfb set in onSpawn (tracked immediately) and at the end; envFail messages; gains try-next-number.
- 212a0c6f fix(docs-shots): startXvfb via helper; preferred display first then :99-:129 (socket-only pre-check as before); returns null when no Xvfb/none confirmed; still throws the old "no free X display number" error when every number is taken; DSE_DOCS_NO_XVFB path untouched; removed now-unused spawn import.
- cfb16433 docs: e2e/README.md and visual-harness/README.md sentences.
Helper: bounds 10 s per start, 30 s overall; stdio fd3 pipe destroyed after the line.

## D. Fix proof
- Real e2e pairs on top of the fix (same temp range+barrier, reverted afterwards, git status clean), 10 pairs: 10/10 DISTINCT displays (:5300/:5301), 20/20 runs "1/1 ok, 0 failed" (sc546-r1-evidence/sc546-r1-D-pairs-summary.log). Downstream scenario (A short, B stamina-bar element) 2 tries: distinct displays, B 86/86 ok, 0 failed (sc546-r1-D-down-try{1,2}-*.log).
- Function level on the FIXED callers' own startXvfb text (e2e, lifecycle, docs-shots wrapper on private :5300+), 40 rounds each: 0 same display, 40/40 distinct, 0 dead own Xvfb (sc546-r1-D-fnrace-fixed-*.log). Docs-shots wrapper called on private display = the required one call.
- Helper stress, 4 procs x 25 rounds racing for :5300-:5339 (sc546-r1-D-stress.log): 100 displays returned, 0 rounds with a shared display, 0 without a display, every returned display's child alive with both sockets listening (/proc/net/unix), 250 Xvfb spawned (150 race losers) -> 0 leaked Xvfb procs, 0 leaked lock/socket files.

## Gates (cfb16433, logs sc546-r1-evidence/sc546-r1-gate-*.log)
- tsc (incl. -p e2e): clean, rc=0. lint (incl. e2e/): clean, rc=0 (only the existing .eslintignore warning).
- jest (rm -f main.js styles.css first): Test Suites 1 skipped, 250 passed, 250 of 251; Tests 2 skipped, 6267 passed, 6269 total. Fresh worktree w/o shots cache (2 skipped): expected 6261+6 = 6267. Consistent with owner's 6262/1/249-of-250 + 6 tests, +1 suite.
- lifecycle (DSE_LIFECYCLE_PORT=9391, 3 separate calls): part1 "start: display :163 ... 21 scenario(s)" done 21/21 ok, 0 failed; part2 display :161, 16/16; part3 display :161 (9 scenarios incl. G-S57, G-S56 last), 9/9. Union 46/46. All starts in :160-:199.
- e2e full x2: run1 "display :201 ... pointer parked at 0,0 on :201", run2 display :200; both "OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs", rc=0.
- sha256 (sc546-r1-evidence/sc546-r1-gate-sha256.log), HEAD cfb16433 vs a build of dabfb518: main.js aa4efdf671c9292c01f7f217b66b66447a3ce1b23a0ade217843dce014662fda, styles.css ae45354b6369168ebb3c80d26be6f0d665becdc3a34756d6f9e688af0a6ad5b0 on both. Identical -> shots/freeze/parity carried.

Drive-by fixes: none (removed the now-unused spawn import in docs-shots as part of the change itself).
Follow-ups:
- resolveXvfb() is copy-pasted in all three callers; could move into scripts/xvfb-owned.mjs (left out: not needed for the race, each has a different fallback message).
- docs-shots header says "default :99 (an unused one is picked)"; unchanged and still true.
- dse-verify wording proposal: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc546-e2e-xvfb-race/sc546-r1-dse-verify-proposal.md (SKILL.md not edited).
- Scratch: second throwaway worktree used for the two-runner repro was removed (git worktree remove). No Xvfb of mine left (/tmp/.X11-unix shows only others: X1, X160, X200 at the end).


## Correction (r3, 2026-11-02)
Section A's last bullet ("Mixed old/new ... cannot both end up on one display") is only half true. The two SERVERS do exclude each other (old-style on a number held by a -displayfd Xvfb exits 1, and the reverse), but an UN-REBASED lifecycle runner (dabfb518 logic: polls "socket exists", no exit-code check) still adopts a new runner's display. r2 measured old-lc vs new 16/20 shared (old-e2e vs new 0/20, new vs new 0/20). So: the guarantee holds once every worktree is on SC-546 or later; until then, rebase before running lifecycle concurrently. READMEs and the dse-verify proposal now say so.
