# SC-426 r2 independent review — dse `sc426-detail-stamina` @ 0d1c0cf (base f8e050f)

## Executive summary
- Verdict: **APPROVE**. Findings: 0 CRITICAL, 0 HIGH, 0 MEDIUM, 1 LOW (an inaccurate comment, no code change needed), 6 INFO.
- Gates, re-run by the reviewer on 0d1c0cf: tsc and tsc -p e2e clean · lint exit 0 · jest 4769 passed / 1 skipped / 227 of 228 suites · lifecycle 25/25 (port 9293) · e2e `62/72 ok, 0 failed, 10 known-bug, coverage: 47/47 pairs` · shots 572 PNGs, 0 FAIL · freeze OK 276/276 · parity 0 gaps / 0 undeclared / 24 declared. All exit codes 0, all equal to the implementer's numbers.
- Mutation test (src/elements/initiative/view.ts reverted to f8e050f, tests kept): the jest matrix gives 4 failed / 19 passed (exactly the 4 new or converted E12 detail tests). The e2e `INIT-STAM-B2` FAILS with `Expected "50/60" Received "60/60"`. Neither test is vacuous.
- Reviewer probes (13 jsdom tests): 13/13 pass with the fix and 11/13 fail on base. They cover the thresholds, two groups that share keys, two trackers, selection changing mid-modal (both directions), the real click-click-dblclick order, a second creature, temp Stamina, and a squad captain with and without the bonus crossing.
- DOM-stamp deviation: correct, and stricter than the spec guard. The ticket's own fixture (quick-start) has no `selectedInstanceKey`, and the spec guard would miss it. The lookup is scoped to the closure's group element, not the whole document.
- Calls without `group`: harmless. `group` is only read on squad-minion branches, and squad minions never reach this callback. Drop.
- The 0x0 second root is **pre-existing on f8e050f and is not a leak**. It is Obsidian's hidden Live Preview editor widget: present before any write, a constant 2 registry entries across 4 writes, and released and replaced on navigation. Recommend drop.

## Scope reviewed
`git diff f8e050f..0d1c0cf`: src/elements/initiative/view.ts (+31/-6), test/dom/elements/stamina-entry-points-matrix.test.ts, e2e/specs/initiative/stamina-entry.e2e.ts, CHANGELOG.md.
The working tree was clean before and after (`git status --porcelain` empty on the branch worktree). The scratch `git worktree add` was removed and pruned.

## Findings

### LOW-1: the comment overclaims what the apply-time lookup survives
- Where: src/elements/initiative/view.ts:1851-1854, the `detailHandlesFor` doc comment: "Looked up at apply time, so a row rebuilt while the modal was open is still found". r1 report § "The fix" says the same.
- When it holds: a re-draw of the detail row caused by a selection change. That path empties and re-stamps the same `.dse-init__detail` container.
- When it fails: a whole-view rebuild (`update()` via `rebuildAndPersist`) while the cell modal is open. The closure's `groupBodyEl` is then detached, so the lookup finds the detached row. Probe P12 shows this: after Apply the note gets `current_stamina: 10`, but the live cell and the live detail both read 40/40.
- Scope: the cell refresh has had this limitation all along, so this is not a regression. It is also not reachable in real Obsidian. The modal backdrop blocks the chrome Reset items. An external edit releases the view, and `this.register(() => this.activeModal?.close())` (view.ts:118) then closes the modal. The captain bonus crossing rebuilds inside the callback, after the refresh.
- Fix: change the comment only, to something like "Looked up at apply time, so a detail row re-drawn by a selection change while the modal was open is still found." No code change.

### INFO-1 (round-1 item 1): DOM-stamp guard vs `group.selectedInstanceKey === instanceKey`
- Verdict: correct in every case probed, and strictly more robust than the spec's guard.
- P0: `test/fixtures/initiative/quick-start.yaml` has no `selectedInstanceKey`. The detail row falls back to the first instance (view.ts:1561-1571), so the spec guard would be false for the ticket's own repro whenever no click came first, as in the jsdom dblclick tests. The stamp reflects what is actually on screen.
- Real-Obsidian equivalence: a pointer double-click fires two clicks first. Their `onClick` (view.ts:1626-1649) sets `selectedInstanceKey` and re-draws the detail row, so the two guards agree in practice. P6 (click, click, dblclick on the non-selected 0-3) gives a detail row of 0-3 at 15/40, Winded.
- Selection changes mid-modal:
  - P4 (open on 0-1, select 0-2, Apply): the detail shows Orc #2, untouched at 40/40 / 40 / healthy, and cell 0-1 reads 10/40.
  - P5 (open on 0-2, select 0-2, Apply): the detail follows at 10/40 / 10 / winded.
  - Neither case is reachable by pointer in Obsidian (the modal backdrop is in the way), but both behave correctly.
