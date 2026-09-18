# SC-299 round 1 — implementer report

## Executive summary

- **Verdict: DONE.**
- dse (`draw-steel-elements`) HEAD: `1762555` (docs commit; code `8cff4ff`, CSS `c94a979`, tests `df69b9e`).
- Worktree superproject HEAD: `cf5f7da`.
- Gates: tsc clean · lint clean · jest `Tests: 1 skipped, 3844 passed, 3845 total` (`Test Suites: 1 skipped, 201 passed, 201 of 202 total`) · shots `host-copy pin OK (…)` + `button host-leak OK (114 button kinds × 3 states … = 684 comparisons …)` · freeze `freeze OK (260/260 frozen print PNGs byte-identical …)` · parity `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0 on every gate.
- Freeze: **all 16 montage `--steel-{print,realprint}` lines unchanged** (260/260 overall unchanged) — no rebaseline needed.
- Evidence: 11 PNGs under `.superpowers/sdd/sc299-montage/evidence/` (listed in §Evidence below).
- No NEEDS_CONTEXT / no BLOCKED. No drive-by fixes taken. One follow-up noted below (not fixed).

## What changed

- `src/elements/montage/BoardView.ts`:
  - `RESULT_ICON`/new `QUICK_ARTICLE` map (aria-label wording).
  - Constructor gains `onQuickLog: (entry: MontageEntry) => void` (between `onOpenSheet` and `onAddHero`).
  - `isInteractive` (~line 244) widened to `entry !== undefined || state === 'current' || (state === 'past' && !complete)` — R-2's past-round-empty edit target, gated shut on a complete montage (review-2 M-1's own guard).
  - Cell `keydown` handler (~line 266) gains a target-inside-`.dse-mt__cell-quick` guard so a real browser's Enter-on-quick-button (which also bubbles `keydown` to the cell before synthesizing `click`) does not double-fire the sheet.
  - `state === 'current' && entry === undefined` branch (~line 288) now renders the quick trio (`role="group"`, three `kit/iconButton`s, `.dse-mt__quick` bespoke-sizing class, `data-kind`, `evt.stopPropagation()` + `onQuickLog({hero, round, result})`) before the existing `to act` hint.
  - Dash-face `else` branch (~line 336) gains the plus editmark, gated `canPersist && state === 'past' && entry === undefined && !complete`.
- `src/elements/montage/view.ts`:
  - `BoardView` construction wires `(entry) => this.commitNewEntry(entry)` as `onQuickLog`.
  - New private `commitNewEntry(entry)` = `logMontageEntry` + `commit()`; `commitSheetSubmit`'s own "new" branch now calls it too, so the write path never forks.
- `styles-source.css`:
  - Structural tier (~3794): `.dse-mt__cell-quick` (flex container) + `.dse-mt__quick` (1.45em bespoke sizing, overriding the kit's generic touch-target box).
  - Steel tier (~4377): `.dse-mt__quick` colour (chip-bg/metal-line at rest, success/failure tint the same tokens the recorded-cell glyph ring uses, assist stays metal, hover/focus-visible → accent).
  - Narrow (`@container dse-mt (max-width: 420px)`, ~4152): `.dse-mt__cell-quick { margin-left: auto; }`, porting round2.css's own narrow rule verbatim.
  - Print (~5109): `.dse-mt__cell-quick` added to the existing `.dse-mt__cell-editmark { display: none }` rule.
- `test/dom/elements/montage.test.ts`: two new `describe` blocks (`SC-299 R-1`, `SC-299 R-2`), 8 new tests — see §6 in the brief, all covered (listed under Tests below). Added `nextHeroToAct` to the existing `model` import.
- `docs/gm-trackers.md`: one sentence pair under "Logging an action." (quick trio) and "Correcting a mistake." (past-round edit target).
- dse `CHANGELOG.md`: extended the existing 7.0.0 Montage bullet with one sentence per behaviour (no new top-level bullet).
- Workspace `CHANGELOG.md`: one `## Unreleased` bullet tagged SC-299.

## The nesting/a11y choice

Per brief §2.1: the cell stays `role="button"`/`tabindex="0"` (the "open the sheet" control); the quick trio's container is `role="group"` with `aria-label="Quick log for <hero>, round <r>"`, and each quick button is a real `kit/iconButton` (`<button class="dse-btn dse-mt__quick">`). One tap logs exactly once because the quick button's own `onClick` calls `evt.stopPropagation()` before writing — this runs at the event's target phase, before it would otherwise bubble to the cell's own `click` listener, so the cell never also opens the sheet.

The one extra piece the brief flagged but didn't fully spell out: a **keyboard** Enter on a quick button in a real browser fires `keydown` (which bubbles to the cell) *before* the browser synthesizes the button's own `click`. Without a guard, that `keydown` would reach the cell's Enter/Space handler and open the sheet in addition to the quick button's native activation logging the entry. Fixed by checking `(evt.target as HTMLElement).closest('.dse-mt__cell-quick')` in the cell's keydown handler and returning early when the key event originated inside the trio — the button's own native activation (a real `click` event) is unaffected and still logs. This keeps every control keyboard-reachable: Tab reaches the cell and each of the three buttons independently (real `<button>`s are natively focusable), Enter/Space on a button logs, Enter/Space on the cell (outside the trio) opens the sheet.

## Tests

