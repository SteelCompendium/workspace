# SC-637 decisions ledger — negotiation: any write deletes unknown YAML keys

Owner: ticket-owner (Opus 5.5). Worktree `/home/scott/code/steelCompendium/worktrees/sc637-negotiation-unknown-yaml-keys`
(branch `sc637-negotiation-unknown-yaml-keys` in every submodule), cut from dse `develop` `76520b1f`, superproject
workspace main `18f8043f`.

## Ticket (as filed by SC-439, 2026-11-14)

A `ds-negotiation` block with a key the plugin does not know (`note_to_self:` at the top, `gm_note:` on a motivation
or pitfall) loses that key the first time anything writes the block: a Patience or Interest seal, a motivation or
pitfall chip, Complete Argument, or Reset. Expected: "keys the plugin does not know survive a write, at the top level
and inside each motivation and pitfall." The first write also re-orders the user's keys into the plugin's own order
(same family; SC-599 covers comments and quotes plugin-wide). Repro fixture `e2e/vaults/shipped/Negotiation/unknown-keys.md`.
Cause: `src/model/NegotiationData.ts:29-36` (constructor), `:185-186` (Motivation), `:196-197` (Pitfall) copy only
known keys; `serialize` writes from the model (`src/elements/negotiation/model.ts:85-88`). Markers from SC-439: e2e
`knownBug` + jsdom `test.failing` (SC-439 ledger names X06/X07/K01/K02).

## Scott's rulings

(none yet)

## Owner rulings

- 2026-11-14 — **Not dependent on SC-599.** (Same ruling as SC-625.) SC-599 (parked on Scott) is about comments /
  quote style / flow-list formatting of the whole-block rewrite. SC-637 is about key/value data the parser throws
  away; it is fixed inside the existing parse -> model -> `stringifyYaml` path. Do NOT introduce source-text-preserving
  editing, the `yaml` Document API, or anything that decides SC-599's question. Unknown values are preserved by VALUE;
  their formatting follows whatever the existing serializer does today.
- 2026-11-14 — **Placement:** known keys keep the existing fixed order; unknown keys go after the known ones, in their
  original relative order — at top level and inside each motivation and pitfall. The ticket's "re-orders the user's
  keys" sentence is not fixed here (it describes the known-key order, which stays as is; matches SC-625's top-level
  and per-action rule). A key that looks like an integer is written first (JS object key order) — document it, do not
  restructure to fix it (SC-625 precedent).
- 2026-11-14 — **"Known" means every key the negotiation READS**, including any legacy alias / old spelling the
  parser accepts and rewrites under a canonical name, and keys it reads then drops as empty. Such a key must not be
  carried as "unknown" (that would duplicate or resurrect stale data).
