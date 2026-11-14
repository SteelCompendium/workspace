# SC-621 decisions ledger — part-of-note pin (hover preview / embed): the drawn-from counter deleted + a nearby line edited in one outside write can save into the identical twin

Ticket: SC-621 (Linear, Backlog -> picked up 2026-11-13). Filed by SC-612 r1 (§E Q5).
Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05.

## Worktree

- `/home/scott/code/steelCompendium/worktrees/sc621-part-pin-one-sided-edit` (every submodule on branch
  `sc621-part-pin-one-sided-edit`).
- dse base: develop `df92a3f6`. Superproject cut at workspace origin/main `fd727403`.
- Lifecycle id reserved: **G-S115** (part 7, before G-S56 in SCENARIOS order; part 7 = `G-S108,G-S112` ~130 s, has room).

## Ticket statement (Scott-facing description, verbatim)

> A hover preview or an embed shows part of a note that has two identical counters, separated only by blank lines. One outside write (Sync, another app) deletes the counter the preview was drawn from and, in the same write, edits a line just above or below the pair. A + / - or a form Save in that preview may then be written into the other counter, with no Notice.
>
> Expected: nothing is written, and the "changed on disk first" Notice shows. It must never go into a different counter.
>
> Not measured yet for previews; it is the same gap SC-612 found and closes for a note open in its own pane.

Agent notes (verbatim, written BEFORE SC-612 r4 replaced the greedy maps with rule P — the greedy names are stale):
"`rebaseCardPin` places a part-of-note pin with `mapLineStrict` (drawn text -> note now). `mapLineStrict` needs only the head-first and tail-first maps to agree. When an unrelated edit sits beside the run of identical blocks, both maps trim the same way and agree on the head-first guess, so the tie is not seen. SC-612's rule adds `mapLineGreedy` (one side trimmed only) and a `greedyDissents` check in `pinnedTarget` for twinned whole-note pins, and also at write time for `strictPins`. Fix idea: apply the same greedy check inside `mapLineStrict` / `rebaseCardPin`, then re-run the SC-607 drawn-pin sweep (`reading-mode-host-drawn-pin.test.ts`) and G-S92 / G-S96 / G-S99."

What SC-612 actually landed (its ledger, r3 ruling): rule P = placement-cost check with capped Myers `editDistance` (lineMap.ts) for twinned whole-note pins and twinned `strictPins` at write time; greedy maps removed. `rebaseCardPin` (drawn -> now, `mapLineStrict`) untouched.

## Standing rulings that apply

- Scott, 2026-11-10 (standing, for unsure writes): **"Save nothing with a notice is fine."**

## Scott rulings on SC-621

(none yet)

## Owner rulings

- 2026-11-13: no Scott decision needed to start. The ticket's Expected line defines the outcome; any new refusal confined to "an identical counter added/removed next to the drawn-from one by an outside edit inside the round, in a twin note, not persistent" is covered by "Save nothing with a notice is fine." (same class SC-612 ruled). I go back to Scott only if a round finds a NEW refusal outside that class, or a new different-counter write.
- Pipeline: Opus diagnosis/design round r1 (measure the gap at df92a3f6 in jest AND real Obsidian; design the fix, preferably by reusing rule P / `editDistance`; failing tests committed) -> Sonnet implementer r2 -> independent Opus reviewer r3 (fresh identity) -> fix rounds -> scoped re-review -> land-ready.
- Author-independence: r1 design = reviewer A; implementation = implementer B; review = fresh reviewer C.

## Out of scope

- SC-586 (Conditions window YAML display) and SC-568 (jest timeouts on a loaded host; may touch jest config, twin-reuse and initiative-default-keys suites): parallel owners. A rebase conflict there is expected, not ours to fix.
- Anything already ruled a residual on SC-612 / SC-607 / SC-619 (text-identical moves/pastes N5/N6, >400-line one-sided edits where the capped distance gives up, whitespace-only edit inside the pinned block, CRLF->LF conversion under an open hover).

## Baseline at df92a3f6 (from dispatcher)

