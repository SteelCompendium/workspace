# D3 — Theming System (+ Legacy theme) + Print/Export Mode — Design Spec

**Status:** proposed (planning only — no code changes)
**Date:** 2026-07-01
**Repo:** `draw-steel-elements/` (Obsidian plugin, Element Framework v2)
**Depends on:** F1 (Element Framework v2 — §3.5/§3.6 are the contract)
**Consumed by:** D2 (UI overhaul — imports the `DseTokenName` union + `data-dse-element` scoping), D4 (preferences — owns the `theme` pref UI)
**Author:** Fable

**One-line summary:** own the `--dse-*` design-token layer — a scoped, semantic custom-property
sheet whose *values* are swapped by `data-dse-theme` — implement the real `ThemeService` on top
of `PreferenceStore` (attribute-stamp, CSS-reflow, popout-safe, zero re-render), ship two built-in
themes (**Legacy** = today's exact look captured verbatim, **Steel** = High-Fantasy Steel aligned
to `DESIGN.md`), and add a **print/export mode** as a `@media print` + preview-attribute layer that
composes over whichever theme is active.

---

## 0. Scope, inputs, and non-goals

**I own (per F1 §3.5, §7):**

- The `DseThemeId` member set (the *values* `data-dse-theme` can take).
- The `DseTokenName` union (the closed catalog of `--dse-*` custom-property leaf names D2 imports).
- The `--dse-*` CSS custom-property sheet in `styles-source.css` (the value blocks per theme).
- The real `ThemeService` (F1 ships a constant-theme stub).
- The **Legacy** theme (backwards-compat requirement, program decision #6) and the **Steel** theme.
- Print/export mode as a media/theme layer.

**I do NOT own:**

- The pipeline, seam signatures, `RenderContext`, `ElementView`, `BlockHost` (F1 — I honor names verbatim).
- The *structural* CSS of each element (`display`, grid, flex, spacing skeleton) — **D2** authors that inside
  `ElementView.onMount` + `framework/kit/`; D3 supplies only the token layer it consumes. D3 and D2 share one
  contract: **D2 references tokens by the exact `DseTokenName` names defined here; D3 defines their values.**
- The preferences *catalog* and settings-tab UI — **D4** (I only define the `theme` pref's descriptor shape and
  its default; D4 renders the picker row).
- SCC/reference resolution (F2), Vue removal (D1).

**Inputs read:**

- F1 spec §3.5 (ThemeService/DseThemeId/DseTokenName), §3.6 (PreferenceStore, `theme` key), §2.1 (attribute-driven,
  CSS-reflow principle), §3.3 (`ElementView extends Component`), §4.5 (popout safety, `owner.register`).
- `DESIGN.md` — High-Fantasy Steel look/feel + the attribute-driven preference pattern (mirror it).
- `draw-steel-elements/styles-source.css` (2029 lines) — the current appearance Legacy must reproduce.
- F3 SC-5 — the 65 inline `.style.*` assignments with hardcoded colors (`limegreen`/`crimson`/`deepskyblue`/
  `red`/`green`/`yellow`/`orange`/`#D50000`/`purple`) that become semantic tokens here.
- `v2/docs/stylesheets/palette.css` (the canonical `--sc-*` hexes) + `print.css` (the print conventions to mirror).

**Non-goals:** commercial brand fonts (Beaufort/Newzald/Berlingske — licensed for the web product only; DSE uses
Obsidian fonts + a free serif fallback); any element restructure (D2); the pref settings UI (D4); animation systems
beyond the hover-lift/transition tokens.

---

## 1. Token architecture

### 1.1 Design rules (the four invariants)

1. **Semantic, never literal.** A token names a *role* (`--dse-surface-raised`, `--dse-hp-dying`), never a color
   (`--dse-red`). D2 reads roles; D3 fills them per theme. This is what lets Legacy and Steel diverge with zero D2 changes.
2. **Scoped, not global.** Every token is declared under `[data-dse-element]` (the pipeline stamps that attribute on
   every root, F1 §3.5). Tokens never leak onto `document.body`, never collide with Obsidian's own vars, and never
   affect non-DSE content. This is also what makes popout windows correct by construction (§2.4).
3. **Compose with Obsidian, don't fight it.** Legacy token *values* are Obsidian variables (`var(--code-background)`,
   `var(--text-normal)`), so Legacy inherits light/dark and community themes automatically. Steel borrows only
   Obsidian's light/dark *bit* and imposes its own branded palette (a deliberate skin — the user asked for it by
   selecting Steel). No token is ever a raw literal *in the base layer*; literals appear only inside a theme's value
   block, where they are intentional brand decisions.
4. **Closed union, open override.** `DseTokenName` is a finite TypeScript union (D2 gets autocomplete + compile errors
   on typos). The *value* side is open: any user CSS snippet can override any `--dse-*` under `[data-dse-element]`
   (§6). Adding a token is a D3 change (union + every theme block); overriding a value is a user's prerogative.

### 1.2 Token categories & catalog

Tokens are grouped by role. Each row gives the leaf name (the `DseTokenName` member; the CSS property is
`--dse-<name>`), the **Legacy** value (reproduces today), the **Steel** value (DESIGN.md), and the **Print** value
(§5). "→ Obsidian" means the value is an Obsidian variable; "→ inherit" means the token resolves to the ambient text
color (a no-op that adds no color Legacy never had).

`cx.theme.cssVar("surface-raised")` returns the string `"var(--dse-surface-raised)"` — the only way D2 code names a
token (it never hardcodes the `--dse-` prefix).

#### A. Surface & container

