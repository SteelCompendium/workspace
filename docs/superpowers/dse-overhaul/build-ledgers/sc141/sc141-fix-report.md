# SC-141 — "Abilities not rendering in the ds-hero element" — fix report

**Worktree:** `/home/scott/code/steelCompendium/worktrees/sc141-hero-abilities`
**Branch:** `sc141-hero-abilities` (dse base `e141582`)
**Commits:** `cbc5f9d`, `22188aa`, `a3ad2a7` (review fix round — §7)
**Date:** 2026-08-10 / fix round 2026-08-11

---

## 1. The established failure mode(s)

Reproduced in jsdom through the REAL `ElementPipeline` + a REAL `CompendiumIndex` over the
real synced md-dse bytes, using Scott's exact YAML (both ability entries verbatim).

### Before the fix — verbatim repro output

```
ROOT ELEMENT ATTR: hero
ROWS: 2
ROW 0 name= scc.v1:mcdm.heroes.v1/feature.ability.shadow.level-1/coat-the-blade
      | issue= "Coat the Blade" found but is not an ability entry.
ROW 1 name= scc.v1:mcdm.heroes.v1/.../into-the-fray
      | issue= "mcdm.heroes.v1/.../into-the-fray" not found in compendium — sync compendium?
```

**Hypothesis (a) — a real resolution bug — CONFIRMED, and it is the whole story of Scott's
screenshot.** The valid full code resolved to the right file and then failed to produce a
model. Note the wording: *"Coat the Blade" found but…* — the plugin **had already read the
file's display name**, so it found the file; it just could not read its contents.

**Hypothesis (b) — one invalid entry poisoning the whole section — NOT what Scott saw.** Both
entries degraded independently; the section, the tabs, and the rest of the sheet all rendered.
The `.../into-the-fray` placeholder line was *not* part of his problem. **However, a latent
isolation hole was found and closed anyway** (§3.2): `resolveSlug` sat outside
`resolveAbility`'s try/catch, so a throw from the index would have escaped the per-entry
contract, rejected `onMount`'s `Promise.all`, and made the pipeline replace the **entire hero
sheet** with one error card. That path is only reachable for a **bare-slug** entry
(`- Coat the Blade`), which is why Scott's all-full-code input never hit it.

### Scope: far wider than `ds-hero`

The same root cause broke the by-SCC `ds-feature` path (`RefUnwrapView.ts:132-142` →
*"found but not renderable — … predates the required block; re-sync"*) and mis-routed
`typeToAlias` (`ds-rule` instead of `ds-feature`) for Insert-compendium-reference. **No
ability in any of the four books could be referenced by code, anywhere in the plugin.**

---

## 2. Root cause

**`src/services/typeAdapters.ts:147` (pre-fix):**

```ts
dsBlockAdapter(/^feature($|\.)/, (t) => FeatureConfig.readYaml(t), 'ds-feature'),
```

That regex is matched against the **frontmatter `type:`** of the synced compendium file
(`CompendiumIndex.ts:129` → `adapterForType(entry.type)`, where `entry.type` is
`frontmatter.type`, `CompendiumIndex.ts:98`).

The SCC **code** segment is `feature.ability.shadow.level-1`, but `steel-etl` writes only the
**leaf** of that segment into frontmatter. Verified against the real corpus
(`data/data-unified/en/unified/md-dse/`, 2026-08-10):

