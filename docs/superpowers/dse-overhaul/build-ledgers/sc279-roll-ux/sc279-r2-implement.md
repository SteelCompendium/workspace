# SC-279 r2 implementation report

## Executive summary
- Status DONE_WITH_CONCERNS (one concern: checkbox glyph, see below). DSE branch `sc279-roll-ux`, head `24e5a1e` (base `f8693b5` = origin/develop, no rebase needed). Superproject branch `sc279-roll-ux` head `218031b` (DESIGN.md only; submodule pointer NOT bumped).
- Gates: tsc clean; lint clean (exit 0); jest 4387 passed / 1 skipped / 215 of 216 suites (base 4367, +20); lifecycle 25/25 ok; shots 580 ok, 0 FAIL (base 568, +12 = 6 new screen-only ids x dark/light); parity 0 GAPs / 0 undeclared / 24 DECLARED.
- Freeze: `FREEZE VIOLATED (2 checksum mismatches, 0 missing)`, exactly `roll--steel-print.png` and `roll--steel-realprint.png`. No other frozen line moved. Rebaseline = 2 lines, identical across 2 full runs; "before" hashes reproduced from base equal the baseline lines.
- Gates ran at `254b991`; the last two commits (`24e5a1e`, superproject `218031b`) are comment/doc wording only (rollBar header comment + DESIGN.md); rollBar.test.ts re-run after (25 passed).
- Evidence PNGs: `.../sc279-roll-ux/sc279-r2-evidence/`. Rebaseline: `.../sc279-roll-ux/sc279-rebaseline.txt`.

## Commits (DSE, `draw-steel-elements`)
- `3ecd9d7` feat(roll): roll strip (rollBar.ts, both hosts, CSS, tests, steelMaterial comment)
- `8b398a0` feat(roll): harness shots (entry.ts, shoot.mjs) + CSS polish after viewing shots
- `f550721` docs(roll): Roll.md, settings.md, CHANGELOG.md (under `## 7.0.0 (unreleased)`, the section SC-377/SC-378 use)
- `254b991` docs(roll): refreshed `docs/Media/roll.png` (`npm run docs-shots -- --only=roll.png`; collapsed strip)
- `24e5a1e` docs(roll): rollBar comment wording
Superproject: `d5e64fd` DESIGN.md rule 9 carve-out + component-map row; `218031b` wording fix.

