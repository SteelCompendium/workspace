# SC-390 R2a review: steel-etl `8d1c062` + data-sdk-npm `5ec5a8e` (+ v2 `2af78d0`, superproject `753e212`)

## Executive summary
1. **VERDICT: FIX ROUND NEEDED.** Findings: 0 CRITICAL / 1 HIGH / 1 MEDIUM / 2 LOW / 7 INFO.
2. **HIGH-1:** the SDK branch sits on stale `origin/v3` 69c8d49 and is missing SC-155. Every companion statblock throws `TypeError: dto.isTrait is not a function` in `Statblock.modelDTOAdapter`, which is the exact path DSE's `StatblockConfig.readYaml` uses. It throws under npm 3.0.0 (DSE's current pin) and under the prepared 3.1.0 build. It works once the branch is rebased onto `origin/v3` (now 0c924b3, 3.0.1 release-prep). The rebase conflicts in `CHANGELOG.md` and `package.json` only. This also affects R1b: a real panther `ds-sb` cannot render against SDK 3.0.0.
3. **House-pattern ruling (D):** statblock `features[]` carry **no `metadata`**. That holds for 0 of ~2,300 features across the 513 monster/retainer/minion/champion/rival statblocks, and 0 of 513 featureblock features. Companions deviate (MEDIUM-1). Fix: trim each embedded member's metadata to `{scc}` only. Panther `ds-sb` goes from 109 to 86 lines, and the `metadata.ability_type: Signature` vs `Signature Ability` mismatch goes away. Top-level `ability_type: "Signature Ability"` already matches every existing statblock signature ability.
4. **Site identity is proven at the rendered-HTML level.** I built at 0c74f4f/3aacc9a118 and at 8d1c062/2af78d0 in scratch clones, then ran mkdocs on both: 0 of 6,819 built files differ, including `search/search_index.json`. In `v2/docs`, only the 14 companion pages differ, and only in frontmatter.
5. **Data regression surface:** the full `gen --all` tree differs in 171 entries: 168 companion files (14 × 6 formats × books+unified) plus 3 aggregate `_index` files. No non-companion output changed, and nothing from the em-dash work leaked.
6. **Gates:** build/vet clean. go test 847/0/0 top-level (1,187 incl. subtests). Registry 3,096 (1,962/241/662/231), and `classification.json` is byte-identical before and after. `--scc-stable` passes. SDK 416/416. All 112 companion json/yaml/ds-sb objects validate with Ajv 2019-09 against the new schema. Mutation testing: 11 of 11 mutations went red.
7. Both schema copies are byte-identical. `$id` unchanged is consistent with the major-only `$id` convention. Nothing is published: npm latest is 3.0.0, there is no tag, and no remote branch contains 5ec5a8e.

## Findings

### HIGH-1: SDK 3.1.0 as prepared cannot load any companion statblock (stale base, missing SC-155)
- **Where:** `data-sdk-npm/src/model/Feature.ts:46` on `5ec5a8e`, which still has `ft = dto.isTrait() ? …` (the pre-SC-155 instance call). The branch base is `69c8d49`. `origin/v3` is now `0c924b3`: `750a5f3`/`7895b5c` SC-155 fix, then `c413abe` "Prepares for release '3.0.1'", then `0c924b3` release auth check. The consumer path is `draw-steel-elements/src/model/StatblockConfig.ts:70` (`Statblock.modelDTOAdapter(applyLegacyStatblockKeys(raw))`), and the pin is `draw-steel-elements/package.json:60` (`3.0.0`).
- **Failure scenario (executed):** I fed all 14 real companions, json and md-dse `ds-sb`, through `Statblock.modelDTOAdapter`:
  - SDK `5ec5a8e` build: 0 parsed, 28 threw `TypeError: dto.isTrait is not a function`.
  - npm 3.0.0 (the package installed in DSE): the panther throws, while a retainer (`angulotl-hopper`) parses fine.
  - Cause: the companion's non-ability members carry `feature_type: "feature"`, which ANNOTATION-GUIDE.md:124-129 sanctions ("companion grants are features"). That value is not ability, trait or subtrait, so it falls through to the instance `dto.isTrait()` on a plain object. No existing statblock feature uses `feature_type: "feature"`; they all use `trait` or `ability`.
  - Consequence: if Scott publishes 3.1.0 from this branch and DSE pins it, the Panther goes from "has no renderer" to a parse error.
  - The SDK tests did not catch it because the new companion tests use `features: []` (`enriched-schemas.test.ts:305`) or a DTO without features (`dto-field-parity.test.ts:45`).
