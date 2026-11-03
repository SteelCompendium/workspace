Landed: lifecycle and the obsidian-shots camera now use only a DevTools port their own Obsidian reported, so two runs started together no longer share an Obsidian. You no longer need to set `DSE_LIFECYCLE_PORT`.

The fix is dse develop `367a2f1d` (workspace main `6e16742a`). It changes only the test harness: the plugin's `main.js` and `styles.css` did not change. The dse-verify skill is updated to match.

Follow-ups are in Backlog: SC-553 (e2e chromedriver port), SC-554 (camera runs share one settings folder) and SC-555 (a docs-shots gif step that already fails).
