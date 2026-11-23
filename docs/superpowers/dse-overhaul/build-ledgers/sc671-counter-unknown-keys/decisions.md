# SC-671 decisions ledger — counter: any write deletes YAML keys the counter does not know

Owner: ticket-owner (Fable 5.2), session `5812b474-3aec-46a6-8f06-0ef85cf1e10a`.
Worktree `/home/scott/code/steelCompendium/worktrees/sc671-counter-unknown-keys` (branch
`sc671-counter-unknown-keys` in every submodule), cut 2026-11-20 from dse `develop` `129beb18`,
superproject `3a517cdf` (= workspace origin/main at cut).

## Ticket (as filed by Scott from the SC-442 e2e rollout, 2026-11-15)

Pressing − or + on a `ds-counter` rewrites the block with only `max_value`, `current_value`,
`min_value` and `name`. Any other key the user wrote is deleted from the note. Montage (SC-625) and
negotiation (SC-637) had the same bug and now keep unknown keys.

Repro: a counter block that also holds `note_to_self: keep me` and `extra: {a: 1}`. Press +. Both
keys are gone from the note.

Agent notes from the ticket: `src/elements/counter/model.ts:43-44` (`serialize` writes only the
`Counter` instance); `src/model/Counter.ts:41-52` (`parse` copies six named fields and drops the
rest); SC-652 keeps `prefs:` and `collapsed:` only; fixture `e2e/vaults/shipped/Counter/unknown-keys.md`
and the e2e `knownBug` marker citing this ticket are on the SC-442 branch (NOT on develop).

## Scott's rulings

(none yet)

## Owner rulings

- 2026-11-20 — **Not dependent on SC-599.** (Same ruling as SC-625 / SC-637.) SC-599 (parked on
  Scott) is about comments / quote style / flow formatting of the whole-block rewrite. SC-671 is
  about key/value data the parser throws away; it is fixed inside the existing parse -> model ->
  `stringifyYaml` path. Do NOT introduce source-text-preserving editing, the `yaml` Document API,
  or anything that decides SC-599's question. Unknown values are preserved by VALUE; their
  formatting follows whatever the existing serializer does today (`extra: {a: 1}` may come back as
  a block map).
- 2026-11-20 — **Placement:** known keys keep the existing fixed order (`max_value`,
  `current_value`, `min_value`, `name`, `value_height`, `name_height`, `_dse_anchor`); unknown keys
  go after ALL the known ones (after `_dse_anchor` too, as montage and negotiation do), in their
  original relative order. A key that looks like an integer is written first (JS object key
  order) — document it, do not restructure to fix it (SC-625 precedent).
