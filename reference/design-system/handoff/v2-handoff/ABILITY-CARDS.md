# Ability & Trait Cards — handoff

> **STATUS: ✅ SHIPPED — reference only.** The ability (leaf) card is live (`steel-ability-cards.css`
> / `.js`). Read this to match the card markup, the action-type palette, or the data shape; it is
> **not an open build task**. The live repo is source of truth; details may be slightly stale where
> the site was tweaked after hand-off. _(Trait/feature niches split out to `TRAITS.md`; the index
> pages that list these cards are the open task in `FEATURE-INDEXES.md`.)_

The high-fantasy steel **ability / trait card**, as a drop-in for the v2 MkDocs site.
Same language as the index cards (`steel-redesign.css`): heraldic crest, polished-steel
filigree, small-caps serif labels, a cohesive power-roll panel, and titled Effect/Trigger
panels. Themes for both **slate** (dark) and **default** (light).

> **Preview:** open `preview/ability-cards.html` — renders two real cards (a Main-Action
> power-roll ability + a Triggered ability) from JSON, on the production CSS/JS, with a
> light/dark toggle.

## Files

| File | Repo path | Role |
|---|---|---|
| `steel-ability-cards.css` | `v2 → docs/stylesheets/steel-ability-cards.css` | All card styling, both themes. Reuses `--fx-*` + `.sc-crest` from `steel-redesign.css`. |
| `steel-ability-cards.js`  | `v2 → docs/javascripts/steel-ability-cards.js` | `SCAbility.render(data)` + auto-mounts JSON islands. Only needed for the **runtime** option. |

Both are in this folder under `v2/docs/...`, ready to copy.

## 1 · Wire-up (`mkdocs.yml`)

```yaml
extra_css:
  - stylesheets/palette.css
  - stylesheets/extra.css
  - stylesheets/custom_font.css
  - stylesheets/tables.css
  - stylesheets/mobile.css
  - stylesheets/print.css
  - stylesheets/steel-redesign.css        # index + landing cards (existing)
  - stylesheets/steel-ability-cards.css    # <-- add AFTER steel-redesign.css

# only if you use the RUNTIME option (option B below):
extra_javascript:
  - javascripts/ability-cards.js           # existing power-roll badge enhancer
  - javascripts/steel-ability-cards.js     # <-- add AFTER it
```

The CSS uses only the site's own Material vars (`--md-*`, `--sc-*`, the font vars) plus the
`--fx-*` ornament tokens already defined by `steel-redesign.css`, and it defines the new
`--sc-act-*` action-type palette itself. The glyphs (crest + power-roll tiers) are the bundled
`DrawSteelGlyphs` font the site already loads via `custom_font.css`.

## 2 · Data shape

```jsonc
{
  "name": "Unmooring",
  "actionType": "main",          // main | maneuver | triggered | move | none | trait
  "cost": "Signature",            // string ("3 Malice", "5 Insight") OR { "value": 3, "unit": "Piety" }
  "flavor": "Your weapon unleashes psionic energy…",
  "keywords": ["Melee", "Psionic", "Strike", "Weapon"],
  "distance": "Melee **1**",      // ** ** = bold; renders the value emphasized
  "targets":  "One creature or object",
  "powerRoll": {                  // omit for traits / abilities with no roll
    "characteristic": "Might, Reason, Intuition, or Presence",
    "tiers": { "low": "…", "mid": "…", "high": "…" }
  },
  "sections":     [ { "label": "Effect",  "text": "…" },        // also Trigger, Special, etc.
                    { "label": "Trigger", "text": "…" } ],
  "enhancements": [ { "cost": "2 Piety", "text": "…" } ]         // optional
}
```

Everything except the action label is already in the parsed ability data; `actionType`,
`cost`, `distance`, `targets`, the power-roll tiers and the effect/trigger text all come
straight from steel-etl's ability model.

## 3 · Two ways to render

**A — Build-time (preferred, matches the index cards).** Have `steel-etl`'s site layer emit
the card HTML for each ability page, exactly like `cards.go` does for index cards. No runtime
JS; the CSS does the rest. Target HTML:

