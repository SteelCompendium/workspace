# SC-614 r2 — independent review brief

You are the independent reviewer for SC-614. You did not write this code. Your final text goes to the ticket-owner, not a human.

## 1. Context loading

- Read FIRST: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc614-conditions-mouse-remove-focus/decisions.md` (ticket text, owner rulings = the spec, baseline) and the r1 implementer report `sc614-r1-impl-report.md` in the same dir (executive summary first; body as needed).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc614-conditions-mouse-remove-focus`, branch `sc614-conditions-mouse-remove-focus`. Review range: dse `27120710..283cb2f5` (rebased onto develop 27120710 after SC-568 and SC-621 landed); superproject `a7a989ef..c98a004d` (CHANGELOG only). `git -C <worktree>/draw-steel-elements fetch origin` and report whether `origin/develop` moved off `27120710`.
- **You never call the tracker (Linear).** Do not commit to the branch; write any probe code in a throwaway copy or revert it, and leave the branch at `283cb2f5` when you finish (verify with `git status`).
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected; do not report it.

## 2. The task — execute and probe, not just read

Spec (owner rulings, verbatim):

> - 2026-11-13 — **Behaviour.** When keyboard focus is inside the tracker's conditions row (on Add condition, or on another condition's remove button) and a mouse press on a condition's remove button removes that condition and redraws the conditions row, focus lands on the REBUILT replacement of the control that had focus before the press (Add condition → the new Add condition button; another condition's remove button → that same condition's new remove button). If that control no longer exists after the redraw, focus goes to its successor by the existing `controlSuccessor` rule. If focus was elsewhere in the tracker (outside the conditions row), the conditions-row redraw does not touch it and nothing changes. If focus was NOT inside the tracker before the press, nothing changes (SC-588: "A mouse click never pulls focus into the tracker").
> - 2026-11-13 — **Scope.** Both conditions rows (hero rows and creature rows: both callers of `buildConditionRow`) and both views where the tracker lives (Reading view and the pinned sidebar tracker). [...] Live Preview losing focus on the tracker's own save is SC-602 — out of scope.
> - 2026-11-13 — **Tests.** jest case(s) shown RED on the base and green on the fix; plus real-Obsidian e2e coverage in `e2e/specs/initiative/` [...] Plus the negative: blur to `<body>` (assert that start state first), mouse remove, focus is not pulled into the tracker. No bracketed ticket id in test titles.

Probe at least:
1. Mutation: revert each part of the fix (e.g. drop the capture, drop the "focus was inside" guard, drop the successor fallback) and confirm a jest and/or e2e test goes red for each. A test that stays green under a mutant is a finding.
2. Hero row AND creature row (minion squad / group rows if they reach `buildConditionRow`); the pinned sidebar tracker; two quick remove clicks in a row (SC-186 INFO-2 stale-generation path); removing the last condition; focus on a different condition's remove button; focus in the tracker but outside the conditions row (e.g. Stamina); focus outside the tracker.
3. Does the restore ever steal focus from somewhere the user moved it during the redraw (focus-is-free check), or fire `:focus-visible` oddly? Does the Conditions window's apply callback path still behave (SC-603 hand-back)?
4. The implementer's survey answers (keyboard removal; other `rerender` callers) — verify them.
5. Re-run jest, e2e and the lifecycle parts yourself (gate rules below); confirm the reported numbers.

Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, a failure scenario, and a prescribed fix. Verdict: LAND / LAND AFTER FIXES / DO NOT LAND.

## 3. Gates — the `dse-verify` skill

`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (≈370 KB — read in parts: "The battery, in order", "Devbox wrapping", "THE exit-code footgun", "Load-sensitive jest suites", "Lifecycle and e2e notes"). Expected on the branch: jest = r1's reported count (base at 27120710: 11892 passed / 2 skipped fresh without the shots cache; global testTimeout is 30 s since SC-568 — an "Exceeded timeout of 30000 ms" is a real hang until proven otherwise); lifecycle 64/64 in SEVEN `--only=` parts (`G-S7a … G-S9a` 21; `G-S9b … G-S40` 16; `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` 9; `G-S57,G-S62,G-S61,G-S56` 4; `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` 7; `G-S92,G-S96,G-S97,G-S99` 4; `G-S108,G-S112,G-S115` 3 (about 200 s, over the 180 s tool limit: one part per call, log to a file, poll your own pid) — exact lists for parts 1–2 from the skill); e2e = r1's reported N/M with 0 failed, 3 known-bug, all pairs covered (base 338/341, 176/176). If G-S97 fails, restore a dirty `demo-vault/.obsidian/appearance.json` first (SC-622). A G-S91 FAIL is real unless it says the host was too slow after two re-runs.

Command-shape rules:
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc614-conditions-mouse-remove-focus/draw-steel-elements -- bash <script file>`; never `cd` inside a compound command; `git -C <absolute path>` always.
- Never trust an echoed `$?` inside `bash -c`; capture exit codes in a script file and read each gate's own summary line. Never pipe a gate into `tail`.
- Redirect long output to a log file. Run gates as blocking foreground calls; the Bash tool backgrounds calls over 180 s — then wait with `timeout 175 tail --pid=<your own pid> -f /dev/null` (check `/proc/<pid>/cwd` is your worktree) and read the gate's own log. Never key a wait-loop on a scratch filename or its contents (stale logs from other branches will match); use per-run unique paths.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad.** Leave throwaway files in place. Only allowed delete: the literal `rm -f main.js styles.css` in the plugin root before jest. Never `rm` with a shell-variable path.
- Never `pkill`/`killall` by pattern; kill only a PID whose cwd is inside your worktree.
- Scratch: the Write tool, inside `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc614-r2-review/`, uniquely named files.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc614-conditions-mouse-remove-focus/sc614-r2-review-report.md`, opening with a ≤10-line executive summary (verdict, counts by severity, measured gate numbers). If the write is blocked, return the report inline.

## 5. Return contract

Final text to the ticket-owner: raw facts — verdict, finding counts, measured numbers, the sha you reviewed, and absolute paths of every artifact. You cannot `SendMessage` me (a message to `main` reaches the dispatcher, not me); if you need input, end with STATUS: NEEDS_CONTEXT and the question. If you ever send a message anyway, its first word must be `SC-614:`.

## 6. Extra items for this round (owner, after r1)

- r1 changed the SHARED kit `src/framework/kit/conditionIcons.ts` (`onRemove` now also receives the pressed button). Check every other consumer of that kit (grep the callers) still behaves, read-only mode included.
- r1 also fixed keyboard removal (Enter/Space on a chip) with the same mechanism (survey item (a)); jest F29. Verify where focus lands for keyboard removal of a middle chip, the last chip, and the only chip.
- r1 measured shots / freeze BEFORE its last rebase (on `18c986c0`) and carried them. Re-run shots (expect 592, host-leak 163/978, modal host-leak 40/240, capture clip 147), the freeze check (280/280, 0 FAILED: `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <worktree>/draw-steel-elements/visual-harness/shots`) and parity last (0/0/24) on `283cb2f5` yourself. Shots can pass the 600 s tool limit under load: log + rc file, poll your own pid.
- r1's own logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc614-r1-impl/` (read-only for you).

- G-S115 (g) (SC-633, relayed from the SC-621 owner): a G-S115 (g) red that shows the "changed on disk first" Notice on a loaded host is a suspected flake; re-run part 7 once. A red on the re-run, on a quiet host, or in any other G-S115 cell (a)-(f), (h), (i) is a real signal.
