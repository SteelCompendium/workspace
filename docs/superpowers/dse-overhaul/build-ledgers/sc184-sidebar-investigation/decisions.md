# SC-184 decisions ledger — sidebar fix round

Effort: `sc184-sidebar-investigation` (worktree of the same name).
Prior investigation rounds (read-only, no code) live in `.superpowers/sdd/sc184/`:
- `sc184-report.md` — round 1: how the sidebar works, defect list
- `sc184-round2-report.md` — round 2: pinned-note alternative analysis + the ten-fix list

## Rulings (verbatim, dated)

### 2026-08-23 — Scott (response to round-1 investigation)

> I guess im questioning what value this has over just having a note (or canvas) with the
> desired Elements over in the sidebar (and pinned) - this would be more customizable and
> would reduce the maintenance overhead.  Its certainly not quite the same… and I can see
> the value with having things really streamlined in terms of getting them in the sidebar.
> Problem is that what we have today is not streamlined.  Adding, removing, sorting, etc
> needs to be in there.  Maybe even stuff like tabs or something, idk… but that seems
> excessive.  Maybe we start small.  What are 10 fixes and improvements we can make to
> actually make this thing worth keeping for the 7.0.0 release

(Answered by the round-2 comment/report; superseded as an open question by the 2026-08-28
approval below.)

### 2026-08-28 — Scott (approving the round-2 recommendation)

> This sounds fine, we can move forward to see how this goes
>
> As for the embed: I used the Welcome note to add `![[initiative]]` and I was able to
> edit it in both reading mode and Live Preview modes.

"This" = the round-2 recommendation posted 2026-08-23, whose operative scope was:

> **Minimum viable set: 1, 2, 3, 4, 9 ≈ 2 days** — that closes every complaint in your
> comment: find it, add, remove, tell panels apart, survive restart. Items 4/7/10 total
> under 2 hours; take them too.

and the two doc pushes:

> - **Reframe the pitch.** Stop selling it as "your tracker, but persistent" — a pinned
>   note does that better. Sell it as **"a GM dashboard assembled from blocks that live in
>   different notes."** That's the only thing it uniquely does.
> - **Document the pinned-note pattern anyway** — two sentences in the docs: *"Running
>   everything out of one note? Open that note in the right sidebar and pin the tab. Use
>   the Draw Steel sidebar when your trackers live in different notes."*

## Approved scope (this round)

From the round-2 ten-fix list (numbering preserved from the ticket comment):

