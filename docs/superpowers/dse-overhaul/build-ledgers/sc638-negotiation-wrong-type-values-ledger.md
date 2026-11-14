# SC-638 decisions ledger — negotiation: hand-typed values of the wrong type

Owner: ticket-owner (Opus 5.5). Worktree `/home/scott/code/steelCompendium/worktrees/sc638-negotiation-wrong-type-values`
(branch `sc638-negotiation-wrong-type-values` in every submodule), cut from dse `develop` `620d5774`, superproject
workspace main `28ed9439`.

## Ticket (as filed by SC-439, 2026-11-14, plus the SC-637 owner's comment)

**Case 1 — raw JavaScript error on the card.** Typed by hand into a `ds-negotiation` block:
- `name: 2024` → "failed to render (render) _a.trim is not a function"
- a motivation or pitfall with `name: 5` or `reason: 42`
- `motivations: "foo"` (or `pitfalls: "foo"`) → ".map is not a function"
- a blank list item (`-`) under motivations → "Cannot read properties of null"
- `currentArgument: { motivationsUsed: "Peace" }` → ".some is not a function"
Ticket's expected: "a number where text is expected is read as text, and a malformed list shows a plain error naming
the key (or is ignored)."

**Case 2 — seal and ending disagree.** `current_interest: 0.4` draws Interest seal 0 marked "now" but the negotiation
stays live; `4.5` draws seal 5 but is not a deal; `current_patience: banana` shows Patience 0 but no final offer.
Ticket's expected: "the seal shown and the ending agree." Quoted numbers (`"3"`) and values past the scale already work
(SC-379).

**Added by the SC-637 owner's comment (2026-11-14, all pre-existing on `7b9e82cf`):**
- a motivation or pitfall item that is not a map (`- Legacy` instead of `- name: Legacy`) is written back as `{}` on
  the first click that saves the block (DATA LOSS);
- `pitfalls: {a: 1}` (a map where a list is expected) → raw error `_g.map is not a function`;
- `currentArgument: hello` (text where a map is expected) is silently replaced by an empty default argument on the
  first save (DATA LOSS).

Code: `src/model/NegotiationData.ts` (constructor, `Motivation`, `Pitfall`, `CurrentArgument`, `ending()`,
`clampStanding`, `offerFor`), `src/elements/negotiation/view.ts:112` (`model.name?.trim()`), `kit/track.ts` (display
rounding). Markers from SC-439: e2e `knownBug('SC-638', …)` NEGO-W02, NEGO-W03 in
`e2e/specs/negotiation/wrong-values.e2e.ts`; jsdom `test.failing` K03, K04 in `test/dom/elements/negotiation-bugs.test.ts`.

## Scott's rulings

(none yet)

## Owner rulings

- 2026-11-14 — **No Scott decision needed.** The ticket's own expected lines plus codebase precedent settle every
  choice below; the "or is ignored" branch is not taken because ignoring a malformed value and then saving would lose it.
- 2026-11-14 — **R1. Scalar where text is expected → read as text.** A number or boolean in any text field (`name`,
  a motivation's / pitfall's `name` and `reason`, `i0`..`i5`, each entry of `motivationsUsed` / `pitfallsUsed`) is
  read as its text (`2024` → "2024"). A map or list in a text field is malformed → R3. `null` / absent keeps today's
  behaviour.
- 2026-11-14 — **R2. Untouched values are written back as typed.** A value the negotiation did not change on that
  write is written back with the same value AND type the user typed: `name: 2024` stays `name: 2024`, never
  `name: "2024"`. Matching by name (a motivation chip ↔ `motivationsUsed`, `hasBeenAppealedTo`, reuse detection)
  compares the TEXT, so `motivationsUsed: [5]` matches a motivation with `name: 5`. (Value-level only: formatting,
  comments and quotes stay SC-599's, untouched — same boundary as SC-637's ruling.)
