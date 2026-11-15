Work has started: two motivations with the same name will share one labelled chip on the Argument tab, with a line on the card saying they share a name, and a motivation with no name will be labelled "Unnamed Motivation".

These are my calls, not yours to make unless you disagree. Reply here to overrule any of them before review finishes.

1. **Same name, one chip.** The note records an appeal by name only (`motivationsUsed: [Higher Authority]`). So two entries with the same name can't be chosen separately. Two chips that press together would be the mirroring bug from SC-627. The Argument tab draws one chip for the name and a note such as "Higher Authority is listed twice; this chip stands for both." Pitfalls work the same way.
2. **Every row still keeps its own Spent chip.** On the Motivations list, each entry keeps its reason and its own Spent chip. Today the second row's Spent chip flips the first entry. After the fix it flips only its own entry. The shared chip counts as spent if either entry is spent.
3. **Casing and spaces are ignored when matching names**, the same rule as montage skills and heroes (SC-627, SC-631). "power" next to "Power" counts as a duplicate. A typed `motivationsUsed: [" higher authority "]` presses the Higher Authority chip.
4. **No name: the chip still works.** It reads "Unnamed Motivation" (or "Unnamed Pitfall") on screen and to a screen reader. That label is never written into the note.
