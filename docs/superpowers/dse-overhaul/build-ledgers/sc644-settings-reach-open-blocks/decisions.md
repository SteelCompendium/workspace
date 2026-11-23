# SC-644 decisions ledger — settings reach open blocks

Ticket: SC-644 "Collapsible by default", "Start collapsed" and "Show edit button" settings
don't reach blocks that are already open. Labels DSE Plugin, Bug. Filed by SC-440.

Worktree: /home/scott/code/steelCompendium/worktrees/sc644-settings-reach-open-blocks
(dse branch `sc644-settings-reach-open-blocks` cut from dse develop `941b814f`; superproject
cut from workspace origin/main `016b1cdd`).

Baseline @ 941b814f: jest 12875 passed / 1 skipped with shots cache (fresh 12874 / 2) ·
lifecycle 64/64 · e2e `560/586 ok, 0 failed, 26 known-bug, coverage: 416/416 pairs` ·
shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 ·
parity 0/0/24.

Lifecycle id reserved for this effort if needed: G-S130.

## Scope (from the ticket, 2026-11-14)

1. "Collapsible by default" flipped in settings must reach blocks already on screen
   (Collapse button appears / disappears without reopening the note). e2e marker
   `knownBug('SC-644', '[SET-L01] …')` in `e2e/specs/settings/live-behavioural.e2e.ts`.
2. "Show edit button on rendered blocks" (experimental gate ON) must reach open blocks
   (pencil appears / disappears). e2e marker `knownBug('SC-644', '[SET-G06] …')` in
   `e2e/specs/settings/gate-on.e2e.ts`.
3. "Start collapsed": same cause; OPEN QUESTION — collapse already-open blocks, or only
   blocks drawn afterwards? No marker exists yet.

Not ours (queued, keep the mechanism reusable): SC-645 ("Edit Recoveries with a popover"
does not reach an open stamina bar), SC-646, SC-647, SC-651.

## Owner rulings (not Scott's — owner judgment, 2026-11-14)

- O1. Switching "Collapsible by default" OFF on a block that is currently collapsed must
  EXPAND it (a block with no Collapse control must never be stuck collapsed — the existing
  collapse invariant). Switching it back ON leaves the block expanded. Block keys still win
  over the global preference (SC-169 ladder: block keys > global prefs > built-in default).
- O2. Pending Scott's answer on "Start collapsed", implement the recommended behaviour
  (below) so an approval needs no extra round; keep the switch a small, isolated branch.
  Recommendation put to Scott: flipping "Start collapsed" does NOT collapse or expand blocks
  already on screen; it applies to blocks drawn afterwards (opening a note, re-rendering).

## Scott's rulings

(none yet — ask posted 2026-11-14 as the first SC-644 comment; ticket In Progress + Needs Review)

## Rounds

- **r1 (2026-11-14)** — implementer a21ec5b06e41de65c, brief `sc644-brief-r1-implementer.md` →
  `sc644-r1-impl-report.md`. Review will go to an orchestration:reviewer (not the author).
- **Base move (2026-11-14, dispatcher)** — SC-637 landed: dse develop `620d5774`, workspace main `11ee0b00`. New
  baselines at 620d5774: jest 12913 / 2 fresh (12914 / 1 with shots cache) · lifecycle 64/64 · e2e
  `567/591 ok, 0 failed, 24 known-bug, coverage: 416/416 pairs` · shots 592, host-leak 163/978, modal host-leak 40/240,
  capture clip 147 · freeze 280/280 · parity 0/0/24. Expected after SC-644: known-bug 22. Relayed to r1 implementer by
  SendMessage (rebase before final gates; superproject on 11ee0b00 with ONE pointer bump).
