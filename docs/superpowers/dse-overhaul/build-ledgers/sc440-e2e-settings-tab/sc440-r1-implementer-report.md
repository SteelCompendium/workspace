# SC-440 round 1 (phase A) — implementer report

## Executive summary

- **Status: NEEDS_CONTEXT (phase A stop, as ordered).** Branch `sc440-e2e-settings-tab` (draw-steel-elements) head `9ac04ea0`, 3 commits on `a5313f9d` (origin/develop unchanged, no rebase). Nothing pushed, superproject untouched.
- Gates: tsc clean, lint clean, full jest **12321 passed / 2 skipped / 0 failed** (fresh worktree; baseline fresh 12132/2, so +189 tests), jsdom census 59/59, real-Obsidian census CENSUS-16/17 2/2 ok (partial run, coverage `0/351 pairs`: 233 + 118 new).
- **78 control ids, 118 (control, kind) pairs** in `e2e/manifest/settings-tab.ts` (ticket says "about 45 controls": 42 settings controls = 34 descriptor rows + Preset + 7 Compendium/Links/Initiative controls; the other 36 ids are 12 font sub-nodes, the image-clear X, 9 reset rows and 14 page/Advanced links).
- **6 bugs** for filing (1 high, 2 medium, 3 low), none matches a known open ticket; details below. Integrity probes (11) found no defect.
- Mechanic (a): Sync/Check ARE drivable with no network and no new stub code: replace `app.plugins.plugins['draw-steel-elements'].syncService.requestUrlFn` page-side (a deferred promise also holds the busy state open). Verified in real Obsidian.
- Mechanic (b): gate ON per scenario = `before(() => dse.setPrefs({}, { experimental: true }))` + `after(() => dse.setPrefs({}))`, the shape five existing specs already use; verified by CENSUS-17.
- **Design call to confirm:** obsidian renders native rows itself, so ids are stamped after render through a `visible` predicate + the tab's `getElementForDefinition` (undocumented in the 1.13 typings, present in 1.14.4). Attribute-only; see "How ids are stamped".

## Commits (draw-steel-elements, branch sc440-e2e-settings-tab)

- `8cf9ad21` feat(SC-440): data-dse-control ids on every settings-tab control, settings manifest, jsdom and real-Obsidian censuses
- `f0199e24` test(SC-440): settings-tab jsdom matrix (descriptor x value, gate, presets, resets, sliders, fonts, Sync/Check busy) and data.json integrity suites; settings fixtures
- `9ac04ea0` test(SC-440): settings manifest comment names the Roller and SCC fallback representatives

## How ids are stamped (and why this shape)

Obsidian 1.13+ draws native `control` rows, `action` rows and page links itself; `SettingDefinition` has no class/id/attribute hook, so the kit factories' `control` option cannot apply. What obsidian does give: a `visible` predicate it evaluates right AFTER rendering each row (and on every `refreshDomState()`), and `PluginSettingTab.getElementForDefinition(def)` (in the 1.14.4 bundle, not in the 1.13.1 typings; I call it duck-typed and guard its absence, because in a popout window the element is another realm's `HTMLElement`). So:

- `src/views/settingsControlIds.ts` (new): id helpers; a descriptor's id comes from its key (`sbFeatureStyle` -> `settings.sb-feature-style`), so adding a pref needs no id edit.
- `src/views/settingsDeclarative.ts`: `toSettingDefinitions(sections, onResetAll, stamp?)` adds an always-true `visible` that calls `stamp(def, id, target)` for control rows, section pages, nested Advanced pages, reset rows and the reset-all row. Without `stamp` the output is unchanged.
- `src/views/SettingsTab.ts`: `stampDefinition` (uses `getElementForDefinition`, finds the toggle label / select / range / input / file combobox / row inside it) and inline `stampControl(...)` on the nodes its own `render` callbacks build (Preset, six font dropdowns + custom text + "List installed fonts", Sync, Check). `NavRow.id` carries the id.
- No behaviour change: the predicate answers true. One existing assertion pinned the exact key list of a definition and now lists `visible` (test/dom/views/settings-tab.test.ts, one line + comment).
- Alternative I rejected: rebuilding native rows as `render` rows (loses `refreshDomState`/disabled predicate and the native binding, a behaviour change); and driver-side name matching (would not satisfy "every interactive node carries an id").

Real-Obsidian facts that shaped it (all measured in 1.14.4): the settings window is a POPOUT window (second window handle, own document, no `app`; `window.opener.app` reaches the plugin); pages replace each other inside `.vertical-tab-content-container`; a toggle is `label.checkbox-container` (keydown listener, tabindex 0), a dropdown `select.dropdown` plus an `aria-hidden select.is-measuring` clone, a slider `input.slider`, the Default creature image path a `div.combobox-button.mod-file` plus a `.combobox-clear-button`, action rows (`mod-action`) and page links (`mod-navigable`) are clickable rows with no inner control.

## Controls (78 ids)

Pages (11 with Authoring): `settings.page.{appearance,typography,statblock-display,featureblock-display,feature-display,element-defaults,rolling,compendium,links,initiative-tracker}` + `settings.page.authoring` (gate on). Advanced links (3): `settings.advanced.{typography,statblock-display,element-defaults}`. Resets (8 + all): `settings.reset.{appearance,typography,statblock-display,featureblock-display,feature-display,element-defaults,rolling}`, `settings.reset.authoring` (gate on), `settings.reset-all`.

Appearance: `settings.reduce-motion`, `settings.portraits`, `settings.print-preview` (gate on). Typography: `settings.font-{title,body,controls,card-body,label,mono}` each with `.custom` (free-text) and `.list` (List installed fonts); `settings.{text,card,small-text,large-text,control-text}-scale`. Statblock display: `settings.sb-preset`, `sb-feature-style`, `sb-density`, `sb-columns`, `sb-stats`, `sb-char-line`, `sb-char-box`, `sb-villain`, `sb-sticky`, `sb-sticky-meta` (dependent). Featureblock display: `settings.fb-feature-style`, `fb-stats`. Feature display: `settings.kw-usage`, `dist-target`. Element defaults: `settings.collapsible-default`, `collapse-default`, `stamina-recovery-popover`. Rolling: `settings.rolling-enabled`, `roller-engine`, `roll-click-to-roll`. Authoring (gate on): `settings.authoring-controls`. Compendium: `settings.compendium.{destination,release,locale,sync,check}`. Links: `settings.links.scc-web-fallback`. Initiative tracker: `settings.initiative.default-image` and `.clear`.

