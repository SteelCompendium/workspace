# SC-606 decisions ledger

Ticket: SC-606 — DSE: editing a logged Montage action fails to open its window when the hero's entry has no skills list.
Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05.
Worktree: /home/scott/code/steelCompendium/worktrees/sc606-montage-edit-no-skills (branch sc606-montage-edit-no-skills), dse base develop 8b84b635.

## Scott rulings (verbatim, dated)

(none yet — the ticket thread had 0 comments at pickup, 2026-11-11)

## Owner decisions (2026-11-11)

- O1. Scope: a montage participant with no `skills_used` key must work everywhere the model reads or writes `skills_used` (edit-mode LogActionModal open, the reuse warning, logging / correcting / removing an action, reset, tally). Survey every read/write site, not only model.ts:367.
- O2. No file churn: a write that does not change a hero's skills must not add `skills_used: []` (or any new key) to that hero's entry in the note. When a hero with no key logs a skill, the key appears with that skill. The implementer may default at parse or guard at read sites, provided O2 holds and serialize stays in §B.5 key order.
- O3. Regression coverage: jest (model unit + DOM test that opens LogActionModal in edit mode for a hero with no `skills_used` and asserts the window is fully built and nothing throws). Real-Obsidian evidence via the SC-598 r3 `monttextns` probe (red on base, green on head), NOT a committed lifecycle scenario: part 5 is at ~395 s vs a ~420 s ceiling and the crash is pure data, deterministic in jsdom. If a worker believes a committed real-Obsidian check is needed, it reports back instead of adding one (G-S95 reserved if ever needed; it would go in a sixth part).
- O4. No dse-verify SKILL.md edit expected (no new scenario, jest count only). Any SKILL proposal goes in this dir as a file.

## Rounds

