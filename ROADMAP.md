# Roadmap

New features and larger planned / in-flight efforts across the workspace. Smaller
in-scope tangents to clear before the next feature go in `FOLLOWUPS.md`, not here.

Each item is a numbered `## N.` section so it has a citable handle ("roadmap item 3").
Mark a finished item with a `**Status:** done` line rather than deleting it; completed
items are pruned and the rest renumbered on a periodic cleanup pass.

<!-- Template — copy for each item, numbering sequentially:
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
  custom JS) dropped render from ~31s to ~1–2s. See v2 ADR
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

## 5. Reuse the mkdocs heading-anchor (¶) icon for SCC permalinks in the v2 site

**Status:** open

- **Identified:** 2026-06-01, follow-up idea while reviewing advancement-table links.
- **What:** mkdocs Material renders a permalink anchor icon (¶) next to every heading via `toc: permalink: true` (`v2/mkdocs.yml:63-64`). Reuse that same icon/affordance to surface the **SCC permalink** — ideally a per-heading SCC anchor that matches the native heading-anchor look, instead of (or alongside) today's single page-title "copy permalink" button.
- **Why:** Consistent, discoverable affordance. Currently SCC permalinks are exposed only as one opt-in copy button by the page H1 (`v2/docs/javascripts/scc-permalink-copy.js`, injected via `overrides/main.html` when frontmatter has an `scc` field). Heading-level SCC anchors would let readers grab the stable `/scc/<code>/` link for a specific ability/feature/section, reusing the visual language readers already know from the ¶ icon.
- **Context:**
  - The ¶ icon is generated by the `toc` extension; its glyph/style is themeable (Material uses an icon + `.headerlink` class). Investigate whether to (a) restyle/extend the existing `.headerlink` to also offer the SCC link, or (b) emit a parallel SCC anchor that borrows the same icon/CSS.
  - SCC codes today map to **pages**, not sub-headings — the stub generator emits `scc/<code>/index.html` redirects per page (`steel-etl/internal/site/permalinks.go`). Per-heading SCC permalinks depend on heading-level SCC codes + anchor-qualified targets, which is **roadmap item 3** (in-page anchor links) — coordinate the two.
  - Existing JS to extend rather than duplicate: `v2/docs/javascripts/scc-permalink-copy.js`. Background: `v2/.repo-docs/decisions/2026-05-23-scc-permalink-system.md` and `2026-05-31-retire-scc-address-bar-rewrite.md`.
  - Gotcha: link-dense pages were the cause of the ~31s render (link previews, since disabled — see roadmap item 1). Adding an anchor + handler per heading is far lighter than per-link previews, but still verify it doesn't re-introduce per-navigation DOM-walk cost.
- **Effort:** S (page-title icon reuse only) / M (true per-heading SCC anchors, gated on roadmap item 3).
