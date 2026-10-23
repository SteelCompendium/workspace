# SC-498 r1 implementer brief

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc498-stamina-bar-keyboard/decisions.md` — read it first.
- Background (the click guard this ticket extends to the keyboard): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc492-stamina-pencil-ledger.md` and the executive summaries of `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc492-stamina-pencil/sc492-r1-impl-report.md` and `.../sc492-r1-review-report.md`. Read summaries only unless you need more.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc498-stamina-bar-keyboard`. The plugin is at `/home/scott/code/steelCompendium/worktrees/sc498-stamina-bar-keyboard/draw-steel-elements`, branch `sc498-stamina-bar-keyboard`, at `9f08f06` (= dse `develop`). Superproject branch `sc498-stamina-bar-keyboard` at `6a176e6`. Verify `git -C <path> branch --show-current` before any write. **Never write under `/home/scott/code/steelCompendium/workspace/`** except your report file in the ledger dir — that is the shared main checkout. The workspace-level files you may edit (CHANGELOG.md) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc498-stamina-bar-keyboard/CHANGELOG.md`.
- Before starting: `git -C /home/scott/code/steelCompendium/worktrees/sc498-stamina-bar-keyboard/draw-steel-elements fetch origin` and confirm `origin/develop` is still `9f08f06`. If it moved, rebase onto it and say so in the report.
- Read `draw-steel-elements/AGENTS.md`, the workspace `DESIGN.md` (in your worktree), and the `dse-verify` skill (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`) before running any gate.
- **You never call the tracker (Linear)** — not to read history, not to post. Everything you need is in these files.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault. It is expected; do not touch or report it.

## 2. Task

Bug: the `ds-stamina-bar` bar opens the Stamina modal on a mouse click only. It has no tab stop and Enter/Space do nothing (`src/framework/kit/StaminaBarPanel.ts`).

From the ticket, verbatim:

> **Expected:** the bar is one tab stop. Enter and Space open the Stamina modal, the same as a click. Focus has a visible ring.

> **Notes:** keyboard presses on chrome buttons inside the bar (the Edit pencil, the collapse button) must not also open the modal. SC-492 adds that guard for clicks; the keyboard path needs the same rule. Lifecycle G-S32 already drives the pencil by Enter and Space.

Steps:

1. **Failing tests first (TDD).** jest: Tab reaches the bar (it is focusable, one tab stop); Enter on the focused bar opens the Stamina modal; Space does too (and does not scroll the page — `preventDefault`); Enter/Space on the Edit pencil, the collapse button and Pin to sidebar (chrome items inside the bar) do NOT open the modal; a mouse click elsewhere on the bar still opens it. Show they fail on base.
2. **Accessibility structure — decide and justify in 3-5 lines.** The chrome cluster (`.dse-stamina__cluster`, real `<button>`s) currently sits *inside* the bar (`src/elements/stamina-bar/view.ts`). Putting `role="button"` on an element that contains other buttons is a nested-interactive violation (screen readers flatten a role=button's children). Look at the DOM and choose the cleanest option, e.g. (a) make a non-chrome child (the track/label region) the focusable `role="button"`, or (b) keep the bar focusable but with a role/labelling that does not hide the chrome buttons. Give it an accessible name that says what it does (e.g. "Edit Stamina" plus current value, or whatever matches neighbouring kit elements' conventions — check how other DSE click-to-open-modal elements name themselves). Mouse click behaviour and the SC-492 click guard must not regress.
3. **Tab stop only where it works.** If there are modes in which a click does NOT open the modal (read-only, preview, sidebar pin, print, missing data — check), the element must not be a tab stop in those modes either. Report which modes exist.
4. **Focus ring.** DESIGN.md line 34: the steel-teal accent "carries every link, active tab, focus ring". First **survey** existing `:focus-visible` rules in `styles-source.css` for clickable non-native-button elements and **reuse that convention** (same token, width, offset). Use `:focus-visible`, not `:focus`, so mouse clicks don't paint a ring. The ring is an outline (a shape cue), never a colour change alone. It must not be clipped by the bar's own overflow/rounded corners and must be absent in print. If there is **no** existing convention to reuse, or the ring cannot be drawn cleanly on this element, stop and return STATUS: NEEDS_CONTEXT with screenshots of your best candidate — that becomes a design ask to Scott.
5. **Focus-ring evidence.** Produce screenshots of the focused bar (ring visible) in **dark and light** schemes, cropped to the element plus a little margin, as PNGs in your scratch folder. Prefer real Obsidian (the lifecycle/e2e harness can capture) or the shots harness — whichever is conventional; say which. Also one crop of the same bar unfocused for comparison.
6. **Real-Obsidian regression.** Add a lifecycle scenario **G-S36** (`npm run obsidian-lifecycle`; look at G-S32 for the shape): Tab to the bar, Enter opens the Stamina modal, close it, Space opens it, and focus stays sensible on close (record where it goes — returning to the bar is the norm). It must fail on base `9f08f06` and pass on your fix — prove both and record the base-failure output in your report. Update the lifecycle file's header scenario count.
7. **Scope fence.** SC-495 (shared stepper focus) is in flight in another worktree: **do not touch `src/framework/kit/stepper.ts`, `src/elements/counter/view.ts`, or the stepper's CSS / tests**, nor the Stamina modal's internal focus handling. Do not touch `FormModal.ts`. If the fix seems to need any of those, stop and return STATUS: NEEDS_CONTEXT.
8. CHANGELOG: one bullet under `## Unreleased` in `/home/scott/code/steelCompendium/worktrees/sc498-stamina-bar-keyboard/CHANGELOG.md` (never the main checkout's). Plain words, user-visible effect. Commit on the superproject branch in the worktree.
9. dse-verify: add the G-S36 row wherever the skill lists lifecycle scenarios (in the worktree's copy, `/home/scott/code/steelCompendium/worktrees/sc498-stamina-bar-keyboard/.claude/skills/dse-verify/SKILL.md`) only if the skill keeps such a list; do NOT edit the CURRENT block (dispatcher's landing bookkeeping).
10. Commit inside `draw-steel-elements` after every coherent step (tests, fix, CSS, lifecycle). Do not bump the superproject's submodule pointer and do not push — landing is not yours.

Drive-by fixes allowed only if obviously correct, local to a file you touched, and unable to move a gate baseline; list them under `Drive-by fixes:`. Anything else goes under `Follow-ups:` and is left alone.

## 3. Gates — full `dse-verify` battery, in its order

Expected numbers at `9f08f06` (CURRENT block in dse-verify):

- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean
- jest **5847 passed / 1 skipped / 241 of 242 suites** — yours higher by the tests you add; report the exact delta. (On a fresh worktree jest reads one fewer passed and 2 skipped until `npm run shots` has run once — dse-verify row 3; compare after shots.)
- lifecycle **34/34** at base → **35/35** with G-S36
- e2e **`OBSIDIAN-E2E done: 108/108 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`** (higher if you add an e2e test; must stay `0 failed`, coverage Y/Y)
- shots **592**, 0 FAIL, with the in-run lines as listed in CURRENT/`907f55c` (host-copy pin OK 1.15.0, button host-leak OK, modal button host-leak OK, text scale OK, text scale once OK, expected `OBSIDIAN APP.CSS PIN DRIFT` warning with rc 0)
- freeze **`freeze OK (280/280 …)`** — no rebaseline expected; a tabindex/ARIA attribute and a `:focus-visible` rule must not move print bytes. If freeze moves, stop and report.
- parity **0 GAPs / 0 undeclared / 24 DECLARED**

## 4. Command footguns (each has cost real time)

- Devbox: use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc498-stamina-bar-keyboard/draw-steel-elements -- <cmd>` (check dse-verify for exact shapes). **Never `cd` inside a compound command.** Use `git -C <absolute path>` for every git command.
- Exit codes: `echo rc=$?` inside `bash -c` under devbox always records 0. Record exit codes by running a **script file** via `devbox run -c <path> -- bash <script>`, and read each gate's own summary line.
- Write scripts/logs/screenshots only in your private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc498-impl-r1/` (create it). Uniquely named files inside. Create scratch files with the Write tool, not heredocs.
- **No glob `rm`** anywhere (`rm -f x/*.rc`, `rm -rf /tmp/dse-obsidian-lifecycle-*` are forbidden). Delete only exact paths you created. Never touch `.superpowers/` outside `sc498-stamina-bar-keyboard/`, never `rm -rf` `.superpowers/`.
- **Run every gate as one blocking foreground Bash call** — lifecycle, e2e and shots as separate calls, each under the 10-minute tool timeout. No `run_in_background`, no `Monitor`, no waiting for notifications. Redirect long output to a log file in your scratch folder rather than streaming it (the 600s stream watchdog kills silent agents); then read the log.
- Never `pkill`/`killall` by pattern — other worktrees run the same gates. Kill only by PID whose command line contains `worktrees/sc498-stamina-bar-keyboard/`, or whose `readlink /proc/<pid>/cwd` is inside the worktree.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is shared across sessions and branches; a stale log from another branch will match.
- `npm ci` if `node_modules` is missing or stale in the worktree.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc498-stamina-bar-keyboard/sc498-r1-impl-report.md`. It must open with a **≤10-line executive summary** (verdict, final shas, gate numbers, the a11y-structure choice in one line, the focus-ring convention reused in one line). Then: tests added (file:test name), the a11y structure choice + justification, the modes survey, the focus-ring survey (which existing rule you matched, file:line), base-failure evidence for jest and G-S36, every gate's summary line, screenshot paths with one-line captions naming what is visible (no colour-only descriptions), `Drive-by fixes:`, `Follow-ups:`.

If the report-file write is blocked by your harness, return the report inline.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), dse sha, superproject sha, measured gate numbers — no prose, plus the absolute path of every evidence artifact you produced (report, logs, screenshots).

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` reaches the dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its first word must be `SC-498:`.
