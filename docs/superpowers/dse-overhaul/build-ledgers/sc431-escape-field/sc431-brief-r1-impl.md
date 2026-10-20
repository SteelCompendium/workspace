# SC-431 r1 — implementer brief

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc431-escape-field/decisions.md` (the ledger — the spec and owner decisions; it supersedes anything you infer).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc431-escape-field`. Repo: its `draw-steel-elements/` submodule, branch `sc431-escape-field`, cut at `origin/develop` = `d58cf6a`. Verify `pwd`/`git -C <abs path> branch --show-current` before any write. **Never write under `/home/scott/code/steelCompendium/workspace/`** except your report file in the ledger dir.
- First: `git -C /home/scott/code/steelCompendium/worktrees/sc431-escape-field/draw-steel-elements fetch origin` and confirm `origin/develop` is still `d58cf6a`; if it moved, rebase onto it and note the new sha.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (the battery) and `draw-steel-elements/AGENTS.md` (if present) and `draw-steel-elements/e2e/README.md` (known-bug markers).
- **Workers never call the tracker** (Linear) — not to read, not to post.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not foreign changes; ignore it and never touch it.

## 2. Task

Spec, verbatim from the ledger:

> **Repro:** open the stamina modal. Press Damage with an amount (so a change is pending). Click into the Stamina or Temporary Stamina field and type a digit. Press Escape to back out of the typing.
>
> **Expected (what the code intends):** the stepper swallows Escape and reverts only the half-typed draft; the modal stays open with the Damage still pending.
>
> **Actual:** Obsidian's modal closes anyway, discarding the draft and every other pending change. The stepper's `stopPropagation` does not stop Obsidian's modal Scope from handling Escape. jsdom tests pass because they cannot see Obsidian's Scope.
>
> **Fix direction:** register the draft-cancel on the modal's Obsidian `Scope` (or intercept Escape in the capture phase) so the first Escape cancels the draft and a second Escape closes the modal. The e2e scenario that records the current behaviour should then flip to asserting the intended one.

Owner decisions (ledger):
- Scope = both the Stamina and the Temporary Stamina steppers in the Stamina modal. Clean-draft Escape must still close the modal (STAM-S07 stays green; STAM-F07a stays green).
- Other Escape-swallowing controls inside Obsidian modals: survey (`grep` for Escape + stopPropagation in `src/`, e.g. `framework/kit/stepper.ts`, `managedModal.ts`, `RecoveriesStrip.ts`, `ConditionsModal.ts`, popovers) and **report** which ones would have the same bug as `Follow-ups:` — do not fix them unless the fix lives in the same shared helper and fixes them for free (then say so explicitly).

What to do:
1. Diagnose first: find how Obsidian's modal Scope consumes Escape (it listens on the window/document keydown before or regardless of the target's bubbling `stopPropagation`). Confirm in real Obsidian via the e2e harness, not only by reading. Pick the mechanism (Scope registration vs capture-phase listener, or a shared helper in `managedModal.ts`/`stepper.ts`) and justify it in the report in ≤5 lines. Prefer a single shared mechanism so every stepper in a managed modal gets it, over a stamina-modal-only patch.
2. Implement. Escape on a dirty draft: reverts the draft only, modal stays open, other pending changes (the Damage) survive. Escape on a clean draft: closes the modal, no write. No listener leaks on modal close/reopen (lifecycle).
3. Flip the e2e known-bug marker: `e2e/specs/stamina-bar/stamina-modal-stepper.e2e.ts` STAM-S06 (currently wrapped as known-bug `'SC-431'` with `failsWith`) becomes a plain passing `it(...)`. Add an equivalent e2e scenario for the **Temporary Stamina** field if one does not exist (draft-Escape keeps the modal open with Damage pending; second Escape closes with no write). Keep the coverage gate passing — if the new scenario drives a new control/press pair, add it to `e2e/manifest/*.ts`.
4. jest: add unit coverage for whatever is unit-testable (e.g. the Scope/capture handler registers, fires only on dirty drafts, unregisters on close). Ship tests per repo conventions.
5. Add a bullet under `## Unreleased` in the **worktree's** `CHANGELOG.md` — `/home/scott/code/steelCompendium/worktrees/sc431-escape-field/CHANGELOG.md`, never the main checkout's. Plain user-facing words, e.g. "Pressing Escape while typing in the Stamina editor now only cancels the typing; a second Escape closes it."
6. Commit after every coherent step (inside `draw-steel-elements`, and the CHANGELOG in the superproject worktree). Do NOT push. Do NOT tag (never create a tag or release on draw-steel-elements).

