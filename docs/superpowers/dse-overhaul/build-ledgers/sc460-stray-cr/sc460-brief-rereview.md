# SC-460 scoped re-review (resume of the R1 reviewer) — the fix-round delta only

- Read: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc460-stray-cr/sc460-fix1-report.md` (exec summary first) and the ledger's 2026-10-21 rulings in `decisions.md`.
- Delta: `git -C /home/scott/code/steelCompendium/worktrees/sc460-stray-cr/draw-steel-elements range-diff 188755b..3045082 ba20072..84636a9` plus `git diff 7f7e3d4..84636a9 (7f7e3d4 = rebased 3045082)`. Rebased onto `ba20072`; confirm the rebase carried the R1 content unchanged (range-diff) and resolved nothing silently.
- Check, by EXECUTING:
  1. MEDIUM-1: your own CR-only probes in real Obsidian (Reading view, Live Preview, sidebar stamp) stay CR-only; LF/CRLF/mixed unchanged; rerun your fuzz under the ruling.
  2. MEDIUM-2: re-apply your mutants M2, M3, M4, M5, M15 (the implementer reported kills only for M2/M3/M5/M17/M18 — M4 and M15 are unreported, check them) and the three call-site reverts (`:80`, `:636`, `:215`) — each must now fail ≥1 test.
  3. LOW-1: mutant M17 must now fail ≥1 test.
  4. Nothing beyond the three findings changed (SC-471 `aliasAtLine` untouched).
  5. Gates at the fix head: tsc, lint, jest, lifecycle, e2e re-run; shots/freeze/parity may reuse the implementer's numbers only if the delta provably cannot change rendering (say so). Expected: tsc+lint clean · jest 5329 passed / 1 skipped / 230 of 231 · lifecycle 28/28 · e2e 83/87 ok, 0 failed, 4 known-bug, 57/57 pairs · shots 572 · freeze 276/276 · parity 0/0/24.
- All footguns from `sc460-brief-review.md` §4 apply (private scratch `sc460-review-<timestamp>/`, no commits to the branch, `git -C`, no pattern kills, no shared-/tmp-glob rm, never call Linear, NEEDS_CONTEXT instead of messaging).
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc460-stray-cr/sc460-rereview-report.md`, ≤10-line exec summary first. Return VERDICT (LAND-READY / FIX-REQUIRED), severity counts, head sha, gate numbers, artifact paths.
