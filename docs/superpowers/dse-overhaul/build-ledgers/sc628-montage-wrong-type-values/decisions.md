# SC-628 decisions ledger — montage: hand-typed values of the wrong type

Owner: ticket-owner (Opus 5.5). Worktree `/home/scott/code/steelCompendium/worktrees/sc628-montage-wrong-type-values`
(branch `sc628-montage-wrong-type-values` in every submodule), cut from dse `develop` `afd1436c`, superproject
workspace main `c1825403`.

## Ticket (as filed by SC-438, 2026-11-14)

"Two cases, same cause: the montage reads hand-typed YAML values without checking their type.

1. **A number or true/false as the title.** `title: 2024` or `title: true` turns the whole card into the error
   "Montage Test tracker: failed to render (render)". Nothing is lost; the user has to edit the line.
   (`description: 5` is handled.)
2. **A quoted number.** With `rounds: "3"`, Add a round writes `rounds: "31"` and the board grows to 31 columns.
   With `current_round: "1"`, End round writes `current_round: "11"`.

Expected: a title of any scalar type is shown as text; a quoted number is read as a number."

Agent notes: title `src/elements/montage/HeadView.ts:27` (`this.model.title?.trim()`), `model.ts` `parseModel`
(~:278) assigns `d.title` unchecked. Numbers: `addMontageRound` `m.rounds += 1`, End round `m.current_round += 1`;
`parseModel` `d.rounds ?? 2` does not coerce. "The limits and counters likely share the problem."

Markers from SC-438: e2e `knownBug('SC-628', …)` `[MONT-W01]`, `[MONT-W02]` in
`e2e/specs/montage/wrong-values.e2e.ts` (fixtures `Montage/wrong-title.md`, `Montage/quoted-rounds.md`).
`[MONT-W03]` in the same file is SC-629's — not ours, leave it alone.

## Scott's rulings

(none yet)

## Owner rulings

- 2026-11-14 — **No Scott decision needed.** The ticket's own expected line ("a title of any scalar type is shown as
  text; a quoted number is read as a number") plus the twin ticket SC-638's owner rulings settle every choice below.
  Rulings are written to match SC-638's R1–R3 so the two trackers behave the same way.
- 2026-11-14 — **M1. Scalar title → shown as text.** A number or boolean `title:` (`2024`, `true`, `3.5`) is shown as
  its text ("2024", "true", "3.5") wherever the title appears (head, aria labels, the error-card / Notice prefix, any
  modal title that names the montage). `null` / absent / empty keeps today's behaviour. Same for any other text the
  montage reads from the block top level (`description` is already handled; check nothing else breaks).
- 2026-11-14 — **M2. Quoted number → read as a number.** In the six number keys (`rounds`, `success_limit`,
  `failure_limit`, `successes`, `failures`, `current_round`) a string that is a plain finite number after trimming
  (`"3"`, `" 3 "`, `"0"`) is read as that number. Every reader (board columns, tallies, outcome, limits window
  pre-fill, round arithmetic) sees a number; no `+=` ever concatenates. A string that is NOT a number (`banana`, `""`)
  is read as the parser default for that key (the same value an absent key gets: rounds 2, limits 0, counters 0,
  current_round 1). A boolean, map or list in a number key is read the same way (as the default).
