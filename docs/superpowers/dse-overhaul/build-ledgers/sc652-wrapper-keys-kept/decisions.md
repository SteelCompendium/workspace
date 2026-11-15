# SC-652 decisions ledger — any write deletes an unusable `prefs:` map and a non-boolean `collapsed:`

Owner: ticket-owner (Opus 5.5), session `be71a0a9-199f-4e14-967b-191935312b05`.
Worktree `/home/scott/code/steelCompendium/worktrees/sc652-wrapper-keys-kept` (branch `sc652-wrapper-keys-kept`
in every submodule), cut from dse `develop` `ad21dc87`, superproject `63843336` (= workspace origin/main at cut).

## Ticket (as filed from the SC-625 r2 review, finding I-4, 2026-11-14)

When the plugin writes any block (every element, not only the montage), two hand-written lines can disappear
without a warning:

* A `prefs:` map whose keys the plugin does not use (for example `prefs: {boardDensity: compact}`) is deleted
  whole on the first write.
* `collapsed: yes` (a word instead of `true` / `false`) is deleted on the first write.

Expected: "the plugin keeps what it cannot read, the same way SC-625 keeps unknown montage keys."

Agent notes: `extractCollapseKeys` (`src/framework/chrome/collapsedKey.ts` ~107-111) pops the key but never adds it
to `popped`. `src/framework/prefOverrides.ts` ~66-84 passes through only SC-406 gated keys. Framework keys are
popped in `pipeline.ts` ~338-353 and re-emitted by `withReservedKeys`. Related: SC-514 (ds-hero writes `prefs:`
twice), SC-599 (formatting, parked on Scott).

## Scott's rulings

(none yet)

## Owner rulings

- 2026-11-15 — **Scope: anything the framework removes from a block's data on read comes back on write, by value.**
  Concretely, all of these must survive a write (any element, any write path: in-block interaction, outside-edit
  refresh, block edit form Save):
  - every key of a `prefs:` map, whatever happens to it on read: applied overrides, unknown/typo keys,
    attr-less (behavioural or css-bearing) keys, `perBlock: false` keys, SC-406 gated keys (switch on or off);
    in the author's original key order;
  - a `prefs:` value that is not a map at all (`prefs: compact`, `prefs: [a, b]`, `prefs:` with no value);
  - a non-boolean `collapsed:` (`collapsed: yes`, `collapsed: 1`, `collapsed: "true"`), and likewise a
    non-boolean `collapsible:` / `collapse_default:` wherever the framework claims (removes) them;
  - the same three keys on the non-mapping-body rescue path (`peelLeadingCollapseKeys`), if it can drop a
    non-boolean there.
  This reverses SC-406's "typo keys are still dropped on write (as they always were)" comment; that comment is
  updated with the change. Ticket text ("keeps what it cannot read") plus the SC-625 / SC-637 precedent.
