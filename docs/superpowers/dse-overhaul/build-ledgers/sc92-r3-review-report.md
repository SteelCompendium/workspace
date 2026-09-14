# SC-92 round 3 — independent review of the `Cost` facet

## Executive summary

**APPROVE** — the implementation matches the ledger's Shape decision and every gate I re-ran
myself is green. 0 HIGH · 1 MEDIUM · 3 LOW · 6 INFO. Measured: `node --test tests/*.test.js`
**114 pass / 0 fail, exit 0** (baseline 105 + exactly 9 new `test()` calls); fresh `just build`
exit 0 (256.6s, `docs/Browse|Read|scc|pins.md` clean before *and* after); the new
`tests/e2e/feature-browser-cost.e2e.cjs` **14/14 checks ok, exit 0** (Signature 100,
Signature+No cost 216, Signature+Conduit 8); my own 20-check regression probe (keyboard, clear,
existing facets, re-navigation) **20/20 ok, 0 page errors**. All **49** distinct island cost
strings map onto the 8 chips — **zero** land on `"other"`; **zero** non-ability items are
selectable by `No cost`. The one MEDIUM is not a code defect: the v2 worktree carries an
unrelated dirty `devbox.lock` that will hard-abort `just wt-finish` at landing. Nothing fixed —
findings only; tree left exactly as found (` M v2` / ` M devbox.lock`, same as at start).

---

## MEDIUM

### M1 — dirty `v2/devbox.lock` will block `just wt-finish`
`/home/scott/code/steelCompendium/worktrees/sc92-sig-filter/v2/devbox.lock` (unstaged;
`python3@latest.plugin_version` `0.0.4` → `0.0.5`, mtime 22:23 — i.e. produced during round 2,
present before I touched anything). The main checkout's `v2/devbox.lock` is clean, so this is
pure worktree churn from running devbox inside `v2`, unrelated to SC-92.

Failure scenario: the dispatcher commits the v2 pointer bump, then runs `just wt-finish
sc92-sig-filter`. That recipe's first guard is
`if [ -n "$(git -C "$wt" status --porcelain)" ]` (workspace `justfile`, `wt-finish` body) — and a
submodule with dirty *content* still reports ` M v2` in the superproject's porcelain output even
when the pointer is committed. I reproduced this from scratch in a throwaway super/sub pair:
content-only dirt in the submodule yields `[ M sub]`. So `wt-finish` aborts with
`[ERR] Commit or discard changes in sc92-sig-filter first.`

Fix (before landing, dispatcher): `git -C /home/scott/code/steelCompendium/worktrees/sc92-sig-filter/v2 checkout -- devbox.lock`.
Do **not** commit it onto the SC-92 branch — it is unrelated churn.

---

## LOW

### L1 — `costTierValues` puts a future amount after `11`
`v2/docs/javascripts/steel-feature-browser-core.js:111-125`. `COST_TIER_ORDER` hard-codes the
amounts that happen to exist today (`1,3,5,7,9,11`); anything else is pushed into `extra` and
appended *after* the known list. Measured directly against the shipped helper:

```
costTierValues([… "2" …]) → ["Signature","none","1","3","5","7","9","11","2"]
```

