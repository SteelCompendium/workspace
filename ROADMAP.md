# Roadmap

<!-- next-id: 14 -->

New features and larger planned / in-flight efforts across the workspace. Smaller
in-scope tangents to clear before the next feature go in `FOLLOWUPS.md`, not here.

Each item is a numbered `## N.` section so it has a citable handle ("roadmap item 3");
**take N from the `next-id` counter above, then bump it.** Mark a finished item with a
`**Status:** done` line rather than deleting it; on a periodic cleanup pass, completed
items are moved to `docs/roadmap-archive/` keeping their original number as a
`(was ROADMAP #N)` handle. **Numbers are permanent — never reused, never renumbered**,
so gaps in the live list are expected and there is no grep-and-fix step: a `#N`
reference resolves forever. **Referenced `#N` not in this file? It's completed —
`grep -rn 'was ROADMAP #N' docs/roadmap-archive/`.** Most recent archive:
[`docs/roadmap-archive/2026-06-18-completed.md`](docs/roadmap-archive/2026-06-18-completed.md).

<!-- Template — copy for each item; take N from next-id above, then bump next-id:
## N. Short title
**Status:** open
What it is, why it matters, where the work lives. Code blocks, commands, links welcome. -->

## 1. v2 site load/navigation performance (page weight + search index)

**Status:** open — primary symptom resolved 2026-05-31; remaining items are lower-priority optimizations.

- **2026-05-31 — primary symptom RESOLVED.** The dominant cost was **not** page
  weight or custom JS. Profiling the classes page (served from cache in 5ms, yet ~31s to
  render) pinned ~all the time to mkdocs-material's **link-preview pass**
  (`material.extensions.preview` + `navigation.instant.preview`): a render-time walk over
  every anchor (8,494 on the classes page) doing `new URL()`+`resolve` per link plus
  tooltip `getElements`/`extract`. Disabling previews (keeping `navigation.instant` and all
  custom JS) dropped render from ~31s to ~1–2s. **Shipped** — both preview features are
  commented out in `v2/mkdocs.yml` (with pointer comments) and the change is live. See v2 ADR
  `2026-05-31-disable-link-previews-perf.md`. The items below remain as **lower-priority,
  separate** optimizations (not the cause of the click-to-render slowness).
- **Identified:** 2026-05-31, while verifying the SCC address-bar-rewrite retirement (the slowness is **architectural and pre-existing** — that change removed weight rather than adding it; see note below).
- **What:** Pages are slow to load and especially slow click-to-click. Measured causes, ranked by impact:
  1. **Enormous per-page HTML.** Each page is a full book-order subtree render, so a class page inlines *every* ability → ~1 MB typical, up to **2.3 MB** (`v2/site/Read/chapter/classes/index.html`). Browse class pages (fury/conduit/elementalist) are ~1 MB each. 3,631 HTML pages total.
  2. **`navigation.instant` + `navigation.instant.preview`** (both on, `v2/mkdocs.yml:32-33`) mean every internal click **re-fetches the entire multi-MB document**, `DOMParser`-parses it, and swaps it — no partial loading. `instant.preview` also prefetches+renders pages **on hover**. So you pay full page weight per navigation and per hover.
  3. **2.3 MB `search/search_index.json`**, fetched on load and built into a client-side lunr index (cached after first load; first page of a session eats it). `Read` is already `search_exclude`d, so the 2.3 MB is mostly Browse content.
  4. **`ability-cards.js` re-walks the whole DOM on every `document$`** (every load AND every instant-nav swap): full-document `querySelectorAll` over `.md-typeset blockquote`/`p`/`li`/`table` + per-`ul` child queries — thousands of nodes of main-thread work per navigation. (`reading-progress.js`, `keyboard-nav.js` also run per page.)
