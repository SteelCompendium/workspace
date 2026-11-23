# SC-442 decisions ledger — e2e rollout (Tier 2): ds-counter top-up

Worktree: `/home/scott/code/steelCompendium/worktrees/sc442-e2e-counter-topup` (branch
`sc442-e2e-counter-topup` in every submodule). Cut 2026-11-15 from dse develop `bab0dbb2`,
workspace superproject `f7185e87` (= workspace origin/main at cut). Tracked branch for dse:
`develop`. Owner: Opus 5.5 ticket-owner, session `be71a0a9-199f-4e14-967b-191935312b05`.

## Scott's rulings (verbatim, dated)

- **2026-10-18 (SC-408):** "yes, I want to roll this out across all parts of the plugin,
  including the settings"
- **2026-10-18 (SC-408):** "For any bugs found, please mark them with the DSE 7.0.0 project."
- **2026-10-18 (SC-408, e2e gate):** "make it required to land future changes"

(SC-442 thread: no comments at start, 2026-11-15.)

## Ticket scope (verbatim from the SC-442 description)

> **Scope:** `ds-counter`. The lifecycle gate already exercises its write timing heavily, so this
> ticket is small. Add its manifest and census coverage, and fill in whichever (control,
> interaction) pairs the lifecycle scenarios don't drive: the steppers, typed value, keyboard, and
> min/max edges.
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

## State at cut (owner survey, 2026-11-15)

- `e2e/manifest/counter.ts` exists as a PILOT stub: only `counter.dec` and `counter.inc`, pairs
  `press:Enter` + `click` (SC-495, SC-602). The value `<input type=number>` (kit stepper, editable)
  has no manifest entry. Counter is not in either census yet.
- Existing counter e2e specs: `e2e/specs/counter/{counter-focus,counter-focus-live-preview,kept-keys}.e2e.ts`
  (ids CTR-F01..02, CTR-L01..05, CTR-K01). jsdom: `test/dom/elements/counter.test.ts`.
- Lifecycle scenarios touching counters: G-S73, G-S77, G-S115 and others (write timing, twins, hover
  previews). They are not e2e coverage pairs.

## Owner rulings

- **2026-11-15 — Surface boundary.** In scope: every interactive node `ds-counter` draws
  (`src/elements/counter/view.ts` on the kit `stepper`): the `-` / `+` buttons, the value input
  (editable) or value span (read-only), and any chrome item the counter card itself contributes
  that is not already in `e2e/manifest/chrome.ts`. Do NOT re-manifest shared chrome (edit button,
  pin, collapse) that `chrome.ts` already owns; say in the phase A report which chrome the counter
  card shows and where it is already covered. Keep the existing `counter.*` id prefix and the
  existing `counter.dec` / `counter.inc` ids. Not in scope: the block edit form, the sidebar host,
  hover-preview twin logic (lifecycle owns it).
- **2026-11-15 — Pairs to fill** (from the ticket): steppers (click, keyboard), typed value
  (type + commit by Enter and by blur, Escape if the stepper handles it, invalid / out-of-range
  input, empty input), keyboard (Enter / Space on the buttons; ArrowUp / ArrowDown in the input if
  the stepper or the browser number input reaches our onChange), and min / max edges (a button
  disables at its limit; typed values past a limit clamp or refuse — whichever the product does is
  what the test pins, and a behavior that looks wrong is a bug candidate, not a test change). Each
  e2e drive asserts BOTH the note file (the block's YAML values) and the screen (shown value,
  disabled state). Per dse-verify (SC-480 note): compare the counter's values and the text outside
  the fence, never the fence's text to a fixture — the plugin re-serializes key order.
- **2026-11-15 — Matrix.** The combinatorial logic (values × min/max present or absent × at-limit
  × editable / read-only × typed input shapes) goes in a jsdom matrix test
  (`test/dom/elements/counter-matrix.test.ts`, mirroring `montage-matrix` / `settings-matrix`).
- **2026-11-15 — Bug flow** (same as SC-438..440). Workers never touch the tracker. A worker that
  finds a product bug commits its coherent work, finishes the survey, and returns
  `STATUS: NEEDS_CONTEXT` ONCE with every bug's title, repro, file:line and severity. The owner
  files the Backlog ticket (DSE 7.0.0, Bug + DSE Plugin, related to SC-442) and resumes the worker
  with the key, which the worker then cites in `knownBug('SC-…')` / `test.failing`. No product
  fixes in this ticket; product source may change ONLY to add `data-dse-control` attributes (and
  census plumbing) — no behavior change.
