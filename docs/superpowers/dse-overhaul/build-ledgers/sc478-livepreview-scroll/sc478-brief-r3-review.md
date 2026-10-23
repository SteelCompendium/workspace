# SC-478 r3 — independent adversarial review (reviewer): Live Preview scroll hold

You are the independent reviewer for ticket SC-478. You did not write this code. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker (Linear)**: you do not read its history and you do not post to it.

## 1. Context loading (read first)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc478-livepreview-scroll/decisions.md`. Read it fully. "Owner rulings on r1" is the spec the implementation must meet.
- Design: `.../sc478-r1-design-report.md` (exec summary, §4, cost). Implementation report: `.../sc478-r2-implement-report.md` (exec summary first).
- Probe tooling to reuse (copy into your scratch subfolder): `sc478-r1-run.sh`, `sc478-r1-build.sh`, `sc478-r1-build-variants.sh`, `sc478-r1-disc.sh`, `sc478-r1-probe-*.mjs.txt`, `sc478-r1-combine.py` in the ledger dir, plus whatever r2 lists.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc478-livepreview-scroll`. The dse clone is `draw-steel-elements/` on branch `sc478-livepreview-scroll` at **`b17b3cd`**, on develop **`54f8f88`**. The superproject is at **`f980513` (on origin/main `46ae296`)`**. First check `git -C <dse abs> rev-parse HEAD` and that `git status --porcelain` is empty. The superproject shows ` M draw-steel-elements`, which is the expected unstaged pointer. **Do not commit, amend, rebase or push anything.** Revert every temporary edit with `git -C <abs> checkout -- <file>`.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and expected. Never touch it or report it.

## 2. Task: execute and probe, don't just read

Review `git -C <dse abs> diff 54f8f88..b17b3cd` and the superproject CHANGELOG commit. Then prove or break the following in a real Obsidian 1.14.4 through the lifecycle harness:

1. **The fix holds.** Re-run `--only=G-S8,G-S15,G-S18` 2/2 on the head. Re-run both named controls ("restore never dispatched", "no hold"); each must FAIL G-S18. Confirm G-S18's tripwires are not vacuous: the widget really is rebuilt, and on stock the position really is lost.
2. **The user wins: drive it live**, which r1 and r2 tested only in jest. Use a real wheel/scroll (CDP `Input.dispatchMouseEvent` mouseWheel, or `scrollBy` from a scroll handler) at three moments:
   - (i) between `modify` and the `set` transaction;
   - (ii) during the hold, before the DSE view mounts;
   - (iii) right after the restore.
   The plugin must never move scroll the user made, and must never snap back after it.
3. **Identity.** Within the window after a `modify`, load a different note into the observed LP leaf: follow a link, and use the quick switcher. The new note must not receive the old note's snapshot or any hold. Also close the leaf mid-window, and close a popout mid-window: nothing may leak or throw. Check `releaseAll` on plugin disable while a hold is active.
4. **Typing and own edits.** Type in the observed LP pane inside a DSE note: in prose above the tracker, and inside the fence while it shows as source. Autosave fires `modify` for the typing pane's own file, so check for any jump, stuck hold, phantom height or restore. Use undo/redo after an external write.
5. **Non-DSE and Source.** A plain tall note, raw Source mode, and a note whose DSE block fails to render (bad YAML). Confirm nothing is captured or held, and that the error block does not hold forever.
6. **Height changes.** Write a change that grows the tracker by a row, and one that shrinks it. Check where the user ends up, and whether a hold at the old height leaves phantom space after the mount.
7. **Cost.** Capture/restore ms per view. Check whether the hold or the MutationObserver costs anything on a note with many DSE blocks (5+ trackers in one LP pane).
8. **Code review.**
   - Every listener and observer is registered or disconnected on unload.
   - It uses popout-safe windows (no global `document`/`window`).
   - The dispatch happens outside the update cycle.
   - The jest suite really fails when each guard is removed. Spot-check two mutations yourself.
   - The header comments match the behaviour.
9. **Gates.** Re-run tsc, lint, jest, lifecycle (expect 32/32), e2e (expect `95/98 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs`; base is develop 54f8f88 or newer — jest 5601 + new tests / 1 / 235 of 236). If r2's diff touched no CSS or render code, carry shots/freeze/parity from r2's report and say so. Otherwise re-run them (shots 580 incl. `text scale OK (1626 …)` and `text scale once OK (104184 / 208 loads …)` / freeze 280/280 / parity 0/0/24).

## 3. Rules / footguns (each cost real time once)

- **Private scratch subfolder**: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc478-r3-<yourAgentId>/`. Use the **Write tool** for scripts and scratch files, not heredocs. Never use generic names in the scratchpad root.
- Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc478-livepreview-scroll/draw-steel-elements -- <cmd>`, or a wrapper script run as `devbox run -c <that dir> -- bash <abs script>`. **Never put `cd` inside a compound command.** Use `git -C <abs path>` for every git command. **One gate per Bash call.**
- **No glob `rm`**, ever. Delete only exact paths you created and recorded. Never `rm -rf` under `.superpowers/`.
- Kill only by PID, and only a PID whose command line contains `worktrees/sc478-livepreview-scroll/`. Never use `pkill`/`killall`.
- Use your own `DSE_LIFECYCLE_PORT` (e.g. 9380), and stay off Xvfb `:1`.
- Devbox eats `$?`/`$PIPESTATUS`, and `| tail` eats failures. Run gates through wrapper files that record rc to a per-run file, with output redirected to a log and never streamed (the 600s watchdog kills silent agents).
- **Run every gate in the FOREGROUND** with a long timeout. A job you start in the background does not wake you.
- Never key a wait-loop on a scratch filename or its contents. Stale logs from other branches exist.
- You cannot `SendMessage` me, and `to: 'main'` reaches the dispatcher, not me. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. Any message you send anyway must start with `SC-478:`.
- If the report-file write is blocked, return the report inline.
- Out of scope, so do not report these as findings: SC-472 (`PIN_TTL_MS`), SC-479 (embeds), SC-491 (tracker mount cost). You may add a data point for any of them under Follow-ups.

## 4. Outputs (ledger dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc478-livepreview-scroll/`)

- `sc478-r3-review-report.md`. It **opens with a ≤10-line executive summary**: the verdict (APPROVE / REQUEST_CHANGES), finding counts by severity, and the gate numbers.
- Findings by severity (HIGH / MEDIUM / LOW / INFO). Each one gives file:line, the failure scenario with measured numbers, and a prescribed fix.
- Evidence files carry the `sc478-r3-` prefix. List every path.

## 5. Return contract

Final text: raw facts, no prose. Give the verdict, findings with file:line, measured numbers, gate lines, the porcelain state (it must be unchanged), and the absolute path of every artifact.
