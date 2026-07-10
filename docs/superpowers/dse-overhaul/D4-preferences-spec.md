# D4 — Preferences System Spec

**Program:** DSE Overhaul (see `README.md` in this directory) — Wave 2, planning only.
**Author:** design spec, 2026-07-01.
**Status:** Draft for Scott's review. **Zero code changes** — this is a design contract.
**Depends on:** F1 (Element Framework v2) — imports the interface names in F1 §3.6 verbatim.
**Owns:** the DSE **preference catalog** and the **settings-tab UX**.
**Consumes:** F1 `PreferenceStore` (`get`/`set`/`subscribe`/`reflect`/`describe`) and the
`data-dse-<attr>` reflection contract. **Provides:** the `data-dse-*` attribute vocabulary
D2 styles against; the `"theme"` pref row D3 fills; the roll-behavior pref keys D5 reads;
the web-fallback toggle F2 reads.

Repos/files referenced (absolute):

| What | Path |
|---|---|
| F1 seam (owned upstream) | `.../dse-overhaul/F1-element-framework-v2-spec.md` §3.6 |
| Workspace pref model to mirror | `/home/scott/code/steelCompendium/workspace/DESIGN.md` → "The user-preference system" |
| v2 statblock pref vocabulary | `/home/scott/code/steelCompendium/workspace/reference/design-system/handoff/redesign/statblocks/README.md` |
| v2 live-apply reference impl | `/home/scott/code/steelCompendium/workspace/v2/docs/javascripts/settings-panel.js` + `settings-core.js` |
| Current settings tab (rewritten by D4/F2) | `.../draw-steel-elements/src/views/SettingsTab.ts` |
| Current settings model | `.../draw-steel-elements/src/model/Settings.ts` |
| Per-element collapse keys | `.../draw-steel-elements/src/model/ComponentWrapper.ts` |

> **Guardrails honored:** vanilla TS, no new deps; F1 interface names exact; **attribute-driven
> reflow — no element re-render on pref change**; **per-block YAML overrides win over global
> prefs**. D4 touches only its own settings section + the pref catalog; it never alters the
> pipeline or seam signatures (F1 §7).

---

## 1. Preference model

DSE prefs are **descriptor-driven, attribute-reflected, and CSS-reflowed** — the exact
pattern the v2 site uses (`DESIGN.md` → "The user-preference system": every preference is a
`data-*` attribute, CSS reflows one shared DOM, no re-render). The one structural difference
from the website: the website stamps `<html>`; **DSE stamps each element root**
(`prefs.reflect(rootEl, owner)` per F1 §3.6), because a vault has many element instances
across many notes and popout windows. Per-element scoping is what makes per-block overrides
(§1.3) possible at all.

### 1.1 The two consumption paths

A `PrefDescriptor` (F1 §3.6) has an **optional** `attr`. That optionality splits every pref
into one of two kinds:

| Kind | Has `attr`? | How it takes effect | Reflected by | Examples |
|---|---|---|---|---|
| **Presentation pref** | yes | `reflect()` stamps `data-dse-<attr>="<value>"` on every element root; **CSS reflows**, no re-render | F1 `PreferenceStore.reflect` (pipeline calls it on every root) | `cardStyle`, `sbDensity`, all `sb*` |
| **Behavioral pref** | no | element/service reads `prefs.get(key)` at parse/mount/resolve time | the consumer (element `parse`, D5 roller, F2 resolver) | `collapsibleDefault`, `rollerEngine`, `webLinkFallback` |

Presentation prefs are the interesting case and the whole reason for the attribute contract:
changing `sbDensity` from `cozy` to `compact` **re-stamps `data-dse-sb-density` on every
mounted statblock root and CSS restyles them in place** — no block re-parse, no
`container.empty()`, no note write. Behavioral prefs can't be pure CSS (they change what DOM
is built or what a click does), so they're read imperatively.

`theme` is a **special presentation pref**: it is a pref key (F1 already ships it in
`DsePrefs`), but its attribute (`data-dse-theme`) is stamped by **`ThemeService.apply`**
(F1 §3.5, owned by D3), not by `PreferenceStore.reflect`. D4 therefore declares the `theme`
descriptor **without** an `attr` (so the two seams never double-stamp the same attribute) and
renders its settings row; D3 owns the value space and the reflection. See §6.

### 1.2 Reflection & the "current for owner's lifetime" guarantee