- 2026-11-15 — **Behaviour on screen is unchanged.** A kept-but-unusable value still warns in the console
  exactly as today and is still not applied (an unknown pref does nothing; `collapsed: yes` still means "not
  set", so the global default decides). No new reading of `yes`/`no` as booleans. `styles.css` should not change.
- 2026-11-15 — **Not SC-599.** Values are kept by VALUE; their formatting follows whatever the existing
  `stringifyYaml` re-emit does today (flow map may become block map, quotes may change). No source-text-preserving
  editing, no `yaml` Document API, nothing that decides SC-599's question.
- 2026-11-15 — **Placement:** the reserved keys keep today's order (`prefs:` ... `collapsed:` ... body), each
  emitted where it is emitted today. A block with none of the reserved keys stays byte-untouched (no wrapper).
- 2026-11-15 — **SC-514 (ds-hero writes `prefs:` twice) is not ours,** but this change must not make it more
  likely: installing the `prefs:` wrapper in more cases (unknown-only maps) must not produce a second `prefs:`
  line on ds-hero (`HeroModel.serializeStateSplice`, see `withCollapseKeys` doc at collapsedKey.ts ~124) or on
  any other element that already writes the line itself. Report any element where it does.
- 2026-11-15 — **SC-644 overlap:** SC-644 (parked on Scott, code done) touches `pipeline.ts` and the collapse path.
  Keep this change to what a write keeps — `extractCollapseKeys` / `extractPrefOverrides` / `withReservedKeys`
  and their callers — and do not change how the collapse state is resolved (`resolveCollapseState`) or how
  settings reach open blocks. Tell the dispatcher about the shared files at land-ready.
- 2026-11-15 — **No lifecycle id needed** unless a worker shows a lifecycle-only path; G-S144 is reserved if so.

## Baseline

- ~~dse `develop` `ad21dc87`: jest 13403/2 fresh · lifecycle 64/64 · e2e 612/622 ok, 0 failed, 10 known-bug, 417/417~~
  superseded 2026-11-15 by the dispatcher: SC-651 landed.
- ~~2026-11-15 (dispatcher) — dse `develop` `fcc7278e`, workspace main **`41fb5fb5`**. Numbers at fcc7278e:
  jest **13406 passed / 2 skipped** fresh · lifecycle **64/64** · e2e **`613/622 ok, 0 failed, 9 known-bug,
  coverage: 417/417 pairs`** · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze
  280/280 · parity 0/0/24. Before land-ready: dse branch rebased onto fcc7278e; superproject branch on current
  workspace main with the CHANGELOG commit and ONE pointer bump, no interim pointer commits.~~ superseded 2026-11-15 by the dispatcher: SC-650 landed.
- 2026-11-15 (dispatcher) — dse `develop` **`42c26272`**, workspace main **`f3ab849c`**. Numbers at 42c26272:
  jest **13448 passed / 1 skipped with the shots cache** · lifecycle **64/64** · e2e **`622/631 ok, 0 failed,
  9 known-bug, coverage: 417/417 pairs`** · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 ·
  freeze 280/280 · parity 0/0/24. New flake: NEGO-R05 failed once under load in SC-650's runs, passed on re-run.
  Same land-ready rule: dse rebased onto 42c26272; superproject on current workspace main + CHANGELOG commit + ONE
  pointer bump. Owner: the r2 reviewer keeps reviewing be843ebd (on fcc7278e) — SC-650's diff
  (fcc7278e..42c26272: montage view / windowHandoff / initiative view outside-edit) shares only
  `.repo-docs/architecture.md` with ours; the fix round rebases onto 42c26272 and re-runs the whole battery, and
  the scoped re-review checks the montage outside-edit write path keeps the reserved keys after the rebase.

## Rounds

- r1 implementer (Sonnet) dispatched 2026-11-15 on ad21dc87; told mid-round to rebase onto fcc7278e and re-run
  the battery against the new numbers.
- r1 DONE 2026-11-15: dse head `be843ebd` on `fcc7278e` (commits 26314886 fix, 89d81249 jest, 5a4b4f77
  .repo-docs note, be843ebd e2e). jest 13525/2 · lifecycle 64/64 · e2e `618/627 ok, 0 failed, 9 known-bug,
  coverage: 417/417 pairs` (new MONT-X15..X18, CTR-K01) · shots 592 · freeze 280/280 · parity 0/0/24.
  SC-644 overlap: `pipeline.ts` ~3 lines (passthrough init). SC-514: `withPrefOverrides` now skips a body that
  already declares `prefs:` (as `withCollapseKeys` does) — implementer says this also fixes SC-514's existing
  ds-hero double write; reviewer must verify. SidebarPanel outside-edit refresh now rebuilds the reserved-key
  wrapper from the fresh read. Peel path never removes a non-boolean (pinned by tests).
- 2026-11-15 — r1 follow-up rulings:
  - Peel keeps the first of a repeated boolean reserved key, drops later duplicates: **DROP** — a repeated key is
    malformed input on a rare rescue path; behaviour already uses the first; not SC-652's ask.
  - Sidebar outside-edit refresh does not re-apply pref overrides / collapse state to the open card: **FILED
    SC-665** (Backlog, related SC-652/SC-644) — out of scope here.
  - `prefs: {}` kept as `prefs: {}`; empty `prefs:` re-emitted as `prefs: null`: **DROP** — kept by value per the
    "Not SC-599" ruling; formatting is SC-599's question.
- r2 review (Opus) DONE 2026-11-15 on `be843ebd`: **FIX** — 0 CRITICAL / 0 HIGH / 1 MEDIUM / 2 LOW / 6 INFO. Report
  `sc652-r2-review-report.md`. Reviewer gates: jest 13526/1 (cached CSS), lifecycle 63/64 (G-S61 torn-read, fails
  on base `fcc7278e` too), e2e 618/627 0 failed 417/417 on second run (first run: SET-X03/X04, SC-657).
- 2026-11-15 — r2 rulings:
  - **M-1 FOLD** (ds-hero: a quoted / explicit-key reserved key — `"prefs":`, `'prefs':`, `? prefs`,
    `"collapsed": yes` — slips the line-start guard and is written twice → "Map keys must be unique" error card).
    Apply the reviewer's prescribed fix: one shared helper used by both `withPrefOverrides` and `withCollapseKeys`
    that decides "body already declares key K" by `parseYaml(body)` when the body is a map, falling back to today's
    line test only when it is not. Add tests for all six reviewer hero cases.
  - **L-1 FOLD** (stale comment `collapsedKey.ts:271-273`).
  - **L-2:** no code. SC-514 is NOT closed on r1's claim; the scoped re-review re-checks SC-514's cases after M-1,
    and the owner reports the result to the dispatcher at land-ready (SC-514 is not this ticket's to close).
  - **I-1 DROP** — value normalisation of exotic keys/values is inside the "Not SC-599" ruling.
  - I-2 / I-5: no action (confirmations).
  - **I-3 FILED SC-669** (ds-hero whole-document-indented body broken by any write, pre-existing).
  - **I-4 FOLD** — move CTR-K01 into a counter e2e spec (ids unchanged).
  - **I-6 FILED SC-668** (G-S61 torn-read threshold fails on a loaded host, base too). For this ticket: a G-S61
    FAIL whose only cause is the torn-read line, reproduced on clean `42c26272` on the same host, counts as host
    load, not a regression; any other G-S61 failure is real.
- Fix round r3 = r1 implementer resumed: M-1, L-1, I-4, rebase onto `42c26272`, full battery, then superproject:
  branch onto workspace origin/main `f3ab849c`, one CHANGELOG commit (`sc652-changelog-draft.md`), ONE pointer bump.
- 2026-11-15 (dispatcher) — workspace origin/main moved past `f3ab849c` to **`2945c3ea`** (docs-only); dse develop
  still `42c26272`. Superproject branch goes on current origin/main at finalize. Relayed to the r3 implementer.
- r3 fix round DONE 2026-11-15: dse head **`f4448454`** on `42c26272` (635488bf fix, 236ebecc jest, 69c694ae doc,
  12e38fe7 e2e, 6b6674e5 M-1/L-1/I-4, f4448454 lint). Superproject head **`6c77ff1a`** on origin/main `2945c3ea`
  (7f7f3eeb CHANGELOG, 6c77ff1a pointer bump → f4448454). jest 13582/1 (cache) · lifecycle 63/64 — G-S61 torn-read
  only, same on clean 42c26272 (SC-668 ruling: host load) · e2e `627/636 ok, 0 failed, 9 known-bug, coverage:
  417/417 pairs` · styles.css unchanged (shots/freeze/parity carry). All six reviewer hero cases + original SC-514
  case `"prefs": {reduceMotion: true}` single after M-1.
- r4 scoped re-review = r2 reviewer resumed, delta `12e38fe7..f4448454` + rebase sanity vs SC-650 + superproject commits.
- 2026-11-15 (dispatcher FYI) — SC-662 and SC-656 owners also see G-S61 red on their heads AND clean base `42c26272`
  on this host (63/64, G-S61 only), matching SC-668. Land-ready report states 63/64 with the base run, same way.
- r4 scoped re-review DONE 2026-11-15 on `f4448454`: M-1 closed, L-1/I-4 done, rebase sanity OK, superproject as
  specified. New **N-1 (MEDIUM)**: in the pinned sidebar, a montage's own write echoed back by the modify event
  closes its open window (Set limits etc.) with a false "changed outside" Notice when the block has a reserved line —
  `src/elements/montage/view.ts:128` stores the full written text, `:191` compares it with the plain model
  serialization; same pattern `src/elements/initiative/view.ts:207` vs `:266`. On base only `collapsed: true` / an
  applied pref triggered it; SC-652 widens it to every kept line. lifecycle part 4: G-S61 torn-read only (load
  16.4→3.8).
- 2026-11-15 — r4 rulings:
  - **N-1 FOLD** — SC-652 widens the trigger, the fix is two lines, prescribed and probed by the reviewer: at montage
    `view.ts:128` and initiative `view.ts:207` store `ser: serializeModel(model)` and keep `raw:
    normalizeBlockText(out)`. Tests: jsdom for montage AND initiative (sidebar echo of the block's own write with
    `prefs:` unknown-only, `collapsed: yes`, `collapsed: true`, an applied pref, and no reserved line — window stays
    open, no Notice, reserved lines written once; a genuine outside edit still closes the window with the Notice).
  - **I-7 DROP** — the fallback only sees bodies that already fail to parse; identical on base; ds-hero's broken-body
    family is SC-669's.
  - I-8: no action (confirmation).
- Fix round r5 = implementer resumed; scoped re-review r6 = reviewer resumed (it prescribed, did not author).
- 2026-11-15 (dispatcher relay from SC-662 owner, verbatim): "a `prefs:` map whose keys are ALL rejected (example:
  `prefs: {staminaRecoveryPopover: …, collapsibleDefault: …}`) is deleted from the block by the first write. This
  happens in Reading view and the sidebar, and on base 42c26272 too. The reviewer's probes: RV-R03, RV-R03C, RV-R03RV,
  listed in .superpowers/sdd/sc662-sidebar-pending-saves/sc662-r2-review-report.md under OOS-3. It sits in
  prefOverrides.ts, which is SC-652's file, and SC-652's ruling already covers unknown keys. SC-662 will not touch it."
  Owner: already in SC-652 scope (attr-less keys bullet of the scope ruling; r1 passes the whole `prefs:` value
  through). r6 re-review must run SC-662's RV-R03 / RV-R03C / RV-R03RV probes (probe spec
  `scratchpad/sc662-r2-R1/zz-r2r1-probes.e2e.ts`, copied into a throwaway tree, never edited in place) against the
  SC-652 head in real Obsidian, Reading view and sidebar, and confirm the map is kept once.
