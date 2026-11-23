# SC-683 r1 implementer report

## Executive summary
- STATUS: DONE. Card size slider minimum 0.8 -> 0.3 (max 1.2, step 0.05, default 1 unchanged); TEXT_SCALE / TYPE_SCALE untouched.
- Plugin branch `sc683-scaling-30pct` head `aee83dc1` (reviewed code head `594cbd5c` + r3 docs-only commit; base `9be108c9`, origin/develop unmoved). Superproject branch head `c7f195e6` (2 doc commits, CHANGELOG.md only; no submodule pointer bump committed). Gates below were run at `594cbd5c`; r3 is CHANGELOG-only (see r3 section).
- Gates (all at 594cbd5c): tsc incl. e2e clean; lint clean; jest 14439 passed / 1 skipped (baseline 14438, +1 = the new 19-step test); lifecycle 64/64 (21+16+9+4+7+4+3); e2e 794/805 ok, 0 failed, 11 known-bug, 476/476 pairs; shots 592; freeze 280/280, 0 FAILED; parity 0 GAPs / 0 undeclared WARNs / 24 declared (run last).
- Probe facts at 30%: card box stays container-wide (760 px) and lays out at 2533 css px inside; smallest label renders 3.84 px; no font floor; nested cards zoom once; no overflow.
- Evidence: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc683-scaling-30pct/evidence/ (PNGs, probe JSON, logs/).

