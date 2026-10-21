# SC-362 r0 survey — harness fixture compendium + by-SCC captures

## Executive summary

1. A by-SCC body takes this path: `withReference` → `RefUnwrapView` → `cx.compendium` (a `CompendiumIndex` over an `SccResolver`) **and** `cx.sccAnchors` (the same `SccResolver`). Both must be present for a card to resolve. `makeHarnessDeps` (`entry.ts:1862`) wires neither.
2. Today a by-SCC display card in the harness renders `.dse-error-card` "Compendium not installed". `mountFromParams` counts that as a failed shot. **`ds-scc` does not:** it renders `.dse-ref-notice`, which no gate counts. A by-SCC card with a typo in its code also passes: it renders the `.dse-ref-web-card`, which is a `.dse-ref-notice` too. The comments at `entry.ts:1925-1928` and `fixtures.test.ts:24-27` are wrong. The probe confirms this.
3. **Global wiring is forbidden.** Wiring the compendium + sccAnchors into every mount changes the DOM of 18 of the 81 existing fixtures (after normalising ids). Several of them own frozen print lines: kit, rule, perk, ancestry, title, treasure, statblock-companion-corpus and others. So the compendium must be scoped **per fixture**.
4. The seam is the real `SccResolver` + `createCompendiumIndex` over the mock vault the harness already has, seeded from `test/fixtures/md-dse/*.md`. Those files already exist; rule and condition are byte-identical to `data-unified` `bdb12093b`. They are loaded through the `.md` text loader, which both esbuild and jest already have. No stub interface is needed. Per-fixture modes `none | fixtures | anchors-only` cover SC-469's web card and not-installed card.
5. Families: 10 display families have an inline default AND an md-dse file of the **same entity**, so each is a direct twin. Treasure is the exception. Recommended for this ticket: `rule/by-scc` (opportunity-attack: its body is byte-identical to the inline `rule` default, plus title "Opportunity Attacks" and the SC-272 eyebrow "Combat") and `condition/by-scc` (Bleeding). Kit is excluded because its nested ```` ```ds-feature ```` renders as a raw `<pre>` in the browser shim.
6. Registries: `FIXTURES` only. **No `shoot.mjs` edit is needed**, because the sweep at `shoot.mjs:6104-6119` picks up new fixtures automatically. That means no collision with SC-349 (`snap()` / imports / tail). Parity is unchanged (`plugin-capture.mjs:27` hard-codes the default fixtures). e2e and lifecycle are unchanged.
7. Deltas for rule + condition: shots 572→580 · freeze **276→280** · jest about +5 tests, suites 231/232 unchanged · parity 0/0/24 unchanged · e2e 88/92 and 64/64 unchanged.
8. **Brief correction:** a widening is **2 lines per capture id** (`--steel-print` + `--steel-realprint`), not 1. The baseline holds 138+138 lines, and SC-390 / SC-379 widened in pairs.
9. Determinism: every lookup is awaited inside `pipeline.run`. The DOM was stable 300 ms later, and repeated renders were byte-identical (modulo the random ids existing fixtures already carry). No images, no extra fonts. Because the seeded file set decides which in-body links become vault links and which become web links, the harness compendium is part of the frozen contract.

## 1. Resolution path (real plugin)

- Wrapper: `src/elements/shared/withReference.ts:109-142`. `parse()` tags a ref-vs-inline body (`detectWholeBlockRef`, :86). `createView` → `RefUnwrapView` (:140).
- Ladder: `src/elements/shared/RefUnwrapView.ts:147-232`.
  - `cx.compendium` absent or `!available`: "Compendium not installed" (:175-179).
  - Code → `cx.sccAnchors.resolve()` (:183):
    - `unresolved`: "Unknown SCC code" (:184).
    - `web`: `webCard` (:188, :358). This card **bypasses `errorCard`**, so even a typed family renders `.dse-ref-notice.dse-ref-web-card`.
    - `vault`: `index.getEntity(code)` → `entity.model()` → `mountBase` (:193-228).
- Interfaces: `CompendiumIndex` (`src/services/CompendiumIndex.ts:33-42`, factory `createCompendiumIndex` :272) and `SccAnchorResolver { resolve(raw): SccResolution }` (`src/refs/rewriteSccAnchors.ts:4`). The concrete class is `SccResolver` (`src/refs/SccResolver.ts:88`).
  - `SccResolver.resolve` order: derivation under `settings.compendiumDestinationDirectory`, then the frontmatter-`scc` index, then `web` if `sccWebFallback` (default **true**, `Settings.ts:40`), else `unresolved` (:95-114).
  - Pipeline slot: `ElementPipelineServices.sccAnchors?` / `compendium?` (`src/framework/pipeline.ts:489-498`). main.ts threads both.
- Rule specifics (SC-272):
  - `genericNoteAdapter` sets `type` from the file's `scc:` segment (`src/services/typeAdapters.ts:191-195, 215-233`). The eyebrow is the humanised last dot-segment (`src/elements/display/displayFamily.ts:174-177`).
  - The inline `rule` has `type ""`, so its eyebrow is suppressed as a duplicate of the "Rule" title. Only by-SCC can show "Combat".
- On disk in a real vault: `CompendiumSyncService` (`src/data/CompendiumSyncService.ts:10-11, 362-377`) downloads `md-dse-unified-<locale>.zip` from the `SteelCompendium/data-unified` releases. It writes into `DS Compendium/` (`Settings.ts:37`), at the path `sccToFilePath` derives (e.g. `DS Compendium/rule/combat/turn.md`).
- Harness today (probe `sc362r0-probe-results.json`):

  | Body | Renders | Counted by `mountFromParams` (`entry.ts:2321`)? |
  |---|---|---|
  | `ds-rule` + `scc.v1:…` | `.dse-error-card` "Rule: failed to render (render) Compendium not installed" | Yes |
  | `ds-scc` + code | `.dse-ref-notice` (friendlyErrors, `RefUnwrapView.ts:350-353`) | **No.** The shot would be "green" with a notice card. `fixtures.test.ts:62` checks only `.dse-error-card`, so it would pass too |
  | Wired, code missing from the seeded vault (typo) | `.dse-ref-web-card` | **No, even for `ds-rule`.** The gate needs a notice check (§4) |

## 2. Injection seam

**Do not hand-write a stub.** Reuse the production classes over the harness's existing mock vault, exactly as `test/dom/elements/_refHarness.ts:59-106` does for jsdom. The mock `metadataCache.getFileCache` parses frontmatter on demand (`test/mocks/obsidian-core.ts:268-274`). In the browser bundle, `TFile` is one class: the shim re-exports `obsidian-core` (`visual-harness/shim/obsidian.ts:7`), and the jest mock does the same (`test/mocks/obsidian.ts:4`). So the `instanceof TFile` checks hold. All of this was proven in chromium by probe 1.

Shape (in `visual-harness/entry.ts`, next to `makeHarnessDeps`):

```ts
import ruleOA from '../test/fixtures/md-dse/rule/combat/opportunity-attack.md';
import condBleeding from '../test/fixtures/md-dse/condition/bleeding.md';
/** The harness compendium: real md-dse files at their synced paths. Part of the frozen
 *  contract — adding a file can turn a web link inside a by-SCC shot into a vault link. */
