# SC-297 round 7 — scoped re-review of the round-6 delta (rebase + three folds)

Reviewer: the round-3/5 independent reviewer. Scope: the round-6 delta only. Branch left
exactly as found — `git status --porcelain` empty in both the superproject (`117911b707`) and
`v2` (`27a021adbf`); no probe mutations were needed this round, and all build copies under
`v2/site/` verified byte-identical to `docs/` at the end.

## Executive summary (≤10 lines)

1. **Verdict: APPROVE.** All four brief items pass by measurement. One **LOW** finding, in an
   inline comment only — no behaviour, no gate, no doc a reader would act on wrongly.
2. Gates I re-ran on a fresh build: unit **86/86 pass, 0 fail**; original e2e **6 pass / 2
   pre-existing fail**; SC-177's **2 e2e files both pass**; `chrome-panel` **245/245**;
   `page-titles` **9/9** (incl. the 3 minion pages).
3. **`sc-pins*` merge is right.** The branch's only diff vs `origin/main` in `sc-pins.js` is
   round 4's `mountPinButton()` host rewrite; `sc-pins-core.js` / `sc-pins-sections.js` are
   untouched. Both behaviours run side by side, exercised live (§1).
4. **Superproject merge is right.** DESIGN.md headings identical to main's, pinboard row
   correctly merged, CHANGELOG dated sections byte-identical to main's, every submodule pin
   equals main's except `v2`, `draw-steel-elements` now `98d5bd38c2` (round-5 INFO resolved).
5. **All three round-5 findings closed**: `minion-razor h1Visible: false` (was `true`);
   `DESIGN.md` both lines fixed. Deciding shot `shots/sc297-r7-minion-razor-phone.png`.
6. Censuses on the fresh build: `both=0`, `cardpage-no-plate=0`, `stray=0`, `no-permalink=0`
   (56 pages); copy-link delta unchanged from round 5 — LOST 23, GAINED 185.
7. **INFO (landing):** both mains moved again *after* the round-6 rebase (`v2` → `e2b6a97276`
   SC-300, superproject → `021cf25a`). Low conflict risk (§5), but a re-rebase is required.

---

## 1. Item 1 — the `sc-pins*` merge

**Structural.** `git diff e83421a61d..HEAD -- docs/javascripts/sc-pins*.js` yields exactly one
hunk: `mountPinButton()`'s host resolution
(`const host = (C && C.panel()) || (A && A.strip());`), i.e. round 4's rule. `sc-pins-core.js`
and `sc-pins-sections.js` have **zero** diff. `steel-pins.css`'s only change is the round-2
removal of the retired `.sc-head .sc-pin` placement block plus its header comment — nothing of
SC-177's. SC-177's four added files are all present
(`sc-pins-sections.js`, `tests/sc-pins-core.test.js`, `tests/e2e/pins-{custom-links,sections}.e2e.cjs`).
SC-177's own API surface is live in `sc-pins.js`: `siteBase()` (:75), `renderBoard(expandPath)`
(:80), the `SCPinsSections.eligible/load` calls (:97, :114), `mountLinkForm()` (:134),
`SCPins.addLink` (:148).

**Exercised in a real browser** (`r7-pinflow.log`, `r7-board-shot.cjs`):

- On `/Browse/monster/minotaur/minotaur-sunderer/`: `pinInPlate: true`, `pageact: 0`,
  `aria-pressed` `false` → click → `true` + `is-on`, and
  `localStorage["sc-pins"] = {"v":1,"items":[{"path":"/Browse/monster/minotaur/minotaur-sunderer/","title":"Minotaur Sunderer","kind":"Monsters & Terrain",…}]}`.
- Pinned a kit and a trait from their plates too. `/pins/` renders four groups —
  `Kits` (Cloak and Dagger), `Features` (Glowing Recovery), `Monsters & Terrain`
  (Minotaur Sunderer), `Custom links` — with a `.sc-pins__rm` per row.
- **SC-177 section excerpts still work**: submitting the `.sc-pins__form` with
  `/scc/mcdm.heroes.v1/kit/cloak-and-dagger/` produced one `.sc-pins__section-fold`, `open`,
  not loading, body populated with real fetched content
  (`"martial kit CLOAK AND DAGGER Providing throwable light weapons and light armor easily
  concealed by a cloak to confuse…"`) plus its nested headings and an "Open original" link.
- Unpin round-trips: returning to the card page shows `aria-pressed="true"`, clicking removes
  it from storage and from the board.
- Plain page (`/Read/bestiary/retainers/`): `chrome: 0`, pin lives in `.sc-pageact`,
  `pinsAnywhereElse: 0` — the SCChrome-only mount rule holds.

Screenshot: `shots/sc297-r7-pinboard.png`.

## 2. Item 2 — the superproject merge

