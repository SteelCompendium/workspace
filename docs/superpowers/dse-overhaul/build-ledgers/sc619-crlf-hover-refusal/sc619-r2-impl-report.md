# SC-619 r2 implementation report

**Executive summary**
- Verdict: DONE. The CRLF heading-hover fix is in, G-S112 added, full battery green on the rebased branch.
- dse branch `sc619-crlf-hover-refusal` @ `19942fe6` (rebased onto develop `3a5986d3`; 3 commits: `c42205cf` r1 tests, `c90638ca` fix + test, `19942fe6` G-S112). Not pushed.
- Superproject changelog commit `e66cd274` on `b31eb542` (workspace origin/main); no pointer bump committed (tree shows only ` M draw-steel-elements`).
- tsc (incl. e2e) and lint clean · jest **11814 passed / 2 skipped / 0 failed** (fresh) · lifecycle **63/63** (21+16+9+4+7+4+2, no flake, G-S91 green first run) · e2e **331/334 ok, 0 failed, 3 known-bug, coverage 176/176 pairs**.
- shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze **280/280** · parity **0/0/24**.
- G-S112 measured red at the 1f1ae442-era src (a, b, c, d, g fail; e, f pass) and green with the fix; jest file: 8 red at base, 20/20 with the fix.
- No number moved except those the new tests / the rebase explain (jest 11788 -> 11814 = +6 from SC-585 on develop, +19 r1's file, +1 mine; e2e +1 COND-R07 from develop).

## Rebase
`origin/develop` moved to `3a5986d3` (SC-585) during the work, on the owner's message. I rebased the dse branch onto it (package.json unchanged, no `npm ci`) and the superproject worktree fast-forwarded to `b31eb542` (it had no commits). The whole battery was re-run on the rebased sha; all numbers below are from that run. The first battery on `1f1ae442` (jest 11808, lifecycle 63/63) was also green.

## Diff summary
- `src/framework/host/ReadingModeBlockHost.ts` (+9/-4): r1's design. In `cardLinkLine`, `crlfHover = hovered !== null && blockId === null && sectionText.startsWith('\n') && splitWithEols(whole).eols[start] === '\r\n'`; then `part = splitLines(crlfHover ? sectionText.slice(1) : sectionText)` and `rel = crlfHover ? relLine - 1 : relLine`, with `rel` used for `partStart + rel` and `blockBodyLines(part, rel, ...)`. Import of `splitWithEols`. Three-line comment. LF notes never take the branch (heading terminator must be `\r\n`), writes already keep the note's EOL. I kept `splitWithEols` (runs only when the part starts with `\n`) rather than an offset read: simpler, one O(n) split.
- `test/dom/framework/reading-mode-host-crlf-hover.test.ts` (+1 test, +1 helper tweak): r1's 19 tests untouched. Added `SC-619: a heading with trailing spaces ...: saved into the hovered counter, in a CRLF note as in the LF note` (both EOLs). `cacheOf` now trims the heading text (Obsidian's cache heading excludes the trailing spaces, its `position.end` includes them), harmless for the other tests.
- `visual-harness/obsidian-lifecycle.mjs` (+151): header paragraph, 7 CRLF fixtures (+ LF hosts), scenario `G-S112` after G-S108 and before G-S56 (G-S56 still last; no dependency of part 4 broken).
- Superproject `CHANGELOG.md`: one bullet at the top of `## Unreleased` (SC-619).

## Tests
r1's file now 20 tests. Red at base (8): the ticket (+ #Tracker), + #Other, unique counter, hover form Save, no blank line, TOP edited, two + with redraw, trailing-space heading. Green at base: model test, 7 LF/CRLF refusal parities (names swapped card + form, hovered of two adjacent identical deleted (upper), two identical with a section between with the hovered first deleted, hovered counter edited from outside, section moved to end, hover window race), 4 controls (LF, block hover, heading embed, mixed note).
The brief's refusal mirrors (names swapped RV/LP/form, hovered of two identical deleted, upper adjacent deleted, no blank line, trailing-space, unique CRLF) were all in r1's file except trailing space (added). RV vs LP is not distinguishable in the jest hover model (same hover popover and part); LP is covered by G-S112 (b).

