# SC-609 r1 brief — implementer

You implement SC-609 in an isolated worktree. You never call the tracker (Linear) — not to read history, not to post. Your context is this brief plus the ledger.

## 1. Context loading

- Ledger (read first; it is the current truth, quoted rulings live there): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc609-roster-click-focus/decisions.md`
- Prior art ledgers + reports: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc588-initiative-focus-after-rebuild*`, `sc603-focus-after-pool-apply*` (SC-603 r2 review INFO-4 is where this bug was found).
- Read `draw-steel-elements/AGENTS.md` in your worktree and the `dse-verify` skill at `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (large; read "The battery, in order", "Devbox wrapping", "Load-sensitive jest suites", "Lifecycle and e2e notes", "THE exit-code footgun", and the CURRENT entry under "Current expected numbers").
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc609-roster-click-focus`. The plugin is `…/sc609-roster-click-focus/draw-steel-elements`, branch `sc609-roster-click-focus`, cut from dse `develop` @ `231f2a3b`. Verify `pwd`/`git -C <abs path> rev-parse` before any write. First: `git -C <worktree>/draw-steel-elements fetch origin` and confirm `origin/develop` is still `231f2a3b`; if it moved, rebase onto it and note the new sha (run `npm ci` if `package.json` changed). Run `npm ci` once in the fresh worktree if `node_modules` is missing.
- Workspace-level files (CHANGELOG.md, docs) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc609-roster-click-focus/` — never under `/home/scott/code/steelCompendium/workspace/` (the shared main checkout; never write there except your report files in the ledger dir). The main checkout's dse dirt (`demo-vault/Welcome.md`, `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault and expected — ignore it.

## 2. The task

Bug (ticket, verbatim): "With keyboard focus on the detail row's Stamina control, a mouse press on another roster cell selects that creature, the tracker rebuilds, and focus falls to the page body instead of staying in the tracker."

Owner rulings (verbatim from the ledger — re-read the ledger, it wins if this copy drifts):

> Behaviour: when keyboard focus is inside the initiative tracker and a mouse press on a roster cell selects a creature and the tracker rebuilds, focus lands on the REBUILT replacement of the cell that was pressed (the newly selected creature's cell) — where the browser itself would have put focus had the click shield not stopped it and the rebuild not detached it. If focus was NOT inside the tracker before the press, nothing changes (SC-588: "A mouse click never pulls focus into the tracker").

> Scope: the roster-cell press is the ticket. The implementer surveys the other mouse-press paths in the tracker that trigger a whole-tracker rebuild while focus is inside it (the same family: focus inside the tracker, a mouse press, a rebuild, focus on body). If they share the mechanism the roster fix uses, fix them with the same rule (focus on the rebuilt replacement of the pressed control); if they need a different mechanism, report them as follow-ups and leave them.

> Tests: jest case(s) red on the base (shown red), plus real-Obsidian e2e coverage in `e2e/specs/initiative/` (not lifecycle): Tab to the detail row Stamina control, mouse press on another roster cell, assert `document.activeElement` is the rebuilt pressed cell; plus the negative: focus on the note body, mouse press on a roster cell, focus behaves exactly as on the base (today: not pulled into the tracker). SC-458 (Backlog) may later make a click focus its roving target from anywhere; do not pre-empt it, and word the negative test's comment so SC-458 knows it is the one to flip. No bracketed ticket id in test titles.

Steps:
1. Reproduce and diagnose first. Known mechanics: the element click shield (`armClickShield` in `src/framework/pipeline.ts`) preventDefaults non-editable pointerdowns inside a card, so a press cannot move focus; SC-588's `controlFocus.ts` restores focus to the rebuilt control after a whole-tracker rebuild. Find exactly why that restore does not cover this press (e.g. token keyed to the old creature's detail control, the selection path bypasses it, or it deliberately skips mouse-triggered rebuilds). Put the diagnosis in your report with file:line.
2. If the diagnosis shows the ruling cannot be met as written (e.g. roster cells are not focusable / not in a roving set, or meeting it would change SC-588/SC-603 behaviour), STOP and return STATUS: NEEDS_CONTEXT with the facts.
3. Fix with the smallest change that reuses `controlFocus.ts` / the SC-588 token mechanism where possible. Do not change the shield globally (that is SC-458). Do not touch the Conditions window type-to-search code (SC-580's owner) or hover-preview pin / +/- code (SC-607's owner), or `managedModal.ts`.
4. Tests per the ruling. Commit after every coherent step (fix+jest, e2e, changelogs). No bracketed ticket id (`[SC-609]`) in any test title — the e2e runner reads bracketed ids as scenario ids; e2e scenario ids are global, so pick a new unused id (grep the specs).
5. Changelogs: the dse `CHANGELOG.md` (follow its Unreleased convention) and the workspace `CHANGELOG.md` `## Unreleased` in YOUR worktree's superproject (commit that in the superproject branch `sc609-roster-click-focus`; do not bump the submodule pointer — landing does that). User-facing wording, e.g. "Clicking a creature in the initiative roster while using the keyboard keeps focus in the tracker, on the creature you clicked."

