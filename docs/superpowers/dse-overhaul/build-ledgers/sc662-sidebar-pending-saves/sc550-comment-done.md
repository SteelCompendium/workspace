Fixed by SC-662: a press on a pinned sidebar card is no longer lost when a card in the note saves first. It is on dse develop `129beb18`.

The note card's save is an outside change to the sidebar, so the sidebar used to refresh its card and drop the press that was still waiting to be written. Now the sidebar writes the waiting press first. Then it refreshes only if the pinned block itself changed.

---

- Reproduced on the old code and checked by e2e SIDE-OE02 (sidebar press 50 ms after a note-card press on another block: both are written).
- If both presses hit the same block within about 400 ms, the sidebar now does what Reading view does: one press is kept and a Notice says the other was not saved.
