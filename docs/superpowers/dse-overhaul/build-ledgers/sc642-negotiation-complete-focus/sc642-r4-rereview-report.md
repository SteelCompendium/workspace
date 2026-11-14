# SC-642 r4 scoped re-review: the r3 fix delta (`0b6eae24..09c879f2`, rebased on dse develop `10c271fe`)

**Executive summary**
- **Verdict: LAND.** dse head `09c879f2`. Findings: **0 CRIT · 0 HIGH · 0 MED · 0 LOW · 2 INFO**.
- **Rebase is clean.** `git range-diff 12aaf5b5..01af056d 10c271fe..0b6eae24` shows `d9fadf8d = b334c30d` and `01af056d = 0b6eae24` (identical content). SC-628 (`12aaf5b5..10c271fe`) touches no negotiation or focus file.
- **LOW-1 and LOW-2 folded, and the comments are accurate:** `src/framework/kit/controlFocus.ts:26-30` and `:100-102`, `src/elements/negotiation/focusRules.ts:5-7`, `e2e/specs/negotiation/focus.e2e.ts:27-28` and `:61`, `e2e/specs/negotiation/live-preview.e2e.ts:60`, `test/dom/kit/controlFocus.test.ts:236`. A grep finds no "next frame" and no "would focus the button" left anywhere in the SC-642 surface.
- **LOW-4 folded correctly:** `src/elements/negotiation/view.ts:55-58`. The scroll is negotiation-only, uses `block: 'nearest'`, and runs only after `restoreControlFocus` returns true. The kit diff is comments only, and `focusHandoff.ts` is untouched. The jsdom test goes red without the call (1 failed / 641). In real Obsidian: in a 443 px pane in RV and LP, the chip goes from off-screen to visible and focused, with the ring, and stays there through the save. In a tall pane, scrollTop does not change. On `0b6eae24`, and with the call removed, the chip stays off-screen.
- **LOW-5 folded:** `controlFocusRules()` is removed. `NEGO-L02`, `NEGO-L04` and `NEGO-L05` pass, and the carry falls back to the default rules, as M3 showed in r2. **INFO-6 folded:** the import order at `focus.e2e.ts:7` is fixed.
- **Gates (targeted, as asked):** e2e `--only=NEGO-F01..F04,NEGO-L01..L05` = 7 ok + 2 `known-bug SC-639` (my run `12/14 ok, 0 failed, 2 known-bug`, which includes 5 probes). jest (all negotiation suites + kit `controlFocus`): `641 passed, 0 failed`. I did not re-run the full battery: the delta gives no reason to (one guarded line of product code, the rest comments and tests).
- INFO-1: the scroll is pinned only by jsdom; there is no e2e for it. INFO-2: the chip lands flush with the pane's top edge (cosmetic, not measured).
- Working tree: dse `git status --porcelain` empty; worktree superproject ` M draw-steel-elements` (the unbumped pointer), as found.

## 1. Rebase

- `git range-diff 12aaf5b5..01af056d 10c271fe..0b6eae24`:
  `1: d9fadf8d = 1: b334c30d` · `2: 01af056d = 2: 0b6eae24`. No content change.
- `git diff --name-only 12aaf5b5 10c271fe` (11 files, montage only) has no hit for `nego|controlFocus|focusHandoff|livePreviewFocusCarry`.

## 2. Delta `0b6eae24..09c879f2` against the rulings

| Ruling | Where | Verdict |
|---|---|---|
| LOW-1 comments | `controlFocus.ts` header and `RestoreOptions.fromDisabled` doc; `focusRules.ts` header; `focus.e2e.ts` F02 comment; `controlFocus.test.ts` `disarmed()` doc | Accurate: synchronous blur inside the click dispatch, 2-3 ms after the click, about 410 ms before the save; focus is usually already on `<body>`; `fromDisabled` covers jsdom or an engine that defers the blur. `fromDisabled` is kept, as ruled. |
| LOW-2 comments | `focus.e2e.ts:61`, `live-preview.e2e.ts:60` | Accurate: a pointer press moves no focus, because the click shield cancels pointerdown and mousedown. No keyboard-only gate was added. |
| LOW-4 scroll | `view.ts:55-58` | Opt-in for this hand-off only. `if (!restoreControlFocus(...)) return;` comes first, then `activeElement?.scrollIntoView?.({ block: 'nearest' })`. Kit file: comments only. No other caller changed. |
| LOW-4 test | `negotiation-matrix.test.ts:598-619` | Stands in `HTMLElement.prototype.scrollIntoView` and deletes it again in `finally`. Asserts one call, with `{ block: 'nearest' }`, on chip 0, and no call when focus was on the page. **Red check:** with the call replaced by `void 0` (scratch export `exp-noscroll`), that test alone goes red: 640 passed / 1 failed. |
| LOW-5 removal | `view.ts` (method and `ControlFocusRules` import gone) | Justified. The method changed no observable behaviour (M3 survived everything in r2). With it gone, L02, L04 and L05 still pass. `livePreviewFocusCarry.ts:62` treats the method as optional. |
| INFO-6 | `focus.e2e.ts:7` | Fixed (`interestOf, onNthOfControl, openNego`). |

