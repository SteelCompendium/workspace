# SC-442 r2 review: real-Obsidian e2e and jsdom coverage of `ds-counter`

## Executive summary
- **Verdict: NOT LAND-READY.** One short fix round is needed (tests only, no `src/`), plus the rebase onto `129beb18` the ledger already plans. `src/` is untouched by the branch (0 files), as reported.
- **Findings:** 0 CRITICAL / 0 HIGH / 3 MEDIUM / 3 LOW / 4 INFO. **New product bugs: 2** (Low-Medium: a mouse-wheel scroll over the focused number box changes the value, and the next click away writes it; Low: ArrowDown on an out-of-range value jumps to the limit instead of stepping by 1).
- **M-1:** both SC-672 markers pass when the "fix" is a raw TypeError card. That breaks the owner's ruling. **M-2:** a plain jsdom census row pins SC-672 (B4) as correct. Under either reasonable SC-672 fix, 2 plain tests go red. **M-3:** the mouse wheel reaches the commit in the same way ArrowUp does, but the manifest does not list it. This is the first new bug above.
- **Gates at `fa5524a9`:** tsc rc 0 · lint rc 0 · jest `13793 passed / 1 skipped` (shots cache present; base 13642 / 1, so +151), rc 0, load 2.6 to 15.2 · e2e run 1 `664/679 ok, 0 failed, 15 known-bug, coverage: 427/427 pairs` (394 s). Run 2 had 2 failures: SET-X03 / SET-X04, the SC-657 flake signature, and 425/427 (416 s). Run 3 (the re-run): `664/679 ok, 0 failed, 15 known-bug, coverage: 427/427 pairs` (633 s at load 14 to 20). Lifecycle in seven `--only=` parts: 21 + 16 + 9 + 4 + 7 + 4 + 3 = **64/64**, rc 0 each, and each log shows only its own part's ids. Shipped plugin-data untouched (`git status` clean after every run). I did not re-run shots, freeze or parity: there is no `src/` change, and the implementer's numbers equal the baseline.
- **Pair recount:** counter = 4 + 4 + 6 = 14 pairs, so 417 + 10 = **427**. All 14 have a plain driver (coverage.json). After the rebase it should be 418 + 10 = 428.
- **Mutation probes (real Obsidian):** I broke 11 handlers. Each turned the relevant plain test red: dec mouse click, + Space, Enter commit, blur commit, Escape revert, ArrowUp/Down, at-limit disable, integer cut, note-vs-screen value, the field's max attribute, and the empty-box revert. The census mutant (an un-id'd button with a click listener) turned `[CENSUS-18]` and `[CENSUS-19]` red, plus 25 jsdom census tests.
- **Markers:** all 7 fail today for the stated reason. Each simulated fix flips only its own marker (SC-672: an error-card fix and a fresh-counter fix both flip W01 and W02), and all 24 plain counter e2e tests stay green under every fix. The one exception is M-1: a bad "fix" also flips W01 and W02.

## Findings

### MEDIUM

**M-1. Both SC-672 markers pass on a raw TypeError card. The owner's ruling forbids this ("do not let a raw error card pass (a)'s or (b)'s marker").**
- Where: `e2e/specs/counter/counter-bugs.e2e.ts:57-67` (CTR-W01) and `:69-73` (CTR-W02).
- Failure scenario: a fixer changes `Counter.parse` so that a non-map body crashes on its own, and an empty body crashes while destructuring. The card then shows `Cannot read properties of undefined (reading 'check')` for `hello` and `Cannot destructure property 'max_value' of 't' as it is null.` for the empty block. W01 checks only that `hello` survives. W02 bans only the literal `Cannot read properties`. Both markers report "appears fixed", the fixer removes them, and two raw error cards ship with no marker left.
- Probe: simulated bad fix `F672BAD` (`mutapply.py`), e2e `--element=counter`, `mut-e2e-F672BAD.log`: `CTR-W01 FAIL: known bug SC-672 appears fixed`, `CTR-W02 FAIL: known bug SC-672 appears fixed`. The raw card texts are in the copied bundles `evidence-F672BAD/CTR-W01/dse-root.html` and `evidence-F672BAD/CTR-W02/dse-root.html`. For comparison, the two good fixes (`F672A`: a friendly error for both bodies; `F672B`, the montage SC-628 precedent: empty means a fresh counter, non-map means a friendly error) flip both markers correctly, and the 24 plain tests stay green.
- Fix: one helper, used by both markers. If the card is an error card (`[data-dse-error-stage]`), its `.dse-error-card-message` must not look like a raw JS error: `not.toMatch(/Cannot (read|set) propert|Cannot destructure|is not a function|is not iterable|is not an object|of (null|undefined)\b/)`. W01 then asserts this and that `hello` survives. W02 asserts the regex in place of the single literal. Both still pass a fresh counter or a friendly card. Re-run `F672A` / `F672B` (they must flip) and `F672BAD` (it must stay known-bug).

