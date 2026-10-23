# SC-478 r2 — implement (implementer): Live Preview scroll hold (L23) on develop 772c3cd

You are the implementer for ticket SC-478. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker (Linear)** — not to read history, not to post.

## 1. Context loading (read first)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc478-livepreview-scroll/decisions.md` — read fully. The section "Owner rulings on r1" is your spec; where this brief and the ledger disagree, the ledger's latest un-struck line wins.
- Design: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc478-livepreview-scroll/sc478-r1-design-report.md` (exec summary, §4 code shape, cost section). Prototype: `.../sc478-r1-prototype.patch` (made on `1c271b5`; 5 files). Probe and discrimination tooling (copy into your scratch subfolder, don't edit in place): `sc478-r1-run.sh`, `sc478-r1-build.sh`, `sc478-r1-build-variants.sh`, `sc478-r1-disc.sh`, `sc478-r1-probe-*.mjs.txt`, `sc478-r1-combine.py` in the same dir.
- Code: `draw-steel-elements/src/framework/host/previewScrollPin.ts` (the SC-470 Reading pin, whose conventions you follow), `LivePreviewBlockHost.ts`, `registerFrameworkElements.ts`, lifecycle `visual-harness/obsidian-lifecycle.mjs` (G-S8, G-S14, G-S15).
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — battery order, command shapes, the stale-`main.js` protocol, freeze rules.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc478-livepreview-scroll`. The dse clone is at `draw-steel-elements/`, on branch `sc478-livepreview-scroll` at `1c271b5`, with no commits of its own. The worktree superproject is on branch `sc478-livepreview-scroll` at `7e48d25`. Verify paths before every write.
- The main checkout's dse dirt (`demo-vault/Welcome.md` modified, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and expected. Never touch it or report it. You do not work in the main checkout at all.
- **Workspace-level files live in YOUR worktree's superproject:** `/home/scott/code/steelCompendium/worktrees/sc478-livepreview-scroll/CHANGELOG.md`. Never write anything under `/home/scott/code/steelCompendium/workspace/` except your report and logs in the ledger dir. Do NOT edit the workspace `dse-verify/SKILL.md`; you supply its text in your report instead.

## 2. Task

1. **Rebase first.**
   - `git -C /home/scott/code/steelCompendium/worktrees/sc478-livepreview-scroll/draw-steel-elements fetch origin`, then move the dse branch to `origin/develop`. That is `772c3cd` at dispatch (SC-457, SC-466 and SC-362 landed since `1c271b5`). If develop has moved further, use the newer sha and report it.
   - `git -C /home/scott/code/steelCompendium/worktrees/sc478-livepreview-scroll fetch origin` and rebase the superproject branch onto `origin/main` (`8f914ec` at dispatch).
   - Run `npm ci` in the dse dir if `package.json` / `package-lock.json` changed since `1c271b5`, or if `node_modules` is missing.
2. **Apply the prototype** (`git apply --3way` or by hand).
   - Expect contact in `visual-harness/obsidian-lifecycle.mjs`: SC-457 added G-S14 and SC-362 touched `visual-harness/`. Keep every other scenario whole and re-apply only the G-S18 hunks. Keep G-S18 in its own block after the last scenario.
   - Re-check `registerFrameworkElements.ts` placement against the new develop.
3. **Owner folds**, quoted verbatim from the ledger:
   - "**FOLD into r2 — capture identity hardening:** a capture must only be consumed by a transaction for the same file it was taken for (record the path; drop the capture if the view's file changes / a different file loads into the leaf), so a leaf that navigates within the window can never get another note's snapshot. Keep it transaction-bound (no TTL on the capture itself — SC-472 latency would race it), but bound its lifetime by the file-identity guard and by the existing "any non-`set` doc change consumes it" rule."
     Measure first how Obsidian loads a different file into an LP leaf: is it a `set` transaction on the same EditorView, a state replace, or a new view? Make the guard match what you measure, and say what you measured.
   - "**FOLD into r2 — mutation-check the jest suite** (each guard: user-scroll drop, non-set consume, path/mode filter, no-DSE skip, hold release, file-identity guard must each have a test that fails when that guard is removed)." Report one line per guard: the mutation made, and the test that went red.
   - "**`userEvent "set"` dependency risk → ACCEPT**, document in the header; G-S18 catches a change."
   - Docs, from the ledger: "`livePreviewScrollHold.ts` header carries the mechanism + measurements; `previewScrollPin.ts` "Not covered (SC-478)" line → pointer; CHANGELOG `## Unreleased` bullet in the worktree superproject."
     The CHANGELOG bullet is one plain sentence a user understands: Live Preview no longer jumps when a tracker in the note changes from another pane, a popout, your own click, or an outside write (Sync, git, another plugin). Follow the style of the SC-470 bullet that sits near it.
