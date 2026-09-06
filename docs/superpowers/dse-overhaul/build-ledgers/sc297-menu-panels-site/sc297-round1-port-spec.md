# SC-297 round 1 — port spec: the DSE chrome panel on the Compendium site

Worker: SC-297 round-1 design/survey worker. Worktree
`/home/scott/code/steelCompendium/worktrees/sc297-menu-panels-site`.
Prototype commit: `v2` `7613cbc879` on branch `sc297-menu-panels-site`.
Evidence: `shots/` beside this file (naming `sc297-r1-<page>-<scheme>-<state>.png`).

---

## Executive summary

1. The floating strip is **entirely client-mounted** — `steel-etl` emits no strip DOM at
   all, so this is a pure `v2` change; the only server-side artifacts the controls need are
   `<meta name="scc-permalink">` and the `<template class="sc-src">` island.
2. Five card families carry at least one control today (statblock, featureblock, ability,
   trait, kit), each with its **own** hover selector, its own `@media (hover:none)` and its
   own `@media print` rule — four hard-coded rem offsets and four duplicated behaviour
   contracts. The panel collapses all of that into one plate.
3. The strip is actively broken on ability cards: copy-link and pin resolve their
   `top` against **different anchors**, so they land in different rows and sit on top of the
   card name (`sc297-r1-ability-dark-before-hover.png`).
4. The port is a faithful transplant, not an approximation: option D geometry, E3 hairline
   crown, SC-189 `tuck`, right-to-left growth, `:focus-within`, touch/narrow reserved space,
   print-absent by construction. 53/53 measured assertions, both schemes, both families.
5. Rollout to the remaining three families is **two edits per family** (one selector, one
   frame-offset block) and needs no consumer changes at all.
6. One sanctioned change to an existing component: the ability card's `overflow: hidden` is
   relaxed on the panel-bearing card only (a plate seated outside the top edge cannot live
   inside a clipping box). Cost measured at 232 subpixels on a 70×70 corner crop at 4× DPR.
7. Two **pre-existing** defects the survey turned up, both on Read chapters, both unrelated
   to SC-297 and both reproduced on production — see §7.

---

## 1. Survey — how the current strip is built

### 1.1 The four consumers

Nothing is emitted server-side. `grep` over `steel-etl/internal/**/*.go` for
`sc-copylink|sc-pin|sc-enc-add|sc-export|sc-pageact` returns only comments in
`export_src.go` and `build.go` about the markdown-source template island. The strip is
100% mounted by page scripts.

| control | mount point (JS) | placement (CSS) | reveal |
|---|---|---|---|
| copy-link `.sc-copylink` | `scc-card-copy.js:92` → `.sb > .sb__head, .fb > .fb__head` else the card itself | `steel-copylink.css:59-65` — `left:50%` translated −50%; `[data-card=sb\|fb]` → `top:.45rem; left:calc(50% + 1.5rem)` translated −100%; ability → `top:.3rem` | `.sb-wrap:hover, .fb-wrap:hover, .sc-ability:hover, :focus-visible` |
| pin `.sc-pin` | `sc-pins.js:42-45` → `SCPageAct.cardHead()` else `SCPageAct.strip()` | `steel-pins.css:13-15` — `top:.45rem; left:calc(50% + 1.6rem)` | `.sb-wrap/.fb-wrap/.sc-trait/.sc-kit/.sc-ability:hover`, `:focus-visible`, `.is-on` |
| encounter-add `.sc-enc-addpage` | `sc-encounter.js:36` → `.md-content .sb-wrap .sb__head` (a **plain descendant** selector, unlike everything else), only when an EV chip parses (`:41`) | `steel-encounter.css:12-14` — `top:.45rem; left:calc(50% + 3.4rem)` | `.sb-wrap:hover`, `:focus-visible` |
| exports `.sc-export` (MD + PNG) | `sc-export.js:34` → the card's `.sc-head` else the card; needs `template.sc-src` | `steel-export.css:4-6` — `top:.45rem; left:calc(50% + 5.2rem)` | `.sb-wrap/.fb-wrap/.sc-kit/.sc-trait/.sc-ability:hover`, `:focus-within` |

