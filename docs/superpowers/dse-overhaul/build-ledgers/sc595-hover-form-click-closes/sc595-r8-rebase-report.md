# SC-595 r8 — rebase onto ec26b709, r7 INFO-1, full battery

## Executive summary
- STATUS DONE. dse branch `sc595-hover-form-click-closes` head `94133a5a`, rebased onto `origin/develop` `ec26b709` (SC-574). Clean; `git range-diff` shows all 11 pre-round commits `=`. Two new commits (INFO-1).
- Superproject head `f18a69e8`, rebased onto workspace `origin/main` `f2cb454b`, no conflict; SC-595 bullet on top, every other bullet kept. The `draw-steel-elements` pointer is modified and unstaged.
- INFO-1: G-S83 `stamtext` now asserts `elementFromPoint` at the press point is the number's own element (`h === textNode.parentElement`) and the text is a digit, and records the hit: `"15" on dse-stamina__ccur`.
- Offset proof: press x +300 px (scratch edit, reverted by `git checkout`) -> G-S83 FAILS on the assertion (`hit: dse-stamina__cluster dse-chrome-anchor`, `onText: false`). My first version used `h.contains(n)`, which an ancestor satisfies, so the +300 run passed; tightened to the exact element and re-proved.
- Gates: tsc + lint clean; jest 7238 passed / 2 skipped; lifecycle 55/55; e2e 262/267 ok, 0 failed, 5 known-bug, 164/164 pairs; `styles.css` `5e5ff488…` byte-identical to a clean `ec26b709` build, so shots/freeze/parity carry. Mutants carry (src untouched since r6; only the harness changed).
- No glob rm: the two kept FAIL dirs this round were removed by literal path (`/tmp/dse-obsidian-lifecycle-lgMdrt`, `…-MwwQE7`).

## Range-diff (old `6725243c` base `c3fd8323` -> new, all `=`; sha mapping)
`6640536d`->`af1f3c46`, `cd39d9e2`->`340a652f`, `ab5a23d3`->`c4981a56`, `bfcd0bc7`->`4927ddb5`, `c5ac2d21`->`c970f538`, `a2d3cd75`->`f2190d3d`, `a72f5769`->`c3bb6636`, `870720fe`->`3abae7fd`, `d15616bc`->`4dbcf6b9`, `e6475ff4` (r6 literal-delay commit; was `20078044`), `3c5db81c` (G-S83 stamtext; was `6725243c`). New: `037b71d4` (assert + record), `94133a5a` (exact element). Superproject: `93fa0c2f`->`aa6a1972`, `6152eb69`->`f18a69e8`.

## Gates (head `94133a5a` on `ec26b709`)
| Gate | Result | Log |
|---|---|---|
| tsc incl. `-p e2e` / lint incl. `e2e/` | clean rc 0 / clean rc 0 | `sc595-r8-gate-tsc.log`, `-lint.log` |
| jest (fresh) | 2 skipped, **7238 passed** (7206 + 32), suites 261 passed / 1 skipped, rc 0 | `sc595-r8-gate-jest.log` |
| lifecycle p1 / p2 / p3 / p4 / p5 | **21/21** (186 s) / **16/16** (324 s) / **9/9** (404 s) / **4/4** (298 s) / **5/5** (304 s) = **55/55** | `sc595-r8-gate-lifecycle-p1.log` … `-p5.log` |
| e2e | `OBSIDIAN-E2E done: 262/267 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`, rc 0, 172 s | `sc595-r8-gate-e2e.log` |
| styles.css | byte-identical to a clean `ec26b709` build; no CSS diff | `sc595-r8-gate-styles-sha.log` |
Recorded hit in part 5: `stamtext modal rv (real hover): opened by a real press on the bar's number text ("15" on dse-stamina__ccur), Escape 450 ms later closed the modal (preview shown)`. G-S83 alone about 64 s.

## Artifacts (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc595-hover-form-click-closes/`)
`sc595-r8-rebase-report.md`, `sc595-r8-stamtext-offset-proof.log`, `sc595-r8-gate-{tsc,lint,jest,e2e,styles-sha}.log`, `sc595-r8-gate-lifecycle-p1.log` … `-p5.log`, `sc595-dse-verify-proposal.md` (CURRENT updated). Worktree `/home/scott/code/steelCompendium/worktrees/sc595-hover-form-click-closes`. Scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc595-r8-impl-a/`.
