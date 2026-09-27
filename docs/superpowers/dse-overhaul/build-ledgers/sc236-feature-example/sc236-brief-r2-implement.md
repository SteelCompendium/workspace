# SC-236 round 2 — implement V1 (drop the false `ability_type` line) + keep featureSpend in sync

You are a worker for ticket SC-236. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker (Linear)** — not to read, not to post.

## Context loading

- Ledger (current state, read all of it): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/decisions.md`
- Prior round: `.../sc236-feature-example/sc236-r1-report.md` (exec summary + Part 1 survey; it
  lists every consumer of `example.yaml` with file:line).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc236-feature-example`; DSE clone
  `.../draw-steel-elements`, branch `sc236-feature-example`, at origin/develop `6c4f6aa`.
  First `git fetch origin` in the DSE clone; if origin/develop moved past `6c4f6aa`, rebase onto
  it (run `npm ci` if package.json changed) and say so. **Verify `pwd` is under
  `/home/scott/code/steelCompendium/worktrees/sc236-feature-example` before any write.** Never
  write under `/home/scott/code/steelCompendium/workspace/` except report/evidence files in the
  ledger dir. If you touch a workspace-level file (e.g. CHANGELOG.md), it lives in YOUR worktree's
  superproject at `/home/scott/code/steelCompendium/worktrees/sc236-feature-example/CHANGELOG.md`
  — never under `/home/scott/code/steelCompendium/workspace/`.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`: "The
  battery, in order", "Devbox wrapping", "Stale main.js", "Load-sensitive jest", "THE exit-code
  footgun", and the first ~60 lines of "Freeze semantics".

No Scott ruling exists yet; this round builds the owner's recommended option (ledger: "OWNER
RECOMMENDATION: V1") so it is ready if Scott picks it.

## Task

1. `src/elements/feature/example.yaml`: delete the line `ability_type: Villain Action 1`. Nothing
   else in that file changes.
2. `visual-harness/entry.ts` `featureSpend` (~:234-260): it is documented as a verbatim copy of
   `example.yaml` with the "Special" effect's cost changed from `2 Malice` to
   `Spend Heroic Resource`, but it is hand-copied. Make it DERIVED from `featureDefault` (the way
   `featureCollapsed` is), e.g. a single `.replace()` of the Special effect's `cost: 2 Malice`
   line, guarded so a no-op replace throws at harness load (so a future edit to example.yaml can't
   silently break the spend fixture). Its rendered content must equal the old literal minus the
   `ability_type` line — verify by diffing the derived string against the old literal.
3. The content pin `test/dom/elements/feature.test.ts:536-550` currently asserts the
   contradiction (`/^ability_type: Villain Action 1$/m` + `/^usage: Main action$/m` → main +
   sword). Rewrite it to pin the new truth: example.yaml has NO `ability_type` line, has
   `usage: Main action`, and renders `main` + sword crest. Keep it adversarial (it must fail if
   someone re-adds an `ability_type` line) — prove it can fail by temporarily re-adding the line
   and running just that test; record the failing output; revert.
4. The SC-102 precedence rule ("a real `usage` line beats `ability_type`") MUST stay pinned.
   Find the tests that pin it with inline config (not via example.yaml). If the example.yaml pin
   was the ONLY thing pinning "usage: Main action + ability_type: Villain Action 1 → main", add an
   inline-config test in the same file that pins exactly that. Do not change `actionTypeOf`.
5. Update the comments that describe the old state so they are true afterwards:
   `src/elements/feature/renderFeature.ts` ~:125-128 (the sentence saying example.yaml
   "deliberately stays `main` and its frozen shots never move"), `visual-harness/entry.ts`
   ~:234-240 (featureSpend) and ~:278-291 (featureVillain's rationale — it still exists as the
   villain-path fixture; reword why). grep the DSE repo for any other comment/doc that mentions
   `Villain Action 1` together with example.yaml / the D9 example / SC-236 / FOLLOWUPS #53 and fix
   those too (list them).
6. Changelog: if DSE has a CHANGELOG.md with an Unreleased section, add one bullet there
   ("The example inserted for a new `ds-feature` block no longer claims to be a villain action
   while rendering as a main action"). Otherwise add it under `## Unreleased` in the worktree
   superproject's CHANGELOG.md (path above). Report which.
7. Commit in the DSE clone on branch `sc236-feature-example` (one or a few coherent commits,
   message prefix `fix(feature): SC-236 …`). Commit after each coherent step; nothing sits
   uncommitted through a gate. No attribution trailers of any kind in commit messages. If you
   changed the superproject CHANGELOG, commit that in the worktree superproject on its
   `sc236-feature-example` branch too. Never push.

