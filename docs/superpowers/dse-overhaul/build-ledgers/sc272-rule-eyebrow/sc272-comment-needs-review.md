**Ask: please look at the one before/after image below and answer one question about plurals. The fix is done and every gate is green.**

**What changed:** rule cards in by-SCC mode now show the rule's group above the title, instead of always showing "RULE". "Opportunity Attacks" now reads COMBAT over the title. Before the fix it always read RULE.

{{IMG:sc272-header-grid.png}}

How to read the image: the left column is before and the right column is after. The top row is the dark theme and the bottom row is the light theme. Only the small caps word above the title changes. It was RULE and is now COMBAT.

The image is cropped to the card header on purpose. A worker produced it by styling a test DOM with the real plugin CSS in a browser, because this machine has no display to run real Obsidian. That method draws the header accurately. It also leaves the crest icon empty and shows the body as raw link text. Neither of those is part of this change.

**Question: should the plugin copy the site's plural group names on rule cards?** The site labels three rule groups in the plural on each single rule's tile:

- Monsters (9 rules)
- Treasures (5 rules)
- Negotiations (7 rules)

The site does this because its rule tile reuses the name table it built for the group landing pages. So one rule about treasure is labeled "Treasures".

The plugin currently copies the site, so both say "Treasures". Choose one:

1. **Keep matching the site** (current branch). The plugin and the site stay identical. No further work.
2. **Use the singular in both places** (Monster, Treasure, Negotiation). I would switch the plugin to the singular and file a steel-etl ticket to make the site's rule tile use the singular too. Until that ticket ships, the two would disagree on those three groups.

If you have no preference, option 1 lands as is.

---

Mechanics:

- The plugin now takes the group from the note's `scc:` code, e.g. `mcdm.heroes.v1/rule.combat/opportunity-attacks` → Combat. The frontmatter still says only `type: rule`. It accepts only `rule.<group>` segments, so a stray code from another family cannot change the label. A note with no code still shows RULE.
- Across all 163 corpus rules there are 16 groups, and the plugin's label matches the site's label for every one. The one rule titled "Damage" in the Damage group keeps SC-120's rule that hides a label repeating the title.
- The review round caught a missing plural (Negotiations) and two edge cases. All three are fixed.
- Moved screenshot bytes: none. The frozen print set is 260/260 unchanged, so no rebaseline is needed.
- Filed SC-362: the browser screenshot harness cannot render by-SCC cards at all, so this path has no screenshot coverage yet.

Gates at `draw-steel-elements` `5293604` on branch `sc272-rule-eyebrow` (base `origin/develop` `6c4f6aa`): tsc and lint clean; jest 4026 passed / 1 skipped / 0 failed (+29 tests); shots 524, 0 FAIL; freeze 260/260; parity 0 gaps / 0 undeclared / 16 declared.
