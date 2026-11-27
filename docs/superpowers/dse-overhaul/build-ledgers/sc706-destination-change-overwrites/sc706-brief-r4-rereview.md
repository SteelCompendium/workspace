# SC-706 r4 — scoped re-review of the r3 delta (6961239e..cbdf98d6)

Same reviewer as r2; same worktree, footguns, gate procedure as your r2 brief
(`sc706-brief-r2-reviewer.md` §1, §3, §4). Scratch subfolder `sc706-r4-rereview/`. You never call
the tracker. Leave the branch at cbdf98d6.

Read: ledger `decisions.md` rulings O4–O7 (O4 refines D1(a)); r3 report
`sc706-r3-implementer-report.md` (exec summary + per-finding section). Delta:
`git -C <plugin dir> diff 6961239e..cbdf98d6` plus superproject `git -C <worktree> diff 0e32b647..98b2a527`.

Scope — the delta only, not a fresh full pass:
1. H1 fixed per O4? Re-run your `sc706r2Probe2` rename probe on cbdf98d6; confirm the SC-706 case
   (user's own note) stays skipped and a user-edited moved file stays skipped. Any way the hash rule
   overwrites user-authored bytes?
2. M1 fixed per O5? Re-run your `sc706r2Probe` migration probe. Confirm `reconcile(options.root)` at
   the start of `syncCompendium` is unchanged and a later Destination change is not pulled back.
   Check the `rekey` flag's callers.
3. L1/L2 wording accurate against the code.
4. Rule on r3's two follow-ups (severity + whether SC-706 must fix them):
   F1 the re-keyed manifest keeps the old folder's `releaseTag` rather than a `migrated:` tag — does
   `checkForUpdates` then say "up to date" while moved files sit at legacy content, on a path SC-706
   now routes users into? F2 the pre-existing stale `state.root` in `execute()`'s start-of-run
   reconcile — newly reachable via D1(b), or unchanged exposure?
5. Mutation: revert the O4 hash arm alone and the O5 re-key alone; each must be caught by jest and
   by e2e D13 / D14 respectively.
6. Gates: tsc (+e2e), lint, jest, full e2e (expect 0 failed, 20 known-bug, 540/540), sync element,
   styles.css sha. Note r3 saw a one-off SET-X03/X04 settings file-picker timeout in one full run;
   report whether you see it.

Report `sc706-r4-rereview-report.md` in the ledger dir, ≤10-line executive summary first (verdict
LAND-READY / FIX REQUIRED, counts, gate lines), findings by severity with file:line and prescribed
fix, F1/F2 rulings, log paths. Final text to the ticket-owner: verdict, counts, gate lines, report
and evidence paths. Raw facts only. If blocked, `STATUS: NEEDS_CONTEXT` + question; any message you
send starts with `SC-706:`.
