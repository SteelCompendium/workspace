# SC-619 decisions ledger

Ticket: SC-619 "DSE: in a note saved with Windows line endings, + / - in a hover preview does
nothing when an identical counter sits elsewhere in the note" (Linear, Backlog -> picked up
2026-11-13).

Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05.

## Worktree

- `/home/scott/code/steelCompendium/worktrees/sc619-crlf-hover-refusal`
  (superproject 6630f0e5 = workspace origin/main at creation; every submodule on branch
  `sc619-crlf-hover-refusal`).
- dse base: develop `1f1ae442`.

## Baseline at 1f1ae442 (from dispatcher)

- jest 11788 passed / 2 skipped (fresh, without the shots cache)
- lifecycle 62/62 in seven `--only` parts:
  1. `G-S7a ... G-S9a` (21)
  2. `G-S9b ... G-S40` (16)
  3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9, full)
  4. `G-S57,G-S62,G-S61,G-S56` (4; G-S56 stays LAST in SCENARIOS order)
  5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7, full; G-S91 known flake SC-616: re-run part 5 alone)
  6. `G-S92,G-S96,G-S97,G-S99` (4, full; SC-622: restore demo-vault/.obsidian/appearance.json if G-S97 fails)
  7. `G-S108` (1, ~67 s, has room) -> new scenario id if needed: **G-S112**, goes in part 7.
- e2e `330/333 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (known bugs SC-257, SC-355, SC-384)
- shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147
- freeze 280/280 · parity 0/0/24

## Scott's rulings (verbatim, dated)

- 2026-11-10 (standing, for unsure writes): "Save nothing with a notice is fine."

## Ticket statement (from the description, 2026-11-12, filed by SC-607 r3)

A note saved with CRLF, two identical counters, hover preview of a heading link to one of
them open; a + writes nothing and shows the "changed on disk first" Notice although nothing
changed. LF note: saved. Expected: the + is saved into the hovered counter. Never writes the
wrong counter (safe, annoying). Repro cell `crlf-ctl` in
`docs/superpowers/dse-overhaul/build-ledgers/sc607-open-preview-stale-card-write/sc607-r3-review-report.md`
(lines ~77, ~223). Suspected: part text vs note text compare in `cardLinkLine` (SC-594) with `\r\n`.

## Out of scope

- SC-621 (one-sided-edit gap for part-of-note pins in `rebaseCardPin`) - queued after this, same code. Do not fix here.
- SC-616 (G-S91 flake), SC-585 - parallel owners.

## Rounds

- r1 (diagnosis + fix design + failing tests): orchestration:reviewer. Report `sc619-r1-diagnosis.md`.
  Dispatched 2026-11-13 (brief `sc619-r1-brief.md`). Ticket flipped Backlog -> Awaiting.

## Land-ready checklist (owner)

- dse branch rebased on current origin/develop; full dse-verify battery at the numbers above
  (+ any new tests / G-S112).
- superproject branch on current workspace origin/main: a CHANGELOG `## Unreleased` bullet
  commit (worktree's CHANGELOG, never the main checkout's) + exactly ONE pointer bump, no
  interim pointer commits.
- SKILL.md proposals only as files in this dir (`sc619-skill-proposal.md`); owners don't edit SKILL.md.
- Author-independence: r1 diagnosis = reviewer A; implementation = implementer B; review = a fresh reviewer C.

### r1 result (2026-11-13, reviewer A)

- Root cause: `cardLinkLine` (ReadingModeBlockHost.ts:1118-1126 @1f1ae442). Obsidian 1.15.1
  slices a heading HOVER's part from heading-content-end + 1 char: LF note skips the LF, CRLF
  note skips only the CR -> part starts with a stray `\n`, every line one lower, compare fails.
  Affects heading hovers (RV + LP; + and form Save), unique or twinned. Block hover, embeds,
  whole-note: saved at base.
