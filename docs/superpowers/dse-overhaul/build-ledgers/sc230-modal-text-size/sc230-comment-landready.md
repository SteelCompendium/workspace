**Option A is in and the branch is ready to land. Dialogs scale with Text size, and the dialog title grows with the text.** Nothing else is waiting on you for this ticket.

Since your answer, I rebased the branch onto the latest develop (after SC-282, SC-340 and SC-243 landed). The rebase needed no conflict resolution and the change is identical. I re-ran every check, including the real-Obsidian block lifecycle check.

---

- Repo: draw-steel-elements, branch `sc230-modal-text-size`, head `1adfe29`, based on develop `e9bc15e` (fast-forward).
- Checks: tsc and lint clean; jest 4070 passed (7 new), 0 failed; Obsidian lifecycle 19/19 ok; shots 524, 0 FAIL, including the dialog text-scale anchoring check; freeze 260/260 unchanged; parity 0 gaps / 0 undeclared / 16 declared.
