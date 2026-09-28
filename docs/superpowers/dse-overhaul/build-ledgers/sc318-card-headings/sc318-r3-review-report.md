# SC-318 round 3: independent review of the Option A branch

## Executive summary

1. **Verdict: FIX-FIRST (evidence only).** The code is sound and can land as the proposal. Two things need fixing before Scott sees the ask: the Scott-facing evidence (MED-1) and one stale comment (LOW-3). I found no CSS correctness defect against the round-1 rulings.
2. **Findings by severity:** 0 HIGH, 1 MED, 3 LOW, 3 INFO. Two of the INFO items are pre-existing and each deserves a backlog ticket: the large-text knob does nothing, and screen margins differ from print at non-default text sizes.
3. **Owner's eyeball concern answered: the adjacency rule does fire.** The "Today" column in `r2-evidence/` is not develop.
   - Real `5a20d5f` build, "On Humans" h3: margin-top 18.72, rendered gap 18.72px.
   - Branch: 40 / 40. Print twin: 40 / 40. Screen now equals print.
   - The r2 "today" was simulated by injecting the old CSS. That left the branch's own adjacency rule (GROUP 1b) active, so the "today" gap was inflated to about 35.5px, which is why the two columns look alike.
4. **Screen == print at default text size.** It holds on every property A governs, across all 44 changed screen ids. Print diffs base→branch: **0**. Freeze **260/260** on two runs.
5. **Gates, all at `236d593`:**
   - tsc and lint clean.
   - jest 4142 passed / 1 skipped / 4143 total.
   - lifecycle 19/19.
   - shots 536, 0 FAIL, byte-identical across 2 runs.
   - parity 0 / 0 / 16 DECLARED.
   - The new tests fail on base CSS (37 red) and pass on the branch.
6. **Widening candidate hashes match the r2 file.** Both `perk-headings--steel-{print,realprint}.png` hashes were identical across my two clean runs: **y**.
7. **`.dse-hero__name` computed style is unchanged** in dark and light. The only differences are the 6 inherited `--dse-fs-h*` custom properties.

## Findings

### MED-1: the "Today" column in all r2 evidence is a simulation that the branch's own rules contaminate
- **Where:**
  - `r2-evidence/sc318-before-after.png` (ancestry row).
  - `r2-evidence/sc318-ladder.png` (Today column).
  - `r2-evidence/sc318-measure.txt` ("screen today" rows).
  - The method is stated at the foot of `sc318-measure.txt`: the old GROUP 1 text is injected as a later `<style>`.
- **Failure:**
  - The injection overrides only the six per-level rules. GROUP 1b (the adjacency bump at `:is(p,pre,table,ul,ol) + :where(hN)`, specificity (0,2,1)) and GROUP 1c/1d stay live. The injected old rules are (0,2,0), so they lose on `margin-block-start`.
  - The simulated "today" therefore shows the new 2.5-body-em bump computed at the old font sizes:
    - h1: 49.44px (real develop: 21.44).
    - "On Humans" h3: about 35.5px (real develop: 18.72).
  - The before/after then shows about a 2px shift where the real change is +21px. That is exactly what the owner's eyeball caught.
  - Scott would be deciding A/C/leave on a picture that understates A's spacing change.
- **Real measurements** (base = `git archive 5a20d5f` built independently; `r3-review/measure.json`, `sum-default.txt`):

  | heading | real develop screen mt / gap | branch screen | print twin |
  |---|---|---|---|
  | ancestry "On Humans" h3 (after `<p>`) | 18.72 / 18.72 | 40 / 40 | 40 / 40 |
  | perk "Familiar Statblock" h6 (after `<p>`) | 24.98 / 24.97 | 40 / 40 | 40 / 40 |
  | perk-links "Envoy's Charge" h2 (after `<p>`) | 19.92 / 19.91 | 40 / 40 | 40 / 40 |
  | class "Basics" h3 (after blockquote, no bump) | 18.72 / 18.72 | 16 / 16 | 16 / 16 |

  The previous paragraph's margin-bottom is 16px in all three columns, so the gap equals the heading's own margin-top after collapse.
- **Other evidence defects:**
  - `crops/` holds 11 files, not the 22 the report claims.
  - The ancestry row's crops are named `row-class-h3-basics-*`.
  - The hero and ancestry crops have stray text at their top edge.
  - The ladder composite cuts off the blockquote-h6 row, and its column labels cover the card eyebrow.
