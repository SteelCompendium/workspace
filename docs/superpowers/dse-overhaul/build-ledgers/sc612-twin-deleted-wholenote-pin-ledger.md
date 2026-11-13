# SC-612 decisions ledger — whole-note pin: the upper of two identical blocks deleted from outside, a form / card pinned to it writes the lower one

Worktree: /home/scott/code/steelCompendium/worktrees/sc612-twin-deleted-wholenote-pin (branch `sc612-twin-deleted-wholenote-pin` in every submodule)
Cut from: dse develop 63e00d7e; superproject bbcd1d41 (= workspace origin/main, 2026-11-13)
Lifecycle id reserved: G-S108 (part 7 if a scenario is added; parts 3, 5, 6 are full)

## Ticket statement (Scott-facing description, verbatim)

> A note has two identical counters, separated only by blank lines. The edit form is open on the upper one. The upper block is deleted from outside (Sync, another app). Save then writes into the lower counter, which is a different block that only looks the same. No Notice shows.
>
> The same happens for a card + / - whose write is pinned to the upper block.
>
> Expected: Save writes nothing and shows the "changed on disk first" Notice. It must never go into a different block.
>
> This is a note open in its own pane, not an embed or a hover preview. SC-607 fixes the same problem for embeds and hover previews.

Agent notes (verbatim): "Fix idea: SC-607 adds a tail-first map (`mapLineFromTail` in `lineMap.ts`) and refuses a part-of-note pin when the head-first and tail-first maps disagree. Applying the same strict rule to whole-note pins would refuse this shape. Weigh the cost first: it would also refuse an identical block added right next to the pinned one."

## Standing rulings that apply

- Scott, 2026-11-10 (standing ruling for unsure writes, restated by the dispatcher 2026-11-13): **"Save nothing with a notice is fine."**

## Scott rulings on SC-612

(none yet)

## Owner rulings

- 2026-11-13: no Scott decision needed to start. The ticket's Expected line defines the outcome, and the cost the agent notes name (an identical block added right next to the pinned one is refused) is a safe refusal covered by "Save nothing with a notice is fine." I go back to Scott only if r1 finds a NEW refusal outside the "unsure write" class (a refusal with no outside edit / no identical block involved, or a refusal that persists past the form / click round), or a new different-block write.
- Pipeline: Opus design/survey round (r1, probe only, no commits) -> Sonnet implementer (r2) -> independent Opus review (r3) -> fix rounds -> scoped re-review -> land-ready.

## Baseline at 63e00d7e

jest 11648 passed / 2 skipped (fresh worktree) · lifecycle 61/61 (21 + 16 + 9 + 4 + 7 + 4) · e2e `315/318 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` (known bugs SC-257, SC-355, SC-384) · styles.css `5e5ff488…2b27` · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24.

## Rounds

