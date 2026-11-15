# SC-651 r2 — independent review brief: Preset dropdown snap-back

You are the independent reviewer for Linear ticket SC-651. You did not write this code. Your final
text goes to the ticket-owner, not a human. **You never call the tracker** (Linear).

## 1. Context loading

1. Ledger (binding spec): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc651-preset-custom/decisions.md`.
2. The r1 implementer's report — read its executive summary first, the body only where you need it:
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc651-preset-custom/sc651-r1-impl-report.md`.
3. dse-verify skill `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — ~370 KB:
   read lines 1-250 only (battery, devbox, jest, e2e notes, "Settings e2e (SC-440)" ~line 206).

Worktree: `/home/scott/code/steelCompendium/worktrees/sc651-preset-custom`; plugin dir
`.../draw-steel-elements`, branch `sc651-preset-custom`, base dse `develop` `cefa9ca8`. Review
`git -C <plugin dir> diff cefa9ca8..HEAD` and the superproject's `git -C <worktree> log --oneline origin/main..HEAD` / diff (CHANGELOG only, no pointer bump expected yet).
The worktree may already have `node_modules` (the implementer ran `npm ci`).

**Do not commit to the branch.** Probes go in a scratch copy or are reverted with
`git -C <plugin dir> checkout -- <file>` on the files you touched, and you confirm
`git -C <plugin dir> status` is clean before you finish. The main checkout
`/home/scott/code/steelCompendium/workspace` is shared: write nothing there but your report.

## 2. What to review — execute and probe, not just read

Ruling (verbatim from the ledger):

> **Refuse and snap back.** … The fix: when the pick is `custom`, put the dropdown back to `deriveSbPreset(prefs)` and write nothing. When the derived state already is `custom`, the pick is a no-op that still reads Custom.
> Do NOT disable the `<option>`: a keyboard End / ArrowDown on a closed native select skips disabled options, so End would land on "Index card" and APPLY that preset (a write the user did not ask for). The option stays enabled; the change handler refuses it.
> scope is the Preset dropdown only (`renderPresetControl`). No change to `pipeline.ts`, `main.ts` sync paths, or the settings change path (SC-644 / SC-646 / SC-653 are other owners').

Probe at least:
- Correctness of the snap-back in REAL Obsidian (e2e `--only=SET-D16`, and any extra scratch e2e you need — keep scratch specs uncommitted and removed via `git checkout`/never committed; note scenario ids are global, so a scratch spec must use an id no other spec uses, e.g. `SET-Z99`): after a Custom pick by keyboard (End, ArrowDown from Index card) and by mouse/`selectByVisibleText`, the select reads the derived preset; `data.json` is unchanged; no Notice, no console error; keyboard focus stays on the select; a following ArrowUp/ArrowDown from there behaves sanely (e.g. from Steel card, End → snaps to Steel card; is the user now stuck unable to reach Index card by keyboard? report what happens).
- Derived-`custom` state (twiddle one member, e.g. statblock density): the dropdown reads Custom, a Custom pick writes nothing; picking a real preset from Custom applies it.
- Does `DropdownComponent.setValue` fire `onChange` (recursion / double write)? Check Obsidian's implementation (the vendored `obsidian` types / app bundle) or measure.
- Is there any path where the snap-back value is stale (prefs changed by another settings row since render; `this.update()` re-render racing the handler)?
- Tests: are the new jsdom tests non-vacuous? Revert the fix (temporarily) and confirm they FAIL with a meaningful message, and that the e2e SET-D16 FAILs too; restore. Check the e2e marker flip follows the file's convention (no bracketed ticket id in the title, scenario id unchanged).
- CHANGELOG bullet: plain, user-facing, under `## Unreleased`, accurate.
- Scope: nothing outside `renderPresetControl` + tests + CHANGELOG changed.

Gates to re-run yourself: `npm run tsc`, `npm run lint`, `npx jest` (expect 13389 + the new tests passed / 2 skipped without a shots cache, or +1 / 1 with it; 0 failed), and e2e for the settings specs (`npm run e2e -- --element=settings` if supported, else `--only=` the SET-D* ids). A full e2e / lifecycle re-run is not required of you unless something you see casts doubt on the implementer's numbers.

## 3. Footguns

- Devbox: `devbox run -c <abs plugin dir> -- bash <abs script file>`; never `cd X && …` in a compound command; never trust an echoed `$?` inside `bash -c`; never pipe a gate into `tail`. Write scripts with the Write tool.
- `git -C <absolute path>` for every git command.
- Private scratch subfolder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc651-r2-review/`, uniquely named files.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad, and no `rm` with a variable path.** Leave throwaway files in place. (Before jest, the literal `rm -f /home/scott/code/steelCompendium/worktrees/sc651-preset-custom/draw-steel-elements/main.js /home/scott/code/steelCompendium/worktrees/sc651-preset-custom/draw-steel-elements/styles.css` is fine.)
- Never `pkill`/`killall` by pattern; kill only a PID whose `/proc/<pid>/cwd` is in this worktree.
- Never key a wait-loop on a scratch filename or its contents. Redirect long output to files. No background gates or Monitor; a call over 180 s gets backgrounded — poll with `timeout 175 tail --pid=<your pid> -f /dev/null` in a foreground call, then read the log.
- Known e2e flakes: SET-X03 / SET-X04 (SC-657), INIT-W10 (SC-654) — re-run before believing.
- Never push anything to origin.
- You cannot `SendMessage` me. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. If you ever message anyway, the first word must be `SC-651:`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc651-preset-custom/sc651-r2-review-report.md`,
opening with a ≤10-line executive summary (verdict: LAND / FIX FIRST, finding counts by severity,
gate numbers you measured). Body: findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line,
the failure scenario, and a prescribed fix; then each probe and its measured result. If the write is
blocked, return the report inline.

## 5. Return contract

Final text: raw facts — verdict, finding list (severity + one line each), measured numbers, and the
absolute path of every artifact (report, logs, failure bundles).
