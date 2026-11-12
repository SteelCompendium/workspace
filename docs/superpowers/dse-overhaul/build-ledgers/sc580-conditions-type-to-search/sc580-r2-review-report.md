# SC-580 r2 independent review — report

**Executive summary**
- **Verdict: LAND.** 0 HIGH, 0 MED, 2 LOW (both non-blocking; follow-up candidates, not fix-round material), 5 INFO.
- Reviewed plugin `sc580-conditions-type-to-search` @ `7a88aa1d` (base `3ad68185`; `origin/develop` still `3ad68185`, no drift), superproject @ `b51ddd17`.
- Gates (all re-run here): tsc/lint clean (rc 0/0) · jest **10698 passed / 1 skipped** (shots cache present; = 10697/2 fresh, +21 over base) · lifecycle **59/59** (21+16+9+4+7+2) · e2e **`282/285 ok, 0 failed, 3 known-bug, coverage: 172/172 pairs`** · shots **592**, host-leak **163 / 978**, modal host-leak **39 / 234**, capture clip **147** · freeze **280/280** · parity **0 gaps / 0 undeclared / 24 declared**.
- Real Obsidian probes (throwaway spec, removed): fast `dazed` typed 5/5 correct; Space/Enter on buttons, Tab/Shift+Tab, arrows, Escape (SC-431), Ctrl/Meta chords, text fields, a stacked modal, close/reopen: all behave. No lost or doubled character in any run.
- Mutation: 13 jest mutants, all 13 killed. e2e mutants: no-preventDefault killed (real Obsidian doubles the char: `ddaz`), no-focus and no-input-dispatch killed by COND-N10, no-text-entry-guard survives e2e (killed by jest).
- Owner's question: a letter on a focused duration/effect chip opening the Add search is **acceptable, not a defect**. See LOW-2.

## What was checked and how

- Read the diff `3ad68185..7a88aa1d` (5 files) and the CHANGELOG commit `b51ddd17`.
- Probe spec (kept as `sc580-r2-probe-spec.e2e.ts.txt`, run with `--only`, then removed) against real Obsidian 1.14.4. Logs: `sc580-r2-probe-e2e.log`.
- Jest mutants run on `test/dom/views/conditions-modal*` (386 tests). e2e mutants run on COND-N07..N10. Each mutant restored with `git checkout`. Log: `sc580-r2-mutants.log`.
- Worktree checked clean before and after (`git status --porcelain` empty in the plugin and the superproject; HEADs unchanged at `7a88aa1d` / `b51ddd17`).

## Findings

### LOW-1: after a click on the window's title or blank space, typing does nothing
- `src/views/ConditionsModal.ts:215`: the listener sits on `modalEl`, so it sees only keys whose target is inside the dialog.
- Scenario (measured, probe RVW-P08): open the window and click the "Conditions" title (or any non-focusable blank area). Obsidian moves focus to `<body>`. Typing `d` then does nothing: no search opens and no error is raised. The docs say "or just start typing", and the user is visibly in the window.
- Not a regression: the base did nothing in every case. It is within the brief's spec ("a keydown that originates inside this modal"). Nothing is lost or written.
- Fix if wanted (a follow-up, not this round): also register a `keydown` on the modal's document (`activeDocument`, through `this.lifecycle`). That listener routes only when `evt.target` is `doc.body` or `doc.documentElement` **and** this modal's `containerEl` is the last `.modal-container` in that document, so a stacked modal still keeps its keys. Alternatively, tighten the docs to "with a button in the window focused, just start typing".

### LOW-2: a letter on an editor chip opens the Add search, and Escape does not return focus to the chip (the owner's question)
- `src/views/ConditionsModal.ts:576` (the only exclusion is text-entry controls) and `:597` (`closeAdd` refocuses "+ Add condition").
- Measured (RVW-P02, RVW-P10): with focus on a Duration chip, `d` opens the search with `d`, and the editor stays open. Escape closes the dropdown, but focus goes to "+ Add condition", not back to the chip. The same happens on an icon choice in the icon picker, where the icon search box sits right above.
- Space on the same chip does not open the search, and Space and Enter on the row cog still toggle the editor. So the chip keeps every key it actually uses.
- **Judgment: acceptable, not a defect.**
  - A button uses no printable key other than Space, and Space is excluded. Nothing is taken from the chip.
  - No write happens. The routed letter is shown in an open, labelled search, and one Escape backs out.
  - This matches the ruled spec ("target is not a text-entry control") and the docs.
  - Excluding the editor would be a design change: the window would need a second meaning for typing ("search icons" inside the icon picker).
- The real cost is small: a keyboard user who presses a letter by mistake loses their place in the editor after Escape. That cost is a focus-restoration nicety.
- Optional follow-up: remember `evt.target` when `typeToSearch` opens the search. If the dropdown is closed by Escape before any pick, refocus that element when it is still connected. An icon-picker-specific routing to `cond.icon-search` belongs to a separate ticket, if Scott wants one.

