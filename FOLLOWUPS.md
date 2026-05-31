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

### SCC permalink rewrite breaks Material's search + sitemap fetch on direct page loads (404s)

- **Identified:** 2026-05-30, while reviewing console logs after the v2 Read-page performance work (this bug is **unrelated** to that work — the perf commit only touched `extra.css`, `ability-cards.js`, and removed two `extra_javascript` entries in `mkdocs.yml`).
- **What:** On any page that has an SCC permalink (the Browse pages with `<meta name="scc-permalink">`), when loaded via a **full page load** (initial nav, hard refresh, or direct SCC stub hit), the browser console shows:
  - `GET /v2/scc/sitemap.xml 404 (Not Found)`
  - `GET /v2/scc/search/search_index.json 404 (Not Found)` → followed by `Uncaught Error at XMLHttpRequest (index.ts:80)`

  Both resources actually live at the **site root**: `/v2/sitemap.xml` and `/v2/search/search_index.json`. The requests are going one directory too deep, under `/v2/scc/`.
- **Why it matters:** The `search_index.json` 404 means **in-page search is broken** on directly-loaded SCC-permalinked pages (the search overlay has no index to query). The `sitemap.xml` 404 is harmless in practice (crawlers fetch `/v2/sitemap.xml` directly), but it's noise and a symptom of the same root cause. Normal links, CSS, and JS still work because of the injected `<base>` tag — it's specifically Material's *runtime-computed* fetch URLs that escape the `<base>` fix.
- **Root cause (directory-depth mismatch from the URL rewrite):**
  1. Load `/v2/Browse/class/censor/` directly. MkDocs emits `__config.base = "../../.."` in the page — correct for the **friendly** path (3 segments `Browse/class/censor` → resolves to `/v2/`).
  2. The inline early-rewrite script in `v2/overrides/main.html` (the `{% if page.meta.scc %}` block in `extrahead`) calls `history.replaceState` to put the **SCC permalink** in the address bar: `/v2/scc/mcdm.heroes.v1/class/censor/` — which is **4 segments deep** — and injects `<base href="/v2/Browse/class/censor/">` so relative URLs still resolve.
  3. The `<base>` tag correctly fixes resolution for static relative URLs (CSS/JS/`<a>`). **But Material for MkDocs computes its search-index and sitemap URLs at runtime by resolving `config.base` against `location.href` (the address bar), NOT against `document.baseURI`/`<base>`.** So `"../../.."` resolved from the now-4-deep `location.pathname` (`/v2/scc/mcdm.heroes.v1/class/censor/`) yields `/v2/scc/` instead of `/v2/`:
     ```
     /v2/scc/mcdm.heroes.v1/class/censor/  --(../../..)-->  /v2/scc/   ✗  (search/sitemap 404 here)
     /v2/Browse/class/censor/              --(../../..)-->  /v2/       ✓  (what we want)
     ```
  - The SCC permalink targets are 4 path segments (`scc/<source>/<type>/<item>`) while the friendly Browse targets are 3 (`Browse/<type>/<item>`). The rewrite swaps a 3-deep URL for a 4-deep one *without* updating `config.base`, so anything that recomputes relative to the live URL (rather than `<base>`) lands one level too deep. **Note the depth delta is not constant across all SCC types** — verify the actual friendly-vs-SCC segment counts per type (some Browse paths like `feature/ability/<class>/level-N/<ability>` are deeper) before assuming a fixed offset.
  - The code authors already hit this exact "path-depth mismatch" class of bug for **instant navigation** and documented/worked around it (see the long header comment in `scc-permalink.js`, "This avoids a path-depth mismatch…"). The **initial full-page-load** path was not covered because the `<base>` tag was assumed sufficient — it is not for Material's runtime fetches.
- **Key files:**
  - `v2/overrides/main.html` — the inline early-rewrite `<script>` in the `extrahead` block (does the `replaceState` + `<base>` injection on full load). This is where the address bar gets the deeper SCC path.
  - `v2/docs/javascripts/scc-permalink.js` — deferred handler (`detectBasePath`, `onPageReady`, popstate). Read its header comment first; it explains the instant-nav vs full-load split and the existing `<base>` strategy.
  - `v2/docs/javascripts/scc-manifest.js` — generated map `friendly path -> scc path` (`window.__SCC_PERMALINK_MAP__`); shows the depth difference between the two path forms.
  - `v2/mkdocs.yml` — `navigation.instant` + `navigation.instant.preview` are enabled (line ~32-33); `site_url: https://steelcompendium.io/v2`.
  - Built evidence: `v2/site/Browse/class/censor/index.html` has `"base": "../../.."` and the scc-permalink meta; `v2/site/scc/.../index.html` files are 534-byte `meta http-equiv="refresh"` redirect stubs (they do NOT load the Material bundle, so the 404s come from the *real* Browse page after rewrite, not the stub).
