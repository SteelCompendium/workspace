# SC-570 r3 — independent review of the RECOV-R07 test fix (reviewer)

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc570-recov-r07-double-write/decisions.md` (ledger), then the executive summaries of `sc570-r1-diagnosis.md` (diagnosis, by a different reviewer) and `sc570-r2-impl-report.md` (the implementation) in the same dir. Treat both as claims to verify, not facts.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc570-recov-r07-double-write`, dse at `draw-steel-elements/` on branch `sc570-recov-r07-double-write`; review `git -C <abs>/draw-steel-elements diff e5b6f9f2..HEAD` (base = dse origin/develop `e5b6f9f2`; confirm with `git fetch`; if develop moved again, say so). Never work in `/home/scott/code/steelCompendium/workspace/draw-steel-elements` (shared main checkout; its `demo-vault/` dirt is Scott's live vault — expected).
- r1 probe artifacts (read-only): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc570-r1-reviewer-k7q2/` (`k7q2-driver-probe.diff` = env-gated driver lag / CDP CPU throttle).
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (~320 KB — grep; battery table ~lines 20-135, devbox wrapping, "Lifecycle and e2e notes (SC-480)").
- **You never call the tracker (Linear).**

## 2. The task

Execute and probe, don't just read. Rulings (quoted from the ledger):

> 2026-11-11 (after r1): r1 verdict **TEST** accepted — product writes are correct (debounce supersedes, flush serializes live model, adapter.process serializes writes; content right in every forced run). Fix = r1's prescribed e2e change (`dse.settle()` + `expectNoteBlock(... {current_stamina: 12, recoveries: 4})` before the Catch breath `waitForWrite` in RECOV-R07).

> 2026-11-11: amended: test-only fix may ALSO add jest cases to `test/dom/elements/staminaRecoveries.test.ts` pinning the one-window path the e2e now gives up — r1 probes P1 … P2 … and P3 …, asserting write CONTENT. No product change, no CHANGELOG entry.

Check, at minimum:
1. **Is the TEST verdict right?** Independently try to break the product claim: can any user sequence on the Recoveries popover (−/+/Catch breath, also the card's non-popover Recoveries controls and undo toast if they share `persist()`) end with a wrong note (Recovery spent twice, heal lost, stale value last)? Probe at runtime (jest with fake timers on the real view), not by reading alone.
2. **Does the e2e fix mask a real double write?** E.g. mutate the product so Catch breath writes twice (or persist() fires twice) and show RECOV-R07 still goes red with the fix in place. Show the fix goes green under r1's forced lag/CPU-throttle probe where the base is red (spot-check one condition; apply the probe uncommitted, revert after).
3. **jest cases**: do they assert content, are they vacuous (kill them with a mutant), do they follow the file's conventions, are they stable under load (fake timers, no wall-clock)?
4. Diff hygiene: only `e2e/` + `test/` files changed; no product source; no bracketed ticket id in any test title; no CHANGELOG; commit messages without AI attribution.
5. `sc570-skill-proposal.md` — accurate and minimal?
6. Re-run jest and the full e2e yourself; spot-check `main.js` / `styles.css` byte-identity against a clean `e5b6f9f2` build. Lifecycle: re-run only if the r2 report's lifecycle numbers look wrong or incomplete.

Expected: jest = 7283 passed / 2 skipped (fresh worktree) + the new cases; e2e `OBSIDIAN-E2E done: 264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`; lifecycle 56/56 (21 + 16 + 9 + 4 + 6; part 5 `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87`).

**Do not commit** to the branch. Leave the worktree clean.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc570-recov-r07-double-write/sc570-r3-review.md`, opening with a ≤10-line executive summary: verdict LAND-READY / FIX-NEEDED, findings count by severity, gate lines you measured. Findings by severity (HIGH/MED/LOW/INFO) with file:line, failure scenario and prescribed fix.

## 4. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — verdict, findings, shas, measured numbers — plus the absolute path of every evidence artifact.

## Footguns (all apply)

- If the report-file write is blocked by your harness, return the report inline.
- Scratch: use a private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc570-r3-review-<4 random chars>/` with uniquely named scripts and logs; the session scratchpad is shared by every agent — never a generic name like `gate.sh`. Create scratch files with the Write tool.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents. Run each gate as ONE blocking foreground call; no `run_in_background`, no Monitor, no waiting for a completion notice (it never comes).
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc570-recov-r07-double-write/draw-steel-elements -- bash <script-file>`; never `cd X && devbox …` compound commands. Devbox eats `$?` / `$PIPESTATUS` and `| tail` masks failures: record exit codes from inside a script file, read each gate's own summary line.
- Before `npx jest`: `rm -f main.js styles.css` in the plugin root (literal absolute paths). Jest timeouts under load (check `/proc/loadavg`) are not regressions — re-run the suite alone.
- **Never `rm -rf` a `/tmp` glob** (e.g. `/tmp/dse-obsidian-*`, `/tmp/dse-e2e-*`): a worker did this today and wiped other efforts' kept lifecycle FAIL dirs. Delete only literal paths you created and recorded. No `rm` with a shell-variable target (it hangs on a permission prompt). Never `rm -rf` anything under `.superpowers/`.
- **Never `pkill`/`killall` by pattern** — other efforts run the same e2e/obsidian commands. Kill only a PID whose `readlink /proc/<pid>/cwd` or command line is inside YOUR worktree.
- Every git command as `git -C <absolute path> …`, never `cd X; git …`.
- Never put a bracketed ticket id (e.g. `[SC-570]`) in an e2e test title — the runner reads bracketed ids as scenario ids.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` goes to the dispatcher, not me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report. If you ever do send a message, its FIRST WORD must be `SC-570:`.
