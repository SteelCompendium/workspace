# SC-108 / FOLLOWUPS #37 — fixture coverage design (recon 2026-08-02, read-only Plan agent)

# Summary

Recon confirms every piece of FOLLOWUPS #37 is buildable with tooling-only changes (`visual-harness/entry.ts`, `shoot.mjs`, `obsidian-camera.mjs`) and **zero `src/` changes** — the advancement-band gate in `featureblock/view.ts:144-149` already works off an untyped, unvalidated `level` field (featureblock has no AJV schema at all), so a new fixture is purely data. The freeze check is byte-list-based (`sha256sum -c`), so new files are structurally invisible to it — no risk, no rebaseline required. The sidebar light shot only needs to reuse the already-generic `setChromeBg()` helper inside the existing sidebar-special block in `obsidian-camera.mjs` — real but bounded camera-tooling code, not `src/`. A genuine bonus finding: the plugin's own CSS comment claiming `.dse-fb__adv-head` is "PLUGIN-ONLY, no site counterpart" is **stale** — the live site has real `.fb__band--adv`/`.fb__adv-head` rules and a live advancement-band page (`monster/fixture/demon/the-boil-advancement-features`), so a parity pair is technically possible but is sized as separate/optional, not part of this S-task.

**Freeze answer: `check-freeze.sh` runs `sha256sum -c freeze-baseline.sha256`, which only verifies the 98 filenames explicitly listed in that file and is silent about every other file in the shots directory — so a new fixture's new `*--legacy-{dark,light}.png`/`*--steel-print.png` files are invisible to it and the "98/98" check keeps passing unmodified, with zero required action; only if you also want those 3 new files pinned against future regression should you *append* (never regenerate) their 3 new hash lines to `freeze-baseline.sha256`, leaving the existing 98 lines byte-identical.**

---

# Full Design: FOLLOWUPS #37 / SC-108 — cover the three unshot Steel featureblock/sidebar rules

## 1. How fixtures work (verified against code, not assumption)

