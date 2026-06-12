# Completed roadmap items — archived 2026-06-11

Items pruned from [`ROADMAP.md`](../../ROADMAP.md) once shipped. Kept here for
provenance. Original ROADMAP numbers are noted; they do not correspond to the current
numbering in the live file.

---

## Reuse the mkdocs heading-anchor (¶) icon for SCC permalinks in the v2 site (was ROADMAP #5)

**Status:** done — 2026-06-04. Shipped: `RenderSubtree` emits `{data-scc="<code>"}` (attr_list) on coded subheadings; `scc-headerlinks.js` reuses the native `.headerlink` ¶ to copy the stable `/scc/<code>/` link (SCC-backed) or a friendly `#anchor` link (structural), copy + jump, with `.headerlink--scc` accent styling; the page-title button (`scc-permalink-copy.js`) was removed. The "gated on roadmap item 3" caveat below proved **unnecessary** — every SCC code already has a page-level redirect stub to that item's canonical page, so aggregate-heading SCC links resolve correctly without anchor-qualified targets. See `v2/.repo-docs/decisions/2026-06-04-scc-heading-permalinks.md`.

- **Identified:** 2026-06-01, follow-up idea while reviewing advancement-table links.
- **What:** mkdocs Material renders a permalink anchor icon (¶) next to every heading via `toc: permalink: true` (`v2/mkdocs.yml:63-64`). Reuse that same icon/affordance to surface the **SCC permalink** — ideally a per-heading SCC anchor that matches the native heading-anchor look, instead of (or alongside) today's single page-title "copy permalink" button.
- **Why:** Consistent, discoverable affordance. Heading-level SCC anchors let readers grab the stable `/scc/<code>/` link for a specific ability/feature/section, reusing the visual language readers already know from the ¶ icon.
- **Context:** Existing JS extended: `v2/docs/javascripts/scc-permalink-copy.js` (since removed). Background: `v2/.repo-docs/decisions/2026-05-23-scc-permalink-system.md` and `2026-05-31-retire-scc-address-bar-rewrite.md`.

---

## Bestiary Search & Filter utility (Plan B) (was ROADMAP #7)

**Status:** done — 2026-06-10. Shipped v1 per the plan: `internal/site/bestiary_search.go` emits the `.sc-bestiary-mount` JSON data island over the Browse monster/terrain/retainer frontmatter; `v2/docs/javascripts/steel-bestiary-browser.js` (`window.SCBestiary`) + `steel-bestiary.css` provide the search box, Type/Role/Organization/Size/Keyword facets, Level/EV range filters, and a sortable results table. The static "coming soon" placeholder was retired. Advanced condition-query facets (§B5 seam) remain deferred (see Blocked sub-feature). Part A (restructure into Browse) shipped 2026-06-10.

- **What:** Repurpose the **Bestiary** tab from a flat browser into a faceted **Search & Filter** finder over every statblock / dynamic-terrain / retainer, so Directors can answer queries like "undead minions in the EV 3–6 range." Reuses the existing `SCBrowse` `.sc-browse-mount` pattern via a sibling `window.SCBestiary` component + a build-time JSON data island; client-side facets (Type/Role/Organization/Size/Keyword), numeric Level/EV range filters, and a dense sortable results table. No backend, no SCC re-mint, no data-repo change.
- **Why it matters:** The new tab purpose Scott set — a Director utility to find adversaries by criteria across current and future sourcebooks, distinct from the hierarchical Browse tab.
- **Where the work lives:** Design `steel-etl/docs/superpowers/specs/2026-06-10-bestiary-restructure-and-search-design.md` (Part B); plan `steel-etl/docs/superpowers/plans/2026-06-10-bestiary-search-utility.md` (7 tasks).
- **Blocked sub-feature:** Advanced "inflicts *poisoned*"-style condition queries need a data source the frontmatter lacks (a community-aggregated spreadsheet). The plan reserves a clean left-join seam (§B5) but v1 shipped without it — revisit when/if that data is secured.
- **Follow-up:** Wiring the bestiary pages into the in-prose SCC link sweep is tracked separately (`FOLLOWUPS.md` #5, "Link the bestiary pages into the SCC cross-reference sweep").
