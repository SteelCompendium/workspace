# SC-236 round 1 — evidence report: what each fix of `feature/example.yaml` costs

Worktree: `/home/scott/code/steelCompendium/worktrees/sc236-feature-example/draw-steel-elements`,
branch `sc236-feature-example`, base `6c4f6aa` (verified `origin/develop` had NOT moved past it —
no rebase needed). ImageMagick (`magick`/`convert`/`compare`) used for the before/after crops.

## Executive summary

- **Base (V0):** jest 3997 passed / 1 skipped / 3998 total / 206 of 207 suites / 3 snapshots.
  shots 524, 0 FAIL. freeze `260/260` OK. (Numbers differ from the SC-343 baseline cited in the
  brief — `develop` has moved since; freeze count 260 is unchanged.)
- **V1** (delete `ability_type` line): 4 frozen lines move + 2 more frozen lines move on a shot I
  didn't expect (`chrome-collapsed-rollout--*`) = **6 frozen lines total**. Shots moved:
  `feature--{print,realprint}`, `feature-collapsed--{print,realprint}`,
  `chrome-collapsed-rollout--{print,realprint}`, plus `feature--{dark,light}` (unfrozen, screen
  only). jest: 1 real failure (the adversarial pin test, expected) + 1 unrelated load flake
  (confirmed passing standalone). **User sees:** the "VILLAIN ACTION 1" chip disappears from the
  card; crest stays the sword, everything else identical.
- **V2** (`ability_type: Main Action 1`): same **6 frozen lines** move, same shot set as V1. jest:
  1 real failure (same pin), no flake this run. **User sees:** the chip's text changes from
  "VILLAIN ACTION 1" to "MAIN ACTION 1"; crest stays the sword. Data-realism note: `Main Action 1`
  is invented — it never occurs anywhere in the generated corpus.
- **V2r:** the brief asks for a data-realistic alternate value "if different" from `Main Action 1`.
  It is **not different** — the survey found real Malice-cost main actions carry **no
  `ability_type` field at all**, so the data-realistic edit is byte-identical to V1. No separate
  measurement run; V1's numbers apply.
- **V3** (genuine villain action — `usage: '-'`, `trigger` line removed, `ability_type` and `cost`
  untouched): same **6 frozen lines** move, same shot set, PLUS the card is 232px shorter (the
  removed Trigger row) in dark/light/print/realprint. jest: 1 real failure (the `usage` half of
  the same pin) + 1 unrelated load flake (confirmed passing standalone). **User sees:** crest
  swaps sword → skull, the "MAIN ACTION" row disappears, spine accent changes to the villain
  color, and the Trigger row is gone — a materially different-looking card, not just a text edit.
  All three carry the same jest cost (the adversarial pin test) and the same 6-frozen-line freeze
  cost; V3 additionally reshapes the card.

## Part 1 — survey

### 1. Every consumer of `src/elements/feature/example.yaml`

- **Authoring wiring:** `src/elements/feature/definition.ts:17` (`import featureExample from
  './example.yaml'`) and `:47` (`authoring: { example: featureExample, sdkModel: 'feature' }`) —
  this is the literal text a user gets when inserting a new `ds-feature` block (D9).
