# SC-465 decisions ledger — Stamina modal: keyboard focus lost when a heal button disables itself at max Stamina

Ticket: https://linear.app/tski-home/issue/SC-465
Worktree: /home/scott/code/steelCompendium/worktrees/sc465-heal-focus (every submodule on branch `sc465-heal-focus`)
Repo touched: draw-steel-elements (tracked branch `develop`, cut at `e4c5cf6`); superproject (CHANGELOG) cut at `281eece`, origin/main `6bf71ca`.

## Spec (ticket description, verbatim, 2026-10-22)

> Found by the SC-432 independent review (INFO-2).
>
> **Repro:** open the stamina modal with the keyboard on a hero a few Stamina below max. Press Spend Recovery (or, after SC-432, Heal Recovery Value and confirm). The heal reaches max, the button becomes disabled while it holds focus, and focus drops to the document body. The next Tab starts from the top of the page instead of inside the modal.
>
> Same shape as SC-428 MEDIUM-1 (Catch Breath), which fixed it for the Recoveries strip by moving focus to a neighbouring control when the focused button disables.
>
> **Where:** `src/views/StaminaEditModal.ts` — after the SC-432 confirmation's Confirm (~:603, focus returns to the heal button) and on the existing pool path.

## Scott rulings (verbatim, dated)

(none — Backlog ticket filed by the SC-432 owner; thread had 0 comments at 2026-10-22 start)

## Owner decisions

- 2026-10-22: Pipeline = implementer (r1) -> independent reviewer -> fix rounds -> scoped re-review -> land-ready. No new copy or visible UI, so no Scott evidence round; the land-ready comment states where focus goes.
- 2026-10-22: Focus rule (follows the SC-428 M1 precedent in `src/framework/kit/RecoveriesStrip.ts` ~:347): when the heal button disables itself while it holds focus, move focus to the NEXT enabled tab stop inside the modal in DOM order (fall back to the previous one); never `<body>`, never outside the modal. Use `{ preventScroll: true }`. Same rule for the SC-432 confirmation's return-focus (~:601): if the heal button is disabled when the confirmation closes, focus goes to that same fallback, not to the disabled button.
- 2026-10-22: Both heal paths are in scope: pool hero "Spend Recovery" and no-pool hero "Heal Recovery Value" (after Confirm). Other modal controls that can disable themselves while focused (e.g. SC-433 temp "−" at 0, Apply at "No Stamina Change", stepper bounds) are surveyed: a modal-local one in StaminaEditModal.ts with the same shape is FOLDED (same helper); a shared kit component (stepper) fix is NOT made here — report it as a follow-up for an owner ruling.
- 2026-10-22: Target e2e 101 + new tests, 0 failed, 0 known-bug, coverage unchanged pair count unless a new control id is added. No lifecycle scenario expected (no note-file write change); G-S30 reserved if one turns out necessary.

## Round log

- 2026-10-22: worktree created (rc 0). dse origin/develop e4c5cf6, superproject origin/main 6bf71ca.
- 2026-10-22 r1: implementer A (orchestration:implementer, agent a848f00f551a95b7b) dispatched on `sc465-brief-r1-impl.md`. A never reviews; review goes to reviewer B (Opus). Ticket Backlog -> Awaiting.
- 2026-10-22 ~05:46Z: owner + implementer A killed by session-limit 429 mid-r1. State at 08:21Z: dse adb0684 (fix) + 7f83724 (e2e) on e4c5cf6, tree clean, no live processes. Any gate logs from before the kill are of unproven state -> not counted. Resumed A via SendMessage (dispatcher instruction). dse develop still e4c5cf6. Dispatcher: landing hold until SC-279 lands.
- 2026-10-22 r1 DONE (A): dse 7f83724 (adb0684 fix + 6 jest, 7f83724 e2e STAM-Q14/Q15/Q16 + 3 manifest kinds) on e4c5cf6; superproject CHANGELOG 7671c43 on origin/main 6bf71ca. Focus target = Reset (next enabled tab stop); helper `focusNeighbourStop` local to StaminaEditModal.ts. Ring: keyboard heal -> :focus-visible true; mouse -> false. Gates (owner checked: every log postdates the final commit 01:44:46 local; tree clean since): tsc/lint clean; jest 5717/1/238 of 239; lifecycle 31/31; e2e 104/104 ok, 0 failed, 0 known-bug, 69/69; shots 580; freeze 280/280; parity 0/0/24. Discrimination: 3/6 jest + Q14-16 red on unfixed source.
  Owner rulings on A's follow-ups:
  - Kit stepper "−"/"+" disable-at-bound focus loss (src/framework/kit/stepper.ts ~:175) -> filed SC-495 (Backlog, related SC-465/SC-428). OUT OF SCOPE for SC-465.
  - FreeHealConfirmModal dismiss callback focuses a control in a closing Stamina modal when the Stamina modal closes from under it -> reviewer to confirm harmless; drop if so.
  - e2e prints "coverage driven: 70" vs "69/69 pairs" -> reviewer to explain (is a driven pair missing from the manifest, or is the extra one outside manifest scope by design?).
