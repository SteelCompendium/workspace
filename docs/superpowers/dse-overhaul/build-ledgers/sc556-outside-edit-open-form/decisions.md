# SC-556 decisions ledger — outside edit / deletion of a form's OWN block while its edit form is open

Worktree: /home/scott/code/steelCompendium/worktrees/sc556-outside-edit-open-form (branch sc556-outside-edit-open-form)
Cut from: dse develop 6270e84a, workspace main e1d3d1e0 (2026-11-10).
Baseline at 6270e84a: jest 6492 / 1 skipped / 257 of 258 suites · lifecycle 52/52 · e2e 128/128, coverage 89/89 ·
shots 592, 0 FAIL, host-leak 163/978, capture clip OK (147 …) · freeze 280/280 · parity 0/0/24.
Lifecycle id reserved for this ticket if needed: G-S68.
Overlap: SC-480 (twin-block save after a note change) same write path, queued behind this. Prior art: SC-552
(build-ledgers/sc552-twin-form-after-click*), host/lineMap.ts, ReadingModeBlockHost.pinnedTarget, BlockHost `pinOnly`.

## Owner notes (not rulings)
- 2026-11-10 owner: ticket is a decision ticket. Code state at 6270e84a: SC-552 already made Save strict for forms KEPT OPEN
  past their view (`pinOnly` → no write + droppedWriteNotice "a change to a block in <note> was not saved — the block changed
  on disk first", form stays open), and `pinnedTarget` already handles the unterminated trailing fence (G-S6u/G-S28 concern
  from SC-552 r1 is resolved). Remaining gap: every OTHER form's Save, when its pin cannot be placed (own block edited or
  deleted), falls back to `resolveWriteTarget`, which finds an identical twin. Global strict ≈ pass `pinOnly` for every
  FormModal Save. Known cost: LINE_MAP_MAX_EDITS=400 (lineMap.ts) — a pin is refused when >400 lines changed on BOTH sides
  of the block; under global strict that Save would drop with the Notice where today it may land correctly (unique block).
- 2026-11-10 owner: asked Scott on the ticket (options: 1 strict [recommended], 2 form overwrites its own block, 3 keep today).
  Parked: In Progress + Needs Review.

