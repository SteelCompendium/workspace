## r4

### Executive summary
- **Verdict: FIX** (one MED, small and validated). Head reviewed: dse `bdab956e` on `bab0dbb2`. Counts: CRIT 0 · HIGH 0 · MED 1 · LOW 2 · INFO 5.
- Range-diff: the five r1 commits rebased as `=` (all five). The r3 delta matches every r2 prescription: HIGH-1, MED-1, MED-2, LOW-1/2/3 and the Q12 tier carry. Re-probed at head, PRB-14/11/5/4/3 and the 700 ms slow redraw all now behave as prescribed.
- **MED-A (new in r3):** `atChange` is set at every modify while focus is in the card, including the card's own write and an edit elsewhere in the note, and it is never dropped when no redraw follows. A later Reading view `previewMode.rerender` with no modify (focus on `<body>`) then pulls focus back into the card (PRB-R1, R2). In a long note it pulls focus into a DIFFERENT card (PRB-R3: own chip press, scroll away, rerender → focus on the bottom card's chip). That is the HIGH-1 consequence through a rarer trigger. A validated event-based fix is attached.
- **LOW-A:** an outside `collapsed: true` (SC-169 key) hides the focused control → `<body>` instead of the card (Q6, RV and LP).
- **LOW-B:** NEGO-O01/O05 count every `.notice`, including Obsidian's own "Indexing complete.". Full run 1 failed NEGO-O01 on exactly that (screenshot), and mutant run Y8 once on O05. This is a test flake.
- **Q12:** the tier is carried on a rename, a `prefs:` change and a reason-text change. It is dropped on an outside completion, on "Sync completed an EMPTY argument", and on an outside chip toggle. After a carry, Complete writes exactly one result with the correct values. I found no path to a wrong or double result.
- **OOS-1 refuted again:** a pending own write never overwrites the outside edit (4/4). The pending chip toggle is discarded instead.
- **Gates at bdab956e:** tsc/lint rc 0 · jest 13633 / 1 (cache) · e2e run 2 `643/652 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` (run 1: 3 failed, INIT-W09/W10 load flakes and NEGO-O01 = LOW-B; all re-run green) · lifecycle part 4 4/4 (G-S61 green), part 7 3/3 · shots/freeze/parity: no re-run needed (no CSS or static DOM change).

### 1. Range-diff (`git range-diff 42c26272..79a6b241 bab0dbb2..fae048c3`)
`955d7c74 = babe384c`, `8a491da0 = f4fc8d6d`, `af139520 = ecd5da25`, `2bab2763 = c29973be`, `79a6b241 = fae048c3`: all `=`. The SC-652 rebase changed none of the r1 patches.

