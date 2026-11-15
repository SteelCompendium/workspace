# SC-649 R4 scoped re-review (the R3 delta)

## Executive summary
- Verdict: **LAND-READY**. 0 HIGH, 0 MEDIUM, 0 LOW, 1 INFO (a CHANGELOG wording nit).
- Plugin `5f962390` on dse develop `2777484c` (= origin/develop). `git range-diff 3e88b3f5..8df960e3 2777484c..742a7b4d`: both R1 commits are `=` (identical).
- `d83ad953` is right and display only. Same Argument is drawn `checked && !argumentUsesMotivation()`; the stored flag is untouched, the note is not written on render, and un-pressing the motivation draws the box checked again with the Same table.
- Mutants run in a scratch copy, all killed. `checked: arg.reusedMotivation` (1 red); `checked: arg.sameArgumentUsed` (2 red); persist on render (both new byte compares red); strip the ghost and persist on render (the same 2 red); model `argumentUsesMotivation` made raw (new unit test plus 3 dom tests red); Same never checked (2 red).
- CHANGELOG bullet: first under `## Unreleased`, every claim matches the shipped behaviour (one nit, INFO-1).
- Superproject `a7532b61`: exactly 2 commits over origin/main `fded411f` (e4cb35e3 CHANGELOG, a7532b61 pointer). The gitlink is `5f962390`; only `CHANGELOG.md` and `draw-steel-elements` change, no other submodule moved, and there is no AI trailer.
- My gates on `5f962390`: tsc rc=0, lint rc=0, jest `1 skipped, 13345 passed, 13346 total`, e2e `--element=negotiation` `62/68 ok, 0 failed, 6 known-bug` (NEGO-A12/A13/A14 ok).
- Implementer logs spot-checked (written after the `5f962390` commit time): lifecycle 64/64; e2e full run 2 `598/613 ok, 0 failed, 15 known-bug, coverage: 417/417 pairs`; shots 592 / 978 / 240 / 147; freeze 280/280; parity 0/0/24.

## (1) d83ad953: Same Argument as drawn
- `src/drawSteelAdmonition/negotiation/ArgumentView.ts:304-311`: `const motivated = this.data.argumentUsesMotivation()`, `checked: arg.sameArgumentUsed && !motivated`, `disabled: motivated`. It only paints; nothing is assigned to `arg` and there is no `persist()`. The roll (`:341-346`) still passes the raw `arg.sameArgumentUsed`, which is correct: `ArgumentPowerRolls.ts:51-62` shadows it whenever a motivation is shown, so the box and the tiers agree in every state.
- Tests (`test/dom/elements/negotiation-bugs.test.ts`):
  - "a stale sameArgumentUsed in the note with a motivation chosen…": the box is `{checked:false, disabled:true}`, the tiers are the motivation table, and the bytes do not change across a flush.
  - The click path: check Same, then press Peace (box unchecked and disabled, motivation tiers, the written note still has `sameArgumentUsed: true`). Un-press Peace (box checked and enabled, Same tiers). Complete at High writes [2,2] and the flag ends false.
- e2e NEGO-A12 and NEGO-A13 (which press a motivation after checking Same) still pass.

## (2) Mutants (scratch copy of `5f962390`, `test/dom/elements/negotiation*` + `test/unit/model/negotiation*`, 635 tests)
| Mutant | Result |
|---|---|
| m1 `:297` `checked: arg.reusedMotivation` | 1 failed: the Case 2 Complete test ("…the Reuse box is drawn unchecked and greyed out…") |
| m2 `:308` `checked: arg.sameArgumentUsed` | 2 failed: both new Same Argument tests |
| m3 `build()` persists after `sync()` | killed: both byte-compare tests + 5 older "zero writes" tests |
| m4 `build()` strips ghost entries then persists | killed: same set as m3 |
| m5 `argumentUsesMotivation` -> `motivationsUsed.length > 0` | 4 failed: the new unit test, K11, the Case 1 Complete test, the Same-not-greyed test |
| m6 `:308` `checked: false` | 2 failed: the click-path test + "SC-439 A … the three modifiers write their own flag" |

