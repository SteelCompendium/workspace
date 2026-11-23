# SC-679 r2 reviewer report

## Executive summary

- VERDICT: **APPROVE-WITH-FIXES**. R1, R2 and R3 are all met in real Obsidian 1.14.4 (42 probes plus 13 e2e, each compared against the unfixed SC-443 tip). There are no correctness blockers.
- Counts: CRITICAL 0 / HIGH 0 / MEDIUM 1 / LOW 4 / INFO 8.
- MEDIUM-1: `this.close()` is what makes the fix work. The `accepted` memory does nothing a user can see. With the memory check disabled, all 13 SC-679 e2e tests stay green and 156 of 159 probe readings match the head. Of the 3 that differ, 1 is a wrong result from the memory itself (LOW-1) and 2 come from an artificial direct call (RTWO-27). The code comment at `schemaSuggest.ts:46-49` and the r1 reason for the memory are false once `close()` is in. Fix: drop the memory, or tie it to the editor and correct the comment.
- Gate `tsc` / `lint`: clean / clean.
- Gate `jest`: `Tests: 2 skipped, 13711 passed, 13713 total`, 299 suites passed (no shots cache).
- Gate, scratch `--element=authoring`: `OBSIDIAN-E2E done: 77/79 ok, 0 failed, 2 known-bug, coverage: 46/464 pairs (partial run: gate skipped)`. That is run 2. Run 1 read 76/79 because AUTH-C09 (compendium snapshot modifier-click) flaked; C09 passed alone, and run 2 was clean.
- Gate, land full e2e: `OBSIDIAN-E2E done: 657/667 ok, 1 failed, 9 known-bug, coverage: 418/418 pairs`. The 1 failure is INIT-W10, a listed load flake; it re-ran alone as `1/1 ok`. That makes 658/667.
- Lifecycle: none re-run. No lifecycle scenario drives the in-block suggester (G-S97 is the compendium SuggestModal). I checked the r1 logs: 7 parts, each printing only its own ids; union 63/64, with G-S61 also red alone on `129beb18` (SC-668).
- `styles.css` sha256 `18730938…f1f9` is the same on base `129beb18` and head `c1181989` (I built both myself), so shots 592, freeze 280/280 and parity 0/0/24 carry over.
- Is any list on screen after any accept? **No.** Across key and value lists, click and Enter, nothing typed and a typed prefix, ds-stam, ds-skills and ds-roll, Live Preview and Source: there is no `.suggestion-container` in the DOM at t0 or at t+400 ms, and no reopened one-row list. Tab never accepts in Obsidian.

## Findings

### MEDIUM-1: the `accepted` memory is not needed in real Obsidian, and its stated reason is false

`src/authoring/schemaSuggest.ts:46-50` (comment and field), `:73-77` (the check in `onTrigger`), `:142` (where the accept records it).

- **What I measured.** I disabled only the check in a real Obsidian build (mutant `nocheck`: the `return null` became a no-op; `setCursor` and `close()` kept).
  - All 13 SC-679 e2e tests passed (G10, G13..G18, K09..K14), and so did my burst probes RTWO-32 / RTWO-G11 (`r2-e2e-mutant-nocheck.log`: `15/15 ok`).
  - The full r2 probe set gave 156 of 159 readings identical to the head (`r2-probe-head-vs-nocheck.txt`). Two of the three differences are RTWO-27 (an artificial direct `selectSuggestion` call, not something a user can do). The third is RTWO-23, where `nocheck` is correct and the head is wrong (LOW-1).
- **Why the memory adds nothing.** Obsidian 1.14.4 does call `onTrigger` again after the accept (my trigger log shows `1:11->None` on every accept). It also calls it on arrow keys, clicks, focus, undo and redo. But it opens a list that is closed only on typed input. Once `close()` has run, the re-trigger at the accept spot cannot open anything, so the memory has nothing left to suppress.
  - Seen directly in the trigger logs: after redo, `onTrigger` returned the `recoveries` context and no list opened (RTWO-16). The same holds after an outside edit (RTWO-24 / RTWO-26) and on ArrowLeft / ArrowRight (RTWO-26).
