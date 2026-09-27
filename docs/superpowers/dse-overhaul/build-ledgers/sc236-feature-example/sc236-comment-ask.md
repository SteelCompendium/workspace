**Ask: pick option A or B for the default `ds-feature` example, and if A, reply "sanctioned" for its 8-line print-freeze rebaseline.**

Today, when you insert a new feature block, the example says "Villain Action 1" in a header chip but renders as a main action (sword crest, "MAIN ACTION" usage chip). Every way of fixing that changes what the card looks like, so no fix can avoid a freeze rebaseline. The ticket assumed the "Main Action 1" option wouldn't move frozen shots. That's no longer true: the chip text changes, so the print shots move too.

**Option A (my recommendation, built and gated): delete the `ability_type` line.** The "VILLAIN ACTION 1" chip disappears. Nothing else on the card changes: same sword crest, same main-action spine, same "MAIN ACTION" chip, same Malice cost and Trigger row.

{{IMG:feature-dark.png}}

Why A: in the real compendium data, a monster's Malice-cost main action (for example the angulotl needler's "Blowgun": `cost: 2 Malice`, `usage: Main action`) never carries an `ability_type` field. So after A the example matches how the books encode this kind of ability. The villain-action look is already shown by the separate "Rally the Line" test fixture, so the example card doesn't need to show it too.

**Option B: make it a genuine villain action.** The crest changes from a sword to a skull and the spine takes the villain accent. The "MAIN ACTION" chip and the Trigger row are removed. Real villain actions have no usage line and no trigger. It is a materially different card, and new users would get a Director-only villain action as their first example block. If you pick B, I'd also change `cost: 5 Malice` to `cost: Villain Action 1`, because that is how real villain actions are encoded. That round isn't built yet.

{{IMG:optionB-villain-feature--steel-dark.png}}

I don't recommend the ticket's other idea, `ability_type: Main Action 1`. That value appears nowhere in the real data. It only swaps the chip text and moves the same frozen shots.

---

Mechanics (option A, DSE branch `sc236-feature-example` @ `5cd09e1`, on develop `6c4f6aa`):

- `src/elements/feature/example.yaml`: one line deleted. The harness's "spend" fixture used to be a hand-copied duplicate of this file. It is now derived from it, so it can't drift out of sync again.
- The test that pinned the old contradiction now pins the new content. It is proven to fail if the line comes back. The SC-102 precedence rule (a real `usage` line wins over `ability_type`) now has its own inline test.
- The docs screenshot `docs/Media/feature.png` (used in the Features and index pages) is regenerated to match. It comes out about 260px taller than the old one. That is not this change: the image was last taken before later design work on develop (taller tier rows, wider badges), so it now just matches the current plugin. Apart from the chip, it is pixel-identical to a render of the current code without this fix.
- Gates: tsc and lint clean; jest 3998 passed / 1 skipped; obsidian-lifecycle 6/6; shots 524 / 0 FAIL; parity 0 GAPs / 16 DECLARED.
- Freeze: 8 of 260 print lines change, and the count stays at 260. They are `feature`, `feature-collapsed`, `feature-spend` and `chrome-collapsed-rollout`, each in `--steel-print` and `--steel-realprint`. The hashes repeated identically across two runs. Every other frozen shot is byte-identical.

Printed, the same thing happens: only the "Villain Action 1" box goes away.

{{IMG:feature-realprint.png}}
