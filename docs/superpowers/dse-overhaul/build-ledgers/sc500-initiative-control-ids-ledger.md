# SC-500 decisions ledger — initiative control ids

Ticket: SC-500 (Linear, Backlog at start). Filed by SC-485 owner as FU3.
Worktree: /home/scott/code/steelCompendium/worktrees/sc500-initiative-control-ids (branch sc500-initiative-control-ids)
Base: dse develop 054c9c5; superproject a094db3.

## Scott rulings (verbatim, dated)

(none yet — thread empty at 2026-10-23)

## Ticket text (Expected, verbatim from SC-500 description)

> **Expected:** give these controls ids (kit `control` option) and `e2e/manifest/` rows, then switch INIT-DEF-E01/E03/E04 to `dse.click`.

Controls: "The Steel turn overlay, the chrome \"Reset encounter\" item and its confirm button".

## Dispatcher scope (not a Scott ruling)

- Keep scope to control ids + coverage; no behaviour change.
- If a lifecycle scenario is added, use G-S41.
- Report land-ready to dispatcher and stop.

## Baselines at dispatch (dse-verify CURRENT @ 054c9c5)

tsc/lint clean · jest 6003 passed / 1 skipped / 242 of 243 suites (fresh worktree: one fewer + 2 skipped until shots run) · lifecycle 36/36 · e2e 114/114 ok, 0 failed, 0 known-bug, coverage 79/79 pairs (expected to RISE) · shots 592, 0 FAIL, button host-leak OK (113 kinds / 678 comparisons, 12-record boundary), modal host-leak (10 … 9 … 38 … 228), input 164, checkbox 60, expected APP.CSS PIN DRIFT warning · freeze 280/280 · parity 0 GAPs / 0 undeclared / 24 DECLARED.

## Log

- 2026-10-23: worktree created (dse 054c9c5, superproject a094db3). r1 implementer dispatched.
- 2026-10-23: r1 implementer (orchestration:implementer, author I1) dispatched with brief sc500-brief-r1-impl.md. Start comment posted; ticket Backlog -> Awaiting (verified).
- Author tracking: I1 = r1 implementer. Review must go to a reviewer identity (R1), never I1.
- 2026-10-23 ~01:31Z: I1 and owner killed by session-limit 429 (reset 23:10 ET). I1 had no commits past 054c9c5, clean tree, no live processes. Dispatcher asked for a resume; I1 resumed via SendMessage with instructions to re-check the worktree and logs first. dse origin/develop still 054c9c5.
- 2026-10-23: dispatcher: dse develop moved 054c9c5 -> 7046eb0 (SC-494 landed: src/authoring/FormModal.ts + shared withReservedKeys helper on block write-back). NEW BASELINES (supersede the 054c9c5 block above for jest only): jest 6026 / 1 skipped / 243 of 244 suites, lifecycle 36/36, e2e 114/114 with 79/79, shots 592, freeze 280/280, parity 0/0/24. Land-ready must be on 7046eb0 (or newer), superproject rebased onto origin/main. I1 told to rebase.
- 2026-10-24 r1 DONE (I1): dse 31c1778 + 4f7aba6 on 7046eb0; superproject on origin/main aa57411, no commits, pointer unstaged. Owner VERIFIED on disk: commits, clean tree, all 8 R*.rc = 0, summary lines. Ids: init.hero.turn, init.reset-encounter, init.reset-encounter.confirm; new e2e/manifest/initiative.ts; kit ChromeMenuItem gains optional `control`. Gates: tsc/lint clean; jest 6027 / 1 skipped / 243 of 244 (= 6026 + 1 new); lifecycle 36/36; e2e 114/114 ok, 0 failed, 0 known-bug, coverage 82/82 (run 20261024-035107-8b70); shots 592, 0 FAIL, host-leak counts unchanged; freeze 280/280; parity 0/0/24. Mutant (drop two ids): E01/E03/E04 0/3 ok, rc 1. No CHANGELOG bullet (test infra; precedent SC-495).
  - Note: E04 run alone failed (hover-revealed chrome, opacity 0); I1 added dse.hover(root.root) before the click. To be checked by reviewer.
  - FU1 ResetEncounterModal Cancel has no id + FU2 "Reset turns (this round)" chrome item has no id: FILED SC-516 (Backlog, related SC-500). OUT OF SCOPE. Hidden .dse-init__turn print checkbox: DROPPED (display:none on screen, print-only control, nothing to drive).
- 2026-10-24: r1 review dispatched to orchestration:reviewer (R1, independent of I1).
- 2026-10-24 r1 REVIEW (R1, independent): LAND-READY, 0 HIGH/MEDIUM, 1 LOW, 3 INFO. Probed: DOM base-vs-tip differs only by the 3 attributes; no empty attribute on other chrome items; manifest-row mutant -> coverage gate FAILED rc 1; base 7046eb0 E04 alone fails the same way (order dependence came with SC-485; hover is a real user step). Gates at tip: tsc/lint clean, jest 6027/1/243 of 244, lifecycle 36/36, e2e run 2 114/114 82/82 rc 0 (run 1: RECOV-R07 flake, unrelated), shots 592 0 FAIL host-leak unchanged, freeze 280/280, parity 0/0/24.
  - Rulings: LOW-1 (manifest/initiative.ts:11 comment implies hover is optional) -> FOLD, r2 comment-only fix by I1. INFO-1 (dse.click CDP fallback), INFO-3 (dse.hover records no coverage, no duplicate) -> DROP, no action, reviewer confirmed correct. INFO-2/F2 (real-Obsidian census does not cover turn overlay/reset modal) -> appended to SC-516. F1 RECOV-R07 flake (w.count 2 under load; test race or product double write) -> FILED SC-517 (Backlog, related SC-500). Both OUT OF SCOPE.
  - r2 (comment-only) re-check: owner reads the one-line diff itself (comment-only change, no code runs differently; allowed for small infra-only diffs) + lint/tsc -p e2e by I1.
- 2026-10-24 r2 DONE (I1): dse 38f94f4 (comment-only, e2e/manifest/initiative.ts, 3+/1-). Owner read the diff: correct, matches LOW-1's fix. lint rc 0, tsc -p e2e rc 0. origin/develop still 7046eb0. No attribution trailers on any commit. Superproject HEAD = origin/main aa57411, only ` M draw-steel-elements` (pointer unstaged).
- 2026-10-24: LAND-READY. Comment posted to SC-500 (no ask; state left Awaiting). Reported to dispatcher: dse 31c1778 + 4f7aba6 + 38f94f4 on 7046eb0; superproject on aa57411, no commits. No CHANGELOG bullet (test infra). No freeze rebaseline. No lifecycle scenario (G-S41 unused). Filed: SC-516, SC-517. Ledger to preserve at landing: this dir -> docs/superpowers/dse-overhaul/build-ledgers/sc500-initiative-control-ids*.
