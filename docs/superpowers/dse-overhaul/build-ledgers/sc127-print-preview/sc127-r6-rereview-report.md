# SC-127 round 6: scoped re-review of the r5 delta (dse b936efa on c524fd2, superproject b770e37)

**Executive summary**
1. **Verdict: FIX ROUND (small).** All six r4 findings are closed in behaviour. The new guard code has one HIGH (as the brief defines it), one MEDIUM and two LOW. None of them changes what users see except L-B (two cosmetic greys).
2. **r4 findings closed:** MED-1 y · MED-2 y · LOW-1 y (behaviour; its jest pin is vacuous, see L-A) · LOW-2 y · LOW-3 y · LOW-4 y, with the gaps in M-A.
3. **Battery** (mine, final sha; every row matches the brief's expectation):

   | Gate | Result |
   |---|---|
   | tsc, lint | clean |
   | jest | 4001 passed / 1 skipped / 205 of 206 |
   | shots | 524, 0 FAIL, both sweeps; every in-run gate prints OK, census OK (164) |
   | freeze | 130 twin FAILED / 0 realprint / 0 missing |
   | parity | 0 / 0 / 16, exit 0 |

4. **Realprint moved:** 0 of 130 (shown by both sweeps' freeze runs).
5. **Screen combos vs base `c524fd2`:** `steel-dark` 0 of 132 moved, `steel-light` 0 of 132 moved.
6. **Rebaseline verified: y.** Both clean sweeps reproduce `sc127-rebaseline.txt` byte for byte (`cmp`). The two sweeps are identical across all 524 PNGs. Applied to a scratch copy of the baseline, it gives `freeze OK (260/260)`.
7. **H-A (item 8): the pin's extractor is truncated on the shipped tree.** A `}` inside the r5 comment at `styles-source.css:14496` cuts the host block at 1264 of 6313 chars (23 of 59 declarations seen). The pin and the census both still print OK.
8. **M-A (item 9): the census has two blind spots.**
   - Gallery scope: 10 consumed tokens are invisible to it, including `--hr-color`, `--link-external-color-hover` and `--checkbox-color`.
   - Pseudo-element selectors: `querySelectorAll('input::placeholder')` returns 0 without throwing, so every `::placeholder` / `::marker` token is dropped silently.
   - Two live drifts hide there (L-B).

## Findings (the r5 delta only)

### HIGH-A (by the brief's rubric): `extractSc127HostBlockBody` still truncates at a `}` inside a comment, and the shipped tree triggers it
- **Where:**
  - `visual-harness/shoot.mjs:1338-1350`: the regex `\{([^}]*)\}` is unchanged; r5 only reworded one comment.
  - `styles-source.css:14496`: the r5 `--hr-color` comment quotes `` `hr { border-color: var(--hr-color) }` ``.
- **Measured on b936efa:**
  - The extracted body is 1264 chars and ends at `…(\`hr { border-color: var(--hr-color) `.
  - The true body is 6313 chars.
  - The extractor sees 23 of 59 declarations. Lost: `--hr-color`, every `--background-modifier-*` state mapping, `--text-*`, `--interactive-*`, `--link-*`, `--checkbox-*`, `--table-*`, `--code-*`, `--caret-color`, `caret-color`, the scrollbar tokens and `scrollbar-color`.
  - Both sweeps still print `SC-127 host block pin OK` and `census OK`.
- **The r5 report's claim is false:** it says "no other comment in the diff contains one (checked)".
- **Actual consequence today (mitigation, for the owner's judgement):**
  - All 18 pinned literals sit before the cut, so the pin's verdict is correct today.
  - A cut that lands before a literal fails loudly: with a brace comment at the top of the block, 18 of 18 literals are reported DRIFTED (`r6/sc127-r6-extractor-brace-before-literals.log`). The message misattributes the cause, blaming dark values rather than truncation.
  - A brace after the literals prints OK (`…-after-literals.log`).
  - The census does not use the extractor; it uses the browser's real parse. So `census OK` is honest.
  - What remains is a silently degraded guard that fooled its own author once. A duplicate literal re-declared after the cut would be invisible to the pin, and only the census would catch it, through a mapping.
- **Fix:**
  - Strip `/* … */` before matching, as `iterRules` does, or locate the rule via `iterRules`.
  - Add a loud self-check: the extracted body must contain the block's final declaration (e.g. `scrollbar-color:`), or match a brace-depth parse; otherwise fail.
  - Add a jest pin that the extractor strips comments.
  - Reword `styles-source.css:14496` so the comment has no brace.

### MEDIUM-A (item 9): two census blind spots, one of which is silent
- **Where:**
  - `shoot.mjs:1471`: the census walks `gallery=1` only.
  - `shoot.mjs:1429`: `STATE_PSEUDO_STRIP` strips pseudo-classes only.
  - `shoot.mjs:1482-1490`: pseudo-element selectors do not throw, contrary to the comment at 1484. They match 0 nodes silently, so the `skipped` count stays 0 and no skip note prints.
- **Why `--hr-color` was missed:** the gallery has no `<hr>`, so the `hr` selector reaches no print-on node and `--hr-color` never enters the consumed set.
  - It was not a mapping-chain problem. Once the token is in the set, the census compares the root-resolved value with `.theme-light` correctly: my union run shows `--hr-color` root `#e4e4e4` equals light `#e4e4e4`.
  - It was not a sheet-scope problem either. The census DOES scan the pinned Obsidian sheet as well as the plugin's (`extractHostTokenConsumers(pinnedCss)`), so plain-element rules (`hr`, `a`, `th`, `input`) are included whenever the DOM is present.
- **Measured coverage** (`r6/sc127-r6-census-coverage.log`, census method replayed over 125 captures):
  - The union is 174 tokens against the gallery's 164.
  - The 10 tokens the gallery never sees: `--checkbox-color`, `--checkbox-color-hover` (`:checked`, negotiation-checked); `--link-external-color`, `--link-external-color-hover`, `--link-external-decoration(-hover)`, `--link-external-filter` (`.external-link`, perk-links); `--list-indent`; `--hr-thickness`, `--hr-color`.
  - All 10 currently match light, because the host block restates them. None of them is guarded.
- **Can-fail proofs, using the real census code** (runner built from `shoot.mjs` text; logs `r6/sc127-r6-canfail-census-drop-*.log`):
  - Dropping `--background-modifier-form-field-hover` → DRIFTED: `--background-modifier-form-field-hover: dark preview resolves "#2e2e2e" … "#ffffff" (consumed by input[type='text']:not(:disabled))`.
  - Dropping `--link-color-hover` and `--link-external-color-hover` → DRIFTED, "1 of 163", naming only `--link-color-hover` (consumed by `a`). The dependency-only restatement IS caught.
  - Dropping `--link-external-color-hover` alone → **census OK**.
  - Dropping `--hr-color` → **census OK**. The print-twin delta gate catches it instead: `--element=treasure` gives VIOLATED, 4 problems (`r6/sc127-r6-canfail-drop-hrcolor-delta.log`).
- **Fix:**
  - Strip pseudo-elements (`::placeholder`, `::marker`, `::before`, `::after`, `::selection`, `::-webkit-*`) to their originating compound before matching.
  - Run the census over the union of capture ids (or every fixture), not only the gallery.
  - Correct the comment at 1484-1487.
  - If the owner prefers a follow-up ticket over another round, the item is "census coverage: non-default-fixture DOM + pseudo-elements". Answer to the brief: the blind-spot class is **not closed**.

### LOW-A: LOW-1's jest pin is vacuous
- **Where:** `test/unit/build/printTwinDeltaAllowedSet.test.ts:131`, `'all four border*Color properties are in PRINT_DELTA_STYLE_PROPS'`. It matches `'borderTopColor'` anywhere in `shoot.mjs`, and the `BORDER_COLOR_PROPS` Set literal always satisfies that.
- **Proof:** I deleted the four entries from `PRINT_DELTA_STYLE_PROPS` and jest still passed 17 of 17 (`r6/sc127-r6-canfail-jest-noborder.log`).
- **The gate itself does work:** dropping `--table-header-border-color` and running `--element=career` gives `PRINT-TWIN DELTA VIOLATED` with 8 problems, e.g. `career#54 <th>: borderTopColor "rgb(51, 51, 51)" vs "rgb(228, 228, 228)"` (`r6/sc127-r6-canfail-low1-drop-thborder.log`).
- **Fix:** match against the body of the `const PRINT_DELTA_STYLE_PROPS = [ … ];` array, not the whole file.

### LOW-B: two dark-theme greys remain in the dark preview, both hidden from every gate
- **Measured** (`r6/sc127-r6-pseudo-placeholder-marker.log`):
  - `::placeholder` ("Amount", "Roll", on initiative and project): `rgb(102,102,102)` in the dark twin vs `rgb(171,171,171)` in the light twin and in realprint.
  - `li::marker` (career): `rgb(102,102,102)` vs `rgb(171,171,171)`.
- **Tokens:** `--input-placeholder-color` and `--list-marker-color`. Both are consumed only through pseudo-elements (M-A) and are not restated in the host block. The delta gate samples no pseudo-elements.
- **Impact:** cosmetic only. The preview's grey is darker, so it reads better than paper, but it does not match paper.
- **Fix:** add `--input-placeholder-color: var(--text-faint); --list-marker-color: var(--text-faint);` to the host block (light maps both to `#ababab`). This moves the twin PNGs that show placeholders or bullets, so the rebaseline must be regenerated.

### INFO
- **I-A: superproject worktree.** `git status` shows ` M steel-etl`, ` M steelCompendium.github.io`, ` M v2`: stale submodule checkouts vs b770e37's gitlinks, not staged, as the r5 report says. Run `git submodule update` for those three before `wt-finish`, or the dirty check trips (land-stack skill).
- **I-B: base drift.** `origin/develop` is now `619c4bd` (SC-340, 43 files, framework view adoption). There is no overlap with SC-127's files, but re-sweep at landing, since the framework changes may move print bytes. Superproject `origin/main` is still `9255a30`, the base of b770e37.
- **I-C: commit hygiene.** No AI or co-author trailers in the 6 dse commits or in b770e37. The pointer in b770e37 is `b936efa`, and b770e37 carries the CHANGELOG bullet and the SKILL.md supersession sentence. The dse tree was clean before and after. My jest run planted `main.js` and `styles.css`, which I removed.

## Per-item evidence
1. **MED-1** (`r6/sc127-r6-hover-probe.log`):
   - Dark preview, hero / party / project / initiative number fields: at rest `#fff`; on hover `rgb(255,255,255)` with ink `rgb(34,34,34)` (15.9:1) and border `#dadada`; focus ring `rgb(189,189,189)`; caret `#222`. This is identical to the light twin.
   - Census OK line reproduced: `SC-127 host palette census OK (164 consumed tokens × dark preview == theme-light)`, on both sweeps and in my runner.
   - The census counts `:hover`, `:focus`, `:focus-visible`, `:focus-within` and `:active` (stripped).
   - `--link-color-hover`: covered. `--link-external-color-hover`: **not covered** (M-A).
2. **MED-2:** removing the white clause from `paperExemptionExcuses` → `PRINT-TWIN PAPER-EXEMPTION SELF-TEST FAILED — … root-non-white-background WRONGLY EXCUSED`, exit 1 (`r6/sc127-r6-canfail-med2-nowhite.log`). Closed.
3. **LOW-1:** the dark twin equals the light twin inside roots, with 0 curated-property diffs and 0 full-style hash diffs across career, class, encounter, perk, treasure-hr, hero, initiative, project and party (`r6/sc127-r6-styles-darktwin-vs-lighttwin-subset.txt`). The gate samples `border*Color` and can fail (above). The jest pin is vacuous (L-A).
4. **LOW-2:** caret on a preview input is `rgb(34,34,34)`. `scrollbar-color` equals light (0 full-style diffs in roots). Closed.
5. **LOW-3:** the comment at `styles-source.css:14455-14469` now points to both guards. Closed.
6. **Battery, sweeps, rebaseline, base:** see the summary.
7. **Hygiene:** see I-C and I-A.

## Artifacts (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/r6/`)
Logs:
- `sc127-r6-{tsc,lint,jest,parity}.log`
- `sc127-r6-shots-sweep{1,2}.log`, `sc127-r6-freeze-sweep{1,2}.log`
- `sc127-r6-base-c524fd2-shots.log`

Hashes:
- `sc127-r6-sweep{1,2}-all.sha256`, `sc127-r6-base-c524fd2-all.sha256`
- `sc127-r6-rebaseline-from-sweep{1,2}.txt`

Can-fail logs:
- `sc127-r6-canfail-census-drop-*.log`, `sc127-r6-canfail-{med2-nowhite,low1-drop-thborder,drop-hrcolor-delta,jest-noborder}.log`
- `sc127-r6-extractor-brace-{before,after}-literals.log`

Probe logs:
- `sc127-r6-census-coverage.log`, `sc127-r6-hover-probe.log`, `sc127-r6-pseudo-placeholder-marker.log`
- `sc127-r6-styles-darktwin-vs-lighttwin-subset.txt`, `sc127-r6-gate-runner-clean.log`

Scripts:
- `sc127-r6-gate-runner.mjs` (built from the real `shoot.mjs` text by `mkgate.py`)
- `censuscov.mjs`, `dropdecl.py`, `mutshoot.py`, `pseudo.mjs`, `runcensus.sh`, `runmut6.sh`
