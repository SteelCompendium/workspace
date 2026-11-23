**Ask: confirm that "Card size" is the slider you meant, and that 30% looks the way you expect. Nothing else is needed from you — the change is reviewed and ready to land on `develop`.**

The **Card size** slider in Settings → Typography now goes from 30% to 120%. It used to stop at 80%. The other four sliders are unchanged.

Three things to know before you say yes.

**1. I picked Card size.** The ticket says "scaling can go to 80%". Text size already goes down to 60%. Card size and the three Small / Large / Control text size sliders all stopped at 80%. Card size is the one that shrinks a whole card, so I changed that one only. If the request was about a different slider, say which and I'll move it.

**2. A card at 30% gets shorter, not narrower.** Card size shrinks what is inside the card. The card itself still fills the width of the note. The statblock below is 3740 px tall at 100% and 1093 px tall at 30%, and 760 px wide at both. The slider already worked this way at 80%. At 30% the smallest text is under 4 px tall, so it can't be read at normal zoom — it is a "see the whole statblock at once" size.

{{IMG:sc683-A-statblock-contact-sheet-100-80-50-30.png}}

*The same statblock (Human Bandit Chief) at Card size 100%, 80%, 50% and 30%, left to right. Each column has its value in white text above it. The four cards are the same width; only the content inside and the height shrink.*

**3. The Card size thumb is no longer in the middle at 100%.** The maximum is still 120%, so 100% now sits about three quarters of the way along the track. The other four sliders still sit in the middle at 100%.

{{IMG:sc683-C-settings-typography-card-size-100.png}}

*Settings → Typography with every slider at 100%. The Card size thumb (second slider) sits right of centre; the other four thumbs sit mid-track. The help text under Card size now reads "(30%–120%)".*

{{IMG:sc683-C-settings-typography-card-size-30.png}}

*The same page with Card size at its new minimum: the value reads "30%" and the thumb is at the far left end of its track.*

**Not changed**

- Print and export still always use 100%.
- Text size (60%–140%) and the Small / Large / Control text size sliders (80%–120%).
- The Steel Compendium website's own Card size slider still stops at 80%. Say so if you want that lowered too; it would be a separate ticket.
- Saved settings: any value you already had (80%–120%) is kept as it is.

---

Mechanics

- Plugin branch `sc683-scaling-30pct` @ `aee83dc1` on `develop` `9be108c9`: `CARD_SCALE.min` 0.8 → 0.3 in `src/prefs/scale.ts`, help text in `src/prefs/catalog.ts`, tests, `docs/settings.md`, `docs/styling-statblocks.md`, both changelogs.
- Gates: tsc and lint clean · jest 14439 passed, 1 skipped (one new test) · lifecycle 64/64 · e2e `794/805 ok, 0 failed, 11 known-bug, coverage: 476/476 pairs` · shots 592 · freeze 280/280 (no print bytes moved) · parity 0 / 0 / 24.
- Independent review: one finding (a stale line in the plugin changelog), fixed and re-checked. Putting the minimum back to 80% fails 10 tests.
- Checked at 30% and 50%: no content spills outside the card, a card nested inside another card is shrunk once (not twice), and a card inside a dialog shrinks the same way.
