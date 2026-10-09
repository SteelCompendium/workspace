# SC-379 slice 1 — independent review report

**Executive summary**
- **VERDICT: FIX ROUND NEEDED.** Counts: HIGH 0 · MEDIUM 3 (2 are slice-1 fixes, 1 is pre-existing and routed to slice 2) · LOW 2 · INFO 4.
- Range `1ac4e5a..1d98148` (dse `sc379-negotiation`), 4 production commits. I re-ran every gate myself, and they match the implementer's numbers. tsc and lint are clean. jest **4292 passed / 1 skipped**. Lifecycle **19/19**. Shots **552**, 0 FAIL. Freeze **`FREEZE VIOLATED (6 checksum mismatches, 0 missing)`**, all of them `negotiation*`, and they are byte-identical to `sc379-s1-moved-hashes.txt`. Parity **0 / 0 / 24**.
- **M1 (fix):** in print, both rails run through every seal's numeral. The marks are transparent in the base tier. This affects all 6 lines going to Scott's sanction ask, and the new ids.
- **M2 (fix or rule):** on a coarse pointer, the Patience seals dropped from the 44 px touch box to about 30 px wide and about 26 px at 300 px. The retargeted D-2 pins in `controlDensity.test.ts` now check rail geometry, not hit size or density, so nothing guards this.
- **M3 (pre-existing → slice 2):** after a live→live Complete Argument, the argument tab is stale. The checkboxes stay ticked and the tier stays checked while the model has already reset. SC-340 adoption means there is no echo rebuild to clear it.
- **What I verified as correct:** the `track()` API and ARIA; arrows, Home, End and wrap; the ended band (all 3 kinds); Reset; the tabs while ended; the clamp sweep, which tried 8192 renders and 5376 Completes with 0 out-of-range numeric writes; YAML bytes identical to the base model; two-block and prose integrity; the 300 px rail with no overshoot; light and dark both look good.

## Findings

### MEDIUM

**M1 — Print: both rails strike through every seal's numeral (all print captures, incl. the 6 lines headed for the sanction ask).**
- Where: `styles-source.css:14476` (`.dse-track__mark`, base tier) has no background. Only the Steel tier makes it opaque, at `:14575` (`[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-track__mark`). The base rails, `.dse-track__rail` (`:14432`, 2 px dashed `--dse-border`) and `.dse-track--vertical .dse-track__slot::before` (`:14528`, 2 px `--dse-border`), run through the mark centres. In print, both are visible through the transparent seal.
- Evidence: `sc379-s1-review-default-print-zoom.png` (twin `negotiation--steel-print.png`) and `sc379-s1-review-ended-realprint-zoom.png` (`negotiation-ended--steel-realprint.png`). Dashes cross "0 1 2 3" on the Patience row. A grey vertical line runs through "5 4 3 2 1 0" on the Interest board.
- Failure scenario: slice 2's sanction ask would show Scott, and pin, print output whose numerals are struck through. A Director printing the sheet gets the same thing.
- Fix: add an opaque knock-out to the base tier, `.dse-track__mark { background-color: var(--dse-surface); }`. That is the same token the root plate grounds itself on in the base tier (`:2504`), so this adds no new colour, only structure. Alternatively, draw the rail geometry around the mark. Then re-run shots. Only the `negotiation*` print lines and the new ids should move, and those are moving anyway. The spec's §1 "Print/base layer" list omitted this, so the implementer followed the spec. The gap is in the spec.

