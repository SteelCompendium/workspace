# SC-520 r1 implementer brief — reproduce, survey, fix: chrome panel buttons of a DSE block at the top of a callout in Live Preview

You are the r1 implementer for Linear ticket SC-520. Your final text goes to the SC-520 ticket-owner, not a human.

## 1. Context loading (read first, in this order)

1. Ledger (current-state rulings; read instead of any ticket thread):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc520-lp-callout-menu-click/sc520-decisions.md`
2. Precedent (SC-502, landed today; this ticket is its Follow-up 3). Read executive summaries first, bodies where needed:
   - `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc502-lp-stamina-menu-click-ledger.md`
   - `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc502-lp-stamina-menu-click/sc502-r1-impl-report.md` (mechanism, survey method, line 30 = this bug)
   - `.../sc502-lp-stamina-menu-click/sc502-r1-review-report.md` and `sc502-r3-rebase-report.md` (HIGH-1 `display: flow-root` + widget-height check; MEDIUM-1 CDP pointer press instead of WebDriver click, because the default click flaked under load)
   - SC-502's probe sources are reusable (read-only; copy what you need into YOUR folder): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc502-r1-impl-x7q2/` (`mkprobe.sh`, `probe-*.js`, `g-*.sh` gate scripts).
3. SC-502's code, now on develop: the Live Preview clip rule in `draw-steel-elements/styles-source.css` (Element chrome section), `test/dom/framework/chromeLivePreviewClip.test.ts`, lifecycle G-S44 in `visual-harness/obsidian-lifecycle.mjs`, e2e `e2e/specs/stamina-bar/chrome-live-preview.e2e.ts` (CHR-L01).
4. Callout writes precedent (blocks inside callouts already save): `.../build-ledgers/sc455-callout-write-ledger.md`.
5. Gates: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (whole battery, order, command shapes, freeze/parity rules). Also `draw-steel-elements/AGENTS.md` in your worktree.

**Workers never call the tracker (Linear)** — not to read history, not to post. Everything you need is in files.

## 2. Worktree

- Path: `/home/scott/code/steelCompendium/worktrees/sc520-lp-callout-menu-click` — every submodule on branch `sc520-lp-callout-menu-click`.
- dse (`draw-steel-elements`) branch is at `c558759` = `origin/develop`. Superproject at `5902c18` = `origin/main`. Before starting: `git -C <worktree>/draw-steel-elements fetch origin` and confirm `origin/develop` is still `c558759`; if it moved, rebase onto it and note the new sha (the target numbers below are for `c558759`).
- Verify every write path is under the worktree. **Never write in `/home/scott/code/steelCompendium/workspace/`** except the ledger dir report file below. Workspace-level files (CHANGELOG.md, DESIGN.md) live in YOUR worktree's superproject: `/home/scott/code/steelCompendium/worktrees/sc520-lp-callout-menu-click/CHANGELOG.md` — never under `/workspace/`.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore it.
- Commit after every coherent step (tests first, then fix). Do not push, do not bump the superproject pointer, do not land. **Never create a tag or release.**

## 3. The task

Spec (ticket, verbatim): "when a DSE block with a menu panel (for example `ds-stamina-bar`) is the first thing inside a `> [!note]` callout, a real mouse click on the panel's buttons lands on the callout title (`div.callout-title`) instead of the button. Same before and after the SC-502 fix." Expected: "the panel's buttons are clickable with the mouse, as in Reading view."

Owner rulings (verbatim from the ledger):

