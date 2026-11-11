# SC-576 r4 scoped re-review — delta `2b1525ba..8645685a` (fix `fddfb7b3`, e2e `8645685a`)

**Executive summary**
- **Verdict: FIX-FIRST (small).** One MEDIUM blocks: after Reset draws the error card, `loadError` never clears on the view. A pinned **sidebar** tracker therefore stays an error card even after the statblock is restored and the note changes. Reproduced in real Obsidian. A control run of the same steps, starting from a normal reload error card, recovers. The fix is about 4 lines and was proven in the probe worktree.
- Findings: 0 HIGH · 1 MEDIUM · 1 LOW · 3 INFO.
- MEDIUM-1 (r2) is otherwise fixed. The card has the reload's stage (`reference`), title and message, byte for byte. There are no Dying heroes and no stale controls, and the Reset items are gone. Reading view recovers on an edit to the tracker note or on a re-render (a reload).
- LOW-1 (r2) is fixed. `inert` and `aria-busy` are set during the await and cleared on both the success path and the throw path. The root that carries them is the same node that is still in the DOM.
- MEDIUM-2 (r2) is fixed. With `update(fresh)` turned into a no-op, the new INIT-X05 now FAILS: `Expected "Round 1" | Received "Round 2"`.
- Note bytes are unchanged against base for all 6 fixtures. The 52-pair after-Reset matrix still passes, with writes identical to r2's head. The 3 new jsdom tests are real (2 fail on `2b1525ba`'s view), they pass in random order, and they leak nothing.
- Gates on `8645685a`: jest **7053 passed / 1 skipped, plus 1 SC-568 `twin-reuse` timeout; that suite passes 53/53 alone, so 7054 effective** · e2e **`251/260 ok, 0 failed, 9 known-bug, coverage: 161/161 pairs`**, rc 0.

## Findings

### MEDIUM-A — `loadError` is sticky: a pinned sidebar tracker never leaves the error card
`src/elements/initiative/view.ts:123,134,218-221`. `loadError` is set on a failed re-parse and cleared only inside `rebuildFromWrittenReset`. That method cannot run again, because `chromeItems()` returns `[]` while `loadError` is set (`:268`). Every later `update(model)` on the same view reaches `onMount` (`:134`) and draws the card again, whatever model it is handed. In the reading view that does not matter: an edit to the note builds a new section and a new view. The sidebar is different. `SidebarPanel.handleExternalChange` takes a fast path, `prepareModel(def, body)` then `previous.update(model)` on the SAME view (`src/framework/sidebar/SidebarPanel.ts:315-321`). A valid, freshly prepared model is drawn as the old error card.
- **Scenario:** an initiative tracker is pinned to the sidebar. Its `statblock:` note stops resolving, and the user presses Reset → Yes in the sidebar. The error card is correct at this point. The user then restores the statblock note and edits the tracker note (or Sync touches it). The sidebar panel still shows "Initiative tracker: failed to render (reference)" with no Reset items. Only unpinning and re-pinning, or reloading the sidebar, brings the tracker back. The reading view of the same note recovers.
- **Probe, real Obsidian** (`[PRB576R4-03]` vs control `[PRB576R4-04]`, `probe-out/e2e-r4probe2.log`, `shots/r4-e2e-r4probe2.json`):
  - After Reset in the panel: card, stage `reference`.
  - After restoring the statblock: card.
  - After a tracker-note edit: **card, 0 cells**.
  - Control, the same panel pinned while the statblock was already broken (a pipeline error card, no view): after the same restore and note edit it shows **2 cells, hero `30/30`**.
  - Screenshots: `shots/r4-03-sidebar-error-card.png`, `shots/r4-03-sidebar-after-note-edit.png`.
