# SC-338 decisions ledger — DSE option chips (.dse-optchip) keyboard focus ring

Worktree: /home/scott/code/steelCompendium/worktrees/sc338-chip-focus (every submodule on branch `sc338-chip-focus`)
DSE tracked branch: `develop`. Base at start: origin/develop `6c4f6aa` (SC-282 landed on c524fd2).
Freeze baseline at start: 260 lines (`freeze OK (260/260 …)`).

## Scott rulings (verbatim, dated)

- 2026-09-27, Scott, comment 7cf380dc-d4eb-419d-9265-697347fba4a4, answering the 2026-09-24 ask ("(1) Does the new keyboard
  focus ring look right? (2) Is it OK that unselected chips lose Obsidian's grey drop shadow?"), verbatim:
  > 1.  yes
  > 2. yes
  => focus ring approved as shipped; rest-state drop-shadow removal on unpressed chips approved (keep `box-shadow: none`
  unqualified, do NOT narrow to :focus-visible). No rebaseline sanction was asked or given (none needed).

## Ticket text (Scott-filed description, 2026-09-23, verbatim excerpt)

> **Likely fix:** add `.dse-optchip:focus-visible` to that shared rule (and consider whether the chips
> should ride `kit/iconButton` like every other button, per the SC-205 host re-grounding). The
> real-Obsidian camera's new modal focus-ring check (SC-334) currently skips the montage form because
> its focused chip "draws no outline" — once fixed, that check covers it for free.

## Session operating constraints (from dispatcher, 2026-09-24 — not Scott rulings)

- Do NOT land; report LAND-READY or PARKED-NEEDS-REVIEW. Any visual change -> one consolidated Needs Review ask.
- No tags/releases/RCs on draw-steel-elements. Never touch DSE `main`. No `just deploy*`.
- No freeze-baseline change without Scott's written sanction on the ticket.
- Never edit the main checkout.

## Owner rulings (ticket-owner, 2026-09-24)

- R1 scope: minimal fix — chips join the shared kit focus ring (`outline: 2px solid var(--dse-focus-ring); outline-offset: 2px`).
  The ring must be visible on BOTH pressed and unpressed chips, and Obsidian's host `button:focus-visible`
  box-shadow ring must not stack underneath it (mirror however the other plugin buttons already neutralize it).
  Moving chips onto `kit/iconButton` is NOT in scope for round 1; implementer reports cost/fit as a Follow-up and the owner rules.
- R2 the SC-334 camera skip for `modal-montage-edit` ("focused control draws no outline") must stop skipping —
  the check must actually run on the montage form's focused chip.
- R3 a visual change (focus ring on chips) -> Scott's eye; evidence = before/after crops of a keyboard-focused
  chip, pressed + unpressed, dark + light, from real Obsidian where possible.

## Round log

- 2026-09-24 r1 impl (implementer): dse `7177033`, superproject worktree `74a71c7`. Gates green (jest 3997/1 skip/206 of 207;
  shots 524 0 FAIL; freeze 260/260; parity 0/0/16; lifecycle 6/6; camera modal-montage-edit now runs the ring check).
- Owner rulings on r1 follow-ups (2026-09-24):
  - F1 kit/iconButton migration -> DROP: iconButton's pressed state is a solid accent fill, the chip's is a border-all-around
    (DESIGN.md rule 7); migrating is a redesign, not a fix. Mentioned to Scott below the fold of the review ask.
  - F2 host-leak sweep never mounts modal-only buttons -> FILED SC-356 (Backlog, related to SC-338). Out of scope here.
- Incident: r1 implementer ran an unscoped `pkill -f "npm run shots"` ~17:12–17:20 ET; may have killed SC-243's shots run.
  Relayed to dispatcher. Every later brief says: never pkill by pattern.
- 2026-09-24 r1 review dispatched (reviewer, fresh identity).
- 2026-09-24 r1 review (reviewer): APPROVE-WITH-NITS; gates re-run green (jest 3997/1/206 of 207 on 2nd run; freeze 260/260; parity 0/0/16;
  shots 524 0 FAIL; host-leak 114/684; lifecycle 6/6; camera modal-montage-edit ring checked). Report sc338-r1-review-report.md.
- Owner rulings on r1 review (2026-09-24):
  - MEDIUM-1 (the `box-shadow: none` entry also strips Obsidian's drop shadow / light-mode double border from UNPRESSED chips at
    rest + hover) -> KEEP the fix as-is (matches every other plugin button under SC-203/SC-205 host re-grounding) but it is a
    visible rest-state change: add labeled rest-state before/after to Scott's ask, with the narrow-to-:focus-visible alternative
    offered; add a CHANGELOG clause. Scott's call.
  - LOW-1 -> FOLD: dse-verify note states numbers inline; host-leak line 111/666 -> 114/684.
  - LOW-2 -> FOLD (no code): the "fits inside the 4px padding" claim is wrong — the focused chip is 46px/62.8px inside the body
    edges; the padding regression is caught by `modal-montage-limits`, not `modal-montage-edit`. Report addendum corrects it.
  - INFO-1 jest flake sidebarInitiative.test.ts:350 -> FILED SC-360 (Backlog). Out of scope.
  - INFO-3 chips take height/bg/text from Obsidian -> appended to SC-356. Out of scope.
  - ~~INFO-4 `.dse-swatch` (Conditions color swatches) has the same focus defect -> FOLD into this ticket (same modal, same fix
    shape); its evidence joins Scott's one ask.~~ superseded by R-r3 below (2026-09-24).
  - INFO-2, INFO-5, INFO-6 -> no action.
- 2026-09-24 r2 fix (implementer): dse `1170822`, superproject `49028fc`. Gates green (jest 3997/1/206 of 207; freeze 260/260;
  parity 0/0/16; host-leak 114/684; lifecycle 6/6; camera edit+limits ok).
- Owner ruling R-r3 (2026-09-24): the swatch fold FAILED on evidence (evidence-r2/sc338-grid-swatch.png): the pressed swatch
  is already `outline: 2px solid var(--dse-accent); outline-offset: 2px` = the kit ring's exact geometry and (per theme) colour,
  so after r2 a focused UNPRESSED swatch looks identical to a PRESSED one, and pressed+focused still == pressed+unfocused.
  That is worse than base. -> REVERT every `.dse-swatch` change (CSS both hunks, guard-test assertions, CHANGELOG mention,
  dse-verify mention) out of SC-338. Swatch focus design split to SC-361 (Backlog). SC-338 = chips only.
  Keep r2's MEDIUM-1 CHANGELOG clause (chips' rest drop shadow), LOW-1 and LOW-2 fixes.
