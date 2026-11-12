# SC-600 r1 implementation report

## Executive summary
- STATUS: DONE. dse branch `sc600-group-amount-mismatch-conditions`, head `1116e06d` (base `dcc53f0f`, origin/develop still `dcc53f0f`). Superproject changelog commit `e3a3a0f0` (no pointer bump committed).
- `src/elements/initiative/model.ts`: new helper `adjustInstances` replaces both rebuild blocks (squad minions and regular creatures/captains). Missing instances give the same fresh list; same length is unchanged; longer is trimmed from the end BEFORE validation; shorter keeps all and appends fresh entries with ids max+1, +2... Kept entries get the same validation as before.
- Tests: 15 new jest tests (`test/unit/model/initiative-amount-adjust.test.ts`; 10 fail on the base model, 5 are controls), 2 new e2e scenarios (INIT-AMT-E01 grow, INIT-AMT-E02 shrink; both fail on the base model).
- Gates: tsc clean, lint clean, jest 10802 passed / 2 skipped (expected 10787 + 15), lifecycle 60/60, e2e 306/309 ok 0 failed 3 known-bug coverage 174/174 (expected 304/307 + 2), shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147, freeze 280/280, parity 0/0/24.
- `src/drawSteelAdmonition/EncounterData.ts` has the same rebuild at lines 836 and 882: left unchanged (not a live path; see below).

## Changes (dse commits, oldest first)
- `116fb6a7` fix(initiative): editing a creature's amount keeps the existing instances (SC-600) - `src/elements/initiative/model.ts`
- `eb2ae871` test(initiative): amount edit keeps instances, round trip integrity - `test/unit/model/initiative-amount-adjust.test.ts`
- `5743adc8` test(e2e): grow and shrink - `e2e/specs/initiative/amount-edit.e2e.ts`, `e2e/vaults/shipped/Initiative/amount-edit.md`, `e2e/README.md` (fixture table row)
- `ad811f40` docs(initiative): `docs/initiative-tracker.md` `amount` field text
- `1116e06d` test: type the condition-key helper in the new test file (tsc fix)
- Superproject `e3a3a0f0` docs: changelog entry for SC-600 under `## Unreleased` in `/home/scott/code/steelCompendium/worktrees/sc600-group-amount-mismatch-conditions/CHANGELOG.md`. The superproject shows `draw-steel-elements` as modified (pointer), uncommitted, left for the owner.

## Behaviour details
- `want = amount > 0 ? Math.ceil(amount) : 0` (the old fresh loop ran `i < amount`, so a fractional amount gave ceil(amount) entries; kept identical).
- `instances` not an array (missing, null, object) is treated as an empty list: ids 1..want, same fields, same key order as the old fresh path. Output deep-equals the legacy materialization (tested).
- Order inside the helper: trim, validate kept (`noteAbsent`, id must be number, `normalizeConditions`, regular `?? max_stamina` / `?? 0`), compute max finite id of the kept entries, append fresh entries. Appended entries are never `noteAbsent`-ed (exactly like the old fresh path), so a `current_stamina: undefined` on a statblock-sourced creature is filled later by resolveRefs and written whole, as today's fresh instances are.
- A grow with a malformed kept entry now throws (the old code would have rebuilt silently). That is the spec'd "kept entries go through the same validation".
- Minion pool: not touched (the helper never reads or writes it); `reconcileOrphanedCaptainBonus` still runs after materialization. Test: pool 7 stays 7 for amounts 1, 3, 8 and is written back as `minion_stamina_pool: 7`.
- Plain-name conditions (SC-592) survive: round trip test shows `conditions: ['bleeding']` stays a plain string and the dazed object stays an object; e2e shows `grabbed` stays plain.

