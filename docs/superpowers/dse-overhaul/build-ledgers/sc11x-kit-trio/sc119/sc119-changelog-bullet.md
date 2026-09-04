- **Site: kit Browse tiles show "—" for every absent bonus, matching the kit detail page and
  the DSE plugin (SC-119).** The Browse kit index tile rendered an absent bonus as "0" on its
  first stat row (Stamina / Speed / Stability / Disengage) but as "—" on its second (Melee and
  Ranged Dmg / Dist). Both rows now use the detail page's `kitBonus()` helper, so a kit with
  no bonus in a slot shows a dash everywhere — Boren's tile reads `— — — —` on both rows
  instead of `0 0 0 0` over `— — — —`.
