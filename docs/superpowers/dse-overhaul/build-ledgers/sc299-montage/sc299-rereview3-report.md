# SC-299 re-review 3 (scoped) — delta since re-review 2

## Executive summary

- **Verdict: LAND-READY.** All four round-4 items VERIFIED-FIXED, each with a real
  can-fail I ran myself against the patched gate extracted verbatim. No new findings.
- **MED-1 VERIFIED-FIXED** — `VIEWPORT_HEIGHT = 2400` confirmed in the extracted source; an
  off-screen probe now prints its own `PROBE POINT OFF-SCREEN — not a wrong-write: Yenna's
  round 2 probe at y=2522.16 … Talin's … y=3142.47` and **still exits 1**. **LOW-1
  VERIFIED-FIXED** (comment states the measured two-row truth incl. the ≥10.4em figure and
  the SC-326 reason). **INFO-1 VERIFIED-FIXED** with a targeted can-fail: `CONTAINMENT
  (buttons)` fires alone, with no container line — exactly the blind spot it was added for.
  **INFO-2 VERIFIED** (doc line present).
- **Colmin-only injection: CONFIRMED, not refuted.** Re-ran my own re-review-2 injection
  against the patched gate: exit 0, 0 violations / 0 wrong-writes / 0 off-screen at all 6
  configurations. The earlier exit 1 was entirely the off-screen probe, as the implementer
  measured. (Owner's ruling accepted; not re-litigated.)
- **Delta is exactly two files** and the CSS half is provably comment-only: comment-stripped
  `styles-source.css` at `b2e40d1` and `d124cc3` are **byte-identical**.
- Gate lines, verbatim (dse `d124cc3` / ws `bf4f2c3`, exit 0 each):
  - tsc: clean, no output · lint: clean, no output
  - jest: `Test Suites: 1 skipped, 202 passed, 202 of 203 total` / `Tests: 1 skipped, 3902 passed, 3903 total` / `Snapshots: 3 passed, 3 total` — **see §3: the first run went red on an unrelated, load-sensitive pre-existing flake**
  - shots (502 s): `montage quick-trio containment OK (6 configurations: 560/700/900px panes + 4/5/8-round track lists, mid fixture, pointer: coarse — every .dse-mt__cell-quick box AND its .dse-mt__quick buttons' union stay inside their own .dse-mt__cell; the width series also confirms elementFromPoint 6px inside a recorded cell's right edge, on-screen in this gate's 2400px viewport, always returns that cell)` · `host-copy pin OK (…Obsidian 1.14.2…)` · `button host-leak OK (114 button kinds × 3 states … = 684 comparisons…)`
  - freeze: `freeze OK (260/260 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`
  - parity (last): `**0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**`
- Both trees clean; 2 probe files deleted; `styles-source.css` restored and the harness
  rebuilt after every injection.

---

## 1. Scope check

`git diff b2e40d1 d124cc3 --name-only` → exactly `styles-source.css` and
`visual-harness/shoot.mjs`. Nothing under `src/`, no test file, no fixture.

**The CSS change is comment-only, proven rather than eyeballed:** stripping every `/* … */`
block from `git show b2e40d1:styles-source.css` and `git show d124cc3:styles-source.css`
yields **identical** text. No declaration, selector or media query moved. (Consistent with
freeze `260/260` and with the shots sweep being unchanged.)

## 2. Item-by-item verification

I re-extracted `assertMontageCoarseContainment` **verbatim** from the patched `shoot.mjs`
(199 lines, brace-matched, unedited) into a throwaway runner and ran it against real rebuilt
harness bundles (`npm run harness:build`) after each `styles-source.css` injection. The
extracted source reports `VIEWPORT_HEIGHT = 2400`, so the runner exercises the shipped value,
not one I supplied.

| # | Injection | Exit | What the gate printed |
|---|---|---|---|
| base | shipped, unmodified | **0** | the OK line |
| a | `--dse-mt-colmin: 9.2em` removed only | **0** | OK line — 0 violations, 0 wrong-writes, **0 off-screen**, 6/6 configurations |
| b | all three fix declarations removed (the original HIGH-1) | **1** | 5× `CONTAINMENT (container)` **and** 5× `CONTAINMENT (buttons)` — cell 87.67 px, trio 141.59 px, overflow 26.95/26.97 px — plus 5× `WRONG-WRITE … hit BUTTON[aria-label="Log a success for <hero> in round 3"] (round 3)`, and **zero `hit null` lines** |
| c | `.dse-mt__cell { min-height: 600px }` under coarse → board taller than 2400 px | **1** | 2× `PROBE POINT OFF-SCREEN — not a wrong-write: Yenna's round 2 probe at y=2522.16 falls outside this gate's own 2400px viewport … Widen the gate's viewport rather than reading this as a hit-test failure.` (and Talin at y=3142.47) — **no** wrong-write, **no** containment line |
| d | one quick button forced to 200 px (appended rule, wins the cascade) | **1** | 5× `CONTAINMENT (buttons): … cell 147.19px, trio 200.00px, overflow left 26.41px / right 26.41px` — **with no `CONTAINMENT (container)` line at all** — plus 5 real `WRONG-WRITE` lines |

### MED-1 — VERIFIED-FIXED

Rows (b), (c) and (d) together close it: a null hit can no longer be folded into a
wrong-write (row b has zero `hit null`), an off-screen probe is named as its own finding with
an actionable remedy **and still fails the gate** (row c, exit 1), and the viewport is the
prescribed 2400 (read out of the extracted source). `shoot.mjs:673-683` (the `VIEWPORT_HEIGHT`
const + its rationale comment) and `:748-757` (`if (!hit) { offscreen.push(…); continue; }`
before `hitCell` is computed) implement it exactly as prescribed; `report()` at `:805-813`
prints the new line and still reaches `process.exit(1)`.

Row (c) is a genuine can-fail of the *new* branch specifically — it is the only injection that
reaches the `offscreen` path at all, and it proves the message is the accurate one (it names
the viewport, not the coarse CSS block).

### Colmin-only injection — CONFIRMED

Row (a): exit 0, nothing reported, at all six configurations. My re-review-2 run of this same
injection exited 1 solely on `hit null` at Talin's probe, which my own MED-1 measurement
already attributed to the 47 px viewport clearance (y=953 shipped vs y=1172 at 5.2em in a
1000 px viewport). With the viewport at 2400 there is nothing left for either invariant to
catch here — the implementer's measurement is correct. I confirm it and do not re-litigate the
owner's ruling that this is correct behaviour; the declaration itself remains pinned by the
jest CSS-contract test (`test/dom/elements/montage.test.ts:1572-1596`).

### INFO-1 (buttons union) — VERIFIED-FIXED, with a targeted can-fail

Row (d) is the one that matters, and it is the proof re-review-2 asked for: with `max-width:
100%` still present, the container's rect stayed inside the cell (no `CONTAINMENT (container)`
line) while the buttons' union escaped by 26.41 px each side and **only the new check caught
it**. That is precisely the blind spot INFO-1 described. `shoot.mjs:735-749` measures
`Math.min(left)…Math.max(right)` over `.dse-mt__quick` and tags violations `box: 'buttons'`;
`report()` prints `CONTAINMENT (container)` / `CONTAINMENT (buttons)`.

