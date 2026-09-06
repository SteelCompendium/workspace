# SC-201 generation review

Status: Scott approved the generation diff and source landing on 2026-09-06.
Parser and SDK changes landed first; the September 6 pipeline deployed the generated content. The remaining v2 stylesheet and workspace documentation are completed by the SC-201 finishing change.

## Compared inputs

Fresh four-book `gen --config pipeline.yaml --all` runs before and after the change,
using steel-etl baseline `093da2980cec1130af874f018980594b2a6fcb51` and unchanged book
sources. The v2 baseline is `e2b6a9727621dfe6ede75c56fb8ebbb5547cd9ba`;
SDK baseline is `a4ce584cba6f210047d19e471a379e3a190f9296` (`v3`).

## Results

- No generated files added or removed; 498 files changed across book and unified
  copies: 80 JSON, 80 YAML, 82 Markdown, 96 linked Markdown, 80 DSE Markdown,
  and 80 linked DSE Markdown. Monsters and Summoner data are unchanged.
- Classification JSON is semantically identical, including every registry entry:
  all 3,086 SCC codes, paths, and metadata remain unchanged.
- 14 direct projects gain `item_prerequisite`, `project_source`,
  `project_roll_characteristic`, and `project_goal`. Values remain strings so links
  and qualifiers survive. The two delegating projects do not inherit child fields.
- 26 entity bodies retain quoted H6+ headings in their owner's body instead of
  promoting them to synthetic sections. This includes Imbue Treasure, 23 other
  Heroes entities, and two Beastheart perks. Negotiation's Motivations/Pitfall
  headings stay inside their quoted example; this rule is not ability-specific.
- Every changed Markdown body has the identical ordered word-token sequence after
  frontmatter removal; all 40 changed per-book JSON entities have identical
  ordered word-token sequences in `content`. No prose words or link destination
  tokens were added, lost, or reordered. Quote/heading markers and whitespace
  account for the body differences. This token check is evidence of preservation,
  not a claim that Markdown structure is unchanged.

The key structural change in Imbue Treasure is that Stop Right There stays within
5th-Level Weapon Enhancement, alongside the eight enhancements after Chargebreaker.
Nova likewise stays within 9th-Level Weapon Enhancement, alongside its four
following enhancements. The renderer puts each ability inside its granting panel.
Dragon's Fire remains typed, keeps its SCC/anchor, and is rendered inside Dragon
Soul II. No source annotations or new SCC identifiers were introduced.

The earlier ticket probe's “86 enhancements” included an inline Power Roll label.
The named enhancement count is **85**, across nine leveled projects, with three
granted abilities; the corpus regression test covers these counts and ownership.

## Changed JSON entities

Each row represents one book entity; unified JSON mirrors the same change.

| Entity path under `en/books/` | Change |
|---|---|
| `beastheart/json/perk/ride-along.json` | Quoted-heading structure |
| `beastheart/json/perk/wild-rumpus.json` | Quoted-heading structure |
| `heroes/json/chapter/negotiation.json` | Quoted-heading structure |
| `heroes/json/complication/corrupted-mentor.json` | Quoted-heading structure |
| `heroes/json/complication/lost-your-head.json` | Quoted-heading structure |
| `heroes/json/complication/medium.json` | Quoted-heading structure |
| `heroes/json/complication/medusa-blood.json` | Quoted-heading structure |
| `heroes/json/complication/psychic-eruption.json` | Quoted-heading structure |
| `heroes/json/complication/rogue-talent.json` | Quoted-heading structure |
| `heroes/json/complication/stripped-of-rank.json` | Quoted-heading structure |
| `heroes/json/complication/war-dog-collar.json` | Quoted-heading structure |
| `heroes/json/complication/waterborn.json` | Quoted-heading structure |
| `heroes/json/perk/arcane-trick.json` | Quoted-heading structure |
| `heroes/json/perk/invisible-force.json` | Quoted-heading structure |
| `heroes/json/perk/psychic-whisper.json` | Quoted-heading structure |
| `heroes/json/project/build-airship.json` | Four project fields |
| `heroes/json/project/build-or-repair-road.json` | Four project fields |
| `heroes/json/project/community-service.json` | Four project fields |
| `heroes/json/project/craft-teleportation-platform.json` | Four project fields |
| `heroes/json/project/discover-lore.json` | Four project fields |
| `heroes/json/project/find-a-cure.json` | Four project fields |
| `heroes/json/project/fishing.json` | Four project fields |
| `heroes/json/project/go-undercover.json` | Four project fields |
| `heroes/json/project/hone-career-skills.json` | Four project fields |
| `heroes/json/project/imbue-treasure.json` | Quoted-heading structure |
| `heroes/json/project/learn-from-a-master.json` | Four project fields |
| `heroes/json/project/learn-new-language.json` | Four project fields |
| `heroes/json/project/learn-new-skill.json` | Four project fields |
| `heroes/json/project/perfect-new-recipe.json` | Four project fields |
| `heroes/json/project/spend-time-with-loved-ones.json` | Four project fields |
| `heroes/json/title/arena-fighter.json` | Quoted-heading structure |
| `heroes/json/title/battlefield-commander.json` | Quoted-heading structure |
| `heroes/json/title/giant-slayer.json` | Quoted-heading structure |
| `heroes/json/title/heist-hero.json` | Quoted-heading structure |
| `heroes/json/title/knight.json` | Quoted-heading structure |
| `heroes/json/title/maestro.json` | Quoted-heading structure |
| `heroes/json/title/ratcatcher.json` | Quoted-heading structure |
| `heroes/json/title/zombie-slayer.json` | Quoted-heading structure |
| `heroes/json/treasure/3rd-echelon/trinket/mirage-band.json` | Quoted-heading structure |
| `heroes/json/treasure/3rd-echelon/trinket/nullfield-resonator-ring.json` | Quoted-heading structure |

## Validation and review

- Full steel-etl Go suite passes, including parser scope, project field extraction,
  generated JSON fields, and corpus nesting tests.
- SDK: 409 tests pass; TypeScript build passes; all 16 generated projects validate
  against `project.schema.json`; both schema copies are identical.
- Full MkDocs build passes. Browser checks cover Browse and Read, light/dark
  schemes, plain projects, all three grants, duplicate IDs, and a 390px viewport.
- Before/after screenshots and a self-contained approval request are on
  [SC-201](https://linear.app/tski-home/issue/SC-201/update-downtime-projects-to-get-their-own-cards).

To reproduce, generate all books in a clean isolated checkout at the baseline,
copy `data/data-unified` to scratch, then generate at the review branch with the
same sources/config. Compare relative file sets and contents, JSON keys and
`content`, and classification.json. Run `go test ./...` in steel-etl and
`npm test -- --runInBand && npm run build` in the SDK; build the site with
`go run ./cmd/steel-etl site --config ../v2/site.yaml` and `mkdocs build` in v2.
Do not commit generated output; the deployment recipes own it.
