# SC-362 round 1 implementation report

## Executive summary

- STATUS: DONE. dse branch `sc362-harness-scc-cards` @ `1684455` (one commit on base `0ce76dd`; origin/develop had not moved).
- tsc (incl. e2e) clean; lint (incl. e2e) clean.
- jest: 5419 passed / 1 skipped / 231 of 232 suites (base 5408 passed; +11 tests). Fresh worktree before shots: 5418 passed / 2 skipped.
- lifecycle (port 9363): `OBSIDIAN-LIFECYCLE done: 29/29 ok, 0 failed`.
- e2e: `OBSIDIAN-E2E done: 88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`.
- shots: 580 PNGs (572 + 8), 0 FAIL, `montage board scroll OK` printed, host-copy pin OK, button host-leak 112 kinds / 672 comparisons (unchanged).
- freeze: `freeze OK (276/276 …)` on both clean sweeps; widening file written (4 lines, 0 collisions, deterministic: the whole 580-PNG tree is byte-identical across the 2 sweeps).
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` (unchanged), exit 0.
- `shoot.mjs`: zero edits.

## What changed (all in the dse repo)

`visual-harness/entry.ts`
- Imports: `SccResolver`, `createCompendiumIndex`, two md-dse notes via the `.md` text loader (`test/fixtures/md-dse/rule/combat/opportunity-attack.md`, `condition/bleeding.md`).
- New exports next to `makeHarnessDeps`: `HARNESS_COMPENDIUM` (the two files, at synced vault paths), `HarnessCompendiumMode` (`none | fixtures | anchors-only`), `FIXTURE_COMPENDIUM` (`rule/by-scc`, `condition/by-scc` -> `fixtures`), `attachHarnessCompendium(deps, mode)` (mutates `deps`, so `makeHarnessDeps()` keeps its signature), `harnessCompendiumModeFor(targets)` (shared mode of the mount targets, else `none`; falls back to the default fixture the way `mountOne` does).
- Comment at `HARNESS_COMPENDIUM` states the seeded set is part of the frozen contract (it decides vault link vs web link in-body).
- `FIXTURES.rule['by-scc']` = `scc.v1:mcdm.heroes.v1/rule.combat/opportunity-attack`; `FIXTURES.condition['by-scc']` = `scc.v1:mcdm.heroes.v1/condition/bleeding`.
- `mountFromParams`: targets are resolved before the pipeline is built; the mode is attached before `new ElementPipeline`. New guard: every `.dse-ref-notice` (which also matches `.dse-ref-web-card`) pushes an error, so an unresolved by-SCC shot fails the sweep. No `expectNotice` opt-out was added (nothing needs one; the comment says SC-469 will).
- Stale comments fixed: `heroSparse` ("the harness compendium now carries the fury abilities" was false; hero mounts with no compendium and degrades), and the `registerHarnessElementDefinitions` "no scc fixture" note (it said error card; `ds-scc` renders a notice).

`test/dom/visual-harness/fixtures.test.ts`
- Per-fixture loop attaches the declared mode and also asserts no `.dse-ref-notice`.
- Stale `NO_FIXTURE_IDS` comment fixed.
- New `describe('harness compendium (SC-362)')`, 9 tests: rule/by-scc renders eyebrow "Combat" + title "Opportunity Attacks"; condition/by-scc renders "Bleeding"; only the 2 by-SCC fixtures declare a compendium and every other fixture gets neither `deps.compendium` nor `deps.sccAnchors`; mode of stack/gallery; `anchors-only` wires the resolver without the index; seed set is exactly the two files; `mountFromParams` clean for resolved by-SCC mounts; fails for an unseeded code (web card); fails for a by-SCC fixture in a mixed stack (no compendium). Plus +2 from the per-fixture loop (2 new fixtures) = +11.

`visual-harness/README.md`: a "harness compendium" bullet under Pieces (seam, modes, frozen seed set, notice guard, SC-469 hook).

## Shots

New PNGs (8), in `.../draw-steel-elements/visual-harness/shots/`:
`rule-by-scc--steel-dark.png`, `rule-by-scc--steel-light.png`, `rule-by-scc--steel-print.png`, `rule-by-scc--steel-realprint.png`, `condition-by-scc--steel-dark.png`, `condition-by-scc--steel-light.png`, `condition-by-scc--steel-print.png`, `condition-by-scc--steel-realprint.png`.
I looked at `rule-by-scc--steel-dark` (COMBAT eyebrow, OPPORTUNITY ATTACKS title, 9 in-body links rendered as web links) and `condition-by-scc--steel-print` (Condition / Bleeding; the two "bleeding" self-links render as vault links because Bleeding is seeded, the rest are web links). Heights are about 650 px at the 1.69 device scale, well under the 1200 px viewport.

## Freeze / widening

- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc362-harness-scc-cards/sc362-widening.txt` (4 lines, `<sha256>  <name>`):
  ```
  a06111886c3932c71ead7070c437fe7515b504719b15223f6217720cebb32399  condition-by-scc--steel-print.png
  2c8c000f28a0cd0cfe84d5aa6077647de5d33fa641c0890b21679cdd63d76e64  condition-by-scc--steel-realprint.png
  1d5d7f7ee7d157211131e338cc90e8c62bb20f3fbd42604d99fd15c71bba260e  rule-by-scc--steel-print.png
  e55015057f0847990bc5f1ee5d6d3f088973688aa2b4efb0029ec627c68040d7  rule-by-scc--steel-realprint.png
  ```
