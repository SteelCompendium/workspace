# SC-540 r3 brief — fix round + rebase (implementer, resumed)

Context: re-read `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc540-lp-callout-click-source/decisions.md` (r2 review + "owner rulings on r2" entries) and the review report `sc540-r2-review-report.md` (HIGH-1, LOW-1, LOW-2 sections) in the same dir. Workers never call the tracker. Same worktree, branch, command and safety rules as `sc540-brief-r1-impl.md` §1 and §4 — obey them all (one blocking foreground call per gate; `devbox run -c <abs path> -- bash <script>`; no `cd … &&`; `git -C`; private scratch folder `…/scratchpad/sc540-r3-impl-<suffix>/`; no variable/glob `rm`; never pkill by pattern; never rm a shared /tmp glob; unique lifecycle port; redirect long output to files; never key a wait-loop on a scratch filename; shots only may run in the background under load, polled via its own unique log + rc file).

## 1. Rebase first
- Plugin: `git -C <plugin> fetch origin`; rebase `sc540-lp-callout-click-source` onto origin/develop **`423e798d`** (SC-546, harness-only: lifecycle/e2e/docs-shots start Xvfb via `scripts/xvfb-owned.mjs` with `-displayfd`). A conflict in `visual-harness/obsidian-lifecycle.mjs` near G-S62 is possible — keep both sides. `npm ci` if package.json changed.
- Superproject: rebase your superproject branch (CHANGELOG commit) onto origin/main **`baab5315`** (fetch in the worktree's superproject). Do not bump the submodule pointer.
- Rebase BEFORE any lifecycle/shots run (an un-rebased tree's lifecycle run can land on another run's display).

## 2. Fold these (owner rulings, quoted from the ledger)
> - HIGH-1: FOLD — the reviewer's prescribed fix, covering callouts AND LP embeds (the embed case is SC-522's pre-existing gap in the same function; fixing it here is in scope). Jest pin for a detached target (fails on 992375b6). G-S62 phase (g) Advance round on a ds-initiative in a callout and phase (h) Advance round in an initiative inside an LP embed: card / embed not selected, selection unmoved, written; both FAIL on the 992375b6 bundle. Comment block names the case.
> - LOW-1: FOLD (comment reword in pipeline.ts, and livePreviewScrollHold.ts if repeated).
> - LOW-2: FOLD — a cheap Reading-view phase in G-S62 (+ in the callout note in Reading view: written, roots unmarked). If part 3 then exceeds ~540 s, propose a rebalanced split in the proposal file.

The prescribed code is in the review report (HIGH-1 "Prescribed fix"); its scratch variant is `sc540-r2-evidence/r2bundle-fix.sh`. Also probe ds-project's **Add project roll** in a callout on HEAD (must stay a card) — the reviewer measured it raw on 992375b6.
Out of scope: right-click callout menu (dropped), mobile (dropped), SC-544's files (ReadingModeBlockHost.ts, viewRegistry.ts, view.ts, remountReused.ts, livePreviewReconcile.ts), SC-520's (mountChrome.ts, chrome CSS).

## 3. Red/green
- New jest test(s) red on the 992375b6 source, green on HEAD.
- G-S62 (g) and (h) FAIL on a 992375b6 bundle, PASS on HEAD; the Reading-view phase passes on both and FAILs on a "mark every `.callout`" mutant bundle.
- Update CHANGELOG bullet if needed (it may now also mention that the embed case of buttons that redraw the card is fixed — plain words, one bullet).
- Update `sc540-r1-dse-verify-proposal.md` → write `sc540-r3-dse-verify-proposal.md` (G-S62 clause with the new phases, part-3 list/timing, CURRENT numbers at the new head).

## 4. Full battery at the new HEAD — targets at 423e798d
- tsc (incl. `-p e2e`) / lint (incl. `e2e/`): clean.
- jest: 6272 + 7 (r1) + N (r3) passed / 1 skipped / 250 of 251 suites (after a shots run; fresh one fewer / 2 skipped).
- lifecycle: **47/47** in THREE `--only` parts, separate blocking calls: `G-S7a … G-S9a` (21), `G-S9b … G-S40` (16), `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S57 G-S62 G-S56` (10). Report seconds per part.
- e2e: `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` + pointer parked line.
- shots: 592, 0 FAIL, button host-leak 161/966 (34-record boundary), modal 228, input 15/176, checkbox 7/116, prose 106 [212].
- freeze: `freeze OK (280/280 …)` — any moved byte: STOP and report.
- parity (last): 0 GAPs / 0 undeclared / 24 DECLARED.

## 5. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc540-lp-callout-click-source/sc540-r3-fix-report.md`, opening with a ≤10-line executive summary (STATUS, shas, rebase result, what was folded, red/green, gate numbers). Include `git range-diff eaf64ba6..992375b6 423e798d..HEAD` summary. One deciding screenshot: HEAD, Advance round in a callout, callout still a card → `sc540-r3-head-advance-round-callout-card.png`. `Drive-by fixes:` and `Follow-ups:` sections. If the write is blocked, return the report inline.

## 6. Return contract
Raw facts only: STATUS, shas, numbers, gate lines, absolute paths of every artifact. You cannot `SendMessage` me; for input, end with STATUS: NEEDS_CONTEXT. Any stray message's first word must be `SC-540:`.
