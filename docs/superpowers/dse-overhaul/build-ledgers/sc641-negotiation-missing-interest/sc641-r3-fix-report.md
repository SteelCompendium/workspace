# SC-641 r3 fix round

Executive summary
- STATUS: DONE. No source behaviour change; docs/comments/test-header only.
- LOW-1, LOW-2, INFO-1, INFO-2, INFO-4 fixed; r1 follow-up (Dragon example) fixed as indentation-only.
- jest 13861 passed / 2 skipped / 0 failed (unchanged); tsc, lint clean.
- main.js sha256 identical to a build of 227dfc3d; styles.css sha256 18730938... unchanged.

## r3 fix round
- LOW-1: e2e/README.md minimal.md row now "live, not over; it has no motivations or pitfalls, so no chips".
- LOW-2 + INFO-1: SC-641 bullet in worktree CHANGELOG.md replaced with the prescribed text (single "(SC-641)", "no initial_interest and no current_interest", saved-note caveat); new superproject commit.
- INFO-2: negotiation-bugs.test.ts header says the e2e twins are no longer knownBug markers.
- INFO-4: docs/negotiation-tracker.md Reset sentence: "starting values", banner cleared unless initial_* are themselves ended (Interest 0 or 5, Patience 0).
- Dragon example: de-indented `pitfalls:` and `i5..i0` (whitespace only); js-yaml parse now gives pitfalls [Insult] and the i-keys at top level.
