# Statblocks — High-Fantasy Steel — IMPLEMENTATION HANDOFF

This folder is an **approved design**, ready to port into the live v2 MkDocs site
(`steelcompendium.io/v2`). It renders Draw Steel creature statblocks in the High-Fantasy Steel
language, with every part of the block exposed as an **independent user preference** plus three
**presets**. Open `statblocks.html` to see/operate it.

> **CONTENT IS FROZEN.** Every word and number is verbatim from `data-bestiary-md`. This work only
> changes *design*. Do not alter any rules text, values, or ability wording.

---

## Locked decisions

- **Default preset:** **Steel Card.**
- **Role colors** (the one saturated color per block, keyed to Role; grey for the greys):
  | Role | Color | | Role | Color |
  |---|---|---|---|---|
  | Ambusher | yellow `#e3c14a` | | Hexer | green `#5cc98a` |
  | Harrier | pink `#e07ba8` | | Mount | teal `#48c9b0` |
  | Artillery | purple `#a87cd6` | | Support | orange `#e8954a` |
  | Brute | blue `#5d8fe0` | | Defender | tan `#c7a173` |
  | Controller | red `#e0584b` | | Leader / Solo | grey `#9aa2a8` |
  | | | | Minion (modifier) / Malice | grey `#9aa2a8` |
  These live at the top of `steel-statblock.css` — adjust hexes there only.
- **Glossary / rules links:** **not** a hardcoded term list in production. The source markdown
  already carries the links — the renderer must **preserve links present in the source** rather than
  re-deriving them. (The demo's `TERMS` list in `statblock-render.js` is illustrative only; drop it
  when the source-link data is wired in. The `body[data-aug-links]` on/off gate can stay to let users
  suppress link styling.)

## Files to port

| File | Destination | Notes |
|---|---|---|
| `steel-statblock.css` | `v2/docs/stylesheets/steel-statblock.css` | **The deliverable.** Add to `mkdocs.yml extra_css` **after** `steel-ability-cards.css` (it reuses that file's `.sc-ability__pr/__tier/__cost/__chip/__section/__enh` + the `--fx-*` / `--sc-*` tokens and `.sc-crest`). Covers both `slate` + `default` themes, responsive, and print. |
| `statblock-render.js` | reference | Shows the exact DOM the CSS targets. Prefer emitting that DOM from `steel-etl` at build time (the bestiary is generated there); use a runtime renderer only if needed. Strip the demo-only `TERMS` linkify in favor of source links. |
| `statblock-data.js` | reference | The feature data shape — mirrors the bestiary frontmatter + feature blockquotes 1:1, so the Go/ETL side has an exact target. |
| `statblocks.html` | reference only | The review shell (token shim, Settings drawer markup, the preset/customise panel + persistence JS). Not shipped; lift the drawer rows + the preference JS pattern from it. |

## The DOM contract (what the CSS styles)

```
.sb-wrap[data-role][data-creature]          ← role drives --role
  .sb__sticky …                             ← compact mini-header (sticky augmentation)
  article.sb.md-typeset
    header.sb__head    (.sb__head-row → .sb__identity + .sb__class)   ← role gradient + centered diamond on its border
    .sb__defenses      (5 × .sb__stat)
    .sb__meta          (4 × .sb__field.sb__field--meta)               ← fixed 2×2: Immunity|Weakness / Movement|Captain
    .sb__chars         (5 × .sb__char → .sb__char-box/-v/-l)
    .sb__features
      article.sc-ability.sb__feat[data-action][data-kind]
        .sb__feat-head (.sb__feat-crest | .sb__feat-icon · .sb__feat-titles[eyebrow+name] · .sb__feat-corner[cost])
        .sb__ku  (.sb__field--kw / .sb__field--usage)
        .sb__dt  (.sb__field--dist / .sb__field--tgt)
        .sc-ability__pr / __section / __enh / .sb__feat-body / .sb__feat-trailing   ← reused ability-card grammar
      section.sb__band--villain / .sb__band--malice (collapsible)
```
One DOM; the layout reflows entirely from `data-*` attributes on the root `<html>` (see below). The
shared `.sb__field` cell + the `grid / gridc / ledger` vocabulary is used by both secondary stats and
feature specs.

## Preference contract (attributes on `<html>`)

| Attribute | Values (default **bold**) | Effect |
|---|---|---|
| `data-sb-kwusage` | **crest** · text · grid · ledger | Keyword+usage block. **Only `crest`** shows a crest + eyebrow **and** gives features the sub-card frame; the others use a one-line head (inline icon + name + cost) and flat features with diamond+line separators. |
| `data-sb-disttarget` | text · **grid** · ledger | Distance+target block. `grid` = centered framed cells. |
| `data-sb-meta` | **grid** · gridc · ledger | Secondary-stats 2×2. `grid` = label-top; `gridc` = centered; `ledger` = hairline rows. |
| `data-sb-charline` | **two** · one | Characteristics on two lines or one. |
| `data-sb-charbox` | **off** · on · onword | Boxed first letter. One-line honors all three (`Might +1` / `[M] +1` / `[M] Might +1`); two-line treats `onword`≡`on` (word always shown). |
| `data-sb-villain` | **banded** · inline | Villain actions grouped in a collapsible band, or flowed in as normal features. |
| `data-sb-wide` | **off** · on | Multi-column features on wide screens (independent of all the above). |
| `data-sb-stickymeta` | **on** · off | Second line (secondary stats) in the sticky header. |
| `body[data-aug-links]` | **on** · off | Rules-link styling on/off. |
| `body[data-aug-sticky]` | **on** · off | Sticky mini-header on/off. |

**Presets** are just bundles of the above:
- **Steel Card** *(default)* — `kwusage=crest, disttarget=grid, meta=grid, charline=two, charbox=off, villain=banded, wide=off`
- **Sourcebook** — `kwusage=text, disttarget=text, meta=ledger, charline=one, charbox=on, villain=inline, wide=off`
- **Index Card** — `kwusage=grid, disttarget=grid, meta=gridc, charline=two, charbox=onword, villain=banded, wide=off`

## Wiring the preferences (follow the existing precedent)

Mirror the `data-card-style` pattern already in `v2/docs/javascripts/settings-panel.js`:
1. One `applyX()` per attribute, each setting `document.documentElement.setAttribute('data-sb-…', v)`.
2. A `preset` control that writes the bundle, and re-derives "Custom" when individual attrs diverge
   (see `detectPreset()`/`syncPresetUI()` in `statblocks.html`).
3. Persist under the existing `mkdocs:fontPrefs` store (the demo uses its own `localStorage` key only
   because it's standalone).
4. Add a **"Statblocks"** group to the Settings drawer using the real `steel-settings.css` classes —
   the `<aside class="sc-settings-drawer">` block in `statblocks.html` is copy-ready (preset select +
   the per-piece selects/toggles + the web-extras toggles).

Tier badges in power rolls use the **DrawSteelGlyphs** font (`!`/`@`/`#` → ≤11 / 12–16 / 17+), exactly
as the standalone ability cards do — no change needed beyond loading that font (already on the site).

## Notes / nice-to-haves (not blocking)

- The Malice band is built from the shared **Devil Malice** feature set; in production, source each
  family's malice block the same way (it repeats across that family's statblocks).
- `Villain Action N` and `Signature` render as the standard cost badge — keep that mapping for any
  other cost-like labels (e.g. summoner "Free Strike Damage Type" replaces "With Captain" in the 2×2).
- Verify role hexes against the official role palette if MCDM publishes exact values.
