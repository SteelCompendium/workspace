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

## 2026-05-23 — Eliminate URL flash during instant-nav between pages

- **Identified:** 2026-05-23, during SCC permalink implementation.
- **What:** When clicking a link from one Browse page to another, mkdocs-material's `navigation.instant` calls `pushState` with the friendly Browse URL, renders, then `document$` fires and our `scc-permalink.js` flips the address bar to the SCC permalink. There's a brief visible flash during that handoff.
- **Why:** For consistency. Initial page load and in-page anchor clicks are already flicker-free (handled by the inline early-rewrite in `overrides/main.html` and the `hashchange` listener). Instant-nav is the only remaining case where the user sees the friendly URL in the address bar, however briefly.
- **Context:**
  - The flash is purely cosmetic — copy still works because by the time the user reaches for Ctrl+C, our rewrite has already fired.
  - Fix likely requires hooking material's link click handler (intercept before its `pushState`) or pre-computing the SCC permalink target from the link's `href` and substituting at click time.
  - Material's instant-nav source lives in the bundled `assets/javascripts/bundle.*.min.js`; the documented hook is `document$.subscribe`, but there isn't a documented pre-pushState hook.
  - Could also explore disabling `navigation.instant` for SCC-bearing pages and falling back to full navigation — those go directly to the canonical SCC URL via the existing `<link rel="canonical">`. Less invasive but loses the instant-nav UX.
- **Effort:** S — a few hours of poking at material's instant-nav internals + careful testing.
