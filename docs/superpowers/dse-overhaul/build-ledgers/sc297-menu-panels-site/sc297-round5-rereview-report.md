# SC-297 round 5 — scoped re-review of the round-4 fix delta

Reviewer: the round-3 reviewer (independent of the round-2/4 implementer). Scope: the delta
`3c733f312f..84608f494c` only. Branch left exactly as found — `git status --porcelain` empty in
both the superproject (`cd53f9567655`) and `v2` (`84608f494c`); every probe mutation was applied
to the gitignored `v2/site/` build copy and reverted (all seven touched build copies verified
byte-identical to `docs/` at the end).

## Executive summary (≤10 lines)

1. **Verdict: FIX ROUND NEEDED — but a trivial one** (2 doc lines + 1 optional CSS rule). All
   **nine** round-3 findings are **CLOSED by measurement**; nothing regressed.
2. Gates I re-ran: unit **82/82 pass, 0 fail**; original e2e **6 pass / 2 pre-existing fail**;
   `chrome-panel.e2e.cjs` **245/245 pass, 0 fail**.
3. My own falsification (different mutation from the implementer's — dropped the pin mount in
   the built `sc-pins.js`): **16 named FAILs**, one per page × scheme, each naming the missing
   control. Contents assertion is real.
4. Item 3b (`2.1em`→`2.5em`) verified: plate is **44.00px**, reserve **47.5px** on all six
   pages; desktop and phone geometry unchanged (**10.00px** / **0.00px**); reverting to `2.1em`
   yields **6 named FAILs** at exactly **−4.109375px**. No doc states `2.1em` as the site value.
5. Copy-link census over 1,603 built pages: **23 pages lose** it vs base (10 Read chapters +
   13 plain Browse pages, all `isCardPage:false` and all keeping a `.sc-pageact` permalink) and
   **185 gain** it (trait leaves). 0 both / 0 neither / 0 stray over 76 pages measured.
6. **New, MEDIUM:** the CSS H1-hide rules were not extended with `p.sb-backlink`, so the three
   minion pages are card pages to the JS but plain pages to the CSS — visible duplicate title
   (`shots/sc297-r5-minion-razor-phone.png`: "RAZOR" twice).
7. **New, LOW ×2:** `DESIGN.md:186` still states the *strict* `h1+hr+card` adjacency the delta
   relaxed; `DESIGN.md:214` still scopes the copy-link to three families, now five.

---

## 1. Per-finding closure (all measured, not read)

| finding | status | proof |
|---|---|---|
| **HIGH-1** kit/trait lost the copy-link | **CLOSED** | 21/21 `Browse/kit/*` now `copyInPlate:true`; 185 trait leaves *gain* a copy-link vs base; `no-permalink=0` across 76 pages; clipboard on `Browse/kit/cloak-and-dagger/` = `…/scc/mcdm.heroes.v1/kit/cloak-and-dagger/`, `metaMatch=true` |
| **HIGH-2** export chips escaped into the head on 3 minion pages | **CLOSED** | all three pages: 1 plate, `["sc-copylink","sc-export","sc-pin"]`, `expInPlate:true`, `outsidePlate:[]`; `shots/sc297-r5-minion-razor-dark-hover.png` head clean; gate now covers all three |
| **MEDIUM-1** stray chips baked into the PNG | **CLOSED** | on `…/minion/gorrre/` under `body.sc-export-shooting`: `chrome/copy/pin/exp` all `display:none`, `sticky:none`; real click → download `gorrre.png`, shooting class cleared |
| **MEDIUM-2** gate logged contents, never asserted | **CLOSED + falsified by me** | see §2 — 16 named FAILs from a mutation different to the implementer's |
| **MEDIUM-3a** phone clearance measured a zero rect | **CLOSED** (with a caveat, §4) | walk now reaches `P.sb-backlink` on the minion pages, `gap=3.5`; reverting `2.5em` → 6 named FAILs at `−4.109375` |
| **MEDIUM-3b** `:focus-within` explained by a stray `:hover` | **CLOSED** | gate now asserts `hides again once the mouse leaves (opacity=0)` then, mouse at (0,0), `revealed by :focus-within with the mouse away (opacity=1)` — 32 assertions, all pass |
| **LOW-1** 7 stale "control strip" references | **CLOSED** (+ the 8th drive-by) | `grep -rn "control strip"` over `DESIGN.md`, `v2/docs/javascripts`, `v2/docs/stylesheets`, `v2/.repo-docs`, `v2/CLAUDE.md` returns exactly one hit — `steel-chrome.css:6` "It REPLACES the hover-revealed top-CENTER control strip", which is correct historical framing |
| **LOW-2** no component-table row for the site plate | **CLOSED** | `DESIGN.md:215` new row naming `sc-chrome.js` + `steel-chrome.css` and the `SCChrome` predicate |
| **LOW-3** collapse toggle called an open question | **CLOSED** | `steel-chrome.css:260-262` now cites Scott's ruling as settled |
| **LOW-4** wrong selector-ordering comment | **CLOSED** | `sc-chrome.js:49-51` now states document order correctly |

