# SC-588 decisions ledger — initiative: keyboard focus drops to the page after a whole-tracker rebuild

Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05
Worktree: /home/scott/code/steelCompendium/worktrees/sc588-initiative-focus-after-rebuild (every submodule on branch `sc588-initiative-focus-after-rebuild`)
Base: dse `develop` @ `4f0c87f2`

## Spec (ticket description, verbatim, 2026-11-11)

> Any initiative action that rebuilds the whole tracker leaves keyboard focus on the page body. A keyboard user who presses Advance round, Make/Relieve captain, Reset turns, Reset encounter → Yes, or Enter in the Malice quick-add box has to Tab back in from the top of the note.
>
> Cause: the tracker's actions call a full rebuild (`src/elements/initiative/view.ts:163-170` → `src/framework/view.ts:217-226`), which replaces the focused node without restoring focus. Fix shape from SC-518: remember the focused control's `data-dse-control` id (and instance key) before the rebuild and refocus its successor after.
>
> Real-Obsidian repro probes: SC-437 review r2, ZZ-F1..F3. SC-437 carries a marker citing this ticket.

## Scott rulings

(none yet — the ticket is fully specified; no decision needed so far)

## Owner rulings

- 2026-11-11 — Scope is the five actions named in the spec. SC-589 (a whole-tracker rebuild loses a HALF-TYPED Malice quick-add value) is OUT of scope — do not fix it here; it is its own Backlog ticket.
- 2026-11-11 — The SC-588 known-bug marker in the e2e suite (from SC-437) must become a plain passing e2e test, and SC-588 comes off the e2e known-bug list (the SC-578 precedent: INIT-M09). Expected e2e after the fix: 0 failed, known-bug count 4 (SC-257, SC-355, SC-384, SC-580), coverage Y/Y pairs.
- 2026-11-11 — Real-Obsidian coverage goes in e2e, not lifecycle. Add a lifecycle scenario only if e2e cannot express it; if one is needed it is G-S88 in part 5 (never a new G-S64 phase — part 3 sits at the ~480 s line).
- 2026-11-11 — Where the focused control no longer exists after the rebuild (e.g. Make captain → the button becomes Relieve captain; Reset encounter → Yes from a confirm modal), focus goes to the control that replaced it in the same place; if nothing sensible exists, the tracker's own focusable root — never the page body. Implementer documents the mapping per action in its report.

## Rounds

- r1 (2026-11-11) — implementer (orchestration:implementer, identity A) dispatched on `sc588-brief-r1-implement.md`; report → `sc588-r1-impl-report.md`. Ticket → Awaiting.
- 2026-11-11 — Base moved: SC-592 landed, dse `develop` is now `79da77f8` (supersedes `4f0c87f2`). SC-592 touched `src/elements/initiative/model.ts` (plain-string conditions stay plain strings on write; authored condition objects keep unknown keys and key order), initiative jest tests and e2e POOL-C09, POOL-C10, COND-R06. Branch must rebase onto `79da77f8` before land-ready. New CURRENT at `79da77f8`: jest 7262 passed / 1 skipped css cached (about 7261 / 2 fresh) · lifecycle 55/55 · e2e `264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` (after SC-588: 0 failed, 4 known-bug) · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24. Implementer told mid-round by SendMessage.
- r1 DONE (2026-11-11) — dse HEAD `d62803db` (fix `40f760f9`) on `79da77f8`; superproject `9dd7cbf8` (CHANGELOG). Gates: tsc/lint clean · jest 7279 / 2 skipped fresh · lifecycle 55/55 · e2e `270/274 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` · styles.css identical to clean 79da77f8 → shots/freeze/parity carry. Helper `src/framework/kit/controlFocus.ts`, used only in `src/elements/initiative/view.ts`.
  - Follow-up "other rebuildAndPersist callers via modals (squad-pool, grid edits) may lose focus": PENDING — reviewer r2 to confirm/refute; owner rules after (Backlog ticket if real).
  - Follow-up "dse-verify CURRENT numbers need updating at land": dispatcher's landing bookkeeping — relay in land-ready report.