```html
<article class="sc-ability sc-fil" data-action="main">
  <div class="sc-ability__head">
    <span class="sc-crest sc-ability__crest"><span class="sc-ability__glyph">l</span></span>
    <div class="sc-ability__titles">
      <div class="sc-ability__eyebrow"><span class="sc-ability__dia"></span>Main Action</div>
      <h3 class="sc-ability__name">Unmooring</h3>
    </div>
    <div class="sc-ability__corner">
      <div class="sc-ability__cost"><span class="num">3</span> Piety</div>
    </div>
  </div>

  <p class="sc-ability__flavor">…</p>

  <div class="sc-ability__kw"><span class="sc-ability__chip">Melee</span>…</div>

  <div class="sc-ability__rail">
    <div class="sc-ability__cell"><div class="l">Distance</div><div class="v">Melee <b>1</b></div></div>
    <div class="sc-ability__cell"><div class="l">Targets</div><div class="v">One creature or object</div></div>
  </div>

  <div class="sc-ability__pr">
    <div class="sc-ability__pr-head">
      <span class="sc-ability__dia"></span>
      <span class="pre">Power Roll +</span>
      <span class="chars">Might, Reason, Intuition, or Presence</span>
    </div>
    <div class="sc-ability__pr-rows">
      <div class="sc-ability__tier" data-tier="low"><span class="badge">!</span><span class="res">…</span></div>
      <div class="sc-ability__tier" data-tier="mid"><span class="badge">@</span><span class="res">…</span></div>
      <div class="sc-ability__tier" data-tier="high"><span class="badge">#</span><span class="res">…</span></div>
    </div>
  </div>

  <div class="sc-ability__section">
    <div class="sc-ability__section-head"><span class="sc-ability__dia"></span><span class="tag">Effect</span></div>
    <div class="sc-ability__section-body"><p>…</p></div>
  </div>
</article>
```

Go sketch (mirrors `cards.go`):

```go
// actionGlyph / actionKey map the parsed action type to crest glyph + data-action.
func buildAbilityCard(ab Ability) string {
    a := actionInfo(ab.ActionType)            // {key:"main", label:"Main Action", glyph:"l"}
    var b strings.Builder
    fmt.Fprintf(&b, `<article class="sc-ability sc-fil" data-action="%s">`, a.key)
    // head (crest, eyebrow=a.label, name, cost) …
    // flavor, keyword chips …
    // rail: Distance / Targets …
    if ab.PowerRoll != nil { /* pr-head + 3 tiers (! @ #) */ }
    for _, s := range ab.Sections { /* sc-ability__section, s.Label + s.Text */ }
    for _, e := range ab.Enhancements { /* sc-ability__enh */ }
    b.WriteString(`</article>`)
    return b.String()
}
```

**B — Runtime (zero Go change).** Drop a JSON island on the page; `steel-ability-cards.js`
replaces it on load:

```html
<script type="application/json" class="sc-ability-data">
{ "name": "Unmooring", "actionType": "main", … }
</script>
```

Use A for the real product (clean, no JS, SSR-cached). B is handy for spot pages, the
`static_content/` hand-authored pages, or trying a card without touching the generator.

## 4 · Action type → color + glyph  ⚠ glyphs are PLACEHOLDERS

| `actionType` | Eyebrow label | Color (`--sc-act-*`) | Crest glyph (DrawSteelGlyphs) |
|---|---|---|---|
| `main` | Main Action | red | `l` crossed swords |
| `maneuver` | Maneuver | blue | `f` figure |
| `triggered` | Triggered Action | green | `)` alert |
| `move` | Move Action | orange | `o` ruler |
| `none` | No Action | white | `*` star |
| `trait` | Trait / Other | purple | `*` star |

The **colors are final** (from the action-color spec). The **crest glyphs are placeholders** —
the nearest sensible mark in the bundled font. When the official action glyphs arrive, swap them
in **one place**:

- build-time: the `actionInfo()` map in Go,
- runtime: the `ACTIONS` map at the top of `steel-ability-cards.js`.

The three section/power-roll header diamonds (`.sc-ability__dia` with metal fill) are likewise
placeholders for official Power-Roll / Effect / Trigger marks — they're plain elements, so a glyph
or inline SVG drops straight in.

## 5 · Notes / reconciliation

- **Power-roll badges.** The existing `ability-cards.js` injects the `! @ #` tier glyphs into
  the old list markup. These cards render their own tier rows, so on pages that use `.sc-ability`
  let this file own the power roll (don't run the old enhancer over the same block) to avoid
  double-badging.
- **Cost placement.** Persistent badge, top-right of the head grid (so it never collides with the
  hover utility buttons, which the runtime adds *below* it). `"Signature"`, `"3 Malice"`,
  `"5 Insight"` all fit; numeric prefixes render in mono.
- **Left border** is neutral steel — the action color lives in the crest, eyebrow, and diamonds,
  never as a loud bar.
- **Both themes** verified. Light mode uses the darker `--sc-act-*` variants and a light card/crest.
- **Now covered:** the nested trait → child-ability indentation from the `redesign/` hierarchy
  prototype — see **`TRAITS.md`** (`steel-traits.css` + `steel-traits.js`). These ability cards
  are the leaf; the trait niche wraps them.
- **Not yet covered:** statblocks (own session).
