# Trait / Feature Cards — handoff

> **STATUS: ✅ SHIPPED — reference only.** The trait/feature niche (with nested abilities &
> sub-traits) is live (`steel-traits.css` / `.js`). Read this to match the niche markup, the
> nesting rails, or the data shape; it is **not an open build task**. The live repo is source of
> truth; details may be slightly stale. _(The index pages that list these cards are the open task
> in `FEATURE-INDEXES.md`.)_

The high-fantasy steel **trait / feature**, as a drop-in for the v2 MkDocs site.
A trait is rendered as an illuminated **codex niche** — a flat, recessed panel with a
colored left spine and an embossed feature heading. It is deliberately a *different
register* than the raised, crested `.sc-ability` plate, so nested ability cards read as
objects mounted inside the trait. Traits can hold prose, lists, lead-ins, **nested
abilities**, and **nested sub-traits** (recursively). Themes for both **slate** + **default**.

> This is the "trait → ability nesting" pass flagged as future work in `ABILITY-CARDS.md`
> and the redesign `hierarchy.css` prototype. The ability card is the *leaf*; this file is
> the *nesting niche* that wraps it.

> **Preview:** open `preview/trait-cards.html` — four traits in sequence (pure prose with a
> drop cap; a benefit list; a feature that grants an ability; a choose-one feature whose
> options are nested sub-traits, one of which grants a triggered ability), on the production
> CSS/JS, with a light/dark toggle.

## Elevation language

```
page (wall)  →  .sc-trait (recessed codex niche)  →  .sc-ability (raised forged plaque)
```

Three clearly distinct depths. The niche is **flat** (hairline border + inset shadow, no big
drop shadow); the ability plate keeps its bevel + drop shadow, so it visibly sits *in* the
niche. Sequential traits are separated by their own border + generous margin — never ambiguous.

## Files

| File | Repo path | Role |
|---|---|---|
| `steel-traits.css` | `v2 → docs/stylesheets/steel-traits.css` | All trait styling + nesting rails, both themes. Reuses `--fx-*` (steel-redesign) + `--sc-act-*` (steel-ability-cards). |
| `steel-traits.js`  | `v2 → docs/javascripts/steel-traits.js`  | `SCTrait.render(data)` + auto-mounts JSON islands. Recurses into `SCAbility.render` for nested abilities. Only needed for the **runtime** option. |

## 1 · Wire-up (`mkdocs.yml`)

```yaml
extra_css:
  - stylesheets/steel-redesign.css         # ornament tokens + .sc-crest (existing)
  - stylesheets/steel-ability-cards.css     # ability plate + --sc-act-* palette (existing)
  - stylesheets/steel-traits.css            # <-- add AFTER the ability card CSS

# only for the RUNTIME option (B below):
extra_javascript:
  - javascripts/ability-cards.js            # power-roll badge enhancer (existing)
  - javascripts/steel-ability-cards.js      # ability card renderer (existing)
  - javascripts/steel-traits.js             # <-- add AFTER it (it calls SCAbility.render)
```

`steel-traits.css` defines no new color tokens — the trait accent is the existing
`--sc-act-trait` (purple), and nested abilities carry their own action colors.

## 2 · Data shape

```jsonc
{
  "featureType": "Censor · Exorcist",  // eyebrow: class · subclass (small-caps)
  "name": "Judgment",
  "tag": "Level 1",          // optional right pill: the feature's level number.
                               //   also accepts "Signature", "1 Renown",
                               //   or { "value": 3, "unit": "Wrath" }
  "actionType": "trait",       // spine + accent color; default "trait" (purple).
                               //   "steel" = neutral. main/maneuver/triggered/move/none too.
  "dropcap": true,             // optional engraved initial on the opening paragraph
  "flavor": "…",               // optional italic atmosphere line
  "body": [                    // ORDERED blocks — this is the flexible part
    { "kind": "text",   "text": "Prose. **bold** and *italic* supported." },
    { "kind": "list",   "items": ["…", "…"] },              // ◆-marked bullets
    { "kind": "leadin", "text": "You gain the following ability:" }, // emphasized run-in
    { "kind": "ability","data": { /* full ability JSON, see ABILITY-CARDS.md */ } },
    { "kind": "trait",  "data": { /* a nested trait — same shape, recursive */ } },
    { "kind": "segment","label": "Benefit", "tone": "benefit", "text": "…" } // titled mini-panel
  ]
}
```

- A **simple text trait** is just `{ featureType, name, body:[{kind:"text",…}] }` — or even
  `{ featureType, name, text: "one paragraph" }`.
- **Nesting is automatic:** a contiguous run of `ability` / `trait` blocks is wrapped in one
  indented `.sc-trait__nest` rail (with a corner tick joining it to the parent). Put a
  `leadin` block right before the run for the "You gain the following ability:" pattern.
- `segment.tone` = `benefit` (green tag) | `drawback` (red tag) | omit (neutral).

## 3 · Two ways to render

**A — Build-time (preferred, matches the index + ability cards).** Have `steel-etl` emit the
`.sc-trait` HTML for each feature/trait, mirroring `buildAbilityCard`. Target HTML:

```html
<section class="sc-trait" data-action="trait">
  <header class="sc-trait__head">
    <div class="sc-trait__titles">
      <div class="sc-trait__eyebrow"><span class="sc-trait__dia"></span>Censor · Exorcist</div>
      <h3 class="sc-trait__name">Judgment</h3>
    </div>
    <div class="sc-trait__tag">Level 1</div>
  </header>
  <div class="sc-trait__body">
    <p>As a maneuver, you can pass judgment on one enemy…</p>
    <p class="sc-trait__leadin"><span class="sc-trait__dia"></span>You gain the following ability:</p>
    <div class="sc-trait__nest">
      <article class="sc-ability sc-fil" data-action="main"> … </article>  <!-- the leaf card -->
    </div>
  </div>
</section>
```

The nest can hold one or many `.sc-ability` / nested `.sc-trait` children — they share one rail.

**B — Runtime (zero Go change).** Drop a JSON island; `steel-traits.js` replaces it on load:

```html
<script type="application/json" class="sc-trait-data">
{ "featureType": "…", "name": "Judgment", "body": [ … ] }
</script>
```

Use A for the real product; B for `static_content/` hand-authored pages or spot trials.

## 4 · Notes / reconciliation

- **Spine vs. ability border.** The trait's colored left spine (the `--sc-act-*` accent) marks
  the *container*; the leaf ability's left edge stays neutral steel, exactly as
  `ABILITY-CARDS.md` specifies. Different roles — no conflict, no double-coloring.
- **Nested ability ops.** The runtime renders nested abilities with `ops:false` (no hover
  permalink/save toolbar) so the per-card chrome doesn't fight the trait. Build-time: just
  omit the `.sc-ability__ops` block inside a nest.
- **Sub-trait depth.** A `.sc-trait` inside a `.sc-trait__nest` is auto-styled as a lighter,
  more recessive niche (smaller heading, darker fill, no inset glow). Depth reads without any
  extra class.
- **Diamonds are placeholders.** The eyebrow / lead-in / segment diamonds (`.sc-trait__dia`)
  are plain metal-fill elements — swap for an official mark or inline SVG in one place, same
  as the ability-card diamonds.
- **Both themes verified.** Light mode uses the darker `--sc-act-*` variants and a light niche.
- **Drop cap** is `::first-letter` on the opening paragraph — renders in browsers and in the
  PDF/print path; some DOM-snapshot screenshot tools don't show pseudo-elements (it's there).
```
