# SC-407 r1 implementer report

## Executive summary
- STATUS: DONE (one flagged item: jest passed count is 4430, +1 vs the 4429 baseline, because the O3 harness change shipped one test).
- Final sha: `eef9c63` on dse branch `sc407-docs-prune` (base `05a6ff3` = origin/develop, re-verified before writing; 7 commits, 61 files, +306/-989). Not pushed.
- Gates on `eef9c63`: tsc clean; lint clean (rc=0); jest 4430 passed / 1 skipped / 218 of 219 suites; lifecycle 25/25; shots 568 PNGs, 0 FAIL; freeze `freeze OK (274/274 ...)`; parity 0 gaps / 0 undeclared / 24 declared, exit 0 (run last).
- `npm run docs-shots` rc=0: 14 browser + 16 obsidian = 30 images (was 22 + 18 = 40); 10 images removed, 25 PNGs regenerated.
- Link check: mkdocs not runnable (no `material` in devbox python), so a script resolved every relative link/anchor/image in README + docs (excl. superpowers): 229 links, 0 broken (same script on `05a6ff3` found 1: settings.md -> feature.md). `mkdocs.yml` has no explicit `nav:` (tree-built), unchanged, so no nav entry can reference a removed page.
- `data.json`: worktree has none before/after (camera restores/deletes); main checkout `data.json` md5 `26f70430609057ad10e01685a562ef53` before and after.

## Commits (dse repo, oldest first)
1. `454ce58` docs: prune user docs to the shipped set (README + 14 docs pages, Roll.md deleted)
2. `b5ded19` docs: prune CHANGELOG 7.0.0 (header stays `7.0.0 (unreleased; previously numbered 6.0.0)`)
3. `0dcce63` build: docs-shots captures with switch OFF; drop deferred manifest entries (+1 test)
4. `113e366` docs: regenerate docs/Media, remove 10 images
5. `07d6c21` docs: AGENTS.md / .repo-docs
6. `54672f8` docs: audit §11a restore map
7. `eef9c63` docs: restore-map wording

## Files removed
`docs/Roll.md`; `docs/Media/{conditions,encounter,hero-tokens,heroic-resource,party,project,roll,sidebar,surges,tutorial-print-preview}.png`.

## Files edited (one line each)
- README.md: dropped Roll/Encounter/Project/Party/Conditions/Resource/Surges/Tokens rows + sidebar paragraph; "Hero tracker" = Stamina bar; settings page list fixed (no Authoring, + Feature display); montage link -> page.
- docs/index.md: same catalog prune; guides/reference blurbs de-sidebar'd; montage link.
- docs/getting-started.md: `/dsroll` example -> `/dsinit`; next-steps wording.
- docs/gm-trackers.md: montage-only (`# Montage Test Tracker (ds-montage)`, sidebar/_dse_anchor intro removed).
- docs/hero-suite.md: Stamina pointer (+ conditions via initiative tracker).
- docs/running-an-encounter.md: rewritten around the initiative tracker (no builder/sidebar/party).
- docs/initiative-tracker.md: sidebar section, builder shortcut/mentions removed.
- docs/writing-blocks.md: form-editor and sidebar sections removed; autocomplete example no longer links Roll.md.
- docs/advanced-usage.md: sidebar section (-> "Narrow panes"), printPreview row, Print-preview bullet, ds-roll bullet, form-editor paragraph.
- docs/common-element-fields.md: pencil bullet; element lists/examples de-deferred.
- docs/settings.md: Print preview row, Authoring section, Roll-element sentence, sidebar-leaf wording.
- docs/canvas-character-sheet.md: Hero-trackers tail, sidebar pin, "resource" wording.
- docs/customizing-a-monster.md, styling-statblocks.md, Features.md: pencil paragraph / print-preview paragraph+image / Roll.md link.
- docs/migrating-to-7.md: Hero trackers, Director's trackers, sidebar bullets and pencil clause removed; ONE placeholder-card note added (no mention of the switch).
- CHANGELOG.md: 17 bullets pulled, ~28 re-worded to the shipped part (list in audit §11a).
- visual-harness/docs-manifest.mjs, camera-data-json.cjs, obsidian-camera.mjs, test/unit/build/cameraDataJson.test.ts: see harness.
- AGENTS.md, .repo-docs/integration.md: "22 elements" -> 13 ship / 9 gated behind the undocumented `experimental` switch; AGENTS release-gate bullet gained the SC-407 note. (`.repo-docs/architecture.md` already had the full switch description from SC-406.)
- docs/superpowers/dse-7.0.0-release-audit.md: new §11a restore map.

