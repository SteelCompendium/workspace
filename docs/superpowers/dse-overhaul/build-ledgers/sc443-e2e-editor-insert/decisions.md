# SC-443 decisions ledger — e2e rollout (Tier 3): editor insert paths

Worktree: `/home/scott/code/steelCompendium/worktrees/sc443-e2e-editor-insert` (branch
`sc443-e2e-editor-insert` in every submodule). Cut 2026-11-15 from dse develop `129beb18`,
workspace superproject `3a517cdf` (= workspace origin/main at cut). Tracked branch for dse:
`develop`. Owner: Opus 5.5 ticket-owner, session `be71a0a9-199f-4e14-967b-191935312b05`.

## Scott's rulings (verbatim, dated)

- **2026-10-18 (SC-408):** "yes, I want to roll this out across all parts of the plugin,
  including the settings"
- **2026-10-18 (SC-408):** "For any bugs found, please mark them with the DSE 7.0.0 project."
- **2026-10-18 (SC-408, e2e gate):** "make it required to land future changes"

(SC-443 thread: no comments at start, 2026-11-15.)

## Ticket scope (verbatim from the SC-443 description)

> **Scope:** the authoring paths that write through the editor:
>
> * the insert commands;
> * the `/ds` suggest;
> * schema autocomplete inside a block;
> * compendium search + insert, including reference vs snapshot routing.
>
> Each needs at least one real-editor round trip in both Live Preview and Source mode: trigger it,
> accept it, then assert the exact text inserted at the cursor and that the rest of the note is
> unchanged.
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

- **2026-11-15 — Surface boundary.** In scope, all under `src/authoring/` plus their registration in
  `main.ts`:
  - the `insert-<id>` commands (`insert.ts` `registerInsertCommands` / `insertScaffold`, scaffolds
    from `scaffold.ts`), for every element the palette advertises with `experimental` OFF;
  - the `/ds` EditorSuggest (`suggest.ts` `DsElementSuggest`), including its suppression inside
    any fence (`fenceScan.ts`);
  - the in-fence key/enum EditorSuggest (`schemaSuggest.ts` `DsSchemaSuggest`, `schemaShape.ts`);
  - the two compendium insert commands `insert-compendium-reference` and `insert-compendium-block`
    (`compendiumInsert.ts`), the search window (`CompendiumSearchModal.ts`: query, `type:` /
    `source:` filters, result rows, keyboard and mouse pick, any modifier-key routing between
    reference and snapshot, the empty / no-compendium state and its Sync affordance up to the
    point a sync would start), and what each choice writes at the cursor.
  Not in scope: the generic block edit form (`FormModal.ts` / `formModel.ts`; deferred from 7.0.0
  as SC-404, behind the experimental gate), the sidebar, the sync and migration windows (SC-441's
  surface), and rendering of the inserted block beyond "it renders as a DSE element, not an error
  card". Obsidian's own suggestion-container chrome is not ours; the content our
  `renderSuggestion` draws is.
- **2026-11-15 — Round trip, both modes.** Every one of the four paths gets at least one
  real-editor round trip in BOTH Live Preview and Source mode: trigger, accept, then assert (a) the
  exact text inserted, (b) where it was inserted (the cursor line / column, or the replaced
  `/ds…` token only), (c) the cursor position after insert where the code sets one, and (d) every
  other byte of the note unchanged (compare the whole file before and after, minus the inserted
  span). Screen assertion: the inserted block renders as a DSE element (not an error card) once
  the cursor leaves it in Live Preview / on switching to Reading view.
- **2026-11-15 — Experimental gate.** Shipped specs run with `experimental` OFF: assert that
  hidden / deferred definitions (`isDefinitionHidden`: `ds-hero` per SC-190, and every deferred
  def per SC-406) have NO insert command in the palette and are NOT offered by `/ds`. One separate
  scenario (or a small set) runs with the gate ON and drives at least one deferred element's insert
  and `/ds` pick. Use the SC-440 mechanism (`dse.setPrefs({}, { experimental: true })` in before,
  `dse.setPrefs({})` in after) if it reaches command registration; if the commands are registered
  once at load and the gate needs a plugin reload, say how you did it.
