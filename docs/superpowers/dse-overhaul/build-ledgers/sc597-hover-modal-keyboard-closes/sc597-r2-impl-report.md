# SC-597 r2 implementation report (identity I1)

## Executive summary
- STATUS DONE. dse branch `sc597-hover-modal-keyboard-closes`, rebased onto `origin/develop` `4f0c87f2` (owner's mid-task request). Old head `b84e28b1` (on `94133a5a`), new head `ca31aa14`. `git range-diff 94133a5a..b84e28b1 4f0c87f2..ca31aa14`: all 4 commits `=`.
- Commits (new shas): `77c87885` fix (StaminaBarPanel `bar.click()`, BoardView `cell.click()` + the stamina bar's guards, 22 jest tests), `09192295` Escape test checks scope order 20 ms after the key, `228ef79c` G-S87, `ca31aa14` tsc cast fix. Superproject `07b54207` (CHANGELOG only; dse pointer NOT bumped, left as an unstaged change).
- tsc (incl. `-p e2e`) rc 0, lint rc 0. jest **7260 passed / 2 skipped / 261 of 262 suites** (7238 + 22), measured twice (pre- and post-rebase). No SC-568 timeouts hit.
- lifecycle **56/56** = 21 + 16 + 9 + 4 + 6; wall 183 / 323 / 418 / 298 / 351 s (loadavg 3-7). Part 5 351 s (brief expected ~345). Part 3 418 s (no G-S64 change).
- e2e `OBSIDIAN-E2E done: 262/267 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` (124 s, run after the rebase).
- styles.css sha256 `5e5ff488…` identical on the fixed build and the 94133a5a archive build, so shots/freeze/parity carry (not re-run).
- Red on base: G-S87 on the 94133a5a bundle, committed harness: all 4 trials FAIL at the 1.5 s step (popover false, modal false). Green on the fixed bundle (part 5, and a scratch run).
- Mutants: 23/23 killed (K1-K5 per opener, K6, each of 6 keydown guards per opener). The first pass had K6 survive; the Escape test was fixed and everything re-run.
- Drive-by: the SC-595 CHANGELOG bullet's sentence "still closes by itself a moment later (SC-597)" was removed, since it is no longer true.

## Product change
- `src/framework/kit/StaminaBarPanel.ts`: `makeKeyboardOperable(bar, s, owner)` (the `open` param and the `onBarClick` argument dropped); the keydown handler calls `bar.click()`; doc comment adopted from the r1 prototype.
- `src/elements/montage/BoardView.ts`: the cell keydown now has `evt.target !== cell`, modifier (Ctrl/Meta/Alt), `evt.repeat` and `evt.defaultPrevented` guards, then `cell.click()`. Checked first: the cells that have a keydown listener (logged cell, open past-round cell) contain only `aria-hidden` spans and divs, no focusable child. The empty current-round cell with the quick buttons has no keydown listener. So the target guard is parity and defence, with no keyboard behaviour lost. SC-498 keyboard tests pass unchanged.
- No change to `managedModal.ts`.

## Tests
- `test/dom/elements/stamina-bar.test.ts` new describe "SC-597: the Stamina modal opened by the keyboard from a bar in a hover preview" (10 tests): Enter and Space (one click reaches the popover container with the bar as target, modal open synchronously, one `.modal-container`, keydown default-prevented); Escape order (fake timers, popover stand-in arms a literal 10 ms push; at 20 ms and at 220 ms the top scope is not the popover's; Escape closes the modal and the popover scope is back on top); control outside a preview (one container click, one window click, one modal); Ctrl/Meta/Alt+Enter, held Enter, another key (no click, no modal, not default-prevented); an Enter already default-prevented, and a key from a child of the bar.
- `test/dom/elements/montage.test.ts` new describe "SC-597: the Montage sheet opened by the keyboard from a board cell in a hover preview" (12 tests): the same set, with Enter and Space on a logged cell and on an empty past-round cell.
- Titles carry no bracketed ticket id. The stand-in never reads `HOVER_HELPER_DELAYS_MS`.

## Mutants (`sc597-r2-mutants.log`, runner `sc597-r2-mutate.py.txt`)
- K1 (revert to base) s/m, K2 (no `bubbles`) s/m, K3 (click on the parent) s/m, K4 (two clicks) s/m, K5 (deferred) s/m, K6 (`managedModal.ts` arms re-pushes at once: killed by both Escape tests), G1-G6 (target, ctrl, meta, alt, repeat, defaultPrevented) for the montage cell and the stamina bar: 23 of 23 killed. Each restored with `git checkout HEAD -- file` and `git diff --stat` verified empty.
- Note: K6 first survived because the Escape test waited 200 ms (past the modal's 150 ms re-push, which masks it). It now checks the top scope at 20 ms.

## Lifecycle G-S87
- Part 5, after G-S83, before G-S56. 4 trials: stamina Enter RV, stamina Enter LP, stamina Space RV, montage Enter RV. Steps as in r1 §4 (real Ctrl-hover, pointer rests on the card, script `.focus()` + CDP key, 1.5 s: preview and modal open; real title click keeps both; stamina Healing 3 + real Apply click writes `current_stamina: 18`, no Notice, modal closed, preview shown, reopen by the same key + Escape 450 ms later closes only the modal; montage Escape closes the sheet; pointer away 1.2 s keeps the preview; real outside click closes it).
- New fixtures `Lifecycle/gs87-mont.md` and `gs87-mont-host.md`; stamina fixtures shared with G-S83. Header comment (SC-597 paragraph, 56 scenarios) added.
- G-S87 alone green about 48 s.

## Docs
- Worktree superproject `CHANGELOG.md`: new `## Unreleased` bullet (SC-597), SC-595 bullet's stale sentence removed. Commit `07b54207`.
- `sc597-dse-verify-proposal.md` in the ledger dir: footgun (7) replacement, new footgun (11) (CDP `text: '\r'`), 55 -> 56 and part-5 list, CURRENT block draft with the measured numbers (landing sha left as a placeholder).

## Commit trailers
Commits carry no Co-Authored-By trailer: the user's global CLAUDE.md forbids it and takes precedence over the attribution reminder.

Drive-by fixes:
- CHANGELOG.md (SC-595 bullet): removed "A window opened from the keyboard alone ... still closes by itself a moment later (SC-597)", made false by this change.

Follow-ups:
- None new. The montage target guard cannot currently differ from no guard (no focusable children on keyboard cells); it is parity for future cells.
- Two temp dirs from my own red-on-base runs (`/tmp/dse-obsidian-lifecycle-LoaqsX`, `-XCIK87`) were deleted by literal path; the FAIL shot was copied to the ledger dir.

## Evidence files (all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc597-hover-modal-keyboard-closes/`)
- `sc597-r2-gate-tsc.log`, `sc597-r2-gate-lint.log`, `sc597-r2-gate-jest.log`, `sc597-r2-gate-e2e.log`, `sc597-r2-gate-lifecycle-part1.log` ... `part5.log`, `sc597-r2-gate-styles-sha.log`
- `sc597-r2-mutants.log`, `sc597-r2-mutate.py.txt`
- `sc597-r2-red-on-base-G-S87.log`, `sc597-r2-red-on-base-G-S87-FAIL.png`, `sc597-r2-gs87-head-scratch.log`
- `sc597-dse-verify-proposal.md`, this report.