- **Probe, jsdom** (`P4-recovery`, `probe-out/head.json`): statblock restored, `prepareModel` succeeds, then `view.update(model)`. The card is still drawn: 0 cells, `chromeItems()` = 0.
- **Prescribed fix (verified):** `probe-out/prescribed-fix.diff`.
  - An `update()` with a model from outside is a successfully prepared model, so clear the error then. The Reset's own failure path calls `update(this.model)`, so the same-model check keeps the card there and for same-view repaints such as a preference change.
  - Also drop the stale stage attribute the card left on the root.
  ```ts
  async update(model: EncounterData): Promise<void> {
  	if (model !== this.model) this.loadError = undefined;
  	await super.update(model);
  }
  // in onMount, after the loadError branch:
  root.removeAttribute('data-dse-error-stage');
  ```
  - With it: P4-recovery shows 10 cells, 2 hero controls, no stage attribute and `chromeItems()` = 2. A same-model update still draws the card. The matrix file is 125/125.
  - Pin it with a jsdom test shaped like P4-recovery: fail the Reset, restore the vault, `prepareModel`, `view.update(model)`, then expect the tracker.
  - The `removeAttribute` matters: `styles-source.css:79-98` keys feature-card ornaments on `:not([data-dse-error-stage])`. Initiative has no such rule today, so this is hygiene rather than a visible bug.

### LOW-A — the `chromeItems()` guard is untested
`view.ts:268`. Mutation: removing `|| this.loadError` leaves `initiative-matrix.test.ts` at 125/125 green (`probe-out/matrix-m3only.log`). Without the guard, "Reset turns" on the error card runs `resetRound` on the un-normalised reset model. It then goes through `rebuildAndPersist`, which writes that model. **Fix:** in the broken-statblock `[X05]` test (`initiative-matrix.test.ts:706`), add `expect(has(root, 'init.reset-encounter') || has(root, 'init.reset-turns')).toBe(false)`. The chrome is mounted into the root in jsdom (P4 shows `chrome.expand`/`chrome.collapse` there), so the ids are reachable.

