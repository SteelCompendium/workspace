# SC-379 — Negotiation tracker updates — decisions ledger

Effort: `sc379-negotiation` · worktree `/home/scott/code/steelCompendium/worktrees/sc379-negotiation`
· dse branch `sc379-negotiation`, cut from `origin/develop` @ `9ded832` (2026-10-02).
Owner session: `6d086380-78bf-450e-9133-fb57dfd943dc`.

## Scott's rulings (verbatim, dated)

### 2026-10-02 — ticket description (the whole ticket; no comments yet)

> * Overhaul the UI to be in the High Fantasy Steel style
> * [image: a real-Obsidian screenshot of the CURRENT negotiation tracker, steel-dark — card
>   head "NEGOTIATION / CONVINCING FRODO TO REMEMBER THE TASTE OF STRAWBERRIES", the Patience
>   0–5 track, the Interest 5→0 list, and the top edge of the two tabs "Make an Argument" /
>   "Learn Motivation/Pitfall"]

The image carries no annotation. Saved copy: `sc379-ticket-image.png` in this dir.

### 2026-10-02 16:21 UTC — comment `56a2b5d7`, replying to the r1 ask (A/B/C; Learn-as-collapsible; ended band)

> I think having patience and interest on different axis is too strong to ignore.  Because of
> that, im leaning towards Option A.  If there are better ways to represent that, id love to
> see them.
>
> Go ahead and keep the negotiation band that you added

Owner's reading: C is out (same axis for both values). Direction = A's two-axis idea
(Patience horizontal, Interest vertical). He is "leaning", not locked, and invites better
two-axis treatments → round 2 is a bounded A-variant design round, then he picks, then build.
The "negotiation over" band is **approved** (follow-up 2 → FOLD). Question 2 (Learn as a
collapsible) was C-only and is moot; the tabs stay unless a variant earns otherwise.

### 2026-10-09 02:40 UTC — comment `c4cce74e`, replying to the r2 ask (A1/A2/A3; chip location)

> A1 gauges, buttons in the tab

**DIRECTION LOCKED:** A1's standing region (same round numbered mark on a horizontal Patience
rail and a vertical Interest rail) + the appeal/mention chips stay inside the "Make an
Argument" tab (A2/A3's argument section) + bottom Motivations/Pitfalls cards carry only
"Mark spent"/"Spent" + tabs kept + the "negotiation over" band (approved 2026-10-02).

### 2026-10-09 12:46 UTC — comment `f997cf3b`, replying to the sanction ask (look + 6-line rebaseline + 6-line widening; the ask said: reply "sanctioned" if the screenshots look right)

> approved

**SANCTION RECORDED.** The ask offered two outcomes (approve = land + apply the lines; decline
= say what to change); "approved" is read as the sanction for both the look and the 6-line
rebaseline — the same reading as SC-236/SC-255/SC-231. **LAND-READY.**

## Owner rulings (ticket-owner's own, not Scott's)