## Rulings (verbatim, dated)
- **2026-11-10 13:54 UTC, Scott (SC-556 comment, answering the owner's 3-option ask; option 1 = "Save nothing. The form stays open and a Notice says: 'Draw Steel Elements: a change to a block in <note> was not saved — the block changed on disk first.' The outside change is kept."):**
  > Save nothing with a notice is fine.

## Log
- 2026-11-10 owner: ruling recorded. Ticket -> Awaiting, `Ready for Agent` + `Needs Review` removed. r1 implement brief: sc556-brief-r1-impl.md.
- 2026-11-10 owner: r1 implementer dispatched (orchestration:implementer, brief sc556-brief-r1-impl.md). Author: implementer-r1. Reviewer must be a different identity (orchestration:reviewer).
- 2026-11-10 owner: r1 DONE_WITH_CONCERNS. dse 45a07cac (src+jest) + a4900dca (G-S64 phases v/w), superproject 71f4b60a (CHANGELOG). Gates: tsc/lint clean; jest 6499/2/257 of 258 (fresh worktree, --testTimeout=30000; plain runs 1 load timeout each); lifecycle 21+16+9+4 ok, part 5 G-S49 ok / G-S59 FAIL x4 — also FAILs on clean 6270e84a (SC-561's ticket); e2e 128/128 89/89 (run 3; runs 1-2 RECOV-R07 = SC-517); styles.css sha 16e9aa64… identical to 6270e84a → shots/freeze/parity carry. Report sc556-r1-impl-report.md, proposal sc556-dse-verify-proposal.md.
- 2026-11-10 owner rulings on r1 follow-ups:
  - F1 (a second dropped form Save within 5 s shows NO Notice — notifyDroppedWrite rate limit + host.lastWriteReported suppresses FormModal's own Notice): FOLD into r2. Scott's ruling is "Save nothing with a notice"; a silent Save violates it. Every dropped form Save must show exactly one Notice with the approved text; card-burst rate limiting unchanged.
  - F2 (deleting one of several identical blocks with identical surroundings is indistinguishable by line diff): DROP — the resulting note text is identical whichever twin was deleted, so there is nothing to detect; document as a known limit in a code comment only (fold into r2, one sentence).
  - F3 (load flakes): DROP as already ticketed — SC-568 (twin-reuse + initiative-default-keys jest timeouts), SC-506, SC-517 (RECOV-R07), SC-561 (G-S59). Out of scope for r2.
  - F4 (dse repo CHANGELOG.md): FOLD — dse CHANGELOG carries user-facing plugin fixes (SC-477, SC-490 precedent); add an Unreleased bullet in its existing format.
  - G-S59 FAIL: pre-existing on base under load, owned by SC-561; reported to the dispatcher at land-ready, not fixed here.
- 2026-11-10 owner: r2 DONE. dse 92288b73, superproject 789bf152. F1 = `force` on notifyDroppedWrite/notifyUnsavableWrite for non-fromView writes (form Saves); unplaceable path also forced. +7 jest (6506/2/257 of 258 t30). Lifecycle parts 1 + 3 ok; parts 2/4/5 + e2e skipped (notice/host code only) — reviewer re-runs e2e.
- r2 follow-ups: (a) SC-544 sibling flush also dropping -> two Notices for one Save: DROP — both writes really were lost, two accurate Notices is not a ruling breach; rare. (b) sidebar canPersist early return -> FormModal's own "couldn't save" Notice: DROP — never silent, unchanged behavior.
- 2026-11-10 owner: r3 review dispatched (orchestration:reviewer, fresh identity; brief sc556-brief-r3-review.md) on 92288b73.
- 2026-11-10 owner: r3 review FIX FIRST on 92288b73: 1 HIGH, 4 LOW, 3 INFO (sc556-r3-review-report.md). e2e 128/128 89/89, jest 6506/2/257 of 258, lifecycle parts 1+3 ok, styles.css identical.
- Owner rulings on r3:
  - HIGH-1 (form in a heading embed `![[note#H]]` of a long note can never save: partial section pin vs whole-note mapLine > 400 edits; base wrote): FOLD into r4 — regression introduced by this ticket. Reviewer's prescription (locate the partial pin's lines as one contiguous run, exactly once -> map by offset, then existing fence+body checks; else mapLine) or an equivalent the implementer justifies. Jest host test + twin-outside-section test + G-S64 lifecycle phase (embed). CHANGELOG limit sentence corrected.
  - LOW-1 (mutations M7/M8 — `force` on unplaceable and note-gone paths untested): FOLD — add tests.
  - LOW-2 (known-limit comment describes the opposite; lower-twin-with-upper-deleted false refusal; upper-twin-deleted still writes into survivor): FOLD the comment correction only. DROP the behavior change: the false refusal loses nothing (form stays open, Notice), it needs an outside deletion of the adjacent identical block while the form is open, and the survivor case is the already-ruled F2 ambiguity.
  - LOW-3 (CHANGELOG over-claims): FOLD — both CHANGELOGs must not claim the ambiguous adjacent-twin deletion case, and must not cite a 400-line limit that HIGH-1's fix makes misleading.
  - LOW-4 (dse-verify proposal stale): FOLD — refresh to final numbers and the r2 Notice rule.
  - INFO-1 (outside change to the fence line alone refuses Save): DROP — it is an outside change to the form's own block; Scott's ruling covers it.
  - INFO-2/3: no action.
- 2026-11-10 owner: r4 fix round -> implementer (resumed, author of r1/r2). Scoped re-review r5 -> r3 reviewer (not the author).
- 2026-11-10 owner: r4 DONE. dse 7095e3aa, superproject 2f946190. HIGH-1 via open-time rebase of an embedded card's pin (cachedRead; section run found exactly once -> whole-note pin), gated on embed ancestor. +8 jest (6514/2/257 of 258 w4 t30). Lifecycle 21/16/9/4 ok, part 5 G-S59 FAIL (SC-561). e2e 128/128 89/89. styles.css identical.
- r4 follow-ups: (a) chromeFocusHandoff SC-505 r3 LOW-A wall-clock flake under load -> add to SC-568 (owner noted on SC-568's description). (b) block embeds `![[note#^id]]` unmeasured -> FOLD into r5 re-review as a probe. (c) heading embed of a long note with two identical sections keeps the refusal -> DROP: no data lost (Notice, form stays open), needs a long note with duplicated section text.
- 2026-11-10 owner: r5 scoped re-review of 92288b73..7095e3aa -> r3 reviewer (resumed).
- 2026-11-10 owner: r5 re-review FIX FIRST on 7095e3aa: 0 CRIT/HIGH, 2 MEDIUM, 2 LOW, 3 INFO (sc556-r5-rereview-report.md). HIGH-1 fixed (heading + block embeds, long notes, RV+LP, hover popover; races clean). jest 6514/2/257 of 258; lifecycle part 3 9/9; mutations 13/14 killed.
- Owner rulings on r5:
  - MEDIUM-1 (heading embed of a long note: + then pencil -> form opens before the embed redraw, section text stale, pin stays partial -> every Save refused; base saved): FOLD into r6 — regression from this ticket. Reviewer's prescription: rebase by the embed's link subpath (embed `src` -> `resolveSubpath(metadataCache.getFileCache(file), '#…')` -> start.line), not by section text. Must VERIFY the computed whole-note position against the note text read (fence opens there with the expected language/body) before accepting; otherwise leave the pin as is. Never a position that could land on a twin.
  - MEDIUM-2 (block embed `![[note#^id]]` with an identical block elsewhere in the note writes into the other block, no outside change; pre-existing on base): FOLD — same fix closes it and it is exactly this ticket's class (Save into an identical block). Also closes r4 follow-up (c) (two identical sections), previously dropped.
  - LOW-1 (CHANGELOG "however long that note is" over-claim): FOLD — reword to match final behavior.
  - LOW-2 (mutation R4 survives: trailing-blank-line trim at ReadingModeBlockHost.ts:798 untested): FOLD — add a test (or delete the trim if the subpath approach makes it dead code).
  - INFO 1-3: no action. Nested/canvas embeds unmeasured: re-review probes one nested embed if cheap.
- 2026-11-10 owner: r6 fix -> implementer (resumed). r7 scoped re-review -> reviewer (resumed).
- 2026-11-10 dispatcher: SC-561 landed, dse develop 6153acfe (workspace main 122117dd); harness only, built main.js/styles.css identical to 6270e84a, battery numbers unchanged. Owner told r6 implementer to rebase onto 6153acfe before its final gates; G-S59 now expected to pass (lifecycle 52/52).
- 2026-11-10 dispatcher: SC-435 landed, dse develop 2ee2e405 (workspace main 6f8f9b00). New baseline: jest 6584/1 (+ possible 2 SC-568 timeouts) · lifecycle 52/52 · e2e 163/164 ok, 0 failed, 1 known-bug (SC-572), coverage 113/113 · shots 592 host-leak 163/978 · freeze 280/280 · parity 0/0/24. Owner re-targeted r6 rebase to 2ee2e405 (supersedes 6153acfe).
- 2026-11-10 owner: r6 DONE. dse a3ac0769 rebased on develop 2ee2e405 (clean), superproject 63ea40ff. Subpath rebase (embedStartLine via src + resolveSubpath, verifiedPinLine checks anchor line + fence + body), text-search fallback only for unique runs. +14 jest (37 on branch). Gates: tsc/lint clean; jest 6622/2/258 of 259 (t30 + plain); lifecycle 21/16/9/4/2 = 52/52 (G-S59 passes); e2e 163/164 ok, 0 failed, 1 known-bug, 113/113; styles.css = 2ee2e405 build -> shots/freeze/parity carry.
- r6 follow-ups: hover preview opened right after a + (no src, stale section text) in a long note still refused -> DROP: no data lost (Notice, form stays open), narrow timing window in a hover preview. Nested/canvas embeds unmeasured -> r7 probes one nested embed if cheap; otherwise INFO.
- 2026-11-10 owner: r7 scoped re-review of 7095e3aa-equivalent..a3ac0769 delta -> reviewer (resumed).
- 2026-11-10 owner: r7 re-review FIX FIRST on a3ac0769: 0 CRIT/HIGH, 2 MEDIUM, 2 LOW, 2 INFO (sc556-r7-rereview-report.md). r5 MEDIUMs fixed in real Obsidian (+ then pencil RV/LP; ^id block embed with twin, short+long; nested embed saves). jest 6622/2/258 of 259; part 3 9/9; mutations 16/17 killed.
- Owner rulings on r7:
  - MEDIUM-A (^id subpath: anchor line is the fence itself, so a lagging cache pointing at a twin verifies; jest K1/K5 write the twin): FOLD — for a `^id` subpath also require the `^id` marker right after the closing fence at that position (reviewer's fix).
  - MEDIUM-B (hover preview `[[note#^blk]]` of a short note with an identical block above writes the UPPER block, no outside change; same on base; jest K3 stale embed same root): FOLD — an embedded pin that could not be rebased is in section coordinates, not the note's, so it must never be mapped against the whole note: refuse (no write, Notice, form stays open). Unique-text hovers still rebase via the text search and save. Accepted cost: in that ambiguous no-change case the Notice says "changed on disk first" — no data lost; mention in the land-ready comment, do not reword the approved Notice.
  - LOW-1 (CHANGELOG "in a long note" claim wrong for short notes): FOLD — final wording must match the final behavior.
  - LOW-2 (V2 mutation survives — link-target-note check :828 untested; dse-verify proposal stale: "Refreshed at r4", footgun 5 lists G-S59 as load flake, footgun 3 duplicate paragraph): FOLD.
- 2026-11-10 owner: r8 fix -> implementer (resumed). r9 scoped re-review -> reviewer (resumed).
- 2026-11-10 dispatcher: SC-558 landed, dse develop 10db67e3 (workspace main 184ddedb); CSS change + sanctioned 78-line print rebaseline. Baseline: jest 6591/1/258 of 259 · lifecycle 52/52 · e2e 163/164 ok 0 failed 1 known-bug 113/113 · shots 592 host-leak 163/978 clip OK (147) · freeze 280/280 (updated baseline) · parity 0/0/24. Owner re-targeted r8 rebase to 10db67e3; branch has no CSS so styles.css must equal a 10db67e3 build (then shots/freeze/parity carry; else NEEDS_CONTEXT).
- 2026-11-10 owner: r8 DONE. dse f69b8fd6 rebased on develop 10db67e3 (one dse CHANGELOG conflict with SC-558, both kept), superproject 5c5641e7. MEDIUM-A: ^id marker required after close fence. MEDIUM-B: partialPins WeakSet -> unrebased embedded pin refused; whole-note embeds not partial. G-S64 (zh) hover phase. V2 killed. Gates: tsc/lint clean; jest 6634/2/258 of 259 (t30 + plain; +44 over clean 10db67e3); lifecycle 52/52; e2e 163/164 ok 0 failed 1 known-bug 113/113; styles.css 4295ca33… = clean 10db67e3 build -> shots/freeze/parity carry.
- r8 follow-ups: separate Notice wording for the ambiguous nothing-changed case -> DROP (accepted cost per r7 ruling; Notice text is Scott-approved; mentioned in land-ready comment). Canvas file nodes unmeasured -> INFO.
- 2026-11-10 owner: r9 scoped re-review of a3ac0769..f69b8fd6 (content) -> reviewer (resumed).
- 2026-11-10 owner: r9 re-review LAND on f69b8fd6 (0 CRIT/HIGH/MED, 2 LOW, 2 INFO; sc556-r9-rereview-report.md). Mutations 21/21 killed. jest 6634/2/258 of 259; part 3 9/9; styles.css = 10db67e3 build.
- Owner rulings on r9: LOW-1 (hover + then pencil refused even for a unique block; base saved) and LOW-2 (callout `^id` embed with text after the counter + identical callout elsewhere refused; base misrouted): FILE — SC-584 (Backlog, Low, related SC-556). Not folded: both are refusals (no data lost), and the reviewer's suggested unique-body fallback for LOW-1 would reintroduce the twin write after an outside edit; needs an open-time count design. INFO (canvas unmeasured): no action.
- 2026-11-10 owner: LAND-READY. dse f69b8fd6 on develop 10db67e3 (branch sc556-outside-edit-open-form), superproject 5c5641e7 on the worktree branch (CHANGELOG only; its dse pointer is stale — dispatcher bumps at landing). Gates (r8 implementer, r9 reviewer confirms tsc/lint/jest/part 3): tsc/lint clean · jest 6634 passed / 2 skipped / 258 of 259 (fresh worktree; +44 over clean 10db67e3) · lifecycle 52/52 in five parts (G-S64 extended, phases (v)-(zh); no new scenario) · e2e 163/164 ok, 0 failed, 1 known-bug (SC-572), coverage 113/113 · styles.css 4295ca33… = clean 10db67e3 build, so shots 592 host-leak 163/978, freeze 280/280, parity 0/0/24 carry. dse-verify text: sc556-dse-verify-proposal.md. At landing the dispatcher: applies the proposal to dse-verify CURRENT; preserves this ledger to build-ledgers/; SC-556 -> Done; SC-480 unblocked.
