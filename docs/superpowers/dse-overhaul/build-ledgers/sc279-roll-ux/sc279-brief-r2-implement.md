# SC-279 round 2 — implement the roll-strip cleanup (implementer, Sonnet)

## Context loading
- Read FIRST: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/decisions.md` (Scott's ruling verbatim + owner decisions), then the spec `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/sc279-r1-survey.md` (§1–§5). The spec §4 as amended by the ledger's "Owner decisions after r1 survey" IS your task.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc279-roll-ux`. DSE submodule: `/home/scott/code/steelCompendium/worktrees/sc279-roll-ux/draw-steel-elements`, branch `sc279-roll-ux`, currently `f8693b5`. First: `git -C <dse> fetch origin && git -C <dse> rebase origin/develop` (expected: origin/develop is still `f8693b5` or a descendant; if it moved, rebase and note the new base sha). `node_modules/` and `visual-harness/dist/` already exist from round 1 (run `npm ci` again only if package.json changed on rebase).
- Verify `pwd`/paths before any write. Use `git -C <absolute path>` for every git command — never `cd X; git …`.
- Workspace-level files (DESIGN.md, CHANGELOG.md) live in YOUR worktree's superproject: `/home/scott/code/steelCompendium/worktrees/sc279-roll-ux/DESIGN.md` — NEVER under `/home/scott/code/steelCompendium/workspace/`. The only thing you write under `workspace/` is the ledger dir `.superpowers/sdd/sc279-roll-ux/` (sc279- prefixed files).
- You NEVER call the tracker (Linear) — not to read, not to post.
- Read `draw-steel-elements/AGENTS.md` and the dse-verify skill before starting.

## Scott's ruling (verbatim, from the ledger)
> I dont oppose this UI, but it needs to be more informative.  By default, I dont think many Directors will need the roll capability just because players are usually rolling these kinds of things, but maybe a player adds the `ds-roll` element or there is some reason the Director wants it - so Ill allow this.  That said, it should be minimal.  Maybe its just an icon by default that expands into the full UI
>
> The UI for making a roll in obsidian needs to be labeled better.  there are 6 value-change buttons, a toggle, an input field, a submit button, and a reset button and only the "Roll" submit button is clear in its functionality. Yes, there are tooltips, but its not very user friendly

