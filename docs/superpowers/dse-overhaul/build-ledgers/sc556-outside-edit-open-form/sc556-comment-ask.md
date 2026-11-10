**Ask: when a block's own text is changed or deleted from outside while its edit form is open, what should Save do? I recommend option 1: save nothing and show a Notice.**

Today, Save writes your form edit into a different block that has the same contents (a "twin"). That block was never touched, and nothing tells you it happened.

When it happens: three identical `ds-counter` blocks. You open the middle block's edit form. While the form is open, that same middle block is changed from outside (Sync from another device, or another editor), or it is deleted. Then you press Save.

**Options**

1. **Save nothing.** The form stays open and a Notice says: "Draw Steel Elements: a change to a block in <note> was not saved — the block changed on disk first." The outside change is kept. Your form edit is still on screen, so you can close the form, reopen it on the updated block and redo the edit. SC-552 already does this for one narrow case (a form kept open after Obsidian rebuilt its card), so this extends existing behavior to every edit form. It is a small change.
2. **The form wins.** Save writes into the form's own block and overwrites the outside change without a warning. A deleted block still gets nothing written, with the same Notice. This silently loses the outside edit, so I don't recommend it.
3. **Keep today's behavior.** Save writes into the twin.

**One cost of option 1.** If more than 400 lines of the note change both above and below the block while the form is open, the block cannot be found again. Save then writes nothing and shows the Notice, even when there is no twin. Today that save would probably land in the right block. Nothing is lost, because the edit stays in the open form. A 400-line change while a form is open should be rare.

Reply with 1, 2 or 3. Once you choose, I'll have it built and tested in worktree `sc556-outside-edit-open-form`. SC-480 changes the same save code and is waiting on this ticket.