- **2026-11-15 — Known open tickets touching this surface — cite, don't refile:** SC-670 (an
  outside edit while a counter button has keyboard focus drops focus to the page), SC-633 (G-S115
  (g) hover-preview flake), SC-550 (pinned sidebar card click lost within ~400 ms), SC-508 (lone CR
  in a block's opening line), SC-475 / SC-507 (Send block to sidebar fence edge cases). Fixed and
  must stay fixed (a regression is a NEW bug): SC-495 (focus kept when a stepper disables itself at
  its limit), SC-602 (Live Preview focus after own-save redraw), SC-652 (kept keys), SC-290 /
  SC-457 / SC-476 (fence info strings), SC-493.
- **2026-11-15 — Two phases, mandatory stop between them.** Phase A: ids + both censuses + the full
  manifest + jsdom matrix tests + the bug survey → commit → return `NEEDS_CONTEXT` (even with zero
  bugs) with the pair list (new and existing), which pairs the existing specs already drive, and the
  bug list. The owner reviews, files bugs, and resumes for Phase B: e2e specs driving every pair,
  the markers, and the full battery.
- **2026-11-15 — Jest gate rule:** jest's default timeout is 30 s since SC-568; an "Exceeded
  timeout" is a real hang until proven otherwise (re-run the suite alone first; do not blame load).
- **2026-11-15 — Lifecycle id.** G-S149 is reserved for this ticket if a lifecycle scenario is
  needed (not expected: e2e is the surface for this work).
- **2026-11-15 — Scenario ids.** New e2e ids use the `CTR-` prefix with a letter group not yet
  used (taken: CTR-F01..02, CTR-L01..05, CTR-K01) — e.g. `CTR-S01` steppers, `CTR-T01` typed value,
  `CTR-E01` edges. Census ids start at `[CENSUS-18]`. Scenario ids are global: grep develop AND the
  parallel branches (read-only) `/home/scott/code/steelCompendium/worktrees/sc662-sidebar-pending-saves`
  and `/home/scott/code/steelCompendium/worktrees/sc656-negotiation-outside-edit-focus` before
  choosing (checked at cut: neither adds CTR or CENSUS ids). Never a bracketed ticket id in a test
  title (SC-436 / SC-577).
- **2026-11-15 — Overlap with parallel owners** SC-662 (pinned sidebar pending saves) and SC-656
  (negotiation outside-edit focus) are both in `src/`. If a stamp or id needs a `src/` change in a
  file they touch (`src/framework/sidebar/*`, `src/framework/view.ts`, `src/framework/kit/managedModal.ts`,
  `windowHandoff.ts`), STOP and return NEEDS_CONTEXT — the owner tells the dispatcher. Shared test
  files (`e2eCensus.test.ts`, `_census.e2e.ts`, `e2e/driver/*`, `e2e/README.md`): small, additive
  edits only.
- **2026-11-15 — No `rm` in /tmp or the scratchpad** (dispatcher): never `rm`, `rm -f`, `rm -rf` or
  `rmdir` anything there; leave throwaway files in place.
- **2026-11-15 — Never push** anything to origin, including a feature branch (dispatcher). The
  dispatcher lands.

## Battery baseline at bab0dbb2 (dispatcher, 2026-11-15)

jest 13607 passed / 1 skipped with the shots cache · lifecycle 63/64 (G-S61 only, base too —
SC-668) · e2e `627/636 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` · shots 592, host-leak
163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.

Expected after this ticket: jest and e2e counts rise; coverage Y/Y with Y > 417; lifecycle 63/64
(G-S61 only, shown red on base too) or 64/64; shots/freeze/parity unchanged (attribute-only
changes must not move print bytes — report any move in host-leak or DOM numbers).

Lifecycle: SEVEN `--only=` parts (equals sign; a space runs the whole suite) — 1 `G-S7a … G-S9a`
(21); 2 `G-S9b … G-S40` (16); 3 `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9);
4 `G-S57,G-S62,G-S61,G-S56` (4); 5 `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7);
6 `G-S92,G-S96,G-S97,G-S99` (4); 7 `G-S108,G-S112,G-S115` (3, ~200 s). G-S56 stays LAST in
SCENARIOS order. Flakes: G-S61 torn-read line red on a loaded host, base too (SC-668); a G-S91 FAIL
is real unless it says the host was too slow after two re-runs; G-S115 (g) suspected flake (SC-633)
— one re-run of part 7, any other failure real; INIT-W10 (SC-654), SET-X03 / SET-X04 (SC-657),
NEGO-R05 e2e flake under load — a re-run passes. SC-622: restore
`demo-vault/.obsidian/appearance.json` if dirty before blaming a change for a G-S97 FAIL.

## Land-ready rule (dispatcher, 2026-11-15)

Before reporting land-ready: the superproject branch sits on current workspace origin/main with
ONE pointer bump (plus a CHANGELOG commit only if something user-facing changes), and no interim
pointer commits.

## Rounds

(appended as they run)
- **r1 phase A (2026-11-15)** — implementer (orchestration:implementer, id ad351ffe057cf2821) on
  `sc442-brief-r1-implementer.md`; report → `sc442-r1-implementer-report.md`. Ticket → Awaiting.
  Phase B = resume of the same identity. Review (r2) goes to a fresh orchestration:reviewer.