**Design ruling honored structurally.** Grepping the four consumers + `sc-pageact.js` for any
card-finding selector leaves nothing: the only surviving selectors are *within* an
already-resolved card (`sc-pageact.js:23` `card.querySelector(".sc-head")`,
`sc-encounter.js:45` `card.querySelector(".sb__head")`, plus its
`card.classList.contains("sb-wrap")` family filter) and `sc-pins.js:25`'s page-title fallback
`document.querySelector(".md-content h1")`, which is not a card lookup. Every card lookup goes
through `SCChrome.anchor()`; every mount bails on `!panel()`. Load order supports it:
`sc-chrome.js` is `mkdocs.yml:155`, ahead of `sc-encounter.js:172`, `sc-pageact.js:178`,
`scc-headerlinks.js:179`, `scc-card-copy.js:181`, `sc-export.js:183`, `sc-pins.js:185`.

**Both/neither is structurally impossible now, and measured so.** Two censuses (52 pages, then
the 24 remaining "lost" pages): `both=0`, `cardpage-no-plate=0`, `stray=0`, `no-permalink=0`.
Card pages carry a plate and no `.sc-pageact`; plain pages carry a `.sc-pageact` (2 buttons) and
no plate.

## 2. My falsification of the contents assertion (different mutation)

The implementer dropped `sc-kit` from `cardKind` (2 FAILs, kit only). I instead neutered the
pin's host resolution in the gitignored build copy
(`v2/site/javascripts/sc-pins.js:47`, `const host = (C && C.panel()) || (A && A.strip());` →
`const host = null;`) and re-ran the gate:

```
FAIL statblock/dark plate contains exactly the expected controls (want ["sc-copylink","sc-enc-add","sc-export","sc-pin"], got ["sc-copylink","sc-enc-add","sc-export"])
… 16 in total, one per page × scheme, kit's reading  (want ["sc-copylink","sc-pin"], got ["sc-copylink"])
FAILURES 16
```

229 PASS / 16 FAIL, every failure on the contents assertion and nowhere else. Reverted;
`diff docs/javascripts/sc-pins.js site/javascripts/sc-pins.js` clean.

## 3. Item 3b — the `2.1em` → `2.5em` change

Measured at 375 × 820, `isMobile`, dark, on all five families **plus** `…/minion/razor/`:

| page | plate height | reserved `margin-top` | clearance vs last **rendered** sibling | right gap / bottom delta |
|---|---|---|---|---|
| statblock / ability / featureblock / trait / kit | 44.00px | 47.50px | `null` (nothing rendered above — h1 and hr are `display:none`) | 10.00 / 0.00 |
| minion-razor | 44.00px | 47.50px | **+3.50px** vs `P.sb-backlink` | 10.00 / 0.00 |

Reserve ≥ plate height on every page; no overlap anywhere; the plate sits at y=142.5 with the
header ending at 48 and the content column starting at 119, so nothing touches the breadcrumb.
Desktop geometry is untouched: 10.00px / 0.00px on all six pages, rest opacity 0, hover 1,
print `none`.

**Falsified:** reverting the built CSS to `2.1em` reproduces the implementer's reported defect
exactly — 6 named FAILs, `gap=-4.109375, prev=P.sb-backlink`, on all three minion pages × both
schemes, and nothing else. The change is a measured fit, correctly gated, and would now be
caught if it regressed.