- **Proven fix (scratch):** after rebasing onto `gh/v3`, all 28 objects parse. Pounce becomes `ability`/`Signature Ability`, Mighty Spring becomes `trait`, and `skills`/`free_strike` round-trip. Jest passes 423/423 (16 suites). Log: `sc390-r2a-sdk-rebased-probe.txt`.
- **Prescribed fix:**
  1. Rebase and resolve:
     ```
     cd <wt>/data-sdk-npm && git fetch origin && git rebase origin/v3   # conflicts: CHANGELOG.md, package.json
     ```
     - `package.json`: keep `"version": "3.1.0"`.
     - `CHANGELOG.md`: leave `## Unreleased` empty. Put `## 3.1.0` (the SC-390 bullets) **above** a new `## 3.0.1` header that holds v3's SC-155 `### Fixed` block (v3 already carries the 3.0.1 release-prep commit). If Scott decides 3.0.1 is never published, fold that `### Fixed` block into `## 3.1.0` instead.
  2. Add a regression test, e.g. in `src/__tests__/io/dto-field-parity.test.ts`. Import `Statblock` from `../../model`:
     ```ts
     it("loads a companion statblock from a plain object with a feature_type 'feature' member (DSE readYaml path)", () => {
         const sb = Statblock.modelDTOAdapter({
             name: "Panther", type: "statblock", organization: "Companion", stamina: "= yours",
             free_strike: "1 + M", skills: ["Sneak"],
             features: [
                 { type: "feature", feature_type: "ability", name: "Pounce", ability_type: "Signature Ability",
                   usage: "Maneuver", keywords: ["Melee"], distance: "Melee 1", target: "One enemy", effects: [{ effect: "x" }] },
                 { type: "feature", feature_type: "feature", name: "Mighty Spring", effects: [{ effect: "y" }] },
             ],
         } as any);
         expect(sb.features.map(f => f.feature_type)).toEqual(["ability", "trait"]);
         expect(sb.freeStrike).toBe("1 + M");
         expect(sb.skills).toEqual(["Sneak"]);
     });
     ```
     It must be red on `5ec5a8e` and green after the rebase.
  3. Change the publish note in the R1a report and the owner's evidence from "`git pull --ff-only && just release 3.1.0`" to "land the rebased branch on v3, then `just release 3.1.0`". The recipe on v3 now runs `check-auth` first.
- **Owner/R1b note:** DSE must pin an SDK that contains SC-155, meaning this rebased 3.1.0. A DSE jest test that renders a real companion fixture through `StatblockConfig.readYaml` on 3.0.0 will throw. The alternative of making steel-etl emit `feature_type: "trait"` for embedded companion members is **rejected**: it contradicts ANNOTATION-GUIDE.md:124-129 and the schema's own `feature_type` description ("'feature' = … companion").

### MEDIUM-1: embedded member features carry full `metadata` (house pattern: none)
- **Where:** `steel-etl/internal/output/statblock_transform.go:64-73` (`statblockMemberFeature` returns `TransformToSDKFormat(member)` unchanged except for `ability_type`).
- **Evidence (census of unified json after the change):**
  - Every non-companion statblock family has `features[]` with **no `metadata`**: monster, retainer (22 files / 54 features), summoner minion (49/112), champion (4/21), rival (46/160), and the rest. The 513 featureblock/dynamic-terrain features have none either.
  - Companions: 29 of 29 features carry `metadata` with the raw `content` blob, which duplicates `flavor`/`keywords`/`distance`/`target`/`effects`, plus `metadata.ability_type: "Signature"` that contradicts the top-level `"Signature Ability"`.
  - Existing statblock signature abilities carry only top-level `ability_type: "Signature Ability"`, so the top-level value is right and the nested one is the anomaly.