- Wrong tracker or group: the lookup is `groupBodyEl.querySelector(':scope > .dse-init__detail')`, using the closure's group element, not the whole document.
  - P2: two groups with identical keys 0-1..0-3. Editing group B leaves group A byte-identical.
  - P3: two trackers of the same source. Only the edited tracker changes.
  - Pane+embed in real Obsidian: the other copy is a separate view and DOM, and SC-340 G-S4 rebuilds it fresh from the file (writer-only adoption). Lifecycle 25/25 includes G-S4.
- Stale stamp: none possible. `data-detail-key` is set unconditionally in `buildDetailedCreatureRow` (view.ts:1733), and the container is built only together with a row.

### INFO-2 (round-1 item 3): `updateStaminaDisplay` / `refreshRowStamina` called without `group`
- `group` is read only behind `group?.is_squad && creature?.squad_role === 'minion'`: `updateStaminaDisplay` (view.ts ~1949) and `staminaSpecFor` (view.ts ~995, which `refreshRowState`, `refreshRowStamina` and `refreshCellGauge` all use).
- Both callers of `openCreatureStaminaModal` send squad minions to `MinionStaminaPoolModal` instead (grid view.ts:1660, detail view.ts:1779). P11 confirms the grid route opens "Minion Stamina Pool".
- A creature with `squad_role: minion` in a non-squad group fails the `is_squad` half of the guard, so `group` does not matter there either.
- Captain: P9 gives 15/40 / 15 / winded. P10 (crossing to 0, then the coarse rebuild) gives 0/40, "Dead".
- The omission matches the pre-existing calls in the same callback (cell refresh, detail-route refresh). Recommend drop.

### INFO-3 (round-1 item 4): the second 0x0 initiative root is pre-existing on f8e050f and not a leak
Repro: a scratch e2e probe `[PROBE-ROOTS]` opens `Initiative/tracker.md` in Reading view, makes 4 cell edits, waits 3.5 s, navigates away and comes back. At each step it records every top-level `[data-dse-element="initiative"]` root and the plugin's `viewRegistry`. It was run on base source (src byte-identical to f8e050f) and on the fix.
- What it is: `.markdown-source-view .cm-editor … .cm-preview-code-block.cm-embed-block > .block-language-ds-initiative`, the code-block widget of the **hidden Live Preview editor** in the same leaf. It is 0x0 because the editor is hidden in Reading mode.
- Pre-existing: on base the root is already there at `0-open`, before any write. It is a registered, unreleased view, with 2 registry entries and 2 misses.
- Why it shows old values: the hidden editor's widget is never re-drawn by the writes. It reads 60/60 through all 4 writes, on base and on the fix alike. The Reading root is the one that claims each write (claims 1→4).
- Not a leak, by the G-S6i "no leak" expectation:
  - The registry stays at size 2 / 2 live across 4 writes and the 3.5 s wait.
  - Navigating away releases both entries and creates 2 fresh ones (releases 0→2, size 2).
  - Navigating back does the same again (releases 2→4, size 2). The new hidden root is fresh (56/60).
  - Nothing accumulates.
