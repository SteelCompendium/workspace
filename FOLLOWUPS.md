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

### In-page anchor links on class/chapter/ancestry pages

- **Identified:** 2026-05-29, book-faithful-pages refactor
- **What:** Cross-reference links on aggregate pages (class/chapter/ancestry) currently point to standalone section pages rather than in-page anchors. Now that all content is rendered inline in book order, in-page anchors would give readers finer-grained navigation targets.
- **Why:** Improves UX — users clicking a link to an ability/feature on a class page land directly at that ability rather than navigating to a separate page.
- **Context:** Requires threading heading ID generation through `RenderSubtree` and updating `scc-manifest.js` to emit anchor-qualified paths for sub-section codes. Cross-repo: `steel-etl/internal/content/render_subtree.go`, `internal/site/`, `v2/docs/javascripts/scc-manifest.js`.
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
