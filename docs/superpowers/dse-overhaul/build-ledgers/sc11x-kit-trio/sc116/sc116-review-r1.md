# SC-116 — independent review, round 1

**Verdict: FIX-FIRST** — 1 HIGH, 1 MED, 3 LOW, 3 INFO (0 CRITICAL).
**SC-116 itself (`c31e701`) is LAND-READY**: derivation is correct on the whole corpus
(21 Martial / 3 Magic / 1 Psionic, independently re-derived from the book source), the data
blast radius is exactly the claimed one line per kit per format (300 files, +300/−0, zero
non-kit deltas), both schema copies + the allowlist already covered `kit_type`, all 25
generated kit docs validate against both schemas, and three mutation probes prove the new
tests are load-bearing.
The blocker is in **SC-115 (`6415f04`)**, which lands in the same push: moving
`buildLeafCardIndex` earlier in `Build()` makes `embedItemCards` splice a **pre-augment**
snapshot, silently deleting the "## Summons" grids, the "## Advancement Features" card and
17 "Summoned by" back-links from `Read/summoner/other-summoners.md` (217,633 → 159,169 bytes).
A 3-line fix is prescribed and **empirically validated** (site diff vs merge-base drops
27 → 26 files, all kit; that page becomes byte-identical to merge-base; kit output unchanged).

Shas reviewed: `steel-etl` `sc11x-kit-trio` HEAD **`6415f04`** (`c31e701` SC-116 → `d0e8c67`
SC-119 → `6415f04` SC-115); merge-base **`7ef2284`**; `origin/main` **`c7d6940`**;
`v2` **`7e56d40e63`**. Worktree left exactly as found (`M steel-etl` / `M v2` at the
superproject root, both submodules clean; verified before and after).

---

## Findings

### HIGH-1 — SC-115's build reorder makes `embedItemCards` splice stale leaf cards; one Read page loses real content

`internal/site/build.go:90` (new `buildLeafCardIndex` call) vs `internal/site/build.go:163`
(`embedItemCards(cfg, leafCards)`).

**Mechanism.** Before SC-115, `embedItemCards` built its own "Pass A" leaf→card index at
line 163, i.e. *after* every page-mutating pass above it. SC-115 hoisted that walk to line 90
(so `kitCard` can splice a signature-ability card during `generateIndexPages`) and passes the
same map down to line 163. Three passes run **between** those two points and rewrite
card-able leaf pages:

- `augmentRivalSummonerPages` — `build.go:134`
- `augmentSummonerRetainerPages` — `build.go:144`
- `buildBestiarySearchPage` — `build.go:152`

The first two add a `## Summons` grid + `## Advancement Features` card to retainer/rival
leaves and an `<p class="sb-backlink">Summoned by …</p>` line to each summon leaf. Those
edits are now **invisible** to `embedItemCards`, which splices the stale pre-augment HTML into
container pages.

**Failure scenario (measured, not hypothetical).** `steel-etl site` at `7ef2284` vs at
`6415f04`, same `data/`, same `site.yaml`:

| page | merge-base | branch |
|---|---|---|
| `Read/summoner/other-summoners.md` bytes | 217,633 | 159,169 (**−58,464, −26.9 %**) |
| `^## Summons` blocks | 5 | **0** |
| `^## Advancement Features` blocks | 1 | **0** |
| `sb-backlink` "Summoned by" lines | 17 | **0** |

Site-wide the set of files containing `sb-backlink` shrinks from 54 → 53 (the missing one is
exactly this page); files containing `## Summons` 6 → 5; `## Advancement Features` 2 → 1. The
Browse **leaf** pages are unaffected (`Browse/monster/retainer/devil-detective.md` still holds
both H2 blocks in both builds) — only the transcluded copy on the published Read chapter is
stale. This is user-visible content loss on a live page.

**Prescribed fix** (validated — see Probe 6): keep the early index for `kitSignatureCardIndex`,
but recompute a fresh index for the embed pass. At `build.go:163` replace

