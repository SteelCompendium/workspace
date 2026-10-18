The stamina test suite is landed on `develop`. From now on, `npm run e2e` must pass before any DSE change lands.

**What you get**
- `npm run e2e` (from `draw-steel-elements`) opens a real Obsidian on a hidden screen and clicks through every control of the stamina modal, the stamina bar and the initiative tracker's stamina cells. After each step it checks both the screen and the note file. You can keep using your laptop while it runs.
- Today it has 71 tests: 59 pass and 12 are marked "known bug". It takes about 40 seconds.
- The last line reads `OBSIDIAN-E2E done: N/M ok, F failed, K known-bug, coverage: X/Y pairs`. Exit code 0 means pass. `--headed` shows it on your screen.
- A "known bug" test passes while its bug exists and fails once the bug is fixed. That forces whoever fixes the bug to switch the test on. The 12 cover SC-426, SC-427, SC-428, SC-430, SC-431, SC-432 and SC-433.

**Your question: will needing a screen be a problem on GitHub?** No. The runner starts its own hidden screen (Xvfb), which GitHub's Linux machines can run. SC-434 tracks the CI job.

**Tickets filed**
- Bugs, in DSE 7.0.0: SC-426, SC-427, SC-428, SC-429, SC-430, SC-431.
- Your two design calls, in DSE 7.0.0:
  - SC-432: disable Spend Recovery for creatures; for a hero without a pool, relabel it and add your confirmation dialog.
  - SC-433: make the temp Stamina field a direct edit.
- CI job, in DSE 7.0.0: SC-434.
- Rollout to the rest of the plugin, all Backlog. I put tiers 1–4 in DSE 7.0.0 because they test surfaces that ship in 7.0.0. Say if you want them elsewhere.
  - Tier 1: SC-435 minion pool modal, SC-436 conditions modal, SC-437 rest of the initiative tracker.
  - Tier 2: SC-438 montage, SC-439 negotiation, SC-440 settings tab, SC-441 compendium sync, SC-442 counter.
  - Tier 3: SC-443 insert commands and `/ds` suggestions, SC-444 collapse and menus, SC-445 rolling, statblocks and skills, SC-446 SCC links.
  - Tier 4: SC-447 render check for the near-static elements.
- No project: SC-448 (the 9 experimental elements, for 7.1.0) and SC-449 (move the older lifecycle checks onto the new runner).

**One thing I left out of DSE 7.0.0:** SC-425 (setting a ds-hero's max Stamina to 0 zeroes its Stamina). ds-hero is an experimental element and the ticket carries the "Deferred from 7.0.0" label, so I kept it out. Say if you want it in.

---

**Landed:** DSE `develop` @ `1640ed0`; workspace `main` @ `b97a068` (merge of `sc408-functest`, with the dse-verify skill and `PROJECT.md` §4 now listing e2e as a required landing gate).

**Checks on the landed tree:** e2e 59 ok + 12 known-bug of 71, 0 failed, all 47 control/interaction pairs covered, 3 of 3 repeat runs green · unit tests 4725 passed · Obsidian lifecycle 25/25 · screenshots 572, 0 failures · frozen screenshots 276/276 unchanged · parity 0 gaps.

**Review trail:** three independent review rounds. The last one found nothing to fix. Before landing, the branch was rebased onto SC-423 and every check was re-run.