## G-S112 (lifecycle part 7), measured alone on the fix bundle: 67 s with build and start-up; in part 7 with G-S108: 131 s / 129 s
One all-CRLF note per phase (`Lifecycle/gs112-<id>-src.md`, LF host note linking to it). Each phase also asserts the hover's part starts with `\n` (the CRLF slice reached).
- (a) RV real + in the hover of #Tracker: values [6,5], no Notice, all-CRLF, text outside the fences unchanged, twin names unchanged.
- (b) Live Preview (Ctrl-hover) +: [6,5].
- (c) RV + in the hover of #Other: [5,6].
- (d) RV Edit form opened in the hover, renamed to Edited, real Save: names [Edited, Twin], values [5,5].
- (e) names swapped from outside while the preview is open, real +: note equals the outside edit (nothing written), exactly one "changed on disk first" Notice.
- (f) two ADJACENT identical `## Tracker` sections, the upper deleted from outside, real +: nothing written, one Notice.
- (g) fence right under the heading, +: [6,5].
Red proof (src at `7ef96b18`, bundle rebuilt): G-S112 FAIL on (a) values [5,5] + Notice, (b), (c), (d) names Twin,Twin + Notice + modal left open, (g); (e) and (f) passed. Log `lc-s112-base.log`. Green with the fix: `lc-s112-fix.log`. The kept temp dir of the red run was deleted (exact path).

## Gates (rebased `19942fe6`; logs in the scratch dir `.../scratchpad/sc619-r2-impl/`)
- tsc + `tsc -p e2e`: clean; lint (incl. e2e): clean (`tsclint-rb.log`, 29 s).
- jest fresh (`rm -f main.js styles.css`): 276 suites passed + 1 skipped; **11814 passed / 2 skipped** (`jest-full-rb.log`, 85 s).
- lifecycle (`rb-lc-p1..p7.log`): 21/21 (185 s), 16/16 (326 s), 9/9 (406 s), 4/4 (298 s), 7/7 (395 s; G-S91 passed), 4/4 (296 s; G-S97 passed, appearance.json not touched), 2/2 (129 s) = **63/63**.
- e2e (`rb-e2e.log`): `OBSIDIAN-E2E done: 331/334 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (161 s).
- shots (`rb-shots.log`, 742 s): 592 `ok` lines, no FAIL; button host-leak 163 kinds / 978; modal host-leak 10 scenarios, 40 kinds / 240; capture clip 147.
- freeze: `freeze OK (280/280 ...)`. parity (last): 0 gaps, 0 undeclared warnings, 24 declared, exit 0.

## Moved numbers
jest 11788 -> 11814: +6 (develop's SC-585 tests, 11794 at `3a5986d3`) +19 (r1's file) +1 (trailing-space). e2e 330/333 -> 331/334 (+1 COND-R07, from develop). Lifecycle 62 -> 63 (G-S112). Everything else unchanged.

## Drive-by fixes
None.

## Follow-ups
- CR-only notes (SC-460) with a heading hover: not measured; the branch does not fire (heading line ends in a lone `\r`). If Obsidian's `+1` skips that CR the part is LF-shaped and was already placed as before; if not, such a note may still be refused (safe). Not measured, no test.
- Mixed-EOL note (CRLF heading line, LF-only blank line) under a future Obsidian that cuts after the whole CRLF: the branch would drop the wrong LF and the result is a refusal, never a write (documented by r1; the existing mixed-note control covers today's Obsidian).
- The jest hover model cannot tell Reading view from Live Preview hovers; LP is covered only by G-S112 (b).

## Artifacts
- Skill proposal: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc619-crlf-hover-refusal/sc619-skill-proposal.md`
- This report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc619-crlf-hover-refusal/sc619-r2-impl-report.md`
- Gate logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc619-r2-impl/` (`jest-full-rb.log`, `tsclint-rb.log`, `rb-lc-p1..7.log`, `rb-e2e.log`, `rb-shots.log`, `rb-freeze.log`, `rb-parity.log`; pre-rebase `lc-s112-fix.log`, `lc-s112-base.log`, `jest-crlf-base.log`, `jest-full.log`, `lc-p1..7.log`).