**The four offsets are measured from four different anchors.** `.sc-head` (steel-cardhead.css)
never sets `position`, so each absolutely-positioned control resolves against the nearest
positioned ancestor — `.sb__head` / `.fb__head` (`position: relative`,
`steel-statblock.css:77`, `steel-featureblock.css:45`) for statblock and featureblock, but
the **card itself** (`steel-ability-cards.css:39`) for an ability card. That is why the
ability card's copy-link (`top:.3rem` from the card) and its pin (`top:.45rem` from the same
card, `left: 50%+1.6rem`) land in visibly different places and overlap the name. Before shot:
`shots/sc297-r1-ability-dark-before-hover.png`.

Each consumer also re-states the whole behaviour contract for itself: its own hover selector
list, its own `@media (hover: none) { opacity: .4 }`, its own `@media print { display: none }`.
Four copies of one rule, which is the maintenance cost the panel removes.

### 1.2 Which families carry the strip today

Main **card pages** only — the strict `h1:first-child + hr + <card>` adjacency
(`sc-pageact.js:16-18`), the same condition the CSS uses to hide the duplicate H1.

| family | copy-link | pin | encounter-add | exports |
|---|---|---|---|---|
| `.sb-wrap` statblock | yes | yes | yes (only with an EV chip) | yes |
| `.fb-wrap` featureblock | yes | yes | — | yes |
| `.sc-ability` ability card | yes | yes | — | yes |
| `.sc-trait` trait card | — | yes | — | yes |
| `.sc-kit` kit page | — | yes | — | yes |

Nested sub-features (`.sb__feat`, `.fb__feat`) and preview cards (`.sb-prev`) carry **no**
controls, by the card-page gate. Embedded cards inside Read chapters likewise get none —
the chapter is a plain page and gets `.sc-pageact` instead — **except** for the two leaks in
§7.

### 1.3 The plain-page strip `.sc-pageact`

`sc-pageact.js` is the shared seam: it owns the card-page discriminator (`cardHead()`) and
the strip factory (`strip()`, appended to `.md-content__inner`, never prepended, so the h1
keeps `:first-child`). `steel-pageact.css` makes it always visible, top-right, 1.7rem boxed
buttons, with **visual order fixed by CSS `order`** so mount order does not matter. That
`order` contract is the one piece of the existing design the panel adopts verbatim.

### 1.4 The plugin side — what the panel actually is

`draw-steel-elements` `src/framework/chrome/mountChrome.ts` + the "Element chrome" block at
`styles-source.css:14322`. The transplantable facts:

- The panel is `position: absolute` inside **the node carrying the visible card frame** (the
  plugin's `authoringAnchor()`), never inside the element root, or it floats in dead space.
- `right: calc(var(--dse-chrome-inset) - var(--dse-chrome-frame-border-right, 0px))`,
  `bottom: calc(100% + var(--dse-chrome-frame-border-top, 0px))`. The correction is the
  frame's **border width only** — an absolutely-positioned child is offset from the padding
  box, and a card's padding lies *inside* that box. (Round 1 of this port added the padding
  too and seated the ability plate 23px high; caught by measurement, fixed before commit.)
- `margin: 0 !important` — the card's own `> *` content gutter must never move the plate.
- `padding: 0 1px 1px` — a 1px bottom pad is the optical-centring correction for a plate with
  a top border and no bottom border.
- `border-bottom: 0`, radius on the top corners only: **the card's own hairline is the
  plate's floor**.
- E3 dark: `inset 0 1px 0 rgba(255,255,255,.22)`, `inset 0 -5px 6px -3px rgb(0 0 0/55%)`,
  `0 -3px 7px rgb(0 0 0/34%)`. Light retune: hairline to 100% white, top border deepened to
  `#a9b1b5`, tuck to 22%, cast to 15%.
