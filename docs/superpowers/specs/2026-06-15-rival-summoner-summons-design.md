# Rival Summoner ⇄ summons cross-references (v2 Browse)

**Date:** 2026-06-15
**Status:** Design approved, pending implementation plan
**Scope:** v2 site rendering only (`steel-etl/internal/site/`), summoner Rival Summoner statblocks. No SCC/registry/schema change.

## Problem

The summoner book's **Rival Summoner** is an NPC statblock that conjures a set of
minion statblocks. After the 2026-06-15 `monster.*` restructure they sit together in
the Browse tree:

- Rival Summoner page: `monster/rivals/<echelon>/rival-summoner` (statblock, `.sb-wrap`)
- Its summons: `monster/rivals/<echelon>/summoner/minion/<id>` (statblocks) + an
  auto-generated `…/summoner/minion/index.md`

But the two never reference each other on-page: the Rival Summoner page shows only its
own statblock (its features mention "skeletons" in prose, with no link to the actual
statblocks), and each summon page sits in a deep nested folder with no on-page pointer
to the Rival Summoner that calls it. A reader on either page can't navigate to the
other.

The Rival Summoner shares its echelon folder with the **Monsters-book rivals**
(`rival-fury`, `rival-conduit`, … — from `mcdm.monsters.v1`), which have **no** summons;
those must be left untouched.

This effort is **rivals-only**. The analogous "link class-owned statblocks/featureblocks
(beastheart companions, summoner fixtures) back to their owning class" is a separate
effort — workspace FOLLOWUPS #15.

## Goals

1. **Forward:** On each Rival Summoner page, append a `## Summons` section after the
   statblock, listing its summons as the same rich `.sc-cards` statblock previews used
   on Monsters group landings.
