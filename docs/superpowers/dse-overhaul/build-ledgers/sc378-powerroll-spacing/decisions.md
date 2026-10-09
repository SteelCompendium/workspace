# SC-378 decisions ledger

- 2026-10-02 — Cause: SC-202 r6b's `:is([data-dse-element], .dse-modal):not([data-dse-print="on"]) :where(p)`
  (0,2,0) beat `.dse-pr__text p` (0,1,1); every tier-row outcome <p> got 1em top+bottom margin
  (rows 82px vs 50px). Audit: the only <p> it changed across all 173 harness <p>s; 0 after the fix.
- Fix: dse `d658a74` (selector anchored `:is([data-dse-element], .dse-modal) .dse-pr__text p`, 0,2,1)
  + test in proseHostRegrounding.test.ts (can-fail proven); `8a256c5` CHANGELOG. Superproject `3ccb031` CHANGELOG.
- Battery at `8a256c5` (base develop `9ded832`): tsc/lint clean, jest 4219/1 skipped, lifecycle 19/19,
  shots 544 0 FAIL, freeze 262/262 (no print bytes moved — no sanction needed), parity 0/0/24.
- 2026-10-02 — Posted before/after + "Can I land it?" ask; ticket In Progress + Needs Review.
  Awaiting Scott's ruling. On approval: land via land-stack (`just wt-finish sc378-powerroll-spacing`).
- 2026-10-08 — Scott (session, verbatim): "approved, land it". Landing via land-stack.
- 2026-10-08 — Landed: dse `develop` 9ded832..8a256c5 (FF), workspace `main` merge c940be8. develop had not moved since the battery, so the 2026-10-02 battery numbers stand.
- 2026-10-08 — Follow-up filed: SC-386 (Backlog) — gate for re-grounding-beats-component-rule class.
