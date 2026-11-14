# SC-439 decisions ledger — e2e rollout (Tier 2): ds-negotiation

Worktree: `/home/scott/code/steelCompendium/worktrees/sc439-e2e-negotiation` (branch
`sc439-e2e-negotiation` in every submodule). Cut 2026-11-13 from dse develop `6785fa06`,
workspace superproject `f219c18c` (= workspace origin/main at cut). Tracked branch for dse:
`develop`. Owner: Opus 5.5 ticket-owner, session `be71a0a9-199f-4e14-967b-191935312b05`.

## Scott's rulings (verbatim, dated)

- **2026-10-18 (SC-408):** "yes, I want to roll this out across all parts of the plugin,
  including the settings"
- **2026-10-18 (SC-408):** "For any bugs found, please mark them with the DSE 7.0.0 project."
- **2026-10-18 (SC-408, e2e gate):** "make it required to land future changes"

(SC-439 thread: no comments at start, 2026-11-13.)

## Ticket scope (verbatim from the SC-439 description)

> **Scope:** `ds-negotiation`, about 35 interactions: tabs, the interest and patience tracks,
> motivation and pitfall chips, checkboxes, and reset.
>
> **Done means** (the same bar as the SC-408 stamina pilot; start from
> `draw-steel-elements/e2e/README.md`):
>
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

- **2026-11-13 — Surface boundary.** In scope: every interactive node `ds-negotiation` renders —
  `src/elements/negotiation/view.ts` (card head, tabs, the reset menu button and its menu item)
  and the views it mounts from `src/drawSteelAdmonition/negotiation/`: `PatienceInterestView.ts`,
  `EndBandView.ts`, `MotivationsPitfallsView.ts`, `ArgumentView.ts`, `LearnMoreView.ts` — plus
  the negotiation's chrome-panel items. The reset menu is Obsidian's native `Menu`: drive it in
  real Obsidian; if a native menu item cannot carry `data-dse-control`, record the pair on the
  menu BUTTON (or follow whatever pattern an existing manifest already uses for a native Menu
  item) and say which. NOT in scope: the generic block edit form (`src/authoring/FormModal.ts`)
  except as a `reach` row if the negotiation's own chrome opens it and an existing manifest
  already lists it; the sidebar host. Ids prefixed `negotiation.` (implementer may refine, say
  why).
- **2026-11-13 — Bug flow** (same as SC-435/436/437/438). Workers never touch the tracker. A
  worker that finds a product bug commits its coherent work, finishes the survey, and returns
  `STATUS: NEEDS_CONTEXT` ONCE with every bug's title, repro, file:line and severity. The owner
  files the Backlog ticket (DSE 7.0.0, Bug + DSE Plugin, related to SC-439) and resumes the
  worker with the key, which the worker then cites in `knownBug('SC-…')` / `test.failing`. No
  product fixes in this ticket; product source may change ONLY to add `data-dse-control`
  attributes (and census plumbing) — no behavior change.
- **2026-11-13 — Known open tickets touching this surface — cite, don't refile:** SC-599 (any
  write drops the user's YAML comments and quotes and turns flow lists into block lists —
  plugin-wide), SC-384 (Live Preview: modal closes when a pending write lands), SC-458 (clicking
  a roving-tabindex control inside a DSE card doesn't move keyboard focus to it), SC-353 (fake
  hosts never load their views), SC-319 (markdown task-list checkboxes unthemed — visual),
  SC-391 (ds-scc negotiation has no renderer — other element). Montage analogues that are NOT
  the negotiation's tickets: SC-625 (montage write deletes unknown YAML keys), SC-626 (montage
  focus drops after a write), SC-628 (montage wrong-type values), SC-615 / SC-614 (initiative /
  conditions focus). A negotiation analogue of any of those is a NEW ticket that links the
  montage one — report it as a bug candidate and say which ticket it mirrors. Fixed and must
  stay fixed (a regression is a new bug): SC-493 (block edit form: saving an emptied raw-YAML
  box turned negotiation into an error card), SC-482 (wrapper blocks writing default keys the
  user never wrote), SC-527 / SC-530 (host-leak sweeps of click-reached states and the
  `aria-checked` tier row — these are shots gates; do not move them).
