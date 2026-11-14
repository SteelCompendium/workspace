# SC-438 decisions ledger — e2e rollout (Tier 2): ds-montage and its three modals

Worktree: `/home/scott/code/steelCompendium/worktrees/sc438-e2e-montage` (branch
`sc438-e2e-montage` in every submodule). Cut 2026-11-13 from dse develop `27120710`,
workspace superproject `a7a989ef` (= workspace origin/main at cut). Tracked branch for dse:
`develop`. Owner: Opus 5.5 ticket-owner, session `be71a0a9-199f-4e14-967b-191935312b05`.

## Scott's rulings (verbatim, dated)

- **2026-10-18 (SC-408):** "yes, I want to roll this out across all parts of the plugin,
  including the settings"
- **2026-10-18 (SC-408):** "For any bugs found, please mark them with the DSE 7.0.0 project."
- **2026-10-18 (SC-408, e2e gate):** "make it required to land future changes"

(SC-438 thread: no comments at start, 2026-11-13.)

## Ticket scope (verbatim from the SC-438 description)

> **Scope:** `ds-montage` and its 3 modals, about 55 interactions. Today it has no real-Obsidian
> coverage at all, not even in the lifecycle gate.
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

(Owner note: "not even in the lifecycle gate" is slightly stale — lifecycle G-S13 (SC-326 board
scroll) and G-S53 (`Lifecycle/twin-montage.md`) touch montage, but no scenario drives its
controls. The e2e gap is real.)

## Owner rulings

- **2026-11-13 — Surface boundary.** In scope: every interactive node `ds-montage` renders
  (`src/elements/montage/`: `view.ts`, `BoardView.ts`, `HeadView.ts`, `StripView.ts`,
  `OutcomeBandView.ts`, `GuideView.ts`, and its chrome-panel items) plus its three modals in
  full: `LogActionModal` (`LogActionModal.ts`), `MontageAddHeroModal` and
  `MontageSetLimitsModal` (`ConfigModals.ts`) — every field, button, confirm, cancel, Escape /
  close X / backdrop. NOT in scope: the generic block edit form (`src/authoring/FormModal.ts`,
  SC-556/SC-509 territory) except as a `reach` row if the montage's own chrome opens it and an
  existing manifest already lists it; the sidebar host. Ids prefixed `montage.` (modals:
  `montage.log.*`, `montage.add-hero.*`, `montage.limits.*` — implementer may refine, say why).
- **2026-11-13 — Bug flow** (same as SC-435/436/437). Workers never touch the tracker. A worker
  that finds a product bug commits its coherent work, finishes the survey, and returns
  `STATUS: NEEDS_CONTEXT` ONCE with every bug's title, repro, file:line and severity. The owner
  files the Backlog ticket (DSE 7.0.0, Bug + DSE Plugin, related to SC-438) and resumes the
  worker with the key, which the worker then cites in `knownBug('SC-…')` / `test.failing`. No
  product fixes in this ticket; product source may change ONLY to add `data-dse-control`
  attributes (and census plumbing) — no behavior change.
- **2026-11-13 — Known open tickets touching this surface — cite, don't refile:** SC-384 (Live
  Preview: modal closes when a pending write lands; an existing e2e known-bug), SC-467 (view
  adoption drops the scroll position of scroll containers inside an adopted block), SC-521
  (shots montage-board wheel check flake), SC-562 (no shot covers the pinned hero column —
  visual), SC-380 (shared pip/notch track refactor — not a bug), SC-458 (clicking a
  roving-tabindex control inside a DSE card doesn't move keyboard focus to it), SC-615 / SC-614
  (focus drops to the page — initiative / conditions; a montage analogue is a NEW ticket that
  links them). Fixed and must stay fixed (a regression is a new bug): SC-606 (editing a logged
  action whose hero entry has no skills list), SC-610 (empty or nameless hero entry throws).
- **2026-11-13 — Two phases, mandatory stop between them.** Phase A: ids + both censuses + the
  full manifest + jsdom matrix tests + the bug survey → commit → return `NEEDS_CONTEXT` (even
  with zero bugs) with the pair list and the bug list. The owner reviews the pair list, files
  bugs, and resumes for Phase B: e2e specs driving every pair, the markers, and the full battery.
- **2026-11-13 — Jest gate rule:** jest's default timeout is 30 s since SC-568; an "Exceeded
  timeout" is a real hang until proven otherwise (re-run the suite alone first; do not blame
  load). A full jest run must be green.
