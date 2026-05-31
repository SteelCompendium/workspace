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

### v2 site is slow to load and navigate (heavy pages + 2.3 MB search index)

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

### Regenerate legacy conformance baselines

- **Identified:** 2026-05-28, SCC link audit
- **What:** The legacy JSON files in `data/data-rules-json/` don't include the new SCC links added during the link audit. The conformance test in `internal/output/conformance_test.go` now strips SCC links before comparing, which is correct but means the test no longer validates that link text is preserved exactly.
- **Why:** When the legacy baselines are regenerated (or the legacy format is retired), the `stripSCCLinks` workaround in the conformance test can be removed and exact matching restored.
- **Context:** `steel-etl/internal/output/conformance_test.go` — `assertEffectFieldMatch` uses `stripSCCLinks()` to normalize before comparison. Legacy baselines are in `data/data-rules-json/`.
- **Effort:** XS — regenerate baselines with current pipeline output, then revert the strip function
