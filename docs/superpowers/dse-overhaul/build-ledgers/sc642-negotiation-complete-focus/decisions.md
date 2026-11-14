# SC-642 decisions ledger — Negotiation: pressing Complete Argument with Enter drops keyboard focus out of the card

Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05
Worktree: /home/scott/code/steelCompendium/worktrees/sc642-negotiation-complete-focus
  (superproject at workspace origin/main ea6b4582; dse branch sc642-negotiation-complete-focus @ develop 12aaf5b5)
Lifecycle id reserved if needed: G-S134

## Ticket requirement (from the SC-642 description, 2026-11-14 — no comments on the ticket yet)

> **What happens:** on a negotiation's Argument tab, Tab to Complete Argument and press Enter. The argument is
> recorded, but keyboard focus leaves the card: the next Tab does not continue inside the negotiation.
>
> It happens in both Reading view and Live Preview (focus ends on the page body in each).
>
> **Expected:** focus stays on the card (for example on the first control of the next argument, or on the button
> itself).
>
> A sibling of SC-639 (focus lost after Reset). The cause may differ: Complete Argument disables the button it was
> pressed on, and Chromium moves focus off a button that becomes disabled.

Agent notes (ticket): real-Obsidian only — jsdom keeps the disabled button as `document.activeElement`, so there is
no jsdom twin. Surface: `src/drawSteelAdmonition/negotiation/ArgumentView.ts` (Complete Argument handler).

Markers to flip to plain tests: e2e `[NEGO-F02]` (`e2e/specs/negotiation/focus.e2e.ts`, Reading view) and
`[NEGO-L02]` (`e2e/specs/negotiation/live-preview.e2e.ts`, Live Preview).

## Scott rulings

(none yet)

## Owner decisions

