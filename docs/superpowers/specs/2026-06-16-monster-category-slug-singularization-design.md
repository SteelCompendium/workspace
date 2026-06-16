# Monster category slug singularization — design

**Date:** 2026-06-16
**Status:** Approved (brainstorm) — ready for implementation plan
**Scope:** SCC registry re-mint of the Monsters book monster-group slugs (pre-freeze)

## Problem

The monster category segment — the `<x>` in `monster.<x>.statblock/<id>` and its
matching group landing `monster.group/<x>` — is currently slugified verbatim from the
sourcebook's H2 group heading. The book mixes singular and plural headings:

- Plural families: `Goblins`, `Orcs`, `Dragons`, `Demons`, `Dwarves`, `War Dogs`, …
- Singular solos: `Hag`, `Werewolf`, `Medusa`, `Manticore`, `Chimera`, …
- Named individuals: `Xorannox the Tyract`, `Ajax the Invincible`, `Valok`, …

This produces inconsistent codes (`monster.goblins.statblock/worg` vs
`monster.hag.statblock/wode-hag`). Two facts make this worth fixing **before the
registry is frozen**:

1. **Spec §7.2 ("Singular Type Names")** says every *type* segment is singular
   (`class`, not `classes`). The category sits in the type path, so by the spec it
   should be singular — it was carved out as book-faithful when Monsters was
   integrated, and that carve-out is the inconsistency.
2. The book's plurality is **count-driven** (a section is titled plural only because
   it happened to print several statblocks). The Steel Compendium aggregates multiple
   sources, so a "Hag" section may gain more hags later. Book-faithful plurality is
   therefore **unstable** and cannot be the rule.

## Decision

**Normalize every monster category slug to singular**, using one canonical singular
slug identically in the group landing and the statblock category. The group's plural
display name (e.g. "Goblins") is preserved purely as the page **title** (from the
heading); the SCC slug is the identifier and is singular.

```
BEFORE  monster.group/goblins          AFTER  monster.group/goblin
        monster.goblins.statblock/worg        monster.goblin.statblock/worg   (title: "Goblins")
```

Rationale, in priority order:

1. **Spec §7.2** — singular type segments.
2. **Aggregation-stable** — singular is count-independent; it holds whether a group
   has 1 statblock or 50.
3. **Matches the monster family's own convention** — `companion`, `fixture`, `minion`,
   `champion`, and the portfolios `undead` / `fey` / `demon` / `elemental` are already
   singular. The Monsters-book creature groups are the *only* plural type segments in
   the entire ~3,015-code registry. Singularizing removes the lone outlier.

### Rejected alternatives

