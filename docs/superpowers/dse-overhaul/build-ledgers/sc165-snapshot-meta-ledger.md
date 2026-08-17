# SC-165 — snapshot insert ships a `metadata:` block that silently ignores edits

**Status:** done, committed, unlanded.
**Worktree:** `/home/scott/code/steelCompendium/worktrees/sc165-snapshot-meta/draw-steel-elements`
**Branch:** `sc165-snapshot-meta`, cut from `develop` `9bb24c3`
**Commit:** `56a7e20` — `fix(authoring): trim the snapshot insert to the fields a user can edit (SC-165)`
**Superproject pointer:** left unstaged, as instructed.

## The change

One call site: `insertFullBlock` now runs the extracted DTO through a new
`trimSnapshotDTO` before `stringifyYaml`.

```
const dto = trimSnapshotDTO(extractDTO(model));
```

`src/authoring/compendiumInsert.ts`:
- `RENDER_INERT_SNAPSHOT_KEYS = ['metadata'] as const`
- `trimSnapshotDTO(dto)` — shallow copy minus those keys; non-objects pass through
  untouched so the `dto === undefined` raw-body fallback still fires.

Snapshot output only. The synced compendium files keep their full DTO shape.

## Fields stripped, per type, and why each is inert

All three snapshot-eligible families (`snapshotAliasForType` → `ds-sb` / `ds-feature` /
`ds-featureblock`) emit exactly **one** render-inert field, and it is the same one:

| Type | Stripped | Contents in the real corpus |
|---|---|---|
| statblock | `metadata` | `{scc, source}` |
| feature | `metadata` | `{action_type, class, distance, effects, flavor, keywords, level, name, scc, subclass, target, type}` — a mirror of the entry |
| featureblock | `metadata` | `{scc, source}` |

Why inert — verified four ways, not assumed:

1. **Source read.** `grep -rn "metadata" src/elements/ src/framework/ src/model/` returns
   zero reads outside `app.metadataCache` (a different thing) and prose comments. The three
   views (`src/elements/{statblock,feature,featureblock}/view.ts` + `renderFeature.ts`)
   never touch it.
2. **SDK read.** `Feature`/`Statblock`/`Featureblock` declare `metadata?: Record<string,any>`
   and do exactly two things with it: `Object.assign` it in from the DTO, and copy it back
   out in `partialFromModel`. It is a transport slot, nothing else.
3. **Round-trip render proof (test).** For each family: take the trimmed snapshot body, add
   the fixture's own `metadata` back, render both through the real `ElementPipeline`, assert
   byte-identical innerHTML.
4. **Nothing else is inert (test).** Delete-mutation sweep over every surviving top-level
   key: removing it must change the rendered DOM.

### Surviving keys (the sweep's output)

```
statblock     type name level role organization keywords ev stamina speed movement
              size stability free_strike might agility reason intuition presence features
feature       type feature_type name flavor keywords usage distance target effects
featureblock  type name level flavor stats features
```

Every one of those is render-live under delete-mutation **except two, kept deliberately**:

- **`type`** (all three families). The DTO constructor stamps it from `modelType()` and
  overwrites whatever a user types, so it can never change a render. **Kept:** it opens each
  element's own `example.yaml` and the published block format, and SC-147's regression test
  asserts `parsed.type === 'feature'`.
- **`feature_type`** (feature only). The card's ability-vs-trait branch is
  `renderFeature.actionTypeOf` → `config.feature.isTrait()`, which the SDK **recomputes from
  shape** (no keywords/usage/distance/target) rather than reading the field — so neither
  deleting it nor flipping it to `trait` moves a pixel today. **Kept:** it is line 2 of
  `src/elements/feature/example.yaml`, `FeatureblockConfig` normalizes nested entries on it,
  it is the SDK's declared ability/trait/subtrait discriminator, and SC-147 asserts it. Per
  the brief's "when unsure, keep the field", a documented key the current renderer happens to
  ignore is not the same thing as transport.

Both exemptions are themselves pinned by a test that reads the element's `example.yaml` and
requires the key to be present there — so the excuse list cannot quietly grow to cover a real
transport field.

### Scope decisions

- **Top level only.** Zero indented `metadata:` lines exist anywhere in
  `data/data-unified/en/unified/md-dse-linked` (checked). A deep walk buys nothing and gains
  the ability to reach into a user's own nested homebrew YAML.
