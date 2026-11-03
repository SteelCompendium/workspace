# SC-551 decisions ledger — lifecycle CDP port race (+ e2e / docs-shots / obsidian-shots survey)

Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05.
Worktree: `/home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race`, dse branch
`sc551-lifecycle-cdp-port-race` cut at develop `eafe76e1` (SC-511 landed).
Baseline (dse-verify CURRENT @ eafe76e1): jest 6287 passed / 1 skipped / 251 of 252 suites (fresh worktree
6286 / 2) · lifecycle 46/46 (three `--only` parts 21 + 16 + 9) · e2e `128/128 ok, 0 failed, 0 known-bug,
coverage: 89/89 pairs` · shots 592 0 FAIL 161/966 · freeze 280/280 · parity 0 GAPs / 0 undeclared / 24 DECLARED.

## Ticket (SC-551, verbatim essentials)

> **Expected:** each run uses a CDP port that only its own Obsidian is listening on (for example, pick a free
> port per run, or confirm the CDP target's process is the one we spawned). If the port is taken anyway, the run
> should exit 2 with the environment message.
>
> **Where:** `visual-harness/obsidian-lifecycle.mjs` (port check near the `portBusy` block). Check whether e2e's
> CDP ports have the same race.

Dispatcher (2026-11-02): "Also check e2e's (and docs-shots') CDP ports for the same race, as the ticket asks."
Dispatcher constraints (2026-11-02): three other owners (SC-472, SC-540, SC-544) run lifecycle/e2e on this
machine now — reproduce only on private, uncommitted port/display ranges far from the defaults; never kill or
connect to another session's Obsidian; set your own DSE_LIFECYCLE_PORT for every gate run. Keep scenario code
untouched (SC-472/SC-544 add G-S59/G-S61, SC-540 adds G-S62). No new scenario expected; if one is needed it is
G-S63, in part 3 just before G-S56. Do not edit `.claude/skills/dse-verify/SKILL.md` in the branch — proposed
text goes to a proposal file in this ledger dir.

## Owner findings (2026-11-02, read at eafe76e1)

- `obsidian-lifecycle.mjs:130` `PORT = Number(process.env.DSE_LIFECYCLE_PORT ?? 9262)`.
- `:4628-4635` the only port check: `fetch /json/version` once, BEFORE the vault copy, the asar copy and
  `startXvfb()` (`:4658`) — a window of seconds.
- `:4659` spawns Obsidian with `--remote-debugging-port=${PORT}`, `stdio: 'ignore'`.
- `:4667-4677` polls `http://localhost:${PORT}/json/list` for ANY `page` target whose url starts with
  `app://obsidian.md` — any Obsidian on that port matches. If ours failed to bind (Chromium keeps running
  without a DevTools server), the run attaches to the other Obsidian, then `t.ev(AUTO_DISMISS_TRUST_DIALOG)`
  etc. evaluate INSIDE THE OTHER SESSION'S OBSIDIAN — harmful to that session, not only a false red here.
- Other `--remote-debugging-port` users: `visual-harness/obsidian-camera.mjs` (obsidian-shots,
  `DSE_CAMERA_PORT`), `settings-evidence.mjs`, `sc184-evidence.mjs` (one-off evidence scripts). `docs-shots.mjs`
  has no `--remote-debugging-port` (to be confirmed by the survey). e2e goes through wdio-obsidian-service /
  chromedriver (port choice unknown — survey).

## Owner rulings (2026-11-02)

R1 — Design for lifecycle. The CDP endpoint counts as ours only when OUR Obsidian process says so — the CDP
analogue of SC-546's `-displayfd`:
  (a) Default (no `DSE_LIFECYCLE_PORT`): spawn with `--remote-debugging-port=0` and read the bound port + the
      browser GUID back from OUR process — the `DevToolsActivePort` file Chromium writes into OUR
      `--user-data-dir` (line 1 port, line 2 `/devtools/browser/<guid>`), or the
      `DevTools listening on ws://127.0.0.1:<port>/devtools/browser/<guid>` line on OUR child's stderr. The
      implementer MEASURES which of the two Obsidian 1.15.0 (Electron) actually produces before relying on it.
      With an OS-assigned port two runs cannot collide at all, so "set your own DSE_LIFECYCLE_PORT" stops being
      necessary.
  (b) Explicit `DSE_LIFECYCLE_PORT=<n>` stays supported (people pin ports today). Keep the pre-check, and add the
      same ownership proof: our process must report port n with a GUID that matches `/json/version`'s
      `webSocketDebuggerUrl` on n. If our Obsidian failed to bind n (no report within the start-up timeout, or
      the GUID on n is not ours) → `envFail` (exit 2) with a message that names the port and says another
      instance owns it.
  (c) The ownership proof happens BEFORE any CDP evaluate/connect to a page — never run a single `Runtime`
      command against an Obsidian we did not spawn. `/json/version` and `/json/list` HTTP reads are allowed.
  (d) The page target is then looked up on OUR port only, and the start line still prints `port <n>`.
  (e) Put the logic in a small shared helper next to `scripts/xvfb-owned.mjs` (e.g. `scripts/cdp-owned.mjs`)
      with jest unit tests like SC-546's (fake child / fake file / fake HTTP), so obsidian-shots or e2e can
      reuse it if the survey says they need it.

R2 — Reproduce on base first (two real lifecycle runs, `--only=<one cheap scenario>`, SAME private port far
from defaults — e.g. 47xxx, never 92xx — a wall-clock barrier right before the port check, private Xvfb range
via a temporary uncommitted edit far from :160–:239 and from SC-546's :5300–:5339, e.g. :5400–:5439). Base is
reproduced when one run attaches to the OTHER run's Obsidian (print both runs' Obsidian PIDs / vault paths, or
the mass FAIL). Both Obsidians are ours, so this connects to no foreign session. Then the same harness on the
fix: (i) both runs on default port 0 → both pass, distinct ports; (ii) both on the same explicit private port →
one passes, the other exits 2 with the env message and never evaluates in the winner's Obsidian. Revert the
temporary edits before committing.

R3 — Survey (separate reviewer round, read + private probes only): e2e (wdio-obsidian-service, chromedriver,
Obsidian's DevTools port, wdio's own port choice), docs-shots, obsidian-shots (`obsidian-camera.mjs`), and the
two evidence scripts. Per runner: race present Y/N with file:line, consequence (wrong instance vs. clean
failure), prescribed fix. Owner rules scope on the survey's report.

R4 — No change to plugin source (`src/`, `main.ts`, `styles`) — `main.js`/`styles.css` must stay byte-identical
to eafe76e1, so shots/freeze/parity carry. Scenario code untouched.

## Log

- 2026-11-02 r1 impl (lifecycle) + r1 survey (other runners) dispatched in parallel.
- 2026-11-02 survey done; R5–R9 ruled. Filed SC-553 (R7, e2e chromedriver port + exit-code note) and SC-554 (R6, shared camera udd), both Backlog, Low, related to SC-551. Camera fix (R5) goes to the r1 implementer as r2 after r1 reports.

## Owner rulings on the r1 survey (2026-11-02; report `sc551-r1-survey-report.md`)

R5 — obsidian-shots / docs-shots Obsidian half (`visual-harness/obsidian-camera.mjs`): same wrong-instance race,
proven harmful (survey P4: the unmodified camera ran `app.plugins.setEnable(true)` in a foreign Obsidian and would
go on to delete/create notes, write appearance settings and `app.quit()` it). FOLD INTO THIS EFFORT, using the R1
helper with the same rules: default port 0 read back from OUR process; explicit `DSE_CAMERA_PORT` keeps its
pre-check plus the ownership proof; proof complete before any CDP connect/evaluate; every later target search
(`:678`, `:1459`, `:1833`) uses only OUR proven port (and, if it re-reads the target list, only targets of our
proven browser). Because the camera's user-data-dir persists, a STALE `DevToolsActivePort` is on disk (survey):
the helper must delete it before spawning (or rely on our child's stderr line only) — apply that in the helper so
lifecycle gets it too. No change to what the camera captures; shots/freeze bytes must not move.

R6 — the camera's shared default user-data-dir (`DSE_CAMERA_TMP` fixed machine-wide path; a second concurrent
camera run's `seedUdd()` rewrites the first run's live `obsidian.json`): NOT in this effort — Backlog ticket filed
(see Log). After R5 a second Obsidian on the same udd fails cleanly (it exits; no port reported → exit 2), which is
enough for SC-551.

R7 — e2e chromedriver port (`@wdio/utils` `getPort()` check-then-use, 14–26 ms window, wrong-instance when hit,
estimated ~1e-6/session): NOT in this effort — Backlog ticket filed, Low priority, carrying the survey's prescribed
fix (verify `wdio:driverPID` owns the socket on `options.port` in a `before` hook, throw `SevereServiceError`) and
the e2e exit-code note (a session that fails to start exits 1 with "did not run" lines, not the documented exit 2:
`run.mjs:574-578`/`:603` before `:604-606`). e2e's Obsidian DevTools port is already safe (chromedriver uses port 0
+ DevToolsActivePort in a per-session udd) — no change.

