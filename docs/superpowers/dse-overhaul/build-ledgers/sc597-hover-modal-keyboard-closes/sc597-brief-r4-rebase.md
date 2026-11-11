# SC-597 r4 brief — rebase onto 79da77f8 + r3 fold-ins + full battery (I1 resumed)

Same rules, footguns, scratch conventions and return contract as your r2 brief (`sc597-brief-r2-impl.md` in this dir) — re-read its §4 footguns. Use a fresh scratch subfolder `…/scratchpad/sc597-r4-I1/`. Workers never call the tracker. Never `rm -rf` a `/tmp` glob (lifecycle FAIL dirs: delete only the literal path your run printed). Commit after every coherent step. Gates in the foreground, one blocking call each, output to files.

Read the ledger's r3 result and O10 (`decisions.md`) and the r3 report's exec summary, MEDIUM-1, LOW-1, LOW-2 and INFO-6 (`sc597-r3-review-report.md`).

## Task (O10 verbatim)

> fold into r4 (resume I1): MEDIUM-1 (rebase onto `79da77f8` + full battery), LOW-1 (CHANGELOG: claim only the visible guard change — reviewer's text "On a Montage cell, Ctrl, Cmd or Alt with Enter no longer opens the window, as on the Stamina bar."), LOW-2 (all 4 proposal edits, CURRENT draft rebuilt on 79da77f8), INFO-6 (comment-only reword at `managedModal.ts:209` "a delayed or keyboard open" — no code change in managedModal.ts). INFO-1..5: no action.

1. `git -C /home/scott/code/steelCompendium/worktrees/sc597-hover-modal-keyboard-closes/draw-steel-elements fetch origin`; confirm `origin/develop` = `79da77f8` (report if it moved further; rebase onto whatever it is and say so). Rebase the dse branch (`ca31aa14`, on `4f0c87f2`) onto it. Save `git range-diff 4f0c87f2..ca31aa14 79da77f8..<new>` to `sc597-r4-range-diff.log` (all should be `=`).
2. INFO-6: reword the comment at `src/framework/kit/managedModal.ts:~209` so it no longer suggests the keyboard openers take that branch (they now open inside a click). Comment only; a separate commit.
3. LOW-1: worktree superproject `CHANGELOG.md` bullet text per the quote. If the superproject's `origin/main` moved, rebase the superproject branch onto `git -C <wt> fetch origin` → `origin/main` (CHANGELOG-only; resolve keeping both sides). Do not bump the dse pointer.
4. LOW-2: the four proposal edits in `sc597-dse-verify-proposal.md` (r3 report LOW-2 items 1-4), with the CURRENT draft rebuilt on `79da77f8` using your measured r4 numbers, demoting the SC-592 CURRENT block (the one that is CURRENT in the main checkout's SKILL.md when you finish — check it), and the INFO-6 comment noted if it matters.
5. Full battery on the rebased head (expected, dse develop `79da77f8`): tsc (incl. `-p e2e`) and lint clean · jest about **7283 passed / 2 skipped** fresh worktree (7261 + 22) · lifecycle **56/56** as five `--only` parts 21 + 16 + 9 + 4 + 6 (G-S56 last in part 4; part 5 `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87`) · e2e **`OBSIDIAN-E2E done: 264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`** · `styles.css` sha256 equal to a clean `79da77f8` build (expected `5e5ff488…`; if it differs, STOP with NEEDS_CONTEXT) → shots/freeze/parity carry.

## Report

`sc597-r4-rebase-report.md` (≤10-line exec summary first: old/new dse head, range-diff verdict, new commit(s), superproject sha, every gate number, styles sha). Gate logs `sc597-r4-gate-*.log`. Final text: raw facts plus absolute paths.
