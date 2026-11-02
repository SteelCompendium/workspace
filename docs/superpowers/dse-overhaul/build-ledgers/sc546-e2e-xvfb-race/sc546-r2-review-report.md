# SC-546 r2 — independent review of the Xvfb ownership fix (dse `sc546-e2e-xvfb-race` @ cfb16433 on dabfb518)

**Verdict: LAND.** No BLOCKER, no IMPORTANT. 2 LOW, 5 INFO. None of them needs a code change before landing. One r1 claim is wrong (the mixed-fleet sentence, LOW-1) and needs fixing in the docs and the proposal.
- Real two-runner barrier repro on private :5340-:5379 (throwaway `git archive` trees): **base 9/10 pairs shared a display, head 0/10** (20/20 runs `1/1 ok, 0 failed`).
- Gates at cfb16433: e2e full `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` on :200, rc=0. Lifecycle part 3 `9/9 ok, 0 failed` on :162 (port 9477), rc=0.
- Every failure path ends in the right result: null, EnvError rc=2, envFail rc=2, or docs-shots' failure entry. None returns a wrong display, none hangs past 30 s, and none leaks an Xvfb, lock, socket or pipe. Node exits 5-13 ms after the helper returns.
- jest `xvfbOwned.test.ts`: 5/5 sequential + 6/6 parallel green (about 2.3 s). It needs no X server, never touches `/tmp/.X11-unix`, and leaves no temp dir or `sleep`. It is not vacuous: against the old "socket exists = mine" logic, 4 of 6 tests fail (both the e2e and the lifecycle flavour).
- Mixed fleet: the only thing that keeps two servers off one :n is the socket bind; `-displayfd` writes no lock. An **old lifecycle runner adopts a new runner's display 16/20**; an old e2e runner adopts it 0/20. The new code can't prevent this, so it needs a sentence in the docs, not a fix. r1's report says old and new runners "cannot both end up on one display". That holds for the servers but not for the runners.
- LOW-2: a signal that arrives while the helper is waiting makes it spawn the next candidate after cleanup has run. With a real Xvfb that orphan kills itself cleanly (`Cannot write display number to fd 3`), so nothing is leaked. The fix is optional.
- Working tree as found: plugin `git status --porcelain` empty before/after, HEAD cfb16433; superproject ` M draw-steel-elements` unchanged. One probe edit was made and reverted (§7).

## Findings

### LOW-1 — mixed fleet: an un-rebased lifecycle runner still adopts a new runner's display (r1 claim does not hold)
- Where: `sc546-r1-impl-report.md` §A last bullet ("SC-534-era base runners and fixed runners cannot both end up on one display"); `e2e/README.md:29-31` and `visual-harness/README.md:341-342` ("never share a display"); proposal `sc546-r1-dse-verify-proposal.md`.
- Measured (`sc546-r2-mixed.log`; each side uses its real dabfb518 / cfb16433 startXvfb logic; barrier; :5360-:5369; 20 rounds per pairing):
  - old-e2e vs new: **0/20** shared.
  - **old-lc vs new: 16/20 shared.** Every time, the old lifecycle runner adopted the display the new runner's server won (its own Xvfb was already dead: `alive=false listen=0`).
  - new vs new: 0/20. Control old-e2e vs old-lc: 11/20.
- Mechanism:
  - The servers really do exclude each other. Old-style Xvfb on a :n held by `-displayfd` exits 1 in 7 ms ("server already running"), and so does the reverse (M1/M2).
  - But the old lifecycle runner polls "socket exists" with no exit-code check (dabfb518 `obsidian-lifecycle.mjs:445-446`), so it picks up the winner's socket.
  - `-displayfd` also writes no lock file. An old runner's pre-check therefore only sees the new server once its socket appears, about 25-40 ms after spawn; an old-style lock appears within a few ms.
