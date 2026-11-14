# SC-642 r2 independent review: Complete Argument keeps keyboard focus on the card

**Executive summary**
- **Verdict: LAND.** dse `01af056d` (on develop `12aaf5b5`). No CRITICAL, HIGH or MEDIUM findings. The fix does what the ticket asks in Reading view and Live Preview. It lands on the ticket's "first control of the next argument". It keeps the prior-art negative rule, and Complete writes the same note bytes as on base.
- **Findings: 0 CRIT · 0 HIGH · 0 MED · 5 LOW · 6 INFO.** LOW-1 and LOW-2 are wrong comments (mechanism and mouse), cheap to fix in the landing chore. LOW-3 and LOW-4 are side effects of the chosen landing that Scott should hear about. LOW-5 is an untested method.
- **Gates (re-run by me on `01af056d`):** tsc + lint clean · jest **13042 passed / 1 skipped** (shots cache present = r1's 13041 / 2 fresh + 1) · lifecycle **64/64** (21+16+9+4+7+4+3, no re-runs; G-S91 and G-S115 green first time) · e2e `OBSIDIAN-E2E done: 582/601 ok, 0 failed, 19 known-bug, coverage: 416/416 pairs` · shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze **280/280** · parity **0 / 0 / 24**. All match the r1 report.
- **Vacuity:** with `src/` reverted to `12aaf5b5`, **5 of 9** new jsdom tests went red and **4 of 4** positive e2e tests went red (F02, F03, L02, L04). The 4 jsdom negatives and the 2 e2e negatives (F04, L05) pass on a revert by nature. Each one goes red under a mutant. **8 mutants:** 6 killed (M1, M2, M4, M5, M7, M8) and 2 survived (M3: no `controlFocusRules`; M6: ring forced on).
- **Mechanism (item 6): partly confirmed.** The blur happens before the debounced write (about 410 ms earlier), and no rebuild is involved. But the blur is **synchronous, inside the click dispatch** (2-3 ms after `click`, before the click event finishes), not "on the next frame". So in real Chromium focus is already on `<body>` when the restore runs. `fromDisabled` is used only by jsdom: mutant M4, which drops it, passes every e2e test (LOW-1).
- **Mouse (item 6): r1's claim is wrong for real Obsidian.** A mouse press on Complete does not focus the button: the pipeline's click shield cancels `pointerdown`/`mousedown` (`src/framework/pipeline.ts:231-248`). Focus stays wherever it was, in Reading view (preview div or body) and in Live Preview (`cm-content`), byte-for-byte the same as on base. The hand-off runs only when focus was already on Complete, e.g. a keyboard user Tabbed there and then clicked. In that case the chip gets the ring. No keyboard-only gate is needed (LOW-2 fixes the comments).
- **Landing (item 7): accept** the first Motivation chip (fallbacks: Pitfall chip, then the lie box). The next Tab continues to chip 2 in both modes, also when the write ends the negotiation. Two side effects to name in the closing comment: a quick double Enter now appeals the first motivation (LOW-3), and the chip can land off-screen with no scroll (LOW-4).
- Working tree left as found: dse `git status --porcelain` empty before and after; superproject ` M draw-steel-elements` (the unbumped pointer) before and after. Separately, the shared MAIN checkout's `draw-steel-elements` is now dirty (`10c271fe`, SC-628's head: ` M demo-vault/Welcome.md`, `?? compendium-manifest.json`, `?? demo-vault/montage 1.md`). I never touched it; gate processes with cwd `workspace/` were running from another effort.

## 1. Requirement and owner decisions (from the ledger, verbatim)

> **Expected:** focus stays on the card (for example on the first control of the next argument, or on the button itself).

> Prior-art rule (SC-614 / SC-585 / SC-613 / SC-626): focus is moved only when it was inside the card before the action; a write with focus elsewhere (outside edit, re-render with focus outside) never pulls focus in.

> Reuse the shared kit helper `src/framework/kit/controlFocus.ts` … keep the fix reusable for SC-639 … Do NOT fix Reset here, and stay out of `src/model/NegotiationData.ts` and the Reset path … If SC-639's markers (`NEGO-F01`, `NEGO-L03`, jsdom `K05`) turn green as a side effect, stop and report.

Owner ruling (r1 entry): mapping ACCEPT Complete -> first Motivation appeal chip (else first Pitfall chip, else the Lie box, else the card root).