| check | result |
|---|---|
| conflict markers | none in `v2` or the superproject (the only `git grep` hits are `====` banners inside `.obsidian/plugins/terminal/main.js`, unrelated minified vendor code) |
| `DESIGN.md` headings vs main `f5fe049437` | **identical** (`diff` empty); no duplicated headings |
| pinboard row | merged correctly — main's "named site sections expand inline as read-only excerpts with child headings and tables" clause **and** `sc-pins-sections.js` in the file list are preserved, with "top-center control strip" → "card chrome plate" |
| `CHANGELOG.md` dated sections vs main | **byte-identical** (`diff` of all `^## 2026` lines empty); main's `## 2026-09-05 — My Table section excerpts (SC-177)` intact at line 633, `## Unreleased` above it at line 9 |
| `CHANGELOG.md` delta | +24 lines, all inside `## Unreleased` (1078 → 1102) |
| superproject content diff vs base | `CHANGELOG.md` +24, `DESIGN.md` +42/−17 (card-header prose, 5 row edits, 1 new row) — nothing else |
| submodule pins | `draw-steel-elements 98d5bd38c2`, `steel-etl 093da2980c`, `data-gen 494979ffcd`, `data-sdk-npm a4ce584cba`, `compendium 2e97571c48`, `statblock-adapter-gl-pages f360128bbe`, `steelCompendium.github.io 8449fe72c1` — **all equal to main's**; only `v2` differs (`27a021adbf` = the branch tip) |

The round-5 INFO about the stale `draw-steel-elements` pin (`c2a5cec`) is resolved: it now
matches main at `98d5bd38c2`.

## 3. Item 3 — my three round-5 findings

| finding | status | proof |
|---|---|---|
| MEDIUM — CSS H1-hide predicate lacked the `p.sb-backlink` alternation (SC-301) | **CLOSED** | `steel-statblock.css:62-65` now carries the alternation. Measured: `minion-razor h1Visible: false` (round 5 measured `true`); at 375px the plate's top moved 259.6 → 171.4 as the heading and rule collapsed. `page-titles.e2e.cjs` **9/9** with all three minion pages asserting `h1 hidden`. Shot: `shots/sc297-r7-minion-razor-phone.png` — "RAZOR" appears once |
| LOW — `DESIGN.md:186` stated the *strict* adjacency | **CLOSED** | now reads `"Card page" means the h1+hr+card adjacency (SCChrome, sc-chrome.js — the single shared predicate every consumer resolves through), with one optional intervening <p class="sb-backlink"> allowed…` |
| LOW — `DESIGN.md:214` scoped the copy-link to three families | **CLOSED** | now `…injected into the chrome plate on all five card families (statblock, featureblock, ability, trait, kit)…` |

**No other page type lost its heading.** `page-titles.e2e.cjs` keeps `Read/heroes/classes/`
asserting `visible: true` and it passes. Independently, the affordance census records
`h1: true` on every non-card page sampled — `Read/bestiary/retainers/`, `Read/heroes/combat/`,
`Read/heroes/kits/`, `Read/summoner/other-summoners/`, `Browse/monster/minotaur/`,
`Browse/monster/demon/1st-echelon/`, `Browse/kit/`, `Bestiary/`, `pins/`, `preferences/` —
all with `chrome: 0`, `pageact: 1`.

**Scope of the CSS fix, re-verified independently.** The `+` combinator only matches the
*sibling* form, and only three pages have it: `grep -rlE '^<p class="sb-backlink">' docs/Browse/`
→ `razor.md`, `gorrre.md`, `violent.md`. The other 50 hits nest the paragraph inside the card
as a first child, where it never touched the adjacency. Correctly scoped, not over-matching.

## 4. Item 4 — nothing regressed

