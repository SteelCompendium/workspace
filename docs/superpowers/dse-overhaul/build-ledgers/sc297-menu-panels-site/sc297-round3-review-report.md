# SC-297 round 3 — independent adversarial review report

Reviewer: fresh identity, did not write this code. Branch reviewed as it stands:
`v2` @ `3c733f312f8db470ca18371ff487135aea90ba21`, worktree superproject @ `99f065862e`.
No tracker access used. Branch left exactly as found (`git status --porcelain` empty in both
the superproject and `v2`; HEAD unchanged).

## Executive summary (≤10 lines)

1. **Verdict: FIX ROUND NEEDED.** The plate itself is correct and the gate is real; the
   *fallout of the D2 gate tightening* is not.
2. Findings: **2 HIGH, 3 MEDIUM, 4 LOW, 1 INFO.**
3. Gates I re-ran: unit **78/78 pass, 0 fail**; original e2e **6 pass / 2 pre-existing fail**
   (`featureblock-fixture` exit 2, `settings-panel` exit 1 — 3/21 checks); `chrome-panel.e2e.cjs`
   **135/135 pass, 0 fail**.
4. Gate is NOT vacuous where it matters: inset 10→12px ⇒ **20 named FAILs**; bottom offset +2px
   ⇒ **20 named FAILs**. Both reverted.
5. **HIGH-1:** all **21** `Browse/kit/*` pages lost their *only* permalink-copy affordance
   (H1 hidden, no `.sc-pageact`, no copy-link, plate = pin only). Base had one; branch has none.
6. **HIGH-2:** on 3 `sb-backlink` statblock pages the MD/PNG chips fall out of the plate into
   the card head with **no placement CSS left** — static, always visible, stacked, over the eyebrow.
7. Deciding shots: `shots/sc297-r3-minion-razor-dark.png` (broken) vs
   `shots/sc297-r3-minion-razor-BASE-hover.png` (pre-branch, correct).
8. Everything Scott ruled on is otherwise satisfied: 5 families, no embedded plates, no collapse
   toggle, `.sc-pageact` and the level scaler untouched, print/phone/keyboard contracts hold.

---

## 1. What I measured (positives, all re-run by me — not read from the round-2 report)

**Probe 1 — the geometry gate is real.** Baseline `chrome-panel.e2e.cjs` = 135 PASS / 0 FAIL
(`scratchpad/r3-chrome-panel-baseline.log`). I then mutated the *build output* copy
(`v2/site/…`, gitignored, byte-identical to `docs/…`), never the tracked tree:

| mutation | result |
|---|---|
| `--sc-chrome-inset: 10px` → `12px` | 20 FAIL, e.g. `FAIL statblock/dark right edge 10px inside card border-box right (got 12.00)` + the phone twin, on all 5 families × 2 schemes |
| `bottom: calc(100% + …)` → `calc(100% + 2px + …)` | 20 FAIL, e.g. `FAIL kit/light bottom edge on the card's border-box top (delta -2.00)` + phone twin |

Both reverted; `diff docs/stylesheets/steel-chrome.css site/stylesheets/steel-chrome.css` clean.

**Probe 2 — families and embeds.** One plate per card page, zero on chapters:

| page | `.sc-chrome` | plate items | `.sc-copylink` | `.sc-enc-addpage` |
|---|---|---|---|---|
| `Browse/monster/minotaur/minotaur-sunderer/` | 1 | copy, pin, enc, export | 1 | 1 |
| `Browse/feature/ability/dragon-knight/dragon-breath/` | 1 | copy, pin, export | 1 | 0 |
| `Browse/monster/ogre/ogre-malice/` | 1 | copy, pin, export | 1 | 0 |
| `Browse/feature/trait/orc/glowing-recovery/` | 1 | pin, export | **0** | 0 |
| `Browse/kit/cloak-and-dagger/` | 1 | pin | **0** | 0 |
| `Read/bestiary/retainers/` (21 `.sb-wrap`, 135 `.sc-ability`) | **0** | — | **0** | **0** |
| `Read/heroes/kits/` (21 abilities) | **0** | — | **0** | **0** |
| `Read/heroes/combat/` (4 abilities, 17 traits) | **0** | — | **0** | **0** |
| `Read/heroes/classes/` (490 abilities, 850 traits) | **0** | — | **0** | **0** |

D1/D2 hold on every chapter tested; each chapter keeps its own `.sc-pageact`.
(The trait/kit `0` copy-links are the subject of HIGH-1 — see §2.)

