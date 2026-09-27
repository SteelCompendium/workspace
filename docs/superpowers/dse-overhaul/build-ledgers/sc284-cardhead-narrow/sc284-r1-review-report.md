# SC-284 round 1: independent review

**Verdict: APPROVE_WITH_FIXES.** Findings: 0 CRITICAL, 0 HIGH, 1 MEDIUM, 3 LOW, plus INFO notes.
- Reviewed DSE `97aa19a` (base `6c4f6aa`). The tree was clean before and after the review, and every probe edit was reverted.
- Battery: tsc clean (0). Lint clean (0). Jest 3999 passed, 1 skipped, 206 of 207 suites. Lifecycle `6/6 ok, 0 failed`. Shots 532 PNGs, 0 FAIL, identical across 2 runs. Parity 0 gaps, 0 undeclared, 16 declared, exit 0.
- Freeze against the live baseline: `FREEZE VIOLATED (6 checksum mismatches, 0 missing)`, exit 1. These are exactly the 6 lines in `rebaseline.txt`.
- Freeze with the rebaseline applied to a temp copy: `freeze OK (260/260 …)`, exit 0, in both of my shots runs.
- The rebaseline reproduces byte-for-byte. Its "before" hashes equal the live baseline. When I reverted the CSS, all 6 lines returned to the live-baseline hashes.
- MEDIUM-1: the featureblock sub-feature heads (the per-option cost, e.g. "3 MALICE") do not stack. A Steel `grid-area` override outranks the container rule, so the old squeeze partly remains. The new `featureblock-narrow` shot and the evidence composite show this state as the "after".
- Containment claim: false on the Obsidian runtime floor (Electron 21.4.1 / Chromium 106). Layout containment IS applied there. The side effects are harmless: geometry is identical at note width in real Obsidian. The paint differs below visibility.
- Montage and negotiation flex items were probed with long and unbreakable titles at 300, 420, 700 and 900px. Head widths are identical to base and nothing overflows.
- `origin/develop` has moved to `619c4bd` (SC-340). The only file overlap is `CHANGELOG.md`, in non-overlapping hunks. The branch needs a rebase and a battery re-run before landing.

---

## MEDIUM

### MEDIUM-1: featureblock sub-feature heads skip the narrow form, and lose their name/cost gutter

- **Where:** `styles-source.css:7889` (`[data-dse-theme='steel'] .dse-fb .dse-feature > .dse-head > .dse-head__eyebrow--right { grid-area: 2 / 3; … }`) and `:7901` (`… > .dse-head__primary--right { grid-area: 3 / 3; }`).
  - Both have specificity (0,4,1). The new `@container dse-head` arms at `:13694` are single-class (0,1,0), so their `grid-area` loses.
  - The container rule's `justify-self: start; text-align: left; margin-left: 0` (`:13704-13710`) still wins, because the override does not set those properties.
- **Measured in the harness at a 300px mount, `featureblock/stats`:**
  - The sub-feature head's right eyebrow ("3 Malice") stays at row 2 / column 3, with `justify-self: start`.
  - The name "Blood Debt" is 81px wide over 2 lines. The name's box ends at x=194.41 and the cost box starts at x=194.41: a 0px gutter, where base had the 1.5em margin.
  - `featureblock/default` "Resonating Croak" still wraps to 3 lines at 81px.
  - This is the same at 400 and 480. The fixture-wide probe flags it as NOTSTACKED for every featureblock fixture.
- **Measured in real Obsidian (right sidebar at 300px):** the nested fb head is 168px wide. Its name is 49px wide and 62px tall (3 lines), and the cost stays in column 3.
- **Failure scenario:** someone pins a featureblock (e.g. a malice fixture) in a sidebar leaf. Every option whose head has a cost still shows the ticket's squeezed name: "BLOOD / DEBT … 3 MALICE", and longer names wrap harder.
  - v2 has no such override. Its mini rides the right-primary lane and stacks at 5/2 under `@media (max-width: 30em)` (`v2/docs/stylesheets/steel-cardhead.css:155-165`). This is a parity miss.
  - The CHANGELOG bullet (`CHANGELOG.md:25`) names featureblock as fixed.
  - The evidence composite's featureblock row shows the unstacked cost as the "after" (`evidence/sc284-featureblock-narrow-after.png`, lower card).
