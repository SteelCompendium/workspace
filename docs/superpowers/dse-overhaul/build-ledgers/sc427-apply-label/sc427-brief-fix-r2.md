# SC-427 implementer — round 2 (fold follow-ups)

Same worktree/branch/footguns/gate expectations as `sc427-brief-impl.md`. Read the ledger's "Owner rulings, round 1" section — F1, F2, F3 are folded into this round, F4 dropped. Quoted verbatim:

- "F1 FOLD: `src/views/MinionStaminaPoolModal.ts:177-178` `parseInt(damageInput.value)` / `parseInt(minionCountInput.value)` — same "1e3 reads as 1" defect; fix with the same `Math.trunc(Number(v))` treatment + jest tests (and flip any existing SC-427/A09-class marker there if one exists)."
- "F2 FOLD: Full Heal on a stored value past max (25/20) stages "Lose 5" — item 2's inverted-control class. Full Heal at or above max is no change (Apply's disabled state/label follow)."
- "F3 FOLD: Apply with only a Temp (or Recoveries) change on an out-of-range stored Stamina silently rewrites current Stamina to the clamp, and the label does not say so. Fix: when the pending Stamina change is 0, Apply leaves `current_stamina` exactly as stored (no silent rewrite); clampStamina still owns every real Stamina change. Test both directions (25/20 and creature −3)."

Also update the CHANGELOG bullets (both) if F1 adds a user-visible fix (the minion pool modal's "1e3").
An independent reviewer is concurrently reviewing `c616e22..9aab55b` from its own scratch worktree — do not rebase or rewrite 9aab55b's history; add new commits on top. Use lifecycle port 9291. If origin/develop has moved past c616e22, do NOT rebase this round — report the new sha.

Rerun the full battery at your new head. Expected: jest ≥ 4873 + your new tests / 1 skipped / 228 of 229; lifecycle 25/25; e2e 71/76 ok, 0 failed, 5 known-bug, 51/51 (unless markers in the pool modal flip); shots 572 0 FAIL + pressed toggle parity OK; freeze 276/276; parity 0/0/24.

Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc427-apply-label/sc427-fix-r2-report.md` (≤10-line executive summary first). Return contract as before: raw facts, head sha, gate lines + rc, new tests, Drive-by fixes / Follow-ups, artifact paths.