Judgment against each:
- Expected: met in RV and LP (F02/L02, my P01/P04), with Enter (P01) and Space (P02), with two blocks (P06/P07: focus lands in the SECOND card, the one pressed), and when the press ends the negotiation (P08/P09: `data-ended="final"`, chip 0, the next Tab goes to chip 1).
- Prior-art rule: met. With focus on the page, a scripted Complete pulls nothing in (F04/L05). With focus on a button outside the card, an outside edit leaves it there (P10 RV, P11 LP). With focus on another card control (the Pitfall chip), a mouse Complete leaves it there (P16). A plain mouse press with focus on the body or the preview leaves it there (P03, P05, P17).
- Kit reuse: yes, an opt-in `RestoreOptions` 5th parameter, inert by default. Montage, initiative and conditions are unchanged: full jest and e2e green. The montage suite is also green under mutant M8, and under M7 only montage F25 goes red, because M7 removes the shared "focus is free" guard on purpose.
- Scope: `git diff --stat 12aaf5b5..01af056d` touches no `src/model/NegotiationData.ts` and no Reset code. `NEGO-F01` / `NEGO-L03` are still `known-bug SC-639` in the full e2e run. Jest `[K05]` (`test/dom/elements/negotiation-bugs.test.ts:80`) is still `test.failing`, and its suite passes.

## 2. Findings

### LOW-1: the mechanism comments say "next frame", but Chromium blurs synchronously inside the click dispatch

