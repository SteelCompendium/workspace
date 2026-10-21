# SC-422 r2 — independent review of r1 (dse 487b444 on ab34293; superproject c44b5b2 on b21e48b)

## Executive summary
- **Verdict: LAND-READY.** Findings: 0 BLOCKER, 0 HIGH, 0 MEDIUM, 2 LOW, 4 INFO. None blocks landing.
- Battery re-run by me at 487b444: tsc (incl. e2e) + lint clean · jest **5278 / 1 skipped / 231 of 232** · lifecycle **27/27** · e2e **83/87 ok, 0 failed, 4 known-bug, 57/57** · shots **572**, rc 0, `text scale OK (1626 …)`, `text scale once OK (103821 / 204 loads)`, pressed toggle parity OK (96) · freeze **276/276** · parity **0 / 0 / 24**. These match r1's numbers exactly. Compared with base ab34293: jest +16 tests and +1 suite; every other gate is unchanged.
- Real Obsidian 1.14.4 probe (my own script, head bundle vs base bundle): **0 problems**. Every chrome text scales by exactly 1 or exactly the knob value at Small, Large and Control 0.8 and 1.2. That includes nested element roots: 674 comparisons over 6 surfaces, 2 of them popouts. At default prefs, every measured size is identical between base and head (O4).
- Lifetimes: the search modal holds 11 subscriptions while open and goes back to the baseline after every close path (12 cycles of Escape, backdrop click and choosing a row). A closed modal is never written again. Reopening after a pref change shows the current value. A pref change while the modal is open updates the chip live (12 → 14.4px). The sidebar and the settings window open and close 4× each and always go back to the baseline.
- Popouts: the sidebar opened in a popout and the search modal invoked from a popout note are both stamped inside the popout's own document, and both scale correctly.
- Non-vacuity, my own mutations in scratch copies:
  - Stamp dropped, class kept: the gate fails with 186 `surface:` lines, and 9 jsdom tests fail.
  - Nested same-knob consumer inside the sidebar chrome root: the `text scale once` gate fails with x1.44.
  - Selector member removed: 2 unit tests fail.
  - Owner never unloaded, or wrong owner: 3 tests fail.
- The worktree was never mutated: dse is at 487b444 and clean, and the superproject is at c44b5b2 with only the expected unstaged ` M draw-steel-elements`. One environment incident is reported under §6; it does not affect this branch.

## 1. Findings

### LOW-1 — the committed gates never exercise the production `modalEl` branch of the search-modal stamp
- `src/authoring/CompendiumSearchModal.ts:102` stamps `this.modalEl ?? this.containerEl`. The jsdom mock `SuggestModal` (`test/mocks/obsidian-core.ts:628-693`) has no `modalEl`, and the harness mounts that same mock (`visual-harness/chromeSurfaces.ts:56-61`). So in jsdom, and in the browser `text scale OK` gate, the stamp lands on `.modal-container` through the fallback.
- In real Obsidian it lands on `.prompt` (modalEl). r1's evidence and my probe confirm this: the class is `prompt dse-fs-root`. No committed test asserts it.
- Failure scenario: the mock and the real host diverge. For example, a future change roots the rows somewhere the mock does not model. Both committed gates would stay green while real Obsidian regressed. Today the code is right. The regex in scaleTokenScope and the "rows inside root" test pin the current shape well enough against ordinary refactors.
- Fix (cheap, optional before landing): give the mock `SuggestModal` a `modalEl` (class `prompt`) that holds `inputEl` and `resultContainerEl`, as the real host does, so jsdom and the harness take the production branch. Or add one e2e/lifecycle assertion that `.prompt` carries `dse-fs-root` and that the chips scale at Small 1.2 in real Obsidian.

### LOW-2 — the r1 report's non-vacuity count does not match its saved log
- The r1 report says "116 `surface:` lines, 30 not stamped". The saved `sc422-nonvacuity-gate-failure.log` has 48 lines: 46 `surface:` lines, 30 of them "not stamped".
- My independent mutation keeps the class and drops only `reflectCss`. It gives 186 `surface:` lines, because the synthetic token rows still find a root.
- The substance holds: the gate fails loudly in both cases. Fix: correct the number in the ledger/report, or attach the full log. Documentation only.

