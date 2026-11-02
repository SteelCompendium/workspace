# SC-481 r5: scoped re-review of the r4 delta d250e97..2c5887f (plugin on 4deb8cf, superproject 3e74be1c)

## Executive summary
1. **Verdict: LAND-READY.** Counts: HIGH 0, MEDIUM 0, LOW 2 (test-coverage gaps; behaviour on HEAD is correct), INFO 3.
2. All three r3 findings are fixed on HEAD, measured in real Obsidian 1.15.0:
   - HIGH-1: quote and callout twins are correct in Reading view for click, adoption off and form Save followed by a lower click (names stay [Edited, Twin]). Nested callouts and two-block callouts are correct too.
   - MEDIUM-1: callout twins show no error card; the cards read [6,5] -> [6,6] -> [7,6].
   - LOW-1: mutant md is now caught by jest.
3. G-S53 FAILs on the d250e97 bundle (callout/quote phases) and on the 4deb8cf bundle (27 callout/quote problems), and PASSes on HEAD. The r4 mutations reproduce in framework jest: guard 4 red, window 6 red, skip 1 red.
4. Owner ruling SC-537: Live Preview callout twins (single, two-block and nested) behave step-for-step the same on HEAD and on 4deb8cf (same disk, cards, cursor and Notices; no error card, no new vanish, no extra writes). G-S53's Live Preview phase for plain twins passes on HEAD.
5. Regression sweep is clean:
   - plain twins: G-S53 base phases;
   - different bodies: 0 extra draws, roots kept;
   - non-twin window sections: a single callout counter got 0 draws; a quote and a callout each holding two different counters are identical to base, with 0 `reused-by-twin` releases;
   - an unterminated EOF fence beside another block: fine.
   - The `locateInSection` split is a pure delegation, and the SC-455 write gates are green (G-S11, G-S12, G-S14). The CHANGELOG is accurate.
6. Gates on 2c5887f: tsc/lint clean · jest 6168/1 · lifecycle 21+21 = 42/42 · e2e (re-run) 124/124 87/87. The r4 shots/freeze/parity logs are consistent (592, 0 FAIL, 157/942; 280/280; 0/0/24).

