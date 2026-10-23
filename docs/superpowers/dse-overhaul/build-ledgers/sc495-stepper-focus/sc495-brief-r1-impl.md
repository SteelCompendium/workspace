# SC-495 r1 — implementer brief: kit stepper keeps keyboard focus when "−"/"+" disables itself

You are the implementer. Your final text goes to the SC-495 ticket-owner, not a human.

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc495-stepper-focus/decisions.md` (the ledger — current-state truth; it overrides anything else you read).
- Precedent (same bug pattern, already fixed for one modal): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc465-heal-focus/sc465-r1-impl-report.md` (executive summary + approach) and `draw-steel-elements/src/views/StaminaEditModal.ts` `focusNeighbourStop` (~:240-262), plus SC-428 M1 in `src/framework/kit/RecoveriesStrip.ts` (~:347).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc495-stepper-focus`, every submodule on branch `sc495-stepper-focus`. Repo you change: `draw-steel-elements` (tracked branch `develop`). Verify with `git -C /home/scott/code/steelCompendium/worktrees/sc495-stepper-focus/draw-steel-elements rev-parse --abbrev-ref HEAD` before any write; it must print `sc495-stepper-focus`.
- Fetch-and-rebase first: `git -C <dse path> fetch origin` then `git -C <dse path> rebase origin/develop`. Expected origin/develop = `53e1e48` (your branch is already on it). If it moved, rebase, run `npm ci` if `package.json` changed, and report the new sha.
- **You never call the tracker (Linear)** — not to read history, not to post.
- The main checkout `/home/scott/code/steelCompendium/workspace` is shared global state — never write there except your report file in the ledger dir. Its dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and expected; do not flag or touch it.
- Workspace-level files (CHANGELOG.md) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc495-stepper-focus/CHANGELOG.md` — never under `/home/scott/code/steelCompendium/workspace/`.

## 2. The task

The kit stepper (`src/framework/kit/stepper.ts`, `render()` ~:167-178) sets `disabled` on "−" at `min` and "+" at `max`. When that button holds focus, Chromium drops focus to `<body>`; the next Tab starts at the top of the page.

Ticket spec (verbatim): "When the focused button disables itself, move focus to a neighbouring enabled control (for a stepper, the value input is the natural target) with `preventScroll`. Add an e2e scenario with real keys."

Owner decision (verbatim from the ledger, 2026-10-23) — implement exactly this:

> FOCUS TARGET RULE. Only when the button being disabled holds focus (`document.activeElement === btn`) at the moment `render()` disables it:
> - editable stepper -> the value `<input>` (the ticket's fix shape).
> - read-only stepper (no input) -> the value node `.dse-stepper__value`, made programmatically focusable with `tabindex="-1"` (stays OUT of the Tab order, so the Tab sequence of every surface is unchanged). The next Tab then lands on the enabled opposite button.
> - NEVER the opposite button. Reason: Enter auto-repeats on keydown, so a held Enter would click the opposite button and ping-pong the value back and forth; one extra Space/Enter press would undo the user's last step.
> - `{ preventScroll: true }`; ring follows the input that caused it (keyboard -> `focusVisible: true`, pointer -> false), same handoff as SC-465 / adoptView.
> - min === max (both buttons disabled): same target (input / value node).
> - A disable caused by setValue/typed commit while focus is elsewhere moves nothing.

> SC-465's `focusNeighbourStop` stays where it is (StaminaEditModal.ts); NOT moved to the kit, so the ticket's selector-hardening note does not apply. No StaminaEditModal refactor in this ticket.

Things to verify and report (survey, do not expand scope):
1. **Activity order.** Does `render()` run before or after the caller's `onChange` (which may write the note and trigger a redraw/adoption)? The focus move must happen at the moment the button disables, inside the stepper, while the stepper's DOM is live. Confirm `host/adoptView.ts`'s refocus (~:28-59) then restores focus to the value node/input across an adopted redraw (it restores the same element when activeElement is body).
2. **Read-only value node focus ring.** Does a focused `.dse-stepper__value` get a visible keyboard focus ring from existing CSS (kit/global `:focus-visible`)? If none, add the smallest rule using the EXISTING focus-ring token the kit buttons use (no new token). Report whether you added CSS — the owner may need a screenshot for Scott then. `renderValue` callers (SC-377) build the node's content; the node itself is still the stepper's — check the ring looks right on one of those too.
3. **Screen readers.** The value node already has `aria-live="polite"`; focusing it must not double-announce badly. A short note on what you checked is enough; don't add ARIA without reason.
4. **Pointer path.** On Linux Chromium a mouse click focuses the button, so a pointer click at a bound also drops focus to body today. The rule above applies to both; only the ring differs. Determine keyboard-vs-pointer the same way SC-465 did and say how.
5. **No spurious writes.** Moving focus into an editable `<input>` and later out (blur) must not commit or write anything (value unchanged → no `onChange`). Prove it in a test.
6. **Other surfaces.** List every `stepper(` call site briefly (file:line, editable or not). Any site that ALREADY works around this locally — report it; do not remove it unless it now double-moves focus (then remove and say so).

Tests (TDD — write them red against the unfixed source first and record that):
- jest kit unit (`test/` next to the existing stepper tests): "−" to min and "+" to max, editable and read-only; keyboard vs pointer ring; no move when the button was not focused (setValue / typed commit); min===max; `tabindex="-1"` present on the read-only value node and the Tab order unchanged (the value node is not a tab stop); blur from the input after the move fires no `onChange`.
- e2e (real Obsidian, real keys; read `e2e/README.md` first): (a) Stamina modal — Tab to Temporary Stamina "−", press it with the keyboard until 0; assert `document.activeElement` is the stepper's value node/input (not body), the ring is visible, and the next real Tab lands on the "+" (assert by control id). (b) One IN-NOTE stepper whose press writes the note and redraws (look in `e2e/specs/initiative` / `stamina-bar` for one): drive it to its bound with keys, assert the note was written, focus is still inside that stepper after the redraw, and the next Tab lands on the opposite button. If the e2e harness cannot drive an in-note stepper write, STOP that part and instead add lifecycle scenario **G-S35** (the reserved id) in `visual-harness/obsidian-lifecycle.mjs`; follow the SC-478 lifecycle-scenario authoring rule in the dse-verify skill (no timed delays to win races).
- Coverage: if your e2e drives a new (control, kind) pair, add the manifest row(s) under `e2e/manifest/` and report the new Y/Y.
- If an e2e control id you need does not exist, use the stepper's existing `<id>.dec/.inc/.input/.value` stamps.

CHANGELOG: add one bullet under `## Unreleased` in YOUR worktree's `CHANGELOG.md` (superproject), user-facing plain words, e.g. "Steppers (the − / + controls) keep keyboard focus when a press reaches the lowest or highest value: focus moves to the number instead of jumping to the top of the page." Commit it in the superproject on branch `sc495-stepper-focus` (do NOT commit the dse pointer bump — leave it unstaged).

Commit in dse after every coherent step (fix, jest, e2e/lifecycle). Conventional messages prefixed `SC-495`, e.g. `fix(SC-495): …`. No co-author trailers or AI attribution in commits.

## 3. Gates — the `dse-verify` skill

Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery order, command shapes). Run the full battery on your FINAL head, in order: tsc (incl. `tsc -p e2e`), lint (incl. `e2e/`), jest, lifecycle, e2e, shots, freeze, parity.