```go
	embedCount, embedErrs := embedItemCards(cfg, leafCards)
```

with

```go
	// Re-walk: the augment-* passes above rewrite card-able leaves after the
	// early index was taken for kitCard (SC-115); embedding must see them.
	freshCards, freshErrs := buildLeafCardIndex(cfg)
	result.Errors = append(result.Errors, freshErrs...)
	embedCount, embedErrs := embedItemCards(cfg, freshCards)
```

Cost is one extra walk of Browse+Read (~3,091 files; the full `site` run was 88 s before and
after, no measurable change). Equivalent alternative: give `embedItemCards` back its own
internal Pass A and let `Build()` keep the early call solely to populate
`kitSignatureCardIndex`. Add a doc comment at `build.go:83` recording the invariant
("the index handed to `embedItemCards` must be taken after every leaf-mutating pass").

### MED-1 — No test guards the pass-ordering invariant HIGH-1 broke

`internal/site/build.go` has no build-level test asserting that an `augment-*` edit to a leaf
reaches its transcluded copies. `TestBuildLeafCardIndex` and `TestEmbedItemCards`
(`internal/site/embed_cards_test.go`) both exercise the two functions in isolation, so the
full suite is green while a published page silently loses a quarter of its bytes. Prescribe: a
test that writes a container page + a leaf, mutates the leaf between index-build and embed,
and asserts the mutation appears in the container — or, cheaper, a `Build()`-level golden
assertion that a summons back-link survives into its Read chapter.

### LOW-1 — `deriveKitType` substring-matches raw markdown, link targets included

`internal/content/kit.go:99-108`. `keywords` are *unstripped* markdown, e.g.
`[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee)`, so `strings.Contains(joined, "Magic")`
also sees every link URL. Harmless today — I enumerated all **127 distinct keywords** across
the whole generated corpus; only `Magic`, `Magic; Light Weapon` and `Psionic` contain either
token, and all SCC slugs are lowercase so capital-`M`/`P` can't collide. It becomes a
false-positive the day a keyword is linked to a target containing `Magic`/`Psionic`, or a new
keyword's *display* text does (e.g. a hypothetical "Antimagic"). Prescribe: strip link
targets before matching, keeping display text — `[X](Y)` → `X` — which preserves the real
`Magic; Light Weapon` case that exact-equality matching would *regress*. Note in the doc
comment that substring (not equality) is deliberate for that reason.

### LOW-2 — `@kit-type:` precedence keys on map-key presence, not a non-empty value

`internal/content/kit.go:40-44` sets `fm["kit_type"] = v` for any annotation value;
`kit.go:87` then skips derivation on `if _, ok := fm["kit_type"]; !ok`. An annotation that
parses to an empty value (reachable: `internal/parser/annotations.go:31`'s `(.+?)` can capture
a single space, which is then `TrimSpace`d to `""`) suppresses derivation and emits
`kit_type: ""` — schema-valid as a string, so nothing fails, and both renderers silently fall
through to the body sniff. One-line fix: only set from the annotation when
`strings.TrimSpace(v) != ""`, or change the guard at `kit.go:87` to test for a non-empty value.

### LOW-3 — Three silent paths to the `Martial` default, none warned or validated

`internal/content/kit.go:56-89`: (a) no signature-ability child; (b) `abilityParser.Parse`
returns an error (the `if err == nil` at `kit.go:60` swallows it); (c) the ability parses but
has no keyword row, so `parsed.Frontmatter["keywords"]` is absent and the `[]string` assertion
at `kit.go:73` yields `nil`. In all three the kit is labelled **Martial** with no diagnostic.
If the book source ever loses Battlemind's keyword row, the site quietly re-mislabels it and
every gate stays green. Prescribe: emit a pipeline warning (or a `steel-etl validate` check)
when a `@type: kit` section's signature ability yields zero keywords.

