Can I land the stamina test pilot to `develop`? I also need your call on two stamina-modal design questions (B5 and B6 below) and on how far to roll the tests out.

**What the pilot does**
- `npm run e2e` opens a real Obsidian on a hidden screen, clicks and types through every control of the stamina modal, the stamina bar (Recoveries, Catch Breath, popover, Undo) and the initiative tracker's stamina cells. After each step it checks both the screen and the note file.
- Today that is 69 tests. They take about 36 seconds with four Obsidian windows side by side, or about 90 seconds one at a time. You can keep using your laptop while it runs. `--headed` shows it on your screen if you want to watch.
- Every clickable control has an id and sits on a list. A full run fails when any control on the list has no test, or when a new control appears without being added to the list. That is how "comprehensive" is checked rather than hoped for.
- When a test fails, the run saves a screenshot, the note before and after, and the console log.

**Does it catch real bugs?** A separate reviewer planted 32 realistic bugs in the stamina code: Damage off by one, Escape writing, Catch Breath not spending a Recovery, a click blocked by an invisible overlay, and so on. All 32 were caught. The new real-Obsidian tests caught 27, the fast unit tests caught 28, and 4 were caught only by the real-Obsidian layer.

**Bugs it found:** filed as SC-425 to SC-431 (SC-428 and SC-430 are High). Five of those tickets reproduce in real Obsidian: SC-426, SC-427, SC-428, SC-430 and SC-431. The tests for them are marked "known bug". They pass while the bug exists and fail once it is fixed, so nobody forgets to switch them on.

**Decisions I need**

1. **Land it.** It adds about 160 MB of developer-only packages to DSE. The first run downloads Obsidian into `~/.cache/dse-e2e-obsidian`, which grows to about 1 GB. Nothing ships to users.
2. **Make it a required check.** I'd add `npm run e2e` to the standard check list run before every DSE change lands. It adds about 36 seconds.
3. **Roll out to the rest of the plugin.** I'd file one Backlog ticket per area, in this order:
   - Tier 1 (≈150 interactions): the minion pool modal, the conditions modal, and the rest of the initiative tracker (turns, malice, captain, reset).
   - Tier 2 (≈160): montage and its modals, negotiation, the settings tab, compendium sync, and a small counter top-up.
   - Tier 3 (≈90): insert commands and `/ds` suggestions, collapse and menus, rolling, SCC links.
   - Tier 4: a quick render check for the near-static elements.
   - The 9 experimental elements get their tests when 7.1.0 turns them on.
4. **A CI job.** The tests can also run on GitHub on every push. I'd file that as a separate Backlog ticket. Do you want it?
5. **B5: Spend Recovery heals for free on creatures and on heroes without a Recoveries pool.** In the initiative tracker, a hero at 0/80 can press Spend Recovery three times and reach 78/80 without spending anything. Monsters have no Recoveries in Draw Steel at all.
   - My recommendation: disable Spend Recovery for creatures. For heroes with no pool to spend from, keep it as a plain "heal one Recovery's worth" shortcut, relabelled so it does not claim to spend anything.
   - What would you like it to do?
6. **B6: the Temporary Stamina minus button does nothing.** It looks enabled, but clicking it, or typing a lower number, never lowers temp. A typo like 50 instead of 5 cannot be fixed afterwards except by taking damage. This comes from the "temporary Stamina doesn't stack, keep the higher" rule, which an earlier agent fix (SC-133) applied to the edit field itself.
   - My recommendation: make the temp field a direct edit, like the Stamina field. Keep "keep the higher" only for gaining temp from an effect.
   - What would you like it to do?

**Side note:** your installed Obsidian uses the 2023 installer (Chrome 106). A fresh download from obsidian.md gets Chrome 150. The tests pin the current installer, so updating yours means you see what the tests see.

---

**How to run it** (from `draw-steel-elements`):
- `npm run e2e`: everything, headless.
- `npm run e2e -- --element=stamina-bar`: one element.
- `npm run e2e -- --headed`: watch it on your screen.
- The last line reads `OBSIDIAN-E2E done: N/M ok, F failed, K known-bug, coverage: X/Y pairs`. Exit code 0 means pass.

**Where it lives:** DSE branch `sc408-functest` @ `1a33560`. The test runner, driver and lists of controls are in `e2e/`, documented in `e2e/README.md`. The workspace check-list skill update is on superproject branch `sc408-functest` @ `6e1427b`.

**Checks on the final branch:** e2e 61 ok + 8 known-bug of 69, 0 failed, all 47 control/interaction pairs covered, 20 of 20 repeat runs green including 7 under heavy load; unit tests 4666 passed; Obsidian lifecycle 25/25; screenshots 568 with 0 failures; frozen screenshots 274/274 unchanged; parity 0 gaps.

**What a failure looks like:** the reviewer planted "Escape writes the pending edit" and ran the stamina-bar tests: 4 failed. The report said "expected no write to Stamina/basic.md, saw 1" and showed the stray write as a note diff (temporary Stamina 5 → 1). This is the screenshot it saved, taken in the real Obsidian right after Escape:

{{IMG:sc408-sample-failure.png}}

**Review trail:** an independent review found no high-severity problems. It found two medium ones: one test failed about 1 time in 20 because of a leftover Undo toast, and a skipped test was not reported. Both are fixed, along with 7 smaller items. A second scoped review confirmed the fixes and called it ready to land. Its one small leftover item (a test helper that could hide a stray write in a future test) goes into the first rollout ticket.