### INFO-1: AltGr / macOS Option characters are not routed
- `src/views/ConditionsModal.ts:573`: `altKey` (and AltGr's ctrl+alt) bails out. Examples: Polish AltGr letters, Mac Option characters.
- The catalogue is English, so this has no practical effect. It is consistent with the spec ("no Ctrl / Meta / Alt"). A plain `é` (non-AltGr) does route (RVW-P06).

### INFO-2: no e2e test kills a missing text-entry guard
- Mutant M2 (the `closest('input, textarea, select, [contenteditable]…')` guard deleted) passes COND-N07..N10 in real Obsidian.
- Typing into the Add input re-routes to the same input with the same result. The icon search is not driven by these specs.
- Jest kills M2 (2 failures: the icon-search test and the textarea test). No action needed.

### INFO-3: hover-preview and sidebar openers not probed in real Obsidian
- Both open the same `ConditionsModal`, and the listener is on the modal's own element, so the code path is identical.
- The SC-595 re-push keeps the modal's keymap scope on top, and that scope registers only Escape. A popover scope therefore cannot swallow a letter.
- The ds-conditions panel (`elements/conditions/panel.ts:171`) has no e2e fixture.
- This is reasoned, not measured.

### INFO-4: Obsidian hotkeys are inert while the window is open (base behaviour)
- Ctrl+P and Ctrl+Z from the focused "+ Add condition" do nothing (RVW-P07). Obsidian suspends app hotkeys under a modal.
- The handler's modifier guard returns before `preventDefault`, so it is not the cause. COND-N09's "chord does not open the search" therefore proves the guard, not "the hotkey still works". That is fine.
- The CHANGELOG line "shortcuts held with Ctrl, Cmd or Alt … keep working as before" is accurate in that sense.

### INFO-5: the brief's "duration picker select" does not exist
- Duration is a chip group of `<button>`s (`renderDurationChips`). There is no `<select>` in this window. The `select` guard is generic and jest-tested.
- The real `<input type=color>` keeps its keys (RVW-P10).

## Probe results (real Obsidian 1.14.4, `sc580-r2-probe-e2e.log`)

| Probe | Result |
|---|---|
| P01e: sequential CDP `dazed` (~5 ms per event, 53-64 ms total), 5 trials | 5/5 `dazed`, menu `[Dazed, Add custom: "dazed"]` |
| P01/P01b/P01c: concurrent CDP sends | Chars arrive reordered (`azedd`); the control P01b (search opened by click first) reorders the same way. A tool artifact (concurrent WebDriver HTTP), not a product issue. No char is ever lost or doubled. Trace: the routed key's handler focuses the input with caret 1 inside the same keydown; the next keydown targets `cond.input`. |
| P01d: caret timing | First poll after the key: focus `cond.input`, `selectionStart` 1, value `d` (synchronous, no async window) |
| P02: Space/Enter on cog; Space then letter on a Duration chip | Cog toggles the editor, no search. Space on the chip: no search. Letter: search `d`. Escape: focus to `cond.add`, editor stays open. |
| P03: Escape twice after a typed open | 1st closes the dropdown only (focus `cond.add`); 2nd closes the window (SC-431 unchanged) |
| P04: command palette above; a real Obsidian `Modal` with a focused button above | Palette input gets `daz`, no leak. Stacked button + `q`: no leak (0 inputs). After the stacked modal closes, `w` routes normally. |
| P05: close/reopen ×4 with a key after each close | No modal and no error after close. Reopen + `g` gives exactly `g`. |
| P06: Shift+d, `7`, Shift+/, `-`, `é` | `D`, `7`, `?`, `-`, `é`; no throw |
| P07: Ctrl+Z, Tab, Shift+Tab, arrows, Ctrl+P | No search. Tab goes to Done, Shift+Tab back. Ctrl+P is inert (INFO-4). |
| P08: click on the title, then a letter | Focus goes to `BODY`; the letter does nothing (LOW-1) |
| P09: Live Preview, `daz` | `daz`, no write |
| P10: colour input / icon search / icon choice | The first two keep their keys (icon search reads `fla`); an icon choice + `s` opens the Add search (LOW-2) |

## Mutation results (`sc580-r2-mutants.log`)

Jest (`test/dom/views/conditions-modal*`, 386 tests), all killed:

| Mutant | Failures |
|---|---|
| M1 handler deleted | 7 |
| M2 no text-entry guard | 2 |
| M3 no modifier guard | 3 |
| M4 no space guard | 1 |
| M5 no IME guard | 1 |
| M6 no `defaultPrevented` guard | 1 |
| M7 listener on `document` | 8 |
| M8 listener outside `lifecycle` | 1 |
| M9 no `preventDefault` | 3 |
| M10 no `input` dispatch | 3 |
| M11 `=` instead of `+=` | 1 |
| M12 no `focus()` | 1 |
| M13 any `key.length` | 5 |

e2e (COND-N07..N10, real Obsidian):

| Mutant | Result |
|---|---|
| M9 no `preventDefault` | N07 fails (`ddaz`), N10 fails (`dazz`): killed |
| M10 no `input` dispatch | N10 fails: killed |
| M12 no `focus()` | N10 fails: killed |
| M2 no text-entry guard | survives (INFO-2) |

The implementer's base-source run (N07/N10 red) and its no-modifier/no-space run (N08/N09 red) stand. The handler-deleted case is covered by the base run.

## Hygiene

- Scenario ids: COND-N07, N08, N09 and N10 each appear once in `e2e/specs` (`cond-integrity.e2e.ts:97,112,120,131`). No bracketed ticket id in any test title; the describe title carries an unbracketed `(SC-580)`.
- Manifest: `cond.add` gains `press:Space` with inventory `N08`. The coverage gate reports 172/172.
- Docs: `docs/initiative-tracker.md:440` "(or just start typing a condition's name)". CHANGELOG Unreleased bullet is accurate.

## Artifacts (all in this directory)

- Gate logs: `sc580-r2-gate-{tsc,lint,jest,e2e,shots,freeze,parity}.log`, `sc580-r2-gate-lifecycle-part{1..6}.log`
- Probes: `sc580-r2-probe-spec.e2e.ts.txt` (the throwaway spec, not in the worktree) and `sc580-r2-probe-e2e.log`
- Mutants: `sc580-r2-mutants.log`
