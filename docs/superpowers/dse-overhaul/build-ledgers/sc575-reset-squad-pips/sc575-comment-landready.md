Reset encounter now also clears a minion squad's pressed action pips. After Reset → Yes, Reset, all five squad pips (Move, Main, Maneuver, Second move, Triggered) show unpressed on screen, in the note, and after a reload. Nothing for you to decide; this is ready to land.

What changed: the reset already cleared heroes, pools and instances, but a squad's shared pips are stored on the minion creature entry, not on an instance, so they survived. One line in `resetEncounter` now clears them for every squad in the group. Names, stamina, amounts, squad roles, captain links and Malice round gain survive the reset as before; heroes and non-squad groups are unchanged.

Tests: the two tests that were marked "known bug SC-575" now pass as ordinary tests, plus three new unit tests. With the fix reverted, they fail. The e2e test also checks the pips on screen, not only in the note.

Related, not in this fix: whether Reset should also undo a captain promoted mid-fight is SC-590.

+++ Agent notes

Branch `sc575-reset-squad-pips`, dse plugin head `734d7745` on develop `a339e7b3` (commits `af86ec28` fix, `734d7745` review fixes); worktree superproject commit `ed94416f` on workspace main `b25d1a17` (workspace CHANGELOG Unreleased bullet).

Gates at `734d7745`: tsc/lint clean · jest 7085 passed / 1 skipped (2 SC-568 timeouts under load, green alone) · lifecycle 53/53 (five parts) · e2e `255/262 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs` (was 8 known-bug at a339e7b3) · shots 592, button host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24.

Review: independent review LAND-READY (0 high, 0 medium, 2 low + 2 info folded, 1 info dropped: a hand-written `actions` on a non-minion creature survives Reset, but nothing writes or shows it). Scoped re-review of the rebase + folds: LAND-READY. The final rebase onto a339e7b3 had no plugin conflict; `git range-diff` shows both commits identical (`=`).

dse-verify number update proposed in the ledger (`sc575-skill-proposal.md`) for landing.

+++
