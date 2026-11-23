# SC-644 r6 scoped check

## Executive summary
- Verdict: **LAND**. dse `2762beb5` on `origin/develop` `10c271fe`; superproject `7d8ca778` on `origin/main` `20004425` (changelog `e0be5a87` + ONE bump to 2762beb5).
- Range-diff `12aaf5b5..16737a8e` vs `10c271fe..2762beb5`: commits 1-6 all `=` (identical); the only new commit is `2762beb5`, 4 tests (one hero re-render + owner count, three nested-focus).
- Those tests close my r4 LOW-1..3 as prescribed: mutants R10, R12, R15, R16 re-run on 2762beb5 are all KILLED (3 / 1 / 1 / 1 red of 62).
- Superproject diff vs origin/main: `CHANGELOG.md` + `draw-steel-elements` only. The SC-644 bullet sits under `## Unreleased` after the SC-628 bullet, merged cleanly.
- SET-X03: **NOT implicated**. `fields.e2e.ts` never calls `setPrefs` (the LOW-6 change), and each spec file runs in its own Obsidian session. Nothing in this branch runs in that path: no pref flip, so no chrome rebuild and no focus restore.
- Repro under the same load on both heads at once: `--only=SET-X03` passed 6/6 on 2762beb5 and 6/6 on base 10c271fe; `--element=settings` passed 2/2 on each (head `78/82 ok, 0 failed, 4 known-bug`; base `74/80 ok, 0 failed, 6 known-bug`). The flake was not reproduced.
- It is the existing SET-X03 picker flake class (SC-440 R4-M1: 3/7 stale item clicks, then 1/16 "picker never opened"), now a third mode. A Backlog ticket is warranted (text below).

## 1. Rebase / new tests
- `git range-diff 12aaf5b5..16737a8e 10c271fe..2762beb5`: `cd4770cf = 16e60bc3`, `87177e09 = 7f665c74`, `8d33d03c = c2448a37`, `411e8a50 = f319c409`, `3a0e79a3 = 8a9a301e`, `16737a8e = 59cef7c2`, `> 2762beb5` (new).
- `2762beb5` (test only: `heroSheet.test.ts` +29, `chromeLivePrefs.test.ts` +38) adds:
  - hero: re-rendering itself (update) with the setting ON still has exactly one working button; flips leave no owners behind → R15, R16;
  - the outer block's Collapse is focused again, not the nested block's same-named control → R10;
  - with a nested block present, the outer pencil going leaves focus on an outer control → R10;
  - with a nested block present and no Collapse left, focus falls to the OUTER block's first control → R12.
- Mutant re-run on a private `git archive` copy of 2762beb5 (suites chromeLivePrefs + heroSheet, 62 tests): R10 KILLED 3 · R12 KILLED 1 · R15 KILLED 1 · R16 KILLED 1. Restored after each.
- Worktree and superproject clean before and after.

## 2. SET-X03 diagnosis
- **Failure** (author's run 1, `e2e.log` line 245, worker `[0-61]`): `timed out waiting for the picker to filter to Settings/token.svg` at `fields.e2e.ts:64`. So the picker DID open (the `.suggestion-item` wait at :55 passed), but after `browser.keys('token')` the list never narrowed to the single `Settings/token.svg`. SET-X04 is a dependent failure: its `ensureState` found `defaultImagePath` still `Media/token_1.png`, because X03 never picked or cleared. Run-wide: `587/606 ok, 2 failed, 17 known-bug, coverage: 414/416` (the 2 missing pairs are X03's own). The author's next two full runs were green.
- **Why not our driver change**:
  - LOW-6 changed only `setPrefs` (`e2e/driver/dse.ts`: `await diskData()` before `saveData`). `fields.e2e.ts` has no `setPrefs` call. X01-X03 use `openNote`, `openAt`, `diskData` and `readSettings`, all unchanged by SC-644; X04's `ensureState` reload runs after the failure.
  - Each spec file gets a fresh Obsidian session (`[0-61]` ran only `fields.e2e.ts`), so an earlier spec's `setPrefs` timing cannot carry over.
- **Why not the product change**:
  - The SC-644 runtime paths are the `watchPrefs` rebuild (runs only on a pref change; X03 changes none, `defaultImagePath` is a plain setting, not a pref), `holdChromeFocus` / `restoreFocus` (acts only when focus was in a block's chrome when it is rebuilt; nothing focuses chrome here), and the hero button (no hero in this spec).
  - The picker and its input live in the settings popout window; the note's blocks are in the main window.
- **Repro**: on private `git archive` copies of 2762beb5 and of 10c271fe, run at the same time (load 4.7 rising to 17):
  - `--only=SET-X03` ×6 each: head 6/6 ok, base 6/6 ok.
  - `--element=settings` ×2 each: head `78/82 ok, 0 failed, 4 known-bug` both times; base `74/80 ok, 0 failed, 6 known-bug` both times. SET-X03 passed in all 4 runs.
- **Likely cause** (inferred, not proven): the keys are sent the moment `.suggestion-item` appears, but the picker's input does not yet hold focus, or the popout window lost key focus under the full run's ~8-way parallel load. `browser.keys` then types somewhere else and the list never filters. The bundle cannot settle it: the artifact step runs after the `finally` closed settings, so `screenshot.png` shows the main window and `modals.html` is empty (0 bytes). The picker's state at the timeout was never captured.
- **Ticket** (Backlog, e2e flake; link SC-440):
  1. Symptom: SET-X03 intermittently times out "waiting for the picker to filter to Settings/token.svg" (picker open, typed `token` not applied); SET-X04 then fails on `defaultImagePath`. Seen 1 in 3 full runs during SC-644 r5; 0 of 16 targeted runs; earlier SC-440 modes were stale item clicks and the picker not opening.
  2. Likely cause: `browser.keys('token')` is sent as soon as `.suggestion-item` exists, before the picker's input owns key focus in the settings popout under parallel load (an assumption; the failure bundle does not capture the settings window).
  3. Repro / next step: full `npm run e2e` under load (no targeted repro yet). Wait for `document.activeElement` to be the picker's input (or focus it) before typing, and make the failure bundle capture the settings popout before `closeSettings()` runs.

## Evidence (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc644-r6-rev/`)
- Mutants: `mutants6.py`, `r6-mutants-run1.out`, `r6-mutant-*.log`.
- Repro: `x03-head.sh`, `x03-base.sh`, `r6-x03-head-1..6.log`, `r6-x03-base-1..6.log`, `r6-settings-head-1..2.log`, `r6-settings-base-1..2.log` (+ `.rc`).
- Copies: `dse-copy/` (2762beb5), `base-copy/` (10c271fe).
