# SC-626 r2 independent review — montage keyboard focus after a write / strip toggle / window close

**Executive summary**
- **Verdict: LAND.** dse `11fbded6` (on develop `a5313f9d`). I found no CRITICAL, HIGH or MEDIUM problems. The fix does what the ticket asks in Reading view, Live Preview and an embed, and it keeps the prior-art negative rule.
- **Findings: 0 CRITICAL · 0 HIGH · 0 MEDIUM · 1 LOW · 6 INFO.** The LOW is out of scope and was there before this change (see below).
- **Gates (re-run by me on `11fbded6`):** tsc + lint clean · jest **12167 passed / 1 skipped** (shots cache present) · lifecycle **64/64** (21+16+9+4+7+4+3, no re-runs) · e2e `OBSIDIAN-E2E done: 437/446 ok, 0 failed, 9 known-bug, coverage: 235/235 pairs` (no SC-626 known-bugs left) · shots **592**, button host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze **280/280** · parity **0 / 0 / 24**. All of these match the r1 report.
- **Tests are not vacuous.** With the `src/` wiring reverted (montage `view.ts`, `BoardView.ts`, `livePreviewFocusCarry.ts`), jsdom gave **23 red** (F01–F20, F22, K03, the carry test), and e2e MONT-F gave **11/13 red** (F09 and F10 are negatives, so they pass by nature). Of my own real-Obsidian probes, 15 apply under revert, and 12 of them went red (the 3 green ones are negatives). I also killed three targeted mutants: no `data-dse-focus-at` stamps (F12, F13, F14, F18 red), no fallbacks (10 red), and the window opener never cleared (F26 red).
- **The two flagged mappings are both right for a keyboard user** (judgment below). End round → Back is the best choice. Remove → first quick button is acceptable; the hero's row button is a defensible alternative and a taste call for Scott, not a defect.
- **Owner's extra probe (outside edit while a montage window is open):** the window does **not** stay open. In Reading view and in Live Preview it closes with the old view. No stale data is written: the outside edit survives and nothing is saved from the window. Focus falls to `<body>` and no Notice is shown. This is SC-608's gap for the montage, so a separate Backlog ticket is justified (LOW-1).
- Working tree left as found: dse `git status --porcelain` is empty, and the superproject shows ` M draw-steel-elements` before and after (the unbumped pointer).

## 1. My own survey vs. the r1 table

I built my own list of controls before reading the r1 report, from `src/elements/montage/*.ts`: every `control:` and `stampControl`, every `commit()` caller, the strip's `onToggle` → `update()`, and `openTrackedModal` (Log an action, Add a hero, Set limits). Every write and the strip toggle go through `MontageView.update()` (view.ts:99-116). Capture happens before `super.update` and restore after it, so no path skips the hand-back.

