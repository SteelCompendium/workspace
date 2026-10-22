# SC-482 r1 independent review — six blocks stop writing default keys

Reviewer R (agent acc2988fc38efadbd). Reviewed dse `0e67be8` (branch `sc482-wrapper-default-keys`, 6 commits on `bc4a0c5`), superproject `b159877`.

## Executive summary

- **Verdict: LAND-READY** (on the rule). No BLOCKER, HIGH or MEDIUM findings. 2 LOW, 5 INFO.
- **Rule conformance, checked against bc4a0c5's own serializer:** 54,674 (source x action) cases across all 7 elements. 54,666 are exactly "bc4a0c5 bytes minus the undeclared keys that are still unchanged", in the same order. Every fully-declared case is byte-identical. The other 8 cases are the `{}` edge in LOW-1.
- **Real Obsidian 1.14.4, reading the note file:** 9/9 probes pass across all 6 elements (counter x4, montage, negotiation, project, party and encounter). Project, party and encounter needed `experimental` on.
- **Mutation tests:** 11 of 12 single-line mutants go red. The survivor (encounter dropping `monsters`) is LOW-2.
- **Gates on 0e67be8:** tsc (incl. e2e) clean · lint clean · jest **5513 passed / 1 skipped / 234 of 235** · lifecycle **30/30** (port 9299) · e2e **89/93 ok, 0 failed, 4 known-bug, coverage 64/64** · shots **580**, 0 FAIL · freeze and parity NOT run (the owner's scope change: the rebase onto 772c3cd becomes the evidence of record). All numbers match the impl report.
- **Scope fences held:** FormModal, initiative/, hero/ and framework/host/ are untouched. Encounter `_computed` behaviour is unchanged.
- **SC-457 (origin/develop 772c3cd):** merges with no conflict (`git merge-tree`: 0 conflict markers; the only file both sides changed, obsidian-lifecycle.mjs, has hunks that do not overlap). There is no functional interaction: SC-457 changes fence locating and the language parse, not parse/serialize. G-S14 checks only that the block includes `current_value: N+1`, which is not affected by the dropped keys.

## Findings

### LOW-1 — a block with an empty source whose values come back to their defaults is written as `{}`
- Where: `src/elements/shared/undeclaredDefaults.ts:66-71` (`omitUntouchedDefaults` returns `{}`). The serializers then call `stringifyYaml({}).trim()`, which gives `"{}"`: `montage/model.ts:206`, `project/model.ts:73`, `encounter/model.ts:134`.
- Failure scenario: an empty ```` ```ds-montage ```` fence (montage parse accepts a null body). Click **End round 1**, then **Back to round 1**. `current_round` returns to its parse-time value, so every key is omitted, and the fence body becomes `{}`. On bc4a0c5 the same steps wrote the full default block.
- Evidence: the probe produced `{}` for an encounter whose source is `{}` (8 cases, `compare-fails.json`). The montage path follows the same code.
- Impact: cosmetic. `{}` is valid YAML and parses back to the same model. Nothing is lost.
- Fix: in the helper's callers, or once in the helper as a `serializeOrEmpty`, return `''` when the filtered DTO has no keys. Add one test (empty montage, End round then Back → body stays empty). Or accept it and note it in a header comment.

### LOW-2 — no test covers encounter's `monsters: []` omission (mutant survives)
- Where: `test/dom/elements/wrapperDefaultKeys.test.ts:162-176`. The encounter spec's minimal source has `monsters:` but no `party:`, so it tests only the `party: {}` leak. r0 measured a second leak, `party:`-only → render adds `monsters: []`, and no test covers it.
- Evidence: changing `src/elements/encounter/model.ts:121` to `['party'] as const` leaves all 275 tests in the SC-482/SC-466 suites green (`mut-encounter-drop-monsters.log`). The behaviour itself is correct: the real-Obsidian probe P1 shows the render write adds `_computed` and no `monsters`, and the combinatorial probe covers it at model level.
- Fix: add a case or spec. Source `party:\n  hero_count: 4\n  hero_level: 3`, render only, and expect no `monsters` in the note (`_computed` present).

### INFO-1 — the adopted view keeps the record from its first parse
- A counter with no `current_value`: + writes `current_value: 1`, then − writes the block without `current_value` (real Obsidian, C3-after). The adopted view still holds its first parse's record, in which the key was absent. After a reload, the same − would write `current_value: 0`, because the key is now declared.
- This matches SC-466's stamina-bar behaviour, and both results follow the rule. No action.

### INFO-2 — superproject and dse origins moved
- dse `origin/develop` moved `bc4a0c5` → `772c3cd` (SC-457, 11 commits). The owner already knows.
- Superproject `origin/main` moved `72e548c` → `61a8288` (a HANDOFF.md-only change). It does not conflict with b159877's CHANGELOG bullet.

### INFO-3 — project, party and encounter are `deferred` (SC-406)
- In the shipped 7.0.0 state (`experimental` off) these three render an inert card and never write. The fix therefore only reaches users who have `experimental` on.

### INFO-4 — the changed fixtures are legitimate
- I checked every changed byte fixture (counter.test.ts:45-55/651-690, montage-serialize.test.ts:351-377, negotiation-serialize.test.ts, negotiation.test.ts:51-86/1345-1373/1500/1627/1698). In each one the source omitted the defaults it now drops.
- No assertion was weakened beyond that. The montage schema-position tests still catch the M-2 insertion-order regression.
- The SC-466 test file `staminaBarDefaults.test.ts` is unchanged in the diff.

### INFO-5 — procedural
- I generated the gate scripts with `printf` from one Bash call rather than with the Write tool. Each still captures its own `rc` and redirects to a unique log.

## Probes run

1. **Byte identity and rule conformance against bc4a0c5.**
   - Setup: a scratch `git worktree add --detach` of bc4a0c5 (node_modules symlinked). One probe test file was run in both trees and dumped `serialize()` output for each (source, action) pair.
   - Inputs: every combination of absent / present = default / present ≠ default / present `undefined` for each element's defaulted keys. Montage is exhaustive over 3 states (729). Negotiation covers all 2^11 absent/default combinations, a 2% sample of the 3^11 space plus its extremes, `undefined` cases, and every Motivation (3 keys x 4 states) x Pitfall (2 keys x 3 states) state.
   - Actions: the real model mutators (`addMontageRound`, `logMontageEntry`+`undoLastMontageEntry`, `endMontageRound`, `resetMontageProgress`, `setMontageLimits`, `addMontageHero`, `setMotivationUsed`, `resetData`, `rolls.push`, `members.push`, `party = {...}`, encounter `_computed` / `_dse_anchor`), plus change-then-restore.
   - Oracle, independent of the impl's key lists: the expected output is bc4a0c5's output after the action, minus each key that the source did not declare and whose value deep-equals bc4a0c5's no-action output. Applied per item for Motivation and Pitfall. Checked by order-sensitive structure, and by bytes (dropping blocks) whenever nothing nested was omitted.
   - Result:

     | element | cases | pass | byte-identical (nothing omitted) |
     |---|---|---|---|
     | counter | 1536 | 1536 | 128 |
     | project | 256 | 256 | 64 |
     | montage | 6042 | 6042 | 690 |
     | party | 60 | 60 | 36 |
     | encounter | 160 | 152 | 56 |
     | negotiation | 43704 | 43704 | 3088 |

     The 8 encounter failures are LOW-1.

   - Stamina-bar: 2916 / 2916 byte-identical to bc4a0c5's SC-466 implementation. Moving it onto the helper changed no output.
2. **Writer coverage.**
   - Source search: no view reassigns `this.model`, clones it, or builds `new NegotiationData` / `new Motivation`.
   - Party `this.model.party = {...}` and negotiation `resetData` are compared by value (probe actions `tokens` and `reset` pass).
   - Re-parse: G-S5 ("external edit rebuilds fresh") plus real-Obsidian probe C4. An external edit adds `name_height: 1`, then + keeps it.
   - Schema validation (stamina-bar only) runs Ajv without `useDefaults`, so data is not filled before presence is read.
3. **Integrity in real Obsidian 1.14.4.** An ad hoc e2e spec and fixture notes were placed in `e2e/specs/zz482/` and `e2e/vaults/shipped/Zz482/` and deleted after the run. Each probe reads the note file:
   - C1, minimal counter +: `max_value: 20 / current_value: 11 / name: Health`. The fully authored sibling is byte-identical, and the text above, between and below is identical.
   - C2: the minimal and full counters in one note, written alternately three times. Each keeps its own shape.
   - C3: absent `current_value`, + then − (INFO-1).
   - C4: an external edit, then a write keeps the added key.
   - M1, minimal montage End round 1: only `current_round: 2` is added. The full sibling then changes only `current_round`.
   - N1, minimal negotiation patience slot 3: only `current_patience: 3` is added. Text outside the fence is unchanged.
   - J1, project Add roll: adds `accrued` and `rolls`, no `current_respite`.
   - P1: the encounter render write adds `_computed` and no `monsters`. Party hero tokens + writes `party:\n  hero_tokens: 3`, no `members`.
   - Runs: `20261021-180830-e08f` (6 ok; P1 timed out on an inert deferred card) and `20261021-180934-4299` (experimental on: 2/2 ok).
   - The record never serializes. Probe 1's check is order-sensitive structural equality, so it found no unexpected key in any of the 54,674 outputs. The helper unit test also checks this with real `stringifyYaml`.
4. **Nested negotiation and the montage DTO.** For authored keys, the shape and key order of Motivation, Pitfall and currentArgument and montage's §B.5 order are unchanged (structural order check in probe 1).
5. **Mutation tests.** Each mutant was run against the 10 SC-482/SC-466/byte suites (275 tests, baseline green). The file was restored from a byte copy and `git status` is clean.

   | mutant | failed |
   |---|---|
   | helper: undefined counted as present | 4 |
   | helper: presence read after parse | 11 |
   | helper: compare primitives only | 47 |
   | helper: ignore the snapshot | 41 |
   | counter: drop `name_height` | 22 |
   | montage: filter by the wrong owner | 6 |
   | negotiation: no pitfall map | 1 |
   | negotiation: no nested record | 24 |
   | encounter: drop `monsters` | **0** (LOW-2) |
   | project: drop `rolls` | 1 |
   | party: unwrapped parse | 5 |
   | stamina: drop `style` | 14 |

## Gates (0e67be8)

- tsc rc 0 · lint rc 0 · jest rc 0: `Tests: 1 skipped, 5513 passed, 5514 total`, `Test Suites: 1 skipped, 234 passed, 234 of 235 total`.
- lifecycle rc 0: `OBSIDIAN-LIFECYCLE done: 30/30 ok, 0 failed` (DSE_LIFECYCLE_PORT=9299).
- e2e rc 0: `OBSIDIAN-E2E done: 89/93 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs` (run `20261021-181744-a149`).
- shots rc 0: 580 PNGs, 0 FAIL lines. It was already running when the scope change arrived and was allowed to finish.
- freeze and parity: not run (owner scope change, SC-457 rebase pending).

## Artifacts

All in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc482-r1-review-acc2988fc38efadbd/`:

- Probe source: `zzSc482ReviewProbe.test.ts`
- Probe dumps: `probe-base.json`, `probe-head.json`
- Oracle: `compare.js`, `compare.log`, `compare-fails.json`
- Mutation tests: `mutate.sh`, `mutate-results.txt`, `mut-*.log`
- Real-Obsidian spec and fixtures: `zz482-probe.e2e.ts`, `zz482-probe2.e2e.ts`, `e2e-fixtures/Zz482/*.md`
- Real-Obsidian note captures and logs: `e2e-out/notes.jsonl` (run 2 only; run 1's captures are quoted above), `e2e-probe.log`, `e2e-probe2.log`
- Gate scripts and logs: `g-*.sh`, `g-*.log`, `g-*.rc`