R8 — `settings-evidence.mjs`, `sc184-evidence.mjs`: DROPPED — one-off historical evidence scripts, not gates, run by
hand on demand; not worth churn.

R9 — docs-shots browser half and every Playwright launcher (`shoot`, `parity`, …) use a pipe, no TCP port — no
change.
- 2026-11-02 r1 impl done: dse `98502327` (helper `scripts/cdp-owned.mjs` reads OUR udd's `DevToolsActivePort`, GUID
  vs `/json/version`; 10 new jest tests). Repro on base 11/11 pairs attached to the other run's Obsidian; fix
  (i) port 0 10/10 both pass, (ii) pinned 17/18 one pass + one exit 2, 1/18 both exit 2 (clean, unexplained),
  (iii)/(iv) exit 2, decoy saw 0 requests. Gates: jest 6296/2, 252 of 253 (fresh); lifecycle 21+16+9 = 46/46; e2e
  128/128 89/89; main.js/styles.css byte-identical.

R10 (owner, 2026-11-02) — the r1 implementer's four choices are ACCEPTED: pre-check = any TCP listener (not only an
HTTP answer); message `port N is already in use — another instance owns it`; invalid `DSE_LIFECYCLE_PORT` = exit-2
usage error; `/json/list` on `127.0.0.1`. The one both-lost pinned pair is acceptable (clean exit 2, no foreign
attach); the reviewer probes it if cheap.
- 2026-11-02 r2 (camera, R5) sent to the r1 implementer (resume).
- 2026-11-02 r2 camera done: dse `5fc0fec2` (camera port 0 + proof, `jsonList()` gated on the proven browser id,
  warm-up launch no DevTools port, env failures exit 2, helper `clearStaleReport(udd)` before every proven spawn).
  Base repro 6/6 attached to decoy; fix 5/5 exit 2, proxy 0 connections; stale-file plant ignored. jest 6297/2,
  252 of 253 (fresh); obsidian-shots 61/61 port 0 and pinned; lifecycle part 1 21/21 + G-S6b on port 0.
  Follow-up ruled: docs-shots `initiative-tracker-conditions.gif` step-8 failure (pre-existing, identical on r1) →
  filed SC-555 (Backlog, Low). Note: the camera's exit code for port-in-use moved 1 → 2 (ACCEPTED, matches ticket).
