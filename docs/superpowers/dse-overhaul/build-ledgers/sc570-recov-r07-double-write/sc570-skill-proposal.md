# SC-570 skill proposal (dse-verify SKILL.md) — for the dispatcher to apply at landing

File: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`, section "Lifecycle and e2e notes (SC-480, 2026-11-11)" (line ~180).

## 1. Replace the RECOV-R07 bullet

Old text (delete exactly this bullet):

```
- `RECOV-R07` (stamina-bar Recoveries popover: `w.count` 1 vs 2) is load-sensitive: its +/- clicks and Catch breath can straddle the 400 ms debounce when the host is at loadavg 20+ (SC-517, SC-570). It is not a regression signal; re-run alone and on a clean base before blaming a change.
```

Replacement:

```
- `RECOV-R07` used to fail with `w.count` 2 vs 1 on a slow host (SC-517, SC-570). Cause: the popover's - / + presses persist through `ElementView.persist()`'s 400 ms trailing debounce; when the Catch breath press came more than 400 ms after the last +, the stepper write (recoveries 4, Stamina 12) flushed after `waitForWrite`'s mark and was counted as one of Catch breath's two writes. The product is correct (each flush serializes the live model, `vault.process` serializes writes, the note always ends at 22 / 3). Fixed in the spec: `dse.settle()` plus `expectNoteBlock(... {current_stamina: 12, recoveries: 4})` before the Catch breath `waitForWrite`. Reproduce a debounce-straddle race deterministically by delaying the driver's page-eval replies by 250 ms (an env-gated sleep after `ev()` in `e2e/driver/page.ts`) or throttling the renderer 12x (`Emulation.setCPUThrottlingRate` via `browser.sendCommandAndGetResult` in a `beforeEach` in `e2e/driver/session.ts`); a loaded host is not needed. The SC-570 probe diff is preserved at `docs/superpowers/dse-overhaul/build-ledgers/sc570-recov-r07-double-write/sc570-r1-driver-probe.diff`. A RECOV-R07 red is now a real signal. The one-window path (Catch breath inside 400 ms: one write) and the two-window paths are pinned in jest (`test/dom/elements/staminaRecoveries.test.ts`, "SC-570").
- Authoring rule for a `waitForWrite(...)` that asserts `count`: settle every earlier edit to the same note (`dse.settle()` and assert its content) first. `waitForWrite` counts every modify of the path since its mark and cannot tell whose write it is counting.
```

## 2. CURRENT-numbers line shape for this landing

Header (replace SC-597's CURRENT with PREVIOUS as usual):

```
**CURRENT — dse `develop` @ <sha> (2026-11-11; SC-570 landed on `ce4937ef`; test code only, plugin untouched: e2e RECOV-R07 settles and pins the popover's stepper write before it presses Catch breath (it failed once under load: the stepper write flushed after the mark and counted as Catch breath's); three jest cases pin the popover steppers then Catch breath at 399 ms / after the window / with the stepper write in flight, asserting each write's content; SC-517 closed as a duplicate; no lifecycle id used (G-S90 free)):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **7286 passed / 2 skipped** in a fresh worktree (7283 / 2 at `e5b6f9f2` + 3) · lifecycle **56/56** (21 + 16 + 9 + 4 + 6) · e2e **`OBSIDIAN-E2E done: 264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`** · shots **592**, host-leak 163 / 978, modal host-leak 39 / 234, capture clip 147 · freeze **280/280** · parity **0 GAPs / 0 undeclared / 24 DECLARED** (shots / freeze / parity carried from `e5b6f9f2`: `main.js` sha256 `3c44cb8b…b536238` and `styles.css` sha256 `5e5ff488…dc2b27` are byte-identical to a clean `e5b6f9f2` build).
```

(The jest figure becomes "+3 over develop" at whatever develop head the landing rebases onto; recompute if develop moves again. Fill in `<sha>` at landing.)

## 3. Battery table line 31 (step 4b)

No change: the e2e expectation stays `264/269 ... 164/164 pairs`; the new jest cases add 3 to the jest count only.
