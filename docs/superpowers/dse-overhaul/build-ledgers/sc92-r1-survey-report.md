# SC-92 round 1 — survey report: signature-ability filter for the feature browser

## Executive summary

1. **`cost` is already in the island.** `browseItem.Cost` ships on all 621 abilities, and
   `"Signature"` is already synthesized from `subtype: signature` (feature_index.go:355-357).
2. **Counts:** 621 abilities = **100 Signature** + 405 resource-cost + 116 no-cost. 49 distinct
   raw cost strings — far too many for one chip row.
3. **Resource name is 1:1 with class** (Wrath⇔Censor, Piety⇔Conduit, Ferocity⇔Fury+Beastheart…),
   so a "Resource" chip row would duplicate the existing Source facet. Reject.
4. **Cost *amount* is the only cross-class axis:** exactly 6 values (1, 3, 5, 7, 9, 11).
5. **Recommendation: a `Cost` chip row of 8 chips — `Signature`, `No cost`, `1/3/5/7/9/11`** —
   derived **client-side** in `steel-feature-browser-core.js`. **No steel-etl change at all.**
6. Cards **already render cost** (preview tag + leaf cost badge), so SC-90's "shows on its face
   why it matched" rule is satisfied for free — **no card or CSS change needed**.
7. **Baselines (clean tree, both green):** steel-etl `go test ./...` → 8 packages `ok`, exit 0.
   v2 `node --test tests/*.test.js` → **105 pass / 0 fail**, exit 0.

---

## Q1 — SC-90 end-to-end map

Two commits, one per repo:

- steel-etl `b5cd0d9` "feat(site): filter abilities by condition (SC-90)" — 7 files, +657/-4
- v2 `8ba4b48aa1` "feat(browse): Condition facet + condition chips on ability cards (SC-90)" —
  2 files, +25/-5

### steel-etl (build side)

| File | What SC-90 did |
|---|---|
| `internal/site/conditions.go` (new, 245 ln) | Derivation. `conditionSlugs` vocabulary; `extractConditions(fm, body)`; `conditionMechanicalText` drops flavor; `conditionsAttr`; `conditionsForPreview`. |
| `internal/site/ability_cards.go:298-306` | `renderAbilityCard` stamps `data-conditions="…"` on the `.sc-ability` article (abilities only). |
| `internal/site/feature_index.go:317` | `browseItem.Conditions []string \`json:"conditions,omitempty"\`` |
| `internal/site/feature_index.go:370` | `it.Conditions = conditionsForPreview(fm, body)` in `extractPreviewItem` (ability branch). |
| `internal/site/feature_index.go:~528-540` | `renderAbilityPrev` emits `sc-prev__chip--cond` chips after the keyword chips. |
| `internal/site/feature_index.go:638-641` | `buildFeatureBrowseSection` blurb: added "or condition" + an italic explainer paragraph. |
| `internal/site/conditions_test.go` (new, 293 ln) | Incl. `TestConditionVocabularyMatchesBookSources` — re-derives the vocabulary from all four books so a 10th condition fails the build. |
| `internal/site/feature_index_test.go:+399..+455` | `TestBuildFeatureIndex_IslandCarriesConditions` — island carries `conditions`, preview chips them. |
| `docs/site-builder.md:229-263` | New `### internal/site/conditions.go` section (vocabulary / match rule / v1-ANY / carrier). |
| `CLAUDE.md` | one line. |

**The carrier trick:** condition data travels build-side as an HTML `data-` attribute on the
rendered card and is *read back* by `extractPreviewItem` — the same trick trait cards use for
`data-grant`/`data-sub`. An empty attribute means "derived, none" and is honoured.

### v2 (client side)

| File:line (current) | What SC-90 did |
|---|---|
| `docs/javascripts/steel-feature-browser.js:19-24` | Item-shape doc comment gains `conditions?`. |
| `docs/javascripts/steel-feature-browser.js:99-107` | `abilityCard()` concatenates keyword chips + `sc-prev__chip--cond` condition chips. Mirrors `renderAbilityPrev` in Go — the two must stay in step. |
| `docs/javascripts/steel-feature-browser.js:167` | **One facet descriptor**: `{ key: "conditions", label: "Condition", values: uniqueSorted(null, items, "conditions"), display: cap }`, placed between Keyword (163) and Track (168). |
| `docs/stylesheets/steel-indexes.css:36-38, +[default] override` | `--sc-cond` rose accent token (dark `#c98a9b`, light `#9c5164`). |
| `docs/stylesheets/steel-indexes.css:~227-230` | `.sc-prev__chip--cond { color/border-color }`. |

