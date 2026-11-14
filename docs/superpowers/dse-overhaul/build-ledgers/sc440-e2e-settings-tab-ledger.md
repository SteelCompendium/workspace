# SC-440 decisions ledger — e2e rollout (Tier 2): plugin settings tab

Worktree: `/home/scott/code/steelCompendium/worktrees/sc440-e2e-settings-tab` (branch
`sc440-e2e-settings-tab` in every submodule). Cut 2026-11-14 from dse develop `a5313f9d`,
workspace superproject `42a14300` (= workspace origin/main at cut). Tracked branch for dse:
`develop`. Owner: Opus 5.5 ticket-owner, session `be71a0a9-199f-4e14-967b-191935312b05`.

## Scott's rulings (verbatim, dated)

- **2026-10-18 (SC-408):** "yes, I want to roll this out across all parts of the plugin,
  including the settings"
- **2026-10-18 (SC-408):** "For any bugs found, please mark them with the DSE 7.0.0 project."
- **2026-10-18 (SC-408, e2e gate):** "make it required to land future changes"

(SC-440 thread: no comments at start, 2026-11-14.)

## Ticket scope (verbatim from the SC-440 description)

> **Scope:** the DSE settings tab, about 45 controls. Each control writes `data.json`, and each
> change must show up live on already-rendered elements without a reload. Test every control end
> to end:
>
> * the setting persists to `data.json`;
> * an open note's elements re-render with it;
> * it survives a plugin reload.
>
> Shipped specs run with `experimental` OFF, so the controls the experimental gate hides
> (authoring controls, print preview) must be absent. A separate scenario covers them with the
> gate ON.
>
> **Done means** (the same bar as the SC-408 stamina pilot; start from
> `draw-steel-elements/e2e/README.md`):
>
> * Every interactive node on the surface carries a `data-dse-control` id. Both censuses cover the
>   surface: jsdom `test/dom/e2eCensus.test.ts` and real-Obsidian `e2e/specs/_census.e2e.ts`.
> * A manifest in `e2e/manifest/` lists every (control, interaction) pair. A full `npm run e2e`
>   drives each pair at least once through real input, asserting the note file and the screen. At
>   least one driver per pair is a plain test, not a known-bug test.
> * The combinatorial logic (values × states × variants) lives in jsdom matrix tests.
> * Every bug found gets a Backlog ticket in the DSE 7.0.0 project, labelled Bug + DSE Plugin. The
>   ticket gets a `knownBug('SC-…')` (e2e) or `test.failing` (jest) marker citing it. No product
>   fixes in the test ticket. (Scott, SC-408: "For any bugs found, please mark them with the DSE
>   7.0.0 project.")
> * The full dse-verify battery is green, including `npm run e2e` with 0 failed and full coverage.

## Owner rulings

- **2026-11-14 — Surface boundary.** In scope: every interactive node the DSE settings tab renders
  (`src/views/SettingsTab.ts`, `src/views/settingsDeclarative.ts`, the descriptor-driven prefs from
  `src/prefs/catalog.ts`, and any preview / preset / reset / advanced-disclosure / extra-button
  chrome the tab draws). The Compendium section's **Sync** and **Check for updates** buttons are in
  scope as settings-tab controls (id, census, their busy state — label swap and disabled — and
  the Notice / status line they produce), but the windows and file moves that sync or a
  destination-folder change open are **SC-441's surface** (compendium sync and migration modals):
  drive this ticket's pairs up to the point such a window opens, then close it, and do not
  manifest its internals. No e2e test may reach the real network: if the Sync / Check pairs need a
  stubbed release source and the harness has none, say so in the phase A report (NEEDS_CONTEXT) —
  don't build a large stub without a ruling. Not in scope: the generic block edit form, the
  sidebar host, Obsidian's own settings chrome. Ids prefixed `settings.` (implementer may refine,
  say why).
