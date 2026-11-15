Fixed and ready to land: two motivations with the same name now share one labelled chip with a line saying so, and a motivation with no name is labelled "Unnamed Motivation". Nothing is blank any more.

{{IMG:sc640-r2-dup-names-card.png}}

Above is the real Obsidian card for a note with two "Higher Authority" motivations, in Reading view. The Argument tab shows one "Higher Authority" chip. Under it, in small grey italic text: "Higher Authority is listed twice; this chip stands for both."

{{IMG:sc640-r2-dup-names-motivations-dossier.png}}

Above is the Motivations list from the "Learn Motivation/Pitfall" tab. It reads "2 of 2 open" with the line "Higher Authority is listed twice; the Argument chip stands for both." Both Higher Authority rows are there, each with its own reason and its own "Mark spent" button. Before the fix, the second row's button flipped the first entry. Now each button writes only its own entry.

What changed for the Director:

- **Same name, one chip.** Two motivations (or two pitfalls) with the same name share one chip on the Argument tab, with the line above. The chip counts as spent if either entry is spent. Complete Argument marks both entries spent.
- **Casing and spaces don't matter** when matching names, the same rule as montage skills and heroes. "power" next to "Power" counts as the same name. A typed `motivationsUsed: [" higher authority "]` presses the Higher Authority chip. One press clears it, even if the list names it twice.
- **No name, still works.** The chip reads "Unnamed Motivation" (or "Unnamed Pitfall"), on screen and to a screen reader. That label is never written into the note.

These were my calls (from my first comment). Reply here if you want any of them changed.

---

**Mechanics**

- Plugin branch `sc640-negotiation-motivation-names` on dse develop `a9f0af1d` (after SC-639).
- Gates:
  - lifecycle 64/64
  - e2e `611/622 ok, 0 failed, 11 known-bug, coverage: 417/417 pairs`. The SC-640 markers NEGO-W04 and NEGO-W05 are now plain tests; NEGO-W12 and NEGO-W13 are new.
  - jest 13390 passed / 1 skipped
  - shots 592
  - freeze 280/280
  - parity 0/0/24
  - `styles.css` unchanged
- Independent review: LAND. No high or medium findings; all 32 mutants were caught. The two low findings were fixed.
- Code: `src/model/NegotiationData.ts`, `src/drawSteelAdmonition/negotiation/ArgumentView.ts`, `src/drawSteelAdmonition/negotiation/MotivationsPitfallsView.ts`.
