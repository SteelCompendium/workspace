# SC-649 R1 report

## Executive summary
- Verdict: DONE. The roll tiers, the Same Argument box and Complete Argument now count only what the card shows as chosen.
- Plugin branch `sc649-negotiation-roll-counts`, head `8df960e3`, rebased onto dse develop `3e88b3f5` (the owner's baseline move). Two commits: `8507ac71` fix, `8df960e3` e2e.
- Gates, all measured on the rebased head: tsc and lint clean; jest 13331 passed / 1 skipped (shots cache present; 13326 baseline + 5 new); lifecycle 64/64 (21+16+9+4+7+4+3).
- e2e `593/609 ok, 0 failed, 16 known-bug, coverage: 416/416 pairs`; shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147.
- Freeze 280/280, 0 FAILED. Parity 0 gaps / 0 undeclared / 24 declared.
- No push, no superproject bump, no CHANGELOG edit. Working tree clean.

## Design
One model-level source on `NegotiationData` (`src/model/NegotiationData.ts`), name matching identical to the chips (`includes(name)`):
- `argumentUsesMotivation()`: some block motivation's name is in `motivationsUsed`.
- `argumentUsesPitfall()`: same for pitfalls.
- `argumentReuseChecked()`: `argumentReusesMotivation() && currentArgument.reusedMotivation` (the Reuse box as drawn).
- `CurrentArgument.usesMotivation()/usesPitfall()` are kept (unit tests use them) but now documented as RAW-list queries.

Call sites changed, all in `src/drawSteelAdmonition/negotiation/ArgumentView.ts`: `syncMods` Reuse `checked` (now `argumentReuseChecked()`), Same Argument `disabled` (`argumentUsesMotivation()`), and `mountRoll` -> `ArgumentPowerRoll.build(...)` (motivation, pitfall and reuse arguments). `resolveArgument` needed no edit: it reads `byTier` from that roll, and its spend loop already skips names with no motivation. A grep of `src/` found no other caller of `usesMotivation` / `usesPitfall` / raw `reusedMotivation` feeding a roll or a disabled state. The remaining raw `reusedMotivation` uses are writes (chip toggle, checkbox handler, model setters), which are correct.

No YAML is rewritten on render: the stray entry stays until a user action writes the argument (tested). If the name returns, the chip is pressed and the roll counts it again.

SC-640 interaction: matching still uses `includes(name)` exactly as the chips do, so a duplicate-named or nameless motivation behaves as before (a nameless motivation's `''` still matches an `''` entry). Nothing in SC-640's scope was changed.

## Tests
jsdom, `test/dom/elements/negotiation-bugs.test.ts`:
- K11, K12, K13 flipped from `test.failing` to `test`: suffix and "never a specific fix" comment dropped, helper kept.
- New: Complete at High with a Ghost motivation writes [4,2] and clears the entry.
- New: Complete at High with a Ghost pitfall writes [4,2] and clears the entry.
- New: with a Ghost motivation Same Argument is enabled with no reason text, and rendering writes nothing (entry still `['Ghost']`).
- New: a real motivation entry still greys Same Argument and Complete at High writes [4,3] (guards against over-correction).
- New: `reusedMotivation: true` with an unspent motivation, Complete at High writes [4,3], not the reuse table.
- Pre-fix check: with src reverted, 7 tests fail (K11-K13 plus the 4 new Case tests); the guard test passes both ways.

e2e: `[NEGO-A14]` in `e2e/specs/negotiation/argument.e2e.ts`, new fixture `e2e/vaults/shipped/Negotiation/ghost-appeal.md` (basic.md plus `currentArgument.motivationsUsed: [Ghost]`), driver const `GHOST_APPEAL`, README fixture row. It asserts: no chip pressed, no-motivation tiers, Same Argument enabled with no reason, note untouched on open, then High + Complete writes Interest 4 / Patience 2 in one write and clears the entry. It fails on the pre-fix src (verified). No new manifest pair; coverage stays 416/416.

## Gates (verbatim summary lines; logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc649-r1-impl/`)
- tsc: rc=0 (`r2-tsc.log`). lint: rc=0 (`r2-lint.log`).
- jest: `Tests: 1 skipped, 13331 passed, 13332 total` (`r2-jest.log`).
- lifecycle: `done: 21/21 ok` (`r2-lc1.log`), `16/16` (`r2-lc2.log`), `9/9` (`r2-lc3.log`), `4/4` (`r2-lc4.log`), `7/7` (`r2-lc5.log`), `4/4` (`r2-lc6.log`), `3/3` (`r2-lc7.log`), 0 failed each.
- e2e: `OBSIDIAN-E2E done: 593/609 ok, 0 failed, 16 known-bug, coverage: 416/416 pairs` (`r2-e2e.log`).
- shots: 592 ok, rc=0, host-leak 163 button kinds x 3 x 2 = 978, modal host-leak 40 kinds = 240, capture clip 147 (`r2-shots.log`).
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical ...)` (`r2-freeze.log`).
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).` rc=0 (`r2-parity.log`).

Process notes: a first pass on the pre-rebase head (09c879f2) also went green on jest, lifecycle 64/64 and e2e 592/609; its shots run was killed by my own `timeout` wrapper, and I then aborted the rerun when the baseline moved. Those numbers are superseded by the rebased run above. No flakes occurred on the rebased run, and no gate was re-run.

## Drive-by fixes:
None.

## Follow-ups:
- The header comment of `negotiation-bugs.test.ts` still describes the file as "filed bugs as `test.failing`" and the describe is named "SC-439 filed bugs"; K11-K13 and the new SC-649 tests are now plain tests in it. Cosmetic; left alone.
- `Complete` leaves a pre-existing `sameArgumentUsed: true` flag checked while a motivation is appealed (the box is disabled but checked, and the roll's Same Argument table is shadowed by the motivation table anyway). Not in this ticket.
