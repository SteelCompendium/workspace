## r6

### Executive summary
- **Verdict: FIX** (two LOWs, both small; nothing blocking). Head reviewed: dse `57d57a03` (r5 delta `bdab956e..57d57a03`, on `bab0dbb2`). Counts: CRIT 0 · HIGH 0 · MED 0 · LOW 2 · INFO 4.
- The MED-A fix is byte-identical to my `candG-stale-atChange.diff`. PRB-R0/R1/R2/R3 all land on `<body>`. LOW-A (collapsed → card root) and LOW-B (Notice filter) are in as ruled. The r4 probe set (PRB-1/3/4/5/5r/7/8/11/12/13/14/O/Q/T/S-slow) is unchanged at head.
- **LOW-C (r5 regression):** a single key press, or a pointer press elsewhere, in the few-ms gap between an outside modify and the Reading view unload now cancels the hand-off: focus goes to `<body>`. At r3 head (`bdab956e`) focus was kept in every trial. Measured on head: one Shift keydown 5 ms after the modify lost focus 4/5, a pointer press 3/4, a held key 1/4. Live Preview was not affected (0/4).
  - Fix (validated): clear on keydown/pointerdown only when the card is connected and the input is outside the card; clear on wheel whenever the card is connected. With it, NEGO-O01..O19 pass 19/19, the key-in-gap cases keep focus, MED-A stays fixed, and jest passes 32/32.
