# SC-583 decisions ledger — condition keys match regardless of case

Ticket: SC-583 (Linear). Owner: ticket-owner (Opus 5.5). Worktree:
`/home/scott/code/steelCompendium/worktrees/sc583-condition-key-case` (branch `sc583-condition-key-case`
in every submodule). Base: dse develop `93e8e48c`, workspace origin/main `eccfe90e`.

## Ticket (verbatim, 2026-11-12)

> Condition keys are case-sensitive. If a note says `key: Dazed` instead of `key: dazed`, the tracker shows it
> as a custom condition. Picking Dazed from the Conditions window then adds a second, lowercase `dazed`, so the
> creature carries Dazed twice.
>
> **Repro:** in an initiative block, hand-write a condition `{ key: Dazed }` on a creature. Open its Conditions
> window and pick Dazed. The note now holds both `Dazed` and `dazed`.
>
> **Expected:** a standard condition key matches regardless of case, and picking it does not create a duplicate.
>
> Agent notes: SC-436 `test.failing` marker: with `key: Dazed` present, picking Dazed leaves exactly one dazed
> condition (compared case-insensitively) in the written note.

(Owner check 2026-11-12: no SC-583 knownBug marker exists in `e2e/` at 93e8e48c — the new e2e tests are plain tests.)

## Scott rulings

(none yet)

## Owner rulings (2026-11-12) — design rules for the fix

- O1. **Recognition.** A condition whose key equals a standard condition key ignoring case is that standard
  condition everywhere it is read: name, icon, badges, the Conditions window row (standard, not custom), the Add
  menu (treated as already present), the minion pool modal (SC-574), the sidebar.
- O2. **No duplicate on pick.** Picking a standard condition that is already present under another casing behaves
  exactly as picking it when present in canonical lowercase does today (no second entry in the note).
- O3. **Preserve what the user wrote.** Reading or re-serializing a block never rewrites a hand-written key's
  casing (precedent SC-592: a plain-string condition stays plain on write). The bytes of a condition the user did
  not edit are unchanged after any write. Edits to that condition (duration, colour, effect, remove) find and act
  on the hand-written entry.
- O4. **One key-equality rule.** Key comparison in the conditions path goes through one case-insensitive helper,
  used at every site that compares condition keys (standard and custom alike — a hand-written custom `Hexed` and an
  added custom "hexed" must not duplicate either).
- O5. **Existing duplicates are not silently merged or deleted** by reading a note that already holds both `Dazed`
  and `dazed`. Report what the UI shows for it; no data loss.
- O6. New e2e scenario ids use the unused `[COND-K..]` family (K = key case) to avoid colliding with parallel
  Conditions-window branches (SC-581/582/585/586/613/614). No bracketed ticket id in any test title (SC-577).
- O7. Do not change `visual-harness` fixtures (freeze must stay 280/280). New e2e fixture content goes in a NEW
  note, not `Initiative/conditions.md` (whose contents other COND tests assert).

## Rounds

- r1 implementer (Sonnet, dispatched 2026-11-12): survey + implement + gates. Brief `sc583-r1-brief.md`, report `sc583-r1-report.md`.
- r1 DONE 2026-11-12: dse head 6453bc5d (bd68fe63 fix+jest, d7916d03 e2e COND-K01..K05, 6453bc5d removed jest test.failing SC-583 marker). jest 10759/2, lifecycle 60/60, e2e 290/293 ok 0 failed 3 known-bug 172/172, shots 592, freeze 280/280, parity 0/0/24.
- r2 reviewer (Opus, dispatched 2026-11-12) on 6453bc5d: brief `sc583-r2-review-brief.md`, report `sc583-r2-review.md`.

## Follow-up rulings (owner, 2026-11-12, r1 report)

- F1 Add menu has no "already added" cue → filed **SC-617** (Backlog, related SC-583). Out of scope for SC-583.
- F2 duplicate `titleCaseKey`/fallback glyph in kit vs elements → drop (kit/elements import boundary is by design).
- F3 a note holding both `Dazed` and `dazed` keeps both, no dedupe affordance → drop (O5 by design; only reachable by hand-written YAML).
- F4 INFO-2 stale-click identity note in `initiative/view.ts` → drop (pre-existing, already documented, unrelated to key case).
- Jest `test.failing('SC-583 …')` marker in `test/dom/views/conditions-modal-matrix.test.ts` (owner's check missed it — looked only in e2e/) went green and was removed by r1 (known-bug rule). Reviewer to confirm coverage.

## r2 review rulings (owner, 2026-11-12) — verdict APPROVE, 0 HIGH / 0 MEDIUM / 1 LOW / 4 INFO

- LOW-1 (COND-K05's "already present twice" pick asserts nothing) → **fold into r3 fix round**.
- INFO-1 (`initiative/model.ts:172,199` exact-case maps need a why-comment) → **fold into r3**.
- INFO-2 (custom keys with spaces / non-ASCII still duplicate via slug) + INFO-3 (`key: High Ground` not recognised as `high-ground`) → filed **SC-618** (Backlog, related SC-583). Out of scope.
- INFO-4 (two rows share "Remove Dazed"/"Customize Dazed" accessible names when both `Dazed` and `dazed` exist) → drop (O5 hand-written-only edge, predates branch).
- Reviewer confirmed: deleted jest marker is covered by `conditions-modal.test.ts:703`; SC-592 maps must stay exact-case (probe 9/9).
- r3 (implementer resume): LOW-1 + INFO-1, then the superproject CHANGELOG entry (`sc583-changelog-entry.md`) + ONE pointer bump on current workspace origin/main. Scoped re-review of the r3 delta by the r2 reviewer (resume; it did not author any code).
- r3 DONE 2026-11-12: dse head d0561a68 (LOW-1 + INFO-1). Superproject sc583-condition-key-case on origin/main eccfe90e: 67be12c8 CHANGELOG, bbbe6d79 pointer bump → d0561a68. jest 10760/1/0, e2e 290/293 ok 0 failed 3 known-bug 172/172.
- r4 scoped re-review (r2 reviewer resumed) of the r3 delta: report `sc583-r4-rereview.md`.
- r4 APPROVE 2026-11-12 (no HIGH/MEDIUM/LOW). INFO-A (comment wording at model.ts:173 could also name the window's duplicate check) → drop: not misleading, and a change would cost a new pointer bump + re-gates.
- LAND-READY 2026-11-12: dse d0561a68, superproject bbbe6d79 on origin/main eccfe90e.