Expected at dispatch (CURRENT, dse develop `53e1e48`):
- tsc / lint clean
- jest **5840 passed / 1 skipped / 240 of 241 suites** + your new tests (compare only after a shots run, per the skill)
- lifecycle **33/33** (34/34 if you add G-S35)
- e2e **`OBSIDIAN-E2E done: 108/108 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`** + your new tests; coverage stays Y/Y
- shots **592**, 0 FAIL
- freeze **`freeze OK (280/280 …)`** — if any frozen line moves, STOP: do not touch the shared baseline; write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc495-stepper-focus/rebaseline.txt` + before/after crops and report
- parity **0 GAPs / 0 undeclared / 24 DECLARED**

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc495-stepper-focus/sc495-r1-impl-report.md`. It must OPEN with a ≤10-line executive summary (verdict, shas, gate numbers, CSS added yes/no, G-S35 yes/no). Then: survey answers 1-6, test list with red-on-unfixed evidence, gate summary lines verbatim, `Drive-by fixes:` and `Follow-ups:` sections.

If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Your final text goes to the ticket-owner, not a human — raw facts, no prose: STATUS (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED), dse head sha + base sha, superproject sha, each gate's measured numbers, and the absolute filesystem path of every evidence artifact (report, logs, any screenshots, failure bundles).

## 6. Footguns (mandatory)

- **Devbox.** Node/npm are not on PATH. Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc495-stepper-focus/draw-steel-elements -- bash <script-file>`. Never a compound `cd X && devbox run …`; never `cd` inside a compound command. Use `git -C <absolute path>` for every git command.
- **Exit codes.** Devbox's sh wrapper eats `$?`/`$PIPESTATUS`, and `bash -c '…; echo rc=$?'` always records 0. Put each gate in a script FILE that runs the command with output redirected to a log and then writes its own exit code to a file; run the script through devbox; read the gate's summary line from the log. Never pipe a gate into `tail`.
- **Scratch.** The session scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad` is shared by every agent. Make a private subfolder `sc495-r1-impl-<your agentId or a random suffix>/` and put uniquely named scripts and logs only there. Create scratch files with the Write tool, not heredocs.
- **No glob `rm`, ever** (`rm -rf /tmp/dse-obsidian-lifecycle-*`, `rm -f $S/*.rc` are forbidden). Delete only a path you created and recorded. Never `rm -rf` anything under `.superpowers/`.
- **One blocking gate per Bash call, in the foreground.** No `run_in_background`, no `Monitor`, no background jobs. Split lifecycle / e2e / shots into separate calls (each under the 10-minute tool timeout; pass `timeout: 600000`). Redirect long output to a log file rather than streaming it.
- **Never key a wait-loop on a scratch filename or its contents** — the scratch dir is pre-populated across sessions and branches. Read the process's own output or a per-run unique path.
- **Killing processes:** never `pkill`/`killall` by pattern. Kill only by PID, and only a PID whose command line contains `worktrees/sc495-stepper-focus/` or whose `readlink /proc/<pid>/cwd` is inside your worktree. Other efforts run the same gates concurrently.
- **Lifecycle port:** run lifecycle with your own `DSE_LIFECYCLE_PORT` (e.g. 9295) so a concurrent session on 9262 cannot make you exit 2.
- **Stale worktree pin (footgun 4):** if `token-coverage.test.ts` reports phantom missing `--dse-*` rows, compare the D3 token map copies and use `DSE_TOKEN_MAP_PATH` pointed at the main checkout's `docs/superpowers/dse-overhaul/D3-token-map.md`; not a code defect.
- **You cannot `SendMessage` me** — a depth-2 agent cannot address its parent, and `to: 'main'` reaches the dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question; I will resume you. If you ever do send a message anyway, its FIRST WORD must be `SC-495:`.
- Never tag or release `draw-steel-elements`. Never push. Never run `just deploy*` or `just wt-finish`.
