The Temporary Stamina "−" button and a lower typed value now lower temp, so a mistyped 50 can be fixed back to 5. This is ready to land; nothing is needed from you.

Your ticket repro now works: temp 5, "+" twice gives 7, "−" gives 6, and Apply writes 6 to the note. Typing 50, applying, reopening and typing 5 writes 5.

The temp field is now a direct edit, like the Stamina field. It cannot go below 0, and "−" is greyed out at 0 instead of silently doing nothing.

"Keep the higher" was meant to survive only on a "gain temp from an effect" path. No such path exists in the modal or anywhere in the plugin, so the rule is gone entirely and no new button was added.

**After one "−" from 7:** the field reads 6, "−" is enabled, and the Apply button reads "Gain 1 Temp Stamina" (5 to 6).

{{IMG:sc433-b-temp-6-after-minus-minus-enabled.png}}

**At temp 0:** "−" is greyed out and the Apply button reads "No Stamina Change".

{{IMG:sc433-c-temp-0-minus-disabled.png}}

**Also fixed:** the reviewer found a related bug that predates this ticket. If a note held a hand-edited negative temp (say −3), Damage 5 took 8 Stamina and the button promised a temp gain. A negative stored temp is now treated as 0. Opening and cancelling the modal still writes nothing. Any Apply on such a note writes temp 0.

**Left alone:** the initiative tracker writes `temp_stamina: 0` on creatures nobody touched. That is already Backlog ticket SC-485.

---

**Gates on dse `e4c5cf6`, rebased onto `develop` `424f47b`:**
- tsc and lint: clean.
- jest: 5711 passed, 1 skipped.
- lifecycle: 31/31.
- e2e: 101/101 ok, 0 failed, 0 known-bug, 66/66 coverage pairs. The 3 known-bug scenarios for this ticket now pass as plain tests, and 2 new ones were added.
- shots: 580.
- freeze: 280/280, with no rebaseline needed.
- parity: 0 gaps, 0 undeclared, 24 declared.

**Review:** an independent reviewer approved round 1. With the fix reverted, 9 of the branch's tests fail. The rebase and the negative-temp fix passed a second, scoped review; with only that fix reverted, 4 of its 5 new tests fail.

**Commits:**
- dse branch `sc433-temp-stamina-minus`: `7db087f fix and tests, 52271b1 e2e reopen fix, e4c5cf6 negative-temp fix`.
- Superproject `fb6a3f8 on origin/main 89bd345`: one CHANGELOG bullet.