**Doc check:** the only `2.1em` in `DESIGN.md` is line 274, inside "The element chrome panel" →
"Mobile (`Platform.isMobile`)" — unambiguously the **plugin's** value. No `.repo-docs` file and
no CSS comment states `2.1em` as the site's value; `steel-chrome.css:234-236` names it only as
"not the plugin's 2.1em". Clean.

## 4. Gates and censuses I re-ran

- **Unit** `node --test tests/*.test.js`: **82 tests, 82 pass, 0 fail** (78 + the 4 new
  `scc-card-copy-core` tests).
- **Original e2e** (8 files): 6 pass; `featureblock-fixture` exit 2
  (`waitForSelector('.fb-wrap')` 30 s timeout on the 404 fixture), `settings-panel` exit 1
  (`card: css var = 0.7 (0.8)` ×3) — byte-identical to rounds 1/2/2b/3.
- **`chrome-panel.e2e.cjs`**: **245 PASS / 0 FAIL**, including 16 contents assertions and 32
  focus/hover assertions.
- **Copy-link gate delta over all 1,603 built pages** carrying an `scc-permalink` meta and a
  card class (`r5-gatecrawl.log`), base gate `f9347707dd` vs the round-4 predicate:
  **LOST 23, GAINED 185.**
  - The 185 gained are all `Browse/feature/**` trait leaves — new capability from `cardKind`'s
    `sc-trait` branch, consistent with ruling 1 and covered by the CHANGELOG's rollout bullet.
  - Of the 23 lost, **10 are `Read/**` chapters** — the intended D2 fix. The other **13 are
    plain `Browse` pages** (`class/beastheart`, six `feature/summoner/**`, two
    `feature/elementalist/**`, `movement/burrow`, `project/imbue-treasure`, two `rule/**`):
    every one measures `isCardPage:false`, `chrome:0`, `pageact:1`, `pageactBtns:2`. Their base
    copy-link mounted on an **embedded** card — the D2 bug class — so losing it is the fix
    working, and each keeps a page-tier permalink button. **Not a regression.** (The brief's
    wording "only Read chapters" is narrower than the measured truth; the substantive criterion
    — every Browse leaf *card* page has exactly one affordance — holds.)
  - One `NAV_FAIL` (`Read/bestiary/monsters/`, a 20 s `domcontentloaded` timeout under
    concurrent browser load); re-checked alone: loads fine, `isCardPage:false`, `chrome:0`,
    `pageact:1`. Not a defect.
- **Regression sweep** (`r5-sweep.log`): per family, rest / hover / print / phone as above;
  instant-nav across six hops (statblock → ability → trait → kit → minion → Read chapter →
  statblock) shows **exactly 1 plate and 1 anchor on every card hop** with the right per-family
  items, and 0 plate / 1 pageact on the chapter; Read chapters and landing pages carry
  0 plates and a 2-button `.sc-pageact`; pin titles resolve per family (`Cloak and Dagger`,
  `Glowing Recovery`, `Razor`) and pins persist with the correct path/title.

**Caveat on MEDIUM-3a (not a reopened finding).** The clearance walk is implemented as
prescribed, but on the five original families it still terminates with `prevRect === null`
(nothing above the card is rendered), so `clearsPrev === null` short-circuits the assertion to
pass. That is now correct-*by-content* rather than a zero-rect artifact, and the minion pages
supply the live, falsifiable case (proven in §3). If the owner wants the arm to bite on all
eight pages, the alternative I offered in round 3 still applies: measure against
`.md-content__inner`'s content-box top when no rendered sibling exists.

## 5. New findings introduced by the delta

### MEDIUM — the CSS H1-hide predicate was not relaxed with the JS one

`v2/docs/stylesheets/steel-statblock.css:52-53` (and the four sibling rules:
`steel-featureblock.css:34-35`, `steel-ability-cards.css:218-219`, `steel-traits.css:24-25`,
`steel-kit.css:14-15`)

Round 4 taught `SCChrome` to accept an optional `<p class="sb-backlink">`, but the six CSS
H1-hide rules still key on the *strict* `h1:first-child + hr + <card>` adjacency. So the three
pages the delta promoted to card pages are card pages to the JS and plain pages to the CSS.

