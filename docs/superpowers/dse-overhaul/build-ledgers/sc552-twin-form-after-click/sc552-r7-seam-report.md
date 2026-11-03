# SC-552 r7 scoped seam check: the rebase onto 09ece2eb (SC-545)
Reviewer R1, agent ad6d3563992bb99bd. HEAD 31d8f779. No commits made.

## Executive summary
- **Verdict: LAND-READY.** No HIGH and no MEDIUM; 1 LOW (lifecycle assertion strength, does not block); 2 INFO.
- **Range-diff** (`ea78ebf8..3871e673` against `09ece2eb..31d8f779`): every `src/` commit is `=`. The `!` commits (07704fe8, 37af16cf, 12b95c95) and the re-paired header commit 2ca3792f touch only lifecycle-header, SCENARIOS-list and architecture context.
- **New commits:** 290eab61 changes comments only. 31d8f779 adds the G-S64 (l) note check and phase (u).
- **SC-545 seam, real Obsidian:**
  - Plugin disable closes a kept-open form and writes nothing, in LP and RV, callouts and plain fences (4/4).
  - After re-enable all cards are drawn and a click counts in the clicked block.
  - No stash mark is left after re-enable (0), no holder is left on the new registry (0), and registry children equal live entries.
  - With no form open, off/on gives the same stash, children, entries and disk as 09ece2eb (3/3 layouts).
- **Close-on-disable mutants:** R7-M16 (holder close not registered) and R7-M17 (holder not parented) both fail G-S64 (l) and (u), and fail jest (2 and 3 red).
- **Gates on 31d8f779:**
  - tsc and lint clean (load ~17).
  - jest `Tests: 1 skipped, 6460 passed, 6461 total` / `Test Suites: 1 skipped, 256 passed, 256 of 257 total` (load 16.9).
  - Part 3, `G-S45 … G-S52 G-S63 G-S64`: `9/9 ok, 0 failed`, 347 s, load 0.46.
  - `G-S57,G-S61`: `2/2 ok, 0 failed`, 187 s, load 1.30.
- `origin/develop` = 09ece2eb (has not moved).
- Tree status:
  - Plugin worktree: clean before and after.
  - Superproject worktree: ` M draw-steel-elements` before and after. This is the known stale pointer; the dispatcher bumps it.

## Findings

### LOW-1 — G-S64 (l)'s new "note unchanged across the disable" check reads the note before a write could land
- **Where:** `visual-harness/obsidian-lifecycle.mjs:4905-4908`. `beforeOff` is read, the plugin is disabled, and the note is compared as soon as the modal is gone.
- **Why it matters:** a close-on-disable path that starts a write (an async `vault.process`) passes (l).
- **Mutant R7-M18** (the holder runs `void this.save(); this.close();`):
  - (l) reports "closed with the plugin, the note unchanged" at both high load and load 2.56.
  - Only (u) catches it, through its later name check `["Twin","Edited"]`.
  - My probe with a 1.5 s re-read shows the write lands: note unchanged at the disable, changed after 1500 ms, names `["Twin","Edited"]` in RV and LP.
- **Fix:** in (l), compare after a settle, then compare again after re-enable. For example: wait for no `modify` within about 1 s, or re-read after `enablePlugin` and before the next phase.

### INFO
- **INFO-1:** the proposal says "kept form's close not hung on the registry FAILs (l)". With (u) added, the closest mutant (R7-M17, holder not parented) fails (l) and (u). The phrase "gave the same list plus (u) on the later ones" is odd: (u) did not exist when ea78ebf8, 0698550f and 367a2f1d were measured.
- **INFO-2:** in the off/on probe, the RV callout twins' stash-mark count at disable was 2 in one HEAD run and 0 in another (base was 2). The code comment says detached RV marks are harmless. After re-enable it was always 0, and every count matched base on the same layout in the same run window.

## What was executed