| frontmatter `type:` | files | carries a ```` ```ds-feature ```` block? | matched `/^feature($\|\.)/`? |
|---|---|---|---|
| `feature` | 876 | 876 / 876 | yes |
| `ability` | **621** | 621 / 621 | **no** |
| `trait`   | **95**  | 95 / 95   | **no** |

`data-unified/en/unified/md-dse/feature/ability/shadow/level-1/coat-the-blade.md` frontmatter:

```yaml
scc: mcdm.heroes.v1/feature.ability.shadow.level-1/coat-the-blade
item_name: Coat the Blade
type: ability          # <-- NOT `feature`
```

So for all 716 `ability`/`trait` files:

1. `adapterForType('ability')` → `undefined`
2. `CompendiumIndex.getEntity(code).model()` → returns `undefined` (`CompendiumIndex.ts:130`)
3. `HeroSheetView.resolveAbility` → `!(parsed instanceof FeatureConfig)` →
   `"Coat the Blade" found but is not an ability entry.` (`src/elements/hero/view.ts:679`, pre-fix)

The SCC code itself was **completely correct** — verified present in the corpus at
`yaml/feature/ability/shadow/level-1/coat-the-blade.yaml` with
`scc: mcdm.heroes.v1/feature.ability.shadow.level-1/coat-the-blade`.

### Why the suite never caught it

`test/fixtures/md-dse/` had exactly one feature fixture,
`feature/fury/level-1/growing-ferocity.md` — a `type: feature` file. Every by-SCC feature
test in the repo pointed at it. The 716-file majority of the family had zero fixture coverage.

### Contributing cause: three copies of one regex

`/^feature($|\.)/` was written out independently in three places —
`typeAdapters.ts:147`, `src/elements/feature/definition.ts:40`, `src/elements/hero/view.ts:72`
— each with a comment claiming it "matches TYPE_ADAPTERS". That is exactly how the scope could
be wrong in three places at once with nothing to compare against.

### Secondary findings

- **`src/elements/hero/view.ts:666` (pre-fix)** — `compendium.resolveSlug(...)` outside the
  try/catch; see §1 hypothesis (b).
- **`src/elements/hero/view.ts:675` (pre-fix)** — `"<code>" not found in compendium — sync
  compendium?` blames the sync unconditionally, including when the compendium is fine and the
  code is a typo or an un-filled placeholder.

---

## 3. The fix

### 3.1 `src/services/typeAdapters.ts` — one exported, widened scope

```ts
export const FEATURE_TYPE_RE = /^(feature|ability|trait)($|\.)/;
...
dsBlockAdapter(FEATURE_TYPE_RE, (t) => FeatureConfig.readYaml(t), 'ds-feature'),
```

Exported alongside `STATBLOCK_TYPE_RE` and consumed by both former copy sites
(`src/elements/feature/definition.ts`, `src/elements/hero/view.ts`), so there is now one
regex. Adapter ordering is unchanged — `statblock` and `featureblock` still precede
`ds-feature`, and neither `featureblock` nor `*.statblock` matches the widened anchor.

Downstream, all in the right direction: `getEntity().model()` now returns a `FeatureConfig`
for ability/trait files; by-SCC `ds-feature` renders them; `typeToAlias('ability')` routes
Insert-reference to `ds-feature` instead of the generic `ds-rule` card.

### 3.2 `src/elements/hero/view.ts` — real per-entry isolation

- The whole resolve ladder (including `resolveSlug`) is inside one `try`.
- `onMount` uses `Promise.allSettled` and converts a rejection into that entry's own issue
  row — mirroring the belt-and-suspenders `resolve.ts:160` already applies to
  class/ancestry/kits. One bad ability can no longer reach the pipeline's error card.

### 3.3 `src/elements/hero/view.ts` — honest error text

| case | before | after |
|---|---|---|
| code not found | `"<code>" not found in compendium — sync compendium?` | `Not found in the compendium: "<code>" — the compendium may not be synced (run "Sync compendium"), or the code may be wrong.` |
| resolves but unreadable | `"<name>" found but is not an ability entry.` | `"<name>" (<code>) resolved to <path>, but that file has no ability content the plugin can render (type: <type>) — re-sync the compendium.` |

### 3.4 Regression coverage (+14 tests, +1 suite)

New fixture `test/fixtures/md-dse/feature/ability/shadow/level-1/coat-the-blade.md` — copied
**verbatim** from data-unified md-dse (the exact bytes a real sync installs).

`test/dom/elements/heroAbilitiesScc.test.ts` (new, 9 tests):
valid full code resolves and renders · row expands into the real Feature card · resolved row
is tab-classifiable · **Scott's exact mixed input** → one good row + one inline error row,
section and sheet intact · a throwing index costs one row · unsynced compendium degrades per
entry · a genuinely-missing full code names the code and both causes · by-SCC `ds-feature`
renders an ability file · bare-slug (`Coat the Blade`) resolves.

`test/unit/services/compendiumIndex.test.ts` (+2): `getEntity('…/coat-the-blade').model()`
returns a `FeatureConfig` named "Coat the Blade" and reports `type === 'ability'`;
`resolveSlug` under `FEATURE_TYPE_RE` reaches it.

`test/dom/authoring/compendiumSearchModal.test.ts` (+3): `typeToAlias('ability')` and
`typeToAlias('trait')` → `ds-feature`; `featureblock` still wins over the widened scope.

### 3.5 Not changed (deliberately)

- **`data-unified` / `steel-etl` are untouched.** `type: ability` is the emitted contract for
  621 files and correct SCC-wise; the plugin was the side that was wrong.
- **`type: feature-group` / `monster` / `skill` / `project` / `god` / `saint` / …** stay
  unadapted — verified they carry **no** ds-* block (they are index/landing pages).

---

## 4. Verification battery (verbatim, on the committed branch)

| Gate | Command | Result |
|---|---|---|
| Type-check | `npm run tsc` | exit **0**, no output |
| Lint | `npm run lint` | exit **0**, no output |
| Unit tests | `npx jest` | exit **0** |
| Visual shots | `npm run shots` | exit **0** |
| Freeze | `check-freeze.sh …/visual-harness/shots` | exit **0** |
| Parity | `npm run parity` | exit **0** |

```
Test Suites: 1 skipped, 160 passed, 160 of 161 total
Tests:       1 skipped, 2554 passed, 2555 total
Snapshots:   3 passed, 3 total
```

```
314 shots ok, 0 FAIL
```

```
freeze OK (188/188 legacy+print PNGs byte-identical)
```

```
**0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**
```

**Against the stated baselines:** tsc/lint clean ✓ · jest 2540+1skip/159 → **2554+1skip/160**
(+14 tests, +1 suite — exactly the new coverage in §3.4) ✓ · shots **314** unchanged ✓ · freeze
**188/188**, zero mismatches — **the frozen `hero--*` / `hero-sparse--*` / `hero-narrow--*`
fixtures are byte-identical**, as required: they author abilities inline, so the resolution
path this fix touches is not on their render path ✓ · parity **0/0/16** unchanged ✓.

`obsidian-shots` deliberately NOT run (no display; per instruction).

---

## 5. Evidence

Screenshot of Scott's exact input (mixed valid + invalid) rendering after the fix, attached to
SC-141. Produced by rendering the real pipeline + real `CompendiumIndex` over the real md-dse
fixture bytes in jsdom, dumping the produced DOM into a page carrying the harness's own
`vars.css` + `dist/harness.css`, and screenshotting it with `npm run shot-url`. The jest
`MarkdownRenderer` mock (which appends RAW markdown text) was swapped for the same `marked`
render the visual harness's browser shim uses, so the capture shows what a reader sees.
Capture scaffolding was scratch-only and is not committed.

Two capture artifacts to ignore in that image, both from the jsdom mock rather than the fix:
Lucide icons do not render (the Respite and expand-chevron buttons show as empty boxes), and
the harness page is not real Obsidian.

---

## 6. Follow-ups worth filing (from the first pass)

*(M3 below was fixed in the review round — see §7.3. Item 2 stands.)*

1. **The compact ability row shows no action-type chip for real corpus abilities.**
   `renderAbilityRow` reads `feature.ability_type`, but `steel-etl` emits the action type as
   `usage:` (`usage: '[Maneuver](scc.v1:…)'`) with no `ability_type`. Inline-authored
   abilities (every existing fixture) set `ability_type`, so this only shows on real
   compendium content. Cosmetic; a `usage` fallback would fix it. Note the same shape already
   bit the statblock villain-action work (FOLLOWUPS #53 / plan 25) — "the fixture says
   `ability_type`, the corpus says something else" is a recurring class.
2. **Fixture coverage is by-family, not by-frontmatter-type.** The whole bug survived because
   every by-SCC feature test used the one `type: feature` fixture. Worth a rule: when a
   frontmatter `type` value appears in the corpus in three-figure counts, it needs a fixture.

---

# 7. Review fix round (2026-08-11, commit `a3ad2a7`)

Against `.superpowers/sdd/sc141/sc141-review-report.md` — findings M1, M2, M3, L1.
The review's core verdict (root cause, scope, isolation, can-fail proof) is unchanged; this
round closes the four items and, in the course of M2, uncovered a larger pre-existing bug.

## 7.1 M1 — bare-name lookup prefers the full ability over its stub twin

**Confirmed the review's measurement independently** (own census over all 3,078 md-dse files,
`resolveSlug`'s exact key rule — basename ∨ `file_basename` ∨ `item_name`, case-insensitive):
**98** slug keys were unique under the old scope and ambiguous under the widened one.

The twin pattern is steel-etl emitting the same item twice:

| | code | `type` | size | body |
|---|---|---|---|---|
| real | `mcdm.summoner.v1/feature.ability.summoner.level-1/shield` | `ability` | 2,793 B | the actual triggered action |
| stub | `mcdm.summoner.v1/feature.summoner.level-1/shield` | `feature` | 605 B | *"You have the following triggered action."* |

Pre-SC-141 the bare slug silently resolved to the **stub** — so the old behaviour was not
"works", it was "quietly wrong".

**Fix** — `preferFullOverStubTwin` in `src/services/CompendiumIndex.ts`, applied inside
`resolveSlug`. It fires only when the candidate set holds **exactly one** `type: ability`/
`trait` entry and **every** other candidate is a `type: feature` sharing that entry's
**source** *and* **item id**.

The review suggested keying on the `feature.ability.<x>` vs `feature.<x>` code shape. I used
source+item-id instead because the shape rule misses a real subfamily: `feature.ability.common/grab`
vs `feature.common.**maneuvers**/grab` is the same twin (4,645 B vs 537 B) but is not a
`.ability`-insertion of its partner. Measured difference: shape rule **88/98**, source+item-id
rule **92/98**.

**Corpus-verified, both directions:**
- 92 of the 98 newly-ambiguous keys collapse to the full ability.
- **Exactly 92** keys are collapsed in total — i.e. the tie-break touches *nothing* outside
  the newly-ambiguous set. Zero collateral, measured, not argued.
- The 6 survivors are three genuine collisions × their two slug spellings, and must stay
  ambiguous: `blessing-of-secrets` (censor **and** conduit abilities), `lead-by-example`
  (heroes vs summoner), `hit-and-run` (heroes ability vs beastheart companion feature).
  Different entries, not duplicates — picking one would be a guess, not a tie-break.

The CHANGELOG's by-name claim is now true again, and says explicitly what happens in the
genuine-collision case.

## 7.2 M2 — `dynamic-terrain`, and the much bigger thing under it

**The classification half** went as the review described: all 35 corpus `dynamic-terrain`
files carry a real ```` ```ds-fb ```` block and no adapter claimed them. Added
`FEATUREBLOCK_TYPE_RE = /(^|\.)featureblock$|^dynamic-terrain($|\.)/`, exported like its two
siblings and consumed by `featureblock/definition.ts`.

