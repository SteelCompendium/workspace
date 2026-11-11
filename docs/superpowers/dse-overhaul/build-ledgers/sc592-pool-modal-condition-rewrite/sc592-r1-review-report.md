# SC-592 r1 review (V1): plain-string conditions stay plain strings on ds-initiative writes

**Executive summary**
1. Verdict: **LAND-READY.** No BLOCKER, HIGH or MEDIUM findings. 2 LOW (test gaps: one surviving mutant, one weakened e2e pin) and 6 INFO.
2. Range: plugin `94133a5a..1c66c5ca` (src change only in `src/elements/initiative/model.ts`) plus superproject CHANGELOG `90060d68`. The rule matches the ledger: per-holder WeakMap, key-only + remembered → plain string, authored objects keep unknown keys and their key order.
3. Gates I re-ran on 1c66c5ca: tsc clean · lint clean (rc 0) · jest **7259 passed / 1 skipped** (shots css cached, so this equals the fresh-worktree 7258/2) · e2e **`264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`** (known bugs SC-257, SC-355, SC-384, SC-580, SC-588). I did not re-run lifecycle, shots, freeze or parity: src outside the model did not change, and I1's logs show its numbers (55/55; 592, 163/978, 39/234, clip 147; 280/280; 0/0/24) match CURRENT.
4. Red on base (94133a5a `model.ts`, branch tests): jest 22 failed / 82 in the three affected files. e2e POOL-C01, C02, C09, C10, COND-R03 and COND-D08 FAIL. **COND-R06 passes on base** (weakened pin, LOW-2).
5. Mutants (10): 7 killed, 3 survived. Survivors: M4 "no per-key count" (LOW-1, a real gap), M6 "no memory delete" and M10 "null counts as absent" (both effectively equivalent, INFO).
6. Owner asks: (1) Form Save. For ds-initiative it is never a serialize writer. The element has no schema, so FormModal runs in raw mode and Save writes the textarea verbatim (`FormModal.ts:309`). `:311-314` is unreachable here. I probed it: Save with no edit writes the source byte-identical, and a typed edit is written verbatim. (2) A key removed and then re-added comes back as a string only in the same in-memory holder. After a re-parse, or in another holder, it is `- key: x` (probe P6). Confirmed confined. (3) A key written both ways in one holder falls back to entry identity. It is pinned (M5 is killed), and after a Conditions-modal clone the string-born entry turns into an object (P8). This is safe and matches the accepted ruling.
7. Holder identity: no src path clones a hero or instance. Reset encounter, resolveRefs, the pool modal, the tracker icon removal and the sidebar either mutate in place or re-parse.

## Findings

### LOW-1: the per-key count is untested (mutant M4 survives)
- `src/elements/initiative/model.ts:202` (`if (plain) left.set(entry.key, remaining - 1);`). Deleting this line leaves all 82 tests in the three affected files green.
- Failure scenario: a future edit drops the decrement. The user wrote `- grabbed`, and the plugin adds a second `grabbed` through the Conditions modal. Both entries are then written as `- grabbed`, so the plugin-added entry no longer keeps `- key: grabbed`. That breaks the ledger rule "a condition the plugin adds itself keeps today's output", and nothing would catch it. Today's behaviour is correct (probe P7 `added` = `['grabbed', {key:'prone'}, 'bleeding', {key:'grabbed'}]`).
- Fix: in `test/unit/model/initiative-condition-shape.test.ts`, next to `:178`, add a test. Parse a holder with `- grabbed` and append `{ key: 'grabbed' }` (as the modal does: `[...modalClones(list), { key: 'grabbed' }]`). Expect `['grabbed', ..., { key: 'grabbed' }]` and `toContain('- key: grabbed')`.

