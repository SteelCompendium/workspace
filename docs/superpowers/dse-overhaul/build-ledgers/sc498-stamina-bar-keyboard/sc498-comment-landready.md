The stamina bar now works from the keyboard. Tab reaches it as one stop, and Enter or Space opens the Stamina modal, the same as a click. Nothing is needed from you; this is ready to land.

**What you will see.** When the bar has keyboard focus, a 2px teal outline is drawn around the whole bar, 2px outside its edge. It is the same focus outline the other plugin controls use. It is a shape around the bar, so it does not rely on colour. A mouse click does not draw it, and it never prints.

Focused, dark scheme. The outline runs around all four sides. The Pin and Collapse buttons sit over a short stretch of its top-right edge and do not hide it:

{{IMG:stamina-bar-focused-dark.png}}

Focused, light scheme. The outline is a darker teal here, so it stands out from the near-white page:

{{IMG:stamina-bar-focused-light.png}}

**Behaviour.**
- Enter or Space on the Edit pencil, Collapse or Pin to sidebar does only that button's job. It does not also open the Stamina modal.
- When the modal closes, focus goes back to the bar.
- The bar is not a tab stop where a click would do nothing: read-only views, print, collapsed blocks, and `style: sheet`.
- A screen reader reads the bar's name, for example "Edit Stamina: 15 of 20, 5 temporary", followed by a hint that Enter or Space opens the editor.
- The initiative tracker's row bars are not tab stops. Each row already has a Stamina number button that opens the same modal, so a second stop on the bar would repeat it.

**Filed separately.** SC-505: pressing Enter on Collapse or Pin moves focus to the top of the page. This happened before this ticket.

---
Mechanics:
- dse branch `sc498-stamina-bar-keyboard` @ `e40b06c` on develop `66f474b`; superproject @ `f45f3fb` on origin/main `29109b0` (submodule pointer not bumped; the dispatcher lands).
- Gates: tsc + lint clean · jest 5876 passed / 1 skipped / 241 of 242 suites · lifecycle 35/35 (new G-S36) · e2e `108/108 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs` · shots 592, 0 FAIL · freeze `freeze OK (280/280)`, no rebaseline · parity 0 gaps / 0 undeclared / 24 declared.
- New real-Obsidian check G-S36: Tab to the bar, then Enter and Space each open the modal and return focus to the bar. It fails on the old code and passes on the new.
- An independent review re-ran every gate and confirmed the new tests fail on the old code. A scoped re-review covered the fix round.