- Scenario: two owners start lifecycle within about 250 ms of each other, one worktree rebased onto SC-546 and one not (right now :160 and :161 are held by old-style Xvfbs from sc540 and sc544). The old run's Obsidian opens on the new run's display. Whichever run ends first takes the other's screen away, or the extra windows disturb the new run's focus and hover.
- Fix: docs only; the new code cannot stop an old runner from adopting. Add one sentence to the dse-verify proposal and the two READMEs: "Holds once every worktree is on SC-546 or later. Until then, an un-rebased lifecycle run started in the same instant can still land on a new run's display, so rebase before running lifecycle concurrently." Correct the r1 report's §A sentence the same way.

### LOW-2 — a signal during `startOwnedXvfb` makes the helper start the next candidate after cleanup has run
- Where: `scripts/xvfb-owned.mjs:56-69` (the loop keeps going after the in-flight child dies); callers `e2e/run.mjs:608-616` (`reapAll()` then `process.exit(2)`) and `visual-harness/obsidian-lifecycle.mjs:177-188` (`cleanup()` → `killProc(liveXvfb, 500)` then exit).
- Measured with a child that never writes fd 3 (`sc546-r2-orphan-lc-hang.log`, `sc546-r2-callers.log` E3, `sc546-r2-callers-LD.log` L2):
  - Cleanup SIGTERMs the in-flight child. Its `exit` resolves `ownsDisplay(false)`, and the helper spawns the next number within 2 ms (`sc546-r2-orphan-dbg.mjs`).
  - The caller exits without knowing about the new child, which is orphaned: **lifecycle 4/4, e2e 1/1**.
  - In e2e the same pattern was already in dabfb518 (old loop). In lifecycle it is new, because base lifecycle had no retry loop.
- Real impact: none measured.
  - With a real Xvfb, the orphan finds the fd-3 reader gone and exits cleanly: `(EE) Cannot write display number to fd 3`, code 1, no socket, no lock (`sc546-r2-epipe.mjs`).
  - X1/X2 in `sc546-r2-signal2.log` (real but slow-starting Xvfb, SIGTERM during start, e2e and lifecycle): 0 leftovers, 0/4 orphans (`sc546-r2-orphan-lc-slow.log`).
  - So the orphan can only live through one startup, about 30 ms, and only if the signal lands inside the ~30 ms wait window.
- Fix (optional, small): add a `shouldStop` option and check it before each spawn: `if (shouldStop?.()) break;`. Pass `() => interrupted` from e2e (it is set before `reapAll`) and `() => shuttingDownOnSignal` from lifecycle.

### INFO-1 — a spawn error (ENOENT/EACCES) is not treated as "not ours"
- Where: `scripts/xvfb-owned.mjs:60` (`child.on('error', () => {})`); `ownsDisplay` listens only for `exit`, fd data and fd error.
- Measured: `XVFB_BIN` pointing at an existing non-executable file waits 10 s per candidate, then hits the 30 s overall bound. e2e then prints `environment: no free X display in :5340-:5379`, rc=2, after 30.6 s (`sc546-r2-callers.log` E2). A missing binary takes 20 s for 2 candidates (`sc546-r2-fail.log`).
- This is not a regression: base waited 4 s × 40 = 160 s. The message is misleading, though.
- Fix (optional): `child.once('error', () => void finish(false))` inside `ownsDisplay`, and stop the loop on a spawn error so callers can say "could not execute <bin>".

### INFO-2 — the test's belt branch and wrong-number path are never exercised
- Where: `test/unit/build/xvfbOwned.test.ts:62-63` injects `hasSocket: () => true`, and the fake always writes its own `n`.
- So the `hasSocket(n) === false` branch (`xvfb-owned.mjs:87`) and the `buf !== "<n>\n"` rejection (`:96`) are never tested.
- Optional: a fake that writes `9999\n` should give "not ours, next number tried", and `hasSocket: () => false` should give null.

### INFO-3 — `-displayfd` drops the lock file, which removes the guard across network namespaces
- Measured (`sc546-r2-netns.log`): a `-displayfd` Xvfb started under `unshare -r -n` on :5366, while a live `-displayfd` holder runs in the init netns, comes up, writes `5366`, and unlinks the holder's `/tmp/.X11-unix/X5366`. On exit it removes that path; the holder keeps only its abstract socket.
- Old-style servers would have been stopped by the shared `/tmp/.X<n>-lock`.
- Theoretical today: my shell and other agents' Xvfbs all share `net:[4026531840]`, and the pre-check still skips any visible socket. Matters only if runners ever run under a sandbox that unshares the network namespace.

