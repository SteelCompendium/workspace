# SC-324 decisions ledger — kit iconButton mount-time `tooltip` discarded

Ticket: https://linear.app/tski-home/issue/SC-324
Worktree: /home/scott/code/steelCompendium/worktrees/sc324-kit-tooltip (branch `sc324-kit-tooltip` in every submodule)
Tracked branch: draw-steel-elements `develop` @ `0d69ec9` at effort start (2026-10-19).

## Scott rulings (verbatim, dated)

(none yet — thread had 0 comments at effort start, 2026-10-19)

## Owner decisions (ticket-owner, Opus 5.5) — Scott may override

### D1 (2026-10-19) — contract: option (b), drop `IconButtonOptions.tooltip`; `label` is the one string

The ticket offered (a) "tooltip wins when given, label is the fallback" or (b) "drop the
`tooltip` option and make every caller put its full text in `label`".

Chosen: **(b)**. Reasons:
- Obsidian's `setTooltip` writes only `aria-label`, and the hover renderer reads `aria-label`.
  Hover text and accessible name are one attribute. One option that maps to one attribute is
  the honest API; two options that cannot differ is the footgun that caused this bug.
- `label` is not visible text (visible text is the separate `text` option), so a longer
  `label` costs nothing on screen.
- Under (a) the conditions call sites would regress: their tooltip ("Grabbed") is SHORTER than
  their label ("Remove condition: Grabbed"), and (a) would make the screen-reader name lose the
  action. Under (b) each call site picks the fuller string on purpose.

Per-call-site string rule (applies to every caller that passed a `tooltip` differing from `label`):
- The new `label` is the string BOTH a hovering user and a screen-reader user should get.
- Lead with the action/name (what the button does), then any explanation. If the old tooltip
  already contains the label's information, use the tooltip text. If the old label is fuller
  (conditions remove/save buttons), keep the label. Otherwise merge: `<label>: <explanation>`
  or `<label> — <explanation>`, matching nearby house style.
- Any later `setLabel(...)` on the same button must produce strings under the same rule (no
  state flip may drop the explanation back out).

Out of scope: `tooltip()` calls on non-iconButton elements; the post-mount handle (SC-196
already deleted `IconButtonHandle.setTooltip`).

### D2 (2026-10-19) — Roll save merge accepted; r1 follow-up rulings

- Implementer merged conditions Roll save to `Roll save vs {name} (6+ ends)` although D1's
  wording grouped "conditions remove/save" under keep-label. Accepted: the old tooltip's
  "(6+ ends)" is not in the label, so the general rule (merge) applies; D1's parenthetical
  was the owner's guess at the strings, not a rule.
- Follow-up `StaminaEditModal.ts` (~608-616) direct `tooltip()` on an iconButton's `buttonEl`:
  reviewer to check whether it writes a string different from the label (if so it overwrites
  the accessible name). Fold into the fix round either way (route through `setLabel`).
- Follow-up `visual-harness/sc379/mock.js:283` mock labels: DROP — harness mock, not painted,
  no user or test reads it.
- Follow-up `dse-7.0.0-release-audit.md:439` lists SC-324 as open: FOLD into the fix round
  (mark it fixed with the sha).

### D3 (2026-10-19) — r2 review rulings (review: sc324-r2-review.md, APPROVE-WITH-FIXES)

- M1 StaminaEditModal Spend Recovery disabled reason replaces the name: FOLD. Label becomes
  `Spend Recovery: <reason>` via `setLabel` (colon separator, matching Respite). Keep the
  SC-428 `test.failing` marker failing for the right reason: change its `.not.toBe(...)` to
  `.not.toContain(...)`; SC-428 is NOT fixed by this ticket. Update the listed jest + e2e
  assertions; check e2e knownBug markers for SC-428 the same way.
- M2 RecoveriesStrip read-only Catch Breath (`setTooltip` makes the reason the whole name):
  FOLD. `setLabel('Catch Breath: Read-only in this context')` + a jest end-state assertion.
- L1 `visual-harness/obsidian-lifecycle.mjs:881` exact `aria-label="Advance round"` selector:
  FOLD. Use `.dse-init__round-advance`.
- L2 direct `aria-label` writes do not refresh an on-screen tooltip: FOLD. Kit `setLabel`
  routes through kit `tooltip(buttonEl, label)` (Obsidian setTooltip writes aria-label AND
  refreshes a showing tooltip). Mount path may keep the bare attribute write (nothing is
  showing at mount). Update the spy test at `iconButton.test.ts:207-216` to the new truth,
  still asserting the rendered aria-label end state.
- L3 Complete Argument wording: FOLD only the grammar fix ("Requires a Power Roll tier to be
  selected."). The rest is pre-existing copy — DROP (not this ticket's scope).
- I2 separator split (`MinionStaminaPoolModal.ts:396` em dash): DROP — pre-existing,
  cosmetic, outside the touched buttons. New strings in this ticket use a colon.
- I4 release-audit line: already folded in D2.
- I1, I3, I5: no action.

### D4 (2026-10-19) — dispatcher: rebase onto dse origin/develop 7644fb3 before land-ready

Dispatcher message (verbatim): "dse origin/develop moved 0d69ec9 → 7644fb3 (SC-430 landed:
stamina + minion-pool modal Apply draft fix). New dse-verify CURRENT baselines: jest 4761
passed / 1 skipped / 227 of 228 suites · lifecycle 25/25 · e2e 61/72 ok, 0 failed, 11
known-bug, coverage 47/47 pairs · shots 572 · freeze 276/276 · parity 0/0/24 DECLARED. Rebase
onto 7644fb3 before reporting land-ready."
Plan: let the r4 scoped re-review (on 7b8dacc) finish untouched, then an implementer rebase
round (SC-430 touched StaminaEditModal — expect conflicts with M1), then a scoped review of
the conflict resolution only.

### D5 (2026-10-19) — r4 scoped re-review APPROVE (sc324-r4-rereview.md); INFO rulings

- I1 (exact enabled-state aria-label selectors in obsidian-camera.mjs:186, docs-manifest.mjs:589): DROP — correct today, fixtures open enabled.
- I2 (release-audit line pins sha 2b7ad20): FOLD into the r5 rebase — the rebase rewrites that
  sha. Reword the audit line to cite the ticket ("fixed by SC-324") instead of a sha.

### D6 (2026-10-19) — LAND-READY

dse `sc324-kit-tooltip` @ `f8e050f` on origin/develop `7644fb3` (range-diff vs reviewed 7b8dacc: all 4 patches `=`; only new commit f8e050f is the D5 one-line audit doc reword, owner-checked). Superproject worktree commits cfb7c00, 9058a6a (CHANGELOG + D2 spec); submodule pointer bump left unstaged for wt-finish.
Gates (r5): tsc/lint clean · jest 4767/1 skipped/227 of 228 · lifecycle 25/25 · e2e 61/72 ok, 0 failed, 11 known-bug, 47/47 · shots 572 0 FAIL · freeze 276/276 · parity 0/0/24.
Review: r2 APPROVE-WITH-FIXES → r3 fixes → r4 scoped re-review APPROVE (independent reviewer).
