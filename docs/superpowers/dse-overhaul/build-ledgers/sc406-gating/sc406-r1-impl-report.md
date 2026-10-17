# SC-406 round 1 — implementer report

**Executive summary**
- Verdict: DONE. Branch `sc406-gating` (draw-steel-elements), base `f8693b5` (origin/develop unchanged at finish), final sha **3fddf49** (3 commits: bd80fd4 feature, 8766fc1 tests+docs, 3fddf49 tsc typing of a test roster). Tree clean.
- Gates (measured): tsc clean; lint clean; jest **4412 passed / 1 skipped / 217 of 218 suites** (+45 tests, +2 suites vs 4367/215-of-216; both skips are machine-cache skips, see Gates); lifecycle **25/25**; shots **568**, 0 FAIL, every in-run gate OK; freeze **`freeze OK (274/274 …)`** unmoved; parity **0 GAPs / 0 undeclared / 24 DECLARED**.
- No frozen byte moved; `freeze-baseline.sha256` untouched; no frozen shot added.
- Off-state evidence is from REAL Obsidian 1.14.4 (own Xvfb :160+, own port): placeholder card dark + light, Settings index + Appearance page. Evidence in `evidence-r1/`.
- Off state never writes: asserted in jest (no `modifyCalls`, bytes identical) AND in real Obsidian (note bytes identical after render).
- Stale sidebar leaf in a saved workspace, measured in real Obsidian: shows "Plugin no longer active — The plugin that created this tab (dse-sidebar) has gone away. [Close]". Not handled (Follow-up).
- Known flake `sidebarInitiative` SC-288 r2: did not fire in any run.

