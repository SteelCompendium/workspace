# SC-628 r2 reviewer report — independent review of dse `ff266522` on `afd1436c`

**Executive summary**
- Verdict: **LAND-READY** (no HIGH or MEDIUM). Findings: HIGH 0 · MEDIUM 0 · LOW 1 · INFO 5. The LOW is an M3 edge the owner should rule on: fix it now or accept it like Reset / Set limits / Undo.
- Gates I ran on `ff266522`: tsc rc=0, `tsc -p e2e` rc=0, lint rc=0; jest fresh `Tests: 2 skipped, 13188 passed, 13190 total` (289 suites passed, 1 skipped); lifecycle 21+16+9+4+7+4+3 = **64/64** (no re-runs; part 1's first attempt was killed by my own `timeout` wrapper during G-S9a, not a failure, and re-ran 21/21); e2e `OBSIDIAN-E2E done: 579/600 ok, 0 failed, 21 known-bug, coverage: 416/416 pairs` rc=0.
- styles.css sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` in both the worktree build and a clean `afd1436c` build. They match, so shots / freeze / parity carry over and I did not run them.
- Tests are not vacuous. With `model.ts` set back to `afd1436c`, 174 of the 260 SC-628 unit+jsdom tests fail, and all 9 SC-628 e2e tests (W01, W02, W04..W10) fail with the original bugs ("11", 21, 31, `i.trim is not a function`, montage drawn over `hello`).
- Probed M1–M4 and the r1b folds with about 280 scratch probes (unit, jsdom, and 8 real-Obsidian e2e in Reading view and Live Preview). The probes found no data loss, no concatenation, no raw JS text and no cross-talk.
- openNote (the owner's addition): no SC-628 or existing montage e2e test is made vacuous by the branch's accept-every-error-card `openNote`. Only W08 and W10 depend on it. The fix round should give those two develop's `{ errorCard: true }`.
- Working trees: the plugin worktree is clean and the superproject shows only ` M draw-steel-elements` (the unbumped pointer), the same as at start. Nothing was committed.

## Findings

### LOW-1 — correcting a logged action re-types an untouched tally (M3)
- `src/elements/montage/model.ts:644` and `:653` (`correctMontageEntry`). It always runs `applyTallyDelta(existing.result, -1)` and then `applyTallyDelta(next.result, +1)`. Each of these goes through `setNumber` (`:373`/`:558`), and `setNumber` forgets the typed value.
- Failing input: `successes: "1"` with one logged success. Open the filled cell, change only the skill (Climb to Swim), save. The write gives `successes: 1`, not `"1"`. Seen in jsdom through the real pipeline (`probe-dom-table.txt`, row `UI edit filled cell: change skill only`) and at model level (`probe-model-table.txt`, row `M3 correct entry skill only`). Changing the note or the round has the same effect. Correcting a failure re-types `failures` the same way.
- Why it matters: M3 says a value the montage did not change keeps its type. The user did not change the tally, which stays 1. The value is never lost, only its quoting, and the ledger already accepted the same normalisation for Reset / Set limits / Undo. Those writes do assign the key, though, and this one does not. The CHANGELOG line "A value Montage does not change is written back as you typed it" is therefore slightly too strong for this path.
- Side effect, already on base and not caused by SC-628: with a tally that does not match its entries (`successes: 0` or `banana` plus a logged success), the -1 clamps at 0 and the +1 then gives 1. A skill-only correction therefore changes the tally's value.
- Fix (one of):
  - (a) In `correctMontageEntry`, skip both deltas when `tallyKeyFor(existing.result) === tallyKeyFor(next.result)`. This also removes the clamp side effect.
  - (b) The owner accepts it like Undo / Reset and the CHANGELOG sentence is softened.
- Test to add for (a): a unit + jsdom test that `successes: "1"` + skill-only correction writes `successes: "1"`.

### INFO-1 — openNote accepts an error card for every caller (owner's addition)
- `e2e/driver/dse.ts:216` (`roots.length + cards > 0`). Every montage spec was scanned by `nocontrol.py` and `negonly.py` (outputs `nocontrol.txt`, `negonly.txt`). Every montage e2e test except W08 and W10 does one of two things on its note: it clicks or queries a control (`.control(`, `dse.click`, `dse.press`, `dse.type`, `openMontage`/`openAddHero`/`openLimits`/`openLog*`, `clickChrome`, `cellOf`), or it asserts `.dse-mt` / head text exists. W01 asserts both `.dse-error-card` absent and `.dse-mt` present. A regressed-to-error-card block therefore fails every montage test except W08/W10, which want the card.
- Across all specs, the only tests whose assertions are all negative are CENSUS-16 (settings, no card involved) and NEGO-W02. NEGO-W02 is still a knownBug marker on this branch, and develop's cc2109c1 strengthens it. The census tests that touch no control (CENSUS-01/04/13/17) all carry positive `toContain(id)` checks.
- Conclusion: no vacuous test today. Fix round: rebase onto develop `12aaf5b5`, take develop's `e2e/driver/dse.ts` (the 3-way merge conflicts on exactly this hunk), and pass `{ errorCard: true }` in W08 and W10 only. Leave W01 without it, so a regression to an error card times out loudly.

### INFO-2 — "plain finite number" is strict decimal with an exponent
- `model.ts:301` `PLAIN_NUMBER`.
  - Read as numbers: `"1e2"` → 100, `"+4"` → 4, `"4."` → 4, `".5"` → 0.5.
  - Read as the key's default: `"0x10"`, `"Infinity"`, `"1_000"`, Arabic-Indic digits, `""`, `"  "`.
  - Native YAML `0x10` / `1e2` are numbers already (16 / 100), unchanged from base.
- This does not contradict M2. One thing to know: a quoted exponent can now ask for a huge board (`rounds: "1e6"`), just as native `rounds: 1e6` or `.inf` already could on base (r1 open point (c)). Not a finding for this ticket.

### INFO-3 — `""` / `''` as the whole block body is an error card, not an empty block
- Matches the ruling's definition (EMPTY = parses to null/undefined). `""` parses to the string `""`, so the block shows "Invalid data: the block must be a map of keys." and writes nothing.
- Edge bodies that still draw the default montage, with a first write identical to base (`rounds: 3`): nothing, blank lines, comments only, `null`, `~`, `---`, `--- # x`, `...`, `{}`, `!!map {}`, `collapsed: true`.
- Bodies that are now error cards: `# c` then `5`, `[]`, `- a`, `[1, 2]`, `hello`, `"hello"`, `5`, `true`, `2024-01-01`, `collapsed: true` then `hello` (the collapse-key peel rescues it to `hello`, then the error card).
- base vs head comparison: `probe-model-table-BASE.txt` vs `probe-model-table.txt`, and `probe-dom-table-BASE.txt` vs `probe-dom-table.txt`.

### INFO-4 — Set limits saved untouched re-types both limits
- `success_limit: " 3 "` / `failure_limit: "2"`: the window pre-fills 3 / 2, Save writes `3` / `2`. This is the r1 open point (b) the ledger ACCEPTED. Listed only so the record is complete.

### INFO-5 — rebase surface onto develop `12aaf5b5`
- `git merge-tree afd1436c origin/develop HEAD` shows one textual conflict, `e2e/driver/dse.ts` (the openNote hunk; see INFO-1).
- `e2e/README.md` changed on both sides and merges cleanly (different table rows).
- Develop touches no montage, shared or framework `src/` file, so `model.ts` rebases clean.

## What was probed (all green unless noted above)

**M1 (title).**
- Unit table: `2024`, `true`, `false`, `3.5`, `0`, `-1`, `1e3`, `.inf`, `-.inf`, `.nan`, `2024-01-01`, `0x10`, `"2024"`, `''`, `~`, `12:30`, `null`, `yes`, `on`.
- Each scalar is the model text `String(raw)` and writes back the same value and type (`1e3` → `1000`, `0x10` → `16`, `.inf` → `.inf`; same value, formatting is SC-599's).
- `2024-01-01` is a string in the `yaml` core schema, and real Obsidian agrees: R2P-01 shows the head text `2024-01-01` and `title: 2024-01-01` written back.
- Where the title is read in `src/elements/montage/`: `HeadView.ts:27` (head) and `definition.ts:21` (folded summary). Both receive a string. The aria labels name "Montage Test tracker" (def.name), not the title. Modal titles and the two Notices never name the montage. The error-card prefix is def.name.
- jsdom: head text is right for all 8 titles, no error card.

**M2 (number keys).**
- 6 keys × 25 values (`probe-model-table.txt`), including all values the brief listed. Read is always a number. A changing write (Add a round / End round / quick success or failure / Set limits) gives `read ± 1` as a plain number, never concatenated. An untouched write (Add a hero) deep-equals the raw typed value, including `true`, `[1]`, `{a: 1}`.
- `null` is written as the default number, as ACCEPTED.
- Limits window pre-fill reads the number.

**M3 (integrity).**
- Model level: 13 write paths on a block with every key typed (`title: 2024`, `description: true`, quoted / banana / list numbers, `table_notes`). Untouched keys are byte-equal in every path except LOW-1.
- jsdom: 16 real-click UI paths (quick success / failure / assist, Log sheet submit, edit cell, remove, Undo, Back, End round, Add a round, Add a hero modal, Set limits, Reset, strip and guide toggles). Strip and guide do not write.
- Real Obsidian:
  - R2P-05: two typed blocks in one note (`title: 2024` + `rounds: "3"`, and `title: "2024"` + `current_round: "1"`), a write in each. The other block, ABOVE / BETWEEN / BELOW are byte-identical.
  - R2P-06: an outside edit (`rounds: "3"` → `"5"`, `title: 2024` → `2025`, `failure_limit: banana` → `apple`) made while the block is drawn, then a quick success. The note keeps `"5"`, `2025`, `apple`, and the board shows 5 columns. No stale typed value is written.
  - R2P-07 (Live Preview): End round, then a quick failure, then Add a hero modal. Every untouched typed key survives; `current_round: 2`, `failures: 1`.
- Own keys after parse of a typed block: exactly the schema keys + `table_notes`. Entry own keys are `hero, round, result, skill`. SC-625 holds.
- SC-482 (default keys left out of the write when the source never had them): `title: true` + Add a round writes `title: true\nrounds: 3`.
- SC-482 + SC-625: `zeta: 1 / title: 3.5 / current_round: "1" / alpha: [x]` + End round writes `title: 3.5, current_round: 2, zeta, alpha` with no defaults.

**M4 + r1b (error cards).**
- jsdom: map / list / `[]` / `{}` titles, map / list descriptions, and 9 non-map bodies all give a plain card ("Invalid data: 'title' must be text.", "… 'description' …", "… the block must be a map of keys."), stage `render`, 0 controls, 0 writes after clicking every node, 0 Notices, no raw JS text.
- Real Obsidian: Reading view (W08, W10, and my R2P-04: description map and list body). Live Preview (R2P-02 map title, R2P-03 `hello`, R2P-04 list body). Each card has 0 controls and the note is byte-identical after a click.
- Body `prefs:` then `- a` is a YAML parse error card, unchanged from base.
- `description: 5` / `true` / `3.5` / `0` show the text and write back as typed. `"5"` stays quoted. `''` / `~` are dropped as before.

**Markers.**
- W01 / W02 are plain `it(...)` with their assertions unchanged.
- W03 is untouched (no diff line).
- No `knownBug('SC-628'`, and no bracketed ticket id in any SC-628 test title.
- Each `MONT-W0x` id is defined once (`command grep -a -rn`).
- Header comment rewritten; README rows added.

**CHANGELOG.** One bullet under `## Unreleased` (`581f1675` + `f86fc621`, on origin/main `51b3b6e5`). It is user-facing and accurate, except one sentence that LOW-1 makes slightly too strong (`CHANGELOG.md:16`).

**r1 follow-ups (item 9), confirmed independently** through the real pipeline, then Add a round (`probe-followups.txt`):
- Entry `round: "2"`, `hero: 5`, `result: 5`, `result: {a: 1}`, and `entries:` as a map: the entry (or the whole `entries` value) is DROPPED from the note. `successes: 1` stays, so the tally no longer matches.
- Entry `skill: 5` / `note: 7`: those two keys are dropped. Both are SC-655's, out of scope.
- Hero `name: 5`, `skills_used: 5`, `participants:` as a map, `_dse_anchor: 5` all survive as typed.
- No raw JS text and no error card in any of the 10 cases. r1's claims hold exactly.

## Evidence (dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc628-r2-rev/`)
- Gates: `gate-tsc.log`, `gate-tsc-e2e.log`, `gate-lint.log`, `gate-jest.log`, `lc-part1r.log` (part 1; `lc-part1.log` is the attempt my `timeout` killed), `lc-part2.log` .. `lc-part7.log`, `gate-e2e-r2.log`, `build-both.log` (styles.css sha, worktree vs clean `afd1436c`).
- Probes (in the scratch worktree `probe/`, detached at `ff266522`, untracked files only): `probe/test/unit/model/r2-probe-model.test.ts`, `probe/test/dom/elements/r2-probe-dom.test.ts`, `probe/test/dom/elements/r2-probe-followups.test.ts`, `probe/e2e/specs/montage/r2-probe.e2e.ts`, fixtures `probe/e2e/vaults/shipped/Montage/r2-*.md`.
- Probe outputs:
  - `probe-model-table.txt` / `probe-model.log`: 2 of my own expectations failed. The SC-482 test expected no `skills_used: []` (my mistake). The M3 correction row is LOW-1.
  - `probe-dom-table.txt` / `probe-dom.log`, `probe-followups.txt` / `probe-followups.log`, `probe-e2e-1.log` (R2P-01..08: 8/8 ok).
- Tests going red with `model.ts` at `afd1436c`: `revert-sc628-tests.log` (174 failed / 86 passed of 260), `probe-e2e-revert.log` (W01, W02, W04..W10 all FAIL), `probe-model-table-BASE.txt`, `probe-dom-table-BASE.txt`.
- openNote scan: `negonly.py` → `negonly.txt`, `nocontrol.py` → `nocontrol.txt`. Rebase surface: `merge-tree.txt`.
- Note: the scratch worktree is registered in the dse repo's `git worktree list` (`…/sc628-r2-rev/probe`). It is metadata only, and I did not remove it (no rm). `git -C <dse> worktree remove --force <that path>` drops it when wanted.

---

# r4 — scoped re-review of the r3 delta (dse `10c271fe` on develop `12aaf5b5`; superproject `afe583b0` on origin/main `ea6b4582`)

**Executive summary**
- Verdict: **LAND-READY**. No new findings (HIGH 0, MEDIUM 0, LOW 0, INFO 0). LOW-1 is fixed, and the INFO-1 opt-in is in place and shown not to be vacuous.
- The rebase is faithful. `range-diff afd1436c..ff266522 12aaf5b5..10c271fe` shows commits 1, 3, 4 and 5 identical (`=`). Commit 2 (`!`) changed in exactly two ways: the message no longer has "; openNote accepts an error card as drawn", and the `e2e/driver/dse.ts` hunk is gone. Two commits are new: `58da5e0c` (LOW-1) and `10c271fe` (`{ errorCard: true }` on W08 and W10 only). `git diff 12aaf5b5..10c271fe -- e2e/driver/` is empty, and W01 calls `openNote` without the option. Nothing else changed.
- LOW-1: 16 correction probes all give the right result (below). On the mutant that removes the skip, 6 of the 9 new tests go red (the other 3 are guards for corrections that move a tally) and 7 of my 16 probes go red.
- Error-card opt-in: on the mutant where `title: 2024` throws, MONT-W01, W04 and W07 all FAIL with "timed out waiting for … to render its blocks". The positive tests are not vacuous.
- Measured on `10c271fe`:
  - jest, montage suites (`test/(unit/.*|dom/elements/)montage`): 7 suites, **822 passed**, rc=0.
  - e2e `--element=montage`: `OBSIDIAN-E2E done: 101/102 ok, 0 failed, 1 known-bug, coverage: 62/416 pairs (partial run)`, rc=0. W01, W02 and W04..W10 are ok; W03 is known-bug SC-629.
  - Lifecycle and full e2e not re-run: the range-diff shows no change outside montage `src/`, montage tests and e2e-montage.
- Superproject: `origin/main..HEAD` is exactly `cb58849f` (CHANGELOG) and `afe583b0` (pointer bump). The gitlink is `160000 commit 10c271fe…`. No attribution trailers. The CHANGELOG has one bullet, now says "The same goes for `description:`", and is accurate after LOW-1.

**LOW-1 probe** (`probe/test/unit/model/r4-probe-correct.test.ts`, table `r4-correct-table.txt`). Block: `successes: "1"`, `failures: "2"`, `success_limit: "5"`. Every row also keeps `success_limit: "5"`.

| Correction | Written |
|---|---|
| skill only / note only / round only / hero only, on a success entry; skill only on a failure entry | `"1"` / `"2"` (both kept as typed) |
| success → failure | `successes: 0`, `failures: 3` |
| failure → success | `2` / `1` |
| success → assist | `0` / `"2"` |
| success → unknown result "dodged" | `0` / `"2"` |
| assist → success | `2` / `"2"` |
| assist → failure | `"1"` / `3` |
| assist, note only | `"1"` / `"2"` |
| hand-edited `successes: 0` over a success entry, note only | stays `0` |
| hand-edited `successes: 0` over a success entry, → failure | `0` / `1` |
| `successes: banana`, skill only | stays `banana` |
| native `successes: 1`, note only | stays `1` |

- The "stays 0" row matches M3: the tally is not touched. It also removes the old clamp side effect, where -1 clamped at 0 and the +1 then raised the tally to 1.
- jsdom through the real sheet: re-running my r2 UI probe (`r4-probe-dom-table.txt`), "edit filled cell: change skill only" no longer changes `successes`. All 45 probes pass.

**Re-run of the r2 probes on `10c271fe`.** The probe e2e calls that expect a card now pass `{ errorCard: true }`. R2P-01..08 give `8/8 ok`: date title, Live Preview error cards, desc-map / list-body cards, two typed blocks, outside edit, Live Preview typed writes, empty block.

**Working trees after r4:**
- plugin worktree: clean.
- superproject: clean.
- scratch `probe` worktree: moved to detached `10c271fe`. It holds only my untracked probe files, and `model.ts` was restored after each mutant (`git status` shows no tracked change). It is still registered in the dse repo's `git worktree list`; the owner removes it.

**r4 evidence** (dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc628-r2-rev/`):
- rebase check: `r4-range-diff.txt`
- LOW-1: `r4-correct.log`, `r4-correct-table.txt`; mutant runs `r4-mutant-lowfix.log` (6 failed / 3 passed of the 9 new), `r4-correct-MUTANT.log`, `r4-correct-table-MUTANT.txt`
- error-card mutant: `r4-mutant-w01.log`
- gates: `r4-jest-montage2.log` (`r4-jest-montage.log` is my own failed first try: wrong jest flag, not a test result), `r4-e2e-montage.log`
- r2 probe re-runs: `r4-probe-dom.log`, `r4-probe-dom-table.txt`, `r4-probe-e2e.log`
