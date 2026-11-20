# SC-675 decisions ledger — insert not at the start of an empty line breaks the block

Effort: `sc675-insert-nonempty-line` · worktree `/home/scott/code/steelCompendium/worktrees/sc675-insert-nonempty-line`
(dse branch `sc675-insert-nonempty-line`, cut from dse `develop` @ `129beb18`; superproject cut from `3a517cdf`).
Owner: Fable ticket-owner, dispatcher session `5812b474-3aec-46a6-8f06-0ef85cf1e10a`, spawned 2026-11-20.

## Scott rulings (verbatim, dated)

- **2026-11-20 (wave instruction, via dispatcher / HANDOFF.md):** "Data loss or broken on shipping elements" — SC-671,
  SC-672, SC-675, SC-679.
- **Ticket description (SC-675, created 2026-11-15), the Expected line, verbatim:**
  "Expected: the inserted block always starts on its own line and ends on its own line, with any text before or after
  the cursor kept on separate lines (or the insert is refused with a Notice). Inside a list item, every inserted line
  gets the item's indentation."
- No comments on the ticket as of 2026-11-20.

## Owner rulings

- **2026-11-20 O1 — split, not refuse.** The ticket allows either. The fix splits the block onto its own lines and keeps
  the text before and after the cursor. A refusal would make `/ds` typed mid-line a dead end. Scott may overrule.
