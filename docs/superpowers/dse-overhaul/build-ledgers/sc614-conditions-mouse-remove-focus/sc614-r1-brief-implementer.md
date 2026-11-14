# SC-614 r1 — implementer brief

You are the r1 implementer for SC-614. Your final text goes to the ticket-owner, not a human.

## 1. Context loading

- Read FIRST: the effort ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc614-conditions-mouse-remove-focus/decisions.md` (ticket text, owner rulings, baseline, prior art). The rulings there are the spec; they are quoted below.
- Prior art to read (landed): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc609-roster-click-focus-ledger.md` and its dir (closest pattern: `captureControlFocus` / `focusControl` around a redraw, plus its e2e INIT-F13/F14), `sc603-focus-after-pool-apply-ledger.md`. Code: `src/framework/kit/controlFocus.ts`, `src/elements/initiative/view.ts` (`buildConditionRow` ~l.2338, `buildConditionIcons`, the SC-609 roster-cell `onClick`), `src/framework/kit/conditionIcons.ts`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc614-conditions-mouse-remove-focus`, branch `sc614-conditions-mouse-remove-focus` in every submodule. dse is at develop `9b94baf2`; superproject at workspace origin/main `056c50d1`. First: `git -C <worktree>/draw-steel-elements fetch origin` and confirm `origin/develop` is still `9b94baf2` (if it moved, rebase onto it and say so). Verify `pwd`/paths before every write: ALL edits go under `/home/scott/code/steelCompendium/worktrees/sc614-conditions-mouse-remove-focus/`. The workspace CHANGELOG you edit is `/home/scott/code/steelCompendium/worktrees/sc614-conditions-mouse-remove-focus/CHANGELOG.md` — never anything under `/home/scott/code/steelCompendium/workspace/` except the ledger dir for your report.
- **You never call the tracker (Linear)** — not to read history, not to post.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not foreign changes; ignore it.

## 2. The task

Owner rulings, verbatim from the ledger:

> - 2026-11-13 — **Behaviour.** When keyboard focus is inside the tracker's conditions row (on Add condition, or on another condition's remove button) and a mouse press on a condition's remove button removes that condition and redraws the conditions row, focus lands on the REBUILT replacement of the control that had focus before the press (Add condition → the new Add condition button; another condition's remove button → that same condition's new remove button). If that control no longer exists after the redraw, focus goes to its successor by the existing `controlSuccessor` rule. If focus was elsewhere in the tracker (outside the conditions row), the conditions-row redraw does not touch it and nothing changes. If focus was NOT inside the tracker before the press, nothing changes (SC-588: "A mouse click never pulls focus into the tracker").
> - 2026-11-13 — **Scope.** Both conditions rows (hero rows and creature rows: both callers of `buildConditionRow`) and both views where the tracker lives (Reading view and the pinned sidebar tracker). Survey, do not necessarily fix: (a) keyboard removal of a condition in the tracker (Enter/Space on a remove button) — report what happens today; if focus already lands on a sensible control, leave it; if it drops to `<body>` AND the same capture/restore + successor rule fixes it in the same few lines, fix it and say so; otherwise report it as a follow-up. (b) any other caller of the conditions-row `rerender` (the Conditions window's apply callback runs while the window holds focus and SC-603 hands focus back on close — confirm, don't change). Live Preview losing focus on the tracker's own save is SC-602 — out of scope; CHANGELOG wording says "Reading view and the pinned sidebar tracker".
> - 2026-11-13 — **Tests.** jest case(s) shown RED on the base and green on the fix; plus real-Obsidian e2e coverage in `e2e/specs/initiative/` (not lifecycle): Tab to the detail row's Add condition, mouse press on a condition's remove button, assert the condition is gone and `document.activeElement` is the rebuilt Add condition button. Plus the negative: blur to `<body>` (assert that start state first — SC-609 r2 M-1 lesson: after `openNote` focus may sit on the preview div), mouse remove, focus is not pulled into the tracker. No bracketed ticket id in test titles. Fresh scenario ids (check for collisions against current develop).
> - 2026-11-13 — **CHANGELOG.** One bullet under `## Unreleased` in the dse CHANGELOG and one in the workspace CHANGELOG (the worktree's superproject copy), qualified to Reading view and the pinned sidebar tracker.
> - 2026-11-13 — **Out of scope.** SC-615 (quick-add text box focus on roster press), SC-458 (click focusing its roving target), SC-602 / SC-605 (Live Preview), SC-568 (jest timeouts; `jest.config.ts`), SC-621 (hover / embed part-pin; host pin code, lifecycle G-S115). Do not edit their files.

