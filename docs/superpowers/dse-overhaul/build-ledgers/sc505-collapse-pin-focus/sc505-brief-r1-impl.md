# SC-505 r1 implementer brief

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc505-collapse-pin-focus/decisions.md` — read it first. It holds the spec and every ruling; it is the source of truth.
- Precedents (same focus-loss family) — read the ledgers; open report bodies only if you need detail:
  - `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc495-stepper-focus-ledger.md` (keyboard-vs-pointer rule via `MouseEvent.detail === 0`, `focusVisible: true`)
  - `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc498-stamina-bar-keyboard-ledger.md` and its review report `.../sc498-stamina-bar-keyboard/sc498-r1-review-report.md` section "INFO-3" (where this bug was found)
  - `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc492-stamina-pencil-ledger.md` (the chrome-panel click guard in `src/framework/kit/StaminaBarPanel.ts`, lifecycle G-S32)
  - `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc465-heal-focus-ledger.md`
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc505-collapse-pin-focus`. Plugin at `/home/scott/code/steelCompendium/worktrees/sc505-collapse-pin-focus/draw-steel-elements`, branch `sc505-collapse-pin-focus`, at `b624eef` (= dse `develop`). Superproject branch `sc505-collapse-pin-focus` at `0e9a29b`. Verify `git -C <path> branch --show-current` before any write. **Never write under `/home/scott/code/steelCompendium/workspace/`** except your report file in the ledger dir — that is the shared main checkout. The workspace-level files you may edit (CHANGELOG.md) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc505-collapse-pin-focus/CHANGELOG.md` — never under `/home/scott/code/steelCompendium/workspace/`.
- Before starting: `git -C /home/scott/code/steelCompendium/worktrees/sc505-collapse-pin-focus/draw-steel-elements fetch origin` and confirm `origin/develop` is still `b624eef`. If it moved, rebase onto it and say so in the report.
- Read `draw-steel-elements/AGENTS.md`, the workspace `DESIGN.md` (in your worktree), and the `dse-verify` skill (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`) before running any gate.
- **You never call the tracker (Linear)** — not to read history, not to post. Everything you need is in these files.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault. It is expected; do not touch or report it.

## 2. Task

Spec, verbatim from the ticket (also in the ledger):

> **Problem:** on a `ds-stamina-bar` block, Tab to the chrome panel's Collapse button and press Enter. The block collapses and keyboard focus lands on the page body, because the Collapse button sits inside the bar it hides. Pressing Enter on Pin to sidebar also leaves focus on the page body. A keyboard user has to Tab from the top of the page to get back.
>
> **Expected:** after Collapse, focus moves to the collapsed one-liner's expand control. After Pin, focus stays on the Pin button (or another sensible control in the block).
>
> **Notes:** this predates SC-498; it follows from the chrome placement inside the bar. The reviewer reasoned it from the code and observed it on the SC-498 branch, but did not measure it on base. Check whether other elements whose chrome panel sits inside a region that collapse hides have the same problem.

Owner rulings, verbatim from the ledger (2026-10-23):

