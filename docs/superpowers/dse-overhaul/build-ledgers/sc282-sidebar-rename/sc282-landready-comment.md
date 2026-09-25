A pinned sidebar panel now follows its note through a rename or move. Deleting the note removes the panel. Either way, you no longer end up with a stale "Note not found" card. This is ready to land; nothing needs your eye.

**What changed**

- **Rename or move** a note, or a folder above it, and every panel pinned from that note switches to the new path. The panel is not rebuilt, so a running encounter or initiative tracker keeps its state. The next click saves into the renamed note, and no ghost file appears at the old path.
- **Delete** a note, or a folder above it, and its panels disappear from the sidebar.
- **Sidebar tabs that are not loaded yet** are covered too. Obsidian doesn't load a sidebar tab until you click it, so right after a restart the DSE tab is usually in that state if it sits behind another tab or the sidebar is collapsed. A rename made then still updates that tab's saved panels, and it opens on the new path.
- The SC-184 dismiss button stays. It's the fallback for panels that went stale before this fix, for example a note renamed while the plugin was off.

**One choice I made that you can reverse**

A deleted note now removes its pin for good. Something that deletes a note and later recreates it, like a git branch switch or a sync client restoring a file, will not bring the pin back. Before this change, the dead card sat there and could come back to life. I went with removal because the ticket asks for delete handling and a card for a deleted note is exactly the stale state it describes. If you'd rather deleted notes keep a dismissable card, say so and it's a small change.

**Review and gates**

An independent Opus review ran against real Obsidian as well as jest. It found no blockers or high-severity issues. Its fix round covered the not-yet-loaded tabs, stronger tests, a stable session key, and an unhandled error when you delete a note mid-save. A second, scoped review then checked only that fix round. It also found a pre-existing sidebar listener leak, which I filed separately as SC-354.

Gates on draw-steel-elements `6c4f6aa` (on develop `c524fd2`):

- tsc and lint clean
- jest 3997 passed / 1 skipped, 0 failures
- Obsidian lifecycle 6/6
- shots 524, 0 FAIL
- freeze 260/260, so no printed pixel moved
- parity 0 gaps, 0 undeclared warnings, 16 declared deferrals
