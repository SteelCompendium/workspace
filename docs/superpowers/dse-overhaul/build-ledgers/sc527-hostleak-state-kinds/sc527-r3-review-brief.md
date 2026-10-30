# SC-527 r3 brief — independent adversarial review (orchestration:reviewer)

You are the r3 independent reviewer for Linear ticket SC-527. You did not write this code.
Your final text goes to the ticket-owner, not a human. **Workers never call the tracker**
(Linear) — not to read history, not to post.

## 1. Context loading
1. Ledger (rulings verbatim; current state): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc527-hostleak-state-kinds/decisions.md`
2. r1 survey (executive summary + sections 2, 3, 4): `.../sc527-hostleak-state-kinds/sc527-r1-survey-report.md`
3. r2 implementation report: `.../sc527-hostleak-state-kinds/sc527-r2-impl-report.md`
4. Prior art: SC-513's tracked ledger + review `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc513-hostleak-click-revealed/` (`decisions.md`, `sc513-r3-review-report.md` — copy its probe methods).
5. `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery, command shapes, CURRENT ~line 1231, "Button host-leak sweep" bullet ~line 197).

Worktree: `/home/scott/code/steelCompendium/worktrees/sc527-hostleak-state-kinds`, dse branch `sc527-hostleak-state-kinds` @ `369b3a3` on `71437da`. First `git -C <dse abs path> fetch origin`; if origin/develop moved past `71437da`, say so (do not rebase — report it). Leave the tree exactly as found (clean); revert every probe with `git checkout --`.

## 2. The task
Review `71437da..369b3a3` against the ticket task (verbatim): "decide per kind whether the sweep should reach the state by a real click in its own load (no capture change), and add it with a named failure if the state is not reached." and the ledger's owner rulings. **Execute and probe, do not just read.** At minimum:
- Re-run shots on head: rc, 592 PNG sha256 vs `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc527-r1-abb0c6465158755e8/shots-base.sha256`, freeze, every host-leak line (expected button 157 / 942, 34-record boundary; modal 228; input 15/176; checkbox 7/116; prose 106 [212]). Check each new boundary record is legitimate.
- Leak probe: a host-only CSS rule that hits ONLY the SC-527 states -> must go rc 1 on exactly the new kinds; the same probe on base `ed368f6` harness must stay green (proves the gap was real).
- State-not-reached probe: make one or two state changes silently fail (e.g. a click that lands but changes nothing; a section whose fixture already sits in the target state) -> named FAIL, rc 1. Look for a way the sweep could print OK while a state was never reached (vacuity).
- First nodes: 0 existing kinds lost, 0 first nodes moved, base URL vs branch URL+states, dark and light, with the sweep's own tag functions (SC-513 r3 method).
- Jest: run the new tests; break the code each guards and confirm each fails (name any test that guards nothing).
- Rebase-friendliness with SC-526 (which will add the Recoveries popover click at the END of `mountClickRevealedForSweep` and `staminaRecoveryPopover` to `SC513_PREFS`): confirm SC-527's code does not touch those, and that a popover opened after SC-527's clicks would not be closed by them. Confirm SC-527 adds no pref and does not mount the popover.
- Scope: harness/test only; no `src/`, no capture path change, no freeze file touched.
- Full tsc + lint + jest. Lifecycle/e2e: compare built `main.js`/`styles.css` hashes at `71437da` vs `369b3a3`; if identical, r2's runs carry and you need not re-run; if not, run both.

## 3. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc527-hostleak-state-kinds/sc527-r3-review-report.md` — ≤10-line executive summary first (verdict LAND-READY / NOT; counts by severity). Findings by severity (HIGH/MED/LOW/INFO) with file:line, failure scenario, prescribed fix. Then probes with exact commands, rc and summary lines, and evidence paths.

## 4. Return contract
Final text: raw facts, no prose — verdict, finding counts, the shas reviewed, measured numbers, and the filesystem path of every evidence artifact.

## Footguns (all mandatory)
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents.
- ONE gate per Bash call, blocking foreground (timeout 600000). No `run_in_background`, no Monitor. If the harness backgrounds a >600 s call, wait on the gate's PID with `tail --pid=<pid> -f /dev/null` in a foreground call, then read the gate's own log/rc file.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc527-hostleak-state-kinds/draw-steel-elements -- bash <script-file>` (script via the Write tool; exit code recorded inside the script). Never `echo rc=$?` inside `bash -c`. Never a compound `cd X && …`; `git -C <abs path>` for every git command.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc527-r3-<yourAgentId>/`, unique script/log names, written with the Write tool.
- No `rm` with a shell-variable target, no glob `rm`; never `rm -rf` under `.superpowers/` or a `/tmp` glob.
- Never `pkill`/`killall` by pattern; kill only by PID whose `readlink /proc/<pid>/cwd` is in your worktree.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault — expected; do not touch it.
- You cannot `SendMessage` me — `to: 'main'` routes to the dispatcher. If you need input, end with STATUS: NEEDS_CONTEXT and the question. If you ever message anyway, the FIRST WORD must be `SC-527:`.