- 2026-10-22 r1 review: reviewer B (orchestration:reviewer, agent afed6150f9bda8c13) dispatched on `sc465-brief-r1-review.md`.
- 2026-10-22 r1 review DONE (B): APPROVE, 0 CRIT/HIGH/MED, 2 LOW, 5 INFO. B measured at 7f83724: tsc/lint rc 0; jest 5717/1/238 of 239; lifecycle 31/31; e2e 104/104 ok, 0 failed, 0 known-bug, 69/69 (shots/freeze/parity skipped: focus-only diff, no CSS/DOM/harness). 6 mutations all red; 13 real-Obsidian probes green (incl. initiative host, Space key, Cancel/Escape/X, Shift+Tab, below-max last Recovery).
  Owner rulings:
  - LOW-1 (CHANGELOG bullet omits "last Recovery spent below max" case) -> FOLD into r2.
  - LOW-2 (test var `kill` names a Full Heal button, test/dom/views/stamina-edit-modal.test.ts:1449) -> FOLD (rename `fullHeal`).
  - INFO-5 (helper unit test leaves its root div in document.body, test file :1457) -> FOLD (remove it after the test).
  - INFO-1 (helper selector's `[tabindex]` would accept a disabled tabindexed button; not reachable in this modal) -> note added to SC-495 (harden if the helper is reused there); not changed here.
  - INFO-2 (ring decided at heal-press time; keyboard press + mouse Confirm shows ring) -> DROP, defensible.
  - INFO-3, INFO-4 -> DROP, informational (hero-sheet host shares the code path; e2e pins the ring).
  - Owner Q1 coverage 70 vs 69: extra pair is `(page) press:Backspace`, excluded by design (e2e/run.mjs:437, since SC-408), present on base -> no action.
  - Owner Q2 FreeHealConfirmModal dismiss-on-close: confirmed harmless, identical to base -> DROP.
- 2026-10-22 r2: resume implementer A on `sc465-brief-r2-fix.md`. Scoped re-review of the delta -> reviewer B.
- 2026-10-22 r2 DONE (A): dse ad52688 (test-only: fullHeal rename, root.remove()) on 7f83724 / base e4c5cf6 (origin/develop unmoved); superproject 4a90f63 (CHANGELOG clause) on dcca8c5 (r1 CHANGELOG rebased) on origin/main acaa6f4 (moved from 6bf71ca, handoff doc only, clean). Gates: tsc/lint rc 0; jest 5717/1/238 of 239; e2e 104/104 ok, 0 failed, 0 known-bug, 69/69. No src/ change.
- 2026-10-22 r2 scoped re-review: reviewer B resumed on `sc465-brief-r2-rereview.md`.
- 2026-10-22 dispatcher: landing hold lifted; SC-279 landed, dse develop e4c5cf6 -> c0e761b (roll strip UX, 16 files incl. visual-harness/entry.ts + shoot.mjs; 12 new shots; 2 roll print lines rebaselined in shared freeze baseline). Baselines at c0e761b: jest 5737/1/238 of 239; lifecycle 31/31; e2e 101/101, 0 known-bug, 66/66; shots 592; freeze 280/280 (older branch reads 2 roll mismatches); parity 0/0/24. Land-ready must be on c0e761b+, superproject rebased onto origin/main.
  Owner plan: let B's r2 scoped re-review finish on ad52688 (it is running jest/e2e in the worktree; a rebase under it would invalidate its run). Then r3 = rebase round by A (`sc465-brief-r3-rebase.md`), full battery. Expected: jest 5743/1/238 of 239; lifecycle 31/31; e2e 104/104, 0 failed, 0 known-bug, 69/69; shots 592; freeze 280/280; parity 0/0/24. Zero conflicts -> no re-review; any hand-resolved conflict in src/ or test/ -> scoped range-diff check by B.
- 2026-10-22 r2 re-review DONE (B): APPROVE, 0 CRIT/HIGH/MED/LOW, 1 INFO (CHANGELOG headline says only "when a heal fills Stamina"; body covers last Recovery) -> DROP, body is accurate. B measured at ad52688: jest 5717/1/238 of 239; e2e 104/104 ok, 0 failed, 0 known-bug, 69/69. Superproject range-diff 7671c43 = dcca8c5.
- 2026-10-22 r3: resume implementer A on `sc465-brief-r3-rebase.md` (rebase onto c0e761b + origin/main, full battery).
- 2026-10-22 r3 DONE (A): dse e8f6a14 (ab70ad4 fix+jest, 59017c7 e2e, e8f6a14 folds) on c0e761b, zero conflicts -> no re-review (owner ruling). Superproject c2b8d18 (d216e3d, c2b8d18) on origin/main 636c122; one CHANGELOG Unreleased conflict with SC-279's bullet, both kept, ours first -> docs-only, no re-review. Gates on final head: tsc/lint rc 0; jest 5743/1/238 of 239; lifecycle 31/31; e2e 104/104 ok, 0 failed, 0 known-bug, 69/69; shots 592 (0 FAIL); freeze 280/280; parity 0/0/24. Owner verified: both heads fast-forward from origin, dse tree clean (superproject shows only the expected unstaged dse pointer), no live processes.
- 2026-10-22: land-ready comment posted (`sc465-comment-landready.md`); reported LAND-READY to dispatcher.
