# SC-196 round 3 report — rebase + on-hover tooltips

## Executive summary

**Verdict: DONE.** dse `068a2a6` (superproject `95c88a7`), both rebased clean (no
conflicts) onto dse develop `e12c6bd` / main `728f514`. All three flagged color-only
surfaces now carry an on-hover tooltip naming the state, plus matching aria-label —
roll-result row, `+N` temp-stamina badge, initiative selection ring. Gates: tsc clean,
lint clean, jest 3870 passed/1 skipped/202 of 203 suites/3 snapshots, shots 524 written/0
FAIL (host-copy pin OK, button host-leak OK 113 kinds), freeze `OK (260/260 …)` exit 0,
parity `0 gaps/0 undeclared/16 declared` exit 0. `lightContrast.test.ts` alone: 25/25
passed; the light-scheme state-token *values* are byte-identical to `a74fa87` (only line
numbers moved, from develop's unrelated intervening edits). No CSS touched this round —
only TypeScript (kit + two elements) + tests. Evidence: DOM dump (jest console.log) since
the harness has no hover-capture pass; see paths below.

## Task A — rebase

- dse: `git fetch origin && git rebase origin/develop` — **0 conflicts**, landed at
  `fdc5d85` (tip `e12c6bd` matched exactly). Log:
  `.superpowers/sdd/sc196-light-contrast/sc196-r3-rebase-dse.log`.
- Superproject: `git fetch origin && git rebase origin/main` — **0 conflicts**, landed at
  `20ddd61` (tip `728f514` matched exactly). Log:
  `.superpowers/sdd/sc196-light-contrast/sc196-r3-rebase-super.log`.
- `npm ci` after rebase: succeeded, 771 packages. Log:
  `.superpowers/sdd/sc196-light-contrast/sc196-r3-npmci.log`.
- `rm -f main.js styles.css` run before every jest invocation this round (footgun
  protocol).
- dse submodule pointer staged/committed in the superproject at the end of both Task A
  (`7ad11c6`, bumping to `fdc5d85`) and Task B (`95c88a7`, bumping to `068a2a6`).
- **Pre-existing, out-of-scope drift, left untouched:** the superproject worktree's
  `data-gen`, `data-sdk-npm`, `steel-etl`, `steelCompendium.github.io`, `v2` submodules
  show as modified (their checked-out commits are AHEAD of what the rebased superproject
  HEAD pins) — this predates this round's work (the worktree was never `just sync`'d to
  these later main advances) and none of these repos were touched. Reported under
  Follow-ups below, not fixed (brief: "You should not need to touch v2 at all").

## Task B — the tooltip condition

Scott's ruling (ledger, verbatim): *"For the things you flagged, so long as they have
on-hover tooltips, I think they are fine."* All three now do, via the kit's existing
mechanism (`tooltip()` / Obsidian `setTooltip`) — no new mechanism invented.

### Surface 1 — roll-result active/dimmed row (`powerRollPanel.ts`, `setRollResult`)

**Before:** `data-dse-roll-result="active"|"dimmed"` only — color-only signal, no
tooltip, no aria-label distinct from the row's content-derived name.
**After:** `setRollResult` gains an optional `total?: number` param (both callers —
`rollController.ts`, `roll/view.ts` — now pass `result.total`). Every row gets an
on-hover tooltip: active → `"Rolled result — {total} ({tier range})"` (or without total,
`"Rolled result ({range})"`); dimmed → `"Not rolled"`. Following the mount-time pattern
already established in `iconButton.ts` §2.5 (native `setTooltip` stamps `aria-label` as
a side effect), the row's aria-label is written LAST as
`"{stateText}. {row's own textContent}"` — the state word reaches screen readers without
losing the row's outcome text as its accessible name. Clearing (`setRollResult(null)`)
removes the aria-label again, restoring the content-derived name.

### Surface 2 — the `+N` temp-stamina badge (`StaminaBarPanel.ts`, `.dse-stamina__ctemp`)