- 2026-11-02 r3 independent review dispatched (survey reviewer, not an author).
- 2026-11-02 15:05 dispatcher relay: an SC-540 worker glob-deleted 6 /tmp/dse-obsidian-lifecycle-*2 dirs at ~14:45.
  Checked: every SC-551 lifecycle run passed (r1 parts ended 14:28/14:34/14:40, r2 part 1 later, all 0 failed) —
  no impact. r3 reviewer told: a missing-dir failure is environmental, re-run; no glob rm, literal paths only.
- 2026-11-02 dispatcher: dse develop moved eafe76e1 → f7c9c7ce (SC-540: src/framework/pipeline.ts + lifecycle G-S62
  in part 3 before G-S56, plus a G-S62 harness commit in obsidian-lifecycle.mjs near phase (d) — possible textual
  overlap). New baseline: jest 6297 passed / 1 skipped / 251 of 252 suites; lifecycle 47/47 = 21 + 16 + 10, part 3 =
  `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S57 G-S62 G-S56` (~450 s); e2e 128/128 89/89; shots 592 0 FAIL
  161/966; freeze 280/280; parity 0/0/24. REBASE onto f7c9c7ce before the land-ready battery (in the fix round, after
  r3). Byte-identity check is then vs a build at f7c9c7ce. Expected after rebase: jest (fresh, no shots) 6296+11 = 6307
  passed / 2 skipped, 252 of 253 — the implementer confirms the exact line.
- 2026-11-02 r3 review (`sc551-r3-review-report.md`): FIX-FIRST, HIGH 1 / LOW 3 / INFO 4. Lifecycle holds everywhere.

## Owner rulings on r3 (2026-11-02)

