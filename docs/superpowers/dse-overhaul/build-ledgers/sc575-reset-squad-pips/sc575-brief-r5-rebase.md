# SC-575 r5 — rebase onto a339e7b3 + full battery (implementer brief)

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc575-reset-squad-pips/decisions.md` (read first, especially "Base move"). Executive summaries only: `sc575-r1-implementer-report.md` `sc575-r2-review-report.md`, `sc575-r3-rebase-report.md`, `sc575-r4-rereview-report.md` in the same dir.
- Worktree plugin: `/home/scott/code/steelCompendium/worktrees/sc575-reset-squad-pips/draw-steel-elements`, branch `sc575-reset-squad-pips`, current head `3609e3e9` (commits `8f7e1c91` fix, `3609e3e9` review fixes) on base `eeed5182`; worktree superproject has commit `776f7fad` (workspace CHANGELOG bullet) — leave it as is.
- **You never call the tracker (Linear).** The main checkout's dse vault dirt (`demo-vault/Welcome.md`, `compendium-manifest.json`, `demo-vault/*.md`) is Scott's and expected.
- Verify every write path is under `worktrees/sc575-reset-squad-pips/`, never under `/home/scott/code/steelCompendium/workspace/` — except your report, which goes to the ledger dir.

## 2. The task

1. `git -C <plugin path> fetch origin`, confirm `origin/develop` is `a339e7b3` (if it moved further, stop and return `STATUS: NEEDS_CONTEXT` with the new sha). `git -C <plugin path> rebase a339e7b3`. Resolve conflicts preserving both sides (SC-572 changed the minion pool modal and added e2e POOL-C05/C06; this branch changes `resetEncounter`, a `model.ts` comment, initiative tests and e2e INIT-X07, plus a plugin CHANGELOG bullet — a CHANGELOG conflict keeps both bullets, upstream's first). If `package.json` changed, run `npm ci`.
2. No other change. The r2 folds are already in `3609e3e9`; do not redo them. Fold any r4 finding ONLY if the owner lists it in an "r4 folds" section appended to this brief.
3. Run the full dse-verify battery (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`, its order and command shapes).
4. Update `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc575-reset-squad-pips/sc575-skill-proposal.md` with the post-rebase numbers (proposal only; never edit SKILL.md).

## 3. Gates — expected at a339e7b3 + this branch

| Gate | a339e7b3 baseline | Expected |
|---|---|---|
| tsc, lint | clean | clean |
| jest | 7082 passed / 1 skipped (worktree with the shots CSS cache — yours has it) | 7085 passed / 1 skipped (+3 SC-575 unit cases); an SC-568 timeout re-run alone and green |
| lifecycle | 53/53 | 53/53 |
| e2e | `254/262 ok, 0 failed, 8 known-bug, coverage: 163/163 pairs` | `255/262 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs` |
| shots | 592; button host-leak 163/978; modal host-leak 39 kinds / 234 comparisons; capture clip 147 | unchanged |
| freeze | 280/280 | 280/280 |
| parity | 0/0/24 | 0/0/24, last |

Lifecycle in FIVE `--only` parts, one call each, this order (G-S56 stays LAST in part 4):
1. `G-S7a … G-S9a` (21 — exact list from the skill)
2. `G-S9b … G-S40` (16)
3. `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9)
4. `G-S57 G-S62 G-S61 G-S56` (4)
5. `G-S59 G-S49 G-S73` (3; ~266 s)

G-S59 went red twice under heavy load in r1 and was green in r2/r3. If it reds again, record `cat /proc/loadavg` at the time and re-run it alone; report both.

Footguns:
- **No compound `cd`.** `git -C <abs path>`; `devbox run -c <abs plugin path> -- <cmd>` or `-- bash <script file>`.
- Devbox eats `$?`; never pipe a gate into `tail`. Each gate via a script file that writes its own exit code; output redirected to a file; read the summary line.
- **One gate per Bash call, foreground.** No `Monitor`. If your harness auto-backgrounds a long call, poll that run's own uniquely named `.rc`/log file — never wait for a notification, never key on a pre-existing scratch filename.
- Redirect long output to a file — the 600 s stream watchdog kills silent agents.
- **Never set `DSE_LIFECYCLE_PORT`.** Private `DSE_CAMERA_TMP` per run under your scratch folder.
- **Private scratch:** `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc575-r5-impl-<your agent id>/`, unique names.
- **Never `rm` with a variable target; never a glob `rm` under `/tmp`.**
- **Kill by literal PID only**, only PIDs inside your worktree (`readlink /proc/<pid>/cwd`). Never `pkill`/`killall` by pattern — other efforts run the same gates concurrently.
- Never touch `.superpowers/sdd/freeze-baseline.sha256`; never delete under `.superpowers/` anything you did not create.
- Commit messages: no co-author trailer (Scott's global CLAUDE.md). Do not push. Do not touch the superproject pointer.
- A token-coverage red may be the stale-superproject-pin footgun (adapter §8.4): compare the worktree's `docs/superpowers/dse-overhaul/D3-token-map.md` with the main checkout's; `DSE_TOKEN_MAP_PATH` override clears it.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc575-reset-squad-pips/sc575-r5-rebase-report.md`, opening with a ≤10-line executive summary. If the write is blocked, return it inline.

## 5. Return contract

Final text goes to the ticket-owner: STATUS, new head sha, `git log --oneline a339e7b3..HEAD`, the superproject CHANGELOG commit sha (unchanged `776f7fad` unless you had to touch it), any conflict and how it was resolved, every gate's measured summary line, absolute paths of the report and gate logs. No prose.

You cannot `SendMessage` me; if you need input, end with `STATUS: NEEDS_CONTEXT` and the question. Any message sent anyway starts with `SC-575:`.

## r4 folds (owner, 2026-11-11)

- **r4 LOW-1, superproject landing conflict.** The worktree superproject `/home/scott/code/steelCompendium/worktrees/sc575-reset-squad-pips` (branch `sc575-reset-squad-pips`, commit `776f7fad` on `9bb80e4b`) conflicts with origin/main in `CHANGELOG.md`: SC-480's bullet, and maybe SC-572's, now sits at the top of `## Unreleased`. Do this after the plugin rebase and its gates, before writing the report:
  1. `git -C /home/scott/code/steelCompendium/worktrees/sc575-reset-squad-pips fetch origin`, then `git -C … rebase origin/main`. Resolve `CHANGELOG.md` by keeping every upstream bullet and adding the SC-575 bullet. That must be the only conflict; if anything else conflicts, `git -C … rebase --abort` and return `STATUS: NEEDS_CONTEXT`.
  2. Do NOT stage or commit the `draw-steel-elements` pointer, and do NOT run `git submodule update`. The plugin submodule must stay on branch `sc575-reset-squad-pips` at your rebased head.
  3. Report `git -C … log --oneline origin/main..HEAD` (expect exactly one commit, the CHANGELOG bullet) and the full `git -C … status --short`. Expect ` M draw-steel-elements` and nothing else of yours. If another submodule shows as modified because origin/main moved its pin, list it with both shas and leave it alone. The owner rules on it.