**M2 — Coarse pointer: the Patience seal hit box regressed from 44 px to ~30/26 px; the retargeted D-2 pins no longer measure hit size.**
- Before: `.dse-nt__bubble` under Steel read `--dse-control-min`, which is 1.75 em on a fine pointer and `--dse-touch-min` 44 px under `@media (pointer: coarse)` (`:11294-11300`). The old D-2 tests pinned exactly that.
- Now: `.dse-track--horizontal .dse-track__slot` (`:14469`) is a fixed `--dse-track-mark` box: 1.9 em (`:14408`, about 30 px) and 1.6 em at ≤420 px (`:2674`, about 26 px, measured from the narrow PNG). It has no coarse-pointer twin. `manifest.json` has `isDesktopOnly: false`.
- The Interest rows are full-width and about 43 px tall, so they are fine.
- `controlDensity.test.ts:217-230` now asserts three things:
  - the legacy rules are evicted;
  - the vertical rail's `left` calc names `--dse-track-pad-x` and `--dse-track-mark`;
  - first and last rows stop at 50%.

  None of these is a density or hit-size contract. All three would stay green if the seals shrank to 10 px or ignored `pointer: coarse`. That is not what D-2 meant, so the retarget the owner ruled "ACCEPT" pending this check does not hold.
- Failure scenario: Obsidian mobile on a phone, which is the 300 px case. Six 26 px Patience targets with about 12 px gaps sit below the plugin's own 44 px touch floor. They do still meet WCAG 2.5.8 AA at 24 px.
- Fix (preferred): give the horizontal slot a pointer-aware hit box that is separate from the visible mark.
  - In the Steel tier: `min-width/min-height: var(--dse-control-min)`, with the mark centred inside.
  - Key the rail insets to half the slot box.
  - At ≤420 px, let the slot shrink to the pitch (about 36 px at 300 px coarse) and never below `--dse-track-mark`.
  - Re-pin D-2 as "the horizontal seal's hit box reads `--dse-control-min`, so `pointer: coarse` reaches it".
- Alternative: the owner accepts this explicitly, recorded with that rationale ("AA 2.5.8 met; touch floor waived for the seal row"), and the D-2 describe is renamed so it stops claiming density.

