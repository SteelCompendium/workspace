# SC-435 decisions ledger — e2e rollout (Tier 1): minion stamina pool modal

Worktree: `/home/scott/code/steelCompendium/worktrees/sc435-e2e-minion-pool` (branch
`sc435-e2e-minion-pool` in every submodule). Cut 2026-11-10 from dse develop `6270e84a`,
workspace main `e1d3d1e0`. Tracked branch for dse: `develop`.

## Scott's rulings (verbatim, dated)

- **2026-10-18 (SC-408):** "yes, I want to roll this out across all parts of the plugin,
  including the settings"
- **2026-10-18 (SC-408):** "For any bugs found, please mark them with the DSE 7.0.0 project."
- **2026-10-18 (SC-408, e2e gate):** "make it required to land future changes"
- **2026-11-10 (via dispatcher):** Scott activated the DSE 7.0.0 Backlog for work.

## Ticket scope (verbatim from the SC-435 description)

> **Scope:** `MinionStaminaPoolModal` (`src/views/MinionStaminaPoolModal.ts`), opened from the
> initiative tracker's minion squads. That covers the pool stepper and typed value, the
> minion-count box, the kill checkboxes and auto-check, the death ladder, refused-heal text,
> condition removal, Apply / Reset / Cancel / Escape, and the detail-row rebuild. This is this
> week's SC-417 bug cluster. SC-429 already holds four known defects, which become known-bug
> markers.
>
> **Also in this ticket:** a test-driver fix carried from the SC-408 review (R2 LOW-1).
> `dse.block()` (`e2e/driver/dse.ts:179-183`) marks a block as "being edited" even when a test
> only reads it, which could hide a stray write to that block. Mark a block only on a click,
> type or press inside it, or add a read-only accessor.
>
> **Done means** (the same bar as the SC-408 stamina pilot; start from
> `draw-steel-elements/e2e/README.md`):
> * Every interactive node on the surface carries a `data-dse-control` id. Both censuses cover
>   the surface: jsdom `test/dom/e2eCensus.test.ts` and real-Obsidian `e2e/specs/_census.e2e.ts`.
> * A manifest in `e2e/manifest/` lists every (control, interaction) pair. A full `npm run e2e`
>   drives each pair at least once through real input, asserting the note file and the screen.
>   At least one driver per pair is a plain test, not a known-bug test.
> * The combinatorial logic (values × states × variants) lives in jsdom matrix tests.
> * Every bug found gets a Backlog ticket in the DSE 7.0.0 project, labelled Bug + DSE Plugin.
>   The ticket gets a `knownBug('SC-…')` (e2e) or `test.failing` (jest) marker citing it. No
>   product fixes in the test ticket.
> * The full dse-verify battery is green, including `npm run e2e` with 0 failed and full
>   coverage.

## Owner rulings

- **2026-11-10 — SC-429 is Done** (its four defects were fixed after this ticket was written).
  So the description's "become known-bug markers" is stale: SC-429's four defects become
  **plain regression tests** (they must pass). If any of them still reproduces, that is a
  regression — report it as a new bug (below), do not mark it SC-429.
- **2026-11-10 — Bug flow.** Workers never touch the tracker. A worker that finds a product
  bug commits its coherent work, stops, and returns `STATUS: NEEDS_CONTEXT` with each bug's
  title, repro, file:line and severity. The owner files the Backlog ticket (DSE 7.0.0, Bug +
  DSE Plugin, related to SC-435) and resumes the worker with the key, which the worker then
  cites in `knownBug('SC-…')` / `test.failing`. No product fixes in this ticket.
- **2026-11-10 — Overlap with SC-436 (conditions modal) and SC-437 (initiative tracker).**
  They follow this ticket and touch the same e2e suite and coverage count. Keep new shared e2e
  helpers small and generic; the final report must list what SC-436/437 should reuse (helper
  names + paths). Don't pre-build their surfaces.

## Battery baseline at 6270e84a (dispatcher, 2026-11-10)

