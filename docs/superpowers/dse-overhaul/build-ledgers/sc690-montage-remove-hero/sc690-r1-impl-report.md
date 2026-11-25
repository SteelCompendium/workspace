# SC-690 r1 implementer report: "Remove a hero" on the montage test tracker

**Executive summary**
- STATUS: DONE. Plugin branch `sc690-montage-remove-hero` head `43574bfe` (base `develop` @ `aee83dc1`, unchanged after fetch); superproject branch head `0c6aec5f` (CHANGELOG only, no pointer bump).
- New ⋯ item "Remove a hero" (after "Add a hero") opens a window of the board's heroes; pick one, Remove takes the row, `skills_used` and every logged action; tally follows; Notice "Removed Kira from the montage"; no Undo, no extra confirm (O1-O5).
- Gates: tsc (+`tsc -p e2e`) clean, lint clean; jest 14471 passed / 1 skipped (baseline 14439, +32); lifecycle 64/64 (seven parts); e2e `815/826 ok, 0 failed, 11 known-bug, coverage: 485/485 pairs` (baseline 794/805, 476/476: +21 tests, +9 pairs).
- shots 592 (no new PNG; one new host-leak modal scenario was REQUIRED by the shots gate); freeze 280/280, 0 FAILED; parity 0 gaps / 0 undeclared / 24 declared.
- Evidence PNGs (real Obsidian 1.14.4 via the e2e driver, Steel theme, 1440x1100 window, fixture-mid 5 heroes): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc690-montage-remove-hero/evidence/`.
- Last hero removed: `participants:` key goes from the note (same as `empty.md`, and as an empty list at parse). Focus: after Remove (keyboard open) on the rebuilt "Remove a hero" item, or "Add a hero" if the last hero went; after Cancel/Escape on the item that opened the window (Obsidian restores it, MONT-F17).
- Judgment calls to rule on: hidden duplicate actions go too; stale-hero Remove closes the window silently; chips are individual Tab stops (details below).

## What was built

Files changed (plugin repo `/home/scott/code/steelCompendium/worktrees/sc690-montage-remove-hero/draw-steel-elements`):
- `src/elements/montage/model.ts`: `removeMontageHero(m, name)` (returns true/false) and `montageHeroRemoval(m, name)` (`{actions, shared}`, for the window's line). Removal goes through the same `applyTallyDelta` `removeMontageEntry` uses, so a tally nothing moved is not re-typed (SC-628).
- `src/elements/montage/ConfigModals.ts`: `MontageRemoveHeroModal` and `removalSummary()`. Chips are `button.dse-optchip` with `aria-pressed` (the Log sheet's Result chips' grammar), a check glyph only on the picked one, `data-dse-focus-at=<hero name>`. Footer: Cancel (ghost), Remove (danger, disabled until a pick).
- `src/elements/montage/view.ts`: chrome item `montage-remove-hero` (icon `user-minus`, only when the roster is non-empty and the host persists), `openRemoveHero()`.
- `src/elements/montage/focusRules.ts`: fallback `'montage.chrome.remove-hero': ['montage.chrome.add-hero', 'montage.bar.log', 'montage.bar.end-round']` and the comment.
- `styles-source.css`: `.dse-mt__sheet-herolist/-herochip/-consequence` rules, tokens only, modal only (print untouched).
- `visual-harness/shoot.mjs`: `HOSTLEAK_MODAL_SCENARIOS` entry `MontageRemoveHeroModal` (the shots gate fails without it: "is a Modal subclass that is neither swept ... nor declared").
- e2e: `e2e/manifest/montage-remove-hero-modal.ts` (new), `e2e/manifest/montage.ts` (+`montage.chrome.remove-hero`), `e2e/driver/dse.ts` + `e2e/driver/montage.ts` (modal kind, `openRemoveHero`), `e2e/specs/_census.e2e.ts`, specs `e2e/specs/montage/remove-hero-modal.e2e.ts` (MONT-D01..D16, new), `chrome.e2e.ts` (MONT-C07), `focus.e2e.ts` (MONT-F14..F17).
- Tests: `test/unit/model/montage-remove-hero.test.ts` (16), `test/dom/elements/montage-remove-hero.test.ts` (16), `test/dom/e2eCensus.test.ts` and `test/dom/elements/montage.test.ts` extended.
- Docs: plugin `docs/gm-trackers.md` (menu paragraph), plugin `CHANGELOG.md` ([FEATURE] bullet in the 7.0.0 section), `.repo-docs/architecture.md` (windowHandoff row), superproject `/home/scott/code/steelCompendium/worktrees/sc690-montage-remove-hero/CHANGELOG.md` (`## Unreleased` bullet). `migrating-to-7.md` / `common-element-fields.md` list no menu items: nothing to change.