- 2026-11-14 — **R3. Wrong-shaped structure → a plain error card naming the key; the card writes nothing.**
  Precedent: encounter / party / conditions throw `Invalid data: 'monsters' field must be a list.` and the pipeline's
  error card shows it. Same form here. Covers: `motivations` / `pitfalls` that is not a list (text, map, number);
  an item of either list that is not a map (`-` blank / null, `- Legacy`, a number, a list) — the message names the
  list and the item's position (1-based); `currentArgument` that is not a map; `motivationsUsed` / `pitfallsUsed`
  that is not a list; a map or list in a text field (R1). Because the card is an error card, no control exists to
  write the block, so `- Legacy` and `currentArgument: hello` are no longer lost. No raw JavaScript message
  (`is not a function`, `Cannot read properties`, `_a.`/`_g.`) ever reaches the card for any of these inputs.
  The YAML-parse error path (`Invalid YAML format: …`) is unchanged.
- 2026-11-14 — **R4. One reading of a standing for both the seal and the ending.** The seal drawn today is the truth:
  `ending()` (and anything else that decides "deal / hostile / final offer / live") reads each standing exactly as
  the seal display reads it (clamp 0..5, `Math.round`, non-number → 0 — whatever `kit/track.ts` + `clampStanding`
  do today; one shared function, not two copies). Results: `current_interest: 0.4` → seal 0 and hostile (ended);
  `4.5` → seal 5 and a deal; `current_patience: banana` → Patience 0 and the final offer. The drawn seal does not
  change for any input; only the ending follows it. The +/- behaviour of `advanceStanding` on a non-number is not
  changed by this ticket.
- 2026-11-14 — **Scope: negotiation only.** No montage code (SC-628 is the montage twin, separate ticket). Out of
  scope: SC-639, SC-640, SC-641, SC-642, SC-648, SC-649, SC-599, SC-652. SC-640 is named in the same
  `wrong-values.e2e.ts` header — leave its markers alone. Do not extract a shared helper out of montage or another
  element; a negotiation-local helper (or reuse of an existing framework one) is fine.
- 2026-11-14 — **Markers:** NEGO-W02, NEGO-W03 (e2e) and K03, K04 (jsdom) flip to plain tests (remove the
  `knownBug` / `test.failing` wrapper and the "[known bug SC-638]" title suffix); their assertions stay as written
  unless they contradict R1–R4. New tests for every input in the ticket and the comment, at unit + jsdom level, and
  e2e for the two data-loss inputs (`- Legacy`, `currentArgument: hello`: the card shows the plain error naming the
  key and the note is byte-identical after the test's interactions) and for one R2 round trip (`name: 2024` stays
  `2024` after a seal click). New e2e ids continue the existing families (next free: NEGO-W08…, NEGO-X14…); never a
  bracketed ticket id in a test title.
- 2026-11-14 — **CHANGELOG** bullet under `## Unreleased` in the worktree superproject (one bullet, user-facing).
  ONE dse pointer bump at land-ready, superproject on current workspace origin/main.

## Baseline (dispatcher, at dse `620d5774`)

jest 12913 passed / 2 skipped fresh (12914 / 1 with the shots cache) · lifecycle 64/64 · e2e `567/591 ok, 0 failed,
24 known-bug, coverage: 416/416 pairs` · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 ·
freeze 280/280 · parity 0/0/24.

Expected after the fix: e2e known-bug 24 → 22 (W02, W03 flip), ok = 569 + new tests, total = 591 + new tests,
coverage 416/416 unless a new control is added (none expected — an error card has no controls). jest = 12913 + new
tests, 2 skipped fresh. Lifecycle 64/64 (no new scenario expected; G-S131 reserved if one is needed). If `styles.css`
is byte-identical to a clean `620d5774` build, shots/freeze/parity carry; otherwise run them.

## Rounds

- r1 implementer (orchestration:implementer, agent ad7b37c8…) — brief `sc638-r1-implementer-brief.md`, report
  `sc638-r1-implementer-report.md`. Dispatched 2026-11-14.
  r1 result (2026-11-14): DONE. dse `4b21de21` on `620d5774` (7c41438d fix + unit + K03/K04 flip, 72e846f9 jsdom,
  d5adf4eb W02/W03 flip + NEGO-W08..W10 + fixtures, 9a8d6177 / 4b21de21 e2e driver fixes); superproject CHANGELOG
  `de702d1e`, no pointer bump. +89 jest (54 unit, 35 jsdom). jest 13002/2 fresh, lifecycle 64/64, e2e `572/594 ok,
  0 failed, 22 known-bug, coverage: 416/416 pairs`; styles.css `18730938…f1f9` identical to clean base, shots/freeze/
  parity carry. Note: `e2e/driver/dse.ts` `openNote` now counts a card with `data-dse-error-stage` as drawn (error card
  is thrown at parse, no registry entry) — reviewer to check it masks nothing.