| Round | Role | Agent | Report | Result |
|---|---|---|---|---|
| r1 design/survey | orchestration:reviewer | designer-r1 (af4a50e2) | sc612-r1-design-report.md | done: rule R proposed (N = tail-first check for twinned whole-note pins + two greedy maps `mapLineGreedy` / `greedyDissents`), diff sc612-r1-probe-rule-R.diff.txt +41/-4; sweep 5771 cells base->R: saved->refused 644, wrote-other->refused 596, refused->saved 0, X->Y 0; oracle: 0 writes in ambiguous cells, 0 refusals in unambiguous; full jest on R 11648/0/2 (0 flips); real Obsidian 8 red cells (A1-A4 x RV/LP) write nothing on R; new red shape A3/A4 (lower deleted + TOP edited) not fixed by N; lifecycle G-S64/73/92/96/99 5/5 on N3 bundle |
| r2 implementation | orchestration:implementer | impl-r2 (ab0519ff) | sc612-r2-impl-report.md | DONE: dse 1a8f624c (5 commits) on c0995beb; superproject 0097225a (CHANGELOG only) on a1d359f3; tsc/lint clean; jest 11744/2 (+62); lifecycle 62/62 (7 parts, p7 G-S108 51 s); e2e 328/331 0 failed 174/174; styles = CURRENT; red on 63e00d7e: 21 jest + G-S108 (a)-(g); mutants M1,M3-M9 killed, M2 equivalent |
| r3 independent review | orchestration:reviewer | reviewer-r3 (a0c06337) | sc612-r3-review-report.md | FIX: HIGH-1 different-block write (C9 beside the twin run + lower deleted + TOP edited; real Obsidian 4/4 written; fuzz 148 cells); HIGH-2 508 unambiguous new refusals (140 with no identical counter added/removed); MEDIUM-1 sweep layouts too narrow; LOW-1 CHANGELOG, LOW-2 comment, LOW-3 unterminated-fence refusal; prototype oracle rule fixes all (fuzz 0/0); gates at tip: jest 11744/2, p6 4/4, p7 1/1, e2e 328/331 |
| r4 fix round | orchestration:implementer | impl-r2 resumed (ab0519ff) | sc612-r4-fix-report.md | DONE: rule P (capped Myers editDistance; greedy removed); dse a06dba37 on 1516f894; superproject d9bca0ec (1 CHANGELOG commit) on 4cfac4bf; tsc/lint clean; jest 11773/2 (+81); lifecycle 62/62 (p5 re-run: G-S91 flake SC-616; p7 68 s, G-S108 15 cells); e2e 328/331 0 failed 174/174; styles a6c57131… = clean 1516f894; fuzz 234,064: 0 twinned-ambiguous writes, 0 unambiguous new refusals; mutants 15/17 (2 equivalent optimisations); last two commits comment/title only (tsc + touched jest re-run) |
| r5 scoped re-review | orchestration:reviewer | reviewer-r3 resumed (a0c06337) | sc612-r5-rereview-report.md | LAND at a06dba37 on 1516f894: r3 HIGH-1/HIGH-2/MEDIUM-1/LOW-1/LOW-2 fixed, LOW-3 deviation confirmed; new MEDIUM (whitespace-only outside edit inside the pinned block of a twin note refused; base saved), LOW (CHANGELOG 'a counter with another value' contradicts residual 5); jest 11773/2; p7 1/1 67 s; fuzz 0/0/0; real Obsidian H1 variants refused; mutants 8/8 |
| r6 rebase + re-gate | orchestration:implementer | impl-r2 resumed (ab0519ff) | sc612-r6-rebase-report.md | DONE: dse 1f1ae442 on 2074a152 (range-diff: 11 '=' + 1 comment-only commit, owner-verified); superproject 53be46e9 (1 CHANGELOG commit) on f9082867 = origin/main; tsc/lint clean; jest 11788/2 (+81); lifecycle 62/62 (21/16/9/4/7/4/1, p7 67 s); e2e 330/333 0 failed 176/176; styles 18730938… = clean 2074a152 |

- **2026-11-13, owner rulings on r1 open questions (sc612-r1-design-report.md §E). No Scott decision needed: r1 found no new refusal outside "an identical counter added or removed next to the pinned one by an outside edit inside the form / click round" (never without an outside edit, never persistent, never in a note without twins), and no new different-block write; Scott's 2026-11-10 "Save nothing with a notice is fine." covers it.**
  - ~~**Q1: rule R**~~ superseded 2026-11-13 by the r3 ruling below (rule P) for twinned whole-note pins (`sc612-r1-probe-rule-R.diff.txt`): the tail-first check for whole-note pins whose known body is twinned (in `pin.text` or now) PLUS the two greedy maps (`mapLineGreedy`, one side trimmed only); a greedy map dissents when it says deleted or lands on another block with the known body; it does not dissent when it pairs the fence with a block of another body, or when it gave up. Reason: N leaves the A3/A4 shape (lower deleted + TOP edited in the same write) writing the survivor in real Obsidian, 640 ambiguous-cell writes in the sweep.
  - **Q2: keep the twin gate.** A note without identical counters never sees a new refusal and never pays for the extra maps.
  - **Q3: leave the card `resolveWriteTarget` fallback as is** (unreachable after an R miss; skipping it costs 18 refusals and fixes nothing).
  - **Q4: accept the cost** (incl. the exact mirror base saved by luck, any member of a blank-line run, and the same with an unrelated edit in the write) under "Save nothing with a notice is fine."
  - **Q5: keep R's write-time greedy check for `strictPins` when twinned.** The `rebaseCardPin` / `mapLineStrict` one-sided-edit residual for part-of-note pins -> filed **SC-621** (Backlog, related SC-612 / SC-607); OUT OF SCOPE here.
  - **Q6: add lifecycle G-S108** as r1 §D proposed (cells (a)-(k), one note each), its own part 7, before G-S56 in SCENARIOS order. Lifecycle becomes 62/62 (21 + 16 + 9 + 4 + 7 + 4 + 1). Must be red on a 63e00d7e bundle in (a)-(g); controls (h)-(k) green on both.
  - **Q7: keep the tail-first check (M2)** as defence in depth.
  - **Q8: accept R's residuals** (text-identical moves / pastes, N5 / N6; a twin add/remove combined with a >400-line one-sided edit where the greedy maps give up; SC-621) and record them in the dse-verify residual list (proposal file).
  - **Follow-up (r1): a same-language block pasted directly above the pinned block during the form / click round is refused (base, unchanged by R)** -> DROP: a safe refusal with a Notice, needs an outside paste inside the round, covered by "Save nothing with a notice is fine."

