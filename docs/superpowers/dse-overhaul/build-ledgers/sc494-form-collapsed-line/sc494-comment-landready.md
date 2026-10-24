The block edit form now keeps a block's `collapsed:` line on Save. A stamina bar you set to start collapsed stays collapsed after you edit it in the form. This is ready to land; nothing is needed from you.

**What was wrong.** The form wrote the block back without `collapsed:`, even when you changed nothing. On Skills, Conditions, Surges, Heroic Resource and Hero Tokens it was worse: a block with a `collapsed:` line made the form show a schema error and switched Save off.

**What it does now.** The form handles `collapsed:`, `collapsible:` and `collapse_default:` exactly the way the card's own write-back does, using the same code. A Save with no changes writes the block byte-for-byte unchanged. One exception: if a collapse line sits below other settings, Save moves it to the top, which is what the card's own writes already do.

Before: the note in real Obsidian, block collapsed, showing "STAMINA (15/20)" as one line.
{{IMG:sc494-r1-shot-1-collapsed.png}}

The edit form open on that block, Max stamina changed from 20 to 25.
{{IMG:sc494-r1-shot-3-form-edited.png}}

After Save, note reopened: still one collapsed line, now "STAMINA (15/25)". The note file reads `collapsed: true` / `max_stamina: 25` / `current_stamina: 15`.
{{IMG:sc494-r1-shot-5b-reopened-fresh-session.png}}

**Two things you might mistake for this bug:**

- A collapsed block shows no Edit button, so you press Expand first. That Expand is remembered for the rest of the session, so in the same session the block reopens expanded even though the file still says `collapsed: true`. In a new session it is collapsed again. This is existing design, unchanged here.
- After any form Save the open card keeps showing the old numbers until you reopen the note. That is SC-509, being worked separately.

**Filed from the review (Backlog, Low):** SC-514 (ds-hero's own write-back writes `prefs:` twice; hero is hidden) and SC-515 (the form shows the "Collapsible" toggle off on a stamina bar that can collapse).

---

Mechanics:
- dse `7046eb0` on develop `054c9c5`; superproject `827954d` on origin/main `83b800f` (pointer unbumped; dispatcher lands).
- New shared helper `claimsLegacyCollapseKeys(def)` and `withReservedKeys` (writes `prefs:`, then the collapse keys, then the body) in `src/framework/chrome/collapsedKey.ts`, used by both the pipeline and `src/authoring/FormModal.ts`.
- Tests: `test/dom/authoring/formModalCollapseKeys.test.ts`, 23 tests, written failing first (18 of the original 21 failed on develop before the fix). Independent review: 384-case comparison of form Save against the card's own write-back over 16 element types, no lost, doubled or added keys; two blocks in one note do not affect each other.
- Gates on the landing tip: tsc and lint clean; jest 6026 passed / 1 skipped; lifecycle 36/36; e2e 114/114, 0 failed, coverage 79/79; shots 592, 0 FAIL; freeze 280/280; parity 0 gaps / 0 undeclared / 24 declared.
