# SC-483 r2 report (implementer A)

Executive summary
- DONE. Three review fixes folded; rebased onto dse origin/develop 8d890f9 (third retarget: 8d075db -> 95981f1 -> 8d890f9) and superproject origin/main 3c25464.
- Plugin tip 54f8f88 (5 commits on 8d890f9): 44ffed0 red, c9e7a8c fix, 1945d40 tsc fix (r1), then 2df33a9 r2 red, 54f8f88 r2 fix. Superproject tip d7ca6fc (CHANGELOG only, no pointer commit).
- Conflicts: plugin 0. Superproject: CHANGELOG.md once (on the 383ec3f rebase), hand-resolved y, kept both bullets (SC-432's, then ours) under `## Unreleased`; the 060c9de and 3c25464 rebases had none.
- Gates on 54f8f88 (only evidence of record; older-tip runs on 8d075db/95981f1 discarded, though they were green too): tsc/lint clean; jest 5601 passed / 1 skipped / 234 of 235 suites (twice, after shots); lifecycle 31/31; e2e 95/98 ok, 0 failed, 3 known-bug, 66/66 pairs (run 20261021-233940-89f7); shots 580, 0 FAIL, `text scale OK (1626 comparisons ...)` and `text scale once OK (104184 comparisons over 208 loads ...)`; freeze OK (280/280); parity 0 gaps / 0 undeclared / 24 declared.
- jest arithmetic: 5585 base + 12 (r1) + 4 (r2) = 5601.

## The three fixes (src/authoring/FormModal.ts)
- LOW-1: `stringifyWorking` emits '' for an empty data object (not `{}`). Test: empty-source schema'd element with only an optional select, saved untouched, writes ''.
- INFO-2: the stringify-path body is `.trimEnd()`-ed (whole thing, so the `prefs:` prefix path also ends without a newline; exactly one line break stays between `prefs:` and the body). Tests: `prefs:`-only empty body writes `prefs:\n  reduceMotion: true`; prefs + body + touched select writes `prefs:...\nname: Goblin\nstyle: sheet`; and `replaceFenceBlock('```ds-sel\nname: Goblin\n```', 0, 2, written)` returns the identical note (no blank line before the closing fence). The 8 existing SC-483 expectations that ended in `\n` were updated to the trimmed form.
- INFO-4: doc comment on `requiredKeys` stating the guard sees top-level + allOf `required` only (not if/then, dependentRequired, oneOf), so a select governed that way is stripped when untouched; no built-in has one. No behaviour change.

## Host splice with an empty body (checked in src/framework/host/fenceLine.ts replaceFenceBlock)
- A body without a trailing newline is spliced cleanly: `body = newSource.split('\n')`, the close fence goes on its own line with the replaced line's terminator, so no fence merges onto the body line and no blank line appears (covered by the replaceFenceBlock test).
- An EMPTY body '' splits to `['']`, i.e. one empty body line, so an empty ds-roll that was "```ds-roll\n```" is saved as "```ds-roll\n\n```" (one blank line inside the fence). The splice cannot emit zero body lines for any caller; host code is out of scope, not changed, and the block is semantically empty/valid. Not verified in real Obsidian (read from code only).

## Gates
Logs (all in the r2d/r2e series; r2e = evidence of record): /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc483-r2-impl-a/r2e-{tsc,lint,jest,jest2,life,e2e,shots,freeze,parity}.log (+ .rc, all 0).
- One e2e run on 8d075db failed 2 spec files from host load ("Failed to download and setup Obsidian ... waitUntil timed out", other worktrees running e2e at the same time); rerun was 89/93 green. Not a code failure; discarded with the 8d075db tip anyway.
- Red/green for the fix tests: 13 failed / 13 passed before (26 tests), 26/26 after (r2-jestfm-red.log / -green.log).
- package.json / package-lock.json unchanged across all rebases, so no `npm ci`.

Drive-by fixes: none.
Follow-ups: none new (SC-488, SC-489, SC-492, SC-482 untouched, as briefed).
