# SC-146 — Statblock display settings: v2 site ↔ DSE plugin audit

**Phase 1 (audit only, no code changes).** Evidence: live-site screenshots
(`https://steelcompendium.io/v2/Browse/monster/lich/lich/`, driven with playwright-core +
Brave) and plugin screenshots (`draw-steel-elements/visual-harness`, Steel theme, light
background, `statblock` default fixture). Scripts + PNGs in this directory
(`sc146-site-shots*.cjs`, `sc146-plugin-shots.cjs`, `sc146-compose.py`, `shots/`).

Colour note (Scott is colourblind): nothing in this report depends on hue. Where a screenshot
is described, the distinguishing feature is always shape/position (boxed cell vs hairline row,
label-left vs label-below), never colour.

---

## 1. Headline finding — the ticket's example, confirmed and inverted

Scott: *"on the site, the 'Secondary stats' 'ledger' option is turning the primary stats into
a ledger."*

Verified on both surfaces. The behaviour he saw is the **plugin's**, and it is the exact
inverse of the site's:

| | Site (`data-sb-meta="ledger"`) | Plugin (`data-dse-sb-stats="ledger"`) |
|---|---|---|
| **Primary stats** (Size / Speed / Stamina / Stability / Free Strike) | unchanged — stays five boxed grid cells | **restyled into stacked label-left / value-right rows** |
| **Secondary stats** (Immunity / Weakness / Movement / With Captain) | **restyled into hairline label-left / value-right rows** | unchanged — stays boxed grid cells |

Evidence: `shots/cmp-01-secondary-stats-ledger.png`
(`shots/site-stats-01-meta-ledger.png` ↔ `shots/plugin-stats-01-sbstats-ledger.png`).

**Root cause** — the descriptor is labelled for one DOM region and its CSS targets another:

- `draw-steel-elements/src/prefs/catalog.ts:252-258` — `key: 'sbStats'`, `attr: 'sb-stats'`,
  `label: 'Secondary stats'`, options Grid / Ledger.
- `draw-steel-elements/styles-source.css:1996-2018` — every `[data-dse-sb-stats='ledger']`
  selector targets `.dse-sb__items` / `.dse-sb__item` / `.dse-sb__item-v` / `.dse-sb__item-l`.
- `draw-steel-elements/src/elements/statblock/view.ts:210-214` — `.dse-sb__items > .dse-sb__item`
  **is the primary stat row** (Size/Speed/Stamina/Stability/Free Strike). The view's own header
  comment (`view.ts:10-13`) says so.
- `draw-steel-elements/src/elements/statblock/view.ts:222-227` — the actual secondary stats are
  `.dse-sb__grid > .dse-sb__kv` (Immunity / Weakness / Movement / With Captain). **No preference
  touches them.**

The site's equivalents, for reference:
- `v2/docs/stylesheets/steel-statblock.css:149-153` — `.sb__defenses > .sb__stat`, the primary
  row. It is **hard-wired**; no `data-sb-*` attribute selects it. The site never offers a
  primary-stats layout choice at all.
- `v2/docs/stylesheets/steel-statblock.css:183-195` — `[data-sb-meta=…] .sb__meta .sb__field`,
  the secondary block. Three modes: `grid`, `gridc`, `ledger`.

### 1b. Second, independent defect in the same setting

Even taken as "primary stats ledger", the plugin's ledger presentation is broken under the
**Steel** theme (the default — `src/framework/seams/theme.ts:48`
`DEFAULT_THEME_ID = 'steel'`). `styles-source.css:5811-5824` unconditionally boxes
`.dse-sb__item` (1px border + radius + sunken background). The ledger arm at
`styles-source.css:2003-2010` adds `border-bottom: 1px solid var(--dse-rule)` but never resets
that box, so "ledger" renders as five full-width **boxed panels with a doubled bottom edge**,
not the hairline rows the mode is named for. Visible in
`shots/plugin-stats-01-sbstats-ledger.png` — compare the site's genuinely hairline
`shots/site-stats-01-meta-ledger.png`.