(My first attempt at this injection inserted `width: 200px` at the *top* of the coarse
`.dse-mt__quick` block, where the block's own later `width:` declaration overrode it — the gate
correctly reported OK because nothing had actually changed. Re-run as an appended, cascade-
winning rule, it fires. Noting it so the negative result in my own run log is not misread.)

### LOW-1 (comment) — VERIFIED-FIXED

`styles-source.css:3861-3867` now reads: "*Measured (re-review-2 LOW-1): this keeps the trio at
TWO rows instead of three (the pre-branch 5.2em minimum wraps 3×1 at every coarse pane width,
cell 183px tall; 9.2em wraps 2+1, cell 134px) and keeps the column from collapsing back toward
that three-row shape — it does NOT reach one row, which needs `--dse-mt-colmin >= 10.4em` and
is deliberately not chosen here because it would widen SC-326's board-clipping onset further
than 9.2em already does.*" Every figure matches my re-review-2 measurements (183.0 / 134.2 /
10.4em) and it names the SC-326 trade-off. Option (a) as ruled; no declaration changed.

### INFO-2 (sheet=1 doc line) — VERIFIED

`shoot.mjs:687-692`, immediately above the query construction, records that the gate omits
`sheet=1` deliberately and that the whole coarse matrix was re-measured with Obsidian's real
pinned app.css to identical numbers — which is what I measured in re-review 2.

