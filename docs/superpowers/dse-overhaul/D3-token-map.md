# D3 Token Reconciliation Map — the authoritative `--dse-*` value table

**Status:** authored (D3 Plan 10, Task 1) — awaiting Scott's review of the flagged proposals
**Date:** 2026-07-06
**Plan:** `plans/2026-07-06-plan-10-d3-theming.md` · **Spec (intent):** `D3-theming-print-spec.md` §1.2/§1.4
**Pinned by:** `draw-steel-elements/test/dom/framework/token-coverage.test.ts` (one row per
`DSE_TOKEN_NAMES` member, no missing/extra; Task 6 extends it into the full build guard)

This map is the **single source of truth for Tasks 3–5** (the Steel, Steel-light, and Print CSS
value blocks are authored FROM these columns — never from the spec's §1.2 tables directly, which
predate D2 and use different token names). It resolves the D2↔D3 name mismatch per the plan's
Global-Constraints reconciliation table and pins one value per theme for every one of D2's
**64** actual `DSE_TOKEN_NAMES` (`src/framework/tokens.ts`; the plan's "67" is a stale count —
`test/dom/kit/tokens.test.ts` pins `DSE_TOKEN_NAMES.length === 64`).

Conventions:

- **Legacy** column = the value **verbatim** from the shipped `:root` base block in
  `styles-source.css` (D2 Task 1; lines ~1866–1985). Legacy is DONE — this column is a record,
  not a to-do. Where it differs from what the spec assumed, the difference is footnoted.
- **Steel (dark)** is the signature ground; **Steel light** is listed only where the value
  shifts under `.theme-light` (blank = same value in both schemes).
- `var(--sc-*, #hex)` **forward-compat chaining** is used exactly where
  `v2/docs/stylesheets/palette.css` defines the `--sc-*` var (roles, ability hues, tiers,
  `--sc-steel`). The `#hex` fallback is what actually resolves inside Obsidian. **D3 owns a
  documented MANUAL sync** with `palette.css` (OD-6) — if the site palette changes, the Steel
  block (and this map) are updated by hand.
- **Print** composes over whichever theme is active (spec §5). ⚠ **Print-layer scoping caveat
  (Task 5 must honor):** Legacy renders role spines grey and NO act spine — a print override
  that colorizes `role-*`/`act-*` unconditionally would add color/spines to a *Legacy* print.
  Task 5 scopes the semantic (`role-*`/`act-*`) print values to compose with Steel only
  (`[data-dse-theme="steel"]` + print), so a Legacy print stays monochrome. Neutral ink-economy
  overrides (surfaces, fg, ornament-off) apply to both themes.
- "= Legacy (theme-invariant)" = the token is deliberately absent from the Steel block (the
  base value flows through); "= Legacy" in Print = no print override needed.

## Structure / surface

| Token | D3-spec concept | Legacy (verbatim) | Steel (dark) | Steel light | Print |
|---|---|---|---|---|---|
| `--dse-surface` | §1.2-A `surface` | `var(--code-background)` | `#1a1e21` | `#f6f8f8` | `#fff` |
| `--dse-surface-raised` | §1.2-A `surface-raised` | `var(--color-base-25)` | `#22272b` | `#edf0f0` | `#fff` |
| `--dse-surface-sunken` | §1.2-A `surface-sunken` ¹ | `rgba(0,0,0,.2)` | `rgba(0,0,0,0.18)` | `rgba(0,0,0,0.02)` | `#fff` |
| `--dse-page-bg` | D2 extra (divider punch-out) ² | `var(--background-primary)` | = Legacy (theme-invariant) | | `#fff` |
| `--dse-border` | §1.2-B `border-muted` (D2's default hairline) ³ | `var(--background-modifier-border)` | `rgba(220,226,230,0.12)` | `#c8cdd0` | `#ccc` |
| `--dse-border-strong` | §1.2-B `border` (solid card edges) ³ | `var(--text-normal)` | `rgba(220,226,230,0.24)` | `#8e959a` | `#999` |
| `--dse-radius` | §1.2-B `radius` | `5px` | `0.4em` (DESIGN.md card radius) | | `0` |
| `--dse-pad` | §1.2-K `pad` | `1rem` | = Legacy (theme-invariant) | | `0.4em` |
| `--dse-hover` | §1.2-A `surface-hover` | `var(--background-modifier-hover)` | `rgba(77,184,199,0.10)` | `rgba(42,123,136,0.10)` | `transparent` |
| `--dse-hairline-fade` | §1.2-J `hr-mark` family (composed gradient) | `linear-gradient(to right, var(--icon-color), transparent)` | `linear-gradient(to right, var(--dse-rule), var(--dse-rule-fade))` ⁴ | | `none` |
| `--dse-touch-min` | D2 extra (a11y geometry) | `44px` | = Legacy (theme-invariant) | | = Legacy (print rules hide controls) |

¹ The spec keeps the site's code-bg treatment for sunken wells (a 6% white wash on dark — it
reads *inset-panel*, not *darker*). Legacy's `rgba(0,0,0,.2)` is the darker-well approach.
Followed the spec; if the Steel render makes wells look *raised*, flip to `rgba(0,0,0,0.25)`
(visual QA call, Task 3).
**Superseded 2026-08-07 (SC-117 B1).** The "6% white wash" premise was wrong about the site:
the live site's dark body surfaces are an entirely translucent-**black** ladder
(`.25/.22/.20/.18/.16`) over the card plate's own 160deg gradient, and light is the same
mechanism thinner (`.02–.04`). The white wash added a constant toward white, compressing the
plate's internal ramp and flattening every panel — the flatness SC-117 was opened for. The
Steel columns above now carry the measured site values (`.18` dark / `.02` light); the four
surfaces whose site value differs from `.18` carry their own literal (SC-117 B2). Legacy and
print are unchanged.
² `page-bg` must equal the **actual host page** behind the element (the ◆ divider's punch-out
box-shadow keys off it). Steel skins only the element's own surfaces, never the note behind it,
so this token is theme-invariant by construction.
³ D2 split the spec's border set differently: D2 `border` = the everyday hairline (spec's
`border-muted` role), D2 `border-strong` = the solid card edge (spec's `border` role, whose
Legacy the spec listed as `var(--text-normal)` — that value lives on `border-strong`). Steel
dark uses DESIGN.md's 12%-white workhorse hairline for `border` and the 24% grade for
`border-strong`.
⁴ Steel re-keys the gradient endpoints to the `rule`/`rule-fade` tokens so the hairline tracks
the theme automatically (custom properties may reference other custom properties).

## Text