### INFO-1 — Branch is 5 commits behind `origin/main`; the deploy diff is larger than SC-116's

Upstream `72012c9` (SC-199) edits `input/heroes/Draw Steel Heroes.md`, so a `gen --all` at
`origin/main` vs at the branch shows **317** differing files — 300 from SC-116 plus **17**
from SC-199 (`project/imbue-treasure.*`, `chapter/downtime-projects.md`,
`rule/downtime/crafting-project.md`, `clean/Draw Steel Heroes.md`; 169 blockquote-prefix line
pairs). Those 17 are upstream's, not this branch's. Measure the branch's own blast radius
against the **merge-base** `7ef2284`, as done below. No file conflicts: upstream touches none
of the branch's 9 files.

### INFO-2 — Two new package-level mutable globals in `internal/site`

`cards.go:305` (`docsRootDir`) and `cards.go:328` (`kitSignatureCardIndex`), reset at
`build.go:44-45`. Same build-scoped-global pattern as the pre-existing
`statblockFeatureCache`/`companionStatblockCache`, so no new class of hazard; `Build()` was
already non-reentrant. Both degrade to a silent no-op outside a full `Build()`
(`TestKitCardNoSpliceWithoutIndex`, `TestDocsRelDir` cover that). Recorded, not actionable.

### INFO-3 — Pre-existing `parseKeywords` artifacts in the corpus

The 127-keyword enumeration surfaced `'- Area'` (×2), `'Magic; Light Weapon'` (×1) and
`'or Heavy Weapon'` (×1) — malformed splits from `internal/content/ability.go:430`. None sit
on a kit signature ability, so SC-116 is unaffected; flagging as a separate backlog candidate.

---

## Probe results

All Go/Node commands via
`devbox run -- bash -c 'cd <dir> && <cmd>'`. Isolated clones were used throughout — the
reviewed worktree was never built into.

### Probe 1 — Data blast radius (`gen --all`, merge-base vs branch)

Three isolated clones of `steel-etl` under the scratchpad (at `7ef2284`, `c7d6940`, `6415f04`),
each with its own `../data`, `../v2/site.yaml`, `../steelCompendium.github.io/docs/api`, and a
copy of the (gitignored) `classification.json`. Each run: `go run ./cmd/steel-etl gen --config
pipeline.yaml --all` → "Shared outputs regenerated over 3086 classified items from 4 books."

`diff -ru mb/data branch/data`:

- **300 files differ**, 100 % under a `kit/` directory — 25 kits × 6 formats
  (`md`, `md-linked`, `md-dse`, `md-dse-linked`, `yaml`, `json`) × 2 trees
  (`en/books/heroes/`, `en/unified/`).
- **+300 content lines, −0.** Every hunk is one added line and nothing else:
  `kit_type: Martial` ×210, `kit_type: Magic` ×30, `kit_type: Psionic` ×10,
  `"kit_type": "Martial",` ×42, `"kit_type": "Magic",` ×6, `"kit_type": "Psionic",` ×2.
- `en/books/heroes/clean/` (stripped distribution markdown): **unchanged** — no annotation leak.
- SCC API (`steelCompendium.github.io/docs/api/v1/{index,scc}.json`): the only delta is the
  `"generated"` timestamp.

Nothing outside kit frontmatter moved. Matches the report's claim exactly.

### Probe 2 — Derived kind vs the source book

Independently re-derived from `input/heroes/Draw Steel Heroes.md`: located all 25
`@type: kit` annotations, walked each block to its `@subtype: signature` child, read that
ability's keyword table row, stripped markdown links, and classified. Result:
**21 Martial / 3 Magic / 1 Psionic**, and **all 25 assignments match the emitted `kit_type`
byte for byte** — Magic = Arcane Archer, Spellsword, Warrior Priest; Psionic = Battlemind.

