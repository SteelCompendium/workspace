# SC-575 proposal for .claude/skills/dse-verify/SKILL.md (not applied; the owner applies it)

Measured post-rebase at dse `734d7745` (base `a339e7b3`, SC-572 in).

1. Battery row "4b. e2e", the "today" clause. Replace the current count and known-bug list (at a339e7b3: `254/262 ok, 0 failed, 8 known-bug, coverage: 163/163 pairs`, known bugs including SC-575) with
   `today \`255/262 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs\`, since SC-575` and drop SC-575 from the known-bug list (remaining: SC-257, SC-355, SC-384, SC-577, SC-578, SC-580, SC-588, i.e. whatever the a339e7b3 list was minus SC-575; SC-572 left it when it landed).
   Measured: `OBSIDIAN-E2E done: 255/262 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs`.
2. "Current expected numbers":
   - jest 7085 passed / 1 skipped (worktree with the shots CSS cache; a fresh worktree reads 2 skipped). +3 over the a339e7b3 baseline of 7082 = the three SC-575 unit cases in `test/unit/model/encounter-data.test.ts`. Full run under loadavg 27 hit two SC-568 timeouts (`twin-reuse` SC-547 test; `initiative-default-keys` SC-485 test), both green alone with `-w 2` (78/78).
   - lifecycle 53/53 (21 / 16 / 9 / 4 / 3; part 5 `G-S59 G-S49 G-S73`).
   - shots 592; button host-leak 163 / 978; modal host-leak 10 scenarios / 9 classes / 39 button kinds / 234 comparisons; capture clip 147; freeze 280/280; parity 0/0/24; tsc, lint clean.
3. The SC-575 jest `test.failing` marker is gone (X07 is a plain test in the `[X]` describe of `test/dom/elements/initiative-matrix.test.ts`); e2e INIT-X07 is a plain `it`.