~~R6's premise "After R5 a second Obsidian on the same udd fails cleanly (it exits; no port reported → exit 2)"~~
superseded by R11: false for starts within ~1 s (H-1: both Obsidians write `DevToolsActivePort` into the shared udd
before the single-instance handoff; the loser reads the winner's port + GUID and passes the proof).

R11 — H-1 FOLD, fix (a): the helper additionally requires that the LISTEN socket on `127.0.0.1:<report.port>` belongs
to OUR child — its inode from `/proc/net/tcp` (and `tcp6`) found as `socket:[inode]` under `/proc/<child.pid>/fd`;
otherwise `CdpOwnershipError('foreign-listener')` → exit 2. Keep the GUID check. Unit test with a socket owned by a
different pid (injectable `/proc` reader seam). Applies to lifecycle and camera alike. Fix (b) (exclusive udd lock) is
NOT in this effort — it belongs to SC-554 (ticket updated with the reviewer's lock proposal).
R12 — fold L-1 (`obsidian-camera.mjs:700` → `EnvFailure`, exit 2), L-2 (`docs-shots.mjs:318-319, 357` passes the
camera's exit 2 through as 2), L-3 (one `/json/version` GUID re-check right before lifecycle's `Cdp.connect`).
R13 — fold the text corrections: helper header ("ours exactly when…" must state the precondition: the udd belongs to
our child alone, and now the socket-owner proof); proposal §4 must not claim concurrent cameras are safe without a
private `DSE_CAMERA_TMP`; add I-1's note "pin ports below 32768 (outside the ephemeral range)" to the proposal.
R14 — DROPPED: I-1 cause hunt (clean exit 2, 12/12 not reproduced); I-2 surviving mutants (dual-stack vs 127.0.0.1-only
listeners and the host are covered by integration repro (iii) and the 127.0.0.1-only code path); I-3 empty port env =
auto (reasonable behaviour); I-4 lint not covering `scripts/`/`visual-harness/` (pre-existing tooling scope, not
SC-551's call).
R15 — the fix round also REBASES onto develop `f7c9c7ce` (see the dispatcher entry above) and runs the full land-ready
battery there.
- 2026-11-02 dispatcher: develop moved f7c9c7ce → 711f740d (SC-544: ViewRegistry.flushPendingWrites in replaceSource;
  lifecycle G-S61 in obsidian-lifecycle.mjs — possible textual overlap). New baseline: jest 6307 passed / 1 skipped /
  251 of 252 (fresh 6306 / 2); lifecycle 48/48 in FOUR `--only` parts, each its own port: part 1 `G-S7a … G-S9a` (21),
  part 2 `G-S9b … G-S40` (16), part 3 `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52` (7), part 4
  `G-S57 G-S62 G-S61 G-S56` (4; G-S56 last); e2e 128/128 89/89; shots 592 0 FAIL 161/966; freeze 280/280; parity
  0/0/24. R15 now means: rebase onto 711f740d (or newer) for the land-ready battery; byte-identity vs a 711f740d build.
  Expected jest after rebase (fresh): 6306 + SC-551's tests (11 at r2 + r4's) passed / 2 skipped, 252 of 253.
- 2026-11-02 r4 implementer told (SendMessage) of the new tip and the four-part lifecycle.
- 2026-11-02 r4 fix done: dse `38b4f856` on develop `711f740d` (rebased twice, no conflicts). R11 socket-owner proof
  (`/proc/net/tcp{,6}` inode under `/proc/<child.pid>/fd`, fails closed `unverifiable`), R12 L-1/L-2/L-3, R13 text.
  H-1 two-camera repro: base 6/6 pairs one wrong-instance; fix 9/9 loser exit 2, 0 wrong-instance. Gates on 711f740d:
  tsc/lint rc 0; jest 6321 passed / 2 skipped, 252 of 253 (fresh; = 6306 + 15); lifecycle 48/48 (21+16+7+4, ports
  47511-47514); e2e 128/128 89/89; obsidian-shots 61 rc 0; main.js/styles.css byte-identical to a 711f740d build.
  Follow-up ruled: "with a shared udd the winner could read the loser's file and itself exit 2 foreign-listener" —
  DROPPED here: clean exit 2, never wrong-instance, and it disappears with SC-554's udd lock / per-run udd.
- 2026-11-02 r5 scoped re-review dispatched (same reviewer as r3, not an author).
- 2026-11-02 r5 re-review (`sc551-r5-rereview-report.md`): LAND for `38b4f856`, LOW 1 / INFO 2. Rebase clean (G-S61,
  G-S62 present), 9/10 owner-check mutants killed, L-1/L-2/L-3 + R13 confirmed, H-1 closed (8 camera pairs, 18 helper
  tries).

R16 (owner, 2026-11-02) — r5 LOW-1 FOLD: a launcher wrapper that does not `exec` (`DSE_LIFECYCLE_BIN` /
`DSE_CAMERA_BIN` = a script, `flatpak run`) now always exits 2, a regression vs eafe76e1 that would cost real time on
another machine. Fix as prescribed: accept a LISTEN inode owned by `child.pid` OR any of its descendants (ppid walk over
`/proc/*/stat`, injectable seam like `fdLinks`); never a process outside our child's tree (H-1 stays closed: the other
run's Obsidian is never our descendant). Name the owning pid + command in the `foreign-listener` message. Unit tests: a
socket owned by a child process passes; a socket owned by a non-descendant still fails.
R17 — r5 I-1 FOLD (cheap, same test file): a test with two listeners on one port (ours on 127.0.0.1, a stranger's on
`[::1]`) that kills the `some`→`every` mutant (i.e. any foreign listener on the port fails the proof). r5 I-2 DROPPED
(probe wording, not a defect).
- 2026-11-02 r6 fix (R16, R17) sent to the implementer.
- 2026-11-02 r6 fix done: dse `45eef821` (one commit on `38b4f856`, develop still `711f740d`). Descendant walk + holder
  named in message + 4 tests (19 total). Wrapper probes pass (lifecycle + camera), H-1 3/3 pairs 0 wrong-instance,
  pinned pair 2/2. Gates: tsc/lint rc 0; jest 6325 passed / 2 skipped, 252 of 253 (fresh); lifecycle 48/48 (21+16+7+4,
  ports 47521-47524); obsidian-shots 61 rc 0; main.js/styles.css = 711f740d build; e2e not re-run (no e2e change, e2e
  does not import cdp-owned; last e2e 128/128 89/89 at 38b4f856 whose e2e tree is identical).
  Follow-up ruled: wrapper cleanup SIGTERMs only the wrapper pid — DROPPED: unchanged since eafe76e1, only matters for a
  wrapper that detaches its child, none in use.
- 2026-11-02 r7 scoped re-review of the r6 delta dispatched (fresh implementer-tier identity, not an author).
- 2026-11-02 r7 scoped re-review (`sc551-r7-rereview-report.md`): LAND for the walk; LOW 2 / INFO 2.

R18 (owner, 2026-11-02) — r7 LOW-1 FOLD, must fix before land: the non-exec bash wrapper test in
`test/unit/build/cdpOwned.test.ts` (~:258-268) orphans a ~52 MB node http server on EVERY jest run (SIGKILL hits only the
bash; the kill is not in a `finally`). On a machine where many agents run jest that accumulates. Fix: kill the whole
tree (e.g. spawn the wrapper `detached: true` and `process.kill(-pid, 'SIGKILL')`, or have the test record the child pid
and kill it), in a `finally`/`afterEach`; prove with a before/after `ps` count around 3 jest runs of that file that no
process is left. Also kill the 5 orphans left by r6 runs (2353425, 2354196, 2354594, 2354989, 2367371) — by exact pid,
only after checking each one's cmdline/cwd is that test's server under the sc551 worktree.
R19 — r7 LOW-2 FOLD: a test where a descendant's fd list is unreadable → its socket is NOT ours (kills the fail-open
mutant at `scripts/cdp-owned.mjs` ~:248). INFO-1 FOLD: a timeout on the test helper's `execFileSync` so a lost bound
fails instead of hanging. INFO-2 DROPPED (bash/sleep are always on PATH in devbox).
- 2026-11-02 r8 fix (R18, R19) sent to the implementer.
- 2026-11-02 r8 fix done: dse `367a2f1d` (test-only, `cdpOwned.test.ts` +15/-5; helper untouched). Wrapper spawned
  detached + process-group kill in `finally` + 60 s self-exit backstop; leak count 6→7→8→9 before, 0/0/0/0 after; the 5
  r6 orphans + 1 wrapper + 3 own BEFORE-run servers killed by exact pid after cmdline/cwd check. R19 test kills the
  fail-open mutant; execFileSync timeout 60 s. jest 6325 passed / 2 skipped, 252 of 253; tsc/lint rc 0.
- 2026-11-02 r9 scoped re-review of the r8 delta → the r7 reviewer (not an author).
- 2026-11-02 r9 re-review: LAND, no findings (leak 0 over 3 runs + forced-failure case; fail-open mutant killed; jest
  6325/2). LAND-READY: dse `367a2f1d` on develop `711f740d` (5 commits, 5 files). Reported to the dispatcher.