- **Prescribed fix:** add a matching-specificity arm inside the existing `@container dse-head (max-width: 480px)` block. It mirrors the Steel lane mapping (the mini rides the primary lane, and the primary rides the deck lane):
  ```css
  [data-dse-theme='steel'] .dse-fb .dse-feature > .dse-head > .dse-head__eyebrow--right { grid-area: 5 / 2; }
  [data-dse-theme='steel'] .dse-fb .dse-feature > .dse-head > .dse-head__primary--right { grid-area: 6 / 2; }
  ```
  - This is structure tier and reaches print. No frozen capture has a `.dse-fb` at a head width of 480px or less, so I expect 0 frozen bytes to move. Re-run the freeze to confirm.
  - Extend the jest contract with one assertion: this selector appears inside the `@container dse-head` block. The current test is a text match on the single-class arms, so it cannot see a specificity loss.
  - Regenerate `sc284-featureblock-narrow-after.png` and the composite.
  - This is outside the SC-231 fence (`.dse-feature__kw*`, `__meta-cell--keywords`, `__meta-value`, `renderFeature.ts`), so no overlap.

## LOW

### LOW-1: "inline-size containment only, not layout" is false on the Obsidian runtime floor. Comment and report accuracy only.

- **Claim:** implementer report §2 ("Footgun probes explicitly ruled out").
- **Spec and Chromium status:** current Chromium (the harness's Playwright build, 149.0.7827.55) no longer applies layout containment for `container-type: inline-size`. Obsidian's shipped runtime does.
  - `/opt/Obsidian` is Electron 21.4.1 / Chromium 106.0.5249.199. The asar self-updates (1.14.2), but Electron does not. Lifecycle ran on this binary.
  - The repo already documents this at `styles-source.css:1727-1730` and `:11631-11633` ("`inline-size` establishes layout, style and inline-size containment").
- **Probed on the same synthetic DOM in both engines** (`normal` vs `inline-size`):

  | Effect | Chromium 106 (real Obsidian) | Chromium 149 (harness) |
  |---|---|---|
  | abspos child becomes contained | yes (x 5 → 105) | no |
  | fixed child becomes contained | yes (x 7 → 107) | no |
  | Baseline of a flex item suppressed | yes (neighbour moves 181 → 189) | no |
  | Shrink-to-fit parent collapses the item | yes (107.6 → 0) | yes (107.6 → 0) |

- **Consequences checked for `.dse-head`:**
  - Every abspos descendant of a head already has a positioned anchor at or inside the head: `.dse-sb[data-dse-role] > .dse-head` `:9444`, `.dse-fb > .dse-head` `:9557`, `.dse-crest` `:13920`.
  - There are no fixed descendants. No head parent aligns on baseline. No z-index is set inside heads.
- **Real-Obsidian A/B at note width** (700px main leaf, branch vs `container-type` forced off, with a noise control where base vs base was byte-identical):
  - Geometry is identical for every head and every child rect in statblock (9 heads), featureblock (3), montage and encounter.
  - Montage is pixel-identical.
  - Statblock, featureblock and encounter are **not byte-identical**. The differences are glyph antialiasing and gradient dithering inside the head bands (statblock: 46,345 of 700,000 px differ; max channel delta 216 on glyph edges). This is consistent with the head becoming its own stacking context or paint layer. I found the result invisible on side-by-side inspection (`scratchpad/rv1/ab3-notch.png`).
  - The claim "pixel-identical to 6c4f6aa at normal width" is therefore true in the harness but not in Obsidian. Freeze cannot see this, because the harness engine lacks the containment.
- **Fix:** no code change. Correct the `container-type` comment at `styles-source.css:13589-13593` to state that on the Electron 21 / Chromium 106 floor this also applies layout and style containment. Say why that is safe: every abspos anchor inside `.dse-head` is already positioned, and no head is shrink-to-fit. Cite the stamina comment at `:11631`. Also correct the claim in the report.

### LOW-2: the CHANGELOG and CSS comment describe the symptom backwards

- **Where:** `CHANGELOG.md:27-28` ("the header's right-rail text used to wrap one word per line") and `styles-source.css:13589-13590` ("the third (right-rail) column starves its `auto` track down toward min-content").
- **Measured at 300px on base:** the right rail stays on one line at its max-content width. It is the **name** track (`minmax(0,1fr)`) that starves:
  - statblock "Human Bandit Chief": 73.6px, 5 lines.
  - Nested statblock ability names: 0px wide, up to 21 lines.
  - `feature/default`: 0.36px, 14 lines.
  - class "Tactician": 35.6px, 4 lines.
  - encounter "Ambush at the ford": 79.7px, 4 lines.
- **Fix:** reword both to say the right rail keeps its content width and squeezes the name column, so the NAME wrapped a word or letter per line. Scope the CHANGELOG's "featureblock" claim once MEDIUM-1 is fixed, or keep it only if it is.

### LOW-3: the `statblock-sticky-narrow` rebaseline crop does not show the stacked result

- **Where:** `evidence/sc284-rebaseline-statblock-sticky-narrow-print-crop.png`.
- This capture is a scrolled state, so the top head is off-screen. The visible delta is (a) all content shifted down about 55px and (b) the nested "Whip and Magic Longsword" head restacking.
- The crop cuts off at the name. The after panel never shows the "Signature Ability" chip in its stacked position, so a sanction reader sees only a shift.
- The full before/after PNGs (`…-print-full-{before,after}.png`) do show it clearly: the name goes from 5 lines at letter width to 2 lines, and the chip moves under it.
- **Fix:** recrop to about y=0-500 of the full images, with a note: "top head is above the capture (scrolled state); content moved 55px down because it got taller".

## INFO

- **Rebaseline verification** (brief §4, parts a-d):
  - (a) The live freeze fails on exactly `encounter-narrow`, `montage-narrow` and `statblock-sticky-narrow`, twin and realprint each, and nothing else. This held in 2 full shots runs.
  - (b) `rebaseline.txt` reproduces byte-for-byte from both of my runs (`sha256sum` diff empty).
  - (c) The "before" hashes are the live-baseline lines (baseline `f746e373…`, unchanged by me). With the CSS reverted to `6c4f6aa`, all 6 re-shot files check OK against the live baseline, and the three `print-full-before.png` evidence files match byte-for-byte.
  - (d) The encounter and montage crops show only the stacking, and everything below it shifts down. For statblock-sticky, see LOW-3.
- **Twin vs realprint:** the twin and realprint hashes differ within each pair. This is expected since SC-202 (option C); in-run `print-twin delta OK (132 capture ids …)`.
- **Evidence provenance:**
  - All `*-narrow-after.png` and `*-wide-after.png` files are byte-identical to my branch shots.
  - All three `*-narrow-before.png` files are byte-identical to shots taken with the CSS reverted to `6c4f6aa`.
  - The three `print-full-after.png` files are byte-identical to my run-2 print shots.
- **Tests are not vacuous:**
  - With `6c4f6aa`'s `styles-source.css`, `cardHead.test.ts` fails the 2 new tests (21 of 23 pass).
  - Reverting the CSS moves the new narrow shots back to the "before" bytes.
  - Caveat: the new narrow shots are not frozen, so they are a visual guard only. The byte guard is the 3 frozen narrow pairs.
- **Fixture sweep (Chromium 149 harness),** covering every element × fixture with a `.dse-head`: 20 elements, 308 records. Widths were 300, 400, 480, 481, 520, 700 and 900, comparing branch against base (`container-type` forced off).
  - At 700 and 900 every fixture is pixel-identical and rect-identical.
  - At 481 and 520 (head width under 480) 21 fixtures stack, which is expected.
  - At 300 every right-rail head stacks at column 2, rows 4-6, left-aligned. The exception is MEDIUM-1.
  - No head overflows: `scrollWidth` equals `clientWidth`, and no child extends past the head's right edge.
  - No `.dse-head` is nested inside another `.dse-head`, so the query always resolves against the slot's own head.
  - The only unnamed `@container` query (`:5934`, hero grid) has no subject inside a head. No `cq*` units exist.
  - An emulation of the 106 containment (`contain: layout style inline-size` injected) keeps rects identical at 700 and 900 on screen and print for all 44 element×fixture pairs.
- **Threshold:**
  - The 480px threshold is compared against the head's content box.
  - In real Obsidian the head's font-size is 14.4px, so `30em` would have meant 432px there. Choosing `px` is sound.
  - Measured flip points in real Obsidian (right sidebar width): the top-level statblock head is stacked at 560 (head 506px border-box, padded band) and wide at 600. Encounter is stacked at 540 and wide at 600. Nested statblock ability heads stay stacked through 600 (445-468px).
  - Comment nit: v2's `30em` is 480px because media-query `em` uses the initial font size, not v2's root. v2's root is 20px per the gap inventory, so "at ITS default 16px root" is wrong wording for the right value.
- **Crest:** `grid-template-rows: auto auto auto` makes `grid-row: 1 / -1` span lanes 1-3 only. In the narrow form, rows 4-6 sit in column 2 with column 1 empty under the crest. This is identical to v2 (`steel-cardhead.css:16/32/155`), so it is parity-correct. Only the "crest keeps spanning every lane" wording (`:13689-13691`, report §1) is loose.
- **Print:**
  - The narrow form never fires at harness print width: 0 of the full-width frozen lines moved, and the print rects at 700 are identical.
  - It fires in the three 300px-pinned frozen captures by construction.
  - In a real PDF export it fires only if a head's content box is 480px or less (e.g. A5 pages, or nested ability heads on narrow pages). I think the stacked layout is the better one there.
- **Flex items (montage and negotiation):**
  - Probed with long and unbreakable titles at 300, 420, 700 and 900px. Head widths are identical to base in all 32 cases (montage 232/352/632/692; negotiation 202/322/602/662).
  - Negotiation's 24px menu button stays flush right. No row or card overflow.
  - The harness montage has no menu button mounted. Negotiation's real button covers the same `flex: 1 1 auto` shape.
- **Scope fences:** the diff touches only `CHANGELOG.md`, the cardHead block of `styles-source.css`, `test/dom/kit/cardHead.test.ts` and `visual-harness/entry.ts`. None of the fenced areas are touched. No `white-space: nowrap` rule targets any `.dse-head*` selector.
- **Pre-existing, not SC-284:**
  - The statblock fixtures overflow a 300px mount (`scrollWidth` 338 or 386 vs 300; characteristics row) on both base and branch.
  - Keyword meta cells wrap letter by letter (SC-231's area).
- **Develop drift:** remote `develop` is `619c4bd` (SC-340, 19 commits past `6c4f6aa`). `CHANGELOG.md` is the only overlapping file: develop edits lines 40-47, and the branch inserts at 25. Expect a clean rebase, then re-run the battery and freeze. I did not fetch into the worktree.
- **Shared checkout observation (not caused by this review):**
  - The main workspace's `draw-steel-elements` submodule shows modified content: `demo-vault/Welcome.md`, `justfile`, untracked `compendium-manifest.json` and `demo-vault/montage 1.md`.
  - Its reflog shows it was fast-forwarded to `619c4bd` at 10:09 -0400.
  - I never wrote there.

## Artifacts (all in the scratchpad; nothing written under `workspace/` except this report)

`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/rv1/`:
- **Gate logs:** `tsc.log`, `lint.log`, `jest.log`, `lifecycle.log`, `shots1.log`, `shots2.log`, `freeze-live.log`, `freeze-live2.log`, `freeze-rebased.log`, `freeze-rebased2.log`, `parity.log`.
- **Temp freeze copy:** `freeze-tmp/` (script plus baseline with the rebaseline applied, and `.orig`).
- **Non-vacuity runs:** `jest-revert.log`, `revert-shot-*.log`.
- **Fixture sweep:** `probe.mjs` → `probe.json`. The 106-containment emulation is `probe106.mjs` → `probe106.json` and `probe106print.json`.
- **Real Obsidian runs:** `obsprobe.mjs` / `obsprobe2.mjs` → `obsprobe.json` (containment table, sidebar width sweep, wide A/B). Screenshots: `obs-sidebar-300-{sb,mt}.png`, `obs-wide-*-{branch,base}.png`, `ab2-*.png`, `ab3-notch.png`.
- **Chromium 149 containment run:** `pwcontain.mjs` → `pwcontain.log`.
- **Flex-item probe:** `flexprobe.mjs` → `flexprobe.log`.
- **Visual composites:** `fb-narrow-before-after.png` (MEDIUM-1), `sb-mt-head.png`, `sticky-full.png` (LOW-3).