1. "Unpin" chrome item — calls the existing caller-less `removePanel`. (~40 lines shared with #2)
2. "Pin to sidebar" chrome item in reading mode — the primary path the spec described.
3. Panel header (element label · note name) — `.dse-sidebar__panel` has zero CSS today.
4. `requestSaveLayout()` on add/remove.
7. Dismiss button on the "note not found" card.
9. Empty state — the ribbon currently opens a blank div.
10. Delete the dead `collapsed` field.

Plus the two doc changes quoted above (reframe pitch + pinned-note pattern paragraph).

## Explicitly deferred (NOT in scope this round)

Backlog tickets filed 2026-08-29 — cite these as out-of-scope in any fix-round brief:

- Item 5 — reorder via up/down arrows → **SC-281**.
- Item 6 — rename/delete vault listeners → **SC-282**.
- Item 8 — unify the session key (medium risk; key is identity for all 22 elements).
  "Defer." → **SC-283**.
- Tabs — "Tabs: no" (round-2 verdict: if ever wanted, allow a second sidebar leaf and let
  Obsidian supply tabs; in-view tabs rejected). No ticket — rejected, not deferred.

## Base moved mid-round (dispatcher notice, 2026-08-29)

The worktree was cut at dse `c09cf6f` (then origin/develop tip). Since dispatch,
origin/develop moved twice: SC-190 landed (`c09cf6f` → `6035d12`), then SC-120 landed
(`6035d12` → `1619396`, including a sanctioned 24-line freeze rebaseline — backup
`freeze-baseline.sha256.pre-sc120-bak`). The branch must rebase onto `1619396` before
land-ready; gate baseline numbers from SC-205 may have shifted (re-read them from the
rebased tree's own runs).

## Owner rulings on the independent review (2026-08-29)

Review (`sc184-review-report.md`, on `5b1149a`): FIX ROUND REQUIRED — blocking HIGH-1
(vacuous tests), MEDIUM-1 (docs image shows one panel, alt text says two), MEDIUM-2
(silent pin failure; info-string fence alias divergence). Owner rulings for the fix round:

- Fix ALL of: HIGH-1, MEDIUM-1, MEDIUM-2 (both halves), MEDIUM-3 (dismiss-button CSS),
  LOW-1, LOW-2, LOW-3, LOW-4.
- LOW-5: KEEP `visual-harness/sc184-evidence.mjs`, add one harness-doc line.
- MEDIUM-4: evidence-only — before/after chrome-panel crops, no code change.
- Sanctioned addition: reword the four false "embeds are read-only" comments
  (BlockHost.ts:45, stamina-bar/view.ts:109, statblock/view.ts:318,
  ReadingModeBlockHost.ts:145) — prose only, zero behavior change.
- Nothing deferred from this review → no new Backlog tickets.

## Round history + owner rulings on the re-review (2026-08-29)

- Fix round landed on the branch: `5b1149a` → `44158f7` (5 commits; report
  `sc184-fixround-report.md`). All review findings addressed; gates green
  (jest 3417/1 skipped/190 suites, shots 474, freeze 210/210, parity 0/0/16,
  obsidian-shots 59/59).
- Scoped delta re-review (`sc184-rereview-report.md`): **LAND-READY**, 8 new
  non-blocking findings N-1..N-8. Owner rulings:
  - Backlog tickets filed 2026-08-29: N-1 → **SC-288** (degraded panel fast-path never
    recovers), N-5 → **SC-289** (silent pin when no right leaf), N-6 → **SC-290**
    (write-back drops fence info string). All pre-existing or out-of-scope residuals.
  - N-2/N-4/N-7/N-8 → one prose-only cleanup commit on the branch (no behavior change).
  - N-3 (88px header reserve truncates note names) → accepted tradeoff, no action;
    revisit only if Scott dislikes the truncation.

## Pre-landing rebase pending (2026-08-29, after the Needs Review post)

SC-195 landed: dse origin/develop moved `1619396` → `778a341` (no freeze-baseline change).
The branch (`51ba4e8`, based on `1619396`) must rebase onto `778a341` (or the then-current
tip) before landing. Conflict probe run 2026-08-29 (`git merge-tree` three-way against
merge-base `1619396`): **zero conflicts, disjoint files** — expected to apply cleanly.
Plan: single rebase + full battery re-run at Scott-approval time, not per-landing churn.

## 2026-08-29 — Scott (on the Needs Review approval ask, five screenshots)

> approved

Approves the full fix set at `51ba4e8` for landing to `draw-steel-elements` `develop`. No
deploy, no tag, no release (those stay Scott's). Ticket handed back with `Ready for Agent`.

### Owner ruling (2026-09-01, session 4931eaaf): pre-landing rebase round

- dse branch `51ba4e8` (base `1619396`) rebases onto `origin/develop` `778a341`. Overlap
  with SC-195: `CHANGELOG.md`, `docs/initiative-tracker.md`, `styles-source.css` (merge-tree
  probe said clean). Full `dse-verify` battery re-run on the rebased tree.
- Superproject branch `4c2035c` (one CHANGELOG bullet) rebases onto workspace
  `origin/main` `e5e7ce2`.
- Then report land-ready to the dispatcher. Landing is the dispatcher's move.
- Expected numbers: last branch run (`44158f7`) jest 3417 / 1 skipped / 190 suites; shots
  474, 0 FAIL; freeze 210/210; parity 0/0/16; obsidian-shots 59/59. SC-195 added tests
  (jest count may rise; anything lower than 3417 passed is a red).

### Rebase round result (2026-09-01, `sc184-rebase-report.md`)

- dse `51ba4e8` → **`69eb5f7`** on `778a341`; same 10 commits; one trivially additive
  `CHANGELOG.md` conflict (both bullets kept, SC-195 first). Owner verified: clean tree,
  10 ahead / 0 behind, no conflict markers, hunk correct.
- Gates: tsc/lint clean; jest 3514 / 1 skipped / 190 suites; shots 478, 0 FAIL; freeze
  210/210; parity 0/0/16; obsidian-shots 59/59. No rebaseline.
- Superproject `4c2035c` NOT rebased (land-stack owns it); merge-tree probe: additive
  `CHANGELOG.md` overlap with SC-120's `## Unreleased` bullet — keep both at landing.
- **LAND-READY** reported to the dispatcher. Landing target: `draw-steel-elements`
  `develop`; superproject `main`. Ledger snapshot → `docs/superpowers/dse-overhaul/build-ledgers/`
  at landing.

## Facts that changed under us

- **Embeds are NOT inert.** Round-2's report claimed elements inside `![[…]]` embeds are
  hard read-only at multiple call sites and that this killed the "dashboard note of
  embeds" alternative. Scott's live test (2026-08-28, quoted above) found `![[initiative]]`
  editable in both reading mode and Live Preview. Scott saw the round-2 caveat that this
  would weaken the recommendation and ruled to move forward anyway. Consequence: any doc
  wording this round writes must NOT claim embeds are read-only; the "only the sidebar can
  serve multi-note trackers" pitch needs honest wording. Reconcile code-vs-behavior before
  writing docs.