- Failing tests commit `7ef96b18` (`test/dom/framework/reading-mode-host-crlf-hover.test.ts`, 19 tests, 7 red).
- Fix design (prototype `scratchpad/sc619-r1-reviewer/r1-fix-prototype.diff`, +10/-4): in
  `cardLinkLine`, hover + no blockId + part starts with `\n` + note's heading line ends `\r\n`
  -> drop that LF, `rel = relLine - 1`. Prototype: real Obsidian 31/31 cells LF outcome,
  CRLF refusals still refuse; jest expected 11807 passed / 2 skipped.
- Owner ruling: adopt the design. G-S112 in lifecycle part 7 (phases a-d save, e-f refuse, g no-blank-line).
- Unmeasured (implementer to note, not block): CR-only notes (SC-460) -> branch does not fire.

## Baseline update (2026-11-13, dispatcher: SC-585 landed)

dse develop now `3a5986d3`, workspace main `22732287`. Rebase onto 3a5986d3 (superproject
branch onto current workspace main, one pointer bump) before land-ready. New CURRENT baseline:
jest 11794 passed / 2 skipped (fresh) · lifecycle 62/62 (seven parts) · e2e `331/334 ok,
0 failed, 3 known-bug, coverage: 176/176 pairs` (new COND-R07) · shots 592, host-leak 163/978,
modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24. SC-585 touched only
Conditions window code/tests/docs. Expected on sc619 branch: jest 11794 + 19 (r1) + r2's N;
lifecycle 63/63; e2e 331/334.

### r2 result (2026-11-13, implementer B)

dse `19942fe6` on develop `3a5986d3` (c42205cf r1 tests, c90638ca fix +1 test, 19942fe6 G-S112).
Superproject changelog `e66cd274` on workspace origin/main `b31eb542`, no pointer bump.
Battery on 19942fe6: jest 11814/2 skipped; lifecycle 63/63; e2e 331/334 0 failed 176/176;
shots 592 / 163/978 / 40/240 / clip 147; freeze 280/280; parity 0/0/24.
Follow-ups (owner rulings): CR-only (SC-460) unmeasured, worst case refusal -> drop (safe,
reviewer to probe); mixed-EOL under a future Obsidian slice change -> refusal only, drop;
jest cannot model RV vs LP -> covered by G-S112 b, drop.
- r3 (independent review): fresh orchestration:reviewer C, brief `sc619-r3-brief.md`.

## Baseline update (2026-11-13, dispatcher, verbatim)

