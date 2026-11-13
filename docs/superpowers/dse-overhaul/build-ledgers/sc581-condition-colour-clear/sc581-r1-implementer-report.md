# SC-581 r1 implementer report

**Executive summary**
- Verdict: DONE. A "Default" text chip is now first in the Conditions editor's Color group; pressing it deletes `color`.
- dse branch `sc581-condition-colour-clear` head `14513d4a` (base `1516f894`, origin/develop unchanged); superproject `4a28dd5d` (CHANGELOG only; NO pointer bump committed, `draw-steel-elements` shows modified in the superproject by design).
- tsc clean (`npm run tsc`, exit 0) / lint clean (exit 0).
- jest: 11707 passed / 2 skipped (baseline 11692 / 2, +15 new; the SC-581 marker is now a normal passing test).
- lifecycle: 61/61 (21+16+9+4+7+4), 0 failed, G-S91 did not flake.
- e2e: `OBSIDIAN-E2E done: 330/333 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (baseline 328/331, 174/174; +COND-D18, COND-D19; +2 pairs = cond.color-default click + press:Enter).
- shots: 592 ok, 0 FAIL, button host-leak 163/978, modal host-leak 40 kinds/240 (baseline 39/234: +1 kind = the pressed Default chip), capture clip 147.
- freeze: 280/280 byte-identical (nothing to rebaseline; no rebaseline.txt). parity: 0 / 0 / 24.

## What changed
- `draw-steel-elements/src/views/ConditionsModal.ts` `renderSwatches` (~l.468-481): first child of the `[role=group][aria-label=Color]` row is `<button type=button class="dse-optchip dse-swatches__default">` with visible text "Default", `aria-label="Default"`, `title="Default (no colour)"`, `stampControl('cond.color-default')`, `setPressedState(!isConditionColor(entry.color))`. New `clearColor(index)` (just before `setColor`): `delete conditions[index].color`, `emitChange`, `renderList`, `focusPickedOption(index,'Color','Default')`.
  - Pressed logic: Default is pressed exactly when no preset and not the pipette is selected (no colour, or an unparseable one), so exactly one option is pressed in every start state (tested).
  - Keyboard: the group has no arrow-key handling; swatches are plain Tab stops, and the Default button is a native button, so Tab/Enter/Space work identically (e2e COND-D19 proves Tab+Enter).
  - Re-pressing a selected preset is unchanged.
- `styles-source.css` (~l.2184): `.dse-swatches` gains `flex-wrap: wrap` (the extra chip must not overflow a narrow modal) and `.dse-swatches .dse-swatches__default { flex: none; }`. The chip otherwise is a plain `.dse-optchip` (pressed = accent border, same as Duration/Effect chips; Steel scoping already provided by the existing optchip rules; no colour literals).
- `e2e/manifest/conditions-modal.ts`: `cond.color-default: c(['click','press:Enter'], ['D18','D19'])`; header says COND-D01..D19.
- `e2e/specs/conditions-modal/cond-editor.e2e.ts`: COND-D18 (Dazed red -> Default: note equals `{key,duration,effect}`, `color` key absent, pressed ['Default'], row glyph `--dse-condition-color` empty, then Green sets `#1e8449`), COND-D19 (Tab to Default + Enter: one write, no `color`, focus on `cond.color-default`/"Default", pressed). No bracketed ticket id in any title.
- `test/dom/views/conditions-modal-matrix.test.ts`: `test.failing('SC-581: …')` -> `test(...)`; row title now "…writes that colour again and keeps it pressed (no toggle-to-unset: the Default option clears)"; stale "SC-581 may change" comment removed; new `describe('the Default option')` (first control/text/title/id; pressed state x 6 start colours with exactly-one-pressed; clear from preset / upper-case preset / custom hex / CSS name removes the key (`'color' in … === false`, other fields kept); focus on rebuilt Default; row preview loses colour then regains; no-colour no-op; plain-string condition).
- `test/dom/e2eCensus.test.ts`: `cond.color-default` count 1.
- `draw-steel-elements/docs/initiative-tracker.md` (Color bullet): Default documented.
- Superproject `CHANGELOG.md`: bullet under `## Unreleased`. DESIGN.md untouched (its component map does not list the swatch row).

## Proof the marker fails without the fix
`git checkout -- src/views/ConditionsModal.ts` (fix removed, test flipped), `npx jest test/dom/views/conditions-modal-matrix.test.ts -t SC-581`: `Tests: 1 failed, 325 skipped, 326 total` (log `.../scratchpad/sc581-r1-impl/jest-nofix.log`). With the fix: passes. Fix restored from patch.

