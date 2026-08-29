**Answer on S: yes — the SDK already supports the field, and the plugin already uses that SDK; only the initiative tracker drops it. All five picks are locked (A2, B1, C1, D2, S3) and implementation is now underway — no further input needed unless you disagree with the formula note below.**

**S, the follow-up:** `draw-steel-elements` depends on `steel-compendium-sdk` 3.0.0 (the published `data-sdk-npm`, v3 line), and that SDK's statblock model carries the field today: `withCaptain?: string`, mapped from the `with_captain` YAML/JSON key (`data-sdk-npm/src/model/Statblock.ts:25` and `:43`). The plugin's statblock element already renders it ("With Captain" row, `src/elements/statblock/view.ts:193`). The one gap is the initiative tracker's statblock-reference merge, which copies only `{name, stamina, image}` and discards the rest — that's exactly what SC-195 closes. No SDK change and no npm publish needed: the field is a free-form string in the books ("Edge on strikes", "Strike damage +1", "+2 bonus to Stamina"), so turning the Stamina-flavored shape into a number is the tracker's parse, and the `with_captain_stamina:` YAML override stays available for ref-less/homebrew squads.

**Formula note (from your sourced clarification — this sharpens my original A2 wording):** the captain delta uses the CURRENT (alive) minion count, not the original squad size. Worked example, 5 goblins at 5 Stamina each with "+2 bonus to Stamina":

- Built with a captain: pool 35/35 (7 per minion × 5).
- Two minions die (14 damage consumed): 21/35 — max never shrinks on minion death (your pick c).
- Captain goes down with 3 minions alive: current AND max drop by 2 × 3 = 6 → 15/29. The two dead minions' bonus share was already spent as damage, so removing only the living minions' share is exact bookkeeping.
- A new captain is promoted: +6 back to both → 21/35 (your pick b, fully symmetric — promote-then-relieve is a no-op).

---

Mechanics, below the ask:

- Implementation dispatched against `draw-steel-elements` base `1619396` (worktree `sc195-captain-minion-pool`; the branch has been kept fast-forwarded through the SC-205/SC-190/SC-120 landings).
- Scope as estimated in the research round (~250–350 lines incl. tests: ref-merge carry-through, parser + override, pool transition math, modal original-count fix, badge text, visual fixture; tests on promote/relieve/captain-death recompute).
- Review pipeline: independent Opus review after implementation; expect a sanctioned-rebaseline ask with before/after crops for the new captained-squad print fixture (current freeze baseline: 210 lines, post-SC-120).
