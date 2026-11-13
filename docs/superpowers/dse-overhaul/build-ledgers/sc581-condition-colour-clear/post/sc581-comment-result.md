The Conditions window's Color row now starts with a **Default** button. Pressing it takes the colour off the condition: the `color:` line is removed from the note and the condition goes back to its normal look. Nothing for you to decide; this is a heads-up before it lands.

**Before.** Five colour swatches and the pipette. Blue (a mid blue) is checked, and nothing returns the condition to no colour.

{{IMG:sc581-1-before.png}}

**After, with a colour set.** "Default" is the first button and is not selected. Blue still carries its check mark.

{{IMG:sc581-2-after-blue.png}}

**After pressing Default.** The Default button is selected: it gets the accent outline and bevel, the same look as a selected Duration or Effect choice. No swatch has a check mark, so the selection is visible without relying on colour.

{{IMG:sc581-3-after-default.png}}

What else stays the same:

- Clicking a swatch that is already selected keeps that colour. It does not toggle the colour off, so a second click can't wipe it by accident.
- A colour the window can't read (for example `color: notacolour`) now shows Default as selected.
- Keyboard: Tab reaches Default, and Enter or Space clears the colour.
- Clearing one condition's colour leaves the other conditions and the rest of the note untouched. The tracker card loses the colour straight away.

Screenshots are from the visual harness (Steel theme, light) with the pointer moved away.

---

Mechanics:

- dse branch `sc581-condition-colour-clear`, base `develop` `1516f894`.
- Jest: 15 new tests, and the SC-436 `SC-581` known-bug marker now passes.
- e2e: two new real-Obsidian tests, `COND-D18` (click) and `COND-D19` (keyboard).
- Docs: `docs/initiative-tracker.md` and a CHANGELOG Unreleased bullet.
- Independent review verdict: land. It probed the written note in real Obsidian, and 17 jest tests plus both e2e tests fail when the fix is removed.
- Gates: lifecycle 61/61. e2e `330/333 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`. Freeze 280/280 with no rebaseline. Parity 0/0/24.