| `DseTokenName` | Legacy | Steel (dark / light) | Print |
|---|---|---|---|
| `surface` | `var(--code-background)` | `#1a1e21` / `#f6f8f8` | `#fff` |
| `surface-raised` | `var(--color-base-25)` | `#22272b` / `#edf0f0` | `#fff` |
| `surface-hover` | `var(--color-base-25)` | `rgba(77,184,199,0.10)` | `transparent` |
| `surface-sunken` | `var(--color-base-30)` | `rgba(220,226,230,0.06)` / `#eaeeef` | `#fff` |
| `surface-overlay` | `var(--background-primary-alt)` | `#161a1d` / `#fff` | `#fff` |

#### B. Border & shape

| `DseTokenName` | Legacy | Steel | Print |
|---|---|---|---|
| `border` | `var(--text-normal)` | `rgba(220,226,230,0.24)` / `#c8cdd0` | `#999` |
| `border-muted` | `var(--color-base-40)` | `rgba(220,226,230,0.12)` | `#ccc` |
| `border-hairline` | `var(--icon-color)` | `var(--sc-steel, #8e959a)` | `#bbb` |
| `border-focus` | `var(--interactive-accent)` | `#4db8c7` / `#2a7b88` | `#333` |
| `radius` | `5px` | `0.4em` | `0` |
| `radius-sm` | `4px` | `0.25em` | `0` |

#### C. Foreground / text

| `DseTokenName` | Legacy | Steel | Print |
|---|---|---|---|
| `text` | `var(--text-normal)` | `rgba(220,226,230,0.88)` / `#2c2e30` | `#000` |
| `text-muted` | `var(--text-muted)` | `rgba(220,226,230,0.62)` / `#555960` | `#333` |
| `text-faint` | `var(--text-faint)` | `rgba(220,226,230,0.38)` / `#828890` | `#666` |
| `text-on-accent` | `var(--text-on-accent)` | `#0f1214` / `#fff` | `#000` |

#### D. Accent / interactive

| `DseTokenName` | Legacy | Steel | Print |
|---|---|---|---|
| `accent` | `var(--interactive-accent)` | `#4db8c7` / `#2a7b88` | `#000` |
| `accent-hover` | `var(--interactive-accent-hover)` | `#6fc9d6` / `#348a97` | `#000` |
| `accent-glow` | `var(--color-accent, var(--interactive-accent))` | `rgba(77,184,199,0.35)` | `transparent` |

#### E. Semantic combat/HP state — the F3 SC-5 hardcodes, now tokens

These are the colors currently baked inline (`initiativeProcessor.ts`, the stamina modals, the `:root
--stamina-bar-color*` block). Legacy = the exact shipping literal; Steel = the palette hue; Print keeps meaning as a
thin border/glyph, not a fill (§5).

| `DseTokenName` | Legacy (today's literal) | Steel | Print |
|---|---|---|---|
| `hp-healthy` | `limegreen` | `var(--sc-role-hexer, #5cc98a)` | `#1a7a3a` |
| `hp-winded` | `yellow` | `#f0b429` | `#8a6a00` |
| `hp-dying` | `red` | `#e74c3c` | `#a11` |
| `hp-temp` | `purple` *(live Vue bar)* | `#7c5cd6` | `#555` |
| `damage` | `crimson` | `#e74c3c` | `#a11` |
| `healing` | `green` | `#4caf6a` | `#1a7a3a` |
| `malice` | `red` | `#e0584b` | `#a11` |
| `warning` | `orange` | `#e8954a` | `#8a5a00` |
| `selected` | `#D50000` | `#e0584b` | `#000` |
| `taken-turn` | `limegreen` | `var(--sc-role-hexer, #5cc98a)` | `#1a7a3a` |

> **Legacy fidelity note (§3):** the dead DOM stamina twin used `deepskyblue`/`limegreen` two-fill bars; the *live*
> Vue `StaminaBar` uses one `barColor` fill (healthy/winded/dying) + a `purple` temp indicator. Legacy reproduces the
> **shipping** element, so `hp-temp = purple`; the edit-modal preview bars' `limegreen`/`deepskyblue`/`crimson`
> direction cues map to `healing`/`hp-temp`/`damage`. The `deepskyblue` literal dies with the DOM twin (F1 dead-code
> removal) and gets no token.

#### F. Role accents (statblock / featureblock) — Steel adds meaning Legacy lacks

Legacy statblocks are monochrome (no role color today), so every `role-*` token's Legacy value is **`inherit`** — a
true no-op. Steel fills them from `palette.css`'s locked `--sc-role-*` hexes (single source of truth; identical in
light/dark by DESIGN.md).

`role-ambusher` `role-harrier` `role-artillery` `role-brute` `role-controller` `role-hexer` `role-mount`
`role-support` `role-defender` `role-leader` `role-solo` `role-minion` `role-malice`

| | Legacy | Steel (from `palette.css`) |
|---|---|---|
| `role-ambusher` | `inherit` | `#e3c14a` |
| `role-harrier` | `inherit` | `#e07ba8` |
| `role-artillery` | `inherit` | `#a87cd6` |
| `role-brute` | `inherit` | `#5d8fe0` |
| `role-controller` | `inherit` | `#e0584b` |
| `role-hexer` | `inherit` | `#5cc98a` |
| `role-mount` | `inherit` | `#48c9b0` |
| `role-support` | `inherit` | `#e8954a` |
| `role-defender` | `inherit` | `#c7a173` |
| `role-leader` / `role-solo` / `role-minion` / `role-malice` | `inherit` | `#9aa2a8` (grey) |

#### G. Ability-type accents (feature / ability cards) — Steel-only, Legacy no-op

Legacy value = `inherit` (today's feature cards are uncolored). Steel = `--sc-ability-*` (light/dark pair from
`palette.css`). D2 keys the card's 3px left spine (`accent-spine`, cat. J) off these.

