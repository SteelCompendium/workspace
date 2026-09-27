# SC-236 round 6 — rebase onto current origin/develop, full battery, re-verify rebaseline.txt

You are a worker for ticket SC-236. Your final text goes to the ticket-owner (it may be relayed
verbatim by the dispatcher). **Workers never call the tracker (Linear).**

## Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/decisions.md`
  (read it all; Scott chose option A on 2026-09-25 — it is what the branch already implements).
  Scott's ruling, verbatim: "Option A is good."
- Prior reports (exec summaries only): `sc236-r2-report.md`, `sc236-r4-report.md`,
  `sc236-r5-rereview.md` in the same dir.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc236-feature-example`; DSE clone
  `.../draw-steel-elements`, branch `sc236-feature-example`, HEAD `5cd09e1` (4 commits on top of
  `6c4f6aa`: 57de502, ac9df92, a1c39fa, 5cd09e1). **Verify `pwd` is under
  `/home/scott/code/steelCompendium/worktrees/sc236-feature-example` before any write.** Never
  write under `/home/scott/code/steelCompendium/workspace/` except your report/log files in the
  ledger dir.
- dse-verify skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  ("The battery, in order", "Devbox wrapping", "Stale main.js", "Load-sensitive jest", "THE
  exit-code footgun", "Freeze semantics" first ~60 lines, "Current expected numbers" CURRENT block).

## Task

1. In the DSE clone: `git fetch origin` **immediately before** rebasing (another branch, SC-272,
   was landing on develop moments ago; at dispatch origin/develop was `36635e9`). Record the exact
   origin/develop sha you rebase onto. `git rebase origin/develop`.
   - Conflicts: CHANGELOG is the likely one. Keep every develop entry intact and put the SC-236
     bullet at the TOP of the Unreleased list (develop's convention is newest-first — see SC-272's
     `36635e9`). For any other conflict, resolve preserving both sides' intent and list each one
     (file, what conflicted, how resolved) in the report. If a conflict needs a judgment call
     about behavior, stop and return STATUS: NEEDS_CONTEXT.
   - If `package.json`/lockfile changed on develop since `6c4f6aa`, run `npm ci`.
   - After the rebase, `git diff origin/develop..HEAD --stat` must show only this ticket's files
     (example.yaml, entry.ts, renderFeature.ts, feature.test.ts, CHANGELOG, docs/Media/feature.png).
2. `docs/Media/feature.png`: regenerate with `npm run docs-shots -- --only=feature.png`. If it
   changes vs. the committed one (develop may have restyled the feature card since), commit the
   regenerated image as its own commit; confirm no other docs file changed. Say which happened.
3. Full battery at the final head, in order: tsc, lint, jest (after `rm -f main.js styles.css`),
   `npm run obsidian-lifecycle`, `npm run shots`, freeze check, `npm run parity` LAST.
4. Freeze + rebaseline:
   `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc236-feature-example/draw-steel-elements/visual-harness/shots`
   (baseline is 260 lines, unchanged since SC-328). Expected: `FREEZE VIOLATED` with EXACTLY 8
   mismatches — `feature`, `feature-collapsed`, `feature-spend`, `chrome-collapsed-rollout`, each ×
   `--steel-print` and `--steel-realprint`. Then:
   - Diff your 8 hashes against
     `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/rebaseline.txt`.
   - If identical: leave rebaseline.txt as is and say so.
   - If the SAME 8 names but different hashes (develop changed their rendering): copy the old file
     to `rebaseline.pre-r6.txt` in the same dir, write the new hashes into `rebaseline.txt` (same
     format and baseline line order), and prove determinism with a second `npm run shots` run.
   - If the mismatch SET differs (extra or missing names): do NOT touch rebaseline.txt. With a clean tree,
     `git checkout --detach origin/develop`, run shots + freeze, then `git checkout
     sc236-feature-example`, to learn whether the extra mismatches exist on develop itself, report
     both lists, and return STATUS: NEEDS_CONTEXT.
   - Verify: applying rebaseline.txt to a SCRATCH COPY of the baseline gives `freeze OK (260/260 …)`
     against your shots dir. **Never edit `.superpowers/sdd/freeze-baseline.sha256` itself.**
5. **Commit after every coherent step** (rebase result, docs image). Commit prefix
   `fix(feature): SC-236 r6 …`, no attribution trailers of any kind. Never push.
6. Before writing the report, `git fetch origin` once more. If origin/develop moved past the sha
   you rebased onto, repeat steps 1-4 on the new tip (say so in the report).

## Expected numbers (dse-verify CURRENT block, SC-340 landing on 6c4f6aa; develop has grown since)

- tsc clean; lint clean exit 0.
- jest: ~4038 passed / 1 skipped / 208 of 209 suites / 3 snapshots on develop as of SC-340, plus
  whatever SC-243/SC-230/SC-272 added, plus this branch's net +1. Record the real number. If you
  see reds, determine whether they reproduce on origin/develop alone before blaming this branch.
  Timeout-shaped reds in settings-tab/settings-preview/sidebarEncounterHandoff: check
  `/proc/loadavg`, re-run that suite.
- obsidian-lifecycle: `OBSIDIAN-LIFECYCLE done: 19/19 ok, 0 failed`, exit 0 (exit 2 = environment:
  report, don't fake; a one-off "CDP socket closed" was seen before — retry once and report both).
- shots: 524, 0 FAIL (or develop's new count if a landed branch added fixtures — record it).
- freeze: as step 4.
- parity: 0 GAPs / 0 undeclared WARNs / 16 DECLARED / exit 0.

## Footguns (all apply)

- Run every gate in the FOREGROUND, output redirected to per-run unique files under
  `.../sc236-feature-example/sc236-r6-logs/`. Never background a gate or wait on a Monitor — a job
  you started does not wake you. Bash timeout up to 600000 ms.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated
  across sessions and branches; a stale log from another branch will match. Read the process's
  own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills
  silent agents.
- Devbox: `devbox run -- bash -c 'cd /abs/path/draw-steel-elements && <gate> > /abs/log 2>&1'`,
  gate command last, no `| tail`, no `; echo $?`. Read the tool's own summary line from the log.
- **Never `pkill`/`killall` by pattern.** Other efforts run the same shots/parity/obsidian commands
  concurrently. Kill only by PID, and only a PID whose command line contains
  `worktrees/sc236-feature-example/` (`pgrep -af "worktrees/sc236-feature-example/"`; check each
  line before killing).
- Never `rm -rf` anything under `.superpowers/` except your own `sc236-r6-*` paths.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — `to: 'main'` routes to the dispatcher, not me. If you need input,
  end your turn with STATUS: NEEDS_CONTEXT and the question. Any message you send anyway must
  start with `SC-236:`.

## Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/sc236-r6-report.md`,
opening with a ≤10-line executive summary: origin/develop sha rebased onto, final HEAD sha and the
list of branch commits, conflicts (none / list), every gate's measured number, freeze mismatch
list, rebaseline.txt unchanged-or-updated + line count + determinism, docs image regenerated
changed-or-identical.

Final message: raw facts only — STATUS, the exec summary, absolute paths of every artifact.
Confirm `git status` clean in the DSE clone.
