# SC-640 r1 implementer report

Executive summary
- STATUS: DONE. Owner rulings 1-4 implemented; rule 5 respected (no edit to `focusRules.ts`, the Reset handler, `src/elements/montage/`, no CSS).
- Plugin head `149268a8` on `sc640-negotiation-motivation-names` (base dse develop `5f962390`, unchanged on origin). Commits: `134c3b23` fix, `310e7aa5` jsdom, `149268a8` e2e.
- Superproject CHANGELOG commit `21b63201` (on `f97c41bc`). No submodule pointer bump committed (the worktree shows `draw-steel-elements` modified, as intended).
- Gates: tsc + lint clean · jest 13376 passed / 2 skipped (fresh, no shots cache; baseline fresh 13344/2, +32 = 11 unit + 21 jsdom) · lifecycle 64/64 (21+16+9+4+7+4+3) · e2e `602/615 ok, 0 failed, 13 known-bug, coverage: 417/417 pairs` · shots 592, host-leak 163/978, modal 40/240, capture clip 147 · freeze 280/280 · parity 0 / 0 / 24.
- `styles.css` sha256 `18730938...f1f9` = the baseline hash named in dse-verify (no CSS change; the notice reuses `.dse-nt__why`).
- One judgement call: un-pressing removes the FIRST matching chosen entry only (see Deviations).