- 2026-11-14 — r1 follow-ups ruled:
  - **Top-level block that is not a map (`hello`, a list, a number) — FOLD** (same data-loss family, same file, small).
    R3 applies: a plain error card naming the problem ("Invalid data: the block must be a map of keys." or similar
    in the encounter form); the card writes nothing. An EMPTY block (nothing, or only whitespace/comments — parses to
    null/undefined) keeps today's behaviour (a fresh default negotiation).
  - **Wrong types in non-text fields (`initial_patience: [1]`, `hasBeenAppealedTo: maybe`, `lieUsed: 1`) — reviewer
    probes in r2.** If any shows a raw JS error or loses data on a write, it becomes a finding for the fix round; if it
    only reads oddly but agrees with R4 and round-trips, DROP (no ruling covers it; not worth a ticket).
- r1b fold round (resume r1 implementer) — top-level non-map block.

## Baseline moves

- 2026-11-14 (dispatcher) — SC-627 landed (montage: Add a hero duplicate name). dse `develop` now `afd1436c`,
  workspace main `fcac51ba`. Rebase onto `afd1436c`; superproject branch on current workspace main with ONE pointer
  bump (CHANGELOG commit under it) before land-ready. Numbers at `afd1436c`: jest 12922 passed / 2 skipped fresh
  (12923 / 1 with the shots cache) · lifecycle 64/64 · e2e `570/593 ok, 0 failed, 23 known-bug, coverage: 416/416
  pairs` · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.
  Expected for SC-638 on it (r1 + r1b): jest 12922 + 89 + r1b tests, 2 skipped; e2e known-bug 21, ok 576, total 597
  (if r1b adds exactly one e2e), coverage 416/416.
- r1b result (2026-11-14): DONE_WITH_CONCERNS. dse `daf75fc5`, rebased on `afd1436c` (56655bd2 fix + unit + jsdom,
  39c31a6a NEGO-W11 + fixture `wrong-block.md`, daf75fc5 empty block back to as-before). jest 13022/2 fresh
  (12922 + 89 + 11), lifecycle 64/64 (full, new base), e2e `576/597 ok, 0 failed, 21 known-bug, coverage: 416/416
  pairs`; styles.css `18730938…f1f9` identical to clean `afd1436c`. Superproject CHANGELOG still `de702d1e` on `28ed9439`
  (owner moves it at land-ready).
- 2026-11-14 — **~~An EMPTY block … keeps today's behaviour (a fresh default negotiation)~~ superseded:** the premise
  was wrong. Measured on base, an empty / whitespace / comment-only block is REFUSED with a raw error card
  (`Cannot read properties of null (reading 'motivations')`), and that refusal is SC-493's tested contract (the form
  refuses to save an empty body). Ruling: the refusal stays exactly as is; **FOLD into the review fix round** a plain
  message for it instead of the raw JS text (encounter form, e.g. "Invalid data: the block is empty."), SC-493's tests
  stay green unchanged except any that pin the raw message text.
- r2 reviewer (orchestration:reviewer) — brief `sc638-r2-reviewer-brief.md`, report `sc638-r2-review-report.md`,
  reviewing `daf75fc5`.
- r2 result (2026-11-14): LAND, 0 HIGH / 0 MEDIUM / 3 LOW / 7 INFO (report `sc638-r2-review-report.md`). Measured:
  tsc/lint clean, jest 13022/2, e2e `576/597 ok, 0 failed, 21 known-bug, coverage: 416/416 pairs`; lifecycle not run
  (no scenario drives negotiation). Mutants 6/6 killed.
