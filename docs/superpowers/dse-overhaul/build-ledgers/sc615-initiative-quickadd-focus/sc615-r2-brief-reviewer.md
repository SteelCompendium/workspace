# SC-615 r2 — independent reviewer brief

You are the independent reviewer for SC-615. You did not write this change. Your final text goes to the ticket-owner, not a human.

## 1. Context loading

- Read FIRST: the effort ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc615-initiative-quickadd-focus/decisions.md` (ticket text, owner rulings = the spec), then the implementer's report `sc615-r1-impl-report.md` in the same dir (summary first; body only where you need it).
- Prior art: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc609-roster-click-focus-ledger.md`, `sc614-conditions-mouse-remove-focus-ledger.md`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc615-initiative-quickadd-focus`, branch `sc615-initiative-quickadd-focus`. Review dse `8be8ec1d` on develop `506786cb` (diff: `git -C <worktree>/draw-steel-elements diff 506786cb..8be8ec1d`), superproject `c44158f8` on workspace origin/main `075b61e3`. First `git -C <worktree>/draw-steel-elements fetch origin` and say whether `origin/develop` moved. Do not commit to the branch; probes go in scratch copies or are reverted (`git -C … stash`/`checkout` of your own probe edits only) and the branch must end exactly at `8be8ec1d`, clean.
- **You never call the tracker (Linear).**
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected; ignore it.

## 2. The task — execute and probe, not just read

Check the change against the owner rulings in the ledger (quote them, do not paraphrase). In particular:

1. **Correctness of the rule.** Text box in the tracker focused → real mouse press on a roster cell → focus on the rebuilt pressed cell; focus not returned to the text box; focus outside the tracker → never pulled in. Probe in real Obsidian (the e2e harness) for Reading view and the pinned sidebar tracker, and observe Live Preview.
2. **The click shield's job is unchanged**: half-typed Malice quick-add amount and label survive the press; a half-typed editable stepper value is still committed by the blur exactly as before; other elements (not the initiative tracker) see no behaviour change from any framework touch.
3. **Per-press record**: no stale "focus was inside" leaks into a later press (press inside with focus in a box, drag off / release elsewhere, blur to body, then press a cell — must not pull focus in). Keyboard selection of a roster cell unchanged.
4. **Tests are not vacuous**: revert the fix (keep the tests) and show the new jest and e2e tests go red; mutate the key condition(s) and show a test kills each.
5. **Re-run the battery** on `8be8ec1d` per `dse-verify` (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`, ≈450 KB, read in parts: l.20-60 battery, "THE exit-code footgun", l.156 jest timeouts, l.195 lifecycle/e2e notes, l.1523 CURRENT numbers). Expected at base `506786cb`: tsc/lint clean · jest 11900 passed / 1 skipped with the shots cache (fresh: one fewer passed / 2 skipped) plus the new tests · lifecycle 64/64 in SEVEN `--only=` parts, one per Bash call (parts 1-2 id lists from the skill's lifecycle row; part 3 `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64`; part 4 `G-S57,G-S62,G-S61,G-S56`; part 5 `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91`; part 6 `G-S92,G-S96,G-S97,G-S99`; part 7 `G-S108,G-S112,G-S115`, ~200 s) · e2e `340/343 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` plus the new scenarios · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.
   - G-S91 FAIL is real unless it says the host was too slow after two re-runs. G-S115 (g) red with the "changed on disk first" Notice on a loaded host: one re-run of part 7; a red on the re-run, a quiet host, or any other G-S115 cell is real. G-S97 fail: first restore a dirty `demo-vault/.obsidian/appearance.json` (SC-622). Jest "Exceeded timeout" (30 s) is a real hang until proven otherwise.
6. Docs: CHANGELOG bullets (dse + the worktree's workspace copy) match the views actually measured.

Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, a failure scenario, and a prescribed fix. Verdict: LAND or NOT LAND.

Command-shape rules (each has cost real time):
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc615-initiative-quickadd-focus/draw-steel-elements -- bash <script file>`; never `cd` inside a compound command; `git -C <absolute path>` for every git command.
- Never trust an echoed `$?` inside `bash -c`; capture exit codes in a script file and read each gate's own summary line. Never pipe a gate into `tail`. Redirect long output to a log file.
- Run each gate as a blocking foreground call. Calls over 180 s are moved to the background by the Bash tool; wait with `timeout 175 tail --pid=<your own pid> -f /dev/null` (check `/proc/<pid>/cwd` is your worktree), then read the gate's own log. Never key a wait-loop on a scratch filename or its contents; write to per-run unique paths.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad**; leave throwaway files in place. The only allowed delete is the literal `rm -f main.js styles.css` inside the plugin root before jest. No `rm` with a variable path or a glob.
- Never `pkill`/`killall` by pattern; kill only a PID whose cwd is inside your worktree.
- Scratch: Write tool, private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc615-r2-review/`, uniquely named files.
- No tags, no pushes.

## 3. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc615-initiative-quickadd-focus/sc615-r2-review-report.md`, opening with a ≤10-line executive summary (verdict, counts by severity, your measured gate numbers). If the write is blocked, return it inline.

## 4. Return contract

Final text to the ticket-owner: raw facts — VERDICT, findings by severity with file:line, measured gate numbers, absolute paths of every artifact. You cannot `SendMessage` me; if you need input, end with STATUS: NEEDS_CONTEXT and the question. If you ever send a message anyway, its first word must be `SC-615:`.

## 5. Owner's specific questions (in addition to section 2)

- The fix is a capture-phase `pointerdown` listener on `root.ownerDocument` registered per mount. Probe: two trackers in one note, or a tracker in Reading view and the same note's tracker in the pinned sidebar at once — does one tracker's record ever affect the other? Is the listener removed on unmount/rebuild (no growth across N rebuilds)? Popout window: right document?
- The listener runs before the shield: confirm it is registered so that it truly runs before the shield's own pointerdown (capture on document precedes any root listener), and that it never calls preventDefault/stopPropagation or moves focus.
- The dse CHANGELOG edit removed SC-609's "Not covered … (SC-615)" line: check that is accurate, and that the new bullets name only the views measured (title-textarea claim limited to Reading view).
