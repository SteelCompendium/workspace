# SC-546 r3 — fix round on the r2 review + rebase onto eaf64ba6

You are the r1 implementer, resumed (or a fresh replacement: then read the ledger, `sc546-brief-r1-impl.md`
§1/§4 and `sc546-r1-impl-report.md` first). Your final text goes to the ticket-owner.

## 1. Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc546-e2e-xvfb-race/decisions.md` (see
  "Base moves" and the 2026-11-02 r2 finding rulings).
- Review: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc546-e2e-xvfb-race/sc546-r2-review-report.md`
  lines 14-64 hold every finding in full; the evidence logs it cites are in `sc546-r2-evidence/`.
- Worktree plugin dir `/home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements`,
  branch `sc546-e2e-xvfb-race`, HEAD `cfb16433`.
- **First: rebase.** dse `develop` moved to **`eaf64ba6`** (SC-534, test-only: `e2e/specs/stamina-bar/chrome-live-preview.e2e.ts`
  and `e2e/driver/dse.ts`; `e2e/run.mjs` untouched). `git -C <plugin> fetch origin`, confirm `origin/develop` is
  `eaf64ba6`, `git -C <plugin> rebase origin/develop`. Report the new shas.
- Workers never call the tracker. All r1 brief §4 footguns apply unchanged (devbox `-c`, one foreground gate per
  Bash call, no background gates, no :1, no pattern kill, no `rm` with a variable target or a glob, `git -C`,
  `grep -a` for run.mjs, private scratch folder `…/scratchpad/sc546-r3-fix/` with `sc546-r3-` names).

## 2. The task — findings as the reviewer wrote them, with the owner's ruling

**LOW-1 — FOLD (docs only).** Reviewer: "Fix: docs only; the new code cannot stop an old runner from adopting.
Add one sentence to the dse-verify proposal and the two READMEs: \"Holds once every worktree is on SC-546 or
later. Until then, an un-rebased lifecycle run started in the same instant can still land on a new run's
display, so rebase before running lifecycle concurrently.\" Correct the r1 report's §A sentence the same way."
Places: `e2e/README.md:29-31`, `visual-harness/README.md:341-342`, `sc546-r1-dse-verify-proposal.md` (ledger dir),
and APPEND a dated "Correction (r3)" note to `sc546-r1-impl-report.md` (don't rewrite history in place).

**LOW-2 — FOLD.** Reviewer: "Fix (optional, small): add a `shouldStop` option and check it before each spawn:
`if (shouldStop?.()) break;`. Pass `() => interrupted` from e2e (it is set before `reapAll`) and
`() => shuttingDownOnSignal` from lifecycle." Verify those flag names exist and are set before cleanup runs;
docs-shots passes nothing (or its own equivalent if it has a signal path). Prove with the reviewer's
never-writing fake child + SIGTERM: 0 orphans (lifecycle 0/4, e2e 0/1 or better).

**INFO-1 — FOLD.** Reviewer: "`child.once('error', () => void finish(false))` inside `ownsDisplay`, and stop
the loop on a spawn error so callers can say \"could not execute <bin>\"." Prove: non-executable `XVFB_BIN`
and a missing binary each fail in well under 1 s with a message naming the binary (e2e EnvError rc 2;
lifecycle envFail rc 2; docs-shots its null/"unavailable" path).

**INFO-2 — FOLD.** Reviewer: "a fake that writes `9999\n` should give \"not ours, next number tried\", and
`hasSocket: () => false` should give null." Add both jest cases (plus one for the INFO-1 spawn-error stop and
one for `shouldStop` if cheap). Show each new case FAILS if you revert the line it guards.

**INFO-4 — FOLD (wording).** `scripts/xvfb-owned.mjs:9-10`: say the plain-Xvfb loser "frequently stays alive
for at least ~1 s (seen across processes; depends on lock-file timing)" rather than flatly "stays alive".

**INFO-3, INFO-5 — DROP** (owner ruling: theoretical / no action). Out of scope: do not touch them.
Also out of scope: `resolveXvfb()` duplication (dropped in r1).

Small coherent commits; commit after each step.

## 3. Gates (dse-verify rows 1-4b), after the rebase, all on the final HEAD

Expected at `eaf64ba6` + your change:
- `npm run tsc` and `npm run lint` clean (incl. e2e).
- jest: base **6262 passed / 1 skipped / 249 of 250**; yours = base + your new tests, +1 suite (fresh tree:
  one fewer passed, 2 skipped). State the arithmetic.
- lifecycle THREE separate calls (the lifecycle caller changed), own `DSE_LIFECYCLE_PORT` (not 9262), union **46/46**:
  - `--only=G-S7a,G-S7b,G-S6a,G-S6b,G-S6u,G-S28,G-S5n,G-S1,G-S2,G-S3,G-S4,G-S5,G-S6c,G-S6d,G-S6e,G-S6f,G-S6g,G-S6h,G-S6i,G-S8,G-S9a` (21)
  - `--only=G-S9b,G-S9d,G-S9e,G-S9f,G-S9c,G-S10,G-S11,G-S12,G-S13,G-S15,G-S14,G-S18,G-S32,G-S36,G-S33,G-S40` (16)
  - `--only=G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S57,G-S56` (9, ~360 s, G-S56 last)
- e2e full run TWICE: **`OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`** + the
  `pointer parked at 0,0` line.
- sha256 of `main.js` and `styles.css` built at HEAD vs built at `eaf64ba6`: identical.
- Re-run the r1 helper stress (4 x 25) once on the final helper: 0 shared, 0 leaked.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc546-e2e-xvfb-race/sc546-r3-fix-report.md`, ≤10-line
executive summary first; a per-finding table (finding, commit, proof log); gate summary lines; logs copied into
`sc546-r3-evidence/` in the ledger dir with `sc546-r3-` names. `Drive-by fixes:` / `Follow-ups:` lists.
If the report write is blocked, return it inline. You cannot SendMessage me: on a question, end with
STATUS: NEEDS_CONTEXT. Return raw facts, shas, numbers, absolute artifact paths.