## Files changed
- `src/framework/kit/rollBar.ts` (rewritten body): Roll first; `collapsible()` "Modifiers" (collapsed default, `persist` option -> `RollBarOptions.persist`) with `.dse-rollbar__summary`; captioned fields (`.dse-rollbar__field/__label`, caption aria-hidden, stepper aria-label == caption); `.dse-rollbar__pair` for Edges+Banes; `.dse-rollbar__net` aria-live=polite ("No edges or banes" at 0/0; other net wording unchanged); native checkboxes `Skill applies (+2)` / `Main action — natural 19–20 is a critical hit` (`.dse-rollbar__check--skill/--main`); "Reset modifiers" text+icon (`.dse-rollbar__reset`) -> new `RollBarOptions.defaults`, disabled at defaults, characteristic kept; flat mode omits Edges/Banes/net.
- `src/elements/roll/view.ts`: passes `defaults` (authored skill/edges/banes/main_action) + `persist` slot `roll.modsOpen.0`.
- `src/elements/feature/rollController.ts`: passes `persist` slot `roll.modsOpen.<effectIndex>`; launcher behavior unchanged.
- `styles-source.css`: `.dse-rollbar__*` rules (all scoped under `[data-dse-element] .dse-rollbar*`; no shared `.dse-collapse/.dse-btn/.dse-stepper` rule touched); print: `[data-dse-element] .dse-rollbar{display:none}` inside `@media print` and `[data-dse-print="on"] .dse-rollbar{display:none}` (hides the whole strip, so print rule 3's forced-open `.dse-collapse__region[hidden]` cannot show the panel).
- Tests: `test/dom/kit/rollBar.test.ts` (selectors -> checkboxes, +13 tests incl. a CSS source-scan for print + `:not([hidden])` guard), `test/dom/elements/roll.test.ts` (+4), `test/dom/elements/feature-roll.test.ts` (+3), `steelMaterial.test.ts` comment fix.
- Harness: `visual-harness/entry.ts` (INTERACTION_SHOTS gains optional `thenClicks`, `prefs`, `width`, `fixedDice`, `screenOnly`; 6 new ids: `roll-expanded`, `roll-expanded-narrow`, `feature-rolled`, `feature-rolled-expanded`, `feature-rolled-expanded-narrow`, `feature-rolled-modified`), `visual-harness/shoot.mjs` (consumes them; `fixedDice` pins `Math.random=0.5` after load so rolling shots are byte-stable; new shots verified deterministic across 2 runs).
- Docs: `docs/Roll.md` (new "The roll strip" section + field wording), `docs/settings.md` §Rolling, `CHANGELOG.md`, `docs/Media/roll.png`, worktree `DESIGN.md`.

## Decisions where the spec left room
- Flat mode keeps Skill: engine.ts step 4 adds `skillBonus` in every mode (not mode-gated), so an authored `skill:` is honoured; Edges/Banes/net omitted.
- Summary wording: `Reason 0` / `Reason +2` / `Reason −1`; `skill +2`; `N edge(s)`; `N bane(s)`; main action only when differing from default (`main action` / `not a main action`); `none` only when no characteristic and nothing else. Fixed (bound-hero) characteristic: caption "Reason" + read-only `+2` chip (the old chip text "Reason +2" changed to "+2"; the caption carries the name).
- Reset disabled-at-defaults compares only controls that exist (no edges/banes in flat; no main action when not shown).
- Net-line wording kept as-is except the new 0/0 text (avoids churn in existing assertions).
- Panel flex is guarded `:not([hidden])` (same specificity as the kit's `[hidden]{display:none}` and later in the sheet; unguarded it would paint open while collapsed). Pinned by a source-scan test.
- Dropped the "·" separator before the summary and let it wrap under the title at sidebar width (seen in the narrow shot).
- `docs/Media/roll.png` shows the collapsed strip (the docs-manifest's browser source has no click support); no new docs image added.
- Interaction shots: screen-only (no print/realprint), so they add NO frozen/widening lines.

## Concern
- The Steel checkbox (existing `GROUP 6` styling, shared with negotiation/project) draws no check glyph: checked = teal-filled box, unchecked = empty box (a lightness/fill difference, not hue-only), plus the worded summary ("skill +2"). I reworded comments/DESIGN.md to say that rather than claim a "check shape". If Scott wants a glyph it is a scoped `.dse-rollbar__check` rule that must out-specify the `content:none` GROUP 6 rule (0,5,3) and avoid Obsidian's own `::after` mask.

## Drive-by fixes
- `test/dom/theme/steelMaterial.test.ts` comment: roll renders an inner `.dse-roll` card with its own frame (was `.dse-card`, "already matches"); requested by the brief.
- `roll.test.ts` comment "no visible text" on stepper labels (now false); reworded.

## Follow-ups
- Card shots (`feature-rolled*`) show a white band below the card in the PNG (harness `#mount` locator capture of a tall card; the feature fixtures were already tall). Evidence crops avoid it; not investigated.
- Harness `ShotManifest` type at entry.ts ~:2387 still declares the narrower interaction-shot shape (assignable, harmless).
- Reroll in the result card still duplicates Roll (dropped from scope per ledger).
- Obsidian-camera (real Obsidian) shots were not run (no display requirement in the brief).

## Evidence (all under /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/)
- sc279-r2-evidence/a-ds-roll-collapsed-dark.png, b-ds-roll-expanded-dark.png, c-card-after-first-click-strip-collapsed-dark.png, d-card-strip-expanded-1edge-skill-checked-dark.png, e-ds-roll-expanded-narrow300-dark.png, f-ds-roll-expanded-light.png
- sc279-r2-evidence/print-before-roll--steel-print.png, print-after-roll--steel-print.png, print-before-roll--steel-realprint.png, print-after-roll--steel-realprint.png (before: 1520x412 with the unlabelled bar box; after: 1520x314, strip gone)
- sc279-rebaseline.txt (2 lines):
  `84eaaf74619e81094660de1896743d315ac9db817168affbe0d7552f97fcefd3  roll--steel-print.png`
  `16d5edbd61b330c9ac69cd52917dee575928905ab0363280a8fe6d3fc6b709c5  roll--steel-realprint.png`
- Logs: sc279-jest-full.log, sc279-lifecycle.log, sc279-shots-full1.log / full2.log, sc279-freeze1.log / freeze2.log, sc279-parity.log, sc279-hash-run1.txt / run2.txt.