Worth recording because it makes these scopes un-guessable from code shape: the feature
family's frontmatter `type` is the **leaf** of the SCC segment
(`feature.ability.shadow.level-1` → `ability`), while dynamic terrain's is the **root**
(`dynamic-terrain.mechanisms` → `dynamic-terrain`). steel-etl is not self-consistent about
which end it writes. These scopes must be derived from a corpus census, never from the code.

**Then the widening exposed a second, unrelated, PRE-EXISTING fault**, and it is bigger than
SC-141:

```
TypeError: dto.isTrait is not a function
  at Feature.fromDTO (steel-compendium-sdk/model/Feature.js:34)
  at Featureblock.fromDTO (steel-compendium-sdk/model/Featureblock.js:17)
```

`FeatureblockDTO`'s constructor assigns `source.features` straight through — those entries
are still the plain objects `parseYaml` produced. `Featureblock.fromDTO` then maps them
through `Feature.fromDTO`, which only tolerates a plain object when the entry declares its
own `feature_type`; otherwise it falls through to `dto.isTrait()`, a `FeatureDTO` **method**
a plain object does not have.

**Every `features[]` entry in this repo's authored fixtures sets `feature_type`. steel-etl
emits none.** Measured over data-unified 2026-08-10 by parsing every file through
`FeatureblockConfig.readYaml`:

