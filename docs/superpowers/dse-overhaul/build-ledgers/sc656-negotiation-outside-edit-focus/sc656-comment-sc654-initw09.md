INIT-W09 failed once under load in the same way as INIT-W10: the test expected one "The note changed outside" Notice and counted none. It passed on re-run.

This was in a full e2e run during the SC-656 review (dse `bdab956e`, load about 18-22), alongside an INIT-W10 failure. SC-656 does not change the initiative window path: its one-line change in `windowHandoff.ts` is inactive when no `carry` is passed, and initiative never passes one.

+++ Agent notes

- Reviewer's reading: the burst's single Notice had already timed out and gone before the count, the same signature as INIT-W10.
- Failure bundle: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc656-r4-R1/e2e-full-fail-bundles/INIT-W09/` (machine-local).
- Whoever fixes SC-654 should check INIT-W09 with the same fix.

+++
