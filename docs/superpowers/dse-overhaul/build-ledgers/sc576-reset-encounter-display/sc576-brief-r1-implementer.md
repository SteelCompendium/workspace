# SC-576 r1 — implementer brief

Your final text goes to the SC-576 ticket-owner, not a human. **Workers never call the tracker
(Linear)** — not to read history, not to post.

## 1. Context

- Ledger (read first): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc576-reset-encounter-display/decisions.md`
- Prior art (read the SC-576 parts only): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc437-e2e-initiative-tracker/`
  - `sc437-r1-implementer-report.md` (grep SC-576): cause notes.
  - `sc437-r2-review-report.md` M-1 + the SC-576 line: a reviewer simulated a view-level fix
    ("re-parse the reset model before the rebuild") and the DOM came out right: three roster
    cells, detail `60/60`, heroes `30/30`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc576-reset-encounter-display`, plugin at
  `…/draw-steel-elements`, branch `sc576-reset-encounter-display`, HEAD should be `32441332`
  (= origin/develop at dispatch). First: `git -C <plugin> fetch origin` and confirm
  `origin/develop` is still `32441332`; if it moved, `git -C <plugin> rebase origin/develop` and
  say so in the report (run `npm ci` if `package.json`'s obsidian version changed).
- Verify every write target is inside the worktree. Never edit anything under
  `/home/scott/code/steelCompendium/workspace/` except your report file in the ledger dir.
  The main checkout's dse dirt (`demo-vault/Welcome.md`, `compendium-manifest.json`,
  `demo-vault/*.md`) is Scott's live vault and expected — leave it alone, don't report it.

## 2. Task

Bug (ticket text): "After Reset encounter → Yes, the tracker rebuilds wrong. Every enemy group
shows no creatures (no roster cells, no detail rows), and every hero shows 0 Stamina with a red
DYING chip (0 / 30, 0 / 40). The note file is written correctly; only the screen is wrong, and it
stays wrong after the write settles."

Known cause (ticket agent notes + SC-437 report): `resetEncounter` sets `instances = undefined`
and hero `current_stamina = undefined` (`src/drawSteelAdmonition/EncounterData.ts:~652-657`);
`rebuildAndPersist()` rebuilds from the in-memory model without re-parsing
(`src/elements/initiative/view.ts:~162-169`, `~224-227`), and the view paints `?? 0`.

Do (TDD — flip the existing failing test first, then fix):

1. Fix it at the root so the rebuilt tracker after Reset shows exactly what a fresh parse of the
   written note would show: every enemy group's roster cells + detail rows, minion squads
   included; heroes at full Stamina with no Dying chip. Choose the cleanest place (normalise the
   reset model through the same defaulting the parser applies, or re-derive from what was
   written) — explain the choice in the report in ≤5 lines.
   - **The bytes Reset writes to the note must not change** (`[INIT-X01]` pins them). Prove it.
   - Look for other callers that leave the in-memory model un-normalised the same way (other
     actions that rebuild via `rebuildAndPersist`). Fix only if it is the same bug class and
     local; otherwise list it under `Follow-ups:`.
2. Remove the SC-576 markers with the fix:
   - jsdom `test.failing('[X05] …')` at `test/dom/elements/initiative-matrix.test.ts:699` → plain `test`.
   - e2e `knownBug('SC-576', …)` on `[INIT-X05]` and `[INIT-X06]` in
     `e2e/specs/initiative/reset-encounter.e2e.ts` (~:84, ~:98) → plain assertions; delete the
     now-stale comment at ~:82.
   - Add a jsdom regression assertion for the hero side too (Stamina = max, no Dying chip) if
     `[X05]` does not already cover it, and for a minion squad group if the fixture has one.
3. Out of scope (other tickets, do not fix): SC-575 (reset leaves a minion squad's action pips
   pressed), SC-588 (focus drops after a whole-tracker rebuild), SC-590. If your fix flips one of
   THEIR markers ("appears fixed"), do not touch the marker: stop and return
   `STATUS: NEEDS_CONTEXT` with the evidence.
4. Commit inside the plugin on the branch after each coherent step (conventional message,
   `fix(SC-576): …`). No co-author/AI trailer in commit messages. Do not push. Do not touch the
   superproject pointer.

## 3. Gates — `dse-verify` skill

Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery
table, devbox wrapping, exit-code footgun, "Current expected numbers" CURRENT block). Run the
full battery on your final head, in order: tsc (incl. `tsc -p e2e`), lint (incl. `e2e/`), jest,
lifecycle, e2e, shots, freeze check, parity.

Expected at your head (baseline `32441332` in parentheses):
- tsc / lint clean.
- jest: 6765 passed / 1 skipped / 259 of 260 suites (worktree with the shots CSS cache; a fresh
  worktree reads one fewer passed and 2 skipped until shots has run) — plus whatever tests you
  add. `[X05]` moves from failing-marker to plain pass. SC-568 load timeouts possible: re-run the
  failing suite alone and report both.
- lifecycle: 52/52, run in FIVE `--only` parts, each its own foreground Bash call:
  `G-S7a … G-S9a` (21); `G-S9b … G-S40` (16);
  `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9); `G-S57 G-S62 G-S61 G-S56` (4);
  `G-S59 G-S49` (2). Take the exact id lists for parts 1 and 2 from the skill. G-S56 stays LAST in
  SCENARIOS order. Never set `DSE_LIFECYCLE_PORT`. Give each run a private `DSE_CAMERA_TMP`.
  You should not need a new lifecycle scenario; if you do, the free id is G-S74.
- e2e: `OBSIDIAN-E2E done: 201/206 ok, 0 failed, 5 known-bug, coverage: 142/142 pairs`
  (was 199/206, 7 known-bug).
- shots: 592, 0 FAIL, `button host-leak OK (163 … 978 …)`, `capture clip OK (147 …)`.
- freeze: `freeze OK (280/280 …)` — a JS-only fix should move no frozen byte. If anything moves,
  stop and report (do not touch any baseline).
- parity: 0 GAPs / 0 undeclared / 24 DECLARED.

## 4. Footguns (each cost real time once)

- No compound `cd`. Use `git -C <abs path>` for every git command and
  `devbox run -c <abs plugin path> -- <cmd>` for every tool (Node etc. are not on PATH).
- Devbox's `sh` eats `$?` and pipes eat failures: record exit codes from a script FILE run via
  `devbox run -c <path> -- bash <script>`, redirect output to a file, read each gate's summary line.
- One gate per Bash call, in the FOREGROUND (stay under the 10-minute tool timeout; split
  lifecycle as above). No `run_in_background`, no Monitor — except shots if it cannot fit in
  10 minutes, and then poll its own log/exit-code file; never wait for a notification.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog
  kills silent agents.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated
  across sessions and branches. Write to a per-run unique path.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc576-impl-r1-<random 6 chars>/`
  with uniquely named scripts and logs. The scratchpad is shared by every agent.
- Never `rm` with a shell-variable target; never a glob `rm` under `/tmp`; never `rm -rf`
  anything under `.superpowers/`. Delete only literal paths you created.
- Kill scratch processes by literal PID only, and only a PID whose command line or
  `readlink /proc/<pid>/cwd` is inside YOUR worktree. Never `pkill`/`killall` by pattern —
  other efforts (SC-480, SC-436) are running the same gates right now.
- The workspace-level files live in YOUR worktree's superproject
  (`/home/scott/code/steelCompendium/worktrees/sc576-reset-encounter-display/…`) — you should
  not need to edit any. Do not edit the dse-verify SKILL.md anywhere.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with
  `STATUS: NEEDS_CONTEXT` and the question; I will resume you. If you ever send a message
  anyway, its first word must be `SC-576:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc576-reset-encounter-display/sc576-r1-implementer-report.md`.
It must OPEN with a ≤10-line executive summary: verdict, final plugin sha, each gate's measured
summary line, marker changes.

Body: root cause and fix choice (≤5 lines), files changed, proof the written note bytes are
unchanged, tests added/converted, `Drive-by fixes:` and `Follow-ups:` lists, and the absolute
path of every evidence artifact (gate logs, any screenshot of the tracker after Reset in real
Obsidian — e2e `.out` bundle for INIT-X05/X06 if kept; copy the after-reset screenshot into your
scratch folder and give its path).

## 6. Return contract

Final text: raw facts, no prose — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), plugin branch + sha,
each gate's measured numbers, report path, evidence paths.