Per F1 §2.4 step 4, the pipeline applies pref reflection to the root **before `onMount`
runs**, so `data-dse-*` attributes are present at first paint. `reflect(root, owner)` also
**subscribes**: when any presentation pref changes, it re-stamps that attr on every live
root, for the lifetime of `owner` (auto-unsubscribed on view unload). This is what delivers
live settings-tab apply with zero re-render — identical to `settings-panel.js`'s
`applyX()` → `documentElement.setAttribute(...)`, one level down (element root instead of
`<html>`).

### 1.3 Global-vs-per-block precedence (per-block wins)

Three layers, lowest to highest:

```
  descriptor.default        ← the pref's built-in default (§2)
        ▼ overridden by
  global pref (saveData)     ← user's setting; reflected onto every root as data-dse-<attr>
        ▼ overridden by
  per-block YAML override    ← a `prefs:` map inside THIS ds-* block; wins for THIS root only
```

**Per-block override syntax.** Any `ds-*` block may carry a reserved `prefs:` map whose keys
are pref keys (validated against the registered descriptors):

````markdown
```ds-sb
prefs:
  sbDensity: compact
  sbColumns: wide
statblock:
  name: Goblin Stinker
  ...
```
````

The reserved `prefs:` key is lifted out by the element's `parse()` into an
`overrides: Partial<DsePrefs>` bag kept **off** the semantic model (so it never touches
serialize / round-trip). At mount, only override keys that map to a **presentation** attr are
applied to the root (see §1.4); behavioral overrides (e.g. `collapsibleDefault`) are read by
the element the same way it reads the global default. Unknown/typo keys surface a
non-fatal warning via the error-card channel (F1 §3.8) — the block still renders.

**Behavioral precedence, worked example (`collapsible`).** Today `ComponentWrapper` hard-codes
`collapsible ?? true`, `collapse_default ?? false`. Under D4 the fallback becomes the global
pref:

```ts
// element parse(), post-D4
collapsible     = data.collapsible     ?? cx.prefs.get("collapsibleDefault");  // default true
collapse_default = data.collapse_default ?? cx.prefs.get("collapseDefault");    // default false
```

So the existing top-level `collapsible:` / `collapse_default:` block keys **already are** the
per-block override for those two prefs — precedence is `block key > global pref > default`,
consistent with the `prefs:` map for presentation prefs. No YAML contract change; the block
keys keep working, they just gain a user-configurable default.

### 1.4 Applying a per-block presentation override without losing to a live global change

A per-block override sets `data-dse-<attr>` directly on that block's root. But
`reflect()`'s live subscription re-stamps that same attr whenever the **global** pref
changes — which would clobber the override. D4 pins overrides so they always win:

1. The pipeline calls `prefs.reflect(root, view)` **first** (F1 §2.4 step 4) → subscription A.
2. In `onMount`, for each presentation override key, the view sets `data-dse-<attr>` and
   registers `prefs.subscribe(key, this, () => reapply)` → subscription B, registered **after**
   A. On any change to that key, A fires (stamps global) then B fires (re-stamps the pinned
   override) → **override wins**, deterministically, using only F1 primitives (`subscribe`
   with `owner` auto-unsub).

This relies on listeners firing in registration order. To make it order-**independent**
rather than order-dependent, D4 proposes a one-line courtesy on F1's `reflect` — an optional
`pin?: ReadonlySet<keyof DsePrefs>` it skips — see **OD-D4-3**. Default plan needs no F1
change.

---

## 2. The preference catalog

**~15 stored preferences in 5 groups.** `attr` shown ⇒ presentation pref (reflected as
`data-dse-<attr>`); blank `attr` ⇒ behavioral pref (read via `prefs.get`). "Owner" = who owns
the pref's *value space / consumption*; **D4 owns the catalog, storage, and settings UI for
all of them**.

