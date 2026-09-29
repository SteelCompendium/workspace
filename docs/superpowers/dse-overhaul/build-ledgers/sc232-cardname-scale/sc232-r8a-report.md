# SC-232 round 8a — rebase + print-neutral card-head slot fixes (W1, W8, W5, fixtures)

## Executive summary

- Head: dse `6828e11` (branch `sc232-cardname-scale`); superproject `d66c6fe`. Base: `origin/develop` `5a20d5f`.
- Step 0 (rebase): DONE, 0 conflicts. Dropped SC-232's now-redundant `.dse-head` container decl (SC-284 supplies it); kept the Steel-only narrow name-size fallback. `wrap.mjs` byte-identical vs base.
- Step 1 (W1, left-deck provenance): DONE. Fills Scott's reported gap (Determination's "Human"). Metadata-driven, 0 frozen lines moved.
- Step 2 (W8, "Feature" noun): DONE. `kindNounOf` now reads `metadata.type`, fixing the SDK's silent `feature_type: feature` → "Trait" collapse.
- Step 3 (W5, featureblock kind): DONE. Left-eyebrow now reads `kind` independently of `featureblock_type`/role.
- 2 post-rebase test fallouts fixed (real consequences, detailed below): a `cardHead.test.ts` regex race between two now-coexisting `@container dse-head` blocks; a compendium-snapshot correctness gap (`metadata` no longer fully render-inert).
- New capture ids (widening, no sanction): `feature-trait-provenance--*`, `feature-ability-provenance--*` (8 PNGs).
- Gates: tsc/lint clean; jest **4147/1/4148, 212/213 suites** (base 4118/1/4119, 211/212); lifecycle **19/19**; shots **540, 0 FAIL** (base 532); freeze **260/260**; parity **0/0/26 declared**, exit 0.
- Evidence: `r8-evidence/sc232-slots-neutral.png`, every tile's text DOM-verified (not eyeballed) — table in the Evidence section.

## Step 0 — rebase

`git -C draw-steel-elements fetch origin` then `git rebase origin/develop`. `origin/develop`
was exactly `5a20d5f`, as the ledger's last dispatcher note said. **The rebase produced zero
CONFLICT markers** — git's 3-way merge resolved every hunk automatically, including
`styles-source.css`'s SC-232 rule group and `selector-map.json`/README.

Despite the clean auto-merge, one thing needed manual attention per the brief: SC-284 landed
its own `.dse-head { container-type: inline-size; container-name: dse-head; }` **unscoped**
on the base `.dse-head` block (`styles-source.css` ~13976). SC-232's rebased branch still
carried its own Steel-screen-only duplicate of the exact same declaration
(`[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-head { container-type: ...;
container-name: dse-head; }`, ~7405). Since SC-284's version is unconditional, it already
supplies the container behavior for every theme; SC-232's copy was a pure no-op. **Dropped
the duplicate**, rewrote the surrounding comment to point at SC-284's block instead of
re-deriving the containment analysis, and **kept** SC-232's own
`@container dse-head (max-width: 480px) { ... revert to today's name size ... }` fallback —
a different rule with different content (name-size revert vs. right-rail restacking), not a
duplicate of SC-284's own `@container` block.

**Verification:** `npm run tsc` clean. Ran the reviewer's `wrap.mjs` (per-character `Range`
reconstruction, `r3-evidence/scripts/wrap.mjs`, copied read-only) over all 18 current
`NARROW_SHOTS` capture ids, base (`origin/develop` `5a20d5f`, detached scratch worktree) vs.
this head — **`diff` empty, byte-for-byte identical**, confirming the narrow fallback still
holds against SC-284's own narrow-stacking layout. Logs: `/tmp/sc232-wrap-base.log` /
`/tmp/sc232-wrap-head.log` (session-scratch, not preserved — the empty-diff result is the
record; re-run is one `git worktree add --detach` + two `wrap.mjs` invocations away if needed).

Commit: `7d6b110`.

## Step 1 — W1 left-deck provenance

