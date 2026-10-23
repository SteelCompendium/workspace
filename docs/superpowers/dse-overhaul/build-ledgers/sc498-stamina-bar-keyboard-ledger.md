# SC-498 decisions ledger

Ticket: SC-498 — Stamina bar cannot be opened from the keyboard (no tab stop, Enter/Space do nothing).
Worktree: /home/scott/code/steelCompendium/worktrees/sc498-stamina-bar-keyboard (every submodule on branch `sc498-stamina-bar-keyboard`), cut at dse develop `9f08f06`, superproject `6a176e6`.
Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05.

## Scott rulings (verbatim, dated)

None yet. The thread had no comments at start (2026-10-23). The ticket body (filed from the SC-492 review) states:

> **Expected:** the bar is one tab stop. Enter and Space open the Stamina modal, the same as a click. Focus has a visible ring.

> **Notes:** keyboard presses on chrome buttons inside the bar (the Edit pencil, the collapse button) must not also open the modal. SC-492 adds that guard for clicks; the keyboard path needs the same rule. Lifecycle G-S32 already drives the pencil by Enter and Space.

## Dispatcher constraints (2026-10-23, not Scott rulings)

- SC-495 (shared stepper focus) is in flight — keep scope to the bar's own focusability/activation.
- A visible focus ring must follow DESIGN.md's focus rule (Scott is colorblind — no hue-only cues). If the focus look is a design choice, post one clear ask with screenshots and park.
- If a lifecycle scenario is added, use id **G-S36**.
- Owner reports land-ready to the dispatcher and stops; the dispatcher lands.

## Owner rulings

