# SC-406 round 1 — independent review (dse `sc406-gating` @ 3fddf49, base f8693b5)

**Executive summary**
- **Verdict: FIX-REQUIRED.** Gate is sound. Every surface in Scott's ruling holds in both states. All 11 gate mutations turned the tests red. Real Obsidian base-vs-head(ON) is identical except the removed alias. The fixes needed are about data being lost when the switch goes on→off→on. Nothing in the rendering or the gating needs a fix.
- Counts: CRITICAL 0 · HIGH 0 · **MEDIUM 3** · **LOW 1** · INFO 7.
- MEDIUM-1 (new): an off-state write strips a per-block `prefs: printPreview` line from the user's NOTE.
- MEDIUM-2 (owner's fold item 2, confirmed in real Obsidian): any prefs save while off drops stored `printPreview`/`authoringControls` from `data.json`.
- MEDIUM-3 (new): the camera's seeding leaves `"experimental": true` in the repo-root `data.json`. In the main checkout that file is the demo vault's live plugin data.
- LOW-1 (owner's fold item 1, confirmed): the fix the ledger prescribes (`isDefinitionHidden`) would change ds-hero autocomplete with the switch ON. Gate it on `deferred` instead.
- Gates measured: tsc clean · lint clean · jest **4412 passed / 1 skipped / 217 of 218** · lifecycle **25/25** · shots **568, 0 FAIL** (all in-run gates OK) · freeze **`freeze OK (274/274 …)`** · parity **0 GAPs / 0 undeclared / 24 DECLARED** (exit 0).
- docs-shots ran headless, rc=0, 40 images. Camera seeding works.

## What was executed
- **Full battery** in the worktree. Logs: `review-r1-scratch/logs/r1-{tsc,lint,jest,lifecycle,shots,freeze,parity}.log`.
- **Mutation testing** in a throwaway worktree, with each mutation applied, run and reverted on its own. All 11 went red, with failing tests named in `logs/mut-*.log`:
  - M1: pipeline card early-return disabled → 10 red
  - M2: `isDefinitionHidden` ignores `deferred` → 3
  - M3: sidebar `if (true)` → 1
  - M4: Pin ungated → 1
  - M5: Unpin ungated → 1
  - M6: `/ds` only → 1
  - M7: Insert only → 2
  - M8: catalog always full → 3
  - M9: `setExperimental` call removed from onload → 6
  - M10: truthy parse → 2
  - M11: main.ts describes the full catalog → 2
  - Verdict: the off-state tests are real.
- **Jest probes P1–P5** (scratch test, deleted). Log: `logs/probe-a.log`.
- **Real Obsidian 1.14.4 probes** (own Xvfb, ports 9298–9301, scratch vaults). Results in `review-r1-scratch/obsidian-probe/`.
  - **Phase A** (`experimental: "true"` string, so OFF): every surface is gone. No sidebar commands, ribbon icon or `dse-sidebar` view type. No `printPreview`/`authoringControls` descriptors. 0 edit pencils. Initiative chrome = `reset-turns|reset-encounter|collapse` (no pin).
  - All 9 deferred blocks render the card, including the alias forms `ds-cond` and `ds-power-roll`. Note bytes are unchanged after the render and after a pointerdown/mousedown/mouseup/click/dblclick on every card.
  - The console warning fires for the per-block `printPreview`. `saveSettings` keeps `"experimental": "true"` as is.
  - **Phases B/C/D** (plugin disable/enable on→off→on): the switch is re-read on every load. The deferred note is unchanged while off. The ON-minted `_computed` survives off→on.
  - **Base (f8693b5) vs head with `{experimental:true}`**, single load: commands, ribbon, view type, pref keys, rendered roots, chrome items, note bytes after render and console are all **identical**. The only difference is `download-data-md-dse`, which is absent as ruled. Data: `compare-base.json` / `compare-head-on.json`. The head-off run matches phase A.
- **Read-once ordering**: every `isExperimental()` / `isDefinitionHidden` / `activePrefDescriptors` read is at call time. Each one happens after `setExperimental` (main.ts:404). That covers:
  - `addSettingTab`
  - `initializeElementFrameworkV2`'s describe at main.ts:212
  - processors
  - `registerInsertCommands`
  - the sidebar block at :503
  - pipeline render-time checks

  Nothing reads the flag at import time. `DSE_PREF_DESCRIPTORS` is the full list, and only the function filters it.
- **NOT-gated items**:
  - `ds-scc`'s `baseForSccType` maps only to statblock, feature, featureblock and the display family. None of those is deferred, so ds-scc never renders a deferred type directly. A deferred fence inside a compendium note goes through the normal pipeline and gets the card.
  - montage, counter and initiative render and keep their own chrome while off (real Obsidian).
  - The Rolling, Typography and Appearance pages are intact (settings-tab test).
  - `watchPrintMedia` (the `@media print` path) is independent of the `printPreview` descriptor.
  - The Conditions modal is covered by the initiative test with the switch off.
- **Evidence screenshots** (`evidence-r1/…switch-off--obsidian-{dark,light}.png`): the card reads as deliberate and inert, with muted text on `--background-secondary`. It is legible in both themes (roughly 5–6:1) and has no accent and no controls. OK.

## Findings

### MEDIUM-1 — an off-state write deletes a per-block `printPreview` override from the note
- **Where**:
  - `src/framework/prefOverrides.ts` `extractPrefOverrides` drops unknown keys. With the switch off, `printPreview` is unknown.
  - `withPrefOverrides` re-emits only the validated bag.
  - `src/framework/pipeline.ts:616` wires that wrapper.
- **Scenario** (reproduced in jest P2 and in real Obsidian phase C): a vault from the 7.0.0 betas has this block:
  ```
  ```ds-counter
  prefs:
    printPreview: "on"
    reduceMotion: true
  …
  ```
  - The user upgrades to the release (switch off) and clicks +.
  - The block is rewritten with `prefs:\n  reduceMotion: true` only, and the `printPreview` line is gone from the file.
  - If `printPreview` was the only key, the whole `prefs:` map is removed.
  - Turning `experimental` on later cannot bring it back. This breaks the brief's "toggling on→off→on loses no data in blocks". It also writes to user note bytes, which is worse than the `data.json` case.
- **Fix**:
  - While `!isExperimental()`, have `extractPrefOverrides` route keys in `EXPERIMENTAL_PREF_KEYS` into a separate pass-through bag. Keep the existing warning, but do not apply them.
  - Have `withPrefOverrides` re-emit `{...applied, ...passthrough}`, ideally in the author's original key order.
  - Do not widen this to all unknown keys. Typo keys are dropped on write today, and the ON state must stay as it is today.
  - Test: an off-state `ds-counter` write keeps `printPreview: "on"` in the note. An on-state write is byte-identical to develop.

### MEDIUM-2 — a prefs save while off drops stored gated prefs from `data.json` (owner's FOLD item 2, confirmed and sized)
- **Where**: `src/framework/seams/prefs.ts:192-201`. `persist()` builds the snapshot from `descriptorMap` only and then overwrites `persistedSnapshot`.
- **Measured**:
  - Jest P3: `{printPreview:'on', authoringControls:true, textScale:1.2}` becomes `{reduceMotion:true, textScale:1.2}` after a single `prefs.set`.
  - Real Obsidian phase A: `prefs: {}` after `set('reduceMotion', false)`.
  - Phase C shows that a block write alone does not drop them; only a prefs save does.
- **Fix**: in `persist()`, carry forward undescribed keys from the previous snapshot:
  ```ts
  for (const [k, v] of Object.entries(this.persistedSnapshot)) if (!this.descriptorMap.has(k)) snapshot[k] = v;
  ```
  - That generic form also changes ON behaviour for retired or stale keys, which today are dropped on save. To keep ON exactly as today, scope it instead:
    - add a store option or method, e.g. `prefs.retainUndescribed(EXPERIMENTAL_PREF_KEYS)`, called from `initializeElementFrameworkV2` only when the switch is off;
    - this keeps `seams/` free of any catalog import.
  - Decide what "Reset all preferences" does to retained keys while off. The recommendation is to leave them alone, because they are invisible.
  - Test: off, then `set` an unrelated pref → the saved `prefs` still holds `printPreview`/`authoringControls`. On → unchanged.
  - Size: about 10 lines plus 2 tests.

### MEDIUM-3 — camera seeding permanently switches the demo vault to ON
- **Where**: `visual-harness/obsidian-camera.mjs:556-569` (`seedUdd`). It writes `{...saved, experimental:true}` to `<repo>/data.json` and never restores it.
- **Scenario**:
  - In the main checkout, `draw-steel-elements/data.json` exists (309 bytes). `demo-vault/.obsidian/plugins/draw-steel-elements → ../../..`, so that file is the live plugin data of the demo vault Scott reviews in.
  - After any `npm run obsidian-shots` or `docs-shots` from that checkout, his demo vault silently runs with the switch ON: sidebar, deferred elements, Authoring page and so on.
  - The SC-333 / audit §2a release walkthrough done there would then exercise features that do not ship and would never show the placeholder cards.
  - Reproduced in the throwaway worktree: after `docs-shots`, `data.json` holds `"experimental": true`.
- **Secondary (LOW-grade, same lines)**: an existing but unparseable `data.json` falls to `saved = {}` and is overwritten, losing the user's settings.
- **Fix**:
  - Read the raw bytes, or record that the file is absent.
  - Write the seeded copy.
  - Restore the original bytes, or delete the file if it was absent, in the camera's teardown path. That means the same `finally`/signal handler that kills Obsidian.
  - If the file exists but does not parse, abort with a message rather than overwrite.
  - The cleaner alternative is a scratch plugin dir for the camera, as the lifecycle gate does.

### LOW-1 — `schemaSuggest` autocompletes inside deferred fences (owner's FOLD item 1, confirmed). The prescribed guard has an ON-state side effect
- **Where**: `src/authoring/schemaSuggest.ts:73-74` (`const def = this.registry.get(state.lang); if (!def?.schema) return null;`).
- **Measured (P1)**, keys offered with the switch off:

  | Fence | Keys offered |
  |---|---|
  | ds-surges | 2 |
  | ds-tokens | 2 |
  | ds-roll | 14 |
  | ds-resource | 5 |
  | ds-conditions | 1 |
  | ds-hero | 17 |

  Encounter, project and party have no schema, so no keys.
- **Caveat on the ledger's prescribed fix**: "gate it on `isDefinitionHidden`" would also kill ds-hero autocomplete with the switch **ON**. ds-hero is `hidden: true` (SC-190) and has a schema, and P1 measured 17 keys ON today. That would violate "when on: exactly as today".
- **Fix**:
  ```ts
  if (!def?.schema || (def.deferred === true && !isExperimental())) return null;
  ```
  - Alternatively, add a `isDefinitionDeferredOff(def)` helper to registry.ts next to `isDefinitionHidden`.
  - Tests: off → `onTrigger` returns null in a `ds-surges` fence. On → keys are offered. ON ds-hero still gets 17 keys.

### INFO
1. **docs-shots (addendum)**:
   - Run headless in a throwaway worktree (own Xvfb `:171`, CDP 9301, private camera tmp), rc=0: 22 browser + 18 obsidian images, 40 total.
   - Seeding is effective: `sidebar.png` shows the sidebar hosting a `ds-surges` panel, which is a deferred element, and `data.json` was seeded.
   - All 36 regenerable images differ from the committed `docs/Media`. Base was not run, so the drift cannot be attributed to this branch.
   - Copies: `obsidian-probe/docs-shots-{sidebar,settings-index}.png`.
2. **Docs images will show hidden surfaces.** Because docs-shots runs with the switch ON, regenerated images show:
   - the Authoring page (`settings-index.png`);
   - the sidebar;
   - the nine deferred elements (`encounter.png`, `party.png`, `roll.png`, `surges.png`, …);
   - `tutorial-print-preview.png`.

   Route to SC-407 along with the prose. Not an SC-406 code change.
3. **Toggle-probe console warning**: `"dropped a write to Deferred.md — the block was not found by its last known body"` appeared once, during an ON-state plugin disable/enable with a note of deferred blocks open. ON-state `ds-encounter` mints `_computed` on render.
   - It did not appear in the single-load base or head-ON runs, which are identical.
   - It is not attributable to the gate. No action.
4. **Card copy** reads `ds-<canonical> is not available in this release.` and shows the canonical alias even for `ds-cond` or `ds-power-roll`. Fine. It is optional to prefix it with "Draw Steel Elements:" so a user knows which plugin is speaking. Owner/Scott taste, not a defect.
5. **Settings save round-trip verified**: `experimental` values `false`, `"true"` and `1` are all saved back as they were and all read as off. An absent key is never invented.
6. **Superproject main checkout is dirty, not caused by this review.** `workspace/draw-steel-elements` has `M demo-vault/Welcome.md`, `M justfile`, `?? compendium-manifest.json`, `?? demo-vault/montage 1.md`, all with mtime 2026-10-16 19:37:16 (before this review started). `just deploy*` will hard-abort on it, so the owner should check before landing.
7. **Already ruled DROP, not re-raised**: the stale sidebar leaf stock tab (no worse variant found) and docs prose (SC-407).

## Tree state
- Worktree `draw-steel-elements`: HEAD 3fddf49, `git status --porcelain` empty before and after. The `--ignored` listing is identical before and after (`status-{before,after}-ignored.txt`).
- The throwaway worktree was removed and pruned. No Xvfb or Obsidian processes are left from this review.
