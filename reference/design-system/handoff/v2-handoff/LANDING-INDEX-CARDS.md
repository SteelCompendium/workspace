# Browse Landing + Category Index Cards — reference

> **STATUS: ✅ SHIPPED.** The Browse landing crests and the rich category-index stat-cards are
> live. This doc is **reference** — read it to match the existing pattern (markup classes, the
> `cards.go` shape, the per-type decisions). The live repo is source of truth; details here may be
> slightly stale where the site was tweaked after hand-off. **Not an open build task.**
>
> Covers two shipped pieces:
> 1. the heraldic **crests** on the Browse landing (`.grid.cards`), and
> 2. the rich **`.sc-card` stat-cards** on the flat category index pages (kit, class, ancestry,
>    career, treasure, perk, title, complication, culture, condition, skill, movement, negotiation).
>
> Styling lives in `steel-redesign.css`; the generator branch lives in `internal/site/cards.go`
> (wired into `buildIndexContent`). Full `steel-etl` wire-up: **`steel-etl/PATCH.md`**.
> Preview: **`preview/site.html`**.

---

## What shipped, and where

| # | Change | Repo / path |
|---|---|---|
| 1 | The stylesheet | `v2 → docs/stylesheets/steel-redesign.css` |
| 2 | Register it (load after the existing sheets) | `v2 → mkdocs.yml` `extra_css` (see README load order) |
| 3 | Crest icons on the landing | `v2 → static_content/docs/Browse/index.md` |
| 4 | Rich stat-cards on category indexes | `steel-etl → internal/site/cards.go` + `build.go` |

`steel-redesign.css` uses only the site's existing variables (`--md-*`, `--sc-*`, the four
`--md-*-font` vars) plus the small steel-ornament token set it defines itself (`--fx-*`), and
themes in both **slate** and **default**. It styles only `.grid.cards` (landing) and
`.sc-card` / `.sc-cards` (indexes) — power roll, ability cards, statblocks and reading typography
are left alone.

---

## 3 · Landing crests

Each landing card's title carries a heraldic crest — a Material icon (with an attr_list class)
**at the start of the `###` heading**:

```markdown
-   ### :material-shield-sword:{ .sc-crest } Classes

    ---

    Censor, Conduit, …

    [:octicons-arrow-right-24: View Classes](class/index.md)
```

- Uses only **attr_list** (the `{ .sc-crest }` on the icon) + the standard grid-cards `md_in_html`
  on the outer `<div class="grid cards" markdown>` — both already enabled. **No nested
  `<div markdown>`** (that was the earlier bug: an inline `###` after a `<span>` isn't a heading,
  and a raw `<div>` inside a list item turns the card body into a code block).
- The `### h3` is preserved at line-start, so `browse-enhancements.js`'s count badge still attaches
  to it, and the crest icon (`<span class="twemoji sc-crest">`) is styled by CSS as the shield.
- Icons are standard **Material** icons (the theme already ships them) — swap any name to taste.
  Used: `shield-sword, account-group, auto-fix, bag-personal, briefcase-variant, alert-decagram,
  star-circle, diamond-stone, crown, treasure-chest`.

## 4 · Rich category-index cards (`steel-etl`)

Implemented for all flat index types listed above — see **`steel-etl/PATCH.md`** for the exact
wire-up (the `internal/site/cards.go` file + the hook in `buildIndexContent`). The nested
`feature` / `ability` aggregations kept their existing UI **at the time** — that nesting is exactly
what the open **`FEATURE-INDEXES.md`** task replaces.

`buildIndexContent()` emits a `.sc-cards` grid of `.sc-card` entries instead of the flat
`.browse-index` link list. **All the stat data already exists in each item's frontmatter**
(`type, equipment_text, stamina_bonus, speed_bonus, stability_bonus, melee_damage_bonus`), so no
data-repo change is needed — the generator reads what's there (plus the signature ability, parsed
from the page body in the site layer only).

### Count badges (`browse-enhancements.js`)

`extractCount()` counts `.browse-index li`, then falls back to counting `.md-content a[href]`.
The index pages emit `.sc-card` anchors, so it counts those first so counts stay exact:

