# Steel Compendium Releases

This workspace has no version tags — a "release" here is a deploy of the live site
(steelcompendium.io/v2) and/or the SCC API, so entries are headed by **deploy date**
instead of a tag. New work lands under `## Unreleased` and is promoted to a dated
header when it goes live. One bullet per user-facing change; internal/process changes
go under an *Internal* sub-heading.

## Unreleased

_Nothing pending._

## 2026-07-02 — round-2 review fixes (SOT-3847)

Fixes from the round-2 review (SOT-3847 comment feedback).

### Changed

- **Card control strip is one aligned row** — the copy-permalink button now
  mounts inside the card head with the pin / encounter-add / MD/PNG buttons
  (same top, matching gaps); it no longer straddles the card border, where it
  had ended up overlapping the scaler's "≈ scaled from level…" note.
- **Empty encounter tray still expands** — the heroes/level/victories party
  inputs (and difficulty bands) are reachable before any monster is added;
  the share/markdown actions stay hidden until there is something to share.
- **Class card rail reads as one field** — the deck line under the
  "Might · Presence" mini is now its caption ("primary characteristics")
  instead of the second data point "start at 2".

### Removed

- **"In this chapter" mini-TOC** on Read chapters — redundant with the
  built-in right-sidebar table of contents, and it sat off-center under the
  new centered chapter titles.

## 2026-07-02 — UX-wave feedback round 2 (SOT-3850…3854)

Second feedback round on the UX wave (SOT-3847 subtasks SOT-3850…3854).

### Changed

- **Statblock scaler lives in the Level chip** — hover the card and −/+ steppers
  appear flanking the chip (the same reveal as the copy-link/pin/encounter
  controls); while scaled the chip turns amber, the steppers stay visible, and
  the approximation note above the card gains a Reset button. The separate
  "Scale to level" input row above the card is gone. (SOT-3850)
- **Page actions moved to a top-right strip** — on plain (non-card) pages the
  page permalink and pin are now always-visible card-style buttons in the
  top-right of the content pane, replacing the hover-revealed inline icons
  beside the H1. Read chapters — whose pin previously mounted on the first
  *embedded* card — now pin correctly as pages, under the chapter's own title.
  (SOT-3851)
- **Encounter tray: the whole header row collapses/expands** — the chevron
  alone was too small a target; the ⋯ menu button hides while collapsed (its
  dropdown opened below the bottom-fixed tray, off-screen) and an empty tray's
  menu now opens upward. (SOT-3852)
- **Class card header balanced** — the head's right rail now carries the book
  chip and the primary characteristics ("Might · Agility" + "start at 2"),
  mirroring the statblock's Level/role/EV rail; the stat and potency strips
  became two matched 3-column rows of centered value-over-label cells (the
  statblock defense-grid pattern). (SOT-3853)
- **Chapter pages open book-style** — centered title with a small-caps
  "book · Chapter N" eyebrow above it, symmetric over the ◆ divider, instead
  of a full-width display H1 jammed left. (SOT-3854)

### Fixed

- **Duplicate page title over statblock cards (live regression)** — the
  scaler's control row sat between the page's `hr` and the card, breaking the
  strict h1+hr+card adjacency that hides the duplicate H1; the scaler UI (now
  the note) lives inside the card wrap instead. (found while testing SOT-3850)

## 2026-07-02 — UX-wave feedback round (SOT-3847)

Feedback round on the UX wave — the SOT-3847 subtasks (SOT-3839…3845).

### Fixed

- **Pinboard removal works** — the × on `/pins/` used a toggle that could re-add the
  item with no title (rendering "undefined"); removal is now a pure remove, the
  delegated listener survives instant-nav script re-execution, and removing the last
  pin restores the empty-state prose. (SOT-3840)