- 2026-11-14 — **M3. Untouched values are written back as typed.** A value the montage did not change on that write
  is written back with the same value AND type the user typed: `title: 2024` stays `title: 2024` (never `"2024"`),
  `current_round: "1"` stays `"1"` after Add a hero, `rounds: banana` stays `banana` after a write that does not touch
  rounds. A value the montage DOES change is written as a plain number (`rounds: "3"` + Add a round → `rounds: 4`).
  SC-482's omit-absent-defaults rule is unchanged. (Value-level only: formatting, comments and quotes stay SC-599's —
  same boundary as SC-638 R2.) **SC-625 constraint:** `model.ts` carries unknown keys as own properties of the model
  and each entry, so never add a non-schema own property to the model or an entry to remember the typed value — use a
  module-private WeakMap (SC-637's negotiation approach) or extend the existing `recordingDefaults` record.
- 2026-11-14 — **M4. A map or list where the title should be → plain error card naming the key; the card writes
  nothing.** Same form as SC-638 R3 / encounter's `Invalid data: … must be …` (e.g. "Invalid data: 'title' must be
  text."). No raw JavaScript message (`is not a function`, `Cannot read properties`, `_a.`) reaches the card. A map or
  list in a number key follows M2 (read as the default), NOT an error, and is written back as typed per M3.
- 2026-11-14 — **Scope: montage only.** No negotiation code (SC-638 is the negotiation twin, another owner; its files
  are not ours). Do not extract a shared helper into the framework or out of another element; a montage-local helper
  (or reuse of an existing framework helper) is fine. Out of scope: SC-629, SC-631, SC-650 (other montage bugs),
  SC-630, SC-632 (design questions), SC-599 (formatting), SC-652. Entry-level and participant-level wrong types
  (`round: "2"` on a logged action, `name: 5` on a hero) are NOT in the ticket: r1 reports what they do today as a
  Follow-up (no fix), and I rule on them then.
- 2026-11-14 — **Markers:** `[MONT-W01]`, `[MONT-W02]` flip to plain tests (remove the `knownBug('SC-628', …)`
  wrapper; their assertions stay unless they contradict M1–M4). Update the file header comment so it no longer
  describes them as markers. New tests at unit + jsdom level for every input above; new e2e for: `title: true` (or a
  float) renders and round-trips unchanged after a write; `current_round: "1"` + End round → `current_round: 2`;
  `successes: "2"` (or a limit) + the write that increments it → a number; one M3 round trip (`title: 2024` stays
  `2024` after a write); one M4 error card (map title: plain error naming `title`, note byte-identical after the
  test's interactions). New e2e ids continue `MONT-W04…` (W03 is SC-629's). Never a bracketed ticket id in a test
  title. New fixtures under the e2e montage vault next to `wrong-title.md` / `quoted-rounds.md`.
- 2026-11-14 — **CHANGELOG** bullet under `## Unreleased` in the worktree superproject (one bullet, user-facing).
  ONE dse pointer bump at land-ready, superproject on current workspace origin/main, no interim pointer commits.
- Lifecycle: no new scenario expected; G-S132 reserved if one is needed.

## Baseline (dispatcher, at dse `afd1436c`)

jest 12922 passed / 2 skipped fresh (12923 / 1 with the shots cache) · lifecycle 64/64 · e2e `570/593 ok, 0 failed,
23 known-bug, coverage: 416/416 pairs` · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 ·
freeze 280/280 · parity 0/0/24.

Expected after the fix: e2e known-bug 23 → 21 (W01, W02 flip), ok = 572 + new e2e, total = 593 + new e2e,
coverage 416/416 (no new control — an error card has none). jest = 12922 + new tests, 2 skipped fresh. Lifecycle
64/64. If `styles.css` is byte-identical to a clean `afd1436c` build, shots/freeze/parity carry; otherwise run them.

## Rounds

- r1 implementer (orchestration:implementer, agent a14891da…) — brief `sc628-r1-implementer-brief.md`, report
  `sc628-r1-implementer-report.md`. Dispatched 2026-11-14. Start comment posted, state Awaiting (verified).
  r1 result (2026-11-14): DONE. dse `2181a008` on `afd1436c` (`30eb7aec` fix + unit + jsdom, `2181a008` e2e
  W04..W08 + fixtures + README); superproject CHANGELOG `e0f87b4b` on `c1825403` (origin/main now `51b3b6e5`,
  HANDOFF-only), no pointer bump. +210 jest (180 unit, 30 jsdom) + 4 e2eCensus from new fixtures. jest 13136/2 fresh,
  lifecycle 64/64, e2e `577/598 ok, 0 failed, 21 known-bug, coverage: 416/416 pairs`; styles.css `18730938…f1f9`
  identical to clean base → shots/freeze/parity carry. `src/` change: `model.ts` only (WeakMap of typed values,
  `setNumber` forgets on assign). `e2e/driver/dse.ts` `openNote` counts an error card as drawn (byte-identical to
  SC-638's branch version).
- 2026-11-14 — r1 follow-ups ruled:
  - **`description: 5` / `description:` a map is DROPPED on the next write — FOLD (r1b).** In scope by M1 ("Same for
    any other text the montage reads from the block top level"). A number or boolean description is shown as its text
    and written back as typed (M1 + M3); a map or list description → plain error card naming `description`, writes
    nothing (M4's form).
  - **Block body that is not a map (`hello`, a list, `5`) — next write replaces the whole body with `rounds: 3` —
    FOLD (r1b).** Same data-loss family, same file; matches SC-638's r1b fold. Plain error card ("Invalid data: the
    block must be a map of keys." or the encounter-style equivalent); the card writes nothing. An EMPTY block (nothing,
    or only whitespace/comments — parses to null/undefined) keeps today's behaviour (a fresh default montage).
  - **Entry-level wrong types (`round: "2"`, `hero: 5`, `result: 5` / a map, `entries:` as a map → entry dropped on
    next write; `skill: 5` / `note: 7` → those keys dropped) — FILE a Backlog ticket** (real data loss, but a separate
    surface — the logged-action list — and not in this ticket's text). Filed **SC-655** (Backlog, Medium, related
    SC-628). Out of scope for r1b.
  - **Hero `name: 5`, `skills_used` scalars, `_dse_anchor: 5`** — lose nothing. DROP.
  - **`null` in a number key → default, written as the default number** — ACCEPT (an empty value reads as absent;
    SC-482's omit rule governs it). No change.
  - **Reset / Set limits / Undo write assigned keys as numbers even when equal to the typed reading** — ACCEPT; matches
    M3 ("A value the montage DOES change is written as a plain number" — these writes assign the key). No change.
- r1b fold round (resume r1 implementer) — description + non-map body.
  r1b result (2026-11-14): DONE. dse `ff266522` on `afd1436c` (`a029ff25` fix + unit/jsdom, `59a96902` e2e W09/W10,
  `ff266522` lint cast). Superproject rebased on origin/main `51b3b6e5`: `581f1675` CHANGELOG, `f86fc621` CHANGELOG
  addendum; no pointer bump. jest 13188/2 fresh, lifecycle 64/64, e2e `579/600 ok, 0 failed, 21 known-bug, coverage:
  416/416 pairs`, styles.css identical to base.
- r2 reviewer (orchestration:reviewer, fresh identity) — dispatched 2026-11-14 on `ff266522`; brief `sc628-r2-reviewer-brief.md` (fill
  {{HEAD}}/{{BASE}}/{{EXPECTED}} from the r1 report before dispatch).
  r2 result (2026-11-14, agent ae0d2083…): LAND-READY on `ff266522`; HIGH 0, MEDIUM 0, LOW 1, INFO 5. Re-measured
  jest 13188/2, lifecycle 64/64, e2e `579/600 ok, 0 failed, 21 known-bug, coverage: 416/416 pairs`, styles.css same.
  174/260 unit+jsdom and 9/9 e2e red with model.ts at base. Report `sc628-r2-reviewer-report.md`.
- 2026-11-14 — r2 findings ruled:
  - **LOW-1 — FOLD (r3).** `correctMontageEntry` (`model.ts:644,653`) re-types an untouched tally when a correction
    changes only skill / note / round (`successes: "1"` → `1`): contradicts M3. Fix: skip both tally changes when
    `tallyKeyFor(existing.result) === tallyKeyFor(next.result)`; + one unit and one jsdom test.
  - **INFO-1 — FOLD (r3, with the rebase).** Take develop's `e2e/driver/dse.ts`; `{ errorCard: true }` in W08 and W10
    only; W01 stays without it (a regression to an error card must time out).
  - **INFO-2** (`PLAIN_NUMBER` accepts `"1e2"`, `"+4"`, `"4."`, `".5"`; `"0x10"`/`"Infinity"`/`"1_000"` → default) —
    DROP: consistent with M2; native `1e6` already could.
  - **INFO-3** (`""` whole body → error card; empty shapes as on base) — DROP: matches the ruling.
  - **INFO-4** (Set limits unchanged writes `" 3 "` as `3`) — DROP: already accepted.
  - **INFO-5** (rebase conflict only in `dse.ts` openNote hunk) — noted for r3.
  - r2 left a registered scratch git worktree `…/sc628-r2-rev/probe` in the branch's dse repo — owner removes it.
- 2026-11-14 — owner CHANGELOG read: FOLD into the next fix round — "The same goes for the brief:" → name it as the user
  sees it ("The same goes for `description:`"); "brief" is a code-internal word.

## Baseline moves

- 2026-11-14 (dispatcher) — SC-638 landed. dse `develop` now `12aaf5b5`, workspace main `9978681a`. Rebase onto
  `12aaf5b5`; superproject branch on current workspace main with the CHANGELOG commit and ONE pointer bump before
  land-ready. Numbers at `12aaf5b5`: jest 13032 passed / 2 skipped fresh (13033 / 1 with the shots cache) · lifecycle
  64/64 · e2e `576/597 ok, 0 failed, 21 known-bug, coverage: 416/416 pairs` · shots 592, host-leak 163/978, modal
  host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.
  **Shared driver change (SC-638, now on develop; dse-verify "Lifecycle and e2e notes"):** a test that EXPECTS an error
  card calls `openNote(rel, { errorCard: true })` (never the default); a click on an error-card root (no manifest id)
  uses raw wdio `el.click()`, not `dse.click`, or coverage fails with `selector:[object Promise] x click`. Our r1
  `openNote` change (accept error cards for every caller) is SUPERSEDED by develop's opt-in version: on rebase take
  develop's `e2e/driver/dse.ts` and move W01-negative / W08 / W10 (every error-card test) to the opt-in API.
  Expected for SC-628 on `12aaf5b5`: jest 13032 + 266 = **13298 passed / 2 skipped** fresh (our +266 = 260 new tests
  + 6 e2eCensus rows; recount if the rebase changes census); e2e **585/604 ok, 0 failed, 19 known-bug, coverage:
  416/416** (W01/W02 flip, +7 W04..W10); lifecycle 64/64.
- 2026-11-14 — owner: **empty block divergence from SC-638 is intended.** SC-638 landed "Invalid data: the block is
  empty." because the negotiation ALREADY refused an empty block on its base (SC-493; its ledger superseded its own
  "keep today's behaviour" premise). The montage base draws a default montage for an empty block (r1b measured), so
  our ruling — empty block keeps today's behaviour — stands. No change.
- r3 fix round (resume r1 implementer a14891da…) — rebase onto 12aaf5b5 + INFO-1 opt-in driver, LOW-1, CHANGELOG
  wording + squash, superproject on current main + ONE pointer bump, full battery. Dispatched 2026-11-14.
  Scoped re-review of the r3 delta → r2 reviewer ae0d2083… (did not author). Land-ready comment drafted
  `sc628-owner-landready-comment.md`; SKILL proposal `sc628-skill-proposal.md`.
  r3 result (2026-11-14): DONE. dse `10c271fe` on develop `12aaf5b5`; dse.ts = develop's (opt-in on W08/W10 only);
  LOW-1 fixed (+7 unit, +2 jsdom). Superproject on origin/main `ea6b4582`: `cb58849f` CHANGELOG (squashed),
  `afe583b0` pointer bump → `10c271fe`. jest 13307/2 fresh, lifecycle 64/64, e2e `585/604 ok, 0 failed, 19
  known-bug, coverage: 416/416 pairs`, styles.css identical to clean 12aaf5b5 → shots/freeze/parity carry.
  Side effect (accepted, M3): a hand-set `successes: 0` over a success entry stays 0 on a note-only correction.
- r4 scoped re-review (r2 reviewer ae0d2083…) of the r3 delta — dispatched 2026-11-14.
  r4 result (2026-11-14): LAND-READY, no findings. range-diff as expected; LOW-1 16 probes + mutant (6/9 red);
  error-card mutant fails W01/W04/W07 (not vacuous); montage jest 822 passed; e2e --element=montage 101/102 ok,
  0 failed, 1 known-bug (W03, SC-629).
- 2026-11-14 — **LAND-READY** reported to the dispatcher: dse `10c271fe` on develop `12aaf5b5`; superproject
  `cb58849f` CHANGELOG + `afe583b0` pointer bump on workspace origin/main `ea6b4582`; land-ready comment posted
  (state stays Awaiting until landed). Left for the dispatcher: the r2 reviewer's scratch git worktree
  `<scratchpad>/sc628-r2-rev/probe` is still registered in the branch's dse module repo
  (`git -C <wt>/draw-steel-elements worktree remove --force <path>` before or at `wt-rm`); SKILL proposal
  `sc628-skill-proposal.md`; preserve this ledger dir to build-ledgers at landing.
- 2026-11-14 — **LANDED / DONE.** Dispatcher landed: dse develop `10c271fe`, workspace main `69504cbd` (bookkeeping
  `430dd30b`); worktree removed (reviewer probe left registered/in place by the dispatcher); ledger preserved to
  `docs/superpowers/dse-overhaul/build-ledgers/sc628-montage-wrong-type-values/`; SKILL proposal applied. SC-628 set to
  Done via linear-post.py `--state Done` with a landed comment, verified (completedAt 2026-11-14T20:40:33Z).
