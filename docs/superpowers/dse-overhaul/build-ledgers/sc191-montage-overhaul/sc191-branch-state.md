# SC-191 branch state (owner bookkeeping)

- 2026-08-29: round-4 design commit `617a254` on branch `sc191-montage-overhaul`
  (dse), based on origin/develop @ `c09cf6f`. NOT pushed. Round-4 battery was green
  against that base (freeze 210/210 on the pre-SC-120 baseline).
- Dispatcher notice, 2026-08-29: origin/develop has since moved twice —
  SC-190 (`c09cf6f` → `6035d12`), then SC-120 (`6035d12` → `1619396`, including a
  sanctioned 24-line freeze rebaseline; backup `freeze-baseline.sha256.pre-sc120-bak`).
- ACTION for next worker round (implementation): fetch + rebase onto current
  origin/develop tip FIRST, re-run the full battery against the post-SC-120 baseline.
  Not blocking the round-4 review post (mocks only, no shipped code touched).
- 2026-08-29 (later): round-5 commit `6991108` on origin/develop @ `1619396`, NOT pushed.
  Round-5 battery green vs post-SC-120 numbers (jest 3394/1, shots 474x2, freeze 210/210,
  parity 0/0/16).
- Dispatcher notice: SC-195 landed — origin/develop moved `1619396` → `778a341`, NO
  freeze-baseline change. Next worker round (implementation) must fetch + rebase onto
  current tip first; expected battery numbers should still be re-read from dse-verify
  SKILL.md at dispatch time.
- 2026-08-29 (evening): Scott ruled on round 5 (handle picked; round 6 = flip tier
  strip to Power Roll orientation + consequence/reward marks). Round-6 Opus worker
  dispatched with brief sc191-round6-brief.md; will rebase onto origin/develop 778a341
  (post-SC-195) first. Ticket flipped to Awaiting, Ready for Agent label removed.
- 2026-08-29 (later evening): round-6 commit `951d679` on origin/develop @ `778a341`
  (post-SC-195 rebase, clean), NOT pushed. Battery green vs current numbers (jest 3491/1,
  shots 478x2 byte-identical, freeze 210/210, parity 0/0/16). Round-6 comment posted
  (rider pick: pip recommended vs ring/double; edge wash; crit row keep). Ticket
  In Progress + Needs Review. Design likely settles after this pick -> implementation.