- **r1 result (2026-11-14)** — DONE. dse `92940547` on develop `620d5774` (29167670 fix, faabbbd4 tests, 92940547 e2e
  defaults fix). Superproject `85869486` on origin/main `28ed9439` (17a1b358 changelog, 85869486 ONE pointer bump). jest
  12935 / 1 cache (+21); lifecycle 64/64; e2e `571/593 ok, 0 failed, 22 known-bug, coverage: 416/416 pairs`; shots 592,
  host-leak 163/978, modal 40/240, clip 147; freeze 280/280; parity 0/0/24. Mechanism `src/framework/livePrefs.ts`
  `watchPrefs`; O2 switch `START_COLLAPSED_REACHES_OPEN_BLOCKS=false` in pipeline.ts. New e2e SET-L05 (O1), SET-L06 (O2).
  Follow-ups (rulings pending review): F1 e2e `dse.setPrefs({})` can lose to the previous scenario's debounced pref save
  flushed on unload (worked around in L05/L06) → provisional FOLD (`prefsStorage.flush()` before saveData in
  `e2e/driver/dse.ts`); F2 focus inside the removed chrome panel falls to body on rebuild → ask reviewer; F3 SKILL numbers →
  dispatcher at landing.
- **r2 (2026-11-14)** — independent review, reviewer aa5bfbe1f77142d69 (not the author), brief `sc644-brief-r2-reviewer.md` →
  `sc644-r2-review-report.md`.
- **Base move 2 (2026-11-14, dispatcher)** — SC-627 landed: dse develop `afd1436c`, workspace main `fcac51ba`. Baselines
  at afd1436c: jest 12922 / 2 fresh (12923 / 1 shots cache) · lifecycle 64/64 · e2e `570/593 ok, 0 failed, 23 known-bug,
  coverage: 416/416 pairs` · shots 592, host-leak 163/978, modal 40/240, clip 147 · freeze 280/280 · parity 0/0/24.
  Expected after SC-644: known-bug 21, e2e ~574/595 (+4 tests), jest ~12944 / 1 cache. Owner ruling: r2 review continues on
  the 620d5774 base (not disrupted); the rebase onto afd1436c / fcac51ba (changelog commit + ONE pointer bump) goes into the
  r3 fix round, with the scoped re-review checking the range-diff.
- **r2 result (2026-11-14)** — FIX, 0 HIGH / 1 MEDIUM / 6 LOW / 5 INFO (reviewer aa5bfbe1f77142d69). Gates re-run green on
  92940547 (jest 12935/1, e2e 571/593 22 kb 416/416, lifecycle 64/64). Mutants 13/17 killed. Owner rulings — ALL FOLDED
  into r3 (Scott: "do the right thing over minimizing work"):
  - MEDIUM-1 hero sheet's own "Edit definition" button (`src/elements/hero/view.ts:226`) ignores the authoringControls flip
    → FOLD: `watchPrefs` in HeroSheetView adding/removing just that button, jsdom test both ways.
  - LOW-1 nested block's chrome stripped by the root-wide querySelectorAll (`pipeline.ts:629`) → FOLD with the
    `closest('[data-dse-element]') === root` filter (as `focusHandoff.ts:261`).
  - LOW-2 a throwing rebuild skips `ensureCollapseInvariant` (`pipeline.ts:823-828`) → FOLD: call it in the catch; replace
    the vacuous `toBeDefined()` test with a real assertion.
  - LOW-3 O1 writes `false` into the session (`pipeline.ts:663`), overriding Start collapsed / author `collapsed: true` on a
    later reopen → FOLD: write `undefined`. (Consistent with O1: the LIVE block stays expanded on ON; a later draw follows
    the ladder.)
  - LOW-4 test gap, mutant M11 survives (`chromeLivePrefs.test.ts:263`) → FOLD: multi-flip + rolling remount test.
  - LOW-5 = F2 focus falls to BODY on rebuild — measured reachable in real Obsidian (R2P-01) → FOLD the reviewer's fix
    (restore focus to the same chrome item / pencil, else the collapse control, else first focusable in the block, only if
    nothing else holds focus).
  - LOW-6 = F1 e2e setPrefs race, real 3/3 → FOLD the reviewer's version (flush then wait until data.json on disk equals the
    in-memory settings, as `diskData()` does; drop `shippedPrefs` in live-behavioural.e2e.ts). NOT a bare flush (unordered
    double write).
  - INFO M08/M13/M14 survivors → drop (reasons in report). INFO "view unloaded earlier in the same notify pass rebuilt once"
    → drop here, noted for SC-645's owner (unreachable today). F3 SKILL numbers → dispatcher at landing.
