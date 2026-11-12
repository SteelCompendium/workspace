# SC-589 r2 review report (independent reviewer, identity B)

**Executive summary**
- Verdict: **FIX (CHANGELOG wording only), or LAND if you rule the Live Preview gap a separate ticket.** This is the same shape as SC-588's MEDIUM-1. The Reading-view fix is correct and scoped to its own view. I proved it red on base and green on HEAD in jsdom, and green in real Obsidian on every path in the ruling. I found no code defect in the diff.
- Findings: HIGH 0 · MEDIUM 1 · LOW 2 · INFO 4.
- MEDIUM-1: in **Live Preview**, Advance round (and the + stepper) still empties both boxes. The draft comes back at once, then the tracker's own write about 0.4 s later redraws the widget with a new view, and the draft is gone. Both CHANGELOG entries claim the fix with no mode limit.
- Gates (mine, dse HEAD `d12e4675`): tsc rc 0 · lint rc 0 · jest `7323 passed / 2 skipped` (263 suites + 1 skipped), rc 0 · lifecycle 21+16+9+4+6 = **56/56** · e2e `271/275 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` (SC-257, SC-384, SC-580, SC-355), rc 0 · `styles.css` sha256 `5e5ff488…2b27` is the same for a HEAD build and a base-src build, so shots, freeze and parity carry over.
- Red on base: HEAD's matrix file against `e0e49d4d`'s `src/` gives `11 failed, 157 passed`: M10, Q01, Q02, Q03 x2, Q04, Q07, Q08, Q11, Q12, Q13. This matches the implementer's claim.
- `origin/develop` is still `e0e49d4d` (fetched). The worktree is as I found it: the plugin is clean, and the superproject shows only ` M draw-steel-elements`.

## Findings

### MEDIUM-1: Live Preview still loses the draft on Advance round and on the stepper

- **Where:** the fix keeps the draft on the view instance (`src/elements/initiative/view.ts:145`, captured in `update()` at :159-163, restored at :694-705). In Live Preview the tracker's own debounced write redraws the CodeMirror widget, which builds a **new** `InitiativeView`. The host's Live Preview write path has no adoption, so the new view starts with an empty draft. The loss is not caused by this diff; the diff simply does not cover the Live Preview case.
- **Scenario (real Obsidian 1.14.4, probes PRB589-09 and PRB589-11, `probe-obs.jsonl`):**
  1. Open `Initiative/tracker.md` in Live Preview.
  2. Type `2` and `Feytouched`, then click Advance round.
  3. Read straight after the click: `amount "2", label "Feytouched", Round 2`.
  4. Read after the write plus 1.5 s: `amount "", label ""`. The root and view identity are both new (`sameRoot: false, sameViews: [false]`).
  5. The + stepper does the same: `3 / Stepper` shows at once, then `"" / ""` after the write. In Reading view the stepper and every rebuild path keep the draft (PRB589-01).
- **Why it matters:** the ticket's exact symptom still reproduces in Live Preview. Both CHANGELOG entries say "They now keep what you typed" with no mode limit: dse `CHANGELOG.md:25-29` and superproject `CHANGELOG.md:11-15`. SC-588's entries say "in Reading view" for the same reason. Every new test (jest Q*, e2e INIT-M10) runs in Reading view, so nothing catches this.
- **Prescribed fix, owner's call:**
  - (a) Recommended, matching the SC-588 precedent: qualify both CHANGELOG entries to Reading view and add one sentence, for example "In Live Preview the boxes are still emptied when the note saves a moment later (SC-602)". SC-602 already covers "an element's own write redraws its Live Preview widget"; extend its scope to cover view state such as this draft, or file a sibling ticket.
  - (b) Carry the draft across the redraw instead. Arm a one-shot draft hand-off keyed by block in `rebuildAndPersist` and the stepper's `persist()`, shaped like `armChromeFocus` / `claimChromeFocus` (`src/framework/chrome/focusHandoff.ts:92`, `:222`). The next `InitiativeView` mounted for that blockKey in the same leaf claims it inside the claim window. Key it to the leaf as well as the blockKey: two panes of one note share a blockKey, and the ruling forbids cross-talk. This is more work and touches the generic Live Preview write path, so I do not recommend widening SC-589 for it.