## Task (spec §4 + ledger amendments)
Rework the shared kit `src/framework/kit/rollBar.ts` (+ its hosts `src/elements/roll/view.ts`, `src/elements/feature/rollController.ts`, CSS in `styles-source.css` via the repo's normal CSS pipeline) per spec §4.1–4.7:
1. Roll button first and always visible; a kit `collapsible()` "Modifiers" disclosure with a live worded summary; collapsed by default on BOTH hosts; expansion persisted in session slot `roll.modsOpen.<n>` only (never the note).
2. Expanded panel: visible small-caps captions over each stepper (characteristic name / Edges / Banes; aria-label == caption), Edges+Banes kept together, net-effect line `aria-live="polite"` with "No edges or banes" at 0/0, Skill and Main-action as native labeled checkboxes (wording per spec: "Skill applies (+2)", "Main action — natural 19–20 is a critical hit"), "Reset modifiers" text+icon button resetting to `defaults` (new `RollBarOptions.defaults`; ds-roll = authored seeds, cards = 0/0/off/inferred), disabled at defaults; characteristic kept on reset.
3. Flat mode: omit Edges/Banes/net (engine ignores them); keep Skill only if the engine applies it in flat mode.
4. Card launcher behavior UNCHANGED (first click rolls + reveals strip, now collapsed).
5. Print: hide the whole `.dse-rollbar` in `@media print` AND `[data-dse-print="on"]` — beware print rule 3 forcing `.dse-collapse__region[hidden]` open (spec §4.5). Do NOT fold modifiers into the printed caption.
6. Colorblind: no hue-only state; the accent fill marks only Roll.
7. Docs: DESIGN.md rule 9 carve-out + component-map row for the roll strip (worktree superproject copy); `draw-steel-elements/docs/settings.md` §Rolling; `docs/Roll.md`; refresh `docs/Media/roll.png` via the docs-shots manifest if that is the repo's mechanism; a CHANGELOG `## Unreleased` bullet in whichever CHANGELOG the DSE repo conventions use for plugin changes (check recent SC commits on develop, e.g. SC-377, for where they put it). Fix the trivial steelMaterial.test.ts:1541 comment.
8. Tests: update `rollBar.test.ts` selectors for checkboxes; ADD tests for: collapsed default on both hosts, summary text for each fact, reset-to-authored-defaults (the `edges: 1` case), reset disabled at defaults, flat mode omits edges/banes, session persistence of `roll.modsOpen`, aria-live on the net line, no note write on expand/collapse.
9. Harness shots: add shot ids for ds-roll expanded, a card with rolling ON after the first click (collapsed) and expanded, and a narrow (~300px) expanded variant. Interaction shots that click must be screen-only (round 1 found clicking a `.dse-btn` under print combos throws "Element is not visible"). Follow the harness's existing manifest conventions.

OUT OF SCOPE (do not do): dropping Reroll from the result card; ds-roll experimental gating (SC-402/SC-406); any new authored YAML key (e.g. `modifiers_open:`); changing card launcher semantics.

Commit after every coherent step on branch `sc279-roll-ux` in the DSE submodule (and the superproject for DESIGN.md/CHANGELOG if applicable — commit in the worktree superproject on its `sc279-roll-ux` branch, do NOT bump the submodule pointer; landing does that). Conventional messages prefixed `feat(roll):`/`fix(roll):`/`docs:` and mentioning SC-279. No co-author or AI attribution trailers.

## Gates — the `dse-verify` skill (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`), full battery in its order, parity LAST.
Expected at base (develop 9ad919d/f8693b5): tsc/lint clean · jest 4367 passed / 1 skipped / 215 of 216 suites (yours will be higher by your new tests — report exact) · lifecycle 25/25 · shots 568, 0 FAIL (yours higher by your new ids — report exact) · freeze `freeze OK (274/274 …)` EXPECTED TO FAIL on exactly 2 lines: `roll--steel-print.png` and `roll--steel-realprint.png` (sanctioned-rebaseline flow) — ANY other moved frozen line is a defect to fix, not to rebaseline · parity 0 GAPs / 0 undeclared / 24 DECLARED. Known flake: `sidebarInitiative` "SC-288 r2" (~3%, SC-383) — re-run once if it alone goes red.
Freeze delta deliverables (NEVER edit `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/freeze-baseline.sha256`): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/sc279-rebaseline.txt` (ready-to-apply `<sha256>  <filename>` lines, verified deterministic across 2 runs) + before/after crops of those two print shots under the ledger dir. Follow dse-verify's "sanctioned rebaseline" procedure.

## Evidence for Scott (produce, list paths)
Dark-theme PNGs: (a) ds-roll collapsed, (b) ds-roll expanded, (c) ability card after first click (strip collapsed, result shown), (d) card strip expanded with 1 edge + skill checked, (e) narrow ~300px expanded, (f) light-theme ds-roll expanded. Plus the print before/after crops. Put them in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/sc279-r2-evidence/` with descriptive names.

## Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/sc279-r2-implement.md` — opens with a ≤10-line executive summary (DSE head sha, superproject sha if any, every gate's measured numbers, freeze delta line count). Then: files changed, decisions you made where the spec left room, Drive-by fixes:, Follow-ups:.

## Return contract
Your final text goes to the ticket-owner, not a human: raw facts only (verdict, shas, measured numbers) plus the absolute path of every evidence artifact and report.

## Footguns
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches; a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND (timeout up to 600000 ms; split if needed). Do not end your turn "waiting for" a background job — a job you start will not wake you.
- Devbox: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc279-roll-ux/draw-steel-elements && <cmd> > <logfile> 2>&1'`; devbox eats `$?`/`$PIPESTATUS` and piping a gate (`| tail`) eats failures — use wrapper script files that capture the exit code, read jest's "Tests:" line and the tools' own summaries.
- Never `pkill`/`killall` by pattern — concurrent efforts run the same commands. Kill only by PID whose command line contains `worktrees/sc279-roll-ux/` (`pgrep -af "worktrees/sc279-roll-ux/"`).
- Never `rm -rf` anything under `.superpowers/` except your own `sc279-` files.
- Never create tags or releases on draw-steel-elements. Never push.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-279:`.
