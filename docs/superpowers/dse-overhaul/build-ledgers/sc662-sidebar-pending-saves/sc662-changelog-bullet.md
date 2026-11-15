- **DSE plugin (experimental sidebar): an outside change to a pinned note no longer loses what a pinned card was about to save, and no longer gets written over (SC-662, also fixes SC-550).**
  An outside change is Sync, another pane, another app, or a card in the note itself. It used to refresh the pinned card in a way that lost data.
  A press made in the pinned card just before the change is now still written.
  A window over a block the change did not touch stays open and still saves. Before, a stamina bar's Apply went nowhere.
  A window over a block the change did touch closes without saving, shows "The note changed outside, so this window closed without saving", and returns keyboard focus to the button that opened it.
  Pinned Conditions no longer writes its staged list over the outside change.
  When your save and the outside change hit the same block, the sidebar now does what Reading view does: the outside change is kept and a Notice says your change was not saved. Before, it was lost silently.
  The same holds for the block edit form's Save and for Undo after Catch breath or a recovery. Before, the form's Save wrote over the outside change and Undo did nothing while the card showed numbers that were not in the note.
  A pinned Conditions, Resource, Surges or Tokens card no longer breaks ("Backing block not found") after its first save.
  The block edit form of a block that has been pinned can be saved again. Before, the line the sidebar adds to find its block kept Save disabled for the hero, Conditions, Resource, Surges, Tokens and roll, in the sidebar and in Reading view.
  This covers every card that can be pinned, including the hero sheet and the montage.