### LOW-1: sidebar refresh keeps the draft but drops focus and caret

- **Where:** `src/framework/sidebar/SidebarPanel.ts:321` calls `previous.update(model)` on an outside change. `InitiativeView.update()` (`view.ts:159`) captures the draft, but only `rebuildAndPersist` (:238-241) and `rebuildFromWrittenReset` (:297) capture and restore focus.
- **Scenario (PRB589-07):**
  1. Pin the tracker to the sidebar.
  2. Focus the sidebar label box with selection 2-5 backward.
  3. Make an outside write (`vault.process`, value 3 to 8).
  4. Result: the same root, the draft `2 / Sidebar` is kept, but `document.activeElement` is `<body>` and the caret is lost.
  5. The same happens when the main pane's tracker writes while focus is in the sidebar box.
- **Why it matters:** ruling 3 says that when focus was in a quick-add box at the rebuild, focus and caret come back. That ruling assumes "SC-588's focus restore already returns focus there", which is not true on this path. A user typing in the sidebar box when Sync or the other pane's debounced write lands loses focus in the middle of a word.
- **Prescribed fix:** in the `update()` override, wrap `super.update(model)` with `captureControlFocus(this.rootEl, FOCUS_FAMILIES)` before it and `restoreControlFocus(...)` after it, but only when `model !== this.model` (the outside path). The restore is a no-op when focus is elsewhere, so SC-588's "never pull focus" rule holds. Alternatively, file it with SC-602 or SC-603 as an SC-588-family gap. Rare, so a follow-up ticket is acceptable.

### LOW-2: selection direction is not restored in real Chromium, while jest Q12 pins it

- **Where:** `view.ts:699` calls `setSelectionRange(start, end, direction)` at build time, on an input that does not have focus yet. SC-588's `focusControl` then focuses it.
- **Scenario (PRB589-05):**
  1. In real Obsidian, label selection is `[2, 5, 'backward']`; trigger an in-view rebuild while focus stays in the box.
  2. Result: `[2, 5, 'forward']`. Start and end survive, and typing replaces the selection correctly ("FeXuched").
  3. jsdom keeps 'backward', so `test/dom/elements/initiative-matrix.test.ts:1273` (Q12) pins a result the real browser does not produce.
- **Impact:** Shift+Arrow extends the selection from the wrong end. Cosmetic.
- **Prescribed fix:** after `restoreControlFocus` in `rebuildAndPersist`, re-apply the caret when the focused element is the matching box. Or drop `direction` from the Q12 assertion and the claim. Either is acceptable.

### INFO

