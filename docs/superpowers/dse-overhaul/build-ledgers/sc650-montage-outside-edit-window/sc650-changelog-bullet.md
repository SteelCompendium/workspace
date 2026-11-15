- **DSE plugin: an outside change to the note while a Montage window is open now closes the window with a Notice and returns keyboard focus to the Montage (SC-650).**
  The windows are Log an action, the edit sheet of a logged action, Add a hero and Set limits; the views are Reading view, Live Preview and the pinned sidebar.
  A change from outside (Sync, another pane, another app) that alters the Montage redraws it; the window used to vanish silently and focus fell to the top of the page.
  Now a Notice says "The note changed outside, so this window closed without saving" (what you typed in it is dropped, so it can never overwrite the outside change)
  and focus goes to the control in the redrawn Montage that you opened the window from, or the nearest one when that control is gone. A window opened with the mouse shows the Notice but moves no focus.
  A change elsewhere in the note that leaves the Montage alone keeps the window open, and the Montage's own saves and Escape are unchanged (no Notice).
  **In the pinned sidebar, a Montage window's save after an outside change was silently lost:** the window stayed open, wrote into a stale copy of the Montage, and nothing reached the note.
  It now closes the same way when the Montage changed, and when the change was elsewhere in the note the window stays open and its save writes.
  The same fix also shows the Notice for an initiative tracker window when one outside change removes a tracker above it and changes this one.