## Files changed (draw-steel-elements, f8693b5..3fddf49)
- `src/framework/experimental.ts` (new): the switch. `isExperimental()` / `setExperimental()` / `readExperimentalSetting()` (strict `=== true`). Default OFF.
- `src/model/Settings.ts`: `experimental?: boolean` on `DSESettings` (doc only; NOT in `DEFAULT_SETTINGS`).
- `main.ts`: `setExperimental(...)` once in `onload` right after `loadSettings`; `prefs.describe(activePrefDescriptors())`; sidebar block (registerDseSidebar, encounter hand-off, `send-initiative-to-sidebar`) wrapped in `if (isExperimental())` (reindent only, `git diff -w` is small); legacy `download-data-md-dse` command deleted.
- `src/framework/registry.ts`: `ElementDefinition.deferred?: boolean`; `isDefinitionHidden(def)` = `hidden || (deferred && !experimental)`.
- `src/authoring/insert.ts`, `src/authoring/suggest.ts`: use `isDefinitionHidden` instead of `def.hidden`.
- `src/elements/{encounter,project,party,conditions,resource,surges,tokens,roll,hero}/definition.ts`: `deferred: true` (one line each).
- `src/framework/pipeline.ts`: `renderDeferredCard()` + early return at top of `ElementPipeline.run` for `deferred && !experimental`; "Pin to sidebar" / "Unpin from sidebar" chrome items gated on `isExperimental()`.
- `src/prefs/catalog.ts`: `EXPERIMENTAL_PREF_KEYS` (`authoringControls`, `printPreview`) + `activePrefDescriptors()`. `DSE_PREF_DESCRIPTORS` stays the full list.
- `styles-source.css`: `.dse-deferred-card` (neutral Obsidian tokens only).
- `test/setup/experimental-on.ts` (new) + `jest.config.ts` (`setupFilesAfterEnv` both projects): suites run ON, re-armed `beforeEach`.
- `test/mocks/obsidian-core.ts`: mock `Plugin.loadData()` returns `{ experimental: true }` (real-onload tests keep the full plugin; off tests override `loadData`).
- `visual-harness/entry.ts`: `setExperimental(true)`. `visual-harness/obsidian-lifecycle.mjs`: scratch vault `data.json` = `{experimental:true}`. `visual-harness/obsidian-camera.mjs` (`seedUdd`): merge-writes `experimental:true` into the repo-root `data.json` (git-ignored; demo-vault's plugin dir is a symlink to the repo root), so `obsidian-shots` / `docs-shots` keep rendering everything. Camera change syntax-checked only (`node --check`), not run end-to-end.
- Tests: `test/unit/framework/experimental.test.ts` (new), `test/dom/framework/experimentalGate.test.ts` (new), additions to `test/dom/views/settings-tab.test.ts` and `test/dom/elements/initiative.test.ts`; one assertion flipped in settings-tab "D3 temporary commands are gone" (`download-data-md-dse` now `not.toContain`).
- Docs: `docs/migrating-to-7.md` (one paragraph under §1), `CHANGELOG.md` (one `[BREAKING]` bullet at top of the 7.0.0 section; the repo has no "Unreleased" header — the 7.0.0 (unreleased) section is its convention), `.repo-docs/architecture.md` (`experimental.ts` row), `AGENTS.md` (one Important-Constraints bullet). Workspace CHANGELOG untouched.

## Per-gated-surface tests (the off state, each with an ON control)
Unit (`test/unit/framework/experimental.test.ts`, 9): fresh module is OFF; set/read round-trip; strict `=== true` parsing; `isDefinitionHidden` deferred off/on; `hidden:true` stays hidden / ordinary never; catalog off drops exactly the two keys (text-scale + rolling prefs stay); catalog on = whole list; not in `DEFAULT_SETTINGS`; `migrateSettings` carries a present key and never adds an absent one.
Dom (`test/dom/framework/experimentalGate.test.ts`, 33):
- roster: exactly the nine carry `deferred`; `ds-scc`/`ds-montage` do not.
- card, per element (x9 each): `off: <alias> renders the inert "not available in this release" card` (text, root stamped `deferred`, no button/link/input/tabindex, no error card, no chrome); `on: <alias> renders as it always did`.
- `off: the shipping elements are untouched (ds-counter and ds-montage still render)`.
- `off: opening a deferred block through the REAL processor leaves the note's bytes unchanged — no write, no anchor, no state` (real `onload`, real registered processor, click/press on the card, waits past the persist debounce, `modifyCalls` empty, bytes equal, `viewRegistry.liveEntries()` empty).
- discovery: `off: the Insert commands and /ds list leave out the nine; ds-scc and ds-montage stay` (13 insert commands); `on: all offered again, except ds-hero`; `registerInsertCommands honours the switch at registration time`.
- sidebar: `off: no view type, ribbon icon, open/send/send-initiative commands`; `on: all registered`; `off: a shipping block's menu has no "Pin to sidebar"; on: it does`; `off: a sidebar-mounted host offers no "Unpin"; on: it does`.
- prefs/alias/round-trip: `off: authoringControls / printPreview are not described; a per-block prefs: naming them is rejected with the existing warning`; `on: both described and printPreview override accepted`; `legacy alias gone with the switch on AND off`; `a settings save round-trips experimental untouched (and does not invent it)`; `onload reads the key once: absent / false / "true" => off, true => on`.
Settings (`settings-tab.test.ts`, 2): off: no Authoring page, Appearance has no Print preview row; on: both back.
Initiative (`initiative.test.ts`, 1): `with the experimental switch OFF the tracker's ConditionsModal still opens, adds and closes` (Conditions manager not gated).

## Design findings
- **`viewAdoption`** is read at `main.ts` (`this.settings.viewAdoption !== false`) and handed to `registerFrameworkElements(..., { viewAdoption })` -> `ViewRegistry({enabled})`. `experimental` mirrors it in the read-once-at-load sense, but a module singleton (`experimental.ts`) rather than an option, because the consumers (registry hidden check, pipeline chrome builder, catalog filter) have no handle on the plugin, and build tooling with no `data.json` must see OFF without wiring. Default OFF; tests/harness/scratch vaults opt IN.
- **Settings round-trip**: `loadSettings` = `migrateSettings(loadData())` (`Object.assign(DEFAULT_SETTINGS, raw)` keeps unknown keys); `saveSettings` = `saveData(this.settings)`. A prefs save (debounced `createSaveDataPrefsStorage`) only replaces `settings.prefs`. Proven by test: key present stays, key absent is not created.
- **`hidden` flow today**: consumed only by `src/authoring/insert.ts` (`registerInsertCommands`, once at onload) and `src/authoring/suggest.ts` (`/ds`, per keystroke). Now both go through `isDefinitionHidden`. `src/authoring/schemaSuggest.ts` does NOT consult `hidden` (key/enum autocomplete still works inside a `ds-encounter` fence while off) — Follow-up.
- **Build-time docs**: there is no registry-driven docs generator. `docs/*.md` is hand-written (the SC-407 task); `docs-shots` renders through the harness (switch ON via `entry.ts`) and the real-Obsidian camera (switch ON via seeded `data.json`), so generated doc images are unchanged. Nothing consumes `hidden` at build time, so "see the off state" has no concrete effect today beyond the default being OFF. Deferred elements remain described in docs until SC-407.
- **Placeholder card**: built from the definition only (id + canonical alias), BEFORE `createRenderContext`/`prepareModel`/`createView`: no parse, no validation, no session slot, no `ViewRegistry` ownership, no anchor, no write. Root stamped `data-dse-element="deferred"` (+ `data-dse-deferred="<id>"`) NOT the element id, because ~50 element-scoped CSS rules hang off `[data-dse-element="<id>"]`. Click shield armed (so clicks don't open the block for editing). Styled `--background-secondary` / `--background-modifier-border` / `--text-muted`, no accent bar/hue. Text is `ds-<canonical> is not available in this release.` (shows the canonical alias even if the author typed an alias like `ds-cond`).
- **Contrast with ON (real Obsidian)**: with the switch ON the same note IS modified on render (deferred elements mint state/ids), with OFF it is byte-identical — see `facts-on.json` vs `facts-off.json` (`noteUnchanged`).
- **Stale sidebar leaf (saved workspace with a `dse-sidebar` leaf, switch off), measured in real Obsidian 1.14.4**: the leaf survives in the layout and shows a stock Obsidian placeholder: heading "Plugin no longer active", "The plugin that created this tab (dse-sidebar) has gone away.", a Close button. `getLeavesOfType('dse-sidebar')` still returns it; nothing throws. Screens: `…--stale-sidebar-leaf--obsidian-{dark,light}.png`. Not handled in code: auto-detaching a user's leaf at load is not obviously correct (workspace may not be laid out at `onload`; would need `onLayoutReady`) — Follow-up.
- **Conditions manager** is untouched (`ConditionsModal` / `ds-conditions` strip are separate; only the element definition got `deferred`); covered by an initiative test with the switch off.
- **Orphaned stored prefs**: `PreferenceStore.persist()` iterates described descriptors only, so a stored `printPreview` / `authoringControls` in `data.json` `prefs` is dropped on the next prefs save while off. Not read or applied while off. No migration per ledger — Follow-up note only.

## Gates (logs in /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc406-gating/logs-r1/)
| Step | Result | Log |
|---|---|---|
| tsc | clean | g1-tsc.log |
| lint | clean | g2-lint.log |
| jest | 4412 passed / 1 skipped / 217 of 218 suites, 3 snapshots (delta +45 tests = 9 + 33 + 2 + 1; +2 suites) | g3-jest.log |
| lifecycle | `OBSIDIAN-LIFECYCLE done: 25/25 ok, 0 failed` (port 9291, display :160) | g4-lifecycle.log |
| shots | 568 PNGs, 0 FAIL; in-run gates all OK (host-copy pin, button/input/table/list/inline/checkbox/prose host-leak, print-twin delta, nested corner-radius, chrome placement…) | g5-shots.log |
| freeze | `freeze OK (274/274 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)` | g6-freeze.log |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` | g7-parity.log |
Notes: this worktree had no `node_modules` (`npm ci` run, npm-ci.log) and no cached `visual-harness/dist/obsidian-app.css`, which makes one `printTwinDeltaAllowedSet` test skip (a first jest run showed 2 skipped, 4411 passed); `npm run host-css` populated it (pinned 1.13.7, host-css.log) and the final jest above has 1 skipped (the `migrationCensus` suite, no census tree). `rm -f main.js styles.css` before jest per skill.

## Evidence (outside the frozen set; nothing added to shots/ or the baseline)
Dir: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc406-gating/evidence-r1/ — real Obsidian 1.14.4, own Xvfb, port 9293, scratch vault, reading mode.
- `sc406-placeholder-card--switch-off--obsidian-dark.png`, `…--obsidian-light.png` (clean: four cards under a live ds-counter)
- `sc406-placeholder-card--switch-off--stale-sidebar-leaf--obsidian-{dark,light}.png` (same, with a saved dse-sidebar leaf in the right split)
- `sc406-settings-index--switch-off--obsidian-dark.png` (no Authoring page), `sc406-settings-appearance--switch-off--obsidian-dark.png` (Reduce motion, Initiative portraits; no Print preview)
- ON controls: `sc406-placeholder-card--switch-on--obsidian-{dark,light}.png`, `sc406-settings-index--switch-on--…`, `sc406-settings-appearance--switch-on--…`
- Facts: `facts-off.json`, `facts-off-stale-sidebar-leaf.json`, `facts-on.json` (commands, ribbon, leaves, cards, roots, noteUnchanged), `settings-pages-{off,on}.json`, `appearance-rows-{off,on}.json`
- Driver (scratch, not in repo): `evid-driver.scratch.mjs` (helpers lifted from obsidian-lifecycle.mjs)
Facts off: commands = the 13 insert-* + insert-compendium-reference/-block + sync-compendium + migrate-compendium-layout (no sidebar commands, no legacy alias, no insert for the nine); ribbon has no Draw Steel icon; settings pages have no Authoring; Appearance rows = Reduce motion, Initiative portraits, Reset appearance. (The "Update Available" overlay in shots is an Obsidian host notice, not ours.)

## Drive-by fixes:
- `main.ts`: the stale comment "Keep for the 6.x cycle; remove in 7.0.0 (F2 §3.4)" next to the legacy alias was replaced by the removal note (it went with the deleted command).
- `test/dom/views/settings-tab.test.ts`: the one assertion that required `download-data-md-dse` was flipped (necessary consequence of the alias removal, not a drive-by in the strict sense).

## Follow-ups:
1. `src/authoring/schemaSuggest.ts` (in-fence key/enum autocomplete) ignores `hidden`/`deferred`: while off it still offers keys inside a `ds-encounter`/`ds-hero`/… fence. Cosmetic; one-line `isDefinitionHidden` guard if wanted.
2. Stale `dse-sidebar` leaf in saved workspaces shows Obsidian's stock "Plugin no longer active … Close" tab. Optional cleanup = detach that leaf type in `onLayoutReady` while off; not obviously safe, left.
3. Orphaned stored `printPreview` / `authoringControls` in `data.json` `prefs` are dropped on the next prefs save while off (descriptor not described); re-enabling the switch later starts from defaults. No migration per ledger §13.11.
4. Dead code is retained by design while off: sidebar CSS, `requestPinToSidebar`, the encounter "Open in sidebar" handoff seam (unreachable, the element is deferred). No settings rows were found that mention or depend on the sidebar, so nothing to report there.
5. Docs/README still describe the deferred elements, sidebar, pencil and print preview: SC-407.
6. `obsidian-camera.mjs` seeding change was only syntax-checked (`obsidian-shots`/`docs-shots` not run: out of the battery). Worth one `npm run docs-shots` before release to confirm doc images are unchanged.
