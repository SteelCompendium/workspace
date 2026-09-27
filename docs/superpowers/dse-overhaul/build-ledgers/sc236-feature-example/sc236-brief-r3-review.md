# SC-236 round 3 — independent adversarial review of the r2 branch

You are an independent reviewer for ticket SC-236. You did not write this code. Your final text
goes to the ticket-owner, not a human. **Workers never call the tracker (Linear).**

## Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/decisions.md`
  (read it all — especially "Owner decisions after r1").
- r1 evidence/survey: `.../sc236-feature-example/sc236-r1-report.md` (exec summary + Part 1).
- r2 implementer report: `.../sc236-feature-example/sc236-r2-report.md`; r2 brief (what was asked):
  `.../sc236-brief-r2-implement.md`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc236-feature-example`, DSE clone
  `.../draw-steel-elements`, branch `sc236-feature-example`. Diff under review:
  `git -C <DSE clone> diff 6c4f6aa..HEAD` (fetch origin first; if the branch was rebased, use
  `origin/develop...HEAD`). Also the worktree superproject if the r2 report says CHANGELOG.md
  was touched there.
- dse-verify skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  (battery, devbox wrapping, exit-code footgun, freeze semantics).

## What to probe — execute, don't just read

1. **Correctness of the data fix.** `example.yaml` must differ from base by exactly the removed
   `ability_type: Villain Action 1` line. Confirm the rendered default card still resolves to
   `main` + sword crest and the "VILLAIN ACTION 1" chip is gone (runtime/jsdom or the shots).
2. **featureSpend derivation.** Derived from `featureDefault`; the derived text must equal the old
   literal minus the `ability_type` line (diff it yourself). The no-op guard must actually throw
   if the replace target disappears — prove it (temporarily change the target, load the harness
   or run the relevant test, observe the throw, revert). Does the guard run in jest AND in the
   esbuild harness bundle? Any other harness fixture still hand-copying example.yaml?
3. **Test pins.** The rewritten content pin must fail if an `ability_type` line is re-added
   (re-prove it). The SC-102 precedence rule ("a real usage line beats ability_type" —
   `usage: Main action` + `ability_type: Villain Action 1` → `main`) must still be pinned by an
   inline-config test — find it, then mutate `actionTypeOf` (e.g. swap precedence) and confirm
   that test goes red; revert. No test should now be vacuous.
4. **Freeze.** Re-run `npm run shots` and
   `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <DSE clone>/visual-harness/shots`.
   The mismatch set must be exactly: `feature`, `feature-collapsed`, `chrome-collapsed-rollout`,
   `feature-spend`, each × `--steel-print` and `--steel-realprint` (8 lines). Verify
   `.../sc236-feature-example/rebaseline.txt` hashes equal YOUR run's hashes for those 8 files,
   and that applying it to a COPY of the baseline (in your scratch, never the real file) gives
   `freeze OK (260/260 …)` against your shots dir (count stays 260 — replacement, not
   widening). **Never edit `.superpowers/sdd/freeze-baseline.sha256`.**
5. **Rest of the battery** at the branch head: tsc, lint, jest (after `rm -f main.js styles.css`),
   `npm run obsidian-lifecycle`, `npm run parity` LAST. Compare to the r2 report's numbers.
6. **Comments/docs** now tell the truth: renderFeature.ts (~:125) and entry.ts featureSpend /
   featureVillain comments; grep for any remaining stale claim that example.yaml is a villain
   action or "its frozen shots never move". Changelog bullet is accurate and in the right file.
7. **Evidence images** in `.../sc236-r2-evidence/`: open them; confirm labels are text (not
   color-only), before/after are correct way round, and they show the chip removal legibly.

## Footguns (all apply)

- Run every gate in the FOREGROUND with output redirected to per-run unique files under
  `.../sc236-feature-example/sc236-r3-logs/`. Never background a gate or wait on a Monitor.
  Bash timeout up to 600000 ms.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated
  across sessions and branches; a stale log will match. Read the process's own output.
- Redirect long-running output to a file rather than streaming it (600s stream watchdog).
- Devbox: `devbox run -- bash -c 'cd /abs/path && <gate> > /abs/log 2>&1'`, gate last, no pipes.
- **Never `pkill`/`killall` by pattern** — other efforts run the same commands concurrently. Kill
  only by PID whose command line contains `worktrees/sc236-feature-example/`.
- Load-sensitive jest: timeout-shaped reds in settings-tab/settings-preview/
  sidebarEncounterHandoff — check `/proc/loadavg`, re-run that suite before believing it.
- Any temporary mutation you make for a can-fail proof must be reverted; leave `git status`
  clean and HEAD unchanged. Do not commit. Never push.
- Never `rm -rf` under `.superpowers/` except your own `sc236-r3-*` paths.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me — `to: 'main'` reaches the dispatcher, not me. If you need input,
  end with STATUS: NEEDS_CONTEXT and the question. Any message you send anyway starts `SC-236:`.

## Report

`.../sc236-feature-example/sc236-r3-review.md`, opening with a ≤10-line executive summary
(verdict APPROVE / APPROVE-WITH-NITS / CHANGES-REQUIRED, finding counts by severity, your measured
battery numbers, freeze mismatch set, rebaseline.txt verified yes/no). Then findings by severity
(CRITICAL/HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, and prescribed fix.

Final message: raw facts only — verdict, exec summary, absolute paths of report and logs. Confirm
`git status` clean and HEAD sha.
