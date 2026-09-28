# SC-318 round 5: scoped re-review of fix round 1

## Executive summary

1. **Verdict: FIX-FIRST.** Counts: 0 HIGH, 1 MED, 0 LOW, 1 INFO.
2. **MED-1 (new, introduced by the LOW-1 fix): the skills pin now changes PRINT.** `line-height: inherit` was added to a rule that print also reaches. `.dse-skills__group-title` print line-height moves from 23.92 to **27.6px** (twin and realprint). At Obsidian text size 20px it moves from 29.9 to 34.5px. This breaks the round-1 "SCREEN-ONLY" / print-untouched ruling and the round-3 ruling that "nothing about them should move". Freeze cannot see it, because no capture renders this h3.
3. **LOW-1 on screen is correct.** Both pins now equal develop at default size, at Obsidian 20px, at `--dse-text-scale` 1.25, and inside a `.dse-modal` at 1.25. The skills pin is 21.6px and the montage pin 20.4px at default. A full computed-style diff against develop shows 0 differing properties on screen. The montage pin is also clean in print.
4. **LOW-3 is fixed** (`styles-source.css:6318`). **MED-1 of round 3 (the evidence) is fixed.**
   - The Today columns come from the real 5a20d5f build and match my measurements: "On Humans" 18.72 → 40, h1 margin-top 21.44.
   - The images are 1:1 CSS px, with no stray text.
   - The blockquote-h6 row is present in both the ladder and the measure table (LOW-2 disclosed).
   - Option C is visibly applied.
5. **Gates at dse `520aabf` / superproject `323970c`:**
   - tsc and lint clean.
   - jest 4142 passed / 1 skipped / 4143 total (unchanged; no test was added).
   - shots 536, 0 FAIL. Only `montage-guide-open--steel-{dark,light}` changed against 236d593, which is expected.
   - freeze 260/260. parity 0 / 0 / 16. Lifecycle skipped (the delta is CSS only).
6. **Rebase:** dse is on origin/develop (`5a20d5f`); the superproject is on origin/main (`4ca84a8`). `range-diff` shows the three round-2 commits patch-identical. Widening hashes are unchanged (`30c1a61b…`, `007c2747…`).

## MED-1: the LOW-1 skills fix is print-reaching
- **Where:** `draw-steel-elements/styles-source.css:3408-3417`. The new `line-height: inherit` sits in the rule nested under `[data-dse-element="skills"] .dse-skills { .dse-collapse__title, .dse-skills__group-title { … } }`. That rule has no `:not([data-dse-print="on"])` and no screen scope. The montage fix (`:4806`) is fine: its parent (`:4260`) is `…:not([data-dse-print="on"]) .dse-mt`.
- **Failure:**
  - In print, the h3 previously took Obsidian's `h3 { line-height: var(--h3-line-height) }` (1.3). The pin rule has specificity (0,3,0), so `inherit` now wins.
  - Measured with an injected `.dse-skills__group-title` (the exact DOM `skills/view.ts:205` builds in `only_show_selected` list mode) — `r5-rereview/probe-pins.mjs`, output in `logs/probe-pins.log`:

    | combo | develop | 236d593 | 520aabf |
    |---|---|---|---|
    | print twin | 23.92px | 23.92px | **27.6px** |
    | realprint | 23.92px | 23.92px | **27.6px** |
    | print twin, Obsidian 20px | 29.9px | 29.9px | **34.5px** |
    | print twin, text-scale 1.25 | 23.92px | 23.92px | **27.6px** |

  - Block height grows by the same amount. A real Ctrl-P or export of a skills block with hidden unowned skills changes. No frozen capture renders this mode, so freeze reads 260/260 anyway.
- **Also caught by the shared selector:** `.dse-collapse__title`, which the rule groups with the pin, receives `inherit` too. It is a no-op today: computed values equal develop in every combo and every capture (sweep diff, `r5-rereview/diff3.py`).
- **Fix:** take `line-height: inherit` out of the shared nested rule. Put it in a screen-scoped rule that outranks GROUP 1's `:where(h3)` (0,2,0), for example:

  ```css
  [data-dse-element="skills"]:not([data-dse-print="on"]) .dse-skills .dse-skills__group-title { line-height: inherit; }
  ```

  That is (0,4,0), consistent with how the montage fix inherits its parent's screen scope.
  - Re-verify with `probe-pins.mjs`: print must read 23.92 on all three builds.
  - A can-fail source-text test asserting the pin's `line-height` sits under a print-excluded selector would make this catchable, because the frozen shots cannot catch it.

## Verified clean
- **LOW-1 screen values, fix vs develop** (full `getComputedStyle` diff, all non-custom properties: 0 differences):

  | pin | default | Obsidian 20px | text-scale 1.25 | modal 1.25 |
  |---|---|---|---|---|
  | skills group title, font-size / line-height | 14.4 / 21.6px | 18 / 27px | 18 / 27px | 16.875 / 21.94px |
  | montage guide title, font-size / line-height | 13.6 / 20.4px | 17 / 25.5px | 17 / 25.5px | 15.94 / 20.72px |

  - Both pins scale in step with develop in every column: `inherit` resolves to the ambient unitless 1.5.
  - For comparison, 236d593 gave skills 18.72 and montage 19.04 (default), and 23.4 / 23.8 at text size 20.
