# SC-435 round 1 — implementer report

**Executive summary**
- r3 (latest): head `9d4465825019deec7e734f66fedd59e01c5344b5`; e2e `163/164 ok, 0 failed, 1 known-bug, coverage: 113/113 pairs`; jest 6584 passed / 1 skipped / 2 failed (SC-568 timeouts, both suites 71/71 alone); G-S59 red on this branch AND on base `6270e84a` in the same window. See the "r3" section at the end.
- STATUS (after r1b): DONE. The two bug markers are in (SC-566, SC-567); the round-1 text below is kept as written. See the "r1b" section at the end.
- r1b head `7f5b2647a87b9b8c1ab9ad51409f9962dc15442b`; jest 6580 passed / 1 skipped / 2 failed (the two SC-568 timeouts, both suites 71/71 alone).
- Branch `sc435-e2e-minion-pool` in `draw-steel-elements/`, head `d65c31fb72ff0bca8006af59c1a731dab6033da2` (origin/develop still `6270e84a`, no rebase; `npm ci` was needed once: fresh worktree had no node_modules).
- Battery vs baseline: tsc + lint clean; e2e **160/160 ok, 0 failed, 0 known-bug, coverage 109/109 pairs** (baseline 128/128, 89/89); lifecycle **52/52** (21+16+9+4+2); shots 592, 0 FAIL, host-leak 163/978, capture clip 147; freeze **280/280**; parity **0/0/24**.
- jest: 6578 passed + 2 flaky timeouts under load that pass alone = 6580 passed / 1 skipped / 259 suites (baseline 6492; +88 = 85 matrix + 3 census). Two suites (`twin-reuse` SC-547, `initiative-default-keys`) time out at 5 s in a full parallel run while the host load is 17-50 (they also time out with the baseline product file); alone: 71/71 green. A clean full run is owed after the resume (see Gates).
- Bugs found: 2 (both LOW), see "Bugs". SC-429's four defects: all four pass as plain regression tests (no regression).
- Product code touched: attributes only (`data-dse-control` ids), no behavior change.

## Commits (all in `draw-steel-elements/`, none pushed)
- `6abcb211` feat(SC-435): data-dse-control ids on every MinionStaminaPoolModal control, its manifest and jsdom census
- `82060751` test(SC-435): dse.block() marks a block edited only on input inside it (SC-408 R2 LOW-1); driver self-test
- `1e505c40` test(SC-435): jsdom logic matrix for the minion pool modal (...)
- `d65c31fb` test(SC-435): e2e scenarios for the minion pool modal, squad fixtures, pool driver helpers, real-Obsidian census

## Controls added (`src/views/MinionStaminaPoolModal.ts`, attribute only)
`pool.stamina.dec`, `pool.stamina.input`, `pool.stamina.inc` (kit stepper prefix `pool.stamina`), `pool.damage-amount`, `pool.minion-count`, `pool.apply-damage`, `pool.kill` (repeated per living minion), `pool.minion-name` (repeated; a click toggles the box), `pool.condition` (repeated), `pool.reset`, `pool.apply`. Plus host ids `modal.close`, `modal.backdrop` (driver-resolved).

## Manifest: `e2e/manifest/minion-pool-modal.ts` (surface `minion-pool-modal`), +20 new pairs (89 -> 109)
- pool.stamina.dec: click, click-disabled
- pool.stamina.inc: click, click-disabled, press:Enter
- pool.stamina.input: type, press:Enter, press:Escape, blur
- pool.damage-amount: type
- pool.minion-count: type, press:ArrowUp
- pool.apply-damage: click
- pool.kill: click, click-disabled
- pool.minion-name: click
- pool.condition: click
- pool.reset: click
- pool.apply: click, click-disabled
- host `modal.close` (click, press:Escape) and `modal.backdrop` (click): already counted by the stamina modal manifest (the gate dedupes on (control, kind)).
- reach rows (host initiative): `init.detail.stamina` press:Enter, `init.detail.bar` click, `init.cell.stamina` dblclick (also deduped).
- Both censuses cover it: jsdom `test/dom/e2eCensus.test.ts` (+3 tests) and `e2e/specs/_census.e2e.ts` [CENSUS-06].