`ability-strike` `ability-ranged` `ability-maneuver` `ability-triggered` `ability-area` `ability-passive`
`ability-villain` `ability-special`

| | Legacy | Steel dark / light |
|---|---|---|
| `ability-strike` | `inherit` | `#e74c3c` / `#c0392b` |
| `ability-ranged` | `inherit` | `#5dade2` / `#2874a6` |
| `ability-maneuver` | `inherit` | `#bb8fce` / `#7d3c98` |
| `ability-triggered` | `inherit` | `#f0b429` / `#b9770e` |
| `ability-area` | `inherit` | `#48c9a4` / `#148f77` |
| `ability-passive` | `inherit` | `#b0b7bb` / `#7b8a8b` |
| `ability-villain` | `inherit` | `#e57373` / `#922b21` |
| `ability-special` | `inherit` | `#ce93d8` / `#6c3483` |

#### H. Power-roll tiers

The tier key-boxes (`t1/t2/t3/crit`) are filled `var(--text-normal)` today, so Legacy = `text`. Steel colors them
`≤11`/`12–16`/`17+` red/amber/green (DESIGN.md tier grammar).

| `DseTokenName` | Legacy | Steel dark / light |
|---|---|---|
| `tier-low` | `var(--text-normal)` | `#e74c3c` / `#c0392b` |
| `tier-mid` | `var(--text-normal)` | `#f0b429` / `#b9770e` |
| `tier-high` | `var(--text-normal)` | `#4caf6a` / `#1e8449` |

#### I. Typography

