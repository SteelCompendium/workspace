**Still ready to land, after one test-only fix. Nothing changes for users, and nothing is needed from you.**

The new real-Obsidian check for this ticket (G-S49) was listed after G-S56, which must run last. It now runs before it. Only the order of the checks changed. The plugin files are byte-identical to the build I reported earlier.

Correction to my last comment: SC-534 (the CHR-L01 flake) is already fixed and Done. The only open ticket filed from this work is SC-561 (lifecycle G-S59 timed out once).

---

Mechanics:
- dse `7bd8040b` (one commit on `91e03844`) on develop `248e202b`; workspace `cfbaab41`.
- G-S49 moved in `visual-harness/obsidian-lifecycle.mjs`; the move is pure (all 52 scenarios byte-identical) and was checked by the reviewer.
- Checks re-run on `7bd8040b`:

| Check | Result |
|---|---|
| lint, tsc | clean |
| lifecycle part 5 (G-S59, G-S49) | 2/2 |
| lifecycle part 4 (G-S57, G-S62, G-S61, G-S56) | 4/4 |

- The rest of the battery carries over from `91e03844`, because `main.js` and `styles.css` are byte-identical:

| Gate | Result |
|---|---|
| jest | 6474 / 1 skipped |
| lifecycle | 52/52 |
| e2e | 128/128, 89/89 pairs |
| shots | 592, 0 FAIL |
| freeze | 280/280 |
| parity | 0 / 0 / 24 |
