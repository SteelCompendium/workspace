# SC-640 r2 independent review

Executive summary
- VERDICT: LAND. Plugin head `fd702758` (4 commits on dse develop `a9f0af1d`; `origin/develop` is still `a9f0af1d`). Superproject CHANGELOG `1eade0ec` (parent `d2d4e5fd`; workspace `origin/main` is now `a0361d8b`, 2 docs-only commits ahead, no CHANGELOG change).
- Findings: 0 HIGH, 0 MEDIUM, 2 LOW (a stale comment, a dropped CHANGELOG blank line), 5 INFO.
- Rulings 1-7 are met in code. Every name-keyed site in `src/` goes through the one helper now. Probes P1-P10 (mixed spellings, typed values, duplicates, nameless, unknown keys, hand-edited block, focus after Complete and Reset) all behave to spec.
- Mutation: 32 of 32 mutants killed, each by at least one new or flipped SC-640 test.
- Gates I measured: tsc 0 / lint 0 · jest `Tests: 1 skipped, 13390 passed, 13391 total` (shots cache present), rc 0 · e2e `--element=negotiation` `75/77 ok, 0 failed, 2 known-bug` · full e2e `OBSIDIAN-E2E done: 611/622 ok, 0 failed, 11 known-bug, coverage: 417/417 pairs`, rc 0, no flakes.
- Freeze and parity were not re-run: the diff touches no CSS, no `visual-harness/` file and no frozen fixture.
- `git range-diff 5f962390..e9f99813 a9f0af1d..fd702758`: all 4 commits are `=` (identical patches). The rebase lost nothing of SC-639. K05, NEGO-F01/F05..F08 and NEGO-L03/L07..L09 pass.
- Worktree left clean (`git status --porcelain` in the plugin is empty). Every mutant and probe edit was restored with `git checkout --`.

## Gates (logs under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc640-r2-rev/`)

| Gate | Result | Log |
|---|---|---|
| tsc / lint | rc 0 / 0, no output | `tsc-1.log`, `lint-1.log`, `tsc-lint-1.rc` |
| jest full | `Test Suites: 1 skipped, 293 passed`; `Tests: 1 skipped, 13390 passed, 13391 total`; rc 0 | `jest-full-1.log`, `jest-full-1.rc` |
| e2e negotiation | `75/77 ok, 0 failed, 2 known-bug` (W06/W07 SC-641); W04/W05/W12/W13 ok; F01..F08, L02..L09 ok | `e2e-nego-1.log` |
| e2e full | `611/622 ok, 0 failed, 11 known-bug, coverage: 417/417 pairs`, rc 0 | `e2e-full-1.log`, `e2e-full-1.rc` |
| range-diff | 4/4 `=` | `range-diff.txt` |

The jest number is 13390/1 with the shots cache and matches the implementer's. A second targeted run of `negotiation` matched every suite, because the worktree path contains "negotiation". The mutants use `test/(unit/model|dom/elements)/negotiation`: 680 tests, all green on the base.

## Task 1: name-keyed sites

I grepped `src/` (montage excluded) for `motivationsUsed`, `pitfallsUsed`, `.motivations`, `.pitfalls`, `hasBeenAppealedTo`, `.contains(`, `includes(`, `indexOf(`, `.name ===` and `Map<string`. Every match/compare site goes through `nameKey` / `sameName` / `isUsed` / `addUsed` / `removeUsed` / `groupByName` / `isMotivationSpent` / `spendChosenMotivations`:
- chip pressed state: `ArgumentView.ts:177,196`
- toggles: `ArgumentView.ts:214-237`
- sync: `ArgumentView.ts:109-110`
- Complete: `ArgumentView.ts:450`
- dossier: `MotivationsPitfallsView.ts:51-58,90`
- model: `NegotiationData.ts:307-363`