- r1 implementer (survey + fix + tests + battery + probe): dispatched 2026-11-11, agent a11b24d7f3e8c980f (author; must not review). Brief sc606-brief-r1-impl.md.
- r1 result 2026-11-11: DONE. dse df250b20 (tests 95ca46f0, fix df250b20) on 8b84b635; superproject wt 7ab086d2 (CHANGELOG d12a014d + pointer bump). jest 7356/2 (7357/1 post-shots), lifecycle 57/57, e2e 272/276 0 failed 4 known-bug 169/169, shots 592 / 163/978 / 39/234 / 147, freeze 280/280, parity 0/0/24. Probe: base red (half-built sheet, TypeError, preview gone), head green.
- Follow-up rulings (2026-11-11): (F1) null / nameless participant crashes `findParticipant` -> filed Backlog SC-610 (related to SC-606), out of scope here. (F2) `addMontageHero` writes `skills_used: []` for a NEW hero -> dropped: a new entry in schema shape, not churn on an existing one.
- r2 reviewer dispatched 2026-11-11, agent a73a84a46a9c48d2b (independent of the r1 author). Brief sc606-brief-r2-review.md.
- 2026-11-11 r2 reviewer a73a84a46a9c48d2b hung ~15 min on `devbox run -c <workspace> -- bash probe-dom.sh` (no process; likely held prompt). TaskStop refused to owner; dispatcher declined to stop it and approved a fresh replacement if the watcher shows no movement. Replacement addendum sc606-brief-r2b-review-replacement.md.
- 2026-11-11 dispatcher: SC-594 landed, dse develop now da2bdbc6 (supersedes 8b84b635). New CURRENT: jest 7671 passed / 2 skipped (fresh worktree) · lifecycle 58/58 in SIX parts (parts 1-5 unchanged; part 6 `G-S92`, 1, ~103 s; G-S56 still last in SCENARIOS order) · e2e 272/276 ok, 0 failed, 4 known-bug, 169/169 · shots 592, 163/978, 39/234, 147 · freeze 280/280 · parity 0/0/24. Rebase onto da2bdbc6 before land-ready. Plan: the review continues on df250b20 (SC-594 touches host/hover-link code, not montage); a rebase round after the review re-runs the full battery against the new CURRENT (expected jest 7671 + 15 = 7686 / 2).
- 2026-11-11 21:20 watcher: no movement in 6 min -> r2b replacement reviewer dispatched, agent a39ccd19a0e73e279 (independent of r1 author a11b24d7f3e8c980f). a73a84a46a9c48d2b abandoned (still hung; ignore any late output from it unless it finishes cleanly).
- r2b result 2026-11-11: FIX. 0 C / 0 H / 1 M / 2 L / 3 INFO (report sc606-r2b-review-report.md). Base red / head green in real Obsidian confirmed; tests non-vacuous (12/234 red on base; 5 mutants all caught).
- Finding rulings (owner, 2026-11-11):
  - MEDIUM-1 (an edit that leaves the hero+skill unchanged writes `skills_used` into a key-less hero; reorders a keyed hero's list): FOLD — take the reviewer's prescribed fix (skip the remove/add skill calls when `existing.hero === next.hero && existing.skill === next.skill`; tally delta unchanged) plus a DOM test (note-only edit writes no key) and a model test (order unchanged). This also fixes the pre-existing reorder, so no Backlog ticket. O2 and the CHANGELOG wording stand.
  - LOW-1 (hand-typed scalar `skills_used: Climb` ignored, then replaced / written back): FOLD — treat a non-empty string as a one-item list in `skillsOf`, add, remove and reset (add -> [Climb, X]; remove of Climb -> []; reset -> []), with tests. Writes normalize the scalar to a list only when that hero's skills change (O2).
  - LOW-2 (`jest.useRealTimers()` at the end of the test body): FOLD — move to afterEach.
  - INFO-1 (`skills_used:` written back as `null`, same as base), INFO-2 (log then remove leaves `[]`: the user changed that hero's skills), INFO-3 (export jest count): DROP, no action.
- r3 = fix round + rebase onto da2bdbc6 + full battery, by r1 author a11b24d7f3e8c980f (resumed). Scoped re-review of the delta by r2b reviewer a39ccd19a0e73e279 (not an author).
- 2026-11-11 dispatcher: SC-603 landed, dse develop now 5f7c5336 (supersedes da2bdbc6). New CURRENT: jest 7685 passed / 2 skipped (fresh) · lifecycle 58/58 (21+16+9+4+7+1) · e2e 278/282 ok, 0 failed, 4 known-bug, 171/171 · shots 592, 163/978, 39/234, 147 · freeze 280/280 · parity 0/0/24. r3 implementer told (SendMessage) to rebase onto 5f7c5336 instead; r4 re-review uses 5f7c5336 as the base.
- r3 result 2026-11-11: DONE. dse 7866426e on 5f7c5336 (tests d924594c, r1 fix 00a990b5, r3 fix 7866426e); superproject wt bf06aa8b. +7 tests (red on r1 model). jest 7708/1 post-shots (= 7685+15+7 = 7707/2 fresh), lifecycle 58/58 (six parts), e2e 278/282 0 failed 4 known-bug 171/171, shots 592 163/978 39/234 147, freeze 280/280, parity 0/0/24. r4 scoped re-review -> a39ccd19a0e73e279.
- r4 result 2026-11-11: LAND for the code. 0 C / 0 H / 0 M / 1 L / 2 INFO (sc606-r4-rereview-report.md). range-diff: r1 commits carried unchanged. All r2b findings closed by probe. 7 new tests red on 00a990b5, green on 7866426e. Spot gates: jest 7707/2 equiv, e2e 278/282 0 failed 171/171, lifecycle p5 7/7, p6 1/1.
- r4 rulings (owner): LOW-1 (superproject branch on stale base 715368aa carrying pointer bumps 7ab086d2 -> df250b20 and bceda437 -> e7bf0708, dse commits no branch contains) -> handed to the dispatcher's landing: rebase the superproject onto current main, keep CHANGELOG d12a014d (resolve the Unreleased conflict next to SC-603's entry), one pointer bump to dse 7866426e, drop 7ab086d2 and bceda437. INFO-1 (warned duplicate reordered on Undo; same as base), INFO-2 (scalar -> log -> Undo writes [Climb]; the user changed skills) -> DROP, no action.
- LAND-READY 2026-11-11: dse sc606-montage-edit-no-skills @ 7866426e on develop 5f7c5336.
- DONE 2026-11-12: landed by the dispatcher on dse develop 7866426e (5f7c5336..7866426e), workspace main 94036d17 (CHANGELOG 418064ea, bump 360a5303; stale bumps 7ab086d2 / bceda437 dropped). Done comment posted; state Done verified via get_issue (completedAt 2026-11-12T05:14:57Z). Stuck r2 reviewer a73a84a46a9c48d2b never completed; it is still a live child and owner TaskStop is refused.
- 2026-11-12: stuck r2 reviewer a73a84a46a9c48d2b finally completed: ABANDONED (superseded), no report, no commits, no processes. Its partial probe findings match r2b MEDIUM-1 / LOW-1 / INFO-1 (all already ruled); nothing new. Owner has no live children left.
