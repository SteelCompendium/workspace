# SC-390 R0 survey — companion `ds-scc` reference fails to render

## Executive summary (≤10 lines)
1. **Recommendation:** fix it in the data. steel-etl emits the 14 beastheart companions as `type: statblock` with a real ```` ```ds-sb ```` block, the way retainers, minions, champions and rivals already are. Once that ships, DSE's existing `STATBLOCK_TYPE_RE` (`typeAdapters.ts:58`) routes them with **no dispatch change**, and `statblockKindNoun` (`statblock/view.ts:184-196`) already prints the "Companion" label.
2. Probe: steel-etl's existing monster grid parser `ParseStatblockFields` already reads the companion table correctly. Two exceptions: Free Strike `1 + M` is silently dropped (it is not an integer) and Skills is ignored. Evidence: `sc390-r0-probe-parsefields.txt`.
3. **Correction to the owner's finding:** the md-dse companion file has **no `##` ability sections**, only frontmatter and the table. The abilities and features are separate coded member files. The `##` sections exist only in md-linked `PageBody`, so the `ds-sb` `features[]` must be built from the coded members (Pounce and Mighty Spring for panther).
4. **`feature-group` is not the only orphan.** 10 frontmatter types (233 md-dse files) hit "has no renderer": skill 57, monster (group lore) 51, saint 28, chapter 26, project 16, feature-group 14, movement 13, negotiation 12, god 11, skill-group 5. The reference insert offers every one of them (`compendiumInsert.ts:360`, no filter). The other 9 are prose/display types and need a different fix (a generic card), so they should be a separate ticket. SC-390 is still the only statblock-shaped hole.
5. **Decision for Scott:** companions become `type: statblock` in every output format (json/yaml/md/md-linked/md-dse). This also moves the shared schema: `free_strike` becomes integer-or-string, and an optional `skills` field is added. The alternatives (a new `companion` type, a `ds-sb` in md-dse only while the type stays `feature-group`, or a DSE-side table parser) all lose on consistency. See §D.
6. Sub-decision (gate-moving): DSE should drop the header's "EV" text when `ev` is empty. Otherwise companions, and the 4 summoner champions today, show a dangling "EV ". This changes the frozen `statblock-roleless-corpus` print and realprint shots, a **2-line sanctioned rebaseline**. Everything else for DSE is additions only (a widening).

## Evidence index
- `sc390-r0-probe-parsefields.txt`: output of a throwaway go test calling `content.ParseStatblockFields` on the panther and drake md-dse bodies. The test file was created and deleted. Worktree clean before and after.
- `sc390-r0-json-type-census.txt`: unified json `type` census.
- `sc390-r0-mddse-type-census.txt`: md-dse census per type (count, files with a `ds-*` block, block kinds, simulated `baseForSccType` mapping, example path).
- All code was read in `/home/scott/code/steelCompendium/worktrees/sc390-companion-ref` (dse 9ad919d, steel-etl 0c74f4f, data-sdk-npm 69c8d49).

---

## A. Data side (steel-etl)

