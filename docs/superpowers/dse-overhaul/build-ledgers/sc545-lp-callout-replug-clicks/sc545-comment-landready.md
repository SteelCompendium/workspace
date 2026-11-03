Fixed and ready to land: after you turn Draw Steel Elements off and back on with a note open in Live Preview, + on a card inside a callout or an embedded note saves again. The card is redrawn when the plugin comes back on.

No decision needed from you. The dispatcher lands it next.

{{IMG:sc545-r2-lp-callout-after-off-on-plus-click-writes-7.png}}

Above: a counter in a `> [!note] Camp` callout after the plugin was turned off and on. The card was redrawn, and + changed it to 7 in the file.

**Why it broke.** When a plugin is turned on or off, Obsidian redraws plain code blocks but keeps callouts and embeds exactly as they were drawn. So the card inside a callout was the old copy from before the toggle. Its buttons had been unhooked when the plugin turned off, and nothing on the new plugin knew about it. A click did nothing and showed no error. Reading view and plain code blocks were never affected.

**What changed.**
- When the plugin turns off, it leaves a note on each callout or embed card saying how to redraw it. When it turns on, it redraws those cards in place. Scroll position does not move.
- A card that was scrolled about a screen or more away at that moment is redrawn when you scroll back to it.
- A few rarer cases redraw the whole note once instead. That clears the note's undo history:
  - a click's save still pending when you turned the plugin off
  - a note opened while the plugin was off
  - the one update that installs this fix
- Not covered: cards on a canvas and in hover previews. During the one update that installs this fix, a card scrolled far out of view stays dead until you reopen the note.

**Tests.** A new real-Obsidian test, G-S63, turns the plugin off and on in eight setups:
- a counter in a callout
- a counter in an embedded note
- two identical callouts
- a stamina bar in a callout
- a callout in the middle of a tall note, checking that scroll does not move
- a click right before turning the plugin off
- a plain code block and Reading view, as controls
- a callout scrolled far out of view

It fails on today's build and passes with the fix. Two independent review rounds probed it in real Obsidian.

Gates on dse develop `ea78ebf8`:
- jest 6415 passed / 1 skipped / 254 of 255 suites
- lifecycle 50/50
- e2e 128/128, 89/89
- shots 592, 0 FAIL
- freeze 280/280
- parity 0/0/24

Filed along the way: SC-557. An existing lifecycle check, G-S61, flakes under load; this fix did not cause it. SC-535, the off/on hang, could not be reproduced here and does not share this cause.
