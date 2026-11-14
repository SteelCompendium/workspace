# SC-568 r1 report

## Executive summary
- DONE. dse branch `sc568-jest-load-timeouts` @ `ed4044aa`, 7 commits on `df92a3f6` (rebased from `1cc54eac` per the baseline-move message). Test setup only: 8 files, +59/-14, no `src/`/`main.ts`/CSS change, no seam added.
- Base reproduced deterministically: `taskset -c 0 npx jest -w 11` reddens base `1cc54eac` 2 of 2 (4 and 5 failures); `-c 0,1 -w 11` 1 of 1 (1 failure). Without `-w`, jest sees one core and runs in band: green, proves nothing (3 runs).
- Branch under the same contention: 3 of 3 full runs 0 failed (11817 passed / 2 skipped); quiet full jest 11817 / 2 skipped, 0 failed (+0 tests; 11794 + 23 from SC-619 = 11817).
- Fix: global `testTimeout: 30000` (top level: it is a global option, ignored inside a project entry; proved to cover `unit` and `dom`), explicit timeouts removed, 4 real-time-dependent suites moved to fake clock / hop counts, 1 cheap win (`initiative-default-keys` 51 s -> 2.6 s).
- Bundle byte-identical to a clean `df92a3f6` build: `main.js` `aed2fbaf…7cee8`, `styles.css` `18730938…f1f9`. Shots/freeze/parity carry (not run).
- Gates: tsc clean, lint clean, lifecycle 63/63 (7 parts), e2e `331/334 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`.
- Skill proposal written: `sc568-skill-proposal.md` (same dir).

## Commits (on df92a3f6)
1. `73661db2` jest.config.ts: `testTimeout: 30000`, SC-568 comment.
2. `f349ec6d` removed explicit timeouts `settings-tab` (2 x 20000) and `heroSheet` (10000), comments updated.
3. `6a8be8a5` `chromeFocusHandoff.test.ts`: fake clock (`useFakeTimers({doNotFake:['queueMicrotask','nextTick']})`) in the file `beforeEach`.
4. `f7d3950e` `initiative-outside-edit.test.ts`: fake clock; `later()` = `advanceTimersByTimeAsync`.
5. `be15c81b` `reading-mode-host-pin.test.ts`: 3 x `setTimeout(25)` -> `settleOpenRead()` (10 macrotask hops).
6. `748355b3` `initiative-default-keys.test.ts`: fake clock, `settle()` advances the debounce, `pump()` for mock-vault reads (D2(d)).
7. `ed4044aa` `reading-mode-host-crlf-hover.test.ts` (new with SC-619): same 25 ms race, same fix as 5.

