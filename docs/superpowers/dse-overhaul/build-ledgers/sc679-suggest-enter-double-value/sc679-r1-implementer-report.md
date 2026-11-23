# SC-679 r1 implementer report

## Executive summary

- STATUS: DONE (all gates green except G-S61, red on the unchanged base too: SC-668).
- Land branch `sc679-suggest-enter-double-value`: plugin head `c1181989b7eb8711d8a15e6065ee56cfcae8c35b`, superproject head `ffa0feb9055d3670377885d8536d6191961f7727` (pointer bump NOT staged). Base `129beb18` unchanged (fetch confirmed).
- R2 mechanism: `selectSuggestion` sets the cursor after the value, remembers `{line, ch, line text}`, and calls `this.close()`; `onTrigger` returns null at exactly that cursor with that line text, the first onTrigger anywhere else drops the memory. (NOT the "exact match gives no rows" rule: it fails R2 for `recoveries` / `recoveries_max`.)
- Gates: tsc clean; lint clean; jest `Tests: 2 skipped, 13711 passed, 13713 total` (base 13702 + 9 new), 299 suites passed; lifecycle union 63/64 (G-S61 fails: red on a clean `129beb18` build too); e2e `OBSIDIAN-E2E done: 658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs`.
- shots / freeze / parity not run: built `styles.css` sha256 identical on base and fix (`18730938...f1f9`), diff touches no CSS, view or fixture.
- Scratch tree (SC-443 `ae9025ea` + fix) authoring e2e: `OBSIDIAN-E2E done: 77/79 ok, 0 failed, 2 known-bug, coverage: 46/464 pairs (partial run: gate skipped)` (SC-443's own subset had 5 known-bug; the 2 left are SC-675). Scratch jest `test/dom/authoring`: 672 passed / 19 suites. Scratch tsc (incl. e2e project) and lint clean.

## What Obsidian really does after an accept (Obsidian 1.14.4, real e2e, measured)

Probe spec (scratch, deleted) logged rows / cursor at t+0, +100, +300, +800 ms. Logs: `measure1-setcursor-only.txt`, `measure2-flag.txt`, `measure3-close.txt`.

- Fix 1 only (`setCursor`, no suppression): `onTrigger` DOES re-fire on the cursor move. After every accept (empty-range click on a `mode: ` value, typed `mode: op` + Enter, `cur` + Enter on ds-stam, empty-line key pick) a ONE-ROW list repeating the accepted word is on screen from t+100 ms on. Enter then re-accepts it (a no-op write) and swallows the keypress: note unchanged, no new line (`A1 after Enter: "```ds-roll\nmode: opposed\n```\n" cursor {ch:13,line:1}`). So R2 fails with the cursor fix alone. Without any fix the old full list stays at t+0 (stale rows) too.
- Fix 1 + suppression flag: t+100 ms and later no list; Enter gives a new line (`"```ds-roll\nmode: opposed\n\n```\n"` cursor line 2 ch 0). But at t+0 (immediately after the click / key, before Obsidian's next editor update) the OLD rows were still on screen: Obsidian does not close the popup itself on accept.
- Fix 1 + flag + `this.close()` in `selectSuggestion`: rows are `[]` at t+0 and stay `[]`. (This is what shipped.)
- R3 measured with the final fix: `rec` -> accept `recoveries` -> no list; `_` -> list `[recoveries_max]`; Backspace -> `[recoveries, recoveries_max]`; `sty` -> accept `style` -> no list; `: ` -> value list `[default, sheet]`; typed-full `collapsible` (not accepted) still shows `[collapsible]`.
- Why not "only match equals the query -> no rows" (the brief's preferred remedy): it leaves R2 broken for a key that is a prefix of another. Real pair: ds-stam `recoveries` / `recoveries_max` (accept `recoveries`, the re-trigger lists both, Enter would be swallowed again). The flag mechanism covers it and leaves typed behaviour untouched (a fully typed key still lists itself).

## Files changed (land branch)

Plugin clone `/home/scott/code/steelCompendium/worktrees/sc679-suggest-enter-double-value/draw-steel-elements`:

- `src/authoring/schemaSuggest.ts` (+21/-1): `accepted` field, check at the top of `onTrigger`, `selectSuggestion` rewritten (replaceRange, setCursor after the value, remember, close).
- `test/dom/authoring/schemaSuggest.test.ts` (+144): new describe "SC-679" with a small `CmDoc` over a real `@codemirror/state` `EditorState` (cursor maps through writes like the real editor; own code, not a copy of SC-443's `CmEditor`).
- `test/mocks/obsidian-core.ts` (+2): `EditorSuggest.close()` no-op on the mock (the product now calls it; tests `jest.spyOn` it).
- `docs/writing-blocks.md` (+3): the "Autocomplete inside a block" section now says the cursor lands after the pick and the list closes.
- `CHANGELOG.md` (plugin; it takes entries under `## 7.0.0 (unreleased…)`, as SC-569 / SC-614 did): one `[FIX]` bullet (+6).
- Superproject `CHANGELOG.md` (+7 under `## Unreleased`).

Plugin commits (oldest first): `d3ca4e93` fix: cursor after the value; `3ae85ce3` fix: no list stays or reopens (flag + close); `45f546e5` test; `c1181989` docs. Superproject: `ffa0feb9` docs(changelog). No Co-Authored-By / AI attribution. Nothing pushed.

Nothing from SC-443 is on the land branch (no e2e driver, no CmEditor file, no stampControl).

## Tests added (9, all in `test/dom/authoring/schemaSuggest.test.ts`, describe "SC-679 — after an accept the cursor is behind the value and no list is left or reopened")

1. key list, nothing typed: cursor behind the key, line whole
2. value list, nothing typed: cursor behind the value
3. typed prefix accept (key list and value list): replaced, cursor behind
4. list closed by the accept (`close` spy called once), trigger at the new cursor offers nothing (asked twice; key and value lists)
5. prefix-pair `recoveries` / `recoveries_max`: no list after the accept; `_` lists `[recoveries_max]`; Backspace lists both
6. the suppression only covers its own spot: another cursor / returning to the spot / edited line lists again
7. R3: after a key accept, typing `: ` opens the value list `[default, sheet]`
8. unchanged: `c` lists `[collapsible, collapse_default, current_stamina]`; fully typed `recoveries` still lists both; typed `style` lists `[style]`
9. accept with no context does nothing and silences nothing

Fails on base: ran the file with `src/authoring/schemaSuggest.ts` replaced by the `129beb18` version (`jest-suggest-base.log`): `Tests: 4 failed, 40 passed, 44 total`; the four failures are tests 1, 2, 4, 5. Cursor test failure line: `expect(editor.getCursor()).toEqual({ line: 1, ch: 11 })` -> `- "ch": 11 / + "ch": 0` (schemaSuggest.test.ts:334, "key list, nothing typed"). Tests 3, 7, 8 pin behaviour that must stay unchanged (so they pass on base by design); 6 and 9 guard the new mechanism and cannot fail on base.

## Real-Obsidian proof (scratch, never pushed)

Scratch worktree: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5812b474-3aec-46a6-8f06-0ef85cf1e10a/scratchpad/sc679-r1-impl/on-sc443`, branch `sc679-on-sc443` (local only), = SC-443 `ae9025ea` + cherry-picks `3310829c`, `f154e331` (the two fix commits) and `2a344c0c` (the land test commit; needed for the mock `close()`; all picked cleanly, no conflict) + `0e75ad21` (flips + new e2e). Local branch `sc679-sc443-base` = `ae9025ea` (fetched read-only from the SC-443 clone; that clone was never written to).

Patch (the one commit on top of the cherry-picks, `git format-patch` output): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc679-suggest-enter-double-value/sc679-on-sc443.patch` (271 lines). Apply it on a tree that has the fix + the land test commit.

Flips: AUTH-G13, AUTH-G14 (`gate-on.e2e.ts`), AUTH-K09 (`schema-suggest.e2e.ts`) are plain `it`; the jsdom `test.failing` in `authoringKnownBugs.test.ts` is a plain `test`; `knownBug` import dropped from both specs; the AUTH-G10 workaround (`setCursor` to the line end, and its comment naming the bug) removed so G10 now exercises the fix. AUTH-G13 additionally asserts no list.

New e2e (real Obsidian 1.14.4, real keys / pointer clicks):

- AUTH-G15 value list nothing typed, click row, Enter with NO Escape: `mode: opposed` whole, new line, cursor line 2 ch 0, note file same
- AUTH-G16 same by keyboard (two ArrowDown raw keys, Enter on row 3, Enter): same result
- AUTH-G17 Tab does NOT accept a row (list stays, note unchanged); Enter then writes one value, Enter again a new line
- AUTH-G18 typed prefix `mode: op` + Enter: cursor after, no list, next Enter new line
- AUTH-K10 ds-stam (gate off), pick `collapsible` with nothing typed, Enter: key line whole, no doubled key
- AUTH-K11 typed `cur` + Enter: cursor ch 15, no list, next Enter new line
- AUTH-K12 R3: empty-line pick `style` then `: ` opens `[default, sheet]`; `rec` -> `recoveries`, `_` lists `[recoveries_max]`
- AUTH-K13 one Ctrl+Z after an empty-line pick
- AUTH-K14 integrity: prose above, text between, a second `ds-skills` block and text below byte-identical after the pick and after the Enter (note file compared with `spliced`)

Fail without the fix: all 13 of {G10, G13..G18, K09..K14} FAIL on the SC-443 base `schemaSuggest.ts` (`e2e-sub-neg.log`: `0/13 ok, 13 failed`; e.g. G13 cursor `ch 6` vs 13, K09 `ch 0` vs 11, G14 line is `mode: `, G15/16/17/18/K10..K14 "a suggestion list is still open"). With the fix: `13/13 ok` (`e2e-sub-try1.log`, before the G17/K13 wording rewrite; the final authoring subset run covers the final text: 77/79).

Ctrl+Z observation (AUTH-K13, `e2e-sub-try1.notes.txt`): one Ctrl+Z after an empty-line pick restores the whole block to its state before the pick: `"```ds-stam\n\n```\nafter\n"`, cursor line 1 ch 0, no list on screen (the typed `c` and its Backspace cancel out). Note not damaged.

Tab observation: Tab with the value list open does nothing (list stays open, text unchanged, no tab inserted). Only Enter and a click accept. Docs / changelog therefore say "Enter or a click".

## Gate detail (land branch, logs in the scratch folder)

Scratch folder `S` = `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5812b474-3aec-46a6-8f06-0ef85cf1e10a/scratchpad/sc679-r1-impl`.

- `S/land-tsc.log`: clean (rc 0). `S/land-lint.log`: clean (rc 0).
- `S/land-jest.log`: `Test Suites: 1 skipped, 299 passed, 299 of 300 total; Tests: 2 skipped, 13711 passed, 13713 total`, rc 0.
- Lifecycle, seven parts (`S/land-lifecycle-p1..p7.log`): p1 21/21; p2 16/16; p3 9/9; p4 (`G-S57,G-S62,G-S61,G-S56`) 3/4, G-S61 failed; p5 7/7; p6 4/4; p7 3/3. Union 63/64.
  - G-S61 failure is the known torn-read line ("the recorder's disk read was torn in N frames in a row, so its stale-frame check did not run", 0 stale frames), SC-668, documented in the dse-verify skill as red on base. Re-run alone: still red (`S/land-lifecycle-p4rerun.log`, 0/1). Run alone on a clean `129beb18` build in a second scratch worktree (`S/on-base`): red the same way (`S/base-lifecycle-g-s61.log`, `0/1 ok, 1 failed`). Not caused by this change.
- `S/land-e2e.log`: `OBSIDIAN-E2E done: 658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs`, rc 0 (no flake, no re-run needed).
- Built `styles.css` sha256 (identical): fix `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` (`S/land-sums.txt`), base `129beb18` `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` (`S/base-sums.txt`). `main.js` differs, as expected: fix `0d962a45...19b8`, base `e8a07d7f...8af2`. The diff touches `src/authoring/schemaSuggest.ts` plus tests, mock and docs only. Shots 592 / freeze 280/280 / parity 0 / 0 / 24 therefore carry from the base numbers; not run.
- Scratch tree: `S/scratch-tsc.log` (rc 0), `S/scratch-lint.log` (rc 0), `S/scratch-jest-authoring.log` (19 suites, 672 tests passed), `S/e2e-sub-authoring.log` (77/79, 2 known-bug).

## Behaviour changes beyond the ticket (SC-678 family, as asked)

- SC-678 (`max|_stamina` -> `max_stamina_stamina`): unchanged. The range is non-empty, the editor already put the cursor after the inserted text; the new `setCursor` puts it at the same spot. The SC-443 jsdom `test.failing` for SC-678 still passes as failing in the scratch jest run. One side effect: after that mid-word accept the re-trigger at the cursor used to open a one-row list; it is now suppressed (R2).
- "No `: ` after a key accept": unchanged (K12 shows `: ` must still be typed).
- "Already-present keys are offered again": unchanged.
- One more behaviour: a key accepted and then left with the cursor sitting in the same spot, line unchanged, gets no list until the cursor or the line changes (e.g. arrowing away and back never re-lists at that exact spot until some other onTrigger ran in between; Obsidian runs onTrigger on every cursor move, so in practice moving away clears it).

## Drive-by fixes

none

## Follow-ups

- G-S61 (`SC-668`) is red on a clean `129beb18`; the dse-verify CURRENT block says 64/64 at that sha, but it is 63/64 here at load 2-4 (same as SC-656 / SC-652 owners saw). Skill text for the CURRENT line may want the 63/64 note.
- Typing a complete key (not accepting) still opens a one-row list repeating it, and Enter then re-accepts it and is swallowed (typed `collapsible` -> `[collapsible]`, measured B3). Same shape as the bug but through typing, not an accept; R2 only covers accepts, so left alone.
- AUTH-G17 pins "Tab does not accept a row". Fine today; if Scott later wants Tab to accept, that test changes.
- The e2e manifest has no `press:ArrowDown` pair for `authoring.schema.value`, so AUTH-G16 uses raw `browser.keys` for the ArrowDowns (no coverage credit); add the pair if wanted.

## Artifacts

- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc679-suggest-enter-double-value/sc679-r1-implementer-report.md`
- Patch: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc679-suggest-enter-double-value/sc679-on-sc443.patch`
- Land worktree: `/home/scott/code/steelCompendium/worktrees/sc679-suggest-enter-double-value` (plugin clone `.../draw-steel-elements`)
- Scratch SC-443 tree: `S/on-sc443` (branch `sc679-on-sc443`); base scratch tree `S/on-base` (detached `129beb18`, used for the G-S61 / styles.css comparison)
- Logs: all under `S` as named above; measurement logs `measure1-setcursor-only.txt`, `measure2-flag.txt`, `measure3-close.txt`, `e2e-measure{1,2,3}.log`; `jest-suggest-fixed.log`, `jest-suggest-base.log`; `e2e-sub-neg.log`, `e2e-sub-try1.log`, `e2e-sub-try1.notes.txt`, `e2e-sub-authoring.log`.