- **LOW-D:** LOW-B's filter matches only the window Notice text, but the silent hand-off's Notice text is `''`. So NEGO-O01/O05 can no longer see a Notice from the hand-off, and the `!o.silent` guard in `act` is now untested anywhere (mutant Z6 survives jest and e2e; r2's X5 was killed by these two tests).
- **Listeners:** registered once per view (20 redraws: no stacking). They are removed on note close and plugin disable, and re-added on enable. A popout card registers on the POPOUT document (main document untouched) and its listeners go with the window. Initiative/montage are unchanged (INIT-W 13/13, MONT-OW 9/9, also with the silent guard of the root fallback removed).
- **Gates at 57d57a03:**
  - tsc/lint rc 0 · jest 13639 / 1 · lifecycle part 4 4/4 (G-S61 green) · part 7 3/3.
  - e2e run 1 `644/655 ok, 2 failed (SET-X03, SET-X04 load flakes, re-run 2/2 ok), coverage 415/417 (the two pairs those tests drive)`; run 2 `646/655 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` rc 0.
  - Shots/freeze/parity: no re-run needed.

### 1. MED-A fix and the new listeners (`src/elements/negotiation/view.ts:180-193`)
- **Matches candG:** the r5 hunk equals `candG-stale-atChange.diff` line for line (diffed). It still carries my scratch comment label "R4 CANDIDATE" (`view.ts:181`): reword it to "SC-656" (INFO-1).
- **MED-A at head (`probe-headall.jsonl`):** PRB-R0 control `<body>`. PRB-R1 (own press, blur, `previewMode.rerender`) `<body>`. PRB-R2 (edit above, blur, rerender) `<body>`. PRB-R3 (long note, own press, wheel/scroll away, rerender) `<body>`; at r3 head it was the bottom card's chip.
- **Can the new keydown/pointerdown clear wrongly cancel a legitimate hand-off? Yes, in Reading view (LOW-C):**
  - Probe PRB-K: chip focused, outside `vault.process` rename, then synthetic input on the document: one Shift keydown 5 ms after the process resolved, a keydown every 20 ms for 400 ms (held), or one pointerdown on `<body>` 5 ms after.
  - At head the keydown is a no-op key that moves no focus, so the old user-moved cancel would not have fired; the new document listener clears `atChange` before Reading view unloads the old view, and nothing is handed off.

| case (RV unless noted) | r3 head `bdab956e` | r5 head `57d57a03` (4 trials: headall + 3 repeats) | r6 candidate |
|---|---|---|---|
| one keydown in the gap | kept | **`<body>` 4/4** (5th trial on the instrumented build: kept) | kept |
| held key (every 20 ms) | kept | **`<body>` 1/4** | kept |
| pointerdown on `<body>` in the gap | kept | **`<body>` 3/4** | `<body>` (input elsewhere = the user moved; acceptable) |
| LP one keydown | kept | kept 4/4 (LP uses the live memory) | kept |

- **Compared with the user-moved cancel:** that cancel fires only when focus actually moves somewhere else (`onFocusIn`). A Shift, an arrow on a seal, or a held key in the card while a Sync lands now cancels too, which is the pre-SC-656 behaviour for that keyboard user. The window is narrow (the first few tens of ms after the modify; Reading view measured 10-45 ms to unload), hence LOW.
- **Prescribed fix (validated, `candG-input-scope.diff`, `probe-candG.jsonl`):**
  ```ts
  const dropOnInput = (evt: Event): void => {
      if (root.isConnected && (evt.type === 'wheel' || !root.contains(evt.target as Node | null))) drop();
  };
  for (const type of ['pointerdown', 'keydown', 'wheel'] as const) this.registerDomEvent(doc, type, dropOnInput, { capture: true });
  ```
  - **Why it works:** input INSIDE the card (focus is still where `atChange` saw it) keeps it. Input while the card is out of the page keeps it too, which covers the redraw's own gap. Wheel always drops while connected: a scroll carries the card away wherever the pointer is.
  - **Measured with it:** NEGO-O01..O19 19/19 green, including the implementer's MED-A tests O17/O18. PRB-R0..R3 `<body>`. PRB-14 rv/lp top `<body>`. PRB-K one/held kept, pointer on `<body>` → `<body>`. PRB-11-rv-500, PRB-7 burst rv/lp, PRB-Q1 (tier kept) and PRB-Q6 (root) unchanged. jest `negotiation-outside-edit` 32/32.
  - **Add tests:** jsdom "modify while focused, keydown dispatched ON the focused chip, redraw → same chip"; e2e PRB-K-rv-one shape → same chip.
- **Listener bookkeeping (PRB-L; counts the capture `pointerdown`/`keydown`/`wheel` listeners whose source mentions `atChange`):**
  - Main document: one card adds 3. After 20 outside redraws the net is still 3 (each redraw removes 3 and adds 3; the `if (!this.focusMemory)` guard means once per view). Plugin disable removes them and enable re-adds them. Closing the leaf removes them.
  - The absolute counter moved by -3/+3 more than this card at disable/enable/close, from one pre-existing live view in the long e2e session. Add and remove stay balanced per view.
  - Popout: the card registers on the popout's own document (popout +6 for its views, main unchanged 3 → 3). Closing the popout takes the window and its listeners; the main count is unchanged afterwards.
  - MED-A in the popout: own chip press, wheel on the popout document, blur, popout `previewMode.rerender` → `<body>`.
  - Mutant Z1 (`document` instead of `root.ownerDocument`) shows the difference: popout 0, main +6. No committed test catches it (INFO-2).

### 2. LOW-A (`src/framework/chrome/windowHandoff.ts:172-177`)
- One guard in `focusSuccessor`: `!focusControl(target) && o.silent && target !== root` → root `tabindex=-1` + focus. PRB-Q6 rv/lp (outside `collapsed: true`) → card root `DIV`, with the tier still carried.
- Initiative/montage: e2e INIT-W01..W13 and MONT-OW01..OW09 are green in the full runs. With the `o.silent` part of the guard removed (mutant Z4), they still pass 22/22. Their window openers are always focusable in the tested cases, so the guard is effectively untested but harmless (INFO-3).

### 3. LOW-B (`e2e/specs/negotiation/outside-edit.e2e.ts:35`) and LOW-D (new)
- The filter fixes the "Indexing complete." flake as asked. But a silent hand-off would show a Notice with the text `''` (`handOffAfterOutsideRedraw` passes `notice: ''`, `windowHandoff.ts:290`), so the filter can never match it.
- **LOW-D, measured:** mutant Z6 (drop `!o.silent` in `act`, `windowHandoff.ts:188`) → NEGO-O01/O05 green 2/2 and jest 608/608 green. The jsdom notice asserts run with `lastKnownBody: null`, so the content check hides the missing guard. In r2, X5 (the same mutant) turned O01/O05 red. The guard that keeps the hand-off silent is now untested.
- **Fix, either one:**
  - (a) e2e: count Notices that APPEAR between the edit and the assertion, excluding Obsidian's own (snapshot the `.notice` nodes right before `externalEdit`; assert no new node other than one whose text is `Indexing complete.`).
  - (b) jest: an OE with `raw = true` (`lastKnownBody` set, so the successor's content differs) asserting `Notice.notices` stays `[]`. This kills Z6 in jsdom.

### 4. Mutants on the r5 delta (r-M; jest = 6 focused files, 608 tests; e2e as listed)
| mutant | jest | e2e |
|---|---|---|
| Z1 listeners on `document`, not `root.ownerDocument` | survives | survives committed tests (my PRB-L-popout shows popout 0 / main +6) → INFO-2 |
| Z2 re-registered on every rebuild (no `!this.focusMemory` guard) | survives | survives (PRB-L-main, NEGO-F05, PRB-3-rv-reset): leak-only, bounded by the view's life |
| Z3 bubble instead of capture | survives | survives (O17, O18, PRB-R3): equivalent while nothing stops propagation |
| Z4 root fallback also for windows (no `o.silent`) | survives | INIT-W/MONT-OW 22/22 green → INFO-3 |
| Z5 root fallback without `target !== root` | survives | not run: equivalent (a second failed focus on the same node) |
| Z6 a Notice on the silent path | survives | **survives** NEGO-O01/O05 → LOW-D |
| Z7 focusout clear without the microtask | survives | **killed** (NEGO-O01, O02, O03 red) |
The implementer's A1-A5/B1 are killed (their report). None of Z1-Z6 is a behaviour defect at head; Z6 marks a lost test.

### 5. Gates at `57d57a03` (the implementer's worktree, as found; `git status --porcelain` empty before and after)
- tsc rc 0 · lint rc 0 · jest `Tests: 1 skipped, 13639 passed, 13640 total` rc 0.
- e2e run 1: `OBSIDIAN-E2E done: 644/655 ok, 2 failed, 9 known-bug, coverage: 415/417 pairs`. SET-X03 ("timed out waiting for the picker to filter") and SET-X04 (data.json left by X03) are SC-657 load flakes; re-run `2/2 ok`, and those two tests drive the 2 missing pairs. e2e run 2: `OBSIDIAN-E2E done: 646/655 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` rc 0 (matches the implementer).
- lifecycle `--only=`: part 4 `4/4 ok` (G-S61 green), part 7 `3/3 ok`.
- Slow redraw (700 ms, `probe-slow.jsonl`): own chip and Complete in RV/LP `handoffs=0`. Outside edit lands on the chip after ~760 ms. Moving focus out in the gap pulls nothing in. Plugin disable with a hand-off pending: no error.
- Shots/freeze/parity: not needed (no CSS, kit or static DOM builder in the delta).

### INFO
- INFO-1: `view.ts:181` ships my scratch label "R4 CANDIDATE" in a product comment. Reword to "SC-656".
- INFO-2: the popout document choice (`root.ownerDocument`) is correct and measured, but no committed test pins it (Z1).
- INFO-3: the `o.silent` part of the root-fallback guard is untested (Z4); harmless while window openers are focusable.
- INFO-4: OOS-1 re-confirmed at head (PRB-O 4/4: outside edit kept, pending own toggle dropped). The tier carry is unchanged (PRB-Q: kept on rename/prefs/reason, dropped on completion/empty completion/chip toggle; Complete after a carry writes once, Interest 3→4).

### Evidence (all under /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc656-r6-R1/)
- Probe spec `r6probe.e2e.ts` (r4 set + PRB-K + PRB-L), `summ.py`, `ids-A.txt`.
- Head: `probe-headall.*`, `probe-krep1..3.*`, `probe-slow.*` (700 ms). r3-head comparison: `probe-r3head-K.*`.
- Candidate: `candG-input-scope.diff`, `probe-candG.*`, `jest-G.log`.
- Mutants: `mutants.py`, `mut-jest.sh`, `mut-jest.out`, `mut-jest-*.log`, `mut-e2e.sh`, `mut-e2e-all.sh`, `mut-e2e-Z*.{log,jsonl,rc}`.
- Gates: `g-tsc.log`, `g-lint.log`, `g-jest.log`, `g-static.rc`, `g-e2e-full.log` + `g-e2e.rc`, `g-e2e-rerun.{log,rc}`, `g-e2e-full2.log` + `g-e2e2.rc`, `lc-part4.*`, `lc-part7.*`.
- Scratch worktrees (detached, registered in the SC-656 dse git dir; `git worktree prune` once the scratchpad goes): `r-A` (head + spec), `r-B` (+ delay/counter), `r-M` (mutants, restored), `r-G` (candidate).
