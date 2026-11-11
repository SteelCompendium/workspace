# SC-566 r2 independent review report

Executive summary
- Verdict: LAND-READY. Reviewed head: dse `a918c78c` (branch `sc566-pool-modal-overkill`, one commit on `origin/develop` `a339e7b3`, confirmed unmoved after `git fetch`).
- Findings: 0 BLOCKER / 0 HIGH / 0 MEDIUM / 1 LOW / 4 INFO. The LOW is a hand-edited negative pool (unreachable through the UI), the same class as the 25/20 case the owner already dropped.
- jest: `Tests: 1 failed, 1 skipped, 7083 passed, 7085 total` in the full run. The 1 failure is an SC-568 load timeout (`twin-reuse.test.ts`, SC-547 40-block test, loadavg 19.5 at the end). The suite alone: 53/53. So the result is 7084 passed / 1 skipped, which matches the expectation (7082 baseline + 2 new tests, shots CSS cache present).
- e2e: `OBSIDIAN-E2E done: 254/262 ok, 0 failed, 8 known-bug, coverage: 163/163 pairs`, rc 0 (pointer parked; POOL-A02 ok, 2558 ms; loadavg 8-16). Matches CURRENT, no delta.
- tsc (incl. `-p e2e`) clean; lint (incl. `e2e/`) clean.
- Note bytes: identical to `a339e7b3` in all 37 probe scenarios (serialized with the initiative model's own `serialize`), persist call counts identical, preview bar DOM identical in every scenario.
- Vacuity: with only `src/views/MinionStaminaPoolModal.ts` reverted to `a339e7b3`, exactly 3 tests fail (the overkill matrix row, the flipped SC-566 test, the hurt-squad test: "Deal 495"/"Deal 198"). The heal guard test passes either way, as the report says.
- Markers: SC-567, SC-573, SC-574 (a), SC-574 (b) fail on HEAD with the same assertion and values as on `a339e7b3`. SC-591 and SC-592 have no marker in the tree (INFO-2).

## Method

Every artifact is in the scratch dir
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc566-r2-rev-r2a/`
(written `S/` below).

- `S/base` = `git archive a339e7b3`; `S/head` = `git archive a918c78c`; `S/revert` = head with the modal source reverted to `a339e7b3`. Each one has `node_modules` symlinked to the main checkout's. Nothing was written into the worktree except jest's own `main.js`/`styles.css` (gitignored; jest's protocol `rm -f main.js styles.css`, which jest and e2e rebuild).
- The probe `S/sc566-probe.test.ts` (copied to `S/{base,head}/test/dom/probe/`) builds the squad through `initiative/model.parse`, drives the modal, records the label, aria-label, title, disabled state, info line (or hidden), stepper, kill boxes, warn icon and preview-bar HTML, then hand-ticks any owed kills, clicks Apply and records `serialize(model)` and the persist calls. Outputs: `S/probe-base.json`, `S/probe-head.json`, logs `S/probe-*.log`.
- Markers: `S/{base,head}/test/dom/views/zz-markers-unfailed.test.ts` (the matrix file with `test.failing(` changed to `test(`), logs `S/markers-base.log`, `S/markers-head.log`.
- Vacuity: `S/matrix-revert-vac.log`.
- Gates: `S/tsc.log`, `S/lint.log`, `S/jest-full.log` (+ `.rc`, `jest-full.load`), `S/jest-twin.log`, `S/e2e.log` (+ `.rc`, `e2e.load`).

## Probe results (label on HEAD; base value in brackets where it changed)

| # | Scenario | Label | Info line | Apply | Note bytes vs base |
|---|---|---|---|---|---|
| 01 | 99 x 5, pool 20 (repro) | Deal 20 damage, kill 5 [495] | 20 damage will kill 5 … [495] | enabled, xxxxx | identical (pool 0, all dead) |
| 02 | exact kill 4 x 5 = 20 | Deal 20, kill 5 (unchanged) | 20 … | enabled | identical |
| 03 | one under, 19 x 1 | Deal 19, kill 4 (unchanged) | 19 … kill 4 | disabled, "Select 4" | identical |
| 04/05 | one over, 21 x 1 and 7 x 3 | Deal 20, kill 5 [21] | 20 … [21] | enabled | identical |
| 06 | single minion overkill 99 x 1 | Deal 20, kill 5 [99] | 20 … [99] | enabled | identical |
| 07 | 99 x 0 (no minions hit) | No Stamina Change | hidden | disabled | no write either side |
| 08/09 | pool 12, 2 dead: 99 x 3, 99 x 1 | Deal 12, kill 3 [297 / 99] | 12 … | enabled | identical |
| 10 | pool 12, 2 dead: 5 x 2 (one under) | Deal 10, kill 2 (unchanged) | 10 … | disabled, "Select 2" | identical |
| 11 | underfunded pool 6, 5 alive: 99 x 5 | Deal 6, kill 5 [495] | 6 … | enabled | identical |
| 12/13 | underfunded: 1 x 1, 2 x 1 | Deal 1 / Deal 2, kill 1 (unchanged) | | | identical |
| 14 | underfunded: 7 x 1 (one over) | Deal 6, kill 5 [7] | 6 … [7] | enabled | identical |
| 15 | pool 0, 5 alive (SC-573): 5 x 1 | Deal 0, kill 5 [5] | 0 damage will kill 5 [5] | enabled | identical; owner ruled → SC-573 |
| 16 | two presses 99 x 5 then 3 x 1 | Deal 20, kill 5 [498] | 20 … [498] | enabled | identical |
| 17 | overkill then stepper + | Deal 19, kill 4 (unchanged) | | disabled, "Select 4" | identical |
| 18 | overkill then Reset | No Stamina Change | hidden | disabled | no write |
| 19/20 | overkill then half-typed draft 5 / 25 | Deal 15, kill 3 / No Stamina Change (unchanged) | | | no write (pre-existing SC-430 prediction) |
| 21 | captain bonus pool 30: 99 x 5 | Deal 30, kill 5 [495] | 30 … | enabled | identical |
| 22/23 | hand-edited pool 25/20: 99 x 5, 3 x 1 | Deal 25, kill 5 [495] / Deal 3, kill 1 | | | identical |
| 24 | hand-edited pool -5: 3 x 1 | **Deal 5, kill 5 [3]** | **-5 damage will kill 5 … [3]** | enabled | identical (LOW-1) |
| 25-28, 31 | heals within the max (typed, typed 99, half-typed 99, partly dead, underfunded) | Heal 2 (unchanged) | Heal 2 …; dead minions stay dead. | enabled | identical |
| 29/30/32 | refused heal past the share (typed / half-typed) | Heal 6 / Heal 14 (unchanged) | "A heal can't raise …" | disabled + reason title | no write |
| 33 | pool 18, overkill then 25 x + | Heal 2 (unchanged) | | enabled | identical |
| 34/35 | hand-edited 25/20: + / type 22 | No Stamina Change | hidden | disabled | no write |
| 36 | 1e3 x 2 | Deal 20, kill 5 [2000] | 20 … | enabled | identical |
| 37 | typed pool 0, then 99 x 5 | Deal 20, kill 5 [515] | 20 … | enabled | identical |

In every row the label's kill count equals `minionsToKill`, equals the boxes Apply kills, and agrees with the disabled tooltip. The label and the info line state the same amount. The amount equals the stepper's drop (pool before minus the stepper value) in every reachable row. The preview bar HTML is byte-identical to base in all 37 rows, so the bar still draws the full damage.

Heal direction: no defect, which confirms the implementer. Every heal reaches `pendingStaminaChange` only through the stepper's `onChange` (value ≤ max), and a draft is clamped by the stepper before `onDraftInput`. Labels in rows 25-35 are unchanged from base. Folding `appliedPoolChange` into the heal label is a no-op on every reachable path.

## Findings

### LOW-1: a hand-edited negative pool reads "-5 damage" and flips the label's sign (unreachable through the UI)

- Where: `src/views/MinionStaminaPoolModal.ts:390` (`if (raw < 0) return Math.max(raw, -poolCurrentStamina);`), read at `:444` (info) and `:478` (label). The docstring at `:383-386` says "The sign never flips".
- Scenario: the note holds `minion_stamina_pool: -5` (hand edit only; every write path clamps at 0: the modal's Apply at `:288`; `EncounterData.ts:385` and `:425` (captain bonus transitions) use `Math.max(0, …)`). Damage 3 x 1. `appliedPoolChange(-3)` = `max(-3, 5)` = **+5**. The info line reads "-5 damage will kill 5 minion(s).", the label reads "Deal 5 damage, kill 5 minion(s)", and Apply writes 0 (the pool goes UP by 5). Base read "3" in both places. The note bytes are unchanged.
- Fix (one line): `if (raw < 0) return Math.max(raw, -Math.max(0, poolCurrentStamina));`. That reads "Deal 0 damage", the same wording as the SC-573 pool-0 case. Or reword the docstring and drop it as the owner did the 25/20 case (same class: hand-edited state outside [0, max]).

### INFO-1: docstring overstates "the ONE copy of this math"

`:380-386`. Apply's write keeps its own clamp (`:288`, `Math.min(maxStamina, Math.max(0, newStamina))`), and so does `clampedNewStamina` (`:394-397`). The helper is the one copy for the label and info line only. The claim that they "cannot disagree … with what Apply writes" holds on every reachable state (rows 01-23, 25-37) but not in LOW-1's. Suggest: "the one copy the label and info line share; Apply and the stepper keep their own [0, max] clamp".

### INFO-2: SC-591 and SC-592 have no markers to check

`command grep -rn "SC-59[12]"` over `src/ test/ e2e/` finds nothing. The SC-572 ledger filed them as Backlog tickets without `test.failing`/`knownBug` markers. Brief item 5 is therefore covered for SC-567/573/574 only. The four markers fail on HEAD with base's exact assertions and values (`Expected: > 2 / Received: 1`; `Expected: false / Received: true`; `Expected length: 1 / Received length: 0`; the one-line array diff).

### INFO-3: CHANGELOG bullet is in the right file and section; no workspace bullet

`draw-steel-elements/CHANGELOG.md`, the `## 7.0.0 (unreleased; previously numbered 6.0.0)` list, `[FIX]`. It sits directly above its sibling SC-572 pool-modal bullet rather than at the top of the list. The list is not strictly chronological (SC-576 and SC-480 lead, SC-572 is further down), so this is fine. The text is accurate (20, the bar keeps full damage, the write is unchanged). "the line above it" is loose: the info line sits above the minion list, which sits above the footer's Apply. The workspace `CHANGELOG.md` `## Unreleased` has no SC-566 bullet; SC-572 (the latest pool-modal precedent) also has none, SC-480 has one. Owner's call.

### INFO-4: the heal guard test is a guard, not a regression test

`test/dom/views/minion-stamina-pool-modal-matrix.test.ts:357-371` passes with the fix reverted (see Vacuity). As the implementer reported, this is correct: there is no heal defect to regress. Mentioned only so nobody counts it as coverage of the fix.

## Not re-run

Lifecycle, shots, freeze and parity were not re-run. The `src/` diff changes only two text expressions in this modal plus a private helper. No CSS or DOM structure changes. The only DOM change is the label and info text, which no frozen or print shot covers: the pool modal is camera-only, and the shots modal pass keys on button kinds, not text.
