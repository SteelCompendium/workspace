# SC-575 r2 — independent reviewer brief

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc575-reset-squad-pips/decisions.md` (current state; read first).
- The r1 brief (what was asked): `.../sc575-reset-squad-pips/sc575-brief-r1-implementer.md`. Read the r1 report's executive summary only: `.../sc575-reset-squad-pips/sc575-r1-implementer-report.md`. Form your own view from the code and the runtime, not from the report.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc575-reset-squad-pips/draw-steel-elements`, branch `sc575-reset-squad-pips`, head ``bcb015de``, base dse develop `fbaba3da`. Review `git -C <plugin path> diff fbaba3da..HEAD`. First `git -C <plugin path> fetch origin`; if `origin/develop` moved past `fbaba3da`, say so (do not rebase).
- **You never call the tracker (Linear).** The main checkout's dse vault dirt (`demo-vault/Welcome.md`, `compendium-manifest.json`, `demo-vault/*.md`) is Scott's and expected.
- You do not edit the branch. Probes and scratch go in your private scratch folder (below). If you prove a finding with a code change, keep it as a patch file in scratch, not a commit.

## 2. The task

Bug under fix: Reset encounter clears every creature's actions except a minion squad's shared actions. A squad whose Move pip was pressed still shows it pressed after Reset → Yes, in the note and after a reload. Fix site: `resetEncounter`, `src/drawSteelAdmonition/EncounterData.ts:622`.

Adversarial review — execute and probe, do not just read:
1. Is every persisted copy of squad shared actions cleared? Find every place squad actions are written (grep the view/model writers for the squad action toggle) and confirm reset clears each. Multi-squad groups (pools live on the creatures, SC-183 r3 / GH #67) and a squad with a captain must be covered.
2. Integrity probes (the fix writes into user notes): authored fields survive Reset (names, `amount`, `max_stamina`, `squad_role`, `is_squad`, `round_gain`, any authored captain); two encounter blocks in one note do not cross-talk; a non-squad group and heroes behave exactly as before. Probe these in jsdom or the e2e harness, by running code.
3. Round-trip: after Reset, does the written YAML still parse, and does a reload (fresh parse) show no pressed squad pip? Does SC-576's fresh-parse rebuild path see the cleared state?
4. Are the flipped tests non-vacuous? Revert the fix locally (in a scratch copy or with `git stash`-free means such as a patch applied to a scratch clone/worktree under your scratch folder) and confirm both former known-bug tests FAIL without it.
5. `resetRound` / `advanceRound` (`src/elements/initiative/model.ts:421-490`): do they clear squad shared actions? Compare with the r1 report's finding.
6. Re-run jest, and e2e in full (lifecycle too if the diff touches anything a lifecycle scenario exercises). Expected e2e after the fix: `252/260 ok, 0 failed, 8 known-bug, coverage: 161/161 pairs` (baseline was 251/260, 9 known-bug). Other baselines: jest 7056 passed / 1 skipped at base; lifecycle 52/52; shots 592, host-leak 163/978, capture clip 147; freeze 280/280; parity 0/0/24. Gate shapes are in `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`. Lifecycle runs in FIVE `--only` parts (`G-S7a … G-S9a` 21; `G-S9b … G-S40` 16; `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` 9; `G-S57 G-S62 G-S61 G-S56` 4; `G-S59 G-S49` 2), G-S56 last in SCENARIOS order.

Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, a concrete failure scenario, and a prescribed fix. Out of scope: SC-577, SC-578, SC-588, SC-589, SC-480, SC-572 — mention them only if the diff breaks something they own.

## 3. Footguns

- **No compound `cd`.** `git -C <abs path>`; `devbox run -c <abs plugin path> -- <cmd>` or `-- bash <script file>`.
- Devbox eats `$?`; never pipe a gate into `tail`. Run each gate via a script file that records its exit code, output redirected to a file.
- **One gate per Bash call, foreground.** No `run_in_background`/`Monitor` except shots (then poll its own log). Stay under the 10-minute tool timeout.
- Redirect long output to a file — the 600 s stream watchdog kills silent agents.
- **Never set `DSE_LIFECYCLE_PORT`.** Each run gets a private `DSE_CAMERA_TMP` under your scratch folder.
- **Private scratch:** `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc575-r2-rev-<your agent id>/`, unique file names.
- **Never `rm` with a variable target; never a glob `rm` under `/tmp`.**
- **Kill by literal PID only**, only PIDs inside your own worktree/scratch (`readlink /proc/<pid>/cwd`). Never `pkill`/`killall` by pattern — SC-480 and SC-572 run the same gates now.
- Never touch `.superpowers/sdd/freeze-baseline.sha256`; never delete anything under `.superpowers/` you did not create.
- Never key a wait-loop on a scratch filename or its contents; read the process's own output or a per-run unique path.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc575-reset-squad-pips/sc575-r2-review-report.md`, opening with a ≤10-line executive summary (verdict: LAND-READY / FIX-REQUIRED, finding counts by severity, gate numbers). If the write is blocked, return it inline.

## 5. Return contract

Final text goes to the ticket-owner, not a human: raw facts — verdict, sha reviewed, findings (severity, file:line, one-line scenario, prescribed fix), measured gate summary lines, and the absolute path of every evidence artifact.

You cannot `SendMessage` me (depth-2 cannot address its parent; `to: 'main'` goes to the dispatcher). If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. Any message you send anyway starts with `SC-575:`.

## 6. Owner notes for this round (2026-11-11)

- r1 reported G-S59 red twice under loadavg 14-28 (one wait timed out, and the harness itself returned an "environment" verdict), then green alone. Re-run `--only G-S59` and record the loadavg at the time. If it is red on a quiet host, it is a finding.
- r1 added a `[FIX]` bullet under 7.0.0 in the plugin's `CHANGELOG.md`. Check it is in the right file and section, and that the wording is plain.
- Out of scope, already ticketed: Reset encounter does not undo a captain promoted mid-fight (`squad_role`/`captain_of` writes at EncounterData.ts:443-456) — that is **SC-590**. Do not report it again.
- `resetRound`/`advanceRound` already clear squad actions via `clearTurnState` (model.ts:421-445), per r1. Verify it rather than taking it on trust.