**Before:** purple-bordered `+N` text, no tooltip, no aria-label — color/border only
signal that this is *temporary* Stamina (confirmed: no other in-repo consumer of this
class exists outside `StaminaBarPanel.ts`, so this single fix covers every caller — hero
sheet, standalone stamina bar element, and the initiative tracker's row-detail bars,
which all build through `renderStaminaBar`/`updateStaminaBar`). **After:** whenever
`temp > 0`, `setTooltip(tempEl, "Temporary Stamina: {N}")` (which also stamps
aria-label); cleared (badge text empty, aria-label removed) at `temp == 0`. Checked per
the brief: the initiative grid's own **mini cell gauge** (`buildCellGauge`/
`refreshCellGauge`) carries no numerals of its own ("no crest, no numerals" — doc
comment) — it has no `+N` badge to touch; its temp signal is a colored gauge segment
alongside the cell's own always-visible `(+N)` TEXT readout
(`updateStaminaDisplay`), which is not color-only and was left alone (out of the three
named surfaces).

### Surface 3 — the selection ring (`initiative/view.ts` grid cell button)

**Before:** `[data-selected]` ring is the only visible signal beyond `aria-pressed`; no
hover tooltip; the accessible name (`"Select {creature} #{id}"`) never changed with
state. **After:** `iconButton` gains a `setTooltip(text)` handle method (mirrors
`setLabel`/`setPressed`; re-asserts the CURRENT aria-label after calling `tooltip()`, so
the required accessible name never drifts to the tooltip text — same contract as mount
time). The cell now toggles `"Select"` ↔ `"Selected"` on hover in place, in the same
repaint loop that already flips `aria-pressed`/`[data-selected]`. `aria-pressed` already
carries the state to AT, so the accessible name itself is deliberately left unchanged
(verified: `aria-label` still reads `"Select {creature} #{id}"` after selection).

## Tests added (one file each, alongside the existing suites for these components)

- `test/dom/kit/powerRollPanel.test.ts` — 4 new tests: active-row tooltip+total,
  active-row without total, dimmed-row wording, clear restores content-derived name.
- `test/dom/kit/staminaBarPanel.test.ts` — 3 new tests: temp>0 tooltip/aria-label,
  temp==0 no tooltip, `updateStaminaBar` clears it in place.
- `test/dom/kit/iconButton.test.ts` — 1 new test: `setTooltip` updates hover text
  without clobbering the current aria-label.
- `test/dom/elements/initiative.test.ts` — 1 new test: cell tooltip toggles
  Select/Selected on click, one call per cell, accessible name unchanged.

`lightContrast.test.ts` untouched and still green (below) — no bar loosened.

## Gates (dse-verify order, in the worktree)