## Baseline moves

- 2026-11-13 (dispatcher, verbatim): "SC-608 landed: dse develop is now c0995beb, workspace main 2329ba8f. Rebase onto c0995beb (and your superproject branch onto current workspace main, one pointer bump) before you report land-ready. New CURRENT baseline: jest 11682 passed / 2 skipped fresh · lifecycle 61/61 · e2e `328/331 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24 (styles.css unchanged by SC-608). SC-608 changed src/elements/initiative/view.ts." Supersedes 63e00d7e as base. Relayed to impl-r2 mid-round.
- 2026-11-13 (dispatcher, verbatim): "SC-563 landed: dse develop is now 1516f894, workspace main 99ac8319. Rebase onto 1516f894 (and your superproject branch onto current workspace main, one pointer bump) before you report land-ready. New CURRENT baseline: jest 11692 passed / 2 skipped without the shots cache · lifecycle 61/61 · e2e `328/331 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` · shots 592 (76 screen shots changed, none frozen), host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 (no rebaseline) · parity 0/0/24. SC-563 changed Steel theme CSS (action crest glyphs, a glyph font) and the build's licence-comment handling; no TS element code." Supersedes c0995beb. styles.css moved: the gate is now 'branch styles.css byte-identical to a clean 1516f894 build' (SC-612 changes no CSS). Relayed to impl-r2 (r4) mid-round.
- 2026-11-13 (dispatcher, verbatim): "SC-581 landed: dse develop is now 2074a152, workspace main 019d804e. Rebase onto 2074a152 (and your superproject branch onto current workspace main, one pointer bump) before you report land-ready. New CURRENT baseline: jest 11707 passed / 2 skipped without the shots cache · lifecycle 61/61 · e2e `330/333 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (2 new: COND-D18, COND-D19) · shots 592, host-leak 163/978, modal host-leak 40/240 (new Default button in the Conditions window Color row) · capture clip 147 · freeze 280/280 · parity 0/0/24. SC-581 touched only the Conditions window (conditions modal code, its tests and docs)." Supersedes 1516f894. Owner: r5 is reviewing a06dba37 in the worktree, so the rebase + re-gate is a separate round (r6) AFTER r5 returns, never concurrent with it.

- 2026-11-13, owner note on r2 follow-up T6b (a twin added among interchangeable twins with prose between is refused): inside the ruled cost class (an identical counter, an outside edit inside the round, note with twins, not persistent) IF it is a genuine tie. r3 must confirm with the oracle that every T6b-shaped refusal is ambiguous; a refusal the oracle calls unambiguous is a finding.