- **Where:** `src/framework/kit/controlFocus.ts:26-28` and `:98-100` ("Chromium moves focus off a disabled control on the next frame … Call it synchronously after the disabling, before that frame"); `src/elements/negotiation/focusRules.ts:5`; `e2e/specs/negotiation/focus.e2e.ts:27-28` ("blur ~13 ms after the press"); `test/dom/kit/controlFocus.test.ts:236`.
- **Measured** (page-side `focusin`/`focusout`/`keydown`/`click` capture listeners, plus a `window` bubble `click` listener that runs after the button's own handler, plus a vault `modify` hook; real Obsidian 1.14.4 / Chrome 150):
  - Base RV (P01): `13 keydown Enter@complete | 13 click | 16 focusout complete(disabled) -> null | 21 click-after-handlers: active=BODY | 429 modify`.
  - Branch RV: `17 click | 20 focusout complete(disabled) -> null | 30 focusin appeal.motivation | 30 click-after-handlers: active=appeal.motivation | 434 modify`. LP is the same shape (P04: 22 / 27 / 39 / 435).
  - So the blur is synchronous. It happens during `resolveArgument()`, at a style update that sees the disabled button, and the click event is still being dispatched. Its `relatedTarget` is null, and it comes about 10 ms before the restore. The restore then runs through the ordinary `focusIsFree` branch, not the `fromDisabled` one.
  - **Mutant M4** (pass `{}` instead of `{ fromDisabled: true }`): every e2e test passes (F02, F03, L02, L04 green, `7/9 ok, 2 known-bug`). Only the jsdom tests catch it (4 red).
- **Confirmed from r1:** no rebuild is involved, and the write lands about 410 ms after the blur.
- **Failure scenario:** none for users today. The risk is the next reader. SC-639 is told to reuse this kit path, and a reader who believes the "before the next frame" timing may design around a window that does not exist. A test-only accommodation also reads as a product requirement.
- **Fix:** reword the five comments, for example: "Chromium blurs a focused button the moment it is disabled, inside the same click dispatch (measured: 2-3 ms after the click, before the handler returns), so focus is already on `<body>` when the restore runs. jsdom keeps the disabled node as `document.activeElement`, and `fromDisabled` covers that (and any engine that defers the blur)." Keep the option: it is harmless, and it makes the jsdom tests meaningful.

### LOW-2: "a pointer press focuses the button" is false in real Obsidian, so the mouse concern is moot and two test comments are wrong

- **Where:** `e2e/specs/negotiation/focus.e2e.ts:61` and `e2e/specs/negotiation/live-preview.e2e.ts:60` ("A scripted press: a pointer press would focus the button, which is the case F02/L02 covers"); the r1 report's design note "a mouse user gets focus on the first chip too"; the ledger's "Mouse press also hands focus to the chip (no ring)".
- **Measured:** a real wdio pointer click on Complete (P03 RV, P05 LP, P17 RV with focus on body) produced `pointerdown` and `click` with no `mousedown` and no `focusin`. Focus stayed on `div.markdown-preview-view` (RV), `body` (P17) or `div.cm-content` (LP), and was identical on base and branch. The cause is `armClickShield`: a capture-phase `pointerdown`/`mousedown` `preventDefault()` on every DSE root for non-editable targets (`src/framework/pipeline.ts:231-248`). A cancelled `pointerdown` suppresses the compatibility `mousedown` and its focus step.
- The hand-off runs on a mouse click only when focus was already on Complete (P15: Tab to Complete, then click it). Then the chip takes focus WITH the ring, because the capture saw `:focus-visible` from the keyboard focus. That is the prior-art rule working as intended.
- **Answer to brief item 6:** acceptable as is; no keyboard-only gate is needed. The ring-off branch (`focus.ring === false`) cannot be reached on this path in real Obsidian by mouse, which is why mutant M6 (ring forced on) survives everything (INFO-2).
- **Fix:** in both e2e comments, say "a pointer press does not move focus at all (the click shield cancels `pointerdown`), so this scripted press stands for any press made while focus is outside the card". The closing comment should not tell Scott that a mouse press moves focus.

### LOW-3: a quick second Enter now appeals the first motivation

- **Where:** a consequence of the landing (`src/elements/negotiation/focusRules.ts:18`).
- **Measured (P13, RV):** Enter on Complete, then a second Enter 36 ms later. On base the second key goes to `BODY` and does nothing. On the branch it goes to chip 0 and toggles it (`aria-pressed=true`), and the debounced write carries it: the note gets `currentArgument.motivationsUsed: [Higher Authority]`, so the note bytes differ from base. One write either way.
- **Failure scenario:** a GM double-taps Enter, or holds it into key-repeat. The next argument starts with Higher Authority already appealed. It is visible (the chip shows pressed, with the ring) and a third Enter undoes it, but it is a silent state change in the note.
- **Judgment:** acceptable. It follows from the landing the ticket proposes. The ticket's other suggestion, the button itself, is disabled and so not a Tab stop. No fix needed. Name it in the closing comment so Scott can redirect, for example to the tier radiogroup, where Enter selects nothing.

### LOW-4: the landing chip can be off-screen, and nothing scrolls to it

- **Where:** `focusControl` always passes `preventScroll: true` (`src/framework/chrome/focusHandoff.ts:37`, `:49`). The new path inherits that.
- **Measured (P14):** in a long note, with Complete scrolled to the top of the pane, Enter moves focus to chip 0. The chip ends up above the viewport (`onScreen: false`), and `scrollTop` stays at 1138. The ring is drawn out of sight, and the next Tab scrolls (to chip 1). The span from chip 0 to the bottom of Complete is 408 px (P18, LP, 1440x1100 window). So in a normal pane, where Tab brings Complete in at the bottom edge, the chip is on screen. It goes off-screen only in a pane shorter than about 450 px, or when the user has scrolled Complete near the top.
- **Failure scenario:** a keyboard user in a short pane presses Complete and sees no focus ring. They have to press Tab to find where focus went (a WCAG 2.4.7 / 2.4.11 visibility concern).
- **Fix (optional, small):** this path rebuilds nothing and needs no scroll pin. So in `NegotiationView.keepFocus` (`src/elements/negotiation/view.ts:58-62`), after a successful restore, call `document.activeElement.scrollIntoView({ block: 'nearest' })` when its rect is outside the scroller. Or leave it, and say so in the closing comment.

### LOW-5: `NegotiationView.controlFocusRules()` is untested and is not on the working path (mutant M3 survives)

- **Where:** `src/elements/negotiation/view.ts:51-54`.
- **Measured:** M3 (return `{}`) passes all 400 jsdom tests in the two suites, every negotiation focus e2e test, and my LP probes P04, P07 and P09 (all still land on chip 0). The in-handler hand-off already puts focus on the chip before the LP carry captures, so the carry sees `appeal.motivation`, not `complete`. That matches r1's own design note.
- **Failure scenario:** none today. It is code with no test, kept as insurance and as a hook for SC-639. If it regresses, nothing notices.
- **Fix:** either add a jsdom test that feeds the carry's lookup a `negotiation.complete` token with `view.controlFocusRules().fallbacks`, for example `controlSuccessor(root, { family: 'negotiation.complete', nth: 0, ring: true }, {}, rules.fallbacks)` on a mounted card after Complete, and expects chip 0; or drop the method until SC-639 adds its `negotiation.menu` entry.

### INFO-1: landing judgment (brief item 7)

The first Motivation chip is right for a keyboard user. It is the first Tab stop of the Argument tab and the start of the next argument, and the next Tab continues through the chips (F03, L04, P01, P04, P08). The alternatives r1 rejected are rejected for good reasons: the disabled button is not a Tab stop, the card root takes an extra step, and the tier rows do not exist once the negotiation ends. When the write ENDS the negotiation (P08/P09), the chips are still enabled and the landing is still chip 0. That is fine: there is no "next argument" left, but focus stays in the card, which is what the ticket asks. The caveats are LOW-3 and LOW-4.

### INFO-2: mutant M6 (ring always on for `fromDisabled`) survives

Every press that reaches the hand-off in real Obsidian starts from keyboard focus on Complete (LOW-2), so the ring is on anyway. M6 is equivalent in practice. jsdom never asserts the ring on this path. No action needed.

### INFO-3: an outside edit with focus on a card control drops focus to `<body>`, on base too (out of scope)

P12: focus on Complete (tier chosen, Tabbed there), then an outside `vault.process` edit. Focus ends on BODY, both on base and on the branch (the Reading view re-renders a fresh view, no adoption). This is not SC-642's path, and it is not a regression. It is the negotiation's version of the gap other trackers closed for outside edits. The owner may want to check the backlog for it before filing anything.

### INFO-4: survey spot check

I did not re-measure r1's 9-control survey in real Obsidian. By reading the code, I agree that no other negotiation control disables ITSELF. Patience and Interest seals disable Complete, a different node. The Reuse and Same-argument boxes are disabled only by changes made on other controls. Covered by my probes: Complete via Enter, Space and mouse; two blocks; the ending write; an outside edit with focus outside the card (RV and LP) and on a card control.

### INFO-5: integrity

For every probe where the only action is Complete (P01-P09, P15), the note text after the write is **byte-identical** on base and branch (`r2rev-probe-compare.txt`, "NOTE identical base vs branch: True"). The only difference is P13, where the second Enter is by design a separate action (LOW-3).

### INFO-6: docs and changelog at landing

r1's "Skill notes" are correct and confirmed by my numbers: jest 13041 / 2 fresh (13042 / 1 with the cache), e2e 582/601 ok, 19 known-bug, 416/416. SC-642 drops out of the known-bug list. The dse `CHANGELOG.md` has no SC-642 bullet in this diff, so the owner adds it in the landing chore, as SC-626 did. Minor nit: `focus.e2e.ts:7` imports `onNthOfControl` out of alphabetical order (lint passes).

## 3. Vacuity and mutants

jsdom: `test/dom/elements/negotiation-matrix.test.ts` + `test/dom/kit/controlFocus.test.ts` (400 tests; 9 are SC-642's). e2e: `--only=NEGO-F01..F04,NEGO-L01..L05` (+ my probes where noted).

| Bundle | One source edit | jsdom red | e2e red |
|---|---|---|---|
| revert | `src/` = `12aaf5b5` | 5 / 9 new (kit `fromDisabled` hand-off; first chip; pitfall/lie fallbacks; ending Complete; spent first chip) | F02, F03, L02, L04 (4/4 positives); F04, L05 green by nature |
| M1 | `keepFocus`: synthetic token when nothing was captured (ignores "focus was inside the card") | "focus on the page … no focus is pulled into the card" | F04, L05 |
| M2 | fallbacks order lie box first | 4 (every landing test) | F02, F03, L02, L04 (lands on `negotiation.mod.lie`) |
| M3 | `controlFocusRules()` returns `{}` (no LP carry rules) | 0 | 0 (and LP probes P04/P07/P09 unchanged) **survives**, LOW-5 |
| M4 | `{ fromDisabled: true }` -> `{}` | 4 (every landing test) | **0**: proves LOW-1 |
| M5 | `holdsDisabledFocus` drops the `:disabled` check | kit "never takes focus from a usable control …" | not run |
| M6 | ring forced on for `fromDisabled` | 0 | 0 **survives**, INFO-2 |
| M7 | M1 + the free-focus guard removed (2 edits) | 6, incl. "focus outside / another card control", kit "without the option", montage F25 | not run |
| M8 | `fromDisabled` defaults to on (`!== false`) | kit "without the option the old rule stands" | not run |

Every one of the 9 new jsdom tests and the 6 new or flipped e2e tests is red under the revert or under at least one mutant.

## 4. Real-Obsidian probes (scratch spec, never committed)

`probe-src/zz-r2probe.e2e.ts` was run in a `git archive` export of `01af056d` and of `01af056d` with `src/` from `12aaf5b5`. Two scratch fixtures: `r2-last.md` (basic + `current_patience: 1`) and `r2-long.md` (basic + 120 filler paragraphs). Base run: `20/26 ok, 4 failed` (the 4 SC-642 positives, as expected); branch run: `24/26 ok, 0 failed, 2 known-bug`.

| Probe | Base | Branch |
|---|---|---|
| P01 RV Tab + Enter | BODY; next Tab -> `negotiation.menu` (top of card) | chip 0 (ring); next Tab -> chip 1 |
| P02 RV Space | BODY | chip 0 (ring) |
| P03 RV mouse, focus on preview div | preview div | preview div (unchanged) |
| P04 LP Enter | BODY; next Tab -> a host `clickable-icon` | chip 0 (ring); next Tab -> chip 1 |
| P05 LP mouse, focus in editor | `cm-content` | `cm-content` (unchanged) |
| P06 / P07 two blocks, 2nd card | BODY | chip 0 **of the second card** (RV and LP); first block untouched in the note |
| P08 / P09 last argument (ends, `final`) | BODY | chip 0; RV next Tab -> chip 1 |
| P10 / P11 outside edit, focus on an outside button | stays on it | stays on it |
| P12 outside edit, focus on Complete | BODY | BODY (pre-existing, INFO-3) |
| P13 double Enter | 2nd Enter on BODY | 2nd Enter toggles chip 0 (LOW-3) |
| P14 Complete scrolled to top | BODY | chip 0 off-screen, no scroll (LOW-4) |
| P15 Tab to Complete, then mouse click | BODY | chip 0 (ring) |
| P16 focus on Pitfall chip, mouse Complete | Pitfall chip | Pitfall chip |
| P17 focus on body, mouse Complete | BODY | BODY |

What I did not probe: embeds and hover previews of a negotiation (the scope is `this.rootEl`, the same as RV), the sidebar, mobile or touch input, and a screen reader's announcement.

## 5. Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc642-r2-rev/`)

- Gates: `r2rev-tsc.log`, `r2rev-lint.log`, `r2rev-tsclint.rc`; `r2rev-jest.log` / `.rc`; `r2rev-e2e-full.log` / `.rc`; `r2rev-lc1.log` … `r2rev-lc7.log` (+ `.rc`); `r2rev-shots.log` / `.rc`; `r2rev-freeze.log`; `r2rev-parity.log` / `.rc`.
- Vacuity and mutants: `r2rev-jestvac-exp-{base,m1..m8,branch}.json` / `.log`, `r2rev-jestvac.rc`, `r2rev-jestvac2.rc`; `r2rev-e2e-exp-{base,m1,m2,m3,m4,m6}.log` / `.rc`; e2e failure bundles under `exp-base/e2e/.out/`, `exp-m1/e2e/.out/` and `exp-m2/e2e/.out/`.
- Probes: `probe-src/zz-r2probe.e2e.ts`, `probe-src/r2-last.md`, `probe-src/r2-long.md`; results `r2rev-probe-exp-base.jsonl`, `r2rev-probe-exp-branch-v2.jsonl`, `r2rev-probe-exp-m3.jsonl`, `r2rev-probe-exp-m6.jsonl`, `r2rev-probe-p18.jsonl`; side-by-side `r2rev-probe-compare.txt` (`r2rev-cmp.py`); run logs `r2rev-e2e-exp-branch-v2.log`, `r2rev-e2e-exp-base.log`, `r2rev-e2e-p18.log`. (`r2rev-probe-exp-branch.jsonl` is the first, smaller run of the same probes.)
- Exports: `exp-branch/`, `exp-base/`, `exp-m1/` … `exp-m8/` (each a `git archive`, with `node_modules` symlinked to the worktree's).