- Buttons: flat, borderless, transparent, `min-width:1.7em; min-height:1.5em; height:auto;
  padding:.3em .35em`, muted until hovered. `box-shadow: none` and `height: auto` exist to
  beat Obsidian's host `button` rules — **not needed on the site**, which has no such host.
- Mobile: `opacity: 1` + `margin-top: 2.1em` reserved space on the element. Desktop reserves
  none.
- Print: unscoped `display:none` base; every revealing rule carries the print exclusion; the
  class names are additionally in the print hide-lists.

---

## 2. What round 1 shipped

New files:

- `v2/docs/javascripts/sc-chrome.js` — DOM only. `window.SCChrome.anchor()` /
  `.panel()`. No listeners, no `document$` subscription; `panel()` is lazy and idempotent.
- `v2/docs/stylesheets/steel-chrome.css` — geometry, material, depth, reveal, touch/narrow,
  print, and the re-grounding of the four consumer buttons.

Changed (one line of host resolution each, always with the old host as the fallback so an
unported family is untouched):

- `scc-card-copy.js:92`, `sc-pins.js:42`, `sc-encounter.js:59`, `sc-export.js:34`
- `mkdocs.yml` — `javascripts/sc-chrome.js` immediately after `javascripts/tablesort.js`
  (**must** precede every consumer), `stylesheets/steel-chrome.css` last in `extra_css`
  (it re-grounds declarations the consumer sheets make).

### DOM contract for consumers

```html
<card class="… sc-chrome-anchor">        <!-- the node carrying the visible card frame -->
  …
  <div class="sc-chrome" role="toolbar" aria-label="Card actions">
    <button class="sc-copylink">         order 1
    <button class="sc-pin">              order 2
    <button class="sc-enc-add …">        order 3
    <span   class="sc-export">…</span>   order 4
  </div>
</card>
```

A consumer does exactly one thing: `var host = (window.SCChrome && window.SCChrome.panel())
|| <its old host>;` then `host.appendChild(btn)`. It must **not** style its own placement —
`.sc-chrome > *` defaults to `order: 9`, and a new item gets a numbered `order` in
`steel-chrome.css`. Anything mounting into the plate must keep working when the plate is
absent (an unported family, a plain page), which the `||` fallback guarantees.

### Token mapping (`--dse-*` → site)

