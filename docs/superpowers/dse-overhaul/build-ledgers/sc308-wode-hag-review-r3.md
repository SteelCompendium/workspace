# SC-308 review — round 3 (FULL independent review of the `effects[]` body model)

Reviewer: independent (did not author the branch). Delta: steel-etl `0eab815..8a4ce06`,
data-sdk-npm `7a18926..69c8d49`, superproject `ca88d94`; regression base steel-etl `5035174`.

## Executive summary (≤10 lines)

1. **Verdict: FIX-NEEDED.** 2 CRITICAL, 1 IMPORTANT, 4 LOW, 6 INFO.
2. Gates all pass: `gofmt -l` 10 files (all pre-existing, none touched), `go vet` clean,
   `go test -race -count=1 ./...` **8/8 ok**, `gen --all` exit 0, `site --config ../v2/site.yaml` exit 0.
3. Golden diff (24 hunks, 4 files) judged hunk-by-hunk: every hunk is a reorder, a nest, or a
   field rename — **no lost or duplicated text in the golden**.
4. Snackies for Sweeties, Caustic Detonator, No Escape, Overpower, Roll the Wheel, Turned Upside
   Down, Corrosive Claws, Soul Steal, dice-in-title, retainer, malice, terrain: **all match the rulings**
   in both data shape and DOM order. Screenshots genuine and matching.
5. **BUT the regenerated site loses rendered content on 63 pages** (650 line instances) vs base —
   two render regressions this branch introduces (C-1, C-2), invisible to the test suite and the golden.
6. Schema: **164 failing docs at base `5035174` and 164 at HEAD**, identical error keys
   (`keywords` 119 / `weaknesses` 58 / `immunities` 27) — 0 introduced, 0 touching `effects`/`roll`/
   `tier*`/`name`/`cost`/`trigger`. Both schema copies byte-identical; HEAD data validates identically against each.
7. Consumer breaks: **none.** `draw-steel-elements` already handles all three shapes; the other three repos have no readers.
8. Data regression sweep: 4968 data files changed, **0 added, 0 removed**; site 324 changed, 5 only-in-HEAD (protected static paths).
9. `docs_dir` guard verified live: `site --config pipeline.yaml` in a scratch copy exits 1 with a clear error and deletes nothing.
10. Hygiene clean: no attribution trailers, nothing pushed, no generated output committed, main checkout untouched.

---

## CRITICAL

### C-1 — Statblock site cards silently drop every labeled section of a table-less feature (22 monsters)
`internal/site/statblock_page.go:544-550` (`f.Effects = nil` at :549) + `internal/site/statblock_card.go:154`.

`parseStatblockIslandFeature` routes a labeled paragraph into `f.Effects` and only unlabeled prose into
`prose`. The `!tableSeen` (passive-trait) branch then sets `f.Body = strings.Join(prose,…)` and **`f.Effects = nil`**.
A trait whose whole body is labeled paragraphs therefore ends with `Body == ""` and `Effects == nil`, and
`renderStatblockFeature` renders the head and nothing else. At base the same feature's `Sections` were rendered.

Failure scenario (reproduced): `Browse/monster/arixx/arixx.md` — the "Solo Monster" trait's **End Effect**
and **Solo Turns** sections are present at `5035174` and gone at `8a4ce06`. Same for ajax-the-invincible,
ashen-hoarder, bredbeddle, chimera, count-rhodar-von-glauer, 5 dragons, fossil-cryptic, kingfissure-worm,
lich, lord-syuul, shambling-mound, werewolf, xorannox-the-tyract, wode-hag, … — **22 statblock entities,
23 named entries** (measured over the regenerated JSON: table-less features carrying a named `effects[]`
entry). `Read/bestiary/monsters.md` alone loses 19 "End Effect" sections. The same branch also erases the
two Effect sections of the malformed-table pseudo-feature on `Browse/monster/gnoll/gnoll-cackler.md`
(base rendered them in a garbage card; HEAD renders nothing at all).

Note the DATA path is correct here — `wode-hag.json` keeps both entries; only the site render loses them.

Prescribed fix: do not null `Effects` in the `!tableSeen` branch. Set `Kind/Action = passive` and let the
normal `Effects` walk render the body; keep `f.Body` only for the all-bare-prose case, and in
`renderStatblockFeature:154` render `Body` **and** then fall through to the `Effects` walk (or drop `Body`
entirely, since bare prose is already an `Effects` entry). Add a regression test with a table-less feature
whose body is two labeled paragraphs (the "Solo Monster" shape).

