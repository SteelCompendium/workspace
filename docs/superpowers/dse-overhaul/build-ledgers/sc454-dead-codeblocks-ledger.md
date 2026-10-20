# SC-454 decisions ledger — Delete dead DSE src/utils/CodeBlocks.ts

Worktree: /home/scott/code/steelCompendium/worktrees/sc454-dead-codeblocks (branch sc454-dead-codeblocks)
Base: draw-steel-elements develop @ ab34293 (2026-10-20)

## Spec (ticket description, verbatim, Scott 2026-10-19)

> Found while fixing SC-290. `draw-steel-elements/src/utils/CodeBlocks.ts` re-emits the opening
> fence line the same way that dropped info strings (```` ```ds-counter extra ```` becomes
> ```` ```ds-counter ````). Nothing in `src/` calls it any more, so SC-290 left it alone.
>
> Delete it and its unit tests, after confirming it is unused (including from `e2e/` and
> `visual-harness/`). If something does still use it, switch that caller to the shared helper
> `src/framework/host/fenceLine.ts` that SC-290 added.
>
> Context: `.superpowers/sdd/sc290-info-string/sc290-impl-report.md` (Follow-ups).

## Scott rulings

(none yet)

## Owner rulings

- 2026-10-20: Owner pre-grep at ab34293 — no import of CodeBlocks anywhere in the plugin; all other
  hits are comments/docs (model.ts byte-compat oracle comments, ReadingModeBlockHost.ts header,
  MinionStaminaPoolModal.ts, test comments, test/mocks/obsidian-core.ts, .repo-docs/architecture.md:524).
  Comments that describe CodeBlocks as live code get reworded to past tense ("the former
  src/utils/CodeBlocks.ts, deleted in SC-454"); `.repo-docs/architecture.md` row 524 is removed and
  rows 117/151 are made past tense. No behavior change; full dse-verify battery still required.

- 2026-10-20 (r1 NEEDS_CONTEXT): the owner pre-grep was truncated (`head -30`) and missed a real
  caller: test/dom/views/minion-stamina-pool-modal.test.ts imports `CodeBlocks` (line 18) and uses
  `CodeBlocks.updateInitiativeTracker` as the `persist: true` callback in `setup()` (line ~71; three
  tests: CB-2 ~147, DC-6 ~168, ~515). Ruling: option (a). The ticket's own instruction applies —
  "If something does still use it, switch that caller to the shared helper
  `src/framework/host/fenceLine.ts` that SC-290 added." Rewrite that test callback inline as
  vault.read -> `replaceFenceBody(content, lineStart, lineEnd, stringifyYaml(data).trim())` (section
  info from the fake ctx.getSectionInfo) -> vault.modify. The three tests' assertions must stay
  unchanged and still pass. Option (b), driving ReadingModeBlockHost.replaceSource, is out of scope.

- 2026-10-20 (r1 review LAND-READY, findings ruled; see sc454-review-r1-report.md):
  - LOW-1 FOLD: src/framework/host/ReadingModeBlockHost.ts:18-19 — replace the "stayed live for unmigrated
    elements until then" claim with "(deleted in SC-454; it had no caller in src/ after the Plan 07 counter
    migration, afedb2a)".
  - NIT-1 FOLD: drop the stale `:102` / `canvas :79` line suffixes after `src/utils/CodeBlocks.ts` in
    src/elements/counter/model.ts:12, src/elements/initiative/model.ts:38,
    src/elements/negotiation/model.ts:13, test/unit/model/initiative-serialize.test.ts:5,
    test/unit/model/negotiation-serialize.test.ts:3.
  - NIT-2 FOLD: src/elements/stamina-bar/model.ts:14 — "the former" before the CodeBlocks.updateStaminaBar
    parenthetical.
  - INFO-1 FOLD: test/dom/views/minion-stamina-pool-modal.test.ts ~:170 (CB-2) — assert
    `updated.indexOf('enemy_groups:')` is >= 0 before slicing, so a missing key fails instead of passing
    vacuously. Same file this ticket already touches.
  - INFO-2: dispatcher updates dse-verify CURRENT numbers at landing (jest 5257/1/229 of 230) — noted in
    the land-ready report.
  - INFO-3 DROP: HANDOFF.md / docs/superpowers/dse-overhaul mentions are historical records.

## Authorship

- r1 implementer: orchestration:implementer (Sonnet) — DONE, head 68e3f1e; jest 5257/1/229-of-230 (5262-5), lifecycle 27/27, e2e 83/87 0 failed 4 known-bug 57/57, shots 572 0 FAIL, freeze 276/276, parity 0/0/24; main.js identical base/head (6ae775ca…)
- r1 reviewer: orchestration:reviewer (Opus) — LAND-READY at 68e3f1e, 1 LOW / 2 NIT / 3 INFO
- r2 fix round: r1 implementer (resumed); scoped re-review: r1 reviewer (not the author)
- r2: implementer head 71ac43a (comments + CB-2/DC-6 guards; DC-6 guard accepted by owner); tsc/lint clean, jest 5257/1/229-of-230, lifecycle 27/27, e2e 83/87 0 failed 4 known-bug 57/57, main.js 6ae775ca… unchanged.
- r2 scoped re-review (r1 reviewer): LAND-READY at 71ac43a; both guards proven by mutation (red at head, vacuous-green at 68e3f1e).
- LAND-READY 2026-10-20: dse branch sc454-dead-codeblocks @ 71ac43a on develop ab34293. Dispatcher: update dse-verify CURRENT jest to 5257/1/229 of 230 at landing.
