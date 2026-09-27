# SC-284 round 2: scoped re-review of the round-2 delta

**Verdict: APPROVE.** 0 CRITICAL, 0 HIGH, 0 MEDIUM, 1 LOW (cosmetic evidence only, optional), 2 INFO. All round-1 findings are closed.
- Reviewed DSE `33b58c3` on `origin/develop` `619c4bd`. The tree was clean before and after; I made no probe edits this round.
- (a) `git range-diff 6c4f6aa..97aa19a 619c4bd..56f0585` shows all 4 round-1 commits as `=` (identical content).
- (b) MEDIUM-1 is fixed.
  - Harness at 300px: "Blood Debt" is 180.27px wide on 1 line, and its cost sits at row 5 / column 2, left-aligned (round 1: 81px, 2 lines, cost still in column 3).
  - Real Obsidian, 300px right sidebar: 139px on 1 line (round 1: 49px, 3 lines), cost at 5/2.
  - No other higher-specificity rule places `.dse-head__*--right`. SC-340 added no rule of this kind.
- (c) The comment and CHANGELOG wording is accurate (INFO-2 has one optional nit).
- (d) Freeze against the live baseline fails on exactly the same 6 lines. `rebaseline.txt` reproduces byte-for-byte from my shots run. On a temp copy with the rebaseline applied: `freeze OK (260/260 …)`, exit 0.
- (e) Battery:
  - tsc clean. Lint clean.
  - Jest 4041 passed, 1 skipped, 208 of 209 suites.
  - Lifecycle `19/19 ok, 0 failed`.
  - Shots 532 PNGs, 0 FAIL.
  - Parity `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0.
- (f) Both composites show what they claim. LOW-1 covers label overlap and one clipped caption.

## (a) Replay integrity
`git range-diff` output:
```
1:  7923377 = 1:  d3a7d5a feat(head): SC-284 narrow (stacked) form for cardHead
2:  3999296 = 2:  1d24f08 test(head): SC-284 pin the .dse-head narrow-form CSS contract
3:  498e0b5 = 3:  4e5ecec test(harness): SC-284 narrow-shot coverage for cardHead consumers
4:  97aa19a = 4:  56f0585 docs(changelog): SC-284 narrow cardHead form
```
The round-2 delta (`git diff 56f0585 33b58c3`) touches only three things:
- `styles-source.css`: the cardHead container comment, plus 2 new arms inside `@container dse-head`.
- `cardHead.test.ts`: 1 new test.
- `CHANGELOG.md`: the same bullet, reworded.

It stays within the SC-284 scope fences.

## (b) MEDIUM-1
- **The fix:** `styles-source.css:13738` and `:13741` add `[data-dse-theme='steel'] .dse-fb .dse-feature > .dse-head > .dse-head__eyebrow--right { grid-area: 5 / 2 }` and `… primary--right { grid-area: 6 / 2 }`, inside the `@container` block.
  - They match the (0,4,1) specificity of the Steel rules at `:7889` / `:7901` and come later in source order.
  - They are structure tier with no print guard, the same tier as the rules they override.
- **Fixture sweep (harness, Chromium 149).** Every element × fixture with a `.dse-head` (264 records) at 300, 400, 480, 520, 700 and 900, compared against base (`container-type` forced off):
  - NOTSTACKED: none.
  - Overflow: none.
  - At 700 and 900: 0 pixel diffs and 0 rect diffs.
  - featureblock at 300px:
    - `default` options "Leapfrog", "Resonating Croak" and "Rainfall": names 180.27px wide (1, 2 and 1 lines). The cost ("3/5/7 Malice") sits at 5/2, `justify-self: start`, x=113.14, aligned with the name.
    - `stats` "Blood Debt": 180.27px, 1 line, "3 Malice" at 5/2.
- **Real Obsidian** (Electron 21.4.1 / Chromium 106 installer; asar 1.14.2; right sidebar):

  | Sidebar width | Nested fb head | Name | Cost position |
  |---|---|---|---|
  | 300 | 168px | 139px, 21px tall (1 line) | 5/2 |
  | 420 | 288px | 259px | 5/2 |
  | 600 | 468px | 439px | 5/2 |

  At 600 the top-level fb head (546px) is correctly wide.
- **Override search:** I scanned every rule whose selector mentions `dse-head` and sets `grid-area`, `grid-column`, `grid-row`, `justify-self`, `margin-left`, `margin-inline` or `order`.
  - The only right-slot overrides outside the kit block are `:7889` and `:7901`, which are now covered.
  - The others (`.dse-head > .dse-fb__feat-icon` `:8066`, and `.dse-sb > :not(.dse-head)` `:9322`) do not touch right slots.
  - `git diff 6c4f6aa 619c4bd -- styles-source.css` adds no `dse-head`, `grid-area`, `@container` or `container-type` lines, so SC-340 introduces nothing new here.
- **Jest:** the new test asserts the full selectors inside the `@container` body. It is non-vacuous by construction, since it matches text that exists only in `9253d4b`.

## (c) Wording
- **Container comment** (`styles-source.css:13589-13607`):
  - It now says the NAME column (`minmax(0,1fr)`) starves while the rail keeps its max-content width. That matches round-1 measurements.
  - It states layout, style and inline-size containment on Electron 21.4.1 / Chromium 106, and inline-size-only in current Chromium. That matches my probes in both engines.
  - It cites the stamina precedent at ~:11631. The comment there starts at 11631.
  - Its consequence list (no baseline reliance; abspos anchors at `.dse-sb[data-dse-role] > .dse-head`, `.dse-fb > .dse-head`, `.dse-crest`; no shrink-to-fit parent) matches what I verified.
- **MEDIUM-1 comment:** the lane mapping it describes (cost → primary row, ability_type → deck row) matches `:7889` / `:7901`. The phrase "renderFeature.ts's Steel remap" is loose: the remap is CSS in `styles-source.css`, while `renderFeature.ts` only fills the slots. The line numbers are right. INFO only.
- **CHANGELOG** (`CHANGELOG.md:25-29`): accurate, and the featureblock claim now holds. See INFO-2 for one optional nit.

## (d) Freeze
- **Live baseline** (`f746e373…`, 260 lines, unchanged by me): `FREEZE VIOLATED (6 checksum mismatches, 0 missing)`, exit 1.
  - The 6 lines: `encounter-narrow`, `montage-narrow` and `statblock-sticky-narrow`, twin and realprint each. This is the same set as round 1. SC-340 moved no other frozen line.
- **Reproduction:** `sha256sum` of those 6 files in my shots run equals `rebaseline.txt` (diff empty). The hashes are identical to round 1's.
- **Temp copy** (`scratchpad/rv2/freeze-tmp/`, 6 of 6 lines replaced, 260 lines): `freeze OK (260/260 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`, exit 0.

## (e) Battery on 33b58c3
| Gate | Result |
|---|---|
| tsc | clean, exit 0 |
| lint | clean, exit 0 |
| jest (`rm -f main.js styles.css` first) | 4041 passed / 1 skipped / 4042; 208 of 209 suites; exit 0 |
| obsidian-lifecycle | `start: obsidian 1.14.2 … 19 scenario(s)` → `done: 19/19 ok, 0 failed`, exit 0 |
| shots | 532 PNGs, 0 FAIL, exit 0 |
| freeze (live / temp) | 6 mismatches, exit 1 / `260/260`, exit 0 |
| parity (last) | 0 gaps / 0 undeclared / 16 declared, exit 0 |

## (f) Evidence
- **Provenance:** every "after" evidence file is byte-identical to my run's shots. That covers `sc284-{statblock,featureblock,montage}-narrow-after.png`, `*-wide-after.png` and the 3 `*-print-full-after.png`.
- **`sc284-compare-narrow.png`:**
  - Statblock and montage rows are unchanged from round 1 and correct.
  - The featureblock row now crops the option head: before "BLO/OD/DEB/T | 3 MALICE", after "BLOOD DEBT" on one line with "3 MALICE" stacked below, left-aligned. This matches the probe.
- **`sc284-rebaseline-heads-compare.png`:** the encounter and montage rows correctly show the head stacking. See LOW-1 for the statblock-sticky row.
- **`sc284-rebaseline-statblock-sticky-narrow-print-crop.png`** (the round-1 LOW-3 recrop): now shows the "Signature Ability" chip stacked under "Whip and Magic Longsword" in the AFTER panel. See LOW-1 for the caption.

## LOW
### LOW-1: cosmetic defects in the two new or recropped evidence composites
- **`sc284-rebaseline-heads-compare.png`:**
  - The row labels ("encounter-narrow", "montage-narrow", "statblock-sticky-narrow (scrolled; nested feature head shown)") run into the image panels. The last label overprints the characteristics text.
  - The statblock-sticky row (head region y≈0-400) cuts off at "Whip and Magic / Longsword" before the stacked chip. That is the same gap round-1 LOW-3 fixed in the single crop.
- **`sc284-rebaseline-statblock-sticky-narrow-print-crop.png`:** the caption is clipped at the left edge ("op head is above this crop…", "t got taller.").
- **Failure scenario:** Scott reads the sanction ask, and the third composite row doesn't show the stacked result.
- **Fix:** widen the label gutter (or put labels above rows), extend the statblock-sticky row to y≈0-500, and left-pad the caption. This is not a gate issue; the owner can instead attach the single crop, which is correct, and skip the composite's third row.

## INFO
- **INFO-1:** the round-1 INFO still stands. In real Obsidian (Chromium 106) the branch is geometry-identical at note width, but statblock, featureblock and encounter heads differ by sub-visible antialiasing and dithering. The new comment accurately covers the containment semantics, so no action is needed.
- **INFO-2 (optional nit):** the CHANGELOG bullet's "— not the other way around" refers to the corrected internal description, which a user never saw. Consider dropping those five words.

## Artifacts
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/rv2/`:
- **Gate logs:** `tsc.log`, `lint.log`, `jest.log`, `lifecycle.log`, `shots1.log`, `freeze-live1.log`, `freeze-tmp1.log`, `parity.log`.
- **Temp freeze copy:** `freeze-tmp/`.
- **Harness sweep:** `probe.json` (from `rv1/probe.mjs`).
- **Real Obsidian:** `obsprobe.json` (from `rv1/obsprobe.mjs`), plus `obs-sidebar-300-{sb,mt}.png`.