| Gate | Result |
|---|---|
| `npm run tsc` | clean, exit 0 |
| `npm run lint` | clean, exit 0 |
| `npx jest` | **3870 passed / 1 skipped / 202 of 203 suites / 3 snapshots**, exit 0 |
| `npm run shots` | **524 `ok` lines written, 0 FAIL** (all 6 "FAIL"/"failure" grep hits are false positives: the `montage-failed` fixture name and the `montage track widths` / `print-twin delta self-test` prose). In-run: `host-copy pin OK (6 button-reaching rules + 14 tokens × dark/light …)`, `button host-leak OK (113 button kinds × 3 states … = 678 comparisons …)` |
| `check-freeze.sh` | **`freeze OK (260/260 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`, exit 0** — matches the ledger's expected post-SC-202-rebaseline number exactly |
| `npm run parity` (LAST) | **`0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0** — same composition as the documented set (FOLLOWUPS #51 ×6, #40 ×2, #39 ×8) |

Logs:
- `.superpowers/sdd/sc196-light-contrast/sc196-r3-gate1-tsc.log`
- `.superpowers/sdd/sc196-light-contrast/sc196-r3-gate2-lint.log`
- `.superpowers/sdd/sc196-light-contrast/sc196-r3-gate3-jest.log`
- `.superpowers/sdd/sc196-light-contrast/sc196-r3-gate4-shots.log`
- `.superpowers/sdd/sc196-light-contrast/sc196-r3-gate5-freeze.log`
- `.superpowers/sdd/sc196-light-contrast/sc196-r3-gate6-parity-run2.log` (the
  authoritative run — see footgun note below)

**Footgun encountered:** the first `npm run parity` attempt was launched with a trailing
`&` (my own error — the brief prohibits backgrounding a gate) and a subsequent stray
`pkill -f "npm run parity"` (aimed at an earlier auto-backgrounded `shots` run) clipped
it mid-sampling (a `Terminated` line appears, and the run never reached `diff.mjs`).
That attempt's log (`sc196-r3-gate6-parity.log`) is **not** evidence — discarded in favor
of the clean re-run (`-run2.log`) above, which completed in the foreground with no
interference and is what's reported.

## Evidence — post-rebase palette integrity

- `lightContrast.test.ts` alone: `.superpowers/sdd/sc196-light-contrast/sc196-r3-lightcontrast.log`
  → **25 passed, 25 total**, exit 0.
- Token-value diff (not a line-number diff — the file grew ~2000 lines from develop's
  intervening SC-202 work, so raw `git diff` line ranges are not meaningful): every
  `--dse-stamina-*`, `--dse-tier-*`, `--dse-vp`, `--dse-warn`, `--dse-select`,
  `--dse-metal-bright`, `--dse-act-*` declaration extracted in file order from
  `a74fa87:styles-source.css` vs `HEAD:styles-source.css` — **byte-identical, 0 diffs**.
  `styles-source.css` was not touched by this round's commit at all (git status confirms
  only TS/test files changed).

## Evidence — the three surfaces (DOM dump)

The browser visual harness (`shoot.mjs`) has no hover-capture pass reaching these three
specific interaction states (roll-result requires `rollingEnabled`, default OFF; the
selection-ring hover state isn't a named harness fixture), so per the brief's fallback,
DOM evidence: a scratch jest file (`test/dom/_sc196r3-evidence.test.ts`, deleted after
the run — not committed, per "don't commit scratch checks as permanent test files")
mounted each surface and `console.log`'d its `aria-label`/tooltip state before and after
the state change. Full output:
`.superpowers/sdd/sc196-light-contrast/sc196-r3-dom-evidence.log`. Excerpt:

```
[EVIDENCE surface1] tier=mid data-dse-roll-result=active aria-label="Rolled result — 14 (12-16). 12-166 + M damage"
[EVIDENCE surface1] tier=low data-dse-roll-result=dimmed aria-label="Not rolled. ≤113 + M damage"
[EVIDENCE surface2] text="+4" aria-label="Temporary Stamina: 4"
[EVIDENCE surface3] BEFORE aria-pressed=false aria-label="Select Goblin #1"
[EVIDENCE surface3] AFTER  aria-pressed=true aria-label="Select Goblin #1"
```

(The `tooltip()`/`setTooltip` call itself — the on-hover text — is asserted directly via
`jest.spyOn(obsidian, 'setTooltip')` in the four permanent test files above, which is
stronger evidence than a screenshot could be for a hover-only affordance; the DOM dump
here is the requested supplementary artifact.)

## Drive-by fixes

None. No pre-existing bug/typo/inconsistency met all four in-passing criteria this
round.

## Follow-ups

- **Superproject worktree submodule drift** (`data-gen`, `data-sdk-npm`, `steel-etl`,
  `steelCompendium.github.io`, `v2` all show as modified — checked-out commits ahead of
  what the now-rebased superproject HEAD pins). Pre-existing, not caused by this round,
  and out of scope per the brief ("never touch v2… never touch data-gen" instructions).
  Left untouched. The ticket-owner should either `just sync` this worktree or note it's
  expected to self-resolve at `wt-finish`/landing.
- Nothing else observed in-scope-adjacent worth a ticket.

## Return contract

STATUS: DONE.
- dse sha: `068a2a6` (worktree `/home/scott/code/steelCompendium/worktrees/sc196-light-contrast/draw-steel-elements`)
- superproject sha: `95c88a7` (worktree `/home/scott/code/steelCompendium/worktrees/sc196-light-contrast`)
- Tests: 9 new jest assertions across 4 files (4 powerRollPanel, 3 staminaBarPanel, 1
  iconButton, 1 initiative), all green; full suite 3870 passed/1 skipped/202 of 203
  suites/3 snapshots.
- Gates: tsc clean · lint clean · jest 3870/1skip/202-203suites · shots 524/0 FAIL ·
  freeze 260/260 · parity 0/0/16, exit 0 each.