Failure scenario: a future book (or an errata) introduces a `2 Focus` ability; the chip row then
reads `Signature · No cost · 1 · 3 · 5 · 7 · 9 · 11 · 2` — the value stays filterable (good,
that's the stated intent) but the row is no longer in the ascending order the brief and the
commit message promise, and the e2e's "ascending numeric order" check would start failing.
Prescribed fix: stop enumerating amounts. `var COST_TIER_HEAD = ["Signature", "none"];` then
partition the present tiers into numerics (sorted `na - nb`) and non-numerics (sorted
`localeCompare`), returning `head-present ∪ numerics ∪ others`. Same output today, correct
forever, and ~4 lines shorter. (Not a today-bug: the data is a fixed set — see the mapping
table below — so I did not weight this higher.)

### L2 — JSDoc misattributes the fallback's location
`v2/docs/javascripts/steel-feature-browser-core.js:86-88` says the unlisted-tier fallback is
"the `values` fallback in steel-feature-browser.js's facet descriptor". It is not — it lives in
`costTierValues` twenty lines below, in the same file; `steel-feature-browser.js:179` only calls
it. Failure scenario: a future maintainer edits `steel-feature-browser.js` looking for ordering
logic that is not there (this is exactly the file-map confusion the implementer flagged in their
own report). Fix: reword to "see `costTierValues` below".

### L3 — CHANGELOG bullet overstates the card-face claim, and the bare numerals go unexplained
Worktree superproject `CHANGELOG.md:138-143` (commit `f6a916faab`). Three nits, all user-facing:
1. "The chip is the same cost the card already shows in its head, so a filtered result reads
   'Signature' on its face" — true for `Signature` and the amount chips, but a no-cost ability
   renders **no tag at all** (`v2/docs/javascripts/steel-feature-browser.js:103`,
   `var tag = cost ? … : ""`). Filter to **No cost** and nothing on the card face says so.
2. The chip list "1, 3, 5, 7, 9, 11" is unexplained for Scott's non-technical readers — these are
   *class-resource amounts* (Piety, Focus, Ferocity …), and the chips deliberately drop the
   resource name.
3. The composability list omits **Type** and **Track**, which compose too.

Prescribed fix: "…or the amount of your class resource it costs (1, 3, 5, 7, 9, 11)… composes
with every other facet on the page (e.g. …)"; and either drop the card-face sentence or scope it
to "a costed result reads its cost on its face".

---

## INFO

### I1 — the `{value, unit}` cost branch is unreachable for this island
`steel-etl/internal/site/feature_index.go:312` types the island field as
`Cost string \`json:"cost,omitempty"\`` — it can only ever emit a string or omit the key. I
measured 0 object-shaped costs across all 1592 items. The branch at
`steel-feature-browser-core.js:90-94` (and its two tests) is defensive only; the reference to
`steel-ability-cards.js:53` is accurate (that file's `renderCost` really does accept the object
shape, from a different data source). Keep it; no change needed.

### I2 — facet semantics all verified live
Row is **scalar**: `FacetCore.isMultiValued(items,"cost_tier")` → `false` (string-valued), so no
any/all toggle renders — confirmed in-browser (`.sc-facet-mode` exists only on `keywords` and
`conditions`). `No cost` selects exactly the **116** no-cost abilities and **0** features/traits
(`cost_tier` is left `undefined` on non-abilities; `FacetCore.valuesOf(undefined) → []`, so
`"none"` can never match). AND-across-rows composes normally (Condition `bleeding` 19 →
+Signature 4; Source Conduit + Signature → 8; the search box narrows on top of both).

### I3 — there is no URL/hash state on this page
`grep` for `location.hash` / `history.replaceState` / `searchParams` across
`steel-feature-browser*.js` and `sc-facet-core.js` returns nothing — facet state is in-memory
only, so there is no serialization for the new row to join. "Clear filters" and the result
counter are generic over the `facets` array (`steel-feature-browser.js:235`, `:290-297`), so they
picked the Cost row up for free — verified live: clear resets chips, `aria-pressed`, `is-on` and
the count to 1592. `mkdocs.yml` is untouched by the delta and the load order still reads
`sc-facet-core.js` (168) → `steel-feature-browser-core.js` (169) → `steel-feature-browser.js`
(170). `docs/Browse/feature/index.md` is the only page in the site that mounts the browser.

### I4 — `Signature` is exactly the signature set
100 `subtype: signature` blocks in `steel-etl/input/`, 100 `cost: "Signature"` items in the
island, 100 selected by the chip. The synthesis at `feature_index.go:355-357` only fires when
`cost` is empty — I checked for a signature ability that also declares a cost (which would be
silently missed by the chip): **0 exist**, in any of the four books.

### I5 — landing mechanics (for the owner, not a defect)
The v2 branch still sits on `55dc19639f`; `origin/main` in the worktree clone is **stale** at
that same sha and must be fetched. The real v2 `origin/main` is `e1b3a961` (one commit, only
`docs/stylesheets/custom_font.css`) — `55dc19639f` is an ancestor of it, so `wt-finish`'s
`push origin sc92-sig-filter:main` is a **non-fast-forward** until the branch is rebased.
Contrary to the ledger's rebase note, I expect **no CHANGELOG conflict** on the superproject
rebase onto `2caf81b`: that range's only CHANGELOG hunk inserts at line 10 (top of `Unreleased`),
while SC-92's bullet is at line 138. Superproject branch content is exactly one commit
(`f6a916faab`, CHANGELOG only); the `v2` pointer bump is correctly left unstaged.

### I6 — hygiene, all clean
No AI/co-author/`Claude`/`Generated with` trailers in `b673df5cc5`, `54a3c18a11`, or
`f6a916faab`. The v2 delta is exactly 4 files (`docs/javascripts/` ×2, `tests/` ×2) — nothing
under `docs/Browse|Read|scc` or `site/`. `just search-bench --gate` skip is correctly justified
(`v2/AGENTS.md` scopes it to search-ranking changes; nothing here touches the worker or index).
`tests/e2e/*.e2e.cjs` are run by hand per AGENTS.md — there is no e2e registry the new file
needed to be added to. I re-ran the screenshot script and got byte-for-byte-comparable PNGs
(165192/82249/254494/166852 vs the committed 165186/82249/254494/166837), so the evidence is
reproducible.

---

## Measured data (the correctness probe the brief asked for)

Island `v2/docs/Browse/feature/index.md`: **1592 items** — 621 ability, 876 feature, 95 trait.
**49 distinct ability cost strings** (matches the survey), **0 object-shaped**, **0 mapping to
`"other"`**, **0 mapping outside the chip list**. Every string is either `Signature`, absent, or
`<n> <Resource>` for n ∈ {1,3,5,7,9,11} across Ferocity/Piety/Wrath/Discipline/Clarity/Drama/
Insight/Focus/Essence.

| tier | Signature | none | 1 | 3 | 5 | 7 | 9 | 11 |
|---|---|---|---|---|---|---|---|---|
| abilities | 100 | 116 | 3 | 42 | 106 | 40 | 108 | 106 |

`costTierValues` over the real island → `["Signature","none","1","3","5","7","9","11"]` (exactly
the chip list, in the specified order). Selections: Signature **100**, No cost **116**,
Signature∪No-cost **216**, Signature∩Conduit **8** — all three match the implementer's numbers
and the CHANGELOG.

---

## Vision notes (the four screenshots)

- **`sc92-shot-facets-desktop.png`** — the Cost row sits between **Action** and **Keyword**,
  with the same hairline rule above it, the same small-caps row label in the 5.5rem label
  column, and the same pill chips as its siblings. Chips read `SIGNATURE · NO COST · 1 · 3 · 5 ·
  7 · 9 · 11`, one line, no wrapping, label baseline aligned with the first chip. One thing to
  expect and *not* mistake for a defect: the two word chips render small (small-caps letters)
  while the six numerals render at full height — that is `font-variant: small-caps` +
  `text-transform: lowercase` on `.sc-chip` (steel-indexes.css:291-295) acting on digits, and it
  is exactly how the **Level** row already looks (`LV` small, `1`/`10` tall). It reads as a
  deliberate family trait, not an accident. No CSS was added by this change.
- **`sc92-shot-signature-selected.png`** — the selected `SIGNATURE` chip takes the standard
  is-on treatment: solid dark-teal fill with near-white text, identical to a selected chip in any
  other row; every unselected chip keeps its outlined, unfilled look, so the single selection is
  unambiguous even without relying on hue. Counter reads **100 of 1592 features**, the
  "Clear filters" link has appeared at the right of the same line, and the first result card
  (ABSORB, Maneuver) carries a boxed **SIGNATURE** tag at the top-right of its head — crisp and
  fully legible at 1280px. (A Material "Back to top" pill floats over two Source chips here —
  that is scroll chrome, not layout damage.)
- **`sc92-shot-facets-mobile.png`** — at 400px the row stacks label-above-chips like every other
  row and wraps to two lines (`SIGNATURE · NO COST · 1 · 3 · 5` / `7 · 9 · 11`) with even
  gutters; no clipping, no horizontal scrollbar (the e2e also asserts
  `scrollWidth <= innerWidth`, which passed on my run).
- **`sc92-shot-signature-plus-conduit.png`** — counter reads **8 of 1592 features**; the two
  visible cards (BLESSED LIGHT, DRAIN) both show the **SIGNATURE** tag and a `from Conduit · Lv 1`
  footer. Minor evidence gap: the Source row is above the fold, so the frame cannot show the
  Conduit chip in its selected state — the card footers are what carry that proof. If Scott wants
  a single self-evident frame, scrolling so the Source and Cost rows and the counter share the
  viewport would do it.
- Two forward-looking notes: (a) these shots predate the SC-315 rebase, so display-face card
  names (ABSORB, BLESSED LIGHT) will carry a finer outline in the landed build — cosmetic, does
  not affect the facet; (b) a taste call still open for Scott — the amount chips are bare
  numerals with no resource name, so `Cost · 5` leans entirely on the row label for meaning. The
  ledger's trim option (`Signature · No cost · Resource`) remains cheap to swap in.
