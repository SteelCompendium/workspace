# SC-324 round 5 — rebase onto dse origin/develop 7644fb3

You report to the SC-324 ticket-owner. Workers never call the tracker.

## Context
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc324-kit-tooltip/decisions.md` (D1-D4; D4 is this round's reason).
- Prior reports in the same dir: `sc324-r1-impl-report.md`, `sc324-r2-review.md`, `sc324-r3-fix-report.md`, `sc324-r4-rereview.md`.
- Repo: `/home/scott/code/steelCompendium/worktrees/sc324-kit-tooltip/draw-steel-elements`, branch
  `sc324-kit-tooltip`, head `7b8dacc` (commits 6f45472, 0afcb2f, 2b7ad20, 7b8dacc on `0d69ec9`).
- **`git -C <absolute path>` for every git command.** Never edit under `/home/scott/code/steelCompendium/workspace/` except your report.

## Task
1. `git -C <repo> fetch origin && git -C <repo> rebase origin/develop`. Expected `origin/develop`
   = `7644fb3` (SC-430: stamina + minion-pool modal Apply draft fix). SC-430 touched
   `src/views/StaminaEditModal.ts`, `src/views/MinionStaminaPoolModal.ts`,
   `src/framework/kit/stepper.ts`, `test/dom/views/stamina-edit-modal.test.ts`,
   `e2e/specs/stamina-bar/stamina-modal-stepper.e2e.ts`, `CHANGELOG.md`.
2. Resolve conflicts preserving BOTH: SC-430's behavior intact, and SC-324's contract (ledger
   D1, D3 M1: "Label becomes `Spend Recovery: <reason>` via `setLabel` (colon separator,
   matching Respite)"). Check every NEW iconButton call or `tooltip()`/`setTooltip` write that
   SC-430 introduced: any `tooltip:` option no longer compiles (field removed) — apply the D1
   string rule ("The new `label` is the string BOTH a hovering user and a screen-reader user
   should get. Lead with the action/name, then any explanation."); any direct `tooltip()` on an
   iconButton's `buttonEl` that would replace the name → `setLabel` with the name first.
   CHANGELOG conflicts: keep both bullets.
3. If SC-430 removed a known-bug marker that SC-324 had edited (e.g. the SC-428 / SC-430 Q-tests
   in `stamina-edit-modal-matrix.test.ts`), keep SC-430's removal and keep SC-324's label
   expectations. The SC-428 Q16 marker (`.not.toContain('Already at maximum Stamina')`) must
   stay a still-failing `test.failing` — SC-428 is NOT fixed by either ticket.
4. Commit the resolution (rebase commits; amend only within the rebase). Do not push or tag.

## Gates — full battery, new baselines (dse-verify CURRENT at 7644fb3)
tsc (incl. e2e) clean · lint clean · jest **4761 passed / 1 skipped / 227 of 228 suites**
baseline (SC-324 added assertions + 6 tests on the old base; report the delta vs 4761 and
account for it) · lifecycle **25/25** (own `DSE_LIFECYCLE_PORT`, e.g. 9291 — another worktree,
sc428, is running lifecycle right now on its own port) · e2e **61/72 ok, 0 failed, 11
known-bug, coverage 47/47 pairs** · shots **572**, 0 FAIL · freeze **276/276** · parity
**0 GAPs / 0 undeclared / 24 DECLARED** (last).

Footguns: devbox shape `devbox run -c <repo> -- bash -c 'cd <repo> && <cmd>'`; devbox eats exit
codes — wrapper script FILE recording rc; redirect long output to per-run unique logs
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc324-kit-tooltip/sc324-r5-<gate>-<ts>.log`;
run gates in the FOREGROUND (never background-and-wait for a notification); never key a wait
loop on a scratch filename; never pkill/killall by pattern — only PIDs whose command line
contains `worktrees/sc324-kit-tooltip/`; never rm the shared `.superpowers/`; `npm ci` if
package.json changed.

## Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc324-kit-tooltip/sc324-r5-rebase-report.md`,
opening with a ≤10-line executive summary (verdict, new head sha, gate lines). Then: each
conflict hunk and how you resolved it (file:line), any new SC-430 call site you adapted. If the
write is blocked, return it inline.

Final text to the ticket-owner: raw facts, shas, gate lines, absolute artifact paths. You
cannot SendMessage me; if you need input end with STATUS: NEEDS_CONTEXT. Any message you send
starts `SC-324:`.

## Extra item (ledger D5, verbatim)
"I2 (release-audit line pins sha 2b7ad20): FOLD into the r5 rebase — the rebase rewrites that
sha. Reword the audit line to cite the ticket ("fixed by SC-324") instead of a sha."
The line is in `dse-7.0.0-release-audit.md` in the DSE repo (~line 439).