## Other sites
- `src/drawSteelAdmonition/EncounterData.ts:836` (minions) and `:882` (regulars): the legacy async `parseEncounterData`. It is NOT a live code path: `git grep parseEncounterData -- src main.ts visual-harness e2e` finds only its definition and comments; the only callers are tests (`test/dom/e2eCensus.test.ts`, `initiative-default-keys.test.ts`, `minion-stamina-pool-modal(-matrix).test.ts`, `test/unit/model/encounter-data.test.ts`, `initiative-resolve-refs.test.ts`, `initiative-serialize.test.ts`), which use it as an oracle. None of them feeds it an `amount` / `instances.length` mismatch (jest is green with the legacy untouched; the oracle compares were run only on missing-instances and equal-length inputs). The oracle has also already diverged from model.ts for minion condition normalization (SC-592). Left unchanged. If you want the oracle kept in step anyway it is a two-site change, but nothing would verify it.
- `git grep -n "instances.length" -- src`: `EncounterData.ts:271` (`!instances || instances.length === 0`, a helper for "any instances", not a rebuild), `EncounterData.ts:836,882` (above), `model.ts` (the two sites now replaced by `adjustInstances`), `view.ts:1774` (`instances.length > 0` read, not a rebuild; also view.ts is SC-605's, not touched). `resolveRefs.ts` has no length check: its phase 3 only fills `current_stamina` / `temp_stamina` on whatever instances exist, so appended instances are covered. `encounter/view.ts` builds fresh group data with no instances. No other rebuild site.

## Tests
- jest `test/unit/model/initiative-amount-adjust.test.ts`, 15 tests:
  - regular: grow 3->4 (kept state, fresh appended with the same key order), shrink 3->2, non-sequential ids (1,3 grown to 3 gives 1,3,4; more grows; 1,3,4 shrunk to 2 gives 1,3; 2,5 grown to 3 gives 2,5,6), amount 0, missing instances (deep-equal legacy and round-trips as before), same length (deep-equal legacy), captain grow and shrink.
  - minion: grow, shrink, non-sequential, pool unchanged.
  - validation: malformed entry beyond the new amount trimmed (regular and minion), malformed kept entry still throws (bad id while growing / shrinking, bad condition).
  - integrity: two-group note where only Alpha's amount is hand-edited (grow and shrink): Beta's text and the text from `malice:` down are byte-identical, Alpha's text above its instances is as written, kept instances keep plain-name and object conditions and stamina, the appended instance is fresh, second pass is a fixed point. A note-level seam (text above and below the fence) does not exist at the model layer, so that part is covered by the e2e (note text outside the block is checked by the e2e harness after every test).
- Mutation check: with the base `model.ts` restored temporarily, jest shows 10 failed / 5 passed in the new file; e2e shows both new scenarios FAIL. Fix restored (git status clean afterwards).
- e2e `e2e/specs/initiative/amount-edit.e2e.ts`: fixture `Initiative/amount-edit.md` (3 Ogres, #2 grabbed at 25/60); `dse.externalEdit` changes `amount: 3` to 4 (E01) / 2 (E02) with a plain `vault.process`, wait until the Reading view card shows 4 / 2 cells, a real click on a different Ogre's cell (`init.cell.stamina`) writes exactly once, then the block is read: instance 2 keeps `grabbed` and 25, E01 has a fresh #4 `{id 4, current_stamina 60, temp_stamina 0, conditions []}` at the end, E02 has #1 and #2 only. Titles carry no ticket id. No new manifest pair (`init.cell.stamina` click was already in the manifest), so pairs stay 174/174.

## Gates (measured; logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc600-r1-impl/`)
| Gate | Measured | Expected | Log |
|---|---|---|---|
| tsc (`npm run tsc`, includes e2e) | clean, rc 0 (first run found 5 TS2339 in my new test, fixed in `1116e06d`) | clean | `tsc2.log` |
| lint | clean, rc 0 | clean | `lint.log` |
| jest | Tests: 2 skipped, 10802 passed, 10804 total; Suites: 1 skipped, 268 passed (delta +15) | 10787 / 2 + new | `jest.log` |
| lifecycle part 1 (21) | 21/21 ok | 21 | `life1.log` |
| part 2 (16) | 16/16 ok | 16 | `life2.log` |
| part 3 (9) | 9/9 ok | 9 | `life3.log` |
| part 4 (4) | 4/4 ok | 4 | `life4.log` |
| part 5 (7) | 7/7 ok (G-S91 passed first run, no re-run needed) | 7 | `life5.log` |
| part 6 (3) | 3/3 ok | 3 | `life6.log` |
| lifecycle union | 60/60, 0 failed | 60/60 | |
| e2e full | `OBSIDIAN-E2E done: 306/309 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` | 304/307 + 2 new, 174/174 | `e2e-full.log` |
| shots | 592 files; button host-leak OK (163 x 3 x 2 = 978); modal host-leak 39 kinds / 234 comparisons; capture clip OK (147 ...) | 592, 163/978, 39/234, 147 | `shots.log` |
| freeze | `freeze OK (280/280 frozen print PNGs byte-identical ...)` | 280/280 | `freeze.log` |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0 | 0/0/24 | `parity.log` |

Notes: jest ran with `main.js` / `styles.css` removed first (the e2e build had planted them); the shots cache was not present for jest, so the 2 skipped match the fresh-worktree expectation. Single-scenario e2e runs: `e2e-only.log` (green on the fix), `e2e-base.log` (red on the base model). Load average was 10-25 during the runs; nothing flaked.

## Drive-by fixes
- None.

## Follow-ups
- None needed for the feature. Optional: the legacy `parseEncounterData` in `EncounterData.ts` still has the old whole-list rebuild; it is test-only oracle code with no mismatch coverage. If it is ever retired or re-synced with `model.ts` (it already differs on SC-592 condition shapes), this and that drift go with it.
- No lifecycle phase added or needed (G-S89 stays unused).

---

# r3 fix round (appended)

## Summary
- STATUS: DONE. Final dse head `d984b115`, rebased onto dse develop `c329ff35` (develop had moved from `dcc53f0f`; no package.json / lock change).
- Superproject branch head `0f01f93b` (changelog bullet `e226f763` + ONE pointer bump), sitting on workspace `origin/main` `e188cee0`. `git diff origin/main --stat` shows only `CHANGELOG.md` and `draw-steel-elements`. Nothing pushed.
- LOW-1: `adjustInstances` comment now says an id is unique within the list only and that trimmed ids can return (3 -> 4 -> 2 -> 5 gives 1..5).
- LOW-2: header of `model.ts` has a line saying SC-600 instance materialization deliberately differs from the oracle at `EncounterData.ts:836 / :882`.
- INFO-4: a non-finite `amount` (`.inf`, `-.inf`, `.nan`, Infinity, NaN) now throws the existing invalid-amount error at the existing `typeof creature.amount !== 'number'` check. Finite behaviour unchanged. 7 new jest tests (22 in the file).
- Gates on `d984b115`: tsc clean, lint clean, jest 11618 passed / 1 skipped (11595 + 22 + 1 for the shots cache), lifecycle 61/61, e2e 306/309 ok 0 failed 3 known-bug 174/174, shots 592 / host-leak 163/978 / modal 39/234 / clip 147, freeze 280/280, parity 0/0/24.

## Commits (dse, on c329ff35)
`2c057cda` fix, `b7257ffa` tests, `2023b680` e2e, `19b487d0` docs, `535fab9c` test typing, `d984b115` r3 (model.ts comments + finite check + tests). `EncounterData.ts` and `view.ts` untouched.

## Gate numbers
- jest: Tests 1 skipped, 11618 passed, 11619 total (Suites 269 passed, 1 skipped).
- lifecycle parts: 21/21, 16/16, 9/9, 4/4, 7/7, 4/4 (part 6 = G-S92,G-S96,G-S97,G-S99) = 61/61.
- e2e: `OBSIDIAN-E2E done: 306/309 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`.
- A first lifecycle part-1 run on the pre-rebase head (`144858cb`) was discarded after the base moved; not counted.
- Logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc600-r3-impl/` (`tsc.log lint.log jest.log life1..6.log e2e.log shots.log freeze.log parity.log unit.log`).