- **Visual harness `feature` family:**
  - `visual-harness/entry.ts:34` — `import featureDefault from '../src/elements/feature/example.yaml'`.
  - `visual-harness/entry.ts:400` — `const featureCollapsed = 'collapsed: true\n${featureDefault}'`
    (the `collapsed` fixture is this file with one line prepended).
  - `visual-harness/entry.ts:902` — `FIXTURES.feature.default: featureDefault`.
  - `visual-harness/entry.ts:237-244` (comment) — `featureSpend` is a **verbatim hand-copy** of
    this file's text with one field edited (NOT an import) — an edit to `example.yaml` will NOT
    propagate to `featureSpend`; it would silently drift out of sync. Out of this round's scope,
    flagged as a follow-up below.
  - `visual-harness/entry.ts:278-291` (comment) — explains `featureVillain` exists as a *separate*
    harness-local fixture precisely because this file "cannot be 'fixed' without either editing
    the D9 example... or breaking the precedence rule."
  - `chrome-collapsed-rollout` (`visual-harness/entry.ts:1652-1662`) stacks `feature`'s `collapsed`
    fixture alongside `kit`/`encounter` — **an indirect consumer I did not anticipate**; its
    print/realprint shots moved identically to `feature-collapsed`'s in every variant (see Part 2).
  - `gallery--steel-{dark,light}.png` (full-sweep gallery, `shoot.mjs:3196` comment) mounts every
    element's `default` fixture, including `feature`'s — checked for byte changes in every
    variant; **it never moved** (not frozen either way, since it's screen-only, but confirmed
    byte-identical across all 3 variants — see Part 2 per-variant compare notes).
- **Jest content pin (the critical one):** `test/dom/elements/feature.test.ts:536-550` — reads the
  file from disk with `fs.readFileSync` and asserts, as literal regexes, BOTH
  `/^ability_type: Villain Action 1$/m` (line 542) AND `/^usage: Main action$/m` (line 543), then
  asserts the rendered card resolves to `main` + sword crest. **Any edit to either pinned line
  fails this test** — it fails identically for V1, V2, and V3.
- **Jest "documented key" liveness sweep:** `test/dom/authoring/compendiumSearchModal.test.ts:625-639`
  — for the `feature` family, asserts `example.yaml` matches `^type:` and `^feature_type:` only
  (NOT `ability_type`). None of the candidate edits touch those two keys, so this test is
  unaffected by all three variants.
- **Doc-comment cross-references only (no code dependency):**
  `src/elements/feature/renderFeature.ts:128` (SC-102 root-cause comment names this file's exact
  shape as the reason the villain-vs-main precedence rule exists), and
  `src/model/FeatureblockConfig.ts:15`, `src/authoring/compendiumInsert.ts:91` reference
  `example.yaml` generically (the `type:`/`feature_type:` convention), not this file's content.
- **False positives (same fictional ability NAME reused, not a file dependency):**
  `test/dom/framework/chromeRollout.test.ts:38` (`['feature', 'default', 'Feature: Coverage
  Strike']`) and `test/dom/framework/chromeRerender.test.ts:61`
  (`const FEATURE_BODY = 'name: Coverage Strike\n'`) both hardcode the string "Coverage Strike"
  independently — they assert only on `name`, which no candidate edit touches, and neither reads
  `example.yaml` from disk. Unaffected by any variant.
- **No docs/demo vault copies found** (`grep -rln "Coverage Strike"` across `.ts`/`.md`/`.yaml`/
  `.mjs`, excluding `node_modules`, returned only the five files above).

### 2. Where `ability_type` is rendered or consumed

Two independent call sites, both reachable only through `FeatureConfig.feature.ability_type`:

1. **`actionTypeOf`'s fallback** — `src/elements/feature/renderFeature.ts:141`:
   `const source = (realUsage || (config.feature.ability_type ?? '')).toLowerCase();`. Only
   consulted when there is no real (non-empty, non-dash) `usage` line AND `cost` doesn't look like
   `"Villain Action N"` (`isVillainCost`, same file ~line 65-81). Drives the `[data-dse-act]`
   attribute → the crest icon and spine accent color.
2. **It IS rendered as visible text**, independent of (1) — `src/elements/feature/renderFeature.ts:270,
   278, 289, 301`: the cardHead's `rightPrimary` chip slot mounts whenever `feature.ability_type`
   is truthy (line 278, 289) and is filled verbatim via `md(feature.ability_type.trim(),
   head.slots.rightPrimary!, true)` (line 301). **This is why V1 removes a visible chip and V2
   changes its visible text**, even though neither changes the crest (usage still wins the spine
   precedence in both).