`leftDeckOf` (new, `renderFeature.ts`) ports steel-etl's `abilityOrigin`
(`ability_cards.go:135-145`) and `traitSource`/`traitOrigin` (`trait_cards.go:563-591`),
reading only `feature.metadata` (the by-SCC sync's own field, on the model since day one but
never read by any head composer before this ticket — SC-165's own "Dead slot" note):

- **Ability**: `metadata.class`, falling back to `metadata.kit` for a kit's own by-SCC
  signature ability (survey b8 — "Devastating Rush" carries `metadata.kit: panther`, no
  `class`), then `· <subclass>` if present.
- **Trait / plain feature**: `metadata.class` / `ancestry` / `kit` in that priority order
  (matching the Go source's loop order exactly), + a `feature_source` qualifier
  ("summoner" excluded), then `· <subclass>` if present.
- `titleCaseSlug` ports steel-etl's `titleCase` (`build.go:1681`): capitalizes each
  space/hyphen-separated word.

Wired into the existing `cardHead()` call as `leftDeck`. CSS: `.dse-head__deck--left` on
feature heads is Legacy-hidden (new chrome, same contract as the existing SC-10 Task 2
left-eyebrow hide rule) and revealed + styled Steel screen-only, matching the site's
computed `.sc-head__left-deck.sc-head__slot--line` (small-caps, **no** text-transform so
"Human" keeps its capital — unlike the eyebrow, which lowercases — 0.05em letter-spacing,
1.1 line-height; font-size/color already come from the existing unscoped `.dse-head__deck`
base rule).

**Metadata-driven only, as instructed** — does NOT pass the parent kit's name into the
inline kit-signature path (`layouts.ts:343-352`); that's round 8b (print-moving). 0 frozen
print lines move: no frozen fixture carries `metadata`, confirmed by the freeze gate staying
260/260.

**Fixtures (a1, a2):** `feature/trait-provenance` ("Determination", human — Scott's own
example) and `feature/ability-provenance` ("Mark", tactician L1), added to
`visual-harness/entry.ts`. `metadata` is copied verbatim from the real synced entities in
`r7-survey/md-dse/`. **New capture ids** (freeze widening, no sanction needed):
`feature-trait-provenance--steel-{dark,light,print,realprint}.png`,
`feature-ability-provenance--steel-{dark,light,print,realprint}.png` (8 lines).

**Tests:** 18 new unit cases (`test/unit/elements/renderFeature.test.ts`, new file) — one
per branch: no metadata, trait class/ancestry/kit priority, `feature_source` qualifier incl.
the "summoner" exclusion, subclass suffix (both families), ability class vs. kit fallback,
class-wins-over-kit, multi-hyphen `titleCase`. Plus 4 new DOM cases in
`test/dom/elements/feature.test.ts`: Determination → "Human", Mark → "Tactician", a
kit-signature shape (no `class`) → "Panther" via the `kit` fallback, no-metadata → the
left-deck slot is a GAP (no element at all, matching cardHead's own "omitted slot" contract).

Commit: `9429630`.

## Step 2 — W8 "Feature" noun

`kindNounOf` mapped every non-ability to "Trait" — including a plain class feature
(`feature_type: feature`, e.g. the real "Growing Ferocity"). Root cause: the SDK's `Feature`
model TYPE only knows Ability/Trait/Subtrait; `Feature.fromDTO` silently collapses any other
raw value through the `isTrait()` heuristic (no keywords/usage/distance/target) before
`kindNounOf` ever sees it — confirmed by tracing the SDK's actual JS (`Feature.fromDTO`,
`FeatureDTO.partialFromModel`), not assumed from the `.d.ts`.

`kindNounOf` now reads `feature.metadata.type` first (verbatim copy of the fence's
frontmatter `type:`, which survives the model's own collapse) and only falls back to the old
`isTrait()` binary when metadata is absent — so every frozen fixture (none of which carries
metadata) renders exactly as before. 0 frozen print lines move (the left-eyebrow is
print-hidden regardless).

**Tests:** 5 new unit cases (`metadata.type` ability/trait/feature, no-metadata fallback for
both Ability and Trait) + 1 new DOM case (Growing Ferocity → "Feature" eyebrow + "Fury"
left-deck, both W1 and W8 exercised together).

Commit: `4855897`.

## Step 3 — W5 featureblock kind-noun

`featureblock/view.ts`'s cardHead left-eyebrow read only `featureblock_type` — but a by-SCC
synced featureblock fence carries no `featureblock_type` at all; it carries `kind`
(`dynamic-terrain`/`fixture`/`malice`/`advancement`), an untyped top-level field the SDK
reader preserves (same undeclared-field-survives-`Object.assign` pattern the file's own
`featureLevelOf` already relies on) but the head never read (survey: "renders –"). On the
site, the kind-noun (`fbKindNoun`) and the role/category mini-title (`featureblock_type`
equivalent) are two INDEPENDENT fields — never a fallback pair the way the plugin's
single-field `role ? undefined : typeText` logic treated them.

`kind`, when present, now **always** wins the left-eyebrow via the ported `fbKindNoun`
vocabulary (falling back to the site's own "Featureblock" default for an unrecognized
`kind`) — independent of the existing role/`featureblock_type` right-primary logic, which is
untouched. Falling back to today's `role ? undefined : typeText` when `kind` is absent keeps
every frozen fixture (none of which carries `kind`) byte-unchanged.

**Summoner origin in the left-deck** (the other half of survey b12): left undone. It needs
the site's SCC-prefix parsing (`summonerProvenanceEyebrow`), not a trivial field read —
follow-up, not this round's "trivially data-driven" bar.

**Tests:** 4 new DOM cases in `test/dom/elements/featureblock.test.ts` — `kind` wins the
eyebrow even with no `featureblock_type`; `kind` + a role-carrying `featureblock_type` fill
independently (eyebrow AND right-primary both populated); an unrecognized `kind` falls back
to "Featureblock"; no `kind` leaves today's behavior byte-unchanged.

Commit: `fdd028b`.

## Post-rebase fallout (two follow-on commits)

Running the FULL jest suite after W1/W8/W5 (not just the touched files) surfaced two real
failures — both direct, unavoidable consequences of the work above, fixed as part of it
rather than filed away:

**1. `test/dom/kit/cardHead.test.ts` (2 failures) — a rebase artifact, not a product bug.**
The clean rebase legitimately leaves TWO `@container dse-head (max-width: 480px) { ... }`
blocks in `styles-source.css`: SC-284's own (right-rail restacking) and SC-232's (the
name-size fallback, kept per Step 0). Both are valid CSS and both fire correctly — a
same-condition `@container` block is not a duplicate to merge, it's independent content. But
SC-232's rule group now sits *earlier* in the file than SC-284's own `.dse-head` block, and
this test's regex grabbed the FIRST `@container dse-head` match in the whole sheet
unconditionally — which, post-rebase, is SC-232's block, carrying no `.dse-head__eyebrow--right`
rule at all. Fixed by scoping the test to the block that actually carries the right-rail
re-placement rule (`sc284NarrowBlock()`, identified by its unique
`.dse-head__eyebrow--right` selector) — confirmed this collision is a Step-0 (rebase)
artifact, not a W1/W8/W5 side effect, by checking out the Step-0-only commit (`7d6b110`,
before any W1/W8/W5 code existed) and confirming the same two-block collision
(`grep -c` on `@container dse-head` = 2) was already present there. Commit: `ca34ab6`.

**2. `test/dom/authoring/compendiumSearchModal.test.ts` (2 failures) — a real correctness
consequence of W1, caught by SC-165's own pre-existing test suite.** SC-165's compendium
"full block" snapshot trims `metadata` wholesale from a pasted feature block on the
documented claim that nothing on the render path reads it. W1 makes that claim false for six
keys (`ancestry`/`class`/`kit`/`subclass`/`feature_source`/`type`). Left unfixed, a user
pasting a "full block" snapshot of a trait or ability would get a card silently missing its
left-deck (and possibly the wrong kind-noun) relative to the live synced original it was
copied from — the exact silent-gap failure mode SC-165 exists to prevent, just pointed the
other way (an omitted field now changing the render, not an edited one failing to).
`trimSnapshotDTO` (`compendiumInsert.ts`) now narrows `metadata` to those six keys for a
feature DTO instead of dropping it outright; statblock/featureblock snapshots are unaffected
(neither element ever reads `.metadata`) and keep the full drop. Updated the one test whose
premise changed (`the snapshot carries no metadata: block` → family-aware: narrowed for
feature, none for statblock/featureblock); the other two SC-165 invariants (metadata
round-trip is render-inert; the snapshot renders identically to its synced source) **pass
unmodified** — the six kept keys are exactly what the render path reads either way, so
restoring the full metadata or comparing against the untrimmed source changes nothing.
Commit: `6828e11`.

Both were verified NOT to be pre-existing: `origin/develop` alone has no `metadata`-driven
render path and no second `@container dse-head` block, so neither failure mode can occur
there; both are strictly new, both are strictly caused by this round's own changes (the
rebase's block collision; W1's metadata read), and both are now fixed.

## Gates (full battery, dse-verify order)

BASE measured on a detached scratch checkout of `origin/develop` `5a20d5f`
(`/home/scott/code/steelCompendium/worktrees/sc232-base-scratch/draw-steel-elements`,
removed after use — a worktrees-dir location, not `/tmp`, to avoid the
`token-coverage.test.ts` location-sensitivity footgun the dse-verify skill documents).

| Gate | Base (`5a20d5f`) | Head (`6828e11`) |
|---|---|---|
| `npm run tsc` | clean | clean |
| `npm run lint` | clean, exit 0 | clean, exit 0 |
| `npx jest` (`rm -f main.js styles.css` first) | 4118 passed / 1 skipped / 4119 total / 211 of 212 suites / 3 snapshots | **4147 passed / 1 skipped / 4148 total / 212 of 213 suites / 3 snapshots** (net +29 tests, +1 suite — the new `test/unit/elements/renderFeature.test.ts` file) |
| `npm run obsidian-lifecycle` (own `DSE_LIFECYCLE_PORT=9291`) | not re-measured (unaffected — no framework/host changes) | **`OBSIDIAN-LIFECYCLE done: 19/19 ok, 0 failed`, exit 0** |
| `npm run shots` | 532, 0 FAIL | **540, 0 FAIL** (delta +8 = the two new fixtures × 4 combos each) |
| `check-freeze.sh` | — | **`freeze OK (260/260 frozen print PNGs byte-identical)`, exit 0** — this round is print-neutral by design; a FAILED line would have meant a leak, and there were none |
| `npm run parity` | — | **`0 gap(s), 0 undeclared warning(s), 26 declared deferral(s)`, exit 0** (16 pre-existing + the 10 `name-*:ink` rows SC-232's own rebased branch already carried — unchanged in composition by this round's work) |

`/proc/loadavg` checked before the full jest run (6.6, low) — no timeout-shaped reds to
second-guess.

## Evidence

`.../sc232-cardname-scale/r8-evidence/sc232-slots-neutral.png` — rows: Determination
(trait), Mark (ability), Growing Ferocity (class feature), Devil Malice (featureblock);
columns: **Before (develop)** | **This branch** | **Site**. Every tile captured at
`deviceScaleFactor: 1` (1 image px = 1 CSS px), cropped to the card head only (`.dse-head`
for the plugin, `.sc-head` for the site) with a 12px pad, pasted at native size — never
rescaled. Text labels on every row and column; no color-coding (the card content's own
in-app colors are unchanged, unannotated). "Before" captures used the exact same fixture
YAML on a detached `origin/develop` scratch worktree with the SAME evidence-only fixtures
temporarily added (never committed there or here — reverted via `git checkout` before the
final gate run above).

**Every tile's text verified by DOM query** (`.../r8-evidence/dom-verified-text.json`), not
eyeballed:

| Entity | Slot | Before (develop) | This branch | Site |
|---|---|---|---|---|
| Determination | left-eyebrow | Trait | Trait | Trait |
| | name | Determination | Determination | Determination |
| | **left-deck** | **(none)** | **Human** | **Human** |
| | right-primary/eyebrow (cost) | 2 Points | 2 Points | 2 Points |
| Mark | left-eyebrow | Ability | Ability | Ability |
| | name | Mark | Mark | Mark |
| | **left-deck** | **(none)** | **Tactician** | **Tactician** |
| | right-eyebrow (level) | (none) | (none — W2, deferred) | Level 1 |
| | right-deck (usage) | (none) | (none — W7, deferred) | Maneuver |
| Growing Ferocity | **left-eyebrow** | **Trait (wrong)** | **Feature** | **Feature** |
| | name | Growing Ferocity | Growing Ferocity | Growing Ferocity |
| | **left-deck** | **(none)** | **Fury** | **Fury** |
| | right-eyebrow (level) | (none) | (none — W2, deferred) | Level 1 |
| Devil Malice | **left-eyebrow** | **(none)** | **Malice** | **Malice** |
| | name | Devil Malice | Devil Malice | Devil Malice |
| | left-deck (summoner origin) | (none) | (none — not attempted this round) | (none — no summoner origin on this entity) |

Every "This branch" cell now matches the Site cell for every slot this round's items (W1,
W8, W5) claim — Mark's missing right-eyebrow/right-deck and both entities' missing "Level 1"
are the explicitly-deferred W2/W7 items, not a miss.

## Drive-by fixes

None beyond the two post-rebase fallout fixes documented above in their own section (both
are direct, necessary consequences of this round's own changes, not independent pre-existing
bugs — so they're reported there, under their own header, rather than as drive-bys).

## Follow-ups

- **Summoner origin in the featureblock left-deck** (survey b12's other half): needs the
  site's SCC-prefix parsing (`summonerProvenanceEyebrow`), not a trivial field read. Not
  attempted this round per the brief's "only if trivially data-driven" bar.
- **W2/W7/W3/W4** (level chip, usage chip, right-rail remap, statblock kind-noun/keywords):
  per the round-7 owner ruling, these are round 8b's print-moving items, each needing its own
  `rebaseline.txt` + Scott's sanction — explicitly out of scope here.
- **W1's inline kit-signature parent-kit name** (the print-moving half of b8, `layouts.ts`
  passing the parent kit's name into the INLINE signature-ability path): also round 8b, per
  the round-7 owner ruling.
- The `wrap.mjs`/base-scratch logs from Step 0's verification are session-scratch
  (`/tmp/sc232-wrap-*.log`), not preserved in the ledger dir — the empty-diff result is
  recorded above; re-running is cheap if the dispatcher wants the raw logs on file.

## Rules compliance

- Never touched dse `main`, never tagged, never pushed. No `just deploy*`. No edits to
  `freeze-baseline.sha256` or the shared `.superpowers/` dir (only read from it — the
  `check-freeze.sh` script and the `r7-survey`/prior-round artifacts).
- Every process killed or waited-out was scoped to PIDs whose command line contained
  `worktrees/sc232-cardname-scale/` (the two long gates, `obsidian-lifecycle` and `shots`,
  were run to completion rather than killed — both finished cleanly). Every detached scratch
  worktree (`sc232-base-scratch`, `sc232-base-evidence`, plus two early ones for Step 0's
  `wrap.mjs` check) was `git worktree remove --force`'d immediately after use — none remain
  registered (`git worktree list` shows only the real worktree); the two Step-0 ones were
  briefly under `/tmp` before this session switched to a worktrees-dir scratch location for
  every later one (the `token-coverage.test.ts` location-sensitivity footgun the dse-verify
  skill documents) — never touching the shared main checkout either way.
- Commits: one per coherent step (7 total this round), each with its own tests where the
  step added a testable behavior.

## Artifacts

- Report (this file):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/sc232-r8a-report.md`
- Evidence composite:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r8-evidence/sc232-slots-neutral.png`
- Evidence DOM-verified text:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r8-evidence/dom-verified-text.json`
- dse commits (branch `sc232-cardname-scale`, worktree
  `/home/scott/code/steelCompendium/worktrees/sc232-cardname-scale/draw-steel-elements`):
  `7d6b110` (Step 0 rebase), `9429630` (W1), `4855897` (W8), `fdd028b` (W5), `ca34ab6`
  (cardHead.test.ts fallout fix), `6828e11` (compendiumInsert.ts fallout fix — **final dse
  head**).
- Worktree superproject commits
  (`/home/scott/code/steelCompendium/worktrees/sc232-cardname-scale`): `43ecfdf` (CHANGELOG +
  pointer bump to `fdd028b`), `d66c6fe` (pointer bump to `6828e11` — **final superproject
  head**).
- New/changed source files: `draw-steel-elements/src/elements/feature/renderFeature.ts`,
  `draw-steel-elements/src/elements/featureblock/view.ts`,
  `draw-steel-elements/src/authoring/compendiumInsert.ts`,
  `draw-steel-elements/styles-source.css`, `draw-steel-elements/visual-harness/entry.ts`.
- New/changed test files:
  `draw-steel-elements/test/unit/elements/renderFeature.test.ts` (new),
  `draw-steel-elements/test/dom/elements/feature.test.ts`,
  `draw-steel-elements/test/dom/elements/featureblock.test.ts`,
  `draw-steel-elements/test/dom/authoring/compendiumSearchModal.test.ts`,
  `draw-steel-elements/test/dom/kit/cardHead.test.ts`.
- CHANGELOG: `sc232-cardname-scale/CHANGELOG.md` (worktree superproject).