**M3 — Pre-existing, route to slice 2: the argument tab goes stale after a live→live Complete Argument.**
- Where: `ArgumentView.ts:308-331`. `completeArgument` resets `currentArgument` and calls `refreshStanding()`. That call reaches `setEnded`, which is a no-op while the ended state is unchanged (`:72-73`). So the checkboxes, the checked tier radio and the tier texts are never re-synced.
- The header comment at `:10-14` ("leaves the checked radio for the echo-rebuild to clear") is no longer true in real Obsidian. SC-340 adopts the writer's own echo without rebuilding (`registerFrameworkElements.ts:62-70`, `adoptView.ts:96-115`).
- Probe output (`sc379-s1-review-probe.log`): `STALE cbChecked=true modelMotivationsUsed=[] tierStillChecked=true completeDisabled=true`.
- Failure scenario: on the next argument, the Director sees "Higher Authority" still ticked, but the model has no motivation in it. Unticking does nothing, because `indexOf` returns -1. Re-clicking the still-checked tier is a no-op, so Complete cannot be re-armed without first picking a different tier.
- The base had the identical behaviour, and slice 1 fixed the standing-region half of it, so this is not a slice-1 regression. Fix (slice 2, alongside fix 2's recompute machinery): on Complete, re-sync the chips and modifiers in place and remount the roll with no selection. Add a test.

### LOW

**L1 — A quoted or non-numeric authored standing defeats the clamp: it writes `.nan` or a false deal.**
- Where: `NegotiationData.ts:321-323` (`clampStanding` does no coercion) and `ArgumentView.ts:316-321` (`+` on the raw field).
- Probe output (`sc379-s1-review-probe-quoted.log`):
  - `current_interest: "3"` plus a +1 tier computes `"31"`, which clamps to **5**, so the tracker shows a deal.
  - `current_patience: "2"` with -1 computes `"2-1"`, which becomes NaN and is written as **`current_patience: .nan`**. The readout then shows 0.
- The string concatenation is pre-existing (the base wrote `"2-1"`). But fix 1's contract, "never write a value outside 0–5", is broken by `.nan`, and the clamp now turns garbage into a plausible wrong number.
- Fix: apply `Number(...)` before the arithmetic. Make `clampStanding` return a finite value; for a non-finite input, keep the current value or use 0, which is the owner's call. Add one test.

**L2 — Two clamp tests pass with the clamp deleted.** `negotiation.test.ts:957-978`: "a +1 never carries Interest past 5" runs 4+1=5, and "a pitfall never carries it below 0" runs 1-1=0. Neither needs the clamp. Only `:939` (a lie at Interest 1 → would write -1) exercises it through the UI. Through the UI, the upper clamp can only be reached from a non-integer authored value (for example 4.5 plus a crit). Fix: retitle them, or replace them with 4.5 + crit → 5 and a lie at 1 with tier 2 (would be -1) → 0.

### INFO

- **I1 — Screen captures now taller than the 1200 px viewport.** `negotiation`, `-checked` and `-pr-checked` steel-dark and steel-light are now 1232 CSS px tall, so the bottom 32 px is cut. At base they were 1175 px and complete. `negotiation-ended` is cut 146 px early, inside the dossier. The band and the disabled Complete with its over-hint are **inside** the captured region (verified on the PNG: `sc379-s1-review-ended-dark-bottom.png`). The print captures are all under 1200 px and complete, except `negotiation-narrow` print at 1312 px, which falls under the SC-349 ruling. These lines are not frozen. Slice 2 changes the dossier height, so re-check then.
- **I2 — Non-numeric Interest.** `current_interest: lots` renders the Interest 0 row with "now" and no band, because `ending()` is null while the board shows 0. This is a harmless edge case and folds into L1's fix.
- **I3 — The lifecycle gate does not exercise negotiation.** Its 19 scenarios are generic. The negotiation-specific write-integrity proof is jsdom: the existing `:789` test plus my two-block probe.
- **I4 — Host-leak sweep coverage.** It went from 114 to 113 kinds because the bubble kinds were removed. The track slot is sampled as one kind, `negotiation|dse-track__slot`, because the key does not distinguish `data-current`. It passed.

## What was probed and holds (cite)

- **A. `track()`** (`src/framework/kit/track.ts`)
  - The API matches spec §1, with an added `owner` parameter.
  - It is a real `radiogroup` of `<button type=button role=radio aria-checked>` with roving `tabindex` (`:106-118`).
  - Left/Up and Right/Down follow DOM order and wrap; Home and End work (`:134-160`).
  - Selection follows focus, with one `onChange` per move.
  - Clicking the current slot is a no-op (`:123`).
  - `disabled` produces real disabled buttons with no listeners (`:101`, `:130`).
  - `data-fill`, `data-current` and `data-edge` hooks are present.
  - State never relies on hue alone: filled vs dashed, a ring, the "now" tag and weight.
  - `track.test.ts` has 17 tests, and they assert all of this; it is not a vacuous suite. The disabled-click half of one test is weak, because jsdom never dispatches click on a disabled button, but the keydown half proves there are no listeners.
- **B. Standing region**
  - Writes go only through `setPatience`/`setInterest` → `persist()` (`PatienceInterestView.ts:102-106`, `:141-145`). `EndBandView` never writes, and rendering performs zero writes (probe: hand-edited and out-of-range renders → 0 `replaceSource` calls).
  - The Interest `aria-label` is `Interest {n}: {offer}` (`:130`).
  - The rail is drawn per row and does not overshoot at 300 px (`sc379-s1-review-narrow-{dark-top,light}.png`). The first row starts at seal 5's centre and the last ends at seal 0's centre.
- **C. Ended**
  - final, deal and hostile each set `data-ended`, the band label and text, and the now-tag (`⚑ final offer` / `⚑ outcome`).
  - Complete is real-disabled with the over-hint, and the roll is static.
  - Tabs switch while ended. ⋮ → Reset clears the band for all three kinds (probe).
  - Moving off the ending re-arms the roll in place.
  - Patience 0 shows as current (teal), which matches the mock's `current: i === m.patience`.
- **D. Clamp sweep**
  - Coverage: Interest and Patience in {0, 0.5, 1, 2, 3, 4, 4.5, 5}, × 32 modifier combinations, × 4 tiers.
  - Result: 8192 renders and 5376 Completes; 1022 of them would have overflowed Interest. 0 out-of-range numeric writes. Complete was never armed while ended.
  - The model gained methods only. The own keys are the legacy 14 plus the pre-existing `_dse_anchor`.
  - `stringifyYaml` output is identical between the **base** `NegotiationData.ts` (`git show 1ac4e5a:`) and the branch for `example.yaml`, `fixture-ended.yaml` and frodo, including after a mutate+reset.
  - An `example.yaml` render followed by seal 1 → 3 writes base-model bytes.
- **E. Integrity**
  - Setup: one note containing prose, a ` ```ds-nt ` block, more prose, a ` ```ds-negotiation ` block, then prose.
  - Clicking seals in B left A byte-identical and kept all the prose. Clicking a seal in A afterwards kept B's write. There was no cross-talk in `data-ended`.
  - Hand-edited values are honoured on re-render. Interest 9, Patience -3 and Interest -1 are clamped for display and **not** rewritten.
- **F. CSS**
  - No new `rgba(` or `#hex` literals. Every new `font-size` is a `--dse-fs-*` role (11 declarations), and the `fontSizeContract` suite is green.
  - Every Steel rule carries `:not([data-dse-print="on"])`.
  - The freeze set is exactly the 6 `negotiation*` lines and reproduces the implementer's after-hashes byte-for-byte, so it is deterministic across 2 independent sweeps.
- **G. Tests**
  - jest re-run green (`rm -f main.js styles.css` first).
  - Most of the new negotiation tests are substantive. The exceptions are L2, and the D-2 retarget under M2.
- **H. Captures**
  - `negotiation-ended` (fixture map) and `negotiation-narrow` (`NARROW_SHOTS`, `checked`, 300 px) are present in `entry.ts`.
  - Colours, in words:
    - **Dark:** silver seals for the Patience left; hollow dashed grey seals for spent; the current seal is solid teal with a teal ring. The band has a gold top rule, a gold flag and gold small-caps label, and near-white text.
    - **Light:** gunmetal seals; the current seal is dark teal; the band label is dark bronze.
    - **Both:** in the light theme, the non-current offer text is mid grey, and the spent numerals are faint by intent. The dashed border also carries the spent state. I saw no clipped text or misaligned seals in the standing region.
    - **Known:** at 300 px "Higher Authority" still wraps letter by letter in the argument tab. That was ruled into slice 2.

## Gate lines I measured (worktree `sc379-negotiation`, dse `1d98148`, load ~1.5)

| Gate | Line | Log |
|---|---|---|
| tsc | clean, exit 0 | `sc379-s1-review-tsc.log` |
| lint | clean, exit 0 | `sc379-s1-review-lint.log` |
| jest | `Test Suites: 1 skipped, 215 passed, 215 of 216 total` · `Tests: 1 skipped, 4292 passed, 4293 total` | `sc379-s1-review-jest.log` |
| lifecycle (`DSE_LIFECYCLE_PORT=9293`) | `OBSIDIAN-LIFECYCLE done: 19/19 ok, 0 failed`, exit 0 | `sc379-s1-review-lifecycle.log` |
| shots | 552 PNGs, 0 FAIL; host-copy pin OK; `SC-127 light island OK`; button host-leak OK (113 kinds, 678 comparisons); `print-twin delta OK (137 capture ids …)` | `sc379-s1-review-shots.log` |
| freeze | `FREEZE VIOLATED (6 checksum mismatches, 0 missing)`. The 6 lines are `negotiation`, `negotiation-checked` and `negotiation-pr-checked`, each as `--steel-{print,realprint}`. `sha256sum -c sc379-s1-moved-hashes.txt` → 6/6 OK | `sc379-s1-review-freeze.log` |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, exit 0 | `sc379-s1-review-parity.log` |
| reviewer probes | 9/9 + 1 (quoted) pass; output lines quoted above | `sc379-s1-review-probe.log`, `sc379-s1-review-probe-quoted.log` |

Working tree: `git status --porcelain` was the same before and after. The plugin is clean. The superproject showed ` M draw-steel-elements` both before and after, and that was pre-existing. Probe sources are under `sc379-s1-review-probe/` in the ledger dir, not in the repo.