`EndBandView.ts`, `PatienceInterestView.ts`, `LearnMoreView.ts`, `elements/negotiation/view.ts`, `focusRules.ts` and the chrome summary read no motivation or pitfall names. `serialize` (`elements/negotiation/model.ts:104-105`) maps entries by position. No missed site.

The views build their registries once per view instance (`build()` is called once; each render makes new views). So switching from a `Map.set` to `push` cannot accumulate duplicates.

## Probes (temporary `R2PROBE` describe appended to `test/dom/elements/negotiation-names.test.ts`, then restored)

The code with the probes is kept at `negotiation-names.with-probes.test.ts.txt`. Output is in `jest-probe-1.log` (3 reds were my own text helper) and `jest-probe-2.log` (11/11 pass).

- **P1, mixed spellings (ruling 2):** entries `Power` (spent) / `power`, `motivationsUsed: [POWER]`.
  - The chip is pressed and spent. Reuse is available and checked. The tiers equal the `[Power]` spelling.
  - Un-spending row 0 makes the chip not spent, and the note gets `reusedMotivation: false`.
  - Spending row 1 makes the chip spent again, with `reusedMotivation: true` and `[false, true]` in the note.
  - Chip, roll, Reuse and dossier agree at every step.
- **P2:** both entries spent, row 0 un-spent: Reuse stays true because the other entry is still spent.
- **P3, typed values (SC-638):** `name: 2024` twice, `reason: 7`, `motivationsUsed: [2024]`.
  - Pressing Peace and spending the second 2024 writes `name: 2024` (number) twice, `reason: 7`, and `motivationsUsed: [2024, Peace]` with 2024 still a number.
  - Only the second entry is spent.
  - Un-press then re-press writes `[Peace, 2024]`, and 2024 is written back as the number. That is the existing SC-638 per-text restore, not a regression.
- **P4, unknown keys (SC-637):** `note_to_self`, `gm_note` on each of two same-named motivations and two same-named pitfalls, and `currentArgument.my_key`. All survive a Spent write plus two chip writes, each in its own entry.
- **P5, readability:** 5x Peace in mixed casing, Legacy/legacy, 2 nameless, Greed/greed pitfalls. The Argument tab shows:
  - `Peace is listed 5 times; this chip stands for all 5.`
  - `Legacy is listed twice; this chip stands for both.`
  - `2 Motivations have no name; this chip stands for both of them.`
  - `Greed is listed twice; this chip stands for both.`

  The dossier shows the same lines with "the Argument chip". The chips are `Peace, Legacy, Unnamed Motivation, Power`. One line per name reads fine.
- **P6, Complete (ruling 3) and focus (SC-642):** entries Peace / Legacy / PEACE / `peace `, chosen `[" pEACE"]`, Complete at High. The note gets `[true, false, true, true]`, and focus lands on the first Motivation chip (the merged, now-spent Peace chip).
- **P6b:** two nameless entries, chip pressed, then Complete. Both are spent, both stay nameless, focus is on the merged chip, and no "Unnamed" appears in the note.
- **P7, Reset (SC-639) with merged spent chips:** focus stays in the card on `negotiation.menu`, both entries are un-spent, and the chip is redrawn not spent.
- **P8, chosen list `[null, "  ", ~]`:**
  - `"  "` presses the nameless chip. That follows ruling 2: trimmed, it is `''`.
  - The nulls match nothing.
  - Un-pressing removes the `"  "` and the note keeps `[null, null]` (the SC-649 ghost-entry behaviour).
- **P9, read-only host:** all 4 dossier Spent chips are disabled, both notices are drawn on both surfaces, and a click writes nothing.
- **P10, hand-edited block:** flow maps, a folded `>-` reason, a comment, `currentArgument: {motivationsUsed: [ PEACE ], extra: [1, 2]}`. One Spent write and two chip writes keep:
  - the text outside the fence byte for byte
  - both reasons
  - `extra: [1, 2]`

  The final chosen list is `['Peace']` (the entry spelling). The YAML comment is dropped by `stringifyYaml`, as on every negotiation write (SC-599 territory, not SC-640).
