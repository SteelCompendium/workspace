# SC-288 r2 scoped re-review — delta `0dcc6eb..45dcf2b`

## Executive summary

- **Verdict: LAND-READY.** Counts: HIGH 0 · MEDIUM 0 · LOW 0 · INFO 3 (no action required to land).
- All four r1 findings are closed as I prescribed: MEDIUM-1 (`SidebarBlockHost.ts:362`), LOW-1 (test covering `SidebarPanel.ts:256`), LOW-2 (attribute gate at `SidebarPanel.ts:232`), INFO-1 (doc reworded; no "exactly when" / "structurally impossible" claims left).
- My 11 scratch probes pass on `45dcf2b`, including undo (P1) and forced interleave (P9). Two new probes also pass: after recovery a self-write is still self-echo with no remount (P10), and the fast path is live again (P11).
- Mutations: each of the 3 new tests goes red on a behavioural assertion when its own fix line is removed; the other 10 stay green. Tree restored clean each time.
- Gates on `45dcf2b`: tsc clean · lint clean · jest **3942 passed / 1 skipped / 3943, 202 of 203 suites** (matches expected). Freeze and parity not re-run because the delta touches no CSS, fixtures or rendered markup. Cited: `sc288-r2-freeze.log` `260/260`, `sc288-r2-parity.log` `0/0/16`.
- **Landing note:** `origin/develop` moved `f6fb208` → `48ac20c` (SC-343, 12 commits); merge-base is still `f6fb208`. A trial merge conflicts **only in CHANGELOG.md**: both branches added a first bullet under 7.0.0, and keeping both resolves it. With that resolution the merged tree is tsc clean and jest 3972 passed / 3 skipped / 3975, 204 of 205. No rebase done by me.

## State

- Worktree `/home/scott/code/steelCompendium/worktrees/sc288-sidebar-stuck/draw-steel-elements`, branch `sc288-sidebar-stuck`, HEAD `45dcf2b7e9b9c0eaf9a711ab9272b0cbbea08c7b`. Delta commits: `253999a` (tests), `7435360` (fix), `45dcf2b` (changelog). Delta files: CHANGELOG.md, SidebarBlockHost.ts, SidebarPanel.ts, sidebarInitiative.test.ts.
- `git status --porcelain` empty before and after every probe and mutation. The trial merge ran in a throwaway detached worktree under my scratchpad, which I removed afterwards (`git worktree remove --force` + `prune`); the only worktree listed now is sc288's.

## Closure of r1 findings

| r1 finding | r2 change | Evidence |
|---|---|---|
| MEDIUM-1: undo after a panel write stays stuck | `this.lastWritten = null;` in `notifyAnchorLost` (`SidebarBlockHost.ts:362`) + test `sidebarInitiative.test.ts:336` | Probe P1 passes. Mutant M1 (line removed) → that test red at `:364` (`data-dse-sidebar-unavailable` not null). |
| LOW-1: remount-branch forget untested | test `sidebarInitiative.test.ts:378` | Mutant M2 (remove `SidebarPanel.ts:256`) → red at `:403` (`.dse-error-card` still present). |
| LOW-2: mid-remount anchor-loss race | fast-path gate `SidebarPanel.ts:232` + test `sidebarInitiative.test.ts:421` | Probe P9 passes. Mutant M3 (gate removed) → red at `:455`. |
| INFO-1: overclaiming doc | `mountedChild` field doc and `forgetMountedChild` doc reworded; they now name the LOW-2 race and say the gate closes it | Read against code: accurate. |

## Side-effect checks for `lastWritten = null`

