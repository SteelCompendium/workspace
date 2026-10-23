# SC-495 decisions ledger — Stepper: keyboard focus lost when "−"/"+" disables itself at its limit

Ticket: https://linear.app/tski-home/issue/SC-495
Worktree: /home/scott/code/steelCompendium/worktrees/sc495-stepper-focus (every submodule on branch `sc495-stepper-focus`)
Repo touched: draw-steel-elements (tracked branch `develop`, cut at `53e1e48`); superproject (CHANGELOG) cut at `06c068c`.
Precedent: docs/superpowers/dse-overhaul/build-ledgers/sc465-heal-focus-ledger.md (SC-465, same pattern, Stamina modal heal buttons).
In flight elsewhere (do not touch): SC-492 (stamina bar pencil), SC-489 (FormModal).

## Spec (ticket description, verbatim, 2026-10-23)

> Found during SC-465 (implementer survey). Not reproduced in e2e yet.
>
> **Repro (expected):** Tab to a stepper's "−" button, press it until the value reaches its minimum (for example the Stamina modal's Temporary Stamina at 0). The button disables while it holds focus, and focus drops to the document body. The next Tab starts from the top of the page. The same applies to "+" at a maximum.
>
> **Where:** the shared kit stepper, `src/framework/kit/stepper.ts` `render()` (~:175-176), which sets `disabled` on "−"/"+" at the bounds. It is used on many surfaces, so the fix belongs in the kit, not in one modal.
>
> **Fix shape:** the SC-428 and SC-465 rule. When the focused button disables itself, move focus to a neighbouring enabled control (for a stepper, the value input is the natural target) with `preventScroll`. Add an e2e scenario with real keys.
>
> **Note from the SC-465 review:** SC-465 added a local helper `focusNeighbourStop` in `src/views/StaminaEditModal.ts` (~:244-258). If it is moved to the kit and reused here, harden its selector: the `[tabindex]` part would accept a disabled button that carries a tabindex, which cannot take focus.

## Scott rulings (verbatim, dated)

(none — Backlog ticket filed by the SC-465 owner; thread had 0 comments at 2026-10-23 start)

## Owner decisions

