# SC-437 r2 review: e2e and jsdom coverage of the initiative tracker

## Executive summary
- **Verdict: NOT LAND-READY.** One short fix round is needed. Everything left is in the tests, plus one new product bug that needs filing and a marker. The gates are green and the product diff only adds attributes.
- **Findings:** 0 CRITICAL / 0 HIGH / 5 MEDIUM / 3 LOW / 5 INFO.
- **New product bugs: 1.** NB-1 (MEDIUM): keyboard focus falls to `<body>` after every whole-tracker rebuild. Reproduced in real Obsidian.
- **Gates at `09644511`:**
  - tsc rc 0. lint rc 0.
  - jest: `6763 passed / 1 skipped`, `259 of 260` suites, rc 0. Loadavg 9.4 to 17.1. No SC-568 timeout this run.
  - lifecycle: 21 + 16 + 9 + 4 + 2 = **52/52**.
  - e2e run 1 and run 2 both: `199/205 ok, 0 failed, 6 known-bug, coverage: 142/142 pairs`. Both rc 0, no flake.
- **Pair count:** 142 recounted independently (29 new). No interactive node lacks an id. No real handler is missing a pair.
- **Mutation probes:** all 9 deleted or weakened handlers turn their e2e test red.
- **Both censuses catch** an un-id'd button in a row. The real census never renders the squad checklist or the "Make captain" button. A listener-only div there gets past BOTH censuses (M-5).
- **Known-bug markers:** all fail today for their stated reason. Under simulated fixes:
  - e2e `[INIT-X05]` "fails differently" (M-1).
  - The jsdom `[M07]` marker never flips (M-2).
  - The plain jsdom row at `initiative-matrix.test.ts:405` locks in the SC-578 behaviour (M-3).
  - The SC-578 "label no longer reads Spend" clause passes vacuously (M-4).
- **Confirmed in real Obsidian:**
  - SC-576 reproduces (no roster, no detail rows, heroes `0/30` and `0/40` with Dying chips; the note is written correctly).
  - Candidate 6 is not a bug (no modify event, mtime and disk bytes unchanged).
  - SC-579 is a plain `[INIT-M08]` test and passed in both runs.
  - Two-block and identical-twin integrity holds for every write tested.

## Findings

### MEDIUM

**M-1. The e2e SC-576 marker `[INIT-X05]` cannot pass under a correct fix.** `e2e/specs/initiative/reset-encounter.e2e.ts:91`
- **Failure scenario:** The marker asserts `toHaveText('60/60')` on `init.detail.stamina`. The Steel theme visually stands down that numeric button, so WebDriver's visible text is `''`.
- **Probe:** I simulated a view-level SC-576 fix (re-parse the reset model before the rebuild) in a scratch worktree.
  - The DOM was correct: three roster cells, detail `60/60`, heroes `30/30`. Screenshot: `x05-under-simulated-fix.png`.
  - The marker still reported `known bug SC-576 failed differently than pinned (/Index out of bounds/): ... Expected: "60/60" | Received: ""` (`rv2-mut3-e2e.log`).
  - Whoever fixes SC-576 gets a red test that blames their correct fix.
- **Fix:** Use `toHaveElementProperty('textContent', '60/60')`, as `[INIT-X06]` already does. Or assert the visible `init.detail.bar`. Keep `failsWith: /Index out of bounds/`.

**M-2. The jsdom SC-577 marker `[M07]` never flips under the natural fix.** `test/dom/elements/initiative-matrix.test.ts:698-703`
- **Failure scenario:** With the stepper given `min: 0`, the − button is disabled at 0. `.click()` does nothing, so no write lands, and `last()` throws `TypeError: Cannot read properties of undefined (reading 'length')`. The screen correctly shows `Malice: 0`. Because the body still throws after SC-577 is fixed, `test.failing` stays green forever.
- **Probe:** `rv2-mut3-jest.log` lists `[M07]` as the only marker that did not flip. `rv2-m07-jest.log` shows the same body run as a plain test: `dec.disabled=true`, `writes=0`, `shown=Malice: 0`, then the TypeError. The e2e twin `[INIT-M07]` does flip ("appears fixed").
- **Fix:** Assert the screen and "no negative value is ever written", not the last write:
  `expect(shown(root)).toBe('Malice: 0'); expect(writes().every((w) => parseYaml(w).malice.value >= 0)).toBe(true);`
  If you also want a write-path check, start from value 1 and press − twice.

