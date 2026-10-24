The block edit form's preview now always shows the block you have typed. Typing `@Ref.md` one letter at a time no longer leaves "Reference file (Ref.m) not found" on screen. Nothing needs you; this is ready to land.

Below: the form in real Obsidian after `@Ref.md` was typed with real key presses. The preview shows the referenced Ref Strike card, with the "Read-only" badge at its top right and no error text.

{{IMG:sc510-r2-shot-head-ref-natural.png}}

**What changed**

- Each keystroke now draws its preview into a new container inside the preview box. A lookup that finishes late, from an earlier keystroke, can only draw into its own old container, which is no longer on screen.
- When the preview cannot be drawn at all, the preview now shows the same "failed to render" message the block itself shows after Save. Before, the preview went blank and the error escaped as an unhandled promise rejection. The "Read-only" badge is hidden while that message shows, so it cannot cover the text.

Below: a feature whose reference points at a note the feature cannot read. The preview shows the "Feature: failed to render" message.

{{IMG:sc510-r4-shot-error-preview.png}}

**One claim in this ticket did not reproduce.** A self-referencing `@Note.md` produced 0 unhandled rejections, in jest and in real Obsidian, before and after the fix. Unhandled rejections did happen when a reference pointed at a block the element could not read. That case is fixed and tested.

**Filed separately: SC-525 (Backlog, Low).** If you retype a reference while its lookup is still running, the preview can show "Reference nesting too deep". This happens before this fix too. It needs two keys about 7 ms apart in a small vault, so a person rarely reaches it. The fix belongs in the shared reference code, not in the form.

**Details**

- dse branch `sc510-form-preview-stale-error` @ 08c086c on develop f89f69f; superproject @ 0e53ae2 on main a9c391c.
- `renderErrorCard` moved unchanged from `src/framework/pipeline.ts` to `src/framework/errorCard.ts` (pipeline re-exports it), so the form can use it without an import loop.
- 21 new jest tests (`test/dom/authoring/formModalStalePreview.test.ts`). 13 of the first 17 fail on the old code; the other 4 cover the error message and the new containers.
- Gates: tsc and lint clean · jest 6099 passed / 1 skipped · lifecycle 38/38 · e2e 123/123, 0 known-bug, coverage 87/87 · shots 592, 0 FAIL · freeze 280/280 (no rebaseline) · parity 0 gaps / 0 undeclared / 24 declared.
- Reviewed independently twice (full review, then the fix-round delta); verdict land-ready.
