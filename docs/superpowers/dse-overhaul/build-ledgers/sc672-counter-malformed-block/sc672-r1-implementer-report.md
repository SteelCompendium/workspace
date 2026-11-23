# SC-672 r1 implementer report

**Executive summary**
- STATUS: DONE_WITH_CONCERNS (one gate red, G-S61, and it is red on a clean `129beb18` too).
- dse head `86397967` on `sc672-counter-malformed-block` (base `129beb18`, origin/develop unchanged). Superproject CHANGELOG commit `c7c04a7b`. Nothing pushed, no tags.
- tsc (incl. `-p e2e`) and lint: clean (rc 0 / 0, no findings). jest: 13752 passed / 2 skipped, 0 failed (base 13702, so +50 new tests: 25 unit, 19 jsdom in a new file, 6 in `wrapperDefaultKeys.test.ts`).
- e2e: new spec alone 10/10; ONE full run `OBSIDIAN-E2E done: 668/677 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs` (658+10, 667+10).
- lifecycle: seven parts, 63/64. Only G-S61 red, twice on my head (parts run + re-run alone) and once on a clean `129beb18` build (same signature: recorder's disk read torn, SC-668).
- `styles.css` sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` is identical to a clean `129beb18` build: shots / freeze / parity SKIPPED (they carry).
- Existing tests changed: 2 files, see below. Follow-ups: 3 (below).

## What changed, by file (dse repo)
- `src/model/Counter.ts`: `parse` refuses anything that is not null / undefined / a plain map (text, number, boolean, array) with `Invalid data: the block must be a map of keys.`; null / undefined read as `{}`. Both `Counter.parseYaml` and the element's `parse` go through it. The YAML-parse error path is unchanged. Doc comment of `RawCounterData` corrected ("no new runtime checks").
- `src/elements/shared/undeclaredDefaults.ts`: comment corrected (counter is no longer listed as unable to re-parse an empty body). No code change; no counter special case.
- `src/elements/counter/model.ts`, `definition.ts`: untouched (still no schema).
- Tests: `test/unit/model/counter-wrong-block.test.ts` (new, 25), `test/dom/elements/counter-wrong-block.test.ts` (new, 19), `test/dom/elements/wrapperDefaultKeys.test.ts` (+6), `test/dom/authoring/formModalEmptyYaml.test.ts` (updated).
- e2e: `e2e/specs/counter/counter-wrong-block.e2e.ts` (CTR-W03..W12, 10 tests); fixtures in `e2e/vaults/shipped/Counter/`: `wrong-block.md` and `empty-block.md` (byte-identical `cp` from the sc442 worktree, verified with `cmp`), plus new `wrong-list.md`, `wrong-number.md`, `comment-only-block.md`, `adjacent-fences.md`, `two-empty.md`; 7 rows added to the fixture table in `e2e/README.md`. No census / manifest registration was needed (the jsdom census has no counter fixture list; fixtures are auto-walked; no new control, coverage stays 418/418).
- Docs: `docs/counter.md` two Notes bullets (plain words, no ticket id). Superproject `CHANGELOG.md` one bullet at the top of `## Unreleased`.
- Commits (dse): `b016c3e8` fix, `1743a4a7` jest tests, `e6ce602e` e2e + fixtures + README, `86397967` docs. Superproject: `c7c04a7b` (submodule pointer NOT staged).

## Existing tests changed
- `test/dom/authoring/formModalEmptyYaml.test.ts`
  - `CASES` entry `counter`: `acceptsEmpty: false` -> `true`. This flips the three `describe.each` cases "SC-493: emptying the raw-YAML box of counter" (`an empty box`, `a whitespace-only box`, `a comment-only box`): Save is now enabled, writes the box verbatim, and the block re-renders without an error card (the same assertions montage / project already had).
  - "SC-493 r2: the emptied preview drops its read-only badge ... after a valid box is emptied": switched from `CASES[0]` (counter) to `CASES[1]` (negotiation, still refuses an empty box) and the retype value to `name: Duke`, because that test needs an element whose Save goes off.
  - "SC-493 r1b ... the footer button the message points at is called Cancel": `CASES[0]` -> `CASES[1]` for the same reason (the message is no longer shown for a counter). Assertion unchanged.
- `test/dom/elements/wrapperDefaultKeys.test.ts`: the `test.each` "a null (blank) source body is written back as an empty body" now also covers `counter` (added a case, nothing weakened); the comment above it that listed counter among elements that cannot re-parse an empty body is corrected. No other existing test pinned the old behaviour (full jest green).

## What a `{}` block and an empty block draw and write (measured, jsdom + real Obsidian)
- `{}`: counter at 0, no name (`.dse-counter__name` is empty), `min` 0, no `max`, minus disabled, plus enabled. + writes `current_value: 1`; + then - writes back `{}`.
- Empty (nothing, blank lines, comment only, `null`, `~`, `undefined`): the identical DOM (`innerHTML` equal to the `{}` card in the jsdom test) and the same model (`toEqual`). + writes `current_value: 1` (typed 7 + Enter writes `current_value: 7`); + then - writes back an EMPTY body and the note is byte-identical to the original (tested through the real write path). Nothing surprising came up in the generic rule. A comment-only block loses its comment on the first write (SC-599, as ruled).
- Real Obsidian (CTR-W06..W12): empty block draws 0 with no error card; + writes `current_value: 1` inside the fence in Reading view and in Live Preview, ABOVE / BELOW intact (whole-note string equality); adjacent fences take the write with the closing fence on its own line; two empty blocks: + on the second changes only the second, + on the first only the first; reopening after the write shows 1.
- R1 (CTR-W03..W05, jsdom, unit): `hello`, `- a` list, `5`, `0`, `true`, `false`, nested list, `[1, 2]`, quoted text: the plain error card with the exact message, title `Counter: failed to render (render)`, no `[data-dse-control]`, no button / input, nothing written (host `replaceSource` never called; the e2e note is byte-identical after a real click on the card).

## Drive-by fixes:
- None beyond the two comment corrections the brief asked for (`undeclaredDefaults.ts`, `Counter.ts` doc comment) and the matching comment in `wrapperDefaultKeys.test.ts`.

## Follow-ups:
1. **View-registry collision when a write makes two blocks identical (pre-existing, not counter-empty specific).** In Reading view, two counters that are identical twins (e.g. `Counter/twins.md`, Health 1 / Health 1): + on the SECOND, then + on the FIRST ends with both bodies equal, and the e2e invariant "view registry collisions=0" fails (`collisions=1 ambiguous=0`). Reproduced on this branch with a scratch spec on the existing `twins.md` (non-empty) and with `two-empty.md`; a case where distinct counters become identical with ONE write did not collide. The note bytes were right in every case (the claim is refused and the card is redrawn fresh). Deleted the scratch spec and fixture. CTR-W11 steps around it (it presses + twice on the second block first, so the two blocks differ when the first is written, with a comment saying why). The owner may want a ticket for the claim / twin logic (`src/framework/host/viewRegistry.ts` `claim`, SC-481 area).
2. **G-S61 red on clean `129beb18`** (SC-668): same "disk read was torn" signature on my head (2 runs) and on a clean base build (1 run); machine loadavg 3-38 during the runs. The other 63 lifecycle scenarios are green.
3. **SC-442 overlap:** its `knownBug('SC-672')` markers CTR-W01 (`wrong-block.md`) and CTR-W02 (`empty-block.md`) become passing known-bugs once this lands, which fails the run; whichever lands second must turn them into plain tests. The two fixture files are byte-identical on both branches (rebases cleanly); my ids start at CTR-W03 in a new spec file. SC-442 also keeps `wrong-block` out of the jsdom census `RENDERS` list; nothing in this branch touches that list.
- Not probed (out of scope, per ledger): wrong-typed VALUES inside a map (`max_value: banana`, `name: [a]`).

## Gate evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5812b474-3aec-46a6-8f06-0ef85cf1e10a/scratchpad/sc672-r1-impl/`)
- `npmci.log`; `final-tsc.log`, `final-lint.log` (+ `.rc`); `jest-full.log` (+ `.rc`); red/green TDD logs `red1.log`, `green1.log`, `green2.log`
- e2e new spec alone: `e2e-new2.log` (10/10; `e2e-new1.log` is the first attempt with two failures, fixed); full run `run-e2e1/e2e-full.log`
- lifecycle: `run-lc1/part1.log` .. `part7.log` (21/21, 16/16, 9/9, 3/4, 7/7, 4/4, 3/3); G-S61 re-run `run-e2e1/g61.log`; clean-base G-S61 and styles sha `run-base/g61.log`, `run-base/styles.sha`, `run-base/build.log`
- Scratch base tree (a `git archive` of `129beb18`, node_modules symlinked): `base129/`
- Test-run bundles of the e2e runs are under `draw-steel-elements/e2e/.out/` in the worktree (git-ignored).
