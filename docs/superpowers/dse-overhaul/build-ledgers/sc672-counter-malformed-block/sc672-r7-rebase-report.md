# SC-672 r7 rebase report

## Executive summary (updated by r7b; the r7 summary below it is the earlier state)
- r7b STATUS: DONE. Plugin head `28402e57` (r7's `079c9c7e` + one commit, test only). Superproject head `0500eb78` (3 CHANGELOG commits) on origin/main `b034ff73`; no conflicts.
- jest full: `Tests: 2 skipped, 14005 passed, 14007 total`, 0 failed. tsc (incl. -p e2e) and lint clean.
- main.js sha256 `9893e4940f3e16e476a993cf1d1306079433e95e76a690389510cc6b35d870cb` and styles.css `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`: identical before and after the change (fresh production builds), so e2e 682/687 and lifecycle 64/64 from `079c9c7e` carry and were not re-run.

## r7 executive summary (head `079c9c7e`)
- STATUS: NEEDS_CONTEXT (one develop-side SC-671 test fails because of this branch's behaviour; I did not edit it, as briefed)
- Plugin head `079c9c7e` (7 commits: r5's 6 rebased + the new tests commit) on dse develop `d582e7ff` (SC-671). Conflicts: 2 test/doc files, both resolved keeping both sides.
- Superproject head `70655862` (3 CHANGELOG commits) on origin/main `0ec2f4f9` (later than the expected `c5d38e9b`). 1 conflict (CHANGELOG), resolved keeping both.
- N = 9 jest tests, M = 1 e2e test (CTR-W16).
- tsc (incl. -p e2e) clean, lint clean. jest: `Tests: 1 failed, 2 skipped, 14004 passed` (14005 = 13996 + 9 with the SC-671 test below counted as a pass).
- e2e full: `OBSIDIAN-E2E done: 682/687 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs`. Counter spec CTR-W03..W16 alone 14/14; own-keys CTR-O01..O04 alone 4/4.
- lifecycle 7 parts: 21+16+9+4+7+4+3 = 64/64, 0 failed (G-S61 green, no re-run).
- styles.css sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` = clean `d582e7ff` build `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` (scratch worktree, node_modules symlinked, removed by literal path). Equal: shots / freeze / parity carry.
- src/ diff vs `d582e7ff`: `src/model/Counter.ts` + comment in `undeclaredDefaults.ts` only. package.json / lock unchanged between `fefd9029` and `d582e7ff` (empty diff), so no `npm ci`.

## Failing develop-side test (the NEEDS_CONTEXT question)
`test/unit/model/counter-serialize.test.ts:164-170`, test "SC-671: counter unknown keys > a non-map body keeps today's behaviour: nothing is carried, nothing crashes differently":
```
expect(roundTrip('hello')).toBe('');            // now throws "Invalid data: the block must be a map of keys." (R1)
expect(roundTrip('- a\n- b')).toBe('{}');       // now throws the same (R1)
expect(() => parse(null, '')).toThrow(TypeError); // now does NOT throw: an empty block is a fresh counter (R2)
```
It fails at the first line (`roundTrip('hello')` throws the plain message from `src/model/Counter.ts:48`). All three lines encode the pre-SC-672 behaviour that SC-672 changes by ruling; the test's own comment says "SC-672 owns whether that is right". Needs an owner decision on how to rewrite it (e.g. `hello` / `- a` -> toThrow(MESSAGE); `parse(null, '')` -> a fresh counter that carries nothing). Not edited.

## Conflicts
1. Plugin `test/dom/elements/wrapperDefaultKeys.test.ts` (commit 2, "counter blocks that are not a map..."): HEAD = SC-671's new test "counter, through the real write path: + then - on `title: Deaths`..." in the spot where this branch put its "+ then - on an EMPTY block returns it to an empty body" test; both share the tail (reopen and re-mount). Result: both tests kept in full, SC-671's first, mine after, each with its own tail.
2. Plugin `e2e/README.md` (commit 3): HEAD = SC-671 `Counter/own-keys.md` row; mine = 7 SC-672 fixture rows. Result: all rows kept, own-keys first.
3. Superproject `CHANGELOG.md` (commit 1): HEAD = SC-671 bullet; mine = SC-672 bullet. Result: SC-672 bullet first, blank line, SC-671 bullet, then main's other bullets unchanged. Second commit applied cleanly.

## r6 wording finding (folded)
New superproject commit `70655862`: the SC-672 bullet's sentence now ends "... and the first click on + fills the block in (`current_value: 1`); a number typed into the box fills it in with that number." Nothing else in the bullet changed (diff is 1 line).

## Range-diffs
- Plugin `fefd9029..52cc1b49` vs `d582e7ff..HEAD` (first six): commits 1, 2, 4, 5, 6 `=`; commit 3 (`e2e for a counter block ... README rows`) `!` (the README conflict resolution). File `range-diff-plugin.txt`. The 7th is the new tests commit `079c9c7e`.
- Superproject: commits 1, 2 `!` (re-based context only), 3 new. File `range-diff-super.txt`.

## (a)-(d) interaction tests (all hold, no src change) — `test/dom/elements/counter-wrong-block.test.ts`, new describe "SC-671 and SC-672 together: the element parse and write path", N = 9
- (a) x4 rows (`hello`, `- a`, `5`, `!!set`): "(a) %s: the element parse throws the plain message before any key handling, and nothing is written". Element `parse` throws `Invalid data: the block must be a map of keys.`; the pipeline draws the error card with no control; a click and a flush write `[]`.
- (b) x3 rows (blank lines, only a comment, `null`): "(b) an empty block (%s) is a fresh counter, and + writes exactly `current_value: 1` with no other key". writes = `['current_value: 1']`.
- (c) "(c) a block that holds ONLY keys the counter does not read is a counter at 0: + keeps the key, and + then - never writes a blank body". Source `note_to_self: x`: value 0, no error card; + writes `'current_value: 1\nnote_to_self: x'`; then - writes `'note_to_self: x'`; every write contains the key.
- (d) "(d) an empty block, + then -: the second write is a blank body, as CTR-W14 pins for Reading view". writes = `['current_value: 1', '']`. (The wrapperDefaultKeys test "+ then - on an EMPTY block returns it to an empty body" also passes on the rebased head.)
- e2e `[CTR-W16]` (Reading view, fixture `Counter/only-unknown-keys.md`, README row added): counter at 0, + gives `current_value: 1\nnote_to_self: x` in the fence, - gives the original bytes; the note stays byte-identical outside the fence.

Drive-by fixes: none
Follow-ups: the SC-671 test above needs the owner's rewrite. Process note: `git commit -am` staged the submodule pointer once in the superproject; I caught it and redid that (still unpushed) commit without the pointer. The pointer ` M draw-steel-elements` is not staged.

## Evidence (under /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc672-r7-rebase/)
range-diff-plugin.txt, range-diff-super.txt, tsc-a.log, lint-a.log, jest-two-a.log (the failing test's message), jest.log/.rc/.load, build.log, styles.sha, build-base.log, styles-base.sha, e2e-spec.log, e2e-own.log, e2e-full1.log/.rc/.load, life-p1..p7.log/.rc/.load, life-all.rc, g-*.sh

## r7b (rewrite of the red SC-671 test)
- No gate process of mine was alive (checked by `/proc/<pid>/cwd` under the worktree: none).
- `test/unit/model/counter-serialize.test.ts` (the test at the old lines 164-170), rewritten in place, one commit `28402e57`, nothing else in the file touched. New title: "a non-map body is refused before anything is carried; an empty body is a fresh counter with nothing carried". Assertions: `parseLikePipeline('hello')` and `parseLikePipeline('- a\n- b')` each `toThrow(new Error('Invalid data: the block must be a map of keys.'))` (full message); `parse(null, '')` does not throw, `current_value` is 0, `name` is undefined, and `serialize(fresh)` is `''` (measured, the generic blank-source rule). Comment replaced with the rule (no "SC-672 owns whether that is right").
- The file alone: 17 passed. Full jest 14005 passed / 2 skipped / 0 failed (14007 total); load 1.93 at start, 10.19 at end.
- Superproject: `git rebase origin/main` (`b034ff73`, a one-line HANDOFF change) applied cleanly; the pointer ` M draw-steel-elements` is not staged; no `git commit -a` used.
- Evidence (same scratch folder): r7b-jest-one.log, r7b-jest.log/.rc/.load, r7b-tsc.log, r7b-lint.log, r7b-build-before.log, r7b-build-after.log, r7b-sha-before.txt, r7b-sha-after.txt, g-r7b-*.sh