- **2026-11-20 O2 — SC-462 (callout `> ` prefix dropped) is folded in.** Same root cause and the same helper: the
  inserted lines must carry the cursor line's container prefix. Building the prefix for list indentation only and
  widening it later for `> ` would be the same code written twice (Scott, working-preferences: "Stop trying to minimize
  work. We will always try to do the right thing ... Consistency is important."). `src/framework/host/blockPrefix.ts`
  (SC-455) is the existing pattern. Scott may overrule; SC-462 gets a pointer comment and is reported to the dispatcher.
- **2026-11-20 O3 — base is dse `develop` @ `129beb18`, not the unlanded SC-443 branch.** SC-443
  (`sc443-e2e-editor-insert` @ `ae9025ea`, unlanded, no reviewer round yet) holds the SC-675 markers: e2e `knownBug`
  AUTH-I21 and AUTH-S09, jsdom `test.failing` x3 in `test/dom/authoring/authoringKnownBugs.test.ts`, and the SC-462
  `test.failing` in `compendiumInsertMatrix.test.ts:280`. This branch does not stack on it. **Cross-effort note for
  SC-443: at its rebase it must turn those markers into plain tests.** The reviewer proves the fix against SC-443's
  specs on a scratch merge.
- **2026-11-20 O4 — no blank lines are added around the inserted block.** A blank line ends a callout; a fence may
  follow a paragraph line directly.
- **2026-11-20 O5 — gates.** r1 implementer: tsc, lint, jest, `styles.css` identity. Lifecycle and full e2e run once,
  on the final sha, after review. Shots / freeze / parity carry if `styles.css` is byte-identical to the base build.

## Baselines at dispatch (dse-verify CURRENT, develop @ `129beb18`)

tsc and lint clean · jest 13703 passed / 1 skipped with the shots cache (fresh worktree: 13702 / 2) · lifecycle 64/64 ·
e2e `OBSIDIAN-E2E done: 658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs` · shots 592 · freeze 280/280 ·
parity 0 / 0 / 24.

## Rounds

- **r1 (2026-11-20)** — implementer dispatched. Brief `sc675-brief-r1-implementer.md`.
- **r1 result (2026-11-20)** — implementer DONE_WITH_CONCERNS. dse `bb608f5b` (`68c800ed` test helper, `c9b03a90` fix +
  tests, `bb608f5b` docs); superproject `edb841fc` (CHANGELOG). Helper `src/authoring/blockInsert.ts`; new export
  `quoteMarkersOf` in `blockPrefix.ts`. jest 13816 / 2 fresh (+114 = `insertOwnLines.test.ts`), tsc + lint clean,
  `styles.css` `18730938…f1f9` identical to base. Shape for `- item|` and `- |`: marker line kept, block on the next
  lines at the item's continuation indent. Report `sc675-r1-implementer-report.md`.
- **2026-11-20 O6 — a block inserted inside a plain list item is indented under the item (the ticket's Expected line)
  even though it then draws but cannot save.** That save limit is not new and not this ticket: **SC-461** (Backlog,
  "a block indented inside a list item can't save its changes"), documented for users in `docs/writing-blocks.md`
  "What doesn't work yet". No new ticket. Callout and list-in-callout inserts do save. Scott may overrule (the
  alternative is refusing the insert inside a list item with a Notice).
- **Cross-effort note for SC-443 (extends O3):** its jsdom list-case marker (`insertOutcomeProblem(…, {indented:
  true})`) cannot flip as written, because `scanFences` (built on `matchFenceMarker`) does not see a fence indented
  inside a list item. At SC-443's rebase that marker needs a list-aware assertion; the other markers (reference
  mid-line, snapshot after text, SC-462 callout, e2e AUTH-I21, AUTH-S09) should become plain tests.
- Follow-up ruling: "4+ space whitespace-only line outside a list still gives an indented-code shape" → **drop**: same
  as before the fix, the cursor is already inside indented code there.
- **r2 (2026-11-20)** — independent reviewer dispatched on `bb608f5b`. Brief `sc675-brief-r2-reviewer.md`.
- **r2 result (2026-11-20)** — reviewer APPROVE_WITH_FIXES on `bb608f5b`: 0 CRITICAL, 0 HIGH, 1 MEDIUM, 2 LOW, 4 INFO.
  241 jsdom probes + 20 real-Obsidian runs, none worse than base. Gates re-measured: tsc / lint rc 0, jest 13816 / 2,
  `styles.css` identical. Implementer tests not vacuous (104 of 114 fail on base src). SC-443 scratch merge: clean, no
  conflicts; 5 of 6 markers flip; list marker does not (expected). Report `sc675-r2-reviewer-report.md`.
- **Owner rulings on the r2 findings (2026-11-20):**
  - **O7 — MEDIUM-1 → fix in r3. Supersedes the r1 brief's ~~"tab indentation (keep the exact whitespace
    characters)"~~.** Inserted list indentation is written as spaces (tab = next multiple of 4), because Obsidian Live
    Preview shows a parse-error card for a tab-indented block body. The inserted lines are new text, not the user's; the
    user's own characters on the cursor line are still never rewritten.
  - **LOW-1 (`- > [!note] T|` leaves the callout) → fold into r3** (small, same function).
  - **LOW-2 (a tail starting with a tab or 4+ spaces becomes indented code below the block) → drop.** No bytes lost;
    fixing it means rewriting the user's tail, which breaks the insert-only rule (brief §3 item 7).
  - **INFO-1 → cross-effort note for SC-443 (extends O3):** three NON-marker SC-443 tests pin the old output for an
    indented `␣␣/ds` token and must be rewritten at its rebase: `test/dom/authoring/dsSuggestMatrix.test.ts:133` and
    `:143`, e2e AUTH-S04 (`e2e/specs/authoring/ds-suggest.e2e.ts:77`). The tests are wrong, not the fix.
  - **INFO-2 (non-list indentation is carried, so the block draws but cannot save) → drop.** Base was broken for all of
    these; SC-461 (indented fences can't save) removes the limit when it lands.
  - **INFO-3 (whitespace-only tail stays) → drop**: harmless, trimmed by the next write.
  - **INFO-4 (block after a paragraph line indented 5+ spaces does not render) → drop**: base broken too; that line is
    indented code.
  - Test nit (`'\t- item'` is not a list) and CHANGELOG length/overclaim → fold into r3.
- **r3 (2026-11-20)** — fix round: implementer resumed. Brief `sc675-brief-r3-fix.md`.
- **r3 result (2026-11-20)** — implementer DONE. dse `f94be393` (`f77ee1a0` fix, `08e253c1` tests, `f94be393` docs);
  superproject `dfadecd9` (CHANGELOG bullet replaced with the owner's text). jest 13836 / 2 fresh (+20), tsc + lint rc 0,
  `styles.css` `18730938…f1f9` unchanged. MEDIUM-1 and LOW-1 fixed as prescribed. Not re-measured in real Obsidian by
  the implementer. Open point for the re-review: `- a⏎⇥- |` (an empty nested item under a paragraph line; `marked`
  reads the bare `-` as a setext underline). Report `sc675-r3-fix-report.md`.
- **r4 (2026-11-20)** — in parallel on `f94be393`: scoped re-review of the r3 delta (the r2 reviewer, resumed) and the
  final gates (lifecycle + full e2e; the implementer, resumed; brief `sc675-brief-r4-final-gates.md`).
- **r4 re-review result (2026-11-20)** — APPROVE_WITH_FIXES on `f94be393`. MEDIUM-1 fixed for one tab level and for
  ordered lists; LOW-1 fixed (block inside the callout, Reading draws it, + saves). New MEDIUM-2: in a bullet list
  nested with 2+ tabs (`- a⏎⇥- b⏎⇥⇥- c|`) Reading view does not draw the inserted block (r3 writes 10 spaces; Obsidian
  Reading draws at 4-9). Obsidian Reading counts a leading tab in a bullet list as 2 columns, ordered lists as 4. LOW-3:
  CHANGELOG list sentence overclaims. INFO-A (Live Preview shows a callout inside a list item as source: Obsidian's
  limit) and INFO-B (`- > - x|` lands in the quote, not under the inner item; saves). Gates: tsc / lint rc 0, jest total
  13838 (13834 / 4 in a scratch worktree with no superproject; 13836 / 2 in the sc675 worktree), `styles.css` unchanged.
  SC-443 merge unchanged from r2 (clean; same 5 jest + 3 e2e expected failures). Report `sc675-r4-rereview-report.md`.
- **Owner rulings on the r4 findings (2026-11-20):**
  - **O8 — MEDIUM-2 → option (a), fix in r5.** In a BULLET item each leading tab counts as 2 columns; ordered items
    keep 4 per tab. Obsidian is the only renderer that draws DSE blocks, so its measured reading wins over strict
    CommonMark. Refines O7 (still spaces only, never tabs, on inserted lines).
  - **LOW-3 → fix in r5** with the owner's wording (no "draws" claim).
  - **INFO-A → drop**: Obsidian's own limit, not the insert's. **INFO-B → drop**: rare, the block draws and saves.
  - Residual accepted now: a whitespace-only cursor line indented with 2+ tabs keeps r3's 4-per-tab width (the helper
    does not look at earlier lines to learn the list type). The r5 re-review measures it; it is recorded, not chased.
- **r5 (2026-11-20)** — fix round: implementer (resumed; the r4 gates run on `f94be393` is superseded and is re-run on
  the r5 sha). Brief `sc675-brief-r5-fix.md`.
- **r5 result (2026-11-20)** — implementer DONE. dse `3b47e55b` (`804224ad` fix, `d8fe4962` tests, `3b47e55b` docs);
  superproject `7df5aae8` (CHANGELOG line). jest 13855 / 2 fresh (+19), tsc + lint rc 0, `styles.css` `18730938…f1f9`
  unchanged, worktree clean. Bullet tab widths 4 / 6 / 8 (1 / 2 / 3 tabs); ordered unchanged. Superseded r4 gates on
  `f94be393`: lifecycle parts 1-3 all ok (21, 16, 9), part 4 3/4 (G-S61 torn-read, the SC-668 load flake, not re-run);
  parts 5-7 and e2e not started. Report `sc675-r5-fix-report.md`.
- **Observation (not this ticket; reported to the dispatcher):** `git fetch` in the dse clone brought a tag
  `7.0.0-rc.1` from origin, pointing at `129beb18`. No SC-675 worker created it (workers only fetched).
- **r6 (2026-11-20)** — in parallel on `3b47e55b`: scoped re-review of the r5 delta (the reviewer, resumed) and the
  final gates (the implementer, resumed; brief `sc675-brief-r6-final-gates.md`).
- **r6 re-review result (2026-11-20)** — **APPROVE** on `3b47e55b` (superproject `7df5aae8`). Real Obsidian, driving the
  insert: tab-nested bullets at 1 / 2 / 3 tabs, `*`, task items, callout list, ordered at 1 / 2 tabs all draw in Live
  Preview and Reading view inside the right item; + gives only the SC-461 Notice, file byte-identical. jsdom: 375 probe
  rows hold (one edit, one undo, surrounding text byte-identical, cursor on the first body character); differences from
  r4 are tab-led bullet rows only. New tests not vacuous (28 of 153 fail on r3 src). Gates: tsc / lint rc 0, jest total
  13857 (13855 / 2 in the sc675 worktree), `styles.css` unchanged. SC-443 merge: no conflicts; same expected-failure
  sets as r4 (jest 5: 3 marker flips + `dsSuggestMatrix:133/:143`; e2e authoring 3: AUTH-I21, AUTH-S09 flips +
  AUTH-S04). Report `sc675-r6-rereview-report.md`.
- **Owner rulings on the r6 findings (2026-11-20):**
  - **LOW-4 (`1. a⏎⇥- b|`: Reading view draws the block one level up, inside `a`) → accepted residual, no code
    change.** Rare shape, the block draws, nothing is lost, and it can't save in a list anyway. Recorded on SC-461
    (a pointer comment), which will rework how list-indented fences are read.
  - **INFO (whitespace-only cursor line under 2+ tabs: Reading view shows an error card, Live Preview draws) →
    accepted residual (O8), same pointer on SC-461.** No single width works in both views.
- **Residuals accepted at land-ready (all inside list items, none loses text):** LOW-2, INFO-2, INFO-3, INFO-4 (r2),
  INFO-A, INFO-B (r4), LOW-4 and the 2+ tab whitespace-only line (r6).
- **r6 final gates (2026-11-20)** — on `3b47e55b`, worktree clean: lifecycle **63/64** across all seven parts (21, 16,
  9, 3/4, 7, 4, 3); the one failure is **G-S61** on its torn-read line (0 stale frames), red in 3 runs on this sha and
  red the same way on a clean `129beb18` copy (SC-668; same precedent as the SC-652 and SC-656 landings). e2e
  **`OBSIDIAN-E2E done: 658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs`** (rc 0; summary lines checked by
  the owner in the logs). `styles.css` `18730938…f1f9` identical to base, so shots 592, freeze 280/280 and parity
  0 / 0 / 24 carry. Report `sc675-r6-final-gates-report.md`.
- **LAND-READY (2026-11-20).** dse `sc675-insert-nonempty-line` @ `3b47e55b` (9 commits on `develop` @ `129beb18`);
  superproject worktree @ `7df5aae8` (CHANGELOG; cut from `3a517cdf`, workspace `origin/main` is now `182cdaee`, so
  the landing rebases it; submodule pointer left unstaged for `wt-finish`). jest 13855 / 2 fresh (+153). No freeze
  delta, no lifecycle id used, no new e2e test or pair. Comments posted: SC-675 (land-ready summary, state Awaiting),
  SC-462 (fixed by this branch, close at landing), SC-461 (two leftover tab shapes). No new tickets filed.
  After landing: SC-675 → Done, SC-462 → Done. SC-443 cross-effort notes: O3, O6 note, INFO-1 above.