The ArgumentView comment (`ArgumentView.ts:435`) and the matrix header (`negotiation-matrix.test.ts:546-548`) make no timing claim. They are still accurate.

## 3. LOW-4 probes in real Obsidian

Scratch spec `probe-src/zz-r4probe.e2e.ts`, fixture `r2-long.md` (basic + 120 filler paragraphs). The short pane comes from `setWindowSize(1440, 520)` (innerHeight 520, scroller 443 px), and the window is restored to 1440x1100 afterwards. "Visible" means the chip's rect lies inside the pane scroller's rect. Each probe records three states: `before` (Complete focused), `atPress` (right after the Enter) and `afterSave` (after the write settles, plus 700 ms).

| Probe | `09c879f2` (head) | `0b6eae24` (pre-delta) | head with the call removed |
|---|---|---|---|
| R4P-01 RV short, Complete scrolled to the top | scrollTop 1138 -> **758**; chip hidden -> **visible** (top edge 0), focused, ring on; same after the save | 1138 -> 1138; chip hidden (-380 px), focused | same as pre-delta |
| R4P-02 RV short, Complete reached by Tab | 885 -> **758**; chip hidden (-127) -> **visible**, focused | unchanged, hidden | same as pre-delta |
| R4P-03 RV tall, chip already visible | 643 -> **643** (no scroll), chip focused | 643 -> 643 | 643 -> 643 |
| R4P-04 LP short, Complete scrolled to the top | 1177 -> **798**; chip hidden (-379) -> **visible**, focused, ring on; same after the save | unchanged, hidden | same as pre-delta |
| R4P-05 LP tall, chip already visible | 683 -> **683** at the press (no scroll); 660 after the save, with the chip still at +115 px | identical, 683 -> 660 after the save | identical |

The LP 683 -> 660 after the save shows up in all three bundles, with the chip's on-screen position unchanged. It is the Live Preview redraw compensating for content above, not the new call.

## 4. Gates re-run

- e2e (export of `09c879f2`, `--only=NEGO-F01..F04,NEGO-L01..L05,R4P-01..05`): `OBSIDIAN-E2E done: 12/14 ok, 0 failed, 2 known-bug` (the 2 known-bug are `NEGO-F01` and `NEGO-L03`, SC-639). The two comparison runs (`0b6eae24`, and head without the scroll) are also `12/14 ok, 0 failed`. The probes record data and do not assert the scroll.
- jest (`npx jest negotiation test/dom/kit/controlFocus.test.ts`: 8 suites, namely the 4 dom negotiation suites, the 3 unit negotiation model suites and kit controlFocus): head **641 passed / 0 failed**; without the scroll call **640 / 1 failed** (the new LOW-4 test).
- Full battery: not re-run. The r3 implementer reports it on `09c879f2` (jest 13318/1 cached, lifecycle 64/64, e2e 591/608 / 17 known-bug / 416/416, shots, freeze and parity unchanged). The delta does not touch CSS, the kit's behaviour or any other element.

## 5. INFO

- **INFO-1:** LOW-4 is pinned only by jsdom (the call and its arguments). Real Obsidian is covered only by my scratch probes R4P-01..05. If the owner wants it in the e2e gate, R4P-01 can be turned into a plain test: assert that the chip rect is inside the scroller and that `activeElement` is chip 0. Not required by the ruling.
- **INFO-2:** `block: 'nearest'` puts the chip flush with the pane's top edge (chipTop 0 in R4P-01, -02 and -04). The focus ring is drawn just outside the chip's box, so its top edge may be cut by the scroller's clip. Cosmetic, and I did not measure it. A future tweak could add `scroll-margin-top` on the chip.

## 6. Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc642-r4-rev/`)

- Exports: `exp-head/` (`09c879f2`), `exp-pre/` (`0b6eae24`), `exp-noscroll/` (`09c879f2` with `view.ts:58` replaced by `void 0;`).
- Probe spec: `probe-src/zz-r4probe.e2e.ts`; probe-spec tsc check `r4rev-probe-tsc.log` (rc=0).
- e2e: `r4rev-e2e-exp-head.log` / `.rc`, `r4rev-e2e-exp-pre.log` / `.rc`, `r4rev-e2e-exp-noscroll.log` / `.rc`; probe data `r4rev-probe-exp-head.jsonl`, `r4rev-probe-exp-pre.jsonl`, `r4rev-probe-exp-noscroll.jsonl`.
- jest: `r4rev-jest-exp-head.json` / `.log`, `r4rev-jest-exp-noscroll.json` / `.log`, `r4rev-jest.rc`.