## Measurements (evidence dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc568-r1-impl/`)
Base `1cc54eac` (loadavg is the host's at start; the jest runs themselves add load):
| run | loadavg start | result | file |
|---|---|---|---|
| quiet, 12 cores | 1.60 | 11794 / 2 skipped, 99 s | base-quiet.json/.log, base-quiet.analysis.txt |
| `taskset -c 0,1` (no -w, in band) | 15.54 | green, 527 s | base-c01-run1.* |
| `taskset -c 0` (no -w, in band) | 4.45 | green, 549 s | base-c0-run1.* |
| `taskset -c 0,1 -w 11` | 3.48 | 1 failed: twin-reuse SC-547 (timeout 5000 ms) | base-c01w11-run1.* |
| `taskset -c 0 -w 11` run 1 | 13.09 | 4 failed: twin-reuse SC-547 (timeout); initiative-default-keys "pool back at its parse value but the captain trio changed" (timeout); initiative-outside-edit [O22] (assertion: focus on body); reading-mode-host-pin "an outside edit elsewhere in the source note" (assertion: save false) | base-c0w11-run1.* |
| `taskset -c 0 -w 11` run 2 | 18.76 | 5 failed: the same 4 + settings-tab "preset dropdown ..." (timeout) | base-c0w11-run2.* |

chromeFocusHandoff LOW-A did not redden at base in any full run, nor in 3 runs of the suite alone with 12 CPU hogs pinned to core 0 (chf-base-hog1-3.log). Its fix is proven by mutation instead: a 1.7 s real stall between the claim and the twin rebuild fails the real-clock version (1 failed) and passes the fake-clock version (chf-mutant-base.log / chf-mutant-branch.log).

Quiet base slowest tests are sync CSS-contract tests (anchor 52.7 s, initiative CSS contract 27.9 s, hostRegrounding 25.2 s); they never time out because a sync test cannot be interrupted. Only tests that await macrotasks time out. 41 tests > 1000 ms (base-quiet.analysis.txt).

Branch (`ed4044aa`, on `df92a3f6`), `taskset -c 0 -w 11`:
| run | loadavg start | result |
|---|---|---|
| fin2-c0w11-run1 | 11.21 | 11817 passed / 2 skipped, 0 failed, 310 s |
| fin2-c0w11-run2 | 9.27 | same, 322 s |
| fin2-c0w11-run3 | 13.01 | same, 317 s |
(Earlier, before the rebase and the crlf-hover/default-keys changes: br-c0w11-run1/2 green 11794; fin-c0w11-run1 green.) The base was not re-measured at `df92a3f6`; the base repro is at `1cc54eac`.
Quiet full jest, branch: loadavg 4.62, `Test Suites: 1 skipped, 276 passed`, `Tests: 2 skipped, 11817 passed, 11819 total`, 85 s (fin2-quiet.log/.json). No shots cache.
Targeted, `taskset -c 0`, 5 runs each, all green: twin-reuse 53/53, initiative-default-keys 25/25, chromeFocusHandoff 26/26 (tgt-*.log).

## Throwaway proof that the timeout covers both projects
Throwaway `test/unit/zz/` and `test/dom/zz/` tests, each sleeping 6 s: with the fix `2 passed` (throwaway-with-fix.log); config reverted: `2 failed`, "Exceeded timeout of 5000 ms" (throwaway-without-fix.log). Deleted, not committed. `testTimeout` is read from `globalConfig` (jest-circus `jestAdapterInit.js:1866`); it must be top level.

## D2(b) explicit timeouts
Raised/removed (now inherit 30 s): `settings-tab` x2 (20000, SC-160 load-shaped), `heroSheet` 10000. Left unchanged, intentional and above 30 s: `migrationCensus` 180000, `reading-mode-host-whole-pin-sweep`/`-fuzz` 600000. `cdpOwned.test.ts` `timeout: 60000` is an `execFileSync` child timeout, not a jest timeout. No `jest.setTimeout` anywhere. No plugin doc mentions the 5 s timeout (grep of AGENTS.md, docs, README).

## D2(c) clock-independent tests
- `chromeFocusHandoff` (all 26): `Date.now()` windows `REQUEST_TTL_MS` 5000 / `SETTLE_MS` 1500 / `AFTER_RETURN_MS` 3000 now run on a frozen fake clock; the 3 tests that already advanced time keep doing it.
- `initiative-outside-edit` (26): `windowHandoff.ts` `HANDOFF_TTL_MS` 3000 / `HANDOFF_SETTLE_MS` 1500; [O22] was red at base under contention. [O26] mutation (advance 100 ms instead of SETTLE+300) turns it red, so it still asserts the window (oe-mut.log).
- `reading-mode-host-pin` (146) and `reading-mode-host-crlf-hover` (23): the mock vault's `read` takes one `setTimeout(0)` hop per `cachedRead` (`test/mocks/obsidian-core.ts:110`); `setTimeout(25)` as "the read is done" loses the race on a starved host (the 25 ms timer is due before the second hop is scheduled). Now 10 hops (count, not duration). Deterministic A/B: a mutation making every mock hop burn 30 ms of CPU fails the base version and passes the branch version (rmp-mut-base.log / rmp-mut-branch.log). Hog-only runs did not redden base (rmp-ab-*.log).
No `src/` seam was needed.

## D2(d) cheap win
`initiative-default-keys`: each case waited `PERSIST_DEBOUNCE_MS + 60` of real time three times (about 1.4 s a case). On the fake clock the suite runs in 2.6 s vs about 51 s (base-quiet). Same assertions. Needed `pump()` (advance 1 ms at a time while awaiting) for `ElementPipeline.run` and `resolveInitiativeRefs`, whose mock-vault reads need the clock to tick. Not taken (real CPU, not setup waste): `twin-reuse` SC-547 (2.6 s, 40 blocks), `fixtures`, the sync CSS-contract tests.

## Gates
- tsc clean (`npm run tsc`, rc 0), lint clean (rc 0): tsc.log, lint.log.
- Bundle: `npm run build` on branch and on a clean detached worktree of `df92a3f6`: identical. `main.js` `aed2fbafe037301c7deb18ec35629d36aacd7d1f9f6c4acb3c967c0dd757cee8`, `styles.css` `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` (build-shas.txt, build-rcs.txt). The scratch worktree was removed.
- Lifecycle 63/63, each part rc 0, 0 failed: p1 21/21, p2 16/16, p3 9/9, p4 4/4, p5 7/7 (G-S91 green first time), p6 4/4 (G-S97 green, appearance.json clean), p7 2/2 (`G-S108,G-S112`). Logs lc-p1..p7.log; loadavg at start 3.8 / 1.2 / 1.2 / 3.3 / 1.9 / 8.3 / 6.6.
- e2e: `OBSIDIAN-E2E done: 331/334 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`, rc 0, loadavg start 13.81 (e2e.log).
- Shots / freeze / parity: not run (bundle byte-identical).
- Worktree status clean after all runs (`git status --short` empty).

## Drive-by fixes:
None.

## Follow-ups:
- Other tests still use fixed real `setTimeout(N)` sleeps as "async is done" proxies (56 `new Promise(... setTimeout ...)`/`sleep`/`delay` hits across `test/`, and `Date.now()` in 10 suites such as `formSaveFocus`, `livePreviewFocusCarry`, `sidebarInitiative`, `view-adoption`, `livePreviewStateCarry`, `formSaveRedraw`). The contention runs found only the four fixed here; others may be latent. Candidate for a sweep ticket (grep `setTimeout(resolve, [0-9]`).
- `twin-reuse` SC-547 (40 same-alias blocks) takes 2.6 s of real CPU alone; the 30 s limit covers it, a cheaper fixture would be a perf-only ticket.
- dse-verify battery table row 3/4 and the "Load-sensitive" section still describe the 5 s limit: see `sc568-skill-proposal.md` (owners apply).
- The AGENTS/skill note "jest runs with default workers" hides that `taskset` makes jest run in band; the proposal records `-w 11` as required.

## Artifacts
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc568-jest-load-timeouts/sc568-r1-report.md`
- Skill proposal: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc568-jest-load-timeouts/sc568-skill-proposal.md`
- Logs/JSON/scripts: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc568-r1-impl/`