jest 6492 / 1 skipped / 257 of 258 suites · lifecycle 52/52 · e2e 128/128 ok, 0 known-bug,
coverage 89/89 · shots 592, 0 FAIL, host-leak 163/978, capture clip OK (147 …) · freeze 280/280 ·
parity 0/0/24.

Expected after this ticket: jest and e2e counts rise (new tests); coverage Y/Y with Y > 89;
lifecycle 52/52; shots/freeze/parity unchanged unless the `data-dse-control` attributes move
DOM-parity or host-leak numbers (report if they do — attribute-only changes should not move
print bytes).

## Rounds

(appended as they run)
- **r1 (2026-11-10)** — implementer (orchestration:implementer, id a8c0477c776accc4a) on
  `sc435-brief-r1-implementer.md`; report → `sc435-r1-implementer-report.md`. Ticket → Awaiting.
  Review (r2) goes to a fresh orchestration:reviewer identity.
- **r1 result (2026-11-10)** — NEEDS_CONTEXT at `d65c31fb`. e2e 160/160, 0 known-bug, coverage
  109/109; lifecycle 52/52 (G-S59 needed a quieter host); shots 592/0 FAIL/host-leak 163/978;
  freeze 280/280; parity 0/0/24; jest 6578 pass / 1 skip / 2 load-timeout fails (owes a clean
  full run). SC-429's four defects pass as plain regressions.
