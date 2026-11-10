# SC-437 decisions ledger — e2e rollout (Tier 1): initiative tracker

Worktree: `/home/scott/code/steelCompendium/worktrees/sc437-e2e-initiative-tracker` (branch
`sc437-e2e-initiative-tracker` in every submodule). Cut 2026-11-10 from dse develop `10db67e3`,
workspace superproject `261bff7d` (main checkout was at `184ddedb`). Tracked branch for dse:
`develop`. Owner: Opus 5.5 ticket-owner, session `be71a0a9-199f-4e14-967b-191935312b05`.

## Scott's rulings (verbatim, dated)

- **2026-10-18 (SC-408):** "yes, I want to roll this out across all parts of the plugin,
  including the settings"
- **2026-10-18 (SC-408):** "For any bugs found, please mark them with the DSE 7.0.0 project."
- **2026-10-18 (SC-408, e2e gate):** "make it required to land future changes"
- **2026-11-10 (via dispatcher):** Scott activated the DSE 7.0.0 Backlog for work.

## Ticket scope (verbatim from the SC-437 description)

> **Scope:** the rest of `ds-initiative`, about 60 interactions. The plugin's highest-risk
> element: 15 of the last 300 commits are fixes to it. It covers turns and rounds, turn pips,
> malice, captain, selection, the title edit, the reset button with ResetEncounterModal, and the
> minion-squad and group controls. The stamina entry points (detail row and grid cell) are
> already covered by the SC-408 pilot.
>
> **Also in this ticket:** a census fix carried from the SC-408 review (R1 L-4). Both censuses
> find initiative's stamina entry points by CSS class (`test/dom/e2eCensus.test.ts:186`,
> `e2e/specs/_census.e2e.ts:52-57`), so a new control elsewhere in a row would escape them.
> Scope the census by the row and grid containers instead, and allowlist the ids of the other
> surfaces.
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
>   product fixes in the test ticket. (Scott, SC-408: "For any bugs found, please mark them
>   with the DSE 7.0.0 project.")
> * The full dse-verify battery is green, including `npm run e2e` with 0 failed and full
>   coverage.

## Owner rulings

- **2026-11-10 — Existing pilot manifest.** `e2e/manifest/initiative.ts` already exists (SC-485
  pilot: `init.hero.turn`, `init.reset-encounter`, `init.reset-encounter.confirm`). EXTEND it to
  the whole tracker; keep the existing ids and specs (`e2e/specs/initiative/*.e2e.ts`) green.
  Rename an existing id only if it is genuinely wrong, and say why in the report. Splitting the
  manifest into more than one file (e.g. `initiative.ts` + `reset-encounter-modal.ts`) is fine
  if it reads better.
- **2026-11-10 — Surface boundary.** In scope: every interactive node the tracker itself
  renders (`src/elements/initiative/view.ts` and what it mounts: header/title, round and turn
  controls, turn pips, malice, hero and creature rows, the roster grid, selection, captain,
  minion-squad and group controls, the chrome-panel items) plus ResetEncounterModal in full
  (confirm, cancel, Escape / close). NOT in scope (owned elsewhere — only `reach` rows, which
  already exist or cost no extra pair):
  - the StaminaEditModal and the tracker's stamina entry points (SC-408 pilot, landed);
  - the MinionStaminaPoolModal internals (SC-435, landed — reuse its `pool.ts` driver);
  - the ConditionsModal internals and its tracker reach rows (`init.cond.add`, hero AND
    creature) — **SC-436, running in parallel** (worktree `sc436-e2e-conditions-modal`). Do not
    add or change ids inside the conditions modal or edit `e2e/manifest/conditions-modal.ts`.
    If the census scope fix needs the conditions reach ids allowlisted, allowlist them by the
    ids that exist on develop today.
- **2026-11-10 — Census fix (R1 L-4).** Replace the CSS-class lookup with container scoping (the
  tracker root / each row / the grid) in BOTH censuses, so any eventful node anywhere in the
  tracker must carry an id from the initiative manifest or an allowlisted other-surface id
  (stamina, pool, conditions reach rows). Prove it catches a regression: a jsdom test that
  injects an un-id'd button into a row and expects a census finding.
- **2026-11-10 — Bug flow** (same as SC-435/436). Workers never touch the tracker. A worker
  that finds a product bug commits its coherent work, finishes the survey, and returns
  `STATUS: NEEDS_CONTEXT` ONCE with every bug's title, repro, file:line and severity. The owner
  files the Backlog ticket (DSE 7.0.0, Bug + DSE Plugin, related to SC-437) and resumes the
  worker with the key, which the worker then cites in `knownBug('SC-…')` / `test.failing`. No
  product fixes in this ticket; product source may change ONLY to add `data-dse-control`
  attributes (and census plumbing) — no behavior change.
- **2026-11-10 — Known open tickets touching this surface — cite, don't refile:** SC-291
  (persisted minion pool max goes stale when squad YAML is edited mid-encounter), SC-292
  (squad mixing a statblock-ref minion with a `captain_of` captain hard-fails to parse),
  SC-270 (spent-row dimming below AA — visual, not functional), SC-250 (malice column clips in
  print — visual), SC-384 (Live Preview: modal closes when a pending write lands), SC-393 (In
  Progress: max_stamina NaN for text stamina), SC-506 / SC-568 (jest load timeouts),
  SC-569 (two squads share one pool-modal title), SC-572/573/574 (pool modal). SC-556 is in
  flight (outside edit vs an open edit form, block write path): if a title-edit bug looks like
  that, report it and say so; the owner decides. If one of these reproduces, mark it with that
  key and tell the owner which.
- **2026-11-10 — Two phases, mandatory stop between them.** The surface is ~3x SC-435's. Phase A:
  ids + census fix + both censuses + the full manifest + jsdom matrix tests + the bug survey →
  commit → return `NEEDS_CONTEXT` (even with zero bugs) with the pair list and the bug list.
  The owner reviews the pair list, files bugs, and resumes for Phase B: e2e specs driving every
  pair, the markers, and the full battery.
- **2026-11-10 — Jest gate rule (carried from SC-435):** a full jest run must be green, or show
  only SC-568-class load timeouts (`twin-reuse`, `initiative-default-keys`, others possible
  under load) AND each failing suite green alone.
- **2026-11-10 — Lifecycle id.** G-S72 is reserved for this ticket if a lifecycle scenario is
  needed (not expected: e2e is the surface for this work).
- **2026-11-10 — Overlap with SC-436.** Both tickets touch the same e2e suite, census files and
  coverage count. Whichever lands second rebases and re-counts; keep edits to shared files
  (`e2eCensus.test.ts`, `_census.e2e.ts`, `e2e/driver/*`) small and additive so the rebase is
  mechanical.

## Battery baseline at 10db67e3 (dispatcher, 2026-11-10)

jest 6591 passed / 1 skipped / 258 of 259 suites (SC-568 load timeouts possible; green alone) ·
lifecycle 52/52 · e2e `163/164 ok, 0 failed, 1 known-bug (SC-572), coverage: 113/113 pairs` ·
shots 592, 0 FAIL, host-leak 163/978, capture clip OK (147 …) · freeze 280/280 · parity 0/0/24.

Expected after this ticket: jest and e2e counts rise; coverage Y/Y with Y > 113; lifecycle
52/52; shots/freeze/parity unchanged (attribute-only changes must not move print bytes —
report any move in host-leak or DOM numbers).

## Rounds

(appended as they run)
- **r1 phase A (2026-11-10)** — implementer (orchestration:implementer, id a086ec7335b75eace) on
  `sc437-brief-r1-implementer.md`; report → `sc437-r1-implementer-report.md`. Ticket → Awaiting.
  Phase B = resume of the same identity. Review (r2) goes to a fresh orchestration:reviewer.
- **r1 phase A result (2026-11-10)** — NEEDS_CONTEXT at `6ff53d29` (df8b7ed8 ids+manifests+censuses,
  6ff53d29 jsdom matrix). 20 new ids (tracker owns 29), 29 new pairs → expected coverage 142/142.
  tsc/lint clean; jest 6712 pass / 2 skip (fresh-worktree css cache) / 1 SC-568 timeout
  (`twin-reuse`, 46/46 alone); census 22/22; matrix 114/114. Fixtures `Initiative/rich.md`,
  `Initiative/captain.md`. 6 bug candidates.
- **Owner rulings on phase A (2026-11-10):**
  - Bugs filed (DSE 7.0.0, Bug + DSE Plugin, related SC-437): **SC-575** (Reset encounter leaves
    a minion squad's shared action pips pressed), **SC-576** (after Reset → Yes the rebuilt
    tracker paints no enemy rows — jsdom; real-Obsidian severity pending), **SC-577** (Malice can
    go negative: − at 0, negative round_gain, "+-3" label), **SC-578** (quick-add log keeps the
    typed amount when the pool clamped — possibly intended; the marker asserts ONLY that the
    logged entry and the pool change agree OR the entry shows the clamp, true under either fix),
    **SC-579** (typing "+3" in quick-add says "Amount required").
  - Candidate 6 (re-click selected cell / Reset turns on a clean tracker write identical bytes):
    NOT filed yet. Phase B checks it FIRST in real Obsidian — does the note file get rewritten
    (modify event / mtime) or does the framework skip identical bytes? Skipped → plain
    `expectNoWrite` tests. Rewritten → keep going on specs, and return NEEDS_CONTEXT with the
    evidence BEFORE the full battery so the owner files it.
  - SC-576 in real Obsidian: phase B asserts the screen after Reset → Yes. Report whether the
    enemy rows vanish there (owner updates SC-576's severity). The jsdom `test.failing` stays
    either way.
  - `init.cell.stamina` rename → drop (keep the SC-408 name; renaming churns two landed
    manifests for a naming nit).
  - Additive `away` argument on `dse.blur` → approved.
  - `init.cond.remove` (tracker-row condition remove icon) → ours. SC-436's branch does not touch
    `view.ts` (checked `cdd15469`); it does touch both census files, so the rebase is ours if
    SC-436 lands first.
  - Pair completeness (29 new vs the ticket's "about 60 interactions") → the r2 reviewer probes
    it independently.
- **r1 phase B (2026-11-10)** — implementer resumed (same id a086ec7335b75eace).
- **Baseline move (2026-11-10, dispatcher)** — SC-556 landed: dse develop `f69b8fd6`, workspace
  main `2bbebdf5` (every block edit form's Save is pin-only; lifecycle G-S64 extended;
  styles.css byte-identical; no e2e changes). New baseline: jest 6634 passed / 2 skipped / 258
  of 259 on a fresh worktree (SC-568 load timeouts possible, green alone) · lifecycle 52/52 ·
  e2e `163/164 ok, 0 failed, 1 known-bug (SC-572), coverage: 113/113 pairs` · shots 592,
  host-leak 163/978, capture clip 147 · freeze 280/280 · parity 0/0/24. Rebase onto it before
  land-ready (phase B implementer told by SendMessage).
- **r1 phase B result (2026-11-10)** — DONE_WITH_CONCERNS at `09644511`, rebased on `f69b8fd6`
  (2ca49d44 ids/manifests/censuses, d56974bb jsdom matrix, 09644511 e2e specs + markers +
  `dse.blur` away arg). tsc/lint clean; jest 6762 pass / 1 skip / 1 SC-568 `twin-reuse` timeout
  (53/53 alone); lifecycle 52/52; e2e `199/205 ok, 0 failed, 6 known-bug, coverage: 142/142
  pairs` (SC-572, SC-575, SC-576 ×2, SC-577, SC-578); shots 592 / 0 FAIL / host-leak 163/978 /
  clip 147; freeze 280/280; parity 0/0/24. 42 e2e scenarios in 7 files.
- **Owner rulings on phase B (2026-11-10):**
  - Candidate 6 → not a bug (real Obsidian skips identical bytes); plain `expectNoWrite` tests.
  - SC-576 → confirmed in real Obsidian and worse: heroes also show 0 Stamina + DYING. Owner
    eyeballed the screenshot. SC-576 retitled, raised to High, screenshot posted on it.
  - SC-579 → not reproducible in real Obsidian (jsdom sanitizer artifact). Canceled; kept as plain
    e2e `[INIT-M08]`.
  - SC-578 marker passes if entry amount == pool change OR the entry label no longer reads
    "Spend" — reviewer to judge whether the label clause is a fair reading of "the entry shows
    the clamp"; tighten if it would pass vacuously under an unrelated relabel.
- **r2 (2026-11-10)** — independent review (orchestration:reviewer, id a98f536d5f88166db) on
  `sc437-brief-r2-reviewer.md` → `sc437-r2-review-report.md`.
- **r2 result (2026-11-10)** — NOT LAND-READY at `09644511`: 0 C/H, 5 MEDIUM, 3 LOW, 5 INFO, 1 new
  product bug. Gates green (jest 6763/1 skip rc 0; lifecycle 52/52; e2e ×2 `199/205 ok, 0 failed,
  6 known-bug, coverage: 142/142`). Pairs complete (I-1: 142 recounted, no un-id'd node, no
  handler without a pair). 9/9 handler mutations red in e2e. Integrity probes pass.
- **Owner rulings on r2 (2026-11-10):**
  - NB-1 (focus drops to body after any whole-tracker rebuild) → filed **SC-588** (Bug, Medium,
    a11y; related SC-518). Marker required (e2e `knownBug('SC-588')` on a real-Obsidian focus
    assertion; jsdom `test.failing` optional).
  - I-5a (half-typed quick-add lost on Advance round) → filed **SC-589** (Bug, Low). Marker
    required (jsdom `test.failing` is enough).
  - I-5b (Reset encounter keeps a mid-fight captain promotion) → filed **SC-590** (Feature,
    decision). No marker; do not assert either behaviour as correct.
  - M-1..M-5 → **fold** into r3, as prescribed in `sc437-r2-review-report.md`.
  - L-1, L-2, L-3 → **fold**.
  - I-2 (jsdom K01-K02 misses a missing captain rebuild; e2e catches it) → fold if a one-line
    screen assertion in K01-K02 does it; otherwise drop (e2e covers).
  - I-1, I-3, I-4 → no action.
- **r3 (2026-11-10)** — implementer fix round (resume of r1 identity a086ec7335b75eace); scoped
  re-review → r2 reviewer identity a98f536d5f88166db (not the author).
- **r3 result (2026-11-10)** — DONE at `df5009ec` (one commit on 09644511; no rebase, develop still
  f69b8fd6; `src/` untouched). All M/L folded, I-2 folded, SC-588 (e2e `[INIT-F01]` knownBug +
  jsdom test.failing) and SC-589 (jsdom `[M10]` test.failing) markers; SC-590 unasserted. jest
  6765/1 skip rc 0; e2e `199/206 ok, 0 failed, 7 known-bug, coverage: 142/142 pairs`. Lifecycle/
  shots/freeze/parity not re-run (no src change, no rebase).
- **r4 (2026-11-10)** — scoped re-review of `09644511..df5009ec` by the r2 reviewer identity
  a98f536d5f88166db. Owner concern passed along: the M-4/M-3 SC-578 assertions now require the
  entry label to keep starting "Spend" — check that does not fail a legitimate reword fix.
- **r4 result (2026-11-10)** — NOT LAND-READY at `df5009ec`: 1 MEDIUM (r4-M1: SC-578 assertions
  require the label to START with "Spend" — a legit reword fix like "Capped at 0: Spend" leaves
  both markers reporting open and turns the plain clamp test red; `malice.e2e.ts:128`,
  `initiative-matrix.test.ts:736`, `:426`), 1 INFO (a correcting second log entry would be
  missed — only `log[0]` read). All r2 fixes confirmed by probe; all markers flip under
  simulated fixes; e2e `199/206 ok, 0 failed, 7 known-bug, coverage: 142/142 pairs`.
- **Owner rulings on r4 (2026-11-10):** r4-M1 → fold, exactly as the reviewer prescribed (markers:
  label contains "Spend" anywhere `/spend/i`, clamp clause also accepts the applied amount in the
  label — snippet in the r4 report; plain test: `toMatch(/Spend/i)` or drop the label assertion).
  INFO → drop (reviewer judges it acceptable; a second-entry fix is unlikely and SC-578's
  description names the two allowed fixes).
- **r5 (2026-11-10)** — implementer (a086ec7335b75eace) folds r4-M1; scoped re-check by reviewer
  a98f536d5f88166db.
- **r5 result (2026-11-10)** — DONE at `32441332` (test-only, 2 files, 10+/6-): r4-M1 folded with the
  reviewer's snippet; B1/B4 reword probes flip the SC-578 markers with plain tests green. tsc/lint
  rc 0; jest 6765/1 skip rc 0; e2e `199/206 ok, 0 failed, 7 known-bug, coverage: 142/142 pairs`.
- **r6 (2026-11-10)** — scoped re-check of `df5009ec..32441332` by reviewer a98f536d5f88166db.
- **r6 result (2026-11-10)** — reviewer: LAND-READY at `32441332`, no findings (diff matches the
  prescription; `[M09]` fails today for the stated reason, not vacuously; B1 flips it).
- **LAND-READY (2026-11-10)** — dse `sc437-e2e-initiative-tracker` @ `32441332`, on develop
  `f69b8fd6`. Gates: tsc/lint clean · jest 6765/1 skip · lifecycle 52/52 · e2e `199/206 ok,
  0 failed, 7 known-bug, coverage: 142/142 pairs` · shots 592/0 FAIL/host-leak 163/978/clip 147 ·
  freeze 280/280 · parity 0/0/24 (lifecycle/shots/freeze/parity on 09644511; later commits
  test-only, src/ unchanged). Overlap: SC-436 touches the same census files + coverage count —
  whichever lands second rebases and re-counts. Skill proposal for the dispatcher: dse-verify
  CURRENT e2e → `199/206 ok, 0 failed, 7 known-bug, coverage: 142/142 pairs` (before any SC-436
  re-count); jest CURRENT → 6765 / 1 skipped. Filed from this ticket: SC-575, SC-576 (High),
  SC-577, SC-578, SC-588, SC-589 (bugs, markers in tests), SC-590 (decision), SC-579 (canceled).
- **DONE (2026-11-10)** — landed by the dispatcher: dse develop `32441332`, workspace main
  `5d67d825` (merge) + `8a67dccf` (bookkeeping; dse-verify e2e today line → 199/206, 7 known-bug,
  142/142; CURRENT jest 6765/1/259 of 260). Ledger preserved at
  `docs/superpowers/dse-overhaul/build-ledgers/sc437-e2e-initiative-tracker/`. Worktree removed.
  SC-437 → Done. SC-436 rebases and re-counts. Filed from this ticket: SC-575, SC-576 (High),
  SC-577, SC-578, SC-588, SC-589 (bugs, markers in tests), SC-590 (decision), SC-579 (canceled).
