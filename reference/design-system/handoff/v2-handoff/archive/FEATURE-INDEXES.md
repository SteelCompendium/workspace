# Feature & Treasure Index Pages — handoff

> **STATUS: 🔲 TO IMPLEMENT — this is the build task.** The CSS (`steel-indexes.css`) and JS
> (`steel-feature-browser.js`) already exist in `v2/docs/…` and are ready to copy. **What's left:**
> (1) wire both into `mkdocs.yml` (see README load order), (2) add the `internal/site/build.go`
> branch that emits **folder cards** for index-of-indexes nodes and **preview cards** for
> parent-of-leaf nodes (target HTML + sketch below), and (3) stand up the **Search & Filter** page
> with its JSON data island. Verify with `preview/feature-indexes.html` and a local `mkdocs serve`.
> Everything in `README.md`'s status table marked ✅ is already done — reference only.

The high-fantasy steel treatment for the **nested index pages** that sit between the Browse
landing and the leaf item cards — the deep folder trees under **Feature** and **Treasure**.
Drop-in for the v2 MkDocs site, built against the real markup + CSS variables, both themes.

> **Preview:** open `preview/feature-indexes.html` — a view switcher across all the new page
> types (folder indexes, the trait/ability preview indexes, treasure folders, and the live
> Search & Filter browser), on the production CSS/JS with a 🌙 light/dark toggle.

This is the "remaining index pages" pass. The leaf cards themselves already exist —
ability plates (`ABILITY-CARDS.md`), trait niches (`TRAITS.md`), and the flat-type stat /
wide cards (`README.md`). This file covers everything **above** the leaves.

---

## The tree, and the three node types

```
Browse/                         ← crested landing  (steel-redesign.css .grid.cards)
 ├─ feature/                    ── index-of-indexes ─┐
 │   ├─ trait/                  ── index-of-indexes  │  FOLDER cards
 │   │   └─ censor/             ── index-of-indexes  │  .sc-folders / .sc-folder
 │   │       └─ level-1/        ── parent-of-leaves ─┤  PREVIEW cards (trait)
 │   │           └─ judgment/   ── LEAF (full trait) │  .sc-prevs / .sc-prev--trait
 │   └─ ability/ … /censor/ … ── parent-of-leaves ──┤  PREVIEW cards (ability)
 │                                                   │  .sc-prevs / .sc-prev--ability
 └─ treasure/ … /1st-echelon/ ── index-of-indexes ──┘  FOLDER cards
     └─ consumable/             ── parent-of-leaves     (leaf treasure cards already done)
```

Per the content model, a node is **either** an index-of-indexes **or** a parent-of-leaves —
never both. That gives a clean rule for the generator: emit **folder cards** when the
children are directories, **preview cards** when the children are item pages.

| Node kind | Where | Markup | Card |
|---|---|---|---|
| **Index-of-indexes** | `feature/`, `feature/trait/`, `…/censor/`, `treasure/`, `treasure/leveled/` | `.sc-folders` › `.sc-folder` | navigational "folder" — crest · name · count · summary · chevron |
| **Parent-of-leaves (trait)** | `feature/trait/censor/level-1/` | `.sc-prevs` › `.sc-prev.sc-prev--trait` | recessed-niche preview, spine accent |
| **Parent-of-leaves (ability)** | `feature/ability/censor/level-1/` | `.sc-prevs` › `.sc-prev.sc-prev--ability` | raised-plate preview, action crest |

Two registers, on purpose: folder/trait nodes are **recessed** (containers), ability previews
are **raised plates** — the same elevation language as `steel-traits.css` vs `steel-ability-cards.css`.

---

## Files

| File | Repo path | Role |
|---|---|---|
| `steel-indexes.css` | `v2 → docs/stylesheets/steel-indexes.css` | Folder cards, trait/ability preview cards, and the Search & Filter chrome. Both themes. |
| `steel-feature-browser.js` | `v2 → docs/javascripts/steel-feature-browser.js` | `SCBrowse.card(item)` (shared preview renderer) + `SCBrowse.mount(el)` (the live filter). |

### Wire-up (`mkdocs.yml`)

```yaml
extra_css:
  - stylesheets/steel-redesign.css         # --fx-* ornament tokens + .sc-crest (existing)
  - stylesheets/steel-ability-cards.css     # --sc-act-* action palette (existing)
  - stylesheets/steel-traits.css            # (existing)
  - stylesheets/steel-indexes.css           # <-- add AFTER the above

extra_javascript:
  - javascripts/steel-feature-browser.js    # only needed on the Search & Filter page
```

`steel-indexes.css` defines **no new color tokens** — folder & preview cards reuse the
`--fx-*` ornament set, and ability previews reuse the `--sc-act-*` action colors.

---

## 1 · Folder cards (index-of-indexes)

Build-time: in `internal/site/build.go → buildIndexContent()`, when a directory's children are
**directories**, emit `.sc-folder` anchors instead of the `<li>` list. The count is just the
number of leaf items beneath (the same number the old `.browse-index` count showed); the
one-line `__sub` is optional editorial (omit it and the card still reads).

```html
<div class="sc-folders">                          <!-- add --lg for 2–3 big nodes (Trait|Ability) -->
  <a class="sc-folder" href="censor/">
    <span class="sc-crest sc-folder__crest"><span>{{ material-icon-svg }}</span></span>
    <div class="sc-folder__main">
      <h3 class="sc-folder__name">Censor</h3>
      <div class="sc-folder__sub">Order, deity &amp; domains, Wrath, your signature kit &amp; abilities</div>
    </div>
    <div class="sc-folder__meta">
      <span class="sc-folder__count">10<span class="u">lv</span></span>
      <span class="sc-folder__chev">{{ chevron-svg }}</span>
    </div>
  </a>
  …
</div>
```