- **Book-faithful (keep mixed plurality).** Rejected: count-driven and unstable under
  aggregation (the user's decisive point).
- **Count-based semantic rule (plural family / singular solo).** Rejected: same
  instability — membership can change as sources are added.
- **All plural.** The one honest argument for plural is that a category is a
  *collective/faction* ("a worg is a member of *the Goblins*, not a goblin"). Real but
  minor — the faithful plural survives as the page **title**, and plural would make the
  creature groups conflict with §7.2 and with every other singular segment in the
  scheme, including the rest of `monster.*`.
- **Singularize statblock category but leave landing plural** (`monster.group/goblins`
  + `monster.goblin.statblock/...`). Spec-defensible (item vs type segment) but the two
  slugs visibly differ. Rejected in favour of one canonical slug.
- **Aliases for the old plural URLs.** Rejected: `frozen: false`, nothing external is
  promised yet, so a clean re-mint is preferred over ~280 soon-pointless alias entries.

## Mechanism

The category slug is derived in exactly one place: `MonsterParser`
(`internal/content/monster.go`, `@type: monster`) reads `@category` or falls back to
`Slugify(heading)`, then seeds it as `category` context for **both** the group landing
(`monster.group/{category}`, `ItemID: category`) and every descendant statblock
(`{domain}.{category}.statblock/{id}`). A single `@category` per group therefore fixes
the landing and all its statblocks at once — delivering the "one canonical slug" goal
for free.

**Change = add `@category: <singular-slug>` to each currently-plural group heading** in
`steel-etl/input/monsters/Draw Steel Monsters.md`. Headings that already slugify to the
desired singular (solos + named individuals + invariants `Lizardfolk`/`Undead`) need no
annotation.

### One code touch

`StatblockParser` hardcodes the literal `"rivals"` in two `compactPath(...)` calls (the
rival-summoner statblock path and its minion-summons path). When `rivals → rival`, those
two literals must become `"rival"` to stay in sync with the re-slugged group. This is the
only Go change; everything else is annotation + re-mint.

## Scope

**In scope:** Monsters book monster groups only. ~31 slugs change.

**Out of scope (already singular / unaffected):** the Summoner family
(`monster.minion.summoner.*`, `monster.champion.summoner.*`, the rival-summoner echelon
paths apart from the `rivals→rival` literal), beastheart companions
(`monster.companion.beastheart.*`), and fixtures (`monster.fixture.*`).

### Full group mapping

Echelon subcategories (`1st-echelon`, …) are independent context and are unaffected.

| Book heading | Old slug | New slug | Change? |
|---|---|---|---|
| Angulotls | `angulotls` | `angulotl` | ✓ |
| Animals | `animals` | `animal` | ✓ |
| Basilisks | `basilisks` | `basilisk` | ✓ |
| Bugbears | `bugbears` | `bugbear` | ✓ |
| Demons | `demons` | `demon` | ✓ |
| Devils | `devils` | `devil` | ✓ |
| Draconians | `draconians` | `draconian` | ✓ |
| Dragons | `dragons` | `dragon` | ✓ |
| Dwarves | `dwarves` | `dwarf` | ✓ |
| Elementals | `elementals` | `elemental` | ✓ |
| Elves, High | `elves-high` | `elf-high` | ✓ |
| Elves, Shadow | `elves-shadow` | `elf-shadow` | ✓ |
| Elves, Wode | `elves-wode` | `elf-wode` | ✓ |
| Giants | `giants` | `giant` | ✓ |
| Gnolls | `gnolls` | `gnoll` | ✓ |
| Goblins | `goblins` | `goblin` | ✓ |
| Griffons | `griffons` | `griffon` | ✓ |
| Hobgoblins | `hobgoblins` | `hobgoblin` | ✓ |
| Humans | `humans` | `human` | ✓ |
| Kobolds | `kobolds` | `kobold` | ✓ |
| Lightbenders | `lightbenders` | `lightbender` | ✓ |
| Minotaurs | `minotaurs` | `minotaur` | ✓ |
| Ogres | `ogres` | `ogre` | ✓ |
| Orcs | `orcs` | `orc` | ✓ |
| Radenwights | `radenwights` | `radenwight` | ✓ |
| Rivals | `rivals` | `rival` | ✓ (+ code literal) |
| Time Raiders | `time-raiders` | `time-raider` | ✓ |
| Trolls | `trolls` | `troll` | ✓ |
| Voiceless Talkers | `voiceless-talkers` | `voiceless-talker` | ✓ |
| War Dogs | `war-dogs` | `war-dog` | ✓ |
| Wyverns | `wyverns` | `wyvern` | ✓ |
| Ajax the Invincible | `ajax-the-invincible` | — | named, no change |
| Arixx | `arixx` | — | named, no change |
| Ashen Hoarder | `ashen-hoarder` | — | named, no change |
| Bredbeddle | `bredbeddle` | — | named, no change |
| Chimera | `chimera` | — | solo, no change |
| Count Rhodar Von Glauer | `count-rhodar-von-glauer` | — | named, no change |
| Fossil Cryptic | `fossil-cryptic` | — | solo, no change |
| Hag | `hag` | — | solo, no change |
| Kingfissure Worm | `kingfissure-worm` | — | solo, no change |
| Lich | `lich` | — | solo, no change |
| Lizardfolk | `lizardfolk` | — | invariant, no change |
| Lord Syuul | `lord-syuul` | — | named, no change |
| Manticore | `manticore` | — | solo, no change |
| Medusa | `medusa` | — | solo, no change |
| Olothec | `olothec` | — | named, no change |
| Shambling Mound | `shambling-mound` | — | solo, no change |
| Undead | `undead` | — | invariant, no change |
| Valok | `valok` | — | named, no change |
| Werewolf | `werewolf` | — | solo, no change |
| Xorannox the Tyract | `xorannox-the-tyract` | — | named, no change |

The `elves-* → elf-*` singularizations read a little awkwardly but follow the rule
consistently; accepted rather than carving an exception.

## Migration

`frozen: false`, so this is a clean re-mint with no freeze-rule conflict and **no
aliases**:

1. Add `@category` annotations to the 31 plural group headings.
2. Change the two `"rivals"` literals → `"rival"` in `StatblockParser`.
3. Reset the monster portion of the registry baseline and run `gen --all` twice (the
   established baseline-reset convention) so `classification.json`, `scc-to-path.json`,
   and the in-prose link references all regenerate against the new slugs.
4. `just deploy`.

**Link blast radius is low:** cross-book links *into* monster pages from other books are
still mostly unwritten (tracked in `FOLLOWUPS.md`); internal monster links regenerate
from source during the sweep. The live site's old plural URLs stop resolving — accepted
pre-freeze.

## Documentation updates (part of "done")

- Append a dated entry to `docs/scc-log.md`.
- Update `docs/scc-reference.md` (the monster-family section) to state the category is a
  singular slug.
- Append a §7.2 clarification to `reference/scc-specification.md`: the monster category
  is explicitly a singular type segment; the plural group name survives only as the
  display title.
- Refresh the registry count in `docs/scc-reference.md` / `CLAUDE.md` if it shifts.

## Verification

- `validate --scc-stable` is side-effect-free and passes against the re-minted registry.
- No `monster.<plural>.statblock` or `monster.group/<plural>` codes remain in
  `classification.json` for the 31 changed groups.
- Spot-check rebuilt pages: a family statblock (`monster.goblin.statblock/worg`), a
  group landing (`monster.group/goblin` titled "Goblins"), an echelon group
  (`monster.war-dog.1st-echelon.statblock/...`), and the rival-summoner path
  (`monster.rival.<echelon>...`).
</content>
</invoke>
