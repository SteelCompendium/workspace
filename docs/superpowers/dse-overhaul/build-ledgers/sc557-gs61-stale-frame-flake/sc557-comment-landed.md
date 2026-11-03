Landed: G-S61 is now reliable under load. The new check is on dse `develop` at `d689b719` and runs in every lifecycle gate from now on.

dse-verify's G-S61 entry now describes the new rule and the control results on `31d8f779`. It also lists four probe runs that must fail: the editor held back 1.5 s, a card forced to a wrong value, and the same with every disk read failing or half-written. The evidence is preserved in `docs/superpowers/dse-overhaul/build-ledgers/sc557-gs61-stale-frame-flake/`.

---
Workspace main `0c703c9c` (merge) + `4c820ecd` (bookkeeping). No user-facing change, so no CHANGELOG entry.
