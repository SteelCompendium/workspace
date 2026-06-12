# Featureblock cards — approved design

**Date:** 2026-06-12 · **Status:** approved design, pre-implementation
**Scope:** steel-etl (parsers, schemas, site renderer) + data-sdk-npm (schema copy, `v3` branch) + v2 (CSS, settings drawer, e2e). Workspace-level spec because it spans repos and adds a schema contract.

Brings featureblocks into the High-Fantasy Steel card language, the way
`statblock_page.go` + `steel-statblock.css` did for statblocks — but via
**build-time HTML**, not a JSON island (see "Architecture choice" below).
Content is frozen, as always: design only, no rules text changes.

## Definitions

A **Feature** is a granted ability/trait/bonus (the `feature`/`ability`/`trait`
taxonomy). A **Featureblock** is a titled *collection* of Features under a
loose-stat header — statblock-like in anatomy, not in rigor: statblock stats are
highly structured (the fixed grid), featureblock stats are loose label/value
pairs that vary by block ("EV: 1 per 10 × 10 thicket", "Stamina: 20 + your
level") or are absent entirely.

Five content types fit the featureblock shape. **Dynamic terrain is a
featureblock at the schema level** — it keeps its own SCC hierarchy and file
output paths; only its data shape is shared.

| Content | Today | In this design |
|---|---|---|
| Malice / Ajax featureblocks (64) | `type: featureblock`, name-only frontmatter, raw blockquote rendering | core case |
| Dynamic terrain (35) | own type, partial metadata, classifier discarded | + loose stats + role/terrain-type extraction |
| Summoner fixtures (~12) | `type: statblock` with a broken 2-col grid (`FOLLOWUPS.md` #6) | routed to the fb renderer; grid parsed (resolves #6) |
| Retainer advancement | H8 blocks folded into statblock bodies, polluting the island feature list | site-side split into advancement cards below the statblock |
| Beastheart companion advancement | `feature-group`/`feature` annotated, full metadata | rendered as fb cards on the companion page (embedding-pattern instance) |

## Locked decisions (user, 2026-06-12)

1. **Scope:** all five content types above, phased; plus field metadata
   extraction (scalars + structured `features[]`, new schema in both copies).
   The statblock malice band stays parked as `FOLLOWUPS.md` #7 (this work makes
   it easier later, but it is not in scope).
2. **Architecture: build-time HTML** ("approach B"). Decisive factor: the
   upcoming effort to embed stylized cards inside pages not focused on them
   (e.g. the Classes chapter showing every class's features as cards). One Go
   renderer emits the card DOM for dedicated pages now and embedded occurrences
   later; no island/mount storm on huge Read pages. Preferences remain pure CSS
   reflows from `data-*` attributes (the `data-card-style` precedent), so
   client-side re-rendering is not needed.
3. **Separate settings group** — `data-fb-*`, independent of `data-sb-*`. Two
   prefs only (below); no presets; feature internals fixed.
4. **Visual: "Forged Band"** head (chosen over Crest Plate / Codex Niche in
   mockups): statblock-style accent-gradient header band, embossed uppercase
   name, eyebrow line, centered ◆ diamond on the band's bottom border.
   Accent keyed to the locked role-color system: Malice grey `#9aa2a8`;
   terrain/fixtures use their role's color (Hexer green, Support orange, …).
5. **Stat line is a preference** (boxed cells vs ledger rows), not a fixed
   choice — mirroring the statblock secondary-stats pref.

## 1. Data layer (steel-etl parsers)

**`FeatureblockParser`** (`internal/content/monster.go`) gains:

- `kind`: `"malice"` | `"feature"` — from the heading parenthetical
  ("… Malice Features" → `malice`; otherwise → `feature`, e.g. Ajax's
  "Tactical Stance (Ajax Feature)").
- `level`: int — from level-qualified blocks
  ("Demon Malice (Level 4+ Malice Features)" → `4`). Absent when unqualified.
- `flavor`: the intro prose line ("At the start of any basilisk's turn, you can
  spend Malice to activate one of the following features.") — reuse the
  `firstFlavorParagraph` extractor convention.
- `features[]`: structured array parsed from the body's feature blockquotes
  (rich shape, §2).

**`DynamicTerrainParser`** (`internal/content/dynamic_terrain.go`) gains:

- `terrain_type` (`Hazard` | `Trap` | `Trigger` | `Siege Engine` | `Relic` |
  `Fortification`) and `role` (`Hexer`/`Ambusher`/`Support`/…) — from the
  heading classifier "(Level 2 Hazard Hexer)" that is currently discarded.
- `stats[]`: the `- **EV:** …` list fields become the ordered loose-stat list
  (replacing today's ad-hoc scalar emission — those fields were never
  schema'd, so this is not a contract break).
- `features[]`: same structured array.

**`StatblockParser`** — fixture handling (resolves `FOLLOWUPS.md` #6):

- Parse the fixture 2-col grid (`| **Stamina:** 20 + your level | **Size:** 2 |`)
  into the existing string-typed `stamina`/`size` statblock fields.
- Parse the italic role line (`*Hazard Support*`) into `terrain_type`/`role`.
- Stamp `statblock_kind: fixture` so the site router can divert fixtures to the
  featureblock renderer. All three fields are additive to the statblock schema
  (both copies).
- Fixture advancement blockquotes (`> **Level 5 Fixture Advancement Feature**`
  followed by features in the same quote) → those features carry `level: 5`.

**Shared feature parser.** The blockquote→feature logic lives today in
`internal/site/statblock_page.go` (`parseStatblockIslandFeature` & helpers —
already hardened for scc-link-wrapping, cost parentheticals, both power-roll
forms). Extract it to `internal/content` (e.g. `featureparse.go`) so the
pipeline parsers and `internal/site` both consume it; the statblock island path
keeps working unchanged.

**Explicitly untouched:**

- Retainer advancement stays folded in statblock bodies (H8 deliberately not
  collected; no parser, SCC, or statblock-data change). Handling is site-side
  only (§3).
- Companion advancement already has full metadata (`feature-group`/`feature`).
- **No SCC codes are minted or changed anywhere.** `validate --scc-stable`
  must stay green throughout.

## 2. Schema + SDK output

One new **`featureblock.schema.json`** in **both** copies —
`steel-etl/schemas/` and `data-sdk-npm/src/schema/` (on the **`v3` branch**,
the canonical SDK mainline). It covers `type: featureblock` *and*
`type: dynamic-terrain`; the frontmatter `type:` stays the routing
discriminator exactly as today.

```
name, type (featureblock | dynamic-terrain),
kind?  (malice | feature — featureblock only),
level?, flavor?, role?, terrain_type?,
stats[]?:    [{label, value}]          # ordered, loose; renderer lays out whatever exists
features[]:  [{ name, icon?, cost?, usage?, keywords[]?, distance?, target?,
                power_roll? {formula, tiers {low, mid, high}},
                sections[]? {label, text}, enhancements[]? {cost, text},
                body?, trailing?, level? }]
```

- `features[]` is deliberately **non-lossy** (unlike the statblock schema's,
  which drops Effect/Trigger sections once tiers exist) — it mirrors the
  statblock island shape, so the site renders straight from frontmatter with
  no body re-parse.
- New SDK transformer emits featureblock JSON/YAML;
  `schema_validation_test.go` allowlists updated for the new type and the
  additive statblock fields.
- Per the card-data-parity rule, every field the cards surface exists in the
  data formats (`steel-etl/docs/card-data-parity.md` checklist applies).

## 3. Site renderer (`internal/site/featureblock_page.go`)

Build-time HTML; reads frontmatter (primary; no body re-parse needed once
`features[]` lands). Routes:

- `type: featureblock` and `type: dynamic-terrain` pages → the page body is
  replaced with a finished `.fb-wrap` card (frontmatter preserved; `injectH1`
  H1 hidden by CSS once the card is present, as statblock pages do).
- `type: statblock` + `statblock_kind: fixture` → featureblock renderer
  instead of the statblock JSON island.
- **Retainer pages:** `statblock_page.go` splits the body at the demoted
  `Level N … Advancement Ability` bold labels — those blockquotes are
  **excluded** from the island features (today they pollute the statblock's
  feature list) and emitted as Forged Band advancement card(s) after the
  island mount.
- **Companion advancement (beastheart):** the `Level N <X> Advancement
  Feature` feature-groups render as featureblock cards on the companion's
  page. This is the first instance of the embedded-cards pattern and is built
  last; it may be folded into the embedding effort if that starts first.

### DOM contract (what the CSS styles)

```
.fb-wrap[data-role] (+ data-kind when present)
  article.fb.md-typeset
    header.fb__head   (.fb__eyebrow + .fb__name)      ← role gradient + centered ◆
    .fb__flavor?                                       ← italic intro/flavor
    .fb__stats?       (.fb__stat cells / ledger rows)  ← from stats[]
    .fb__feats
      article.sc-ability.fb__feat[data-action]         ← one-line head: icon · name · cost badge
        (reuses .sc-ability__pr/__tier/__section/__enh grammar verbatim)
    .fb__band--adv?                                    ← leveled advancement groups
```

- Eyebrow composition: `kind` ("MALICE FEATURES") or
  `Level {level} {terrain_type} · {role}` for terrain/fixtures.
- Feature heads are one-line (icon + name + cost badge) — featureblocks skip
  the crest/eyebrow ceremony statblock features can opt into. Internals reuse
  the shared ability-card grammar; power-roll tier badges use DrawSteelGlyphs
  (`!`/`@`/`#`), as everywhere.
- Features with `level` group under small leveled sub-heads inside
  `.fb__band--adv` (fixture/retainer advancement).
- `data-action` maps from usage/cost exactly as `sbActionKind` does — with one
  addition: table-less features (terrain's 🌀 Deactivate / ❕ Activate, malice
  passives) fall back to the **`icon` emoji** for their action accent (the
  `ability-cards.js` emoji map), instead of all flattening to "passive". This
  is why `features[].icon` keeps the source emoji prefix (non-lossy), which
  `parseStatblockIslandFeature` currently discards.
- Group landings (`bestiary_cards.go`) keep their featureblock preview cards;
  inlining cards there is out of scope.

## 4. CSS (`v2/docs/stylesheets/steel-featureblock.css`)

New sheet, added to `mkdocs.yml` `extra_css` **after** `steel-statblock.css`.
Composes `--fx-*`/`--sc-*` tokens only; slate + default schemes; print +
responsive. Cards are content, not links — **no hover-lift**.

- **Forged Band head:** `linear-gradient(color-mix(in srgb, var(--role) 40%,
  plate), color-mix(… 9% …))`, border-bottom in role color, centered ◆ diamond
  pseudo-element on the border — the `.sb__head` recipe.
- `data-fb-featstyle="card"`: features get tinted bg + 3px `var(--act)` left
  border + radius (the statblock card-mode recipe). `"flat"`: gap 0, ◆
  diamond+line separators (the statblock flat-mode recipe).
- `data-fb-stats="grid"`: value-over-label boxed cells; long values span.
  `"ledger"`: hairline label/value rows.
- **Role-token paydown:** the locked role hexes move from the top of
  `steel-statblock.css` into `palette.css` as `--sc-role-*` tokens; both
  sheets (and future embedded renders) consume the single source. DESIGN.md's
  "hexes live in steel-statblock.css only" note updates to point at
  `palette.css`.
- ⚠️ `fb__feat` reuses `.sc-ability`, so the ability-card watermark/`::before`
  contest applies — use the specificity-floor kill-block pattern established
  by the statblock feature-style work
  (`v2/.repo-docs/plans/2026-06-12-statblock-feature-style.md`), and the
  scheme-attribute order rule (`data-md-color-scheme` is on `<body>`,
  `data-fb-*` on `<html>`).

## 5. Settings drawer

New **Featureblocks** group in `settings-panel.js`, mirroring the `data-sb-*`
machinery (keys table, apply fn, drawer rows, id map):

| Pref | Attribute | Values (default bold) |
|---|---|---|
| Feature style | `data-fb-featstyle` | **card** · flat |
| Stat line | `data-fb-stats` | **grid** · ledger |

Attributes on `<html>`; early-apply in `overrides/main.html`; persisted under
the `mkdocs:fontPrefs` store. No presets (two prefs don't warrant one). Both
prefs must work in both color schemes.

## 6. Testing

- **Go (table-driven):** parser tests — kind/level derivation incl. the
  digit-keeping parenthetical rule, terrain classifier extraction, fixture
  2-col grid, loose `stats[]` ordering, rich `features[]` (sections,
  enhancements, both power-roll forms, link-wrapped text); renderer DOM tests
  following the `bestiary_cards_test.go` string-contains pattern; retainer
  body-split tests (advancement excluded from island, present as card);
  schema-validation allowlist updates.
- **SCC stability:** `validate --scc-stable` green; `classify --diff` empty.
- **e2e** (`v2/tests/e2e`, Brave via playwright-core): a malice page and a
  terrain page render the card (band color = role); drawer prefs flip
  `data-fb-*` and visibly reflow — assert computed styles, not just
  attributes (the 2026-06-11 regression class); both color schemes; fixture
  page renders via fb path; retainer page shows statblock + advancement card.
- Featureblock pages stop emitting raw blockquotes, so the legacy runtime
  `ability-cards.js` classifier no longer touches them (no conflict).

## 7. Phasing

1. Parsers + shared feature parser extraction + schema (both copies) +
   transformer + tests.
2. Featureblock + terrain pages: renderer, CSS, settings group, e2e.
3. Fixture routing (archives `FOLLOWUPS.md` #6).
4. Retainer advancement split.
5. Companion advancement (embedding-pattern instance; may fold into the
   embedding effort).
6. Docs (below).

## 8. Docs & bookkeeping (at implementation time)

- `DESIGN.md`: Featureblocks component row (this spec as the pointer);
  `data-fb-*` prefs in the preference-system section; role-hex note moves to
  `palette.css`; Featureblock definition sentence.
- `steel-etl/docs/statblocks.md`: featureblock/terrain/fixture parsing +
  routing updates; `steel-etl/CLAUDE.md` router pointers if needed.
- `steel-etl/docs/card-data-parity.md`: featureblock fields flow through the
  checklist.
- Workspace `FOLLOWUPS.md`: #6 resolved into `docs/followups-archive/` with a
  "was #6" handle; #7 untouched (still open, now easier).
- No `docs/scc-log.md` entry needed — no SCC scheme/registry change.

## Non-goals

- Statblock malice band embedding (`FOLLOWUPS.md` #7).
- Migrating creature statblocks off the JSON island onto the Go renderer
  (natural follow-on during the embedding effort, not here).
- Inlining cards on group landings; monsters-book link sweep (#5); presets for
  the fb settings group.
