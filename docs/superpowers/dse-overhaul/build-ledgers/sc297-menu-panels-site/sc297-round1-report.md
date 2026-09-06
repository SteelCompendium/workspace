# SC-297 round 1 — survey + prototype report

## Executive summary

1. **Verdict: the port works and is a faithful transplant, not an approximation** — option D
   geometry, E3 hairline crown, SC-189 `tuck`, right-to-left growth, `:focus-within`,
   touch/narrow reserved space, print-absent by construction.
2. Shas: `v2` rebased at `f9347707dd` (already at the cut, no-op), prototype committed at
   **`7613cbc8798769bc20be51c9affa3ac0d4a56f41`**; `steel-etl` `093da2980c` (untouched);
   `draw-steel-elements` `c2a5cec7fe` (read-only, untouched).
3. Gates: v2 unit **78/78 pass before, 78/78 after**. e2e 6/8 pass; the 2 failures
   (`featureblock-fixture`, `settings-panel`) are **pre-existing** and reproduce identically
   against production.
4. New measured gate written for the geometry: **53/53 assertions pass**, both families,
   both schemes, desktop + 375px + print. Right gap 10.00px, bottom delta 0.00px.
5. Deciding shots: `shots/sc297-r1-ability-dark-before-hover.png` (the strip overlapping the
   card name today), `shots/sc297-r1-statblock-dark-after-hover.png` (the plate, head clean),
   `shots/sc297-r1-ability-light-after-join.png` (the join, hairline unbroken beneath).
6. Q1 scope — recommend all five families in round 2 (two declarations each).
7. Q2 collapse toggle — recommend no: a card page is one card; collapsing it leaves a blank page.
8. Q3 `.sc-pageact` — recommend leave as is: E3's material needs a card edge to sit on.
9. Q4 embedded cards — recommend card pages only; embedded cards have no per-card identity yet.
10. Q5–Q7 new: sanction the ability card's clip relaxation; keep the card hover-lift carrying
    the plate; re-look at the now-orphaned level scaler after the rollout.

Full port plan, token mapping, family table, DOM contract and per-question reasoning:
**`sc297-round1-port-spec.md`** beside this file.

---

## 1. What was produced

| artifact | path |
|---|---|
| port spec (the deliverable for round 2) | `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/sc297-round1-port-spec.md` |
| geometry/behaviour gate (53 assertions, passing) | `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/sc297-round1-chrome-panel.e2e.cjs` |
| screenshots (42) | `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/shots/` |
| prototype commit | `v2` `7613cbc879` on branch `sc297-menu-panels-site` |

New source files in the prototype:
`v2/docs/javascripts/sc-chrome.js`, `v2/docs/stylesheets/steel-chrome.css`.
Changed: `scc-card-copy.js`, `sc-pins.js`, `sc-encounter.js`, `sc-export.js`, `mkdocs.yml`
(one host-resolution line each, plus the two asset registrations).

---

## 2. Survey findings (condensed — detail in the spec, §1)

- **`steel-etl` emits no strip DOM.** A grep of `internal/**/*.go` for
  `sc-copylink|sc-pin|sc-enc-add|sc-export|sc-pageact` returns only comments about the
  `<template class="sc-src">` markdown island. SC-297 is a pure `v2` change.
- **Four consumers, four hard-coded rem offsets, four duplicated behaviour contracts.**
  copy-link `left:50%`, pin `+1.6rem`, encounter-add `+3.4rem`, exports `+5.2rem`; each
  consumer restates its own hover list, its own `@media (hover:none){opacity:.4}` and its own
  `@media print{display:none}`.
- **The offsets are measured against different anchors.** `.sc-head` never sets `position`,
  so a control resolves against `.sb__head`/`.fb__head` on a statblock/featureblock but
  against the **card itself** on an ability card. That is the visible defect in
  `sc297-r1-ability-dark-before-hover.png`.
- **Five families carry a control today** (statblock: all four; featureblock and ability:
  copy+pin+export; trait and kit: pin+export). Nested sub-features and preview cards carry
  none. Embedded cards in Read chapters carry none *by design* — with two exceptions that
  are live bugs (§5).
- **`.sc-pageact` is the page-tier sibling** and already owns the two patterns the panel
  reuses: a shared card-page discriminator, and visual order fixed by CSS `order`.
- **Plugin side:** the panel's correction term is the frame's **border width only** — a
  padding-box-relative offset already sits inside the card's padding. Round 1 of this port
  initially added the padding too and seated the ability plate 23px high; caught by
  measurement, fixed before commit.

---

## 3. Screenshots — captions

All shots 2× device scale, Brave via `playwright-core`, viewport 1280×1000 (phone shots
375×820, `isMobile`). Colours named in prose (Scott is colourblind).

### Before (clean rebased tree, `f9347707dd`)

