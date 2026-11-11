# SC-572 r3 fix-round brief (resume of the r1 implementer)

Same worktree, branch, footguns (§4 of sc572-brief-r1-implementer.md — still binding; reuse your scratch
folder sc572-r1-impl-<yourAgentId>/ with new, uniquely named r3 logs), report and return contract as r1.
Base dse develop 97a9c93b; your head 1305e0b4. `git -C <plugin> fetch origin` first; report if
origin/develop moved (rebase onto it if so). You never call the tracker.

Reviewer findings (verbatim from `sc572-r2-reviewer-report.md`; read the report body for detail) — fix ALL:

- **MEDIUM-1** `src/views/MinionStaminaPoolModal.ts:577-585`: Enter or Space removes the condition, then
  `container.empty()` rebuilds the icons and focus goes to `BODY` (`inModal:false`, modal still open).
  Precedent: `src/views/ConditionsModal.ts:347-353` (MED-3, "never <body>").
  Fix: when `isKeyboardClick(evt)`, call `focusControl` from `src/framework/chrome/focusHandoff.ts:40-51`
  on the icon now at `min(idx, n-1)`. If none remain, focus the next focusable control in the modal. Add
  e2e checks with `dse.focusedControl()` after the press, plus a last-condition case.
  (Owner note: a mouse click must not move focus differently from today — only keyboard activation
  gets the hand-off, mirroring ConditionsModal.)
- **LOW-1** `e2e/specs/minion-pool/pool-conditions.e2e.ts:53-69` and
  `test/dom/views/minion-stamina-pool-modal-matrix.test.ts:600-612`: no test checks that other keys do
  nothing. Fix: before the press, `expectNoWrite(HURT, () => browser.keys('a'))` on the focused icon.
- **LOW-2** `styles-source.css:15581`: deleting the shared focus-ring line leaves no focus indicator at all.
  Fix: assert `outlineStyle` is `solid` and `outlineWidth` is `2px` after `tabTo` in POOL-C04.
- **LOW-3** `styles-source.css:1984-1998`: CSS reset unguarded. Fix via the fixture: in the `fight` fixture
  at `visual-harness/entry.ts:653`, add to **Goblin #4 (NOT Goblin #1** — #1 is default-selected and would
  move the frozen `initiative-fight*` print PNGs):
  ```
  conditions:
    - key: "bleeding"
      color: "crimson"
  ```
- **INFO-2**: rename the stale helper `conditionTitles` (`e2e/driver/pool.ts:65`) to fit what it now reads
  (aria-label), updating callers.

Out of scope (do not touch): SC-574's (b) marker setup line (INFO-1), icon size/contrast (filed SC-591),
whole-block re-serialisation on removal (filed SC-592), the "Remove X" vs tracker wording, SC-566/567/573/574,
SC-480, SC-576, SC-521 (montage-wheel shots flake: if shots fails on that gate, re-run once and report both).

Prove the new tests are not vacuous: re-apply mutants M5 (any key removes), M8 (drop the CSS reset),
M9 (drop the focus-ring line) and "no focus hand-off" and confirm each is now caught (M8 by shots'
`MODAL BUTTON HOST-LEAK VIOLATED`); revert every mutant and confirm a clean tree before the final battery.

Full battery on your final head. Expected: tsc/lint clean · jest 7050 + your new tests / 1 skipped (SC-568
timeouts: re-run that suite alone) · lifecycle 52/52 in the five `--only` parts · e2e `0 failed`,
**10 known-bug**, coverage Y/Y (≥163; N/M grow by any scenarios you add) · shots 592, all 592 PNG hashes
identical to a clean-head render except none expected (compare against 1305e0b4's set if cheap; at minimum
freeze), `button host-leak OK (163 … 978 …)`, `modal button host-leak OK (… 39 button kinds … 234 comparisons)`,
`capture clip OK (147 …)` · freeze `280/280` · parity 0/0/24.

Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc572-pool-modal-condition-keyboard/sc572-r3-fix-report.md`,
≤10-line exec summary first (head sha, each finding → commit, mutants caught, every gate line).
Return: raw facts + absolute artifact paths.
