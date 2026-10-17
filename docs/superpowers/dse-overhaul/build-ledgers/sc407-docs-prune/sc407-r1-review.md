# SC-407 r1 independent review — dse `sc407-docs-prune` @ eef9c63 (base 05a6ff3)

## Executive summary
- **Verdict: LAND-READY**. Nothing blocks. Six LOW findings are worth folding into the planned fix round. No CRIT, HIGH or MEDIUM.
- Counts: CRIT 0 · HIGH 0 · MEDIUM 0 · LOW 6 · INFO 9.
- Gates were re-run on eef9c63. tsc clean. lint clean (rc=0). jest 4430 passed / 1 skipped / 218 of 219 suites. lifecycle 25/25. shots 568 PNGs, 0 FAIL. freeze `freeze OK (274/274 …)`. parity 0 gaps / 0 undeclared / 24 declared, rc=0, run last.
- Links: `mkdocs build --strict` ran with anchor validation turned on (mkdocs-material in a scratch venv). Head has 8 warnings, base has 11, and all of head's are pre-existing (roamlinks on wikilinks inside code samples, plus `../CHANGELOG.md`). There are 0 new warnings and 0 broken anchors. A probe proved the anchor check works: a planted bad anchor was flagged. README: 31 relative links, 0 broken.
- O3 is proven. docs-shots rc=0 produced 30 images (14 browser + 16 obsidian). During the camera phase data.json read `experimental:false`. It was restored byte-identical afterwards (md5 1cc0c0ac… before and after). A missing data.json stays missing. The non-docs camera still seeds the switch ON: its settings shot shows Authoring. The base harness also captures with Authoring, which shows the change is what makes the difference.
- Docs grep: no deferred surface is still documented in README, docs (excluding superpowers), mkdocs.yml or the CHANGELOG 7.0.0 section. The one exception is a single CSS-surface word in a CHANGELOG bullet (LOW-2). No shipping surface was over-pruned.
- Owner Qs: (a) sample.png's growth is real content, not a defect. (b) negotiation.gif was not referenced at 05a6ff3; SC-379 removed the reference, so DROP. (c) With the switch off there are **10** settings pages. (d) All three drive-bys are correct.

## Evidence (all under `.superpowers/sdd/sc407-docs-prune/review-r1/`)
tsc.log, lint.log, jest.log, lifecycle.log, shots.log, freeze.log, parity.log; mkdocs-05a6ff3.log, mkdocs-eef9c63.log, mkdocs-anchor-probe.log, readme-links.txt; residual-grep.txt, broad-grep.txt; media-audit.sh + media-audit.txt; docs-shots-head-on.log + datajson-samples-head-on.txt (full run, data.json seeded `{"experimental":true}`); docs-shots-base-harness.log + datajson-samples-base-harness.txt (negative control: the 05a6ff3 harness, settings-index only); docs-shots-head-absent.log + datajson-samples-head-absent.txt; camera-on-settings.log + datajson-samples-camera-on-settings.txt (non-docs camera, switch ON); jest-camera-mutant.log (the new test FAILS against the 05a6ff3 `camera-data-json.cjs`) / jest-camera-head.log (passes); probe-example-yaml.log (the new running-an-encounter example parses and resolves). Images in `img/`: settings-index.switch-OFF-head-harness.png (byte-identical to the committed one), settings-index.switch-ON-base-harness.png, obsidian-shots-settings.switch-ON-head-harness.png, sample.05a6ff3.png / sample.eef9c63.png / sample.compare.png, tutorial-reading-mode.{05a6ff3,eef9c63}.png, tutorial-source-mode.rerun.png.

Probes ran in a throwaway `git worktree` (`worktrees/sc407-review-probe`), which has since been removed, with a private Xvfb (:177/:178), CDP port 9347 and camera tmp dir. The sc407 worktree is unchanged: `git status --porcelain` in DSE is empty, HEAD is eef9c63, and the superproject's ` M draw-steel-elements` was already there before the review.

## Findings

### LOW-1 — Audit §7 says the settings index has eight pages; it has ten
`docs/superpowers/dse-7.0.0-release-audit.md:219`. With the switch off the index shows 10 pages: Appearance, Typography, Statblock display, Featureblock display, Feature display, Element defaults, Rolling, Compendium, Links, Initiative tracker (`img/settings-index.switch-OFF-head-harness.png`). With it on there are 11, the extra one being Authoring (`img/obsidian-shots-settings.switch-ON-head-harness.png`). README, settings.md and migrating-to-7.md already say ten. **Scenario:** a 7.0.0 walkthrough checker counts 8 against the audit and files a false bug. **Fix:** change "**eight**" to "**ten**". This matches the owner's planned FOLD. (The implementer report's "9 rows" for settings-index.png is a mistake in the report only.)