Gated (4 ids, absent with the gate off): `settings.print-preview`, `settings.authoring-controls`, `settings.page.authoring`, `settings.reset.authoring`.

## Manifest pairs (118)

Counts by kind: click 45, press:ArrowDown 20, press:Space 12, press:End 11, type 8, blur 8, press:ArrowRight 5, press:Home 5, click-disabled 3, press:Enter 1. Kinds were chosen from what real input does on obsidian's native widgets (probed in real Obsidian): click and Space/Enter toggle a checkbox label; ArrowDown on a focused select picks the next option and fires change (the native popup list cannot be driven by the protocol); ArrowRight/Home/End move a range input; typing writes on every keystroke. Scenario row ids `SET-<group><nn>` (N pages, R resets, T toggles, D dropdowns, F fonts, Z sliders, X fields, C compendium, G gate-on). The owner can trim: the easy cuts are `press:Space` on toggles (12), `press:End` on fonts/sliders (11) and `blur` (8).

Full list (id: kinds (rows)):

- `settings.page.appearance`: click  (SET-N01)
- `settings.page.typography`: click  (SET-N02)
- `settings.page.statblock-display`: click  (SET-N03)
- `settings.page.featureblock-display`: click  (SET-N04)
- `settings.page.feature-display`: click  (SET-N05)
- `settings.page.element-defaults`: click  (SET-N06)
- `settings.page.rolling`: click  (SET-N07)
- `settings.page.compendium`: click  (SET-N08)
- `settings.page.links`: click  (SET-N09)
- `settings.page.initiative-tracker`: click  (SET-N10)
- `settings.page.authoring`: click  (SET-G01)
- `settings.advanced.typography`: click  (SET-N11)
- `settings.advanced.statblock-display`: click  (SET-N12)
- `settings.advanced.element-defaults`: click  (SET-N13)
- `settings.reset.appearance`: click  (SET-R01)
- `settings.reset.typography`: click  (SET-R02)
- `settings.reset.statblock-display`: click  (SET-R03)
- `settings.reset.featureblock-display`: click  (SET-R04)
- `settings.reset.feature-display`: click  (SET-R05)
- `settings.reset.element-defaults`: click  (SET-R06)
- `settings.reset.rolling`: click  (SET-R07)
- `settings.reset.authoring`: click  (SET-G04)
- `settings.reset-all`: click  (SET-R08)
- `settings.reduce-motion`: click, press:Space  (SET-T01)
- `settings.portraits`: click, press:Space  (SET-T02)
- `settings.sb-sticky`: click, press:Space  (SET-T03)
- `settings.sb-sticky-meta`: click, click-disabled, press:Space  (SET-T04, SET-T05)
- `settings.collapsible-default`: click, press:Space  (SET-T06)
- `settings.collapse-default`: click, press:Space  (SET-T07)
- `settings.stamina-recovery-popover`: click, press:Space  (SET-T08)
- `settings.rolling-enabled`: click, press:Space  (SET-T09)
- `settings.roll-click-to-roll`: click, press:Space  (SET-T10)
- `settings.links.scc-web-fallback`: click, press:Space  (SET-T11)
- `settings.print-preview`: click, press:Space  (SET-G02)
- `settings.authoring-controls`: click, press:Space  (SET-G03)
- `settings.sb-preset`: press:ArrowDown  (SET-D01)
- `settings.sb-feature-style`: press:ArrowDown  (SET-D02)
- `settings.sb-density`: press:ArrowDown  (SET-D03)
- `settings.sb-columns`: press:ArrowDown  (SET-D04)
- `settings.sb-stats`: press:ArrowDown  (SET-D05)
- `settings.sb-char-line`: press:ArrowDown  (SET-D06)
- `settings.sb-char-box`: press:ArrowDown  (SET-D07)
- `settings.sb-villain`: press:ArrowDown  (SET-D08)
- `settings.fb-feature-style`: press:ArrowDown  (SET-D09)
- `settings.fb-stats`: press:ArrowDown  (SET-D10)
- `settings.kw-usage`: press:ArrowDown  (SET-D11)
- `settings.dist-target`: press:ArrowDown  (SET-D12)
- `settings.roller-engine`: press:ArrowDown  (SET-D13)
- `settings.compendium.locale`: press:ArrowDown  (SET-D14)
- `settings.font-title`: press:ArrowDown, press:End  (SET-F01)
- `settings.font-title.custom`: type, blur  (SET-F01)
- `settings.font-title.list`: click  (SET-F01)
- `settings.font-body`: press:ArrowDown, press:End  (SET-F02)
- `settings.font-body.custom`: type, blur  (SET-F02)
- `settings.font-body.list`: click  (SET-F02)
- `settings.font-controls`: press:ArrowDown, press:End  (SET-F03)
- `settings.font-controls.custom`: type, blur  (SET-F03)
- `settings.font-controls.list`: click  (SET-F03)
- `settings.font-card-body`: press:ArrowDown, press:End  (SET-F04)
- `settings.font-card-body.custom`: type, blur  (SET-F04)
- `settings.font-card-body.list`: click  (SET-F04)
- `settings.font-label`: press:ArrowDown, press:End  (SET-F05)
- `settings.font-label.custom`: type, blur  (SET-F05)
- `settings.font-label.list`: click  (SET-F05)
- `settings.font-mono`: press:ArrowDown, press:End  (SET-F06)
- `settings.font-mono.custom`: type, blur  (SET-F06)
- `settings.font-mono.list`: click  (SET-F06)
- `settings.text-scale`: press:ArrowRight, press:Home, press:End  (SET-Z01)
- `settings.card-scale`: press:ArrowRight, press:Home, press:End  (SET-Z02)
- `settings.small-text-scale`: press:ArrowRight, press:Home, press:End  (SET-Z03)
- `settings.large-text-scale`: press:ArrowRight, press:Home, press:End  (SET-Z04)
- `settings.control-text-scale`: press:ArrowRight, press:Home, press:End  (SET-Z05)
- `settings.compendium.destination`: type, blur  (SET-X01)
- `settings.compendium.release`: type, blur  (SET-X02)
- `settings.initiative.default-image`: click, press:Enter  (SET-X03)
- `settings.initiative.default-image.clear`: click  (SET-X04)
- `settings.compendium.sync`: click, click-disabled  (SET-C01, SET-C02)
- `settings.compendium.check`: click, click-disabled  (SET-C03, SET-C04)
Needs a driver tweak in phase B (declared now so it is not forgotten): `click-disabled` on `settings.sb-sticky-meta` (the label gets `is-disabled`, but `input.disabled` stays false and wdio `isEnabled()` answers true, so `dse.click` would record `click`); the same for the Sync/Check buttons is fine (real `disabled` buttons).