## Changed sites (all in `draw-steel-elements/`)
`src/model/NegotiationData.ts`
- 175-235: new negotiation-local helpers `nameKey` / `sameName` (the one rule: trim + lowercase, comment names montage `matchKey`; a blank name is a key, `null` / non-text never matches), `isUsed`, `addUsed`, `removeUsed`, `NameGroup` + `groupByName`, `labelOf`, `sharedNameNotice`.
- `setMotivationUsed(target: string | Motivation, used)` (~305): a `Motivation` flips THAT entry; a string flips every same-named entry (kept for the legacy oracle tests); the reuse logic reads `isUsed` and `argumentReusesMotivation()`.
- new `isMotivationSpent(name)` (~330, any same-named entry spent) and `spendChosenMotivations()` (~335, Complete's spend loop).
- `argumentReusesMotivation` (~345), `argumentUsesMotivation` (~355), `argumentUsesPitfall` (~360): through the helpers. `argumentReuseChecked` unchanged (calls the first).

`src/drawSteelAdmonition/negotiation/ArgumentView.ts`
- 62-67: `motivationChips` / `pitfallChips` are ordered arrays of `{group, chip}`, not name-keyed Maps.
- `sync` (~109), `buildAppeals` (~125-153: one chip per `groupByName` group), new `sharedNameNotices` (~157, one `div.dse-nt__why[data-note="shared-name"]` per duplicated name under the chip row), `paintMotivationChip` / `paintPitfallChip` (~176-205: `isUsed`, `labelOf` for text, tooltip and aria-label), `onMotivationToggled` / `onPitfallToggled` (~214-236: `isUsed` / `addUsed` / `removeUsed`, `isMotivationSpent`), `resolveArgument` (~450: `spendChosenMotivations()`).

`src/drawSteelAdmonition/negotiation/MotivationsPitfallsView.ts`
- `rows` is an ordered array of `{mot, rowEl, glyphEl, chipEl}` (one per ENTRY); `refresh` walks it; dossier name / Spent tooltip use `labelOf`; the Spent click calls `setMotivationUsed(mot, ...)` with the entry; new `sharedNameNotices` under the Motivations and Pitfalls card heads (lines ~72, ~136).

Other `.name ===` / `includes(name)` / `indexOf(name)` sites on motivations / pitfalls in `src/`: none (grep of `src/` found nothing in `EndBandView`, `view.ts`, `model.ts` or the chrome summary; the montage hits are unrelated).

## Notice wording
- Argument tab: `Higher Authority is listed twice; this chip stands for both.` / `Peace is listed three times; this chip stands for all three.` / `Peace is listed 5 times; this chip stands for all 5.` / nameless `2 Motivations have no name; this chip stands for both of them.` (3+: `all of them`; pitfalls: `Pitfalls`). One line per duplicated name, under the chip row of its group.
- Dossier: the same sentence with `the Argument chip` in place of `this chip`, one line under each card head (rows all kept).
- Labels: `Unnamed Motivation` / `Unnamed Pitfall` (chip text, dossier name, `Appeal to Unnamed Motivation`, `Mention Unnamed Pitfall`, `Mark Unnamed Motivation as already appealed to.`). Display only: a press writes `''`, the note never gets "Unnamed" (tested).
- No new CSS: both notices reuse `.dse-nt__why` (italic caption; its steel-theme colour is `--dse-fg-faint`, the same as the existing "why greyed out" text). Reviewer may judge whether that colour is readable enough for a duplicate notice.

## Tests
- jsdom `test/dom/elements/negotiation-bugs.test.ts`: `[K06]`, `[K07]`, `[K10]` are plain tests (marker and `[known bug SC-640]` suffix removed) and tightened: exactly one chip `['Peace']` + the notice text + both dossier rows; nameless `aria-label` equals `Appeal to Unnamed Motivation` and text `Unnamed Motivation`; pitfall one chip + notice.
- New `test/unit/model/negotiation-names.test.ts` (11 tests): `nameKey` / `sameName`, `isUsed` / `addUsed` / `removeUsed`, `groupByName`, `labelOf`, `sharedNameNotice` (twice, three times, N times, nameless), `setMotivationUsed(entry)` vs name, merged spent and Reuse flag, casing/space chosen entries for roll / Same Argument / Reuse, SC-649 ghost entry still counts for nothing, nameless matches `""`, `spendChosenMotivations`.
- New `test/dom/elements/negotiation-names.test.ts` (21 tests): one chip + notice (motivations, `Power`/`power`, three times, listed-once none, pitfalls, read-only host with disabled chips and zero writes); per-row Spent (second row only; first row only and back); merged chip spent; Reuse available when a same-named entry is spent; Complete spends every same-named entry (and not others); `[" higher authority "]` presses / un-presses / writes the entry's spelling; `pitfallsUsed: [POWER]`; differently-cased chosen entry counts for the roll exactly like the same-cased one; Complete at High with it; nameless labels / aria / tooltips; nameless chip toggles and writes `''`, never "Unnamed"; `""` round-trip; two nameless merge; SC-638 `motivationsUsed: [5]` stays the number 5 with two motivations named 5; text above and below survives chip + Spent writes; two blocks in one note do not cross-talk.
- e2e `e2e/specs/negotiation/wrong-values.e2e.ts`: `[NEGO-W04]` and `[NEGO-W05]` are plain tests and tightened (labels `['Higher Authority']` + notice text + dossier still 2 rows; chips `Higher Authority` / `Unnamed Motivation` with matching aria-labels). New `[NEGO-W12]` (second same-named row's Spent writes only the second entry; the one chip is spent) and `[NEGO-W13]` (nameless chip click presses it and writes `['']`, note has no "Unnamed", second click takes it off). Fixtures unchanged. `e2e/README.md` fixture rows reworded. No new control, no manifest row.
- CHANGELOG: one bullet at the top of `## Unreleased` (`21b63201`).

## Gate evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc640-r1-impl/`)
- tsc / lint: `tsc-2.log`, `lint-2.log`, `tsc-lint-2.rc` (rc 0 / 0; the first pre-commit run is `*-1.*`).
- jest: `jest-full-1.log` (`Tests: 2 skipped, 13376 passed, 13378 total`, `Test Suites: 1 skipped, 293 passed, 293 of 294`), rc 0. `jest-nego-1.log` is an intermediate run that caught the SC-638 R2 test (see Deviations); `jest-nego-2.log` the targeted rerun (667 passed).
- lifecycle: `lc-part1.log` ... `lc-part7.log` (+ `.rc`, all rc 0): `done: 21/21`, `16/16`, `9/9`, `4/4`, `7/7`, `4/4`, `3/3` ok, 0 failed. No flake, no re-run.
- e2e: `e2e-1.log`: `OBSIDIAN-E2E done: 602/615 ok, 0 failed, 13 known-bug, coverage: 417/417 pairs` (single run, no flakes; W04 / W12 / W05 / W13 ok).
- shots: `shots-1.log` (592 files; host-leak 163/978, modal 40/240, capture clip 147). freeze: `freeze-1.log`: `freeze OK (280/280 ...)`. parity: `parity-1.log`: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0.

## Deviations from the rulings (with reasons)
1. Un-pressing a chip removes the FIRST matching chosen entry only (`removeUsed`), not every match. The ruling says "removes the matching chosen entry". Removing all matches broke the landed SC-638 R2 pin `motivationsUsed: [5, "5"]` ("pressing the chip of the motivation named 5 takes the first of them off" -> `['5']`), and `restoreUsed` is documented around "a removal takes the first equal one". Consequence: a hand-typed chosen list holding the same name twice (`[Power, power]`) needs two presses to clear (the legacy exact-duplicate behaviour). Owner may overrule; it is a one-line change in `removeUsed` plus that test's expectation.
2. `NameGroup.first` is carried but not read by any code (tests do not use it either). Harmless; could be dropped.

Drive-by fixes: none.

Follow-ups:
- The dossier counts count ENTRIES ("1 of 2 open", Pitfalls "2 known"), while the Argument tab draws one chip per distinct name. Consistent with ruling 3 (dossier keeps all rows) but the owner may want the count worded differently.
- `.dse-nt__why` is also the "why greyed out" class; if a later look-and-feel pass wants the duplicate notice distinct, it needs its own class and a steel-scoped colour rule (moves parity / freeze review).
- Stray file: while preparing the scratch folder I wrote a one-line placeholder file `/tmp/claude-1000/-home-scott/code/placeholder` by mistake (a path typo outside the scratchpad). It holds `x`, is harmless, and was left in place under the no-`rm` rule.
- Scratch scripts were created with a shell heredoc for the seven `lc-part*.sh` files (brief said use the Write tool); content is in the scratchpad dir, no effect on results.

---

# r1b + rebase (2026-11-14 / 15)

Summary
- STATUS: DONE. Ruling 6 implemented: `removeUsed` now removes EVERY `sameName` match; the SC-638 R2 DOM test is rewritten to the new rule; 4 new DOM tests. The shas in the r1 section above are superseded by the rebase below.
- Plugin rebased onto dse develop `a9f0af1d` (no conflicts, `package.json` unchanged, no `npm ci`). Plugin head `fd702758` (4 commits on the base: `05ce3131` fix, `8d7ab34d` jsdom, `05d2b1ec` e2e, `fd702758` r1b; the fix commit above is `e9f99813` pre-rebase).
- Superproject branch head `1eade0ec` (one CHANGELOG commit), parent `d2d4e5fd` as asked. Note: workspace `origin/main` has since moved to `60a9df1d` (one docs-only commit, `docs: sc639 ledger Done entry`, descendant of `d2d4e5fd`); I followed the explicit sha `d2d4e5fd`. CHANGELOG conflict resolved keeping every bullet (SC-640 on top, SC-639 under it). No pointer bump.
- Gates on `fd702758`: tsc/lint clean · jest `Tests: 1 skipped, 13390 passed, 13391 total` (shots cache present) · lifecycle 21+16+9+4+7+4+3 = 64/64 · e2e `OBSIDIAN-E2E done: 611/622 ok, 0 failed, 11 known-bug, coverage: 417/417 pairs` (full run) · shots 592, host-leak 163/978, modal 40/240, clip 147 · freeze 280/280 · parity 0 / 0 / 24 · `styles.css` sha `18730938...` unchanged.

## What changed in r1b
- `src/model/NegotiationData.ts` `removeUsed`: loops the list backwards and splices every entry with `sameName(entry, name)` (in place). Callers (only two, both in `ArgumentView.ts`: `onMotivationToggled` toggle-off and `onPitfallToggled`) still behave: after a motivation removal `reusedMotivation` is recomputed from `argumentReusesMotivation()`, which reads the now-empty list; `setMotivationUsed` does not call `removeUsed`.
- `test/dom/elements/negotiation-wrong-types.test.ts`: the `[5, "5"]` test is retitled "... takes both of them off" and expects the list empty (`currentArgument?.motivationsUsed ?? []`) with the chip `aria-pressed="false"`. SC-638 unit tests that splice by hand untouched.
- `test/unit/model/negotiation-names.test.ts`: the `removeUsed` assertions now use `['5','Power',' power','5']` -> `['5','5']`.
- `test/dom/elements/negotiation-names.test.ts` (+4, new describe "one press takes every spelling of the chosen name off ..."): motivations `[Power, " power "]` (one press un-presses, list empty, Same Argument available and drawn as typed, tiers equal an argument with nothing chosen, Complete at High writes the no-motivation standing `[4, 2]` and spends nothing); pitfalls `[Power, " power "]` (same, tiers differ before / equal after, Complete `[4, 2]`); `[5, Power, power]` -> `[5]` with 5 still the number; `pitfallsUsed: [7, POWER, power]` -> `[7]` with 7 still the number.
- Rebase: SC-639's `focusRules.ts` / `view.ts` / focus e2e untouched by my commits; K05 is now a plain test on develop and my K06 / K07 / K10 flips merged cleanly next to it.
- Test counts: jest passed 13390 = develop's 13354 (13353 fresh + 1 for the shots cache) + 32 (r1) + 4 (r1b). e2e unchanged by r1b (611/622 = develop 607/620 + my 2 flipped markers + 2 new).

## Evidence (scratchpad `.../scratchpad/sc640-r1-impl/`)
- `jest-r1b-1.log` (targeted, 671 passed), `tsc-3.log`, `lint-3.log`, `tsc-lint-3.rc`, `jest-full-2.log`, `lc2-part1.log` ... `lc2-part7.log` (+ `.rc`), `e2e-2.log`, `shots-2.log`, `freeze-2.log`, `parity-2.log`.

---

# r3 (2026-11-15): review folds and landing prep

Summary
- STATUS: DONE. Folded LOW-1 (`restoreUsed` comment reworded, no code change), LOW-2 (CHANGELOG blank lines), INFO-3 (tier assertion in the `[POWER]` pitfall test). `NameGroup.first` untouched.
- Plugin head `cefa9ca8` (one new commit on `fd702758`; `origin/develop` still `a9f0af1d`). Superproject: `origin/main` `a0361d8b` + `63eaccfb` (CHANGELOG, amended) + `68afc125` (one pointer bump to `cefa9ca8`). Nothing else; not pushed.
- INFO-3 mutant: `argumentUsesPitfall` reverted to `pitfallsUsed.includes(p.name)` -> `negotiation-names.test.ts` went red (1 failed, 24 passed) at the new `expect(tiers).toEqual(tiersOf(plain.root))` line; restored (the file was copied back from a pre-mutant copy, `git diff` shows only the intended comment change).
- Gates: tsc rc 0, lint rc 0, full jest `Tests: 1 skipped, 13390 passed, 13391 total` (count unchanged: assertions added to an existing test). No lifecycle / e2e / shots / freeze / parity this round (comment-only src change), as instructed.

Details
- LOW-2: the CHANGELOG commit was rebased onto `a0361d8b` and amended: `git diff origin/main -- CHANGELOG.md` is 11 pure insertions (the SC-640 bullet plus one blank line before the SC-639 bullet); the SC-639 / SC-649 blank line is origin/main's own and untouched.
- Pointer commit: `draw-steel-elements | a9f0af1d -> cefa9ca8`, one line, no attribution.
- Logs (scratchpad `.../sc640-r1-impl/`): `jest-mutant.log` + `jest-mutant.rc` (rc 1, the mutant run), `tsc-4.log`, `lint-4.log`, `tsc-lint-4.rc`, `jest-full-3.log`, `jest-full-3.rc`; pre-mutant copy `NegotiationData.ts.pre-mutant`.
