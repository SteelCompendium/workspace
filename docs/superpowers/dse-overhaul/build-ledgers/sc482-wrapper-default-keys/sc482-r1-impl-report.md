# SC-482 r1 implementer report

## Executive summary

- STATUS: DONE. Plugin branch `sc482-wrapper-default-keys` rebased onto origin/develop `bc4a0c5` (no conflicts); head `0e67be8` (6 commits). Superproject worktree rebased onto origin/main, head `b159877` (CHANGELOG bullet only; the plugin pointer is unstaged for landing).
- 6 elements (counter, project, montage, party, encounter, negotiation) plus stamina-bar now share `src/elements/shared/undeclaredDefaults.ts`; a write omits a key that was absent from the source and still equals what the parser filled in. All 14 SC-466 stamina tests pass UNCHANGED on the helper.
- Full battery on the rebased head: tsc (+e2e) clean; lint clean; jest 5513 passed / 1 skipped / 234 of 235 suites (post-shots; 5512 passed / 2 skipped pre-shots); lifecycle 30/30; e2e `89/93 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs` (run `20261021-174105-cf7d`); shots 580 PNGs, 0 FAIL; freeze `freeze OK (280/280 ...)`; parity 0 GAPs / 0 undeclared / 24 DECLARED.
- jest delta vs base: 5457 -> 5513 passed = +56 new tests (38 in wrapperDefaultKeys, 15 helper unit, +3 net in changed existing files).
- Lifecycle used port 9341 (9297 was owned by the sc483 session's Obsidian).
- Hand-resolved conflicts: none.

## Helper API as built (`src/elements/shared/undeclaredDefaults.ts`)

- `recordingDefaults(parse, keys)` -> wrapped parse. Reads which of `keys` have `declared[key] === undefined` (null / blank / non-object body = all absent) BEFORE calling the inner parse, then snapshots `JSON.stringify(model[key])` for exactly those keys.
- `recordAbsentDefaults(owner, absentKeys)` -> lower level (used for nested instances).
- `omitUntouchedDefaults(owner, dto = owner)` -> same-order copy of `dto` minus each recorded key whose current value JSON-equals its snapshot. No record / empty record -> `dto` returned unchanged (plugin-built models keep today's whole output).
- Record = module-private `WeakMap<object, Map<key, json>>`, keyed by instance; never an own property or symbol (unit-tested against real `stringifyYaml`).

## Per element: recorded keys, and why presence survives each writer

| Element | Recorded keys | Serialize |
|---|---|---|
| counter | current_value, min_value, value_height, name_height | `stringifyYaml(omitUntouchedDefaults(model))` |
| project | accrued, rolls, current_respite | same |
| montage | rounds, success_limit, failure_limit, successes, failures, current_round | `omitUntouchedDefaults(model, ordered)` (ordered DTO keeps §B.5 order) |
| party | members (read before the in-place fill) | same as counter |
| encounter | party, monsters (read before the in-place fill); `_computed` / `_dse_anchor` not recorded | same |
| negotiation | top: current_patience, current_interest, motivations, pitfalls, currentArgument, i5..i0; each Motivation: name, reason, hasBeenAppealedTo (from its own raw item); each Pitfall: name, reason | `{...omitUntouchedDefaults(model)}` then `motivations` / `pitfalls` mapped through `omitUntouchedDefaults(item)` (reassigning an existing key keeps its position) |
| stamina-bar | collapsible, collapse_default, current_stamina, temp_stamina, height, style | same as counter |

All views mutate the single parsed instance in place (no clones: r0 §1, and `grep` shows no `new Motivation` / `new NegotiationData` / `.motivations =` outside the model), so the WeakMap entry survives every writer. Nested reassignments (party `this.model.party = {...}`, negotiation `resetData`) are compared by value. A re-parse (external edit, sidebar echo) builds a new instance and records afresh (tested).

Deviations from the r0 §4 table (ledger rule applied consistently, flagged for the reviewer):
1. negotiation also records top-level `motivations` and `pitfalls` (parser fills `[]`), and per-Pitfall `name` / `reason` (not just Motivation). Without this, a source lacking `pitfalls:` would still gain `pitfalls: []`.
2. `currentArgument` is treated as ONE value: absent + unchanged -> omitted; absent + changed -> written whole (all 5 sub-keys, as today). A partially-authored `currentArgument` still expands to the 5 keys on write (plugin-managed state; not asked for).

## Stamina-bar move outcome

Moved onto the helper. `staminaBarDefaults.test.ts` (SC-466) passes UNCHANGED (all of it, incl. the three r2 `undefined`-as-absent tests and the plugin-built-instance test). The old local WeakMap/`PARSER_DEFAULTS` table is gone.

## Changed existing fixtures (file:line on the final head; every one is a source that omitted a default whose expected output contained it)

- `test/dom/elements/counter.test.ts:45-55` `healthSerialized()`: before `max_value, current_value, min_value, name, value_height: 3, name_height: 1`; after the first four lines only (fixture `health.yaml` declares min_value but not the heights). Added `HEALTH_UNDECLARED_DEFAULTS` const. Fixes ~16 byte assertions that use the helper.
- `counter.test.ts:651-690` (byte-compat describe): 'the health fixture' expects `healthSerialized(10)` from the framework and pins the legacy whole-instance bytes as `healthSerialized(10)+heights`; 'minimal block' (`name: Deaths`) before expected `current_value: 0 / min_value: 0 / name / value_height: 3 / name_height: 1`, after `name: Deaths` (legacy bytes still asserted as the old output); 'after an in-place edit' expects `healthSerialized(11)` (legacy-equivalent asserted separately). New test: fully-declared block is byte-identical to the legacy writer.
- `test/unit/model/montage-serialize.test.ts:351-354`: key list before `[rounds, success_limit, failure_limit, successes, failures, entries, current_round, _dse_anchor]`, after `[rounds, successes, entries, current_round, _dse_anchor]` (successes kept: logging an entry changed it). `:375-377`: before `[rounds, success_limit, failure_limit, successes, failures, participants, current_round]`, after `[rounds, participants, current_round]`.
- `test/unit/model/negotiation-serialize.test.ts:46-110,187-190`: 'serialize(parse(frodo)) equals the legacy bytes' -> legacy bytes minus exactly the 10 undeclared lines (current_patience, current_interest, 2x hasBeenAppealedTo, currentArgument + 5 sub-lines); added fully-declared-round-trips-byte-identical, changed-default-written; 'defaults materialize' -> not written (legacy bytes still asserted to contain them) + fully-declared form identical; key-order test now feeds the fully-declared source (still all 14 keys); free-text test expects `s1 === source.trim()` plus a fully-declared byte-identity check.
- `test/dom/elements/negotiation.test.ts:51-86` `legacyBytes()` oracle: before whole-model `stringifyYaml`; after the same minus keys the raw source did not declare and `mutate` left equal to a second fresh parse (computed independently of the element's record). `:1345-1373` the "every write has exactly the legacy key set" test now renders the fully-declared frodo (`stringifyYaml(parseNegotiationData(frodoYaml))`). `:1500`, `:1627-1630`, `:1698` three assertions that read `current_patience` / `currentArgument` from the written YAML now read it back through `parseNegotiationData(...)` (the write legitimately leaves an unchanged default out).
- Fixtures that needed NO change: project / party / encounter byte tests, the 14 stamina tests, `sidebarEncounterHandoff`, `experimentalGate`, `view-adoption`, `view-registry`, everything else (full jest green).

## New tests

- `test/unit/elements/undeclaredDefaults.test.ts` (15): absent+unchanged omitted; absent+changed written; present-equal-to-default written; present-`undefined` = absent; null/undefined/''/non-object body = nothing declared; deep array/object default mutated in place written; mutated-then-restored omitted; derived default (current = initial) omitted then written; key order; presence read before an in-place parse; two instances never share a record; no record returns the same object whole; record absent from `Object.keys` / symbols / real `stringifyYaml` output; DTO filtered by owner record; nested instances record their own absent keys.
- `test/dom/elements/wrapperDefaultKeys.test.ts` (38), through the real `ElementPipeline` + `ReadingModeBlockHost` + FakeVault, asserting on the NOTE: per element x5 (counter, project, montage, party, encounter, negotiation) = REPRO minimal block / fully-authored byte-identical / two blocks (minimal + full) in one note / content above and below untouched / re-parse recomputes; plus counter absent-key-changed + authored `value_height: 0`; party and encounter changed default written; negotiation per-Motivation record (3); plugin-built Counter keeps whole output. Red-first commit `59e0bce`: 28 of 35 failed on the base, the 7 passing were the fully-authored/byte-identity controls (they pass on base by design: "byte-identical to today").
- Note: encounter's render-time `_computed` write is covered by the same table (minimal source, no action; output has `monsters` + `_computed`, no `party: {}`).

## Docs / comments

Header comments (SC-482 contract) in counter, negotiation, project, montage, party, encounter, stamina-bar `model.ts`; `.repo-docs/architecture.md` (stamina row, negotiation row, new "Writes add no default keys" paragraph incl. SC-485/SC-486 pointers); comment at `visual-harness/obsidian-lifecycle.mjs` (~:1109, comment only); CHANGELOG bullet under `## Unreleased` (superproject `b159877`).

## Gate evidence (rebased head `0e67be8`; logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc482-r1-impl-a23f8c687d4289a3e/`)

- tsc: `f-tsc.log` rc 0; lint: `f-lint.log` rc 0 (only the pre-existing `.eslintignore` warning)
- jest pre-shots: `f-jest-pre.log` 5512 passed / 2 skipped / 234 of 235; post-shots: `f-jest-post.log` 5513 passed / 1 skipped / 234 of 235
- lifecycle: `f-life2.log` `OBSIDIAN-LIFECYCLE done: 30/30 ok, 0 failed` (port 9341; `f-life.log` is the discarded port-9297 environment exit 2)
- e2e: `f-e2e.log` `OBSIDIAN-E2E done: 89/93 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`, run id `20261021-174105-cf7d`
- shots: `f-shots.log`, 580 PNGs, no FAIL; freeze: `f-freeze.log` `freeze OK (280/280 frozen print PNGs byte-identical ...)` (no PNG change: data-path change); parity: `f-parity.log` `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`

## Drive-by fixes

None.

## Follow-ups

1. `currentArgument` partial-authored blocks still expand to all 5 sub-keys on any write that changes it (see deviation 2); nested record would fix it if wanted.
2. Counter reads an authored `value_height: 0` / `name_height: 0` / `min_value: 0`-truthy quirk as the default (3 / 1): pre-existing, still written as the default (tested in `wrapperDefaultKeys`); not changed.
3. Party has no UI to add a member, so "absent `members` changed" is only reachable model-level (tested there); encounter has no UI that edits party / monsters (only `_computed` / anchor), so likewise.
4. Real-Obsidian probes per element are left to the independent reviewer, per the ruling (no new e2e surface).
5. `visual-harness/obsidian-lifecycle.mjs` default port 9262 and the 9297 suggested in the brief collide with other live sessions; a per-run free-port pick would avoid the exit-2.
