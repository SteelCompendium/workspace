# SC-481 r7: scoped re-review of the rebase onto 34f46cf and the r5 test pins (plugin 458abe3, superproject 6b2f6a28)

## Executive summary
1. **Verdict: LAND-READY.** Counts: HIGH 0, MEDIUM 0, LOW 0, INFO 3.
2. Range-diff: commits 1-11 are all `=` (identical) to 4deb8cf..2c5887f. Only the new test commit 458abe3 differs, and it touches only `test/dom/framework/twin-reuse.test.ts`.
3. Both r5 LOWs are now pinned in jest:
   - mutant `ord` turns 2 cases red (the new two-callouts × X/Y case, adoption on and off);
   - mutant `vac` turns 3 red (the r4 callout and quote "UPPER one clicked" cases, plus the new adoption-on case);
   - md, guard and window stay red (1, 6 and 8 cases).
   - Unmutated: 1088 passed.
4. The LOW-2 fixture change models real Obsidian (the block's `div.block-language-ds-counter` inside the `.callout` / `blockquote` element) and drops no assertion (INFO-1).
5. SC-525 interaction is sound, by code and by real-Obsidian probe. Delayed reference reads (4000 ms per read), form Save on the upper `ds-feature` twin (ref-a -> ref-b), `reused-by-twin` release while the writer's ref-b lookup is still in flight. Result: cards [Beta, Alpha] = disk, no "Reference nesting too deep" text, 0 Notices, 0 page errors. A reopen shows the same (INFO-2).
6. Gates on 458abe3: tsc/lint rc 0 · jest 6201/1, 249 of 250 · lifecycle 21 + 21 = 42/42. The r6 logs read e2e 124/124 87/87, shots rc 0 with 0 FAIL and 157/942 (592 PNGs on disk), freeze 280/280, parity 0/0/24.
7. Superproject 6b2f6a28: two CHANGELOG-only commits on origin/main 8174d816. 9 lines added, 0 removed; the SC-525 bullet and every other bullet are kept; the pointer is not bumped (still 34f46cf in both trees).

## 1. Range-diff (`sc481-r7-range-diff.log`)
`git range-diff 4deb8cf..2c5887f 34f46cf..458abe3`: rows 1-11 are `=`: b625438/e5a6bad through 2c5887f/3b44409. Row 12 `-: > 458abe3` is the only change. origin/develop is 34f46cf; HEAD is 458abe3 on top of it.

## 2. New tests and mutants (framework jest, scratch copy of 458abe3; 1090 tests)
| Mutant | jest | Red cases |
|---|---|---|
| none | 1088 passed | — |
| ord (`quoteOrdinal` -> -1 in `fenceOnElement`) | **2 red** | r6 two identical callouts × X/Y (adoption true, false) |
| vac (`remountVacated` returns early inside `.callout, blockquote`) | **3 red** | r4 callout UPPER clicked, r4 quote UPPER clicked, r6 adoption-on case |
| md (`lastWriteLine` skip deleted) | 1 red | r4 two-docId case |
| guard (window section taken whole) | 6 red | |
| window (window sections never judged) | 8 red | |

Logs: `sc481-r7-mut-{none,ord,vac,md,guard,window}-jest.log`.

## 3. Findings

### INFO-1: the LOW-2 fixture change is faithful and keeps every assertion
- `setup(…, windowed)` now wraps each block's element in a `div.callout` or a `blockquote` and gives it the `block-language-ds-counter` class. This is how Obsidian's code-block post-processor draws a fence inside a callout or quote in Reading view: the processor's `el` is that div inside the section's `.callout`/`blockquote`.
- The three r4 callout/quote cases keep every assertion they had:
  - same root at the top;
  - one child at the bottom;
  - no "failed to render" text;
  - `Twin=6`/`Twin=5`;
  - `claims === 1`;
  - the later click writes [6,6];
  - form Save names [Edited, Twin].
- The old bare fixture reached the window branch only through the "window holds only one block" fallback (ordinal -1). That is why `vac` could not show there.
- **Side effect:** the -1 fallback is now exercised only by the r2 "block in a callout is left alone" case. That is acceptable, because real Obsidian always provides the ancestor. No action.

### INFO-2: SC-525 x SC-481 — released or vacated views with a lookup in flight
- **The reference-loop guard key.** It is `blockKey()|ref`, where `blockKey()` = `path::language::lineStart` (`ReadingModeBlockHost.ts:814-816`). SC-525 refuses a reference only when the key is held by a DIFFERENT view that `!isUnloaded()` (`RefUnwrapView.ts`). It deletes the entry in `finally` only if it is still its own token.
- **`reconcile` path.** The writer is released (`reused-by-twin` -> unloaded) before the twin's fresh view, or the new upper view, reaches its guard check. Two consequences:
  - If the released writer's lookup is still in flight under the same key, it is "superseded" and does not block its replacement. This is exactly the case SC-525 added.
  - The released writer's own lookup then completes into its detached root. Nothing is shown, and no error was recorded.
- **`remountVacated` path.** The adopted writer stays live but sits at the write line. The fresh view sits at the twin's line, so the keys differ (different `lineStart`) and there is no refusal.
- **Remaining theoretical collision.** The discarded twin's old view is released only after Obsidian's render promises settle. If it had its own lookup in flight at the instant of the write, the fresh twin view at the same line and reference would be refused. I could not reach this from the UI:
  - the Edit pencil and the card controls appear only after the lookup resolves;
  - a view re-resolves only on its own `update()`.
- **Probe on HEAD** (`sc481-r7-probe-sc525-ref-race.log`; screenshot `sc481-r7-sc525-ref-twins-after-form-save.png`):
  - Two identical `ds-feature @Lifecycle/ref-a.md` blocks; every read of `ref-*.md` delayed 4000 ms; form Save on the upper twin, ref-a -> ref-b.
  - Timeline (ms):
    - note opened at 840;
    - pencil available at 8993, only after both lookups resolved;
    - Save at 9087;
    - writer's ref-b read in flight from 9076;
    - `reused-by-twin` release at 9113;
    - new views read ref-b and ref-a from 9122;
    - the discarded twin released (`render-child-unload`) at 17172, after the render promises.
  - After: [Beta, Alpha]; disk [ref-b, ref-a]; no nesting text; 0 Notices; 0 page errors; a reopen shows [Beta, Alpha].
  - A "settled" variant (Save after all loads finished) gives the same result. The implementer's 1200 ms probe agrees (`sc481-r6-impl-b2/ref-head2/p481-ref.json`).

### INFO-3: superproject CHANGELOG
- 6b2f6a28 = 57f46cf7 + 6b2f6a28 on origin/main 8174d816.
- `git diff 8174d816 6b2f6a28`: CHANGELOG.md, +9/-0. The SC-481 bullet sits after the SC-525 bullet; the wording matches r5 and is still accurate.
- The `draw-steel-elements` gitlink is 34f46cf in both trees, so there is no bump.

## 4. Gates
| Gate | Result | Log |
|---|---|---|
| tsc, tsc -p e2e, lint | rc 0 | `sc481-r7-tsc-lint.log` |
| jest | 6201 passed / 1 skipped, 249 of 250 suites | `sc481-r7-jest.log` |
| lifecycle | 21/21 + 21/21 (G-S53, G-S50, G-S11 green) | `sc481-r7-lifecycle-1.log`, `-2.log` |
| e2e / shots / freeze / parity | spot-checked r6 logs: 124/124 0 known-bug 87/87; shots rc 0, 0 FAIL, button 157/942, modal 228, input 15, checkbox 7, 592 PNGs on disk; freeze 280/280; parity 0 gaps / 0 undeclared / 24 declared | `sc481-r6-gate-*.log` |

e2e was not re-run: the only source delta since my r5 e2e run on 2c5887f is SC-525's code, and both the implementer's r6 e2e run and the 34f46cf baseline are 124/124.

## 5. Working tree
`git status --porcelain`: plugin unchanged (ignored set identical); superproject ` M draw-steel-elements` before and after. Mutants were built only in the scratch copy (`head-src/`).

## Artifacts
- Effort dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/`:
  - this report;
  - `sc481-r7-range-diff.log`;
  - `sc481-r7-tsc-lint.log`, `sc481-r7-jest.log`;
  - `sc481-r7-lifecycle-1.log`, `sc481-r7-lifecycle-2.log`;
  - `sc481-r7-mut-{none,ord,vac,md,guard,window}-jest.log`;
  - `sc481-r7-probe-sc525-ref-race.log`, `sc481-r7-sc525-ref-twins-after-form-save.png`.
- Scratch (`probe-ref.mjs`, `mkprobe.py`, `ref2.sh`, mutate scripts, `ref-head/` raw JSON and shots): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc481-r7-review-ab18c95bec20e977d/`
