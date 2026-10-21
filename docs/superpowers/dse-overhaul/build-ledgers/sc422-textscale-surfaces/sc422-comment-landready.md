**Can this land?** The plugin's own windows now follow the text-size settings. At "Small text 120%", the Compendium search window's chips and code lines, the settings preview caption, and the sidebar header grow 20%. At default settings nothing moves.

The ticket asked whether plugin chrome should follow these settings at all. I answered yes, because the settings' own help text already promises it: Small and Large say "Applies everywhere, including print and export." If you'd rather plugin chrome stay fixed, say so. I'll drop the branch and reword the help text instead.

**Compendium search window (ships in 7.0.0).** The top row is develop and the bottom row is this branch. Left is default size, right is Small 120%. On develop the right panel looks identical to the left: the setting does nothing. On the branch, the type and source chips go from 12px to 14.4px and the code line goes from 12.75px to 15.3px. The result names are body-size text, so they stay at 15px.

{{IMG:sc422-search-modal-before-after.png}}

**Settings preview caption.** The caption goes from 12.75px to 15.3px at Small 120%.

{{IMG:sc422-settings-caption-before-after.png}}

**Sidebar header (experimental sidebar only).** The header goes from 12.75px to 15.3px. The sidebar's empty-panel message changes the same way and is not shown.

{{IMG:sc422-sidebar-header-before-after.png}}

None of these surfaces has button-sized text, so the Control setting has nothing to change here.

One small side effect: at Small 120%, the code line under each search result (15.3px) is a hair bigger than the bold result name above it (15px). The sidebar's empty message and its title behave the same way. Text inside element blocks already does this at Small 120%, so it matches how the setting works everywhere else.

---

Mechanics:
- **What changed:** each surface's outer element now carries the text-size values the same way element blocks and plugin dialogs already did. The search window, the settings preview and the sidebar each release that subscription when they close.
- **Verification:** the screenshot harness now renders the production code for these three surfaces and measures every text at 120% and 80%. Each setting applies exactly once. With the fix removed, that check fails.
- **Branch:** `sc422-textscale-surfaces`
  - draw-steel-elements `bf8b99c` on develop `188755b`
  - workspace `3e344b3` on main `2d4dfeb`
- **Gates:** jest 5273 passed / 1 skipped, lifecycle 27/27, e2e 83/87 ok with 0 failed and 4 known-bug, shots 572 with 0 failed, freeze 276/276 (no frozen screenshot moved), parity 0/0/24.
- **Independent review:** LAND-READY with nothing above LOW. The reviewer measured these surfaces in real Obsidian 1.14.4, including popout windows: 674 size comparisons, 0 problems. Two LOW findings were fixed and re-reviewed. The "before" images were shot on develop `7817133`; nothing that changed on develop since touches these surfaces.
