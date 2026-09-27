# SC-255 r5 — rebase onto current develop, re-gate, recompute rebaseline.txt

You may be a replacement worker. Everything is in files.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc255-skills-collapse/decisions.md`
  (read all of it, especially the "Dispatcher update 2026-09-27" section).
- Prior reports, executive summaries only: `sc255-r2-review-report.md` and `sc255-r3-fix-report.md` in the same dir.
- Gate rules: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`. Read "The battery,
  in order" and "Current expected numbers" (the SC-340 table).
- Worktree repo: `/home/scott/code/steelCompendium/worktrees/sc255-skills-collapse/draw-steel-elements`, branch
  `sc255-skills-collapse`, currently at `4ff0b88` on old base `6c4f6aa` (7 SC-255 commits: 8dc12b6, c4e6e8b,
  cbbb190, e9780d3, 20b188c, 5724710, 4ff0b88). Verify `pwd` and branch before any write.
- **You never call the tracker (Linear).** Never touch DSE `main`; never tag or release DSE.

## 2. The task

1. **Rebase.** Inside the DSE clone, fetch right before you rebase (`git fetch origin`), then
   `git rebase origin/develop`. When this brief was written, origin/develop was `ade5064` (SC-236 landed on
   top of `36635e9`). Use whatever the tip is when you fetch, and report it.
   - The owner checked that `src/elements/skills/` did not change on develop between `6c4f6aa` and `ade5064`.
     Expect conflicts only in `CHANGELOG.md` (keep both entries, ours under the unreleased section) and possibly
     `styles-source.css` (ours is a comment-only edit near the skills group rule; keep develop's rules intact).
   - If a conflict lands in any other `src/` file, or SC-340's view-adoption changes to the framework
     (`ElementView`, chrome) change how `SkillsView` mounts, resolve it minimally and **list every conflict
     hunk and how you resolved it** in the report. The owner will send any non-trivial resolution to review.
   - If `package.json`'s obsidian version changed, run `npm ci` first.
   - Leave the branch as the rebased commits; do not squash. If a resolution needs a fix-up, commit it
     separately (`fix(skills): SC-255 r5 …`, **no AI attribution or Co-Authored-By trailers**). Commit after
     every step. Do not push.
2. **Base freeze check.** Before judging the branch, confirm the NEW base is clean against the current shared
   baseline. In a throwaway detached checkout (`git worktree add /home/scott/code/steelCompendium/worktrees/sc255-skills-collapse/.base-check origin/develop`
   inside the DSE clone; remove it with `git worktree remove` after), run `npm ci` if needed, then `npm run shots`
   and the freeze check. The expected result is `freeze OK (260/260 …)`. If it isn't, STOP and report
   (`STATUS: NEEDS_CONTEXT`): it means the shared baseline and develop disagree, which is not your fix.
   Alternative if a second checkout is impractical: say so and skip this step. Then the branch freeze check
   below must show only the 20 skills names.
3. **Full battery on the rebased head,** in dse-verify order, every gate in the foreground, output to per-run
   logs under `.../sc255-skills-collapse/sc255-r5-logs/`:

| Gate | Expected |
|---|---|
| tsc | clean |
| lint | clean, exit 0 |
| jest | all green. Report totals. Expected ≈ develop's own totals + 2 (SC-255's net: −1 from r1, +2 from r3, so +1 vs develop if develop's totals include nothing of ours). Report base-vs-branch if you measure base |
| obsidian-lifecycle | `OBSIDIAN-LIFECYCLE done: 19/19 ok, 0 failed`, exit 0 (~5 min) |
| shots | 524, 0 FAIL (unless develop changed the count; report it) |
| freeze | `FREEZE VIOLATED (20 checksum mismatches, 0 missing)` on exactly the 20 skills names in the current `rebaseline.txt`. Any other name failing is a defect or a baseline/develop mismatch: stop and report |
| parity (LAST) | 0 GAPs / 0 undeclared / 16 DECLARED, exit 0 (or develop's current documented set) |

4. **Recompute the rebaseline.** Run `npm run shots` a second time. Hash the 20 skills print/realprint PNGs from
   both runs; they must be identical across runs. Write them as `<sha256>  <filename>` lines (same form as
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/freeze-baseline.sha256`) to a NEW file
   `.../sc255-skills-collapse/rebaseline-r5.txt`, in the same line order as the old `rebaseline.txt`. Then diff it
   against the old `rebaseline.txt` and report which hashes changed, if any. (They may change if develop moved
   shared print CSS. That is fine as long as the ONLY visible change vs the new base is still the removed header.)
   Do not overwrite `rebaseline.txt`; the owner swaps the files. **Never edit the shared baseline.**
5. **If any of the 20 hashes changed vs the old rebaseline.txt:** produce a before/after crop for
   `skills--steel-print`, before = the new base's shot (from step 2) and after = the branch's. Top ~900 px, side
   by side, with a white label strip on top reading "BEFORE (develop <sha>)" over the left half and
   "AFTER (SC-255)" over the right. Save it as `.../sc255-skills-collapse/crops/sc255-r5-skills-steel-print-before-after-labeled.png`.
   Also do a pixel check that the difference between base and branch is the same ~60 device-px upward shift as before
   (the r2 reviewer's script is at `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/shift2.py`,
   if it still exists; otherwise write your own).

## 3. Report

`.../sc255-skills-collapse/sc255-r5-rebase-report.md`. Write the skeleton FIRST, then fill it in. It opens with a
≤10-line executive summary: verdict, new base sha, final head sha, gate numbers, freeze failing count and whether
the names match, whether the rebaseline hashes changed. Then conflict hunks, logs, and `Drive-by fixes:` /
`Follow-ups:` sections.

## 4. Return contract

Your final text goes to the ticket-owner: raw facts (verdict, shas, numbers) and the absolute path of every
artifact. No prose. (Your report may be relayed to the owner by the dispatcher; that's expected.)

## Footguns

- If the report-file write is blocked, return the report inline.
- Devbox: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc255-skills-collapse/draw-steel-elements && <cmd> > <log> 2>&1; echo EXIT=$? >> <log>'`.
  Devbox's sh eats `$?`/`$PIPESTATUS`; never pipe a gate.
- **Run every gate in the FOREGROUND** (Bash timeout up to 600000 ms), output redirected to a per-run log file.
  Never use `run_in_background`, `Monitor`, or "wait for the notification". A job you start does not wake you,
  and the previous worker on this ticket stalled exactly this way. If a gate takes longer than 600 s, run it in
  the foreground with `timeout 590` chunks or re-invoke. Never end your turn while a gate is running.
- Never key a wait-loop on a scratch filename or its contents; stale logs from other branches will match.
- **Kill processes only by PID, and only ones whose command line contains `worktrees/sc255-skills-collapse/`**
  (`pgrep -af "worktrees/sc255-skills-collapse/"`, check each line). Never `pkill`/`killall` by pattern: other
  efforts run the same gates concurrently.
- Never `rm -rf` anything in `.superpowers/` except files you created in this round.
- `token-coverage.test.ts` red on a D3-token-map row you didn't touch = stale worktree superproject copy. Rerun with
  `DSE_TOKEN_MAP_PATH=/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/D3-token-map.md`.
- You cannot `SendMessage` me, and `to: 'main'` reaches the dispatcher. If you need input, end with
  `STATUS: NEEDS_CONTEXT` and the question. Any message you send anyway starts with `SC-255:`.
