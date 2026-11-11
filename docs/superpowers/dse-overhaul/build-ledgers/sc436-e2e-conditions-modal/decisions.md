# SC-436 decisions ledger — e2e rollout (Tier 1): conditions modal

Worktree: `/home/scott/code/steelCompendium/worktrees/sc436-e2e-conditions-modal` (branch
`sc436-e2e-conditions-modal` in every submodule). Cut 2026-11-10 from dse develop `2ee2e405`,
workspace main `fc48a0a1`. Tracked branch for dse: `develop`.
Owner: Opus 5.5 ticket-owner, session `be71a0a9-199f-4e14-967b-191935312b05`.

## Scott's rulings (verbatim, dated)

- **2026-10-18 (SC-408):** "yes, I want to roll this out across all parts of the plugin,
  including the settings"
- **2026-10-18 (SC-408):** "For any bugs found, please mark them with the DSE 7.0.0 project."
- **2026-10-18 (SC-408, e2e gate):** "make it required to land future changes"
- **2026-11-10 (via dispatcher):** Scott activated the DSE 7.0.0 Backlog for work.

## Ticket scope (verbatim from the SC-436 description)

> **Scope:** the ConditionsModal, opened from the initiative tracker for heroes and creatures.
> It has about 40 interactions: condition toggles, end-of-turn / save-ends choices, custom
> conditions, removal, and close paths. It applies live, so every click writes the note.
> Include note-integrity probes: content around the block survives, and a second block in the
> same note is untouched.
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

- **2026-11-10 — Existing pilot manifest.** `e2e/manifest/conditions-modal.ts` already exists
  (SC-431/468/474 pilot, deliberately narrow: `cond.add`, `cond.input`, `cond.edit`,
  `cond.duration`, `cond.swatch`, `cond.effect`, `cond.icon-search`, reach row
  `init.cond.add`). EXTEND it to the whole modal; keep the existing ids and the existing specs
  (`e2e/specs/initiative/conditions-*.e2e.ts`) green. Rename an existing id only if it is
  genuinely wrong, and then say why in the report.
- **2026-11-10 — Hosts.** In scope: the modal opened from the initiative tracker, on a hero
  row AND a creature row (both reach paths driven). The ConditionsPanel host
  (`src/elements/conditions/panel.ts`, hero sheet / ds-conditions) opens the same modal but is
  not this ticket's host: no reach rows for it here; list it in the report's reuse section.
- **2026-11-10 — Bug flow** (same as SC-435). Workers never touch the tracker. A worker that
  finds a product bug commits its coherent work, finishes the survey, and returns
  `STATUS: NEEDS_CONTEXT` ONCE with every bug's title, repro, file:line and severity. The owner
  files the Backlog ticket (DSE 7.0.0, Bug + DSE Plugin, related to SC-436) and resumes the
  worker with the key, which the worker then cites in `knownBug('SC-…')` / `test.failing`. No
  product fixes in this ticket; product source may change ONLY to add `data-dse-control`
  attributes (and census plumbing) — no behavior change.
- **2026-11-10 — Known open tickets touching this surface — cite, don't refile:** SC-257
  (non-Latin custom-condition names slug to empty — silent no-op), SC-355 (DSE dialogs expose
  role "generic"), SC-384 (Live Preview: modal closes when a pending write lands), SC-555
  (docs-shots GIF expects a "Done" button). If one reproduces, mark it with that key; tell the
  owner which.
- **2026-11-10 — Overlap with SC-437 (initiative tracker)** follows this ticket on the same
  suite. Keep new shared helpers small and generic; the report lists what SC-437 should reuse.
  Don't pre-build the tracker's surface (only the reach rows this modal needs).
- **2026-11-10 — Jest gate rule (carried from SC-435):** a full jest run must be green, or show
  only the two SC-568 timeouts (`twin-reuse`, `initiative-default-keys`) AND both suites green
  alone.
- **2026-11-10 — Lifecycle id.** G-S71 is reserved for this ticket if a lifecycle scenario is
  needed (not expected: e2e is the surface for this work).

## Battery baseline at 2ee2e405 (dispatcher, 2026-11-10)

jest 6584 passed / 1 skipped (a full run under load may also show the 2 SC-568 timeouts) ·
lifecycle 52/52 · e2e `163/164 ok, 0 failed, 1 known-bug (SC-572), coverage: 113/113 pairs` ·
shots 592, 0 FAIL, host-leak 163/978, capture clip OK (147 …) · freeze 280/280 · parity 0/0/24.

