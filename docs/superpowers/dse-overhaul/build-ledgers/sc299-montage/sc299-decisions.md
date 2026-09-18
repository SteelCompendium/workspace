# SC-299 — DSE Montage Card refinements — decisions ledger

Ticket-owner: Fable, session 7694ddcf (dispatcher session). Worktree: `sc299-montage`
(`/home/scott/code/steelCompendium/worktrees/sc299-montage`), every submodule on branch
`sc299-montage`; dse cut from `origin/develop` `e12c6bd`.

## Ticket text (Scott, 2026-09-05, verbatim — the whole description; no comments yet)

> * quick-entry buttons in cells are missing
> * Unable to edit previous rounds (TODO)

## Provenance (owner reading, 2026-09-13)

- SC-191 shipped the montage board. Its settled mock (`draw-steel-elements/visual-harness/sc191/mock6.js:1841-1856`,
  CSS `round2.css:307-340`, narrow rule `:1750`) puts a PERSISTENT ✓ / ✕ / ringed-plus
  "quick" trio inside every empty cell of the round in play, plus the `to act` hint. Scott
  approved the round 4–6 screenshots carrying that trio. Slice 4's `BoardView.ts` wired only
  the sheet: the empty socket is one click target that opens `Log an action…`. The trio was
  dropped by a spec omission — same failure shape the SC-191 ledger recorded for the bottom
  bar (2026-09-03 ruling: "dropped by a spec omission, not by any Scott ruling"). That is
  ticket bullet 1.
- `BoardView.buildCell`: `isInteractive = entry !== undefined || state === 'current'` — an
  EMPTY cell in a PAST round is inert (face `— no action`), so a Director who forgot to log
  a hero's round-1 test cannot add it from the board. The sheet's own Round chips already
  allow any round `1..rounds`, so "Log an action…" + picking the round works today; the
  board cell does not. That is ticket bullet 2.

## Owner rulings (scope; no Scott ruling exists on these yet — thin ticket, Scott asleep)

- R-1 (2026-09-13): bullet 1 = implement the mock's open-socket quick trio faithfully
  (mock6.js + round2.css as the design source; `kit/iconButton` for the three buttons per
  the SC-191 "every button" rule). One tap records `{hero, round, result}` with no skill and
  no note; tapping the socket itself still opens the sheet.
- R-2 (2026-09-13): bullet 2 = an empty PAST-round cell becomes an edit target: it opens the
  sheet in `new` mode pre-filled `{hero, round}`. It keeps the `— no action` face (no quick
  trio there — the trio is the round-in-play affordance in the mock) and gains the same
  writable-host-only editmark the recorded cells carry, with a `plus` glyph instead of the
  pencil. FUTURE-round empty cells stay inert (ticket says "previous rounds").
- R-3 (2026-09-13): frozen print bytes must not move. The trio and the new editmark hide
  under print the way `.dse-mt__cell-editmark` already does
  (`styles-source.css:5060`). If any of the 16 `montage-*--steel-{print,realprint}` lines
  move anyway, the worker stops and reports — no rebaseline is shipped without an owner
  ruling and Scott's sanction.
- R-4 (2026-09-13): Scott will be asked, in one batched comment with screenshots, to
  confirm R-1/R-2 (Needs Review) once the branch is land-ready — he is not blocked on
  the work and the work is not blocked on him.

## Round log

- Round 1 (impl, `orchestration:implementer`): brief `sc299-round1-brief.md`.
- Round 1 DONE 2026-09-13 (worker died at a rate limit AFTER writing its report; nothing
  lost). dse `1762555` (code 8cff4ff, css c94a979, tests df69b9e, docs 1762555), ws
  `cf5f7da`. Gates: tsc/lint clean; jest 3844 passed / 1 skipped / 201 suites; shots
  host-copy pin OK, button host-leak OK (114 kinds); freeze 260/260; parity 0/0/16.
  Owner eyeballed `evidence/sc299-r1-montage-mid--steel-dark.png` (trio faithful to
  mock6) and the past-empty hover crop (faint plus, top-left) — accepted.