3. **A second, independent last-resort consumer:** `src/elements/hero/view.ts:671-684`
   (`abilityActionLabel`) — the hero sidebar's compact per-ability row falls back to the raw
   `ability_type` string as its label ONLY when `actionTypeOf` returns `undefined` for a
   hand-authored, non-corpus ability (the comment there confirms no real corpus ability carries
   `ability_type` at all, so this path only ever fires for fixtures/hand-authored notes — never
   for real generated data).

`ability_type` drives nothing else: no print-vs-screen branching, no keyword filter, no docs
generation.

### 3. What real Draw Steel data looks like

All paths relative to `/home/scott/code/steelCompendium/workspace/data/data-unified/`.

**(a) A real monster Villain Action ability** —
`en/unified/yaml/monster/hag/statblock/wode-hag.yaml:88-98` (Wode Hag, villain action 1):
```
cost: Villain Action 1
distance: 5 burst
...
```
— no `ability_type` field anywhere in this ability, and `usage: '-'` (line 110, VA2; line 124,
VA3 in the same file — the lone-dash placeholder, never a real word). No `trigger` field on any
of the file's three villain actions. Corpus-wide check (`grep -B8 "cost: Villain Action"` across
every monster statblock, filtered for `trigger`) confirms: **`trigger` never co-occurs with a
`cost: Villain Action N` ability anywhere in the corpus** — it only ever appears alongside
`usage: Triggered action` / `Free triggered action` (123 corpus-wide hits, 100% co-occurrence).

**(b) A real monster Malice-cost main-action ability** —
`en/unified/yaml/monster/angulotl/statblock/angulotl-needler.yaml:11-22` ("Blowgun"):
```
- cost: 2 Malice
  ...
  usage: Main action
```
— **no `ability_type` field at all.** A corpus-wide sweep (every `statblock/*.yaml` under
`en/unified/yaml/monster`, matching top-level `cost: N Malice` + `usage: Main action` in the same
feature entry) found **zero** abilities that also carry `ability_type` — confirming this is the
general case, not a one-off.

The only real `ability_type` values anywhere in `en/unified/yaml` (corpus-wide grep, 831 hits
across all indent depths): **`Signature Ability`** (461, top-level statblock abilities — e.g.
`en/unified/yaml/monster/hag/statblock/wode-hag.yaml:19` "Corrosive Claws",
`usage: Main action`, no `cost`), **`Signature`** (260, same concept at nested
indent/featureblock-member depth), **`Triggered`** (106), and **`Free-strike`** (4). `Villain` and
`Main` never occur as an `ability_type` value anywhere in the corpus (`grep -rn "ability_type.*Villain\|ability_type.*Main"` → 0 hits).