## 3. The jest red on my first run — pre-existing flake, not this delta

My **first** full jest run came back `Tests: 1 failed, 1 skipped, 3901 passed, 3903 total`
(exit 1), failing `test/dom/framework/sidebarEncounterHandoff.test.ts` → *SC-153: "Open in
sidebar" is idempotent › the encounter block persists the id it minted (durable across a
reload)* at `:416`, `expect(writes.some((w) => w.includes(\`_dse_anchor: ${from}\`))).toBe(true)`.

Diagnosis, in the order the dse-verify skill prescribes:

- `/proc/loadavg` at the time: **8.99**. The suite itself took 10.959 s.
- The test waits out the 400 ms `persist()` debounce with a **real-time**
  `await new Promise((resolve) => setTimeout(resolve, 400))` (`:412`), not fake timers — so
  under load the wall clock can elapse before the debounced write lands and `writes` is still
  empty. That is the load-sensitive class the skill documents, in a suite its list does not
  yet name.
- Re-ran the suite in isolation **3×: 10 passed / 10 total, exit 0, every time.**
- Re-ran the **full** battery at load 4.56: `Test Suites: 1 skipped, 202 passed, 202 of 203
  total` / `Tests: 1 skipped, 3902 passed, 3903 total`, exit 0 — exactly the round-4 report's
  numbers. That green run is the one logged as `sc299-rv4-jest.log`.
- Causation ruled out structurally, not argued: the delta is `styles-source.css` (comment-only,
  proven byte-identical after comment stripping) and `visual-harness/shoot.mjs`. The failing
  test reads neither — `grep` shows no `styles-source` reference in it, and `shoot.mjs` is read
  as *text* by only two unit tests (`printTwinDeltaAllowedSet`, `inputHostCoverage`), both of
  which passed in both runs.

**Not a finding against SC-299**, and I am not asking for a fix here. Worth the owner's
judgement as a separate Backlog candidate (workers don't file): either add
`sidebarEncounterHandoff` to the dse-verify skill's load-sensitive list, or convert `:412` to
fake timers + `jest.advanceTimersByTimeAsync(PERSIST_DEBOUNCE_MS)`, which is exactly what the
montage suite already does for the same debounce.

## 4. Hygiene

- 2 dse commits (`781c579`, `d124cc3`) + ws `bf4f2c3`; **no attribution trailers** (0 grep hits
  over `b2e40d1..HEAD` and `8685b65..HEAD`).
- No drive-bys: the delta touches only the two files the round-4 report names.
- jest surface unchanged (3902 — no test added, removed or weakened this round), consistent
  with a round that touches only a harness gate and a comment.
- freeze `260/260` and parity `0/0/16` unchanged, as expected for a comment + harness-only
  round.
- Both worktrees `git status --porcelain` empty after the run; `styles-source.css` restored via
  `git checkout` and the harness rebuilt after each of the five injections.

## Artifacts

- Gate logs: `sc299-rv4-{tsc,lint,jest,shots,freeze,parity}.log` in this directory.
- No evidence images: every claim is a measurement or a gate line, reproduced in the tables.

## Reproduction of the row-(d) buttons-union can-fail

Append to `styles-source.css`, `npm run harness:build`, then run the gate:

```css
@media (pointer: coarse) {
	[data-dse-element="montage"] .dse-mt .dse-mt__quick { width: 200px; min-width: 200px; }
}
```

→ `CONTAINMENT (buttons): Kira round 3 — cell 147.19px, trio 200.00px, overflow left 26.41px /
right 26.41px` (×5 heroes), no container line, exit 1. Revert with `git checkout
styles-source.css && npm run harness:build`.
