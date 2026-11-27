**Fixed: changing the Destination folder and syncing again no longer overwrites your own notes. If the new folder already holds files, Sync asks first, the same way a first sync does.**

Nothing for you to decide. This is ready to land.

**What a Sync into a changed Destination does now**

- Your own note at a compendium path (the repro's `Notes/class/shadow.md`) is never touched. It is skipped and counted as "skipped to protect your changes".
- If the new folder already holds files, the "Existing compendium folder found" window opens before anything is written. If the folder is empty or does not exist yet, Sync runs with no window, as a first sync would.
- If you renamed or moved the compendium folder and point Destination at it, Sync still updates it. A file is updated only when it holds exactly the bytes the plugin installed. A compendium file you edited is skipped.
- Running the old-compendium migration into a changed Destination now records the moved files, so later Syncs keep updating them. A migration that was stopped or run in another folder never claims a note of yours in the new one.

**One thing to know (SC-653).** Until SC-653 changes that window, it now also appears on this path, with its "Move old compendium to trash" button. That includes a parent folder: going from `Notes/DS Compendium` to `Notes` offers to trash `Notes`. "Keep everything" is the focused default and is safe. SC-653's fix will cover both paths.

**Filed:**

- SC-708. After a Destination change, the old folder's compendium files stay behind, are no longer tracked, and are never updated again. The files the new release dropped do still go to the trash.
- SC-709. "Sync anyway" and "Sync now" in the migration window don't notice a Destination changed while the window was open, so they skip the ask-first step. Nothing is overwritten.

+++ Agent notes

- dse branch `sc706-destination-change-overwrites`, head `17187e4c` on develop `e783b068`; superproject `98b2a527` (CHANGELOG only, pointer unstaged for wt-finish).
- Cause fixed: `CompendiumSyncService.applySync` Phase 1 updated any differing file that the old manifest listed, even under a different root; it now updates only at the same root, or when the file's hash equals the recorded hash. `main.ts` `syncCompendium` treats a manifest for another root as no manifest for the first-sync check. `CompendiumMigration` re-keys the manifest to the migrated folder when the migration run itself adopts, and a run into a different folder starts with an empty migrated list.
- Markers: SC-441's `knownBug('SC-706')` [SYNC-K12] and its jest `test.failing` twin are now plain tests. New e2e: SYNC-D11 ("Keep everything" keeps the colliding note), SYNC-D12 (changed Destination into an empty folder, no window), SYNC-D13 (renamed compendium folder keeps updating), SYNC-D14 (migration into a changed Destination), SYNC-D15 (a second migration into another folder never claims the user's note), SYNC-D16 (a migration stopped in the old folder never claims the user's note in the new one). A re-keyed manifest's release tag is `migrated:<old release>`, so Check for updates does not report up to date over legacy content.
- Gates (re-measured by the reviewer at `17187e4c`): tsc incl. e2e and lint clean · jest 15018 passed / 2 skipped (fresh) · e2e `OBSIDIAN-E2E done: 936/956 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs` · lifecycle 64/64 (r1; later rounds touched only `src/data`, tests, e2e and docs, and no lifecycle scenario covers sync) · `styles.css` byte-identical to a clean `e783b068` build, so shots 636, freeze 280/280 and parity 0 / 0 / 24 carry.
- Pipeline: Sonnet implementer (r1, then fix rounds r3, r5, r7), independent Opus adversarial review (r2, with mutation testing and integrity probes), and Opus scoped re-reviews (r4, r6, r8). Review findings fixed along the way: a renamed compendium folder stopped updating; a migration into a changed Destination never recorded the moved files; two paths where another folder's migration record could claim the user's note. r8 verdict: land-ready, no open findings.

+++