> - Applies only to a KEYBOARD activation (the activating click has `MouseEvent.detail === 0`, or the element's own keydown path). POINTER activation keeps base behaviour (move nothing).
> - Keyboard **Collapse** -> after the collapse has fully settled (including any note write, redraw or view adoption), focus the collapsed one-liner's expand control.
> - Keyboard **Expand** (from the collapsed one-liner) -> FOLDED in (the reverse of the same bug): focus the restored Collapse button. If that button cannot show a visible ring at that moment (e.g. the chrome panel is hover-revealed and `:focus-within` does not reveal it), focus the bar instead and report it.
> - Keyboard **Pin to sidebar** -> focus stays on (or returns to) the block's Pin button after any redraw. If the button relabels (e.g. Unpin), focus that same button.
> - Every programmatic move uses `{ preventScroll: true, focusVisible: true }`. Never `<body>`, never a control outside the block.
> - The fix belongs in the SHARED chrome/collapse code if the mechanism is shared, so every element that uses it is covered.

> SURVEY first: list every element with a chrome Collapse and/or Pin control, and measure on base `b624eef` where focus goes after keyboard Collapse / Expand / Pin for each. Elements covered by a shared fix are in scope. If more than the stamina bar needs element-specific code, the implementer stops with NEEDS_CONTEXT and the survey table; the owner rules fold vs ticket.

> Tests: jest (unit, keyboard vs pointer, Collapse/Expand/Pin) + real keys in e2e on the stamina bar (it is a pilot e2e surface; add control ids / manifest rows as the coverage gate requires). Lifecycle **G-S39** only if the collapse/pin note write + redraw cannot be driven in e2e, or for a non-e2e element covered by the shared fix; justify the choice.

Steps:

1. **Survey + base measurement.** Find where Collapse, Expand and Pin to sidebar live (shared chrome code vs per element), whether Collapse / Pin write to the note (and so trigger a redraw / view adoption — SC-340), and which elements use them. Measure on base in real Obsidian (e2e driver or lifecycle harness) where `document.activeElement` ends up after keyboard Collapse, keyboard Expand and keyboard Pin on the stamina bar. Table it in the report: element | has Collapse/Pin | focus after each on base | covered by a shared fix (yes/no).
2. **Failing tests first (TDD).** jest for the rule above (keyboard Collapse -> expand control; keyboard Expand -> Collapse button; keyboard Pin -> Pin button; pointer activation moves nothing; `focusVisible`/`preventScroll` passed). Show they fail on base.
3. **Fix** in the shared code where the mechanism is shared. Mind the redraw: if Collapse/Pin writes the note, the focus move must target the control in the DOM that exists AFTER the write settles (adopted or rebuilt), not a detached node.
4. **e2e with real keys** on the stamina bar: Tab to Collapse, Enter -> focus on the expand control with a ring; Enter on the expand control -> focus on Collapse; Tab to Pin, Enter -> focus on Pin; and one pointer check that a mouse Collapse moves nothing new. Must be red on base and green on the fix — prove both. Follow the e2e coverage-gate rules in dse-verify (control ids + manifest rows + censuses).
5. **G-S39 lifecycle** only per the ruling above; if you add it, update the lifecycle file's header scenario count, and prove red on base.
6. **Scope fence.** Do not touch the visual-harness host-leak sweep / exemptions (SC-501 is in flight there). Do not touch `src/framework/kit/stepper.ts`, the Stamina modal's internal focus handling, `FormModal.ts`, or the Live Preview chrome-overhang behaviour (SC-502). If the fix seems to need any of those, stop and return STATUS: NEEDS_CONTEXT.
7. **CHANGELOG:** one bullet under `## Unreleased` in `/home/scott/code/steelCompendium/worktrees/sc505-collapse-pin-focus/CHANGELOG.md`. Plain words, user-visible effect. Commit on the superproject branch in the worktree. **Do NOT edit `.claude/skills/dse-verify/SKILL.md`** (dispatcher bookkeeping at landing); if you add G-S39, put its exact one-line row text in your report instead.
8. Commit inside `draw-steel-elements` after every coherent step (tests, fix, e2e, lifecycle). Do not bump the superproject's submodule pointer and do not push — landing is not yours.

Drive-by fixes allowed only if obviously correct, local to a file you touched, and unable to move a gate baseline; list them under `Drive-by fixes:`. Anything else goes under `Follow-ups:` and is left alone.

## 3. Gates — full `dse-verify` battery, in its order

Expected numbers at `b624eef` (CURRENT block in dse-verify):

- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean
- jest **5889 passed / 1 skipped / 241 of 242 suites** — yours higher by the tests you add; report the exact delta. (On a fresh worktree jest reads one fewer passed and 2 skipped until `npm run shots` has run once — dse-verify row 3; compare after shots.)
- lifecycle **35/35** at base -> **36/36** if you add G-S39
- e2e **`OBSIDIAN-E2E done: 114/114 ok, 0 failed, 0 known-bug, coverage: 79/79 pairs`** at base — higher with your tests and pairs; must stay `0 failed`, coverage Y/Y
- shots **592**, 0 FAIL, with the in-run lines dse-verify lists
- freeze **`freeze OK (280/280 …)`** — no rebaseline expected; focus handling must not move print bytes. If freeze moves, stop and report.
- parity **0 GAPs / 0 undeclared / 24 DECLARED**

## 4. Command footguns (each has cost real time)

- Devbox: use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc505-collapse-pin-focus/draw-steel-elements -- <cmd>` (check dse-verify for exact shapes). **Never `cd` inside a compound command.** Use `git -C <absolute path>` for every git command.
- Exit codes: `echo rc=$?` inside `bash -c` under devbox always records 0. Record exit codes by running a **script file** via `devbox run -c <path> -- bash <script>`, and read each gate's own summary line.
- Write scripts/logs/screenshots only in your private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc505-r1-impl-<your agent id or 4 random chars>/` (create it; the scratchpad is shared by every agent). Uniquely named files inside. Create scratch files with the Write tool, not heredocs.
- **No `rm` with a shell-variable target** (`rm -f $S/x.rc` hangs on a permission prompt nobody answers) and **no glob `rm`** (`rm -f x/*.rc`, `rm -rf /tmp/dse-obsidian-lifecycle-*` are forbidden — other efforts' vaults match). Write fresh uniquely named files or overwrite with `>`. Delete only exact literal paths you created. Never touch `.superpowers/` outside `sc505-collapse-pin-focus/`, never `rm -rf` `.superpowers/`.
- **Run every gate as one blocking foreground Bash call** — lifecycle, e2e and shots as separate calls, each under the 10-minute tool timeout. No `run_in_background`, no `Monitor`, no waiting for notifications. Redirect long output to a log file in your scratch folder rather than streaming it (the 600s stream watchdog kills silent agents); then read the log.
- Set your own `DSE_LIFECYCLE_PORT` (e.g. 9291) for lifecycle runs — other sessions may hold 9262.
- Never `pkill`/`killall` by pattern — other worktrees run the same gates. Kill only by PID whose command line contains `worktrees/sc505-collapse-pin-focus/`, or whose `readlink /proc/<pid>/cwd` is inside the worktree.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is shared across sessions and branches; a stale log from another branch will match.
- `npm ci` if `node_modules` is missing or stale in the worktree.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc505-collapse-pin-focus/sc505-r1-impl-report.md`. It must open with a **≤10-line executive summary** (verdict, final shas, gate numbers, where the fix lives in one line, the survey result in one line). Then: the survey table; whether Collapse/Pin write the note; tests added (file:test name); base-failure evidence for jest and e2e (and G-S39 if added); every gate's summary line; `Drive-by fixes:`; `Follow-ups:`.

If the report-file write is blocked by your harness, return the report inline.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), dse sha, superproject sha, measured gate numbers — no prose, plus the absolute path of every evidence artifact you produced (report, logs, screenshots).

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` reaches the dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its first word must be `SC-505:`.
