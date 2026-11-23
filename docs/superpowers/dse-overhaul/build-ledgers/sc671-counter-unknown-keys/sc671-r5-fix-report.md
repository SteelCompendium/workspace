Note: tracked branches moved twice during the round. Final targets used: plugin origin/develop `fefd9029` (SC-644; unchanged at the last fetch) and workspace origin/main `334058e2` (a docs-only descendant of the owner's `b79eef2b`: HANDOFF.md + sc644 ledger; no CHANGELOG change). Neither moved after the final fetch.

# SC-671 r5 fix report

Executive summary
- Verdict: DONE. No push, no AI attribution in commits, no tracker.
- Plugin head `d582e7ff` on `fefd9029` (rebased fourth SC-671 commit `f11459e9`; two r5 commits `682b4b66` LOW-2, `d582e7ff` LOW-1 + INFO-3).
- Superproject head `06e1f3e4` (pointer bump) on `358b7fb0` (LOW-3 clause) on `7b5eddbd` (SC-671 CHANGELOG) on `334058e2`. Clean rebase, no CHANGELOG conflict; SC-671 bullet is first under `## Unreleased`; diff vs origin/main = 6 added lines, 0 removed. `git status --short` prints nothing.
- N = 5 new tests (2 unit, 3 wrapperDefaultKeys). INFO-3 rewrote none.
- tsc 0, lint 0; jest `Tests: 2 skipped, 13936 passed, 13938 total` (13931 + 5); lifecycle 64/64 (21,16,9,4,7,4,3; all exit 0; G-S61 green);
  e2e `OBSIDIAN-E2E done: 668/673 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs`;
  styles.css sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` on both rebased head and clean `fefd9029` (identical; the SC-644 base kept the same hash) -> shots/freeze/parity carry.

## range-diff `bdf0255e..16cbd05f fefd9029..f11459e9`
```
1:  3b228d60 = 1:  bb6c396b fix(counter): keep the YAML keys the counter does not read through every write (SC-671)
2:  b790e93c = 2:  62d98ba0 test(counter): every write path keeps unknown YAML keys (SC-671)
3:  518dc383 = 3:  94bfd181 test(counter): e2e for unknown YAML keys kept by + / - in Reading view, Live Preview and the pinned card (SC-671)
4:  16cbd05f = 4:  f11459e9 test(wrapper-default-keys): the counter empty-body cases start from a mapping with no key (a key the counter does not read is now kept, SC-671)
```
package.json / package-lock.json unchanged across bdf0255e..fefd9029 (no npm ci).

## r5 delta `git diff --stat f11459e9 d582e7ff`
```
 src/elements/counter/model.ts                |  8 ++++--
 test/dom/elements/counter-own-keys.test.ts   |  4 ++-
 test/dom/elements/wrapperDefaultKeys.test.ts | 41 ++++++++++++++++++++++++++++
 test/unit/model/counter-serialize.test.ts    | 37 ++++++++++++++++++++++++-
 4 files changed, 86 insertions(+), 4 deletions(-)
```

## Per finding
- LOW-2 (`682b4b66`): `src/elements/counter/model.ts` `serialize` now drops carried extras whose key the model owns (`Object.prototype.hasOwnProperty.call(model, key)`), with a comment; the no-unknown-keys early return is untouched; hostile-key tests unedited and green; `src/model/Counter.ts` unchanged. `KNOWN_KEYS` is now exported (needed by the test; comment says so).
  Tests in `test/unit/model/counter-serialize.test.ts` (2 new):
  1. "KNOWN_KEYS is exactly the keys of a parsed Counter": `[...KNOWN_KEYS].sort()` equals `Object.keys(Counter.parse({})).sort()`. Mutant (removing `name_height` from KNOWN_KEYS) -> this test fails (log r5-low2-mutB.log).
  2. "an extra whose key the model owns is never written over the model's value": reached through the public parse/serialize using `jest.isolateModules` + `jest.doMock('@model/Counter')` with a subclass that adds a `step` field not in KNOWN_KEYS; a source `step: 5`, model set to 6, serialized `step` is 6 and appears once. With the filter line reverted (`const carried = extras;`) it FAILS (r5-low2-mutA.log); restored and green. No further product change needed.
- LOW-1 (`d582e7ff`): `test/dom/elements/wrapperDefaultKeys.test.ts` +41 lines, the `{}` cases kept; three tests added, each + then - through the real write path:
  (a) SC-482 describe: `title: Deaths` -> `current_value: 1\ntitle: Deaths` -> `title: Deaths`, block re-renders;
  (b) prefs describe: `prefs:\n  sbDensity: compact\ntitle: Deaths` -> `...\ncurrent_value: 1\ntitle: Deaths` -> original;
  (c) `collapsed: false\ntitle: Deaths` -> `collapsed: false\ncurrent_value: 1\ntitle: Deaths` -> original.
  The three final bodies match the reviewer's three strings exactly. They pass on the pre-r5 source too (run with `src/` stashed: wrapperDefaultKeys + counter-own-keys 73/73, r5-low1-base.log): they guard today's behaviour, as expected. Deviation: the third original site (the "neither prefs: nor a collapse key" test, also `title: Deaths`) was not duplicated; the reviewer's third string is the `collapsed: false` case, which I added instead.
- LOW-3 (`358b7fb0`, superproject): clause "except a key that is a number, like `2024:`, which moves to the top and comes back in quotes," added inside the bullet's parenthesis; nothing else changed.
- INFO-3 (`d582e7ff`): `test/dom/elements/counter-own-keys.test.ts` `mount()` now calls `host.setMountedBody(body)` before `pipeline.run` (with a comment). Result: 14/14 still pass (r5-info3.log); 0 tests turned red, so no test was rewritten; no product change.

## Logs (all under /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc671-r5-fix/)
r5-tsc.log, r5-lint.log, r5-jest.log, r5-lc1.log..r5-lc7.log (+ r5-lc?.load), r5-e2e.log (+ r5-e2e.load), r5-base-build.log, r5-low1.log, r5-low1-base.log, r5-low2.log, r5-low2-mutA.log, r5-low2-mutB.log, r5-info3.log. Note r5-tsc/lint/jest/lc1 logs were overwritten by the final run (the earlier run on the bdf0255e base was killed in lifecycle part 1 and discarded). Scratch worktree `base-fefd` registered in the plugin clone, left in place.

Drive-by fixes: none.

Follow-ups:
- One slip, corrected before it landed: a `git commit -a` swept the unstaged pointer into the LOW-3 commit; I reset it and recommitted CHANGELOG only. The final history has exactly one pointer-bump commit.
- Doc comment at `src/elements/counter/model.ts` header predates the export; harmless.