| Path | r1 coverage | My evidence |
|---|---|---|
| Bar: End round / Undo / Back / Reopen / Clear all | F01–F09, MONT-F01/F07/F12 | P09, P11 (Space), P12 (Clear all → Log, real Obsidian) |
| Chrome: Add a round, Reset progress (direct writes) | F10 (jsdom only) | **P01, P02 real Obsidian**: the hover-revealed panel item takes focus back with the ring |
| Chrome: Add a hero, Set limits (windows) | F19, F20, MONT-F05/F06 | P16 (Add a hero in **Live Preview**) |
| Board: corner Add a hero (window) | F19 | P05 (Escape, no write → opener) |
| Board: row "Log an action for <hero>" | F17 | P17 (real keys, the same hero's button) |
| Board: quick trio → recorded cell | F12, MONT-F11 | P07/P20 first step |
| Board: recorded / empty past cell → sheet | F13, F14, F18 | P18 (empty past cell, Log → same `1:Kira` cell) |
| Board: Remove on the round-in-play cell | F18 | P08 (→ `quick.success`, ring on, label "Log a success for Kira in round 1") |
| Strip open/close (local rebuild) | F11, MONT-F02 (RV) | P10 (**Live Preview**, open and close) |
| Guide open/close | no rebuild | confirmed: GuideView's collapsible does not call `update` |
| Embed (`![[Montage/fresh]]`) | none | **P21**: End round and strip toggle keep focus inside the embed's montage |
| Identical twins, the 2nd block written | none | **P03 (RV), P04 (LP)**: focus stays in block 1, block 0 untouched |

**Gaps in the r1 table:** none in the product. The r1 table did not list the embed or twin cases, and it covered the chrome direct writes only in jsdom (jsdom has no hover-hidden panel). My probes cover all three, and all of them pass.

**Negative rule (SC-614 / SC-585 / SC-613):**
- A mouse press does not pull focus in (MONT-F09). Neither does a mouse-opened window closed by a write (MONT-F10).
- With focus in a non-DSE input, an outside edit leaves focus there (P15).
- With focus on block 0's End round, an outside edit to block 1 of the twins note leaves focus on block 0 (P13).
- Escape on a keyboard-opened window, with no write, returns focus to the opener (P05).
- A later write never reuses an old window opener (F26, mutant-killed).

## 2. Findings

### LOW-1 — an outside edit while a montage window is open closes it, and focus falls to `<body>` with no Notice (out of scope, was there before)

- **Where:** `src/elements/montage/view.ts:385-398` (`openTrackedModal`). The montage has no SC-608 hand-off (`src/framework/chrome/windowHandoff.ts`); initiative does (`src/elements/initiative/view.ts:184-190`).
- **Scenario (measured):** a keyboard user opens Set limits (P06 RV, P19 LP) or the edit sheet on a recorded cell (P07 RV, P20 LP). An outside `vault.process` edit to the note follows. Obsidian redraws the section, the old view unloads, and `openManagedModal`'s owner closes the window. The user's half-typed values are dropped silently. Focus ends on `<body>` (`modals: 0`, `body: true`).
- **What the data shows:** no stale write. In every probe the note held the outside edit afterwards (`current_round: 2, successes: 1, success_limit: 3`; `title: Cross the Chasm`, one entry, `successes: 1`), and nothing was saved from the window. The stale-object risk is real in principle: `correctMontageEntry` and `removeMontageEntry` apply a tally delta to `this.model` for an entry object from the old model (model.ts:497-524). It is not reachable in these hosts, because the window never outlives the view.
- **Related case (P14):** focus inside the card, and an outside edit to that same block → `<body>`. The same fresh rebuild causes it, and no own write is involved, so the SC-626 rule does not require a hand-back.
- **Prescribed fix (separate Backlog ticket, not SC-626):** give the montage the SC-608 treatment. Publish a `WindowRootRecord`, call `handOffAfterOutsideClose` from the view's unload while a window is open, and show the Notice when the content differs. Optionally carry focus inside the card across an outside rebuild of the same block. It does not block the landing.

### INFO-1 — judgment on the two flagged mappings (the owner asked)

1. **End round on the last round → "Back to round N"** (`focusRules.ts:40`, chain back → reopen → undo). **Right for a keyboard user.** In the complete bar, Back is the button right next to where End round was. A screen reader announces "Back to round 3, button" when focus moves to it, which names exactly what the next Enter does. Of the candidates, it is the only one whose Enter changes no data and no setup: it reverses the press that just happened. Reopen adds a round to the setup, Undo deletes an entry, and Clear all wipes the montage (correctly never a landing). P09 measured a repeated Enter: it lands on "Back to round 3", then on "Back to round 2" (current_round 3). The worst case is that a user who mashes Enter steps the round back and forth, and End round undoes that. Keep it.
2. **Remove on the round-in-play cell → the socket's first quick button (Success)** (`focusRules.ts:33-35`; mechanism in `controlFocus.ts:114`, which skips the unfocusable socket div for the first focusable control with the same `at`). **Acceptable, not wrong.** It keeps the user in the same cell, at the same place on the board. The label "Log a success for Kira in round 1" is announced (P08). Shift-Tab and Tab reach Failure and Assist, which is the likely next step after removing a wrong entry. One cost: before the Remove, Enter on that cell opened a sheet and wrote nothing. Now the same Enter logs a Success at once. That write is additive, visible and one Undo away, so it is not destructive the way Clear all is. The hero's row button ("Log an action for Kira", `BoardView.ts:263-280`) is the alternative whose Enter behaves like the removed cell's (it opens the sheet for the round in play). It sits in the name column, away from the cell. This is a taste call between "same place" and "same Enter behaviour". The owner's plan to mention it in the closing comment is the right handling.

### INFO-2 — the comment at view.ts:89-91 states an assumption the code does not enforce

The comment says the opener is "Not kept for a window opened with the mouse". The code stores whatever `captureControlFocus` returns at open. It is null only because a real mouse press in Obsidian does not focus the button (MONT-F10 measured `inMontage: false`). If a host ever focuses on mousedown, the token is kept with `ring: false`, and focus comes back plain without the ring. That matches the kit's rule (a mouse press gets plain focus), so the behaviour is fine. Optional: reword the comment to "null when the window was opened without focus in the card (a mouse press does not focus it in Obsidian)".

### INFO-3 — initiative does not opt into `controlFocusRules`, so its Live Preview carry still ignores its families

`livePreviewFocusCarry.ts:61-66` applies a view's rules only when the view provides them. Initiative has families (`init.captain.make` → `init.captain`), but its Live Preview carry stays family-blind, exactly as before SC-626. This change does not alter it, and the INIT e2e and jest suites are green. It is a possible tidy-up if a Live Preview captain-toggle focus bug ever shows up.

### INFO-4 — skill text goes stale on landing (r1 "Skill notes" confirmed)

dse-verify's CURRENT e2e line should read `437/446 ok, 0 failed, 9 known-bug, coverage: 235/235 pairs`, and jest `12167 / 1` with the cache. In the montage jsdom-marker line ("SC-625 x2, SC-626, SC-631"), SC-626 should be dropped. The e2e known-bug list no longer has SC-626 (measured: SC-257, SC-355, SC-384, SC-625 x2, SC-627, SC-628 x2, SC-629 = 9).

### INFO-5 — what the tests prove (vacuity check)

- jsdom, wiring reverted (`view.ts`, `BoardView.ts`, `livePreviewFocusCarry.ts` at `a5313f9d`): `Tests: 23 failed, 219 passed`. Red: F01–F20, F22, K03 and the carry test. Green: F21, F23–F27, which are guards or negatives by nature.
- Mutants:
  - M1, no `at` stamps: F12, F13, F14, F18 red.
  - M2, `MONTAGE_FOCUS_FALLBACKS = {}`: F02, F04, F06, F07, F08, F09, F15, F16, F17, F18 red.
  - M3, the window opener never cleared on close: F26 red.
- e2e, wiring reverted: MONT-F01–F08 and F11–F13 red, F09 and F10 green (negatives). My probes under revert: R2P-01–04, 08–12, 16–18 red; R2P-05, 13, 15 green (negatives or no-write paths).
- The kit tests (+6) exercise the kit additions directly. I did not revert the kit, so they do not show up in the revert counts. M2 shows that the fallback branch is load-bearing.

### INFO-6 — what I did not probe

- Keyboard inside a hover popover (Obsidian's popovers are writable, G-S6g). It is the same per-root code path, and keyboard focus inside a popover is unusual.
- Window Cancel in Live Preview: no rebuild happens, and Obsidian's own focus return applies.
- The sidebar (experimental pin) host.

## 3. Kit regression check (initiative / conditions)

`controlSuccessor` with no `fallbacks` entry and no `at` takes the same `pool[min(nth, len-1)] ?? root` path as before. A null family returns the root, as before (`controlFocus.ts:107-110`). A kit test also pins this ("a family WITHOUT a fallbacks entry keeps the old rule"). The full jest run (initiative-matrix, conditions, chromeFocusHandoff, initiative-outside-edit, sidebarInitiative) is green, and so are e2e INIT-F01–F25 / COND-* / CHR-*. `restoreControlFocus` keeps its `focusIsFree` guard.

## 4. Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc626-r2-rev/`)

- Gates: `tsc.log`, `lint.log`, `jest.log` (12167/1), `lc-part1-a.log` … `lc-part7-a.log` (21, 16, 9, 4, 7, 4, 3), `e2e-full-a.log` (437/446, 235/235), `shots.log`, `freeze.log`, `parity.log`; each has a sibling `.rc` (all 0).
- Probes: `zz-r2probe.e2e.ts` (the spec, 21 tests `R2P-01`..`R2P-21`; it was copied into `e2e/specs/montage/` only for each run and then removed), `probe-fix1.log`, `probe-fix2.log`, `probe-fix3.log` (final: 21/21 ok; `R2PROBE` lines carry the measured focus states).
- Revert and mutants: `revert-run.sh`, `revert-jest.log` (23 red), `revert-e2e.log` (5/28 ok), `revert-status.txt`, `revert-status-after.txt` (empty = restored), `mutant-run.sh`, `mut-m1.log`, `mut-m2.log`, `mut-m3.log`, `mut-status-after.txt`.
- Scripts: `gate-a.sh`, `lc.sh`, `e2e-full.sh`, `shots.sh`, `probe-run.sh`.
