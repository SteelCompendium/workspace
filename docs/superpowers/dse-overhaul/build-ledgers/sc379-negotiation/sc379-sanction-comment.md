**Approve: the negotiation tracker is rebuilt as you picked (A1 gauges, buttons in the tab), and its 6 frozen print shots move with it. Reply "sanctioned" if the screenshots look right; say what to change if not.**

Built, reviewed and gated on branch `sc379-negotiation`. Nothing is pushed or landed until you answer.

## What you're approving

1. **The new tracker** — the six screenshots below. Patience is a horizontal rail of round numbered seals; Interest is a vertical rail of the same seals down the outcome list; the appeal and pitfall buttons stay inside "Make an Argument"; the bottom cards only carry "Mark spent"; the gold "Final offer" band appears when the negotiation ends.
2. **A sanctioned rebaseline of 6 frozen print lines** — `negotiation`, `negotiation-checked`, `negotiation-pr-checked`, each × `--steel-print` + `--steel-realprint`. Only the negotiation element's print moves; nothing else's does (verified by a byte comparison of a clean base sweep against the branch, and by the independent reviewer). The print before/after is the last image.
3. **An additions-only widening of 6 new print lines** for the new captures `negotiation-appeal`, `negotiation-ended`, `negotiation-narrow`. Widenings don't need your word; listed for the record.

Approve = the dispatcher lands the branch and applies the 6 + 6 lines. Decline = tell me what to change and it goes back for a round.

## Default state (Interest 3, Patience 3), dark

{{IMG:sc379-final-default-dark.png}}

Remaining Patience is silver seals on a solid steel line; spent slots are hollow dashed grey; the current value is a solid teal seal with a teal ring and a "3 / 5" readout. The current Interest row has a teal outline and a "NOW" tag. Motivations are marked with a diamond, pitfalls with an orange warning triangle — the shape tells them apart, not the color.

## Mid-argument: Higher Authority appealed, 12–16 chosen

{{IMG:sc379-final-appeal-dark.png}}

The pressed chip has a teal border, a check and bold text. The tier rows switched to the motivation table the moment the chip was pressed. The chosen row has a teal ring and "✓ CHOSEN"; Complete Argument turns solid teal only once a tier is chosen, and its hint says what it will do. Greyed-out modifiers say why in italics.

## After a motivation is spent

{{IMG:sc379-final-checked-dark.png}}

A spent motivation shows a hollow diamond, a struck-through name and the word "spent" in the tab, and a "✓ Spent" chip on its card ("1 of 2 open").

## Negotiation over (Patience 0)

{{IMG:sc379-final-ended-dark.png}}

Gold top rule, gold flag, "FINAL OFFER", and the sentence quoting the outcome. The tier rows go static and Complete Argument is disabled with a hint pointing at ⋮ → Reset.

## Light theme

{{IMG:sc379-final-default-light.png}}

## Sidebar width (300px)

{{IMG:sc379-final-default-dark-narrow.png}}

## Print, before and after (the rebaseline)

{{IMG:sc379-s2-review-freeze-negotiation-sidebyside.png}}

Left: today's print — a bare grey Patience bar, a plain Interest list, checkbox lists. Right: the new print — numbered seals on both rails, the framed outcome table, labelled buttons, and the two cards. Black on white in both.

## Also fixed in this build

- Complete Argument can no longer write Interest or Patience outside 0–5 (it could write −1, 6, or "31" from a quoted YAML number).
- The argument tab now resets after Complete Argument instead of keeping stale ticks.
- The tooltip now says a motivation appeal makes the test "Medium", matching the Heroes book.
- The Patience seals keep the 44px touch target on touch devices.
- Docs page `negotiation-tracker.md` rewritten for the new layout; the hand-recorded `negotiation.gif` still shows the old tracker — re-record filed as SC-388.

## For the record

- Branch `sc379-negotiation` @ `e0ee273` on plugin `develop` `1ac4e5a`; workspace superproject carries the CHANGELOG bullet.
- Gates: tsc/lint clean · jest 4309 passed / 1 skipped · lifecycle 19/19 · shots 556, 0 FAIL · freeze exactly the 6 lines above · parity 0 GAPs / 0 undeclared / 24 declared.
- Pipeline: implementer → independent review (3 MEDIUM, 2 LOW, all fixed) → fix round + slice 2 → re-review (APPROVE, 3 LOW test/docs items fixed).
- No change to the YAML you write in notes.
- Rebaseline file: `.superpowers/sdd/sc379-negotiation/rebaseline.txt` (6 lines, identical across two clean runs, reproduced by the reviewer); widening: `widening.txt` (6 lines, 0 collisions).
- Follow-ups filed: SC-380 (move montage + recoveries onto the shared track part), SC-388 (re-record the docs gif). SC-349 (harness cuts captures at 1200px) noted; it also cuts the new `negotiation-ended`/`-narrow` captures below the band.