- 2026-09-24 r3 (implementer): dse `a756ec1` swatch revert, superproject `00ada4b`; r3b dse `c19069a` comment trim (comment-only).
  Gates r3: full battery green (freeze 260/260, parity 0/0/16, host-leak 114/684, camera edit+limits ok). r3b: tsc/lint/jest green (2nd run; SC-360 flake on 1st).
- 2026-09-24 scoped re-review of 7177033..c19069a dispatched to the r1 reviewer identity (not an author).
- 2026-09-24 scoped re-review: APPROVE on c19069a (full battery green incl. freeze 260/260, parity 0/0/16, camera ok; render byte-identical to r1).
  Owner rulings: LOW-1 (dse-verify still narrates swatch rounds) FOLD; INFO-1 stale line pointers FOLD; INFO-2 light-rest wording FOLD.
  Round 3c = comments/docs only -> owner self-reviews the diff (infra/docs-only exception), no further worker review.
- 2026-09-24 r3c (implementer): dse `c3d36c5`, superproject `28a155d` — comments/docs only; owner self-reviewed diff: OK.
  jest green on re-run (1st run flaked sidebarEncounterHandoff.test.ts:416 under load -> appended to SC-360).
  origin/develop still 6c4f6aa at 2026-09-24 final check. Final: dse c3d36c5 / superproject 28a155d.
- 2026-09-24 Needs Review ask posted to Scott: (1) focus ring look, (2) rest-state drop-shadow loss on unpressed chips
  (alternative: narrow the box-shadow opt-out to :focus-visible only).
- 2026-09-27 resumed after Scott's ruling. origin/develop now `825ea51` (SC-243, SC-230, SC-272, SC-236, SC-255, SC-231, SC-284
  landed). Freeze 260 lines (~89 hashes rebaselined by others' sanctions); lifecycle now 19 scenarios; parity 16 declared.
  Round 4 = rebase dse onto 825ea51 + superproject worktree onto origin/main, full battery. No code change.
- 2026-09-27 r4 (implementer): dse `afd6ae3` on origin/develop `825ea51`; superproject `efc6020` on origin/main `601b44a`.
  Full battery green: jest 4112/1 skip/211 of 212; lifecycle 19/19; shots 532 0 FAIL, host-leak 114/684; freeze 260/260;
  parity 0/0/16; camera edit+limits ok. Chip crops md5-identical to r1. No rebaseline. LAND-READY reported to dispatcher.
