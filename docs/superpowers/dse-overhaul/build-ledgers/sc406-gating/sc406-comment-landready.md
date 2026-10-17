**Can this close once it lands? The `experimental` switch is built and reviewed. With it absent, a fresh 7.0.0 install shows none of the deferred features. With `"experimental": true` in the plugin's `data.json`, everything works as it does on develop today.**

One optional taste check: deferred blocks now render as the plain grey card below, with the text "`ds-encounter` is not available in this release." It has no buttons and no links, and opening it never changes the note. The review suggested prefixing the text with "Draw Steel Elements:" so readers know which plugin is speaking. I left that out. Say the word if you want it, and it will be a one-line change.

Dark theme, switch off (`ds-counter` is a shipping element, shown for contrast):

{{IMG:sc406-placeholder-card--switch-off--obsidian-dark.png}}

Light theme, switch off:

{{IMG:sc406-placeholder-card--switch-off--obsidian-light.png}}

Settings index, switch off. There is no Authoring page. The Appearance page also loses its Print preview row; that was checked in real Obsidian but is not pictured here:

{{IMG:sc406-settings-index--switch-off--obsidian-dark.png}}

**What the switch hides while it is off** (screenshots are from real Obsidian 1.14.4):
- The 9 deferred blocks render the card above and are gone from `/ds`, the Insert commands, and key autocomplete inside their fences.
- No sidebar: no view, ribbon icon, `open-dse-sidebar` / `send-block-to-sidebar` / `send-initiative-to-sidebar` commands, or Pin/Unpin chrome items.
- The `authoringControls` and `printPreview` prefs are left out of the catalog.

The `download-data-md-dse` legacy alias is removed in both states. `migrating-to-7.md` has the one line about it.

**Not gated, and verified unchanged:** `ds-scc`, `ds-montage`, ability-card rolling, the text-scale prefs, the print layout, all 6.0.2 elements, and the Conditions manager opened from the initiative tracker.

**Toggling the switch loses nothing.** A stored `printPreview` / `authoringControls` value survives in `data.json`. A per-block `prefs: printPreview` line also survives in the note while the switch is off. Both were bugs the review caught and that are now fixed.

**Two things I decided not to handle:**
- A beta tester whose saved layout had the sidebar open sees Obsidian's own "Plugin no longer active … [Close]" tab. One click closes it.
- `npm run docs-shots` still captures the deferred surfaces (sidebar, Authoring page, the nine elements), because the camera runs with the switch on. That belongs with the docs work in SC-407.

---
Mechanics:
- Branch `sc406-gating` in draw-steel-elements, head `05a6ff3`, based on develop `f8693b5`.
- Pipeline: implementer → independent Opus review (FIX-REQUIRED: 3 medium, 1 low; 11 of 11 mutation probes turned the tests red) → fix round → scoped re-review.
- Final battery: tsc and lint clean · jest 4429 passed / 1 skipped / 218 of 219 suites (+62 tests over develop) · lifecycle 25/25 · shots 568, 0 FAIL · freeze 274/274, no frozen byte moved · parity 0 gaps / 0 undeclared / 24 declared.