- **INFO-1 (within ruling): a new view loses the draft.** In each of these cases the view is replaced, so the draft and focus are lost:
  - an outside write in Reading view (PRB589-06: `sameRoot: false`, boxes empty, focus `<body>`);
  - a write from pane A seen in pane B (PRB589-04: `sameViews [true, false]`, pane B's `4 / PaneB` lost);
  - a write from a hover preview seen in the main view (PRB589-04, main draft `6 / Main` lost).

  The ruling says a remount need not keep the draft. Nothing was corrupted, and the note never held a draft. This is the same as base.
- **INFO-2: Q07's title is wider than the code.** The title at `initiative-matrix.test.ts:1212` says "the sidebar / a note change calls update()". Only the sidebar does; a note change in Reading view remounts (INFO-1). Optional rewording.
- **INFO-3: the dse-verify CURRENT entry needs a bump at land.** It still reads e2e `270/274`; HEAD is `271/275` (+INIT-M10). The land step owns this.
- **INFO-4: my lifecycle parts overlapped in time.** The tool moved each foreground call to the background after 180 s, so parts 1-5 overlapped. All five were green regardless, with loadavg 1-13 at their starts.

## Probe results per brief §2

Real Obsidian 1.14.4. Probe spec `zz-sc589-r2-probe.e2e.ts`, put into `e2e/specs/initiative/` only while it ran and deleted afterwards; observations are in `probe-obs.jsonl`.

1. **Rebuild paths (PRB589-01, `captain.md`, Reading view).** The draft `2 / Feytouched` survives every path in the ruling:
   - Advance round, Relieve captain, Make captain, Reset turns;
   - the - and + stepper;
   - the Malice log toggled twice;
   - the element's chrome Collapse then Expand;
   - Reset encounter, then Yes.

   After each one: hint `""`, no `aria-invalid`, normal placeholders, and the label is not in the note. Outside write: see INFO-1 (Reading view, lost) and LOW-1 (sidebar, kept). Live Preview: see MEDIUM-1.
2. **Add clears the draft, and invalid amounts round-trip (PRB589-01, PRB589-02).**
   - Add commits `{round 1, amount 2, label Feytouched}` and empties both boxes. The next Advance keeps them empty: nothing is resurrected.
   - Each amount is restored exactly as typed, and Add then behaves as on base:

     | Typed | Restored | Add result |
     |---|---|---|
     | `-3` | `-3` | commits; Malice 3→0, log -3 |
     | `0` | `0` | "Not zero" |
     | `1.5` | `1.5` | "Whole numbers only" |
     | `` (empty) | `` | "Amount required" |
     | `1e2` | `1e2` | "Whole numbers only" |
     | `abc` | `` (the number input refuses the letters, as on base) | "Amount required" |
     | `007` | `007` | commits +7 |
3. **No cross-talk, and a remount starts clean (PRB589-03, PRB589-04, PRB589-08).**
   - Two trackers in one note: a draft in t0 survives a write in t1, and t1's draft survives a write in t0.
   - Two panes: pane A's draft survives its own Advance, and pane B stays empty.
   - Hover preview: the popover's draft survives the popover's own Advance.
   - Remount (close and reopen the note): the boxes are empty.
   - In all of these the note never contained a draft. The other-pane and hover cases lose the draft only when the view is replaced (INFO-1).
4. **Focus and caret (PRB589-05, PRB589-10).**
   - Label focused, then an in-view rebuild: focus comes back with the selection start and end, but not the direction (LOW-2).
   - Amount box focused: focus comes back with the caret at the end, so typing `3` after `12` gives `123`.
   - Focus on an outside `<input>`, then Advance by script: focus stays outside the tracker (the SC-588 rule).
   - Keyboard Enter on Advance round in Reading view: the draft is kept, and focus is on the rebuilt Advance button.
5. **The note never held the draft.** I checked the note text after every step of every probe; none contained the label.
6. **Tests.**
   - The new jest cases fail on base and pass on HEAD (see the summary).
   - The `[M10]` marker is now a plain `test` in the `[M]` group.
   - The `known bugs` section and its comment were removed: no marker is left in it.
   - The e2e title `[INIT-M10] a half-typed quick-add survives …` has no bracketed ticket id.
   - I did not rerun e2e red-on-base myself; the implementer's `e2e-RED-on-base.log` shows `Expected: "2" Received: ""`.
7. **Real Obsidian.** I ran the full e2e and all five lifecycle parts myself (see the summary).

## Artifacts

All in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc589-r2-review/`:
- gate logs: `r2-tsc.log`, `r2-lint.log`, `r2-jest-full.log`, `r2-jest-matrix-on-base.log`, `r2-e2e.log`, `r2-lc-1.log` … `r2-lc-5.log`, `r2-basebuild.log`;
- probes: `zz-sc589-r2-probe.e2e.ts`, `probe-obs.jsonl`, `probe-obs-run2.jsonl`, `r2-probe.log`;
- the base-src scratch copy: `basecopy/`.
