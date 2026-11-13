# SC-581 decisions ledger — Conditions window: no way to clear a condition's colour

Ticket: https://linear.app/tski-home/issue/SC-581
Worktree: /home/scott/code/steelCompendium/worktrees/sc581-condition-colour-clear (branch `sc581-condition-colour-clear` in every submodule)
Base: dse `develop` @ `1516f894`; superproject cut at `4cfac4bf`.
Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05.

## Scott's rulings (verbatim, dated)

- 2026-11-10 (ticket description, as filed): "Any fix is fine (a "Default" swatch, or clicking the selected swatch to unset it); the SC-436 marker accepts either."

No thread comments as of 2026-11-13.

## Owner rulings

- 2026-11-13 — Fix shape: an explicit **"Default" option, first in the Color group**, mirroring the Icon group's
  "Default" button ("Use default condition icon"). Pressing it deletes `color` from the condition (key removed,
  not written as empty). It is pressed (`aria-pressed=true`) when the condition has no valid colour. Re-pressing a
  selected preset swatch keeps its current behaviour (writes that colour again, stays pressed) — no toggle-to-unset,
  because a hidden toggle is undiscoverable and an accidental second click would wipe the colour.
  Reason: the other three groups all have a visible reset choice (Icon "Default", Duration "Until removed",
  Effect "static"); the ticket allows either shape.
- 2026-11-13 — The Default option must be identifiable without hue (Scott is colorblind): visible text or a
  non-colour glyph, plus accessible name "Default" (the group already says "Color").
- 2026-11-13 — Jest: flip the SC-436 `test.failing('SC-581: …')` marker to a passing test; update the
  "[current behaviour — SC-581 may change this]" row title so it no longer says SC-581 may change it.
  e2e: add a real-Obsidian test that clears a colour (no bracketed ticket id in any test title).
  No lifecycle scenario needed (no write-lifecycle change); G-S110 stays unused.

## Rounds

- 2026-11-13 r1 implementer (orchestration:implementer, agent a25b4fe0b7fca1c1b) dispatched on
  `sc581-r1-brief-implementer.md`. Ticket flipped Backlog -> Awaiting.
- 2026-11-13 r1 DONE: dse `14513d4a` (f9e631e4 code+jest, dbe7f3cd e2e COND-D18/D19, 14513d4a docs);
  superproject `4a28dd5d` (CHANGELOG only, no pointer bump). Gates: jest 11707/2 skipped; lifecycle 61/61;
  e2e 330/333 ok, 0 failed, 3 known-bug, coverage 176/176; shots 592, modal host-leak 40/240 (new Default chip
  kind), freeze 280/280 no rebaseline; parity 0/0/24. Default = `.dse-optchip` text chip, stamp `cond.color-default`.
  Owner eyeballed light colour-row crops: ~~Default chip pressed = teal accent border + light fill, swatches unchecked.~~
  superseded by r2 MED-1: at rest the pressed chip = accent border + full-strength text + Steel bevel, identical to the
  pressed Duration/Effect chips; the light fill in r1's crops was HOVER (pointer left on the chip). Post r2's
  pointer-away crops (scratchpad/sc581-r2-review/shots/r2-default-nohover-colorrow-*.png), not r1's after-default-pressed.
  Follow-ups ruled: "no PNG of the Conditions editor in the harness" -> drop (gates cover it; a shot is its own
  effort if a look change ever lands there); "fresh worktree needs npm ci" -> drop (known setup step).
- 2026-11-13 r2 reviewer (orchestration:reviewer) dispatched on `sc581-r2-brief-reviewer.md`.
- 2026-11-13 r2 DONE: verdict LAND. MED-1 evidence/ledger only (fixed above). LOW-1 tooltip says "colour" where
  every other visible string says "color". INFO-1 Default on an uncoloured condition still writes once; INFO-2 at
  360px the pipette wraps under Default (no overflow); INFO-3 Default marks selection by outline, swatches by check.
  r2 gates: jest 11708/1 skipped (warm cache = 11707/2); e2e 330/333 ok, 0 failed, 3 known-bug, coverage 176/176;
  lifecycle part 3 9/9 and G-S1 1/1; 17 jest + COND-D18/D19 fail with the fix removed; real-Obsidian probes clean.
- 2026-11-13 owner rulings on r2:
  - MED-1: fixed in this ledger; comment uses r2's pointer-away crops.
  - LOW-1: FOLD into r3 fix round (tooltip "Default (no color)" + its test at conditions-modal-matrix.test.ts:257).
  - INFO-1: DROP — same as Duration "Until removed" and Effect "static"; a no-op-write sweep would span all three
    groups and is not this ticket.
  - INFO-2: DROP — wraps cleanly, nothing overflows.
  - INFO-3: DROP — the outline matches the Icon/Duration/Effect chips' pressed style, and no swatch shows a check
    while Default is pressed; not a ticket.
- 2026-11-13 r3 fix round: resume r1 implementer (LOW-1 + superproject rebase onto workspace origin/main + ONE
  pointer bump). Scoped re-review of the delta by the r2 reviewer (it did not author the fix).
- 2026-11-13 r3 DONE: dse `2074a152` (tooltip "Default (no color)" + test). Superproject `6244b63b` on origin/main
  `4cfac4bf`: 4a28dd5d CHANGELOG + 6244b63b the single pointer bump. Gates on 2074a152: tsc/lint 0; jest 11708/1
  (warm); e2e 330/333 ok, 0 failed, 3 known-bug, coverage 176/176; lifecycle G-S1 1/1 (full 61/61 on 14513d4a; the
  delta is one tooltip string).
- 2026-11-13 r4 scoped re-review of the r3 delta, by the r2 reviewer (not the author).
- 2026-11-13 r4 DONE: LAND, no new findings (diff = the string + its test; superproject on origin/main 4cfac4bf,
  one bump to 2074a152, clean; conditions-modal jest 445/445).
- 2026-11-13 Result comment posted (3 images: before, after with Blue set, after Default pointer-away). No Scott ask
  (ticket allowed any fix). Ticket stays Awaiting until landing. LAND-READY reported to the dispatcher.
- 2026-11-13 LANDED by the dispatcher: dse develop `2074a152`, workspace main `8fc885a3` (ledger-preserve commit
  `019d804e`; worktree removed). Landed comment posted; state -> Done via linear-post.py `--state Done`,
  verified with get_issue (status Done, completedAt 2026-11-13T15:39:50Z).