- **Unit** `node --test tests/*.test.js`: **86 tests, 86 pass, 0 fail** (82 + SC-177's 4).
- **Original e2e (8 files):** `cardhead-mobile`, `featureblock`, `nav-drawer-keep`,
  `page-titles`, `statblock-band`, `statblock-featstyle` pass; `featureblock-fixture` exit 2
  (`waitForSelector('.fb-wrap')` 30 s timeout on the 404 fixture) and `settings-panel` exit 1
  (`card: css var = 0.7 (0.8)` ×3) — byte-identical to every measurement since round 1.
- **SC-177's 2 e2e files**, run with `E2E_BASE=http://127.0.0.1:8124/`,
  `PLAYWRIGHT_PATH=~/.npm/_npx/e5af6bbc29da0270/node_modules/playwright-core`,
  `CHROMIUM_PATH=/opt/brave.com/brave/brave` per `.repo-docs/development.md`: **both pass** —
  "Custom-link browser checks passed…" and "Section browser checks passed: minions, encounter
  table, quick encounters, SCC redirect, missing heading, nested boundaries, persistence,
  mobile."
- **`chrome-panel.e2e.cjs`: 245 PASS / 0 FAIL.** **`page-titles.e2e.cjs`: 9/9.**
- **Censuses** (`r7-affordance.log`, `r7-sweep.log`): 52 + 4 pages,
  `both=0 cardpage-no-plate=0 stray=0 no-permalink=0`. Per-family phone geometry unchanged
  (plate 44.00px, reserve 47.50px, right gap 10.00, bottom delta 0.00; minion clearance +3.50px
  vs `P.sb-backlink`). Desktop: rest opacity 0, hover 1, print `none`, on all six pages.
  Instant-nav over six hops (statblock → ability → trait → kit → minion → Read chapter →
  statblock): exactly 1 plate and 1 anchor on every card hop with the right per-family items,
  0 plate / 1 pageact on the chapter. PNG export on a minion page: every control `display:none`
  under `sc-export-shooting`, `gorrre.png` downloaded, class cleared.
- **Copy-link gate delta over the same 1,603 pages: LOST 23, GAINED 185** — identical to round
  5, i.e. the rebase changed nothing. The 23 are 10 `Read/**` chapters (the intended D2 fix)
  and 13 plain `Browse` pages, all re-measured `isCardPage:false`, `chrome:0`, `pageact:1`.
- **Extra data point:** `Read/bestiary/monsters/`, the site's largest page (**415** embedded
  `.sb-wrap`), settles at `pageact:1` / `pageactBtns:2` / `chrome:0` / `copy:0` / `enc:0` /
  `h1:true` and stays there through 20 s. (It timed out once inside the bulk crawl at
  `domcontentloaded` 20 s under concurrent load — a probe-harness artifact, re-checked in
  isolation, not a defect.)

## 5. Findings

### LOW — an inline comment in the new CSS states a grep result that is false

`v2/docs/stylesheets/steel-statblock.css:60`

> `Only .sb-wrap carries a backlink today (confirmed: grep -rl 'sb-backlink' docs/Browse/ matches only the three minion pages)`

Measured: `grep -rl 'sb-backlink' docs/Browse/` matches **53** files (beastheart companions,
summoner rivals across all four echelons, two fixtures). Only
`grep -rlE '^<p class="sb-backlink">'` — the true preceding-**sibling** form the rule needs —
matches the three. The rule itself is correctly scoped (the `+` combinator can only match the
sibling form), and the round-6 **commit message** states the distinction correctly, so this is
comment drift, not a behaviour or gate defect. But it is precisely the kind of inline
"funky logic" note the workspace CLAUDE.md says must be accurate: a future editor reading only
the comment would believe 3 files contain the class and could widen or drop the rule on a false
premise.

**Fix (one line):** replace the parenthetical with
`confirmed: grep -rlE '^<p class="sb-backlink">' docs/Browse/ matches exactly the three minion
pages — the other ~50 'sb-backlink' hits nest it INSIDE the card as a first child, where it
never touched the adjacency`.

### INFO — landing only: both mains moved again after the round-6 rebase

Not a defect in this delta; recorded so the landing step does not repeat round 5's surprise.

- `v2` `origin/main`: `e83421a61d` → **`e2b6a9727621dfe6ede75c56fb8ebbb5547cd9ba`**
  (`feat: make My Table controls and headings compact (SC-300)`).
- superproject `origin/main`: `f5fe049437` → **`021cf25ac702d4d627b4c5ba3c58d10ccfad97d0`**
  (`chore: bump v2 to e2b6a97276` + `docs: record SC-300 deployment`).

**Conflict risk is low, and I checked why:** SC-300's `sc-pins.js` hunks are entirely inside
`mountLinkForm()` (a toolbar + collapsible form), a different function from round 4's
`mountPinButton()`; its `steel-pins.css` change is a pure append at line 94+, while the branch's
edits are at lines 1-40. It also adds `tests/e2e/pins-layout.e2e.cjs` and touches
`pins-sections.e2e.cjs` and `.repo-docs/development.md`. So the next rebase should apply as
cleanly as round 6's did — but it must be done, and the re-run should include the new
`pins-layout.e2e.cjs` alongside SC-177's two.

## 6. Artifacts

Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/sc297-round7-rereview-report.md`

Shots (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/shots/`):
`sc297-r7-pinboard.png` (pin flow + SC-177 section fold side by side),
`sc297-r7-minion-razor-phone.png` (SC-301 closed — one title),
`sc297-r7-minion-razor-dark-hover.png`,
`sc297-r7-{statblock,ability,featureblock,trait,kit,minion-razor}-phone.png`

Logs & probe scripts (scratchpad
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/`):
`r7-mkdocs-build.log`, `r7-unit.log`, `r7-chrome-panel.log`, `r7-page-titles.log`,
`r7-e2e-summary.log`, `r7/r7-e2e-*.log`, `r7-gatecrawl.log`, `r7-affordance.log`,
`r7-sweep.cjs`/`.log`, `r7-pinflow.cjs`/`.log`, `r7-board-shot.cjs`, `r7-monsters.cjs`,
`r7-run-e2e.sh`, `r7-spot.txt`
