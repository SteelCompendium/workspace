Started: after the fix, clicking a creature in the roster while typing in a tracker text box (for example the Malice quick-add amount) will move keyboard focus to that creature's cell instead of dropping it to the page. What you typed in the box stays.

No decision needed from you. The ticket states the expected result, and it is the same rule SC-609 already uses when focus is on a button. A click while focus is outside the tracker will still not pull focus into it.

Scope: Reading view and the pinned sidebar tracker, with real-Obsidian tests for both the fix and the "focus outside" case. Live Preview will be checked and reported. The general "a click on a card control moves focus to it" (SC-458) stays its own ticket.
