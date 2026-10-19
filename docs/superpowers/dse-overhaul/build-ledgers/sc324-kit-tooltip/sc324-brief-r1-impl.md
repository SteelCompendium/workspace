# SC-324 round 1 — implementer brief

You implement the SC-324 fix in draw-steel-elements (DSE). You report to the SC-324
ticket-owner, not a human.

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc324-kit-tooltip/decisions.md`
  (the ledger — it is the source of truth for what to build; quote from it, do not reinterpret).
- Read: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  (battery, command shapes, exit-code footgun, freeze rules) and
  `/home/scott/code/steelCompendium/worktrees/sc324-kit-tooltip/draw-steel-elements/AGENTS.md` if present.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc324-kit-tooltip`. Your repo:
  `/home/scott/code/steelCompendium/worktrees/sc324-kit-tooltip/draw-steel-elements`, branch
  `sc324-kit-tooltip`. Verify `pwd`/branch before any write. **Never edit anything under
  `/home/scott/code/steelCompendium/workspace/`** except writing your report into the ledger dir.
- First: `git -C <repo> fetch origin && git -C <repo> rebase origin/develop`. Expected
  `origin/develop` = `0d69ec9` (if it moved, rebase onto the new head and say so).
  `npm ci` if `package.json` changed.
- **Use `git -C <absolute path>` for every git command. Never `cd X; git …`.**
- **Workers never call the tracker (Linear)** — not to read history, not to post.

## 2. The task

The ticket (summarised by the owner, details in its text): Obsidian's `setTooltip(el, text)`
writes only `aria-label`, and the hover renderer reads `aria-label`, so hover text and
accessible name are one attribute. `iconButton()` (`src/framework/kit/iconButton.ts`) calls
`tooltip(buttonEl, opts.tooltip)` and then overwrites `aria-label` with `opts.label`, so any
`tooltip` that differs from `label` is silently discarded. Callers with real explanatory text
lose it (hero Respite, negotiation ArgumentView, CompendiumMigrationModal, plus conditions and
initiative call sites).

Owner decision D1 (verbatim from the ledger):

> Chosen: **(b)** — drop the `tooltip` option and make every caller put its full text in `label`.
>
> Per-call-site string rule (applies to every caller that passed a `tooltip` differing from `label`):
> - The new `label` is the string BOTH a hovering user and a screen-reader user should get.
> - Lead with the action/name (what the button does), then any explanation. If the old tooltip
>   already contains the label's information, use the tooltip text. If the old label is fuller
>   (conditions remove/save buttons), keep the label. Otherwise merge: `<label>: <explanation>`
>   or `<label> — <explanation>`, matching nearby house style.
> - Any later `setLabel(...)` on the same button must produce strings under the same rule (no
>   state flip may drop the explanation back out).
>
> Out of scope: `tooltip()` calls on non-iconButton elements; the post-mount handle (SC-196
> already deleted `IconButtonHandle.setTooltip`).