**M-2. A plain jsdom census row pins SC-672 (B4: a non-map block draws a live counter) as correct.**
- Where: `test/dom/e2eCensus.test.ts:960-961` (`RENDERS = FIXTURES.filter((name) => name !== 'empty-block')` keeps `wrong-block`; its comment reads "A block with a body that is no map renders the same counter"). The rows at `:999-1011` then require `counter.dec` / `counter.input` / `counter.inc` to be stamped exactly once (`:1002`, `:1009`).
- Failure scenario: any reasonable SC-672 fix draws an error card for `hello`. Then `the wrong-block fixture note, editable` and `… read-only` go red: `Expected: 1, Received: 0` at `:1002`. So the fixer has to edit a plain test that pinned the bug. The ledger rules that no test may pin B1..B6 as correct.
- Probe: jsdom on the scratch worktree with `F672A` and with `F672B`. `mut-jest-F672A.log` and `mut-jest-F672B.log`: 2 failed / 266 passed, exactly those two rows. Under `F671`, `F673` and `F674` the same three suites (`counter-matrix`, `counter`, `e2eCensus`) stay 268/268 green (only K01 flips under `F673`, as it should).
- Fix: also exclude `wrong-block` from `RENDERS`, with a comment citing SC-672. If the census should still look at that fixture, use a separate row that asserts only `census(root) === []`, which holds for a counter and for an error card alike.

