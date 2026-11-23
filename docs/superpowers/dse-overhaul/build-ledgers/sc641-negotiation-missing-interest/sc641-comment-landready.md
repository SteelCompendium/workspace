**Fixed and ready to land: a `ds-negotiation` block that leaves Interest out now opens at Interest 2 as a live negotiation, and Reset on a block with no `initial_*` values goes to Interest 2 / Patience 5 instead of ending it.** Nothing is needed from you; the dispatcher lands it.

What you will see:

- A block with just `name:` opens at Interest 2, Patience 5. Before, it opened on "Negotiation over: Interest fell to 0".
- Reset on a block that only has `current_interest: 3` / `current_patience: 2` leaves it at 2 / 5 and live. Reset adds no keys to the note; it does not write `initial_*`.
- A block that writes `initial_interest` / `initial_patience` resets to those values, as before.
- The Negotiation tracker docs page no longer calls `initial_interest` / `initial_patience` required. It says what a block starts at without them and what Reset returns to.

Two things to know:

- An Interest of 0 that you type yourself (`initial_interest: 0` or `current_interest: 0`) is still honoured. Reset on a block with `initial_interest: 0` still ends on the hostile banner, because that is what the block says it starts at.
- An old note with no Interest key at all now reads as Interest 2. That includes a name-only block that someone had played down to Interest 0 before this change: the old code saved that 0 by leaving the key out, so the plugin cannot tell it from a block that never had Interest. New saves write `current_interest: 0` explicitly, so this cannot happen again.

The 4 tests that marked this bug are now ordinary passing tests (jsdom K08, K09; real-Obsidian NEGO-W06, NEGO-W07), and they assert the values 2 / 5, not just "not ended". An independent reviewer confirmed all four fail on the old code.

+++ Agent notes

- Branch `sc641-negotiation-missing-interest`: dse `bdf0255e` on develop `f42546b8`, a fast-forward (3 commits: fix `8150d362`, docs `9ddd7b61`, review fixes `bdf0255e`); worktree superproject `38eb1759` (CHANGELOG bullet under Unreleased; submodule pointer left unstaged for `wt-finish`).
- Code change: `NegotiationData.default_interest` 0 -> 2. Fallback order unchanged (`current ?? initial ?? default`; Reset = `initial ?? default`). No other consumer restated the default.
- Gates: tsc + lint clean · jest 13861 passed / 2 skipped (fresh worktree; base 13855, +6 new tests) · lifecycle 64/64 across all seven parts · e2e `OBSIDIAN-E2E done: 660/667 ok, 0 failed, 7 known-bug, coverage: 418/418 pairs` · `styles.css` byte-identical to base and no visual fixture leaves Interest out, so shots 592, freeze 280/280 and parity 0 / 0 / 24 carry. No freeze delta.
- Lifecycle and e2e ran on `7ca7c140`, before the rebase onto SC-434's CI-only commit. After the rebase all three commits are unchanged (range-diff `=`), `main.js` and `styles.css` are byte-identical, and tsc / lint / jest were re-run on `bdf0255e`, so those two results carry.
- Review: r2 independent review APPROVE_WITH_FIXES (0 critical / high / medium; 2 low + 3 info folded as docs and changelog fixes); r4 scoped re-review of that delta passed on every line. Byte-level write probes in jsdom and real Obsidian: no key added by Reset, two blocks in one note do not cross-talk, unknown keys survive, wrong-type Interest values behave as on base.
- Not filed: Reset rewriting `name: "x"` as `name: x`, and writes dropping YAML comments, are existing behaviour already tracked in SC-599.
- Ledger: `.superpowers/sdd/sc641-negotiation-missing-interest/`.

+++