| file | caption |
|---|---|
| `sc297-r1-statblock-dark-before-hover.png` | **Dark, statblock, hovered.** Minotaur Sunderer. Five controls float inside the head band, centred: a link glyph, a pushpin, a plus, and two lettered chips (MD, PNG), each in its own dark boxed chip with a pale grey hairline. They sit in the same row as the level scaler's two boxed −/+ buttons and the "LEVEL 3" chip, so seven boxes crowd one line. The head's blue-grey gradient band and the pale-blue "ELITE BRUTE" mini-title are below/right. |
| `sc297-r1-statblock-light-before-hover.png` | Same, light scheme: near-white page, the same five boxed chips read as dark fills on the pale blue head band — heavier than anything else in the header. |
| `sc297-r1-statblock-*-before-rest.png` | Same framing, cursor away: all five chips at zero opacity; only the level scaler's −/+ are also gone. Head is clean. |
| `sc297-r1-ability-dark-before-hover.png` | **Dark, ability card, hovered — the deciding "before".** Dragon Breath. The link glyph sits high and centred, *above* the name row; the pushpin sits lower and to its right, printed **on top of the word "BREATH"**; MD and PNG sit further right, level with "SIGNATURE". Three groups, three vertical positions, one of them colliding with the card name. |
| `sc297-r1-ability-light-before-hover.png` | Same collision in light scheme; the dark chips over near-black text on white make the overlap more legible, not less. |
| `sc297-r1-*-before-phone.png` | 375px. Controls persist at 40% opacity (the `@media (hover:none)` arm) in the same centred positions; on the ability card the pin still overlaps the name. |
| `sc297-r1-*-before-print.png` | Print media. All controls absent (each sheet's own `@media print`). |
| `sc297-r1-*-before-join.png` | Tight crop of the card's top-right corner: nothing above the card's top border; the strip is inside the head. |

### After (prototype, `7613cbc879`)

| file | caption |
|---|---|
| `sc297-r1-statblock-dark-after-hover.png` | **Dark, statblock, hovered — the deciding "after".** One plate sits *above* the card's top edge, right-anchored, its right edge 10px inside the card's visible right edge. Four flat glyphs on it, left to right: link, pushpin, plus, then MD and PNG as small letterforms — no per-button boxes, the plate is the frame. The head band below is now empty of page controls; only the level scaler's −/+ and the "LEVEL 3" chip remain in the rail. |
| `sc297-r1-statblock-light-after-hover.png` | Same, light: the plate is a near-white panel with a deepened grey top edge and a soft shadow rising off the card into it. |
| `sc297-r1-ability-dark-after-hover.png` | **Dark, ability card, hovered.** The plate carries link, pushpin, MD, PNG (this family has no encounter-add). "DRAGON BREATH" is fully legible — the collision is gone. |
| `sc297-r1-ability-light-after-hover.png` | Same, light scheme. |
| `sc297-r1-*-after-rest.png` | Cursor away: the plate is at zero opacity and the card is byte-for-byte the card it was — no reserved space, no gap, nothing above the top border. |
| `sc297-r1-statblock-dark-after-join.png` | **Tight crop of the plate/card join, dark.** The plate's bottom edge lands exactly on the card's top border; a soft dark gradient rises ~5px off the border line into the plate (the `tuck` inset), so the card reads as sitting in front. The card's own hairline runs unbroken beneath the whole plate. A bright hairline runs along the plate's top lip. |
| `sc297-r1-ability-light-after-join.png` | **The same join in light.** The plate's top edge is a distinctly darker grey than the plate face (contrast carrying the light catch, per E3's light retune); the cast shadow is much lighter than in dark. The card's top hairline is continuous under the plate. |
| `sc297-r1-*-after-phone.png` | 375px. The plate is always visible at full opacity, and the card has reserved 2.1em of top space so the plate covers nothing above it (measured clearance: 134.9px statblock, 96.0px ability). Head content stacks into one column as usual. |
| `sc297-r1-*-after-print.png` | Print media. The plate is absent, and the card renders exactly as before — reserved space is inside `@media screen`, so paper is unchanged. |
| `sc297-r1-ability-dark-after-cornerAB-relaxed.png` / `-clipped.png` | **The clip-relaxation A/B.** Two 70×70px crops at 4× of the ability card's top-left rounded corner, hovered — left with SC-297's `overflow: visible`, right with the card's original `overflow: hidden` forced back on. Visually identical; the numeric difference is 232 of 78,400 pixels, max channel delta 44/255, along a sub-pixel-width arc on the corner. |

---

## 4. Gate results

**Unit (v2, `node --test tests/*.test.js`)**

| | tests | pass | fail | exit |
|---|---|---|---|---|
| before (clean `f9347707dd`) | 78 | 78 | 0 | 0 |
| after (`7613cbc879`) | 78 | 78 | 0 | 0 |

**e2e (`tests/e2e/*.e2e.cjs`, Brave, local build of the prototype)**

