# F3 — DSE Health Audit & Test-Harness Spec

**Program:** DSE Overhaul (Wave 1) · **Author:** Fable deep analysis · **Date:** 2026-07-01
**Scope:** `draw-steel-elements/` @ `b80a8a9` (v5.1.1). Planning only — no code changed.
**Method:** full deep-read of the 7 largest/riskiest files + entry/registration/config; broad
grep sweep of all 61 TS / 16 Vue files for Obsidian risk patterns; audited against
`eslint-plugin-obsidianmd` v0.3.0 rules and the community Scorecard via the
`obsidian-plugin-development` skill.

All paths below are relative to `draw-steel-elements/` unless absolute.

---

## 1. Executive summary

**Overall health: functional but structurally fragile — "works on the happy path."**
The plugin has a clean security posture (zero `innerHTML`, zero `fetch`, no Node imports, no
regex lookbehind — genuinely better than most community plugins) and a consistent
processor-per-element shape. But it has **zero tests, no CI for the plugin itself, a
type-check that is suspected to be failing (releases skip it), several confirmed
user-visible correctness bugs, and a systemic memory-leak pattern** in its markdown
rendering. Interactive elements persist state by rewriting the user's file on **every
click** with a non-atomic read-modify-write — the single biggest data-integrity risk.

**Top 5 risks:**

1. **Non-atomic file rewrites on every interaction** — `CodeBlocks.updateMarkdownCodeBlock`
   does `vault.read` → splice → `vault.modify` (`src/utils/CodeBlocks.ts:86-107`). Rapid
   clicks or concurrent edits can interleave and lose user data. Should be `Vault.process()`.
2. **Confirmed minion-pool math bug** — operator-precedence error clamps the squad stamina
   pool to the *count of alive minions* instead of the pool max on every apply
   (`src/views/MinionStaminaPoolModal.ts:226`). Silently corrupts encounter data.
3. **Confirmed block-destroying write** — removing a condition inside the minion modal
   rewrites the code fence with an **empty language** (`updateCodeBlock(…, "")`,
   `src/views/MinionStaminaPoolModal.ts:447`), turning the initiative tracker into a plain
   code block.
4. **Systemic render leak** — `MarkdownRenderer.render(…, this.plugin as Component)` at 5
   sites registers every rendered fragment on the plugin's lifecycle; children accumulate
   until plugin unload (obsidianmd rule 7). Vue apps are likewise mounted and never
   unmounted (`src/utils/ComponentProcessor.ts:41-63`).
5. **No safety net** — no tests, no plugin CI (the only workflow deploys mkdocs), lint not
   installable (`eslint` absent from devDependencies), and the release recipe uses
   `build-no-check` — i.e. releases ship without type-checking, linting, or tests.

Health inputs for context: last code commit 2026-01-30 (~5 months), docs commits 2026-04-06.
`versions.json` (an Obsidian release requirement) is missing from the repo.

---

## 2. Findings backlog

Severity: **crit / high / med / low**. Effort: **S** (<½ day) / **M** (½–2 days) / **L** (>2 days).
**Owner** = where the *fix* is planned: `F3` (this backlog / quick win), `F1` (framework v2),
`F2` (SDK/data), `D1` (Vue removal). Items owned elsewhere are listed for completeness but
not planned here. "suspected — verify" items need a repro/type-check run before fixing.

### 2.1 Correctness bugs

