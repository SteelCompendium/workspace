Landed. `ds-hero` is now hidden for 7.0.0 — it has no docs page, no command-palette insert, and no `/ds` entry, while a hand-typed `~~~ds-hero` block still renders and stays fully interactive. Exactly the contract you set: code kept, feature unadvertised.

Mechanics, for the record:

- The approved branch sat 33 commits behind `develop` (SC-186 through SC-205 landed in between), so it was rebased onto the current tip and the full battery re-run before landing: tsc/lint clean, jest 3259 passed / 1 skipped, shots 474 PNGs deterministic across two runs, freeze 210/210 with zero mismatches (no baseline change — docs/discovery-only, as expected), parity 0 gaps / 0 undeclared / 16 declared.
- A drift check confirmed none of the 33 intervening commits had reintroduced `ds-hero` advertising anywhere.
- Landed as `draw-steel-elements` `6035d12` on `develop`; a regression test pins the hide so a future change can't silently re-expose it.
- **SC-194** (already filed) carries the stabilization/QoL pass and the un-hide instructions for 7.1+.

Closing this ticket.