- **r3 (2026-11-14)** — fix round + rebase onto dse `afd1436c` / workspace `fcac51ba`, resume implementer
  a21ec5b06e41de65c, brief `sc644-brief-r3-implementer.md`; scoped re-review → reviewer aa5bfbe1f77142d69 (not the author).
- **Base move 3 (2026-11-14, dispatcher)** — SC-638 landed: dse develop `12aaf5b5`, workspace main `9978681a`. Baselines
  at 12aaf5b5: jest 13032 / 2 fresh (13033 / 1 cache) · lifecycle 64/64 · e2e `576/597 ok, 0 failed, 21 known-bug,
  coverage: 416/416 pairs` · shots 592, host-leak 163/978, modal 40/240, clip 147 · freeze 280/280 · parity 0/0/24.
  SC-638 changed the shared e2e driver: `openNote(rel)` times out on an error card unless `{ errorCard: true }`.
  Expected after SC-644: known-bug 19, e2e 580/599 + new r3 e2e tests. Relayed to r3 implementer (SendMessage) mid-round.
- **r3 result (2026-11-14)** — DONE. dse `3a0e79a3` on develop `12aaf5b5`; superproject `3a574dd6` on `93d78f06`
  (a34f8feb changelog + ONE pointer bump; origin/main since moved to `ea6b4582`, docs only). jest 13068 / 1 cache (+35);
  e2e x2 `580/599 ok, 0 failed, 19 known-bug, coverage: 416/416 pairs`; lifecycle 64/64; shots 592, host-leak 163/978,
  modal 40/240, clip 147; freeze 280/280; parity 0/0/24. All 7 findings folded; mutants N1-N15 + M11 killed.
  Follow-up rulings:
  - Hero "Edit definition" button removed while focused drops focus to body → FOLD now (same class as LOW-5; consistency).
    Small r3b delta by the author: tsc/lint/jest only; the r4 reviewer's full e2e + lifecycle on the final head cover it.
  - O2 switch `START_COLLAPSED_REACHES_OPEN_BLOCKS=true` branch untested → DROP for now: dead code under the recommended
    behaviour; if Scott picks "collapse open blocks", that round adds its tests.
  - SKILL numbers → dispatcher at landing.
- **r3b (2026-11-14)** — author a21ec5b06e41de65c: hero button focus hand-back + superproject rebase onto current origin/main.
- **r3b result (2026-11-14)** — DONE. dse `16737a8e` on develop `12aaf5b5`; superproject `b6a33ee0` on origin/main
  `ea6b4582` (bd44886f changelog + ONE pointer bump). jest 13070 / 1 cache (+2); tsc/lint clean; 3 mutants killed.
  e2e/lifecycle/shots not re-run (r4 reviewer runs them on this head).
- **r4 (2026-11-14)** — scoped re-review + evidence shots, reviewer aa5bfbe1f77142d69 (not the author), brief
  `sc644-brief-r4-rereview.md` → `sc644-r4-rereview-report.md`.
- **Base move 4 (2026-11-14, dispatcher)** — SC-628 landed: dse develop `10c271fe`, workspace main `430dd30b`. Baselines
  at 10c271fe: jest 13307 / 2 fresh · lifecycle 64/64 · e2e `585/604 ok, 0 failed, 19 known-bug, coverage: 416/416 pairs`
  · shots 592, host-leak 163/978, modal 40/240, clip 147 · freeze 280/280 · parity 0/0/24. Expected after SC-644:
  known-bug 17, e2e 589/606, jest fresh 13307 + 37 = ~13344 / 2. Owner ruling: r4 re-review continues on 16737a8e /
  12aaf5b5 undisturbed; r5 = rebase onto 10c271fe / current origin/main by the author + full battery, then a range-diff
  check by the reviewer (not the author).