- **Self-echo after recovery still works** (P10): break → undo → recover, then two sidebar Malice writes. For each write: `handleExternalChange` spy 0 calls, `pipeline.run` spy 0 calls, `update` 0 calls, root node identical, a single initiative root, `lastMountedChild` unchanged. Values 6→7→8 land in the block with the text around it byte-identical. No double remount, no flicker loop. This holds by construction: the first post-recovery write sets `lastWritten` afresh, and the only clear is inside `notifyAnchorLost`.
- **Anchor dropped by the panel's own write:** `replaceSource` sets `lastWritten`, then `notifyAnchorLost` clears it. The echo that follows can't locate the block, and `notifyAnchorLost` is idempotent, so nothing changes. The existing suites for this path pass.
- **Fast path still live** in the normal case (existing "refreshes the mounted view in place" test is green) and after recovery. P11: undo-recovered panel, then an outside stamina edit keeps the root node, `update` is called once, `pipeline.run` is not called, and the panel shows `33/80`. P3 (3 break/recover cycles) also keeps root identity on each post-recovery edit.
- **Persist after recovery** writes the right block and leaves the text around it intact (P3, P4 moved-block, P10).

## Findings

### INFO-1 — CHANGELOG will conflict when landing (origin/develop moved)

`origin/develop` = `48ac20c` (SC-343) adds its own first bullet under `## 7.0.0 (unreleased…)`, so a rebase or merge conflicts in `CHANGELOG.md` only. Resolution: keep both bullets. I verified this in a trial merge: no other conflicts; tsc clean; jest 3972/3 skipped/3975, 204 of 205 suites. SC-343's `BlockHost.notePersistIntent?()` is optional, so SidebarBlockHost needs no change. Re-run the battery after the owner's rebase, per the ledger's pre-LAND-READY rebase rule.

### INFO-2 — r1 test comment slightly overclaims (optional wording)

`test/dom/framework/sidebarBlockHost.test.ts:168`: "a stale reference can never survive…". The r2 doc itself says `forgetMountedChild` alone does not guarantee that (the LOW-2 race); the gate is what stops the stale view being used. Optional reword: "…does not survive a removal SidebarPanel performs itself". Not a code issue.

### INFO-3 — residual theoretical race, pre-existing, not demonstrated (no action)

Two remount-branch runs in flight at once (e.g. two outside edits arriving while `mountedChild` is null) could, **if the later run finished first**, leave `lastMountedChild` pointing at the earlier run's detached view while the later view is on screen. The next outside edit would then update a view that isn't displayed. This needs out-of-order completion of two `pipeline.run` calls. It is independent of SC-288: it exists on `f6fb208` and is neither introduced nor widened here. I did not reproduce it. It is consistent with the ledger's drop of the generation token, which is the fix if it is ever observed. Relatedly, the detached view in the LOW-2 race stays loaded until the next change or panel close (bounded, no user effect). No action for SC-288.

## Gates (on `45dcf2b`)

| Gate | Result | Log |
|---|---|---|
| tsc | clean, exit 0 | `sc288-r2-rereview-tsc.log` |
| lint | clean (standing `.eslintignore` warning only), exit 0 | `sc288-r2-rereview-lint.log` |
| jest (`rm -f main.js styles.css`) | `Tests: 1 skipped, 3942 passed, 3943 total` · `Test Suites: 1 skipped, 202 passed, 202 of 203` | `sc288-r2-rereview-jest.log` |
| shots / freeze / parity | not re-run (delta has no CSS, fixtures or markup); cited `sc288-r2-freeze.log` `freeze OK (260/260 …)`, `sc288-r2-parity.log` `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)` | — |
| trial merge with `origin/develop` `48ac20c` (CHANGELOG hand-resolved) | tsc clean; jest `3 skipped, 3972 passed, 3975` · `204 of 205` | `sc288-r2-rereview-trialmerge-{tsc,jest}.log` |

No `sidebarEncounterHandoff` (SC-352) failure in any run.

## Artifacts (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc288-sidebar-stuck/`)

- `sc288-r2-rereview-report.md` (this file)
- `sc288-probe.test.ts` (scratch probes P1–P11; P10/P11 new this round)
- `sc288-r2-rereview-mutate.py` (mutation helper)
- `sc288-r2-rereview-probes.log`, `sc288-r2-rereview-mutant-M1.log`, `sc288-r2-rereview-mutant-M2.log`, `sc288-r2-rereview-mutant-M3.log`
- `sc288-r2-rereview-tsc.log`, `sc288-r2-rereview-lint.log`, `sc288-r2-rereview-jest.log`
- `sc288-r2-rereview-trialmerge-tsc.log`, `sc288-r2-rereview-trialmerge-jest.log`