### INFO-4 — helper comment "the loser … stays alive"
- `xvfb-owned.mjs:9-10` matches r1's 900 ms observation (7/12 cross-process).
- My in-process near-simultaneous spawns, offset 0-40 ms, saw the plain-Xvfb loser exit in 6-48 ms with "Server is already active" (`sc546-r2-loser*.log`). So lingering depends on the lock-file timing.
- The conclusion still holds (an exit-code check cannot be relied on; base pairs were 9/10 shared). No change needed; "frequently stays alive for at least ~1 s" would be more exact.

### INFO-5 — stale numbers and :1
- A SIGKILLed `-displayfd` Xvfb leaves a socket but no lock. Both the old and new pre-checks skip that number until someone cleans it up, which is the same leak rate as old-style (lock + socket). If the pre-check is bypassed, a new start on it succeeds, old-style or new (M3/M4).
- A `-displayfd` start over a stale or live-foreign lock succeeds when the pre-check is bypassed, and it leaves the lock in place. The callers never bypass the pre-check.
- :1 can only be reached through docs-shots with an explicit `DSE_DOCS_DISPLAY=:1`, exactly as in base. Even then, `-displayfd` can't adopt Scott's server: the bind fails and the helper tries the next number.

## Probes and numbers

1. **Two-runner barrier repro** (`sc546-r2-trees.sh`, `sc546-r2-pairs.sh`):
   - Setup: two `git archive` exports per sha into scratch, node_modules symlinked, a TEMP range `[5340, 5379]` plus a wall-clock barrier in the export's `e2e/run.mjs` only (never in the branch), `--only=CTR-F01 --shards=1`.
   - dabfb518: **9/10 SHARED** (pairs 1-9 both on :5340; pair 10 distinct).
   - cfb16433: **0/10 shared** (always :5340/:5341), all 20 runs `1/1 ok, 0 failed`, rc=0.
   - Logs: `sc546-r2-{base,head}-pairs-summary.log` and `sc546-r2-{base,head}-pair<i>-{A,B}.log`. The exports were deleted afterwards (literal paths).
2. **Failure paths, helper level, real Xvfb** (`sc546-r2-fail.log`):

   | Case | Result | Time |
   |---|---|---|
   | success | :5355 | 32 ms |
   | bad arg | null (2 spawns) | 17 ms |
   | missing bin | null | 20.0 s (INFO-1) |
   | non-exec bin | null | 20.0 s (INFO-1) |
   | hang, 1.5 s/start | null | 3.0 s |
   | hang, defaults, 40 candidates | null after 3 spawns | 30.0 s (overall bound) |
   | all taken, pre-check | null, 0 spawns | 0 ms |
   | all taken, bind arbitration | null | 28 ms |
   | stale lock, dead PID | skipped, next number used | |
   | socket, no lock | skipped | |
   | lock, live foreign PID | skipped | |

   In every case: leakedKids=[], extra pipes 0, node exit 5-13 ms after return, no 53xx leftovers.
3. **Failure paths and leaks, caller level** (`sc546-r2-callers.log`, `sc546-r2-callers-LD.log`, `sc546-r2-signal2.log`):

   | Probe | Result | Leftovers |
   |---|---|---|
   | e2e, Xvfb that exits 1 | `no free X display` rc=2, 0.7 s | none |
   | e2e, EACCES | same message rc=2, 30.6 s | none |
   | e2e, SIGTERM during hang | `received SIGTERM` rc=2; hung child gone | one orphan (LOW-2) |
   | e2e, SIGINT mid-wdio | rc=2, Xvfb gone | none |
   | e2e, SIGTERM right after `pointer parked` | rc=2 | none |
   | lifecycle, Xvfb that exits 1 | `no Xvfb of our own could be started on a free display in :160–:199` rc=2, 0.3 s | none |
   | lifecycle, SIGTERM during hang | rc=2 | orphan (LOW-2) |
   | lifecycle, SIGINT mid-run on :162 | rc=2, Xvfb gone, Obsidian on 9473 gone | none |
   | docs-shots, Xvfb that exits 1 | `(obsidian shots): Xvfb unavailable` rc=1 | none |
   | docs-shots, `DSE_DOCS_DISPLAY=:5360` | `Xvfb up on :5360`, 1 shot written, rc=0 | none |