---

## 2. Enumeration — site side

Source of truth: `v2/docs/javascripts/settings-panel.js` (the drawer markup + bindings) and
`v2/docs/javascripts/settings-core.js` (statblock-preview defaults). Nothing is hidden from the
UI on the statblock side; the two *hidden* drawer controls (`siteTheme`, `cardStyle`,
`settings-panel.js:237-239,270-272`) are unrelated to statblocks and are intentionally not
rendered.

**Attribute contract:** `data-sb-*` and `data-fb-*` on `<html>`; `data-aug-*` on `<body>`
(absent ≡ "on"); `data-sbprev-*` on `<html>` and on the `.sb-cards` grid.
Defaults: `settings-panel.js:29-33`. Presets: `settings-panel.js:35-39`.

| # | Drawer label | Attribute | Values (default first) | What it actually does |
|---|---|---|---|---|
| S1 | Preset | — (bundle) | Steel Card / Sourcebook / Index Card / Custom | Writes a bundle of S2–S9 at once; "Custom" is derived, never selectable (`settings-panel.js:707-713`) |
| S2 | Multi-column layout | `data-sb-wide` | off / on | `on` lifts `.sb-wrap { max-width }` entirely and flows `.sb__features` through CSS **`columns: 28rem`** with `break-inside: avoid` (`steel-statblock.css:597-604`) |
| S3 | Secondary stats | `data-sb-meta` | grid / gridc / ledger | Layout of the Immunity/Weakness/Movement/Captain block only. `grid` = framed cell, label top-left, value below. `gridc` = framed cell, value over label, centred. `ledger` = hairline row, label left / value right (`steel-statblock.css:163-195`) |
| S4 | Characteristics | `data-sb-charline` | two / one | `two` = value over label; `one` = box, label, value on a single flex line (`steel-statblock.css:214-235`) |
| S5 | Boxed first letter | `data-sb-charbox` | off / on / onword | Shows the boxed M A R I P letter. **Quirk:** at `charline=two`, `on` and `onword` render identically — `onword` only differs at `charline=one`, where it keeps the word (`steel-statblock.css:214-235`) |
| S6 | Feature style | `data-sb-featstyle` | card / flat | `card` = own frame with action-coloured left spine; `flat` = frameless dense run **with ◆ diamond separators** between features (`steel-statblock.css:295-345`) |
| S7 | Keyword display | `data-sb-kwusage` | crest / text / grid / ledger | Layout of the keyword + action-type band. `crest` = individual boxed chips + a boxed usage pill; `text` = comma-joined small-caps inline, usage as plain right-aligned text; `grid`/`ledger` = 2-col framed cells / hairline rows (`steel-statblock.css:347-379`) |
| S8 | Distance + target | `data-sb-disttarget` | text / grid / ledger | Same three-way cell vocabulary applied to the Distance/Target rail (`steel-statblock.css:383-389`) |
| S9 | Villain actions | `data-sb-villain` | banded / inline | `banded` (default) wraps villain actions in a collapsible `.sb__band--villain` with a crest head + chevron; `inline` strips the band and runs them as ordinary siblings (`steel-statblock.css:474-477`) |
| S10 | Link conditions & keywords | `body[data-aug-links]` | on / off | `off` de-links `.sb-term` (`steel-statblock.css:486`) |
| S11 | Sticky mini-header | `body[data-aug-sticky]` | on / off | `off` hides `.sb__sticky` (`steel-statblock.css:524`) |
| S12 | ↳ include secondary stats | `data-sb-stickymeta` | on / off | `off` hides the sticky's second row (`steel-statblock.css:577`) |
| S13 | Index previews · Show stats | `data-sbprev-stats` | on / off | Shows/hides `.sb__defenses` on preview cards (`steel-statblock.css:779-783`) |
| S14 | Index previews · Show secondary stats | `data-sbprev-meta` | off / on | Shows/hides `.sb__meta` on preview cards |
| S15 | Index previews · Show characteristics | `data-sbprev-chars` | off / on | Shows/hides `.sb__chars` on preview cards |
| S16 | Index previews · Show feature previews | `data-sbprev-feats` | off / on | Shows/hides `.sb-prev__feats` on preview cards |
| S17 | Featureblocks · Feature style | `data-fb-featstyle` | card / flat | Same card-vs-flat vocabulary for featureblock options (`steel-featureblock.css:159-185`) |
| S18 | Featureblocks · Stat line | `data-fb-stats` | grid / ledger | Loose header stats (EV / Stamina / Size): auto-fit framed cells vs hairline rows (`steel-featureblock.css:100-117`) |
| S19 | Reading · Text size | `--sc-content-scale` | 0.6–1.4, default 1 | Scales body text/headings/tables |
| S20 | Reading · Card size | `--sc-card-scale` | 0.8–1.2, default 1 | Scales cards and their contents |
| S21 | Reading · Compact mode | `html[data-compact]` | false / true | Page-wide typographic tightening (`extra.css:411-473`) — **not** statblock-scoped |
| S22 | Reading · Hide drop caps | `html[data-no-dropcap]` | absent / true | Suppresses the lead trait-card drop cap (`steel-traits.css:160-162`) |
| S23 | Page width (Full width + Max width) | `--md-max_width` | 44–300em, default 80em / full | Page container width; indirectly the statblock's available width |

