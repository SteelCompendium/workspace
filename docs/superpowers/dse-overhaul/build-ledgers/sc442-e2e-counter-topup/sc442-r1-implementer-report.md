# SC-442 r1 (phase A) implementer report

## Executive summary
- STATUS: NEEDS_CONTEXT (phase A stop, by contract). 6 bug candidates found (below), 0 product files changed.
- Branch `sc442-e2e-counter-topup` in `draw-steel-elements/`, head `b5a972fc`, on dse develop `bab0dbb2` (unmoved: fetched). Two commits, nothing pushed, superproject untouched.
- Controls: 4 ids on the counter (`counter.dec`, `counter.input`, `counter.inc`, `counter.value`). All four were ALREADY stamped by the kit stepper (`control: 'counter'` in view.ts), so phase A needed no `src/` change at all.
- Manifest pairs: 14 (4 existing, all already driven by CTR-F/L/K; 10 new for phase B). Expected coverage after phase B: 417 + 10 = 427/427.
- Censuses: jsdom `SC-442 census` block (28 tests, container-scoped, editable + read-only, mutation-checked) and real-Obsidian `[CENSUS-18]` (Reading view) + `[CENSUS-19]` (Live Preview), written but NOT run (no e2e in phase A; tsc + lint clean).
- jsdom matrix `test/dom/elements/counter-matrix.test.ts`: 122 tests. 14 product mutants run against it: 13 go red, 1 is an equivalent mutant.
- Gates: tsc rc 0, lint rc 0, jest 13756 passed / 2 skipped (fresh base without shots cache: 13606 / 2; +150 = 122 matrix + 28 census), jsdom census file 110/110.
- Owner decisions wanted: the 6 bugs (file or drop), `press:ArrowUp/ArrowDown` on `counter.input` as pairs (I included them, precedent `sedit.apply-amount`), a read-only e2e variant (none reachable without a Canvas fixture), CENSUS-19 (Live Preview) is extra.

## Commits (dse, branch `sc442-e2e-counter-topup`)
- `74de1cdb` test(SC-442): counter manifest (every control x interaction pair), container-scoped jsdom + real-Obsidian censuses, counter fixtures
- `b5a972fc` test(SC-442): counter jsdom matrix (buttons, limits, typed value, read-only, out-of-range, the note around the block)

## Controls (the surface boundary)
The counter draws exactly these interactive nodes (probed in a rendered card: `button, input, [tabindex]`):

| id | node | when |
|---|---|---|
| `counter.dec` | kit `iconButton` `-` | always (disabled at min, and for a read-only counter) |
| `counter.inc` | kit `iconButton` `+` | always |
| `counter.input` | `<input type=number>` (min / max / step=1 attributes) | writable counter |
| `counter.value` | `<span tabindex=-1>` (programmatic focus target only) | read-only counter (`canPersist` false) |

How they are stamped: `stepper(..., { control: 'counter' })` -> `stampControl(...)` in `src/framework/kit/stepper.ts` (`<prefix>.dec`, `.input` or `.value`, `.inc`). Nothing to extend; no shared kit code touched, so no other surface's census or manifest can move.

Chrome the counter card shows, and where it is already covered (NOT re-manifested):
- `chrome.collapse` (hover panel) and `chrome.expand` (the one-line collapsed form): `e2e/manifest/chrome.ts` (SC-505: press:Enter + click).
- `chrome.pin` (experimental gate only; absent in the shipped e2e config): `chrome.ts` (SC-505, press:Enter). `chrome.unpin` only on a sidebar panel.
- The `Edit Counter` item (Authoring controls preference, off by default) is a chrome item with NO `data-dse-control` id. It is in no census today because the preference is off in every census run. See Follow-ups.
- The read-only tooltip (`setTooltip`) is not a control.

## Manifest pairs (`e2e/manifest/counter.ts`): 14
Existing 4 (kept with their ticket refs): `counter.dec` x `press:Enter`, `click` (SC-495); `counter.inc` x `press:Enter`, `click` (SC-602).
New 10 (phase B must drive each with a plain test):
1. `counter.dec` x `click-disabled`
2. `counter.dec` x `press:Space`
3. `counter.inc` x `click-disabled`
4. `counter.inc` x `press:Space`
5. `counter.input` x `type`
6. `counter.input` x `press:Enter`
7. `counter.input` x `press:Escape`
8. `counter.input` x `blur`
9. `counter.input` x `press:ArrowUp`
10. `counter.input` x `press:ArrowDown`
`counter.value` lists no interaction (`c([])`, same as `init.malice.value`): nothing listens on it.