- 2026-10-23: pipeline = implementer (r1) -> independent reviewer -> fix rounds -> scoped re-review -> land-ready.
- 2026-10-23: Ticket moved Backlog -> Awaiting.
- 2026-10-23: Focus-ring rule: DESIGN.md line 34 — the steel-teal accent "carries every link, active tab, focus ring". A ring is a shape cue (an outline around the bar), so it is not hue-only. If the plugin already has a focus-visible ring convention for clickable non-button elements, reuse it and this is NOT a design choice. Only if no convention exists, or the ring cannot be drawn without clipping/overlap with the bar's own visuals, does it go to Scott.
- 2026-10-23: r1 implementer dispatched (orchestration:implementer), brief sc498-brief-r1-impl.md. Scope fence: no stepper.ts / counter view.ts / stepper CSS+tests (SC-495), no FormModal.ts. Lifecycle id G-S36.
- 2026-10-23: r1 implementer DONE at dse `47449b6` (on 9f08f06), superproject `874700a`. Bar = tabindex 0 + role="group" + aria-label "Edit Stamina: 15 of 20, 5 temporary"; keydown only on the bar itself; ring reuses the kit's shared rule (2px solid --dse-focus-ring, offset 2px) + print removal. Gates: jest 5863/1/241 of 242 (+16), lifecycle 35/35 (G-S36, own fixture Lifecycle/stamina-keyboard.md), e2e 108/108 69/69, shots 592/0 FAIL, freeze 280/280, parity 0/0/24. Owner eyeballed focused-dark shot: 2px teal-cyan outline visible all round; chrome panel overlaps top-right edge.
- 2026-10-23: Focus look ruled NOT a design ask: it reuses the existing shared ring rule (DESIGN.md line 34), outline = shape cue.
- 2026-10-23: Initiative row bars opting out of the tab stop (keyboard:false; the row's numeric button already opens the modal) -> ACCEPTED, pending reviewer check that the numeric button is a visible tab stop in all row styles.
- 2026-10-23: Implementer follow-ups: (1) clickable cursor on a bar with no handler -> FOLD into fix round (same function, false affordance, no pixel change). (2) initiative Steel-row numeric button maybe an invisible tab stop -> reviewer probes; ticket if real and outside scope. (3) same accessible name on several bars -> DROP: one bar per hero sheet; revisit if Scott asks. (4) rectangular ring around rounded plate -> DROP: it is the shared ring rule, every kit element gets the same shape. (5) lifecycle collapsed-state carry-over -> DROP, informational (G-S36 uses its own fixture).
- 2026-10-23: r1 independent review dispatched (orchestration:reviewer) on 47449b6.
- 2026-10-23: r1 review LAND-READY on 47449b6: 0 HIGH / 0 MEDIUM / 2 LOW / 6 INFO; all gates re-run and matching; tests proven non-vacuous. Rulings:
  - LOW-1 (role="group" tab stop: screen reader says "group", no cue that Enter does anything) -> FOLD: keep `group`, add an `aria-description` such as "Press Enter or Space to open the Stamina editor", tested.
  - LOW-2 (G-S36 comment claims mouse click paints no ring but never asserts it) -> FOLD: add the assertion.
  - INFO-1 (chrome panel covers ~55px of the ring's top edge, hides nothing) -> DROP, acceptable.
  - INFO-2 (initiative numeric button is a real, visible-on-focus tab stop) -> DROP, no defect; confirms the keyboard:false ruling for initiative row bars.
  - INFO-3 (keyboard Collapse/Pin leave focus on body; predates SC-498) -> filed **SC-505** (Backlog, related SC-498/SC-492). OUT OF SCOPE here.
  - INFO-4 (StaminaBarPanel.ts:164-166 comment cites the removed Legacy theme) -> FOLD: reword to lead with "the chrome panel mounts inside the cluster plate".
  - INFO-5 (name casing "Edit Stamina" on bar vs "Edit stamina" on the initiative numeric button) -> FOLD: align the initiative button to "Edit Stamina" (Stamina is a capitalised game term), update its tests.
  - INFO-6 (Shift+Enter/Space open the modal, like a native button) -> DROP, matches native behaviour.
  - Implementer follow-up 1 (clickable cursor on a bar with no handler) -> FOLD as ruled above.
- 2026-10-23: Fix round 2 -> implementer (author) resumed; scoped re-review of the delta -> r1 reviewer.
- 2026-10-23: Fix round 2 DONE: dse `213f29b` (4fd6002 INFO-5, 124597e LOW-1/INFO-4/follow-up 1, 213f29b LOW-2), superproject `874700a` unchanged. jest 5864/1/241 of 242, lifecycle 35/35, e2e 108/108 69/69, shots 592/0 FAIL, freeze 280/280, parity 0/0/24. Note: the G-S36 no-ring-on-click assertion cannot fail today (click shield cancels mousedown focus); guard-only. Scoped re-review dispatched to the r1 reviewer.
- 2026-10-23: Dispatcher relay: dse develop 9f08f06 -> 66f474b (SC-489, FormModal.ts Save no longer applies field transforms to untouched values, plus tests). Land-ready must be on 66f474b or newer, superproject rebased onto origin/main. Base: jest 5859/1/241 of 242, lifecycle 34/34, e2e 108/108 0 known-bug 69/69, shots 592, freeze 280/280, parity 0/0/24. Expected with branch (+17 tests, no new suite): jest 5876/1/241 of 242, lifecycle 35/35. Plan: the re-review finishes on 213f29b, then rebase round r3 (implementer) with the full battery; the owner checks the range-diff.
- 2026-10-23: r2 scoped re-review LAND-READY on 213f29b: 0 HIGH/MEDIUM/LOW, 2 INFO. INFO-A (axe experimental focus-order-semantics still flags role=group) -> DROP, the accepted trade-off. INFO-B (G-S36 step 3 does not catch a :focus-visible -> :focus swap; jest pins the selector) -> DROP, covered. The LOW-2 assertion is proven to be a real guard by a mutation. Rebase round r3 -> implementer: onto dse 66f474b+ and superproject origin/main 6fd62f9+, full battery.
- 2026-10-23: Owner + implementer killed by session-limit 429 (~20:40Z) mid-r3. State found: dse e40b06c on 66f474b (clean), superproject 00135f3 on 6fd62f9 (pointer NOT committed, unstaged). Owner range-diff 9f08f06..213f29b vs 66f474b..e40b06c: all 7 commits `=`. Implementer resumed via SendMessage to run the full battery.
- 2026-10-23: Rebase round r3 DONE: dse `e40b06c` on origin/develop 66f474b (range-diff all 7 `=`), superproject `f45f3fb` on origin/main 29109b0 (CHANGELOG conflict with SC-489's bullet; both kept; pointer not committed). Gates (rc files 16:13-16:40, after the 16:11 rebase): tsc/lint clean, jest 5876/1/241 of 242, lifecycle 35/35, e2e 108/108 0 known-bug 69/69, shots 592/0 FAIL, freeze 280/280, parity 0/0/24. Land-ready comment posted; LAND-READY reported to the dispatcher.
- Landing bookkeeping for the dispatcher: update the dse-verify CURRENT block (numbers above, plus the new lifecycle scenario G-S36), and preserve this ledger to docs/superpowers/dse-overhaul/build-ledgers/sc498-stamina-bar-keyboard/.
- 2026-10-23: Dispatcher relay: SC-495 landed, dse develop 66f474b -> c98bd82 (shared stepper focus fix + e2e). Asks: (1) rebase dse onto c98bd82 and superproject onto origin/main; (2) DROP the .claude/skills/dse-verify/SKILL.md change from the superproject branch (dispatcher bookkeeping, edited at every landing); keep only the CHANGELOG commit; send the exact G-S36 lifecycle-row text to the dispatcher. Base on c98bd82: jest 5872/1/241 of 242, lifecycle 34/34, e2e 114/114 79/79, shots 592, freeze 280/280, parity 0/0/24. Expected with branch (+17 tests): jest 5889/1/241 of 242, lifecycle 35/35, e2e 114/114 0 known-bug 79/79. Rebase round r4 -> implementer.
- 2026-10-23: Rebase round r4 DONE: dse `b624eef` on origin/develop c98bd82 (no conflicts; range-diff 66f474b..e40b06c vs c98bd82..b624eef all 7 `=`). Superproject `e3e1fd6` = one CHANGELOG-only commit on origin/main 1add69e (SKILL.md change dropped). origin/main since moved to e4f81d3 (HANDOFF.md only, cannot conflict). Gates: tsc/lint clean, jest 5889/1/241 of 242, lifecycle 35/35, e2e 114/114 0 known-bug 79/79, shots 592/0 FAIL, freeze 280/280, parity 0/0/24. LAND-READY re-reported; G-S36 row text sent to the dispatcher.
