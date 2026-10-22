# SC-279 r5 — scoped re-review of the r4 fix delta (DSE 24e5a1e → 12aad64, super 218031b → a2740db)

## Executive summary
- **Verdict: APPROVE.** All 7 FOLD findings (HIGH-1, MEDIUM-1, LOW-1..5) are fixed and re-probed. 0 CRITICAL / 0 HIGH / 0 MEDIUM, 1 LOW (optional, non-blocking), 3 INFO.
- **Battery, re-run by me at 12aad64:** tsc clean · lint clean (exit 0) · jest **4392 passed / 1 skipped / 215 of 216 suites** · lifecycle **25/25** · shots **580 ok, 0 FAIL** · freeze `FREEZE VIOLATED (2 checksum mismatches, 0 missing)`, exactly `roll--steel-print.png` + `roll--steel-realprint.png` · parity **0 gaps / 0 undeclared / 24 declared**. All match the r4 claims.
- **Rebaseline:** `sc279-rebaseline.txt` matches my hashes byte for byte (unchanged since r2). With those 2 lines substituted into a scratch copy of the baseline, the check reads `freeze OK (274/274 …)`. The 12 screen-only ids are byte-identical to r4's run 1.
- **Revert-probes, each a real assertion failure rather than a compile error:**
  - `renderFeature.ts` reverted: the 2 HIGH-1 tests fail.
  - `rollBar.ts` reverted: the focus and nowrap tests fail.
  - `roll/view.ts` reverted: the LOW-4 test fails.
  - `featureblock/view.ts` reverted: the featureblock test fails.
  - `statblock/view.ts` reverted: **the suite still passes**. The villain-band `rollIndices` branch is untested (LOW-1 below). A reviewer scratch test proves the code itself is correct.
