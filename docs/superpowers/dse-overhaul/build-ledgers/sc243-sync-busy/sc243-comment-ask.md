**Ask: is the busy look of the Sync / Check for updates buttons OK as shown below? Pick A, B or C.** Everything else is done, reviewed and green.

What changed: while a compendium sync runs, both buttons are disabled and Sync reads "Syncing…". While an update check runs, both are disabled and the check button reads "Checking…". A double-click, or a sync started from the command palette while one is running, no longer starts a second run. It shows "Draw Steel Elements: a compendium sync is already running." instead. The buttons re-enable on their own when the run finishes or fails, even with the settings window left open.

The disabled look is Obsidian's own, with no new CSS. Two things for your eye:

1. "Syncing…" is wider than "Sync". While a sync runs, the description text beside the button wraps onto a second line and the row grows 16px taller. It shrinks back when the sync ends.
2. The disabled look is faint. In the light theme, the disabled "Check for updates" is hard to tell from the enabled one. The Sync button goes a paler, washed-out shade of its normal fill, and both labels dim slightly.

Options:

- **A. Ship as shown.** Uses Obsidian's native disabled styling, and the sync progress Notice still shows what is happening. (My pick, because it matches how Obsidian's own settings buttons behave.)
- **B. Keep the labels, stop the row from jumping.** Give the Sync button a fixed width, so "Sync" and "Syncing…" take the same space. This is a small plugin CSS rule.
- **C. Don't change the labels. Only disable the buttons.** Nothing reflows, but the button itself won't say that a sync is running.

Either way, a stronger disabled look (answer to point 2) would be a small CSS addition. Say if you want it.

At rest, dark theme (unchanged from today):
{{IMG:sc243-compendium-rest-dark.png}}

Mid-sync, dark theme. Sync reads "Syncing…" and both buttons are disabled; note the description now wraps:
{{IMG:sc243-compendium-mid-sync-dark.png}}

Mid-sync, light theme. This is where the disabled look is faintest:
{{IMG:sc243-compendium-mid-sync-light.png}}

Mid-check, dark theme. The check button reads "Checking…" and both buttons are disabled:
{{IMG:sc243-compendium-mid-check-dark.png}}

---

Mechanics (no action needed):

- DSE branch `sc243-sync-busy` @ `2dad7d8` on develop `6c4f6aa`. The workspace CHANGELOG bullet is on superproject branch `sc243-sync-busy`.
- Gates: tsc and lint clean; jest 4022 passed / 1 skipped at `2dad7d8`. Lifecycle 6/6, shots 524 with 0 FAIL and freeze 260/260 at `7af05c2`; the last round changed only tests and comments. Parity 0 gaps / 0 undeclared / 16 declared at `e8d5274`; no CSS or DOM changed after that.
- No frozen screenshots moved (freeze 260/260), because the busy state never appears in the frozen shots. C cannot move them either. B adds a CSS rule, so it would go through the full battery again. The frozen set is print output and does not include the settings window, so no move is expected.
- An independent review ran 12 probes, including a same-tick double-click, every sync entry point, errors before and during the sync, a check failing with 403, and unloading the plugin mid-sync. All 12 passed. One LOW ordering bug was fixed: the "trash old folder and sync" choice could trash the folder a running sync was writing into. Two small hardenings were also applied, and a second review round tightened the tests.
- Filed for later: SC-357 (a compendium migration can run while a sync is running), SC-358 (sync errors before the download starts are silent), SC-359 (the settings evidence script never loads the plugin in a fresh sandboxed Obsidian).
- Screenshots are from a real Obsidian 1.14.2 using an isolated profile.
