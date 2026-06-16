# Inline item cards on container pages — approved design

**Date:** 2026-06-16 · **Status:** approved design, pre-implementation
**Scope:** steel-etl (new site-builder post-pass + config) + v2 (`site.yaml` knob).
Workspace-level spec because it spans repos and changes a site-builder contract.

Render embeddable items (abilities, statblocks, featureblocks, traits/plain features)
as their High-Fantasy Steel **cards inline** on any container page that contains them —
e.g. the Censor class page in Browse shows every class feature as the same card you see
on the feature's own page, instead of plain inlined markdown. The `data/` output repos
stay mundane markdown; this is a **site-only** transform.

This finishes the line of work the build-time statblock render opened: that effort
([`2026-06-14-statblock-build-time-render-design.md`](2026-06-14-statblock-build-time-render-design.md))
moved statblocks off a client JSON island onto build-time HTML specifically so a card
"can be called anywhere the site builder assembles a page." Its explicit out-of-scope
follow-on was "embedding statblocks inline in chapter/Read pages." This spec is that
follow-on, generalized to every card-able type.

## Why transclusion, not re-parsing

A container page (e.g. `Browse/class/censor.md`) is a `RenderSubtree` body
(`internal/content/render_subtree.go`): each descendant item is inlined as a normalized
heading carrying an attr_list `{data-scc="<code>"}` marker, followed by its (un-blockquoted)
body. Crucially the inlined body has **no per-item frontmatter**, and the leaf card
builders are frontmatter-driven — `buildFeatureblockPage` is 100% frontmatter
(`yaml.Unmarshal(fm)`), `buildStatblockIsland(fm, …)` reads the stat grid from
frontmatter. So the inlined markdown cannot be rebuilt into a card.

But every embedded item **also exists as its own standalone leaf page** on disk, already
transformed into a card by `buildSection` and keyed by its `scc` frontmatter. The design
**transcludes those finished leaf cards** by `data-scc` code. This reuses every existing
card renderer verbatim (nothing re-parsed, no renderer touched), is site-only by
construction, and needs zero parser/pipeline changes.

Feature/ability/trait leaf cards are already **recursive** — `censor-abilities`'s card
nests all its child abilities; `judgment`'s card nests its ability + order benefit — so
transcluding the shallowest card-able item naturally pulls in everything beneath it.

## Component 1 — the post-pass (`internal/site/embed_cards.go`)

A new `embedItemCards(cfg)` runs in `Build()` **after `generateIndexPages`** (so every
leaf page is written and already carded) and **before** the frontmatter-only passes
(search-exclusion, printing-stamps). It operates over a configured section list,
defaulting to `["Browse"]`.

**Step A — build the `scc → card HTML` map.** One walk over the target sections. For each
`.md` whose frontmatter `type` is card-able (`ability`, `feature`, `trait`, `statblock`,
`featureblock`, `dynamic-terrain`), store `scc → cardBody`, where `cardBody` is the file
content with its injected `# Name\n\n---\n\n` head stripped (reuse `stripLeadingHeading`).
These bodies are the frozen card HTML the leaf transforms already produced.

**Step B — splice into containers.** For every `.md` page in the target sections, scan the
body line-by-line for headings bearing `{data-scc="X"}`. Walk top-down with a
"skip-until-heading-level ≤ L" cursor:

- **X in the map** and `X != page's own scc`: keep the heading line; replace its entire
  sub-tree body (from after the heading down to the next heading whose level ≤ this
  heading's level) with the mapped card HTML; set the skip threshold to this heading's
  level so nested `{data-scc}` headings are consumed (no duplication — the recursive leaf
  card already contains them).
- **X not in the map, or a structural heading (no code)**: leave it untouched and keep
  descending; its children may be card-able.

Leaf card bodies are HTML and contain no markdown `{data-scc=` heading lines, so leaf
pages never match as containers — only true subtree pages are rewritten. The spliced card
is emitted as a contiguous block (blank line before/after the heading group) so MkDocs'
`md_in_html` passes the HTML through verbatim, matching the existing leaf transforms.

### Heading / card relation
The normalized container heading is **kept** above each card (decision: "keep heading,
card below") so the page TOC still lists the item and its per-heading `/scc/<code>/`
permalink anchor keeps working. The card carries its own internal title; the minor
heading↔title echo is accepted for the nav/permalink benefit. Nested items lose their
individual heading anchors (they are inside the recursive card) — accepted.

## Component 2 — config (`internal/site/config.go`, `v2/site.yaml`)

Add an `EmbedCardSections []string` config field (yaml `embed_card_sections`). When unset,
default to `["Browse"]`. Read-tab embedding is enabled later by adding `Read` here once the
performance check passes — no code change.

## Staging & performance

Ship Browse only (90 container pages; per-class pages are individually small). Then measure
mkdocs render time + page weight on the heaviest containers — `class/censor`,
`class/summoner`, `class/beastheart` — before deciding on Read. The long Read "Classes"
chapter (every class in one page) stays plain until that check passes. Cards are static
build-time HTML (statblocks need only the cheap `steel-statblock.js wire()`); the costly
material link-preview pass is already disabled, so the residual runtime cost is DOM weight.

## Testing

- **Go unit tests** (`embed_cards_test.go`, table-driven, `internal/site`): shallowest-
  card-able replacement; subtree-swallow (Judgment's nested ability removed, not
  duplicated); structural heading preserved (`## Basics`, `## 1st-Level Features`);
  unknown/own code left alone; a statblock embed and a featureblock embed (frontmatter-
  driven leaf transcluded by code); a leaf page (HTML body, no markdown markers) is not
  treated as a container.
- **Build assertion**: after a real `site` build, `Browse/class/censor.md` contains feature
  card markup under each `###` feature heading and no leftover inlined ability markdown;
  `## Basics` and its advancement table survive.
- **Visual**: screenshot `Browse/class/censor` before/after for the user.

## Out of scope

- Read-tab embedding — gated on the Browse performance check (tracked as a follow-up).
- Any card visual change (renderers are frozen; this only relocates finished cards).
- Any pipeline / `data-*` output change (the shared `PageBody` stays mundane markdown).