- **Out of scope stayed out:** no tick glyph (0 `::after` lines in the CSS delta), no harness change (0 `visual-harness/` files), Reroll and `rollResultCard` untouched, no gating change.
- **Tier hit-row fill (owner's addition):** pre-existing and unchanged from f8693b5. The hit-row fill is `--dse-select` (`#e0584b` dark / `#bd392c` light), the same colour on every rolled tier. Dark text contrast is **2.49:1**; light is 5.55:1. Recorded as INFO-1.

## Fix verification (re-ran my r3 probes against 12aad64)
- **HIGH-1: FIXED.**
  - Probe `p6_second` (statblock default fixture): after A is rolled with an edge and its strip opened, B's first click gives `aria-expanded="false"`, summary "none", and breakdown `2d10 [5, 7] = 12, +2 bonus → 14` (no edge). It was "1 edge", expanded, and "+2 edge" at r3.
  - Code: `renderFeature.ts:544-570` (`namespacedRoll`, `f<i>::`), `statblock/view.ts:470-498` (`rollIndices` via `configs.indexOf`), `featureblock/view.ts:188-200` (running offset), `renderFeature.ts:866` (nested call clears `rollIndices`, so keys compound).
  - The key scheme is stable across the `sbVillain` pref: both the banded and unbanded paths index into the whole list.
- **MEDIUM-1: FIXED.**
  - `rollBar.ts:207-213`, using `ownerDocument.activeElement` (popout-safe).
  - Probe: before Reset, focus is on `BUTTON[Reset modifiers]`; after Enter it is on `BUTTON.dse-collapse__header`, in dark and light.
- **LOW-1: FIXED.** `p2_geom`: Reason, Edges and Banes ± buttons all have top 362 (was 365/362/362). Evidence b and f are level.
- **LOW-2: FIXED.** The Reset icon sits flush with the caption and checkbox column in evidence b, f and g.
- **LOW-3: FIXED.**
  - Evidence g/h (300px card): Roll and "Modifiers" share one row, with the summary wrapped beneath.
  - "19–20" is unbroken (`.dse-rollbar__nowrap`).
  - The checkbox sits on the label's first line (grid, `align-items: baseline`).
  - The textContent of the label is unchanged, so label-in-name holds.
- **LOW-4: FIXED.** `roll/view.ts:79`: `mainAction: last?.mainAction ?? model.mainAction`. The jest test fails on the reverted file.
- **LOW-5: FIXED.** The DESIGN.md carve-out now reads "every modifier that differs from its default, plus the characteristic".
- **Unchanged-behaviour spot checks:**
  - With rolling OFF a card has 0 roll DOM.
  - With rolling ON at rest: 1 launcher and no bar. The first click rolls and shows the strip collapsed.
  - A tier-row click still rolls.
  - Reroll uses the current bar state.
  - Print: the strip is `display: none` in both the twin and real `@media print`.

## Findings

### LOW-1 — the statblock villain-band `rollIndices` branch has no test (non-blocking; recommend folding the test in)
- **The gap:** `statblock/view.ts:470-498`. With `statblock/view.ts` reverted to 24e5a1e (keeping the new `renderFeature.ts`), `feature-roll.test.ts` still passes, 19/19 (`sc279-r5-logs/neg-sb-indices.log`). Neither the statblock test fixture nor any harness fixture has a *rolling* villain action, so the rest-list vs villain-band collision (both calls start at `f0`) is never exercised.
  - `sbVillain` defaults to `banded` (`prefs/catalog.ts:451`), so this is the default path for real villain statblocks.
- **The code is correct.** My scratch test (statblock with a rolling "Main action" ability and a rolling `cost: Villain Action 1` ability):
  - roll A with an edge and expand its strip;
  - click the villain's dice: its strip stays collapsed with no edge.
  - It passes on 12aad64 (`villain-fixed.log`) and fails on the reverted `statblock/view.ts` with `Expected "false" / Received "true"` (`villain-reverted.log`).
  - The scratch file was deleted afterwards and the tree is clean.
- **Fix:** add that test to `test/dom/elements/feature-roll.test.ts` beside the HIGH-1 cases. The source shape is in this report's log dir: `sc279-r5-logs/villain-fixed.log` has the run, and the test body is reproduced below.
  ```
  features:
    - {type: feature, feature_type: ability, name: Rest A, usage: Main action, effects: [{roll: Power Roll + 1, tier1: One., tier2: Two., tier3: Three.}]}
    - {type: feature, feature_type: ability, name: Villain V, cost: Villain Action 1, usage: "-", effects: [{roll: Power Roll + 1, tier1: One., tier2: Two., tier3: Three.}]}
  ```
  - Launches: [0] = rest, [1] = inside the band's `.dse-collapse__region`.
  - Steps: A opens its strip, adds an edge, and rolls. Then the villain's first click is made.
  - Assertions: the villain strip has `aria-expanded === 'false'` and its summary does not contain "edge".

### INFO-1 — the rolled tier-row fill is pre-existing and has low text contrast in dark (owner's addition; it is not caused by this branch)
- **Pixel-sampled at the same place:** r1 render at f8693b5 (`sc279-shots-r1-1792194134/sc279-card-rolling-on-clicked-dark.png`, rolled tier 1) vs r4 evidence c (rolled tier 2). The fill is **identical, rgb(224,88,75)**, in both.
- **The branch doesn't touch it:** the `styles-source.css` delta f8693b5..12aad64 has 0 lines touching `roll-result`, `--dse-select` or `.dse-pr__row`.
- **Live computed values** (`sc279-r5-logs/hitrow.log`):
  - The active row paints `--dse-select`: `#e0584b` in dark, `#bd392c` in light (`styles-source.css:14703`, light twin ~:14724).
  - It is the same fill whatever tier was rolled. It is near-identical to `--dse-tier-low` (`#e74c3c` / `#c0392b`), so a rolled tier 2 or 3 *reads* as tier 1. The tier badge and the dimming of the other rows are the only other cues.
  - **Text contrast:** dark row text `rgba(220,226,230,0.88)` composites to (220,209,211) on (224,88,75) = **2.49:1**, which fails WCAG 1.4.3 (4.5:1). Light: white on `#bd392c` = **5.55:1**, which passes.
  - Since Scott is colorblind, a red-family "you rolled this" fill that collides with the tier-1 hue is worth a follow-up ticket (ink/fill token change, outside SC-279's scope).

### INFO-2 — the superproject pointer is bumped
`a2740db` also moves the `draw-steel-elements` pointer from f8693b5 to 12aad64. The r4 report says "pointer not bumped", but the worktree superproject is now clean at a2740db. This is harmless and in fact what landing needs; it just disagrees with the report.

### INFO-3 — DESIGN.md line length
The edited carve-out sentence in `DESIGN.md` (~:437) is one long unwrapped line among 100-col prose. Cosmetic.

## Artifacts (all under /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/)
- **Battery logs:** `sc279-r5-logs/` — tsc, lint, jest, lifecycle, shots, freeze, parity (each `.log` + `.exit`), `hash.txt`, `new-ids.sha256`.
- **Revert-probe logs:** `neg-high1`, `neg-med1`, `neg-low4`, `neg-fb-indices`, `neg-sb-indices`, `villain-fixed`, `villain-reverted` (`.log` + `.exit`).
- **Probe logs:** `villain-probe.log`, `hitrow.log`.
- **Re-run r3 probes:** `sc279-r5-probe-1792200270/sc279-r3-probe.json` (+ png), `sc279-r5-probe2-1792200270/sc279-r3-probe2.json` (+ `sc279-r3-checked-{dark,light}.png`).
- **New probe scripts:** `sc279-r5-probe-villain.mjs`, `sc279-r5-probe-hitrow.mjs`.
