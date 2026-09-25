A pinned sidebar panel that shows "Backing block not found" now comes back as soon as the block reappears. Before this fix it stayed stuck on that notice even after the block was back. The fix is ready to land. You don't need to look at anything: no pixels moved.

**What was wrong.** When the block vanished, the panel showed the notice but kept a pointer to the old, removed view. The next valid edit refreshed that dead view in place instead of rebuilding the panel, so the notice never went away.

**What changed** (draw-steel-elements, branch `sc288-sidebar-stuck`):

- The panel now drops its pointer to the old view whenever it tears that view down.
- The in-place refresh is skipped while the panel is showing the notice. This closes a rare race where the block vanished again during a rebuild.
- Undo now recovers the panel. Before, if you used a panel control, deleted the block, and pressed Ctrl+Z, the panel stayed broken. The restored text matched the panel's own last save, so the panel ignored it as its own echo.
- A panel stuck on a parse-error card also recovers on the next valid edit.
- One CHANGELOG bullet under 7.0.0.

**Review.** An independent reviewer ran probes against the first version and found the undo case, the parse-error case and the race. All three are fixed, each with a test that fails without its fix line. A scoped re-review confirmed all three fixes and passed 11 of 11 probes. It found nothing left to fix.

Deferred: an intermittent jest failure in an unrelated suite showed up twice while the build host was busy. It is filed as SC-352.

---

Gates on `3b25127` (base `origin/develop` `48ac20c`):

- tsc: clean
- lint: clean
- jest: 3974 passed, 1 skipped, 204 of 205 suites (includes 5 new tests from this ticket)
- shots: 0 FAIL
- freeze: 260/260 unchanged
- parity: 0 gaps, 0 undeclared, 16 declared

Files changed: `src/framework/host/SidebarBlockHost.ts`, `src/framework/sidebar/SidebarPanel.ts`, `test/dom/framework/sidebarInitiative.test.ts`, `test/dom/framework/sidebarBlockHost.test.ts`, `CHANGELOG.md`.