- The existing new tests already cover text above/below and two blocks in one note without cross-talk (`negotiation-names.test.ts:371,380`). M21 kills both.

## Ruling-by-ruling

1. **Position identity.** The dossier `rows` array is per entry (`MotivationsPitfallsView.ts:30,96`), and Spent passes the entry (`:90`). The Argument chips are one per group, as ruling 3 requires. Met.
2. **One trimmed, case-insensitive rule.** `nameKey` (`NegotiationData.ts:183-185`) has a comment naming montage `matchKey`, and `src/elements/montage/` is untouched. Writes use the entry spelling (`addUsed`, `:198-200`; M30 is killed). Typed `[5]` round-trips (an existing test plus P3). Met.
3. **Merged chip and notice.** The chip is spent when any entry is (`isMotivationSpent`, `:331-333`), reuse follows the same rule, and Complete spends all entries of the name (`:336-340`). The notice shows on read-only hosts. `styles.css` is unchanged and the notice reuses `.dse-nt__why` (ruling 7). Met.
4. **Nameless.** `labelOf` is applied to chip text, tooltip, aria-label, dossier name and the Spent tooltip. `''` is written and round-trips, and two nameless entries merge. Met.
5. **Scope.** No edits to `focusRules.ts`, the Reset handler, montage, or the SC-641 markers (K08/K09/W06/W07 are still known-bug). Met.
6. **Un-press removes every match.** `removeUsed` splices backwards (`:204-208`). The SC-638 R2 DOM test is rewritten (`negotiation-wrong-types.test.ts:158-166`). Met.
7. The follow-ups were dropped as ruled; nothing to check.

## Findings

### LOW-1: stale comment in `restoreUsed` contradicts ruling 6
`src/model/NegotiationData.ts:98-100` still says "a chip press removes the first equal entry" and "a removal takes the first equal one, `indexOf`, so the later one stays".
- Since r1b, `removeUsed` removes every same-named entry. A text that was un-pressed is therefore always absent afterwards (`c = 0`), and the `c <= n` "last c entries" branch never fires through a chip. Behaviour is correct (P3, the `[5, Power, power]` DOM tests).
- Failure scenario: the comment misleads the next person who edits `restoreUsed` or `removeUsed` about which entries survive.
- Fix: reword it to "a chip press removes every entry of its name (`removeUsed`, SC-640) and adds at the END; a text still present is untouched, so it takes the LAST `c` snapshot entries…". Or drop the parenthetical. Comment only, no test change.

### LOW-2: the CHANGELOG conflict resolution dropped the blank line between the SC-639 and SC-649 bullets
In `1eade0ec`, `CHANGELOG.md`, the hunk deletes the empty line that separated the SC-639 bullet from the SC-649 bullet on `d2d4e5fd`. The rest of `## Unreleased` has a blank line there.
- Failure scenario: cosmetic only. The list renders as a tight/loose mix, and the next deploy's promotion edits a list whose spacing has quietly changed.
- Fix: put the blank line back after "working somewhere else on the page.", and add one between the new SC-640 bullet and the SC-639 bullet to match.

### INFO
- **I-1:** `NameGroup.first` (`NegotiationData.ts:214,224`) is written but never read in `src/` or tests (the implementer flagged this). Harmless. It could be dropped, or used for the chip's spelling instead of `group.name` (they are the same value).
- **I-2:** a notice names the FIRST spelling for every casing: `Peace is listed 5 times` when the YAML holds `PEACE` / `peace`. This is the ruling-3 wording and reads fine (P5). Noted in case Scott wants the variants named.
- **I-3:** M11 (`argumentUsesPitfall` back to exact `includes`) is killed only by the unit test `negotiation-names.test.ts` (unit) "a chosen entry in another casing…". The DOM `pitfallsUsed: [POWER]` test checks pressed state and writes but not the tiers. Covered; a DOM tier assertion would be belt-and-braces only.
- **I-4:** a whitespace-only chosen entry (`"  "`) presses the nameless chip (P8). This follows ruling 2: trimmed, it is the blank key.
- **I-5:** the superproject branch is on `d2d4e5fd`; `origin/main` is `a0361d8b` (2 docs-only commits, none touching CHANGELOG). Landing needs only the usual rebase/merge; no conflict is expected.

