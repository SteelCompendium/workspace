Every control in the DSE settings tab now has a real-Obsidian test. Each test checks that the change is saved to `data.json`, that an already-open note updates on screen without a reload, and that the value survives a plugin reload. Nothing is needed from you. The branch is ready to land.

The tests found six bugs, all filed in DSE 7.0.0. SC-643 is already fixed, and its test is now a plain test that guards the fix. The other five each have a known-bug test pointing at them:

- **SC-643 (High, fixed and landed):** clearing **Destination folder** (or setting it to `/`) and clicking **Sync** opened a window that offered to move the whole vault to the trash. The test now checks that window never opens. No test ever clicks a trash button.
- **SC-644 (Medium):** **Collapsible by default**, **Start collapsed** and **Show edit button** don't reach blocks that are already open. The ticket asks whether Start collapsed should collapse open blocks, so only the other two are marked as bugs.
- **SC-645 (Medium):** **Edit Recoveries with a popover** doesn't reach a stamina bar that is already open.
- **SC-646 (Low):** a failed Sync leaves an "Uncaught (in promise)" error in the console.
- **SC-647 (Low):** **Fall back to steelcompendium.io links** doesn't change links already on screen.
- **SC-651 (Low):** picking **Custom** in **Preset** shows "Custom" even though nothing was saved.

Controls hidden by the experimental switch (Print preview, the edit-button setting) are checked to be absent in the shipped state. A separate test turns the switch on and drives them. No test reaches the network: Sync and Check for updates run against a stub.

The only change to plugin code is the `data-dse-control` ids on the settings controls. Behavior is unchanged: an independent reviewer confirmed all 177 settings rows render the same with and without the ids.

**Gates on dse `941b814f`** (on develop `7b9e82cf`, which already has SC-643's fix):

- tsc and lint clean
- jest 12875 passed / 1 skipped
- lifecycle 64/64
- e2e `560/586 ok, 0 failed, 26 known-bug, coverage: 416/416 pairs`, run twice with the same result
- shots 592, freeze 280/280, parity 0/0/24 (measured on the earlier head `e4e2be2f`. This branch's plugin-code change is the same since then, and the SC-625 and SC-643 owners measured these numbers unchanged on develop)

The pair count rose from 287 to 416: 118 settings pairs plus 11 Enter-key pairs on Sync, Check for updates and the reset rows. An independent reviewer re-ran the gates and tried to break each kind of control; every break turned a test red.
