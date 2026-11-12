# SC-609 r2 brief — independent reviewer

You review SC-609's r1 implementation. You did not write it. You never call the tracker (Linear).

## 1. Context loading

- Ledger (current truth; owner rulings quoted there): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc609-roster-click-focus/decisions.md`
- The implementer's brief and report in the same dir: `sc609-r1-brief.md`, `sc609-r1-impl-report.md` (read its executive summary and diagnosis; do not trust its claims — verify).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc609-roster-click-focus`, plugin at `…/draw-steel-elements`, branch `sc609-roster-click-focus`. Base: dse `develop` `231f2a3b` (check `origin/develop` after `git -C <abs> fetch origin`; if it moved, say so — do not rebase, that is the fix round's job). Diff: `git -C <plugin> diff 231f2a3b...HEAD` and the superproject's `git -C <worktree> log origin/main..HEAD`.
- Prior art (landed; ledgers in `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/`): SC-588 (`controlFocus.ts`), SC-603 (modal focus hand-back). Their behaviour must not regress.
- `dse-verify` skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (large; read "The battery, in order", "Devbox wrapping", "Lifecycle and e2e notes", "THE exit-code footgun", the CURRENT numbers entry).
- Do not edit the branch. Probes go in a scratch clone or as uncommitted temporary edits you revert with `git -C <abs> checkout -- <file>` (never `checkout -- .`), and the branch must be byte-identical to its HEAD when you finish.

## 2. The task — execute and probe, not just read

- Does the fix meet the owner rulings exactly (focus inside tracker + mouse press on a roster cell → rebuilt pressed cell focused; focus outside → unchanged from base)? Probe edge cases: press on the already-selected creature's cell; press on a cell whose creature is removed/reordered by the rebuild; focus on a different tracker control (e.g. a quick-add box, a roster cell) before the press; a press that starts a drag or a double-click (SC-603's double-click → Stamina modal path must still hand focus back per SC-603); keyboard selection paths unchanged; two trackers in one note / pane + embed (the focus must not jump to the other copy); the press inside a hover preview.
- Mutation-check the tests: remove or weaken the fix and confirm the new jest and e2e cases go red; confirm the negative case would catch focus being pulled in.
- Re-run the gates that matter yourself: jest (full), the new e2e spec(s) plus the full e2e, and lifecycle parts touching initiative focus at least (full lifecycle if time allows). State the numbers.
- Survey claim check: did the implementer's survey of other mouse-press rebuild paths miss any? List any it missed with file:line.

- Already ruled out of scope (do not re-raise as findings; mention only if the branch makes them worse): SC-614 (condition remove while Add condition is focused), SC-615 (roster press while a quick-add text box has focus; shield blurs at pointerdown), focus on a surviving control (Advance round) staying put on a roster press (SC-458 owns "a click moves focus to its target").

Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, a failure scenario for each, and a prescribed fix.

## 3. Expected numbers at base `231f2a3b`

tsc + lint clean · jest 10711 passed / 2 skipped fresh (10712 / 1 after shots) plus the branch's new tests · lifecycle 60/60 in six `--only` parts (ids in the SKILL) · e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs` at base, branch adds its own · shots 592 · freeze 280/280 · parity 0/0/24.

## 4. Footguns

- devbox: `devbox run -c <abs plugin path> -- bash -c 'cd <abs plugin path> && <cmd>'`; `git -C <absolute path>` always; never `cd` in a compound command.
- Never trust an echoed `$?` inside `bash -c`; gate last or a script FILE recording `rc=$?`; read the gate's own summary line; never pipe a gate into `tail`.
- `rm -f main.js styles.css` in the plugin root before `npx jest`. Timeout reds in load-sensitive suites: check `/proc/loadavg`, rerun alone.
- Scratch: private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc609-r2-review/`, unique names, Write tool for files.
- Never `rm -rf` a `/tmp` glob or the shared `.superpowers/` dir; no `rm` with a shell-variable path. Never `pkill`/`killall` by pattern — kill only a PID whose `/proc/<pid>/cwd` is in your worktree.
- Calls over 180 s are backgrounded by the Bash tool; run one lifecycle part / e2e per call, output to a unique log; wait on YOUR OWN pid (`timeout 175 tail --pid=<pid> -f /dev/null`) and read the log. Never end your turn waiting for a notification. Never key a wait on a scratch filename or its contents.
- Redirect long output to files (600 s stream watchdog).
- If a call would need a permission prompt, use another shape.

## 5. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc609-roster-click-focus/sc609-r2-review-report.md`, opening with a ≤10-line executive summary (verdict LAND / FIX-FIRST, counts per severity, gate numbers you measured). If the write is blocked, return the report inline.

## 6. Return contract

Final text to the ticket-owner, not a human: verdict, finding list (severity, file:line, one line each), measured numbers, absolute paths of every artifact. You cannot SendMessage me (`to: 'main'` reaches the dispatcher). If you need input, end with STATUS: NEEDS_CONTEXT and the question. If you ever message anyway, the first word must be `SC-609:`.
