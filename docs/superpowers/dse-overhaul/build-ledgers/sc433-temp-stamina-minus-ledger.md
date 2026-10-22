# SC-433 decisions ledger — Temporary Stamina minus and lower typed value do nothing

Ticket: https://linear.app/tski-home/issue/SC-433
Worktree: /home/scott/code/steelCompendium/worktrees/sc433-temp-stamina-minus (every submodule on branch `sc433-temp-stamina-minus`)
Repo touched: draw-steel-elements (tracked branch `develop`, cut at `3973b56`); superproject (CHANGELOG) cut at origin/main `262dad6`.

## Spec (ticket description, verbatim, 2026-10-22)

> **Repro:** open the stamina modal on a block with temporary Stamina 5. The "Decrease Temporary Stamina" button is enabled, but clicking it changes nothing. Typing a lower number into the temp field is also ignored. The minus never lowers temp at all, even right after raising it with "+" in the same session (5, then "+" twice gives 7, then "−" stays at 7). Only Damage, Kill or Full Heal can lower temp, so a mistyped 50 instead of 5 cannot be fixed after Apply.
>
> **Cause:** `src/views/StaminaEditModal.ts` (temp stepper, around lines 418–447) applies "take the higher" to every edit: `granted = Math.max(value, currentTempStamina + this.pendingTempStaminaChange)`. That comes from an earlier agent fix (SC-133 RC-5) modelling Draw Steel's "temporary Stamina doesn't stack, keep the higher" rule. It also breaks the file's own CB-8 rule ("never a silent no-op").
>
> **Ruling (Scott, verbatim):** "I like your recommendation"
>
> The recommendation: make the temp field a direct edit, like the Stamina field. Keep "keep the higher" only for gaining temp from an effect.
>
> **Fix:** the temp stepper and typed value set temp directly, minus included. If the modal has a "gain temporary Stamina" path, it keeps take-the-higher.
>
> **Tests:** existing jsdom tests pin the current behaviour (SEM "the minus button cannot walk temp below the session-start value"; SC-408 titles ending "[current behaviour — ruling pending SC-408]"). They become known-bug markers citing this ticket; the fix flips them.

## Scott rulings (verbatim, dated)

- 2026-10-18 (on SC-408, quoted in the ticket): "I like your recommendation"

Thread had 0 comments at 2026-10-22 start.

## Owner decisions

- 2026-10-22: Pipeline = implementer (r1) -> independent reviewer -> fix rounds -> scoped re-review -> land-ready. No new user-facing copy or UI, so no Scott evidence round before land-ready; the land-ready comment carries before/after evidence.
- 2026-10-22: Temp field and its +/- stepper are a direct edit (floor 0, same clamp as today for negatives), exactly like the Stamina field. Damage/Kill/Full Heal interplay with temp is unchanged. If the survey finds a separate "gain temporary Stamina from an effect" path in the modal (or a host API that grants temp), that path keeps take-the-higher; if none exists, nothing is added (no new UI).
- 2026-10-22: Target e2e 98/98 ok, 0 known-bug. Lifecycle scenario G-S27 is optional — add one only if a note-file round trip (lower temp, Apply, reopen) is not already covered by e2e.

## Round log

