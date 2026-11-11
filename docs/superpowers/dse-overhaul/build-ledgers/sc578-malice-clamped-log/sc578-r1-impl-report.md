# SC-578 r1 implementer report

**Executive summary**
- Verdict: DONE. Decision D1 implemented in full (applied amount, `requested`, capped wording, `0` not `+0`, zero-applied entries still logged, one shared helper, doc comment fixed).
- dse branch `sc578-malice-clamped-log` @ `2747307f`, rebased onto `origin/develop` `eaa8742a` (SC-584 base, as instructed). Superproject doc commit `f0fd9a65` (CHANGELOG only, no pointer bump).
- tsc clean, lint clean. jest 7185 passed / 1 skipped / 260 of 261 suites (one SC-568-style timeout on twin-reuse.test.ts in the pre-rebase full run, green alone: 53/53).
- lifecycle 54/54 (21 + 16 + 9 + 4 + 4; parts 1-5 all rc 0).
- e2e `OBSIDIAN-E2E done: 259/264 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` (pre-rebase run 1 and 2 each failed only RECOV-R07, the documented load flake; green alone; run 3 and the post-rebase run were fully green).
- shots 592 ok, host-leak 163 kinds / 978 comparisons, modal 39 / 234, capture clip 147. freeze `freeze OK (280/280 frozen print PNGs byte-identical ...)`, no baseline touched. parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.

## Files changed (dse, 4 commits on eaa8742a)
- `e5a7aae1` fix: `src/elements/initiative/model.ts` (new `applyMaliceChange`, `advanceRound` uses it, doc comments), `src/elements/initiative/view.ts` (quick-add uses it; log line renders `(<requested>, capped at 0)`; `+` sign only for amount > 0), `src/drawSteelAdmonition/EncounterData.ts` (`MaliceLogEntry.requested?: number`, doc comment corrected).
- `ba3dc004` test: `test/dom/elements/initiative-matrix.test.ts`, `test/unit/model/economy-serialize.test.ts`.
- `73625465` test: `e2e/specs/initiative/malice.e2e.ts` (INIT-M09 plain test), `e2e/specs/initiative/round-turns.e2e.ts` (INIT-R03 expects amount -4, requested -9: that is the Advance-round e2e).
- `2747307f` docs: plugin `CHANGELOG.md` ([FIX] bullet, SC-577 bullet's "configured amount" wording corrected), `docs/initiative-tracker.md`, `.repo-docs/integration.md`.
- Superproject `f0fd9a65`: worktree `CHANGELOG.md` `## Unreleased` bullet (and the SC-577 bullet's stale "configured amount" clause).

## Helper
```ts
export function applyMaliceChange(
	malice: Malice,
	requested: number,
	event: { round: number; label: string },
): MaliceLogEntry
```
In `model.ts`. before = `maliceValueOf`; `addToMalicePool`; `amount = after - before`; entry `{round, amount, label}` plus `requested` (after `label`) only when `amount !== requested`; appended via `appendMaliceLogEntry`; returns the entry. `addToMalicePool` is kept (pool arithmetic, still unit-tested).
No parse/serialize change was needed: the log is plain YAML output of the object, so key order follows insertion order (round, amount, label, requested); proven by a round-trip test.

## Test rows added / changed
- jsdom (matrix): M09 is now a normal passing test (known-bug wording dropped); added rows: quick-add -5 from 2 (amount -2, requested -5, line `R1: -2 — Spend (-5, capped at 0)`); -5 from 0 (amount 0, `R1: 0 — Spend (-5, capped at 0)`); uncapped spend and gain carry no `requested` key (`R1: -2 — Spend`, `R1: +3 — Gain`); Advance round `round_gain -3` from 0 (round 3, amount 0, requested -3, `R3: 0 — Round gain (-3, capped at 0)`) and from 1 (amount -1, requested -3); positive gain unchanged. R01 table rows updated for the applied amount. `[M03-M05]` title no longer defers to SC-578. "known bugs" describe renamed to SC-588, SC-589.
- unit (economy-serialize): negative-gain test now covers 1 / 5 / 0 starts; `applyMaliceChange` shape and key order, log adds up to the pool; parse -> serialize round-trip keeps `requested` and key order byte-for-byte.
- e2e: INIT-M09 asserts exactly `{round 1, amount -3, label Spend, requested -5}` and the rendered capped line; INIT-R03 updated. No new scenario ids.

Drive-by fixes:
- Plugin and workspace CHANGELOG SC-577 bullets said "the log shows the configured amount"; changed to point at the new behavior (stale after this change, same file the task touches).

Follow-ups:
- None new. Note the pre-rebase shots run was killed (by literal PID, inside my worktree) because the base moved mid-run; all reported shots numbers are from the post-rebase run.

## Evidence (scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc578-impl-r1-a1/`)
tsc3.log, lint3.log, jest-full2.log (post-rebase), jest-full.log + jest-twin.log (pre-rebase), lc-r2p1..r2p5.log, e2e4.log (post-rebase), e2e1/e2e2/e2er07/e2e3 logs (pre-rebase), shots2.log, freeze2.log, parity1.log.