- **"Copy as Markdown" no longer truncates** — python-markdown's link pattern outranks
  its raw-HTML pattern and rewrote `[text](url)` *inside* the card's `data-src`
  attribute into an `<a href>` whose quote terminated the attribute mid-statblock.
  Trigger characters (`[`, backtick, backslash) are now entity-encoded; the copied
  markdown also converts file-relative links to absolute site URLs. (SOT-3843)
- **Statblock scaler potencies actually scale** — the potency rewrite matched a
  literal `<` but tier rows arrive as innerHTML where it's `&lt;`; the pattern is now
  entity-aware. (SOT-3844)

### Changed

- **Pin control is a pushpin and auto-hides** — the ★ became the Material pushpin
  (outline → filled when pinned) and the inline button beside prose H1s is
  hover-revealed like the ¶ permalink. (SOT-3841)
- **Encounter tray got a ⋯ menu** — Clear encounter / Reset builder / Close (close is
  session-scoped and re-opens when something is added). The footer Clear button moved
  into the menu. (SOT-3842)
- **Statblock scaler is comprehensive** — "Scale to level" now also shifts the five
  characteristics (clamped ±5), every "Power Roll +N" bonus (the dice roller follows),
  and potencies inside ability effect prose, all as deltas from the printed values
  per the book's *Adjusting Monster Levels* formulas. (SOT-3844)
- **Class landing card carries the class's numbers** — starting characteristics,
  starting stamina, stamina per level, recoveries, and the skills line, plus the
  flavor text styled inside the card (its duplicate opening paragraph is dropped from
  the body). The ten "Nth-Level Features" jump pills collapsed into one "Level
  1 2 … 10" group. Parser now emits `starting_stamina` / `stamina_per_level` /
  `recoveries` / `primary_characteristics` frontmatter (schema fields already
  existed). (SOT-3845)
- **Table Reference covers the official Rules Reference** — added common main/move
  actions, hero token spends, surges, saving throws / EoT / potency notation, size,
  areas of effect, forced-movement specifics (stability, slams, breaking objects),
  edge+bane mixing, and the skill +2 — paraphrased and cross-checked against the
  book text (which supersedes the PDF where they differ, e.g. surge damage).
  (SOT-3839)

## 2026-07-02 — the UX wave (P1–P11)

Eleven efforts from the 2026-07-01 UX review
(`docs/superpowers/specs/2026-07-01-v2-ux-analysis.md`), all shipped to the live v2
site across a series of deploys on 2026-07-02. Per-effort detail:
`docs/superpowers/plans/2026-07-01-p1…p11-*.md`.

### Fixed

- **Mobile statblock names no longer collapse letter-per-line** — at phone widths the
  card header's right rail (role/Level/EV) now stacks *under* the name instead of
  starving its grid column. Applies to every card type (statblock, ability, kit,
  featureblock). (P1)
- **Class pages and Read chapters got their titles back** — the CSS that hides the
  duplicate `# Name` heading on single-card leaf pages over-matched any page
  *containing* a card; it is now keyed on strict `h1 + hr + card` adjacency. (P1)
- **Custom 404 page** — search hint, links to Browse/Books/Bestiary, and a
  report-a-broken-link action, replacing the bare "404 - Not found". (P1)
- **Leftover `/Browse/index_old/` page removed** — it was live, search-indexed, and
  the source of the phantom duplicate "Browse Rules" sidebar entry. (P1)
- **Browse landing "View Retainers" card** pointed at the retired `retainer/` path;
  now links `monster/retainer/`. (P1)
- **Search ranking favors canonical pages** — per-type `search.boost` frontmatter
  (classes 4×, rules/conditions/ancestries/movement 3×, statblocks 0.6×): searching
  "fury" now returns the Fury class before the four Rival Fury statblocks, "jump" the
  movement rule before War Dog Blood Jumper. (P2)
- **Bestiary Size filter is a closed vocabulary** — dynamic-terrain free-text area
  descriptions ("any area; the area can't be moved through", …) bucket as a single
  "Area" chip instead of appearing verbatim. (P2)