| Key | Type / options | Default | `data-dse-` attr | Affected elements | Owner |
|---|---|---|---|---|---|
| **Appearance** |
| `theme` | enum `steel` \| `legacy` (+ D3 members) | `steel` | *(via `ThemeService`, not reflect)* | all | **D3** |
| `cardStyle` | enum `full` \| `compact` | `full` | `card-style` | feature/ability cards, featureblock, statblock sub-features | D4 → **D2** |
| `reduceMotion` | boolean | `false` | `reduce-motion` | all (suppresses hover-lift/transitions) | D4 → **D2** |
| **Statblock display** (Scott's priority — §3) |
| `sbFeatureStyle` | enum `card` \| `flat` | `card` | `sb-featstyle` | statblock, featureblock | D4 → **D2** |
| `sbDensity` | enum `cozy` \| `compact` | `cozy` | `sb-density` | statblock (padding/leading) | D4 → **D2** |
| `sbColumns` | enum `single` \| `wide` | `single` | `sb-columns` | statblock (side-by-side features on wide panes) | D4 → **D2** |
| `sbStats` | enum `grid` \| `ledger` | `grid` | `sb-stats` | statblock secondary-stats (side-by-side grid vs stacked ledger) | D4 → **D2** |
| `sbChars` | enum `two` \| `one` | `two` | `sb-chars` | statblock characteristics (two lines vs one) | D4 → **D2** |
| `sbVillain` | enum `banded` \| `inline` | `banded` | `sb-villain` | statblock villain actions (collapsible band vs flowed) | D4 → **D2** |
| `sbStickyMeta` | boolean | `true` | `sb-stickymeta` | statblock (secondary stats pinned in a sticky header) | D4 → **D2** |
| **Element defaults** |
| `collapsibleDefault` | boolean | `true` | *(behavioral)* | any `ComponentWrapper` element (skills, stamina, statblock…) | D4 |
| `collapseDefault` | boolean | `false` | *(behavioral)* | same | D4 |
| **Rolling** (values/consumption owned by D5; D4 persists + surfaces) |
| `rollerEngine` | enum `native` \| `dice-roller` | `native` | *(behavioral)* | ability/power-roll cards | D4 → **D5** |
| `rollClickToRoll` | boolean | `true` | *(behavioral)* | ability/power-roll cards | D4 → **D5** |
| **References** (consumption owned by F2) |
| `webLinkFallback` | boolean | `true` | *(behavioral)* | SCC link resolution (F2) | D4 → **F2** |

Notes:

- **Presentation prefs = 9** (`cardStyle`, `reduceMotion`, 7×`sb*`) → these are the
  `data-dse-*` vocabulary D2 styles against. **Behavioral prefs = 5** (`collapsibleDefault`,
  `collapseDefault`, `rollerEngine`, `rollClickToRoll`, `webLinkFallback`). Plus `theme`
  (special). Total ≈ 15.
- **Booleans reflect as `="true"`/`="false"`** (F1 `reflect` stamps `data-dse-<attr>="<value>"`);
  CSS matches `[data-dse-reduce-motion="true"]`. (Presence-mode — stamp only when `true`, à la
  v2 `data-no-dropcap` — is a minor variant, OD-D4-7.) `reduceMotion` is an **explicit override
  on top of** the OS `prefers-reduced-motion` media query, which D2's CSS honors regardless.
- **Sparse persistence:** only keys whose value differs from the descriptor default are written
  to disk (§5); `get(key)` falls back to `descriptor.default`. New prefs and changed defaults
  in later versions therefore apply automatically to users who never touched them (mirrors the
  v2 `mkdocs:fontPrefs` store, which persists only non-defaults). See OD-D4-4.
- **D5/F2 rows render only when their consumer is present** in the build (feature-gated by
  `ui.hidden`), so D4 can ship its section before D5/F2 land without dangling controls.

### 2.1 Module augmentation (how D4 extends `DsePrefs`)

D4 augments F1's `DsePrefs` (F1 §3.6 explicitly reserves this) — one declaration, colocated
with the catalog module (`framework/seams/prefs.dse-catalog.ts` or `src/prefs/catalog.ts`):

```ts
// D4 — augments the F1 interface; F1 already declares `theme`.
declare module "../framework/seams/prefs" {
  interface DsePrefs {
    cardStyle: "full" | "compact";
    reduceMotion: boolean;
    sbFeatureStyle: "card" | "flat";
    sbDensity: "cozy" | "compact";
    sbColumns: "single" | "wide";
    sbStats: "grid" | "ledger";
    sbChars: "two" | "one";
    sbVillain: "banded" | "inline";
    sbStickyMeta: boolean;
    collapsibleDefault: boolean;
    collapseDefault: boolean;
    rollerEngine: "native" | "dice-roller";
    rollClickToRoll: boolean;
    webLinkFallback: boolean;
  }
}
```

The whole augmented `DsePrefs` is now the type for `get`/`set`/`subscribe`/`reflect`, so every
consumer is fully typed with zero casts.

### 2.2 Descriptor registration

D4 registers the catalog once at `onload` via F1's `PreferenceStore.describe` (each descriptor
carries `default`, optional `attr`, and the `ui` metadata D4 finalizes in §4):