### INFO-1 — evidence captions name 7817133 as "before"
The composites are labelled "BEFORE (develop 7817133)", and the after images were shot on b6b08f3. The report base is ab34293. I checked `git diff 7817133..ab34293`: it touches none of the four surfaces' TS or CSS, only `sidebar/anchor.ts` and `registration.ts`. My real-Obsidian base(ab34293)-vs-head probe also reproduces the same px. **The evidence is valid.** Each image shows what its caption says:
- Search modal: chips and code line are larger at Small 120%; result names are unchanged.
- Settings: the caption and hint are larger.
- Sidebar header: "Counter / pinned" is larger.
- Sidebar empty: the message is larger and the title is unchanged.
- At default size, before and after look identical in all four.

If Scott is shown the images, consider re-labelling the base sha. No re-shoot is needed.

### INFO-2 — `reflectCss` stamps all 11 css-bearing prefs on chrome roots, not just the 3 knobs
The 11 are 6 font slots, `--dse-text-scale`, `--dse-card-scale`, and the 3 scale knobs. I measured 11 subscriptions per chrome root. Today these are inert on chrome:
- No chrome rule reads `--dse-font-*`, `--dse-text-scale` or `--dse-card-scale`.
- The `font-size: calc(1em * var(--dse-text-scale))` rule and the zoom rule target only `[data-dse-element]` / `.dse-modal` descendants.

Future note: if a chrome rule ever reads `var(--dse-font-label)`, that surface would silently start following the font picker. That is arguably correct, but nobody decided it. No action needed. A one-line comment in `textScaleRoot.ts` would make it explicit.

### INFO-3 — design note for Scott's O1 confirmation: hierarchy at Small 120%
Chrome titles keep Obsidian's own sizes, so they do not follow Large. At Small 1.2:
- The search-modal code line (15.3px) slightly exceeds the result name (15px).
- The sidebar empty message (15.3px) slightly exceeds its bold title (15px).

The same relation already exists inside element roots (label 0.85em × 1.2 > body), so this is consistent with the knob's contract. Mention it only if Scott reviews the images closely.

### INFO-4 — pre-existing pattern, not introduced here
`DseSidebarView.onOpen` (`src/framework/sidebar/DseSidebarView.ts:94`) creates the container unconditionally. If `ensurePanelsEl()` had already run, a second `.dse-sidebar` would exist. Both containers would be stamped, but both are owned by the view, so nothing leaks past the view's unload. No caller does this today.

## 2. Probe results (real Obsidian 1.14.4, private Xvfb :250, CDP 9293/9294)
Script and raw output are under `sc422-r2-review-evidence/` (`sc422r2-probe.mjs`, `sc422r2-probe-{head,base}.{json,log}`).

**Exactly-once (O5).** Each comparison checks every element with its own visible text under the chrome root, nested element roots included, at all 6 knob settings. Each ratio must be 1 or the knob value.

| Surface (head) | texts | comparisons | x1 | x knob | problems |
|---|---|---|---|---|---|
| search modal (`.prompt.dse-fs-root`) | 12 | 84 | 66 | 18 | 0 |
| sidebar empty | 2 | 14 | 12 | 2 | 0 |
| sidebar + pinned counter (nested element root) | 3 | 21 | 17 | 4 | 0 |
| POPOUT sidebar + pinned counter | 3 | 21 | 17 | 4 | 0 |
| POPOUT search modal (rendered in the popout document) | 12 | 84 | 66 | 18 | 0 |
| settings preview (separate Settings window; nested sample root) | 75 | 450 | 338 | 112 | 0 |

On base, the same sweep moves 0 chrome texts; the settings preview moves 108 instead of 112, the difference being the caption and hint. Chrome texts that move on head:
- Search modal: `__type`, `__source`, `__code`.
- Sidebar: `__empty-message`, `__panel-label`, `__panel-note`.
- Settings preview: the caption span and `__label-hint`.

All of them move under Small only, by exactly 0.8 or 1.2. No chrome text moves under Large or Control, consistent with r1's finding that no Control-sized text exists on these surfaces.