- **2026-11-13 — Two phases, mandatory stop between them.** Phase A: ids + both censuses + the
  full manifest + jsdom matrix tests + the bug survey → commit → return `NEEDS_CONTEXT` (even
  with zero bugs) with the pair list and the bug list. The owner reviews the pair list, files
  bugs, and resumes for Phase B: e2e specs driving every pair, the markers, and the full battery.
- **2026-11-13 — Jest gate rule:** jest's default timeout is 30 s since SC-568; an "Exceeded
  timeout" is a real hang until proven otherwise (re-run the suite alone first; do not blame
  load). A full jest run must be green.
- **2026-11-13 — Lifecycle id.** G-S122 is reserved for this ticket if a lifecycle scenario is
  needed (not expected: e2e is the surface for this work).
- **2026-11-13 — Scenario ids.** e2e ids `NEGO-*` (e.g. `NEGO-T01` tabs, `NEGO-P01` patience,
  `NEGO-I01` interest, `NEGO-M01` motivations, `NEGO-A01` arguments, `NEGO-R01` reset —
  implementer picks the letters). Scenario ids are global. Census ids: develop's highest is
  `[CENSUS-09]`; SC-438 (in flight, landing soon) uses `[CENSUS-10..12]`; SC-615 adds none.
  Take `[CENSUS-13]` onward. Never a bracketed ticket id in a test title (SC-577).
- **2026-11-13 — Overlap with parallel owners** SC-438 (montage e2e: touches `e2eCensus.test.ts`,
  `_census.e2e.ts`, `e2e/driver/dse.ts`, `e2e/README.md` fixture table) and SC-615 (initiative
  quick-add focus). Keep edits to shared files small and additive so a rebase is mechanical;
  whichever lands second rebases and re-counts. SC-438 is expected to land first.
- **2026-11-13 — No `rm` in /tmp or the scratchpad** (dispatcher): "Never `rm`, `rm -f`, `rm -rf`
  or `rmdir` anything in /tmp or the scratchpad (two workers this wave hung on a permission
  prompt doing that); leave throwaway files in place".

## Battery baseline at 6785fa06 (dispatcher, 2026-11-13)

jest 11918 passed / 1 skipped with the shots cache (fresh 11917 / 2, derived; measure your own
fresh figure) · lifecycle 64/64 · e2e `342/345 ok, 0 failed, 3 known-bug, coverage: 176/176
pairs` (known bugs SC-257, SC-355, SC-384) · shots 592, host-leak 163/978, modal host-leak
40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.

Expected after this ticket: jest and e2e counts rise; coverage Y/Y with Y > 176 (> 233 once
SC-438 lands); lifecycle 64/64; shots/freeze/parity unchanged (attribute-only changes must not
move print bytes — report any move in host-leak or DOM numbers).

Lifecycle: SEVEN `--only` parts — 1 `G-S7a … G-S9a` (21); 2 `G-S9b … G-S40` (16);
3 `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9); 4 `G-S57,G-S62,G-S61,G-S56` (4);
5 `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7); 6 `G-S92,G-S96,G-S97,G-S99` (4);
7 `G-S108,G-S112,G-S115` (3, ~200 s). G-S56 stays LAST in SCENARIOS order. A G-S91 FAIL is real
unless it says the host was too slow after two re-runs. G-S115 (g) suspected flake (SC-633): a
(g) red that shows the "changed on disk first" Notice on a loaded host gets one re-run of part 7;
a red on the re-run, on a quiet host, or in any other G-S115 cell is real. SC-622: restore
`demo-vault/.obsidian/appearance.json` if dirty before blaming a change for a G-S97 FAIL.

