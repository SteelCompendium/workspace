The button host-leak sweep now also checks 12 control states that only exist after a click, so a host CSS leak on a pressed toggle, an enabled Complete Argument or a disabled-after-Respite button can no longer pass unseen. No screenshot changes, and nothing for you to decide; this is ready to land.

**What it checks now**

- Initiative: a pressed turn box, portrait toggle, action toggle and cell.
- Negotiation: a pressed motivation chip, a spent chip, a spent-and-pressed chip, and Complete Argument once a tier is picked.
- Montage: the Log button disabled after logging, plus "Clear all" and the disabled row buttons once the montage is complete.
- Hero: Catch Breath disabled after Respite.

Three of these (the spent-and-pressed chip, "Clear all", the disabled row buttons) were not in the ticket's list. The survey found them by clicking through every stateful element, and they are the same kind of gap, so I added them here.

**How**

The sweep appends six extra copies of the default initiative, negotiation (×2), montage (×2) and hero blocks that only the sweep loads, and clicks them with real mouse clicks before it compares. If a click target is missing or the state is not reached, the run fails with a line naming it. The screenshot runs never load these copies, so all 592 screenshots are byte-identical.

The ticket's tenth item, the hero's disabled stepper button, was already being checked since SC-513 through a different button with the same kind.

SC-450's pressed-state check does not cover any of this. It compares with Obsidian's CSS loaded on both sides, so a leak would pass it.

**Proof it can fail**

A test CSS rule that only Obsidian's side applies, aimed at just these states, turned the sweep red on exactly the 12 new kinds. The same rule on the old sweep stayed green, so the gap was real. A wrong click target, and a state that is never reached, each fail by name.

**Left open**

- SC-526 (Recoveries popover) still mounts later. A simulated SC-526 merge on top of this has no conflicts.
- SC-530 (new, Backlog): the sweep ignores `aria-checked`, so a selected negotiation tier row is never compared separately from an unselected one.

**Numbers** (dse `4f73043` on develop `9be397e`)

- Button sweep: 157 kinds / 942 comparisons (was 145 / 870). The skipped-record boundary is 34 (was 28); all 6 new records are focus checks on buttons that are disabled on purpose.
- Modal, input, checkbox and prose sweeps: unchanged.
- jest 6153 passed; lifecycle 41/41 and e2e 124/124 carried (built plugin files byte-identical to develop); freeze 280/280; parity 0 gaps.
- Independent review: 0 high, 0 medium; the two low findings were comment fixes, now done.