jest 11817 passed / 2 skipped (fresh, without the shots cache) · lifecycle 63/63 in seven `--only` parts:
1. `G-S7a,G-S7b,G-S6a,G-S6b,G-S6u,G-S28,G-S5n,G-S1,G-S2,G-S3,G-S4,G-S5,G-S6c,G-S6d,G-S6e,G-S6f,G-S6g,G-S6h,G-S6i,G-S8,G-S9a` (21)
2. `G-S9b,G-S9d,G-S9e,G-S9f,G-S9c,G-S10,G-S11,G-S12,G-S13,G-S15,G-S14,G-S18,G-S32,G-S36,G-S33,G-S40` (16)
3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9, full)
4. `G-S57,G-S62,G-S61,G-S56` (4; G-S56 LAST in SCENARIOS order)
5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7, full; G-S91 FAIL is a real signal unless "host too slow" after two re-runs)
6. `G-S92,G-S96,G-S97,G-S99` (4, full; SC-622: restore demo-vault/.obsidian/appearance.json before blaming a G-S97 fail)
7. `G-S108,G-S112` (2, ~130 s, room) -> new G-S115 goes here.
e2e `331/334 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (known bugs SC-257, SC-355, SC-384) · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.

## Baseline moves

- 2026-11-13 (dispatcher, verbatim): "New baseline: SC-586 landed (Conditions window: src conditions colour chooser seed and blank-icon Default, new jsdom tests, e2e COND-H01..H03; no host/pin code). dse develop is now 14521bf0, workspace main 85f7d100. Rebase onto 14521bf0 (and your superproject branch onto current workspace main, one pointer bump) before you report land-ready. New numbers at 14521bf0: jest 11833 passed / 2 skipped (fresh, no shots cache) · lifecycle 63/63 (part 7 `G-S108,G-S112`) · e2e `334/337 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24."
  Supersedes df92a3f6 as base. Owner: r1 (design round, measures on df92a3f6) is NOT interrupted — SC-586 touches no host/pin code, so r1's measurements and red-on-base tests stay valid. r2 (implementer) starts by rebasing the branch onto 14521bf0 and re-checks red-on-base against 14521bf0. Common brief updated to 14521bf0 numbers.

- 2026-11-13 (dispatcher, verbatim): "New baseline: SC-613 landed (src/views/ConditionsModal.ts window-document keydown listener, new conditions jest tests, e2e COND-N12..N15; no host/pin code). dse develop is now 9b94baf2, workspace main b8a51cfd. Rebase onto 9b94baf2 (and your superproject branch onto current workspace main, one pointer bump) before you report land-ready. New numbers at 9b94baf2: jest 11853 passed / 2 skipped (fresh, no shots cache) · lifecycle 63/63 (part 7 `G-S108,G-S112`) · e2e `338/341 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24 (styles.css unchanged)."
  Supersedes 14521bf0. Owner: r3 is reviewing 56ad4d1c in the worktree, so the rebase + re-gate is a separate round AFTER r3 returns (folded with any r3 fixes), never concurrent. Expected on sc621 after rebase: jest 11853 + 35 = 11888 / 2; lifecycle 64/64; e2e 338/341 0 failed 176/176; styles.css = clean 9b94baf2 build.

- 2026-11-13 (dispatcher, verbatim): "New baseline: SC-568 landed (jest.config.ts global testTimeout 30 s; test/ only, including test/dom/framework/reading-mode-host-pin and reading-mode-host-crlf-hover, which now wait with the new test/dom/_settleVaultReads.ts instead of a fixed setTimeout(25); no src change). dse develop is now b1e4f027, workspace main 18bba97f. Rebase onto b1e4f027 (and your superproject branch onto current workspace main, one pointer bump) before you report land-ready. Expect test-file conflicts near those suites. New numbers at b1e4f027: jest 11857 passed / 2 skipped (quiet) · lifecycle 63/63 (part 7 `G-S108,G-S112`) · e2e `338/341 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24 (bundle identical to 9b94baf2). dse-verify's "Load-sensitive jest suites" section is now "Jest timeouts under load": an "Exceeded timeout of 30000 ms" is a real hang until proven otherwise."
  Supersedes 9b94baf2. Owner: r4 (rebase round) was mid-flight on 9b94baf2; redirected by SendMessage to rebase onto b1e4f027 instead. Expected on sc621: jest 11892 / 2; lifecycle 64/64; e2e 338/341 0 failed 176/176. SC-568 touched reading-mode-host-pin's settle -> may already fix SC-624 (the :682 flake); check at landing and close SC-624 as fixed by SC-568 if the describe now settles before pinPosition.

