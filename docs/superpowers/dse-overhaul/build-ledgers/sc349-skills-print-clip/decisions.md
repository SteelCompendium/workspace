# SC-349 decisions ledger

Effort: `sc349-skills-print-clip`. Worktree: `/home/scott/code/steelCompendium/worktrees/sc349-skills-print-clip`
(dse branch `sc349-skills-print-clip`, cut from dse `develop` @ `aaa88b7`).
Owner: ticket-owner (Opus 5.5), session `be71a0a9-199f-4e14-967b-191935312b05`.

## Ticket scope (verbatim, ticket description)

> The frozen `*--steel-print.png` captures of the Skills element never show the bottom of the skill
> list. Everything below device row 2400 is white (below row 2512 for `chrome-skills-menu`), but the
> page is 4,030–4,682 px tall.
>
> Fix: raise or remove the capture clip for the skills-family shots. This is a harness change and
> moves frozen bytes, so it needs a sanctioned rebaseline (dse-verify).

## Thread context (not a ruling) — comment 2026-10-02, SC-379 owner

> During the SC-379 design round a worker reported that the harness's main sweep uses a 900×1200
> viewport (`visual-harness/shoot.mjs`, around line 4941), and that captures taller than 1200 CSS px
> come out with a blank lower part. Its example was `montage-narrow--steel-dark.png` (600×4226 device
> px), which it says ends mid-card. ... If it holds, the fix for this ticket should cover every tall
> capture, not only the skills family.

## Owner rulings (2026-10-21)

- Fix the mechanism, not the skills family alone: no browser-camera capture may come out clipped.
  Hard constraint: every capture that is NOT clipped today must stay byte-identical (the fix only
  changes behaviour for captures taller than the viewport).
- Scope of which frozen lines move is Scott's sanction decision. Round 1 measures the full set of
  moved frozen lines; the sanction ask offers "all clipped captures" vs "skills family only" if the
  full set reaches beyond the skills family.
- Obsidian camera (`obsidian-shots`) is out of scope (not frozen, not byte-reproducible).

## Coordination (dispatcher, 2026-10-21)

- SC-326 (montage board scrolls instead of clipping) is close to landing. It adds a
  `montage board scroll OK (…)` in-run check to `visual-harness/shoot.mjs` (probe-rounds-14 source)
  and leaves every existing PNG byte-identical. Expect a rebase onto it once the dispatcher says it
  has landed; after the rebase, re-run shots and re-derive `rebaseline.txt` (montage captures may be
  in the clipped set).

- **2026-10-21 update: SC-326 LANDED — dse `develop` `aaa88b7` → `0ce76dd`.** All 572 PNGs
  byte-identical. New expected numbers at `0ce76dd`: jest **5408 passed / 1 skipped / 231 of 232
  suites**, lifecycle **29/29** (new G-S13), e2e **88/92 ok, 0 failed, 4 known-bug, 64/64 pairs**,
  shots 572 (plus the `montage board scroll OK (…)` line), freeze **276/276**, parity **0 / 0 / 24**.
  Branch must rebase onto `0ce76dd`; shots re-run and the rebaseline set rebuilt from the rebased
  head before any sanction ask.

## Round log

- **impl r1 (Sonnet implementer), DONE at dse `d34b0fe`** (on `0ce76dd`). Root cause: Obsidian's pinned
  `app.css` sets `html, body { height: 100% }` + `body { overflow: clip }` on screen media, so `#mount`
  outside the 1200 px viewport paints blank (realprint immune). Second effect: click/hover shots scroll
  the page and blank the TOP of `#mount`. Fix grows the viewport per tall capture, restores after; new
  helper `visual-harness/capture-viewport.mjs` + 8 jest tests + in-run gate `capture clip OK (180 …)`.
  135/572 captures clipped; 437 byte-identical. **40 frozen lines move (8 skills, 32 non-skills)**;
  deliverables `rebaseline.txt` (40), `rebaseline-skills-only.txt` (8), `sc349-clipped-list.txt`.
  Gates: jest 5416/1/232 of 233, lifecycle 29/29, e2e 88/92 0 failed 4 kb 64/64, parity 0/0/24.
  Owner eyeballed the skills crops: before cuts mid-"Dance"; after tail shows the Lore group incl. Strategy
  (`sc349-owner-skills-steel-print-after-tail.png`).
- **review r1 (Opus reviewer)** dispatched against `d34b0fe`.

## Owner rulings on r1 follow-ups (2026-10-21)

- dse-verify notes (negotiation-ended/narrow "cut by the 1200 px viewport" note goes stale; CURRENT
  block needs the new shots line + jest 5416): **landing bookkeeping** — named in the land-ready
  report for the dispatcher, not a branch change.
- `docs-shots.mjs` / evidence scripts not audited for the same clip: **folded into review r1 as an
  audit-only probe**; scope ruling after the reviewer reports.

## Review r1 (Opus) — FIX-REQUIRED (HIGH 1, MED 1, LOW 1, INFO 6); report `sc349-report-review-r1.md`

