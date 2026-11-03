# SC-551 r5: scoped re-review of the r4 delta (dse `38b4f856` on develop `711f740d`)

## Executive summary

- **Verdict: LAND.** Findings: CRITICAL 0, HIGH 0, MEDIUM 0, LOW 1, INFO 2. The LOW is a rare false exit 2; it never attaches to the wrong Obsidian.
- **H-1 is fixed.**
  - Two unmodified cameras sharing one `DSE_CAMERA_TMP`: **8/8 pairs with 0 wrong-instance** (4 at 0 ms, 2 at 300 ms, 2 at 600 ms). In every pair the winner exits 0 and the loser exits 2 (`…listening socket there is not our Obsidian's…` or `Obsidian exited during start-up`).
  - Helper alone: 18 tries, never a proof for another pid's socket.
- **Rebase:** range-diff shows the r3 commits unchanged (`98502327 = 6ae6e8c7`, `5fc0fec2 = 6fe661a8`), plus one new commit `38b4f856`.
  - `711f740d` is an ancestor of the head; SC-544's G-S61 and SC-540's G-S62 (`f7c9c7ce`) are there.
  - The lifecycle diff touches only the header, the import and the start-up block. No scenario code is touched.
- **Mutation:** 9 of 10 mutants of the new socket-owner check were killed. The survivor is "accept when one of several listeners is ours" (I-1).
- **L-1, L-2, L-3:** all done. docs-shots now exits 2 for a camera environment failure (probed with a bad port and a busy port). L-1 and L-3 were confirmed by reading the code.
- **Gates at `38b4f856`:** tsc 0, lint 0, jest `Tests: 2 skipped, 6321 passed, 6323 total` / `252 of 253` (matches r4). Lifecycle part 1 on pinned port 48612: **21/21**.
- **LOW-1:** a `DSE_LIFECYCLE_BIN`/`DSE_CAMERA_BIN` that is a wrapper which does not `exec` now always exits 2, with the message "another instance owns it". It fails closed, but the message is misleading, and this is a regression from `eafe76e1`.

## Findings

### LOW

**LOW-1: a launcher wrapper that does not `exec` always fails the socket-owner proof.**

Where: `scripts/cdp-owned.mjs:197-202` (`fdLinks(child.pid)` checks the spawned pid only); used by lifecycle `:5257` and camera `spawnObsidian`.

Failure scenario:
- `DSE_LIFECYCLE_BIN` points at a script like `#!/bin/bash\n/usr/bin/obsidian "$@"` (many distro and user wrappers; also `flatpak run`, which forks).
- `child.pid` is then the shell, and the DevTools socket belongs to its child.
- Probe `wrapper-run.log`: rc 2, `port 33533: the listening socket there is not our Obsidian's (our pid 2340476) - another instance owns it`. No other instance exists.
- Control `wrapper-control.log`: the same run with `/usr/bin/obsidian` gives rc 0, 1/1.
- At `eafe76e1` and `5fc0fec2` such a wrapper worked. The r4 measurement ("socket always owned by `child.pid`") holds only for a direct binary or a symlink. Scott works on several machines.

Fix:
- Accept a LISTEN inode owned by `child.pid` **or any of its descendants**: build the ppid map from `/proc/*/stat`, the same walk as `e2e/run.mjs:258-274`, injectable like `fdLinks`. This keeps H-1 closed, because the other camera's Obsidian is not our descendant.
- In the `foreign-listener` message, name the owning pid and its `comm` when it can be found, so a wrapper case is obvious.
- Add one unit test: socket owned by a child of `child.pid` → accepted.
- Alternative: state in the helper header and the dse-verify text that `*_BIN` must be the real binary or an `exec` wrapper.

### INFO

- **I-1, one mutant survives:** turning `some → every` at `cdp-owned.mjs:202` (accept when at least one LISTEN inode on the port is ours) passes all 15 tests. No test has two listeners on one port, e.g. ours on `127.0.0.1` and another process on `[::1]`. The shipped code is the strict version, which is correct. A test is optional.
- **I-2, label in my own probe:** in `p-shared-udd.log` try 10 and `p-shared-udd-2.log` try 6, the "WRONG-INSTANCE … real listener pid 0" label is my probe's wording, not a defect.
  - The proof had passed for the run's **own** short-lived browser: its socket check matched that run's own pid. That browser then lost the single-instance handoff and closed, so `ss` found no listener at all, not someone else's.
  - A real wrong-instance would show a different non-zero pid; none did in 18 tries.
  - The camera handles this case: 2/2 pairs at 600 ms ended with the loser at exit 2.