- The crest takes any Material icon (same `.sc-crest` shield as the landing); pick one per
  category. The `__count` unit (`lv`, `feat`, `sets`…) is optional.
- Hover lifts the plate, slides the chevron, and tints it teal — the site's standard hover.

## 2 · Preview cards (parent-of-leaves)

The full trait/ability cards are long (a trait can carry a dozen abilities). The index shows a
**condensed preview** that links to the full page. `SCBrowse.card(item)` produces the exact
markup the CSS expects — call it from the generator, or copy the shapes below.

**Trait preview** — eyebrow (class · level), name, clamped flavor, and a foot marker
("Grants the Judgment maneuver" / "3 benefits"):

```html
<a class="sc-prev sc-prev--trait sc-fil" data-action="trait" href="censor-order/">
  <div class="sc-prev__head">
    <div class="sc-prev__titles">
      <div class="sc-prev__eyebrow"><span class="sc-prev__dia"></span>Censor</div>
      <h3 class="sc-prev__name">Censor Order</h3>
    </div>
    <div class="sc-prev__tag">Level <span class="num">1</span></div>
  </div>
  <div class="sc-prev__flavor">Choose the Exorcist, Oracle, or Paragon order…</div>
  <div class="sc-prev__foot"><span class="sc-prev__grant"><span class="dot"></span>Grants an ability</span></div>
</a>
```

**Ability preview** — action crest + label, name, cost tag, keyword chips, distance/targets:

```html
<a class="sc-prev sc-prev--ability sc-fil" data-action="maneuver" href="judgment/">
  <div class="sc-prev__head">
    <span class="sc-crest sc-prev__crest"><span class="sc-prev__glyph">f</span></span>
    <div class="sc-prev__titles">
      <div class="sc-prev__eyebrow"><span class="sc-prev__dia"></span>Maneuver</div>
      <h3 class="sc-prev__name">Judgment</h3>
    </div>
    <div class="sc-prev__tag">Signature</div>
  </div>
  <div class="sc-prev__kw"><span class="sc-prev__chip">Magic</span></div>
  <div class="sc-prev__foot">
    <span class="sc-prev__meta"><span class="l">distance</span><span class="v">Ranged <b>10</b></span></span>
    <span class="sc-prev__meta"><span class="l">targets</span><span class="v">One enemy</span></span>
  </div>
</a>
```

- `data-action` drives the accent (spine on traits, crest glyph + dia on abilities) — same
  palette/glyph map as the ability card. **Glyphs are placeholders**, swapped in one place
  (`ACTIONS` at the top of `steel-feature-browser.js`).
- On a leaf page the class·level is already in the H1, so pass `{ context:false }` to
  `SCBrowse.card` (or omit the "from …" meta) — the browser turns it back **on** so cross-tree
  results stay self-describing.
- Flavor is clamped to 3 lines; the card never bloats no matter how long the underlying item is.

## 3 · Search & Filter (the power view)

> Answers the example flow: *"open the feature index wanting a 4th-level Censor trait → narrow
> with filters/search → click the card."* One page over the whole feature tree, no folder
> drilling. Recommended home: the **`feature/` landing** (folder cards + a "Search & Filter"
> entry), or a dedicated `feature/browse/` page.

Drop a JSON data island inside a `.sc-browse-mount`; `steel-feature-browser.js` auto-mounts it:

```html
<div class="sc-browse-mount">
  <script type="application/json" class="sc-browse-data">
  [ { "kind":"ability","name":"Judgment","klass":"Censor","level":1,"action":"maneuver",
      "cost":"Signature","keywords":["Magic"],"distance":"Ranged **10**","targets":"One enemy",
      "href":"trait/censor/level-1/judgment/" }, … ]
  </script>
</div>
```

It renders **search** (name/flavor/keyword), **chip facets** (Type, Class, Level, Action,
Keyword — auto-built from the data, any facet with <2 values is dropped), **sort** (Name /
Level ↑↓ / Class), a live `N of M` count, and **Clear filters**. Multi-select within a facet is
OR; across facets is AND. Results are the same `.sc-prev` cards (context on).

To generate the island, `internal/site` already walks the tree — emit one JSON object per leaf
with the frontmatter it has (`name, level, action/actionType, cost, keywords, distance, targets`)
plus the class folder name. **No data-repo change**: everything is read from existing frontmatter
or the site-layer page walk, same principle as the rich index cards.

### Count badges (`browse-enhancements.js`)

The folder pages no longer emit `.browse-index li`. If you keep the nav count badges, extend
`extractCount()` to also count `.sc-folder` / `.sc-prev` anchors (mirrors the `.sc-card` line
already suggested in the main README):

```js
var n = doc.querySelectorAll(".sc-folder, .sc-prev").length;
if (n > 0) return n;
```

---

## Notes / reconciliation

- **Heading margins.** `.sc-folder__name` and `.sc-prev__name` are `<h3>` and are written as
  `.md-typeset .sc-…__name` so they beat Material's `.md-typeset h3` top-margin/line-height —
  the same fix applied to `.sc-ability__name`. Don't drop the prefix.
- **Crest centering.** Preview crests reuse `.sc-crest`'s optical `translateY(-2px)`; no extra
  nudge needed. Adjust in `steel-redesign.css` if the whole set ever needs it.
- **One renderer, two surfaces.** Leaf index pages and the filter page share
  `SCBrowse.card()`, so a trait preview looks identical whether you drilled to it or filtered to
  it. Build-time may emit the same HTML directly (preferred) and skip the JS on leaf pages.
- **Both themes verified** (slate + default).

## Not in this pass
- Bestiary index (own session, as noted in the main README).
- Statblocks (own session).
