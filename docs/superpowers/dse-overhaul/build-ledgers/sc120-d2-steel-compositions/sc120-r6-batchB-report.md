# SC-120 §D2 Batch B — implementation report

Worktree: `/home/scott/code/steelCompendium/worktrees/sc120-d2-steel-compositions/draw-steel-elements`
Branch: `sc120-d2-steel-compositions`.

## Step 1 — rebase result

Rebased cleanly onto `origin/develop` tip `c09cf6f` (SC-205), zero conflicts. The rewritten
stack (same six commits, no squash/reorder):

```
68c63b3  SC-120 Batch C: Steel compositions for ancestry/perk/condition/rule
4931710  SC-120 Batch C fix round: round-3 review findings (owner rulings 10-13)
877575d  SC-120 Batch A: Steel compositions for class/career + shared primitive work
875a3cb  SC-120 Batch A fix round: round-5 review findings (owner ruling 16)
d84b01d  SC-120 Batch A fix round 2: adopt MED-2's rightPrimary addendum (owner ruling 17)
05a09d7  SC-120 Batch A fix round 3: languageCount emits the numeral (owner ruling 18)
```

`package.json`/`package-lock.json` unchanged between the old base (`16e25ff`) and the new
base (`c09cf6f`) — `npm ci` not needed.

### Post-rebase baseline battery (BEFORE any Batch B edit)

| Gate | Result |
|---|---|
| `npm run tsc` | exit 0, no output |
| `npm run lint` | exit 0, no output (only the pre-existing `.eslintignore` notice) |
| `npx jest` (after `rm -f main.js styles.css`) | Suites: 188 passed + 1 skipped / 189; Tests: **3321 passed + 1 skipped / 3322** |
| `npm run shots` | 474 shot lines, 0 FAIL; host-copy pin OK; button host-leak OK (111×3=666); print-twin parity OK (118 ids) |
| freeze check | **exactly 14 mismatches**: `{class,career,ancestry,condition,perk,perk-narrow,rule}--steel-{print,realprint}`; `kit`/`kit-collapsed` pairs `: OK` |
| `npm run parity` (LAST) | exit 0, 0 gap(s), 0 undeclared warning(s), 16 declared deferral(s) |

