# SC-430 implementer brief — round 1

## 1. Context loading
- Read FIRST: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc430-apply-click/decisions.md (the ledger — current-state rulings and design calls). Workers NEVER call the tracker (Linear) — not to read, not to post.
- Worktree: /home/scott/code/steelCompendium/worktrees/sc430-apply-click ; repo: its `draw-steel-elements/` on branch `sc430-apply-click`, cut at develop `0d69ec9`. Verify `pwd`/branch before any write. `git -C /home/scott/code/steelCompendium/worktrees/sc430-apply-click/draw-steel-elements fetch origin && git -C … rebase origin/develop` first; expect develop still at 0d69ec9 (report if it moved).
- Use `git -C <absolute path>` for EVERY git command, never `cd X; git …` (a failed cd once ran git in the shared main checkout). Never edit anything under /home/scott/code/steelCompendium/workspace/ — that is the shared main checkout.
- Read /home/scott/code/steelCompendium/workspace/draw-steel-elements/AGENTS.md (or the worktree copy) and /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md (battery, devbox wrapping, exit-code footgun, known-bug rule) before running gates.

## 2. The task
Bug (from the ticket): in `src/views/StaminaEditModal.ts`, open the modal from a `ds-stamina-bar`, type a new value in the Stamina field (focus stays in it), then click Apply on its PADDING. Apply is `disabled` until the field's blur commits the draft; the mousedown lands on a still-disabled button, the blur then enables it, and Chromium never delivers the click. Modal stays open, Apply reads e.g. "Lose 3 Stamina", nothing written. Second click works.

Ticket's fix direction (verbatim): "keep Apply enabled while a draft is dirty (listen to `input`), or commit the draft on `input`/`change` rather than only on blur."

Owner design calls (from the ledger, verbatim):
- D1. Fix is LOCAL to StaminaEditModal; do NOT change the shared kit stepper's commit-on-blur semantics (lifecycle G-S3 pins "a half-typed EDITABLE stepper draft survives the adoption blur — committed only by a later real blur").
- D2. While the Stamina field holds a dirty, parseable draft, Apply's enabled state and label reflect the draft (recomputed on `input`), so the first press lands on an enabled button. Apply's click commits any pending draft through the same path blur uses, then applies (clampStamina still owns the persisted value).
- D3. Same bug class on other typed fields in this modal that gate Apply (e.g. Temp Stamina) — fold in, same mechanism.
- D4. Remove the `knownBug('SC-430', '[STAM-S13] …')` marker; the scenario becomes a plain passing test. Add jest coverage.

Notes:
- If the kit stepper offers no way to read/commit its pending draft from outside, add the narrowest opt-in hook (e.g. an `onDraftInput` callback / `commitDraft()` method) that leaves default behavior byte-identical for every other caller. Say exactly what you added.
- Edge cases to handle and test: draft equal to current value (Apply stays as it would after blur — disabled if nothing changes); unparseable/empty draft (Apply state unchanged from pre-typing); typing then Escape (nothing written — unchanged behavior); typing then blur-then-click (unchanged); the "Lose N"/"Gain N" label matches what Apply will persist after clamp.
- The e2e marker lives in `e2e/specs/stamina-bar/stamina-modal-stepper.e2e.ts` (~line 88). Check e2e for any OTHER marker/test that pins this behavior. Check `CHANGELOG.md` conventions in draw-steel-elements (if it has `## Unreleased`, add a user-facing bullet there).
- Commit after each coherent step (no attribution trailers — Scott's global rule: no Co-Authored-By / Claude attribution in commits). Do not push.

## 3. Gates (full dse-verify battery, in order; numbers current at develop 1a4c6d3 ≈ 0d69ec9, a justfile-only bump)
tsc (incl. `tsc -p e2e`) clean · lint (incl. e2e/) clean · jest 4732 passed / 1 skipped / 227 of 228 suites — EXPECT +your new tests · lifecycle `25/25 ok, 0 failed` · e2e full run baseline `59/71 ok, 0 failed, 12 known-bug, coverage: 47/47 pairs` — EXPECT `60/71 ok, 0 failed, 11 known-bug, coverage: 47/47 pairs` (or more ok if you add scenarios; coverage must be Y/Y) · shots 572, 0 FAIL (in-run lines incl. `text scale OK`, `text scale once OK`, `portrait mark parity OK`, `turn mark parity OK`) · freeze `freeze OK (276/276 …)` via `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc430-apply-click/draw-steel-elements/visual-harness/shots` · parity LAST: 0 GAPs / 0 undeclared / 24 DECLARED.
Expected: no frozen bytes move (the fix is behavior, not first-paint DOM). If freeze moves, STOP and report — do not touch the baseline.
Set your own ports: `DSE_LIFECYCLE_PORT=9287` for lifecycle. Read gate exit codes through a wrapper SCRIPT FILE (devbox eats `$?`; never pipe a gate into tail).

## 4. Report
Write /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc430-apply-click/sc430-report-impl-r1.md — opens with a ≤10-line executive summary.

## 5. Return contract
Your final text goes to the ticket-owner, not a human: raw facts — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), branch head sha, commit list, files changed, each gate's measured line, `Drive-by fixes:` and `Follow-ups:` lists, and the absolute path of every evidence artifact (report, gate logs). No prose.

## Footguns
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Run long gates in the FOREGROUND with a timeout (max 600000 ms) and output to a file; never background a gate and "wait for a notification" — it never comes.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains `worktrees/sc430-apply-click/` (`pgrep -af "worktrees/sc430-apply-click/"`).
- Never `rm -rf` the shared `.superpowers/` dir; only your own `sc430-*` files.
- devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc430-apply-click/draw-steel-elements -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc430-apply-click/draw-steel-elements && <cmd>'`. Run `npm ci` first if node_modules is absent/stale.
- `rm -f main.js styles.css` in the plugin root before `npx jest` (stale main.js shadows main.ts).
- You cannot `SendMessage` me — `to: 'main'` reaches the dispatcher, not me. If you need input, end your turn with STATUS: NEEDS_CONTEXT and the question. If you ever message anyway, the FIRST WORD must be `SC-430:`.