- **Deny list, not allow list.** An allow-list of live keys would silently *drop* any field a
  future SDK adds; a deny list silently *keeps* it. Keeping is the safe direction.
- **`prefs:` / `_dse_*` keys are unaffected.** They never appear in a DTO — they are
  user-authored per-block keys the pipeline strips before parse — so nothing in this change
  can reach them.

## Tests

Extended `test/dom/authoring/compendiumSearchModal.test.ts` (+12 tests, new
`describe('SC-165 …')` block placed with the existing `insertFullBlock` tests). Three
`test.each` sweeps over all three families, driven end to end over real md-dse fixtures
(`goblin-stinker.md`, `coat-the-blade.md`, `pillar.md`):

1. the snapshot has no `metadata` key — plus a can't-go-vacuous guard asserting the SOURCE
   fixture really carries one;
2. adding `metadata` back renders byte-identical DOM (the inertness proof);
3. removing any other top-level key changes the DOM (the "nothing live was removed" proof,
   and the tripwire for a future inert field);
4. each excused constant is present in its element's `example.yaml`.

**Can-fail proven:** reverting the one-line call site → 6 of the 12 fail (the three
"no metadata" and the three sweeps; the round-trip renders correctly still pass, since they
assert inertness either way).

### Note on the SC-147 regression tests

