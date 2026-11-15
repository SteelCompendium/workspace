# SC-631 decisions ledger — montage "skill already used" warning ignores casing

Ticket: SC-631 (Linear, Backlog → Awaiting 2026-11-14). Labels: DSE Plugin, Bug. Project DSE 7.0.0.
Worktree: `/home/scott/code/steelCompendium/worktrees/sc631-montage-skill-casing` (branch
`sc631-montage-skill-casing` everywhere), dse `develop` `3e88b3f5`, superproject workspace main `7cea83eb`.

## Ticket (verbatim)

> In the Log an action window, the montage warns when a hero uses a skill they already used. It compares
> the text exactly, so "nature" after "Nature" gets no warning. The warning never blocks the log, so
> nothing breaks; the Director just misses the reminder.
>
> Expected: the warning ignores casing (and probably surrounding spaces).

Agent notes: `src/elements/montage/model.ts` `wouldReuseSkill` (now ~:602). SC-438 left a jsdom
`test.failing` marker `[K04]` in `test/dom/elements/montage-matrix.test.ts` (~:1619). No e2e knownBug.

No Scott comments on the ticket as of 2026-11-14.

## Owner rulings (2026-11-14)

1. **Matching rule: trimmed, case-insensitive** — the SC-627 rule. A typed skill is "already used" when
   `typed.trim().toLowerCase()` equals some entry of the hero's `skills_used` compared the same way. The
   `excluding` subtraction (editing an entry) uses the same comparison. Reason: the ticket states it as the
   expected behaviour; SC-627 chose the same rule for hero names. Low-stakes and reversible; reported to
   Scott in the closing comment so he can overrule. No Scott decision needed to proceed.
2. **The warning names the skill as the board stores it** (the SC-627 "board's spelling" rule): typing
   "nature" after "Nature" shows `Kira already used Nature in this montage — reuse is not allowed`.
3. **Warn, never block — unchanged.** No write-path change: the logged skill is recorded as typed (as
   today); `skills_used` is not deduplicated or recased. Log stays enabled.
4. **Never crash on odd YAML**: non-string or blank items in `skills_used` (SC-610 / SC-628 shapes) are
   ignored by the comparison, as today.
5. **Tests**: the jsdom `[K04]` marker becomes a plain test (drop "known bug SC-631" from its title);
   unit tests on `wouldReuseSkill` for casing, padding, the edit exclusion in other casing, odd items; one
   new e2e `MONT-L12` in `e2e/specs/montage/log-modal.e2e.ts` (padded other-casing skill shows the warning
   in the board's spelling, Log stays enabled). Never a bracketed ticket id in a test title.
6. **User-facing**: one CHANGELOG bullet under `## Unreleased`.
7. **Out of scope**: SC-650, SC-655, SC-658, SC-630, SC-632; exact-match removal on undo/correct/remove
   (report as a follow-up if it matters).

## Rounds

- r1 implementer — dispatched 2026-11-14 on `3e88b3f5`. Brief `sc631-r1-implementer-brief.md`.
- r1 implementer — DONE 2026-11-14, dse head `ea9749ab` (fix `271efd9e`, tests `91fbe0b2`, MONT-L12 Cancel
  `ea9749ab`); superproject `9c022c93` (CHANGELOG `92341d64` + one pointer bump) on `7cea83eb`. jest 13330/2,
  lifecycle 64/64, e2e 593/609 0 failed 16 known-bug 416/416, shots 592 (163/978, 40/240, clip 147), freeze
  280/280, parity 0/0/24. First e2e run had MONT-L12 leave its sheet open (orphaned modal); fixed with Cancel.
  - Follow-up "undo/correct/remove match the stored skill exactly" — **dropped**: every write the plugin makes
    records the typed text in both `entries[].skill` and `skills_used`, so exact removal is correct for them;
    only a hand-edited casing mismatch could leave a stale item, and that only affects the warning.
  - Follow-up "dse-verify note stale + e2e number" — proposal file `sc631-skill-proposal.md` for the dispatcher
    at landing (owners don't edit SKILL.md).
- r2 reviewer (Opus, independent) — dispatched 2026-11-14 on `ea9749ab`.
- r2 reviewer — APPROVE 2026-11-14 on `ea9749ab`: 0 HIGH / 0 MEDIUM / 2 LOW / 3 INFO. jest 13331/1 (shots cache),
  e2e 593/609 0 failed 16 known-bug 416/416; mutants killed except m3 (exclusion compared exactly). Owner rulings:
  - LOW-1 (edit sheet can name the wrong stored spelling with `[nature, Nature]`) — **fold** into r3: exact item
    first, then the case-insensitive fallback, as the reviewer prescribed; unit test.
  - LOW-2 (no test for the case-insensitive exclusion; m3 survived) — **fold** into r3.
  - INFO-1 (stored skill with spaces printed with them) — **fold**: print the stored spelling trimmed.
  - INFO-2 (other exact comparisons: `findParticipant`, `removeSkillOccurrence`, `sameSkill`) — **dropped**: only
    hand-edited YAML reaches them, ruling 7 keeps them out of scope, same reason as the r1 follow-up.
  - INFO-3 (dse-verify stale) — already in `sc631-skill-proposal.md`.
- r3 implementer fix round (resume of r1) — dispatched 2026-11-14.
- 2026-11-14 dispatcher: SC-648 landed — new baseline dse `develop` `e1be1775`, workspace main `004a6394`. Numbers
  at e1be1775: jest 13327/2 fresh · lifecycle 64/64 · e2e `596/611 ok, 0 failed, 15 known-bug, coverage: 417/417
  pairs` · shots 592, 163/978, 40/240, clip 147 · freeze 280/280 · parity 0/0/24. Rebase both before land-ready;
  full battery on the rebased head (expected jest 13327 + SC-631 tests; e2e 597/612 ok, 0 failed, 15 known-bug,
  417/417). Sent to the r3 implementer as an add-on.
- r3 implementer — DONE 2026-11-14: LOW-1, LOW-2, INFO-1 fixed (`2ae9d719`, `2777484c`); rebased onto `e1be1775`
  (dse head `2777484c`, no conflicts); superproject `47b35b4b` (CHANGELOG `5531ae71` + one pointer bump) on
  workspace main `f770cc3b` (one docs-only commit past `004a6394`). Full battery on the rebased head: tsc/lint
  clean · jest 13335/1 with shots cache (13334/2 fresh) · lifecycle 64/64 · e2e 597/612 0 failed 15 known-bug
  417/417 · shots 592 (163/978, 40/240, clip 147) · freeze 280/280 · parity 0/0/24.
- r4 scoped re-review (r2 reviewer resumed; not the author) — dispatched 2026-11-14 on the delta `6b9cdf34..2777484c`.
- r4 scoped re-review — APPROVE 2026-11-14 on `2777484c`: 0 findings; mutants r4m3/r4m5/r4m6 killed; branch shape
  verified (2 superproject commits on `f770cc3b`). **LAND-READY**: dse `2777484c` on `e1be1775`, superproject
  `47b35b4b` on `f770cc3b`. SKILL proposal `sc631-skill-proposal.md` for the dispatcher. Ticket left Awaiting.
- 2026-11-14 LANDED by the dispatcher: dse develop `2777484c`, workspace main `05104110` (bookkeeping `0a6aaebf`);
  worktree removed; ledger preserved in build-ledgers; SKILL proposal applied. Owner posted the Done comment and set
  SC-631 **Done** via linear-post.py `--state Done`; verified with get_issue (status Done). Effort closed.