False-positive/negative hunt: enumerated every `keywords` array in the whole generated corpus
— **127 distinct keywords**; substring `Magic` hits only `Magic` and `Magic; Light Weapon`,
substring `Psionic` only `Psionic`. No false positive exists in the corpus today; the future
risk surface is LOW-1 above.

### Probe 3 — Precedence, fallbacks, and mutation-testing the tests

Three mutations applied to a throwaway clone at `6415f04`:

| mutation | expected to break | result |
|---|---|---|
| delete the frontmatter-first read in `kitKind` (`kit_page.go:53-55`) | SC-116 renderer | **FAIL** — `TestKitKind/Magic_from_frontmatter`, `/Psionic_from_frontmatter`, and `TestKitKind_MisBucketRegression` ("kitKind with kit_type frontmatter = \"Martial\", want \"Psionic\"") |
| delete the body-sniff fallback, return `"Martial"` | pre-migration safety net | **FAIL** — `TestKitKind_FallbackSniff` (Psionic and Magic cases) |
| make `deriveKitType` always return `"Martial"` | SC-116 parser | **FAIL** — `TestKitParser_KitTypeFromSignatureKeywords/Battlemind`, `/Arcane_Archer` |

So `TestKitKind_MisBucketRegression` **does** assert what its name claims (its second
assertion is the live regression guard; the first is a premise-guard proving the fallback
alone still mis-buckets a post-transform body), and the fallback is separately guarded.
`@kit-type:` override verified live by `TestKitParser_KitTypeAnnotationOverride` (`Stormwight`
wins) — with the LOW-2 empty-value caveat.

### Probe 4 — Parity checklist

- `schemas/kit.schema.json` and `data-sdk-npm/src/schema/kit.schema.json` are **identical
  except the SDK copy's "BETA —" description prefix**; the `kit_type` declaration (plain
  `"type": "string"`, no enum, so a `Stormwight` override would still validate) is byte-identical.
- `internal/output/schema_validation_test.go:26` already lists `"kit_type": true` in the kit
  allowlist and `:155` / `:286` / `:423` exercise a populated value. `go test ./internal/output/
  -run Schema -v` — all green (`TestSchema_NoUnevaluatedProperties/kit_with_all_fields`,
  `TestSchema_FieldTypes_Kit`, `TestSchema_RequiredFields/kit`, `TestSchema_TypeConst/kit`,
  `TestSchema_JSONRoundtrip/kit`, `TestConformance_*`).
- **Real JSON-Schema validation of real generated output** (draft 2019-09,
  `jsonschema==4.26.0`, local `$ref` registry over `schemas/`): all **25/25** generated
  `en/unified/json/kit/*.json` validate against `steel-etl/schemas/kit.schema.json`, and
  **25/25** against the SDK copy. Non-vacuous: a control run with an injected `bogus_field`
  fails "Unevaluated properties are not allowed", and with `kit_type: 5` fails
  "5 is not of type 'string'".
- SDK consumer side already round-trips it: `data-sdk-npm/src/model/Kit.ts:11`,
  `src/dto/KitDTO.ts:10` and `:35`.

Report's "no schema / SDK / allowlist change was needed" claim: **confirmed**.

### Probe 5 — `internal/site/build.go` change

15 lines: (a) `build.go:44-45` resets the two new build-scoped globals; (b) `build.go:83-92`
hoists the leaf-card index out of `embedItemCards` and stashes it in
`kitSignatureCardIndex`; (c) `build.go:163` passes it down instead of letting
`embedItemCards` rebuild it. (a) and (c) are safe. **(b) is not** — see HIGH-1.

### Probe 6 — Gates, site build, and fix validation

```
go build ./...  BUILD_EXIT=0
go vet ./...    VET_EXIT=0   (zero findings)
go test ./...   TEST_EXIT=0  — cli, content, context, output, parser, pipeline, scc, site all ok
```

`steel-etl site --config ../v2/site.yaml` at branch: Sections 2, Files copied 3091,
Index pages 529, Nav files 6, Search exclude 34, SCC stubs 3086, Printing stamps 3086.

