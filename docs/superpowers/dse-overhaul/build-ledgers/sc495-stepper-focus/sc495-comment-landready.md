Steppers now keep keyboard focus when "−" or "+" turns itself off at the lowest or highest value. Focus moves to the number beside the button, with the usual focus outline, instead of falling off the button. No action needed from you; this is ready to land.

**What a keyboard user sees now**
- Steppers you can type into (Temporary Stamina, Stamina, counters, characteristics): focus moves into the number box, so Enter and Space keep working.
- Steppers that only show their number (the roll bar's Edges and Banes): focus moves to the number, which shows the focus outline. The number does not become an extra Tab stop, so the Tab order of every surface is unchanged.
- Focus never jumps to the opposite button. Holding Enter on "−" would otherwise bounce the value back up.

**Mouse and touch behave as before.** A click or tap that reaches the limit moves no focus, even if that button had keyboard focus a moment earlier. The first version moved focus into the number box on a click too, and the reviewer showed that a mouse wheel over the box then changed the value (Temporary Stamina 0 became 2, and in a note the changed number was written on the next click). On a phone it could also have raised the on-screen keyboard. So only a keyboard press moves focus.

**One correction to the ticket.** On Obsidian 1.14.4 the next Tab did not restart at the top of the page; it carried on from where the button was. What users lost was the focus outline, a working Enter and Space, and their screen reader position. The changelog says it that way.

---

Mechanics:
- Fix is in the shared kit stepper (`src/framework/kit/stepper.ts`). A press counts as keyboard when its click event has `detail === 0`. Plus one CSS selector joined to the existing focus-ring rule (no new token).
- New real-Obsidian e2e tests: STAM-SF01-03 (Stamina modal, keyboard and mouse, incl. the wheel check), CTR-F01/F02 (in-note counter through a note write and redraw; mouse after keyboard writes nothing), ROLL-SF01 (roll bar Edges and Banes to both limits). New control ids are attributes only.
- Gates on dse `c98bd82` (on develop `66f474b`): tsc/lint clean; jest 5872 passed / 1 skipped / 241 of 242 suites; lifecycle 34/34; e2e 114/114 ok, 0 failed, 0 known-bug, coverage 79/79 pairs; shots 592, 0 FAIL; freeze 280/280; parity 0 GAPs / 0 undeclared / 24 DECLARED.
- Independent review: three rounds, approved with no open findings. 9 of 9 deliberate breakages of the fix turned a test red.
- Superproject CHANGELOG `0bc6b50` on origin/main `29109b0`.
