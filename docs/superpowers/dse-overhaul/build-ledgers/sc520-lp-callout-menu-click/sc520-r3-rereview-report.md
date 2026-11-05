# SC-520 r3 delta re-review report

## Executive summary
- VERDICT: **LAND**. Reviewed dse `a62150c` on `4f73043`, superproject `1b783d67` on `a15d81cc`. Findings: 0 HIGH / 0 MEDIUM / 0 LOW / 1 INFO.
- Range-diffs clean: dse `9be397e..32fcace` vs `4f73043..a62150c` = r2's six commits all `=`, plus one new `a62150c`; superproject `7b6065c4`/`49367042` `=` `ec81a077`/`5ee3c5da`, plus `1b783d67` (DESIGN.md wording only).
- r2 INFO-1 fixed: live in Obsidian 1.15.0 Live Preview, a nested counter (party `hero_ref`, feature effect) in a block-first callout now computes `--dse-chrome-inset: 10px` (r2: 24px); the outer anchor is 24px for both forms (root is the anchor: party, feature; descendant anchor: stamina bar). Reading view, top level and block second keep 10px.
- Hits unchanged: every panel button 15/15 grid points and `</>` 63/63, in all 12 spot cases x LP/RV.
- r2 INFO-2 fixed: DESIGN.md:353 now says "up to 9/255 of a colour step, card shadow only" — matches the measurement.
- INFO-1 (no action): the new `toContain(':not([data-dse-element] [data-dse-element] .dse-chrome-anchor')` checks the test's own constant; what makes the test bite is `ruleBody(CALLOUT_INSET)`, which looks up that exact selector in the CSS — with r2's CSS the test FAILS (`expect(received).toBeGreaterThan(-1)`, received -1).
- Re-run on `a62150c`: G-S49 `--only` ok (`done: 1/1 ok, 0 failed`); chrome jest files 70/70; with r2's `styles-source.css` 1 failed / 9 passed. Full battery not re-run (owner's instruction; implementer's numbers on target).

Evidence: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc520-r3-rereview-q2v6/` (`$R`).

## Details
- Selector (`styles-source.css`, rule 3 of the callouts block): `… .callout-content > :first-child > [CH].dse-chrome-anchor, … > :first-child > [CH] .dse-chrome-anchor:not([data-dse-element] [data-dse-element] .dse-chrome-anchor, [data-dse-element] [data-dse-element].dse-chrome-anchor) { --dse-chrome-inset: 24px }` — as prescribed. It drops the `:has()` (child combinators instead); the first-child narrowing is unchanged in effect (verified below).
- Probe (`$R/rv-r3-full.js`, scenarios R2-NARROW on a reduced list + R2-NEST; log `$R/head-r3.log.jsonl`, summary via `$R/summ.py`):
  - `nest-party-callout` LP: outer inset 24px, panel right 23px; nested counter 10px. RV: 10px / 10px.
  - `nest-feature-callout` LP: outer 24px; nested counter 10px. RV: 10/10.
  - `nest-party-top` LP/RV: 10/10. `top` LP/RV: 10. `second-text` LP/RV: rules do not match (`cc auto/block`, `callout hidden`, inset 10).
  - `callout-first` and `nar-{stamina-bar,statblock,feature,montage,party,initiative}` LP: inset 24px, panel at x 1279.5-1360 (r2 position), `</>` 63/63, all buttons 15/15; RV: 10px, all 15/15.
  - Nested roots still read-only with no panel / no one-liner (NEST records), so the change is future-proofing only.
- jest (`$R/jest-revert.sh`, scratch checkout): head `Tests: 70 passed, 70 total` (`$R/jest-head.log`); `chromeLivePreviewClip.test.ts` with `styles-source.css` from `744c0c3` (r2): 1 failed / 9 passed, the LP-clearance test (`$R/jest-on-r2css.log`); restored (`$R/jest-revert-status.txt`: only my untracked probe file).
- G-S49 (`$R/gs49.sh`, head checkout's harness, head bundle): `OBSIDIAN-LIFECYCLE G-S49 ok`, `done: 1/1 ok, 0 failed` (`$R/gs49-head.log`).

## Cleanup
Scratch worktree `$R/dse-head` removed (`git worktree remove --force`, rc=0). Branch worktree as found: superproject ` M draw-steel-elements` (pointer not bumped), dse clean at `a62150c`, superproject head `1b783d67`.
