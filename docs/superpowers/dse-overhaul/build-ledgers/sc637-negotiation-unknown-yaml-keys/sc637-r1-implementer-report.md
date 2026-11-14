# SC-637 r1 implementer report

**Executive summary**
- Verdict: DONE. A negotiation write now keeps the keys the negotiation does not read, at the top and inside each motivation and pitfall, on every write path including Reset and the sidebar host.
- REBASED per the owner's mid-task note. Final dse head: `cf2efdd0` on dse `origin/develop` `7b9e82cf` (original base `76520b1f`). Superproject CHANGELOG commit: `5bc6e4b2` on workspace `origin/main` `66b04168` (a descendant of the `120cf676` the note named; original base `18f8043f`); the CHANGELOG conflicted with the SC-643 bullet and I kept both. No pointer bump committed.
- Final gates, all on the rebased head: tsc clean, lint clean, jest **12702 passed / 2 skipped** fresh (12681 base + 21 new), lifecycle **64/64** (21+16+9+4+7+4+3), e2e **`491/509 ok, 0 failed, 18 known-bug, coverage: 287/287 pairs`**.
- `styles.css` sha256 of the rebased head = clean `7b9e82cf` build = `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` (also equal to the `76520b1f` build), so shots/freeze/parity carry.
- One existing test changed (not a drive-by): `wrapperDefaultKeys.test.ts` negotiation case used the unknown key `title: Frodo` as its empty source; it now starts from `{}`.
- Fresh worktrees have no `node_modules`: I ran `npm ci` in the plugin dir (ignored by git).
- The gate table in section 4 and the shas in section 5 describe the first run on `76520b1f` (same numbers except jest 12596); section 6 has the final rebased-head run.

## 1. Key and write-path enumeration

Keys the parser READS (the `NegotiationData` / `Motivation` / `Pitfall` constructors are the only readers; the pipeline pops `prefs:` / `collapsed:` / `collapsible:` / `collapse_default:` before `parse`, SC-652 out of scope):
- Top level (15): `name`, `initial_patience`, `current_patience`, `initial_interest`, `current_interest`, `motivations`, `pitfalls`, `currentArgument`, `i5`, `i4`, `i3`, `i2`, `i1`, `i0`, `_dse_anchor`.
- Motivation (3): `name`, `reason`, `hasBeenAppealedTo`. Pitfall (2): `name`, `reason`.
- No legacy alias or old spelling exists. No key is "read then dropped as empty" (`name: ''` / `reason: ''` are written as declared); all of these are in the known sets, so none can be carried twice (unit test pins `unknownKeysOf` for a block that declares every known key).
- Not covered, by the brief's scope: unknown keys INSIDE `currentArgument` (plugin-owned state) are still dropped on a write. See Follow-ups.

Write paths (all mutate the SAME parsed model in place, then `persist()` -> `serialize(model)` in `src/elements/negotiation/model.ts`; nothing builds a new `NegotiationData` on a write; `resetData()` mutates in place):
Patience seal and Interest seal (`PatienceInterestView:107,:148`), appeal chip (`ArgumentView` onMotivationToggled), pitfall chip (`onPitfallToggled`), the three modifier checkboxes (`ArgumentView` ~:282), Complete Argument (`ArgumentView` ~:461), Spent chip (`MotivationsPitfallsView:90`), Reset (`view.ts:166-169`). The sidebar host (`SidebarBlockHost`) writes through the same pipeline parse/serialize (only the host differs). `parseNegotiationData` (legacy) is used by tests only. After an outside edit the card is re-parsed fresh (new instance, extras re-read from the new text).

## 2. Design