Concretely:
1. Remove `tooltip?: string` from `IconButtonOptions` and the `tooltip()` call in the mount
   path. Rewrite the `label` JSDoc so it states the contract: `label` is the accessible name
   AND the hover tooltip (Obsidian renders the hover from `aria-label`), so put the full string
   here. Remove the "Known gap (SC-324)" note. Fix the stale comment block around the old
   `tooltip()` call (lines ~112-118).
   - Before deleting the `tooltip()` call, confirm whether a bare `aria-label` still produces
     the Obsidian hover (it should: Obsidian's global hover handler reads `aria-label`; SC-196's
     reviewer decompiled `setTooltip(e,t,n){e.setAttribute("aria-label",t),…}`). If
     `setTooltip` does anything else we need (placement attr, etc.) with no options passed,
     keep a `tooltip(buttonEl, opts.label)` call instead — say which you did and why, with the
     evidence (the decompiled body from the shipped Obsidian `app.js`, or the obsidian
     package's typings + a runtime check).
2. Let `tsc` find every caller (the ticket's line numbers are stale — e.g. ArgumentView now
   lives under `src/drawSteelAdmonition/negotiation/`). For each caller apply the string rule.
   Callers whose `tooltip` equals `label` just drop the field.
3. Tests: replace `test/dom/kit/iconButton.test.ts`'s case that asserts the discard
   (~lines 169-183) with rendered-end-state tests: the mounted button's `aria-label` equals
   `label` (assert the attribute, not a spy). Add a test for at least the three
   explanatory-text sites (hero Respite, ArgumentView, CompendiumMigrationModal) that the
   rendered `aria-label` contains the explanation. Update any jest/e2e test or e2e manifest
   that selects by the old `aria-label` strings — selectors by `data-dse-control` are preferred
   where they exist; do not weaken a test to make it pass.
4. Docs: grep the repo docs (`docs/`, kit spec D2 §2.5 references, `AGENTS.md`) for
   `IconButtonOptions`/`tooltip:` guidance for iconButton and update it to the new contract.
   Add one bullet under `## Unreleased` in the WORKSPACE changelog in YOUR worktree's
   superproject: `/home/scott/code/steelCompendium/worktrees/sc324-kit-tooltip/CHANGELOG.md`
   — never `/home/scott/code/steelCompendium/workspace/CHANGELOG.md`. Look at how recent DSE
   bullets there are phrased and match (user-facing: e.g. "Hovering the Respite button now
   shows its explanation instead of just its name"). Check whether recent DSE tickets ALSO
   added to `draw-steel-elements/CHANGELOG.md` (git log); follow that precedent if so.
5. Commit after every coherent step in the DSE repo (and the superproject CHANGELOG in the
   worktree superproject, separate commit there). Do not push. Do not tag (never create a
   tag or release on draw-steel-elements).

## 3. Gates — full dse-verify battery, in order, all required

Expected numbers on `origin/develop` `0d69ec9` (from dse-verify "CURRENT"):
- tsc (incl. `tsc -p e2e`) clean; lint (incl. `e2e/`) clean.
- jest **4732 passed / 1 skipped / 227 of 228 suites** baseline — yours = baseline + your new
  tests (report the delta and account for it).
- lifecycle `OBSIDIAN-LIFECYCLE done: 25/25 ok, 0 failed` (set your own `DSE_LIFECYCLE_PORT`, e.g. 9291).
- e2e `OBSIDIAN-E2E done: 59/71 ok, 0 failed, 12 known-bug, coverage: 47/47 pairs`, exit 0.
- shots **572**, 0 FAIL, with the in-run lines `text scale OK (…)`, `text scale once OK (…)`,
  `portrait mark parity OK (…)`, `turn mark parity OK (20 comparisons)`.
- freeze `freeze OK (276/276 …)` — this change should move ZERO pixels (aria-label is not
  painted). Any freeze FAIL is a finding: stop and report it, never touch the baseline.
- parity **0 GAPs / 0 undeclared / 24 DECLARED** (last).

Gate footguns:
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc324-kit-tooltip/draw-steel-elements -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc324-kit-tooltip/draw-steel-elements && <cmd>'`.
  Devbox eats `$?`/`$PIPESTATUS` and `| tail` eats failures — run each gate through a small
  wrapper script FILE that writes the exit code to a file, output redirected to a log file.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog
  kills silent agents. Run gates in the FOREGROUND (Bash timeout up to 600000 ms; lifecycle is
  ~4.5 min). Do not background a gate and "wait for a notification" — it will never come.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is
  pre-populated across sessions and branches. Write logs to a per-run unique path, e.g.
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc324-kit-tooltip/sc324-r1-<gate>-<timestamp>.log`.
- **Never `pkill`/`killall` by pattern** — concurrent efforts run the same gates. Kill only
  by PID, and only a PID whose command line contains `worktrees/sc324-kit-tooltip/`
  (`pgrep -af "worktrees/sc324-kit-tooltip/"`).
- Never `rm -rf` the shared `.superpowers/` dir or anyone else's subdir.
- Timeout-shaped red in lifecycle/e2e under load: re-run once on a quieter moment before
  calling it a failure (dse-verify explains).

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc324-kit-tooltip/sc324-r1-impl-report.md`.
It must OPEN with a ≤10-line executive summary (verdict, final DSE sha, superproject sha,
gate numbers). Then:
- **Per-call-site table**: file:line, old `label`, old `tooltip` (the lost string), new
  `label`, which rule branch you applied. Include `setLabel` follow-ups if any.
- What you did about the `tooltip()` call (kept with label / removed) and the evidence.
- Each gate's exact result line and log path.
- `Drive-by fixes:` (only obviously-correct, local to touched files, gate-neutral) and
  `Follow-ups:` (left alone) lists.

If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Your final text goes to the ticket-owner, not a human — raw facts: verdict
(DONE / BLOCKED / NEEDS_CONTEXT), shas, measured numbers, no prose — **plus the absolute path
of every evidence artifact you produced** (report, logs).

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'`
routes to the top-level dispatcher, not me. If you need input mid-task, end your turn with
`STATUS: NEEDS_CONTEXT` and the question in your report; I will resume you. If you ever do
send a message anyway, its FIRST WORD must be `SC-324:`.
