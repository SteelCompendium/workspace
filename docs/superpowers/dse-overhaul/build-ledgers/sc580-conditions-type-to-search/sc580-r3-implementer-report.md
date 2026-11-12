# SC-580 r3 implementer report

**Executive summary**
- STATUS: DONE. Rebased onto dse `origin/develop` `231f2a3b` (clean, no conflicts) and onto superproject `origin/main` `bd10dc98` (one CHANGELOG conflict, resolved by keeping both bullets).
- Plugin branch head `eecd2ff6` (3 commits: `b17044b0` key handler, `eafa31c1` e2e/manifest/doc, `eecd2ff6` LOW-2). Superproject head `bbda9dd2` (2 commits: CHANGELOG + pointer `1f802ff1`, CHANGELOG Escape sentence + pointer `bbda9dd2`; pointer = `eecd2ff6`). Nothing pushed.
- LOW-2 folded: Escape on a search a routed key opened, with nothing picked, returns focus to the control that had it (if still connected); else "+ Add condition" as before.
- tsc, lint clean · jest **10741 passed / 1 skipped** (cached app CSS present in this worktree from r1's shots run; fresh-worktree equivalent 10740 / 2 = 10711 + 29 SC-580 tests) · lifecycle **60/60** (21+16+9+4+7+3) · e2e **`283/286 ok, 0 failed, 3 known-bug, coverage: 172/172 pairs`** · shots **592**, 163/978, modal 39/234, capture clip 147 · freeze **280/280** · parity **0 / 0 / 24**.

## Rebase
- Plugin: `git rebase origin/develop` (231f2a3b), two commits replayed with no conflict. `package.json` / lock unchanged between `3ad68185` and `231f2a3b`, so no `npm ci` needed (node_modules still from r1).
- Superproject: `git rebase origin/main` (bd10dc98): `CHANGELOG.md` conflicted (SC-601's new Unreleased bullet vs mine) and the `draw-steel-elements` pointer conflicted. Resolved: both bullets kept (SC-601 first, SC-580 second, blank line between), pointer `git add`ed at the rebased plugin head. Later re-pointed at `eecd2ff6` in `bbda9dd2`.

## LOW-2 change (`src/views/ConditionsModal.ts`)
- New private `returnFocusEl`, set in `typeToSearch` only when the key OPENS the search (not when the search was already open, so a click-opened search keeps today's behaviour), cleared by any `closeAdd` and by a successful add in `pickMatch`.
- `closeAdd(refocus = true, escape = false)`: on `escape` with `refocus`, focus goes to `returnFocusEl` if `isConnected`, else "+ Add condition". Both Escape paths (the SC-431 escape consumer and the input's own keydown) pass `escape = true`; outside-click closes and the mouse paths are untouched. When the key came from "+ Add condition" itself that button is already replaced, so the fallback gives the same result as before. Escape semantics (dropdown first, window second) unchanged: a second Escape closes the window (jest + e2e).
- Decision made here (not in the ruling): a routed key that arrives while the search was already open (opened by click) does not change where Escape sends focus ("+ Add condition"), since the search was not opened by that key.

## Tests
- jest: +8 in `conditions-modal-matrix.test.ts` (`SC-580` describe, nested "Escape on a search a routed key opened ..."): Duration chip through the real-Scope stand-in keymap (same chip, editor open, window open, no emit); the input's own Escape handler; an icon choice; second Escape closes the window; after a pick -> "+ Add condition"; control gone -> "+ Add condition"; opened from "+ Add condition" itself or by click then a routed letter -> "+ Add condition"; a stale target does not outlive a close. 4 of the 8 fail on the r1 source.
- e2e: new COND-N11 (id unused by grep): add Dazed, Escape the kept-open dropdown, open the editor, click End of Turn (chip focused), `d` -> input focused with `d`, editor still open, Escape on the input -> chip focused, window open; second Escape closes the window. Red without the fix (`cond.duration ... to be focused`: not focused), green with it. No new manifest pair (page-level letter and Escape, `cond.input press:Escape` exists), so coverage is 172/172.
- CHANGELOG: one sentence added to the SC-580 bullet.

## Gates (measured)
| gate | result |
|---|---|
| tsc (incl. e2e) / lint | clean / clean |
| jest | 10741 passed, 1 skipped, 266 of 267 suites |
| lifecycle | 21/21, 16/16, 9/9, 4/4, 7/7, 3/3 (part 6 = G-S92,G-S96,G-S97) = 60/60, 0 failed |
| e2e | `OBSIDIAN-E2E done: 283/286 ok, 0 failed, 3 known-bug, coverage: 172/172 pairs` |
| shots | 592; button host-leak OK (163 ... 978); modal host-leak 39 kinds / 234; capture clip OK (147); rc 0 |
| freeze | `freeze OK (280/280 ...)` |
| parity | 0 gaps, 0 undeclared, 24 declared |

Lifecycle parts and the rest of the battery were run back to back as two background scripts (output to unique logs); each part's own `done:` line is the truth.

Drive-by fixes: none.
Follow-ups: none (LOW-1 is SC-613, untouched).

## Artifacts (all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc580-conditions-type-to-search/`)
`sc580-r3-implementer-report.md`; `sc580-r3-gate-tsc.log`, `-lint.log`, `-jest.log`, `-lifecycle-part1..6.log`, `-e2e.log`, `-shots.log`, `-freeze.log`, `-parity.log`; `sc580-r3-e2e-n11-without-fix.log`