### A1. How md-dse emits blocks today
`internal/output/dse.go:45-113` `buildDSEFile` switches on frontmatter `type`:
- `ability|trait|feature` → `buildDSFeatureBlock` (dse.go:163-214) → ```` ```ds-feature ````
- `statblock` → `buildDSDataBlock("ds-sb", transformStatblock(...))` (dse.go:68-76)
- `featureblock|dynamic-terrain` → `buildDSDataBlock("ds-fb", transformFeatureblock(...))` (dse.go:77-83)
- default → plain `parsed.Body`, plus the kit's signature ability as a ds-feature (dse.go:84-110). **`feature-group` falls here**, so the output is frontmatter plus the raw table and no block.

`transformStatblock` (`internal/output/statblock_transform.go:28-49`) copies `statblockScalarKeys` (L10-16) from frontmatter, forces `type: statblock`, applies `statblockDefaults` (L19-24: ev "", level 0, free_strike 0, …), builds `features` from `content.ParseStatblockFeatures(parsed.Body)` (blockquote features), and sets `metadata.scc/source`. json/yaml use the same transform through `TransformToSDKFormat` (`sdk_transform.go:13-30`, `json.go:23`, `yaml.go:23`). `feature-group` is a passthrough there, which is why `panther.json` is `{content: <table>, type: feature-group, level: "1"}`.

Schema the block carries: `steel-etl/schemas/statblock.schema.json`, byte-identical to `data-sdk-npm/src/schema/statblock.schema.json` (diffed). In it, `stamina` is a string, while `free_strike`, `level`, `speed`, `stability` and the characteristics are **integers**. No `skills` property. `additionalProperties` is not set, but the field allowlist is enforced by `internal/output/schema_validation_test.go:86-94`. Neither repo runs a real JSON-schema validator over generated output (grep for jsonschema libraries: none).

### A2. Where the companion comes from
- Source: `input/beastheart/Draw Steel Beastheart.md:811-857` has `<!-- @type: feature-group | @companion: panther | @level: 1 -->` followed by `#### Panther`, the 5-column grid, then annotated children `##### Pounce` (`@type: ability`), `##### Mighty Spring` (`@type: feature`) and `##### Panther Advancement Features` (`@type: featureblock`).
- Parser: `internal/content/feature.go:40-72` `FeatureGroupParser`. Its companion branch sets `TypePath monster.companion.<class>.statblock` and `ItemID <species>`, but leaves `type: feature-group`. Its own comment calls it a "statblock-IDENTITY entity" that keeps rendering as a feature-group page (spec `docs/superpowers/specs/2026-06-13-companion-restructure-advancement-featureblocks-design.md` §5/§9.1 locked "identity-only change; render path unchanged").
- `Body = section.FullBodySource()` (`parser/section.go:60-79`) **skips annotated children**, so Body is the table only. The md-linked `PageBody` (`RenderSubtree`, pipeline.go:233-236) carries the `##` member sections. That is what the site parses.

### A3. Can the companion be a proper `ds-sb`? Yes. Probe results
Running `ParseStatblockFields(name, body)` (`statblock_parse.go:184-262`, the same parser `StatblockParser` uses) on the real companion body:
```
panther: keywords [Animal Companion], level 1, size 1M, speed 7, stamina "= yours", stability 1,
         movement Climb, might 2, agility 2, reason -1, intuition 2, presence 1, immunities nil
drake:   … immunities ["Attuned damage type 3 (see Elementally Attuned)"], movement Fly …
```
Gaps to close in a companion-aware parse:
| Field | Today via ParseStatblockFields | Needed |
|---|---|---|
| Free Strike `1 + M` | **dropped** (`intField` fails → `transformStatblock` default **0**, which is wrong) | string `"1 + M"`; schema widened to integer-or-string |
| Skills `[Sneak](scc.v1:…)` | ignored (no label mapping) | new `skills: [Sneak]` (string list, link-stripped) |
| role/org | empty → DSE shows "No Role" | `organization: Companion` (precedent: `knownOrganizations` already holds the non-standard `Retainer` and `Champion`, `statblock_parse.go:43-47`; the site already shows "Companion") |
| ev | absent → default `""` | keep `""` (schema-required); DSE should omit an empty EV (§B, sub-decision) |
| Movement `—` (boar etc.) | stored as `"—"` (only `-` is treated as empty) | treat em-dash as empty, matching `isDashPlaceholder` |
| features | `ParseStatblockFeatures(Body)` finds none (table-only body) | built from the coded members (A4) |

**Links inside cells:** the monster grid path already strips links from structured stat values (`parseStatGrid`, `statblock_parse.go:651-660`, `linkDisplay`). A corpus scan found **0** of 513 statblocks with a link in any stat field. So the consistent behaviour is that `[Sneak](scc.v1:…)` becomes `Sneak` in the data block. DSE renders stat cells with `textContent` (`statblock/view.ts:386-399`), so a raw link would otherwise show as literal markdown. The site is unaffected because it parses the md-linked table, not frontmatter.

**String values in DSE:** the SDK does no coercion. `StatblockDTO` (`data-sdk-npm/src/dto/StatblockDTO.ts:33-36`, the `Object.assign` in `SteelCompendiumDTO`) and `Statblock.fromDTO` (`model/Statblock.ts:39-47`) pass strings through. DSE prints `${sb.stamina}` and `${sb.freeStrike}` as template strings (`statblock/view.ts:213-219`). So `= yours` and `1 + M` render verbatim. Stamina strings are already in the corpus: 4 champions are `"SPECIAL"` and ~36 summoner minions are `"5 | 5"`. Free Strike would be the **first** string `free_strike`. TS types say `number`, so the SDK DTO/model types should become `number | string`. Extra fields such as `skills` also survive the DTO at runtime (`Object.assign`).

