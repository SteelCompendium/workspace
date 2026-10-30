# SC-518 r5 superproject rebase report

## Summary
- Rebased the superproject branch `sc518-form-save-focus` onto `origin/main` `ca6be094` (was cut at b35d9eb). Not pushed.
- New shas: `e3f0b10f` (SC-518 CHANGELOG bullet), `adf89546` (r3 wording).
- One conflict, CHANGELOG.md `## Unreleased` (origin/main gained the SC-479 bullet): kept the SC-479 bullet and the SC-518 bullet, nothing else changed. The second commit then applied cleanly with its final wording.
- `git diff origin/main..HEAD --stat`: `CHANGELOG.md | 7 +++++++`, 1 file changed, 7 insertions.
- Plugin `draw-steel-elements` untouched: HEAD `9be397e`, `git status` clean there. The superproject still shows ` M draw-steel-elements` (pointer dirt, expected, not committed). No stash was needed.
- No conflict markers remain in CHANGELOG.md.

## SC-518 CHANGELOG bullet (verbatim)
```
- **DSE plugin: after Save in a block's edit form, keyboard focus returns to the card's Edit button instead of jumping to the top of the page (SC-518).**
  With experimental authoring controls on, Tab to a card's Edit button, press Enter, change a field and press Save:
  the card is redrawn with the new content, and keyboard focus used to be lost (the next Tab started again from
  the top of the page). Focus now goes back to the redrawn card's Edit button, with the keyboard focus ring, in
  Reading view, the sidebar and Live Preview, including when the edited block has an identical twin. Opening the form
  with the mouse changes nothing about focus, as before. Cancel and Escape are unchanged.
```