**M-3. A plain jsdom row locks in the SC-578 behaviour as correct.** `test/dom/elements/initiative-matrix.test.ts:405`
- **Failure scenario:** The row `['-9', 'Spend', 2, 0], // the pool is clamped at 0; the log keeps what was typed` asserts `log == [{ amount: -9, label: 'Spend' }]`. Either fix the ledger allows (log the applied −2, or mark the clamp in the entry) turns this plain test red. The plain row and the `[M09]` marker contradict each other.
- **Probe:** Under a simulated "log the applied amount" fix, this row went red while `[M09]` flipped (`rv2-mut3-jest.log`).
- **Fix:** Drop the row. Or keep it and assert only `malice.value === 0` and one log entry, leaving the logged amount to `[M09]`.

**M-4. The SC-578 "shows the clamp" clause passes vacuously.** `e2e/specs/initiative/malice.e2e.ts:123`, `test/dom/elements/initiative-matrix.test.ts:721`
- **Failure scenario:** `entry.label !== 'Spend'` is true whenever the label changes for an unrelated reason. Examples: a regression that drops the label, a source prefix, normalisation, or a key rename (`label` becomes `undefined`). Any of these makes the marker report "appears fixed" while SC-578 is still open. The implementer's reading of "shows the clamp" does not hold up.
- **Fix:** Make the clamp clause positive. The entry must still carry the typed label AND name the applied change or the cap:
  ```ts
  const applied = m.value - 3;
  const showsClamp = String(entry.label ?? '').startsWith('Spend') && (Object.values(entry).includes(applied) || /cap|clamp|limit/i.test(String(entry.label)));
  expect(entry.amount === applied || showsClamp).toBe(true);
  ```
  Use `- 2` in the jsdom twin.

**M-5. The real-Obsidian census never renders the minion-squad checklist or "Make captain".** `e2e/specs/_census.e2e.ts:92-103`
- **Failure scenario:** CENSUS-07's title claims "the squad checklist and both captain buttons". It scans `captain.md` with the captain selected and checks only `init.captain.relieve` and `init.detail.action`. `init.detail.squad-action` and `init.captain.make` are never on screen in any real census.
- **Probe:** I added a listener-only `<div>` plus a `<button>` to `buildSquadActionChecklist` (scratch worktree).
  - The real census CENSUS-04/07/08 stayed **green** (`rv2-mut2b-e2e.log`).
  - The jsdom census caught only the `<button>` (`rv2-mut2b-jest.log`).
  - So a listener-only control there gets past both censuses. By contrast, an un-id'd button in a hero row and a listener-only div in the Malice bar turned CENSUS-04 and -07 red (`rv2-mut2-e2e.log`), and the button turned the jsdom census red (`rv2-mut2-jest.log`).
- **Fix:** In CENSUS-07, after the `captain.md` scan:
  1. Click a Goblin cell (`init.cell.stamina` nth 0), rescan, and expect `init.detail.squad-action`.
  2. Click the Warg Rider cell (nth 4), rescan, and expect `init.captain.make`.
  3. Assert `censusFindings(...) == []` after each.

### LOW

**L-1. Two drivers check only the note, not the screen.**
- **Where:** `[INIT-C02]` at `e2e/specs/initiative/actions-conditions.e2e.ts:77`, and `[INIT-M08]` at `e2e/specs/initiative/malice.e2e.ts:106`.
- **Probe:** With the condition-row re-render deleted (MUT-g), C01 went red but **C02 stayed green** (`rv2-mut1-e2e.log`).
- Both pairs are still covered with screen assertions by C01 and M03, so this is honesty, not coverage.
- **Fix:** C02: assert the creature's `init.cond.remove` icon is gone and Alice's Grabbed icon remains. M08: assert `Malice: 6` and the log header `Malice log · 1 entry`.

