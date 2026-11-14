# SC-637 r1b fold report

**Executive summary**
- Verdict: DONE. Unknown keys inside `currentArgument:` now survive every write that keeps the argument and end with the argument (Complete Argument, Reset).
- dse head: see `git log` below (commit `4e30dcfb`, one new commit on `cf2efdd0`); base `origin/develop` still `7b9e82cf` (fetched, unchanged, no rebase). Superproject CHANGELOG commit amended: `31a49921` (still one commit on `66b04168`, no pointer bump).
- Gates on the final head: tsc clean, lint clean, jest **12720 passed / 2 skipped** fresh (12702 + 18), e2e **`491/509 ok, 0 failed, 18 known-bug, coverage: 287/287 pairs`** (no new e2e: nothing real-Obsidian-only is left), `styles.css` sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` unchanged. No lifecycle this round.
- 18 new tests (10 unit, 8 jsdom); 11 of them fail on the pre-fold head `cf2efdd0` (the other 7 are the "ended with the argument" rows and guards, which hold trivially when nothing is kept).
- Skill proposal: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc637-negotiation-unknown-yaml-keys/sc637-skill-proposal.md`.

## Change
- `src/model/NegotiationData.ts`: `ARGUMENT_KNOWN_KEYS` (`motivationsUsed`, `pitfallsUsed`, `lieUsed`, `sameArgumentUsed`, `reusedMotivation`); the `CurrentArgument` constructor records its unknown pairs in the same WeakMap; `CurrentArgument.resetData()` deletes the entry. The argument object is never replaced in the code (every view mutates `model.currentArgument` in place; grep for `currentArgument =` finds only the constructor), so extras follow its lifetime without any rebuild logic. Complete Argument (`ArgumentView` ~:453) and `NegotiationData.resetData()` both end the argument through `CurrentArgument.resetData()`, so their behaviour on the argument is unchanged and the extras go with it.
- `src/elements/negotiation/model.ts`: `serialize` now writes `currentArgument` from a copy with the pairs appended (previously the live instance went to `stringifyYaml`, and the live argument is never touched). Guarded by `written.currentArgument === model.currentArgument`, so SC-482's omission of an undeclared, untouched argument is unchanged.
- Comments in both files name the argument level and its lifetime rule.
- CHANGELOG bullet amended: mentions "a motivation, a pitfall or the argument under way" and that an argument's extra keys go when Complete Argument or Reset ends it.

## Paths
- Keep the argument's extras (jsdom `test.each` over the shared write-path table, 6 rows): Patience seal, Interest row, appeal chip, pitfall chip, Spent chip, modifier checkbox. Unit: the same via the model (chip pushes, `lieUsed`, standing, `setMotivationUsed`).
- End them: Complete Argument and Reset negotiation (jsdom, 2 rows; unit via `currentArgument.resetData()` and `model.resetData()`). Other levels' keys stay (asserted).

## Tests added (all on the same files as r1)
Unit, `test/unit/model/negotiation-serialize.test.ts`, describe "keys inside currentArgument survive while the argument does (SC-637)" (10; fails on pre-fold head = F, passes = P): keeps scalar+map+list after chip / modifier / standing / Spent writes (F); order known-then-unknown (F); Complete Argument ends them (P, guard); Reset ends them (P, guard); a new argument after the old one ended carries nothing (P, guard); only unknown keys are carried (F); absent or non-mapping argument carries none (P, guard); serialize copies, live argument gains no key, second pass byte-identical (P, guard, the identical-bytes part is new behaviour but trivially true before); hostile keys `__proto__`, `constructor`, `toString`, `hasOwnProperty`, `toJSON`, method-named `usesMotivation` / `resetData`, case variants `LieUsed` / `lie_used` pollute and shadow nothing (F); integer-looking key first, quoted (F). There is no alias for an argument field in the parser.
jsdom, `test/dom/elements/negotiation-matrix.test.ts` (8): 6 keep rows (F), 2 end rows (P, guards).
e2e: none added. Every real-Obsidian path that writes the argument is the same pipeline path jsdom drives through the real `ReadingModeBlockHost`; the unknown-keys fixture has no argument and a new fixture would add nothing that jsdom cannot show.
Fail-on-base evidence: `fold1-prefold.log` (`11 failed, 398 passed, 409 total` with src at `cf2efdd0`); at `7b9e82cf` every one of the keep rows fails a fortiori (no extras at any level).

## Logs (all in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc637-r1-impl/`)
`fold-tsc.log`, `fold-lint.log`, `fold-jest.log`, `fold-e2e.log`, `fold.rc` (rcs and styles.css hash), `fold1.log` (targeted run after the change), `fold1-prefold.log`.

## Drive-by fixes:
None.

## Follow-ups:
None new. The null-item crash is SC-638 (left alone as instructed).
