# SC-433 r2 scoped re-review brief

You reviewed r1 (APPROVE, LOW-1 negative stored temp). Scope now is ONLY the r2 delta. Your r1 brief's §1 rules and §3 command rules still apply (`sc433-brief-r1-review.md` in the ledger dir) — no branch edits, private scratch folder `.../scratchpad/sc433-r2-review/`, `git -C` only, one blocking foreground gate per Bash call, no background jobs, no glob rm, kill only own PIDs. Workers never call the tracker. Final text goes to the ticket-owner.

Read: ledger `decisions.md` (r1 rulings), the r2 brief `sc433-brief-r2-fix.md`, and the implementer's `sc433-r2-fix-report.md`.

Heads under review: dse e4c5cf6 (7db087f, 52271b1, e4c5cf6 on 424f47b), superproject fb6a3f8. Implementer note: any Apply on a negative stored temp writes the clamped 0, including a Stamina-only Apply (owner accepts: the user acted; confirm nothing is written without an Apply).

Check:
1. **Rebase integrity:** dse branch is on `origin/develop` (424f47b or newer); `git -C <dse> range-diff 3973b56..e0b14f3 <new-base>..HEAD` shows the r1 commits unchanged apart from context; superproject branch is on origin/main (415c086 or newer; implementer rebased onto 89bd345), CHANGELOG `## Unreleased` keeps SC-361's bullet AND the SC-433 bullet, and the dse pointer is NOT committed.
2. **LOW-1 fix:** probe your own scenario again (your `probe2-negative-temp.test.ts`): stored temp −3 → Damage 5 takes 5 Stamina; no "Gain … Temp" in labels for Damage or Full Heal; temp field shows 0 with "−" disabled; open+cancel writes nothing; Apply after an action writes a sane value. Check the clamp touches every temp read in `StaminaEditModal.ts` and changes nothing for temp ≥ 0. The new tests must fail with the clamp reverted.
3. Re-run tsc, lint, jest and e2e on the new head. Expected: jest ≈ 5706 + LOW-1 tests / 1 skipped; e2e `101/101 ok, 0 failed, 0 known-bug, coverage: 66/66 pairs`. Spot-check the implementer's shots/freeze/parity logs exist and read 580 / 280/280 / 0/0/24.

Report `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc433-temp-stamina-minus/sc433-r2-rereview-report.md` with a ≤10-line executive summary (APPROVE / FIX REQUIRED, findings by severity with file:line, measured numbers). Return raw facts + absolute paths. If you need input, end with STATUS: NEEDS_CONTEXT.
