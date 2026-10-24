# SC-519 decisions ledger — Block edit form opened right after an in-card click starts from the old content, so Save undoes the click

Owner: ticket-owner (Opus 5.5, posts with `--model opus-5.5`). Session be71a0a9-199f-4e14-967b-191935312b05.
Worktree: /home/scott/code/steelCompendium/worktrees/sc519-form-stale-open (branch `sc519-form-stale-open` in every submodule). Cut at dse develop c2758a2, superproject 2bfd07d.

## Ticket facts (from the description, 2026-10-24)
- Repro: on a counter, click Increase, then within about 400 ms click the pencil (authoring controls on). Press Save without changing anything.
- What happens: "the form opened with the body from before the click. Save writes that body, so the Increase is lost without any message."
- Why (ticket): "a card's in-card writes wait out a ~400 ms debounce before `replaceSource`. `openFormEditor` reads the block body (`src/framework/pipeline.ts` ~577-578) without flushing the view's pending write first."
- Expected (ticket): "opening the form flushes, or waits for, the view's pending write, so the form starts from what the card shows."
- Origin: SC-509 r3 review INFO-1 (docs/superpowers/dse-overhaul/build-ledgers/sc509-form-save-refresh/sc509-r3-review-report.md; jest probe P5c). Pre-existing at 7046eb0.
- Related, ruled no-action in SC-509: INFO-2 (a view write pending across a form Save overwrites it; not human-reachable).

## Dispatcher constraints (2026-10-24)
- Only FormModal ticket in flight; SC-510 waits for this one.
- Authoring controls are experimental.
- dse-verify rule: never a timed delay inside a lifecycle step — hold Obsidian at a hook instead.
- A new lifecycle scenario uses id G-S45.
- Owner reports land-ready to the dispatcher and stops; the dispatcher lands.

## Baselines at c2758a2 (dse-verify CURRENT)
tsc/lint clean · jest 6058 passed / 1 skipped / 245 of 246 suites (after shots) · lifecycle 37/37 · e2e 123/123 ok, 0 failed, 0 known-bug, coverage 87/87 · shots 592, 0 FAIL · freeze 280/280 · parity 0 GAPs / 0 undeclared / 24 DECLARED.

## Scott rulings
(none yet)

