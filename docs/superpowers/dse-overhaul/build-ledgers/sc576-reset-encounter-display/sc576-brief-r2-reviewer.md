# SC-576 r2 — independent reviewer brief

Your final text goes to the SC-576 ticket-owner, not a human. **Workers never call the tracker
(Linear)** — not to read history, not to post. You did not write this code; review it
adversarially. **Execute and probe, do not just read.**

## 1. Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc576-reset-encounter-display/decisions.md`
- The implementer's brief and report in the same dir: `sc576-brief-r1-implementer.md`,
  `sc576-r1-implementer-report.md` (read the executive summary and the root-cause section; treat
  its claims as claims to verify).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc576-reset-encounter-display`, plugin at
  `…/draw-steel-elements`, branch `sc576-reset-encounter-display`, head `2b1525ba` (fix `61a7918e` + test `2b1525ba`), base
  `origin/develop` `97a9c93b`. Review `git -C <plugin> diff 97a9c93b..HEAD`.
- Do not commit to the branch. Probes that need code mutation go in a throwaway
  `git -C <plugin> worktree add <your scratch>/probe-wt HEAD` (remove it with
  `git -C <plugin> worktree remove <literal path>` when done), never on the branch itself.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, `compendium-manifest.json`,
  `demo-vault/*.md`) is Scott's live vault and expected — ignore it.

## 2. What to check

The bug: after Reset encounter → Yes, the rebuilt initiative tracker showed no enemy roster
cells / detail rows and heroes at 0 Stamina with a Dying chip, while the note file was correct.

1. **Root cause, not symptom.** Does the fix make the in-memory model after Reset equal to what a
   fresh parse of the written note yields? Probe: diff the rebuilt DOM after Reset against a
   fresh render of the same written note (jsdom), for heroes, plain enemy groups, a minion
   squad, a captain, a group with a custom/pre-damaged instance. Any field that differs is a
   finding.
2. **Note integrity (writes into user files).** Reset must write the same bytes as at
   `97a9c93b`. Probe: content above and below the block survives; two initiative blocks in one
   note do not cross-talk (SC-436's e2e fixture `Initiative/two-trackers.md` exists for this) (reset one, the other is untouched on screen and on disk); a
   hand-edited block re-triggered survives; Reset twice in a row is idempotent.
3. **Post-reset interaction.** After Reset, do the follow-up actions still work and persist
   correctly — damage a creature, toggle a hero's turn, Malice ±, next round? (A model that is
   normalised for paint but carries stale references can break the next write.)
4. **Other callers.** Any other action that rebuilds from an un-normalised in-memory model
   (same bug class)? Did the implementer's change alter behaviour for non-reset rebuilds?
5. **Tests.** Are the converted `[X05]` and the e2e `[INIT-X05]`/`[INIT-X06]` assertions real
   (mutation test: revert the fix in your probe worktree, confirm they fail for the right
   reason)? Any vacuous test added?
6. **Markers of other tickets** (SC-575, SC-588, SC-572, SC-577, SC-578) untouched and still
   reporting as known-bug.
6b. **The implementer's design** (verify, don't trust): Reset confirm now calls a new
   `InitiativeView.rebuildFromWrittenReset()` — it writes the reset model, then rebuilds from
   `parse(parseYaml(bytes))` + `resolveInitiativeRefs`; on a re-parse throw it logs and keeps the
   reset model. Probe specifically: (a) is `resolveInitiativeRefs` async, and can the file-echo
   re-render or a fast user click race the rebuild (double rebuild, stale view, lost write)?
   (b) the throw fallback — force it and see what the screen shows (is it the old bug again,
   silently?); (c) refs to statblocks / compendium creatures after reset still resolve
   (names, max Stamina); (d) does the view hold onto the new model, so the NEXT write
   serialises from it and not the stale reset model?
6c. **Evidence for Scott (do this if you can in ≤15 minutes):** one real-Obsidian screenshot
   of the tracker right after Reset → Yes on the fix head (e.g. a temporary forced-fail or a
   `browser.saveScreenshot` in your probe worktree's copy of `[INIT-X05]`), showing enemy
   roster rows and heroes at full Stamina. Save it in your scratch folder and give its path.
7. **Gates.** Re-run at minimum: jest (full), e2e (full), and lifecycle parts 3–5
   (`G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64`; `G-S57 G-S62 G-S61 G-S56`;
   `G-S59 G-S49`), each its own foreground call. Expected: jest 7050+N passed / 1 skipped
   (cached CSS) or one fewer / 2 skipped (fresh); e2e
   `251/260 ok, 0 failed, 9 known-bug, coverage: 161/161 pairs`; lifecycle all green. Compare
   with the implementer's reported numbers. Re-run shots/freeze only if the diff touches
   anything that could move a print byte.

Gate mechanics: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
(battery, devbox wrapping, exit-code footgun, CURRENT numbers). Lifecycle: never set
`DSE_LIFECYCLE_PORT`; private `DSE_CAMERA_TMP` per run; G-S56 stays last in SCENARIOS order.

## 3. Footguns

- No compound `cd`. `git -C <abs>` for git; `devbox run -c <abs plugin path> -- <cmd>` for tools.
- Devbox's `sh` eats `$?`; pipes eat failures: exit codes from a script FILE run via devbox,
  output redirected to a file, read each gate's summary line.
- One gate per Bash call, in the FOREGROUND. No `run_in_background`, no Monitor.
- Redirect long-running output to a file — the 600s stream watchdog kills silent agents.
- Never key a wait-loop on a scratch filename or its contents; per-run unique paths only.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc576-rev-r2-<random 6 chars>/`.
- Never `rm` with a variable target; never a glob `rm` under `/tmp`; never touch `.superpowers/`
  beyond your report file. Kill processes by literal PID only, and only ones inside your own
  worktree/probe (`readlink /proc/<pid>/cwd`). SC-480 and SC-436 run the same gates now.
- Do not edit the dse-verify SKILL.md.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me. If you need input, end with `STATUS: NEEDS_CONTEXT` and the
  question. Any message you send anyway starts with `SC-576:`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc576-reset-encounter-display/sc576-r2-review-report.md`,
opening with a ≤10-line executive summary (verdict LAND / FIX-FIRST, finding counts by severity,
gate numbers). Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, failure
scenario, probe evidence, prescribed fix. Absolute paths of every evidence artifact.

## 5. Return contract

Raw facts: STATUS, verdict, finding list (one line each), measured gate numbers, report path,
evidence paths.