- **Fix:**
  - Regenerate every "Today" column from a real `5a20d5f` harness build: `git archive 5a20d5f`, symlink `node_modules`, copy `dist/obsidian-app.css`, run `node visual-harness/esbuild.mjs`. Then crop cleanly.
  - The ladder's Today column cannot come from develop, because the fixture doesn't exist there. Either inject the old rules **and also neutralize GROUP 1b** (for example `margin-block-start: revert-layer`, or inject at (0,2,1)), or render the ladder markdown into a develop perk body.
  - A correct reference crop is in `r3-review/ancestry-real-base-vs-branch-vs-print.png`: real develop, branch, and print twin, left to right.
  - Correct the "today" rows of `sc318-measure.txt`.

### LOW-1: the two "kept" pins changed line-height (unreported)
- **Where:** `styles-source.css:17144` (h3 `line-height: 1.3`) and `:17151` (h4 `line-height: 1.4`). They reach `.dse-skills__group-title` (h3, pin at `:3409/:3418`) and `.dse-mt__guide-title` (h4, pin at `:4117/:4797`). Those pins declare no line-height, so they previously inherited 1.5.
- **Measured** (full computed diff, `r3-review/probe-fullcs.log`):
  - Skills group title: line-height 21.6 → **18.72px**, box 21.61 → 18.72px tall.
  - Montage guide title: 20.4 → **19.04px**.
  - Every other computed property on both is unchanged.
- **Effect:** screen-only pixel moves in the montage ids (unfrozen), which is why the sweep shows 44 changed screen ids against the survey's 32. The ruling said "Keep the existing pins", and the r2 report says they were "kept untouched". The font-size pins did hold.
- **Fix, owner's choice:**
  - (a) Disclose it as an accepted side effect in the ask, or
  - (b) Restore the previous value with `line-height: inherit` on the two pin rules. That also needs specificity above (0,2,0) or a place inside GROUP 1c.

### LOW-2: the blockquote-h6 ability header (the new fixture's second shape) breaks screen == print, and is not in the r2 measure table
- **Where:** `styles-source.css:16684` (SC-202 GROUP 5, `:where(blockquote) > :first-child { margin-top: 1em }`, (0,3,0)).
- **Measured** (`perk:headings`, "Ability Header" h6):
  - Screen margin-top **16px**. Print twin and realprint: **0px**, from Obsidian's `.markdown-rendered blockquote > :first-child`.
  - Develop screen was 10.72 against print 0, so the mismatch is pre-existing and comes from GROUP 5, not from A's rules.
- **Why it matters:** this shape ships in 20 files (complication, title and treasure ability headers). The fixture was added to cover it, yet `sc318-measure.txt` reports only the h1–h6 ladder and says "screen == print on every property".
- **Fix:** add the row to the measure table and to the ask as a known out-of-scope divergence. File a backlog ticket if Scott wants blockquote-first-child margins aligned. This is not a blocker for A.

### LOW-3: a stale comment contradicts the accepted deviation
- **Where:** `styles-source.css:6307` says "`UA_RESTATEMENTS` (now empty — these tokens replace it)". `test/unit/build/fontSizeContract.test.ts:251` keeps one entry (the `.dse-hero__name :: 1.5em` pin, accepted by the round-2 owner ruling).
- **Fix:** reword to "reduced to one entry (the `.dse-hero__name` pin)".

### INFO-1 (pre-existing; file a backlog ticket): the Large text size pref is a no-op for every `--dse-fs-*` token, old and new
- **Mechanism:** `prefs.reflectCss` stamps `--dse-fs-large-scale` on the element root. The tokens are declared on `:root` as `calc(<r>em * var(--dse-fs-large-scale))`. `var()` inside a custom property resolves where that property is declared, at `:root`, so descendants inherit `calc(1.318em * 1)`.
- **Measured on the harness** with `prefs=largeTextScale:1.2`: the root carries `style="--dse-fs-large-scale: 1.2"`, but the card name stays 20px and the h3 stays 21.088px. The value takes effect only when stamped on `<html>` (card name 24, h3 25.31).
- **Same result on the develop build** for the card name, so SC-318 did not cause this. The ruling's "tokens scale exactly as the existing ones do" is literally true, because both are equally inert.
- The small-scale and control-scale knobs use the same pattern and are presumably affected too (not measured). Probe: `r3-review/probe-scale.mjs`.

### INFO-2: scaling behaviour (brief item 1)
- **Obsidian text size 20px:**
  - font-size: screen == print at every level (h3 26.36, h1 32.36).
  - Margins: screen 50 / 20 against print 40 / 16. The ruling's body-em margins follow the text size, while Obsidian's `--p-spacing`/`--heading-spacing` are rem and do not.
  - This is by design ("scales with the body size"), but the acceptance invariant holds only at the default size. It should be stated in the ask.