### 2. The r3 delta against the r2 prescriptions
| r2 finding | r3 code (file:line at bdab956e) | matches? | measured at head |
|---|---|---|---|
| HIGH-1 | `view.ts:84-86` `vault.on('modify')` → `atChange = focusNow()` (root connected AND focus inside; fresh slot). `view.ts:93-97` unload: live `rememberFocus` memory only when the root is connected with focus inside (LP), else `atChange` (RV); cleared after use. `update()` clears it (`view.ts:132`) | yes (= candG2) | PRB-14 rv/lp top → `<body>`, bottom → `<body>` |
| MED-1 | `livePreviewFocusCarry.ts:44-47,72` `carried` WeakSet + `ownSaveCarried`. `view.ts:98` skip only on it. Timer, `lastPersistAt` and `persist()` override gone | yes | PRB-11 RV/LP at 0.5/1.5/2.9/3.5 s → same chip (8/8; r2 RV was `<body>` ×3). Own writes: `handoffs=0` at normal speed and at 700 ms (PRB-3, PRB-S) |
| MED-2 | `focusRules.ts:33-34` same/reuse → `[mod.lie, appeal.motivation]` | yes | PRB-5 same RV/LP → lie box; PRB-5r reuse RV/LP → lie box (new probe) |
| LOW-1 | OE08 asserts no Notice; OE20 | yes | X6 equivalent killed (implementer's mutant table); PRB-4 delAboveChange `notices=0` |
| LOW-2 | OE21 / OE26 / NEGO-O16 | yes | PRB-8 sidebar Complete → Complete (tier kept) |
| LOW-3 | `redraw()` dispatches focusout while connected, then remove | yes | n/a |
| Q12 | `NegotiationData.ts:376-385` `argumentKey()`; `ArgumentView.ts:97-107` `chosenTier`/`chooseTier`; `windowHandoff.ts:191` `receive` under the count guard; `view.ts:120-122` key compare; sidebar `update()` `view.ts:127-136` | yes | see 3 |

Shared-file hunks are additive as stated: `windowHandoff.ts` (+9: `receive?`, `carry?`, one line in `act`, passthrough) and `livePreviewFocusCarry.ts` (+6).

### 3. Q12 (real Obsidian; PRB-Q*, tier crit chosen, Complete focused, outside edit, then Enter if Complete holds focus)
| outside edit | RV | LP | after Enter on Complete |
|---|---|---|---|
| Q1 rename (outside the fingerprint) | carried, Complete focused, enabled | same | 1 write, Interest 3→4, Patience unchanged (crit, no motivation): correct |
| Q2 completed elsewhere (Interest 4, Patience 2, motivation spent) | dropped, first chip, Complete disabled | same | n/a |
| Q3 Sync completed an EMPTY argument (Patience 3→2 only) | dropped | dropped | n/a |
| Q4 chip toggled elsewhere (`motivationsUsed: [Peace]`) | dropped | dropped | n/a |
| Q5 `prefs:` (SC-652 wrapper key) added | carried, Complete focused | same | 1 write, Interest 4; the `prefs:` map survives the write |
| Q6 `collapsed: true` added | tier carried; **focus `<body>`** (the card collapsed, Complete hidden) → LOW-A | same | n/a |
| Q7 a motivation's reason text changed | carried | carried | 1 write, Interest 4 |

**Can a carried tier make Complete write a wrong or double result?**
- **Wrong result: no.** `chooseTier` remounts the roll from the NEW model (`mountRoll`), so the result table is rebuilt from the redrawn card. The fingerprint covers every input of that table: the standing, the 5 argument fields, the spent flags and the names.
- **Double result: no.** Every tier moves Interest or Patience (`ArgumentPowerRolls.ts:34-76`), so a completion elsewhere always changes the key. The only no-change completions clamp at 0 or 5, which ends the negotiation, and `chooseTier` refuses an ended card.
- **Sensible for the wrapper keys:** a `prefs:`- or `collapsed:`-only change leaves the model, and so the key, unchanged, and keeping the tier is right.
- **Burst:** each re-claim compares the ORIGINAL carry's key with the newest card's model, so a later write of the burst that completes the argument drops it.

### 4. OOS-1 (pending own write at the instant of an outside redraw)
PRB-O, chip clicked, then `vault.process` rename 50 or 200 ms later (inside the 400 ms debounce), RV and LP:
- 4/4: `renameKept: true`, `chipWritten: false`, the card shows the renamed version with the chip unpressed, and focus stays on the chip. No page errors.
- The outside edit is never overwritten. The SC-343 stale-block guard refuses the flush, so the user's own toggle from that instant is discarded. That is the documented behaviour; no ticket needed.

### 5. The runtime `Negotiation/long-top-bottom.md`
- `resetFixtures()` (`e2e/driver/dse.ts:179`) deletes every non-fixture file on each `openNote`. The next test in the same spec (NEGO-O15's `pin()` → `openNote`) removes the note.
- Each wdio session runs on its own temp vault copy, which is deleted with the session (the bundle's `vault-path.txt`; `/tmp/dse-e2e-20261115-135704-5581` is gone after the run). So the note cannot reach another spec file or the census, and it never touches `e2e/vaults/shipped`.
- After the full run, `git status --porcelain` of the plugin dir was empty, and `e2e/vaults/shipped/Negotiation/` holds the same 19 fixtures.
- Coverage stayed 417/417 with no new pair.

### 6. Mutants on the r3 delta (r-M; jest = 6 focused files, 602 tests; e2e where jest survived)
| mutant | jest | e2e |
|---|---|---|
| Y1 `atChange` never set | killed (13: OE01-07,13,14,16,19,22,23) | — |
| Y2 `atChange` cleared too early (a microtask after modify) | killed (13) | — |
| Y3 `ownSaveCarried` always true | killed (14) | — |
| Y4 `ownSaveCarried` always false | killed (OE14) | — |
| Y5 fingerprint drops standing | killed (OE05, OE21, OE23, OE26) | — |
| Y6 carry without the count guard | killed (OE25) | — |
| Y7 `update()` does not clear `atChange` | survives | survives (NEGO-O09/O15/O16, PRB-8): equivalent in practice (a sidebar view is refreshed, not unloaded, by an outside change) |
| Y8 `atChange` preferred over the LP live memory | survives | 9/10 then 3/3. The one red was NEGO-O05's Notice count (LOW-B flake); PRB-4-lp-both, PRB-12-lp-callout, PRB-13 lp twins, PRB-7-lp, PRB-T0, PRB-11-lp unchanged: equivalent |
| Y9 `chooseTier` ignores `ended` | survives | not run: equivalent by construction (a matching key means the same ending state) |
| Y10 no fingerprint compare | killed (OE05, OE23, OE24) | — |
| Y11 r1 memory at unload (no `atChange` gate) | killed (OE18) | — |
| Y12 fingerprint drops spent flags | killed (OE24) | — |

None of the mutants catches MED-A. It needs a re-render without a modify, which no committed test does.

### Findings

#### MED-A — a stale `atChange` plus a re-render without a modify pulls focus in, also into a different card (Reading view)
- **Where:** `src/elements/negotiation/view.ts:84-86` sets `atChange` at every modify of the note while focus is in the card. It is cleared only at this view's unload (`:97`) or by `update()` (`:132`). If no redraw of THIS card follows the modify (the card's own adopted write; an edit elsewhere in the note; Obsidian keeping the section), it stays set for the view's whole life. The next unload of the view that is not caused by a modify then hands off with it. In Reading view that is `previewMode.rerender` from a plugin's post-processor change, a plugin reload, or a re-render setting.
- **Measured** (`probe-headall.jsonl`, rerender = `view.previewMode.rerender(true)`):
  - **PRB-R0 (control):** chip focused, blur to `<body>`, rerender → `<body>`.
  - **PRB-R1:** chip pressed (own write, modify while focused), 3.5 s, blur to `<body>`, rerender → **focus back on the chip** (focusin at 33 ms).
  - **PRB-R2:** chip focused, outside edit ABOVE the block (card not redrawn), blur, rerender → **focus back on the chip**.
  - **PRB-R3:** long note, top card chip pressed, 3.5 s, scroll to the end (wheel events dispatched; the top card leaves the page, focus `<body>`), rerender → **focus on the BOTTOM card's chip** ("Bottom Frodo"). Reproduced twice (`probe-headall`, `probe-head2`). The next Space presses a chip of the other negotiation, the same consequence as r2 HIGH-1.
- **Why MED, not HIGH:** the trigger is a re-render with no change to the note (rarer than a Sync), and DSE itself never calls `previewMode.rerender`. But an own chip press always arms it, so the precondition is the most common action on the card.
- **Prescribed fix (validated, `candG-stale-atChange.diff`, `probe-candG.jsonl`):** `atChange` describes one change and the redraw right behind it, so drop it as soon as that redraw is evidently not coming:
  - At the first `onMount` (next to `rememberFocus`), register on `root.ownerDocument` capture listeners for `pointerdown`, `keydown` and `wheel` that set `atChange = null`.
  - Register a `focusout` on the root that clears it one microtask later when the root is still connected and focus is not inside it. This is the same rule `rememberFocus` uses.
  - No timer is needed: a modify-caused redraw has no user input between the modify and the unload (10-700 ms measured in r2). If the user does act in that gap, the hand-off's user-moved cancel would stop it anyway.
  - **Measured with the candidate:** PRB-R1, R2 and R3 → `<body>`. NEGO-O01..O16 16/16 green. PRB-14 rv/lp top `<body>`, PRB-11-500 rv/lp same chip, PRB-7 burst rv/lp, PRB-S slow outside/moveOut, PRB-12, PRB-13 twins, PRB-T0/T1, PRB-1 disk, PRB-4-both, PRB-3, PRB-Q1 rv/lp carried and PRB-2 panes/popout are all identical to head.
  - **Tests:** e2e PRB-R1 and PRB-R3 shapes (`previewMode.rerender(true)` after a chip press + blur; and after a scroll-away in the long note) → `<body>`. jsdom: modify while focused, no redraw, focusout to body (or a `pointerdown`), then `old.view.unload()` with a successor at the slot → no hand-off.

#### LOW-A — an outside `collapsed: true` hides the focused control; focus falls to `<body>`
- **Where:** `src/framework/chrome/windowHandoff.ts:166-177` (`focusSuccessor`). `controlSuccessor` picks the carried Complete, which is hidden inside the collapsed card. `focusControl` returns false and nothing else is tried.
- **Measured:** PRB-Q6-rv/lp: tier carried, focus `<body>`, no focusin. This is fallback (a) for a control that is present but not focusable. The same happens to any control the collapse hides, and it is the same at 79a6b241.
- **Fix:** in `focusSuccessor`, when `o.silent` and `focusControl(target)` returns false, focus the root (`tabindex=-1`), the ruling's last resort (or the chrome expand control, if one is keyboard-reachable). An additive guard in the silent path leaves initiative and montage unchanged. Test: e2e `collapsed: true` outside edit → focus on the card root, not `<body>`. Deferrable: authored collapse via Sync is rare.

#### LOW-B — NEGO-O01/O05 count Obsidian's own Notices
- **Where:** `e2e/specs/negotiation/outside-edit.e2e.ts` `noticeCount = document.querySelectorAll('.notice').length` (O01, O05).
- **Measured:** full run 1, NEGO-O01 FAIL "Expected: 0 Received: 1". The bundle screenshot shows Obsidian's **"Indexing complete."** Notice (O01 is the first test of its session; indexing ended late on a loaded host). The same flake hit O05 once in mutant run Y8 (re-run 3/3 green).
- **Fix:** count only Notices whose text is the DSE Notice (`OUTSIDE_CLOSE_NOTICE`), or take the count right before the outside edit and assert the delta is 0.

#### INFO
- I-1: INIT-W09 and INIT-W10 failed in full run 1 (Notice expected 1, got 0) at load ~18-22, and passed on re-run. INIT-W10 is the known SC-654 flake. INIT-W09 shows the same signature: the burst's single Notice was gone before the count. The r3 change to `windowHandoff.ts` is one line, inactive when `carry` is undefined (initiative/montage never pass it).
- I-2: LP identical twins after an own write: the `carried` mark did not stick to a live root (PRB-T0/T1: focus kept after a later outside edit).
- I-3: tier carry needs focus in the card (the owner's ruling (a) on r3 follow-ups). A focus-less carry is not trivial: the hand-off is started only with a focus memory, so decoupling would need a second, focus-less hand-off.
- I-4: Y7/Y8/Y9 survive jsdom. They are equivalent in practice (see the mutant table); optional tests only.
- I-5: shots/freeze/parity need no re-run. The r3 delta touches no CSS, kit or static DOM builder. The only DOM effect is `chooseTier` remounting the roll at runtime after a carry.

### 7. Gates at `bdab956e` (the implementer's worktree, as found; `git status --porcelain` empty before and after)
- tsc rc 0 · lint rc 0 · jest `Tests: 1 skipped, 13633 passed, 13634 total` rc 0.
- e2e run 1: `OBSIDIAN-E2E done: 640/652 ok, 3 failed, 9 known-bug, coverage: 417/417 pairs` (INIT-W09, INIT-W10, NEGO-O01; re-run of those three + O05: 4/4 ok). e2e run 2: `OBSIDIAN-E2E done: 643/652 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` rc 0 (matches the implementer); `git status --porcelain` of the plugin dir empty afterwards, shipped vault unchanged.
- lifecycle `--only=` part 4 `4/4 ok` (G-S61 green this run), part 7 `3/3 ok`.
- shots/freeze/parity: not re-run (I-5); CURRENT 592/163/978/40/240/147 · 280/280 · 0/0/24 stands.

### Evidence (all under /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc656-r4-R1/)
- Probe spec `r4probe.e2e.ts` (r2 probes + R/T/Q/O/5r), `summ.py`, `ids-A.txt`.
- Head: `probe-headall.{log,jsonl,rc}`, `probe-head2.*`. Slow redraw (700 ms): `probe-slow.*`.
- Candidate fix: `candG-stale-atChange.diff`, `probe-candG.*`.
- Mutants: `mutants.py`, `mut-jest.sh`, `mut-jest.out`, `mut-jest-*.log`, `mut-e2e.sh`, `mut-e2e-all.sh`, `mut-e2e-Y7.*`, `mut-e2e-Y8.*` (first run's log overwritten by the re-run; result recorded above), `mut-e2e-Y8-rerun.*`.
- Gates: `g-tsc.log`, `g-lint.log`, `g-jest.log`, `g-static.rc`, `g-e2e-full.log` + `g-e2e.rc`, `g-e2e-rerun.{log,rc}`, `e2e-full-fail-bundles/{INIT-W09,INIT-W10,NEGO-O01}/`, `g-e2e-full2.log` + `g-e2e2.rc`, `lc-part4.*`, `lc-part7.*`.
- Scratch worktrees (detached, registered in the SC-656 dse git dir; `git worktree prune` once the scratchpad goes): `r-A` (head + probe spec), `r-B` (+ delay/counter), `r-M` (mutants, restored), `r-G` (candidate fix + delay/counter).
