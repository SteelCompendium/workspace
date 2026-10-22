# SC-279 r9 — independent re-review of the r8/r8b rebase (supersedes sc279-r9-rereview-interim.md)

## Executive summary
- **VERDICT: APPROVE.** Reviewed DSE `edb90d2` on develop `ea56712` and superproject `fd59a61` on main `e5f329a`. I authored none of this code. Both trees are clean before and after my run.
- Both bases have moved since. origin/develop is now `3973b56` (14 SC-482 commits): **0 files overlap** with our diff. origin/main is now `da28109` (SC-482 CHANGELOG + DSE pointer). Our superproject commits touch only DESIGN.md and the pointer. I did not rebase.
- The range-diff is clean: 9/9 commits are `=`, plus the new `edb90d2` (GIF refresh). The r8 range-diff (05a6ff3..ae0efd8 → 54f8f88..f3a4476) was also clean: 7 `=`, the docs commit re-made, a0d3fa6 dropped per SC-407, and f3a4476 new. Nothing of ours was lost and nothing of develop's was reverted.
- My interim findings are both fixed and verified. MEDIUM-1: I looked at the new GIF frames myself and they show `Roll` + collapsed `Modifiers  Might 0`. LOW-1: the DESIGN.md row now points at `docs/settings.md (Rolling)`.
- My battery on edb90d2 reproduces every expected number. tsc/lint clean · jest 5633/1/234 of 235 · lifecycle 31/31 · e2e 95/98, 0 failed, 3 known-bug, 66/66 · shots 592, 0 FAIL, modal button host-leak 228 comparisons, text scale OK (1626), once OK (107256/214) · freeze: exactly the 2 roll print lines · rebaseline byte-identical · substitution 280/280 · parity 0/0/24.
- I ran the once-gate with and without f3a4476. The fix is necessary: develop's loader times out (`FAIL sweep (exception)`) because the rolled pages need `rollingEnabled`. It does not weaken the gate: 126/131 pages are byte-identical, the 5 that differ are all SC-279's own, and the non-SC-279 pages measure 104361/209 under both loaders.
- The 107256 vs 107259 drift is **ours, not develop's**. The once-gate replays our rolling clicks without `fixedDice`. A natural 19–20 adds the `.dse-rollcard__crit-note` element, which is +3 comparisons per crit page; I measured it with pinned dice (2583 vs 2595 over the 4 pages). There are 0 violations either way. One LOW finding, optional to fold in.
- Gating holds. Experimental OFF: ds-roll shows SC-406's inert card, and the card roller works with the strip collapsed (`Might 0`). Experimental ON: the ds-roll strip renders collapsed. The strip is absent from both print PNGs.

## Findings

### LOW-1 — the text-scale-once gate's comparison count is nondeterministic (introduced by f3a4476)
- Where: `draw-steel-elements/visual-harness/shoot.mjs:~7086` (the interactionShots `pages.push` added by f3a4476) and `:~7103` (the click + thenClicks replay). Line numbers are approximate after SC-356; anchor on the `// SC-279: an interaction shot may carry` comment.
- Cause: `snap()` pins `Math.random` for shots flagged `fixedDice` (shoot.mjs, the `if (opts.fixedDice)` line in `snap`). `assertTextScaleOnce` does not. So the 4 `feature-rolled*` pages roll real random dice in the gate. A natural 19–20 renders `.dse-rollcard__crit-note` (`src/framework/kit/rollResultCard.ts:41-45`), which adds 1 measured element, i.e. +3 comparisons on that page.
- Evidence: the probe pinned dice at 0.5 (no crit) and at 0.99 (crit). The per-page counts were 522/687/687/687 (n=239) vs 525/690/690/690 (n=240), totalling 2583 vs 2595 over 4 loads, OK both times (`p5-dice-0.5.log`, `p5-dice-0.99.log`). Develop's own pages are stable: with the 5 SC-279 pages skipped, the dev-line and fix-line runs both gave 104361 / 209 loads (`p3-dev-skip5.log`, `p4-fix-skip5.log`). r8b's 107259 is one crit in one run. 2d10 ≥ 19 has p = 3/100 per roll, and there are 5 rolls across the 4 pages.
- Failure scenario: no false red is possible, because the crit note scales correctly and the gate stays OK. But the gate's printed count drifts by +3·k from run to run. Anyone comparing it against a CURRENT figure (dse-verify records it, and r8b already flagged the drift) gets a spurious mismatch, and the crit-note coverage is a coin flip.
- Fix (2 lines, harness only): carry `fixedDice: n.fixedDice` into the interactionShots `pages.push`. After `loads += 1`, add `if (pg.fixedDice) await page.evaluate(() => { Math.random = () => 0.5; });`, which mirrors `snap()`. The count should then be a stable 107256. Or accept it as-is and note "±3·k from rolled pages" in dse-verify. That is the owner's call: the gate never fails because of it, so landing is not blocked.

