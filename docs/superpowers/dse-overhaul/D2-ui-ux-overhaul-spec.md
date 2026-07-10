# D2 — DSE UI/UX Overhaul Spec (High-Fantasy Steel)

**Status:** proposed (planning only — ZERO code changes)
**Date:** 2026-07-01
**Repo:** `draw-steel-elements/` (Obsidian plugin, v5.1.1) · built on **Element Framework v2 (F1)**
**Depends on:** F1 (keystone) · **Coordinates with:** D3 (tokens/theme sheet/Legacy theme), D4 (preferences)
**Resolves UI debt from F3:** SC-5 (65 inline `.style.*` + hardcoded colors), MP-1/SC-6 (a11y),
CB-7 (`setText` destroying children).

**One-line summary:** a shared vanilla `framework/kit/` widget library (accessible modal,
collapsible, stepper, icon-button, tooltip, tabs, card-head, power-roll panel) plus a per-element
visual redesign of all 11 elements aligned to the workspace's **High-Fantasy Steel** language —
everything expressed as semantic classes under `[data-dse-element]` mapped to `--dse-*` tokens,
with **no inline colors** and a framework-default accessibility standard (keyboard, ARIA,
focus-visible, 44 px touch targets).

> **Lane discipline.** D2 builds *inside* `ElementView.onMount` and the kit; it does **not** touch
> the F1 pipeline or seam signatures. D2 **names** the `--dse-*` tokens and the `data-dse-*` pref
> attributes and maps each to today's ("Legacy") value; **D3 owns the token values, the Steel/Legacy
> sheets, and theme membership; D4 owns the pref catalog + settings UI.** Where this spec writes a
> color literal it is only to record the *Legacy* mapping D3 will encode — DSE code ships zero color
> literals.

---

## 1. Design principles — High-Fantasy Steel, inside Obsidian

The workspace language ([`DESIGN.md`](../../../DESIGN.md)) is "a well-made steel instrument — cool,
precise, readable for long sessions": flat charcoal ground, steel hairlines/bevels, one steel-teal
accent, and **saturated color reserved exclusively for game semantics**. DSE renders *inside a user's
Obsidian vault*, under an unknown community theme, with none of the site's commercial fonts or the
DrawSteelGlyphs webfont guaranteed. The seven translation rules:

1. **Compose the host theme, don't fight it.** Every `--dse-*` token resolves — in the Legacy theme —
   to an **Obsidian theme variable** (`--background-*`, `--text-*`, `--interactive-accent`,
   `--font-*`, `--code-background`), so DSE inherits the user's theme, light/dark, and font choices by
   default. The **Steel** theme (D3) then *overlays* steel ornament (`--dse-metal-*`, bevels, emboss)
   on top of those anchors. This is the direct analog of the site's `--fx-*` layer riding on
   `--md-*`.
2. **Semantic color only.** Charcoal/steel surfaces + one accent for interactivity. Saturated hues
   appear **only** as game meaning — power-roll tiers, stamina states, combat-role accents, villain
   Malice, victory points — and always as a thin border/glyph/band, **never a fill of a large area**.
   This is also what kills SC-5's `limegreen`/`crimson`/`deepskyblue`/`'red'` literals: each becomes a
   named semantic token.
3. **Predictable lookup.** Mirror the site's **6-slot card header** (`DESIGN.md` → "Card header
   system") so the same field always lands in the same place across statblock, featureblock, feature,
   and negotiation. A Director mid-combat should never hunt. One shared `cardHead()` kit builder
   enforces this structurally (see §2.7).
4. **Content is frozen.** Design changes layout, never wording or numbers — the plugin renders
   verbatim SDK/YAML text. Redesign is CSS + DOM structure only.