### C-2 — Featureblock cards render EMPTY when the feature has no `effects` (14 companion advancement blocks, 42 features)
`internal/site/featureblock_page.go:469` (`for _, e := range f.Effects`) + `internal/content/monster.go:419` (`collectChildFeatures`).

`renderFbFeat` now walks `f.Effects` **exclusively** — the flat `Body`/`Sections`/`PowerRoll`/`Enhancements`/
`Intro`/`Trailing` frontmatter fields are no longer read at render (documented as intentional in
`docs/statblocks.md`). But not every featureblock feature comes from `parseRichFeature`:
`collectChildFeatures` builds `RichFeature{Name, Body, Level}` from heading-based children with **no
`Effects`**, so `ToMap` emits `body:` and no `effects:` — and the card renders as a bare heading.

Failure scenario (reproduced): `Browse/monster/companion/beastheart/basilisk-advancement-features.md` —
"Foes Forever Frozen", "Rock Smasher", "Heart of Stone" render as three empty `article.fb__feat` shells;
their prose is present in the frontmatter and in the `sc-src` template but nowhere on the card. Affects all
**14** `monster/companion/beastheart/advancement-features/*.yaml` blocks (42 features), and therefore the 14
`-advancement-features` pages, the 14 companion statblock pages that embed them,
`Browse/class/beastheart.md`, and `Read/beastheart/the-beastheart-class.md`.

Prescribed fix: make `renderFbFeat` fall back to the flat fields when `len(f.Effects) == 0` (render
`Intro`/`Body`/`PowerRoll`/`Sections`/`Enhancements`/`Trailing` the way base did) — this covers any current
or future producer — **and** populate `Effects: []RichEffect{{Effect: body}}` in
`collectChildFeatures` (`internal/content/monster.go:419`). Add a `renderFbFeat` test with a
`{name, body, level}`-only feature (no `effects`) asserting the body renders.

---

## IMPORTANT

### I-1 — Cost / section names are not extracted when the source label contains an scc link (154 data entries)
`internal/content/featureparse.go:113` (`fbLabelRe = ^\*\*([^*:]+):\*\*\s*(.+)$`), applied at
`internal/content/statblock_parse.go:466`.

The label class `[^*:]+` excludes `:`, and the book's linked labels carry a colon inside the URL —
`**3 [Malice](scc.v1:mcdm.monsters.v1/rule.monster/malice):**`, `**[End Effect](scc.v1:…):**`. Those
paragraphs fall through to the bare-prose branch, so the entry is emitted as
`{effect: "**3 [Malice](scc.v1:…):** The hag regains…"}` with the raw markdown label inline instead of the
brief's required `{cost: "3 Malice", effect: "The hag regains…"}`.

Measured over the regenerated unified JSON/YAML: **154 entries** (`2 Malice` 52, `3 Malice` 40, `1 Malice` 21,
`End Effect` 18, `5 Malice` 11, `2+ Malice` 6, `1+ Malice` 4, `4 Malice` 2) — i.e. every Malice enhancement
and every End Effect paragraph in the statblock data path. `wode-hag.yaml`'s Soul Steal is the brief's own
worked example and is wrong in production output.

Why the tests miss it: `TestParseStatblockFeatures_SoulSteal` feeds unlinked fixture text, so it passes.
The SITE parser is unaffected because it reads the md-linked pages whose relative-path links
(`../malice/`) contain no colon — hence the golden fixtures show `"cost": "2 [Malice](../malice/)"` and look correct.

Prescribed fix: widen the label class to tolerate a link, e.g.
`^\*\*((?:\[[^\]]*\]\([^)]*\)|[^*:])+?):\*\*\s*(.+)$`, and classify on `linkDisplay(label)` (the site path
already does exactly this at `internal/site/statblock_page.go:525`). Add a `SoulSteal` test case whose
source text carries the `scc.v1:` link, asserting `{cost: "3 Malice"}`.

---

## LOW