`v2/docs/Browse/kit/index.md` at branch — the three tickets, together:

```
      3 sc-card__type">Magic Kit
     21 sc-card__type">Martial Kit
      1 sc-card__type">Psionic Kit          (SC-116)
     25 sc-card__sig-card                    (SC-115; 0 at merge-base)
    109 <div class="v">—</div>, zero "0"     (SC-119)
```

Detail-page eyebrows agree (3 Magic Kit / 21 Martial Kit / 1 Psionic Kit), as does the kit
page frontmatter (`kit_type:` 3/21/1). Merge-base baseline: **25 × "Martial Kit"** — the
mis-bucket SC-116 fixes is real and reproduced.

Full `docs/` diff, merge-base vs branch: **27 files** — 26 under `Browse/kit` (intended) plus
`Read/summoner/other-summoners.md` (**HIGH-1**).

**Fix validation.** Applied the HIGH-1 patch to a fourth clone at `6415f04` and re-ran `site`
against the same data: the diff vs merge-base drops to **26 files, all `Browse/kit`**;
`Read/summoner/other-summoners.md` is **byte-identical to merge-base** (5 Summons, 1
Advancement Features, 17 back-links, 217,633 bytes restored); and
`diff -rq branch/v2/docs/Browse/kit fix/v2/docs/Browse/kit` reports **no differences** — the
kit output (21/3/1, 25 sig cards) is untouched by the fix.

---

## Follow-ups (not for this round)

1. **LOW-3 diagnostic** — a `steel-etl validate` check for a kit whose signature ability
   yields zero keywords, so a future source edit can't silently re-mislabel a kit.
2. **INFO-3** — `parseKeywords` (`internal/content/ability.go:430`) mis-splits a handful of
   corpus keywords (`'- Area'`, `'Magic; Light Weapon'`, `'or Heavy Weapon'`). Backlog ticket;
   unrelated to kits.
3. **`kit_type` in the DSE variants** — `md-dse`/`md-dse-linked` kit frontmatter now carries
   `kit_type`. Additive YAML, so no breakage expected, but worth confirming the
   `draw-steel-elements` `ds-kit` reader ignores/uses it rather than re-sniffing.
4. **`schemas/kit.schema.json` description drift** — the schema still describes `kit_type` as
   `"Martial", "Caster", "Stormwight"`; the pipeline now only ever emits Martial/Magic/Psionic.
   Consider updating the example list (not the type) so the doc matches reality.
5. **Land order** — the branch is 5 behind `origin/main`; rebase/merge before landing so the
   deploy regenerates from the SC-199-corrected heroes input (INFO-1).

---

## Artifacts

- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc116-kit-kind-frontmatter/sc116-review-r1.md`

Scratchpad root:
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/`

- `sc11x-full.diff` — `git diff origin/main...HEAD` (9 files, +465/−69)
- `sc116.diff` — `git show c31e701`
- `sc116-gates.txt` — build/vet/test output
- `sc116-focused-tests.txt` — `-v` runs of the schema / kit / site test selections
- `sc116-blast/data-diff-files.txt`, `data-diff-full.txt` — `origin/main` vs branch (317 files)
- `sc116-blast/data-diff-mb-vs-branch.txt` — **merge-base vs branch (300 files, +300/−0)**
- `sc116-blast/site-diff-files.txt` — site docs, merge-base vs branch (27 files)
- `sc116-blast/site-diff-fix.txt` — site docs, merge-base vs patched branch (26 files)
- `sc116-blast/other-summoners.diff` — the HIGH-1 content loss, unified diff
- `sc116-blast/gen-{mb,base,branch}.log`, `site-{mb,branch,fix}.log`
- `sc116-blast/validate.py` — the JSON-Schema validator used in Probe 4
- `sc116-blast/{mb,base,branch,fix}/` — the four isolated clone trees with their `data/`,
  `v2/docs/` and API outputs