- **r1 phase A result (2026-11-15)** — NEEDS_CONTEXT at `b5a972fc` (74de1cdb manifest + censuses +
  fixtures, b5a972fc jsdom matrix) on develop `bab0dbb2`. 4 ids (`counter.dec`, `counter.input`,
  `counter.inc`, `counter.value`), all already stamped by the kit stepper — 0 `src/` changes. 14 pairs
  (4 existing, all driven by plain CTR-F/L/K; 10 new) → expected coverage 427/427. Census ids
  `[CENSUS-18]` (Reading) and `[CENSUS-19]` (Live Preview), written, not yet run. tsc/lint clean;
  jest 13756 passed / 2 skipped (fresh base 13606 / 2, +150). 6 bug candidates (B1..B6).
- **Owner rulings on phase A (2026-11-15):**
  - Pair list (14) **accepted**, including `counter.input` × `press:ArrowUp` / `press:ArrowDown`
    (they reach our handler through the number input; `sedit.apply-amount` precedent) and
    `counter.dec` / `counter.inc` × `click-disabled`. `counter.value` lists no interaction — fine.
  - `[CENSUS-19]` (Live Preview) **kept**: Live Preview is the common editing mode.
  - Real-Obsidian read-only counter: **skipped** — it only occurs in a Canvas card; the jsdom census
    and matrix cover read-only. Drop, no ticket.
  - Follow-up "the `Edit <element>` chrome item has no `data-dse-control`": **dropped, no ticket** —
    it is shared chrome inside SC-444's scope (Tier 3 chrome rollout), and the item sits behind the
    `authoringControls` preference that SC-404 defers from 7.0.0.
  - Follow-up "`e2eCensus.test.ts` header wording": dropped (wording nit).
  - Bugs filed (DSE 7.0.0, Bug + DSE Plugin, Backlog, related SC-442). Markers required; each marker
    asserts only the outcome any reasonable fix must produce:
    - **SC-671** (Medium) — B1, any write deletes unknown keys. e2e `knownBug('SC-671')` on
      `unknown-keys.md`: after +, the note has the new value AND `note_to_self: keep me` and
      `extra: {a: 1}` (compare parsed values, not key order).
    - **SC-672** (Medium) — B4 + B5, non-map / empty block. Two e2e `knownBug('SC-672')`:
      (a) `wrong-block.md`: the user's text (`hello`) is still in the note after the user tries a
      press (if the card offers no button, that is a pass — the marker must not require a button);
      (b) `empty-block.md`: the card never shows "Cannot read properties" (a fresh counter or a
      friendly error card both pass). Use `openNote(rel, { errorCard: true })` only where the
      ruling allows either outcome, and do not let a raw error card pass (a)'s or (b)'s marker.
    - **SC-673** (Low) — B2 + B6, number box rewrites. e2e `knownBug('SC-673')` on
      `out-of-range.md`: focus + blur and Enter in the untouched box leave the note unchanged
      (25 stays 25). jsdom `test.failing` citing SC-673: typing `-0` + Enter never leaves `-0` in
      the note.
    - **SC-674** (Low) — B3, quoted number. e2e `knownBug('SC-674')` on `quoted-value.md`
      (`"5"`, max 20): after +, the value reads as 6 (number 6 or string "6" both pass; 20 or "51"
      fail). No marker for the `abc` case (in the ticket text).
  - Matrix: the bug fixtures stay; no matrix test may pin B1..B6 behavior as correct (r1 confirmed).
- **r1 phase B (2026-11-15)** — resume of implementer ad351ffe057cf2821 with the rulings above.
- **2026-11-15 — New base (dispatcher):** SC-656 landed. dse develop is now `d62f0b26`, workspace
  main `636374d6`. Rebase onto `d62f0b26`; superproject branch on current workspace main with ONE
  pointer bump before land-ready. ~~Baseline at bab0dbb2~~ superseded by — numbers at `d62f0b26`:
  jest 13642 passed / 1 skipped with the shots cache · lifecycle 63/64 (G-S61 only, red on base,
  SC-668) · e2e `646/655 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` · shots 592, host-leak
  163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24. Phase B
  expected: e2e coverage 427/427 (re-count), 0 failed.
- **r1 phase B result (2026-11-15)** — DONE at `fa5524a9` (0697544b manifest/censuses/fixtures,
  60b6f0e6 matrix + SC-673 jsdom test.failing, fa5524a9 e2e specs + markers) on develop `d62f0b26`.
  tsc/lint clean; jest 13792 / 2 skipped (fresh, no shots cache); lifecycle 64/64; e2e ×2
  `664/679 ok, 0 failed, 15 known-bug, coverage: 427/427 pairs` (342 s / 355 s); shots 592 /
  163/978 / 40/240 / 147; freeze 280/280; parity 0/0/24; shipped plugin-data untouched. Markers:
  SC-671 CTR-U01; SC-672 CTR-W01/W02; SC-673 CTR-V01/V02 + jsdom [K01]; SC-674 CTR-Q01. Marker
  flips NOT simulated — the r2 reviewer does that.
