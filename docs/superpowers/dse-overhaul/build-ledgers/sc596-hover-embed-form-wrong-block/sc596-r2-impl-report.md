# SC-596 r2 implementation report (implementer)

**Executive summary**
- Status DONE. dse branch `sc596-hover-embed-form-wrong-block` HEAD `c02598c1` on `origin/develop` `5f7c5336` (rebased first; develop had moved from da2bdbc6; package.json unchanged, no `npm ci`). Superproject worktree: CHANGELOG commit `88322232` (submodule pointer NOT bumped, left for land-stack / wt-finish). No pushes, no tags.
- Rule as ruled: a form's pin in an embed / hover preview of part of a note is placed like a card's (`rebaseCardPin`); `rebasePin`, `verifiedPinLine`, `embedStartLine`, `searchedPinLine` deleted; no pin => REFUSING pin (nothing written, forced Notice), list items / footnotes keep their wording.
- Q4 verdict: SAME. Card sweep (2880 cells) writes the twin in 0 cells, but 5 of 5 named null-pin card shapes wrote the twin at base (P13 +, P13 -, N1, N4, N3b). Folded: the same refusing pin for card writes, 5 tests red before / green after.
- jest 10600 passed / 2 skipped (7685 + 2915 new in `reading-mode-host-form-pin.test.ts`: 2880 sweep + 29 named + 6 card); tsc (incl. `-p e2e`) and lint clean. Red on base: 1179 of the 2915 fail (392 `not TWIN`, 720 null pins, 67 other).
- Lifecycle 59/59 in six parts: 21 (185 s) + 16 (324 s) + 9 (406 s) + 4 (298 s) + 7 (393 s) + 2 `G-S92,G-S96` (176 s). G-S96 red on base: 7 of 7 pane cells wrote the TWIN, no Notice; green: nothing written, one Notice, form open, outside edit kept.
- e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`. styles.css `5e5ff488…dc2b27` = clean 5f7c5336 build: shots / freeze / parity carry (not re-run).
- Found and fixed a miss in r1: existing lifecycle phase G-S64 `(zh)` (hover form, `[[note#^id]]`, identical block above) expected a refusal; with the rule the hover's link places the pin and Save lands in the linked block. Re-targeted (first part-3 run red, log kept).
- Mutants: 18, 16 killed, 2 survived (m4, m12: equivalent, as in r1). Q2: shape list below.

## Setup
- `git fetch origin`: origin/develop = `5f7c53367b22a0ddcbdf6731ab832a4662423ba9`; branch rebased cleanly (no commits of its own before). Base bundle `main.js` a5245070…, styles.css `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27`. Fix bundle main.js 7786a78e…, styles.css identical.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc596-r2-impl/` (base-tree = `git archive 5f7c5336` export with node_modules symlinked, used for `DSE_LIFECYCLE_BUNDLE`).

## Commits (dse)
1. `83417942` test: the new sibling file `test/dom/framework/reading-mode-host-form-pin.test.ts` (sweep + named shapes), red on base.
2. `033a1e22` fix: forms placed by `rebaseCardPin`, refusing pin, four functions deleted, comments rewritten; the 16 flipped tests re-modelled / rewritten in `reading-mode-host-pin.test.ts`.
3. `a65207fc` fix: the same refusing pin for card writes (Q4 fold) + 6 card tests.
4. `2c0bc7a3` test: card tests assert the Notice kind (kills mutant m18).
5. `05fcfc76` test: lifecycle G-S96 (8 cells).
6. `f142ae87` test: G-S64 (zh) re-targeted; sweep also asserts the form has a pin.
7. `c02598c1` docs: a comment names `rebaseCardPin`.
Superproject: `88322232` CHANGELOG bullet under `## Unreleased`.

## Q4 measurement (BEFORE touching card code), `sc596-r2-q4-card-sweep-base.log`, `sc596-r2-q4-card-named-base.log`
Scratch jest on the rebased base, card write = `notePersistIntent()` + `replaceSource(body, {fromView: true})` (the card's + 7), same 2880 cells as the form sweep (8 constructs x 6 link shapes x RV/LP x edit x + x cache x 2 layouts):
| outcome at base | cells |
|---|---|
| A (the block's own) | 408 |
| TWIN | **0** |
| refused, "changed on disk first" | 1752 |
| refused, "can't be edited yet inside lists" / "can't tell where" | 492 / 228 |
Null-pin cells in the sweep are only list items / footnotes (720; all refused). The sweep does not reach the null-pin shapes of the form probe, so the named shapes were run as cards:
| shape (card + / -) | base: pin | base: result |
|---|---|---|
| P13: callout `^cal` embed, host knows 6, part shows 5, no own-write record, A edited to 9, upper callout holds 6 | null | **wrote the upper callout** (+ and -), no Notice |
| N1: callout, block written by another host, part stale, twin holds the known body | null | **wrote the twin** |
| N4: heading hover callout, stale part, no record, twin callout holds the known body | null | **wrote the twin** |
| N3b: block embed, section resolved at build then null at the click, A edited, twin elsewhere | null | **wrote the twin** |
Verdict SAME => folded (`a65207fc`): `takePin` returns the refusing pin for a card too (no section; no own fence and no record). Tests: `SC-596: a card write in an embed or hover preview that cannot be pinned…` (5 refusal tests + 1 control that a placeable card still writes and a non-embedded card keeps no pin), red 5 of 5 on the pre-fold code (`sc596-r2-jest-card-red-before-fold.log`), green after. Full jest / lifecycle / e2e show no other card flip.

## Q2 CONDITION: shapes whose close-on-redraw behaviour changes
A form is kept open past its card only when `hasPin()` is true AND `keepFormOpenOn()` names the registry (the source note is shown in some other markdown leaf, plugin loaded). Without that pane the form closes with its card exactly as before in every shape. So the shapes below, when the note is also open in another pane, now stay open (before: closed, no Notice). A form that stays open here can write NOTHING (evidence column):
| shape (embed / hover of PART of a note, RV and LP) | base pin | now | evidence |
|---|---|---|---|
| list item (all 6 link shapes: block / heading embed, block / heading hover, whole-note embed / hover) | null | refusing ("inside lists" wording) | sweep: 360 cells, each asserts pin present AND refused + Notice kind `unsavable-list`/`unsavable`, never TWIN. Base red: 360 `Expected: "pin"` failures |
| footnote (same 6 link shapes) | null | refusing | sweep: 360 cells, same assertions (base: 360 null pins) |
| non-plain window (callout, quote) whose text holds no block with the known body and this host has no own-write record (block written by another pane; record dropped) | null | refusing ("can't tell where") | named P13 verbatim, N1, N4: pin not null, nothing written, Notice kind `unsavable` |
| section resolved at build, null at the pencil | null | refusing | named N3b: pin not null, nothing written, `unsavable` |
| section never resolved (getSectionInfo null) | null | refusing; `canPersist` false so the host writes nothing and reports nothing, FormModal says "couldn't save" itself | named N3: pin not null, `replaceSource` false, note unchanged, 0 host Notices |
All other shapes already had a (partial) pin at base and are unchanged: plain fence, callout, quote shapes with an own fence in the part. Keep-open mechanics: existing `formModal.test.ts` (a pinned form whose host names a holder stays open and closes with the holder; no pin => closes). "The reviewer checks none can write": the sweep asserts `outcome` equals the oracle for all 2880 cells (list / footnote always `refused`), never TWIN.

## Rule implementation
- `ReadingModeBlockHost.takePin()` (no parameter now; `forForm` removed): no section => refusing pin when embedded; no own fence => `pinFromLastWrite() ?? refusingPin()` when embedded; the SC-584 r7 record guard unchanged; `link = src ?? hoverLinkOf(...)` for every pin; `pinRebased.set(pin, this.rebaseCardPin(...))` for every pin. `refusingPins` WeakSet + `refusingPin()`; `replaceSource` refuses it before `pinnedTarget` (`unplaceable` + `listShape`: the existing "can't tell where" / "inside lists" Notice, forced for forms, rate limited for cards).
- Deleted: `rebasePin`, `verifiedPinLine`, `embedStartLine`, `searchedPinLine`. `rebaseCardPin` doc now carries what `rebasePin`'s explained. Comments that said "the text search places the pin" rewritten (source and tests).

## Tests
- New: `reading-mode-host-form-pin.test.ts` 2915 tests: sweep 2880 (`test.each`, oracle per cell: outcome, Notice kind, pin present, never TWIN), named P4 x5, P13 x2, N1, N3, N3b, N4, W1 (asserts exactly `['Twin','Edited']`), X1, X2, Y1-Y6 (Y1/Y2/Y3 x embed/hover, Y5, Y6), r5a x3, r5b x4 controls, card shapes x6. The oracle was written from the r1 sweep table and agreed with the fix on the first run (2880/2880).
- `reading-mode-host-pin.test.ts` (16 flipped tests, all re-modelled per the r1 list):
  - 7 model flips re-modelled the way Obsidian draws it (V1-V3 heading embed with `src` + a cache that follows the note, V3 with a settle before the outside edit; V5 hover with the `hover-link` record; V8 cache follows the note; V9 a real + by the host; V10 `src` + cache). Each of the 7 passes on base AND on the fix (`sc596-r2-jest-remodelled-pin-on-base.log`: on base exactly the 9 refusal tests fail).
  - 3 not-produced shapes (no `src`, link without `#` on a part, link to another note) and 6 by-design refusals (lagging cache x2, two identical `## Tracker` sections, unresolved subpath, no metadata cache, a field removed from the block from outside before the open) rewritten to assert nothing written + `droppedWriteMessage`, with the reason in the test comment.
  - `pos` / `cacheOf` hoisted to file level (shared by the heading-embed describe and r6).
- Red on base: `sc596-r2-jest-red-on-base.log` (final test file against `5f7c5336` src): 1179 failed / 1736 passed of 2915 (392 `Expected: not "TWIN"` cells, 720 `Expected: "pin"` cells, the rest are the 12 saved-to-refused cells, 36 refused-to-saved cells, named shapes and the 5 card shapes).
- Mutation check (`sc596-r2-mutants.log`, runner `sc596-r2-mutate.py.txt` + `sc596-r2-run-mutants.sh.txt`): killed = at least one test fails across `reading-mode-host*` and the hover tests (3557 tests). m1 no refusing pin without a section (3 fail), m2 no refusing pin without own fence (7), m3 refusing branch off (724), m4 refusing pin not in `partialPins` (**survived, equivalent**: the refusing branch runs before `pinnedTarget`), m5 no `hoverLinkOf` (22), m6 no rebase (472), m8 always partial (23), m9 whole-part check (3), m10 one-heading check (29), m10b one-marker check (3), m11 marker-after-block (7), m12 final body check (**survived, equivalent**: `pinnedTarget` checks the body), m13 own-write fallback (31), m14 link resolves to this note (2: now killed, r1 had it unreachable), m15 `popoverShows` (5), m16 hanging heading line (3), m17 the r7 record guard (2), m18 refusing branch skipped for cards (survived while the card tests counted Notices only; the card tests now assert the kind: 5 fail, killed). 18 mutants, 16 killed.

## Lifecycle G-S96 (`sc596-r2-lifecycle-gs96-on-base.log`, `sc596-r2-gate-lifecycle-part6.log`)
8 cells (block embed RV control without the second pane; block embed RV and LP, heading embed RV of two `## Tracker`, block hover RV and LP, heading hover RV and LP, each with the source note in a second pane); the pencil is clicked by a script in the same page task as the outside write, the part is still the old one (`staleAtOpen` asserted), Save. Base bundle: **7 of 7 pane cells wrote the TWIN, no Notice**, the control passed. Fix bundle: all 8 green (nothing written, exactly one `…changed on disk first.` Notice, form still open, 9 kept). Part 6 `G-S92,G-S96` wall 176 s (G-S96 alone ~71 s on the base run). Fixtures follow the heading hover section with `## After`. Titles carry no bracketed ticket id.

## Gates (final, rebased branch; code last changed in `a65207fc`, later commits are tests / comments)
| gate | result | log |
|---|---|---|
| tsc, tsc -p e2e, lint (src main.ts e2e) | 0 / 0 / 0 | `sc596-r2-gate-tsc-lint.*` |
| jest | 10600 passed / 2 skipped (265 suites + 1 skipped), 60 s, no timeouts (one run) | `sc596-r2-gate-jest.log` |
| lifecycle part 1 | 21/21, 185 s | `sc596-r2-gate-lifecycle-part1.log` |
| part 2 | 16/16, 324 s | `…part2.log` |
| part 3 | 9/9, 406 s (first run 415 s with the (zh) FAIL: `…part3-first-run-zh-red.log`) | `…part3.log` |
| part 4 | 4/4, 298 s | `…part4.log` |
| part 5 | 7/7, 393 s | `…part5.log` |
| part 6 `G-S92,G-S96` | 2/2, 176 s | `…part6.log` |
| e2e | `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`, 133 s | `sc596-r2-gate-e2e.log` |
| styles.css | `5e5ff488…dc2b27`, equal to the clean 5f7c5336 build => shots 592 / host-leak 163/978 / modal 39/234 / clip 147, freeze 280/280, parity 0/0/24 carry, not re-run | (build lines above) |
Union lifecycle 21+16+9+4+7+2 = 59/59. `--only=` is comma-separated (the brief's space notation: `G-S92,G-S96`).

## Docs
- `/home/scott/code/steelCompendium/worktrees/sc596-hover-embed-form-wrong-block/CHANGELOG.md` bullet under `## Unreleased` (user-facing; the rare refusing shape and the stale-callout card refusal are named).
- dse-verify proposal (SKILL not edited): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc596-hover-embed-form-wrong-block/sc596-dse-verify-proposal.md`.

## Drive-by fixes
- `src/framework/host/lineMap.ts` comment and the G-S64 comment in `visual-harness/obsidian-lifecycle.mjs` named the deleted `rebasePin` (comments only; same files the change touches).
- `takePin`'s now-unused `forForm` parameter removed (a direct consequence of the change, not a separate fix).

## Follow-ups (left alone)
- Owner decision to note: a REFUSING pin on a CARD write is rate limited like every card Notice (one per note per 5 s); a second blocked + within the window is silent (existing card behaviour for dropped writes).
- SC-607 now limits forms too (a still-open preview follows what its link names now): already ruled not covered.
- The jest heading-hover model (`['', ...block, '', '']`) assumes the section ends at a heading; a real last section carries trailing text. Only matters for fixtures (G-S96's does follow the section with `## After`).
- r1 did not run the full lifecycle under the probe, so it missed G-S64 `(zh)`; future "probe rule" designs should run all six parts, not only jest.
- The superproject worktree shows `draw-steel-elements` as modified (the pointer to the new branch tip); `just wt-finish` / land-stack bumps it.