**Defaults (O4).** Base-vs-head default snapshots have 0 size differences on every surface listed above. That is on top of freeze 276/276.

**Lifetimes.**
- Baseline 1 subscription. With the modal open there are 12 (that is +11).
- 12 open/close cycles via Escape, backdrop click and Enter-choose all returned to 1.
- After Escape, setting 0.8 left the detached modalEl stamp at "1.2", so the subscription was released.
- Reopening gave chip 9.6px with stamp "0.8".
- Live update while open: chip 12 → 14.4px.
- Sidebar: 4 open/detach cycles, 12 open / 1 closed each time.
- Settings window: 4 open/close cycles, 45 open / 1 closed each time.
- Popouts: back to 1 after detaching them.

**Popouts (probe 6).** The stamp is applied to the element itself, so it travels with it. Obsidian copies the plugin sheet into popouts: the popout document contains the `.dse-fs-root` rule, and both popout surfaces scale.

## 3. Harness fidelity
`visual-harness/chromeSurfaces.ts` mounts the real production classes and functions: `CompendiumSearchModal` (open/getSuggestions/renderSuggestion), `mountSettingsPreview`, and `DseSidebarView` (load + onOpen + addPanel with a real ds-counter). The Obsidian base classes are the jsdom mocks. The one material divergence is `modalEl` (LOW-1). The settings tab's `renderPreview` owner wiring is covered by jsdom (`settings-preview.test.ts`) and by my real-Obsidian settings cycles.

## 4. Survey completeness
I enumerated every declaration in `styles-source.css` (comments stripped) whose value reads `var(--dse-fs-<role>)`: 185 consumers. I then filtered out blocks that render only inside element roots or DseModals. The only remaining consumers are:
- `.dse-ref-notice__hint`, which RefUnwrapView renders inside an element root.
- `[data-dse-readonly]::after`, which is set on element roots only.
- `th` / `&::before`, which are nested inside `.dse-mt`.
- The four SC-422 surfaces.

Other checks:
- No TS sets `--dse-fs-*` inline.
- Notices (undoNotice etc.) and the EditorSuggests use no role.
- The sidebar stale-panel error card (`SidebarPanel.ts:360`, outside an element root) uses no role.
- Control-sized rules are all scoped to `:is([data-dse-element], .dse-modal)`.

**r1 missed nothing.**

## 5. Non-vacuity (all in scratch copies made with `git archive 487b444`; the worktree was never edited)
- **M1:** `stampTextScaleRoot` keeps the class but drops `prefs?.reflectCss(...)`.
  - Full `npm run shots`: rc=1, `TEXT SCALE BROKEN`, 186 `surface:` lines (30 "not stamped", plus size and synthetic-token mismatches on all 5 surfaces).
  - jsdom: 9 failures, across all four new suites plus the scaleTokenScope stampers test.
- **M3:** `.dse-sidebar__panel-label` was given `font-size: var(--dse-fs-label)`, making it a nested same-knob consumer under the header. `text scale OK` still passes, but `TEXT SCALE COMPOUNDS … div.dse-sidebar__panel-header > span.dse-sidebar__panel-label x1.44 (surface:sidebar)` fails the run, rc=1. **This proves the once-sweep really covers chrome roots (O5).**
- **M2:** `.dse-fs-root` was removed from the token rule selector. Two scaleTokenScope tests fail.
- **M4:** two owner mutations:
  - `prefsOwner.unload()` removed from `onClose`.
  - The sidebar given the plugin as owner instead of the view.

  Result: 3 failures (the modal release test, the sidebar release test, the stampers regex).