- 2026-11-14 — **Every write path keeps the unknown keys**, including Reset (Reset resets the tracker state, not the
  user's own keys) and the sidebar host (`SidebarBlockHost.ts` uses `NegotiationData`).
- 2026-11-14 — **Scope is negotiation only.** Do not change montage code. Reusing an existing generic helper is fine;
  extracting one out of montage is not (it would widen review onto landed SC-625 code). SC-652 (framework `prefs:` /
  `collapsed:` drop) and SC-638..SC-642, SC-648, SC-649 are out of scope.

## Baseline (dispatcher, at dse `76520b1f`)

jest 12575 passed / 2 skipped fresh (12576 / 1 with the shots cache) · lifecycle 64/64 · e2e `484/504 ok, 0 failed,
20 known-bug, coverage: 287/287 pairs` · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 ·
freeze 280/280 · parity 0/0/24.

## Rounds

- r1 implementer (orchestration:implementer, agent ac1ee552…) — brief `sc637-r1-implementer-brief.md`, report
  `sc637-r1-implementer-report.md`. Dispatched 2026-11-14.

## Baseline moves

- 2026-11-14 (dispatcher) — SC-643 landed (compendium Sync destination resolver and guards; no negotiation code).
  dse `develop` now `7b9e82cf`, workspace main `120cf676`. Rebase onto `7b9e82cf` (superproject onto current
  workspace main, ONE pointer bump) before land-ready. Numbers at `7b9e82cf`: jest 12681 passed / 2 skipped fresh ·
  lifecycle 64/64 · e2e `484/504 ok, 0 failed, 20 known-bug, coverage: 287/287 pairs` · shots 592, host-leak
  163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24. r1 was dispatched on
  `76520b1f`; it is told to rebase before its gate run (SendMessage), else the rebase goes in the fix round.
  r1 result (2026-11-14): DONE. dse `cf2efdd0` on `7b9e82cf` (commits 6bb29a06 fix + unit, 09fc9cc4 jsdom, bf1358a8 e2e
  flip + NEGO-X09..X13, e9b1ac38 wrapperDefaultKeys test source `{}` (its "empty" source used unknown key `title`),
  cf2efdd0 NEGO-X13 escape fix); superproject CHANGELOG `5bc6e4b2` on workspace main `66b04168`, no pointer bump.
  Design: extras in a module-private WeakMap in `NegotiationData.ts` (no own props, nothing can shadow a member).
  jest 12702/2 fresh (+21), lifecycle 64/64 (seven parts), e2e `491/509 ok, 0 failed, 18 known-bug, 287/287`;
  styles.css `18730938…f1f9` identical to clean `7b9e82cf` build, so shots/freeze/parity carry.
- 2026-11-14 — r1 follow-ups ruled:
  - **Unknown keys inside `currentArgument:` — FOLD** (same bug, same file, small). Unknown keys inside
    `currentArgument:` survive writes like the other levels (known keys in the existing order, then unknown in
    original order) for as long as that argument exists. When a write replaces or clears the current argument
    (whatever Complete Argument / Reset already do to it), its unknown keys go with it — they belong to that argument.
  - **`null` item in `motivations:` / `pitfalls:` throws — DROP**, already filed: SC-638 lists "a blank list item (`-`)
    under motivations → Cannot read properties of null". Out of scope here.
  - **Fresh worktree needs `npm ci` — SKILL proposal**: r1's proposed text goes to `sc637-skill-proposal.md` in this
    dir (owners don't edit SKILL.md).
- 2026-11-14 — workspace main has moved again (`c588bbaa`, docs only). Final superproject rebase onto current
  workspace origin/main happens just before land-ready.
- r1b fold round (resume r1 implementer) — `currentArgument` extras. Brief: the SendMessage text, quoted in
  `sc637-r1b-fold-brief.md`.
  r1b result: dse `4e30dcfb` (one commit on `cf2efdd0`; `CurrentArgument` extras in the same WeakMap, dropped by
  `resetData()` = Complete Argument / Reset); superproject CHANGELOG amended to `31a49921` on `66b04168`. +18 tests
  (11 fail on `cf2efdd0`). jest 12720/2 fresh, e2e `491/509 ok, 0 failed, 18 known-bug, 287/287`; styles.css
  unchanged. SKILL proposal `sc637-skill-proposal.md`.
- r2 independent review (orchestration:reviewer, agent a2a8c77b…) — brief `sc637-r2-reviewer-brief.md`, report `sc637-r2-review-report.md`.
  r2 result (2026-11-14): **LAND-READY**, 0 HIGH / 0 MEDIUM / 1 LOW / 5 INFO, on `4e30dcfb`. Measured: jest 12720/2
  fresh, lifecycle 64/64 (seven `--only=` parts), e2e `491/509 ok, 0 failed, 18 known-bug, 287/287`, styles.css
  identical. 38/41 new tests fail on base (3 are no-mutation guards). Probe worktree left registered at
  `<scratchpad>/sc637-r2-review/dse-probe` (detached `4e30dcfb`) — tell the dispatcher, do not rm.
- 2026-11-14 — r2 findings ruled:
  - **L-1 DROP** — CHANGELOG wording matches the accepted SC-625 bullet; integer-key order is a documented edge case
    (code comment), quote style is SC-599's.
  - **I-1, I-2 DROP** — confirmations, no action.
  - **I-3 DROP** — shared nested values with the raw parse; nothing mutates them today.
  - **I-4 → SC-638** — three pre-existing wrong-type losses (non-map motivation/pitfall written back as `{}`;
    `pitfalls: {a: 1}` throws `_g.map is not a function`; `currentArgument: hello` replaced by a default argument),
    confirmed at `7b9e82cf`. Added to SC-638 as a comment (it covers wrong-type hand-typed values).
  - **I-5 DROP** — cosmetic comment omission at `model.ts:99-100`; not worth a fix + re-review round.
- 2026-11-14 — **Baseline moved again:** dse `origin/develop` is `941b814f` (SC-440 settings-tab e2e landed:
  tests + `data-dse-control` ids on settings controls; touches `e2e/README.md`, no negotiation code). Workspace
  origin/main `c588bbaa`. r3 = rebase round (resume r1 implementer): dse onto `941b814f`, superproject onto current
  workspace origin/main with ONE pointer bump, full battery. r4 = scoped re-review of the rebase delta by the r2
  reviewer (not an author).
- 2026-11-14 (dispatcher) — SC-440 landed: dse `develop` `941b814f`, workspace main `ff1a195e`. Numbers at
  `941b814f`: jest 12875 passed / 1 skipped with shots cache (fresh 12874 / 2, derived) · lifecycle 64/64 · e2e
  `560/586 ok, 0 failed, 26 known-bug, coverage: 416/416 pairs` · shots 592, host-leak 163/978, modal host-leak
  40/240, capture clip 147 · freeze 280/280 · parity 0/0/24. **Expected on the rebased SC-637 head:** jest fresh
  12913 / 2 (+39) · lifecycle 64/64 · e2e `567/591 ok, 0 failed, 24 known-bug, coverage: 416/416 pairs`.
- r3 rebase result: dse `620d5774` on `941b814f` (no conflicts; no npm ci); superproject `28040aaa` CHANGELOG +
  `41480b27` bump (gitlink `620d5774`) on workspace origin/main `016b1cdd`. jest 12913/2 fresh, lifecycle 64/64
  (seven parts), e2e `567/591 ok, 0 failed, 24 known-bug, coverage: 416/416 pairs` — all exactly as expected;
  styles.css `18730938…f1f9` = clean `941b814f` build.
- 2026-11-14 — **r4 re-review DROPPED** (owner-verified instead): `git range-diff 7b9e82cf..4e30dcfb 941b814f..620d5774`
  shows all six commits patch-identical (`=`), no conflict resolutions; superproject `origin/main..HEAD` = exactly the
  2 commits, diff vs origin/main = CHANGELOG (+10) and the gitlink only; tree clean; numbers match the derived
  expectations. The r2 reviewer's independent battery on the identical patches stands. Brief `sc637-r4-rereview-brief.md`
  left unsent.
- 2026-11-14 — **LAND-READY** reported to the dispatcher: dse `620d5774` on `develop` `941b814f`; superproject
  `41480b27` on workspace main `016b1cdd`. SKILL proposal: `sc637-skill-proposal.md`.
- 2026-11-14 (dispatcher) — **LANDED**: dse `develop` `620d5774`, workspace main `9f35b804` (bookkeeping `11ee0b00`);
  worktree removed; ledger preserved at `docs/superpowers/dse-overhaul/build-ledgers/sc637-negotiation-unknown-yaml-keys/`;
  SKILL proposal applied (both footguns).
- 2026-11-14 — **Done**: landed comment posted and state set via `linear-post.py --state Done`; verified Done
  (completedAt 2026-11-14T15:34:46Z).