**One deviation from the brief's predicted baseline, diagnosed and attributable to SC-205:**
jest was 3321 passed (not the brief's predicted 3320), +1 test vs the pre-rebase Batch A
number. Root cause confirmed by `git diff --stat 16e25ff..c09cf6f -- test/`: SC-205 DID add
one test file, `test/dom/elements/staminaRecoveries.test.ts` (+30 lines) — the brief's "SC-205
added no jest tests" was inaccurate for this specific case (it was true for the *earlier*
SC-205 rounds cited in dse-verify's numbers table, but round 5 added this one). Suite count
(189 total, 188 passed + 1 skipped) matched exactly. Not a red flag — attributed and moved on.

## Scope implemented

Design doc `sc120-r1-design.md` §3.3 (treasure), §3.4 (complication), §3.5 (title), §3.6
(culture), §5.2 (`stripLabeledLines`), owner rulings 1/3/5/8/14/15-18 (ledger). Base
(non-steel/legacy) render branch and out-of-scope families untouched; no new CSS (design
doc's own prediction for Batch B — confirmed true).

## Files touched

- `src/elements/shared/CardLayout.ts` — `stripLabeledLines(md, labels)` extracted as the
  shared generalization of Batch A's `stripCareerBodyLabels` label-matching core (design
  §5.2, consolidating rather than duplicating the colon-mandatory bold-run regex per the
  brief); `SteelCardComposition<M>` gains an optional `rightEyebrow` closure, wired into
  `renderSteel()`'s `cardHead()` call (additive — every existing composition that omits it
  renders byte-identical to before, proven by the freeze check: none of the seven prior
  families' hashes moved).
- `src/elements/display/layouts.ts` — `treasureLayout.steel`, `titleLayout.steel`,
  `complicationLayout.steel`, `cultureLayout.steel` added; new `bodyLabeledLine()` helper
  (culture's Skill Options body fallback, ports the site's `bodyLabeledLine` exactly);
  `stripCareerBodyLabels` refactored into a thin wrapper over the shared
  `stripLabeledLines` plus a small private `stripCareerLeadIn()` pass (career's own
  non-bold-led lead-in sentence, orthogonal to the shared label-matching concern) —
  verified behavior-identical to the pre-refactor single merged pass (career's own jest
  suite, unchanged, all green).
- `test/unit/kit/crestIconValidity.test.ts` — tightened per owner ruling 14: `resolves()`
  now checks Lucide's canonical PER-ICON FILE existence
  (`node_modules/lucide/dist/esm/icons/<id>.mjs`) instead of the PascalCase package export
  table, which keeps deprecated aliases resolving identically to their canonical icon
  (verified directly against the installed `lucide@1.24.0`: `octagon-alert.mjs` exists,
  `alert-octagon.mjs` does not — `iconsAndAliases.mjs` re-exports the alias from the
  canonical file). Added the four Batch B layouts to `STEEL_LAYOUTS` and a new regression
  test proving `octagon-alert` resolves while `alert-octagon` now correctly fails.
- `test/dom/elements/displaySteelBatchB.test.ts` (new) — end-to-end DOM coverage per
  family (cardHead crest/eyebrow/rightEyebrow, band presence/order, hybrid-mode) plus a
  `direct: bands()` closure section per family, including three tests that feed VERBATIM
  real corpus body text (`v2/docs/Browse/{treasure,title,complication}/**` in this
  worktree) through synthetic SDK models to prove the full composition (bands + body
  strip together) against real data shapes, not just hand-written approximations.
- `test/unit/elements/cardLayoutHelpers.test.ts` — new `stripLabeledLines`/
  `bodyLabeledLine` unit coverage: link-text matching (single link and a bold run
  spanning two adjacent links), the mandatory colon and indented-continuation-line
  mitigations (inherited from Batch A, re-verified against the generalized function),
  the following-paragraph/table survival guarantee, plus four tests against VERBATIM
  bodies copied from `v2/docs/Browse/treasure/3rd-echelon/trinket/bracers-of-strife.md`,
  `treasure/leveled/armor/grand-scarab.md`, `title/marshal.md`, `complication/wodewalker.md`,
  and `culture/bureaucratic.md`.
- `test/dom/elements/displayFamily.test.ts` — steel-less clones
  (`baseTreasureLayout`/`baseTitleLayout`/`baseComplicationLayout`/`baseCultureLayout` +
  their elements) added, same SC-144 convention Batch A/C used; the four pre-existing
  base-branch DOM assertions (treasure/culture/title/complication inline
  title/badges/rows/flavor/body) repointed at the clones; the `ds-treasure: full scc.v1:
  code and bare slug` by-SCC test's title assertion switched from direct
  `.dse-card__title` to `cardTitleText()` (which already handles either branch — same fix
  Batch C applied to condition's equivalent test). The pre-existing "exactly once"
  duplicate-guard tests for culture/complication/title/treasure and the `ALL_TEN` table
  were confirmed to need NO changes (they either use `cardTitleText()` already or assert
  on text-occurrence counts, not base-branch-specific DOM structure) — verified by running
  the full suite, not assumed.
- `test/dom/elements/kitSteel.test.ts` — the "kit's composition never leaks into a sibling
  family" cross-check's example (`cultureElement`, Batch C's swap-in after condition
  stopped qualifying) itself gained a Steel composition this batch, so it too stopped
  being a "no composition at all" witness; added a local steel-less clone of
  `cultureLayout` (module-private to this file, same convention) and repointed the test
  at it — this is now the LAST family that ever needed this treatment, since all eleven
  display families carry a Steel composition after this batch.

## Design decisions / deviations from the design doc (flagged explicitly)

1. **Treasure eyebrow's "Level N" suffix uses `m.level` only, not `m.echelon`, and the
   live `echelon` field (77/127 populated) has NO home anywhere in the Steel
   composition.** The design doc's own wording is ambiguous here ("Where m.level/m.echelon
   exist, append: `${type} · Level ${level}`" — naming both fields but only one template),
   and cross-checking the ported site source (`steel-etl/internal/site/cards.go`'s
   `treasureCard`) shows the site's own tile type-label carries NEITHER suffix at all —
   the doc's "Level N" append is a plugin-only enhancement beyond the site, motivated by
   "today's `subtitle` field does this" (the pre-existing `subtitle`, which
   `renderSteel()` ignores, computes the SAME thing using only `m.level`). I implemented
   the doc literally (only `m.level`, which is 0/127 in the real corpus — dead today, like
   several other "declared prophylactically" fields this file already carries). **The
   consequence: the base/legacy branch's "Echelon N" badge (echelon IS live, 77/127) has
   no Steel-composition equivalent.** This is a real information gap on the Steel branch
   specifically, carried forward from an ambiguity in the design doc rather than
   introduced by a unilateral choice — flagging prominently for the evidence round. A
   plausible fix, if Scott wants it: add `rightEyebrow` as `m.echelon ? \`Echelon
   ${m.echelon}\` : m.rarity` (rarity is currently the sole `rightEyebrow` consumer and is
   ALSO 0/127 today, so the two would never collide in the current corpus) — not
   implemented, since the doc didn't ask for it and it's a judgment call belonging to the
   evidence round, not a worker unilateral addition.
2. **`bodyLabeledLine` added as a new export** (layouts.ts) — the design doc names it by
   this exact function name (§3.6, porting the site's `bodyLabeledLine`) but doesn't
   appear anywhere in Batch A/C's prior work, so this is a clean new addition, not a
   generalization of anything pre-existing.
3. **Did NOT edit `treasure/example.yaml` or its by-SCC md-dse fixture** (both predate this
   batch) to add the `item_prerequisite`/`project_source` (example.yaml) or
   `item_prerequisite`/`project_source`/`level_effects` (the md-dse fixture) frontmatter
   fields that are present in `content`/body text but missing as top-level model fields —
   verified this gap is real by diffing against real corpus files
   (`v2/docs/Browse/treasure/**`), which always carry both consistently. Editing either
   fixture would have required updating other pre-existing tests that pin exact-match
   values against them (`test/dom/framework/chromeRollout.test.ts`'s summary-line table,
   the ALL_TEN ref-title table, the legacy row's exact-match `Project` value) for an
   unrelated-to-Batch-B risk/reward that wasn't worth it. Prerequisite/Source/
   leveled-effects band behavior — including the "no double-render" property the ticket
   itself is about — is instead proven via direct `bands()`-closure tests using synthetic
   models built from VERBATIM real corpus text (see the grand-scarab.md test in
   `displaySteelBatchB.test.ts`). Flagging so the ticket-owner can judge whether the
   fixture gap itself is worth a small separate follow-up (it predates this batch and
   isn't a regression).
4. **No CSS changes** — the design doc predicted zero new CSS for Batch B and that held:
   the treasure Project tile row reuses `statTiles()`/`.dse-tiles` verbatim (no new
   column-count case beyond what Batch A's `--dse-tiles-n` generalization already
   supports — 2-up here), and the keyword-chip band reuses `.dse-card__badges`/
   `.dse-card__badge--keyword` verbatim (the SAME classes `renderBase()`'s badge row
   uses) rather than porting the site's separate `.sc-card__tags`/`.sc-tag` grammar.
   **The dark-mode material rule was never triggered** — no sunken surface was added by
   this batch.

## Crest-icon-validity tightening (ruling 14)

- **Tightened resolution mechanism**: `resolves(kebabId)` now checks
  `fs.existsSync(node_modules/lucide/dist/esm/icons/<kebabId>.mjs)` instead of
  `toPascalCase(kebabId) in lucide` (the old export-table lookup). Verified directly
  against the installed `lucide@1.24.0`: `iconsAndAliases.mjs` contains `export { default
  as AlertOctagon, default as OctagonAlert } from './icons/octagon-alert.mjs'` — both
  names resolve to the SAME icon under the old check, but only `octagon-alert.mjs` exists
  as its own file; `alert-octagon.mjs` does not.
- **No crest id changed.** All eleven crest ids in the tree (kit `backpack`, ancestry
  `users`, condition `zap`, perk `gem`, rule `book-open`, career `briefcase`, class
  `shield`, plus this batch's treasure `package`, title `crown`, complication
  `octagon-alert`, culture `map`) pass the tightened check — verified by
  `test/unit/kit/crestIconValidity.test.ts`'s full `STEEL_LAYOUTS` table run (all green)
  plus a direct filesystem probe during implementation. **Complication's `octagon-alert`
  is exactly the id ruling 14 named as "the id class this misses" — it is canonical, and
  the tightened test now also proves its would-be-passing alias `alert-octagon` fails.**

## Gates (devbox-wrapped, dse-verify order, all foreground)

| Gate | Result |
|---|---|
| `npm run tsc` | exit 0, no output — PASS |
| `npm run lint` | exit 0, no output (only the pre-existing `.eslintignore` notice) — PASS |
| `npx jest` (after `rm -f main.js styles.css`) | Suites: 189 passed + 1 skipped / 190; Tests: **3375 passed + 1 skipped / 3376** (base was 3321+1sk/3322 — +54 new tests: 33 in `displaySteelBatchB.test.ts`, 16 in `cardLayoutHelpers.test.ts`'s new describe blocks, 5 in the tightened `crestIconValidity.test.ts` [4 new STEEL_LAYOUTS entries + 1 regression proof]; 0 regressions) — PASS |
| `npm run shots` (run 1) | 474 shot lines, 0 FAIL; host-copy pin OK; button host-leak OK (111×3=666); print-twin parity OK (118 ids) — PASS |
| freeze check (run 1) | **24 mismatches** — see below for the deviation-from-brief explanation; `kit`/`kit-collapsed` pairs still `: OK` — PASS (expected violation) |
| `npm run shots` (run 2, determinism) | 474 shot lines, 0 FAIL — PASS |
| freeze check (run 2) | identical 24-name mismatch set — PASS |
| determinism | all 24 mismatch-set hashes byte-identical between the two shots runs (diff empty); `complication`/`complication-edit-btn` twin pairs also byte-identical to each other (see below) — PASS |
| `npm run parity` (LAST) | exit 0, **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)** — identical to the post-rebase baseline — PASS |

### Freeze check — deviation from the brief's "exactly 22" expectation

Result: **24 mismatches, not 22** — the prior 14 (`{ancestry,career,class,condition,perk,
perk-narrow,rule}--steel-{print,realprint}`, all byte-identical to the pre-Batch-B values,
confirmed by direct comparison) + the expected 8 new family pairs
(`{treasure,title,complication,culture}--steel-{print,realprint}`) + **2 unanticipated
lines**: `complication-edit-btn--steel-{print,realprint}.png`.

**Diagnosed, not assumed — same class of surprise as Batch C's `perk-narrow` discovery.**
`visual-harness/entry.ts`'s `INTERACTION_SHOTS`-adjacent fixture-variant list carries
`{ id: 'complication-edit-btn', element: 'complication', fixture: 'default', prefs: {
authoringControls: 'true' } }` (added for the SC-145 edit-button placement work) — a SECOND
frozen fixture of the SAME `complicationLayout`, at a different pref, already present in the
baseline (`complication-edit-btn--steel-print.png`/`--steel-realprint.png` were in the
66-name freeze-baseline file before this batch touched anything). Since it renders through
the identical `complicationLayout` this batch gives a Steel composition, its bytes legitimately
move too — not a leak into an unrelated family. Verified: `complication--steel-print.png` and
`complication-edit-btn--steel-print.png` hash to the EXACT SAME bytes
(`325df3f9...083efc6`) in both shots runs — expected, since the authoring pencil chrome the
`authoringControls` pref adds is screen-only (print-suppressed by the SC-169 chrome
contract), so the two fixtures' PRINT output is identical even though their SCREEN shots
differ. Full mismatch list (identical across both runs):

```
ancestry--steel-print.png            career--steel-print.png
ancestry--steel-realprint.png        career--steel-realprint.png
class--steel-print.png               complication--steel-print.png
class--steel-realprint.png           complication--steel-realprint.png
complication-edit-btn--steel-print.png       condition--steel-print.png
complication-edit-btn--steel-realprint.png   condition--steel-realprint.png
culture--steel-print.png             perk--steel-print.png
culture--steel-realprint.png         perk--steel-realprint.png
perk-narrow--steel-print.png         rule--steel-print.png
perk-narrow--steel-realprint.png     rule--steel-realprint.png
title--steel-print.png               treasure--steel-print.png
title--steel-realprint.png           treasure--steel-realprint.png
```

## The 24 hashes (both shots runs, byte-identical; final official run confirmed a third time)

```
9c775a76d05fe222de3484e0e34a97d61e70fce2abe28d047f2107e48b7d8e1a  treasure--steel-print.png
9c775a76d05fe222de3484e0e34a97d61e70fce2abe28d047f2107e48b7d8e1a  treasure--steel-realprint.png
8c701e289ef91b5ee6a89814d5427bceaf97ef9d1f6190fcff7f502575398fa0  title--steel-print.png
8c701e289ef91b5ee6a89814d5427bceaf97ef9d1f6190fcff7f502575398fa0  title--steel-realprint.png
325df3f94e99d36475717a9fe9c4ace538b2bc4e4d4d13b97f8ae4072083efc6  complication--steel-print.png
325df3f94e99d36475717a9fe9c4ace538b2bc4e4d4d13b97f8ae4072083efc6  complication--steel-realprint.png
325df3f94e99d36475717a9fe9c4ace538b2bc4e4d4d13b97f8ae4072083efc6  complication-edit-btn--steel-print.png
325df3f94e99d36475717a9fe9c4ace538b2bc4e4d4d13b97f8ae4072083efc6  complication-edit-btn--steel-realprint.png
4dc71e9191544262fa963c8b0744c1ea20b96a3716cf311ac3a8b0dec5fc6ede  culture--steel-print.png
4dc71e9191544262fa963c8b0744c1ea20b96a3716cf311ac3a8b0dec5fc6ede  culture--steel-realprint.png
b25047cdf7d1a682d84ff91d94d595e997f4b2231692c0909567ca23d7adee65  ancestry--steel-print.png
b25047cdf7d1a682d84ff91d94d595e997f4b2231692c0909567ca23d7adee65  ancestry--steel-realprint.png
681db993e956307c4da5205c51b91044364b1c970b5f7f1bcaf9166b031d345d  career--steel-print.png
681db993e956307c4da5205c51b91044364b1c970b5f7f1bcaf9166b031d345d  career--steel-realprint.png
dd9650e6ed254b782ceb4deb653cb327f5c59fbd35c4dbd488bfe5607365f872  class--steel-print.png
dd9650e6ed254b782ceb4deb653cb327f5c59fbd35c4dbd488bfe5607365f872  class--steel-realprint.png
63531ab624422b7f06bc865bc160a111be44a674a88e47abd00e7a9f0aeab2e2  condition--steel-print.png
63531ab624422b7f06bc865bc160a111be44a674a88e47abd00e7a9f0aeab2e2  condition--steel-realprint.png
1d0186e12e1443294b23535a34887b141ca3fd2363bfee04752b84e02097eeed  perk--steel-print.png
1d0186e12e1443294b23535a34887b141ca3fd2363bfee04752b84e02097eeed  perk--steel-realprint.png
16e516faee76a315fafc8d91841739fcc1ca461803510aeec7ab0ba87a02bfa8  perk-narrow--steel-print.png
16e516faee76a315fafc8d91841739fcc1ca461803510aeec7ab0ba87a02bfa8  perk-narrow--steel-realprint.png
bcda9977c98356bc94a461e8d4719367aafd51986d11ec9a21e84d32d599e82b  rule--steel-print.png
bcda9977c98356bc94a461e8d4719367aafd51986d11ec9a21e84d32d599e82b  rule--steel-realprint.png
```

**8 NEW pairs, moving for the first time this effort**: `treasure`, `title`,
`complication`, `complication-edit-btn`, `culture` — "before" is the shared baseline hash
(all five were `: OK` against `freeze-baseline.sha256` before this batch; `complication`/
`complication-edit-btn` are two names sharing one baseline hash pre-batch too, since both
were base-branch renders of the same content before this composition existed).
`complication-edit-btn`'s post-batch hash equals `complication`'s post-batch hash (both
`325df3f9...`), confirming the authoring-pencil pref is genuinely print-inert.

**16 UNCHANGED pairs** (`ancestry`, `career`, `class`, `condition`, `perk`, `perk-narrow`,
`rule` × print+realprint = 14, plus verifying none of Batch A/C's own hashes moved):
byte-identical to the values recorded in `sc120-r4-batchA-report.md`'s fix-round-3 section
(`eadacc7`) — confirmed by direct diff, not by assumption.

## Determinism evidence

- Two full `npm run shots` runs (plus a third "official" final-battery run) produced
  IDENTICAL bytes for all 24 mismatch-set files — `diff` of the sha256 dumps is empty
  across all three runs.
- Twin invariant holds: every `--steel-print.png`/`--steel-realprint.png` pair in the
  24-line set shares one hash, confirmed each run.
- `npm run shots`'s own in-run assertions (host-copy pin OK, button host-leak OK 111×3,
  print-twin parity OK 118/118, nested-corner-radius OK) held on every run.

## Evidence files (ledger dir, `sc120-` prefix)

- `sc120-after-treasure--steel-dark.png`, `sc120-after-treasure--steel-print.png`
- `sc120-after-title--steel-dark.png`, `sc120-after-title--steel-print.png`
- `sc120-after-complication--steel-dark.png`, `sc120-after-complication--steel-print.png`
- `sc120-after-culture--steel-dark.png`, `sc120-after-culture--steel-print.png`

All 8 requested files, no others written; all under
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc120-d2-steel-compositions/`.
Eyeballed all four dark shots directly: crest/eyebrow/bands render exactly as designed —
treasure shows the package crest, "Trinket" eyebrow, keyword chips, Project tile (150 /
Reason or Intuition), Effect band, then the flavor + "Additionally, ..." rider in the
trailing body (flavor appears exactly once, via body, not as its own suppressed-but-still-
occupying-space band); title shows the crown crest, "Echelon 3" eyebrow, Prerequisite/
Effect bands, then the flavor line in the trailing body; complication shows the
octagon-alert crest, "Complication" eyebrow, Benefit/Drawback bands, then the flavor in the
trailing body; culture shows the map crest, "Culture" eyebrow, the Skill Options band
(Quick Build parenthetical intact), then the description in the trailing body. No dark-mode
material-rule concern (no sunken surface introduced by this batch).

## Out of scope, confirmed untouched

- `languageCount`'s ruling-18 numeral change — left as-is per the brief; not reviewed here
  (that review is the ticket-owner's job, not this worker's).
- The freeze baseline file itself (`freeze-baseline.sha256`) and
  `.superpowers/sdd/freeze-baseline.sha256` — never edited.
- No `rebaseline.txt` written (per instructions — this round's ledger-dir writes are the
  evidence PNGs only, all `sc120-`-prefixed).
- Superproject pointer — not touched (`git status` in the superproject shows only the
  submodule's HEAD having moved, no staged/committed pointer bump).
- No tag created on `draw-steel-elements` (standing order).

## Commit

`3ab9d45` on branch `sc120-d2-steel-compositions`, inside `draw-steel-elements/` only.
Not pushed (`git log @{u}` reports no upstream configured for this branch). No
Co-Authored-By / AI attribution trailers. Working tree verified clean after commit
(`git status` → "nothing to commit, working tree clean").

`git show --stat 3ab9d45`: 7 files changed (`src/elements/shared/CardLayout.ts`,
`src/elements/display/layouts.ts`, `test/unit/kit/crestIconValidity.test.ts`,
`test/dom/elements/displaySteelBatchB.test.ts` [new], `test/unit/elements/
cardLayoutHelpers.test.ts`, `test/dom/elements/displayFamily.test.ts`,
`test/dom/elements/kitSteel.test.ts`) — no CSS file touched, no unrelated family's
composition touched (`git diff` confirms zero edits under `kitLayout`/`ancestryLayout`/
`conditionLayout`/`perkLayout`/`careerLayout`/`classLayout`/`genericLayout` beyond the
`stripCareerBodyLabels` refactor, which is behavior-preserving and re-verified green).

# FIX ROUND 1 (owner ruling 19 — treasure eyebrow prefers echelon)

Base: `3ab9d45` (Batch B implementation, above). New commit: `a78845a`, branch
`sc120-d2-steel-compositions`, `draw-steel-elements/` only.

## The change

`treasureLayout.steel.eyebrow` (`src/elements/display/layouts.ts`) previously appended
`` `· Level ${m.level}` `` only, per the design doc's literal string — dead corpus-wide
(0/127) while `m.echelon` (77/127 populated) had no home on the Steel branch at all (the
base/legacy branch shows it as an "Echelon N" badge). Per owner ruling 19, the eyebrow now
prefers echelon over level:

```ts
eyebrow: (m) => {
	const type = titleCase(m.treasure_type ?? '') || 'Treasure';
	if (m.echelon) return `${type} · Echelon ${m.echelon}`;
	if (m.level != null) return `${type} · Level ${m.level}`;
	return type;
},
```

Matches `titleLayout.steel.eyebrow`'s existing echelon-eyebrow grammar
(`m.echelon ? \`Echelon ${m.echelon}\` : 'Title'`) and the design doc's own stated intent
("Where `m.level`/`m.echelon` exist"). No other line in `layouts.ts` touched; `crestIcon`
and `rightEyebrow` (rarity) unchanged; base (non-steel) render branch untouched (it already
shows `m.echelon` via its own `badges` field, unaffected by this eyebrow closure).

## Tests added/updated

Both in `test/dom/elements/displaySteelBatchB.test.ts`, no new test files:

- **`direct: bands() closure` → eyebrow test** (unit-level, direct call on
  `treasureLayout.steel!.eyebrow`): extended to cover all three cases named in the brief —
  bare type (neither echelon nor level), level-only (`Armor · Level 5`), and echelon-present
  (`Armor · Echelon 3`, including a case where BOTH `echelon` and `level` are set, proving
  echelon wins over level rather than merely being tried first when level is absent).
- **`cardHead` DOM test**: the plugin's own `treasure/example.yaml` fixture (used for the
  inline-render path) carries `echelon: "1"` and no `level` field — so this end-to-end test's
  expected eyebrow text changed from `'Trinket'` (the pre-fix behavior, since level was
  absent) to `'Trinket · Echelon 1'` (post-fix, since echelon is now preferred and present).
  Updated to assert the new text and renamed to describe owner ruling 19.

No other test in the suite referenced treasure's eyebrow text or the string `'Trinket'`
(verified by repo-wide grep before editing).

## Gates (devbox-wrapped, dse-verify order, all foreground)

| Gate | Result |
|---|---|
| `npm run tsc` | exit 0, no output — PASS |
| `npm run lint` | exit 0, no output (only the pre-existing `.eslintignore` notice) — PASS |
| `npx jest` (after `rm -f main.js styles.css`) | Suites: 189 passed + 1 skipped / 190; Tests: **3375 passed + 1 skipped / 3376** — identical to the pre-fix Batch B numbers (this round only edited assertions inside two EXISTING tests, added no new `test()` blocks) — PASS, 0 regressions |
| `npm run shots` (run 1) | 474 shot lines, 0 FAIL; host-copy pin OK; button host-leak OK (111×3=666); print-twin parity OK (118 ids) — PASS |
| freeze check (run 1) | **exactly 24 mismatches, same 24 NAMES as Batch B round 6** (no new names, none disappeared) — PASS (expected violation) |
| `npm run shots` (run 2, determinism) | 474 shot lines, 0 FAIL; all in-run assertions OK — PASS |
| freeze check (run 2) | identical 24-name mismatch set (`diff` of the two freeze-check outputs is empty) — PASS |
| determinism | all 24 mismatch-set hashes byte-identical between the two shots runs — PASS |
| `npm run parity` (LAST, re-run with an exit-code-capturing wrapper) | exit 0, **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)** — identical to Batch B round 6 — PASS |

## The treasure pair: round-6 vs now

The harness's treasure fixture (`src/elements/display/treasure/example.yaml`, imported by
`visual-harness/entry.ts` as `treasure: { default: treasureDefault }`) carries
`echelon: "1"` and no `level` field. **Confirmed: it DOES carry echelon frontmatter**, so
its Steel-composition shot now shows "· Echelon 1" where it previously showed nothing
(level was absent, so round 6's eyebrow read bare `"Trinket"` with no suffix at all — the
design doc's literal string never actually fired on this fixture either). The pair's hash
therefore moves:

| | round 6 (`3ab9d45`) | now (`a78845a`) |
|---|---|---|
| `treasure--steel-print.png` | `9c775a76d05fe222de3484e0e34a97d61e70fce2abe28d047f2107e48b7d8e1a` | `395c8bdf98497f1decb0ecbffd25aeec9dbb3b83680357668996ab61d95dd08f` |
| `treasure--steel-realprint.png` | `9c775a76d05fe222de3484e0e34a97d61e70fce2abe28d047f2107e48b7d8e1a` | `395c8bdf98497f1decb0ecbffd25aeec9dbb3b83680357668996ab61d95dd08f` |

Twin invariant holds (print == realprint) both before and after. **All other 22 of the
24 mismatch-set hashes are byte-identical to round 6's recorded values** (ancestry, career,
class, complication, complication-edit-btn, condition, culture, perk, perk-narrow, rule,
title × print+realprint) — verified by direct comparison, not assumption. `kit` and
`kit-collapsed` pairs remain `: OK` (untouched).