- **2026-11-15 — No network, a fixture compendium.** No e2e test may reach the network. The
  compendium search and inserts run against a SMALL fixture compendium in the e2e vault: prefer an
  existing jest/visual-harness fixture set if one exists; otherwise a hand-picked handful of files
  — at least one per snapshottable family (statblock, feature, featureblock), one non-snapshottable
  type (e.g. a kit, to prove SC-149's filter), and two entries sharing a word so the fuzzy order is
  observable. If the index cannot be pointed at a fixture folder without a product change, or the
  fixture would be large, return NEEDS_CONTEXT in phase A — don't build it without a ruling. The
  empty-compendium state (no files) is also driven: its Sync affordance is driven only to the point
  a sync would start, with the SC-440 page-side `requestUrlFn` stub that throws unless a test
  installs its own.
- **2026-11-15 — Bug flow** (same as SC-438..440). Workers never touch the tracker. A worker that
  finds a product bug commits its coherent work, finishes the survey, and returns
  `STATUS: NEEDS_CONTEXT` ONCE with every bug's title, repro, file:line and severity. The owner
  files the Backlog ticket (DSE 7.0.0, Bug + DSE Plugin, related to SC-443) and resumes the worker
  with the key, which the worker then cites in `knownBug('SC-…')` / `test.failing`. No product
  fixes in this ticket; product source may change ONLY to add `data-dse-control` attributes (and
  census plumbing) — no behaviour change.
- **2026-11-15 — Known open tickets touching this surface — cite, don't refile:** SC-462 (inserting a
  block inside a callout drops the `> ` from the inserted lines — Backlog: a callout insert drive
  gets a `knownBug('SC-462')` marker, not a new ticket), SC-404 (form editor deferred), SC-391
  (nine prose `ds-scc` types render "has no renderer" — a rendering gap, not an insert bug; avoid
  those types in the fixture or note it), SC-667 (in flight, not ours: a montage write inside a
  callout in Live Preview opens the callout as raw source). Fixed and must stay fixed (a regression
  is a new bug): SC-476 (in-fence autocomplete with extra words on the opening line), SC-601
  (compendium search opened from a hover preview being edited), SC-159 (search rows run name /
  type / source together), SC-148 / SC-147 / SC-390 (compendium reference insert works, not double
  wrapped, renders), SC-165 (snapshot inserts carry no `metadata:` block), SC-149 (block insert
  offers only the three snapshottable families), SC-190 (`ds-hero` hidden), SC-406 (experimental
  gate), SC-422 (text-size prefs reach the search hints), SC-156 / SC-236 (shipped examples valid).
- **2026-11-15 — Two phases, mandatory stop between them.** Phase A: ids + both censuses + the full
  manifest + jsdom matrix tests + the bug survey → commit → return `NEEDS_CONTEXT` (even with zero
  bugs) with the pair list, the bug list, and answers on the fixture compendium and the gate flip.
  The owner reviews, files bugs, and resumes for Phase B: e2e specs driving every pair in both
  editor modes, the markers, and the full battery.
- **2026-11-15 — Shared e2e infrastructure.** `e2e/driver/*` changes are shared with SC-442 (in
  flight, counter top-up) — keep them small and additive (new driver files preferred over edits to
  existing ones). Any edit to an EXISTING `e2e/driver/*` file, or to editor focus code
  (`host/livePreviewFocusCarry.ts` — SC-667 is in it), must be listed in the phase A report so the
  owner can tell the dispatcher before phase B.
- **2026-11-15 — Jest gate rule:** jest's default timeout is 30 s since SC-568; an "Exceeded timeout"
  is a real hang until proven otherwise (re-run the suite alone first; do not blame load). A full
  jest run must be green.
- **2026-11-15 — Lifecycle id.** G-S151 is reserved for this ticket if a lifecycle scenario is needed
  (not expected: e2e is the surface for this work).
- **2026-11-15 — Scenario ids.** e2e ids `AUTH-*`: `AUTH-I*` insert commands, `AUTH-S*` `/ds`
  suggest, `AUTH-K*` in-fence autocomplete, `AUTH-C*` compendium search + insert, `AUTH-G*`
  gate-ON. Census ids start at `[CENSUS-30]` (SC-442 in flight uses 18+). Scenario ids are global:
  check `grep -rn '\[AUTH-' e2e/` on develop AND the parallel SC-442 worktree
  (`/home/scott/code/steelCompendium/worktrees/sc442-e2e-counter-topup`, read-only); a duplicate id
  makes the runner exit 2 at start (SC-436). Never a bracketed ticket id in a test title (SC-577).
- **2026-11-15 — No `rm` in /tmp or the scratchpad** (dispatcher): never `rm`, `rm -f`, `rm -rf` or
  `rmdir` anything there; leave throwaway files in place. Never push to origin (the dispatcher
  lands).

## Battery baseline at 129beb18 (dispatcher, 2026-11-15)

jest 13703 passed / 1 skipped with the shots cache (fresh figure: measure your own) · lifecycle
64/64 · e2e `658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs` · shots 592, host-leak
163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.

Expected after this ticket: jest and e2e counts rise; coverage Y/Y with Y > 418; lifecycle 64/64
(G-S61 may be red on its torn-read line on a loaded host, on clean base too — SC-668);
shots/freeze/parity unchanged (attribute-only changes must not move print bytes — report any move
in host-leak or DOM numbers).

