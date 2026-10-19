Catch Breath can no longer spend a Recovery for no healing. At full Stamina the button is disabled, and hovering it says why. Nothing for you to decide; this is ready to land.

**Before:** at 30/30 Stamina the Catch Breath button (the wind icon, bottom right) is lit and clickable. A click spent a Recovery and healed +0.
{{IMG:sc428-before-full-stamina.png}}

**After:** same state. The button is dimmed to half brightness and its hover text reads "Catch Breath: Already at maximum Stamina". A click does nothing.
{{IMG:sc428-after-full-stamina.png}}

What changed, all four items:

1. **Full Stamina:** Catch Breath is disabled, on both `ds-stamina` and the experimental hero sheet.
2. **Recoveries popover:** its "Catch breath" button is now really disabled whenever the main button is. That covers no Recoveries left, dying, and full Stamina, each with its own hover reason.
3. **Wrong reason fixed:** a recovery value of 0 now says "Recovery value is 0" instead of "Already at maximum Stamina". A hero whose class isn't resolved says "Max Stamina unknown".
4. **Keyboard focus:**
   - After you click a Recoveries marker, Tab and the arrow keys continue from it.
   - Pressing Catch Breath from the keyboard no longer loses your place.
   - A mouse click doesn't leave a focus outline behind.

All hover reasons come from one shared list, so the button, the popover and the stamina modal always say the same thing. They follow SC-324's pattern: the button's name first, then the reason.

Split out: clicking other card controls (track slots, power roll rows, tabs) has the same keyboard-focus problem as item 4. That is filed as SC-458.

---
Mechanics:
- DSE branch `sc428-catch-breath` @ `9ed8dc6` on `develop` `f818002`.
- Superproject CHANGELOG commits `700cfc8`, `b4243d4`, `30de11b`.
- Independent review: two rounds. Round 1 found 2 medium and 2 low issues (focus handling, reason wording, two weak tests); all are fixed. Round 2 verdict: land.
- Gates: tsc and lint clean · jest 4840 passed / 1 skipped · lifecycle 25/25 · e2e 68/76 ok, 0 failed, 8 known-bug (none SC-428), coverage 51/51 · shots 572 · freeze 276/276 (no shot changed) · parity 0 gaps.
- The 2 SC-428 known-bug e2e markers and all of its jest `test.failing` markers are now ordinary passing tests. Each was confirmed to fail on the old code.