- 2026-10-22: worktree created (rc 0). dse origin/develop 3973b56, workspace origin/main 262dad6.
- 2026-10-22 r1: implementer A (orchestration:implementer, agent a90174c4473d63b69) dispatched on `sc433-brief-r1-impl.md`. Identity A never reviews; review goes to reviewer B (Opus). Ticket Backlog -> Awaiting.
- 2026-10-22 r1 DONE (A): dse e0b14f3 (d20a57a fix+tests, e0b14f3 e2e T14 reopen) on 3973b56; superproject CHANGELOG 78e4d6b. No effect-grant temp path exists anywhere (take-the-higher removed entirely, no UI added). Gates: tsc/lint clean; jest 5699/1/238 of 239; lifecycle 31/31 (no G-S27 — e2e T14 covers lower/Apply/reopen); e2e 100/100 ok, 0 failed, 0 known-bug, 66/66; shots 580; freeze 280/280; parity 0/0/24. Follow-up (A): refresh dse-verify CURRENT at landing -> ruled: dispatcher's landing bookkeeping, not a ticket.
- 2026-10-22 r1 review: reviewer B (orchestration:reviewer) dispatched on `sc433-brief-r1-review.md`.
- 2026-10-22 (dispatcher): dse develop moved 3973b56 -> 424f47b (SC-361: Conditions-modal swatch check mark/focus ring, styles-source.css block "F.", new e2e COND-E07). New baselines: jest 5703/1/238 of 239; lifecycle 31/31; e2e 96/99 ok, 0 failed, 3 known-bug (SC-433), 66/66; shots 580 (no ALLOWLISTED line); freeze 280/280; parity 0/0/24. Land-ready must be on 424f47b or newer, superproject rebased onto origin/main. Owner plan: rebase folds into the post-review fix round (implementer A); if review approves clean, a rebase-only round by A. Expected after rebase: jest ~5706/1, e2e 101/101 ok, 0 failed, 0 known-bug, 66/66.
  Superproject origin/main now 415c086.
- 2026-10-22 r1 review DONE (B, agent a6c51aacb9f4bcf1d): APPROVE. 0 CRIT/HIGH/MED, 1 LOW, 4 INFO. B measured at e0b14f3: tsc/lint clean, jest 5699/1/238 of 239, e2e 100/100 ok, 0 known-bug, 66/66. Revert-to-3973b56 run: 9 branch tests fail (discriminating).
  Owner rulings on findings:
  - LOW-1 (hand-edited NEGATIVE stored temp breaks Damage/Full Heal math: temp -3, Damage 5 takes 8 and labels "Gain 3 Temp Stamina"; StaminaEditModal.ts:296, :400-403, :528, :545) -> FOLD into r2 (same file, same temp math, one-line clamp: read stored temp as Math.max(0, …) for all math). Must not write a key/value the user didn't change unless the user acts (Apply after Damage/Full Heal writes the clamped result).
  - INFO-1 (develop moved to 424f47b; CHANGELOG Unreleased merge) -> r2 rebase.
  - INFO-2 (no-temp block: raise writes key, back to 0 removes it) -> drop, correct per SC-466/SC-482.
  - INFO-3 (initiative write fills temp_stamina: 0 on untouched creatures) -> drop, already covered by Backlog SC-485 ("Initiative tracker writes default keys the user never wrote … per-creature stamina").
  - INFO-4 (B's random probe is a regression net only) -> drop, informational.
- 2026-10-22 r2: implementer A resumed for rebase onto dse 424f47b + superproject 415c086 + LOW-1 fold (brief `sc433-brief-r2-fix.md`). Scoped re-review of the r2 delta goes to reviewer B (not an author).
- 2026-10-22 r2 DONE (A): dse e4c5cf6 (7db087f fix+tests, 52271b1 e2e T14, e4c5cf6 LOW-1) on 424f47b; superproject fb6a3f8 on origin/main 89bd345 (CHANGELOG conflict: kept both bullets). LOW-1: currentTempStamina = Math.max(0, temp_stamina ?? 0) in onOpen. Any Apply on negative stored temp writes 0, incl. Stamina-only Apply -> owner accepts (user acted; normalizes invalid data). Gates: tsc/lint clean; jest 5711/1/238 of 239; lifecycle 31/31; e2e 101/101 ok, 0 failed, 0 known-bug, 66/66; shots 580; freeze 280/280; parity 0/0/24.
- 2026-10-22 r2 scoped re-review: reviewer B resumed on `sc433-brief-r2-rereview.md`.
- 2026-10-22 r2 re-review DONE (B): APPROVE, 0 CRIT/HIGH/MED/LOW, 2 INFO (both drop: INFO-1 = accepted Stamina-only Apply writes clamped 0; INFO-2 = one LOW-1 test non-discriminating but pins no-write, keep). B measured at e4c5cf6: tsc/lint clean, jest 5711/1/238 of 239, e2e 101/101 ok, 0 known-bug, 66/66. LAND-READY: dse e4c5cf6 on 424f47b, superproject fb6a3f8 on 89bd345.
