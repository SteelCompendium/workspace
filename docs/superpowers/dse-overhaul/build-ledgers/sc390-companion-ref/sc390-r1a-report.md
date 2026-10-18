# SC-390 R1a report (steel-etl + data-sdk-npm)

## Executive summary
1. VERDICT: DONE. 14 beastheart companions are `type: statblock` in every format, with structured stats and a `ds-sb` whose `features[]` are their coded Level-1 members; the site renders byte-identically.
2. Branches (all `sc390-companion-ref`, not pushed): steel-etl `8d1c062` (3 commits: c2c40ac data, 50749e8 site, 8d1c062 docs; base 0c74f4f); data-sdk-npm `5ec5a8e` (base origin/v3 69c8d49); v2 `2af78d0690` (site.yaml only); worktree superproject `753e212` (docs + CHANGELOG only, no pointer bumps).
3. Gates: `go build`/`go vet` clean; `go test -count=1 ./...` 847 PASS / 0 FAIL / 0 SKIP (8 packages ok). SDK `npm run build` ok, `npm test` 416/416 (15 suites).
4. SCC: `gen --all` registry 3,096 (heroes 1,962 / beastheart 241 / monsters 662 / summoner 231); vs registry of the ORIGINAL binary on the ORIGINAL input: 0 added, 0 removed, 0 changed; default `validate --scc-stable` passes.
5. Site proof: 14 of 7,308 v2/docs files differ, exactly the 14 companion pages, FRONTMATTER ONLY (type, level "1"->1, new stat fields); bodies, beastheart class page, companion index, Bestiary/index.md identical. API: only the 14 companion `resolve/*.json` `type` flips. See `sc390-r1a-site-diff.txt`.
6. Schema: `free_strike` integer|string + optional `skills[]` in both copies, byte-identical (`diff` clean). SDK bumped to **3.1.0** (additive; `$id` not bumped, per repo convention).
7. NOT published. Publish commands for Scott (after the SDK branch is on origin/v3), in `data-sdk-npm` on `v3`: `git pull --ff-only && just release 3.1.0` (sets version, commits "Prepares for release '3.1.0'", pushes, runs `npm publish`; needs NPM_PAT) or manually `npm publish`. No tag/release created. Then DSE pin `steel-compendium-sdk: 3.1.0`.
8. Open items: none blocking; see Follow-ups (notably: other statblocks still emit `immunities: null` / `movement: "—"`).

## What changed

### steel-etl (branch sc390-companion-ref)
- `input/beastheart/Draw Steel Beastheart.md`: 14 annotations `@type: feature-group | @companion: X | @level: 1` -> `@type: statblock | ...` (annotation matches output type; spec A5 preferred form).
- `internal/content/monster.go`: `StatblockParser` companion branch -> new `parseCompanionStatblock` (organization `Companion`, `companion`, level fallback, em-dash `movement`/empty `immunities` dropped, TypePath `monster.companion.<class>.statblock`, ItemID = species). `internal/content/feature.go`: `FeatureGroupParser` lost its companion branch.
- `internal/content/statblock_parse.go` (`ParseStatblockFields`): `Free Strike` kept as text when not an integer; new `Skills` -> link-free `skills[]`. Other dash handling deliberately NOT changed globally (see Follow-ups).
- `internal/content/parser.go`: `ParsedContent.Members` (ordered coded members). `internal/pipeline/pipeline.go`: `parsedBySection` + `attachCompanionMembers` (direct `ability`/`feature` children of the companion section, document order; the advancement-features featureblock child is excluded).
- `internal/output/statblock_transform.go`: `skills` scalar key; members embedded as the member's own SDK feature object, `ability_type` "Signature" -> "Signature Ability". `internal/output/dse_linked.go`: `resolveMembers` so scc links in embedded members resolve. md-dse / md-dse-linked use the existing `case "statblock"` path (no dse.go change).
- `schemas/statblock.schema.json`: `free_strike` integer|string, optional `skills`.
- Site: `companion_statblock.go` gate rekeyed to the SCC marker (type check removed); `build.go` runs the companion adapter first with `else if` generic `buildStatblockIslandPage` (so the generic path is never taken for a companion); `bestiary_search.go` explicit `monster/companion/` exclusion. Checked and unchanged (proved by the site diff): `bestiary_cards.go:209/238`, `cards.go:241`, `embed_cards.go`, `advancement_pairs.go`, `monster_malice.go`, `summoner_provenance.go`, `search_boost.go`.
- Docs: `steel-etl/docs/statblocks.md` (companion paragraph); `internal/content/helpers.go` comment.
- v2 submodule: `site.yaml` stale `feature-group/` include + comment removed (companions arrive via `monster/`).
- Workspace (worktree superproject): `docs/scc-reference.md` § Companions, `docs/scc-log.md` 2026-10-17 entry, `CHANGELOG.md` Unreleased bullet, one-line "Superseded 2026-10-17 (SC-390)" note under the 2026-06-13 spec's companion-render-path decision (item 1 in its decisions list; the survey cited it as "§9.1").

