# SC-495 r3 — fix round (implementer)

Context: same worktree, branch and footguns as `sc495-brief-r1-impl.md` §6 (all still apply; new private scratch subfolder `sc495-r3-impl-<suffix>/`). Ledger `decisions.md` is truth — re-read the amended FOCUS TARGET RULE and the r2-re-review rulings. Re-review report: `sc495-r2-rereview-report.md` (LOW-A, LOW-B). Never call the tracker.

Start: dse HEAD must be `c4b51ce` on origin/develop `9f08f06`; superproject `4cd1e12` on origin/main `3c7f392`. `git -C <path> fetch origin` in both; if either moved, rebase (CHANGELOG conflict: keep both bullets, ours first) and report.

## Fixes

### LOW-A (verbatim from the review)
> MEDIUM-1 can still happen in notes, in one narrow case. Repro: keyboard focus is already on the counter's "−", then a mouse click takes it to 0. The note's click shield (`pipeline.ts:220-239`) keeps the button's keyboard focus state, so focus moves to `counter.input` with the ring. The wheel then changes the number, and clicking away writes it: `current_value: 3`. On base nothing is written.
> Fix: decide "keyboard" from the click event, not the button's focus state. A keyboard-activated click has `MouseEvent.detail === 0`. Use `onClick: (e) => commit(current ± step, e.detail === 0)` (`stepper.ts:145,172`; `iconButton` already passes the event).
> Tests: jest should dispatch `MouseEvent('click', { detail: 1 })` for the pointer cases, and an e2e step should tab to "−", mouse-click it to 0, then assert no focus move, no wheel change and no write.

Owner ruling: FOLD, as prescribed. Amended rule: KEYBOARD press = "the activating click event has `detail === 0`" → move with `{ preventScroll: true, focusVisible: true }`; otherwise move nothing. Remove the now-unused `:focus-visible` read from the stepper if nothing else uses it. Update the stepper.ts comment. Show the new e2e step red on c4b51ce, green after.

### LOW-B (verbatim)
> the test presses "+" to 9 on both Edges and Banes, but the owner ruling said "Edges to 0". The read-only "−" at min is only covered by jest.
> Fix: from `roll.edges.dec`, press Enter 9 times, assert `roll.edges.value` has the ring, then Tab to `roll.edges.inc`. Add a manifest row `roll.edges.dec press:Enter` (coverage becomes 78/78).

Owner ruling: FOLD, as prescribed.

CHANGELOG: no change needed ("Using the mouse behaves as before" becomes fully true). Out of scope: anything else (duplicate roll ids are DROPPED; leave them).

Commits: `fix(SC-495): …`, `test(SC-495): …` in dse; no AI attribution; never push.

## Gates — full battery on the final head (dse-verify skill)
Expected: tsc/lint clean; jest 5859 ± your test changes / 1 skipped / 241 of 242 (after a shots run; a one-off timeout in the unrelated SC-485 `initiative-default-keys.test.ts` under heavy load is known — re-run that file alone and the full suite once at lower load before calling it red); lifecycle 34/34; e2e ≥113 ok, 0 failed, 0 known-bug, coverage 78/78 (or report the new Y/Y); shots 592, 0 FAIL; freeze 280/280; parity 0 GAPs / 0 undeclared / 24 DECLARED.

## Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc495-stepper-focus/sc495-r3-fix-report.md`, opening with a ≤10-line executive summary. If the write is blocked, return it inline.

## Return contract
Raw facts: STATUS, dse head + base shas, superproject sha, each gate's numbers, red/green evidence, absolute artifact paths. You cannot SendMessage me; NEEDS_CONTEXT if blocked; any stray message starts `SC-495:`.