### Range-diff
- `=` pairs: 9a0f8f33, b290ef5b, 15e3ad21, ceb83fa7, 39a0e7e3, 295b6769, ef595f19, ebc5e7b0.
- `!` pairs (07704fe8, 37af16cf, 12b95c95): context only, the lifecycle header comment and the SC-545 paragraph next to ours in architecture.md.
- 26d5f5eb / 2ca3792f: the header now says "51 scenarios … after G-S63 … five parts".
- New 290eab61: comment wording only, in `lineMap.ts` and the `pinnedTarget` doc.
- New 31d8f779: `obsidian-lifecycle.mjs` only.

### Semantic seam (code)
- `ViewRegistry.onunload` (viewRegistry.ts:248) runs after its children, the views and our holder, have unloaded.
- `stashForReplug` walks `this.entries`. `release()` deletes an entry from that set, so the released view of a kept-open form is never stashed.
- The holder is not an entry.
- `FormModal.close()` does not write.

### Real-Obsidian probes (sc552-r7-probes.log; load 15-19 during the head and base probe runs)

| Case | HEAD | base 09ece2eb |
|---|---|---|
| P-c2-lp-p0-g150-f1 (kept-open form, LP callouts) | form open at disable; note unchanged at 0 and 1500 ms; stash 2 → 0; children 3 (2 entries + holder) → 2/2 entries; holders 0; click → [6,6] | form had closed by itself (base); the rest identical |
| P-p2-lp-p0-g150-f1 (kept-open form, LP plain) | same; stash 0; [6,6] | form closed by itself |
| P-c2-rv-p0-g150-f1 (kept-open form, RV callouts) | same; [6,6] | form closed by itself |
| P-p2-rv-p0-g150-f1 (kept-open form, RV plain) | same; [6,6] | form closed by itself |
| P-c3-lp-f1 (pinned form, not kept open) | closes, unchanged, stash 3 → 0, [5,6,5] | identical |
| P-c3-lp, P-p3-rv, P-c2-lp (no form) | stash 3/0/2 → 0; children = entries; [5,6,5]/[5,6,5]/[5,6] | identical |

### Mutants (scratch copy of 31d8f779)

| Mutant | jest | G-S64 | Load |
|---|---|---|---|
| R7-M16 holder close not registered | 2 red | FAIL (l), (u): form never closes | 14.9 |
| R7-M17 holder not parented | 3 red | FAIL (l), (u) | 15.8 |
| R7-M18 disable saves then closes | 1 red | FAIL (u) only; (l) passes (LOW-1) | 15.4, confirmed at 2.56 |

### Gates and load
- tsc, lint: load 17.4.
- jest: load 16.9.
- Part 3 was first run split under load (G-S45,G-S44,G-S42,G-S50: 4/4, 107 s, load 15.95; G-S53,G-S54,G-S52,G-S63,G-S64: 5/5, 250 s, load 15.78). It was then re-run whole: 9/9, 347 s, load 0.46.
- G-S57,G-S61: 2/2, 187 s, load 1.30.
- The proposal's other numbers match r6: jest 6460/1/256 of 257, part 3 at 341 s (I measured 347 s), 20 phases (a)-(i) and (k)-(u), and the holder claim (a)-(i), (k), (t).

## Evidence (/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc552-twin-form-after-click/)
- `sc552-r7-range-diff.txt`
- Gates: `sc552-r7-gate-tsc.log`, `sc552-r7-gate-lint.log`, `sc552-r7-gate-jest.log`, `sc552-r7-gate-lc-p3.log`, `sc552-r7-gate-lc-p3a.log`, `sc552-r7-gate-lc-p3b.log`, `sc552-r7-gate-lc-5761.log`
- Probes: `sc552-r7-probes.log`, `sc552-r7-probe-head-plug.json`, `sc552-r7-probe-base-plug.json`, `sc552-r7-probe-m18-plug.json`, `sc552-r7-probe-scenario.mjs`
- Mutants: `sc552-r7-mutants.py`, `sc552-r7-mutants-jest.txt`, `sc552-r7-lc-mutant-R7-M16-holder-close-not-registered.log`, `sc552-r7-lc-mutant-R7-M17-holder-not-parented.log`, `sc552-r7-lc-mutant-R7-M18.log`, `sc552-r7-lc-mutant-R7-M18-lowload.log`