### LOW-2: the COND-R06 pin was loosened, not updated (passes on base)
- `e2e/specs/conditions-modal/cond-rows.e2e.ts:98`: `hero.conditions.map((c) => (typeof c === 'string' ? c : c.key))` accepts either shape. The comment says "`bleeding` is written as a plain name", but nothing asserts it. Measured: COND-R06 is **ok on 94133a5a's model** (`v-e2e-red-cond.log`). Before the change, `.map((c) => c.key)` implicitly required every entry to be an object.
- Failure scenario: a regression that rewrites `- bleeding` as `- key: bleeding` passes COND-R06.
- Fix: pin the shape exactly. Use `await dse.expectNoteBlock(CONDITIONS, INIT).toMatchObject({ heroes: [{ conditions: ['bleeding', { key: 'dazed', duration: 'eot' }, { key: 'slowed', effect: 'save ends' }] }] })` (fixture `Initiative/conditions.md`), or `noteConditionRaw(CONDITIONS, 'hero', 0)` `toEqual('bleeding')`.

### INFO-1: the survey listed Form Save as a writer, but for ds-initiative it is not one
- `src/elements/initiative/definition.ts:35` declares no schema, so `fieldsFromSchema` returns `[]` and `rawMode` is true (`FormModal.ts:157`). `currentBody()` then returns `this.rawText` (`:309`) before `serialize(def.parse(...))` (`:311-314`). Probe (`zz-sc592-v1-form-probe.test.ts`, output `v-form-out-head.txt`): `raw=true schema=false`. Save with no edit writes the source unchanged, quotes included, and a typed edit is written verbatim. The re-render after Save parses afresh and records new memory. No action needed. Correct the survey's blast-radius list if it is reused.

### INFO-2: side benefit: an empty-string condition no longer breaks the block
- Base: `- ""` is written back as `- key: ""`, and the next parse throws `Invalid condition format for hero 'Ash'.` (the object branch requires a truthy `key`). After one write the tracker shows an error card. HEAD writes `- ""` and re-parses cleanly (probe P4). `- " "` re-parsed on both. Optional: pin P4 in jest. Not in the CHANGELOG, which is fine.

### INFO-3: remove-then-re-add and "duplicate shapes swap" stay inside one in-memory holder (owner ask 2)
- P6. Same holder: `[{key:prone}, 'bleeding', 'grabbed']` (accepted deviation). After a re-parse of the post-removal write: `{key:'grabbed'}`. In another holder (the Ogre instance never wrote `grabbed`): `{key:'grabbed'}`. The memory is keyed by the holder object, and `withConditionShape` only ever reads `plainConditions.get(holder)` (`model.ts:190`), so it cannot cross holders or blocks (P2: two blocks parsed from identical text do not interact).
- A related variant (P7): the user wrote `- grabbed`, the plugin added a second `grabbed` (written `- key: grabbed`, correct), and the user then removed the string one. The plugin-added one is then written as `- grabbed`. This is the same class as the accepted ruling and harmless.

### INFO-4: mutants M6 and M10 survive, and both are effectively equivalent
- M6 (drop `plainConditions.delete(holder)`, `model.ts:172`) only matters when one holder object is normalised twice, which happens only through a YAML alias (P10: `&h` / `*h`). Pre-existing: on base the aliased hero also writes `- key: grabbed` and fills in `isHero`/`has_taken_turn`. Not made worse.
- M10 (`value == null` in `carriesOnlyKey`, `:179`) only differs when a string-born entry gains a `null` field. No plugin code sets `null`, and an authored `null` on a known field is mapped to `undefined` at parse.

### INFO-5: a stale "byte-compat" doc claim
- `model.ts:128-130` still says the legacy oracle `parseEncounterData` and this sync split "stay byte-compat". With the `...cond` spread, they now differ for condition objects that carry unknown keys (the legacy copies still drop them). The oracle is test-only and no fixture has unknown keys, so no test is affected. Fix (optional): append "(except unknown condition keys, kept here since SC-592)".

### INFO-6: landing note
- The superproject branch is at `90060d68` on `f2cb454b`. origin/main has since moved (`178dbfda` → `3eb1adbd` at review time, SC-595/SC-593 commits). `CHANGELOG.md` `## Unreleased` will likely need a trivial rebase merge. That is land-stack's job, not a code issue.

## What I checked, and the results