```ts
prefs.describe([
  { key: "theme",        default: "steel", ui: { group: "Appearance", label: "Theme",
      control: "dropdown", optionsFrom: "theme" } },            // no attr — ThemeService reflects
  { key: "cardStyle",    default: "full",  attr: "card-style",
      ui: { group: "Appearance", label: "Card style", control: "dropdown",
            options: [["full","Full"],["compact","Compact"]] } },
  { key: "reduceMotion", default: false,   attr: "reduce-motion",
      ui: { group: "Appearance", label: "Reduce motion", control: "toggle" } },

  { key: "sbFeatureStyle", default: "card", attr: "sb-featstyle",
      ui: { group: "Statblock display", inPreset: true, label: "Feature style",
            control: "dropdown", options: [["card","Cards"],["flat","Flat list"]] } },
  { key: "sbDensity", default: "cozy", attr: "sb-density",
      ui: { group: "Statblock display", inPreset: true, label: "Density",
            control: "dropdown", options: [["cozy","Cozy"],["compact","Compact"]] } },
  { key: "sbColumns", default: "single", attr: "sb-columns",
      ui: { group: "Statblock display", inPreset: true, label: "Feature columns",
            control: "dropdown", options: [["single","Single"],["wide","Side-by-side (wide)"]] } },
  { key: "sbStats", default: "grid", attr: "sb-stats",
      ui: { group: "Statblock display", inPreset: true, label: "Secondary stats",
            control: "dropdown", options: [["grid","Grid"],["ledger","Ledger"]] } },
  { key: "sbChars", default: "two", attr: "sb-chars",
      ui: { group: "Statblock display", inPreset: true, label: "Characteristics",
            control: "dropdown", options: [["two","Two lines"],["one","One line"]] } },
  { key: "sbVillain", default: "banded", attr: "sb-villain",
      ui: { group: "Statblock display", inPreset: true, label: "Villain actions",
            control: "dropdown", options: [["banded","Banded"],["inline","Inline"]] } },
  { key: "sbStickyMeta", default: true, attr: "sb-stickymeta",
      ui: { group: "Statblock display", inPreset: false, label: "Sticky secondary stats",
            control: "toggle" } },                              // web-extra, not in the preset bundle

  { key: "collapsibleDefault", default: true,  ui: { group: "Element defaults",
      label: "Collapsible by default", control: "toggle",
      help: "New skills/stamina/statblock blocks are collapsible unless the block sets `collapsible:`." } },
  { key: "collapseDefault",    default: false, ui: { group: "Element defaults",
      label: "Start collapsed", control: "toggle" } },

  { key: "rollerEngine",    default: "native", ui: { group: "Rolling", ownedBy: "D5",
      label: "Roller", control: "dropdown",
      options: [["native","Draw Steel native"],["dice-roller","Dice Roller plugin"]] } },
  { key: "rollClickToRoll", default: true,     ui: { group: "Rolling", ownedBy: "D5",
      label: "Click ability to roll", control: "toggle" } },

  { key: "webLinkFallback", default: true, ui: { group: "References", ownedBy: "F2",
      label: "Fall back to steelcompendium.io links", control: "toggle",
      help: "When an SCC link isn't found in your vault, open it on the website (on click only)." } },
]);
```

---

## 3. Statblock display preferences (called out — Scott's priority)

Scott explicitly wants **statblock display options — density, side-by-side, etc.** The
statblock group is the heart of D4 and is designed to **feel like the v2 website's statblock
preferences** so a user who tunes one recognizes the other. The website's controversy-born
principle carries over verbatim (`DESIGN.md`): *design preferences change the layout
wholesale, never per-page — every instance of a layout puts the same field in the same place.*

### 3.1 Vocabulary mirrors the website

The seven `sb*` attrs are the DSE-scoped analogues of the site's `data-sb-*` family
(statblocks `README.md`). Naming is `data-dse-sb-<piece>` (prefixed `dse-` per the F1
`data-dse-*` contract, and namespaced so it can't collide with the site's `<html>` attrs if a
vault ever embeds site HTML):

| DSE pref → attr | Website analogue | What it does |
|---|---|---|
| `sbFeatureStyle` → `data-dse-sb-featstyle` | `data-sb-featstyle` | ability/trait rendering: framed **cards** vs **flat** list |
| `sbDensity` → `data-dse-sb-density` | *(new; site expresses density via the preset)* | padding + line-height: **cozy** vs **compact** |
| `sbColumns` → `data-dse-sb-columns` | `data-sb-wide` | **side-by-side** multi-column features on wide reading panes vs single column |
| `sbStats` → `data-dse-sb-stats` | `data-sb-meta` | secondary stats: **grid** (side-by-side cells) vs **ledger** (stacked hairline rows) |
| `sbChars` → `data-dse-sb-chars` | `data-sb-charline` | characteristics on **two** lines vs **one** |
| `sbVillain` → `data-dse-sb-villain` | `data-sb-villain` | villain actions in a **banded** collapsible group vs **inline** |
| `sbStickyMeta` → `data-dse-sb-stickymeta` | `data-sb-stickymeta` | pin secondary stats in a **sticky** header |

