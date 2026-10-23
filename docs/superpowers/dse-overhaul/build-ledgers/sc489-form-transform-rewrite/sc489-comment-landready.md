Saving the block edit form no longer lowercases or trims values you did not edit. `Climb` stays `Climb`, and `style: Chips` stays `Chips`. This is ready to land; nothing is needed from you.

**What was wrong:** to check the block, the form ran the schema's clean-ups (trim spaces, lowercase) on its own copy of your data. That copy was also what Save wrote. So every field with a clean-up rule got rewritten, even ones you never touched. Those fields are the skills list, a custom skill's group, the skills Style and the stamina bar's Style.

**What changed:** the check now runs on a throwaway copy. Save writes your values, plus only what you edited. The live preview still uses the cleaned-up copy, because that is what the note itself renders.

**One small display choice (FYI, no answer needed):** a dropdown whose value is written in a different case, like `style: Chips`, now opens showing the matching option `chips`. Save still keeps `Chips` unless you pick a different option. Before this fix, that dropdown opened blank.

The first image shows the edit form for a skills block written as `style: Chips` with `- Climb`. The Style dropdown shows "chips", and the preview below shows the chips layout with Climb highlighted.

{{IMG:sc489-r1-shot-form.png}}

The second image shows the note's source right after Save, when only "Only show selected" was switched on. The first block still reads `style: Chips` and `- Climb`, with `only_show_selected: true` added. The second block (`style: chips`, `- Sneak`) and the text around both blocks are unchanged. Before the fix, the first block was saved as `style: chips` and `- climb`.

{{IMG:sc489-r1-shot-saved.png}}

Still true, and tracked elsewhere: Save rewrites the whole block, so comments inside it are lost (SC-404, form redesign). Two tangents were filed: SC-504 (a sidebar-mounted `style: Sheet` bar renders the default bar) and SC-506 (a flaky jest test under machine load).

---

Mechanics:
- dse `sc489-form-transform-rewrite` @ 66f474b on develop 9f08f06; superproject @ 21a9557 on origin/main 3c7f392 (CHANGELOG only, pointer unbumped).
- Files: `src/authoring/FormModal.ts`, `test/dom/authoring/formModal.test.ts` (12 new tests), `CHANGELOG.md`.
- Gates on the final tip: tsc and lint clean; jest 5859 passed / 1 skipped / 241 of 242 suites; lifecycle 34/34; e2e 108/108 ok, 0 known-bug, 69/69 pairs; shots 592 with every in-run check; freeze 280/280; parity 0 gaps / 0 undeclared / 24 declared.
- Independent review: 0 blocker / high / medium. 2 LOW and 1 INFO were folded; 3 INFO were dropped; 1 INFO was filed as SC-506. Real Obsidian probes: 1 of 8 pass on the old code (that one should pass on both), 8 of 8 on the fix. All 4 mutants the design survey named go red. Validation never receives the form's live data at the tip (0 of 16 calls; 13 of 13 on the old code).
- No lifecycle scenario and no e2e change: the form has no e2e control, and jest plus the reviewer's real-Obsidian probes cover it.
