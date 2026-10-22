# SC-279 r9 re-review — INTERIM (paused by owner: develop 54f8f88 → ea56712)

## Executive summary
- Status: PAUSED, no verdict yet. Reviewed DSE `f3a4476` on develop `54f8f88`; superproject `c139a7d` on main `46ae296`. When I started, origin/develop was still `54f8f88` and origin/main `46ae296`. Both trees were clean at the start and are clean now. No gate process of mine is running.
- Battery on f3a4476, everything matches r8: tsc/lint clean · jest 5627 / 1 skipped / 234 of 235 · lifecycle 31/31 · e2e 95/98 ok, 0 failed, 3 known-bug, 66/66 · shots 592 ok, 0 FAIL, text scale OK (1626), text scale once OK (107256 / 214 loads), host-copy pin OK, button host-leak 113 kinds · freeze: exactly roll--steel-print + roll--steel-realprint mismatch · roll hashes byte-identical to `sc279-rebaseline.txt`. Not run yet: parity, 280/280 substitution, the f3a4476 with/without probe, gating probe, print PNG eyeball.
- Range-diff 05a6ff3..ae0efd8 vs 54f8f88..f3a4476: 7 commits are `=` (patch-identical). The docs commit was re-made (7e94726 → f9f896b). a0d3fa6 (roll.png) was dropped. f3a4476 is new. Nothing of ours was lost and nothing of develop's was reverted.
- f3a4476, read only so far (not yet proven by running it): when an interaction shot has no prefs/width/thenClicks, its query and click stay byte-for-byte what they were, so for those shots the gate is unchanged. Only our 4 `feature-rolled*` shots gain prefs (+ width/thenClicks). The measurement code (`sweepKnobs`, S=1.2, mustNotMove) is untouched. Looks like a needed widening, not a weakening. The proof by running is still TODO.
- Findings so far: 1 MEDIUM (docs GIF shows the pre-SC-279 roll bar), 1 LOW (DESIGN.md row links to the deleted Roll.md).

## Findings so far

### MEDIUM-1 — `docs/Media/feature-roll.gif` still shows the old unlabelled roll bar
- Where: `draw-steel-elements/docs/Features.md:168` embeds `Media/feature-roll.gif`. The GIF comes from `visual-harness/docs-manifest.mjs:551-564`. SC-411 committed it on develop (367817d/563f5ee), after our branch point.
- What I saw: GIF frame 2 (cropped copy at `sc279-r9-logs/f-01-mid.png`) shows exactly the row Scott's ticket complains about: `[−] 0 [+] Skill +2 [−]0[+] [−]0[+] [Main action] ↺ [Roll]`, with no captions and no Modifiers disclosure.
- Failure scenario: 7.0.0 ships with rolling ON documented in Features.md "Rolling on ability cards", and that page shows the UI this ticket removed. This effort's own standard was to refresh the roll docs image (r2 commit a0d3fa6 did it for roll.png). Develop also regenerates docs media in the same change that moves the UI (SC-377, SC-379, SC-423 commits).
- Fix: on the rebased branch, run `npm run docs-shots -- --only=feature-roll.gif --check-stable --browser-only` and commit the regenerated GIF as a SC-279 docs commit. The GIF's steps click `button.dse-roll-btn`, which is still only the header dice (`rollController.ts:96`), so the script keeps working. After the first click the GIF will show the collapsed strip.

### LOW-1 — DESIGN.md component-map row points to a deleted doc
- Where: superproject `DESIGN.md:271` (added by f60e72c). The spec column reads `draw-steel-elements/docs/Roll.md`, which SC-407 deleted and r8 correctly did not bring back.
- Fix: point it at `draw-steel-elements/docs/settings.md` (## Rolling) and/or `docs/Features.md` (## Rolling on ability cards), or use `—` as the other rows without a spec do.

### Checked, no finding
- CHANGELOG: both SC-279 [FIX] bullets sit at `CHANGELOG.md:182-196`, inside `## 7.0.0 (unreleased; previously numbered 6.0.0)` (line 20). The wording covers the ability card only, which follows the r7 INFO-2 ruling. A small paraphrase: it says "Main action - natural 19-20" where the UI says "Main action — natural 19–20". INFO only, no action.
- `docs/Roll.md` and `docs/Media/roll.png` are absent. `docs/settings.md` § Rolling is accurate and has no dead link. The SC-407 guard (`test/unit/build/docsDeferredGuard.test.ts`) passed inside the jest run.
- Superproject: HEAD descends from origin/main 46ae296. The diff is DESIGN.md (+9) and the DSE pointer 54f8f88→f3a4476. The other 7 submodule pins equal `git ls-tree origin/main`. The rule 9 carve-out text is intact.

## Remaining on resume (on the rebased sha)
Run the range-diff of the new rebase · the full battery again (develop ea56712 adds a modal pass in shoot.mjs, so re-check the once-gate merge and the shots count) · parity · the f3a4476 with/without probe using the prepared scratch generator `sc279-r9-logs/make-once-probe.mjs` (it builds a scratch copy of shoot.mjs that runs only the once gate, switching between the dev and fix interaction-shot lines and an optional skip list; re-point its anchors if ea56712 moved them) · 280/280 substitution on a scratch copy · gating OFF/ON probe · eyeball the print PNGs.

## Artifacts
- This file: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/sc279-r9-rereview-interim.md`
- Logs/evidence: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/sc279-r9-logs/` (r9-tsc, r9-lint, r9-jest1, r9-lifecycle, r9-e2e, r9-shots1 logs + .exit; r9-freeze1.log; r9-rollhash.txt; range-diff.txt; make-once-probe.mjs; f-01-mid.png)
- Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc279-r9-review/`