| `type:` | files | parsed **before** | parsed **after** |
|---|---:|---:|---:|
| `featureblock` | 117 | **0** | 117 |
| `dynamic-terrain` | 35 | **0** | 35 |

So **no feature block from any book could be rendered by SCC at all**, on `main`, today —
117 files whose failure has nothing to do with SC-141's type scopes and which no test caught,
because the plugin's own `example.yaml` is the only featureblock the suite ever parses.

Shipping M2's classification *without* addressing this would have made the user-visible
outcome **worse**: `dynamic-terrain` would move from a degrade card ("found but not
renderable — re-sync") to a pipeline error card ("failed to render — dto.isTrait is not a
function"). So the round includes the minimal unblock.

**Fix** — `applyFeatureTypeDefaults` in `src/model/FeatureblockConfig.ts`. Two properties
make it safe rather than a workaround:

1. **It is the SDK's own decision, not a reimplementation.** `Feature.isTrait` is a public
   **static** taking plain data — literally what `Feature.fromDTO` would have invoked via
   `dto.isTrait()`. The derived value is identical by construction, so this cannot drift from
   SDK semantics the way a hand-rolled predicate would.
2. **It is identity-gated.** When nothing needs defaulting the original object is returned by
   reference and `readYaml` hands the SDK the **original text** — no `parseYaml`/
   `stringifyYaml` round-trip touches the authored path, so it cannot perturb quoting, key
   order or block scalars on the path every frozen `featureblock--*` shot renders. (Confirmed
   by the freeze check: 0 mismatches.)

It sits at the same model-layer seam as `applyLegacyStatblockKeys` (`StatblockConfig.ts`), the
established place for reconciling real-world YAML with SDK reader expectations. The doc
comment names the removal condition (SDK wraps `FeatureblockDTO.features` in `FeatureDTO`s,
**or** steel-etl emits `feature_type` per entry).

**This deserves its own ticket** — the durable fix is upstream, in the SDK or steel-etl, and
it should not stay a plugin-side shim.

## 7.3 M3 — the action-type chip

`view.ts` rendered the chip from `feature.ability_type` raw. No compendium ability has that
field: steel-etl writes `usage: '[Maneuver](scc.v1:…)'` and no `ability_type`, so every real
ability rendered a chip-less row while every inline fixture looked correct — the **fourth**
instance of "the fixture says X, the corpus says something else" (after FOLLOWUPS #53 and
plan 25's two).

Now `abilityActionLabel` calls `actionTypeOf` — the same spine the tabs filter and the full
card already use, so chip and tabs can never disagree — and maps the token through a small
`ACTION_TYPE_LABELS` record. Raw `ability_type` survives only as a last resort for a value
`actionTypeOf` declines to map (showing the author's own words beats showing nothing).
`main → "Main action"`, so a hand-authored `ability_type: Main action` renders byte-identically;
pinned by a test.

## 7.4 L1 — the last two hand-copied regexes

- `statblock/definition.ts` — `/statblock$/` → the exported `STATBLOCK_TYPE_RE`. The local
  copy was **looser** than the constant its comment claimed to match (it accepts
  `notastatblock`). No corpus type exploited it; the point is that a copy claiming in prose to
  match TYPE_ADAPTERS while quietly differing is the exact setup that produced SC-141.
- `featureblock/definition.ts` — `/featureblock$/` → the new exported `FEATUREBLOCK_TYPE_RE`
  (which carries M2's widening, so the element's bare-slug scope and the adapter cannot
  diverge on `dynamic-terrain`).

`grep` for a locally-authored type regex in `src/elements/*/definition.ts` now returns nothing.

## 7.5 Fix-round coverage (+14 tests, +1 suite)

New corpus-verbatim fixtures: `dynamic-terrain/mechanisms/pillar.md`,
`feature/ability/summoner/level-1/shield.md` + `feature/summoner/level-1/shield.md` (the twin
pair), `feature/ability/fury/level-1/hit-and-run.md` +
`feature/companion/beastheart/lightbender/level-3/hit-and-run.md` (the genuine collision).

- `heroAbilitiesScc.test.ts` **+9** — M1: the twin resolves to the ability *and the expanded
  card proves it is the ability, not the stub* (asserts the trigger line is present and the
  stub's pointer sentence is absent); the index returns one code; a genuine cross-book
  collision still errors; the sheet surfaces that as one row listing both codes. M3: a corpus
  ability gets a `Maneuver` chip; an authored `ability_type` renders verbatim. M2:
  `getEntity().model()` parses a dynamic-terrain file; a by-SCC `ds-featureblock` renders
  *Toppling Pillar*; bare-slug reaches it.
- `featureblockConfig.test.ts` **+4** (new suite) — the corpus shape parses; the derived type
  matches `Feature.isTrait`'s ability/trait split; an already-typed entry is returned by
  **reference** (the identity gate); non-featureblock shapes pass through.
- `compendiumSearchModal.test.ts` **+1** — `typeToAlias('dynamic-terrain')` and
  `('dynamic-terrain.mechanisms')` → `ds-featureblock`.

## 7.6 Battery after the fix round (verbatim)

Run on the branch as committed at `a3ad2a7`, on the **unchanged base** `e141582` (no rebase —
the orchestrator handles that at landing).

| Gate | Result |
|---|---|
| `npm run tsc` | exit **0**, no output |
| `npm run lint` | exit **0**, no output |
| `npx jest` | exit **0** |
| `npm run shots` | exit **0** |
| `check-freeze.sh` | exit **0** |
| `npm run parity` | exit **0** |

```
Test Suites: 1 skipped, 161 passed, 161 of 162 total
Tests:       1 skipped, 2568 passed, 2569 total
Snapshots:   3 passed, 3 total
```

```
314 shots ok, 0 FAIL
```

```
freeze OK (188/200 producible OK, 12 missing (not producible on this branch), 0 checksum mismatches)
```

```
**0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**
```

**Two numbers moved for reasons that are not this branch's doing — read them before calling
anything red:**

- **jest 2554 → 2568** (+14) and **suites 160 → 161** (+1): exactly the fix-round coverage in
  §7.5 (9 + 4 + 1). Nothing pre-existing changed.
- **freeze denominator 188 → 200.** The baseline is shared workspace scratch and **a sibling
  branch widened it mid-flight**: the 12 unproducible lines are all `*-edit-btn--*`
  (`complication`, `counter`, `horizontal-rule`, `statblock` × legacy-dark/legacy-light/
  steel-print) — SC-145's new fixtures, which do not exist on this branch. Enumerated, not
  assumed (`comm -13` of the shots directory against the baseline). **A missing file is not a
  leak; a `FAILED` checksum is** — and there are **0** checksum mismatches, so every one of
  the 188 lines this branch can produce, including all the hero and featureblock ones, is
  byte-identical. This is precisely the case `dse-verify`'s fixed exit-code semantics exist to
  distinguish.

`obsidian-shots` deliberately NOT run (no display).

## 7.7 Not fixed, and why — one item that needs a decision

**`src/elements/hero/example.yaml` ships two invalid SCC codes.** The plugin's own D9
example/palette body for `ds-hero` — the thing "Insert ds-hero" writes into a user's note —
contains:

```yaml
abilities:                                          # SCC codes or inline ability YAML
  - scc.v1:mcdm.heroes.v1/.../brute-strike           # signature
  - scc.v1:mcdm.heroes.v1/.../into-the-fray          # heroic (costs ferocity)
```

**This is where Scott's `.../into-the-fray` line came from** — his ticket YAML is this file,
near-verbatim. It is not a red herring in his report; it is a shipped defect that every user
who inserts a hero block will hit, and "Into the Fray" is not even a Draw Steel ability
(nothing by that name exists in any of the four books).

Not fixed here because **it moves frozen shots.** The visual harness mounts `hero` with no
compendium, so each ability row renders `abilityRawLabel(raw)` — the raw code string — as its
header. Changing the codes changes that text in `hero--*`, `hero-sparse--*` and `hero-narrow--*`
(9 frozen lines), which needs a sanctioned rebaseline, not a bug-fix commit. Its own ticket:
replace both with real codes (e.g.
`scc.v1:mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam`) and re-pin the nine lines.
