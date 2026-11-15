# SC-649 R2 independent review

## Executive summary
- Verdict: **LAND-READY**. No HIGH or MEDIUM findings. 2 LOW, 4 INFO.
- Reviewed plugin `8df960e3` (branch `sc649-negotiation-roll-counts`; merge-base with dse develop is `3e88b3f5` = origin/develop). Commits: `8507ac71` fix, `8df960e3` e2e.
- The contract holds on every probe (25 probes, all green at head). The roll tiers, the Same Argument disabled state and Complete Argument all read the one model source; a ghost entry marks nothing spent; opening the note leaves it byte-identical.
- Reverting only the `src/` hunks turns K11-K13 and the 4 new Case tests red (7), plus 9 of my probes. NEGO-A14 goes red on the reverted source in real Obsidian.
- Gates: tsc rc=0, lint rc=0, jest 13331 passed / 1 skipped, lifecycle 64/64 (21+16+9+4+7+4+3).
- e2e full run `591/609 ok, 2 failed, 16 known-bug, coverage: 414/416 pairs`. The 2 failures are SET-X03 and SET-X04, the SC-657 known flake. Re-run with `--only=SET-X03,SET-X04`: `2/2 ok`. Union: 593/609, 0 failed, 16 known-bug.
- Shots 592 ok, host-leak 163/978, modal host-leak 40/240, capture clip 147. Freeze 280/280. Parity 0/0/24.
- The held follow-up (a stale `sameArgumentUsed`) is LOW-2. The roll does NOT count the flag. Strictly, the box breaks the contract: it is drawn checked but the tiers ignore it, the mirror image of Case 2. This is not a regression, and a one-line fix is prescribed below.
- Working tree as found (dse clean, superproject ` M draw-steel-elements` as left by the implementer).

## Rulings checked (quoted from the ledger)

> 1. **Drop the hidden entry from the roll; do not invent UI for it.** "What the card shows as chosen" = the pressed motivation chips (entries of `motivationsUsed` that name a motivation the block has), the pressed pitfall chips (same for pitfalls), and the Reuse box as drawn (`argumentReusesMotivation() && reusedMotivation`). The roll tiers, the Same Argument box's disabled state ("not while a Motivation is appealed to"), and Complete Argument all derive from that, from ONE model-level source (NegotiationData / CurrentArgument), not from the raw lists.

Met. `NegotiationData.argumentUsesMotivation / argumentUsesPitfall / argumentReuseChecked` (`src/model/NegotiationData.ts:281-293`) feed `ArgumentView.ts:297` (Reuse checked), `:306` (Same disabled) and `:341-344` (the roll). Complete reads `byTier` from that roll (`:447`), and its spend loop (`:442-445`) matches by `===` and skips names with no motivation. A grep of `src/` for `usesMotivation`, `usesPitfall`, `reusedMotivation`, `motivationsUsed`, `pitfallsUsed`, `sameArgumentUsed`, `currentArgument` and `ArgumentPowerRoll` finds no other reader that feeds a roll or a disabled state. The remaining raw uses are the chip painters (`:168`, `:186`, which define "shown"), writes (`:204-231`, `:245`, `:259`), `setMotivationUsed` (writes) and the serializer.

> 2. **Do not rewrite the user's YAML on render.** The stray entry / raw flag stays in the file until the user's own action (a chip toggle, Complete, Reset) writes the argument, consistent with SC-637/SC-638 (keep what the user typed). If the user later restores the motivation's name, the chip shows pressed again and the roll counts it — consistent with the contract.

Met. Probe P8 checks four cases (ghost motivation, ghost pitfall, raw Reuse flag, ghost + Same): mount, flush, then advance 10 s. In each case the note is byte-identical to the original. A chip toggle with a ghost present (P9) writes `[Ghost, Peace]`, then `[Ghost]` after the unpress. Pitfall ghosts and unknown argument keys survive, and a modifier toggle keeps them all. Complete and Reset clear the stray entries (P1, P6, P7). With the name restored, the chip is pressed, the tiers use the motivation table and Same is greyed out (P10).

> 3. Scope fence: SC-640 (duplicate / nameless motivation chips), SC-641 (defaults, Reset), SC-639 (Reset focus) and SC-648 (options menu position) are NOT this ticket. If the fix touches name-based matching of chosen motivations, note the SC-640 interaction in the report.

Met. The matching is the chips' own `includes(name)`, and no chip or menu code was touched. A nameless motivation with a `""` entry is still pressed and counted (P14), the same as before.

> 4. Evidence: jsdom K11–K13 flip to plain tests; add jsdom tests for Complete Argument's Interest / Patience and the Same Argument disabled state under Case 1, and Complete under Case 2; add ONE e2e scenario (new global id, e.g. `NEGO-A14` after grep) driving Case 1 in real Obsidian.

Met: K11-K13 are plain tests; there are 4 Case tests plus 1 guard test, and NEGO-A14. Two gaps in the evidence follow under LOW-1 and INFO-1.

## Findings