The brief said to extend them. **They are not on `develop`** — `a428c58`
(`test/dom/authoring/compendiumInsertScenarios.test.ts`, 4 tests) lives unlanded in the
sibling worktree `sc147-inserts`. Writing into that filename here would have created an
add/add conflict at landing, so the SC-165 tests went into the landed home of the
`insertFullBlock` tests instead (`compendiumSearchModal.test.ts`), reusing its existing
`Editor` mock rather than duplicating a fake. There is no overlap in what the two files
assert (SC-147: fence and shape; SC-165: the body's editability).

**Cross-branch safety checked, not assumed:** SC-147's file was copied into this branch and
run against the trimmed output — **4/4 pass unchanged** (it asserts `name`, `type`,
`feature_type`, no `---`, no nested fence, no `scc` — all still true after the trim). The two
branches land in either order without conflict.

## Docs / changelog

- `docs/writing-blocks.md` → "Insert Draw Steel: compendium block (snapshot)", the
  "**Why you'd want that:**" paragraph: one plain-language sentence that what lands is
  trimmed to the lines you can edit, no ticket refs.
- `CHANGELOG.md` → new `[BUGFIX]` bullet under the `## 7.0.0 (unreleased…)` header.
- **No screenshot regeneration needed.** `docs/Media/tutorial-snapshot-yaml.png` (the only
  image showing snapshot YAML) is a hand-authored "Ashfall Stinker" demo block with no
  `metadata:` in it — read and confirmed. `docs-shots` was not run (and was out of scope).

## Battery (per `dse-verify`, run in order at `56a7e20`)

| Gate | Baseline @ `9bb24c3` | Measured | |
|---|---|---|---|
| `npm run tsc` | 0 | **clean, exit 0** | ✅ |
| `npm run lint` | 0 | **clean, exit 0** | ✅ |
| `npx jest` | 2702 passed + 1 skipped / 165 suites | **2714 passed + 1 skipped / 165 suites / 166 total (1 skipped suite) / 3 snapshots**, exit 0 | ✅ +12 = exactly this branch's new tests |
| `npm run shots` | 203 / 0 FAIL | **203 ok, 0 FAIL** | ✅ unchanged |
| `check-freeze.sh` | 67/67 | **`freeze OK (67/67 steel-print PNGs byte-identical)`, exit 0** | ✅ did not move (TS-only change, as required) |
| `npm run parity` | 0/0/16 | **0 gaps, 0 undeclared warnings, 16 declared deferrals**, exit 0 | ✅ unchanged |
| `npm run obsidian-shots` | — | **not run** (display `:1` off limits) | — |

`node_modules` was absent in the worktree; `npm ci` was run first (lockfile install, no
`package.json`/`package-lock.json` change).

## Concerns / follow-ups (none blocking)

1. **`indent:` is dropped by the snapshot** — pre-existing, not introduced here.
   `FeatureConfig.readYaml` reads a top-level `indent` key straight off the YAML (it is not a
   DTO field), so `extractDTO` has never round-tripped it. No corpus file sets it, so no live
   effect; noting it because it is the one render-live key the snapshot path loses.
2. **`type:` on a featureblock snapshot is rewritten** — pre-existing. `pillar.md`'s source
   block says `type: dynamic-terrain`; the snapshot emits `type: featureblock`, because the
   DTO stamps `modelType()`. Harmless (the field is inert), but it means a snapshot is not a
   byte-copy of the synced block even before this change.
3. **`feature_type` is dead weight on the render path today.** Kept on documented-format
   grounds (above). If someone later decides the plugin should honour an explicit
   `feature_type: trait` over the SDK's shape heuristic, that is a real behaviour ticket —
   `renderFeature.actionTypeOf` would read `config.feature.feature_type` first.
4. **SC-147 is still unlanded** and its test file is a new path; see the note above. Nothing
   to do beyond landing the two in any order.
# SC-165 — adversarial review (executing)

**Reviewed:** worktree `/home/scott/code/steelCompendium/worktrees/sc165-snapshot-meta/draw-steel-elements`,
branch `sc165-snapshot-meta`, single commit `56a7e20` on base `9bb24c3`.
**Reviewer did not write the change.** Every claim below was re-derived by execution, not read
off the implementer's report.

## Verdict: **LAND**

The change is correctly scoped, the inertness claim survived every attempt to break it (and I
found a stronger proof than the branch ships), the tests are non-vacuous and can-fail exactly as
claimed, and the full battery reproduces to the digit. All findings are Minor or below and all
are prose/comment accuracy, not behaviour. None blocks landing; M1 + M2 are one-line edits worth
making on the way in.

---

## Battery — measured at `56a7e20`

`node_modules` was already present in the worktree, so no `npm ci` was needed.

| Gate | Report claims | **I measured** | |
|---|---|---|---|
| `npm run tsc` | 0 | clean, no output, exit 0 | ✅ |
| `npm run lint` | 0 | clean, exit 0 (only ESLint's pre-existing `.eslintignore` deprecation warning) | ✅ |
| `npx jest` | 2714 + 1 skip / 165 | **2714 passed, 1 skipped, 2715 total; 165 suites passed of 166 (1 skipped suite); 3 snapshots**, exit 0 | ✅ |
| `npm run shots` | 203 / 0 FAIL | **203 `ok`, 0 `FAIL`** | ✅ |
| `check-freeze.sh` | 67/67 | **`freeze OK (67/67 steel-print PNGs byte-identical)`**, exit 0 | ✅ |
| `npm run parity` | 0/0/16 | **`0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).`**, exit 0; composition = the documented #39 ×8 / #51 ×6 / #40 ×2 | ✅ |
| `npm run obsidian-shots` | not run | not run (display `:1` off limits) | — |

Shared freeze baseline untouched (67 lines, `git status` clean). Main checkout never written to.

**Footgun hit while measuring, worth recording:** `devbox run -- bash -c "…; echo X=\$?"` with
**double** quotes reported `X=0` for a jest run that had genuinely failed (6 tests red). The
`dse-verify` skill's warning about `$PIPESTATUS`/`$?` under the devbox sh wrapper extends to this
shape too. Every number in the table above is taken from the tools' own **textual** output
(`freeze OK (…)`, `0 gap(s), 0 undeclared…`, `Tests: … passed`, `0 FAIL`), not from a captured
exit code.

---

## Claim-by-claim

### 1. Scope: snapshot output only — **verified**

`extractDTO` and `trimSnapshotDTO` are both module-private to
`src/authoring/compendiumInsert.ts`. Repo-wide grep for `extractDTO|trimSnapshotDTO|RENDER_INERT`
returns hits in that one file only, and `trimSnapshotDTO` has exactly **one** call site
(`compendiumInsert.ts:132`, inside `insertFullBlock`). Grep for `toDTO` across `src/` returns the
two reflective probes inside `extractDTO` plus one commented-out line in
`src/model/FeatureConfig.ts:25` — there is no second DTO-extraction consumer to affect.

- **Reference (`ds-scc`) path:** `insertReferenceBlock` / `dispatchReferenceChoice` /
  `insertInlineLink` / `copyCode` are byte-untouched in the diff. They never call `entity.model()`.
- **Search-modal preview:** there is no preview surface to change. `CompendiumSearchModal` renders
  a suggest row of name / type / source spans (`:131`) and nothing else. Its `entry.source` comes
  from **file frontmatter** via `CompendiumIndex` (`source: typeof fm.source === "string" ? fm.source
  : code.split("/")[0]`), not from model `metadata` — structurally unreachable from this change.
- **Sync path:** `CompendiumSyncService` writes downloaded release bytes to the vault; it never
  builds a DTO. Synced files keep their full shape by construction, not by convention.

### 2. Inertness — **verified, and I could not break it**

Tried the specific surfaces the brief named (tooltip, hover, sidebar tab title, print header,
"source" footer, SCC resolution, cross-references, search index, `_dse_*` addressing):

- `grep -rn "\.metadata\b" src/ main.ts` → **zero hits.** Every `metadata` string in `src/` is a
  prose comment, `app.metadataCache` (unrelated), the new SC-165 code, or
  `src/elements/display/kit/example.yaml` (kit is not snapshottable — SC-149).
- **SDK audit (`steel-compendium-sdk@3.0.0`, bundled `dist/`).** Every `metadata` reference is one
  of two things: a DTO `partialFromModel` copy-out (13 DTOs, all of the form
  `if (model.metadata !== undefined) data.metadata = model.metadata`), or the markdown feature
  reader/writer's frontmatter transport (`io/markdown/MarkdownFeatureReader.js:52`,
  `MarkdownFeatureWriter.js:42-43` — neither is on the block render path;
  `MarkdownStatblockReader.js:22` has its metadata line commented out). **No branch anywhere keys
  on `metadata` presence.** The three models (`Feature`/`Statblock`/`Featureblock`) only
  `Object.assign` it in.
- **The "quiet provenance" trap I went looking for:** `src/framework/kit/cardHead.ts:28` documents
  `leftDeck` as *"quiet provenance ('class · subclass')"* — and a feature's `metadata` carries
  exactly `class` and `subclass`. Checked all ten `cardHead(` call sites: **`leftDeck` is never
  passed by any of them**, least of all by
  `statblock/view.ts:206`, `featureblock/view.ts:85` or `feature/renderFeature.ts:283`. Dead slot.
- `src/elements/project/view.ts:149`'s `Source: ${source}` footer is the **project** element (not a
  snapshottable family) and reads `model.source`, not `metadata`.
