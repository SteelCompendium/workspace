Still land-ready after a rebase onto the newest develop. The code is unchanged: SC-488 landed first and touched only the block edit form, so all five SC-485 commits replayed identically.

New shas: dse `53e1e48` on develop `0dff966`, superproject `6bacd4e` on main `3762276`. These replace `d0b0d08` / `a895c02` in the comment above.

Re-run on the new base: tsc and lint clean · jest 5840 passed / 1 skipped / 240 of 241 suites · e2e 108/108 ok, 0 failed, 0 known-bug, coverage 69/69. Lifecycle 33/33, shots, freeze 280/280 and parity 0/0/24 stand from the previous run (SC-488 touched no harness or initiative file).
