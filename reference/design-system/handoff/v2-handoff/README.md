# v2 Redesign — Handoff

Drop-in package that converts the v2 MkDocs site (**steelcompendium.io/v2**) to the approved
**high-fantasy steel** direction. Everything here is delivered as (1) additive CSS/JS in `v2/` and
(2) documented changes to the **site generator** (`steel-etl internal/site`) — built against the
site's *real* markup and CSS variables, themed for both **slate** (dark) and **default** (light),
and **never** bending the shared data repos (see The golden rule).

---

## ⛏ For a Claude Code session — start here

> **Newest change to land: the ◆ RULE & FILIGREE BLOCKQUOTES.** Two shared ornaments — the
> polished steel ◆ horizontal rule and the filigree-frame blockquote — are implemented in
> `steel-redesign.css`. → **read `TITLES-RULES-QUOTES.md`, pull the updated file, rebuild, and
> review.** No new sheet, JS, tokens, or markup change. _(A matching page-**title** masthead is
> designed but **parked** — it needs a full-bleed shell; details + preserved CSS in §4 of that doc.)_
>
> **Everything in this table is now live (or ready-to-pull).** Those docs are *reference* — open
> them only to match an existing pattern (load order, a class name, the token vocabulary). They
> describe shipped work and **may be slightly stale** where the live site was tweaked after
> hand-off; treat the repo as source of truth and these as intent.

| Area | Status | Doc (role) | Code touchpoints |
|---|---|---|---|
| Browse **landing** (heraldic crests) | ✅ Shipped | `LANDING-INDEX-CARDS.md` *(ref)* | `static_content/docs/Browse/index.md`, `steel-redesign.css` |
| **Category index** cards (flat types) | ✅ Shipped | `LANDING-INDEX-CARDS.md` + `steel-etl/PATCH.md` *(ref)* | `internal/site/cards.go`, `steel-redesign.css` |
| **Ability** cards (leaf) | ✅ Shipped | `ABILITY-CARDS.md` *(ref)* | `steel-ability-cards.css` / `.js` |
| **Trait / feature** cards (leaf, nested) | ✅ Shipped | `TRAITS.md` *(ref)* | `steel-traits.css` / `.js` |
| **Feature & treasure INDEX pages** | ✅ Shipped | `archive/FEATURE-INDEXES.md` *(ref)* | `steel-indexes.css`, `steel-feature-browser.js`, `internal/site/build.go` |
| **◆ rule + filigree blockquotes** | ✅ Implemented — pull & review | **`TITLES-RULES-QUOTES.md`** §1–3 | `steel-redesign.css` |
| Page-**title** masthead | ⏸ Parked — needs full-bleed shell | `TITLES-RULES-QUOTES.md` §4 | (deferred) |
| Statblocks | ✅ Approved — per-piece prefs + presets | `../redesign/statblocks/README.md` | Steel Card default; CSS ready to port |
| Bestiary index | ⬜ Future session | — | — |

The **feature & treasure index pages** are now built — their build spec has been archived to
`archive/FEATURE-INDEXES.md` for reference. The newest items (**the ◆ rule + filigree
blockquotes**) are pure CSS in the already-wired `steel-redesign.css`: no new sheet, JS, tokens,
or `mkdocs.yml` change — just pull the file and rebuild. The companion **page-title masthead** is
deferred until it can live in a full-bleed shell (`TITLES-RULES-QUOTES.md` §4).

---

## Architecture — how `steel-etl` and `v2` fit together

**Read this before changing anything, whichever feature you're on.** The site is the *output* of a
pipeline, not a hand-built site. Editing the wrong layer either gets overwritten on the next build
or pollutes the shared data repos.

```
 steel-etl/input/heroes/Draw Steel Heroes.md      ← CANONICAL source (annotated markdown, hand-edited)
        │   steel-etl gen        (parse → classify → generate)
        ▼
 ../data/data-rules/{md, md-linked, json, yaml, md-dse, …}   ← DATA REPOS (consumed by 3rd parties + Obsidian)
        │   steel-etl site --config v2/site.yaml
        │     • reads the md-linked output  (source_dirs)
        │     • GENERATES the Browse/ Read/ Bestiary/ page tree + index pages
        │     • then copies v2/static_content/docs/** OVER the generated tree (overrides)
        ▼
 v2/docs/**           ← GENERATED MkDocs tree — DO NOT hand-edit (blown away each build)
        │   mkdocs build   (+ docs/stylesheets/*.css, docs/javascripts/*.js, overrides/*.html)
        ▼
 steelcompendium.io/v2   ← the live site
```

Two repos, two jobs:

- **`steel-etl`** owns *content and page generation*. The annotated `.md` is the single source of
  truth; `gen` fans it out to every data format; `site` turns the data into the MkDocs page tree
  (including the category **index pages** via `internal/site/build.go`).