- **The user's file.** Text outside the block: the host splice is unchanged by this diff. In real Obsidian, COND-N01/N02/N03 (cond-integrity) pass on HEAD: the text above, between and below the blocks stays byte-identical, and the second tracker (which holds `- grabbed`) is untouched. Two blocks: P2, no crosstalk. Hand edits between writes: P3 (string → object, object → string, `bleeding` → `bleed`) are respected after the re-parse, and the next write is stable. Idempotence: P1, three no-op write/re-parse cycles are byte-identical to the source. P1b: removal followed by re-parse is stable.
- **Writers.** Pool removal (jest, plus e2e POOL-C01/C03/C07/C08/C09) and pool damage Apply (POOL-C02, which pins `['dazed']`) keep strings. Tracker clicks: Malice (POOL-C10), group turn (default-keys exact bytes), and selecting a cell (a no-op `selectedInstanceKey` write goes through the same serialize; the no-op write is jest-pinned). The Conditions modal: add (stays an object), remove (COND-R03), duration/colour/icon/effect promote only the edited entry (COND-D08 and jest), a cleared field (`undefined`) returns it to a string. Form Save: see INFO-1.
- **Edge cases.** Duplicate removal keeps one string. Same key as string and object: identity fallback (P8, and the pinned jest test). Custom keys (`my-custom-thing`, `on-fire`): strings. Empty or whitespace keys: INFO-2. Unknown keys survive in authored order, and a colour added after an unknown key is appended (P9: `source, key, color`). Heroes, squad-minion instances and regular instances are all covered. Holders that never wrote conditions keep no key, and a later add is an object. Instance regeneration (SC-600): regenerated instances are built without `normalizeConditions`, so they have no memory and are written as before. Not worse.
- **Holder clones.** Searched for `structuredClone`, `JSON.parse(JSON.stringify`, `{...hero|instance}`, and reassignment of `heroes`/`instances`/`creatures`. The only clones are ConditionsModal's entry clones (`ConditionsModal.ts:131, :228`), which the per-holder memory tolerates by design, and serialize's own DTO copy (`model.ts:476, :486`), which exists at write time only. Reset encounter (`EncounterData.ts:628`) mutates in place, and then `rebuildFromWrittenReset` (`view.ts:213-230`) re-parses into new holders. `resolveInitiativeRefs` mutates in place. The sidebar's `prepareModel` re-parses. The pool modal mutates `this.creature.instances[*]` in place.
- **Tests.** The new and updated jest tests are red on base (22 failures) and green on HEAD. e2e red on base: POOL-C01, C02, C09, C10, COND-R03, COND-D08. COND-R06 is not red (LOW-2). Mutants: M1 (no only-key check), 5 failed · M2 (no unknown-key fold), 2 failed · M3 (identity instead of holder), 9 failed · M4 (no count), **0 failed** · M5 (no mixed fallback), 1 failed · M6 (no delete), 0 failed · M7 (hero not shaped), 13 failed · M8 (instances not shaped), 11 failed · M9 (spread after the known keys), 1 failed · M10 (null counts as absent), 0 failed. Other pin changes are strengthened, not weakened: the serialize oracle now compares to raw `parseYaml(source)`, default-keys checks exact bytes, COND-R03 and D08 check exact shapes.
- **e2e titles.** New titles are `[POOL-C09]` and `[POOL-C10]`. No bracketed ticket id.
- **Scope.** src touches only `initiative/model.ts`. No quote, comment or flow-list work (SC-599). No change to instance regeneration (SC-600). The CHANGELOG bullet is in the worktree superproject, uses plain words, and says quotes, comments and `[a, b]` lists are still rewritten (SC-599). It does not claim quotes are kept.
- **Working tree.** `git status --porcelain` in the plugin is empty before and after my runs, and `git diff` is empty. Every source mutation was restored with `git checkout HEAD -- src/elements/initiative/model.ts`. My probe test files were copied in, run and deleted (literal paths). The base-model e2e run left a base-built `main.js`, which I rebuilt from HEAD (`node esbuild.config.mjs production`, rc 0). New `e2e/.out/` bundles from my runs are gitignored.

