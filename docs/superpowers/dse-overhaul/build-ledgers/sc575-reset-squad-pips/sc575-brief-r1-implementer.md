# SC-575 r1 — implementer brief

## 1. Context loading

- Ledger (read first, it is current state): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc575-reset-squad-pips/decisions.md`
- Prior art (read the executive summaries only): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc576-reset-encounter-display/` (SC-576 made Reset encounter rebuild the tracker from a fresh parse of the reset note; its owner left squad pips out as this ticket) and `.../build-ledgers/sc437-e2e-initiative-tracker/` (the e2e rollout that found this bug and wrote the known-bug markers).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc575-reset-squad-pips`. The plugin is `/home/scott/code/steelCompendium/worktrees/sc575-reset-squad-pips/draw-steel-elements`, branch `sc575-reset-squad-pips`, cut at dse develop `fbaba3da` (workspace main `9bb80e4b`). First: `git -C <plugin path> fetch origin` and confirm `origin/develop` is still `fbaba3da`; if it moved, `git -C <plugin path> rebase origin/develop` and say so in your report (run `npm ci` if `package.json` changed). Verify your path before every write: it must be under `worktrees/sc575-reset-squad-pips/`, never under `/home/scott/code/steelCompendium/workspace/`.
- **You never call the tracker (Linear)** — not to read history, not to post. The ledger is your context.
- The main checkout's dse vault dirt (`demo-vault/Welcome.md`, `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault and expected. Do not touch it and do not report it.

## 2. The task

Bug: Reset encounter clears every creature's actions except a minion squad's shared actions. A squad whose Move pip was pressed still shows it pressed after Reset → Yes, in the note and after a reload.

Where: `src/drawSteelAdmonition/EncounterData.ts:622` `resetEncounter`. The squad branch clears pools and captain fields but never clears the squad's shared `creatureType.actions` (type `SquadActions`, field at EncounterData.ts:112).

Do:
1. TDD: the known-bug markers are your red tests. Flip both to ordinary tests and see them fail for the right reason before the fix:
   - `test/dom/elements/initiative-matrix.test.ts:858` `test.failing('[X07] … [known bug SC-575]')` → a normal `test(...)`, title without the known-bug suffix.
   - `e2e/specs/initiative/reset-encounter.e2e.ts:102` `knownBug('SC-575', '[INIT-X07] …', …)` → the spec file's normal test form. Check how the e2e runner counts known bugs and coverage pairs so the run ends with known-bug 8 and the same coverage pair count.
2. Fix `resetEncounter` so the squad's shared actions are cleared (a squad member `creatureType` with `squad_role === "minion"`; check the `SquadActions` docs at EncounterData.ts:30-115 for where else squad shared actions can live — e.g. a group-level field — and clear every persisted copy). Add a short comment in the style of the neighbours.
3. Also unit-test the model function directly if there is an existing `resetEncounter` unit test file (find it with grep); add a case that a squad's `actions` is cleared and a hero's/non-squad creature's behaviour is unchanged.
4. Check (do not change unless trivially the same bug): do `resetRound` / `advanceRound` in `src/elements/initiative/model.ts:421-490` clear a squad's shared actions? Report what you find with file:line under `Follow-ups:` if they do not. The owner rules fold vs ticket.
5. Integrity: the reset must leave authored fields alone (names, max_stamina, amount, squad_role, captain choice if authored, round_gain). Your test should assert at least one authored squad field survives.
6. Commit inside the plugin on branch `sc575-reset-squad-pips` after each coherent step (`git -C <plugin path> …`). Do not push. Do not touch the superproject pointer.

Out of scope: SC-577, SC-578, SC-588, SC-589, SC-480, SC-572. Do not edit `.claude/skills/dse-verify/SKILL.md`; if the skill needs a change (e.g. the e2e known-bug count line), write the proposal to `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc575-reset-squad-pips/sc575-skill-proposal.md`.

## 3. Gates

