**Ready to land: a block edit form's Save never writes into another, identical block anymore. When the form's own block was changed or deleted elsewhere, Save writes nothing, shows the Notice, and keeps the form open.** No action needed from you; this is a record of what changed.

This is your ruling ("Save nothing with a notice is fine"), applied to every edit form. Before, only the forms SC-552 had kept open after Obsidian rebuilt their card worked this way.

**What you'll see**
- The Notice reads: "Draw Steel Elements: a change to a block in <note> was not saved — the block changed on disk first."
- It shows on every refused Save, including a quick second Save. Before, the Notice was limited to one per note every 5 seconds, so a second Save showed nothing.
- The form stays open with your edit, so you can close it, reopen it on the updated block and redo the edit.

**Also fixed along the way: embeds and hover previews**

The review found that forms on embedded blocks (`![[note#Heading]]`, `![[note#^id]]`) and in hover previews had the same problem, or could not save at all in long notes. They now find their block through the embed's link and check it is really there before writing. Two of these were wrong before this ticket too:
- a block embed whose note holds an identical block elsewhere wrote into that other block;
- a hover preview over such a link did the same.

When the plugin can't tell which block an embed or preview shows, Save writes nothing and shows the same Notice. Nothing is lost.

**Known costs, all refusals and never wrong writes**
- In that "can't tell" case, the Notice still says "changed on disk first" even when nothing changed. I kept your approved wording.
- Two rare shapes refuse a Save that could have succeeded. One is pressing + and then the pencil inside a hover preview. The other is a `^id` embed of a callout with text after the counter, when an identical callout exists elsewhere. Both are filed as SC-584 (Backlog, Low).

---
Mechanics
- dse branch `sc556-outside-edit-open-form` at `f69b8fd6`, on develop `10db67e3`. Superproject `5c5641e7` (both CHANGELOGs).
- Gates:
  - tsc and lint: clean.
  - jest: 6634 passed / 2 skipped / 258 of 259 suites, 44 new tests.
  - lifecycle: 52/52. G-S64 was extended with steps for outside edits, deletion, embeds, + then pencil, and hover previews.
  - e2e: 163/164 ok, 0 failed, 1 known-bug (SC-572), coverage 113/113.
  - `styles.css` is byte-identical to develop's, so shots, freeze and parity carry.
- Review: an independent reviewer ran four rounds. It found one HIGH and four MEDIUM issues, all fixed. 21 of its 21 deliberate code breakages (mutations) are caught by the tests.
- SC-480, which changes the same save code, can start after this lands.
