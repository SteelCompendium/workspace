# SC-592 decisions ledger — removing a condition in the minion pool modal rewrites the user's condition list in a different format

Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05.
Ticket: https://linear.app/tski-home/issue/SC-592
Worktree: `/home/scott/code/steelCompendium/worktrees/sc592-pool-modal-condition-rewrite`
(every submodule on branch `sc592-pool-modal-condition-rewrite`), cut 2026-11-11 from dse develop
`ec26b709`; superproject origin/main `f2cb454b`. wt-new log: `sc592-wt-new.log` (rc 0).

## Spec (ticket text, verbatim — no Scott comments on the thread as of 2026-11-11)

> Found by the SC-572 review. When a condition is removed in the minion pool modal, the whole
> block is written back. Conditions the user wrote as plain strings come back as `{key: ...}`
> objects, and quotes are dropped. The note still works, but the user's hand-written text
> changes shape when they only meant to remove one condition.
>
> Decide whether this is intended. If it is not, a removal should change only the condition
> that was removed.

Agent notes (ticket): SC-572 r2 reviewer INFO-4 (pre-existing). Similar class to SC-466 (writes
adding keys the user never wrote). Report: `.superpowers/sdd/sc572-pool-modal-condition-keyboard/sc572-r2-reviewer-report.md`.

## Baseline at ec26b709 (dispatcher, 2026-11-11)

jest 7207 passed / 1 skipped · lifecycle 54/54 · e2e `262/267 ok, 0 failed, 5 known-bug,
coverage: 164/164 pairs` (known bugs SC-257, SC-355, SC-384, SC-580, SC-588) · shots 592,
host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24.
Lifecycle runs in five `--only` parts: `G-S7a … G-S9a` 21; `G-S9b … G-S40` 16;
`G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` 9; `G-S57 G-S62 G-S61 G-S56` 4;
`G-S59 G-S49 G-S73 G-S77` 4. G-S56 stays LAST.

## Scott rulings (verbatim, dated)

(none yet)

## Owner rulings

- 2026-11-11 — Verdict on the ticket's question: NOT intended. Precedent: SC-466 (landed; owner
  verdict "LEAK, not intended normalisation", rule "a write changes only the fields the action
  touched"). Same class here: a parse-time normalisation (string → `{key}` object) leaking into
  the user's file on write-back. Scott is informed of the verdict in the land-ready comment (no
  ask), as on SC-466.
- 2026-11-11 — Before ruling on the fix's exact rule and layer (modal vs initiative model
  serializer; whether quote style is preserved), a bounded r0 survey (reviewer) maps the write
  path and options. No code in r0.
- 2026-11-11 — No new lifecycle phases unless a worker shows jest + e2e cannot cover it; never
  extend G-S64 (part 3 is at the ~480 s line). Lifecycle id G-S86 reserved if needed.
- 2026-11-11 — e2e: no bracketed ticket id in any test title (the runner parses titles for
  scenario ids).
- 2026-11-11 — Never `rm -rf` a `/tmp` glob (an SC-595 worker wiped other efforts' kept lifecycle
  FAIL dirs today). Delete only literal paths you created.

## Rounds
- 2026-11-11 — r0 survey (orchestration:reviewer, identity R0) dispatched on `sc592-brief-r0-survey.md`. Ticket Backlog → Awaiting. R0 must not review the implementation (it may be resumed as r1 design input only).
- 2026-11-11 — r0 survey DONE (R0, report `sc592-r0-survey-report.md`; probes in scratchpad
  `sc592-r0-survey-R0/`). Root cause is NOT the modal: `normalizeConditions`
  (`src/elements/initiative/model.ts:109-133`) turns every string into `{key}`, and `serialize`
  (`:406-419`, `stringifyYaml` of the whole model) writes it back on EVERY ds-initiative write
  (tracker clicks, Conditions modal, pool Apply/removal, form Save), even a no-op one. It also
  deletes unknown keys on condition objects (`source: trap` lost) and reorders object keys.
  Quotes/comments/flow-lists are lost on every write of every block (general stringifyYaml re-emit).

## Owner rulings on r0 (2026-11-11)