### LOW-1: the Reuse box "as drawn" has no test; a regression that draws the raw flag survives all 628 negotiation tests
- Where: `src/drawSteelAdmonition/negotiation/ArgumentView.ts:297`; tests `test/dom/elements/negotiation-bugs.test.ts:169` (K13), `:217` (Case 2 Complete).
- Scenario: a mutant changes `:297` to `checked: arg.reusedMotivation` (the raw flag). Case 2 YAML (`motivationsUsed: [Peace]`, unspent, `reusedMotivation: true`) then draws the Reuse box CHECKED, greyed out, while the roll uses the motivation table. The card shows Reuse as chosen but the tiers do not count it, which breaks the contract. All 628 tests in `test/dom/elements/negotiation*` and `test/unit/model/negotiation*` still pass (`p4-mut-e-all.log`). K13 cannot catch it: `tiersAgreeWithTheCard` builds its reference by mounting the boxes as drawn through the same code, so a box-display bug moves the reference with it.
- Fix: in K13 or the Case 2 Complete test, assert the box itself:
  `expect(control(m.root(), 'negotiation.mod.reuse')).toMatchObject({ checked: false, disabled: true })`.
  This is one line, needs no product change, and the mutant turns it red.
- The other four single-site mutants (Same disabled raw, roll motivation raw, roll pitfall raw, roll reuse raw) are each caught by 1-2 tests (`p3-mut-*.log`).

### LOW-2: the held follow-up, a stale `sameArgumentUsed: true` while a motivation is appealed to
- Where: `ArgumentView.ts:303-308` (Same box `checked: arg.sameArgumentUsed`, `disabled: argumentUsesMotivation()`); `src/model/ArgumentPowerRolls.ts:51-69` (the precedence).
- Measured (P4, P4b): with `motivationsUsed: [Peace]` and `sameArgumentUsed: true`, the box is `{checked: true, disabled: true, why: "not while a Motivation is appealed to"}`. The tiers are the motivation table, and Complete at High writes [4,3], resetting the flag to `false`. You can reach this state without editing YAML: check Same with no appeal, then press a motivation (the NEGO-A12 path). The note then holds `sameArgumentUsed: true` next to `[Peace]`. Unpressing the motivation re-enables the box, still checked, and the tiers go back to the Same table.
- **Does the roll count it?** No. `buildBaseline` returns the motivation table before it checks `sameArgument`, so the flag is shadowed whenever a shown motivation exists. Neither the tiers nor Complete use it.
- **Does it violate the contract?** Strictly, yes. The card draws a checked box, and the tiers ignore it. This is the mirror image of Case 2 (Case 2: box drawn unchecked but counted; here: box drawn checked but not counted). Ruling 1 already settled the Reuse box this way: it counts "as drawn", and "as drawn" is unchecked whenever it cannot apply. The Same box is the only modifier that stays checked while greyed out. The "not while a Motivation is appealed to" text softens it but does not change what the checkmark says. It is NOT a regression: the code and behaviour are identical at `3e88b3f5`, and no wrong number is ever written.
- The implementer's wording ("`Complete` leaves a … flag checked") is inaccurate. Complete resets the flag to `false` (P4: the written argument has `sameArgumentUsed: false`). The stale checkmark exists only while the argument is in progress.
- Fix (recommended in-ticket, display only, compatible with ruling 2): `checked: arg.sameArgumentUsed && !this.data.argumentUsesMotivation()` at `:305`, mirroring the Reuse box. The flag stays in the YAML (no write on render). Unpressing the motivation shows it checked again, and the roll already follows the same rule, so tiers and box then agree in every state. Add one jsdom test: Peace + `sameArgumentUsed: true` gives a box `{checked: false, disabled: true}` and motivation tiers. NEGO-A12 and NEGO-A13 do not assert the Same box after the motivation press, so no e2e should move (re-run them to confirm). If the owner prefers a separate ticket, the residual is cosmetic and safe.

### INFO-1: "drawing the card writes nothing" is checked through the parsed entry, not the bytes
- `negotiation-bugs.test.ts:207` and NEGO-A14 (`e2e/specs/negotiation/argument.e2e.ts:219`) assert that `motivationsUsed` is still `['Ghost']`. A render-time write that kept Ghost but rewrote anything else (key order, defaults) would pass. P8 measured byte identity in jsdom for four cases, so the product is right today. Optional hardening: compare the note's raw text before and after the open.

### INFO-2: the three new model methods have no unit tests
- `argumentUsesMotivation / argumentUsesPitfall / argumentReuseChecked` are exercised only through the DOM tests (enough to kill the mutants above). Optional.

### INFO-3: name matching corner cases, all consistent with the chips
- `"Peace "` (quoted, trailing space) is not a chip and not counted (P13), because the motivation name is trimmed and the entry is not. A blank list item (`-`, a null entry) is not counted (P15). A typed `motivationsUsed: [5]` with a motivation named 5 is pressed and counted, Complete marks it spent, and a chip write keeps the typed `- 5` (P11). `[5]` with no motivation named 5 is a ghost (P11b). A block with no motivations and a stray entry, pitfall and Reuse flag shows the normal tiers with Same enabled (P16). A Spent toggle on the cards with a ghost present forces no Reuse (P17). SC-637 unknown keys at the top level, in a motivation and in the argument survive a chip toggle with a ghost (P12).

