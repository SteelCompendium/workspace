# SC-236 round 1 — evidence round: what each fix of feature/example.yaml costs

You are a worker for ticket SC-236. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker (Linear)** — not to read, not to post.

## Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/decisions.md` (read it; it is current state).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc236-feature-example`, DSE clone at
  `.../draw-steel-elements`, branch `sc236-feature-example`, currently at origin/develop `6c4f6aa`.
  Run `git fetch origin` inside that DSE clone first; if origin/develop has moved past `6c4f6aa`,
  rebase onto it and say so in the report. **Verify `pwd` is under
  `/home/scott/code/steelCompendium/worktrees/sc236-feature-example` before any write.** Never
  write anything under `/home/scott/code/steelCompendium/workspace/` except your report files in
  the ledger dir named below.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` sections
  "The battery, in order", "Devbox wrapping", "THE exit-code footgun", "Freeze semantics" (first
  ~60 lines of it) before running anything.

## The problem

`src/elements/feature/example.yaml` (the `ds-feature` element's `authoring.example` — the block a
user gets when inserting a new feature block — AND the visual-harness `feature` default fixture)
declares `ability_type: Villain Action 1` (line 5) AND `usage: Main action` (line 10). `usage`
wins in `actionTypeOf`'s precedence (that precedence is pinned by SC-102 and MUST NOT change), so
the card renders as a main action (sword crest, main-action spine) while the YAML claims to be a
villain action. The data is self-contradictory. Separately, a `feature-villain` harness fixture
already demonstrates the real villain path (`visual-harness/entry.ts`, `feature: { default,
spend, villain }`).

The ticket text predates the legacy-theme removal: `feature--legacy-*` shots no longer exist. The
frozen set is now `*--steel-print.png` + `*--steel-realprint.png` (260 lines in
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/freeze-baseline.sha256`). **Never edit
that baseline file.**

## Task — measure, do not decide

**Part 1: survey (read-only, short).** Answer with file:line:
1. Every consumer of `src/elements/feature/example.yaml` (authoring.example wiring, harness,
   jest tests/snapshots that assert its content or rendered output, docs/demo vault copies).
2. Where `ability_type` is rendered or consumed anywhere in DSE (does its text appear on the card?
   in print? does it drive anything besides `actionTypeOf`'s fallback?).
3. What real Draw Steel data looks like for these fields. Look in the generated data (read-only):
   `/home/scott/code/steelCompendium/workspace/data/` (data-unified, e.g. `en/unified/`… yaml or
   json) — find (a) a real monster Villain Action ability: what are its `ability_type`/`usage`/`cost`/
   `trigger` values? (b) a real monster Malice-cost main-action ability: what is its `ability_type`
   (if any)? (c) what does the `feature-villain` harness fixture use? Quote 1-2 short real
   examples. Also: is `Main Action 1` a real `ability_type` value anywhere, or invented?

**Part 2: measure candidate edits.** For each variant below, apply ONLY that edit to
`example.yaml` (from the base content), run `npm run shots`, then the freeze check, and record:
which frozen lines FAIL (by filename), and which `feature--*` shots (all combos: steel-dark,
steel-light, steel-print, steel-realprint, plus any other shot that embeds the default feature
fixture, e.g. galleries) change bytes vs. the base run. Also run `npx jest` for each variant (see
the main.js footgun in dse-verify: `rm -f main.js styles.css` in the plugin root before jest).

- **V0 base** — unedited (this is your before-set; copy its shots dir to
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/sc236-r1-shots/v0/`,
  only the `feature*` PNGs plus any other PNG that changes in any variant).
- **V1** — delete the `ability_type: Villain Action 1` line.
- **V2** — change it to `ability_type: Main Action 1` (the ticket's option b), and also the most
  data-realistic value your Part 1 survey finds for a Malice-cost main action, if different
  (call that V2r).
- **V3** — make it a genuine villain action per the real data from Part 1 (keep
  `ability_type: Villain Action 1`, change `usage` — and only whatever else the real data says a
  villain action does not carry — to real villain-action values). Keep the edit minimal and list
  exactly which lines changed.

Copy each variant's changed PNGs to `.../sc236-r1-shots/<variant>/`. For every variant that
changes any shot, produce a side-by-side before/after crop of `feature--steel-dark.png`
(and `feature--steel-print.png` if it moved) at
`.../sc236-r1-shots/<variant>-compare-<shot>.png` (ImageMagick `convert +append` or python PIL is
fine — use whatever is available; say which). For any variant that moves frozen lines, write
`.../sc236-r1-shots/<variant>-rebaseline.txt` (`<sha256>  <filename>` lines, same order/format as
the baseline) and verify it is deterministic by re-running shots once more for that variant and
confirming the hashes repeat.

**At the end restore `example.yaml` to the base content, and commit NOTHING.** `git status` in the
DSE clone must be clean (the shots dir is gitignored) when you finish.

## Gates / expected numbers (base, from dse-verify at SC-343; re-measure — develop has moved since)

- `npx jest`: ~3969 passed / 1 skipped / 204 of 205 suites / 3 snapshots (record the real base).
- `npm run shots`: 524 shots, 0 FAIL (record real base).
- freeze: `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh
  /home/scott/code/steelCompendium/worktrees/sc236-feature-example/draw-steel-elements/visual-harness/shots`
  → base must read `freeze OK (260/260 …)`. If the BASE is not 260/260, stop and report
  (NEEDS_CONTEXT) — do not proceed on a red base.
- No need for lint/tsc/parity/lifecycle in this round (YAML-only candidate edits).

Command shape (devbox wraps everything; gate command LAST, output to a file):
`devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc236-feature-example/draw-steel-elements && npm run shots > /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/sc236-r1-logs/shots-v0.log 2>&1'`
then read the log's own summary line. Use a per-variant unique log path.

## Footguns (all apply)

- Run every gate in the FOREGROUND with output redirected to a per-run unique file. Never
  background a gate or wait on a Monitor — a job you started does not wake you. Use a Bash
  timeout up to 600000 ms.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is
  pre-populated across sessions and branches, and a stale log from another branch will match.
  Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog
  kills silent agents.
- **Never `pkill`/`killall` by pattern.** Other efforts run the same shots/parity commands
  concurrently. Kill only by PID, and only a PID whose command line contains
  `worktrees/sc236-feature-example/` (`pgrep -af "worktrees/sc236-feature-example/"`, check each
  line before killing).
- Never `rm -rf` anything under `.superpowers/` except your own `sc236-r1-*` paths.
- Load-sensitive jest: timeout-shaped reds in settings-tab/settings-preview suites — check
  `/proc/loadavg` and re-run before believing them.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'`
  routes to the dispatcher, not me. If you need input, end your turn with STATUS: NEEDS_CONTEXT
  and the question. If you ever send a message anyway, its FIRST WORD must be `SC-236:`.

## Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/sc236-r1-report.md`.
It MUST open with a ≤10-line executive summary: base numbers, and per variant one line:
frozen lines moved (count + names), screen shots moved (names), jest result, visible change in
one plain sentence (what a user sees differ — crest, spine, label text), and any data-realism
note. Then the Part 1 survey with file:line, then detail.

Final message (to the ticket-owner): raw facts only — STATUS (DONE / NEEDS_CONTEXT / BLOCKED),
the exec summary, and the absolute path of every evidence artifact (report, logs dir, shots dirs,
compare PNGs, rebaseline files). Confirm `git status` clean in the DSE clone.
