Landed: a mouse click inside a form or any other Draw Steel window opened from a hover preview no longer closes it, and Esc closes such a form. This is on develop now; it reaches users with the next plugin release.

The two related preview cases this fix does not cover stay open as SC-597 (a window opened by keyboard alone closes by itself) and SC-598 (a very fast second click right after opening).

---

Mechanics: dse develop `94133a5a` (ec26b709..94133a5a); workspace main `f67d971c` (pointer bump `2edf68c2`). Ledger preserved at `docs/superpowers/dse-overhaul/build-ledgers/sc595-hover-form-click-closes/`. dse-verify updated (lifecycle 55/55, G-S83 in part 5, section "Hover preview modals (SC-595)").