### Tests added/changed (steel-etl)
- `content/monster_test.go`: `TestStatblockParser_CompanionGrids_AllSpecies` (reads the real Beastheart source; all 14 shapes; SCC code identity), `TestParseStatblockFields_FreeStrikeTextAndSkills`. Removed `TestFeatureGroupCompanionClassified` (behavior removed).
- `output/statblock_transform_test.go`: `TestTransformStatblock_CompanionMembers` (order, signature mapping, text stats, skills). `output/dse_test.go`: `TestDSEGenerator_CompanionStatblock` (verbatim ds-sb golden). `output/dse_linked_test.go`: members link-resolved. `output/schema_validation_test.go`: allowlist + `skills`, companion sample.
- `pipeline/companion_statblock_test.go` + `testdata/fixtures/companion_statblock.md`: e2e over json/yaml/md/md-linked/md-dse/md-dse-linked: codes unchanged, members in order, advancement excluded, md-linked body contract kept.
- `site/companion_statblock_test.go`: `TestBuild_CompanionStatblockTakesCompanionPath` (companion adapter ran, generic cache not populated); fixtures in `advancement_pairs_test`, `build_test`, `class_backlinks_test`, `embed_cards_test` moved to `type: statblock` (index/preview/embed paths pass unchanged). `site/bestiary_search_test.go`: companions excluded.

