# SC-586 decisions ledger — Conditions modal: two display mismatches from hand-written YAML

Ticket: SC-586 (Linear). Owner: ticket-owner (Opus 5.5). Worktree:
`/home/scott/code/steelCompendium/worktrees/sc586-conditions-yaml-display` (branch
`sc586-conditions-yaml-display` in every submodule), cut 2026-11-13 from superproject
`b31eb542`, dse `develop` `3a5986d3`.

## Ticket text (verbatim, 2026-11-13)

> 1. **A named colour opens the colour chooser at white.** With `color: teal`, the custom-colour
>    button is marked selected and says "teal, selected", but opening the chooser starts at white
>    instead of teal.
> 2. `icon: ""` **presses no icon choice.** The row shows the default icon, but "Use default" is
>    not shown as selected.
>
> Agent notes: (1) `src/views/ConditionsModal.ts:486` copies the colour into `input.value` only
> when it is `#rrggbb`; a CSS name leaves `#ffffff`. (2) The row uses `entry.icon?.trim() ||`
> default (l.282), but "Use default" is pressed only when `value === entry.icon` (l.386).
> SC-436 adds two `test.failing` markers citing this key, one per item.

The two markers live in `test/dom/views/conditions-modal-matrix.test.ts` (~l.982-1006).

## Scott rulings

(none yet — ticket had no comments at pickup)

## Owner decisions (2026-11-13)

- D1. No decision needed from Scott: the ticket states the expected behaviour for both items.
- D2. Item 1: the chooser must open at the colour the row already shows. Any CSS colour the
  row renders (named, `#rgb`, `#rrggbb`, `rgb()/hsl()`, any case) should seed the chooser
  with its `#rrggbb` equivalent; alpha is dropped (the native input has none). A value the
  browser cannot parse keeps today's behaviour (white). Opening and closing the chooser
  without picking writes nothing to the note.
- D3. Item 2: "Use default" is pressed whenever the row draws the default icon because of
  a blank `icon:` (`""`, whitespace-only), matching l.282's `trim() ||` rule. No change to
  what the note holds unless the user picks something. Same trim rule for the pressed state
  of a named icon (`icon: "skull "` draws skull, so the skull choice is pressed) and for the
  l.426 "keep the current icon visible" rule (a whitespace-only icon must not add a blank
  `Icon:` chip). Owner read of the code, 2026-11-13.
- D4. Both `test.failing` markers become plain tests. Add one real-Obsidian e2e test per
  item in the Conditions-modal spec (item 1 is about the browser's colour parsing, which
  jsdom cannot prove). No bracketed ticket id in any test title.

## Rounds

- r1 implement (implementer, Sonnet) 2026-11-13: dse `b01923eb` `39f605a4` `38abf402` `ca79d4ee`
  `57618b62`, superproject CHANGELOG `25f315ea`. New `src/elements/conditionColorHex.ts`
  (computed-style resolve). jest 11807/2 fresh; lifecycle 62/62; e2e 333/336 ok, 0 failed, 3
  known-bug, 176/176; shots 592 / 163/978 / 40/240 / 147; freeze 280/280; parity 0/0/24.
  Revert proof: 10 jest + 2 e2e (COND-H01, COND-H02) fail without the fix.
- r1 follow-up rulings (owner, 2026-11-13):
  - ~~F1 `oklch()` / `color(display-p3 …)` / `currentcolor` / `inherit` still seed white: DROP
    unless r2 review shows the row renders them as a visible colour Scott could hand-write in
    practice — exotic syntax, no regression vs base, and the pipette state is SC-361's rule.~~
    superseded by the r2 rulings below (F1 FOLD; also the claim was wrong: `currentcolor` /
    `inherit` / `unset` / `revert` seed `#dadada` in Electron, not white).
  - F2 `ds-conditions` `model.ts:34` drops blank icons while the initiative path keeps `""`:
    DROP — different surface, no visible mismatch.
- r2 independent review (reviewer, Opus): dispatched 2026-11-13 on dse `57618b62`.
- 2026-11-13 dispatcher: SC-616 landed (harness only, `visual-harness/obsidian-lifecycle.mjs`
  G-S91). New base: dse develop `1cc54eac`, workspace main `6c9af039`. Numbers unchanged (jest
  11794/2, lifecycle 62/62 in seven parts, e2e 331/334 ok, 0 failed, 3 known-bug, 176/176;
  main.js/styles.css identical to `3a5986d3`). Plan: r2 review continues on `57618b62`; the
  post-review round rebases dse onto `1cc54eac` and the superproject branch onto `6c9af039`
  (CHANGELOG commit + ONE pointer bump, no interim pointer commits), then re-runs the battery.
