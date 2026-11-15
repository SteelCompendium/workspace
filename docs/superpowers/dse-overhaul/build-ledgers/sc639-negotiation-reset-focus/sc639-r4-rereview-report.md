# SC-639 r4 scoped re-review: the r3 delta (dse a9f0af1d on 5f962390; superproject 6f657662 on f97c41bc)

## Executive summary

- **Verdict: LAND.** 0 BLOCKER, 0 HIGH, 0 MEDIUM, 0 LOW, 2 INFO. The r2 findings LOW-1 and LOW-2 are both closed.
- **Rebase fidelity:** `range-diff e1be1775..8ef9b641 5f962390..a9f0af1d` shows `5d17cd17 = 9ff629eb` and `8ef9b641 = cf40dd36`, both patch-identical. The only new commit is `a9f0af1d`, which touches tests and the e2e driver only. The diff from 5f962390 does not touch `NegotiationData.ts`, `ArgumentView.ts` or `src/framework/`.
- **SC-649 overlap:** both sides are kept. Against 5f962390, `negotiation-bugs.test.ts` differs only on the K05 line. `e2e/driver/negotiation.ts` differs only in the SC-639 hunks, and SC-649's `GHOST_APPEAL` is still there.
- **LOW-1:** NEGO-F08 (Reading view, seal reached by Tab) and NEGO-L09 (Live Preview) drive a real mouse press on the options button and a real mouse click on Reset, and expect `ctl: 'negotiation.menu', ring: true`. Each id appears once and the titles carry no ticket id. Both go red with `view.ts` reverted and with the no-restore mutant.
- **LOW-2:** `ring` reads `:focus-visible`, and F01, L03, F08 and L09 assert `ring: true`. As r3 reported, the `ring: false` mutant survives all four e2e tests. The new jsdom test is not vacuous: `ring: false` turns it red at line 802 (`focusVisible: true` expected), and `ring: true` turns it red at line 816 (no `focusVisible` expected).
- **Superproject:** origin/main `f97c41bc` (fetched), with exactly 2 commits on it. `3814730a` touches only `CHANGELOG.md`: one accurate bullet at the top of `## Unreleased`. `6f657662` changes only the gitlink, from 5f962390 to `a9f0af1d`, which is the final plugin head. No commit carries co-author or AI attribution.
- **Gates on a9f0af1d:** jest fresh `2 skipped, 13353 passed, 13355 total` (rc 0). e2e full `OBSIDIAN-E2E done: 607/620 ok, 0 failed, 13 known-bug, coverage: 417/417 pairs` (rc 0). Both match r3.
- **State:** the dse and superproject worktrees were clean before and after. HEADs are unchanged (`a9f0af1d` / `6f657662`), and every mutant was restored with status empty.

## Findings

### INFO-1: keep the e2e ring assertions

They do not kill the `view.ts:204` mutant, because Chromium shows the ring on a script focus after any earlier key press, as measured here. They do guard what the user sees: a landing with no ring at all, for example if a later change moved the hand-off to a path where the modality is cleared. They cost one field each and cannot flake on the fixed path, because `focusControl` passes `focusVisible: true` (`HANDOFF_FOCUS`, `src/framework/chrome/focusHandoff.ts:37`) whenever the token's ring is true. The jsdom test (`test/dom/elements/negotiation-matrix.test.ts` ~787-823) is what pins `view.ts:204`, in both directions.

### INFO-2: NEGO-L09 puts focus on the seal by script

It uses `dse.focusByScript` to put focus on the seal, not on the menu (`e2e/specs/negotiation/live-preview.e2e.ts`, NEGO-L09). Everything after that is a real mouse press and a real mouse click. This matches the Live Preview convention (NEGO-L01: a real Tab from the editor would indent the note) and is acceptable. NEGO-F08 reaches the seal with a real Tab.

## Measurements

| Run | Result |
|---|---|
| jest, `ring: false` mutant | `1 failed, 409 passed`: the ring test, line 802 |
| jest, `ring: true` mutant | `1 failed, 409 passed`: the ring test, line 816 |
| e2e F01/F08/L03/L09, `view.ts` reverted to 5f962390 | 0/4 ok. F01 and F08: `ctl null, inCard false, ring false`. L03 and L09: timed out waiting for focus on the options button. |
| e2e same 4, no-restore mutant | 0/4 ok, same failures |
| e2e same 4, `ring: false` mutant | 4/4 ok (survives, as r3 reported) |
| jest fresh (shots css cache moved aside, then restored) | `Test Suites: 1 skipped, 291 passed`; `Tests: 2 skipped, 13353 passed, 13355 total` |
| e2e full | `607/620 ok, 0 failed, 13 known-bug, coverage: 417/417 pairs`, 77 spec files in 5:38; F01, F05-F08, L03, L07-L09 all ok |

## Evidence

All files are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc639-r4-a4a46cd240c97ef4f/`:

- `range-diff.txt`
- `mutant.sh`, `jest-fresh.sh`, `e2e-only.sh`
- `mut-j-ringfalse.log`, `mut-j-ringtrue.log`, `mut-e-revert.log`, `mut-e-norestore.log`, `mut-e-ringfalse.log`, with matching `mut-*.diff` and `mut-*.status-after.txt`
- `jest-full.log`, `e2e-full.log`, `e2e-full.status-after.txt`
