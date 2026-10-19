# SC-290 decisions ledger — DSE write-back drops a fence's info string

Worktree: /home/scott/code/steelCompendium/worktrees/sc290-info-string (every submodule on branch `sc290-info-string`)
Repo touched: draw-steel-elements (tracked branch `develop`, cut at origin/develop 0d69ec9)

## Spec (ticket description, 2026-08-29, verbatim)

> Both `SidebarBlockHost.replaceSource` and `ReadingModeBlockHost.replaceSource` re-emit the fence line as `${fence}${language}` from an `OPEN_FENCE = /^([`~]{3,})(\S*)/` first-token parse, so any interactive write to a block whose fence carries an info string past the language token (e.g. ```` ```ds-counter extra ````) rewrites the fence line and silently drops the extra tokens.
>
> Fix: preserve the full info string in both `replaceSource` re-emits.
>
> Context: `.superpowers/sdd/sc184-sidebar-investigation/sc184-rereview-report.md` § N-6.

## Scott rulings

(none yet — 2026-10-19: ticket picked up from Backlog with no comments; the description is the spec)

## Owner rulings

- 2026-10-19: pipeline = implementer -> independent reviewer (Opus) -> fix rounds -> scoped re-review -> land-ready. Full dse-verify battery required (lifecycle + e2e mandatory).

## Rounds / authorship

- R1 implement: orchestration:implementer (identity IMPL-1), brief sc290-brief-impl.md, report sc290-impl-report.md — dispatched 2026-10-19.
- R2 review: orchestration:reviewer (fresh identity REV-1), brief sc290-brief-review.md (fill head/base shas at dispatch).
- R1 result (IMPL-1): DONE, head 013063a (e019932 fix+jest, 013063a e2e RECOV-I01 + DSE CHANGELOG). Gates: jest 4746/1 skipped/227 of 228; lifecycle 25/25; e2e 60/72 ok, 0 failed, 12 known-bug, 47/47 pairs; shots 572; freeze 276/276; parity 0/0/24.
- R2 review dispatched 2026-10-19 (REV-1) on 013063a.

## Follow-up rulings (owner, 2026-10-19)

- CRLF: SidebarBlockHost can't locate a block in a CRLF note (pre-existing) -> FILED SC-453 (Backlog). Out of scope for SC-290.
- Dead src/utils/CodeBlocks.ts with the same re-emit bug -> FILED SC-454 (Backlog). Out of scope for SC-290.
- dse.expectNoteBlock / makeFakeContext don't recognise info-string fences -> DROPPED: test-helper limitation; the e2e reads raw lines, and only matters if more info-string tests are written (SC-454/453 owners can extend it then).
- 2026-10-19 dispatcher: dse origin/develop moved 0d69ec9 -> 7644fb3 (SC-430 landed). New baselines: jest 4761 passed / 1 skipped / 227 of 228 · lifecycle 25/25 · e2e 61/72 ok, 0 failed, 11 known-bug, 47/47 pairs · shots 572 · freeze 276/276 · parity 0/0/24. "Rebase onto 7644fb3 before reporting land-ready."
  Owner plan: let REV-1 finish on 013063a (no mid-review rebase); the post-review round (IMPL-1 resume) rebases onto 7644fb3 and re-runs the full battery. Expected after rebase: jest 4775 (4761+14) · e2e 62/73 ok, 0 failed, 11 known-bug, 47/47. Rebase delta then goes to scoped re-review.
- R2 result (REV-1): APPROVE on 013063a. 1 LOW, 4 INFO (all INFO pre-existing, not worsened). Gates re-measured identical to R1.

## Review-finding rulings (owner, 2026-10-19)

- LOW-1 (no test rows for space-before-language fence and tabs between tokens) -> FOLD into R3 fix round.
- INFO-1 (e2e integrity check sees only first fence token) -> FILED SC-456. ~~dse.expectNoteBlock / makeFakeContext limitation DROPPED~~ superseded: folded into SC-456.
- INFO-2 (space-before-language fence -> empty language, relocate fallback can't find it) -> FILED SC-457.
- INFO-3 (block in callout/blockquote: write silently skipped, no Notice) -> FILED SC-455.
- INFO-4 (CRLF note gets mixed line endings after a write) -> appended to SC-453.
- R3 = IMPL-1 resume: rebase onto 7644fb3 + LOW-1 rows + full battery. R4 = REV-1 scoped re-review of the delta (REV-1 authored nothing).
- 2026-10-19 dispatcher: dse origin/develop moved 7644fb3 -> f8e050f (SC-324 landed). "Rebase onto f8e050f (not 7644fb3) before reporting land-ready." New baselines: jest 4767 / 1 skipped / 227 of 228 · lifecycle 25/25 · e2e 61/72, 0 failed, 11 known-bug, 47/47 · shots 572 · freeze 276/276 · parity 0/0/24. Expected after rebase: jest 4781 + LOW-1 rows · e2e 62/73 ok, 0 failed, 11 known-bug. R3 redirected via SendMessage.
- 2026-10-19 dispatcher: dse origin/develop moved f8e050f -> a89ffd9 (SC-426 landed). "Land-ready must be on a89ffd9." Baselines: jest 4769 / 1 skipped / 227 of 228 · lifecycle 25/25 · e2e 62/72, 0 failed, 10 known-bug, 47/47 · shots 572 · freeze 276/276 · parity 0/0/24. Expected after rebase: jest 4783 + LOW-1 rows · e2e 63/73 ok, 0 failed, 10 known-bug. R3 redirected again.
- 2026-10-19: IMPL-1 killed by API session limit mid-R3 battery (after rebase onto a89ffd9 + LOW-1 commit c78a06b). Resumed via SendMessage to re-run the full battery on c78a06b.
- R3 result (IMPL-1): DONE. Base a89ffd9, head c78a06b (437489c fix+jest, 1c3b57a e2e+changelog, c78a06b LOW-1 rows; 4 rows fail on base). CHANGELOG conflict with SC-324 resolved keeping both. Gates on c78a06b: jest 4787/1 skipped/227 of 228 · lifecycle 25/25 · e2e 63/73 ok, 0 failed, 10 known-bug, 47/47 · shots 572 · freeze 276/276 · parity 0/0/24. (Battery was the pre-kill run on c78a06b; owner verified log mtimes postdate the commit.)
- R4 scoped re-review dispatched to REV-1 (range-diff, LOW-1 rows, RECOV-I01 after SC-430/426).
- R4 result (REV-1): APPROVE on c78a06b; LOW-1 closed; RECOV-I01 2/2 ok on head. LAND-READY 2026-10-19: dse branch sc290-info-string @ c78a06b on develop a89ffd9.