## Artifacts (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc592-r1-review-V1/`)
- Gates: `v-static-jest.sh`, `v-static.rc`, `v-tsc.log`, `v-lint.log`, `v-jest.log`, `v-e2e.sh`, `v-e2e.rc`, `v-e2e.log`
- Red on base: `v-base.sh`, `v-red-base-jest.log`, `v-red-base.rc`, `v-e2e-red.sh`, `v-e2e-red-pool.log`, `v-e2e-red-cond.log`, `v-e2e-red.rc`
- Probes: `zz-sc592-v1-probe.test.ts`, `zz-sc592-v1-form-probe.test.ts`, `v-probe.sh`, `v-probe-out-head.json`, `v-probe-out-base.json`, `v-form-out-head.txt`, `v-probe-head.log`, `v-probe-base.log`
- Mutants: `v-mutate.py`, `v-mutate.sh`, `v-mutants.txt`, `v-mut-M1…M10-*.log`
- Rebuild: `v-rebuild.sh`, `v-rebuild.rc`

---

## r2 re-review (V1, scoped to the r2 delta)

**Summary**
1. Verdict: **LAND-READY.** No new findings. LOW-1, LOW-2, INFO-2 (jest pin) and INFO-5 are resolved as the owner ruled.
2. Rebase: `git range-diff 94133a5a..1c66c5ca 4f0c87f2..b2c9bf2f` shows all 5 r1 commits as `=` (unchanged): 3623edf3=8f2a4980, 0261000f=ea098d6b, f856773e=0388c042, 5f12f484=16c7c6a1, 1c66c5ca=b2c9bf2f. The base move 94133a5a..4f0c87f2 touches only `e2e/driver/census.ts` and `e2e/specs/_census.e2e.ts`.
3. r2 `79da77f8`. The M4 mutant (no per-key count) is now **killed**: 2 tests fail in "the per-key count of plain strings". The new count and empty-string pins are red on the 4f0c87f2 model (3 failed) and green on HEAD. COND-R06 now pins the exact shape. It **FAILs on the 4f0c87f2 model** (received `{key: bleeding}`) and passes on HEAD.
4. Carry check: `git diff 1c66c5ca 79da77f8 -- src` touches only `model.ts` (+4/-2), and those lines are inside the doc comment (INFO-5 wording). `styles-source.css` is identical (`git diff --quiet` rc 0). The only other paths that changed are the census e2e files, the cond-rows spec and the unit test. Carrying lifecycle, shots, freeze and parity forward from 1c66c5ca is therefore valid.
5. Superproject CHANGELOG `e9c9b6c9` (parent `3eb1adbd` = origin/main): `git diff 3eb1adbd e9c9b6c9` is `CHANGELOG.md | 8 ++++++++`, a pure insertion. So every origin/main bullet is kept (Unreleased bullets: 136 → 137). No conflict markers. The SC-592 bullet is byte-identical to r1's, sits after the SC-595 bullet and is accurate.
6. Gates on 79da77f8 (I re-ran these): tsc clean · lint clean · jest **7262 passed / 1 skipped** (css cached) · e2e **`264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`** (SC-257, SC-355, SC-384, SC-580, SC-588).
7. Tree: the plugin's `git status --porcelain` is empty and HEAD is 79da77f8. The model.ts mutant and the base checkout were both restored with `git checkout HEAD`. `main.js` was last built from HEAD (the COND-R06 green run, then the full e2e).

Artifacts (scratch `sc592-r1-review-V1/`): `r2-jest.sh`, `r2-jest.rc`, `r2-tsc.log`, `r2-lint.log`, `r2-jest.log`, `r2-mutate.py`, `r2-mutate.sh`, `r2-mutants.txt`, `r2-mut-M4-no-count.log`, `r2-red.sh`, `r2-red.rc`, `r2-red-jest.log`, `r2-red-e2e.log`, `r2-green-e2e.log`, `r2-e2e.sh`, `r2-e2e.rc`, `r2-e2e.log`.