- **r4 result (2026-11-14)** — LAND, 0 HIGH/MEDIUM, 3 LOW (tests only), 4 INFO (reviewer aa5bfbe1f77142d69). Gates on
  16737a8e: tsc/lint clean; jest 13070/1; e2e `580/599 ok, 0 failed, 19 known-bug, coverage: 416/416 pairs`; lifecycle
  64/64. Range-diff of r1 commits identical. Shots: sc644-shot-{collapsible,editbutton,startcollapsed}.png (ledger dir).
  Rulings:
  - LOW-1 (R16) hero sheet re-render with setting ON keeps exactly one "Edit definition" → FOLD (test).
  - LOW-2 (R15) removed button's owner Component unloaded: 10 flips, child count constant → FOLD (test).
  - LOW-3 (R10/R12) focus restore with a nested block present → FOLD (test in chromeLivePrefs.test.ts).
  - INFO R11 → drop (no user-visible effect). INFO off-then-on focus lands on the stamina bar (ruled fallback order) →
    drop. INFO hero subscribes in constructor → drop (same as applyPrefOverrides). INFO setPrefs waits up to 800 ms → drop.
- **r5 (2026-11-14)** — author a21ec5b06e41de65c: the 3 LOW tests + rebase onto dse `10c271fe` / current workspace
  origin/main (CHANGELOG merge) + FULL battery on the rebased head. Then range-diff check by reviewer aa5bfbe1f77142d69.
- **Evidence posted (2026-11-14)** — second SC-644 comment: 3 real-Obsidian shots (owner eyeballed collapsible +
  startcollapsed), consolidated ask restating the Start-collapsed question (self-contained). Ticket In Progress + Needs
  Review. Waiting on Scott; r5 (rebase + 3 tests + full battery) running meanwhile.
- **r5 result (2026-11-14)** — DONE. dse `2762beb5` on develop `10c271fe`; superproject `7d8ca778` on origin/main
  `20004425` (current; 430dd30b is its ancestor): e0be5a87 changelog + ONE pointer bump. tsc/lint clean; jest 13349 / 1
  cache (+4); e2e `589/606 ok, 0 failed, 17 known-bug, coverage: 416/416 pairs` x2 (a first run had SET-X03 "timed out
  waiting for the picker to filter to Settings/token.svg" + dependent SET-X04, load 5-8; bundles copied to
  `sc644-r5-e2e-flake-bundle/`); lifecycle 64/64; shots 592 / 163/978 / 40/240 / 147; freeze 280/280; parity 0/0/24.
  Mutants R16/R15/R10/R12 killed. Owner ruling on SET-X03: our LOW-6 changed the shared `setPrefs` driver, so the
  r6 reviewer must judge whether it is implicated before it is called a flake; ticket filed only if unrelated.
- **r6 (2026-11-14)** — reviewer aa5bfbe1f77142d69: range-diff check of the r5 rebase + 4 tests, SET-X03 diagnosis.
- **r6 result (2026-11-14)** — LAND (reviewer aa5bfbe1f77142d69). Range-diff commits 1-6 identical; 2762beb5 = the 4 tests;
  R10/R12/R15/R16 killed on re-run. Superproject diff vs origin/main = CHANGELOG.md + draw-steel-elements only.
  SET-X03: NOT implicated (fields.e2e.ts never calls setPrefs; fresh Obsidian per spec; no pref flip) — 6/6 `--only` and
  2/2 `--element=settings` green on head AND base. Filed **SC-657** (Backlog, Low, related SC-440, SC-644).