- 2026-09-01 (new owner session 4931eaaf): Scott ruled on round 6 (pip wins; badge padding
  fix, no approval needed; pick one richer pip treatment ourselves; "ready to get this
  ticket finished"). DESIGN SETTLED. Ticket flipped to Awaiting, Ready for Agent removed.
  origin/develop still 778a341. Freeze baseline has 2 montage print lines that will move
  by design -> sanctioned rebaseline ask to be batched into the implementation-review
  comment. Round 7 = Opus SPEC round (brief sc191-round7-spec-brief.md -> output
  sc191-impl-spec.md), then implementer slices per the spec, then independent review with
  integrity probes (element writes into user notes via _dse_anchor).
- 2026-09-01: round-7 spec DONE (Opus, ~310k tokens, no tracked edits) ->
  sc191-impl-spec.md (481 lines): schema purely additive (description, entries[]), no
  migration; 4 slices; 0 open questions. Badge stretch diagnosed (round6.css:193
  width:100%/max-width:4.6em -> 74.30px vs shipped 51.25px; fix = delete override, size
  key track to badge box 3.21em/2.85em narrow). Pip FINAL = gold-filled (--dse-vp
  #e0b050) forged tab with soft sheen + 1px steel-grey rim (--dse-metal-line); owner
  eyeballed sc191-r7-pip-gold-dark.png and ACCEPTED. Slice 1 (model+tests, pixel-neutral)
  dispatched to a Sonnet implementer; brief sc191-slice1-brief.md. Author tracking:
  spec = reviewer-A (agent a429c1b45994803b2); slice 1 = implementer-B. Reviews must go
  to identities other than the author.
- 2026-09-01: slice 1 DONE (implementer-B, ~221k tokens). origin/develop moved 778a341 ->
  69eb5f7 (SC-184 sidebar, 10 commits, no package.json change); branch rebased. Commit
  d154b9f (model: description/entries/MontageEntry, key order, omit-when-default, helpers
  montageTallies/montageBandCopy; tests montage-serialize + montage-tally). Battery on
  69eb5f7: jest 3537/1/192 (pre-slice 3514/191), shots 478 byte-identical x2, freeze
  210/210 zero montage movement, parity 0/0/16. Not pushed. Known: montageOutcome 0/0
  pending-band bug deliberately left for slice 2 (spec §I). Slice 2 dispatched to a fresh
  implementer-C (brief sc191-slice2-brief.md). Review of slices 1-2 planned next (Opus,
  not reviewer-A's own spec judgement calls -> reviewer-D).
- 2026-09-02 ~00:50: slice-2 implementer-C was killed by the session rate limit AFTER
  building everything (views, fixtures, CSS, freeze package: rebaseline.txt + 4 crops in
  ledger dir; tsc/lint/jest/shots x2/freeze logs in scratch sc191-slice2/) but BEFORE
  parity, commit, and report. Tree left uncommitted on top of d154b9f. Resumed via
  SendMessage with the exact on-disk state; remaining = verify final tree, parity last,
  commit "SC-191 slice 2 — head, board, outcome band, fixtures", write
  sc191-slice2-report.md. If the resume dies ("No transcript found"), dispatch a FRESH
  implementer with sc191-slice2-brief.md + this note: do NOT rebuild, finish from disk.
- 2026-09-02: slice 2 DONE after resume. Commit b2f696e "SC-191 slice 2 — head, board,
  outcome band, fixtures" on 69eb5f7. Battery: tsc/lint clean, jest 3559/1, shots 498
  PNGs byte-identical x2 (+20 new), freeze: EXACTLY the 2 montage print lines FAIL
  (old 8e5cc6ae… -> new 0ba0ceb9…), rebaseline.txt + 4 crops in ledger dir, parity
  0/0/16. Report sc191-slice2-report.md. Review 1 (slices 1-2) dispatched to a FRESH
  Opus reviewer-D (brief sc191-review1-brief.md); spec author reviewer-A is NOT used for
  this review (its own spec's judgement calls are under review).
- 2026-09-02: owner eyeballed montage-mid--steel-dark.png (slice-2 real render). Design
  matches the settled look. ONE suspected logic bug sent to reviewer-D as an addendum:
  band headline "IF IT ENDED NOW — Total Failure" contradicts its own rule line "Partial
  Success needs successes to lead failures by 2 — currently +3" (5 succ / 2 fail, round
  3/3). Reviewer to locate (montageOutcome/montageBandCopy vs fixture vs copy) and probe
  the boundaries. Slice-3 brief placeholders filled (tip b2f696e; adjust if a fix round
  moves the tip).
- 2026-09-02: review 1 DONE (reviewer-D, ~296k tokens): FIX-ROUND, 2 HIGH / 5 MED / 6 LOW /
  8 INFO; report sc191-review1-report.md. Model+serialization sound; H-1 = pre-existing
  `exhausted &&` guard hides Partial Success while live (owner's eyeball confirmed);
  H-2 = board cells print as white boxes (the sanction "after" crop is WRONG — do NOT post
  the sanction ask until fix 1 regenerates the package). Owner rulings on LOW/INFO in
  decisions.md. Fix round 1 resumed on implementer-C (slice-2 author) with
  sc191-fix1-brief.md; expected outputs: commit "SC-191 fix 1 — …", regenerated
  rebaseline.txt + 4 crops + NEW widening.txt (10 lines), sc191-fix1-report.md. Next:
  scoped re-review of the fix delta by reviewer-D (has findings context), then slice 3.
- 2026-09-02: fix 1 DONE (implementer-C). Commit 7d4451a on 69eb5f7. Battery: jest
  3579/1, shots 498 byte-identical x2 + new in-run gate assertMontageTrackWidths, freeze
  exactly 2 montage lines (new hash d747f358…), parity 0/0/16. Freeze package regenerated
  (rebaseline.txt, widening.txt 10 lines, 4 crops); implementer eyeballed after-print
  crop clean. Follow-ups L-3/L-4 tests folded into slice 3. Scoped re-review of
  b2f696e..7d4451a dispatched to reviewer-D (sc191-rereview1-brief.md).
- 2026-09-02: re-review 1 DONE (reviewer-D): CLEAR-FOR-SLICE-3, 0 new findings, 0
  regressions; all 13 fixes verified by execution; after-print crop viewed and clean.
  Slices 1-2 + fix 1 = DONE at 7d4451a. Slice 3 dispatched to a FRESH implementer-E
  (brief sc191-slice3-brief.md, tip 7d4451a, expected jest 3579/1, shots 498+new ids).
  Author map: spec=A (Opus), slice1=B, slice2+fix1=C, review1+rereview1=D (Opus),
  slice3=E. Final review (slices 3-4 + integrity probes in a real vault) must NOT be D
  reviewing its own... D did not author code, so D is eligible; prefer a fresh Opus F
  for a cold-eyes full pass anyway.
- 2026-09-02 ~21:10 ET: slice-3 implementer-E was rate-limit killed EARLY (still reading
  mocks; worktree clean at 7d4451a, nothing on disk). Resumed via SendMessage. If the
  resume dies ("No transcript found"), dispatch a FRESH implementer with
  sc191-slice3-brief.md — no on-disk state to preserve. No new Scott comment as of this
  check (newest = owner's 2026-09-02 01:31 progress comment).
- 2026-09-02 ~21:15 ET: MACHINE CONDITION — Obsidian self-updated to 1.14.0
  (~/.config/obsidian/obsidian-1.14.0.asar); host-copy pin is 1.13.7 with no override ->
  `npm run shots` aborts HOST COPY DRIFTED on every DSE branch here. origin/develop still
  69eb5f7 (no re-extract landed yet). Slice-3 worker instructed: finish + tsc/lint/jest +
  commit; report shots/freeze/parity as BLOCKED-BY-HOST-PIN; never touch the pin in this
  branch. Owner asked the dispatcher who owns the develop-level re-extract; SC-191 must
  rebase onto it and re-run the full battery (slice 3 shots/freeze/parity, and the final
  package regenerated in slice 4) before review 2.
- 2026-09-02 ~21:20 ET: dispatcher ruling — SC-202 owns the Obsidian 1.14.0 host-pin
  re-extract (pin-bump commit in its own branch, its round-1 fix round). Do NOT dispatch
  a chore for it. Sequencing: SC-202 lands on develop first; dispatcher pings SC-191
  when its dse tip is on origin/develop -> rebase sc191-montage-overhaul onto it, then
  re-run the FULL battery (slice-3 shots/freeze/parity; slice 4 regenerates the freeze
  package from the final tree). Until then slice 3 reports shots/freeze/parity as
  BLOCKED-BY-HOST-PIN; nobody touches the pin/host-copy/asar in this branch.
- 2026-09-02 ~22:00 ET: slice 3 DONE (implementer-E). Commit 0c8fc27 on 69eb5f7 (no
  rebase; SC-202 not landed yet). jest 3593/1/192, shots 506 (498+8 new) byte-identical
  x2, freeze exactly the 2 montage lines, parity 0/0/16; in-run gates print-twin parity
  OK / nested corner-radius OK / montage track widths OK ran before the pin abort; button
  host-leak sweep NOT run (behind the abort) -> owed by the post-SC-202 full re-gate.
  Badge 51.25x22.14 px verified. Follow-ups ruled in decisions.md (all dropped). Slice 4
  dispatched to a FRESH implementer-F with the conditional rebase/gate opening.
- 2026-09-02 ~22:10 ET: slice 4 running (implementer-F, brief sc191-slice4-brief.md,
  conditional rebase opening). STAGED SEQUENCE after slice 4: (a) on the dispatcher's
  SC-202-landed ping -> re-gate round (sc191-regate-brief.md: rebase onto SC-202 tip,
  full battery incl. host-copy pin OK 1.14.0 + button host-leak sweep, regenerate
  rebaseline.txt/widening.txt/crops); (b) review 2 (sc191-review2-brief.md, FRESH Opus
  reviewer-G; fill <SLICE4-SHA>/<DEVELOP-SHA>/<SHOTS>); (c) fix round(s) + scoped
  re-review as needed; (d) owner eyeballs the deciding captures, finalizes
  sc191-impl-review-comment.md (sanction ask + review-for-landing), posts with
  --state "In Progress" + adds Needs Review label; (e) on Scott's sanction ->
  land-ready report to the dispatcher (branch, tip, base, gate numbers, rebaseline.txt +
  widening.txt paths). Owner eyeballed montage-strip-pinned--steel-dark.png: matches the
  settled design; Partial Success headline now correct.
- 2026-09-03 08:55 ET: slice-4 implementer-F was rate-limit killed mid-task (regenerating
  docs-shots for montage-sheet-modal.png). On disk, UNCOMMITTED on 0c8fc27: montage
  views/model/CSS/tests, docs/gm-trackers.md, docs/migrating-to-7.md, dse CHANGELOG.md,
  worktree-superproject CHANGELOG.md; rebaseline.txt + after-crops regenerated; widening
  .txt NOT yet. PROBLEM: docs-shots touched all 32 docs/Media PNGs -> worker told to
  revert every non-montage image. Resumed via SendMessage. SC-202 (9227dd9) is land-ready
  but HOLDING on Scott's sanction; origin/develop still 69eb5f7 -> slice 4 gates
  slice-3 style; re-gate round after SC-202 lands. No new Scott comment on SC-191.
- 2026-09-03 ~09:40 ET: slice 4 DONE (implementer-F). Commit 69eb93f on 69eb5f7. jest
  3626/1/192, shots 508 byte-identical x2, freeze exactly 2 montage lines, parity 0/0/16;
  rebaseline.txt (2) + widening.txt (14 = 7 new ids x print/realprint) regenerated from
  this tree; 8 probes reported PASS (review 2 re-verifies). Non-montage docs images
  reverted. Review 2 dispatched to a FRESH Opus reviewer-G on 69eb93f (pin abort expected;
  host-leak sweep owed to re-gate). Backlog ticket filed for the harness Modal shim gap.
- 2026-09-03 ~09:50 ET: relayed slice-4 follow-ups revealed a functional gap — model
  never advances current_round (mock's "End round N"/"Undo"/done-bar "Reopen"+"Clear
  all" were dropped by spec omission). Owner ruled: fold ALL into fix round 2 + remove
  "Clear all" from ⋯ (4 items). Fix 2 resumed on implementer-F (brief sc191-fix2-brief
  .md) BEFORE review 2, so the Opus review sees the complete element. Review 2 brief is
  final except the tip sha (currently 69eb93f -> will be the fix-2 commit). SC-294 filed
  for the harness Modal shim.
- 2026-09-03 ~10:40 ET: fix 2 DONE (implementer-F). Commit 8cd9d30 on 69eb5f7. End round /
  Undo / Reopen+Clear all done bar / ⋯ = 4 items. jest 3643/1/192, shots 508 byte-
  identical x2, freeze exactly 2 montage lines, parity 0/0/16. Freeze package unchanged
  (bar is print-excluded; hashes verified). ELEMENT COMPLETE on the branch. Review 2
  dispatched to a FRESH Opus reviewer-G on 8cd9d30 (brief sc191-review2-brief.md; pin
  abort expected, host-leak sweep owed to the post-SC-202 re-gate).
- 2026-09-03 ~10:50 ET: owner eyeballed montage-sheet-log--steel-dark.png: card shows the
  fix-2 bar (Log an action… / Undo / End round 3) correctly; the sheet renders inline with
  no modal chrome = SC-294 harness-shim gap -> for Scott's comment use
  docs/Media/montage-sheet-modal.png (real Obsidian capture), NOT the harness PNG. Comment
  draft updated. Review 2 running (reviewer-G). Re-gate brief tip set to 8cd9d30.
- 2026-09-03 ~11:30 ET: review-2 reviewer-G died on a transient HTTP 529 Overloaded (no
  result). Resumed via SendMessage on the same brief (8cd9d30). If the resume returns "No
  transcript found", dispatch a FRESH orchestration:reviewer with sc191-review2-brief.md.
- 2026-09-03 ~11:45 ET: review-2 reviewer-G killed by a SECOND transient 529 (Opus
  overloaded). Worktree verified clean at 8cd9d30. Resumed again; told to write the report
  incrementally per checklist section. If a third kill or "No transcript found": dispatch a
  FRESH orchestration:reviewer on sc191-review2-brief.md (partial report, if any, is a
  starting point, not a substitute).
- 2026-09-03 ~12:00 ET: reviewer-G killed by a THIRD 529 with no partial report. Owner
  decision: stop resuming (growing transcript into an overloaded model); dispatched a FRESH
  Opus reviewer-H on the same brief, told to write the report incrementally. If H also
  529s: back off ~10 min on a background watcher, then one more fresh dispatch; if Opus
  stays overloaded beyond that, report to the dispatcher rather than downgrade the review
  tier (release-bound code keeps the Opus review).
- 2026-09-03 ~12:15 ET: FOURTH 529 — the fresh reviewer-H died too (Opus overloaded
  server-side). Owner armed a 10-minute backoff watcher; next: one more fresh Opus
  dispatch on sc191-review2-brief.md. If that also 529s, report to the dispatcher (do not
  downgrade the review tier for release-bound, user-file-writing code).
- 2026-09-03 ~12:30 ET: backoff elapsed; FRESH Opus reviewer-I dispatched on
  sc191-review2-brief.md (8cd9d30), incremental report writing. If this one also 529s:
  report to the dispatcher (Opus overload is a platform condition); do not downgrade tier.
- 2026-09-03 ~12:45 ET: FIFTH 529 (reviewer-I, fresh, after a 10-min backoff). Opus is
  overloaded platform-wide for now. Owner reported to the dispatcher; armed a 30-minute
  backoff watcher; next attempt = fresh Opus reviewer on sc191-review2-brief.md. Review
  tier NOT downgraded (release-bound code writing into user notes). Worktree clean at
  8cd9d30; no partial report.
- 2026-09-03 (afternoon): sustained Opus 529 overload also killed the OWNER several times;
  dispatcher spaced resumes (2 -> 5 min). Owner back; fresh Opus reviewer-J dispatched on
  sc191-review2-brief.md (8cd9d30). If it 529s: 60-min backoff watcher, then retry.
- 2026-09-03 (afternoon): SIXTH Opus 529 (reviewer-J). 60-minute backoff watcher armed;
  next = fresh Opus reviewer on sc191-review2-brief.md. Tier unchanged. Worktree clean at
  8cd9d30; no partial report.
- 2026-09-03 12:17 EDT (real clock; earlier "afternoon" labels were estimates): the 60-min
  watcher died with an owner kill (background watchers do not survive owner restarts).
  origin/develop still 69eb5f7; worktree clean at 8cd9d30; no partial report. Fresh Opus
  reviewer-K dispatched on sc191-review2-brief.md. If it 529s: ask the dispatcher to
  space the next retry by ~30 min rather than relying on an owner-side watcher.
- 2026-09-03 22:07 EDT: reviewer-K (attempt 7) actually RAN — reached the integrity-probe
  stage, left test/dom/elements/zzreview2-probes.test.ts (untracked, its own) + scratch
  review2/; no report yet; killed by a session 429 (not 529). Resumed via SendMessage with
  the on-disk state; told to write the report incrementally and remove the probe file at
  the end. origin/develop still 69eb5f7; no new Scott comment.
- 2026-09-03 ~22:15 EDT: SC-202 LANDED — origin/develop 69eb5f7 -> 9227dd9 (Obsidian
  1.14.0 host-pin bump + input host-CSS re-grounding). Re-gate brief now carries the tip.
  SEQUENCING: review 2 (reviewer-K, running on 8cd9d30 in the same worktree) finishes
  FIRST; then the re-gate round (rebase onto 9227dd9, full battery incl. host-copy pin OK
  1.14.0 + button host-leak sweep, regenerate rebaseline.txt/widening.txt/crops). If the
  re-gate shows any montage pixel movement from SC-202's CSS re-grounding, a scoped delta
  check follows before the Scott comment.
- 2026-09-03 ~22:30 EDT: review 2 DONE (reviewer-K, attempt 7): FIX-ROUND — 1 HIGH (strip
  has no print layout; pinned print loses the tier table — the very bytes the sanction
  would pin), 4 MED, 6 LOW, 6 INFO; battery green; all 8 §C probes PASS in a real vault;
  all 6 fix-2 items PASS. Rulings in decisions.md. Fix 3 + re-gate COMBINED, resumed on
  implementer-F (brief sc191-fix3-brief.md): rebase onto 9227dd9 first, one shots run to
  record the SC-202 integration delta, then fixes, full battery (pin OK 1.14.0 + host-leak
  sweep), regenerate freeze package incl. a strip-pinned print crop. Next: scoped re-review
  of the fix-3 delta + rebase integration by reviewer-K, then owner eyeball of the
  after-print crops, then the Scott comment.
- 2026-09-03 ~23:35 EDT: fix-3 implementer-F PARKED on its own `npm run shots`
  (post-guide-fix run 1; pid 3986056; log sc191-fix3/shots-postguidefix-1.log) waiting
  for a Monitor notification that never comes. Branch already rebased (fix 2 = 9bdcf70,
  slice 4 = c06db5b on 9227dd9); fix-3 edits uncommitted. Owner armed a pid watcher; on
  exit -> SendMessage the worker to read the log and continue (crops, parity, battery,
  commit, report).
- 2026-09-03 ~23:45 EDT: worker's shots run exited; owner nudged implementer-F to read
  sc191-fix3/shots-postguidefix-1.log and continue in the foreground (message queued for
  its next tool round). 10-min activity check armed: if no new scratch files / no new
  battery process, resume the worker again with the same instruction.
- 2026-09-04 08:10 EDT: fix 3 + re-gate DONE (implementer-F; killed by a 429 after writing
  the report). Branch REBASED onto 9227dd9 (slice4 c06db5b, fix2 9bdcf70), fix 3 =
  eeabdc9, worktree clean. Battery: jest 3694/1/195, shots 508 byte-identical x2 with
  host-copy pin OK (1.14.0) + button host-leak OK (678) + input host-leak OK, freeze
  exactly the 2 montage print lines, parity 0/0/16. SC-202 byte delta zero; a dead-CSS-
  class coverage gap from SC-202 fixed. Freeze package regenerated (rebaseline 2,
  widening 14, crops incl. strip-pinned print). Owner eyeballed the strip-pinned print
  crop: tier table laid out; pips-in-print unverifiable at scale -> added check for the
  re-review. Re-review 2 (delta 9bdcf70..eeabdc9 + rebase integration) resumed on
  reviewer-K. Next: owner eyeball of final captures -> Scott comment (sanction + review-
  for-landing) -> land-ready.
- 2026-09-04 08:20 EDT: owner eyeballed the final-tree deciding images (post/ dir):
  montage-done--steel-light.png (COMPLETE pill, Total Success band, Undo + danger Clear
  all, no Reopen — correct for a limit-ended montage) and the plain print after-crop
  (tier table laid out, band, guide; dark ground = documented harness artifact). One
  inconsistency sent to reviewer-K as an addendum: round-3 header still "IN PLAY" on a
  complete montage. Scott comment draft complete (sc191-impl-review-comment.md, 5 images
  staged in post/); waiting only on the re-review-2 verdict.
- 2026-09-04 (owner session resumed after a harness restart): STATE RECONSTRUCTED. The
  impl-review Scott comment (sc191-impl-review-comment.md) was NOT posted — newest ticket
  comment is still the owner's 2026-09-02 01:31 progress note; ticket Awaiting, labels
  DSE Plugin + Feature. Reviewer-K died mid re-review 2 (scratch rereview2/ has partial
  logs, shots run 2 cut off, NO report); its agent handle did not survive the restart.
  Worktree clean at eeabdc9 on 9227dd9 (origin/develop unmoved). Re-review-2 brief
  rewritten with the final-tree numbers (jest 3694/1/195, shots 508, widening 14) + the
  "IN PLAY" header addendum folded in as §2c. FRESH Opus reviewer-L dispatched on it.
  Next: on LAND-READY -> post the Scott comment (In Progress + Needs Review); on
  FIX-ROUND-4 -> fix round on a fresh implementer (implementer-F is gone too).
- 2026-09-04 ~09:00 EDT: re-review 2 DONE (reviewer-L, ~229k tokens): FIX-ROUND-4. All
  review-2 folds VERIFIED-FIXED except H-1 = partial (new M-A: print pips have geometry but
  no fill -> 0 gold px in print); 2c "IN PLAY" header = LOW defect (header ignores
  complete). §2b rebase integration verified; §2d no regressions; battery green on
  eeabdc9 (jest 3694/1/195, shots 508 x2 identical, freeze exactly 2, parity 0/0/16);
  freeze package 16/16 hashes verified. Fix 4 dispatched to a FRESH implementer-G (brief
  sc191-fix4-brief.md): both fixes + tests + regenerated freeze package. Next: scoped
  re-review of the fix-4 delta by reviewer-L (resume; did not author), then post the
  Scott comment. Author map now: spec=A, slice1=B, slice2+fix1=C, review1+rereview1=D,
  slice3=E, slice4+fix2+fix3=F, review2=K (dead), rereview2=L, fix4=G.
- 2026-09-04 ~08:55 EDT: fix-4 implementer-G PARKED on its own `npm run shots` run 1 (pid
  171672; log scratchpad/sc191-fix4/shots1.log) waiting on a Monitor. Both fixes + tests
  done red-then-green, tsc/lint/jest green, edits UNCOMMITTED on eeabdc9. Owner armed a
  pid watcher; on exit -> SendMessage the worker to read shots1.log and continue in the
  foreground (run 2, freeze, parity, package regen, post/ copies, commit, report).
- 2026-09-04 ~09:05 EDT: fix 4 DONE (implementer-G; parked twice on its own shots runs,
  nudged twice). Commit c2a5cec on 9227dd9. M-A: flat print rule
  `[data-dse-print="on"][data-dse-element="montage"] .dse-mt__tier-pip::after { background:
  var(--dse-vp) }` + fill assertion; 2c: `if (montageTallies(this.model).complete) return
  'past'` at BoardView.ts:316 + tests. jest 3697/1/195, shots 508 x2 identical, all in-run
  OKs, freeze exactly 2, parity 0/0/16. Freeze package regenerated: ALL 16 lines moved vs
  fix 3 (pip fill moves every strip-bearing print; montage-done also by the header fix).
  post/ montage-done--steel-light.png now reads ROUND 3 DONE; strip-pinned dark unchanged.
  Re-review 3 (delta eeabdc9..c2a5cec) resumed on reviewer-L (brief sc191-rereview3-brief
  .md). Next: on LAND-READY -> owner eyeballs the print after-crop (pips) -> post Scott
  comment (In Progress + Needs Review).
- 2026-09-04 ~09:10 EDT: owner eyeballed the fix-4 deciding images: print after-crop (gold
  ▲/▼ pips visible on every rider seal; tier grid laid out; guide stub; Round 1 in play
  correct for the 1/2 fixture) and post/montage-done--steel-light.png (ROUND 1/2/3 DONE,
  COMPLETE pill, Total Success, Undo + Clear all). ACCEPTED. Waiting on re-review 3.
- 2026-09-04 ~09:30 EDT: re-review 3 DONE (reviewer-L): LAND-READY. M-A + 2c VERIFIED-FIXED
  with can-fail proofs; delta = 4 files; 0 regressions; freeze package 16/16 hashes match
  (rebaseline now c8493be6…); 20/508 shots moved, all montage (16 package + 4 non-frozen
  done/failed screen captures from the header fix). Branch c2a5cec on 9227dd9 is the
  land candidate. Posting the Scott comment (sanction + review-for-landing) now; ticket
  -> In Progress + Needs Review. On Scott's sanction -> land-ready report to dispatcher.
- 2026-09-04 09:23 EDT: Scott comment POSTED (sanction ask for the 2 montage print lines +
  14 widening lines, review-for-landing, 5 images). Ticket In Progress + Needs Review
  (verified). WAITING ON SCOTT. On his sanction + no change requests: report LAND-READY
  to the dispatcher — branch sc191-montage-overhaul (dse) @ c2a5cec on origin/develop
  9227dd9; rebaseline.txt (2, c8493be6…) + widening.txt (14) in this dir; jest 3697/1/195,
  shots 508 x2 identical, freeze exactly 2, parity 0/0/16. On change requests: append the
  ruling verbatim to sc191-decisions.md, dispatch a fresh implementer, scoped re-check.
- 2026-09-04 13:55 UTC: Scott: "Approved, lets land it". Sanction + landing approval in
  one. LAND-READY reported to the dispatcher. Ticket labels cleaned (Needs Review off),
  state Awaiting (external-to-owner motion: dispatcher landing). After landing the
  dispatcher applies rebaseline.txt + widening.txt with backup
  freeze-baseline.sha256.pre-sc191-bak + dated dse-verify record, copies this ledger dir
  to docs/superpowers/dse-overhaul/build-ledgers/, then wt-rm. Ticket -> Done after land.