Hashes reproduce across agents (572/572, 40/40); 135 moved, all in the clipped list; gate fails
when the fix is disabled; viewport restores; hover kept.

## Owner rulings on review r1 (2026-10-21)

- **HIGH-1 (gallery `gallery--steel-{dark,light}` still clipped, gate says OK):** FOLD as an
  **explicit, named gallery exemption** that the OK line prints (reason: growing it means a
  25,000 px viewport, ~18 s and ~20 MB per PNG every run; gallery is unfrozen). The gate must no
  longer claim the gallery is whole. The gallery's usefulness goes to a Backlog ticket **SC-484** (filed 2026-10-21; out of scope for SC-349).
- **MED-1 (gate re-measures with the same function):** FOLD — at shot time check `#mount`'s
  viewport rect (`top >= 0`, `bottom <= innerHeight`); for fullPage shots also check that no
  scrolling ancestor hides overflow (or the shot is a named exemption).
- **LOW-1 (wording/count):** FOLD — correct "paints blank" for realprint and make the count say
  what it counts.
- INFO top-edge changes on 3 frozen lines: FOLD into the fix round as evidence (top crops for
  `chrome-hover-statblock`, `chrome-skills-menu`, `montage-guide-open` `--steel-print`).
- INFO glyph shift `negotiation-checked--steel-dark` (unfrozen, height-dependent rendering): DROP —
  reproduced by loading at that height directly; not an artifact.
- INFO harness fonts unloaded: DROP — pre-existing, unrelated to clipping, moves no byte here.
- INFO horizontal overflow in `*-narrow` captures: DROP — pre-existing horizontal content overflow
  of the column, not a viewport clip; out of SC-349's scope.
- INFO dse-verify `SKILL.md:367` + CURRENT stale: landing bookkeeping (dispatcher).
- INFO lint doesn't cover `visual-harness/*.mjs`: DROP — existing config choice, not this ticket.

- **impl r2 (fix round), DONE at dse `acbacbd`** (1 commit on `d34b0fe`): gallery named exemption
  (`CLIP_EXEMPTIONS`, SC-484), independent shot-time rect check, wording/count split; ZERO PNG bytes
  moved (572/572); jest 5417/1/232 of 233; freeze exactly the 40; parity 0/0/24; lifecycle/e2e skipped
  (diff only `visual-harness/` + `test/unit/build/`). Follow-up "gallery reason printed twice": DROP (cosmetic).
- **review r2 (scoped re-review of `d34b0fe..acbacbd`)** dispatched to the r1 reviewer.

- **review r2: APPROVE** at `acbacbd` (HIGH 0, MED 0, LOW 1, INFO 2). MED-1 closed (3 mutation probes
  caught; no false positives). Rulings: LOW-1 (bite probe left a stale unfrozen PNG in the worktree's
  shots dir, already overwritten) DROP — no code change; INFO-1 (clip gate runs after print-twin gate,
  indirect diagnosis) DROP — run still fails; INFO-2 (realprint failure wording) DROP — cosmetic.
- Final-head lifecycle + e2e re-run dispatched (chore), because e2e is required to land any dse change.

- Final-head chore (killed by a 429 at about 14:37Z): lifecycle at `acbacbd` = `OBSIDIAN-LIFECYCLE done: 29/29 ok, 0 failed`, rc 0; e2e not run.
  Superseded: **dse `develop` moved to `08206e3`** (SC-470 + SC-466 landed, no shots changed). The new expected numbers there are
  jest 5446/1/232 of 233, lifecycle 30/30, e2e 89/93 ok, 0 failed, 4 known-bug, 64/64, shots 572, freeze 276/276, parity 0/0/24.
  Rebase round (implementer) dispatched: rebase onto `08206e3`, re-prove 572/572 hashes and the 40 lines, then run the full battery.

- **dse `develop` moved again to `bc4a0c5`** (SC-362 landed: new by-SCC fixtures `rule-by-scc` and `condition-by-scc`,
  8 new shots, 580 in total; the shared baseline was WIDENED 276 → 280). New expected numbers: jest 5457/1/232 of 233, lifecycle 30/30,
  e2e 89/93 ok, 4 known-bug, 64/64, shots 580, freeze 280/280, parity 0/0/24. The rebase target is now `bc4a0c5`. The rebase must show the
  un-clip does not move the 4 new frozen lines; if it does, they join `rebaseline.txt` before the sanction.

- **impl r3 (rebase), DONE at dse `e2b17f1`** on `bc4a0c5`, with no conflicts. The 572 old PNGs are unchanged; the 8 new SC-362 PNGs are short and none was grown.
  Freeze vs 280 = exactly the 40 `rebaseline.txt` lines; the 4 SC-362 lines read OK (no additions). Gates: jest 5466/1/233 of 234,
  lifecycle 30/30, e2e 89/93 ok, 0 failed, 4 known-bug, 64/64, shots 580, parity 0/0/24. A clean rebase with every gate re-run needs no further
  review (owner ruling). **Code land-ready; landing waits on Scott's sanction of the 40 lines.**

