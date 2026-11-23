# SC-672 r5 fix report

## Executive summary
- STATUS: DONE_WITH_CONCERNS (concern: Item 4 skipped, see below)
- Plugin head `52cc1b49` (6 commits: r1's 4 + 2 new) on dse develop `fefd9029` (rebased as the addendum says, no conflicts, no npm ci: package files unchanged).
- Superproject head `1bb51fab` (2 commits) on origin/main `334058e2` (NOT the expected `b79eef2b`; main had moved on by one ledger commit). No conflicts.
- N = 10 jest tests, M = 3 e2e tests (CTR-W13, W14, W15). Item 4 (knownBug SC-685) SKIPPED.
- tsc (incl. -p e2e) and lint clean. jest: 13962 passed / 2 skipped, 0 failed (13952 + 10).
- e2e full run: `OBSIDIAN-E2E done: 677/682 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs`. Spec alone (CTR-W03..W15) x3: 13/13 each.
- lifecycle 7 parts: 21+16+9+4+7+4+3 = 64/64, 0 failed (G-S61 green).
- styles.css sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`, identical to a clean `fefd9029` build (measured in a scratch worktree, node_modules symlinked, removed afterwards): shots / freeze / parity carry, not run.
- src/ diff vs `fefd9029`: `src/model/Counter.ts` + a comment in `undeclaredDefaults.ts` only.

## Item 1 (M1) — `src/model/Counter.ts:47`
Predicate: `data != null && Object.prototype.toString.call(data) !== "[object Object]"` throws the exact `Invalid data: the block must be a map of keys.`
Why: Date / Uint8Array / Set / Map / arrays / strings / numbers / booleans all tag as something else; it does not depend on which window's `Object` built the value, and `{}`, `!!map {}`, null-prototype maps and every normal block stay accepted. Montage and negotiation untouched.
Tests (N=10): unit `test/unit/model/counter-wrong-block.test.ts` +6 (4 tagged sources through the real `yaml` parse, each also asserting the parsed shape is `[object Date|Uint8Array|Set|Map]`; `!!map {}` / `{}` / `!!map` with keys accepted; Date / Set / Map / Uint8Array handed to `parse()` directly, null-prototype object accepted); jsdom `test/dom/elements/counter-wrong-block.test.ts` +4 rows in the existing "plain error card, no control, nothing written" test.each. Titles: "a block tagged !!timestamp|!!binary|!!set|!!omap is refused with the same plain message, from the source text and from the parsed data"; "a tagged map (`!!map {}`) and a plain `{}` are still maps: fresh counters"; "a Date, a Set, a Map and a typed array handed to parse() directly are refused too"; "a tagged date (`!!timestamp`) | binary | set | ordered map: a plain error card, there is no counter or control, nothing is written".
e2e: fixture `e2e/vaults/shipped/Counter/wrong-tagged.md` (four blocks: !!set, !!timestamp, !!binary, !!omap), `[CTR-W13]` in `e2e/specs/counter/counter-wrong-block.e2e.ts`: all four are plain error cards (0 controls), note byte-identical after a click on each.
Red proof (old predicate `typeof data !== "object" || Array.isArray(data)` restored locally, then restored back to the new one; scratch copy `Counter.new.ts`):
- jest the two files: `Tests: 9 failed, 45 passed, 54 total` (the 4 unit tagged, the unit direct-parse test, the 4 jsdom tagged rows). Log `jest-two-red.log`.
- e2e `--only=CTR-W13`: `OBSIDIAN-E2E done: 0/1 ok, 1 failed` — `CTR-W13 FAIL: timed out waiting for all four tagged blocks to draw their error card`. Log `e2e-red13.log`.

## Item 2 (L1 + L2) — wording only
`docs/counter.md` Notes, the two bullets (final text):
- "An empty counter block is a counter at 0: it shows no name and has no maximum, and the first click on + (or a number typed into the box) fills in the block for you."
- "The block has to be `key: value` lines like the example above. If it holds something else (plain text, a bulleted list, a lone number), the card shows an error and leaves your note alone."
Field table `name` row: Required `No`, default `no name shown`.
Worktree `CHANGELOG.md`, SC-672 bullet (top of `## Unreleased`), final:
- **DSE plugin: a Counter block that holds plain text, a list or a lone number now shows an error and is left alone, and an empty Counter block is a counter at 0 (SC-672).**
  A block with plain text, a bulleted list or a number in it used to draw a working counter at 0, and the first click on + replaced your text with `current_value: 1`.
  It now shows a plain error card ("Invalid data: the block must be a map of keys.") with no buttons, so the card can't change your note.
  An empty block (nothing inside the fence, blank lines, or only a comment) used to show a raw error ("Cannot read properties of null"). It now draws a counter at 0 with no name and no maximum, and the first click on + (or a number typed into the box) fills the block in (`current_value: 1`).
  A comment inside an empty block goes on that first click, as it does for every block.

## Item 3 (L3) — `[CTR-W14]` Reading, `[CTR-W15]` Live Preview (`counter-wrong-block.e2e.ts`)
Fixture `empty-block.md` (one empty line between fences). Each: + writes exactly `current_value: 1` in the fence; then -; card is a counter at 0 with no error card; text above/below the fence equals the original; a SECOND + then - leaves the note byte-identical to after the first cycle. Exact fence body pinned, deterministic over 3 runs of the spec alone (13/13 each) plus the full run: Reading ends as the original one empty line (note byte-identical to the start), Live Preview ends as `current_value: 0`.

## Item 4 (L4) — SKIPPED, with the exact reason
Wrote the test (`+` with the mouse on the 2nd empty block, then Enter on the 1st block's + with the keyboard, asserting bytes after each press, focus staying on `counter.inc`, and a second Enter writing again) wrapped in `knownBug('SC-685', ...)`. It failed the run: `OBSIDIAN-E2E CTR-W16 FAIL: invariant violation(s): - view registry collisions=1 ambiguous=0 (expected 0/0)`. The after-test invariant (`e2e/driver/invariants.ts:38-43`, run inside the test wrapper in `e2e/driver/session.ts:42-44`) runs after the `knownBug` body has swallowed the expected failure, so the marker does not cover it. I did not weaken the invariant or reset the registry stats; the test was removed (log `e2e-new1.log`). The bytes-right part of the sequence also cannot be a plain test, since any test that presses the second counter trips the same invariant. Covering it needs a driver change (an invariant opt-out for a ticketed known-bug) or the SC-685 fix.

## Rebase
- Plugin: `git rebase fefd9029`, no conflicts. range-diff `bdf0255e..16d6897a` vs `fefd9029..HEAD`: all 6 commits `=` (file `range-diff-plugin.txt`).
- Superproject: `git rebase origin/main` (`334058e2`), no conflicts (SC-644 bullet is further down; SC-672 bullet is first). range-diff all `=` (file `range-diff-super.txt`). Pointer ` M draw-steel-elements` not staged.
- Old hash vs new base: the `bdf0255e` styles.css hash and the `fefd9029` hash are the same value.

Drive-by fixes: none
Follow-ups: Item 4 needs either the SC-685 fix or a driver-level way to run a ticketed known-bug past the registry-collision invariant. (Minor process note: the `g-e2e-full.sh` script was written with a heredoc, not the Write tool.)

## Evidence (all under /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc672-r5-fix/)
jest-two-{new,red,final}.log, e2e-red13.log, e2e-new1.log (Item 4 failure), e2e-spec{a,b,c}.log, tsc-{pre,rb}.log, lint-{pre,rb}.log, jest.log/.rc/.load, build.log, styles.sha, build-base.log, styles-base.sha, e2e-full1.log/.rc/.load, life-p1..p7.log/.rc/.load, range-diff-plugin.txt, range-diff-super.txt, Counter.new.ts, g-*.sh
