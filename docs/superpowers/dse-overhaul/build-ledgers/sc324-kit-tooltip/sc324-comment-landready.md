Kit icon buttons now show their full hover text. Respite, Complete Argument, the compendium migration's "Sync without moving", Roll save and Advance round now show the explanation that used to be thrown away. Disabled Spend Recovery and read-only Catch Breath now keep their button name in front of the reason.

The fix is land-ready. Nothing is needed from you unless you dislike one of the strings below.

**What changed.** Obsidian uses one attribute (`aria-label`) for both the hover text and the screen-reader name. The kit had two options (`label` and `tooltip`) for that one attribute, and quietly kept `label`. I removed the `tooltip` option. Each button now has one `label`, written to work as both the hover text and the spoken name, with the action first.

I chose this over "tooltip wins" (option a in the description). With option a, the condition buttons would have lost their action in the spoken name: "Grabbed" instead of "Remove condition: Grabbed".

**New hover/spoken strings** (unchanged buttons are omitted):

| Button | Before (hover showed) | Now |
|---|---|---|
| Hero Respite | Respite | Respite: Restore Stamina + Recoveries; clear Surges, temp Stamina, and end-of-encounter conditions |
| Hero Respite, read-only | Respite | Respite: Read-only in this context |
| Negotiation Complete Argument | Complete Argument | Complete Argument: Resolve the Argument using the current state of motivations, pitfalls, etc. (new line) Requires a Power Roll tier to be selected. |
| Compendium migration | Sync without moving (links will break) | Sync without moving: Downloads the new compendium and leaves your old files where they are. Links to compendium notes will stop working, and the move can no longer be done. |
| Conditions Roll save | Roll save vs Grabbed | Roll save vs Grabbed (6+ ends) |
| Initiative Advance round (with a Malice gain) | Advance round | Advance round (+3 Malice) |
| Stamina modal Spend Recovery, disabled | No Recoveries remaining (no button name) | Spend Recovery: No Recoveries remaining (or: Spend Recovery: Already at maximum Stamina) |
| Catch Breath, read-only | Read-only in this context (no button name) | Catch Breath: Read-only in this context |

Hovering a button whose text changes while the tooltip is showing now updates the tooltip too. Before, it kept the old text.

**Gates** on dse `sc324-kit-tooltip` @ `f8e050f` (rebased on `develop` `7644fb3`, after SC-430): tsc and lint clean · jest 4767 passed / 1 skipped (+6 new tests) · lifecycle 25/25 · e2e 61/72 ok, 0 failed, 11 known-bug, coverage 47/47 · shots 572, 0 FAIL · freeze 276/276 (no pixels moved) · parity 0 gaps / 0 undeclared / 24 declared. An independent reviewer re-ran the battery, checked the hover in a real Obsidian, and confirmed the new tests go red when the fix is reverted.

Not done here: SC-428 (the stamina modal's "Already at maximum Stamina" bug) is still open; its known-bug test is kept failing on purpose.