- `_dse_*` keys are per-block user keys on `Counter`/`party`/`montage`/`project` models; they never
  appear in a DTO. Unaffected.

**Stronger proof than the branch ships.** The branch's inertness test compares the snapshot to
*itself plus metadata*. I ran the axis it leaves open — render the **snapshot body** and the
**original synced `ds-*` block body** through the real `ElementPipeline` and diff innerHTML:

| family | snapshot innerHTML | original innerHTML | identical |
|---|---|---|---|
| statblock (`goblin-stinker`) | 7805 chars | 7805 | **yes, byte-identical** |
| feature (`coat-the-blade`) | 2175 | 2175 | **yes** |
| featureblock (`pillar`) | 3743 | 3743 | **yes** |

So the trim is provably render-neutral end to end, against the real corpus, not merely
self-consistent. (See L3 — this assertion is free to keep.)

### 3. The two survivors (`type`, `feature_type`) — **keeping them is right**

- **`type`** — all three DTOs open `partialFromModel` with `{ type: model.modelType() }`
  unconditionally, so a user's edit is always overwritten. Inert by construction, documented in
  every `example.yaml`, and asserted by SC-147's test (`expect(parsed.type).toBe('feature')`).
- **`feature_type`** — worth stating more precisely than the report does: the **SDK does read it**
  at re-parse. `model/Feature.js:23-33` (`Feature.fromDTO`) branches on `dto.feature_type` for
  `ability`/`trait`/`subtrait` and only falls back to `dto.isTrait()` shape-recomputation when it
  is absent. What makes it DOM-inert is one level up: `renderFeature.actionTypeOf` asks
  `config.feature.isTrait()`, which recomputes from shape regardless. Dropping it would also break
  `FeatureblockConfig.ts:43-45`'s nested-entry normalization contract and contradict
  `docs/Features.md`'s "`feature_type` … Required: **Yes**". Keeping it is correct.
