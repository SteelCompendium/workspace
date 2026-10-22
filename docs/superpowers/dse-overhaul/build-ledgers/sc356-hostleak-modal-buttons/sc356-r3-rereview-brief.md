# SC-356 round 3: scoped re-review (delta only)

You reviewed `b01268c` in round 2 (`sc356-r2-review-report.md`). This pass covers only the round-3 delta: the fixes for your LOW-1, LOW-2, LOW-3 and INFO-4 findings (rulings in the ledger section "Round 2 review"), plus the rebase onto dse `8d890f9`+ and the superproject rebase onto origin/main. It is NOT a fresh full review.

## Context
- Read the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc356-hostleak-modal-buttons/sc356-decisions.md`, then `sc356-r3-brief.md` and `sc356-r3-impl-report.md` (same dir).
- dse clone: `/home/scott/code/steelCompendium/worktrees/sc356-hostleak-modal-buttons/draw-steel-elements`. The new head and base are in the r3 report; confirm them with `git -C`.
- Superproject: `/home/scott/code/steelCompendium/worktrees/sc356-hostleak-modal-buttons`.
- Do not commit. Revert any probe edit and say so. Never call the tracker.

## Check
1. Each of LOW-1, LOW-2, LOW-3 (cheap part) and INFO-4 is fixed as ruled, and nothing out of scope changed. Compare each SC-356 commit with its pre-rebase counterpart using `git range-diff 772c3cd..b01268c <newbase>..HEAD`.
2. LOW-1 pin: prove it bites. Weaken a `.dse-nt__chip` rule as an uncommitted probe, confirm the jest pin fails, then revert.
3. LOW-3: probe a transitive subclass and an inline `new Modal(` (scratch-only edits under src/, reverted) and confirm the registry check fails.
4. Rebase integrity:
   - SC-422's text-scale gates and SC-356's gallery and modal host-leak passes are all present and running in shoot.mjs.
   - The StaminaEditModal scenario still sweeps correctly after SC-432 (Spend Recovery disabled for creatures).
   - The new 10th scenario for SC-432's `FreeHealConfirmModal` (flagged by the registry check, sweeping only the topmost dialog over the Stamina modal) is sound: does "topmost only" really exclude the Stamina modal's buttons, and does a failure to open it fail loudly?
   - The superproject CHANGELOG keeps both Unreleased bullets.
   - The SKILL.md numbers match the run.
   - The dse clone is still on its branch.
5. Re-run the gates the delta could move: tsc, lint, jest, shots (host-leak, modal-pass and text-scale lines), freeze and parity. Also run lifecycle and e2e: the rebase brought new upstream tests, and both are required to land.

   Head per the r3 report: dse `2796ab8` on `8d890f9`; superproject `f87af93` on `988f24f`. Implementer measured jest 5591 / modal pass 10 scenarios / 9 classes / 38 kinds / 228. Expected at `8d890f9`:
   - jest 5585 passed / 1 skipped / 234 of 235, plus the branch's tests
   - lifecycle 31/31
   - e2e 95/98 ok, 0 failed, 3 known-bug, coverage 66/66
   - shots 580 incl. `text scale OK (1626 …)` and `text scale once OK (104184 / 208 loads …)`
   - freeze 280/280
   - parity 0/0/24

## Footguns (adapter §8: 1, 9, 10, 11, 12, 13)
- Devbox: run `devbox run -c <abs dse path> -- bash <script-file>`. Never `cd` inside a compound command. Record exit codes from a script FILE and read each gate's summary line; no `| tail`.
- Scratch: use a NEW private subfolder `sc356-r3-rereview-<suffix>/` in the shared scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/`. Write files with the Write tool. No glob `rm`.
- Never key a wait-loop on a scratch filename or its contents. The scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it; the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND. Never background one and wait.
- Never kill a process by name pattern. Kill only PIDs whose command line contains `worktrees/sc356-hostleak-modal-buttons/`.
- Never `rm -rf` shared globs or `.superpowers/`. Never touch the freeze baseline.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` and `demo-vault/*.md`) is Scott's live vault. Expect it and leave it alone.
- No tag, push or release.
- You cannot `SendMessage` me; `to: 'main'` goes to the dispatcher. If you need input, end with STATUS: NEEDS_CONTEXT. If you message anyway, make the first word `SC-356:`.

## Report and return
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc356-hostleak-modal-buttons/sc356-r3-rereview-report.md`, opening with a summary of 10 lines or fewer. If the write is blocked, return it inline.

The final text goes to the ticket-owner as raw facts:
- VERDICT
- findings by severity, each with file:line and the fix to make
- every gate line, verbatim
- the sha reviewed
- the absolute path of every artifact
