# SC-465 r1 implementer brief — keep keyboard focus inside the Stamina modal when a heal button disables itself

You are implementer A (orchestration:implementer) for SC-465. Your final text goes to the ticket-owner, not a human.

## 1. Context loading (do this first)

- Read the ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc465-heal-focus/sc465-decisions.md` (spec + owner decisions; quoted below).
- Precedent ledgers (skim only what you need): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc432-free-recovery-ledger.md` and `sc433-temp-stamina-minus-ledger.md` in that dir. SC-432 added the no-pool "Heal Recovery Value" button + confirmation; SC-433 made temp a direct edit. Both just landed in this modal.
- Read `/home/scott/code/steelCompendium/worktrees/sc465-heal-focus/draw-steel-elements/AGENTS.md` (if present), `e2e/README.md`, and `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (the gate battery and command shapes).
- **Workers never call the tracker** (Linear) — not to read history, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc465-heal-focus`, every submodule on branch `sc465-heal-focus`. Repo you change: `draw-steel-elements` (tracked branch `develop`). Verify with `git -C <abs path> rev-parse --abbrev-ref HEAD` before any write.
- Fetch first: `git -C /home/scott/code/steelCompendium/worktrees/sc465-heal-focus/draw-steel-elements fetch origin` — expected `origin/develop` = `e4c5cf6` (your branch is cut there). If it moved, rebase onto it and say so.
- Superproject (CHANGELOG only): the worktree's superproject branch is at `281eece`; `origin/main` is `6bf71ca`. `git -C /home/scott/code/steelCompendium/worktrees/sc465-heal-focus fetch origin` and rebase the superproject branch onto `origin/main` before committing the CHANGELOG bullet.
- **Workspace-level files live in YOUR worktree's superproject**, e.g. `/home/scott/code/steelCompendium/worktrees/sc465-heal-focus/CHANGELOG.md` — never under `/home/scott/code/steelCompendium/workspace/` (that is the shared main checkout; never write there except your report files in the ledger dir).
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore it.

## 2. The task

Spec (ticket, verbatim):

> **Repro:** open the stamina modal with the keyboard on a hero a few Stamina below max. Press Spend Recovery (or, after SC-432, Heal Recovery Value and confirm). The heal reaches max, the button becomes disabled while it holds focus, and focus drops to the document body. The next Tab starts from the top of the page instead of inside the modal.
>
> Same shape as SC-428 MEDIUM-1 (Catch Breath), which fixed it for the Recoveries strip by moving focus to a neighbouring control when the focused button disables.
>
> **Where:** `src/views/StaminaEditModal.ts` — after the SC-432 confirmation's Confirm (~:603, focus returns to the heal button) and on the existing pool path.

Owner decisions (verbatim from the ledger):

> - Focus rule (follows the SC-428 M1 precedent in `src/framework/kit/RecoveriesStrip.ts` ~:347): when the heal button disables itself while it holds focus, move focus to the NEXT enabled tab stop inside the modal in DOM order (fall back to the previous one); never `<body>`, never outside the modal. Use `{ preventScroll: true }`. Same rule for the SC-432 confirmation's return-focus (~:601): if the heal button is disabled when the confirmation closes, focus goes to that same fallback, not to the disabled button.
> - Both heal paths are in scope: pool hero "Spend Recovery" and no-pool hero "Heal Recovery Value" (after Confirm). Other modal controls that can disable themselves while focused (e.g. SC-433 temp "−" at 0, Apply at "No Stamina Change", stepper bounds) are surveyed: a modal-local one in StaminaEditModal.ts with the same shape is FOLDED (same helper); a shared kit component (stepper) fix is NOT made here — report it as a follow-up for an owner ruling.