- **Failure scenario:**
  - A consumer walking `features[].metadata` (json/yaml API users, a future SC-392 DSE embed) sees two disagreeing `ability_type`s.
  - Each `ds-sb` carries roughly 20 to 25 redundant lines per ability, which bloats every synced vault file and the snapshot insert, whose output is user-visible markdown.
  - Companions become the one statblock family whose features differ in shape.
- **Prescribed fix (verified in scratch, then reverted):**
  1. In `statblockMemberFeature`, replace line 73 `return f` with:
     ```go
     	// Statblock features carry no metadata (house pattern: no monster/retainer/minion/
     	// champion/rival statblock feature does). Keep only the member's own SCC identity —
     	// the one thing no uncoded statblock feature has (SC-390 R2a).
     	if meta, ok := f["metadata"].(map[string]any); ok && meta["scc"] != nil {
     		f["metadata"] = map[string]any{"scc": meta["scc"]}
     	} else {
     		delete(f, "metadata")
     	}
     	return f
     ```
     With this change only `TestDSEGenerator_CompanionStatblock` (`dse_test.go:233`) goes red. Update its golden by dropping every member `metadata:` sub-key except `scc:`. Panther md-dse goes from 109 to 86 lines.
  2. In `TestTransformStatblock_CompanionMembers` (`statblock_transform_test.go:125`), after the `meta` lookup, add `if len(meta) != 1 { t.Errorf("member metadata must be scc-only, got %v", meta) }`.
  3. Update `steel-etl/docs/statblocks.md:375` from "embeds each as its own SDK feature object" to "embeds each as its own SDK feature object, metadata trimmed to the member's `scc`".
  4. Re-run gen and confirm that all companion json/yaml/ds-sb still validate (`scripts/validate.js` in the scratch dir below) and that the site diff is still frontmatter-only. The site does not read these fields.

### LOW-1: docs/report accuracy
- `docs/scc-log.md:811` lists `clean` among the formats that flipped. Beastheart has **no** clean output (`stripped` is produced only for the primary heroes book), and clean is annotation-stripped source, so it carries no `type`. Fix: delete "/clean" from the list.
- `docs/scc-reference.md:129` says "its md-dse / json / yaml `ds-sb` block". json/yaml have `features[]` and no `ds-sb` block. Fix: "its json/yaml `features[]` and md-dse `ds-sb` block carry…".
- The SCC API change is wider than the R1a report states. `api/v1/types.json` loses its `feature-group` bucket, and those 14 entries move into `statblock` (513 → 527); `scc.json` flips the 14 `type`s. This is a public API shape change for anyone keyed on `types["feature-group"]`. Fix: add one sentence to the `docs/scc-log.md` 2026-10-17 entry: "SCC API: the 14 `resolve/*.json` and `scc.json` entries flip `type`; `types.json` drops the `feature-group` bucket (its 14 entries join `statblock`)."

### LOW-2: stale comment and dead `feature-group` entries in `embed_cards.go`
- **Where:** `steel-etl/internal/site/embed_cards.go:36` (comment "companion_statblock.go: feature-group → the beastheart companion .sb-wrap"), plus `"feature-group": true` at `:45` and `:59`. After SC-390, 0 md-linked pages have `type: feature-group` (the API `types.json` bucket and the data `_index/feature-group.md` are gone), so both map entries are dead and the comment is false.
- **Fix:** change the comment to "companion_statblock.go: statblock pages whose scc is a beastheart companion (SC-390)". Removing the two map entries is optional; if the fixer does it, re-prove the site diff.

