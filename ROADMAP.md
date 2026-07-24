# Roadmap

<!-- next-id: 19 -->

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

## 4. Deeper modeling of downtime projects (gods/saints half shipped)

**Status:** open (narrowed — the gods/saints half shipped 2026-06-18)

- **Identified:** 2026-05-29, truncated-link fix
- **Gods/saints — DONE (2026-06-18):** the religion build-out delivered this half. Gods re-homed to `religion.god/<id>` with `domains`/`pantheon`/`alignment`/`god_class` frontmatter; the 28 saints extracted as `religion.saint/<id>` with `patron`/`domains`; the previously-unannotated groupings adjudicated — "Heroes of the Elves/Dwarves/Orcs/Hakaan" resolve to saints under their god, "Saints of Hell" → the collective `religion.god/lords-of-hell` patron, "Evil Gods" → Nikros/Cyrvis (gods) + Pentalion/Eseld (saints); the remaining groupings ("Lords of Law and Chaos", "Heralds of the Space Gods", "Religion in the Timescape") are prose, not entities, so they mint no codes. See `docs/scc-log.md` (2026-06-18) + `docs/superpowers/plans/2026-06-18-gods-religion-scc-buildout.md`.
- **Remaining — What:** (a) The `project` parser (`internal/content/project.go`) is still minimal (name/type/body only) — no structured project goal/prerequisites/source fields in frontmatter. (b) Ancestry purchased traits carry a "(N Point)" cost that is only in heading text, not structured metadata.
- **Why:** Richer structured output for downtime projects + ancestry trait costs.
- **Effort:** S

## 7. Statblocks → build-time HTML + entity-embedding

**Status:** done — the last remaining half (Malice-band embedding) shipped 2026-07-18 via
FOLLOWUPS #7 (`steel-etl` `ace9bc8`, landed to main): every monster statblock leaf page now
embeds its family's shared Malice featureblock band. See FOLLOWUPS #7 for detail.

- **Done:** (a) monster/companion statblocks moved off the client-side JSON island to **build-time HTML** — `buildStatblockIslandPage`/`renderStatblockCard` (`steel-etl/internal/site/statblock_page.go`, `statblock_card.go`) emit the finished `.sb-wrap` DOM at build time (shipped 2026-06-14; `steel-statblock.js` itself retired from `v2/` 2026-06-18, commit `7fca6cc1d0`). (b, partial) The **companion advancement-features card embeds onto the companion statblock page** — shipped via ROADMAP #12/#13 (`embed_cards.go` transcludes any `cardable` leaf, including `statblock`, by `{data-scc}` code).
- **What remains:** embed the shared-family **Malice featureblock band into its monster statblock** page. `renderStatblockCard` explicitly omits it today (`statblock_card.go`: "The shared family Malice band stays omitted (not in island data; FOLLOWUPS #7)") — each family's malice block still only renders as its own standalone page. The prerequisite (build-time statblock rendering) is done, so this is now just a data-plumbing + embedding task, not a rendering-model change.
- **Why it matters:** a Malice ability card on its own separate page forces readers to jump away from the statblock they're using it against; embedding it inline (like the companion advancement-features card) keeps the statblock page self-contained.
- **Effort:** M — down from "large" now that the build-time-HTML prerequisite and the embedding mechanism (`embed_cards.go`) both already exist; the remaining work is sourcing/attaching each family's malice block to its statblock(s).

## 9. Plan 6 — retainer rework (own SCC codes)

**Status:** done 2026-06-18 (container scope) — the last piece of the featureblock effort.