**23 site-side settings audited** (18 of them statblock/featureblock structural: S1–S18).

## 3. Enumeration — plugin side

Source of truth: `draw-steel-elements/src/prefs/catalog.ts` (the descriptor list is the single
source; `src/views/SettingsTab.ts` builds the nav model from it and
`src/views/settingsDeclarative.ts` is a pure mapper to Obsidian 1.13
`getSettingDefinitions()` — SC-131 changed the *rendering*, not the inventory).

"Statblock display" group (`catalog.ts:230-258`, plus the derived preset row at
`SettingsTab.ts:248-254` / `:332-350`):

| # | Row | Key / attr | Values (default first) | What it actually does |
|---|---|---|---|---|
| P1 | Preset | derived, not stored | Steel card / Sourcebook / Index card / Custom | Writes P2–P5 as a bundle (`catalog.ts:329-352`) |
| P2 | Feature style | `sbFeatureStyle` / `data-dse-sb-featstyle` | card / flat | `flat` removes the option frame, background and hover, squares the spine bar (`styles-source.css:1976-1984`, `3639-3670`). **No ◆ separator** |
| P3 | Density | `sbDensity` / `data-dse-density` | comfortable / compact | Halves the card padding, drops the big stat numeral to `--font-ui-large`, tightens the chars row (`styles-source.css:1958-1974`) |
| P4 | Feature columns | `sbColumns` / `data-dse-sb-columns` | single / wide | `wide` lays the top-level feature list out as `grid: repeat(auto-fill, minmax(21rem,1fr))` (`styles-source.css:1986-1994`) |
| P5 | Secondary stats | `sbStats` / `data-dse-sb-stats` | grid / ledger | **Mislabelled** — see §1. Restyles the *primary* stat row |

Statblock-affecting rows outside that group: `textScale` / `cardScale` (Typography,
`catalog.ts:205-228`) and `printPreview` (Appearance).

**7 plugin-side statblock-affecting settings audited** (5 in Statblock display + 2 scales).

---

## 4. The matrix