| spec | result | note |
|---|---|---|
| `cardhead-mobile` | PASS | the card-head spec the brief called out; the panel's `margin-top` does not touch the name track |
| `page-titles` | PASS | |
| `featureblock` | PASS | |
| `statblock-band` | PASS | |
| `statblock-featstyle` | PASS | |
| `nav-drawer-keep` | PASS | |
| `featureblock-fixture` | FAIL — **pre-existing, not a defect and not an asserted-layout change** | times out waiting for `.fb-wrap` at `Browse/fixture/undead/barrow-gates/`; that path 404s in a build made from the *unmodified* `docs/` tree (`site/Browse/` has no `fixture/` directory). Reproduced identically against `https://steelcompendium.io/v2/` (`exit=2`, same locator timeout). |
| `settings-panel` | FAIL — **pre-existing** | 3 of 21 checks: `card: css var = 0.7`, `card: stored = 0.7`, `card: label = 70%`, each got `0.8`. The spec drives the card-size slider to 0.7, but `settings-core.js:23` declares `CARD_MIN = 0.8` and clamps — a stale spec against a since-narrowed range. `settings-core.js`/`settings-panel.js` are untouched by this commit. Reproduced identically against production (`3 CHECK(S) FAILED`). |

No e2e spec asserts anything about the strip: `grep -l 'sc-pin\|sc-copylink\|sc-enc\|sc-export'`
over `tests/` matches only `cardhead-mobile` and `statblock-band`, and in both only on
`.sc-head__*` slot classes. So **no assertion was legitimately invalidated by the prototype.**

**New geometry gate (written this round, `sc297-round1-chrome-panel.e2e.cjs`): 53/53 PASS.**
Per family × scheme × {desktop, 375px, print}: right gap `10.00px` from the card's border-box
right edge; bottom delta `0.00px` against its border-box top; `border-bottom-width: 0`;
opacity 0 at rest / 1 on card hover / 1 on `:focus-within`; nothing left behind in the card
head; `display: none` under print; at 375px always visible with `margin-top` 39.9px
(statblock) / 33.6px (ability) and the same geometry.

**Functional round-trip through the plate** (clicked in Brave): copy-link flashes "Copied";
pin toggles `aria-pressed` and writes `localStorage["sc-pins"]`; encounter-add writes a pick
to `localStorage["sc-encounter"]`; MD export flips to a checkmark. The plate's right edge
stays at 10.00px as items are added — it grows leftward.

---

## 5. Open questions

Verbatim recommendations and reasoning are in `sc297-round1-port-spec.md` §6. One line each:

1. **Scope** — all five families in round 2 (two declarations each); two-of-five doubles the
   number of places an action can live instead of removing them.
2. **Collapse toggle** — no; a card page is one card, so collapsing leaves a blank page. The
   plate is right-anchored, so it can be added later without moving anything.
3. **`.sc-pageact`** — leave as is; E3's material (no bottom border, square bottom corners)
   only makes sense seated on a card's hairline, and a plain page has none.
4. **Embedded cards in Read chapters** — card pages only for now; embedded cards have no
   per-card SCC identity on the page, so a per-card panel is a pipeline change.
5. **(new) Sanction the ability card's clip relaxation?** — yes; the alternative (wrapping
   the card) breaks four `.md-typeset > .sc-ability` adjacency contracts for a 232-subpixel
   corner difference.
6. **(new) The card hover-lift carries the plate** (`.sc-ability:hover` translates −2px, the
   plate is a child) — recommend keeping it, but it is a visible 2px divergence from the
   plugin and should be a decision.
7. **(new) The level scaler is now the only hover-revealed control left in the head** —
   recommend leaving it, but look at `sc297-r1-statblock-dark-after-hover.png` with fresh
   eyes: with the strip gone it reads as an orphan rather than one of a row.

---

## 6. Pre-existing defects found (report to Scott / file as Backlog)

**D1 — the encounter "+" chip mounts on an arbitrary embedded statblock in a Read chapter.**
`sc-encounter.js:36` uses `.md-content .sb-wrap .sb__head`, a plain descendant selector where
every other control uses the strict card-page adjacency. Measured on
`/Read/bestiary/retainers/`: 21 `.sb-wrap` on the page, one `.sc-enc-addpage` on the first
one's head. A reader on a chapter page gets an "add to encounter" chip that silently adds
whichever creature is printed first.

**D2 — the copy-link mounts on an embedded card in a Read chapter and copies the *chapter's*
permalink.** `scc-card-copy.js:83` gates on `card.parentElement.classList.contains("md-typeset")`,
which an embedded card in a chapter satisfies. Measured on the same page: one `.sc-copylink`
on an embedded card, whose URL comes from the page-level `<meta name="scc-permalink">`.

Both are one-line fixes (use the strict discriminator), both predate SC-297, and neither is
touched by the prototype.