- 2026-11-14 — r2 findings ruled (fix round r3 = resume the r1 implementer; scoped re-review r4 = resume the r2 reviewer):
  - **LOW-1 `motivationsUsed: [5, "5"]` written back `[5, 5]` — FOLD**: remember used-list typed values by position.
  - **LOW-2 `openNote` accepts an error card for every caller — FOLD**: error-card acceptance becomes opt-in for the
    tests that expect an error card; give NEGO-W02 a positive assertion (the name text is shown).
  - **LOW-3 CHANGELOG "exactly as you typed it" overclaims — FOLD**: "the same number or true/false you typed"
    (spelling such as `0x1F` / `1.50` follows the serializer).
  - **INFO-1 non-text wrong types — DROP** (all agree with R4, round-trip, identical to base). The Reset YAML alias
    (`&a1` / `*a1`) only appears with a LIST as a standing, is pre-existing, and keeps the value — DROP, not a ticket.
  - **INFO-2 empty block raw text — FOLD** (already ruled above): plain message, SC-493 refusal unchanged.
  - **INFO-3 R3 refuses more inputs than the ticket listed (`currentArgument: false/0/""`, `motivations: 0`, …) —
    ACCEPT** as consistent with R3 (on base each was replaced on the first write).
  - **INFO-4 chrome summary prints the raw standing (`Interest 0.4 · Patience banana`) — FOLD**: the summary
    (`src/elements/negotiation/definition.ts:21`) shows the same reading as the seal (R4's one shared function), so
    `0.4` reads `Interest 0`, `banana` reads `Patience 0`.
  - INFO-5..7 — no action.
- r3 result (2026-11-14): all five folds in. dse `ef1c9f07` on `afd1436c` (c03c7eec fixes + tests, cc2109c1 e2e
  opt-in `openNote(rel, { errorCard: true })` for W08/W09/W11 + W02 positive assertion, ef1c9f07 comment parse fix);
  superproject `4df72822` (CHANGELOG wording) on `de702d1e`. jest 13029/2 fresh (+7), e2e `576/597 ok, 0 failed,
  21 known-bug, coverage: 416/416 pairs`, styles.css unchanged. Empty block message `Invalid data: the block is empty.`;
  summary reads through `NegotiationData.standingOf`.
- r4 scoped re-review (resume r2 reviewer) of `daf75fc5..ef1c9f07` + `de702d1e..4df72822`.
- r4 result (2026-11-14): FIX, 1 MEDIUM. MEDIUM-r4-1: `restoreUsed` (`NegotiationData.ts:97-110`) single end-cursor
  match loses the type of untouched entries after a chip toggle (`[5, 7]`, toggle 5 off/on → `["7", 5]`; base gave
  `[7, 5]`). Ruled: FIX in r3b (resume implementer) with the reviewer's prescribed per-text matching; scoped re-review
  r4b by the reviewer. Gates measured unchanged (jest 13029/2, e2e 576/597, 21 known-bug, 416/416).
- r3b result (2026-11-14): per-text matching in `restoreUsed`. dse `12aaf5b5` on `afd1436c`; +3 jest (fail on
  `ef1c9f07`). jest 13032/2 fresh, e2e `576/597 ok, 0 failed, 21 known-bug, coverage: 416/416 pairs`. r4b scoped
  re-review (resume reviewer) of `ef1c9f07..12aaf5b5`.
- r4b result (2026-11-14): LAND, 0/0/0 + 1 INFO (quadratic per-text filter on tiny lists — DROP). Mutant to single
  cursor: 3 red. jest 13032/2; e2e not re-run (no e2e fixture has a typed used-list entry; `ef1c9f07` ran 576/597).
- r5 superproject onto current workspace main + ONE pointer bump to `12aaf5b5` (resume r1 implementer), brief
  `sc638-r5-superproject-brief.md`; also unregister the reviewer's two scratch plugin worktrees.
- r5 result (2026-11-14): superproject on workspace main `51b3b6e5`: `528bc7ef` CHANGELOG (squashed) + `0fa9fd91` ONE
  pointer bump to dse `12aaf5b5`; dse develop still `afd1436c` (ancestor). Reviewer scratch worktrees unregistered.
  SKILL proposal `sc638-skill-proposal.md`. **LAND-READY** reported to the dispatcher.