## Images
Removed (10): listed above; manifest entries removed too. `negotiation.gif` untouched.
Regenerated (25 changed): canvas-character-sheet, compendium, counter, feature, featureblocks, initiative-tracker, initiative-tracker-add-conditions, initiative-tracker-stamina-modal, minion-stamina-pool-modal, montage, montage-sheet-modal, sample, scc-reference, settings-index, settings-statblock, simple_feature_power_roll, skills, stamina-bar, stamina-bar-modal, statblock, statblock-side-by-side, tutorial-command-palette, tutorial-compendium-search, tutorial-reading-mode, tutorial-snapshot-yaml, tutorial-source-mode. Most changed size (committed set was stale vs current rendering); pixel report: `r1-logs/media-pixel-diff.txt`. `settings-index.png` now lists 9 rows, no Authoring (HEAD had it). No regenerated image shows a block menu panel, pencil, or Pin-to-sidebar item (viewed settings-index, initiative-tracker, sample, canvas-character-sheet).

## Harness diff summary
`camera-data-json.cjs`: `seedExperimental(file, on = true)`; `on=false` writes `experimental:false` only if the file carries `experimental:true`, else leaves it (absent = off); same byte-exact restore and refuse-to-overwrite rules. `obsidian-camera.mjs`: one line, `seedExperimental(path, !DOCS_MODE)`; every other mode (`obsidian-shots`, lifecycle uses its own path) unchanged. Test added (cameraDataJson.test.ts, 1 test). Browser half of docs-shots still uses the harness entry (switch ON); none of the remaining browser images show a deferred surface.

## Residual grep
Full output: `r1-logs/residual-grep.txt`. Remaining hits, all justified:
- "Track your hero" / hero-suite.md (README, index, getting-started): the kept Stamina-pointer page.
- "Dice Roller" (advanced-usage, settings): the community plugin for the shipped `rollerEngine` pref on ability cards.
- "authoring" (advanced-usage x3, getting-started): generic words ("authoring surfaces", "autocomplete", "authoring loop"), not the Authoring page.
- "sidebar leaf/width" (negotiation-tracker, skills-element, stamina-bar): Obsidian's native right sidebar, not the DS sidebar; narrow-layout behaviour that still ships.
- "pencil mark" (gm-trackers): montage's logged-cell marker.
- "dice roller" (settings): "adds a dice roller to rendered ability cards" = shipped rolling.
- CHANGELOG 7.0.0: one hit, "authoring example" in the SC-236 `ds-feature` insert-example bullet (ships). Media: `initiative-tracker-add-conditions.png` (Conditions manager modal, ships), `simple_feature_power_roll.png` (feature card).

## Drive-by fixes
- docs/settings.md linked nonexistent `feature.md`; now `Features.md` (the only broken link on `05a6ff3`).
- CHANGELOG "New commands" bullet claimed the legacy sync alias remains until 8.0.0; it was removed in SC-406 (contradicted the BREAKING bullet).
- docs/common-element-fields.md "More buttons will be added here over time" reworded (would read as a teaser).

## Follow-ups
- Audit §7 says the settings index has "eight pages" after gating; it has 10 (matches settings.md and migrating-to-7.md "ten pages"). Audit text only.
- `kind: 'sidebar'` camera support in `obsidian-camera.mjs` and `docs-manifest.mjs`'s shape comment are now unused by the manifest; left for 7.1.0.
- `negotiation.gif` is not referenced by any doc (index uses `negotiation.png`); pre-existing, SC-388 still owes the re-record.
- `sample.png` (README top image) regenerated at 1400x6002 (was 3261 tall) because the initiative tracker and cards render taller; may want a look before release.
- Fresh worktree needed `npm ci` and `npm run host-css` for jest to hit the baseline (without host-css the print-twin test is skipped: 4429 passed / 2 skipped).
- Not touched: `docs/compendium-migration-map.md`, `docs/superpowers/` other than the audit.

## Evidence paths
Logs: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc407-docs-prune/r1-logs/` (tsc.log, lint.log, jest.log, lifecycle.log, shots.log, freeze.log, parity.log, docs-shots.log, linkcheck.log, residual-grep.txt, media-pixel-diff.txt).
Images: `/home/scott/code/steelCompendium/worktrees/sc407-docs-prune/draw-steel-elements/docs/Media/settings-index.png`, `.../docs/Media/initiative-tracker.png`.
