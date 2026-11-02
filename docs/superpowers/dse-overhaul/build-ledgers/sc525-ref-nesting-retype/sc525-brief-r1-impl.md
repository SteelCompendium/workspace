# SC-525 round 1 — implementer brief (reproduce, fix, gate)

## 1. Context loading
- Ledger (read first, it is current state): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc525-ref-nesting-retype/sc525-decisions.md`
- Origin of this bug: SC-510 review INFO-1 (FU-1) in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc510-form-preview-stale-error/sc510-r2-review-report.md` (section "INFO-1 (FU-1)", ~line 49). Its jsdom probe is `sc510-r2-probe.test.ts.txt`, candidate-fix logs `sc510-r2-candidate-fixes.log` / `sc510-r2-candprobe-C3.log`, real-Obsidian probe kit `sc510-r2-obsidian-probe-kit.js.txt` + `sc510-r2-obsidian-probe-scenarios.js.txt` + log `sc510-r2-obsidian-probe-head-p2-fu1.log` — all in that same dir. Reuse them.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc525-ref-nesting-retype`; the plugin is `…/draw-steel-elements`, branch `sc525-ref-nesting-retype`, cut at `develop` @ `4deb8cf`. First: `git -C /home/scott/code/steelCompendium/worktrees/sc525-ref-nesting-retype/draw-steel-elements fetch origin develop` and rebase onto `origin/develop` (expected still `4deb8cf`; if it moved, rebase and say so). Verify `pwd`/paths before any write — never write under `/home/scott/code/steelCompendium/workspace/` except your report files in the ledger dir.
- **You never call the tracker (Linear)** — not to read history, not to post.

## 2. Task
The bug (ticket text): in the block edit form on a feature or statblock, the YAML box holds `@Ref.md` and its lookup has not finished. Type a key that leaves the same reference (e.g. a trailing space). The preview shows "Feature: failed to render (render) Reference nesting too deep — `@Ref.md` is already resolving in this block", and still shows it after the first lookup finishes, until the next keystroke.

Cause: `IN_FLIGHT_REFS` in `src/elements/shared/RefUnwrapView.ts` is keyed on blockKey + reference; the form preview's blockKey is the same every keystroke; an unloaded view does not release its entry; it is dropped only in the stale mount's `finally` (~229-231).

Steps:
1. **Reproduce first (RED).** Add jsdom tests (in the repo's existing test layout — put them next to `refUnwrapView.test.ts` or a new `test/...` file following conventions) that hold a reference lookup pending, re-render the same reference with the same blockKey (the form-preview shape: first view unloaded, second view mounted), and assert the second preview shows the resolved card and never the "Reference nesting too deep" text — both while held and after release. Cover **feature and statblock**. Run them on the unfixed tree and save the red output.
2. **Fix — exactly the ledger's decision (SC-510 candidate C3):** "`IN_FLIGHT_REFS` becomes a Map from guard key to owning view; refuse only when the owner is a different view that has not unloaded; delete in `finally` only if this view is still the owner; public `isUnloaded()` on ElementView reading its `unloaded` flag (NOT `_loaded` — that broke the `displayCardHybrid` depth-guard test)." Rejected: a per-render preview blockKey. Keep the diff small.
3. **Guard tests (must stay meaningful):** a genuine nesting cycle (A references B references A, and A self-reference) in one live block is still refused with the nesting error; the `displayCardHybrid` depth-guard test (d) stays green; two different live views in the same block resolving the same ref concurrently still behave as before (state what that is). Add a test that a stale (unloaded) owner's `finally` does not delete the new owner's entry. Run a mutation check: revert each half of the fix (the owner-unloaded check; the owner-only delete) and show which new test goes red.
4. **Real-Obsidian probe (evidence, not a gate):** adapt the SC-510 r2 probe kit to show the bug on the base bundle (`4deb8cf`) and its absence on your bundle, with a held lookup (hold at a hook — no timer races). Capture one screenshot on base (error shown) and one on head (card shown) of the form preview. Keep the probe scripts as `.txt` in the ledger dir.
5. Scope: stay in `RefUnwrapView.ts` / `view.ts` and tests. Do NOT touch block save / Reading-view redraw (SC-481) or Live Preview scroll hold (SC-522). Commit inside the plugin after every coherent step (red tests, fix, probe). No pointer bump in the superproject; no tags ever.

Report as **`Drive-by fixes:`** anything obviously correct you fixed in a touched file, and **`Follow-ups:`** anything you left alone.

## 3. Gates — `dse-verify` skill
Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` for command shapes and run the full battery in its order. Expected CURRENT (develop @ `4deb8cf`):
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean
- jest **6153 passed / 1 skipped / 248 of 249 suites** + your new tests (fresh worktree before a shots run: 6152 / 2 skipped) — report the exact delta
- lifecycle **41/41** as two `--only` halves (20 + 21), one half per Bash call
- e2e **`OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`**
- shots **592**, 0 FAIL, button host-leak 157/942 (34-record boundary), modal 228, input 15/176, checkbox 7/116, prose 106 [212]
- freeze **280/280** (no rebaseline expected; if anything moves, STOP and report — never touch the baseline)
- parity **0 GAPs / 0 undeclared / 24 DECLARED**

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc525-ref-nesting-retype/sc525-r1-impl-report.md`; logs/screenshots/probes as `sc525-r1-*` in that same dir. The report opens with a **≤10-line executive summary**.

## 5. Return contract
Your final text goes to the ticket-owner, not a human: raw facts — verdict, branch + commit shas, every gate's measured summary line, red→green test names, mutation results — no prose, **plus the absolute path of every evidence artifact** (report, logs, screenshots, probe scripts).

## Footguns (all mandatory)
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Run every gate as ONE blocking foreground Bash call — no `run_in_background`, no Monitor, no `&`. Lifecycle is two `--only` halves in two calls; e2e, shots, parity each their own call.
- Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc525-ref-nesting-retype/draw-steel-elements -- bash <script-file>`; never a compound `cd X && …`. Every git command is `git -C <absolute path>`. Record exit codes from a script file (the devbox wrapper eats `$?`), and read each gate's summary line.
- Never `rm` with a shell-variable or glob target; never `rm -rf` a shared `/tmp` glob or anything under `.superpowers/` other than files you created. Overwrite with `>` or use fresh unique names.
- Never `pkill`/`killall` by pattern. Kill only a PID whose command line contains your worktree path or whose `readlink /proc/<pid>/cwd` is inside your worktree.
- Scratch scripts go in a private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc525-r1-impl/` with uniquely named files (create them with the Write tool, not heredocs).
- `npm ci` if `node_modules` is missing or stale in the worktree.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-525:`.
