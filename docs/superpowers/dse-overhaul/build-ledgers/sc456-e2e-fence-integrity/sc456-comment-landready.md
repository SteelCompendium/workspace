The e2e note check now catches a write that rewrites the first or last line of the block under test. It also stops raising false alarms on `~~~` fences, 4-backtick fences, and fences with a space before the block type. Nothing to review: this is test-only, and it is ready to land.

**What the check does now**
- After every e2e test, it compares each fence's full opening line and full closing line, byte for byte. Before, it only looked at the first word after the backticks. Only the body of the block a test edits may change.
- It reads fences with the plugin's own parser (`blockPrefix.ts`): ``` and ~~~ runs of 3 or more, callout `> ` prefixes, and a closing fence of the same character that is at least as long as the opener.
- `` ``` ds-counter `` (space before the type) is read as a `ds-counter` block, the way Obsidian reads it. The plugin itself still gives that block an empty type when it writes. That is SC-457 and is not changed here.
- The jest fake note (`makeFakeContext`) reads fences the same way.

**Proof it catches the SC-290 bug.** A test run put SC-290's bug back by hand and turned off the SC-290 test's own line check. The after-test check then failed with: `fence #0 (ds-stamina-bar) opening line changed: "```ds-stamina-bar  extra words" -> "```ds-stamina-bar"`. The old check passed the same run.

**Review.** An independent reviewer re-ran every gate and probed the change with 9 deliberate breakages of the new check; the tests caught each one. Its one real finding was fixed: a fence inside a callout now ends where the callout ends, the same as in the plugin. Before the fix, that case could hide a broken block from the check.

**Gates at `c03db7a` (rebased on `develop` 3480231)** (no plugin code changed; the built `main.js` and `styles.css` are byte-identical to a build of `develop` 3480231)
- tsc and lint (incl. `e2e/`): clean
- jest: `5373 passed, 2 skipped` (38 new tests; the second skip is the usual fresh-worktree one, without a shots run)
- lifecycle: `28/28 ok, 0 failed`
- e2e: `85/89 ok, 0 failed, 4 known-bug, coverage: 63/63 pairs`. No existing test, including the new COND-E02/E03, trips the stricter check
- shots, freeze and parity: not run, because nothing they measure changed

Branch `sc456-e2e-fence-integrity` in draw-steel-elements: `f5ce164` (helpers), `05a4968` (tests), `c03db7a` (review fixes)