| plugin token | site counterpart | note |
|---|---|---|
| `--dse-chrome-inset: 10px` | `--sc-chrome-inset: 10px` | the one placement number, carried verbatim as a px |
| `--dse-surface-raised` | `--sc-chrome-surface`: `#232a2e` dark / `#f4f6f6` light | literals, not `--fx-card-bg` (which is a gradient); these are the solid mid-tones the card plates already resolve to (`--sb-plate-solid`) |
| `--dse-border` | `--sc-chrome-border`: `rgba(176,183,187,.3)` dark / `--md-default-fg-color--lightest` light | the dark value is `--fx-metal-line` softened; the raw token reads as a bright wire at plate scale |
| (E3's light deepened top edge `#a9b1b5`) | `--sc-chrome-border-top` | carried verbatim; light mode needs contrast, not brightness |
| `--dse-radius` | `--sc-chrome-radius: .4rem` | between the site's card radius (.6–.65rem) and its button radius (.35rem) |
| `--dse-bevel` (`inset 0 1px 0 rgba(255,255,255,…)`) | the site's `--fx-bevel` is the identical gesture; the plate uses E3's own 22%/100% values | material, not a token borrow |
| `--dse-fg-muted` | `var(--md-default-fg-color--light)` | resting glyph ink |
| `--dse-fg` (hover ink) | `var(--md-accent-fg-color)` | **deliberate divergence**: every site control accents on hover; matching the plugin's plain `--dse-fg` would make the panel the one control that does not |
| `--dse-hover` | `--sc-chrome-hover`: `rgba(255,255,255,.09)` dark / `rgba(0,0,0,.07)` light | |
| `--dse-touch-min` | `2.2em` min-width / `2em` min-height under `@media (pointer: coarse)` | |
| `Platform.isMobile` | `@media (hover: none)` **and** `@media (max-width: 30em)`, two separate blocks | the site has no platform API; the narrow arm also covers a desktop window narrowed to phone width |
| `--dse-chrome-frame-border-*` (measured in JS at mount) | `--sc-chrome-frame-top/right`, **declared per family in CSS** | the plugin cannot know its host's frame; here we author both sides, and a CSS declaration tracks rem-based prefs where a mount-time measurement would go stale |

Not ported, on purpose: `box-shadow: none` / `height: auto` on the buttons (they exist only
to beat Obsidian's `app.css` `button` rules), the collapsed one-liner and
`data-dse-collapsed` (open question 2), and `assertChromeHostLeak` (no host CSS to leak).

### The one existing-component change

`.md-typeset .sc-ability` is the framed card **and** clips (`overflow: hidden`, which keeps
the etched-watermark `::before`'s square corners inside the card's `.6rem` radius). A plate
seated outside the top edge cannot live inside a clipping box. Round 1 relaxes the clip on
the panel-bearing card only, and hands the watermark the card's own radius so the corners
stay round without the clip doing it:

```css
.md-typeset .sc-ability.sc-chrome-anchor { overflow: visible; }
.md-typeset .sc-ability.sc-chrome-anchor::before { border-radius: inherit; }
```

Scoped to `.sc-chrome-anchor`, so nested statblock features, kit signature cards and index
previews — all `.sc-ability` too — are untouched. **Measured cost:** an A/B of the card's
top-left corner (70×70 CSS px at 4× device scale, hovered, both schemes) moves 232 of 78,400
pixels, max channel delta 44/255 — a sub-pixel-width arc along the rounded corner, invisible
at 1×. It comes from `border-radius: inherit` giving `::before` the border-box radius on a
box that is inset by the 1px border. If zero movement is wanted, the exact-concentric form is
`border-radius: calc(.6rem - 1px)` in the same block, at the cost of duplicating the card's
radius literal. Recommendation: keep `inherit`.

`.fb-wrap`, `.sc-trait` and `.sc-kit` do **not** clip and need no such change (checked:
`steel-featureblock.css:37-48` puts the clip on the nested `.md-typeset.fb`, not on the
wrapper; `steel-traits.css:24-36` and `steel-kit.css:18-26` set no `overflow` on the card).

---

## 3. Rollout — file by file

**Per family, two edits and nothing else.**

1. `v2/docs/javascripts/sc-chrome.js` — add the family's selector to `FAMILIES`.
2. `v2/docs/stylesheets/steel-chrome.css` → "PER-FAMILY FRAME OFFSETS" — add its
   `--sc-chrome-frame-top/right` block (its own **border** widths), plus a clip relaxation
   only if the card node clips.

Ready-to-apply values for the three remaining families:

| family | selector | `--sc-chrome-frame-top` | `--sc-chrome-frame-right` | clip relaxation | controls it will host |
|---|---|---|---|---|---|
| featureblock | `.fb-wrap` | `0px` | `0px` | none (unframed wrapper; `.md-typeset.fb` carries the frame and the `overflow: clip`, and is not the anchor) | copy, pin, export |
| trait | `.sc-trait` | `1px` | `1px` | none | pin, export |
| kit | `.sc-kit` | `1px` | `1px` | none | pin, export |

No consumer script changes are needed for any of them — `SCChrome.panel()` already resolves
whatever family is first in `FAMILIES` on the page, and each consumer already prefers it.

Two follow-on items that are *not* per-family:

- Once every family is ported, the four legacy placement blocks become dead code and should
  be deleted in the same change: `steel-copylink.css:54-65`, `steel-pins.css:9-30`,
  `steel-encounter.css:10-21`, `steel-export.css:1-16`. Deleting them earlier would strand
  the un-ported families.
- `steel-export.css:29-33`'s `.sc-export-shooting` hide-list has a twin in
  `steel-chrome.css` (`.sc-export-shooting .sc-chrome`) so PNG card exports never capture the
  plate. Keep the two in sync, or fold the list into one sheet at the end of the rollout.

---

## 4. Gates

**Nothing existing breaks.** No unit test and no e2e spec asserts anything about the strip
(`grep -l 'sc-pin\|sc-copylink\|sc-enc\|sc-export' tests/` matches only `cardhead-mobile`
and `statblock-band`, and in both only on `.sc-head__*` slot classes).

- v2 unit suite: **78/78 pass before, 78/78 after** (`node --test tests/*.test.js`).
- e2e run against the local build of the prototype: `cardhead-mobile`, `page-titles`,
  `featureblock`, `statblock-band`, `statblock-featstyle`, `nav-drawer-keep` **pass**;
  `featureblock-fixture` and `settings-panel` **fail, pre-existing** — both reproduce
  identically against `https://steelcompendium.io/v2/` (see the report's gate section).
- `tests/e2e/capture-statblock-golden.cjs` is a manual capture tool for the retired
  `steel-statblock.js`, not a gate. It re-captures an island render, not `.sb-wrap`, so the
  plate does not enter it — but if it is ever re-run, check the output for `sc-chrome`.

**New gate the rollout should add** — the site twin of the plugin's `assertChromePlacement`,
which exists because jsdom computes no layout and this contract is geometric. Round 1's
version is written, passing, and parked beside this file at
`sc297-round1-chrome-panel.e2e.cjs` (53 assertions; edit `BASE`/`PAGES` to the repo's
`E2E_BASE` convention); it should land as `v2/tests/e2e/chrome-panel.e2e.cjs` and assert,
per family × scheme:

- right gap = `10.00 ± 0.6px` from the card's border-box right edge;
- bottom delta = `0.00 ± 0.6px` against the card's border-box top;
- `border-bottom-width: 0`;
- `opacity: 0` at rest, `1` on card hover, `1` on `:focus-within`;
- no control left behind in the card head;
- `display: none` under `@media print`;
- at 375px: `opacity: 1`, anchor `margin-top ≥ 2.1em`, and the same geometry.

---

## 5. Measured results (prototype, both schemes, both families)

53/53 assertions pass. Highlights, in prose because the differences are geometric, not
chromatic:

| | statblock `.sb-wrap` | ability `.sc-ability` |
|---|---|---|
| right gap from the card's visible right edge | 10.00px | 10.00px |
| plate bottom vs the card's border-box top | 0.00px | 0.00px |
| resting opacity / hovered / focus-within | 0 / 1 / 1 | 0 / 1 / 1 |
| print | `display: none` | `display: none` |
| 375px: always visible, reserved space | yes, `margin-top` 39.9px | yes, `margin-top` 33.6px |
| 375px: clearance above the previous element | 134.9px | 96.0px |

Functional round-trip through the plate (clicked in Brave): copy-link flashes "Copied"; pin
toggles `aria-pressed` and writes `localStorage["sc-pins"]`; encounter-add writes a pick to
`localStorage["sc-encounter"]`; MD export flips to a checkmark. The plate's right edge stays
at 10.00px as items are added — it grows leftward, as specified.

---

## 6. Open questions for Scott

Each leads with a recommendation and one line of reasoning.

**Q1 — Scope: every family that carries a control today, or statblocks first?**
**Recommend: all five** (statblock, featureblock, ability, trait, kit) in round 2.
*Reasoning:* the panel is meant to be the **only** per-card affordance surface; shipping it
on two of five leaves three cards with a floating strip and doubles, rather than removes,
the number of places a future action can go. The per-family cost is two declarations.

**Q2 — Does the site panel get the DSE collapse toggle (the rightmost anchor)?**
**Recommend: no.** *Reasoning:* in the plugin, collapse solves note density — many elements
stacked in one note; a Compendium card page is *one* card, so collapsing it leaves a blank
page with a lone chevron. Revisit only if the panel ever ships on embedded cards inside Read
chapters (Q4), which is the only place on the site where density is the problem collapse
solves. The plate is built right-anchored, so the toggle can be added later as `order: 8`
without moving anything else.

**Q3 — The plain-page `.sc-pageact` strip: leave as is, or restyle to the same plate?**
**Recommend: leave as is.** *Reasoning:* E3's material is inseparable from its geometry — no
bottom border and square bottom corners, *because the card's own hairline is the plate's
floor*. A plain page has no card edge for the plate to sit on, so copying the material there
produces a plate that reads as broken rather than as a matching one. If the two tiers should
read as one system, the cheap move is to align the *glyphs* (flat, borderless, muted-until-
hovered) rather than the plate.

**Q4 — Embedded cards inside Read chapters: panel on each, or only on card pages?**
**Recommend: only on card pages, this round; file the rest separately.** *Reasoning:* an
embedded card has no identity of its own on the page today — copy-link reads the *page's*
`<meta name="scc-permalink">`, and the pin reads `location.pathname` — so a per-card panel
would need per-card SCC codes plumbed into the embed, which is a content-pipeline change, not
a CSS one. It is also where the two live bugs in §7 are.

**Q5 (new) — Sanction the ability card's clip relaxation?**
**Recommend: yes, as written (`overflow: visible` + `border-radius: inherit`, scoped to the
panel-bearing card).** *Reasoning:* the alternative that avoids it is wrapping the card in a
new element, which breaks four `.md-typeset > .sc-ability` adjacency contracts (the H1-hide
CSS, `sc-pageact.js`'s discriminator, `sc-export.js`'s `cardNode()`, `scc-card-copy.js`'s
parent gate) for a 232-subpixel corner difference.

**Q6 (new) — The card hover-lift.** `.md-typeset .sc-ability:hover` lifts the card
`translateY(-2px)`; the plate is a child, so it lifts with the card. **Recommend: leave it.**
*Reasoning:* they read as one object, which is exactly what `tuck` is for — but it is a
visible 2px difference from the plugin, where nothing moves, so it should be a decision
rather than an accident.

**Q7 (new) — The statblock level scaler is now the only hover-revealed control left in the
head.** The −/+ steppers stay inside the Level chip (brief: do not touch). **Recommend:
leave for now, revisit after the rollout.** *Reasoning:* it is the sanctioned exception in
DESIGN.md and it is *typographic* (it edits the chip it lives in), not a page action; but
with the strip gone it is the last thing that appears on hover inside the card, so it now
reads as an orphan rather than as one of a row — worth a look with Scott's eyes on the
after shot (`sc297-r1-statblock-dark-after-hover.png`, the two boxed −/+ buttons left of
"LEVEL 3").

---

## 7. Pre-existing defects found in the survey (not SC-297's; both reproduce on production)

**D1 — the encounter "+" chip mounts on an arbitrary embedded statblock in a Read chapter.**
`sc-encounter.js:36` selects `.md-content .sb-wrap .sb__head` — a plain descendant selector,
where every other control uses the strict card-page adjacency. Measured on
`/Read/bestiary/retainers/`: 21 `.sb-wrap` elements on the page, one `.sc-enc-addpage`
mounted on the head of the *first* of them. So a reader on a chapter page sees an "add to
encounter" chip that silently adds whichever creature happens to be printed first.

**D2 — the copy-link mounts on an embedded card in a Read chapter and copies the chapter's
permalink.** `scc-card-copy.js` gates on `card.parentElement.classList.contains("md-typeset")`,
which an embedded card in a chapter satisfies. Measured on the same page: one `.sc-copylink`,
on an embedded card, whose title/URL come from the page-level `<meta name="scc-permalink">`.

Both should become Backlog tickets. The fix for each is the same one line: use
`SCPageAct.cardHead()`'s strict discriminator (or `SCChrome.anchor()`) instead of a
descendant selector.