- **r2 review (2026-11-15)** — fresh orchestration:reviewer on `sc442-brief-r2-reviewer.md`;
  report → `sc442-r2-review-report.md`.
- **2026-11-15 — New base (dispatcher), supersedes the d62f0b26 entry:** SC-662 landed. dse develop
  is now `129beb18`, workspace main `77a33eaa`. ~~rebase onto d62f0b26~~ superseded — rebase onto
  `129beb18`; superproject branch on current workspace main with ONE pointer bump before
  land-ready. Numbers at `129beb18`: jest 13703 passed / 1 skipped with the shots cache · lifecycle
  64/64 · e2e `658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs` (SC-662 added
  `cond.strip.add` × `press:Enter`) · shots 592, host-leak 163/978, modal host-leak 40/240, capture
  clip 147 · freeze 280/280 · parity 0/0/24. Dispatcher: "SC-662 changed the sidebar host and the
  pinned counter-style cards (Conditions / Resource / Surges / Tokens), so recheck any counter
  sidebar markers." Phase B expected after rebase: coverage 428/428 (re-count), 0 failed.
  Plan: let the r2 review on fa5524a9 finish (the diff is test-only and SC-662 is src-side); the fix
  round rebases onto 129beb18 and re-runs the full battery; the scoped re-review covers the rebase.
- **2026-11-15 — Owner note for the rebase round:** SC-662's `e2e/specs/sidebar/pending-saves.e2e.ts`
  pins a `ds-counter` (fixture `e2e/vaults/shipped/Sidebar/pending-counter.md`) and clicks
  `counter.inc` in the sidebar and in the note. After rebasing, check: (a) `[CENSUS-18]` / `[CENSUS-19]`
  and the jsdom counter census behave with a counter pinned to the sidebar (a sidebar card carries
  `chrome.unpin`; the census must neither miss a sidebar counter's un-id'd node nor flag shared
  chrome), and (b) the SC-442 specs and SC-662's spec don't disturb each other in a full run (shared
  note state, pinned panels left open).
- **r2 review result (2026-11-15)** — reviewer af16c4ad6dd187fc6: NOT LAND-READY at `fa5524a9`;
  0 CRITICAL / 0 HIGH / 3 MEDIUM / 3 LOW / 4 INFO; 2 new product bugs. All 11 mutants red; every
  simulated good fix flips its marker with 24 plain e2e tests green. Gates: jest 13793 / 1 (cache),
  lifecycle 64/64, e2e 427/427 (one run red on SET-X03/X04 = SC-657 flake, re-run green).
- **Owner rulings on r2 (2026-11-15)** — all folded into fix round r3 (implementer, the author;
  re-review r4 by reviewer af16c4ad6dd187fc6, scoped to the delta):
  - **M-1 fold.** SC-672 markers CTR-W01 / CTR-W02 must NOT pass on a raw JS error card. One shared
    check on the error card's message text (regex for raw JS errors: `Cannot read properties`,
    `Cannot destructure`, `is not a function`, `TypeError`, `undefined`/`null` property access),
    used by both markers; a friendly error card or a fresh counter still passes.
  - **M-2 fold.** Exclude `wrong-block` (and any other SC-672 fixture) from the jsdom census
    `RENDERS` list, so no plain census row pins SC-672 B4 as correct.
  - **M-3 + P-1 → filed SC-680** (Low; counter and every editable stepper: a wheel scroll over the
    focused box changes the value and the next click away saves it). The wheel is NOT a manifest
    pair (the ticket's expected fix is that the wheel does nothing; if Scott keeps wheel stepping,
    a pair is added then). Add a manifest comment saying so, citing SC-680. Marker: e2e
    `knownBug('SC-680')` on `unbounded.md`, driven with a REAL wheel action (wdio actions / the
    reviewer's probe approach in `sc442-rev-r2/zzprobe*.txt`), not a synthetic WheelEvent: after one
    wheel notch over the focused box and a click away, the note's value is unchanged. It must not
    record an undeclared coverage pair.
  - **P-2 → folded into SC-673's ticket text** (ArrowDown on 25-of-max-20 jumps to 20 while − steps
    to 24) as an open question for the fixer. **No marker, and no plain test may pin either
    behavior** (Start-collapsed precedent, SC-440).
  - **L-1 fold.** Every new e2e marker (SC-671, SC-672 ×2, SC-673 ×2, SC-674, SC-680) pins
    `failsWith` to its stated reason.
  - **L-2 fold.** CTR-E04: replace the invisible U+E003 literal with a named, commented constant
    (or select-all + Backspace through the driver) so the empty-box test reads as what it does.
  - **L-3 fold.** Fix the manifest `rows` notes (no T06; separate dec / inc lists; S04 listed).
  - **I-1 fold.** Add one Live Preview typed-value e2e test (type + Enter, asserting note and screen).
  - **I-2 drop:** the `inert` set has no effect in Reading / Live Preview census views.
  - **I-3** noted (expect 428/428 after rebase). **I-4 drop:** Q01's 6 s goes with `failsWith` or is
    harmless.
  - **Rebase** onto `129beb18` in this round; then the SC-662 overlap check (owner note above); then
    the full battery on the rebased head.