- `src/model/NegotiationData.ts`: module-private `WeakMap<object, [key, value][]>`, filled by each of the three constructors with the own enumerable keys of the raw item that are not in that level's known set (a non-mapping item, a string or list, carries none). Exported reader `unknownKeysOf(owner)`.
- `src/elements/negotiation/model.ts`: `serialize` builds each DTO as a fresh copy (`{...omitUntouchedDefaults(x)}`), then appends the pairs with `Object.defineProperty` (so a `__proto__:` key becomes a plain own key), for the model, each motivation and each pitfall. Known keys keep today's fixed order and SC-482 omission; unknown keys follow in their original relative order. The live model is never touched.
- Why a side table and not own properties (the brief's design caution): these are classes with methods and fields. An own property named `ending`, `offerFor`, `resetData`, `toJSON`, `constructor`, `__proto__` or a different spelling of a field would shadow or overwrite a member or reach the prototype. In the map no YAML key can: pairs are only read by `unknownKeysOf` and only written into the DTO. Side benefits: instances keep exactly their old shape (`toEqual`, `{...model}`, the legacy-writer oracle in the tests are unchanged), and a plugin-built model or a new motivation has no extras. Documented in a block comment in `NegotiationData.ts` and a pointer in `model.ts`.
- Integer-looking keys are written first (JS key order), documented in the comment and pinned by a unit test, as for SC-625.
- Value formatting is whatever `stringifyYaml` does today (SC-599 untouched). No montage code changed; no helper extracted from montage (the 8-line `defineProperty` copy is local).

## 3. Tests added (fails-on-base measured by running each file with `src` checked out at `76520b1f`, plus a one-line `unknownKeysOf` stub for the unit file)

Unit, `test/unit/model/negotiation-serialize.test.ts`, describe "keys the negotiation does not know survive a write (SC-637)" (12 tests; **9 fail on base**, 3 pass on base: the "never touches the live model / stable second pass", "non-mapping item and nothing-unknown block", "plugin-built model carries none" tests are guards):
1. top-level scalar + nested map + list survive (fails)
2. top-level order, known fixed then unknown original (fails)
3. motivation and pitfall keep nested values, order known-then-unknown (fails)
4. Spent on a motivation and on another keeps its own keys (fails)
5. Reset keeps every unknown key (fails)
6. serialize leaves the live model alone; second pass byte-identical (passes on base)
7. every key the negotiation reads is known, only the Director's keys are carried; no duplicate (fails)
8. non-mapping item carries no keys; block with nothing unknown writes no extra key (passes on base)
9. plugin-built model / hand-made Motivation / Pitfall carry none (passes on base)
10. `__proto__`, `constructor`, `toString`, `hasOwnProperty`, `toJSON` at all three levels: no pollution, prototypes intact, `ending()` still works, values written back (fails)
11. keys named like members (`ending`, `offerFor`, `resetData`, `Name`, `current_Patience`, `Reason`) at all three levels: shadow nothing, written back (fails)
12. integer-looking key written first, quoted, at all three levels; stable (fails)

jsdom, `test/dom/elements/negotiation-matrix.test.ts` (11 tests, **all 11 fail on base**; 357 others pass on base):
- `test.each(ACTIONS)` x8 (Patience seal, Interest row, appeal chip, pitfall chip, Spent chip, modifier checkbox, Complete Argument, Reset) keeps top-level key + nested map, motivation keys (scalar, nested map, list), pitfall key, their order, and the prose above/below byte-identical
- two blocks in one note: write to the second leaves the first's body byte-identical and keeps its own keys
- a second write after the first still keeps the keys
- sidebar: a Patience seal through a real `SidebarBlockHost` keeps all three levels and `_dse_anchor` (describe "SC-637 X: a negotiation in the sidebar ...")

Moved/flipped: jsdom `[K01]`/`[K02]` `test.failing` removed from `negotiation-bugs.test.ts` (SC-625 precedent: fixed markers leave the bugs file; the matrix tests above supersede them). e2e `knownBug('SC-637')` NEGO-X06 and NEGO-X07 now plain `it` (titles keep their ids, `failsWith` dropped, `knownBug` import dropped). `e2e/README.md` line for `unknown-keys.md` reworded (it had no open-marker list).

Changed existing test: `test/dom/elements/wrapperDefaultKeys.test.ts` negotiation case "slot 3 then slot 5 returns it to {}" used `title: Frodo` (a key the negotiation never reads) as its empty source; SC-637 correctly keeps it. Source is now `{}`; assertions unchanged. (Counter's `title: Deaths` case is untouched: counter reads `title`.)

e2e, `e2e/specs/negotiation/integrity.e2e.ts` (5 new; paths covered in real Obsidian after this change: Patience seal [X06, X07], Reset via the real menu [X09], Spent chip + appeal chip + pitfall chip [X10], Complete Argument [X11], hand edit [X12], hand delete [X13]; Interest seal, modifier checkboxes and the sidebar are jsdom only):
- `[NEGO-X09]` Reset keeps the keys
- `[NEGO-X10]` Spent / appeal / pitfall chips each keep them
- `[NEGO-X11]` Complete Argument keeps them
- `[NEGO-X12]` hand edit of an unknown key (top, motivation, pitfall) kept by the next write
- `[NEGO-X13]` hand-deleted unknown keys do not come back
Free scenario ids used: X09..X13 (X08 was taken). No manifest pair added (coverage stays 287/287). No lifecycle scenario needed (G-S127 unused).

## 4. Gates (measured)

| Gate | Result | Log |
|---|---|---|
| tsc (`npm run tsc`, both projects) | clean | `.../sc637-r1-impl/g4-tsc.log` (final), `g3-tsc.log` |
| lint | clean | `g3-lint.log` |
| jest, fresh worktree | Tests: 12596 passed, 2 skipped, 12598 total; Suites 282 passed, 1 skipped (12575 + 12 unit + 11 jsdom - 2 removed `test.failing` = 12596; with a shots cache that is 12597 / 1) | `g2-jest.log` (first run `g1-jest.log` had 1 failure, the wrapperDefaultKeys case above, fixed) |
| lifecycle (7 parts, `--only=`) | 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3 = **64/64**, 0 failed, every part rc=0, no flake re-runs | `lc-p1.log` ... `lc-p7.log` |
| e2e | `OBSIDIAN-E2E done: 491/509 ok, 0 failed, 18 known-bug, coverage: 287/287 pairs` (484 + 2 flipped + 5 new = 491; 504 + 5 = 509; known-bug 20 -> 18) | `e2e2.log` (first run `e1` `490/509, 1 failed` = NEGO-X13 had unescaped `\n` in its page eval; fixed in `109b73b2`) |
| shots / freeze / parity | carry: `styles.css` sha256 of this branch = clean `76520b1f` build = `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` (built with `node esbuild.config.mjs production`) | `basebuild.log` |

All logs under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc637-r1-impl/`. Base-failure evidence: `unit1-base.log` (9 failed / 14 passed), `matrix1-base.log` (11 failed / 357 passed).

## 5. Commits

dse (`draw-steel-elements`, on `76520b1f`): `3e94a980` fix + unit tests, `27f575d8` jsdom tests (+ bugs-file removal), `0f609669` e2e flip + X09..X13 + README, `696f214c` wrapperDefaultKeys test, `109b73b2` NEGO-X13 escape fix. Superproject: `1a936a9f` CHANGELOG bullet only. The superproject still shows ` M draw-steel-elements` (pointer unstaged, per the brief).

## Drive-by fixes:
None.

## Follow-ups:
- Unknown keys inside `currentArgument:` (plugin-owned state, 5 known keys) are still dropped on a write. The ticket and brief name only the top level, motivations and pitfalls, so left alone; the owner may want a ticket.
- A `null` item in `motivations:` / `pitfalls:` (`- ` with nothing) throws in the `Motivation` / `Pitfall` constructor (`data.name` on null): pre-existing, unchanged.
- Fresh worktrees from `wt-new` have no `node_modules`; `npm ci` in the plugin dir is a required first step for every gate. dse-verify does not say so.
- The jest log in a fresh worktree prints a `findDriftedTokens` TypeError (visual-harness, no shots cache) that does not fail jest; known fresh-worktree noise.

## Proposed SKILL.md text (not applied)
- Row 4b / CURRENT: `today 491/509 ok, 0 failed, 18 known-bug, coverage: 287/287 pairs, since SC-637 (+7: NEGO-X09..X13 new, the 2 SC-637 markers NEGO-X06 and NEGO-X07 are plain tests; known bugs now SC-638, SC-639, SC-640, SC-641, SC-642, SC-648, SC-649 plus SC-257, SC-355, SC-384, SC-627, SC-628 x2, SC-629)`. (Counts of the other markers are as at dispatch; I only measured 20 -> 18.)
- jest: fresh `12596 passed / 2 skipped` (12597 / 1 with the shots cache) since SC-637.
- Footgun line: `a fresh worktree has no node_modules: run npm ci in draw-steel-elements before the first gate`.
- Footgun line: `in a TS template literal passed to dse.externalEdit, write \\n (two backslashes); a single \n becomes a real newline in the page eval and fails with SyntaxError`.

## 6. Rebase onto the moved baselines and final gate run

- dse: `git rebase origin/develop` (`76520b1f` -> `7b9e82cf`, SC-643, no negotiation code, package.json unchanged so no `npm ci`), no conflicts. Commits now: `6bb29a06` fix + unit tests, `09fc9cc4` jsdom tests, `bf1358a8` e2e flip + X09..X13 + README, `e9b1ac38` wrapperDefaultKeys test, `cf2efdd0` NEGO-X13 escape fix.
- Superproject: `git rebase origin/main` (`66b04168`), CHANGELOG.md conflicted with the SC-643 bullet, resolved by keeping both (SC-643, then SC-637, then the SC-625 bullet already there), commit `5bc6e4b2`. Worktree still shows ` M draw-steel-elements` (unstaged pointer).
- Gates on `cf2efdd0` (logs in `.../scratchpad/sc637-r1-impl/`): tsc `rb-tsc.log` clean; lint `rb-lint.log` clean; jest `rb-jest.log` Tests: 12702 passed, 2 skipped, 12704 total (Suites 285 passed, 1 skipped); lifecycle `lc-r1.log`..`lc-r7.log` 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3 = 64/64, all rc=0, no re-runs; e2e `rb-e2e.log` `OBSIDIAN-E2E done: 491/509 ok, 0 failed, 18 known-bug, coverage: 287/287 pairs`; styles.css comparison `basebuild2.log` (clean `7b9e82cf` archive built with `node esbuild.config.mjs production`).
- The jest numbers in the proposed SKILL.md text should be read against the new base: fresh `12702 / 2` at `7b9e82cf` + SC-637 (12597 / 1 style "with shots cache" figure becomes 12703 / 1).
