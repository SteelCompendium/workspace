Land-ready: the initiative turn overlay, the "Reset encounter state" chrome item and its "Yes, Reset" button now have control ids. The three SC-485 e2e tests click them through `dse.click`, and the e2e coverage gate counts those clicks: coverage went from 79/79 to 82/82 pairs.

Nothing changes for users. The new attribute adds no pixel and no class, and every screenshot, freeze and parity number is unchanged.

No action needed from you.

**What changed**
- New ids: `init.hero.turn` (hero portrait turn overlay), `init.reset-encounter` (chrome item) and `init.reset-encounter.confirm` (confirm button).
- The chrome kit's menu item takes an optional `control`, which it passes to the button it builds.
- New `e2e/manifest/initiative.ts` with the three ids.
- INIT-DEF-E01, E03 and E04 use `dse.click`, and their exact note assertions are unchanged.
- E04 now hovers the tracker before clicking. The chrome is hidden until you hover, and E04 used to pass only because an earlier test left the pointer there.
- One new jest test checks the three ids exist and are in the manifest.

**Proof the clicks count:** with two ids removed temporarily, E01, E03 and E04 all fail (0/3 ok).

**Filed:** SC-516 (Backlog). The modal's Cancel button and the "Reset turns (this round)" item still have no ids or e2e scenario.

**Gates** on dse `7046eb0`:
- tsc and lint clean
- jest 6027 passed / 1 skipped / 243 of 244 suites
- lifecycle 36/36
- e2e `114/114 ok, 0 failed, 0 known-bug, coverage: 82/82 pairs`
- shots 592, 0 FAIL, host-leak counts unchanged
- freeze 280/280
- parity 0 gaps / 0 undeclared / 24 declared

**Independent review:** land-ready, with no HIGH or MEDIUM findings.
- The reviewer compared the rendered DOM before and after: the only difference is the three new attributes.
- Removing one manifest row fails the coverage gate.
- E04 run alone fails the same way on develop without this change, so the new hover step is a real user step and does not hide a regression.
- Its one LOW finding, a manifest comment that implied hover was optional, is fixed.

**Also filed from the review:**
- SC-517 (Backlog): e2e RECOV-R07 failed once in three full runs under heavy load. It saw two note writes after Catch Breath where it expects one. SC-500 touches no stamina code.
- SC-516 now also covers the real-Obsidian census, which does not yet check the turn overlay or the reset modal.

Branch `sc500-initiative-control-ids`: dse `31c1778`, `4f7aba6`, `38f94f4` (tip) on `7046eb0`. The superproject is on origin/main `aa57411`, with no commits and the pointer unstaged.