- r2 (2026-11-11) — independent reviewer (orchestration:reviewer, identity B) dispatched on `sc588-brief-r2-review.md`; report → `sc588-r2-review-report.md`.
- 2026-11-11 — Base moved again: SC-597 landed, dse `develop` is now `e5b6f9f2` (supersedes `79da77f8`). SC-597: Enter/Space on the stamina bar and a montage cell activate with el.click(), montage cell keydown guards, comment in `managedModal.ts`; new lifecycle scenario G-S87. Lifecycle is now 56 scenarios: part 5 is `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87` (6; ~347 s), G-S56 still last. New CURRENT at `e5b6f9f2`: jest 7283 passed / 2 skipped (fresh worktree) · lifecycle 56/56 (21 + 16 + 9 + 4 + 6) · e2e `264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24. Plan: r2 review continues on `d62803db`; the post-review round (fix or rebase-only) rebases onto `e5b6f9f2` and re-runs the full battery there before land-ready. Reviewer told to also check SC-597's `managedModal.ts` change against the Reset encounter → Yes focus path.
- r2 DONE (2026-11-11) — reviewer verdict FIX (wording only); 0 HIGH / 1 MEDIUM / 2 LOW / 6 INFO; reviewer gates at `d62803db` match r1 (jest 7279/2, lifecycle 55/55, e2e 270/274 · 0 failed · 4 known-bug · 169/169). SC-597 diff: no interaction (no shared files; managedModal.ts comment-only; tracker stamina bars are `keyboard: false`).
- Owner rulings on r2 (2026-11-11):
  - MEDIUM-1 (Live Preview: focus restored, then lost ~0.4 s later when the tracker's own write redraws the widget; pre-existing, generic — counter + too) → option (a): qualify both changelog entries to Reading view and cite the new ticket; FILED **SC-602** (Backlog, related SC-588). Not widened into SC-588: the cause is the host's Live Preview write path and affects every element. Tell Scott plainly in the final comment that Live Preview still loses focus (SC-602).
  - LOW-1 (changelog "a mouse click moves no focus" is not quite true when focus is in a quick-add box) → FOLD: reword to "A mouse click never pulls focus into the tracker".
  - LOW-2 (dse CHANGELOG line wrap ~210 chars vs ~125 neighbours) → FOLD: re-wrap.
  - Implementer follow-up (pool modal / roster cell edit lose focus) → CONFIRMED by reviewer; FILED **SC-603** (Backlog, related SC-588). Out of scope here.
  - INFO 6 (orphan `Xvfb :160` PID 774183 from this worktree) → owner verified cwd inside the sc588 worktree and killed it by PID; gone.
  - Other INFO → no action.
- r3 (2026-11-11) — implementer (identity A, resumed) on `sc588-brief-r3-fix-rebase.md`: rebase onto `e5b6f9f2`, changelog wording (MEDIUM-1(a), LOW-1, LOW-2), full battery. Scoped re-review after → reviewer identity B (it did not author code).
- r3 DONE (2026-11-11) — dse HEAD `a39eaabd` (fix `a031e23e`, tests `c818debc`, wording `a39eaabd`) on `e5b6f9f2`, clean rebase; superproject `3ec78c55` on `9dd7cbf8`. Gates: tsc/lint clean · jest 7301 / 2 fresh (7283 + 18) · lifecycle 56/56 (21+16+9+4+6) · e2e `270/274 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` · styles.css sha256 = clean e5b6f9f2 build (`5e5ff488…2b27`) → shots 592 / freeze 280/280 / parity 0/0/24 carry.
- r4 (2026-11-11) — scoped re-review, reviewer identity B resumed, on `sc588-brief-r4-rereview.md`.
- 2026-11-11 — Base moved a third time: SC-570 landed, dse `develop` is now `ce4937ef` (supersedes `e5b6f9f2`; test code only: RECOV-R07 e2e spec and staminaRecoveries jest, plugin untouched). New CURRENT at `ce4937ef`: jest 7286 passed / 2 skipped (fresh) · lifecycle 56/56 (21 + 16 + 9 + 4 + 6) · e2e `264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24. RECOV-R07 is no longer a known load flake — a red there is a real signal. Plan: r4 re-review continues on `a39eaabd`; then r5 (implementer) rebases onto `ce4937ef` and re-runs tsc, lint, jest, e2e; lifecycle carries only if the built `main.js` sha256 equals the `a39eaabd` build (else re-run all five parts); owner checks the range-diff is unchanged.
- r4 DONE (2026-11-11) — reviewer LAND-READY on `a39eaabd` / superproject `3ec78c55`; 0 HIGH/MEDIUM/LOW, 2 INFO (jest +18 fully accounted: matrix +9, controlFocus +7, kit-index +2; base moved). Range-diff faithful. Reviewer re-ran e2e `270/274 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` (RECOV-R07 passed) and lifecycle part 5 6/6.
- r5 (2026-11-11) — implementer resumed on `sc588-brief-r5-rebase.md` (rebase onto `ce4937ef`, re-gate). Owner checks range-diff after; no further review if SC-588 commits are unchanged.
- r5 DONE (2026-11-11) — dse HEAD `e0e49d4d` (fix `3ee1b18f`, tests `9d3cda98`, wording `e0e49d4d`) on `ce4937ef`; owner verified range-diff all `=` vs reviewed `a39eaabd`, fast-forward from origin/develop OK. main.js sha256 `607c7bd5…4269` and styles.css `5e5ff488…2b27` identical pre/post → lifecycle 56/56, shots 592, freeze 280/280, parity 0/0/24 carry. jest `7304 passed, 2 skipped`; e2e `270/274 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` (RECOV-R07 passed). Superproject `3ec78c55` (CHANGELOG ×2 on stale pin `3eb1adbd`), dse pointer unstaged. → LAND-READY.
- 2026-11-11 — Land-ready comment posted to SC-588 (state left Awaiting; Done is set at landing via linear-post.py --state Done, verified). Reported land-ready to dispatcher.
