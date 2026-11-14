# SC-627 decisions ledger — Montage "Add a hero" accepts a duplicate name

Ticket: SC-627 (Bug, Low). Owner: ticket-owner (Opus 5.5). Worktree:
`/home/scott/code/steelCompendium/worktrees/sc627-montage-duplicate-hero` (superproject
`c588bbaa` = workspace origin/main at creation; dse branch `sc627-montage-duplicate-hero` from
dse develop `7b9e82cf`).

## Ticket text (verbatim, the spec)

> On a board that already has Kira, Add a hero → "Kira" → Add writes a second `- name: Kira`.
> The board then shows two Kira rows. Both rows show the same logged actions, a quick-log on
> either row fills both, and the header says "2 heroes". The second row can never be logged on
> its own.
>
> Expected: Add a hero refuses a name already on the board and says why (as it already refuses
> an empty name).
>
> Open question for the fixer, not part of this bug: "kira" (other casing) is accepted today as
> a separate hero.

No Scott comments on the ticket as of 2026-11-14.

## Owner rulings (2026-11-14)

1. **Matching rule: trimmed, case-insensitive.** A typed name is "already on the board" when
   `typed.trim().toLowerCase()` equals some existing hero's `name.trim().toLowerCase()`.
   Reason: exact-case duplicates cause the mirroring bug; a casing-only variant ("kira" next to
   "Kira") is almost certainly a typo, and SC-631 already treats casing-blind matching as the
   expected montage behaviour for skills. Low-stakes and reversible; reported to Scott in the
   closing comment so he can overrule.
2. **How it refuses:** same channel as the empty name — the Add button is disabled while the
   typed name is taken — plus an inline message saying why, reusing the existing
   `.dse-mt__sheet-warn` element pattern from `LogActionModal.ts:236-252` (role="alert",
   `hidden` when not shown). Message text: `Kira is already on the board` (the board's spelling
   of the name). No new CSS: `styles.css` must stay byte-identical.
3. **Defence in depth:** the Add `onClick` re-checks, and the view's `onAdd` callback re-checks
   against the LIVE model at commit time (the board can change while the modal is open) and
   writes nothing on a duplicate. `addMontageHero` in `model.ts` stays a dumb append OR gains a
   guard — implementer's choice, but no write may happen for a duplicate.
4. **Existing names = hero entries only** (`isHero` items with a string name); bare non-hero
   items in `participants:` (SC-610 shapes) are ignored, never crash.
5. **Out of scope:** boards that ALREADY hold duplicate names (hand-written YAML) — leave
   behaviour unchanged; Enter in the name field (SC-632); outside-edit focus (SC-650); skill
   casing warning (SC-631); type coercion (SC-628).

## Rounds

- r1 implementer — DONE 2026-11-14, plugin head `da3c8009` (fix 27f97176, jsdom 82e43b33, e2e da3c8009). jest 12689/2, lifecycle 64/64, e2e 487/506 0 failed 19 known-bug 287/287, shots 592, freeze 280/280, parity 0/0/24, styles.css identical. Follow-up (dse-verify numbers bump) → dispatcher at landing.
- r2 reviewer (Opus, independent) — dispatched 2026-11-14 on `da3c8009`.

## ~~Baseline move (dispatcher, 2026-11-14) — superseded by the SC-637 baseline below~~

SC-440 landed: dse develop now `941b814f`, workspace main `ff1a195e`. Before land-ready: rebase
onto `941b814f`, superproject branch on current workspace main with ONE pointer bump. Numbers at
`941b814f` (dispatcher, verbatim): "jest 12875 passed / 1 skipped with the shots cache (fresh
12874 / 2, derived) · lifecycle 64/64 · e2e `560/586 ok, 0 failed, 26 known-bug, coverage:
416/416 pairs` · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze
280/280 · parity 0/0/24."
Expected after rebase (SC-627 adds 8 jsdom, flips MONT-H07, adds MONT-H08/H09): jest fresh
12882 / 2 (12883 / 1 with shots cache) · e2e `563/588 ok, 0 failed, 25 known-bug, coverage:
416/416 pairs` · lifecycle 64/64 · shots 592 · freeze 280/280 · parity 0/0/24.
Owner plan: let the r2 review finish on `da3c8009` (SC-440 is the settings-tab e2e, disjoint from
montage), then one rebase + full-battery round after any fix round, then the superproject bump.

## Baseline move 2 (dispatcher, 2026-11-14) — CURRENT, supersedes the SC-440 baseline above