| Site setting | Site options | Plugin setting | Plugin options | Verdict | Divergence |
|---|---|---|---|---|---|
| S1 Preset | steel / sourcebook / index | P1 Preset | steel / sourcebook / index | **BROKEN** | Bundle contents diverge — see §4a |
| S3 Secondary stats | grid / **gridc** / ledger | P5 Secondary stats | grid / ledger | **BROKEN** | Targets the primary stat row instead of the secondary block; `gridc` missing; ledger visually broken under Steel (§1b) |
| S6 Feature style | card / flat | P2 Feature style | card / flat | **MATCH** (minor gap) | Site's `flat` inserts ◆ diamond separators between features (`steel-statblock.css:315-345`); plugin's `flat` inserts none |
| S2 Multi-column layout | off / on | P4 Feature columns | single / wide | **MATCH** (partial) | Different algorithm: site uses CSS `columns` (packs greedily) + lifts the page max-width; plugin uses CSS `grid` (rows align), so short cards leave ragged vertical gaps — visible in `shots/plugin-full-01-columns-wide.png` |
| S4 Characteristics (two / one) | 2 | — | — | **MISSING** | Blocked on DOM: the plugin renders each characteristic as one merged text node `"Might +2"` (`view.ts:252-255`); the site has separate `.sb__char-v` / `-l` / `-box`. A split was tried and reverted for LEGACY-FREEZE byte parity (`styles-source.css:5887-5892`) |
| S5 Boxed first letter (off / on / onword) | 3 | — | — | **MISSING** | Same DOM blocker as S4 (needs a `.dse-sb__char-box`) |
| S7 Keyword display (crest / text / grid / ledger) | 4 | — | — | **MISSING** | DOM hook exists: `.dse-feature__meta-chips` (`renderFeature.ts:309-362`). Plugin ships one fixed presentation |
| S8 Distance + target (text / grid / ledger) | 3 | — | — | **MISSING** | DOM hook exists: `.dse-feature__meta-rail` (`renderFeature.ts:363-364`). Plugin ships the `grid` look only |
| S9 Villain actions (banded / inline) | 2 | — | — | **MISSING** | Plugin has no band concept; it only ever renders the site's `inline` presentation. Already tracked as FOLLOWUPS #54 and named in SC-123 |
| S10 Link conditions & keywords | on / off | — | — | **MISSING (judgment)** | Site-specific augmentation; the plugin's analogue would be SCC/compendium link resolution |
| S11 Sticky mini-header | on / off | — | — | **MISSING (judgment)** | No sticky mini-header in the plugin at all |
| S12 ↳ include secondary stats | on / off | — | — | **MISSING (judgment)** | Dependent on S11 |
| S17 Featureblock feature style | card / flat | — | — | **MISSING** | The statblock's `flat` mode explicitly refuses to reach into a nested `.dse-fb` precisely because there is no fb twin (`styles-source.css:3630-3638`) |
| S18 Featureblock stat line | grid / ledger | — | — | **MISSING + DEAD CSS** | See §4b |
| S19 Text size | slider | `textScale` | slider | **MATCH** | Ported in SC-112, same range/step |
| S20 Card size | slider | `cardScale` | slider | **MATCH** | Ported in SC-112, same range/step |
| S21 Compact mode (page-wide) | on / off | P3 Density (statblock-only) | comfortable / compact | **PLUGIN-ONLY / divergent scope** | Not a port: the site's compact retypesets the whole page; the plugin's density tightens one statblock. No site setting does what P3 does, and no plugin setting does what S21 does |
| S13–S16 Index previews ×4 | on / off | — | — | **N/A** | The plugin has no index/preview-card surface |
| S22 Hide drop caps | on / off | — | — | **N/A** | The plugin renders no drop caps |
| S23 Page width | slider + full | — | — | **N/A** | Obsidian's own "Readable line length" owns this |

**Counts:** MATCH 4 · BROKEN 2 · MISSING 10 · PLUGIN-ONLY 1 · N/A 6.

### 4a. Preset bundle divergence (detail)

| Preset | Site bundle (`settings-panel.js:35-39`) | Plugin bundle (`catalog.ts:329-333`) |
|---|---|---|
| Steel card | kwusage `crest`, featstyle `card`, disttarget `grid`, meta `grid`, charline `two`, charbox `off`, villain `banded`, wide `off` | featstyle `card`, density `comfortable`, columns `single`, stats `grid` |
| Sourcebook | kwusage `text`, featstyle **`flat`**, disttarget `text`, meta `ledger`, charline `one`, charbox `on`, villain `inline`, wide `off` | featstyle **`card`**, density `comfortable`, columns `single`, stats `ledger` |
| Index card | kwusage `grid`, featstyle `flat`, disttarget `grid`, meta `gridc`, charline `two`, charbox `onword`, villain `banded`, **wide `off`** | featstyle `flat`, density **`compact`**, columns **`wide`**, stats `grid` |

