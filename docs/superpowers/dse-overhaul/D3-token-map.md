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
| `--dse-surface-sunken` | §1.2-A `surface-sunken` ¹ | `rgba(0,0,0,.2)` | `rgba(220,226,230,0.06)` | `#eaeeef` | `#fff` |
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
| `--dse-font-display` | §1.2-I `font-display` ⁶ | `var(--font-text)` | `"Source Serif 4", var(--font-text)` (OD-4) | | = active theme (no override) |
| `--dse-font-mono` | §1.2-I `font-mono` | `var(--font-monospace)` | = Legacy (theme-invariant) | | = Legacy |
| `--dse-chip-bg` | D2 extra (chips/tags) | `var(--tag-background)` | `rgba(220,226,230,0.06)` | `#eaeeef` | `transparent` |

⁵ The spec has no separate heading token; D2 does. Steel grades headings slightly brighter
(dark) / darker (light) than body fg — the emboss shadow (`--dse-emboss`) does the rest.
⁶ **Legacy differs from spec:** the spec's §1.2-I proposed `var(--font-interface)`; D2 shipped
`var(--font-text)`. The shipped value stands (Legacy is a record).

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

## Power-roll tiers

| Token | D3-spec concept | Legacy (verbatim) | Steel (dark) | Steel light | Print |
|---|---|---|---|---|---|
| `--dse-tier-low` | §1.2-H `tier-low` | `var(--text-normal)` | `var(--sc-tier-low, #e74c3c)` | `#c0392b` | `#c0392b` |
| `--dse-tier-mid` | §1.2-H `tier-mid` | `var(--text-normal)` | `var(--sc-tier-mid, #f0b429)` | `#b9770e` | `#b9770e` |
| `--dse-tier-high` | §1.2-H `tier-high` | `var(--text-normal)` | `var(--sc-tier-high, #4caf6a)` | `#1e8449` | `#1e8449` |
| `--dse-tier-crit` | D2 extra (no site analog) ⁹ | `var(--text-normal)` | `#e3c14a` (gold — **proposed**) | | `#8a6a00` |
| `--dse-badge-fg` | D2 extra (§2.8 badge-text hook) ¹⁰ | `var(--dse-fg)` | `#0f1214` | `#fff` | `#fff` |

Tier badges are meaning-bearing → the Task-5 print rule adds `print-color-adjust: exact`
(mirrors `v2/print.css` `.power-roll-badge`).
⁹ The site has no crit tier color (`--sc-tier-crit` does not exist). Proposal: **gold**
`#e3c14a` — crit (nat 19–20) is the jackpot outcome, above the red/amber/green ramp; gold is
the near-universal game-UI crit cue. Light/dark-stable like the role hues. **Scott review.**
¹⁰ Badge text sits ON the tier fill: dark-scheme fills are the bright hues → near-black ink
(`#0f1214`); light-scheme fills are the darker hues → white ink.

## Stamina

| Token | D3-spec concept | Legacy (verbatim) | Steel (dark) | Steel light | Print |
|---|---|---|---|---|---|
| `--dse-stamina-healthy` | §1.2-E `hp-healthy` | `limegreen` | `var(--sc-role-hexer, #5cc98a)` | | `#1a7a3a` |
| `--dse-stamina-winded` | §1.2-E `hp-winded` | `yellow` | `#f0b429` | | `#8a6a00` |
| `--dse-stamina-dying` | §1.2-E `hp-dying` | `red` | `#e74c3c` | | `#a11` |
| `--dse-stamina-temp` | §1.2-E `hp-temp` (also the heal cue — no `healing` token, plan T3) ¹¹ | `deepskyblue` | `#5dade2` (**proposed**; spec said `#7c5cd6`) | | `#555` |
| `--dse-stamina-track` | §1.2-E (bar track) | `var(--code-background)` | `rgba(220,226,230,0.06)` | `#eaeeef` | `#fff` |

Bar fills are fills, not text — hues stay light/dark-stable (no contrast pressure).
¹¹ **Legacy differs from spec:** the spec assumed the live bar's temp indicator was `purple`
and derived Steel `#7c5cd6` for continuity; D2 actually shipped Legacy `deepskyblue`. The same
continuity argument now points **blue**: proposed `#5dade2` (palette's ranged-blue — a defined
palette hue, reads "temp/shield" next to the green/amber/red fills). If Scott prefers the
spec's purple to disambiguate from `act-move` blue, `#7c5cd6` is the alternative. **Scott
review.**

## Encounter

