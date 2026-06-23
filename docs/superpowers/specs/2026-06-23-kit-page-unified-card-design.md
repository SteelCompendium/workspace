# Kit page — unified "High-Fantasy Steel" card

**Date:** 2026-06-23
**Status:** Design approved; ready for implementation plan.
**Scope:** Site-only rendering polish — a build-time renderer in `steel-etl/internal/site`
plus a new `v2` stylesheet. No data-repo, schema, or SCC-scheme changes.

## Problem

The v2 kit pages (e.g. `Browse/kit/ranger.md`) are visually inconsistent. The signature
ability is already a full High-Fantasy Steel `.sc-ability` card (spliced in by the
`embedItemCards` post-pass via a `{data-scc}` heading marker), but the rest of the page —
the flavor paragraph, the **Equipment** section, and the **Kit Bonuses** section — is plain
markdown (`## Equipment` + a sentence; `## Kit Bonuses` + `**Label:**` value lines).

Meanwhile the **kit preview card** (`kitCard` in `internal/site/cards.go`) already renders
the same data attractively: a labeled equipment box and two rows of stat sub-cells. The goal
is to bring that grammar onto the full page so the whole kit page reads as one cohesive
forged artifact.

## Decision summary (from brainstorming)

- **Treatment: a unified kit card.** Replace the kit page body with one cohesive forged
  card — header band (kit name + Martial/Magic/Psionic eyebrow + backpack crest), flavor,
  equipment box, bonus stat grid, and the signature-ability card **nested inside**.
- **Bonus grid: always all 8 fixed slots.** Every kit page shows the same 8 cells in the
  same positions (`—` for an absent bonus), honoring the "predictable lookup" principle and
  matching the preview card. The eight: Stamina (per echelon), Speed, Stability, Disengage;
  Melee Damage, Ranged Damage, Melee Distance, Ranged Distance.

## Architecture

A new build-time renderer mirrors the existing card builders (`buildAbilityCardPage`,
`buildStatblockIslandPage`, `buildFeatureblockPage`):

- **`steel-etl/internal/site/kit_page.go`** → `buildKitPage(data []byte) ([]byte, bool)`.
  Returns `(carded, true)` when the page frontmatter is `type: kit`; otherwise
  `(data, false)` so the caller writes it unchanged.
- Wired into `buildSection` (`internal/site/build.go`) alongside the other `buildXPage`
  calls, **before `injectH1`** — the card becomes the page body and `injectH1` still
  prepends the hidden `# Name` MkDocs needs for title/nav/TOC.
- **Site-only.** The shared data repos (Obsidian / JSON / YAML / plain md) are untouched;
  frontmatter is preserved verbatim.

### Inputs (all already present)

The renderer reads only frontmatter + the body's signature-ability heading line. The kit
parser already lifts everything needed into frontmatter:
`equipment_text`, the eight `*_bonus` fields, `flavor`, and (when annotated) `kit_type`.

The renderer **reuses the preview card's package-level helpers** in `cards.go` (same `site`
package — no duplication): the bonus-value formatters (`bonusShort`, `orZero`, `orDash`),
the kind/keyword derivation (`signatureFromBody`), `cardFlavor`, and the `statsBlock`
stat-grid grammar. The kit-kind label (Martial / Magic / Psionic) is derived exactly as
`kitCard` does: prefer `kit_type` frontmatter, else detect `Psionic`/`Magic` in the
signature ability's keywords, else default Martial.

### Output structure

An `md_in_html` block so the nested heading marker + transcluded card are processed:

```
<section class="sc-kit" markdown>
  <header class="sc-kit__head"> crest · "<Kind> Kit" eyebrow · kit name </header>
  <p class="sc-kit__flavor"> … </p>

  <div class="sc-kit__band">
    <div class="sc-kit__band-head">Equipment</div>
    <div class="sc-kit__equip"> equipment_text (verbatim) </div>
  </div>

  <div class="sc-kit__band">
    <div class="sc-kit__band-head">Kit Bonuses</div>
    <!-- statsBlock row 1: Stamina/Speed/Stability/Disengage -->
    <!-- statsBlock row 2: Melee Dmg/Ranged Dmg/Melee Dist/Ranged Dist -->
  </div>

  <div class="sc-kit__band">
    <div class="sc-kit__band-head">Signature Ability</div>

### <name> {data-scc="…"}          ← preserved verbatim from the body

  </div>
</section>
```

