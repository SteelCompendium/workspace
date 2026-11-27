# SC-692 r4 scoped re-review: the delta 6b290e01..e38f7838

**Executive summary**
- Verdict: **LAND-READY**. Plugin head `e38f7838` (one commit on `6b290e01`); superproject `634cee2c` unchanged. The worktree is as I found it: plugin clean, superproject showing only ` M draw-steel-elements`.
- Gates: tsc rc 0, `tsc -p e2e` rc 0, lint rc 0. Fresh jest `Tests: 2 skipped, 15044 passed, 15046 total` (the claim, exactly).
- No runtime change. A clean `git archive` production build of `e38f7838` gives `main.js` `4b9c2e66…91d8b5c4` and `styles.css` `50436d6b…0e37e98`, byte-identical to my r2 build of `6b290e01`. So the r2 e2e (`944/964 ok, 0 failed, 20 known-bug, 540/540 pairs`), lifecycle 64/64 and shots / freeze / parity carry.
- MEDIUM-1 closed. The `const after = rest;` mutant at `:158` turns 2 committed tests red (75/77 pass). The `.to.line` mutant at `:156` turns 1 red (76/77 pass). After each run I restored the file, and `git diff -- src` was 0 lines. All three new cases use hand-written expected text, plus the oracle comparison.
- LOW-1 closed: both comments are true. LOW-2 (the harness keeps `main`): no test's meaning changes. Details below.
- New findings: one INFO (a check that always passes in a new test). Nothing to fix.

## 1. `src/` diff is comments only, and true

`git diff 6b290e01..e38f7838 -- src` is two comment lines in `src/authoring/blockInsert.ts`, and the built `main.js` is unchanged (above).
- `:20`: "the write (with one cursor) is ONE replaceSelection / replaceRange …". This is true: one range, or a `/ds` range, takes the `replaceSelection` / `replaceRange` path (`insertBlock`, `:244-249`).
- `:211`: "one block per range, in one `editor.transaction`, SC-692". This is true for the no-range path with more than one range (`insertAtEveryCursor`). With one range it is the single path, which the `:20` line covers.

## 2. MEDIUM-1: both mutants now go red

The script copies a mutant over `blockInsert.ts` at `e38f7838`, runs `insertSeveralCursors.test.ts` and `insertRefusal.test.ts`, and copies the original back. The log is `rv4-mut.log`.

| Mutant | r2 (`6b290e01`) | r4 (`e38f7838`) | Red tests |
|---|---|---|---|
| `:158` `const after = rest;` | 74/74 green | 2 failed / 75 passed | callout line with only the prefix; whitespace-only line |
| `:156` `ranges[i + 1].to.line` | 74/74 green | 1 failed / 76 passed | cursor right before a selection that starts at the same spot |

Expected text: all three cases (`insertSeveralCursors.test.ts:157-174`) compare the whole note with a hand-written literal built from `B` / `under(prefix)`, after `insertAll`'s oracle comparison. That literal does not come from the code under test. The callout case's text (`> ``` ` / `>  ```ds-ct` …) is the layout real Obsidian drew as two counters in my r2 probe (`rv2-draw-prefixOnlySameLine.png`). The first two cases also assert that no line holds two fences, and the third that there is no blank line.

INFO-1 (no action needed): at `insertSeveralCursors.test.ts:170`, `expect(spec.ranges).toHaveLength(2)` checks the PARSED spec, which always has 2 ranges. It does not check that the editor kept two ranges. This gives no false confidence: if the editor merged the two, one block would be written and the hand-written two-block text at `:171` would fail. If you want the check to mean what its comment says, change it to `expect(editorFor(spec, 0).listSelections()).toHaveLength(2)`.

## 3. LOW-1: closed (section 1).

## 4. LOW-2: the harness honours `setSelections(…, main)`. Does any test's meaning change?

No. Reasons:
- The product never calls `setSelections`. It reads the editor's state (`listSelections`, `getCursor('head'/'anchor')`) and writes through `transaction`. The harness's `transaction` already makes the first range the main one (`_cmEditor.ts:87`, `EditorSelection.create(…, 0)`), which is what Obsidian does. So the only thing the harness does differently is how a test reaches its starting state, never what the product does from it.
- Every state these tests start from can be reached in real Obsidian: any range can be the main one, since a real Alt-click makes the clicked cursor main (r2 ZZR-04). The e2e helpers reach the same states by putting the main range first.
- `insertRefusal.test.ts:387` (both orders, refused) asserts on the next line that `getCursor('head')` is the cursor it means to be main, so the state is checked, not assumed. `:408` (both outside, main = the second) asserts the text and one write, and these do not depend on which range is main. `insertSeveralCursors.test.ts:56` (`editorFor`) sets `main` and checks the main cursor afterwards against the oracle. In r2, a mutant that wrote the cursors in note order (main not first) turned 18 of these red, so the harness does test that the product puts the main range first.
- The new comment (`_cmEditor.ts:43-48`) states the difference correctly and matches what I measured in 1.14.4 (r2 ZZR-07: `setSelections([A, B], 1)` leaves A as main; `transaction({ selections })` makes the first range main).

## 5. Gates

- `rv4-g1-tsclint.log`: `TSC-RC=0`, `TSC-E2E-RC=0`, `LINT-RC=0`.
- `rv4-j1-jest.log` (after `rm -f main.js styles.css`): `Tests: 2 skipped, 15044 passed, 15046 total`, `GATE-RC=0`.
- `rv4-hash.out`: the `e38f7838` build's `main.js` and `styles.css` are byte-identical to `6b290e01`'s, so e2e, lifecycle and shots / freeze / parity carry from r2.

Artifacts: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc692-review-r4/` (`rv4-mut.sh`, `rv4-mut.log`, `rv4-mut-M1.log`, `rv4-mut-M9.log`, `mut-M1.ts`, `mut-M9.ts`, `head-blockInsert.ts`, `rv4-gate.sh`, `rv4-g1-tsclint.log`, `rv4-j1-jest.log`, `rv4-hash.sh`, `rv4-hash.out`, `rv4-hash-build.log`).

Follow-ups: none new.