- **2026-11-13, owner rulings on r3 (sc612-r3-review-report.md). Verdict FIX accepted.**
  - **HIGH-1 + HIGH-2: FIX with the r3 prescribed rule ("rule P"), superseding R's tail-first + greedy heuristics for twinned pins.** Verbatim from the report: "For a twinned pin (`twin` true), replace the tail-first and greedy heuristics with the placement-cost check the sweep's oracle already defines: Take the pinned block's lines in `pin.text` (`[s, e]`). Compute the minimal line-edit cost of the note restricted to each placement: for each block of `content` whose lines are identical, `dist(A[0,s), B[0,q)) + dist(A(e,∞), B(qe,∞))`, and for "deleted", `dist(A without the block, B) + block length`. Place only when the minimum is UNIQUE and equals `line` (the head map's answer); otherwise null. Keep `strictPins`' SC-607 tail-first check as is. The another-body exemption disappears: a block can only pair with an identical block." Production: capped Myers distance (`editDistance(a, b, cap)` factored out of `mapLineOf`, after trimming common head and tail, cap `LINE_MAP_MAX_EDITS`); a capped "gave up" keeps today's behaviour (head map + body check). No O(n*m) DP in production. Twinned strict pins get the P check too (replaces R's greedy write-time check; Q5's intent kept). `mapLineGreedy` / `greedyDissents` are removed if nothing else needs them.
  - Not a Scott question: HIGH-2's refusals were safe, but P removes them, so the ruled cost class is unchanged (refusal only where the note is a genuine tie, inside the round, after an outside edit).
  - **MEDIUM-1: FOLD.** Add the sweep layouts `twin-blank+diff-below`, `twin-blank+diff-above`, `tight-diff-neighbour`, `triple+diff`; assert every refusal is in an oracle-ambiguous cell or one whose pinned block is gone or edited; re-pin the totals; port the seeded fuzz (`sc612-r3-fuzz.test.ts.txt`, ~10 s) as a second sweep with the TS oracle (if it costs more than ~20 s of jest wall, cut the seed count and say so). Restate guarantees in the doc comment and proposal as "on the sweep's layouts / fuzz", with numbers.
  - **LOW-1: FOLD** (CHANGELOG reword per r3's example; plain words). **LOW-2: FOLD** (doc comment: the twin count runs on every pinned write). **LOW-3: FOLD** (P removes it; add one test that the pinned unterminated trailing fence with a closed copy pasted above saves, if the oracle calls it unique).
  - Tests: named H1, H1b, H1c (refused), M1, M2, M3, M6 (saves), form and card; a G-S108 cell for H1 (`sc612-r3-lc-h1-patch.py.txt` template). Red-on-base for the new refusal tests.

- 2026-11-13, owner ruling on r4 LOW-3 deviation: a closed copy pasted above a pinned unterminated trailing fence is REFUSED under P (base wrote the copy, a different block). Accepted: a safe refusal replacing a base different-block write, inside the ruled class (an identical counter added by an outside edit inside the round). The test pins the refusal.

- **2026-11-13, owner rulings on r5 (sc612-r5-rereview-report.md).**
  - **MEDIUM (an outside edit that only changes whitespace INSIDE the pinned block, in a note with identical counters, during the form / click round: refused; base saved): ACCEPT as a documented residual, no code change.** Reasons: the pinned block itself did change on disk, so the "changed on disk first" Notice is literally true; it needs an outside edit to that very block inside the round, in a twin note only; it is safe (nothing written, one Notice) and never persists (the next round saves); the prototyped fix (`sc612-r5-prototype-whitespace.diff.txt`) closes only E1 (trailing space), not E2 (blank line before the closing fence), at the cost of a special case in the placement rule. Covered by "Save nothing with a notice is fine." Document it in the `pinnedTarget` doc comment and the dse-verify proposal residual list.
  - **LOW (CHANGELOG): FOLD** with r5's wording: "An edit elsewhere in the note, or a sibling's + / -, does not cause a refusal." (drop "a counter with another value").

## Land-ready (2026-11-13)

- Land-ready comment posted on SC-612 (sc612-comment-land-ready.md; no decision asked). State left Awaiting for the dispatcher's landing.
- dse branch `sc612-twin-deleted-wholenote-pin` @ 1f1ae442 on develop 2074a152; superproject branch @ 53be46e9 on workspace origin/main f9082867 (one CHANGELOG commit; the dse pointer is unstaged for the ONE bump at landing).
- At landing: apply `sc612-dse-verify-proposal.md` to dse-verify SKILL (lifecycle 62/62, part 7 `G-S108`, the "Two identical blocks" bullet, residual list, CURRENT); preserve this ledger dir to `docs/superpowers/dse-overhaul/build-ledgers/sc612-twin-deleted-wholenote-pin/`; move SC-612 to Done via linear-post.py `--state Done` and verify.
- Follow-up filed: SC-621 (Backlog).