**Probe 3 — the strip is gone, not hidden.** Zero residual placement offsets
(`50% +`, `.45rem`, `1.6rem`, `3.4rem`, `5.2rem`) anywhere in `steel-copylink.css`,
`steel-pins.css`, `steel-encounter.css`, `steel-export.css`, `steel-pageact.css`. No dead
`order`/position rules for the removed strip. The **only** remaining `.sc-head` mount path is
`sc-export.js:37` — which is exactly what HIGH-2 exercises.

**Probe 4 — every action end to end** (real Brave, hover first so `pointer-events` is live;
`scratchpad/r3-probe2.log`):

- copy-link → clipboard `https://steelcompendium.io/v2/scc/mcdm.monsters.v1/monster.minotaur.statblock/minotaur-sunderer/`, `sc-copylink--copied` flash true.
- pin → `localStorage["sc-pins"] = {"v":1,"items":[{"path":"/Browse/monster/minotaur/minotaur-sunderer/","title":"Minotaur Sunderer","kind":"Monsters & Terrain",…}]}`, `aria-pressed="true"`, `is-on`, colour `rgb(77,184,199)`; `/pins/` board lists "Minotaur Sunderer"; return visit shows pressed; unpin round-trips to `{"v":1,"items":[]}`.
- encounter-add → `localStorage["sc-encounter"].picks = [{href:"/Browse/monster/minotaur/minotaur-sunderer/",name:"Minotaur Sunderer",ev:"20",organization:"Elite",level:"3",count:1}]`, chip flashes `✓`.
- MD export → 3757 chars on the clipboard, first line is the statblock table row; button flashes `✓`.
- PNG export → download `minotaur-sunderer.png` fired; `sc-export-shooting` cleared afterwards.
- **Instant-nav**: sb→sb→ability→trait→sb, four hops. After every hop exactly **1** `.sc-chrome`, **1** `.sc-chrome-anchor`, with the right per-family item counts (4 / 4 / 3 / 2 / 4). No doubled mounts, no orphaned plate.

**Probe 5 — print.** `display: none` on all five families × both schemes (gate assertions, re-run).

**Probe 6 — phone 375px** (`scratchpad/r3-probe3.log`): plate always visible, reserved
`margin-top: 39.9px`, plate box 135→179 with the header ending at 48 and the content column
starting at 119; card top = plate bottom = 179. Nothing above the card is rendered (the `h1`
and `hr` are `display:none` on all five families now), so no breadcrumb/element overlap.
Shots `sc297-r3-{statblock,ability,featureblock,trait,kit}-phone.png`.

**Probe 7 — keyboard.** Plate is `role="toolbar"` / `aria-label="Card actions"`. Every item is a
native `<button>` with `tabIndex 0`, not disabled, with an accessible name (`Copy permalink`,
`Pin to My Table`, `Add to encounter`, `Copy as Markdown`, `Download card as PNG`). With the
mouse parked at (5,5) so `:hover` cannot contaminate the reading, focusing a plate button takes
the plate from `opacity 0` → `1`, `pointer-events: auto`, on all five families.

**Probe 8 — scope discipline.** `sc-scale*` / `steel-scale.css` untouched (ruling 7);
`sc-pageact.js` / `steel-pageact.css` untouched (ruling 3); no collapse toggle anywhere
(ruling 2). The diff `f9347707dd..HEAD` is 16 files and contains nothing outside the seven
rulings plus the sanctioned round-1 spec follow-ons (legacy placement-block deletion,
`.sc-export-shooting` trim) and the owner-folded round-2b trait rule.

**Probe 9 — docs.** `DESIGN.md` "Card header system" now describes the plate, not the strip;
no dated history added (router rule respected). `CHANGELOG.md` `## Unreleased` carries three
bullets (rollout, the two Read-chapter fixes, the trait duplicate title). `v2/CLAUDE.md`,
`.repo-docs/conventions.md`, `.repo-docs/troubleshooting.md` updated. Residual stale mentions:
LOW-1.

**Probe 10 — gates.** Unit 78/78 pass, 0 fail (`r3-unit.log`). Original e2e: `cardhead-mobile`,
`featureblock`, `nav-drawer-keep`, `page-titles`, `statblock-band`, `statblock-featstyle` PASS;
`featureblock-fixture` FAIL exit 2 (`waitForSelector('.fb-wrap')` 30 s timeout on the 404
fixture), `settings-panel` FAIL exit 1 (`card: css var = 0.7 (0.8)` ×3) — both byte-identical
to the documented pre-existing baseline. `chrome-panel.e2e.cjs` 135/135.