- 2026-11-20 — **"Known" means every key the counter READS:** `max_value`, `current_value`,
  `min_value`, `name`, `value_height`, `name_height`, `_dse_anchor`, plus any alias the parser or
  view turns out to read. A known key is never carried as "unknown", whatever its value (a
  wrong-typed or falsy known value keeps today's behaviour exactly — that is SC-672 / SC-673).
  The framework-reserved wrapper keys (`prefs`, `collapsed`, `collapsible`, `collapse_default`)
  are the pipeline's (SC-652) and must be written once, where they are written today — never
  twice, never moved.
- 2026-11-20 — **SC-482 stays intact.** A key the source did not declare and the user did not
  change is still not added on write (`min_value: 0`, `value_height: 3`, `name_height: 1`,
  `current_value: 0`). A block with no unknown keys must serialize byte-identically to develop
  `129beb18`.
- 2026-11-20 — **Every write path keeps the unknown keys:** −, +, a typed value (click-to-edit
  box, Enter / blur / arrow keys), any reset, the pinned sidebar card (which adds `_dse_anchor`),
  a write after an outside-edit refresh, and the block edit form if the counter has one. A path
  that builds a NEW `Counter` (clone, re-parse) must not lose them.
- 2026-11-20 — **No YAML key may shadow a field or the prototype.** `__proto__`, `constructor`,
  `toString`, `hasOwnProperty`, `toJSON` as user keys: no prototype pollution, no crash, value
  written back. Where the extras live (own props as montage, or a module-private WeakMap as
  negotiation and `undeclaredDefaults.ts`) is the implementer's call, with the reason stated.
- 2026-11-20 — **Scope is `ds-counter` (`ds-ct`) only.** Do not change montage or negotiation
  code. Reusing an existing generic helper is fine; extracting one out of landed montage /
  negotiation code is not. Out of scope, do not fix: SC-672 (non-map block overwritten, empty
  block raw TypeError), SC-673 (out-of-range values), SC-674, SC-680 (wheel), SC-599. Other
  elements that drop unknown keys the same way are reported as Follow-ups, not fixed.
- 2026-11-20 — **SC-442 overlap (unlanded; its branch head `ed7130d9` sits on `129beb18`, test-only).**
  SC-442 adds `e2e/vaults/shipped/Counter/unknown-keys.md`, `e2e/specs/counter/counter-bugs.e2e.ts`
  (`knownBug('SC-671', '[CTR-U01] …')`), `counter-steppers.e2e.ts`, `counter-typed.e2e.ts`,
  `test/dom/elements/counter-matrix.test.ts`, and edits `e2e/manifest/counter.ts`,
  `e2e/specs/_census.e2e.ts`, `test/dom/e2eCensus.test.ts`, `e2e/README.md`. To keep the two
  branches mergeable in either landing order, SC-671 r1: uses NEW files with names SC-442 does
  not use (no `unknown-keys.md` fixture, no `counter-bugs` / `counter-steppers` / `counter-typed`
  / `counter-matrix` file names), takes no scenario id SC-442 holds (CTR-E01..E05, F01, F02, K01,
  L01..L05, N01, Q01, S01..S04, T01..T06, U01, V01..V03, W01, W02, X01), and keeps edits to the
  shared files above to the minimum the gates force. Whichever of the two lands second flips the
  CTR-U01 marker to a plain test in its rebase round. Told to the dispatcher at spawn + land-ready.
- 2026-11-20 — **No lifecycle scenario expected.** If a worker shows a lifecycle-only path, the
  free id is `G-S146`.

## Baseline (dse-verify CURRENT @ `129beb18`, numbers as reported by the SC-662 owner)

tsc and lint clean · jest 13703 passed / 1 skipped with the shots cache (fresh worktree: 13702 / 2)
· lifecycle 64/64 · e2e `658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs` · shots 592,
host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.

## Rounds

- 2026-11-20 — Ticket moved Backlog -> Awaiting (labels unchanged: DSE Plugin, Bug). Worktree created.
- r1 implementer (orchestration:implementer, agent a8f4a90211885b55d) — brief
  `sc671-r1-implementer-brief.md`, report `sc671-r1-implementer-report.md`. Dispatched 2026-11-20 on
  dse `129beb18`.
  r1 result (2026-11-20): DONE_WITH_CONCERNS. dse `846ac57d` on `129beb18` (commits `0aa9aff8` fix + unit,
  `d2e3af2a` jsdom, `37440c9c` e2e + one `e2e/README.md` row, `846ac57d` wrapperDefaultKeys test source: three
  counter cases started from `title: Deaths`, an unknown key now kept — SC-637 precedent); superproject CHANGELOG
  `cf802c44` on `3a517cdf`, no pointer bump. Design: extras in a module-private WeakMap in
  `src/elements/counter/model.ts` (`Counter.ts` unchanged), written after all known keys incl. `_dse_anchor`.
  Counter has no reset, no schema form. jest 13731 / 2 fresh (+29: 15 unit, 14 jsdom), e2e `662/671 ok, 0 failed,
  9 known-bug, coverage: 418/418 pairs` (+4: CTR-O01..O04, no new pair), lifecycle 63/64 union — G-S61 red on its
  torn-read line (0 stale frames) three times on the branch and once on a clean `129beb18` build; G-S59 timed out
  once at load ~17, green on re-run. styles.css `18730938…f1f9` = clean `129beb18` build, so shots / freeze /
  parity carry. Shared-with-SC-442 files touched: `e2e/README.md` (one row) only.
- 2026-11-20 — r1 follow-ups ruled:
  - **G-S61 torn-read red — DROP, already filed: SC-668** ("G-S61 fails on a loaded host because the recorder's disk
    read is torn 3 or more frames in a row", Backlog; SC-652 / SC-656 / SC-662 owners saw the same on base). Accepted
    as 63/64 ONLY with that exact torn-read line and 0 stale frames; the reviewer re-runs it. Any other G-S61
    assertion is real (it drives two counters).
  - **Other persisted elements may drop unknown keys — PENDING a bounded model-level probe** (r2 brief item 12);
    file one Backlog sweep ticket from its table. No existing ticket (searched 2026-11-20).
  - **r1's scratch worktree `…/scratchpad/sc671-r1-impl/base-129` stays registered** in the plugin clone — tell the
    dispatcher at land-ready (do not rm).
  - **Tag `7.0.0-rc.1` exists on dse origin at `129beb18`** (seen via `git ls-remote --tags origin`; fetched by r1,
    not created by any SC-671 worker). Not this ticket's; reported to the dispatcher as a fact.
  - **SKILL proposals** (for the dispatcher at landing): the Bash tool on this host backgrounds a call after about
    120 s, not 180 s (poll with `timeout 100 tail --pid`).
- r2 independent review (orchestration:reviewer) — brief `sc671-r2-reviewer-brief.md`, report
  `sc671-r2-review-report.md`. Dispatched 2026-11-20 on dse `846ac57d`.

## Baseline moves

- 2026-11-20 (dispatcher) — **SC-675 landed** (block inserts via new `src/authoring/blockInsert.ts`; CHANGELOG
  bullet added). dse `origin/develop` `129beb18` -> `3b47e55b`; workspace origin/main -> `49ac1c10`. Dispatcher:
  "Rebase your dse branch onto 3b47e55b before reporting land-ready. The landing skill emitted no new battery
  baselines; SC-675 reported jest 13855 passed / 2 skipped, e2e 658/667 ok, 9 known-bug, 418/418 pairs, lifecycle
  63/64 (G-S61 torn-read line, same on base = SC-668)."
  Plan: r2 (running on `846ac57d` over `129beb18`) finishes as dispatched — SC-675 is authoring-side, the SC-671
  diff is counter model + tests. The fix round (r3) rebases dse onto `3b47e55b` and the superproject onto current
  workspace origin/main (CHANGELOG conflict expected: both add a bullet under `## Unreleased`), ONE pointer bump,
  full battery. **Expected on the rebased head:** jest 13884 passed / 2 skipped fresh (13855 + 29) · lifecycle
  63/64 (G-S61 torn-read = SC-668 only) · e2e `662/671 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs` ·
  styles.css identical to a clean `3b47e55b` build. Then a scoped re-review of the delta (or owner range-diff
  check if every commit is patch-identical and r2 had no findings — SC-637 precedent).

## Resume 2026-11-22 (new owner session; dispatcher session `e255a3cd-5cdb-4dc4-83be-b58e80eb1057`)

- State found: dse branch still `846ac57d` on `129beb18` (the checkpoint rebase never ran); superproject `cf802c44`
  on `3a517cdf`, pointer unstaged. **r2 review left NO report** (killed by the usage limit); its scratch dir and r1's
  are gone (/tmp cleared) — the two scratch worktrees (`…/5812b474…/sc671-r1-impl/base-129`,
  `…/sc671-r2-review/dse-probe`) are still registered in the worktree's plugin clone as `prunable`. Ticket: no
  comments, state Awaiting, labels DSE Plugin + Bug. No Scott ruling.
- **Baseline moved again:** SC-434 landed 2026-11-22 (CI workflow + `e2e/README.md` only). dse `origin/develop` =
  `f42546b8`; workspace origin/main = `02cd6d6a`. dse-verify CURRENT paragraph is still the `129beb18` one.
  Rebase target is `f42546b8` / `02cd6d6a` (supersedes ~~`3b47e55b`~~).
- **Order changed:** rebase FIRST (r3, implementer), then the full independent review on the rebased head (r4,
  reviewer, the r2 brief re-issued with the new shas). No review of `846ac57d` exists, so there is nothing to carry.
- Expected on the rebased head (SC-675's reported numbers + this branch's 29 jest / 4 e2e; SC-434 adds no test):
  jest 13884 passed / 2 skipped fresh · lifecycle 64/64, or 63/64 with ONLY G-S61's torn-read line (SC-668) · e2e
  `662/671 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs` · styles.css identical to a clean `f42546b8` build.
- r3 rebase round (orchestration:implementer) — brief `sc671-r3-rebase-brief.md`, report `sc671-r3-rebase-report.md`.
- 2026-11-22 (dispatcher) — "SC-434 landed — dse origin/develop is now f42546b8 (was 3b47e55b; CI-only:
  .github/workflows/plugin-ci.yml + e2e/README.md, no TS/CSS). Workspace origin/main fab96290. No new battery
  baselines emitted. Rebase onto f42546b8 before reporting land-ready." Already the r3 target; workspace origin/main
  is now `fab96290` (r3 brief says `02cd6d6a` "or what is there" — r3 takes the newer one; verify at return).
- 2026-11-22 (dispatcher) — "SC-641 landed — dse origin/develop is now bdf0255e (was f42546b8; ds-negotiation
  missing-Interest defaults + Reset fallback). Workspace origin/main 8e7a7bbe (CHANGELOG.md gained an SC-641 bullet
  under Unreleased). New dse-verify CURRENT @ bdf0255e: jest 13861/2 fresh, lifecycle 64/64, e2e 660/667 ok, 0 failed,
  7 known-bug, 418/418 pairs; shots 592 / freeze 280/280 / parity 0/0/24. Rebase onto bdf0255e before reporting
  land-ready."
  **Rebase target is now `bdf0255e` / `8e7a7bbe`** (supersedes ~~`f42546b8` / `02cd6d6a` / `fab96290`~~). r3 told
  mid-run by SendMessage. **Expected on the rebased head:** jest 13890 passed / 2 skipped fresh (13861 + 29) ·
  lifecycle 64/64 (63/64 only with G-S61's torn-read line, SC-668) · e2e `664/671 ok, 0 failed, 7 known-bug,
  coverage: 418/418 pairs` (660 + 4) · styles.css identical to a clean `bdf0255e` build.
- r3 result (2026-11-23): DONE. dse `16cbd05f` on `bdf0255e` (commits `3b228d60`, `b790e93c`, `518dc383`, `16cbd05f`;
  range-diff vs the r1 commits: four `=`, no conflict). Superproject `cfd52772` (pointer bump) on `cd79d841`
  (CHANGELOG, SC-671 bullet first under Unreleased) on `8e7a7bbe`; clean; no attribution trailers (owner-verified).
  Gates on `16cbd05f`: tsc 0, lint 0, jest 13890 passed / 2 skipped fresh, lifecycle 64/64 (G-S61 green), e2e
  `664/671 ok, 0 failed, 7 known-bug, coverage: 418/418 pairs`, styles.css `18730938…f1f9` = clean `bdf0255e` build
  (shots / freeze / parity carry). Logs: `…/e255a3cd…/scratchpad/sc671-r3-rebase/r3b-*.log`.
  Open: workspace origin/main moved to `565a35c1` (docs only) — superproject needs one more plain rebase before
  land-ready. r3 left scratch worktree `…/sc671-r3-rebase/base-bdf0` registered.
- r4 independent review (orchestration:reviewer) — brief `sc671-r4-reviewer-brief.md`, report
  `sc671-r4-review-report.md`. Dispatched 2026-11-23 on dse `16cbd05f`. Gate re-run scoped to tsc, lint, full jest,
  lifecycle part 4, full e2e (r3 measured the full battery on the same head).
- r4 result (2026-11-23): **LAND-READY, 0 critical / 0 high / 0 medium / 3 low / 5 info** on dse `16cbd05f`. All eight
  owner rulings hold. Reviewer's own gates: tsc 0, lint 0, jest 13890 / 2, lifecycle part 4 4/4 (G-S61 green), e2e
  `664/671 ok, 0 failed, 7 known-bug, 418/418 pairs`, styles.css = clean base. Probes 109/109 jsdom + real-Obsidian
  R4A/R4C/R4D green; mutation: 25 of 29 new jest tests fail on base (4 are no-change guards), CTR-O01 fails on base,
  mutants M1-M6 caught, M7 output-identical. SC-442 cross-check: merges with ONE conflict (`e2e/README.md`, a row
  added on each side, keep both); only CTR-U01 changes outcome ("known bug SC-671 appears fixed") and is green as a
  plain test; no duplicate ids, no census clash.
- 2026-11-23 — r4 findings ruled (owner):
  - **LOW-1** (no test for "a block of only unknown keys returns to itself after + then −") — **FOLD into r5.**
  - **LOW-2** (`KNOWN_KEYS` is a hand copy; a forgotten future field would have its stale source value written over
    the live value) — **FOLD into r5:** serialize drops any extra whose key the model owns, plus a test that fails
    when a Counter field is missing from `KNOWN_KEYS`.
  - **LOW-3** (CHANGELOG says extra keys follow the counter's own keys; a number-like key goes first) — **FOLD into
    r5:** one clause.
  - **INFO-1** (README conflict with SC-442) — no action here; told to the dispatcher at land-ready.
  - **INFO-2** (YAML reader rewrites numbers on any write, every element: big integers lose digits, `1.0` -> `1`,
    `0x1F` -> `31`) — **no new ticket: same cause and same fix as SC-599**; posted as a note on SC-599 (2026-11-23).
  - **INFO-3** (the new jsdom harness never calls `host.setMountedBody`, so its outside-edit-during-debounce case
    runs a path production does not) — **FOLD into r5**, bounded (harness seed + the expectations that follow).
  - **INFO-4** (jest `stringifyYaml` mock and the e2e driver's js-yaml parse differ from Obsidian on null, aliases,
    `<<`) — **DROP as a ticket:** no test depends on those bytes; the guard is the reviewer's proposed dse-verify
    note ("assert merge keys, nulls and aliases on the note TEXT"), passed to the dispatcher with the SKILL proposals.
  - **INFO-5** (two identical counters made identical again by a + trip the e2e `view registry collisions` check;
    same on `bdf0255e`) — **FILED: SC-685** (Backlog, related to SC-671). Out of scope here.
  - **Item 12 / r1 follow-up** (stamina-bar and project drop unknown keys on write) — **FILED: SC-684** (Backlog,
    related to SC-671). Out of scope here. The four closed-schema elements are noted in it, not ticketed.
- SKILL proposals for the dispatcher at landing (dse-verify): the three lines under "Proposed SKILL.md text" in
  `sc671-r4-review-report.md` (setMountedBody in jsdom write tests; js-yaml vs Obsidian yaml in `expectNoteBlock`
  and the jest mock; Bash backgrounds at about 120 s).
- r5 fix round (orchestration:implementer, the r3 worker resumed) — brief `sc671-r5-fix-brief.md`, report
  `sc671-r5-fix-report.md`. Then a scoped re-review of the delta by the r4 reviewer (not the fixer).
- 2026-11-23 (dispatcher) — "SC-644 landed — dse origin/develop is now fefd9029 (was bdf0255e; 8 commits: settings
  "Collapsible by default" / "Start collapsed" / "Show edit button" reach already-open blocks). Workspace origin/main
  b79eef2b (CHANGELOG.md gained an SC-644 bullet). New dse-verify CURRENT @ fefd9029: jest 13902/2 fresh (13903/1
  with shots cache), lifecycle 64/64, e2e 664/669 ok, 0 failed, 5 known-bug, 418/418 pairs; shots 592 / freeze
  280/280 / parity 0/0/24. Rebase onto fefd9029 before reporting land-ready."
  **Rebase target is now `fefd9029` / `b79eef2b`** (supersedes ~~`bdf0255e` / `8e7a7bbe` / `565a35c1`~~). r5 told
  mid-run by SendMessage. **Expected on the r5 head:** jest 13931 + N passed / 2 skipped fresh (13902 + 29 + N new)
  · lifecycle 64/64 · e2e `668/673 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs` (664 + 4 / 669 + 4) ·
  styles.css identical to a clean `fefd9029` build.
- r5 result (2026-11-23): DONE. dse `d582e7ff` on `fefd9029` (rebased four: `bb6c396b`, `62d98ba0`, `94bfd181`,
  `f11459e9`, range-diff vs `bdf0255e..16cbd05f` four `=`; r5 commits `682b4b66` LOW-2, `d582e7ff` LOW-1 + INFO-3;
  delta 4 files +86/-4, `src/` change = `KNOWN_KEYS` exported + the own-key filter in `serialize`). Superproject
  `06e1f3e4` (ONE pointer bump) on `358b7fb0` (LOW-3 clause) on `7b5eddbd` (CHANGELOG) on `334058e2` (= origin/main
  at verify time, docs-only child of `b79eef2b`); clean; no attribution trailers (owner-verified). N = 5 new tests
  (2 unit, 3 wrapperDefaultKeys); INFO-3 seeding left all 14 own-keys tests green, none rewritten.
  Gates on `d582e7ff`: tsc 0, lint 0, jest 13936 passed / 2 skipped fresh, lifecycle 64/64 (G-S61 green), e2e
  `668/673 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs`, styles.css `18730938…f1f9` = clean `fefd9029` build.
  Logs: `…/e255a3cd…/scratchpad/sc671-r5-fix/r5-*.log`. Scratch worktree `base-fefd` left registered.
- r6 scoped re-review (orchestration:reviewer, the r4 reviewer resumed — not the fixer) — brief
  `sc671-r6-rereview-brief.md`, report `sc671-r6-rereview-report.md`. Delta `f11459e9..d582e7ff` + the CHANGELOG
  clause + one probe of the SC-644 pipeline change under the counter write path.
- r6 result (2026-11-23): **LAND-READY.** r4 LOW-1, LOW-2, LOW-3, INFO-3 closed; new findings 0 / 0 / 0 / 0 / 1 info.
  Filter is correct and inert today (early return untouched; 8 hostile keys still carried once; empty-carried write
  byte-identical; `KNOWN_KEYS` export has no bundle surface). Mutants M3 / M8 / M9 / M10 all caught. SC-644
  interaction: 60/60 jsdom cases green (a live settings change reaching an open counter never writes, and the
  following + / − is byte-identical to the same sequence without it). Scoped gates: tsc 0, four jest suites 123/123,
  e2e `--element=counter` 12/12, styles.css unchanged; r5's full-battery logs confirmed.
  - **r6 INFO-1** (CHANGELOG clause: "moves to the top" could read "moves above the counter's own keys"; line is
    long) — **DROP:** the clause is accurate, optional wording only.
  - Residual, accepted: the production "outside edit inside the 400 ms debounce -> write refused with a Notice"
    outcome is pinned for the counter only by r4's real-Obsidian probe R4C, not by a branch test — that behaviour is
    the host's (SC-552 / SC-662 suites cover it), not this ticket's.
- 2026-11-23 — **Land-ready comment posted on SC-671** (no ask; state stays Awaiting, labels DSE Plugin + Bug).
  **Reported land-ready to the dispatcher:** dse `d582e7ff` on `fefd9029`; superproject `06e1f3e4` on `334058e2`.
  For the dispatcher at landing: (1) dse-verify CURRENT moves to jest 13936 / 2 fresh, e2e `668/673 ok, 0 failed,
  5 known-bug, 418/418 pairs`, lifecycle 64/64, shots / freeze / parity unchanged; (2) the three SKILL proposals in
  `sc671-r4-review-report.md`; (3) SC-442 lands second -> flips `CTR-U01` to a plain test and keeps both
  `e2e/README.md` rows; SC-672 (same counter model file) must rebase onto this; (4) six scratch worktrees registered
  in the worktree's plugin clone (two `prunable` from session 5812b474, four under `…/e255a3cd…/scratchpad/sc671-r*`)
  — they live in the worktree clone's metadata and go away with `just wt-rm`; (5) after landing, SC-671 -> Done.