## Censuses

- **jsdom** (`test/dom/e2eCensus.test.ts`, new block "SC-440 census", 6 tests): container-scoped (the tab root's `containerEl`, one page at a time via the mock's new `renderPage(path)`: index, 10 pages, 3 Advanced pages, Authoring when on); interactive = the generic set plus `.mod-navigable, .mod-action, .checkbox-container, .combobox-button, .combobox-clear-button, .clickable-icon`; the preview stage (`.dse-settings-preview__stage`) is skipped (another surface's element). Tests: **the census bites** (an un-id'd `<button>` in `.setting-items` and `.setting-item-control`, an un-id'd `mod-action` and `mod-navigable` row, and an id outside the manifest each produce a finding; a button inside the preview stage does not); every page clean (gate on); the stamped ids across all pages equal the manifest exactly (no dead row, no stray id); gate off = same minus the four gated ids; every described pref with a control is stamped `settings.<kebab-key>`; stamps survive a repaint, `refreshDomState()` and a dependent row's disabling.
- **real Obsidian** (`e2e/specs/_census.e2e.ts`): `[CENSUS-16]` shipped tab, index + 10 pages + 3 Advanced pages, every eventful node (CDP listeners) is an id from the manifest, per-page must-show id lists, gated ids absent; `[CENSUS-17]` gate on (`dse.setPrefs({}, { experimental: true })` in `before`, restore in `after`): Print preview, Authoring page + reset appear, still clean. Both pass (2/2 ok). **How it opens the tab:** new `e2e/driver/settings.ts` — `openSettings()` runs the `app:open-settings` command, selects the tab with `app.setting.openTabById('draw-steel-elements')`, waits for a second window handle, `switchToWindow` onto it (every driver call then acts on that DOM); scope = `.vertical-tab-content-container *`, excluding `.setting-page-titlebar` (Obsidian's back button) and the preview stage; `showPage`/`back` navigate with plain (uncredited) clicks; `closeSettings()` / `ensureMainWindow()` return to the main window, and `closeEverything()` (cleanup.ts, +2 lines) calls `ensureMainWindow()` so a failing test cannot strand the next one. Page-side reads of the plugin from either window go through `APP = (window.app ?? window.opener.app)`.
- Shared-file edits are small and additive: `e2e/driver/cleanup.ts` (+import, +1 call), `e2e/specs/_census.e2e.ts` (imports + a block appended after CENSUS-12; ids 16, 17), `test/dom/e2eCensus.test.ts` (imports + a block appended), `e2e/README.md` (2 fixture rows + 1 bullet), `test/mocks/obsidian-core.ts` (below). SC-439 (CENSUS-13..15) will conflict only on the import lines and the file tails.
- **Mock change (shared, additive, `test/mocks/obsidian-core.ts`)**: the Fake components now render real DOM into the row (`label.checkbox-container`, `select.dropdown`, `input[type=text]`, `input.slider`, `button`, `div.extra-setting-button`; a `file` control a combobox); `PluginSettingTab` gains `getElementForDefinition`, evaluates `visible` after a render / `refreshDomState`, and a `renderPage(path)` that draws one page the way obsidian does (page link rows, groups, Advanced as a nested page); an `action` row is the clickable row itself (the recording FakeButton is kept so existing by-name tests still click it). The only suite that moved was the one definition-key-list assertion above; the full jest run is green.

## jsdom matrix and integrity tests

- `test/dom/views/_settingsHarness.ts` (helper): load the real plugin with chosen data.json, open the tab, drive a row by key or name, read the last `saveData` payload.
- `test/dom/views/settings-matrix.test.ts` (172 tests): every descriptor x each value (34 rows, 100+ cases: toggles both states, every select option, every font entry, slider min/default/step/max) -> `prefs.get`, data.json sparse slice (`{}` at the default, `{key: value}` otherwise), the reflected attribute / inline custom property on a REAL ds-statblock mounted through the pipeline, and no other setting moved; font free-text (raw save, sanitised on the element, blank = default, Custom… saves nothing, "List installed fonts" append/dedupe/sort/failure); sliders (limits per descriptor, below-min / above-max / off-step / NaN snapping, 17 and 9 positions); presets (members = `inPreset` descriptors, each preset writes nine members and leaves unrelated settings, each single-member change -> Custom, "Custom" pick is a no-op, preset replaced wholesale); Advanced pages (exact `advanced` descriptors, only three sections have one); per-section reset (all seven sections + Authoring via the gate test) and reset-all; gate off vs on (page and row inventories, gated toggles work, stored gated values survive off -> on); dependent row; operational fields (Destination/Release/Locale/image/SCC toggle persist, empty Release = latest); Sync/Check (busy x label x disabled for null/sync/check, opened mid-sync, a click on a disabled button does nothing, three Check outcomes + failure + refused); live rolling re-render on an open ds-feature; reload round trip (every control off its default, read back after a plugin reload, shown value + element agree) and font reopen state.
- `test/dom/views/settings-integrity.test.ts` (11 tests): see the next section.
- `test/dom/e2eCensus.test.ts` +6 (above); one assertion edited in `settings-tab.test.ts`.

## Fixtures added

`e2e/vaults/shipped/Settings/statblock.md` (the preview's Human Bandit Chief, without its per-block `sbSticky: off`), `e2e/vaults/shipped/Settings/featureblock.md` (the preview's Bloodstone of Yendral). Both verified to render in real Obsidian with the reflected `data-dse-*` attributes on their roots. Rows added to the fixture table in `e2e/README.md`. Other representatives reuse existing notes (`Stamina/basic.md`, `Stamina/recoveries.md`, `Initiative/tracker.md`, `Feature/feature.md`); the per-setting choice is in the manifest header comment.

## Integrity probes (all in settings-integrity.test.ts; all pass)

| Probe | Result |
|---|---|
| Unknown top-level data.json keys (`experimental`, `viewAdoption`, a foreign object) survive a pref change, preset, operational change and reset-all | survive |
| Unknown key INSIDE `prefs` | dropped by the next prefs save (pinned by design, SC-406) |
| Hand-edited out-of-range slider (textScale 5, cardScale 0.1) | element gets the clamped value; slider is handed 5 (browser clamps what it draws); an unrelated change leaves 5 in data.json; moving the slider stores the snapped value |
| Non-numeric / numeric-string slider ("abc", "1.2") | element: inert default / 1.2; data.json keeps what was typed |
| Unknown select value (sbDensity "dense") | Preset reads Custom; kept through an unrelated change (the attribute is stamped raw, CSS ignores it) |
| Wrong-typed toggles (reduceMotion "yes") | no throw, not rewritten |
| One change moves one key (every non-font control driven from defaults) | exactly its own key, back to `{}` |
| Operational change vs prefs slice, and the reverse | independent |
| `experimental` never written (absent stays absent; present stays) through toggle/select/slider/font/preset/operational/reset-all, gate off and on | confirmed |
| Two elements in two open notes (statblock + feature) | both re-render on an attribute pref and a custom-property pref, and on reset-all |
| Element mounted after a change | starts from the stored value |

## Bugs found (6) — none matches a known open ticket

1. **HIGH — "Destination folder" accepts an empty value, and Sync then offers to move the VAULT ROOT to the trash.** Repro (real Obsidian 1.14.4, evidence `.../scratchpad/sc440-impl-r1/probe12-log.txt`): Settings > Compendium, clear Destination folder (data.json `compendiumDestinationDirectory: ""`), click Sync in a vault with no sync manifest: the "Existing compendium folder found" window opens saying `""` already contains files, with "Keep everything" / "Move old compendium to trash". I did not click it. Cause: `src/views/SettingsTab.ts:589` (the `folder` control has no `validate`), `main.ts:671-677` (`syncOptions` passes the root as typed), `main.ts:735` (`root instanceof TFolder && root.children.length > 0` treats the vault root as a compendium folder), then the SC-441 modal's `trashFile(root)` (`main.ts` ~765). Same for `/` and whitespace probably (not probed). Suggested: reject/ignore an empty (or `/`) destination in the field or in `syncOptions`.
2. **MEDIUM — "Collapsible by default" and "Start collapsed" do not reach blocks that are already open.** Repro (real Obsidian, `probe13-log.txt`; jsdom agrees): open `Stamina/recoveries.md` in Reading view, Settings > Element defaults, switch Collapsible by default off and Start collapsed on: the open stamina bar keeps its Collapse button and stays expanded until it rebuilds / the note is reopened. Cause: `src/framework/pipeline.ts:623-624` reads both prefs only when the chrome is (re)mounted, no `prefs.subscribe`. Violates the ticket's "every change shows live on an already-rendered element". Attribute prefs (reduce motion, fonts, scales, statblock rows) and the rolling pair (subscribed) ARE live.
3. **MEDIUM — "Edit Recoveries with a popover" does not reach an open stamina bar.** Repro (real Obsidian, `probe13-log.txt`): with the pref switched on in Settings, a marker click on the already-open bar still sets the count (no popover) until the bar rebuilds. Cause: `src/elements/stamina-bar/view.ts:186` reads the pref at build; `RecoveriesStrip.ts:258,280` branch on the captured option. (Same shape on the hero view, `src/elements/hero/view.ts:421`.)
4. **LOW (gate on only) — "Show edit button on rendered blocks" does not add the pencil to an open block.** jsdom repro (open stamina bar, set `authoringControls`, no pencil); not run in real Obsidian (needs the gate). Cause: `src/framework/pipeline.ts:595` reads the pref when the chrome mounts; the pipeline's own comment says a pref flip "triggers a rebuild", which holds only for views that subscribe.
5. **LOW — the Sync button drops a rejected promise.** Repro (real Obsidian with the release lookup stubbed to HTTP 404, `probe14-log.txt`): click Sync; besides the "compendium sync failed" Notice the console gets `Uncaught (in promise) Error: GitHub release lookup failed (HTTP 404)`. Cause: `src/views/SettingsTab.ts:634` `void this.plugin.syncCompendium()` while `CompendiumSyncService.sync` rethrows by design (its doc says callers need no try/catch). Matters for phase B: the per-test "no page errors" invariant fails on any failed-Sync scenario, so that drive needs the marker once this has a key.
6. **LOW / owner call (may be intended) — "Fall back to steelcompendium.io links" has no effect on links already drawn.** `src/refs/rewriteSccAnchors.ts:22-45` decides web link vs plain-text span at post-process time (an unresolved link is replaced by a span and never revisited); only the click path (`SccResolver`, `sccLinkClickHandler.ts:62`) reads the setting live. So there is no on-screen re-render to assert for this toggle; the manifest comment says so.

Observations, not bugs: the settings preview shows no effect for the Sticky mini-header row (documented in SettingsPreview.ts, per-block override); text fields write on every keystroke (a half-typed Destination folder is stored); an unknown `prefs` key is dropped on the next save (SC-406 pin); the Locale dropdown has one option so ArrowDown drives nothing (its manifest drive asserts "nothing is written"); real-Obsidian page navigation emits harmless wdio `element not interactable` WARN retries.

## The two open mechanics

(a) **Sync / Check without the network: yes, no stub code needed.** `CompendiumSyncService` takes `requestUrlFn` (default obsidian `requestUrl`) and keeps it as a field; a spec replaces it page-side before opening the tab: `app.plugins.plugins['draw-steel-elements'].syncService.requestUrlFn = (req) => new Promise((resolve) => { window.__calls.push(req.url); window.__release = (status, json) => resolve({ status, json: json ?? {}, text: '', arrayBuffer: new ArrayBuffer(0), headers: {} }); })`. The pending promise holds the busy state open so the label swap and both disabled states are observable on screen, and `window.opener.__release(200, { tag_name: 'v9.9.9', assets: [...] })` finishes it. Verified in real Obsidian (`probe14-log.txt`): idle `Sync/Check for updates` enabled; Check in flight `Sync` disabled + `Checking…` disabled; a click on the disabled Sync does nothing and the only recorded URL is the GitHub API URL (stub, never sent); resolved -> Notice "Update available: v9.9.9 (installed: none)." (in the SETTINGS window's notice container, not the main window's); Sync in flight `Syncing…` + `Check for updates` both disabled; HTTP 404 -> both re-enabled and the failure Notice. With the default empty vault no SC-441 window opens (the legacy modal needs a populated root folder, see bug 1 for the one way it does). The stub lives until the plugin reloads (`dse.setPrefs({})` in `after`). Caveat: a failed Sync trips the no-page-errors invariant (bug 5).

(b) **Gate ON for one scenario only:** `dse.setPrefs({}, { experimental: true })` in a describe's `before` and `dse.setPrefs({})` in its `after` — it writes `{ experimental: true }` as the whole data.json and does the disable/enable plugin reload, and `{}` restores the shipped state. The session's "gate must be OFF" guard only runs once at session start, and the same pattern is already in five specs (`malice-sidebar`, `chrome-focus`, `sidebar-unpin-focus`, `outside-edit-window`, `focus-after-cell-press-textbox`). CENSUS-17 is the live proof for this ticket. Gate-ON scenarios for this ticket would live in their own spec file so the OFF specs never see it.

## Drive-by fixes

None.

## Follow-ups

- The preview stage's own interactive nodes (the chrome Collapse/Expand buttons carry `chrome.*` ids; a collapsible band's header has none) belong to the statblock / featureblock / feature surfaces; the settings census skips the stage. Those tickets inherit it.
- `dse.click` needs a notion of `.is-disabled` for the dependent toggle's `click-disabled` pair (phase B driver change, small).
- Phase B driver needs: a "press on a focused select / range / checkbox label" path via `focusByScript` + `press` (works today), and a Notice reader for the settings window.
- Pair-count trim options listed in the manifest section.

## Gates (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc440-impl-r1/`)

- tsc (`npm run tsc`, includes `tsc -p e2e`): rc 0 — `tsc-r1a.log`.
- lint (`npm run lint`): rc 0 — `lint-r1.log`.
- jest full: `Tests: 2 skipped, 12321 passed, 12323 total; Test Suites: 1 skipped, 282 passed` in 92.9 s, 0 FAIL — `jest-full1.log` (the stderr `findDriftedTokens` stack traces in it come from an existing test that spawns a failing child on purpose).
- jsdom census (`test/dom/e2eCensus.test.ts` + `settings-tab.test.ts`): 59/59 and 126/126 — `jest-census2.log`, `jest-census1.log`.
- real-Obsidian census: `OBSIDIAN-E2E done: 2/2 ok, 0 failed, 0 known-bug, coverage: 0/351 pairs (partial run: gate skipped)` — `e2e-census-r1.log`.
- Probe evidence (scratch specs deleted, logs kept): `probe10-log.txt` (ids + eventful nodes per page), `probe11-log.txt` (real input kinds), `probe12-log.txt` (bug 1), `probe13-log.txt` (bugs 2, 3), `probe14-log.txt` (mechanic a, bug 5), `probe15-log.txt` (fixtures).
- Not run (phase A): lifecycle, e2e full, shots, freeze, parity.

## Phase B

### Executive summary

- **Status: DONE.** Head `4c430c1b` (5 commits on `a5313f9d`; origin/develop did not move, no rebase). Nothing pushed.
- Full battery on `4c430c1b`: tsc clean, lint clean, jest **12324 passed / 2 skipped** fresh (12325 / 1 with the shots cache, baseline 12133 / 1), lifecycle **64/64** (7 parts: 21+16+9+4+7+4+3), e2e run A `487/506 ok, 0 failed, 19 known-bug, coverage: 351/351 pairs`, run B identical, shots 592 ok with host-leak 163/978, modal host-leak 40/240, capture clip 147, freeze **280/280**, parity **0 gaps / 0 undeclared / 24 declared** (run last).
- e2e wall time (full run, shared host at load 7-12): **247 s** (A) and **273 s** (B); each of the 10 new spec files is its own Obsidian session. Reload survival is batched: one reload at the end of each file (toggles, dropdowns, sliders, fields, fonts, gate-on), plus one per font picker after the first because "List installed fonts" fetches once per plugin lifetime and only a reload brings its button back.
- 67 new `SET-*` e2e tests drive all 118 pairs (351 = 233 + 118), plus CENSUS-16/17. Every drive uses real input in the settings popout window, reads data.json from DISK, and reads the effect on the OPEN note in the main window. 6 markers: SC-643 (C03), SC-646 (C04), SC-644 (G06 authoring, L01 collapsible), SC-645 (L02), SC-647 (L03); all 6 reproduce in real Obsidian, none needed a jsdom `test.failing`.
- Owner conditions met: the stamp predicate is wrapped in try/catch and always answers true; two jsdom tests (`getElementForDefinition` absent, and throwing) show every row of every page still renders (jest +2, now 175 in the matrix file) and a third pins that the SCC resolver the click handler asks follows the toggle live.
- Three things to know: (1) the file-picker `press:Enter` pair is driven and pinned as "opens nothing" (Obsidian 1.14.4's combobox ignores Enter; host behaviour); (2) Characteristics and Villain actions use `press:ArrowUp` instead of ArrowDown (their default is the LAST option, so ArrowDown cannot change it; same pair count); (3) a text field updates the plugin's in-memory setting on every keystroke but data.json is written when the user clicks away (not per keystroke).

### Commits added in phase B

- `0ada7229` test(SC-440): e2e specs for the settings tab ... SC-643..647 markers; stamp predicate never throws
- `4c430c1b` test(SC-440): pick the file-picker item by a page-side mark (the list re-renders as it filters)

### e2e specs (`e2e/specs/settings/`, 10 files, 67 tests)

navigation (N01-N02), toggles (T01-T11), dropdowns (D01-D15), fonts (F01-F07), sliders (Z01-Z06), fields (X01-X04), compendium (C01-C04), resets (R01-R08), gate-on (G01-G06), live-behavioural (L01-L04). Ids are literal in titles; the manifest `rows` now cite them. Highlights:
- **Toggles**: click to non-default, Space back, click again, each time stored value (disk), shown state and the live effect on the open note (reduce motion, portraits, sticky pair, rolling controls, click-to-roll); the dependent toggle with its parent off is a `click-disabled` that changes nothing; Start collapsed / Collapsible by default / popover are asserted on a block opened AFTER the change (plain); T11 reloads and checks every shown value + disk.
- **Dropdowns**: ArrowDown/ArrowUp on the focused select, live attribute on the open statblock / featureblock / ability card; Locale's no-op asserts nothing is written; the Preset test first resets the statblock and feature rows (two reset pairs) so it reads Steel card, then ArrowDown writes the nine Sourcebook members.
- **Fonts**: per picker ArrowDown (first curated), End (Custom... reveals the field, writes nothing), typed family + blur, List installed fonts (the real Local Font Access API works under Xvfb: the dropdown grows to ~189 entries, the button disappears on every row); F07 reload.
- **Sliders**: ArrowRight (105%), Home (min), End (max), live inline custom property; final reload.
- **Fields**: typing then blur; the file combobox is picked with a real click on a picker item and cleared with its X.
- **Compendium**: C01 Check in flight (labels, disabled, clicks on disabled buttons start nothing, answer -> Notice), C02 Sync in flight (left unanswered, then reload), C03 (SC-643) and C04 (SC-646) below. The stub is the page-side `requestUrlFn` replacement described in phase A; `releaseStub` in `driver/settingsDrive.ts`.
- **SC-643 (C03)**: types, clears the Destination folder with raw keys, clicks Sync, waits for either a lookup or a window, asserts no window containing "Move old compendium to trash" exists; if one opened it is closed through its own X (or "Keep everything"), NEVER the trash button; `dse.setPrefs({})` restores data.json. Fails with `Expected: false` today (the bug).
- **SC-646 (C04)**: `allowPageErrors(...)` accepts the designed `console.error` and the rejection so the post-test invariants do not double-report; asserts no `rejection:` page error after a 404 Sync.
- **Gate-on file**: `before(dse.setPrefs({}, { experimental: true }))` / `after(dse.setPrefs({}))`; G01 Authoring row sits between Rolling and Compendium and its page holds exactly its toggle and reset row; G02 Print preview (live `data-dse-print`); G03 Show edit button (plain: pencil on a block opened afterwards); G04 reload; G05 Reset authoring keeps Print preview; G06 SC-644 marker (the pencil on an already-open block).
- **Live-behavioural**: L01 SC-644 collapsible, L02 SC-645 popover (marker click on the open bar), L03 SC-647 (new fixture note `Settings/scc-link.md`), L04 plain: a link drawn after the change is a steelcompendium.io link / plain text. Start collapsed has no marker (T05 pins that it applies to a block rendered afterwards, plus persistence and reload).

### Driver changes (shared files, small)

`driver/settings.ts` (+`onMain`, `diskData`, `PluginData`), new `driver/settingsDrive.ts` (`openAt`, `pressOn`, `typeThenBlur`, `mainAttr/Var/Count`, `reloadPlugin`, `releaseStub`, `waitDiskPrefs`, ...), `driver/state.ts` + `driver/invariants.ts` (`allowedErrors`: a test can name page errors it expects), `driver/dse.ts` (`click` treats a control with `is-disabled` as a disabled click, so `click-disabled` can be recorded on the dependent toggle), `e2e/README.md` (fixture row), manifest (two kinds changed to `press:ArrowUp`, `rows` re-annotated).

### Product change (condition 1)

`src/views/settingsDeclarative.ts` `stamping()`: the stamp is in try/catch, the predicate never throws and answers true (a row that already had a predicate keeps its own answer, itself guarded). Jest: `settings-matrix.test.ts` "id stamping is best effort" (absent and throwing `getElementForDefinition`).

### Findings while writing the specs (no action requested)

- Text fields: memory per keystroke, disk on blur (checked in X01). SC-643 mentions per-keystroke writes; the precise behaviour is as stated here.
- Obsidian's file combobox does not open from the keyboard (Enter, Space, ArrowDown all tried): a host limitation; pinned in X03 so a change shows.
- The Default creature image path has no on-screen effect to assert in the tab (it is read when a tracker draws a creature); asserted as data.json and shown value only.
- Bug evidence is re-confirmed by the markers; no new bug surfaced. The no-page-errors invariant still guards every other test.

### Gates (logs in the scratchpad `.../sc440-impl-r1/`)

tsc `gateb-tsc.log` rc 0; lint `gateb-lint.log` rc 0; jest `gateb-jest.log` (`Tests: 2 skipped, 12324 passed`) and `gateb-jest2.log` after shots (`1 skipped, 12325 passed`); lifecycle `life-p1..p7.log` (21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3; all rc 0; G-S91 and G-S115 green first time); e2e `e2e-runA.log`, `e2e-runB.log` (`OBSIDIAN-E2E done: 487/506 ok, 0 failed, 19 known-bug, coverage: 351/351 pairs`, 247 s / 273 s); shots `shots-r1.log` (592 ok, 825 s), freeze `freeze-r1.log` (`freeze OK (280/280 ...)`), parity `parity-r1.log` (`0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`).
Earlier same-branch full e2e run `e2e-full1.log` had 2 failures (a stale-element flake in the file-picker scenario, fixed in `4c430c1b`, and the dependent reload check): not part of the final numbers; the two runs above are on the final head.

## r3

### Executive summary

- **Status: DONE.** dse head `e4e2be2f` on base `8a81c5a7` (current develop, after SC-439; rebased twice: `11fbded6` first, then `8a81c5a7` per the course correction). Superproject `b1c3c8af` on base `c3f9b129` (workspace origin/main, newer than `8dd3c4a4`): ONE commit, only the draw-steel-elements gitlink. Nothing pushed.
- Battery on `e4e2be2f`: tsc 0, lint 0, jest **12744 passed / 1 skipped**, lifecycle **64/64** (21+16+9+4+7+4+3), e2e run A and B both `552/581 ok, 0 failed, 29 known-bug, coverage: 416/416 pairs` (288 s and 296 s), shots 592 with host-leak 163/978, modal host-leak 40/240, clip 147, freeze **280/280**, parity **0 / 0 / 24** (run last).
- Pairs: 416 = 287 (develop) + 118 + 11 new `press:Enter` pairs (Sync, Check, 9 reset rows). 29 known bugs = 22 + the six SC-643..647 markers + SC-651.
- All r2 findings folded (M-1, M-2, L-1..L-9, I-6) plus SC-651. Mutants checked: removing the reset redraw now turns 9 jsdom reset tests and e2e R01/R03/R07/R09/R12 red; deleting the Preset handler for steel turns the jsdom steel case red; removing a `releaseStub.install()` fails loudly with no network.
- Every SET test passes alone: 15 run one by one under `--only` (SET-D13, T04, T09, T11, F03, F07, Z06, X04, G04, G05, D14, D15, R03, C05, X03), all `1/1 ok`.
- Rebase: conflicts only in `_census.e2e.ts`, `e2eCensus.test.ts` and `e2e/README.md` (SC-439 appended at the same tails); resolved additively, census ids still 16 and 17, no duplicate `[SET-*]` or `[CENSUS-*]` ids.
- I-4 (SC-439): I narrowed our `dse.click` change to `settings.*` controls only (see below).

### What changed (dse commits since `8a81c5a7`)

`64d61d55` ids, manifest, censuses · `6df73d89` jsdom matrix + integrity · `44fa4f33` manifest comment · `431d99f4` e2e specs + markers + try/catch stamp · `1c659fcc` picker item mark · `cd561e49` r2 review fixes · `e4e2be2f` greyed-label rule scoped to settings.

- **M-1**: each reset test checks the controls ON SCREEN show the defaults (`settings-matrix.test.ts` reset `test.each` and Reset all, via `shownOf`; e2e `expectOnScreen` after every reset row, plus a page opened after Reset all). The Preset reads `custom` after a section reset while the Feature display members are still off: asserted as such.
- **M-2**: `press:Enter` on Sync (C06), Check (C05), reset rows R09-R15, Reset all R16, Reset authoring G07; no Enter on page links. Manifest and rows updated.
- **L-1**: `openSettings()` replaces the sync service's `requestUrlFn` with a function that throws "e2e: network disabled, install releaseStub" unless `releaseStub.install()` marked the service; reload gives a fresh service, the next `openSettings` re-guards.
- **L-2**: jsdom steel preset case starts from index. **L-3**: `diskData()` treats a file lacking keys the plugin holds as never written (answers after 800 ms with what the disk says); dependent scenarios seed their state (`dse.setPrefs`, new `seedData` for operational fields) so reload-batch tests (T11, D15, F02-F07, Z06, X04, G04, G05) and T04, T09, D14 run alone. **L-4**: C04 allowance is the stubbed 404 only. **L-5**: L03 setup check `{ unresolvedSpans }`, bug check `{ webLinks }`, `failsWith: /webLinks/`. **L-6**: R06 opens a bar after the reset (Collapse button present, not collapsed); R08/R16 seed `compendiumReleaseTag`, `compendiumDestinationDirectory`, `sccWebFallback: false` and assert they survive. **L-7**: X03 picks `Settings/token.svg` (new fixture, offered by the picker), opens the tracker and waits for `img[src*="token.svg"]` on a portrait, clears it and asserts it is gone. **L-8/L-9**: manifest comments and README rows (indented, plus the new svg row). **I-6**: literal CSS and preset expectations in the matrix.
- **SC-651** (`SET-D16`, `knownBug`): shipped state, Preset reads steel, End (raw key, no manifest pair) selects Custom; asserts the shown value equals the value after Back and reopen; fails with `afterPick` today.
- **Flake found and fixed**: Back clicks were swallowed during Obsidian's ~300 ms page slide (both pages are in the container then; N01 had flaked once in review, and more often under load 15 after my first retry attempt). `showPage` and `back` now wait for the container to hold one page (`pageSettled`).

### I-4 (SC-439) — what I did and why

Our `dse.click` treated a control whose class has `is-disabled` as a `click-disabled` drive. SC-439's greyed modifier labels (`negotiation.mod.*.label`, declared with `click` only) carry that class, so a click on one while greyed would have recorded an undeclared pair, which the coverage gate reports as "driven but in no manifest". The NEGO tests did not fail in the unscoped build I never ran, but the hazard was real, so I scoped the rule: it applies only when the control id starts with `settings.` (`e2e/driver/dse.ts`, 3 lines). Nothing in SC-439's manifest changed. After the narrowing both full runs are 0 failed with 416/416 and every NEGO test green.

### Gates (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc440-impl-r1/`)

tsc `r3-gate-tsc.log` rc 0 · lint `r3-gate-lint.log` rc 0 · jest `r3-gate-jest.log` (`1 skipped, 12744 passed`) and after shots `r3-gate-jest2.log` (same) · lifecycle `r3-life-p1..p7.log` (21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3) · e2e `r3-e2e-runA.log`, `r3-e2e-runB.log` (`552/581 ok, 0 failed, 29 known-bug, coverage: 416/416 pairs`, 288 s / 296 s, shared host) · shots `r3-shots.log` (592 ok, 1061 s) · freeze `r3-freeze.log` · parity `r3-parity.log`. Isolation runs `e2e-alone-SET-*.log`; mutant runs `e2e-mut.log`, `jest-mut.log`. An earlier battery started on the `11fbded6` base was killed (by literal PID) when the base moved; its partial logs were overwritten by the final run.

## r5

### Executive summary

- **Status: DONE.** dse head `2207c45b` on base `7b9e82cf` (develop after SC-643; rebased three times in this round as the base moved: `76520b1f`, then `7b9e82cf`, no SettingsTab conflict). Superproject on origin/main `c588bbaa` (newer than `120cf676`; it moved from `66b04168` while the round ran, so the one commit was re-made on it): ONE gitlink-only commit, amended; nothing pushed.
- Battery on `2207c45b`: tsc 0, lint 0, jest **12875 passed / 1 skipped** (shots cache present), lifecycle **64/64** (21+16+9+4+7+4+3), e2e run A `560/586 ok, 0 failed, 26 known-bug, coverage: 416/416 pairs` (455 s, a concurrent jest running), run B identical (404 s). Shots, freeze, parity carried over (ledger ruling).
- **R4-M1 (SET-X03)**: the picker is now driven by keyboard (type `token`, the list filters to `Settings/token.svg`, Enter): no element handle crosses a redraw. Tallies on the final head under concurrent jest: `--only=SET-X03` **5/5 ok**, `--element=settings` **3/3** (74/80 ok, 0 failed, 6 known-bug each). One other X03 failure appeared once in 16 runs (the click on the combobox did not open the picker); a bounded repeat of that click (twice at most, a picker that never opens still fails) was added and the 8 final-head runs are clean.
- **R4-L1**: the six reload tests (T11, D15, F07, Z06, X04, G04) now reload the file the drives wrote: `ensureState` checks disk and reloads on it, and seeds (as a `settingsVersion: 3` file) only when the disk lacks the expected state (a single `--only` run). T04 and T09 use `withPrefs` (patch the disk's prefs, keep the rest) instead of wiping with `setPrefs({})`, so the chain keeps the earlier values. All six also pass alone.
- **SC-643 follow-up**: `[SET-C03]` is now a plain test (Destination emptied: Sync falls back to the default folder, the stubbed lookup is asked, no trash window; the stored setting stays `''`); new `[SET-C07]` (`/`: refusal Notice naming the Destination folder, no lookup, no window, busy released). `syncOptions()?.releaseTag` (TS2531) fixed; a jsdom test drives the field with `''`, `'   '`, `'/'`, `'.'`, `' / '`, `'..'`. No other test pinned the old behaviour. Known bugs: 20 + 6 = 26 (SC-643 no longer a marker; SC-651 included).
- Numbers vs expectation: e2e is 586 total (one more than `559/585` because of C07), 416 pairs unchanged.

### Commits (dse, since `7b9e82cf`; the whole branch is 11 commits)

`18da91cb` ids, manifest, censuses · `dbeb60d7` jsdom matrix + integrity · `aab0adbb` manifest comment · `4ae9567f` e2e specs + markers · `9d7d3d62` picker mark · `bd175797` r2 fixes · `84fed964` greyed-label rule scoped · `3a3510bc` X03 keyboard + reload seeds · `f0abb055` SC-643 follow-up · `2207c45b` X03 click repeat.

### Gates (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc440-impl-r1/`)

`r5-gate-tsc.log` rc 0 · `r5-gate-lint.log` rc 0 · `r5-gate-jest.log` (`1 skipped, 12875 passed`) · `r5-life-p1..p7.log` (21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3, filter `--only=` with the equals sign) · `r5-e2e-runA.log`, `r5-e2e-runB.log` · X03 repeats `e2e-r5fx03-1..5.log` and `e2e-r5z-x03-1..5.log`; settings repeats `e2e-r5fset-1..3.log` (before the click repeat, one X03 failure) and `e2e-r5z-set-1..3.log` (final head) · concurrent-load jest `r5-concurrent-jest.log`, `r5-final-loadjest-1..3.log`. Two batteries started on older bases were killed by literal PID when the base moved (their partial logs were overwritten); a stray Xvfb left by the earlier kill was also stopped by PID.

## r7

### Executive summary

- **Status: DONE.** dse head `941b814f` on base `7b9e82cf` (develop unchanged). Superproject `e8cfac1e` on origin/main `c588bbaa` (unchanged): one gitlink-only commit, amended; nothing pushed.
- **R6-L1**: `ensureState` (`e2e/driver/settingsDrive.ts`) seeds only in a filtered run. The runner sets `DSE_E2E_GREP` for `--only` (`e2e/run.mjs:532`, read in `wdio.conf.mts:48`; confirmed). In a full run or `--element`, a disk that differs from what the reload test expects now throws "the scenarios before this reload test left data.json differing from what it expects (prefs: on disk …, expected …)".
- **Mutant** (Card size write dropped in `setControlValue`, run in place and reverted with `git checkout`): `--element=settings` gave `72/80 ok, 2 failed`: SET-Z02 (`Expected: 1.05, Received: 1`) and now **SET-Z06 red** with the disk-vs-expected message. Before the fix Z06 passed on a seed.
- The six reload tests (T11, D15, F07, Z06, X04, G04) each pass alone under `--only` (`1/1 ok`, six separate runs).
- **R6-L2**: the stale "picked with a real click" header comment in `fields.e2e.ts` now says the file is picked with the keyboard.
- Gates: tsc 0, lint 0, full e2e twice `560/586 ok, 0 failed, 26 known-bug, coverage: 416/416 pairs` (323 s and 334 s). Jest, lifecycle, shots, freeze, parity carry over (the change touches the e2e driver and a comment only; src is identical to r5 after the mutant was reverted).

Evidence (scratchpad `.../sc440-impl-r1/`): `e2e-r7mut.log` (mutant), `e2e-r7alone-SET-{T11,D15,F07,Z06,X04,G04}.log`, `r5-e2e-r7A.log`, `r5-e2e-r7B.log`.