SC-637 landed: dse develop now `620d5774`, workspace main `11ee0b00`. Rebase onto `620d5774`,
superproject branch on current workspace main with ONE pointer bump. Numbers at `620d5774`
(dispatcher, verbatim): "jest 12913 passed / 2 skipped fresh (12914 / 1 with the shots cache) ·
lifecycle 64/64 · e2e `567/591 ok, 0 failed, 24 known-bug, coverage: 416/416 pairs` · shots 592,
host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24."
Expected after rebase: jest fresh 12921 / 2 (12922 / 1 with shots cache) · e2e `570/593 ok,
0 failed, 23 known-bug, coverage: 416/416 pairs` · lifecycle 64/64 · shots 592 · freeze 280/280 ·
parity 0/0/24. Plan unchanged: rebase after the r2 review.

## r2 review rulings (owner, 2026-11-14)

r2 verdict LAND-READY, 0 HIGH / 0 MEDIUM / 3 LOW / 5 INFO (report `sc627-r2-review-report.md`).
- LOW-1 (board-side trim mutant M2b survives) — FOLD into r3: one jsdom case with a padded hero name on the board.
- LOW-2 (outside-edit jsdom test mutates the model in place; mutant M4b survives) — FOLD into r3: replace `view.model` in the test instead of mutating it.
- LOW-3 (manifest comment says rows cite H07-H09, rows list only H01-H05) — FOLD into r3: add the ids to the rows (or reword if the rows' shape forbids it).
- INFO x5 — DROP: all are pre-existing or bypass-only behaviour (silent close on a bypassed check, empty-name mutant, 15.6 px growth only when the message shows, focus on a disabled Add as for an empty name, SC-625 key order unchanged).

## Rounds (cont.)

- r2 reviewer — DONE, LAND-READY on `da3c8009`; gates matched the implementer's.
- r3 implementer (resume of r1) — fold LOW-1..3, rebase onto dse `620d5774`, full battery.
- r3 implementer — DONE: rebased onto dse `620d5774`, head `afd1436c` (de3e6339 fix, b620d697 jsdom, d4b0c580 e2e, afd1436c LOW fixes). jest 12923/1 with cache (12922/2 fresh), lifecycle 64/64, e2e 570/593 0 failed 23 known-bug 416/416, shots 592 163/978 40/240 147, freeze 280/280, parity 0/0/24, styles.css identical. M2b and M4b now red.
  - Follow-up "warning shows a hand-padded board name with its padding" — DROP: the warn is a normal-flow div, HTML collapses leading/trailing/double spaces, so it renders as "Kira is already on the board".
- r4 reviewer (resume of r2) — scoped re-review of the r3 delta + rebase range-diff + one screenshot of the refusal for Scott.
- r4 reviewer — LAND-READY on `afd1436c`: range-diff all `=`, LOW-1..3 closed, M2b/M4b/M4c red; 0 LOW, 2 INFO. INFO 1 (view-only snapshot mutant needs a bypassed window AND a replaced model; replacing the model closes the window in real Obsidian) — DROP. INFO 2 (padded spelling) — DROP, same reason as the r3 follow-up. Screenshot `sc627-r4-duplicate-refused.png` eyeballed by owner: orange italic message under the field, dimmed teal Add.
- r5 chore — superproject: ff the worktree branch to workspace origin/main, ONE pointer bump of draw-steel-elements to `afd1436c`.
- r5 chore — DONE: superproject branch at `88915b63` = one commit `chore: bump draw-steel-elements to afd1436c (…)` on workspace origin/main `28ed9439`; status clean.
- Owner posted the result comment on SC-627 (with screenshot; casing call flagged as overrulable). State left Awaiting.

## LAND-READY (2026-11-14)

dse branch `sc627-montage-duplicate-hero` @ `afd1436c` on develop `620d5774`; superproject branch @ `88915b63` on workspace main `28ed9439`. Landing = dispatcher (land-stack). At landing: dse-verify CURRENT bump (jest 12922/2 fresh, e2e 570/593 0 failed 23 known-bug 416/416), then Done via linear-post.py `--state Done` and verify.
- Dispatcher (2026-11-14): add a CHANGELOG `## Unreleased` bullet commit under the pointer bump (origin/main 28ed9439 → changelog → ONE bump). Owner wrote the bullet (`sc627-changelog-bullet.md`); r6 chore restacks.
- r6 chore — DONE: superproject branch `4566c527` = origin/main `28ed9439` → `3f338ece` CHANGELOG bullet → `4566c527` ONE pointer bump to dse `afd1436c`. Status clean. LAND-READY again.