### INFO-1 — both bases moved after r8b (no action for review; landing note)
- DSE origin/develop `ea56712` → `3973b56` (SC-482: wrapper blocks write no undeclared default keys). The intersection of `git diff --name-only ea56712 3973b56` with our `ea56712..edb90d2` file list is **empty**.
- Superproject origin/main `e5f329a` → `da28109` (SC-482 CHANGELOG + pointer bump to 3973b56). Our 6 commits touch DESIGN.md + the pointer only, so the expected rebase conflict is the pointer alone (land-stack re-bump).
- Whether the battery must be re-run on 3973b56 before landing follows the owner's standing min-base rule. Nothing in the overlap analysis suggests a moved gate.

### INFO-2 — CHANGELOG paraphrase (carried from interim, no action)
`draw-steel-elements/CHANGELOG.md:182-196`: the bullets sit in `## 7.0.0 (unreleased…)` and describe the ability-card roller only, as r7 INFO-2 asked. "Main action - natural 19-20" paraphrases the UI's "Main action — natural 19–20". Fine.

## Scope checks (brief §2)
1. **Range-diffs.**
   - `05a6ff3..ae0efd8` vs `54f8f88..f3a4476`: 7× `=`; the docs commit was re-made (CHANGELOG reworded to the card roller + a per-ability bullet; Roll.md edits dropped; settings.md trimmed); a0d3fa6 was dropped; f3a4476 is new.
   - `54f8f88..f3a4476` vs `ea56712..edb90d2`: 9× `=`, plus edb90d2 (`docs/Media/feature-roll.gif` only, 383635 → 378371 bytes).
   - styles-source.css, entry.ts, shoot.mjs and statblock/view.ts carry patch-identical commits across both rebases.
2. **f3a4476 with/without.**
   - Static: the dumped page lists (`p1-pages.json` fix vs `p2-pages.json` dev, `p1-vs-p2-pages.txt`) are 131 pages each. 126 are identical. The 5 that differ are `roll-expanded-narrow` (+width=300) and the 4 `feature-rolled*` pages (+prefs, +thenClicks).
   - Runtime: fix line → `text scale once OK (107256 comparisons over 214 loads` (exit 0). Dev line → `FAIL sweep (exception)` / `TimeoutError: locator.click: Timeout 30000ms exceeded` (exit 1). Both lines with the 5 SC-279 pages skipped → `104361 over 209` each.
   - The measurement code (`sweepKnobs`, S=1.2, mustNotMove) is untouched.
   - Conclusion: f3a4476 is a necessary adaptation that widens coverage and weakens nothing. Its only side effect is LOW-1.
3. **Docs.**
   - `docs/Roll.md` and `docs/Media/roll.png` are absent.
   - `docs/settings.md` § Rolling is accurate and has no dead link.
   - The SC-407 guard `test/unit/build/docsDeferredGuard.test.ts` passes inside the jest run.
   - `docs/Features.md:168` GIF regenerated: frames 1–2 show `Roll` + `> Modifiers  Might 0` under the result card (`r9b-feature-roll-gif-frame1.png`, `…frame2.png`). sha256 starts `ac9e24a8142a`, matching r8b's commit message.