`test/dom/elements/montage.test.ts`, two new `describe` blocks (8 new tests, all passing):
- **R-1** (`SC-299 R-1: the open-socket quick trio`): (1) exact aria-labels/`data-kind`/glyph shapes on the three buttons, a success click writes one skill/note-less entry, bumps the tally, and does not open the sheet; (2) clicking the cell surface outside the trio still opens the sheet in new mode; (3) read-only host — three buttons exist, real-disabled; (4) keyboard — Enter on a focused quick button does not open the sheet (guard), the button's own `click` still logs, and Enter on the cell still opens the sheet.
- **R-2** (`SC-299 R-2: an empty PAST-round cell becomes an edit target`): (1) opens the sheet pre-filled `{kind:'new', hero, round}` for the CELL's own round (not `current_round`), carries `role="button"` + the plus editmark (not pencil), and logging into it lands the right round without disturbing `nextHeroToAct` (asserted via `parse(parseYaml(written), written)` + `nextHeroToAct`); (2) a FUTURE-round empty cell stays inert (no `role`); (3) an empty cell on a COMPLETE montage stays inert (no `role`) — reuses `montageDoneYaml`; (4) read-only host — past-empty cell stays `aria-disabled`, no editmark (nothing to edit).

One test-infrastructure note worth flagging to the next round or reviewer: `document.body` accumulates modals across tests in this file (nothing closes them), so "did not open the sheet" assertions use a `document.body.lastElementChild` reference snapshot rather than a global `.dse-mt__sheet` presence check — a global-presence check false-fails whenever an earlier test in the run left a sheet modal sitting in the DOM. This is a pre-existing property of the suite, not something this round introduced or fixed.

## Drive-by fixes

None taken.

## Follow-ups (left alone, for the owner to judge)

- The button host-leak sweep's kind count rose to 114 (3 new kinds: the quick trio's success/failure/assist each get their own at-rest colour, so the sweep counts them separately) — expected per the brief ("your three new quick buttons are a new button KIND so the kind count will rise"), not a defect, just naming it since the dse-verify skill's own worked examples cite older, lower numbers (111 at SC-205) that a future reader might otherwise treat as the target to match.

## What I could not do

Nothing — every brief item (R-1, R-2, R-3, tests, docs/changelog, evidence) was completed. The brief's "if fixtures already show an empty current-round socket…" condition for §2.4 (visual harness) was true: `montage-mid`, `montage-narrow`, and `montage-old-shape` (which also has a genuine past-round-empty cell, giving free R-1+R-2 combined evidence) all now show the trio/editmark in their existing shots with zero fixture changes — nothing needed adjusting there.

## Evidence

All under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc299-montage/evidence/`:
- `sc299-r1-montage-mid--steel-dark.png` / `sc299-r1-montage-mid--steel-light.png` — fixture-mid's round-3 (open, current) sockets showing the ✓/✗/⊕ trio + "to act", dark and light.
- `sc299-r1-montage-mid--steel-print.png` — the same fixture under print: round-3 cells show only "to act" text, no trio (R-3 confirmed visually).
- `sc299-r1-montage-narrow--steel-dark.png` / `sc299-r1-montage-narrow--steel-light.png` — the ≤420px one-band-per-hero row layout, trio right-aligned via the ported `margin-left: auto` rule.
- `sc299-r1-montage-old-shape--steel-dark.png` / `sc299-r1-montage-old-shape--steel-light.png` — fixture-old-shape (rounds:2, current_round:2, zero entries): Round 1 shows the "— NO ACTION" face with the faint plus editmark top-left (R-2) *and* Round 2 shows the live quick trio (R-1) — both behaviours in one existing shot, no fixture changes needed.
- `sc299-r1-montage-done--steel-dark.png` — the complete montage: Osric/Yenna/Talin's round-3 empty cells render plain "— NO ACTION" with no plus and no trio, confirming the complete-montage inert rule.
- `sc299-r1-montage-past-empty-cell-rest--steel-dark.png` / `-hover--steel-dark.png` / `-focus--steel-dark.png` — a one-off Playwright crop (not part of the harness battery; script was written to a scratch path and deleted after use, nothing committed) isolating fixture-old-shape's Round-1/Kira cell at rest, hover, and focus, showing the plus editmark's faint→bright reveal (mirrors the existing pencil editmark's own hover/focus rule).

## Gate logs (full)

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc299-montage/`:
- `sc299-r1-tsc.log` — clean, no output.
- `sc299-r1-lint.log` — clean, exit 0.
- `sc299-r1-jest.log` — `Test Suites: 1 skipped, 201 passed, 201 of 202 total` / `Tests: 1 skipped, 3844 passed, 3845 total`.
- `sc299-r1-shots.log` — full shots run; `host-copy pin OK (…)` and `button host-leak OK (114 button kinds × 3 states … = 684 comparisons …)` both present, no per-record failures.
- `sc299-r1-freeze.log` — `freeze OK (260/260 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`.
- `sc299-r1-parity.log` — `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).`

## Commits

`draw-steel-elements` (branch `sc299-montage`, cut from `origin/develop` `e12c6bd`, still current — no rebase needed):
1. `8cff4ff` — `feat(montage): SC-299 R-1/R-2 — restore the open-socket quick trio and make empty past-round cells an edit target`
2. `c94a979` — `style(montage): SC-299 — quick-trio + plus-editmark CSS, narrow layout, print hide`
3. `df69b9e` — `test(montage): SC-299 — quick trio (R-1) and past-round edit target (R-2) coverage`
4. `1762555` — `docs(montage): SC-299 — document the quick trio and past-round edit target`

Worktree superproject: `cf5f7da` — `chore: bump draw-steel-elements submodule pointer (SC-299)`.

Nothing pushed; no tags created.