- FIX = survey option "A by holder", in `src/elements/initiative/model.ts` only (not the modal):
  at parse, record per holder (hero / squad-minion instance / regular instance) which condition
  keys the user wrote as plain strings (module-private WeakMap keyed by the holder, same pattern
  as SC-466's `model.ts`). At serialize, a condition entry whose key is in that holder's
  recorded set AND that still carries nothing but `key` is written back as a plain string.
  Everything else is written as today. Consequences that are intended:
  - a removal changes only the removed line (for shape); an unrelated write changes no condition's shape;
  - if the user later gives that condition an icon/colour/effect/duration via the Conditions modal,
    it becomes an object (it now has data a string cannot hold);
  - a condition the plugin adds itself keeps today's output (`- key: x`) — SC-466 rule: plugin-constructed
    output unchanged;
  - an object the user wrote as `- key: hexed` stays an object (survey: option D would break this; rejected).
- FOLD (same function, same class): authored condition objects keep their unknown keys on write
  (survey: `source: trap` deleted = data loss). Keep authored key order within an authored object
  where cheap; report if not.
- OUT OF SCOPE → filed SC-599 (Backlog): quotes, comments and flow-style lists are lost on every
  write of every block (needs a format-preserving writer, ~30 KB gzip `yaml` bundle; Scott's call to
  prioritise). Tell Scott in the land-ready comment that quotes are NOT preserved by SC-592 and why.
- OUT OF SCOPE → filed SC-600 (Backlog): instance list length ≠ amount regenerates instances,
  dropping their conditions (`model.ts:299-307`, `:337-347`).
- Legacy `parseEncounterData` (`EncounterData.ts`) has no source callers — leave it alone.
- Tests: update the pins the survey lists (survey answer 5) to the new shape, add jest for the
  rule (no-op write, removal, unrelated write, Conditions-modal edit promotes to object,
  plugin-added stays object, `- key: x` stays object, unknown keys survive, duplicates), and e2e
  steps in real Obsidian (pool removal leaves sibling strings as strings; an unrelated tracker
  write leaves strings as strings). No lifecycle phase.
- 2026-11-11 — Filed SC-599 (quotes/comments/flow lists lost on every block write) and SC-600
  (instance list ≠ amount drops conditions), both Backlog, related SC-592.
- 2026-11-11 — r1 implementer (identity I1) dispatched on `sc592-brief-r1-impl.md`. Review → a FRESH
  reviewer identity (V1), not R0 and never I1.
- 2026-11-11 — Dispatcher: SC-595 landed; dse develop now `94133a5a` (supersedes `ec26b709`; DseModal
  click guard + keymap re-push for modals opened from hover previews, the minion pool modal included;
  new lifecycle G-S83). New CURRENT: jest 7238 passed / 2 skipped (fresh worktree) · lifecycle 55/55
  (21 + 16 + 9 + 4 + 5; part 5 = `G-S59 G-S49 G-S73 G-S77 G-S83`, ~304 s; G-S56 still last) · e2e
  `262/267 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` · shots 592, host-leak 163/978, modal
  host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24. "Rebase onto 94133a5a before you
  report land-ready." → I1 told (SendMessage) to rebase onto 94133a5a; full battery of record on the
  rebased head. Reviewer brief base updated to 94133a5a.
- 2026-11-11 — r1 implementer I1 DONE: plugin head `1c66c5ca` on `94133a5a` (3623edf3 red test, 0261000f fix+pins,
  f856773e e2e POOL-C09/C10 + pins, 5f12f484 driver `noteConditionRaw`, 1c66c5ca COND-R06 pin); superproject
  CHANGELOG `90060d68` on f2cb454b. Rule: per-holder WeakMap of string-key counts; key-only (all non-key fields
  `undefined`) entry with a remembered key → string; authored objects keep unknown keys AND authored key order.
  Gates on 1c66c5ca: tsc/lint clean · jest 7258/2 · lifecycle 55/55 · e2e 264/269 ok, 0 failed, 5 known-bug,
  164/164 · shots 592, 163/978, 39/234, clip 147 · freeze 280/280 · parity 0/0/24. Red on 94133a5a: jest 22 fail;
  e2e POOL-C09/C10 + updated pins fail. Report `sc592-r1-impl-report.md`.
  Owner rulings on I1 follow-ups:
  - same key written as string AND object in one holder → falls back to entry identity (pinned): ACCEPT; reviewer checks.
  - key removed then re-added via plugin in the same in-memory holder comes back as a plain string: ACCEPT
    (deviation from the letter of "plugin-added keeps `- key: x`"; harmless, same parse, matches the user's own
    authoring); reviewer confirms it cannot leak across a re-parse or holder.
  - form Save not probed → reviewer probes it.
- 2026-11-11 — r1 review dispatched to fresh reviewer V1 on `sc592-brief-r1-review.md` (range 94133a5a..1c66c5ca).
- 2026-11-11 — Dispatcher: SC-593 landed; dse develop now `4f0c87f2` (supersedes 94133a5a; e2e/ only:
  `e2e/driver/census.ts`, `_census.e2e.ts`; plugin untouched). CURRENT unchanged: jest 7238/2 fresh (7239/1 css
  cached) · lifecycle 55/55 · e2e 262/267 ok, 0 failed, 5 known-bug, 164/164 · shots 592, 163/978, 39/234, clip 147
  · freeze 280/280 · parity 0/0/24. "Rebase onto 4f0c87f2 before you report land-ready."
  Owner ruling: do NOT rebase now (V1 is reviewing 1c66c5ca in the same worktree). After the review, the next I1
  round = rebase onto 4f0c87f2 (+ any fix findings). Since upstream changed e2e/ only, battery of record on the
  rebased head = tsc, lint, jest, full e2e; lifecycle/shots/freeze/parity carry from 1c66c5ca IF `src/` and
  `styles-source.css` are byte-identical to 1c66c5ca after the rebase (state the check). Any conflict in e2e/ →
  scoped range-diff check by the re-reviewer.
- 2026-11-11 — r1 review V1 DONE: LAND-READY, 0 BLOCKER/HIGH/MEDIUM, 2 LOW, 6 INFO (report `sc592-r1-review-report.md`).
  V1 gates on 1c66c5ca: tsc/lint clean · jest 7259/1 (css cached) · e2e 264/269 ok, 0 failed, 5 known-bug, 164/164.
  Mutants 10: 7 killed, M4 (no per-key count) real survivor, M6/M10 equivalent. Form Save never serializes
  ds-initiative (raw mode, `FormModal.ts:309`), byte-identical on no-op. Remove→re-add string confined to the same
  in-memory holder (P6). No source path clones holders.
  Owner rulings:
  - LOW-1 (`model.ts:202` per-key count untested, M4 survives): FOLD — test: user wrote `- grabbed`, plugin adds
    `{key:'grabbed'}` → `['grabbed', …, {key:'grabbed'}]`.
  - LOW-2 (`e2e/specs/conditions-modal/cond-rows.e2e.ts:98` COND-R06 accepts either shape, passes on base): FOLD —
    pin the exact shape.
  - INFO-2 (`- ""` used to write `key: ""` and error-card the block; HEAD keeps `""`): FOLD a jest pin only (no
    CHANGELOG change).
  - INFO-5 (stale comment `model.ts:128-130` "stay byte-compat" with the legacy oracle): FOLD — correct the comment.
  - INFO-1 (survey wrongly listed Form Save as a writer), INFO-3, INFO-4: DROP — no action; INFO-1 only fixes my
    draft comment's writer list.
  - INFO-6 (superproject behind origin/main): fold into r2 rebase.
- 2026-11-11 — r2 = resume I1: fold the four items above + rebase plugin onto `4f0c87f2` and superproject branch
  onto current origin/main. Battery of record on the r2 head: tsc, lint, jest, full e2e; lifecycle/shots/freeze/parity
  carry from 1c66c5ca iff `git diff 1c66c5ca <r2> -- src` is comment-only (INFO-5) and `styles-source.css` identical.
  Scoped re-review of the delta → V1 (did not author).
- 2026-11-11 — r2 I1 DONE: plugin `79da77f8` on dse develop `4f0c87f2` (r1 rebased: 8f2a4980 ea098d6b 0388c042
  16c7c6a1 b2c9bf2f; r2 79da77f8 folds LOW-1, LOW-2, INFO-2, INFO-5); superproject `e9c9b6c9` on origin/main
  `3eb1adbd` (CHANGELOG `## Unreleased` conflict, both bullets kept). Gates on 79da77f8: tsc/lint clean · jest 7262/1
  (css cached) · e2e 264/269 ok, 0 failed, 5 known-bug, 164/164. Carry check: src diff vs 1c66c5ca = model.ts
  comment only (+4/-2); styles-source.css identical → lifecycle 55/55, shots 592/163/978/39/234/clip 147, freeze
  280/280, parity 0/0/24 carry. LOW-1 mutant red (2 of 23); COND-R06 red on base model.ts. Owner verified logs
  (full e2e run, 1015 lines, POOL-C09/C10/COND-R06 ok), shas, ancestry, clean tree, no CHANGELOG markers.
- 2026-11-11 — r2 scoped re-review → V1 (resumed).
- 2026-11-11 — r2 re-review V1: LAND-READY, no new findings. range-diff r1 commits unchanged; M4 killed; COND-R06
  red on base; carry valid; CHANGELOG pure 8-line insertion. V1 gates on 79da77f8: tsc/lint clean · jest 7262/1 ·
  e2e 264/269 ok, 0 failed, 5 known-bug, 164/164.
- 2026-11-11 — Land-ready comment posted to SC-592 (no ask; state left Awaiting). Reported LAND-READY to dispatcher: dse 79da77f8 on 4f0c87f2, superproject e9c9b6c9 on 3eb1adbd. After landing: Done via linear-post.py --state Done, verify.