**L-2. The new fixture-table rows in the README are not indented.** `e2e/README.md:118-119`
- The table sits inside a list item and its other rows are indented two spaces. The two new rows start at column 0, so GFM ends the table there and the rows render as stray pipe text.
- **Fix:** Indent both rows by two spaces.

**L-3. A declared id with zero interactions leaves a gap in the allowlist.** `e2e/manifest/initiative.ts:32` (`'init.malice.value': c([])`)
- Both censuses accept any node carrying a declared id. The coverage gate requires no pair for a zero-kind id. If someone later attaches a click handler to the Malice value node, or reuses the id on a new control, it passes the census and the coverage gate silently.
- **Fix:** In `_census.e2e.ts`, fail when an eventful node carries an id whose manifest kinds are empty. The jsdom side can keep accepting it, since it is a focus target.

### INFO

**I-1. Surface completeness (brief item 1).**
- I listed every handler in `view.ts` (title span: click and Enter/Space keydown; textarea: input, Enter/Shift+Enter/Escape keydown, blur), the stepper, `collapsible`, `conditionIcons`, `iconButton`, the cell's dblclick, the chrome items and `ResetEncounterModal`.
- Every interactive node carries an id. Every real handler has a (control, kind) pair.
- 142 recounted (`rv2-pairs.out`): initiative 29 listed (3 pre-existing, 26 new) plus 3 new in reset-encounter-modal. The 39 `init.*` pairs are listed in that file.
- The ticket's "about 60 interactions" counts variants (portraits on/off, squad with or without a captain, single creature vs grid, multi-squad). Those sit in the jsdom matrix, as the Done bar allows.
- The title's paste path (input-event newline flattening) is covered only in jsdom (`T04-T07` row `two\nlines`). Acceptable.

**I-2. Every other mutation probe went red as expected** (scratch worktree, `mutate1.py`). Handlers mutated:
- Malice stepper no persist: M01 and M02 red.
- Advance round with no rebuild: R01 red on the screen (`Round 2`).
- Captain make/relieve with no rebuild: K01 and K02 red on the screen.
- Title blur drops the draft: T07 red.
- Reset confirm without the reset: X01 and X04 red.
- Squad exclusivity off: A03 red.
- Turn checkbox / group header with no repaint: N02 and N03 red.
- Enter in the amount field off: M04 red.
- Controls T01, N01, M03, X02 and S01 stayed green.
- Gap: jsdom K01-K02 does not catch a missing captain rebuild, because it re-selects the cell before asserting. The e2e tests do catch it.

**I-3. Integrity (brief item 8).**
- The driver's per-test invariant (`e2e/driver/noteFences.ts:131`) already checks the text above and below each block, fence lines, and that undeclared fences stay byte-identical. No shipped fixture has two initiative blocks, so I probed that myself (`probe-files/zz-two.md`, `zz-twins.md`, `zz-review-probes.e2e.ts`).
- ZZ-I01..I06 all ok across `rv2-probe-e2e.log` and `rv2-probe2-e2e.log`. Writes tested on block 0 and on block 1:
  - title, Malice +, quick-add, action pip, hero turn, Advance round;
  - captain relieve and Reset encounter on block 1 of different blocks;
  - Reset encounter on the second identical twin.
- In every case the other block and the surrounding text were untouched.
- Live Preview probes ZZ-LP1 and ZZ-LP2 passed (title edit; Malice + / Advance round / quick-add Enter).
- Harness note: in a long note, the second block's quick-add Add button sat under Obsidian's status bar and wdio's click was intercepted. This was a probe-geometry artifact, so the probe switched to Enter. No shipped spec is affected.