## e2e scenarios (`e2e/specs/minion-pool/`, 29 tests + CENSUS-06 + 2 driver self-tests)
- pool-open: POOL-E01..E05 (cell dblclick, Space/Enter after open change nothing, numeric Tab+Enter, bar click, dead-minion cell), POOL-F04 (X + backdrop), POOL-F05 (Escape).
- pool-stepper: POOL-S01..S07, H01, H02 (± buttons, disabled bounds, typed value Enter/blur/Escape/click-Apply, keyboard Increase, allowed heal, refused heal).
- pool-apply-kills: POOL-A01..A04, K01..K04, F01, F02 (Apply Damage row, count cap + ArrowUp stop, info line, kill boxes, name click, 0-pool auto-check + SC-429 item 1, whole squad, Reset, disabled Apply).
- pool-conditions: POOL-C01..C03 (icon click saves at once and the modal survives; DC-6 condition-then-damage in one session).
- `_driver.e2e.ts`: DRV-01, DRV-02 (the `dse.block()` fix).
- SC-429 regression tests (all plain, all pass): item 1 = POOL-K03; item 2 = POOL-E01 (focus on `pool.damage-amount`) + POOL-E02; item 3 = POOL-E04 + POOL-A03 (count box `max` = living minions, spinner stops at 3 of 5); item 4 = POOL-A04 (info line hidden at rest).
- Fixtures: `e2e/vaults/shipped/Initiative/squad.md` (5 Goblins x 4, pool 20), `squad-hurt.md` (pool 10, #1 and #2 dead, #3 grabbed + dazed and selected).

## jsdom matrix: `test/dom/views/minion-stamina-pool-modal-matrix.test.ts` (85 tests)
Death ladder (21 rows: full / 2 dead / last minion / mid-bracket / captain bonus step 8 / 3x10 squad), heal allowed vs refused (9 rows + lift), pool stepper (typed values, bounds, steps), Apply Damage row (11 rows + accumulate / caps / interplay), kill boxes (ticks, locks, name clicks, auto-check, surplus clear), Reset from 6 states, Apply persistence (once, which die), condition removal (6), two squads in one group. Addressed by control id. Existing `minion-stamina-pool-modal.test.ts` untouched.

## `dse.block()` fix (SC-408 R2 LOW-1), `e2e/driver/dse.ts`
`block()` no longer calls `declareTarget`. Elements handed out by a block scope (`root`, `control(...)`) are remembered in a WeakMap (`blockOf`) with their block; `click`, `type`, `dblclick` and `press` (on an element, not `aimedAt`) call `markEdited(el)` which declares the fence. `hover`, `tabTo`, `blur`, reads and `expect` matchers declare nothing. New read-only accessor `dse.editedFences(rel)` (used by `_driver.e2e.ts`). README sentence updated. Every existing spec still passes in the full run (all of them click into the block they write), so no call site needed a change.

## Bugs found (NOT marked yet: need the owner's ticket keys)
1. **Apply label and info line report the unclamped damage on overkill** (LOW). Repro: squad pool 20 (5 x 4), type damage 99, minions 5, press Apply Damage. The stepper shows 0 but the Apply button reads "Deal 495 damage, kill 5 minion(s)" and the info line "495 damage will kill 5 minion(s). Select 5 ...", while Apply writes pool 0 (20 damage). The StaminaEditModal states the clamped change since SC-427 R3-F5; this modal never did. `src/views/MinionStaminaPoolModal.ts:199` (`pendingStaminaChange -= totalDamage` is never clamped), label at `:458`, info at `:427`. Correct behavior for a `test.failing`: label "Deal 20 damage, kill 5 minion(s)", info "20 damage will kill 5 minion(s)...". The preview bar is documented as showing the full pending damage on purpose; only the texts are in question.
2. **Surplus kill ticks leave Apply disabled with a tooltip that asks for the wrong thing** (LOW). Repro: pool 20, type 12 (2 kills owed), tick Goblin #1 and #2, then type 16 (1 owed). Boxes stay `oo---` (2 ticked), Apply is disabled and its title reads "Select 1 minion(s) to kill" although 2 are selected, so the user must untick one and nothing says so. When 0 are owed the ticks are cleared (`updateCheckboxes` `:495`+), when 1 is owed they are not. `src/views/MinionStaminaPoolModal.ts:436-476` (title) and `:495-533` (`selectedCount >= minionsToKill`). The fix is a design choice (trim the surplus, or reword the title), so the `test.failing` needs a ruling on the intended behavior.
Nothing else reproduced: the real-Obsidian survey of every pair, the SC-429 four, the rebuild after a condition removal (DC-6) and the selection write racing a dblclick found no further defect.

## Drive-by fixes:
none.

## Follow-ups:
- With several squads in one group the pool modal's title is "<group name> - Minion Stamina Pool" for each (two squads in "Wolves" both read "Wolves - ..."); only the minion row names tell them apart. `MinionStaminaPoolModal.ts:94` (`setDseTitle`). Design question, not filed as a bug.
- `twin-reuse.test.ts` (SC-547 test, 5 s default timeout) and `initiative-default-keys.test.ts` (the "pool back at its parse value" test) time out in a full parallel run at load 17-50; both pass alone and the twin-reuse one also fails with the baseline product file. The SKILL's load-sensitive list does not name them.
- `npm run e2e` took about 3.5 min for 160 tests on this loaded host; the SKILL's "about 36 s" is stale (it was measured at 128 tests on a quiet host).

## Reuse for SC-436 / SC-437
- `e2e/driver/dse.ts`: `dse.editedFences(rel)` (read-only accessor); `MODAL_KINDS` entry pattern (`'minion-pool'`: add one key per new modal, matched by one of its own control ids); `dse.modal(kind)`.
- `e2e/driver/pool.ts` (copy the shape, do not extend it): `openPoolModal(note, via, nth)` (cell dblclick / numeric Tab+Enter / bar click), `expectPoolApply`, `poolBoxes()` / `poolInfo()` / `conditionTitles()` (page-side reads of repeated nodes, because `expect($$()[n]).not.toBeExisting()` throws "Index out of bounds" instead of passing), `applyPoolAndWrite`, `cellText(root, key)` (roster cell text by `data-instance-key`).
- Fixtures: `Initiative/squad.md`, `Initiative/squad-hurt.md` are the squad notes; the tracker rewrites a string condition (`- grabbed`) as `{ key: grabbed }` on its first write, so assert the object form.
- Gotchas: after a roster-cell dblclick, `dse.settle()` before an `expectNoWrite` (the selection write lands late); `dse.press(' ')`-style page presses (no target) are recorded as `(page)` and are exempt from the manifest check; a driven pair on a control not in any manifest fails the gate.
- jsdom: the matrix file's `open(spec)` + `boxes()` notation (`.` open, `o` ticked, `-` locked, `x` locked ticked) is local to that file; lift it to `test/dom/_*.ts` if the tracker's matrix wants it.
- Manifest: a `reach` row for a host control another manifest already lists costs no extra pair.

## Gates: logs and summary lines
Scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc435-impl-r1-a1/`
- tsc: `tsc-b.log` rc 0; lint: `lint-b.log` rc 0.
- e2e: `e2e-full1.log` -> `OBSIDIAN-E2E done: 160/160 ok, 0 failed, 0 known-bug, coverage: 109/109 pairs`
- lifecycle: `lifecycle-p1.log` 21/21; `lifecycle-p2.log` 16/16; `lifecycle-p3.log` 9/9; `lifecycle-p4.log` 4/4; `lifecycle-p5c.log` `done: 2/2 ok` (G-S59 + G-S49; two earlier part-5 runs, `lifecycle-p5.log` / `lifecycle-p5b.log`, failed G-S59 only with its own "environment (re-run, check /proc/loadavg)" wording at host load 25-35; it passed at load 5).
- shots: `shots-a.log` rc 0, 592 PNGs, 0 FAIL, `button host-leak OK (163 button kinds ... = 978 comparisons`, `capture clip OK (147 ...`.
- freeze: `freeze-a.log` -> `freeze OK (280/280 frozen print PNGs byte-identical`.
- parity: `parity-a.log` -> `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0 (ran before the last jest rerun, after freeze; nothing after it touches shots).
- jest: `jest-full-b.log`, `-d.log`, `-e.log`: 2 failed (the two load timeouts above), 6578 passed, 1 skipped, 258 of 259 suites; `jest-one-two.log`: the two suites alone 71/71; `jest-full-base.log`: baseline product file, same twin-reuse timeout; `jest-census.log` 13/13; `jest-one-m4.log` matrix 85/85.
- e2e probe/partial runs: `e2e-pool2.log` (minion-pool 29/29).

## What the resume needs
1. The owner files two tickets (DSE 7.0.0, Bug + DSE Plugin) or rules them out.
2. I add two `test.failing` markers (jest, matrix file) citing the keys, rerun tsc/lint/jest (and e2e if wanted; nothing e2e changes), and re-measure jest on a quieter host.

## r1b (2026-11-10): the two markers and the closing gates
- Commit `7f5b2647` test(SC-435): test.failing markers for SC-566 (overkill label) and SC-567 (surplus kill ticks). Both are in the matrix file, in a `known bugs` describe at the end.
- SC-566: `test.failing`; asserts the Apply label is "Deal 20 damage, kill 5 minion(s)" and the info line "20 damage will kill 5 minion(s)..." after 99 x 5 on a pool of 20. Run as a plain test it fails on the label line: Expected "Deal 20 damage, kill 5 minion(s)", Received "Deal 495 damage, kill 5 minion(s)" (the setup assertion that the stepper shows 0 passes first).
- SC-567: `test.failing`; asserts only the owner's invariant: a disabled Apply never carries a "Select N minion(s) to kill" title with N not above the ticked count. Setup (2 owed, 2 ticked, Apply enabled) is asserted before typing 16. Run as a plain test it fails on that invariant: Expected > 2, Received 1. It passes under a trim fix (Apply enabled, no title) and under a reword fix (title no longer matches).
- Not touched: SC-568, SC-569.
- tsc and lint: clean (`tsc-c.log`, `lint-c.log`, rc 0).
- jest full run `jest-full-r1b.log`: Tests 2 failed, 1 skipped, 6580 passed, 6583 total; Suites 2 failed, 1 skipped, 256 passed, 258 of 259 total. Both failures are "Exceeded timeout of 5000 ms" (`twin-reuse` SC-547 test, `initiative-default-keys` "pool back at its parse value" test). Load average at the run: 20.71 before start, 36.96 / 27.15 during (1-min). Those two suites alone (`jest-one-r1b-two.log`): 2 passed, 71/71 tests. The host never dropped below load 17 during this window, so a fully green run was not reachable; the gate rule (only the two SC-568 timeouts, both green alone) is met.
- e2e not rerun: the markers are jest-only; nothing e2e sees changed since the 160/160, 109/109 run.

## r3 (2026-11-10): review fold, keyboard pairs, five more markers
Commit `9d446582` test(SC-435): r3 fold of review LOW-1..5 and INFO-1/2, keyboard pairs, markers for SC-572, SC-573, SC-574 (a, b), SC-567 info line. No product source touched.

**Folded**
- LOW-1: matrix overkill row no longer asserts a label (`label?` optional, comment points at the SC-566 marker).
- LOW-2: POOL-F04 and F05 now wrap staging AND cancel in one `expectNoWrite`.
- LOW-3: manifest +4 pairs (109 -> 113): `pool.kill` press:Space, `pool.apply` press:Enter, `pool.damage-amount` press:ArrowDown, `pool.stamina.dec` press:Enter. Drivers: POOL-K05 (Tab to box, Space, Tab to Apply, Enter, one write, #1 dead), POOL-A05 (ArrowDown stops at 0), POOL-S08 (Enter on Decrease at pool 1 -> 0: dec disables and focus moves to `pool.stamina.input`, passes).
- LOW-4: SC-567 marker now asserts the label "Deal 4 damage, kill 1 minion(s)" unconditionally (setup), and extends the invariant to the info line ("Select N" with N >= ticked).
- LOW-5: README fixture table has `Initiative/squad.md` and `squad-hurt.md`.
- INFO-1: POOL-C02 retitled. INFO-2: `poolInfo()` throws "poolInfo(): no pool modal with an info line is open".
- INFO-3: dropped. The gate keys pairs on (control, kind) across all manifests, so the pool `reach` rows cannot get distinct ids unless the tracker's own control ids change (SC-437 territory). Note for SC-436/437: a `reach` row for a host control another manifest lists is deduped, so the gate cannot see whether a spec opens the surface from the tracker; the pool specs do (POOL-E01, E03, E04, E05).

**Markers (each run as a plain test first; each fails today at the stated assertion)**
| Test | File | Ticket | Fails today at |
|---|---|---|---|
| SC-566: 99 damage x 5 minions on a pool of 20 labels and explains the clamped 20 damage, not 495 | `test/dom/views/minion-stamina-pool-modal-matrix.test.ts` (`test.failing`) | SC-566 | label: Expected "Deal 20 damage...", Received "Deal 495 damage..." |
| SC-567: neither a disabled Apply nor the info line asks for fewer kills than are already ticked | same | SC-567 | title check: Expected > 2, Received 1 (setup asserts the label first) |
| SC-572: a condition icon is a focusable control with an accessible name | same | SC-572 | focusable: Expected true, Received false (div, no tabindex/role) |
| SC-573: a pool at 0 with living minions leaves Apply reachable so they can be killed | same | SC-573 | Apply `disabled`: Expected false, Received true (setup: pool 0, 5 kill rows) |
| SC-574 (a): a custom condition is shown in the modal and a click removes it | same | SC-574 | icon count: Expected 1, Received 0 (setup: the minion carries `on-fire`) |
| SC-574 (b): one click on a duplicated string condition removes one copy | same | SC-574 | conditions: Expected [grabbed, dazed], Received [dazed] (setup: 3 icons) |
| [POOL-C04] Tab reaches a condition icon and Enter removes that condition [known bug SC-572] | `e2e/specs/minion-pool/pool-conditions.e2e.ts` (`knownBug`, `failsWith: /Tab did not reach the control/`) | SC-572 | Tab never reaches the icon (setup: both icons drawn). When fixed, add `press:Enter` for `pool.condition` to the manifest. |
Matrix file: 91 tests (85 + 6 `test.failing`). The SC-567 info-line half was not exercised separately (the title half trips first); under a trim fix both halves pass, under a reword-only fix the info half still fails, as the review asked.

**Gates**
- tsc, lint: rc 0 (`tsc-r3b.log`, `lint-r3b.log`; an earlier red was a stray brace and an apostrophe in a title, fixed before the commit).
- e2e full, run 1 (`e2e-r3full.log`, load 51 at start): `162/164 ok, 1 failed, 1 known-bug, coverage: 113/113 pairs`; the one failure RECOV-R07 (`w.count` 2 vs 1, the SC-517 load flake the reviewer also hit).
- e2e full, run 2 (`e2e-r3full2.log`, load 11.5 at start): `OBSIDIAN-E2E done: 163/164 ok, 0 failed, 1 known-bug, coverage: 113/113 pairs`, rc 0.
- jest full (`jest-full-r3.log`, load 3.2 at start, 18.7 at the end of the run): Tests 2 failed, 1 skipped, 6584 passed, 6587 total; Suites 2 failed, 1 skipped, 256 passed, 258 of 259. Both failures "Exceeded timeout of 5000 ms" (`twin-reuse` SC-547 test, `initiative-default-keys` "pool back at its parse value" test) = SC-568. The two suites alone (`jest-one-r3-two.log`, load 8.7): 2 passed, 71/71.
- lifecycle part 5 (`lifecycle-r3p5.log`, load 6.8 at start): `done: 1/2 ok, 1 failed`: G-S49 ok; G-S59 FAIL "Runtime.evaluate: timed out after 30000 ms" (kept dir `/tmp/dse-obsidian-lifecycle-GYt4ZA`).
- G-S59 on base `6270e84a` in the same window (`lifecycle-r3base59.log`, load 3.4 at start, detached checkout of the same worktree, restored to the branch afterwards, head verified `9d446582`): `done: 0/1 ok, 1 failed`, "timed out waiting for the pin or hold released and the tracker redrawn" (kept dir `/tmp/dse-obsidian-lifecycle-H12noZ`). So G-S59 is red on base too, at load 3-7: not this branch. (Parts 1-4 were last green at r1: 21/21, 16/16, 9/9, 4/4; nothing they cover changed.)
- shots / freeze / parity: not rerun (no product source changed since r1).
- Load files: `load-before-e2e-r3.txt`, `load-before-e2e-r3b.txt`, `load-before-lc5-r3.txt`, `load-before-lc59base.txt`, `load-before-jest-r3.txt`.

## r5 (2026-11-10): rebase onto SC-561 and three gates
- dse: fetched, `origin/develop` = `6153acfe`; `git rebase 6153acfe` clean (6 commits). `git diff 6270e84a 6153acfe --stat`: only `visual-harness/obsidian-lifecycle.mjs`, so no e2e rerun; `package.json` unchanged, no `npm ci`. New dse head `2ee2e405b7f47878752592c4474d79328aa1008c` (subjects unchanged; r3 fold is the tip).
- Superproject (`-c submodule.recurse=false rebase 122117dd`): clean; HEAD `122117dd83ae0e5ee44c2b769bbd72ff3b8a9f2f` (the branch carried no commits of its own). The dse submodule is on branch `sc435-e2e-minion-pool` at `2ee2e405`; the superproject shows it as modified (pointer not bumped, as instructed). Note: `origin/main` has since moved to `51693653` (docs: sc561 ledger Done entry), one commit past 122117dd.
- tsc, lint: rc 0 (`tsc-r5.log`, `lint-r5.log`), load 6.59 at start.
- Lifecycle part 5 (`lifecycle-r5p5.log`, load 7.36 at start): `OBSIDIAN-LIFECYCLE done: 2/2 ok, 0 failed` (G-S59 ok, G-S49 ok).
- The two SC-568 suites alone (`jest-one-r5-two.log`, load 6.53 at start): 2 suites passed, 71/71 tests.