| ID | Sev | Eff | Owner | file:line | Description | Recommended fix |
|----|-----|-----|-------|-----------|-------------|-----------------|
| CB-1 | **crit** | S | F3 | `src/views/MinionStaminaPoolModal.ts:226` | `this.creature.instances?.filter(i => !i.isDead).length ?? 0 * minionMaxStamina` parses as `len ?? (0 * max)` → `maxStamina` = alive-minion **count**. Applying any change clamps the pool via `Math.min(count, newStamina)` — e.g. 5 minions × 4 stamina, deal 3 dmg: pool 17 saved as **5**. | Parenthesize: `(len ?? 0) * minionMaxStamina`. Add regression test (T-4). |
| CB-2 | **high** | S | F3 | `src/views/MinionStaminaPoolModal.ts:447` | Condition-removal inside the minion modal calls `CodeBlocks.updateCodeBlock(this.app, data, ctx, "")` — rewrites the fence as ```` ``` ```` with no language, killing the element until the user hand-repairs the block. | Pass the correct language (`"ds-initiative"`); better: derive language from the original fence (see CB-5). |
| CB-3 | **high** | M | F3 (F1 absorbs later) | `src/utils/CodeBlocks.ts:86-107` | `vault.read` + `lines.splice` + `vault.modify` — non-atomic read-modify-write fired on *every* click of initiative/negotiation/counter/stamina elements. Two in-flight updates (double-click, slow disk, sync conflict) lose data; also violates obsidianmd rule 19 (use `Vault.process`). | Replace with `vault.process(file, cb)`; serialize per-file updates (simple promise queue). F1's persistence seam later formalizes this. |
| CB-4 | **high** | S | F3 | `src/drawSteelAdmonition/negotiation/NegotiationTrackerProcessor.ts:13-14,24-25,59-72` | Processor is a **singleton** (one instance registered for all blocks) but stores `this.data`/`this.ctx` as instance fields. The settings-menu "Reset Negotiation" closure reads them at click time → with 2+ trackers rendered, resetting tracker A resets/writes **the last-rendered tracker's** data/file. | Make `data`/`ctx` locals passed through `buildUI`/`addActions` (the sub-views already take them as ctor args — only the menu closure leaks). |
| CB-5 | med | S | F3 | `src/utils/CodeBlocks.ts:8-28` | Every save rewrites the fence language to the canonical form (`ds-it` → `ds-initiative`, `ds-stam` → `ds-stamina`, `ds-ct` → `ds-counter`, `ds-nt` → `ds-negotiation-tracker`) — silent user-visible churn; acknowledged in the `TODO` at line 28. | Extract the original fence language from `ctx.getSectionInfo()` text and preserve it. (Open Decision #2.) |
| CB-6 | med | S | F3 | `src/drawSteelAdmonition/initiativeProcessor.ts:405-410` | Grid-cell stamina refresh uses `container.parentElement?.querySelector('.creature-instance-cell:nth-child(${instance.id})')` — `instance.id` is per-creature and 1-based, but cells span all creatures of a group; in the dblclick path `container` is the group row whose parent holds **all groups**. Updates the wrong (or another group's) cell in multi-creature/multi-group encounters. | Tag cells with `data-instance-key` (`creatureIndex-id`) and query by attribute scoped to the group's grid. |
| CB-7 | med | S | F3 | `src/drawSteelAdmonition/initiativeProcessor.ts:116-130` | Malice +/- handlers call `maliceContainer.setText(...)`, which replaces the container's children — destroying the chevron buttons and the `malice-text` div. Currently masked because the file write re-renders the whole block; if the write fails (canvas path, missing section info) the controls vanish. | Update only the `malice-text` child element. |
| CB-8 | med | S | F3 | `src/views/MinionStaminaPoolModal.ts:222-242,346` · `src/views/StaminaEditModal.ts:251-262,344` | "Disabled" action buttons only get a CSS class (`.action-button.disabled { pointer-events:none }`, `styles-source.css:1139-1141`); click handlers have **no guard**, and keyboard Enter on a focused button bypasses `pointer-events`. A user can apply damage without selecting the required minions to kill. | Set the real `disabled` property (they are `<button>`s) and/or guard in the handler. |
| CB-9 | med | S | F3 | `src/utils/CompendiumDownloader.ts:81-91` | Existing compendium directory is **permanently deleted** (`vault.delete(dir, true)`) *before* the downloaded zip is parsed. A corrupt/truncated download destroys the user's compendium with nothing to replace it. | Reorder: `JSZip.loadAsync` first, delete only after the zip opens; see also SC-9 (trash instead of delete). |
| CB-10 | low | S | F3 | `src/drawSteelAdmonition/Counter/CounterView.ts:126-173` | suspected — verify: Enter triggers `finishEditing`, then the input's removal fires `blur` → `finishEditing` runs twice (two file writes, double `replaceWith`). Also Escape "cancel" still calls `finishEditing` and **writes the file**. | Guard with a `finished` flag; make Escape restore without persisting. |
| CB-11 | low | S | F3 | `src/model/Counter.ts:21` · `src/model/KeyValuePairs.ts:18-19` · `src/model/StaminaBar.ts:26-27` · `src/model/NegotiationData.ts:22-23,162` | Empty/whitespace code block → `parseYaml` returns `null` → `data.values` / `data.name` etc. throw raw `TypeError: Cannot read properties of null…` shown to the user. Missing null-guard on parse across all hand-rolled models. | Shared `parseYamlObject(source)` helper that throws a friendly "block is empty / not a YAML object" error. |
| CB-12 | low | S | F3 | `src/drawSteelAdmonition/initiativeProcessor.ts:503` | Condition removal filters by entry identity — for duplicate *string* conditions it removes all copies at once. | Remove by index. |
| CB-13 | low | S | **F2** | `src/drawSteelAdmonition/EncounterData.ts:116,216` | `+resolved.stamina` on a statblock reference — if the SDK statblock's stamina is a non-numeric string (e.g. "15 per echelon"), `NaN` passes the later `typeof === "number"` check (`typeof NaN === 'number'`) and renders as `NaN`. SDK-coupling risk; worsens/changes with SDK 3.1.0. | F2: parse defensively (`Number.parseInt` + `Number.isFinite` guard) when re-mapping to SDK 3.x. |
| CB-14 | low | S | F3 | `src/drawSteelAdmonition/initiativeProcessor.ts:167-170,293-296,350-353` (+ `src/utils/Images.ts:31-34`) | `Images.resolveImageSourceOrDefault(...).then(...)` with no `.catch` — if both image and `defaultImagePath` fail to resolve, unhandled promise rejection per row per render (also a Scorecard floating-promise warning). | Add `.catch` rendering a placeholder; type the param `string \| null` honestly (currently `string`, callers pass `?? null` — see TS-1). |
| CB-15 | low | S | F3 | `src/model/StaminaBar.ts:38` | Standalone `ds-stamina-bar` with `current_stamina` omitted defaults to **0** (dying-empty bar) instead of `max_stamina` — inconsistent with the initiative tracker's default-to-max behavior (`EncounterData.ts:158`). suspected — verify intent against docs. | Default to `max_stamina` (or document 0 as intentional). |
| CB-16 | low | S | F3 | `src/drawSteelAdmonition/negotiation/NegotiationTrackerProcessor.ts:53-55` | `title` computed then unused; unnamed negotiations render the header "Negotiation: " with dangling colon. | Use the computed `title`. |
| CB-17 | low | S | **D1** | `src/drawSteelComponents/StaminaBar/StaminaBar.vue:44` | `{{model?.temp_stamina??0 > 0 ? … : ''}}` parses as `temp ?? (0>0)` — works by accident for 0/undefined; negative temp renders "+ -N". Dies with D1 anyway. | Fold into the D1 DOM rewrite. |
| CB-18 | low | S | F3 | `src/model/KeyValuePairs.ts:40` | Error message says "Expected **effects** to be an array" for the `values` field (copy-paste). | Fix string. |
| CB-19 | med | M | **F1** | `src/drawSteelAdmonition/initiativeProcessor.ts:41-47` (same block in `FeatureProcessor.ts:17-24`, `StatblockProcessor.ts:22-28`, `NegotiationTrackerProcessor.ts:27-34`) | Capture-phase `preventDefault()` on `mousedown`/`pointerdown` over the whole element (the v5.1.1 "don't open edit mode" fix) also suppresses focus, text selection, and any future inner `<input>` (modals are unaffected only because they're outside the container). Duplicated 4×. | F1: single shared interaction-guard that only stops propagation for unhandled events (or intercepts the specific dblclick-to-edit pathway), defined once in the framework. |

### 2.2 Memory / lifecycle leaks

| ID | Sev | Eff | Owner | file:line | Description | Recommended fix |
|----|-----|-----|-------|-----------|-------------|-----------------|
| ML-1 | **high** | S | F3 | `src/drawSteelAdmonition/Features/FeatureView.ts:90,92` · `Features/EffectView.ts:70` · `featureblock/FeatureblockView.ts:44` (also dead-code site `StaminaBar/StaminaBarView.ts:44`) | `MarkdownRenderer.render(app, md, el, path, this.plugin as Component)` — obsidianmd rule 7 violation. Every rendered feature/effect/flavor fragment registers a child on the **plugin** Component; children (embeds, internal-link resolvers) accumulate for the whole session on every re-render of every note. This is the classic Obsidian community-plugin leak. | One shared `renderMarkdown(el, md, ctx)` util that creates a `MarkdownRenderChild(el)` and `ctx.addChild()`s it. Small, isolated, safe — quick win. F1 then owns the util. |
| ML-2 | **high** | S→0 | **D1** | `src/utils/ComponentProcessor.ts:41-63` | Vue apps are `createApp(...).mount(wrapper)` with the instance stashed on `(wrapper as any)._vueApp` "for cleanup if needed" — but nothing ever unmounts them and no `MarkdownRenderChild` is registered. Reactive effect scopes are never disposed on block re-render. (Contrast: `src/utils/ModalProcessor.ts:46-49` unmounts correctly.) | Owned by D1 (Vue removal deletes the whole path). If D1 slips a release: 3-line interim fix — `ctx.addChild(new MarkdownRenderChild(wrapper))` with `onunload → app.unmount()`. |
| ML-3 | low | — | **F1** | 96 sites (grep `addEventListener` in `src/`), 0 uses of `registerDomEvent` | All listeners are on elements owned by the rendered block, so they're GC'd with the DOM — not true leaks. But the pattern is unenforced and one future `document`/`window` listener would leak silently. | F1: framework standardizes on component-scoped listener registration; lint rule enforces it. |
| ML-4 | low | S | F3 | all `MarkdownRenderer.render` call sites (see ML-1) | `render()` returns a Promise; never awaited — floating-promise Scorecard warnings; error swallowing. | `void`-annotate or await inside the ML-1 util. |

### 2.3 Security / DOM

| ID | Sev | Eff | Owner | file:line | Description | Recommended fix |
|----|-----|-----|-------|-----------|-------------|-----------------|
| SD-1 | — | — | — | (whole repo) | **Positive finding:** zero `innerHTML`/`outerHTML`/`insertAdjacentHTML`/`createContextualFragment`, zero `fetch()` (uses `request`/`requestUrl`), no `eval`. DOM built exclusively via Obsidian `createEl` helpers. | Preserve this invariant in F1 (assert via lint). |
| SD-2 | low | S | F3 | `src/drawSteelAdmonition/initiativeProcessor.ts:495` · `src/views/MinionStaminaPoolModal.ts:436` · `src/views/CustomizeConditionModal.ts:80` | User-supplied condition `color` assigned raw to `style.color`. Property assignment (not HTML parsing) so injection risk is negligible, but it's unvalidated input styling the UI. | Validate against `CSS.supports('color', v)` or a fixed palette. |
| SD-3 | med | M | F3 | `src/utils/CodeBlocks.ts:46-81` | Canvas save path uses private, untyped internals: `(canvasView as any).canvas`, `canvas.selection`, `node.setData`, `canvas.view.requestSave()` — and only works if the card is *currently selected*; otherwise changes are **silently dropped** (console.log only). Fragile across Obsidian updates. | Decide: harden (match node by text across `canvas.nodes`, surface a `Notice` on failure) or drop canvas persistence and render read-only there. (Open Decision #3.) |

### 2.4 Mobile / popout

| ID | Sev | Eff | Owner | file:line | Description | Recommended fix |
|----|-----|-----|-------|-----------|-------------|-----------------|
| MP-1 | med | M | F3/**F1** | e.g. `initiativeProcessor.ts:148-159` (turn indicator), `:114-119` (malice chevrons), `:488-513` (condition icons); `MinionStaminaPoolModal.ts:67,101`; `StaminaEditModal.ts:109,138,153,185` | Interactive controls are `<div>`s with click handlers: no keyboard access, no `aria-label` (only `title`/`el.title`), and icon targets well under 44×44 px. `isDesktopOnly: false`, so this is a real mobile/a11y gap and a Scorecard warning source. | Convert to `<button>` with `aria-label` + `data-tooltip-position`; add `:focus-visible` styles. F1 should provide an `iconButton()` primitive so new elements get this for free. |
| MP-2 | low | S | F3 | `src/utils/CompendiumDownloader.ts:144` | Bare `setTimeout` (rule 30 prefers `activeWindow.setTimeout`). One-shot awaited yield — harmless, but a scanner warning. | `sleep(0)` via `activeWindow` or `Promise.resolve()` batching. |
| MP-3 | — | — | — | (whole repo) | **Positive finding:** no Node/Electron imports in `src/`, no regex lookbehind (iOS-safe), jszip is browser-safe. No popout `document`/`window` global usage found in TS (rendering is container-relative). | — |

### 2.5 Type-safety

| ID | Sev | Eff | Owner | file:line | Description | Recommended fix |
|----|-----|-----|-------|-----------|-------------|-----------------|
| TS-1 | **high** | M | F3 | `src/utils/CodeBlocks.ts:83-90` (`ctx.el` + the TODO admitting tsc complains) · `initiativeProcessor.ts:165-167` vs `src/utils/Images.ts:31` (passing `string \| null` into `string`) · `StatblockProcessor.ts:51` (`features?.length > 0` on optional) · `StaminaEditModal.ts:285` (arith on optional) | **suspected — verify:** `npm run tsc` (`vue-tsc --noEmit`) almost certainly fails today; the justfile `release` recipe uses `build-no-check`, so releases never type-check. This is the enabling condition for bugs like CB-1. | Run `vue-tsc --noEmit`, fix the (likely small) error list, then make type-check a release/CI gate (BT-1/BT-4). |
| TS-2 | med | M | F3 (+F2 for statblock) | 70 hits of `as any`/`: any` — headline: `EncounterData.ts:14,33` (`statblock?: any` — **F2**), `CodeBlocks.ts:29,52-53`, `ComponentProcessor.ts:7,44` (D1), `ArgumentView.ts:55,115,157` (`argModifiers: any` for what is an `HTMLElement`) | `any` erodes the strict-null benefit that *is* enabled; Scorecard counts each as a warning. | Type the easy 80% (HTMLElement params, error types via `unknown` + narrowing); F2 replaces `statblock: any` with SDK 3.x types. |
| TS-3 | med | S | F3 | `tsconfig.json:14-30` | `target: ES6` + `lib: [ES5,ES6,ES7]` while esbuild builds `es2018` — TS won't offer/verify ES2018 lib features the runtime supports; `strict` off (only `noImplicitAny`+`strictNullChecks`), so no `strictPropertyInitialization` (uninitialized `settings` in `main.ts:12`, `completeButton` in `ArgumentView.ts:14`). | Align `target/lib` to ES2018; turn on `strict` incrementally (or at D1 when vue-tsc leaves). |
| TS-4 | low | S | F3 | `src/utils/CodeBlocks.ts:16` (`updateStatblock(app, data: NegotiationData, …)`) · `:34` (`as TFile` cast before the `instanceof` check) | Wrong parameter type on `updateStatblock` (unused today — see DC-5 note); cast-then-check pattern (obsidianmd rule 9). | Fix signature; drop the cast, keep `instanceof`. |

### 2.6 Build / tooling

| ID | Sev | Eff | Owner | file:line | Description | Recommended fix |
|----|-----|-----|-------|-----------|-------------|-----------------|
| BT-1 | **high** | M | F3 | `.github/workflows/ci.yml` | The only workflow deploys the mkdocs docs site. **No build, no type-check, no lint, no tests, no release workflow, no artifact attestation** for the plugin. | Add `plugin-ci.yml` (see §4.6) + a tag-triggered release workflow with attestation. |
| BT-2 | **high** | S | F3 | `package.json:10,39,44` (jest/ts-jest/@types/jest present; no `jest.config.*` anywhere; zero test files) | `npm test` → jest with no config and no tests → exits non-zero. Testing exists in name only. | §4 of this spec. |
| BT-3 | med | S | F3 | `.eslintrc` (legacy format, no obsidianmd plugin) · `package.json` (no `eslint` dep, no `lint` script) | Lint is **not runnable**: `@typescript-eslint/*` are installed but `eslint` itself is not a devDependency. Also predates `eslint-plugin-obsidianmd`, which the community scanner effectively enforces. | Add `eslint` + `eslint-plugin-obsidianmd` (flat config, `recommendedTypeChecked`), add `npm run lint`, wire into CI. |
| BT-4 | med | S | F3 | `justfile` `release` recipe | Releases run `npm run build-no-check` (skips `vue-tsc`), then `git add . && git commit --allow-empty -am …` — ships unchecked code and can sweep unrelated dirty files into the release commit. | Release via CI from a clean tag; at minimum use `npm run build` and explicit file adds. |
| BT-5 | med | S | F3 | `package.json:11` references `version-bump.mjs` + `versions.json` — **both files are missing** | `npm version` is broken, and `versions.json` is required by Obsidian's release/update flow (maps plugin version → minAppVersion). | Restore both (standard sample-plugin versions of these files). |
| BT-6 | low | S | F3 | `.editorconfig:5` (`end_of_line = crlf`) vs repo authored on Linux; mixed tabs/spaces across `src/` | Editor churn / noisy diffs. | Switch to `lf`, pick one indent style, one-time format pass (defer to D1/F1 churn windows). |
| BT-7 | low | — | **D1** | `esbuild.config.mjs:5,17-26,79,85-87` · `package.json:8,12,24,34,47,48` | Vue build chain: `unplugin-vue` esbuild plugin, `__VUE_*` defines, `copyToStylesPlugin` (Vue SFC styles → `main.css` → `styles.css`), `vue-tsc` in build/tsc scripts. Inventory in §3. | D1 executes removal; CSS pipeline must be re-plumbed (styles-source.css is imported by `main.ts:8` and bundled). |
| BT-8 | low | S | F3 | `package.json:40-41` | `jszip` (runtime-bundled) sits in devDependencies (works with esbuild but is semantically wrong); `jszip-utils` appears **unused** (no imports found). `css`/`@types/css` also have no importers — suspected — verify (may be a vue tooling remnant). | Move `jszip` to dependencies; drop `jszip-utils` (+ `css` if confirmed unused). |

### 2.7 Performance

| ID | Sev | Eff | Owner | file:line | Description | Recommended fix |
|----|-----|-----|-------|-----------|-------------|-----------------|
| PF-1 | med | S | F3 | `src/utils/JsonSchemaValidator.ts:78-81` | `validateJsonSchema` builds a **fresh AJV instance and re-compiles the schema on every call** — i.e. per stamina-bar/skills render, per note re-render. AJV compilation is the expensive part; a note with 20 elements pays it 20× each render. | Cache compiled validators keyed by schema (the existing `globalAjv` scaffolding at `:59-64` was built for this but is unused — see DC-5). |
| PF-2 | low | — | **F1** | design-level (`CodeBlocks` + all interactive processors) | Every click rewrites the file → Obsidian re-parses → the whole block re-renders. Functional, but visible flicker and O(file) work per click. | F1: state-diffing render or in-place update + debounced persistence. Not worth patching pre-F1. |

### 2.8 Dead code

| ID | Sev | Eff | Owner | file:line | Description | Recommended fix |
|----|-----|-----|-------|-----------|-------------|-----------------|
| DC-1 | low | S | F3/D1 | `src/drawSteelAdmonition/StaminaBar/StaminaBarProcessor.ts`, `StaminaBarView.ts` | DOM-based stamina bar superseded by `StaminaBar.vue`; never registered. `StaminaBarView.ts:44` even contains one of the ML-1 leak sites. | Keep **as D1 seed material** (they are the DOM rewrite starting point) or delete — Open Decision #7. |
| DC-2 | low | S | F3/D1 | `src/drawSteelAdmonition/Skills/SkillsProcessor.ts`, `SkillsView.ts` | Same story for the skills element. | Same as DC-1. |
| DC-3 | low | S | F3 | `src/drawSteelComponents/Modal.vue` (0 bytes) · `src/drawSteelComponents/StaminaBar/StaminaEditObsidianModal.ts` (0 bytes) | Two empty files. | Delete. |
| DC-4 | low | S | F3 | `src/utils/RegisterElements.ts:8` | `StaminaBarProcessor` imported, never used (evidence lint isn't running — BT-3). | Delete import. |
| DC-5 | low | S | F3 | `src/utils/JsonSchemaValidator.ts:59-64` (`getAjvInstance`/`globalAjv` unused by the validation path), `:250-257` (`createSchemaRegistry` unused), plus 4 of the 6 `validate*` exports (`validateJsonWithYamlSchema`, `validateJsonWithJsonSchema`, `validateYamlWithJsonSchema`, `validateDataWithSchema`) with zero callers | Half this module is dead; the live path is `validateYamlWithYamlSchema` (from `Skills.ts:14`, `StaminaBar.ts:17`) + `initializeSchemaRegistry`/`resetSchemaRegistry` (main.ts). Also `CodeBlocks.updateStatblock` (`CodeBlocks.ts:16`) has no callers. | Prune when implementing PF-1's validator cache. |
| DC-6 | low | S | F3 | `src/views/MinionStaminaPoolModal.ts:153` (unused `divider`), `:452-469` (commented-out add-condition block with a live-bug TODO) | Cruft; the TODO ("saving condition changes prevents damage from saving") documents a real interaction bug worth a test. | Remove; capture the TODO's scenario in the test plan (T-4 edge case). |

### 2.9 Doc staleness

| ID | Sev | Eff | Owner | file:line | Description | Recommended fix |
|----|-----|-----|-------|-----------|-------------|-----------------|
| DS-1 | high | S | F3 | `.repo-docs/architecture.md` (System Overview + "Two rendering strategies" + Vue Components section) | Presents Vue 3 as the current, intended strategy — contradicts the accepted 2026-04-06 revert decision. First thing a new contributor reads is wrong. | Add a banner note pointing at the revert decision now; full rewrite lands with D1/F1. |
| DS-2 | med | S | D1 | `.repo-docs/decisions/2026-04-06-revert-vue-3-adoption.md` ("Outcome: _To be filled in…_") · `CLAUDE.md` ("Two rendering strategies") | Decision accepted but unexecuted and outcome empty; CLAUDE.md accurately describes today but must flip when D1 lands. | D1 exit criteria: fill Outcome, update CLAUDE.md + architecture.md. |
| DS-3 | low | S | F3 | `.repo-docs/development.md`, `ci-cd.md` | suspected — verify: likely describe `npm test`/CI capabilities that don't exist (BT-1/BT-2). | Sync with the real state when the harness lands. |

### 2.10 Scorecard / submission gaps

| ID | Sev | Eff | Owner | file:line | Description | Recommended fix |
|----|-----|-----|-------|-----------|-------------|-----------------|
| SC-1 | low | S | F3 | `main.ts:18,55` | `console.log` in `onload`/`onunload` (rule 25). 12 `console.*` calls total, several as the *only* failure signal (`CodeBlocks.ts:49,65`). | Remove the load/unload logs; convert silent-failure logs to `Notice`s where the user loses data (canvas path). |
| SC-2 | low | S | F3 | `src/views/SettingsTab.ts:17,54` (manual `createEl('h3')`) · setting names "Release Tag (Optional)", "Destination Directory", "Default Creature Image Path" · `main.ts:30` command "Download Compendium" | Rule 17 (use `setHeading()`), rule 11 (sentence case UI text), rule 14/15 hygiene. | `new Setting(el).setName('…').setHeading()`; sentence-case all strings ("Download compendium"). |
| SC-3 | low | S | F3 | `LICENSE:3` | "Copyright (c) 2024" — `validate-license` wants the current year. | Bump to 2026 (range). |
| SC-4 | med | S | F3 | repo root | `versions.json` missing (see BT-5) — a hard submission/update-flow requirement. | Restore. |
| SC-5 | med | M | F3/**D2** | 65 `.style.*` assignments (e.g. `initiativeProcessor.ts:435,439,457-461`; `MinionStaminaPoolModal.ts:259-292`; `StaminaEditModal.ts:287-307`; `CounterView.ts:29,43,114-115,146`) with hardcoded colors `limegreen`/`crimson`/`deepskyblue`/`'red'`/`'green'` | Rules 32/34: direct style manipulation + non-theme colors; each is a Scorecard warning and breaks theming. Dynamic widths are legitimate but colors/border-radius/display belong in CSS classes. | Move color/display/radius to classes using Obsidian CSS variables; keep only computed widths inline (CSS custom properties). D2 (UI overhaul) is the natural owner for the wholesale pass; quick-win the modals' color constants. |
| SC-6 | med | M | F3/**F1** | see MP-1 | Accessibility (mandatory section of the guidelines): keyboard access, ARIA, focus-visible, touch targets. | With MP-1. |
| SC-7 | med | S | F3 | `manifest.json:5` (`minAppVersion: "0.15.0"`) | suspected — verify: `setTooltip` (`ArgumentView.ts:1,63`, `LearnMoreView.ts`) and other APIs used almost certainly postdate 0.15.0 (setTooltip ≈ 1.3). Users on old versions get hard crashes instead of a graceful "update required". | Determine the true floor (likely ≥1.4) and bump manifest + versions.json. |
| SC-8 | med | M | F3 | `.github/` | No release workflow → no GitHub artifact attestation → misses the Scorecard "Passed" checks. | Tag-triggered workflow: build, attest, attach `main.js`/`manifest.json`/`styles.css`. |
| SC-9 | med | S | F3 | `src/utils/CompendiumDownloader.ts:83` | `vault.delete(dir, true)` permanently erases the destination directory (rule 20 prefers `FileManager.trashFile`); the only warnings are settings-tab prose. Known footgun (repo CLAUDE.md documents it). | Trash instead of delete + explicit confirmation modal listing the folder. Pair with CB-9. |
| SC-10 | low | S | F3 | `src/utils/CompendiumDownloader.ts:38` | Uses legacy `request()` for the release-metadata call (the asset download already uses `requestUrl`). | Use `requestUrl` for both. |

---

## 3. Vue-limbo inventory (hand-off list for D1)

Exact removal surface. **16 `.vue` files, 1,236 LOC**, 4 npm deps, 2 TS glue files, 1 shim,
6 registered code-block tags across 3 elements. The models and schemas feeding Vue **stay**
(they're renderer-agnostic).

**Vue SFCs — elements (rewrite as DOM processors):**

| File | Role |
|---|---|
| `src/drawSteelComponents/HorizontalRule.vue` | `ds-hr`, `ds-horizontal-rule` (no model) — note the *live* DOM twin `src/drawSteelAdmonition/Common/horizontalRuleProcessor.ts` is already used internally by Statblock (`StatblockProcessor.ts:52`) and Featureblock (`FeatureblockView.ts:54`); trivial re-registration |
| `src/drawSteelComponents/StaminaBar/StaminaBar.vue` | `ds-stam`/`ds-stamina`/`ds-stamina-bar` |
| `src/drawSteelComponents/StaminaBar/StaminaAdjustor.vue` | edit-modal sub-component |
| `src/drawSteelComponents/StaminaBar/StaminaEditModal.vue` | Vue modal — a **DOM twin already exists** (`src/views/StaminaEditModal.ts`, used by the initiative tracker); D1 should unify on one modal |
| `src/drawSteelComponents/SkillList/SkillList.vue` + `SkillGroup.vue` | `ds-skills` |

**Vue SFCs — shared chrome (re-implement as DOM helpers or fold into F1 primitives):**
`Common/ComponentWrapper.vue` (collapsible wrapper — feature parity: `collapsible`/`collapse_default` YAML keys), `Common/CollapsibleHeading.vue`, `Common/ComponentHideIndicator.vue`, `Common/RightArrowToggleIndicator.vue`, `Common/ToggleIndicator.vue`, `Common/TooltipHover.vue`, `Common/DsButton.vue`, `Common/Modal.vue`, `VerticalRule.vue`, plus the **empty dead** `src/drawSteelComponents/Modal.vue`.

**TS glue (delete):** `src/utils/ComponentProcessor.ts` (mount path + ML-2 leak), `src/utils/ModalProcessor.ts` (Vue modal host), `shims-vue.d.ts`, empty `src/drawSteelComponents/StaminaBar/StaminaEditObsidianModal.ts`.

**Registration (rewire):** `src/utils/RegisterElements.ts:14-16` (SFC imports), `:32-34` (hr), `:51-54` (stamina), `:64-65` (skills), `:8` (dead import).

**Keep (renderer-agnostic):** `src/model/StaminaBar.ts`, `src/model/Skills.ts`, `src/model/ComponentWrapper.ts`, `src/utils/SkillsData.ts`, `src/model/schemas/{ComponentWrapperSchema,SkillsSchema,StaminaBarSchema}.yaml`.

**package.json:** remove dep `vue`; devDeps `@vue/compiler-sfc`, `unplugin-vue`, `vue-tsc`; change scripts `build`/`tsc` from `vue-tsc --noEmit` → `tsc --noEmit`. (Verify `css`/`@types/css` while in there — BT-8.)

**esbuild.config.mjs:** remove `unplugin-vue/esbuild` import (`:5`) + plugin entry (`:79`), `__VUE_*` defines (`:85-87`); rework `copyToStylesPlugin` (`:17-26`) — today `main.ts:8` imports `styles-source.css`, esbuild emits `main.css` (bundled with extracted SFC styles), which is copied to `styles.css`. Post-Vue, ~15 SFCs' scoped styles must migrate into `styles-source.css` (or the D3 theme layer). `.gitignore` entries for `main.css`/`styles.css` follow.

**Seed material:** dead DOM implementations `StaminaBarProcessor/StaminaBarView` and `SkillsProcessor/SkillsView` (DC-1/DC-2) predate the Vue versions — usable as rewrite baselines but they lack the newer features (component-wrapper collapsing, sheet style, temp-stamina overlay) — diff before trusting.

---

## 4. Test harness plan

### 4.1 Current state

- Installed: `jest ^30.0.5`, `ts-jest ^29.4.1` (Jest-30 compatible), `@types/jest ^30`,
  `identity-obj-proxy` (CSS mock, unused). `npm test` = `jest`.
- **No `jest.config.*` anywhere, zero `*.test.ts`/`*.spec.ts` files.** `npm test` exits
  non-zero ("no tests found").
- Structural blockers every first test hits:
  1. The `obsidian` npm package is **types-only** — no runtime. Every import chain touching
     `obsidian` needs a manual mock.
  2. The code relies pervasively on Obsidian's **HTMLElement prototype extensions**
     (`createEl`, `createDiv`, `createSpan`, `empty`, `addClass`, `removeClass`,
     `toggleClass`, `setText`) and the global `createEl` (`CounterView.ts:107`) — the mock
     must install these on `HTMLElement.prototype`/`globalThis` under jsdom.
  3. Obsidian's **`Array.prototype.contains`** polyfill is used
     (`src/model/NegotiationData.ts:47,55`) — must be polyfilled in test setup.
  4. tsconfig **path aliases** (`@/`, `@model/`, `@utils/`, `@views/`,
     `@drawSteelAdmonition/`, `@drawSteelComponents/`) need `moduleNameMapper`.
  5. **`.yaml` imports as raw text** (esbuild `yamlLoaderPlugin`) need a jest text
     transformer; **`.vue` imports** (only `RegisterElements.ts`) need a stub mapping until D1.

### 4.2 Recommended structure

```
draw-steel-elements/
  jest.config.ts               # two projects: "unit" (node) + "dom" (jsdom)
  test/
    mocks/obsidian.ts          # the one big mock (below)
    mocks/rawTextTransformer.js# .yaml -> `module.exports = <string>`
    setup/dom-setup.ts         # HTMLElement prototype extensions, createEl global,
                               # Array.prototype.contains, setIcon/setTooltip no-ops
    fixtures/                  # golden YAML inputs: statblock/, feature/, featureblock/,
                               # initiative/, negotiation/, counter/, stamina/, skills/
                               # (seed from docs/*.md examples — they are real user inputs)
    unit/model/…               # pure parse/math tests (node env)
    unit/utils/…
    dom/…                      # render tests (jsdom env)
```

**The obsidian mock** (`moduleNameMapper: {'^obsidian$': '<rootDir>/test/mocks/obsidian.ts'}`):
- `parseYaml`/`stringifyYaml` → delegate to `js-yaml` (Obsidian bundles js-yaml, so
  behavior matches; add as devDependency).
- Minimal classes: `Plugin`, `Modal` (open→onOpen, close→onClose, `contentEl`/`titleEl`
  as real jsdom divs), `PluginSettingTab`, `Setting` (chainable), `Menu`, `Notice`
  (recorder), `TFile`/`TFolder`, `MarkdownRenderChild`, `Component`.
- `setIcon`/`setTooltip` → no-op recorders. `MarkdownRenderer.render` → append raw text
  (assert on text, not markdown HTML).
- `request`/`requestUrl` → `jest.fn()` per-test.
- **In-memory vault fake** (the highest-value piece): `read`/`modify`/`process`/`create*`/
  `delete`/`getAbstractFileByPath` over a `Map<string,string>` — enables full round-trip
  tests of the click → mutate → file-rewrite pipeline, including CB-3's race (fire two
  updates, assert both survive).
- `MarkdownPostProcessorContext` fake: `sourcePath` + `getSectionInfo` returning
  `{lineStart, lineEnd, text}` for a block planted in the vault fake.

**What NOT to mock:** models, `ConditionManager`, `ArgumentPowerRolls`, math helpers — pure
TS, test directly. Vue components: out of scope until D1 (map `\.vue$` to a stub module).

### 4.3 First 10 tests (prioritized, highest-risk parse/render paths)

| # | Test | Guards |
|---|------|--------|
| T-1 | `parseEncounterData` happy path: heroes defaulted (stamina→max, temp→0, conditions normalized), instances auto-created with 1-based ids, squad `minion_stamina_pool` initialized to `max×amount` | the most complex parser in the repo (`EncounterData.ts:82-353`) |
| T-2 | `parseEncounterData` error surface: missing `heroes`, bad squad configs (2 minion types, >2 creatures, missing `squad_role`), invalid condition shape — assert message text | user-facing error contract; CB-11 class |
| T-3 | `CodeBlocks.updateMarkdownCodeBlock` round-trip on the vault fake: only the target block's lines replaced, surrounding note intact; **known-failure cases**: alias fence rewritten (CB-5), two concurrent updates (CB-3) — encode today's wrong behavior as `.failing`/todo tests so the fixes flip them green | the file-rewrite engine every interactive element runs through |
| T-4 | Minion pool math: `minionsToKill` calculation table; regression for CB-1 (`applyDamage` clamp) and CB-2 (language passed through); the DC-6 TODO scenario (condition change + damage in one session) | crit-severity data corruption |
| T-5 | `StaminaEditModal` math: `clampStamina`/`amountToDeath`/`amountToMaxStamina` incl. hero negative floor (`ceil(-0.5×max)`), temp-stamina-absorbs-damage-first ordering (`StaminaEditModal.ts:72-87`) | core HP bookkeeping |
| T-6 | `StaminaBar` model: `parseYaml` schema-validation failures produce the composed error; defaults (CB-15 behavior pinned); `fromHero`→`updateHero` round-trip | Vue→DOM migration safety net for D1 |
| T-7 | Negotiation logic: `ArgumentPowerRoll.build` outcome matrix (motivation/pitfall/lie/reused/same-argument combos) + `NegotiationData.setMotivationUsed`/`argumentReusesMotivation` truth table | densest game-rules logic, currently only verifiable by hand |
| T-8 | `ReferenceResolver`: `findFile` 5-step fallback chain against a fake vault/metadataCache; first-`ds-*`-block extraction regex (fence + `~~~` variants, no block found) | statblock references (5.1.0 feature) silently mis-resolve otherwise |
| T-9 | SDK boundary fixtures: `StatblockConfig.readYaml`/`FeatureConfig.readYaml`/`FeatureblockConfig` over golden YAML from `docs/statblock.md`, `docs/Features.md`, `docs/featureblock.md` — snapshot the parsed model | **the F2 upgrade net**: SDK 2.1.5→3.1.0 diffs surface as snapshot changes, not user bug reports |
| T-10 | DOM render smoke (jsdom project): `InitiativeProcessor.postProcess` on a fixture renders hero rows + enemy grid; clicking the turn indicator toggles state and fires exactly one vault write; `CounterView` inc/dec respects min/max and disables buttons | proves the DOM-render harness works end-to-end; template for all F1 element tests |

### 4.4 Slotting into F1 (testable by construction)

F1's Framework v2 should bake in the seams these tests currently have to fake:

1. **Pure core:** element = `(parsedModel, RenderContext) → DOM`, where `RenderContext`
   exposes *interfaces* for persistence (`saveBlock(data)`), markdown rendering
   (`renderMarkdown(el, md)`), and modals — injected, so unit tests pass fakes without
   touching the `obsidian` mock at all.
2. **Persistence engine as pure function:** the CodeBlocks successor separates "compute new
   file content given (content, sectionInfo, newBlock)" (pure, unit-tested exhaustively)
   from "apply via `vault.process`" (thin, tested once).
3. **Contract per element:** every element registers `{tag aliases, model.parse, render}`;
   the framework ships a parameterized conformance suite (parse fixture → render →
   snapshot; empty block → friendly error; save round-trip) that each new element gets by
   listing its fixtures. New elements are testable by construction — no bespoke harness.
4. The `test/mocks/obsidian.ts` built here is F1-independent and carries forward unchanged.

### 4.5 What to explicitly de-scope

- Vue component tests (D1 deletes them; testing them now is throwaway).
- Visual/CSS regression (D2/D3 concern; revisit with theming).
- Live-Preview behavior (M2-deferred).

### 4.6 CI recommendations

`.github/workflows/plugin-ci.yml` (push + PR): setup-node 22 (`engines: >=22.15`),
`npm ci`, `npm run tsc` (gate once TS-1 is fixed; `continue-on-error` until then),
`npm run lint` (after BT-3), `npm test -- --ci`, `npm run build-no-check` (bundle must
build). Separate tag-triggered `release.yml`: build, **attest artifacts**
(`actions/attest-build-provenance`), create release with `main.js`/`manifest.json`/
`styles.css` — replacing the justfile's local-release path (BT-4). Keep the existing
mkdocs workflow as-is.

---

## 5. Quick wins (safe, isolated, high-value — do first)

1. **CB-1** — parenthesize the minion-pool clamp (1 line, crit).
2. **CB-2** — pass a real language instead of `""` (1 line, high).
3. **CB-4** — de-singleton the negotiation menu closure (~10 lines, high).
4. **ML-1** — shared `renderMarkdown` util with `MarkdownRenderChild` + `ctx.addChild`
   (one util + 5 call-site edits; kills the biggest leak).
5. **CB-3** — swap `read`+`modify` for `vault.process` + per-file queue (one method).
6. **CB-7** — malice `setText` → update the text child only (2 lines).
7. **BT-5/SC-4** — restore `versions.json` + `version-bump.mjs`.
8. **SC-1/SC-2/SC-3** — drop onload/onunload logs, `setHeading()` + sentence case in
   settings/command, LICENSE year.
9. **DC-3/DC-4/CB-18** — delete the two empty files, the unused import, fix the error string.
10. **BT-2 bootstrap** — `jest.config.ts` + obsidian mock + T-1/T-4/T-5 (the harness
    foundation; everything else in §4 stacks on it).
11. **CB-9/SC-9** — parse zip before deleting; trash + confirm instead of permanent delete.

---

## 6. Open Decisions — needs Scott

1. **CodeBlocks atomicity timing (CB-3):** fix now as a quick win (recommended — it's a
   data-integrity bug users can hit today), or defer to F1's persistence seam and accept
   the risk for one more cycle?
2. **Fence-alias preservation (CB-5):** on save, should the plugin (a) preserve whatever
   alias the user wrote (recommended; least surprise), or (b) declare canonical-language
   normalization intended behavior and document it? Either way it's a behavior decision,
   not just a bug fix.
3. **Canvas support (SD-3):** the current selection-based private-API path silently drops
   edits. Harden it (still private API, breaks with Obsidian internals), or drop canvas
   *persistence* (render fine, edits show "not saved on canvas" notice) until an official
   API exists? `docs/canvas-character-sheet.md` advertises the feature, so dropping it is
   user-visible.
4. **Compendium delete semantics (SC-9/CB-9):** move to `FileManager.trashFile` + a
   confirmation modal? Changes documented behavior ("directory will be wiped") that some
   users may rely on for clean re-downloads.
5. **minAppVersion (SC-7):** after verifying the real API floor (likely ≥1.4), bump —
   accepts dropping users on ancient Obsidian in exchange for honest compatibility.
6. **CI strictness ramp (BT-1/BT-4):** block releases on type-check+tests immediately
   (releases pause until TS-1 is fixed), or land CI as informational first and flip to
   required once green? Recommended: informational for one cycle, then required.
7. **Dead DOM processors (DC-1/DC-2):** keep `StaminaBarProcessor`/`SkillsProcessor` +
   views as D1 seed material (recommended; delete after D1 lands) or delete now for a
   clean tree?
8. **New test-time dependency:** the harness needs `js-yaml` (mirror of Obsidian's bundled
   YAML) and optionally `jest-environment-jsdom` as devDependencies. Per program decision
   #4, flagging even these dev-only additions for sign-off.
