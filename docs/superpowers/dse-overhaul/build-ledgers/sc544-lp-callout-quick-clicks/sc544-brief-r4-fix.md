# SC-544 r4 — rebase onto eafe76e1, fold the r3 review findings, full battery

You are resumed as SC-544's implementer (you wrote r2). Final text goes to the ticket-owner. **Workers never call the tracker.**

## 1. Context
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc544-lp-callout-quick-clicks/decisions.md` — read the "r3 review DONE" entry and the "owner rulings on r3" entry (they govern this round).
- Review: `sc544-r3-review-report.md` (same dir) — MEDIUM-1, LOW-1, LOW-2, INFO-1, INFO-3, INFO-9 with file:line and prescribed fixes.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc544-lp-callout-quick-clicks`, plugin HEAD d3e426dd on 423e798d; superproject 1664d43b on 82f182b3.
- **The workspace-level files (CHANGELOG.md) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc544-lp-callout-quick-clicks/CHANGELOG.md` — never under `/home/scott/code/steelCompendium/workspace/`.**

## 2. Rebase first
- Plugin: `git -C <plugin> fetch origin`, then `git -C <plugin> rebase eafe76e1`. SC-511 landed there. It touches `src/framework/pipeline.ts` (Unpin item onClick, `control: 'chrome.unpin'`), `DseSidebarView.removePanel`, `focusHandoff.ts` and the sidebar focus-visible CSS, and adds e2e spec SBR-F01..F04. Keep both sides on any conflict. `npm ci` if package.json changed.
- Superproject: `git -C <worktree> fetch origin`, then `git -C <worktree> rebase origin/main` (now 55588e9a). origin/main's CHANGELOG has moved by 8 lines since 82f182b3: keep both sides, with your bullet under `## Unreleased`.

## 3. Folds (owner rulings, verbatim from the ledger)
- "MEDIUM-1: FOLD the docs part now — CHANGELOG reworded to "…when a block edit form on one block is saved right after a click on another block"; architecture.md not-covered list gains "a block form opened while another twin's write is still pending (its Save lands in the twin below; exists on base)". Code part FILED SC-552 (Backlog, Bug, DSE Plugin, DSE 7.0.0, related SC-544 + SC-519). OUT OF SCOPE."
- "LOW-1: FOLD one sentence in the architecture.md behaviour note (two quick clicks undo as one step in LP). No code change."
- "LOW-2: FOLD (restore 46 at :103 and :111)."
- "INFO-1: FOLD the re-entrancy guard (nested flushPendingWrites returns at once; the outer loop already reaches every sibling) + a jest case (writer's own pending view not flushed by a nested call; writes in registry/click order). INFO-3: document the resulting order in the code comment / architecture.md."
- "INFO-9: FOLD into the proposal file (M4 control; red bundle bytes = 423e798d)."
- Make the guard exception-safe: reset it in a `finally`. Show the new jest case red without the guard (log). Re-run G-S61 on HEAD after the guard. Re-run jest mutant m1 (remove the call) and G-S61 M1 to confirm they are still red.
- Out of scope: SC-552, SC-549, SC-550, SC-540 (`pipeline.ts`; SC-511's pipeline.ts changes are not yours to touch either), SC-545, SC-547. SC-472's files `previewScrollPin.ts`, `livePreviewScrollHold.ts` and `redrawBackstop.ts` are off limits. Commit after each coherent step.

## 4. Gates (full battery on the final HEAD, dse-verify order)
Expected on eafe76e1 plus your change:
- tsc (incl. `-p e2e`) and lint: clean.
- jest: **6287 + 7 + new guard case(s) ≈ 6295 passed / 1 skipped / 251 of 252 suites**. A fresh worktree shows one fewer passed and 2 skipped until shots caches `obsidian-app.css`.
- lifecycle: **47/47** as three `--only` calls (same lists as r2; part 3 `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S57 G-S61 G-S56`), every call with **`DSE_LIFECYCLE_PORT=9548`** (SC-551: concurrent runs on the default 9262 give a mass FAIL). Report each part's time.
- e2e: **128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs**, plus the pointer-parked line.
- shots: **592, 0 FAIL**, host-leak **161/966**, modal 228, input 15/176, checkbox 7/116, prose 106 [212]. If it may pass 600 s, start it with a unique log and an rc file and poll them.
- freeze: **280/280**.
- parity: **0 / 0 / 24**.
- Update `sc544-dse-verify-proposal.md` with the new CURRENT line (eafe76e1-based numbers).

## 5. Report
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc544-lp-callout-quick-clicks/sc544-r4-fix-report.md`. Open it with a **≤10-line executive summary**: verdict, plugin and superproject shas, gate numbers, each fold done. Put logs in the same dir as `sc544-r4-*.log`. List `Drive-by fixes:` and `Follow-ups:` separately.

## 6. Return contract
Raw facts only: verdict, shas, numbers, and the **absolute path of every evidence artifact**.

## Footguns (all apply, as in your r2 brief)
- If the report write is blocked, return it inline.
- Never key a wait-loop on a scratch filename or its contents (the pre-populated scratch dir will match a stale log). Use per-run unique paths.
- Redirect long output to files; the 600 s stream watchdog kills silent agents.
- One gate per Bash call, blocking foreground. No `run_in_background` or Monitor, except shots under load via poll-the-log.
- Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc544-lp-callout-quick-clicks/draw-steel-elements -- bash <script file>`. No `cd X && …`; use `git -C <abs path>`; record exit codes inside script files.
- Write scratch files with the Write tool. No `rm` with a shell-variable target, no glob `rm`.
- Kill only your own PIDs, checked with `readlink /proc/<pid>/cwd`; never `pkill`/`killall` by pattern.
- Never `rm -rf` a shared `/tmp` glob or `.superpowers/`. Write only `sc544-` files there. Never edit the freeze baseline.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc544-r4-impl-b1/`.
- You cannot reach me by SendMessage. End with STATUS: NEEDS_CONTEXT if you need input. If you message anyway, the first word must be `SC-544:`.
