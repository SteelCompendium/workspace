**Ask: OK to land? Landing `v2` to `main` auto-deploys the live site, so this is also the deploy decision.**

Every card family now carries the plate instead of the floating strip: statblock, featureblock, ability, trait, and kit. Four things that were broken on the live site before this work are fixed with it: the "add to encounter" chip no longer appears on the first embedded statblock of a Read chapter; embedded cards no longer show a copy-link that copied the chapter's URL; trait pages no longer repeat their title above the card; and the three retainer-minion pages (Razor, Gorrre, Violent) no longer show their name twice either — that one was filed as SC-301 and is delivered here.

Independent review: **approved** after one full pass and two scoped re-checks. The first full pass found two real regressions the geometry gate could not see (kit and trait pages had lost their copy-link; the three minion pages got export buttons dumped into the card head instead of a plate). Both are fixed, and the gate now checks what each plate contains, so that class of miss fails the build. The branch is rebased onto today's `main` (SC-177's My Table pin changes) and the pin flow was exercised end to end on the merged code.

## What you're approving

1. Land the `sc297-menu-panels-site` branch: `v2` @ `27a021adbf` plus the DESIGN.md / CHANGELOG entries in the workspace. Landing pushes `v2` `main`, which deploys the site. (`main` moved again while the review finished — SC-300's My Table compaction — so the branch is being re-rebased onto it right now; the content you see here does not change, only the sha will.)
2. One number differs from the plugin on purpose: at phone width the card reserves `2.5em` above itself for the always-visible plate, not the plugin's `2.1em`. The site's plate measures 44px tall and `2.1em` came up 4px short. Desktop geometry is identical to the plugin (10px inset, plate bottom on the card's top border).

Not part of this, filed separately: SC-298 (kit cards show only the pin because kit pages lack the export island — a pre-existing `steel-etl` gap).

Approve = the dispatcher lands it and the site updates; SC-301 closes with it. Hold = say what to change; it stays on the branch.

## The three families you have not seen yet

Featureblock (Ogre Malice), dark, hovered — plate above the malice head band:
{{IMG:sc297-r2-featureblock-dark-hover.png}}

Trait, light, hovered:
{{IMG:sc297-r4-trait-light-hover.png}}

Kit, dark, hovered — copy-link and pin (MD/PNG arrive with SC-298):
{{IMG:sc297-r4-kit-dark-hover.png}}

Phone width, featureblock, dark — plate always visible, nothing covered:
{{IMG:sc297-r2-featureblock-dark-phone.png}}

## The fixes

Retainer minion (Razor), dark, hovered — this page has a "Summoned by" line between the heading rule and the card; it now gets a proper plate (the first rollout had put MD/PNG chips on top of the "RETAINER" eyebrow):
{{IMG:sc297-r4-minion-razor-dark-hover.png}}

Same page after the SC-301 fold — one title, the page heading hidden as on every other card page:
{{IMG:sc297-r6-minion-razor-title.png}}

Read chapter (Retainers, 21 embedded statblocks), dark — no stray encounter chip, no stray copy-link on any embedded card:
{{IMG:sc297-r2-read-chapter-dark-no-stray.png}}

Trait leaf page, dark — one title, where before the page heading repeated above the card:
{{IMG:sc297-r2b-trait-dark-title.png}}

Pin flow on the merged code — Minotaur Sunderer pinned from its plate, showing on the My Table pinboard:
{{IMG:sc297-r6-pin-flow.png}}

## For the record

- Branch `sc297-menu-panels-site`: `v2` @ `27a021adbf`, five commits over `origin/main` `e83421a61d` (prototype, rollout, trait fix, review fixes, minion title + docs); worktree superproject @ `117911b7`, four commits over `origin/main` `f5fe0494`. Rebase conflicts were the DESIGN.md pinboard row (merged with SC-177's wording) and the `v2` pointer; `sc-pins.js` merged with zero conflicts (SC-177 and this branch touched different functions). All other submodule pins equal `main`'s.
- Gates: v2 unit 86/86 (four new tests for `scc-card-copy-core.js`, four from SC-177); original e2e 6/8, the two failures (`featureblock-fixture`, `settings-panel`) pre-existing and identical against the live site; SC-177's two new e2e files green; `page-titles.e2e.cjs` 9/9 with the three minion pages added; new `tests/e2e/chrome-panel.e2e.cjs` 245/245 — plate geometry and per-family plate contents measured on every family plus the three back-link minion pages, both schemes, desktop + phone + print. Falsified four ways (2px inset or bottom-offset shifts, dropping a button from a family, reverting the phone reserve) — each produces named failures.
- Structure: `sc-chrome.js` is the single "is this a card page, which element is the card" decision; copy-link, pin, encounter-add, export and the plain-page strip all resolve through it. No consumer keeps its own card selector.
- Review: one full independent pass, then two scoped re-reviews (fixes; rebase + folds); reports in `.superpowers/sdd/sc297-menu-panels-site/` (machine-local).
- Docs on the branch: `DESIGN.md` (Card header system names the plate as the home for page actions; component-table row; back-link-tolerant adjacency; copy-link scoped to five families), `CHANGELOG.md` `## Unreleased` (plate; Read-chapter fixes; trait title; minion titles), `v2/CLAUDE.md`, `v2/.repo-docs/conventions.md`, `v2/.repo-docs/troubleshooting.md`.
