# SC-588 r2 independent review — initiative focus after a whole-tracker rebuild

**Executive summary**
- Verdict: **FIX (wording only) — or LAND if you rule the Live Preview gap a separate Backlog ticket.** The Reading-view fix is correct, scoped to its own view, and proven red to green in jsdom and real Obsidian. No code defect found.
- Reviewed dse `d62803db` (fix `40f760f9`) on `79da77f8`; superproject `9dd7cbf8`. `origin/develop` moved to `e5b6f9f2` (SC-597). There is no file overlap with this branch, so the rebase should be clean. Details in "SC-597 interaction".
- Findings: HIGH 0 · MEDIUM 1 · LOW 2 · INFO 6.
- MEDIUM-1: in **Live Preview** the fix holds focus for only about 0.4 s. The tracker's own debounced write then redraws the CodeMirror widget with a new root, and focus falls to `<body>`. This is pre-existing and generic: a counter's + loses focus the same way. Every SC-588 e2e test runs in Reading view, and both changelogs claim the fix without that limit.
- Follow-up CONFIRMED: a keyboard squad-pool Apply (detail numeric → pool modal → Enter on Apply) leaves focus on `<body>`. A grid stamina edit cannot be started from the keyboard (double-click only).
- Gates (measured, d62803db): tsc/lint clean · jest **7279 passed / 2 skipped** (263/264 suites) · lifecycle **55/55** (21+16+9+4+5) · e2e **`270/274 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs`** · styles.css carried (no CSS or styles source in the diff).
- Vacuity: with view.ts reverted to base, jest has 8 of the [F] tests red, and e2e has INIT-F01..F05 red with F06 green (a guard). Restored, everything is green.
- Branch left exactly as found (dse porcelain clean, HEAD d62803db; superproject only ` M draw-steel-elements`, the unstaged pointer, as at start).

## Gates (all at dse d62803db, in the worktree)

| Gate | Result | Log |
|---|---|---|
| tsc (`npm run tsc`, incl. e2e) | GATE_RC=0, no output | `r2-tsc.log` |
| lint | GATE_RC=0 | `r2-lint.log` |
| jest (fresh, `rm -f main.js styles.css` first) | `Tests: 2 skipped, 7279 passed, 7281 total`; `Test Suites: 1 skipped, 263 passed, 263 of 264 total` | `r2-jest-full.log` |
| e2e | `OBSIDIAN-E2E done: 270/274 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs`, pointer parked, no WARN. Known bugs: SC-257, SC-355, SC-384, SC-580 | `r2-e2e-full.log` |
| lifecycle p1 `G-S7a … G-S9a` | 21/21 | `r2-life-p1.log` |
| lifecycle p2 `G-S9b … G-S40` | 16/16 | `r2-life-p2.log` |
| lifecycle p3 `G-S45 … G-S64` | 9/9 | `r2-life-p3.log` |
| lifecycle p4 `G-S57 G-S62 G-S61 G-S56` | 4/4 | `r2-life-p4.log` |
| lifecycle p5 `G-S59 G-S49 G-S73 G-S77 G-S83` | 5/5 (G-S83 ok) | `r2-life-p5.log` |
| shots/freeze/parity | not run: the diff touches no `.css`, `styles-source.css` or token file, so `styles.css` is byte-identical by construction. The new DOM attribute (`tabindex=-1` on the root) is set only on the fallback path, which no capture reaches (see LOW-2/INFO) | — |