## Determinism evidence

Two full `npm run shots` runs produced byte-identical output for all 24 mismatch-set files
(`diff` of the two `check-freeze.sh` outputs is empty; direct `sha256sum` of
`treasure--steel-{print,realprint}.png`, `title--steel-print.png`, and
`complication--steel-print.png` cross-checked identical between the two runs). Twin
invariant (`--steel-print` hash == `--steel-realprint` hash) holds for every one of the 24
names in both runs.

## Evidence files

Treasure shot changed (echelon now renders), so both requested files were re-copied,
**overwriting only those two**, `sc120-` prefix preserved:

- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc120-d2-steel-compositions/sc120-after-treasure--steel-dark.png`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc120-d2-steel-compositions/sc120-after-treasure--steel-print.png`

Eyeballed the new dark shot directly: head now reads "◆ TRINKET · ECHELON 1 / COLOR CLOAK
(BLUE)" — crest, keyword chips, Project tile, Effect band, and trailing body all otherwise
unchanged from the round-6 evidence. No other evidence file touched.

## Out of scope, confirmed untouched

- Rulings 20/21 (freeze surprise set, treasure fixture frontmatter gaps) — not revisited;
  no fixture file edited.
- The base (non-steel) render branch — `treasureLayout`'s `badges`/`subtitle`/`rows` fields
  untouched; `git diff 3ab9d45..a78845a -- src/elements/display/layouts.ts` shows only the
  `steel.eyebrow` closure and its comment changed.
