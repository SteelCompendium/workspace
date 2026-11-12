# SC-603 r3 — fix round: rebase onto `8b84b635`, two jest cases, full battery

You are the SC-603 implementer (r1 author). If you are a fresh worker, load context from: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc603-focus-after-pool-apply/decisions.md`, your r1 brief `sc603-brief-r1-implement.md`, `sc603-r1-impl-report.md`, and the review `sc603-r2-review-report.md` (all in that dir). Workers never call the tracker. All footguns in the r1 brief §4 still apply (devbox script files, `git -C`, private scratch `…/scratchpad/sc603-r3-impl/`, no glob or variable `rm`, no `/tmp` glob deletes, kill only by PID inside your worktree, foreground gates only, no bracketed ticket ids in e2e titles, never push, never tag, NEEDS_CONTEXT instead of SendMessage, report inline if the write is blocked).

Worktree: `/home/scott/code/steelCompendium/worktrees/sc603-focus-after-pool-apply`; dse HEAD `7813b333` on `b5d18f79`; superproject `9d1568ec`.

## 1. Rebase

The base moved: SC-598 landed, dse `develop` is `8b84b635` (ledger, quoted): "SC-598 touched `src/framework/kit/managedModal.ts` only: a modal opened from a hover preview focuses the preview itself for the opening click (preventDefault, one synthetic click on the anchor, `interactive-child` for 10 ms); an opener's test that counts clicks through the preview now sees TWO; new lifecycle scenario G-S91."

`git -C <plugin> fetch origin`, confirm `origin/develop` is `8b84b635` (if it moved again, rebase onto the newer one and say so), `git -C <plugin> rebase origin/develop`. The reviewer cherry-picked the four commits onto `8b84b635` with no conflicts. `npm ci` if `package.json`'s obsidian version changed. Do not touch the superproject's CHANGELOG commit unless the rebase needs it.

## 2. Findings to fold (verbatim from the review, owner ruling from the ledger)

> **LOW-1** (`view.ts:246`, `initiative-matrix.test.ts:919` [F11]): nothing tests the ruling "restore nothing if focus was not in the tracker when the modal opened". If that check is removed, F11 and every e2e test still pass; only the Reset tests F05 and Q18 fail, and only incidentally. In real Obsidian that broken version pulls focus onto the tracker root (`dse-chrome-anchor`) after a mouse open from the sidebar or a hover preview. Fix: a jest case with focus on body at open, asserting focus stays on body after Apply.

Owner ruling: "FOLD: jest case with focus on body at open, asserting focus stays on body after Apply (show it red with the check removed)."

> **LOW-2** (`MinionStaminaPoolModal.ts:684`): one route the fix covers is in no test and not in the r1 table. Removing a condition inside the pool window rebuilds the tracker while it is open; X or Escape then went to BODY on base and now goes to the rebuilt `init.detail.stamina`. Fix: a jest case next to F10, and optionally an e2e case on `squad-hurt.md`.

Owner ruling: "FOLD: jest case next to F10. No e2e required."

Out of scope (filed, do not fix): SC-608 (outside edit while a tracker modal is open), SC-609 (mouse press on a roster cell while the detail Stamina control has focus). No other changes; no CHANGELOG change needed unless you find the wording now wrong.

Commit the tests as one commit on the dse branch.

## 3. Gates at the rebased HEAD, expected numbers at `8b84b635`

Full battery (the base moved, so nothing carries except via the styles.css check):
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest base **7341 passed / 2 skipped** fresh; expect 7341 + 11 (r1) + 2 (this round) = about **7354 / 2** · lifecycle **57/57**, five `--only` parts, each its own foreground call: `G-S7a … G-S9a` (21); `G-S9b … G-S40` (16); `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9); `G-S57 G-S62 G-S61 G-S56` (4, G-S56 LAST); `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S91` (7; ~395 s, close to the 600 s tool limit — give it the full timeout) — read the exact lists out of dse-verify · e2e base `272/276 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs`; expect **`278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`** · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24 — these carry only if `styles.css` sha256 at HEAD equals a clean `8b84b635` build; verify and state both shas, else run them.

## 4. Report and return

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc603-focus-after-pool-apply/sc603-r3-impl-report.md`, opening with a ≤10-line executive summary (verdict, new dse HEAD and each commit sha, superproject sha, gate numbers). Body: rebase result (conflicts or none), the two new tests with the red evidence, exact gate summary lines, `Drive-by fixes:` / `Follow-ups:`.

Final text to the ticket-owner: raw facts (verdict, shas, numbers) plus absolute paths of every evidence artifact.