### L-1 — `**Trigger:**` is handled three different ways across the three parsers
`internal/content/statblock_parse.go:469-474` routes Trigger to a top-level `trigger` field and resets
`curIdx`, so a roll that follows a Trigger becomes a standalone `effects[]` entry;
`internal/content/featureparse.go:311-320` keeps Trigger as a named entry that a following roll attaches to;
`internal/site/statblock_page.go:522-529` also keeps it as a named entry and nests the roll inside it.
Consequence: for "Turned Upside Down" the site nests the roll inside the Trigger section (correct per the
ruling) while the JSON/YAML records the roll as an unattached entry. The statblock schema does declare a
top-level `trigger` (`feature.schema.json` `properties.trigger`, inherited by `statblock.schema.json`'s
`features[]` `$ref`) and `draw-steel-elements` renders `trigger` before `effects`, so nothing breaks — but
the two representations disagree about attachment, and a Trigger that is NOT the first paragraph would lose
its position. Fix (if wanted): also carry the Trigger as an `effects[]` entry, or attach the following roll
to the trigger by keeping `curIdx` pointed at a synthetic entry.

### L-2 — `.fb__feat-intro` is no longer emitted; lead-in prose loses its bottom margin
`internal/site/featureblock_page.go:486` emits `.fb__feat-trailing` for every bare-prose entry.
`v2/docs/stylesheets/steel-featureblock.css:193-194` gives `.fb__feat-intro` an extra
`margin-bottom:.65rem` that no element now receives, and rule :194 becomes dead CSS. Cosmetic only
(the base declaration is shared), but the intro/roll gap tightens on every featureblock lead-in.
Fix: drop the now-dead `.fb__feat-intro` rule, or keep emitting the class for an entry that precedes the
first roll.

### L-3 — The flat `power_roll` convenience field silently changed meaning
`internal/content/featureparse.go:274-283` sets `f.PowerRoll` from the FIRST tier list (`!firstSeen`);
base's `fbParseTiers` let the LAST list win. For a multi-list feature the emitted `power_roll` now holds
different values (e.g. `dynamic-terrain/siege-engines/exploding-mill-wheel.yaml` "Roll the Wheel" flips from
the explosion tiers to the rolling tiers). It is arguably the more correct choice and the full data is in
`effects`, but it is an unannounced data change for any consumer still reading `power_roll`. Fix: note it in
`docs/statblocks.md` / the CHANGELOG bullet.

### L-4 — The superproject branch is 1 commit behind `origin/main`; landing as-is reverts 6 files
`git -C <worktree> diff origin/main..HEAD` shows deletions of `.claude/orchestrate/PROJECT.md` (6 lines),
`.claude/skills/dse-verify/SKILL.md` (20), `docs/handoffs/HANDOFF.md` (31),
`docs/superpowers/decisions-snapshot-2026-09-06.md` (243), `docs/superpowers/freeze-restore-2026-09-06.md` (5),
`docs/working-preferences.md` (12) — all added on `origin/main` (`09af86e`) after this branch's point.
steel-etl, v2 and data-sdk-npm are all up to date with their upstreams. Fix: rebase/merge the superproject
branch onto `origin/main` before `just wt-finish`.

---

## INFO

- **INFO-1** Schema failure count: I measure **164 failing documents** (513 statblock + 156 featureblock in
  `en/unified/json`) at BOTH base and HEAD; the implementer reported 178 over 577 documents (they also
  validated the per-book trees). Either way the base/HEAD counts are identical and no failure is introduced
  by this branch. My run shows only `keywords`/`weaknesses`/`immunities` null errors — no missing
  `role`/`organization` in the unified tree.
- **INFO-2** `parseStatblockEffects`'s `rollKeysSet` guard (`internal/content/statblock_parse.go:401,413`)
  merges by tier KEY, not by list: a first tier list missing one of `tier1/2/3` followed immediately by a
  second list would absorb the missing tier into the first entry. Zero corpus instances today (I checked:
  0 effects entries carry tiers without either `roll` or `effect`, and schema validation is clean), but a
  list-boundary marker (blank line / paragraph split, as `featureparse.go` uses) would be safer.
- **INFO-3** The island JSON shape change (`powerRoll`/`sections`/`enhancements`/`trailing` → `effects`) has
  no external consumer — `internal/site/statblock_card_test.go:104-130` writes it for an in-repo Brave capture
  script; nothing outside the repo reads it.
- **INFO-4** `data-sdk-npm` has no `node_modules`, so the SDK's own reader could **not** be run against the
  regenerated YAML (no network install attempted). Schema-level validation was done instead, against both
  copies (byte-identical: `featureblock`, `statblock`, `feature` all `diff`-clean).