> FIX RULE (carried from SC-502's, adapted).
> - Goal: in Live Preview, a real mouse click at the visible centre of every chrome-panel button (Edit pencil, Collapse/Expand, Pin, any other) of a DSE block that is the FIRST thing inside a callout reaches that button (`elementFromPoint` at the centre returns the button or its child) and does what Reading view does. The click must not open the callout's source, toggle a foldable callout, or move the editor cursor.
> - Obsidian's own controls on the callout (its `</>` edit-block button, the fold chevron of a foldable callout, the title) must stay reachable by mouse.
> - Prefer a fix that moves NO pixels of the callout or the block (stacking / clip lifting): shots and frozen bytes unchanged, SC-169 placement kept. As on SC-502, the panel becoming visible where it was clipped before is allowed (it is Scott's approved Reading-view position).
> - If no pixel-neutral fix works and the panel must move, the callout title must move, or the block must grow, STOP with NEEDS_CONTEXT plus before/after crops: a visible change goes to Scott.
> - Fix in SHARED chrome code (styles-source.css "Element chrome" section, next to the SC-502 rule) so every chrome element is covered.

> SURVEY first, on base `c558759` in real Obsidian 1.15 Live Preview AND Reading view: every chrome element as the first thing in a callout. Cases: `> [!note]` with default title; custom title text; foldable `[!note]-` (expanded via `+`) ; plain `>` blockquote first line; nested callout (`> > [!note]` first thing); block second in a callout (text above, regression check); collapsed one-liner (Expand) at the top of a callout vs the callout's `</>` button. Report hit-test per button. Elements a shared fix covers are in scope; if an element needs its own code, stop with NEEDS_CONTEXT and the table.

> Tests: a real-mouse test in real Obsidian Live Preview (CDP pointer press at the button centre, not `.click()`) that FAILS on base: extend e2e CHR-L01's pattern or add lifecycle **G-S49** (justify). Plus jest where it adds value (CSS rule present).

Steps:

1. **Reproduce** on base in real Obsidian 1.15 Live Preview (the lifecycle/e2e harness Obsidian; SC-502's probe approach): stamina bar as the first thing in `> [!note]`, panel revealed, `elementFromPoint` + `elementsFromPoint` at each button centre, and a CDP press/release: what happened (callout source opened? cursor moved? nothing?).
2. **Mechanism**: find the actual cause — clip (`contain`/`overflow` on `.cm-callout` / `.callout` / `.callout-content`), stacking (`.callout-title` painting over the panel), or the callout's `</>` button (`.edit-block-button`) overlapping the panel's top-right. Read the live computed styles and host stylesheet rules, and test hypotheses by injecting CSS on the live page, as SC-502 r1 did. Also check what the SC-502 rule's selector (`.cm-content > .cm-preview-code-block.cm-embed-block:has([data-dse-chrome])`) does and does not match inside the callout widget.
3. **Survey** (table, base and fixed): rows = case x element; columns = panel top vs callout-title bottom, hit element per button, Reading-view result for the same case. Cover every element that mounts a chrome panel (SC-502 found 20 types / 171 buttons at the top level; reuse its enumeration).
4. **Fix** per the FIX RULE. Watch for SC-502's HIGH-1 trap: if you lift a clip or containment, check the widget height CodeMirror records equals the on-screen height (margins escaping), and that clicks just below the callout land where they should. Keep Obsidian's callout `</>`, title, and fold chevron reachable — hit-test them after the fix.
5. **Tests** that fail on base and pass on the fix (record both runs' logs). If lifecycle: scenario id **G-S49**. If e2e: use a CDP pointer press, not WebDriver `.click()` (SC-502 MEDIUM-1). Jest for the CSS rule if it adds value.
6. **Docs**: CHANGELOG.md `## Unreleased` bullet in the worktree superproject (user-facing, plain words); one clause in DESIGN.md's chrome-panel Live Preview note if the rule changes; inline comment on the CSS.

Expect a rebase touch-point later: SC-526 (Recoveries popover styling) is in flight in `styles-source.css`. Keep your change localised to the Element chrome section.

## 4. Gates (dse-verify skill, full battery, in its order)

Expected at `c558759` + your work:
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean
- jest **6105 + your new tests passed / 1 skipped / 247 of 248 suites** (248 of 249 if you add a suite). Compare only after a shots run has cached `visual-harness/dist/obsidian-app.css`.
- lifecycle **39/39** (40/40 with G-S49)
- e2e **`OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`** (+ your new tests / pairs)
- shots **592**, 0 FAIL, button host-leak 114/684
- freeze **`freeze OK (280/280 …)`** — no rebaseline. If frozen bytes move, STOP (NEEDS_CONTEXT) with `rebaseline.txt` + before/after crops; never touch the shared baseline.
- parity **0 GAPs / 0 undeclared / 24 DECLARED** (last)

## 5. Shell rules (each has hung or wrecked a worker before — follow exactly)

- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc520-r1-impl-<4 random chars>/`. Unique script/log names inside it. The scratchpad is shared by every agent; never write a generic name at its top level.
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc520-lp-callout-menu-click/draw-steel-elements -- bash <script file>` — never `cd` inside a compound command, never `cd X && devbox …`.
- Record exit codes from inside a script file (`echo rc=$? > <unique file>`), never from a `bash -c '…; echo rc=$?'` one-liner (always records 0). Never pipe a gate (`| tail`); redirect to a log file and read the summary line.
- One blocking foreground Bash call per gate (split lifecycle / e2e / shots into separate calls; use timeout 600000). **No `run_in_background`, no Monitor, no background jobs.** Redirect long output to files — the 600s stream watchdog kills silent agents.
- `git -C <absolute path>` for every git command.
- Use the Write tool to create scratch files (not heredocs into scratch).
- **No `rm` with a shell-variable target** (`rm -f $X/…` hangs on a permission prompt). No glob `rm`. Never `rm -rf` a `/tmp` glob (other efforts' lifecycle vaults match) and never touch `.superpowers/` outside your report file. Overwrite with `>` or use fresh unique names.
- Never `pkill`/`killall` by pattern. Kill only a PID whose command line contains `worktrees/sc520-lp-callout-menu-click/` or whose `readlink /proc/<pid>/cwd` is inside the worktree.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.

## 6. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc520-lp-callout-menu-click/sc520-r1-impl-report.md`. It must open with a ≤10-line executive summary (STATUS, shas, mechanism in one line, fix in one line, survey totals base/fixed, gate numbers, anything needing the owner's eye). Then: base reproduction, mechanism evidence, survey table, fix, tests (base FAIL / fix PASS log paths), gates, `Drive-by fixes:`, `Follow-ups:`, and an artifacts list with absolute paths. Include before/after crops (Live Preview, panel revealed, block at the top of a callout) as PNGs in your scratch folder and name the 1–2 deciding ones.

If the report-file write is blocked by your harness, return the report inline.

## 7. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — STATUS (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED), dse and superproject shas, measured gate numbers, survey totals — no prose, plus the absolute path of every evidence artifact (report, logs, crops).

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see your completion notification and will resume you with the answer. If you ever do send a message anyway, its FIRST WORD must be `SC-520:`.
