A montage that ran out of rounds with nothing logged now reads "Final result: Total Failure" with the skull icon, matching the rule line "Total Failure — no Victories awarded." It is ready to land; nothing is needed from you.

What changed on the result band for that board:

- Before: "Final result", verdict "Not started", then the rule line "Total Failure — no Victories awarded."
- After: "Final result", verdict "Total Failure", skull icon, the same rule line, and "2 rounds used".

A montage still in play with nothing logged is unchanged: "This montage / Not started". Adding a round to a finished one brings it back to "Not started".

The book decides it (Draw Steel Heroes, Montage Test Outcomes): "If the heroes hit the failure limit or time runs out, and if they don't have at least two more successes than failures, they suffer total failure."

The card's head icon stays an hourglass on a finished Total Failure. That was already true for every finished failure, so I left it alone.

I filed SC-658 (Backlog, Low) for older edge cases with hand-typed round numbers, such as `current_round: 99` where Reopen does nothing visible, and "-1 rounds used".

Mechanics:

- The fix is one line in `montageOutcome` (`src/elements/montage/model.ts`): `pending` only while the montage is live.
- The SC-438 e2e marker MONT-W03 is now a plain test that checks for "Total Failure".
- 8 new jest tests. With the fix reverted, the ones that check the finished 0/0 board fail, and so does MONT-W03. The other 3 check cases the fix does not change.
- Independent review said LAND, with two small findings, both fixed. A scoped re-review of the rebase followed.
- dse `3e88b3f5` on develop `09c879f2`; superproject `fe42d4f8` on main `7219b96d`.
- Gates: jest 13326 passed / 1 skipped, lifecycle 64/64, e2e 592/608 ok, 0 failed, 16 known-bug, coverage 416/416 pairs, shots 592, freeze 280/280, parity 0/0/24.
