# Workspace Follow-Ups

Lightweight tracking for tasks identified during other work that weren't tackled in the original scope. These are intentionally deferred — captured here so they don't get lost.

Add new entries at the top. Remove entries when done (commit message can reference them).

## Entry format

Each entry should include:

- **Identified:** YYYY-MM-DD and the work it came up in
- **What:** brief description of the change
- **Why:** the motivation / what value it adds
- **Context:** background, file paths, gotchas, anything that would save the next person 10 minutes of grepping
- **Effort:** rough sizing — XS (<1 h), S (1–4 h), M (1 day), L (multi-day)

---

### Re-point cross-class / cross-level "canonical" links in advancement tables

- **Identified:** 2026-05-31, while linking the Features column of class advancement tables.
- **What:** Several generic features in the advancement tables were *already* linked (before this pass) to a single canonical code in a **different class or level**, even though a class-and-level-specific code exists. Re-point each to its own `feature.trait.{class}.level-{N}/...` code so links resolve to the contextually-correct page. Known instances:
  - **`Characteristic Increase`** → always linked to `feature.trait.censor.level-10/characteristic-increase`, in every class's level-4/7/10 rows. Per-class/level codes exist (e.g. `fury.level-4/characteristic-increase`, `tactician.level-10/characteristic-increase`).
  - **`Deity and Domains`** (Conduit 1st) → linked to `censor.level-1/deity-and-domains`; `conduit.level-1/deity-and-domains` exists.
  - **`Growing Ferocity Improvement`** (Fury 4th/7th) → linked to `fury.level-10/...`; `fury.level-4/` and `fury.level-7/` codes exist.
  - **`Discipline Mastery Improvement`** (Null 4th/7th) → linked to `null.level-10/...`; `null.level-4/` and `null.level-7/` codes exist.
  - **`Careful Observation Improvement`** (Shadow 7th) → linked to `shadow.level-10/...`; level-specific code may exist.
- **Why:** Consistency — the Features-column linking pass (this session) maps every *newly* linked item to its own class+level code; these pre-existing links are the remaining exceptions. (Note: Talent's `Psi Boost` → `null.level-7/psi-boost` is a *legitimate* cross-class share, not a mistake — leave it.)
- **Context:** All in `steel-etl/input/heroes/Draw Steel Heroes.md` advancement tables (lines ~4696, 6153, 9507, 11097, 12390, etc.). This was deferred from the Features-column pass to avoid touching already-linked items. Decide first whether the "one canonical definition" approach was intentional for identical boilerplate (Characteristic Increase content is the same across classes) before re-pointing.
- **Effort:** S

### Link the Abilities / subclass-Ability columns of advancement tables

- **Identified:** 2026-05-31, Features-column linking pass (explicitly scoped out).
- **What:** Only the **Features** column of each class advancement table was linked this pass. The **Abilities** column (`Signature, 3, 5, ...`) and the per-class **subclass-Abilities** column (`Order/Domain/Aspect/Tradition/College/Doctrine/Class Act Abilities`, e.g. `5, 9, 11`) are still plain text. These are cost-tier references, not named features, so they need a different mapping (tier → ability-group code) than the Features column.
- **Why:** Completeness of in-table navigation.
- **Context:** Same tables in `Draw Steel Heroes.md`. Tier numbers map to per-level/cost ability groups (e.g. the `feature.ability.*.level-N` cost groupings); needs its own mapping rules.
- **Effort:** M

### SCC registry drift + malformed codes (validate --scc-stable landmines)

- **Identified:** 2026-05-31, verifying the advancement-table linking pass (pre-existing — reproduced with the linking change stashed, so **not** caused by it).
- **What:** `steel-etl validate --scc-stable` fails and emits warnings independent of the linking work:
  1. **Malformed code from an embedded link in a heading:** the Shadow "Black Ash Teleport" ability heading contains an inline `scc:` link, so the generated code is `feature.ability.shadow.level-1/black-ash-teleport-scc-mcdm-heroes-v1-movement-teleport` instead of `.../black-ash-teleport`. Clean the heading (move the link into body text) so the code is correct. (Reinforces the truncated-link-fix rule: don't put links in headings.)
  2. **Frozen-registry drift:** `--scc-stable` reports many `feature.trait.common/*-traits` and `feature.trait/*-traits` (ancestry traits) plus `feature.ability.shadow.level-1/black-ash-teleport` as "missing from new registry" — the local (gitignored) `classification.json` baseline is stale relative to the current doc. Regenerate/refreeze the baseline, or investigate whether real ancestry-trait code churn happened.
  3. **Unresolved title links:** `WARN: unresolved scc link "mcdm.heroes.v1/title/stronghold"` and `.../title/monarch` — referenced in the doc but absent from the registry. Either add the `title/` codes or fix the references.
- **Why:** `--scc-stable` should pass cleanly so it can guard real regressions; malformed codes break permalinks/cross-refs.
- **Context:** `steel-etl/input/heroes/Draw Steel Heroes.md`; registry at `steel-etl/classification.json` (generated, gitignored). Run `go run ./cmd/steel-etl validate --scc-stable` to reproduce.
- **Effort:** S (items 1 & 3); S–M for item 2 depending on whether it's stale baseline vs. real churn.

### v2 site is slow to load and navigate (heavy pages + 2.3 MB search index)

- **UPDATE 2026-05-31 — primary symptom RESOLVED.** The dominant cost was **not** page
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

### In-page anchor links on class/chapter/ancestry pages

- **Identified:** 2026-05-29, book-faithful-pages refactor
- **What:** Cross-reference links on aggregate pages (class/chapter/ancestry) currently point to standalone section pages rather than in-page anchors. Now that all content is rendered inline in book order, in-page anchors would give readers finer-grained navigation targets.
- **Why:** Improves UX — users clicking a link to an ability/feature on a class page land directly at that ability rather than navigating to a separate page.
- **Context:** Requires threading heading ID generation through `RenderSubtree` so sub-section SCC codes get anchor-qualified targets, then emitting those anchors in the cross-reference links / SCC redirect stubs. Cross-repo: `steel-etl/internal/content/render_subtree.go`, `internal/site/permalinks.go`. (Note: the old `scc-manifest.js` friendly→SCC map was removed 2026-05-31 when the address-bar rewrite was retired — see `v2/.repo-docs/decisions/2026-05-31-retire-scc-address-bar-rewrite.md`; any anchor work now targets the redirect stubs + cross-ref link generation, not a client-side manifest.)
- **Effort:** M

### Deeper modeling of gods and downtime projects

- **Identified:** 2026-05-29, truncated-link fix
- **What:** The new `project`/`god` parsers (`internal/content/project.go`, `god.go`) are minimal (name/type/body only). Several god groupings were left unannotated — "Heroes of the Elves/Dwarves/Orcs/Hakaan", "Saints of Hell", "Evil Gods", "Lords of Law and Chaos", "Heralds of the Space Gods" — some of which may contain individual saints/deities worth their own codes.
- **Why:** Completeness of deity/project content if surfaced on the site; richer structured output (e.g. project goal/prerequisites, god domain/associated ancestry). Also: ancestry purchased traits carry a "(N Point)" cost that is currently only in heading text, not structured metadata.
- **Context:** 9 individual gods + 16 projects annotated this session; groupings adjudicated as containers and skipped. Parsers produce flat `god/<id>` / `project/<id>` codes.
- **Effort:** S–M
