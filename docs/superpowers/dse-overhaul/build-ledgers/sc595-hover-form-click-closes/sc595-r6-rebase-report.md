# SC-595 r6 — rebase onto c3fd8323, r5 MEDIUM-1, full battery

## Executive summary
- STATUS DONE. dse branch `sc595-hover-form-click-closes` head `6725243c`, rebased onto `origin/develop` `c3fd8323` (SC-578). Clean, no conflicts; `git range-diff` shows all 9 pre-round commits `=`. Two new commits for MEDIUM-1 and the G-S83 step. `npm ci` not needed.
- Superproject head `6152eb69`, rebased onto workspace `origin/main` `ae04f37b`. One trivial CHANGELOG conflict (SC-578 bullet vs ours) resolved by keeping both, ours on top. The `draw-steel-elements` pointer is modified and unstaged.
- r5 MEDIUM-1 fixed: the keymap tests use the literal 10 / 150 ms (`test.each([[10],[150]])`, fake timers; a new "popover pushes above the modal at N ms" test); G-S83 gets a `stamtext` trial (Stamina modal opened by a real press on the bar's number text, Escape 450 ms later). M16 is red in jest (2 tests) AND in G-S83 on a scratch M16 bundle (only the new trial fails).
- Full mutant table re-run (M1-M16, R1-R4): all killed except M7a (equivalent) and R4 (jsdom-blind, caught by G-S83 per r5).
- Gates: tsc + lint clean; jest 7231 passed / 2 skipped; lifecycle 55/55; e2e 260/265 ok, 0 failed, 5 known-bug, 164/164 pairs; `styles.css` `5e5ff488…` byte-identical to a clean `c3fd8323` build, shots/freeze/parity carry.
- No glob rm this round: one kept FAIL dir (my M16 run) removed by its literal path `/tmp/dse-obsidian-lifecycle-CbDDQ6`.

## Range-diff (dse, old `a53b0454` base `6c7216e8` -> new base `c3fd8323`; `sc595-r6-range-diff.log`)
Old shas are the ones on the `6c7216e8` base (the r4 report). Mapping (old -> new), all `=`:
`89b8f71c`->`6640536d`, `818513e3`->`cd39d9e2`, `dbfffe52`->`ab5a23d3`, `74b138f0`->`bfcd0bc7`, `a4aba989`->`c5ac2d21`, `d616ccd8`->`a2d3cd75`, `0873b589`->`a72f5769`, `2a8c56af`->`870720fe`, `a53b0454`->`d15616bc`.
New: `20078044` and `6725243c test(SC-595): G-S83 opens the Stamina modal by a press on the bar's number text…`.
Superproject: `dbd8b939`->`93fa0c2f`, `701674ac`->`6152eb69`.

## MEDIUM-1
- `test/dom/kit/managedModal.test.ts`: `POPOVER_PUSH_DELAYS_MS = [10, 150]` literals replace every use of `HOVER_HELPER_DELAYS_MS` (the import is gone); `pastRepush` waits a literal 200 ms; the form test waits a literal 200 ms.
- The old "5 ms then pastRepush" keymap test became `test.each([[10],[150]])` on fake timers: the popover's helper timer is armed BEFORE the modal opens (the modal's re-pushes are armed after, as in Obsidian), at t = N-1 the modal is on top, at t = N the popover pushes then the modal re-pushes, the modal ends on top, after close the popover's scope is on top. M16 (`[10]`): the 150 ms case is red.
- G-S83 `stamtext` (RV): real hover, press on the first text node inside the stamina bar (150 ms helper path), wait 450 ms, Escape -> modal closed, preview still shown. G-S83 alone: 63 s (≤ 90 s).
- Proofs: jest M16 red (2); `sc595-r6-m16-bundle-G-S83.log` (scratch bundle from `git archive 6725243c` with `[10]`): FAIL only `stamtext modal rv: Escape must close the modal… {"popover":true,"modal":true}`; every other trial passes.
- Corrections: dated note appended to `sc595-r4-fix-report.md` (history not rewritten); proposal §4 rewritten (literal-delay rule, M16 correction, R4 note, stamtext footgun).

## Mutants (`sc595-r6-mutants.log`, 32 SC-595 jest tests, unmutated 32/32)
| Mutant | Red | Mutant | Red |
|---|---|---|---|
| M1 drop guard | 15 | M11 `contains()` | 2 |
| M2 preventDefault | 15 | M12 sync removal | 5 |
| M3 drop re-push | 5 | M13 arm at open | 2 |
| M4 drop `.hover-popover` condition | 7 | M14 no newest check | 1 |
| M5 capture phase | 10 | M15 no active-window check | 1 |
| M6 0 ms | 4 | **M16 `[10]` only** | **2 (+ G-S83 red)** |
| M7a dseOpen check only | 0 (equivalent, layered defence) | R1 arm in capture | 3 |
| M7 all three close guards | 2 | R2 `[150]` only | 2 |
| M8 FreeHeal anchor | 2 | R3 guard never removed | 1 |
| M9 conditions panel anchor | 1 | R4 microtask removal | 0 in jsdom (G-S83 FAILs it, r5 INFO-3; not re-run, src unchanged) |
| M10 montage anchor | 1 | | |
r5's R5-R7 (judged equivalent by the reviewer) were not repeated.

## Gates (final head `6725243c` on `c3fd8323`)
| Gate | Result | Log |
|---|---|---|
| tsc incl. `-p e2e` / lint incl. `e2e/` | clean, rc 0 / clean, rc 0 | `sc595-r6-gate-tsc.log`, `-lint.log` |
| jest (fresh, `rm -f main.js styles.css` first) | 2 skipped, **7231 passed** (7199 fresh `c3fd8323` + 32), suites 261 passed / 1 skipped, rc 0 | `sc595-r6-gate-jest.log` |
| lifecycle p1 / p2 / p3 / p4 / p5 | **21/21** (183 s) / **16/16** (322 s) / **9/9** (415 s) / **4/4** (297 s) / **5/5** (312 s) = **55/55** | `sc595-r6-gate-lifecycle-p1.log` … `-p5.log` |
| e2e | `OBSIDIAN-E2E done: 260/265 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`, rc 0, 166 s | `sc595-r6-gate-e2e.log` |
| styles.css | `5e5ff4884e05fb2a…` byte-identical to a clean `c3fd8323` build; no CSS diff; shots 592 / 163/978 / 39/234 / 147, freeze 280/280, parity 0/0/24 carry (not run) | `sc595-r6-gate-styles-sha.log` |

## Follow-ups
- Popout windows still not probed. R4's jsdom blindness is covered only by G-S83. SC-597, SC-598 untouched.

## Artifacts (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc595-hover-form-click-closes/`)
`sc595-r6-rebase-report.md`, `sc595-r6-mutants.log`, `sc595-r6-m16-bundle-G-S83.log`, `sc595-r6-range-diff.log`, `sc595-r6-gate-{tsc,lint,jest,e2e,styles-sha}.log`, `sc595-r6-gate-lifecycle-p1.log` … `-p5.log`, `sc595-dse-verify-proposal.md` (CURRENT updated), `sc595-r4-fix-report.md` (correction note). Worktree `/home/scott/code/steelCompendium/worktrees/sc595-hover-form-click-closes`. Scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc595-r6-impl-a/`.
