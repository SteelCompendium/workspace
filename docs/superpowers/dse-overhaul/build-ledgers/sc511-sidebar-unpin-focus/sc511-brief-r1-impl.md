# SC-511 r1 implementer brief — keyboard Unpin from sidebar keeps focus in the sidebar

You are the SC-511 r1 implementer. Your final text goes to the SC-511 ticket-owner, not a human.

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc511-sidebar-unpin-focus/decisions.md` (the ledger: spec, owner rulings, constraints). It is the source of truth; this brief quotes it.
- Read the precedent: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc505-collapse-pin-focus-ledger.md` and `src/framework/chrome/focusHandoff.ts` (its header explains the keyboard-only rule).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc511-sidebar-unpin-focus` — every submodule on branch `sc511-sidebar-unpin-focus`. Plugin repo: `/home/scott/code/steelCompendium/worktrees/sc511-sidebar-unpin-focus/draw-steel-elements`. Verify `pwd`/paths before any write. NEVER write under `/home/scott/code/steelCompendium/workspace/` except the ledger dir above (the main checkout is shared state; its dse dirt — modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md` — is Scott's live vault and expected; ignore it).
- The workspace-level files (e.g. `CHANGELOG.md`) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc511-sidebar-unpin-focus/CHANGELOG.md` — never under `/home/scott/code/steelCompendium/workspace/`.
- First: `git -C /home/scott/code/steelCompendium/worktrees/sc511-sidebar-unpin-focus/draw-steel-elements fetch origin` and confirm the branch is on `origin/develop` = `423e798d` (rebase onto newer `origin/develop` if it moved; report the sha). Superproject: `git -C /home/scott/code/steelCompendium/worktrees/sc511-sidebar-unpin-focus fetch origin` and rebase onto `origin/main`. Run `npm ci` if `package.json` changed.
- **Workers never call the tracker** (Linear) — not to read history, not to post.

## 2. The task

Owner rulings, verbatim from the ledger:

> - 2026-11-02: FOCUS RULE (SC-505's rule, applied to removal):
>   - Applies only to a KEYBOARD activation (`isKeyboardClick(evt)`, i.e. the click has `MouseEvent.detail === 0`). A pointer click keeps today's behaviour (move nothing).
>   - After a keyboard **Unpin from sidebar**, focus goes to the **panel that now sits in the removed panel's place** (the next panel below it); if the removed panel was the last one, to the **panel above it**; if no panel is left, to the sidebar's **"No pinned blocks" empty-state message** (made focusable with `tabindex="-1"` only, so it is not a Tab stop).
>   - Inside the chosen panel, focus its **header note link** (`.dse-sidebar__panel-note`, the panel's first, always-visible control). If that link is missing, the panel's first focusable control; never a hover-hidden control that cannot show a ring.
>   - Every move uses `HANDOFF_FOCUS` (`{ preventScroll: true, focusVisible: true }`). Never `<body>`, never a control outside the sidebar leaf the press came from.
>   - Only move focus when it was inside the removed panel at the press (or has fallen to body/null) — never steal focus the user has already moved elsewhere.
>   - FOLDED in: the degrade card's **"Remove panel"** button uses the same removal path (`onRemoveRequested`) and gets the same keyboard rule.

Where the code is (read, then decide the smallest shape):
- `src/framework/pipeline.ts` ~line 662: the `unpin` chrome item, `onClick: () => cx.host.requestRemoval?.()` — the click event is dropped; pass the keyboard bit through (SC-505's Pin item right above it reads `isKeyboardClick(evt)`). **SC-540 is editing pipeline.ts concurrently: keep your change there to these few lines.**
- `src/framework/host/BlockHost.ts` (`requestRemoval?()`), `src/framework/host/SidebarBlockHost.ts` (`requestRemoval()` → `onRemoveRequested`).
- `src/framework/sidebar/SidebarPanel.ts` (`onRemoveRequested`, header with `.dse-sidebar__panel-note`, degrade card "Remove panel" ~line 371).
- `src/framework/sidebar/DseSidebarView.ts` `removePanel` (synchronous splice + `removeChild` + `updateEmptyState`) and `updateEmptyState` (`.dse-sidebar__empty`).
- Reuse `isKeyboardClick`, `focusControl`, `HANDOFF_FOCUS` from `focusHandoff.ts`; do not add a request/arming mechanism unless measurement shows removal is not synchronous (e.g. a later rebuild discards the focused link — if so, report it and how you handled it).

Measure on base first: in real Obsidian (e2e driver or lifecycle harness), with 3 pinned panels, keyboard Unpin on the middle, the last, and the only one — record where `document.activeElement` lands on `423e798d` (expected: body). Then the same after your change. Also a pointer Unpin (real click, `detail >= 1`) must leave focus exactly where base leaves it.

Out of scope (do not touch): `src/framework/chrome/mountChrome.ts` beyond what is strictly needed (parked SC-520 owns it — if you must touch it, stop with NEEDS_CONTEXT); the sidebar hotkey (SC-471); LP callouts (SC-540/SC-544); scroll pin (SC-472). Any styling change — none is expected; if one seems needed, stop with NEEDS_CONTEXT.

Tests:
- jest: keyboard vs pointer; middle / last / only panel; degrade-card Remove panel; focus already moved elsewhere is left alone; empty state gets `tabindex="-1"` and is not a Tab stop. Each new test must fail with the hand-off neutralised (say how you checked).
- Real keys: prefer e2e (real Enter on the focused Unpin button) if the e2e harness can open the DSE sidebar with pinned panels (Unpin is behind `isExperimental()`); add control ids / manifest rows as the coverage gate requires. Only if the sidebar cannot be driven in e2e, add lifecycle **G-S63**, placed in part 3 **just before G-S56** ("G-S56 must stay last"). Justify the choice in the report.
- `CHANGELOG.md` (worktree superproject) — one bullet under `## Unreleased`, plain user-facing words.
- If your work changes a dse-verify expected number or the lifecycle part list, do NOT edit `.claude/skills/dse-verify/SKILL.md`; write the proposed text to `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc511-sidebar-unpin-focus/sc511-dse-verify-proposal.md`.