- Scripted collision check against the 276-line baseline: 0 collisions. Simulated widened baseline in scratch: 0 removed lines by sorted diff, `sha256sum -c` over the shots = 280 OK, 0 FAILED.
- Determinism: two clean sweeps (sweep 1's shots dir was moved aside before sweep 2); all 8 by-SCC PNGs identical, and the whole tree (580 files) shows 0 differing hashes.
- Hashes were taken on base `0ce76dd`. SC-349 has not landed here; re-hash on the final base after any rebase onto it (the cards are well under 1200 px, so no change is expected).
- The baseline was NOT edited.

## Gate numbers vs brief

| Gate | Base | Measured |
|---|---|---|
| jest | 5408 / 1 skipped / 231 of 232 | 5419 / 1 skipped / 231 of 232 (+11) |
| lifecycle | 29/29 | 29/29 ok, 0 failed |
| e2e | 88/92, 64/64 | 88/92 ok, 0 failed, 4 known-bug, 64/64 pairs |
| shots | 572, 0 FAIL | 580, 0 FAIL |
| freeze | 276/276 | 276/276 (x2 sweeps) |
| parity | 0 / 0 / 24 | 0 / 0 / 24, exit 0 |

## Evidence artifacts

Scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc362-r1-impl-k3m9/`:
`tsc1.log`, `lint1.log`, `jest-fx1.log`, `jest-full1.log` (fresh), `jest-full2.log` (post-shots), `lifecycle1.log`, `e2e1.log`, `shots1.log`, `shots2.log`, `freeze1.log`, `freeze2.log`, `parity1.log`, `widen-run.log`, `widen1.txt`/`widen2.txt`, `baseline-widened.sha256`, `sweep1.sha256`, `sweep1/` (the 8 new PNGs from sweep 1), `shots-sweep1-full/` (whole sweep 1, 580 PNGs). Current PNGs: `/home/scott/code/steelCompendium/worktrees/sc362-harness-scc-cards/draw-steel-elements/visual-harness/shots/`.

## Drive-by fixes

- The `registerHarnessElementDefinitions` doc comment, the `heroSparse` comment and the `fixtures.test.ts` `NO_FIXTURE_IDS` comment (the three stale comments the brief asked for; not drive-bys).

## Follow-ups

- The fresh worktree had no `node_modules`; I ran `npm ci` in the dse clone (not committed; gitignored). Worth a line in the worktree docs if it is not already there.
- shots sweep takes about 12-14 min under concurrent load, so it exceeds the 600 s foreground limit and gets auto-backgrounded; harmless but the brief's "foreground" instruction cannot hold for it.
- For SC-469: `mountFromParams` now fails on any `.dse-ref-notice`, so its degrade-card fixtures need an `expectNotice` opt-out first (as the ledger note already says), and the survey's finding that a notice was NOT counted as a failed shot before this change stands; after this change it is.
- Landing: add the dse-verify CURRENT entry and apply the 4 widening lines at landing (owner/dispatcher), per the plan.