| `DseTokenName` | Legacy | Steel |
|---|---|---|
| `font-body` | `var(--font-text)` | `"Source Serif 4", var(--font-text)` |
| `font-display` | `var(--font-interface)` | `"Source Serif 4", var(--font-interface)` |
| `font-mono` | `var(--font-monospace)` | `var(--font-monospace)` |
| `font-size-lg` | `var(--font-ui-large)` | `var(--font-ui-large)` |
| `font-size-sm` | `var(--font-ui-small)` | `var(--font-ui-small)` |
| `weight-strong` | `var(--font-bold, 700)` | `700` |
| `tracking` | `0.03em` *(today's `letter-spacing`)* | `0.02em` |

> Steel cannot ship Beaufort/Newzald/Berlingske (web-product licenses). Source Serif 4 is the DESIGN.md-sanctioned
> free fallback; if the vault lacks it, `var(--font-*)` catches. Steel alignment is **color + ornament**, not the
> commercial faces. (OD-4.)

#### J. Ornament / elevation (`fx-*`) — Steel chrome; Legacy & Print = off

These are DESIGN.md's `--fx-*` steel-chrome tokens, ported. Legacy value is the flat/no-op (`none`/`transparent`/`0`)
so it renders exactly as today; Steel gives them the metal gradient / bevel / emboss / hover-lift.

| `DseTokenName` | Legacy / Print | Steel |
|---|---|---|
| `fx-plate` | `none` | `linear-gradient(180deg, rgba(255,255,255,0.03), transparent 40%)` |
| `fx-bevel` | `none` | `inset 0 1px 0 rgba(255,255,255,0.06)` |
| `fx-emboss` | `none` | `0 1px 0 rgba(0,0,0,0.4)` (heading `text-shadow`) |
| `elevation-hover` | `none` | `0 2px 8px rgba(0,0,0,0.35)` |
| `accent-spine` | `transparent` | *set per element to the active `ability-*`/`role-*` token* |
| `hr-mark` | `var(--icon-color)` | `var(--sc-steel, #8e959a)` |
| `transition` | `none` *(instant, as today)* | `0.15s ease` |

#### K. Spacing (tokenized only where Print/density must vary)

Most spacing stays literal in D2's structural CSS. These four are tokenized because Print tightens them and a future
Compact pref (D4) may too.

| `DseTokenName` | Legacy | Steel | Print |
|---|---|---|---|
| `pad` | `1em` | `1em` | `0.4em` |
| `pad-sm` | `0.5em` | `0.5em` | `0.25em` |
| `gap` | `0.5rem` | `0.5rem` | `0.25rem` |
| `row-pad` | `1rem` *(statblock line L/R pad)* | `1rem` | `0.5rem` |

### 1.3 The `DseTokenName` union (normative — D2 imports this)

```ts
// framework/seams/theme.ts — D3 narrows F1's `type DseTokenName = string` to:
export type DseTokenName =
  // A surface
  | "surface" | "surface-raised" | "surface-hover" | "surface-sunken" | "surface-overlay"
  // B border & shape
  | "border" | "border-muted" | "border-hairline" | "border-focus" | "radius" | "radius-sm"
  // C text
  | "text" | "text-muted" | "text-faint" | "text-on-accent"
  // D accent
  | "accent" | "accent-hover" | "accent-glow"
  // E combat/HP state
  | "hp-healthy" | "hp-winded" | "hp-dying" | "hp-temp"
  | "damage" | "healing" | "malice" | "warning" | "selected" | "taken-turn"
  // F role accents
  | "role-ambusher" | "role-harrier" | "role-artillery" | "role-brute" | "role-controller"
  | "role-hexer" | "role-mount" | "role-support" | "role-defender"
  | "role-leader" | "role-solo" | "role-minion" | "role-malice"
  // G ability-type accents
  | "ability-strike" | "ability-ranged" | "ability-maneuver" | "ability-triggered"
  | "ability-area" | "ability-passive" | "ability-villain" | "ability-special"
  // H power-roll tiers
  | "tier-low" | "tier-mid" | "tier-high"
  // I typography
  | "font-body" | "font-display" | "font-mono" | "font-size-lg" | "font-size-sm"
  | "weight-strong" | "tracking"
  // J ornament / elevation
  | "fx-plate" | "fx-bevel" | "fx-emboss" | "elevation-hover" | "accent-spine" | "hr-mark" | "transition"
  // K spacing
  | "pad" | "pad-sm" | "gap" | "row-pad";
```

~63 tokens. Adding one is a D3 PR that (a) extends this union and (b) adds a row to **every** theme value block
(TypeScript won't enforce (b) — a build check greps that each `--dse-<name>` appears in the base + each theme block;
see §7).

### 1.4 Mapping to Obsidian variables (the composition table)

Legacy's whole job is to be a thin alias layer over Obsidian's vars, so DSE inherits the user's Obsidian theme.
Every Obsidian var DSE uses today, and the token that now fronts it:

| Obsidian var (used today in `styles-source.css`) | Fronted by token |
|---|---|
| `--code-background` | `surface` |
| `--color-base-25` | `surface-raised` / `surface-hover` |
| `--color-base-30` | `surface-sunken` |
| `--color-base-35` / `--color-base-40` | `border-muted` |
| `--background-primary-alt` | `surface-overlay` |
| `--text-normal` | `text` (and `border` for solid card edges) |
| `--text-muted` | `text-muted` |
| `--text-faint` | `text-faint` |
| `--icon-color` | `border-hairline` / `hr-mark` |
| `--interactive-accent` | `accent` / `border-focus` |
| `--color-accent` | `accent-glow` |
| `--font-ui-large` / `--font-ui-small` | `font-size-lg` / `font-size-sm` |
| `--font-text` / `--font-interface` / `--font-monospace` | `font-body` / `font-display` / `font-mono` |

Tokens with **no** Obsidian equivalent (`hp-*`, `role-*`, `ability-*`, `tier-*`, `fx-*`, `malice`, `warning`,
`selected`) are the semantic set — the ones that were inline literals (SC-5) or simply didn't exist. These carry the
brand and are why the token layer exists.

---

## 2. Theme model + `ThemeService` implementation

### 2.1 How `data-dse-theme` selects a value set

The stylesheet is three (well, four) stacked scoped blocks in `styles-source.css`:

```css
/* 1. BASE = Legacy defaults. Present on every element root regardless of theme. */
[data-dse-element] {
  --dse-surface: var(--code-background);
  --dse-surface-raised: var(--color-base-25);
  --dse-text: var(--text-normal);
  --dse-hp-healthy: limegreen;
  --dse-role-controller: inherit;
  --dse-fx-plate: none;
  /* …every token, Legacy value… */
}

/* 2. STEEL overrides (dark ground is the signature; light variant below). */
[data-dse-element][data-dse-theme="steel"] {
  --dse-surface: #1a1e21;
  --dse-surface-raised: #22272b;
  --dse-text: rgba(220,226,230,0.88);
  --dse-hp-healthy: var(--sc-role-hexer, #5cc98a);
  --dse-role-controller: #e0584b;
  --dse-fx-plate: linear-gradient(180deg, rgba(255,255,255,0.03), transparent 40%);
  /* …every token that differs from Legacy… */
}

/* 2b. STEEL light variant — only borrows Obsidian's light/dark bit. */
.theme-light [data-dse-element][data-dse-theme="steel"] {
  --dse-surface: #f6f8f8;
  --dse-surface-raised: #edf0f0;
  --dse-text: #2c2e30;
  --dse-role-controller: #e0584b;   /* role hues are light/dark-stable per DESIGN.md */
  --dse-ability-strike: #c0392b;    /* ability + tier hues DO shift (palette.css light col.) */
  /* … */
}

/* 3. Legacy is the BASE block itself — `data-dse-theme="legacy"` matches nothing extra,
      which is correct: Legacy === the base defaults. (An explicit
      [data-dse-theme="legacy"] block is unnecessary; documented so nobody adds one.) */
```

Because `data-dse-theme` is a **data-attribute on the element root** and the value blocks are pure CSS, switching
themes is a single attribute write → the browser recomputes custom properties → every rule reading `var(--dse-*)`
repaints. **No JS re-render, no DOM rebuild, no view teardown** — exactly DESIGN.md's preference model and F1 §2.1
principle 5.

Legacy is the base (unprefixed) block so that an element with *no* `data-dse-theme` still renders correctly (defensive:
if the pipeline ever mounts before the theme is stamped, first paint is Legacy, then the stamp is a no-op or a Steel
swap — never unstyled).

### 2.2 `ThemeService` — the real implementation (replaces F1's stub)

F1 §3.5 defines the interface; F1 ships a constant-theme stub. D3 implements it against `PreferenceStore` (theme is
pref key `"theme"`, F1 §3.6):

```ts
// framework/seams/theme.ts  (D3 replaces the stub body; signatures unchanged from F1 §3.5)
export type DseThemeId = "legacy" | "steel" | (string & {});   // §2.3 — members finalized here

export class DsePreferenceThemeService implements ThemeService {
  private listeners = new Set<(t: DseThemeId) => void>();

  constructor(private prefs: PreferenceStore, private plugin: Plugin) {
    // Single upstream subscription: when the `theme` pref changes, fan out to listeners.
    // Owner = the plugin (lives for the plugin's whole life); this is the ONE sanctioned
    // long-lived subscription (it drives, not leaks).
    this.prefs.subscribe("theme", plugin, (t) => {
      for (const cb of this.listeners) cb(t);
    });
  }

  get active(): DseThemeId { return this.prefs.get("theme"); }

  /** Stamp data-dse-theme on a root and keep it current for `owner`'s lifetime. */
  apply(rootEl: HTMLElement, owner: Component): void {
    rootEl.dataset.dseTheme = this.active;                 // → data-dse-theme="steel"
    // Re-stamp on change; auto-unsubscribes when owner (the ElementView) unloads.
    const unsub = this.onChange((t) => { rootEl.dataset.dseTheme = t; });
    owner.register(unsub);
  }

  onChange(cb: (t: DseThemeId) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);               // caller wraps in owner.register
  }

  cssVar(name: DseTokenName): string { return `var(--dse-${name})`; }
}
```

Key properties:

- **One writer of `data-dse-theme`.** `ThemeService.apply` is the *only* thing that stamps `data-dse-theme`. The F1
  pipeline calls `cx.theme.apply(root, view)` before `onMount` (F1 §2.4 step 4), so the attribute is present at first
  paint. The `theme` pref descriptor (D4) therefore **must not** also carry an `attr` (which would double-stamp via
  `prefs.reflect`); D3 registers `theme` with `attr` omitted. (Contract to D4, §7.)
- **Reflow, not re-render.** `apply` mutates one attribute; F1 views are never torn down for a theme change. A theme
  switch is O(number of live roots) attribute writes, all synchronous, then the browser repaints.
- **Auto-cleanup.** Every `onChange` subscription is wrapped in `owner.register`, so it dies with the view (F1 §4.5).
  No listener outlives its element. The service's own upstream `prefs.subscribe` is owned by the plugin (the single
  intentional long-lived subscription).