**Probe 11 — round-2b delta.** `steel-traits.css:21-25` mirrors `steel-kit.css` exactly. On
`Browse/feature/trait/orc/glowing-recovery/` the page `h1` computes `display: none` (one title,
not two). The selector is the strict card-page adjacency, not a bare `h1 + hr`: on the four
Read chapters that embed traits (incl. `Read/heroes/combat/` with 17 `.sc-trait`) the page `h1`
is still visible, and `page-titles.e2e.cjs` passes.

---

## 2. Findings

### HIGH-1 — 21 kit pages lose their only permalink-copy affordance

`v2/docs/javascripts/scc-card-copy.js:86` (new gate) with
`v2/docs/javascripts/scc-card-copy-core.js:19-26` (`cardKind` knows only `sb-wrap`/`fb-wrap`/`sc-ability`)

**Scenario.** A reader on `/Browse/kit/cloak-and-dagger/` wants the card's `/scc/` permalink.
`steel-kit.css` hides the page `h1` (so the native ¶ headerlink is unreachable), the page is a
card page so `sc-pageact.js` mounts no `.sc-pageact` strip, and the plate carries only the pin
(exports are the known SC-298 gap). Result: **no permalink affordance at all.**

Before this branch the copy-link mounted on the kit's embedded signature `.sc-ability` and
copied the *kit page's own, correct* permalink
(`…/scc/mcdm.heroes.v1/kit/cloak-and-dagger/`). The D2 gate at :86 now rejects it because that
`.sc-ability` is not the element adjacent to the `<hr>` — but nothing was added to the plate to
replace it, because `cardKind` returns `""` for `.sc-kit` and `.sc-trait`.