- **2026-11-14 — "Re-renders live" means** an already-open note's DSE elements change without a
  reload or a note re-open, asserted on the screen (a DOM attribute, class, CSS variable or
  rendered text that the setting controls), not only in `data.json`. "Survives a plugin reload"
  means disable + enable the plugin (or the harness's existing reload path) and re-read both the
  control's shown value and `data.json`. Pick a representative fixture element per setting; say
  which in the manifest comment.
- **2026-11-14 — Experimental gate.** Shipped specs run with `experimental` OFF: assert the gated
  controls (`authoringControls`, `printPreview`, and any other descriptor the gate filters) are
  ABSENT from the tab. One separate scenario (or a small set) runs with the gate ON and drives the
  gated controls. If the harness cannot flip the gate for one scenario without disturbing others,
  report how you did it or why you could not (NEEDS_CONTEXT in phase A).
- **2026-11-14 — Bug flow** (same as SC-435..438). Workers never touch the tracker. A worker that
  finds a product bug commits its coherent work, finishes the survey, and returns
  `STATUS: NEEDS_CONTEXT` ONCE with every bug's title, repro, file:line and severity. The owner
  files the Backlog ticket (DSE 7.0.0, Bug + DSE Plugin, related to SC-440) and resumes the worker
  with the key, which the worker then cites in `knownBug('SC-…')` / `test.failing`. No product
  fixes in this ticket; product source may change ONLY to add `data-dse-control` attributes (and
  census plumbing) — no behavior change.
- **2026-11-14 — Known open tickets touching this surface — cite, don't refile:** SC-217 (card-style
  toggle triggers a full page reload), SC-218 (Color theme / Ability card style hidden until
  supported — not a bug), SC-405 (Print preview hidden from 7.0.0 — the experimental gate),
  SC-161 (per-block overrides of structural statblock settings — feature), SC-359
  (`settings-evidence.mjs` never loads the plugin in a sandboxed Obsidian — tooling), SC-458
  (roving-tabindex click doesn't move focus), SC-626 / SC-615 / SC-614 (focus drops to the page
  after a write — a settings analogue is a NEW ticket that links them). Fixed and must stay fixed
  (a regression is a new bug): SC-228 (slider double value label), SC-243 (Sync / Check busy
  state), SC-372 / SC-422 (text-size prefs reach every surface), SC-140 (sync status line after a
  sync), SC-187 (settings preview).
- **2026-11-14 — Two phases, mandatory stop between them.** Phase A: ids + both censuses + the
  full manifest + jsdom matrix tests + the bug survey → commit → return `NEEDS_CONTEXT` (even with
  zero bugs) with the pair list, the bug list, and answers on the network stub and the gate flip.
  The owner reviews, files bugs, and resumes for Phase B: e2e specs driving every pair, the
  markers, and the full battery.
- **2026-11-14 — Jest gate rule:** jest's default timeout is 30 s since SC-568; an "Exceeded
  timeout" is a real hang until proven otherwise (re-run the suite alone first; do not blame
  load). A full jest run must be green.
- **2026-11-14 — Lifecycle id.** G-S124 is reserved for this ticket if a lifecycle scenario is
  needed (not expected: e2e is the surface for this work).
- **2026-11-14 — Scenario ids.** e2e ids `SET-*` (e.g. `SET-T01`). Scenario ids are global; check
  `grep -rn '\[SET-' e2e/` on develop AND the parallel SC-439 branch
  (`/home/scott/code/steelCompendium/worktrees/sc439-e2e-negotiation`, read-only). Census ids start
  at `[CENSUS-16]` (SC-438 used 10..12, SC-439 in flight uses 13..15). Never a bracketed ticket id
  in a test title (SC-577).
- **2026-11-14 — Overlap with parallel owners** SC-439 (ds-negotiation e2e, same Tier 2 shape) and
  SC-626 (montage focus after a write). Both may touch `e2eCensus.test.ts`, `_census.e2e.ts`,
  `e2e/driver/*`, `e2e/README.md`. Keep edits to shared files small and additive so a rebase is
  mechanical; whichever lands second rebases and re-counts.
- **2026-11-14 — No `rm` in /tmp or the scratchpad** (dispatcher): never `rm`, `rm -f`, `rm -rf` or
  `rmdir` anything there; leave throwaway files in place.

## Battery baseline at a5313f9d (dispatcher, 2026-11-14)

jest 12133 passed / 1 skipped with the shots cache (fresh figure: measure your own) · lifecycle
64/64 · e2e `424/437 ok, 0 failed, 13 known-bug, coverage: 233/233 pairs` · shots 592, host-leak
163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.