- r2 review (reviewer, Opus) 2026-11-13: LAND, 0 HIGH / 0 MEDIUM, 3 LOW, INFO. Gates re-run,
  all as r1. Report `sc586-r2-review-report.md`.
- r2 rulings (owner, 2026-11-13) — all go into r3 fix round:
  - LOW-1 FOLD: fix the `conditionColorHex.ts:12-14` doc comment (keywords resolve against
    body, `#dadada`; oklch/lab/lch/color()/color-mix pass `CSS.supports` but computed style
    keeps them non-rgb).
  - LOW-2 (= F1) FOLD: 1x1 canvas readback when the computed value is not `rgb()`, guarded
    for no 2D context; jest test with a `getContext` stub; e2e oklch condition expecting
    `#239382` on pinned 1.14.4.
  - LOW-3 FOLD: the `"skull "` test asserts exactly one chip whose trimmed label is `Icon: skull`.
  - INFO CHANGELOG `#AABBCC` FOLD: drop upper-case hex from the "newly fixed" list (it worked on base);
    mention oklch()-style colours instead if the fold lands.
  - Other INFO: DROP (pre-existing, consistent with the row; SC-361's string compare).
- r3 fix round (implementer, resumed r1 identity) + rebase onto dse `1cc54eac` / workspace `6c9af039`.
- 2026-11-13 dispatcher: SC-619 landed. New base dse develop `df92a3f6`, workspace main
  `65098e06` (supersedes `1cc54eac` / `6c9af039` above). Numbers: jest 11817/2 fresh;
  lifecycle 63/63, part 7 = `G-S108,G-S112`; e2e 331/334 ok, 0 failed, 3 known-bug, 176/176;
  shots 592, freeze 280/280, parity 0/0/24. Relayed to the r3 implementer mid-round.
- r3 fix (implementer) 2026-11-13: dse head `6be3d411` on `df92a3f6` (r3 pair `cb7e0889`,
  `6be3d411`); superproject `c7bcdd97` (CHANGELOG) + `cea0eb59` (single pointer bump) on
  workspace origin/main `fd727403`. jest 11833/2 fresh; lifecycle 63/63; e2e 334/337 ok,
  0 failed, 3 known-bug, 176/176; shots 592 / 163/978 / 40/240 / 147; freeze 280/280; parity
  0/0/24. Revert: canvas jest 1 fail, COND-H03 fails, LOW-3 2 fails.
- r4 scoped re-review (reviewer, r2 identity) of `8144bfc4..6be3d411` + rebase sanity: dispatched.
- r4 scoped re-review 2026-11-13: LAND, 0 HIGH/MEDIUM/LOW, 3 INFO. jest 11834/1 (cache),
  e2e 334/337 ok, 0 failed, 3 known-bug, 176/176; range-diff all `=`; superproject 2 ahead.
- r4 rulings (owner, 2026-11-13):
  - INFO-1 FOLD (test only): the oklch jest test feeds `OKLCH(60% 0.1 180)` and still expects
    the painted string `oklch(0.6 0.1 180)`, pinning "paint the computed value".
  - INFO-2 DROP: no measured spelling makes the canvas reject a computed value; black vs white
    for an unreadable colour is equally "not that colour", and no regression vs base.
  - INFO-3 FOLD (comment only): `cond-handwritten.e2e.ts` header names the three cases.
- r5 tiny fold (implementer) then scoped check (reviewer): dispatched.
- r5 fold (implementer) 2026-11-13: dse `14521bf0` (test + e2e comment only; `git diff
  6be3d411 14521bf0 -- src` empty), superproject `c7bcdd97` + `a65d2ab9` (pointer -> `14521bf0`)
  on origin/main `fd727403`. jest 11833/2 fresh; e2e 334/337 ok, 0 failed, 3 known-bug,
  176/176; INFO-1 revert proof 1 failed. Owner checked the 15-line test/comment diff itself
  (no runtime code; reviewer's r4 LAND covers all product code).
- LAND-READY 2026-11-13: dse `14521bf0` on develop `df92a3f6`; superproject `a65d2ab9` on
  workspace main `fd727403`. Reported to dispatcher.
- DONE 2026-11-13: landed by the dispatcher on dse develop `14521bf0`, workspace main
  `bc4754b0` (ledger preserved + dse-verify updated in `85f7d100`; worktree removed). Ticket
  set Done via linear-post.py `--state Done`; verified status Done.