Notes:
- First reproduce the bug in a test before fixing (TDD): a jsdom test that fails on `e4c5cf6`, and an e2e scenario with real keyboard input (focus the heal button, press Enter/Space, then confirm for the no-pool path; assert `document.activeElement` is inside the modal and is an enabled control, and that a following Tab stays inside the modal). Follow the e2e README's conventions for scenario ids and the coverage manifest; no new `data-dse-control` id should be needed (if you add one, it needs a manifest row).
- Keep the helper small and local unless an existing kit helper already does "next enabled tab stop within a root" — reuse it if so.
- Mouse clicks: SC-428 moved focus whenever the button held focus, regardless of input type. Do the same.
- The focus target should show the normal focus ring when reached via keyboard (see SC-428 review M2 note in `src/framework/host/adoptView.ts` ~:20 for the focus-visible concern). Say in your report what ring state the target shows after a keyboard heal (measured in real Obsidian e2e, not assumed).
- CHANGELOG: one user-facing bullet under `## Unreleased` in the worktree's `CHANGELOG.md`, plain words (e.g. keyboard focus stays in the Stamina window when a heal fills Stamina).
- Commit after every coherent step (test, fix, e2e, docs), in `draw-steel-elements` on branch `sc465-heal-focus`. No pushes. Never create a tag. Commit messages: no co-author or AI attribution trailers.

## 3. Gates (dse-verify battery, in order) and expected numbers at `e4c5cf6`

tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5711 passed / 1 skipped / 238 of 239 suites** (+ your new tests) · lifecycle **`OBSIDIAN-LIFECYCLE done: 31/31 ok, 0 failed`** · e2e **`OBSIDIAN-E2E done: 101/101 ok, 0 failed, 0 known-bug, coverage: 66/66 pairs`** (+ your new tests, still 0 failed, 0 known-bug) · shots **580**, 0 FAIL, no ALLOWLISTED line · freeze **`freeze OK (280/280 …)`** (no rebaseline expected — focus is not in any static shot; if freeze moves, STOP and report) · parity **0 GAPs / 0 undeclared / 24 DECLARED**.

No lifecycle scenario is expected. If you find you need one, its id is **G-S30**.

Command shapes and footguns (all mandatory):
- Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc465-heal-focus/draw-steel-elements -- bash <script file>`. Never `cd` inside a compound command; never `cd X && devbox …`.
- Record exit codes from inside a script FILE run through devbox (devbox's wrapper eats `$?`; `bash -c '…; echo rc=$?'` always records 0). Read each gate's own summary line too.
- **Run each gate as ONE blocking foreground Bash call** (split lifecycle / e2e / shots / parity into separate calls to stay under the 10-minute tool timeout). No `run_in_background`, no Monitor, no background jobs. Redirect long output to a log file rather than streaming it (the 600s stream watchdog kills silent agents).
- **Private scratch:** create `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc465-r1-impl-<your agentId>/` and put every script and log there with unique names. The scratchpad is shared by every agent in the session — never write a generic name like `gate.sh` at its top level.
- Write scratch files with the Write tool (no heredocs into scratch). No glob `rm` anywhere (`rm -f x/*.log` is forbidden); delete only exact paths you created. Never `rm -rf` any shared `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`) or the shared `.superpowers/` dir.
- Never `pkill`/`killall` by pattern. Kill only a PID you verified is yours (`pgrep -af "worktrees/sc465-heal-focus/"`, or `readlink /proc/<pid>/cwd` inside your worktree).
- Every git command is `git -C <absolute path> …`.
- Set `DSE_LIFECYCLE_PORT` to something other than 9262 (e.g. 9291) for lifecycle, since other sessions may run it.
- `npm ci` if node_modules is missing or `package.json`'s obsidian version changed. On a fresh worktree jest reads one fewer passed / 2 skipped until shots has run once — compare against the numbers above after shots.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions. Read the process's own output, or a per-run unique path.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc465-heal-focus/sc465-r1-impl-report.md`. It must OPEN with a ≤10-line executive summary (verdict, final dse sha + base, superproject sha + base, gate numbers). Body: what changed (file:line), the focus target chosen for each path and the measured ring state, the survey of other self-disabling modal controls (folded / follow-up), test names, which new tests fail on `e4c5cf6` (prove discrimination by running them against the unfixed code), and `Drive-by fixes:` / `Follow-ups:` lists.

If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Your final text goes to the ticket-owner, not a human — raw facts, no prose: STATUS (DONE / NEEDS_CONTEXT / BLOCKED), dse sha + commit list, superproject sha, every gate's measured summary line, and the absolute path of every evidence artifact (report, gate logs, any screenshots).

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see your completion notification and will resume you with the answer. If you ever do send a message anyway, its FIRST WORD must be `SC-465:`.