export const HARNESS_COMPENDIUM: Record<string, string> = {
  'rule/combat/opportunity-attack.md': ruleOA,
  'condition/bleeding.md': condBleeding,
};
export type HarnessCompendiumMode = 'none' | 'fixtures' | 'anchors-only';
/** `${element}/${fixture}` → mode. Absent = 'none' (every pre-existing fixture). */
export const FIXTURE_COMPENDIUM: Record<string, HarnessCompendiumMode> = {
  'rule/by-scc': 'fixtures',
  'condition/by-scc': 'fixtures',
};
export function attachHarnessCompendium(deps: ElementPipelineDeps, mode: HarnessCompendiumMode): void {
  if (mode === 'none') return;
  const app = deps.app as any;
  for (const [rel, text] of Object.entries(HARNESS_COMPENDIUM))
    app.vault.setFile(`${DEFAULT_SETTINGS.compendiumDestinationDirectory}/${rel}`, text);
  const resolver = new SccResolver(app, DEFAULT_SETTINGS);
  deps.sccAnchors = resolver;                                    // 'anchors-only' stops here
  if (mode === 'fixtures') deps.compendium = createCompendiumIndex(app, resolver);
}
```

- **Call sites.**
  - In `mountFromParams` (`entry.ts:2252`): right after `makeHarnessDeps()` and before `new ElementPipeline(deps)` (:2277). Use the mode of the single target. For stacks and galleries, use `'none'` unless every target declares the same mode.
  - In `fixtures.test.ts:60` (`makeHarnessDeps()` then `attachHarnessCompendium(deps, FIXTURE_COMPENDIUM[`${id}/${name}`] ?? 'none')`), or the by-SCC fixtures fail that test with an error card.
  - Mutating `deps` before the pipeline is built keeps `makeHarnessDeps()`'s signature, which `chromeRollout.test.ts:83` also calls. It also keeps the pref-apply flow (:2268-2276) untouched.
- **Fixture files.** Reuse `test/fixtures/md-dse/` (30 files, already the jsdom corpus). `rule/combat/{opportunity-attack,turn}.md` and `condition/bleeding.md` are **byte-identical** to `workspace/data/data-unified/en/unified/md-dse/` @ `bdb12093b`. This follows the same convention as `entry.ts:90-106`, which imports `../test/fixtures/statblock/*.yaml`. Do not copy them into a new `visual-harness/fixtures/` directory: a second copy would drift. Loaders already exist: `esbuild.mjs:21` `.md: 'text'`, `jest.config.ts` `^.+\.md$` → `rawTextTransformer`, `md.d.ts`. The worktree's `data/` is empty; the main checkout's `data/data-unified` is the real source.
- **SC-469 reuse (no fixtures added here).**
  - Web card: mode `'fixtures'` + a code absent from `HARNESS_COMPENDIUM`. `sccWebFallback` is `true` by default, so this gives `.dse-ref-web-card` (probe case 11).
  - Not-installed card: mode `'anchors-only'` (or `'none'`) → "Compendium not installed" (probe cases 3 and 12).
  - SC-469 then adds an `scc` FIXTURES key, drops `'scc'` from `NO_FIXTURE_IDS` (`fixtures.test.ts:29`), and declares `expectNotice: true` for those two fixtures (see §4).
  - A `compendium=` URL param is unnecessary: the mode is a property of the fixture.

## 3. Families

- By-SCC / hybrid capable: **every `withReference` element.**
  - statblock (`statblock/definition.ts:58`), feature (`feature/definition.ts:55`), featureblock (`featureblock/definition.ts:60`).
  - The 11 internal display families (`display/displayFamily.ts:87, 231`; list `display/index.ts:162-174`): kit, condition, treasure, ancestry, culture, career, class, title, perk, complication, rule.
  - `ds-scc` (`scc/definition.ts`) dispatches to all 14 via `BASE_BY_ALIAS`.
  - Hero, encounter and project consume `cx.compendium` directly (`hero/resolve.ts:87-98`, `encounter/view.ts:172`, `project/view.ts:102`), but they are not whole-block refs.
- Probe 2 rendered all 14 by-SCC against the md-dse corpus: 0 error cards, 0 notices.

  | Family | md-dse twin of the inline default? | By-SCC eyebrow · title |
  |---|---|---|
  | rule | yes, body byte-identical (opportunity-attack) | Combat · Opportunity Attacks |
  | kit | yes (panther; **fixture differs from data**) | Martial Kit · Panther; **1 `<pre>`** (nested ds-feature) |
  | condition | yes (bleeding, = data) | Condition · Bleeding |
  | ancestry | yes (human, = data) | Ancestry · Human |
  | culture | yes (urban, = data) | Culture · Urban |
  | career | yes (politician, = data) | Career · Politician |
  | class | yes (tactician, = data) | Class · Tactician; tall (existing shot is 3574 px) |
  | title | yes (back-from-the-grave, = data) | Echelon 3 · Back From the Grave |
  | perk | yes (familiar, = data) | Perk · Familiar |
  | complication | yes (chosen-one, = data) | Complication · Chosen One |
  | treasure | no (inline is Color Cloak; md-dse is Executioner's Blade, which differs from data) | Weapon · Executioner's Blade |

- **Recommendation:** `rule/by-scc` (required) + `condition/by-scc`. Both are short: the existing default shots are 552 / 660 px at the 1.69 device scale, so about 330–390 CSS px, under the 1200 px viewport and clear of SC-349's grow-viewport path.
  - Optional cheap extras: title, complication, perk (each +4 shots, +2 freeze lines).
  - Exclude kit (the raw `<pre>` is a harness-fidelity artifact; ground truth is the Obsidian camera's `by-scc-kit`).
  - Exclude class (tall: it would land on SC-349's resize path).
  - Exclude treasure (no twin).
- **Capture through the typed key, not `ds-scc`.** Use body `scc.v1:mcdm.heroes.v1/rule.combat/opportunity-attack` under `FIXTURES.rule['by-scc']`, which gives capture id `rule-by-scc`.
  - It is the identical `RefUnwrapView` ladder minus `baseForType`, and it is a direct twin of `rule--*`.
  - A `ds-scc` capture needs an `scc` FIXTURES key. That key joins the gallery (`entry.ts:2296` mounts every key's default) and `NO_FIXTURE_IDS`. Leave it to SC-469, which needs that key anyway.

## 4. Captures, registries, freeze

- **Registration is `FIXTURES` only** (`entry.ts:972`): `rule: { default, 'by-scc': … }`, `condition: { default, 'by-scc': … }`.
  - The manifest (`entry.ts:2388`) → `shoot.mjs:6104-6119` shoots every fixture × 4 combos (`shoot.mjs:90-95`) as `<id>-<fixture>--<combo>`.
  - Galleries mount the default fixture only (`fixtureName` is undefined → default, `entry.ts:2005`), so gallery bytes are unchanged.
  - New fixtures automatically join the in-run sweeps: text-scale-once (`shoot.mjs:7026`), print-twin delta (`shoot.mjs:7083-7085`), nested corner radius. No allow-list entries are needed for a plain display card. The existing `perk-links` already pins `ds-scc-web` / `internal-link` anchors in both print classes.
- **Gates that must change in this ticket:**
  1. `mountFromParams` (`entry.ts:2320-2323`): also push an error for any `.dse-ref-notice`, unless the fixture declares `expectNotice` (the SC-469 opt-out). Safe globally: notices are only produced by `ds-scc` (no fixture exists) or by the web path, which needs `sccAnchors`, which no existing fixture has.
  2. `fixtures.test.ts:57-76`: attach the declared mode, and assert no `.dse-ref-notice` alongside the `.dse-error-card` check.
  3. Fix the stale comments:
     - `entry.ts:1925-1928` and `fixtures.test.ts:24-28` ("error card": wrong for `ds-scc`).
     - `entry.ts:362-366`: `heroSparse` claims "the harness compendium now carries" the fury abilities. It does not: hero renders differently once wired.
- **Registries that need nothing:**
  - `docs-manifest.mjs`: docs-shots writes only `docs/Media`.
  - Parity: `parity/plugin-capture.mjs:27` `ELEMENTS` is fixed to default fixtures, so parity stays 0 GAPs / 0 undeclared / 24 DECLARED.
  - e2e: `e2e/manifest/*.ts` is control coverage; a static card has no controls, so 64/64 is unchanged.
  - Lifecycle: unchanged at 29/29.
  - `NO_FIXTURE_IDS`: unchanged (no `scc` key).
- **Widening:** append `rule-by-scc--steel-print.png`, `rule-by-scc--steel-realprint.png`, `condition-by-scc--steel-print.png`, `condition-by-scc--steel-realprint.png` → **276 → 280**.
  - Additions-only, so no sanction is needed (dse-verify "Widening the baseline is additions-only"). Collision check: 0 of these names exist in the current baseline (verified by grep).
  - **The brief's "one `--steel-print.png` line per id" is stale.** The baseline is 138 print + 138 realprint, and SC-390 widened "print twin + realprint".
  - `check-freeze.sh` derives TOTAL from `wc -l`, so it has no literal count to bump.
  - Apply at landing (dispatcher or owner) from hashes taken on the **final base**, after the SC-349 rebase.
- **SC-349 overlap:** SC-349 (`worktrees/sc349-skills-print-clip`, 3 commits, not on origin) touches the `shoot.mjs` import block (@31), `snap()` (@480-640) and the tail (@7088), plus a new `capture-viewport.mjs`. SC-362 touches **zero `shoot.mjs` lines**, so there is no textual conflict.
  - Behaviour: SC-349 grows the viewport only for captures taller than 1200 CSS px on screen combos. The recommended cards are well under that, so their hashes should not depend on SC-349. Still re-hash after rebasing.

## 5. Risks

- **Moving existing frozen PNGs.** This happens only if wiring leaks beyond the declared fixtures: probe 3 shows 18 fixtures' DOM changes under global wiring. Mitigations:
  - (a) Mode defaults to `'none'` and is set only from `FIXTURE_COMPENDIUM`.
  - (b) A jest pin: every fixture not in `FIXTURE_COMPENDIUM` mounts with `deps.compendium === undefined && deps.sccAnchors === undefined`.
  - (c) Full-sweep freeze `276/276` byte-identical before the widening (ledger rule).
- **Async.** Resolution is fully awaited inside `pipeline.run`. `getEntity` and `model()` use `vault.read`, which is a mock promise. `mountOne` is sequential, so the module-level `IN_FLIGHT_REFS` (`RefUnwrapView.ts:58`, keyed `Harness.md::ds-rule::0`) cannot collide. Probe: DOM length was unchanged 300 ms after `run()`, and the rule/condition renders were byte-identical across runs.
- **Seed-set coupling.** In-body `scc.v1:` links become `.ds-scc-web` (web fallback) or `internal-link` (if the target is seeded). Opportunity-attack's 9 links are all web today. Adding a file to `HARNESS_COMPENDIUM` later can move the new frozen shots; say so in the constant's doc comment.
  - Seed only what the fixtures need. `turn.md` is not required: it would self-link as vault and has no bearing on the two cards.
- **Fixture drift.** `test/fixtures/md-dse` is shared with the jsdom suites. An edit there for another ticket moves these shots. This is the same exposure as the statblock corpus yaml, and it is acceptable; note it in the header comment.
- **Fidelity.** The browser shim renders body markdown with `marked` (`shim/obsidian.ts:33-45`), not Obsidian's renderer. That is fine for rule and condition (prose plus links), and it is why kit is excluded.
- **Fonts and images.** Neither card has `<img>` (probe: 0) or fonts beyond the existing card set.

## Implementation plan (in order)

1. `visual-harness/entry.ts`:
   - `.md` imports of the 2 md-dse files.
   - `HARNESS_COMPENDIUM`, `HarnessCompendiumMode`, `FIXTURE_COMPENDIUM`, `attachHarnessCompendium` (+ `SccResolver` / `createCompendiumIndex` imports).
   - `FIXTURES.rule['by-scc']` = `scc.v1:mcdm.heroes.v1/rule.combat/opportunity-attack`; `FIXTURES.condition['by-scc']` = `scc.v1:mcdm.heroes.v1/condition/bleeding`.
   - In `mountFromParams`: attach the mode before `new ElementPipeline`; add the `.dse-ref-notice` failure (with an `expectNotice` opt-out hook, left empty).
   - Fix the comments at :362-366 and :1918-1929.
2. `test/dom/visual-harness/fixtures.test.ts`:
   - Attach the declared mode in the per-fixture loop and assert no `.dse-ref-notice`.
   - New tests:
     - (i) `rule/by-scc` shows title "Opportunity Attacks" + eyebrow "Combat", and `condition/by-scc` shows "Bleeding".
     - (ii) Undeclared fixtures get no compendium or anchors.
     - (iii) `mountFromParams` reports a `.dse-ref-notice` as an error: use a declared fixture with a code missing from the seed set, or a stub.
   - Fix the comment at :24-28.
3. `visual-harness/README.md`: under "Pieces", add a "harness compendium" bullet (seam, modes, the seed-set-is-frozen warning, the SC-469 hook).
4. Battery:
   - tsc / lint clean.
   - jest **≈5413–5414 passed / 1 skipped / 231 of 232 suites**: +2 loop tests + 3–4 new; exact count TBD by the implementer.
   - Lifecycle 29/29 · e2e 88/92, 64/64.
   - Shots **580** (+8), 0 FAIL, all in-run gates OK.
   - Freeze `276/276` byte-identical (pre-widening).
   - Parity 0 / 0 / 24.
5. Widening at landing: +4 lines → `freeze OK (280/280 …)`. Rebase onto SC-349 first if it lands first, and re-hash on the final base.
6. Add a dse-verify CURRENT entry at landing (owner/dispatcher). The work is not user-facing, so no CHANGELOG entry.

Probe artifacts (scratch, not in the repo):
- Probe 1, by-SCC cases and degrade cards: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc362-r0-x7q4/sc362r0-probe-results.json`
- Probe 2, the 14 families: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc362-r0-x7q4/sc362r0-probe2-results.json`
- Probe 3, global-wiring blast radius with noise floor: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc362-r0-x7q4/sc362r0-probe3-results.json`
- Sources: `sc362r0-probe{,2,3}-entry.ts` and `-run.mjs` in the same folder. They bundle into scratch with the main checkout's `node_modules`, read-only, and run in headless chromium.