## Mutation table (32/32 killed)

Diffs are in `mutant-M*.diff`, logs in `mutant-M*.log`, summaries in `mutants-summary-c1.log`, `-c2.log` and `-c3.log`. Each mutant was restored with `git checkout --` right after its run. Suite: `test/(unit/model|dom/elements)/negotiation` (680 tests).

| # | Mutant | Red | Killed by (new/flipped tests) |
|---|---|---|---|
| M1 | `groupByName` never merges | 10 | K06, K10, one-chip/notice DOM tests, groupByName/sharedNameNotice unit |
| M2 | `nameKey` drops case folding | 18 | casing DOM + unit, one-press-clears, Power/power |
| M3 | `nameKey` drops trim | 8 | `" higher authority "`, `[Power, " power "]`, unit |
| M4 | entry Spent flips the first same-named entry | 4 | SECOND row's Spent, text above/below, unit |
| M5 | `removeUsed` removes only the first match (r1) | 6 | SC-638 `[5,"5"]` rewrite, one-press-clears x4, unit |
| M6 | Complete spends only the first entry of a name | 2 | Complete spends EVERY entry, unit spendChosen |
| M7 | `isMotivationSpent` reads only the first entry | 3 | merged chip spent, Reuse on second-spent, unit |
| M8 | `labelOf` returns the raw name | 4 | K07, nameless labels, two-nameless merge, unit |
| M9 | blank name is not a key (montage rule) | 6 | nameless toggles/round-trip/merge, unit |
| M10 | `argumentUsesMotivation` exact `includes` | 3 | cased roll DOM, Complete at High cased, unit |
| M11 | `argumentUsesPitfall` exact `includes` | 1 | unit "another casing…" (I-3) |
| M12 | `argumentReusesMotivation` exact `find` | 3 | Reuse on merged chip, unit x2 |
| M13 | `setMotivationUsed` reuse-on exact `includes` | 1 | unit "a name is spent when ANY entry…" |
| M14 | reuse-off drops the "another still spent" guard | 3 | unit + 2 legacy (SC-439 M, T-7) |
| M15 | `sharedNameNotice` always null | 9 | K06, K10, notice DOM tests, unit |
| M16 | motivation chip pressed: exact `includes` | 1 | `" higher authority "` DOM |
| M17 | pitfall chip pressed: exact `includes` | 1 | `pitfallsUsed: [POWER]` DOM |
| M18 | merged chip spent from `group.first` only | 1 | SECOND row's Spent (chip drawn spent) |
| M19 | Argument motivation notice removed | 6 | K06 + notice DOM tests |
| M20 | Argument pitfall notice removed | 4 | K10, pitfalls notice, read-only, nameless merge |
| M21 | dossier Spent passes the name (flips all) | 4 | FIRST/SECOND row, text above/below, two blocks |
| M22 | dossier motivation notice removed | 3 | HA dossier note, read-only, nameless merge |
| M23 | dossier pitfall notice removed | 2 | pitfalls dossier note, read-only |
| M24 | dossier motivation name not labelled | 1 | nameless labels |
| M25 | dossier pitfall name not labelled | 1 | nameless labels |
| M26 | dossier Spent tooltip not labelled | 1 | nameless labels (`Mark Unnamed Motivation…`) |
| M27 | Argument chip text not labelled | 3 | K07, nameless labels, two-nameless merge |
| M28 | toggle-on reuse via the old exact first `find` | 1 | Reuse on merged chip |
| M29 | pitfall toggle via exact `indexOf` | 3 | `[POWER]`, `[Power, " power "]`, `[7, POWER, power]` |
| M30 | `addUsed` writes the lowercased key | 15 | every write-spelling assertion |
| M31 | dossier refresh reads the first same-named entry | 1 | SECOND row's Spent (row drawn spent) |
| M32 | `setMotivationUsed(name)` flips only the first | 1 | unit "a name flips every entry of it" |

