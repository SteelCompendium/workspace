# SC-502 r1 implementer brief

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc502-lp-stamina-menu-click/decisions.md` — read it first. It holds the spec and every ruling; it is the source of truth.
- Precedents (same stamina-bar chrome) — read the ledgers; open report bodies only if you need detail:
  - `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc492-stamina-pencil-ledger.md`, and its review report `.../sc492-stamina-pencil/sc492-r1-review-report.md` section "INFO-2" (where this bug was found and measured; the probe method is described there)
  - `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc498-stamina-bar-keyboard-ledger.md`
  - `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc505-collapse-pin-focus-ledger.md` (shared chrome code `src/framework/chrome/`; e2e stamina-bar surface)
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc502-lp-stamina-menu-click`. Plugin at `/home/scott/code/steelCompendium/worktrees/sc502-lp-stamina-menu-click/draw-steel-elements`, branch `sc502-lp-stamina-menu-click`, at `a0365a4` (= dse `develop`). Superproject branch `sc502-lp-stamina-menu-click` at `86bdd53`. Verify `git -C <path> branch --show-current` before any write. **Never write under `/home/scott/code/steelCompendium/workspace/`** except your report file in the ledger dir — that is the shared main checkout. The workspace-level files you may edit (CHANGELOG.md) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc502-lp-stamina-menu-click/CHANGELOG.md` — never under `/home/scott/code/steelCompendium/workspace/`.
- Before starting: `git -C /home/scott/code/steelCompendium/worktrees/sc502-lp-stamina-menu-click/draw-steel-elements fetch origin` and confirm `origin/develop` is still `a0365a4`. If it moved, rebase onto it and say so in the report.
- Read `draw-steel-elements/AGENTS.md`, the workspace `DESIGN.md` (in your worktree; the chrome-panel / SC-169 menu-panel section), and the `dse-verify` skill (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`) before running any gate.
- **You never call the tracker (Linear)** — not to read history, not to post. Everything you need is in these files.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault. It is expected; do not touch or report it.

## 2. Task

Spec, verbatim from the ticket (also in the ledger):

> **Problem:** in Live Preview, a real mouse click on a `ds-stamina-bar` block's Edit pencil does nothing, and the editor cursor jumps to the blank line above the code fence. The collapse button behaves the same. A click on the bar itself still opens the Stamina modal.
>
> **Cause found so far:** the menu panel sits a little above the block's top edge (pencil bottom 231.6px, block top 232.6px in the probe). At the pencil's centre and the collapse button's centre, `document.elementFromPoint` returns the editor line above (`div.cm-line.cm-active`), so CodeMirror gets the click. A script `.click()` on the pencil still opens the edit form. The panel position comes from the SC-169 placement "seated above the cluster plate".
>
> **Expected:** in Live Preview the pencil and collapse button are clickable with the mouse, as in Reading view.
>
> **Reach:** the pencil needs `experimental` + `authoringControls`; the collapse button shows without the experimental switch. Check whether other elements whose menu panel sits above their top edge have the same problem.

Owner rulings, verbatim from the ledger (2026-10-24):

> - Goal: in Live Preview, a real mouse click at the visible centre of every chrome-panel button (Edit pencil, Collapse, Pin, any other) reaches that button — `elementFromPoint` at the centre returns the button or its child — and does what Reading view does. The click must not move the editor cursor to the line above.
> - Prefer a fix that moves NO pixels (stacking / hit-testing so the panel wins over the CodeMirror line above): shots and frozen bytes unchanged, SC-169 placement kept.
> - If no pixel-neutral fix works and the panel must move or the block must grow, STOP with NEEDS_CONTEXT plus before/after crops: SC-169's placement is Scott's design and a visible change goes to him.
> - The fix goes in SHARED chrome code if the mechanism is shared, so every element is covered.

> SURVEY first, on base `a0365a4` in real Obsidian Live Preview: for every element that mounts a chrome panel, panel top vs block top, and `elementFromPoint` at each button's centre (panel revealed). Include the cases: line above is blank/active, line above is inactive text, block is the first thing in the note, two blocks back to back. Elements a shared fix covers are in scope; if an element needs its own code, stop with NEEDS_CONTEXT and the table.

> Tests: a real-mouse test in real Obsidian Live Preview (CDP mouse events at the button centre, not `.click()`) that FAILS on base. e2e if the e2e harness can drive Live Preview real mouse clicks; otherwise lifecycle **G-S44**. Plus jest where it adds value (e.g. CSS rule present). Justify the choice.

Steps:

