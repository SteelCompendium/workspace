# SC-492 r1 implementer brief

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc492-stamina-pencil/sc492-decisions.md` — read it first.
- Background: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc483-form-save-defaults/sc483-r1-review-report.md`, section **INFO-1** only (lines ~18-22). It is the original observation of this bug in real Obsidian.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc492-stamina-pencil`. The plugin is at `/home/scott/code/steelCompendium/worktrees/sc492-stamina-pencil/draw-steel-elements`, branch `sc492-stamina-pencil`, at `e8f6a14` (= dse `develop`). Verify `pwd`/`git -C <path> branch --show-current` before any write. **Never write under `/home/scott/code/steelCompendium/workspace/`** except your report file in the ledger dir — that is the shared main checkout.
- Before starting: `git -C /home/scott/code/steelCompendium/worktrees/sc492-stamina-pencil/draw-steel-elements fetch origin` and confirm `origin/develop` is still `e8f6a14`. If it moved, rebase onto it and say so in the report.
- Read `draw-steel-elements/AGENTS.md` and the `dse-verify` skill (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`) before running any gate.
- **You never call the tracker (Linear)** — not to read history, not to post. Everything you need is in these files.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault. It is expected; do not touch or report it.

## 2. Task

Bug: with `experimental` + `authoringControls` on, clicking the "Edit Stamina bar" pencil (chrome item) on a `ds-stamina-bar` block opens the block edit form **and** the Stamina modal on top of it. Skills and roll pencils open only their form.

From the ticket (filed by Scott), verbatim:

> **Expected:** the pencil opens only the edit form.

> **Fix direction:** stop the click from reaching the bar for chrome items, or have the bar's handler ignore clicks from inside `.dse-chrome`.

Suspected cause (verify, do not assume): `src/framework/kit/StaminaBarPanel.ts:133` registers `click` on `bar`; the chrome anchor `.dse-stamina__cluster` sits inside `bar` (`src/elements/stamina-bar/view.ts:132`), so the pencil click bubbles to the bar handler.

Steps:

1. **Confirm the root cause** with a failing jest test first (TDD): pencil click on a mounted stamina bar must open the edit form and must NOT open the Stamina modal. Show it fails on base.
2. **Survey** (keep it short, report it in a few lines): which other elements have a container-level click/keydown handler whose subtree includes a chrome item (`.dse-chrome`)? Also check keyboard activation of the pencil (Enter/Space) — does the bar have a keydown handler that would also fire?
3. **Choose the fix and justify it in 2-3 lines.** Prefer a fix that protects every element that hosts chrome inside a clickable region, if the survey shows the risk is general — but do not break anything that relies on chrome clicks bubbling (e.g. Obsidian's own handlers). A guard in the bar handler (ignore events whose target is inside `.dse-chrome`) is acceptable if it is the safer choice. Either way, the Stamina modal must still open from a click anywhere else on the bar, by mouse and by keyboard — add a test proving that.
4. **Real-Obsidian regression.** The bug was only observed in real Obsidian. Add a regression check in the real-Obsidian suite that best fits existing conventions (the e2e suite `npm run e2e` or the lifecycle suite `npm run obsidian-lifecycle` — look at how authoring-controls / chrome are already covered). **If you add a lifecycle scenario, its id is G-S32.** It must fail on base `e8f6a14` and pass on your fix — prove both and record the base-failure output in your report.
5. **Do not touch `src/framework/**/FormModal.ts`** (SC-488 is editing it concurrently). If the fix seems to need it, stop and return STATUS: NEEDS_CONTEXT.
6. CHANGELOG: add one bullet under `## Unreleased` in **your worktree's** superproject file `/home/scott/code/steelCompendium/worktrees/sc492-stamina-pencil/CHANGELOG.md` (never `/home/scott/code/steelCompendium/workspace/CHANGELOG.md`). Plain words, user-visible effect, mention it is behind the experimental authoring controls. Look at neighbouring bullets for style. Commit it on the superproject branch `sc492-stamina-pencil` in the worktree.
7. Commit inside `draw-steel-elements` after every coherent step (test, fix, real-Obsidian check). Do not bump the superproject's submodule pointer and do not push — landing is not yours.

Drive-by fixes allowed only if obviously correct, local to a file you touched, and unable to move a gate baseline; list them under `Drive-by fixes:`. Anything else goes under `Follow-ups:` and is left alone.

## 3. Gates — full `dse-verify` battery, in its order

Expected numbers at `e8f6a14` (CURRENT block in dse-verify):

- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean
- jest **5743 passed / 1 skipped / 238 of 239 suites** — yours will be higher by the tests you add; report the exact delta. (On a fresh worktree jest reads one fewer passed and 2 skipped until `npm run shots` has run once — see dse-verify row 3; compare after shots.)
- lifecycle **31/31** (32/32 if you add G-S32)
- e2e **`OBSIDIAN-E2E done: 104/104 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`** (higher if you add an e2e test; must stay `0 failed`, coverage Y/Y)
- shots **592**, 0 FAIL
- freeze **`freeze OK (280/280 …)`** — no rebaseline expected; this fix must not move print bytes. If it does, stop and report.
- parity **0 GAPs / 0 undeclared / 24 DECLARED**

## 4. Command footguns (each has cost real time)

- Devbox: use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc492-stamina-pencil/draw-steel-elements -- <cmd>` (check dse-verify for exact shapes). **Never `cd` inside a compound command.** Use `git -C <absolute path>` for every git command.
- Exit codes: `echo rc=$?` inside `bash -c` under devbox always records 0. Record exit codes by running a **script file** via `devbox run -c <path> -- bash <script>`, and read each gate's own summary line.
- Write scripts/logs only in your private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc492-impl-r1/` (create it). Uniquely named files inside. Create scratch files with the Write tool, not heredocs.
- **No glob `rm`** anywhere (`rm -f x/*.rc`, `rm -rf /tmp/dse-obsidian-lifecycle-*` are forbidden). Delete only exact paths you created. Never touch `.superpowers/` outside `sc492-stamina-pencil/`.
- **Run every gate as one blocking foreground Bash call** — lifecycle, e2e and shots as separate calls, each under the 10-minute tool timeout. No `run_in_background`, no `Monitor`, no waiting for notifications. Redirect long output to a log file in your scratch folder rather than streaming it; then read the log.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains `worktrees/sc492-stamina-pencil/`, or whose `readlink /proc/<pid>/cwd` is inside the worktree.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is shared across sessions.
- `npm ci` if `node_modules` is missing or stale in the worktree.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc492-stamina-pencil/sc492-r1-impl-report.md`. It must open with a **≤10-line executive summary** (verdict, final sha, gate numbers). Then: root cause as confirmed, survey result, fix choice + justification, tests added (file:test name), base-failure evidence for the jest test and the real-Obsidian check, every gate's summary line, `Drive-by fixes:`, `Follow-ups:`.

If the report-file write is blocked by your harness, return the report inline.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), dse sha, superproject sha, measured gate numbers — no prose, plus the absolute path of every evidence artifact you produced (report, logs, any screenshots).

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` reaches the dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its first word must be `SC-492:`.
