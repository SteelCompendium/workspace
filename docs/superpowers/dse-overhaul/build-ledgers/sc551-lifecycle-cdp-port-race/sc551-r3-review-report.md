# SC-551 r3: independent review of the CDP ownership fix (dse `5fc0fec2` against `eafe76e1`)

## Executive summary

- **Verdict: FIX-FIRST.** Findings: CRITICAL 0, HIGH 1, MEDIUM 0, LOW 3, INFO 4.
- **The HIGH finding (H-1).** When two Obsidians share one `--user-data-dir`, the helper's proof passes for a browser the run did not start. That is the camera's default whenever two camera or docs-shots runs start within about 1 s of each other.
  - Two unmodified `5fc0fec2` cameras with the same `DSE_CAMERA_TMP` and the default port: **3/3 pairs both drove ONE Obsidian.** The loser printed `cdp: port N (reported by our obsidian pid=X, browser id verified)` even though port N belonged to the other pid. Both exited 0.
  - At helper level: 10/10 tries with start offsets of 0–600 ms.
  - R6's reason for leaving the shared user-data-dir out of scope ("a second Obsidian on the same udd … exit 2") does not hold.
  - Lifecycle is not affected: its `mkdtemp` user-data-dir is unique per run.
- **Fix for H-1:** a PID proof in the helper. The LISTEN socket on `127.0.0.1:<port>` must belong to `child.pid` (`/proc/net/tcp*` inode ↔ `/proc/<pid>/fd`). As an alternative or addition, an exclusive lock on the camera's user-data-dir.
- **What held:**
  - Base repros: lifecycle 2/2 FOREIGN; camera decoy 2/2 attached.
  - Fix repros: lifecycle pinned **12/12** one pass + one exit 2, 0 FOREIGN; default port 0 **4/4** both pass on distinct ports; camera decoy 3/3 exit 2 with 0 proxy connections; stale file planted 1/1 ignored.
- **Gates:** tsc 0, lint 0, jest `6297 passed / 2 skipped, 252 of 253`; lifecycle part 1 pinned 48611 **21/21**; G-S6b on port 0 **1/1** (port 34045). `main.js`/`styles.css` sha256 are identical to the base build.
- **Mutation:** 6 of 8 helper mutants were killed. The two survivors are the `::1` pre-check probe and `localhost` instead of `127.0.0.1` in the GUID read.

## Findings

### HIGH

**H-1: two Obsidians sharing a user-data-dir make the ownership proof accept the other process's browser.**

Where: `scripts/cdp-owned.mjs:17-27, 101-151`; `visual-harness/obsidian-camera.mjs:95-96` (default `DSE_CAMERA_TMP` → user-data-dir), `:683-696` (clear, spawn, prove).

Mechanism:
- Electron/Obsidian starts its DevTools server and writes `DevToolsActivePort` before Obsidian's single-instance check hands off to the first instance and exits (about 0.8 s, survey P6).
- With a shared user-data-dir, both Obsidians write the same file, and the last write wins.
- The loser's proof then reads the winner's port and GUID. `/json/version` on that port serves exactly that GUID, and the loser's child is still alive at the closing `dead()` check (`:149`), so the proof resolves.
- The camera's `jsonList()` GUID gate (`:557-563`) then lets through the winner's targets, so the loser connects, evaluates, and (at `:2198`) would `app.quit()` the other Obsidian.

Evidence:
- `sc551-r3-evidence/p-two-cameras.log`: 3/3 pairs, two unmodified cameras, shared `DSE_CAMERA_TMP`, port 0. Each pair has one run with `WRONG-INSTANCE (port N is owned by pid P, ours is Q)`, while that run itself printed `cdp: port N (reported by our obsidian pid=Q, browser id verified)`. Both attached, both rc 0 (a false pass).
- `p-shared-udd.log`: helper only, real Obsidians, `ss -ltnp` used to find the real listener. 10/10 wrong at offsets 0/0/50/100/150/200/250/300/400/600 ms.
- `p-shared-udd-late.log`: at offsets of 1/2/5/10 s the second run proves its own short-lived browser (correct). The "WRONG" label in that log is the probe reading the listener after that browser had already exited. The second camera then fails on `obsidian exited before CDP came up`, which is exit 1, not 2 (see L-1).

How it happens for real: two agents run `npm run obsidian-shots` and/or `npm run docs-shots` (docs-shots never sets `DSE_CAMERA_TMP`) and their spawns land within about 1 s of each other. This is the original SC-551 harm (CDP commands in a foreign Obsidian), on the default configuration. The run's log claims the port was "reported by our obsidian" and the run exits 0.