4. **Callers.**
   - e2e: `--headed` still bypasses `startXvfb` (`run.mjs:484-486`, unchanged). `xvfbPid` holds only the winner, and losers sit in `spawned`; the full gate printed no `reaped` line.
   - lifecycle: `liveXvfb` tracks the in-flight child (onSpawn) and then the winner; the gate started on :162.
   - docs-shots: preferred display first, then :99-:129. It still throws `no free X display number` when every socket exists, returns null on failure, and the `DSE_DOCS_NO_XVFB` path is untouched.
   - Ranges: :200-:239, :160-:199 and :99-:129 plus the preferred display. No caller can choose :1 unless docs-shots is given an explicit `DSE_DOCS_DISPLAY=:1` (INFO-5).
   - No other file consumes the changed envFail text (grep over skills, e2e, visual-harness, docs, test).
5. **Gates on the branch worktree (cfb16433, clean).**
   - `sc546-r2-gate-e2e.log`: `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`, display :200, `pointer parked at 0,0 on :200`, rc=0.
   - `sc546-r2-gate-lifecycle3.log` (`DSE_LIFECYCLE_PORT=9477`): `done: 9/9 ok, 0 failed`, display :162, rc=0.
6. **Mixed fleet** (`sc546-r2-mixed.log`).
   - M1: a new-style server holds :5370 (no lock). Old-style exits 1 in 7 ms and leaves no lock.
   - M2: an old-style server holds :5371 (lock `"   <pid>\n"`). New-style exits 1 in 7 ms without writing the fd.
   - M3: a SIGKILLed new-style server leaves a socket and no lock. Old-style **and** new-style both start over it directly, and both pre-checks skip it.
   - M4: a SIGKILLed old-style server leaves lock + socket. New-style starts over it and leaves the stale lock in place.
   - The new pre-check still skips numbers held by old-style servers (0 spawns in the all-taken case).
   - Race results: see LOW-1. No stale locks after any round.
7. **jest** (`sc546-r2-jest5.log`, `sc546-r2-vacuity.log`).
   - 5 sequential runs: 6/6 each, 2.2-2.5 s. 6 parallel runs: 6/6 each.
   - Afterwards: `os.tmpdir()=/tmp` holds 0 `dse-xvfb-owned-test-*` dirs, 0 `sleep 30` processes, 0 X530x sockets. The test injects `isTaken`/`hasSocket`, so it never stats `/tmp/.X11-unix`; it is safe in CI without Xvfb.
   - Vacuity: I replaced `ownsDisplay` with the old poll ("socket exists = mine", with and without the exit-code guard) in an **uncommitted probe edit of `scripts/xvfb-owned.mjs`**, reverted with `git checkout --`; status was empty afterwards. Result: **4 failed / 2 passed** both times (lost-race, stuck, null, overall-bound).
8. **r1 claims checked.**
   - Confirmed: fd line `n\n` at 25-68 ms; loser exits 1 in about 7 ms; no lock with `-displayfd`; SIGKILL leaves a socket and a new start over it works; base race reproduces; head 0 shared; e2e 124/124 and lifecycle 9/9 at HEAD.
   - Does not hold: "old and new runners cannot both end up on one display" (LOW-1).
   - Not re-measured: the jest full-suite count and the main.js/styles.css sha256 (not in my brief).

## Artifacts
- This report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc546-e2e-xvfb-race/sc546-r2-review-report.md`.
- Every probe script and log (121 files, prefix `sc546-r2-`): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc546-e2e-xvfb-race/sc546-r2-evidence/`. Originals are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r2-review/`.
