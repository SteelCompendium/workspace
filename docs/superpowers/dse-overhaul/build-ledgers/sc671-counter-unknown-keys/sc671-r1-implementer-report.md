# SC-671 r1 implementer report

## Executive summary

- Verdict: DONE_WITH_CONCERNS (one concern: lifecycle G-S61 red, identical on clean `129beb18`; G-S59 red once under load 17, ok on re-run).
- dse branch `sc671-counter-unknown-keys` head `846ac57d` on `129beb18` (origin/develop still `129beb18`; commits `0aa9aff8` fix + unit, `d2e3af2a` jsdom, `37440c9c` e2e + README row, `846ac57d` wrapperDefaultKeys test source). Superproject CHANGELOG commit `cf802c44` on `3a517cdf`; NO pointer bump committed.
- Fix: unknown top-level keys kept in a module-private WeakMap in `src/elements/counter/model.ts`, written after all known keys (incl. `_dse_anchor`), original order.
- Gates: tsc exit 0, lint exit 0, jest 13731 passed / 2 skipped fresh (13702 + 29), lifecycle 63/64 union (G-S61 red, same on clean base), e2e `662/671 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs`.
- styles.css sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` = clean `129beb18` build, so shots / freeze / parity carry.
- New tests: 15 unit (12 fail on base), 14 jsdom (13 fail on base), 4 e2e CTR-O01..O04 (all 4 fail on base).
- One existing test file needed edits (3 tests used `title: Deaths`, an unknown key): `test/dom/elements/wrapperDefaultKeys.test.ts` (negotiation SC-637 precedent).

## Enumeration

Keys the counter READS: `Counter.parse` reads `max_value`, `current_value`, `min_value`, `name`, `value_height`, `name_height`, `_dse_anchor` (seven; no alias or old spelling). The view reads only model fields. The pipeline pops `prefs` and (for a chrome-bearing element whose model does not own them, which counter is) `collapsed`, `collapsible`, `collapse_default` before `parse`, and `withReservedKeys` writes them once; they never reach `parse`.

Write paths, all through `view.persist()` -> `withReservedKeys(def.serialize)` -> counter `serialize`:
- `-` / `+` (stepper `onChange`), typed value with Enter or blur (same `onChange`; clamped commit that changes nothing writes nothing). The kit stepper has no ArrowUp/Down key handling of its own (Enter / Escape only); the browser's native spinner goes through the same input commit.
- There is NO reset on the counter (Escape only reverts an uncommitted draft).
- Pinned sidebar card: same pipeline view; `_dse_anchor` comes from the source (the pin stamps it).
- Write after an outside-edit refresh: `SidebarPanel.handleExternalChange` -> `prepareModel` -> `def.parse` builds a NEW instance from the new text and `view.update(model)` replaces the model; Reading view / Live Preview re-render parses afresh. The unknown set always comes from the new source (tests O12, O18).
- Block edit form: counter has no schema, so the form is the raw-YAML textarea (`rawMode`); Save writes the typed text verbatim and never calls `serialize`, so unknown keys are kept as typed. Preview only parses.
- No path builds a NEW `Counter` from another one (`new Counter` is only called inside `Counter.parse`); nothing clones.

## Design

`src/elements/counter/model.ts`: `KNOWN_KEYS` (the seven), `unknownKeys = new WeakMap<Counter, pairs>()`, `parse` = `recordingDefaults(` parse that calls `Counter.parse(data)` then records `Object.entries(data)` minus known keys (only when `data` is a non-array object) `)`. `serialize`: no extras -> exactly the old `stringifyOmittingUntouched(model)`; extras -> `stringifyOmittingUntouched(model, Object.fromEntries([...Object.entries(model), ...extras]))`.

Why a WeakMap and not own properties (montage's choice): `Counter` is a class `serialize` writes whole, so an own property would be written by anything that serializes the instance, and a user key named like a field, method or prototype (`name`, `current_value`, `constructor`, `toJSON`, `__proto__`) would overwrite or shadow it. In the map nothing can shadow a member; the pairs only reach a plain DTO built by `Object.fromEntries`, which defines own data properties, so `__proto__` is an ordinary key there. The instance keeps exactly its seven fields (a test pins it). `Counter.ts` unchanged.

Behavior notes: known keys keep the fixed order, `_dse_anchor` last of them, unknown after in original order. An integer-looking key (`2024:`) is written first, quoted (JS key order; documented in the code comment, pinned by a unit test). Non-map bodies: `hello` -> `''`, a list -> `{}`, empty block -> raw TypeError, all exactly as on base (pinned; SC-672 untouched). SC-482: no default key is added (tests O13, unit).

## Tests

Unit `test/unit/model/counter-serialize.test.ts` (15, 12 fail on `129beb18`; the 3 that pass on base are no-mutation guards: no-unknown-keys byte identity, non-map body, no own property added):
scalar/map/list/null survive; order; the ticket repro; SC-482 with unknown keys; no-unknown byte identity; `value_height`/`name_height` not carried twice; wrong-typed/falsy known value not carried; look-alike keys (`Name`, `maxValue`, `Max_Value`); `__proto__`/`constructor`/`toString`/`hasOwnProperty`/`toJSON` no pollution; instance has only the seven fields; second/third pass stable; two counters independent; re-parse of an edited source; integer key first; non-map body.

jsdom `test/dom/elements/counter-own-keys.test.ts` (14: 5 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1; 13 fail on base, O16 passes as a guard): `[O09]` test.each over `+`, `-`, typed+Enter, typed+blur, typed above max (clamped) with ABOVE/BELOW prose check; `[O10]` two blocks; `[O11]` second and third press incl. re-read of the plugin's own output; `[O12]` outside edit adds + removes a key then press; `[O13]` SC-482 with unknown keys + heights once; `[O14]` reserved `prefs: compact`, `collapsed: yes`, usable `prefs:` map once each; `[O15]` hostile / look-alike keys; `[O16]` no-unknown-keys byte identity; `[O17]` pinned sidebar card write (`_dse_anchor` then unknown keys); `[O18]` outside edit then press on the pinned card.

e2e `e2e/specs/counter/own-keys.e2e.ts` + fixture `e2e/vaults/shipped/Counter/own-keys.md` (4, all fail on base, verified by swapping base `model.ts`): `CTR-O01` Reading view `+`, key order, prose; `CTR-O02` Reading `-` then `+`; `CTR-O03` Live Preview `-` then `+`; `CTR-O04` pinned sidebar card `+`. No new manifest pair (counter.inc / counter.dec click already declared); no lifecycle scenario needed.

Edited existing test (negotiation SC-637 precedent a154ffed): `test/dom/elements/wrapperDefaultKeys.test.ts`, three counter tests started from `title: Deaths` (a key the counter never read; now kept, so the block no longer returned to `{}`): bodies changed to `'{}'` (two tests) and to `PREFS` alone (the prefs test). Exact hunks: commit `846ac57d`. These 3 failed on the first full jest run (3 failed / 13728 passed) and pass after the edit.

## Files shared with SC-442

- `e2e/README.md`: one added row after the `Counter/kept-keys.md` row: `| \`Counter/own-keys.md\` | one \`ds-counter\` (Torches 2, min 0, max 5, \`_dse_anchor: own671\`) with a scalar, a nested map and a list the counter does not read, text above and below (SC-671) |`.
- NOT touched: `e2e/manifest/counter.ts`, `e2e/specs/_census.e2e.ts`, `test/dom/e2eCensus.test.ts` (no census edit was forced). Fixture, spec and jsdom file names are all new and not SC-442's; scenario ids CTR-O01..O04 (not in SC-442's list).
- `test/dom/elements/wrapperDefaultKeys.test.ts` is not in SC-442's list.