| Token | D3-spec concept | Legacy (verbatim) | Steel (dark) | Steel light | Print |
|---|---|---|---|---|---|
| `--dse-turn-done` | §1.2-E `taken-turn` | `limegreen` | `var(--sc-role-hexer, #5cc98a)` | | `#1a7a3a` |
| `--dse-malice` | §1.2-E `malice` (standalone — D2 has NO `role-malice`) | `red` | `#e0584b` | | `#a11` |
| `--dse-vp` | D2 extra (victories / negotiation) ¹² | `orange` | `#e3c14a` (gold — **proposed**) | | `#8a6a00` |
| `--dse-warn` | §1.2-E `warning` | `orange` | `#e8954a` | | `#8a5a00` |
| `--dse-danger` | §1.2-E `damage` | `crimson` | `#e74c3c` | | `#a11` |

¹² Legacy has `vp` and `warn` both `orange` (indistinguishable). Steel splits them: warnings
keep the spec's support-orange `#e8954a`; victories go **gold** `#e3c14a` ("victory = gold",
and it separates a VP chip from a warning at a glance). Gold is shared with `tier-crit`
(deliberate: both are "triumph" semantics, never co-located in one widget). **Scott review.**

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

## Ability action-type accents (the Steel design proposal — **Scott review**)

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
maneuver-purple at 3px-spine size); the area-teal is unambiguous. Note `act-move`'s `#5dade2`
is shared with the proposed `stamina-temp` (spine vs bar-fill — no co-location; flag if Scott
takes the purple temp alternative, which removes the overlap entirely).

Print keeps the darkened (light-column) hue, composed with Steel only (scoping caveat above).

| Token | D3-spec concept | Legacy (verbatim) | Steel (dark) | Steel light | Print |
|---|---|---|---|---|---|
| `--dse-act-main` | §1.2-G intent, re-keyed to action type | `none` | `var(--sc-ability-strike, #e74c3c)` | `#c0392b` | `#c0392b` (Steel-composed, exact) |
| `--dse-act-maneuver` | §1.2-G intent, re-keyed to action type | `none` | `var(--sc-ability-maneuver, #bb8fce)` | `#7d3c98` | `#7d3c98` (Steel-composed, exact) |
| `--dse-act-triggered` | §1.2-G intent, re-keyed to action type | `none` | `var(--sc-ability-triggered, #f0b429)` | `#b9770e` | `#b9770e` (Steel-composed, exact) |
| `--dse-act-move` | §1.2-G intent, re-keyed to action type | `none` | `var(--sc-ability-ranged, #5dade2)` | `#2874a6` | `#2874a6` (Steel-composed, exact) |
| `--dse-act-none` | §1.2-G intent, re-keyed to action type | `none` | `var(--sc-ability-area, #48c9a4)` | `#148f77` | `#148f77` (Steel-composed, exact) |
| `--dse-act-trait` | §1.2-G intent, re-keyed to action type | `none` | `var(--sc-ability-passive, #b0b7bb)` | `#7b8a8b` | `#7b8a8b` (Steel-composed, exact) |

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
| `font-body`, `font-size-lg/sm`, `weight-strong`, `tracking` | not tokenized — D2 inherits Obsidian type; only `font-display`/`font-mono` exist |
| `fx-plate` | fulfilled by `metal-grad` (+ `metal-faint` for near-transparent sheens) |
| `elevation-hover`, `transition` | not tokenized in D2 — add ONLY if a Task-3 Steel rule needs them (plan reconciliation); if added, that is a union + base + map + guard change |
| `accent-spine` | not a token — it is the element-set alias `--dse-act`/`--dse-role` (already wired in D2) |

## Appendix B — Legacy values that differ from the spec's assumptions

The spec predates D2; the shipped Legacy base wins (this column is a **record**). Deltas:

| Token | Spec assumed | D2 shipped (authoritative) |
|---|---|---|
| `surface-sunken` | `var(--color-base-30)` | `rgba(0,0,0,.2)` |
| `border` (default hairline) | *(spec `border-muted`)* `var(--color-base-40)` | `var(--background-modifier-border)` |
| `hover` | `var(--color-base-25)` | `var(--background-modifier-hover)` |
| `pad` | `1em` | `1rem` |
| `font-display` | `var(--font-interface)` | `var(--font-text)` |
| `stamina-temp` | `purple` | `deepskyblue` (→ footnote 11: Steel proposal follows the blue) |
| `role-*` (all 12) | `inherit` | `var(--dse-fg-muted)` (renders the grey spine Legacy statblocks actually draw) |
| `act-*` (all 6) | *(spec `ability-*`)* `inherit` | `none` (no spine in Legacy) |

## Open items for Scott

1. **`act-*` Steel hues** — the action-type → palette-slot mapping above (main=red,
   maneuver=purple, triggered=amber, move=blue, none=teal-green, trait=grey).
2. **`tier-crit` gold `#e3c14a`** (no site analog to inherit).
3. **`vp` gold `#e3c14a`** vs keeping it on `warn`'s orange family.
4. **`stamina-temp` Steel blue `#5dade2`** (continuity with shipped deepskyblue) vs the spec's
   purple `#7c5cd6` (which would also de-overlap from `act-move`).
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
