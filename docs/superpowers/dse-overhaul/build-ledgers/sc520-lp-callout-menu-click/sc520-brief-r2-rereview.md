# SC-520 r2 scoped re-review brief (reviewer)

You reviewed r1 (your report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc520-lp-callout-menu-click/sc520-r1-review-report.md`). Now review ONLY the r2 delta. If you are a fresh agent, load context from that report, the ledger and the r2 fix report. Your final text goes to the SC-520 ticket-owner.

## Context
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc520-lp-callout-menu-click/sc520-decisions.md` (2026-10-29 rulings on your findings; r2 entry).
- r2 fix report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc520-lp-callout-menu-click/sc520-r2-fix-report.md`; implementer scratch (read-only): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc520-r2-fix-m7q3/`.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc520-lp-callout-menu-click`: dse head `32fcace` on origin/develop `9be397e` (rebased from `43d57e5` on `ed368f6`, through 71437da); superproject `49367042` on origin/main. Use `git range-diff ed368f6..43d57e5 9be397e..32fcace` to separate the rebase from the r2 changes.
- Read-only on the branch; your own scratch folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc520-r2-rereview-<4 chars>/`. Never call Linear.

## Task — execute and probe
1. Your MEDIUM-1, LOW-1, LOW-2, INFO-1, INFO-3 are fixed as ruled: rule F + first-child narrowing (check the narrowing really is reliable in LP and RV, and that a chrome block NOT first in a callout keeps base behaviour exactly); LOW-1 option (b) `--dse-chrome-inset` 24px in LP callouts with the block first — Collapse and `</>` hit across their full faces for all chrome types; nothing moves at the top level, in Reading view, or outside callouts.
2. The implementer's follow-up: the inset override hits every `.dse-chrome-anchor` inside the first block. Is any nested chrome anchor possible (e.g. a statblock/featureblock containing chrome children)? Judge whether to tighten the selector.
3. INFO-2 leftover: the sidebar view's own chrome (Pin a block, then Collapse/Expand/Edit in the sidebar panel by real mouse) with the click preventDefault in place.
4. Rebase hazards: SC-518 (`focusHandoff.ts`, `FormModal.ts`, `pipeline.ts`, G-S50) and SC-479 (`previewScrollPin.ts`, G-S42) vs this branch's `mountChrome` click handler and the `.callout` scroller (does the Reading-view scroll pin still hold with a callout as a horizontal scroller?).
5. G-S49's new phases discriminate (fail on r1 / no-F builds — re-run at least one).
6. Battery on `32fcace`: tsc/lint clean; jest 6155 / 1 skipped / 248 of 249; lifecycle 42/42 (two foreground `--only` halves); e2e `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` (CHR-L01 load flake is SC-534 — re-run once if only it fails); shots 592 0 FAIL, host-leak 145/870, modal 228, input 15/176, checkbox 7/116, prose 106 [212]; freeze 280/280; parity 0/0/24.

## Shell rules
Same as your r1 brief §3: devbox `-c <abs dir> -- bash <script>`, no `cd` in compound commands, exit codes in a script file, no piped gates, one blocking foreground call per gate (no `run_in_background`, no Monitor), `git -C` always, Write tool for scratch files, no `rm` with variables / globs / `/tmp` globs, never touch `.superpowers/` outside your report, never `pkill` by pattern, never key a wait-loop on a scratch filename.

## Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc520-lp-callout-menu-click/sc520-r2-rereview-report.md`, opening with a ≤10-line executive summary (verdict LAND / FIX, findings by severity, battery). Findings with file:line, scenario, evidence path, prescribed fix. Inline if the write is blocked.

## Return contract
Final text: verdict, findings (one line each), battery numbers, absolute evidence paths. You cannot reach me by SendMessage; end with STATUS: NEEDS_CONTEXT if you must. Any message you do send starts with `SC-520:`.
