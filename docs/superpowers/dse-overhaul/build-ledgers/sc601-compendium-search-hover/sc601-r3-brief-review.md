# SC-601 r3 brief: independent adversarial review

You are the r3 independent reviewer for ticket SC-601. You did not write this code or the probe. Your final text goes to the ticket-owner, not a human. **You never call the tracker (Linear)**: not to read history, not to post.

## 1. Context to load

1. Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc601-compendium-search-hover/decisions.md` (the "Owner rulings" are the spec).
2. r1 reproduction report `sc601-r1-repro-report.md` (same dir): executive summary and §6.
3. r2 implementation report `sc601-r2-impl-report.md` (same dir): read it, but verify its claims rather than trusting them.
4. `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (about 320 KB; read in parts): the battery and expected numbers, "Lifecycle and e2e notes" (~line 177-182), "Hover preview modals (SC-595)" (~line 405-412).

## 2. Worktree

`/home/scott/code/steelCompendium/worktrees/sc601-compendium-search-hover`, dse submodule on branch `sc601-compendium-search-hover` (HEAD = the sha in the r2 report; base `5f7c5336`). Review `git -C <dse abs path> diff 5f7c5336..HEAD` and the superproject branch's CHANGELOG commit. Do not commit to the branch. Use `git -C <absolute path>`; never `cd X; git ...`. For mutation work, use a scratch copy (`git -C <dse path> worktree add <your scratch>/dse-mut HEAD`, symlink `node_modules`) so the branch stays clean; remove that worktree with `git worktree remove <literal path>` when done. The main checkout `/home/scott/code/steelCompendium/workspace` is shared: never edit there; its dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault, expected.

## 3. The task: execute and probe, not just read

- **Behaviour-neutral refactor?** The SC-595 guard was factored into a shared helper. Prove `DseModal`'s hover behaviour is unchanged: run the SC-595/597/598 jest suites, re-run G-S83, G-S87, G-S91 (lifecycle part 5 `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S91`), and diff the helper against the old inline code line by line (phase, `composedPath`, `stopPropagation` without `preventDefault`, the one-task removal after close, nested-modal anchor inheritance).
- **Does the fix actually fix it in real Obsidian?** Run `--only=G-S92 G-S97` (part 6) on the branch and confirm the assertions are real (read the trial code: does each trial assert the preview is shown and `.is-editing` and that the text landed in the hovered note ON DISK?). Prove G-S97 red on the base bundle yourself (dse-verify footgun (9): `git archive 5f7c5336 | tar -x -C <scratch>`, symlink `node_modules`, `node esbuild.config.mjs production`, `DSE_LIFECYCLE_BUNDLE=<scratch> node visual-harness/obsidian-lifecycle.mjs --only=G-S97`). Re-run at least one closing trial 3+ times.
- **Edge cases to probe** (jest or real Obsidian, your call; say which): the search opened from a preview, then the preview closed by something else (mouse away / Escape on the preview / another hover) before the pick: is the Notice shown and nothing written, for both commands? The search opened from a NORMAL pane: no guard installed, no behaviour change. A popout window (`activeWindow` / `containerEl.doc`): does the guard bind to the right document? The Live Preview host vs Reading-view host. Does the guard leak (listener count before/after many opens)? Does the block command's insertion path reach the same connected check? Can the choose-time check fire a false Notice for a live editor (e.g. a CM6 editor that is connected but in a pane that was re-rendered)?
- **Tests have teeth?** Re-run the r2 mutants in your scratch copy, add your own (at least: the guard installed for every search modal; the anchor taken from `activeEditor` at choose time; the Notice shown but the text still written; the connected check on the wrong object). Report killed/survived.
- **Gates:** confirm the r2 report's numbers by re-running jest (full) and lifecycle parts 5 and 6 yourself. You need not re-run e2e/shots/freeze/parity unless the r2 report's numbers are off from the expected ones in the ledger, or the diff touches anything they cover.

## 4. Running gates

One blocking call per gate through a script file that captures the exit code inside the file: `devbox run -c <dse abs path> -- bash /abs/path/your-script.sh`. Devbox's wrapper eats `$?` in a `bash -c` string; a pipe eats failures; read each gate's summary line. The Bash tool backgrounds any call over 180 s: output to a log, then wait with `timeout 175 tail --pid=<pid> -f /dev/null` on YOUR OWN node pid (its `readlink /proc/<pid>/cwd` is your worktree), repeat, read the log. Never wait for a notification that may not come.

## 5. Footguns

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents: stale logs from other branches match. Read the process's own output or a per-run unique path.
- Redirect long-running output to a file: the 600 s stream watchdog kills silent agents.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher, not me. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. If you ever message anyway, the first word must be `SC-601:`.
- Scratch: private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc601-r3-<yourAgentId>/`, unique script/log names, files written with the Write tool.
- **Never `rm -rf` a `/tmp` glob** (other efforts' lifecycle vaults match `/tmp/dse-obsidian-lifecycle-*`); delete only literal paths you created or your run printed. No `rm` with a shell-variable target. Never `rm -rf` anything under `.superpowers/`.
- Never `pkill`/`killall` by pattern; kill only PIDs whose cwd or command line is inside your worktree or scratch.
- Never `cd` inside a compound command. No long `TMPDIR` (use `DSE_CAMERA_TMP`).
- Never put a bracketed ticket id in a test title.

## 6. Report and return contract

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc601-compendium-search-hover/sc601-r3-review-report.md`. Open with a ≤10-line executive summary: verdict (LAND-READY / FIX REQUIRED), counts by severity, the gate numbers you measured. Then findings by severity (HIGH / MEDIUM / LOW / INFO), each with file:line, a failure scenario, and a prescribed fix; the mutant table; what you probed and how.

Final text to me: raw facts only (verdict, findings list with severity and file:line, measured numbers), plus the absolute path of the report and every log or evidence artifact.

## 7. Addendum after r2 (owner, 2026-11-12)

r2 landed at dse `ea849f11` (superproject `7199f0e6`). Its own follow-up, which the owner has folded into the next fix round, so judge it and prescribe the exact fix: "The check runs at choose time only. The block command awaits `entity.model()` afterwards, so a preview closed in that few-ms window would still write into the dead buffer." Also look for any other await between the check and the write on every choice path (reference, Shift inline link, block). r2's mutant runner and summary: `sc601-r2-mutate.py.txt`, `sc601-r2-mutants-summary.txt` (same dir). r2's new jest file: `draw-steel-elements/test/dom/authoring/compendiumSearchHoverPreview.test.ts`; shared helper `src/framework/kit/hoverPreviewGuard.ts`.