D4 **declares** these (key, default, attr, control, options); **D2 owns the CSS** that makes
each attribute reflow the statblock (F1 §7: "statblock/display visuals expose pref attrs D2
consumes"). The breadth here is deliberately a **curated subset** of the site's fuller set
(the site also has `kwusage`, `disttarget`, `charbox`, `gridc`…) — OD-D4-6 tracks whether to
mirror the full set; the seven above cover density + side-by-side + the high-value toggles
Scott named.

### 3.2 Presets (the "Steel Card / Sourcebook / Index Card" bundle)

Mirrors the website's **statblock presets** (`DESIGN.md`; `settings-panel.js`
`detectSbPreset`): a single dropdown that writes a bundle of the member attrs, re-deriving
**"Custom"** when any single one diverges. The preset is **not a stored pref** — like the
site, D4 stores the seven members and *derives* the preset label. `sbStickyMeta` is a
**web-extra toggle outside the bundle** (`inPreset: false`), exactly as the site keeps
`stickymeta`/augs out of its presets.

```ts
// D4 preset bundles — only presentation prefs flagged `inPreset` participate.
const SB_PRESETS = {
  steel:      { sbFeatureStyle:"card", sbDensity:"cozy",    sbColumns:"single", sbStats:"grid",   sbChars:"two", sbVillain:"banded" }, // default
  sourcebook: { sbFeatureStyle:"card", sbDensity:"cozy",    sbColumns:"single", sbStats:"ledger", sbChars:"two", sbVillain:"inline" },
  index:      { sbFeatureStyle:"flat", sbDensity:"compact", sbColumns:"wide",   sbStats:"grid",   sbChars:"one", sbVillain:"inline" },
} as const;
// current preset = the key whose bundle equals current member values, else "custom".
```

Selecting a preset calls `prefs.set` for each member (a batched write, one `saveData`, one
reflect pass). Twiddling any member re-derives `custom`. Everything applies live — the
statblock roots re-stamp and CSS reflows in place, no re-render. Defaults reproduce today's
look (**Steel Card**), so existing vaults are visually unchanged until a user opts in.

### 3.3 Per-statblock override

Because prefs reflect onto the **element root** (not `<html>`), a single statblock can pin its
own layout via the `prefs:` map (§1.3) — e.g. a boss statblock forced to `sbColumns: wide,
sbDensity: cozy` regardless of the vault default. This is DSE's equivalent of the site's
per-page preview override (`DESIGN.md`, "deliberate exception to no-per-page-variance") — but
here it's an explicit author choice in the block, not a transient toggle, so it round-trips
with the note. The global pref remains the default for every statblock that doesn't opt in.

---

## 4. Settings-tab IA (generated from descriptors)

The settings tab is **rendered from the descriptor list**, not hand-wired per control — adding
a pref = adding a descriptor. It replaces the current three-field `MyPluginSettingTab`
(`SettingsTab.ts`) with a composed layout:

```
Draw Steel Elements — Settings
├─ [descriptor-driven pref sections]        ← D4 owns this renderer
│   ├─ Appearance          theme · card style · reduce motion
│   ├─ Statblock display   [Preset ▾]  feature style · density · feature columns ·
│   │                       secondary stats · characteristics · villain actions ·
│   │                       [✓] sticky secondary stats     + live mini-statblock preview
│   ├─ Element defaults    [✓] collapsible by default · [ ] start collapsed
│   ├─ Rolling             roller ▾ · [✓] click ability to roll        (shown when D5 present)
│   └─ References          [✓] fall back to steelcompendium.io links   (F2)
└─ [operational sections]                    ← F2 owns these (hand-written)
    ├─ Compendium          folder · release · locale · [Sync] · status · [Check for updates]
    └─ Initiative tracker  default creature image path
```

### 4.1 The generated renderer

