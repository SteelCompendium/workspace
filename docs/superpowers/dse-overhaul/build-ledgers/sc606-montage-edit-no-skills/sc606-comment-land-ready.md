Fixed, ready to land: clicking a logged Montage action to edit it now opens the full window when the hero's entry has no `skills_used` list, and the window and a hover preview stay open on the next click.

Nothing needs your eyes; the dispatcher lands it.

**What changed for a user**

- A hero written with only a name (no `skills_used:` line) now works everywhere on the board: editing an action, logging one, correcting or removing one, Reset, and the "skill already used" warning. Before, editing such an action opened a window with only Result and Skill (no Save, no Remove) and threw an error. Logging a skill for such a hero also threw, after the tally had already moved.
- Your note gains a `skills_used` list for that hero only when a skill is actually logged for them. Editing an action's note or result, or pressing Save with nothing changed, no longer touches the hero's list. This also stops an older side effect: those edits used to reorder an existing list (`[Nature, Alertness]` became `[Alertness, Nature]`).
- A skill typed as plain text (`skills_used: Climb`) is now read as a one-item list: the warning fires for Climb, and logging another skill keeps it (`[Climb, Lift]`).

**Checked in real Obsidian 1.15.1** (the hover-preview probe from SC-598, Reading view and Live Preview, plus a plain Reading-view edit): the old build showed the half-built window, the error, and the preview gone 30 ms after the second click. The fixed build opens the full window with no error, and the window and preview are still open at 700 ms.

Split off: SC-610 (a hero entry that is empty or has no name still throws).

---

Mechanics:

- dse branch `sc606-montage-edit-no-skills` @ `7866426e` on develop `5f7c5336`; fix in `src/elements/montage/model.ts` only; 22 new jest tests (12 of the first 15 fail on the old code; the 7 added in the fix round fail on the first version of the fix), plus the CHANGELOG bullet.
- Battery on the final head: tsc and lint clean · jest 7708 passed / 1 skipped (7685 + 22 + 1 cached-css) · lifecycle 58/58 · e2e 278/282 ok, 0 failed, 4 known-bug, coverage 171/171 pairs · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24.
- Review: independent review (1 MEDIUM, 2 LOW, all fixed), then a scoped re-review of the fix: clean (0 findings in the code).