ArrowUp / ArrowDown: our keydown handler only acts on Enter and Escape. The keys are the browser's own number stepping, which changes only the DRAFT; the write is the same Enter / blur commit. I declared them (the brief's "if the browser number input reaches our onChange": it does, via the commit) because `sedit.apply-amount` already declares `press:ArrowUp/Down` for the same kind of field. Drop them if the owner disagrees (2 pairs).

### Which pairs the EXISTING specs already drive (all four with a plain test)
| pair | driven by |
|---|---|
| `counter.dec` x `press:Enter` | CTR-F01 (Reading, real Tab + Enter), CTR-L05 (Live Preview) |
| `counter.dec` x `click` | CTR-F02 (Reading, mouse) |
| `counter.inc` x `press:Enter` | CTR-L01, CTR-L03 (Live Preview) |
| `counter.inc` x `click` | CTR-L02 (Live Preview), CTR-K01 (Reading) |
Not driven by anything (the 10 new pairs above). CTR-L04 only edits the note from outside. CTR-F02's wheel over the field and click-away are not pairs.

### Proposed phase B specs (ids free on develop and on SC-662 / SC-656; checked)
- CTR-S01 Space on a focused "+" writes +1; CTR-S02 Space on "-" (Reading view, `Counter/counter.md`).
- CTR-S03 a click on the disabled "+" at max (`Counter/at-max.md`): no write, screen unchanged (`click-disabled`); CTR-S04 the same for "-" (`Counter/at-min.md`).
- CTR-T01 type + Enter commits one write (note and shown value); CTR-T02 type + click away (blur) commits; CTR-T03 Escape reverts a dirty draft and the click-away after it writes nothing; CTR-T04 ArrowUp then Enter; CTR-T05 ArrowDown then Enter (`counter.md` / `signed.md`).
- CTR-E01 typed past max clamps and "+" disables (note + `toBeDisabled`); CTR-E02 typed past min on `signed.md`; CTR-E03 ArrowUp at max stays at max (the field's own `max` attribute) then Enter writes nothing; empty-box revert and a decimal are jsdom-matrix cases but each can get one real-key test if the owner wants more than "one per pair".
- CTR-X01 (optional): two counters (`twins.md`) typed commit on the second leaves the first byte-identical.
- Markers for the bugs once keys exist (fixtures are already in place, see below).

## Censuses
- jsdom (`test/dom/e2eCensus.test.ts`, new `describe('SC-442 census: the counter, scoped by container')`, 28 tests): scope is the counter ROOT (stepper, name, chrome panel), ids allowed = counter manifest + `chromeIds`; no CSS-class lookup. Cases: the census bites on an editable AND a read-only counter (un-id'd `<button>` into `.dse-stepper`, `.dse-counter`, `.dse-chrome` and the root, an un-id'd `div[tabindex]`, an un-id'd `<input>`, a foreign id); every Counter fixture note, editable and read-only (11 of the 12 notes; `empty-block.md` errors by design, B5); no dead manifest row (every declared id stamped by some variant, manifest lists exactly the four ids); stamps sit on the right node types; chrome panel items present, `chrome.pin` only with the experimental gate on; read-only state.
- Regression proof: the injection tests above are the "catches a regression" test. Also mutation-checked: setting `control: undefined` in `counter/view.ts` turns 28/28 of the block red (reverted).
- real-Obsidian (`e2e/specs/_census.e2e.ts`): `[CENSUS-18]` Reading view, scope `.markdown-reading-view [data-dse-element="counter"] *`, `counter.md` then `at-max.md`; `[CENSUS-19]` Live Preview scope. Ids = counter + chrome manifests. NOT run (phase A has no e2e); `npm run tsc` (includes `-p e2e`) and lint pass. Phase B runs them first.

## jsdom matrix (`test/dom/elements/counter-matrix.test.ts`, 122 tests)
Real pipeline + real `ReadingModeBlockHost` over the FakeVault; each case reads the persisted block VALUES (parsed YAML, `toEqual` against the source with only `current_value` changed, so no key is added or lost) and the DOM (shown value, each button's real `disabled`); nothing compares fence text.
- [S][E] buttons: 21 rows (no limits / max only / min only / both / negative range / min==max; at-limit buttons are disabled and a click writes nothing) + 4 multi-press rows (coalesced into ONE write; presses past a limit) + Space/Enter-as-click (detail 0) focus hand-off (SC-495 still holds) + mouse press moves focus nowhere.
- [T][E] typed value, 28 shapes x BOTH Enter and blur = 56 tests: integer, zero, max, held value (no write), leading zeros, past max / far past / under min, negative with and without a negative min, decimals (cut toward zero, never a float), `.5`, exponent (`1e1`, `1e3`, `1e-1`), empty, letters, whitespace, comma, hex (jsdom empties the box for the last four, so they pin the revert path); untouched in-range field commits nothing; Enter-then-blur writes once; typed then "+"; Escape dirty / clean; ArrowUp/Down/a/Tab/Space are not commits; attribute min/max/step.
- [R] read-only: 6 value rows (span, no input, both buttons disabled, clicks write nothing) + span focus + writable counterpart.
- [V] hand-edited out of range: shown as stored, nothing written by drawing it (past max, under min, max-only, min above max: both buttons disabled), ± steps toward the range one at a time, a typed value clamps into the range.
- [X] note integrity: 5 write paths each keep the text above / below and the fence lines; a note with headings, list, table, a js fence, a quote and trailing spaces; two distinct counters (no cross-talk, in both orders); two IDENTICAL counters; SC-652 `prefs:` + `collapsed:` survive a press and a typed commit, once each; declared heights kept, no default added (SC-482); a name-only block.
- Deliberately NOT in the matrix (a plain test would pin a bug as correct): blur / Enter on an untouched out-of-range field (B2), a quoted or non-number `current_value` (B3), a non-map or empty body (B4/B5), typed `-0` (B6), unknown keys (B1). Phase B adds `test.failing` for each once keys exist.
- Mutants (each product change reverted afterwards; `git status` clean): "+" never disables 24 red; "-" never disables 32; `integer:false` 12; Enter handler off 39; blur handler off 28; Escape off 1; persist off 82; read-only keeps field 7; read-only buttons enabled 6; `clampInitial:true` 9; focus hand-off off 1; step size +1 15; draft not clamped 2 (only the out-of-range rows can see it). Equivalent (green): calling `persist()` directly in onChange (it is already debounced).

## Fixtures added (`e2e/vaults/shipped/Counter/`, rows in `e2e/README.md`)
`unbounded.md` (Torches 5, no max/min), `at-max.md` (3 of 3), `at-min.md` (0, min 0), `signed.md` (min -5, max 5, 0), `out-of-range.md` (25 of 20), `unknown-keys.md` (`note_to_self`, a map `extra`), `quoted-value.md` (`current_value: "5"`), `wrong-block.md` (`hello`), `empty-block.md` (empty fence). The last four are bug fixtures; unused if the owner drops those bugs. No read-only fixture: a read-only counter in real Obsidian needs a Canvas card (`sourcePath ''`), print/export or a nested render; none of these exists in the e2e vault (jsdom covers read-only fully; `counter.value` lists no interaction).

## Integrity probes (jsdom, real host; probe sources in the scratch dir, never committed)
| probe | result |
|---|---|
| content above / below the block survives a write | OK (matrix [X]) |
| unknown top-level keys survive | FAIL, B1 |
| SC-652 `prefs:` / `collapsed:` survive | OK (matrix [X], plus existing CTR-K01 / wrapperKeysKept) |
| two counters, distinct and identical, no cross-talk | OK |
| hand-edited value past max / under min: shown as stored, `±` steps toward range, not rewritten by drawing, by Collapse / Expand, or by focus alone | OK for those; FAIL on focus then blur / Enter (B2) |
| min > max (4, min 5, max 3) | both buttons disabled for good, shown as stored, not rewritten by blur / Enter / press. Sane enough for nonsense input; not a bug candidate |
| non-number `current_value` (`abc`, quoted `"5"`) | FAIL, B3 |
| typed decimal / negative / exponent / whitespace / empty | OK (matrix [T]); `-0` FAIL, B6 |
| non-map or empty block body | FAIL, B4 / B5 |
| `value_height: 0` authored is written back as 3 | documented in `counter/model.ts` header (SC-482 note); not a bug |
| key order after a write (max_value, current_value, min_value, name, heights) | the documented byte-compat serialization; not a bug |

## Bug candidates (none matches a known open ticket; SC-495 / SC-602 / SC-652 / SC-290 / SC-457 / SC-476 / SC-493 all still hold)
Severity is my read; the owner decides what to file. Repros are jsdom against the real pipeline and host, all reproducible with the fixtures above.

**B1. A write drops every top-level key the counter does not know.** (MEDIUM, data loss in the user's note.)
Repro: `Counter/unknown-keys.md` (`note_to_self: keep me`, `extra: {a: 1}` above the known keys); press "+". Written block: `max_value, current_value, min_value, name` only; both unknown keys gone. Montage / negotiation had the same family (SC-625 / SC-637); not a known counter ticket. SC-652 keeps only `prefs:` and `collapsed:`.
Where: `src/elements/counter/model.ts:43-44` (`serialize` writes only the `Counter` instance) fed by `src/model/Counter.ts:41-52` (`parse` copies six named fields and drops the rest).

**B2. Focusing the number field and leaving it, or pressing Enter in it, silently rewrites a value that is outside [min, max].** (LOW-MEDIUM; no user edit, a silent value change.)
Repro: `Counter/out-of-range.md` (25 of max 20). Click into the field, click away: the note is written with `current_value: 20`. Enter in the untouched field does the same; `-5` under min 0 becomes 0. Jest shows the draw writes nothing and Collapse / Expand / focus alone write nothing; only blur / Enter on the field. The view's own comment says the value should be "shown as stored" and only a TYPED edit clamps.
Where: `src/framework/kit/stepper.ts:222-239` (`parseDraft` clamps the clean draft, `commitDraft` then calls `commit(next)`; the "no-op unless changed" guard compares the CLAMPED value with the unclamped `current`), reached by `owner.registerDomEvent(el, 'blur', ...)` at `stepper.ts:274`. Seeded unclamped by `src/elements/counter/view.ts:59` (`clampInitial: false`). Shared kit code (stamina bar and others use the stepper), so a fix there needs care: this is the counter's `clampInitial: false` path only.

**B3. A non-numeric `current_value` breaks the buttons: a quoted number concatenates.** (LOW-MEDIUM.)
Repro: `Counter/quoted-value.md` (`current_value: "5"`, max 20): "+" shows and writes 20 (`"5" + 1` is `"51"`, clamped to the max); "-" works (4). Without a max the write would be the string `"51"`. `current_value: abc`: "+" writes `abc1`, "-" writes `.nan`. Focus then blur on `"5"` rewrites it as the number 5. Same family as montage's quoted numbers (SC-628).
Where: `src/model/Counter.ts:45` (`raw.current_value ? raw.current_value : 0`, no number coercion) and `src/framework/kit/stepper.ts:136,163` (`current - step`, `current + step` on an uncoerced seed).

**B4. A block whose body is not a map (text, list, number) draws an empty-looking working counter and the first press overwrites the text.** (MEDIUM-LOW.)
Repro: `Counter/wrong-block.md` (`hello`; also `- a\n- b`, `5`, `true`): the card shows 0 with live buttons, no error; "+" rewrites the block to `current_value: 1`, the user's text gone. Montage and negotiation show a plain error card and write nothing (SC-628 / SC-638); the counter has no schema (deliberate, per `definition.ts`), so nothing catches it.
Where: `src/model/Counter.ts:41-52` (`parse` never checks the shape of `data`), `src/elements/counter/definition.ts` (no `schema`).

**B5. An empty counter block (blank, or only a comment) shows a raw TypeError card.** (LOW.)
Repro: `Counter/empty-block.md` (`ds-counter` with nothing in the fence): the error card reads "Counter: failed to render (render)" + `Cannot read properties of null (reading 'max_value')`. A freshly inserted empty block is a normal moment to see this.
Where: `src/model/Counter.ts:44` (`raw.max_value` on `null`; `parseYaml('')` is `null`).

**B6. Typing `-0` (or `-1e-3`) writes `current_value: -0`.** (LOW, cosmetic.)
Repro: `counter.md`-style counter at 5, min 0: type `-0` (or `-1e-3`) + Enter: the note holds `current_value: -0` (the field shows 0). It reads back as 0, so no state is lost, but the note carries a `-0`. From 0 it is a no-op (`-0 === 0`).
Where: `src/framework/kit/stepper.ts:222-226` (`Math.trunc(-0.001)` is `-0`, `clamp` returns it, `commit` sees `-0 !== 5`). Shared kit code.

Not bugs (probed): an unbounded counter (no `max_value`) takes `1e3` and 20-digit numbers (written as 12345678901234567000, a plain float rounding); `max_value: null`/blank is rewritten as `max_value: null` after a write (same YAML meaning).

## Drive-by fixes:
None.

## Follow-ups:
- The `Edit <element>` chrome item (Authoring controls preference) has no `data-dse-control`, so with that preference on every chrome-panel element (counter included) has an un-id'd button no census covers; `chrome.ts` does not list it either. Shared chrome, not this ticket.
- Real-Obsidian read-only counter has no fixture or driver (Canvas needs a `.canvas` fixture and a different open path); the jsdom census and matrix cover the read-only variant fully.
- `test/dom/e2eCensus.test.ts` header comment says the census is for "the pilot surfaces" with chrome excluded; the montage / negotiation / counter blocks scope by root with chrome included. Wording only; left alone.

## Gates (phase A)
All run in the worktree through devbox; logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc442-impl-r1/`.
- `npm ci`: rc 0 (`npmci-run1.log`).
- Fresh base jest, before my first commit (no shots cache): `Tests: 2 skipped, 13606 passed, 13608 total`, 296 suites + 1 skipped, rc 0 (`jest-base.log`). The brief's 13607 / 1 is the with-cache figure.
- tsc (`npm run tsc`, includes `-p e2e`): rc 0 (`tsc-final.log`, `tsc-final.rc`).
- lint (`npm run lint`): rc 0 (`lint-final.log`, `lint-final.rc`).
- jest, full, at head `b5a972fc`: `Test Suites: 1 skipped, 297 passed, 297 of 298 total; Tests: 2 skipped, 13756 passed, 13758 total; Time 88.5 s`, rc 0 (`jest-final.log`). +150 over base = 122 matrix + 28 census.
- jsdom census alone (`test/dom/e2eCensus.test.ts`): `Tests: 110 passed, 110 total`, rc 0 (`census-final.log`).
- Mutation runs: `mut1.summary` (+ `mut1-<name>.log`); census mutation in the transcript only (28 failed, reverted).
- Not run (phase A scope): lifecycle, e2e, shots, freeze, parity.

Scratch evidence (probes, uncommitted): `probe1.log`, `probe2.log`, `probe3.log`, and sources `zz-sc442-probe.test.ts.txt`, `zz-sc442-probe2.test.ts.txt`, `zz-sc442-probe3.test.ts.txt` in the same scratch dir.

## Phase B

### Executive summary
- STATUS: DONE. Rebased head `fa5524a9` on dse develop `d62f0b26` (SC-656 landed; 3 commits, no conflicts, package.json unchanged so no second `npm ci`). Nothing pushed; superproject untouched. `src/` is unchanged by this ticket (attribute stamps already existed).
- e2e full run, twice: `664/679 ok, 0 failed, 15 known-bug, coverage: 427/427 pairs` both times (base 646/655, 9 known-bug, 417/417; +24 tests, +10 pairs, +6 markers). Wall time 342 s and 355 s.
- jest 13792 passed / 2 skipped (fresh, no shots cache; base 13642 with cache = 13641 / 2 fresh, so +151 = 122 matrix + 28 census + 1 `test.failing`). tsc and lint rc 0.
- lifecycle 64/64 on the rebased head (21+16+9+4+7+4+3, G-S61 passed this time). shots 592 with 0 FAIL, host-leak 163/978, modal host-leak 40/240, capture clip 147; freeze 280/280; parity 0 gaps / 0 undeclared / 24 declared.
- Markers: SC-671 (CTR-U01), SC-672 (CTR-W01, CTR-W02), SC-673 (CTR-V01, CTR-V02, jsdom K01 `test.failing`), SC-674 (CTR-Q01). Each fails for its stated reason today (error text checked); the simulated-fix flip was not run.
- `git status` clean after e2e, including `e2e/vaults/plugin-data.shipped.json`.

### Commits (rebased, dse branch `sc442-e2e-counter-topup`)
- `0697544b` test(SC-442): counter manifest, censuses, fixtures
- `60b6f0e6` test(SC-442): counter jsdom matrix (+ the SC-673 `test.failing` for `-0`)
- `fa5524a9` test(SC-442): counter e2e specs and known-bug markers for SC-671 SC-672 SC-673 SC-674

### Specs (`e2e/specs/counter/`; ids re-grepped on d62f0b26 and on the SC-662 worktree: no clash, no duplicate)
- `counter-steppers.e2e.ts`: CTR-S01 Space on "+" (inc x press:Space), S02 Space on "-" (dec x press:Space; focus lands in the field), S03 click on disabled "+" at max (inc x click-disabled), S04 click on disabled "-" at min (dec x click-disabled).
- `counter-typed.e2e.ts`: CTR-T01 type + Enter (input x type, press:Enter), T02 type + real click away (blur), T03 Escape then click away (press:Escape, no write), T04 ArrowUp then Enter, T05 ArrowDown then Enter (negative min), E01 past max clamps and "+" disables, E02 past min clamps and "-" disables, E03 ArrowUp at max stays, Enter writes nothing, E04 emptied box reverts (Backspace through `dse.type`), E05 decimal 2.7 writes 2, X01 twins: typed value on the second leaves the first alone.
- `counter-bugs.e2e.ts`: CTR-V03 (plain) out-of-range shown as stored, "-" steps to 24; markers CTR-V01, CTR-V02 (SC-673: click into the box + click away / Enter leaves 25 alone), CTR-U01 (SC-671: `note_to_self` and `extra` survive a "+", parsed values), CTR-W01 (SC-672a: `hello` still in the note after a press attempt; a card with no button passes; opened with `errorCard: true`), CTR-W02 (SC-672b: the card never shows "Cannot read properties"), CTR-Q01 (SC-674: after "+" on `"5"` the box reads 6 and the note holds 6 as number or text).
- Each drive asserts the note (parsed block values via `expectNoteBlock`, `waitForWrite` count 1 or `expectNoWrite`) and the screen (`toHaveValue`, `toBeDisabled` / `toBeEnabled`, focus where relevant).
- Every one of the 14 pairs has a plain (non-marker) driver: the 4 older ones by CTR-F/L/K, the 10 new ones by S01-S04, T01-T05 (type, Enter, Escape, blur, ArrowUp, ArrowDown).
- Marker detail: V01/V02 begin with a real click into the box (`dse.type(input, '', { replace: true })`, select-all, draft stays 25) because the driver only counts a block as edited after a click / type / press; a script focus plus blur read as an undeclared write (first run, CTR-V01 invariant failure, fixed).
- Failure texts today: V01/V02 "expected no write ... saw 1"; U01 diff shows `extra` and `note_to_self` missing; W01 note holds `current_value: 1` where `hello` was; W02 "Cannot read properties of null (reading 'max_value')"; Q01 box reads "20".
- Real-Obsidian censuses `[CENSUS-18]` (Reading) and `[CENSUS-19]` (Live Preview) pass (first run: 18/24 selected tests ok, then full runs).

### Gates on the rebased head `fa5524a9` (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc442-impl-r1/`)
- tsc rc 0 `b-tsc3.log`; lint rc 0 `b-lint3.log`.
- jest `b-jest3.log`: `Tests: 2 skipped, 13792 passed, 13794 total`, 298 suites passed, rc 0.
- lifecycle `b-lcR1.log`..`b-lcR7.log` (rc 0 each): 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3 = 64/64, 0 failed.
- e2e `b-e2eF1.log`, `b-e2eF2.log`: both `OBSIDIAN-E2E done: 664/679 ok, 0 failed, 15 known-bug, coverage: 427/427 pairs`, rc 0; wall 342 s and 355 s.
- shots `b-shots.log` rc 0: 592 `ok` lines, 0 FAIL, button host-leak 163 kinds / 978 comparisons, modal host-leak 40 / 240, capture clip 147.
- freeze `b-freeze.log` rc 0: `freeze OK (280/280 ...)`.
- parity `b-parity.log` rc 0 (ran last): `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.
- Pre-rebase runs (superseded, not counted): counter-only e2e on bab0dbb2 (`b-e2e-counter1.log`, `b-e2e-counter2.log`), lifecycle parts 1-5 on the old base (`b-lc1.log`..`b-lc5.log`, G-S61 red there: SC-668); part 6 was killed by my own PID when the base moved.

### Drive-by fixes:
None.

### Follow-ups:
- None new. The six phase A bug candidates are SC-671..SC-674 (B1, B4+B5, B2+B6, B3) per the ledger; no extra markers.
- Note for the SC-673 fixer: the jsdom `[K01]` `test.failing` and CTR-V01 / V02 flip together when the clamp-on-untouched-box and `-0` are fixed; remove the markers then.