**No JS logic change was needed** — the facet registry is data-driven. `sc-facet-core.js`
(`matchesPicks`, `isMultiValued`, 62 ln) and `steel-feature-browser-core.js` (80 ln) were
**untouched**; the any/all toggle came free because `conditions` is array-valued
(`steel-feature-browser.js:172`, `.filter(f => f.values.length > 1)` at :169).

### Tests / docs SC-90 touched

- Go: `conditions_test.go` + `feature_index_test.go` (above).
- v2 node: **none added.** `tests/sc-facet-core.test.js` and
  `tests/steel-feature-browser-core.test.js` predate SC-90 and were not changed.
- e2e: **none.** No e2e file covers the feature browser or its facets.
- Docs: `steel-etl/docs/site-builder.md`, `steel-etl/CLAUDE.md`,
  workspace `CHANGELOG.md:128-137` (an 11-line user-facing bullet). Nothing in `v2/.repo-docs/`.
  There is **no `v2/docs/superpowers/specs` directory** and no facet spec anywhere.

---

## Q2 — how "signature" is represented

### Source of truth

Signature is a **book-source annotation**, not a cost: `<!-- @type: ability | @subtype: signature
| @id: … -->` in `steel-etl/input/`. Exactly **100** occurrences:

- `steel-etl/input/heroes/Draw Steel Heroes.md` — 81
- `steel-etl/input/beastheart/Draw Steel Beastheart.md` — 19
- monsters, summoner — **0**

`grep -rn "cost: Signature" steel-etl/input/` → **0**: no book ever writes `Signature` as a cost.

### The synthesis (duplicated in two places — note for the implementer)

```go
// steel-etl/internal/site/feature_index.go:355-357   (island / preview card)
it.Cost = strings.TrimSpace(parseFrontmatterField(fm, "cost"))
if it.Cost == "" && parseFrontmatterField(fm, "subtype") == "signature" {
    it.Cost = "Signature"
}
// steel-etl/internal/site/ability_cards.go:174-176   (full leaf card) — byte-identical logic
```

So `cost` is **already a first-class island field** (`browseItem.Cost`, feature_index.go:312,
`json:"cost,omitempty"`) and already carries the literal string `"Signature"`. Round 2 needs
**no new derivation and no data-contract change** — unlike SC-90, which needed all of
`conditions.go` because nothing in the data recorded condition-mention.

The two copies of the synthesis are a latent drift hazard; if round 2 touches this, lift it to
one helper (e.g. `abilityCost(fm) string`) called from both.

### Distribution — all 621 abilities in the island (`v2/docs/Browse/feature/index.md:97`)

| Cohort | Count |
|---|---|
| `"Signature"` | **100** |
| resource cost (`<n> <Resource>`) | **405** |
| `""` (no cost) | **116** |

**49 distinct raw `cost` strings** (incl. `""`) — a raw Cost facet is unusable on mobile.

Decomposed:

- **Amount** — only 6 values: `1`×3, `3`×42, `5`×106, `7`×40, `9`×108, `11`×106.
- **Resource** — 9 values, and each maps to **exactly one class** (only Ferocity is shared):
  Ferocity {Beastheart 44, Fury 38}, Piety {Conduit 57}, Drama {Troubadour 40},
  Insight {Shadow 40}, Clarity {Talent 39}, Wrath {Censor 39}, Discipline {Null 38},
  Focus {Tactician 38}, Essence {Elementalist 32}.

Signature by source: class 67, **kit 25**, ancestry 8. By action: main 84, maneuver 16.
No-cost by class: Summoner 26, Troubadour 17, Elementalist 13, Beastheart 10, Conduit 9,
Talent 8, Shadow 8, Censor 7, Common 7, Tactician 5, Fury 4, Null 2.

### Edge cases

- **Kit signature abilities (25)** — `source: kit`, name shape "Kit (Ability)"
  (`ability_cards.go:147` `kitAbilityNameRe`). They carry `@subtype: signature` like any other
  and land in the 100 cleanly. No special handling needed.
- **Beastheart companion signatures (19)** — likewise ordinary `subtype: signature` abilities on
  the feature browser (klass `Beastheart`). In scope.
- **Missing cost (116)** — real abilities with no cost line (triggered abilities, class-feature
  abilities, summoner minion abilities). They are *not* signature. A facet must not silently
  fold them into Signature.
