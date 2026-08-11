# SC-141 — independent adversarial review

**Reviewer:** independent agent (no authorship of the fix)
**Under review:** worktree `/home/scott/code/steelCompendium/worktrees/sc141-hero-abilities/draw-steel-elements`,
branch `sc141-hero-abilities`, commits `cbc5f9d` + `22188aa` on dse base `e141582`
**Fix report reviewed:** `.superpowers/sdd/sc141/sc141-fix-report.md`
**Date:** 2026-08-10

## Recommendation

**LAND**, with three conditions, none of which is a code round:

1. **Amend the CHANGELOG's by-name claim** (finding **M1**). It says abilities work
   *"including by name (`Coat the Blade`)"*. For ~94 slugs (the summoner family) bare-name
   authoring went from *renders something* to *"is ambiguous — paste a full code"*. That is
   arguably an improvement in honesty, but it is a real, unmentioned behaviour change.
2. **File the `dynamic-terrain` latent twin** (finding **M2**) — a confirmed, live SC-141
   clone, proven in jsdom.
3. **File the action-type-chip gap** (finding **M3**, the fix report's own §6.1) — it is the
   visible finish on the exact surface this ticket repairs and is currently filed nowhere.

The core fix is correct, minimal, correctly scoped, and — unusually — **can-fail proven**
(§"Can-fail proof" below). The battery reproduced exactly as claimed.

---

## 1. Verdict per claim

| # | Claim | Verdict | Evidence |
|---|---|---|---|
| 1 | Root cause is `/^feature($\|\.)/` vs frontmatter `type: ability`/`trait` | **CONFIRMED** | Corpus census below: 621 `ability` + 95 `trait` + 876 `feature`, **all three carrying a ```ds-feature block**. `adapterForType('ability')` was `undefined`. |
| 2 | Widened `FEATURE_TYPE_RE` claims the feature family and nothing else | **CONFIRMED** | Of the 27 distinct `type:` values in the corpus, the regex matches exactly `feature`, `ability`, `trait`. `featureblock`, `feature-group`, `abilities`, `traits`, `notafeature` all correctly rejected; adapter ordering unchanged. |
| 3 | Per-entry error isolation: one bad ability costs one row | **CONFIRMED** for every reachable path | Independently forced throws from `resolveSlug`, `getEntity`, and `entity.model()` — each cost exactly one issue row, `.dse-hero` intact, no whole-sheet error card. |
| 3a | The `Promise.allSettled` arm is real defence | **CONFIRMED as unreachable belt-and-suspenders** (the report says exactly this) | Schema validation rejects a non-`string`/`object` entry before the view (`abilities/1: type: must be string,object`), and both branches of `resolveAbility` are fully try-wrapped. The rejection arm's message string is dead. **Info-level only** — the report is honest about it. |
| 4 | Better not-found message names the code + both causes | **CONFIRMED verbatim** | Rendered live: `Not found in the compendium: "mcdm.heroes.v1/.../into-the-fray" — the compendium may not be synced (run "Sync compendium"), or the code may be wrong.` |
| 5 | Three hand-copied regexes collapsed into one exported constant | **CONFIRMED** | `grep '\^feature'` over `src/` returns only two **doc-comment** occurrences. `typeAdapters.ts:166`, `feature/definition.ts:42`, `hero/view.ts:679` all read the imported `FEATURE_TYPE_RE`. |
| 6 | Battery: tsc/lint clean · jest 2554+1skip/160 · shots 314 · freeze 188/188 · parity 0/0/16 | **CONFIRMED exactly** | Reproduced independently, see §2. |
| 7 | No collateral; shared freeze baseline untouched | **CONFIRMED** | Diffstat confined to 8 files. Baseline (`.superpowers/sdd/freeze-baseline.sha256`, gitignored workspace scratch) is 188 lines, `sha256 6dfdc840…`, and the branch cannot touch it (different repo). One **environment** note: see E1. |

### Can-fail proof (the strongest evidence for claim 1)

Reverting **only** `FEATURE_TYPE_RE` to the pre-fix `/^feature($|\.)/` and re-running the
touched suites: **19 tests fail across 4 suites**, including all three regression sites —

- `CompendiumIndex › getEntity().model() parses a type: ability file through the ds-feature adapter`
- `SC-141 › a valid full SCC ability code resolves in the hero sheet` (×3)
- `SC-141 › by-SCC ds-feature references` (×2)
- `typeToAlias › a bare ability/trait type maps to ds-feature` (×2)
- plus all 8 of my own independent probes over real corpus bytes.

The new coverage genuinely detects the bug; it is not tautological. The file was restored and
`git diff 22188aa` is empty.

### Fixture provenance

`test/fixtures/md-dse/feature/ability/shadow/level-1/coat-the-blade.md` is **byte-identical**
to the corpus file (`sha256 8324cff6…` on both). The claim "the exact bytes a real sync
installs" is literally true.

---

## 2. Battery (reproduced independently)

All commands via `devbox run -- bash -c 'cd <worktree>/draw-steel-elements && <cmd>'`, each
gate the last thing evaluated, output redirected (never piped).

| Gate | Command | Result | Claimed | Match |
|---|---|---|---|---|
| Type-check | `npm run tsc` | exit **0**, no diagnostics | exit 0 | ✓ |
| Lint | `npm run lint` | exit **0** | exit 0 | ✓ |
| Unit tests | `npx jest` | **1 skipped, 160 passed, 160/161 suites; 1 skipped, 2554 passed, 2555 total; 3 snapshots** | 2554+1skip/160 | ✓ |
| Visual shots | `npm run shots` | exit **0**, **314 ok, 0 FAIL**, 314 PNGs on disk | 314 | ✓ |
| Freeze | `check-freeze.sh …/visual-harness/shots` | exit **0**, `freeze OK (188/188 legacy+print PNGs byte-identical)` | 188/188 | ✓ |
| Parity | `npm run parity` | exit **0**, `**0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**` | 0/0/16 | ✓ |

`obsidian-shots` not run (no display) — correct per the skill.

Freeze deserves an explicit note: the hero fixtures (`hero--*`, `hero-sparse--*`,
`hero-narrow--*`) are byte-identical, which is the right answer — they author abilities
**inline**, so the compendium resolution ladder this fix rewrites is not on their render path.
A change in those bytes would have meant the fix leaked into inline authoring.

---

## 3. Corpus census (`md-dse`, the synced format — `COMPENDIUM_FORMAT = "md-dse"`)

3,078 files; every one carries a frontmatter `type:`. Column 3 is the file's **first `ds-*`
fence** (what `extractFirstDsBlockText` would hand an adapter); column 4 is the claiming
adapter after the fix.

| `type:` | files | first ds-block | claiming adapter | `typeToAlias` |
|---|---:|---|---|---|
| `feature` | 876 | `ds-feature` | **ds-feature** | ds-feature |
| `ability` | 621 | `ds-feature` | **ds-feature** ← fixed | ds-feature |
| `statblock` | 512 | `ds-sb` | ds-statblock | ds-statblock |
| `rule` | 153 | (none) | ds-rule | ds-rule |
| `treasure` | 127 | (none) | ds-treasure | ds-treasure |
| `featureblock` | 117 | `ds-fb` | ds-featureblock | ds-featureblock |
| `complication` | 100 | (none) | ds-complication | ds-complication |
| `trait` | 95 | `ds-feature` | **ds-feature** ← fixed | ds-feature |
| `title` | 66 | (none) | ds-title | ds-title |
| `skill` | 57 | (none) | **UNCLAIMED** | ds-rule |
| `perk` | 55 | (none) | ds-perk | ds-perk |
| `monster` | 51 | (none) | **UNCLAIMED** | ds-rule |
| `dynamic-terrain` | **35** | **`ds-fb`** | **UNCLAIMED** ⚠ | ds-rule |
| `saint` | 28 | (none) | **UNCLAIMED** | ds-rule |
| `chapter` | 26 | (none) | **UNCLAIMED** | ds-rule |
| `kit` | 25 | `ds-feature`¹ | ds-kit | ds-kit |
| `career` | 18 | (none) | ds-career | ds-career |
| `project` | 16 | (none) | **UNCLAIMED** | ds-rule |
| `feature-group` | 14 | (none) | **UNCLAIMED** | ds-rule |
| `movement` | 13 | (none) | **UNCLAIMED** | ds-rule |
| `culture` | 13 | (none) | ds-culture | ds-culture |
| `negotiation` | 12 | (none) | **UNCLAIMED** | ds-rule |
| `ancestry` | 12 | (none) | ds-ancestry | ds-ancestry |
| `god` | 11 | (none) | **UNCLAIMED** | ds-rule |
| `class` | 11 | (none) | ds-class | ds-class |
| `condition` | 9 | (none) | ds-condition | ds-condition |
| `skill-group` | 5 | (none) | **UNCLAIMED** | ds-rule |

¹ `kit` files embed a `ds-feature` block (the signature ability) but are read through the
**frontmatter** adapter, which is correct — the block is not the kit's model. No conflict:
`FEATURE_TYPE_RE.test('kit') === false`.

**Over-claim check — clean.** Nothing that should route elsewhere is swallowed. The widened
anchor rejects `featureblock`, `feature-group`, `abilities`, `traits`, `notafeature`; and
`statblock`/`featureblock` adapters still precede `ds-feature` in `TYPE_ADAPTERS`, so
`monster.retainer.statblock` → `ds-statblock` as before.

**Unclaimed after the fix: 11 types / 268 files.** Ten of them (`skill`, `monster`, `saint`,
`chapter`, `project`, `feature-group`, `movement`, `negotiation`, `god`, `skill-group`, 233
files) carry **no** `ds-*` block at all — they are index/landing pages with nothing to render,
exactly as the fix report claims. They are *not* SC-141 twins.

**The eleventh one is** (finding M2).

---

## 4. Findings by severity

### M1 — MEDIUM: the widened slug scope introduces a real bare-slug ambiguity regression (unmentioned)

`resolveSlug(slug, typeScope)` filters candidates by `typeScope`. Widening the scope can only
**add** candidates, so a bare slug that used to resolve uniquely can now be ambiguous.

Measured over the real corpus (matching `resolveSlug`'s exact rule: `basename` ∨
`frontmatter.file_basename` ∨ `item_name`, case-insensitive):

- **122** slug keys become newly ambiguous;
- **98** of those involve a `type: feature` file that previously resolved uniquely;
- those 98 keys map to **55 distinct `type: feature` codes** that lose unique bare-slug resolution;
- **94 of the 98** are the same-source/same-item **twin** pattern — `steel-etl` emits both a
  full ability (`feature.ability.summoner.level-1/shield`, `type: ability`, 2,793 bytes) and a
  thin container/stub (`feature.summoner.level-1/shield`, `type: feature`, **605 bytes**, no
  `distance`/`effects`/`trigger`/`target`);
- **4** are genuinely different entries colliding across books
  (`lead-by-example`: censor L2 vs summoner L3; `hit-and-run`: beastheart companion L3 vs fury L1).

Proven live in jsdom, both directions, with the two real corpus files in the vault:

```
post-fix : "Shield" is ambiguous — paste a full code:
           mcdm.summoner.v1/feature.ability.summoner.level-1/shield,
           mcdm.summoner.v1/feature.summoner.level-1/shield
pre-fix  : renders "Shield!"   ← the 605-byte STUB, silently
```

**Why this matters and why it is still not a blocker:** pre-fix, the bare slug silently
rendered the *impoverished* twin — so the ambiguity error is arguably the more honest
outcome. But it is a behaviour change from "renders" to "error" on the exact sugar path the
CHANGELOG advertises: *"They all work now, including by name (`Coat the Blade`)."* For ~94
summoner-family names that sentence is now false in the other direction.

**Prescriptions, in order of preference:**

1. **Tie-break the twin case.** When candidates share source + item id and differ only by the
   `feature.ability.<x>/<id>` vs `feature.<x>/<id>` code shape, prefer the `ability` one — it
   is the real content, and this restores unique resolution for 94 of the 98 keys with a few
   lines in the ambiguity handler (or in `resolveSlug`). The 4 genuine cross-book collisions
   should stay ambiguous; that is correct behaviour.
2. **Or** accept and document: soften the CHANGELOG's by-name sentence, add a
   `FOLLOWUPS.md` entry recording the 55 codes, and note the stub twin as a `steel-etl`
   data-side duplicate worth removing at the source.

Doing neither leaves a shipped behaviour change with no record.

### M2 — MEDIUM (report, don't fix): `type: dynamic-terrain` is a live SC-141 twin

35 files carry a real ```` ```ds-fb ```` (featureblock) block and are claimed by **no** adapter.
Proven live in jsdom against the real corpus bytes
(`dynamic-terrain/mechanisms/pillar.md`, `scc: mcdm.monsters.v1/dynamic-terrain.mechanisms/pillar`):

```
"Pillar" found but not renderable — DS Compendium/dynamic-terrain/mechanisms/pillar.md
(type: dynamic-terrain) predates the required block; re-sync.
```

Same class of failure, same false accusation against the sync, same shape of fix (a
`DYNAMIC_TERRAIN`-inclusive scope on the featureblock adapter, or a `featureblock`-family
scope that covers it). Also: `typeToAlias('dynamic-terrain')` → `ds-rule`, so
Insert-compendium-reference wraps all 35 in the wrong fence — exactly the SC-141
mis-routing, one family over.

This is the **only** remaining latent twin in the corpus.

### M3 — MEDIUM (pre-existing, but on this fix's own surface): no action-type chip on real corpus abilities

`src/elements/hero/view.ts:618` renders the compact row's type chip only when
`feature.ability_type` is set. `steel-etl` emits the action type as
`usage: '[Maneuver](scc.v1:…)'` and sets **no** `ability_type` — verified in the corpus block
for Coat the Blade. My probe's compact row for a real ability rendered as bare text
`"Coat the Blade"` with no chip.

The tab filter is fine — it goes through `actionTypeOf`, which *does* fall back to `usage`
(`renderFeature.ts:141`). Only the chip reads the raw field. So a one-line fix (reuse
`actionTypeOf`, already imported in `view.ts:52`) closes it.

The fix report flags this as §6.1 "worth filing (not done here)", and nothing is filed. Since
this is the visible finish on the surface SC-141 exists to repair, it should get a
`FOLLOWUPS.md` number before this lands. Note the report's own observation that this is a
recurring class (FOLLOWUPS #53 / plan 25: *"the fixture says `ability_type`, the corpus says
something else"*) — the third instance.

### L1 — LOW: two more hand-copied type regexes survive the dedup

The fix correctly collapsed the three `feature` copies. But the same drift pattern remains
next door:

- `src/elements/statblock/definition.ts:41` — `sccType: /statblock$/`, while
  `STATBLOCK_TYPE_RE = /(^|\.)statblock$/` is exported two files away. The local copy is
  **looser**: it matches `notastatblock`.
- `src/elements/featureblock/definition.ts:41` — `sccType: /featureblock$/`, no shared
  constant exists at all.

No live impact (no corpus `type` exploits the looseness), and out of SC-141's scope — but it
is the identical "three copies, one comment claiming they match TYPE_ADAPTERS" setup that
produced this bug. Worth a follow-up while the reasoning is fresh.

### I1 — INFO: the `Promise.allSettled` rejection arm is unreachable and untested

`resolveAbility` wraps both of its branches in try/catch, and the pipeline's schema gate
rejects any `abilities[i]` that is not `string` or `object` before the view runs
(`abilities/1: type: must be string,object`, verified by forcing `- 42`). So nothing can
reject, and the `Could not read this ability — <reason>` string can never render.

The fix report says exactly this ("a rejection here should be unreachable;
belt-and-suspenders"), and it mirrors `resolve.ts:160`'s existing defence for
class/ancestry/kits — so this is honest defensive code, not a false claim. Recorded only so a
future reader does not mistake it for tested behaviour. The *real* isolation win is the
`resolveSlug`-inside-the-try move, which **is** reachable and **is** tested.

### E1 — ENVIRONMENT (not this branch): the shared main checkout is dirty

`git status` in `/home/scott/code/steelCompendium/workspace` shows ` M draw-steel-elements`,
which resolves to the **main checkout's** submodule carrying ` M demo-vault/Welcome.md` and an
untracked `compendium-manifest.json`. Neither is in SC-141's diff (`demo-vault` appears in
**SC-149**'s changed-file list). This will trip `just deploy*`'s hard dirty-abort and can
confuse `just wt-finish`. Not attributable to this branch or to this review — my probes ran
only inside the SC-141 worktree, which I verified clean afterwards (`git status --porcelain`
empty, `git diff 22188aa` empty).

---

## 5. SC-149 interaction (branch `sc149-ds-scc`, base `e141582` — same base)

I did **not** review SC-149. What follows is only the collision surface the rebase must
resolve deliberately.

**Overlapping files (3):** `src/services/typeAdapters.ts`,
`test/dom/authoring/compendiumSearchModal.test.ts`, `CHANGELOG.md`.
`src/elements/feature/definition.ts` and `src/elements/hero/view.ts` are SC-141-only and merge
clean; SC-149's `withReference` gains an optional `baseForType` and a `ReferenceElement<M>`
return type, both compatible with SC-141's `withReference(baseFeatureElement, { sccType: FEATURE_TYPE_RE })`.

### C1 — This is a DEPENDENCY, not merely a conflict: SC-149's flagship block is broken without SC-141

`src/elements/scc/definition.ts` dispatches the renderer for a resolved code through:

```ts
export function baseForSccType(type: string): ElementDefinition<unknown> | undefined {
	const alias = adapterForType(type)?.alias;
	return alias === undefined ? undefined : BASE_BY_ALIAS[alias];
}
```

and `RefUnwrapView` now error-cards on `undefined`:

```
"<name>" (type: <type>) has no renderer in this plugin.
```

With SC-149's un-widened `/^feature($|\.)/`, `adapterForType('ability')` is `undefined`, so
**all 716 ability/trait codes hit that new error card** — `ds-scc`, the one block SC-149 exists
to introduce, would be broken for the corpus's largest family on day one. SC-141 must be in
the merge base for SC-149 to work.

Worth flagging to whoever lands SC-149: its `baseForSccType` doc comment currently reads
*"A `type` no adapter claims has no model either (`CompendiumIndex.getEntity().model()`
returns undefined), so it never reaches a view regardless."* That sentence is **true** and is
**exactly the rationalization that hid SC-141 for months** — it describes the bug as if it
were the design. It should be revised post-rebase.

### C2 — `typeToAlias` is deleted by SC-149; SC-141's three new tests target it

SC-149 replaces `typeToAlias` with `referenceAliasForType` / `snapshotAliasForType`. SC-141
adds three assertions to `test/dom/authoring/compendiumSearchModal.test.ts` — the file SC-149
also rewrote:

```
typeToAlias('ability') → 'ds-feature'
typeToAlias('trait')   → 'ds-feature'
typeToAlias('featureblock') still wins over the widened scope
```

A conflict resolution that keeps SC-149's version wholesale **silently drops SC-141's
regression coverage** for the alias half of the fix. Port them to the new function names;
`tsc` will catch a stale `typeToAlias` import but will not notice a deleted test.

### C3 — Two semantic flips the rebase inherits silently (both need an explicit ruling)

SC-149 gates on `DS_BLOCK_ALIASES = {ds-statblock, ds-feature, ds-featureblock}`, so SC-141's
widening changes the answer for 716 files:

| function | `'ability'` / `'trait'` **without** SC-141 | **with** SC-141 | consequence |
|---|---|---|---|
| `referenceAliasForType` | `'ds-scc'` (catch-all fence) | **`'ds-feature'`** (typed fence) | Insert-compendium-**reference** puts 716 files in the typed block instead of `ds-scc`. |
| `snapshotAliasForType` | `null` — **snapshot refused** | **`'ds-feature'`** — **snapshot offered** | 716 files move from "no snapshot" into "snapshot allowed". |

The second is the sharper one. SC-149's stated purpose is to *remove* the snapshot vector for
everything outside the three documented ds-block formats ("Scott's ruling is firm that a
snapshot of a display-family entry … is the exact vector this pass exists to remove"). SC-141
moves 621 abilities + 95 traits across that line **as a side effect of a bug fix**, with no
one deciding it.

My read: both flips are probably **correct** — an ability genuinely *is* `ds-feature` content,
and the `ds-feature` YAML is one of the three documented, stable authoring formats, so
abilities belong on the typed-fence/snapshot-allowed side by SC-149's own criterion. But the
answer must be *chosen* at rebase time, with a test pinning it, not inherited from a merge.

---

## 6. What I ran

- Full battery, reproduced from scratch (§2), never piped, each gate last in its `bash -c`.
- Corpus census two ways (`grep -m1 '^type:'` and a frontmatter-block-only `awk` pass —
  identical results, all 3,078 files accounted for), plus a `type` → first-`ds-*`-fence census.
- 14 independent jsdom probes over **real corpus bytes** (loaded straight from
  `data-unified/en/unified/md-dse/`, not the repo fixtures) through the real
  `ElementPipeline` + real `CompendiumIndex`: by-SCC `ds-feature` for an ability and a trait;
  the dynamic-terrain twin; hero sheet with corpus ability + corpus trait; Scott's exact mixed
  input; three independent forced-throw isolation cases; bare-slug resolution; the
  `allSettled`-arm reachability test; the ambiguity regression, both pre- and post-fix.
- Can-fail proof by reverting the regex (19 failures / 4 suites), then restore.
- Fixture-vs-corpus byte comparison.
- SC-149 collision surface read from its worktree (no review of its correctness).

All probe files were deleted and `src/services/typeAdapters.ts` restored;
`git status --porcelain` in the SC-141 worktree is empty and `git diff 22188aa` is empty.
