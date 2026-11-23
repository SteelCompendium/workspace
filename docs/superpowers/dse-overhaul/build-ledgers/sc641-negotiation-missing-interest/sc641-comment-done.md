**Landed and closed: a `ds-negotiation` block that leaves Interest out now opens at Interest 2 / Patience 5, and Reset on a block with no `initial_*` values goes to 2 / 5 instead of ending the negotiation.** Nothing is needed from you.

It is on the plugin's `develop` branch, so you will see it in the next build you load. It is not in a release; releasing stays your call.

One thing to remember from the earlier comment: an old note with no Interest key at all now reads as Interest 2, even if that negotiation had been played down to 0 before this change.

+++ Agent notes

- dse `develop` @ `bdf0255e` (fast-forward from `f42546b8`); workspace `main` merge `d91ea21e`, bookkeeping `8e7a7bbe`. Verified on origin by the owner after the dispatcher's landing.
- CHANGELOG bullet is under `## Unreleased` in the workspace `CHANGELOG.md`.
- Ledger preserved: `docs/superpowers/dse-overhaul/build-ledgers/sc641-negotiation-missing-interest/`.
- No follow-up tickets. The existing write-path behaviours seen in review (quotes and YAML comments dropped on write) are SC-599.

+++