## 3. Gates

Run the full `dse-verify` battery on the final head, in order: tsc (incl. `tsc -p e2e`), lint (incl. `e2e/`), jest, `npm run obsidian-lifecycle`, `npm run e2e`, `npm run shots`, freeze check, parity last. Expected numbers at dispatch (dse `develop` `d58cf6a`):

- tsc / lint clean.
- jest baseline **4950 passed / 1 skipped / 229 of 230 suites** — expect +N for your new tests, 0 failures.
- lifecycle **`OBSIDIAN-LIFECYCLE done: 26/26 ok, 0 failed`**.
- e2e baseline **`OBSIDIAN-E2E done: 71/76 ok, 0 failed, 5 known-bug, coverage: 51/51 pairs`**. Expected after: S06 flips → **72/76 ok, 0 failed, 4 known-bug** plus any new Temporary-Stamina scenario (e.g. 73/77, 4 known-bug); coverage Y/Y with Y possibly +1.
- shots **572**, 0 FAIL, with `pressed toggle parity OK (96 comparisons …)`.
- freeze **`freeze OK (276/276 …)`** — this change should move no print bytes; if freeze goes red, STOP and report (do not touch the baseline).
- parity **0 GAPs / 0 undeclared / 24 DECLARED**.

Command shapes: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc431-escape-field/draw-steel-elements -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc431-escape-field/draw-steel-elements && npm run e2e > /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc431-escape-field/sc431-r1-e2e-<unique>.log 2>&1; echo rc=$? >> <same log>'` — or wrapper script files that capture the exit code. Devbox's `sh` eats `$?`/`$PIPESTATUS`; never pipe a gate through `| tail`. Run `npm ci` if `package.json`'s obsidian version changed on a rebase.

**Run every gate in the FOREGROUND** (timeout up to 600000 ms per call; split long runs if needed). Do not background a gate and wait for a notification — it will not come.

Footguns (all mandatory):
- Use `git -C <absolute path>` for every git command; never `cd X; git …`.
- Never `pkill`/`killall` by pattern. Kill only by PID, and only a PID whose command line contains `worktrees/sc431-escape-field/` (`pgrep -af "worktrees/sc431-escape-field/"`, check each line).
- Never `rm -rf` a shared `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`) — delete only a path you created and recorded.
- Never `rm -rf` `.superpowers/` or anything in it except your own `sc431-*` files.
- Never edit the freeze baseline.
- A timeout-shaped red in e2e/lifecycle: re-run once on a quiet machine before believing it (dse-verify explains).
- Phantom red in `token-coverage.test.ts`: stale superproject pin — use `DSE_TOKEN_MAP_PATH` pointing at the main checkout's `docs/superpowers/dse-overhaul/D3-token-map.md` (dse-verify / adapter footgun 4).
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.

## 4. Report path

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc431-escape-field/sc431-r1-impl-report.md`. If the report-file write is blocked by your harness, return the report inline. Gate logs go in the same dir with `sc431-r1-` prefixes.

## 5. Return contract

Your final text goes to the ticket-owner, not a human — raw facts, no prose:
- STATUS: DONE | BLOCKED | NEEDS_CONTEXT
- dse branch head sha (and superproject worktree sha for the CHANGELOG commit), commit list
- mechanism chosen (≤5 lines) + files changed
- each gate's measured line (exact strings) and exit code
- `Drive-by fixes:` / `Follow-ups:` lists (incl. the Escape-in-modal survey)
- filesystem path of every evidence artifact (report, every gate log)

The report file must open with a ≤10-line executive summary.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see your completion notification and will resume you with the answer. If you ever do send a message anyway, its FIRST WORD must be `SC-431:`.