- **Does stripping `metadata` change re-parse?** No. There is no parser branch keyed on metadata
  presence in the SDK (exhaustive grep above), and the three model constructors just
  `Object.assign(this, source)`. The re-parse of a trimmed snapshot produces the same model the
  untrimmed one did, minus a field nobody reads — confirmed empirically by the byte-identical
  render table in §2.

### 4. Nested `metadata:` deliberately not walked — **verified, with one correction**

The synced format is `md-dse` (`CompendiumSyncService.ts:11`, `COMPENDIUM_FORMAT = "md-dse"`), not
the `md-dse-linked` the source comment cites. Counted indented `metadata:` lines in **both**, and
in every per-book variant:

| tree | files with an indented `metadata:` |
|---|---|
| `data/data-unified/en/unified/md-dse` | **0** |
| `data/data-unified/en/unified/md-dse-linked` | **0** |
| `en/books/{beastheart,heroes,monsters,summoner}/md-dse` | **0** each |
| `en/books/{beastheart,heroes,monsters,summoner}/md-dse-linked` | **0** each |

Nested `metadata:` **does** exist elsewhere in `data-unified` — the `yaml/` format has it in kits
and features (`en/books/heroes/yaml/kit/spellsword.yaml:24`, etc.) — but no `yaml/` file is ever
synced into a vault, so it cannot reach `insertFullBlock`. The scope decision holds; only the
comment's directory name is imprecise.

Live confirmation, not just a corpus count: a probe over the three real fixtures printed the actual
snapshot bodies — **0 indented `metadata:` lines** in each, including the statblock's and the
featureblock's nested `features:` entries (which round-trip through `Feature.toDTO()` and *would*
carry one if the source had it).

### 5. Tests — **non-vacuous, no key skipped, can-fail exact**

- **The guard is real.** Sweep 1 ends with `expect(source.metadata).toBeDefined()` against the
  parsed fixture `ds-*` block, so it cannot pass by asserting the absence of a field that was never
  there. Confirmed against the bytes: `coat-the-blade.md`'s `ds-feature` block carries a 17-line
  `metadata:` mirror (`action_type`, `class`, `distance`, `effects`, `flavor`, `keywords`, `level`,
  `name`, `scc`, `subclass`, `target`, `type`).
- **Sweep 3 skips nothing.** `for (const key of Object.keys(parsed))` over the whole trimmed body,
  no skip list, no early continue; it *collects* the inert keys and asserts the collected array
  `toEqual(constants)`. Array equality is order-sensitive, so a new inert field fails loudly rather
  than being absorbed into an excuse list. Keys actually swept: **statblock 19, feature 9,
  featureblock 6** (verified by printing the parsed key lists).
- **Can-fail reproduced exactly.** Reverting line 132 to `const dto = extractDTO(model);` →
  **6 failures**, and precisely the six the report names: the three
  `…the snapshot carries no metadata: block…` and the three
  `…every other surviving top-level key changes the render when removed`. The three round-trip
  renders and the `example.yaml` test correctly stay green (they assert inertness either way).
  File restored afterwards.
- Sweep 2 is not vacuous-by-error either: sweep 3 derives a real, non-error `base` render from the
  same body, so the DOM being compared is a real card.

### 6. Interaction with the unlanded `sc147-inserts` — **no conflict; one stale-clone caveat**

- **Reproduced 4/4.** Copied `compendiumInsertScenarios.test.ts` from `a428c58` into this worktree
  and ran it against trimmed output: **4 passed, 0 failed.** Its assertions (`name`, `type`,
  `feature_type`, no `---`, no nested fence, `scc` undefined) are all still true post-trim.
- **Source-file conflict: none.** `git diff main...HEAD --stat` on `sc147-inserts` shows it never
  touches `src/authoring/compendiumInsert.ts`. Its only new test path
  (`test/dom/authoring/compendiumInsertScenarios.test.ts`) is one SC-165 does not create, and SC-165's
  tests went into `compendiumSearchModal.test.ts`, which SC-147 does not touch. Clean either order.
- **Predicted merge friction: `CHANGELOG.md` only.** Both branches insert bullets at the top of the
  same `## 7.0.0 (unreleased…)` section (SC-147 +17 lines, SC-165 +8). Expect a trivial
  adjacent-hunk conflict; resolution is "keep both bullets".
