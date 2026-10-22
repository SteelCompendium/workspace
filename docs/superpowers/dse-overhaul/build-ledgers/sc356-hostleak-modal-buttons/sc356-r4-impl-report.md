# SC-356 round 4 implementer report (rebase-only)

STATUS: DONE
- dse branch sc356-hostleak-modal-buttons @ ea56712 on origin/develop 54f8f88 (tip at fetch time, re-fetched before the battery). 6 commits, clean, on its branch. No rebase in progress.
- Superproject: doc commit 23147f2 on origin/main 46ae296 (rebased twice: first onto fc3bd71, then onto 46ae296 after the 429 resume). No conflict markers.
- range-diff 8d890f9..2796ab8 vs 54f8f88..HEAD: all 6 commits `=` (identical patches): 9018204=0409d3b, a6480ba=b856448, a51e97f=ce2e15f, 23b280e=56a748b, e572c67=6854ca2, 2796ab8=ea56712.
- SC-361 NOT reconciled: it is not on develop (the `--grep=SC-361` hits are SC-338 commits 994cac8/246a35b that merely mention it; styles-source.css only carries the "see SC-361" comment). Allowlist and SKILL.md bullet unchanged.
- Full battery run once on the final head with fresh *-c logs (the pre-kill run was discarded): all green, numbers below. FormModal scenario still opens; modal pass totals identical to round 3 (10 / 9 / 38 / 228), so it sweeps the same kinds.

## Rebase notes
- dse: clean rebase from 8d890f9 to 54f8f88 (SC-483: FormModal.ts + its test only; no overlap with shoot.mjs / styles-source.css).
- Superproject: one CHANGELOG `## Unreleased` conflict (SC-483's bullet vs SC-356's) -> kept every bullet (SC-432, SC-483, SC-356, then the older ones). SKILL.md merged cleanly (SC-483 touched only CURRENT).

## Gates (final head ea56712)
- tsc (incl. -p e2e): exit 0, no output. lint: exit 0.
- jest: `Test Suites: 1 skipped, 234 passed, 234 of 235 total` / `Tests: 1 skipped, 5607 passed, 5608 total` (5601 + 6)
- lifecycle: `OBSIDIAN-LIFECYCLE done: 31/31 ok, 0 failed`
- e2e: `OBSIDIAN-E2E done: 95/98 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs`
- shots: 580 PNGs, 0 FAIL. `button host-leak OK (112 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 672 comparisons …)`; `modal button host-leak OK (10 modal scenarios over 9 modal classes, 38 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 228 comparisons …)`; `100 property difference(s) ALLOWLISTED as known leaks owned by another ticket (SC-361: .dse-swatch, 10 properties)`; `text scale OK (1626 comparisons …)`; `text scale once OK (104184 comparisons over 208 loads … 84s)`.
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`
- parity: `**0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).**`

(Shots exceeds 600s: launched from a script file with output to a per-run log and waited on its own exit file.)

Artifacts: scratch logs /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc356-r4-impl-h8w3/ (*-c.log authoritative).