- **Where the r1 reasoning went wrong.** The implementer's `measure1` tested `setCursor` WITHOUT `close()`, `measure2` the flag without `close()`, and `measure3` flag plus `close()`. `close()` without the flag was never measured. So the comment at `:46-49` ("without this a one-row list repeating the word would open over it and swallow the next Enter") is not true of the shipped code, and the ledger's R2 mechanism note repeats that claim.
- **Failure scenario.** The visible damage is LOW-1. The cost here is a piece of unneeded shared state with a misleading "funky logic" comment that future readers will trust.
- **Prescribed fix (owner's call, either one).**
  - (a) Preferred: delete the `accepted` field, the `onTrigger` check and the line that records it. The fix becomes `replaceRange` + `setCursor` + `close()`. Rewrite jest tests 4, 5, 6 and 9 of the SC-679 describe block to assert the cursor and `close()` rather than `onTrigger === null`. Correct the ledger's R2 mechanism line.
  - (b) Keep it as defence for other Obsidian versions, but store and compare the editor too (`{ editor, line, ch, text }`, `editor === done.editor`). Reword the comment to "defensive; not observed to be needed on 1.14.4 once `close()` runs". Add the jest cases from LOW-3.

### LOW-1: the memory is shared across editors and can hide a list that should show

`schemaSuggest.ts:73-75`. A single `DsSchemaSuggest` instance serves every editor, and the memory holds no editor or file.

- **Scenario (RTWO-23, measured).**
  1. In note A (ds-stam), type `rec`, press Enter. A reads `recoveries`, memory `{1, 10, 'recoveries'}`.
  2. Open note B (`recoverie` on line 1) with the cursor placed at 1:9 by script (`openEditor`), then type `s`.
  3. Head: NO list. Memory is still `1:10` and `onTrigger` returns `null`. Base and the `nocheck` mutant: `[recoveries, recoveries_max]`.
  4. The user loses the `recoveries_max` suggestion for that keystroke; their next key brings the list back. No text is written wrongly.
- **Reach.** Ctrl+Tab, a click or the editor taking focus calls `onTrigger` and clears the memory (RTWO-30: a Ctrl+Tab return to B listed both rows correctly). So this only shows when the cursor lands without Obsidian calling `onTrigger`: a command or another plugin opening a note and setting the cursor.
- **Fix:** MEDIUM-1 (a) removes it; (b) fixes it with the editor identity check.

### LOW-2: no e2e test (patch) presses Enter right after the accept; `close()` is pinned only by a jest spy

`sc679-on-sc443.patch`, AUTH-G13..G18 and K09..K14. Each waits `waitNoList()` (3 quiet reads 80 ms apart) before the next Enter.

- **Scenario (mutant `noclose`, real Obsidian).** All 13 tests pass with `this.close()` removed (`r2-e2e-mutant-noclose.log`: 15/15 ok). Yet a user who presses Enter right after the accept gets a doubled word:
  - click `height` then Enter at once: `heightheight`;
  - click `opposed` then Enter: `mode: opposedopposed`;
  - `rec` + Enter + Enter in one burst: `recoveriesoveries`.
- **Why the tests miss it.** The stale rows stay up for about 100 ms, until Obsidian's next editor update, and the `waitNoList` wait hides that window.
- **Current protection:** only `expect(close).toHaveBeenCalledTimes(1)` at `test/dom/authoring/schemaSuggest.test.ts:361`.
- **Fix:** add to the patch one e2e test that sends the accept and the next Enter with no wait between them: a click followed directly by `browser.keys('Enter')`, and `browser.keys(['Enter', 'Enter'])` on an open list. Assert the note text. My RTWO-32 / RTWO-G11 are the template. If MEDIUM-1 (a) lands, this becomes the only real-Obsidian pin of the fix's second half.

### LOW-3: jest leaves the memory's own comparisons unpinned

`test/dom/authoring/schemaSuggest.test.ts:381`, the test "the accept only silences its own spot: another cursor, or the accepted line edited, lists again". Its title promises an edited-line case that it does not contain.

- **Measured:** mutant `notext` (drop `&& editor.getLine(...) === done.text`) passes all 130 tests in schemaSuggest, matrix and knownBugs. So does mutant `noch` (drop `cursor.ch === done.ch`) (`r2-jest-mutants.log`).
- **Scenario these would hide (if the memory is kept):**
  - Under `noch`, an accept would silence every other spot on the same line while its text stays unchanged.
  - Under `notext`, an outside rewrite of the line that keeps the cursor would stay silenced.
- **Fix (only if MEDIUM-1 (b)):** add "same line, other ch: lists again" and "same spot, line text changed by an outside replaceRange: lists again" (that is, run the trigger after `editor.replaceRange` on the accepted line without moving the cursor).

### LOW-4: fixed sleeps in two new e2e tests (patch)

- `e2e/specs/authoring/gate-on.e2e.ts:147` (AUTH-G17): `browser.pause(300)` after Tab, before asserting "unchanged".
- `e2e/specs/authoring/schema-suggest.e2e.ts:183` (AUTH-K13): `browser.pause(300)` after Ctrl+Z.

Both are waits for a negative or settled state. On a loaded host 300 ms can be too short, giving a false green for "nothing happened". Fix: use a bounded poll.
- G17: poll that the list still has 4 rows and the value is unchanged for N consecutive reads (the `waitNoList` quiet-count pattern).
- K13: `waitFor(editor.getValue() === STAM)` and then `waitNoList()`.

### INFO

1. **P13, a key or value typed in full by hand, then Enter (for SC-681).**
   - Base (SC-443 tip, unfixed): Enter is swallowed **every time**. Three Enters in a row each re-accept the same word, the one-row list stays and no new line appears, until Escape. Measured for `collapsible` (RTWO-07), `recoveries` (RTWO-08) and `mode: opposed` (RTWO-G09).
   - Head: swallowed **once**. The first Enter re-accepts (a write that changes nothing) and closes the list; the second Enter is a new line.
   - So the head improved it, through `close()` (the `nocheck` mutant behaves the same). Not worse.
2. **P14, AUTH-G17's "Tab does not accept a row".** Tab with the list open does nothing at all, on base and head alike: no accept, no indent, the list stays (RTWO-03, RTWO-G04). Pinning it is sound as a canary for Obsidian's own behaviour on the pinned 1.14.4. It guards the docs and changelog wording ("Enter or a click"), and an Obsidian that binds Tab would turn it red exactly when the docs must change. It is brittle only in that it tests Obsidian, not DSE, and in its sleep (LOW-4). A one-line comment marking it as a host-behaviour canary would help.
   - Consequence for the ruling: the "Tab" clause of R1 is vacuous, because there is no Tab accept path.
3. **Multiple cursors (RTWO-17).** `setCursor` collapses a second cursor. Two cursors, `c` + Backspace (the list opens at the main cursor), click `collapsible`: only line 1 gets the key (base too) and one cursor remains (base kept both). Then Enter gives a new line under it. Acceptable, and the same as the `/ds` suggester's `setCursor`. No fix needed.
4. **A selection while the list is open.** Shift+ArrowLeft, or a selection set by script, closes the list on base and head (RTWO-18), so an accept with a non-empty selection cannot happen.
   - Callout `> ```ds-stam` and list-item blocks: the list never triggers there, on either build (RTWO-20).
5. **CRLF (RTWO-15).** Obsidian rewrites the note to LF on its first save, identically on base and head. That is host behaviour. The accept itself writes only the key.
6. **The `/ds` suggester is unaffected by this diff (base = head), but it has the same class of bug.** `/dsstam` + Enter leaves the `Stamina bar ds-stam` row on screen and swallows the next Enter (no new line, no second insert) until Escape (RTWO-28 / RTWO-29, identical on base). A click on the row closes it (AUTH-S03).
   - `src/authoring/suggest.ts:60-66` has no `close()`. The ledger's "the /ds suggester already sets the cursor; the schema suggester is the outlier" holds for the cursor but not for closing the list.
   - Out of scope; see Follow-ups.
7. **Flakes this round.** AUTH-C09 in scratch authoring run 1 (passed alone and in run 2). INIT-W10 in the land full run (listed flake; passed alone).
8. **Other checks that passed.**
   - Nothing from SC-443 is on the land branch: no `e2e/`, no `_cmEditor`, no `stampControl` in `src/authoring`.
   - The land diff applies to SC-443 `ae9025ea` with **no conflict**, only line offsets (`git apply --check`).
   - `sc679-on-sc443.patch` applies on SC-443 + the land diff (checked against a temporary index).
   - The land fix equals the scratch tree's cherry-picks for `src` and `test`.
   - No AI attribution in the 4 plugin commits or the superproject `ffa0feb9`.
   - Both CHANGELOG bullets and `docs/writing-blocks.md` are true as measured, including "This hit the shipped Stamina bar and Skills blocks too" (RTWO-01 / RTWO-04 base: `collapsiblecollapsible`).
   - No console error, page error or unhandled rejection in any probe (a hook captured them for the whole run).
   - The `.suggestion-container` is removed from the DOM on close; none was ever hidden but present.

## Probe table (real Obsidian 1.14.4; head = SC-443 tip + fix `0e75ad21`, base = SC-443 tip `ae9025ea`)

| Probe | Measured (head; base where it differs) |
|---|---|
| 1 ticket repro (RTWO-G01) | `mode: ` → click `opposed`: cursor 1:13, no list; Enter: `mode: opposed\n\n` cursor 2:0. Base: cursor 1:6, 4 rows stay; Enter: `mode: power-rollopposed` |
| 1 step 4 (G02) | Escape then Enter: `mode: opposed` whole, new line. Base: `mode: ` + new line `opposed` (the value split off) |
| 2 ds-stam click / Enter / Tab (RTWO-01..03) | click or Enter: cursor 1:11, no list; Enter gives a new line. Tab: nothing (list stays, text unchanged). Base: `collapsiblecollapsible` |
| 2 ds-skills click / Enter (RTWO-04) | same: cursor 1:11, no list, Enter gives a new line. Base: `collapsiblecollapsible` |
| 3 list after accept, all combinations (RTWO-01..06, 09, 10, 13, 14, 19, 22, G01..G08, G11, 32) | DOM `.suggestion-container` count 0 at t0 and t+400 ms on head every time. Base: the stale full list (nothing typed) or a one-row list (typed prefix) every time |
| 3 burst: accept and Enter with no wait (RTWO-32, G11) | head: `recoveries\n`, `height\n`, `mode: opposed\n`, `mode: power-roll\n`. Base: `recoveriesoveries`, `heightheight`, `mode: opposedopposed`, `mode: power-rollpower-roll` |
| 4 R3: `style` pick then `: ` (RTWO-06) | `[default, sheet]`; a second accept (`sheet`, Enter) works; Enter gives a new line. Base: the key was inserted after the cursor, `: style` |
| 4 prefix pair (RTWO-09) | `rec`+Enter → no list; `_` → `[recoveries_max]`; Backspace → `[recoveries, recoveries_max]` (same as base) |
| 4 case (RTWO-10, G06) | `CUR` → `[current_stamina]`, Enter → `current_stamina` cursor 15, no list; `MODE: ` → no list (base same); `mode: Opp` → `[opposed]` → `mode: opposed` cursor 13 |
| 4 Backspace after accept (RTWO-11) | `collapsibl` → `[collapsible]`; Enter re-completes and closes; next Enter gives a new line. Sane |
| 5 everyday typing, no accept (RTWO-12, G10) | rows after each of 66 keystrokes identical head and base, except right after an Enter that accepted a row (head: no list; base: stale row) |
| 6 integrity, 2 blocks + prose (RTWO-13) | file after pick = expected splice; after Enter a new line only; block 2 (same language) accept independent; text above, between and below byte-identical |
| 6 last line of file (RTWO-14) | unclosed fence `` ```ds-stam\n `` → `collapsible\n`; no trailing EOL → `collapsible\n\n```` |
| 6 CRLF (RTWO-15) | key written; Obsidian rewrites to LF on save (base same) |
| 6 tail `mode: \|tail` (G07) | `mode: opposedtail` cursor 13, Enter → `mode: opposed` / `tail`. Base: `mode: power-rollopposedtail` |
| 6 undo / redo (RTWO-16, K13) | Ctrl+Z: line empty, no list; redo: `recoveries`, no list; Enter gives a new line |
| 7 multi-cursor / selection / Source / callout (RTWO-17..20) | see INFO 3 and 4; Source mode behaves like Live Preview |
| 8 SC-678 `max\|_stamina` (RTWO-21) | `max_stamina_stamina` cursor 11 on both; head: no list, Enter splits at the cursor; base: `[max_stamina]` stays. Not worse |
| 8 present key offered again / no `: ` (RTWO-22) | `current_stamina` offered again on both; no `: ` added on both. Unchanged |
| 9 `/ds` (RTWO-28, 29) | unchanged vs base; pre-existing stale row after an Enter accept (INFO 6) |
| 10 stale memory across notes (RTWO-23) | **withheld wrongly** on head (LOW-1); base and `nocheck` list both rows |
| 10 tab switch (RTWO-30) / second pane (RTWO-25) | focus or arrow triggers clear the memory; lists correct |
| 10 outside edit, same line (RTWO-24, 26e) | memory cleared; typing lists normally; Enter gives a new line |
| 11 arrow away and back / click away and back (RTWO-26) | no list either way (Obsidian does not open on cursor moves); Enter gives a new line |
| 11 `x` + Backspace (RTWO-26) | `[recoveries, recoveries_max]` returns; Enter accepts (one swallowed Enter, SC-681 class) |
| 11 outside edit, other line (RTWO-26d) | memory kept, no list, Enter gives a new line |
| 12 errors / context (RTWO-27, all) | 0 console or page errors; `close()` clears `context`; second accepts work (RTWO-06, RTWO-13, G08) |
| 13 typed in full + Enter | base: swallowed every time; head: once (INFO 1) |
| 14 Tab pin | see INFO 2 |

**jest (`r2-jest-mutants.log`, schemaSuggest + matrix + knownBugs, 130 tests).**
- Pristine: 130 pass.
- With the `ae9025ea` (unfixed) `schemaSuggest.ts`: 5 fail, which are the flipped jsdom marker plus new tests 1, 2, 4 and 5, each for the reason it claims (cursor `ch 0`; `close` not called; list offered).
- `noclose`: 1 fails. `nocheck`: 2 fail. `noclear`: 2 fail. `nosetcursor`: 4 fail. `notext` and `noch`: 0 fail (LOW-3).
- New tests 3, 6, 7, 8 and 9 pass with the fix reverted (by design for 3, 7 and 8).
- The `CmDoc` test editor maps an empty-range insert the way real CM6 does: the cursor stays in front, which matches real Obsidian on base (cursor 1:0 in RTWO-01).

**e2e on the unfixed tip (`r2-base-e2e-neg.log`).** G10, G13..G18 and K09..K14 all fail: `0/13 ok, 13 failed`. Ids are unique (the runner checks).

## Follow-ups

- **`/ds` suggester: an Enter accept leaves the row on screen and swallows the next Enter** (`src/authoring/suggest.ts:60-66` has no `close()`). Same class as SC-679, on the shipped `/ds` path, identical on base. It needs its own ticket and an e2e like RTWO-29.
- **SC-681 (already filed):** add the INFO 1 measurement. Base swallows Enter every time; the head swallows it once.