- **`cost` is ability-only** — verified: **0** non-ability items in the island carry `cost`
  (`extractPreviewItem` sets it only in the `kind == "ability"` branch). Picking any Cost chip
  will therefore hide all 876 features + 95 traits, exactly as the Keyword and Condition facets
  already do.
- **Statblock "Signature Ability" is out of scope.** 442 occurrences in
  `input/monsters/Draw Steel Monsters.md`, 26 in summoner, 1 in beastheart — these are *monster
  statblock* ability labels, which render on the **Bestiary** browser, a different surface.
  `v2/docs/javascripts/steel-bestiary-browser.js:66-71` shows its facets are
  Type / Role / Organization / Size / Keyword — **no cost or signature facet today**, and it is
  a sortable table, not a card grid. The heroes book's 33 "Signature Abilit*" hits are section
  *headings* (`##### Signature Abilities`) plus the `rule.combat/signature-ability` rule page.

**The ticket's surface is the feature Search & Filter page** — the `sc-browse-mount` island in
`v2/docs/Browse/feature/index.md`, built by
`steel-etl/internal/site/feature_index.go:627 buildFeatureBrowseSection`.

---

## Q3 — recommended shape

### Recommendation: a **`Cost`** chip row — `Signature` · `No cost` · `1` `3` `5` `7` `9` `11`

Eight chips, placed **between Action (:162) and Keyword (:163)** — cost sits next to action on
the card head, so the facet order mirrors the card. Derived **client-side**; **steel-etl is not
touched**.

### Why not the alternatives

- **(a) A single `Signature` toggle chip.** Under-delivers against Scott's "right thing, not the
  minimal thing" rule, and it fights the machinery: `steel-feature-browser.js:169` drops any
  facet with `values.length <= 1`, so a one-value row needs a special case. A 2-value
  Signature/Not-signature row is worse — "Not signature" is meaningless for the 971 non-ability
  items. Rejected.
- **(b) A general Cost facet over the raw strings.** 49 chips (or 48 + "none"). Unusable at
  ~400px; the row would wrap five deep and bury the one chip the ticket asks for. Rejected.
- **(b′) Cost facet keyed on resource name** (`Signature` + Ferocity/Piety/…, 10 chips). Looks
  tidy but is **near-pure redundancy**: the Q2 table shows resource → class is 1:1 except
  Ferocity. Picking "Wrath" is picking "Censor", which the Source facet already does better
  (it also carries subclasses). Rejected.
- **(c) Keyed on cost *amount* + `Signature` + `No cost`** — **recommended.** Amount is the only
  axis of the cost string that is *not* already a facet: 6 values, cross-class, and it composes
  with Source ("my Censor's 5-cost options") the way SC-90's Condition composes with Keyword.

### Layout / consistency check

Today's rows are Type (3) · Source (merged class+subclass group) · Level (~10) · Action (~6) ·
Keyword (~20) · Condition (9) · Track (2). An 8-chip Cost row is mid-pack — smaller than Keyword,
comparable to Condition. Mobile-safe.

**Scalar, not array** ⇒ `FacetCore.isMultiValued` returns false ⇒ **no any/all toggle**, which is
correct (an ability has one cost; AND is unsatisfiable). Same as Type/Level/Action/Track.

**"Shows on its face why it matched" is already satisfied — no card change.** `abilityCard()` at
`steel-feature-browser.js:93-97` already renders `it.cost` into `.sc-prev__tag`, and the Go
mirror `renderAbilityPrev` at `feature_index.go:525` (`RightPrimary: hMini(it.Cost)`) does the
same; the leaf card renders it via `costBadge` (`ability_cards.go:473`). A card filtered to
`Signature` already reads "Signature" in its top-right. This is the big difference from SC-90,
which had to invent a chip family and a CSS accent.

### Files to touch

**steel-etl — none.** (Optional cleanup only: fold the duplicated Signature synthesis at
`feature_index.go:355-357` / `ability_cards.go:174-176` into one helper.)

**v2:**

1. `docs/javascripts/steel-feature-browser-core.js` — export a pure
   `costFacetValue(cost)`: `"Signature"` → `"Signature"`; `/^(\d+)\s/` → the amount as a string;
   `""`/undefined → `"none"`. Keep it DOM-free and in the UMD export block (:73-79) next to
   `matchesSource`, so node:test can reach it.