**I-4. Product diff (brief item 7).**
- Every `src/` hunk only adds `data-dse-control` stamps or passes one through (`git diff f69b8fd6..09644511 -- src/`):
  - view.ts: 24 lines changed;
  - `collapsible`: new optional `control` that only calls `stampControl`;
  - `conditionIcons`: passes `control` to `iconButton`;
  - `ResetEncounterModal`: Cancel `control`.
- No behaviour change. I did not re-run shots/freeze/parity: the numbers reported in Phase B match the baseline exactly.

**I-5. Possible product questions, not filed** (jsdom probes, `rv2-probe-jest.log`):
- A half-typed quick-add (amount and label) is discarded by any coarse rebuild, such as Advance round (B3). This follows from the rebuild design.
- Reset encounter keeps a mid-fight captain promotion: roles are treated as setup (B6). This is the owner's call.

## Product bugs

**NB-1 (NEW, MEDIUM, a11y). Keyboard focus falls to `<body>` after every whole-tracker rebuild.**
- **Repro (real Obsidian, `rv2-probe-e2e.log`):**
  - **ZZ-F1:** On `tracker.md`, type amount 2 and label "Kbd", then press Enter in the label field. The entry lands and `document.activeElement` is `BODY` (inTracker=false).
  - **ZZ-F2:** On `rich.md`, Tab to Advance round and press Enter. Focus ends on `BODY`.
  - **ZZ-F3:** On `captain.md`, Tab to "Relieve Goblin Captain" and press Enter. Focus ends on `BODY`.
  - A keyboard user loses their place after every one of these and must Tab again from the top of the note.
- **Cause:** `rebuildAndPersist()` at `src/elements/initiative/view.ts:163-170` calls the framework default `update()`, which runs `rootEl.empty()` and `onMount` again (`src/framework/view.ts:217-226`). Nothing restores focus.
- **Affected callers:**
  - Advance round, `view.ts:181`;
  - Reset turns, `:193`;
  - Reset encounter confirm, `:227`;
  - quick-add submit, `:609`;
  - captain make/relieve, `:1323`;
  - pool-modal apply, `:1687` and `:1808`.
