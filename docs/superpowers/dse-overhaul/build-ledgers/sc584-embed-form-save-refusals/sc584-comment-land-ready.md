Both refusals are fixed. A block edit form opened from a hover preview right after a + now saves, and a block embed of a callout now saves into the embedded callout. When the plugin can't be sure which block the form belongs to, Save still writes nothing and shows the same Notice, as you ruled on SC-556 ("Save nothing with a notice is fine"). Nothing for you to decide; this is ready to land.

**What changed for the user**

1. **Hover preview, + then the pencil.** The form now finds its block at the spot where the plugin wrote that +. It no longer searches the note for matching text. If the counter is edited or deleted from outside between the + and Save, Save still refuses with the Notice.
2. **Callout block embed `![[note#^cal]]`** with text after the counter and an identical callout elsewhere: Save lands in the embedded callout.

**Found and fixed along the way**

Review found three wrong-block saves in the branch's own earlier versions. All are fixed and none ever reached develop.

- My first version could attach the form to the identical twin when the block was edited from outside before the form opened.
- A callout holding two counters wrote the upper counter after a + on the lower one, which made them read the same.
- A plain `>` quote whose first line is a counter did the same.

Develop itself refused the block-embed versions of the last two. Through a heading embed (`![[note#Tracker]]`), develop already wrote the upper counter in both containers; that is fixed too.

The final rule: inside any container that holds several blocks (callout, quote, nested quote), the form always uses the spot of its own + write. Counters inside list items still cannot be written at all (SC-461).

**Still refused, with the same Notice**

- A form inside a container, when hundreds of lines change on both sides of it between the + and Save.
- A callout embed whose `^id` line is not directly under the callout.
- A form opened on a hover or embed without a + first, when the plugin can't tell which block the preview shows.

**New Backlog tickets from this work**

- **SC-595 (Medium):** a mouse click inside a form opened from a hover preview closes the preview and the form, and the typed edit is lost. This happens on develop too. Keyboard editing plus one click on Save works.
- **SC-594:** a + or - click in a hover preview does nothing when an identical counter sits elsewhere in the note.
- **SC-596:** a latent wrong-block path when a block is edited from outside before its form opens. It can't happen today because the redraw closes the form first.

+++ Agent notes

- Branch `sc584-embed-form-save-refusals`: dse eaa8742a on develop 93b3a382, superproject 2e571b09 (CHANGELOG only).
- Gates on 93b3a382: tsc/lint clean; jest 7176 passed / 2 skipped + the two SC-568 load-timeout suites green alone (78/78); lifecycle 54/54 (five parts, part 5 `G-S59 G-S49 G-S73 G-S77` 272 s); e2e `258/264 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs` (run 2; run 1 RECOV-R07 = SC-517 load flake); styles.css = clean 93b3a382 build, so shots/freeze/parity carry.
- Review: four independent review rounds. r2 found 1 HIGH, r4 and r6 one CRITICAL each, and r8 found nothing (SHIP).
- New lifecycle scenario G-S77 (10 trials) in part 5. The sweep covers 9 containers × block/heading embed × RV/LP, 36 jest cells.
- Ledger: `.superpowers/sdd/sc584-embed-form-save-refusals/` (decisions.md, review reports r2/r4/r6/r8). dse-verify text proposal: `sc584-dse-verify-proposal.md`.

+++