**Measured.** I diffed the two gates in-page across all 1 603 built pages that carry an
`scc-permalink` meta and a `.sb-wrap`/`.fb-wrap`/`.sc-ability`
(`scratchpad/r3-gatecrawl.log`): **48 pages lost the copy-link.** 11 are `Read/**` chapters —
those are the intended D2 fix (the link there copied the *chapter's* permalink). The other 37
are `Browse/**` leaf pages that were copying their own correct permalink. Of those 37, 16 keep a
`.sc-pageact` page-permalink button and are benign; **21 do not** — every
`Browse/kit/*` page (`scratchpad/r3-affordance.log`, all 21 marked `NO-PERMALINK`,
`{"h1":false,"pageact":0,"copy":0,"chrome":1}`). Base run with `f9347707dd` assets swapped into
the build output: copy-link present on every one of them.

**Fix.** Make the copy-link follow the plate rather than its own family list: in
`scc-card-copy.js`, resolve the card with `window.SCChrome.anchor()` when it is available (and
keep the `SELECTOR` path only as the no-plate fallback), and add `sc-kit` / `sc-trait` to
`cardKind` so `data-card` and the permalink still resolve. That mounts a copy-link in the plate
on all five families, removes the `SELECTOR`-vs-`FAMILIES` divergence, and leaves the D2 fix
intact. Add a per-family expected-items assertion to the gate (see MEDIUM-2) so this cannot
regress silently again.

### HIGH-2 — export chips escape the plate into the card head with no placement CSS (3 pages)

`v2/docs/javascripts/sc-export.js:36-37` (plate-or-`.sc-head` fallback) with
`v2/docs/stylesheets/steel-export.css:1-8` (the deleted `.sc-head .sc-export` placement block)

**Scenario.** `/Browse/monster/retainer/summoner/minion/{razor,gorrre,violent}/` render
`<h1>` → `<hr>` → `<p class="sb-backlink">Summoned by …</p>` → `<div class="sb-wrap">`. The
intervening `<p>` breaks the strict `h1:first-child + hr + card` adjacency, so
`SCChrome.panel()` returns `null` — but `sc-export.js`'s `cardNode()` still uses a bare
descendant selector (`.md-content .sb-wrap`), so the MD/PNG pair mounts into `.sb__head` via the
`.sc-head` fallback. The CSS that used to place it there was deleted this round.

**Measured** (`scratchpad/r3-probe2.log`, both schemes):

| | base (`f9347707dd` assets) | branch |
|---|---|---|
| `.sc-export` position | `absolute` | `static` |
| opacity at rest | `0` (hover → `1`) | `1` (always) |
| box | 82 × 34 at (744, 212) — top-centre | 41 × 68 at (291, 173) — stacked, inside the header |

Shots: `shots/sc297-r3-minion-razor-dark.png` and `-light.png` (broken: MD over PNG, permanently
visible, sitting on the "◆ RETAINER" eyebrow) vs `shots/sc297-r3-minion-razor-BASE-hover.png`
and `-BASE-rest.png` (pre-branch, correct). Same on `gorrre`
(`shots/sc297-r3-minion-gorrre-export-stray.png`).

These pages also lost the copy-link (part of the 37 above), but they keep `.sc-pageact` and a
visible `h1`, so a page permalink survives — the layout break is the user-visible defect.

**Fix.** Two options, and I'd take the first:
1. Make `sc-export.js` refuse to mount outside the plate on a page whose card family is ported:
   `const host = window.SCChrome && window.SCChrome.panel(); if (!host) return;` and gate
   `cardNode()` on the same strict adjacency. Consistent with ruling 4 (card pages only) and
   removes the last dead `.sc-head` mount path.
2. Or teach the discriminator to skip an intervening non-card block (or move the `sb-backlink`
   paragraph inside the card at generation time), which restores the plate — and with it the
   copy-link — on those three pages. That is a `steel-etl`/spec change, so it belongs in a
   ticket, not this branch.

### HIGH-3 → downgrade to MEDIUM-1 — the escaped chips are baked into the PNG export

`v2/docs/stylesheets/steel-export.css:16-22` (the trimmed `.sc-export-shooting` hide list)

**Scenario.** On the same three pages, `sc-export.js` shoots the `.sb-wrap` node with
`body.sc-export-shooting` applied. The trim removed `.sc-export`, `.sc-pin`, `.sc-enc-addpage`
and `.sc-copylink` from the hide list on the reasoning that hiding `.sc-chrome` covers them —
true only when they *are* inside the plate. **Measured**: with the class applied,
`.sc-export` computes `display: block` on razor (vs `.sc-chrome` → `none` on a normal card
page), so the MD/PNG chips are painted into the exported image.

**Fix.** Restore the four class names alongside the new `.sc-chrome` rule. It costs nothing and
is the belt to the plate's braces; it also survives whichever HIGH-2 fix is chosen.

### MEDIUM-2 — the new gate never asserts what the plate contains

`v2/tests/e2e/chrome-panel.e2e.cjs:111`

`items` and `order` are printed as `INFO`, never asserted. A rollout that dropped copy-link from
a family passes 135/135 — and that is exactly what happens today on trait and kit (HIGH-1). The
`stray` check at :130-138 only proves nothing is left *in the head*; nothing proves the control
arrived *in the plate*.

**Fix.** Add a per-family expected-item assertion, e.g.
`ok(JSON.stringify(rest.items.sort()) === JSON.stringify(expected[pg.name]), …)` with
`expected = { statblock: [copy, pin, enc, export], ability: [copy, pin, export], … }`, and
update it deliberately when a family's set legitimately changes (kit exports = SC-298).

### MEDIUM-3 — two gate assertions are now vacuous

`v2/tests/e2e/chrome-panel.e2e.cjs:171` and `:115-127`

1. **Phone clearance (:171).** `clearsPrev` measures against `card.previousElementSibling`.
   After round 2b every family's preceding `<hr>` is `display:none`, so its
   `getBoundingClientRect()` is the zero rect and `pr.top - 0` is trivially ≥ −0.5. I confirmed
   at 375px on all five families that both preceding siblings report `{hidden:true}`
   (`scratchpad/r3-probe3.log`). The assertion that legitimately caught the trait bug in round 2
   can no longer catch anything.
   **Fix:** walk back to the last *rendered* preceding sibling (skip `display:none` /
   zero-rect), or measure against `.md-content__inner`'s content-box top.
2. **`:focus-within` (:122-127).** The focus check runs immediately after the hover check at
   :116 without moving the mouse, so `opacity: 1` is explained by `:hover`. Deleting the
   `:focus-within` arm of `steel-chrome.css:215` would still pass. (I verified independently
   that the contract *does* hold — the gate just doesn't prove it.)
   **Fix:** `await page.mouse.move(0, 0); await page.waitForTimeout(400);` before the focus
   assertion.

### LOW-1 — seven places still describe the retired strip as current

- `DESIGN.md:224` — "The plugin's counterpart to the site's hover-revealed card control **strip**"
- `DESIGN.md:209` — level-scaler row, "hover-revealed like the control strip"
- `v2/docs/javascripts/sc-pageact.js:4` — "card pages carry their own hover-revealed top-center control strip"
- `v2/docs/javascripts/sc-export.js:3` — "Buttons join the hover-revealed top-center control strip"
- `v2/docs/stylesheets/steel-scale.css:3` — same
- `v2/docs/javascripts/scc-card-copy.js:15-17` — the header comment still documents the *old* gate ("injects only when the primary card is a DIRECT child of `.md-typeset`"), which :86 replaced
- `v2/.repo-docs/troubleshooting.md:255-266` — the **Fix:** still prescribes the retired strip and its rem offsets, with the retraction appended after it; a reader following the Fix line gets the wrong answer

The round-2 report claims it swept the stale mentions ("two stale mentions in `DESIGN.md`'s
component table"); two more remain in the same file.

### LOW-2 — `DESIGN.md` has no component-table row for the site chrome plate

The table has a row for the **plugin** panel (`DESIGN.md:215`), and the pinboard (:203) and
card-exports (:208) rows now point at "the card chrome plate" — but there is no row naming
`v2/docs/javascripts/sc-chrome.js` + `steel-chrome.css`. A new shipped component system should
have one, per the table's own convention.

### LOW-3 — the collapse toggle is documented as an open question, but ruling 2 closed it

`v2/docs/stylesheets/steel-chrome.css:246-247` — "…the collapse toggle would take that slot if
SC-297 ever adopts one (open question)". Scott's 2026-09-05 ruling adopted "no collapse toggle".
Reword so a future reader does not reopen a settled decision.

### LOW-4 — an incorrect comment about selector-list ordering

`v2/docs/javascripts/sc-chrome.js:37-38` — "Ordered; the first family present on the page wins".
`document.querySelector` on a selector list returns the first match in **document** order, not
list order. Harmless today (only one element can be adjacent to the `<hr>`), but the comment
would mislead an edit that added a family whose card can nest another.

### INFO — stale submodule pin, for the landing step only

The branch's superproject tip `99f065862e` pins `draw-steel-elements` at `c2a5cec`;
`origin/main` has since moved to `2aad0767`, which bumps it to `98d5bd3` (SC-202 r2 —
`c2a5cec` is an ancestor). Landing must not revert that pointer (`land-stack` skill's stale-pin
case). `v2`'s own pin is fine: `f9347707dd` is still `origin/main`'s `v2`. Not a defect in this
branch; flagged so the landing step does not silently roll DSE back.

### Explicitly not reported as findings (per brief §2)

Kit cards showing only the pin because kit leaf pages lack the export island (SC-298); the two
pre-existing e2e failures; the shared main checkout's `CLAUDE.md` → `AGENTS.md` dirt (re-checked,
unchanged, untouched by me).

---

## 3. Artifacts

Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/sc297-round3-review-report.md`

Shots (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/shots/`):
`sc297-r3-minion-razor-dark.png`, `sc297-r3-minion-razor-light.png`,
`sc297-r3-minion-razor-BASE-rest.png`, `sc297-r3-minion-razor-BASE-hover.png`,
`sc297-r3-minion-razor-export-stray.png`, `sc297-r3-minion-gorrre-export-stray.png`,
`sc297-r3-{statblock,ability,featureblock,trait,kit}-desktop-hover.png`,
`sc297-r3-{statblock,ability,featureblock,trait,kit}-phone.png`,
`sc297-r3-statblock-dark-hover.png`

Logs & probe scripts (scratchpad
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/`):
`r3-mkdocs-build.log`, `r3-chrome-panel-baseline.log`, `r3-mutation-inset.log`,
`r3-mutation-bottom.log`, `r3-unit.log`, `r3-e2e-summary.log`, `r3-e2e-*.e2e.cjs.log`,
`r3-probe.cjs`/`.log`, `r3-probe2.cjs`/`.log`, `r3-probe3.cjs`/`.log`, `r3-gatecrawl.cjs`/`.log`,
`r3-affordance.cjs`/`.log`, `r3-copylink.cjs`, `r3-base-razor.cjs`, `r3-shoot.cjs`,
`r3-urls.txt`, `r3-lost-browse.txt`
