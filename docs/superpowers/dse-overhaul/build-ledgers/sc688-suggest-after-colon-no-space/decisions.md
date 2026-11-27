# SC-688 decisions ledger

Ticket: SC-688 "DSE: accepting a value suggestion right after `key:` with no space writes `key:value`, which the block cannot read". Project DSE 7.0.0.
Worktree: /home/scott/code/steelCompendium/worktrees/sc688-suggest-after-colon-no-space (every submodule on branch `sc688-suggest-after-colon-no-space`). dse base: develop @ 23f3e61b.
Owner: ticket-owner on Opus 5.5 (Scott, this session: owners run on Opus 5.5, not Fable).

## Scott rulings (verbatim, dated)

- 2026-11-26 (relayed by the dispatcher): "work through the DSE 7.0.0 tickets, two at a time"; ticket owners run on Opus 5.5 instead of Fable.
- No Scott comment on SC-688 itself as of 2026-11-26.

## Ticket text (the spec; verbatim from the description)

- "Expected: the accepted line reads `mode: power-roll`, or the value list does not open until a space is typed."
- "The same value list has the mid-word defect of SC-678: with the cursor inside a value (`mode: te|st`), accepting `test` writes `mode: testst`."

## Owner rulings (2026-11-26)

1. **Fix option: write the space.** Accepting a value whose replaced range starts right after the `:` (no whitespace between) writes `: <value>`-style, i.e. a single space then the value: `mode:` + accept `power-roll` -> `mode: power-roll`. The list keeps opening on `mode:` with no space (the plain matrix row at `test/dom/authoring/schemaSuggestMatrix.test.ts:81`, `['mode:', [...]]`, stays green and unchanged). Reason: it keeps the list where the user already sees it, and writes the line they meant.
2. **The mid-word value case is in scope** (its jsdom `test.failing` in `test/dom/authoring/authoringKnownBugs.test.ts` cites SC-688). An enum (value) accept replaces the whole value word under the cursor: from `start` through the end of the run of non-whitespace characters after the cursor. `mode: op|posed` + accept `opposed` -> `mode: opposed`.
3. **The KEY path is OUT of scope** — that is SC-678 (Backlog, its own `test.failing` marker). Do not change key-accept behaviour; SC-678's marker must stay `test.failing` and still fail.
4. Gates: full dse-verify battery for tsc/lint/jest/lifecycle/e2e. Shots/freeze/parity may CARRY only if the built `styles.css` is byte-identical to a clean develop@23f3e61b build (the SC-682/SC-687 precedent); otherwise run them.

## Round log

- 2026-11-26 impl r1 (orchestration:implementer): DONE at dse `4b233886` (5 commits on 23f3e61b). jest 14730/2 skipped; lifecycle 64/64 (7 parts); e2e `843/852 ok, 0 failed, 9 known-bug, coverage: 486/486 pairs`; styles.css identical to clean 23f3e61b (a4dfc387...) so shots 592 / freeze 280/280 / parity 0/0/24 carry. AUTH-G21 flipped to plain; AUTH-G22 new.
- 2026-11-26 review r1 (orchestration:reviewer, independent): APPROVE, 0 C/H/M, 1 LOW, 4 INFO. Re-measured tsc/lint/jest/full e2e and styles.css hash: same numbers.

## Owner rulings on review findings (2026-11-26)

- LOW-1 (`mode:| test` + accept `flat` -> `mode: flat test`): DROP. Not a regression (base wrote `mode:flat test`), needs the cursor parked exactly between the colon and an existing value's space, and the result is valid YAML (no error card) that the user sees and fixes by hand.
- INFO-1 (extended `end` is local to selectSuggestion; no Obsidian behaviour change): no action.
- INFO-2 (one Ctrl+Z undoes typing + accept together without a pause): DROP, CodeMirror undo grouping, not this diff.
- INFO-3 (`/\s/` stops at a non-breaking space): DROP, no practical impact.
- INFO-4 (dse-verify old SC-443 entry lists AUTH-G21 + SC-688 markers as open): hand to the dispatcher for the CURRENT entry at landing.

## Status

LAND-READY 2026-11-26: dse branch `sc688-suggest-after-colon-no-space` @ `4b233886`, base develop `23f3e61b`.