"New baseline: SC-616 landed (harness only, visual-harness/obsidian-lifecycle.mjs G-S91). dse develop is now 1cc54eac, workspace main 6c9af039. Rebase onto 1cc54eac (and your superproject branch onto current workspace main, one pointer bump) before you report land-ready. Battery numbers are unchanged: jest 11794/2, lifecycle 62/62 in seven parts, e2e 331/334 ok, 0 failed, 3 known-bug, 176/176; main.js and styles.css identical to 3a5986d3."
Supersedes 3a5986d3 as base. Owner: r3 is reviewing 19942fe6 in the worktree, so the rebase +
re-gate is a separate round (r4, implementer B resumed, folded with any r3 fixes) AFTER r3
returns, never concurrent. Expect a conflict in visual-harness/obsidian-lifecycle.mjs (G-S112
vs SC-616's G-S91 change) - keep both. Expected on sc619: jest 11814/2, lifecycle 63/63,
e2e 331/334 0 failed 176/176.

### r3 result (2026-11-13, reviewer C): LAND, 0 C/H/M, 2 LOW, 5 INFO

Report `sc619-r3-review-report.md`. 73 real-Obsidian fix cells, no wrong-counter write;
CR-only (SC-460) measured: saves/refuses like LF, branch never fires.

Owner rulings:
- **LOW-1** (CRLF note converted to LF from outside while its heading hover is open, then +:
  base saved, fix refuses with the Notice; the drawn-from `cardLinkLine` call reads the
  heading terminator from the stale CRLF snapshot): **accept as a residual (option a)** under
  Scott's 2026-11-10 "Save nothing with a notice is fine." Reason: a whole-note line-ending
  conversion during an open hover is rare, the outcome is a refusal, and option (b)
  (`r3-alt-fix.diff`, EOL from the note now, extra params + resolveSubpath) adds placement
  logic that was not battery-tested, for a rare case. Fold into r4: a jest test pinning it
  (refused, nothing written, one Notice) AND that it is not persistent (after the preview is
  redrawn / reopened, + saves); one line in the `cardLinkLine` comment and in the skill
  proposal's residual list. If r4 measures that it IS persistent (reopening still refuses),
  stop and report - the ruling flips to (b).
- **LOW-2** (mutant `eols[start + 1]` survives): **fold** - add the mixC jest test (CRLF
  heading line, LF blank line under it; fix saves, base refused).
- **INFO-4** (skill proposal: CR-only measured; qualify "an LF note never takes the branch";
  CRLF hover `lineStart` 2; a heading inside a callout gets no hover card): **fold** into the
  proposal file.
- INFO-1 (mixed-EOL swap: link alone places the twin, drawn-from rule refuses - same layering
  as LF), INFO-2 (equivalent mutants), INFO-3 (extra split cost), INFO-5 (G-S112 checks the
  twin by value+name): **drop**, already documented in the review report; no ticket.
- r4: implementer B resumed: rebase onto 1cc54eac + superproject onto current workspace
  origin/main, fold LOW-1 pin, LOW-2, INFO-4, full battery. r5: reviewer C resumed for a scoped
  re-review of the r4 delta.

### r4 result (2026-11-13, implementer B)

dse `df92a3f6` on develop `1cc54eac` (clean rebase); superproject changelog `b67e1a43` on
workspace origin/main `26b92a8a`, no pointer bump. LOW-1 not persistent (jest: new card on
the LF note saves) -> ruling (a) stands. LOW-2 test kills `eols[start + 1]`. +3 jest tests.
Battery: jest 11817/2/0 fresh; lifecycle 63/63; e2e 331/334 0 failed 176/176; shots 592,
163/978, 40/240, clip 147; freeze 280/280; parity 0/0/24.
- r5: reviewer C resumed, scoped re-review of 19942fe6..df92a3f6 delta (range-diff) + one
  real-Obsidian reopen-after-conversion cell.

### r5 result (2026-11-13, reviewer C, scoped re-review): LAND, 0 findings above INFO

range-diff clean (3 commits unchanged + df92a3f6 comment/tests); mutants as claimed; real
Obsidian: LF-conversion residual refuses once, reopen saves (RV + LP), reverse conversion
saves after reopen. jest 11818/1 with the shots css cache present (= 11817/2 fresh);
lifecycle p7 2/2. INFO-1 (residual "not persistent" test re-asserts the refusal): drop, by design.
- Pointer bump: chore worker commits ONE bump to df92a3f6 on top of b67e1a43.

## Land-ready (2026-11-13)

- dse branch `sc619-crlf-hover-refusal` @ `df92a3f6` on origin/develop `1cc54eac` (4 commits: tests, fix, G-S112, residual pins + comment).
- superproject `sc619-crlf-hover-refusal` @ `20a16177` on workspace origin/main `26b92a8a`: `b67e1a43` CHANGELOG + `20a16177` ONE pointer bump to df92a3f6; no interim pointer commits; tree clean.
- Land-ready comment posted (`sc619-comment-land-ready.md`, no decision asked). State left Awaiting for the dispatcher's landing.
- At landing: apply `sc619-skill-proposal.md` to dse-verify SKILL (lifecycle 63/63, part 7 `G-S108,G-S112`, CRLF heading-hover slice fact, residual, CURRENT numbers); preserve this ledger dir to `docs/superpowers/dse-overhaul/build-ledgers/sc619-crlf-hover-refusal/`; move SC-619 to Done via linear-post.py `--state Done` and verify.
- No new Backlog tickets (all follow-ups ruled drop/fold).
