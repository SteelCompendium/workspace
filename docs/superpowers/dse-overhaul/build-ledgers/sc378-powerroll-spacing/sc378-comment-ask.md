**The power-roll tier rows are compact again. A one-line outcome now gets a 50px row (it was 82px), the same height as on the site. Can I land it?**

## What you're approving

Land the fix on DSE `develop`. It is one CSS selector change plus a regression test.

- **Approve:** I land it. No frozen print screenshots changed, because print never had this bug, so there is no rebaseline for you to sanction.
- **Change something:** tell me what to change.

Before and after in real Obsidian (dark), the example ability card:

{{IMG:sc378-feature-before-after.png}}

The same fix on a statblock ability (Human Bandit Chief, first ability):

{{IMG:sc378-statblock-before-after.png}}

## What was wrong

SC-202 (landed Sept 8) added a sheet-wide rule that puts the browser's default paragraph spacing back on every paragraph inside a plugin card: one line of space above and one below. Each power-roll outcome is a paragraph. The power roll already had its own rule removing that spacing, but SC-202's rule took precedence over it. So every tier row got 16px of empty space above its text and 16px below.

This hit every power roll the plugin draws: ability/feature cards, statblock abilities, featureblocks, a kit's signature ability, negotiation arguments, and `ds-roll`.

The fix makes the power roll's own rule take precedence again. SC-202 had already fixed the inline title/value text the same way.

I checked whether anything else had the same problem. I compared all 173 paragraphs across every harness fixture with and without SC-202's rule. The power-roll outcomes were the only paragraphs whose spacing it changed. After the fix there are none.

## Gates (DSE branch `sc378-powerroll-spacing`)

All green at dse `8a256c5` (base `develop` `9ded832`):

- tsc and lint are clean.
- jest: 4219 passed, 1 skipped. That is the 4218 baseline plus 1 new regression test, and I checked that the new test fails against the old rule.
- obsidian-lifecycle: 19/19 ok.
- shots: 544, 0 FAIL. The prose host-leak, host-copy pin, and button host-leak checks all print OK.
- freeze: `freeze OK (262/262)`, so print is byte-identical.
- parity: 0 gaps, 0 undeclared, 24 declared. That is unchanged.