4. **Commit after every coherent step**: rebase/apply, then folds, then tests, then docs. Use `fix(SC-478): …` / `test(SC-478): …` / `docs(SC-478): …` messages in the dse repo, and `docs(changelog): SC-478 …` in the superproject. Use normal commit messages and do not push. **Do not commit the superproject's `draw-steel-elements` pointer**; leave it unstaged, because the dispatcher bumps it at landing.
5. **Discrimination** (2/2 each, `--only=G-S8,G-S15,G-S18`):
   - the base `772c3cd` bundle: G-S18 FAILs;
   - your head: all three ok;
   - control "restore never dispatched": G-S18 FAILs;
   - control "no hold": G-S18 FAILs.
   Build each control as a temporary bundle variant (r1's `build-variants.sh` approach), and revert every temporary edit.

## 3. Gates — full battery on your final head, in dse-verify order

Expected numbers (develop `772c3cd` baselines plus your change):

| gate | expected |
|---|---|
| tsc (incl. `tsc -p e2e`) | clean |
| lint (incl. `e2e/`) | clean |
| jest (`rm -f main.js styles.css` in the plugin root first) | 5536 + your new tests passed / 1 skipped / 234 of 235 suites. Your new suite adds one. A fresh worktree without the shots cache reads one fewer passed and 2 skipped; compare only after a shots run, or say which one you got. |
| lifecycle | `OBSIDIAN-LIFECYCLE done: 32/32 ok, 0 failed` (31 + G-S18) |
| e2e | `OBSIDIAN-E2E done: 89/93 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs` |
| shots | 580, 0 FAIL |
| freeze | `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc478-livepreview-scroll/draw-steel-elements/visual-harness/shots` reads `freeze OK (280/280 …)`. Never edit the baseline. |
| parity (last) | 0 GAPs / 0 undeclared / 24 DECLARED |

If any number differs, stop and diagnose before claiming green. Footgun: a stale worktree superproject pin can produce phantom doc-reading test failures. Compare the doc copies before believing one.

## 4. Rules / footguns (each cost real time once)

- **Private scratch subfolder**: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc478-r2-<yourAgentId>/`. Every agent shares the scratchpad, so never use generic script names in its root. Write scripts and scratch files with the **Write tool**, not heredocs.
- Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc478-livepreview-scroll/draw-steel-elements -- <cmd>`, or a wrapper script file that `cd`s itself, run as `devbox run -c <that dir> -- bash <abs script path>`. **Never put `cd` inside a compound command.** Use `git -C <absolute path>` for every git command. **One gate per Bash call.**
- **No glob `rm`**, ever (not in scratch, not `/tmp/dse-obsidian-lifecycle-*`). Delete only exact paths you created and recorded. Never `rm -rf` anything under `.superpowers/`.
- Kill only by PID, and only a PID whose command line contains `worktrees/sc478-livepreview-scroll/` (`pgrep -af "worktrees/sc478-livepreview-scroll/"`). Never `pkill`/`killall` by pattern: other efforts run the same gates concurrently.
- Set your own `DSE_LIFECYCLE_PORT` (e.g. 9379) and stay off Xvfb `:1`.
- Devbox's `sh` wrapper eats `$?`/`$PIPESTATUS`, and `| tail` eats failures. Run gates via wrapper script files that record the exit code to a per-run file, with output redirected to a log in your scratch subfolder, never streamed. The 600s stream watchdog kills silent agents.
- **Run every gate in the FOREGROUND** with a long timeout. Do not background a run and wait for a notification: a job you start does not wake you.
- Never key a wait-loop on a scratch filename or its contents. The scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- You cannot `SendMessage` me. A depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question. If you ever do send a message anyway, its FIRST WORD must be `SC-478:`.
- If the report-file write is blocked by your harness, return the report inline.
- Out of scope: SC-472 (`PIN_TTL_MS` unchanged), SC-479 (embeds), SC-491 (tracker mount cost), and `sidebar/registration.ts` (SC-471 in flight). Report anything else you find as `Follow-ups:`, and do not fix it. `Drive-by fixes:` are allowed only if obviously correct, local to a file you touched, and unable to move a gate baseline.

## 5. Outputs (ledger dir: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc478-livepreview-scroll/`)

- `sc478-r2-implement-report.md`, which **opens with a ≤10-line executive summary**: dse head sha + base sha, superproject head sha + base, every gate number, the discrimination table, the mutation-check lines, and the file-identity measurement. Body:
  - deviations from the prototype and why;
  - the exact proposed text for the workspace `dse-verify/SKILL.md` (lifecycle row 32/32 with G-S18; a G-S18 entry naming its control);
  - `Drive-by fixes:` / `Follow-ups:`.
- Logs under your scratch subfolder or the ledger dir with the `sc478-r2-` prefix. List every path.

## 6. Return contract

Final text: raw facts, no prose. Give the verdict, the shas, every measured number, the discrimination counts, both porcelain states (dse and superproject; ` M draw-steel-elements` is the expected unstaged pointer), and the absolute path of every artifact you produced.