### data-sdk-npm (branch sc390-companion-ref off v3)
- `src/schema/statblock.schema.json` (byte-identical to steel-etl's: `diff` clean), `StatblockDTO`/`Statblock` (`free_strike`/`freeStrike: number | string`, `skills?: string[]`, `partialFromModel` carries skills), `MarkdownStatblockReader` (non-integer Free Strike kept as text), package.json 3.1.0, CHANGELOG 3.1.0, `.repo-docs` version mentions. Tests: DTO round-trip (`dto-field-parity`), Ajv schema validation (`enriched-schemas`), reader free-strike.
- There is no lint recipe in this repo (justfile: `test` = build + jest).

## Gate numbers
- `go test -count=1 ./...`: 847 pass, 0 fail (log `sc390-r1a-gotest-v.txt`, `sc390-r1a-gotest-final.txt`).
- Registry: 3,096 = heroes 1,962 + beastheart 241 + monsters 662 + summoner 231 (`sc390-r1a-gen-final.txt`); set diff vs original-binary/original-input registry: 0/0 (`sc390-r1a-validate-scc-stable.txt`). Note: `validate <single-file> --scc-stable` compares one book to the whole shared registry and reports other books' codes missing (same on baseline); the default (primary-book) validate passes and the full-registry diff is the real gate.
- Data diff over the entire unified output (before vs after, all formats): only the 14 companion files per format/book + the aggregate `_index/{README,statblock,feature-group}.md` changed. No other statblock changed.
- Site diff: `sc390-r1a-site-diff.txt` (re-run on the final binary; identical).
- SDK: build ok, 416/416 tests.

## Panther md-dse after the change (verbatim)
```
---
agility: 2
companion: panther
file_basename: panther
file_dpath: monster/companion/beastheart/statblock
free_strike: 1 + M
intuition: 2
item_id: panther
item_name: Panther
keywords:
    - Animal
    - Companion
level: 1
might: 2
movement: Climb
name: Panther
organization: Companion
presence: 1
reason: -1
scc: mcdm.beastheart.v1/monster.companion.beastheart.statblock/panther
size: 1M
skills:
    - Sneak
source: mcdm.beastheart.v1
speed: 7
stability: 1
stamina: = yours
type: statblock
---

```ds-sb
agility: 2
ev: ""
features:
    - ability_type: Signature Ability
      distance: Melee 1
      effects:
        - effect: The target takes damage equal to 3 + the panther's Might score, and if they have M < AVERAGE, they are knocked [prone](scc.v1:mcdm.heroes.v1/condition/prone).
          name: Effect
        - cost: Spend 1 Ferocity
          effect: The panther can jump up to a number of squares equal to their speed before using this ability. If they jump at least 1 square in this way, a target who has M < STRONG is knocked [prone](scc.v1:mcdm.heroes.v1/condition/prone).
      feature_type: ability
      flavor: The panther bunches up, then uncoils into a deadly leap.
      keywords:
        - Companion
        - Melee
        - Weapon
      metadata:
        ability_type: Signature
        action_type: Maneuver
        class: beastheart
        content: "*The panther bunches up, then uncoils into a deadly leap.*\n\n| **Companion, Melee, Weapon** |     **Maneuver** |\n|------------------------------|-----------------:|\n| **\U0001F4CF Melee 1**               | **\U0001F3AF One enemy** |\n\n**Effect:** The target takes damage equal to 3 + the panther's Might score, and if they have M < AVERAGE, they are knocked [prone](scc.v1:mcdm.heroes.v1/condition/prone).\n\n**Spend 1 Ferocity:** The panther can jump up to a number of squares equal to their speed before using this ability. If they jump at least 1 square in this way, a target who has M < STRONG is knocked [prone](scc.v1:mcdm.heroes.v1/condition/prone)."
        distance: Melee 1
        feature_type: ability
        flavor: The panther bunches up, then uncoils into a deadly leap.
        item_id: pounce
        item_name: Pounce
        keywords:
            - Companion
            - Melee
            - Weapon
        level: 1
        scc:
            - mcdm.beastheart.v1/feature.ability.companion.beastheart.panther.level-1/pounce
        target: One enemy
        type: feature/ability/companion/beastheart/panther/level-1
      name: Pounce
      target: One enemy
      type: feature
      usage: Maneuver
    - effects:
        - effect: Whenever the panther takes the Advance move action or the Charge action, they can [jump](scc.v1:mcdm.heroes.v1/movement/jump) up to a number of squares equal to their speed in any direction, including vertically, as part of this movement.
      feature_type: feature
      metadata:
        action_type: feature
        class: beastheart
        feature_type: feature
        item_id: mighty-spring
        item_name: Mighty Spring
        level: 1
        scc:
            - mcdm.beastheart.v1/feature.companion.beastheart.panther.level-1/mighty-spring
        type: feature/companion/beastheart/panther/level-1
      name: Mighty Spring
      type: feature
free_strike: 1 + M
intuition: 2
keywords:
    - Animal
    - Companion
level: 1
metadata:
    scc: mcdm.beastheart.v1/monster.companion.beastheart.statblock/panther
    source: mcdm.beastheart.v1
might: 2
movement: Climb
name: Panther
organization: Companion
presence: 1
reason: -1
role: ""
size: 1M
skills:
    - Sneak
speed: 7
stability: 1
stamina: = yours
type: statblock
```
```

## The 14 companion shapes (all: level 1, organization Companion, role "", ev "", stamina "= yours", free_strike "1 + M", 2 features: Signature Ability + one Level-1 feature unless noted)
| species | keywords | size | speed | stab | movement | immunities | skills | M/A/R/I/P |
|---|---|---|---|---|---|---|---|---|
| basilisk | Beast, Companion | 1L | 5 | 2 | (omitted, em-dash) | Poison 3 | Alertness | 2/1/-1/2/2 |
| bear | Animal, Companion | 1L | 5 | 2 | Climb | (omitted) | Intimidate | 2/1/-1/2/2 |
| boar | Animal, Companion | 1M | 5 | 2 | (omitted) | (omitted) | Search | 2/1/-1/2/2 |
| condor | Animal, Companion | 1M | 7 | 0 | Fly | (omitted) | Alertness | 2/1/-1/2/1 |
| deinonychus | Animal, Companion | 1M | 7 | 1 | (omitted) | (omitted) | Track | 2/2/-1/2/1 |
| drake | Companion, Dragon | 1M | 5 | 1 | Fly | "Attuned damage type 3 (see Elementally Attuned)" (link stripped) | Intimidate | 2/1/-1/2/2 (3 features: Drake Breath, Elementally Attuned, Shared Scales) |
| elemental-spark | Companion, Elemental | 1M | 7 | 1 | (omitted) | Lightning 3 | Magic | 2/2/-1/2/1 |
| gummy-ball | Companion, Ooze | 1L | 5 | 2 | (omitted) | Acid 3 | Sneak | 2/2/-1/2/1 |
| hellhound | Companion, Infernal | 1M | 7 | 1 | (omitted) | Fire 3 | Intimidate | 2/2/-1/2/1 |
| lightbender | Beast, Companion | 1L | 7 | 2 | (omitted) | (omitted) | Hide | 2/1/-1/2/2 |
| panther | Animal, Companion | 1M | 7 | 1 | Climb | (omitted) | Sneak | 2/2/-1/2/1 |
| spider | Animal, Companion | 1M | 5 | 1 | Climb | (omitted) | Sneak | 2/2/-1/2/1 |
| sporeling | Beast, Companion | 1S | 5 | 0 | (omitted) | Poison 3 | Track | 2/2/-1/2/1 |
| wolf | Animal, Companion | 1M | 7 | 1 | (omitted) | (omitted) | Track | 2/2/-1/2/1 |

## Open questions
None blocking. Decisions made that the owner may want to know:
- Annotation form: switched the source to `@type: statblock` (not a parser-only retype of `feature-group`), so annotation == output type. PageBody/md-linked body is unchanged, which is why the site is byte-identical.
- Embedded member features are the member's full SDK feature object (same as its own json), including its `metadata` (with raw `content`) so each ds-sb is ~110 lines for the panther. The DSE plugin ignores `metadata`; trimming it is a one-line change in `statblockMemberFeature` if you prefer a leaner block. Note `metadata.ability_type` inside the embedded member still says "Signature" while the top-level `ability_type` says "Signature Ability" (the top-level one is what a statblock feature reads).
- `level` in companion frontmatter changed from string `"1"` to int `1` (the grid's "Level 1" wins; annotation is the fallback).

## Drive-by fixes
- `steel-etl/internal/content/helpers.go`: comment in `findTreasureRuleAncestor` said companion context lives on a `feature-group` ancestor; updated (comment-only, made false by this change).
- `data-sdk-npm/.repo-docs/{ci-cd,index}.md`: version mentions bumped with the release.

## Follow-ups (not done; owner decides)
1. `ParseStatblockFields` still stores the em-dash "none" placeholder for non-companion statblocks: ~150 summoner/monster statblock files emit `"immunities": null`, `"weaknesses": null` and `"movement": "—"` (hit while testing a global fix; reverted to keep this change scoped). `isDashPlaceholder` is the fix, but it rewrites ~150 generated files in other books.
2. The sc-md markdown statblock reader/writer have no Skills cell, so `skills` survives JSON/YAML round trips only.
3. DSE side (next round, per ledger): Skills kv cell, empty-EV omit, DSE SDK pin 3.0.0 -> 3.1.0, jest/harness fixtures. The drake's immunity text loses its Elementally Attuned link in the structured data (link stripped by design); the book table still links it.
4. `validate <file> --scc-stable` for a single book compares against the whole shared registry (reports other books' codes missing, also on baseline). Consider scoping it to the file's book.
5. Pre-existing gofmt drift (`gofmt -l` lists ~10 files, none introduced here).
6. A stray `.devbox/` directory exists at the worktree root (gitignored) from one accidental `devbox run` issued from the worktree instead of the workspace root.

## Artifacts (ledger dir /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc390-companion-ref/)
- sc390-r1a-report.md (this), sc390-r1a-site-diff.txt, sc390-r1a-site-before.txt, sc390-r1a-site-final.txt, sc390-r1a-gen-before.txt, sc390-r1a-gen-final.txt, sc390-r1a-validate-scc-stable.txt, sc390-r1a-gotest-final.txt, sc390-r1a-gotest-v.txt, sc390-r1a-sdk-build.txt, sc390-r1a-sdk-test.txt, sc390-r1a-sdk-npm-install.txt, sc390-r1a-panther-mddse.md.
- Generated dirt restored with the safe form (v2 `clean -fdq docs site` + `checkout -- docs/Browse docs/Read docs/scc docs/pins.md`; `steelCompendium.github.io checkout -- docs/api/v1/`); all submodules report 0 dirty files. `data/` in the worktree holds the new gen output (gitignored scratch).
