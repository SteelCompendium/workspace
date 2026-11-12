# SC-606 r4 — scoped re-review of the r3 delta

Same reviewer as r2b; same footguns and command shapes as `sc606-brief-r2b-review-replacement.md` + `sc606-brief-r2-review.md` (no rm, script files via Write, `devbox run -c <copy path> -- bash <script>`, output to files, one gate per foreground call, never rm -rf a /tmp glob, never pkill by pattern, no bracketed ticket id in a test title, never touch the main checkout or the worktree's files). New scratch subdir `sc606-r4-<yourAgentId>/`. Workers never call the tracker.

Context: ledger `decisions.md` (the r2b finding rulings), the r3 report `sc606-r3-rebase-report.md`. The branch was rebased onto dse develop `5f7c5336` and the fix round added commit(s) on top: review ONLY `git -C <plugin> diff 00a990b5..7866426e` (the fix delta) plus a check that the rebase carried the r1 diff unchanged (`git range-diff 8b84b635..df250b20 5f7c5336..00a990b5`), and the CHANGELOG bullet in the superproject worktree head `bf06aa8b`.

Probe, do not just read:
1. MEDIUM-1 closed: re-run your DOM probe cases `KEYLESS.edit-save-unchanged`, `KEYLESS.edit-note-only`, the result-only edit, and the keyed-hero reorder case on the r3 head: no key written, order unchanged. Also: a real skill change in an edit (Climb -> Lift, same hero) and a hero change in an edit still move the skills correctly.
2. LOW-1 closed: scalar `skills_used: Climb` — reuse warning fires, add -> [Climb, X], remove of Climb -> [], reset -> [], an unrelated write leaves `skills_used: Climb` byte-identical.
3. LOW-2: timers reset in afterEach.
4. New tests red on the pre-fix rebased head, green on r3 head.
5. Spot gates on r3 head: jest (7708 passed / 1 skipped in the worktree after shots, = 7707 / 2 fresh; in a `git archive` export 2 extra skips from token-coverage are by design), lifecycle part 5 and part 6 (`G-S92`), e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`. Trust r3's shots/freeze/parity unless the delta touches CSS or rendered DOM.

Report `sc606-r4-rereview-report.md` (≤10-line executive summary first: verdict LAND/FIX, findings by severity with file:line, measured numbers). Final text: raw facts plus every artifact path.