## Screenshots (real Obsidian 1.14.4, Reading view, `Negotiation/dup-names.md`)

Taken with a temporary element `saveScreenshot` added to NEGO-W04 and run with `--only=NEGO-W04` (`e2e-shots-1.log`, 1/1 ok). The spec was restored with `git checkout --`.
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc640-r2-rev/sc640-r2-dup-names-card.png`: whole card, Argument tab. One "Higher Authority" chip, and the notice under it in the card's italic caption style.
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc640-r2-rev/sc640-r2-dup-names-argument-chips.png`: the Motivation chip group only.
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc640-r2-rev/sc640-r2-dup-names-motivations-dossier.png`: the Motivations card. "2 of 2 open", the notice, and both rows with their own "Mark spent".

The notice is legible on steel dark; it is the same faint italic as the Reuse box's "only when a spent Motivation is appealed to".

## r3 re-review (scoped to the r3 delta, 2026-11-15)

VERDICT: LAND. 0 findings (1 INFO). Plugin `fd702758..cefa9ca8` (one commit). Superproject `origin/main a0361d8b` + `63eaccfb` (CHANGELOG) + `68afc125` (pointer bump).

1. **Comment (LOW-1): resolved.** `src/model/NegotiationData.ts:98-102` now says that a chip press removes EVERY entry of its name (SC-640), so it never leaves an entry of that text behind. It also says the `c <= n` "last `c`" rule is for a removal by position (`indexOf` + `splice`), and that matches the algorithm.
   - INFO: the product has no `indexOf` + `splice` path left (the only `splice` in the model is `removeUsed:208`). That clause now describes the SC-638 unit tests that splice by hand (`test/unit/model/negotiation-wrong-types.test.ts:119,130`) and any future caller. It is accurate; nothing to do.
2. **Assertion (INFO-3): resolved.**
   - With M11 applied (`argumentUsesPitfall` back to exact `includes`), the `[POWER]` DOM test goes red at the new line `negotiation-names.test.ts:220` (`expect(tiers).toEqual(tiersOf(plain.root))`), alongside the unit test. That is 2 red tests, against 1 before.
   - The mutant was restored with `git checkout --` and the plugin status is clean.
   - Log: `mutant-M11.log`, `mutants-summary-r3.log`.
3. **CHANGELOG (LOW-2): resolved.** `63eaccfb` is a pure 11-line addition at the top of `## Unreleased`. It is the SC-640 bullet plus one blank line. The blank lines before SC-639 and between SC-639 and SC-649 are intact (`d912f0d3` -> `ea27df8a`, `+11 -0`). The wording is unchanged from r2 and reads fine. Its one use of "chip" is a quote of the on-card notice text.
4. **Superproject shape: correct.**
   - `git log origin/main..HEAD` gives exactly `63eaccfb`, then `68afc125`, and `origin/main` is `a0361d8b`.
   - `git ls-tree HEAD draw-steel-elements` gives `cefa9ca87d2f…`.
   - Superproject worktree `git status --porcelain` is empty.
5. **Gates on `cefa9ca8`:**
   - tsc rc 0, lint rc 0 (`tsc-r3.log`, `lint-r3.log`, `tsc-lint-r3.rc`).
   - Negotiation jest: `Test Suites: 9 passed, 9 total`; `Tests: 680 passed, 680 total`; rc 0 (`jest-nego-r3.log`).
   - I scoped the jest run as `npx jest 'test/(unit/model|dom/elements)/negotiation'`. A bare `npx jest negotiation` matches every suite, because the worktree path contains "negotiation".
