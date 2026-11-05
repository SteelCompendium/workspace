# SC-520 r1 independent review brief

You are the independent reviewer for Linear ticket SC-520 (Live Preview: chrome-panel buttons of a DSE block at the top of a callout cannot be clicked with the mouse). You did not write this code. Your final text goes to the SC-520 ticket-owner, not a human.

## 1. Context loading

1. Ledger (rulings; read instead of any ticket thread): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc520-lp-callout-menu-click/sc520-decisions.md`
2. Implementer report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc520-lp-callout-menu-click/sc520-r1-impl-report.md` (+ its scratch folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc520-r1-impl-k4v9/` — probes `probe-*.js`, `mkprobe.sh`, survey logs; read-only, copy what you need).
3. Precedent: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc502-lp-stamina-menu-click-ledger.md` and its `sc502-r1-review-report.md` (the HIGH-1 margin-escape finding is the kind of thing to hunt for here).
4. Gates: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.

- Branch under review: worktree `/home/scott/code/steelCompendium/worktrees/sc520-lp-callout-menu-click`, dse head `43d57e5` (commits `5605a49` tests, `227e18d` fix, `43d57e5` e2e census) on origin/develop `ed368f6`; superproject `c151b62` (CHANGELOG, DESIGN.md) on `5902c18`. Diff: `git -C <worktree>/draw-steel-elements diff ed368f6..43d57e5`, `git -C <worktree> diff 5902c18..c151b62`.
- **Read-only on the branch**: do not commit to it. Base builds, bundle variants and probes go in your scratch folder or a separate `git worktree add` at an absolute path under your scratch folder.
- **You never call the tracker (Linear).**
- Main checkout dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected.

## 2. Task — execute and probe, do not just read

The fix: CSS `.callout-content:has([data-dse-theme='steel']:not([data-dse-print="on"])[data-dse-chrome]) { overflow: visible; display: flow-root }` in styles-source.css, plus `mountChrome` calling `preventDefault()` on `click` for the panel and the collapsed one-liner.

Probe in real Obsidian 1.15 (lifecycle/e2e harness Obsidian), Live Preview AND Reading view, with real CDP pointer presses:

1. **Owner-assigned probes (ledger rulings):**
   - Callout `</>` edit-block button WITH the panel revealed: hit-test at its centre and at its left edge; measure panel right edge vs `</>` left edge (the owner's crop shows them touching). Also: a collapsed one-liner at the top of a callout — Expand vs `</>`.
   - Lost horizontal scroll: a chrome block plus a wide markdown table and a long unwrapped code line in the SAME callout; a wide DSE block (statblock, initiative, anything with a min-width) in a narrow pane (e.g. 360–500px). Before vs after: does content that used to scroll sideways now get cut or overflow the callout? If real, propose a scoped alternative (and test it on the live page).
   - CHR-L01 flake: does `e2e/specs/stamina-bar/chrome-live-preview.e2e.ts` CHR-L01 flake on base `ed368f6` under comparable load (the implementer saw 1 in 6 at loadavg ~13)? Pre-existing or caused by this branch?
   - Coarse pointer (`pointer: coarse`) panel inside a callout: quick probe only if Obsidian can be emulated into it; otherwise say so.
2. **The `click` preventDefault in shared chrome code** — runs for EVERY chrome element in EVERY context, not just callouts. Check: nothing in the panel or the one-liner relies on a default click action (checkbox, link, `<summary>`/`<details>`, label-for, form submit); Recoveries popover click-outside still closes; Pin to sidebar, Edit form, Collapse/Expand still work at the top level, in a callout, in the sidebar view and a popout window; keyboard Enter/Space on chrome buttons unchanged (SC-498/SC-505 focus behaviour).
3. **The CSS** — `overflow: visible` + `display: flow-root` on `.callout-content`: margin-escape / CodeMirror widget height (SC-502 HIGH-1 pattern) in LP; content below the callout and the next line's click target; foldable callout fold/unfold animation and collapsed state; nested callouts; a callout with ONLY a print-mode (`data-dse-print="on"`) block and a non-steel theme (rule must not match); callouts without any DSE block (rule must not match). Pixel neutrality with the panel hidden.
4. **Tests**: G-S49 FAILS on base and passes on the head (re-run both); the jest additions test something real (revert-and-run); the census change in `e2e/driver/census.ts` is justified and does not weaken CENSUS-01/05 coverage of anything else.
5. **Battery** on `43d57e5`, full dse-verify order. Targets (ledger, ed368f6 + branch): tsc/lint clean; jest 6117 / 1 skipped / 247 of 248; lifecycle 40/40; e2e `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`; shots 592 0 FAIL, button host-leak 145/870 (28-record boundary), modal 228, input 15 kinds/176, checkbox 7 kinds/116, prose 106 [212]; freeze `280/280`; parity 0/0/24.
6. Docs: CHANGELOG bullet plain and accurate; DESIGN.md note accurate.

## 3. Shell rules (each has hung or wrecked a worker before)

- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc520-r1-review-<4 random chars>/`, unique names inside. Never a generic name at the scratchpad top level.
- `devbox run -c <abs dir> -- bash <script file>`; never `cd` in a compound command. Exit codes recorded inside a script file; never pipe a gate; redirect to a log and read the summary line.
- One blocking foreground Bash call per gate (timeout 600000; split lifecycle / e2e / shots). **No `run_in_background`, no Monitor, no background jobs.** Redirect long output to files — the 600s stream watchdog kills silent agents.
- `git -C <absolute path>` always. Write tool for scratch files.
- **No `rm` with a shell-variable target, no glob `rm`, never `rm -rf` a `/tmp` glob**; never touch `.superpowers/` outside your report file.
- Never `pkill`/`killall` by pattern; kill only a PID whose command line contains your own path or whose `readlink /proc/<pid>/cwd` is inside your scratch or this worktree.
- Never key a wait-loop on a scratch filename or its contents — stale logs from other branches match. Read the process's own output or use a per-run unique path.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc520-lp-callout-menu-click/sc520-r1-review-report.md`, opening with a ≤10-line executive summary (verdict LAND / FIX, finding counts by severity, battery numbers). Then findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, failure scenario, evidence path, and a prescribed fix; then the owner-assigned probe answers (each item in §2.1 answered explicitly); then artifacts with absolute paths. If the report-file write is blocked, return it inline.

## 5. Return contract

Final text to the ticket-owner: verdict, finding list (severity + one line each), measured battery numbers, absolute paths of the report and every evidence artifact. No prose.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-520:`.