Expected after this ticket: jest and e2e counts rise; coverage Y/Y with Y > 113; lifecycle
52/52; shots/freeze/parity unchanged (attribute-only changes must not move print bytes —
report any move in host-leak or DOM numbers).

## Rounds

(appended as they run)
- **r1 (2026-11-10)** — implementer (orchestration:implementer, id a41e900809ec15c87) on
  `sc436-brief-r1-implementer.md`; report → `sc436-r1-implementer-report.md`. Ticket → Awaiting.
  Review (r2) goes to a fresh orchestration:reviewer identity.
- **Baseline move (2026-11-10, dispatcher)** — SC-558 landed: dse develop `10db67e3`, workspace
  main `184ddedb` (CSS + tests + docs; sanctioned 78-line print rebaseline applied to the shared
  freeze baseline; no e2e changes). New baseline: jest 6591 passed / 1 skipped / 258 of 259
  (SC-568 load timeouts possible, green alone) · lifecycle 52/52 · e2e `163/164 ok, 0 failed,
  1 known-bug (SC-572), coverage: 113/113 pairs` · shots 592, host-leak 163/978, capture clip
  OK (147) · freeze 280/280 (updated baseline) · parity 0/0/24. Branch must rebase onto
  10db67e3 before land-ready; r1 implementer told by SendMessage to rebase before
  shots/freeze/parity.
- **r1 result (2026-11-10)** — NEEDS_CONTEXT at `cdd15469` (rebased on `10db67e3`). e2e
  `212/216 ok, 0 failed, 4 known-bug (SC-257, SC-384, SC-355, SC-572), coverage: 132/132 pairs`;
  jest 6866 / 1 skip / 0 failed; lifecycle 52/52; shots 592 / 0 FAIL / host-leak 163/978 /
  clip 147; freeze 280/280; parity 0/0/24. +5 control ids (attributes only), +19 pairs,
  fixtures `Initiative/conditions.md` + `two-trackers.md`, 52 e2e tests, 271 jsdom matrix
  tests. SC-555 did not reproduce (the window has a Done button).
- **Owner rulings on r1 findings (2026-11-10):**
  - Bug "typing does not open the Add search (docs l.430 say it does)" → filed **SC-580**.
    Marker encodes the documented behaviour (e2e `knownBug` or jsdom `test.failing`, worker's
    choice — prefer jsdom if it reproduces there).
  - Bug "colour cannot be cleared" → filed **SC-581**. `test.failing` must be fix-agnostic: it
    passes if ANY single interaction in the colour group (a default/none option, or
    re-activating the selected swatch) removes the `color` key from the written condition.
  - Follow-up "swatch aria-label is the hex" → promoted to bug **SC-582** (a11y; Scott is
    colourblind, colour names matter). `test.failing`: each preset swatch's `aria-label`
    contains the colour name its `title` shows.
  - Follow-up "hand-written `key: Dazed` is custom; picking Dazed duplicates" → promoted to
    bug **SC-583**. `test.failing`: with `key: Dazed` present, picking Dazed leaves exactly one
    dazed condition (case-insensitive) in the written note.
  - Follow-up docs drift `docs/initiative-tracker.md:441` (outline → check mark, SC-361) →
    **fold** (one-line doc fix, docs only).
  - Follow-up 24-icon picker cap not jsdom-covered (mock has 6 icons) → **fold** (a jsdom test
    with a >24-icon mock).
  - Follow-up double-click on Add Condition opens then closes the window → **drop**: generic
    Obsidian modal backdrop behaviour shared by every DSE modal, not this surface.
- **r1b (2026-11-10)** — implementer resumed (same id) to add the four markers + the two folds,
  then tsc, lint, jest, full e2e.
- **r1b result (2026-11-10)** — DONE at `c7489d2b` (base `10db67e3`). Four jsdom `test.failing`
  markers (SC-580/581/582/583) in `test/dom/views/conditions-modal-matrix.test.ts`, each proven
  red as a plain test; 24-icon cap tests (30-icon mock); docs l.441 fixed. jest 6874 / 1 skip /
  0 failed; e2e `212/216 ok, 0 failed, 4 known-bug, coverage: 132/132 pairs`. Lifecycle/shots/
  freeze/parity from r1 on the same base (52/52, 592/0 FAIL, 280/280, 0/0/24).
- **r2 (2026-11-10)** — independent review (orchestration:reviewer, fresh identity, id a446e2e66c02f26f2) on
  `sc436-brief-r2-reviewer.md` → `sc436-r2-review-report.md`. Head under review `c7489d2b`.
