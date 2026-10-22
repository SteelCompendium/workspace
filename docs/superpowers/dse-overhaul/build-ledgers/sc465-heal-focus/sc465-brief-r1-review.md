# SC-465 r1 independent review brief — Stamina modal heal-button focus fix

You are reviewer B (orchestration:reviewer) for SC-465. You did not author this change. Your final text goes to the ticket-owner, not a human.

## 1. Context loading

- Ledger (spec + owner decisions): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc465-heal-focus/sc465-decisions.md`.
- Implementer's brief and report: `sc465-brief-r1-impl.md` and `sc465-r1-impl-report.md` in that dir. Read the report's executive summary first; read the body where you need it.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc465-heal-focus`, repo `draw-steel-elements`, branch `sc465-heal-focus`. Review range: `git -C /home/scott/code/steelCompendium/worktrees/sc465-heal-focus/draw-steel-elements log --oneline origin/develop..HEAD` (base `e4c5cf6` unless the report says it rebased). Superproject: CHANGELOG bullet on branch `sc465-heal-focus` vs `origin/main`.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery + command shapes) and `draw-steel-elements/e2e/README.md`.
- **Workers never call the tracker** (Linear).
- Do not commit to the branch. Probes/mutations go in a throwaway copy or are reverted with `git -C … stash`/`checkout -- <exact file>` — and the branch must be byte-identical to the implementer's head when you finish (verify with `git -C … status --porcelain` and `rev-parse HEAD`).
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore it.

## 2. The task

The owner decisions under review (verbatim from the ledger):

> - Focus rule (follows the SC-428 M1 precedent in `src/framework/kit/RecoveriesStrip.ts` ~:347): when the heal button disables itself while it holds focus, move focus to the NEXT enabled tab stop inside the modal in DOM order (fall back to the previous one); never `<body>`, never outside the modal. Use `{ preventScroll: true }`. Same rule for the SC-432 confirmation's return-focus (~:601): if the heal button is disabled when the confirmation closes, focus goes to that same fallback, not to the disabled button.
> - Both heal paths are in scope: pool hero "Spend Recovery" and no-pool hero "Heal Recovery Value" (after Confirm). Other modal controls that can disable themselves while focused (e.g. SC-433 temp "−" at 0, Apply at "No Stamina Change", stepper bounds) are surveyed: a modal-local one in StaminaEditModal.ts with the same shape is FOLDED (same helper); a shared kit component (stepper) fix is NOT made here — report it as a follow-up for an owner ruling.

**Execute and probe, do not just read.** At minimum:
1. Re-run the battery yourself: tsc (+ `tsc -p e2e`), lint, jest, and a FULL e2e run (evidence of record). Lifecycle and shots/freeze/parity: re-run lifecycle; shots/freeze/parity only if the diff touches CSS, a rendered DOM shape, or the harness (say which you skipped and why).
2. Discrimination: revert only the fix (keep the tests) and confirm the new jsdom and e2e tests go red; restore.
3. Real-Obsidian probes (via e2e `--only` iteration or a throwaway scenario you do NOT commit): keyboard heal to max on the pool path and the no-pool path (Enter and Space), confirmation Cancel / Escape / X when the heal button is still enabled (focus must still return to the heal button there — no regression), a heal that does NOT reach max (focus stays on the button), mouse click heal to max, Shift+Tab after the move, and that the focus ring shows on the target after a keyboard heal. Also: a heal from the initiative tracker host's stamina modal if that host reaches the same code.
4. Check the survey: are there other self-disabling focused controls in the modal the implementer missed or misclassified (modal-local vs kit)?
5. Check that nothing writes to the note differently (the fix must be focus-only), and that the CHANGELOG bullet is plain and accurate.

## 3. Gates — expected numbers at `e4c5cf6` before this change

tsc/lint clean · jest **5711 passed / 1 skipped / 238 of 239 suites** + the new tests · lifecycle **31/31** · e2e **`101/101 ok, 0 failed, 0 known-bug, coverage: 66/66 pairs`** + the new tests · shots 580, freeze 280/280, parity 0/0/24.

Command shapes and footguns (all mandatory):
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc465-heal-focus/draw-steel-elements -- bash <script file>`. Never `cd` inside a compound command.
- Record exit codes from inside a script FILE (devbox eats `$?`); read each gate's own summary line.
- **Each gate is ONE blocking foreground Bash call** (separate calls for lifecycle / e2e / shots / parity). No `run_in_background`, no Monitor. Redirect long output to a log file.
- **Private scratch:** `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc465-r1-review-<your agentId>/`, uniquely named scripts and logs. Never a generic name at the scratchpad top level.
- Write scratch files with the Write tool (no heredocs). No glob `rm`; delete only exact paths you created. Never `rm -rf` a shared `/tmp` glob or the shared `.superpowers/` dir.
- Never `pkill`/`killall` by pattern; kill only a PID verified yours (`pgrep -af "worktrees/sc465-heal-focus/"` or `readlink /proc/<pid>/cwd`).
- Every git command is `git -C <absolute path> …`.
- `DSE_LIFECYCLE_PORT=9293` for lifecycle.
- Never key a wait-loop on a scratch filename or its contents. Read the process's own output, or a per-run unique path.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc465-heal-focus/sc465-r1-review-report.md`, opening with a ≤10-line executive summary (verdict APPROVE / CHANGES, counts by severity, the head sha you reviewed, your measured gate lines). Body: findings by severity (CRITICAL / HIGH / MEDIUM / LOW / INFO) with file:line, a failure scenario, and a prescribed fix for each; probe results; discrimination results.

If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Final text to the ticket-owner — raw facts, no prose: verdict, finding list (severity + one line + file:line), reviewed sha, every gate summary line you measured, and the absolute path of every evidence artifact (report, logs, shots).

You cannot `SendMessage` me — `to: 'main'` routes to the dispatcher, not me. If you need input, end your turn with STATUS: NEEDS_CONTEXT and the question. If you ever send a message anyway, its FIRST WORD must be `SC-465:`.

## 6. Owner additions after r1 (2026-10-22)

- Implementer head under review: dse `7f83724` (`adb0684`, `7f83724`) on `e4c5cf6`; superproject `7671c43` on `6bf71ca`. Expected after this change: jest 5717/1/238 of 239; e2e 104/104 ok, 0 failed, 0 known-bug, 69/69.
- Explain one oddity: the full e2e prints `coverage driven: 70 (control, kind) pair(s)` against `coverage: 69/69 pairs`. Is a driven pair missing from the manifest (which the gate should catch), or is the extra pair outside manifest scope by design? Check whether it existed before this change (run on `e4c5cf6` or read its coverage.json).
- Confirm or refute A's follow-up: `FreeHealConfirmModal`'s dismiss callback also runs when the Stamina modal is closed from under it, and then focuses a control in a closing modal. A says harmless. Probe it (focus must not end up somewhere surprising, no error in console).
- OUT OF SCOPE: the kit stepper's own focus loss at its bounds is SC-495. Do not report it as a finding.