- **`--dse-text-scale` 1.25:** screen scales and print does not. This is pre-existing: the root font-size rule is screen-only.
- **SC-230 modal** (synthetic `.dse-modal > .modal-content > .dse-modal__body`, `r3-review/probe-modal.log`): the branch scales proportionally, exactly as develop's em-based UA sizes did.
  - At scale 1: h3 19.77, h6 15.
  - At scale 1.25: h3 24.71, h6 18.75.

### INFO-3: Obsidian's `.markdown-rendered li h1..h5 { margin: 0 }` is not restated
A heading inside a list item would get 1 body-em on screen and 0 in print. No shipped or captured case exists.

## Probe results by brief item
1. **Screen == print.** Base vs branch sweep of all 133/134 capture ids across 4 combos (`r3-review/sweep-{base,branch}.json`, `sweepdiff.txt`):
   - Print: 0 diffs.
   - Markdown ladder h1–h6 at default size, branch screen == print on fs / lh / weight / letter-spacing / mt / mb:
     - h1 25.888 / 31.07 / 700
     - h2 23.392 / 28.07 / 680
     - h3 21.088 / 27.41 / 660
     - h4 19.008 / 26.61 / 640
     - h5 17.216 / 25.82 / 620
     - h6 16 / 24 / 600
     - mb 16 at every level; mt 40 after a `<p>`, otherwise 16.
   - Plugin tags: font-size equals print. The remaining weight and letter-spacing differences come from the Steel tracker rule, which the ruling keeps. The region-title band margins are pre-existing.
2. **Print untouched.** Freeze **260/260** on both runs. Every added or changed rule carries `:not([data-dse-print="on"])`; the `:root` tokens are values only.
3. **Cascade reach.** The new rules match the same h1–h6 set as the old ones.
   - GROUP 1b (adjacency) fired on **no** non-markdown plugin tag in any capture; every plugin tag has prev = none or a div.
   - GROUP 1c reaches only the roster heading and the region title.
   - The tracker uppercase/weight rule still wins on screen (weight 700).
   - `.dse-hero__name` is byte-identical apart from the inherited custom properties.
   - The skills and montage pins moved line-height only (LOW-1).
4. **Adjacency rule.** It matches Obsidian's selector set (p, pre, table, ul, ol).
   - Heading-first and after-blockquote headings keep 16.
   - It does not override classed margins: roster mt 0 and region-title mt −16 are kept, and the grouphead h4 has a div sibling, so the bump never applies.
5. **No collisions.** The diff adds no `.dse-head*` or `.dse-section__title` selector, and `visual-harness/parity/` is untouched. Parity is 16 DECLARED.
6. **Tests.**
   - Applied to base CSS, the branch tests give 37 failures across 6 of 7 suites (all SC-318 assertions); with branch CSS they are all green (`r3-review/canfail-{basecss,branchcss}.log`). The 2 skips come from `token-coverage`'s location sensitivity in a scratch tree.
   - Jest +24 = 15 (`headingScaleTokens`) + 8 (headingEmphasis: +6 adjacency, +1 roster/region, +1 hero pin) + 1 (fixture mount).
   - Token counts 88 → 94, invariants 20 → 26, print-invariant 34 → 40: all legitimate.
   - `token-coverage` resolves the **worktree** superproject map first (`candidates[1]` = `<wt>/docs/...`, which has 6 fs-h rows). The main checkout copy has 0, so this matters.
7. **Evidence.**
   - Columns are the same 1:1 CSS-px scale.
   - The captioned px match my measurements for A and for the ladder's "today" font sizes.
   - Option C is visibly applied.
   - The "Today" margins are wrong (MED-1).
8. **Narrow.** 52 visible narrow-capture headings: 0 new wraps (`r3-review/narrow-wraps.txt`). The widening hashes match r2 across two clean runs: print `30c1a61b…`, realprint `007c2747…`.
9. **Owner eyeball.** Answered in MED-1: the rule fires, and screen gap == print gap == 40.

## Gates (`236d593` / superproject `5478d94`; logs in `r3-review/logs/`)
- **tsc:** clean (`r3-tsc.log`).
- **lint:** clean (`r3-lint.log`).
- **jest:** 4142 passed / 1 skipped / 4143 total, 212 of 213 suites (`r3-jest.log`).
- **lifecycle:** `19/19 ok, 0 failed` (`r3-lifecycle.log`, port 9287).
- **shots:** 536, 0 FAIL, host-copy pin OK, button host-leak 684. The same 536 hashes came out of both runs (`r3-shots{1,2}*.log/.sha256`).
- **freeze:** `freeze OK (260/260 …)` on both runs (`r3-freeze{1,2}.log`).
- **parity:** 0 gaps / 0 undeclared / 16 declared (`r3-parity.log`).
- **Worktree `git status`:** clean before and after, superproject and DSE. `freeze-baseline.sha256` is unchanged (sha `559a2887…`).