Lifecycle: SEVEN `--only=` parts (equals sign; with a space the whole suite runs), comma-separated —
1 `G-S7a … G-S9a` (21); 2 `G-S9b … G-S40` (16); 3 `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64`
(9); 4 `G-S57,G-S62,G-S61,G-S56` (4); 5 `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7); 6
`G-S92,G-S96,G-S97,G-S99` (4); 7 `G-S108,G-S112,G-S115` (3, ~200 s). G-S56 stays LAST in SCENARIOS
order. Flakes: G-S61 torn-read (SC-668); a G-S91 FAIL is real unless it says the host was too slow
after two re-runs; G-S115 (g) one re-run of part 7 on a loaded host (SC-633), any other failure
real; INIT-W09 / INIT-W10 (SC-654), SET-X03 / SET-X04 (SC-657), NEGO-R05 e2e flake under load, a
re-run passes; SC-622: restore `demo-vault/.obsidian/appearance.json` before blaming a G-S97 FAIL.

## Land-ready rule (dispatcher, 2026-11-15)

Before reporting land-ready: the superproject branch sits on current workspace origin/main with ONE
pointer bump (plus a CHANGELOG commit only if something user-facing changes) and no interim pointer
commits.

## Rounds

(appended as they run)
- **r1 phase A (2026-11-15)** — implementer (orchestration:implementer, id a6374024437ecfe29) on
  `sc443-brief-r1-implementer.md`; report → `sc443-r1-implementer-report.md`. Ticket → Awaiting.
  Phase B = resume of the same identity. Review (r2) goes to a fresh orchestration:reviewer.
- **r1 phase A result (2026-11-15)** — NEEDS_CONTEXT at `a78df6e3` (1edb1169 ids + manifests, 7bd78362 jsdom
  census + CM6 helper, a78df6e3 jsdom matrix) on develop `129beb18`. 31 manifest controls (6 DOM-stamped:
  `authoring.ds.item`, `authoring.schema.key`, `authoring.schema.value`, `authoring.search.input`,
  `authoring.search.result`, `authoring.search.sync`; 2 virtual triggers; 23 `authoring.cmd.<id>` commands:
  13 shipped + 2 compendium + 8 gate-ON), 46 new pairs → expected coverage 464/464. tsc (incl. -p e2e) /
  lint clean; jest 13944 passed / 2 skipped fresh (+241); jsdom census 88/88. No existing `e2e/driver/*`
  edit, `livePreviewFocusCarry.ts` untouched. Mechanics: (a) the index scans the vault for frontmatter
  `scc` → 13 files (~40 KB) from `test/fixtures/md-dse/` copied in at run time by a new driver after
  `dse.openNote`'s reset (empty state is the default); (b) `dse.setPrefs({}, {experimental:true})` reloads
  the plugin, which re-registers commands; `/ds` re-reads per call; (c) mode via `setViewState`, real
  `browser.keys` into `.cm-content`, palette Ctrl+P; (d) new driver files only.
- **Owner rulings on phase A (2026-11-15):**
  - Pair list (46) → **accepted**. Real input for a command = the palette (Ctrl+P, type, Enter);
    `executeCommandById` never credits a pair → **approved**. Modifier routing click-only (Obsidian's list
    registers no Shift/Ctrl+Enter, no Tab) → accepted; pin Tab as a plain negative outside the manifest, as
    proposed.
  - Fixture compendium plan (13 files from `test/fixtures/md-dse/`, copied at run time, absent by default)
    → **approved**. "Fuzzy order observable" = index order, as measured.
  - Gate-ON via `dse.setPrefs` reload → **approved**; `authoring.schema.value` driven gate-ON only (no
    shipped top-level enum) → accepted.
  - SC-165 wording → **corrected**: the bar is "no dead copy of the entry" (SC-232 narrowed `metadata`),
    not "no `metadata:` at all". Tests pin what the implementer measured.
  - Bugs filed (DSE 7.0.0, Bug + DSE Plugin, Backlog, related SC-443):
    - **SC-675** (Medium; related SC-462) — B1: an insert not at the start of an empty line breaks the
      block (mid-line, text after the cursor, list item; compendium inserts too). Markers: e2e
      `knownBug('SC-675')` on (i) a mid-line insert command (`abc|`) and (ii) the `/ds… tail` pick, in at
      least one editor mode each; jsdom `test.failing` for the list-item and compendium cases. Each marker
      asserts only the neutral outcome (the inserted block renders as a working block and the text before
      / after the cursor survives) so either fix (split onto own lines, or refuse with a Notice that
      leaves the note unchanged) flips it — write the assertion so a refuse-with-unchanged-note fix also
      passes. The callout case stays on SC-462 (existing jsdom marker).
    - **SC-676** (Low) — B2: `/ds` triggers in a list-indented code block, in Source-mode frontmatter, and on
      a fence's own opening line. jsdom `test.failing` (all three cases; asserts only that no suggestion is
      offered there).
    - **SC-677** (Low) — B3: Ctrl/Cmd-click copy with a refusing clipboard → no Notice + unhandled
      rejection. jsdom `test.failing`. If the e2e Ctrl-click drive hits a page error in Electron, report
      it — don't widen `allowedErrors` without a ruling.
    - **SC-678** (Low) — accepting a key mid-word doubles the tail (`max|_stamina` → `max_stamina_stamina`).
      jsdom `test.failing` for the doubling only. Already-present keys offered again and no `: ` after
      accept are noted on the ticket as rough edges, no marker.
  - Follow-up `type:` / `source:` filter values exact-case → **drop**: filter values are codes, lower case
    is the documented form; not worth a ticket.
  - Phase B additions: the undo check (one Ctrl+Z after an insert restores the note exactly — report what
    Obsidian does; a multi-step undo is an observation, not a bug, unless it leaves the note damaged) and
    whether a CRLF note keeps CRLF on save (observation).
- **r1 phase B (2026-11-15)** — implementer resumed (same id a6374024437ecfe29). r2 reviewer brief prepared: `sc443-brief-r2-reviewer.md`.
- **r1 phase B interim (2026-11-15)** — NEEDS_CONTEXT at `64d2d8fd` (0403cce2 jsdom markers SC-675..678,
  64d2d8fd e2e specs + new driver files `e2e/driver/authoring.ts`, `authoringTrips.ts`, `authoringAssert.ts`).
  tsc/lint rc 0; jest 13953 / 2 fresh; e2e `--element=authoring` `65/67 ok, 0 failed, 2 known-bug, coverage:
  46/464 (partial)`. 67 tests: AUTH-I01..I22, S01..S09, K01..K08, C01..C11, G01..G12, CENSUS-30..34 (own file
  `specs/authoring/census.e2e.ts`). No shared-file edits. Snapshot goldens captured from real Obsidian
  (`e2e/vaults/golden/snapshot-*.txt`; real `stringifyYaml` differs from the jest mock). One Ctrl+Z restores
  the note; CRLF → LF on any edit (Obsidian's editor; observation). Ctrl-click copy raised no page error in
  Electron (SC-677 stays jsdom-only). Process slip: one `rm -f` of its own scratch rc file (no harm).
- **Owner rulings (2026-11-15, B5):** filed **SC-679** (Bug, Medium; related SC-678) — accepting an in-block
  suggestion with nothing typed leaves the cursor before the text and the list open; the next Enter writes
  a second value (`schemaSuggest.ts:126-129`). Markers as proposed: e2e `knownBug('SC-679')` AUTH-G13
  (cursor lands after the accepted value) and AUTH-G14 (Escape then Enter does not split or damage the
  value), jsdom `test.failing` for the cursor after an empty-range accept; fix the `see AUTH-G13` comment.
  Also check the SHIPPED key list (`ds-stam` / `ds-skills`, accept on an empty line): if it reproduces there,
  add one gate-OFF e2e `knownBug('SC-679')` marker too and say so (the ticket asks the fixer to check it).
  Observations (key list re-opens on the accepted word; a key list opens over a new `/ds` block) → no
  action. Then the full battery.

## Resume 2026-11-23 (new owner: Fable ticket-owner, dispatcher session `e255a3cd-5cdb-4dc4-83be-b58e80eb1057`)

- **State found.** dse branch `sc443-e2e-editor-insert` @ `ae9025ea` (6 commits on develop `129beb18`), clean tree; the
  full battery after the SC-679 markers was never run and no reviewer round has run. SC-443 thread: still no comments.
  dse `develop` is now `d582e7ff` (31 commits ahead: SC-675 + SC-462 fix, SC-434 CI e2e job, SC-641, SC-644, SC-671).
  Workspace origin/main `0ec2f4f9`; the worktree superproject was fast-forwarded to it by the owner (only the dse
  gitlink moved; pointer left unstaged).
- **Baseline at `d582e7ff` (dse-verify CURRENT):** tsc + lint clean · jest 13936 passed / 2 skipped fresh · lifecycle
  64/64 · e2e `668/673 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs` · shots 592, host-leak 163/978, modal
  host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0 / 0 / 24.
- **Ticket states (2026-11-23):** SC-675 Done, SC-462 Done (both fixed on develop by `c9b03a90`..`3b47e55b`). SC-676,
  SC-677, SC-678 Backlog (markers stay). SC-679 Awaiting — in flight in worktree `sc679-suggest-enter-double-value`
  (based on `129beb18`, not landed): its markers stay as markers here; whichever of the two lands second flips them.
  SC-442 Awaiting (in flight; uses CENSUS-18, CENSUS-19; no AUTH ids).
- **Owner rulings (2026-11-23, rebase round r3):**
  - R3-1 — Rebase onto `d582e7ff`. Overlapping files: `src/authoring/suggest.ts` (keep develop's SC-675 behaviour;
    re-apply only the `data-dse-control` attributes), `test/dom/authoring/_cmEditor.ts` (develop's copy wins; additive
    changes only if a SC-443 test needs them), `e2e/README.md` (keep both).
  - R3-2 — SC-675 / SC-462 markers become PLAIN tests that pin the exact bytes the landed fix writes (not only the
    neutral outcome): e2e AUTH-I21, AUTH-S09; jsdom `test.failing` x3 in `authoringKnownBugs.test.ts`; the SC-462
    `test.failing` in `compendiumInsertMatrix.test.ts`. The list-item jsdom case needs a list-aware assertion
    (`scanFences` does not see a fence indented in a list item). The three non-marker tests that pin the old output
    for an indented `/ds` token (`dsSuggestMatrix.test.ts` ~:133 and ~:143, e2e AUTH-S04) are rewritten to the landed
    behaviour (SC-675 ledger INFO-1: "The tests are wrong, not the fix").
  - R3-3 — Add real-Obsidian drives for the two insert shapes SC-675 fixed without an e2e test: an insert command with
    the cursor inside a callout line and inside a list item, each in Live Preview and Source mode, plain tests, exact
    note bytes asserted, the block renders as a DSE element (no error card). No write is driven on the list-item block
    (an indented fence cannot save: SC-461, known). No new manifest pair is needed (same control, same interaction).
  - R3-4 — A marker that now passes unexpectedly (SC-676 / 677 / 678 / 679), or any new product bug, is reported, not
    fixed (bug flow above unchanged).
  - R3-5 — No CHANGELOG entry: tests plus `data-dse-control` attributes, nothing a user sees.
- **r3 (2026-11-23)** — brief `sc443-brief-r3-rebase.md`; report → `sc443-r3-rebase-report.md`.
  Implementer (orchestration:implementer) id aa746b59f093c5207 (fresh; the phase A/B identity a6374024437ecfe29 has no transcript in this session). Review r4 goes to a fresh orchestration:reviewer.
- **r3 result (2026-11-23)** — DONE at `6c5a073c` (8 commits on `d582e7ff`; rebase had no conflicts; new commits
  `4b1aa47a` jsdom, `6c5a073c` e2e). The worker was cut by a usage limit after freeze and resumed for parity and the
  report. `src/` diff vs base: the three `data-dse-control` attribute edits only. Gates: tsc / lint rc 0 · jest
  14187 passed / 2 skipped fresh (13936 + 252 − 1: the deleted neutral-outcome helper's self-test) · lifecycle 64/64,
  no re-runs · e2e `739/747 ok, 0 failed, 8 known-bug, coverage: 464/464 pairs` (673 + 70 + 4; known-bug = develop's 5
  + SC-679 AUTH-G13 / G14 / K09) · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze
  280/280 · parity 0 / 0 / 24 · `styles.css` sha256 `18730938…` identical to a clean `d582e7ff` build. Un-marked 6
  (4 jsdom, e2e AUTH-I21, AUTH-S09), rewritten 3 (two `dsSuggestMatrix`, AUTH-S04), added AUTH-I23..I26 (callout
  line, list item × Live Preview, Source). Deleted `e2e/driver/authoringAssert.ts` (unused after the flip) and its
  self-test. No unexpected marker pass, no new bug, no id collision. Report `sc443-r3-rebase-report.md`; logs in the
  session scratchpad `sc443-r3-impl/`.
- **r4 (2026-11-23)** — two scoped orchestration:reviewer workers on `sc443-brief-r4-review.md`: scope A (surface,
  src diff, round trips, censuses, manifest honesty, gate, network, shared files, ids, gate re-run) → 
  `sc443-r4a-review-report.md`; scope B (jsdom matrix, markers + fixed-bug tests, bug hunt) → `sc443-r4b-review-report.md`.
  Reviewer ids: scope A ad58adaec08f65b3e, scope B adbfd87fade0f820d (both orchestration:reviewer, author-independent of aa746b59f093c5207).
- **Dispatcher course correction (2026-11-23, during r4):** "SC-679 landed first — dse origin/develop is now 8c08bce2 (was d582e7ff; 7 commits: accepting an in-block suggestion with nothing typed leaves the cursor after it and closes the list). Workspace origin/main 66b1e5ec. Relayed from the SC-679 owner, verbatim: "SC-443 hand-off: whichever of SC-443 and SC-679 lands second applies that patch. It applies on SC-443 tip `ae9025ea` plus this land diff. If SC-443 lands without it, its `knownBug('SC-679')` markers AUTH-G13, AUTH-G14, AUTH-K09 and the jsdom `test.failing` marker will start failing as 'unexpectedly passing'." The patch ("holds the real-Obsidian tests for this fix (3 known-bug markers flipped, 13 new e2e tests, 1 jsdom marker flipped)") is preserved at /home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc679-suggest-enter-double-value/sc679-on-sc443.patch (SC-679 ledger in the same dir). New dse-verify CURRENT @ 8c08bce2: jest 13944/2 fresh, lifecycle 64/64, e2e 668/673 ok, 0 failed, 5 known-bug, 418/418 pairs; shots 592 / freeze 280/280 / parity 0/0/24. Rebase onto 8c08bce2 and apply the patch before reporting land-ready."
- **Owner ruling (2026-11-23, R5-1):** the r4 reviewers finish against `6c5a073c` on `d582e7ff` undisturbed (the
  branch is not rebased under them). One combined round r5 then does: rebase onto `8c08bce2` (overlap:
  `src/authoring/schemaSuggest.ts` — develop's SC-679 behaviour wins, re-apply only the `data-dse-control`
  attributes), apply `sc679-on-sc443.patch` (written against `ae9025ea`; adapt by hand where r3 moved the context),
  the r4 findings, and the full battery. Expected after r5: e2e 673 + 74 + 13 = 760 tests, 5 known-bug (develop's
  own; no AUTH marker left), `coverage: 464/464`; jest about 13944 + 251 = 14195 / 2 skipped fresh. A scoped
  re-review of the r5 delta follows.
- **r4a result (2026-11-23)** — scope A: NOT LAND-READY at `6c5a073c` only because of the base move (H-1). 0 CRITICAL /
  1 HIGH / 0 MEDIUM / 4 LOW / 9 INFO. Reviewer gates at `6c5a073c`: tsc / lint rc 0; jest 14185 / 4 skipped in a
  scratch worktree (= 14187 / 2 in place); full e2e `739/747 ok, 0 failed, 8 known-bug, coverage: 464/464 pairs`
  (487 s); 8 tests alone 8/8. 11 of 12 handler mutants caught by a plain e2e test (M12, Shift on the snapshot
  command, only by jsdom); an un-id'd button turns CENSUS-30..34 and four jsdom census tests red. `src/` diff =
  the three attribute edits; no id collision; no tracked vault file written. On a scratch rebase onto `8c08bce2`:
  no conflicts; the four SC-679 markers fail as "appears fixed". Report `sc443-r4a-review-report.md`.
- **Owner rulings on r4a (2026-11-23):**
  - H-1 (SC-679 markers after the rebase) → **fold into r5** (already R5-1: rebase + `sc679-on-sc443.patch`).
  - L-1 (no throwing network guard on the authoring specs; AUTH-C10 with its stub removed sent a real request) →
    **fold**: every authoring spec runs under a network guard that throws (the SC-440 `requestUrlFn` mechanism),
    and the manifest comment matches what the code does.
  - L-2 (AUTH-C09 says Shift-click or Ctrl-click, drives only Ctrl; mutant M12 survives e2e) → **fold**: drive
    Shift-click on the snapshot command through real input so M12 goes red in e2e; titles say what is driven.
  - L-3 (K01 / K02 key accept has no screen check) → **fold**: complete the line after the accept and assert the
    block draws as a DSE element.
  - L-4 (middle-click / right-click on a search row reaches `onChooseSuggestion`; not in the manifest) → **fold**:
    one manifest pair and plain e2e test(s) pinning what a middle-click and a right-click do today. **No bug
    ticket**: Obsidian's own suggestion list hands every mouse button to the chooser for every plugin; the row does
    its default action, nothing is lost. Named to Scott in the land-ready comment as an observation.
  - INFO (gate restore unobservable across spec files; real census cannot see a listener-less button; census
    cascade; Home / End / ArrowUp / Cmd-click not in the manifest; three weak-but-acceptable checks) → **drop**:
    Obsidian's own list navigation is not our handler, Cmd-click is not drivable on Linux, and the rest is
    harness design already accepted on SC-438..440.
- **r4b result (2026-11-23)** — scope B: NOT LAND-READY at `6c5a073c`. 0 CRITICAL / 0 HIGH / 1 MEDIUM / 2 LOW / 5 INFO;
  2 new product bugs (PB-1 Medium, PB-2 Low), both reproduced in real Obsidian. SC-675 / SC-462 tests: no marker
  left, r3 weakened nothing; reverting the SC-675 src diff turns 6 SC-443 jsdom tests and 7 e2e drives red; 6 hand
  mutants of `blockInsert.ts` each caught by an SC-443 e2e drive. Open-bug markers fail for their stated reason.
  Reviewer gates: jest 14185 / 4 skipped in a scratch worktree (= 14187 / 2), authoring e2e 71/74 ok, 3 known-bug.
  Report `sc443-r4b-review-report.md`.
- **Owner rulings on r4b (2026-11-23):**
  - PB-1 → filed **SC-687** (Bug, Medium, DSE 7.0.0, Backlog; related SC-443, SC-676): an insert command or a
    compendium insert run with the cursor inside an existing fenced block (or the frontmatter) breaks that block.
    Markers: jsdom `test.failing` + one e2e `knownBug('SC-687')`, each asserting only that the existing block's
    fences and text are intact after the command (or the note is unchanged), so a refusal and a move-below fix both
    flip it.
  - PB-2 → filed **SC-688** (Bug, Low, DSE 7.0.0, Backlog; related SC-443, SC-678): accepting a value right after
    `key:` with no space writes `key:value`. The ticket also carries the value-list twin of SC-678 (`mode: te|st` →
    `mode: testst`). Markers: jsdom `test.failing` for each of the two (asserting only that the accepted line
    parses / the tail is not doubled) and one gate-ON e2e `knownBug('SC-688')` for the no-space accept.
  - MEDIUM-1 (`schemaSuggestMatrix.test.ts:158` pins `mode:flat` as correct) → **fold**: the row becomes the SC-688
    `test.failing`.
  - LOW-1 (SC-678 marker cannot flip under a "no list mid-word" fix) → **fold** as prescribed.
  - LOW-2 (SC-677 marker tied to `copyCode()`) → **fold** as prescribed (drive through `dispatchReferenceChoice`
    with Ctrl; assert a Notice and no escaped rejection).
  - INFO-1 (jsdom list case hits the whitespace branch only), INFO-2 (empty quoted line rule untested), INFO-3
    (snapshot case has no cursor assertion) → **fold**: one jsdom case / assertion each, same files.
  - INFO-5 (SC-676 markers pass `file=null`) → **fold if it needs no guess at the fix**: give the markers a file
    and a metadata cache stub so a cache-based fix also flips them; otherwise leave and say so.
  - INFO-4 (`insertMatrix` takes its expectation from `buildScaffold`) → **drop**: the e2e drives read
    `example.yaml` independently, so the scaffold text is pinned from outside.
- Worktree superproject fast-forwarded to workspace origin/main (see r5 brief for the sha).
- **r5 (2026-11-23)** — implementer aa746b59f093c5207 resumed on `sc443-brief-r5-fix.md` (rebase onto `8c08bce2`, the
  SC-679 patch, r4a L-1..L-4, r4b MEDIUM-1 / LOW-1 / LOW-2 / INFO-1,2,3,5, markers for SC-687 and SC-688, full
  battery); report → `sc443-r5-fix-report.md`. Worktree superproject fast-forwarded to workspace origin/main
  `e7f6b4a1` (pointer unstaged). r6 = scoped re-review of the r5 delta by a reviewer that did not write it (resume
  scope B reviewer adbfd87fade0f820d for the marker / jsdom half and scope A reviewer ad58adaec08f65b3e for the e2e
  half, or one fresh reviewer if either transcript is gone).
- **Dispatcher course correction (2026-11-23, during r5):** "FYI: SC-672 landed — dse origin/develop is now 957e4b11 (was 8c08bce2; 8 commits: empty / non-map Counter block handling; counter model + tests only). Workspace origin/main 28ba594f (CHANGELOG.md gained SC-672 bullets). New dse-verify CURRENT @ 957e4b11: jest 14013/2, lifecycle 64/64 (G-S63 flaked once, filed SC-689), e2e 682/687 ok, 0 failed, 5 known-bug, 418/418 pairs; shots 592 / freeze 280/280 / parity 0/0/24. Rebase onto 957e4b11 (and still apply the SC-679 patch) before reporting land-ready."
- **Owner ruling (2026-11-23, R5-2):** r5's base is `957e4b11`, not `8c08bce2` — sent to the running implementer so
  the battery runs once, at the final head on the final base. Expected numbers shift by the base delta: jest
  +69 (about 14264 / 2 plus r5's additions), e2e tests 687 + 74 + 13 + r5's new tests, known-bug 5 + SC-687 +
  SC-688 = 7, coverage 464 + the L-4 pair(s); `styles.css` identical to a clean `957e4b11` build; lifecycle flake
  list gains G-S63 (SC-689), one re-run allowed.
- **r5 result (2026-11-23)** — DONE at `758a8956` (12 commits on `957e4b11`; no rebase conflicts on either base move;
  `sc679-on-sc443.patch` applied with `--3way`, no hunk adapted; no SC-679 marker left). Gates at the final head:
  tsc / lint rc 0 · jest 14272 / 1 skipped with the shots cache (= 14271 / 2 fresh; 14013 + 251 + 7) · lifecycle
  64/64, no re-run · e2e `772/779 ok, 0 failed, 7 known-bug, coverage: 466/466 pairs` (687 + 74 + 13 + 5; known-bug
  = develop's 5 + AUTH-I27 (SC-687) + AUTH-G21 (SC-688)) · shots 592, host-leak 163/978, modal host-leak 40/240,
  capture clip 147 · freeze 280/280 · parity 0 / 0 / 24 · `styles.css` sha256 `18730938…` identical to a clean
  `957e4b11` build · `src/` diff = the three `stampControl` edits (12 added lines). New e2e: AUTH-C12 (Shift-click
  on the snapshot command), C13 / C14 (middle / right click; pairs `click:Middle`, `click:Right` → 466), I27, G21;
  K01 / K02 extended. Markers open: SC-676 ×3, SC-677, SC-678, SC-687 (jsdom ×3 + AUTH-I27), SC-688 (jsdom ×2 +
  AUTH-G21). L-1: `networkGuard()` in `openEditor`; with AUTH-C10's stub removed the test is red on the guard's
  throw (the "resolving compendium release…" Notice still shows because the service posts it before calling
  `requestUrlFn`). No new bug, no drive-by, no flake re-run. Report `sc443-r5-fix-report.md`; logs `r5b-*` in the
  session scratchpad `sc443-r5-impl/`.
- **r6 (2026-11-23)** — scoped re-review of the r5 delta on `sc443-brief-r6-rereview.md`: r4 scope A reviewer resumed
  for items 1, 2, 3 (L-1..L-4), 5, 6 → `sc443-r6a-rereview-report.md`; r4 scope B reviewer resumed for items 3
  (MEDIUM-1, LOW-1, LOW-2, INFO-1/2/3/5) and 4 → `sc443-r6b-rereview-report.md`.
- **r6a result (2026-11-23)** — LAND-READY for items 1, 2, 3 (L-1..L-4), 5, 6 at `758a8956` on `957e4b11`. H-1, L-1,
  L-2, L-3, L-4 all RESOLVED; no new finding, no new bug. Range-diff: the 8 rebased commits all `=`; `src/` diff =
  the three `stampControl` edits (+12); `44de5b07` matches the patch byte for byte; 87 `[AUTH-*]` ids unique vs
  develop and sc442 `6d5a2caa`. SC-679 fix reverted: e2e 17 of 20 red, jsdom 4 red. L-1: every `src/` network call
  goes through `requestUrlFn`; the guard throws on the one attempt; the "resolving…" Notice is posted before the
  call and is not evidence of a request. Reviewer gates: tsc / lint rc 0; jest 14269 / 4 skipped in a scratch
  worktree (= 14271 / 2); full e2e `772/779 ok, 0 failed, 7 known-bug, coverage: 466/466 pairs` (534 s). Report
  `sc443-r6a-rereview-report.md`.
- **r6b result (2026-11-23)** — LAND-READY for items 3 (MEDIUM-1, LOW-1, LOW-2, INFO-1/2/3/5) and 4 at `758a8956`.
  All seven r4b findings RESOLVED. SC-687 markers (jsdom ×3 + AUTH-I27) and SC-688 markers (jsdom ×2 + AUTH-G21)
  each fail today for the stated reason and flip under both fix shapes; under each simulated fix the authoring e2e
  folder keeps its 90 plain tests green. SC-679 jsdom half confirmed. New: LOW-A, INFO-A, INFO-B; no new bug.
  Reviewer gates: jest 14269 / 4 skipped in a scratch worktree (= 14271 / 2); authoring e2e `90/92 ok, 0 failed,
  2 known-bug`. Report `sc443-r6b-rereview-report.md`.
- **Owner rulings on r6b (2026-11-23):**
  - LOW-A (`schemaSuggestMatrix.test.ts:81`, a plain row, pins the value list opening on `mode:` with no space; a
    "no list until a space" fix for SC-688 turns it red) → **no branch change; noted on SC-688** (Agent notes). The
    row pins today's behaviour, which is not itself the defect; the fixer who picks that shape updates the row. A
    comment-only commit would move a head two reviewers and the full battery just verified.
  - INFO-A (AUTH-G21 waits 1.5 s for the list) → **drop**: on a slow host it fails loudly as "appears fixed", never
    passes silently; green in 4 runs at loadavg 12-35.
  - INFO-B (the SC-677 marker's borrowed process is sound, no listener leak) → no action.
- **LAND-READY (2026-11-23).** dse `sc443-e2e-editor-insert` @ `758a8956` (12 commits on `develop` @ `957e4b11`);
  worktree superproject @ `6d0de253` = ONE pointer-bump commit on workspace `origin/main` `e22502ae`, tree clean.
  Gates at `758a8956` (implementer, full battery; tsc / lint / jest / full e2e re-run by the r6a reviewer with the
  same numbers): tsc (incl. `-p e2e`) and lint clean · jest 14271 passed / 2 skipped fresh (14272 / 1 with the shots
  cache; baseline 14013) · lifecycle 64/64 · e2e `772/779 ok, 0 failed, 7 known-bug, coverage: 466/466 pairs`
  (baseline `682/687`, 5 known-bug, 418 pairs; new known-bug AUTH-I27 = SC-687, AUTH-G21 = SC-688) · shots 592,
  host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0 / 0 / 24 · `styles.css`
  identical to a clean `957e4b11` build. No freeze delta, no lifecycle id used (G-S151 stays free), no CHANGELOG
  entry. `sc679-on-sc443.patch` applied. Tickets filed this session: SC-687 (Medium), SC-688 (Low); SC-688
  description amended with the LOW-A note. Comment posted on SC-443 (land-ready summary, state Awaiting, no ask).
  After landing: SC-443 → Done. Open markers on develop after landing: SC-676 ×3, SC-677, SC-678 (jsdom), SC-687
  (jsdom ×3 + e2e AUTH-I27), SC-688 (jsdom ×2 + e2e AUTH-G21) — whoever fixes one of those flips its marker.
  Note for SC-442 (in flight): this branch adds CENSUS-30..34 and 87 `AUTH-*` ids; no collision with sc442 `6d5a2caa`.