## Rounds

| Round | Role | Agent | Report | Result |
|---|---|---|---|---|
| r1 diagnosis/design | orchestration:reviewer | reviewer A (ad0cd799) | sc621-r1-design-report.md | DONE: gap real at df92a3f6 (real Obsidian 16/16 ticket cells A heading + C ^id, hover + embed, RV + LP, + and form: WROTE OTHER COUNTER, no Notice; shape B unreachable in real Obsidian, jest-only). Root cause: rebaseCardPin ReadingModeBlockHost.ts:1044-1052 accepts mapLineStrict agreement; write-time rule P compares now vs now. Prototype +7/-0 (sc621-r1-proto-ruleP-rebase.diff.txt): twinned -> require placedUniquely at the rebase. Sweep 21,060: ambiguous writes 588->0, other-counter 180->0, 408 new refusals all ambiguous, 0 unambiguous, 0 X->Y. Fuzz 15,612: 48->0 other, 48 new refusals all ambiguous. Real Obsidian proto 16/16 refused 1 Notice, 12/12 controls saved. Full jest proto 11844/2 (+27, 0 flips). LC G-S92/96/99/108/112 ok on proto. Failing tests dse 4ba95740 (27 tests, 18 red on base). G-S115 template 9 cells (~80 s). |
| r2 implementation | orchestration:implementer | implementer B (a6697755) | sc621-r2-impl-report.md | DONE: dse 56ad4d1c on 14521bf0 (dfaacd40 r1 tests, 2f51c898 fix, cc1b6c00 M2 + persistence tests, 260f73e3 sweep/fuzz suite, 56ad4d1c G-S115); superproject 0dcc3bb3 (1 CHANGELOG commit) on f58d5f02, no pointer commit; tsc/lint clean; jest 11868/2 (+35); lifecycle 64/64 (p7 195 s); e2e 334/337 0 failed 176/176; styles 18730938 = clean 14521bf0 -> shots/freeze/parity carry; red on base 25/35; G-S115 (a)-(f) wrote other on 14521bf0 bundle; sweep 1170 cells 15-16 s, fuzz 2 seeds |
| r3 independent review | orchestration:reviewer | reviewer C (ab9003ee) | sc621-r3-review-report.md | LAND: 0 C/H/M, 4 LOW, 5 INFO. Real Obsidian 26 cells/bundle: base 15 wrote other, fix 0 (17 refused, 1 Notice each, 9 saved); jest probe 72,600 cells: T1 other-writes only R1 324 / R2 648 / >400-line 474; 1,446 new refusals all ambiguous-twinned, 0 unambiguous; CRLF 12/12 refused on fix; mutants M0/M2-M6 killed, M7 near-equivalent survives; red on base 25/35; full jest 11867/1 failed/2 (load flake reading-mode-host-pin.test.ts:682, passes alone 3/3 on base and fix; no twins -> not this change); LC p7 3/3 197 s, p6 4/4 296 s |
| r4 rebase + doc fold | orchestration:implementer | implementer B resumed (a6697755) | sc621-r4-fix-report.md | DONE: dse 96955985 on b1e4f027 (8 commits: r2's 5 = in range-diff, + 37c99b38 R3 comment, cd8342f7 G-S115 dead code, 96955985 suites on settleVaultReads); superproject ad3ae246 (1 CHANGELOG commit) on e7e34279; LOW-1..4 + owner note folded; tsc/lint clean; jest 11892/2; lifecycle 64/64 (p7 200 s); e2e 338/341 0 failed 176/176; styles 18730938 = clean b1e4f027 |
| r5 scoped re-review | orchestration:reviewer | reviewer C resumed (ab9003ee) | sc621-r5-rereview-report.md | LAND: 0 C/H/M/L, 2 INFO. Range-diff commits 1-5 '=', no conflict resolution in our files; folds as ruled; p7 3/3 201 s on r4 bundle (main.js a866bb27); G-S115 on b1e4f027 bundle (a)-(f) wrote other; jest full 11892/2 (load 2.7); settle/spy mutants: no leaks, settle needed only for T2 determinism |
| r6 doc wording + pointer bump | orchestration:implementer | implementer B resumed (a6697755) | sc621-r6-report.md | DONE: dse 27120710 (comment-only on 96955985); superproject 1907a338 on e7e34279 = 3022c223 CHANGELOG (amended) + 1907a338 ONE pointer bump; tsc/lint clean; main.js a866bb27 = r4; styles 18730938; owner reviewed the doc diff (comment + CHANGELOG wording true) |

- **2026-11-13, owner rulings on r1 (sc621-r1-design-report.md). No Scott decision needed.**
  - **Fix: ADOPT r1's prototype as is** (`sc621-r1-proto-ruleP-rebase.diff.txt`: in `rebaseCardPin`, after `mapLineStrict` agrees with `linkLine`, a block twinned in the drawn note or now is placed only when `placedUniquely(whole, {text: from.text, lineStart: from.line}, at.line)` holds; tail-first check kept; no lineMap change).
  - **Q1 (refusal repeats in a preview that is not redrawn, until it is reopened): ACCEPT.** My "not persistent" wording of the ruled class was carried over from SC-612 (own-pane notes redraw). For part previews/embeds, SC-607's owner already accepted the same property (SC-607 F1 move and F3 refusals "until the preview/embed is redrawn (reopen)") under Scott's 2026-11-10 "Save nothing with a notice is fine." The refusals here are all oracle-ambiguous, need an outside edit adding/removing an identical counter, in a twin note, and clear on reopen (measured: sc621-r1-persist-proto.log). Ruled class for SC-621 restated: "an identical counter added or removed next to the drawn-from one by an outside edit, in a twin note, oracle tie; repeats until the preview/embed is redrawn or reopened". Must be said plainly in the CHANGELOG and the land-ready comment.
  - **Q2 residuals: ACCEPT, document, no ticket.** R1 (text-identical move among identical blocks) = SC-612 N5/N6 class. R2 (drawn-from section deleted + a neighbour renamed to its name, cheapest reading keeps the drawn-from counter) = same layering as SC-607 F4 (another counter given the link's name); base writes the same; no text rule can see it. Both go in the `rebaseCardPin` comment and the skill proposal residual list.
  - **Follow-up M2-killing cell (identical counter pasted above a unique one + TOP edited, twin gate on drawn note only survives): FOLD into r2** as a named test.
  - **G-S115: ADD** from r1's template (`sc621-r1-gs115-proposal.mjs.txt`), part 7 after G-S112, before G-S56 in SCENARIOS order; lifecycle 64/64; (a)-(f) red on a 14521bf0 bundle, (g)-(i) green on both.
  - **Sweep/fuzz as permanent jest: FOLD**, port r1's part sweep (`sc621-r1-part-sweep.test.ts.txt`) with the oracle assertions (0 writes in ambiguous twinned cells, 0 refusals in unambiguous cells except pinned-block-gone/edited, 0 X->Y) and a seeded fuzz; budget ~20 s jest wall for both, cut cells/seeds and say so if over.

- **2026-11-13, owner rulings on r2 follow-ups.**
  - Sweep subset does not kill M2 (named tests do): **DROP** — M2 is killed by 2 named tests in the twin file; +5 s jest wall not worth it.
  - Fuzz classifies any "paste identical copy + delete" as R1 (loose): **DROP** — the R1/R2 counts are pinned, so a new other-counter write moves a pinned total and fails; the sweep's classes are exact. r3 may reopen either with evidence.

- **2026-11-13, owner rulings on r3 (sc621-r3-review-report.md). Verdict LAND accepted; no code change to the rule.**
  - **LOW-1 (>400-line residual not named in CHANGELOG / comment): FOLD, docs only.** It is the ledger's already-out-of-scope ">400-line one-sided edits where the capped distance gives up" residual; base writes the same; r3 measured the code alternative (refuse twinned + over cap): stops 9/132, adds 92 unambiguous refusals -> not taken. Name it in plain words in the CHANGELOG, the `rebaseCardPin` comment and the skill proposal residual list (R3).
  - **LOW-2 (CHANGELOG says "added" but not "removed"): FOLD** -> "added or removed" (the mirror: the OTHER identical counter removed with a line on one side edited is the most common new refusal).
  - **LOW-3 ("a preview of a note open in its own pane (SC-612)"): FOLD** -> "a note open in its own pane".
  - **LOW-4 (G-S115 dead code: GS115_C6, GS115_NOTE.twin, three unused edits, the `if (plus)` block): FOLD, delete the dead code** (own-write paths are covered by G-S92/G-S96/G-S99; keeps part 7 short). Also my own note: CHANGELOG "Because such a preview or embed is not redrawn by Obsidian" -> say "is often not redrawn" (r1 shape B: Obsidian redrew some previews within ~16-61 ms).
  - INFO-1 (M7 survives; no test pins "a note without identical counters is never refused"): **DROP** — M7 is a cost guard, near-equivalent; existing drawn-pin suites (829 tests) are no-twin notes and saw 0 flips.
  - **INFO-2 (full-jest load flake reading-mode-host-pin.test.ts:682, missing settle before pinPosition, pre-existing, no twins): FILED SC-624** (Backlog, related SC-568 / SC-621). OUT OF SCOPE here; on a red there in r4, re-run the suite alone and report both runs.
  - INFO-3 (T2 harness noise), INFO-4 (build tests write main.js/styles.css; known, dse-verify "Stale main.js"), INFO-5 (wall times): **DROP**, informational.

- 2026-11-14: **SC-624 closed Done** (comment sc621-comment-sc624-done.md, verified completedAt 2026-11-14T00:54:07Z): SC-568 (b1e4f027) already settles after `pinPosition()` in that exact test (d76c7de2, bc37d682, b1e4f027); r4 full jest green there.

- **2026-11-14, owner rulings on r5 (sc621-r5-rereview-report.md). Verdict LAND accepted.**
  - **INFO-1 (CHANGELOG:16 and the comment at :1057 say all three residuals are written "because the note's text cannot tell them apart"; true for R1/R2, but R3 is written because a change over ~400 lines is not priced): FOLD** — user-facing text must be literally true. Comment-only dse commit + CHANGELOG amend (still ONE superproject commit). Gate: tsc, lint, main.js sha256 identical to r4's bundle (esbuild drops comments); owner reviews the doc-only diff (small docs-only diff, behaviour already verified).
  - INFO-2 (with the fix, tests pass without the settle; the helper only makes T2 deterministic): **DROP**, informational.
  - Pointer bump: in the same round, implementer B commits ONE pointer bump to the final dse head on top of the CHANGELOG commit, after rebasing the superproject onto current workspace origin/main.

## Land-ready checklist (owner)

- dse branch rebased on current origin/develop; full dse-verify battery at the numbers above (+ new tests / G-S115).
- superproject branch on current workspace origin/main: a CHANGELOG `## Unreleased` bullet commit (worktree's CHANGELOG) + exactly ONE pointer bump, no interim pointer commits.
- dse-verify SKILL proposal as a file in this dir (`sc621-skill-proposal.md`); owners don't edit SKILL.md.

## Land-ready (2026-11-14)

- dse branch `sc621-part-pin-one-sided-edit` @ `27120710` on origin/develop `b1e4f027` (9 commits: r1 tests, fix, M2 + persistence tests, sweep/fuzz, G-S115, R3 comment, G-S115 dead code, settleVaultReads, residual-reason comment).
- superproject `sc621-part-pin-one-sided-edit` @ `1907a338` on workspace origin/main `e7e34279`: `3022c223` CHANGELOG + `1907a338` ONE pointer bump to 27120710; no interim pointer commits; tree clean.
- Battery (on 96955985; 27120710 is comment-only, main.js identical): tsc/lint clean · jest 11892/2 · lifecycle 64/64 (part 7 G-S108,G-S112,G-S115 200 s) · e2e 338/341 0 failed 3 known-bug 176/176 · styles = clean b1e4f027 -> shots 592 / 163/978 / 40/240 / clip 147, freeze 280/280, parity 0/0/24 carry.
- Land-ready comment posted (sc621-comment-land-ready.md, no decision asked). State left Awaiting for the dispatcher's landing.
- At landing: apply `sc621-skill-proposal.md` to dse-verify SKILL (lifecycle 64/64, part 7 `G-S108,G-S112,G-S115`, G-S115 summary, rule P at the rebase, repeat-until-reopen, residuals R1/R2/R3, CURRENT); preserve this ledger dir to `docs/superpowers/dse-overhaul/build-ledgers/sc621-part-pin-one-sided-edit/`; move SC-621 to Done via linear-post.py `--state Done` and verify.
- Follow-ups: SC-624 filed and closed (already fixed by SC-568). No open tickets from this effort.
