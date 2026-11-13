# SC-616 — G-S91 "title rv" hover-preview timing flake — decisions ledger

Ticket: SC-616 (Linear, team SC). Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05.
Worktree: `/home/scott/code/steelCompendium/worktrees/sc616-gs91-hover-flake` (branch `sc616-gs91-hover-flake` in every submodule).
Superproject cut at workspace origin/main `a1d359f3`; dse at develop `c0995beb`.

## Ticket goal (from the description, 2026-11-12)

> Expected: G-S91 passes every run, or the trial is fixed so that it only fails when the product is wrong.

Failure forms seen (dse-verify "Lifecycle and e2e notes"):
- `title rv: 700 ms after the second press the preview was gone (second click 53 ms after the opening click) {"popover":false,"modal":false,"editing":false,"editor":false,"focusInPreview":false}`
- `title lp: the second click came 155 ms after the opening click` (the trial's own validity guard, gap >= 140).
Measured: base 1 of 4 alone (SC-607 r2); branch 3 of 6 (r2, load); r3 0/6 each; r4 1 of 2 part-5 runs (the 155 ms form).

## Baseline at c0995beb (dispatcher, 2026-11-13)

jest 11682 passed / 2 skipped (fresh worktree) · lifecycle 61/61 (21+16+9+4+7+4) · e2e `328/331 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` (known bugs SC-257, SC-355, SC-384) · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24.

## Dispatcher instructions (2026-11-13)

- If the ticket needs a decision from Scott, ask on the ticket and park.
- Lifecycle runs in SIX `--only` parts; part 5 = `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S91` (full). A new scenario needs its own part 7; SC-612 is adding G-S108 as part 7. Lifecycle id available to us: G-S109. G-S56 stays LAST in SCENARIOS order.
- Never put a bracketed ticket id in a test title. Never `rm -rf` a `/tmp` glob.
- Owners don't edit SKILL.md; SKILL proposals go in this dir as files.
- Before land-ready: superproject branch on current workspace origin/main with ONE pointer bump, no interim pointer commits.
- Parallel owners: SC-612 (pin code, G-S108 part 7), SC-563 (Steel crest icon CSS/glyph font).

## Dispatcher update 2026-11-13 (SC-563 landed)

> SC-563 landed: dse develop is now 1516f894, workspace main 99ac8319. Rebase onto 1516f894 (and your superproject branch onto current workspace main, one pointer bump) before you report land-ready. New CURRENT baseline: jest 11692 passed / 2 skipped without the shots cache · lifecycle 61/61 · e2e `328/331 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` · shots 592 (76 screen shots changed, none frozen), host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 (no rebaseline) · parity 0/0/24. SC-563 changed Steel theme CSS (action crest glyphs, a glyph font) and the build's licence-comment handling; no TS element code. SC-563 also filed SC-622 (the Obsidian camera tool leaves demo-vault/.obsidian/appearance.json dirty, which made G-S97 fail until the stray folders were deleted), in case you see it.

~~Baseline at c0995beb~~ superseded by the 1516f894 baseline above for all gates from r2 on; byte-identity (shots/freeze/parity carry) is now judged against a 1516f894 build.

## Dispatcher update 2026-11-13 (SC-581 landed) — supersedes the SC-563 baseline

> SC-581 landed: dse develop is now 2074a152, workspace main 019d804e. Rebase onto 2074a152 (and your superproject branch onto current workspace main, one pointer bump) before you report land-ready. New CURRENT baseline: jest 11707 passed / 2 skipped without the shots cache · lifecycle 61/61 · e2e `330/333 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (2 new: COND-D18, COND-D19) · shots 592, host-leak 163/978, modal host-leak 40/240 (new Default button in the Conditions window Color row) · capture clip 147 · freeze 280/280 · parity 0/0/24. SC-581 touched only the Conditions window (conditions modal code, its tests and docs).

Owner plan: r3 keeps reviewing 33dd0a1b (the 1516f894..2074a152 delta touches no harness file); after r3 (and any fix round) a rebase round onto 2074a152 re-runs tsc/lint/jest/lifecycle/e2e and byte-identity vs a 2074a152 build. ~~1516f894 baseline~~ superseded for land-ready numbers.

## Dispatcher update 2026-11-13 (SC-612 landed) — supersedes the SC-581 baseline

> SC-612 landed: dse develop is now 1f1ae442, workspace main b65036cc. Rebase onto 1f1ae442 (and your superproject branch onto current workspace main, one pointer bump) before you report land-ready. New CURRENT baseline: jest 11788 passed / 2 skipped fresh without the shots cache · lifecycle 62/62 in SEVEN parts (the six plus part 7 `G-S108` alone, ~67 s; G-S108 sits after G-S99 and before G-S56 in SCENARIOS order) · e2e `330/333 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` · styles.css unchanged, so shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147, freeze 280/280, parity 0/0/24 carry. SC-612 changed ReadingModeBlockHost.ts and lineMap.ts (whole-note pin placement) and added a lifecycle scenario.

r4 (running) was briefed for 2074a152; sent a course correction to rebase onto 1f1ae442 instead. Note SC-612 edits obsidian-lifecycle.mjs (new G-S108) — possible rebase conflict in the same file.

## Dispatcher update 2026-11-13 (SC-585 landed) — supersedes the SC-612 baseline

> SC-585 landed: dse develop is now 3a5986d3, workspace main 22732287. Rebase onto 3a5986d3 (and your superproject branch onto current workspace main, one pointer bump) before you report land-ready. New CURRENT baseline: jest 11794 passed / 2 skipped fresh without the shots cache · lifecycle 62/62 (seven parts) · e2e `331/334 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (new COND-R07) · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24 (no CSS change). SC-585 touched only the Conditions window code, its tests and docs.

r4 redirected to 3a5986d3.

## Scott rulings

(none yet)

## Rounds

| Round | Type | Agent | Report | Verdict |
|---|---|---|---|---|
| r1 diagnosis | orchestration:reviewer | reviewer-r1 (add63411) | sc616-r1-diagnosis-report.md | DONE: cause = SC-598 documented residual (a)+(c) harness race (zero-length second press races Obsidian's 10 ms helper timer) + (d) gate measured from click START; harness fix prototype `sc616-r1-proto-harness-fix.diff.txt`: 12/12 green head, 20/20 worst-case straddle, red on SC-598-reverted base 4/4 runs; product alt = private setIsFocused (declined) |
| r2 implement | orchestration:implementer | implementer-r2 (afb42389) | sc616-r2-impl-report.md | DONE: dse 33dd0a1b on 1516f894 (c7e15725 release+gate, 33dd0a1b retry); tsc/lint clean, jest 11692/2, lifecycle 61/61 (p5 391 s), e2e 328/331 0 failed 174/174; main.js/styles.css byte-identical to 1516f894 build -> shots/freeze/parity carry; G-S91 15/15 natural green, no retry fired, gapEnd 23-69; base598rev red 2/2 runs x 6/6 trials (product reasons, no retry) |
| r3 review | orchestration:reviewer | reviewer-r3 (a4b41246) | sc616-r3-review-report.md | LAND on 33dd0a1b: 0 HIGH / 0 MEDIUM / 1 LOW / 6 INFO; base598rev red 6/6 (incl 4x, 8x CPU); 5 focusHoverPreviewNow mutants caught identically old vs new harness; head 12/12 + part 5 green; byte-identical |
| r4 fix + rebase onto 2074a152 | orchestration:implementer | implementer-r2 resumed (afb42389) | (none) | STALLED on a permission prompt (glob `rm -f $N/*.rc`, footgun 13) after committing de60b4c9 (r3 comment fixes + INFO-4) on 1f1ae442 and running green gates there (jest 11788/2, lifecycle 7 parts ok, e2e 330/333); TaskStop refused (not owner); left alone per dispatcher |
| r4b rebase onto 3a5986d3 + battery | orchestration:implementer | implementer-r4b (a5b660b3) | sc616-r4-fix-report.md | DONE: dse 1cc54eac = 54b08986 + a2797330 + 1cc54eac on 3a5986d3 (range-diff identical); tsc/lint clean, jest 11794/2, lifecycle 62/62 seven parts (184/324/408/295/393/296/67 s), e2e 331/334 0 failed 176/176; main.js 825bd341… styles.css 18730938… identical to 3a5986d3 build -> shots/freeze/parity carry; G-S91 3/3 + part 5, no retry; proposal LOW-1/INFO-6 verified, refreshed |
| r5 scoped re-review (1cc54eac delta + proposal) | orchestration:reviewer | reviewer-r3 resumed (a4b41246) | sc616-r5-rereview-report.md | LAND: 0/0/0, 2 INFO; G-S91 head green, base598rev red 6/6 |

## Owner rulings / follow-ups

- 2026-11-13 O1 (on r1): **No Scott decision needed.** The failing form is SC-598's documented residual (dse-verify "Hover preview modals" SC-598 bullet: "a second press queued in FULL ... while the modal is still opening is handled before the helper's timer and still closes both, as before"), which SC-598 O9 already declined to close with private API (`docs/superpowers/dse-overhaul/build-ledgers/sc598-hover-modal-fast-second-click/decisions.md` O9). G-S91 was meant to test SC-598's promise (a click after the preview had its 10 ms, inside the old 150 ms), and its zero-length second press raced the residual instead. Fix = harness only, per r1's prototype: release the second press after an in-page 11 ms timer; measure the validity gate from the END of the opening click's dispatch (`gapEnd < 140`).
- 2026-11-13 O2: **fold in** r1's optional retry: a trial whose ONLY problem is the inconclusive-gap gate (gapEnd >= 140, i.e. the host was too slow for the trial to prove anything) is re-run, at most 2 retries, then FAILs loudly as today; retries are named in the scenario's outcome line. Only if the trial starts from fresh state (or the implementer resets it); a product failure (preview gone, modal gone, editor, focus) is NEVER retried.
- 2026-11-13 O3: product alternative (private `setIsFocused(true)` at open) — **dropped, no Backlog ticket**: SC-598 O2/O9 already measured and declined it (stuck preview after close, version fragility); the residual only bites a press queued within ~10 ms of the opening dispatch's end, i.e. a double-click, which closes the window by design (SC-604).
- 2026-11-13 O4: r1's "both plain failures were the session's first trial" — not pursued; the fix removes the race regardless of dispatch length (the in-page timer is armed after the press is handled).
- 2026-11-13 O5 (rulings on r3 findings): LOW-1 (proposal :33 wrong reason for the ~11 ms hold) — **fold** (use r3's replacement wording). INFO-2 (comments at obsidian-lifecycle.mjs:1799 and :1864-1867 imply `reopen` waits for a 10 ms helper timer it does not have) — **fold**. INFO-3 (comment :1839 "just before" the end mark; on head the 10 ms timer comes just after) — **fold**. INFO-4 (preview-gone message :8370 prints only the start gap, not `gapEnd`) — **fold**. INFO-6 (proposal §1 "every non-dblq trial" — all 6 fail on base) — **fold**. INFO-1 (a very slow host still fails inconclusively) — **drop**: intended by O2, a loud inconclusive FAIL only at 6x CPU throttle. INFO-5 (arm the 11 ms timer during the earlier point lookup for headroom) — **drop**: natural runs top out at gapEnd 107 ms vs 140, and moving the arm point re-opens the ordering argument r3 just verified.
- 2026-11-13 O6 (rulings on r5): INFO-1 (proposal run count / gapEnd range omit r3's runs) — **folded by owner** (proposal now "0 of 33 … gapEnd 23-107 ms"). INFO-2 (comment :1854 could add the head's 150 ms timer is armed then skipped) — **drop**: optional, the comment is already true.
- 2026-11-13 LAND-READY: dse `1cc54eac` on develop `3a5986d3`; superproject branch `ec35b4b2` = one pointer bump on workspace origin/main `b31eb542`. No CHANGELOG entry (harness only, not user-facing). SKILL proposal `sc616-dse-verify-proposal.md` for the dispatcher to apply at landing. No freeze rebaseline.
- SKILL.md updates (G-S91 flake bullet ~line 182; G-S83 footgun (12); battery row 4 if the part-5 time moves) go in `sc616-dse-verify-proposal.md` in this dir, for the dispatcher to apply at landing.
- 2026-11-13: the stalled r4 worker (afb42389) was stopped (status killed); after the stop the dse branch is still 1cc54eac, the superproject still ec35b4b2, both clean, and no process is running in the worktree.
- 2026-11-13 DONE: landed by the dispatcher on dse develop 1cc54eac / workspace main eef07402 (ledger preserved and the dse-verify proposal applied in 6c9af039; worktree removed). Done comment posted via linear-post.py --state Done; state verified Done with get_issue (labels DSE Plugin, Bug).
