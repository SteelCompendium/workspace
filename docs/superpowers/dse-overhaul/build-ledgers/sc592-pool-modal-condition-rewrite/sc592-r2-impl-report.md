# SC-592 r2 implementation report (I1 resumed)

**Summary**
1. DONE. Plugin head `79da77f8` (rebased onto dse develop `4f0c87f2`, no conflicts). Superproject head `e9c9b6c9` on origin/main `3eb1adbd`.
2. Superproject rebase: one conflict, CHANGELOG.md `## Unreleased` (SC-595 bullet vs mine). Kept both bullets, theirs first, mine last, no markers; the diff against origin/main is 8 inserted lines. Submodule pointer not bumped.
3. Plugin commits (r1 five, rebased: `8f2a4980`, `ea098d6b`, `0388c042`, `16c7c6a1`, `b2c9bf2f`) plus r2 `79da77f8`: per-key count test (2 tests), empty-string pin (1 test), COND-R06 exact shape, model comment.
4. LOW-1 mutant (per-key count dropped: no decrement in `withConditionShape`): new tests fail 2/23 (log `r2-mutant-jest.log`). Restored.
5. COND-R06 on 4f0c87f2 model.ts: FAIL (`bleeding` read back as `{key: bleeding}`); on HEAD: ok (full e2e). The empty-string pin and both count tests also fail on base (21 of 23 fail on base).
6. Gates on 79da77f8: tsc + lint clean; jest 7262 passed / 1 skipped (css cached; 7239 + 23); e2e 264/269 ok, 0 failed, 5 known-bug, coverage 164/164.
7. Carry of lifecycle/shots/freeze/parity from 1c66c5ca: `git diff 1c66c5ca HEAD -- src` is comment-only (below); `styles-source.css` identical (empty diff). The rest of the diff is the SC-593 census files from the rebase (e2e/driver/census.ts, e2e/specs/_census.e2e.ts; test-only), my cond-rows pin, and the new jest tests.

## src diff 1c66c5ca..79da77f8 (stat: src/elements/initiative/model.ts, 4 insertions, 2 deletions)
```
 * never fabricated) — both EncounterData.ts's three legacy copies and this one carry it
- * so the async oracle (`parseEncounterData`) and this sync split stay byte-compat.
- * SC-592: an authored object keeps the keys the plugin does not know ...
+ * so the async oracle (`parseEncounterData`) and this sync split stay byte-compat for every
+ * condition the legacy shape can hold (key/icon/color/effect/duration).
+ * SC-592: they now differ, on purpose, for an authored object carrying other keys: the oracle drops them,
+ * this keeps them. An authored object keeps the keys the plugin does not know ...
```
Full diff: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc592-r1-impl-I1/r2-src-diff.txt

## Artifacts
Scratch dir: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc592-r1-impl-I1/ . Logs: r2-tsc.log, r2-lint.log, r2-jest.log, r2-e2e.log, r2-mutant-jest.log, r2-red-jest.log, r2-red-e2e.log.

Drive-by fixes: none. Follow-ups: none new.