1. **Reproduce + survey on base.** In real Obsidian Live Preview (lifecycle harness or e2e driver, headless Xvfb as dse-verify describes — never `:1`), reproduce the stamina-bar pencil and Collapse failure with real CDP mouse events (`Input.dispatchMouseEvent` press+release at the button centre, after hovering to reveal the panel if it is hover-revealed). Record: what opened (nothing / form / modal), where the CodeMirror cursor went, `elementFromPoint` at the centre. Then table every chrome-panel element (dse-verify says 19): element | panel top vs block top (px) | `elementFromPoint` at each button centre | real-click result. Note the four layout cases from the ruling where they change the answer.
2. **Find the mechanism.** Why does the CodeMirror line win the hit test — is the overhanging part outside the `.cm-embed-block` widget box and painted under the next/previous `.cm-line` (stacking order), clipped, or is CodeMirror's own `mousedown` handler taking it (widget `ignoreEvent`, or the line box covering the area)? Say which, with evidence.
3. **Fix**, pixel-neutral if possible (e.g. a positioned stacking context / `z-index` on the panel or the block root scoped to Live Preview, or whatever the mechanism in step 2 needs). Shared chrome code (`src/framework/chrome/` or the shared stylesheet) if shared. Check that the fix does not make the panel cover text on the line above in a way that steals clicks from that line when the panel is hidden (a hidden panel must still let clicks through to the line above — measure it), and does not break the SC-492 guard (pencil opens only the form, never also the Stamina modal).
4. **Tests.** Real-mouse test in real Obsidian Live Preview per the ruling (e2e preferred if it can do it; else lifecycle **G-S44**): pencil click opens only the edit form; Collapse click collapses; a hidden-panel click on the line above still places the cursor there. Must FAIL on base and PASS on the fix — prove both (run the test against a base bundle, e.g. via `DSE_LIFECYCLE_BUNDLE` or a stash, and quote the FAIL line). Cover at least one more element than the stamina bar if the survey shows others affected. jest where it adds value. If you add G-S44, update the lifecycle file's header scenario count. If you add e2e controls, follow the e2e coverage-gate rules in dse-verify (control ids + manifest rows + censuses).
5. **Scope fence.** Do not change the panel's visible position, size or reveal behaviour (that would be a design change — STOP per the ruling). Do not touch `FormModal.ts`, the Stamina modal, the focus-handoff code from SC-505, or the visual-harness host-leak sweeps. If the fix seems to need any of those, stop and return STATUS: NEEDS_CONTEXT.
6. **CHANGELOG:** one bullet under `## Unreleased` in `/home/scott/code/steelCompendium/worktrees/sc502-lp-stamina-menu-click/CHANGELOG.md`. Plain words, user-visible effect. Commit on the superproject branch in the worktree. **Do NOT edit `.claude/skills/dse-verify/SKILL.md`** (dispatcher bookkeeping at landing); if you add G-S44, put its exact one-line row text in your report instead.
7. Commit inside `draw-steel-elements` after every coherent step (tests, fix, lifecycle/e2e). Do not bump the superproject's submodule pointer and do not push — landing is not yours.

Drive-by fixes allowed only if obviously correct, local to a file you touched, and unable to move a gate baseline; list them under `Drive-by fixes:`. Anything else goes under `Follow-ups:` and is left alone.

## 3. Gates — full `dse-verify` battery, in its order

Expected numbers at `a0365a4` (CURRENT block in dse-verify):

- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean
- jest **6052 passed / 1 skipped / 244 of 245 suites** — yours higher by the tests you add; report the exact delta. (On a fresh worktree jest reads one fewer passed and 2 skipped until `npm run shots` has run once — dse-verify row 3; compare after shots.)
- lifecycle **36/36** at base -> **37/37** if you add G-S44
- e2e **`OBSIDIAN-E2E done: 123/123 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`** at base — higher with your tests and pairs; must stay `0 failed`, coverage Y/Y
- shots **592**, 0 FAIL, with the in-run lines dse-verify lists
- freeze **`freeze OK (280/280 …)`** — no rebaseline expected; a pixel-neutral fix must not move print bytes. If freeze moves, stop and report.
- parity **0 GAPs / 0 undeclared / 24 DECLARED**

## 4. Command footguns (each has cost real time)

- Devbox: use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc502-lp-stamina-menu-click/draw-steel-elements -- <cmd>` (check dse-verify for exact shapes). **Never `cd` inside a compound command.** Use `git -C <absolute path>` for every git command.
- Exit codes: `echo rc=$?` inside `bash -c` under devbox always records 0. Record exit codes by running a **script file** via `devbox run -c <path> -- bash <script>`, and read each gate's own summary line.
- Write scripts/logs/screenshots only in your private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc502-r1-impl-<your agent id or 4 random chars>/` (create it; the scratchpad is shared by every agent). Uniquely named files inside. Create scratch files with the Write tool, not heredocs.
- **No `rm` with a shell-variable target** (`rm -f $S/x.rc` hangs on a permission prompt nobody answers) and **no glob `rm`** (`rm -f x/*.rc`, `rm -rf /tmp/dse-obsidian-lifecycle-*` are forbidden — other efforts' vaults match). Write fresh uniquely named files or overwrite with `>`. Delete only exact literal paths you created. Never touch `.superpowers/` outside `sc502-lp-stamina-menu-click/`, never `rm -rf` `.superpowers/`.
- **Run every gate as one blocking foreground Bash call** — lifecycle, e2e and shots as separate calls, each under the 10-minute tool timeout. No `run_in_background`, no `Monitor`, no waiting for notifications. Redirect long output to a log file in your scratch folder rather than streaming it (the 600s stream watchdog kills silent agents); then read the log.
- Set your own `DSE_LIFECYCLE_PORT` (e.g. 9293) for lifecycle runs and any ad-hoc Obsidian probe — other sessions may hold 9262.
- Never `pkill`/`killall` by pattern — other worktrees run the same gates. Kill only by PID whose command line contains `worktrees/sc502-lp-stamina-menu-click/`, or whose `readlink /proc/<pid>/cwd` is inside the worktree.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is shared across sessions and branches; a stale log from another branch will match.
- `npm ci` if `node_modules` is missing or stale in the worktree.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc502-lp-stamina-menu-click/sc502-r1-impl-report.md`. It must open with a **≤10-line executive summary** (verdict, final shas, gate numbers, the mechanism in one line, where the fix lives in one line, the survey result in one line, pixel-neutral yes/no). Then: the base reproduction; the survey table; the mechanism evidence; tests added (file:test name); base-failure evidence; every gate's summary line; `Drive-by fixes:`; `Follow-ups:`.

If the report-file write is blocked by your harness, return the report inline.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), dse sha, superproject sha, measured gate numbers — no prose, plus the absolute path of every evidence artifact you produced (report, logs, screenshots).

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` reaches the dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its first word must be `SC-502:`.
