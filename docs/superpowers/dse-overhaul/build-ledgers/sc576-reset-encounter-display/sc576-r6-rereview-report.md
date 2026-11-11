# SC-576 r6 scoped re-review — delta `8645685a..fbaba3da`

**Executive summary**
- **Verdict: LAND.** Findings: 0 HIGH · 0 MEDIUM · 0 LOW · 2 INFO.
- MEDIUM-A (r4) is fixed in real Obsidian. The pinned sidebar tracker comes back after the statblock is restored and the tracker note is edited: no card, 2 cells, `30/30`, stage attribute cleared, Reset offered. The control run (a panel pinned while the statblock was already broken) also recovers. The reading view is unchanged: card after Reset, back after a note edit.
- The `update()` override is correct for every caller. There are 3 callers in total, and none passes a new object where the error should stay, or a mutated same object where it should clear.
- The new tests are real. The implementer's mutations A and B fail for the right reasons. My extra mutations C (always clear) and D (no stage-attribute removal) fail too.
- The changelog wording is accurate.
- Gates on `fbaba3da`: initiative jsdom files 306/306 (6 suites) · e2e, run 2: **`251/260 ok, 0 failed, 9 known-bug, coverage: 161/161 pairs`**. Run 1 was `250/260, 1 failed`: RECOV-R07, a write-count race in the stamina-bar recoveries popover under load 30+, outside this delta (INFO-2). Reset bytes are unchanged against base for all 6 fixtures, and the 52-pair after-Reset matrix still passes with writes byte-identical to r4.

## Checks

### (1) Real-Obsidian sidebar probe (`[PRB576R4-03]`) and control (`[PRB576R4-04]`), and the reading view (`[PRB576R4-01]`)
`probe-out/e2e-sb.log`, `shots/r4-e2e-sb.json` (the probe spec is unchanged from r4).