**M-3. The mouse wheel is a real interaction on `counter.input` that reaches the write, and the manifest does not list it. Today it causes a silent value change (product bug P-1).**
- Where: `e2e/manifest/counter.ts:17-21` (it lists ArrowUp / ArrowDown as the browser's own number stepping that "only change the draft: the commit is the same Enter or blur"). The wheel does exactly the same on a focused number field. The code under test is `src/framework/kit/stepper.ts:145-151` (`<input type=number>`, no wheel handling) and `:274-277` (the blur commit). The SC-495 comment at `stepper.ts:185-187` already names this hazard.
- Failure scenario: see P-1. Nothing drives a wheel, so this path has no coverage and no marker.
- Probe: reviewer probe `[ZZR-06]` (scratch only; `zzprobe.e2e.ts.txt`, `mut-e2e-PROBE.log`) on `Counter/unbounded.md`: type 7 and press Enter (written; focus stays in the box, as CTR-T01 pins). Then one real wheel notch (`browser.action('wheel')`, deltaY 300) over the box: it reads `6`. Then a real click on the heading: the note is written `current_value: 6`.
- Fix: the owner files P-1. Then either add a `wheel` interaction to `counter.input` with a driver verb (the e2e driver has no wheel today, so `recordDrive` needs a `wheel` kind) and a `knownBug` marker "a wheel over the focused box changes nothing", or rule wheel out of the manifest with a one-line reason in `counter.ts`. This is the owner's call. The brief's item 1 names wheel explicitly.

### LOW

**L-1. None of the 6 new e2e markers pins what fails (`failsWith`).**
- Where: `e2e/specs/counter/counter-bugs.e2e.ts:28, 38, 50, 57, 69, 75`. On develop, 9 of the 16 earlier markers pin it (`cond-add`, `cond-integrity`, `negotiation/wrong-values`, `settings/*`).
- Failure scenario: `knownBug` counts ANY throw as "known bug". A regression that stops the "+" on `quoted-value.md` from writing (a `waitForWrite` timeout), or that makes `unknown-keys.md` draw an error card (the `control()` lookup fails), keeps CTR-Q01 / CTR-U01 green as "known-bug", so the regression is hidden.
- Fix: pin today's reasons, taken from this run's bundles (`e2e/.out/20261115-183204-2e7d/CTR-*/error.txt`): V01 / V02 `/expected no write to Counter\/out-of-range\.md, saw 1/`; U01 `/note_to_self/`; W01 `/current_value: 1/`; W02 the M-1 raw-error regex; Q01 `/Received: "20"/`.

**L-2. CTR-E04 types an invisible U+E003 (WebDriver Backspace) literal that looks exactly like the genuine `''` in CTR-V01 / V02.**
- Where: `e2e/specs/counter/counter-typed.e2e.ts:145` (the bytes are `'\xee\x80\x83'`, which renders as `''`). Compare `counter-bugs.e2e.ts:32, 42` (a real `''`: click plus select-all only, draft unchanged).
- Failure scenario: a maintainer "normalizes" E04 to `''`. E04 then tests the untouched-field case and stays green: `[ZZR-11]` shows that `type('', { replace: true })` leaves `5` in the box, and mutant M11 (an empty box commits 0) is caught by E04 only because of the Backspace.
- Fix: write it as `''` with a comment, or select-all and then a named Backspace. Note that `dse.press('Backspace', input)` would credit `counter.input × press:Backspace`, a pair the manifest does not declare.

**L-3. The manifest's `rows` annotations are wrong.**
- Where: `e2e/manifest/counter.ts:14, 16, 21`. `T06` does not exist. `counter.dec` and `counter.inc` share one list (S01 drives only "+", S02 only "-", S04, the "-" click-disabled, is missing). `E03` drives only the field. The X01 / E04 / E05 drivers of the field are not cited.
- Fix: `counter.dec` `['SC-495', 'S02', 'S04', 'E02']`; `counter.inc` `['SC-602', 'S01', 'S03', 'E01', 'E03']`; `counter.input` `['T01'…'T05', 'E01'…'E05', 'X01']`.

### INFO

- **I-1.** No plain e2e test covers the typed path in Live Preview (all T / E tests use Reading view; the pairs are credited there, so the bar is met). Probes `[ZZR-02]`..`[ZZR-05]` show that in Live Preview, type + Enter, type + click away, ArrowUp + Enter and Escape all behave as in Reading view, write once, and leave the text outside the fence unchanged. One Live Preview typed test would be cheap insurance, since Live Preview is the common mode (the owner kept `[CENSUS-19]` for that reason).
- **I-2.** `[CENSUS-18]` / `[CENSUS-19]` (`e2e/specs/_census.e2e.ts:329-349`) do not pass the `inert` set for `counter.value` (declared with no interaction). This is moot in those editable views: the span exists only on a read-only host, and the jsdom census owns it.
- **I-3.** Rebase onto `129beb18`: `d62f0b26..129beb18` touches none of this branch's files and none of `stepper.ts`, `src/elements/counter/*` or `src/model/Counter.ts` (only `e2e/manifest/conditions-strip.ts` among the shared e2e paths). Expect `428/428`. The branch has no sidebar counter markers to recheck.
- **I-4.** CTR-Q01 takes about 6.2 s because `toHaveValue('6')` waits out its default 5 s before it fails. Harmless.

## Product bugs (new; owner files)

**P-1. A mouse-wheel scroll over the focused counter box changes the value, and the next click away writes it.** Severity: **Low-Medium** (a silent value change from a scroll gesture, not an edit).
- Repro (real Obsidian, `[ZZR-06]`): open `Counter/unbounded.md` (Torches 5) in Reading view. Click the number box, type 7 and press Enter: it writes 7, and focus stays in the box (by design, CTR-T01). Leave the pointer over the box and scroll the wheel one notch down: the box shows 6. Click anywhere else, e.g. the heading: the note now holds `current_value: 6`. Pressing Space or Enter on "-" at its limit also hands focus into the box (SC-495), so it is exposed to the wheel in the same way.
- Where: `src/framework/kit/stepper.ts:145-151` (Chromium steps a focused `<input type=number>` on the wheel; no `wheel` listener) and `:274-277` (blur commits the draft). The SC-495 comment at `:185-187` documents the hazard, but the ledger lists no ticket for it. This is shared kit code, so every editable stepper is affected (the stamina surfaces too).
- Known-ticket match: none in the ledger (not SC-670, SC-673 or SC-495).

**P-2. ArrowDown on a hand-edited out-of-range value jumps to the limit instead of stepping by one.** Severity: **Low**.
- Repro (`[ZZR-07]`): `Counter/out-of-range.md` (25, max 20). Tab to the box and press ArrowDown: the box reads 20 (the browser clamps on its own `max`). Enter writes `current_value: 20`. "-" steps 25 to 24 (CTR-V03, the documented "one step toward the range" contract in `view.ts:52-58` / `stepper.ts:37-48`).
- Where: `src/framework/kit/stepper.ts:149-151` (the `min` / `max` attributes drive the browser's stepping) with the typed-commit clamp at `:222-239`.
- Known-ticket match: same family as SC-673 (the number box rewrites an out-of-range value). The owner may fold it into SC-673 rather than file it. No marker exists today.

Confirmed still reproducing on `fa5524a9` (run 1 known-bug texts, `e2e/.out/20261115-183204-2e7d/CTR-*/error.txt`): SC-671 (U01: `extra`, `note_to_self` missing), SC-672 (W01: `hello` became `current_value: 1`; W02: `Cannot read properties of null (reading 'max_value')`), SC-673 (V01 / V02: one write, 25 became 20; jsdom K01 `-0`), SC-674 (Q01: the box reads 20).

## Review items, checked

1. **Surface:** the counter draws `counter.dec` / `counter.inc` (kit `iconButton`, real `<button>`, a click listener only; Enter and Space reach it as native activation), `counter.input` (keydown Enter / Escape, blur; the browser's ArrowUp / ArrowDown and wheel change the draft) or `counter.value` (a span, tabindex -1, no listener). The census bites on all of them. The collapse / expand / pin chrome belongs to `chrome.ts` (ruling). Missing interaction: the wheel (M-3). Paste is only a draft edit (the same path as `type`), so it is not a separate pair.
2. **`src/`:** `git diff --stat d62f0b26..fa5524a9 -- src` is empty.
3. **Censuses:** mutant C1 (`<button>Rogue</button>` with a click listener in `view.ts`): real `[CENSUS-18]` and `[CENSUS-19]` FAIL with `no data-dse-control: <button class=""> "Rogue" listens for click` (`mut-e2e-C1.log`); jsdom 25 failed / 85 passed (`mut-jest-C1.log`). Allowlists: `COUNTER_IDS` = counter + chrome only, and `ALL_IDS` is unchanged. Nothing swallows an extra id.
4. **Manifest honesty:** every plain driver asserts the note (`expectNoteBlock` values plus `waitForWrite` count / `expectNoWrite`) AND the screen. Mutants M1 to M11 (table below) each turn the relevant plain test red. The drivers that change nothing (E03 ArrowUp at max, T03 blur after Escape, S03 / S04 disabled clicks) are deliberate edges, and each pair also has a driver that changes the value (T04 / T05, T02, M7).
5. **jsdom matrix:** expectations are hard-coded literals or the parsed source spec (`expectWritten`); none is computed by the code under test. The out-of-range rows avoid B2, typed `-0` is only in K01, and B1 / B3 / B4 / B5 are not in the matrix. The only pinned bug is in the census file (M-2).
6. **Markers:** each obeys its ruling except W01 / W02 on raw cards (M-1). Fix simulations below.
7. **Missed bugs:** P-1 and P-2. Live Preview's typed path is clean (I-1).
8. **Shared files:** `_census.e2e.ts` and `e2eCensus.test.ts` are additive only (a new import plus a new describe). No `e2e/driver/*` change.
9. **Integrity:** the driver's after-every-test invariant compares each touched note with its fixture outside the declared fences. CTR-X01, CTR-L03 and matrix [X] cover twins. `git status --porcelain` was empty after e2e runs 1, 2 and 3 (shipped plugin-data included).
10. **Ids:** the new `[CTR-S01..S04, T01..T05, E01..E05, V01..V03, U01, W01, W02, Q01, X01]` and `[CENSUS-18, 19]` are unique on `fa5524a9`, on develop `129beb18`, and in every other worktree under `worktrees/` (SC-662 / SC-656 have landed and their worktrees are gone). No bracketed ticket id appears in a title, except the `knownBug` convention suffix and the jest `[known bug SC-673]` suffix on K01.

### Mutants (real Obsidian, scratch worktree, `--element=counter` unless noted)

| id | change (`mutapply.py`) | red plain tests |
|---|---|---|
| C1 | un-id'd button with a click listener in the card | CENSUS-18, CENSUS-19 (`--only`); jsdom census 25 |
| M1 | "-" ignores a mouse click (detail >= 1) | F02, V03 |
| M2 | "+" swallows Space | S01 |
| M3 | Enter in the box commits nothing | T01, T04, T05, E01, E02, E04, E05, X01 (V02 flips) |
| M4 | blur commits nothing | T02 (V01 flips) |
| M5 | Escape reverts nothing | T03 |
| M6 | ArrowUp / ArrowDown swallowed | T04, T05 |
| M7 | no at-limit disable | S02, S03, S04, E01, E02, E03, F01, F02, L05, V03 |
| M8 | `integer: false` | E05 |
| M9 | note gets value + 1, screen right | 18 tests |
| M10 | box loses its `max` attribute | E03 |
| M11 | an emptied box commits 0 | E04 |

### Simulated fixes (each flips only its own marker; 24/24 plain counter e2e green under every one)

| fix | flips | jsdom (`counter-matrix` + `counter` + `e2eCensus`, 268) |
|---|---|---|
| F671 keep unknown keys | U01 | 268/268 |
| F672A friendly error for empty + non-map | W01, W02 | 266/268 (M-2 rows) |
| F672B fresh counter for empty, friendly error for non-map | W01, W02 | 266/268 (M-2 rows) |
| F672BAD raw TypeError cards | W01, W02 (wrongly: M-1) | not run |
| F673 untouched draft commits nothing, `-0` becomes 0 | V01, V02 | 267/268 (K01 flips, as it should) |
| F674 coerce a quoted number | Q01 | 268/268 |

## Gates (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc442-rev-r2/`)

- tsc `npm run tsc`: rc 0, no output (`rv-tsc.log`, `rv-tsc.rc`).
- lint `npm run lint`: rc 0, only the `.eslintignore` deprecation warning (`rv-lint.log`, `rv-lint.rc`).
- jest `npx jest`: `Test Suites: 1 skipped, 298 passed, 298 of 299 total` · `Tests: 1 skipped, 13793 passed, 13794 total` · 98.8 s, rc 0. loadavg 2.62 at start, 15.21 at end (`rv-jest.log`, `rv-jest.rc`, `rv-jest.load`). The implementer's 13792 / 2 is the same count without the shots cache.
- e2e run 1: `OBSIDIAN-E2E done: 664/679 ok, 0 failed, 15 known-bug, coverage: 427/427 pairs`, rc 0, 394 s, load 12.5 to 7.2, `git status` clean (`rv-e2e1.log`, `.rc`, `.load`, `.status`).
- e2e run 2: `OBSIDIAN-E2E done: 662/679 ok, 2 failed, 15 known-bug, coverage: 425/427 pairs`, rc 1, 416 s, load 2.5 to 12.5. The failures were `SET-X03` "timed out waiting for the picker to filter to Settings/token.svg" and `SET-X04` cascading from it ("the scenarios before this reload test left data.json differing"). That is the SC-657 flake named in the ledger. Neither test touches the counter. Bundles were copied to `e2e2-bundles/SET-X03`, `e2e2-bundles/SET-X04`. `git status` clean (`rv-e2e2.log`, `.status`).
- e2e run 3 (the re-run after the flake): `OBSIDIAN-E2E done: 664/679 ok, 0 failed, 15 known-bug, coverage: 427/427 pairs`, rc 0, 633 s, load 13.6 to 15.7 (other agents' runs), `git status` clean (`rv-e2e3.log`, `.rc`, `.status`).
- lifecycle (`npm run obsidian-lifecycle -- --only=<part>`, `rv-lc1.log` … `rv-lc7.log`, chain summary `rv-lc-chain.progress`): part 1 `21/21 ok, 0 failed` (189 s) · part 2 `16/16` (325 s) · part 3 `9/9` (405 s) · part 4 `4/4` (297 s; G-S61 passed) · part 5 `7/7` (392 s) · part 6 `4/4` (298 s) · part 7 `3/3` (199 s) = **64/64**. `demo-vault/.obsidian/appearance.json` was clean before every part.
- shots / freeze / parity: not re-run. The branch changes no `src/`, CSS or harness file, so print bytes cannot move. The implementer's numbers (592 / 163/978 / 40/240 / 147; 280/280; 0/0/24) equal the baseline.
- Mutation and fix-sim e2e runs (scratch worktree, since removed with `git worktree remove`): `mut-e2e-<tag>.log` / `.rc` / `.diff` for C1, M1 to M11, F671, F672A, F672B, F672BAD, F673, F674. Summary in `mut-chain.progress`. Mutant source: `mutapply.py`. jsdom runs: `mut-jest-C1.log`, `mut-jest-F671.log`, `mut-jest-F672A.log`, `mut-jest-F672B.log`, `mut-jest-F673.log`, `mut-jest-F674.log`.
- Reviewer probes (scratch only, never committed): `zzprobe.e2e.ts.txt` → `mut-e2e-PROBE.log` (ZZR-01..08: wheel P-1, ArrowDown P-2, Live Preview I-1); `zzprobe2.e2e.ts.txt` → `mut-e2e-PROBE2.log` (ZZR-11..13: what `type('')` does, L-2); `mut-probe3.sh` → `mut-e2e-PROBE3a.log` / `PROBE3b.log`.
- Working tree: `git -C <review worktree>/draw-steel-elements status --porcelain` empty before (`rv-status-before.txt`) and after; HEAD still `fa5524a9`. Nothing committed or pushed.
