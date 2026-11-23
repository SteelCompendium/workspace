**Ask (unchanged, one answer closes this ticket): is Card size the slider you meant, and is the 30% look what you expected?**

The change is now landed on `develop`: the Card size slider in Settings → Typography goes from 30% to 120%. It is not in a release yet — it will be in the next build you cut from `develop`.

What to check, in your vault after a rebuild from `develop`:

- Settings → Typography → Card size: drag it to the far left. It should read 30%.
- Open a note with a statblock. The card keeps the full width of the note and its content shrinks, so the card gets much shorter. The comment above has the picture of 100%, 80%, 50% and 30% side by side.

If you meant a different slider (Text size, or Small / Large / Control text size), or you wanted the card itself to get narrower, say so here and I'll pick it up. If it is what you wanted, mark the ticket Done.

---

Mechanics

- `draw-steel-elements` `develop` @ `aee83dc1`; workspace merge `040454e3` on `main`.
- Ledger kept at `docs/superpowers/dse-overhaul/build-ledgers/sc683-scaling-30pct/`.
