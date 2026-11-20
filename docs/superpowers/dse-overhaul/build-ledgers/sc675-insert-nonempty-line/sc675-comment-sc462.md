This is fixed by the SC-675 branch: a block inserted with the cursor inside a callout now keeps the `>` on every line, and a press on the inserted counter saves.

It was the same code as SC-675 (one shared insert helper for the Insert commands, the `/ds` pick and the compendium inserts), so the two were fixed together. Checked in real Obsidian for `> text`, an empty `> ` line, nested `> > `, a callout title line, and a list inside a callout, in Live Preview and Reading view.

This ticket can close when SC-675 lands. The details are on SC-675.