## Land-ready rule (dispatcher, 2026-11-13)

Before reporting land-ready: the superproject branch sits on current workspace origin/main with
ONE pointer bump and no interim pointer commits.

## Rounds

(appended as they run)
- **r1 phase A (2026-11-13)** — implementer (orchestration:implementer, id a3658a2a3305dd8b3) on
  `sc439-brief-r1-implementer.md`; report → `sc439-r1-implementer-report.md`. Phase B = resume of
  the same identity. Review (r2) goes to a fresh orchestration:reviewer.
- **r1 phase A result (2026-11-14)** — NEEDS_CONTEXT at `bf4caebf` (8a0ddfc0 ids, 0a39ca8f manifest
  45 pairs + fixtures, 2c9bd1b6 censuses `[CENSUS-13..15]`, bf4caebf jsdom matrix 355 tests), on
  develop `6785fa06`. 18 ids (`negotiation.*`), 45 pairs → expected coverage 221/221 before SC-438's
  pairs. tsc/lint rc 0; jest fresh 12287 passed / 2 skipped / 0 failed (fresh base 11917 + 370).
  6 bug candidates + 2 questions. Native Reset menu item stamped via `MenuItem.dom` (typed cast).
- **Owner rulings on phase A (2026-11-14):**
  - Pair list (45; extra over "about 35" = arrow/Home/End on three radiogroups + tablist, 2
    click-disabled) → accepted for phase B; the r2 reviewer probes completeness independently.
  - Native menu: `MenuItem.dom` stamp → approved; if `[CENSUS-14]` shows the id is absent on the
    real node, fall back to the pair on the button and report it.
  - Kit changes (optional `control` option on `tabs`, `track`, `powerRollPanel`; jsdom `MenuItem`
    mock gains `dom`) → approved as attribute plumbing; reviewer checks no behavior change.
  - Bugs filed (DSE 7.0.0, Bug + DSE Plugin, related SC-439). Markers required (e2e `knownBug`
    where it shows in real Obsidian, else jsdom `test.failing`):
    - **SC-637** (Medium) — B1: a write deletes unknown YAML keys, top-level AND inside each
      motivation / pitfall (mirrors SC-625). Marker per place (top-level, list item).
    - **SC-638** (Low) — B2 + B6 in one ticket: wrong-type hand-typed values give an error card
      with a raw JS message (case 1); a fractional / junk standing draws a seal that disagrees with
      the ending (case 2) (mirrors SC-628). Marker per case; case 1 asserts ONLY "no raw JS error
      text", case 2 ONLY "the seal shown agrees with the ending" — never a specific fix.
    - **SC-639** (Low) — B3: Reset drops keyboard focus to the page (mirrors SC-626/SC-615). Phase B
      checks it in REAL Obsidian first: reproduces → e2e `knownBug('SC-639')` on a real focus
      assertion (+ the jsdom `test.failing`); does NOT reproduce → plain e2e test asserting focus is
      kept, and report it (owner cancels SC-639). Also check focus after Complete Argument in real
      Obsidian (jsdom keeps it; report if Chrome drops it — that is a new candidate).
    - **SC-640** (Low) — B5: two same-named motivations → first chip blank and dead; a nameless
      motivation → `aria-label="Appeal to "`. Marker per case.
    - **SC-641** (Low) — the two questions: a block with no Interest opens already over; Reset of a
      current-only block lands on an ended negotiation. Markers assert ONLY "a block without
      Interest does not open ended" and "Reset of a current-only block does not end it" — never a
      specific default value.
  - B4 (Reset on an already-initial negotiation rewrites the note) → drop as a ticket: real Obsidian
    skips identical bytes (SC-437 candidate 6; SC-438 `[MONT-S07]` precedent). Phase B asserts it
    with `expectNoWrite` in real Obsidian; if the file IS rewritten there, report it before the full
    battery.
  - Follow-ups:
    - Edit pencil (`authoringControls` pref) has no id and the censuses run with the pref off →
      out of scope; the pencil is the deferred form editor (SC-404, hidden in 7.0.0). Owner adds the
      census gap to SC-404. No work here.
    - `e2e/driver/negotiation.ts` driver with a page-level helper for the native menu item →
      approved (additive; don't touch `dse.ts` beyond a small additive helper if unavoidable).
    - One negotiation collapse / expand scenario → approved (asserts the card; state is
      session-only, so assert the note is NOT written).
    - Same-key reorder on first write → part of SC-637's description; SC-599 for comments/quotes.
      No separate marker.
- **r1 phase B (2026-11-14)** — implementer resumed (same id a3658a2a3305dd8b3).
- **Baseline move (2026-11-14, dispatcher)** — SC-438 landed (montage e2e + jsdom; `MONT-*`,
  `CENSUS-10..12`; src = montage `data-dse-control` attributes only). dse develop `f6e504c7`,
  workspace main `0bf4430e`. New baseline: jest 12125 passed / 1 skipped with the shots cache (fresh:
  12124 / 2) · lifecycle 64/64 · e2e `415/428 ok, 0 failed, 13 known-bug, coverage: 233/233 pairs` ·
  shots 592, host-leak 163/978, modal 40/240, clip 147 · freeze 280/280 · parity 0/0/24. **Rebase onto
  `f6e504c7` before the full phase B battery** (conflicts expected in `e2eCensus.test.ts`,
  `_census.e2e.ts`, `e2e/driver/dse.ts`, `e2e/README.md`; keep both sides). Superproject branch onto
  current workspace origin/main with ONE pointer bump before land-ready. Expected after: e2e coverage
  278/278 (233 + 45), known-bug 13 + the SC-439 markers.
- **Baseline move (2026-11-14, dispatcher)** — SC-615 landed (initiative `view.ts` roster-click focus;
  jest +8; e2e INIT-F17..F25; no new pairs). dse develop `a5313f9d`, workspace main `bf79f688`. New
  baseline: jest 12133 passed / 1 skipped with the shots cache (fresh 12132 / 2) · lifecycle 64/64 ·
  e2e `424/437 ok, 0 failed, 13 known-bug, coverage: 233/233 pairs` · shots 592, host-leak 163/978,
  modal 40/240, clip 147 · freeze 280/280 · parity 0/0/24. **Rebase target is now `a5313f9d`**
  (supersedes `f6e504c7` above). Expected after: coverage 278/278; ok/total = 424/437 + the NEGO tests.
- **r1 phase B result (2026-11-14)** — DONE at `1b514494` on dse `f6e504c7` (rebased: 8a0ddfc0→c85a91b1,
  0a39ca8f→513df3a7, 2c9bd1b6→c7a75f98, bf4caebf→cb3a50a8, b63401cf→1b514494). tsc/lint clean; jest
  fresh 12503 / 2 skipped (12124 + 379); lifecycle 64/64; e2e ×2 `451/474 ok, 0 failed, 23 known-bug,
  coverage: 278/278 pairs`; shots 592 0 FAIL, host-leak 163/978, modal 40/240, clip 147; freeze
  280/280; parity 0/0/24. CENSUS-14 green → `MenuItem.dom` id is on the real menu item. B4: Reset on
  untouched negotiation writes nothing in Obsidian (`NEGO-R04` expectNoWrite, plain). SC-639 reproduces
  in Obsidian (`NEGO-F01` + jsdom `K05`). New B7: Complete Argument + Enter drops focus out of the card
  (real Obsidian only) → filed **SC-642** (Low), marker `NEGO-F02`. Markers: SC-637 X06/X07/K01/K02;
  SC-638 W02/W03/K03/K04; SC-639 F01/K05; SC-640 W04/W05/K06/K07; SC-641 W06/W07/K08/K09; SC-642 F02.
- **Owner ruling (2026-11-14):** rebase onto `a5313f9d` + swap NEGO-F02 key to SC-642; re-run tsc, lint,
  jest, lifecycle (7 parts), full e2e once; skip shots/freeze/parity (SC-615 initiative focus only; this
  branch's print bytes proven unchanged at f6e504c7). Expected e2e `460/483 ok, 0 failed, 23 known-bug,
  coverage: 278/278 pairs`. r2 review (fresh orchestration:reviewer) runs on the a5313f9d head.
- **r1 rebase result (2026-11-14)** — head `99fa593a` on dse `a5313f9d` (c85a91b1→07f91eaf,
  513df3a7→37228e4e, c7a75f98→37f1ca45, cb3a50a8→f2821898, 1b514494→48b9b79a, + 99fa593a NEGO-F02 →
  SC-642). tsc/lint clean; jest 12512 / 1 skipped (cache); lifecycle 64/64; e2e `460/483 ok, 0 failed,
  23 known-bug, coverage: 278/278 pairs`.
- **r2 (2026-11-14)** — independent review (orchestration:reviewer, fresh identity) on
  `sc439-brief-r2-reviewer.md` → `sc439-r2-review-report.md`, head `99fa593a`, base `a5313f9d`.
- **r2 result (2026-11-14)** — reviewer (orchestration:reviewer, id a7d459443104db28b): NOT LAND-READY at
  `99fa593a`: 0 C/H, 1 MEDIUM, 5 LOW, 6 INFO, 3 new bug candidates. Gates green (jest 12512/1; e2e ×2
  `460/483 ok, 0 failed, 23 known-bug, coverage: 278/278`; lifecycle 64/64). 16 handler mutants all
  red; both censuses red on rogue buttons; MenuItem.dom stamp real; all markers flip under simulated
  fixes (except the L-2 plain test that pins SC-641).
- **Owner rulings on r2 (2026-11-14):**
  - M-1 (keyboard Reset via the native menu undeclared; only driver is known-bug F01 pressing at page)
    → **fold** as prescribed: `dse.aimedAt` accepts `negotiation.menu.reset`, declare `press:Enter` on
    it, plain `NEGO-R05`.
  - L-1 (7 of 10 e2e markers lack `failsWith`) → **fold**: every marker gets a `failsWith` naming its
    stated reason, so a broken setup step fails it.
  - L-2 (plain jsdom census test at `e2eCensus.test.ts:721` pins SC-641's ended state) → **fold**: the
    plain test must not assert the SC-641 behaviour (use a live fixture or drop that expectation).
  - L-3 (SC-640 markers assert `toHaveLength(2)`) → **fold** as prescribed: assert every drawn chip has
    a non-blank label and no bare "Appeal to "; at most `length >= 1`; never the count.
  - L-4 (no identical-twin write) → **fold**: `NEGO-X08` with a twins fixture (reviewer's
    `zz-twins-fixture.md` / ZNR-01 is a drop-in) + an identical-twin case in matrix `[X]`.
  - L-5 (new ids let the existing SC-602 Live Preview focus carry land on the same seal / chip after a
    save, instead of the card anchor) → **accepted** as the intended effect of adding ids (every rollout
    surface gets it); **fold** one plain Live Preview test `NEGO-L01` (ZNR-03 body) pinning it.
  - I-1 (checkbox Space and label-text click undeclared) → **fold**: declare `press:Space` and the label
    `click` on the modifier checkboxes where real handlers make them functional (minion-pool precedent),
    plain drivers.
  - I-2 (real-Obsidian census can't see change/input listeners; pre-existing) → **drop**: pre-existing
    driver limit, jsdom census covers them and `_census.e2e.ts` says so.
  - I-3 (SC-640 also affects pitfalls) → owner added to SC-640; **fold** one jsdom `test.failing` for
    two same-named pitfalls (same no-count rule as L-3).
  - I-4 (SC-642 also in Live Preview) → owner added to SC-642; **fold** one Live Preview
    `knownBug('SC-642')` test. Also check SC-639 (Reset focus) in Live Preview and report the result
    (reproduces → add an LP knownBug; owner notes it on SC-639).
  - I-5 (Same Argument stays checked while greyed) → **drop**: intended, the "why" line explains it.
  - I-6 nits → **fold**: remove `void root;` (`integrity.e2e.ts:54`); README bug-fixture rows cite their
    ticket like the montage rows. Superproject pointer: this round.
  - Bugs filed (DSE 7.0.0, Bug + DSE Plugin, related SC-439):
    - **SC-648** (Low) — B-1: Enter on the options button opens the menu at the window's top-left.
      Marker: e2e `knownBug('SC-648')` on the Enter path asserting the menu opens near the button
      (a tolerance box around the button's rect, not exact coordinates).
    - **SC-649** (Low) — B-2 + B-3 in one ticket: the power roll counts a motivation / pitfall / Reuse
      the card does not show as chosen. One jsdom `test.failing` per case (removed motivation, removed
      pitfall, hand-typed Reuse), asserting ONLY that the tiers shown agree with the chips / Reuse box
      shown — never a specific fix.
  - **Superproject (this round, after the dse commits):** the superproject branch
    `sc439-e2e-negotiation` in `/home/scott/code/steelCompendium/worktrees/sc439-e2e-negotiation` is at
    `f219c18c`, an ancestor of workspace origin/main (`42a14300` at this ruling; only the dse pointer
    moved in between). Fetch, `git merge --ff-only origin/main`, then ONE commit staging only the
    `draw-steel-elements` gitlink at the final dse head: `chore: bump draw-steel-elements to <sha>
    (SC-439: real-Obsidian e2e and jsdom tests for the negotiation tracker)`. No CHANGELOG bullet
    (test-only; SC-438 precedent). Nothing pushed.
- **r3 (2026-11-14)** — implementer fix round (resume of a3658a2a3305dd8b3); scoped re-review → r2
  reviewer identity a7d459443104db28b (not the author).
- **Baseline move (2026-11-14, dispatcher)** — SC-626 landed (montage focus after a write:
  `src/elements/montage/focusRules.ts`; kit `controlFocus.ts` gains opt-in `data-dse-focus-at` and
  per-family fallbacks; Live Preview carry reads optional `controlFocusRules()`; e2e MONT-F05..F13,
  MONT-F01..F04 markers flipped; 2 new manifest rows). dse develop `11fbded6`, workspace main
  `7399aa94`. New baseline: jest 12167 / 1 skipped with cache (fresh 12166 / 2) · lifecycle 64/64 · e2e
  `437/446 ok, 0 failed, 9 known-bug, coverage: 235/235 pairs` · shots 592, host-leak 163/978, modal
  40/240, clip 147 · freeze 280/280 · parity 0/0/24. **Rebase target is now `11fbded6`** (supersedes
  `a5313f9d`). Expected coverage 235 + 45 + the r3 pairs. **Owner ruling:** the SC-626 kit focus
  fallbacks may change negotiation focus (SC-639, SC-642 markers; NEGO-L01): a marker that now passes is
  reported, not deleted or re-keyed — owner rules. Because both branches touch `src/framework/kit/`,
  the r3 battery on the final head includes shots, freeze and parity (once).
- **r3 result (2026-11-14)** — DONE: dse head `1615843e` on develop `11fbded6` (SC-626 rebase clean; focus
  markers unchanged: F01/L03 SC-639, F02/L02 SC-642 still known-bug; NEGO-L01 still lands on seal 4).
  Superproject `6030e7cd` = ONE gitlink commit on workspace origin/main `b45a5f24`, status clean, nothing
  pushed (owner verified). Pairs 45 → 52 (+R05 menu Enter, +3 Space, +3 label clicks; label ids =
  attribute-only `ArgumentView.ts`). tsc/lint clean; jest 12552 / 1 skipped (cache); lifecycle 64/64; e2e
  ×2 `478/500 ok, 0 failed, 22 known-bug, coverage: 287/287 pairs`; shots 592 0 FAIL, host-leak 163/978,
  modal 40/240, clip 147; freeze 280/280; parity 0/0/24. New markers: R06 SC-648; K10 SC-640 pitfalls;
  K11-K13 SC-649; L02 SC-642 LP; L03 SC-639 LP (reproduces; owner noted it on SC-639).
- **r4 (2026-11-14)** — scoped re-review of the r3 delta by reviewer a7d459443104db28b (not the author).
- **r4 result (2026-11-14)** — reviewer a7d459443104db28b: LAND-READY at `1615843e`; 1 LOW, 1 INFO. All 10
  folds bite under mutation; range-diff "=" on all old commits; shared files 0 deleted lines; superproject
  6030e7cd one gitlink commit on b45a5f24. jest 12552/1; e2e `478/500 ok, 0 failed, 22 known-bug,
  coverage: 287/287 pairs`.
- **Owner rulings on r4 (2026-11-14):**
  - r4-L1 (K11/K12 assert `pressed` length 0 and K13 asserts `reuse.checked === false` before comparing
    tiers — pins one SC-649 fix shape, against the ruling) → **fold** as prescribed: build the reference
    from what the card shows (pressed chip names, `reuse.checked`), assert the tiers match it, drop both
    precondition asserts. Each marker must still fail today and flip under BOTH fix shapes (show the
    hidden state, or drop it from the roll).
  - r4-INFO-1 (W03 / R06 `failsWith` is generic `/Expected: false|true/`) → **fold**: make each pattern
    name its reason (e.g. a custom assertion message) if it is a one-line change; otherwise leave it.
  - Amend the superproject pointer commit to the new dse head so there is still ONE pointer bump on
    current workspace origin/main.
- **r5 (2026-11-14)** — implementer a3658a2a3305dd8b3 folds r4-L1 + INFO-1; scoped re-check by reviewer
  a7d459443104db28b.
- **r5 result (2026-11-14)** — dse head `8a81c5a7` (one commit over 1615843e: K11-K13 reference built from
  what the card shows; W03 / R06 specific failsWith). Superproject `c66f631c` on `b45a5f24` (amended, one
  gitlink commit, clean; owner verified). jest 12552 / 1; e2e once `478/500 ok, 0 failed, 22 known-bug,
  coverage: 287/287 pairs`. Proof: r4-fixes.diff flips K11-K13 (+K10); r4-altB.diff flips K13 only.
- **r6 (2026-11-14)** — scoped re-check of the r5 delta by reviewer a7d459443104db28b.
- **r6 result (2026-11-14)** — reviewer a7d459443104db28b: LAND-READY at `8a81c5a7`, no findings; r4-L1 and
  r4-INFO-1 closed (K11-K13 flip under both fix shapes; W03 / R06 failsWith reject a broken setup).
- **Land-ready (2026-11-14)** — dse `8a81c5a7` on develop `11fbded6`; superproject `c66f631c` = one gitlink
  commit on workspace origin/main `b45a5f24`. Final battery: tsc/lint clean · jest 12552 / 1 skipped
  (cache) · lifecycle 64/64 · e2e `478/500 ok, 0 failed, 22 known-bug, coverage: 287/287 pairs` · shots
  592 0 FAIL, host-leak 163/978, modal 40/240, clip 147 · freeze 280/280 · parity 0/0/24 (lifecycle /
  shots / freeze / parity on 1615843e; the r5 delta is test-only). Bugs filed: SC-637..SC-642, SC-648,
  SC-649. Reported to the dispatcher; the dispatcher lands.