- Branch-caused: no. The fix run has the identical shape. The only difference is that on the Reading root the detail follows the cell (base: cell 59/60 with detail 60/60, then 58/59, then 57/58, so the detail lags one edit behind because the dblclick's clicks re-draw it from the pre-edit model; fix: equal at every step).
- Recommendation: DROP. If the owner wants anything, the only latent question is whether that hidden view shows fresh numbers when the user switches the leaf to Live Preview after Reading-mode writes. SC-340 G-S6c already covers the Reading↔Live Preview round trip.
- Evidence: roots-base.json and roots-fix.json (paths below).

### INFO-4 (round-1 item 2): the rewritten e2e assertion is not vacuous
- `toHaveElementProperty('textContent', '50/60')` on `init.detail.stamina` FAILS on base view.ts with `Expected: "50/60" Received: "60/60"`. Bundle copied to evidence (below).
- The extra bar assertion (`.dse-init__detail > .dse-init__bar .dse-stamina__ccur` toHaveText '50') reads text that is visible in Steel, and it passes with the fix.
- The marker is removed correctly: `knownBug(...)` → `it(...)`, ID kept, comment rewritten, and `failsWith` dropped.
- The jest `[known bug SC-426]` suffixes are gone. No other `SC-426` / `INIT-STAM-B2` references remain in the dse repo.

### INFO-5: the change reuses the existing refresh path
- The fix calls the same three refreshers the detail route uses (`updateStaminaDisplay`, `refreshRowState`, `refreshRowStamina`) on handles found at apply time. It adds no parallel repaint code.
- Thresholds through the cell route (P1):
  - 20 gives 20/40 / 20 / winded
  - 0 gives 0/40 / 0 / dying ("Dead")
  - -3 is clamped by the modal to 0/40 ("Dead")
  - 40 gives 40/40 / 40 / healthy
- Temp (P8): 15(+7)/40, bar 15, ctemp +7, chip winded. Second creature (P7): Troll 1-1 gives 50/150, Winded.
- First paint changes only by the `data-detail-key` attribute: freeze 276/276 and parity 0/0/24 are unchanged.

### INFO-6: CHANGELOG and housekeeping
- The CHANGELOG bullet (CHANGELOG.md:25-30) is accurate, in plain user language, and in the same `[FIX] **…** (SC-nnn).` style as its neighbours.
  - Nit, optional: in practice a double-click selects the creature first, so the closing sentence ("Editing a creature the detail row is not showing still leaves the detail row alone") describes a case a mouse user cannot reach. It is harmless.
- Unrelated to the branch: the shared main checkout's `workspace/draw-steel-elements` is dirty.
  - `M demo-vault/Welcome.md`, plus untracked `compendium-manifest.json` and `demo-vault/montage 1.md`.
  - mtimes are 2026-10-19 10:35:06, before this review started. The reviewer did not cause it.
  - `just deploy*` will hard-abort on it. Flagged so the owner or dispatcher knows.

## Measured numbers (reviewer, 0d1c0cf)
| Gate | Result | rc |
|---|---|---|
| tsc (incl. -p e2e) | clean | 0 |
| lint | clean (only the .eslintignore warning) | 0 |
| jest | 4769 passed / 1 skipped; 227 of 228 suites | 0 |
| lifecycle | 25/25 ok, 0 failed (DSE_LIFECYCLE_PORT=9293) | 0 |
| e2e | 62/72 ok, 0 failed, 10 known-bug, coverage 47/47 | 0 |
| shots | 572 PNGs, 0 FAIL | 0 |
| freeze | OK 276/276 | 0 |
| parity | 0 gaps, 0 undeclared, 24 declared | 0 |
| mutation: matrix test on base view.ts | 4 failed / 19 passed | 1 (expected) |
| mutation: e2e INIT-STAM-B2 on base view.ts | FAIL, Received "60/60" | 1 (expected) |
| reviewer probes (jsdom) | fix 13/13 pass; base 11/13 fail | 0 / 1 |

## Evidence
Scratch root: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc426r2/
- logs/{tsc,tsc-e2e,lint,jest,lifecycle,e2e,shots,freeze,parity}.log, with the matching .rc files
- logs/jest-mut-matrix.log: the matrix test against base view.ts
- logs/e2e-mut-B2.log, plus evidence/base-INIT-STAM-B2-bundle/: B2 against base view.ts
- logs/probe-fix.log, logs/probe-base.log; probe source probes/sc426-r2-probe.test.ts
- logs/roots-base.json, logs/roots-fix.json, logs/e2e-probe-{base,fix}.log; probe source probes/zz-sc426-roots-probe.e2e.ts
- branch e2e run bundle dir: draw-steel-elements/e2e/.out/20261019-151600-8bae (green run; no failure bundles)