| Token | D3-spec concept | Legacy (verbatim) | Steel (dark) | Steel light | Print |
|---|---|---|---|---|---|
| `--dse-heading` | §1.2-C `text` (heading grade) ⁵ | `var(--text-normal)` | `rgba(220,226,230,0.95)` | `#1a1d20` | `#000` |
| `--dse-fg` | §1.2-C `text` | `var(--text-normal)` | `rgba(220,226,230,0.88)` | `#2c2e30` | `#000` |
| `--dse-fg-muted` | §1.2-C `text-muted` | `var(--text-muted)` | `rgba(220,226,230,0.62)` | `#555960` | `#333` |
| `--dse-fg-faint` | §1.2-C `text-faint` | `var(--text-faint)` | `rgba(220,226,230,0.38)` | `#828890` | `#666` |
| `--dse-font-mono` | §1.2-I `font-mono` | `var(--font-monospace)` | = Legacy (theme-invariant) | | = Legacy |
| `--dse-font-title` | SC-105 T1/T2 (six-slot vocabulary) ⁶ ⁷ | `var(--font-text)` | `"Source Serif 4", var(--font-text)` | | = active theme (no override) |
| `--dse-font-body` | SC-105 T1 (six-slot vocabulary) ⁷ | `var(--font-text)` | `"Source Serif 4", var(--font-text)` | | = active theme (no override) |
| `--dse-font-card-body` | SC-105 T1 (six-slot vocabulary) ⁷ | `var(--dse-font-body)` | `var(--dse-font-body)` | | = active theme (no override) |
| `--dse-font-label` | SC-105 T1 (six-slot vocabulary) ⁷ | `var(--dse-font-title)` | `var(--dse-font-title)` | | = active theme (no override) |
| `--dse-font-controls` | SC-105 T1 / SC-112 T3 ("same as Body") ⁷ | `var(--dse-font-body)` | `var(--dse-font-body)` | | `var(--font-text)` (pinned sans) |
| `--dse-chip-bg` | D2 extra (chips/tags) | `var(--tag-background)` | `rgba(220,226,230,0.06)` | `#eaeeef` | `transparent` |

⁵ The spec has no separate heading token; D2 does. Steel grades headings slightly brighter
(dark) / darker (light) than body fg — the emboss shadow (`--dse-emboss`) does the rest.
⁶ **Legacy differs from spec:** the spec's §1.2-I proposed `var(--font-interface)`; D2 shipped
`var(--font-text)`. The shipped value stands (Legacy is a record). **Update 2026-07-19** (plan
19 Task 1): the face itself now SHIPS — `SourceSerif4-SemiBold.woff2`/`-Bold.woff2` (OFL, Latin
subset) bundled as base64 `@font-face` `src` directly in `styles-source.css`'s Steel scope
(`assets/fonts/` carries the raw woff2 + `OFL.txt` as the license-compliance record). Until this
task the token was declared but no face was ever registered, so every Steel title silently fell
back to `var(--font-text)` (Steel ≈ Legacy typographically); it now actually resolves to Source
Serif 4. **Update 2026-07-24** (plan 21 Task 3): body/label text was routed directly to this
token too — there is deliberately no separate `--dse-font-body` (registering one needs a
`src/framework/tokens.ts` edit both plans forbade) [**superseded 2026-08-02 by SC-105 Task 1**,
which added `--dse-font-body` as its own token — see the SC-105 amendments below], so
`--dse-font-display` now covers both titles and body under Steel. **Update 2026-08-02** (plan
22, C1/C2): that body routing was
broadened from the four card-family selectors to a single Steel-theme-root selector
(`[data-dse-theme='steel']:not([data-dse-print="on"])[data-dse-element]`, `styles-source.css`
~:3439) — every element root, not an allow-list — so the token now reaches every plugin-only
family (hero, encounter, negotiation, montage, initiative, project, party, …) the same way it
already reached the card families. One targeted exclusion sits downstream of this rule and does
not change the token itself: numeric stepper/counter controls (`.dse-stepper__input`/`__value`)
are explicitly set back to `var(--font-text)`. A short-lived second exclusion for the encounter
head's numeric `EV n / n` chip (`font-variant-caps: normal`, keeping it out of small-caps) was
removed same-day per Scott's consistency ruling (2026-08-02) — the chip now takes the same
small-caps treatment as every other chip, with no numeric-content exemption. Screen-only
(`:not([data-dse-print="on"])`); print and Legacy are unaffected either way. **Update 2026-08-02
(SC-105 Task 2 — retirement):** `--dse-font-display` itself is gone. Every rule this footnote
describes above was re-pointed to the six-slot vocabulary this footnote's superscript now
labels (`--dse-font-title` for the title/head-chip/card-title/hero-name/section-heading rules,
`--dse-font-label` for `.dse-hero__region-title`, `--dse-font-controls` for the stepper
exclusion) with zero pixel change — the values were, and remain, identical per theme. The
Steel-root body routing this footnote traces through plan 21/22 now reads
`--dse-font-body`, its own token (see footnote ⁷) rather than a borrowed `--dse-font-display`.
See the "SC-105 amendments" below for the full before/after.