- `languageCount` and every other family's composition — untouched (`git diff --stat` shows
  only `layouts.ts` and `displaySteelBatchB.test.ts`).
- The shared freeze baseline (`freeze-baseline.sha256` / `.superpowers/sdd/freeze-baseline.sha256`)
  — never edited. No `rebaseline.txt` written.
- Superproject pointer — not staged/committed (`git status` in the superproject worktree
  shows only the submodule's HEAD having moved, same as every prior round).
- No tag created on `draw-steel-elements` (standing order).

## Commit

`a78845a` on branch `sc120-d2-steel-compositions`, inside `draw-steel-elements/` only, on
top of `3ab9d45`. 2 files changed (`src/elements/display/layouts.ts`,
`test/dom/elements/displaySteelBatchB.test.ts`), +28/-10 lines. No Co-Authored-By / AI
attribution trailers. Not pushed (no upstream configured for this branch). Working tree
verified clean after commit (`git status` → "nothing to commit, working tree clean").

# FIX ROUND 2 (owner rulings 22-24 — r7 review findings)

Base: `a78845a` (Batch B fix round 1, above). New commit: `6fb65b8`, branch
`sc120-d2-steel-compositions`, `draw-steel-elements/` only.

Scope: HIGH-1, HIGH-2, MED-1(a), LOW-1..4 from `sc120-r7-batchB-review.md`, governed
verbatim by owner rulings 22-24 (`decisions.md`). MED-1(b) (global flavor-band position)
and every INFO item are explicitly OUT of scope (deferred to SC-280 / no action).

## Per-finding disposition

**HIGH-1 + HIGH-2 (ruling 22, fixed together).** `stripLabeledLines`
(`src/elements/shared/CardLayout.ts:295-390`, formerly `:295-317`) rewritten:

- **(i) Band-gated (ruling 22(i)).** The function's contract is now explicit: callers pass
  ONLY the labels whose replacing band/value actually rendered. Every call site updated to
  build its `labels` array conditionally instead of a fixed per-family list:
  - `treasureLayout.steel.bands` (`layouts.ts:492-620`): `'Keywords'` gated on
    `keywords.length`, `'Item Prerequisite'` on `prereq`, `'Project Source'` on
    `projectSource`, `'Project Roll Characteristic'` on `rollChar`, `'Project Goal'` on
    `goal`, and the per-tier `` `${key} Level` `` labels gated on `presentLevelKeys` (only
    keys whose value actually got a band pushed, not every key the model happens to
    declare). `'Effect'` is no longer in this list at all — see MED-1(a) below.
  - `titleLayout.steel.bands` (`layouts.ts:1130-1173`): `'Echelon'` gated on `m.echelon`
    (the surface its value moved to — the eyebrow, not a band), `'Prerequisite'`/`'Effect'`
    gated on their own fields.
  - `complicationLayout.steel.bands` (`layouts.ts:1290-1310`): `'Benefit'`/`'Drawback'`
    gated on their own fields.
  - `cultureLayout.steel.bands` (`layouts.ts:780-790`): `'Skill Options'` gated on
    `skillOptionsText` (closes a theoretical gap — the band is already SOURCED from the
    same body line via `bodyLabeledLine` when structured fields are absent, so this was
    self-consistent already; gating makes it explicit rather than incidental).
  - Career's `stripCareerBodyLabels`/`CAREER_BODY_LABELS` (`layouts.ts`) is UNCHANGED —
    out of scope per the brief (its six labels are all band-gated-true in the harness
    fixture and its lines are single-label, so the shared helper's rework alone was
    sufficient; verified byte-identical via the freeze check below).
- **(ii) Segment-aware (ruling 22(ii)), plus first-occurrence-only (an extension of ruling
  22(iii)).** `stripLabeledLines` no longer drops a whole matched line. It splits the line
  into every bold-labeled segment (`LABELED_SEGMENT_RE`, a global sibling of the existing
  `LABELED_LINE_RE`) and drops ONLY the segment(s) whose own label is wanted — every other
  segment on the same physical line (an unrelated second bold-labeled paragraph sharing the
  line) survives verbatim, concatenated back together. Additionally, each wanted label is
  consumed at most ONCE across the whole document (a `consumed` set) — a REPEAT of the same
  label further down (real corpus shape: `portable-cloud.md` carries three
  `**[Item Prerequisite](…):**` lines for three distinct treasure variants) is a different
  value with nothing structural covering it, so the repeat survives whole rather than being
  deleted for merely sharing a label with the first occurrence. Still no value comparison
  (ruling 22(ii)'s stated simplification) — this tracks occurrence COUNT, never text
  content. New exported helper `matchLabeledLine(line)` (`CardLayout.ts:298-302`) factors out
  the single-line "does this raw line begin with a labeled bold run, and which label" test,
  shared by `stripLabeledLines` and treasure's rider-absorption helper (below).
- **(v) Real-corpus probe re-run.** See "Corpus probe results" below.

**MED-1(a) (ruling 23(a), treasure-only — Effect rider absorption).** New private helper
`extractLabeledLineAndRider(md, label)` (`layouts.ts`, above `treasureLayout`): when the
Effect band renders (`m.effect` present), it locates the body's own `**Effect:**` line,
removes it plus a single following blank line, THEN additionally captures every
immediately-following line — up to (not including) the next labeled line, a markdown
heading, or the end of the body — as the "rider" (the "Additionally, …" paragraph(s)), and
removes the rider from the returned body too. The Effect band's rendered content becomes
`[m.effect, rider].filter(Boolean).join('\n\n')` — effect and rider now render together,
inside the band, immediately adjacent, instead of the rider surviving alone in the trailing
body separated from its referent by other bands. If the Effect band does NOT render (field
absent), `bodyForStrip` stays the untouched `bodyMd` and the line + rider stay in the body
untouched (ruling 23(a)'s explicit fallback) — `'Effect'` is simply never in the gated
`labels` list in that branch. Title/complication were NOT given this treatment (ruling
23(a) scoped the rider absorption to treasure only) — verified their existing "bullet-list
benefits survive as a separate body paragraph" tests (marshal.md) still pass unchanged.

**LOW-1 (`bodyLabeledLine`/`stripLabeledLines` indentation disagreement).**
`bodyLabeledLine` (`layouts.ts:162-179`) changed from `raw.trim().startsWith(prefix)` to
`raw.startsWith(prefix)` — the SAME column-0-only requirement `stripLabeledLines`/
`matchLabeledLine` already enforce, so an indented culture label (nested under a list item)
can no longer populate the band while the raw line survives untouched in the body (the two
helpers can no longer disagree into a double-render).

**LOW-2 (label-set normalization mismatch).** `stripLabeledLines`'s `wanted` set is now
built via `labels.map(l => normalizeForDuplicateCheck(l))` instead of a bare
`.toLowerCase()` — the SAME normalization the captured bold-run text goes through, so a
label carrying a markdown link/extra whitespace (treasure's data-derived per-tier labels,
`` `${key} Level` ``) can never silently fail to match itself.

**LOW-3 (orphaned label-only line).** No code change needed: the existing single-line-strip
behavior already produces duplication, not deletion, for this shape (`**Effect:**` alone
strips; the value paragraph below survives untouched, so the card shows the value twice
rather than losing it) — this is exactly ruling 22(iii)'s preferred failure mode. Pinned
with a dedicated regression test (`cardLayoutHelpers.test.ts`) per ruling 24's explicit
ask that the fix round cover it deliberately.

**LOW-4 (tests pinning corrected behavior).** New tests added (see "Tests added" below),
including a Thunderhead Cloud survival regression test at both the shared-helper level and
the full-composition level, per ruling 24's explicit ask.

## Tests added

`test/unit/elements/cardLayoutHelpers.test.ts` (new `describe` block "SC-120 Batch B fix
round 2 (owner rulings 22-24)", +6 tests) — HIGH-2 (unwanted label survives), HIGH-1
(segment-aware packed line), the full `portable-cloud.md` real-corpus regression (Thunderhead
Cloud survives, first-occurrence-only proven on all three Item Prerequisite lines), LOW-2
(normalized label matching), LOW-3 (orphaned label duplicates, never deletes); plus one
`bodyLabeledLine` LOW-1 test (indented label not matched).

`test/dom/elements/displaySteelBatchB.test.ts` (+4 tests, 1 test updated) — treasure's
existing Effect-rider test updated to assert the rider now renders INSIDE the Effect band
and is gone from the body (was: rider stayed in body); new HIGH-2 regression tests for
treasure/title/complication (a labeled body line whose model field is absent survives, no
band renders it); new full-composition `portable-cloud.md` regression test (Effect band
absorbs the "Enterprising mages…" rider; Noxious Cloud / Thunderhead Cloud / both secondary
Item Prerequisite occurrences all survive in the body).

## Gates (devbox-wrapped, dse-verify order, all foreground)

| Gate | Result |
|---|---|
| `npm run tsc` | exit 0, no output — PASS |
| `npm run lint` | exit 0, no output (only the pre-existing `.eslintignore` notice) — PASS |
| `npx jest` (after `rm -f main.js styles.css`) | Suites: 189 passed + 1 skipped / 190; Tests: **3385 passed + 1 skipped / 3386** (prior 3375+1sk/3376 — +10 new tests, 0 regressions) — PASS |
| `npm run shots` (run 1) | 474 shot lines, 0 FAIL — PASS |
| freeze check (run 1) | **exactly the same 24 mismatch NAMES as fix round 1** (no new, none disappeared) — PASS (expected violation) |
| `npm run shots` (run 2, determinism) | 474 shot lines, 0 FAIL — PASS |
| freeze check (run 2) | identical 24-name mismatch set (`diff` of the two freeze-check outputs is empty) — PASS |
| determinism | `treasure--steel-print.png` byte-identical between the two shots runs (direct file diff, empty) — PASS |
| `npm run parity` (LAST) | exit 0, **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)** — identical to fix round 1 — PASS |

## Per-family hash movement table

Only `treasure` moved. All 23 other names (`class`/`career` included) are byte-identical to
their fix-round-1 (`a78845a`) values — confirmed by direct `sha256sum` comparison, not
assumption.

| Family | print/realprint hash | Status |
|---|---|---|
| **treasure** | `395c8bdf98497f…` → `4d464d4260ce90…` | **MOVED** (Effect band now absorbs the rider; body-strip is band-gated + segment-aware) |
| title | `8c701e289ef918…` | unchanged |
| complication | `325df3f94e99d3…` | unchanged |
| complication-edit-btn | `325df3f94e99d3…` | unchanged |
| culture | `4dc71e919154426…` | unchanged |
| ancestry | `b25047cdf7d1a6…` | unchanged |
| **career** | `681db993e95630…` | **unchanged — ruling 22(iv) invariant HELD** |
| **class** | `dd9650e6ed254b…` | **unchanged — ruling 22(iv) invariant HELD** |
| condition | `63531ab624422b…` | unchanged |
| perk | `1d0186e12e1443…` | unchanged |
| perk-narrow | `16e516faee76a3…` | unchanged |
| rule | `bcda9977c98356…` | unchanged |

`treasure--steel-print.png` and `treasure--steel-realprint.png` share the new hash (twin
invariant holds). The harness's `treasure/example.yaml` fixture carries `effect` + a
one-paragraph "Additionally, when you are targeted…" rider directly under it with nothing
else following, so the shot now shows the rider rendered as part of the Effect band's own
text instead of as a separate italic-adjacent paragraph at the bottom of the card.

## Ruling 22(iv) invariant — explicitly verified

Class and career's `*--steel-{print,realprint}.png` hashes are byte-identical to their
recorded fix-round-1 values. Verified by direct `sha256sum` on the regenerated shots, not
assumed from "the code path wasn't touched" reasoning — the shared `stripLabeledLines`
helper both of them ride on (career directly; class doesn't call it at all, policy (A))
WAS rewritten this round, so this was a real can-fail check, not a formality.

## Corpus probe results (owner ruling 22(v))

Real-corpus probe re-run: a temporary jest file (deleted after use; `git status --porcelain`
verified empty afterward) built a real `Treasure`/`Title`/`Complication`/`Culture` model
from every real Browse file's frontmatter + body (excluding `index.md`) in
`v2/docs/Browse/{treasure,title,complication,culture}/**` (this worktree's superproject
checkout, one level up from `draw-steel-elements/`), called the ACTUAL production
`*Layout.steel!.bands()`/`.eyebrow()` closures (not a reimplementation), and verified every
real paragraph/segment in the source body is preserved SOMEWHERE in the rendered output
(a band's text, the eyebrow, or the trailing body) — link/emphasis/whitespace/casing
differences normalized via the same `normalizeForDuplicateCheck` the production code itself
uses, so the check isn't fooled by e.g. a `plainText()`'d tile value losing its markdown
brackets. Segment-level (not whole-paragraph) matching, so a packed line's surviving
"unwanted" segment is checked independently of its dropped "wanted" segment. Keyword chips
(rendered as separate, undelimited DOM spans) are checked token-by-token rather than as one
comma-joined string. Echelon (transformed to bare digits in the eyebrow, unchanged by this
fix round) is checked by leading-digit match, not substring.

| Family | files scanned | content deletions | new over-strips |
|---|---|---|---|
| treasure | 127 | **0** | **0** |
| title | 66 | **0** | **0** |
| complication | 100 | **0** | **0** |
| culture | 13 | **0** | **0** |
| **Total** | **306** | **0** | **0** |

**Thunderhead Cloud survives** (the HIGH-1 headline case): probed against
`v2/docs/Browse/treasure/1st-echelon/consumable/portable-cloud.md`. Its packed line —
`**[Item Prerequisite](…):** An ounce of undead flesh. **Thunderhead Cloud:** Small
lightning bolts arc around the black cloud in this sphere, which creates a 3 cube of cloud
and lightning when broken. Each creature who enters the cloud for the first time in a
combat round or starts their turn there takes 5 lightning damage. Additionally, any
creature is slowed while in the cloud.` — has its "Item Prerequisite" segment dropped (the
model's own first-occurrence value) while the "Thunderhead Cloud" segment survives whole,
verbatim, in the trailing body. The file's THIRD `**[Item Prerequisite](…):** A spool of
copper wire.` line (a second repeat of the same label, no packed second segment) also
survives whole, via first-occurrence-only — this is the file the r7 review's "both
secondary prerequisites" phrasing referred to, and both are now preserved, not just the
packed one. Directly asserted (not just probe-passed) in
`displaySteelBatchB.test.ts`'s new `portable-cloud.md` composition test and
`cardLayoutHelpers.test.ts`'s new corpus-regression unit test.

**Band-gating effect (count of lines now legitimately NOT stripped that previously were):
0 in the real generated corpus today.** Cross-checked frontmatter vs. body for every
labeled line across all 306 files (treasure's `item_prerequisite`/`project_source`/
`project_roll_characteristic`/`project_goal`/`effect`, title's `echelon`/`prerequisite`/
`effect`, complication's `benefit`/`drawback`) — every real generated file's model field is
populated whenever its corresponding body line exists, matching the r7 report's own finding
("Zero body-label-without-field cases in the generated corpus"). **The fix's HIGH-2 value is
therefore fixture/hand-authoring-reachable today, not corpus-reachable** — proven directly
via the plugin's own shipped `treasure/example.yaml`-shaped gap (frontmatter missing
`item_prerequisite`/`project_source` while the body carries both lines) in the new
composition-level regression tests, which assert the lines survive rather than vanish.

Probe script: `test/dom/tmp-sc120-r2-corpus-probe.test.ts`, deleted after use. `git status`
verified clean in `draw-steel-elements/` after deletion (only the four committed files show
in `git show --stat 6fb65b8`).

## Determinism evidence

Two full `npm run shots` runs produced byte-identical output for `treasure--steel-print.png`
(direct file diff, empty) and an identical freeze-check mismatch-name set (`diff` of the two
`check-freeze.sh` outputs is empty). Twin invariant (`--steel-print` hash ==
`--steel-realprint` hash) holds for `treasure` in both runs.

## Evidence files copied

Treasure's shot changed (Effect band now absorbs the rider), so both requested files were
re-copied, **overwriting only those two**, `sc120-` prefix preserved:

- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc120-d2-steel-compositions/sc120-after-treasure--steel-dark.png`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc120-d2-steel-compositions/sc120-after-treasure--steel-print.png`

No other evidence file touched (title/complication/culture hashes unchanged, so their
existing evidence files still reflect the current bytes).

## Out of scope, confirmed untouched

- MED-1(b) (global flavor-band position) — deferred to SC-280 per ruling 23(b); no dedup
  guard inverted, no flavor band moved.
- All seven r7 INFO items — no action.
- `languageCount`, crest ids, the kit composition, the base/legacy render branch, fixture
  yamls, Batch C families (ancestry/condition/perk/perk-narrow/rule) — all confirmed
  untouched (freeze hashes byte-identical; `git show --stat 6fb65b8` touches only
  `CardLayout.ts`, `layouts.ts`, and the two Batch-B test files).
- The shared freeze baseline (`freeze-baseline.sha256` /
  `.superpowers/sdd/freeze-baseline.sha256`) — never edited. No `rebaseline.txt` written.
- Superproject pointer — not staged/committed.
- No tag created on `draw-steel-elements` (standing order).

## Commit

`6fb65b8` on branch `sc120-d2-steel-compositions`, inside `draw-steel-elements/` only, on
top of `a78845a`. 4 files changed (`src/elements/shared/CardLayout.ts`,
`src/elements/display/layouts.ts`, `test/dom/elements/displaySteelBatchB.test.ts`,
`test/unit/elements/cardLayoutHelpers.test.ts`), 413 insertions / 47 deletions. No
Co-Authored-By / AI attribution trailers. Not pushed. Working tree verified clean after
commit (`git status` → "nothing to commit, working tree clean").

# FIX ROUND 3 (owner ruling 26 — career strip gating)

Base: `6fb65b8` (Batch B fix round 2, above). New commit: `ea786ed`, branch
`sc120-d2-steel-compositions`, `draw-steel-elements/` only.

Scope: the r7 delta re-review's carried MED ("Judgment call 2 — career latent shape"),
governed verbatim by owner ruling 26 (`decisions.md`). Nothing else touched.

## The code change

`src/elements/display/layouts.ts`:

- `CAREER_BODY_LABELS` (the old fixed 6-label constant, formerly line 840) is **removed**.
- `stripCareerBodyLabels(md: string, labels: string[])` (line 893) now takes the caller's
  already-band-gated `labels` array instead of reading a module-level constant.
- `careerLayout.steel.bands()`'s body-strip call site (around line 1003-1013, formerly the
  single line `stripCareerBodyLabels(bodyMd)`) now builds `labels` with the SAME
  `...(condition ? ['Label'] : [])` pattern the Batch B families
  (treasure/title/complication/culture) already use in this file:

  ```ts
  const labels = [
      ...(skillsText ? ['Skills'] : []),
      ...(m.language ? ['Languages'] : []),
      ...(m.renown != null ? ['Renown'] : []),
      ...(m.wealth ? ['Wealth'] : []),
      ...(perkText ? ['Perk'] : []),
      ...(m.project_points != null ? ['Project Points'] : []),
  ];
  const stripped = stripCareerBodyLabels(bodyMd, labels);
  ```

  `skillsText`/`perkText` are the SAME variables the Skills/Perk bands above already gate
  on (no new computation) — a label strips only when the surface that would structurally
  replace it actually rendered. Each Career Benefits tile label is gated on the exact
  model-field check the tile itself uses (`m.language`, `m.renown != null`, `m.wealth`,
  `m.project_points != null`), so a dash-filled tile (an absent field) can no longer
  delete a real body value (ruling 22(iii): duplication over deletion).
- `stripCareerLeadIn`/`CAREER_LEAD_IN_LINES` (the orphaned lead-in sentence strip) are
  UNTOUCHED — out of scope, ruling 26 is about the six labels only.

Nothing else in the file, no other family, no shared helper (`stripLabeledLines`,
`matchLabeledLine`, `extractLabeledLineAndRider` all unchanged), no CSS, no fixtures.

## Tests added

`test/dom/elements/displaySteelBatchA.test.ts`, inside the existing `describe('SC-120
Batch A: ds-career Steel composition')` block:

1. **Hand-authored-gap regression — Skills.** A `Career` with `content: '**Skills:**
   Criminal Underworld, Sneak'` and no `skills`/`skill_group`: the Skills band is absent
   from `bands()`, and the line survives verbatim in the trailing body band.
2. **Hand-authored-gap regression — Perk.** Same shape for `'**Perk:** Shadowmeld'` with
   no `perk`/`perk_group`: the Perk band is absent, and the line survives.
3. **Dash-fill case — Renown.** A `Career` with `content: '**Renown:** +1'` and no
   `m.renown`: the Career Benefits tile's Renown slot renders `—` (dash-filled, band still
   pushed unconditionally as designed) AND the body band still contains `+1` — duplication,
   never deletion.
4. **Populated harness-fixture shape.** Two parts in one test: (a) `renderInline()` against
   the real `career/example.yaml` fixture confirms Skills/Languages/Renown/Wealth/Perk
   still strip exactly as before the fix (no behavior change for the shipped fixture); (b) a
   direct-unit model with ALL SIX fields populated (`skills`, `language`, `renown`,
   `wealth`, `perk`, `project_points`) and a body carrying all six matching labels proves
   every one strips when its backing field is present — the sixth label (Project Points)
   has no coverage in the shipped fixture, so this closes that gap explicitly.

The pre-existing "artisan.md shape" direct-unit test (stripped body removes the Project
Points/Skills/Languages/Perk lines) is **updated**, not left as-is: that test's synthetic
`Career` model only ever set `name`/`content`, never the matching `skills`/`language`/
`perk`/`project_points` fields its body text implied — under the old unconditional strip
list this passed anyway, but it is exactly the r7 "Judgment call 2" gap in miniature. Fixed
by adding the four matching model fields so the test now exercises the intended "populated,
band-gated" path instead of accidentally exercising the bug being fixed.

All new/updated tests await every `render()` promise (per ruling 13/16's precedent).

## Gates (devbox-wrapped, dse-verify order, all foreground)

| Gate | Result |
|---|---|
| `npm run tsc` | exit 0, no output — PASS |
| `npm run lint` | exit 0, no output (only the pre-existing `.eslintignore` notice) — PASS |
| `npx jest` (after `rm -f main.js styles.css`) | Suites: 189 passed + 1 skipped / 190; Tests: **3389 passed + 1 skipped / 3390** (prior 3385+1sk/3386 — +4 new tests, 0 regressions) — PASS |
| `npm run shots` (run 1, fix applied) | 474 shot lines, 0 FAIL — PASS |
| freeze check (run 1) | **exactly the same 24 mismatch NAMES as fix round 2** (no new, none disappeared) — PASS (expected violation, unrebaselined by design) |
| `npm run shots` (run 2, determinism) | 474 shot lines, 0 FAIL — PASS |
| freeze check (run 2) | same 24 names, byte-identical to run 1 — PASS |
| `npm run parity` | **0 GAPs / 0 undeclared WARNs / 16 DECLARED / exit 0** — PASS |

`sha256sum -c` against the full 210-line shared baseline (not just the 24 grep): **186 OK +
24 FAILED + 0 missing = 210**, matching the pre-fix state exactly — no widening, no
narrowing, no new missing names.

## HARD GATE — byte-neutrality, explicitly verified (not assumed)

Verification method: `git stash` the fix, regenerate shots at base commit `6fb65b8`
(474 lines, 0 FAIL), hash all 24 mismatch-adjacent print/realprint files, `git stash pop`
to restore the fix, regenerate shots again (twice, for determinism), hash the same 24
files each time, and diff.

`diff <(base hashes) <(fix-run-1 hashes)` → **empty**. `diff <(base hashes) <(fix-run-2
hashes)` → **empty**. All three hash sets are byte-for-byte identical.

The career and class lines specifically (both under Scott's live Batch A sanction ask):

```
681db993e956307c4da5205c51b91044364b1c970b5f7f1bcaf9166b031d345d  career--steel-print.png
681db993e956307c4da5205c51b91044364b1c970b5f7f1bcaf9166b031d345d  career--steel-realprint.png
dd9650e6ed254b782ceb4deb653cb327f5c59fbd35c4dbd488bfe5607365f872  class--steel-print.png
dd9650e6ed254b782ceb4deb653cb327f5c59fbd35c4dbd488bfe5607365f872  class--steel-realprint.png
```

Both match the r6 fix-round-2 report's per-family hash table exactly (`681db993e95630…` /
`dd9650e6ed254b…`), confirmed here as FULL 64-hex-char sha256 digests, not just the
truncated prefixes recorded there. Career's own byte-neutrality claim (the fix's whole
premise, per the r7 delta re-reviewer's verification) holds: `career/example.yaml` never
moved a byte across this round.

All 24 names, confirmed unchanged (12 print/realprint pairs, twin==sibling within each
pair, as before): `ancestry`, `career`, `class`, `complication`, `complication-edit-btn`,
`condition`, `culture`, `perk`, `perk-narrow`, `rule`, `title`, `treasure`.

`kit--steel-{print,realprint}.png` and `kit-collapsed--steel-{print,realprint}.png`: still
`: OK` against the shared baseline (`sha256sum -c` on the full baseline file), confirming
no leak into the one family this effort must never touch.

**Verdict: the hard gate holds. Nothing was moved that ruling 26 didn't explicitly
authorize to survive unmoved.**

## Determinism evidence

Two independent `npm run shots` runs with the fix applied (`rm -f main.js styles.css`
before each): 474 lines / 0 FAIL both times; the 24-name freeze mismatch set identical
both times; the 24 files' sha256 hashes identical between the two runs (see HARD GATE
section above).

## Out of scope, confirmed untouched

- Every other family (ancestry/complication/complication-edit-btn/condition/culture/perk/
  perk-narrow/rule/title/treasure/class/kit/kit-collapsed) — confirmed byte-identical by
  the HARD GATE hash comparison above; `git show --stat ea786ed` touches only
  `src/elements/display/layouts.ts` and `test/dom/elements/displaySteelBatchA.test.ts`.
- `stripLabeledLines`, `matchLabeledLine`, `extractLabeledLineAndRider`,
  `normalizeForDuplicateCheck` (`CardLayout.ts`) — unchanged.
- `stripCareerLeadIn` / `CAREER_LEAD_IN_LINES` — unchanged.
- The base (non-steel) `careerLayout.rows` / legacy render path — unchanged.
- CSS — no `styles-source.css` edit.
- The shared freeze baseline — never edited. No `rebaseline.txt` written (byte-neutral
  change, nothing to rebaseline).
- Superproject pointer — not staged/committed.
- No tag created on `draw-steel-elements` (standing order).

## Commit

`ea786ed` on branch `sc120-d2-steel-compositions`, inside `draw-steel-elements/` only, on
top of `6fb65b8`. 2 files changed (`src/elements/display/layouts.ts`,
`test/dom/elements/displaySteelBatchA.test.ts`), 134 insertions / 6 deletions. No
Co-Authored-By / AI attribution trailers. Not pushed. Working tree verified clean after
commit (`git status` → "nothing to commit, working tree clean").

# FIX ROUND 4 (owner ruling 28 — test-only gap-direction hardening)

Base: `ea786ed` (fix round 3, above). New commit: `41c9e78`, branch
`sc120-d2-steel-compositions`, `draw-steel-elements/` only. Test-only micro-round — no
production code changes; `src/` diff is empty at every checkpoint below.

Scope: r7 delta re-review's LOW-1 ("gap-direction regression coverage exists for only 3 of
the 6 labels — mutations M4 and M5 both stayed GREEN"), governed verbatim by owner
ruling 28 (`decisions.md`). Nothing else touched.

## The test change

`test/dom/elements/displaySteelBatchA.test.ts`: the fix-round-3 single-case Renown gap/
dash-fill test (ruling 26b) is replaced with a `test.each` parameterized over all four
Career Benefits tile labels (`Languages`, `Renown`, `Wealth`, `Project Points`). The
Skills/Perk gap tests (ruling 26a) and the populated-all-six regression (ruling 26c) are
left exactly as they were, per the brief.

Each parameterized case builds a `Career` whose body carries only the target label's line
(e.g. `**Wealth:** +1`) with the target's own backing model field left absent, and — this
is the part beyond the reviewer's literal "all fields absent" wording — every OTHER
backing field (`skills`, `language`, `renown`, `wealth`, `perk`, `project_points`, minus
the target) populated with a truthy value. Each case asserts (a) the Career Benefits
tile's slot for that label reads `—` (the omitted field dash-fills) and (b) the body band
still contains the labeled line's value (duplication, never deletion).

The "every other field populated" widening was necessary, not decorative: a first attempt
that left ALL SIX fields absent per the reviewer's literal phrasing reproduced the r7
dash-fill-all-six test's exact shape and, when probed, mutation M5 stayed **GREEN** — with
both `m.language` and `m.wealth` absent, a gate redirected from one to the other is
indistinguishable from the correct gate; two absent fields collapse to the same outcome
either way. Populating every field except the target's makes a redirected gate fire true
where it must stay false, over-stripping the target's body line and failing assertion (b).
This shape still catches M4 (Wealth's unconditional strip fires regardless of any field,
target's included) exactly as the literal phrasing would have.

## M4 / M5 re-review proof (the round's acceptance proof)

All mutations applied to `src/elements/display/layouts.ts`, career suite run
(`test/dom/elements/displaySteelBatchA.test.ts`), then reverted; `git diff src/` confirmed
empty after each revert.

| Mutation | Change | Result | Failing test |
|---|---|---|---|
| **M4** (reintroduce the Wealth gate bug) | `...(m.wealth ? ['Wealth'] : [])` → `'Wealth',` | **RED** — 1 failed / 30 | `fix round 4 (ruling 28): a "**Wealth:**" body line with no matching model field dash-fills the Career Benefits tile (Wealth) AND keeps the body line — every OTHER backing field is populated so a mispaired/unconditional gate (reviewer mutations M4/M5) is caught` |
| **M5** (mispair Languages onto `m.wealth`) | `...(m.language ? ['Languages'] : [])` → `...(m.wealth ? ['Languages'] : [])` | **RED** — 1 failed / 30 | same test family, the `Languages` case: `fix round 4 (ruling 28): a "**Languages:**" body line with no matching model field dash-fills the Career Benefits tile (Languages) AND keeps the body line — every OTHER backing field is populated so a mispaired/unconditional gate (reviewer mutations M4/M5) is caught` |

Both mutations reverted immediately after their run; `git diff src/` empty, `git status
--porcelain` showed only the test file modified at every checkpoint.

## Gates (devbox-wrapped, foreground, `rm -f main.js styles.css` before every jest run)

| Gate | Result |
|---|---|
| `npx jest` (baseline, before mutations) | Suites: 189 passed + 1 skipped / 190; Tests: **3392 passed + 1 skipped / 3393** (prior `ea786ed` 3389+1sk/3390 — net +3: one test.each case count of 4 replacing 1 prior test) — PASS |
| M4 applied, `npx jest test/dom/elements/displaySteelBatchA.test.ts` | 1 failed / 30 — **RED**, exactly the Wealth case |
| M4 reverted, `git diff src/` | empty |
| M5 applied, `npx jest test/dom/elements/displaySteelBatchA.test.ts` | 1 failed / 30 — **RED**, exactly the Languages case |
| M5 reverted, `git diff src/` | empty |
| `npx jest` (final, post-revert) | Suites: 189 passed + 1 skipped / 190; Tests: **3392 passed + 1 skipped / 3393** — PASS, identical to the pre-mutation baseline |
| `npm run tsc` | exit 0, no output — PASS |
| `npm run lint` | exit 0, no output (only the pre-existing `.eslintignore` deprecation notice) — PASS |

No shots/freeze/parity run — byte-neutral by construction (test files don't reach shots),
per the ruling's explicit exemption.

## Out of scope, confirmed untouched

- `git diff src/` empty at commit time (verified via `git status --porcelain` showing only
  `test/dom/elements/displaySteelBatchA.test.ts`).
- No CSS, no fixtures, no other test file.
- Superproject pointer — not staged/committed.
- No tag created on `draw-steel-elements` (standing order).
- No shots/freeze regeneration; the shared freeze baseline was not touched.

## Commit

`41c9e78` on branch `sc120-d2-steel-compositions`, inside `draw-steel-elements/` only, on
top of `ea786ed`. 1 file changed (`test/dom/elements/displaySteelBatchA.test.ts`), 63
insertions / 17 deletions. No Co-Authored-By / AI attribution trailers. Not pushed.
Working tree verified clean after commit (`git status --porcelain` empty).

# FINAL BATTERY + REBASELINE (at 41c9e78)

Final pre-landing verification round (per decisions.md ruling 9 and "Landing
prerequisites"). Worktree: `/home/scott/code/steelCompendium/worktrees/sc120-d2-steel-compositions/draw-steel-elements`,
branch `sc120-d2-steel-compositions`. Preflight confirmed: `git log --oneline -1` →
`41c9e78`; `git status --porcelain` empty. No code changes made this round.

## origin/develop tip check

`git fetch origin` then `git rev-parse origin/develop` → **`c09cf6f1258311b43701a536042744fa325aa202`**
— unchanged from the sha this branch was rebased onto (SC-205's base per the "Landing
prerequisites" note). `git merge-base --is-ancestor c09cf6f HEAD` confirmed true. **No
rebase needed; owner does not need to decide anything here.**

## Full battery (dse-verify order, all foreground, devbox-wrapped)

| Gate | Expected | Measured | Result |
|---|---|---|---|
| `npm run tsc` | clean | clean, no output, exit reflected by no error | PASS |
| `npm run lint` | clean (pre-existing `.eslintignore` notice only) | only the `.eslintignore` ESLintIgnoreWarning notice, no lint errors | PASS |
| `npx jest` (after `rm -f main.js styles.css`) | 3392 passed + 1 skipped / 3393; 189+1sk/190 suites | `Test Suites: 1 skipped, 189 passed, 189 of 190 total` / `Tests: 1 skipped, 3392 passed, 3393 total` / `Snapshots: 3 passed, 3 total` | PASS, exact match |
| `npm run shots` (run 1) | 474 lines, 0 FAIL; host-copy pin OK; button host-leak OK (666 comparisons) | 474 `ok` lines, 0 FAIL; `host-copy pin OK (6 button-reaching rules + 14 tokens × dark/light …)`; `button host-leak OK (111 button kinds × 3 states … = 666 comparisons …)`; `print-twin parity OK (118 capture ids)`; exit 0 | PASS |
| freeze check (run 1) | exactly 24 mismatches / 0 missing (186 OK + 24 FAILED = 210); kit/kit-collapsed `: OK` | `sha256sum -c` against the 210-line baseline: **186 OK, 24 FAILED, 0 missing**; `check-freeze.sh` reported the same 24 names via `FREEZE VIOLATED` (expected — unrebaselined by design); `kit--steel-{print,realprint}.png` and `kit-collapsed--steel-{print,realprint}.png` all `: OK` | PASS |
| `npm run shots` (run 2, determinism) | 474 lines, 0 FAIL | 474 `ok` lines, 0 FAIL, exit 0, same in-run assertions OK | PASS |
| freeze check (run 2) | same 24 names as run 1 | identical 24-name set (`diff` of run 1 vs run 2 FAILED-name lists empty) | PASS |
| `npm run parity` (LAST) | 0 GAPs / 0 undeclared / 16 DECLARED / exit 0 | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)` | PASS |

## Determinism + twin evidence (second `npm run shots` run)

Re-hashed all 24 mismatch-set files (`sha256sum`, print + realprint per family) after the
second `npm run shots` run and diffed against the first run's hashes: **empty diff — all 24
files byte-identical across both runs.** Twin invariant (`--steel-print` hash ==
`--steel-realprint` hash) holds for every one of the 12 families in both runs — verified by
direct `sha256sum` comparison per family, not assumed.

## The 24 mismatch names (identical both runs, matches ruling 20's fixed set)

`ancestry`, `career`, `class`, `complication`, `complication-edit-btn`, `condition`,
`culture`, `perk`, `perk-narrow`, `rule`, `title`, `treasure` — each × `{print, realprint}`.

## Cross-check against FIX ROUND 2/3/4 report tables

Every one of the 24 measured hashes matches a previously recorded value in this report —
no novel hash:

| Family | Measured hash (this round) | Recorded source |
|---|---|---|
| ancestry | `b25047cdf7d1a682d84ff91d94d595e997f4b2231692c0909567ca23d7adee65` | Batch B round-6 table (unchanged through all fix rounds) |
| career | `681db993e956307c4da5205c51b91044364b1c970b5f7f1bcaf9166b031d345d` | FIX ROUND 3 HARD GATE section, explicitly re-verified there against the r6/fix-round-2 table |
| class | `dd9650e6ed254b782ceb4deb653cb327f5c59fbd35c4dbd488bfe5607365f872` | FIX ROUND 3 HARD GATE section, explicitly re-verified there |
| complication | `325df3f94e99d36475717a9fe9c4ace538b2bc4e4d4d13b97f8ae4072083efc6` | Batch B round-6 table (unchanged through all fix rounds) |
| complication-edit-btn | `325df3f94e99d36475717a9fe9c4ace538b2bc4e4d4d13b97f8ae4072083efc6` (== complication, expected: same `complicationLayout`, screen-only pref difference) | Batch B round-6 table |
| condition | `63531ab624422b7f06bc865bc160a111be44a674a88e47abd00e7a9f0aeab2e2` | Batch B round-6 table (unchanged through all fix rounds) |
| culture | `4dc71e9191544262fa963c8b0744c1ea20b96a3716cf311ac3a8b0dec5fc6ede` | Batch B round-6 table (unchanged through all fix rounds) |
| perk | `1d0186e12e1443294b23535a34887b141ca3fd2363bfee04752b84e02097eeed` | Batch B round-6 table (unchanged through all fix rounds) |
| perk-narrow | `16e516faee76a315fafc8d91841739fcc1ca461803510aeec7ab0ba87a02bfa8` | Batch B round-6 table (unchanged through all fix rounds) |
| rule | `bcda9977c98356bc94a461e8d4719367aafd51986d11ec9a21e84d32d599e82b` | Batch B round-6 table (unchanged through all fix rounds) |
| title | `8c701e289ef91b5ee6a89814d5427bceaf97ef9d1f6190fcff7f502575398fa0` | Batch B round-6 table (unchanged through all fix rounds) |
| treasure | `4d464d4260ce903f1a1141564eef17b75cf62282d1eb502725740c04c495c24f` | FIX ROUND 2's per-family hash movement table records the prefix `4d464d4260ce90…` — full digest confirmed matching here |

Cross-check result: **all 24 lines matched a previously recorded value — 0 novel hashes.**

## rebaseline.txt (verbatim, 24 lines, sorted in freeze-baseline.sha256's own line order)

Written to `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc120-d2-steel-compositions/rebaseline.txt`.
`freeze-baseline.sha256` itself was read-only referenced, never edited (md5 of the baseline
file confirmed unchanged before/after this round).

```
b25047cdf7d1a682d84ff91d94d595e997f4b2231692c0909567ca23d7adee65  ancestry--steel-print.png
681db993e956307c4da5205c51b91044364b1c970b5f7f1bcaf9166b031d345d  career--steel-print.png
dd9650e6ed254b782ceb4deb653cb327f5c59fbd35c4dbd488bfe5607365f872  class--steel-print.png
325df3f94e99d36475717a9fe9c4ace538b2bc4e4d4d13b97f8ae4072083efc6  complication--steel-print.png
63531ab624422b7f06bc865bc160a111be44a674a88e47abd00e7a9f0aeab2e2  condition--steel-print.png
4dc71e9191544262fa963c8b0744c1ea20b96a3716cf311ac3a8b0dec5fc6ede  culture--steel-print.png
16e516faee76a315fafc8d91841739fcc1ca461803510aeec7ab0ba87a02bfa8  perk-narrow--steel-print.png
1d0186e12e1443294b23535a34887b141ca3fd2363bfee04752b84e02097eeed  perk--steel-print.png
bcda9977c98356bc94a461e8d4719367aafd51986d11ec9a21e84d32d599e82b  rule--steel-print.png
8c701e289ef91b5ee6a89814d5427bceaf97ef9d1f6190fcff7f502575398fa0  title--steel-print.png
4d464d4260ce903f1a1141564eef17b75cf62282d1eb502725740c04c495c24f  treasure--steel-print.png
325df3f94e99d36475717a9fe9c4ace538b2bc4e4d4d13b97f8ae4072083efc6  complication-edit-btn--steel-print.png
b25047cdf7d1a682d84ff91d94d595e997f4b2231692c0909567ca23d7adee65  ancestry--steel-realprint.png
681db993e956307c4da5205c51b91044364b1c970b5f7f1bcaf9166b031d345d  career--steel-realprint.png
dd9650e6ed254b782ceb4deb653cb327f5c59fbd35c4dbd488bfe5607365f872  class--steel-realprint.png
325df3f94e99d36475717a9fe9c4ace538b2bc4e4d4d13b97f8ae4072083efc6  complication-edit-btn--steel-realprint.png
325df3f94e99d36475717a9fe9c4ace538b2bc4e4d4d13b97f8ae4072083efc6  complication--steel-realprint.png
63531ab624422b7f06bc865bc160a111be44a674a88e47abd00e7a9f0aeab2e2  condition--steel-realprint.png
4dc71e9191544262fa963c8b0744c1ea20b96a3716cf311ac3a8b0dec5fc6ede  culture--steel-realprint.png
16e516faee76a315fafc8d91841739fcc1ca461803510aeec7ab0ba87a02bfa8  perk-narrow--steel-realprint.png
1d0186e12e1443294b23535a34887b141ca3fd2363bfee04752b84e02097eeed  perk--steel-realprint.png
bcda9977c98356bc94a461e8d4719367aafd51986d11ec9a21e84d32d599e82b  rule--steel-realprint.png
8c701e289ef91b5ee6a89814d5427bceaf97ef9d1f6190fcff7f502575398fa0  title--steel-realprint.png
4d464d4260ce903f1a1141564eef17b75cf62282d1eb502725740c04c495c24f  treasure--steel-realprint.png
```

Verified line-by-line against the actual files on disk (post-run-2 regeneration): every
hash matches a fresh `sha256sum` of its named file; filename set matches the 24-name
`FAILED` set from `sha256sum -c` exactly (sorted diff empty); 24 lines total.

## Final state

`git status --porcelain` empty in the worktree submodule after the full battery (no code
changed this round — verification only). No commit made. No edit to
`freeze-baseline.sha256`. No superproject pointer touched. No tag created.

**VERDICT: LAND-READY at `41c9e78`.** Full battery green, exact expected numbers matched at
every gate, determinism and twin invariants proven by direct re-hash, all 24 rebaseline
hashes cross-checked against previously recorded values with zero novel hashes.
`origin/develop` unchanged at `c09cf6f` — no rebase required before landing.
