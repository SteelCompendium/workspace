# SC-600 r2 independent review report

## Executive summary
- VERDICT: **LAND-READY**. Reviewed dse head `1116e06d` (base `dcc53f0f`) and superproject changelog commit `e3a3a0f0`.
- `adjustInstances` (`src/elements/initiative/model.ts:278-292`) implements Scott's ruling "A" exactly. Kept instances keep their state. A grow appends fresh instances at the end. A shrink trims from the end before validation. The minion pool is never read or written.
- 0 HIGH, 0 MEDIUM, 2 LOW (comment accuracy only), 4 INFO.
- Gates I re-ran: tsc clean, lint clean, jest 10803 passed / 1 skipped (the shots CSS cache was present; this equals r1's fresh 10802/2, a delta of +15), e2e full `306/309 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`.
- The new e2e scenarios fail on the base: with base `model.ts`, INIT-AMT-E01 and E02 FAIL (and so do my 2 extra probes); on head all 4 pass.
- Probes: 11 throwaway jest probes, all green (ids, amount and instances shapes, statblock grow, multi-squad pools, captain bonus, repeated re-edits). 2 throwaway real-Obsidian probes, green on head: in a two-block note the other block stays byte-identical, and a 3->4->2->5 chain of hand edits with UI saves keeps Ogre #2's state.
- Lifecycle, shots, freeze and parity were NOT re-run: the diff touches only `model.ts`, tests, an e2e spec and fixture, and docs (no view, CSS or harness).
- The trees are as I found them: dse clean at `1116e06d`; the superproject shows only the pre-existing unstaged `draw-steel-elements` pointer. The ignored `main.js` was rebuilt from head after the base-model probe run.

## Findings

### LOW-1: doc comment overstates "an id is never reused"
- `src/elements/initiative/model.ts:272-273` (JSDoc of `adjustInstances`).
- Scenario (probe, jest and real Obsidian R2P-02): the ids go 3 -> 4 -> 2 -> 5, which gives [1,2,3,4] -> [1,2] -> [1,2,3,4,5]. Ids 3 and 4 were trimmed and are then handed out again. Ids are unique only within the current list (max + 1 of the KEPT entries). This matches the ruling, but the comment reads as a global guarantee. A persisted `selectedInstanceKey: 0-4` left over from before the shrink would select the new #4 after the grow. That is cosmetic.
- Fix: reword to "ids are max kept id + 1, + 2, ...; an id still in the list is never duplicated (an id trimmed earlier can come back)."

### LOW-2: the model.ts header still says instance materialization is a verbatim transcription of legacy
- `src/elements/initiative/model.ts:14` ("Everything else is transcribed VERBATIM and in the same statement order").
- Scenario: a future reader trusts the header and "re-syncs" the length-mismatch branch with the legacy oracle (`src/drawSteelAdmonition/EncounterData.ts:836,:882`, which still rebuilds the whole list). That would bring SC-600 back.
- Fix: add one line to the header, e.g. "SC-600: instance materialization on an amount/instances mismatch deliberately differs from the oracle (`adjustInstances`)."

### INFO-1: legacy oracle left with the old rebuild (owner ruling DROP; confirmed sound)
- `src/drawSteelAdmonition/EncounterData.ts:836` (minions), `:882` (regulars).
- `git grep parseEncounterData -- src main.ts` finds only its definition and comments; nothing in src calls it. jest passes with it untouched. The other `instances.length` sites: `EncounterData.ts:271` is an emptiness check and `view.ts:1774` is a `> 0` read. Neither rebuilds. `resolveRefs.ts` phase 3 fills stamina on whatever instances exist, so appended ones are covered. `resetEncounter` (`EncounterData.ts:668`) sets instances to `undefined`, which takes the unchanged fresh path. No other site needed the change.

### INFO-2: a grow with a malformed kept entry now shows the error card instead of silently resetting
- `model.ts:285` (`kept.forEach(validateKept)` runs on every mismatch now).
- Before, any mismatch skipped validation and rebuilt. Now `amount: 3 -> 4` with a kept `conditions: 42` throws the same message as the same-length path. This is the brief's item 5 and is consistent. Noted only because users can see it.

### INFO-3: side effects of the change, all improvements
- A fractional `amount` (2.5) used to mismatch on every parse and reset all instances on every save. It now keeps ceil(amount) instances stably.
- `instances: "abc"` with `amount: 3` used to throw a TypeError (`forEach` is not a function). It now builds a fresh list.
- Kept minions keep `isDead`. The orphaned-captain-bonus un-wind therefore counts the adjusted alive count: kept dead minions stay dead and appended minions are alive. Probe: pool 78, N 4, #1 dead, amount 4->6 gives 58 (old full rebuild: 54).

### INFO-4: pre-existing, not introduced: `amount: .inf` hangs the parse
- `model.ts:284`: `want = Math.ceil(Infinity)`, so the `while` never ends. The old `for (i < amount)` hung the same way. Not a regression. If wanted, a separate Backlog ticket could cap `amount` or reject non-finite values.

## Probe evidence
| Probe | Result |
|---|---|
| duplicate ids [1,1]: grow to 3 / shrink to 1 | [1,1,2] / [1] (first kept, stamina 3) |
| ids NaN, Infinity, 1.5, -5: grow | [NaN,1], [Inf,1], [1.5,2.5,3.5], [-5,1,2]; no throw (validation unchanged) |
| string id `"1"` inside the list / `"x"` beyond the trim | throws `index 0` / no throw |
| amount 0, -2, NaN with 3 instances | [] in each case |
| `instances: []` with amount 3 | ids 1..3, full fresh shape, written whole |
| `instances: {}`, `5`, `null`, `abc`, `{a: 1}` | fresh ids 1..3 |
| kept sparse instance (`{id:2}`) on a grow | stays `{id: 2}` in the written YAML (no default keys added); fixed point |
| statblock-sourced Orc (max from statblock 40), 2 instances -> 4 | after resolveRefs: [12, 40, 40, 40]; appended `{id, current_stamina: 40, temp_stamina: 0, conditions: []}`; merged name/max not frozen into the block; kept `{id:2}` stays sparse; full-pipeline fixed point |
| multi-squad group, Flow A 3->5, Flow B 3->2 | per-creature pools 11 / 9 unchanged; no group pool appears; B keeps #2 `slowed` |
| captain bonus active with the captain bound, amount 4->6 and ->2 | pool 50, max 52, flag true: unchanged |
| orphaned bonus un-wind after an amount change | see INFO-3 |
| 3->4->2->5->3 serialize chains | #2 keeps 25 + `grabbed` (plain name); the other group's bytes and the hero bytes are identical at every step |
| real Obsidian R2P-01: two-trackers.md, block 0 hand-edited to amount 3 with 1 instance, cell click | block 1 byte-identical to the fixture; outside text identical; block 0 [9 grabbed, 60 fresh, 60 fresh] |
| real Obsidian R2P-02: amount-edit.md 3->4->2->5, a click save after each | 1 write per click; outside text identical; final #2 25 `grabbed`, #3-#5 fresh |
| base model (`dcc53f0f` model.ts) under INIT-AMT-E01/E02, R2P-01/02 | 0/4 ok, 4 FAIL (each a toMatchObject diff on the reset instances) |

## e2e scenario review
- `e2e/specs/initiative/amount-edit.e2e.ts`: the hand edit is a plain `vault.process` (`dse.externalEdit`). The scenario waits until the Reading view shows 4 / 2 cells, then a real click on a DIFFERENT Ogre's `init.cell.stamina` saves once (the `selectedInstanceKey` write serializes the whole model). It then reads the note. Text outside the block is checked byte-exact by the harness after every test, even when the note is exempted for an externalEdit (`noteFences.ts:132-137`).
- Titles `[INIT-AMT-E01]` and `[INIT-AMT-E02]` carry no bracketed ticket id. The README fixture row is added. The pair already existed in the manifest: 174/174.
- Minor (not a finding): the spec asserts kept Ogres #1 and #3 with `toMatchObject`, so it would not catch a default key being added to them. The jest probe "kept sparse instance" and r1's integrity test cover that at the model layer.

## Changelog
- `CHANGELOG.md` (worktree superproject, `e3a3a0f0`) under `## Unreleased`: plain and accurate. It covers grow, shrink, minions with the pool untouched, captains and regulars. Style matches the SC-582 bullet.

## Gates (measured by r2)
| Gate | Measured | Log |
|---|---|---|
| tsc (`npm run tsc`, incl. e2e) | rc 0, clean | `r2-tsc.log`, `r2-static-rc.txt` |
| lint | rc 0, clean | `r2-lint.log` |
| jest | `Tests: 1 skipped, 10803 passed, 10804 total`; Suites 268 passed / 1 skipped; rc 0 (the shots CSS cache was present, so this equals fresh 10802/2: +15 over CURRENT) | `r2-jest.log` |
| e2e full | `OBSIDIAN-E2E done: 306/309 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`, rc 0, pointer parked | `r2-e2e-full.log` |
| e2e probes on head | `4/4 ok` (INIT-AMT-E01/E02, R2P-01/02) | `r2-e2e-probe-head.log` |
| e2e on the base model | `0/4 ok, 4 failed` | `r2-e2e-probe-base.log` |
| jest probes | 11/11 passed | `probe-run.log` |
| lifecycle, shots, freeze, parity | not re-run (out of scope per the brief: no view, CSS or harness change) | |

All logs are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc600-r2-review/`.