- **Precedent:** SC-518 (focus to the redrawn card's pencil after a form Save) and SC-505/SC-511 (focus hand-off).
- **Known ticket:** none in the ledger's list.
- **Marker suggestion:** e2e `knownBug('SC-…', '[INIT-F01] Enter in the quick-add label field leaves focus in the quick-add row', …)` asserting `activeElement` is `init.malice.quickadd.amount` (or at least inside the tracker), with `failsWith: /inTracker|toBeFocused/`.

**Existing tickets, reproduced independently:**
- **SC-576:** Reproduced in real Obsidian (`[ZZ-576]` snapshot: `{"cells":0,"details":0,"heroStamina":["0/30","0/40"],"chips":["Dying","Dying"],"groups":2}`; the note body is correct). Screenshot: `sc576-after-reset-real-obsidian-r2.png`. Rated High: the rows vanish AND the heroes read Dying.
- **SC-575:** Reproduced. The full-run reason is `Expected: false / Received: true`.
- **SC-577:** Reproduced. `Expected: "Malice: 0" / Received: "Malice: -1"`.
- **SC-578:** Reproduced. `Expected: true / Received: false`.
- **Candidate 6:** Not a bug (ZZ-C6). Re-clicking the selected cell: no vault modify event, mtime and disk bytes unchanged. A Reset turns press on a tracker already in normalized form: no write.
- **SC-579:** `[INIT-M08]` is a plain `it(`, ok in both runs.

## Gates (logs under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc437-rev-r2-a98f536d5f88166db/`)

| Gate | Log | Result |
|---|---|---|
| tsc | `rv2-tsc.log` | rc 0, no output |
| lint | `rv2-lint.log` | rc 0 (only the pre-existing `.eslintignore` notice) |
| jest | `rv2-jest.log` | `Test Suites: 1 skipped, 259 passed, 259 of 260` / `Tests: 1 skipped, 6763 passed, 6764` / 104 s / loadavg 9.41 to 17.07 |
| lifecycle part 1 | `rv2-life1.log` | `21/21 ok` |
| lifecycle part 2 | `rv2-life2.log` | `16/16 ok` |
| lifecycle part 3 | `rv2-life3.log` | `9/9 ok` |
| lifecycle part 4 | `rv2-life4.log` | `4/4 ok` (G-S56 last) |
| lifecycle part 5 | `rv2-life5.log` | `2/2 ok` |
| e2e run 1 | `rv2-e2e1.log` | `199/205 ok, 0 failed, 6 known-bug, coverage: 142/142 pairs` (2:54) |
| e2e run 2 | `rv2-e2e2.log` | `199/205 ok, 0 failed, 6 known-bug, coverage: 142/142 pairs` (3:11) |
| shots / freeze / parity | not re-run | The diff only adds attributes and the Phase B numbers match the baseline |

**Probe evidence:**
- `rv2-mut1-jest.log`, `rv2-mut1-e2e.log`: handler mutations (I-2, L-1).
- `rv2-mut2-jest.log`, `rv2-mut2-e2e.log`: un-id'd button and listener-div census probes.
- `rv2-mut2b-jest.log`, `rv2-mut2b-e2e.log`: squad-checklist gap (M-5).
- `rv2-mut3-jest.log`, `rv2-mut3-e2e.log`, `rv2-m07-jest.log`: simulated SC-575..578 fixes (M-1..M-3).
- `x05-under-simulated-fix.png`.
- `rv2-probe-jest.log`: jsdom bug hunt.
- `rv2-probe-e2e.log`, `rv2-probe2-e2e.log`: integrity, Live Preview, focus, candidate 6, SC-576.
- `sc576-after-reset-real-obsidian-r2.png`.
- `rv2-pairs.out`: independent pair count.
- `evidence-mut-e2e-out/`: scratch e2e bundles.
- `mutate1.py`, `mutate2.py`, `mutate3.py`, `probe-files/`.

The scratch worktree is removed. The review worktree's dse tree is clean at `09644511` (`git status --porcelain` is empty before and after).

## r4 (scoped re-review of `09644511..df5009ec`)

### Summary
- **Verdict: NOT LAND-READY.** One MEDIUM is left, and the fix is a loosening in 3 places. The owner's concern about the SC-578 label is confirmed: a legitimate reword fails.
- **r2 fixes:** All are confirmed by probe.
  - M-1: `[INIT-X05]` now flips under a fix.
  - M-2: jsdom `[M07]` flips under a `min: 0` fix.
  - M-3: the `-9` row is gone.
  - M-5: a listener-only div in the squad checklist turns CENSUS-07 red.
  - L-1: C02 goes red without the re-render.
  - L-2: the README rows are indented.
  - L-3: a click listener on `init.malice.value` turns CENSUS-04 red with "declared with no interaction".
  - I-2: folded.
- **Markers under simulated fixes:** fixes for SC-575/576/577/578/588/589 make all 7 jsdom markers and all 6 e2e markers flip, and no plain test goes red.
- **Markers today:** each fails for its stated reason (full-run bundles).
- **SC-590:** nothing asserts it either way. No reset test involves a captain.
- **Gates at `df5009ec`:**
  - tsc rc 0. lint rc 0.
  - jest `6765 passed / 1 skipped`, `259 of 260` suites, rc 0. Loadavg 8.2 to 19.9.
  - e2e `199/206 ok, 0 failed, 7 known-bug, coverage: 142/142 pairs`, rc 0.

### Finding
**r4-M1 (MEDIUM). The SC-578 assertions fail a legitimate reword of the label.**
- **Where:**
  - `e2e/specs/initiative/malice.e2e.ts:128` and `test/dom/elements/initiative-matrix.test.ts:736`: `startsWith('Spend')`.
  - The new plain test at `initiative-matrix.test.ts:426`: `toMatch(/^Spend/)`.
- **Probe B1 (`mutate4b.py B1`):** the entry keeps the typed amount and its label becomes `Capped at 0: Spend`. That is a valid "the entry shows the clamp" fix.
  - e2e `[INIT-M09]` still reports `known-bug SC-578` (`rv4-B1C2-e2e.log`). So does jsdom `[M09]`. Both markers miss the fix silently.
  - The plain clamp test goes red (`rv4-B1-jest.log`).
- **Probe B4:** the entry logs the applied −2 and the label becomes `Capped: Spend`. jsdom `[M09]` flips, but the plain clamp test goes red (`rv4-B4-jest.log`).
- **Fix:**
  - **Both markers:** require that the label still contains "Spend" anywhere, not at the start. The clamp clause also accepts the applied amount written into the label:
    ```ts
    const lbl = String(entry.label ?? '');
    const rest = lbl.replace(/spend/i, '');
    const showsClamp = /spend/i.test(lbl) && (Object.values(entry).includes(applied) || /cap|clamp|limit/i.test(rest) || new RegExp(`(^|\\D)${Math.abs(applied)}(\\D|$)`).test(rest));
    ```
    The typed amount is 5 or 9 and the applied one is 3 or 2, so the digit test cannot match by accident.
  - **The plain test:** drop the label assertion. If you keep it, make it `toMatch(/Spend/i)`.
  - Optional (INFO): a fix that adds a second, correcting log entry still misses, because both read `log[0]`. Acceptable.

### Evidence (scratch folder `sc437-rev-r2-a98f536d5f88166db/`)
- **Gates:** `rv4-tsc.log`, `rv4-lint.log`, `rv4-jest.log`, `rv4-e2e1.log`.
- **Simulated fixes:**
  - `mutate3.py` + `mutate4a.py` give fixes for SC-575..578 plus 588/589.
  - jsdom: `rv4-fixA-jest.log` (7 marker flips, nothing else red).
  - e2e: `rv4-fixA-e2e.log` (6 "appears fixed", 9 plain ok).
- **SC-578 reword probes:** `mutate4b.py`, `rv4-B1-jest.log`, `rv4-B4-jest.log`, `rv4-B1C2-e2e.log` (this run also covers L-3).
- **M-5 and L-1:** `rv4-C1-e2e.log`.
- **Bundles:** `evidence-r4-mut-e2e-out/`.
- The scratch worktree `mut4` is removed. The review tree is clean at `df5009ec`.

## r5 (re-check of r4-M1 at `32441332`)

### Summary
- **Verdict: LAND-READY.** No new findings.
- **The diff matches the r4 snippet.** `df5009ec..32441332`, test-only, 10+/6-:
  - e2e `malice.e2e.ts:125-131` and jsdom `initiative-matrix.test.ts:733-739` require `/spend/i` anywhere in the label.
  - Their clamp clause is checked against the label minus "Spend": a cap/clamp/limit word, OR the applied amount appearing as a whole number, OR the applied amount stored in any field.
  - The plain clamp test at `initiative-matrix.test.ts:426` now uses `toMatch(/Spend/i)`.
- **The SC-578 marker still fails today for the stated reason** (`rv5-today-jest.log`).
  - The matrix run is 121/121 green, with `[M09]` failing as `test.failing` expects.
  - A plain copy of the `[M09]` body logs `entry={"round":1,"amount":-9,"label":"Spend"} applied=-2 showsClamp=false`, then `Expected: true / Received: false`.
- **It does not pass vacuously.**
  - A regression that drops or renames the label fails the `/spend/i` guard.
  - An unrelated relabel that still contains "Spend" has no cap word and no applied digit. The typed 9 or 5 differs from the applied 2 or 3, and `round` is positive while `applied` is negative. So the marker still fails.
- **B1 in jsdom** (label `Capped at 0: Spend`, amount kept as typed; `rv5-B1-jest.log`): `[M09]` flips and the plain clamp test stays green.
- **Clean-up:** the scratch worktree `mut5` is removed. The review tree is clean at `32441332`.
