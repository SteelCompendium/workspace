# SC-366 scoped re-review, round 2 (delta 365b08b..ba20072 only)

## Executive summary
- Verdict: **APPROVE**. dse `ba20072` on branch sc366-notinstalled-link. Findings: 0 HIGH, 0 MED, 0 LOW, 2 INFO.
- The delta touches only `styles-source.css` (two selector lines, :8901 and :8909) and adds `test/dom/theme/notInstalledLinkColour.test.ts`. Nothing else changed, so per the brief I re-ran only jest and parity.
- (1) Specificity now matches the family:
  - `[steel]:not([print]) a.dse-ref-web-card__link` is (0,3,1), the same as `.dse-card a`.
  - The `:hover` form is (0,4,1), the same as `.dse-card a:hover`.
  - I proved it under hostile rules too. Against an injected (0,3,0) rule, the link and a `.dse-card a` link both keep teal-cyan, whether the rule loads before or after the plugin sheet. In r1 the link would have lost the later-loaded case. Against an injected later-loaded (0,3,1) rule, both turn red together. The link now behaves exactly like the family.
- (1b) I re-ran the 48-combo probe at ba20072 and compared it with r1 (365b08b): 0 value differences.
  - In every screen combo the link equals the family link, at rest and on hover, and the arrow matches the link.
  - Dark: rgb(77,184,199). Light: rgb(42,123,136). Both are the teal-cyan `--dse-accent`.
  - The Reading-view crops are md5-identical to r1's, for screen, hover and print.
- (2) The test is not vacuous. I reproduced the bite in the worktree: with both selectors removed, the run reads 2 failed / 1 passed (RC 1). Restored byte-clean (`cmp` identical), and `git status --porcelain` is empty.
- (2b) The test is not over-brittle. Over 13 mutations it tolerates reordering, whitespace, comments, single-line formatting and new neighbouring rules. It fails only on the real regressions and on a few same-meaning rewrites (INFO-1).
- (3) Jest: 5260 passed / 1 skipped / 230 of 231 suites (RC 0). Parity: 0 gaps / 0 undeclared / 24 declared (RC 0). Both match the implementer's claims.

## (1) Specificity and colours
The probe is r1's `sc366-review-r1-probe.mjs`, re-run unchanged after `npm run harness:build` at ba20072. Its CSSOM BEFORE-revert still rewrote exactly 2 rules.

The r1-vs-r2 comparison covers 48 combos with `rest`, `hover` and `famHover` values: 0 differences, and 0 screen-AFTER mismatches between the link and the family. At Obsidian 1.14.4, the rules that set colour on the link in Reading view are `a`, `.external-link` and the new `… a.dse-ref-web-card__link`.

Hostile-rule tie proof (`sc366-review-r2-specificity.mjs`), dark scheme, Reading-view ancestors, run against ba20072:

| injected rule | link | `.dse-card a` link |
|---|---|---|
| `.markdown-rendered .block-language-ds-scc .external-link` (0,3,0), loaded after the plugin sheet | rgb(77,184,199) | rgb(77,184,199) |
| `.markdown-rendered .block-language-ds-scc a.external-link` (0,3,1), loaded after the plugin sheet | rgb(255,0,0) | rgb(255,0,0) |
| (0,3,0), loaded before the plugin sheet | rgb(77,184,199) | rgb(77,184,199) |

## (2) Bite and brittleness
- **Bite, in the worktree, through jest:**
  - Unmodified: 3 passed (RC 0).
  - Both `a.dse-ref-web-card__link[:hover]` selector parts removed (`git diff --stat`: 1 file, +2/−4): 2 failed / 1 passed (RC 1).
  - Restored from a scratch copy: `cmp` BYTE_CLEAN, and dse `git status --porcelain` empty.
- **Brittleness** (`sc366-review-r2-brittle.mjs`): a faithful JS port of the test's parsing and assertions, run against mutated copies, never the worktree file. Results are [block, rest, hover]:

| mutation | result |
|---|---|
| unmodified | pass pass pass |
| BITE: both removed | pass FAIL FAIL |
| r1 form (no `a`) | pass FAIL FAIL |
| rest colour → `--text-accent` | pass FAIL pass |
| print gate dropped from ours | pass FAIL pass |
| reorder (ours first in both lists) | pass pass pass |
| tabs/blank lines between selectors | pass pass pass |
| whole list on one line | pass pass pass |
| comment inside selector list | pass pass pass |
| unrelated rule added after the family | pass pass pass |
| next-section banner "Plan 24 / SC-100 Task 3" renamed | pass pass pass |
| family banner "In-card link color (SC-10 Task 1" reworded | FAIL FAIL FAIL |
| ours re-quoted `[data-dse-theme="steel"]` (same meaning) | pass FAIL pass |
| ours split into its own rule (same meaning) | pass FAIL pass |

## Findings

### INFO-1: three acceptable over-strictnesses in the test
- **Where:** test/dom/theme/notInstalledLinkColour.test.ts:17, :21 and :32-38.
- **What fails that should not:**
  - Rewording the family's banner comment fails all 3 tests. The failure is loud, and the first test names the cause.
  - Re-quoting the steel attribute with double quotes fails. Every steel selector in the sheet uses single quotes, so this would be a style break anyway.
  - Moving our selector into its own rule with the same declarations fails. It is still correct CSS, but no longer "in the family".
- None of these can fail silently, and all match how strict the sibling contract `headingEmphasisLinkHostRegrounding.test.ts` is. No change needed.

### INFO-2: the end bound survives a rename only by accident
- **Where:** test/dom/theme/notInstalledLinkColour.test.ts:21.
- **What:** if the next-section banner is renamed, `indexOf('Plan 24 / SC-100 Task 3', familyStart)` falls through to a second occurrence at styles-source.css:15333 (`statTiles (Plan 24 / SC-100 Task 3)`).
- **Effect:** the slice then spans ~6,400 lines, but the "exactly one rule lists `<gate> .dse-card a`" assertion still finds the family rule, so the tests stay correct.
- **Action:** none. Note it only in case someone tightens the bound later.

## Gates (reviewer-run at ba20072, exit codes read through a script file)
- jest: `Tests: 1 skipped, 5260 passed, 5261 total`, `Test Suites: 1 skipped, 230 passed, 230 of 231 total`, RC 0. The 1-minute load average was 1.06.
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, RC 0.
- tsc, lint, lifecycle, e2e, shots and freeze were not re-run, per the brief, because the delta is a selector tightening plus a test. The probe and crop md5s show no rendering change from r1, where I measured shots and freeze myself (572 shots, 0 FAIL; freeze 276/276).

## Tree hygiene
- dse `git status --porcelain` is empty before and after, and HEAD is ba20072.
- The superproject shows ` M draw-steel-elements`, the existing pointer state.
- No `main.js` or `styles.css` at the plugin root.
- The only worktree write was the temporary bite edit, reverted byte-clean.
- Gitignored `visual-harness/dist` and shots were regenerated at ba20072 by harness:build and parity.
