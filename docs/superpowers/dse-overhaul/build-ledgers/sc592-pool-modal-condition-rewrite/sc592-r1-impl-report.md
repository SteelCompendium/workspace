# SC-592 r1 implementation report (I1)

**Executive summary**
1. DONE. Plugin head `1c66c5ca` (branch sc592-pool-modal-condition-rewrite, rebased onto dse develop `94133a5a`, no conflicts, package.json unchanged). Superproject CHANGELOG commit `90060d68` (on f2cb454b; pointer not bumped).
2. Rule as implemented (`src/elements/initiative/model.ts` only): at parse each holder (hero, squad-minion instance, regular instance) records, in a module-private WeakMap, how many entries of each key were plain strings. At serialize a key-only entry with a remembered key is written as a plain string; everything else as before. FOLD: authored objects keep unknown keys and authored key order.
3. Gates on the rebased head: tsc + lint clean; jest 7258 passed / 2 skipped (94133a5a baseline 7238 + 20 new); lifecycle 55/55 (21+16+9+4+5); e2e 264/269 ok, 0 failed, 5 known-bug, coverage 164/164 pairs; shots 592, button host-leak 163/978, modal host-leak 39/234, capture clip 147; freeze 280/280; parity 0 gaps / 0 undeclared / 24 declared.
4. Red on 94133a5a src: jest 22 failed of 540 (new file 18 + 4 updated pins); e2e POOL-C01, C09, C10, COND-R03, COND-D08 fail; green on the fix.
5. Edge reported below: a key the user wrote both as a string and an object in one holder; remove-then-re-add of the same key.

## Commits (plugin repo)
- `3623edf3` test: new unit file, red on base
- `0261000f` fix + updated unit pins
- `f856773e` e2e: POOL-C09, POOL-C10, updated pins
- `5f12f484` e2e driver: noteConditionRaw
- `1c66c5ca` e2e: COND-R06 pin (found by the first full e2e run, not in the survey list)

## Design decisions
- "Carries only key": every field except `key` is `undefined` (SC-466 r2: present-but-undefined = absent). null, '' and unknown keys count as data, so the entry is an object.
- Primary signal is per holder, per key (a count of plain entries), because the Conditions modal clones every entry. The n-th key-only entry of a key is a string while the count lasts.
- Key written BOTH ways in one holder: the string/object ambiguity cannot be settled by key, so those keys use entry identity (a WeakSet of entries that were strings at parse). Position-based removal (pool modal) keeps identity, so each survivor keeps its shape. If the Conditions modal then clones, the entry becomes an object (safe: written as today). Pinned in jest.
- Known edge: user wrote `- prone`, removes it and adds `prone` again through the plugin in the same session. It is written as a plain string (the holder still remembers `prone` as a plain key). Not worth identity bookkeeping.
- Holders with no authored `conditions` have no memory; their output (including the SC-485 omit of `conditions: []`) is unchanged.
- Key order: kept for authored objects (spread first, known fields appended as undefined, which yaml omits). Not changed for plugin-built entries.

## Before/after bytes (fixture Initiative/squad-custom.md, probe in /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc592-r1-impl-I1/probe/)
Source = fence body. Diffs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc592-r1-impl-I1/diff-removal-before.txt`, `diff-removal-after.txt`, `diff-malice-before.txt`, `diff-malice-after.txt`.

Pool-modal removal (Goblin #3, Grabbed). Before (ec26b709):
```
-              - on-fire
-              - grabbed
-              - on-fire
-              - dazed
+              - key: on-fire
+              - key: on-fire
+              - key: dazed
```
After:
```
               - on-fire
-              - grabbed
               - on-fire
               - dazed
```
Unrelated write (Malice +1). Before: all four conditions become `- key: ...`. After: only `value: 3` -> `value: 4`.
Both still show the general re-emit (quotes dropped: `"Alice Alpha"`, `"0-3"`): SC-599, out of scope.

## Tests
- New: test/unit/model/initiative-condition-shape.test.ts (20 tests: no-op write; removal on minion, hero, regular instance; unrelated write; re-parse cycle; modal clone; colour/icon/effect/duration promote to object; cleared field returns to string; plugin-added; authored `key: x`; plugin-built holder; string+object same key; duplicates; unknown keys and order; unknown key on string-born entry; holders without conditions).
- Updated pins: initiative-serialize.test.ts (oracle now compares to raw parseYaml(source), squadOut regex), initiative-default-keys.test.ts:502-504, e2e pool-conditions, cond-rows (COND-R03, COND-R06), cond-editor (COND-D08), e2e/README.md:116. cond-add needed no change (its fixture has no plain strings).
- New e2e: POOL-C09 (pool removal leaves siblings as plain names, note text read), POOL-C10 (Malice click leaves plain names). Manifest row 'pool.condition' lists C09 (annotation only; pairs unchanged 164/164).
- No lifecycle phase added; G-S64 untouched.

## Red on base (src/elements/initiative/model.ts from 94133a5a, tests from branch)
- jest: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc592-r1-impl-I1/red2-jest.log (22 failed / 540)
- e2e: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc592-r1-impl-I1/red2-e2e-pool.log (POOL-C01, C09, C10 FAIL), /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc592-r1-impl-I1/red2-e2e-cond.log (COND-R03, COND-D08 FAIL). COND-R06 and POOL-C03 pass on both (they read keys or an empty list).
- model.ts restored via git checkout; git status clean.

## Gate logs
tsc /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc592-r1-impl-I1/h-tsc.log, lint /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc592-r1-impl-I1/h-lint.log, jest /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc592-r1-impl-I1/h-jest.log, lifecycle /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc592-r1-impl-I1/h-life1..5.log, e2e /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc592-r1-impl-I1/h-e2e.log, shots /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc592-r1-impl-I1/h-shots.log, freeze /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc592-r1-impl-I1/h-freeze.log, parity /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc592-r1-impl-I1/h-parity.log. Earlier full battery on the pre-rebase base ec26b709 (all green too, e2e 264/269) is in the g-* files. The first e2e run had 1 failure (COND-R06 pin), fixed in 1c66c5ca.

Drive-by fixes: none.
Follow-ups:
- A key written as a string and as an object in one holder falls back to entry identity, so a Conditions-modal edit on such a holder turns the string into an object (rare, safe).
- Remove-then-re-add of the same key (see above).
- FormModal Save re-parses form data: not probed for conditions shape (out of scope; the form's own data comes from the parsed model).