### INFO-4: landing state
- The superproject worktree branch is at `7219b96d` with an unstaged pointer change `09c879f2 -> 8df960e3`. Workspace main has moved on (`7cea83eb`, after SC-629's `dc16b57d`). As the ledger's Baseline moves says, landing needs a rebase onto workspace main, a CHANGELOG bullet under `## Unreleased` and ONE pointer bump. That belongs to the owner's round, not to this branch.

## Tests are non-vacuous
- Reverting only the `src/` hunks (`git diff 3e88b3f5..8df960e3 -- src`, reverse-applied in a scratch copy) fails exactly 7 tests in `negotiation-bugs.test.ts`: K11, K12, K13 and the 4 new Case tests. The guard test ("an argument entry naming a motivation the block has…") passes both ways, as intended. 9 of my probes also fail: P3, P6, P9, P9e, P11b, P13, P15, P16, P17 (`p2-revert.log`).
- NEGO-A14 on the reverted copy, in real Obsidian: `0/1 ok, 1 failed`. It fails at the tiers assertion: received the motivation table, expected NORMAL (`p5-e2e-a14-revert.log`). At head: `OBSIDIAN-E2E NEGO-A14 ok (938 ms)` in the full run.

## Probes (scratch copy at 8df960e3, `probe/test/dom/elements/zz-sc649-r2-probe.test.ts`, 25/25 green at head)
P1 ghost motivation + Peace: Peace pressed, motivation tiers, Same greyed out; Complete High writes [4,3], Peace spent, list cleared. P2 ghost pitfall + Power: pitfall tiers; Complete High writes [2,2]. P3 ghost motivation + `sameArgumentUsed`: Same `{checked, enabled}`, Same table; Complete High writes [2,2]. This is consistent: the box is drawn checked and enabled, and it counts. P4/P4b: LOW-2. P5 Reuse with a really spent Peace: box checked and enabled, reuse table; Complete High writes [3,2]. P5b: the user unticked Reuse, giving the motivation table. P5c: pressing a spent chip arms Reuse. P6 `reusedMotivation: true` with the spent motivation renamed away (Calm spent, entry Peace): no chip, Reuse `{unchecked, disabled}`, Same enabled, NORMAL tiers; Complete High writes [4,2] and the argument is cleared. P7: Complete with only a ghost marks nothing spent. P8: ruling 2, byte-identical in all four cases. P9/P9e: chip toggles with ghosts are sane, and unpressing the real chip recomputes Reuse to false. P10: name restored. P11-P17: INFO-3.

## Gates (head 8df960e3, worktree, logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc649-r2-reviewer/gates/`)
- tsc: `rc=0` (`g1-tsc.log`). lint: `rc=0` (`g1-lint.log`).
- jest: `Tests:       1 skipped, 13331 passed, 13332 total` (`g2-jest.log`; shots cache present; 13326 + 5 new).
- lifecycle: `OBSIDIAN-LIFECYCLE done: 21/21 ok, 0 failed` (`lc1.log`), `16/16` (`lc2.log`), `9/9` (`lc3.log`), `4/4` (`lc4.log`), `7/7` (`lc5.log`), `4/4` (`lc6.log`), `3/3` (`lc7.log`). 64/64, every part rc=0.
- e2e full: `OBSIDIAN-E2E done: 591/609 ok, 2 failed, 16 known-bug, coverage: 414/416 pairs` (`e2e.log`). The failures: `SET-X03 FAIL: timed out waiting for the picker to filter to Settings/token.svg`, and `SET-X04 FAIL: the scenarios before this reload test left data.json differing…`, a cascade from X03. This is the SC-657 known flake (load average 6-10 at the time). The 2 missing pairs are driven only by SET-X03.
- e2e re-run once: `OBSIDIAN-E2E done: 2/2 ok, 0 failed, 0 known-bug, coverage: 3/416 pairs (partial run: gate skipped)` (`e2e-rerun-setx.log`).
- shots: 592 `ok` lines, rc=0; `button host-leak OK (163 button kinds × 3 states … = 978 comparisons`; `modal button host-leak OK (… 40 button kinds … = 240 comparisons`; `capture clip OK (147 screen-media capture(s)…` (`shots.log`).
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)` (`freeze.log`).
- parity: `**0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).**` rc=0 (`parity.log`).

## Tree state
`git status --porcelain --ignored` of the plugin is the same before and after (`status-before-dse.txt`, `status-after-dse-ignored.txt`). The superproject shows ` M draw-steel-elements` before and after, as the implementer left it. All probes and mutants ran in a scratch copy (`git archive 8df960e3` with node_modules symlinked); I edited nothing in the worktree.
