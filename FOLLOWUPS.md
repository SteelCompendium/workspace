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

### Regenerate legacy conformance baselines

- **Identified:** 2026-05-28, SCC link audit
- **What:** The legacy JSON files in `data/data-rules-json/` don't include the new SCC links added during the link audit. The conformance test in `internal/output/conformance_test.go` now strips SCC links before comparing, which is correct but means the test no longer validates that link text is preserved exactly.
- **Why:** When the legacy baselines are regenerated (or the legacy format is retired), the `stripSCCLinks` workaround in the conformance test can be removed and exact matching restored.
- **Context:** `steel-etl/internal/output/conformance_test.go` — `assertEffectFieldMatch` uses `stripSCCLinks()` to normalize before comparison. Legacy baselines are in `data/data-rules-json/`.
- **Effort:** XS — regenerate baselines with current pipeline output, then revert the strip function
