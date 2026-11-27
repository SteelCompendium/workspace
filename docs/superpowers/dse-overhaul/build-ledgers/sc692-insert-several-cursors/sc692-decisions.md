# SC-692 decisions ledger — an insert run with several cursors lays the block out for each cursor's own line

Effort: `sc692-insert-several-cursors`. Worktree `/home/scott/code/steelCompendium/worktrees/sc692-insert-several-cursors`,
plugin branch `sc692-insert-several-cursors` cut from dse `develop` @ `17187e4c`. Superproject base `c10bb25f`.
Owner session `e255a3cd-5cdb-4dc4-83be-b58e80eb1057` (owner on Opus 5.5 at Scott's request this session).
Filed by the SC-687 owner from the SC-687 r2 review (MEDIUM-1 follow-up); SC-687 ledger preserved at
`docs/superpowers/dse-overhaul/build-ledgers/sc687-insert-inside-block/`.

## Scott's rulings (verbatim, dated)

None yet. The ticket was filed by the SC-687 owner (agent), not Scott; no comments on the ticket at dispatch (2026-11-27).
Ticket text (agent-written, quoted for the spec):

> Place two or more cursors in a note (Alt-click) and run an insert command from the palette. The block is written at every
> cursor, but its layout is worked out for the main cursor's line only.
>
> Example: main cursor on an empty line, a second cursor at the end of `after text`. The second copy is written as
> ```` after text```ds-ct ````, so that counter is not drawn and the text below it can turn into code.
>
> Expected: either each cursor gets a block laid out for its own line (own line break, own callout or list prefix), or an
> insert with several cursors is refused with a message.

## Owner calls (ticket-owner, 2026-11-27 — not Scott rulings; Scott may overturn)

- **O1 — Lay out per cursor; do not refuse.** Of the ticket's two Expected options, each cursor gets a block laid out for
  its own line. Reason: inserting at several cursors already works today when every cursor is on an empty line; refusing
  would take that away. `planBlockInsert` only reads the cursor's own line (text before / after), so per-cursor planning
  is a small change at the one write place (`insertBlock`). Scott is told this at land-ready and may switch to refusal.
- **O2 — The rule, stated so it can be tested:** an insert with several cursors / selections writes exactly what
  single-cursor inserts would write if they were run one at a time **from the last range in the note to the first**
  (bottom-up; each sees the text the later writes left on its line). This covers two cursors on the same line (no blank
  or whitespace-only line appears between the two blocks) and cursors on adjacent lines.
- **O3 — One change, one undo.** All ranges are written in ONE editor change (`editor.transaction` with several changes,
  or equivalent); one Ctrl+Z restores the note. After the write every cursor is where a single-cursor insert would have
  put it for its block (the scaffold's first body character, or after the block); the main cursor stays the main.
- **O4 — SC-687's guard is unchanged:** if any range has an end inside a block or the properties, nothing is written
  at any cursor and one Notice shows (SC-687 behaviour, `insertRefusalFor`).
- **O5 — Scope.** Callers: Insert element commands (`insert.ts`), compendium reference and snapshot
  (`compendiumInsert.ts`) — all via `insertBlock` without a range. The `/ds` pick passes a range (one token) and stays
  single-range, unchanged. The compendium Shift inline link (`replaceSelection` of a one-line link) is already correct at
  every cursor and stays as is. Single-cursor output must be byte-identical to `17187e4c` (the SC-675 / SC-687 tests pin it).
- **O6 — Gates.** Full tsc / lint / jest / lifecycle / e2e (lifecycle drives the authoring paths). Shots / freeze / parity
  carry (636 / 280/280 / 0-0-24) only if the built `styles.css` is byte-identical to a clean `17187e4c` build; else run.

## Round log

- r1 implementer — dispatched 2026-11-27.
- r1 implementer — DONE. Plugin head `6b290e01` (`77fbd3a3` fix, `d0b30a8e` docs, `0270046a` e2e, `6b290e01` test
  rename), superproject `634cee2c` (CHANGELOG only); origin/develop still `17187e4c`. jest 15041 / 2 skipped (+23),
  lifecycle 64/64 (seven parts), e2e `944/964 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs` (+AUTH-I43..I50),
  styles.css sha256 identical to clean `17187e4c` (`50436d6b…0e37e98`): carry 636 / 280 / 0-0-24. Measured: one
  `transaction` with several changes = one undo step. Report `sc692-r1-impl-report.md`. Owner eyeballed
  `evidence/sc692-before.png` (second counter glued onto `after text`, raw YAML and code below) and
  `evidence/sc692-after.png` (two counters drawn, `after text` and `line below the text` paragraphs): both show what they claim.
- r2 reviewer — dispatched 2026-11-27 on `6b290e01`.
- r2 reviewer — FIX-REQUIRED (tests only) on `6b290e01`. Product correct everywhere probed: O2 270 jsdom cases + 22
  real-Obsidian cases byte-identical to bottom-up single inserts on base; O3 one undo / redo / cursors / main kept; O4 4/4;
  O5 156 single-range cases byte-identical. Gates matched (jest 15041 / 2; e2e `944/964 ok, 0 failed, 20 known-bug,
  540/540`; styles.css `50436d6b…` both). HIGH 0, MEDIUM 1, LOW 2, INFO 4. Report `sc692-r2-review-report.md`.

## Owner rulings on r2 findings (2026-11-27)

- MEDIUM-1 (same-line residue rule `blockInsert.ts:156/:158` unpinned; two mutants survive): fix in r3 — the reviewer's
  three jest cases with hand-written expected text, and show both mutants go red.
- LOW-1 (`blockInsert.ts:211` stale "replaceSelection" comment): fold into r3.
- LOW-2 (`_cmEditor.ts` `setSelections` honours `main`; real Obsidian makes the first range main): fold into r3 — make the
  harness match Obsidian if no existing test depends on `main`, else a comment stating the difference.
- INFO-1..4: no action.
- Follow-up "block under a list item inside a plain quote not drawn in Live Preview" (base too, single cursor): filed
  **SC-711** (Backlog, related SC-692 / SC-675). Screenshots copied to `evidence/rv2-single-quote-list-{lp,rv}.png`.
  Out of scope for r3.
- Follow-up "`/ds` typed at several cursors replaces only the main token": dropped — Obsidian's suggester is
  single-cursor by design, the other tokens stay as typed text, nothing is damaged; O5 scope.
- r3 fix round — implementer resumed 2026-11-27.
- r3 fix — DONE. Plugin head `e38f7838` (one commit on `6b290e01`), superproject `634cee2c` unchanged; origin/develop
  still `17187e4c`. `src/` diff vs `6b290e01` = two comment lines. MEDIUM-1: three hand-written jest cases; mutant
  `after = rest` → 2 red, mutant `.to.line` → 1 red (were 74/74 green). LOW-1 comment fixed. LOW-2: harness kept (tests
  at `insertRefusal.test.ts:387/:408` depend on `main`), comment added stating Obsidian ignores `main`. jest 15044 / 2
  skipped (+3). e2e / lifecycle / shots-freeze-parity carried (comment-only src). Report `sc692-r3-fix-report.md`.
- r4 scoped re-review — reviewer resumed 2026-11-27 on `e38f7838`.
- r4 re-review — LAND-READY on `e38f7838`. MEDIUM-1 / LOW-1 / LOW-2 closed (both mutants red; LOW-2 harness choice
  changes no test's meaning). jest 15044 / 2 fresh; tsc + lint clean; clean build of `e38f7838` gives main.js and
  styles.css byte-identical to `6b290e01`, so e2e / lifecycle / shots-freeze-parity carry. INFO-1 (`:170` length check
  on the parsed spec): dropped — the hand-written text at `:171` already fails on a merge. Report `sc692-r4-rereview-report.md`.

## LAND-READY (2026-11-27)

- dse `sc692-insert-several-cursors` @ `e38f7838` on `develop` @ `17187e4c` (5 commits, no rebase needed at report time).
- Superproject `sc692-insert-several-cursors` @ `634cee2c` on `main` @ `c10bb25f` (CHANGELOG only; pointer bump at landing).
- Gates: tsc (incl. `-p e2e`) + lint clean · jest 15044 passed / 2 skipped fresh · lifecycle 64/64 · e2e
  `OBSIDIAN-E2E done: 944/964 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs` · styles.css identical to clean
  `17187e4c` (`50436d6b…0e37e98`): shots 636, freeze 280/280, parity 0/0/24 carry. No freeze rebaseline.
- New e2e AUTH-I43..I50 (8), no new coverage pair, known-bug stays 20. New jest file insertSeveralCursors.test.ts (26).
- Filed SC-711. Posted land-ready comment, state In Progress + `Needs Review` (ask: keep per-cursor layout vs refusal;
  nothing blocks landing).
- For the dispatcher at landing: update `dse-verify` CURRENT with the numbers above; copy this ledger dir to
  `docs/superpowers/dse-overhaul/build-ledgers/` before `just wt-rm`.