## Rounds
- 2026-10-24 worktree created (wt-new). Ticket Backlog -> Awaiting.
- 2026-10-24 r1 (impl, implementer A, agent a1710ea82cfd3b367): dispatched, brief sc519-brief-r1-impl.md.
- 2026-10-24 ~06:34Z: owner + implementer A killed by session-limit 429 (A's last text "Now e2e."). State at 08:12Z: dse 3b760b8 red, 82aa704 fix, 1e97599 G-S45; superproject 9797d3c CHANGELOG; tree clean; no live gate process. A resumed via SendMessage with orders to check logs and re-run cut-off gates. dse develop still c2758a2.
- 2026-10-24 r1 DONE (A): dse 3b760b8 red, 82aa704 fix (`ElementView.openAfterPendingWrite(open)`: flushes the view's own write with fromView:true and awaits it; opens synchronously when nothing is pending; used by the pencil and ds-hero "Edit definition"), 1e97599 G-S45 (holds the plugin's 400 ms debounce timer at a hook; file asserted old at pencil click). Superproject 9797d3c CHANGELOG. Red: jest 7/14 fail on c2758a2; G-S45 FAILs on a c2758a2 bundle and on a no-sidebar-fix variant. Gates on 1e97599: tsc/lint clean; jest 6074 / 1 skipped / 245 of 246 (after shots); lifecycle 38/38; e2e 123/123, 0 known-bug, 87/87; shots 592, 0 FAIL; freeze 280/280; parity 0/0/24. FormModal.ts untouched. G-S40 driver moved into shared `formKit`.
- 2026-10-24 owner rulings on r1 open points:
  - Sidebar `currentBody()` now reads `SidebarBlockHost.currentBody()` (the sidebar form was stale even with nothing pending): KEEP — same defect as the ticket's expected behavior ("the form starts from what the card shows"); the reviewer probes it.
  - Flush failure → host Notice, then the form opens from the body on disk: KEEP — the user is told, and the form matches the note file. No new UI. Reviewer probes it.
  - Two pencil clicks with nothing pending open two forms: DROP — pre-existing, and the open modal covers the pencil, so a person cannot click it twice.
  - Live Preview not driven in real Obsidian: FOLD into the r2 review as a real-Obsidian probe.
  - dse-verify SKILL.md CURRENT (38/38, G-S45): dispatcher bookkeeping at landing; name it in the land-ready report.
- 2026-10-24 r2 (independent review, reviewer B, agent a412b1219006f9ef1, fresh identity): dispatched, brief sc519-brief-r2-review.md (HEAD 1e97599, superproject 9797d3c).
- 2026-10-24 r2 review DONE (B): LAND-READY at 1e97599. 0 HIGH / 1 MEDIUM / 2 LOW / 5 INFO. Red/green re-run (jest 14 fail on c2758a2 across the 3 SC-519 files, 55/55 on HEAD; G-S45 FAIL on c2758a2 bundle). 8 mutants all caught (4 also in real Obsidian). Gates on 1e97599 identical to r1. Report sc519-r2-review-report.md.
- 2026-10-24 owner rulings on r2 findings:
  - M-1 Live Preview form opens then closes when a write is pending (not a regression, nothing lost): FILED SC-523 (with INFO-1, pencil unreachable by mouse in LP). FOLD the CHANGELOG narrowing: the bullet names Reading view and the sidebar only.
  - L-1 failed write shows no Notice / host body updated before the disk write fails (pre-existing): FILED SC-524. FOLD the comment fix at view.ts ~309 (it claims the host always shows its own Notice).
  - L-2 G-S45 sidebar phase fixed 1000 ms settle (obsidian-lifecycle.mjs ~2702; copied from G-S40 ~2597): FOLD — replace with a wait on the panel's rebuild, in G-S45 and in the shared G-S40 copy if they share the code.
  - INFO-2 (second card click in the ms before the form opens): DROP — not reachable by a person.
  - INFO-3 hero form Save reformats the definition YAML: DROP — pre-existing, nothing pending needed; the form editor is experimental and SC-404 redesigns it.
  - INFO-4 sidebar KEEP confirmed. INFO-5 / dse-verify SKILL.md 38/38 + G-S45: dispatcher bookkeeping at landing.
  - Cleanup: the kept /tmp/dse-obsidian-lifecycle-{UWaF1N,VOZM1l,Q6tRxq,UEb2TT,a7raUi,RCoYhM,t3UWgs,bOWljr,bvEScG} dirs are SC-519's FAIL-shot runs; the fix round deletes them by literal path after the round's own evidence no longer needs them.
- 2026-10-24 r3 (fix round, implementer A resumed): brief sc519-brief-r3-fix.md.
- 2026-10-24 r3 DONE (A): dse 253aa5f (view.ts openAfterPendingWrite comment now states the real failure behavior; formKit.pinToSidebar replaces both fixed 1000 ms sleeps in G-S40/G-S45 with a condition wait, 15 s deadline). Superproject f0cd44b (CHANGELOG: "in Reading view and the sidebar … (Live Preview is not covered by this fix.)"). G-S45 still FAILs on a c2758a2 bundle. Gates on 253aa5f: tsc/lint clean; jest 6074 / 1 / 245 of 246; lifecycle 38/38; e2e 123/123, 0 known-bug, 87/87; parity 0/0/24; shots+freeze skipped (no rendered code). Cleanup done; left: /tmp/dse-obsidian-lifecycle-{JZLZpk,8lyigx,jfAV0T,xRXzGA} (SC-519's own).
- 2026-10-24 r4 (scoped re-review of 1e97599..253aa5f, reviewer B resumed — not the author).
- 2026-10-24 r4 re-review DONE (B): LAND-READY at 253aa5f. 0 HIGH / 0 MEDIUM / 0 LOW / 2 INFO. The wait fails when never true; G-S45 still red on c2758a2 with the wait forced true; G-S40,G-S45 3/3 runs ok. Cleanup of all SC-519 /tmp lifecycle dirs done.
- 2026-10-24 owner rulings on r4: INFO-1 (wait cannot see a late async rebuild) DROP — it fails loudly, never passes falsely. INFO-2 (`panels?.[0]`) DROP — both scenarios close their sidebar leaves in `finally`; a leak times out loudly.
- 2026-10-24: LAND-READY. dse 253aa5f on develop c2758a2; superproject f0cd44b on main 2bfd07d. Land-ready comment posted (no ask). State stays Awaiting; landing is the dispatcher's. At landing the dispatcher updates dse-verify CURRENT (lifecycle 38/38, G-S45; jest 6074 / 1 / 245 of 246) and preserves this ledger to build-ledgers/.