```ts
// D4 — one loop drives the whole pref UI.
function renderPrefSections(containerEl: HTMLElement, prefs: PreferenceStore) {
  for (const group of orderedGroups(prefs.descriptors())) {     // Appearance → Statblock → …
    if (group.every(d => d.ui.hidden || (d.ui.ownedBy && !consumerPresent(d.ui.ownedBy)))) continue;
    new Setting(containerEl).setName(group.name).setHeading();
    if (group.name === "Statblock display") renderPresetControl(containerEl, prefs);   // §3.2
    for (const d of group) renderRow(containerEl, prefs, d);    // control by d.ui.control
  }
}
```

- **Control mapping** (Obsidian `Setting` primitives, no new deps): `toggle` → `addToggle`;
  `dropdown` → `addDropdown` (options from `d.ui.options`, or `optionsFrom:"theme"` →
  `ThemeService`'s member list, D3-supplied); `text` → `addText`; `slider` → `addSlider`
  (reserved; none in v1). Sentence-case labels per Obsidian plugin guidelines
  (`obsidian-plugin-development` skill).
- **Live apply.** Every control's `onChange` calls `prefs.set(key, value)`. `set` persists
  (§5) **and** fires the reflect subscriptions → every mounted root re-stamps → CSS reflows.
  No settings-tab "Apply/Reload" button; the effect is visible in any open note behind the
  tab. This is the plugin-side mirror of the v2 settings drawer's live apply.
- **`ui` metadata shape** (D4 finalizes F1's `ui?: unknown`):

  ```ts
  interface PrefUi {
    group: string;                 // section heading (ordered by GROUP_ORDER)
    label: string; help?: string;  // Setting name / desc
    control: "toggle" | "dropdown" | "text" | "slider";
    options?: [value: string, label: string][];   // dropdown
    optionsFrom?: "theme";         // dynamic options (D3 theme list)
    inPreset?: boolean;            // statblock: part of the preset bundle (§3.2)
    ownedBy?: "D5" | "F2";         // feature-gate: hide the row until the consumer ships
    hidden?: boolean;              // e.g. deprecated/experimental
  }
  ```

### 4.2 Statblock preview + reset

- **Live mini-statblock preview** under the Statblock group: a small real DSE statblock root
  (a canned sample), mounted through the pipeline so `reflect` drives it. Because it's a real
  root, every pref/preset change reflows it instantly — the user *sees* density/side-by-side
  before leaving settings. (Reuses the mounted-view machinery; no bespoke renderer.)
- **Reset:** a "Reset to defaults" affordance per group and globally — sets each member to
  `descriptor.default` (i.e. deletes it from the sparse store), one reflect pass.

### 4.3 Boundary with F2's operational settings

The **Compendium** and **Initiative** sections are *operational* configuration (paths, release
tag, locale, sync buttons), **not** attribute/behavioral prefs — they stay top-level
`DSESettings` fields owned by F2's settings rework (F2 §3.4). D4's renderer emits the pref
sections; F2 appends its hand-written sections into the same `containerEl`. The single genuinely
cross-cutting toggle, `webLinkFallback`, lives in **D4's** catalog (References group) so there
is one pref store; F2 *reads* it. This keeps "one settings tab, two owners" clean.

---

## 5. Storage & migration

### 5.1 Backend — plugin `saveData`, per-vault (confirms F1 OD-2)

D4 confirms **F1 OD-2 → plugin `saveData`** (per-vault, syncs with the vault, one store beside
existing settings) over `localStorage`. Rationale: keeps prefs with the notes they style
(a vault shared via git/Sync carries its statblock layout choices), and unifies with the
existing `DSESettings` object the plugin already `saveData`s. (The v2 *website* uses per-device
`localStorage` because it has no per-vault concept; DSE does, so per-vault is the better default.
Per-device override is deferred — OD-D4-8.)

### 5.2 `saveData` shape — `prefs` merged into `DSESettings`

The pref store is a **sparse sub-object** under a new `prefs` key on the existing settings
object (F1 §3.6: "merged into the existing settings object under a `prefs` key"):

```ts
// Settings.ts, post-D4/F2
export interface DSESettings {
  // — operational (F2-owned; unchanged carry-over) —
  compendiumReleaseTag?: string;
  compendiumDestinationDirectory: string;
  defaultImagePath: string;
  locale?: string;                       // F2 adds

  // — preferences (D4-owned) —
  settingsVersion: number;               // migration marker (starts at 1)
  prefs: Partial<DsePrefs>;              // SPARSE: only keys ≠ default are stored
}
```

- `PreferenceStore.get(key)` = `settings.prefs[key] ?? descriptor.default`.
- `PreferenceStore.set(key, v)`: if `v === descriptor.default` → `delete settings.prefs[key]`
  (keeps the store sparse); else `settings.prefs[key] = v`. Then `plugin.saveData(settings)`,
  **debounced** (~250 ms trailing) to collapse preset batch-writes and slider drags into one
  disk write; then notify subscribers/reflect (in-memory update is synchronous, so the UI never
  waits on disk). Preset selection sets ~6 keys then triggers **one** debounced save + **one**
  reflect pass.
- On `onload`: `this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())`;
  `prefs` defaults to `{}`. The `PreferenceStore` is constructed over `settings.prefs`.

### 5.3 Migration from today's `DSESettings`

Current on-disk shape has **no `prefs` key** (`Settings.ts`: three fields). Migration is
**purely additive and lossless** — the three existing fields carry over untouched:

| From (v0, pre-D4) | To (v1) | Action |
|---|---|---|
| `compendiumReleaseTag`, `compendiumDestinationDirectory`, `defaultImagePath` | same | carry over verbatim (F2 may reset `compendiumReleaseTag`, its concern) |
| *(absent)* `prefs` | `prefs: {}` | initialize empty ⇒ every pref resolves to its default ⇒ **zero visual change** for existing vaults |
| *(absent)* `settingsVersion` | `1` | stamp |

```ts
function migrateSettings(raw: any): DSESettings {
  const s: DSESettings = Object.assign({}, DEFAULT_SETTINGS, raw);
  if (s.settingsVersion === undefined) { s.prefs ??= {}; s.settingsVersion = 1; }
  // future: if (s.settingsVersion < 2) { …rename/relocate pref keys… s.settingsVersion = 2; }
  return s;
}
```

Because storage is **sparse** (§5.1, OD-D4-4), future default changes and new prefs need no
data migration — absent keys pick up the new default. `settingsVersion` is reserved for the
rare structural change (renaming a pref key, changing an option set) — bump it and write a
`< N` branch. **Because defaults reproduce today's look, an upgraded vault renders identically
until the user opts in** — the compatibility bar (F1 §1.4 "preserve behavioral contracts").

---

## 6. Contracts

### 6.1 D4 **consumes** (from F1 §3.6 — names exact)

- `DsePrefs` — augmented via module augmentation (§2.1).
- `PrefDescriptor` — D4 supplies the array; finalizes the `ui` shape (§4.1).
- `PreferenceStore.describe(descriptors)` — called once at `onload`.
- `PreferenceStore.get/set/subscribe/reflect` — `get` for behavioral prefs; `set` from settings
  controls; `reflect(root, owner)` is called **by the pipeline** on every element root (D4 does
  not call it — it just supplies the descriptors that make it stamp `data-dse-*`); `subscribe`
  for the per-block override pin (§1.4) and any element that wants to react beyond CSS.
- `RenderContext.prefs` (F1 §3.2) — how elements reach the store (`cx.prefs.get(...)`).
- `Component` lifecycle — every `subscribe(key, owner, …)` auto-unsubscribes on `owner` unload
  (F1 §4.5); D4 never manages subscription teardown by hand.
- **No F1 signature changes** (F1 §7: "D4 must consume `PreferenceStore` as-is"). The only
  proposed F1 touch is the *optional* `reflect` pin param, raised as OD-D4-3, not required.

### 6.2 D4 **provides**

- **To D2 (UI overhaul):** the `data-dse-*` **attribute vocabulary** — `data-dse-card-style`,
  `data-dse-reduce-motion`, and the seven `data-dse-sb-*` (§3.1). D2 writes the CSS in
  `styles.css` scoped under `[data-dse-element]` (F1 §3.5) that reflows on these. D4 guarantees
  the attrs are present at first paint (pipeline reflects before `onMount`) and re-stamped live.
  **D4 declares; D2 gives them visual meaning.**
- **To D3 (theming):** `theme` is a pref key. D4 renders its settings row (dropdown, options
  from `ThemeService`'s member list via `optionsFrom:"theme"`) and persists `prefs.theme`.
  **D3 owns the value space (`DseThemeId` members) and the reflection** (`ThemeService.apply`
  stamps `data-dse-theme`); D4's `theme` descriptor has **no `attr`** so the two never
  double-stamp. Split: *D4 = the control + persistence; D3 = the options + the CSS effect.*
- **To D5 (rolling):** `rollerEngine`, `rollClickToRoll` — behavioral keys D5 reads via
  `cx.prefs.get(...)` in the roller. D4 persists + surfaces them (rows hidden until D5 ships).
- **To F2 (SCC resolution):** `webLinkFallback` — behavioral toggle F2's `SccResolver` reads
  (F2 §4.2 step 3 gates the `steelcompendium.io/scc/{code}/` fallback on it; F2 OD-7 default
  **on**). D4 owns the catalog entry + settings row; F2 owns consumption.

### 6.3 Interaction with per-block YAML (element authors)

- Reserved `prefs:` block key (§1.3) — element `parse()` lifts it into an `overrides` bag off
  the model; presentation overrides pinned on the root (§1.4); behavioral overrides read like
  the global default. **Byte-compat:** `overrides` never enters `serialize`, so persisted
  elements round-trip unchanged (F1 §6 compatibility bar).
- Existing `collapsible:` / `collapse_default:` keys keep working and now default from
  `collapsibleDefault` / `collapseDefault` (§1.3) — the only change to any current YAML contract
  is a *softening* (hard-coded default → configurable default), never a break.

---

## 7. Open Decisions — needs Scott

| # | Decision | Options | Recommendation |
|---|---|---|---|
| **OD-D4-1** | Roll prefs are declared by D4 but owned/consumed by D5 (not yet written). Ship the two rows now (feature-gated) or leave rolling entirely to D5's spec to catalog? | (a) D4 catalogs + persists, gates rows on D5 presence · (b) D5 owns its own pref keys end-to-end | **(a)** — one pref store, one settings tab; D5 just reads keys. Same pattern as `theme`/D3 and `webLinkFallback`/F2. |
| **OD-D4-2** | Per-block override syntax | reserved `prefs:` map (keys = pref keys) · flat top-level keys · raw `data-*` passthrough | **`prefs:` map** — namespaced (no collision with element data), validated against descriptors, invisible to `serialize`. |
| **OD-D4-3** | Making per-block overrides win over live global changes | (a) D4-only: view `subscribe`s after `reflect`, relies on listener registration order · (b) add optional `pin?: Set<keyof DsePrefs>` to F1 `reflect` (one line, order-independent) | **(a) now** (no F1 change); adopt **(b)** if ordering ever proves flaky. |
| **OD-D4-4** | Persistence granularity | **sparse** (store only non-defaults; new defaults auto-adopt) · full snapshot (store all keys) | **Sparse** — matches v2 `mkdocs:fontPrefs`; migration-free default changes. |
| **OD-D4-5** | Boolean attr reflection | value-mode `="true"/"false"` (F1 default) · presence-mode (stamp only when non-default, à la v2 `data-no-dropcap`) | **value-mode** — uniform with F1 `reflect`; CSS matches `[…="true"]`. Presence-mode is a later polish if CSS gets verbose. |
| **OD-D4-6** | Statblock pref breadth | curated **7** (density/side-by-side/featstyle/stats/chars/villain/sticky) · full v2 mirror (adds `kwusage`, `disttarget`, `charbox`, `gridc`, `wide`-vs-`columns` split…) | **Curated 7** now (covers Scott's named cases); extensible — D2 can add attrs later without touching the model. |
| **OD-D4-7** | Theme option list | D3 supplies all `DseThemeId` members; D4 shows all · D4 filters D3's "hidden until baked" themes (cf. v2 Parchment/Obsidian hidden per `FOLLOWUPS #3`) | **Filter** — D3 marks members shippable; D4 shows only those. |
| **OD-D4-8** | Per-device override layer | none (per-vault only) · add an optional `localStorage` layer for appearance prefs that shadows `saveData` | **None now** — revisit if users want per-device statblock density (F1 OD-2 "revisit per-device if users ask"). |
| **OD-D4-9** | Fold operational scalars (`defaultImagePath`, `locale`) into the pref store? | keep top-level `DSESettings` (F2-owned) · migrate into `prefs` as behavioral keys | **Keep top-level** — they're operational config, not attr/behavioral display prefs; F2 owns their section. |

---

*Cross-references: F1 §3.6 (the `PreferenceStore`/`DsePrefs`/`PrefDescriptor` contract this
spec fills), F1 §3.5 (theme seam, D3-owned), F1 §2.4 step 4 (pipeline reflects before mount),
F2 §4.2/OD-7 (`webLinkFallback` consumer), `DESIGN.md` → "The user-preference system" (the
attribute-driven, CSS-reflow pattern mirrored here), statblocks `README.md` (the `data-sb-*`
vocabulary the `sb*` prefs echo), `settings-panel.js`/`settings-core.js` (the live-apply +
preset-derivation reference implementation).*
