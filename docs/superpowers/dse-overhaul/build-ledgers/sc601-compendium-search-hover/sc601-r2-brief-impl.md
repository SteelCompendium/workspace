# SC-601 r2 brief: fix + landing tests

You are the r2 implementer for ticket SC-601. Your final text goes to the ticket-owner, not a human. **You never call the tracker (Linear)**: not to read history, not to post. Everything you need is in files. Assume you may be replaced by a fresh worker that reads only this brief and the files it names, so commit after every coherent step.

## 1. Context to load

1. Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc601-compendium-search-hover/decisions.md` (read "Owner rulings" carefully).
2. The r1 reproduction report: `.../sc601-compendium-search-hover/sc601-r1-repro-report.md` (same dir). Read the executive summary, the results table, and §6 "Where a fix would go" in full.
3. The r1 probe as a diff (already committed on your branch as `0da7e1d3`): `.../sc601-compendium-search-hover/sc601-r1-probe-0da7e1d3.diff`. It is the 19-minute PROBE version of `G-S97`. Reuse its helpers and setup (scratch notes, real Ctrl-hover, click into the preview to make it a source editor, opening the search, real CDP presses, reading the file on disk).
4. `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (about 320 KB; read in parts). Required: the battery order and current expected numbers (grep for "expected", "Baseline", "lifecycle", "e2e"), "Lifecycle and e2e notes" (~line 177-182), "Hover preview modals (SC-595)" (~line 405-412: the guard's design, the jest stand-in `test/dom/_hoverPreviewStandIn.ts`, the rule to write Obsidian's delays as literals, the G-S83 authoring footguns).
5. Product code: `draw-steel-elements/src/framework/kit/managedModal.ts` (`keepHoverPreviewAlive`, ~lines 220-229), `src/authoring/CompendiumSearchModal.ts` (`onOpen` ~95, `onChooseSuggestion` ~161), `src/authoring/compendiumInsert.ts` (the two commands ~355-375, `dispatchBlockChoice`).

## 2. Worktree