- **PARKED on Scott (2026-11-14)** — branch is otherwise land-ready: dse `2762beb5` on develop `10c271fe`; superproject
  `7d8ca778` on origin/main `20004425` (changelog e0be5a87 + ONE pointer bump). Final-head gates (r5): tsc/lint clean;
  jest 13349 / 1 cache; e2e `589/606 ok, 0 failed, 17 known-bug, coverage: 416/416 pairs` x2; lifecycle 64/64; shots 592,
  host-leak 163/978, modal 40/240, clip 147; freeze 280/280; parity 0/0/24. Waiting on Scott's answer to the
  Start-collapsed ask (comment 2). On "yes": record ruling, rebase if bases moved (re-gate), report land-ready. On "collapse
  open blocks": flip `START_COLLAPSED_REACHES_OPEN_BLOCKS`, add its tests, review, re-gate.
  Landing notes for the dispatcher: dse-verify CURRENT needs jest +41 over base (fresh 13307/2 → expect 13348/2; cache 13349/1 measured),
  e2e +4 tests / +2 ok-from-markers (589/606, 17 kb), coverage pairs unchanged; preserve this ledger dir incl.
  `sc644-r5-e2e-flake-bundle/` (SC-657 cites it).

## Scott's rulings (2026-11-22)

- **S1 (2026-11-22, Scott, SC-644 comment, verbatim):** "Go with recommendation"
  - Answers the comment-2 ask: "is it right that turning on "Start collapsed" leaves blocks that are already open alone,
    and collapses them only the next time they are drawn?" → YES. O2's recommended behaviour is now Scott's ruling;
    `START_COLLAPSED_REACHES_OPEN_BLOCKS` stays `false`. ~~"(none yet — ask posted 2026-11-14 …)"~~ superseded by S1.
  - Scott set `Ready for Agent`. New owner session (fable, dispatcher session e255a3cd-5cdb-4dc4-83be-b58e80eb1057)
    resumed from this ledger 2026-11-22.
- **Resume state (2026-11-22)** — ticket flipped to Awaiting, `Ready for Agent` removed (labels now DSE Plugin, Bug).
  Bases moved since the park: dse develop `3b47e55b` (92 commits past `10c271fe`; SC-675 last), workspace origin/main
  `1c877748`. Develop touched 2 of our 9 files in regions away from ours (pipeline.ts: SC-652 passthrough lines; hero/view.ts:
  SC-662 `undoIsStale` guards). Markers SET-L01 / SET-G06 are still `knownBug('SC-644', …)` on develop.
  Baseline at 3b47e55b (HANDOFF, SC-675 owner): jest 13855 / 2 fresh · e2e `658/667 ok, 0 failed, 9 known-bug, coverage:
  418/418 pairs` · lifecycle 63/64 (G-S61 torn-read = SC-668, red on base) · shots 592, 163/978, 40/240, 147 · freeze
  280/280 · parity 0/0/24. dse-verify's CURRENT block is stale (`129beb18`).
  Expected after SC-644: jest 13897 / 1 cache (13896 / 2 fresh); e2e `662/669 ok, 0 failed, 7 known-bug, 418/418 pairs`.
