# SC-324 round 4: scoped re-review (delta 0afcb2f..7b8dacc, superproject cfb7c00..9058a6a)

**Executive summary**
- Verdict: **APPROVE.** Every folded finding (M1, M2, L1, L2, L3-grammar, release-audit line) is fixed. No new defects. HIGH 0, MEDIUM 0, LOW 0, INFO 2.
- Reviewed: dse `sc324-kit-tooltip` @ `7b8dacc` (fix `2b7ad20`) and superproject `9058a6a`. The branch is unmodified, and `git status --porcelain --ignored` is identical before and after.
- Gates (my runs): jest `4738 passed / 1 skipped / 227 of 228 suites`; e2e `59/71 ok, 0 failed, 12 known-bug, coverage: 47/47 pairs` (SC-428 RECOV-R03/R08 still known-bug); shots re-run at 7b8dacc 572 PNG, 0 FAIL; freeze `freeze OK (276/276 …)`.
- Mutations: 8 of 8 fix-reverting mutations go red. Baseline across the 8 touched suites is 516/516 green.
- SC-428 Q16: run as a plain `test`, it fails with `Received string: "Spend Recovery: Already at maximum Stamina"`, so the bug is still present and the `test.failing` is red for the right reason. A mutation that changes the reason text makes the marker go red, so the marker can still detect a real fix.
- L2 in real Obsidian 1.14.4: hover Spend Recovery, then press Enter on the last Recovery. The visible tooltip updates live to "Spend Recovery: No Recoveries remaining". Control run with `setLabel` reverted to a bare `setAttribute`: the visible tooltip stays stale ("Spend Recovery"). The fix is load-bearing. The mount path is still a bare write, pinned by a test.

Evidence: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc324-r2/`. Files: `r4-mutation.log`, `r4-probe-fix.log`, `r4-probe-mutant.log`, `jest-r4-1792418317.log`, `e2e-r4-1792418317.log`, `shots-r4-1792418317.log`, `freeze-r4-1792418317.log`. The scratch repo copy with the probe scenario is `copy4/`.

---

## 1. Each folded finding

| Finding | Change verified | Probe |
|---|---|---|
| M1 Spend Recovery reason replaced the name | `StaminaEditModal.ts:188` `spendRecoveryReasonLabel` gives `Spend Recovery: <reason>`, set via `setLabel` in both the tracked (:607-613) and untracked (:618) branches. The `tooltip` import is removed. | D1 (helper returns bare reason): 9 red. D6 (tracked re-enable keeps the reason): 13 red. D7 (untracked bare reason): 2 red. |
| M2 read-only Catch Breath | `RecoveriesStrip.ts:278` `catchBreath.setLabel(\`Catch Breath: ${opts.readOnlyTooltip}\`)` | D2 (bare reason): 2 red (heroSheet read-only, staminaRecoveries canPersist:false) |
| L1 lifecycle selector | `obsidian-lifecycle.mjs:881` uses `.dse-init__round-advance`. The class is added right after mount (`initiative/view.ts` `.buttonEl.addClass`). | Implementer's lifecycle 25/25 (G-S4 included). Not re-run. |
| L2 stale on-screen tooltip | `iconButton.ts:137-139` `setLabel` calls `tooltip(buttonEl, label)` (Obsidian `setTooltip`, no options). Mount `:116` is still the bare `setAttribute`. | D3 (setLabel back to setAttribute): 1 red. D4 (mount via tooltip): 2 red. Real-Obsidian probe: live refresh with the fix, stale in the control run (above). |
| L3 grammar | `ArgumentView.ts:400` "Requires a Power Roll tier to be selected." | D5 revert: 1 red |
| Release audit | `dse-7.0.0-release-audit.md:439` "fixed in dse 2b7ad20" | n/a (see I2) |
| SC-428 marker | `stamina-edit-modal-matrix.test.ts:512` `.not.toContain('Already at maximum Stamina')` | Plain-`test` run: received "Spend Recovery: Already at maximum Stamina" (bug still present). D8 (reason text changed): Q16 goes red, so the marker can still detect a fix. |

`setLabel` routing in real Obsidian: `setTooltip(e,t,undefined)` = `setAttribute("aria-label",t)`, then `rS(e,{})` (a no-op without options), then `WM===e&&ZM(…)` (refreshes only a tooltip that is showing; `ZM` guards an empty `t`). So every existing `setLabel` caller gets the same attribute write plus the refresh, and no `data-tooltip-*` attributes. Callers: hero/chrome Collapse/Expand, initiative selection, migration "Stopping…", MinionStaminaPoolModal, and `setButtonText`. In the jest/harness shims, `setTooltip` writes `aria-label` (`test/mocks/obsidian-core.ts:1294`; `visual-harness/shim/obsidian.ts` re-exports it). Harness shots and freeze are therefore unaffected, which the fresh shots + freeze run confirms.

## 2. Regressions in touched files

None found.
- The e2e STAM-Q09/Q10 assertions were updated and pass. The SC-428 e2e knownBugs (RECOV-R03/R08) assert disabled state, not aria-label, and are still known-bug.
- The exact-label harness selectors left in place (`obsidian-camera.mjs:186` `button[aria-label="Spend Recovery"]`, `docs-manifest.mjs:589` `button[aria-label="Catch Breath"]`) target the enabled/writable state, whose label is unchanged.
- `heroSheet` and `staminaRecoveries` now assert the Catch Breath end state. Before, they could only find the button by its icon.

## 3. INFO

- **I1.** `visual-harness/obsidian-camera.mjs:186` and `docs-manifest.mjs:589` still select by exact enabled-state aria-label. They are correct today. If the camera's modal fixture ever opens Spend Recovery disabled, the shot step misses. No action needed.
- **I2.** The release-audit line pins sha `2b7ad20`. If landing rewrites dse history (squash/rebase), that sha goes stale. `wt-finish`'s fast-forward push keeps it valid.

## 4. Gates (my runs; logs suffix `-r4-1792418317`)

| Gate | Result | rc |
|---|---|---|
| jest | `Tests: 1 skipped, 4738 passed, 4739 total`; `Test Suites: 1 skipped, 227 passed, 227 of 228` | 0 |
| e2e | `OBSIDIAN-E2E done: 59/71 ok, 0 failed, 12 known-bug, coverage: 47/47 pairs` | 0 |
| shots (re-run at 7b8dacc) | 572 PNGs, 0 FAIL | 0 |
| freeze | `freeze OK (276/276 frozen print PNGs byte-identical …)` | 0 |

I did not re-run lifecycle, tsc, lint or parity; the implementer reports them green at r3. The only lifecycle change is the L1 selector, and my two lifecycle probe runs on a copy of 7b8dacc ran without errors.
