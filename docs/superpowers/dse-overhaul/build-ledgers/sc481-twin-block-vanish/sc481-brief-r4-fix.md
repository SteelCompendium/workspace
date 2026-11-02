# SC-481 r4 — fix round on d250e97 (quote/callout twins, callout parse-error regression, lastWriteLine pin)

Implementer for SC-481. Final text goes to the ticket-owner, not a human. **Workers never call the tracker.**

## 1. Context loading
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/decisions.md` (r3 rulings at the bottom).
- Review report — the findings, verbatim, are your task: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/sc481-r3-review-report.md` (§2 HIGH-1, MEDIUM-1, LOW-1; INFO-5). R3's probe kit and fixtures (`R3/quote-twins.md`, `R3/callout-twins.md`) are listed in its §3 — reuse them.
- Your own r2 report: `sc481-r2-impl-report.md` (same dir).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc481-twin-block-vanish`, plugin branch `sc481-twin-block-vanish` at `d250e97` on `4deb8cf`; superproject `f390b80f`. First `git -C <plugin> fetch origin`; if `origin/develop` moved past `4deb8cf`, rebase onto it and report the sha. Workspace-level files (CHANGELOG) live in YOUR worktree's superproject, never under `/home/scott/code/steelCompendium/workspace/`. Main-checkout dse dirt (`demo-vault/Welcome.md` etc.) is Scott's vault — ignore.

## 2. The task — owner rulings (verbatim from the ledger, 2026-10-30)
- "HIGH-1 (twins inside a blockquote or callout still have the whole bug incl. form-edit erase and wrong-block write; same as base): FOLD into r4 — fix option (a) as R3 prescribes (judge window sections in both paths with the host's own SC-455 fence resolution; remount body from the fence's own lines with the quote prefix stripped; G-S53 phases + jest for quote and callout twins: form Save upper then lower click then names; adoption off). Same root cause and the same data loss the ruling "Scope: the vanish AND the wrong value AND the wrong-block write, Reading view + Live Preview — one root cause" covers. Also check callout/quote twins in Live Preview. If (a) cannot be made to pass, stop and return NEEDS_CONTEXT with evidence (owner may then split to a follow-up ticket)."
- "MEDIUM-1 (callout twins now draw a parse-error card; remountVacated lacks the plain-fence guard, remountReused.ts:82-84): FOLD — one shared section-test helper used by both paths + the jest case R3 prescribes."
- "LOW-1 (lastWriteLine skip not pinned by jest): FOLD — the two-docId jest case R3 prescribes."
- "INFO-5 caveat (LP getSectionInfo stale for destroyed widgets; matters only if LP adoption is ever added): DROP — no LP adoption planned; a one-line code comment at remountVacated is allowed as a drive-by."
- "G-S50 comment staleness: FOLD now that a fix round exists (comment-only)." (the comment "old root/pencil stay in the document (inside the twin)" in `visual-harness/obsidian-lifecycle.mjs`)
- Out of scope: how several equal bodies are chosen among (SC-480, parked on Scott); INFO-3 equivalent mutants (dropped).

Order: red jest cases first for each finding (commit), then fixes (commit), then G-S53 quote/callout phases (prove they FAIL on d250e97's bundle — for MEDIUM-1 the parse-error card — and on 4deb8cf, PASS on HEAD; commit). Mutation check: remove the shared section-test helper's guard, and remove the window-section judging — each caught by jest and/or G-S53. Update the CHANGELOG bullet only if its wording no longer fits (it should now cover blocks inside quotes/callouts too). Commit after every coherent step.

## 3. Gates (dse-verify battery on the final HEAD)
Expected: tsc/lint clean · jest 6161 + your new cases / 1 skipped / 249 of 250 · lifecycle 42/42 (halves 21+21; G-S53 grows phases, not scenarios) · e2e 124/124, 0 known-bug, 87/87 · shots 592, 0 FAIL, host-leak 157/942 (34-record boundary), modal 228, input 15/176, checkbox 7/116, prose 106 [212] · freeze 280/280 · parity 0/0/24. Known flakes: SC-506, SC-529, SC-521, and the one-off CHR-F02 from r2 — re-run once and keep both logs.
Shots under load can exceed 600 s: run it as one foreground call first; if killed by the timeout, you may run it in the background ONLY by polling its own per-run-unique log/exit file (never wait for a notification).

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/sc481-r4-fix-report.md`, ≤10-line executive summary first. Logs `sc481-r4-gate-*.log`. One after-fix screenshot of callout twins after form Save upper then lower click (`sc481-r4-*.png`).

## 5. Return contract
Raw facts: verdict, shas (plugin + superproject), gate numbers, red/green per finding, mutation results, `Drive-by fixes:`, `Follow-ups:`, and the absolute path of every artifact.

## Footguns (all apply)
- If the report-file write is blocked, return the report inline.
- Never key a wait-loop on a scratch filename or its contents; per-run unique paths only.
- Redirect long output to files (600 s stream watchdog).
- Gates as blocking foreground calls under 600 s, lifecycle as two `--only` halves; no Monitor.
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc481-twin-block-vanish/draw-steel-elements -- bash <script file>`; no `cd X && …`; `git -C <abs path>` always; exit codes recorded inside script files; never pipe a gate into `tail`.
- Private scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc481-r4-impl-b2/`; Write tool for scratch files; no `rm` with a variable target, no glob `rm`.
- Never `pkill`/`killall` by pattern; only your own PIDs (cwd/cmdline inside your worktree or scratch). Never `rm -rf` a shared `/tmp` glob. Never touch `.superpowers/` beyond your own `sc481-` files; never edit the freeze baseline.
- Unique `DSE_LIFECYCLE_PORT` (93xx). Never tag/release/push.
- You cannot `SendMessage` me. If you need input, end with STATUS: NEEDS_CONTEXT and the question. Any message you do send must start with `SC-481:`.