- **What shipped:** retainers joined the `monster.*` family and their advancement/role groups became coded **container** entities (members inline/uncoded), mirroring fixtures (5c): `monster.retainer.statblock/<id>` (×21), `monster.retainer.advancement-features/<id>` (×21), `monster.retainer.role-advancement/<role>` (×9). Registry net **+30** (3,042 → 3,072). **Plan 4's site-side body split** (`internal/site/retainer_page.go`) was retired in favour of the real paired entities; Browse pairs base+advancement and links a role-advancement landing; Bestiary keeps the `retainer` facet.
- **How:** parser branches (`StatblockParser`/`FeatureblockParser` `domain == "retainer"`) + a source restructure that moves each retainer's `########` H8 advancement headings into sibling `@type: featureblock` sections as **blockquote** level labels (`> **Level N …**` — the only form `ParseRichFeatures` sees). No `collectDeepHeadings`/`demoteOverflowHeadings`/`ContextStack` change.
- **Deferred:** **per-ability** coding (each base/advancement/role ability as its own `feature.ability.*`) is blocked by the flat H7+/level-6 heading model → **ROADMAP #15**.
- **Refs:** spec `docs/superpowers/specs/2026-06-18-retainer-rework-coded-entities-design.md`, plan `docs/superpowers/plans/2026-06-18-retainer-rework-containers.md`, log `docs/scc-log.md` (2026-06-18).

## 10. Architecture-redesign carry-over phases (i18n, homebrew spec, consumer migration)

**Status:** open — the three not-yet-done phases of the original architecture redesign (`plans/architecture-redesign/`); surfaced here so they're tracked in the live backlog rather than buried in a 2026-04 plan. Phases 1–5 of that plan are complete (Phase 5 / Monsters shipped 2026-06-05).

- **Phase 3.6 — MkDocs i18n.** *Blocked on a third party providing translation support.* The pipeline + translation tooling (3.1–3.3) are ready and the MkDocs Material i18n scaffolding stays in place; this step needs actual translated content to configure the locale switcher (language switcher links equivalent content across locales via SCC codes) and test against. Deferred deliberately until a translation contributor materializes — still waiting as of 2026-06. (`plans/architecture-redesign/phases.md` §3.6.)
- **Phase 4.4 — Homebrew content spec.** Publisher registration process, third-party SCC allocation (`2.{publisher_id}`), content-format requirements (annotated markdown + frontmatter matching the standard schemas), and JSON-schema-conformance validation rules. (`phases.md` §4.4; "Future Phases / Phase 6: Homebrew Registry" is the build-out that follows the spec.)
- **Phase 4.5 — Consumer migration.** Point `draw-steel-elements` at the consolidated repos, notify the MCDM VTT team of the new data locations, post deprecation notices on the old repos, and set an archive timeline (6+ months). This is the "old repos receive dual-published output" + "consumer migration planned and communicated" exit criteria still unchecked in `phases.md` Phase 4.
  - **2026-06-20 — repo-consolidation half DONE.** All four books + the cross-book aggregate now publish to the single `data-unified` repo (`en/unified/` Browse + `en/books/<slug>/` Read, all formats), `<locale>` on top (i18n-ready; smoke-tested with `--locale es`). The legacy per-book `data-rules`/`data-bestiary` repos carry deprecation READMEs and the old local-only `data-beastheart`/`data-summoner`/`data-rules-clean` dirs are retired. **Still pending:** repointing `draw-steel-elements` + the SDK at the new locations, MCDM VTT notification, and the formal archive timeline. Spec/plan: `docs/superpowers/{specs,plans}/2026-06-20-data-repo-consolidation*`.
- **Effort:** 3.6 M (once unblocked); 4.4 M; 4.5 M–L (cross-org coordination).

## 12. Beastheart companion statblock previews + on-page embedding (feature-group → sbIsland adapter)

**Status:** shipped 2026-06-15. All 12 beastheart companions now render through a site-only `feature-group → sbIsland` adapter: the full `.sb-wrap` card is embedded on each companion's own page (replacing the raw stat table; the `## …Advancement Features` section is kept verbatim below it), and the index (`monster/companion/beastheart/`) shows each base as a `.sb-prev` preview paired with its advancement card.