### LOW-2 — A CHANGELOG bullet still names an encounter-builder surface
`CHANGELOG.md:70-71` (SC-318): "— and the roster heading and initiative group headers —". "The roster heading" is `.dse-enc__roster-heading` (styles-source.css:3842, :18757), which belongs to `ds-encounter`. The prune dropped "hero region title" from the same sentence but kept this one. **Scenario:** a user reads that a heading which does not exist in 7.0.0 was fixed. **Fix:** cut "the roster heading and" so the sentence reads "— and the initiative tracker's group headers —".

### LOW-3 — The new running-an-encounter example has a softened sync note and a rules-wrong minion squad
`docs/running-an-encounter.md:9-10` and `:26-31`. The example's YAML is valid. I parsed it and ran resolveInitiativeRefs with a stub resolver: the squad pool comes out as 6×10=60 and the dragon's Stamina is filled from its statblock. Both codes exist in data-unified. Two problems:
- (a) The prose now says "You'll want the compendium synced … if you'd rather reference monsters". But the only example references monsters by code. Without a sync, both groups fail with the "not available in this vault" error card.
- (b) `goblin-stinker` is a **Horde Controller**, not a Minion. It is listed as a 6-strong `squad_role: minion` squad, which an informed Director will notice. This was copied from the removed encounter example.

**Fix:** (a) say plainly that the example below needs the compendium synced, or add one inline creature (`name` plus `max_stamina`). (b) use a real goblin minion, e.g. `.../goblin-runner`. The data has goblin-runner, goblin-sniper and goblin-spinecleaver with `organization: Minion`.

### LOW-4 — The O3 switch-OFF guarantee covers only the Obsidian half of docs-shots
`visual-harness/entry.ts:103` calls `setExperimental(true)` for the browser harness, so the 14 browser docs images are captured with the switch ON. None of today's images is affected. I checked each source:
- The browser manifest no longer contains a deferred element.
- The `sample.png` gallery is feature, initiative and statblock.
- The pencil needs `authoringControls`, which is off by default.
- The pin item only appears in an open menu.

**Scenario:** a 7.0.x author adds a browser entry for a deferred element (for example by restoring one from the §11a map before its ticket ships). It renders as a full element instead of the placeholder, and nothing catches it. **Fix (cheap):** make `docs-shots.mjs` refuse any `DOCS_SHOTS` entry whose `element`/`gallery` id is a `deferred` definition. Alternatively, have docs mode pass a query flag that `entry.ts` honours with `setExperimental(false)`. Also add one line to visual-harness/README.md's docs-shots section stating which half runs with the switch on and which with it off.

### LOW-5 — The developer docs are slightly stale about the switch (item 7)
`AGENTS.md` and `.repo-docs/integration.md` are accurate against `experimental.ts`: 22 registered = 11 (6.0.2) + roll + scc + 4 D8 + 5 D7; 13 ship (11 + scc + montage); 9 gated. Three loose ends remain:
- `.repo-docs/architecture.md:111` (the `experimental.ts` row) still says the "lifecycle/camera scratch vaults (`data.json`) opt IN". It does not mention that the docs camera is now forced OFF.
- `AGENTS.md:152` points to the restore map as "§11"; it is §11a.
- AGENTS.md:142-145 still says the "camera scratch vaults run with it ON" right before the new docs-camera sentence. That reads as a contradiction.

**Fix:** add "except `npm run docs-shots` (`--docs`), which forces it OFF" to the architecture.md row and to AGENTS.md:144, and change §11 to §11a.

### LOW-6 — A re-worded CHANGELOG sentence is garbled
`CHANGELOG.md:535` (SC-142 [INTERNAL]): "`npm run docs-shots` regenerates every one of them that can be from the real plugin". **Fix:** "regenerates all of them that are not hand-recorded, from the real plugin," or simply "regenerates them from the real plugin".