Commit after every coherent step (in the dse submodule; CHANGELOG in the superproject). Do not push.

## 3. Gates — the `dse-verify` skill

Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery table + CURRENT block). Expected at `423e798d`:
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean.
- jest **6272 + new passed / 1 skipped / 250 of 251 suites** (251 of 252 if you add a suite; on a fresh worktree one fewer passed and 2 skipped until shots has run — run shots before the final jest).
- lifecycle **46/46** (47/47 with G-S63), run as THREE `--only` parts per row 4: `G-S7a … G-S9a` (21), `G-S9b … G-S40` (16), part 3 (9, or 10 with G-S63 before G-S56). One part per tool call.
- e2e **`OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`** (+ your new tests/pairs).
- shots **592**, 0 FAIL, button host-leak 161/966; freeze **280/280** (no rebaseline expected — this is focus-only); parity **0 GAPs / 0 undeclared / 24 DECLARED**, last.

Command footguns (project adapter §8 — obey all):
- Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc511-sidebar-unpin-focus/draw-steel-elements -- <cmd>`. Never `cd` inside a compound command. `git -C <abs path>` for every git command.
- Record exit codes from a script FILE run through devbox (`devbox run -c <path> -- bash <script>`); `bash -c '…; echo rc=$?'` under devbox always records 0. Read each gate's own summary line. Never pipe a gate into `tail`.
- One gate per tool call, foreground and blocking — no `run_in_background`, no Monitor. Exception: shots under load may pass 600 s — then start it writing to a unique log + rc file and poll THAT log/rc file.
- Redirect long output to a file rather than streaming it (the 600 s stream watchdog kills silent agents).
- Your scratch goes in a private folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc511-r1-impl-<your agentId>/`, uniquely named scripts and logs. Write scratch files with the Write tool, not heredocs.
- No `rm` with a shell-variable target and no glob `rm` (never `rm -rf /tmp/dse-obsidian-lifecycle-*`). Delete only literal paths you created. Never `rm -rf` the shared `.superpowers/`.
- Never `pkill`/`killall` by pattern. Kill only a PID whose command line contains your worktree path, or whose `readlink /proc/<pid>/cwd` is inside your worktree.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc511-sidebar-unpin-focus/sc511-r1-impl-report.md`. If the report-file write is blocked by your harness, return the report inline.

It must OPEN with a ≤10-line executive summary: verdict, dse head sha + base sha, superproject sha, base measurement (where focus landed on `423e798d`), the gate numbers.

Then: commits (sha + subject), files changed, design choice and why, the real-keys test choice (e2e vs G-S63) and why, how each new test was proven red, `Drive-by fixes:` (already made; obviously correct, local to a file you touched, cannot move a baseline) and `Follow-ups:` (left alone).

## 5. Return contract

Final text: raw facts only — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), shas, measured gate numbers, and the absolute path of every evidence artifact (report, logs). No prose.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see your completion notification and will resume you with the answer. If you ever do send a message anyway, its FIRST WORD must be `SC-511:`.
