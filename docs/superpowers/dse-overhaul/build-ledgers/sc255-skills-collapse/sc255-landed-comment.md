The `ds-skills` "Skill List" header removal has landed on `develop`. Skills cards now have one collapse control: the element menu, the same as every other card.

The 20 Skills print screenshots were re-baselined when it landed. The go-ahead for that was your reply "this looks good." (comment ec5cf1c9, 2026-09-25), read as approving both the look and the rebaseline. If that isn't what you meant, it can be undone in two steps:

1. Restore the old screenshot hashes: copy `.superpowers/sdd/freeze-baseline.sha256.pre-sc255-bak` back over `.superpowers/sdd/freeze-baseline.sha256`.
2. Revert the 7 SC-255 commits on draw-steel-elements `develop` (`git log --grep SC-255`; they end at `b029baa`), then bump the workspace pointer.

---

Mechanics:
- draw-steel-elements `develop` @ `b029baa`. The workspace landed as `main` @ `1172c3c` (the merge) plus `4d28460` (bookkeeping).
- The freeze check reads `freeze OK (260/260 …)` against the landed tree's shots. The dse-verify skill records the rebaseline, quoting your exact words.
- The ledger and rebaseline file are kept at `docs/superpowers/dse-overhaul/build-ledgers/sc255-skills-collapse/`.
- Follow-up SC-364 stays in Backlog: `resolveCollapsePrefs` is now dead code.