- **INFO-5** `validateDocsDir` (`internal/site/build.go:1119-1150`) catches empty / cwd / config-dir /
  `.git`-bearing `docs_dir` but not an arbitrary wrong non-repo directory. Verified live in a scratch copy:
  `steel-etl site --config pipeline.yaml` → exit 1, `docs_dir "…/guard" resolves to the current working
  directory; refusing to build`, and the canary file, `.git/` and `internal/` all survived. The real
  `../v2/site.yaml` still builds (exit 0).
- **INFO-6** The CHANGELOG bullet claims "every tier table shows" and that `effects` is "the single source of
  truth for both the rendered card and the statblock JSON/YAML"; `docs/statblocks.md` states `renderFbFeat`
  "walks `Effects` exclusively — the flat fields are data-only now". Both are accurate to the intent but
  overstate reality until C-1/C-2 are fixed. Otherwise docs and CHANGELOG match the code.

---

## What was verified (evidence)

**Gates** — `gofmt -l ./internal ./cmd` → 10 files, identical to the base list, none touched by the branch
(`internal/cli/classify_test.go`, `internal/output/{aggregate,generator,json,yaml}.go`,
`internal/pipeline/config.go`, `internal/site/{class_page_test,companion_statblock,feature_index,kit_page_test}.go`).
`go vet ./...` no output. `go test -race -count=1 ./...` → 8/8 `ok` (7 packages + `cmd/steel-etl` no test files),
`TestStatblockCard_GoldenEquivalence` and `TestStatblockGolden_WriteIslandInputs` pass with the committed golden.

**Golden** — all 24 hunks in `sc308-r3c-golden-diff.txt` read: devil-high-judge HTML (headless panel moves
into the Effect section and gains a derived "Presence Test" head; the Effect section moves above its panel),
link-test HTML (the `2 Malice` enhancement moves above the `[End Effect]` section — source order), and the
4 island JSONs (`powerRoll`/`sections`/`enhancements`/`trailing` → ordered `effects`, `label`→`name`,
`text`→`effect`, `trailing` → a nameless entry). No text lost or duplicated.

**Rulings, ability by ability** (data shape + DOM, regenerated this run):
- Snackies for Sweeties — YAML exactly the brief's expected shape; DOM: `Effect` section ⊃ `Power Roll + 3`
  panel, then `Special` section ⊃ `Agility Test` panel. ✅
- Caustic Detonator (`war-dog-phosphorite`) — `Effect`+roll, then `Special`+headless tiers. ✅
- No Escape (`fossil-cryptic`) — `Effect`+`Power Roll + 3`, then the bare prose paragraph carrying the
  second `Power Roll + 3`. ✅ (this is the "prose between table and header" attachment case)
- Overpower (`lord-syuuls-malice`) — 4 entries in order, two "Reason Test" panels each under its own prose. ✅
- Roll the Wheel (`exploding-mill-wheel`) — `Effect`+`Power Roll + 2`, prose+bare panel (no head, prose
  names no test), trailing prose. ✅
- Turned Upside Down — `trigger` top-level; DOM Trigger ⊃ roll, Effect below. ✅ (see L-1)
- Corrosive Claws — unchanged `[{roll, tier1..3}]`. ✅
- Soul Steal — `[{roll,tiers}, {name: Effect,…}, {…}]`; third entry's `cost` NOT extracted → I-1. ⚠️
- Dice-in-title + retainer (`devil-detective`) — `{roll: "2d10 + highest characteristic", tiers}` then
  `{name: Effect}`; head renders `Power Roll` + `2d10 + highest characteristic`. ✅
- Malice featureblock + dynamic terrain — covered by Overpower / Roll the Wheel above. ✅
- Attachment "roll directly after the table stays standalone" — Soul Steal, Corrosive Claws, devil-detective. ✅

**Label rule (now universal)** — 221 derived-label panels site-wide at HEAD, **0 at base**
(Agility 127, Might 38, Reason 20, Intuition 18, Presence 18); `Power Roll` heads 1684→1686. 6 random samples
(`dorzinuuth-the-base`, `dwarf-catchpole`, `orc-malice`, `catapult`, `spike-trap`, `goblin-malice`) each follow a
bold `**<Char> test**` in that entry's own prose. Over-reach probe: exactly 1 panel in the corpus follows
test-naming prose while carrying a `**Power Roll + N:**` header (`column-of-blades`) and it correctly keeps
"Power Roll + 2".

