- **DSE plugin: a tracker redraws about 40 % faster after a change (SC-533).**
  Each time a tracker was redrawn (a stamina change, a hero added, a write from another pane or from Sync), the
  hover menu's placement code made the browser restyle the whole tracker twice more before anything was drawn.
  For a 25-hero tracker that was about 340 ms of an 850-900 ms redraw, in Reading view and Live Preview alike.
  The menu now measures its card in the next frame, once for every card drawn in that frame, and the redraw takes
  about 500 ms. Also fixed on the way: in Reading view, the hover menu of a block that starts below the first
  screen sat 1 px too low and 1 px too far left, on the card's top border; it now sits where it does on every other block.