## 3. Gates (dse-verify battery, all of it, in order)

Expected at base `231f2a3b`: tsc + lint clean · jest **10711 passed / 2 skipped** fresh (10712 / 1 after a shots run) — yours adds your new tests · lifecycle **60/60** in SIX `--only` parts (`--only=` takes comma-separated ids): part 1 `G-S7a … G-S9a` (21), part 2 `G-S9b … G-S40` (16), part 3 `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9), part 4 `G-S57,G-S62,G-S61,G-S56` (4), part 5 `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7), part 6 `G-S92,G-S96,G-S97` (3) — take the exact id lists for parts 1 and 2 from the SKILL's lifecycle row · e2e `OBSIDIAN-E2E done: 278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs` at base (known bugs SC-257, SC-355, SC-384, SC-580) — yours will show more ok and possibly more pairs; it must end `0 failed` and `coverage: Y/Y pairs` · shots **592**, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze **280/280** (0 FAILED) · parity **0 / 0 / 24**. Report every number you measure, and any delta from base with its cause.

## 4. Footguns (each cost real time once)

- devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc609-roster-click-focus/draw-steel-elements -- bash -c 'cd <abs plugin path> && <cmd>'`. Never `cd` in a compound command outside that string. Every git command is `git -C <absolute path>`.
- Exit codes: never trust an echoed `$?` inside `bash -c`; make the gate the last command, or run it through a script FILE (`devbox run -c <path> -- bash <script>`) that writes `rc=$?` itself; read each gate's own summary line. Never pipe a gate into `tail`.
- `rm -f main.js styles.css` in the plugin root before `npx jest` (stale bundle shadows main.ts).
- jest timeout reds in the load-sensitive suites listed in the SKILL: check `/proc/loadavg`, rerun that suite alone before believing it.
- Scratch: use a private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc609-r1-impl/` with uniquely named scripts and logs; create files with the Write tool.
- Never `rm -rf` a `/tmp` glob or the shared `.superpowers/` dir; never `rm` with a shell-variable path. Delete only literal paths you created.
- Never `pkill`/`killall` by pattern — kill only a PID whose `/proc/<pid>/cwd` is inside your worktree (other efforts run the same gates concurrently).
- Long gates: the Bash tool backgrounds any call over 180 s and notifies you on completion. Run one lifecycle part / e2e / shots per call with output redirected to a unique log file. Never key a wait on a scratch filename or its contents (the scratch dir is pre-populated across sessions); wait on YOUR OWN pid (`timeout 175 tail --pid=<pid> -f /dev/null`) and then read the log. Do not end your turn "waiting for a notification" — keep polling your own pid until the gate's log has its summary line.
- Redirect long output to files rather than streaming it (the 600 s stream watchdog kills silent agents).
- If a Bash call would need a permission prompt, use another shape instead (no prompt will be answered).

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc609-roster-click-focus/sc609-r1-impl-report.md`. It opens with a ≤10-line executive summary (verdict, dse HEAD sha, superproject HEAD sha, gate numbers). Body: diagnosis with file:line, the fix, the survey of other mouse-press rebuild paths (fixed / left as follow-up, each with file:line), tests added (with the jest red-on-base evidence), every gate line, `Drive-by fixes:` and `Follow-ups:` lists. If the report-file write is blocked by your harness, return the report inline.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), shas, measured numbers, no prose — plus the absolute path of every evidence artifact (report, logs). You cannot SendMessage me: a depth-2 agent cannot address its parent, and `to: 'main'` reaches the dispatcher, not me. If you need input, end your turn with STATUS: NEEDS_CONTEXT and the question; I will resume you. If you ever message anyway, the first word must be `SC-609:`.
