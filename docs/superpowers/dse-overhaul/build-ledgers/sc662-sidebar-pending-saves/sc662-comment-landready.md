The pinned sidebar no longer loses a save, or the outside change, when the note changes from outside. This is ready to land; nothing here needs a decision from you.

What changed for a pinned card when the note changes from outside (Sync, another pane, or a card in the note itself):

- A press made just before the change is still written. Before, it was lost if the change came within about 400 ms. This also fixes SC-550.
- A window over a block the change did not touch stays open and saves. Before, the stamina bar's Apply went nowhere.
- A window over a block the change did touch closes without saving. It shows "The note changed outside, so this window closed without saving" and puts keyboard focus back on the button that opened it. Pinned Conditions no longer writes its staged list over the outside change.
- When your save and the outside change hit the same block, the outside change is kept and a Notice says your change was not saved. Reading view already did this; the sidebar used to lose the save silently.
- The block edit form's Save and the Undo after Catch breath or a recovery follow the same rule. Before, the form wrote over the outside change, and Undo did nothing while the card showed numbers that were not in the note.

Two older bugs found along the way are fixed too:

- A pinned Conditions, Resource, Surges or Tokens card broke ("Backing block not found") right after its first save.
- Once a block had been pinned, its edit form could never be saved (hero, Conditions, Resource, Surges, Tokens, roll), in the sidebar and in Reading view.

This covers every card that can be pinned: all 22 elements, including the hero sheet, negotiation and the montage.

For your information only, no action needed: an outside edit that changes only a `prefs:` or `collapsed:` line counts as a change to that block. A stamina or Conditions window over it closes with the Notice. Montage and initiative windows stay open, because their own rule (SC-650, SC-608) compares the tracker contents, not the text.

Also for your information: saving a hand-written hero from its edit form rewrites the block in the plugin's format and drops any comment inside `state:`. Reading view already did this; it is now possible for a pinned hero too.

---

Mechanics:

- dse branch `sc662-sidebar-pending-saves` @ `129beb18` on develop `d62f0b26`; superproject @ `3f03b2e0` on workspace main `2e2c3b36` (one CHANGELOG commit, one pointer bump).
- Battery at head: tsc and lint clean · jest 13703 passed / 1 skipped · lifecycle 64/64 · e2e `658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs` · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0 / 0 / 24.
- New tests: e2e SIDE-OE01..OE12, all red on the old code except the controls; jest PS01..PS30, SF01..SF05, a sweep over all 13 elements that save to the note (`persistedAnchorPassthrough.test.ts`), and formModal anchor cases. Every guard has a mutant that a named test kills.
- New control id `cond.strip.add` ("+ add condition"), so focus can return to it; coverage 417 → 418 pairs.
- Lifecycle G-S61 failed on some runs on head and on the unchanged base (SC-668); it passed in the final runs.
- Review: independent reviewer, four rounds (first FIX, then LAND three times, each after a small fold).
- Ledger: `.superpowers/sdd/sc662-sidebar-pending-saves/` (machine-local; preserved at landing).