- r5 fix round DONE 2026-11-15: dse head **`bab0dbb2`** (one commit on f4448454; develop still 42c26272). N-1 fixed
  in montage + initiative `view.ts`; 25 new jsdom tests (12 fail on f4448454). jest 13607/1 (cache) · lifecycle
  63/64 (G-S61 torn-read only; clean 42c26272 G-S61 FAIL same cause, load 2.55→1.25) · e2e `627/636 ok, 0 failed,
  9 known-bug, coverage: 417/417 pairs` · no CSS change. Superproject head **`a5aa9700`** on `2945c3ea`
  (7f7f3eeb CHANGELOG, a5aa9700 pointer bump → bab0dbb2).
- r6 scoped re-review DONE 2026-11-15 on `bab0dbb2`: **LAND** — 0 C / 0 H / 0 M / 1 L / 2 I. N-1 fix exactly as
  prescribed; 12/25 new tests fail on f4448454. SC-662 relay: RV-R03 / RV-R03C (sidebar) and RV-R03RV (Reading view)
  keep the all-rejected `prefs:` map, one line, after writes 1 and 2 on head; gone after write 1 on base 42c26272.
  Superproject a5aa9700 verified. jest 13607/1, tsc + lint clean.
- 2026-11-15 — r6 rulings:
  - **L-3 DROP** — the fixed comparison is pinned by 25 jsdom tests that fail without it, and the reviewer measured
    the real pinned-sidebar path (comment-inside-block edit: f4448454 closes 8/8, bab0dbb2 keeps open 8/8). A real-host
    test would be another full round for coverage only.
  - **I-10 wording correction:** N-1's real trigger is an outside edit INSIDE the block that the model ignores (a YAML
    comment, a reformat, a hand edit of the kept `prefs:` value); the host drops the exact self-echo
    (`SidebarBlockHost.ts:443`). The r4 entry's "own write echoed back" wording is superseded by this line.
  - I-9: no action (placement ruling + SC-599).
- **LAND-READY 2026-11-15:** dse `bab0dbb2` on develop `42c26272`; superproject `a5aa9700` on workspace main
  `2945c3ea` (7f7f3eeb CHANGELOG, a5aa9700 pointer bump).
- **DONE 2026-11-15:** landed by the dispatcher — dse develop `bab0dbb2`, workspace main `c65d33a2` (bookkeeping
  `4a5a3c2c`); worktree removed; ledger preserved at `docs/superpowers/dse-overhaul/build-ledgers/sc652-wrapper-keys-kept/`.
  SC-652 set to Done via linear-post.py `--state Done` (landed comment posted); verified with get_issue: status Done,
  completedAt 2026-11-15T12:42:50Z.
