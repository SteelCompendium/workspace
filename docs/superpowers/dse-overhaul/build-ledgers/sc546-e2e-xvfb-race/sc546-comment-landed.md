Landed: each e2e, lifecycle and docs-shots run now uses only a display whose Xvfb it started itself, so two runs started at the same moment no longer share one screen.

Any worktree that has not rebased onto this change can still put a lifecycle or docs-shots run on a new run's display if both start within about 250 ms. Rebase before running those concurrently.

---

- dse `develop` @ `423e798d`; workspace `main` merge `e10ddcfa`, bookkeeping `830b8489` (ledger preserved under `docs/superpowers/dse-overhaul/build-ledgers/sc546-e2e-xvfb-race*`, dse-verify rows 4/4b plus an "Xvfb ownership (SC-546)" bullet, new CURRENT block).
- Harness-only: no plugin byte change, no CHANGELOG entry. Not deployed.
