# SC-537 r4 — fix round on the r3 review + rebase onto fb24f8a2 + full battery

You are the SC-537 implementer (you wrote r2). Your final text goes to the ticket-owner, not a human. **Workers never call the tracker.**

## 1. Context loading
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc537-lp-callout-twins/decisions.md` — read the r3 entries and the "owner rulings on r3" (authoritative).
- Review: `.../sc537-lp-callout-twins/sc537-r3-review-report.md` (HIGH-1, MEDIUM-1, LOW-1, LOW-2, INFO). The reviewer's tested fix bundle and probes (read-only; copy what you need): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc537-r3-review-rv3/` (`bundle-fixvp`, the far-apart / title-click probe scenarios).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc537-lp-callout-twins`; plugin branch `sc537-lp-callout-twins` at `4e3de39c`; superproject branch at `97636536`. The CHANGELOG lives in YOUR worktree's superproject (`/home/scott/code/steelCompendium/worktrees/sc537-lp-callout-twins/CHANGELOG.md`), never under `/home/scott/code/steelCompendium/workspace/`. Main checkout dse dirt is Scott's live vault — ignore it.

## 2. Rebase first
- Plugin: `git -C <plugin> fetch origin`, `git -C <plugin> rebase origin/develop` → **fb24f8a2** (SC-533 + SC-536 landed: `RefUnwrapView.ts`, `view.ts` — `isUnloaded()` removed — and lifecycle **G-S56, which runs LAST and replaces every other markdown/sidebar leaf**). In `obsidian-lifecycle.mjs`, keep G-S56 and G-S57 both; **G-S57 must sit BEFORE G-S56 or set up its own leaves** (it must not depend on leaf state left by earlier scenarios). Run `npm ci` if `package.json` changed.
- Superproject: rebase your branch onto `origin/main` (**c64283ea** at dispatch; `git -C <superproject> fetch origin` first). CHANGELOG conflicts: keep every other effort's bullets, keep yours. No submodule pointer bump.

## 3. The task — owner rulings, verbatim
- "HIGH-1: FOLD into r4 — the reviewer's tested fix (also run the pass on viewportChanged and selectionSet), plus G-S57 phases (f) far-apart twins (lower off screen at write time; then scroll down: card = disk; lower + writes the lower; form Save upper then scroll + lower click keeps [Edited, Twin]) and (g) title click within 100 ms. Both must FAIL on 4e3de39c's bundle and PASS on the fix. Jest case for viewportChanged-only and selectionSet-only updates."
- "MEDIUM-1: FOLD (same fix, phase (g))."
- "MEDIUM-2: FILED SC-544 (Backlog, related SC-537). Pre-existing, needs a different detection (position mapping), rapid-click only. OUT OF SCOPE for r4."
- "LOW-1: FOLD — the pass now also runs on scroll/selection, so cost matters: compute each callout's block list once per pass (or narrow quoteOrdinal's query); early return when the editor holds no DSE callout entry. Report the 40-block-callout per-update cost before/after."
- "LOW-2: FOLD — CHANGELOG bullet accurate after the fix; MEDIUM-2's rapid-click case may be left unsaid (it has SC-544)."
- "INFO count assertion (livePreviewScrollHold.test.ts:545): FOLD — assert the scroll-hold extension is among the registrations instead of an exact count (removes the SC-522 merge hazard)."
- "INFO plugin off/on tangent: FILED SC-545 (Backlog, related SC-537). Out of scope."
- Still in force from r2: do not touch `livePreviewScrollHold.ts` (SC-522), the click shield `pipeline.ts` `armClickShield` (SC-540), or callout chrome CSS (SC-520). Do not edit `dse-verify/SKILL.md`.

Red→green: show the new jest cases and G-S57 phases (f)/(g) FAIL on 4e3de39c (the r2 fix) and PASS on HEAD. Re-run your three r2 mutants plus a mutant that drops `viewportChanged`/`selectionSet` from the guard — each must turn something red (jest and/or G-S57). Commit after each coherent step; no AI attribution in commit messages.

## 4. Gates on your final HEAD (dse-verify battery; expected numbers)
CURRENT at fb24f8a2: jest 6228 passed / 1 skipped / 249 of 250 · lifecycle 44/44 · e2e 124/124, 0 failed, 0 known-bug, 87/87 · shots 592, 0 FAIL, host-leak 157/942, modal 228, input 15/176, checkbox 7/116, prose 106 [212] · freeze 280/280 · parity 0/0/24.
Expected on HEAD: tsc/lint clean; jest 6228 + 7 (r2) + your r4 cases / 1 skipped / 249 of 250; **lifecycle 45/45**, run as `--only` calls that each stay under 600 s — use THREE calls (the r3 reviewer's split 16 + 17 + 11 took 205/338/249 s; add G-S56 and keep each part well under 600 s) and report the exact lists and times; e2e 124/124 87/87 (CHR-F02 flake: re-run once, report both); shots/freeze/parity as CURRENT (shots may exceed 600 s under load: if killed, re-run in the background to a fresh unique log and poll THAT log's `rc=` line).

## 5. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc537-lp-callout-twins/sc537-r4-fix-report.md`, opening with a ≤10-line executive summary (verdict, plugin + superproject shas and bases, red→green per finding, mutants, gate numbers, lifecycle split). Logs `sc537-r4-gate-*.log`, `sc537-r4-mut-*.log`; one screenshot of the far-apart case after the fix (`sc537-r4-…png`). `Drive-by fixes:` and `Follow-ups:` listed separately.

## 6. Return contract
Raw facts: STATUS, shas, numbers, deviations, absolute paths of every artifact.

## Footguns (all apply)
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- One blocking foreground Bash call per gate / Obsidian run (< 600 s). No `run_in_background`, no Monitor, no background jobs — only exception: shots after a killed foreground run, polled via its own unique log.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc537-lp-callout-twins/draw-steel-elements -- bash <script file>`. Never `cd X && …`; never `cd` inside a compound command; `git -C <abs path>` for every git command. Devbox eats `$?` — record exit codes from inside a script file; read each gate's summary line.
- Scratch: private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc537-r4-impl-<your agentId>/`, uniquely named files. Write tool for scratch files (no heredocs). No `rm` with a shell-variable target, no glob `rm`.
- Never `pkill`/`killall` by pattern; kill only a PID you started whose cwd (`readlink /proc/<pid>/cwd`) or command line is inside your worktree/scratch. Never `rm -rf` a shared `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`). Never touch the shared `.superpowers/` dir beyond your own `sc537-` files.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher. If you need input, end with STATUS: NEEDS_CONTEXT. If you ever message anyway, the FIRST WORD must be `SC-537:`.