The source was restored after each run (`diff -r` against the head copy is clean).

## (3) INFO-1 byte compares are genuine
`raw()` returns `app.vault.getContent('Note.md')`, the file text. Both checks take `before` after mount and compare it after `flush()` (past the 400 ms debounce), so a render-time write lands inside the window. m3 and m4 prove it: each makes both byte checks fail. A synchronous write during mount would slip past `before`, but the negotiation writes only through the debounced `persist`, and the older "rendering performs ZERO writes" test also covers that path.

## (4) CHANGELOG (worktree `CHANGELOG.md`, first bullet under `## Unreleased`, above SC-631)
Each claim, checked against the shipped code and probes:
- Before the fix, a ghost name pressed no chip but the tiers used the Motivation / Pitfall table, and Complete applied it: true (R2 revert run).
- A hand-typed `reusedMotivation: true` with the box drawn unchecked: true.
- After the fix, a name with no match counts as no appeal, and Reuse counts only when its box is checked: true (`argumentReuseChecked`).
- The reverse case (Same drawn checked while the roll ignored it), now drawn unchecked: true (d83ad953).
- Opening the note leaves the YAML unchanged: true (byte tests, R2 P8). Restoring the name makes it count again: true (R2 P10).

### INFO-1: CHANGELOG wording nit
"…the result tiers still used the Motivation (or Pitfall) table, Same Argument was greyed out…" reads as if a ghost Pitfall also greyed out Same Argument. Only a ghost Motivation did (Same's disabled state never read pitfalls). Optional: "…and, for a Motivation, Same Argument was greyed out…". It does not block landing.

## (5) Superproject (`/home/scott/code/steelCompendium/worktrees/sc649-negotiation-roll-counts`)
- `git log origin/main..HEAD`: `a7532b61 chore: bump draw-steel-elements to 5f962390 (SC-649: …)` and `e4cb35e3 docs(changelog): SC-649 …`. Both are authored by Scott Tomaszewski, with empty bodies: no Co-Authored-By and no "Generated with" line.
- `git diff --name-only origin/main HEAD`: `CHANGELOG.md`, `draw-steel-elements`. `ls-tree HEAD draw-steel-elements`: `160000 commit 5f962390269965599e68f48d69b6a31022ec0872`.
- `git submodule status`: no `+` or `-` prefix on any submodule. `git status --porcelain`: clean.

## Gates
Mine, on `5f962390` (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc649-r2-reviewer/r4/`):
- tsc `rc=0` (`g-tsc.log`), lint `rc=0` (`g-lint.log`).
- jest `Tests:       1 skipped, 13345 passed, 13346 total` rc=0 (`g-jest.log`).
- e2e `--element=negotiation`: `OBSIDIAN-E2E done: 62/68 ok, 0 failed, 6 known-bug, coverage: 55/417 pairs (partial run: gate skipped)` rc=0 (`g-e2e-nego.log`).

Implementer's logs, spot-checked (`…/scratchpad/sc649-r1-impl/r4-*.log`, mtimes 21:03-21:55 -0500, after the 21:01 commit time of `5f962390`):
- jest `1 skipped, 13345 passed, 13346 total`.
- lifecycle 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3, rc=0 each.
- e2e run 1 `596/613 ok, 2 failed, 15 known-bug, coverage: 415/417 pairs` (SET-X03/X04, SC-657). Re-run `2/2 ok`. Run 2 `598/613 ok, 0 failed, 15 known-bug, coverage: 417/417 pairs` rc=0.
- shots 592 `ok`, button host-leak 163 × 3 × 2 = 978, modal 40 kinds = 240, capture clip 147, rc=0.
- freeze `280/280`. Parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).`

## Tree state
The plugin's `git status --porcelain --ignored` is identical before and after, and the superproject's `git status --porcelain` is clean before and after (`status-before-*.txt` / `status-after-*.txt` in the r4 folder). The heads are still `5f962390` / `a7532b61`.
