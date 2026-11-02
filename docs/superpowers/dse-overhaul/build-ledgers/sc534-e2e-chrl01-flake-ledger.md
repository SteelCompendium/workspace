# SC-534 decisions ledger — e2e CHR-L01 flake

Effort: `sc534-e2e-chrl01-flake`. Worktree: `/home/scott/code/steelCompendium/worktrees/sc534-e2e-chrl01-flake`
(every submodule on branch `sc534-e2e-chrl01-flake`; superproject @ `d807b78e`). dse base: `develop` @ `97284051`.
Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05.
Spec under test: `draw-steel-elements/e2e/specs/stamina-bar/chrome-live-preview.e2e.ts` (CHR-L01).

## Dispatcher task (2026-11-02, quoted)

> You own Linear ticket SC-534 (e2e CHR-L01 — Live Preview chrome menu real-mouse test — sometimes fails under heavy
> machine load). SC-539 just landed what its owner believes is the root cause for CHR-L01 too (all e2e shards share one
> Xvfb whose real pointer sat inside every window; e2e/run.mjs now parks it at 0,0) — read
> docs/superpowers/dse-overhaul/build-ledgers/sc539-e2e-chrf02-flake/ first. SC-529 is an older ticket for the same
> CHR-L01 symptom: you may mark it a duplicate of SC-534 (say so on both) rather than work it separately.
> […] First prove whether CHR-L01 still flakes after SC-539 (repeat runs under load and with foreign-window churn, as
> SC-539's r1 did); if it no longer does, the remaining work is only to simplify CHR-L01's re-hover loop
> (e2e/…/chrome-live-preview.e2e.ts:43-48) without weakening what it proves — or close with evidence if that loop
> should stay. Overlap: SC-546 (Backlog, not running) is in e2e/run.mjs's startXvfb. At land-ready put any proposed
> dse-verify text in a proposal file (don't edit SKILL.md in the branch).

## Scott rulings

(none yet)

## Background (from the SC-539 preserved ledger)

- SC-539 r1: 150 ms foreign-window churn reproduced BOTH CHR-L01 messages ("…to be revealed by the hover", "…to stay
  revealed with the pointer on Collapse"), 2/2. Root cause: real X pointer at screen centre inside every shard window.
- SC-539 fix (dse `88cb7db9`, in develop `97284051`): `e2e/run.mjs` parks the X pointer at 0,0 with a held X11
  connection (`e2e/x11-pointer.mjs`) + Xvfb `-noreset`. SC-539 r4: churn 150 ms at HEAD, 4 hover specs incl. CHR-L01 ok.
- The CHR-L01 workarounds were all added by SC-502 r3 (2026-10-24) for "flakes under full-run load", i.e. before the
  cause was known: `waitStable()` + the ≤3 re-hover loop (`d5aaa406`, lines 43-48) and the `{ cdp: true }` click
  (`c5587597`, lines 51-54). Dispatcher scope is lines 43-48; the cdp click is measured but not changed unless ruled.

## Owner plan (2026-11-02)

- SC-529 → mark Duplicate of SC-534 (comment on both). Done at start.
- r1 (reviewer, Opus): prove at `97284051` whether CHR-L01 still flakes (repeat runs under load + 150 ms churn, park
  on vs. the SC-539 park disabled as the positive control), and measure the simplified variant (single hover, no loop;
  with and without `waitStable`) under the same conditions, plus an anti-vacuity control that the simplified spec still
  FAILs on the SC-502 bug (fix reverted in a temporary bundle/src). No commits.
- r2 (implementer): apply the ruled simplification, full battery. r3 (reviewer, fresh identity): review.

## Rounds

| Round | Role | Agent | Status | Report |
|---|---|---|---|---|
| r1 prove + measure | reviewer (Opus) | a5488942708929689 | done 2026-11-02: no flake; recommend B2 (+D safe) | sc534-r1-report.md |
| r2 implement B2+D, rebase dabfb518, battery | implementer (Sonnet) | a4041bce29acad204 | done 2026-11-02: head fe44be1d on dabfb518; proof churn 10/10, CPU 5/5, nopark 0/2; tsc+lint clean; jest 6261/2 (fresh); lifecycle 46/46; e2e 124/124 87/87 x2; main.js/styles.css byte-identical to dabfb518 | sc534-r2-impl-report.md |
| r3 independent review | reviewer (Opus, fresh identity) | a4d7580444f87a38b | done 2026-11-02: LAND, 0 HIGH / 0 MED / 3 LOW / 3 INFO | sc534-r3-review-report.md |
| r4 fix (LOW-1..3) | implementer (r2 identity) | a4041bce29acad204 | done 2026-11-02: head eaf64ba6 on fe44be1d; tsc+lint clean; jest 6261/2; e2e 124/124 87/87 x2; sha256 identical to dabfb518 | sc534-r4-fix-report.md |
| r5 scoped re-review of r4 delta | reviewer (r3 identity) | a4d7580444f87a38b | done 2026-11-02: LAND, 0 findings above INFO | sc534-r5-rereview-report.md |

## Dispatcher FYI — develop moved (2026-11-02, quoted)

> FYI develop moved: SC-537 landed, dse develop is now dabfb518 (was 97284051). Live Preview callout-twin src +
> lifecycle G-S57; no e2e change. Baselines at dabfb518: jest 6262 passed / 1 skipped / 249 of 250 · lifecycle 46/46
> (three parts 21 + 16 + 9) · e2e 124/124 87/87 · shots 592 0 FAIL 161/966 · freeze 280/280 · parity 0/0/24. Rebase
> target is now dabfb518. No reply needed.

Owner plan: r1 keeps measuring at `97284051` (SC-537 touches LP callout twins; CHR-L01's `Stamina/basic.md` has no
callout, and no e2e harness change). r2 rebases onto `dabfb518` first, re-runs the CHR-L01 churn batch there, then
gates at the dabfb518 baselines (read the exact third lifecycle `--only` list from dse-verify at dispatch).

## r3 verdict (2026-11-02, reviewer a4d7580444f87a38b — report sc534-r3-review-report.md)

LAND. All 9 old checks kept; SC-502 clip-lift reverted → 0/2 at :29 ("…stay revealed with the pointer on Collapse");
click probe: panel click-through or Collapse covered inside the panel → default click throws "element click
intercepted" at :31, while the old `{ cdp: true }` press landed on the editor (cursor 0→3); churn 10/10, CPU x20 5/5,
park-off 0/2; full e2e 124/124 87/87.

## Owner rulings on r3 (2026-11-02)

- **LOW-1 (root-cause comment loose, spec :23-24) — FOLD**, r3's wording: "Earlier flakes here were the shared Xvfb's
  real pointer, which sat at the screen centre inside every window: another shard mapping or unmapping its window there
  sent this one a Leave/Enter that dropped the hover (fixed by parking the pointer at 0,0, SC-539), not Live Preview
  layout or load."
- **LOW-2 (click comment names one failure mode, spec :30) — FOLD**, r3's wording: "The driver's default click: it
  waits for Collapse to be displayed and hit-tests it before pressing, so a hidden or covered Collapse fails here (not
  displayed / "element click intercepted") instead of the press landing on the editor line."
- **LOW-3 (`ClickOptions.cdp` now has no callers, `e2e/driver/dse.ts:276/:318/:325`) — FOLD**: delete the option,
  its branch and its doc line (keep `cdpClick`, the fallback uses it). Reason: dead code this change created, and
  INFO-2 shows the forced-CDP path counted a coverage pair even when the press missed — a footgun, not an escape hatch.
- INFO-1 (fallback cannot catch an intercepted click), INFO-3 (11.7 s intercepted throw) — DROP, no action.
  INFO-2 — resolved by LOW-3.

## Tracker actions

- 2026-11-02: SC-529 commented + set Duplicate of SC-534. SC-534 commented (plan) + flipped Awaiting.

## r1 verdict (2026-11-02, reviewer a5488942708929689 — report sc534-r1-report.md)

- **CHR-L01 no longer flakes at `97284051`.** Churn 150 ms + park: 20/20 ok, 0 leaves. CPU x20 + park: 10/10, 0 leaves.
  Full e2e x2: 124/124, 87/87, 0 leaves across all 248 test executions (SC-539 r1 measured 11 per run before the park).
- Positive control (park disabled, churn 150): **0/5 ok**, 53-54 leaves/run — the shipped re-hover loop does NOT rescue
  it (2-3 hovers, still fails at `:48`). The loop has no value even in the failure mode it was written for.
- B1 (single hover, keeps waitStable): churn 20/20, CPU 10/10. **B2 (single hover, no waitStable)**: churn 20/20,
  CPU 10/10, full e2e 124/124 87/87; park disabled 0/3 at `:48` (same as shipped).
- `waitStable()`: in 93 runs always the minimum 3 polls and ONE distinct rect — the block never moves after openNote.
- Anti-vacuity: SC-502 LP CSS reverted (C1 clip-lift only; C2 all 3 rules) → shipped, B1, B2, with cdp and default
  click: 0/11 ok, every failure at `:50` "…to stay revealed with the pointer on Collapse" (hover on Collapse hit-tests to
  the editor line, root loses :hover). B2 proves the SC-502 fix exactly as the shipped spec does.
- D (default `dse.click(collapse)` instead of `{ cdp: true }`): churn 10/10, CPU 10/10; B2+D churn 5/5, CPU 5/5.

## Owner rulings on r1 (2026-11-02)

- **Adopt B2**: replace `chrome-live-preview.e2e.ts:43-48` with a single `await dse.hover(root.root)` followed by the
  existing reveal `waitFor`. Delete what becomes unused (`waitStable` :19-34, `browser` from the :7 import if unused;
  `panelRevealed` :16-17 either deleted or reused as the predicate of the two reveal `waitFor`s — implementer's choice,
  whichever reads plainer). Rewrite the :43-44 comment: say the hover must reveal the panel on the first try, and that
  earlier flakes here were the shared-Xvfb pointer crossing fixed by SC-539 (not Live Preview layout).
- **Fold D (in scope, owner ruling)**: restore the driver's default `dse.click(collapse)` at :54. Reason: it is the
  same SC-502 r3 workaround, added for the same misdiagnosed "full-run load" cause as the loop, in the same 20-line
  test; the default click's pre-click hit-test is the STRONGER check (a covered Collapse fails loudly as "element click
  intercepted"), so this tightens what CHR-L01 proves rather than weakening it. Evidence 25/25 under churn and CPU x20.
  Rewrite the :51-53 comment accordingly. Flag this scope fold in the land-ready note to the dispatcher.
- Follow-up "driver `waitStable(el)` behind `click({ stable: true })` (`e2e/driver/dse.ts:282-299`)" — **DROP**: a
  general driver option for elements that animate, used by other specs, with no evidence it is a pointer-crossing
  workaround; not this ticket.
- r1's heredoc deviation (scratch `edit-spec.py`) — noted, no impact (no hang; scratch only).


## Owner ruling on r5 (2026-11-02)

- INFO-1 (`cdpClick` doc "(pseudo-elements, odd hit areas)", `e2e/driver/dse.ts:300`) — DROP: the fallback it now
  serves is exactly the odd-geometry case, so the phrase is still true; cosmetic.

## LAND-READY (2026-11-02)

Plugin branch `sc534-e2e-chrl01-flake` @ `eaf64ba6` (commits `fe44be1d`, `eaf64ba6`) on dse develop `dabfb518`. r3 LAND
(3 LOW folded), r5 LAND. Gates: tsc+lint clean; jest 6261/2 (fresh form of 6262/1); lifecycle 46/46 (21+16+9, at
fe44be1d; e2e/ is not in the bundle); e2e 124/124 87/87 x4 (2 at fe44be1d, 2 at eaf64ba6); main.js/styles.css
byte-identical to dabfb518 (shots/freeze/parity carry). Scope fold beyond the dispatcher's :43-48: the `{ cdp: true }`
click → default click, and `ClickOptions.cdp` removed from `e2e/driver/dse.ts` (owner rulings D and LOW-3). No new
dependency; CHANGELOG: none (test-only). dse-verify text: sc534-dse-verify-proposal.md (not applied). No tickets filed.
SC-529 set Duplicate of SC-534. No overlap with SC-546 (`e2e/run.mjs` untouched).

## DONE (2026-11-02)

Landed by the dispatcher: dse develop fast-forwarded to `eaf64ba6`; workspace main `f34fe648` (pointer bump `33ea9821`);
docs commit `78bd9cee` applied `sc534-dse-verify-proposal.md` (SC-539 bullet confirmation + spec rule, new CURRENT) and
preserved this ledger to `docs/superpowers/dse-overhaul/build-ledgers/sc534-e2e-chrl01-flake/`. Worktree removed.
SC-534 flipped to Done with a closing comment. SC-529 Duplicate of SC-534. No follow-up tickets.
