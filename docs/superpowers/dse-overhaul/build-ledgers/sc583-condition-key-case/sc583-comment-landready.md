A hand-written `key: Dazed` (capital D) is now the standard Dazed condition. Picking Dazed in the Conditions window no longer adds a second, lowercase `dazed`. The fix is reviewed and ready to land; nothing is needed from you.

What changes for a user:

- `Dazed`, `DAZED` or `dAzEd` shows Dazed's name and icon everywhere: the tracker icons, the Conditions window (as a standard row, not custom), and the minion pool window.
- Picking Dazed when the creature already has it in any capitals writes nothing to the note.
- The note keeps the spelling you wrote. The plugin never rewrites `Dazed` to `dazed`, including when it saves some other change to the same block.
- Custom keys match the same way: adding a custom "hexed" next to a hand-written `Hexed` adds nothing.

Two related gaps are filed for later, both Backlog:

- SC-617: the Add menu gives no sign that a creature already has a condition.
- SC-618: a hand-written key with a space, such as `High Ground` or `Hex Mark`, still does not match its slug (`high-ground`, `hex-mark`).

+++ Agent notes

* One helper, `conditionKeysEqual` (`src/utils/Conditions.ts`), now compares condition keys ignoring capitals. It is used by the condition registry lookups and the Conditions window's duplicate check. The SC-592 plain-string maps in `src/elements/initiative/model.ts` still compare exact spelling, on purpose: that keeps hand-written spelling byte-for-byte. A code comment there now says so.
* The old jest `test.failing` SC-583 marker went green and was removed; a new test in `conditions-modal.test.ts` covers the same check and more.
* New e2e tests COND-K01..K05 (fixture `e2e/vaults/shipped/Initiative/key-case.md`). Turning the helper back into a plain `===` makes 10 jest tests and 4 of the 5 e2e tests fail (K04 guards edit/remove, which already worked).
* Gates on dse `d0561a68`: tsc and lint clean; jest 10760 passed / 1 skipped; e2e `290/293 ok, 0 failed, 3 known-bug, coverage: 172/172 pairs`. On `6453bc5d` (the r3 delta after it is one e2e test and one code comment): lifecycle 60/60; shots 592; freeze 280/280; parity 0 / 0 / 24.
* Superproject branch `sc583-condition-key-case` sits on workspace origin/main `eccfe90e`: CHANGELOG entry plus one pointer bump to `d0561a68`.
* Review: independent Opus review APPROVE (one low test-strength finding and one comment fixed in r3), then a scoped re-review of that fix.

+++
