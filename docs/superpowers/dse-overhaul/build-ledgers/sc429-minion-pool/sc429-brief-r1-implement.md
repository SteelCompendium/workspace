# SC-429 round 1 — implement the four minion-pool-modal fixes

## 1. Context loading
- Read FIRST: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc429-minion-pool/decisions.md (the spec + rulings; quote it, don't reinterpret it).
- Worktree: /home/scott/code/steelCompendium/worktrees/sc429-minion-pool ; repo: its `draw-steel-elements/` submodule, already on branch `sc429-minion-pool` at develop `a89ffd9`.
  `git -C /home/scott/code/steelCompendium/worktrees/sc429-minion-pool/draw-steel-elements fetch origin` then rebase onto `origin/develop` if it moved past a89ffd9 (report the base you used).
- Verify `pwd`/paths before every write: NEVER write under /home/scott/code/steelCompendium/workspace/ (the shared main checkout) except the report file in the ledger dir. Use `git -C <absolute path>` for every git command — never `cd X; git …`.
- Read draw-steel-elements/AGENTS.md (or CLAUDE.md) and the dse-verify skill at /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md before running gates.
- You never call the tracker (Linear) — not to read, not to post.

## 2. The task
File: `src/views/MinionStaminaPoolModal.ts` (and its tests). Fix all four defects from the ticket body, per the owner rulings O1–O5 in decisions.md (quoted):

> 1. **Stuck all-checked.** Lower the pool to 0 (every minion auto-checked and disabled), then press + to raise it to 1. All 5 stay checked while 4 are needed, and Apply is disabled with "Select 4 minion(s)". ~lines 430-437 never un-check the excess.
> 2. **Initial focus is "Decrease Stamina pool".** Space or Enter right after opening decrements the pool. The stamina edit modal focuses its Apply box instead.
> 3. **The minion-count box's max counts dead minions** (~line 130 uses `instances.length`). Over-counted damage is clamped at 0, so no corruption.
> 4. **At rest the info text reads "0 damage will kill 0 minion(s). Select 0 minion(s) to kill."** (~lines 354-357). Hide or reword it when nothing is pending.

> - O1 (item 1): Checks the modal set AUTOMATICALLY (the "every remaining minion must die" auto-check) are reverted when that rule stops applying: those boxes un-check and re-enable; boxes the USER checked by hand keep their state. No state where more boxes are checked than the rule forced and the user chose.
> - O2 (item 2): On open, focus goes where the stamina edit modal puts it (mirror its behaviour — implementer verifies what that is and reports it). Never a stepper button.
> - O3 (item 3): The minion-count box's max is the number of LIVING minions in the squad.
> - O4 (item 4): When nothing is pending (no damage, no kills to select) the kill/select info line is hidden, not reworded. Any heal/refused-heal text is unaffected.
> - O5: Product fixes + jsdom tests only. No new e2e manifest pairs (that is SC-435). Full dse-verify battery must stay green with no rebaseline.

Notes:
- Item 2: find out how `StaminaEditModal` gets its initial focus (explicit `.focus()`, Obsidian Modal default first-focusable, DOM order…) and mirror the mechanism. Report exactly which element now receives focus on open and why. If the stamina modal's answer would not apply cleanly (e.g. the analogous element doesn't exist), STOP and return NEEDS_CONTEXT with the options.
- Item 1: if the code has no way to tell an auto-check from a user check, add one (e.g. track which boxes were auto-set). Cover with tests: 0 -> 1 un-checks the auto-set boxes and re-enables them; a box the user checked before the pool hit 0 is still checked after raising it; Apply's state/label is right afterwards.
- Item 3: count living by whatever the modal already uses to decide dead/alive (do not invent a new rule). Test with a squad that has dead members.
- Item 4: test the at-rest state (line hidden) and that it reappears as soon as damage is pending; keep any heal/refused-heal text paths working.
- TDD: write each failing test first, see it fail, then fix. Commit after each coherent step (small commits, conventional style, `fix(minion-pool): … (SC-429)`). No co-author/AI trailers in commits.
- CHANGELOG: add one plain-language bullet under `## Unreleased` in draw-steel-elements' CHANGELOG.md if that repo keeps one with user-facing fixes (check its convention); do not edit the workspace CHANGELOG.
- If any existing visual-harness shot shows this modal at rest, the info-line hide will change it: report which shot(s), and save before/after PNG crops into the ledger dir as `sc429-shot-<name>-before.png` / `-after.png`.

## 3. Gates (dse-verify skill, full battery in its order)
Expected at develop a89ffd9 (CURRENT row in dse-verify):
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **4769 passed / 1 skipped / 227 of 228 suites** (yours = 4769 + your new tests; report the delta) · lifecycle **25/25** · e2e **`OBSIDIAN-E2E done: 62/72 ok, 0 failed, 10 known-bug, coverage: 47/47 pairs`** · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**.
If an existing e2e or jest test asserted the OLD behaviour (e.g. the at-rest text), update it and say so in the report.

Footguns (all apply):
- Devbox: Node etc. are not on PATH. Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc429-minion-pool/draw-steel-elements -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc429-minion-pool/draw-steel-elements && <cmd>'`. Devbox eats `$?`/`$PIPESTATUS` and `| tail` eats failures: run each gate via a small wrapper script FILE that writes the exit code to a file, or redirect output to a file and read the gate's own summary line.
- `npm ci` first if node_modules is missing or package.json's obsidian version differs from what is installed.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND (timeout up to 600000 ms; split if needed). Do not background a gate and wait for a notification — it will never come.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path (put logs under the ledger dir with an `sc429-` prefix, or in your own worktree).
- Never `pkill`/`killall` by pattern — concurrent efforts run the same commands. Kill only by PID whose command line contains `worktrees/sc429-minion-pool/` (check with `pgrep -af "worktrees/sc429-minion-pool/"`).
- Never touch the shared freeze baseline `.superpowers/sdd/freeze-baseline.sha256`; never `rm -rf` anything under `.superpowers/` except files you created with an `sc429-` prefix.
- Timeout-shaped jest reds under load: re-run the failing suite alone per dse-verify before believing them.
- A stale superproject pin can make doc-reading tests (token-coverage) go red — see dse-verify / diagnose by comparing copies; use `DSE_TOKEN_MAP_PATH` override pointing at the main checkout's copy. Never edit the branch for it.

## 4. Report
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc429-minion-pool/sc429-r1-implement-report.md`. It MUST open with a ≤10-line executive summary (verdict, head sha, gate numbers). Then: per item, what changed (file:line) and which tests cover it; the item-2 focus finding; any old-behaviour tests you changed; Drive-by fixes: (made) and Follow-ups: (left alone) lists.
If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract
Your final text goes to the ticket-owner, not a human — raw facts only: STATUS (DONE / NEEDS_CONTEXT / BLOCKED), branch + head sha + base sha, each gate's measured line, jest delta, and the absolute path of every artifact you produced (report, logs, any PNG crops).
You cannot SendMessage me — a depth-2 agent cannot address its parent, and `to: 'main'` reaches the dispatcher, not me. If you need input, end your turn with STATUS: NEEDS_CONTEXT and the question; I will resume you. If you ever do send a message anyway, its FIRST WORD must be `SC-429:`.
