# SC-334 — Montage Card cleanup — decisions ledger

Owner: Opus 5.5 top-level session 39e9758e (Scott invoked directly: "work on sc-334"; no
dispatcher). Worktree `sc334-montage-cleanup`
(`/home/scott/code/steelCompendium/worktrees/sc334-montage-cleanup`), every submodule on
branch `sc334-montage-cleanup`; dse cut from `origin/develop` `d124cc3`.

## Ticket text (Scott, verbatim — the whole description; no comments at start)

> * In the model to edit a montage result, remove the "success starts at" row and the "roll" row
> * In the modal to edit a montage result: there is some clipping on the right side with the scroll bar (see screenshot)
> * In the modal to edit a montage result: remove the ability to change the hero and round.  Those values should be determined when opening the modal and represented in the title of the modal (as they already are).  The behavior to change the hero and round in the modal is confusing and not needed.
> * In the progress tracker portion, the last cell of the successes and failures should not have a white border
> * In the progress tracker portion: failures should fill the cell with red (to match the successes cells) instead of just having the border be red
> * I cant find a way to go to the previous round.  For example, if I remove round results or hit the "undo" button enough, it should be a previous round, but I have no controls to mark that.
> * The "set limits" modal is clipped at the top of the first textbox (see screenshot)

## Root causes (measured in real Obsidian via obsidian-camera, 2026-09-23)

- Right-edge clip: SC-202 GROUP 1 `box-sizing: content-box` at (0,2,0) beat
  `.dse-mt__sheet-input { width: 100%; box-sizing: border-box }` (0,1,0) → Skill input +
  Note textarea 14.8px wider than `.dse-modal__body` (scrollWidth 461 > clientWidth 446).
- Set-limits top clip: `.dse-modal__body` is a scroll box with no padding; the shared focus
  ring (outline 2px + offset 2px) paints 4px outside the field and is clipped.

## Owner rulings (no Scott ruling yet — to be confirmed in one batched Needs Review ask)

- R-1: the sheet change applies to BOTH modes (new + edit) — it is one sheet. Fields:
  Result, Skill, Note. Hero/round fixed at open, stated in the title.
- R-2: the roll affordance is removed from the montage entirely (it only ever lived in
  the sheet). `.dse-mt__sheet-rollchar` retired from every CSS list. Tiers stay reachable
  via the card's "Test tiers" strip.
- R-3: new-mode sub-line was "next hero yet to act in the round in play" (false for every
  opener but the bar) → now "the round in play" / "a round already played" /
  "a round still to come".
- R-4: "Back to round N" = a bar button just before End round N. Offered live past round
  1, and on a montage complete by ROUNDS alone (montageReopenable); never once a limit is
  reached. Pure `current_round` pointer movement, clamped to `rounds`; no entry touched.
  Undo semantics unchanged (removes the last logged entry only).
