# SC-457 scoped re-review r5 — after fix round 4

Same rules, footguns and return contract as `sc457-brief-rereview.md` (same dir). Scratch: `sc457-r5-<yourAgentId>/`. Report: `sc457-rereview-r5-report.md` (≤10-line exec summary first). Ledger section "Re-review r4" has the ruling (option (a)).

Scope: the fix-round-4 delta (`git range-diff 1c271b5..c290e89 bc4a0c5..<new head>`) — dse must sit on `bc4a0c5` (or newer), G-S13/G-S15 byte-identical to origin/develop; superproject one CHANGELOG-only commit on current origin/main.

1. Rule check: "skip leading spaces and tabs only; the name then ends at the first whitespace character of any kind." Re-run your r4 `break.json` set in real Obsidian on HEAD and on develop `bc4a0c5`: for EVERY opener develop handles (renders + writes + pins), HEAD must do the same — especially ```` ```ds-counter x ```` Live Preview pin (anchor, panel mounts, write lands). Re-run the r3 write set and r3/r4 pin sets. Leading NBSP/U+3000/FF/VT/U+FEFF still not claimed.
2. Expected-language table: the `ds-x x` rows expect `ds-x`; every parse equals expected. New LP pin-path test exists and fails on `c290e89`'s `fenceLanguage`.
3. Battery: tsc (incl. `-p e2e`), lint, jest, lifecycle, e2e yourself; shots/freeze/parity from the implementer's run11 logs (check the log is run11, not an older run; run10 is a superseded-base partial). Expected: jest 5457 + branch tests / 1 skipped · lifecycle 31/31 · e2e `89/93 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs` · shots 580 / 0 FAIL · freeze 280/280 · parity 0/0/24. Report if either base moved (do not rebase).
4. Out of scope (filed): SC-487 (zero-width space pin), SC-477, SC-480, SC-481. Report anything else NEW as a finding, but say explicitly whether it is a regression vs develop (only regressions block landing).