⁷ SC-105 Task 1 splits the single `--dse-font-display` slot into six independent slots
(Title/Body/Card-body/Label/Controls/Mono) as a **pure no-op**: every value here reproduces
`--dse-font-display`'s existing per-theme resolution exactly, and Task 1 touches zero
consumers (`--dse-font-display` itself stays defined and still drives all 7 of its CSS rules
until Task 2 re-points them). Title/Body/Controls are independent literals per theme block
(never `var()`-chain to each other — SC-112 needs to move Title without dragging Body);
Card-body/Label are deliberate `var()` CHAINS to Body/Title (Scott's "same as Body"/"same as
Title" ruling) so a future prefs UI can offer just 3 user-facing controls while Card-body/Label
track them automatically. Task 2 has since completed the re-point and retired
`--dse-font-display` entirely (see footnote ⁶'s closing update and the "SC-105 amendments"
below for the full rationale and migration).

## Accent / interaction

| Token | D3-spec concept | Legacy (verbatim) | Steel (dark) | Steel light | Print |
|---|---|---|---|---|---|
| `--dse-accent` | §1.2-D `accent` | `var(--interactive-accent)` | `#4db8c7` | `#2a7b88` | `#000` |
| `--dse-accent-fg` | §1.2-C `text-on-accent` ⁷ | `var(--text-on-accent)` | `#0f1214` | `#fff` | `#fff` |
| `--dse-focus-ring` | §1.2-B `border-focus` | `var(--interactive-accent)` | `#4db8c7` | `#2a7b88` | `#333` |
| `--dse-select` | §1.2-E `selected` | `#D50000` | `#e0584b` | | `#000` |

⁷ The spec's Print column said `#000` for text-on-accent while also printing `accent` as
`#000` (black-on-black). Corrected to `#fff`; moot in practice — accent-filled controls are
`display:none` under print (Task 5 rule 4).

## Steel ornament (Legacy = flat/none; Steel = the site's `--fx-*` chrome)

Steel values are verbatim ports of `v2/docs/stylesheets/steel-redesign.css`'s `--fx-*` tokens
(dark = `slate` block, light = `default` block). `palette.css` does not define these, so no
`--sc-*` chaining — plain literals, same OD-6 manual sync.

| Token | D3-spec concept | Legacy (verbatim) | Steel (dark) | Steel light | Print |
|---|---|---|---|---|---|
| `--dse-metal-grad` | §1.2-J `fx-plate` (site `--fx-metal-grad`) ⁸ | `none` | `linear-gradient(180deg, #e3e7e9 0%, #a9b0b5 48%, #686f74 100%)` | `linear-gradient(180deg, #9aa1a6 0%, #6a7176 48%, #474d51 100%)` | `none` |
| `--dse-metal-line` | D2 extra (site `--fx-metal-line`) | `none` | `rgba(176,183,187,.5)` | `rgba(95,103,108,.45)` | `none` |
| `--dse-metal-faint` | D2 extra (site `--fx-metal-faint`) | `none` | `rgba(176,183,187,.16)` | `rgba(95,103,108,.14)` | `none` |
| `--dse-metal` | Plan 20 T3 (site `--fx-metal`, steel-redesign.css:15/26) ⁹ | `inherit` | `#a9b0b5` | `#5f676c` | `inherit` |
| `--dse-metal-bright` | Plan 20 T3 (site `--fx-metal-bright`, steel-redesign.css:16/27) ⁹ | `inherit` | `#d9dee1` | `#2c3338` | `inherit` |
| `--dse-sheen` | Plan 20 T3 (site `.sc-ability__cost` gradient, steel-ability-cards.css:117 / light :119) | `none` | `linear-gradient(180deg, rgba(255,255,255,.07), rgba(0,0,0,.14))` | `linear-gradient(180deg, rgba(255,255,255,.9), rgba(0,0,0,.04))` | `none` |
| `--dse-sheen-soft` | Plan 20 T3 (site head-strip gradient, steel-ability-cards.css:160/184) | `none` | `linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,0))` | = Steel dark (no site light override) | `none` |
| `--dse-chip-bevel` | Plan 20 T3 (site `.sc-ability__cost` shadow, steel-ability-cards.css:118) ¹⁰ | `none` | `inset 0 1px 0 rgba(255,255,255,.08), 0 1px 3px rgba(0,0,0,.3)` | = Steel dark (no site light override) | `none` |
| `--dse-bevel` | §1.2-J `fx-bevel` | `none` | `inset 0 1px 0 rgba(255,255,255,.07)` | `inset 0 1px 0 rgba(255,255,255,.8)` | `none` |
| `--dse-emboss` | §1.2-J `fx-emboss` | `none` | `0 1px 0 rgba(0,0,0,.55), 0 -1px 0 rgba(255,255,255,.04)` | `none` (site: no light emboss) | `none` |
| `--dse-card-bg` | D2 extra (site `--fx-card-bg`) | `none` | `linear-gradient(160deg, #232a2e, #181c1f)` | `linear-gradient(160deg, #ffffff, #eef1f1)` | `none` |
| `--dse-crest-shape` | D2 extra (site `.sc-crest` `--shield`) | `none` | `polygon(6% 0, 94% 0, 94% 58%, 50% 100%, 6% 58%)` | | `none` (crest hidden in print) |
| `--dse-rule` | §1.2-J `hr-mark` / §1.2-B `border-hairline` | `var(--icon-color)` | `var(--sc-steel, #8e959a)` | `#5a6368` | `#bbb` |
| `--dse-rule-fade` | §1.2-J (the fade endpoint) | `transparent` | = Legacy (theme-invariant) | | = Legacy |

⁸ The spec's `fx-plate` proposed a minimal 3%-white sheen; D2's `metal-grad` is consumed as the
crest/plate **metal fill** (`.dse-crest{background:var(--dse-metal-grad)}`), matching the
site's crest, so Steel ports the site's full `--fx-metal-grad`. The near-transparent plate
sheen the spec described is what `metal-faint` gives Task 3 to work with.

⁹ Flat metal **text** colours (chip/tag ink and the ◆ markers). Legacy/Print value is the
keyword `inherit`, so `color: var(--dse-metal)` is a no-op outside Steel.

¹⁰ Deliberately a SEPARATE token from `--dse-bevel`: that one already carries the site's
`--fx-bevel` and is consumed by the card plates, so the cost chip's two-part shadow needed
its own name rather than a redefinition.

## Power-roll tiers

| Token | D3-spec concept | Legacy (verbatim) | Steel (dark) | Steel light | Print |
|---|---|---|---|---|---|
| `--dse-tier-low` | §1.2-H `tier-low` | `var(--text-normal)` | `var(--sc-tier-low, #e74c3c)` | `#c0392b` | `#c0392b` |
| `--dse-tier-mid` | §1.2-H `tier-mid` | `var(--text-normal)` | `var(--sc-tier-mid, #f0b429)` | `#b9770e` | `#b9770e` |
| `--dse-tier-high` | §1.2-H `tier-high` | `var(--text-normal)` | `var(--sc-tier-high, #4caf6a)` | `#1e8449` | `#1e8449` |
| `--dse-tier-crit` | D2 extra (no site analog) ⁹ | `var(--text-normal)` | `#e0b050` (gold — **RESOLVED SC-106**) | | `#8a6a00` |
| `--dse-badge-fg` | D2 extra (§2.8 badge-text hook) ¹⁰ | `var(--dse-fg)` | `#0f1214` | `#fff` | `#fff` |

Tier badges are meaning-bearing → the Task-5 print rule adds `print-color-adjust: exact`
(mirrors `v2/print.css` `.power-roll-badge`).
⁹ The site has no `--sc-tier-crit` token, but it DOES style a crit highlight elsewhere:
`v2/docs/stylesheets/steel-dice.css:11` (`.sc-dice-pop .crit { color: #e0b050; }`), a single
value shared by both color schemes. **RESOLVED (SC-106, 2026-08-03):** adopted that exact
gold verbatim (was the draft's invented `#e3c14a`) — crit (nat 19–20) is the jackpot outcome,
above the red/amber/green ramp, and this keeps the plugin's crit cue traceable to a real site
value instead of an invented one. Single value for both Steel dark/light, matching the
existing fills-not-text pattern (footnote 11 below).
¹⁰ Badge text sits ON the tier fill: dark-scheme fills are the bright hues → near-black ink
(`#0f1214`); light-scheme fills are the darker hues → white ink.

## Stamina

| Token | D3-spec concept | Legacy (verbatim) | Steel (dark) | Steel light | Print |
|---|---|---|---|---|---|
| `--dse-stamina-healthy` | §1.2-E `hp-healthy` | `limegreen` | `var(--sc-role-hexer, #5cc98a)` | | `#1a7a3a` |
| `--dse-stamina-winded` | §1.2-E `hp-winded` | `yellow` | `#f0b429` | | `#8a6a00` |
| `--dse-stamina-dying` | §1.2-E `hp-dying` | `red` | `#e74c3c` | | `#a11` |
| `--dse-stamina-temp` | §1.2-E `hp-temp` (also the heal cue — no `healing` token, plan T3) ¹¹ | `deepskyblue` | `#7c5cd6` (**RESOLVED** 2026-07-19, plan 19 Task 6) | | `#555` |
| `--dse-stamina-track` | §1.2-E (bar track) | `var(--code-background)` | `rgba(220,226,230,0.06)` | `#eaeeef` | `#fff` |

Bar fills are fills, not text — hues stay light/dark-stable (no contrast pressure).
¹¹ **Legacy differs from spec:** the spec assumed the live bar's temp indicator was `purple`
and derived Steel `#7c5cd6` for continuity; D2 actually shipped Legacy `deepskyblue`. **RESOLVED
2026-07-19** (plan 19 Task 6, taste call #1, `sc-10-decisions.md`): Scott chose the spec's
purple `#7c5cd6` over the blue alternative (`#5dade2`, palette's ranged-blue) — it frees blue for
`act-move`/Maneuver (which the blue alternative collided with, see `act-move`'s note below) and
sits outside the green/amber/red HP ramp as its own "temp/shield" signal. Legacy's `deepskyblue`
is unchanged. **RE-CONFIRMED (SC-106, 2026-08-03):** Scott delegated the final call; purple
`#7c5cd6` stands unchanged — it stays distinguishable from the HP ramp (green/amber/red), from
`act-maneuver`'s blue, and reads distinctly from the other purples in the palette
(`role-artillery` `#a87cd6`, `act-trait` `#bb8fce`/`#7d3c98`) since those never co-occur with a
stamina bar in the same visual context.

## Encounter

| Token | D3-spec concept | Legacy (verbatim) | Steel (dark) | Steel light | Print |
|---|---|---|---|---|---|
| `--dse-turn-done` | §1.2-E `taken-turn` | `limegreen` | `var(--sc-role-hexer, #5cc98a)` | | `#1a7a3a` |
| `--dse-malice` | §1.2-E `malice` (standalone — D2 has NO `role-malice`) | `red` | `#e0584b` | | `#a11` |
| `--dse-vp` | D2 extra (victories / negotiation) ¹² | `orange` | `#e0b050` (gold — **RESOLVED SC-106**) | | `#8a6a00` |
| `--dse-warn` | §1.2-E `warning` | `orange` | `#e8954a` | | `#8a5a00` |
| `--dse-danger` | §1.2-E `damage` | `crimson` | `#e74c3c` | | `#a11` |

¹² Legacy has `vp` and `warn` both `orange` (indistinguishable). Steel splits them: warnings
keep the spec's support-orange `#e8954a`; victories go **gold**. **RESOLVED (SC-106,
2026-08-03):** `#e0b050`, the site's own crit gold (steel-dice.css:11) — shared with
`tier-crit` (deliberate: both are "triumph" semantics, never co-located in one widget). One
usage caveat found during SC-106: `.dse-enc__band[data-band="hard"/"extreme"]` (styles-source.css
~2288) consumes `--dse-vp` as TEXT ink over `--dse-surface-raised`, not a fill — on the light
Steel surface (`#edf0f0`) this gold's contrast is low (~1.7:1), same pre-existing shortfall the
old `#e3c14a` had (~1.5:1, marginally worse) — not a regression, but flagged here since it's
the one `--dse-vp` consumer with real contrast pressure rather than a fill.

## Combat-role accents

Legacy is **`var(--dse-fg-muted)`** for all 12 (the shipped OD-2 monochrome — **differs from
the spec's assumed `inherit`**; the muted grey is what D2 landed, and it fails safe as the
grey spine Legacy statblocks actually render). Steel = `palette.css` `--sc-role-*` verbatim
(locked, light/dark-stable). Print keeps the hue (meaning-bearing spine + `print-color-adjust:
exact`) but **only composed with Steel** — see the Print-layer scoping caveat above.

| Token | D3-spec concept | Legacy (verbatim) | Steel (dark) | Steel light | Print |
|---|---|---|---|---|---|
| `--dse-role-ambusher` | §1.2-F `role-ambusher` | `var(--dse-fg-muted)` | `var(--sc-role-ambusher, #e3c14a)` | | = Steel (exact) |
| `--dse-role-harrier` | §1.2-F `role-harrier` | `var(--dse-fg-muted)` | `var(--sc-role-harrier, #e07ba8)` | | = Steel (exact) |
| `--dse-role-artillery` | §1.2-F `role-artillery` | `var(--dse-fg-muted)` | `var(--sc-role-artillery, #a87cd6)` | | = Steel (exact) |
| `--dse-role-brute` | §1.2-F `role-brute` | `var(--dse-fg-muted)` | `var(--sc-role-brute, #5d8fe0)` | | = Steel (exact) |
| `--dse-role-controller` | §1.2-F `role-controller` | `var(--dse-fg-muted)` | `var(--sc-role-controller, #e0584b)` | | = Steel (exact) |
| `--dse-role-hexer` | §1.2-F `role-hexer` | `var(--dse-fg-muted)` | `var(--sc-role-hexer, #5cc98a)` | | = Steel (exact) |
| `--dse-role-mount` | §1.2-F `role-mount` | `var(--dse-fg-muted)` | `var(--sc-role-mount, #48c9b0)` | | = Steel (exact) |
| `--dse-role-support` | §1.2-F `role-support` | `var(--dse-fg-muted)` | `var(--sc-role-support, #e8954a)` | | = Steel (exact) |
| `--dse-role-defender` | §1.2-F `role-defender` | `var(--dse-fg-muted)` | `var(--sc-role-defender, #c7a173)` | | = Steel (exact) |
| `--dse-role-leader` | §1.2-F `role-leader` | `var(--dse-fg-muted)` | `var(--sc-role-leader, #9aa2a8)` | | = Steel (exact) |
| `--dse-role-solo` | §1.2-F `role-solo` | `var(--dse-fg-muted)` | `var(--sc-role-solo, #9aa2a8)` | | = Steel (exact) |
| `--dse-role-minion` | §1.2-F `role-minion` | `var(--dse-fg-muted)` | `var(--sc-role-minion, #9aa2a8)` | | = Steel (exact) |

## Ability action-type accents (the Steel design proposal — **RESOLVED, SC-106 2026-08-03**)

D2's `act-*` set is the **six Draw Steel action types** (main / maneuver / triggered / move /
none / trait), NOT the spec's eight ability *categories* (§1.2-G `ability-strike/ranged/…`).
Legacy = `none` verbatim (no spine renders; the card's `border-left: 3px solid` falls back
harmlessly). Steel assigns each action type a distinct spine hue **drawn from `palette.css`'s
eight `--sc-ability-*` hues** — the palette's 6 non-confusable hue slots (red / purple / amber /
blue / teal-green / steel-grey) map one-to-one onto the 6 action types, so DSE spines stay
color-consistent with the site's ability borders and nothing new is invented:

| Token | Steel hue ⇐ palette slot | Rationale |
|---|---|---|
| `act-main` | red ⇐ `--sc-ability-strike` | the marquee combat action; red = "the big swing" (the site's strike red) |
| `act-maneuver` | purple ⇐ `--sc-ability-maneuver` | direct name match |
| `act-triggered` | amber ⇐ `--sc-ability-triggered` | direct name match (amber = "reactive/alert") |
| `act-move` | blue ⇐ `--sc-ability-ranged` | cool kinetic blue — the conventional movement hue; the ranged slot is the palette's only blue |
| `act-none` | teal-green ⇐ `--sc-ability-area` | free/no-action abilities get the remaining "bonus" accent slot, distinct from everything above |
| `act-trait` | steel-grey ⇐ `--sc-ability-passive` | traits ARE the passive, always-on features — grey de-emphasizes exactly like the site's passive border |

Alternative considered: `act-none` ⇐ `ability-special` light-purple — rejected (too close to
maneuver-purple at 3px-spine size); the area-teal is unambiguous. **Superseded** by the SC-10
amendments below (2026-07-10): `act-*` was realigned to the site's canonical `--sc-act-*`
tokens, which reassigned `#5dade2` (blue) from this draft's `act-move` onto `act-maneuver`
instead (`act-move` is now the amber `--sc-act-move, #e8a13a`). The `act-move`/`stamina-temp`
overlap this note flagged is moot either way — the token holding blue changed, and
`stamina-temp` separately RESOLVED to purple `#7c5cd6` (2026-07-19, plan 19 Task 6) — but worth
noting `act-maneuver` now carries the blue this note originally worried about.

Print keeps the darkened (light-column) hue, composed with Steel only (scoping caveat above).

| Token | D3-spec concept | Legacy (verbatim) | Steel (dark) | Steel light | Print |
|---|---|---|---|---|---|
| `--dse-act-main` | §1.2-G intent, re-keyed to action type | `none` | `var(--sc-ability-strike, #e74c3c)` | `#c0392b` | `#c0392b` (Steel-composed, exact) |
| `--dse-act-maneuver` | §1.2-G intent, re-keyed to action type | `none` | `var(--sc-ability-maneuver, #bb8fce)` | `#7d3c98` | `#7d3c98` (Steel-composed, exact) |
| `--dse-act-triggered` | §1.2-G intent, re-keyed to action type | `none` | `var(--sc-ability-triggered, #f0b429)` | `#b9770e` | `#b9770e` (Steel-composed, exact) |
| `--dse-act-move` | §1.2-G intent, re-keyed to action type | `none` | `var(--sc-ability-ranged, #5dade2)` | `#2874a6` | `#2874a6` (Steel-composed, exact) |
| `--dse-act-none` | §1.2-G intent, re-keyed to action type | `none` | `var(--sc-ability-area, #48c9a4)` | `#148f77` | `#148f77` (Steel-composed, exact) |
| `--dse-act-trait` | §1.2-G intent, re-keyed to action type | `none` | `var(--sc-ability-passive, #b0b7bb)` | `#7b8a8b` | `#7b8a8b` (Steel-composed, exact) |
| `--dse-act-villain` | SC-102 — villain actions are their own action type | `none` | `#e0584b` | | `#b03a2e` (Steel-composed, plugin-chosen) |

**SC-102 (2026-08-07): `--dse-act-villain`.** The seventh action type. The site has **no**
`--sc-act-villain` token — its statblock sheet hard-codes
`.sb__feat[data-action="villain"] { --act: #e0584b }` (`steel-statblock.css`) and its
featureblock sheet chains `--sc-role-controller`, which resolves to the same `#e0584b`
(`palette.css`). So the Steel-dark value is that literal verbatim (S-3). Legacy is `none`
like every other `act-*` (OD-2).

**Light is BLANK — the one `act-*` that does not shift** (fix round, task-3 review M-2).
The other six light values are verbatim copies of the site's light `--sc-act-*` column;
there is no derivation rule, and the site has no light villain value to copy: `#e0584b` is
scheme-invariant site-side. Applying the family's *actual* convention therefore yields
light-stable, which is also exactly how this map already treats `--dse-role-controller` —
the same hue. The **print** twin `#b03a2e` is kept and is the one act print value with no
site value behind it: a deliberate contrast / ink-economy darkening for paper, recorded
here as a divergence rather than dressed up as a convention.

## Appendix A — spec concepts with NO D2 token (nothing to value)

For Tasks 3–5 completeness: these §1.2/§1.3 names have no `DseTokenName` member. Do **not**
author `--dse-` values for them.

| Spec concept | Resolution in D2 |
|---|---|
| `surface-overlay` | no token — overlays reuse `surface-raised`/`card-bg` (plan) |
| `border-muted` / `border-hairline` / `border-focus` | folded into `border` / `rule` / `focus-ring` (see rows above) |
| `radius-sm`, `pad-sm`, `gap`, `row-pad` | not tokenized — D2 keeps these literal in structural CSS |
| `text-on-accent` | is `accent-fg` |
| `accent-hover` / `accent-glow` | not tokenized — kit hover uses `filter: brightness(1.1)` / no glow token |
| `healing` | no token — heal cue reuses `stamina-temp` (plan T3) |
| `role-malice` | does not exist — `malice` is a standalone encounter token |
| `ability-strike/ranged/maneuver/triggered/area/passive/villain/special` (8) | replaced by the 6 action-type `act-*` tokens (mapping above); the villain/special hues are unused by DSE |
| `font-size-lg/sm`, `weight-strong`, `tracking` | not tokenized — D2 inherits Obsidian type for size/weight/tracking. (`font-body` used to be on this "no token" list too; SC-105 gave it its own token — see the Text table above, which now carries all six slots: `font-title`/`font-body`/`font-card-body`/`font-label`/`font-controls`/`font-mono`.) |
| `fx-plate` | fulfilled by `metal-grad` (+ `metal-faint` for near-transparent sheens) |
| `elevation-hover`, `transition` | not tokenized in D2 — add ONLY if a Task-3 Steel rule needs them (plan reconciliation); if added, that is a union + base + map + guard change |
| `accent-spine` | not a token — it is the element-set alias `--dse-act`/`--dse-role` (already wired in D2) |

## Appendix B — Base values that differ from the spec's assumptions

The spec predates D2; the shipped Legacy base wins (this column is a **record**). Deltas:

| Token | Spec assumed | D2 shipped (authoritative) |
|---|---|---|
| `surface-sunken` | `var(--color-base-30)` | `rgba(0,0,0,.2)` |
| `border` (default hairline) | *(spec `border-muted`)* `var(--color-base-40)` | `var(--background-modifier-border)` |
| `hover` | `var(--color-base-25)` | `var(--background-modifier-hover)` |
| `pad` | `1em` | `1rem` |
| `font-display` (retired 2026-08-02 by SC-105 — see the amendments below; this Legacy delta now lives on `font-title`/`font-body`/`font-controls`) | `var(--font-interface)` | `var(--font-text)` |
| `stamina-temp` | `purple` | `deepskyblue` (→ footnote 11: Steel RESOLVED to the spec's purple `#7c5cd6`) |
| `role-*` (all 12) | `inherit` | `var(--dse-fg-muted)` (renders the grey spine Legacy statblocks actually draw) |
| `act-*` (all 6) | *(spec `ability-*`)* `inherit` | `none` (no spine in Legacy) |

## Open items for Scott — ALL RESOLVED (2026-07-19, plan 19 preamble / `sc-10-decisions.md`)

1. **`act-*` Steel hues** — RESOLVED by the SC-10 amendments below (2026-07-10): realigned to
   the site's canonical `--sc-act-*` action-type tokens, replacing this map's draft
   `--sc-ability-*` classification chain.
2. **`tier-crit` gold `#e3c14a`** — RESOLVED: kept as proposed (no site analog; the site
   reserves its teal accent for links/tabs/focus/badges only, never crit/VP, so gold stays a
   free hue). No change.
3. **`vp` gold `#e3c14a`** — RESOLVED: kept as proposed, shared with `tier-crit` (both are
   "triumph" semantics, never co-located in one widget). No change.
4. **`stamina-temp`** — RESOLVED 2026-07-19 (plan 19 Task 6): the spec's purple `#7c5cd6`,
   over the blue alternative `#5dade2` (see footnote 11) — frees blue for `act-move`/Maneuver.
5. **Print scoping of `role-*`/`act-*`** to Steel-composed only (Legacy prints stay
   monochrome) — the map's recommendation; Task 5 implements.

---

## SC-10 amendments (2026-07-10 — post-ground-truth design pass)

Two catalog corrections from the SC-10 Steel pass (see the sc10-steel branch commits for
full rationale; both ground-truth-verified via the F5 obsidian camera):

1. **`badge-fg` is now theme-INVARIANT** (`var(--dse-fg)` from the Legacy base; the Steel
   dark `#0f1214`, Steel light `#fff`, and print `#fff` overrides are REMOVED). The tier
   badge is a hollow clip-path frame — its interior is the card surface, so the ink is
   always ink-on-surface. The old values assumed solid fills and rendered invisible.
   Split counts moved: Steel 59+5 → **58 overridden + 6 invariant**; light 32 → **31**;
   print neutral 42 → **41** (print invariant 16 → **17**).

2. **`act-*` realigned to the site's canonical `--sc-act-*` action-type tokens**
   (steel-ability-cards.css), replacing the draft's `--sc-ability-*` classification chain:

   | token | dark (chained, fallback) | light | print twin |
   |---|---|---|---|
   | act-main | `var(--sc-act-main, #e74c3c)` | `#c0392b` | `#c0392b` |
   | act-maneuver | `var(--sc-act-maneuver, #5dade2)` | `#2874a6` | `#2874a6` |
   | act-triggered | `var(--sc-act-triggered, #4caf6a)` | `#1e8449` | `#1e8449` |
   | act-move | `var(--sc-act-move, #e8a13a)` | `#b9770e` | `#b9770e` |
   | act-none | `var(--sc-act-none, #cdd1d4)` | `#5a6368` | `#5a6368` |
   | act-trait | `var(--sc-act-trait, #bb8fce)` | `#7d3c98` | `#7d3c98` |

Also new (structural, not tokens): the Steel skin now CONSUMES the ornament tokens —
card-bg/bevel/shadow on top-level feature/featureblock/statblock panels, emboss on
titles/section keys/pr-heads/statgrid values, display face on primary titles, metal-faint
chip washes, and a reserved act-spine lane (`padding-left`).

## SC-10 amendments (2026-07-19 — plan 19 HFS Steel-theme port, Task 8 final sweep)

Two items closed out; every "Open items for Scott" flag above is now resolved (see that
section) rather than pending:

1. **`--dse-stamina-temp` resolved to `#7c5cd6`** (purple, the spec's original value) — Task 6,
   taste call #1. The Steel (dark) cell and footnote 11 above are updated in place; Legacy
   (`deepskyblue`) and Print (`#555`) are untouched.
2. **`--dse-font-display`'s Source Serif 4 face now actually ships** — Task 1 bundled
   `SourceSerif4-SemiBold.woff2` / `-Bold.woff2` (OFL, Latin subset) as base64 `@font-face` `src`
   directly in `styles-source.css`'s Steel scope (`assets/fonts/` carries the raw woff2 +
   `OFL.txt`). Before this task the token declared the family name but no face was registered,
   so every Steel title silently fell back to `var(--font-text)`; Steel titles now render in the
   actual serif.

Structural (not tokens, for completeness — full detail: `dse-overhaul/plans/2026-07-19-plan-19-hfs-steel-theme.md`):
crest wired into feature/statblock card heads, boxed Distance/Target rail + ◆ EFFECT section
panels + dashed keyword-spend box on ability cards, role-tinted statblock header band + boxed
stat rows, featureblock grey header band + per-option glyphs, teal in-card link color, hero-sheet
Steel chrome, and (Task 8 polish) a placeholder-only Keywords/Type meta chip (the book's lone-dash
"none" convention) is now dropped entirely in Steel instead of showing an empty `KEYWORDS: --` /
`TYPE: --` chip (Legacy's existing unlabeled dash text is unchanged).

## Plan 20 amendments (2026-07-21 — Steel material parity)

Plan 20 closed the gap between the plugin's Steel theme and the live site's *material*
treatment (the forged look: sheen, bevel, hairline, tier washes, role bands, crest accent).
Five tokens were added to the **Steel ornament** table above (that table stays the one
authoritative row-per-token list — `token-coverage.test.ts` counts first-column rows, so this
section deliberately uses prose, not a second table). Their site provenance, all under
`v2/docs/stylesheets/`:

- **metal** — `steel-redesign.css:15` (dark) / `:26` (light), the site's `--fx-metal`.
- **metal-bright** — `steel-redesign.css:16` (dark) / `:27` (light), the site's `--fx-metal-bright`.
- **sheen** — `steel-ability-cards.css:117` (dark) / `:119` (light), the `.sc-ability__cost` fill.
- **sheen-soft** — `steel-ability-cards.css:160` and `:184`, the section-head / power-roll-head strip.
- **chip-bevel** — `steel-ability-cards.css:118`, the `.sc-ability__cost` two-part shadow.

`--dse-bevel` is **not** new. It pre-existed carrying the site's `--fx-bevel` and is consumed
by the card-plate rules; the cost chip needs a different, two-part shadow, which is why the
new `--dse-chip-bevel` exists alongside it rather than redefining it (footnote 10).

### The rule: material belongs on shared primitives, never per-element

Sheen, bevel and hairline are declared **once, on the shared primitive** that every element
reuses — the card plate, `.dse-section__title`, `.dse-pr__head`, the forged cost chip, the
statblock/featureblock head band — and never re-declared inside a per-element block
(`.dse-kit …`, `.dse-condition …`, and friends). Two reasons:

1. Per-element copies drift. Plan 19 shipped a Steel theme that *looked* ported because a few
   elements carried material locally while the shared primitives stayed flat, so whole
   families rendered as plain grey boxes. Putting the material on the primitive makes "did
   this element get the treatment?" unanswerable-by-accident: it did, because it uses the
   primitive.
2. It is what the parity gate can check. `visual-harness/parity` samples computed properties
   for a fixed site-selector ↔ plugin-selector map; a primitive appears once in that map, and
   a flat surface fails the gate (`npm run parity`, 0 GAPs / 0 WARNs) and the jest material
   contract (`test/dom/theme/steelMaterial.test.ts`). Per-element material is invisible to
   both.

Corollary, also asserted in the jest contract: **not every chip is forged.** The site has two
chip surfaces — the flat outlined right-rail slot (`.sc-head__slot--chip` ↔
`.dse-head__deck--chip`) and the forged ability cost corner (`.sc-ability__cost` ↔
`.dse-feature .dse-head__eyebrow--chip`). Giving the rail chip a sheen would be *diverging*
from the site, so the contract asserts the rail chip stays flat.

## SC-105 amendment (2026-08-02 — six-slot font vocabulary, Task 1)

Today's plugin drives titles, body prose, card body, and label text through the single
`--dse-font-display` token — which is *why* they already render pixel-identical. SC-105 splits
that one slot into six ("title", "body", "card-body", "label", "controls", "mono" — `mono`
pre-existed and is unchanged) so a future prefs UI (SC-112) can let a user diverge them. The
work is staged across two tasks so the split itself never moves a pixel:

- **Task 1 (this amendment)** adds the 5 new tokens — `font-title`, `font-body`,
  `font-card-body`, `font-label`, `font-controls` — to `DSE_TOKEN_NAMES` with full Legacy/Steel/
  Print coverage (the 5 new rows in the Text table above), but re-points **zero** consumers.
  `--dse-font-display` keeps every one of its 7 CSS consumers untouched; nothing that renders
  today references any of the 5 new names. `grep -c "var(--dse-font-display)"` in
  `styles-source.css` stays exactly 7.
- **Task 2** (now done — see the amendment below) re-points those 7 consumers plus the
  stepper's sans-font exclusion to their classified slot token, then retires
  `--dse-font-display` from the union, this map, `LEGACY_MAP`, and the theme tests in the same
  task (a zombie alias with no consumers would just be confusing).

**The chain decision (load-bearing for SC-112):** `font-title`, `font-body`, `font-controls`,
and `font-mono` get **independent literal values** per theme block — they happen to be equal
today (all resolve through `var(--font-text)` in Legacy, `"Source Serif 4", var(--font-text)`
in Steel dark), but must never `var()`-chain to each other, because SC-112 needs to move Title
without dragging Body along, and vice versa. `font-card-body` and `font-label` instead get
**`var()`-chained defaults** — `var(--dse-font-body)` and `var(--dse-font-title)` respectively —
exactly matching Scott's "Card-body = same as Body" / "Label = same as Title" rulings. This is
what lets SC-112 offer just 3 user-facing controls (Title/Body/Controls) while Card-body/Label
track them automatically unless a future "advanced" override breaks the chain explicitly.

The chain is safe as a no-op because `token-coverage.test.ts`'s guard is a raw-text
presence/equality check on whatever string follows `--dse-<name>:` — it already treats existing
tokens that chain (e.g. `--dse-surface: var(--code-background)`) as ordinary values, so
`--dse-font-card-body: var(--dse-font-body);` is accepted identically to a literal in the
Legacy fidelity map, the Steel presence check, and the Print presence check. `font-controls`
joins `font-mono` as Steel/Print-invariant (defined only in the Legacy base — always sans,
never overridden by either theme block), since no consumer re-points to it in Task 1.
[**Superseded 2026-08-03 by SC-112 Task 3** — see the SC-112 amendment below. `font-controls`
is now a `var(--dse-font-body)` chain ("same as Body", Scott's re-ruling), re-declared inside
the Steel block like `card-body`/`label` (a `:root`-declared chain flattens on `<html>` and can
never carry the theme swap), and the neutral print block pins it back to `var(--font-text)`.
It is *overridden*, not invariant, in both the Steel and Print guard sets.]

[**Amended 2026-08-04, SC-121 Batch 3 (dse `5df83f4`, fixed FOLLOWUPS #45)** — the
"defined only in the Legacy base" clause for `font-mono` is now stale. `--dse-font-mono` is
still declared at `:root` in the Legacy base (unchanged, still the vocabulary contract), but
is now ALSO re-declared, theme-agnostically, on every element root and Obsidian modal root
(`:is([data-dse-element], .dse-modal) { --dse-font-mono: var(--font-monospace) }`) so the
`var(--font-monospace)` reference resolves (a `:root`-declared `var()` referencing a
`body`-scoped custom property is IACVT — the pre-existing bug). This does not change its
Steel/Print-*value*-invariance (still no theme or print block overrides it, and
`token-coverage.test.ts`'s block-regex extraction doesn't match the new element-root
selector, so `inBase`/`inSteel`/`inPrint` are unaffected) — it changes only *where* it is
declared.]

## SC-105 amendment (2026-08-02 — six-slot font vocabulary, Task 2 — retirement)

Task 2 completed the migration the amendment above staged: every one of `--dse-font-display`'s
7 CSS consumers, plus the `.dse-stepper__input`/`__value` sans-font exclusion (previously a
bare `var(--font-text)` literal, not `--dse-font-display` itself), was re-pointed to its
classified slot per the design's classification table:

| Selector(s) | Slot |
|---|---|
| `.dse-head__primary--left`, card-head chip (`:is(.dse-sb,.dse-fb) > .dse-head > .dse-head__primary--chip`), `.dse-card__title`, `.dse-hero__name`, generic `h3`–`h6` (initiative/encounter/negotiation/montage/project/party/counter) + `.dse-modal__title` | `--dse-font-title` |
| Broad element-root body rule (`[data-dse-element]:not([data-dse-error-stage])`, `.dse-sb`, `.dse-card` — selector list unchanged) | `--dse-font-body` |
| **New** higher-specificity rule for `:is(.dse-sb, .dse-card, [data-dse-element='feature'], [data-dse-element='featureblock'])` | `--dse-font-card-body` (chains to Body; zero pixel change) |
| `.dse-hero__region-title` | `--dse-font-label` (chains to Title; zero pixel change) |
| `.dse-stepper__input`, `.dse-stepper__value` | `--dse-font-controls` |

`.dse-btn`, `.dse-tabs__tab`, `.dse-collapse__header`, and `button.dse-pr__row` deliberately
stay on `font: inherit` — Controls silently renders serif today (inherited from the Body/
Card-body routing) even though Scott's ruling is that Controls should default to sans; wiring
that now would move real pixels and break the freeze, so it's explicitly deferred to SC-112,
not part of this retirement. [**Closed 2026-08-03 by SC-112 Task 3** — with the opposite
outcome this paragraph assumed: the stepper "sans exclusion" itself had been dead since this
very rename (the `:root` slot set is IACVT on `<html>` — see the SC-112 amendment below), so
steppers were *already* rendering serif; Scott re-ruled Controls' default to "same as Body",
and all six Controls sites (the two stepper selectors plus these four `font: inherit` ones)
now route through `var(--dse-font-controls)`. Print pins Controls back to sans.]

With every consumer re-pointed, `--dse-font-display` itself was removed: from
`DSE_TOKEN_NAMES` (74 → 73), its Legacy and Steel-dark `:root`/theme-block definitions, its row
in the Text table above, `LEGACY_MAP`/`STEEL_INVARIANT`/`PRINT_INVARIANT` and both hardcoded
counts in `token-coverage.test.ts`, and its three direct pins in `theme-steel.test.ts`/
`theme-print.test.ts`/`tokens.test.ts`. `grep -rc "dse-font-display"` across `src/`,
`styles-source.css`, and `test/` is `0` everywhere. The whole migration — Task 1's no-op
introduction plus Task 2's re-point — moved zero pixels: freeze stayed 101/101 byte-identical
and parity stayed 0 GAPs / the same 10 pre-existing WARNs throughout both tasks.

One open item for SC-112 to re-verify before Body/Card-body are allowed to diverge: for
`[data-dse-element='feature']`/`['featureblock']`, the Body rule's bare
`[data-dse-element]:not([data-dse-error-stage])` alternative has higher specificity ((0,4,0))
than the new Card-body rule's `:is(...)` alternative ((0,3,0)), so Body technically still wins
the cascade for those two hosts today. Harmless now because `--dse-font-card-body` chains to
`--dse-font-body` (whichever rule wins renders the identical value) — but not yet a clean
mutual exclusion, flagged inline in `styles-source.css` at the Body/Card-body rule split.
[**Resolved 2026-08-03 by SC-112 Task 4** — the Card-body rule gained a *root-compound* arm
(`:not([data-dse-print="on"]):is([data-dse-element='feature'],[data-dse-element='featureblock']):not([data-dse-error-stage])`,
equal specificity to the Body arm and later in source order, so it wins the cascade): the
feature/featureblock roots, which ARE their own card, now take Card-body directly. A live
divergence probe (Task 4 review) confirmed Card-body genuinely moves those hosts without
dragging Body.]

Task 3 (docs only, no CSS/TS changes) closed out the loop: this file's migration prose and
footnotes ⁶/⁷ above, Appendix A/B, `visual-harness/parity/README.md`, and any remaining
`font-display` mentions in `draw-steel-elements`' prose docs were brought current to describe
the six-slot vocabulary as the plugin's only font seam.

## SC-112 amendment (2026-08-03 — Controls flip, slot routability, Legacy support — Tasks 3–5)

**Task 3 — the Controls flip + the IACVT root cause.** Scott re-ruled Controls' default from
"sans" to **"same as Body"**. Investigating why the flip moved zero pixels exposed the root
cause: every `var(--font-text)`-chained font slot declared at `:root` is **dead at
computed-value time** — `var()` substitutes on the *declaring* element (`<html>`), where
Obsidian's `--font-text` (defined on `body`) is invalid, so the whole `:root` slot set is
IACVT and consumers render via `font-family`'s inherit fallback. Concretely: the stepper
"sans exclusion" SC-105 preserved had been dead since that rename — steppers were *already*
silently serif under Steel (SC-105's "zero rendering change" claim was false in the stepper
region of the unfrozen steel shots; the guards were structurally blind there). SC-112 made
the intent real instead of resurrecting the accident: the Steel block re-declares
`--dse-font-controls: var(--dse-font-body)` (only a scoped re-declaration can carry the theme
swap — the `:root` entry remains as the vocabulary contract), and the neutral print block pins
`--dse-font-controls: var(--font-text)` so the frozen `*--steel-print.png` set holds.
`font-controls` thereby moved from the Steel- and Print-invariant guard sets to *overridden*
in both (Steel 67 overridden / 8 invariant with Task 7's scales; Print 53 / 22).

**Task 4 — six slots independently routable.** Two gaps kept the slots from being truly
independent knobs: (a) **Card-body root-compound** — feature/featureblock roots ARE their own
card but took Body via specificity; the Card-body rule gained a root-compound arm that wins
the cascade (see the resolved open-item note in the Task 2 amendment above). (b) **Label
graduation** — Label's only consumer was `.dse-hero__region-title`; nine label-class selectors
that reached their look via Title/Body routing (`.dse-head__eyebrow--chip`,
`.dse-head__eyebrow--line`, `.dse-head__deck--chip`, `.dse-section__title`, `.dse-sb__item-l`,
`.dse-sb__kv-l`, `.dse-enc__table th`, `.dse-pr__head`, `.dse-pr__badge-text`) were pinned to
`var(--dse-font-label)` — 10 selectors total, so moving Label moves the label family without
dragging Title/Body. All chains preserve identical defaults; freeze stayed 101/101.

**Task 5 — Legacy font support (gate verdict: SHIP).** The five slot consumer rules
(Title/Body/Card-body/Label/Controls; Mono was never Steel-gated) were widened from
Steel-only to **theme-agnostic**, so a user's chosen font applies under Legacy too. Steel-only
*visual* properties (weight/uppercase/color/…) that had been bundled with `font-family` were
split, not qualifier-dropped (8/10 sites). Every descendant-selector arm anchors its print
exclusion on the stamped node itself — `:is([data-dse-element], .dse-modal):not([data-dse-print="on"])`
— because a bare `:not([data-dse-print="on"])` *descendant* selector is trivially satisfied by
any unstamped ancestor (`<html>`), which the first freeze run caught (22 steel-print shots
broke; one uniform anchor pattern fixed it — 15 anchored + 3 safe root-compound arms = 18).
`findUnanchoredPrintExclusions()` in `steelTypography.test.ts` now locks that *shape*. At
defaults the widening is a true no-op — Legacy resolves the same IACVT-inherit values as
before (freeze 101/101; live probe confirmed both the no-op and that Legacy responds to a
per-root override). Full investigation ledger:
`docs/superpowers/dse-overhaul/build-ledgers/sc112-legacy-font-gate.md`.

## SC-112 amendment (2026-08-03 — user size-scale tokens, Task 7)

SC-112 Task 7 adds two **user-scale** tokens — multipliers, not theme values — mirroring the
site's text/card size sliders (`v2/docs/javascripts/settings-core.js:22-23`; both ranges
symmetric about the 1.0 default). The `textScale`/`cardScale` prefs (plugin `catalog.ts`)
stamp a `snap()`-normalized non-1 value inline per element root and remove it at the default
(site remove-on-default semantics), so the `:root` default of `1` is what every root resolves
at defaults — the consumer rules (`font-size: calc(1em * var(--dse-text-scale))` on element
roots; `zoom: var(--dse-card-scale)` on the card hosts, plus nested-root resets so a by-SCC
referenced card scales exactly once) are provably inert (freeze 101/101). Consumers carry
`:not([data-dse-print="on"])` — print/export always renders 1:1 — so neither token is
overridden in any theme or print block: both are Steel-, light-, and print-invariant
(`STEEL_INVARIANT`/`PRINT_INVARIANT`/`THEME_INVARIANT` in the guards; union 73 → 75).

| Token | D3-spec concept | Legacy (verbatim) | Steel (dark) | Steel light | Print |
|---|---|---|---|---|---|
| `--dse-text-scale` | SC-112 T7 (user text-size multiplier) | `1` | = Legacy (theme-invariant) | | = Legacy (consumers print-excluded) |
| `--dse-card-scale` | SC-112 T7 (user card-size multiplier) | `1` | = Legacy (theme-invariant) | | = Legacy (consumers print-excluded) |

## SC-106 amendment (2026-08-03 — provisional Steel hue resolution)

Scott's ruling (2026-08-03): act-spine/action-type colors follow `reference/colors.md`
(canonical, not judgment); temp-stamina hue and crit/VP gold are delegated to best judgment.
All three of the map's outstanding "Scott review" / "PROPOSED" flags are now closed:

1. **Act-spine hues — CONFIRMED, no value change.** `reference/colors.md`'s Ability Colors
   (Main=Red, Maneuver=Blue, Triggered=Green, Move=Orange/Yellow, No Action=Black/white
   theme-based, Traits/Other=Purple) match the `act-*` table above **exactly**, hue for hue —
   the SC-10 realignment (2026-07-10) had already landed on the site's canonical `--sc-act-*`
   tokens, which happen to already encode this same scheme. Verified against a ground-truth
   statblock render (Whip and Magic Longsword=red/Main, Kneel Peasant=blue/Maneuver,
   Bloodstones=green/Triggered, End Effect/Supernatural Insight=purple/Trait), both schemes.
   Only the stale "Scott review" comment wording in `styles-source.css` was cleaned up.
2. **Temp-stamina hue — CONFIRMED, no value change.** Kept the existing purple `#7c5cd6`
   (footnote 11 above). Rationale: purple is the only hue in the palette that is simultaneously
   outside the green/amber/red HP ramp *and* outside `act-maneuver`'s blue, so it reads as its
   own "temp/shield" signal rather than borrowing a state or action-type meaning; the palette's
   other purples (`role-artillery`, `act-trait`) never co-occur with a stamina bar, so there's
   no real collision risk. Ground-truth-verified on the `stamina-bar` fixture (temp segment
   renders as a distinct purple hatch over the healthy/dying fill, both schemes).
3. **Crit / Victory-Point gold — CHANGED, `#e3c14a` → `#e0b050`.** The site turned out to
   already style a specific crit gold (`v2/docs/stylesheets/steel-dice.css:11`,
   `.sc-dice-pop .crit { color: #e0b050; }`, one value shared by both color schemes) — the map's
   draft `#e3c14a` was an invented hue chosen because `--sc-tier-crit` doesn't exist as a
   palette token; `#e0b050` does exist, verbatim, in the site's own CSS, so it was adopted
   instead of the invented one. `--dse-vp` shares the same gold (unchanged rationale: both are
   "triumph" semantics, never co-located in one widget). Only the Steel (dark+light, single
   value — a fill, not text) cells changed; the print-scoped darkened value (`#8a6a00`) was left
   untouched since print composes its own value regardless of the Steel base. Verified on the
   `feature` fixture's crit power-roll-tier badge, both schemes — legible, and visually distinct
   from `tier-mid`'s amber (`#f0b429` dark / `#b9770e` light). One caveat surfaced and documented
   in footnote 12 above (not a regression): `--dse-vp` also has a TEXT-ink consumer
   (`.dse-enc__band[data-band="hard"/"extreme"]`) with pre-existing low contrast on the light
   Steel surface, marginally improved (not worsened) by this change.

**SC-121 audit lead (bonus item, resolved SKIP):** the site tints the power-roll tier badge's
glyph text to match its tier color (`steel-ability-cards.css:172`,
`.sc-ability__tier .badge { color: var(--t); }`). The plugin's `.dse-pr__badge` is architecturally
different — a SOLID clip-path-filled badge (`background: var(--dse-tier-*)`) with the tier ink
supplied separately by the theme-invariant `--dse-badge-fg` (SC-10 amendment above: "the tier
badge is a hollow clip-path frame — its interior is the card surface, so the ink is always
ink-on-surface"). Tinting the plugin's badge TEXT to `var(--t)` would set it to the exact same
color as its own solid fill directly behind it — mathematically invisible, not a rendering
nuance to visually confirm. Skipped; no code change. (Filed as an SC-121 audit lead per the
SC-106 task brief, not implemented here.)