- **r7 (2026-11-22)** — FRESH implementer a3dd74bc6803e4e65 (prior author's transcript is from an earlier session):
  rebase dse onto `3b47e55b`, superproject onto `1c877748` (changelog + ONE pointer bump), full battery. Brief
  `sc644-brief-r7-implementer.md` → `sc644-r7-impl-report.md`. Then r8: range-diff check by a fresh orchestration:reviewer
  (not the r7 worker).
- **r7 result (2026-11-22)** — DONE (implementer a3dd74bc6803e4e65; owner verified heads, e2e line, range-diff file).
  dse `2302b561` on develop `3b47e55b` (7 commits, range-diff all `=`, no conflicts, no npm ci needed). Superproject
  `427eed31` on origin/main `1c877748` (76eb31a4 changelog + ONE pointer bump). tsc (incl. -p e2e) / lint clean; jest
  13897 / 1 cache; lifecycle 64/64 (G-S61 green); e2e `662/669 ok, 0 failed, 7 known-bug, coverage: 418/418 pairs` first
  run, no flake; shots 592, 163/978, 40/240, 147; freeze 280/280; parity 0/0/24. Zero `knownBug('SC-644'` left; develop's
  two new `setPrefs` callers (sidebar/pending-saves, negotiation/outside-edit) green. Logs:
  `<scratchpad>/sc644-r7-impl/`.
  Follow-up ruling:
  - Stale "pending Scott's answer" comments (`e2e/specs/settings/live-behavioural.e2e.ts:58`, `src/framework/pipeline.ts:92-94`)
    → FOLD as a comment-only commit (r7b): cite S1 (2026-11-22), and say plainly that the `true` path of
    `START_COLLAPSED_REACHES_OPEN_BLOCKS` is UNTESTED and needs its tests before anyone flips it. Proof of no runtime
    change: built `main.js` sha256 identical before/after.
  - Remove the switch + dead `true` branch → DROP: behaviour-identical churn in twice-reviewed code right before landing;
    the corrected comment removes the trap (it names the branch as untested).
- **r7b (2026-11-22)** — same implementer: comment-only commit + recreate the ONE pointer bump. Then r8 reviewer on the final head.
- **r7b result (2026-11-22)** — DONE. dse `76644e80` (8 commits on `3b47e55b`; 8th = comment-only, +7/−4 in 2 files;
  owner read the diff). Superproject `e10f4e5c` = ONE pointer bump on changelog `76eb31a4` on origin/main `1c877748`.
  `main.js` sha256 identical before/after (`5d77d566…e1c3`). tsc (incl. -p e2e) / lint clean; jest 2 suites 62 passed.
  Neither origin moved.
- **r8 (2026-11-22)** — scoped re-review of the rebase delta + interaction with SC-652 / SC-662 / focus hand-offs, FRESH
  orchestration:reviewer (not the r7 worker). Brief `sc644-brief-r8-reviewer.md` → `sc644-r8-review-report.md`.
- **Base move 5 (2026-11-22, dispatcher, while r8 runs)** — SC-434 landed: dse develop `f42546b8` (was `3b47e55b`;
  CI-only: `.github/workflows/plugin-ci.yml` + `e2e/README.md`, no TS/CSS), workspace origin/main `fab96290`. No new
  battery baselines. Dispatcher: "Rebase onto f42546b8 before reporting land-ready." Owner ruling: r8 review continues
  undisturbed on `76644e80` / `3b47e55b`; then r9 = rebase by the r7 implementer with proof that the gates carry
  (range-diff identical, built `main.js` sha256 identical to `5d77d566…e1c3`, tsc/lint/full jest), no fresh full battery
  unless that proof fails.
- **Base move 6 (2026-11-22, dispatcher, while r8 runs)** — SC-641 landed: dse develop `bdf0255e` (was `f42546b8`;
  ds-negotiation missing-Interest defaults + Reset fallback — real TS), workspace origin/main `8e7a7bbe` (CHANGELOG gained
  an SC-641 bullet under Unreleased). CURRENT @ bdf0255e: jest 13861 / 2 fresh · lifecycle 64/64 · e2e `660/667 ok, 0
  failed, 7 known-bug, coverage: 418/418 pairs` · shots 592 · freeze 280/280 · parity 0/0/24. Dispatcher: "Rebase onto
  bdf0255e before reporting land-ready." Supersedes the base-move-5 plan (~~main.js-identical proof~~ no longer applies:
  the base has real TS now).
  Expected after SC-644 on bdf0255e: jest 13902 / 2 fresh (13903 / 1 cache); e2e `664/669 ok, 0 failed, 5 known-bug,
  coverage: 418/418 pairs`; lifecycle 64/64.
  Owner ruling for r9: rebase after r8 returns; re-run tsc (incl. -p e2e), lint, full jest, full lifecycle, full e2e on the
  rebased head. shots / freeze / parity CARRY from base (592, 163/978, 40/240, 147, 280/280, 0/0/24) only if the built
  `styles.css` is byte-identical to a clean `bdf0255e` build and the range-diff is identical; otherwise run them. Reason:
  SC-644 has no CSS and four full runs (r1, r3, r5, r7) all read 280/280; a short gate round narrows the window for yet
  another base move.
