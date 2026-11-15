Keyboard focus now stays on the same control of a Negotiation card when Sync, another pane or another plugin changes the note. It works in Reading view, Live Preview and the pinned sidebar. Ready to land; nothing is waiting on you.

Before this fix, the card was redrawn and focus fell to the top of the page, in all three views (Live Preview and the sidebar had the same bug as Reading view).

**One behaviour change you may want to veto:** the tier you picked for the current argument is now kept across an outside change, so Complete Argument stays usable and keeps focus. It is kept only when the outside change left that argument alone (same Interest and Patience, same chips used, same spent motivations). If the argument was completed or changed elsewhere, for example by Sync from another device, the tier is dropped as before. It cannot record an argument twice. A tier picked with the mouse is still dropped, as before.

**Where focus goes when the same control is not there any more** (each one is easy to change if you want a different target):

- Complete Argument, when the tier was dropped: the first Motivation chip (the same rule as after Complete Argument).
- "Argument has already been made" or "Reuses a Motivation", when the outside change turned that box off: the Lie box.
- The outside change collapsed the card: the card itself.
- The outside change added or removed a Negotiation block above this one: focus is not moved (the plugin cannot tell which card is which).

Focus is never pulled into a card that did not have it. No Notice is shown, because nothing is lost.

Filed while doing this: SC-670, the same focus drop on counter, stamina bar, initiative, montage and feature cards.

+++ Agent notes

- dse branch `sc656-negotiation-outside-edit-focus` @ `d62f0b26` on develop `bab0dbb2`; superproject `604f79ed` on workspace main `f7185e87` (CHANGELOG commit + one pointer bump).
- Mechanism: `src/elements/negotiation/view.ts` records the focused control at `vault.on('modify')` (cleared by pointerdown / keydown / wheel / focusout), hands off through new additive exports in `src/framework/chrome/windowHandoff.ts` (`rememberFocus`, `handOffAfterOutsideRedraw`, `silent`, `receive`/`carry`, silent-path card-root fallback); own Live Preview saves are skipped via `ownSaveCarried` in `src/framework/host/livePreviewFocusCarry.ts`. Tier carry is guarded by `NegotiationData.argumentKey()`. Fallback chains in `src/elements/negotiation/focusRules.ts`.
- Tests: jest `test/dom/elements/negotiation-outside-edit.test.ts` (35), e2e `e2e/specs/negotiation/outside-edit.e2e.ts` NEGO-O01..O19. No lifecycle scenario.
- Gates at head: tsc / lint clean · jest 13642 passed / 1 skipped · e2e `646/655 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` · lifecycle 63/64, all seven parts at d62f0b26 (G-S61 the only failure, red on base on this host, SC-668) · shots / freeze / parity unchanged (no CSS or static DOM change; 592, 163/978, 40/240, clip 147, 280/280, 0/0/24 at bab0dbb2).
- Review: 4 independent review rounds (1 HIGH, 3 MED, 7 LOW found and fixed; last round LAND, 0 defects). HIGH: a stale focus record pulled focus into a different card after the focused one scrolled away.
- Ledger: `.superpowers/sdd/sc656-negotiation-outside-edit-focus/decisions.md` (machine-local).

+++
