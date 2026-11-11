# SC-570 r1: diagnosis of the RECOV-R07 double write

**Verdict: TEST.** The product is correct. Every write carries the right content, and the last one always holds the Catch breath result.
**Mechanism:** the popover's −/+ presses persist through `ElementView.persist()`'s 400 ms trailing debounce (view.ts:281). That debounce coalesces them with Catch breath only when Catch breath is pressed within 400 ms of the last +. On a slow host the gap goes past 400 ms. The stepper write (recoveries 4, Stamina 12) then flushes after `waitForWrite`'s `mark()` and is counted as one of Catch breath's writes. Catch breath's own write (3, 22) follows ~400 ms later.
**User-visible consequence:** none. Each flush serializes the live model (view.ts:361). Obsidian's `adapter.process` runs one write at a time, so no stale value can land last. One press spends exactly one Recovery and heals exactly once. jest, the forced e2e runs and both prior bundles all end at `current_stamina: 22, recoveries: 3`.
**Fix (test-only, `e2e/` only):** in RECOV-R07, after `expect(await sliderNow()).toBe('4')` (stamina-recoveries.e2e.ts:353), add `await dse.settle();` and `await dse.expectNoteBlock(REC, BAR).toMatchObject({ current_stamina: 12, recoveries: 4 });` before the Catch breath `waitForWrite` (:354).
**Repro:** deterministic on unchanged `79da77f8` code. With a 250 ms driver reply lag: 7/7 red (RECOV-R07 + 6 verbatim copies). With the renderer CPU throttled 12x through CDP: 7/7 red. 10x: 7/7 red. 8x: 2/7 red. 6x and 4x: 0/7. Unforced: 0/7. With the fix: 4/4 green per condition (lag250, cpu12, cpu8, unforced). The six fix copies were also green (6/6 lag250, 3/3 cpu12). The whole spec file passed 25/25 with the fix.
**Evidence ordering matches SC-517 exactly** (4 notices, then 2 mods: the stepper's modify lands after the Catch breath click), reproduced at cpu 8x.

---

## 1. Mechanism (code path)

- `RecoveriesStrip.ts:212-213`: popover − / + call `commit(current ∓ 1)`, which calls `opts.onSetRemaining` → `stamina-bar/view.ts:224 setRecoveries`. That mutates `model.recoveries` in place, then calls `void this.persist()` (:230) and posts an undo toast.
- `RecoveriesStrip.ts:218-226`: popover Catch breath runs `closePopover()` and then `opts.onCatchBreath()` → `view.ts:244 catchBreath`. That sets recoveries −1 and Stamina +recoveryValue (floor(30/3) = 10) in place, then calls `void this.persist()` (:255). That is one persist per press.
- `framework/view.ts:264-283 persist()` is a **trailing** debounce. Each call clears the timer and re-arms it for `PERSIST_DEBOUNCE_MS = 400` (:23, :280-281). `flushPersist()` (:350) serializes **`this.model` at flush time** (:361), so every write is the live model, never a snapshot taken at click time. `hasPendingWrite()` (:291) is `scheduled || inFlight`. This answers the brief's question: Catch breath **supersedes** a still-pending stepper write. It re-arms the same timer, and one write carries both edits. It never cancels or duplicates a write. If the stepper timer already fired, the stepper write has gone out with its own (correct, intermediate) content, and Catch breath's write follows.
- `ReadingModeBlockHost.ts:1046 replaceSource` → `app.vault.process`. Obsidian 1.14.4 `FileSystemAdapter.prototype.process` (from the cached asar) runs inside `this.queue(...)`: read, then fn, then write, then `finally reconcileInternalFile`. That last step fires `"modified"`, and the vault turns it into the `'modify'` event. Two consequences:
  - Writes from one view are **serialized**, so a stale earlier write cannot land after a later one.
  - The `modify` event fires **inside** `process`, before `replaceSource` resolves. So `waitWriteIdle()` (in-flight → 0) guarantees the modify has already been recorded. This is what makes `dse.settle()` a sufficient fence.
- Driver: `e2e/driver/dse.ts:534 waitForWrite`. It calls `mark()` (the counter of the page-side `__dse.mods` log), runs the action, waits for ≥1 `modify`, waits for write-idle, then counts **every** modify of that path since the mark. It cannot tell whose write a modify belongs to.

**Race:** after the last +, RECOV-R07 does `sliderNow()` (1 eval), then `mark()` (1 eval), then `dse.click` (waitForDisplayed, isEnabled, then the wdio click's scroll / hit-test / press / release). Unforced, the Catch breath click lands **105-140 ms** after the last + (measured, 7 runs), well inside 400 ms, so the write coalesces into 1. When that gap passes ~400 ms and the stepper flush (or just its modify) lands after the mark, the count is 2.

## 2. Product or test: runtime proof (content of each write)

jest probe (real `ElementPipeline` + `staminaBarElement` + `ElementView.persist`, fake timers, e2e fixture 12/30, 3 of 6, popover pref on; host `replaceSource` records each write). Log: `k7q2-jestprobe.log`, 5/5 passed:

| Probe | Sequence | Writes (content) |
|---|---|---|
| P1 | dec, inc, inc, Catch breath at 399 ms | 1: `rec=3 cur=22` |
| P2 | dec, inc, inc, +400 ms, Catch breath | 2: `rec=4 cur=12`, `rec=3 cur=22` |
| P3 | as P2, stepper write held in flight across the Catch breath press and its write; released out of order | 2: `rec=4 cur=12`, `rec=3 cur=22` (no stale re-write) |
| P4 | 400 ms between every press | 4: `2/12`, `3/12`, `4/12`, `3/22` |
| P5 | Catch breath alone | 1: `rec=2 cur=22` |

Real Obsidian (page-side wrapper around `app.vault.process` logging each write's block content, plus click / modify / mark timestamps; times are ms after the last + click):

- Unforced RECOV-R07: `mark@13 cbClick@115 | flush@519 write(3,22) modify@523`. One write.
- lag250 RECOV-R07: `mark@270 cbClick@635 | flush@413 write(4,12) modify@424 | flush@1036 write(3,22) modify@1039`. Count 2. Final note 22/3.
- cpu8 RECOV-R07: `mark@53 cbClick@439 | flush@424 write(4,12) modify@532 | flush@849 write(3,22) modify@861`. The stepper flush fires before the click, and its modify lands **after** the click. This is SC-517's ordering.
- In the PRB-A copies the note-content assertion comes **before** the count assertion. It passed in every red run (19 reds across lag250 / cpu8 / cpu10 / cpu12). Only `w.count` failed.

A user who presses + and then Catch breath within 400 ms gets one write (3, 22). After 400 ms they get two writes, (4, 12) and then (3, 22). In both cases the note ends correct, with exactly one Recovery spent and one heal. The only side effect of the two-write path is one extra intermediate disk write and re-render. That is the intended debounce behaviour, not a defect.

## 3. Prior evidence bundles

- **SC-517** (`…/sc500-review-r1-R1/e2e-full-RECOV-R07-bundle/`): `events.json` has notices 49-52 (3→2, 2→3, 3→4, Caught breath), then mods 53 and 54. `note-after` is `current_stamina: 22, recoveries: 3`, which is correct. This **matches** the mechanism. The stepper flush started before the Catch breath click (otherwise the press would have re-armed the timer and coalesced), but its modify landed after the click handler's notice. Reproduced byte-for-byte in shape at cpu 8x: notices n=1-4, then mods n=5 and n=6, final 22/3 (`k7q2-bundle-cpu8-RECOV-R07/events.json`). The bundle has no per-write content; the probe supplies it: (4, 12) then (3, 22).
- **SC-561** (`…/sc561-r2-impl-9Jgy/gate-e2e-run1-FAIL-RECOV-R07.log`): `Expected: 1 Received: 2` at :355, full run 127/128, `GATE-END … load 14.26 13.58 16.66`. Green re-run `gate-e2e2.log` 128/128 at load ~10.6-13. The bundle path it names (`worktrees/sc561-gs59-timeout/.../20261110-163054-4b47/RECOV-R07`) **no longer exists**: the worktree was removed. The failure signature and load-dependence are consistent with the mechanism. There is no content to compare.

## 4. Deterministic reproduction (unchanged product + spec, at `79da77f8`)

The probes were env-gated driver edits only, active for `[RECOV-R07]` and `[PRB-K7Q2-*]` titles. Diff: `k7q2-driver-probe.diff`.

- `SC570_K7Q2_LAG=250`: `ev()` sleeps 250 ms **after** each page eval returns (a loaded host's slow CDP replies).
- `SC570_K7Q2_CPU=N`: CDP `Emulation.setCPUThrottlingRate` on the Obsidian renderer only. It puts no load on the shared host.
- Plus a page-side write log (vault.process wrapper, modify, capture-phase click, mark).

| Condition | RECOV-R07 (unchanged) | PRB-A01..06 (verbatim R07 body) | Click gap after last + |
|---|---|---|---|
| none | ok | 6/6 ok | 105-140 ms |
| cpu 4x | ok | 6/6 ok | 189-233 ms |
| cpu 6x | ok | 6/6 ok | 267-360 ms |
| cpu 8x | **FAIL 1 vs 2** | 1/6 FAIL | 339-456 ms |
| cpu 10x | **FAIL** | 6/6 FAIL | 442-684 ms |
| cpu 12x | **FAIL** | 6/6 FAIL | 739-865 ms |
| lag 250 ms | **FAIL** | 6/6 FAIL | 598-635 ms |

Red tracks one variable, the gap between the last + and the Catch breath press crossing 400 ms. That is the debounce window.

## 5. Prescribed fix (test-only; `e2e/` only, no CHANGELOG, per the owner ruling)

`draw-steel-elements/e2e/specs/stamina-bar/stamina-recoveries.e2e.ts`, RECOV-R07, between :353 and :354 (exact diff: `k7q2-prescribed-fix.diff`):

```ts
		expect(await sliderNow()).toBe('4');
		// The − / + presses write through the view's 400 ms debounce (ElementView.persist). Let that write land, and pin what it
		// wrote, before marking for Catch breath: on a slow host it would otherwise flush after the mark and count as Catch breath's.
		await dse.settle();
		await dse.expectNoteBlock(REC, BAR).toMatchObject({ current_stamina: 12, recoveries: 4 }); // the steppers committed
		const w = await dse.waitForWrite(REC, () => dse.click(bar.control('recov.pop.catch-breath')));
		expect(w.count).toBe(1);
```

**Red on base, green after.** These runs were the real RECOV-R07 with the fix applied temporarily, then reverted.
- lag250: base FAIL, then ok (4/4 for R07, R12, R09, R08).
- cpu12: base FAIL, then ok (4/4).
- cpu8: base FAIL, then ok (4/4).
- unforced: ok (4/4).
- The same body as six copies (PRB-F01..06): 6/6 ok unforced, 6/6 ok lag250, 3/3 ok cpu12.
- Whole spec file with the fix, unforced: `OBSIDIAN-E2E done: 25/25 ok, 0 failed, 0 known-bug, coverage: 30/164 pairs (partial run: gate skipped)`.

**Why this does not mask a product defect.**
- `settle()` waits until no write is scheduled or in flight. The modify fires inside `vault.process`, so after it nothing from the steppers can land after the mark. Catch breath's `waitForWrite` then counts only Catch breath's writes, and `count === 1` is a strict assertion: a real double write by Catch breath would still fail it.
- The fix also **adds** a content pin on the stepper write (12/4), which R07 never had. "Its buttons commit" is now asserted on disk, not just on `aria-valuenow`.
- The final 22/3 assertion stays.
- What the fix gives up is e2e coverage of the *coalesced* path (stepper and Catch breath in one 400 ms window). That path is timing-bound and cannot be made deterministic in e2e on a loaded host.

**Optional (needs an owner ruling, since the ruling says `e2e/` only):** add P1 + P2 from the jest probe to `test/dom/elements/staminaRecoveries.test.ts`. They pin "Catch breath within the stepper window gives 1 write (3, 22)" and "after the window gives (4, 12) then (3, 22)" at the right layer. Source: `k7q2-jest-probe.test.ts.txt`, which reuses that file's `mountRecoveries` / `makeHost` shape.

**Follow-on doc change (owner's call):** the dse-verify SKILL.md SC-480 note ("RECOV-R07 … load-sensitive … not a regression signal") becomes obsolete once the fix lands. Put a proposal in `sc570-skill-proposal.md` to delete that bullet.

**Other specs with the same shape.** I statically scanned all `e2e/specs/**/*.e2e.ts` for a bare click / press / type before a `waitForWrite` / `expectNoWrite` in the same test (`k7q2-scan.py`, output `k7q2-scan.txt`, 107 hits) and triaged them by hand. **RECOV-R07 is the only test whose pre-mark inputs themselves persist through the card's debounce.**
- The other hits stage into a modal until Apply (stamina modal, minion pool, conditions window), open a popover, editor or dropdown, or type into a field that commits only on Enter / blur (INIT-T*, INIT-M*).
- CHR-F04's collapse/expand presses are session-persisted, not note writes.
- RECOV-R12, R09 and R08 do only a marker click before the mark. With the popover on, that opens the popover and writes nothing.

## Artifacts

All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc570-r1-reviewer-k7q2/`:

- `k7q2-timelines.txt`: every probed run's per-write timeline and content
- `k7q2-events-*.jsonl`: raw page logs
- `k7q2-e2e-*.log`: runner output
- `k7q2-jestprobe.log` + `k7q2-jest-probe.test.ts.txt`: jest probe
- `k7q2-driver-probe.diff`, `k7q2-probe-spec.e2e.ts.txt`: e2e probe sources
- `k7q2-prescribed-fix.diff`: the fix
- `k7q2-bundle-{lag250,cpu8,cpu12}-RECOV-R07/` and `k7q2-bundle-lag250-PRB-A01/`: failure bundles copied out of `e2e/.out`
- `k7q2-scan.py` / `k7q2-scan.txt`: shape scan

Worktree: dse `79da77f8`, `git status --porcelain` empty in both dse and the superproject. `node_modules/` was installed by `npm ci` (gitignored) and left in place for the implementer. `main.js` and `styles.css` were removed.
