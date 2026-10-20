# SC-427 independent review brief — round 1

## 1. Context loading
- Read `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc427-apply-label/decisions.md` (the spec: ticket text + owner rulings O1–O7), `sc427-brief-impl.md` (what the implementer was asked), and `sc427-impl-r1-report.md` (what it claims) in the same dir. **Workers never call the tracker.**
- Code under review: DSE repo `/home/scott/code/steelCompendium/worktrees/sc427-apply-label/draw-steel-elements`, branch `sc427-apply-label`, head = 9aab55b, diff = `git -C <dse> diff c616e22..9aab55b`. Also the superproject `CHANGELOG.md` diff in `/home/scott/code/steelCompendium/worktrees/sc427-apply-label` (`git -C` that path `diff`).
- You review; you do NOT edit the branch. Probe in a scratch copy if you need to mutate code (e.g. `git worktree add /tmp/claude-1000/sc427-review-<unique> 9aab55b` inside the DSE repo via `git -C`; remove it when done — delete only that exact path).
- Every git command uses `git -C <absolute path>`. Never write under `/home/scott/code/steelCompendium/workspace/` except your report in the ledger dir.

## 2. What to do — execute and probe, don't just read
- Check every O1–O7 ruling is met. Especially O1's invariant ("the Stamina stepper's shown value, the Apply label (committed AND half-typed draft), and the persisted value always agree") — hunt for any input path that breaks it: typing then Enter, typing then blur, typing then clicking Apply with no blur, typing then pressing Damage/Healing/Kill/Spend Recovery, ± at and past both bounds, hero floor vs creature floor 0, Temp Stamina interactions, Escape on a draft, Reset mid-draft, "1e3"/"2.5"/"-0"/""/"e" in each numeric field.
- O2: open on hand-edited out-of-range currents (25/20, creature −3, hero −10 with floor −7, and current == max/floor exactly) — confirm "No Stamina Change", Apply disabled, nothing persists on close.
- If the kit stepper was changed: find every other consumer (`grep` the repo) and prove they are unaffected (run their tests; probe one min/max-bounded consumer).
- Re-run jest (whole suite) and e2e (`npm run e2e`, full run) yourself; spot-check that the flipped tests fail on pre-fix src (stash src in your scratch copy). Confirm the CHANGELOG bullets are accurate and plain-language.
- Gate expectations (dse-verify skill, `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`, read its command shapes first): jest ≥ 4849 passed / 1 skipped / 228 of 229 suites (base c616e22); e2e `0 failed`, known-bug 8 → 5, coverage Y/Y.

## 3. Findings
By severity (CRITICAL/HIGH/MEDIUM/LOW/INFO), each with file:line, a concrete failure scenario (steps → wrong result), and a prescribed fix.

Footguns: devbox wrapping `devbox run -c <dse> -- bash -c 'cd <dse> && <cmd>'`, gates via wrapper script files with output redirected and exit code to a per-run unique path, run in the FOREGROUND (never background-and-wait); `rm -f main.js styles.css` before jest; never pkill/killall by pattern (kill only PIDs whose cmdline contains your own path); never `rm -rf` a shared /tmp glob or anything under `.superpowers/` you didn't create; never key a wait-loop on a scratch filename — stale logs from other branches match; never `--headed` on `:1`. If the report-file write is blocked, return the report inline. You cannot SendMessage me; if you need input end with STATUS: NEEDS_CONTEXT. If you ever message anyway, first word `SC-427:`.

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc427-apply-label/sc427-review-r1-report.md`, opening with a ≤10-line executive summary (verdict, counts by severity).

## 5. Return contract
Final text to the ticket-owner, raw facts: verdict (LAND / FIX), findings list by severity with file:line, measured gate lines + exit codes, and absolute paths of every evidence artifact.

## 6. Notes for this round (UPDATED after a session crash, 2026-10-19)
- Owner ruling O8 (ledger) accepts the clamped DISPLAY of an out-of-range stored value — don't flag that as a defect, but do probe that it never stages a change.
- SCOPE NOW: the FULL range `c616e22..943fc47` — round 1 (d04f894, 99fb142, 9aab55b) AND round 2's folds F1–F3 (4d51550, 943fc47; ledger "Owner rulings, round 1"). F1–F3 ARE in scope: check them against their ledger text. Superproject CHANGELOG: commits 3dba6f1 + 929cfc2 (the implementer is rebasing that superproject branch onto origin/main concurrently — review the CHANGELOG text, not its sha).
- Make your scratch worktree at 943fc47 (`git -C <dse> worktree add /tmp/claude-1000/sc427-review-r1b-<unique> 943fc47`); the earlier one at 9aab55b died with the session and was pruned. Run everything there.
- Use lifecycle port 9293 (`DSE_LIFECYCLE_PORT=9293`); the implementer is concurrently re-running its battery on port 9291 in the real worktree.