## Gates — full battery, in order (dse-verify), measured at your final commit

Base at `6c4f6aa` (r1-measured): jest 3997 passed / 1 skipped / 206 of 207 suites / 3 snapshots;
shots 524, 0 FAIL; freeze `260/260`. Expected after:
- `npm run tsc` clean; `npm run lint` clean exit 0.
- `npx jest` (after `rm -f main.js styles.css`): all green; count = 3997 + any tests you added.
  `sidebarEncounterHandoff.test.ts:416` flaked under load in r1 — if a timeout-shaped red
  appears there or in settings suites, check `/proc/loadavg` and re-run that suite before
  believing it.
- `npm run obsidian-lifecycle`: `OBSIDIAN-LIFECYCLE done: 6/6 ok, 0 failed`, exit 0 (exit 2 =
  environment; report it, don't fake it).
- `npm run shots`: 524, 0 FAIL.
- freeze (`bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh
  /home/scott/code/steelCompendium/worktrees/sc236-feature-example/draw-steel-elements/visual-harness/shots`):
  expected `FREEZE VIOLATED` with EXACTLY these mismatches and no others:
  `feature--steel-{print,realprint}`, `feature-collapsed--steel-{print,realprint}`,
  `chrome-collapsed-rollout--steel-{print,realprint}` (those 6 must match r1's
  `sc236-r1-shots/v1-rebaseline.txt` byte-for-byte), PLUS `feature-spend--steel-{print,realprint}`
  (new, from step 2). Any other mismatch is a real red — stop and report it.
- `npm run parity` LAST: 0 GAPs / 0 undeclared WARNs / 16 DECLARED / exit 0.
- **Never edit `freeze-baseline.sha256`.** Instead write
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/rebaseline.txt`
  (`<sha256>  <filename>` lines, same format and baseline order, one line per mismatched frozen
  shot) and verify it by a second `npm run shots` run whose hashes repeat.

## Evidence for Scott (make these)

In `.../sc236-feature-example/sc236-r2-evidence/`:
- Before/after crops for `feature--steel-dark.png`, `feature--steel-print.png`, and
  `feature-spend--steel-dark.png` (before = r1's `sc236-r1-shots/v0/` copies, or regenerate from
  base). Scott is colorblind: do NOT distinguish before/after by border color. Stack them
  vertically (before on top) and burn a plain text label into each panel — "BEFORE" / "AFTER" in
  large dark-on-white text above the panel. Crop to the card header region (crest + name + chips)
  so the difference is readable at Linear inline size (≤1600px wide).

## Footguns (all apply)

- Run every gate in the FOREGROUND with output redirected to a per-run unique file under
  `.../sc236-feature-example/sc236-r2-logs/`. Never background a gate or wait on a Monitor — a job
  you started does not wake you. Bash timeout up to 600000 ms.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated
  across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog
  kills silent agents.
- Devbox: `devbox run -- bash -c 'cd /abs/path/draw-steel-elements && <gate> > /abs/log 2>&1'`,
  gate command last, no `| tail`, no `; echo $?`. Read the tool's own summary line from the log.
- **Never `pkill`/`killall` by pattern.** Other efforts run the same shots/parity/obsidian
  commands concurrently. Kill only by PID, and only a PID whose command line contains
  `worktrees/sc236-feature-example/` (`pgrep -af "worktrees/sc236-feature-example/"`; check each
  line before killing).
- Never `rm -rf` anything under `.superpowers/` except your own `sc236-r2-*` paths.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — `to: 'main'` routes to the dispatcher, not me. If you need input,
  end your turn with STATUS: NEEDS_CONTEXT and the question. If you ever send a message anyway,
  its FIRST WORD must be `SC-236:`.

## Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/sc236-r2-report.md`,
opening with a ≤10-line executive summary (commit shas, every gate's measured number, freeze
mismatch list, rebaseline.txt line count + determinism result). Then: files changed with a
one-line why each; the can-fail proof output for the rewritten pin; where the precedence rule is
pinned (file:line); comment/doc updates list; `Drive-by fixes:` and `Follow-ups:` sections.

Final message: raw facts only — STATUS, the exec summary, and the absolute path of every
artifact (report, logs dir, evidence PNGs, rebaseline.txt). Confirm `git status` clean in the
DSE clone (and the superproject if touched).