Follow the `dse-verify` skill (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`) for the full battery, in its order and command shapes, against YOUR worktree. Baseline at `fbaba3da` and what to expect after the fix:

| Gate | Baseline | Expected after |
|---|---|---|
| tsc, lint | clean | clean |
| jest | 7056 passed / 1 skipped (SC-568 load timeouts possible; re-run a timed-out file alone, it is green alone) | ≥7056 passed (+ your new cases), 1 skipped, 0 failed; the X07 test is now a passing `test`, not `test.failing` |
| lifecycle | 52/52 | 52/52 |
| e2e | `251/260 ok, 0 failed, 9 known-bug, coverage: 161/161 pairs` | `252/260 ok, 0 failed, 8 known-bug, coverage: 161/161 pairs` (or explain any different total) |
| shots | 592; host-leak 163/978; capture clip 147 | unchanged |
| freeze | 280/280 | 280/280 (a data-only fix must not move a frozen byte) |
| parity | 0/0/24 | 0/0/24, last |

Lifecycle runs in FIVE `--only` parts, one foreground Bash call each, in this order (G-S56 stays LAST in SCENARIOS order):
1. `G-S7a … G-S9a` (21 scenarios — take the exact id list from the skill)
2. `G-S9b … G-S40` (16)
3. `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9)
4. `G-S57 G-S62 G-S61 G-S56` (4)
5. `G-S59 G-S49` (2)

A new lifecycle scenario is not required for this fix. If you decide one is worth it, its id is `G-S76` (G-S60, G-S65–75 and G-S16 are taken).

Footguns — every one has cost real time:
- **No compound `cd`.** Use `git -C <abs path>` for every git command and `devbox run -c <abs plugin path> -- <cmd>` (or `-- bash <script file>`) for every tool. Never `cd X && …`.
- **Exit codes:** devbox's `sh` wrapper eats `$?`/`$PIPESTATUS`; never pipe a gate into `tail`. Run each gate through a script FILE that writes its own exit code, output redirected to a file, then read the gate's summary line.
- **One gate per Bash call, in the foreground.** No `run_in_background`, no `Monitor`, for any gate except shots. If shots must run in the background, poll its own log/exit-code file — never wait for a notification (it never comes). Keep each call under the 10-minute tool timeout (that is why lifecycle is split).
- **Redirect long output to a file** rather than streaming it — the 600 s stream watchdog kills silent agents.
- **Never set `DSE_LIFECYCLE_PORT`.** Give every lifecycle/e2e/shots run a private `DSE_CAMERA_TMP` under your scratch folder.
- **Private scratch:** make `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc575-r1-impl-<your agent id>/` and put every script and log there with unique names. Never use a generic name like `gate.sh` at the scratchpad root.
- **Never `rm` with a variable target** (`rm -f $X/y` hangs on a permission prompt nobody answers). **Never a glob `rm` under `/tmp`** (other efforts' lifecycle vaults match). Overwrite with `>` or use fresh unique names.
- **Kill scratch processes by literal PID only**, and only a PID whose `readlink /proc/<pid>/cwd` or command line is inside your worktree. Never `pkill`/`killall` by pattern — SC-480 and SC-572 run the same gates concurrently.
- Never touch the shared freeze baseline `.superpowers/sdd/freeze-baseline.sha256`; never `rm -rf` anything under `.superpowers/` except your own files.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- A token-coverage red on the doc-reading test may be the stale-superproject-pin footgun (adapter §8.4): compare the worktree's `docs/superpowers/dse-overhaul/D3-token-map.md` with the main checkout's before believing it; `DSE_TOKEN_MAP_PATH` override clears it.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc575-reset-squad-pips/sc575-r1-implementer-report.md`. It must open with a ≤10-line executive summary (verdict, final sha, gate numbers). If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts, no prose. Include: STATUS (DONE / BLOCKED / NEEDS_CONTEXT), branch + final sha + commit list, every gate's measured summary line, `Drive-by fixes:` (already made: obviously correct, local to a touched file, cannot move a baseline), `Follow-ups:` (left alone, with file:line), and the absolute path of every evidence artifact (report, gate logs).

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` goes to the dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question; I will resume you. If you ever send a message anyway, its first word must be `SC-575:`.
