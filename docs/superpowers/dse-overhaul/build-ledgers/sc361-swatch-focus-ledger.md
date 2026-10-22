# SC-361 decisions ledger — Conditions color swatch focus indicator

Ticket: SC-361 (Linear). Owner: ticket-owner (Opus 5.5). Worktree:
`/home/scott/code/steelCompendium/worktrees/sc361-swatch-focus` (branch `sc361-swatch-focus`
in every submodule). dse base: `develop` @ `188755b`.

## Requirements (from the ticket description, 2026-10-20 — not a Scott ruling, the spec)

> * A focused unselected swatch must not look like a selected one.
> * A focused selected swatch must look different from an unfocused selected one.
> * The difference can't rely on color alone.
> * The swatches sit about 7px apart (`gap: 0.45em`), so a ring drawn farther out than the current selection ring will run into the neighboring swatch.

> **Options to prototype:** a dashed focus ring; moving the selection mark to something else (a check glyph, or an inset ring) so that focus can use the standard ring; or wider spacing plus a concentric outer ring.

Standing rule (docs/working-preferences.md): Scott is colorblind — never let hue be the only
channel; name colors in prose in every ask.

Dispatcher constraint (2026-10-20): SC-422 (text-scale CSS) and SC-326 (montage board CSS) are
in flight concurrently — keep CSS edits scoped to the swatches.

## Scott rulings

(none yet)

## Owner rulings on r1 tangents (2026-10-20)

- Keyboard pick moves focus to the row cog (`focusRowCog`, ConditionsModal.ts ~L401) → **filed
  SC-468 (Backlog)**; out of scope for SC-361 — do not change focus behaviour here.
- Pipette swatch renders 22.5px vs 19.5px for the others → **fold into the implementation round**
  (swatch CSS, same rule block) — pending Scott's pick.