- **2026-11-13 — Lifecycle id.** G-S120 is reserved for this ticket if a lifecycle scenario is
  needed (not expected: e2e is the surface for this work).
- **2026-11-13 — Scenario ids.** e2e ids `MONT-*` (e.g. `MONT-B01`, `MONT-L01`). Scenario ids are
  global; check `grep -rn '\[MONT-' e2e/` and any census id you add (`[CENSUS-nn]`) against
  develop AND the parallel branches (SC-614: COND ids + maybe census; SC-569: pool) — pick the
  next free CENSUS number after the highest on develop and say which in the report. Never a
  bracketed ticket id in a test title (SC-577).
- **2026-11-13 — Overlap with parallel owners** SC-614 (ConditionsModal; may add COND e2e
  scenarios) and SC-569 (minion pool modal titles). Both may touch `e2eCensus.test.ts`,
  `_census.e2e.ts`, `e2e/driver/*`. Keep edits to shared files small and additive so a rebase is
  mechanical; whichever lands second rebases and re-counts.

## Battery baseline at 27120710 (dispatcher, 2026-11-13)

jest 11892 passed / 2 skipped (fresh, without the shots cache) · lifecycle 64/64 · e2e
`338/341 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (known bugs SC-257, SC-355,
SC-384) · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze
280/280 · parity 0/0/24.

Expected after this ticket: jest and e2e counts rise; coverage Y/Y with Y > 176; lifecycle
64/64; shots/freeze/parity unchanged (attribute-only changes must not move print bytes — report
any move in host-leak or DOM numbers).

Lifecycle: SEVEN `--only` parts — 1 `G-S7a … G-S9a` (21); 2 `G-S9b … G-S40` (16);
3 `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9); 4 `G-S57,G-S62,G-S61,G-S56` (4);
5 `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7); 6 `G-S92,G-S96,G-S97,G-S99` (4);
7 `G-S108,G-S112,G-S115` (3, ~200 s). G-S56 stays LAST in SCENARIOS order. A G-S91 FAIL is real
unless it says the host was too slow after two re-runs. SC-622: restore
`demo-vault/.obsidian/appearance.json` if dirty before blaming a change for a G-S97 FAIL.

## Land-ready rule (dispatcher, 2026-11-13)

Before reporting land-ready: the superproject branch sits on current workspace origin/main with
ONE pointer bump and no interim pointer commits.

## Rounds

(appended as they run)
- **r1 phase A (2026-11-13)** — implementer (orchestration:implementer, id af9a6041852141fce) on
  `sc438-brief-r1-implementer.md`; report → `sc438-r1-implementer-report.md`. Ticket → Awaiting
  (verified). Phase B = resume of the same identity. Review (r2) goes to a fresh
  orchestration:reviewer.
- **r1 phase A result (2026-11-13)** — NEEDS_CONTEXT at `6510f6ab` (b62f4b0e ids+manifests+fixtures+
  censuses, be0ce49a README fixture rows, 6510f6ab jsdom matrix), on develop `27120710`. 34 new ids
  (19 surface, 15 modals), 54 new pairs → expected coverage 230/230. Census ids `[CENSUS-10..12]`.
  tsc/lint rc 0; jest 12090 passed / 2 skipped / 0 failed rc 0 (+198); census 48/48. 7 bug candidates.
- **Owner rulings on phase A (2026-11-13):**
  - Id naming deviation (`montage.bar.*`, `montage.chrome.*` so modal prefixes stay unambiguous) →
    approved.
  - Pair list (54) → accepted for phase B; the r2 reviewer probes completeness independently.
  - Bugs filed (DSE 7.0.0, related SC-438). Markers required (e2e `knownBug` where it shows in real
    Obsidian, else jsdom `test.failing`):
    - **SC-625** (Bug, Medium) — any write deletes unknown YAML keys, top-level AND inside `entries:`
      items (candidates 1+2, one ticket). Marker per place (top-level, entry).
    - **SC-626** (Bug, Medium) — keyboard focus drops to the page after every write / strip toggle /
      writing modal close (candidate 3). Phase B checks it in REAL Obsidian first: reproduces →
      e2e `knownBug('SC-626')` on a real focus assertion (+ the jsdom `test.failing`); does NOT
      reproduce → plain e2e test asserting focus is kept, and report it (owner cancels SC-626).
    - **SC-627** (Bug, Low) — Add a hero accepts a duplicate name → two mirrored rows (candidate 4).
      Marker asserts only that the second "Kira" is refused (no second `- name: Kira` written);
      casing variants NOT asserted.
    - **SC-628** (Bug, Low) — wrong-type hand-typed values: `title: 2024` error card; `rounds: "3"`
      → `"31"` (candidates 5+6, one ticket). Marker per case.
    - **SC-629** (Bug, Low) — rounds out with nothing logged: "Not started" vs "Total Failure" rule
      line (candidate 7). Marker asserts ONLY that the verdict word and the rule line agree (either
      both a failure, or neither claims a result) — never a specific wording.
  - Follow-ups:
    - Reset progress / Clear all with no confirm or undo → filed **SC-630** (Feature, decision). No
      marker; drive today's behaviour as a plain test, do not assert it as correct beyond the write.
    - Case-sensitive skill-reuse warning → filed **SC-631** (Bug, Low). jsdom `test.failing` marker.
    - Enter in Add a hero name / limit fields does nothing → filed **SC-632** (Feature, Low). No pair,
      no marker.
    - Set limits Save with nothing changed writes identical bytes → drop as a ticket: real Obsidian
      skips identical bytes (SC-437 candidate 6). Phase B asserts it with `expectNoWrite` in real
      Obsidian; if the file IS rewritten there, report it before the full battery.
    - A cleared limit field saves as 0 (= no limit) → drop: 0 is the model's "no limit" value; keep
      the jsdom pin as today's behaviour.
- **r1 phase B (2026-11-13)** — implementer resumed (same id af9a6041852141fce).
- **Lifecycle note (2026-11-13, dispatcher relaying the SC-621 owner, verbatim):** "filed SC-633
  (Backlog, related SC-621/SC-607) for the G-S115 (g) signal. Suspected harness timing, not a
  product fault: the cell waits a fixed 700 ms after opening the hover before the outside write, and
  on a loaded host the preview may still be reading the note, which gives SC-607's already-accepted
  F3 refusal (writes nothing). Running owners: a G-S115 (g) red that shows the "changed on disk
  first" Notice on a loaded host is a suspected flake; re-run part 7 once. A red on the re-run, on a
  quiet host, or in any other G-S115 cell (a)-(f), (h), (i) is a real signal."
- **r1 phase B result (2026-11-13)** — DONE at `0bbc1948` (0f3675fa specs+fixture+driver, 6fba9b36
  wrong-value fixtures+markers+disclosure reset, 0bbc1948 row button by id), on develop `27120710`
  (no rebase). tsc/lint rc 0; jest 12098 / 2 skipped / 0 failed; e2e ×2 `406/418 ok, 0 failed, 12
  known-bug, coverage: 230/230 pairs`; lifecycle 64/64 (part 7 once, loadavg 7.9); shots 592 0 FAIL,
  host-leak 163/978, modal host-leak 40/240, clip 147; freeze 280/280; parity 0/0/24. 74 MONT e2e
  tests + CENSUS-10..12. SC-626 REPRODUCES in real Obsidian (`[MONT-F01..F03]` knownBug + jsdom
  `[K03]`). Set limits unchanged Save writes nothing in Obsidian (`[MONT-S07]` plain). Markers:
  SC-625 `[MONT-X09]`,`[MONT-X10]`,`[K01]`,`[K02]`; SC-627 `[MONT-H07]`; SC-628 `[MONT-W01]`,`[MONT-W02]`;
  SC-629 `[MONT-W03]`; SC-631 `[K04]`. No new bugs.
- **r2 (2026-11-13)** — independent review (orchestration:reviewer, fresh identity) on
  `sc438-brief-r2-reviewer.md` → `sc438-r2-review-report.md`.
- **Baseline move (2026-11-13, dispatcher)** — SC-614 landed (initiative `view.ts` +
  `kit/conditionIcons.ts` focus after removing a condition; jest F23-F29; e2e INIT-F15/F16). dse
  develop `506786cb`, workspace main `1e1dea98`. New baseline: jest 11900 passed / 1 skipped WITH
  the shots cache (fresh figure: measure your own) · lifecycle 64/64 · e2e `340/343 ok, 0 failed, 3
  known-bug, coverage: 176/176 pairs` · shots 592, host-leak 163/978, modal host-leak 40/240, clip
  147 · freeze 280/280 · parity 0/0/24. **Rebase onto `506786cb` (and the superproject branch onto
  current workspace main, ONE pointer bump) before land-ready.** Owner plan: r2 review continues on
  `0bbc1948`; the r3 fix round does the rebase. Expected after rebase: e2e `408/420 ok, 0 failed, 12
  known-bug, coverage: 230/230 pairs` (+ any r3 changes).
- **r2 result (2026-11-13)** — reviewer (orchestration:reviewer, id a3a5d48e1ab5c1389): NOT LAND-READY
  at `0bbc1948`: 0 C/H, 1 MEDIUM, 5 LOW, 5 INFO, 0 new product bugs. Gates green (jest 12099/1 with
  cache; e2e ×2 `406/418 ok, 0 failed, 12 known-bug, coverage: 230/230 pairs`; lifecycle 64/64). Pairs
  recounted 230. Census mutations red; 12 handler mutations red except L03; all 13 markers flip under
  simulated fixes.
- **Owner rulings on r2 (2026-11-13):**
  - M-1 (Enter on End round / Log an action driven but undeclared) → **fold** as prescribed:
    `press:Enter` pairs on `montage.bar.end-round` and `montage.bar.log`, one plain test each, F01/F03
    press on those buttons (coverage → 232/232 before any other fold).
  - L-1 (MONT-L03 vacuous: Success is the default) → **fold** (start from a non-default chip, or pick
    a chip that changes the state).
  - L-2 (L10 / H06 / S06 only assert the modal closed) → **fold**: assert the note file and the board.
  - L-3 (SC-629 marker regex `/failure/i` matches "failures") → **fold**: a neutral fix must flip it;
    the marker still asserts ONLY that verdict word and rule line agree (ledger ruling).
  - L-4 (`[MONT-B10${kind[0]}]` ids invisible to the runner) → **fold**: literal ids in the titles.
  - L-5 (no real-Obsidian drive of the board's Tab-into-view handler, `BoardView.ts:180`) → **fold**
    if the handler is reachable by a real Tab press; a pair if it is a real interaction.
  - INFO-1 (SC-626 reproduces in Live Preview too) → **fold**: one Live Preview `knownBug('SC-626')`
    test; owner adds the fact to SC-626.
  - INFO-4 (`montage.guide` lacks `press:Enter`; uneven Escape pairs) → **fold** where a real handler
    exists (same as `montage.strip`); otherwise drop.
  - INFO-5 (MONT-B11 doesn't assert the failure tally) → **fold**.
  - INFO-2, INFO-3 → no action (existing pattern; covered elsewhere).
  - **Rebase onto dse develop `506786cb`** in the same round, and the superproject branch onto
    current workspace origin/main with ONE pointer-bump commit (dispatcher land-ready rule).
- **r3 (2026-11-13)** — implementer fix round (resume of af9a6041852141fce); scoped re-review → r2
  reviewer identity a3a5d48e1ab5c1389 (not the author).
- **r3 result (2026-11-13)** — DONE: dse rebased onto `506786cb` (old `0bbc1948` → `87e6be42`), r3
  commits `bc1091b3` (r2 findings) + `d5acaabb` (B13/B14), head `d5acaabb`; `src/` unchanged since
  phase A. Superproject `66b35823` on parent origin/main `075b61e3`, ONE gitlink line, status clean,
  nothing pushed. 233 pairs (+2 M-1, +1 guide Enter). tsc/lint rc 0; jest 12107 / 1 skipped (cache
  present); lifecycle 64/64; e2e ×2 `413/426 ok, 0 failed, 13 known-bug, coverage: 233/233 pairs`;
  shots 592 0 FAIL, host-leak 163/978, modal 40/240, clip 147; freeze 280/280; parity 0/0/24.
- **r4 (2026-11-13)** — scoped re-review of the r3 delta by reviewer a3a5d48e1ab5c1389.
- **r4 result (2026-11-13)** — reviewer a3a5d48e1ab5c1389: LAND-READY at `d5acaabb`; 0 C/H/M, 1 LOW,
  1 INFO. All r2 folds bite (4 mutants); range-diff "=" on all 6 rebased commits; superproject
  66b35823 one gitlink line on 075b61e3; e2e `413/426 ok, 0 failed, 13 known-bug, coverage: 233/233`.
- **Owner rulings on r4 (2026-11-13):**
  - r4-L1 (MONT-B13 Tabs onto a wholly hidden cell, Chromium scrolls it itself; the handler's
    right-edge branch `BoardView.ts:194-195` has no real-Obsidian driver) → **fold**: replace B13's
    body with the reviewer's ready probe ZB13-01 (`scratchpad/sc438-rev-r2/r4-zb13.e2e.ts`: 12 px of
    the round-10 cell showing at the right edge, a real Tab from round 5; green at head, red with the
    handler disabled), keep the id `[MONT-B13]`, and fix the comment at `board.e2e.ts:173` to name
    which test guards which branch.
  - r4-INFO-1 (`e2e/driver/montage.ts:16` says rounds "10 and 11"; fixture logs 4, 5, 10) → **fold**.
  - Amend the superproject pointer commit to the new dse head so there is still ONE pointer bump.
- **r5 (2026-11-13)** — implementer af9a6041852141fce folds r4-L1 + INFO-1; scoped re-check by
  reviewer a3a5d48e1ab5c1389.
- **Baseline move (2026-11-13, dispatcher)** — SC-569 landed (`MinionStaminaPoolModal.ts` title
  helper, jest +18, e2e POOL-E06/E07, fixture `Initiative/two-squads.md`). dse develop `6785fa06`,
  workspace main `85eb44de`. New baseline: jest 11918 / 1 skipped with cache (fresh 11917 / 2) ·
  lifecycle 64/64 · e2e `342/345 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` · shots 592,
  host-leak 163/978, modal 40/240, clip 147 · freeze 280/280 · parity 0/0/24. Folded into r5: rebase
  onto `6785fa06`, superproject onto current origin/main, ONE pointer bump. Expected after:
  e2e `415/428 ok, 0 failed, 13 known-bug, coverage: 233/233 pairs`. SC-569 touched src, so the r5
  battery on the rebased head is tsc, lint, jest, lifecycle (seven parts), full e2e (lifecycle and
  e2e are required to land); shots/freeze/parity not re-run (both branches are byte-neutral to
  styles.css and print; montage src attribute-only).
- **r5 result (2026-11-14)** — DONE: dse `f6e504c7` on develop `6785fa06` (9 commits, `src/` = attribute
  ids only); superproject `8c0b63a5` on origin/main `f219c18c`, one gitlink line, clean (owner
  verified). B13 = reviewer's ZB13-01; handler-disabled mutant red on B13 and B14. tsc/lint rc 0; jest
  12125 / 1 skipped (cache); lifecycle 64/64; e2e `415/428 ok, 0 failed, 13 known-bug, coverage:
  233/233 pairs`.
- **r6 (2026-11-14)** — scoped re-check of the r5 delta by reviewer a3a5d48e1ab5c1389.
- **r6 result (2026-11-14)** — reviewer a3a5d48e1ab5c1389: LAND-READY at `f6e504c7`, 0 findings. B13 =
  ZB13-01 line for line; range-diff "=" on all rebased commits; superproject 8c0b63a5 one gitlink line
  on f219c18c; `--only=MONT-B13,MONT-B14` 2/2 ok.
- **LAND-READY (2026-11-14)** — dse `sc438-e2e-montage` @ `f6e504c7` on develop `6785fa06`; superproject
  `sc438-e2e-montage` @ `8c0b63a5` on origin/main `f219c18c` (ONE pointer bump). Gates: tsc/lint clean ·
  jest 12125 / 1 skipped (cache) · lifecycle 64/64 · e2e `415/428 ok, 0 failed, 13 known-bug, coverage:
  233/233 pairs` · shots 592 / host-leak 163/978 / modal 40/240 / clip 147 · freeze 280/280 · parity
  0/0/24 (shots/freeze/parity on pre-rebase heads; src attribute-only). No CHANGELOG bullet (tests
  only, no user-facing change). Skill proposal: `sc438-skill-proposal.md`. Filed: SC-625, SC-626,
  SC-627, SC-628, SC-629, SC-631 (bugs, markers in tests), SC-630, SC-632 (features, no marker).
