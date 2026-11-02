Retyping a reference while its lookup is still running no longer shows "Reference nesting too deep". The block edit form preview now shows the referenced card, for feature, statblock and SCC-code blocks. Nothing is needed from you; this is ready to land.

**Before (develop):** the box holds `@Ref.md ` (a trailing space typed while the first lookup ran). The preview shows the error card "Feature: failed to render (render) Reference nesting too deep" and keeps it after the lookup finishes.

{{IMG:sc525-r1-shot-base-form-preview.png}}

**After (this branch):** the same box and the same timing. The preview shows the Ref Strike card and no error card.

{{IMG:sc525-r1-shot-head-form-preview.png}}

Both screenshots come from real Obsidian 1.15.0, with the first lookup held at a hook so the timing is exact.

**Also fixed in the same code:**
- A pinned sidebar card that redraws while its own lookup is running now shows one card. Before, it showed the card under a stale error card. A first version of this fix drew two cards.
- A card that switches from a pending `@Ref` to inline YAML no longer has the old lookup draw over the new content.
- On develop, a lookup that never finishes on a closed view blocked that block forever. It no longer does.

**Filed, not fixed here: SC-536 (Backlog, Medium).** The review found two older bugs in the same guard. Both also happen on develop:
- A note that references itself nests cards forever in Reading view.
- One note open in two panes can show a false "Reference nesting too deep".

---

**Mechanics**
- Plugin branch `sc525-ref-nesting-retype` @ `34f46cf`, on develop `4deb8cf`. Commits: `4bbe5bb`, `daf715f`, `af09bf2`, `4016eee`, `1ab2bcf`, `6068ca0`, `f6b5fee`, `5bb5cd2`, `b1d5fa9`, `34f46cf` (tests only).
- Change: `src/elements/shared/RefUnwrapView.ts` and `src/framework/view.ts` (`isUnloaded()`). The in-flight guard is now a map from reference to the resolution that owns it. A closed view no longer blocks a new one, and a resolution that a later render replaced never draws.
- Tests: +31 jsdom tests. Each part of the fix was removed one at a time ("mutants"); every removal turns at least one test red, except two checks accepted as untested (one only guards a stale "not renderable" card, one only saves a file read).
- Battery: tsc and lint clean · jest 6184 passed / 1 skipped / 248 of 249 suites (on `34f46cf`) · on `b1d5fa9`, whose built plugin is byte-identical: lifecycle 41/41 · e2e 124/124, 87/87 pairs · shots 592, 0 FAIL · freeze 280/280 · parity 0 / 0 / 24 declared.
- Review: an independent review found 0 HIGH. Its LOW finding and its small items were fixed in this branch, and two scoped re-reviews of those fixes found nothing blocking. One e2e run hit an unrelated stamina-bar flake (CHR-F02) and passed on rerun; filed as SC-539.