- **Baseline move (2026-11-10, dispatcher)** — SC-556 landed: dse develop `f69b8fd6`, workspace
  main `2bbebdf5` (block edit forms' Save pin-only when the own block changed/deleted outside;
  lifecycle G-S64 extended; styles.css byte-identical; no e2e changes). New baseline: jest 6634
  passed / 2 skipped / 258 of 259 on a fresh worktree (clean 10db67e3 same way: 6588 / 4; SC-568
  load timeouts possible, green alone) · lifecycle 52/52 · e2e `163/164 ok, 0 failed, 1
  known-bug (SC-572), coverage: 113/113 pairs` · shots 592, host-leak 163/978, clip 147 · freeze
  280/280 · parity 0/0/24. Owner ruling: r2 review continues on `c7489d2b`/`10db67e3` (told by
  SendMessage); the r3 fix round rebases onto `f69b8fd6` and re-runs the full battery
  (lifecycle all five parts — G-S64 changed; e2e; jest; shots/freeze/parity) before land-ready.
- **r2 result (2026-11-10)** — reviewer FIX-REQUIRED at `c7489d2b`: 0 C/H, 1 MED, 3 LOW, 6 INFO,
  1 LOW product bug + 2 INFO product nits. Gates: jest 6874/1 skip/0 failed; lifecycle 52/52; e2e
  3 runs: 2× `212/216 ok, 0 failed, 4 known-bug, coverage: 132/132`, 1× RECOV-R07 (SC-517 load
  flake). Cherry-pick onto f69b8fd6 clean, no SC-556 interaction (e2e same numbers on it).