Two concrete mismatches beyond "the plugin bundles fewer members":

1. **Sourcebook** — the site's book layout is a *flat* feature list; the plugin's Sourcebook keeps
   Cards. A user switching presets in the plugin gets a materially different look from the site's
   preset of the same name. (`shots/cmp-02-preset-sourcebook.png`)
2. **Index card** — the plugin sets `columns: wide`, which the site's Index preset explicitly does
   **not** (`wide: "off"`; multi-column is a separate, non-preset toggle on the site,
   `settings-panel.js:711` "preset bundles never touch stickymeta / augs" — and `wide` is pinned
   `off` in all three bundles). The plugin also folds `density: compact` in, which has no preset
   member on the site at all. (`shots/cmp-03-preset-index.png`)

### 4b. Dead code — `data-dse-fb-stats="ledger"` is unreachable

- `draw-steel-elements/src/elements/featureblock/view.ts:72` — `card.setAttribute('data-dse-fb-stats', 'grid')`,
  a hard-coded literal.
- `draw-steel-elements/styles-source.css:2069-2072` — a `[data-dse-fb-stats='ledger']` arm exists.
- There is **no `fbStats` descriptor** in `catalog.ts`, and `prefOverrides.ts` only accepts
  descriptor keys, so no user action and no per-block `prefs:` map can ever produce that value.

The CSS comment at `styles-source.css:2052-2054` states the intent outright: *"ledger is the D4
pref hook"* — the hook was staged and the preference was never added. It has been dead since D4.

### 4c. Nothing else is dead or miswired

Every `data-dse-*` attribute appearing in `styles-source.css` (`act`, `density`, `element`,
`error-stage`, `fb-stats`, `portraits`, `print`, `readonly`, `reduce-motion`, `role`,
`roll-result`, `sb-columns`, `sb-featstyle`, `sb-stats`, `theme`) has a live writer except
`fb-stats`'s `ledger` value. All four Statblock-display descriptors reflect and are consumed;
none is a no-op. The single miswiring is `sb-stats` → wrong DOM region (§1).

---

## 5. Recommended fix plan

### (a) Clear bugs — fix outright, no decision needed

1. **`sbStats` targets the wrong DOM region.** Re-point the `[data-dse-sb-stats]` rules from
   `.dse-sb__items`/`.dse-sb__item` to `.dse-sb__grid`/`.dse-sb__kv` so "Secondary stats"
   restyles the Immunity/Weakness/Movement/Captain block, matching the site.
   *Files:* `styles-source.css:1996-2018`; guards in
   `test/dom/framework/pref-reflection.test.ts:56`, `test/dom/elements/statblock.test.ts`.
2. **`ledger` keeps the boxed cell under Steel.** Add a Steel-scoped reset so the ledger mode
   drops the border/radius/background on whichever cell it now targets, giving a real hairline
   row. *File:* `styles-source.css:5811-5824` (add a `[data-dse-sb-stats='ledger']` arm at equal
   or higher specificity).
3. **Add the missing `gridc` option** ("Grid (centered)") so Secondary stats offers the site's
   three modes, not two. *Files:* `catalog.ts:252-258` + new CSS arm.
4. **Fix the Sourcebook preset** to `sbFeatureStyle: 'flat'`, matching the site's bundle.
   *File:* `catalog.ts:331`.
5. **Fix the Index preset** to `sbColumns: 'single'` (the site pins `wide: off` in every preset;
   multi-column is a standalone toggle). *File:* `catalog.ts:332`. Whether `density: 'compact'`
   stays in the bundle is a judgment call — see (c3).
