# SC-435 r2 — independent adversarial review

**Executive summary**
- Verdict: **LAND-READY.** 0 CRITICAL, 0 HIGH, 0 MEDIUM, 5 LOW, 5 INFO. The LOWs are small test fixes; the owner can fold them in or defer them. Separately, 4 new product bugs for the owner to file (1 MEDIUM a11y, 2 LOW, 1 INFO).
- Reviewed: dse branch `sc435-e2e-minion-pool` head `7f5b2647`, base `6270e84a` (5 commits). Working tree unchanged by this review.
- Gates (measured by me): tsc clean, lint clean · jest **6581 passed / 1 skipped / 1 failed** (only `twin-reuse` SC-547, a 5 s timeout = SC-568; the two SC-568 suites alone 71/71; load 5.9 to 20.5) · e2e run 1 **159/160, 1 failed (RECOV-R07, the known SC-517 load flake), coverage 109/109**; run 2 **`160/160 ok, 0 failed, 0 known-bug, coverage: 109/109 pairs`** rc 0 · lifecycle **51/52** (21 + 16 + 9 + 4 + 1). G-S59 failed twice, the first time with its own "environment (re-run, check /proc/loadavg)" wording, and **base `6270e84a` fails G-S59 the same way in the same window**, so it is the host, not this branch. G-S59 still needs a green run on a quiet host before landing, as in r1. Shots/freeze/parity not rerun (the modal DOM is byte-identical to base with the ids stripped, 5 states, see probe 1).
- Probes: every SC-429 regression goes red when its fix is reverted (5 reverts); 4 handler deletions turn 7/7 drivers red; the `dse.block()` fix is real (a stray write into a read-only block is red on the head driver, green on the base driver); product changes are attribute-only; both `test.failing` markers fail today for the stated reason and flip under a label fix (SC-566), a trim fix and a reword fix (SC-567).
- The findings are test-honesty gaps, not gate failures: a plain matrix row asserts SC-566's wrong label as correct (LOW-1); one cancel-path test cannot see a kill that saves early (LOW-2); the manifest has no keyboard rows for the kill boxes or Apply (LOW-3); the SC-567 marker has a vacuous path and leaves out the info line (LOW-4); the README fixture table is missing the two new notes (LOW-5).

## Gates (logs under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc435-rev-r2-be71a0a9/`)

