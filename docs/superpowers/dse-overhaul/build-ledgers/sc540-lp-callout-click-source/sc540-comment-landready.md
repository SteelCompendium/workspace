In Live Preview, clicking a button on a card inside a callout no longer turns the callout into its markdown. The card stays drawn, the click saves, and the cursor and scroll position stay where they were. Ready to land; nothing is needed from you.

**Before:** after + on a counter inside a `> [!note]` callout, the callout showed its markdown, with the cursor inside it:

{{IMG:sc540-r1-base-callout-raw-after-plus.png}}

**After:** the same click. The callout "Camp" is still drawn as a card and the counter reads 6:

{{IMG:sc540-r1-head-callout-card-after-plus.png}}

Buttons that redraw the whole card (an initiative tracker's **Advance round**, a project's **Add project roll**) are fixed too. Here the callout "Init" is still a card after Advance round, at Round 2:

{{IMG:sc540-r3-head-advance-round-callout-card.png}}

**What else stays a card now, where it used to show markdown:** Enter or Space on the edit pencil, a click on the card's text, double- and triple-click, a drag across the card, closing the Stamina window, the collapsed card's Expand, and a callout inside a callout.

**Also fixed:** Advance round on a tracker in a note embedded into another note (`![[…]]`) no longer selects the embed. This case was left over from SC-522.

**Unchanged, as Obsidian does it:**
- A click on the callout's own text, its title or its `</>` button still opens the callout's markdown.
- The fold arrow on a foldable callout still folds.
- Links inside a card still open: a plain click opens them here, Ctrl-click opens a new tab, and Ctrl-hover shows the preview.
- Reading view and plain code blocks outside a callout behave as before.
- No pixel changes anywhere.

**How:** Obsidian's callout skips a click that lands inside an element carrying the class `interactive-child`. DSE now puts that class on a card's root when the card sits inside a Live Preview callout, the same way SC-522 does for embeds. When a button rebuilds the card during the click, the class also goes on the detached old copy, which is where Obsidian looks. The click is not stopped or cancelled, so links and checkboxes keep working.

SC-463 describes the same bug and can be closed as a duplicate of this one.

---
Mechanics:
- Plugin `f7c9c7ce` on develop `eafe76e1` (changes in `src/framework/pipeline.ts` only, plus tests). Superproject `0fa76a10` (CHANGELOG bullet).
- New lifecycle scenario G-S62 (9 phases). It fails on the old build and passes on the fix.
- Gates: tsc and lint clean · jest 6297 passed / 1 skipped / 251 of 252 · lifecycle 47/47 · e2e 128/128, 0 failed, coverage 89/89 · shots 592, 0 FAIL · freeze 280/280 · parity 0 gaps / 0 undeclared / 24 declared.
- Reviewed by an independent reviewer in real Obsidian 1.15.0. The first review found the Advance round case; the fix round closed it, and a re-review of that fix said land. The re-review also clicked every visible button of all 19 card types inside a callout: none opened the markdown. Before the fix round, 13 of 52 did.