Docs checked for a statement of what a counter write keeps: `e2e/README.md`, plugin `docs/*.md`, `AGENTS.md`, `README.md`: none states it (only the fixture table row added). CHANGELOG bullet added (commit `cf802c44`): top of `## Unreleased`, says keys kept with the same values, layout may change (`extra: {a: 1}` comes back as a block map, comments removed, flow list rewritten one item per line); no "as you typed them" claim.

## Gates (logs under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5812b474-3aec-46a6-8f06-0ef85cf1e10a/scratchpad/sc671-r1-impl/`)

- tsc `g-tsc.log` (exit 0, includes `tsc -p e2e`); lint `g-lint.log` (exit 0).
- jest `g-jest3.log` (final head): `Test Suites: 1 skipped, 301 passed, 301 of 302 total`, `Tests: 2 skipped, 13731 passed, 13733 total`, exit 0 (fresh worktree, no shots cache). Earlier run `g-jest2.log` had the 3 wrapperDefaultKeys failures, fixed in `846ac57d`.
- lifecycle (seven `--only=` parts, logs `lc1.log` .. `lc7.log`, reruns `lc4b.log`, `lc8.log`, base `lcbase.log`): part1 21/21, part2 16/16, part3 9/9, part4 3/4 (G-S61 FAIL: recorder's disk read torn, "0 stale frames"; same in `lc4b.log` and `lc8.log`; on a clean `129beb18` checkout in `base-129/` `lcbase.log` G-S61 FAILs the same way: pre-existing, load 10-22 during my runs, SKILL line 1774 notes the same signature), part5 6/7 (G-S59 timed out waiting for the Live Preview host at load ~17; `lc8.log` re-run G-S59 ok), part6 4/4, part7 3/3. Union: 63 ok, G-S61 not green on this host, identical on base. G-S91, G-S97, G-S115 green; `demo-vault/.obsidian/appearance.json` clean.
- e2e full `e2e-full.log`: `OBSIDIAN-E2E done: 662/671 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs`, exit 0 (expected 658+4 / 667+4).
- Own-spec run `e2e-own.log`: CTR-O01..O04 4/4 ok; on base model `e2e-own-base.log`: 0/4 ok.
- styles.css sha256: mine `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`, clean `129beb18` build (`.../sc671-r1-impl/base-129/styles.css`) `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`: identical, so shots 592 / host-leak / modal host-leak / capture clip 147 / freeze 280/280 / parity 0/0/24 carry unchanged (not re-run).

## Drive-by fixes:

none.

## Follow-ups:

1. Other persisted elements built from named-field models may drop unknown keys the same way (stamina-bar, project, party, encounter, conditions, resource, surges, hero-tokens, initiative). Only montage, negotiation and now counter carry them (`grep unknownKeysOf|carryUnknown|unknownPairs`). I did not probe them; owner to decide whether to file a sweep ticket.
2. G-S61 red on this host on clean `129beb18` (torn disk read in the recorder): not mine; the owner may want to confirm on a quieter host.
3. The scratch `git worktree add --detach` of `129beb18` is registered in the plugin repo at `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5812b474-3aec-46a6-8f06-0ef85cf1e10a/scratchpad/sc671-r1-impl/base-129` (symlinked node_modules). Left in place per the no-rm rule; owner may `git -C <plugin> worktree remove --force` it. `git fetch origin` also brought a local tag `7.0.0-rc.1` (fetched, not created).
4. SC-442 rebase: whichever lands second flips the CTR-U01 marker; nothing here conflicts by name.

## Proposed SKILL.md text

- Lifecycle host note: "A G-S61 'recorder's disk read was torn in N frames in a row' FAIL reproduces on a clean checkout under load; compare against a clean base run before treating it as the change's."
- Tool-call note: "The Bash tool backgrounds a call after 120 s here (not 180 s): poll your own pid with `timeout 100 tail --pid=<pid> -f /dev/null`."