New control ids: `montage.chrome.remove-hero`, `montage.remove-hero.hero` (one id for the chips, hero name on `data-dse-focus-at`), `montage.remove-hero.cancel`, `montage.remove-hero.submit`.
New e2e pairs (+9, 476 -> 485): `montage.chrome.remove-hero` x click, press:Enter; `.hero` x click, press:Enter; `.cancel` x click, press:Enter; `.submit` x click, click-disabled, press:Enter (`modal.close`/`modal.backdrop` pairs already existed).
Existing tests moved: `montage.test.ts` "exactly FOUR items" -> FIVE (count, id list, read-only list); `e2eCensus.test.ts` modal/chrome lists extended. Nothing weakened or deleted.

## Behaviour decisions (O3 details)
- Matching mirrors the board: exact `e.hero === name` (no trim/case folding, unlike Add a hero's duplicate check). The first roster hero with the name is removed. If another roster hero has the same name, its row stays, so its entries stay and the tally does not move; the window line then says "Another hero is also named X, so the logged actions stay with that row."
- **Hidden duplicate actions go too** (a second action for the same hero+round: the board hides it but the stored tally counts it). Mirroring only the shown cells would leave an orphan that comes back to life under a hero added later with the same name (D15 / unit test pin "starts clean"). Owner may rule otherwise.
- Last hero: `participants` key is deleted (`delete m.participants`); serialize already omits an empty list and `empty.md` has no `participants:` key. `entries` goes back to absent the same way. A skipped bare item left in `participants:` keeps the key (unit test).
- Stale hero (an outside edit already removed it): `removeMontageHero` returns false, no write, no Notice, window closes. (Real outside edits close the window earlier with SC-650's Notice: MONT-D16.) The window re-reads the live model on pick, so the line is current.
- Notice "Removed <name> from the montage" is posted before the commit, like Reset progress.
- Non-colour mark: picked chip has accent border (kit grammar) AND a check glyph (hidden on unpicked chips, slot reserved so nothing shifts) AND font-weight 600 on the name.

## Evidence (real Obsidian 1.14.4, Steel theme, e2e driver screenshots; scratch spec, deleted, never committed)
Dir: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc690-montage-remove-hero/evidence/`
- A `sc690-A-menu-viewport.png` (full window: panel icons +, user-plus, user-minus (hovered), hourglass, reset, collapse) and `sc690-A-menu-panel-annotated.png` (3x crop; the text labels are MY annotation: the chrome panel is icon-only and headless Obsidian showed no tooltip).
- B1 `sc690-B1-window-open.png` (nothing picked, Remove disabled; first chip has the focus ring), B2 `sc690-B2-window-picked.png` (Bram picked: check, bold, accent border, line "Bram has 2 logged actions. They are removed too, and the tally follows.", Remove enabled).
- C `sc690-C1-board-before.png`, `sc690-C2-board-after.png`, `sc690-C-board-before-after.png` (pair): "5 heroes" -> "4 heroes", Bram's row gone, bars 5/2 -> 4/1, Bram's note gone from Notes.
- D `sc690-D-window-12-heroes-long-name.png`, `sc690-D-window-12-heroes-short-viewport.png`.
Measurements (no fix beyond brief): 80-char hero name wraps to 2 lines, chip 38.5px vs 30px, `scrollWidth == clientWidth` 524 (no clip). 12 heroes at a 1100px window: dialog 562px, no scroll. At a 620px window: dialog bottom 573, footer 536-560 (Cancel/Remove reachable), `.dse-modal__body` scrolls (scrollHeight 474 > clientHeight 434).
Fix made during capture (my own new control, not a drive-by): section E of the SC-203 host re-grounding (`:is(...):not(...) :where(.dse-optchip)`, specificity 0,2,0) forces `height: 30px` and a centred label on every `.dse-optchip` in a modal; first capture showed centred names and a 2-line name cut to 30px. Fixed with a 3-class selector (`.dse-modal .dse-mt__sheet-herolist .dse-mt__sheet-herochip`: `height:auto; min-height; justify-content:flex-start`).

## Gates (logs copied to `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc690-montage-remove-hero/sc690-r1-logs/`; originals in the scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc690-impl-r1/`)
- tsc `npm run tsc` (includes `-p e2e`) and a separate `npx tsc -p e2e`: exit 0, no output. Lint: exit 0 (only the pre-existing `.eslintignore` warning).
- jest (after `npm run shots` cache present): `Tests: 1 skipped, 14471 passed, 14472 total`, 313 suites passed (baseline 14439 / 1 skipped: +32 = 16 unit + 16 DOM). Log `jest-full2.log`. (The "findDriftedTokens" TypeError stack in the log is an intentional negative-test child process.)
- Lifecycle, seven `--only=` parts: 21/21 + 16/16 + 9/9 + 4/4 + 7/7 + 4/4 + 3/3 = **64/64 ok, 0 failed** (`OBSIDIAN-LIFECYCLE done: N/N ok, 0 failed` per part). Ran at head `13cf641a`; the later `43574bfe` is a modal-only CSS change (no lifecycle scenario opens this window) and was not re-run through lifecycle.
- e2e full: `OBSIDIAN-E2E done: 815/826 ok, 0 failed, 11 known-bug, coverage: 485/485 pairs` at `43574bfe`. No flakes seen. (New tests: MONT-D01..D16, C07, F14..F17 = 21.)
- shots: 592 `ok` PNG lines, exit 0, at `43574bfe`. Freeze: `freeze OK (280/280 frozen print PNGs byte-identical)`. Parity (last): `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, exit 0.

## File-integrity probes (all e2e, note read on disk; D-series `remove-hero-modal.e2e.ts`)
D03 (text outside the block byte-identical, on-disk participants/entries/tally), D07 (last hero, two-block note: other block byte-identical), D08 (two different blocks, only the acted-on block changes), D09 (identical twins, Reading view), D10 (twins, Live Preview), D11 (`unknown-keys.md`), D12/D13 (`hand-written.md`: scalar skills, no list, unrecognised result), D14 (`quoted-successes.md`: `successes: "2"` stays), D15 (remove then re-add same name is clean), D16 (outside edit while open). Unit tests cover the same at model level.

Process note: I wrote the unit tests before the model code but did not run them red first (first run was green except one wrong expectation of mine about omitted default keys).

## Follow-ups (left alone)
- The chips are individual Tab stops (Result-chip precedent), no arrow-key radiogroup: 12 heroes = up to 12 Tabs to reach Remove. A `role="radiogroup"` with arrow keys would be better a11y; not in the brief.
- The chrome panel is icon-only with `aria-label` tooltips; "Remove a hero" and "Add a hero" are two adjacent person icons (plus/minus). No visible text label (same for every item).
- Two same-name heroes appear as two identical chips; picking either removes the first.
- `docs/superpowers/**` untouched (historical).

Drive-by fixes: none.