- 2026-11-14: No decision needed from Scott up front — the ticket states the expected behaviour and offers two
  acceptable landing spots. The implementer picks the landing control (prefer one that continues the flow: the
  next argument's first usable control; else the nearest usable control in the Argument tab), documents it, and the
  closing comment names it so Scott can redirect. Same pattern as SC-626's mappings.
- 2026-11-14: Prior-art rule (SC-614 / SC-585 / SC-613 / SC-626): focus is moved only when it was inside the card
  before the action; a write with focus elsewhere (outside edit, re-render with focus outside) never pulls focus in.
- 2026-11-14: Reuse the shared kit helper `src/framework/kit/controlFocus.ts` (SC-626's capture/restore/fallbacks),
  and keep the fix reusable for SC-639 (Reset drops focus) which is queued next. Do NOT fix Reset here, and stay out
  of `src/model/NegotiationData.ts` and the Reset path (SC-641 is parked on Scott and will touch both). If SC-639's
  markers (`NEGO-F01`, `NEGO-L03`, jsdom `K05`) turn green as a side effect, stop and report (NEEDS_CONTEXT).

## Rounds

- r1 implementer (Sonnet, agent a52d291724f4e8bcc): brief sc642-brief-r1-implementer.md. Dispatched 2026-11-14.
- 2026-11-14: Ticket moved Backlog -> Awaiting (save_issue by state NAME no-op'd silently; by state ID 0c054d70 it took).
- r2 reviewer brief drafted (sc642-brief-r2-reviewer.md, placeholders filled after r1).
- 2026-11-14: r1 DONE on dse 01af056d (fix d9fadf8d, tests 01af056d; on 12aaf5b5). Mechanism: Chromium focus fixup blurs the
  disabled Complete button ~13-19 ms after the press (RV + LP), before the debounced write; no rebuild. Fix: kit
  `restoreControlFocus(..., { fromDisabled: true })` + negotiation `focusRules.ts` fallbacks. Gates: jest 13041/2 fresh;
  lifecycle 64/64; e2e 582/601 ok, 0 failed, 19 known-bug, 416/416; shots 592/163/978/40/240/147; freeze 280/280; parity 0/0/24.
  Survey: 9 other negotiation controls keep focus already. SC-639 markers still known-bug.
  Owner ruling — mapping: ACCEPT Complete -> first Motivation appeal chip (else first Pitfall chip, else the Lie box, else
  the card root). It is the ticket's "first control of the next argument". Name it in the closing comment so Scott can redirect.
  Mouse press also hands focus to the chip (no ring): reviewer to judge; owner lean is acceptable (base leaves it on body).
  Stray file from r1: /tmp/claude-1000/-home-scott/code/steelCompendium/workspace/placeholder — harmless, leave it.
- r2 reviewer (Opus): brief sc642-brief-r2-reviewer.md, head 01af056d.
- 2026-11-14: Dispatcher: new baseline — SC-628 landed; dse develop 10c271fe, workspace main 430dd30b. Numbers at 10c271fe:
  jest 13307 passed / 2 skipped fresh · lifecycle 64/64 · e2e `585/604 ok, 0 failed, 19 known-bug, coverage: 416/416 pairs`
  · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.
  Must rebase dse onto 10c271fe and superproject onto current workspace main (CHANGELOG commit + ONE pointer bump) before
  land-ready. Owner: SC-628's 11 files (montage model/tests) do not overlap any SC-642 file (checked
  `git diff --name-only 12aaf5b5..10c271fe`). r2 review continues on 01af056d undisturbed; the rebase goes into the
  r3 round (fix findings + rebase + full battery), then a scoped re-review of the delta.
  Expected after rebase: jest 13316 / 2 fresh (13307 + 9); e2e `591/608 ok, 0 failed, 17 known-bug, coverage: 416/416`
  (585+6 / 604+4; known-bug 19-2).
- 2026-11-14: r2 reviewer (Opus, agent a50ec1ddbaa364c13) LAND on 01af056d: 0 CRIT / 0 HIGH / 0 MED / 5 LOW / 6 INFO.
  Battery re-run matches r1 (jest 13042/1 cached; lifecycle 64/64; e2e 582/601, 0 failed, 19 known-bug, 416/416; shots
  592/163/978/40/240/147; freeze 280/280; parity 0/0/24). Vacuity: 5/9 jsdom red (4 negatives by nature), 4/4 e2e
  positives red. Mutants 8 run, 6 killed (M3 no LP carry rules, M6 ring always on survive). 17 real-Obsidian probes:
  focus always lands in the pressed card; note bytes identical to base for Complete alone.
  Owner rulings:
  - LOW-1 (comments say "next frame"; the blur is synchronous inside the click dispatch, 2-3 ms; `fromDisabled` only
    matters in jsdom) -> FOLD: correct the comments at controlFocus.ts:26-28, :98-100, focusRules.ts:5,
    focus.e2e.ts:27-28, controlFocus.test.ts:236. Keep `fromDisabled` (jsdom needs it; M4 kills 4 jsdom tests).
  - LOW-2 (comments claim a pointer press focuses the button; the click shield cancels pointerdown/mousedown, so a
    mouse press moves no focus, as on base) -> FOLD: correct focus.e2e.ts:61 and live-preview.e2e.ts:60. No
    keyboard-only gate.
  - LOW-3 (a quick second Enter toggles the first Motivation chip -> `motivationsUsed: [Higher Authority]`) -> ACCEPT as a
    consequence of the landing; name it in the closing comment (one more Enter undoes it).
  - LOW-4 (the chip can land off-screen in a pane shorter than ~450 px: `preventScroll: true`, focusHandoff.ts:49) ->
    FOLD as an opt-in for this hand-off only: scroll the landing control into view with `block: 'nearest'` (no scroll
    when it is already visible); other elements' behaviour unchanged; jsdom test pins it.
  - LOW-5 (`NegotiationView.controlFocusRules()` view.ts:51-54 untested, M3 survives) -> FOLD: if it changes any
    observable behaviour, add a test that kills M3; otherwise remove it (SC-639 can add it with its own test).
  - INFO-2 (M6 equivalent in practice) -> DROP: every real hand-off starts from keyboard focus.
  - INFO-3 (outside edit with focus on a negotiation control drops focus, base too) -> FILED SC-656 (Backlog, related
    SC-642 / SC-639). Out of scope here.
  - INFO-6 nit (focus.e2e.ts:7 import order) -> FOLD.
- r3 implementer (resume r1 agent a52d291724f4e8bcc): fold LOW-1/2/4/5 + nit, rebase onto 10c271fe, full battery.
- 2026-11-14: r3 DONE on dse 09c879f2, rebased on 10c271fe (b334c30d fix, 0b6eae24 tests, 9d46bea8 scroll+comments+
  controlFocusRules removed, 09c879f2 scroll jsdom test+comments+import order). LOW-5: removed controlFocusRules() (the
  in-handler hand-off moves focus before the LP carry captures, so it was dead; M3 unkillable). LOW-4 is in negotiation's
  keepFocus, not the kit. Gates: jest 13318/1 cached (13317/2 fresh); lifecycle 64/64; e2e 591/608 ok, 0 failed, 17
  known-bug, 416/416; shots 592/163/978/40/240/147; freeze 280/280; parity 0/0/24. Off-screen case pinned in jsdom only.
- r4 scoped re-review (resume r2 reviewer a50ec1ddbaa364c13) of the r3 delta 01af056d..09c879f2 (rebase-adjusted).
- 2026-11-14: r4 scoped re-review (agent a50ec1ddbaa364c13) LAND on 09c879f2: 0/0/0/0 LOW / 2 INFO. Rebase content-identical
  (range-diff). Real Obsidian short pane 443 px: chip hidden -> visible + focused + ring, RV and LP; tall pane: no scroll.
  e2e NEGO focus/LP --only: 12/14 ok, 0 failed, 2 known-bug (SC-639). jest negotiation + controlFocus 641/0.
  Rulings: INFO-1 (LOW-4 pinned in jsdom only) -> DROP: the real-Obsidian probe measured it and a short-pane e2e costs
  more than it guards. INFO-2 (chip lands flush with the pane top; ring may be clipped, unmeasured) -> DROP: cosmetic,
  same as the browser's own focus scroll.
- r5 chore (Haiku): superproject onto workspace origin/main 430dd30b+, CHANGELOG commit + ONE pointer bump to 09c879f2.
  Brief sc642-brief-r5-chore.md.
- 2026-11-14: r5 chore (Haiku) DONE: superproject ff'd to origin/main 20004425 (docs-only past 430dd30b; dse develop still
  10c271fe), then da20877b (CHANGELOG bullet, sc642-changelog-bullet.md) and 4a4188a7 (pointer bump dse -> 09c879f2).
  origin/main..HEAD = exactly those 2. Not pushed. Land-ready comment posted on SC-642 (names the landing control, the
  double-Enter side effect and SC-656; no Needs Review — nothing blocks landing). Skill proposal: sc642-skill-proposal.md.
  Reported LAND-READY to the dispatcher.