5. **Restraint in motion.** Cards are flat at rest; interaction feedback is a **0.15 s color / border
   / background** transition and a focus ring. **No hover-lift for reading-surface blocks** (a card
   translating under the cursor mid-note is distracting — the site's lift is for index grids DSE
   doesn't have); hover = teal border + faint wash, as today. `prefers-reduced-motion` disables the
   condition-effect animations.
6. **Iconography: functional, thin-line, host-native.** Use Obsidian's bundled Lucide via `setIcon`
   (the "Material thin-line" equivalent available in-vault) for utility glyphs; the power-roll tier
   badges keep the existing **CSS `clip-path`** boxes (`≤11 / 12-16 / 17+ / crit`), which need no
   font. The heraldic **crest** is a Steel-only ornament holding a `setIcon` glyph; Legacy omits it.
   Never hand-draw SVG.
7. **State is an attribute, styling is a class.** Following the site's preference model, every visual
   variation is a class or a `data-dse-*` attribute on an element root; CSS reflows one DOM. JS sets
   only **dynamic geometry** as *scoped custom properties* (`--dse-fill`, `--dse-value-scale`,
   `--dse-condition-color`) — never `el.style.color`. This is the SC-5 exit rule (§5).

**Scope guardrail.** All DSE CSS is authored under the F1 root contract: `[data-dse-element="<id>"]`
(and `[data-dse-theme="<active>"]`), stamped by the pipeline before first paint (F1 §3.5). Nothing
leaks to the host; nothing the host sets leaks in beyond the anchor variables we opt into.

---

## 2. `framework/kit/` — vanilla widget catalog

The kit is the vanilla replacement for the deleted Vue `drawSteelComponents/Common/` (F1 §2.5, F3 §3).
It is the **single source of accessible, themed primitives**: every element builds its controls from
the kit, so the a11y standard (§4) and token vocabulary (§6) are inherited for free — new elements are
accessible and on-theme by construction. Kit modules live in `src/framework/kit/` and **must not
import from `src/elements/`** (F1 OD-8 lint boundary).

**Shared conventions for every kit factory:**

- Signature shape: `widget(parent: HTMLElement, opts, owner: Component): Handle`. The `owner` is the
  calling `ElementView` (or a sub-component); the kit registers **all** listeners via
  `owner.registerDomEvent(...)` and any teardown via `owner.register(...)` (F1 §4.5) — callers never
  hand-wire `addEventListener` (this is what closes ML-3 and the 96 raw-listener sites).
- Returns a small typed **Handle** exposing the created root + imperative updates (e.g.
  `stepper.setValue(n)`, `collapsible.setOpen(b)`) so persisted elements update **in place** instead
  of `container.empty()` rebuilds (F1 §2.1.4; fixes CB-7).
- Emits only semantic HTML + ARIA (§4); consumes only `--dse-*` tokens; sets dynamic values only as
  scoped custom properties.

### 2.1 `iconButton` — the accessible control primitive
*Replaces:* `DsButton.vue`, and the **30-of-51 click-handling `<div>`/`<span>`** controls (MP-1).
F1 explicitly asked D2 to own this primitive so "new elements get it for free."

- **Purpose:** an icon and/or text button that is a real `<button>`. Used for malice ±, stamina ±,
  condition add/remove, turn indicator, counter ±, negotiation completes, modal actions, card
  copy-link, collapse toggles (via `collapsible`).
- **API:** `iconButton(parent, { icon?, label, text?, variant?, pressed?, disabled?, tooltip?, onClick }, owner)`
  — `icon` = a Lucide name for `setIcon`; `label` = **required** `aria-label` (icon-only) or accessible
  name; `variant` ∈ `default | accent | ghost | danger`; `pressed?` renders `aria-pressed` (toggles);
  `tooltip` calls the kit `tooltip()` (native `setTooltip`).
- **A11y:** native `<button>` (keyboard + Enter/Space free), `aria-label`, `:focus-visible` ring,
  **min 44×44 px hit area** via padding while the glyph stays small, real `disabled` property (fixes
  CB-8 — the "disabled" class alone let Enter through), `aria-pressed` for stateful toggles.
- **Classes:** `.dse-btn` (+ `.dse-btn--accent/--ghost/--danger`, `[data-pressed]`, `[disabled]`),
  `.dse-btn__icon`, `.dse-btn__text`.
- **Tokens:** `--dse-accent`, `--dse-accent-fg`, `--dse-hover`, `--dse-fg`, `--dse-fg-muted`,
  `--dse-danger`, `--dse-focus-ring`, `--dse-radius`, `--dse-touch-min`.
- **`buttonRow(parent, buttons[], owner)`** convenience → `.dse-btn-row` (modal footers, action bars).

### 2.2 `stepper` — labelled numeric ±
*Replaces:* `StaminaAdjustor.vue` and the ad-hoc `.stamina-adjust-btn` / counter / malice / patience ±
`<div>`s.

- **Purpose:** decrement / value / increment triad. Used by Counter, the stamina modals, Malice,
  Heroic-resource-style counters.
- **API:** `stepper(parent, { value, min?, max?, step?, editable?, label, format?, onChange }, owner)`
  → two `iconButton`s (`minus`/`plus`) around a value display or, when `editable`, an `<input
  type="number">`. Handle: `setValue`, `getValue`.
- **A11y:** `role="group"` + `aria-label`; buttons carry `aria-label="Decrease/Increase {label}"`;
  the value has `aria-live="polite"` so changes are announced; buttons auto-disable at min/max with
  the real property; editable input honors Enter/Escape without double-commit (fixes CB-10).
- **Classes:** `.dse-stepper`, `.dse-stepper__btn`, `.dse-stepper__value`, `.dse-stepper__input`.
- **Tokens:** inherits `iconButton`; `--dse-fg`, `--dse-surface-sunken`.

### 2.3 `collapsible` — the ComponentWrapper replacement
*Replaces:* `ComponentWrapper.vue` + `CollapsibleHeading.vue` + `ToggleIndicator.vue` +
`RightArrowToggleIndicator.vue` + `ComponentHideIndicator.vue`. **Preserves the `collapsible` /
`collapse_default` YAML keys** (F1 §1.4 behavioral contract).

- **Purpose:** a titled, optionally-collapsed region. Wraps Feature/Featureblock/Statblock/Skills and
  any element rendered with `collapsible: true`.
- **API:** `collapsible(parent, { title?, titleEl?, open, persistKey?, onToggle }, owner)` → header
  button + content region; returns `{ headerEl, contentEl, setOpen, isOpen }`. When `persistKey` is
  set it reads/writes open-state via `cx.session` (F1 §4.3) so collapse survives the echo-rebuild
  **without polluting the note** (this is the session-state migration path for Skills groups).
- **A11y:** header is a `<button aria-expanded>` with `aria-controls` → the region `id`; chevron via
  `setIcon("chevron-right")` rotates on open (CSS, `prefers-reduced-motion`-safe); region hidden with
  `hidden` attr (not `display:none` inline).
- **Classes:** `.dse-collapse`, `.dse-collapse__header`, `.dse-collapse__chevron`,
  `.dse-collapse__region`, `[data-open]`.
- **Tokens:** `--dse-surface-raised`, `--dse-border`, `--dse-fg`, `--dse-hover`, `--dse-focus-ring`.

### 2.4 `tabs` — accessible tablist
*New (Negotiation needs it; reusable for a future hero sheet).* Replaces the negotiation
`.ds-nt-action-tab` click-`div`s.

- **Purpose:** session-only tab switching (Negotiation "Make an Argument" / "Learn Motivation/Pitfall").
- **API:** `tabs(parent, { tabs: [{id,label,icon?}], selected, persistKey?, onSelect }, owner)` →
  tablist + panels; Handle `select(id)`.
- **A11y:** `role="tablist"` / `role="tab"` (`aria-selected`, roving `tabindex`) / `role="tabpanel"`
  (`aria-labelledby`); **arrow-key** navigation between tabs, Home/End; selection persisted via
  `cx.session` (`persistKey`) so the active tab survives rebuild (today it is written into YAML purely
  to survive re-render — this demotes it to session state).
- **Classes:** `.dse-tabs`, `.dse-tabs__tab` (`[aria-selected]`), `.dse-tabs__panel`.
- **Tokens:** `--dse-surface`, `--dse-surface-raised`, `--dse-border`, `--dse-accent`,
  `--dse-focus-ring`.

### 2.5 `tooltip` — thin wrapper over native
*Replaces:* `TooltipHover.vue`.

- **Purpose:** consistent, accessible, popout-safe hovers. **Wraps Obsidian `setTooltip`** — no custom
  tooltip DOM (native handles positioning, delay, keyboard focus, and popout window correctly).
- **API:** `tooltip(el, text, { placement? })`. Used everywhere `title=`/`el.title` is today (which
  gives no keyboard/AT exposure).
- **A11y:** `setTooltip` is focus-triggerable and AT-visible; where a control's *only* label is a
  tooltip, callers must **also** pass an `aria-label` (kit `iconButton` enforces this).
- **Tokens:** styled by Obsidian; DSE adds none.

### 2.6 `managedModal` — accessible modal base
*Replaces:* `Modal.vue` + `ModalProcessor` (Vue host); unifies the 5 DOM modals
(`StaminaEditModal`, `MinionStaminaPoolModal`, `ConditionSelectModal`, `CustomizeConditionModal`,
`ResetEncounterModal`).

- **Purpose:** a styled, lifecycle-correct Obsidian `Modal` with a standard title + scrollable body +
  footer button row, and the **view-unload-closes-modal** contract (F1 §4.5: the opening view calls
  `owner.register(() => modal.close())`).
- **API:** `class DseModal extends Modal` with `setDseTitle(text)`, `body: HTMLElement`,
  `footer(buttons)`; plus `openManagedModal(owner, factory)` which opens and registers auto-close.
- **A11y:** `aria-labelledby` → the title; initial focus to the first control; Escape closes (Obsidian
  default); focus trap (Obsidian default); footer built from `iconButton`s so actions are real
  buttons with real `disabled` (fixes CB-8 in modals).
- **Classes:** `.dse-modal`, `.dse-modal__title`, `.dse-modal__body`, `.dse-modal__footer`,
  `.dse-modal__section` (for the side-by-side apply/quick-mod panels).
- **Tokens:** `--dse-surface`, `--dse-border`, `--dse-fg`, `--dse-accent`, `--dse-radius`,
  `--dse-pad`.

### 2.7 `cardHead` — the 6-slot header builder
*New shared primitive — the biggest cross-element consistency lever.* Ports `DESIGN.md`'s unified
`.sc-head` (3-lane × 2-column) into DSE so statblock / featureblock / feature / negotiation share one
header grammar (they currently each hand-roll a `*-title-line` + `*-subtitle-line`).

- **Purpose:** render the positional header — `left-eyebrow / left-primary(name) / left-deck` stacked,
  `right-eyebrow / right-primary / right-deck` mirrored — so the same kind of field always lands in
  the same slot.
- **API:** `cardHead(parent, { leftEyebrow?, name, leftDeck?, rightEyebrow?, rightPrimary?, rightDeck?,
  crest? }, owner)`. Any slot omitted collapses to a gap (never a mislabeled placeholder).
- **A11y:** `name` renders as the card's heading (`role="heading"`/`aria-level` appropriate to nesting)
  so AT users get a landmark; not a control.
- **Classes:** `.dse-head` (grid), `.dse-head__eyebrow`, `.dse-head__primary`, `.dse-head__deck`,
  slot modifiers `--left/--right`, render-style modifiers `--line/--chip` (default right = chips).
- **Tokens:** `--dse-heading`, `--dse-fg-muted`, `--dse-surface-raised`, `--dse-chip-bg`,
  `--dse-border`; role/action accent via `--dse-role` / `--dse-act` inherited from the card root.
- **Per-card fill maps** live in each element's §3 subsection.

### 2.8 `powerRollPanel` + `tierBadge` — the shared roll grammar
*New primitive from existing code.* The `.tier-key-container` clip-path badges + tier lines currently
built inline by `FeatureView` and duplicated by Negotiation become one kit unit. Mirrors the site's
`.sc-ability__pr` / `.sc-ability__tier` panel.

- **Purpose:** render a titled "Power Roll + {chars}" panel with the four tier rows (`≤11 / 12-16 /
  17+ / crit`), each row = a badge + the outcome text. Used by Feature, Featureblock, Statblock
  abilities, and Negotiation (whose tiers are *clickable* — the panel supports a `selectable` mode).
- **API:** `powerRollPanel(parent, { chars?, rows: [{tier, md}], selectable?, selected?, onSelect? },
  owner)`; `tierBadge(parent, tier)` for standalone use.
- **A11y:** static by default; in `selectable` mode each row is a `<button aria-pressed>` in a
  `role="radiogroup"` (a roll resolves to exactly one tier) with arrow-key nav; the badge is not the
  only signal (row also shows the range text). Badge boxes keep the existing `clip-path` shapes.
- **Classes:** `.dse-pr`, `.dse-pr__head`, `.dse-pr__row` (`[data-tier="low|mid|high|crit"]`,
  `[aria-pressed]`), `.dse-pr__badge`, `.dse-pr__badge--t1/--t2/--t3/--crit`, `.dse-pr__text`.
- **Tokens:** `--dse-tier-low`, `--dse-tier-mid`, `--dse-tier-high`, `--dse-tier-crit`,
  `--dse-badge-fg`, `--dse-border`, `--dse-surface-sunken`, `--dse-focus-ring`.

### 2.9 `crest` — Steel-only heraldic ornament
*New, optional.* Mirrors `.sc-crest`.

- **Purpose:** the steel shield holding a category glyph on ability cards / statblock headers.
- **API:** `crest(parent, { icon, size? })` → shield `<span>` with a `setIcon` glyph.
- **Theme:** **Steel-only** — the Legacy theme renders it `display:none`, so today's look is unchanged.
  Degrades to nothing if no icon.
- **Classes:** `.dse-crest` (`.dse-crest--lg`), `.dse-crest__glyph`.
- **Tokens:** `--dse-metal-grad`, `--dse-metal-line`, `--dse-bevel`, `--dse-crest-shape` (clip-path).

### 2.10 `divider` — horizontal / vertical rule
*Replaces:* `HorizontalRule.vue` (also element #11), `VerticalRule.vue`, and the modal
`.vertical-divider` / `.horizontal-divider`.

- **API:** `divider(parent, { axis: "h"|"v", ornament?: boolean })`. `ornament:true` renders the ◆
  diamond rule (Steel); Legacy renders today's fade-line-with-diamond.
- **Classes:** `.dse-hr` (`.dse-hr__line--left/--right`, `.dse-hr__diamond`), `.dse-vr`.
- **Tokens:** `--dse-rule`, `--dse-rule-fade`, `--dse-metal-line`.

**Kit summary:** `iconButton`/`buttonRow`, `stepper`, `collapsible`, `tabs`, `tooltip`,
`managedModal`, `cardHead`, `powerRollPanel`/`tierBadge`, `crest`, `divider`. Ten primitives cover
every control and container the 11 elements + 5 modals need.

---

## 3. Per-element redesign

**Conventions.** Class prefix `dse-<id>__<part>` (BEM-ish), all scoped under
`[data-dse-element="<id>"]`. "Legacy value" = the token mapping D3 encodes so today's look is
reproduced (§6). "Before/after" notes call out the visible change; where the change is purely
structural/a11y (no visual diff) it says so. Elements are ordered by migration wave (F1 §6).

### 3.1 Horizontal Rule (`horizontal-rule`) — *static*
**Current:** `.ds-hr-container` = two fade lines + a rotated-diamond `.ds-hr-center` (Vue + dead DOM
twin). **Target:** identical visual via `divider(parent,{axis:"h",ornament:true})`.

- Classes: `.dse-hr`, `.dse-hr__line--left`, `.dse-hr__line--right`, `.dse-hr__diamond`.
- Tokens: `--dse-rule` (Legacy `var(--icon-color)`), `--dse-rule-fade`.
- Before/after: **no visual change**; kills the last Vue component and the DOM twin, and the ◆ becomes
  the shared motif the Steel theme can polish to match the site's `hr`.

### 3.2 Values Row (`values-row`) & 3.3 Characteristics (`characteristics`) — *static*
**Current:** `.ds-values-row-container` / `.ds-characteristics-container` — a flex row of centered
cells, big bold value over a muted name; `value_height`/`name_height` YAML scale the font **inline**
(CounterView-style). **Target:** same layout, tokenized, font-scale via a **scoped custom property**.

```
┌──────────────────────────────────────────────┐   ← .dse-statgrid  (shared by both)
│    +2         +1        -1        +3        0   │   ← .dse-statgrid__value  (var(--dse-value-scale))
│  Might     Agility   Reason  Intuition  Presence│  ← .dse-statgrid__label
└──────────────────────────────────────────────┘
```

- **Unify** the two near-identical elements onto one `.dse-statgrid` grammar (`data-dse-element`
  distinguishes them). Cells become a `minmax` grid that wraps on mobile (today's `@media` column
  flip preserved).
- Classes: `.dse-statgrid`, `.dse-statgrid__cell`, `.dse-statgrid__value`, `.dse-statgrid__label`.
- Tokens: `--dse-fg` (value), `--dse-fg-muted` (label), `--dse-surface` (Steel adds the framed
  "engraved plate" look; Legacy is the current bare row).
- **SC-5 eviction:** `value_height`/`name_height` → `el.style.setProperty("--dse-value-scale", n)`
  (numeric geometry, sanctioned) instead of inline `font-size`.
- Before/after: no layout change; Steel theme optionally frames the row as a small steel plate (the
  screenshots already show a faint framed panel — formalized as a token).

### 3.4 Skills (`skills`) — *interactive (session)*
**Current:** `.ds-skills-container` → per-group `.ds-skill-group` (title + `.ds-skill-list`), each
`.ds-skill-item` = a `.ds-skill-indicator` box (`enabled`/`disabled`) + name (Vue + dead twin). Groups
are **not** collapsible today. **Target:** same list, groups wrapped in the kit `collapsible` with
session-persisted open state; the indicator becomes a real, non-interactive status marker (skills are
read-only display here) or, if a group is a picker, a checkbox.

```
▾ Interpersonal                         ← .dse-collapse__header (button, aria-expanded)
   ◼ Brag        ◻ Empathize   ◻ Flirt  ← .dse-skills__item  ( ◼ = .dse-skills__mark[data-on] )
   ◼ Dance       ◻ Gamble      ◻ Lead
```

- Classes: `.dse-skills`, `.dse-skills__group`, `.dse-skills__item`, `.dse-skills__mark[data-on]`,
  `.dse-skills__name`.
- Tokens: `--dse-accent` (marked/enabled), `--dse-border`, `--dse-fg`, `--dse-fg-muted`.
- A11y: the marked state is conveyed by shape **and** an `aria-label`/`aria-pressed` if interactive,
  not color alone.
- Before/after: adds optional collapsible groups (matches the screenshot's category structure); second
  Vue kill.

### 3.5 Stamina Bar (`stamina-bar`) — *persisted* · **the SC-5 epicenter**
**Current (Vue):** a horizontal bar — green left fill, blue temp-stamina right fill, a hatched overlay,
`Winded`/`Dying` threshold labels, `(current (+temp)/max)` text; edit opens a modal. Colors
(`limegreen`, `deepskyblue`, `yellow`, `red`) and fill widths are **inline** — this and the two
initiative modals are where most of the 65 `.style.*` sites live. **Target:** visually equivalent bar,
every color a **semantic stamina token**, every width a **scoped custom property**.

```
┌──────────────────────────────────────────────────────────┐
│▓▓▓▓ Dying │██████████ Winded ███████│▓▓▓▓ temp ▓│  15/20 +5│
└──────────────────────────────────────────────────────────┘
 └ dying zone   └ healthy fill (state-colored)  └ temp overlay   └ numeric
```

- Classes: `.dse-stamina`, `.dse-stamina__track`, `.dse-stamina__fill` (`[data-state="healthy|winded|
  dying"]`), `.dse-stamina__temp`, `.dse-stamina__threshold` (winded/dying ticks), `.dse-stamina__num`.
- Tokens: `--dse-stamina-healthy` (Legacy `limegreen`), `--dse-stamina-winded` (`yellow`),
  `--dse-stamina-dying` (`red`), `--dse-stamina-temp` (`deepskyblue`), `--dse-stamina-track`
  (`var(--code-background)`). (These formalize the existing `:root --stamina-bar-color*` block.)
- **SC-5 eviction:** fill width → `--dse-fill`; overlay width → `--dse-temp-fill`; **state color via
  `[data-state]` class**, never `el.style.color`. Threshold labels are CSS `::before`/positioned
  children, not inline.
- Edit modal → `managedModal` (see §3.5b). In-place `stepper` for numeric adjust; the bar updates via
  its Handle (`setValue`) — no rebuild.
- Before/after: no intended visual change; the bar becomes fully themeable (Steel can render it as a
  segmented steel gauge) and reduced-motion-safe.

### 3.5b Stamina modals (`StaminaEditModal`, `MinionStaminaPoolModal`) — unify
The two modals are ~90% identical (a bar + a `stepper` + Apply-damage/heal rows + quick-action
buttons + optional temp-stamina/minion-list). **Target:** one `managedModal` template with an optional
minion-list section, all controls from `iconButton`/`stepper`.

```
┌─ Xentis Stamina ───────────────────────────── ✕ ┐
│ ▓▓ Dying ██████████ Winded ████████▓ temp ▓      │
│                                                   │
│  Apply [   0 ]     ⊖ 12 /13 ⊕      [☠ Kill]       │  ← stepper + iconButtons
│  [✎ Damage]        Temporary                       │
│  [＋ Healing]      ⊖ [ 0 ] ⊕       [＋ Full Heal]  │
│                                    [✎ Spend Recov] │
│  [↺ Reset]                       [ Gain 2 Stamina ]│  ← .dse-modal__footer (accent)
└───────────────────────────────────────────────────┘
```

- Classes: `.dse-modal` scaffold + `.dse-sedit__apply`, `.dse-sedit__quick`, `.dse-sedit__temp`,
  `.dse-sedit__minions` (minion pool only).
- Tokens: `--dse-accent` (primary action), `--dse-danger` (Kill), `--dse-warn` (the "select minions"
  warning icon, Legacy `orange`), `--dse-stamina-*` (bar), plus modal surface tokens.
- **SC-5 eviction:** the ~30 `.style.*` sites across these two modals (bar widths + colors, button
  disabled styling, minion-checkbox `crimson`) → classes + `--dse-fill` + `[data-state]`; the
  checked-minion `crimson` → `.dse-minion__check:checked ~ * { color: var(--dse-danger) }`.
- **CB-8 fix rides along:** action buttons are real `<button>`s with the `disabled` property.

### 3.6 Feature / Ability (`feature`) — *static* · SDK-backed
**Current:** `.ds-feature-ele-container` (code-bg panel, indent levels) → `.ds-feature-header-line`
(name / cost), ability-type, flavor (italic), keyword/type/distance/target detail table, the power-roll
tier lines (`.ds-pr-tier-line` + `.tier-key-container`), effect/notes. **Target:** re-cast onto the
site's **ability-card** grammar — a `cardHead` + a `powerRollPanel` + titled `section` panels — with an
**action-type accent spine**.

```
◈  Whip & Magic Longsword           Signature · Main Action   ← cardHead: crest(steel) | name | right slots
   Keywords: Attack, Magic, Melee, Weapon    Type: Action
   Distance: Reach 1                        Target: Two enemies
   ┌ Power Roll + Might ──────────────────────────────────┐   ← .dse-pr (powerRollPanel)
   │ ⟦≤11⟧  5 damage; pull 1                                │
   │ ⟦12-16⟧ 9 damage; pull 2                               │
   │ ⟦17+⟧  12 damage; pull 3                               │
   │ ⟦crit⟧ 12 damage; pull 3; another action              │
   └───────────────────────────────────────────────────────┘
   ▎Effect  A target adjacent after the attack takes 9…      ← .dse-section (titled panel)
```

- Classes: `.dse-feature` (`[data-dse-act]` sets the spine), `.dse-feature__meta` (the KW/type/dist/
  target grid → reuse `.dse-head` deck or a 2-col `.dse-kv` grid), `.dse-feature__flavor`, `.dse-pr`,
  `.dse-section` (Effect/Trigger/Special), `.dse-feature__flat` (flat-list feature style, D4 pref).
  Keep `.indent-N` for the nested-ability indentation (F1 preserves it).
- Tokens: action accent `--dse-act-main/-maneuver/-triggered/-move/-none/-trait` (Legacy: no accent —
  the spine is Steel-only, so Legacy stays monochrome as today); `--dse-tier-*`, `--dse-surface`,
  `--dse-surface-sunken`, `--dse-heading`, `--dse-fg`.
- A11y/leaks: markdown via `this.renderMarkdown` (fixes ML-1); no interactive controls (static).
- Before/after: **Legacy = today's look**; Steel adds the crest + colored action spine + titled Effect
  panels, matching the v2 ability card without changing a word.

### 3.7 Featureblock (`featureblock`) — *static* · SDK-backed
**Current:** `.ds-fb-container` = header (name / "Malice Features" or "Level 2 Hazard Hexer" + EV),
italic flavor, loose-stat header (`.ds-fb-stats`), ◆ rule, then a list of features. **Target:** the
site's **Forged Band** card (`.fb-wrap`): a `cardHead` + a `data-fb-stats` stat header (grid/ledger
pref) + feature list reusing §3.6's feature grammar; **role-tinted** via `data-dse-role`.

- cardHead fill: `left-eyebrow` = kind-noun (e.g. "Dynamic Terrain" / "Malice Features"),
  `left-primary` = name, `right-eyebrow` = Level, `right-primary` = role/category, `right-deck` = EV.
- Classes: `.dse-fb` (`[data-dse-role]`, `[data-dse-fb-stats="grid|ledger"]`), `.dse-fb__flavor`,
  `.dse-fb__stats`, `.dse-fb__band--adv` (Level>0 advancement band, mirrors the site), feature children
  reuse `.dse-feature`/`.dse-pr`.
- Tokens: `--dse-role-*` family (Legacy: leader-grey → effectively today's monochrome), `--dse-surface`,
  `--dse-surface-raised`, `--dse-fg`.
- Before/after: Legacy unchanged; Steel adds the role accent + forged band header. Note the
  **featureblock render subsystem is in flux** (MEMORY: featureblock-refactor-in-flight) — treat
  overlaps with that work as coordination points, not rewrites.

### 3.8 Statblock (`statblock`) — *static* (OD-7: stays static) · SDK-backed
**Current:** `.ds-sb-container` = title/subtitle band, info lines (Stamina/Speed/EV/Immunity/Size),
characteristics row, ◆ rules between feature groups, then features. **Target:** align to the site's
statblock header + a **combat-role accent** (`data-dse-role`), density pref, and the shared feature
grammar — the highest-value redesign because it is the most-consulted element mid-combat.

```
◈ HUMAN BANDIT CHIEF                         Level 3 · Boss ┃  ← cardHead + role spine (data-dse-role)
   Human, Humanoid                                  EV 54
   Stamina 120   Speed 5      Immunity Magic 2, Psionic 2
                              Size 1M / Stability 2  Free Strike 5
   ── Might +2   Agility +2   Reason −1  Intuition +2  Presence +2 ──
   ◆──────────────────────────────────────────────────────────◆
   ▎End Effect  At the end of their turn…                        ← .dse-section
   Whip & Magic Longsword  (feature grammar from §3.6)
```

- cardHead fill (matches DESIGN.md's statblock model exactly): `left-eyebrow` = ancestry/keywords line,
  `left-primary` = name, `right-eyebrow` = Level, `right-primary` = Org · Role, `right-deck` = EV.
- Classes: `.dse-sb` (`[data-dse-role]`, `[data-dse-density="comfortable|compact"]`,
  `[data-dse-sb-featstyle="card|flat"]`), `.dse-sb__meta` (the info grid), `.dse-sb__chars`
  (characteristics), `.dse-section`, features reuse `.dse-feature`.
- Tokens: `--dse-role-*` (spine + header tint; Legacy grey = today's monochrome), `--dse-surface`,
  `--dse-surface-raised`, `--dse-heading`, `--dse-fg`, `--dse-fg-muted`.
- Prefs consumed (D4): `data-dse-density`, `data-dse-sb-featstyle` (mirrors the site's `data-sb-*`).
- Before/after: Legacy = today; Steel adds the role-colored spine + tightened header. **No word/number
  changes** (the community-controversial layout constraint from DESIGN.md is honored — we change design
  only). OD-2 covers whether the role accent ships in Legacy too.

### 3.9 Counter (`counter`) — *persisted*
**Current:** `.ds-counter-container` = big value + name, two chevron `.ds-counter-button`s, inline edit
input; `value_height`/`name_height` inline font-size. **Target:** value display + kit `stepper`;
font-scale via `--dse-value-scale`.

```
   ┌─────────────┐   ┌───┐
   │      3      │   │ ▲ │    ← .dse-counter__value (var(--dse-value-scale))
   │    Piety    │   │ ▼ │    ← stepper (iconButtons, real disabled at min/max)
   └─────────────┘   └───┘
```

- Classes: `.dse-counter`, `.dse-counter__value`, `.dse-counter__name`, kit `.dse-stepper`.
- Tokens: `--dse-fg`, `--dse-fg-muted`, `--dse-surface`, `--dse-accent`.
- **SC-5 eviction:** `CounterView.ts:29,43,114-115,146` inline sizes/display → `--dse-value-scale` +
  classes. **CB-10 fix:** editable value uses the `stepper` editable input with the single-commit
  guard.
- Before/after: no visual change; buttons become keyboard/AT-accessible with real disabled state.

### 3.10 Negotiation Tracker (`negotiation`) — *persisted + session tabs*
**Current:** `.ds-nt-container` = header, a **Patience** bubble track, an **Interest** ladder
(clickable bubbles), a two-tab area ("Make an Argument" / "Learn Motivation-Pitfall") of click-`div`
tabs, a clickable power-roll tier panel, motivations/pitfalls lists. Lots of click-`div`s. **Target:**
same information architecture, rebuilt on kit `cardHead` + `tabs` + `powerRollPanel(selectable)` +
`stepper`-style bubble tracks; every clickable bubble/tier/tab becomes a real control.

- Classes: `.dse-nt`, `.dse-nt__patience` (bubbles = `iconButton`/`aria-pressed`), `.dse-nt__interest`
  (ladder rows, current row highlighted via accent glow token), `.dse-tabs` (Make/Learn),
  `.dse-nt__argument`, `.dse-pr` (selectable tiers → `role="radiogroup"`), `.dse-nt__motivations`.
- Tokens: `--dse-accent` (current-interest glow, selected tab), `--dse-tier-*`, `--dse-border`,
  `--dse-surface`, `--dse-fg-faint` (faded/reached rungs), `--dse-focus-ring`.
- A11y: this element has the most click-`div`s — Patience/Interest bubbles, tabs, and tier rows all
  become keyboard-operable; tab state and current-tab move to `cx.session` (§2.4), demoting the
  YAML-persisted UI state.
- **CB-4 fix** (de-singletoned reset) lands in the view rewrite; **CB-16** (dangling "Negotiation: ")
  fixed by the cardHead name slot.
- Before/after: visually close to today; the biggest win is a fully keyboard-navigable negotiation.

### 3.11 Initiative Tracker (`initiative`) — *persisted* · **the a11y epicenter**
**Current:** the 533-line processor — a top action bar, Heroes list, Enemy Groups with a per-instance
**creature grid**, per-actor **turn indicator** (click-`div`, green when taken), **Malice** ± chevrons
(`setText`-based, CB-7), **condition icons** (click-`div`s), stamina numbers colored inline
(`red`/`green`), portraits, and the two stamina modals. This is where MP-1 concentrates. **Target:**
same layout, every control from the kit, colors tokenized, portraits toggleable.

```
[↺ Reset Round]                                              ← buttonRow
HEROES
 ⬢ Xentis   ◇ ✋ [+cond]                         10/13        ← turn indicator = iconButton(aria-pressed)
 · Elina    ✋ [+cond]                       80 (+11)/100      ← stamina state-colored via token
ENEMY GROUPS                                          VP: 3
 ⬢ Goblin Team Six
    Goblin Assassin #3  [+cond]                        7/10
    ┌────┐┌────┐┌────┐┌────┐┌────┐                          ← creature grid (cells = buttons)
    │5/5 ││0/5 ││0/10││10/…││ 7/…│  ← selected via .selected + aria-pressed, not just #D50000 ring
    └────┘└────┘└────┘└────┘└────┘
```

- Classes: `.dse-init`, `.dse-init__actionbar`, `.dse-init__group` (Heroes/Enemies), `.dse-init__row`,
  `.dse-init__turn` (`aria-pressed`, `[data-taken]`), `.dse-init__malice` (kit `stepper`),
  `.dse-init__vp`, `.dse-init__grid`, `.dse-init__cell` (`aria-pressed`, `[data-selected]`),
  `.dse-init__stamina` (`[data-state]`), `.dse-init__conditions`, `.dse-cond` (icon +
  `--dse-condition-color`).
- Tokens: `--dse-turn-done` (Legacy `limegreen`), `--dse-select` (Legacy `#D50000`), `--dse-malice`
  (Legacy `red`), `--dse-vp` (Legacy orange), `--dse-stamina-*` (row numbers), `--dse-surface`,
  `--dse-hairline-fade` (the top-left border-fade ornament on rows → Steel keeps it, Legacy = today).
- **SC-5 eviction:** `initiativeProcessor.ts:435,439,457-461` stamina `red`/`green` →
  `.dse-init__stamina[data-state]`; selected-cell `#D50000` → `.dse-init__cell[data-selected]` token;
  grid widths stay geometry.
- **CB-7 fix:** Malice ± via `stepper` updates only the value element (no `setText` wiping the
  chevrons). **CB-6 fix:** cells tagged `data-instance-key` for correct in-place refresh.
- Pref consumed (D4): `data-dse-portraits` (on/off) to hide the 50–60 px images for a dense tracker.
- Before/after: visually today's tracker; every one of its click-`div`s becomes a real, labelled,
  focus-visible, 44 px control. Migrates **last** (F1 §6) onto the by-then-proven kit.

### 3.x Shared modals (Condition / Customize / Reset)
`ConditionSelectModal`, `CustomizeConditionModal`, `ResetEncounterModal` all move onto `managedModal`.
Condition list items become `iconButton`/checkbox rows (`.dse-cond-item[aria-selected]`); the
customize color input keeps its native `<input type="color">` but the **preview** uses
`--dse-condition-color` (validated per SD-2), not `el.style.color`. The customize cog reveals on hover
**and** focus (a11y).

---

## 4. Accessibility standard (framework default)

The audit found **0 `aria-*`, 0 `tabindex`, 0 `:focus` styles**, and **30 of 51 click handlers on
non-semantic `<div>`/`<span>`**, with icon targets at 20–30 px. Because every control is now built by
the kit, the standard below is a **framework default, not a per-element checklist** — an element that
uses the kit is compliant by construction. (Resolves MP-1 / SC-6.)

1. **Semantic elements.** Controls are `<button>`, `<input>`, `<a>`, `<select>`. Non-semantic controls
   are prohibited; if unavoidable, they carry `role` + `tabindex="0"` + Enter/Space handlers (the kit
   never emits these — it always uses real elements).
2. **Accessible names.** Every icon-only control has an `aria-label`; `title=`/`el.title` is replaced
   by the kit `tooltip` (`setTooltip`), and a tooltip is never the *only* name.
3. **State exposure.** Toggles use `aria-pressed` (turn indicator, tier/bubble selection); collapsibles
   `aria-expanded` + `aria-controls`; tabs the full `tablist/tab/tabpanel` set; disabled controls the
   real `disabled` property (not a `pointer-events:none` class — fixes CB-8).
4. **Keyboard.** All controls reachable and operable by keyboard; tabs/radiogroups get arrow-key +
   Home/End roving focus; modals trap focus and Escape-close (Obsidian `Modal`).
5. **Focus-visible.** A framework default `:focus-visible { outline: 2px solid var(--dse-focus-ring);
   outline-offset: 2px; }` on every kit control (there are **zero** focus styles today).
6. **Touch targets ≥ 44 × 44 px.** Enforced by `iconButton` padding (`--dse-touch-min`) while the glyph
   stays small; `isDesktopOnly:false` makes this a real mobile requirement.
7. **Color is never the sole signal.** Tier badges pair color with the range text; taken-turn pairs
   green with a check glyph + `aria-pressed`; stamina state pairs color with the numeric value.
8. **Live updates announced.** Value displays that change on interaction (stamina, counter, malice) use
   `aria-live="polite"`.
9. **Motion.** `@media (prefers-reduced-motion: reduce)` disables the condition-effect animations
   (blink/pulse/glow/breathing) and chevron rotation; D4 may add a `data-dse-motion` override.
10. **Popout / cross-window safe** (inherited from F1): timers/tooltips resolve against the view's own
    window; no bare `window`/`document`.

---

## 5. Inline-style eviction map (SC-5 → classes + tokens)

**Rule.** Color, `display`, `visibility`, `background`, `border`, `border-radius` → **classes** keyed
to `--dse-*` tokens. **Only dynamic geometry/per-datum values** survive as **scoped CSS custom
properties** set via `el.style.setProperty("--dse-*", v)`: fill widths (`--dse-fill`,
`--dse-temp-fill`), font scales (`--dse-value-scale`), and validated per-item colors
(`--dse-condition-color`). `el.style.color = "..."` and hardcoded color literals are **banned** (lint
via the F3 harness). The 65 sites map as follows:

| Site (file:line) | Today (inline) | Becomes |
|---|---|---|
| `initiativeProcessor.ts:435,439,457-461` | `.style.color = 'red'/'green'` on stamina, cell widths | `.dse-init__stamina[data-state]` + `--dse-stamina-*`; widths → `--dse-fill` |
| `initiativeProcessor.ts` selected cell | `#D50000` ring (in CSS) + inline | `.dse-init__cell[data-selected]` + `--dse-select` |
| `initiativeProcessor.ts:116-130` (CB-7) | malice `setText` (wipes children) | `stepper` updates `.dse-init__malice-value` only |
| `MinionStaminaPoolModal.ts:259-292` | bar fills + colors (`limegreen`/`deepskyblue`), `crimson` checks | `.dse-stamina__fill[data-state]` + `--dse-fill`; `--dse-danger` |
| `MinionStaminaPoolModal.ts:436` | condition `style.color` (user input) | `--dse-condition-color` (validated, SD-2) |
| `StaminaEditModal.ts:287-307` | bar fills/colors, temp overlay | `[data-state]` + `--dse-fill`/`--dse-temp-fill` + `--dse-stamina-*` |
| `StaminaBarView.ts` / `StaminaBar.vue` | `limegreen`/`yellow`/`red`/`deepskyblue`, widths | `.dse-stamina__fill[data-state]` + tokens + `--dse-fill` |
| `CounterView.ts:29,43,114-115,146` | inline `font-size`, display toggles | `--dse-value-scale` + `.dse-counter__*` classes |
| `CustomizeConditionModal.ts:80` | preview `style.color` | `--dse-condition-color` (validated) |
| `styles-source.css` literals (`limegreen` ×3, `deepskyblue` ×2, `crimson`, `#D50000`, `red`, `orange`, `yellow`) | hardcoded in sheet | replaced by `--dse-*` tokens D3 defines (§6) |

Net effect: DSE ships **zero** color literals and **zero** `el.style.color`; the only `el.style.*`
calls are `setProperty` of a `--dse-*` custom property.

---

## 6. Hand-off to D3 — `--dse-*` token names (values are D3's)

D2 defines the **semantic class → token name** mapping and the **Legacy** value (so D3 can reproduce
today's look); **D3 owns the actual values, the Steel variants, both color schemes, and theme
membership**, and authors the `styles-source.css` (or successor) token block. All tokens are scoped so
the Legacy defaults sit under `[data-dse-theme="legacy"]` (or the un-themed default) and Steel overrides
under `[data-dse-theme="steel"]`, mirroring the site's `--md-*` → `--fx-*` layering.

**Structure / surface** (Legacy → Obsidian var):
`--dse-surface` (`--code-background`), `--dse-surface-raised` (`--color-base-25`), `--dse-surface-sunken`
(`rgba(0,0,0,.2)`), `--dse-border` (`--background-modifier-border`), `--dse-border-strong`
(`--text-normal`), `--dse-radius` (`5px`), `--dse-pad` (`1rem`), `--dse-hover`
(`--background-modifier-hover`), `--dse-hairline-fade` (the `.ds-container` top-left gradient),
`--dse-touch-min` (`44px`).

**Text:** `--dse-heading` (`--text-normal` bold), `--dse-fg` (`--text-normal`), `--dse-fg-muted`
(`--text-muted`), `--dse-fg-faint` (`--text-faint`), `--dse-font-display` (`--font-text`; Steel may map
to a serif stack), `--dse-font-mono` (`--font-monospace`), `--dse-chip-bg` (`--tag-background`).

**Accent / interaction:** `--dse-accent` (`--interactive-accent`), `--dse-accent-fg` (`--text-on-accent`),
`--dse-focus-ring` (`--interactive-accent`), `--dse-select` (`#D50000` — initiative selected cell).

**Steel ornament** (Legacy = flat/`none`; Steel = the `--fx-*` analogs): `--dse-metal-grad`,
`--dse-metal-line`, `--dse-metal-faint`, `--dse-bevel`, `--dse-emboss`, `--dse-card-bg`,
`--dse-crest-shape`, `--dse-rule` (`--icon-color`), `--dse-rule-fade`.

**Semantic — game meaning** (the SC-5 color literals, now named):
- Power-roll tiers: `--dse-tier-low`, `--dse-tier-mid`, `--dse-tier-high`, `--dse-tier-crit`
  (Steel = `--sc-tier-*` parity; Legacy = today's monochrome badges).
- Stamina: `--dse-stamina-healthy` (`limegreen`), `--dse-stamina-winded` (`yellow`),
  `--dse-stamina-dying` (`red`), `--dse-stamina-temp` (`deepskyblue`), `--dse-stamina-track`
  (`--code-background`).
- Encounter: `--dse-turn-done` (`limegreen`), `--dse-malice` (`red`), `--dse-vp` (orange),
  `--dse-warn` (`orange`), `--dse-danger` (`crimson`).
- Combat-role accents `--dse-role-{ambusher,harrier,artillery,brute,controller,hexer,mount,support,
  defender,leader,solo,minion}` (Steel = `--sc-role-*` parity; **Legacy = leader-grey for all**, i.e.
  today's monochrome). Set on `.dse-sb`/`.dse-fb` via `data-dse-role`.
- Ability action-type accents `--dse-act-{main,maneuver,triggered,move,none,trait}` (Steel = `--sc-act-*`
  parity; **Legacy = none** — the spine is Steel-only, so Legacy features stay monochrome). Set via
  `data-dse-act`.

**Ask to D3:** finalize these ~45 token names into a `DseTokenName` union (F1 §3.5), encode the Legacy
column verbatim (so `[data-dse-theme="legacy"]` ≡ today) and the Steel column against DESIGN.md, and
confirm OD-2 (do role/action accents also ship in Legacy, or Steel-only?).

## 6b. Hand-off to D4 — `data-dse-*` pref attributes consumed

D2 defines the **attribute name + the CSS reflow** it drives; **D4 owns the pref catalog, defaults, and
the settings UI** (augments `DsePrefs`, supplies `PrefDescriptor`s, F1 §3.6). Each attribute is
reflected onto element roots by `PreferenceStore.reflect` and reflows one DOM (site pattern).

| Attribute | Values (default) | Reflows | Element(s) |
|---|---|---|---|
| `data-dse-density` | `comfortable` / `compact` | line padding, font scale of stat rows | statblock, featureblock, feature |
| `data-dse-sb-featstyle` | `card` / `flat` | statblock feature rendering (mirrors site `data-sb-featstyle`) | statblock, featureblock |
| `data-dse-portraits` | `on` / `off` | show/hide creature & hero images | initiative |
| `data-dse-motion` | `full` / `reduced` | force-disable condition-effect animations | initiative, conditions |
| `data-dse-crest` | `on` / `off` | show/hide the Steel heraldic crest | feature, statblock, featureblock |

(`data-dse-theme` is D3's, not a D4 pref, but is the same reflection mechanism.) **Ask to D4:** own the
defaults + settings rows for these; confirm whether density should be per-element-overridable (like the
site's per-part statblock prefs) or a single global.

---

## 7. Open Decisions — needs Scott

- **OD-1 — Class vocabulary.** Adopt a fresh `dse-*` BEM vocabulary (clean, consistent, this-is-a-
  rewrite) vs. preserve today's `ds-*` class names (lets D3 port the Legacy sheet with near-zero
  selector churn). **Recommendation:** fresh `dse-*`; D3 authors both themes against the new DOM anyway,
  and consistent names pay off across 11 elements + kit. (Cost: the Legacy sheet is a re-expression, not
  a copy.)
- **OD-2 — Semantic accents in Legacy.** Do the new combat-role (`--dse-role`) and action-type
  (`--dse-act`) accents ship in the **Legacy** theme too, or Steel-only? Legacy today is monochrome;
  adding a colored spine changes the "backwards-compatible look." **Recommendation:** **Steel-only** —
  keep Legacy byte-faithful to today, let Steel carry all semantic color (honors "Legacy = today").
- **OD-3 — Hover-lift.** DESIGN.md cards lift on hover; in a reading note that reads as jitter.
  **Recommendation:** **no lift** for in-note blocks — hover = teal border + faint wash only (as today);
  reserve lift for any future index/preview surfaces.
- **OD-4 — Display font.** No commercial brand faces (Beaufort/Newzald/Berlingske) or DrawSteelGlyphs
  webfont in-vault. **Recommendation:** `--dse-font-display` maps to Obsidian's own text font by default;
  Steel *may* map headings to a generic serif stack (`"Source Serif 4", Georgia, serif`) — **never
  bundle/​@font-face commercial fonts**. Tier badges stay CSS `clip-path` (no font needed).
- **OD-5 — Statblock role accent source.** Role accent needs a role→hue mapping; the SDK statblock
  exposes org/role. Confirm the role string is reliably present (F2 SDK 3.x) so `data-dse-role` can be
  set; otherwise the spine falls back to leader-grey. **Recommendation:** derive from SDK role, grey
  fallback.
- **OD-6 — Unify the stamina modals.** Collapse `StaminaEditModal` + `MinionStaminaPoolModal` into one
  `managedModal` template with an optional minion-list section (§3.5b). **Recommendation:** yes — ~90%
  shared; halves the SC-5 surface and the a11y sweep.
- **OD-7 — Session-demotion of UI state.** Negotiation active-tab and initiative selected-cell are
  written into the note today purely to survive the echo-rebuild; the kit's `cx.session` persistence
  lets them move out of the document (cleaner notes). This overlaps F1 OD-5. **Recommendation:** keep
  writing them through migration (compat), demote to `cx.session` in a follow-up.
- **OD-8 — Condition-color validation.** User `color:` is applied to a `--dse-condition-color` custom
  property; validate with `CSS.supports('color', v)` and fall back to a token (SD-2). **Recommendation:**
  validate + fall back to `--dse-fg-muted`.

---

*Cross-references: F1 §2.5 (kit lives here), §3.3 (`ElementView.onMount`), §3.5 (`ThemeService.cssVar`,
`data-dse-element` scoping), §3.6 (`PreferenceStore.reflect`, `data-dse-*`); F3 SC-5 / MP-1 / SC-6 /
CB-7 / CB-8; workspace `DESIGN.md` (High-Fantasy Steel language, 6-slot card header, token layering);
`draw-steel-elements/styles-source.css` (today's class + color inventory this spec re-expresses).*
