# SC-575 r3 — rebase onto eeed5182 + full battery (implementer brief)

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc575-reset-squad-pips/decisions.md` (read first, especially "Base move"). Executive summaries only: `sc575-r1-implementer-report.md` and `sc575-r2-review-report.md` (and `sc575-r3-fix-report.md` if one exists) in the same dir.
- Worktree plugin: `/home/scott/code/steelCompendium/worktrees/sc575-reset-squad-pips/draw-steel-elements`, branch `sc575-reset-squad-pips`, current head `bcb015de` on base `fbaba3da`.
- **You never call the tracker (Linear).** The main checkout's dse vault dirt (`demo-vault/Welcome.md`, `compendium-manifest.json`, `demo-vault/*.md`) is Scott's and expected.
- Verify every write path is under `worktrees/sc575-reset-squad-pips/`, never under `/home/scott/code/steelCompendium/workspace/` — except your report, which goes to the ledger dir.

## 2. The task

1. `git -C <plugin path> fetch origin`, confirm `origin/develop` is `eeed5182` (if it moved further, stop and return `STATUS: NEEDS_CONTEXT` with the new sha). `git -C <plugin path> rebase eeed5182`. Resolve conflicts preserving both sides (SC-480 changed the card-write fallback path; this branch changes `resetEncounter` and initiative tests, plus a CHANGELOG bullet — a CHANGELOG conflict keeps both bullets). If `package.json` changed, run `npm ci`.
2. Then fold these r2 review findings (verbatim from the ledger "Owner rulings on r2 findings"), one commit:
   - **LOW-1** `src/elements/initiative/model.ts:27-28`: the header comment says enemy-side `actions` "dies with the instances it lives on". That is the assumption behind this bug, and it is false for a squad's pips. Append "— except a minion squad's shared `Creature.actions` (SC-278), cleared explicitly (SC-575)".
   - **LOW-2** plugin `CHANGELOG.md:30-31`: "second Move" should be "Second move", the button label (`view.ts:978`).
   - **INFO-2** `e2e/specs/initiative/reset-encounter.e2e.ts:102` (INIT-X07): besides the note, also assert that no `init.detail.squad-action` control is pressed on screen after Reset.
   - **INFO-3** add one SC-575 bullet under `## Unreleased` in the WORKSPACE changelog. It lives in YOUR worktree's superproject: `/home/scott/code/steelCompendium/worktrees/sc575-reset-squad-pips/CHANGELOG.md`, never `/home/scott/code/steelCompendium/workspace/CHANGELOG.md`. Match the neighbouring bullets' style. Plain words, e.g. "Reset encounter now also clears a minion squad's pressed action pips (Move, Second move …)." Commit it in the worktree superproject with `git -C /home/scott/code/steelCompendium/worktrees/sc575-reset-squad-pips add CHANGELOG.md` + commit. Stage ONLY that file; do not stage or bump the `draw-steel-elements` pointer.
   No other behaviour change. Dropped (do not do): INFO-1 (non-minion hand-written `actions`).
3. Run the full dse-verify battery (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`, its order and command shapes).
4. Update `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc575-reset-squad-pips/sc575-skill-proposal.md` with the post-rebase numbers (proposal only; never edit SKILL.md).

## 3. Gates — expected at eeed5182 + this branch

| Gate | eeed5182 baseline | Expected |
|---|---|---|
| tsc, lint | clean | clean |
| jest | 7076 non-skipped (7074 passed / 2 skipped in a fresh worktree + 2 SC-568 timeouts, each green alone) | 7079 non-skipped (baseline + 3 SC-575 unit cases); any timeout re-run alone and green |
| lifecycle | 53/53 | 53/53 |
| e2e | `251/260 ok, 0 failed, 9 known-bug, coverage: 161/161 pairs` | `252/260 ok, 0 failed, 8 known-bug, coverage: 161/161 pairs` |
| shots | 592; host-leak 163/978; capture clip 147 | unchanged |
| freeze | 280/280 | 280/280 |
| parity | 0/0/24 | 0/0/24, last |

Lifecycle in FIVE `--only` parts, one call each, this order (G-S56 stays LAST in part 4):
1. `G-S7a … G-S9a` (21 — exact list from the skill)
2. `G-S9b … G-S40` (16)
3. `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9)
4. `G-S57 G-S62 G-S61 G-S56` (4)
5. `G-S59 G-S49 G-S73` (3; ~266 s)

G-S59 went red twice under heavy load (loadavg 14-28) in r1 and green alone. If it reds again, record `cat /proc/loadavg` at the time and re-run it alone; report both.

Footguns:
- **No compound `cd`.** `git -C <abs path>`; `devbox run -c <abs plugin path> -- <cmd>` or `-- bash <script file>`.
- Devbox eats `$?`; never pipe a gate into `tail`. Each gate via a script file that writes its own exit code; output redirected to a file; read the summary line.
- **One gate per Bash call, foreground.** No `Monitor`. If your harness auto-backgrounds a long call, poll that run's own uniquely named `.rc`/log file — never wait for a notification, never key on a pre-existing scratch filename.
- Redirect long output to a file — the 600 s stream watchdog kills silent agents.
- **Never set `DSE_LIFECYCLE_PORT`.** Private `DSE_CAMERA_TMP` per run under your scratch folder.
- **Private scratch:** `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc575-r3-impl-<your agent id>/`, unique names.
- **Never `rm` with a variable target; never a glob `rm` under `/tmp`.**
- **Kill by literal PID only**, only PIDs inside your worktree (`readlink /proc/<pid>/cwd`). Never `pkill`/`killall` by pattern — SC-572 runs the same gates concurrently.
- Never touch `.superpowers/sdd/freeze-baseline.sha256`; never delete under `.superpowers/` anything you did not create.
- Commit messages: no co-author trailer (Scott's global CLAUDE.md). Do not push. Do not touch the superproject pointer.
- A token-coverage red may be the stale-superproject-pin footgun (adapter §8.4): compare the worktree's `docs/superpowers/dse-overhaul/D3-token-map.md` with the main checkout's; `DSE_TOKEN_MAP_PATH` override clears it.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc575-reset-squad-pips/sc575-r3-rebase-report.md`, opening with a ≤10-line executive summary. If the write is blocked, return it inline.

## 5. Return contract

Final text goes to the ticket-owner: STATUS, new head sha, `git log --oneline eeed5182..HEAD`, the superproject CHANGELOG commit sha, any conflict and how it was resolved, every gate's measured summary line, absolute paths of the report and gate logs. No prose.

You cannot `SendMessage` me; if you need input, end with `STATUS: NEEDS_CONTEXT` and the question. Any message sent anyway starts with `SC-575:`.