| Step | r4 (`8645685a`) | r6 (`fbaba3da`) |
|---|---|---|
| sidebar after Reset, broken statblock | card, stage `reference` | card, stage `reference`, no Reset item |
| sidebar after statblock restored only | card | card (nothing re-renders the panel, the same as a reload's card) |
| sidebar after the tracker note is edited | **card, 0 cells** | **no card, 2 cells, hero `30/30`, stage attribute gone, Reset offered** |
| control: pinned while already broken, then restore and edit | 2 cells | 2 cells, `30/30` |
| reading view: after Reset / after a note edit | card / tracker | card / tracker (2 cells, `30/30`) |

The two probe tests marked "FAIL" in the log fail only on the e2e invariant that rejects the expected `console.error` (r4 INFO-B). Their bodies ran and recorded everything above.

### (2) Every `update()` caller of `InitiativeView`
A repo-wide search for `.update(` in `src/` and `main.ts` finds 3 callers:
- **`view.ts:190` `rebuildAndPersist` → `update(this.model)`.** Same object, mutated in place, so `loadError` is left alone. That is correct: it can only run from tracker controls, which do not exist while the card is up. Reset turns and Reset encounter are hidden by the `chromeItems()` guard, which LOW-A now pins.
- **`view.ts:233` `rebuildFromWrittenReset` → `update(fresh)`.**
  - On success, `fresh` is a new object, and `loadError` was already cleared at `:218`.
  - On failure, `fresh === this.model`, so the card stays.
- **`src/framework/sidebar/SidebarPanel.ts:321` → `previous.update(model)`.** The model comes from `prepareModel`, which only resolves when parse and ref resolution both succeed; a failure takes the remount branch instead. A new object therefore always means a good model, and clearing is correct.

Host remount and adoption paths (`remountReused`, `replugRemount`, adoption) do not call `update()`. The pipeline's afterRender hook re-mounts the chrome only.
- **Edge, INFO-1, no action:** suppose an outside sidebar refresh lands during the inert await of a Reset. That needs an external edit to the note within the vault-read window. Then the Reset's `update(fresh)` afterwards repaints from the reset bytes, not from the newer external edit. This race predates the delta (r1/r3 design), and the next file-change refresh corrects it. The delta does not make it worse.

- **INFO-2 — RECOV-R07 failed once on load (stamina-bar, not this delta).** First full run: `[RECOV-R07] … Expected: 1 | Received: 2` at `e2e/specs/stamina-bar/stamina-recoveries.e2e.ts:355`, load average 30-34. The note ended correct (`current_stamina: 22`, `recoveries: 3`), but the run recorded 2 modifies.
  - Cause: the popover's `+`/`−` clicks commit through a debounced persist (`src/framework/kit/RecoveriesStrip.ts:212-213`). The test calls `waitForWrite` right after the last `+` click and a `sliderNow()` round trip, so under load the `+` debounce can land after `mark()` and be counted alongside the Catch breath write.
  - It passed alone (`--only=RECOV-R07`) and in the second full run.
  - The delta does not touch stamina-bar code.
  - Suggest a Backlog ticket: in RECOV-R07 (and RECOV-R12's shape), wait for write-idle (`waitWriteIdle`) before the Catch-breath `waitForWrite`.

### (3) Are the new tests real?
- **Implementer's logs** (`…/sc576-impl-r5-t6h2vc/`):
  - `jest-mutA.log` (no `chromeItems` guard): 2 failed, the broken-statblock test at `:727` and the same-model test at `:778`, both `expect(has(root,'init.reset-encounter')).toBe(false)` with Received `true`.
  - `jest-mutB.log` (no clear in `update`): 1 failed, the recovery test at `:766`, which still finds `.dse-error-card`. Both fail for the right reason.
- **My mutations** (`probe-out/matrix-mutC.log`, `probe-out/matrix-mutD.log`):
  - C, `update` always clears: 3 failed. These are the broken-statblock test, the recovery test (through the `brokenThenReset` precondition) and the same-model test, because the failure path now repaints the stale model.
  - D, no `removeAttribute`: 1 failed, the recovery test's `data-dse-error-stage` assertion.
- The view-capture helper restores its `createView` spy right after the mount. The initiative files pass as a set.

### (4) Changelog (`CHANGELOG.md:25-29`)
"damaging a 30-Stamina hero by 5 right after a Reset wrote `current_stamina: -5` instead of 25". This is accurate (r2 base P2, RICH damageHero, where Alice has `max_stamina: 30`), plain, and self-explanatory now. Nothing in it is unbacked.

### Also re-run
The jsdom probe (`probe-out/head.json`, `probe-out/head.log`) gave:
- P1: the DOM after Reset equals a fresh load for 6 of 6 fixtures, and the Reset bytes equal base for 6 of 6.
- P2: 52 of 52 pairs equal, with writes byte-identical to r4's.
- P4-recovery: no card, 10 cells, no stage attribute, `chromeItems()` = 2. A same-model update keeps the card.
- P5: inert cleared on both the success path and the throw path.
- The 2 squad damage-creature failures are the known harness limitation.

## Gates (`fbaba3da`, branch worktree)
| Gate | Result |
|---|---|
| initiative jsdom files (`npx jest test/dom/elements/initiative`) | `Test Suites: 6 passed`, `Tests: 306 passed`, rc 0 |
| e2e full, run 1 | `OBSIDIAN-E2E done: 250/260 ok, 1 failed, 9 known-bug, coverage: 161/161 pairs`, rc 1. The failure is RECOV-R07 (INFO-2). Bundle copied to `gates/RECOV-R07-bundle/`. |
| e2e `--only=RECOV-R07` | `1/1 ok`, rc 0 |
| e2e full, run 2 | `OBSIDIAN-E2E done: 251/260 ok, 0 failed, 9 known-bug, coverage: 161/161 pairs`, rc 0. INIT-X01..X06 ok, INIT-X07 known-bug SC-575. Known bugs: SC-257, SC-384, SC-580, SC-355, SC-577, SC-578, SC-588, SC-575, SC-572. |

The delta touches only `update()`/`onMount` on the initiative view, tests and the changelog, so tsc, lint, the rest of jest, lifecycle, shots, freeze and parity were not re-run. The implementer's battery on this head stands: jest 7056/1, lifecycle 52/52, shots 592/163/147, freeze 280/280, parity 0/0/24. The branch worktree's `git status --porcelain` is clean before and after, and the probe worktree is removed.

## Evidence (under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc576-rev-r6-p7x2qd/`)
- Real-Obsidian probe: `probe-out/e2e-sb.log`, `shots/r4-e2e-sb.json`, and the spec copy `zz-probe-sc576-r4.e2e.ts.txt`.
- jsdom probe: `zz-sc576-probe.test.ts.txt`, `probe-out/head.json`, `probe-out/head.log`.
- Mutations: `probe-out/matrix-mutC.log`, `probe-out/matrix-mutD.log`.
- Gates: `gates/jest-init.log`, `gates/jest-init.rc`, `gates/e2e.log`, `gates/e2e.rc` (run 1), `gates/RECOV-R07-bundle/`, `gates/e2e-r07.log`, `gates/e2e2.log`, `gates/e2e2.rc` (run 2).