2. `docs/javascripts/steel-feature-browser.js`
   - `mount()` (~:155, after `items` is parsed): stamp the derived key on **abilities only** —
     `items.forEach(it => { if (it.kind === "ability") it.cost_tier = Core.costFacetValue(it.cost); });`
     Leaving it `undefined` on features/traits is what makes the `No cost` chip select the 116
     abilities and not the 971 non-abilities.
   - Insert the descriptor into the `facets` array between :162 and :163 with an **explicit
     ordered `values`** (do not use `uniqueSorted` — its `localeCompare` sorts `11` before `3`):
     `["Signature","none","1","3","5","7","9","11"].filter(v => present)`, with
     `display: v => v === "none" ? "No cost" : v === "Signature" ? "Signature" : v`.
   - Update the item-shape doc comment at :19-24.
3. `docs/stylesheets/steel-indexes.css` — **no change required.** (Only if the owner wants a
   chip dot: add a `dot:` fn to the descriptor, per `facetRow` at :302.)
4. `mkdocs.yml:168-170` — **no change**; `steel-feature-browser-core.js` already loads before
   `steel-feature-browser.js`.

### Tests to add

- `v2/tests/steel-feature-browser-core.test.js` — `costFacetValue`: `"Signature"` →
  `"Signature"`; `"11 Discipline"` → `"11"`; `"1 Drama"` → `"1"`; `""`/`undefined` → `"none"`;
  a malformed/odd string falls through predictably.
- Same file — an integration-style case over a small fixture asserting that
  `FacetCore.matchesPicks(it.cost_tier, {Signature:true}, "any")` picks only the stamped
  abilities and never a feature/trait (`cost_tier === undefined` must not match `"none"`).
- **steel-etl: no new test needed** — `feature_index_test.go:78-91`
  (`TestExtractPreviewItem_Ability`) already pins `subtype: signature → Cost == "Signature"`, and
  :109 pins that the preview head renders it.

### Gate commands + baselines (both run this round on the clean worktree)

```
devbox run -- bash -c 'cd <wt>/steel-etl && go test ./...'
  → exit 0; ok: cli, content, context, output, parser, pipeline, scc, site (8 pkgs);
    cmd/steel-etl = no test files.  EXPECT UNCHANGED (no steel-etl change).

devbox run -- bash -c 'cd <wt>/v2 && node --test tests/*.test.js'
  → exit 0; tests 105, pass 105, fail 0.  EXPECT 105 + (new cases).
```

e2e and `steel-etl site` were **not** run, per the brief.

---

## Q4 — docs routing for "done"

| Doc | Required? | What goes in |
|---|---|---|
| `<wt>/CHANGELOG.md` under `## Unreleased` (line 9; **worktree copy, never `workspace/`**) | **Yes** | One user-facing bullet modelled on the SC-90 entry at :128-137: the Cost chip row, "100 signature abilities in one click", that it composes with Source/Level/Action/Keyword/Condition, and that the chip is the cost the card already shows. |
| `v2/docs/javascripts/steel-feature-browser.js:19-24` | **Yes** | The item-shape comment is the de-facto contract doc — add `cost_tier` and say it is client-derived from `cost`, abilities only. |
| `steel-etl/docs/site-builder.md` | **No** (but one line is cheap) | SC-90 needed a section because the derivation was build-side. SC-92's is client-side. If touching the duplicated Signature synthesis, note it near the feature_index/ability_cards description. |
| `v2/.repo-docs/*` | **No** | SC-90 added nothing there; grep finds one incidental "facets" mention in `decisions/2026-09-06-custom-search-worker.md:66`. An ADR is not warranted for one facet row. |
| `v2/docs/superpowers/specs` | **N/A** | **Directory does not exist.** No facet spec exists in the repo. |
| `<wt>/AGENTS.md`, `docs/scc-log.md` | **No** | No SCC scheme, pipeline, deploy-flow or remote change. |

---

## Open question for the ticket-owner

The literal ticket is "filter for signature abilities" (1 chip). The recommendation ships 8
chips because a bare toggle fights the `values.length > 1` guard and under-delivers on the
consistency rule. If that reads as scope creep, the tight trim is
**`Signature` · `No cost` · `Resource`** (3 chips, amount collapsed) — still a well-formed row,
still no steel-etl change, same files, same tests. Flagging rather than deciding, since Scott's
"do the right thing" rule and "don't gold-plate" can both be read onto this one.

## Provenance

Worktree `/home/scott/code/steelCompendium/worktrees/sc92-sig-filter` — read-only this round;
`git status --porcelain` empty before and after. Superproject `728f514`, steel-etl `f90da5f`,
v2 `55dc19639f`.