## Gates (exact lines)
- `npm run tsc`: exit 0. `npm run lint`: exit 0.
- jest: `Tests: 2 skipped, 11707 passed, 11709 total` / `Test Suites: 1 skipped, 272 passed` (no shots cache at run time).
- lifecycle: `done: 21/21`, `16/16`, `9/9`, `4/4`, `7/7`, `4/4` ok, 0 failed (SC-622 appearance.json never dirtied: `git status` clean).
- e2e: `OBSIDIAN-E2E done: 330/333 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`.
- shots: 592 `ok`, 0 FAIL; `button host-leak OK (163 button kinds x 3 states ... = 978 comparisons`; `modal button host-leak OK (10 modal scenarios over 9 modal classes, 40 button kinds ... = 240 comparisons`; `capture clip OK (147 ...`.
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical`.
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, exit 0.

## Shots moved
No frozen shot moved. No PNG in the shots sweep renders the Conditions editor (the editor is only opened by gates in shoot.mjs), so no non-frozen PNG changed that I know of; the only measured delta is the modal host-leak count 39/234 -> 40/240 (the pressed Default chip is a new button kind; it passed).

## Evidence (harness render, Steel dark + light; before = base 1516f894 sources, after = branch)
Dir: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc581-condition-colour-clear/evidence/`. Each name `sc581-{before|after}-{colour-set-blue|default-pressed}-{colorrow|modal|(editor)}-{dark|light}.png`.
- before-colour-set-blue: Color row has only 5 swatches + pipette; Blue (a mid blue) swatch carries the check; nothing returns to no colour. Row preview drop icon is blue.
- after-colour-set-blue: Color row starts with a "Default" text chip (unpressed, no accent border), then red, amber, green, Blue (checked), purple, pipette.
- after-default-pressed: "Default" chip has the accent (teal) border = pressed, no swatch is checked, and the row preview drop icon is back to the plain uncoloured look.
Camera script was scratch (`.../scratchpad/sc581-r1-impl/evidence.mjs`, not committed); the real-Obsidian camera was not used.

## Drive-by fixes:
None.

## Follow-ups:
- `docs/superpowers/dse-7.0.0-release-audit.md` and demo docs are untouched; nothing else found.
- `npm ci` was needed in the fresh worktree (no node_modules); not a code issue.
- Visual-harness has no PNG of the Conditions editor, so a future look change there is only guarded by the gates, not a frozen shot (could be a ticket if wanted).

## Artifacts
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc581-condition-colour-clear/sc581-r1-implementer-report.md`
- Logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc581-r1-impl/` (`jestfull.log`, `jest-nofix.log`, `tsc.log`, `lint.log`, `e2e.log`, `shots.log`, `freeze.log`, `lc1..lc6.log`, `parity.log`)
- Evidence PNGs: dir above.
- Commits (dse): `f9e631e4` code+jest, `dbe7f3cd` e2e, `14513d4a` docs. Superproject: `4a28dd5d`.

---

# r3 fix round (LOW-1)

**Summary**
- Verdict: DONE. LOW-1 fixed: Default tooltip is now `Default (no color)` (src `ConditionsModal.ts` l.478; test `conditions-modal-matrix.test.ts` l.257 updated). No other user-visible "colour" string exists in my diff (the rest are code comments and test/e2e titles, left as is).
- dse head `2074a152` (one new commit on top of `14513d4a`). Superproject head `6244b63b` on workspace `origin/main` `4cfac4bf` (fetch changed nothing; rebase was a no-op).
- Superproject `git log --oneline origin/main..HEAD`: `6244b63b chore: bump draw-steel-elements to 2074a152 (SC-581: Conditions window Default colour option)` and `4a28dd5d docs: CHANGELOG Unreleased bullet ...`. Nothing pushed.
- Gates: tsc exit 0; lint exit 0; jest `Tests: 1 skipped, 11708 passed, 11709 total` (shots cache present from r1, so 11708/1 = 11707/2); e2e `OBSIDIAN-E2E done: 330/333 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`; lifecycle `--only=G-S1` `done: 1/1 ok, 0 failed`.
- Dropped per ruling, untouched: INFO-1, INFO-2, INFO-3.
- Logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc581-r3-impl/{tsc,lint,jest,e2e,lc}.log`
