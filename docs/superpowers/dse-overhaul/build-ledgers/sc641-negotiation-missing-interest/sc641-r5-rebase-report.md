# SC-641 r5 rebase round

Executive summary
- STATUS: DONE. Plugin rebased onto f42546b8; new HEAD bdf0255e630ead9aedfb2776dfa9dec9469e0cf5.
- No conflict (e2e/README.md auto-merged). range-diff: all 3 commits `=`.
- SC-434's README text and plugin-ci.yml state no number or known-bug list that SC-641 makes stale; no extra commit.
- package.json / package-lock.json unchanged between 3b47e55b and f42546b8: no npm ci.
- tsc/lint clean; jest 13861 passed / 2 skipped / 0 failed; main.js and styles.css sha256 match expected.
- diff 7ca7c140..HEAD over e2e/specs e2e/vaults e2e/lib test src visual-harness: empty. Superproject untouched.