- **`v2`** owns *presentation and hand-authored pages*: the MkDocs config, theme overrides,
  CSS/JS, and anything in **`static_content/docs/`** (which is layered on top of the generated
  tree — this is where the **Browse landing `index.md`** lives).

### Where does my change go?

| I want to change… | Edit (repo → file) | Affects | Notes |
|---|---|---|---|
| **What a rule/page says** (wording, a stat value) | `steel-etl → input/heroes/Draw Steel Heroes.md`, then `gen` | **ALL** outputs (data repos + site) | Canonical. Must keep every output valid — never tweak wording just for the site. |
| **How an item page is parsed** (new field, fix extraction) | `steel-etl → internal/content/*.go` | data repos + site | Adds clean metadata everyone can use. |
| **How a category INDEX page is built** (the rich cards) | `steel-etl → internal/site/cards.go` + `build.go` | **site only** | `internal/site` runs only in the `site` command — data repos untouched. |
| **The Browse LANDING page** (the hub) | `v2 → static_content/docs/Browse/index.md` | site only | Hand-authored; copied over the generated tree. |
| **The LOOK** (color, type, cards, spacing) | `v2 → docs/stylesheets/*.css` | site only | All `steel-*.css` live here. |
| **Runtime DOM behavior** (badges, ability cards, filter) | `v2 → docs/javascripts/*.js` | site only | e.g. `browse-enhancements.js`, `steel-feature-browser.js`. |
| **Header / nav / tabs shell** | `v2 → overrides/*.html`, `mkdocs.yml` | site only | Jinja template overrides. |

### The golden rule

The **data repos and the annotated source must stay renderer-agnostic.** They feed 3rd-party
tools, the JSON SDK, and Obsidian — so *never* bend their content/structure to make the website
look better. Site-only polish belongs in **`v2` CSS/JS/static_content** or in
**`steel-etl/internal/site`** (which emits *only* the website, never the data formats). When a
card needs a value the data doesn't expose, prefer parsing it in the `internal/site` layer over
adding site-specific fields to the data — unless the field is genuinely useful metadata, in which
case add it to the parser in `internal/content`.

### Rebuild loop after any change

```bash
# steel-etl change (content or site generator):
cd steel-etl && go build ./... && steel-etl site --config ../v2/site.yaml
# v2 change (CSS/JS/static_content/config) — or to view the result of the above:
cd v2 && mkdocs serve         # open the affected page, e.g. /Browse/kit/
```

---

## Conventions (evergreen — apply to every feature)

### Stylesheet & script load order (`mkdocs.yml`)

Order matters: each `steel-*` sheet reuses tokens defined by the one above it. Add them **after**
the site's existing sheets so they can override. The `🔲` line is the only one not yet wired.

```yaml
extra_css:
  - stylesheets/palette.css            # existing site sheets
  - stylesheets/extra.css
  - stylesheets/custom_font.css
  - stylesheets/tables.css
  - stylesheets/mobile.css
  - stylesheets/print.css
  - stylesheets/steel-redesign.css      # ✅ ornament tokens (--fx-*), .sc-crest, landing + index
                                        #    cards, AND the ◆ rule / filigree blockquote
  - stylesheets/steel-ability-cards.css # ✅ action palette (--sc-act-*), ability plate
  - stylesheets/steel-traits.css        # ✅ trait niche + nesting
  - stylesheets/steel-indexes.css       # ✅ folder cards, trait/ability previews, browse chrome

extra_javascript:
  - javascripts/ability-cards.js          # existing power-roll badge enhancer
  - javascripts/browse-enhancements.js    # existing count badges
  - javascripts/steel-ability-cards.js    # ✅ runtime ability card renderer (optional)
  - javascripts/steel-traits.js           # ✅ runtime trait renderer (optional)
  - javascripts/steel-feature-browser.js  # ✅ search/sort/filter page (+ shared preview renderer)
```

### Token vocabulary (where each var comes from)

- `--md-*` — Material for MkDocs theme vars (the site provides them; previews shim them).
- `--sc-steel*`, `--sc-ability-*`, `--sc-tier-*` — brand palette (`palette.css` on the site;
  `colors_and_type.css` in this design system).
- `--fx-*` — steel **ornament** tokens (metal gradients, bevels, card bg) defined by
  `steel-redesign.css`. Everything downstream reuses them.
- `--sc-act-*` — the 6 **action-type** colors defined by `steel-ability-cards.css`.

No `steel-*` sheet invents brand colors; they compose the above. Both themes are always defined.

### Previews (review surfaces, in `preview/`)

Each renders the production CSS/JS on a mock Material shell with a 🌙 light/dark toggle.

| Preview | Shows |
|---|---|
| `preview/site.html` | Browse landing + category index / wide cards · **"Rules & quotes"** tab (◆ rule + filigree blockquotes) |
| `preview/ability-cards.html` | Ability plates (main + triggered) |
| `preview/trait-cards.html` | Trait niches with nested abilities / sub-traits |
| `preview/feature-indexes.html` | ✅ Folder indexes, trait/ability previews, live search/filter |