- **r3 fix round result (2026-11-15, reconstructed 2026-11-23 from git; no report file survived the
  prior owner session)** — two commits on develop `129beb18`: `1bc52bdf` (r3 review fixes) and
  `ed7130d9` (CTR-W02 title). Branch head `ed7130d9`. No battery numbers and no r4 re-review were
  recorded. Treat r3 as UNVERIFIED and UNREVIEWED.

## Resume 2026-11-23 (new owner: Fable ticket-owner, session `e255a3cd-5cdb-4dc4-83be-b58e80eb1057`)

- **Ticket thread:** still no comments. State Awaiting, labels DSE Plugin + Feature.
- **New base (dispatcher, 2026-11-23), supersedes the 129beb18 entry:** ~~rebase onto 129beb18~~
  superseded — dse develop is now `8c08bce2` (38 commits past `129beb18`: SC-434, SC-443 (1),
  SC-462, SC-641, SC-644, SC-671, SC-675, SC-679). Workspace origin/main `6df665fd` at resume (it
  moves with every dispatcher handoff commit; the pointer chore takes the sha current at that time).
- **Relay from the SC-671 owner (verbatim, via dispatcher, 2026-11-23):** "SC-442: if it lands
  after this, its `CTR-U01` known-bug marker for SC-671 must become a plain test. It has one
  conflict with this branch, a table row in `e2e/README.md`; keep both rows." SC-671 landed on
  develop at `d582e7ff` (ticket Done). Its ledger:
  `docs/superpowers/dse-overhaul/build-ledgers/sc671-counter-unknown-keys/`.
- **Numbers at `8c08bce2` (dse-verify CURRENT):** tsc and lint clean · jest 13944 passed / 2
  skipped in a fresh worktree · lifecycle 64/64 · e2e `668/673 ok, 0 failed, 5 known-bug,
  coverage: 418/418 pairs` · shots 592 · freeze 280/280 · parity 0/0/24.
- **Bug-ticket states (2026-11-23):** SC-671 Done (fixed on develop). SC-672 Awaiting (in flight in
  another effort, NOT on develop — its markers CTR-W01 / CTR-W02 stay known-bug here; whichever of
  SC-442 / SC-672 lands second handles the flip). SC-673, SC-674, SC-680 Backlog, labelled
  "Deferred from 7.0.0" — their markers stay.
- **New on develop that touches this surface:** SC-671 added `e2e/specs/counter/own-keys.e2e.ts`
  (CTR-O01..O04), `e2e/vaults/shipped/Counter/own-keys.md`, `test/dom/elements/counter-own-keys.test.ts`,
  and changed `src/elements/counter/model.ts`. No scenario-id collision with this branch (branch
  CTR ids: E, N, Q, S, T, U, V, W, X groups; CENSUS-18 / 19 still free on develop). SC-685 (Backlog):
  two identical counters that become identical again after a + trip the e2e "view registry
  collisions" check — cite, don't refile, if a twin test here meets it.