## 6. Environment incident (not a code finding — please relay)
The session scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-…/scratchpad/` is shared with concurrently running agents. I first wrote `gate.sh` there. Another agent (the SC-432 r1 reviewer) overwrote it at 12:58 with a script that `cd`s into `worktrees/sc432-free-recovery` and logs into its ledger dir.

As a result, my first `npm run e2e` invocation, at about 13:00, ran e2e in the **sc432** worktree. It wrote `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc432-free-recovery/sc432-r1-review-e2e.log` (13:03; 88/91 ok, 0 failed, 3 known-bug, 59/59). That may have clobbered the SC-432 reviewer's own e2e log. The run itself is a legitimate full e2e of their head, but they should know.

My lifecycle run was unaffected (port 9287, my worktree). All later gates ran from a private subdir `sc422-r2-aa81f6/` with a uniquely named script. Footgun worth adding to dse-verify: never use a generic script name at the shared scratchpad root.

## 7. Working-tree state
- dse worktree: `git status --porcelain` empty before and after; HEAD 487b444. Ignored build artifacts (main.js, styles.css, visual-harness/shots, dist, e2e/.out) were regenerated by the battery, as every battery does.
- Superproject worktree: HEAD c44b5b2. ` M draw-steel-elements` (the unstaged pointer bump) was there before and is still there.
- No leftover Obsidian or Xvfb processes from my probes. Each probe killed its own PIDs, and its temporary vault was removed.

## 8. Artifacts
- This report.
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc422-textscale-surfaces/sc422-r2-review-evidence/`:
  - the probe script and its head/base json and log
  - the mutA gate excerpt and the mutB gate excerpt
  - jest mutation summaries M1, M2 and M4