### 2.3 `DseThemeId` members (finalized)

```ts
export type DseThemeId = "legacy" | "steel" | (string & {});
```

- **`legacy`** — today's exact look (§3). The base value block.
- **`steel`** — High-Fantasy Steel (§4).
- `(string & {})` keeps the type open so a snippet author can select an arbitrary id (§6) without a type change; the
  **settings picker (D4) offers only the two built-ins** plus, if OD-5 lands, a "System (follow Obsidian)" pseudo-entry.

**Print is deliberately NOT a `DseThemeId` member** — it is a *rendering context* that composes over whichever theme
is active (you print your Steel statblock and it should still say "this was a Controller"), so it is a media/attribute
**layer** (§5), not a palette choice. (OD-2 revisits whether a screen-only "print preview" deserves a pseudo-theme
entry.)

**Default theme:** see **OD-1**. Recommended default **`steel`** — D2 rebuilds every element in the High-Fantasy Steel
language, so shipping it off-by-default would hide the redesign; **Legacy is the compatibility escape hatch** that
honors program decision #6, not the default. (Scott decides; if he wants zero-surprise upgrades, flip to `legacy`.)

### 2.4 Composition with Obsidian themes (light/dark + community)

Three composition modes, by design:

1. **Legacy = maximal deference.** Every Legacy token is an Obsidian var, so Legacy *is* whatever the user's Obsidian
   theme is. Light/dark: Obsidian re-defines `--code-background`, `--text-normal`, etc. under `.theme-dark`/`.theme-light`
   on `body`; because our tokens reference those vars, Legacy flips automatically — **no `.theme-*` selectors needed in
   Legacy**. Community themes (Minimal, Things, AnuPpuccin…) override those same vars → Legacy inherits them for free.
   This is the backwards-compat guarantee: a user on a community theme sees today's DSE-on-that-theme look.