- R-5: filled failure slot = ~~`var(--dse-sheen), var(--dse-danger)`~~ (superseded by the
  LOW-2 ruling below: plain `var(--dse-danger)`) + danger border (solid red chip, the
  filled slot's own chip bevel); the `data-goal` end-cap attribute
  and CSS removed from both tracks. Print rules untouched (print keeps its hatch; frozen).
- R-6: `.dse-modal__body` gets `padding: 4px; margin: -4px` — shared by every DSE modal,
  layout-neutral.
- R-7: `.dse-mt__sheet-input` leaves SC-202 GROUP 1 (the `.dse-form__raw` precedent);
  `height: auto` moves into its own GROUP-2 rule.

## Evidence (scratchpad, session 39e9758e)

`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/39e9758e-af5c-4490-a2ab-3a5ccb229f53/scratchpad/evidence/`
- sc334-edit-sheet-{before,after}.png, sc334-set-limits-{before,after}.png (real Obsidian)

## Round log

- Impl (owner, direct): dse `22aaae7` (harness camera) · `99b1532` (fix) · `e6c551c`
  (docs) on `d124cc3`. Real-Obsidian modal camera: all 6 modal captures OK incl. the new
  sideways-scroll check. Targeted jest 312/312. Can-fail: re-adding `.dse-mt__sheet-input`
  to GROUP 1 fails the new inputHostRegrounding test.
- Battery r1 (owner): all green — `sc334-battery-r1.md`.
- Review 1 (`orchestration:reviewer`, brief `sc334-review1-brief.md`) DONE 2026-09-23
  (`sc334-review1-report.md`): APPROVE WITH FIXES — 0 HIGH / 2 MED / 3 LOW / 7 INFO; gates
  reproduced exactly; camera can-fail + no vertical-scroll false positive confirmed. Owner
  rulings:
  - MED-1 (bar "Log an action…" falls back to participants[0] once everyone has acted →
    hidden duplicate (hero, round) entry that moves the tally; Back makes it easy to reach)
    — **fold**: drop the fallback, bar button real-disabled when `nextHeroToAct` is
    undefined ~~(tooltip says why)~~ (superseded, re-review-1 LOW-1: no tooltip — SC-324,
    iconButton discards a tooltip that differs from its label; docs/gm-trackers.md states
    the disabled state instead); sheet refuses (Log disabled) a new entry whose
    (hero, round) already has one; tests; docs sentence.
  - MED-2 (docs/Media montage-sheet-modal.png + montage.png stale) — **fold**: regenerate
    via docs-shots.
  - LOW-1 ("hero actions left" counts only current-round entries → overcounts after Back)
    — **fold**: count distinct roster (hero, round) entries in current_round..rounds.
  - LOW-2 (light sheen over red reads pink→red) — **fold**, R-5 amended: ~~`var(--dse-sheen),
    var(--dse-danger)`~~ superseded by plain `var(--dse-danger)` + the filled slot's chip
    bevel — the kit already excludes accent/danger fills from the sheen.
  - LOW-3 (no gate for R-6) — **fold**: camera check that a focused field's ring fits
    inside the modal body's scroll box + jest source contract on `.dse-modal__body`.
  - INFO-2 ("4 rounds used" on a 3-round montage, pre-existing, same band) — **fold**
    (min(current_round, rounds)).
  - INFO-3 (stale "these six" comment), INFO-4 (dse CHANGELOG "silver"), INFO-7 (camera
    overflow px figures 4px low since R-6) — **fold** (trivial, touched files).
  - INFO-1 ("a round still to come" unreachable) — **drop**: defensive, true if ever hit.
  - INFO-5 (hand-edited `current_round: 0` shows "End round 0") — **drop**: pre-existing,
    invalid hand-edit, not reachable from the UI.
  - INFO-6 (ws CHANGELOG uncommitted) — planned: lands with the pointer-bump commit.
- Fix round 1: owner (author) fixes; scoped re-review by the review-1 reviewer.
- Fold committed: dse `4a3399f` (fix) + `49309c6` (docs, regenerated docs/Media images).
  Battery r2 green (`sc334-battery-r2.md`); owner can-fail: each fold's revert fails
  exactly its new test.
- Re-review 1 DONE 2026-09-23 (`sc334-rereview1-report.md`): **APPROVE** — all 10 folds
  VERIFIED-FIXED by execution; gates reproduce r2; ring-check can-fail proven (padding
  removed → fails naming top/right 4.0px on limits, left/right on form). New: LOW-1
  (ledger promised a tooltip) — **drop**, ledger amended above. INFO-1 (ring check never
  reaches the sheet's own focused control) — consequence of the optchip gap below.
  Optchip probe (pre-existing, byte-identical CSS at d124cc3): a focused PRESSED
  `.dse-optchip` shows no focus indicator (the Steel pressed box-shadow outranks the host
  ring); an unpressed one only gets Obsidian's rgb(85,85,85) 3px ring (~1.7:1 vs chip) —
  **Backlog ticket SC-338 filed**, linked to SC-334; out of SC-334's scope.
- Superproject pointer bump `dfad252` (worktree branch; + workspace CHANGELOG bullet). No
  upstream drift: dse origin/develop = d124cc3, ws origin/main = 283f9d7 → fast-forwards.
- 2026-09-23: Scott ask posted (`sc334-comment-review.md`, 9 inline images) — In Progress +
  Needs Review verified. **LAND-READY** (dse `49309c6`, ws `dfad252`); NOT landed — awaiting
  Scott's approval of R-1/R-4 (the two judgment calls) and the visuals.

## Scott rulings

- 2026-09-23 15:15Z (Scott, verbatim, SC-334 comment): "Almost perfect.  For the "failures"
  progress tracker, can you add a minor gradient to match the "successes" / once that is
  done, its good to merge. No need for another approval from me"
  → R-1..R-7 and both judgment calls APPROVED as shown. R-5 amended again: ~~plain
  `var(--dse-danger)`~~ superseded — filled failure slot gets a MINOR gradient shaped like
  the success slot's `--dse-metal-grad` (light top, 48% mid, shaded bottom) over
  `--dse-danger`. Merge authorized once done; no further Scott approval.
- Gradient (Scott's 15:15Z ruling): dse `e4bcd0f` — `--dse-metal-grad`'s stop shape as a
  white/black overlay on `--dse-danger`; docs/Media/montage.png regenerated. Battery r3
  green: jest 3919 / shots 524, 0 FAIL / freeze 260/260 / parity 0-0-16. No re-review
  (single CSS value, Scott pre-approved: "No need for another approval from me").
- LANDED 2026-09-23 via land-stack: worktree superproject rebased onto origin/main
  `26e8f3a` (SC-320 had landed; CHANGELOG auto-merged, SC-334 bullet under Unreleased);
  `wt-finish`: dse `d124cc3..e4bcd0f` → origin/develop, ws `26e8f3a..6c5d534` → origin/main.
  Scott's vault state stash-wrapped and restored identically.
