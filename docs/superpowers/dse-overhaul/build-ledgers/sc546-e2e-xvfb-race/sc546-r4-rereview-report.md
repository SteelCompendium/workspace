# SC-546 r4 — scoped re-review of the r3 fix round (dse `sc546-e2e-xvfb-race` @ 4b14600d on eaf64ba6)

**Verdict: LAND.** 0 BLOCKER, 0 IMPORTANT, 0 LOW, 4 INFO (all cosmetic or docs, all optional). Every folded r2 finding checks out when executed.
- Rebase: `range-diff dabfb518..cfb16433 eaf64ba6..4b14600d` shows all 5 reviewed commits `=` (patch-identical), plus 3 new ones. `origin/develop` = eaf64ba6, which is an ancestor of HEAD. The branch diff touches only the 7 SC-546 files; SC-534's `e2e/driver/dse.ts` and `e2e/specs/stamina-bar/chrome-live-preview.e2e.ts` are byte-identical to eaf64ba6.
- LOW-2: my orphan probe (child that never writes fd 3, SIGTERM during start) now gives **0/4 orphans for lifecycle and 0/3 for e2e** (r2: 4/4 and 1/1). Both flags are set before cleanup: `run.mjs:611` (`interrupted = true`) runs before `:613` (`reapAll`), and `obsidian-lifecycle.mjs:185` before `cleanup()`.
- INFO-1: a non-executable `XVFB_BIN` fails fast and names the binary (EACCES) in all three callers: e2e rc=2 in 482 ms, lifecycle rc=2 in 147 ms, docs-shots prints the message and then its usual failure, rc=1. At helper level, EACCES fails in 50 ms and ENOENT in 43 ms; both throw `XvfbSpawnError` after 1 spawn.
- INFO-2: `xvfbOwned.test.ts` passes 10/10 on 5 runs (2.5 s each). Each of my 4 single-line mutations fails exactly one test: wrong-number check, belt `hasSocket`, `shouldStop`, and the spawn-error listener.
- LOW-1: the sentence is present in `e2e/README.md:31-32`, `visual-harness/README.md:343-344` and the proposal, and `sc546-r1-impl-report.md:51` has the dated "Correction (r3, 2026-11-02)". INFO-4 wording is at `scripts/xvfb-owned.mjs:9-11`.
- e2e full at 4b14600d: `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`, display :200, pointer parked, rc=0.
- Tree as found: plugin `git status --porcelain` empty before/after, HEAD 4b14600d; superproject ` M draw-steel-elements` unchanged. Every mutation was an uncommitted probe edit reverted with `git checkout --`. No Xvfb, socket, `sleep` or temp dir of mine is left.

## Findings (all INFO, optional)

### INFO-A — the JSDoc of `displayRange` is now attached to the wrong declaration
- `scripts/xvfb-owned.mjs:33-37`: `/** Inclusive integer range [lo, hi]. */` (line 33) now sits directly above the `XvfbSpawnError` doc comment (34-35). `displayRange` (37) has no doc.
- Fix: move line 33 to just above line 37.

### INFO-B — after a signal, each runner prints a second, misleading environment line
- `e2e/run.mjs:369` and `visual-harness/obsidian-lifecycle.mjs:452`. When `shouldStop` ends the search, the helper returns null, and the caller reports it as exhaustion.
- Measured in every orphan rep:
  - e2e: `received SIGTERM, cleaning up` then `environment: no free X display in :200-:239`.
  - lifecycle: `received SIGTERM, cleaning up` then `environment: no Xvfb of our own could be started on a free display in :160–:199`.
- rc is still 2 and cleanup is correct; only the log is misleading.
- Fix (optional): in each caller, `if (!got && interrupted) return new Promise(() => {})`. That waits for the signal handler's `process.exit(2)`; lifecycle uses `shuttingDownOnSignal`. Or have the helper return a distinct "stopped" value.

### INFO-C — the `visual-harness/README.md` caveat names only lifecycle, but it sits in the docs-shots section
- `visual-harness/README.md:343-344` is in docs-shots' "The display: Xvfb, not yours" section. An un-rebased docs-shots run has the same socket-only poll with no exit-code check (dabfb518 `docs-shots.mjs:276`), so it can adopt a new docs-shots run's display in the same way.
- Fix (optional): "an un-rebased lifecycle or docs-shots run …". Docs-shots rarely runs concurrently.

### INFO-D — the proposal's footgun line still lacks the INFO-4 qualifier
- `sc546-r1-dse-verify-proposal.md` footgun bullet says the loser "can stay alive holding no socket (7 of 12 simultaneous pairs)". The helper comment now says "alive for at least ~1 s … depends on lock-file timing".
- Fix (optional): copy that qualifier into the proposal before it goes into SKILL.md.

## Probes (scripts and logs in `sc546-r4-evidence/`)

1. **Rebase scope.**
   - `git range-diff`: 5/5 `=`.
   - `git diff --name-only eaf64ba6 HEAD`: the 7 SC-546 files only.
   - `git diff --quiet eaf64ba6 HEAD -- e2e/driver/dse.ts e2e/specs/stamina-bar/chrome-live-preview.e2e.ts`: identical.
2. **LOW-2 orphans** (`sc546-r4-orphan.sh`; `sc546-r4-orphan-lc-hang.log`, `sc546-r4-orphan-e2e-hang.log`).
   - Setup: branch worktree, `XVFB_BIN` = `exec sleep 60` fake, SIGTERM 0.7 s after the fake appears, then a scan for any process carrying that `XVFB_BIN` 3 s after the runner exits.
   - Lifecycle (port 9581): 4/4 runs rc=2, 0 orphans.
   - e2e: 3/3 runs rc=2, 0 orphans.
   - A first lifecycle attempt on port 9473 hit `port 9473 already serves CDP` twice; that port was transiently used by another agent. I moved to 9581 and kept that log.
3. **INFO-1** (`sc546-r4-spawnerr.log`).
   - Helper: EACCES in 50 ms, ENOENT in 43 ms; both throw `XvfbSpawnError: could not execute <bin>: <code>` with spawned=[5340].
   - e2e: rc=2 in 482 ms, `OBSIDIAN-E2E environment: could not execute <bin>: EACCES`.
   - Lifecycle: rc=2 in 147 ms, same message.
   - docs-shots: rc=1 in 559 ms; prints `could not execute … EACCES`, then `(obsidian shots): Xvfb unavailable`.
   - A missing `XVFB_BIN` path is ignored by every caller's `resolveXvfb` (it falls back to PATH), so ENOENT is reachable at helper level only. That is expected, and r3 said so.
4. **INFO-2** (`sc546-r4-jest.log`).
   - 5 runs: 10 passed each, rc=0, 2.45-2.65 s.
   - Mutations: `wrongnum` (`finish(buf === "<n>\n")` → `finish(true)`), `belt` (drop `&& hasSocket(n)`), `shouldstop` (drop `|| shouldStop?.()`), `errlistener` (drop `child.once('error', onExit)`). Each: rc=1, 1 failed / 9 passed, and the failing test is the matching new case.
   - Afterwards: tree clean, 0 `sleep 30`, 0 test temp dirs.
5. **e2e full** (`sc546-r4-gate-e2e.log`): `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`, display :200, `pointer parked at 0,0 on :200`, rc=0.

## Artifacts
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc546-e2e-xvfb-race/sc546-r4-rereview-report.md`
- Evidence (24 files, prefix `sc546-r4-`): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc546-e2e-xvfb-race/sc546-r4-evidence/`. Originals are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r4-rereview/`.