- Path `/home/scott/code/steelCompendium/worktrees/sc601-compendium-search-hover`; dse submodule `.../draw-steel-elements`, branch `sc601-compendium-search-hover`, HEAD `0da7e1d3` (parent `5f7c5336` = dse `origin/develop` when the round began). First: `git -C <dse abs path> fetch origin`; if `origin/develop` moved past `5f7c5336`, rebase onto it (run `npm ci` if `package.json`'s obsidian version changed) and say so.
- Verify `pwd` / `git -C <abs path> rev-parse --abbrev-ref HEAD` before any write. Use `git -C <absolute path>` for every git command; never `cd X; git ...`.
- The main checkout `/home/scott/code/steelCompendium/workspace` is shared: never edit there. Its dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault and expected; do not flag or touch it.
- **Workspace-level files (CHANGELOG.md) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc601-compendium-search-hover/CHANGELOG.md`, never under `/home/scott/code/steelCompendium/workspace/`.** Do not bump the superproject's submodule pointer (the dispatcher does that at landing).

## 3. The task

The owner's rulings, verbatim from the ledger:

> No Scott decision needed: the fix follows the landed SC-595 precedent (the plugin's own pop-ups keep the editing preview open). Fix = (1) SC-595 document click guard on `CompendiumSearchModal` when its target editor is inside a `.hover-popover`, both commands (`insert-compendium-reference`, `insert-compendium-block`); (2) choose-time check: if the captured editor is disconnected, show a Notice and write nothing; never re-target `activeEditor`.

> r1 follow-up "block command's choice after closure not driven": FOLD into r2 (the fix and the tests cover both commands).

> G-S97 lands as a SHORT assertion scenario (~8 trials) in lifecycle part 6 (after G-S92), not the 19-min probe.

Concretely:

1. **Guard.** Factor the SC-595 document click guard out of `managedModal.ts` into a shared helper (no behaviour change for `DseModal`: same bubble phase, `composedPath().includes(containerEl)`, `stopPropagation` and never `preventDefault`, removal one task after close) and install it from `CompendiumSearchModal` only when the target editor lives inside a `.hover-popover`. Pass the anchor from the two commands. Prefer public API to find it (`editorCallback`'s second argument; check what is typed vs runtime-only and say which you used and why). No keymap re-push and no `focusHoverPreviewNow` for this modal (r1 measured that the search is opened by a command/key with the preview already focused and that `T3` never fires; if your measurements disagree, stop and report NEEDS_CONTEXT).
2. **Backstop.** At choose time, for both the reference and the block choice: if the captured editor is no longer connected, show an Obsidian `Notice` (plain words, e.g. "The note you were editing in the preview was closed, so nothing was inserted.") and write nothing. Never fall back to `app.workspace.activeEditor`.
3. **Jest.** Follow the SC-595/SC-598 pattern (the stand-in `test/dom/_hoverPreviewStandIn.ts` or a window-bubble click spy; Obsidian's delays as literals). Cover: input press, box press, backdrop press each keep the preview (no hide) for a modal anchored in a preview; the backdrop still closes the search; a suggestion click still inserts; no guard for an editor outside a preview; the guard is gone one task after close; the disconnected-editor Notice path for BOTH commands writes nothing; the existing `DseModal` hover tests stay green unchanged (the refactor is behaviour-neutral). Then mutate: remove the guard install, use `preventDefault` instead of `stopPropagation`, remove the guard synchronously at close, drop the connected check, re-target `activeEditor`; each must be killed by at least one test. Log the mutants and results in the report.
4. **Lifecycle `G-S97`.** Replace the probe with a short assertion scenario, red on `5f7c5336`'s bundle and green on yours: about 8 trials, e.g. command opener x {input, box, backdrop} press then pick: preview still shown and `.is-editing`, the reference lands in the hovered note on disk; palette opener x input press; the block command x input press then pick (lands); a suggestion press (control, stays green); a pane control. Assert on outcomes, not just "no exception". Keep the scenario's own runtime so part 6 (`G-S92 G-S97`) stays under about 300 s total including build and start-up (G-S92 alone is about 100 s); report the measured part-6 time. Update the scenario's comment header (line ~192) so it no longer says PROBE and states the scenario count. SCENARIOS order: G-S97 after G-S92 and before G-S56; G-S56 stays LAST. Prove red on the base with dse-verify's footgun (9) recipe: `git archive 5f7c5336 | tar -x -C <scratch>`, symlink `node_modules`, `node esbuild.config.mjs production` there, then `DSE_LIFECYCLE_BUNDLE=<scratch> node visual-harness/obsidian-lifecycle.mjs --only=G-S97` from your worktree.
5. **e2e.** Check whether the e2e suite has a pair that covers the compendium search / insert commands and whether the coverage count must move; follow dse-verify. Never put a bracketed ticket id in a test title (the e2e runner reads titles for scenario ids).
6. **CHANGELOG.** One bullet under `## Unreleased` in the worktree superproject's `CHANGELOG.md`, plain user-facing words (e.g. clicking in the Compendium search no longer closes a hover preview you are editing, and a pick can no longer vanish silently). Commit it on the superproject branch.
7. **SKILL proposal.** Do not edit SKILL.md. Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc601-compendium-search-hover/sc601-skill-proposal.md`: ready-to-paste text for dse-verify covering the new G-S97, the jest counts, the mutants, the new lifecycle part 6 contents and time, and the four r1 "SKILL proposals" from the r1 report (verify each still holds).

## 4. Gates (dse-verify, full battery, in its order)

Run everything dse-verify requires to land a dse change: tsc, lint, jest, lifecycle in SIX `--only` parts, e2e, shots (with its in-run gates), freeze check, parity last. Expected at the base `5f7c5336` (yours should equal these except where your change adds tests):

- jest 7685 passed / 2 skipped (fresh worktree): yours = 7685 + your new tests, 2 skipped, 0 failed.
- lifecycle 58/58 in six parts: `G-S7a … G-S9a` 21; `G-S9b … G-S40` 16; `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` 9; `G-S57 G-S62 G-S61 G-S56` 4; `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S91` 7; `G-S92` 1. Yours: 59/59 with part 6 = `G-S92 G-S97` 2. Take the exact `--only` lists for parts 1 and 2 from dse-verify. Part 3 is at the ~480 s line and part 5 is full: add nothing to them.
- e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs` (known bugs SC-257, SC-355, SC-384, SC-580). Must end `0 failed` and `coverage: Y/Y pairs`.
- shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24. A change that moves frozen print bytes is unexpected here: if freeze moves, stop and report.

Running: run each gate as one blocking foreground call through a script file that captures the exit code inside the file: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc601-compendium-search-hover/draw-steel-elements -- bash /abs/path/to/your-gate-script.sh`. Devbox's wrapper eats `$?` in a `bash -c` string, in any quoting, and a pipe eats failures. Read each gate's own summary line as the truth. One lifecycle part per call. The Bash tool moves any call over 180 s to the background even with a long timeout: output to a log, then wait with `timeout 175 tail --pid=<pid> -f /dev/null` on YOUR OWN node pid (the one whose `readlink /proc/<pid>/cwd` is your worktree's `draw-steel-elements`), repeat until it exits, then read the log. Never wait for a notification that may not come.

## 5. Footguns (read every one)

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents: the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it: the 600 s stream watchdog kills silent agents.
- You cannot `SendMessage` me: a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report; I will resume you. If you ever do send a message anyway, its FIRST WORD must be `SC-601:`.
- Scratch: make a private subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc601-r2-<yourAgentId>/` and name every script and log uniquely inside it. Write scratch files with the Write tool, not heredocs.
- **Never `rm -rf` a `/tmp` glob** (every concurrent effort's lifecycle vault matches `/tmp/dse-obsidian-lifecycle-*`). Delete only a literal path you created and recorded, or that your own run printed. No `rm` with a shell-variable target (it hangs on a permission prompt). Never `rm -rf` anything under `.superpowers/`; delete only your own files there.
- Never `pkill`/`killall` by pattern (it kills other efforts' gates). Kill only by PID whose `/proc/<pid>/cwd` or command line is inside YOUR worktree.
- Never `cd` inside a compound command; use `devbox run -c <abs path>` and `git -C <abs path>`.
- Do not set a long `TMPDIR` (Obsidian exits at start-up); use `DSE_CAMERA_TMP` under your scratch folder for any camera run, on a private Xvfb.
- A fresh worktree's `node_modules` can be copied from the main checkout's `draw-steel-elements` (`cp -a`) if missing; then `npm run harness:build` and `npm run host-css` once before any harness probe.
- If `token-coverage.test.ts` goes red on a doc it reads, compare the worktree superproject's `docs/superpowers/dse-overhaul/D3-token-map.md` with the main checkout's copy before believing it; clear it with `DSE_TOKEN_MAP_PATH` pointed at the main checkout's copy. Not a code defect.

## 6. Report and return contract

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc601-compendium-search-hover/sc601-r2-impl-report.md`. Open with a ≤10-line executive summary: the dse branch sha, the superproject branch sha (CHANGELOG commit), every gate's measured number vs the expected one, G-S97 red-on-base / green-on-branch, and the part-6 time. Then: the design (anchor source, helper, choose-time check) with file:line, the jest tests added and the mutant table, the lifecycle trials and their outcomes, `Drive-by fixes:` and `Follow-ups:`.

Final text to me: raw facts only (verdict, shas, measured numbers per gate), plus the absolute path of the report, the SKILL proposal file, and every log or evidence artifact. No prose.