**Regression sweep** — base regenerated from `steel-etl@5035174` in a scratch `git worktree` with
absolute-path config overrides (never the main checkout, never `pipeline.yaml` for `site`):
data 4968 changed / 0 added / 0 removed; site 324 changed / 5 only-in-HEAD (`index.md`, `javascripts`,
`Media`, `.nav.yml`, `stylesheets` — protected paths the scratch run does not populate). Rendered-body
(frontmatter excluded, tags stripped, entities unescaped) token/line comparison of all 324 changed pages:
**63 pages lose 650 line instances** (C-1 + C-2), 115 pages gain 325 short lines (all derived test labels or
re-split fragments — no duplicated prose, no long added prose).

**Data contract** — `jsonschema` Draft 2020-12 with a `referencing.Registry` seeded by both filename and
`$id` (so `statblock.schema.json`'s `"$ref": "feature.schema.json-3.0.0#"` resolves): BASE 164 failing,
HEAD-vs-steel-etl-schemas 164 failing, HEAD-vs-SDK-schemas 164 failing — identical documents and identical
error keys in all three runs. `feature.schema.json` requires `['type','feature_type','effects']` and its
`definitions.effect` `anyOf` accepts `{effect}` or `{roll,tier1..3}`: the header-less
`{name, effect, tier1..3}` shape passes on the first branch, and 0 corpus entries carry tiers without
`effect` or `roll`. Both schema copies `diff`-clean; the net featureblock schema change vs base is +17
lines (`effects` only) — the r1/r2 `post` and `power_roll.label` additions are correctly gone.

**Consumers** — `draw-steel-elements/src/elements/feature/renderFeature.ts:367-412` renders `feature.trigger`
first, then walks `feature.effects`, composing the title from `name`+`cost` (cost-without-name supported),
and builds the roll panel from `tier1/2/3`+`crit` with `head: effect.roll?.trim() || false` — i.e. it handles
(a) prose+tiers in one entry, (b) tiers with no `roll`, (c) `cost` with no `name`. **No break.**
`statblock-adapter-gl-pages` has these fields only in `src/__tests__/data/**` fixtures (no reader code);
`compendium` and `data-gen` have no readers. **Consumer-break list: empty.**

**Dice roller** — `v2/docs/javascripts/sc-dice.js:33-50`: `head.closest(".sc-ability__pr")` still resolves
(`.sc-ability__pr-head` is a direct child of `.sc-ability__pr` regardless of the new
`.sc-ability__section` wrapper), `paint()` scopes `.sc-ability__tier` lookup to that panel, `closeAll()`
stays document-wide. Verified against the built Snackies DOM (two `.sc-ability__pr` panels, each nested in
its own `.sc-ability__section`). Works.

**Screenshots** — `sc308-r3c-snackies.png` (Effect ⊃ Power Roll +3, Special ⊃ Agility Test),
`sc308-r3c-turned-upside-down-before.png` (roll hoisted above Trigger),
`sc308-r3c-turned-upside-down-after.png` (Trigger, roll, Effect): opened, genuine, match the rulings and
match the DOM I regenerated.

**Hygiene** — no `Co-Authored-By` / `Claude` / `Generated with` / `🤖` trailer in any of the 8 steel-etl
commits, 3 data-sdk-npm commits or 3 superproject commits; sole author `Scott Tomaszewski
<scottTomaszewski@gmail.com>`; nothing pushed (`git branch -r --contains HEAD` empty in all three repos;
steel-etl 8 ahead of `origin/main`, data-sdk-npm 3 ahead of `origin/v3`, v2 1 ahead of `origin/main`);
`v2` commit `09aabfe41f` touches only `docs/javascripts/sc-dice.js` (0 files under `docs/Browse|Read|scc`);
superproject commits touch only `CHANGELOG.md`. Main checkout `/home/scott/code/steelCompendium/workspace`
was never written to and its `git status --porcelain` is unchanged (` M draw-steel-elements`,
` M steelCompendium.github.io`).

## Reviewer scratch state

`v2/docs`, `steelCompendium.github.io/docs/api` and `data/data-unified` in the worktree were rewritten by
this review's regeneration and are restored to their committed state at the end of the review; the scratch
base `git worktree` registered in the steel-etl submodule was removed with `git worktree prune`.

Artifacts (scratch, session-local):
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/1ef34ad4-89db-4dcb-99a9-ac3d665aaffa/scratchpad/sc308-review-r3-20260907/`
— `data-diff.txt`, `site-diff.txt`, `lost-body.txt`, `added-body.txt`, `label-samples.txt`, `guard-out.txt`,
`validate.py`, `lostcheck.py`, `gen-base.log`, `site-base.log`.