- **Reproduce locally:** build (`steel-etl site --config ../v2/site.yaml` then `mkdocs build`), serve `v2/site/` (`python3 -m http.server`), open a Browse page with an SCC permalink (e.g. `/Browse/class/censor/`) with DevTools console open, and watch for the two 404s + the search XHR error. (Headless Chromium is at `~/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome`; drive it over CDP with **node ≥20** for global `WebSocket` — devbox node is v24, system node is v18 which lacks it. The Playwright MCP tool could not find a browser channel in this environment.)
- **Candidate fixes (need evaluation — each has risk to the permalink feature; do NOT pick blindly):**
  1. **Don't rewrite to a different-depth URL on full load.** Keep the friendly URL in the address bar and rewrite to the SCC permalink only at copy-time (e.g. intercept copy / provide a "copy permalink" affordance). Eliminates the depth mismatch entirely but changes the "address bar always shows the permalink" behavior the feature was built for.
  2. **Make `config.base` absolute** (`/v2/`) so relative resolution is depth-independent. Could be done via the `site_url`/`use_directory_urls` config or by post-processing; verify it doesn't break Material's other relative-URL assumptions.
  3. **Override Material's search-index base** so it fetches from the true root regardless of `location.href` (e.g. set the search worker's base explicitly, or override the search template/partial). Most targeted but requires understanding Material 9.7.6's search bootstrap (`index.ts` / `bundle.ts` in the theme).
  4. Rewrite the address bar to an SCC permalink whose **depth matches the friendly path** (pad/normalize), so `config.base` still resolves correctly — likely too hacky and breaks the clean permalink form.
- **Effort:** S–M (investigation + careful fix + cross-browser verify that search works on a directly-loaded Browse page and instant-nav still works).

### In-page anchor links on class/chapter/ancestry pages

- **Identified:** 2026-05-29, book-faithful-pages refactor
- **What:** Cross-reference links on aggregate pages (class/chapter/ancestry) currently point to standalone section pages rather than in-page anchors. Now that all content is rendered inline in book order, in-page anchors would give readers finer-grained navigation targets.
- **Why:** Improves UX — users clicking a link to an ability/feature on a class page land directly at that ability rather than navigating to a separate page.
- **Context:** Requires threading heading ID generation through `RenderSubtree` and updating `scc-manifest.js` to emit anchor-qualified paths for sub-section codes. Cross-repo: `steel-etl/internal/content/render_subtree.go`, `internal/site/`, `v2/docs/javascripts/scc-manifest.js`.
- **Effort:** M

### Pre-existing test failure `TestBuild_GeneratesIndexPages` in `steel-etl/internal/site/`

- **Identified:** 2026-05-29, book-faithful-pages refactor
- **What:** `TestBuild_GeneratesIndexPages` fails with a missing ability/trait subdir link in the feature index. This predates the book-faithful-pages work and remains unaddressed.
- **Why:** Restore a green test suite baseline; the failure may indicate a real gap in index generation for nested feature types.
- **Context:** Test lives in `steel-etl/internal/site/`. Failure is pre-existing — not introduced by the book-faithful-pages refactor. Investigate separately to avoid conflating root cause.
- **Effort:** XS–S

### Sync or retire `annotate_heroes.py` (diverged from canonical source)

- **Identified:** 2026-05-29, truncated-link fix
- **What:** `steel-etl/annotate_heroes.py` is documented as the generator of `input/heroes/Draw Steel Heroes.md`, but the `.md` is now hand-maintained — ~4,055 cross-reference links and 170+ annotations added this year live only in the `.md`. Re-running the script would clobber all of it.
- **Why:** Prevent accidental data loss. Either retire the script (declare the `.md` canonical) or update it to emit current annotations/links so it can regenerate safely.
- **Context:** Not wired into any build step (only referenced in `CLAUDE.md`/`README.md`). `.md` and `.py` last touched together in commit `b8ad669`. Decision this session (per plan `docs/superpowers/plans/2026-05-29-truncated-link-fix.md`): edit `.md` directly, leave `.py` stale.
- **Effort:** XS to retire with a doc note; M for a full re-sync

### Bring `gen_linking_reference.py` in sync or retire it

- **Identified:** 2026-05-29, truncated-link fix (doc sweep)
- **What:** `steel-etl/scripts/gen_linking_reference.py` emits only 9 of the 16 linkable types and cannot reproduce the committed `docs/linking-reference.md` (which has skill subgroups, disambiguation notes, and the new Projects/Gods sections). The reference file is currently hand-curated.
- **Why:** Restore regenerability so the reference table stays in sync with `classification.json`. Until then it must be hand-edited.
- **Context:** `INCLUDED_TYPES` is missing culture, skill, condition, movement, negotiation, project, god; also lacks skill-group splitting and per-type notes. `docs/linking-reference.md` header now warns against regenerating over it (would lose ~130 terms + notes).
- **Effort:** S

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