### INFO
- **INFO-A — the card after Reset carries the chrome panel; a reload's card does not.** jsdom P4 children: `dse-error-card, dse-chrome-summary, dse-chrome`, against `dse-error-card` alone on reload. This happens because `update()` runs the pipeline's afterRender hook. It is harmless, and arguably useful. Collapse goes to the session store, not the note, so the note bytes were unchanged after collapse and expand in `[PRB576R4-01]`. The collapsed bar reads "Initiative (round 1 · 1v1)" (`shots/r4-01-error-card-collapsed.png`). Pin re-runs the pipeline, so the sidebar shows the reload card. No action.
- **INFO-B — the failure path logs a `console.error`, which the e2e invariant checker treats as a page error.** Any future e2e of this path needs that error allowed. The implementer added none, so nothing breaks today.
- **INFO-C — CHANGELOG** (`CHANGELOG.md:25-29`): accurate, plain, and each claim is backed. The screen claim is proven by r2 P1 and INIT-X05/X06. The `-5` claim reproduces in r2 base P2 (`RICH` damageHero: `current_stamina: -5` against the oracle's `25`). One clarity nit: "instead of 25" assumes a 30-Stamina hero, so "a hero at 30/30" would make it self-explanatory. It does not mention the new error card for a statblock that stopped resolving. That is optional; a reader would not miss it.

## Checks the owner asked for (§1-6), verified
1. **MEDIUM-1 fix.** In jsdom P4 the card after Reset equals a reload of the written note in the same broken vault: same `data-dse-error-stage="reference"`, title `Initiative tracker: failed to render (reference)`, and an identical message. The only difference is the chrome (INFO-A). Real Obsidian `[PRB576R4-01]` shows the same card (`shots/r4-01-error-card-after-reset.png`), 1 write, and correct note bytes. There is no thrown access and no half-drawn toolbar; the chrome draws whole. Recovery in the reading view:
   - Restoring the statblock note alone leaves the card, the same as a reload's card (nothing re-renders the tracker).
   - An edit to the tracker note gives the tracker back (2 cells, `30/30`).
   - A `previewMode.rerender(true)` (a reload) gives it back (`[PRB576R4-02]`).
   - The sidebar does not recover: MEDIUM-A.
2. **LOW-1 fix (P5, jsdom).** During a gated resolve, `inert` and `aria-busy="true"` are set, the root is still connected, and it is the view's `rootEl`. After release both are cleared and there are 10 cells. On the throw path both are set during the wait and cleared after, with the card shown. Mutation: deleting the `finally` cleanup fails both new `[X05]` tests (`Expected: false / Received: true` on `inert`). The `new Set([root, this.rootEl])` cleanup covers a root swap. Adoption moves the same node, which matches P5's `sameRoot: true`. jsdom cannot show that `inert` blocks clicks; Chromium enforces `inert` natively.
3. **MEDIUM-2.** With the no-op `update(fresh)` mutation, e2e gives `INIT-X01 ok`, **`INIT-X05 FAIL: … Expected: "Round 1" | Received: "Round 2"`**, and `INIT-X06 ok` (`probe-out/e2e-m2-norebuild.log`). X06 alone is still blind to it, which is acceptable now that X05 is not.
4. **New jsdom tests.** Against `2b1525ba`'s `view.ts`, the broken-statblock and inert tests fail (`probe-out/matrix-m-r2view.log`, 2 failed / 123 passed). The merged-names test passes on both heads; it guards the SC-485 leak, not this delta, so that is expected. The `vault` arg switches only that mount to real timers, and the `[X]` block's `afterEach` restores real timers anyway. The full file passes with `--randomize --seed=576 --detectOpenHandles` (125/125, no open handles), and the 3 new tests pass alone (`probe-out/leak.log`, `probe-out/newonly.log`).
5. **Bytes and matrix.** P1: DOM after Reset equals a fresh load for 6 of 6 fixtures, and the Reset bytes equal r2's base bytes for 6 of 6. P2: 52 of 52 pairs equal, and every write is byte-identical to r2's head writes. P3: Reset twice is idempotent, 6 of 6. The 2 P2 failures are the known squad damage-creature harness limitation, the same as r2. Source: `probe-out/head.json`, `probe-out/head.log`.
6. **CHANGELOG:** INFO-C.

## Gates (`8645685a`, branch worktree; the harness moves calls longer than 180 s to the background, and I waited for each before starting the next)
| Gate | Result |
|---|---|
| jest (full) | `Tests: 1 failed, 1 skipped, 7053 passed, 7055 total`, rc 1. The 1 failure is `test/dom/framework/twin-reuse.test.ts` "SC-547: a pass over a callout of 40 same-alias blocks…", a 5000 ms timeout (SC-568; load average 15-20). Alone that suite gives `Tests: 53 passed`, rc 0, so **7054 passed / 1 skipped effective**, matching the expected 7054 / 1. |
| e2e (full) | `OBSIDIAN-E2E done: 251/260 ok, 0 failed, 9 known-bug, coverage: 161/161 pairs`, rc 0, pointer parked. INIT-X01..X06 ok, INIT-X07 known-bug SC-575. Known bugs: SC-257, SC-384, SC-580, SC-355, SC-577, SC-578, SC-588, SC-575, SC-572. |

Lifecycle, shots and parity were skipped. The delta changes no CSS. Its DOM change is attributes during an await plus the existing error card on a failure path, and no shot or lifecycle scenario reaches that path. The implementer's 52/52, 592/163/147 and 0/0/24 on this head stand.

## Evidence (under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc576-rev-r4-k3v9pz/`)
- jsdom probe: `zz-sc576-probe.test.ts.txt`. Results: `probe-out/head.json`, `probe-out/head.log`. Prescribed-fix check: `probe-out/fixprobe.json`, `probe-out/fixprobe.log`, `probe-out/matrix-fixprobe.log`, `probe-out/prescribed-fix.diff`.
- Mutations: `probe-out/e2e-m2-norebuild.log` (MEDIUM-2), `probe-out/matrix-m-r2view.log` (new tests against `2b1525ba`), `probe-out/matrix-m34.log` (no `finally` + no guard), `probe-out/matrix-m3only.log` (no guard: still green → LOW-A).
- Order and leak check: `probe-out/leak.log`, `probe-out/newonly.log`.
- Real-Obsidian probe spec: `zz-probe-sc576-r4.e2e.ts.txt`, plus fixtures `Probe Orc.md.txt` and `probe-refs.md.txt`. Runs: `probe-out/e2e-r4probe.log` → `shots/r4-e2e.json`, and `probe-out/e2e-r4probe2.log` → `shots/r4-e2e-r4probe2.json`. The probe tests are marked "failed" only by the e2e invariant on the expected `console.error` (INFO-B); their bodies ran and recorded.
- Screenshots: `shots/r4-01-error-card-after-reset.png`, `shots/r4-01-error-card-after-reset-hover.png`, `shots/r4-01-error-card-collapsed.png`, `shots/r4-01-recovered-after-note-edit.png`, `shots/r4-03-sidebar-error-card.png`, `shots/r4-03-sidebar-after-note-edit.png`.
- Gates: `gates/jest.log`, `gates/jest.rc`, `gates/e2e.log`, `gates/e2e.rc`.