Prescribed fix (a): in the helper, prove ownership by PID rather than by a file anyone sharing the user-data-dir can write.
- After the report, find the `LISTEN` (`st 0A`) entry for local port `report.port` in `/proc/net/tcp` (and `tcp6`), take its inode, and require `socket:[inode]` among the `readlink`s of `/proc/<child.pid>/fd/*`.
- If not, throw `CdpOwnershipError('foreign-listener', …)`, which is exit 2.
- Keep the GUID check.
- It is feasible: in every probe try, the `ss -ltnp` owner of the DevTools socket was exactly the spawned pid.
- Make it injectable like `readFile`/`fetchImpl`, and add a unit test: report written, served GUID matches, socket owned by another pid → rejected.

Fix (b), as an alternative or addition: an exclusive camera user-data-dir lock (`mkdirSync(udd + '.lock')` holding a pid file; treat it as stale if that pid is dead). A second camera would then exit 2 with `user-data-dir … in use by pid N — set DSE_CAMERA_TMP`. This also closes SC-554's `seedUdd()` clobbering.

Either way:
- Correct the helper header, which says the endpoint is ours "exactly when" (1)+(2). The real precondition is that the user-data-dir is exclusive to the child.
- Correct dse-verify proposal §4, "concurrent camera runs cannot attach to each other's Obsidian". It is false without a private `DSE_CAMERA_TMP`.

### LOW

**L-1: a camera whose Obsidian exits after the proof exits 1, not 2.**

Where: `visual-harness/obsidian-camera.mjs:700` (the `!child.alive` throw is a plain `Error`).

Failure scenario: a second camera on a shared user-data-dir started ≥1 s later (`p-shared-udd-late.log`). Its own browser is proven, then hands off and exits. The run reports exit 1 (`obsidian exited before CDP came up`), which reads as a capture failure; R6 assumed exit 2.

Fix: throw `EnvFailure` there. It goes away anyway with H-1 fix (b).

**L-2: docs-shots turns the camera's environment exit 2 into its own exit 1.**

Where: `visual-harness/docs-shots.mjs:318-319, 357`.

Failure scenario: a camera port or ownership failure under `npm run docs-shots` shows as `obsidian-camera.mjs exited 2` in a failure list with exit 1. This predates the fix (the camera used to exit 1 for this), but the camera now makes the distinction and docs-shots drops it.

Fix: `if (res.status === 2) process.exit(2)` after cleaning up its Xvfb, or carry the code through. Backlog is fine.

**L-3: lifecycle's `/json/list` poll after the proof does not re-check the browser id.**

Where: `visual-harness/obsidian-lifecycle.mjs:4678-4687`.

The camera re-checks on every `jsonList()`; lifecycle relies on the `alive` check each iteration. The residual window is: our Obsidian dies between the `alive` check and the fetch, and another process binds the freed port within those milliseconds. That is theoretical.

Fix (optional): check `/json/version` against `proven.guid` once before `Cdp.connect` (`:4689`), mirroring the camera.

### INFO

- **I-1 (D2a-try1 both-lost pinned pair): not reproduced; one hypothesis falsified.**
  - My 12 pinned pairs (5 on 48622, 7 on the original 47262): every one was one pass + one exit 2.
  - Hypothesis tested: a loopback client socket using the pinned number as its source port blocks Chromium's bind. **Falsified** (`p-client-port.log`: Chromium bound 48631 while an established client socket held it; the run passed).
  - The cause is still unknown. The failure is clean (exit 2, nothing attached). Nothing points to it recurring on a normal single run.
  - Suggestion for the dse-verify text: pin ports outside `ip_local_port_range` (32768–60999), e.g. below 32768.
- **I-2 (mutation results, `mutate.log`):**
  - Killed: M1 GUID compare skipped; M2 stale-file delete made a no-op; M3 pinned port-mismatch check skipped; M4 exited check removed; M5 half-written report accepted; M7 owner clause dropped.
  - Survived: M6 (`portInUse` probes only 127.0.0.1) and M8 (GUID read via `localhost`). No test listens on `::1` only, and `localhost` resolves to 127.0.0.1 in the test. Tests are worth adding but not required.
  - The camera's `jsonList` GUID gate and both runners' "proof before `Cdp.connect`" ordering have no unit coverage. They are covered by the integration repros only.
- **I-3:** an empty-string `DSE_LIFECYCLE_PORT=` or `DSE_CAMERA_PORT=` is read as port 0 (auto) instead of a usage error (`Number('') === 0`; lifecycle `:134`, camera `:87`). Harmless.
- **I-4:** `npm run lint` covers `src main.ts e2e` only, so `scripts/cdp-owned.mjs` and the harness are not linted. This is the same as before the fix.