- **Owner rulings on r1 findings (2026-11-10):**
  - Bug "overkill label shows unclamped damage" → filed **SC-566** (Bug, DSE 7.0.0). `test.failing`
    citing SC-566.
  - Bug "surplus kill ticks leave Apply disabled, tooltip asks for fewer" → filed **SC-567**. No
    Scott ruling needed for the marker: the `test.failing` asserts only the invariant **"the modal
    never shows a disabled Apply whose tooltip asks for fewer kills than are already ticked"** —
    true under either fix (trim surplus ticks, or keep them and reword the tooltip). The design
    choice is recorded on SC-567 for whoever fixes it.
  - Follow-up jest 5 s load timeouts (`twin-reuse`, `initiative-default-keys`) → filed **SC-568**;
    out of scope here. For this ticket's gate: a full jest run must be green, or show only those
    two timeouts AND both suites green alone.
  - Follow-up two squads share one modal title → filed **SC-569** (Feature); out of scope.
  - Follow-up SKILL "~36 s" e2e time stale → proposal file `sc435-skill-proposal.md` for the
    dispatcher (owners don't edit SKILL.md).
- **r1b (2026-11-10)** — implementer resumed to add the two markers + clean full jest.
- **r1b result (2026-11-10)** — DONE at `7f5b2647`. Markers for SC-566/SC-567 in
  `test/dom/views/minion-stamina-pool-modal-matrix.test.ts`. jest 6580/1 skip/2 SC-568 timeouts
  (both suites 71/71 alone; loadavg 20-37) — meets the ledger's jest gate rule. e2e unchanged
  (160/160, 109/109).
- **r2 (2026-11-10)** — independent review (orchestration:reviewer, fresh identity) on
  `sc435-brief-r2-reviewer.md` → `sc435-r2-review-report.md`.
- **r2 result (2026-11-10)** — reviewer: LAND-READY, 0 CRIT/HIGH/MED, 5 LOW, 5 INFO, 4 product
  bugs. e2e 160/160 (run 2; run 1 hit SC-517 RECOV-R07 load flake), lifecycle 51/52 (G-S59 fails
  on base 6270e84a too in the same window = host; SC-561 owns G-S59).
- **Owner rulings on r2 (2026-11-10):**
  - Product bugs filed: **SC-572** (MEDIUM a11y: condition icons not keyboard/SR reachable),
    **SC-573** (pool 0 + live minion → Apply disabled forever; related SC-421), **SC-574** (custom
    conditions missing from modal; duplicated string condition removed twice by one click).
    SC-567 description extended: the info line also says "Select 1". Each gets a marker
    (`test.failing` jsdom, or `knownBug` e2e), SC-574 one marker per item.
  - LOW-1..LOW-5 → **fold** into r3 (all small, same files).
  - INFO-1 (retitle POOL-C02) → fold. INFO-2 (`poolInfo()` null check, a helper SC-436/437 reuse)
    → fold. INFO-3 (coverage gate dedupes pool `reach` rows against stamina's) → fold ONLY if the
    pool manifest can give its reach rows distinct ids without changing the coverage gate;
    otherwise drop with a note in "Reuse for SC-436/437" (pool specs do drive all three today).
    INFO-4 → drop (SC-517, not this branch). INFO-5 (Obsidian 1.15.1 vs SKILL 1.15.0) → skill
    proposal file.
  - G-S59: retry part 5 in r3 only when loadavg < 8; if still red, report and compare to base
    in the same window — the dispatcher decides with SC-561 in view.
- **r3 (2026-11-10)** — implementer fix round (resume of r1 identity); scoped re-review → r2
  reviewer identity (not the author).
- **r3 result (2026-11-10)** — head `9d446582`. e2e run 2 `163/164 ok, 0 failed, 1 known-bug,
  coverage: 113/113 pairs` (run 1 hit SC-517 RECOV-R07 at load 51). jest 6584/1 skip/2 SC-568
  timeouts (both suites 71/71 alone). Lifecycle part 5: G-S49 ok, G-S59 red on branch (30 s
  Runtime.evaluate timeout) AND on base 6270e84a same window (redraw wait timeout) → SC-561's
  domain. Markers: SC-566/567/572/573/574a/574b `test.failing`; POOL-C04 `knownBug('SC-572')`.
  INFO-3 dropped (gate keys (control, kind) across manifests; note in Reuse section).
- **r4 (2026-11-10)** — scoped re-review of `7f5b2647..9d446582` by the r2 reviewer identity.
- **r4 result (2026-11-10)** — scoped re-review LAND-READY at `9d446582`: 0 C/H/M/L, 1 INFO
  (SC-573 marker assumes a modal-side fix → noted on SC-573; SC-567 reword must cover the info
  line → noted on SC-567). e2e `163/164 ok, 0 failed, 1 known-bug, coverage: 113/113 pairs`.
- **LAND-READY (2026-11-10)** — dse `sc435-e2e-minion-pool` @ `9d446582`. Open item for the
  dispatcher: G-S59 red on branch and on base in the same window (SC-561). Skill proposal:
  `sc435-skill-proposal.md` (e2e CURRENT → 163/164 ok, 1 known-bug, 113/113; jest CURRENT →
  6584+; Obsidian 1.15.1; SC-568 load-sensitive suites).
- **Dispatcher hold (2026-11-10)** — landing held: lifecycle is a required land gate and G-S59 is
  red. Waiting for SC-561 (G-S59 timeout fix) to land; dispatcher will send the new develop sha.
  Then: rebase `sc435-e2e-minion-pool` onto it, re-run lifecycle part 5 (`G-S59 G-S49`) and the
  two SC-568 jest suites alone, report land-ready again. If SC-561 parks instead: re-run G-S59 on
  a quiet host. Next worker: resume implementer a8c0477c776accc4a (rebase + gates).
- **r5 (2026-11-10)** — SC-561 landed: dse develop `6153acfe`, workspace main `122117dd` (SC-561
  changed only `visual-harness/obsidian-lifecycle.mjs`; G-S59 lost its 8x CPU throttle; built
  main.js/styles.css byte-identical to 6270e84a). Implementer resumed: rebase dse branch onto
  6153acfe, superproject branch onto origin/main 122117dd (`-c submodule.recurse=false`), run
  lifecycle part 5 + the two SC-568 suites alone.
- **r5 result (2026-11-10)** — dse `2ee2e405` on 6153acfe (clean rebase, 6 commits); superproject
  at 122117dd (origin/main since moved to 51693653, docs-only). tsc/lint rc 0; lifecycle part 5
  `2/2 ok, 0 failed` (G-S59 green, load 7.4); SC-568 suites alone 71/71. e2e not rerun (6270e84a→
  6153acfe diff = lifecycle harness only). **LAND-READY again.**
