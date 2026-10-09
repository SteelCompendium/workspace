**Approve: re-pin all 131 dark-theme print-preview shots (`*--steel-print.png`) to their new bytes. Nothing else in the freeze baseline changes — every one of the 131 real-print shots (`*--steel-realprint.png`) is byte-identical to today's baseline.** "Sanctioned" is enough; the dispatcher applies the lines at landing and lands the branch.

## What you're approving

1. **The 131 preview-twin freeze lines move once**, because the fix changes what the preview looks like in a dark vault: white page and black text instead of black-on-charcoal. That is the whole visible consequence, and it is the point of the ticket.
2. **The 131 real-print lines do not move.** Verified in two clean sweeps by the implementer and again by the independent reviewer. The PDF export is unchanged.
3. **No frame** around the page — option A, as you ruled ("option A is great, go ahead.").

## Before / after (left = the frozen baseline shot today, right = the new bytes; same fixture, same crop)

Statblock — left: black title and dark-grey labels on the charcoal card; right: white page, black text throughout:

{{IMG:sc127-pair-statblock-charline-two.png}}

Ability card — same change:

{{IMG:sc127-pair-feature.png}}

Initiative tracker — left: hero names in pale grey inside white boxes, the malice-log button invisible (charcoal on charcoal); right: black names on the white page, light input fields, and the "Malice log · no entries" button readable:

{{IMG:sc127-pair-initiative.png}}

The only pale text left on the new pages is the role chip ("Leader", "Signature Ability", "Villain Action N"), which prints light grey on white on every print surface including the real export today. That is SC-348 and is deliberately not part of this change, because fixing it moves the real-print shots.

## What else this branch carries (for the record; no decision needed)

- The preview now draws its paper on screen only and points the Obsidian tokens the plugin reads at the light palette, in a dark vault only. Text colour applies on screen and on paper. Verified in real Obsidian in round 1 (dark theme, Print preview ON: title contrast went from 1.23:1 to readable black on white).
- The preview-vs-real-print harness gate is tighter: inside an element, text and border colours may no longer differ between the two; the native-control allowance is gone; and a hole where hidden chrome buttons excused almost every element root is closed. Three new guards: a jest test pinning the paper rule, an in-run check that the generated light block is complete and resolves correctly on a dark-vault preview, and a can-fail self-test for the paper exemption. The independent review ran four rounds: it found hover/focus fields going charcoal, a table-header border, the caret, placeholder and list-marker colours, a self-test that did not exercise the real check, two guard-code holes, and a regression where a custom accent colour would have shown the default purple in the preview; all fixed and re-reviewed.
- Docs: Settings, Styling statblocks and Advanced usage pages say the preview shows its own white page regardless of theme; the print-preview docs image is regenerated; CHANGELOG has the Unreleased bullet; the dse-verify skill's old note calling the dark twin a "harness capture artifact" now says it was this bug.

## Mechanics (below the ask, for the dispatcher)

- Branch `sc127-print-preview`, dse `5329c56` (base `origin/develop` `9ded832`), superproject `17e1291`.
- Battery: tsc/lint clean; jest 4252 passed / 1 skipped / 214 of 215 suites; shots 544, 0 FAIL, deterministic across two clean sweeps; freeze exactly 131 `*--steel-print.png` FAILED / 0 `*--steel-realprint.png` FAILED / 0 missing against the 262-line baseline; parity 0 GAPs / 0 undeclared / 24 DECLARED, exit 0.
- Rebaseline file: `.superpowers/sdd/sc127/sc127-rebaseline.txt` (131 `<sha256>  <filename>` lines, twin only, baseline order), deterministic across two clean sweeps; the reviewer reproduced the hashes independently.