- **Owner rulings on r2 (2026-11-10):**
  - MEDIUM-1 (SC-580 jsdom marker can't see a Scope-keymap fix) → **fold**: move SC-580 to an e2e
    `knownBug('SC-580')` using the reviewer's PROBE-02 shape; delete the jsdom `test.failing`.
  - LOW-1 (2 plain matrix rows pin re-clicking the selected swatch; SC-581 toggle fix breaks
    them) → **fold** as prescribed (filter selected swatch out of the plain table; own row titled
    `[current behaviour — SC-581 may change this]`).
  - LOW-2 (~40 tests find swatches by the hex aria-label SC-582 will rename) → **fold**: identify
    swatches by hex via `title` or `--dse-swatch` style in matrix `pick`/`pressedIn` and an e2e
    helper; only the SC-582 marker (and at most one row asserting label text) depends on the label.
  - LOW-3 (`cond.color-custom` write path not driven in e2e) → **fold**: add one plain e2e test,
    NOT credited as a manifest drive, that sets the value page-side and dispatches `input` +
    `change`, asserting one write, the note, the screen and focus; title says the native chooser
    is out of CDP's reach. Keep D11.
  - INFO-1 → fold (retitle X08). INFO-2 → fold (manifest citations to the real D-numbers).
    INFO-3 → drop (SC-517). INFO-4 → noted (rebase in r3). INFO-5 → fold into the report's
    "Reuse for SC-437" (no code change).
  - INFO-6 (Escape in icon search closes the whole window; in Add search only the dropdown) →
    filed **SC-587** (decision for Scott, Backlog, not blocking). COND-X07 keeps pinning today's
    behaviour, retitled `… [current behaviour — SC-587 may change this]`.
  - Product bug 1 (keyboard removal of the last condition with the Add search open drops focus
    to `<body>`) → filed **SC-585**. Marker (`test.failing` jsdom; reviewer's jprobe P1 reproduces):
    after the removal `document.activeElement` is inside the modal and not `<body>`.
  - Product nits 2 + 3 (named colour opens chooser at white; `icon: ""` presses no choice) →
    filed together as **SC-586**, two `test.failing` markers, one per item, fix-agnostic.
- **r3 (2026-11-10)** — implementer fix round (resume of r1 identity a41e900809ec15c87):
  rebase onto `f69b8fd6`, folds + markers above, full battery. Scoped re-review → r2 reviewer
  identity a446e2e66c02f26f2 (not the author).
- **r3 result (2026-11-10)** — DONE at `253ffa3d` on `f69b8fd6` (clean rebase). All r2 folds +
  markers: SC-580 → e2e `knownBug` COND-N07 (page-level key press, no manifest drive); LOW-1/2/3
  folded (new `[COND-D17]` colour write; `pressedSwatches()` by title hex); X07/X08 retitled;
  SC-585 + SC-586a/b jsdom `test.failing`, each proven red plain. Gates: tsc/lint 0; jest 6920 /
  1 skip / 0 failed (at `48290138`; last commit e2e-only); lifecycle 52/52; e2e `213/218 ok, 0
  failed, 5 known-bug (SC-257, SC-384, SC-580, SC-355, SC-572), coverage: 132/132 pairs`; shots
  592 / 0 FAIL / host-leak 163/978 / clip 147; freeze 280/280; parity 0/0/24.
- **r4 (2026-11-10)** — scoped re-review of `c7489d2b..253ffa3d` (range-diff over the rebase) by
  the r2 reviewer identity a446e2e66c02f26f2.
- **r4 result (2026-11-10)** — scoped re-review LAND-READY at `253ffa3d`: 0 C/H/M, 1 LOW, 2 INFO.
  All r2 findings verified fixed by probe (SC-580 knownBug flips under Scope AND DOM fixes; SC-581/
  582 fixes now break only their markers + the `[current behaviour]` rows; D17 red without the
  change listener). e2e `213/218 ok, 0 failed, 5 known-bug, coverage: 132/132 pairs` first run.
- **Owner rulings on r4 (2026-11-10):**
  - LOW-r4-1 (SC-586a marker can't flip under a canvas-based colour-name fix; jsdom has no canvas)
    → **fold**: in that one jsdom test, stub `HTMLCanvasElement.prototype.getContext` (restored
    after) with a minimal 2D context that resolves `teal` → `#008080` via `fillStyle`, so both a
    lookup-table fix and a canvas fix flip the marker. Keep it a jsdom `test.failing`.
  - INFO-r4-1 (stale comments `e2e/manifest/conditions-modal.ts:25,30-31`) → **fold**.
  - INFO-r4-2 (SC-582 fixer must update pilot COND-E02/E03 + 4 older jsdom tests) → added to
    SC-582's agent notes; no code change.
- **r5 (2026-11-10)** — implementer (a41e900809ec15c87) folds LOW-r4-1 + INFO-r4-1; tsc, lint, full
  jest, full e2e. Delta check → reviewer a446e2e66c02f26f2 (probe the stub with its canvas fix).
- **Baseline move (2026-11-10, dispatcher)** — SC-437 landed first: dse develop `32441332`,
  workspace main `8a67dccf`. Overlaps this branch (tracker `data-dse-control` ids incl. condition
  icons, initiative manifests, both censuses scoped by tracker root, `dse.blur` away target,
  markers SC-575/576/577/578/588/589). New baseline: jest 6765 / 1 skip / 259 of 260 · lifecycle
  52/52 · e2e `199/206 ok, 0 failed, 7 known-bug, coverage: 142/142 pairs` · shots 592, host-leak
  163/978, clip 147 · freeze 280/280 · parity 0/0/24. Owner ruling: r5 implementer rebases onto
  `32441332` after the folds; on a duplicate id/reach row SC-437's wins; re-run tsc, lint, full
  jest + census suites, full e2e (re-count); shots/freeze/parity only if `src/` conflicted.
  Delta re-review (reviewer a446e2e66c02f26f2) then covers the stub AND the rebase resolution.
- **r5 result (2026-11-10)** — DONE at `97a9c93b` on `32441332`. LOW-r4-1 folded (canvas stub;
  marker flips under a scratch canvas fix), INFO-r4-1 folded. Rebase conflicts: README fixture
  rows (kept all four); `[CENSUS-07]` id collided with SC-437's → renamed ours `[CENSUS-09]`;
  `init.cond.add` defined once (ours; SC-437 defers to it and adds `init.cond.remove`); src
  auto-merged. Gates: tsc/lint 0; census + matrix 307/307; jest 7050 / 1 skip / 0 failed; e2e
  `249/260 ok, 0 failed, 11 known-bug, coverage: 161/161 pairs` (one earlier run hit RECOV-R07
  SC-517 at load 27-29).
- **r6 (2026-11-10)** — delta check of the r5 commits + rebase resolution by reviewer
  a446e2e66c02f26f2.
- **r6 result (2026-11-10)** — reviewer LAND-READY at `97a9c93b` on `32441332`: 0 findings.
  Canvas stub flips under canvas AND table fixes, restored in `finally`; range-diff clean except
  README context; 142 + 19 = 161 pairs, no double count; both censuses non-vacuous. e2e
  `249/260 ok, 0 failed, 11 known-bug, coverage: 161/161 pairs` first run.
- **LAND-READY (2026-11-10)** — dse `sc436-e2e-conditions-modal` @ `97a9c93b` on develop
  `32441332` (11 commits; src diff = `src/views/ConditionsModal.ts` +5/-1, attributes only).
  Skill proposal: `sc436-skill-proposal.md`. Filed from this ticket: SC-580, SC-581, SC-582,
  SC-583, SC-585, SC-586 (bugs, markers in tests), SC-587 (decision for Scott, not blocking).