- **Sweeps.** 134 capture ids × 4 combos, covering h1–h6 and `.dse-collapse__title`:
  - 236d593 → 520aabf: only `.dse-mt__guide-title` changes (line-height 19.04 → 20.4px, dark and light), with 0 print diffs.
  - develop → 520aabf: montage and collapse titles are unchanged, with 0 print diffs.
- **Evidence (`r4-evidence/`):**
  - Ladder Today reads h1 32 / 54.4 / margin-top 21.44, and h2–h6 match the real develop probe (r1 `probe-synthetic`).
  - The blockquote-h6 row reads screen margin-top 16 against print 0 (develop 10.72), disclosed as pre-existing GROUP 5 behaviour.
  - Hero, roster, initiative and hero-name "today" rows match my r3 real-base measurements.
  - Crops are 1:1 (paired crops share widths; ladder columns are 745px each).
  - Minor cosmetic: some row labels are truncated at the crop's right edge.
- **INFO:** the measure table's PINS section reports screen values only. It should gain print rows once MED-1 is fixed, so the ask can show print is untouched.

## Artifacts
All under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc318-card-headings/r5-rereview/`:
- **Probes:** `probe-pins.mjs` with output `pins.json`; `sweep.mjs` with output `sweep-{base,r2,branch}.json`; `diff3.py`.
- **Build:** `r2build/`, a `git archive 236d593` copy with its own harness dist.
- **Logs** (`logs/`): `r5-tsc-lint.log`, `r5-jest.log`, `r5-shots.log`, `r5-shots-all.sha256`, `r5-freeze.log`, `r5-parity.log`, `probe-pins.log`, `sweep-*.log`.
- **Worktree `git status`:** clean in the superproject and DSE. `freeze-baseline.sha256` is unchanged (`559a2887…`). Nothing was committed.

## Round 6 (fix round 2 re-review)

1. **Verdict: LAND-READY-AS-PROPOSAL.** Counts: 0 HIGH, 0 MED, 0 LOW, 1 INFO (a comment nit; does not block).
2. **Round-5 MED-1 is fixed.** `.dse-skills__group-title` print twin and realprint read 23.92px, and 29.9px at Obsidian 20px and at text-scale 1.25. Each equals develop; 520aabf gave 27.6 / 34.5. Screen is 21.6px at default (27 at 20px, 21.94 in the modal).
3. **No other pin moved.** Across all 27 probe rows (3 pins × screen dark/light, print, realprint, Obsidian 20px, text-scale 1.25, modal 1.25), the full `getComputedStyle` diff against develop is **0** for the skills group title, `.dse-collapse__title` and `.dse-mt__guide-title`.
4. **Sweep** (134 ids × 4 combos, h1–h6 plus `.dse-collapse__title`): 520aabf → 29d68f8 has 0 diffs, and print diffs against develop are 0.
5. **Can-fail:** `headingScaleTokens.test.ts` gives 2 failed / 15 passed on 520aabf CSS and 17/17 on 29d68f8 CSS.
6. **Gates at dse `29d68f8` / superproject `1b338a2`:**
   - tsc and lint clean.
   - jest 4144 passed / 1 skipped / 4145 total (+2 = the two new tests).
   - shots 536, 0 FAIL, byte-identical to the 520aabf run.
   - freeze 260/260. parity 0 / 0 / 16.
   - Lifecycle not run: the delta is CSS plus a test.
7. **Rebase (after fetching):** dse descends from origin/develop `5a20d5f`; the superproject descends from origin/main `4ca84a8`, with `range-diff` showing commits 1–4 identical. Widening hashes are unchanged (`30c1a61b…` / `007c2747…`).

### Findings
- **INFO:** the new comment at `styles-source.css:3490` says `.dse-collapse__title` "keeps the shared rule's plain `inherit`". It doesn't: the shared rule no longer declares any line-height, and the new test asserts exactly that. The behaviour is correct (collapse title equals develop everywhere). Fix: reword the comment to "needs no line-height; nothing overrides its inherited value", or leave it.

### Verified
- **Specificity:** the new rule is `[data-dse-element="skills"]:not([data-dse-print="on"]) .dse-skills .dse-skills__group-title`, specificity (0,4,0). It is screen-scoped and beats GROUP 1's `:where(h3)` at (0,2,0).
- **Measure table:** the PINS section in `r4-evidence/sc318-measure.txt` now carries print rows (skills 23.92 today → 27.6 in fix round 1 → 23.92 now; montage 26.61 throughout), matching my probe.

### Artifacts (`r5-rereview/`)
- `probe-pins-r6.mjs` with output `pins-r6.json`.
- `r4build/` (a `git archive 520aabf` copy).
- `sweep-r6.json`.
- `canfail/` with `css-520aabf.css` and `css-29d68f8.css`.
- Logs in `logs/r6-*`: `r6-probe-pins.log`, `r6-canfail-{520aabf,29d68f8}.log`, `r6-tsc-lint.log`, `r6-jest.log`, `r6-shots.log`, `r6-shots-all.sha256`, `r6-freeze.log`, `r6-parity.log`, `r6-sweep.log`.
- Worktree `git status`: clean in both repos. `freeze-baseline.sha256` unchanged (`559a2887…`). Nothing committed.