## What changed (plugin)
- `src/prefs/scale.ts`: CARD_SCALE.min 0.3; header, CARD_SCALE and TYPE_SCALE comments rewritten (no longer "site constants, both symmetric"; Card size no longer mirrors site CARD_MIN = 0.8, off-centre thumb, no migration).
- `src/prefs/catalog.ts`: Card size help "(30%–120%)"; three type-role helps keep "(80%–120%)".
- Tests: `test/unit/prefs/scale.test.ts` (range pin incl. TYPE_SCALE; symmetry kept for TEXT and TYPE, Card asserted asymmetric 0.7/0.2; clamp cases 0.1 and 0.27 -> 0.3, 0.5 in range; bound 0.3 and 0.8; NEW 19-step literal-list snap test), `test/unit/prefs/catalog.test.ts` (SCALE_CASES 0.3 / 0.1->0.3), `test/dom/views/settings-integrity.test.ts` (0.1 stamps 0.3), `test/dom/prefs/fontPrefs.smoke.test.ts` (added 0.1 -> '0.3', 0.5 -> '0.5' assertions inside the existing test), `test/dom/views/settings-tab.test.ts:832` (limits 0.3), `test/dom/views/settings-matrix.test.ts:256` (positions [17, 19, 9, 9, 9]), `e2e/specs/settings/sliders.e2e.ts` (SET-Z02 Home -> 0.3, title and header comment).
- TDD: with only the test edits, 4 suites / 8 tests were red; green after the constant change.
- The brief's list of tests to move missed `settings-tab.test.ts:832` and `settings-matrix.test.ts:256`; the first full jest run (14436 passed, 2 failed) found them; moved the numbers, no test weakened.
- Docs: `docs/settings.md`, `docs/styling-statblocks.md` (30%–120%), `.repo-docs/architecture.md` (two "site-mirrored" statements made true), plugin `CHANGELOG.md` ([FEATURE] bullet at top of the 7.0.0 unreleased section), superproject `CHANGELOG.md` (`## Unreleased` bullet, says the site's Card size is unchanged). DESIGN.md does not state the card range. `docs/superpowers/**`, the 7.0.0-history changelog line ("Card size (80%–120%)", old release entry) and styles-source.css:15497 ("probed at 0.8x/1.2x", historical) left alone.
- No other src hard-codes the card range: `prefOverrides.ts`, `tokens.ts`, `textScaleRoot.ts`, `SettingsPreview.ts` and the settings-tab slider builder read min/max from the descriptor (`CARD_SCALE`). No migration: stored 0.8–1.2 snap to themselves (tests: 0.8 and 1.2 round-trip; e2e reload SET-Z06 green).

## Gates (measured)
See executive summary; logs in evidence/logs/. First jest (fresh worktree, no shots cache): 14436 passed / 2 failed / 2 skipped (the two failures above, since fixed). After `npm run shots`: 14439 passed / 1 skipped / 311 of 312 suites. Lifecycle parts: 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3. No flakes seen.

## Probe measurements (browser harness, Steel dark, 900 px viewport, dsf 2; real `cardScale` pref via `prefs=`)
Raw numbers: evidence/sc683-probe-measurements.json.
- Computed `zoom` on the `.dse-sb` card: 1 / 0.8 / 0.5 / 0.3; one zoomed element per card (nested reset holds).
- Card box width is 760 px at every scale (it fills its container); height 3739.7 / 2919.4 / 1793.8 / 1092.9 px at 100/80/50/30%. The content therefore lays out 760/scale css px wide: `offsetWidth` 760 / 950 / 1520 / 2533. At 30% the card does not get narrower, it gets shorter with the layout spread across 3.3x the width (see PNG A 30%: long lines, stat tiles wide and short). Villain-corpus fixture the same (h 1616.5 -> 494.6 at 30%). Narrow 360 px mount at 30%: box 360 wide, h 4910.5 -> 1125.5, no overflow.
- Horizontal overflow: 0 descendants outside the card box at any scale; `#mount` and document scrollWidth equal clientWidth (900) at all scales.
- Clipped text (scrollWidth > clientWidth under overflow != visible): 8 elements at 100%, 8 at 30% (statblock); same count at both ends, so not caused by the change.
- Smallest text: `.dse-sb__kv-l` computed font-size 12.8 px; rendered 12.8 / 10.24 / 6.4 / 3.84 px at 100/80/50/30% (computed x zoom). Label line box height 21.75 / 17.39 / 10.89 / 6.53 px (ratio 0.30 at 30%) and glyph range box height 17 / 14 / 9 / 5: no minimum-font-size floor in this Chromium (headless Playwright). A real Obsidian/Electron min-font setting was not measured; the real-Obsidian slider run (SET-Z02) does not check text size.
- Nested cards: feature fixture has a real nested "Inner feature" card; zoomed elements in the tree = 1 at 50% and 30%. Injected nested roots (`[data-dse-element]` statblock/feature/featureblock inside a zoomed statblock): own zoom 1, chain zoom to document 0.5 / 0.3 (zoomed exactly once). By-SCC condition/rule fixtures: one card host, zoom 0.5 / 0.3, one root.
- Card inside a modal: EMULATED (a `.dse-modal > .dse-modal__body > .dse-sb` with `--dse-card-scale` stamped on the modal root; a real DseModal with a card was not mounted): zoom 1 / 0.5 / 0.3, 400 css px box -> 400 / 200 / 120 px. Settings-preview surface (real `mountSettingsPreview` of a statblock): sb zoom 0.3 at 30%, preview container 760 px wide.
- Settings tab (real Obsidian 1.14.4, via a throwaway e2e spec, deleted, not committed): shown value "30%"; slider range min 0.3, max 1.2; thumb position along the track (value-min)/(max-min): Card size 0.778 at 100% (off-centre, right of the middle), 0 at 30%; the other four 0.5 at 100%.

## Evidence artifacts (all under /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc683-scaling-30pct/evidence/)
A: sc683-A-statblock-card-size-100.png, -80.png, -50.png, -30.png; sc683-A-statblock-contact-sheet-100-80-50-30.png (labelled); sc683-A2-villain-corpus-card-size-50.png, -30.png.
B: sc683-B-feature-card-size-100.png, -30.png; sc683-B-feature-contact-sheet-100-30.png.
C: sc683-C-settings-typography-card-size-100.png, -30.png.
Extras: sc683-N-condition-by-scc-card-size-30.png, sc683-N-rule-by-scc-card-size-30.png, sc683-P-settings-preview-card-size-30.png, sc683-W-statblock-narrow360-card-size-30.png, sc683-probe-measurements.json, logs/ (gate logs, scratch scripts).

Drive-by fixes: `.repo-docs/architecture.md` "site-mirrored" ranges wording (made false by this change; docs, no baseline).
Follow-ups: none to file. Note for the owner: v2 site `settings-core.js` CARD_MIN stays 0.8 (O3), so the plugin and site Card size ranges now differ.

## r3 (docs-only fix round, MED-1 from review of 594cbd5c)
- Plugin `CHANGELOG.md` (unreleased 7.0.0 section, the "Two size sliders" bullet, ~line 1360): now "Text size (60%–140%) and Card size (30%–120%), in 5% steps. Text size has the same range, steps, and snap behavior as steelcompendium.io's own site settings. Since SC-683, Card size goes lower than the site's 80% (it was 80%–120%, the site's range, before)." Commit `aee83dc1`. My r1 report was wrong to call this an old release entry.
- Grep of that section (lines 20-1548) found no other current-tense Card-size range statement (lines 477 and 655 name the slider only).
- Superproject `CHANGELOG.md`: the `## Unreleased` section (lines 9-1674) had the same claim in the "Plugin typography settings (SC-112 / plan 23)" bullet (~line 1564, "Card 80%–120% ... the site's exact slider ranges"); amended to "Card 30%–120% since SC-683 (it was 80%–120%) ... Text size is the site's exact slider range and snap semantics; Card size now goes lower than the site's 80%". Commit `c7f195e6`. The SC-683 bullet there is correct.
- No test reads CHANGELOG.md (grep of test/, e2e/, scripts/, tools/, visual-harness/*.mjs); no gate re-run. `git diff --stat 594cbd5c..HEAD` (plugin): CHANGELOG.md only, 6 insertions, 4 deletions.
