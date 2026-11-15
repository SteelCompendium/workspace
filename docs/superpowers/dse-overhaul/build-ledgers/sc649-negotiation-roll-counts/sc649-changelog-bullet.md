- **DSE plugin: a Negotiation's power roll counts only the Motivations, Pitfalls and modifier boxes the card shows as chosen (SC-649).**
  If the argument in the note named a Motivation or Pitfall the block no longer has (renamed or deleted in the YAML),
  no button showed as pressed, but the result tiers still used the Motivation (or Pitfall) table, a missing Motivation
  still greyed out Same Argument, and Complete Argument applied that table to Interest and Patience. The same happened with a hand-typed
  `reusedMotivation: true` when the Reuse box was drawn unchecked. The tiers, the Same Argument box and Complete
  Argument now follow what the card shows: a name with no matching Motivation or Pitfall counts as no appeal, and Reuse
  counts only when its box is checked. The reverse case is fixed too: checking Same Argument and then pressing a
  Motivation left the greyed-out Same Argument box drawn checked although the roll ignored it; it is now drawn
  unchecked while a Motivation is chosen. Opening the note does not change the YAML, and restoring a renamed
  Motivation's name makes it count again.