### A4. Building `features[]` from the coded members
Panther's base abilities are separate entities: `feature.ability.companion.beastheart.panther.level-1/pounce` (`type: ability`) and `feature.companion.beastheart.panther.level-1/mighty-spring` (`type: feature`). Two ways to fill `features[]`:
- **(preferred) Pipeline attach.** After the walk (`pipeline.go:225-246`, where `sccBySection` is already complete), give each companion its **direct** coded `ability`/`feature` members, in document order and excluding the advancement-features featureblock subtree, as a new ordered field on `ParsedContent`. `transformStatblock` then maps each one through the same feature map `buildDSFeatureBlock`/`transformAbility` produce for the standalone file. The embedded feature then matches the member's own ds-feature (including `metadata.scc`), and `subtype: signature` maps to `ability_type: Signature Ability` like monster `ds-sb` features.
- (alternative) Parser-side re-parse of child sections with a fresh `ContextStack`. This follows the kit precedent (`kit.go:56-66`) and the single-ability trait (`feature.go:249-259`). It loses the `companion`/`class` context, so metadata and paths diverge from the standalone file. It is weaker.

### A5. Type decision and annotation
- **Frontmatter `type: statblock`.** Every other `monster.*.statblock` entity (retainers, minions, champions, rivals: 513 files) is `type: statblock`. The companion is the lone exception.
- Annotation (implementer's call, gated by SCC stability): preferred is `@type: statblock` with the companion handled as a `StatblockParser` domain case (`monster.go:70-148` already switches on `domain` for retainer/minion/champion/rival/fixture). It must keep `@companion` and `@level` so member paths are unchanged: `ability.go:131-139` and `feature.go:~196` key on the `companion` context and `levelStr`, not on the `feature-group` ancestor. The fallback is to keep the `feature-group` annotation and set `type: statblock` in `FeatureGroupParser`'s companion branch, at the cost of an annotation/output mismatch. Either way the hard gate is `steel-etl validate --scc-stable`: 0 code changes, registry still 3,096.

### A6. Every consumer of `feature-group` (and of `statblock`, which the flip would newly reach)
`feature-group` (steel-etl, code):
- `internal/content/feature.go:40-72`: the parser that changes.
- `feature.go:148,210-228` and `ability.go:152-164`: `findAncestorID(…,"feature-group")` for **uncoded** class/common groups. Companion members take the companion branch first, so they are unaffected (verify with `--scc-stable`).
- `internal/content/helpers.go:43`: comment only; `findTreasureRuleAncestor` keys on `cur["companion"]`, not on the type.
- `internal/content/monster.go:388`, `content/treasure.go:203`: comments.
- `internal/cli/validate.go:18,129`: lint that suggests `feature-group` for level groupings. Unaffected.
- `internal/site/companion_statblock.go:226`: **gate** `type != "feature-group"` → return. **Must rekey** to the scc marker (`companionMarker`, L203) alone.
- `internal/site/build.go:471-476`: the companion page transform runs **after** `buildStatblockIslandPage` (build.go:425, `statblock_page.go:132-136`). After the flip the generic statblock path claims the page first and renders a features-less card with no Skills. Fix by moving the companion transform before it, or by guarding `buildStatblockIslandPage` against companions.
- `internal/site/embed_cards.go:36-59` (`cardableType`/`standaloneType` already include `statblock`, so `leafCard`/`dropForeignSCCTail` behave the same), plus comments at `:63,90,248`.
- `internal/site/ability_cards.go:48,68`, `build.go:323`, `action_abilities.go:13`: comments only (action_abilities is about the uncoded Combat "Maneuvers" feature-group).
- `v2/site.yaml:76-78`: a stale `feature-group/` include (no such md-linked dir exists any more); comment cleanup.
- The 14 `v2/docs/Browse/monster/companion/beastheart/*.md:8` frontmatter: generated, regenerated by deploy.
- data-sdk-npm and DSE `src/`: **no** `feature-group` references.

`statblock` consumers newly reached by the flip (site, must stay identical):
- `site/bestiary_search.go:51-56`: `monster/` prefix → companions would **start appearing in the Bestiary search as "statblock"**. Add an explicit companion case (exclude, to stay identical; a "companion" facet is a follow-up).
- `site/bestiary_cards.go:209,238` (`isBestiaryTypeRootWithStatblocks`, `splitByType`) and `cards.go:241` (`dirHasStatblockLeaf`): the companion index currently goes through `advancement_pairs.go:98-108` `companionPreviewCard` (cache keyed by scc, so unaffected). Verify the index layout does not switch branches.
- `site/monster_malice.go:238`: `maliceKey(scc)`; verify it is a no-op for companion codes.
- `site/summoner_provenance.go:43-53`: segment checks; verify the companion scc does not match.
- `site/search_boost.go:18-36`: neither type is boosted → no change.
- `site/companion_statblock.go`/`advancement_pairs.go:104`: the island cache stays keyed by scc.
- Tests: `internal/site/*_test.go` companion fixtures written with `type: feature-group` need updating. `schema_validation_test.go:86-94` allowlist gains `skills`.

Other outputs that change for the 14 files (intended): json/yaml become the SDK statblock shape (with `features[]`). md and md-linked frontmatter gain stat fields and `type: statblock` (bodies unchanged). md-dse and md-dse-linked gain the `ds-sb` block.

## B. Plugin side (draw-steel-elements)

- **Dispatch needs nothing new.** `baseForSccType` (`scc/definition.ts:190-193`) maps through `adapterForType`. `STATBLOCK_TYPE_RE = /(^|\.)statblock$/` (`typeAdapters.ts:58`) matches bare `statblock`. `dsBlockAdapter` reads the first `ds-*` fence (`typeAdapters.ts:24-29,137-147`), so `ds-sb` qualifies. `StatblockConfig.readYaml` (`model/StatblockConfig.ts:64-71`) builds the model. This is the same path `sccElement.test.ts` already proves for the goblin (`test/dom/elements/sccElement.test.ts:~225`).
- **Already companion-aware:** `statblockKindNoun` returns "Companion" for a `metadata.scc` type path containing `companion` (`statblock/view.ts:184-196`, ported from the site).
- **Side effects of the flip, intended:**
  - `referenceAliasForType('statblock')` → the insert writes a typed `ds-sb` reference for companions instead of `ds-scc` (`typeAdapters.ts:283-308`). Scott's literal `ds-scc` block keeps working.
  - Companions become eligible for the **snapshot** insert (`snapshotAliasForType`, `compendiumInsert.ts:382`).
- **Small DSE view work for parity with the site card:**
  1. A `Skills` kv cell in `statblockMetaCells` (`view.ts:226-233`), rendered only when `skills` is present. The site puts Skills in the 4th meta slot (`companion_statblock.go:131`). This is additive DOM, and no existing fixture has `skills`.
  2. Omit the EV header slot when `ev` is empty. Today it prints `"EV "` (`view.ts:169`). This affects companions and the 4 champions, and moves the frozen `statblock-roleless-corpus--steel-{print,realprint}.png` (ev `""`, `test/fixtures/statblock/roleless-corpus.yaml:34`), so it needs **sanction**.
- **No precedent for a cross-family base.** Every base comes from its own family regex, and fixtures are not cross-family: steel-etl re-typed them to `featureblock` (`monster.go:82-97`, spec 2026-06-13 §4, "statblock_kind hack retired"). That rename is the precedent for fixing the *type* in data rather than adding a mapping in DSE.
- **Docs:** `docs/compendium-sync.md:82-83` promises "a `ds-scc` block renders any entry in it", which is false for the 233 orphans in §C. Per the deferral-docs rule, add a "what works / what doesn't yet" line: skills, skill groups, gods, saints, movement, negotiation, projects, chapters and monster-group lore pages currently show "no renderer". Companions come off that list with SC-390. Add a CHANGELOG `## Unreleased` bullet.
- Shipping: DSE syncs the **`md-dse` data-unified release asset** (`data/CompendiumSyncService.ts:11`). The user-visible fix arrives with the next data deploy and a re-sync. The DSE code (Skills cell, EV omission) ships with the next plugin release. Until then a companion renders without Skills and with "EV ".

## C. Family census (unified md-dse, 2026-10-16 data)

Commands: `grep -rhoE '"type": *"[a-z.-]+"' data/data-unified/en/unified/json | sort | uniq -c` (→ `sc390-r0-json-type-census.txt`), plus a Python walk of md-dse that simulates `TYPE_ADAPTERS` (→ `sc390-r0-mddse-type-census.txt`). "renders?" means the type has a base and, for the ds-block family, a block. The frontmatter and generic families need no block.

| type | count | md-dse block | base (`baseForSccType`) | renders? |
|---|---|---|---|---|
| feature | 876 | ds-feature 876/876 | ds-feature | yes |
| ability | 621 | ds-feature 621/621 | ds-feature | yes |
| statblock | 513 | ds-sb 513/513 | ds-statblock | yes |
| rule | 163 | none | ds-rule (generic note) | yes |
| treasure | 127 | none | ds-treasure (frontmatter) | yes |
| featureblock | 121 | ds-fb 121/121 | ds-featureblock | yes |
| complication | 100 | none | ds-complication | yes |
| trait | 95 | ds-feature 95/95 | ds-feature | yes |
| title | 66 | none | ds-title | yes |
| **skill** | 57 | none | **none** | **no** |
| perk | 55 | none | ds-perk | yes |
| **monster** (group lore) | 51 | none | **none** | **no** |
| dynamic-terrain | 35 | ds-fb 35/35 | ds-featureblock | yes |
| **saint** | 28 | none | **none** | **no** |
| **chapter** | 26 | none | **none** | **no** |
| kit | 25 | ds-feature 25/25 (sig. ability) | ds-kit (frontmatter) | yes |
| career | 18 | none | ds-career | yes |
| **project** | 16 | none | **none** | **no** |
| **feature-group** (companions) | 14 | **none** | **none** | **no** ← SC-390 |
| culture | 13 | none | ds-culture | yes |
| **movement** | 13 | none | **none** | **no** |
| ancestry | 12 | none | ds-ancestry | yes |
| **negotiation** | 12 | none | **none** | **no** |
| class | 11 | none | ds-class | yes |
| **god** | 11 | none | **none** | **no** |
| condition | 9 | none | ds-condition | yes |
| **skill-group** | 5 | none | **none** | **no** |

**Verdict: a family of 10 orphan types and 233 files, all offered by "Insert compendium reference"** (`compendiumInsert.ts:360`; only the snapshot command filters, at L382). The companion is the only *statblock-shaped* orphan and the only one whose fix is "emit the right type and block". The other 9 are prose/display pages. Their natural fix is DSE-side: widen the model-less generic-note family, `genericNoteAdapter` (`typeAdapters.ts:215-233`, today rule-only, with `RULE_SCC_SEGMENT_RE` hardcoded at L177), or give them their own cards. That is a different design question, so it is a different ticket.

## D. Recommendation

**Fix shape (repos):**
1. **steel-etl:**
   - Companions emit `type: statblock` (A5) with stat frontmatter from the shared grid parser, plus: `free_strike` string `1 + M`; `skills`; `organization: Companion`; em-dash treated as empty.
   - `features[]` from the attached coded members (A4).
   - md-dse and md-dse-linked emit `ds-sb` through the existing `case "statblock"`.
   - Site: rekey the companion gate to scc, run it before `buildStatblockIslandPage`, and exclude companions from the bestiary (A6).
   - `schemas/statblock.schema.json`: `free_strike` becomes `["integer","string"]` and `skills` is added. Update the allowlist test.
2. **data-sdk-npm:** the same schema edit (dual-schema-sync rule, spec 2026-06-13 §7). `StatblockDTO`/`Statblock` get `free_strike: number | string` and `skills?: string[]`. **Owner sub-call:** do the SDK release and DSE bump inside SC-390 (the right thing; DSE pins `steel-compendium-sdk` 3.0.0 at `package.json:60`), or have DSE read `skills` through a typed local extension until the next SDK bump.
3. **draw-steel-elements:** a Skills kv cell; omit empty EV (sanctioned 2-line rebaseline); jest coverage; a harness widening; the docs line.
4. **workspace docs:**
   - `docs/scc-reference.md` § Companions: the companion is `type: statblock`, and its `ds-sb` carries the base features.
   - `docs/scc-log.md`: a dated entry (type change; codes unchanged).
   - The AGENTS.md SCC summary needs no change (code counts are unchanged).
   - CHANGELOG `## Unreleased`.
   - Note that spec 2026-06-13 §9.1 ("identity-only, render path unchanged") is superseded for the data layer.

**Concrete `panther` md-dse after the fix** (frontmatter mirrors the scalar keys; abbreviated):
````
---
type: statblock
name: Panther
scc: mcdm.beastheart.v1/monster.companion.beastheart.statblock/panther
level: 1
organization: Companion
keywords: [Animal, Companion]
size: 1M
speed: 7
stamina: = yours
stability: 1
free_strike: 1 + M
movement: Climb
skills: [Sneak]
might: 2
agility: 2
reason: -1
intuition: 2
presence: 1
companion: panther
…item_name/item_id/file_*/source…
---

```ds-sb
name: Panther
type: statblock
level: 1
role: ""
organization: Companion
keywords: [Animal, Companion]
ev: ""
size: 1M
speed: 7
stamina: = yours
stability: 1
free_strike: 1 + M
movement: Climb
skills: [Sneak]
might: 2
agility: 2
reason: -1
intuition: 2
presence: 1
features:
  - type: feature
    feature_type: ability
    name: Pounce
    ability_type: Signature Ability
    flavor: The panther bunches up, then uncoils into a deadly leap.
    keywords: [Companion, Melee, Weapon]
    usage: Maneuver
    distance: Melee 1
    target: One enemy
    effects:
      - name: Effect
        effect: The target takes damage equal to 3 + the panther's Might score, and if they have M < AVERAGE, they are knocked [prone](scc.v1:mcdm.heroes.v1/condition/prone).
      - cost: Spend 1 Ferocity
        effect: The panther can jump up to a number of squares equal to their speed before using this ability. …
    metadata: {scc: mcdm.beastheart.v1/feature.ability.companion.beastheart.panther.level-1/pounce, …}
  - type: feature
    feature_type: feature
    name: Mighty Spring
    effects:
      - effect: Whenever the panther takes the Advance move action or the Charge action, they can [jump](scc.v1:mcdm.heroes.v1/movement/jump) …
    metadata: {scc: mcdm.beastheart.v1/feature.companion.beastheart.panther.level-1/mighty-spring, …}
metadata:
  scc: mcdm.beastheart.v1/monster.companion.beastheart.statblock/panther
  source: mcdm.beastheart.v1
```
````
The advancement features (L3/6/10) stay their own `…advancement-features/panther` `ds-fb` entity, which already renders through `ds-scc`. They are **not** folded into `features[]`.

**Must stay identical on the site:**
- The companion page `Browse/monster/companion/beastheart/<species>`: the `.sb-wrap` card with Skills in the 4th meta slot, "Companion" role, no EV, and the advancement section below.
- The index `.sb-prev` preview and pairing (`advancement_pairs.go`).
- Bestiary search membership (companions currently absent).
- The search index and boosts, and embed transclusion on the beastheart class page.

Proof: build `v2/site.yaml` in the worktree before and after, then diff `v2/docs/Browse/monster/companion/**`, the bestiary JSON and the search index. The only allowed differences are the frontmatter `type` and the new stat fields. Discard the generated diff afterwards; deploy regenerates it.

**Test plan:**
- steel-etl:
  - A unit test for the companion grid parse covering all 14 shapes: `1 + M`, `= yours`, em-dash, the drake immunity link, Skills link-stripping, `1S`/`1L`.
  - `transformStatblock` with attached members (order; signature mapping; the advancement subtree excluded).
  - A `dse_test.go` golden for a companion `ds-sb`, plus a schema-allowlist update.
  - A site test for the companion page and preview with `type: statblock` (rekeyed gate; generic statblock path not taken; bestiary excludes it).
  - `go test ./...`, `steel-etl validate --scc-stable` (0 changes), and `gen --all` registry count unchanged (3,096).
- DSE jest:
  - Add a real `test/fixtures/md-dse/monster/companion/beastheart/statblock/panther.md`.
  - `sccElement.test.ts`: the panther code renders `.dse-sb`, `data-dse-element="statblock"`, left eyebrow "Companion", Free Strike `1 + M`, Stamina `= yours`, a Skills cell, 2 features, no "EV" text.
  - A `statblock.test.ts` catcher for the Skills cell and empty-EV omission.
- DSE harness:
  - The harness deliberately has **no `ds-scc` fixture** (`visual-harness/entry.ts:1907-1911`: no `cx.compendium`).
  - So the visual fixture is an inline **companion-corpus `ds-sb`**, single-sourced at `test/fixtures/statblock/companion-corpus.yaml` like the villain-corpus and roleless-corpus precedents. That gives new shot names `statblock-companion-corpus--*`, which is a **widening** (additions only, no sanction; the dispatcher applies it at landing; 274 → 276 with print and realprint).
  - The EV-omit change is the only **rebaseline**: 2 lines, `statblock-roleless-corpus--steel-{print,realprint}.png`. It needs a before/after crop plus `rebaseline.txt` for Scott's sanction. Never touch the shared baseline from the worktree.
  - Parity: run last, expect 0 GAP and 0 undeclared. The Skills cell may need a parity selector check against the site's 4th-meta-slot markup.

**2–3 sentence version for Scott:**
> The Panther fails because steel-etl still emits beastheart companions as a generic `feature-group` with only a markdown table, so the plugin has no data to draw a statblock from. I'd fix it at the source: make companions `type: statblock` in all formats with a real `ds-sb` block (their abilities included). The plugin's existing statblock card then renders them; the only plugin additions are a Skills line and hiding an empty "EV". The site stays identical, and the only shared-schema change is that Free Strike may now be text (`1 + M`) plus an optional `skills` list. The alternatives are a new `companion` type, a `ds-sb` in the plugin data only while the type stays `feature-group`, or teaching the plugin to parse the markdown table. All three leave companions as the one statblock-shaped entity that isn't `type: statblock`, or duplicate the site's parser in TypeScript.

Why the alternatives lose:
- (a) **A new `companion` type:** a new discriminator in both schemas, the SDK and DSE regexes, while retainers, champions, minions and rivals already prove `statblock` plus `organization` is the house pattern.
- (b) **`ds-sb` in md-dse only, keeping `feature-group`:** the formats disagree about what the entity is, and DSE would have to map a generic container type to the statblock family, the "lie in the dispatcher" SC-141 warned against.
- (c) **A DSE-side table parser:** duplicates `companion_statblock.go` in TS, cannot reach the abilities (they are separate files), and leaves json/yaml consumers with a table blob.

**Out of scope, suggested as separate Backlog tickets (owner files them):**
1. **ds-scc orphan types:** skill, skill-group, movement, negotiation, god, saint, project, chapter and monster-group lore (219 files). They show "no renderer" yet are offered by the reference insert. Fix with a generic-note family widening or dedicated cards, and/or filter the insert. The compendium-sync.md honesty line ships in SC-390 regardless.
2. **Companion advancement in DSE:** show the `…advancement-features/<species>` featureblock under the companion card (the entity-embedding effort in scc-reference.md:131 has "no ticket filed yet").
3. **EncounterData:** `max_stamina = +(resolved.stamina)` becomes NaN for string stamina (`src/drawSteelAdmonition/EncounterData.ts:701,779`). This is pre-existing for champions (`SPECIAL`) and minions (`5 | 5`) and becomes reachable for companions (`= yours`).
4. **Bestiary "companion" facet**, if Scott wants companions searchable (SC-390 keeps them excluded so the site stays identical).
5. **Site consolidation:** once the data carries the stats, consider retiring the markdown-table parse in `companion_statblock.go` in favour of frontmatter-driven island data (the site's own consistency).
6. Stale `v2/site.yaml:76-78` `feature-group/` include and comment. This could be folded into SC-390 as a comment fix.

OPEN items (not resolved in this survey):
- Whether the SDK release and DSE bump happen inside SC-390 (§D.2).
- Exact annotation form (A5): implementer's choice, gated by `--scc-stable`.
- Whether `bestiary_cards.go:209/238` and `cards.go:241` change the companion index branch: verify with the before/after site diff.
- Nothing was executed in DSE (the worktree has no node_modules). The B-side claims come from code reading plus the existing goblin `ds-scc` e2e test, which exercises the identical path.

Note: the shared main checkout's `draw-steel-elements` shows ` M` (demo-vault/Welcome.md, justfile, plus untracked compendium-manifest.json and "demo-vault/montage 1.md"). This was not caused by this survey (all reads came from the worktree, plus one read of the main checkout's node_modules/steel-compendium-sdk/package.json). It is reported for awareness.
