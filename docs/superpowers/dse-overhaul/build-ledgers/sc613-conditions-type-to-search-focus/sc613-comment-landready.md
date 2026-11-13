Typing in the Conditions window now works after you click its title or an empty part of it. The Add search opens with what you typed. Ready to land; nothing is needed from you.

How it behaves now:

* Click a row's Add Condition, then the window's title (or any blank spot), then type `daz`: the Add search opens with "daz" typed.
* Escape closes just the search and puts the keyboard on "+ Add condition".
* If another window is open on top (the command palette, a stamina window) or a menu is showing, your keys go to that one, not to the Conditions window.
* It works in a popout window, in the pinned sidebar, and from a hover preview.

Nothing visual changed: no styles and no new buttons, so the screenshots are byte-identical.

+++ Agent notes

* Fix: a second keydown listener on the window's own document, removed when the window closes. It hands a key to SC-580's existing router only when focus is on the page itself, this window is the top-most one, no menu is open, and nothing else has handled the key. `src/views/ConditionsModal.ts`.
* Branch `sc613-conditions-type-to-search-focus`: plugin `9b94baf2` on dse develop `14521bf0`; superproject `d84892a4` on workspace main `f58d5f02` (CHANGELOG bullet + one pointer bump).
* Gates: tsc and lint clean · jest 11853 passed / 2 skipped fresh (11833 + 20) · lifecycle 63/63 · e2e `338/341 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0 / 0 / 24 (shots, freeze, parity and lifecycle on r1 `8978b6f0`; the fix round added tests only).
* New e2e: COND-N12, COND-N13 (title and blank-spot clicks), COND-N14 (a menu open keeps its keys), COND-N15 (the command palette on top keeps its keys). Review: an independent review returned LAND with 2 LOW findings (both missing tests: the popout document, and test windows left open); both were added in a fix round, plus an e2e for the command palette on top. A scoped re-review of the fix round returned LAND with no findings. Mutants: 16 tried, 14 killed by a test; one is equivalent (a duplicated check), and one survives (the menu check run against the main document while the window is in a popout), which the reviewers judged a safety net that never fires in real Obsidian.
* Ledger: `.superpowers/sdd/sc613-conditions-type-to-search-focus/`.

+++
