# SC-573 implementer brief, round 1

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc573-pool-zero-apply/decisions.md`
  (the ledger — current-state truth; this brief quotes it).
- Read: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (gate
  commands, devbox shapes, freeze/parity rules) and `draw-steel-elements/AGENTS.md` in your worktree.
- Prior art in the same file, landed today (read their ledgers' decisions + impl reports only if you need them):
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc566-pool-modal-overkill/`
  (`appliedPoolChange`, label/info wording) and `.../build-ledgers/sc567-pool-modal-overticked-apply/`
  (tick trimming, the SC-430 draft-prediction path).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc573-pool-zero-apply`, branch
  `sc573-pool-zero-apply` in the `draw-steel-elements` submodule. Verify with
  `git -C <abs path> rev-parse --abbrev-ref HEAD` and check every write path is inside that
  worktree. Never write under `/home/scott/code/steelCompendium/workspace/` except your report
  file in the ledger dir. The dse CHANGELOG you edit is
  `/home/scott/code/steelCompendium/worktrees/sc573-pool-zero-apply/draw-steel-elements/CHANGELOG.md` — never the main checkout's.
- Start: `git -C /home/scott/code/steelCompendium/worktrees/sc573-pool-zero-apply/draw-steel-elements fetch origin`
  and confirm the branch is at or rebased onto `origin/develop` = `f2889351` (rebase if develop moved; say so).
- **You never call the tracker (Linear)** — not to read, not to post.
- The main checkout's dse vault dirt (`demo-vault/Welcome.md`, `compendium-manifest.json`,
  `demo-vault/*.md`) is Scott's and expected; ignore it.

## 2. The task

Bug: `draw-steel-elements/src/views/MinionStaminaPoolModal.ts`. A squad whose pool is 0 (or
below, hand-edited) while minions are still alive opens the modal with every living minion
auto-ticked and locked (`updateCheckboxes`, `newStamina <= 0` branch) but Apply disabled
("No Stamina Change") because `updateActionButton` disables on `staminaChange === 0`. The GM
cannot record the deaths. Reachable by relieving a captain (SC-421) or a hand-edited pool.

Owner decisions (verbatim from the ledger):

> - **Fix in the modal, not at captain relief.** Reasons: the Draw Steel rule is plain (a pool
>   at 0 means every minion in the squad is dead), so recording the deaths is rules-correct; a
>   pool can reach 0 with minions alive by more than one path (the captain relief in SC-421, a
>   hand-edited pool), so a modal fix covers all of them; changing the captain transition is
>   SC-421's open decision for Scott and stays out of scope here. The SC-435 `test.failing`
>   marker already assumes the modal fix.
> - **Behaviour at pool <= 0 with N living minions:**
>   - Apply is enabled with nothing staged. The living minions are already auto-ticked and
>     locked (existing `updateCheckboxes` rule for new pool <= 0); Apply marks them dead and
>     writes the pool as 0 (the existing clamp).
>   - Label: **"Kill N minion(s)"** whenever the applied damage is 0 and kills are owed (nothing
>     staged, or damage staged on an empty pool). This takes the SC-566 owner's suggestion. All
>     other labels unchanged.
>   - Info line (currently hidden when nothing is staged): shows **"The pool is at 0, so N
>     minion(s) die."** when the current pool is <= 0 and N > 0 living minions, nothing staged.
>     With damage staged on an empty pool it reads the same sentence (not "0 damage will kill N
>     minion(s)").
>   - A heal at pool 0 is unchanged (still refused by the existing heal-ceiling rule).

Implementation notes (yours to refine):
- `poolNumbers()` with nothing staged at pool 0 gives `minionsToKill = 0` (the `pending < 0`
  clamp is not hit). You need the owed kills = living minions when the CURRENT pool is <= 0 and
  nothing is staged (and when damage is staged on an empty pool, which already gives `aliveMinions`).
  Decide where that lives so the label, info line, enable state, tooltip and checkboxes all read
  one value. Check that a pool > 0 squad's behaviour is byte-identical (labels, info, enabled state).
- First establish by test what actually happens today at pool 0 when damage is staged via the
  "Apply Damage" row (pending goes negative): is Apply enabled with "Deal 0 damage, kill N"? The
  SC-566 owner believed it was disabled. Report what you measured; either way the decided label applies.
- The SC-430 draft path (`draftStaminaChange`, `updateActionButton`'s prediction) must agree with
  the committed state: typing a draft at pool 0 (e.g. a heal draft, or a draft equal to 0) must
  not show an enabled Apply that the commit then disables, or the reverse.
- Reset at pool 0 returns to the nothing-staged state, which is now Apply-enabled "Kill N minion(s)".
- The heal at pool 0: a staged heal is still refused with its existing tooltip/aria reason. Make
  sure the new "nothing staged" enable does not leak into a staged-heal state.
- Apply writes: pool stays 0 (clamped), exactly the living minions get `isDead = true`, `persist`
  called once, modal closes. A negative hand-edited pool is written as 0.
- Squad with 0 living minions at pool 0: Apply stays disabled ("No Stamina Change"), no info line —
  there is nothing to record.
- Out of scope — SC-421 (captain transition), SC-574, SC-592, SC-591, SC-584, SC-577. Do not fold.

Tests (jest, jsdom), in `test/dom/views/minion-stamina-pool-modal-matrix.test.ts` (or a sibling
following its helpers):
- The `test.failing` "SC-573: a pool at 0 with living minions leaves Apply reachable so they can be
  killed" (around line 915, in the "known bugs" describe): move it out of the known-bugs block to a
  plain `test` in the right describe; keep its assertion; update its comment.
- Add: (a) pool 0, 5 alive, nothing staged → Apply enabled, label "Kill 5 minion(s)", info line
  visible with the decided sentence, no `title`; (b) click Apply → all 5 dead, pool 0, persist once;
  (c) pool 0, damage staged via the Apply Damage row → same label and info sentence; (d) pool 0 with
  some minions already dead (e.g. 2 alive) → "Kill 2 minion(s)", Apply kills exactly those 2;
  (e) pool 0 and a staged heal → still refused, old reason intact; (f) pool 0 and 0 alive → disabled,
  "No Stamina Change", info hidden; (g) negative hand-edited pool → behaves as pool 0, writes 0;
  (h) the draft path at pool 0 agrees with the committed state; (i) Reset at pool 0 → back to (a);
  (j) a pool > 0 regression pin (nothing staged → "No Stamina Change", disabled, info hidden).
- e2e: if the SC-435 pool specs (`e2e/specs/minion-pool/`, driver `e2e/driver/pool.ts`, manifest
  `e2e/manifest/minion-pool-modal.ts`) can open a squad at pool 0 using existing vault fixtures
  or setup helpers, add ONE e2e step that opens it, checks the label, clicks Apply, and checks the
  minions are dead. If it needs a new vault fixture, add the smallest one following the existing
  fixtures' conventions. Do not change the e2e coverage contract (pairs stay 163/163 unless the
  manifest requires a new pair — then say so). If you judge the e2e step disproportionate, say why
  in the report instead.
- CHANGELOG: one bullet under `## Unreleased` in the dse CHANGELOG (follow the SC-566/SC-567
  bullets' voice — plain user-facing statement, ticket key in parentheses).

Commit after each coherent step (code+tests, then e2e, then changelog). Conventional message, prefix
`fix(pool-modal): ... (SC-573)`. No AI attribution trailers in commits.

Evidence for Scott: one PNG of the modal at pool 0 with nothing staged (label and info line
visible), ideally from real Obsidian (e2e `browser.saveScreenshot` in your new step to a path in your
scratch folder, or the visual harness if it stages the pool modal). If neither is cheap, say so.

## 3. Gates (full dse-verify battery, in its order)

Expected at `f2889351` (deltas from your new tests are fine; state them):
- tsc clean, lint clean
- jest 7098 passed baseline (yours: + new tests). SC-568 load timeouts can flake a suite under
  full load — re-run that suite alone; green alone is green.
- lifecycle 53/53, run in FIVE `--only` parts exactly:
  1. `G-S7a … G-S9a` (21 ids — take the exact list from the SCENARIOS order in dse-verify / the lifecycle script)
  2. `G-S9b … G-S40` (16)
  3. `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9)
  4. `G-S57 G-S62 G-S61 G-S56` (4) — G-S56 stays LAST in SCENARIOS order
  5. `G-S59 G-S49 G-S73` (3)
  Never set `DSE_LIFECYCLE_PORT`. Give each run a private `DSE_CAMERA_TMP` inside your scratch folder.
  (No new lifecycle scenario is expected; if you add one its id is G-S81.)
- e2e: `256/263 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs` (RECOV-R07 is a documented
  load flake — re-run alone if it fails). If you add an e2e step, the ok count rises; state it.
- shots 592; host-leak 163/978; modal host-leak 39 kinds / 234 comparisons; capture clip 147
- freeze 280/280 (no print change expected; if a frozen hash moves, STOP and report with before/after crops)
- parity 0/0/24 (last)

## Footguns (every one has cost real time)

- No compound `cd`. Use `git -C <abs path>` for every git command and
  `devbox run -c /home/scott/code/steelCompendium/worktrees/sc573-pool-zero-apply/draw-steel-elements -- <cmd>`
  for node/npm. Never `cd X && …`.
- Never `rm` with a variable target; never a glob `rm` (especially under /tmp — other efforts'
  lifecycle vaults match `/tmp/dse-obsidian-lifecycle-*`). Delete only literal paths you created.
- One gate per Bash call, in the FOREGROUND, output redirected to a file in your scratch folder,
  then read the file. No background gates and no Monitor — except shots, which may run in the
  background; if you do, POLL its own log file (unique per-run path) until its summary line
  appears. A job you started never wakes you.
- Devbox eats exit codes and `| tail` eats failures: record exit codes from a script file run
  through devbox (`devbox run -c <path> -- bash <script>`) and read each gate's summary line.
- Kill scratch processes by literal PID only, and only a PID whose cwd (`readlink /proc/<pid>/cwd`)
  is inside your worktree. Never `pkill`/`killall` by pattern.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc573-impl-<yourAgentId>/`
  — uniquely named scripts and logs inside it. Write scratch files with the Write tool, not heredocs.
- Never touch `.superpowers/sdd/freeze-baseline.sha256` or any other effort's ledger. Never
  `rm -rf` anything under `.superpowers/`.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated
  across sessions and branches. Read the process's own output, or a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills
  silent agents.
- Never tag or release draw-steel-elements. Do not push; the dispatcher lands.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with
  `STATUS: NEEDS_CONTEXT` and the question; I will resume you. If you ever do send a message, its
  first word must be `SC-573:`.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc573-pool-zero-apply/sc573-impl-r1-report.md`.
If the write is blocked by your harness, return the report inline. It opens with a ≤10-line
executive summary (verdict, branch sha, every gate number), then: what you measured today at pool 0
with damage staged, files changed, where the "pool already empty" owed-kill value lives and why, each
test added (name + what it pins), the e2e step (or why not), `Drive-by fixes:` and `Follow-ups:`.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — STATUS (DONE / DONE_WITH_CONCERNS /
NEEDS_CONTEXT / BLOCKED), branch head sha, measured gate numbers, plus the absolute path of every
evidence artifact (report, gate logs, screenshot). No prose.