- **r8 result (2026-11-23)** — LAND (fresh reviewer a2e3d1bbc03c28ced, not an author). 0 HIGH / 0 MEDIUM / 0 LOW; 3 INFO.
  On dse `76644e80` / `3b47e55b`: range-diff 1-7 `=`, commit 8 comment-only (read). tsc, tsc -p e2e, lint rc 0; jest
  13897 / 1; e2e `--element=settings` 80/82 ok, 0 failed, 2 known-bug (SC-645, SC-647); lifecycle 64/64 (G-S61 green);
  extra e2e sidebar 16/16, CTR-K01 + MONT-X15..X18 5/5, NEGO-O01..O19 19/19. 30 jsdom probes + 2 real-Obsidian probes pass
  (SC-652 shapes kept across flips, O1 on non-boolean `collapsed:`, pinned sidebar cards follow both settings with one
  panel each, a sidebar press inside its 400 ms debounce survives a flip, no focus theft from open windows / hand-offs).
  Rulings:
  - I-1 pinned card ignores an outside edit to its `collapsed:` key (pre-existing, same on base) → DROP, no new ticket:
    it is exactly SC-665 (Backlog, filed by SC-652's owner; owner read it).
  - I-2 SC-652 passthrough keeps values not bytes (develop's behaviour, identical with and without flips) → DROP, not ours.
  - I-3 `holdChromeFocus` is a no-op when focus is outside the block (design, r2 LOW-5) → DROP.
- **r9 (2026-11-23)** — r7 implementer a3dd74bc6803e4e65 resumed: rebase onto dse `bdf0255e` / workspace origin/main
  `565a35c1` (moved again past 8e7a7bbe), gates per the base-move-6 ruling.
- **r9 result (2026-11-23)** — DONE (owner verified heads, range-diff file, jest + e2e lines, hashes, changelog diff).
  dse `fefd9029` (8 commits) on develop `bdf0255e`; superproject `a8f93953` on origin/main `565a35c1` (2f6df5b4 changelog +
  ONE pointer bump; diff = CHANGELOG.md + draw-steel-elements). Range-diff vs 76644e80 series: 8/8 `=`. No conflicts.
  tsc (incl. -p e2e) / lint clean; jest 13903 / 1 cache; lifecycle 64/64 (G-S61 green); e2e `664/669 ok, 0 failed,
  5 known-bug, coverage: 418/418 pairs` (first run). `styles.css` sha256 identical to a clean bdf0255e build
  (`18730938…f1f9`) → shots 592, host-leak 163/978, modal 40/240, clip 147, freeze 280/280, parity 0/0/24 CARRIED from
  base (last measured on this branch in r7, one base earlier: same numbers). Neither origin moved at the final fetch.
  No further review round: range-diff is all `=` against the r8-reviewed head and the base delta (SC-434 CI, SC-641
  negotiation) touches none of our 9 files.
- **LAND-READY (2026-11-23)** — reported to the dispatcher. Third SC-644 comment posted (`sc644-comment3.md`), state Awaiting.
  Landing notes: dse-verify CURRENT after landing = base bdf0255e + jest 41 (fresh 13902 / 2; cache 13903 / 1 measured),
  e2e 664/669, 5 known-bug, 418/418 pairs, lifecycle 64/64, shots/freeze/parity unchanged. Preserve this ledger dir incl.
  `sc644-r5-e2e-flake-bundle/` (SC-657 cites it). No freeze delta, no rebaseline. No lifecycle id used (G-S130 free).
- **LANDED + CLOSED (2026-11-23)** — dispatcher landed: dse develop `fefd9029` (fast-forward, 8 commits), workspace main
  merge `c09b4a1f`, bookkeeping `b79eef2b`; worktree removed. Owner verified origin/develop = fefd9029 and main's pointer.
  Closing comment posted (`sc644-comment-done.md`), SC-644 → Done (labels DSE Plugin, Bug). Nothing left open; SC-665
  (Backlog) covers the reviewer's pre-existing sidebar observation; SC-657 (Backlog) the SET-X03 flake.
