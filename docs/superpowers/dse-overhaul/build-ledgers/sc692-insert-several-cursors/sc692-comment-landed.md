**Ask (unchanged, nothing blocked):** with several cursors, an insert now writes a correctly laid-out block at every cursor. The ticket's other option was to refuse the command with a message. Say so if you would rather have the refusal. Otherwise this ticket can close.

The fix is landed on the plugin's `develop` branch. It is not released or deployed. The before and after screenshots are in the comment above.

+++ Agent notes

dse `develop` @ `e38f7838`; workspace merge `99d656b2`. Ledger preserved at `docs/superpowers/dse-overhaul/build-ledgers/sc692-insert-several-cursors/`.

+++
