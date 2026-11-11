# SC-577 R1 implementer brief — Malice never goes below 0

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc577-malice-negative/decisions.md`
  (the ledger — current-state rulings O1-O5; quote them, do not reinterpret them).
- Read the dse-verify skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  (battery order, devbox shapes, freeze/parity rules) and `draw-steel-elements/AGENTS.md` in your worktree.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc577-malice-negative` — every submodule on branch
  `sc577-malice-negative`. Your repo is `.../worktrees/sc577-malice-negative/draw-steel-elements`.
  Verify `pwd`/`git -C <abs> rev-parse --abbrev-ref HEAD` before any write. NEVER write under
  `/home/scott/code/steelCompendium/workspace/` except your report into the ledger dir below.
- First: `git -C <dse abs> fetch origin` and confirm `origin/develop` is `734d7745`; if it moved, rebase
  onto it and say so in the report.
- Workers never call the tracker (Linear) — not to read, not to post.
- The main checkout's dse vault dirt (demo-vault/Welcome.md, compendium-manifest.json, demo-vault/*.md)
  is Scott's and expected. Ignore it.

## 2. The task

Ticket text: "Pressing − on Malice at 0 writes `value: -1`. A negative `round_gain` also drives Malice
below 0, and labels the round button "Advance round (+-3 Malice)". The quick-add box already clamps at 0,
so the stepper and the round gain disagree with it."

Rulings, verbatim from the ledger:

> - O1. The Malice pool never goes below 0 on any write path. [...]
> - O2. Stepper: pass the kit stepper `min: 0` (the − button disables at 0; typed entry clamps).
>   Keep the kit's default seed clamp (a hand-edited `value: -2` displays as 0; the file is not rewritten
>   until the user changes Malice). Do not coerce in `parse`.
> - O3. `advanceRound`: a negative `round_gain` is still applied, floored at 0
>   (`value = Math.max(0, value + gain)`). The log entry keeps the configured amount, the same convention
>   the quick-add uses today. Whether a clamped change should log the actual delta or say "capped" is
>   SC-578's question, for both paths — out of scope here.
> - O4. Advance round label uses the Malice log's sign rule (`+` for ≥0, bare `-` otherwise):
>   `Advance round (+3 Malice)` / `Advance round (-3 Malice)`. Never `+-`.
> - O5. Remove the SC-577 known-bug markers: jest `initiative-matrix.test.ts` [M07] and [R01]
>   (`test.failing` → `test`), e2e `malice.e2e.ts` [INIT-M07] (`knownBug` → `it`). Add one e2e for the
>   negative round gain if the spec's fixture shape makes it cheap.

Code pointers (current lines at 734d7745):
- Stepper: `src/elements/initiative/view.ts` `buildMaliceTotal` (~488-500).
- Label: `view.ts` `buildRoundControls` (~529-539). Log sign rule: `view.ts` ~596.
- Round gain: `src/elements/initiative/model.ts` `advanceRound` (~472-478); update its doc comment.
- Quick-add clamp already present: `view.ts` ~677 (do not change its logging — SC-578).
- Markers: `test/dom/elements/initiative-matrix.test.ts` ~864-880 (leave [M09] SC-578 alone);
  `e2e/specs/initiative/malice.e2e.ts` ~52-61.
- Add a model unit test for `advanceRound` with a negative gain (floor + log entry shape) next to the
  existing advanceRound tests. Add a CHANGELOG bullet under `## Unreleased` in YOUR WORKTREE's
  superproject `/home/scott/code/steelCompendium/worktrees/sc577-malice-negative/CHANGELOG.md` (never the
  main checkout's) — follow the neighbouring SC-575/SC-576 bullets' style. If dse has its own changelog
  convention per its AGENTS.md, follow that too.
- Commit inside `draw-steel-elements` on branch `sc577-malice-negative` after each coherent step
  (`git -C <abs> …`). Commit the superproject CHANGELOG separately in the worktree superproject. Do not
  push. No tags, ever.

Out of scope (do not touch): SC-578, SC-589, SC-588, SC-584, SC-566.

## 3. Gates (dse-verify battery, in order) — expected numbers at 734d7745

- tsc clean · lint clean.
- jest: baseline 7085 passed / 1 skipped (with the shots CSS cache; on a fresh worktree before shots it reads
  one fewer passed and 2 skipped). Expected after: +2 from the converted `test.failing` (they now count as
  passing tests, net change depends on how jest counts failing tests — report the real numbers) plus your new
  tests. SC-568 load timeouts are possible; re-run a timed-out suite alone and report both.
- lifecycle: 53/53, run in FIVE `--only` parts, each its own foreground Bash call:
  1. `G-S7a … G-S9a` (21) 2. `G-S9b … G-S40` (16) 3. `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9)
  4. `G-S57 G-S62 G-S61 G-S56` (4) 5. `G-S59 G-S49 G-S73` (3). G-S56 stays LAST in SCENARIOS order.
  Get the exact id lists for parts 1-2 from the SCENARIOS array; never set DSE_LIFECYCLE_PORT; give each
  run a private `DSE_CAMERA_TMP` under your scratch folder.
- e2e: baseline `255/262 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs`. Expected after: `256/262 ok,
  0 failed, 6 known-bug` (+1 ok/+1 total per e2e test you add), coverage Y/Y pairs.
- shots: 592 shots, host-leak 163/978, modal host-leak 39 kinds / 234 comparisons, capture clip 147.
- freeze 280/280. If freeze moves (a fixture with Malice at 0 now renders a disabled − button), do NOT touch
  the shared baseline: ship `.superpowers/sdd/sc577-malice-negative/sc577-rebaseline.txt` (ready-to-apply
  hash lines) + before/after crops in the ledger dir, per dse-verify's freeze section.
- parity: 0/0/24, last.

## Footguns (all apply)

- No compound `cd`. Use `git -C <abs>` for every git command and `devbox run -c <abs dse path> -- …`.
- Record exit codes via a script FILE run through devbox (`devbox run -c <path> -- bash <script>`), not
  `bash -c '…; echo rc=$?'` (always records 0). Never pipe a gate into `tail`.
- One gate per Bash call, in the foreground, output redirected to a file. No background gates, no
  Monitor — except shots may run in the background if it would exceed the 10-minute tool limit, and then
  you poll ITS OWN log/exit-code file; never wait for a notification.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents.
- Never `rm` with a variable target; never a glob `rm` under /tmp; never `rm -rf` `.superpowers/`.
- Kill scratch processes by literal PID only, and only a PID whose cwd (`readlink /proc/<pid>/cwd`) or
  command line is inside your worktree. Never pkill/killall by pattern.
- Scratch: a private subfolder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc577-impl-r1-<yourAgentId>/`
  with uniquely named scripts and logs. Never key a wait-loop on a scratch filename or its contents — the
  scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a
  per-run unique path.
- `npm ci` if node_modules is missing or stale in the worktree's dse.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the
  question. If you ever do send a message anyway, its FIRST WORD must be `SC-577:`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc577-malice-negative/sc577-r1-impl-report.md`,
opening with a ≤10-line executive summary (verdict, dse sha(s), superproject sha, each gate's measured
number vs expected).

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — STATUS (DONE / NEEDS_CONTEXT / BLOCKED),
shas, measured gate numbers, `Drive-by fixes:` and `Follow-ups:` lists — no prose. Include the absolute path
of every evidence artifact you produced (report, gate logs, any rebaseline/crops).