- 2026-10-23: Pipeline = implementer (r1) -> independent reviewer -> fix rounds -> scoped re-review -> land-ready. Focus-only behaviour; no Scott evidence round unless the value-node focus ring turns out to need a new visible style (then one screenshot ask).
- 2026-10-23: FOCUS TARGET RULE. Only when the button being disabled holds focus (`document.activeElement === btn`) at the moment `render()` disables it:
  - editable stepper -> the value `<input>` (the ticket's fix shape).
  - read-only stepper (no input) -> the value node `.dse-stepper__value`, made programmatically focusable with `tabindex="-1"` (stays OUT of the Tab order, so the Tab sequence of every surface is unchanged). The next Tab then lands on the enabled opposite button.
  - NEVER the opposite button. Reason: Enter auto-repeats on keydown, so a held Enter would click the opposite button and ping-pong the value back and forth; one extra Space/Enter press would undo the user's last step.
  - ~~`{ preventScroll: true }`; ring follows the input that caused it (keyboard -> `focusVisible: true`, pointer -> false), same handoff as SC-465 / adoptView.~~ superseded 2026-10-23 (r1 review MEDIUM-1) by: KEYBOARD press only (~~the button was `:focus-visible` before it disabled~~ superseded 2026-10-23 r2-review LOW-A by: the activating click event has `detail === 0`) -> move with `{ preventScroll: true, focusVisible: true }`. POINTER press (not `:focus-visible`) -> move NOTHING (base behaviour), for editable and read-only steppers alike.
  - min === max (both buttons disabled): same target (input / value node).
  - A disable caused by setValue/typed commit while focus is elsewhere moves nothing.
- 2026-10-23: SC-465's `focusNeighbourStop` stays where it is (StaminaEditModal.ts); NOT moved to the kit, so the ticket's selector-hardening note does not apply. No StaminaEditModal refactor in this ticket.
- 2026-10-23: Tests: jest (kit unit, incl. both bounds, editable + read-only, pointer vs keyboard ring, no-move-when-unfocused, min===max) + e2e with real keys on (a) the Stamina modal Temporary Stamina "−" to 0 and (b) one in-note stepper whose press writes the note and redraws (adopted) — after the write focus is still inside the stepper and the next Tab lands on the opposite button. If e2e cannot drive an in-note stepper write, add lifecycle scenario G-S35 instead.
- 2026-10-23: Targets: tsc/lint clean; jest 5840+new passed / 1 skipped / 240 (or 241 if a new suite) of N; lifecycle 33/33 (34/34 if G-S35); e2e 108+new ok, 0 failed, 0 known-bug, coverage Y/Y (69/69 unless a new pair is driven — report any change); shots 592, 0 FAIL; freeze 280/280; parity 0/0/24.

## Round log

- 2026-10-23: worktree created (rc 0). dse origin/develop 53e1e48, superproject 06c068c.
- 2026-10-23 r1: implementer A (orchestration:implementer, agent ac7d30878b1bdc7de) dispatched on `sc495-brief-r1-impl.md`. A never reviews; review goes to reviewer B (orchestration:reviewer). Ticket Backlog -> Awaiting.
- 2026-10-23 ~15:06Z: owner + implementer A killed by session-limit 429 mid-r1. State at 17:11Z: dse 53e1e48, one uncommitted file (test/dom/kit/stepper.test.ts), no live processes. Pre-kill gate logs not counted. A resumed via SendMessage (dispatcher instruction); dse develop still 53e1e48.
- 2026-10-23 dispatcher: dse develop 53e1e48 -> 9f08f06 (SC-492 landed: click guard in src/framework/kit/StaminaBarPanel.ts + lifecycle G-S32). New baselines: jest 5847 / 1 skipped / 241 of 242; lifecycle 34/34; e2e 108/108, 0 known-bug, 69/69; shots 592; freeze 280/280; parity 0/0/24. Land-ready must be on 9f08f06+ with the superproject rebased onto origin/main. Owner: told A (mid-r1) to rebase onto 9f08f06 before its final battery. Updated r1 targets: jest 5847+new / 1 / 241 (242 if new suite) of 242(+); lifecycle 34/34 (35/35 with G-S35); e2e 108+new, 0 failed, 0 known-bug, Y/Y.
- 2026-10-23 r1 DONE (A): dse 247bd27 (c1f65e0 fix+jest+CSS, 247bd27 e2e) on 9f08f06; superproject 64464bf (CHANGELOG) on origin/main 6a176e6, one CHANGELOG conflict with SC-492's bullet resolved by hand (both kept, SC-495 first). Gates on final head: tsc/lint clean; jest 5859/1/241 of 242 (+12); lifecycle 34/34 (no G-S35 needed); e2e 112/112 ok, 0 failed, 0 known-bug, 73/73 (+4 tests STAM-SF01-03, CTR-F01; +4 pairs; ds-counter stepper gained control 'counter' + manifest counter.ts + fixture Counter/counter.md); shots 592 0 FAIL; freeze 280/280; parity 0/0/24. Red evidence: 10/12 jest red on unfixed, 4/4 e2e red with stepper.ts reverted. CSS: `.dse-stepper__value:focus-visible` joined to the kit's shared focus-ring rule, no new token. Owner eyeballed ring-malice.png: the existing kit ring outlines the value box -> reuses the existing style, so NO Scott screenshot ask (per the 2026-10-23 decision).
  Owner rulings on A's follow-ups:
  - No shipped in-note bounded READ-ONLY stepper exercised in e2e (Malice unbounded; roll element not rendered in e2e vault) -> reviewer B to find a bounded read-only stepper surface and probe it in real Obsidian; if one is drivable, FOLD an e2e test into r2; if none, DROP (jest + ring probe cover it).
  - Mouse click on a read-only value node now focuses it (no ring) -> DROP, harmless.
- 2026-10-23 r1 review: reviewer B (orchestration:reviewer, agent a877526bb2bd0bd7e) dispatched on `sc495-brief-r1-review.md`.
- 2026-10-23 r1 review DONE (B): APPROVE_WITH_FIXES, 0 CRIT/HIGH, 1 MED, 2 LOW, 6 INFO. B measured on 247bd27: tsc/lint clean; jest 5859/1/241 of 242; lifecycle 34/34; e2e 112/112 ok, 0 failed, 0 known-bug, 73/73; shots 592 0 FAIL; freeze 280/280 (parity not run). 9/9 mutations red in at least one layer; M3 (drop tabindex -1) and M7 (drop CSS) caught by jest only. Probes: held Enter no bounce on all stepper kinds; Tab order identical to base on 3 surfaces; no spurious writes. Finding: on Obsidian 1.14.4 the base bug's next Tab did NOT restart at the top of the page (it continued from the button's position); the real symptoms were focus on <body>, ring gone, Enter/Space doing nothing.
  Owner rulings:
  - MEDIUM-1 (pointer press at a bound focuses the Stamina modal's number input; mouse wheel then changes the pending value, 0 -> 2; Android tap may raise the soft keyboard) -> FOLD into r2 with option (a): pointer press moves nothing (base behaviour), for every stepper. Rule amended above. Update STAM-SF03 + jest pointer tests; SF03 adds the wheel check (red on 247bd27).
  - LOW-1 (CHANGELOG names Malice, which has no bounds; misdescribes the old symptom) -> FOLD: reword per B's prescribed text; name Edges/Banes.
  - LOW-2 (no real-Obsidian read-only test) -> FOLD (per the earlier ruling; it is drivable): ds-feature + `rollingEnabled: true`, roll bar Edges to 0 and Banes to 9 with keys; control ids `roll.edges`/`roll.banes` (+ whatever ids the census/manifest gate requires on that surface, attributes only); manifest `e2e/manifest/roll-bar.ts`; must catch M3 and M7 in e2e.
  - INFO-1 held-Enter test -> DROP (M2 already caught by every focus assertion; B probed no bounce).
  - INFO-2 "next Tab lands on the opposite button" true only for "−" at min -> DROP, natural order (ledger wording noted).
  - INFO-3 counter only partly registered in manifest/census -> DROP, minimal fixture surface by design, passes the gate.
  - INFO-4 third copy of the `:focus-visible` read -> DROP, a dedupe across StaminaEditModal/adoptView is out of scope and not worth a ticket.
  - INFO-5, INFO-6 -> DROP, follow the rule / no worse than base.
- 2026-10-23 r2: resume implementer A on `sc495-brief-r2-fix.md`. Scoped re-review of the delta -> reviewer B.
- 2026-10-23 r2 DONE (A): dse c4b51ce (58221aa MEDIUM-1 fix + jest + SF03 wheel check; c4b51ce ROLL-SF01 e2e + attribute-only ids roll.launch/roll.modifiers/roll.edges/roll.banes + manifest roll-bar.ts + fixture Feature/feature.md) on 9f08f06 (unmoved). Superproject 4cd1e12 (reworded CHANGELOG) on origin/main 3c7f392 (moved from 6a176e6; rebased, no conflict). Gates on c4b51ce: tsc/lint clean; jest 5859/1/241 of 242; lifecycle 34/34; e2e 113/113 ok, 0 failed, 0 known-bug, 77/77; shots 592 0 FAIL; freeze 280/280; parity 0/0/24. Red evidence: SF03 red on 247bd27 (focus, and wheel-only value 3); ROLL-SF01 red with tabindex removed and with the CSS rule removed.
  A's follow-up: `roll.launch` repeats on every effect's launch button in a multi-roll feature; ds-roll's bar now carries the ids too -> reviewer B to judge whether duplicate control ids break any e2e/census/coverage assumption; DROP if harmless, else FOLD a fix (e.g. stamp only where unique).
- 2026-10-23 r2 scoped re-review: reviewer B resumed on `sc495-brief-r2-rereview.md`.
- 2026-10-23 r2 re-review DONE (B): APPROVE_WITH_FIXES, 0 CRIT/HIGH/MED, 2 LOW, 3 INFO. B measured on c4b51ce: tsc/lint clean; jest 5859/1/241 of 242 (first run had 1 load-induced timeout in the unrelated SC-485 initiative-default-keys test; file alone 25/25, full re-run green); e2e 113/113 ok, 0 failed, 0 known-bug, 77/77. MEDIUM-1, LOW-1, LOW-2 confirmed fixed (M3/M7 red in ROLL-SF01); setPrefs does not leak; no scope creep.
  Owner rulings:
  - LOW-A (in a note, a keyboard-focused "−" then MOUSE-clicked to its bound still moves focus into the input with the ring, because the click shield keeps :focus-visible; wheel then changes the number and blur writes it) -> FOLD into r3: decide keyboard from the click event (`MouseEvent.detail === 0`), per B's prescription. Rule amended above. Jest pointer cases dispatch `detail: 1`; e2e step: tab to counter "−", mouse-click it to 0, assert no focus move, no wheel change, no write.
  - LOW-B (ROLL-SF01 never drives a read-only "−" to min) -> FOLD: Edges "−" Enter x9 to 0, ring on `roll.edges.value`, Tab to `roll.edges.inc`; manifest row `roll.edges.dec press:Enter` (coverage 78/78).
  - INFO-1 duplicate roll.launch / roll.* ids on ds-roll -> DROP, harmless (driver takes first match or {nth}; coverage counts pairs; censuses don't cover these surfaces; precedent init.cell.stamina x3).
  - INFO-2, INFO-3 -> DROP, confirmations.
- 2026-10-23 r3: resume implementer A on `sc495-brief-r3-fix.md`. Scoped re-review of the delta -> reviewer B.
- 2026-10-23 r3 DONE (A): dse c909c54 (489407b LOW-A fix + jest + CTR-F02; 55a1bb8 LOW-B ROLL-SF01 Edges to 0; c909c54 counter.dec click manifest row) on 9f08f06 (unmoved). Superproject 4cd1e12 unchanged on origin/main 3c7f392. Gates on c909c54: tsc/lint clean; jest 5860/1/241 of 242; lifecycle 34/34; e2e 114/114 ok, 0 failed, 0 known-bug, 79/79 (first run exited 1 on the coverage gate for the missing counter.dec click row; row added, re-run green); shots 592 0 FAIL; freeze 280/280; parity 0/0/24. Red evidence: 3 jest + CTR-F02 red on c4b51ce.
- 2026-10-23 r3 scoped re-review: reviewer B resumed on `sc495-brief-r3-rereview.md`.
- 2026-10-23 dispatcher: dse develop 9f08f06 -> 66f474b (SC-489 landed: src/authoring/FormModal.ts Save no longer applies field transforms to untouched values, plus tests). Baselines at 66f474b: jest 5859/1/241 of 242; lifecycle 34/34; e2e 108/108, 0 known-bug, 69/69; shots 592; freeze 280/280; parity 0/0/24. Land-ready must be on 66f474b+ with the superproject rebased onto origin/main.
  Owner plan: let B's r3 scoped re-review finish on c909c54 (a rebase under its running gates would invalidate them). Then r4 = rebase round by A (`sc495-brief-r4-rebase.md`), full battery. Expected: jest 5872/1/241 of 242 (5859 + our 13); lifecycle 34/34; e2e 114/114, 0 failed, 0 known-bug, 79/79 (69 + our 10); shots 592; freeze 280/280; parity 0/0/24. Zero conflicts -> no re-review; any hand-resolved conflict in src/ or test/ -> scoped range-diff check by B.
- 2026-10-23 r3 re-review DONE (B): APPROVE, 0 CRIT/HIGH/MED/LOW, 2 INFO (confirmations) -> DROP. B measured on c909c54: tsc/lint clean; jest 5860/1/241 of 242; e2e 114/114 ok, 0 failed, 0 known-bug, 79/79. LOW-A and LOW-B closed; CTR-F02 red with the r2 stepper. No programmatic `.click()` in src/ or main.ts; detail-0 clicks otherwise come only from assistive tech (moving focus is right for them).
- 2026-10-23 r4: resume implementer A on `sc495-brief-r4-rebase.md` (rebase onto 66f474b + origin/main, full battery).
- 2026-10-23 ~20:40Z: owner + implementer A killed by session-limit 429 mid-r4. State at 22:12Z: dse rebased to c98bd82 (tree clean), superproject 3cd4fb5 on 6fd62f9, no live processes. Pre-kill gate logs not counted. A resumed via SendMessage (dispatcher instruction); dse develop still 66f474b.
- 2026-10-23 r4 DONE (A): dse c98bd82 (7 SC-495 commits, same content) on origin/develop 66f474b, zero conflicts, no npm ci needed. Superproject 0bc6b50 (2ca7c32, 0bc6b50) on origin/main 29109b0 (moved twice during the round, handoff-only; CHANGELOG auto-merged, our bullet placed by context, not first — cosmetic). Battery ran on c98bd82 before the 20:40Z kill; A did not re-run after resume. Owner verified instead: every gate log in sc495-r4-impl-k9t5/final/ postdates the final dse commit (16:11:40 local), each has rc 0, dse tree clean and HEAD unchanged since -> counted. Gates: tsc/lint clean; jest 5872/1/241 of 242 (both runs); lifecycle 34/34; e2e 114/114 ok, 0 failed, 0 known-bug, 79/79; shots 592; freeze 280/280; parity 0/0/24. Both heads fast-forward from origin; no live processes.
- 2026-10-23: land-ready comment posted (`sc495-comment-landready.md`, model opus-5.5); reported LAND-READY to dispatcher. Ticket stays Awaiting (no Scott ask).