## 1. What was run (all on HEAD 2c5887f unless noted; origin/develop still 4deb8cf)
| Check | Result | Log |
|---|---|---|
| tsc, tsc -p e2e, lint | rc 0 | `sc481-r5-tsc-lint.log` |
| jest | 6168 passed / 1 skipped, 249 of 250 | `sc481-r5-jest.log` |
| lifecycle halves | 21/21 + 21/21 (G-S11, G-S12, G-S14, G-S50, G-S53 included) | `sc481-r5-lifecycle-1.log`, `-2.log` |
| e2e (re-run, because the delta touches the host's locate path) | 124/124, 0 known-bug, 87/87 | `sc481-r5-e2e.log` |
| G-S53 (HEAD harness) on the d250e97 bundle | FAIL: callout upper `[6,null]` + 1 error card; callout/quote adoption off [7,5]; callout/quote form Save names [Twin, Twin] | `sc481-r5-gs53-d250e97.log` |
| G-S53 on the 4deb8cf bundle | FAIL: 27 callout/quote problem lines (plus the original plain-twin ones) | `sc481-r5-gs53-4deb8cf.log` |
| r3 HIGH/MEDIUM probes | all correct (table below) | `sc481-r5-probe-run-head-1.log` |
| regression and Live Preview callout probes, HEAD vs base | see §2 | `sc481-r5-probe-run-head-2.log`, `sc481-r5-probe-run-base-2.log` |

r3 probes on HEAD (`run-head-1`):
- **Callout twins, default settings.** Upper click: [6,5] with cards [6,5], no error card, claims +1, collisions 0. Lower click: [6,6]. Upper again: [7,6].
- **Quote twins, default settings.** Same sequence and same results.
- **Adoption off, quote and callout twins.** Upper click: [6,5], cards [6,5], 1 `reused-by-twin` release. Lower click: [6,6].
- **Form Save on the upper twin, quote and callout.** After Save: names [Edited, Twin]. Lower click: disk [5,6], names [Edited, Twin].

## 2. Findings

### LOW-1: no test pins the window ordinal (`quoteOrdinal` inside `fenceOnElement`)
- **Where:** `src/framework/host/ReadingModeBlockHost.ts:325`: `locateInSectionLines(lines, section, alias, null, quoteOrdinal(el, alias), null)`.
- **Mutant ord** (ordinal forced to -1, so a window with several blocks becomes 'ambiguous' and returns null) survives all of framework jest (1086 passed, `sc481-r5-mut-ord-jest.log`). It also survives G-S53, whose callouts hold one block each.
- **Real-Obsidian effect of the mutant** (`sc481-r5-probe-run-mut-ord.log`): `R3/callout-pairs.md` is two identical callouts, each holding counter X and counter Y.
  - Click on X1: the cards read [6,2,2] and 1 card is empty (the vanish is back).
  - Later clicks write the wrong blocks: disk [6,3,5,3] where [6,3,6,2] was wanted.
  - Adoption off: [7,3,5,2] where [6,3,6,2] was wanted.
- **HEAD is correct on the same probe** with adoption on and off (6 clicks each; `run-head-2` "pairs").
- **Fix:** add a jest case to `twin-reuse.test.ts` with two identical callouts of two blocks each: click the upper X, then the lower X, then the lower Y; adoption on and off. Optionally add a two-block callout phase to G-S53.

### LOW-2: jest does not exercise the window branch of `remountVacated` (adoption path)
- **Where:** `src/framework/host/remountReused.ts:77`.
- **Mutant vac** (`remountVacated` returns early for any element inside `.callout, blockquote`) passes framework jest (`sc481-r5-mut-vac-jest.log`). G-S53 catches it: "callout twins, click upper: 1 card(s) for 2 blocks"; same for quote (`sc481-r5-mut-vac-gs53.log`).
- So the r4 jest case "callout/quote, UPPER one clicked" is not taking the adoption path that real Obsidian takes (claims +1 there). It is passing through `reconcile` or a fresh draw instead.
- The battery as a whole catches it, so this is LOW.
- **Fix (optional):** in that jest case, assert `registry.stats.claims === 1` and that the twin's element was redrawn through the vacated path, so the case pins what Obsidian does.

### INFO
1. **Equivalent mutant "close".** Dropping the plain-section close-fence check (`ReadingModeBlockHost.ts:322`) survives jest, G-S6u, G-S28, G-S7a, G-S53 and the probe `R3/unterm.md` (a closed block, then an unterminated block at EOF; 4 alternating clicks, all correct). Obsidian ends that section on the trailing empty line, so the body read is the same either way (`sc481-r5-mut-close-lc.log`, `sc481-r5-probe-run-mut-close.log`). The check is defensive; no action.
2. **Live Preview callouts (SC-537) are the same as base.** Probe `lpcallout`: callout twins, two-block callout pairs and nested callout twins, 5 clicks each. HEAD and 4deb8cf match on every step: disk (for example callout twins [6,5] -> [7,5] -> [8,5], every click writing the upper block), cards, editor cursor line and Notice count (1 at step 5 in both). No error cards on either side. Live Preview quote fences are not drawn as DSE cards on either side. This is the base behaviour the ruling splits out, not a finding.
3. **The `locateInSection` -> `locateInSectionLines` split is behaviour-neutral.** The wrapper now calls `locateInSectionLines(splitLines(content), …)` with the old body unchanged (`ReadingModeBlockHost.ts:225-237`). Quote/callout writes land in the right fence: G-S11 (callout, nested pin + sidebar write), G-S12 and G-S14 are green, and so are the r5 window probes (`quote-diff.md` 4 clicks, `callout-one.md`, `nested-twins.md`, `callout-pairs.md`). **CHANGELOG** (superproject 3e74be1c) is accurate for HEAD:
   - "blocks inside a callout or a quote … covered too" is true in Reading view.
   - "(Identical blocks in two separate callouts are not covered in Live Preview yet.)" matches SC-537.
   - Live Preview quotes draw no cards at all, so leaving them out is correct.

### Regression sweep detail (`run-head-2` vs `run-base-2`)
- **Different-body counters** (`five.md`, 6 clicks, adoption on): 0 `pipeline.run`, every tagged root kept. Adoption off: 1 draw per click.
- **Non-twin windows.**
  - `callout-one.md` (a single counter in a callout plus a plain one): 0 draws, roots kept.
  - `quote-diff.md` (a quote with QA/QB, a callout with CA/CB): 1 draw per click. That is the sibling inside the re-rendered window, and base does exactly the same. 0 `reused-by-twin` releases.
- **G-S53 plain phases** (2/3 twins, montage, adoption off, form Save, Live Preview) are green on HEAD.

## 3. Mutation table (framework jest, `test/dom/framework`, 1088 tests; scratch copy of 2c5887f)
| Mutant | Change | jest | Other |
|---|---|---|---|
| none | — | 1086 passed | — |
| md (r3 LOW-1) | delete the `lastWriteLine` skip (`:590`) | **1 red** (r4 two-docId case) | — |
| guard (r4) | window section taken whole | **4 red** | — |
| window (r4) | window sections never judged | **6 red** | — |
| ord | ordinal forced to -1 | 0 red | survives G-S53; real-Obsidian probe breaks (LOW-1) |
| vac | `remountVacated` skips windows | 0 red | **G-S53 FAIL** (LOW-2) |
| close | drop the plain close-fence check | 0 red | survives G-S6u/G-S28/G-S53 and the unterm probe (INFO-1, equivalent) |

## 4. Working tree
`git status --porcelain`: plugin empty (ignored set unchanged), superproject ` M draw-steel-elements`, before and after. Mutants and bundles were built only in scratch copies (`head-src/`, `d250-src/`); the worktree was never edited.

## Artifacts
- Effort dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/`:
  - this report;
  - `sc481-r5-tsc-lint.log`, `sc481-r5-jest.log`;
  - `sc481-r5-lifecycle-1.log`, `sc481-r5-lifecycle-2.log`, `sc481-r5-e2e.log`;
  - `sc481-r5-gs53-d250e97.log`, `sc481-r5-gs53-4deb8cf.log`;
  - `sc481-r5-mut-{none,md,guard,window,ord,vac,close}-jest.log`, `sc481-r5-mut-vac-gs53.log`, `sc481-r5-mut-close-lc.log`;
  - `sc481-r5-probe-run-{head-1,head-2,base-2,mut-close,mut-ord}.log`.
- Scratch (probe kit `probe-r3.mjs` + `mkprobe.py` + `probe.sh`, mutate/build scripts, bundles `bundle-d250`, `bundle-{vac,close,ord}`, raw `run-*/p481-r3.json` and shots): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc481-r5-review-ab18c95bec20e977d/`