2. **Steel = branded skin, borrows only the light/dark bit.** Steel imposes charcoal/steel surfaces and the semantic
   palette (it intentionally does *not* inherit a community theme's surfaces — the user chose a skin). It still respects
   the user's **light vs dark** choice via `.theme-light [data-dse-element][data-dse-theme="steel"]` overrides (§2.1).
   So Steel honors the one Obsidian signal that is a *user reading preference* (light/dark) while overriding the rest.
   Documented tradeoff: Steel + an exotic community theme will look like Steel, not the community theme — that is the
   contract of choosing a skin.
3. **Semantic tokens are theme-independent-ish.** `hp-*`, `role-*`, `tier-*` carry rules meaning; they keep their hue
   across light/dark (role hues are locked in `palette.css`; HP/tier hues get a light-column value only where contrast
   demands, per the tables). This preserves "predictable lookup" (DESIGN.md) — a Controller is always red.

**`--sc-*` fallback chaining:** Steel values that reference `--sc-role-*`/`--sc-ability-*` use
`var(--sc-role-hexer, #5cc98a)` form. In the DSE plugin those `--sc-*` vars are normally undefined (they live in the
v2 site), so the literal fallback wins — but if a user *also* runs a Steel-Compendium-aware snippet defining `--sc-*`,
DSE picks it up. Cost-free forward-compat.

### 2.5 Popout-window safety (F1 §4.5 / §3.5)

Popout correctness falls out of the architecture — **no popout-specific code**:

- **Stylesheet reaches popouts.** Obsidian clones plugin stylesheets into every popout `document`. The `[data-dse-element]`
  value blocks are therefore present in every window; nothing to inject.
- **State is per-root, not per-document.** `apply` stamps `data-dse-theme` on the element's *own* root, in whatever
  window it lives (`rootEl` is already in the popout's DOM). We never read/write `document.body` or a global class, so a
  block dragged to a popout keeps its attribute and its window's cloned stylesheet resolves it. This is exactly why F1
  §3.5 mandates stamping the root, not the body.
- **Theme change fans out across windows.** `onChange` re-stamps every live root's attribute regardless of window; each
  popout repaints from its own stylesheet copy. No `window`/`document` capture; the view's F1 `win` getter is used if any
  measurement is ever needed (none is — theming is pure CSS).

---

## 3. The Legacy theme (fidelity strategy)

**Goal (program decision #6, Scott's requirement):** a user who selects **Legacy** sees pixel-for-pixel today's DSE,
on any Obsidian/community theme, in light and dark.

### 3.1 Why Legacy is faithful by construction

Two facts guarantee it:

1. **Legacy token values ARE today's values.** Every Legacy value in §1.2 is the literal or Obsidian var currently in
   `styles-source.css` (`surface = var(--code-background)`, `hp-healthy = limegreen`, `role-* = inherit`, `fx-* =
   none`). The base block is a mechanical transcription of the current sheet's color/shape decisions.
2. **The structural CSS is unchanged.** D2 ports each element's `styles-source.css` rules into per-element scoped CSS,
   changing only two things: (a) scope selectors gain `[data-dse-element="<id>"]`, and (b) each literal color/var is
   replaced by the matching `var(--dse-*)`. Layout, spacing skeleton, flex/grid, the clip-path tier boxes, the
   `::before/::after` hairline fades, the ◆ HR — all copied verbatim. With Legacy token values equal to the originals,
   `var(--dse-surface)` resolves to `var(--code-background)`; the computed style is identical.

So Legacy fidelity is not a separate re-implementation — it is the **null transformation** of the existing sheet
through the token layer. The risk surface is only "did the literal→token substitution introduce a typo," which the
snapshot harness catches.

### 3.2 The mechanical port checklist (D2 executes; D3 audits)

For each element's CSS, and for the SC-5 inline styles:

1. Prepend `[data-dse-element="<id>"]` to the element's scope (or rely on the shared `[data-dse-element]` root).
2. Substitute every color/shape/font literal or Obsidian var → its `var(--dse-*)` token (use the §1.4 map).
3. **The 65 inline `.style.*` assignments (SC-5) become classes + tokens.** e.g.
   `staminaEl.style.color = 'crimson'` → element gets a class whose CSS is `color: var(--dse-damage)`;
   `taken-turn svg { background-color: limegreen }` → `background-color: var(--dse-taken-turn)`; the
   `:root --stamina-bar-color*` block is deleted (its three values become `hp-healthy/winded/dying`). **Only computed
   *widths*** (stamina %, dynamic bar fill) stay inline as F1 permits — they are data, not theme.
4. Verify each token resolves, under Legacy, to the pre-migration value (grep audit + snapshot).

### 3.3 Fidelity verification

- **Golden snapshots.** F3's Jest DOM harness renders each element (Legacy theme) → DOM/CSS-custom-property snapshot,
  asserted equal to a baseline captured *before* migration. Per-element, added as each element migrates (F1 §6).
- **Screenshot parity.** `docs/Media/*.png` (ability, statblock, initiative-tracker, negotiation, counter, stamina-bar,
  characteristics, values-row, skills, horizontalRule, featureblocks) are the visual baseline; a manual Legacy-theme
  render of the documented example blocks is diffed against them at each step.
- **Computed-value assertion.** A tiny test resolves every `--dse-*` under a `[data-dse-element]` (no theme attr = Legacy)
  and asserts it equals the §1.2 Legacy column — catching a dropped/typo'd token before it ships.

### 3.4 What Legacy deliberately does *not* preserve

- **Inline-style delivery.** The colors are identical; the *mechanism* moves from `el.style.*` to classes+tokens
  (required for theming and F3/plugin-review compliance). Same pixels, compliant delivery.
- **The dead DOM stamina twin's `deepskyblue` two-fill bar** — it is unregistered dead code (F1 §1.2); it never rendered
  for users, so reproducing it is not a fidelity requirement.

---

## 4. The Steel theme (DESIGN.md alignment)

Steel maps the `--dse-*` layer onto **High-Fantasy Steel** (DESIGN.md) as far as the Obsidian-plugin context allows.

### 4.1 What Steel adopts from DESIGN.md

- **Cool steel-charcoal ground.** `surface #1a1e21`, `surface-raised #22272b` (the DESIGN.md bg/raised pair), warm-white
  fg at graded opacities (88/62/38% → `text`/`text-muted`/`text-faint`), light variant `#f6f8f8`/`#edf0f0`/`#2c2e30`
  (from `palette.css`).
- **One steel-teal accent.** `accent #4db8c7` (dark) / `#2a7b88` (light) carries every button, active tab, focus ring,
  skill indicator, and the ◆ HR mark's halo — matching "one bright steel-teal accent carries every link/active/focus."
- **Saturated color = semantics only, as thin borders/glyphs.** Role/ability/tier hues appear as the card **spine**
  (`accent-spine`, 3px left border keyed to type — DESIGN.md ability-card rule), tier badges, and role-tinted statblock
  accents — never as fills. `fx-plate` is a *near-transparent* metal sheen (3% white), not a colored fill, honoring
  "no gradients/photos/textures as chrome; transparency only as 6–12% washes."
- **Steel chrome via `fx-*`.** `fx-bevel` (inset hairline highlight), `fx-emboss` (heading text-shadow),
  `elevation-hover` (the flat-at-rest → lift-on-hover shadow), `transition 0.15s` (DESIGN.md motion budget: 0.15s color
  / 0.2s lift, no bounces).
- **The ◆ diamond motif.** DSE already renders `ds-hr` as a rotated diamond between fading lines — Steel simply recolors
  `hr-mark` to steel (`--sc-steel`) so it reads as the DESIGN.md polished-steel rule. (Full filigree/seed-dot treatment
  is a D2 structural option, not a token concern.)
- **Predictable-lookup color locks.** Role hues from `palette.css`'s single-source `--sc-role-*`; tier grammar
  `≤11/12–16/17+` = red/amber/green. A Controller statblock is red in DSE exactly as on the site.

### 4.2 What Steel intentionally diverges on (Obsidian constraints)

- **Fonts.** No commercial faces (§1.2-I note). Steel = Source Serif 4 fallback + Obsidian fonts. Alignment is
  color/ornament/motion, not the brand typefaces.
- **Full-bleed art / mastheads.** Parked even on the web (DESIGN.md); not attempted in-plugin.
- **Community-theme surfaces.** Steel overrides them (it is a skin, §2.4). Legacy is the "respect my theme" choice.

### 4.3 Steel value source

All Steel hexes trace to `v2/docs/stylesheets/palette.css` (roles, ability types, tiers, steel greys, teal accent) and
DESIGN.md's stated bg/fg values — copied as literals (with `var(--sc-*, literal)` forward-compat chaining, §2.4). D3
owns keeping the Steel block in sync if `palette.css` ever changes (a documented, low-frequency manual sync — the two
repos don't share a stylesheet).

---

## 5. Print / export mode

Two delivery surfaces, one shared value block:

- **`@media print`** — the real deal: Ctrl-P / "Export to PDF" from Obsidian.
- **`data-dse-print="on"`** — an on-screen **export preview** attribute (so users can see the print layout before
  printing, and so a future "Export statblock" command can screenshot a clean card). Toggled by a D4 pref/command;
  purely additive.

### 5.1 The print value block

Print is a token **override layer** that composes over whatever theme is active — you don't lose the fact that a
statblock is a Controller, you just render it ink-economically:

```css
/* Shared selector: real print OR on-screen preview. Composes over any data-dse-theme. */
@media print {
  [data-dse-element] { /* …Print column of §1.2… */ }
}
[data-dse-element][data-dse-print="on"] { /* …same Print column… */ }
```

Print column decisions (§1.2 tables + these rules):

1. **Ink economy.** `surface*` → white, `text*` → near-black, `fx-* / elevation / surface-hover` → off, `radius` → 0,
   borders → grey hairlines. Backgrounds and washes drop out (mirrors `v2/print.css`: `background: none`, box-shadow off).
2. **Semantics survive as borders/glyphs, not fills.** `role-*`/`ability-*`/`tier-*`/`hp-*` keep a **darkened, legible**
   value so the 3px spine and tier badges still say "Controller / Tier 3 / dying" on paper. Where a value is meaning-
   bearing and must print, the rule adds `print-color-adjust: exact` (as v2 does for power-roll badges); decorative
   color is left to the browser's default ink-saving.
3. **Expand collapsibles.** Any D2 `<details>`/collapsible band inside a statblock/featureblock/skills is forced open in
   print (`details { open }` can't be forced via CSS alone → the print rule sets `.dse-collapsible-body { display:
   block !important }` and hides the toggle chevron). Nothing hidden behind a fold on paper.
4. **Hide interactive-only chrome.** Steppers, `+/−` buttons, malice modifier arrows, add-condition `＋` icons, tab
   bars, the reading-mode click-shield affordances — all `display: none` in print (they're inert on paper; F1 already
   marks these contexts `canPersist=false`, so they're non-functional anyway). The *state* they controlled (current
   stamina, malice value, active conditions) prints as static text.
5. **Page-break hygiene.** `break-inside: avoid` on each element root and on power-roll tier tables / character rows /
   ability cards, so a statblock or ability never splits across a page (mirrors v2 `.md-typeset table/blockquote`).
6. **Link handling.** Internal `[[ ]]`/`@`/`scc:` links print as plain underlined text (no URL noise); external `http`
   links may append the URL (v2 convention) — inherited from the note's print CSS, not re-solved here.
7. **`@page { margin }`** is the note's/site's concern, not the plugin's — DSE only styles its own subtree.

### 5.2 Why a layer, not a `DseThemeId`

Print composes *over* Steel or Legacy (you print whichever you use), and `@media print` must apply regardless of the
`theme` pref, so print can't be "just another theme value." Modeling it as an override layer (media query + optional
preview attribute) keeps the theme axis and the medium axis orthogonal — a user on Steel who prints gets
Steel-semantics-on-white, not a jarring switch to a different palette. (OD-2: whether the on-screen `data-dse-print`
preview also deserves a visible "Print preview" pseudo-theme entry in the D4 picker.)

### 5.3 Interaction with F1 `canPersist`

F1 already renders interactive controls inert (`canPersist=false`) in export/print/embed/hover contexts (§4.4). Print
mode's rule #4 (hide those controls) is the *visual* half of that same story — together they make printed/exported
statblocks clean and static with no broken affordances.

---

## 6. Extensibility (user / custom themes; snippet override surface)

**Sanctioned model: closed theme enum, open value override.** The `theme` pref is a two-value enum in the UI, but the
token layer is a public, documented override surface. Power users never need a new settings toggle.

### 6.1 Snippet override surface (the primary extension path)

Any Obsidian CSS snippet can retint DSE by overriding `--dse-*` at any scope — this is *the* customization story and it
is stable API:

```css
/* User snippet: retint the whole plugin */
[data-dse-element] { --dse-accent: #b8860b; --dse-hp-dying: #cc0000; }

/* Only statblocks */
[data-dse-element="statblock"] { --dse-role-controller: #ff5555; }

/* Only when Steel is active (layer your taste on top of Steel) */
[data-dse-element][data-dse-theme="steel"] { --dse-surface: #14181b; }

/* Define your own theme, then select it (see 6.2) */
[data-dse-element][data-dse-theme="my-brass"] { --dse-surface: #1c1710; --dse-accent: #c9962b; /* … */ }
```

Because tokens are semantic and scoped, this is safe (can't break layout, can't leak) and expressive (whole-plugin,
per-element, per-theme, or a full custom theme). D3 ships this override table as documentation in the DSE repo
(`.repo-docs/`), and the token names are the public contract — treated as stable, renamed only with a deprecation note.

### 6.2 Selecting a custom theme id

`DseThemeId`'s `(string & {})` opening means `data-dse-theme` can hold any string. To *select* `my-brass`, the user
needs a way to set the `theme` pref to an arbitrary value. Options (OD-3):

- **(a) Snippet + advanced setting (recommended):** the D4 picker offers Legacy/Steel; an "advanced" text field (or a
  `theme` value in `data.json`) lets a snippet author set an arbitrary id. Zero UI surface for the 99%; full power for
  snippet authors. Since selection is just "write the pref string," and `apply` stamps whatever it is, a custom theme
  block Just Works.
- **(b) `registerTheme(id, label)` API:** the plugin exposes an API for other plugins/snippets to register a theme that
  then appears in the picker. More machinery; deferred unless demand appears.
- **Recommendation:** (a). It costs nothing and matches "closed enum, open override."

### 6.3 A possible third built-in: "System / follow-Obsidian"

Legacy already *is* "follow Obsidian." A separate `system` id would be redundant. If users conflate "Legacy" with
"old DSE" rather than "match my Obsidian theme," D4 may relabel the picker entries ("Match Obsidian (Legacy)" /
"Steel") — a label choice, not a new theme (OD-5).

---

## 7. Contracts

### 7.1 Consumed (from F1 / D4)

- **`PreferenceStore`** (F1 §3.6) — `get("theme")`, `subscribe("theme", owner, cb)`. `ThemeService` is built entirely on
  it (§2.2). The `theme` value type is `DseThemeId` (F1's `DsePrefs.theme: DseThemeId`).
- **`theme` pref descriptor.** D3 registers it (or D4 does, citing D3's values):
  `{ key: "theme", default: <OD-1: "steel">, attr: undefined /* NOT reflected — ThemeService owns data-dse-theme */,
  ui: { label: "Theme", control: "select", options: [{value:"legacy",label:"Match Obsidian (Legacy)"},
  {value:"steel",label:"Steel"}] } }`. **The `attr` MUST be omitted** so `prefs.reflect` doesn't double-stamp
  `data-dse-theme` against `ThemeService.apply` (§2.2). This is a hard contract to D4.
- **Pipeline stamping (F1 §2.4 step 4).** The pipeline calls `cx.theme.apply(root, view)` before `onMount`; D3 relies on
  that ordering so tokens resolve at first paint.
- **`data-dse-element="<def.id>"`** on every root (F1 §3.5) — the scope selector all `--dse-*` blocks and all D2 CSS hang
  off. D3 assumes it is present.
- **`Component.register` / `owner`-based unsubscription** (F1 §4.5) — every subscription D3 creates is owned.

### 7.2 Provided (to D2 / D4)

- **`DseTokenName`** union (§1.3) — D2 imports it; `cx.theme.cssVar(name)` is the only way D2 names a token. Compile
  error on any name not in the union.
- **`data-dse-theme` stamping** — guaranteed present on every root, single-writer (ThemeService).
- **The `--dse-*` value blocks** in `styles-source.css` (Legacy base + Steel + Steel-light + Print) — D2's structural CSS
  reads them; D2 never redefines a token value (that's a theme concern).
- **`DseThemeId` members** `"legacy" | "steel"` + default (OD-1) — D4 builds the picker from these.
- **The snippet override table** (§6.1) — documented public surface.

### 7.3 Build-time guard (recommended, §1.3)

A CI check (fits F3's harness) greps that **every** `--dse-<name>` in the `DseTokenName` union appears in the base block
and is either overridden or intentionally inherited in each theme block — catching the "added a token, forgot Steel"
class of bug TypeScript can't see. Pairs with F1 OD-8's import-boundary lint.

---

## 8. Open Decisions — needs Scott

- **OD-1 — Default theme.** `steel` (ship the redesign on; Legacy is the opt-out — my recommendation, since D2 rebuilds
  every element in Steel and a default-off redesign is invisible) **vs** `legacy` (zero-surprise upgrade; users opt in
  to Steel). Program decision #6 only requires Legacy *exist as selectable*, not that it be default. **Recommendation:
  `steel` default, Legacy one click away.**
- **OD-2 — Is "print/export" also a screen-selectable pseudo-theme?** Recommended: no — print is a media/attribute
  **layer** (§5.2); the on-screen `data-dse-print` preview is enough, exposed as a command/pref, not a palette entry.
- **OD-3 — Custom-theme selection mechanism** (§6.2): (a) snippet + advanced text field [recommended], (b)
  `registerTheme()` API [deferred], (c) closed enum only, no custom selection.
- **OD-4 — Steel fonts.** Bundle/rely-on Source Serif 4 as the Steel body/display fallback (recommended) vs keep Steel on
  Obsidian's fonts entirely (color/ornament-only alignment). Commercial faces are off the table regardless.
- **OD-5 — Picker labels.** "Match Obsidian (Legacy)" + "Steel" (clarifies Legacy = defer-to-Obsidian) vs literal
  "Legacy" + "Steel". Label-only; **Recommendation:** the clarifying labels.
- **OD-6 — Steel palette sync.** Steel hexes are hand-copied from `v2/palette.css` (the repos share no stylesheet).
  Accept a documented manual sync (recommended) vs invest in a build step that generates the Steel block from
  `palette.css` (overkill for a rarely-changing palette).
- **OD-7 — Light-variant scope for Steel.** Full light Steel variant now (recommended — DESIGN.md says light is fully
  supported and `palette.css` already has the values) vs dark-only Steel first, light as a follow-up.

---

*Cross-references: F1 §3.5/§3.6 (ThemeService, PreferenceStore, DseThemeId, DseTokenName, data-dse-theme/-element),
F1 §2.1/§2.4/§4.5 (reflow principle, pipeline stamp order, popout/cleanup), F3 SC-5 (the 65 inline-color assignments
this spec tokenizes), `DESIGN.md` (High-Fantasy Steel + attribute-driven preference pattern), `v2/docs/stylesheets/
palette.css` (Steel hex source of truth) + `v2/docs/stylesheets/print.css` (print conventions mirrored),
`draw-steel-elements/styles-source.css` (the appearance Legacy reproduces).*