### INFO
1. **R1a-folded claim verified:** `data-sdk-npm/src/io/markdown/MarkdownStatblock{Reader,Writer}.ts` have no Skills handling (grep "skill" returns nothing). The writer already prints a string `freeStrike` (`cell(data.freeStrike ?? 0, …)`).
2. **Semver:** 3.1.0 is defensible. The schema and runtime changes are additive, and the only known consumer (DSE) pins exactly and prints `freeStrike` via a template string (`statblock/view.ts:218`). Precedent to be aware of: the 3.0.0 CHANGELOG listed a type-level widening (`FeatureDTO.name` → optional) under **Breaking**. The 3.1.0 entry already warns TS readers of `freeStrike`. No action needed.
3. **Companion features lack `icon`.** Every other statblock feature carries one (⭐️ traits, 🗡/🏹/❗️… abilities). DSE's statblock view derives crests from the action and reads `icon` only in featureblock mode (`renderFeature.ts:649`), so nothing renders differently. No action; note it for SC-392.
4. **Pre-existing:** 328 of 1,054 unified+book statblock **json** files fail their own schema (Ajv 2019-09). The causes are `features[].keywords: null` (238), `weaknesses: null` (116) and `immunities: null` (54). The counts are identical before and after, and all yaml/ds-sb are valid (they omit nulls). Recommend extending the owner's em-dash Backlog ticket to cover `features[].keywords: null`.
5. **Pre-existing:** the SCC API `url` field points at non-existent pages for 685 entries. That covers all 527 statblocks (e.g. `…/Browse/monster/companion/beastheart/statblock/basilisk/`, while the built page is `…/beastheart/basilisk/`; retainers are the same), 48 featureblocks, 51 monster-group lore pages, 29 chapters, 25 kit abilities and 5 skill groups. The `/scc/` stubs redirect correctly. Not caused by SC-390. Candidate Backlog ticket.
6. **R1a report precision:** "847 PASS" is the top-level count (1,187 including subtests). The "only resolve + timestamps" API claim omits `types.json`/`scc.json` (LOW-1). The data diff claim (companions plus 3 `_index` files) reproduced exactly.
7. **Landing drift:**
   - Superproject `753e212` sits on 180f107, and main is now 92e0bbf (SC-155, SC-407 and the sdk-release-auth pointer bumps). `docs/scc-log.md`/`scc-reference.md` did not change on main since 180f107, but `CHANGELOG.md` must be checked at rebase.
   - steel-etl and v2 `origin/main` still equal the branch bases (0c74f4f / 3aacc9a118), so both fast-forward.
   - gofmt: the only changed file gofmt flags (`internal/site/companion_statblock.go`) was already flagged at 0c74f4f, so this is pre-existing (owner already dropped it).

## Verification detail (B–H)
- **B site:** `build.go:421-436` runs `buildCompanionStatblockPage` first and generic `buildStatblockIslandPage` only in the `else`. The gate in `companion_statblock.go:229-233` is the scc marker `monster.companion.beastheart.statblock`, which does not match `…advancement-features/…`. Bestiary exclusion is in `bestiary_search.go:44`. Result: the companion page body, index `.sb-prev` + pairing, beastheart class page embeds, `Bestiary/index.md` and the search index are all byte-identical in rendered HTML. The mkdocs theme overrides read only `page.meta.{title,description,author,scc,printing,printing_book}`, and no new frontmatter key collides with them.
- **C data:** a Python cross-check of all 14 source grids against unified json (keywords, size, speed, stamina, stability, free_strike, skills link-stripped, movement/immunities em-dash omission, the five characteristics) found 0 mismatches. Books json equals unified json for all 14.
  - `features[]` matches the source order of the direct `@type: ability|feature` children (the featureblock is excluded) for all 14; the drake has 3 members.
  - Each embedded feature equals the member's own json except the `Signature` → `Signature Ability` mapping.
  - `metadata.scc`/`source` are intact.
  - md-dse-linked has 0 unresolved `scc.v1:` links, and members resolve relative to the owner.
  - Ajv 2019-09 with both schema files: 28 json + 28 yaml + 56 ds-sb companion objects valid, 0 invalid.