- **Why it matters:** Core UX — the site feels sluggish on every page and every click; worst on the big `Read/chapter/*` pages.
- **Relationship to the SCC fix:** the address-bar-rewrite retirement did **not** cause this (it removed the 170 KB `scc-manifest.js` and the rewrite/observer JS). One nuance: before the fix, directly-loaded SCC pages 404'd the search index, so they *skipped* the 2.3 MB download + index build (search was broken but the page was light). Now that search works, those specific pages pay the real index cost — the correct price of functioning search, but it can make exactly those pages feel heavier than before.
- **Candidate levers (lowest-risk first; evaluate, don't apply blindly):**
  1. **Prebuild the search index** — `plugins: search: prebuild_index: true` in `mkdocs.yml` builds the lunr index at build time so the client doesn't rebuild 2.3 MB of JSON on load. CPU win, no content change. Best first experiment if the symptom is "first load chugs."
  2. **Reconsider page granularity** — the 1–2 MB full-subtree pages are the root cost (esp. `Read/chapter/classes` at 2.3 MB). Splitting the largest helps most but pushes against the deliberate book-faithful-pages design (`RenderSubtree`/`PageBody`); a real decision, not a toggle. See `v2/.repo-docs/` and ARCHITECTURE.md.
  3. **Drop `navigation.instant.preview`** (keep `instant`) — stops hover-prefetching multi-MB pages.
  4. **Gate/scope `ability-cards.js`** to the content region and early-return when a page has no ability blockquotes.
- **First step:** confirm which symptom dominates — slow *initial load* vs. slow *click-to-click* — then attack the matching lever (1/3 for load, 2/3/4 for navigation). Measure with DevTools (note: headless Chromium is unreliable in this env — see `docs/handoffs/HANDOFF.md` gotchas).
- **Effort:** S for the search-index prebuild experiment; M–L if page-granularity rework is needed.

## 2. Link the Abilities / subclass-Ability columns of advancement tables

**Status:** open

- **Identified:** 2026-05-31, Features-column linking pass (explicitly scoped out).
- **What:** Only the **Features** column of each class advancement table was linked. The **Abilities** column (`Signature, 3, 5, ...`) and the per-class **subclass-Abilities** column (`Order/Domain/Aspect/Tradition/College/Doctrine/Class Act Abilities`, e.g. `5, 9, 11`) are still plain text. These are cost-tier references, not named features, so they need a different mapping (tier → ability-group code) than the Features column.
- **Why:** Completeness of in-table navigation.
- **Context:** Same tables in `Draw Steel Heroes.md`. Tier numbers map to per-level/cost ability groups (e.g. the `feature.ability.*.level-N` cost groupings); needs its own mapping rules.
- **UPDATE 2026-06-02 — beastheart same call.** The beastheart linking pass linked the **Features** column of the Beastheart Advancement table (level-specific, so repeated generics like Perk/Skill resolve per level) and the Wild Nature Maneuver/Triggered-Action/5th/8th feature tables, but left the **Abilities** (`Signature, 3, 5, 7, 9, 11`) and **Wild Nature Abilities** (`5, 9, 11`) cost-tier columns plain — there is no landing SCC code for "the N-Ferocity ability group at level L" (beastheart abilities are `feature.ability.beastheart.level-N/<name>` with cost only in frontmatter; no per-cost-tier index page). Resolving this needs the same tier→ability-group mapping as heroes; do both together.
- **UPDATE 2026-06-03.** The Beastheart Advancement table's generic **Features**-column entries ("Wild Nature Feature/Ability", "N-Ferocity Ability") were since linked by annotating their container headers (`feature.trait.beastheart.level-N/<slug>`, mirroring the Fury class). The cost-tier **columns** above remain the open work here.
- **Effort:** M

## 3. In-page anchor links on class/chapter/ancestry pages

**Status:** open

- **Identified:** 2026-05-29, book-faithful-pages refactor
- **What:** Cross-reference links on aggregate pages (class/chapter/ancestry) currently point to standalone section pages rather than in-page anchors. Now that all content is rendered inline in book order, in-page anchors would give readers finer-grained navigation targets.
- **Why:** Improves UX — users clicking a link to an ability/feature on a class page land directly at that ability rather than navigating to a separate page.
- **Context:** Requires threading heading ID generation through `RenderSubtree` so sub-section SCC codes get anchor-qualified targets, then emitting those anchors in the cross-reference links / SCC redirect stubs. Cross-repo: `steel-etl/internal/content/render_subtree.go`, `internal/site/permalinks.go`. (Note: the old `scc-manifest.js` friendly→SCC map was removed 2026-05-31 when the address-bar rewrite was retired — see `v2/.repo-docs/decisions/2026-05-31-retire-scc-address-bar-rewrite.md`; any anchor work now targets the redirect stubs + cross-ref link generation, not a client-side manifest.)
- **Effort:** M

## 4. Deeper modeling of gods and downtime projects

**Status:** open

- **Identified:** 2026-05-29, truncated-link fix
- **What:** The `project`/`god` parsers (`internal/content/project.go`, `god.go`) are minimal (name/type/body only). Several god groupings were left unannotated — "Heroes of the Elves/Dwarves/Orcs/Hakaan", "Saints of Hell", "Evil Gods", "Lords of Law and Chaos", "Heralds of the Space Gods" — some of which may contain individual saints/deities worth their own codes.
- **Why:** Completeness of deity/project content if surfaced on the site; richer structured output (e.g. project goal/prerequisites, god domain/associated ancestry). Also: ancestry purchased traits carry a "(N Point)" cost that is currently only in heading text, not structured metadata.
- **Context:** 9 individual gods + 16 projects annotated in that pass; groupings adjudicated as containers and skipped. Parsers produce flat `god/<id>` / `project/<id>` codes.
- **Effort:** S–M

## 6. Printing provenance stamp + SCC code lifecycle (tombstones)

**Status:** (a) printing stamp **done** 2026-06-11 (plan: `steel-etl/docs/superpowers/plans/2026-06-11-printing-provenance-stamp.md`); (b) tombstone lifecycle blocked on MCDM decision triggers. Design: `steel-etl/docs/superpowers/specs/2026-06-11-printing-provenance-and-code-lifecycle-design.md` — **read it before touching this; it captures the whole discussion.**

- **What:** (a) *(shipped)* the heroes source's `printing: "1.01b"` frontmatter flows as a non-identity build stamp — registry `books` map → SCC API JSON (`books` + per-entry `printing`) → site page frontmatter/footer line — plus the `heroes-printing-1.01b` git tag (ingest convention in `steel-etl/CLAUDE.md`); (b) a code-lifecycle (tombstone) model for when MCDM removes/replaces an entity: new code for the replacement, `status: removed` / `removed_in` / `superseded_by` for the old one, never reuse or 404.
- **Why it matters:** Debugging provenance (typo reports → source printing) without ever re-minting identities. The naive alternative — putting the printing in the SCC source segment (`mcdm.heroes.v1_01b`) — was tried 2026-06-11 and instantly dangled ~19k links; the design doc records why that and the snapshot-all-versions model are rejected.
- **Decision triggers:** (b) is blocked on MCDM actually shipping a removal/replacement or announcing a true new edition — the tombstone-content question (Option A: annotated retention in source doc — leaning; Option B: registry-only) is deliberately undecided until then.
- **Effort:** (b) unknown until a trigger fires.

## 7. Statblocks → build-time HTML + entity-embedding

**Status:** open (the enabling, larger half of the featureblock-cards effort; deferred out of Plan 5).

- **What:** (a) Move monster/companion statblocks from the client-side JSON island (`steel-statblock.js`) to **build-time HTML** (the model `featureblock_page.go` already uses for featureblock/terrain cards). (b) Once statblocks are build-time, **embed** related entities onto a host page: Malice featureblocks into their monster statblock, and the **companion advancement-features card onto the companion statblock page** (the on-page card deferred from Plan 5 — spec §5/§8 of `steel-etl/docs/superpowers/specs/2026-06-13-companion-restructure-advancement-featureblocks-design.md`).
- **Why it matters:** Plans 5a–5c gave companions/fixtures their own separately-coded advancement-features *entities* (live as standalone pages); compositing them onto the parent page needs the host (statblock) to render at build time first. Also removes a client-render dependency.
- **Effort:** large; design spec exists for the embedding half; the island→build-time-HTML migration is the prerequisite.

## 9. Plan 6 — retainer advancement rework (own SCC codes)

**Status:** open (the last piece of the featureblock effort).

- **What:** Give retainer advancement abilities their own `monster.<group>.…advancement-features` codes (collect the currently-uncollected `########` H8 headings — `collectDeepHeadings`/`demoteOverflowHeadings` in steel-etl), replacing **Plan 4's site-side body split** (`internal/site/retainer_page.go`) with a real coded entity, mirroring companions (5b) and fixtures (5c).
- **Why it matters:** Plan 4 shipped retainer advancement as a site-only card built by splitting the statblock body at bold-label separators — the tiers have no SCC identity. This brings them in line with the companion/fixture advancement-features scheme.
- **Effort:** medium; its own spec/plan when started.

## 10. Architecture-redesign carry-over phases (i18n, homebrew spec, consumer migration)

**Status:** open — the three not-yet-done phases of the original architecture redesign (`plans/architecture-redesign/`); surfaced here so they're tracked in the live backlog rather than buried in a 2026-04 plan. Phases 1–5 of that plan are complete (Phase 5 / Monsters shipped 2026-06-05).

- **Phase 3.6 — MkDocs i18n.** *Blocked on a third party providing translation support.* The pipeline + translation tooling (3.1–3.3) are ready and the MkDocs Material i18n scaffolding stays in place; this step needs actual translated content to configure the locale switcher (language switcher links equivalent content across locales via SCC codes) and test against. Deferred deliberately until a translation contributor materializes — still waiting as of 2026-06. (`plans/architecture-redesign/phases.md` §3.6.)
- **Phase 4.4 — Homebrew content spec.** Publisher registration process, third-party SCC allocation (`2.{publisher_id}`), content-format requirements (annotated markdown + frontmatter matching the standard schemas), and JSON-schema-conformance validation rules. (`phases.md` §4.4; "Future Phases / Phase 6: Homebrew Registry" is the build-out that follows the spec.)
- **Phase 4.5 — Consumer migration.** Point `draw-steel-elements` at the consolidated repos, notify the MCDM VTT team of the new data locations, post deprecation notices on the old repos, and set an archive timeline (6+ months). This is the "old repos receive dual-published output" + "consumer migration planned and communicated" exit criteria still unchecked in `phases.md` Phase 4.
- **Effort:** 3.6 M (once unblocked); 4.4 M; 4.5 M–L (cross-org coordination).

## 12. Beastheart companion statblock previews + on-page embedding (feature-group → sbIsland adapter)

**Status:** shipped 2026-06-15. All 12 beastheart companions now render through a site-only `feature-group → sbIsland` adapter: the full `.sb-wrap` card is embedded on each companion's own page (replacing the raw stat table; the `## …Advancement Features` section is kept verbatim below it), and the index (`monster/companion/beastheart/`) shows each base as a `.sb-prev` preview paired with its advancement card.

- **What shipped:** `steel-etl/internal/site/companion_statblock.go` — `parseCompanionGrid` (body `**value**<br>Label` table → defenses/meta/chars/ancestry/level; role "Companion", grey "leader" accent, no EV), `companionFeatures` (parses `##` ability sections by reusing `parseStatblockIslandFeature` via a synthesized `"• **Name**"` title line — zero new feature-parse logic), and `buildCompanionStatblockPage` (leaf transform, hooked into the `buildSection` card chain). Because companion stats live in the body (not frontmatter), the **whole island** is cached in `companionStatblockCache` (reset in `Build()`) so the later index pass can render the preview after the leaf body is already HTML. Index: `buildAdvancementPairContent` renders the base via the cache and tags the grid `.sb-cards` + `data-sbprev-*` so the zone toggles/JS apply (kept the base↔advancement pairing — "Option A"). Shared-renderer tweak: `renderStatblockHead` omits the EV field when empty. v2 CSS: `.sc-cards--pairs.sb-cards` layout in `steel-statblock.css`. Plan: `docs/superpowers/plans/2026-06-15-companion-statblock-adapter.md`.
- **Embedding done (via #13).** The companion advancement-features now show up under the companion statblock on the statblock page (confirmed working 2026-06-18). The standalone `<species>-advancement-features.md` (`type: featureblock`) is `cardable`, so the #13 `embed_cards.go` pass (Browse in `embed_card_sections`) transcludes its card inline beneath the `.sb-wrap` — superseding the verbatim section companion_statblock.go leaves in place.
- **Still open (separate task, per user):** the companion advancement-features featureblock **card quality** (`companion_statblock.go:9-10` still notes the section is left verbatim — its card polish was scoped out). And the default-zone poll = #11.

## 11. Statblock preview-card default zones (poll pending)

**Status:** open — feature shipped 2026-06-15 with a placeholder default; final default awaits a community poll.

- **What:** Decide which zones the `.sb-prev` statblock preview cards show by default
  (`stats`/`meta`/`chars`/`feats`). Shipped default is `stats=on`, the rest `off`.
- **Why it matters:** The user is polling the community on which preview density is most
  useful for scanning index pages; the shipped value is a deliberate placeholder.
- **How:** change the default in exactly three synced places — steel-etl
  `sbPreviewDefaults` (`internal/site/statblock_preview.go`), v2 `settings-core.js`
  `SBPREV_DEFAULTS`, and `v2/overrides/main.html`. No structural work; just the constants.
  Feature/design context: [`DESIGN.md`](DESIGN.md) "user-preference system" +
  `docs/superpowers/plans/2026-06-15-statblock-preview-cards.md`.
- **Effort:** trivial (constant change) once the poll resolves.