**(c) The `feature-villain` harness fixture** — `visual-harness/entry.ts:298-306` ("Rally the
Line"): `ability_type: Villain Action 2`, no `cost`, no `usage` field at all — a harness-authored
literal, not real corpus data (real villain actions never carry `ability_type`; this fixture
exists precisely to golden-shot the villain-spine path without touching the frozen D9 example,
per the comment at entry.ts:278-291).

**Is `Main Action 1` real or invented?** **Invented.** Zero occurrences anywhere in
`data-unified` as an `ability_type` value (or any other field).

## Part 2 — measured candidate edits

Base content saved at
`.superpowers/sdd/sc236-feature-example/sc236-r1-shots/base-example.yaml`; restored byte-identical
at the end of every variant (verified via `diff`).

### V0 — base (unedited)

- jest: `.superpowers/sdd/sc236-feature-example/sc236-r1-logs/jest-v0.log` — 3997 passed / 1
  skipped / 3998 total, 206 of 207 suites, 3 snapshots, 28.9s.
- shots: `.../sc236-r1-logs/shots-v0.log` — 524 shots, 0 FAIL.
- freeze: `.../sc236-r1-logs/freeze-v0.log` — `freeze OK (260/260 ...)`.
- 42 baseline PNGs (feature*/featureblock*/gallery--{dark,light}) copied to
  `.../sc236-r1-shots/v0/` for byte comparison.

### V1 — delete the `ability_type: Villain Action 1` line

Edit: removes line 5 only (`ability_type: Villain Action 1`); no other line touched.

- jest: `.../sc236-r1-logs/jest-v1.log` — **2 failed**, 1 skipped, 3995 passed, 3998 total.
  - `test/dom/elements/feature.test.ts:542` — the adversarial content pin
    (`expect(exampleYaml).toMatch(/^ability_type: Villain Action 1$/m)`). **Expected, direct
    consequence of the edit.**
  - `test/dom/framework/sidebarEncounterHandoff.test.ts:416` — **unrelated load flake**, confirmed
    by re-running that suite standalone (`.../sc236-r1-logs/jest-v1-recheck-sidebar.log`: 10/10
    passed). Not caused by this edit.
- shots: `.../sc236-r1-logs/shots-v1.log` — 524 shots, 0 FAIL.
- freeze: `.../sc236-r1-logs/freeze-v1.log` — **`FREEZE VIOLATED (6 checksum mismatches, 0
  missing)`**: `chrome-collapsed-rollout--{print,realprint}`, `feature-collapsed--{print,realprint}`,
  `feature--{print,realprint}`.
- Shots that changed bytes vs. V0 (all `feature*`/gallery PNGs diffed): `feature--steel-dark.png`,
  `feature--steel-light.png`, `feature--steel-print.png`, `feature--steel-realprint.png`,
  `feature-collapsed--steel-print.png`, `feature-collapsed--steel-realprint.png` (dark/light for
  `feature-collapsed` did NOT change — the collapsed summary line never showed the chip; print
  forces the card into its expanded form, which is why print/realprint move for the collapsed
  shot too — confirmed: `feature-collapsed--steel-print.png`'s hash equals `feature--steel-print.png`'s,
  matching the baseline's own pairing). `chrome-collapsed-rollout--{print,realprint}` also move
  (stacks the same `feature` collapsed fixture; not independently byte-diffed for dark/light in
  this round — only its frozen print/realprint bytes were checked, via the freeze gate). `gallery--
  {dark,light}.png` did NOT move (byte-identical to V0) — surprising at first, but `ability_type`
  only affects a chip inside the full card, and the gallery view crops/composites differently;
  confirmed via direct `cmp`.
- Visible change: the "VILLAIN ACTION 1" chip (top-right of the card) disappears entirely; crest
  stays the sword, spine stays the main-action color, layout height unchanged. Visual proof:
  `.../sc236-r1-shots/v1-compare-feature--steel-dark.png` (before=red border, after=green border)
  and `.../sc236-r1-shots/v1-compare-feature--steel-print.png`.
- Rebaseline: `.../sc236-r1-shots/v1-rebaseline.txt` (6 lines, same order as
  `freeze-baseline.sha256`), verified deterministic — re-ran shots a second time
  (`.../sc236-r1-logs/shots-v1-repeat.log`, 524/0 FAIL) and all 6 hashes repeated exactly.
- Data-realism note: this is the byte-exact edit real Malice-cost main actions actually use (no
  `ability_type` field at all — see Part 1.3(b)).

### V2 — `ability_type: Main Action 1`

Edit: line 5 value only, `Villain Action 1` → `Main Action 1`.

- jest: `.../sc236-r1-logs/jest-v2.log` — **1 failed**, 1 skipped, 3996 passed, 3998 total. Only
  `test/dom/elements/feature.test.ts:542` (same pin). No flake this run.
- shots: `.../sc236-r1-logs/shots-v2.log` — 524 shots, 0 FAIL.
- freeze: `.../sc236-r1-logs/freeze-v2.log` — same **6 checksum mismatches** as V1, same filenames.
  New hashes differ from V1's (chip text differs).
- Shots changed vs. V0: identical filename set to V1 (`feature--{dark,light,print,realprint}`,
  `feature-collapsed--{print,realprint}`, `chrome-collapsed-rollout--{print,realprint}`).
  `gallery--{dark,light}.png` unchanged.
- Visible change: the chip's text changes from "VILLAIN ACTION 1" to "MAIN ACTION 1"; crest and
  spine unchanged (usage still wins — `actionTypeOf` never reaches the `ability_type` fallback in
  either V1 or V2, since `usage: Main action` is a real, non-dash value in both). Visual proof:
  `.../sc236-r1-shots/v2-compare-feature--steel-dark.png`,
  `.../sc236-r1-shots/v2-compare-feature--steel-print.png`.
- Rebaseline: `.../sc236-r1-shots/v2-rebaseline.txt` (6 lines), verified deterministic
  (`.../sc236-r1-logs/shots-v2-repeat.log`, 524/0 FAIL, hashes repeat exactly).
- Data-realism note: **invented** — `Main Action 1` occurs nowhere in the corpus (Part 1.3(c)).

### V2r — data-realistic alternate for a Malice-cost main action

**Not measured as a separate run.** Part 1.3(b)'s corpus-wide sweep found that a real Malice-cost
main action (matching this fixture's own shape — `cost: 5 Malice` + `usage: Main action`) never
carries an `ability_type` field at all, in 100% of the sample. The "most data-realistic value" is
therefore *absence of the field*, which is exactly V1's edit, not a different string value. V2r ==
V1 byte-for-byte; V1's numbers above apply unchanged. (If the intent behind "V2r" was instead "the
closest real STRING value to `Main Action 1`", the only real value that ever accompanies
`usage: Main action` in the corpus is `Signature Ability` — see Part 1.3(b) — but that is not a
literal main-action-number descriptor and would be a materially different edit; flagging this
ambiguity rather than guessing which the ticket-owner wants measured.)

### V3 — genuine villain action (keep `ability_type`, real-data `usage`/`trigger`)

Edit: **exactly two lines**, both from the survey's real villain-action shape (Part 1.3(a)):
- line 10: `usage: Main action` → `usage: '-'` (the corpus dash placeholder).
- line 13: `trigger: A creature ends its turn adjacent to the target.` **removed** (real villain
  actions never carry a `trigger` field — Part 1.3(a)).
`ability_type: Villain Action 1` (line 5) and `cost: 5 Malice` (line 4) are untouched, per the
brief's scope.

- jest: `.../sc236-r1-logs/jest-v3.log` — **2 failed**, 1 skipped, 3995 passed, 3998 total.
  - `test/dom/elements/feature.test.ts:543` — the `usage` half of the same adversarial pin
    (`expect(exampleYaml).toMatch(/^usage: Main action$/m)`). **Expected.**
  - `test/dom/framework/sidebarEncounterHandoff.test.ts:416` — same unrelated load flake as V1,
    reconfirmed standalone (`.../sc236-r1-logs/jest-v3-recheck-sidebar.log`: 10/10 passed).
- shots: `.../sc236-r1-logs/shots-v3.log` — 524 shots, 0 FAIL.
- freeze: `.../sc236-r1-logs/freeze-v3.log` — same **6 checksum mismatches**, same filenames as
  V1/V2. New hashes (distinct from both).
- Shots changed vs. V0: same filename set as V1/V2, but the change is much larger:
  `feature--steel-dark.png` shrinks from 2654px to 2422px tall (the removed Trigger row, −232px);
  print/realprint shrink correspondingly.
- Visible change (confirmed by eye on the crop): the crest icon swaps **sword → skull**, the
  spine/accent color switches to the villain accent, the "MAIN ACTION" row disappears entirely
  (dash-usage renders as absent, matching the fixture's own `isDashPlaceholder` convention), and
  the whole Trigger section is gone — a materially different-looking card, not a text-only change.
  Visual proof: `.../sc236-r1-shots/v3-compare-feature--steel-dark.png` (420px-tall crop — needed
  more headroom than V1/V2's 220px crop to show the crest+chip+trigger-row region),
  `.../sc236-r1-shots/v3-compare-feature--steel-print.png`.
- Rebaseline: `.../sc236-r1-shots/v3-rebaseline.txt` (6 lines), verified deterministic
  (`.../sc236-r1-logs/shots-v3-repeat.log`, 524/0 FAIL, hashes repeat exactly).
- Data-realism note: this is the option that actually renders as a villain card. One residual
  inconsistency the brief's literal scope leaves untouched: `cost: 5 Malice` stays as-is, but
  every real villain action's `cost` field literally restates the action number (e.g.
  `cost: Villain Action 1`) rather than a Malice amount — so V3 as specified is real-data-accurate
  for `usage`/`trigger`/absence-of-ability_type-elsewhere but leaves `cost` in a shape no real
  villain action uses. Flagging for the ticket-owner's round-2 design call, not fixed here (brief
  says measure, not decide).

## Restoration / cleanliness

`example.yaml` restored to base content (`diff` against the saved base = clean) after every
variant, and again as the final step. `git status --short` in the DSE clone is **empty** (nothing
to commit, working tree clean) — confirmed at the end of the round. Nothing was committed.

## Drive-by fixes

None — no edit met the "obviously correct, no design choice, local to a touched file" bar; this
round is read/measure-only per the brief.

## Follow-ups (for the ticket-owner to judge, not filed by me)

1. `featureSpend` (`visual-harness/entry.ts:237-260`) is a **hand-copied, not imported**, verbatim
   duplicate of `feature/example.yaml`'s text. Any future edit to the real file (this ticket's
   eventual fix included) will silently NOT propagate to `featureSpend`, leaving it stale unless
   someone remembers to hand-edit it too. Worth a code comment or a follow-up ticket to convert it
   to a derived string the same way `featureCollapsed` already is (`` `collapsed: true\n${featureDefault}` ``).
2. `chrome-collapsed-rollout` is an indirect, non-obvious consumer of the feature default fixture
   (via the `collapsed` variant) — not mentioned in the ticket text and easy to miss; whoever lands
   the eventual fix should re-run the freeze check rather than assume the frozen-line count from
   this survey is exhaustive for a different edit shape.
3. V3's leftover `cost: 5 Malice` (not real-villain-shaped) is a genuine but small residual
   inconsistency; see the V3 data-realism note above.

## Artifacts

- Report (this file):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/sc236-r1-report.md`
- Logs dir: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/sc236-r1-logs/`
  (`jest-v0.log`, `jest-v1.log`, `jest-v1-recheck-sidebar.log`, `jest-v2.log`, `jest-v3.log`,
  `jest-v3-recheck-sidebar.log`, `shots-v0.log`, `shots-v1.log`, `shots-v1-repeat.log`,
  `shots-v2.log`, `shots-v2-repeat.log`, `shots-v3.log`, `shots-v3-repeat.log`, `freeze-v0.log`,
  `freeze-v1.log`, `freeze-v2.log`, `freeze-v3.log`, `npm-ci.log`)
- Shots dirs:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/sc236-r1-shots/{v0,v1,v2,v3}/`
- Base fixture snapshot:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/sc236-r1-shots/base-example.yaml`
- Compare PNGs:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/sc236-r1-shots/v1-compare-feature--steel-dark.png`,
  `v1-compare-feature--steel-print.png`, `v2-compare-feature--steel-dark.png`,
  `v2-compare-feature--steel-print.png`, `v3-compare-feature--steel-dark.png`,
  `v3-compare-feature--steel-print.png`
- Rebaseline files (ready-to-apply, NOT applied — dispatcher/ticket-owner territory per
  dse-verify's division of labor):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/sc236-r1-shots/v1-rebaseline.txt`,
  `v2-rebaseline.txt`, `v3-rebaseline.txt`