| Gate | Result | Log |
|---|---|---|
| tsc (`npm run tsc`, incl. `-p e2e`) | rc 0, clean | `tsc.log` |
| lint | rc 0, clean | `lint.log` |
| jest full | Tests 1 failed, 1 skipped, 6581 passed, 6583 total; Suites 1 failed, 1 skipped, 257 passed, 258 of 259. Only failure: `twin-reuse.test.ts:736` "Exceeded timeout of 5000 ms" (SC-568). loadavg 5.85 at start, 20.49 at end | `jest-full1.log` |
| jest, the two SC-568 suites alone | 2 suites, 71/71 passed (load 18 to 13) | `jest-two.log` |
| e2e full, run 1 | `159/160 ok, 1 failed, 0 known-bug, coverage: 109/109 pairs`, rc 1. RECOV-R07 `w.count` 2 vs 1 (stamina-bar spec this branch does not touch; the bundle shows the popover steps' debounced write landing inside the Catch Breath window = known flake SC-517). load 14 to 28 | `e2e-full1.log` |
| e2e full, run 2 | `160/160 ok, 0 failed, 0 known-bug, coverage: 109/109 pairs`, rc 0. load 21 to 13 | `e2e-full2.log` |
| lifecycle part 1 | `done: 21/21 ok, 0 failed` (load 16.5 to 6.6) | `lc-p1.log` |
| lifecycle part 2 | `done: 16/16 ok, 0 failed` (load 7.5 to 7.1) | `lc-p2.log` |
| lifecycle part 3 | `done: 9/9 ok, 0 failed` (load 6.2 to 6.4) | `lc-p3.log` |
| lifecycle part 4 | `done: 4/4 ok, 0 failed` (load 7.2 to 25.0) | `lc-p4.log` |
| lifecycle part 5 | `done: 1/2 ok, 1 failed`: G-S49 ok; G-S59 FAIL "environment (re-run, check /proc/loadavg): the scroll took 2654 ms, past the 2400 ms ..." (load 26.2 at start) | `lc-p5.log` |
| lifecycle part 5, rerun | `done: 1/2 ok, 1 failed`: G-S49 ok; G-S59 FAIL "write 3: scrollTop moved: start 2779 ... end 2001", with write-to-redraw latencies of 4.5 s to 24.9 s (load 6.2 at start; other agents' gates were running) | `lc-p5b.log` |
| G-S59 alone on **base** `6270e84a` (scratch worktree) | `done: 0/1 ok, 1 failed`: the same symptom (st 2779 to 2001, redraw at 31.8 s, timed out). So it is the environment | `lc-base-s59.log` |

The lifecycle runs kept their FAIL screenshots in `/tmp/dse-obsidian-lifecycle-6k4w8k`, `/tmp/dse-obsidian-lifecycle-7oBJVO` and `/tmp/dse-obsidian-lifecycle-IfW6dJ` (the base run). These are the harness's own temp dirs, left in place.

Jest count check: +90 tests over baseline 6493 total (85 matrix + 2 `test.failing` markers + 3 census) = 6583. Coverage +20 pairs (89 to 109) matches the 20 (control, kind) pairs the new manifest adds; its `reach` rows and host ids are deduped against `stamina-edit-modal.ts`.

## Probes (all in a scratch worktree `.../sc435-rev-r2-be71a0a9/mut`, detached at `7f5b2647`, removed at the end)

1. **Product change is attribute-only.** `zz-reviewer-dom.test.ts` renders the modal in 5 states (rest with conditions, 2 kills owed, one tick, refused heal, condition removed), strips `data-dse-control`, and records `document.activeElement`. Base product file vs head: byte-identical (`dom-base.html`, `dom-head.html`, 22,844 bytes each). Nothing in `src/` or CSS reads the attribute (`controlId.ts` is the only writer).
2. **SC-429 regressions (revert each fix, run its drivers):**
   - item 1 (auto-tick revert) removed -> POOL-K03 red (`.....` expected, `ooooo` received) — `e-429-1.log`
   - item 2 (focus on the damage box) removed -> POOL-E01 red (focus `pool.stamina.dec`), POOL-E02 red (pool 18) — `e-429-2.log`
   - item 3 (count `max` = living) reverted -> POOL-E04 red (max 5), POOL-A03 red (spinner reaches 5) — `e-429-3.log`
   - item 3b / LOW-2 (typed count capped and shown) reverted -> POOL-A02 red (box shows 9) — `e-429-3b.log`
   - item 4 (info line hidden at rest) removed -> POOL-A04 red (`hidden: false`) — `e-429-4.log`
3. **Handler deletions:** name-click handler, the condition icon's `persist()`, Reset's count reset, Apply's `isDead = true` -> 7/7 drivers red (K01, K02, K04, F01, C01, C02, C03) — `e-handlers2.log` (`e-handlers.log` is the unmutated control run: 7/7 green).
4. **Stray writes** (a staging interaction that also calls `persist()`): name click -> K02 red; Apply Damage -> A01 red; stepper -> S01, S03, S04 red; kill tick -> K01 and K03 green, but F01, F04, F05 red. So every staging control has at least one driver that sees a stray write (`e-stray-*.log`). See LOW-2 for the one variant that slips through.
5. **`dse.block()` fix (SC-408 R2 LOW-1):** `_probe.e2e.ts` PROBE-01 takes `dse.block(BAR, 1)`, only reads it, then writes into fence 1 through the vault. Head driver: red, `fence #1 (ds-stamina-bar) changed but is not a block this test declared it was editing (declared: none)`. Base driver (`6270e84a` `dse.ts`): green, so the hole was real and is closed. Control PROBE-02 (a real click in block 1, then the same write): green on both — `e-probe-head.log`, `e-probe-base.log`.
6. **Known-bug markers:** turned into plain tests, both fail for the stated reason: SC-566 at matrix `:652` (Expected "Deal 20 damage, kill 5 minion(s)", Received "Deal 495 ..."), SC-567 at `:668` (Expected > 2, Received 1) — `j-markers-plain.log`. With a label + info clamp (`fix-566`) the SC-566 marker flips; with a trim fix and with a reword fix (`fix-567-trim`, `fix-567-reword`) the SC-567 marker flips and nothing else breaks — `j-fix-*.log`. Both bugs also reproduce in my own jsdom survey (P5, P6).
7. **Census.** Every node the modal can render is stamped: stepper dec/input/inc, damage box, count box, Apply Damage, per living minion a kill box + name + condition icons (also after a rebuild: same builder), Reset, Apply. States add no node kinds (all dead = no rows; pool 0 / refused heal only change attributes). Neither census is vacuous: CENSUS-06 opens the modal through the real bar and asserts 8 ids are present; the jsdom census asserts all 11 ids plus repeat counts. The real-Obsidian census does not list `pool.kill` / the two number boxes because they have no click/key listener (`change` / none), which the jsdom census covers by tag.

## Findings

### LOW-1 — a plain matrix row asserts SC-566's wrong label as the expected result
`test/dom/views/minion-stamina-pool-modal-matrix.test.ts:304` — `{ name: 'overkill: 99 x 5 empties the pool, kills everyone', ..., label: 'Deal 495 damage, kill 5 minion(s)' }`.
Scenario: SC-566's fixer makes the label say 20. The `test.failing` marker flips as intended, but this plain row goes red too, asserting the old wrong text as correct. Probe: `fix-566` -> 2 failures, the marker and this row (`j-fix-566.log`). The e2e README convention is that a plain test pinning behaviour a ticket will change carries `[current behaviour — SC-nnn will ...]` in its title; this row does not cite SC-566 at all.
Fix: drop `label` from that row (the marker owns the label), or retitle it `... [current behaviour — SC-566 will state the clamped 20 damage]`.

### LOW-2 — POOL-F05 (Escape = Cancel) cannot see a kill that saves early
`e2e/specs/minion-pool/pool-open.e2e.ts:83-89`. `stage()` ticks a kill box, then the test types into the damage box, and only the Escape is wrapped in `expectNoWrite`. Mutation `premature-kill` (the tick sets `isDead` and calls `persist()`, the CB-2/DC-6 class this modal has a history of) -> F05 **green**, K01 **green**; only F01 and F04 catch it, and only because the debounced write happens to land inside their `expectNoWrite` window (`e-premature.log`). Neither cancel test checks the note after closing (F04 checks only `amount: 5` and the group name).
Fix: in the cancel tests, wrap staging + cancel in one `expectNoWrite`, or after close assert `await dse.noteText(SQUAD)` equals the fixture text. Optionally have K01 wrap its two ticks in `expectNoWrite` (a tick never saves).

### LOW-3 — the manifest has no keyboard rows for the kill boxes or Apply
`e2e/manifest/minion-pool-modal.ts:17-30`. The surface can be completed by keyboard (Tab to a kill box + Space, Tab to Apply + Enter), but no pair asks for it: `pool.kill` has no `press:Space`, `pool.apply` has no `press:Enter`, and `pool.damage-amount` has no `press:ArrowDown` (its `min="0"` is the SC-241 guard; `sedit.apply-amount` lists ArrowUp/ArrowDown). `pool.stamina.dec` has no `press:Enter` at the floor, where the button disables while focused (the SC-495 / SC-465 focus-drop class; `sedit.temp.dec` has it). The ticket says "every (control, interaction) pair", and the stamina-modal precedent lists keyboard kinds.
Fix: add `press:Space` to `pool.kill` and `press:Enter` to `pool.apply` (one scenario: 16 typed, Tab to box 1, Space, Tab to Apply, Enter, one write, `isDead` on #1). `ArrowDown` on the damage box and Enter-at-floor on dec are optional.

### LOW-4 — the SC-567 marker can pass vacuously, and it leaves out the info line
`matrix.test.ts:659-669`. The only assertion is behind `if (apply.disabled && asked)`, and the setup is checked only before the second `typePool`. If an unrelated change stopped the second commit from happening, the body would pass and the marker would report "fixed". Also, in that state the info line still says "Select 1 minion(s) to kill." with 2 ticked (jsdom P5: `info: "4 damage will kill 1 minion(s). \nSelect 1 minion(s) to kill."`, `boxes: "oo---"`). A fix that rewords only the tooltip would flip the marker while the screen still asks for fewer kills than are ticked.
Fix: after `typePool(content, '16')`, assert `apply.textContent === 'Deal 4 damage, kill 1 minion(s)'` (true under both fixes). Apply the same invariant to the info line's "Select N" sentence. Tell SC-567 that the info line has the same defect.

### LOW-5 — the README fixture table does not list the new squad notes
`e2e/README.md:113-115`: the table lists every shipped fixture ("open them in Obsidian by hand") but not `Initiative/squad.md` or `Initiative/squad-hurt.md`.
Fix: add two rows (five Goblins of 4, pool 20; and pool 10, #1 and #2 dead, #3 grabbed + dazed and selected, `- grabbed` is rewritten as `{ key: grabbed }` on the first write).

### INFO
- INFO-1: POOL-C02's title (`pool-conditions.e2e.ts:23`) says "the pool edit survives the rebuild in between", but it removes the condition before staging any pool edit; POOL-C03 is the test that proves that. Retitle C02.
- INFO-2: `poolInfo()` (`e2e/driver/pool.ts:45-47`) reads `el.textContent` without a null check: with no pool modal open it throws a page TypeError instead of a readable message. Not hit today.
- INFO-3: the coverage gate dedupes the pool manifest's `reach` rows against the stamina-edit-modal's, so the gate would stay green if no pool test opened the modal from the tracker (stamina tests drive those pairs on a creature row). The pool specs do drive all three (E01, E03, E04).
- INFO-4: e2e run 1 hit RECOV-R07 (SC-517) at load 14-28; run 2 green. Not this branch.
- INFO-5: lifecycle now starts Obsidian **1.15.1** (the SKILL says 1.15.0).

### Checked and fine
- `dse.block()`: taking the scope and reading it declares nothing; click/type/dblclick/press on a block-tagged element declares the fence; the note is taken from the time of `block()`. A miss can only be a false red (an element that is not block-tagged writes legitimately), never a hidden write. `editedFences` is read-only.
- Product diff: 8 `control:` / `stampControl` additions in `src/views/MinionStaminaPoolModal.ts`, nothing else.
- Matrix: expectations are literals; captain-bonus rows really use the folded step (the 40->32 row would fail at step 4); two-squad rows check the other squad's pool is untouched.
- Shared helpers (`e2e/driver/pool.ts`, `MODAL_KINDS['minion-pool']`, `dse.editedFences`) are small and generic enough to copy for SC-436/437, as the implementer lists them.

## Product bugs (for the owner to file; none of these are fixed or marked in this branch)

1. **Condition icons in the pool modal cannot be used from the keyboard or a screen reader** — MEDIUM (a11y). Each icon is a `<div class="condition-icon">` with a click listener and no `tabindex`, `role` or accessible name (jsdom P4: `{tag: DIV, tabindex: null, role: null, aria: null}`), so Tab never reaches it and a minion's condition cannot be removed without a mouse. The tracker's own condition icons are real buttons (`src/framework/kit/conditionIcons.ts`, `iconButton`). Repro: open a squad pool modal for `Initiative/squad-hurt.md`, Tab through it: the Grabbed/Dazed icons are never focused. `src/views/MinionStaminaPoolModal.ts:556-579`.
2. **A pool at 0 with a living minion cannot kill that minion** — LOW. At pool 0 every remaining box shows ticked and locked, but Apply stays disabled as "No Stamina Change" with no info line (jsdom P1: `{pool: "0", label: "No Stamina Change", disabled: true, info: "(hidden)", boxes: "xxxxx"}`). Raising the pool is a refused heal, and lowering it back is no change, so there is no way to record the deaths. This state is reachable: relieving a squad's captain subtracts `n x alive` from the pool, clamped at 0 (`src/drawSteelAdmonition/EncounterData.ts:385`, `applyCaptainBonusTransition`), e.g. one minion left at pool 3 with a +4 captain bonus. `MinionStaminaPoolModal.ts:470` (disabled on `staminaChange === 0`) together with `:499-506`.
3. **Custom (unregistered) conditions are invisible in the pool modal** — LOW. `buildConditionIcons` draws an icon only when `getAnyConditionByKey` knows the key (`MinionStaminaPoolModal.ts:554-555`). The tracker draws the SC-186 fallback glyph for unknown keys, so a minion marked `on-fire` shows it in the tracker but not here, and it cannot be removed here (jsdom P3: 0 icons, empty row).
4. **One click removes every copy of a duplicated string condition** — INFO. `conditions.filter((entry) => entry !== conditionEntry)` (`:572`) compares strings by value, so `[grabbed, grabbed, dazed]` loses both `grabbed` entries on one click (jsdom P2). The UI probably cannot create duplicates; hand-edited YAML can.

## Artifacts
Scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc435-rev-r2-be71a0a9/`: gate logs (`tsc`, `lint`, `jest-full1`, `jest-two`, `e2e-full1`, `e2e-full2`, `lc-p1`..`lc-p5`, `lc-p5b`, `lc-base-s59`), mutation logs (`e-429-1`, `e-429-2`, `e-429-3`, `e-429-3b`, `e-429-4`, `e-handlers`, `e-handlers2`, `e-stray-name`, `e-stray-kill`, `e-stray-kill2`, `e-stray-dmg`, `e-stray-step`, `e-premature`, `e-probe-head`, `e-probe-base`), jest probes (`jprobe-head.log` = the P1-P12 survey, `jdom-head.log`, `jdom-base.log`, `dom-head.html`, `dom-base.html`, `j-fix-566.log`, `j-fix-567-trim.log`, `j-fix-567-reword.log`, `j-markers-plain.log`), and the scripts (`mutate.py`, `emut.sh`, `jfix.sh`, `eprobe.sh`, `run.sh`). The probe spec and the two jest probe files lived in the scratch worktree (`git worktree remove`d at the end, together with the e2e failure bundles of the mutation runs). Their sources are saved as `probe-src-_probe.e2e.ts.txt`, `probe-src-zz-reviewer-probe.test.ts.txt` and `probe-src-zz-reviewer-dom.test.ts.txt` in the scratch dir. The review worktree is unchanged: HEAD `7f5b2647`, `git status --porcelain` empty in `draw-steel-elements/`.

---

# r4 — scoped re-review of the r3 fix delta `7f5b2647..9d446582`

**Summary**
- Verdict: **LAND-READY.** 0 CRITICAL, 0 HIGH, 0 MEDIUM, 0 LOW, 1 INFO (new). All of r2's LOW-1..5, INFO-1 and INFO-2 are fixed as prescribed.
- Delta: 1 commit (`9d446582`), 8 files, tests/docs only (no `src/` change).
- Gates: tsc rc 0, lint rc 0 · jest (matrix + census) 104/104 (91 matrix + 13 census) · e2e full **`163/164 ok, 0 failed, 1 known-bug, coverage: 113/113 pairs`**, rc 0, on the first run (load 3.8 to 11.0; the 1 known-bug is POOL-C04 SC-572). Lifecycle not run, as instructed.
- LOW-2 is closed: the tick-kills-and-saves mutation now turns both F04 and F05 red, with no dependence on debounce timing.
- The new keyboard pairs are real. Deleting the kill box's change handler turns K05 red; removing the damage box's `min` turns A05 red; removing the stepper's focus handoff turns S08 red; stubbing Apply's onClick turns K05 red.
- All 7 markers (6 `test.failing` + POOL-C04 `knownBug`) fail today at their stated assertion. Each flips under a plausible scratch fix (SC-572 in jsdom and e2e, SC-573, SC-574 (a), SC-574 (b), SC-567 trim), and nothing else breaks.
- INFO-3 drop reasoning is confirmed in `e2e/run.mjs` `coverageGate`.

## Checks

1. **LOW/INFO folds**
   - LOW-1: the overkill row's `label` is now optional and omitted, with the assert guarded (`matrix.test.ts:291-313`). OK.
   - LOW-2: F04 and F05 wrap staging + cancel in one `expectNoWrite` (`pool-open.e2e.ts:70-96`). Probe `premature-kill` -> F04 red (`saw 1`), F05 red (`saw 1`) (`r4-premature.log`). In r2, F05 stayed green under the same mutation. OK.
   - LOW-3: manifest +4 pairs (`minion-pool-modal.ts:16,20,24,30`), giving coverage 113. OK.
   - LOW-4: `matrix.test.ts:660-674`. After the second commit, the test now asserts the label "Deal 4 damage, kill 1 minion(s)" unconditionally, which closes the vacuous path. It also checks the info-line invariant. The two invariant checks are still behind `if`. That is necessary: the title check must hold under both fix shapes (trim enables Apply; reword changes the title). Probes:
     - today: red at `:670` (Expected > 2, Received 1)
     - trim fix: the marker flips, nothing else breaks (`r4-j-fix-567-trim.log`)
     - tooltip-only reword: the marker stays failing because the info line still asks for 1 with 2 ticked (`r4-j-fix-567-reword.log`), as r2 asked. OK.
   - LOW-5: README rows added (`e2e/README.md:115-116`). OK.
   - INFO-1: C02 retitled. OK.
   - INFO-2: `poolInfo()` now throws a readable error (`pool.ts:44-51`). OK.
2. **Keyboard pairs** (`r4-kbd.log`, `r4-apply.log`):
   - POOL-K05 (`pool-apply-kills.e2e.ts:146-163`) uses real Tab/Space/Tab/Enter. It asserts the boxes, that Apply is enabled, one write, that the modal closes, and the note (`isDead` on #1, pool 16). With the change handler deleted: red (`o....`). With Apply's onClick stubbed: red (`no write`).
   - POOL-A05 (`:52-60`) asserts the screen plus no write. With `min="0"` removed: red (`-2`).
   - POOL-S08 (`pool-stepper.e2e.ts:142-155`) asserts the value, that dec is disabled, focus on `pool.stamina.input`, and no write. With the stepper's SC-495 focus handoff removed (`stepper.ts:193`): red (focus `null`).
3. **Markers.** All 6 `test.failing` tests turned plain, unmutated (`r4-markers-plain.log`):

   | Marker | Fails at | Under scratch fix |
   |---|---|---|
   | SC-566 | `:653`, label 495 | — |
   | SC-567 | `:670`, title | flips (trim) |
   | SC-572 | `:682`, not focusable | flips (`fix-572`: `<button>` with aria-label) |
   | SC-573 | `:692`, Apply disabled | flips (`fix-573`: Apply enabled when the pool is at or below 0 and kill rows exist) |
   | SC-574 (a) | `:699`, 0 icons | flips (`fix-574a`: fallback icon) |
   | SC-574 (b) | `:710`, both copies removed | flips (`fix-574b`: remove by index) |

   Each fix run: 1 failed (its marker) / 173 passed (`r4-j-fix-*.log`; unmutated 174/174, `r4-j-none.log`).

   POOL-C04 e2e: today it is `known-bug SC-572` (its `failsWith` matches; `r4-e-c04-today.log`). Under `fix-572` it reports `known bug SC-572 appears fixed - remove the marker`, and C01/C02/C03 stay green (`r4-e-fix572.log`).
4. **INFO-3.** `e2e/run.mjs` `coverageGate` keys `required` on `` `${control}\u0000${kind}` `` across all manifests, with no surface in the key. Drives are recorded by control id only. So a pool `reach` row can only be told apart from the stamina modal's if the tracker control's id differs. Drop reasoning confirmed.

## New finding

- INFO-r4-1: the SC-573 marker (`matrix.test.ts:688-693`) pins the fix at the modal: it sets `minion_stamina_pool = 0` after parsing. If SC-573 were instead fixed at the source (for example, relieving a captain marks minions dead when it zeroes the pool, `EncounterData.ts:385`), the modal state would become unreachable but the marker would stay red. Whoever fixes SC-573 should know to remove or rewrite it. No change needed now.

## r4 logs (scratch dir as above)
`r4-tsc.log`, `r4-lint.log`, `r4-jest-matrix.log`, `r4-e2e1.log`, `r4-premature.log`, `r4-kbd.log`, `r4-apply.log`, `r4-markers-plain.log`, `r4-j-none.log`, `r4-j-fix-572.log`, `r4-j-fix-573.log`, `r4-j-fix-574a.log`, `r4-j-fix-574b.log`, `r4-j-fix-567-trim.log`, `r4-j-fix-567-reword.log`, `r4-e-fix572.log`, `r4-e-c04-today.log`; scripts `mutate4.py`, `r4mut.sh`. The scratch worktree `mut4` was removed. The review worktree is unchanged (HEAD `9d446582`, dse `git status --porcelain` empty).