- **E:** `cmp` of the two `statblock.schema.json` copies: identical. `free_strike` is `["integer","string"]`; `skills` is `array<string>` and not required; `$id` is still `statblock.schema.json-3.0.0` (feature/featureblock are also `-3.0.0` and the others `-2.0.0`, so `$id` tracks majors only). `StatblockDTO`/`Statblock`/`partialFromModel`/`MarkdownStatblockReader` handle both types. npm `dist-tags.latest` is 3.0.0 (no 3.0.1 or 3.1.0 published); `git tag` is empty; `--contains 5ec5a8e` is only the local branch.
- **F:** 171 differing entries in `diff -rq` of the gen output = 168 companion files + `unified/md/_index/{README,statblock}.md` + removed `_index/feature-group.md`. `output/scc-to-path.json` differs only in the 14 `type` values. No other statblock changed, so the `Free Strike`/`Skills` parser edits and the source annotation have no non-companion effect.
- **G:** mutations, each in a scratch clone and reverted. All 11 turned the suite red:

  | # | Mutation | Tests that failed |
  |---|---|---|
  | M1 | signature mapping removed | 3 |
  | M2 | advancement featureblock folded into members | pipeline e2e |
  | M3 | gate keyed on `type: feature-group` again | 2 site tests |
  | M4 | bestiary exclusion removed | bestiary test |
  | M5 | free-strike text dropped | 3 |
  | M6 | dse-linked members unresolved | dse_linked |
  | M7 | em-dash movement kept | grid test |
  | M8 | skills not parsed | 3 |
  | M9 | organization not set | 2 |
  | M10 | generic statblock page ordered first | `TestBuild_CompanionStatblockTakesCompanionPath` |
  | M11 | members reversed | pipeline e2e |

  I found no vacuous assertions in the new Go tests. The SDK tests miss the fromDTO-with-members path (HIGH-1).
- **H:**
  - `docs/scc-reference.md` § Companions, the `docs/scc-log.md` 2026-10-17 entry, the CHANGELOG Unreleased bullet and the 2026-06-13 spec §9 item 1 note are all present and routed correctly, apart from the LOW-1 wording.
  - `steel-etl/docs/statblocks.md` paragraph: accurate.
  - `v2/site.yaml`: the `feature-group/` include is removed cleanly and the comment is moved above `monster/`. The `skill/` include appears twice, which is pre-existing and untouched.
  - AGENTS.md SCC summary: no change needed.

## Gate numbers (re-measured)
| Gate | Result |
|---|---|
| steel-etl `go build ./...` / `go vet ./...` | clean |
| steel-etl `go test -count=1 ./...` | 8 packages ok; 847 pass / 0 fail / 0 skip top-level (1,187 incl. subtests) |
| `gen --all` registry | 3,096 = heroes 1,962 / beastheart 241 / monsters 662 / summoner 231; `classification.json` byte-identical before vs after; 0 added / 0 removed |
| `validate --scc-stable` (default) | Validation passed, EXIT=0 |
| `validate` beastheart source | passed; output identical before vs after (257 annotated, 88.6%) |
| SDK `5ec5a8e` build + test | ok; 416/416, 15 suites |
| SDK rebased onto v3 (probe, scratch) | ok; 423/423, 16 suites; 28/28 companions parse |
| site `v2/docs` diff | 14 files (frontmatter only) + `site.yaml` |
| mkdocs rendered site diff | 0 / 6,819 files |
| SCC API diff | 14 `resolve/*.json` (type) + `scc.json` (type + timestamp) + `index.json` (timestamp) + `types.json` (bucket move) |

## What I executed
- Scratch at `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/ce805c79-1202-4669-936e-9d6ac82db903/scratchpad/sc390-r2a-scratch/`:
  - `before/` = steel-etl 0c74f4f + v2 3aacc9a118.
  - `after/` = steel-etl 8d1c062 + v2 2af78d0.
  - Each side was local-cloned from the worktree's modules and run with `gen --config pipeline.yaml --all` + `site --config <side>/v2/site.yaml`; the API dir was empty in scratch. I then ran `mkdocs build` with the workspace v2 venv binary into `before-site/` and `after-site/`.
  - `sdk/` = data-sdk-npm clone with a copied `node_modules`, used for build/test, the trial rebase (branch `rebase-probe`) and the parse probes.
- In the worktree: only `go build/vet/test` in `steel-etl`. `git status` across `.`, steel-etl, data-sdk-npm, v2 and steelCompendium.github.io is identical before and after (only the superproject's pre-existing unbumped-pointer ` M` entries). I did not touch draw-steel-elements (read-only `git show a337460:` only).
- Scripts: `…/sc390-r2a-scratch/scripts/{validate.js,sdkparse.js,npmparse.js,mutate.py,mutate2.py,trim.py}`.
