**Your call, no rush (it does not block landing):** I made four choices on my own. Tell me if you want any of them changed.

1. **Only these nine types get the new card.** A type the plugin has never seen still shows "has no renderer", so a broken structured type can't quietly turn into a plain text card. The alternative is to show any unknown type as text.
2. **Chapters are short:** the title, the chapter's first paragraph, and an "Open chapter" link to the chapter note in your vault. "For the Director" is 183 KB, too long to show in full in a note. Two side effects: the `Monsters` chapter starts with a table, so its card is the title and the link only. For `The Summoner` and `The Beastheart and the Faeries`, the first paragraph is a short piece of fiction, not a summary.
3. **Projects get the same text card for now.** A card like the site's (prerequisite / source / roll / goal rows) is filed as SC-704.
4. **The small label above the title is the plain type:** Skill, Skill group, Monster group, Saint, God, Chapter, Project, Movement, Negotiation. Wording built from the data, like "God · Vasloria", would be a follow-up.

---

**A `ds-scc` reference to a skill, god, saint, chapter, project, movement, negotiation, skill group or monster group now shows a card instead of "has no renderer".** That covers all 219 entries that used to fail. The insert command's compendium list is unchanged and still offers every entry.

Each card has the same frame as the rule cards: crest, type label, title, then the entry's text. Links inside the text work.

A god (dark theme): {{IMG:sc391-god-dark.png}}

A skill group with its table (light theme): {{IMG:sc391-skill-group-light.png}}

A chapter, short form with the "Open chapter" link (dark theme). Links are teal and always underlined: {{IMG:sc391-chapter-dark.png}}

**What it did not change:** no existing card's printed bytes moved (freeze 280/280). The stylesheet gains one rule, scoped to the new card: it hides the empty strip under the title of the two chapters that have no text of their own. A check over the whole compendium found that exactly those 219 entries changed how they render. Nothing else moved.

**Filed while doing this:**
- SC-704: a dedicated project card.
- SC-705: the site's data has links that start mid-word. For example, the movement card shows "l" followed by a linked "and prone", where the book says "land prone". This bug is upstream, in steel-etl, and this ticket made it visible in the plugin.

---

Mechanics: new internal family `prose` (not a user-facing fence), reusing the rule card's path (`genericNoteAdapter` → `DisplayCardView`). Code only in draw-steel-elements. Branch `sc391-scc-prose-renderers` @ `44bab481` (on develop `4b233886`).
Gates: tsc + lint clean · jest 14806 passed / 1 skipped · lifecycle 64/64 · e2e 845/854 ok, 0 failed, 9 known-bug, 487/487 pairs (new PROSE-C01 / C02: the card renders in real Obsidian, and clicking "Open chapter" opens the chapter note) · shots 636 (592 + 44 new) · freeze 280/280 · parity 0 / 0 / 24.
Implementer → independent review (LAND, 3 low findings, all fixed) → scoped re-review of the fix (LAND). Code is ready to land; landing is queued.