**Measured** on `/Browse/monster/retainer/summoner/minion/razor/` (desktop, dark): page `h1`
computes `display: block` and its `<hr>` `flow-root`, with `h1Text: "Razor"` and
`cardName: "Razor"` — the only one of the eight gate pages where `h1Visible` is `true`
(`r5-sweep.log` §B). Visible duplicate title — the same defect round 2b was spun up to fix for
traits. Shot: `shots/sc297-r5-minion-razor-phone.png` (375px: "RAZOR" as the page heading, the
rule beneath it, then "RAZOR" again inside the card).

The underlying duplicate predates the delta (the CSS never matched these pages); what the delta
introduced is the *divergence* — the ruling's "one discriminator, one owner" now holds across
the JS seams but not against the CSS that answers the same question.

**Fix.** Add the alternation to `steel-statblock.css` only (the backlink paragraph is emitted
only above statblocks — `steel-etl` `class_backlinks.go`; confirm with a grep of the generated
tree before widening):

```css
.md-typeset > h1:first-child:has(+ hr + p.sb-backlink + .sb-wrap),
.md-typeset > h1:first-child + hr:has(+ p.sb-backlink + .sb-wrap) { display: none; }
```

Hiding the H1 there costs nothing: those pages' `¶` fallback is no longer the only permalink
affordance, because the plate now carries a working copy-link (measured: clipboard =
`…/scc/mcdm.summoner.v1/monster.retainer.summoner.minion.statblock/razor/`, `metaMatch=true`).
Add the three minion pages to `page-titles.e2e.cjs`'s `CASES` so it cannot drift again.
*The owner may reasonably rule this into its own ticket rather than a round 6 — it is a
pre-existing visible defect on 3 pages, not a regression of the fixes.*

### LOW — `DESIGN.md:186` still states the adjacency the delta relaxed

> `"Card page" means the strict `h1+hr+card` adjacency; a page that merely *embeds* cards …`

Round 4 deliberately widened this to allow one optional `p.sb-backlink`, and made `SCChrome`
the predicate. The new component-table row (`DESIGN.md:215`) says so, but the prose contract at
:186 — the sentence a reader actually looks up — does not. One-sentence edit.

### LOW — `DESIGN.md:214` still scopes the copy-link to three families

> `Card copy-link button (.sc-copylink — hover-revealed permalink-copy injected into statblock / featureblock / ability card pages …)`

Round 4's `cardKind` change makes it all five (kit and trait now included; 185 trait pages and
21 kit pages measurably gained it). Same edit pass as the line above.

### INFO — landing only, dispatcher's (not this delta's)

`origin/main` has moved under the branch since round 3, and now in a way that will conflict:

- `v2`'s `origin/main` advanced `f9347707dd` → **`e83421a61d`**, two SC-177 commits
  (`feat: add custom named links to My Table`, `feat: embed saved site sections in My Table`)
  that touch **`sc-pins*`** — the same file round 4 rewrote. Landing needs a real merge of the
  `v2` submodule, not a pointer bump; `sc-pins.js` will conflict.
- The superproject's `DESIGN.md` pinboard row and `CHANGELOG.md` (main gained a
  `## 2026-09-05 — My Table section excerpts (SC-177)` section, and edited the same pinboard
  row this branch edited) will conflict too. A careless resolution silently drops main's
  SC-177 documentation.
- The `draw-steel-elements` pin is still stale (branch `c2a5cec`, main `98d5bd3`), as reported
  in round 3.

## 6. Artifacts

Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/sc297-round5-rereview-report.md`

Shots (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/shots/`):
`sc297-r5-minion-razor-dark-hover.png`, `sc297-r5-minion-razor-phone.png`,
`sc297-r5-minion-razor-title.png`, `sc297-r5-statblock-title.png`,
`sc297-r5-{statblock,ability,featureblock,trait,kit,minion-razor}-phone.png`

Logs & probe scripts (scratchpad
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/`):
`r5-mkdocs-build.log`, `r5-chrome-panel-baseline.log`, `r5-mutation-pin.log`,
`r5-mutation-21em.log`, `r5-unit.log`, `r5-e2e-summary.log`, `r5/r3-e2e-*.log`,
`r5-gatecrawl.cjs`/`.log`, `r5-affordance.cjs`/`.log`, `r5-affordance-lost.log`,
`r5-sweep.cjs`/`.log`, `r5-h1shot.cjs`, `r5-aff-urls.txt`, `r5-lost24.txt`
