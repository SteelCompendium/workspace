The Skills header removal is ready to land. It is rebased onto the latest `develop` and every gate passes. Nothing is needed from you.

Your "this looks good" (2026-09-25) is recorded as approval for both the look and the 20-line Skills print rebaseline. The dispatcher will apply that rebaseline when it lands the branch.

After the rebase, the 20 Skills print hashes came out byte-identical to the ones you approved, so the pictures you saw are exactly what lands.

---

Mechanics:
- draw-steel-elements `sc255-skills-collapse` @ `b029baa`, on `develop` `ade5064`. The only rebase conflicts were in `CHANGELOG.md`.
- Gates: tsc and lint clean; jest 4101 passed / 1 skipped (211 of 212 suites); obsidian-lifecycle 19/19; shots 524 with 0 FAIL; freeze moved exactly the 20 Skills lines, and the base was 260/260 before this branch; parity 0 GAPs / 0 undeclared / 16 DECLARED.
- Follow-up SC-364, the dead `resolveCollapsePrefs`, stays in Backlog.