- **Home page polish** — brand line unified ("Steel Compendium" + curated-by byline),
  the 12-repo legacy data list collapsed behind a disclosure. (P1)

### Added — navigation

- **Class landing headers** — every Browse class page opens with a card (Class
  eyebrow, name, Weak/Average/Strong potency strip) and a jump bar over its ~12
  sections, instead of untitled prose 82,000px tall. (P3)
- **Read-chapter reading aids** — prev/next chapter links (book order), a collapsible
  "In this chapter" mini-TOC at the top of each chapter, and a "Resume reading (N%)"
  chip that restores your last position per chapter. (P4)
- **Per-class ability tables** — each `Browse → Features → Abilities → <class>` index
  now carries a sortable Name · Lv · Cost · Action · Distance · Target table of the
  class's complete ability list (tablesort column sorting; responsive column-dropping
  on phones). (P5)

### Added — at-the-table tools

- **Table Reference tab** — a one-page GM screen: turn structure, the power roll with
  edge/bane/crit rules, condition one-liners (verified against the rule text), common
  maneuvers, movement, dying/recovery, combat modifiers, and director quick numbers.
  Print-optimized. (P6)
- **"My Table" pinboard** — a ★ control on every entity page pins it to `/pins/`,
  grouped by kind (localStorage, this-browser-only). (P7)
- **Encounter builder** — a "+" on every Bestiary row (and on statblock pages) feeds a
  budget tray: party inputs (heroes/level/victories), the book's encounter-strength
  math and Trivial→Extreme difficulty bands, minions priced four-at-a-time, over-level
  ⚠ warnings, shareable `?enc=` links, and copy-as-markdown. (P8)
- **Click-to-roll power rolls** — click any power-roll header for a 2d10 popover with
  edge/bane steppers (single = ±2, double = tier shift, natural 19–20 crits) and a
  highlight on the matching tier row. (P9)
- **Card exports** — hover any entity card for MD (copies the original source
  markdown) and PNG (2× card render) export chips, joining copy-link / pin /
  add-to-encounter in the top-center control strip. (P10)
- **Statblock level scaler** — a "Scale to level" stepper applies the Monsters book's
  *Adjusting Monster Levels* formulas as deltas from the printed values (EV, Stamina,
  free strike, damage tiers, potencies — the formulas reproduce printed blocks
  exactly at their own level), with a dashed outline + "approximation, not a published
  statblock" banner and exact restore. Session-only by design. (P11)

### Internal

- **Test infrastructure**: two e2e regression suites (`page-titles`, `cardhead-mobile`;
  playwright-core driving Brave, runnable against local builds or production) and six
  new node:test unit suites (~35 tests) over the new `*-core.js` logic modules; five
  new Go test files in steel-etl's site builder.
- **steel-etl site builder**: new leaf transforms `class_page.go` (landing header),
  `ability_table.go`, `search_boost.go`, `export_src.go` (single-line `sc-src`
  source-template island; the embed pass strips it from transclusions), and
  `sizeFacet` normalization in `bestiary_search.go`.
- **Shared UI contract**: per-card page actions live in the hover-revealed top-center
  control strip (documented in `DESIGN.md` → "Card header system") — the head grid's
  right column is off-limits.
- **Bestiary data seam**: `steel-bestiary-browser.js` republishes its parsed records
  as `window.SC_BESTIARY_ITEMS` (its mount destroys the JSON island).
- **Vendored**: `html-to-image` 1.11.13 (MIT) for the PNG export.
- **Docs**: v2 `.repo-docs` + `README`/`CLAUDE.md` refreshed and cold-start-tested;
  steel-etl `docs/site-builder.md` extended; DESIGN.md component rows; FOLLOWUPS #23
  (mobile sticky mini-header bulk) recorded; all 11 plans + the analysis stamped
  executed.