- **Owner rulings (2026-11-23):**
  - **CTR-U01 → plain test.** Remove its `knownBug('SC-671')` / `failsWith`; keep the assertion
    (after +, the note has the new value AND `note_to_self: keep me` and `extra: {a: 1}`, parsed
    values not key order). Update every comment / manifest note / README row that still calls it a
    known bug. Do not delete it as a duplicate of CTR-O01..O04 (the SC-671 owner asked for a plain
    test; the two were written independently).
  - **`e2e/README.md` conflict: keep both rows.**
  - **Matrix after SC-671:** if a `counter-matrix` test now fails because SC-671 changed what a
    write keeps, the test changes to match the fixed product ONLY where it had been written around
    B1 (unknown keys dropped). Anything else red is a finding — STOP, NEEDS_CONTEXT.
  - **Plan:** r6 implementer (fresh identity; the r1/r3 author's transcript is in a dead session)
    rebases onto `8c08bce2`, flips CTR-U01, runs the full battery. r7 = fresh reviewer, scoped to
    the r3 delta (`1aba5bc3..ed7130d9`), the rebase and the r6 delta. r8 = pointer chore
    (`sc442-brief-r5-chore-pointer.md`, renumbered).
- **r6 (2026-11-23)** — fresh orchestration:implementer (id af5d621bccd6b0d01) on
  `sc442-brief-r6-implementer-rebase.md`; report → `sc442-r6-implementer-report.md`. Rebase onto
  `8c08bce2`, CTR-U01 plain, full battery.
- **2026-11-23 — New base (dispatcher), supersedes the 8c08bce2 entry:** SC-672 landed. ~~rebase
  onto 8c08bce2~~ superseded — dse develop is now `957e4b11` (8 commits past `8c08bce2`: an empty
  or non-map Counter block shows an error card / is a counter at 0 instead of deleting text).
  Workspace origin/main `28ba594f`. Relay from the SC-672 owner (verbatim, via dispatcher):
  "SC-442 carries `knownBug('SC-672')` markers CTR-W01 and CTR-W02. They must become plain tests
  when it rebases over this, or its run fails." SC-672 ledger:
  `docs/superpowers/dse-overhaul/build-ledgers/sc672-counter-malformed-block/`.
  Dispatcher: "rebase onto 957e4b11 (and flip CTR-W01/W02) before reporting land-ready."
  **Numbers at `957e4b11` (dse-verify CURRENT):** jest 14013 passed / 2 skipped · lifecycle 64/64
  (G-S63 flaked once on part 3, passed on re-run; SC-689) · e2e `682/687 ok, 0 failed, 5 known-bug,
  coverage: 418/418 pairs` · shots 592 · freeze 280/280 · parity 0/0/24.
- **What SC-672 put on develop that meets this branch (owner survey, 2026-11-23):**
  `e2e/specs/counter/counter-wrong-block.e2e.ts` (CTR-W03..W16), new Counter fixtures including
  `e2e/vaults/shipped/Counter/empty-block.md` and `wrong-block.md` — **the same two file names this
  branch adds** (add/add conflicts) — plus `e2e/README.md` rows, `src/model/Counter.ts`,
  `test/dom/elements/counter-wrong-block.test.ts`, `test/unit/model/counter-wrong-block.test.ts`.
  No scenario-id collision (W01 / W02 were left to this branch).
- **Owner rulings (2026-11-23, second rebase):**
  - **CTR-W01 / CTR-W02 → plain tests.** Remove `knownBug('SC-672')` / `failsWith` from both. Keep
    each ruled assertion: W01 — the user's text is still in the note after the user tries a press
    (a card with no button is fine); W02 — the card never shows a raw JavaScript error. Keep the
    shared raw-JS-error check (r2 M-1) on both. Both must pass against the fixed product; if one
    does not, do not weaken it — STOP, NEEDS_CONTEXT. Do not delete them as duplicates of
    CTR-W03..W16.
  - **Fixture conflicts (`empty-block.md`, `wrong-block.md`): develop's copy wins, byte for byte**
    (SC-672's CTR-W03..W16 and its jest tests depend on them). Adapt this branch's tests to
    develop's content. If a test here needs content develop's file lacks, add a NEW fixture with a
    name that says what it is; never edit develop's two files.
  - **`e2e/README.md`: keep every row from both sides.**
  - **jsdom census `RENDERS` (r2 M-2):** `wrong-block` stays out of the list (an error card is not
    a counter surface). No change needed for `empty-block` unless a test goes red.
  - **Matrix / census tests red after SC-672:** change a test to match the fixed product ONLY where
    it had been written around B4 / B5 (non-map or empty block). Anything else red is a finding —
    STOP, NEEDS_CONTEXT.
  - Remaining markers after this round: SC-673 (e2e + jsdom `test.failing`), SC-674, SC-680 only.
  - The 8c08bce2 battery the r6 worker was finishing is superseded; the land-ready numbers are the
    full battery on the `957e4b11`-based head.
- **r6b (2026-11-23)** — same implementer (af5d621bccd6b0d01), extended by message with
  `sc442-brief-r6b-implementer-second-rebase.md` while it was finishing the `8c08bce2` battery (it
  had reached shots; branch then at `5a170bb2`, CTR-U01 already plain). Second rebase onto
  `957e4b11`, CTR-W01 / W02 plain, full battery again. The r7 reviewer brief
  (`sc442-brief-r7-reviewer-scoped.md`) is updated for the `957e4b11` base and the three flips.
- **r6 / r6b result (2026-11-23)** — DONE at dse `6d5a2caa` on develop `957e4b11` (8 commits; no
  `src/` change; tree clean; nothing pushed). tsc (incl. `tsc -p e2e`) and lint clean · jest
  14180 passed / 1 skipped (shots css cache present; comparable base 14014 / 1, +166) · lifecycle
  64/64 · e2e ×2 `704/713 ok, 0 failed, 9 known-bug, coverage: 428/428 pairs` · shots 592,
  host-leak 978 comparisons, modal 240, capture clip 147 · freeze 280/280 · parity 0/0/24.
  Remaining markers: CTR-V01 / CTR-V02 → SC-673, CTR-Q01 → SC-674, CTR-N01 → SC-680, jsdom `[K01]`
  `test.failing` → SC-673. CTR-U01, CTR-W01, CTR-W02 plain and green in both runs.
  Extra commit `6d5a2caa`: the jsdom census fixture scan in `test/dom/e2eCensus.test.ts` went red
  on 8 rows after SC-672 (its `wrong-list` / `wrong-number` / `wrong-tagged` / `adjacent-fences`
  fixtures landed in the scanned dir); now `wrong-*` fixtures go in the "whatever card it draws"
  row, `empty-block` joins the normal-card rows, and the fixture-body regex accepts an empty body.
  `counter-matrix` unchanged. `empty-block.md` / `wrong-block.md` were already byte-identical to
  develop's (no add/add conflict).
- **Owner ruling (2026-11-23) — README rows:** the worker dropped this branch's two
  `e2e/README.md` fixture rows for `Counter/wrong-block.md` and `Counter/empty-block.md` because
  develop (SC-672) already has a row for each file and the branch's wording described the pre-fix
  behavior. **Accepted** — one row per fixture file; "keep both rows" meant distinct rows. The r7
  reviewer checks the surviving rows are accurate for how CTR-W01 / W02 use the files.
- **r7 (2026-11-23)** — fresh orchestration:reviewer on `sc442-brief-r7-reviewer-scoped.md`;
  report → `sc442-r7-review-report.md`. Scoped to the r3 delta, the rebase, the three flips and
  the `6d5a2caa` census-scan change.
- **2026-11-23 — New base (dispatcher), supersedes the 957e4b11 entry:** SC-443 landed. ~~rebase
  onto 957e4b11~~ superseded — dse develop is now `758a8956` (12 commits past `957e4b11`: e2e Tier 3
  editor insert paths — e2e/specs, e2e manifest, CENSUS-30..34, 87 AUTH-* ids, e2e/README.md, plus
  12 added `data-dse-control` attribute lines in three `src/` files; SC-679's e2e patch applied).
  Workspace origin/main `3b66036b`. The SC-443 owner (verbatim, via dispatcher): "SC-442 (in
  flight): this branch adds `CENSUS-30..34` and 87 `AUTH-*` ids; none collides with its worktree as
  of `6d5a2caa`." Dispatcher: "Rebase onto 758a8956 before reporting land-ready (expect
  e2e/README.md and the e2e manifest/census to need merging; your e2e totals will add to SC-443's)."
  **Numbers at `758a8956` (dse-verify CURRENT):** jest 14271 passed / 2 skipped fresh (14272 / 1
  with the shots css cache) · lifecycle 64/64 · e2e `772/779 ok, 0 failed, 7 known-bug, coverage:
  466/466 pairs` · shots 592 · freeze 280/280 · parity 0/0/24. Expected on this branch after the
  rebase: coverage 476/476, known-bug 7 + 4 = 11, 0 failed (re-count).
  **Plan:** the r7 review keeps running on `6d5a2caa` (its subject — the r3 fixes and the three
  flips — does not depend on the base; rebasing under a running reviewer would break its gates).
  r8 = implementer (resume af5d621bccd6b0d01): any r7 fixes + rebase onto `758a8956` + full
  battery. r9 = the r7 reviewer resumed, scoped to the r8 delta (fixes + rebase range-diff).
  r10 = pointer chore.
- **r7 review result (2026-11-23)** — reviewer aa44e0c1e5c0dd875: **LAND-READY** at `6d5a2caa`
  (base `957e4b11`); 0 CRITICAL / 0 HIGH / 0 MEDIUM / 0 LOW / 5 INFO; no new product bugs; all 14
  checklist items pass. Probes: SC-672 undone → CTR-W01 / W02 red; raw-TypeError "fix" → both
  still red; friendly error card for the empty block → W02 green; SC-671 undone → CTR-U01 red;
  simulated SC-680 fix → CTR-N01 "appears fixed"; Enter commit broken → CTR-T06 / T01 red; rogue
  un-id'd button → 36 jsdom census rows + `[CENSUS-18]` + `[CENSUS-19]` red. Gates: tsc / lint rc 0;
  jest 14180 / 1 skipped; e2e `704/713 ok, 0 failed, 9 known-bug, 428/428` twice (one run in
  between red on SET-X03 / X04 = SC-657 flake, with the reviewer's probes running alongside).
  Report: `sc442-r7-review-report.md`. The rebase onto `758a8956` was not in its scope.
- **Owner rulings on r7 (2026-11-23)** — folded into r8:
  - **INFO-1 fold.** `test/dom/e2eCensus.test.ts` `wrong-*` row: make the title true — assert the
    error card (`data-dse-error-stage`) in that row, so the row says what it checks. SC-672 is
    fixed, so pinning the error card in a plain row is correct now.
  - **INFO-2 fold.** One-line comment stating the `wrong-*` naming convention the split relies on.
  - **INFO-3 drop:** only the first fence of a fixture is scanned — predates this delta, harmless
    today, not worth a ticket.
  - **INFO-4 fold.** `counter-bugs.e2e.ts` CTR-N01 comment: it records `counter.input` × type and
    × blur (declared pairs); only the wheel records nothing. Wording.
  - **INFO-5 drop:** `[CENSUS-18]` / `[CENSUS-19]` do not scan a sidebar-pinned counter — the
    sidebar host is out of scope by the 2026-11-15 surface ruling and the jsdom sidebar row covers it.
- **r8 (2026-11-23)** — implementer af5d621bccd6b0d01 resumed on
  `sc442-brief-r8-implementer-third-rebase.md`: INFO-1 / 2 / 4, rebase onto `758a8956`, full
  battery; report → `sc442-r8-implementer-report.md`.
- **r8 result (2026-11-23)** — DONE at dse `9be108c9` on develop `758a8956` (9 commits; `src/`
  diff empty; tree clean; nothing pushed; owner re-read every summary line from the logs).
  tsc (incl. `tsc -p e2e`) and lint clean · jest 14438 passed / 1 skipped (base 14272 / 1, +166) ·
  lifecycle 64/64, no re-run · e2e ×2 `794/805 ok, 0 failed, 11 known-bug, coverage: 476/476
  pairs` · shots 592, host-leak 978, modal 240, capture clip 147 · freeze 280/280 · parity 0/0/24.
  Known-bug 11 = develop's 7 (AUTH-G21 SC-688, AUTH-I27 SC-687, COND-C04 SC-257, COND-N04 SC-384,
  COND-N05 SC-355, SET-L02 SC-645, SET-L03 SC-647) + CTR-V01 / V02 (SC-673), CTR-Q01 (SC-674),
  CTR-N01 (SC-680); plus the jsdom `[K01]` `test.failing` (SC-673). r7 fixes INFO-1 / 2 / 4 in
  `9be108c9`; INFO-1's error-card assertion held for all four `wrong-*` fixtures.
  Conflicts: `e2e/README.md` merged clean (one row per Counter fixture);
  `test/dom/e2eCensus.test.ts` two additive conflicts (both sides' imports; SC-443's `describe`
  kept whole, then this branch's counter `describe`). Report: `sc442-r8-implementer-report.md`.
- **r9 + r10 (2026-11-23), in parallel** — r9: reviewer aa44e0c1e5c0dd875 resumed, scoped to the
  r8 delta (range-diff `6d5a2caa` → `9be108c9`, the `e2eCensus.test.ts` merge, the three INFO
  fixes); report → `sc442-r9-rereview-report.md`. r10: orchestration:chore on
  `sc442-brief-r5-chore-pointer.md` with DSE_HEAD `9be108c9`, WS_MAIN `8bfe75d0` (if r9 asks for a
  change, the pointer commit is redone, not stacked).
- **r10 pointer chore result (2026-11-23)** — DONE: superproject branch `sc442-e2e-counter-topup`
  at `215a2deb` = workspace origin/main `8bfe75d0` + ONE commit
  `chore: bump draw-steel-elements to 9be108c9 (SC-442: ds-counter e2e top-up)` (no trailers).
  `diff origin/main --stat` = `draw-steel-elements` only; status clean; no `+`/`-` in
  `submodule status`. Owner verified each of these directly.
- **r9 re-review result (2026-11-23)** — reviewer aa44e0c1e5c0dd875: **LAND-READY** at `9be108c9`
  (base `758a8956`); 0 findings; checks 1-5 PASS. Range-diff: commits 2-8 unchanged, commit 1
  differs only in where the counter code sits in `e2eCensus.test.ts` after SC-443's; commit 9 is
  the three INFO fixes. Census file vs `758a8956`: 0 lines removed, 141 added. Probe: SC-672
  undone → all 4 `wrong-*` rows red on the new `data-dse-error-stage` check. tsc rc 0; targeted
  jest 7 suites / 383 passed. Report: `sc442-r9-rereview-report.md`.
- **LAND-READY reported to the dispatcher (2026-11-23).** dse `9be108c9` on develop `758a8956`;
  superproject `215a2deb` on workspace origin/main `8bfe75d0` + one pointer bump. Result comment
  posted on SC-442 (state left Awaiting; no ask for Scott). After the landing: the owner flips the
  ticket to Done; the dispatcher preserves this ledger dir under `build-ledgers/` and notes for
  later fixers that CTR-V01 / V02 (SC-673), CTR-Q01 (SC-674), CTR-N01 (SC-680) and the jsdom `[K01]`
  `test.failing` (SC-673) must become plain tests when those bugs are fixed. No CHANGELOG entry
  (test-only, nothing user-facing).
