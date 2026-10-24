Emptying the YAML box in the block edit form no longer saves a broken block. For a counter (and negotiation, party, encounter, values row, characteristics) the form now says "This block can't be empty. Add at least one setting, or press Cancel." and Save is off. Ready to land; nothing needed from you.

**It was real.** Reproduced first in jest through the real form, the real write and a re-render of the note. On the old code, clearing the box on a counter left Save on with no warning, wrote an empty block, and the block came back as a "failed to render" card. Same for negotiation, party, encounter, values row and characteristics.

**Counter, box emptied (real Obsidian):**

{{IMG:sc493-r2-shot-counter.png}}

The EDIT COUNTER dialog over a counter reading 3 Victories. The YAML box is empty. Under it the whole sentence reads "This block can't be empty. Add at least one setting, or press Cancel." The Save button (bottom right, next to the X) is disabled; a real click on it left the note unchanged.

**Montage and project still save an empty box**, because an empty montage or project is a valid block. After Save and reopening the note, the montage shows its default card, not an error:

{{IMG:sc493-r1-shot-montage-saved.png}}

The default montage card (titled MONTAGE TEST, round 1 of 2, no heroes, "Not started"). The line "After." below the block is unchanged.

**What changed:** the form now checks the box exactly the way the note will read it after Save. The code that reads a block's text moved into one shared place that both the note and the form use, so they cannot drift apart again. A check of 6,435 element-and-text pairs found no change in how any existing block renders.

**FYI, my call (say if you want it the other way):** for a block that cannot be empty, Save is refused. The other option was to save `{}` for you. I did not do that, because it writes text you never typed and quietly turns a deliberate clear into a default block.

**Also changed:** a ds-scc box that does not hold a usable code (for example empty, or plain words) now shows ds-scc's own message with Save off. Before, some of these saved and the note showed ds-scc's warning card.

**Two older problems found along the way, filed, not fixed here:**
- SC-509 (High): in real Obsidian, after any Save from the edit form the card on screen keeps its old content until you leave the note and come back. The file itself is updated. Not caused by this branch.
- SC-510 (Low): while you type a reference like `@Ref.md` into the box, the preview can stop on an error for the half-typed name.

---

Branch `sc493-form-empty-yaml`: dse efc17de on develop a993a60; superproject ca49bf6 (CHANGELOG bullet) on origin/main.
Gates on the tip: tsc + lint clean · jest 6003 passed / 1 skipped / 242 of 243 suites · lifecycle 36/36 · e2e 114/114 ok, 0 failed, 0 known-bug, 79/79 pairs · shots 592, 0 FAIL · freeze 280/280 · parity 0 gaps / 0 undeclared / 24 declared.
Review: implementer, then an independent reviewer (failing tests red on the old code, 8 deliberate breakages of the fix, real-Obsidian screenshots), one fix round, scoped re-review: land-ready, no findings left above INFO.