Expected after this ticket: jest and e2e counts rise; coverage Y/Y with Y > 233; lifecycle 64/64;
shots/freeze/parity unchanged (attribute-only changes must not move print bytes — report any move
in host-leak or DOM numbers).

Lifecycle: SEVEN `--only` parts — 1 `G-S7a … G-S9a` (21); 2 `G-S9b … G-S40` (16);
3 `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9); 4 `G-S57,G-S62,G-S61,G-S56` (4);
5 `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7); 6 `G-S92,G-S96,G-S97,G-S99` (4);
7 `G-S108,G-S112,G-S115` (3, ~200 s). G-S56 stays LAST in SCENARIOS order. A G-S91 FAIL is real
unless it says the host was too slow after two re-runs. G-S115 (g) suspected flake (SC-633): a (g)
red showing the "changed on disk first" Notice on a loaded host gets one re-run of part 7; a red on
the re-run, on a quiet host, or in any other G-S115 cell is real. SC-622: restore
`demo-vault/.obsidian/appearance.json` if dirty before blaming a change for a G-S97 FAIL.

## Land-ready rule (dispatcher, 2026-11-14)

Before reporting land-ready: the superproject branch sits on current workspace origin/main with
ONE pointer bump and no interim pointer commits.

## Rounds

(appended as they run)
- **r1 phase A (2026-11-14)** — implementer (orchestration:implementer, id a27d36b410b4bfe61) on
  `sc440-brief-r1-implementer.md`; report → `sc440-r1-implementer-report.md`. Ticket → Awaiting.
  Phase B = resume of the same identity. Review (r2) goes to a fresh orchestration:reviewer.
- **r1 phase A result (2026-11-14)** — NEEDS_CONTEXT at `9ac04ea0` (8cf9ad21 ids+manifest+censuses,
  f0199e24 jsdom matrix+integrity+fixtures, 9ac04ea0 manifest comment) on develop `a5313f9d`. 78 ids
  (42 settings controls + 36 sub-nodes / reset rows / page links), 118 new pairs → expected coverage
  351/351. Census ids `[CENSUS-16..17]`. tsc/lint clean; jest 12321 passed / 2 skipped / 0 failed
  (fresh baseline 12132 / 2, +189). 6 bug candidates; 11 integrity probes clean. Mechanics: (a) Sync /
  Check driven with a page-side `syncService.requestUrlFn` deferred stub, no network; (b) gate ON via
  `dse.setPrefs({}, { experimental: true })` in before / `dse.setPrefs({})` in after (5 specs already
  do this; CENSUS-17 proves it).