- Custom colour never gets a selected mark → **asked Scott in the r1 ask** (default: show the
  check on the pipette when the condition's colour is not one of the presets).
- SC-338 prior-attempt image no longer exists → drop (machine-local scratch; irrelevant now).
- Check glyph source (Lucide `check` vs house ◆) → **asked Scott**; owner recommends Lucide check.

## Rounds

- r1 (design/prototype, orchestration:reviewer): prototype the options, evidence grid,
  recommendation. Report: `sc361-r1-design-report.md`. DONE — recommends Option B (check glyph
  inside = selected; standard kit focus ring = focused). Evidence in `evidence-r1/`.
- 2026-10-20: owner posted the design ask (Option B + 2 questions: check vs ◆; check on the
  pipette for custom colours). Ticket → In Progress + Needs Review. Awaiting Scott.
- Next (on Scott's pick): r2 implementation (orchestration:implementer, fresh identity) →
  independent review (orchestration:reviewer, NOT the r1 design agent's identity is fine since
  r1 authored no code, but prefer a fresh one) → land-ready. Implementation notes from r1:
  join `.dse-swatch:focus-visible` (and the pipette via `:has(> input:focus-visible)`) to the
  shared kit ring rule (~styles-source.css L15409) — a separate earlier rule would be picked up
  first by `kit-index.test.ts:230 focusRule()` and fail L239; delete the L15407 exclusion
  comment; extend `shoot.mjs` ~L3106 pressed-toggle parity (it can't see pseudo-elements);
  fix the pipette size (22.5px vs 19.5px). Freeze 276/276 and parity 24 DECLARED expected
  unchanged.

## Scott ruling — 2026-10-21 (Linear comment ce39aadc, verbatim)

> * option B looks good
> * Lucide check
> * showing the check on the pipette is ok

Meaning (owner, for briefs — the quote above is authoritative): Option B = the selected swatch
shows a white Lucide `check` with a dark outline inside it; keyboard focus uses the standard kit
focus ring (`.dse-swatch:focus-visible` joins the shared kit ring rule). The pipette (custom
colour) swatch shows the check when the condition's colour is not one of the presets.

## Coordinator update — 2026-10-21

- Rebase onto dse `develop` @ `bc4a0c5`. Baselines (dse-verify CURRENT @ bc4a0c5): jest 5457 /
  1 skipped / 232 of 233 · lifecycle 30/30 · e2e 89/93 ok, 0 failed, 4 known-bug, 64/64 pairs ·
  shots 580 / 0 FAIL · freeze 280/280 · parity 0 / 0 / 24 DECLARED. New lifecycle scenario id,
  if any: G-S24. Workers follow adapter footguns 9, 12, 13.
- SC-468 landed: after a keyboard pick focus now stays on the picked option (swatch / custom
  input), so "selected + focused" is the state right after a pick.
- SC-473 (custom colour input has no visible focus) → **folded into SC-361** (owner ruling): the
  pipette `:has(> input:focus-visible)` ring is part of this change; close SC-473 when SC-361
  lands.
- SC-474 made the Add dropdown close on click (same modal; no swatch overlap).
- SC-356 (modal host-leak sweep) is resuming; its pass allowlists `.dse-swatch` (HOSTLEAK_KNOWN_LEAKS,
  10 props: w/h/height/boxShadow/color/fontSize/fontFamily/whiteSpace/outlineStyle/outlineWidth,
  idle+pressed, fails once a listed prop stops leaking). Owner ruling: SC-361 makes the swatch
  host-invariant for those properties (pin them in plugin CSS) so the entry can be deleted;
  whichever lands second reconciles. Dispatcher announces landings.
- r2 (implementation, orchestration:implementer) dispatched 2026-10-21: brief
  `sc361-r2-brief-impl.md`, report `sc361-r2-impl-report.md`, evidence `evidence-r2/`.
  Owner design call in brief: selected custom colour → pipette fills with the custom colour and
  the check replaces the pipette glyph; no aria-pressed on the label.
- r3 (independent review, orchestration:reviewer, fresh identity) brief prepped:
  `sc361-r3-brief-review.md` (fill `__HEAD__` at dispatch). Includes SC-356 probe: cherry-pick
  sc356 dse commits f4deeff c331f78 0c8fae4 in a scratch worktree, delete the SC-361 allowlist
  entry, expect the modal host-leak pass green.
- 2026-10-21 coordinator: dse develop moved bc4a0c5 → 772c3cd (SC-457). New baselines: jest
  5536 / 1 skipped / 233 of 234 · lifecycle 31/31 · e2e 89/93, 4 known-bug, 64/64 · shots 580 ·
  freeze 280/280 · parity 0/0/24. Land-ready must be on 772c3cd (or newer) with the superproject
  rebased onto origin/main. r2 implementer messaged to retarget the rebase + battery.
- 2026-10-21 coordinator: dse develop moved 772c3cd → 8d075db (SC-422 text-scale; touches
  visual-harness/entry.ts + shoot.mjs). Baselines: jest 5552 / 1 skipped / 234 of 235 ·
  lifecycle 31/31 · e2e 89/93, 4 known-bug, 64/64 · shots 580 incl. `text scale OK (1626 …)` and
  `text scale once OK (104184 / 208 loads …)` · freeze 280/280 · parity 0/0/24. Land-ready on
  8d075db or newer + superproject on origin/main. r2 implementer retargeted to 8d075db.
- 2026-10-21 ~19:05Z: owner + r2 implementer killed by session-limit 429. State at resume: dse
  branch fdc7c80 (4 SC-361 commits on 772c3cd: 44f5660 check+kit ring, 00baeb5 shots parity +
  e2e COND-E07 + changelog, b8456af font pin, fdc7c80 COND-E07 tab stops), clean, no processes.
  Implementer resumed via SendMessage → rebase to 8d075db + full battery + evidence.
- 2026-10-21 coordinator: dse develop moved 8d075db → 95981f1 (SC-432 stamina modal; new e2e STAM
  tests). Baselines: jest 5582 / 1 skipped / 234 of 235 · lifecycle 31/31 · e2e 95/98 ok, 0 failed,
  3 known-bug, 66/66 · shots 580 (text-scale lines as before) · freeze 280/280 · parity 0/0/24.
  Implementer retargeted to 95981f1; told to finish there if develop moves again.
- r2 DONE: dse head 0daae2f on 95981f1 (e397105, c681ce0, 2474621, 0daae2f). Battery green:
  jest 5588/1/234 of 235 (+6) · lifecycle 31/31 · e2e 96/99 ok, 0 failed, 3 known-bug, 66/66 ·
  shots 580 / 0 FAIL (text scale lines unchanged; pressed parity 96 reads swatch ::after) ·
  freeze 280/280 · parity 0/0/24. Superproject on origin/main 383ec3f. Owner eyeballed
  evidence-r2/sc361-r2-after.png: all 4 states + pipette states distinct by shape, both themes. OK.
  develop now at 8d890f9 — final rebase after review.
- Owner rulings on r2 follow-ups: SC-356 allowlist deletion → whichever lands second (tracked);
  unparseable colour counted as custom → sent to r3 reviewer to judge; static mock
  sc186-entry.mjs keeps old ring → drop (mock doesn't import real CSS; historical SC-186 mock);
  close SC-473 → at landing.
- r3 review dispatched at 0daae2f.
- 2026-10-21 coordinator: develop 95981f1 → 8d890f9 (SC-366 follow-up: styles-source.css removes
  `.dse-ref-notice` left stripe, +3 jest; no shots moved). Baselines: jest 5585 / 1 / 234 of 235
  (ours expected 5591 = 5585 + 6); rest unchanged (lifecycle 31/31, e2e 95/98 + COND-E07 → 96/99,
  3 known-bug, 66/66; shots 580; freeze 280/280; parity 0/0/24). Final rebase onto 8d890f9 (or
  newer) happens after r3 review + fixes, then battery re-run, then land-ready.
- r3 review DONE: verdict LAND at 0daae2f; 0 CRIT/HIGH/MED, 3 LOW, 5 INFO; battery re-run matches.
  SC-356 probe: entry kept → exactly 10 "no longer leaks" lines; on SC-356 tip 2796ab8 + SC-361,
  entry deleted → modal host-leak OK (228), 0 allowlisted.
- Owner rulings on r3 findings (2026-10-21):
  - LOW-1 (unparseable colour shows as custom-selected) → FOLD into r4 fix round (report's fix:
    `isConditionColor` from src/elements/conditionColor.ts + jest case).
  - LOW-2 (no rendered check of the pipette selected look) → FOLD (in-run shots check per report).
  - LOW-3 (SC-356 and SC-361 both add a host re-grounding block "E." at the same spot in
    styles-source.css) → coordination note for whoever lands second: keep both blocks, relabel
    the second "F.", delete the SC-361 entry from HOSTLEAK_KNOWN_LEAKS, re-run shots. Told dispatcher.
  - INFO-1 (jest CSS assertions are text-only) → drop: shots pressed parity catches the invisible check.
  - INFO-2 (15.3px spacing at 80% scale under WCAG 2.5.8 exception) → drop: accepted, passes the exception.
  - INFO-3 (workspace CHANGELOG has no SC-361 bullet) → FOLD (workspace convention: DSE bullets under
    ## Unreleased, in the worktree superproject).
  - INFO-4 (stale "~:15409" comment) → FOLD.
  - INFO-5 (ARIA fine) → no action.
- r4 fix round: resume r2 implementer (author) — fixes + rebase onto latest develop (≥ 8d890f9)
  + full battery. Then r5 scoped re-review of the delta by the r3 reviewer (not the author).
- 2026-10-21 coordinator: develop 8d890f9 → 54f8f88 (SC-483, FormModal only). Baselines: jest
  5601 / 1 / 234 of 235 (ours = 5601 + 6 + LOW-1 tests); rest unchanged. Superproject origin/main
  moved (CHANGELOG moved) — r4 implementer told to rebase both; keep all main bullets on conflict.
- r4 DONE: dse d7e83e2 on 54f8f88 (r4: 95884b7 LOW-1, 383423c INFO-4, d7e83e2 LOW-2); superproject
  fa16842 (CHANGELOG only) on origin/main fc3bd71. Battery: jest 5608/1/234 of 235 · lifecycle 31/31 ·
  e2e 96/99, 3 known-bug, 66/66 · shots 580 + `pipette selected look OK` · freeze 280/280 ·
  parity 0/0/24. LOW-2 mutation proof: 4/4 mutations fail. r5 scoped re-review → r3 reviewer.
- ~00:36Z: owner + r5 reviewer killed by 429. At resume: dse d7e83e2 clean, super fa16842, no
  processes, no r5 report section. Reviewer resumed via SendMessage to finish r5.
- r5 re-review DONE: LAND at d7e83e2 on 54f8f88; 0 C/H/M/L, 3 INFO; battery re-run matches
  (jest 5608/1/234 of 235 · lifecycle 31/31 · e2e 96/99, 3 kb, 66/66 · shots 580 + pipette look OK ·
  freeze 280/280 · parity 0/0/24). range-diff: r2 commits unchanged.
- Owner rulings on r5 INFO: a (waitForSelector default 30s timeout, never a false pass) → drop;
  b (two long comment lines) → drop, cosmetic; c (superproject origin/main moved) → chore rebase
  of fa16842 onto origin/main now.
- Superproject rebased (chore): bb39be3 (CHANGELOG only) on origin/main 46ae296; dse d7e83e2 on
  54f8f88 (= origin/develop at report time). Land-ready comment posted to SC-361. SC-473 marked
  Duplicate of SC-361. LAND-READY reported to dispatcher 2026-10-22.
- 2026-10-22 coordinator: SC-356 LANDED first (dse develop ea56712; workspace main 87af8b8, edits
  dse-verify SKILL.md + CHANGELOG.md). SC-361 lands second → r6 reconcile round (implementer):
  rebase onto ea56712; keep both "E." host re-grounding blocks, relabel ours "F."; delete SC-361
  entry from HOSTLEAK_KNOWN_LEAKS; rebase superproject onto origin/main; full battery. Baselines
  @ ea56712: jest 5607/1/234 of 235 · lifecycle 31/31 · e2e 95/98, 3 kb, 66/66 · shots 580 with
  `modal button host-leak OK (10 … 9 … 38 … 228 …)` · freeze 280/280 · parity 0/0/24. Expect
  NO "ALLOWLISTED … SC-361" line. Then r7 scoped re-review (r3 reviewer) → land-ready.
- r6 DONE: dse 134c0de on ea56712 (8 SC-361 commits; r6 = 134c0de allowlist entry dropped,
  HOSTLEAK_KNOWN_LEAKS = [] with mechanism kept; ALLOWLISTED line printed only when non-empty).
  Blocks: SC-356 "E." styles-source.css:17221, SC-361 "F." :17264; no overlapping pins. Superproject
  c9bd011 on origin/main e5f329a. Battery: jest 5614/1/234 of 235 · lifecycle 31/31 · e2e 96/99,
  3 kb, 66/66 · shots 580, modal host-leak OK (228), no ALLOWLISTED · freeze 280/280 · parity 0/0/24.
  r7 scoped re-review → r3 reviewer.
- 2026-10-22 coordinator: develop ea56712 → 3973b56 (SC-482: src/elements/shared/undeclaredDefaults.ts;
  no Conditions/CSS change). Baselines: jest 5696/1/238 of 239 (ours → 5703); rest unchanged. Plan:
  let r7 finish on 134c0de (do not move the branch under the reviewer); then r8 = rebase onto
  3973b56 + range-diff (must be identical) + full battery; no further re-review if range-diff is
  clean and the battery matches.
- r7 re-review DONE: LAND at 134c0de; 0 C/H/M, 1 LOW, 1 INFO; battery re-run matches. Rulings:
  LOW-1 (dse-verify SKILL.md still expects the SC-361 ALLOWLISTED line at :213-214, :221-226, CURRENT
  :1205; add `pipette selected look OK` to in-run gates) → route to dispatcher as landing bookkeeping
  (workspace doc in main checkout, dispatcher-permitted). INFO-1 (pipette check 14.3 vs 12.9px only
  with Obsidian's sheet off) → drop, not reachable in real Obsidian.
- r8: implementer resumed → rebase onto 3973b56 (or newer) + range-diff + full battery.
- r8 DONE: dse 424f47b on 3973b56 (range-diff 8/8 "=" vs 134c0de); superproject e8cde22 (CHANGELOG
  only) on origin/main 262dad6. Battery: jest 5703/1/238 of 239 · lifecycle 31/31 · e2e 96/99, 3 kb,
  66/66 · shots 580, modal host-leak OK (228), 0 ALLOWLISTED, pipette look OK · freeze 280/280 ·
  parity 0/0/24. Owner verified develop/main unmoved at report time. LAND-READY re-reported
  2026-10-22 (supersedes the d7e83e2 report).