- 2026-10-02 — **Reading of the ask (owner's interpretation, not a Scott ruling):** the image
  is the "before". The tracker today is the legacy layout carrying Steel tokens; the ask is a
  designed Steel composition, the same kind of round the montage (SC-191), initiative
  (SC-183) and project (SC-201) trackers got. Title says "updates" (plural) but the ticket
  lists only the one item, so scope = the visual/UX overhaul; functional gaps found on the
  way are reported as follow-ups, not built.
- 2026-10-02 — **Round 1 is a design round** (mock candidates, no production code). Scott's
  eye is the gate; no implementation starts until he picks a direction.
- 2026-10-02 — Freeze: negotiation owns 6 frozen print lines (`negotiation`,
  `negotiation-checked`, `negotiation-pr-checked` × twin + realprint). An overhaul will move
  them → sanctioned rebaseline ask goes on the ticket with the implementation evidence, not
  in the design round.

- 2026-10-02 — **r1 returned** (commit `be4b734` on `sc379-negotiation`, mocks only under
  `visual-harness/sc379/`). Three candidates: A "Offer Ladder", B "Console", C "Standing
  Board". Worker and owner both recommend C. Owner eyeballed A/B/C default-dark, C narrow, C
  ended, C learn, C light. Ask posted to the ticket (pick A/B/C; C's Learn-as-collapsible;
  the "negotiation over" band). **No implementation until Scott answers.**
- 2026-10-02 — Owner's own eyeball note for the implementation brief: in C at 300px the
  "PATIENCE" column header is tight against the column's right edge — must be checked for
  overflow in the real build. In C's ended state the Complete Argument hint still reads
  "Choose the test result…" — it should say the negotiation is over.
- 2026-10-02 — **r1 follow-up rulings:**
  1. Complete Argument doesn't clamp Interest/Patience to 0–5 (`ArgumentView.ts:266-267`) —
     **FOLD** into implementation (same file is rebuilt; a real data bug).
  2. No end-of-negotiation signal; Complete Argument stays armed — **ASKED** (ask item 3);
     fold if Scott says yes.
  3. Tier rows stale until the note write echoes back — **FOLD**: implementation must
     recompute on toggle and prove it in the sidebar host + canvas.
  4. Tooltip says a motivation appeal makes the test "Easy" (`ArgumentView.ts:78`) — owner
     checked the book (`steel-etl/input/heroes/Draw Steel Heroes.md`, "Appeal to Motivation"):
     it says "medium test". **FOLD**: correct the wording to the book's.
  5. Harness captures taller than 1200 CSS px truncated — same class as existing **SC-349**
     (Backlog). **DROP as a new ticket**; noted on SC-349. Implementation brief must check
     negotiation's own narrow captures are not truncated.
  6. Selectable power-roll "checked" state nearly invisible — **FOLD** (every candidate fixes
     it; kit-level, moves `negotiation-pr-checked`).
  7. No shared pip/notch track kit part (montage, recoveries strip hand-roll one) — SC-379
     builds its track as a kit part; migrating the other elements onto it is **FILED** as a
     Backlog ticket (see below).
  8. Mock-only rgba literals in `sc379.css` — **DROP**; implementation uses tokens (cite in
     the brief).

- 2026-10-08 — **r2 returned** (commit `cd8cddc`, mocks only). A1 "A tightened" (same round
  mark on a horizontal Patience rail and a vertical Interest rail; appeal chips moved out of
  the tab onto the bottom cards), A2 "framed board" (chart-axes frame, Patience ruler on top,
  Interest down the side), A3 "argument clock" (Interest ladder alone up top, Patience strip
  docked on the argument tabs). Worker recommends A1. Owner eyeballed all three default-dark.
  **Owner's recommendation to Scott: A1's two rails, but keep the appeal/mention chips inside
  the Make an Argument tab (as A2/A3 do) and leave only "Mark spent" on the bottom cards** —
  moving the roll's inputs below the roll is a hand-travel cost with no gain. Ask posted.
- 2026-10-08 — r2 follow-ups: (2) rail overshoot at 300px when an outcome wraps to 3 lines —
  **FOLD** into implementation (draw the rail per row). (3) user docs mention ticking the
  motivation in the tab — **FOLD** into implementation's docs step if the chips move; moot if
  they stay in the tab.

- 2026-10-09 — **Impl spec written** (`sc379-impl-spec.md`, by the r1/r2 design worker).
  Owner rulings on its open questions:
  1. Narrow capture truncation at the harness's 1200 px viewport → **option (b)**: leave the
     harness alone; `negotiation-narrow` is added and pins what the viewport captures; the
     harness fix stays SC-349's (already noted there on 2026-10-02). Not folded — it would
     move other elements' frozen lines and widen this ticket's sanction ask.
  2. "Easy" → "Medium": **confirmed from the Heroes book itself** (owner read
     `steel-etl/input/heroes/Draw Steel Heroes.md` "Appeal to Motivation": "can make an medium
     test"; "No Motivation or Pitfall": "a more difficult test"). Ship fix 4.
  3. Ended state tier panel **static** (as specified) — accepted.
  4. Patience 0-floor seal stays hollow, never a color-coded "empty" — accepted.
- 2026-10-09 — Base moved: `origin/develop` is `8a256c5` (SC-378, 2 commits). Slice 1 rebases
  the branch onto it first. Expected numbers at `8a256c5`: jest 4219/1 skipped, lifecycle
  19/19, shots 544, freeze 262/262, parity 0/0/24.

- 2026-10-09 — **s1 returned DONE_WITH_CONCERNS** (final `046f340` on base `8a256c5`): all
  gates green except freeze, which read 134 mismatches (131 at the untouched base). **Owner
  diagnosis: not environmental.** SC-127 landed on `origin/develop` @ `1ac4e5a` on 2026-10-08
  with a sanctioned 131-line print-twin rebaseline (dse-verify "CURRENT" block); the branch's
  base predates it, so every twin line differs by construction. Fix: rebase onto `1ac4e5a`,
  re-run the battery, regenerate the before/after crops from the new base. Expected at
  `1ac4e5a`: jest 4254/1, shots 544, freeze 262/262, parity 0/0/24. Follow-up "freeze
  baseline does not reproduce on this machine" → **DROP** (explained).
- 2026-10-09 — s1 follow-ups: "Higher Authority" wraps letter-by-letter at 300px in the
  argument tab → **FOLD** into slice 2 (chips restyle). `controlDensity.test.ts` D-2 pins
  retargeted from the retired bubble ladder to the track seals → **ACCEPT** (the ladder is
  gone; the reviewer checks the pins still measure what D-2 meant).

- 2026-10-09 — **s1 review: FIX ROUND NEEDED** (0 HIGH / 3 MEDIUM / 2 LOW / 4 INFO;
  `sc379-s1-review-report.md`). Owner rulings: **M1** (rails show through seal numerals in
  print — base-tier `.dse-track__mark` has no background) → FIX. **M2** (Patience seal touch
  target shrank from `--dse-control-min` 44px coarse to ~30px; retargeted D-2 tests assert
  nothing about size) → FIX: slot hit box driven by `--dse-control-min`, mark centred, D-2
  re-pinned to size — the earlier "ACCEPT" of the retarget is **withdrawn**. **M3**
  (pre-existing: after a live Complete Argument the tab's checkboxes/tier stay checked while
  the model reset — view adoption keeps the view across our own write) → FOLD into slice 2
  (it is fix 2's area). **L1** (quoted YAML numbers concatenate: `"3"`+1 → `"31"` → clamps
  to 5; `.nan` written) → FIX. **L2** (two clamp tests pass with the clamp deleted) → FIX.
  **INFO** (viewport cut at 1200 px etc.) → DROP; SC-349 owns the viewport.
  **Process:** the fix round is folded into the slice-2 dispatch (same implementer, fixes
  committed first as their own commits); one independent review covers fixes + slice 2.

- 2026-10-09 — **s1 fix round + slice 2 returned DONE** (final `cad6ad7`, base `1ac4e5a`;
  superproject `88e9435` = CHANGELOG). Gates: jest 4308/1, lifecycle 19/19, shots 556/0 FAIL,
  freeze 6 mismatches (all `negotiation*`), parity 0/0/24. Freeze package: `rebaseline.txt`
  (6, deterministic ×2), `widening.txt` (6 new: `negotiation-{appeal,ended,narrow}` × twin +
  realprint, 0 collisions). Sent to the s1 reviewer for the scoped re-check + slice-2 review.
  Follow-up `negotiation.gif` (manual docs GIF now stale) → **FILED SC-388** (Backlog).

- 2026-10-09 — **s2 review: APPROVE** (0/0/3 LOW/3 INFO; `sc379-s2-review-report.md`). All
  five s1 findings re-verified closed (M2 by mutant tests, M3 under real view adoption).
  LOW-1 (assert `content` in the hit-box test), LOW-2 (M3 test under adoption — reviewer's
  `probe2.test.ts` as template), LOW-3 (docs page opens on the stale gif → use the PNG) →
  **FOLD**, test/docs-only fix round by the implementer; rebaseline hashes must stay
  byte-identical. INFO → DROP; INFO-2 (CHANGELOG `## Unreleased` conflict at landing — keep
  both bullets) goes to the dispatcher in the land-ready note. Full-height evidence shots
  requested from the reviewer (harness wide shots are cut at 1200 px).

- 2026-10-09 — **LOW fix round DONE** (final dse `e0ee273`; superproject `88e9435`
  CHANGELOG; pointer bump unstaged). Gates at `e0ee273`: jest 4309/1 (one unrelated timing
  flake on run 1, green on re-run), shots 556, freeze the same 6, `rebaseline.txt` 6/6 OK,
  `widening.txt` 6/6 OK. **Sanction ask posted** (`sc379-sanction-comment.md`, 7 images),
  ticket In Progress + Needs Review. **Waiting on Scott's "sanctioned".** Land-ready after
  that: branch `sc379-negotiation`, dse `e0ee273` on `develop` `1ac4e5a`; apply
  `rebaseline.txt` (6, in place) + `widening.txt` (6, append) at landing with a dated backup
  + dse-verify record; CHANGELOG `## Unreleased` will conflict with main — keep both bullets.

## Rounds

| Round | Worker | Kind | Brief | Report |
|---|---|---|---|---|
| r1 | reviewer (Opus) | design candidates | `sc379-r1-design-brief.md` | `sc379-r1-design-report.md` |
