# SC-241 implementer brief — clamp negative input in MinionStaminaPoolModal

## 1. Context loading

- Read the ledger first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc241-minion-heal/decisions.md`.
  It is the source of truth for rulings. **You never call the tracker (Linear)** — not to read, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc241-minion-heal/draw-steel-elements`, branch
  `sc241-minion-heal`. **Verify `pwd` before every write.** Never edit anything under
  `/home/scott/code/steelCompendium/workspace/` except your report file in the ledger dir.
- Fetch-and-rebase first, inside the DSE clone: `git fetch origin && git rebase origin/develop`.
  Expected base: `origin/develop` = `0c132d8`. If it moved, rebase anyway and note the new sha.
- Read `draw-steel-elements/AGENTS.md` and the `dse-verify` skill
  (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`) before running gates.

## 2. The task

Scott's ruling (ticket description, verbatim from the ledger):

> `src/views/MinionStaminaPoolModal.ts:100-105` (`damageInput`, no `min`) and `:126-132`
> (`parseInt`, no magnitude clamp): "Apply Damage" with `-3` heals the minion pool — the
> same class of bug SC-133's RC-3 fixed in `StaminaEditModal`. Out of scope there (different
> modal/operation, and this one surfaces a "minions typically can't regain stamina" warning
> so it isn't fully silent). Apply the same parse-boundary `Math.max(0, …)` clamp + `min="0"`
> and a red-first test.

(Line numbers have drifted; the code is now the "Apply damage row" block, ~lines 110-150.)

Owner ruling (ledger, verbatim):

> The minion-count input is the same inversion (a negative count times a positive
> damage also heals). `minionCountInput` already has `min="0"` but its `parseInt` is also
> unclamped. Fold it into this fix: clamp BOTH parsed values at the parse boundary with
> `Math.max(0, …)`. Red-first test covers both.

Steps:

1. **Red first.** In `test/dom/views/minion-stamina-pool-modal.test.ts`, add a `describe`
   block (label it `SC-241:`) mirroring the SC-133 RC-3 tests in
   `test/dom/views/stamina-edit-modal.test.ts` (~line 319-360). At minimum:
   - Apply Damage with damage `-3`, minions `1` → pool unchanged (no heal); the
     "can't regain stamina" warning does NOT appear.
   - Apply Damage with damage `3`, minions `-2` → pool unchanged.
   - Apply Damage with damage `-3`, minions `-2` → pool unchanged (the double-negative
     would otherwise read as positive damage — it must be a no-op, not damage).
   - `damageInput` carries `min="0"`.
   - A normal positive case still subtracts (guard against a vacuous suite).
   Run the new tests against the UNFIXED source and confirm they FAIL; record the failing
   count. Commit the tests.
2. **Fix** in `src/views/MinionStaminaPoolModal.ts`: `damageInput.min = '0'`; in the Apply
   Damage `onClick`, clamp both parsed values with `Math.max(0, …)` after the NaN check,
   with an `SC-241` comment pointing at SC-133 RC-3 the way `StaminaEditModal.ts` ~line 337
   does. Keep the change minimal and local. Commit.
3. **Changelog:** add one `[FIX]` bullet at the top of the list under
   `## 7.0.0 (unreleased; previously numbered 6.0.0)` in `draw-steel-elements/CHANGELOG.md`,
   plain language for non-technical users, e.g. that typing a negative number into the minion
   pool's Apply Damage box no longer heals the squad (it now does nothing). Include `(SC-241)`.
   Commit.

Commit after every coherent step. Commit messages: no AI attribution trailers of any kind.

Out of scope: any other modal, any CSS, any refactor of the apply row.

## 3. Gates (dse-verify battery, in order, foreground, output redirected to files)

Expected numbers at dispatch (from `dse-verify`, SC-334 landing on `e4bcd0f`; develop has
since gained SC-278 so jest counts may be slightly higher — report what you measure and the
delta from your own pre-change baseline if you take one):

- `npm run tsc` clean; `npm run lint` clean, exit 0.
- `rm -f main.js styles.css` in the plugin root, then `npx jest` — ~3919+ passed / 1 skipped /
  202 of 203 suites, **plus your new tests**. Zero failures. On timeout-shaped reds in
  settings-tab / settings-preview, check `/proc/loadavg` and re-run before believing them.
- `npm run shots` — 524 PNGs, 0 FAIL (host-copy pin PARTIAL is acceptable).
- Freeze: `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc241-minion-heal/draw-steel-elements/visual-harness/shots`
  — **260/260, 0 FAILED**. This change must move zero frozen bytes. If any frozen shot
  moves, STOP and report — do not touch the baseline.
- `npm run parity` LAST — 0 GAPs / 0 undeclared / 16 DECLARED / exit 0.

Command shape: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc241-minion-heal/draw-steel-elements && npx jest > /tmp/claude-1000/sc241-jest-$$.log 2>&1'`
style — gate command last, nothing chained after it, no pipes; then read the log in a separate
command. Use a per-run unique log path (include `sc241` and a timestamp/PID).

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc241-minion-heal/sc241-impl-report.md`.
It must open with a ≤10-line executive summary.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts only — verdict, final DSE
branch sha (and each commit sha), red-first failing count, every gate's measured numbers,
and the absolute path of every evidence artifact (report, gate logs). List `Drive-by fixes:`
and `Follow-ups:` separately if any.

## Footguns

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is
  pre-populated across sessions and branches, and a stale log from another branch will match.
  Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog
  kills silent agents. Run every gate in the FOREGROUND; never background a gate and wait for
  a notification (it will never come).
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'`
  routes to the dispatcher, not me. If you need input mid-task, end your turn with
  STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway,
  its FIRST WORD must be `SC-241:`.
- Devbox eats `$?`/`$PIPESTATUS`; read each tool's own textual summary as the truth.
- Stale `main.js` shadows `main.ts` for jest — `rm -f main.js styles.css` before `npx jest`.
- Never `rm -rf` anything under `.superpowers/`.