2. **Back:** On each summon page, add a single back-link to the Rival Summoner that
   conjures it (its echelon's `rival-summoner` page).
3. Monsters-book rivals (`rival-fury`, etc.) get neither — they have no summons.

## Approach

**Derive both directions from the directory tree, in the site builder.** The
relationship is already encoded by co-location: a Rival Summoner at
`monster/rivals/<echelon>/rival-summoner` owns exactly the statblocks under its sibling
`monster/rivals/<echelon>/summoner/minion/`. No data-model, source-annotation, SCC, or
schema change is needed — this mirrors how `buildMonsterGroupContent` and
`buildAdvancementPairContent` already compute relationships from the tree.

(Rejected alternatives: explicit `summons:`/`summoned_by:` frontmatter — needs source
annotation + parser + dual-schema work for a relationship the tree already expresses;
hand-written prose links — brittle, manual, no cards.)

### Timing: a post-write augmentation pass

The forward block reuses `statblockCards(dir, relPrefix, files)`
(`internal/site/bestiary_cards.go`), which reads statblock leaf files from the dest
tree. Those summon files must therefore already be written. The per-file page-writing
loop in `buildSection` (`internal/site/build.go`, the loop that calls
`buildStatblockIslandPage` then `os.WriteFile`) processes entries in walk order, so a
Rival Summoner page may be written **before** its summons exist on disk. The augmentation
must run **after** the section's pages are written.

Add a dedicated step — `augmentRivalSummonerPages(browseDir string)` — invoked once per
Browse section after the page-writing loop completes (alongside / after the existing
index-generation pass, which is likewise post-write). It re-reads, augments, and
rewrites the affected page files.

### Forward — `## Summons` block on the Rival Summoner page

For each dir matching `monster/rivals/<echelon>/` that contains a `summoner/minion/`
subdir:

1. Identify the Rival Summoner page in that dir: the statblock `.md` file (not
   `index.md`) whose frontmatter `scc` is under `mcdm.summoner.v1` **and** whose
   `organization` is not `Minion` — i.e. the conjurer, not a co-located Monsters-book
   rival. (In current data this is exactly `rival-summoner.md`; keying off
   source+organization rather than the literal id avoids hard-coding the filename and
   correctly ignores the `mcdm.monsters.v1` rivals.)
2. Render the summons cards: `statblockCards(<echelon-dir>, "summoner/minion", <summon files>)`
   so hrefs resolve from the Rival Summoner page down into `summoner/minion/<id>/`.
   (The exact `relPrefix`/href base is an implementation detail; the cards must link to
   the hoisted summon page URLs.)
3. Append `\n\n## Summons\n\n` + the cards HTML to the page body (after the `.sb-wrap`),
   and rewrite the file.

If a `monster/rivals/<echelon>/` dir has no `summoner/minion/` subdir, nothing is
appended (covers any echelon without a summoner, and is moot for the Monsters book whose
rivals live in their own echelon dirs without that subdir).

### Back — back-link on each summon page

For each statblock page under `monster/rivals/<echelon>/summoner/minion/`:

- Insert a single back-link element pointing at the echelon's Rival Summoner, placed
  between the page's `# <Name>` / `---` head and the `.sb-wrap` card:
  `<p class="sb-backlink">Summoned by <a href="<rel>/">Rival Summoner</a></p>`
- `<rel>` is **computed**, not hard-coded — the summon page sits two folders below its
  echelon (`<echelon>/summoner/minion/<id>/`) and MkDocs uses directory URLs (verified:
  the Rival Summoner page's own links resolve four `../` to root), so from a summon's
  URL the echelon is three levels up: `../../../rival-summoner/`. Derive it the same way
  the builder computes other relative cross-links rather than embedding the literal.
- The target is deterministic from the summon's own location (no sibling read), but it is
  added in the same augmentation pass for cohesion. Guard: only add it when the echelon's
  `rival-summoner` page actually exists.

A small `.sb-backlink` style rule is added to v2 CSS (lightweight; reuse existing
in-statblock link/term styling tokens). The `index.md` under `summoner/minion/` is left
as-is.

## Components & boundaries

| Unit | Responsibility |
|---|---|
| `augmentRivalSummonerPages(browseDir)` (new, `internal/site/`) | Orchestrates both directions over the `monster/rivals/` subtree; pure file-tree in/out. |
| `statblockCards` (existing, reused) | Renders the `.sc-cards` summon previews. |
| `buildSection` (existing, `build.go`) | Calls the new augmentation step once after its page-writing pass. |
| v2 `.sb-backlink` CSS (new, small) | Styles the summon→summoner back-link. |

## Testing

Site-builder unit tests (pattern: existing `bestiary_cards`/`build` tests, building a
small fixture Browse tree):

- A Rival Summoner page (summoner-book scc, `organization != Minion`) with a sibling
  `summoner/minion/` dir gains a `## Summons` section containing one `.sc-card` per
  summon, each linking to the summon's page.
- A co-located Monsters-book rival page (`rival-fury`, `mcdm.monsters.v1`) gains **no**
  `## Summons` section.
- Each summon page gains exactly **one** `sb-backlink` to `../../rival-summoner/`.
- A summon page with no `rival-summoner` sibling (defensive) gains no back-link.
- Idempotence: running the pass twice does not double-append (guard on a marker, e.g.
  skip if `## Summons` / `sb-backlink` already present).

## Verification

- `go test ./internal/site/...` passes.
- After `steel-etl site`: `monster/rivals/<echelon>/rival-summoner.md` contains
  `## Summons` + a `.sc-cards` block whose hrefs point into `summoner/minion/`; each
  `summoner/minion/<id>.md` contains one `sb-backlink`; `rival-fury.md` (and the other
  Monsters-book rivals) contain neither.
- Spot-check the rendered pages in the deployed/site-built Browse.

## Docs to update on completion

- `steel-etl/docs/site-builder.md`: document the `augmentRivalSummonerPages` pass
  (what it matches, both directions, timing-after-page-write rationale).
- `steel-etl/docs/statblocks.md`: cross-reference note (Rival Summoner ⇄ summons).
- No `docs/scc-log.md` entry (no scheme/registry/linking change).
