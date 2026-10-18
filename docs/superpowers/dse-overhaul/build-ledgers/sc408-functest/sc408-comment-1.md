The survey is done: the stamina modals have about 150 distinct interactions, 47 have no test today, and probing them turned up 16 suspected bugs. I filed those as five Backlog tickets and I'm now building a working pilot of the recommended test setup on the stamina modal. Nothing needs you yet. The approval ask comes with the pilot.

**The recommended setup**
- Tests drive a real Obsidian with real mouse clicks and key presses. Each test checks both what the screen shows and what gets written into the note.
- It runs on a hidden virtual screen by default, so you can keep using your laptop. A `--headed` flag shows it on your screen if you want to watch.
- One command runs it: `npm run e2e`, or `npm run e2e -- --element=stamina-bar` for one element.
- Each element gets a list of its controls. The test run fails when a control has no test, so "comprehensive" is checked rather than hoped for.
- The existing fast unit tests stay. They cover the many number combinations; the real-Obsidian layer proves each control works end to end.

**Measured speed:** about 1 second per interaction. The roughly 450 interactions in the 7.0.0 elements should take 3–4 minutes with four Obsidian windows running side by side.

**Tooling:** WebdriverIO with the community `wdio-obsidian-service` launcher, wrapped in a small driver we own so it can be swapped later. Playwright was ruled out because it cannot attach to current Obsidian installers. Extending our own lifecycle harness would mean building the runner, parallel runs and version pinning ourselves.

**Suspected bugs filed** (found by probing, not yet confirmed in real Obsidian):
- SC-428 (High): Catch Breath at full Stamina spends a Recovery and heals nothing.
- SC-427: the stamina modal's Apply label can disagree with what gets applied, "1e3" is read as 1, and Reset leaves the Apply box filled.
- SC-426: editing the selected creature's Stamina from its initiative grid cell leaves the detail row showing the old number.
- SC-429: four small minion pool modal defects, none of which corrupt the note.
- SC-425: ds-hero, which is not in 7.0.0, zeroes Stamina when its class doesn't resolve.

Two more findings are design questions for you. They will be in the approval ask.

**Side note:** your installed Obsidian is the 2023 installer (Chrome 106), while a new install gets Chrome 150. The tests pin the current installer by default, and can also run against yours.