### Nesting the signature ability — the key mechanism

`buildKitPage` does **not** render the ability itself. It extracts the body's
`### <name> {data-scc="…"}` heading line (the only `dataSCCHeadingRe`-matching line on a kit
page) and re-emits it **inside** the Signature Ability band, surrounded by blank lines so
MkDocs treats it as markdown within the `markdown`-enabled `<section>`. The existing
**`embedItemCards`** post-pass (the global pass in `build.go`, run after every
`buildSection`) then transcludes the standalone `.sc-ability` card in place — exactly as it
already does on `type: class` pages. The embed pass is purely textual (line-based regex on
the file), so nesting inside the raw-HTML wrapper is safe and requires **no change to the
embed mechanism**.

Ordering guarantees this works: `buildKitPage` runs inside `buildSection`; `embedItemCards`
runs afterward over all files. `buildKitPage` must **preserve, never consume**, the
`{data-scc}` marker.

### Edge cases

- **No signature ability** (a kit whose body has no `{data-scc}` ability heading): omit the
  Signature Ability band entirely; the rest of the card renders normally.
- **Absent bonuses:** render `—` in the fixed slot (via `orDash`/`orZero`), never drop the
  cell.
- **Long bonus values** (e.g. `+1/+1/+1`): handled by `statsBlock`'s existing
  small-face rule for values longer than 4 runes.

## CSS

New **`v2/docs/stylesheets/steel-kit.css`**, registered in `mkdocs.yml` `extra_css` after
`steel-ability-cards.css` (respecting the documented load order). It composes existing
`--fx-*` ornament tokens and `--sc-*` palette tokens — no new brand colors, no new icons
(the backpack crest already exists). It defines:

- `.sc-kit` — the forged plate (bevel/hairline/metal-gradient like `.fb-wrap`).
- `.sc-kit__head` / `.sc-kit__eyebrow` / `.sc-kit__name` / crest — header band.
- `.sc-kit__band` / `.sc-kit__band-head` — the small-caps section heads.
- `.sc-kit__equip` — the equipment box.
- Stat-grid styling that matches the preview card's `.sc-card__stats` look (reuse the same
  class markup; scope/derive its appearance inside `.sc-kit`).

Both slate (default signature) and light "default" schemes; hover/transition limited to the
system's hover-lift + 0.15–0.2s rules. The hidden `# Name` H1 is suppressed exactly as the
ability/statblock/featureblock cards suppress theirs.

## Testing & verification

- **`steel-etl/internal/site/kit_page_test.go`** (following `ability_cards_test.go`):
  - a fully-populated kit → asserts the `.sc-kit` shell, the `<Kind> Kit` eyebrow, the
    equipment box content, all 8 bonus cells (including `—` for an absent one), and that the
    `### … {data-scc="…"}` marker is preserved.
  - a kit with no signature ability → asserts the Signature Ability band is omitted and the
    card otherwise renders.
  - a non-kit page → `buildKitPage` returns `(data, false)` unchanged.
- **Build + visual check:** `steel-etl gen --all` then `steel-etl site`, then inspect a
  rendered kit page (e.g. Ranger) via Brave (Playwright-core + Brave executablePath) in both
  schemes.

## Docs to update on "done"

- `DESIGN.md` → Component systems table: add the kit page card row (implementation +
  this spec).
- (No SCC, schema, pipeline, or git-workflow changes, so no other router/log updates.)

## Out of scope

- Per-kit data/schema changes; the bonus/equipment fields already exist.
- Reworking the signature-ability `.sc-ability` card itself (unchanged; only nested).
- Any change to the kit preview card (`kitCard`) — it stays the source of the shared grammar.
