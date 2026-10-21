# SC-432 r2 fix brief (implementer A, resume)

Same worktree, branch, footguns, gate wrapper rules and return contract as `sc432-brief-r1-impl.md` (re-read sections 1, 3 and 5 if this is a fresh agent). Workers never call the tracker. First `git -C <dse> fetch origin`: if origin/develop moved from `ab34293`, rebase onto it and report the new base.

Review report: `sc432-r1-review-report.md` (same dir). Owner rulings, verbatim from the ledger:

> - LOW-1 (e2e driver finds Obsidian's X/backdrop page-wide, so the confirmation's X and click-outside paths have no e2e coverage): FOLD. Scope `modal.close` / backdrop lookup to the scope root's own `.modal-container`; add `[STAM-Q13X]` (confirmation X and click-outside each close only the confirmation, pending edit survives, nothing staged).
> - LOW-2 (dialog always states the full Recovery value, e.g. "(10)", even when the heal is capped and stages +5): FOLD with owner wording — keep "(N)" as the Recovery value and add that the heal stops at maximum Stamina, e.g. "heals one Recovery's worth of Stamina (10), stopping at maximum Stamina". Always true; no per-press arithmetic in the copy. Scott sees the final copy at the evidence post.

Reviewer's LOW-1 text: `e2e/driver/dse.ts:84` (and `:54-55`) — the driver finds Obsidian's own X and backdrop in the whole page, not inside the modal you ask about; with the confirmation open, `dialog.control('modal.close')` hits the Stamina modal's X underneath.
Reviewer's LOW-2 text: `src/views/StaminaEditModal.ts:594` and `src/views/FreeHealConfirmModal.ts:27`.

OUT OF SCOPE (filed, do not touch): SC-465 (focus lost when a heal button disables itself at max), SC-466 (legacy stamina-bar write adds default keys). Everything else in the review was dropped.

Make sure the LOW-1 driver change does not weaken any existing test (check every `modal.close` / backdrop caller still targets the modal it means). Update jest/e2e for the new copy; if the screenshot (c) copy changes, regenerate `evidence/sc432-c-confirmation-over-stamina-modal.png` from real Obsidian (scratch spec, deleted after). Update the CHANGELOG bullet only if it quotes the copy.

Gates: full battery again (tsc, lint, jest, lifecycle, e2e full, shots, freeze, parity). r1 numbers: jest 5292/1/230 of 231 · lifecycle 27/27 · e2e 88/91 ok, 0 failed, 3 known-bug, 59/59 · shots 572 · freeze 276/276 · parity 0/0/24. Expect e2e +1 ok (Q13X), 0 failed, 3 known-bug.

Logs: `sc432-r2-<gate>.log`. Report: `sc432-r2-fix-report.md` with a ≤10-line executive summary (shas, gate numbers, final dialog copy). Final text: raw facts + absolute artifact paths. NEEDS_CONTEXT if blocked; you cannot SendMessage me.