```js
// in extractCount(), before the generic link fallback:
var cards = doc.querySelectorAll(".sc-card");
if (cards.length > 0) return cards.length;
```

### Target HTML (what the generator writes)

```html
<div class="sc-cards">
<a class="sc-card sc-fil" href="battlemind.md">
  <div class="sc-card__head">
    <span class="sc-crest"><span>:material-bag-personal:</span></span>
    <div><div class="sc-card__type">Hybrid Kit</div>
    <div class="sc-card__name">Battlemind</div></div>
  </div>
  <div class="sc-card__equip">Light armor · Medium weapon</div>
  <div class="sc-card__stats">
    <div class="sc-card__stat"><div class="v">+3</div><div class="l">Stamina</div></div>
    <div class="sc-card__stat"><div class="v">+2</div><div class="l">Speed</div></div>
    <div class="sc-card__stat"><div class="v">+1</div><div class="l">Stability</div></div>
    <div class="sc-card__stat is-dmg"><div class="v">+2/+2/+2</div><div class="l">Melee Dmg</div></div>
  </div>
  <div class="sc-card__sig">
    <span class="sc-card__dot" data-type="strike"></span>
    <span class="sc-card__sig-label">Signature</span>
    <span class="sc-card__sig-name">Unmooring</span>
  </div>
</a>
…
</div>
```

### Go sketch (per-type branch in `buildIndexContent`)

When the directory is a rich type, build cards instead of the `<li>` list. Reuse the existing
`splitFrontmatter` / `parseFrontmatterField` helpers:

```go
var richCardTypes = map[string]bool{"kit": true /* …extend per type… */}

func buildKitCard(dir, file string) string {
    data, _ := os.ReadFile(filepath.Join(dir, file))
    fm, body := splitFrontmatter(string(data))
    name   := firstNonEmpty(parseFrontmatterField(fm, "name"), fileToTitle(file))
    equip  := parseFrontmatterField(fm, "equipment_text")        // "You wear light armor and wield a medium weapon."
    stam   := bonus(parseFrontmatterField(fm, "stamina_bonus"))  // strip " per echelon" -> "+3"
    spd    := orZero(parseFrontmatterField(fm, "speed_bonus"))
    stab   := orZero(parseFrontmatterField(fm, "stability_bonus"))
    dmg    := orDash(parseFrontmatterField(fm, "melee_damage_bonus"))
    armor, weapon := parseEquip(equip)                            // "Light", "Medium"
    kind   := kitKind(equip, body)                               // "Martial" | "Caster" | "Hybrid"
    sig, sigType := signatureFromBody(body)                      // parse "## Signature Ability\n### X" + type emoji

    icon := "shield-sword"; if kind != "Martial" { icon = "auto-fix" }
    // … fmt.Fprintf the target HTML above …
}
```

**Signature ability** is the one field not in frontmatter; it's parsed from the page **body** in
the site generator (renders as `## Signature Ability` → `### Name`, with type inferable from the
keyword-table emoji: 🗡→`strike`, 🏹→`ranged`, ❇→`area`, ⭐→`passive`, 👤→`maneuver`,
❗→`triggered`).

---

## Per-type decisions (as shipped)

- Landing count badges hidden (`.browse-card-count { display:none }`).
- **kit** — full stat line (Stamina/Speed/Stability/Disengage + Melee/Ranged Dmg + Distance);
  weapon parse resolves specific weapons ("Bow").
- **ancestry / career / title** — lead with body flavor; career adds
  Languages/Project-Pts/Renown/Wealth stat boxes + Skills/Perk text.
- **class** — a CSS-clamped primer (not a `<details>` toggle — a collapsible can't live inside the
  card's wrapping `<a>` anchor).
- **culture** — shows Skill Options; **skill** truncation raised so short skills don't ellipsize.
- **complication / perk** — full-width editorial **wide** cards (`.sc-card--wide`).

All in `cards.go` + `steel-redesign.css`; new frontmatter fields to verify are in `steel-etl/PATCH.md`.