## Checklist from the brief, against the code at `5fc0fec2`

- **No CDP connect or evaluate before the proof:** confirmed. Lifecycle: proof `:4670-4677`, then the first `Cdp.connect` `:4689`. Camera: proof `:693-696`, and `jsonList()` returns null while `ownedPort === null` (`:558`). The only connects are `:712`, `:1493`, `:1867`, all fed by `jsonList`.
- **Later target lookups:** camera `:673/:678/:1459/:1833` all go through the GUID-gated `jsonList`. Lifecycle has no reconnects (one `Cdp.connect`).
- **Stale `DevToolsActivePort`:** `clearStaleReport` runs before each proven spawn (camera `:683`, lifecycle `:4659`). The planted-stale run was ignored (`cam/CAMSTALE-1.log`, exit 0, attached to its own Obsidian). Mutant M2 was killed.
- **Host used for the GUID check:** `127.0.0.1` for the proof (`cdp-owned.mjs:134`), the lifecycle list (`:4683`) and the camera's version/list reads (`:560-562`). Chromium's DevTools server binds 127.0.0.1, so this is the right host.
- **Clean-up and exit codes:**
  - Lifecycle envFail passes through the single `finally` → `cleanup()` (`:4731-4732`, `cleanup()` `:180-183`). No leftover processes or temp dirs from 6 losing runs (checked by literal path and `ps`). Exit 2 via `main().catch` (`:4755-4762`).
  - Camera ownership failure passes through `finally` → `killChild` plus `data.json` restore (`:2230-2234`), then exit 2 (`:2262-2265`). Seen 3/3.
  - Exceptions are L-1 and L-2.
- **Rulings:**
  - R1 (a)–(e) met. (a): the implementer measured the file approach (`DevToolsActivePort`).
  - R4 met: bundles identical, and no `src`/`e2e`/scenario diff.
  - R5 met except the shared user-data-dir case in H-1.
  - R10 choices are visible in the code (`portInUse` with any listener, the message text, exit 2 on an invalid port, 127.0.0.1).

## Runs

| What | Where | Result |
|---|---|---|
| tsc / lint / jest | fix worktree, unmodified | rc 0 / rc 0 / `Tests: 2 skipped, 6297 passed, 6299 total`, `Test Suites: 1 skipped, 252 passed, 252 of 253 total` |
| lifecycle part 1, `DSE_LIFECYCLE_PORT=48611` | fix worktree, unmodified | `21/21 ok`, display :162 |
| lifecycle G-S6b, default port | fix worktree, unmodified | `1/1 ok`, `port 34045`, display :160 |
| base pinned pairs (48621) | private clone `eafe76e1` + implementer `temp-instrument.patch`, Xvfb :5440–:5454 | 2/2 one run FOREIGN (rc 1/0, 1/1) |
| fix pinned pairs (48622 ×5, 47262 ×7) | private clone `5fc0fec2` + `temp-instrument-fix.patch` | 12/12 one rc 0 OWN + one rc 2 `never reported … on port N … another instance owns it` |
| fix default-port pairs ×4 | same | 4/4 both rc 0, OWN, distinct ports |
| camera decoy, base ×2 / fix ×3 / stale ×1 | implementer `r2-camera-repro.mjs` unmodified, private clones, displays :5465–:5474, ports 487xx | base attached to the decoy 2/2; fix exit 2 3/3 with `proxyConnections 0`; stale: exit 0, own vault |
| shared user-data-dir: helper / two cameras | `p-shared-udd-proof.mjs`, `p-two-cameras.mjs` | 10/10 wrong at ≤600 ms offset; 3/3 camera pairs wrong-instance (H-1) |
| client socket on the pinned port | `p-client-port.mjs` | lifecycle rc 0, so the hypothesis is falsified (I-1) |

## Housekeeping

- The fix worktree's `git status` was clean before and after, still at `5fc0fec2`. No commits, no edits there.
- Instrumentation and mutations ran only in private clones under my scratch dir. Those clones and the base worktree are removed, by literal path.
- Two kept FAIL temp dirs from my base runs were deleted by literal path: `/tmp/dse-obsidian-lifecycle-Zq0O94` and `/tmp/dse-obsidian-lifecycle-RUTnM2`.
- No Xvfb, Obsidian or listener of mine is left running. I touched nothing belonging to another session.
- The main checkout's develop moved to `f7c9c7ce` during the review; that was not me.
- No run failed on a missing directory, so nothing was re-run as environmental.
