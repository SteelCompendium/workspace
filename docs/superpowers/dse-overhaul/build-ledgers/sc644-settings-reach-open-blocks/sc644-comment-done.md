**Landed. "Collapsible by default" and "Show edit button on rendered blocks" now change blocks that are already open, without reopening the note; "Start collapsed" leaves open blocks alone, as you chose. Closing this ticket.**

It is on the plugin's `develop` branch. It reaches your vault the next time you rebuild the plugin from develop, and other users with the next release, which is your call.

Nothing was left open by this ticket. The neighbouring bug, a block pinned in the sidebar not noticing a hand-edited `collapsed:` line, stays on the backlog as SC-665.

---

Mechanics: plugin `develop` at `fefd9029` (8 commits, fast-forward); workspace main merge `c09b4a1f`. Final tests on that head: jest 13903 passed / 1 skipped, lifecycle 64/64, e2e `664/669 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs`. The build ledger is kept in `docs/superpowers/dse-overhaul/build-ledgers/sc644-settings-reach-open-blocks/`.
