**Ready to land, built as you picked: option B. The menu of a DSE block at the top of a callout now works with the mouse in Live Preview and Reading view. Nothing is needed from you.**

What ships:
- The menu (Edit, Pin, Collapse/Expand) shows and can be clicked when the block is the first thing in a callout. A click no longer opens the callout's source or folds it.
- In Live Preview the menu sits about 14px further left there, clear of Obsidian's `</>` button (your option B).
- For question 2 you didn't pick anything else, so the default stays. If such a callout also holds something wider than the page, like a wide table, the whole callout scrolls sideways and its title scrolls with it.
- Callouts with the DSE block second, or with no DSE block, behave as before. So do blocks outside callouts.

One simplification since the ask: SC-540 (landed meanwhile) already stops callout clicks inside a DSE block from opening the source. The extra click handler I had added was redundant, so it is removed. The fix is now CSS only, in `styles-source.css`.

Filed along the way: SC-534 (e2e CHR-L01 flakes under load) and SC-561 (lifecycle G-S59 timed out once). Both happen on `develop` without this change.

---

Mechanics:
- dse `91e03844` on develop `248e202b`; workspace `cfbaab41`.
- Independent review: LAND, with no high, medium or low findings.
- Battery on `91e03844`:

| Gate | Result |
|---|---|
| tsc, lint | clean |
| jest | 6474 passed / 1 skipped |
| lifecycle | 52/52, new G-S49: real mouse on every menu button and on `</>`, plus a sideways wheel on a wide table, in both views |
| e2e | 128/128, 89/89 pairs |
| shots | 592, 0 FAIL |
| freeze | 280/280, no rebaseline |
| parity | 0 / 0 / 24 |