Vacuity (scratch copy, `view.ts` swapped to `79da77f8`'s, then restored and `cmp`-verified):
- jest `controlFocus.test.ts` + `initiative-matrix.test.ts`: base **8 failed / 148 passed** (F01, F02, F03 x2, F04 x2, F05 Yes, F07). HEAD: 156/156. The 7 helper tests in `controlFocus.test.ts` exercise the helper itself and pass either way. F05-Cancel and F06 are guards by design.
- e2e `--only=INIT-F01..F06`: base `1/6 ok, 5 failed` (F06 passes as a guard); HEAD green in the full run.

## Findings

### MEDIUM-1 — Live Preview: focus is restored, then lost ~0.4 s later when the tracker's own write redraws the widget
- **Where:** the fix is `src/elements/initiative/view.ts:201-204` (capture, update, restore, then `persist()`). The loss happens later, on the host's Live Preview write path, not in this diff.
- **Scenario (real Obsidian 1.14.4, probe ZZ-Q01, `probe2-head.jsonl`):** open `Initiative/rich.md` in Live Preview, focus Advance round, press Enter.
  - The rebuild blurs the old button at 52 ms. The restore focuses the new one at 83 ms, and focus is still there at 256 ms.
  - At 515 ms the debounced write lands, and the widget is redrawn with a **new** root (`sameRoot:false`, old root disconnected). Focus falls to `<body>` and stays there (checked again at settle + 1 s).
  - Quick-add Enter in Live Preview ends on `<body>` too (ZZ-P04).
  - Base for comparison (`probe2-base.jsonl`): `<body>` at 65 ms. So the branch improves the first ~0.4 s, and the end state is unchanged.
- **Pre-existing and generic (ZZ-Q03):** a `ds-counter` + pressed by Enter in Live Preview has focus at 150 ms and `<body>` after its write (focusout at 449 ms). Reading view does not have this problem: `adoptView` captures focus and restores it across the section move. ZZ-P15 shows that focus is still on the rebuilt Advance round at +0.3 s, +1.5 s and +3 s, with one extra focusout and focusin at write time.
- **Why it matters for SC-588:** the spec is not limited to Reading view. Both changelog entries say focus "stays in the initiative tracker" with no limit. Every new e2e test (INIT-F01..F06) opens the note in Reading view, so nothing catches this.
- **Prescribed fix (choose one):**
  - (a) Qualify both changelog entries: add "in Reading view; in Live Preview focus is still lost when the note saves a moment later (SC-nnn)". Then file a Backlog ticket: "keyboard focus is lost when an element's own write redraws its Live Preview widget (counter +, initiative actions, …)". Its fix is to carry `adoptView`-style focus capture across the Live Preview redraw, or to arm a block-keyed claim like `armChromeFocus`/`claimChromeFocus` (`src/framework/chrome/focusHandoff.ts`) from `rebuildAndPersist`.
  - (b) Widen SC-588 to cover it. I do not recommend this: the cause is in the host's Live Preview write path, and it affects every persisted element.

### LOW-1 — the changelog's "a mouse click moves no focus" is not quite true when focus is in a quick-add box
- **Scenario (ZZ-P02 / ZZ-Q02, Reading view):** Tab into the Malice quick-add amount box, then mouse-click Advance round. Focus ends on `<body>`.
- **Cause:** the pipeline's click shield (`src/framework/pipeline.ts:229-241`) explicitly `blur()`s a focused DSE text field on a mousedown over a non-editable target. Focus is therefore already `<body>` when `captureControlFocus` runs, and it captures nothing.
- This is the same at base (`probe2-base.jsonl`, Q02), so it is not a regression. But the changelog sentence "A mouse click moves no focus" reads as if focus stays where it was.
- **Prescribed fix:** none in code. Optionally reword the changelog to "A mouse click never pulls focus into the tracker".

### LOW-2 — dse CHANGELOG entry line-wrapping
- **Where:** `CHANGELOG.md:25-29` (dse). The first line is about 210 characters and the fourth about 170, while the neighbouring entries wrap at about 125.
- The wording is user-facing and in the SC-578 shape. The workspace entry (`9dd7cbf8`) follows the SC-592/SC-595 shape: a bold "DSE plugin: …" headline, then prose.
- **Prescribed fix:** re-wrap the lines when the MEDIUM-1 wording is applied.

### INFO
1. **Mapping verified in real Obsidian (Reading view):**
   - Advance round → `init.round.advance`.
   - Reset turns → `init.reset-turns`.
   - Relieve ↔ Make captain → the badge on the same creature.
   - Reset encounter → Yes (keyboard; F05) → `init.reset-encounter`, ring on.
   - Reset encounter → Yes by **mouse** after a keyboard open (ZZ-P08) → `init.reset-encounter`.
   - Cancel by Enter and Escape (ZZ-P08) → `init.reset-encounter`, unchanged from before.
   - Quick-add Enter (F01) → the rebuilt label field, value empty.
2. **No focus theft, and the right instance (ZZ-P05/P06/P07):**
   - Two trackers in one note: Enter on the 2nd tracker's Advance round keeps focus on the 2nd tracker (root 3 of 4, the same before and after).
   - Sidebar twin: Enter in the sidebar copy keeps focus in the sidebar copy, and the note copy refreshes (Round 3 in both). Enter in the note copy keeps focus in the note, and the sidebar refresh does not take it.
   - Same note in two panes: focus stays in the pane that was pressed, and both panes show Round 3.
   - Structurally, a capture happens only inside this view's own `rebuildAndPersist` / Reset-encounter `onClick`, and only when `rootEl.contains(activeElement)`. Outside `update()`s (sidebar refresh, file-change re-render) never capture.
   - The spec's "(and instance key)" is met by scoping to `this.rootEl` plus `nth`, not by an instance key. For the five actions every control is unique per tracker, except the captain badge (one per open group detail row), so `nth` within the family is enough.
   - The only theft window left: during Reset encounter's async ref resolution, a user who clicks a non-focusable spot (focus stays `<body>`) gets focus pulled back to the item. This needs the vault read to be slow. Negligible.
3. **Mouse claims:**
   - Reading view, nothing focused: a click on Advance round takes no focus (INIT-F06).
   - Live Preview, nothing in the tracker focused: focus stays on CodeMirror's content (`cm-content`) and is not moved into the tracker (ZZ-P03).
   - Keyboard focus already on Advance round, then a mouse click on it: the rebuilt Advance round keeps focus, ring on (ZZ-P01). This is correct, since that is where focus was.
4. **Root fallback (`tabindex=-1`):**
   - Every focusable node in a fresh tracker carries a control id (`noCtlFocusables: []`, rich/two-trackers/captain), and no tracker root ever had a `tabindex` after Advance round, Reset turns, captain and Reset encounter (ZZ-P01, P08, P13).
   - The fallback is reached only when a successor is missing, for example the error card after a failed re-parse on Reset encounter. A `tabindex=-1` root is no Tab stop: the Tab walk in ZZ-P13 never stops on the root.
   - The click shield `preventDefault`s mousedown, so the root cannot be mouse-focused either.
   - No frozen capture reaches the fallback, so there is no effect on shots or parity.
5. **Hover preview (ZZ-P14):**
   - Keyboard Advance round inside a `.hover-popover` tracker: focus is on the rebuilt Advance round, the popover stays, Round 3.
   - Keyboard Reset encounter → Yes from the popover (the modal is anchored per SC-595): the popover stays, focus is on `init.reset-encounter` inside it, Round 1.
   - G-S83 (SC-595) is green in part 5.
6. **Housekeeping:** an orphaned `Xvfb :160` (PID 774183, cwd = this worktree's plugin dir, started about 55 min before this review; probably the implementer's killed part-4 run) is still alive. I left it alone. It is safe to kill by that PID.

## Follow-up to confirm or refute: other `rebuildAndPersist` callers through modals
**CONFIRMED** for the squad pool.

**ZZ-P09 (keyboard squad-pool edit):** on `Initiative/squad.md`, Tab to `init.detail.stamina` and press Enter. In the pool modal, type 3 and 1, Deal, Tab to Apply, then Enter. Result: one write, the modal closes, **focus is on `<body>`**.
- Cause: `MinionStaminaPoolModal` calls `persist()` (→ `rebuildAndPersist`, `view.ts:1903`) **before** `close()` (`src/views/MinionStaminaPoolModal.ts:309-310`). Focus is inside the modal at that moment, so nothing is captured. The rebuild then detaches the opener, and Obsidian's focus return to it is lost.
- Same at base (it is not on SC-588's list). The grid route `view.ts:1782` is the same code path.

**Grid edit:**
- A roster cell opens the pool or stamina modal only on a double-click, so there is no keyboard route.
- ZZ-P12 (mouse double-click, then keyboard Apply): focus ends on the Reading view's container. That is not a keyboard regression.
- ZZ-P11 (keyboard StaminaEditModal on the Goblin Captain, 40 damage to 0): focus ends back on `init.detail.stamina` in the tracker. I did not verify whether this run took the captain-bonus rebuild (`view.ts:2020`).

**Recommended Backlog ticket:** "keyboard focus falls to the page after a squad-pool Apply (initiative)". Fix shape: `captureControlFocus` at the modal's open (the opener holds focus then, like the Reset-encounter `onClick` at `view.ts:315`), and pass the token through the pool callback to a restore after the rebuild. The SC-437 r2 review already listed `:1687`/`:1808` (now `:1782`/`:1903`) as affected.

## SC-597 interaction (origin/develop e5b6f9f2, asked mid-review)
`git diff 79da77f8 e5b6f9f2 -- src` touches three files:
- `src/elements/montage/BoardView.ts`: cell keydown guards; Enter/Space now dispatch `cell.click()`.
- `src/framework/kit/StaminaBarPanel.ts`: the stamina bar's keyboard path calls `bar.click()`.
- `src/framework/kit/managedModal.ts`: a comment only.

None of them overlap SC-588's files (`comm` of the two changed-file lists is empty). Neither changes the Reset encounter path:
- The Reset encounter item is a real `<button>` chrome item, whose Enter already produces a native click.
- `ResetEncounterModal` is untouched.
- The `managedModal.ts` change is comment-only.

The initiative tracker's stamina bars are rendered with `keyboard: false` (`view.ts:1231`, SC-498), so SC-597's keyboard click path never runs inside the tracker. Expected effect on SC-588: none. The rebase needs only the battery re-run, with part 5 now including G-S87.

## Branch state
- Start and end:
  - dse `git status --porcelain` is empty; HEAD `d62803db`.
  - Superproject porcelain is ` M draw-steel-elements` (the unstaged pointer, as the implementer left it); HEAD `9dd7cbf8`.
  - The superproject is 7 commits behind `origin/main` (merge-base `3eb1adbd`). On main, SC-592's CHANGELOG bullet sits after SC-595's, and this branch adds its bullet at the top of `## Unreleased`. Expect a trivial merge or no conflict at land.
- All probes ran in a scratch copy (`…/sc588-r2-review/dse-copy`, with `node_modules` symlinked). The worktree's ignored `main.js`/`styles.css` were rebuilt by the gates, as the protocol expects.

## Artifacts
Scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc588-r2-review/`
- Gate logs: `r2-tsc.log`, `r2-lint.log`, `r2-jest-full.log`, `r2-e2e-full.log`, `r2-life-p1.log` … `r2-life-p5.log`.
- Vacuity: `r2-jest-red.log`, `r2-jest-green.log`, `r2-e2e-red.log`.
- Probes: `dse-copy/e2e/specs/zzprobe/focus-probe.e2e.ts` and `dse-copy/e2e/specs/zzprobe2/lp-probe.e2e.ts`, with fixtures `dse-copy/e2e/vaults/shipped/Initiative/zz-pin.md` and `zz-hover.md`.
- Probe results: `probe-results.jsonl` (HEAD; ZZ-P01..P15, logged in `r2-probe-head.log`), `probe2-head.jsonl` and `probe2-base.jsonl` (ZZ-Q01..Q03; `r2-probe2-head.log`, `r2-probe2-base.log`).
- The ZZ-P05/P06/P07/P13/P14/P15 ✖ marks are the driver's edited-fence invariant (the probes drive blocks through raw CSS scopes) or a no-op Reset turns that wrote nothing. Every recorded step ran first.
