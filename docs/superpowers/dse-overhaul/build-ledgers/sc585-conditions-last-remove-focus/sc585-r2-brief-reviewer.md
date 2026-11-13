# SC-585 r2 — independent review brief

## 0. Context loading

- Ledger (current state, overrides everything): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc585-conditions-last-remove-focus/decisions.md`.
- r1 brief: `.../sc585-conditions-last-remove-focus/sc585-r1-brief-implementer.md`; r1 report: `.../sc585-r1-implementer-report.md` (read its summary; verify its claims, do not trust them).
- **You never call the tracker (Linear).**
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc585-conditions-last-remove-focus`, plugin `.../draw-steel-elements`, branch `sc585-conditions-last-remove-focus`. Base dse `develop` @ `1f1ae442` (SC-612 landed after r1 was briefed; r1 was told to rebase onto it — confirm with `git -C <plugin> merge-base HEAD origin/develop`). Review the diff `git -C <plugin> diff 1f1ae442..HEAD` and the superproject's `CHANGELOG.md` change. Every git command is `git -C <absolute path>`. Do NOT commit to the branch; you are reviewing. If you need a scratch edit (e.g. revert-the-fix probe), do it with `git -C <plugin> stash` and restore, or in a separate `git worktree add` at an absolute path under your scratch folder — and leave the branch exactly as you found it (`git -C <plugin> status` clean, same HEAD) at the end.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (~400 KB; read "The battery, in order", lines ~20-220, and the CURRENT numbers entry ~line 1478).

## 1. What to review

The owner ruling (ledger, 2026-11-13, verbatim):
> **Fix shape** — when a removal empties the list while the Add search is open, the search stays open and keyboard focus goes to the search's input (`.dse-condal__input`); its typed text is kept. When the search is closed, behaviour is unchanged (focus "+ Add condition"). Removing a non-last condition is unchanged (focus the row that shifted in / the previous row's cog). Sweep every other path that focuses `.dse-condal__add` and apply the same rule wherever it can run with the search open.

Execute and probe, don't just read:
1. Correctness of `src/views/ConditionsModal.ts` changes; did the sweep miss any focus site that can run with the search open (grep `dse-condal__add`, `focus(`)? Any path left that can drop focus to `<body>` in this window after a removal (mouse click on trash with search open, Delete/Backspace keys if any, removal from inside the row editor, SC-580 routed-key search + Escape after the returnFocusEl control was removed)?
2. ARIA state after the list empties with the search open: `aria-expanded`, `aria-activedescendant` pointing at a live node or absent, the menu contents.
3. Tests: does the flipped jest marker and each new test fail without the fix (revert `src/` only and run them)? Are they vacuous? Does the new e2e test drive real keys (Shift+Tab, Enter) and assert the activeElement is the input and the note lost the condition? Check its title has no bracketed ticket id and its scenario id is unique.
4. Re-run: tsc, lint, jest (full), and `npm run e2e` (full) yourself. Lifecycle: re-run part 1 (`--only=G-S7a,G-S7b,G-S6a,G-S6b,G-S6u,G-S28,G-S5n,G-S1,G-S2,G-S3,G-S4,G-S5,G-S6c,G-S6d,G-S6e,G-S6f,G-S6g,G-S6h,G-S6i,G-S8,G-S9a`, 21) — it holds G-S1, the ConditionsModal lifecycle scenario. Trust the implementer's other parts unless the diff touches the write path. Expected at base `1f1ae442`: jest 11788 passed / 2 skipped (no shots cache); lifecycle 62/62 in seven parts (part 7 is `G-S108` alone), e2e `330/333 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` → branch adds k new e2e tests.
5. CHANGELOG bullet: user-facing, plain, accurate.

## 2. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc585-conditions-last-remove-focus/sc585-r2-review-report.md`, opening with a **≤10-line executive summary** (verdict LAND-READY / FIX-NEEDED, measured gate lines). Findings by severity (HIGH/MED/LOW/INFO) with file:line, failure scenario, and prescribed fix. If the write is blocked, return the report inline.

## 3. Return contract

Final text to the ticket-owner: raw facts (verdict, shas, numbers, finding list), plus absolute paths of every artifact (report, logs).

## 4. Footguns

- Devbox: `devbox run -c <abs plugin path> -- bash <script-file>`; never `cd` inside a compound command; record exit codes from a script FILE; read each gate's own summary line; never pipe a gate into `tail`.
- Scratch: your own subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc585-r2-rev/`, unique script/log names, files created with the Write tool.
- No `rm` with a variable or glob target. **Never `rm -rf` a `/tmp` glob** (other efforts' lifecycle/e2e vaults match). Never `rm -rf` anything under `.superpowers/`.
- **Never `pkill`/`killall` by pattern**; kill only a PID whose `/proc/<pid>/cwd` is inside this worktree.
- SC-622: the camera tool can leave `draw-steel-elements/demo-vault/.obsidian/appearance.json` dirty → G-S97 fails; `git -C <plugin> checkout -- demo-vault/.obsidian/appearance.json`. G-S91 flakes (SC-616) — re-run part 5 before believing it.
- The Bash tool moves calls over ~180 s to the background; then loop `timeout 175 tail --pid=<your node pid> -f /dev/null` (pid chosen by `/proc/<pid>/cwd`) and read the gate's OWN log. Never key a wait on a scratch filename from another run.
- Redirect long output to files — the 600 s stream watchdog kills silent agents.
- Stale `main.js`/`styles.css` in the plugin root can shadow sources for jest (dse-verify "Stale main.js").
- You cannot `SendMessage` me. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. If you message anyway, the first word must be `SC-585:`.
