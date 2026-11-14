Started: removing a condition with the mouse in the initiative tracker will keep keyboard focus on Add condition instead of dropping it to the page.

No decision needed from you. The ticket says what should happen, so I am treating that as the spec:

- Focus was on Add condition (or on another condition's remove button) and you click a condition's remove button: after the row redraws, focus is on the new Add condition button (or on that same other condition's button).
- Focus was not in the tracker when you clicked: nothing changes. A mouse click still never pulls focus into the tracker.
- Covers hero and creature rows, in Reading view and the pinned sidebar tracker. Live Preview losing focus on the tracker's own save stays with SC-602.

An implementer is fixing it now. Tests: a jest case that fails before the fix, plus a real-Obsidian test (Tab to Add condition, click a remove button, check where focus is), plus the reverse case. An independent reviewer checks it after that.