- **What shipped:** `steel-etl/internal/site/companion_statblock.go` — `parseCompanionGrid` (body `**value**<br>Label` table → defenses/meta/chars/ancestry/level; role "Companion", grey "leader" accent, no EV), `companionFeatures` (parses `##` ability sections by reusing `parseStatblockIslandFeature` via a synthesized `"• **Name**"` title line — zero new feature-parse logic), and `buildCompanionStatblockPage` (leaf transform, hooked into the `buildSection` card chain). Because companion stats live in the body (not frontmatter), the **whole island** is cached in `companionStatblockCache` (reset in `Build()`) so the later index pass can render the preview after the leaf body is already HTML. Index: `buildAdvancementPairContent` renders the base via the cache and tags the grid `.sb-cards` + `data-sbprev-*` so the zone toggles/JS apply (kept the base↔advancement pairing — "Option A"). Shared-renderer tweak: `renderStatblockHead` omits the EV field when empty. v2 CSS: `.sc-cards--pairs.sb-cards` layout in `steel-statblock.css`. Plan: `docs/superpowers/plans/2026-06-15-companion-statblock-adapter.md`.
- **Embedding done (via #13).** The companion advancement-features now show up under the companion statblock on the statblock page (confirmed working 2026-06-18). The standalone `<species>-advancement-features.md` (`type: featureblock`) is `cardable`, so the #13 `embed_cards.go` pass (Browse in `embed_card_sections`) transcludes its card inline beneath the `.sb-wrap` — superseding the verbatim section companion_statblock.go leaves in place.
- **Still open (separate task, per user):** the companion advancement-features featureblock **card quality** (`companion_statblock.go:9-10` still notes the section is left verbatim — its card polish was scoped out). And the default-zone poll = #11.

## 14. Populate reserved `religion.*` types (domains, orders, pantheons)

**Status:** open (blocked on external content — an upcoming MCDM religion expansion)

- **Identified:** 2026-06-18, religion namespace build-out.
- **What:** The 2026-06-18 build-out **reserved** `religion.domain`, `religion.order`,
  and `religion.pantheon` in the scheme but minted **no** entities (per the deliberate
  decision not to squat codes the future product needs, and to avoid parking
  conduit-flavored "Piety & Effect" prose on them). When MCDM ships the religion
  expansion: (a) mint the 12 `religion.domain/<id>` entities (Creation, Death, Fate,
  Knowledge, Life, Love, Nature, Protection, Storm, Sun, Trickery, War) from the new
  source, and `religion.order/*` / `religion.pantheon/*` as content warrants; (b)
  **upgrade** the existing god/saint `domains:` frontmatter from plain names
  (`[War, Life]`) to `religion.domain/<id>` links (frontmatter-only, no code change).
- **Why:** The reservation keeps the codes free now; this is the follow-through once the
  content exists. The `domains:` name→link upgrade is intentionally deferred until the
  link targets exist.
- **Context:** Reserved-type rationale + the frontmatter-link principle live in
  `docs/scc-reference.md` → "Gods & Religion" and `reference/scc-specification.md` §2.2.
  Domains are sourced today only as the Conduit's per-domain "Piety & Effect" headers
  (`input/heroes/Draw Steel Heroes.md` ~line 6262), which are conduit-biased — a fuller
  domain page likely needs the new product's content, not those headers.
- **Effort:** S–M, gated on external content.

## 15. Monsters/Summoner per-ability coding for statblocks & featureblocks

**Status:** open — **narrowed 2026-06-19**: the fixture-advancement-members slice split out to **#16**
(in flight); the remaining per-ability work below is **deferred by scope choice** ("juice isn't worth
the squeeze"), no longer a hard technical block. Its own brainstorm/spec/plan when started.

- **Identified:** 2026-06-18, writing Plan 6 (`docs/superpowers/plans/2026-06-18-retainer-rework-containers.md`; spec §7).
- **What (remaining):** Give the *individual abilities* inside Monsters/Summoner-book **statblocks**
  (monster statblocks + summoner minions/champions/rivals) and the other **featureblock members**
  (malice, terrain, retainer base/advancement/role abilities) their own SCC codes
  (`feature.ability.*` / `feature.trait.*`) so third-party tools can address a single ability by code.
  *(Fixture advancement members — the featureblock case — are handled by #16 and are no longer part of
  #15.)*
- **Framing correction (2026-06-19).** This item previously claimed **both** candidate mechanisms were
  dead — nested ability sections *and* "synthesizing coded children from blockquotes" — because
  `ParsedContent.Children` is embed-only and the H7+/level-6 cap (`collectDeepHeadings` maps all H7+ to
  level 6; `ContextStack` rejects > 6) blocks tree-nesting. **The second mechanism is not dead.** #16
  adds a small, reusable pipeline capability — **classify parser-emitted coded children** — so a parser
  hands back extra coded entities that get registered + written as leaf pages **without** any
  tree-nesting or cap change. That mechanism generalizes to *any* blockquote members (malice/terrain
  members, statblock/retainer abilities). See the #16 spec §2.1.
- **So what's actually left:** (a) **per-ability statblock coding** is now a *scope* decision, not a
  technical wall — declined for monster statblocks + summoner minions/champions/rivals as not worth the
  cost; (b) coding malice/terrain/retainer **featureblock** members can reuse #16's mechanism whenever
  it's deemed worth it; (c) true **tree-nested ability *sections*** (an ability as a real child section
  of a statblock, inheriting `<id>` context structurally) — the only thing that genuinely needs the
  `collectDeepHeadings` + `ContextStack` cap rework + source re-leveling — remains the large, deferred
  infrastructure change, and is **not** required for (a) or (b).
- **Effort:** L for the cap-rework/tree-nested-sections path; M to extend #16's mechanism to other
  featureblock members; the statblock per-ability coding is declined for now.

## 16. Fixture advancement features → coded members (annotation-based, no infra change)

**Status:** done 2026-06-19 — shipped. Registry +12 (3,063 → 3,075). See `docs/scc-log.md` (2026-06-19).

- **Split from #15** (2026-06-19) as the first concrete, shippable slice.
- **What:** the 4 summoner fixtures' advancement members (`⭐️ Soul Rancor`, `⭐️ Size Increase`, …)
  get individually coded `feature.fixture.<category>.<base-id>.level-N/<member-id>` (×12), each
  resolving to its own leaf page, with the advancement card embedded on the base fixture's page at build
  time. Same *outcome* as beastheart companions, different *mechanism*.
- **How (the key win):** **no source re-leveling, no `ContextStack`/`collectDeepHeadings` change.** Source
  headers stay faithful to the PDF (fixture group H5, etc.); members stay as `> ⭐️ **Name**` blockquotes
  with a per-member inline annotation; the `FeatureblockParser` mints each as a **parser-emitted coded
  child** via the new pipeline capability (see #15 framing correction). One behavioural difference from
  companions: members render as the advancement card's tiers + their own leaves, not as nested in-card
  child sections (a consequence of the level-6 cap, accepted).
- **Refs:** spec `docs/superpowers/specs/2026-06-19-fixture-advancement-coded-members-design.md` (§2 has
  the full decision record); plan `docs/superpowers/plans/2026-06-19-fixture-advancement-coded-members.md`
  (rewritten for the annotation/coded-children approach); log `docs/scc-log.md` (2026-06-19).
- **Effort:** M.

## 17. Extract a shared steel-design token/CSS package for site + plugin

**Status:** open — deliberately deferred past plugin 6.0.0.

- **Identified:** 2026-07-21, plan 20 (Steel material parity). Plan 20 fixed the *symptom*
  (the plugin's Steel theme had drifted from the live site's material treatment); this item
  is the *structural* answer to why the drift was possible at all — the site
  (`v2/docs/stylesheets/steel-*.css`) and the plugin (`draw-steel-elements/styles-source.css`)
  each hand-maintain their own copy of the same design language.
- **What:** publish one package of design tokens (and possibly the primitive rules that
  consume them) that both the v2 site and the Obsidian plugin import, instead of two parallel
  hand-ported stylesheets.
- **The seam already exists.** Plan 20 Tasks 1–2 produced an explicit token contract:
  every `--dse-*` ornament token is mapped to the site `--fx-*` declaration it was ported
  from, line by line, in
  [`docs/superpowers/dse-overhaul/D3-token-map.md`](docs/superpowers/dse-overhaul/D3-token-map.md).
  That table is the concrete extraction boundary — the shared package is essentially that
  table promoted to source of truth, with both consumers aliasing into it.
- **How much actually overlaps: ~40–60%, not "everything."** Only the *presentational card
  family* is common ground (ability/feature cards, statblocks, featureblocks, reference
  cards, power-roll tiers, chips, crests). The plugin additionally owns trackers (initiative,
  montage, project, party, resources), the hero sheet, the Draw Steel sidebar, modals, the
  **Legacy** theme, and the print stylesheet — none of which have a site counterpart, and all
  of which must keep working untouched. So the package can only ever cover the shared subset;
  the plugin keeps a substantial private layer regardless.
- **Main cost: the class vocabulary, not the tokens.** Tokens are easy to share. Sharing
  *rules* means migrating the plugin's `dse-` class names to the site's `sc-` names
  (`.dse-section__title` ↔ `.sc-ability__section-head`, `.dse-sb` ↔ `.md-typeset.sb`,
  `.dse-head__deck--chip` ↔ `.sc-head__slot--chip`, …; the current mapping lives in
  `draw-steel-elements/visual-harness/parity/selector-map.json`). That rename would
  simultaneously invalidate the golden-PNG visual baseline (~295 shots) **and** the
  LEGACY-FREEZE byte-identity proof (98 legacy+print PNGs) — i.e. it destroys both safety nets
  at the exact moment it makes a large visual change. That is the reason to defer, not the
  effort of the CSS itself.
- **Cheaper interim answer, already shipped — but only a partial one:** the site-vs-plugin
  parity check (plan 20 Tasks 2 and 7). `npm run parity` captures the *live* site's computed
  styles for the mapped selector pairs, compares both colour schemes, and fails on a
  flat-where-the-site-is-forged gap; `test/dom/theme/steelMaterial.test.ts` guards the same
  declarations offline. Be precise about what that buys: it is developer-run, **not in CI**
  (FOLLOWUPS #36), it monitors 12 selector pairs across 5 of the 32 element families, and it
  models material only as flat-vs-forged — colour, typography and pseudo-element decoration
  are captured but never asserted (`visual-harness/parity/README.md` → "Known blind spots").
  So duplication remains and divergence *within those blind spots can still happen quietly*;
  what can no longer happen quietly is the wholesale flattening that plan 19 shipped.
  Revisit this item if the check starts reporting churn faster than it is worth maintaining,
  if the blind spots start hiding real drift, or if a third consumer of the design language
  appears.
- **Effort:** L (M for tokens-only; L once rules/classes move, because of the baseline
  re-capture and freeze re-proof).

## 18. Section-scope annotation: end an entity's structured/rendered scope without moving content

**Status:** open — motivated by FOLLOWUPS #38 (Dragon's Fire), which was fixed by a source
reorder instead. This is the general mechanism so a future case needn't reorder.

- **Identified:** 2026-07-23. When an `@type: ability` (or any structured entity) heading is
  followed by trailing prose that semantically belongs to its *parent* — e.g. the 8 armor
  enhancements printed after `###### Dragon's Fire` under `##### Imbue Armor` — that prose
  falls into the entity's section body. Two bad consequences: (a) the structured extractors
  (`extractNamedEffects` et al. in `internal/content/ability.go`) capture it as bogus
  `effects[]`/fields, and (b) it renders on the entity's own narrow page.
- **What:** A source annotation (e.g. `<!-- @scope: end -->`) placed inside a section body
  that marks "structured scope ends here." Both consumers honor it: the field/effects
  extractors stop at the marker (fixes the data bug), and the renderer treats the trailing
  run like an `@owner: loose` callout — stripped from the entity's *own* (root) page but kept
  on broader pages (the parent renders it in-place, matching the book). **No content moves,
  no re-parenting.**
- **Why it's the right seam:** it is a direct generalization of the existing
  `@type: callout | @owner: self|loose` work (`steel-etl/docs/superpowers/specs/2026-06-17-callout-annotation-owner-suppression-design.md`),
  whose spec explicitly reserves this grow-later path — but extended two ways that work does
  not cover: (1) from blockquote-only to arbitrary trailing paragraph runs, and (2) from
  render-only to **extraction-aware** (the effects bug happens pre-render on raw
  `BodySource`, so a render-only strip would not fix it).
- **Context:** currently the only real case is Dragon's Fire (522-ability corpus sweep,
  2026-07-23), which is why it was reordered rather than blocked on this. Build when a second
  case appears or when the render/extraction seams are being touched anyway. Needs: section
  parser or body-extractor change, `validate` coverage (like the callout `@owner` check), and
  render_subtree tests mirroring the callout suite.
- **Effort:** M (parser/extraction + render + validate + tests; grammar already precedented).