- **Caveat for the orchestrator, not for this branch:** the `sc147-inserts` submodule clone is
  stale — its `main` is `221acc9` (SC-123, 2026-08-12) and `9bb24c3` is not even a valid object in
  it. It needs a fetch/rebase before landing, independent of SC-165.

### 7. Docs + CHANGELOG — accurate on the mechanism, overstated on the guarantee

Placement is right (CHANGELOG bullet under `## 7.0.0 (unreleased…)`, `[BUGFIX]` prefix matching its
neighbours; docs edit in the snapshot command's "Why you'd want that" paragraph). No stale example
anywhere: the only other `metadata` mentions in `docs/` are `compendium-sync.md:54` (an HTTP
metadata request, unrelated) and `Features.md:31` (the field reference, still accurate — the field
is still *accepted*, just no longer *emitted*).

Measured the CHANGELOG's size claim rather than trusting it — `metadata` removed vs kept, same
fixture, same serializer:

| fixture | trimmed | with metadata | ratio |
|---|---|---|---|
| `coat-the-blade` (ability) | 646 | 1448 | **0.45** |
| `goblin-stinker` (statblock) | 1880 | 1981 | 0.95 |
| `pillar` (featureblock) | 2439 | 2534 | 0.96 |

"for an ability roughly halves the pasted block" is accurate, and correctly scoped — for the other
two families `metadata` is only `{scc, source}` and the saving is ~5%.

---

## Findings (severity-ranked)

### M1 — Minor · docs/CHANGELOG overstate the guarantee the branch's own tests disprove

`docs/writing-blocks.md`: *"…so every line you see is one that changes the card."*
`CHANGELOG.md`: *"Snapshots now contain only the fields that render."*

Both are false for the two lines this branch deliberately keeps. The branch's own sweep proves it:
`type:` (all three families) and `feature_type:` (feature) render byte-identically whether present,
absent, or wrong. In a ticket whose subject is *"don't paste lines that silently ignore edits"*,
promising the opposite in user-facing prose is the same class of claim the ticket exists to remove
— a user who edits `feature_type: ability` → `trait` and sees nothing change has been told by the
docs that that cannot happen.

*Reproduction:* the branch's own `SC-165 … every other surviving top-level key changes the render
when removed` asserts `inert === ['type', 'feature_type']` for the feature family.

*Suggested wording:* docs → "…so what's left is the content itself, not the compendium's
bookkeeping." CHANGELOG → "Snapshots now carry only the entry's own content."

### M2 — Minor · the `RENDER_INERT_SNAPSHOT_KEYS` comment contradicts the branch's own excuse list

`compendiumInsert.ts:84-87`: *"Everything surviving here is a field the renderer reads (`type` is
**the one constant**…)"*. There are **two** constants, and the tests say so: `feature_type` is
excused for the feature family in both `SNAPSHOT_CASES` and the `example.yaml` pin. A reader who
trusts this comment will believe the survivor set is tighter than it is — and it is exactly the
comment a future maintainer consults before adding a key. One clause fixes it: name `feature_type`
alongside `type` and cite the shape-recomputation reason (`renderFeature.actionTypeOf` →
`config.feature.isTrait()`), which is already written out correctly in the test file.

### M3 — Minor · the docs sentence describes only half of what `metadata` was

*"the bookkeeping the compendium keeps about where an entry came from"* covers `{scc, source}` —
the statblock/featureblock case, where the saving is 5%. For a **feature**, the case that motivated
the ticket and the case the CHANGELOG (correctly) leads with, `metadata` was a full mirror of the
entry: `name`, `effects`, `flavor`, `target`, `action_type`, `level`, `class`, `subclass`. That is
not "where it came from", and it is the half that made the bug a silent-edit trap rather than mere
bulk. The CHANGELOG gets this right; the docs sentence does not.

### L1 — Low · cosmetic reflow

The docs insertion leaves an orphan line: `… A\nsnapshot deliberately does\n*not* keep up …`.
Renders as one paragraph, so zero user impact; just reflow to the file's ~90-col wrap.

### L2 — Low · the deny list is named generically but scoped to three families

`RENDER_INERT_SNAPSHOT_KEYS` holds one key because that is all the three snapshottable DTOs emit.
Five other SDK DTOs — `PerkDTO`, `CareerDTO`, `CultureDTO`, `AncestryDTO`, `ClassDTO` — emit a
top-level **`scc`** transport key (`dto/PerkDTO.js:15-16` and siblings). If SC-149's snapshot gate
is ever widened past the three typed families, the identical bug returns under `scc`, and nothing
would catch it: the new sweep is hard-coded to three families. A one-line note on the constant
naming `scc` as the next candidate is enough; no code change wanted today.

### L3 — Low · the tests leave the fidelity axis unpinned

Sweeps 2 and 3 compare the snapshot only against **mutations of itself**. Nothing asserts the
snapshot renders the same card as the entry it was copied from — so a future DTO change that
dropped a live field entirely (never emitting it, so the sweep never sees the key) would pass all
twelve tests. I wrote that assertion as a probe and it passes byte-identical for all three families
today (table in §2), so it is free to adopt: render `insertFullBlock`'s body and
`extractDsBlockText(fixture)` through the pipeline and `expect(a).toBe(b)`. Recommended, not
required.

### I1 — Informational · pre-existing, out of scope: `ds-featureblock` drops nested-feature content

`pillar.md`'s nested entries carry `body`, `sections` and `power_roll`; the rendered card shows only
name + icon (+ keywords/usage/distance/target) for every one of them — no effect text, no power-roll
tiers. The snapshot's YAML shows the same shape (`effects: []` on all four entries). **This is not
SC-165's doing** — it is byte-identical on the original block and the snapshot (§2), so it is a
`ds-fb` rendering gap for corpus-shaped nested features, not a snapshot fidelity loss. Noting it
because it makes `pillar` a weak fixture for any future "the content survives the round trip"
argument, and it may deserve its own ticket.

### I2 — Informational · environment: the shared main checkout is dirty (not from this review)

`workspace/draw-steel-elements` carries ` M demo-vault/Welcome.md` and untracked
`compendium-manifest.json` (mtimes 2026-08-16 21:01 and 2026-08-15 22:13 — both predate this
review; I never wrote to that checkout). `just deploy*` hard-aborts on a dirty tree, so it wants
clearing before the next deploy.

---

## What I ran

All commands in the worktree, wrapped `devbox run -- bash -c 'cd <abs> && …'`:
`npm run tsc` · `npm run lint` · `npx jest` · `npm run shots` ·
`check-freeze.sh <worktree>/visual-harness/shots` · `npm run parity`.

Probes written, run, and **removed**: `test/dom/authoring/zzProbe165.test.ts` (snapshot-body dump,
nested-`metadata:` count, raw-body-fallback ×2), `test/dom/authoring/zzProbe165b.test.ts`
(snapshot-vs-original render fidelity ×3), and a copy of SC-147's
`compendiumInsertScenarios.test.ts` from `a428c58`. The one-line call-site revert for the can-fail
check was restored from a backup.

**Worktree left clean at `56a7e20`** (`git status --porcelain` empty). Shared freeze baseline
untouched (67 lines). Main checkout not written to. Display `:1` not used.

---

# Fix round 1 — applied by the reviewer (2026-08-16)

**Commit:** `c39cf4f` — `docs(authoring): describe the snapshot trim accurately, pin the
fidelity axis (SC-165 fix round 1)` on `sc165-snapshot-meta`, on top of `56a7e20`.
**Scope:** text and tests only. `RENDER_INERT_SNAPSHOT_KEYS` still holds exactly `metadata`
and `trimSnapshotDTO` still has one call site — the trim's behaviour is byte-unchanged.

Coordinator's ruling on the rest: **L2** noted in this report and closed; **I1** to be
evaluated as its own ticket; **I2** is Scott's live vault state and expected.

## What changed, per finding

### M1 — the overclaim is gone (docs + CHANGELOG) ✅

Both surfaces asserted something the branch's own liveness sweep disproves.

- `docs/writing-blocks.md` — *"…so every line you see is one that changes the card"* →
  removed. The paragraph now states what happened (the duplicated `metadata:` block is left
  out) and makes **no claim about the remaining lines**.
- `CHANGELOG.md` — *"Snapshots now contain only the fields that render"* → *"Snapshots now
  leave that block out, which for an ability roughly halves what gets pasted."* Bullet title
  retitled *"Snapshots no longer paste a duplicate you can't edit"*. The measured "roughly
  halves for an ability" claim is retained — it is the one that verified (ratio 0.45).

### M3 — `metadata` described accurately ✅

The docs no longer call it "bookkeeping about where an entry came from" (the `{scc, source}`
half, worth ~5%). They now say that for an ability the block **repeated most of the entry a
second time — its name, its effects, its flavor text, its action type** — and that the card
was always built from the real fields, which is what made editing the copy a trap rather than
mere bulk. Spelling normalized to the repo's American `flavor`.

### L1 — orphan line reflowed ✅

The paragraph wraps cleanly at the file's ~90 columns; no mid-sentence stub line.

### M2 — the constant's comment names both survivors ✅

`compendiumInsert.ts:84-102` replaced *"`type` is the one constant"* with an explicit
two-bullet list, each with its reason, plus a pointer to the test that pins the set (so a
third excused key is a test failure, not a silent addition). It also records the detail that
is easy to get backwards, and which the original report stated imprecisely: **the SDK does
read `feature_type` when re-parsing** (`Feature.fromDTO` branches on
`ability`/`trait`/`subtrait`, falling back to shape-recomputation only when absent) — it is
the **card** that ignores it, because `renderFeature.actionTypeOf` calls
`config.feature.isTrait()`, which recomputes from shape.

### L3 — fidelity assertion adopted as a real test (+3) ✅

New `test.each(SNAPSHOT_CASES)` in the SC-165 describe block:
*"%s: the snapshot renders the same card as the synced block it was taken from"* — renders
`insertFullBlock`'s body and `extractDsBlockText(fixture)` through the real `ElementPipeline`
and asserts identical innerHTML. Passes byte-identically for all three families.

**Can-fail proven, and it demonstrates the gap it was added to close.** Temporarily adding
`flavor` (a live field the DTOs emit) to `RENDER_INERT_SNAPSHOT_KEYS`:

- the **feature** and **featureblock** fidelity tests go **red** (statblock's `goblin-stinker`
  fixture has no top-level `flavor`, so it correctly stays green — 2 failures, not 3);
- **the delete sweep notices nothing.** Once `flavor` is stripped it never appears in
  `Object.keys(parsed)`, so there is no key for the sweep to try. That is precisely the
  never-emitted-field hole L3 identified, reproduced live.

Probe reverted; `RENDER_INERT_SNAPSHOT_KEYS` verified back to `['metadata']` and the suite
re-run green (95/95) after the restore.

## Battery re-run at `c39cf4f`

Per the coordinator's instruction: **jest + tsc + lint only.**

| Gate | At `56a7e20` | **At `c39cf4f`** | |
|---|---|---|---|
| `npm run tsc` | clean | **clean, exit 0** | ✅ |
| `npm run lint` | clean | **clean, exit 0** (only the pre-existing `.eslintignore` deprecation warning) | ✅ |
| `npx jest` | 2714 + 1 skip / 165 suites | **2717 passed + 1 skipped / 2718 total, 165 suites passed of 166 (1 skipped), 3 snapshots**, exit 0 | ✅ **+3 = exactly the new fidelity tests** |

**Shots / freeze / parity deliberately NOT re-run, and unmoved.** No CSS, token, fixture,
harness or view file was touched: the diff is `CHANGELOG.md`, `docs/writing-blocks.md`, a
comment-only edit inside `src/authoring/compendiumInsert.ts`, and three test cases in
`test/dom/authoring/compendiumSearchModal.test.ts`. Nothing in that set can move a rendered
pixel, a captured PNG, or a sampled CSS property. The `56a7e20` measurements stand: shots
203 ok / 0 FAIL, `freeze OK (67/67 steel-print PNGs byte-identical)`, parity
`0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`.

**One flake worth recording (not a regression).** The first post-fix `npx jest` reported 5
failures in `test/dom/views/settings-tab.test.ts` and `settings-preview.test.ts` — all
`Exceeded timeout of 5000 ms`, none in a file this branch touches, with the whole run taking
205 s against an 82 s baseline while leftover headless-Chrome processes were saturating the
CPU. An immediate clean re-run of the identical tree was fully green in 96 s. These two
suites are load-sensitive at the default 5 s timeout; a red run there wants a re-run before
it is believed.

## State

Superproject pointer left unstaged, as for `56a7e20`. Worktree clean at **`c39cf4f`**
(`git status --porcelain` empty). Shared freeze baseline untouched (67 lines). Main checkout
never written to. Display `:1` not used.