6. **Remove or wire the dead `data-dse-fb-stats="ledger"` CSS.** Either delete
   `styles-source.css:2069-2072` or ship the `fbStats` descriptor that makes it reachable (the
   latter is item (b6)). *Files:* `styles-source.css:2069-2072`,
   `src/elements/featureblock/view.ts:72`.

### (b) Missing settings — additive ports (this is SC-123's declared scope; see §6)

7. Keyword display (`kwusage`, 4 modes) — DOM hook already present.
8. Distance + target (`disttarget`, 3 modes) — DOM hook already present.
9. Villain actions banded/inline — needs new grouping DOM; FOLLOWUPS #54 has the design.
10. Characteristics two/one — needs the `.dse-sb__char` label/value DOM split first.
11. Boxed first letter off/on/onword — needs the same DOM split plus a box element.
12. Featureblock feature style card/flat.
13. Featureblock stat line grid/ledger (makes 4b's dead CSS live).
14. Sticky mini-header (+ include secondary stats) — largest of the set; genuinely new behaviour.
15. Link conditions & keywords — only meaningful once the plugin's link augmentation is a thing
    the user can turn off.

### (c) Judgment calls for Scott

16. **Rename or re-scope `sbStats`?** Fixing (a1) makes "Secondary stats" honest, but it also
    *removes* the current (accidental) ability to ledger the primary stat row. The site never
    offers that. My recommendation: follow the site — re-point it, and do not add a primary-stats
    layout setting. If he liked the primary-row ledger, it should become its own, correctly-named
    setting rather than stay mislabelled.
17. **The ◆ diamond separator in `flat` feature style.** The site draws one; the plugin doesn't.
    Recommend adding it — `flat` without a separator reads as an unstructured run.
18. **Index preset's `density: compact`.** The site has no density member in any preset. Keeping
    it makes the plugin's Index card denser than the site's. Recommend keeping `compact`
    (it is the spirit of an index card and the plugin's density setting has no site twin anyway)
    but dropping `wide` per (a5) — i.e. deliberate divergence with a comment, not an accident.
19. **`sbColumns` packing algorithm.** Recommend switching the plugin from CSS `grid` to CSS
    `columns` to match the site's packing and remove the ragged gaps.
20. **Scope split between SC-146 and SC-123.** Recommend SC-146 carries (a) only — the six clear
    bugs — and SC-123 carries (b), the ten additive ports, which is exactly the inventory SC-123
    was opened for.

---

## 6. Relationship to SC-123

SC-123 ("Port the v2 site's layout/structure display settings to the plugin — 18-setting parity
inventory", Todo, Medium, unassigned to the 7.0.0 project) already owns the *missing* half of this
audit and its inventory matches mine almost line for line. This audit adds what SC-123 did not
have: that four of the settings the plugin **already ships** are wrong (the mislabelled/miswired
`sbStats`, its broken Steel ledger presentation, and both non-default preset bundles), plus one
dead CSS arm. Those are bugs in shipped behaviour, not a parity backlog, which is why I recommend
SC-146 keep them and hand the additive ports back to SC-123.

## 7. Evidence index (`shots/`)

Composites (side-by-side, captioned):
`cmp-00-defaults.png`, `cmp-01-secondary-stats-ledger.png`, `cmp-02-preset-sourcebook.png`,
`cmp-03-preset-index.png`, `cmp-04-characteristics.png`, `cmp-05-villain.png`,
`cmp-06-keyword-display.png`.

Site singles: `site-00-default.png` (full card), `site-stats-0*.png` (head→characteristics zone
per setting), `site-feat-0*.png` (one ability card per setting), `site-villain-0*.png`,
`site-13-wide-on.png`, `site-14/15-preset-*.png`.

Plugin singles: `plugin-full-00-default.png`, `plugin-full-01-columns-wide.png`,
`plugin-full-02-sbstats-ledger.png`, `plugin-stats-0*.png`, `plugin-feat-0*.png`.