- **Data source**: `visual-harness/entry.ts` owns `export const FIXTURES: Record<string, Record<string, string>>` — one entry per **registered element id**, each value a map of **named fixture bodies** (raw YAML text). Today every element has exactly one name, `default`, imported from `src/elements/<id>/example.yaml` (the same file `authoring.example` uses for the Insert command/palette — CLAUDE.md's D9 note: "single source shared by the palette AND the visual-harness fixture").
- **Manifest**: at browser-boot time, `entry.ts` publishes `window.__dseHarnessManifest = { elements: Object.keys(FIXTURES).map(id => ({ id, fixtures: Object.keys(FIXTURES[id]) })) }`. **The manifest already carries a `fixtures: string[]` per element** — this was clearly built to support multiple named fixtures per element; `shoot.mjs` just never consumed the second field (`shoot.mjs:75`: `let elements = manifest.elements.map((e) => e.id);` discards `.fixtures`).
- **Validity gate**: `test/dom/visual-harness/fixtures.test.ts`:
  - asserts `Object.keys(FIXTURES)` is *exactly* the 32 registered element ids (so **you cannot invent a new top-level key** — a fixture must live under a real element id).
  - loops `for (const [id, fixtures] of Object.entries(FIXTURES)) for (const [name, source] of Object.entries(fixtures))` and generates one jest test per fixture automatically — **adding a named fixture is validity-gated for free**, no test file edit needed.
- **How a NEW fixture/variant is added**: it is **one entry** — a new key nested inside an *existing* element's fixture map in `entry.ts` (e.g. `featureblock: { default: ..., advancement: ... }`). No view/src code is required; the render path (`ElementPipeline.run` → `FeatureblockConfig.readYaml` → `FeatureblockElementView`) is already fully generic over fixture content.
- **Shot naming today**: `shoot.mjs:98` names every shot `${id}--${comboName(c)}${suffix}` — **the fixture name never appears in the filename**, and the full-sweep loop always requests `fixture: args.fixture ?? 'default'` uniformly for every element. This means, as shipped, a second named fixture under an existing id is a **collision hazard**: running `node shoot.mjs --element=featureblock --fixture=advancement` today would silently overwrite `featureblock--legacy-dark.png` (one of the 98 *frozen* files) with different bytes. §3/§6 fix this.
- **"Approved as goldens"**: there is **no separate baseline-approval step** for `visual-harness/shots/` — the directory is gitignored (`.gitignore:32`), shots are simply regenerated and eyeballed (agents/humans read the PNGs directly per `draw-steel-elements/CLAUDE.md`'s "Visual harness" section). The only committed, byte-pinned artifact is the LEGACY/PRINT freeze subset in `.superpowers/sdd/freeze-baseline.sha256` (see §3) — that is a distinct, narrower mechanism from "the golden PNGs" in general.

## 2. The advancement-run gate — verified line-by-line, exact fixture data

`src/elements/featureblock/view.ts` (current file; line numbers have drifted slightly from the followups' `145-149` due to later comment edits, logic unchanged):

```ts
for (const run of runs) {
    let host = card;
    if (run.level > 0) {
        host = card.createDiv({ cls: 'dse-fb__band--adv' });
        host.setAttribute('data-level', String(run.level));
        host.createDiv({ cls: 'dse-fb__adv-head', text: `Level ${run.level} Advancement` });
    }
    renderFeatureList(host, FeatureConfig.allFrom(run.features), this, renderMd, { ... });
}
```

`featureLevelOf()` reads an **untyped extra field**, `(feature as Feature & { level?: unknown }).level`, off the SDK's `Feature` model. Critically, I verified there is **no schema validation in the way**:
- `src/elements/featureblock/definition.ts` has **no `schema` field** at all ("Static + SDK-backed: no schema... the SDK reader is the validator, same as legacy"), and `ElementPipeline.prepareModel` only runs the AJV validation stage `if (def.schema)` — so it's skipped entirely for featureblock.
- The SDK's `Featureblock`/`Feature` classes (`node_modules/steel-compendium-sdk/dist/model/{Featureblock,Feature}.js`) construct via plain `Object.assign(this, source)` — no AJV, no `unevaluatedProperties` enforcement at read time. (The SDK's own `feature.schema.json` *would* reject an unknown `level` property via `unevaluatedProperties: false`, but that schema is never invoked on this path — only `featureblock.schema.json`'s internal `richFeature` def documents `level` as "Advancement group level (fixture/retainer advancement)", confirming this is the sanctioned real-world shape, just reached through a different code path here.)
- So: **any `level: N` on a `features[]` entry passes straight through, untouched, to the view.** This is exactly what FOLLOWUPS #37 asserts.

There is already a **proven, working** fixture literal for this exact case — `test/dom/elements/featureblock.test.ts`'s `WITH_ADVANCEMENT` constant, exercised by a passing test (`'.dse-fb__band--adv: contiguous Level>0 features wrap in an advancement band...'`, line 369) that asserts 2 bands (`data-level="3"` with 2 features, `data-level="6"` with 1 feature) plus a level-0 feature in the main flow. Reuse it verbatim — don't invent new YAML:

```yaml
type: featureblock
featureblock_type: Fixture
name: Tiered Idol
features:
  - type: feature
    feature_type: trait
    name: Base Glow
    effects:
      - effect: Sheds light 2.
  - type: feature
    feature_type: trait
    name: Blinding Flare
    level: 3
    effects:
      - effect: Each enemy within 3 squares is dazzled.
  - type: feature
    feature_type: trait
    name: Searing Beam
    level: 3
    effects:
      - effect: One enemy within 5 squares takes 5 fire damage.
  - type: feature
    feature_type: trait
    name: Solar Crown
    level: 6
    effects:
      - effect: Allies within 2 squares gain an edge.
```

This deliberately carries no top-level `level`/`ev` (unlike `WITH_STATS`), so the shot proves the advancement band in isolation, uncontaminated by the block-level "Level N" chip.

## 3. Freeze-check interaction (the critical question)

`.superpowers/sdd/check-freeze.sh`:
```bash
cd "$SHOTS" || ...
out=$(sha256sum -c "$BASE" 2>&1 | grep -v ': OK$')
if [ -n "$out" ]; then echo "FREEZE VIOLATED:"; ...; exit 1; fi
echo "freeze OK (98/98 legacy+print PNGs byte-identical)"
```
`.superpowers/sdd/freeze-baseline.sha256` is a flat list of **98 explicit `<hash>  <filename>` lines**, one per `*--legacy-dark.png` / `*--legacy-light.png` / `*--steel-print.png` across the 33 pre-existing elements (33+33+32, `condition`/`conditions` both present, one asymmetry not relevant here).

`sha256sum -c FILE` **only ever validates the filenames named in FILE**. It does not list or diff the directory; a file present in `$SHOTS` but absent from `freeze-baseline.sha256` is neither checked nor reported — it is completely invisible to the tool. Therefore:

- **Adding the `featureblock`/`advancement` fixture produces 3 new legacy/print files** (`featureblock-advancement--legacy-dark.png`, `featureblock-advancement--legacy-light.png`, `featureblock-advancement--steel-print.png`, per the naming fix in §6) that **do not collide with any of the 98 tracked names** (as long as the naming fix suffixes the fixture name — see §6's collision warning) — the freeze check passes exactly as before, **98/98**, no baseline touch required.
- **The one real hazard** is filename collision, not addition: if the new fixture's shots were named identically to an existing frozen file (e.g. if `shoot.mjs` weren't changed and someone ran `--fixture=advancement --element=featureblock` unmodified), the *existing* `featureblock--legacy-dark.png` frozen name would be overwritten with different bytes, and check-freeze.sh **would** correctly catch that as a mismatch (not silently pass) — but only after the golden itself has already been clobbered on disk. §6 eliminates this by construction (fixture name goes into the filename).
- **Additions-only procedure (optional, recommended, NOT required for the check to stay green)** — if you want the 3 new legacy/print shots pinned against *future* accidental Steel-only regressions too (closing the same "shipped but never verified" gap this whole followup is about):
  1. Run the shots so the 3 new files exist in `visual-harness/shots/`.
  2. `cd visual-harness/shots && sha256sum featureblock-advancement--legacy-dark.png featureblock-advancement--legacy-light.png featureblock-advancement--steel-print.png`
  3. **Append** those 3 lines to `.superpowers/sdd/freeze-baseline.sha256` (order doesn't matter — `sha256sum -c` is order-independent). **Do not touch, reorder, or regenerate any of the existing 98 lines.**
  4. Update the two literal "98" strings in `check-freeze.sh` (the header comment `Baseline: 98 hashes...` and the success echo `freeze OK (98/98...)`) to `101`, since they're hardcoded prose, not computed — leave the `sha256sum -c` logic itself untouched.
  5. Re-run `check-freeze.sh` once to confirm `101/101`.

This is genuinely "additions only": the 98 existing hashes are never recomputed, the script logic is unchanged, only new lines are appended and two doc-strings are bumped.

## 4. Sidebar light-scheme shot — is it disproportionate?

`visual-harness/obsidian-camera.mjs`, step 3c (`SIDEBAR_SPECIAL_ID = 'sidebar-initiative'`, ~lines 681-777): opens `Harness/initiative.md`, runs the real `send-initiative-to-sidebar` command, waits for `.dse-sidebar__panel [data-dse-element="initiative"]`, then:
```js
await setPluginTheme(elSel, 'steel');
await setChromeBg('dark');           // <-- hardcoded
...
const bytes = await screenshot(cdp, path.join(shotsDir, `${outName}.png`), clip);
```
`setChromeBg(bg)` (already defined, generic, reused everywhere else in the file) flips Obsidian's own `body.theme-dark`/`body.theme-light` class via `app.changeTheme`. That class is **exactly** what the CSS twin needs — the plugin's `styles-source.css` §5 "Sidebar leaf" section has:
```css
.dse-sidebar [data-dse-theme='steel']:not([data-dse-print="on"])[data-dse-element='initiative']:not([data-dse-error-stage]) { box-shadow: var(--dse-bevel); }
body.theme-light .dse-sidebar [data-dse-theme='steel']:not([data-dse-print="on"])[data-dse-element='initiative']:not([data-dse-error-stage]) { box-shadow: var(--dse-bevel); }
```
with a whole comment block explaining why the `body.theme-light` twin is needed (specificity fight vs. the light-scoped shared plate rule) — this is precisely the rule the followup wants a retained shot of.

**Verdict: this does need `obsidian-camera.mjs` code — not a config entry, not a scheme-loop toggle alone — but it is a small, low-risk, fully-precedented change, not disproportionate.** No new camera primitive is required; `setChromeBg`, `screenshot`, `evaluate`, and the rect/emulated-viewport logic are all already generic and reused verbatim. Concretely: wrap the existing "set theme → set bg → measure → clip → screenshot" tail of step 3c (currently a single pass) in `for (const bg of ['dark', 'light'])`, calling `setChromeBg(bg)` each iteration and writing `initiative--obsidian-sidebar-steel-${bg}.png`. Set `setPluginTheme(elSel, 'steel')` once before the loop (it doesn't change between iterations); re-measure the leaf rect fresh each iteration (mirroring the main sweep's own "Fresh rect EVERY shot — theme flips can resize the element" comment) and re-run the existing emulated-viewport overflow handling per iteration. The final total-shots formula (`obsidian-camera.mjs:934-938`) needs `(runSidebarSpecial ? 1 : 0)` bumped to `(runSidebarSpecial ? 2 : 0)`.

**No alternative is needed** — the followups' proposed manual `getComputedStyle().boxShadow` injection check is explicitly a one-off, unretained verification; the camera-loop change is the actual fix and is the minimal one. This IS the "fiddlier half" the followup calls out, but it's fiddly in *care* (rect timing, emulated-viewport bookkeeping), not in *size* — under 20 changed lines, zero new helpers.

## 5. Parity gate (`visual-harness/parity/`) — in scope or separate?

`selector-map.json`'s shape is `{ id, site, plugin, why }` pairs, sampled by `site-capture.mjs` (against `urls.json` live pages) and `plugin-capture.mjs` (against the harness, **hardcoded** `ELEMENTS = ['feature','statblock','featureblock','kit','condition']` and **hardcoded** `fixture=default` for all of them, `plugin-capture.mjs:25,33`).

Two independent findings:
- **(a) `.dse-fb__adv-head`**: `styles-source.css`'s own comment at the rule (~line 3877-3880) says: *"a PLUGIN-ONLY surface with no site counterpart."* **This is stale/wrong** — I verified `v2/docs/stylesheets/steel-featureblock.css:210-217` has a real `.fb__adv-head` rule (`font-weight:700; text-transform:uppercase; letter-spacing:.07em; font-size:.72rem; color:var(--role)`), and `.fb__band--adv` (`steel-featureblock.css:202-209`) too. A live page exists with this exact DOM: `https://steelcompendium.io/v2/Browse/monster/fixture/demon/the-boil-advancement-features/` (confirmed via `grep -rl "fb__band--adv" v2/docs/Browse` — 70 pages carry it, this one matches the `monster.fixture` family the followup already discusses).
- **(b) `.dse-fb__band--adv`**'s Steel override (`border-left-color: var(--dse-role, var(--dse-role-leader))`) is likewise pairable against the site's real rule.

**So a parity pair is technically possible and would close a real, currently-uncaught material gap** — but it is a **separate, larger unit of work**, not in scope for this S-sized fixture task, because it requires:
1. `plugin-capture.mjs` code change: `ELEMENTS` is a flat id list with no per-element fixture selection — it would need a `{ id, fixture }` shape (or a special-case) to sample `featureblock` at `fixture=advancement`, not just `default`.
2. A new `urls.json` entry (`{ id: "featureblock-advancement", url: ".../the-boil-advancement-features/", waitFor: ".fb__band--adv" }`).
3. Two new `selector-map.json` pairs (`fb-adv-head`, `fb-band-adv`).
4. **`npm run parity:site`** — a full live-site baseline regeneration, which the parity README explicitly frames as *"a deliberate act, not part of CI... review the JSON diff before committing."* This is a different (heavier, human-reviewed) discipline than the freeze mechanism and shouldn't be bundled silently into a "just add a fixture" task.

**Recommendation: file this as its own follow-up** (cite the corrected finding — the "PLUGIN-ONLY" CSS comment is wrong and should also be fixed/removed as part of that follow-up), and keep the current task scoped to the fixture + goldens + sidebar light shot.

## 6. Step-by-step implementation plan

### Global Constraints
- **Freeze is additions-only.** Never regenerate or reorder the 98 existing lines in `.superpowers/sdd/freeze-baseline.sha256`; only ever *append* new lines for genuinely new filenames, and only if you deliberately choose to widen frozen coverage (§3 — optional).
- **No wholesale rebaseline of anything** — not the freeze file, not `visual-harness/parity/baseline/*` (out of scope this task, §5).
- **No `src/` changes.** Everything here lives in `visual-harness/entry.ts`, `visual-harness/shoot.mjs`, `visual-harness/obsidian-camera.mjs`, and `.superpowers/sdd/check-freeze.sh` (only if doing the optional §3 widening). `featureblock/view.ts` needs **zero** changes — the gate already works generically.
- **`obsidian-camera.mjs` DOES need a real code change for (c)** (§4) — flag this loudly in the PR/task description since the prompt calls it out specifically; it is tooling code, not production `src/`.
- **Devbox wrapping**: per `visual-harness/README.md`, run node-based commands as `devbox run -- bash -c "cd draw-steel-elements && <cmd>"` from the workspace root.
- **Naming collision safety**: any shoot.mjs change MUST make non-default-fixture shots filename-distinct from the frozen defaults (§1's collision hazard) before it is ever run against the real repo.

### Task A — featureblock advancement fixture + goldens (lights up (a) + (b))

1. **`draw-steel-elements/visual-harness/entry.ts`**: add a new string constant (verbatim YAML from §2, sourced from `test/dom/elements/featureblock.test.ts`'s proven `WITH_ADVANCEMENT`) near the other fixture imports, and extend the `featureblock` entry in `FIXTURES`:
   ```ts
   const featureblockAdvancement = `type: featureblock
   featureblock_type: Fixture
   name: Tiered Idol
   features:
     - type: feature
       feature_type: trait
       name: Base Glow
       effects:
         - effect: Sheds light 2.
     - type: feature
       feature_type: trait
       name: Blinding Flare
       level: 3
       effects:
         - effect: Each enemy within 3 squares is dazzled.
     - type: feature
       feature_type: trait
       name: Searing Beam
       level: 3
       effects:
         - effect: One enemy within 5 squares takes 5 fire damage.
     - type: feature
       feature_type: trait
       name: Solar Crown
       level: 6
       effects:
         - effect: Allies within 2 squares gain an edge.
   `;
   // ...
   featureblock: { default: featureblockDefault, advancement: featureblockAdvancement },
   ```
   This is a `visual-harness/`-local constant (not `src/elements/featureblock/example.yaml`), so it doesn't touch the single-sourced authoring example.

2. **`draw-steel-elements/visual-harness/shoot.mjs`**: fix the fixture-name/filename disconnect and make the sweep fixture-aware, preserving 100% backward compatibility for every other element and every existing flag combination:
   - Keep `manifest.elements` as `{id, fixtures}[]` instead of collapsing to ids.
   - For each element, compute `fixtureNames`: if `--fixture=X` was passed, use `[X]` if `X` is in that element's fixture list, else fall back to `['default']` (mirrors `entry.ts`'s own `fixtures[fixtureName] ?? fixtures['default']` fallback — zero behavior change for any pre-existing invocation); otherwise use **all** of that element's fixture names.
   - Output name: `${fixtureName === 'default' ? id : `${id}-${fixtureName}`}--${comboName(c)}${suffix}` — so default-fixture output for all 32 elements is byte-for-byte unchanged, and `featureblock`'s new `advancement` fixture gets its own distinct 5 filenames.
   - No changes needed to `entry.ts`'s `mountFromParams`/`mountOne` — already generic over fixture name.

3. **Regenerate and verify**:
   ```bash
   devbox run -- bash -c "cd draw-steel-elements && rm -rf visual-harness/shots && npm run shots"
   ```
   Expected new files (5): `featureblock-advancement--legacy-dark.png`, `featureblock-advancement--legacy-light.png`, `featureblock-advancement--steel-dark.png`, `featureblock-advancement--steel-light.png`, `featureblock-advancement--steel-print.png`. **Total shot count: 164 → 169** (32×5 default combos + 4 galleries, unchanged, +5 for the new fixture; verify with `ls visual-harness/shots | wc -l`).
   Eyeball `featureblock-advancement--steel-dark.png` / `--steel-light.png`: two visible advancement bands ("Level 3 Advancement" over 2 features, "Level 6 Advancement" over 1), left-rail tinted `#9aa2a8`-family grey (no role mapped → `var(--dse-role-leader)` fallback), matching the CSS at `styles-source.css:4158` (`.dse-fb__band--adv { border-left-color: ... }`) and the sheen/hairline band at `~3883-3895` (`.dse-fb__adv-head`).

4. **Run jest**: `npx jest test/dom/visual-harness/fixtures.test.ts` — confirms the new `featureblock/advancement mounts with no error card` test (auto-generated by the existing loop) passes, with no test-file edits.

5. **Freeze check**:
   ```bash
   bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/workspace/draw-steel-elements/visual-harness/shots
   ```
   Expect `freeze OK (98/98 legacy+print PNGs byte-identical)` — unchanged, since the 3 new legacy/print files aren't in the baseline (§3). **Do this run to prove it, don't just assert it.**

6. **(Optional, §3)** widen the freeze set to also pin the 3 new legacy/print files: append 3 lines to `.superpowers/sdd/freeze-baseline.sha256`, bump the two "98" strings in `check-freeze.sh` to "101", re-run to confirm `101/101`.

### Task B — sidebar light-scheme shot (retains (c))

1. **`draw-steel-elements/visual-harness/obsidian-camera.mjs`**, step 3c block (~lines 681-777): move `await setPluginTheme(elSel, 'steel');` above a new `for (const bg of ['dark', 'light'])` loop; inside the loop, run the existing `setChromeBg(bg)` → `sleep(300)` → `clearNotices()` → rect/clip/emulated-viewport → `screenshot(...)` sequence unchanged except:
   - `outName = `initiative--obsidian-sidebar-steel-${bg}`` per iteration.
   - Recompute `rect`/`clip` fresh each iteration (already the pattern the file uses elsewhere).
   - Reset any `Emulation.setDeviceMetricsOverride` at the top of each iteration (idempotent clear) so light doesn't inherit a stale override from dark.
2. Bump `obsidian-camera.mjs`'s final count formula: `(runSidebarSpecial ? 1 : 0)` → `(runSidebarSpecial ? 2 : 0)` (line ~937).
3. **Regenerate and verify** (requires a display + system Obsidian, per README — local/manual, not CI):
   ```bash
   devbox run -- bash -c "cd draw-steel-elements && npm run obsidian-shots -- --element=sidebar-initiative"
   ```
   Expected new file: `initiative--obsidian-sidebar-steel-light.png` (alongside the existing `initiative--obsidian-sidebar-steel-dark.png`). **Obsidian-shots total: 131 → 132** (32 elements × 4 combos + `by-scc-kit` + `sidebar-hero` + 2× `sidebar-initiative`).
   Eyeball: the sidebar leaf should show the `--dse-bevel` box-shadow (not the `0 4px 12px` lift) in the light shot, confirming the `body.theme-light .dse-sidebar ...` override rule (`styles-source.css` §5) actually wins the specificity fight it's written to win.
4. This capture is manual/local — no CI gate exists for `obsidian-shots` today (matches existing convention: it's explicitly "not CI" per the file's own header comment); no freeze mechanism covers it either. Nothing further to wire up.

### Task C — out of scope, file separately
- Parity pair for `.dse-fb__adv-head`/`.dse-fb__band--adv` (§5): needs `plugin-capture.mjs` fixture-selection support, a new `urls.json` entry, two `selector-map.json` pairs, and a reviewed `npm run parity:site` baseline regen. Note in the new followup: the `.dse-fb__adv-head` "PLUGIN-ONLY, no site counterpart" comment in `styles-source.css` is factually wrong as of `steel-featureblock.css:210-217` and should be corrected alongside adding the pair.

### Critical Files for Implementation
- /home/scott/code/steelCompendium/workspace/draw-steel-elements/visual-harness/entry.ts
- /home/scott/code/steelCompendium/workspace/draw-steel-elements/visual-harness/shoot.mjs
- /home/scott/code/steelCompendium/workspace/draw-steel-elements/visual-harness/obsidian-camera.mjs
- /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh
- /home/scott/code/steelCompendium/workspace/.superpowers/sdd/freeze-baseline.sha256