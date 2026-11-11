# SC-574 decisions ledger — minion pool modal: custom conditions + duplicate removal

Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05.
Worktree: `/home/scott/code/steelCompendium/worktrees/sc574-pool-modal-custom-conditions`
(every submodule on branch `sc574-pool-modal-custom-conditions`), cut from dse develop `6c7216e8`.

## Spec (ticket text, verbatim — no Scott comments on the thread as of 2026-11-11)

> Two small gaps in the minion pool modal's condition row:
>
> 1. A custom condition (one that isn't a built-in Draw Steel condition) shows no icon in the
>    modal, so you can't see it or remove it there. The initiative tracker shows a fallback icon
>    for it (SC-186).
> 2. If the same condition appears twice as plain text in the note, one click removes both copies.
>
> **Expected:** custom conditions show the same fallback icon as the tracker, and one click
> removes one copy.

Agent notes (ticket): `src/views/MinionStaminaPoolModal.ts:554-555` (registry-only lookup) and
`:572` (filter removes every match), at dse develop 6270e84a. At 6c7216e8 these are
`:642` (`getAnyConditionByKey` gate) and `:668` (`filter((entry) => entry !== conditionEntry)`).
Jest carries two `test.failing` markers in
`test/dom/views/minion-stamina-pool-modal-matrix.test.ts:1107,1117` for (a) and (b).

## Scott rulings

(none yet)

## Owner rulings

- 2026-11-11 — Scope boundary: SC-592 (removal rewrites the whole condition list in another
  format: strings become `{key: …}` objects, quotes dropped) is OUT of scope. Do not change the
  write-back format here.
- 2026-11-11 — No new lifecycle phases unless a worker shows jest + e2e cannot cover it; never
  extend G-S64 (part 3 is at the ~480 s line). Lifecycle id G-S84 reserved if needed.
- 2026-11-11 — e2e: no bracketed ticket id in any test title (the runner parses titles for
  scenario ids).

## Rounds

- r1 implementer — dispatched 2026-11-11.
- 2026-11-11 ~11:07 — Relay from SC-595 owner: its r4 implementer ran `rm -rf /tmp/dse-obsidian-lifecycle-*/`
  (kept FAIL dirs of other efforts gone). SC-574 impact checked: r1 implementer's five lifecycle
  parts had all finished green before then (21/21, 16/16, 9/9, 4/4, 4/4 = 54/54, last at 11:04);
  it was in `shots` at the time; SC-574 had no kept FAIL dirs. No re-run needed. Any later
  lifecycle FAIL on this effort that reports a missing vault → re-run before believing it.
- 2026-11-11 — Dispatcher: SC-578 landed; dse develop now `c3fd8323` (supersedes `6c7216e8`).
  New CURRENT: jest 7200 passed / 1 skipped · lifecycle 54/54 · e2e `260/265 ok, 0 failed,
  5 known-bug, coverage: 164/164 pairs` (known bugs SC-257, SC-355, SC-384, SC-580, SC-588) ·
  shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 ·
  parity 0/0/24. "Rebase onto c3fd8323 before you report land-ready." → r1 implementer told to
  rebase after its current gate and re-run the full battery on the rebased head. r1 pre-rebase
  commits: 146710b6 (fix), 3ab2c82a (e2e), 1657d776 (changelog). The reviewer brief's base and
  expected numbers must be updated to c3fd8323 before dispatch.
- 2026-11-11 — r1 implementer DONE: rebased head `580c9f84` on c3fd8323 (58ef7b8f fix, 11b849ff e2e
  POOL-C07/C08 + fixture `Initiative/squad-custom.md`, 580c9f84 changelog). Fallback icon =
  `FALLBACK_CONDITION_ICON` (`circle-dashed`, `src/elements/conditionDisplay.ts:14`); aria-label
  title-cased key. Gates: jest 7207/1 · lifecycle 54/54 · e2e 262/267 ok, 0 failed, 5 known-bug,
  164/164 · shots 592, 163/978, 39/234, clip 147 · freeze 280/280 · parity 0/0/24.
  Follow-up (Condition display-name field across modal/ConditionsModal/kit conditionIcons): DROP —
  speculative, no field exists; nothing to fix now.
  Owner doubt for review: ticket says "same fallback icon as the tracker" — implementer cites the
  Conditions modal helper; reviewer must confirm the initiative tracker renders the same icon
  (it mentions `src/framework/kit/conditionIcons.ts`).
- r1 reviewer — dispatched 2026-11-11 on `580c9f84`.
- 2026-11-11 — r1 reviewer: FIX-REQUIRED (HIGH 0, MED 1, LOW 1, INFO 5). Code correct; tracker
  fallback icon confirmed identical (`kit/conditionIcons.ts:55` own `circle-dashed` copy, each
  copy test-pinned). Report: `sc574-r1-reviewer-report.md`.
  Owner rulings on findings:
  - MED-1 (gap (b) never reproduces in the app — both parsers turn strings into fresh `{key}`
    objects; only the jsdom harness injected raw strings; CHANGELOG describes a symptom users never
    saw; C08 not a regression test): FOLD into r2 — reviewer's prescribed fixes 1-3, with C08
    RETARGETED at custom duplicates (`on-fire` / `on-fire`), which the old code got wrong in the
    app. Keep the position-based removal (defensive; type allows strings). Tell Scott in the
    closing comment that part 2 did not reproduce in the plugin (inform, no ask).
  - LOW-1 (`matrix.test.ts:1165` passes on old code): FOLD — use the same object reference twice.
  - INFO-1 (aria-label "Remove X" vs tracker "Remove condition: X"): DROP — pre-existing, SC-572
    chose the Conditions modal wording; ticket asks for the icon only.
  - INFO-2 (whitespace-only key → button named "Remove "): DROP — needs a hand-written
    whitespace-only key; the tracker behaves the same; not worth a ticket.
  - INFO-3 / INFO-4: DROP — unreachable in the app (parse throws on keyless; detached icons
    unreachable by pointer/keyboard).
- r2 implementer fix round — dispatched 2026-11-11 (resume of r1 implementer).
- 2026-11-11 — r2 implementer DONE: head `ec26b709` (src unchanged vs 580c9f84). jest 7207/1, e2e
  262/267 ok, 0 failed, 5 known-bug, 164/164. Mutations: identity filter → 4 jest fail incl.
  LOW-1; whole src reverted → C08 fails at first conditionNames(). Lifecycle/shots/freeze/parity
  carry from 580c9f84.
- r2 scoped re-review (r1 reviewer resumed) — dispatched 2026-11-11 on 580c9f84..ec26b709.
- 2026-11-11 — r2 re-review: LAND-READY, no new findings (jest 7207/1; e2e 262/267 ok, 0 failed,
  5 known-bug, 164/164). Result comment posted (no ask; state left Awaiting). Reported land-ready
  to dispatcher: dse `ec26b709` on develop `c3fd8323`. After landing: set Done via
  `linear-post.py --state Done` and verify.
- 2026-11-11 — LANDED by dispatcher: dse develop `ec26b709` (c3fd8323..ec26b709), workspace main
  `f18fb885` (pointer bump 4b5185b1; bookkeeping 1697cd45). Ledger preserved at
  `docs/superpowers/dse-overhaul/build-ledgers/sc574-pool-modal-custom-conditions/`. Landed comment
  posted; SC-574 set Done via linear-post.py `--state Done`, verified via get_issue (status Done,
  completedAt 2026-11-11T17:27:01Z). Effort closed.
