# v2 Site UX Analysis & Feature Proposals — 2026-07-01

Session artifact: full UX review of https://steelcompendium.io/v2/ driven with a real
browser (Brave via playwright-core) at desktop (1440×900) and mobile (390×844) viewports,
plus a read-through of `v2/` config, `.repo-docs/`, ROADMAP and FOLLOWUPS. Focus per user
request: **usefulness for reading the Draw Steel rules and as a reference at/away from the
table**, navigation quality ("difficult to navigate" was the common complaint on the old
site), and candidate new features at any complexity level.

---

## 1. What's working well (lock these in)

- **Performance is no longer a problem for Browse.** Typical Browse pages are 8–35 KB wire
  (48–330 KB decoded); instant-nav click between leaf pages measured **149 ms**. The old
  ~31 s render pathology is gone (link previews disabled, ROADMAP #1). First-load cost is
  dominated by the **1.18 MB search_index.json** (see §3.5).
- **The three-mode IA (Browse / Books / Bestiary) is sound** and matches real use cases:
  lookup, cover-to-cover reading, encounter prep. The home page explains it in one screen.
- **Leaf cards are excellent.** Ability cards (Brutal Slam), statblocks (Goblin Warrior),
  kit cards — clear hierarchy, power-roll tier bands, role-colored statblock chrome,
  keyword chips, source+printing stamp on every page. This is better presentation than any
  competing SRD site.
- **The statblock sticky mini-header** (name + stats + movement pinned while scrolling) is
  a standout at-the-table feature.
- **Dense SCC cross-linking** in rules prose (the Grabbed page links speed, force moved,
  size, teleport…) makes rules chase-downs fast. Copy-permalink on cards/headings with
  stable `/scc/...` URLs is exactly what content creators need; redirects resolve fast.
- **Search coverage is right**: the `rule.*` glossary means table-reference terms
  (victories, respite, hero token, flanking) hit their definition page first. Read-tab
  exclusion successfully avoids duplicate results, and chapter prose is still reachable
  because its entities exist in Browse.
- **Settings drawer** (text/card scale, compact mode, page width, statblock/featureblock
  zone toggles, fonts) is a serious power-user feature. Print stylesheet outputs a clean,
  chrome-free statblock.
- **Mobile fundamentals work**: drawer drill-down nav, stacked filters, readable cards
  (except §2.1).

## 2. Defects found (fix before new features)

### 2.1 Statblock name column collapses on mobile — HIGH
On 390 px, the `.sc-head` left-primary slot gets squeezed by the right-primary
("HORDE HARRIER") until the monster name wraps **letter-by-letter vertically**
("GO BLI N W AR RI OR"). Every statblock page is affected on phones — and phones at the
game table are a primary consumer. Fix: stack the head slots (right-primary drops under
left-primary) below a width breakpoint, or `min-width`/`flex-basis` guard the left slot.
Evidence: screenshot `31-statblock-mobile.png` (session scratchpad).

### 2.2 Page titles (H1) hidden on any page containing a top-level ability card — HIGH
`steel-ability-cards.css:215` — `.md-typeset:has(> .sc-ability) > h1:first-child
{ display: none; }` (and sibling rules in steel-kit/statblock/featureblock css) is meant
for single-card leaf pages where the card head replaces the title. But it over-matches
**every page whose typeset has a direct-child `.sc-ability`**:
- **Browse class pages** (e.g. `/Browse/class/fury/`) have **no visible title at all** —
  the page opens with unanchored prose; breadcrumb stops at "Classes".
- **Read chapter pages** (e.g. `/Read/heroes/classes/` — `<h1 id="classes">` computed
  `display:none`) lose their chapter title.
Statblock/kit/featureblock leaves are fine (their card re-renders the name); class and
chapter pages have no replacement head, so the title is simply lost. Fix: scope the hide
rule to pages where the card is the *only/first* content (e.g. `> .sc-ability:first-child
+ nothing-else` pattern is impossible in CSS — instead have steel-etl stamp leaf pages
with a body class like `sc-leaf--card`, or hide only when `h1 + .sc-ability` are adjacent:
`.md-typeset > h1:first-child:has(+ .sc-ability)`).

### 2.3 Bestiary "Size" filter chips leak terrain text — MEDIUM
The Size chip row on `/Bestiary/` contains real sizes (1S, 1M, 2, …) plus free-text
dynamic-terrain values rendered as chips: "any area; the area can't be moved through",
"one or more squares of difficult terrain", "the area of the corridor to be blocked".
Fix in the chip-vocabulary builder: whitelist canonical sizes; bucket terrain
area-descriptions under an "Area" chip (or omit Size for terrain).

### 2.4 Bare 404 page — LOW (cheap win)
`/v2/<anything-wrong>/` renders just "404 - Not found". With 3,500+ deep URLs shared in
Discord/blogs, a custom 404 (override `404.html`) with a search box, links to
Browse/Books/Bestiary, and a "report a bug" link would recover lost visitors.

### 2.5 Search result duplicates — LOW
Queries like "victories" list the same page 3–4× (page + section anchors). Material's
grouping usually folds these; worth checking whether the card-generated heading structure
defeats it. Cosmetic but visible on almost every search.

### 2.6 Leftover `index_old` pages are live — LOW
`/Browse/index_old/` (and `static_content/docs/Browse/index_old.md`) is published and
search-indexed. Delete or exclude.

### 2.7 Search ranking: monsters outrank the thing itself — LOW/MEDIUM
"fury" → four **Rival Fury** statblocks above the Fury class; "jump" → War Dog Blood
Jumper above the Jump movement rule. Consider `search.boost` frontmatter (Material
supports per-page boost) emitted by steel-etl: classes/rules/conditions get >1, monster
statblock pages slightly <1. Cheap, data-driven, big perceived-quality win.

## 3. Navigation & IA improvements (the "difficult to navigate" axis)

### 3.1 Class pages are a wall — give them a landing header + local nav
`/Browse/class/fury/` is **82,000 px tall** with no visible title (§2.2), no on-page
overview, and the right-hand TOC as the only map. A reader clicking "Fury" gets prose
mid-thought. Proposal: steel-etl emits a **class landing header card** (name, heroic
resource, role summary, echelon table links) + a horizontal in-page jump bar
(Basics · 1st-Level · Abilities-by-level · Subclasses · Advancement Table). The unified
6-slot card head contract already exists — this is "renderCardHead for class pages".

### 3.2 Read chapters need a reading experience, not just a dump
`/Read/heroes/classes/` is 2.4 MB decoded, 43,862 DOM nodes, **677,000 px tall**, ~5 s to
domInteractive, with a 601-item flat TOC. Book-faithful is the right *content* decision,
but the *navigation* around it is under-built:
- **Prev/next chapter links** at top+bottom of each chapter (Material's built-in
  footer nav may already do bottom; verify + add top).
- **A "chapter contents" collapsible mini-TOC at the top of the page** (h2/h3 only), so
  readers see the chapter's shape before 600 screens of scroll.
- **Reading-position restore**: the site already has reading-progress.js; persist
  scroll position per chapter in localStorage and offer "resume where you left off".
- Longer term: consider splitting only the two outlier chapters (classes, monsters-lore
  equivalents) at h2 into sub-pages with stitched prev/next, keeping book order. This is
  the ROADMAP #1 lever 2 decision; everything else above works without it.

### 3.3 Ability index pages hide the goods behind level buckets
`/Browse/feature/ability/fury/` shows eight "LEVEL N — count" cards; you can't see a
single ability name without another click, and there are 9 classes × ~8 levels of this.
Proposal: replace (or augment) level-bucket cards with a **single sortable/filterable
table per class**: Name · Level · Cost · Action type · Distance · Keywords, each row
linking to the leaf. This one page becomes the class-play reference. (The Search & Filter
mount machinery from Features/Bestiary can be reused with a per-class pre-filter.)

### 3.4 Cross-tab context links
- On every Browse leaf, add a small "Read in book context →" link (SCC → Read anchor);
  reverse of the existing browse-in-context idea and pairs with ROADMAP #3 (in-page
  anchors). And on Read chapters, section headings could link to the Browse leaf ("open as
  card").
- FOLLOWUPS #15 (companion/fixture → owning class back-link) is the same family; do them
  together as an "origin/context strip" under the card head.

### 3.5 First-load weight: prebuild/split the search index
The 1.18 MB search_index.json is by far the largest asset and is paid on first page of
every session (then cached). Options in order of cheapness: enable search prebuild if the
plugin version supports it; strip Read-excluded content (already done) and check whether
`rule.*`/statblock boilerplate (usage-cell text, tier lines) can be excluded from the
index body; consider `lang`+separator tuning. Target <500 KB.

### 3.6 Small nav polish
- Sidebar shows both "Browse" (section) and a "Browse Rules" child pointing to the same
  index — drop the duplicate child.
- Breadcrumb on hidden-title pages stops one level short (fixes itself with §2.2).
- Home page: brand mismatch "Xentis' Draw Steel Compendium" (H1) vs "Steel Compendium"
  (header). Pick one; also consider making the home hero a **search box** ("What do you
  need to look up?") since lookup is the #1 use.
- The "Data Formats" section (long legacy-repo list) dominates the home page's second
  screen; collapse the legacy repos into a `<details>` so players aren't reading a
  data-engineering changelog.

## 4. Feature proposals

Ordered roughly by (value at the table) ÷ (effort). Each is self-contained.

### 4.1 Encounter builder (EV budget tracker) — the killer app — L
The Bestiary Search & Filter already has every ingredient (type/role/org/level/EV facets
over 555 entries). Add a client-side **encounter tray**: "+" button on each result row
and statblock page; a pinned tray showing picked monsters × counts, summed EV vs. a party
budget input (hero count × echelon per the Monsters book formula); localStorage persist;
share via URL query (`?enc=goblin-warrior:4,goblin-monarch:1`); print view = all
statblocks in encounter order. No backend needed. This turns the site from "reference I
read" into "tool I run my session from", and no other Draw Steel resource does it well.

### 4.2 Dynamic statblock scaler (the user's EV-slider idea) — M/L
On statblock pages, a small "scale" control: level ± slider that applies the Monsters
book's monster-scaling guidance (adjust stamina/damage/potencies per level delta) with a
clear "house-rule preview, not RAW" banner. Client-side only — statblock data is already
structured (frontmatter/JSON in data-unified). Pairs with 4.1 (scale inside the tray).
Prereq: expose the statblock's structured stats as a JSON island again *or* read from the
SCC API endpoint. Design the math once against the book's "adjusting monsters" section.

### 4.3 "My table" pinboard (bookmarks) — S/M
A star/pin icon on every card head; pinned codes live in localStorage; a `/pins/` page
renders their preview cards (the `.sb-prev`/card-embed machinery exists). Players pin
their class abilities + kit; directors pin tonight's monsters/terrain. Zero backend,
huge session-time value, and it exercises the SCC registry as the pin key — which is
exactly what SCC is for.

### 4.4 Export buttons on cards — S/M each
Card-head actions next to copy-permalink:
- **Copy as Markdown** (fetch the SCC-coded md from data-unified raw GitHub, or embed a
  `<template>` island at build time).
- **Download as image (PNG)** for Discord/VTT handouts — client-side via a canvas
  rasterizer; scope to ability cards + statblocks first. (Heavier: consider
  `satori`/`html-to-image` at build time for zero-JS downloads.)
- **Copy as DSE YAML** for Obsidian users (data already exists in dse format).

### 4.5 Dice + power-roll affordance — S
Tier bands already visualize ≤11 / 12–16 / 17+. Add a click-to-roll on the power-roll
header (2d10 + modifier, animate the matching tier highlight). Pure client JS, obvious
delight feature at the table, no data change. Include a "roll with edge/bane" toggle to
teach the core mechanic.

### 4.6 Rules quick-reference sheet — S
One static page (`/reference/`): turn structure, action types, conditions one-liners
(linking to full pages), power-roll outcomes, common maneuvers table — the GM-screen
page. Content is a curated static_content page assembled from existing `rule.*` entities;
make it print-perfect. Candidate to also be the Home hero's second CTA ("Table Reference").

### 4.7 Random tables / generators — S each
"Random complication", "random career/culture inspiration", NPC quick-name from the
cultures chapter. Each is a button on the respective index page over data that's already
in the search mounts. Cheap, fun, drives Browse discovery.

### 4.8 Character builder — XL (defer; spec first)
Full hero builder (ancestry→culture→career→class→kit picks, choices validated, output =
printable sheet + JSON). All picks are SCC-coded entities already, so the data layer is
ready; the UI + rules-legality engine is the big cost, and MCDM's own tools may land
here. Recommendation: **don't** build the interactive builder yet; instead ship 4.3
(pins) + a "level-N shopping list" view per class (what you choose at each level, as a
checklist) as the 20%-effort/80%-value stand-in, and fold full builder plans into the
homebrew/Phase-6 era.

### 4.9 Homebrew statblock builder — defer to Phase 4.4/6
The user's custom-statblock idea is real but belongs with the homebrew content spec
(ROADMAP #10 Phase 4.4): a form that emits SCC-conformant annotated markdown/JSON (using
the existing schemas) would double as the reference implementation for third-party
publishers. Sequence it after the schema work, not as a site one-off.

## 5. Suggested sequencing

1. **Bug batch (days):** §2.1 mobile statblock head, §2.2 H1 hiding, §2.3 size chips,
   §2.4 custom 404, §2.6 index_old, §3.6 nav polish.
2. **Navigation batch (week):** §3.1 class landing header + jump bar, §3.2 chapter
   mini-TOC + prev/next + resume, §3.3 per-class ability table, §2.7 search boosts.
3. **Table-tools batch (weeks, in order):** 4.6 quick reference → 4.3 pins → 4.1
   encounter builder → 4.5 dice → 4.4 exports → 4.2 scaler.
4. **Era 3:** 4.8/4.9 alongside the homebrew spec.

## Appendix: measurements (2026-07-01, live site)

| Page | Wire | Decoded | DOM nodes | Load |
|---|---|---|---|---|
| Home | 9 KB | 34 KB | 580 | 0.7–3.5 s (first) |
| Browse index | 12 KB | 62 KB | 801 | 1.6 s |
| Class: Fury | 34 KB | 330 KB | 5,851 | 1.5 s (82k px tall) |
| Feature index | 116 KB | 594 KB | 28,137 | 2.3 s |
| Bestiary S&F | 20 KB | 139 KB | 7,241 | 0.8 s |
| Goblin Warrior | 11 KB | 92 KB | 978 | 0.9 s |
| Read: Classes ch. | 257 KB | 2,473 KB | 43,862 | ~5 s (677k px tall) |
| search_index.json | 1,177 KB | — | — | first load each session |

Instant-nav leaf→leaf: 149 ms. SCC redirect `/scc/…/class/fury/` → Browse in <300 ms.
Search: "grabbed"→condition first; "fury"→4 rival statblocks before the class; "victories"
→ rule page ×4 duplicates. Screenshots in session scratchpad `shots/` (not persisted).
