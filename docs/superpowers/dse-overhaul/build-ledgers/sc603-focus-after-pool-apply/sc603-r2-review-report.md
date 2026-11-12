# SC-603 r2 independent review report

**Executive summary**
- Verdict: **LAND**. 0 HIGH, 0 MEDIUM, 2 LOW (test gaps only; the code is correct), 6 INFO. The two LOWs can ride the rebase round.
- Reviewed dse `7813b333` on `b5d18f79`; superproject CHANGELOG `9d1568ec`. `origin/develop` has MOVED to `8b84b635` (SC-598, `managedModal.ts` only). Not rebased. The four SC-603 commits cherry-pick onto it with no conflict, and the SC-598 interaction is clean (section 4).
- Gates (mine, at `7813b333`): tsc/lint clean · jest `7339 passed, 2 skipped` · lifecycle 56/56 (21+16+9+4+6) · e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs` (SC-257, SC-355, SC-384, SC-580) · styles.css sha256 `5e5ff488…2b27`, the same for a clean `b5d18f79` build and for `7813b333`, so shots, freeze and parity carry over.
- Red on base: jest 4 red (F08 F09 F13 F16), and e2e INIT-F07, F08 and F11 red on the base `view.ts`.
- Real Obsidian, my own probe (12 routes, base vs HEAD): every keyboard route that used to drop to `<body>` now lands on the rebuilt control of the same creature and instance, keeping the ring. That covers Reading view, the pinned sidebar, the same block in a note and pinned at once, two trackers, a kill, kill-all and a hover preview. Mouse routes, Cancel, Escape and the backdrop are unchanged.
- LOW-1: the ruling "restore nothing if focus was not in the tracker at open" has no test of its own. Mutant M6 (always restore) survives F11 and every e2e test, and in real Obsidian it pulls focus onto the tracker root after a mouse open. Only the Reset tests F05 and Q18 catch it, and only by accident. LOW-2: one route the fix covers is untested: removing a condition inside the pool window rebuilds the tracker while the window is open, and then X or Escape. It is red on base and green at HEAD in my probe.

## 1. Context

- Ledger and implementer report read. Worktree `/home/scott/code/steelCompendium/worktrees/sc603-focus-after-pool-apply`, dse branch `sc603-focus-after-pool-apply` at `7813b333`.
- `git fetch origin`: `origin/develop` went from `b5d18f79` to `8b84b635` (SC-598: f973c001, 131bc2a6, 95c38b70, 3f3ba72b, c5de58fc, 8b84b635). Diff stat: `src/framework/kit/managedModal.ts` (47 lines), tests, and `visual-harness/obsidian-lifecycle.mjs` (G-S91). Not rebased, as the brief and the owner's mid-task message require.
- Tree state before and after: dse `git status --porcelain` is empty and HEAD is `7813b333`. The superproject shows ` M draw-steel-elements`, the unstaged pointer bump, the same as at the start. My two throwaway `git worktree add` checkouts were removed with `git worktree remove --force` and pruned. `git worktree list` shows only the review worktree.

## 2. Rulings vs behaviour (verified, not taken from the r1 table)

Every `openModal(` site in `src/elements/initiative/view.ts` (HEAD lines): 392 ResetEncounterModal (opts out, `false`), 1643 hero StaminaEditModal, 1871 pool modal (grid double-click), 1992 pool modal (detail row), 2088 creature StaminaEditModal (from 1877 and 1999), 2285 ConditionsModal. No other modal or Menu is opened anywhere in `src/elements/initiative/`. FreeHealConfirmModal is opened by StaminaEditModal itself, not through `openModal`; the parent stays open, so it is not affected. The r1 table is correct. It leaves out one route the fix also covers (LOW-2).

Real-Obsidian focus timelines: a sampler logs `document.activeElement` (by `data-dse-control`, instance key, tracker index, ring) every 10 ms plus on focusin and focusout. HEAD = `7813b333`, BASE = the `b5d18f79` `view.ts`. Probe spec: `zz-probe603.e2e.ts.txt` (see Evidence).

| Probe | Route | BASE | HEAD |
|---|---|---|---|
| ZZP-01 | Reading, Tab to detail Stamina, Enter, pool, Enter on Apply | `BODY` | rebuilt `init.detail.stamina` +ring at 68 ms. The 400 ms write adoption blinks it once and gives it back (as before) |
| ZZP-02 | Reading, pure mouse: double-click cell, pool, click Apply | `.markdown-preview-view` | same (focus was not in the tracker: nothing restored) |
| ZZP-03 | Reading, mouse double-click Ogre cell, Stamina modal, click Apply / Enter | `.markdown-preview-view` | same |
| ZZP-04 | Reading, keyboard-opened pool: X / backdrop / Escape | opener `init.detail.stamina` +ring | same (no restore needed) |
| ZZP-05 | Pinned sidebar, keyboard detail Stamina, pool, Enter on Apply | `BODY` | sidebar `init.detail.stamina` +ring |
| ZZP-05 | Sidebar, mouse double-click cell (focus on body before) | `BODY` | `BODY`: a mouse click does not focus a sidebar cell, so nothing was captured. As ruled |
| ZZP-06 | Same block in the note (Reading) AND pinned: keyboard Apply in each copy | `BODY` both | the note copy's control (#r1), then the sidebar copy's control (#r2). Never the other copy |
| ZZP-07 | `two-trackers.md`: Conditions from tracker 2's Add Condition, add, Escape twice | `BODY` | `init.cond.add` in tracker 2 (`Bob Beta`), +ring |
| ZZP-09 | Keyboard-focused cell 0-3, double-click, pool kills Goblin #3; then kill all from the detail row | `BODY`, `BODY` | cell `0-3` (now DEAD) +ring; then `init.detail.stamina` +ring (the detail row survives kill-all: 1 row) |
| ZZP-10 | Hover preview (Reading host note → `[[ZZ/sq-pinned]]`), keyboard detail Stamina, pool, Enter on Apply | `BODY` | the preview's `init.detail.stamina` +ring. The preview stays open, `.is-editing`, no source editor |
| ZZP-10 | Preview, mouse double-click cell | `BODY` | `BODY` (focus was on body before the open: see INFO-4) |
| ZZP-11 | Live Preview, keyboard, pool, Enter on Apply | not run | restored at 46 ms, then `BODY` at ~500 ms when the save re-renders the block (SC-602, as the CHANGELOG says) |
| ZZP-12 | `squad-hurt.md`, keyboard pool, remove a condition in the window (rebuild while open), then Escape / X | `BODY`, `BODY` | rebuilt `init.detail.stamina` +ring, both |
| ZZP-08 | Outside edit (`vault.process`) while the pool modal is open | the view is re-rendered and unloaded, so the modal closes (F1 §4.5): `BODY` | same, `BODY` (the `unloading` guard skips it, by design). Pre-existing: INFO-3 |

Rulings: behaviour = Obsidian's own focus return had the opener survived ✓. Missing control → last of family → root ✓ (by code; kill-all kept the control). No restore when focus was not in the tracker at open ✓ (ZZP-02/03/05m/10m). Cancel and Escape unchanged ✓ (ZZP-04, INIT-F10). Never `<body>` after a captured route ✓. Reading view + sidebar ✓. The roster double-click is keyboard-reachable ✓ (INIT-F12, green on base too).

## 3. Timing (the microtask)

- `giveFocusBack` (`view.ts:258`) defers with `Promise.resolve().then`. That is not a timer: it runs before any other task, so load cannot reorder it.
- Measured: it is **not load-bearing** in Obsidian 1.14.4. Mutant M1 (restore synchronously inside the wrapped `onClose`) passes INIT-F07, F08, F10 and F11 and ZZP-01, 05, 07 and 10 in real Obsidian. It even removes the ~10 ms `BODY` blip between Obsidian's close and the hand-back. The reason: by the time `onClose` runs, the modal is detached and focus is free, and Obsidian's return to a detached opener makes no focus call. M7 (`setTimeout(0)`) also passes jest. So the microtask is defensive ordering, belt and braces against an Obsidian that moves its focus return after `onClose`. That is reasonable. Nothing pins it (INFO-1).
- A `close()` while a rebuild is still pending: the rebuild is synchronous inside the save callback (`update()` empties the root and runs `onMount` before the first await, `framework/view.ts:217-227`; `onMount` returns void). Only the write is debounced (400 ms). At the write, Reading view adoption blinks focus to body and back in about 6 ms. That is pre-existing, SC-340 adoption, and the same as on base after the SC-588 rebuilds (ZZP-01/09 at ~530 ms).
- Second modal from inside the first: FreeHealConfirm is a nested DseModal, not opened through `openModal`. While it is open the parent's `onClose` does not run. Full e2e (Q13 etc.) is green.

## 4. SC-598 interaction (owner's added item)

- SC-598 changes only `DseModal.armHoverPreviewRepush` / the new `focusHoverPreviewNow`. They run in the **window-bubble phase of the opening click**, after the opener's handler, which is what called `openModal`. So SC-603's `captureControlFocus` has already run when SC-598 acts. At capture time `activeElement` is whatever held focus before the press: the keyboard opener (a `<button>`, Enter → native click), or, for a pointer press in a preview, not the cell (measured: body or the previously focused control). SC-598's `preventDefault`, its synthetic anchor click and the 10 ms `interactive-child` class all happen while the modal is open and holds focus. SC-603's restore runs only at close, long after the 10 ms window. Even if the restore did land inside it, it focuses a `<button>`, and the helper's "open the editor?" test does not fire on a button. So the two cannot fight.
- No textual overlap: SC-603 does not touch `managedModal.ts`, and SC-598 does not touch `view.ts`.
- Probed on a throwaway cherry-pick (`a1fbd847 1cc9eaf2 b703ffa9 7813b333` onto `8b84b635`, no conflicts):
  - e2e INIT-F07..F12 6/6 ok.
  - ZZP-01, 04, 07 and 10 behave the same as on HEAD. Hover preview: restored to the preview's `init.detail.stamina` +ring, and the preview stays `.is-editing` with no source editor.
  - Lifecycle `G-S83 G-S87 G-S91` 3/3 ok (153 s).
- Full jest and e2e on the rebase were not run: that is the rebase round's job.

## 5. Findings

### LOW-1: the "focus was not in the tracker at open" ruling has no test of its own
- `src/elements/initiative/view.ts:246` (`if (focus) this.giveFocusBack(focus);`) and `test/dom/elements/initiative-matrix.test.ts:919` ([F11]).
- Scenario: a future edit drops the null-token guard, so the hand-back always runs. Focus that was on `<body>` when the window opened is then pulled onto the tracker after Apply. Measured with mutant M6 in real Obsidian: the sidebar mouse route (ZZP-05) and the hover-preview mouse route (ZZP-10) end on `DIV.dse-chrome-anchor` (the tracker root, `tabindex=-1`) instead of `BODY`.
- Why nothing catches it: F11 parks focus on an outside `<input>`, and Obsidian's stand-in returns focus there, so `focusIsFree` is false and the mutant is a no-op. No e2e test opens with focus on body. M6 dies in jest only through Reset encounter's F05 and Q18, which is incidental.
- Fix: add a jest case next to F11. Blur everything (`document.activeElement === document.body`), open the pool with a scripted `click()` on `init.detail.stamina`, apply, `await flush()`, and assert `document.activeElement === document.body`, or `!root.contains(document.activeElement)`. Confirm that it kills M6 (the mutation script is in Evidence).

### LOW-2: a route the fix covers is untested: a condition removed inside the pool window, then X or Escape
- `src/views/MinionStaminaPoolModal.ts:684` (the condition icon's `this.persist()` → `rebuildAndPersist` while the window is open) together with `view.ts:246`.
- Scenario: on base, removing a condition in the pool window rebuilds the tracker behind it, and closing with Escape or X drops focus to `BODY` (ZZP-12 BASE). At HEAD it lands on the rebuilt `init.detail.stamina` +ring (ZZP-12 HEAD). This is a real fix, but it is in no test and not in the r1 table. A regression would go unseen.
- Fix: add a jest case next to F10 (HURT-shaped squad, focus the detail control, open, click a `.condition-icon` in the modal, `close()`, assert focus is on the rebuilt `init.detail.stamina`). Optionally an e2e case on `Initiative/squad-hurt.md` (`pool.condition` nth 0, then Escape). No CHANGELOG change is needed: "Cancel and Escape still return to the button you pressed" still reads true.

### INFO
1. **The microtask is not pinned, and in 1.14.4 it is not load-bearing** (section 3). M1 (synchronous) and M7 (`setTimeout(0)`) survive jest and, for M1, e2e too. Acceptable as defensive ordering. If the team wants it pinned, a jest stand-in whose `close()` focuses the detached-then-reattached opener after `onClose` would do it. No action required.
2. **The `unloading` and `isConnected` guards (`view.ts:260`) are unpinned.** M2 and M3 each survive all jest tests. In real flows an unloading view's root is detached by the time the microtask runs, and a still-connected opener makes focus not-free anyway, so each guard covers for the other. Defensive and harmless.
3. **Outside edit while a tracker modal is open (pre-existing, not a regression)** (ZZP-08). In Reading view an outside `vault.process` re-renders the section, the view unloads, the modal closes, and focus lands on `BODY`. Base and HEAD are the same. This is not a save route, so it is outside the ruling's scope. A candidate Backlog follow-up if the owner wants one.
4. **A pointer press on a roster cell while the detail row's control holds focus drops focus to `BODY` (pre-existing, no modal involved)** (ZZP-10 mouse, at ~150 ms: the cell's click handler empties `detailRowContainer`, which held focus). Outside SC-603. A candidate follow-up in the SC-588 family.
5. **The captain-bonus branch is jest-only (F16, red on base).** I judge this adequate. The real-Obsidian mechanism is the same one the pool Apply proves (a synchronous full rebuild inside the save callback, then the same hand-back): INIT-F07 and F08, ZZP-01, 05, 06, 09 and 10. A new fixture note for it alone is not worth it. Agree with the owner's default drop.
6. **CHANGELOG (dse `CHANGELOG.md` and superproject `9d1568ec`) is accurate.** It is scoped to Reading view and the pinned sidebar tracker, and it names the Conditions window and the captain edit. "A mouse click never pulls focus into the tracker" matches every mouse route I measured (Reading view, sidebar, preview). The Live Preview sentence ("focus is still lost when the note saves a moment later (SC-602)") is confirmed by ZZP-11: restored at 46 ms, lost at ~500 ms. No bracketed ticket ids in e2e titles (INIT-F07..F12). The manifest's `'SC-603'` scenario tag has precedent (`'SC-431'`, `'SC-495'`).

## 6. Tests: red on base, mutation

jest (6 initiative/sidebar files, 395 tests, scratch worktree):

| Variant | Result | Failing tests |
|---|---|---|
| BASE (`view.ts` at `b5d18f79`) | 4 failed | F08 F09 F13 F16 |
| HEAD | 395 passed | none |
| M1: synchronous restore | survives | none |
| M2: drop `!this.unloading` | survives | none |
| M3: drop `rootEl.isConnected` | survives | none |
| M4: Reset no longer opts out | killed (2) | F05, Q18 |
| M6: restore with no token | killed (2) | F05, Q18 only (LOW-1) |
| M7: `setTimeout(0)` | survives | none |

e2e on BASE `view.ts`: INIT-F07, F08 and F11 FAIL. F09, F10 and F12 ok (the guards, as r1 said). Each new e2e test asserts the focused control by `data-dse-control`, plus the instance key (F08, F09) or the ring (F07, F10, F11), not merely "not body".

## 7. Gate summary lines (mine, dse `7813b333`)

- tsc: `tsc rc=0` (`tsc --noEmit && tsc --noEmit -p e2e`), clean. Lint: `lint rc=0`, clean (only the known `.eslintignore` deprecation warning).
- jest: `Tests:       2 skipped, 7339 passed, 7341 total`, `Test Suites: 1 skipped, 263 passed, 263 of 264 total`, rc 0 (load 1-8).
- Lifecycle, five foreground parts. I ran them because `openModal` wraps every tracker modal, and G-S1, G-S2, G-S6* and G-S83/G-S87 drive tracker modals across writes, unloads and previews:
  - `21/21 ok, 0 failed` (184 s)
  - `16/16 ok` (324 s)
  - `9/9 ok` (407 s)
  - `4/4 ok` (300 s, G-S56 last)
  - `6/6 ok` (351 s)
  - Total 56/56 (Obsidian 1.15.1).
- e2e: `OBSIDIAN-E2E done: 278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`, rc 0, 133 s. Known bugs SC-257, SC-355, SC-384, SC-580.
- styles.css: `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27` for both the `git archive b5d18f79` build and the `7813b333` build. 0 lines of CSS diff. Shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147, freeze 280/280 and parity 0/0/24 carry over (not re-run).
- Cherry-pick on `8b84b635`: INIT-F07..F12 6/6, lifecycle `G-S83 G-S87 G-S91` 3/3.

## Evidence

All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc603-r2-review/`:

| Evidence | Files |
|---|---|
| Gates | `r2-g1-rc.txt`, `r2-tsc.log`, `r2-lint.log`, `r2-jest.log`, `lc-p1.log` … `lc-p5.log` (+ `.rc`), `r2-e2e-full.log` (+ `.rc`), `css-sha.txt` |
| Mutation and red-on-base (jest) | `mutate.py`, `g2-mutants.sh`, `r2-mutants-summary.txt`, `r2-mut-{BASE,HEAD,M1,M2,M3,M4,M6,M7}.log` |
| Real-Obsidian probe spec (never committed) | `zz-probe603.e2e.ts.txt` |
| Probe timelines | `probe-head*.jsonl` (HEAD), `probe-base*.jsonl` (BASE), `probe-m1.jsonl`, `probe-m6.jsonl`, `probe-cp598.jsonl` |
| Probe run logs | `e2e-probe-*.log` |
| Pretty-printer | `compact.py` |
| SC-598 cherry-pick | `e2e-probe-cp598.log`, `lc-cp598.log` |
