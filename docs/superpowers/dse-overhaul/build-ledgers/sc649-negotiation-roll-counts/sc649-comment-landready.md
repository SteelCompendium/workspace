Fixed and ready to land: a Negotiation's power roll, the Same Argument box and Complete Argument now count only the Motivations, Pitfalls and boxes the card shows as chosen. Nothing needs your decision.

**What changed for the GM**

- If the argument names a Motivation or Pitfall the block no longer has (renamed or deleted in the YAML), it now counts as no appeal. The tiers use the plain table, Same Argument can be checked, and Complete Argument writes the plain result. Before, the hidden name still changed the tiers and the Interest/Patience written.
- A hand-typed `reusedMotivation: true` counts only when the Reuse box is drawn checked.
- Found in review, same rule the other way round: if you checked Same Argument and then pressed a Motivation, the greyed-out Same Argument box stayed checked although the roll ignored it. It is now drawn unchecked while a Motivation is chosen, and comes back checked if you un-press the Motivation.
- Opening the note never changes its YAML. If you restore a renamed Motivation's name, its button shows pressed again and the roll counts it.

**Checks**

Independent review probed 25 cases, reverted the fix to confirm the new tests fail without it, and re-reviewed the follow-up round. Full battery green on the final head: unit tests 13345 passed, real-Obsidian lifecycle 64/64, real-Obsidian e2e 598/613 ok with 0 failed (one new scenario, NEGO-A14), screenshots 592 and freeze 280/280 unchanged, parity clean. The three SC-649 known-bug tests are now plain tests.

<details><summary>Mechanics</summary>

- Plugin: `draw-steel-elements` branch `sc649-negotiation-roll-counts`, head `5f962390` on develop `2777484c` (fix `31c0ddcf`, e2e `742a7b4d`, review fixes `d83ad953` + `5f962390`).
- Superproject: `e9e8634e` on workspace main `fded411f` — CHANGELOG bullet `12909271` + one pointer bump `e9e8634e`.
- Model: `NegotiationData.argumentUsesMotivation()` / `argumentUsesPitfall()` / `argumentReuseChecked()`; name matching is unchanged, so no overlap with SC-640.
- e2e note: the SET-X03/SET-X04 flake (SC-657) hit one full run and passed on re-run; a second full run was clean.

</details>