### INFO
- **I1:** `docs/index.md:21` still says "Run an encounter — build it, then run it". The guide now says "Set up the fight". An optional wording change; "build" is generic.
- **I2:** These remaining "sidebar" mentions refer to Obsidian's own sidebar leaf, a narrow-width layout that ships: `negotiation-tracker.md:236`, `skills-element.md:68`, `stamina-bar.md:118`. Correctly kept. The pencil icon at the top right of `tutorial-reading-mode.png` is Obsidian's own edit-view button. The DSE menu panel in that image shows only the collapse chevron, with no pencil or pin.
- **I3 (Q-a): sample.png.** The manifest's gallery (`feature, initiative, statblock`, dpr 1) is unchanged by SC-407. The committed 05a6ff3 image was stale: it was last regenerated at b8373c4 (SC-152) and its third panel was a **`ds-hero` card**, a deferred element at the top of the README. The new third panel is the full Human Bandit Chief statblock with three abilities and three villain actions. That is the whole 3261→6002 px growth (`img/sample.compare.png`). There is no placeholder card, expanded disclosure or broken layout. A shorter statblock fixture for a README image is an optional, out-of-scope polish item.
- **I4 (Q-b): negotiation.gif.** No doc referenced it at 05a6ff3 either (`media-audit.txt`). `git log -S` shows SC-379's 46c8357 removed the reference. The blob is unchanged (9c30d28 at both revisions). DROP.
- **I5 (Q-d): drive-bys are correct.**
  - `settings.md` `feature.md`→`Features.md` cleared base's only broken link (mkdocs warned about it at 05a6ff3).
  - The "New command: Sync compendium" bullet now agrees with the [BREAKING] bullet at CHANGELOG.md:25, `main.ts:592` and migrating-to-7.md:42.
  - The common-element-fields reword is accurate: montage, initiative and skills contribute `chromeItems()`, and `pipeline.ts` orders them to the left of collapse. It is not a teaser.
- **I6:** On a re-run, 29 of 30 docs images were byte-identical. `tutorial-source-mode.png` differs by 141 px in a 424×68 area at the top left, which looks like a window or tab-title flicker. This is pre-existing camera non-determinism, not a defect.
- **I7:** In `canvas-character-sheet.png`, the stamina card's "Read-only" badge overlaps the "31" numeral. This is a pre-existing product layout issue that now shows in a docs image. It belongs to the 7.0.0 walkthrough (audit §4 "badge placement"), not to SC-407.
- **I8:** Pulling the SC-134 bullet is fine. The shipped capability (an initiative `statblock:` that takes an `scc.v1:` code) is still covered by CHANGELOG.md:798-800.
- **I9:** The O2 restore map was spot-checked and is accurate. All 16 cited `05a6ff3:CHANGELOG.md` line numbers land on the named bullet. The page, image and manifest paths exist at 05a6ff3.

## Checklist results
1. **Completeness (my own grep):** the nine element names and every registry alias (`ds-cond`, `ds-r`, `ds-power-roll` included), sidebar / pin / send / unpin, pencil / form editor / edit button / authoring, printPreview / print preview, encounter builder, hero sheet / suite / trackers, heroic resource, surges, hero tokens, party / project / downtime, Roll.md / roll.png, `_dse_anchor`, Director's, builder / budget / "Open in sidebar". The remaining hits are all justified: generic "authoring", Obsidian's own sidebar leaf, montage's "pencil mark", "Hero tracker" headings for the Stamina bar. The only exception is LOW-2. The `experimental` switch appears nowhere in the user docs, README or CHANGELOG.
2. **Over-pruning:** none. Every touched page was diffed against 05a6ff3. Each of these is still present: ds-scc; montage (own page, catalog row, CHANGELOG); rolling on ability cards (Features.md § kept, settings Rolling page, advanced-usage Rolling); the text-scale trio; the print layout (advanced-usage Print and PDF export, styling-statblocks Printing and PDFs, CHANGELOG SC-170 re-worded to keep it); the Conditions manager via the initiative tracker (hero-suite pointer, CHANGELOG SC-186 kept); LegacyCompendiumModal; all 11 6.0.2 elements.
3. **CHANGELOG:** the header is still `## 7.0.0 (unreleased; previously numbered 6.0.0)` and the switch is not mentioned. Wholly-deferred bullets were pulled, and mixed bullets keep only the shipped part (spot-checked SC-169, SC-160, SC-170, SC-152, SC-154, SC-186, SC-141). Exceptions: LOW-2 and LOW-6.
4. **O1–O5:** O1 is met: no teasers, one placeholder note at migrating-to-7.md:252-255, and its quoted text matches `pipeline.ts:299` (`${aliases[0]} is not available in this release.`). Every deferred element is new in 7.0.0 (audit §1), so the "a beta build" wording is accurate. O2 is accurate (I9). O3 is proven (summary). O4: see item 3. O5: mkdocs has no `nav:`, and 0 new link or anchor warnings.
5. **Harness:** the change is minimal: `seedExperimental(file, on = true)` plus `!DOCS_MODE` at the one call site. The new jest test is not vacuous; it fails against the base cjs. No gate moved.
6. **Images:** 33 Media files = 33 manifest `out`s (30 DOCS_SHOTS + 3 DOCS_MANUAL). Every doc-referenced image exists. The only unreferenced files are favicon.ico (used by mkdocs.yml) and negotiation.gif. The settings index, command palette (13 element inserts + 2 compendium inserts), reading-mode menu and canvas show no deferred surface.
7. **Dev docs:** LOW-5.
8. **Gates:** summary.