- Full gate logs (scratch): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc422-r2-aa81f6/logs/` (tsc, tsce2e, lint, jest, lifecycle, e2e, shots, freeze, parity, shots-mutA, shots-mutB, jest-M1/M2/M4, probe-head/base).

---

# r4 — scoped re-review of the r3 fix delta (dse 487b444..82ca38b)

**Summary (≤5 lines):** LAND-READY. 0 BLOCKER, 0 HIGH, 0 MEDIUM, 0 LOW, 1 INFO.
- jsdom and the shots harness now stamp the production `.modal.prompt` (modalEl). With the fallback mutated to throw, both stay green (it is never taken). With the modalEl branch removed, jsdom fails 4 tests.
- The −6 in `text scale once` comes entirely from the two search-modal pages: −3 each, from the empty Obsidian shell wrappers that are no longer inside the root. No row, chip, code line or hint is lost, so it is not a coverage loss.
- Measured at 82ca38b: jest 5278/1/231 of 232; shots 572, exit 0; text scale OK 1626; once OK 103815/204; freeze 276/276. Worktree clean at 82ca38b.

## The delta
Four files changed; production code changed only by a comment line (`textScaleRoot.ts:40`, the INFO-2 note).
- `test/mocks/obsidian-core.ts:680-700`: the mock `SuggestModal` now builds `modalEl` (`.modal.prompt`) inside `containerEl` and puts `inputEl` and `resultContainerEl` in it, the same structure as real Obsidian (r2's probe saw `.prompt` holding the rows).
- `test/dom/authoring/compendiumSearchModal.test.ts:270-293`:
  - `root = modal.modalEl`.
  - New asserts: the root has `prompt` and `dse-fs-root`, and `containerEl` does NOT have `dse-fs-root`.
  - The row is now created under `resultContainerEl` instead of being hand-appended to the root. That is stronger, because it tests the real placement.
- `visual-harness/chromeSurfaces.ts`: the re-parenting of `resultContainerEl` is gone; rows are rendered where the mock (now host-shaped) puts them.

Since production behaviour is unchanged, I skipped lifecycle and e2e as the brief allows.

## Probe 1 — do the gates take the `modalEl` branch? (scratch copies of 82ca38b; worktree untouched)

| Mutation (`CompendiumSearchModal.ts:102`) | jsdom (compendiumSearchModal + scaleTokenScope + e2eCensus, 124 tests) | full `npm run shots` |
|---|---|---|
| **F2:** fallback throws (`this.modalEl ?? (() => { throw … })()`) | only the source-text regex test fails (expected: it pins the exact line). **All behavioural tests pass, so the fallback is never taken.** | exit 0, `text scale OK (1626)`, `once OK (103815 / 204)`, identical to head, no "fallback taken" error. **The harness takes modalEl.** |
| **F1:** modalEl branch removed (`stampTextScaleRoot(this.containerEl, …)`) | **4 failures**: "carries all three knobs" (`containerEl` must not be the root), "rows sit inside the stamped root", "closing releases", and the regex | not run. By construction the harness cannot tell this apart: `.modal-container` contains `.prompt`, so the rows are still inside a stamped root. In real Obsidian that would also render correctly. jsdom is the gate that pins the branch, and that is sufficient. |

## Probe 2 — the −6 in `text scale once`
I instrumented scratch copies of `shoot.mjs` to log per-page `compared` counts. The patch is one `console.log` line, only in the scratch copies. Full runs: 487b444 gave 103821 and 82ca38b gave 103815, the same totals as the real runs.
- **Only two of 204 loads differ:**
  - `surface:search-modal`: 54 comparisons / 19 targets → 51 / 17
  - `surface:search-modal-empty`: 21 / 8 → 18 / 6

  Every other page is identical, including the other three chrome surfaces.
- Target diff on the search-modal pages (standalone run of the verbatim `sweepKnobs`, same viewport and DPR):
  - Before: the stamped root was `div.modal-container`, and the swept set included `div.modal-title` (empty) and `div.modal-content` (empty, since the input had moved to the root).
  - After: the root is `div.modal.prompt`. Those three nodes are no longer in the root; `.modal.prompt` joined it.
  - Net −1 counted element per page × 3 knobs = −3 per page; −6 in total.
- `.suggestion-item` rows inside the stamped root: before [true, true] / [true]; after [true, true] / [true]. Every DSE node that was swept before is still swept: `__type`, `__source`, `__code`, `__name`, `__hint` and the row wrappers.
- **Verdict: benign.** The lost targets are empty Obsidian shell wrappers that never carry a role. With the root moved to the real dialog box they also no longer exist in the swept set in production.

## Probe 3 — other users of the mock `SuggestModal`
- `CompendiumSearchModal` is the only `SuggestModal` subclass in src and tests, and `chromeSurfaces.ts` is the only harness user.
- The mock `Modal` base is unchanged, so DseModal subclasses are unaffected.
- The one older structural assertion still passes: `compendiumSearchModal.test.ts:162` checks that `containerEl` leaves the body on close, and `modalEl` lives inside `containerEl`.
- No test queried the input or the result list through `contentEl`.
- `e2eCensus` passes.
- No assertion was weakened. The two touched tests gained assertions.

## Probe 4 — gates re-run at 82ca38b (worktree)
- tsc (incl. e2e) and lint: clean.
- jest: 5278 passed / 1 skipped / 231 of 232. `main.js` and `styles.css` were removed first, per protocol.
- shots: 572 PNGs, exit 0, 0 FAIL, pressed toggle parity OK (96), `text scale OK (1626)`, `text scale once OK (103815 / 204 loads)`.
- freeze: `OK (276/276)`.

These match the implementer's reported numbers.

## INFO-r4-1
`compendiumSearchModal.test.ts:290`: the row is created with `createDiv` (an Obsidian augmentation that the mock environment provides), whereas real Obsidian's chooser creates the row itself. That is fine as-is. The harness still drives `renderSuggestion` by hand (`chromeSurfaces.ts:60-62`) because the mock has no chooser. No action needed.

## State
- dse worktree: `git status --porcelain` is empty and HEAD is 82ca38b. Ignored build artifacts were regenerated by jest and shots.
- Superproject: c44b5b2 with the pre-existing unstaged ` M draw-steel-elements`.
- No processes left running. All mutations and instrumentation lived in scratch copies (`sc422-r2-aa81f6/r4F1`, `r4F2`, `r4base`, `r4head`), which have not been deleted. I used no kills.

## r4 artifacts
All are in `sc422-r2-review-evidence/`:
- `sc422r4-sweep-per-page-487b444.txt` and `sc422r4-sweep-per-page-82ca38b.txt`: per-page sweep counts, 204 loads each.
- `sc422r4-chrome-targets-487b444.json` and `sc422r4-chrome-targets-82ca38b.json`: target diff.
- `sc422r4-jest-r4F1.txt` and `sc422r4-jest-r4F2.txt`.
- `sc422r4-shots-F2-fallback-throws.txt`.
- `sc422r4-sweep.mjs` and `sc422r4-count.mjs`: probe scripts.

Full logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc422-r2-aa81f6/logs/r4-*`.