## What I checked

- **Delta (`38b4f856`):**
  - `listenInodes` (`:109`) reads `/proc/net/tcp` and `tcp6`, filters to state `0A` and the port, and returns null if neither table can be read.
  - The socket-owner check (`:195-206`) runs before any HTTP request. It fails closed as `unverifiable` when `/proc` cannot be read or `child.pid` is undefined.
  - `servesBrowser` (`:127`) is used by camera `jsonList()` and by lifecycle `:5288` just before `Cdp.connect` (L-3).
  - Camera `:699` now throws `EnvFailure` (L-1, exit 2).
  - docs-shots `:95, :319, :359` exits 2 only when the camera's exit 2 is the sole failure (L-2), and its Xvfb `finally` is unchanged.
- **R13 text:**
  - The helper header (`:21-32`) states that the user-data-dir must belong to our child alone and that the socket-owner proof is what closes the shared-udd case.
  - Proposal §4 requires a private `DSE_CAMERA_TMP` and makes no "concurrent runs are safe" claim. §4 and §5 say "pin ports below 32768".
- **Mutation (`mutate.log`), 9 killed:**
  - R1 skip the owner check (3 tests fail)
  - R2 accept any pid (2)
  - R3 read only `tcp6` (7)
  - R4 read only `tcp` (1)
  - R5 nothing listening counts as ours (1)
  - R7 no LISTEN-state filter (1)
  - R8 fail open on unreadable `/proc` (1)
  - R9 HTTP read before the socket check (3)
  - R10 `servesBrowser` always true (1)
  - Survived: R6 (I-1).

## Runs

| What | Result |
|---|---|
| range-diff `eafe76e1..5fc0fec2` vs `711f740d..38b4f856` | r3 commits `=` (identical); +1 new commit; `711f740d` is an ancestor; G-S61 and G-S62 present |
| helper shared-udd probe, 10 tries at 0–600 ms (`p-shared-udd.log`) | 9 × winner correct + loser `foreign-listener`; 1 × both proved their own browser (I-2) |
| same, listener sampled the moment the proof resolves, 8 tries at 0–1000 ms (`p-shared-udd-2.log`) | 4 × loser `foreign-listener`, 3 × loser `exited`, 1 × own short-lived browser (I-2); 0 proofs for another pid's socket |
| two cameras, shared `DSE_CAMERA_TMP`, offsets 0 ×4 / 300 ×2 / 600 ×2 | 8/8 winner rc 0 + loser rc 2; `SUMMARY: 0 wrong-instance` in all three logs |
| L-2: docs-shots `--only=simple_feature_power_roll.png`, `DSE_CAMERA_PORT=notaport` / a listener on 48801 | rc 2 / rc 2 |
| non-exec wrapper as `DSE_LIFECYCLE_BIN`, port 0 / control `/usr/bin/obsidian` | rc 2 `foreign-listener` / rc 0 1/1 (LOW-1) |
| tsc / lint / jest (fix worktree, unmodified) | 0 / 0 / `Tests: 2 skipped, 6321 passed, 6323 total`, `Test Suites: 1 skipped, 252 passed, 252 of 253 total` |
| lifecycle part 1, `DSE_LIFECYCLE_PORT=48612` (fix worktree, unmodified) | `21/21 ok`, display :161 |

## Housekeeping

- Probes ran in a private clone of `38b4f856` under my scratch dir. The one temporary edit there (Xvfb range moved to :5440–:5454) was reverted before the clone was removed by literal path.
- Private resources: displays :5440, :5461–:5463; ports 48612 and 48801.
- The fix worktree is clean and at `38b4f856`; no commits, no edits.
- No process of mine is left running; I killed none belonging to another session. No glob `rm` was used.
- No run failed on a missing directory, so nothing was re-run as environmental.
