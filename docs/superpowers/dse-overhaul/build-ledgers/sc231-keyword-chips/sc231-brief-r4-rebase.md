# SC-231 r4 — rebase onto develop b029baa, full battery, recompute rebaseline

## Context
- Ledger (read first): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc231-keyword-chips/decisions.md. Prior reports in the same dir: sc231-r1-impl-report.md (r1–r3 sections), sc231-r1-review-report.md, sc231-r2-rereview-report.md — read their executive summaries only.
- Worktree: /home/scott/code/steelCompendium/worktrees/sc231-keyword-chips/draw-steel-elements, branch `sc231-keyword-chips`, HEAD a6fce4a (11 commits on 619c4bd). Verify `pwd` before any write. Never write under /home/scott/code/steelCompendium/workspace/ except files in the ledger dir above. Never touch DSE `main`; no tags/releases.
- Scott approved the look (ledger, 2026-09-25 comment fb3a9458: "this looks good."). No code/design change in this round — rebase + gates + rebaseline only.
- You NEVER call the tracker (Linear).

## Task
1. `git fetch origin develop`; confirm tip is b029baa (if it moved, use the new tip and report it). `git rebase origin/develop`. Since 619c4bd, SC-243, SC-230, SC-272, SC-236, SC-255 landed. Resolve conflicts preserving both sides' intent (CHANGELOG: keep both entries). If a conflict touches renderFeature.ts or the keyword CSS in styles-source.css in a non-trivial way, STOP and return STATUS: NEEDS_CONTEXT with the conflict hunks. `npm ci` if package.json's obsidian version or lockfile changed. Commit/continue; tree clean after.
2. Full battery per /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md, in order: tsc, lint, jest, obsidian-lifecycle, shots, freeze, parity LAST. Read the skill's current expected numbers at the develop tip (they moved with SC-255/SC-236 — check the latest dated entries). Last known: jest 4046/1/208of209 on 619c4bd+branch (develop has grown since); lifecycle 19/19; shots 524 (check whether SC-255/SC-236 changed the count); parity 0/0/16.
3. Freeze: shared baseline is 260 lines (now includes SC-236's 8 and SC-255's 20 applied lines). Expect `FREEZE VIOLATED` with ~55 mismatches. Required:
   a. Move the old file: `mv rebaseline.txt rebaseline-r3.txt` (in the ledger dir), then write a NEW `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc231-keyword-chips/rebaseline.txt` = `sha256sum` lines (same `<hash>  <filename>` format as the baseline, basename only) for exactly the mismatching filenames, from your real shot bytes. Run shots+freeze TWICE and confirm the two sweeps give identical hashes.
   b. Compare the new name set to rebaseline-r3.txt's 55 names: list added names, removed names, and names whose hash changed. ANY name not in rebaseline-r3.txt's set → STOP and report (that is movement Scott has not seen).
   c. For the lines overlapping SC-236's changes (feature, feature-collapsed, feature-spend, chrome-collapsed-rollout; twin + realprint) prove the movement is still only the keyword-row glyph shift: build develop-tip shots in a throwaway worktree (`git -C <wt>/draw-steel-elements worktree add --detach /home/scott/code/steelCompendium/worktrees/sc231-keyword-chips-dev-r4 origin/develop`, `npm ci` there, `npm run shots` there — FOREGROUND, logs prefixed sc231-r4-dev-), confirm its freeze reads `freeze OK (260/260 …)`, then for each of the 8 files compute the diff bbox + changed-pixel count vs your branch shots (python PIL). Remove the throwaway worktree afterwards with `git -C <wt>/draw-steel-elements worktree remove --force <that path>` and confirm `git worktree list`.
   Never edit the shared baseline.
4. Append an r4 section (≤10-line summary first) to sc231-r1-impl-report.md.

## Gates hygiene / footguns
- FOREGROUND ONLY: Bash timeout 590000, each gate's output to its own log `sc231-r4-<step>.log` in the ledger dir, rc captured inside `devbox run -- bash -c 'cd <abs> && <cmd> > <log> 2>&1; echo rc=$? >> <log>'`. No Monitor, no run_in_background, never end your turn waiting on a job. Never pipe a gate into tail.
- NEVER pkill/killall by pattern — other worktrees run the same gates. Kill only by PID whose command line contains `worktrees/sc231-keyword-chips` (`pgrep -af "worktrees/sc231-keyword-chips"`, read each line first).
- Commit after each coherent step (the rebase itself is the commit set here).
- If a non-feature jest suite fails under load, re-run it alone, then the full suite once; report both.
- If the report-file write is blocked, return the report inline.
- Never key a wait-loop on a scratch filename or its contents; the scratch dir is pre-populated across sessions.
- Never `rm -rf` the shared `.superpowers/`; only touch files inside `.superpowers/sdd/sc231-keyword-chips/`.
- You cannot SendMessage me; `to: 'main'` reaches the dispatcher. If you need input end with STATUS: NEEDS_CONTEXT. Any stray message must start with `SC-231:`.

## Return
Final text to the ticket-owner (raw facts): new HEAD sha, base sha, every gate result verbatim, freeze line verbatim, new rebaseline.txt line count, the name-set comparison (added / removed / hash-changed), the 8 overlap bboxes + pixel counts, and absolute paths of every log and artifact.