4. **SC-372 text scale.** `text scale OK (1626 comparisons…)` and `text scale once OK (107256 / 214 loads)`. The once-gate now really measures the card strip collapsed, expanded, at 300px and modified (the probe's per-page lines), with 0 violations including the crit-note variant.
5. **Gating (SC-406).** I ran a scratch jsdom test (`r9b-gating.log`, 2/2 pass) and then deleted the file. Results:
   - OFF: `ds-roll` → `<div data-dse-element="deferred" data-dse-deferred="roll"><div class="dse-deferred-card">ds-roll is not available in this release.</div></div>`.
   - OFF, feature with rollingEnabled: the launcher is present, there is no strip before the click, the first click gives a result card + strip with Modifiers `aria-expanded="false"` and summary "Might 0".
   - ON: the ds-roll strip mounts collapsed.
6. **Superproject.** `fd59a61` descends from `e5f329a`. The diff vs e5f329a is DESIGN.md +9 (component-map row → `draw-steel-elements/docs/settings.md` (Rolling), plus the rule-9 carve-out) and the DSE pointer `ea56712 → edb90d2`. The other 7 submodule pins equal `git ls-tree e5f329a`.
7. **Rebaseline.** My own shots give roll--steel-print `84eaaf74…` and realprint `16d5edbd…`, byte-identical to `sc279-rebaseline.txt` (`cmp` clean). I ran the substitution on a scratch COPY of `freeze-baseline.sha256` (280 lines; 2 roll lines replaced): `sha256sum -c` gives 280 OK, 0 non-OK. The real baseline is untouched (sha256 re-checked OK, mtime 2026-10-21 13:26). The print and realprint PNGs show only the Fireball card and tiers, with no strip (`r9b-roll-print-trim.png`, `r9b-roll-realprint-trim.png`).

## Battery on edb90d2 (base ea56712), measured vs expected
| gate | measured | expected |
|---|---|---|
| tsc (incl e2e) | exit 0, no output | clean |
| lint | exit 0, 0 errors | clean |
| jest | `Tests: 1 skipped, 5633 passed, 5634 total` · `234 passed, 234 of 235` | 5633 / 1 / 234 of 235 |
| lifecycle (port 9287) | `OBSIDIAN-LIFECYCLE done: 31/31 ok, 0 failed` | 31/31 |
| e2e | `OBSIDIAN-E2E done: 95/98 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs` | same |
| shots | exit 0, 592 `ok`, 0 FAIL; host-copy pin OK; button host-leak 113 kinds / 678; `modal button host-leak OK (10 modal scenarios over 9 modal classes, 38 button kinds … = 228 comparisons`; `text scale OK (1626`; `text scale once OK (107256 comparisons over 214 loads` | same |
| freeze | `FREEZE VIOLATED (2 checksum mismatches, 0 missing)`: roll--steel-print.png, roll--steel-realprint.png | exactly those 2 of 280 |
| substitution (copy) | 280 OK / 0 non-OK | 280/280 |
| parity (last) | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, exit 0 | 0/0/24 |

The interim battery on f3a4476/54f8f88 (tsc, lint, jest 5627, lifecycle 31/31, e2e 95/98, shots 592, freeze 2) is preserved in the same logs dir as `r9-*`.

## Artifacts
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/sc279-r9-rereview.md`. The interim report `sc279-r9-rereview-interim.md` sits beside it and is superseded.
- Logs and evidence, all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/sc279-r9-logs/`:
  - battery: `r9b-{tsc,lint,jest1,lifecycle,e2e,shots1,parity}.log` (+ `.exit`), `r9b-freeze1.log`, `r9b-rollhash.txt`, `r9b-substituted.log`, `r9b-baseline-sub.sha256`
  - gating: `r9b-gating.log`
  - once-gate probes: `p1-fix-full`, `p2-dev-full`, `p3-dev-skip5`, `p4-fix-skip5`, `p5-dice-0.5`, `p5-dice-0.99` (`.log` + `.exit`), `p1-pages.json`, `p2-pages.json`, `p1-vs-p2-pages.txt`, plus the generator `make-once-probe.mjs` and `diff-pages.mjs`
  - images: `r9b-feature-roll-gif-frame1.png`, `r9b-feature-roll-gif-frame2.png`, `r9b-roll-print-trim.png`, `r9b-roll-realprint-trim.png`
  - interim-round files: `r9-*`, `f-01-mid.png` (the old GIF frame), `range-diff.txt`
- Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc279-r9-review/`

## r10 — scoped confirmation of the r8c delta (DSE `4636cc8` on develop `424f47b`; superproject `29274c5` on main `89bd345`)

**Summary**
- **VERDICT: APPROVE.** There are no new findings, and r9 LOW-1 is fixed as I prescribed it.
- The range-diff `ea56712..edb90d2` against `424f47b..4636cc8` shows all 10 commits patch-identical (`=`), plus the new `4636cc8`. SC-361's changes and ours are both preserved in full.
- My shots run on 4636cc8 matches r8c's two runs: 592 ok, 0 FAIL, no ALLOWLISTED line, and `text scale once OK (107256 comparisons over 214 loads`. The once-gate count no longer varies between runs.
- Freeze shows exactly the 2 roll print mismatches out of 280. The roll hashes are byte-identical to `sc279-rebaseline.txt`. r8c's jest, lifecycle, e2e and parity logs all read clean and exited 0.
- **Both bases moved during r10**, after my first fetch showed them unmoved:
  - develop `424f47b` → `e4c5cf6` (SC-433, 3 commits). It touches `StaminaEditModal.ts`, its jest test and its e2e spec. None of these files are in our diff.
  - main `89bd345` → `6bf71ca`, the SC-433 land plus handoffs. The only expected superproject conflict is the DSE pointer.
  - I did not rebase. Note that `6bf71ca`'s handoff says "hold other landings during its final battery", yet SC-433 landed. Landing on e4c5cf6 needs the owner's min-base call. SC-433 adds e2e tests, so the e2e count will differ from 96/99.

**Checks**
1. **Rebase preserved both sides.** Our diff and develop's SC-361 move overlap in CHANGELOG.md, styles-source.css and visual-harness/shoot.mjs.
   - Our changed lines in styles-source.css and shoot.mjs are byte-identical before and after the rebase. I compared the changed-line lists of `git diff ea56712 edb90d2` and `git diff 424f47b d034103`.
   - Develop's changed lines are fully carried for all three files: styles-source.css 59 lines, shoot.mjs 156, CHANGELOG.md 6. I compared the changed-line lists of `git diff ea56712 424f47b` and `git diff edb90d2 9413527`.
2. **Dice-pin commit `4636cc8`** (`visual-harness/shoot.mjs` +3/−1) matches my LOW-1 prescription.
   - The interactionShots page entry gains `fixedDice: n.fixedDice` (~7580).
   - After `loads += 1` it adds `if (pg.fixedDice) await page.evaluate(() => { Math.random = () => 0.5; });` (~7597). This is before the clicks, the same order and value as `snap()`.
   - Only pages carrying `fixedDice` are pinned. That is the 6 SC-279 interaction shots, since the element, prefShot and chrome pages never set it.
   - `sweepKnobs`, S, `mustNotMove` and the problem reporting are untouched.
3. **My shots run on 4636cc8** (`r10-shots.log`, exit 0):

   | check | measured |
   |---|---|
   | shots | 592 ok, 0 FAIL, 0 ALLOWLISTED |
   | in-run lines | `host-copy pin OK`; `button host-leak OK (113 button kinds × 3 states … = 678 comparisons`; `modal button host-leak OK (10 modal scenarios over 9 modal classes, 38 button kinds × 3 states … = 228 comparisons`; `pipette selected look OK`; `text scale OK (1626 comparisons`; `text scale once OK (107256 comparisons over 214 loads` (= r8c run 1 = r8c run 2) |
   | freeze | `FREEZE VIOLATED (2 checksum mismatches, 0 missing)`: roll--steel-print.png, roll--steel-realprint.png |
   | rebaseline | `cmp` against `sc279-rebaseline.txt` clean |

4. **r8c log spot-check** (summary line, `.exit` = 0 for each):

   | log | summary |
   |---|---|
   | tsc, lint | clean |
   | jest1, jest2 | `Tests: 1 skipped, 5729 passed, 5730 total` · `238 of 239` (= develop CURRENT 5703 + 26) |
   | lifecycle | `31/31 ok, 0 failed` |
   | e2e | `96/99 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs` (= develop CURRENT at 424f47b) |
   | shots1, shots2 | once OK 107256/214 |
   | parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` |
   | freeze1, freeze2 | the same 2 roll lines |
   | freeze-substituted | 280 OK, `sha256sum -c exit 0` |

   I did not rerun lifecycle, e2e or parity.
5. **Superproject `29274c5`.** Against `89bd345` the diff is DESIGN.md +9 and the DSE pointer → `4636cc8`. The other 7 pins equal main's.

**Artifacts** (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/sc279-r9-logs/`): `range-diff-r8c.txt`, `r10-shots.log` (+ `.exit`), `r10-freeze.log`, `r10-rollhash.txt`. Both trees are clean.