- **Dispatcher, 2026-10-22: dse `develop` is now `c0e761b`** (many landings since `e2b17f1`). SC-279 rebaselined `roll--steel-print.png` and
  `roll--steel-realprint.png` (neither is in our 40) and added 12 shots (592 in total). **When Scott replies:** the rebase round goes onto
  the then-current develop and recomputes `rebaseline.txt` there. It must re-check that the moving set is still exactly our 40 names, that the
  old PNGs are unchanged except the clipped set, and how many of the new shots grew or moved. Then the full battery runs again, then land-ready again.
  If the moving set differs, amend the sanction ask before landing.

- **2026-11-05: after the sanction, rebase round r4** (implementer resumed; brief `sc349-brief-impl-r4.md`) onto dse `develop` `d689b719`
  (356 commits; `shoot.mjs` gained about 1,300 lines). It recomputes `rebaseline-r4.txt` and compares it to the 40. Scoped re-review by the r1/r2 reviewer follows.
  Ticket moved to Awaiting with `Ready for Agent` and `Needs Review` removed (labels = DSE Plugin).

- **develop moved again, to `248e202b`** (SC-490, montage-only: sticky hero column, board-scroll gate in 4 contexts, G-S13 extended; no shot
  changed). The r4 rebase target is now `248e202b`. Expected jest 6479/1/257 of 258 with our tests; shots 592 0 FAIL 161/966; base freeze 280/280.
  Extra check: the moving set is still the 40, and the montage head PNGs equal the r3 head's (sticky plus a grown viewport).

- **impl r4, DONE at dse `25abfce2`** (4 commits on `248e202b`, 0 conflicts). Moving frozen set = the same 40; `rebaseline-r4.txt` hashes
  equal `rebaseline.txt`, so the ask needs no amendment. 143 PNGs differ from base: the r1 135 plus 8 new unfrozen `feature-rolled*` (grown).
  Montage: 32 of 34 equal the r3 head; `montage-sheet-log` dark/light moved via develop (identical base vs head). Gates: jest 6479/1/257 of 258,
  lifecycle 51/51 (5 parts), e2e 128/128 89/89, shots 592 0 FAIL 161/966, `capture clip OK (147 … 41 …)`, parity 0/0/24.
- Scoped re-review r3 dispatched (the r1/r2 reviewer).

- **develop moved again, to `7bd8040b`** (SC-520: CSS only, three callout-chrome rules; new lifecycle G-S49, so 52/52, with part 5 = `G-S59 G-S49`;
  jest 6474/1/256 of 257; shots 592 0 FAIL 161/966; freeze 280/280). Owner ruling: review r3 finishes on `25abfce2` (the worktree is not moved
  under it). Then implementer round r5 rebases onto `7bd8040b`, re-proves the same 40 and the full battery (jest 6483/1/257 of 258). A conflict-free rebase
  onto a CSS-only upstream with the same moving set needs no further review.

- **review r3: APPROVE** at `25abfce2` (0 HIGH, 0 MED, 0 LOW, 2 INFO). The diff equals the approved diff, no capture path bypasses the fix, all 28 develop
  gate OK lines are identical base vs head, hashes are 40/40, and there is no sticky interaction. Rulings: INFO-1 (no PNG covers SC-490's pinned column) gets a Backlog
  ticket, **SC-562**, filed 2026-11-05 and out of scope. INFO-2 (gate order) was dropped in r2 and stays dropped.
- impl r5 (rebase onto `7bd8040b`) dispatched.

- **impl r5, DONE at dse `69b5c0d4`** on `7bd8040b` (tip), 0 conflicts. All 592 head hashes equal the r4 head; the moving set is the same 40,
  `rebaseline-r5.txt` equals `rebaseline.txt` once both are sorted. Gates: jest 6483/1/257 of 258, lifecycle 52/52, e2e 128/128 89/89, shots 592 0 FAIL 161/966,
  parity 0/0/24. **LAND-READY 2026-11-06**; landing notes refreshed (`sc349-dispatcher-landing-notes.md`).

## Sanction ask

- 2026-10-21: posted on SC-349 (comment file `sc349-comment-sanction.md`), ticket In Progress +
  `Needs Review`. Ask: "sanctioned" = all 40 lines (`rebaseline.txt`), owner-recommended;
  "skills only" = 8 lines (`rebaseline-skills-only.txt`, fix would then be limited to skills captures).
- Fix round r2 (implementer resumed) running in parallel; must change zero PNG bytes.

## Scott rulings

- **2026-11-05 00:28Z, SC-349 comment `f5db4077`:** "sanctioned" — replying to the ask (comment `34b7ebbd`) whose
  options were "sanctioned" = all 40 lines (`rebaseline.txt`) or "skills only" = 8 lines. **This sanctions all 40 lines.** He then set
  `Ready for Agent`. Applies to the 40 names; if the rebase onto current develop moves a different set, the ask must be amended.