Diagnose first (confirm the ticket's cause at `9b94baf2`, including how the click shield keeps focus on Add condition during the press), then fix with the smallest change that reuses `controlFocus.ts`. Commit after every coherent step (fix+jest, e2e, CHANGELOG), in the dse submodule; the workspace CHANGELOG is one commit on the superproject branch. Do NOT bump the superproject's dse pointer — the owner/dispatcher does the single pointer bump at landing.

## 3. Gates — the `dse-verify` skill

Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (≈370 KB — read it in parts: "The battery, in order", "Devbox wrapping", "THE exit-code footgun", "Load-sensitive jest suites", "Lifecycle and e2e notes", and "Current expected numbers"). Run the full battery on your final sha, against the worktree's `draw-steel-elements/`. Expected at base `9b94baf2`:

- tsc clean · lint clean
- jest **11853 passed / 2 skipped** fresh without the shots cache (one more passed / 1 skipped after a shots run), plus your new tests. `rm -f main.js styles.css` in the plugin root before `npx jest`. Timeout-shaped reds in the SC-568 load-sensitive suites: check `/proc/loadavg`, re-run the suite alone before believing it.
- lifecycle **63/63**, run as SEVEN `--only=` parts (comma-separated ids), one part per Bash call, output to a log: `G-S7a … G-S9a` (21); `G-S9b … G-S40` (16); `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9); `G-S57,G-S62,G-S61,G-S56` (4); `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7); `G-S92,G-S96,G-S97,G-S99` (4); `G-S108,G-S112` (2). Take the exact id lists for parts 1–2 from the skill's lifecycle row. A G-S91 FAIL is a real signal unless it says the host was too slow after two re-runs. If G-S97 fails, first check `git -C <worktree>/draw-steel-elements status` for a dirty `demo-vault/.obsidian/appearance.json` (SC-622) and restore it (`git -C … checkout -- demo-vault/.obsidian/appearance.json`) before blaming your change.
- e2e **338/341 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs** plus your new scenarios (report the new N/M and pair count).
- shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 (0 FAILED) · parity last: 0 GAPs / 0 undeclared WARNs / 24 declared.

Command-shape rules (each has cost real time):
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc614-conditions-mouse-remove-focus/draw-steel-elements -- bash <script file>`; never `cd` inside a compound command; `git -C <absolute path>` for every git command.
- Never trust an echoed `$?` inside `bash -c`; capture exit codes in a script file and read each gate's own summary line. Never pipe a gate into `tail`.
- Redirect long output to a log file rather than streaming it (a 600 s silent stream gets killed).
- Run each gate as a blocking foreground call. The Bash tool backgrounds any call over 180 s and notifies on completion; if that happens, wait with `timeout 175 tail --pid=<your own pid> -f /dev/null` on YOUR process (check `/proc/<pid>/cwd` is in your worktree), then read the gate's own log. Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches; read the process's own output, or write to a per-run unique path.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad** (workers have hung on the permission prompt). Leave throwaway files in place; overwrite with `>` or use fresh unique names. The only allowed delete is the literal `rm -f main.js styles.css` inside the plugin root before jest. Never `rm` with a shell-variable path.
- Never `pkill`/`killall` by pattern; kill only a PID whose cwd is inside your worktree.
- Scratch files: use the Write tool, inside your private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc614-r1-impl/` with uniquely named scripts and logs.
- No tags, ever, on draw-steel-elements. No pushes.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc614-conditions-mouse-remove-focus/sc614-r1-impl-report.md`. It must open with a ≤10-line executive summary (verdict, final dse sha, superproject sha, gate numbers). Body: diagnosis, fix (file:line), tests added (names, red-on-base evidence), survey answers (a) and (b), `Drive-by fixes:` and `Follow-ups:` lists. If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Your final text goes to the ticket-owner: raw facts, no prose — STATUS (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED), dse sha(s), superproject sha, measured gate numbers, and the absolute path of every evidence artifact you produced (report, logs). You cannot `SendMessage` me — a message to `main` goes to the dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question; I will resume you. If you ever send a message anyway, its first word must be `SC-614:`.