- Follow-up ruling (2026-09-17): "host-leak kind count 111 → 114" — **dropped**; dse-verify
  already says kind counts drift and are "expect right now". No ticket.
- Note: `origin/develop` moved to `96e2238` (SC-196 landed; touches styles-source.css +
  CHANGELOG.md). Plan: review at 1762555 first, then ONE implementer round = rebase onto
  96e2238 + review fixes, then scoped re-review.
- Review 1 (`orchestration:reviewer`): brief `sc299-review1-brief.md`, dispatched 2026-09-17.
- Review 1 DONE 2026-09-17 (`sc299-review1-report.md`): 0 HIGH / 2 MED / 4 LOW / 9 INFO;
  gates reproduce round 1 exactly; 12/12 probes PASS. Owner rulings:
  - MED-1 (trio ignores the coarse-pointer 44px touch minimum) — **fold into round 2**.
  - MED-2 (real `<button>`s nested inside the cell's `div[role=button]`; ARIA prunes them)
    — **fold into round 2** with the reviewer's fix: the EMPTY CURRENT-round cell drops
    `role`/`tabindex` (and its keydown handler); the pointer click on the cell surface
    outside the trio still opens the sheet; the keyboard path to that same sheet is the
    row's "Log an action for <hero>" button + the bar. No visible change. Scott is told
    in the land-ready comment.
  - LOW-1, LOW-2 (comment accuracy), LOW-3 (docs: complete-montage exception),
    LOW-4 (read-only trio keeps its tint at opacity .5 — disabled must read muted) —
    **fold into round 2**.
  - INFO-5 (add the trio ground/ink pair to `lightContrast.test.ts`; re-take mid-light
    after rebase) and INFO-8 (ws CHANGELOG blank line) — **fold into round 2**.
  - INFO-4 (hover cascade knowingly better than mock) — **accepted as-is**; implementer
    adds one comment line naming the divergence (fold, trivial).
  - INFO-2 (harness prints `OBSIDIAN APP.CSS PIN DRIFT` 1.13.7 → installed 1.14.2) —
    not SC-299's; a pin bump is its own sanctioned-rebaseline event (dse-verify). Ticket
    check below.
  - INFO-1/3/6/7/9 — informational, **dropped** (no action implied).
- Round 2 (`orchestration:implementer`, fresh identity): rebase onto 96e2238 + all folds.
  Brief `sc299-round2-brief.md`.
- INFO-2 ruling (2026-09-17): **dropped — already tracked as SC-287** ("Obsidian camera:
  pin the Obsidian version instead of tolerating self-update drift", Backlog). No new ticket.
- Round 2 dispatched 2026-09-17 (fresh `orchestration:implementer`). Re-review plan: resume
  the review-1 reviewer (author-independent; its findings context is fresh) for a scoped
  delta re-review of `1762555..<r2 head>` only.
- 2026-09-18: round-2 worker died at the API session limit mid-battery (after rebase +
  fixes, before commit/report). State found: dse rebased on 96e2238 (head b5cb7d9), fix
  edits uncommitted in 5 files, ws CHANGELOG modified, 3 gate logs stray in the worktree
  superproject root (jest post-fix: 3881 passed / 1 skipped / 202 suites — green). Worker
  RESUMED via SendMessage (transcript intact) with instructions: move stray logs to the
  ledger dir, finish shots/freeze/parity, commit, report. No work redone.
- Round 2 DONE 2026-09-18 (`sc299-round2-report.md`): rebased on 96e2238 (0 conflicts);
  dse `9ddadb5` (5 fix commits on top of the 4 replayed), ws `69b8002`. Gates: tsc/lint
  clean; jest 3881 passed / 1 skipped / 202 suites; shots 0 FAIL, host-leak 114 kinds;
  freeze 260/260 (16 montage print lines unmoved); parity 0/0/16. Two documented
  deviations for the re-reviewer to judge: LOW-3 literal wording; INFO-5 danger icon not
  pinned in lightContrast. (Correction to the entry above: the worker reports it was never
  actually killed — the harness notification was spurious; the resume message was harmless.)
- Re-review 1: review-1 reviewer resumed 2026-09-18 with `sc299-rereview1-resume.md`.
- 2026-09-18 dispatcher notice: dse `origin/develop` → `5a5ed49` (SC-126, parity harness
  only; expected numbers unchanged: freeze 260/260, parity 0/0/16), ws `origin/main` →
  `8685b65`. Round 3 = rebase both + any re-review fixes, full battery. Brief
  `sc299-round3-brief.md` (drafted; dispatch after re-review 1 returns — the reviewer is
  measuring the worktree now and a rebase under it would falsify its probes).
- Re-review 1 DONE 2026-09-18 (`sc299-rereview1-report.md`): 9/9 review-1 findings
  VERIFIED-FIXED; LOW-3 wording deviation and INFO-5 single-pin deviation ACCEPTED by the
  reviewer. NEW: HIGH-1 (coarse-pointer trio overflows its grid cell; elementFromPoint on a
  neighbouring recorded cell returns a quick button → wrong-round write), LOW-1 (aria-label
  on the now role-less cell), LOW-2 (lightContrast pin hard-codes ground `#eaeeef`),
  2 INFO. Owner rulings:
  - HIGH-1 — **fold into round 3.** Fix = BOTH the reviewer's verified containment
    (`max-width: 100%` + `flex-wrap: wrap` on `.dse-mt__cell-quick` inside the coarse
    block) AND the one-row preference (`minmax(var(--dse-mt-colmin, 5.2em), 1fr)` with
    `--dse-mt-colmin: 9.2em` under coarse — one `setProperty`, seam rule holds), so the
    trio stays on one row when there is room and wraps instead of spilling when there is
    not. Guard = a jest CSS-contract test PLUS a real-Chromium in-run gate in
    `visual-harness/shoot.mjs` under `pointer: coarse` emulation (the
    `assertMontageTrackWidths` pattern): every `.dse-mt__quick` box is contained by its
    own `.dse-mt__cell` box, and `elementFromPoint` 6px inside a recorded cell's right
    edge returns that cell — at 560/700/900 px panes with the `mid` fixture and with the
    track list rewritten to 4, 5 and 8 rounds.
  - LOW-1 — **fold**: drop the `aria-label` from the role-less empty current-round cell
    (its three buttons name every action; the row button reaches the sheet). No `title`.
  - LOW-2 — **fold**: `ground: lightValue('chip-bg')` (or add the pair to FILL_INK).
  - INFO (to-act wraps at 300px coarse; read-only empty current cell fully inert, I-6 met
    by the three disabled buttons) — **ratified, no action.**
- Round 3 (fresh `orchestration:implementer`): rebase (5a5ed49 / 8685b65) + HIGH-1, LOW-1,
  LOW-2. Then re-review 2 = scoped, by the same reviewer.
- Round 3 DONE 2026-09-18 (`sc299-round3-report.md`): dse rebased on `5a5ed49`, ws on
  `8685b65` (CHANGELOG + gitlink conflicts resolved, both sides kept, pointer → rebased
  dse). Fixes: HIGH-1 both halves + new shoot.mjs in-run gate `assertMontageCoarseContainment`
  (6 configurations OK), LOW-1, LOW-2. dse `b2e40d1` (replayed head before fixes `6e5f35c`),
  ws `f229603`. Gates: tsc/lint clean; jest 3902 passed / 1 skipped / 202 suites; shots 524
  PNGs 0 FAIL; freeze 260/260; parity 0/0/16, bg-color 0 rows.
- Follow-up ruling (2026-09-18): board clips (overflow:hidden) at high round counts, worse
  under coarse after the 9.2em column minimum — **Backlog ticket SC-326 filed, linked to
  SC-299.** Out of scope for any SC-299 round.
- Worktree superproject shows ` M steel-etl / steelCompendium.github.io / v2` — checkouts
  lag the rebased pins (nothing of ours). Chore dispatched to `git submodule update` those
  three only; dse untouched.
- Re-review 2: review-1 reviewer resumed with `sc299-rereview2-resume.md`.
- Chore DONE 2026-09-18: steel-etl/v2/gh.io checkouts aligned to pins; superproject clean.
- Re-review 2 DONE 2026-09-18 (`sc299-rereview2-report.md`): HIGH-1, LOW-1, LOW-2
  VERIFIED-FIXED (24 coarse configurations, 0 violations; gate can-fail PROVEN, exit 1 with
  the review-1 numbers to 0.05px). Gates reproduce round 3. NEW (harness-only): MED-1
  (gate's elementFromPoint is viewport-relative; a null hit is printed as WRONG-WRITE; a
  taller board turns shots red on a healthy tree), LOW-1 (CSS comment at ~3862 claims the
  trio stays on ONE row under coarse — measured: two rows at every coarse configuration;
  9.2em buys 3→2 rows), INFO (i) measure the union of `.dse-mt__quick` boxes not the
  capped container, (ii) gate navigates without `sheet=1`, numbers identical, doc line.
  Owner rulings: MED-1 **fold** (viewport 2400 + classify null hits as
  `PROBE POINT OFF-SCREEN — not a wrong-write`, loud, own counter); LOW-1 **fold, option
  (a)** — correct the comment; NOT raising to 10.4em (worsens SC-326). ~~ledger line
  "stays on one row when there is room"~~ superseded: under coarse the trio wraps to two
  rows; 9.2em only prevents three. INFO (i),(ii) **fold** (touching the gate anyway).
  SC-326 onset data (9.2em moves clipping onset 8→5 rounds) noted on that ticket by owner.
- Scott ask posted 2026-09-18 with the plugin behaviour final (harness-only round 4 in
  flight); In Progress + Needs Review.
- Round 4 (fresh `orchestration:implementer`): brief `sc299-round4-brief.md`. Then
  re-review 3 scoped to the shoot.mjs delta by the same reviewer.
- Round 4 DONE 2026-09-18 (`sc299-round4-report.md`): dse `d124cc3` (gate 781c579 +
  comment d124cc3) on 5a5ed49; ws `bf4f2c3`. Gates unchanged: jest 3902; shots 524/0 FAIL;
  freeze 260/260; parity 0/0/16. Can-fail: (b) all-three-removed → exit 1 with CONTAINMENT
  (container + buttons) + WRONG-WRITE, zero `hit null`; (a) colmin-only removed → exit 0
  (was exit 1 before MED-1's fix purely because of the off-screen probe). Owner ruling:
  **accepted** — a 3-row trio that neither overflows nor mis-hits is not a correctness
  regression; `--dse-mt-colmin` is pinned by the jest CSS-contract test; no row-count
  invariant added (row count vs clipping is SC-326's question).
- Re-review 3 (scoped, same reviewer): `sc299-rereview3-resume.md`.
- Re-review 3 DONE 2026-09-18 (`sc299-rereview3-report.md`): **LAND-READY.** MED-1, LOW-1,
  INFO-1, INFO-2 VERIFIED-FIXED with five can-fail injections (a–d + base); CSS delta
  proven comment-only (comment-stripped files byte-identical). Gates at dse `d124cc3` /
  ws `bf4f2c3`: tsc/lint clean; jest 3902 passed / 1 skipped / 202 suites; shots 0 FAIL
  (containment gate OK, host-copy pin OK, host-leak 114 kinds); freeze 260/260; parity
  0/0/16. No rebaseline lines. Reviewer's incidental: `sidebarEncounterHandoff.test.ts:412`
  real-time 400ms debounce wait flakes under load (8.99) — **Backlog ticket filed, linked
  to SC-299**; not this branch's.
- LAND-READY reported to the dispatcher 2026-09-18. Scott ask still open (Needs Review).