- **Owner rulings on phase A (2026-11-14):**
  - Id-stamping design (always-true `visible` predicate calling the duck-typed
    `getElementForDefinition`; `render` rows stamp inline) → **approved, on condition**: the predicate
    must never throw and must return true whatever happens inside it (try/catch around the stamp), and
    a jsdom test proves a tab whose `getElementForDefinition` is missing (minAppVersion is 1.13.0; the
    method is not in the 1.13 typings) still renders and shows every row. The r2 reviewer probes this.
  - Pair list (118) → **accepted** for phase B; keep the keyboard pairs (they reach our onChange). The
    r2 reviewer probes completeness and drops nothing on its own.
  - **Reload survival is batched**: one plugin reload per spec file (or a few), asserting every
    setting that file changed (shown value + `data.json`), not one reload per pair. Keep the e2e
    runtime increase reasonable; report the full-run wall time.
  - Bugs filed (DSE 7.0.0, Bug + DSE Plugin, related SC-440). Markers required (e2e `knownBug` where it
    shows in real Obsidian, else jsdom `test.failing`):
    - **SC-643** (Bug, **High**; also related SC-441) — empty Destination folder → Sync offers to trash
      the vault root (candidate 1). Marker asserts only that with an empty destination, Sync never
      opens a window offering to trash the vault root (a neutral fix — refuse in the field, ignore in
      `syncOptions`, or skip the root in the check — must flip it). NEVER click the trash button, in
      any test. Use the `requestUrlFn` stub; no network.
    - **SC-644** (Bug, Medium) — Collapsible by default / Start collapsed / Show edit button don't reach
      open blocks (candidates 2 + 4, one ticket). Markers: Collapsible by default (e2e knownBug) and
      Show edit button (gate-ON e2e knownBug if it reproduces in real Obsidian, else jsdom
      `test.failing`). **Start collapsed gets NO marker** (the ticket leaves open whether it should
      collapse open blocks): a plain test pins only that it applies to a block rendered after the
      change, plus persistence and reload.
    - **SC-645** (Bug, Medium) — Edit Recoveries with a popover doesn't reach an open stamina bar
      (candidate 3). e2e knownBug on the stamina bar; the hero analogue is in the ticket, no marker.
    - **SC-646** (Bug, Low; also related SC-441) — Sync drops a rejected promise → `Uncaught (in
      promise)` (candidate 5). knownBug on the failed-Sync drive only; the Sync click pair's PLAIN
      driver is the in-flight / successful stub path that does not reject.
    - **SC-647** (Bug, Low) — Fall back to steelcompendium.io links doesn't change links already drawn
      (candidate 6). Marker asserts only that an unresolved SCC link on an open note becomes a link
      after the setting is turned on (no reopen); the click-path behaviour is a plain test.
  - Observations (preview Sticky mini-header no effect, per-keystroke writes, unknown `prefs` key
    dropped per SC-406, one-option Locale) → no action; the per-keystroke write is noted in SC-643.
  - Follow-up (preview stage's inner controls) → drop here: those controls belong to the statblock /
    featureblock / feature surfaces, not this tab.
- **r1 phase B (2026-11-14)** — implementer resumed (same id a27d36b410b4bfe61).
- **r1 phase B result (2026-11-14)** — DONE at `4c430c1b` (0ada7229 specs + markers + predicate
  try/catch, 4c430c1b file-picker mark) on develop `a5313f9d` (no rebase). tsc/lint clean; jest 12324 /
  2 fresh, 12325 / 1 with cache; lifecycle 64/64 (first pass); e2e ×2 `487/506 ok, 0 failed, 19
  known-bug, coverage: 351/351 pairs` (247 s / 273 s, load 7-12); shots 592, host-leak 163/978, modal
  40/240, clip 147; freeze 280/280; parity 0/0/24. 10 spec files, 67 `SET-*` tests. Markers all e2e:
  SC-643 `[SET-C03]`, SC-646 `[SET-C04]`, SC-644 `[SET-L01]`,`[SET-G06]`, SC-645 `[SET-L02]`, SC-647
  `[SET-L03]`; Start collapsed plain `[SET-T05]`. Driver: `allowedErrors` in state/invariants. No new
  bugs. Correction: text fields write `data.json` on blur, not per keystroke (SC-643 agent notes
  patched).
- **r2 (2026-11-14)** — independent review (orchestration:reviewer, fresh identity, id a887a2808a50873ae) on
  `sc440-brief-r2-reviewer.md` → `sc440-r2-review-report.md`.
- **Baseline move (2026-11-14, dispatcher)** — SC-626 landed (montage focus after a write:
  `src/elements/montage/focusRules.ts`, kit `controlFocus.ts` gains opt-in `data-dse-focus-at` and
  per-family fallbacks, Live Preview carry reads optional `controlFocusRules()`; e2e MONT-F05..F13; 2 new
  manifest rows). dse develop `11fbded6`, workspace main `7399aa94`. New baseline: jest 12167 passed / 1
  skipped with the shots cache (fresh 12166 / 2) · lifecycle 64/64 · e2e `437/446 ok, 0 failed, 9
  known-bug, coverage: 235/235 pairs` · shots 592, host-leak 163/978, modal host-leak 40/240, clip 147 ·
  freeze 280/280 · parity 0/0/24. **Rebase onto `11fbded6` (and the superproject branch onto current
  workspace main, ONE pointer bump) before land-ready; expect conflicts in the shared e2e manifest.**
  Owner plan: r2 review continues on `4c430c1b`; the r3 fix round does the rebase. Expected after
  rebase (derived, +69 e2e tests of which 6 known-bug, +118 pairs, +192 jest): e2e `500/515 ok, 0
  failed, 15 known-bug, coverage: 353/353 pairs`; jest about 12359 / 1 with cache. SC-626 touched src
  (kit `controlFocus.ts`), so the rebased head re-runs tsc, lint, jest, lifecycle (seven parts), full
  e2e ×2; shots/freeze/parity re-run too (kit change on develop + our attribute plumbing).
- **r2 result (2026-11-14)** — reviewer a887a2808a50873ae: NOT LAND-READY at `4c430c1b`: 0 C/H, 2 MEDIUM,
  9 LOW, 6 INFO, 1 new product bug (Low). Gates re-run green (jest 12325 / 1; e2e ×2 `487/506 ok, 0
  failed, 19 known-bug, coverage: 351/351 pairs`, 270 / 265 s; lifecycle 64/64). 13 handler mutations red
  except the reset redraw; all 6 markers flip under simulated fixes; no test clicks trash; id stamping
  identical across base / head / throwing stamp / absent method (177 rows).
- **Owner rulings on r2 (2026-11-14):**
  - M-1 (no test proves a reset redraws the tab's own controls, `SettingsTab.ts:427`) → **fold**: after
    each reset (row and reset-all) assert the control on screen shows the default, in jsdom AND e2e; the
    redraw-removed mutant must go red outside the gate-on file.
  - M-2 (Enter on Sync / Check and the reset rows reaches our handlers, undeclared) → **fold**:
    `press:Enter` pairs on Sync, Check and every reset row, each with a plain drive. Enter on the 14 page
    links → **drop**: host navigation, not our handler.
  - L-1 (no harness network guard) → **fold**: settings specs install a default page-side
    `requestUrlFn` that throws loudly unless a test installs its own stub, so no settings test can reach
    the network.
  - L-2 (jsdom "picking steel" preset passes with the handler deleted) → **fold** (start from a
    non-steel state).
  - L-3 (`diskData()` times out before the session's first write; tests depend on earlier tests) →
    **fold**: `diskData()` handles a not-yet-written `data.json`; every SET test passes alone under
    `--only` (prove it on a sample of at least six across files, including SET-D13).
  - L-4 (SC-646 C04 allowance accepts any sync failure) → **fold**: narrow it to the stubbed 404 error.
  - L-5 (SET-L03 setup check and bug check share a message) → **fold**: distinct messages.
  - L-6 (SET-R06 asserts nothing on screen; SET-R08 title over-promises) → **fold**.
  - L-7 (SET-X03 asserts only `data.json`) → **fold**: assert the default image path's on-screen effect
    (`initiative/view.ts:1707`).
  - L-8 (stale manifest comment, `settings-tab.ts:122`) → **fold**.
  - L-9 (README fixture rows break the table) → **fold**.
  - I-1 rebase → **fold** (see the baseline move above: onto dse develop `11fbded6`; superproject onto
    current workspace origin/main, ONE pointer bump).
  - I-2 (breaking the gate restore turns nothing red) → **drop**: a leak is structurally impossible
    (fresh session + vault per spec file, `session.ts:20-22` refuses a gate-on start).
  - I-3 (settings search not probed) → **drop**: the predicate always answers true.
  - I-4 (`click-disabled` change will record SC-439's greyed modifier labels after its rebase) → no
    change here; owner tells the dispatcher at land-ready so the SC-439 owner expects it.
  - I-5 (SC-643 reproduces with `/`) → added to SC-643. No marker change.
  - I-6 (matrix expectations computed from the code under test, `settings-matrix.test.ts:107`, `:249`,
    `:581`) → **fold**: literal expectations.
  - PB-1 → filed **SC-651** (Bug, Low): picking "Custom" in Preset shows Custom though nothing was
    written; reopening shows the real preset. Marker (e2e knownBug) asserts ONLY that after the pick
    the dropdown shows the same value a page reopen shows.
- **r3 (2026-11-14)** — implementer fix round + rebase (resume of a27d36b410b4bfe61); scoped re-review →
  reviewer a887a2808a50873ae (not the author).
- **Baseline move (2026-11-14, dispatcher)** — SC-439 landed (negotiation e2e + jsdom, `NEGO-*` and
  `CENSUS-13..15`; src adds data-dse-control ids in kit `tabs.ts`, `track.ts` and the negotiation). dse
  develop `8a81c5a7`, workspace main `8dd3c4a4`. New baseline: jest 12552 passed / 1 skipped with the
  shots cache · lifecycle 64/64 · e2e `478/500 ok, 0 failed, 22 known-bug, coverage: 287/287 pairs` ·
  shots 592, host-leak 163/978, modal host-leak 40/240, clip 147 · freeze 280/280 · parity 0/0/24.
  **r3 rebase target is now `8a81c5a7`** (supersedes `11fbded6`); superproject onto `8dd3c4a4`+, ONE
  pointer bump. Census ids stay 16..17 (no clash). I-4 now bites on our rebase (SC-439's greyed
  modifier labels, `ArgumentView.ts:306`, recorded as `click-disabled` by our `dse.ts` change) → the r3
  implementer makes it correct and minimal and reports what it did. Expected after r3: e2e about
  `541+/570+ ok, 0 failed, 29 known-bug, coverage: (405 + new Enter pairs)/same`; jest about 12744+ / 1
  with cache. Course correction sent to a27d36b410b4bfe61 mid-round.
- **r3 result (2026-11-14)** — DONE: dse `e4e2be2f` on develop `8a81c5a7` (7 commits: 64d61d55, 6df73d89,
  44fa4f33, 431d99f4, 1c659fcc, cd561e49 r2 fixes, e4e2be2f greyed-label rule scoped to `settings.`);
  superproject `b1c3c8af` on origin/main `c3f9b129`, ONE gitlink line, status clean (owner verified).
  tsc/lint rc 0; jest 12744 / 1; lifecycle 64/64; e2e ×2 `552/581 ok, 0 failed, 29 known-bug, coverage:
  416/416 pairs` (288 / 296 s); shots 592 / 163/978 / 40/240 / 147; freeze 280/280; parity 0/0/24.
  416 = 287 + 118 + 11 Enter pairs. SC-651 marker `[SET-D16]`. M-1 mutant red in 9 jsdom + e2e R01/R03/
  R07/R09/R12. 15 SET tests pass alone. Back-click flake fixed in the driver (wait for page slide).
  I-4: `is-disabled` → `click-disabled` scoped to `settings.` ids; SC-439 manifest untouched.
- **r4 (2026-11-14)** — scoped re-review of the r3 delta by reviewer a887a2808a50873ae.
- **Baseline move (2026-11-14, dispatcher)** — SC-625 landed (`src/elements/montage/model.ts` keeps unknown
  keys on write; e2e MONT-X11..X14, MONT-X09/X10 markers flipped). dse develop `76520b1f`, workspace main
  `f9ebe6e8`. New baseline: jest 12575 / 2 fresh (12576 / 1 with cache) · lifecycle 64/64 · e2e `484/504
  ok, 0 failed, 20 known-bug, coverage: 287/287 pairs` · shots 592, host-leak 163/978, modal 40/240, clip
  147 · freeze 280/280 · parity 0/0/24. New dse-verify footgun: lifecycle filter is `--only=A,B` WITH an
  equals sign; with a space it runs the whole suite. Owner plan: r4 re-review continues on `e4e2be2f`;
  r5 = rebase onto `76520b1f` (+ any r4 folds), superproject onto current origin/main, ONE pointer bump
  (amend). Battery on the rebased head: tsc, lint, jest, lifecycle (seven parts), full e2e ×2;
  shots/freeze/parity carry (SC-625 is montage model write logic; our src is attribute stamping only;
  SC-438 precedent). Expected: e2e `558/585 ok, 0 failed, 27 known-bug, coverage: 416/416 pairs`; jest
  about 12768 / 1 with cache.
- **r4 result (2026-11-14)** — reviewer a887a2808a50873ae: NOT LAND-READY at `e4e2be2f`: 0 C/H, 1 MEDIUM,
  1 LOW, 3 INFO, 0 new bugs. All r2 folds bite; range-diff context-only; src identical to r2; dse.ts
  scoping minimal; `pageSettled` a bounded 5 s DOM wait. e2e A rc 1 `551/581 ok, 1 failed (SET-X03)`,
  B `552/581 ok, 0 failed, 29 known-bug, coverage: 416/416 pairs` (385 / 370 s). SET-X03 failed 3 of 7
  runs (stale element).
- **Owner rulings on r4 (2026-11-14):**
  - R4-M1 (SET-X03 flakes: page-side mark then `$('[data-picked="1"]')` click goes stale when the picker
    redraws, `fields.e2e.ts:53-54`) → **fold**: pick by keyboard in the suggester (type the file name,
    then Enter) if Obsidian's suggester accepts it; otherwise retry on a stale-element error ONLY, up to
    3 times. Prove it: `--only=SET-X03` ×5 and `--element=settings` ×3, then the two full runs, under
    parallel load (a concurrent jest run is fine).
  - R4-L1 (reload tests load a file they seeded, not the drives' file; four setPrefs seeds lack
    `settingsVersion` and take the v0 migration path, `src/model/Settings.ts:86`) → **fold** as
    prescribed: seed only when the disk doesn't already hold the expected state, and then with
    `seedData({ settingsVersion: 3, … })` — so the reload asserts what the drives wrote.
  - R4-I1 (rebase) → **fold** with the r5 rebase onto `76520b1f`; superproject onto current
    origin/main (`18f8043f` or newer), amend to ONE pointer bump.
  - R4-I2, R4-I3 → no action (acceptable / reporting detail).
- **r5 (2026-11-14)** — implementer a27d36b410b4bfe61: R4-M1 + R4-L1 + rebase; scoped re-check →
  reviewer a887a2808a50873ae.
- **Baseline move (2026-11-14, dispatcher)** — SC-643 landed (new `src/model/CompendiumDestination.ts`
  resolver; guards in `main.ts`, the sync and migration services, `LegacyCompendiumModal` and the trash
  call; 106 new jest). dse develop `7b9e82cf`, workspace main `120cf676`. New baseline: jest 12681 / 2
  fresh · lifecycle 64/64 · e2e `484/504 ok, 0 failed, 20 known-bug, coverage: 287/287 pairs` · shots 592,
  host-leak 163/978, modal 40/240, clip 147 · freeze 280/280 · parity 0/0/24. We land second, so both
  cross-effort items are ours (dispatcher relaying the SC-643 owner): (1) `knownBug('SC-643', '[SET-C03]
  …')` → a PLAIN test of the fixed behaviour (still never clicks trash); (2)
  `settings-matrix.test.ts:483` `syncOptions().releaseTag` → `syncOptions()?.releaseTag` (TS2531). r5
  rebase target is now `7b9e82cf` (supersedes `76520b1f`); superproject onto `120cf676`+. Course
  correction sent mid-round. Expected after r5: e2e `559/585 ok, 0 failed, 26 known-bug, coverage:
  416/416 pairs`; jest about 12873 / 2 fresh.
- **r5 result (2026-11-14)** — DONE: dse `2207c45b` on develop `7b9e82cf`; superproject `c84b1e12` on
  origin/main `c588bbaa`, ONE gitlink line, clean (owner verified; origin/main and develop current).
  `src/` delta vs base unchanged (3 files, +215/-23, stamping only). tsc/lint rc 0; jest 12875 / 1
  (cache); lifecycle 64/64 (`--only=`); e2e ×2 `560/586 ok, 0 failed, 26 known-bug, coverage: 416/416
  pairs` (455 / 404 s, concurrent jest). X03 keyboard pick + bounded (≤3) re-click when the picker
  doesn't open; final head X03 alone 5/5, `--element=settings` 3/3 (74/80 ok, 6 known-bug). R4-L1:
  `ensureState` reloads the drives' file, seeds `settingsVersion: 3` only when absent; `withPrefs`
  patches. SC-643: `[SET-C03]` plain (blank → default folder, lookup asked, no trash window, setting
  stays `''`); new `[SET-C07]` (`/` refused with a Notice, no lookup, no window); jsdom destination
  values; `syncOptions()?.releaseTag`.
- **r6 (2026-11-14)** — scoped re-check of the r5 delta by reviewer a887a2808a50873ae.
- **r6 result (2026-11-14)** — reviewer a887a2808a50873ae: LAND-READY at `2207c45b`; 0 C/H/M, 2 LOW, 1 INFO,
  0 new bugs. Range-diff "=" on all 7 rebased commits; src delta identical to r2; X03 fixed not masked
  (never-open and wrong-file mutants red); SET-C03/C07 match SC-643 D1/D2 and go red with SC-643 reverted;
  no trash click anywhere. e2e `560/586 ok, 0 failed, 26 known-bug, coverage: 416/416 pairs` (376 s);
  superproject c84b1e12 one gitlink line on c588bbaa, clean.
- **Owner rulings on r6 (2026-11-14):**
  - R6-L1 (`ensureState` reseeds silently in a full run, so a reload test can't catch an earlier drive's
    bad write or cross-talk, `settingsDrive.ts:163-172`) → **fold** as prescribed: seed only on a
    filtered single-test run (the env the runner sets for `--only`; check which); otherwise assert the
    disk equals the expected state BEFORE the reload. The broken-Card-size-write mutant must turn SET-Z06
    red in a full run.
  - R6-L2 (stale comment `fields.e2e.ts:3`) → **fold**.
  - R6-I1 (X03 re-click records extra `click` drives on a declared pair) → **drop**: harmless.
- **r7 (2026-11-14)** — implementer a27d36b410b4bfe61 folds R6-L1 + R6-L2 (amend superproject pointer);
  scoped check → reviewer a887a2808a50873ae.
- **r7 result (2026-11-14)** — DONE: dse `941b814f` on develop `7b9e82cf` (delta from 2207c45b: settingsDrive.ts
  +10/-5, fields.e2e.ts comment); superproject `e8cfac1e` on origin/main `c588bbaa`, ONE gitlink line,
  clean (owner verified; both bases current). `ensureState` seeds only under `DSE_E2E_GREP` (`--only`),
  else asserts disk == expected before the reload. Mutant (Card size write dropped): `--element=settings`
  72/80, Z02 + Z06 red. Six reload tests pass alone. tsc/lint rc 0; e2e ×2 `560/586 ok, 0 failed, 26
  known-bug, coverage: 416/416 pairs` (323 / 334 s). jest, lifecycle, shots, freeze, parity carry.
- **r8 (2026-11-14)** — narrow check of the r7 delta by reviewer a887a2808a50873ae.
- **r8 result (2026-11-14)** — reviewer a887a2808a50873ae: LAND-READY at `941b814f`, 0 findings.
  `DSE_E2E_GREP` set only under `--only` (run.mjs:532); `--element=settings` 74/80 ok, 0 failed, 6
  known-bug; `--only=SET-Z06` 1/1; Card-size mutant red on Z02 + Z06; superproject e8cfac1e one gitlink
  line on c588bbaa, clean.
- **LAND-READY (2026-11-14)** — dse `sc440-e2e-settings-tab` @ `941b814f` on develop `7b9e82cf`; superproject
  `sc440-e2e-settings-tab` @ `e8cfac1e` on origin/main `c588bbaa` (ONE pointer bump). Gates: tsc/lint clean ·
  jest 12875 / 1 (cache) · lifecycle 64/64 · e2e `560/586 ok, 0 failed, 26 known-bug, coverage: 416/416
  pairs` · shots 592 / host-leak 163/978 / modal 40/240 / clip 147 · freeze 280/280 · parity 0/0/24
  (shots/freeze/parity at `e4e2be2f`; src unchanged since). No CHANGELOG bullet (tests only). Skill
  proposal: `sc440-skill-proposal.md`. Filed: SC-643 (fixed, landed), SC-644, SC-645, SC-646, SC-647,
  SC-651 (bugs, markers in tests).
- **DONE (2026-11-14)** — landed by the dispatcher: dse develop `941b814f`, workspace main `91896adf`
  (bookkeeping `ff1a195e`: ledger preserved at `docs/superpowers/dse-overhaul/build-ledgers/sc440-e2e-settings-tab/`,
  dse-verify proposal applied; worktree removed). SC-440 → Done via linear-post.py `--state Done`, verified
  (status Done, completedAt 2026-11-14T14:48:08Z). Filed from this ticket: SC-643 (fixed before landing),
  SC-644, SC-645, SC-646, SC-647, SC-651 (bugs, markers in tests).
