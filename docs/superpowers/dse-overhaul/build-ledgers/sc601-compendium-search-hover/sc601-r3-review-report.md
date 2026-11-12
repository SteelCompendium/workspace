# SC-601 r3: independent adversarial review of r2 (dse `ea849f11`, superproject `7199f0e6`)

## Executive summary

- **Verdict: FIX REQUIRED.** One MEDIUM, already folded into the next round by the owner. The fix and the refactor are otherwise sound. In real Obsidian 1.15.1 the search keeps the editing preview open in every hover trial I ran (Reading view and Live Preview hosts), and nothing leaks.
- **Counts:** HIGH 0 · MEDIUM 1 · LOW 1 · INFO 5.
- **MEDIUM-1:** the block command checks the editor once, before `await index.getEntity` / `await entity.model()` / `await entity.body()`. If the preview closes inside that window, the snapshot is still written into the dead buffer: no Notice, nothing on disk. Reproduced in jest and **in real Obsidian** (a page-side hook hides the preview inside `getEntity`: hook fired 1, no Notice, nothing written). The prescribed fix (re-check right before `replaceSelection`) is validated: jest 202/202, real Obsidian 2/2. The reference and Shift paths have no await between the check and the write.
- **LOW-1:** 4 of my 15 jest mutants survive the r2 suite: re-targeting `activeEditor`, `some()` instead of `every()`, a closed pane no longer refused, and the guard bound to the global `document` (popout). Each one is killed by a probe test I wrote, so add those tests.
- **Gates (measured on the branch):** jest **7713 passed / 1 skipped / 0 failed** (7714 total; r2 had 7712 / 2, same total, see §4). Lifecycle part 5 **7/7** (392 s). Part 6 **2/2** (153 s).
- **G-S97 on the base bundle (`5f7c5336`, my own build):** **15 broken expectations**, 6 of 8 trials red, both controls green (70 s). On the branch: 8/8 green.
- **Mutants:** r2's 14 re-run in my scratch: **14/14 killed**. Mine: **10 killed / 5 survived** of 15 (R7 and R15 are documented or equivalent; the other three are in LOW-1). Real-Obsidian mutants: R7 (`queueMicrotask` removal) and M3 (synchronous removal) are both **killed by G-S97 trial 3 only**.
- **Refactor:** behaviour-neutral. The helper matches the old inline code line by line. SC-595/597/598 jest and G-S83 / G-S87 / G-S91 are green.
- The branch worktree is unchanged (`git status --porcelain` before and after: ` M draw-steel-elements`, dse clean at `ea849f11`). The scratch worktree has been removed.

## 1. Findings

### MEDIUM-1: the block command can still write a snapshot into a closed preview (the r2 residual, owner follow-up (a))

- **Where:** `src/authoring/compendiumInsert.ts:363-372` (`dispatchBlockChoice`: the check at `:369`, then `await index.getEntity` at `:370`, then `insertFullBlock` at `:371`) and `:262-275` (`insertFullBlock`: `await entity.model()` at `:270`, `await entity.body()` at `:272`, `editor.replaceSelection` at `:273`).
- **The window:**
  - `getEntity` yields a microtask.
  - `entity.model()` on a model-cache miss calls `adapter.fromFile` → `vault.read`: real I/O spanning several tasks (`CompendiumIndex.ts:120-137`).
  - `entity.body()` is the same.
  - On a cache hit only microtasks remain.
- **Failure scenario:**
  1. The user picks a snapshot entry.
  2. Obsidian's `selectSuggestion` runs `this.close(); this.onChooseSuggestion(e, i)` (app.js 1.15.1, offset ~1208459), so the guard is removed one task after close.
  3. The preview is hidden while the vault read is in flight.
  4. The snapshot then goes into the detached CM buffer, silently: the exact SC-601 symptom.
- **Evidence:**
  - Jest (`r3Probe.test.ts`, "closed during index.getEntity" and "closed during entity.model()"): **2 failing on HEAD**. The snapshot is written (`editor.writes` length 1) and `Notice.notices` is `[]`.
  - Real Obsidian, trial "r3 block hidden inside getEntity (after the check)":
    - `compendiumIndex.getEntity` was wrapped page-side to call `(view.previewMode?.hoverPopover ?? view.hoverPopover).hide()` and then call through.
    - Result: `hook {fired: 1, hid: true}`, `landed {src: false, host: false}`, notices `[]`.
    - The run logged `no "closed" Notice []` (log `r3-lc-probe-head.log`).
- **Scope:** every other choice path has no await between the check and the write.
  - Reference block: `dispatchReferenceChoice` → `insertReferenceBlock`, synchronous.
  - Shift inline link: `insertInlineLink`, synchronous.
  - Ctrl copy: awaits the clipboard but never touches the editor.
  - `onChooseSuggestion` → `onChoose` is synchronous.
- **The prescribed fix (validated in scratch):** keep the early check (it gives a fast refusal with no vault read) and re-check after every await, right before the write.

  ```ts
  export async function insertFullBlock(
  	editor: Editor,
  	entity: CompendiumEntity,
  	isOpen: () => boolean = () => true,
  ): Promise<boolean> {
  	…
  	const body = dto === undefined ? (await entity.body()).trim() : stringifyYaml(dto).trimEnd();
  	if (!refuseClosedEditor(isOpen)) return false; // SC-601: the preview can close while the snapshot is resolved
  	editor.replaceSelection(wrapFence(alias, body) + '\n');
  	return true;
  }
  // dispatchBlockChoice
  	if (!refuseClosedEditor(isOpen)) return;
  	const entity = await index.getEntity(entry.scc);
  	if (entity) await insertFullBlock(editor, entity, isOpen);
  ```

  The full diff is `r3-prescribed-fix.diff`. With it applied:
  - Jest: the r2 suites plus my probe give **202/202**.
  - Real Obsidian: the hook trial is **2/2 green**: exactly one Notice `The note you were editing was closed, so nothing was inserted.`, nothing on disk (`r3-lc-probe-fixhook.log`).
  - Either path shows exactly one Notice.
- **Tests to add with the fix:**
  - Jest: the two probe tests (spy `index.getEntity` to remove the popover before / after resolving; assert `editor.writes` length 0 and `Notice.notices` equal to `[CLOSED_EDITOR_NOTICE]`).
  - Jest: one direct test, `insertFullBlock(editor, entity, () => false)` writes nothing.
  - Real Obsidian: optionally a G-S97 trial 9 with the same page-side `getEntity` hook. It must restore the hook in `finally` (`delete idx.getEntity`). It is red on `ea849f11` (measured) and green with the fix (measured).
  - Existing jest that does not cover the window: `compendiumSearchHoverPreview.test.ts:279-293` and `:332-343` remove the popover BEFORE the pick, so they cannot see it.
- **The CHANGELOG** (`7199f0e6`) says a pick after the note closed "now shows … instead of doing nothing". That is true for both commands only once this fix lands. No text change is needed after the fix.

### LOW-1: four mutants survive the r2 jest suite (each killed by a probe test; add them)

| Mutant | What it breaks | Killed by (scratch `r3Probe.test.ts`) |
|---|---|---|
| R2 | write target re-taken from `app.workspace.activeEditor` at choose time (`compendiumInsert.ts:405`, `:419`), breaking the "never re-target activeEditor" ruling | "a live preview editor and a different live activeEditor: the pick lands in the captured editor only" |
| R4a | `els.some(isConnected)` instead of `every` (`compendiumInsert.ts:355`) | "the container is still there but the CodeMirror element is gone: refused" |
| R4c | the connected check applied only to a preview editor, so a closed pane writes into the dead buffer (`:355`); owner ruling (b) is unpinned | "a closed PANE editor (no preview) is refused too" |
| R5 | guard bound to the global `document` instead of `containerEl.ownerDocument` (`hoverPreviewGuard.ts:32`); breaks popout windows. **It also survives the SC-595 DseModal suite** (shared helper; a gap since SC-595) | "the guard binds to the modal document: a press in the search inside a popout keeps the popout preview" (a jsdom iframe as the popout; `document.body.appendChild` redirected to the iframe for `.modal-container`, as Obsidian's `Modal.open` appends to `activeWindow.document.body` before `onOpen`) |

- **The fix:** port these four tests into `test/dom/authoring/compendiumSearchHoverPreview.test.ts`, without a bracketed id in any title.
- The popout test is the one that matters most. It guards both modals, because `DseModal` uses the same helper.
- The source is `r3Probe.test.ts.txt`; 5 of its 7 tests pass on HEAD, and the other 2 are MEDIUM-1.

### INFO

1. **Refactor is behaviour-neutral** (line by line, `git diff 5f7c5336..HEAD -- src/framework/kit`):
   - Unchanged against the old inline code:
     - `doc = containerEl.ownerDocument`;
     - `win = doc.defaultView ?? window`;
     - a bubble listener (no options) that tests `composedPath().includes(containerEl)` and then calls `stopPropagation()`, never `preventDefault`;
     - `owner.register(() => win.setTimeout(() => doc.removeEventListener('click', guard), 0))`.
   - The closure now reads the parameter instead of `this.containerEl` (an Obsidian Modal's `containerEl` is assigned once in the constructor, so this is equivalent).
   - The register order on `lifecycle` is unchanged: guard first, then the `previewModals` splice.
   - `keepHoverPreviewAlive` still computes `win` the same way.
   - `anchorTo` / the `anchor` getter / `open()` are untouched, so nested anchor inheritance is unchanged.
   - Evidence:
     - jest SC-595/597/598 suites all green (full run 0 failed);
     - M14, R14, M2, M8, R6 and R9 are killed by SC-595 tests;
     - G-S83 / G-S87 / G-S91 green in part 5.
2. **Real-Obsidian mutants are caught by one trial only.** R7 (`queueMicrotask` removal) and M3 (synchronous removal), built into real bundles, each fail G-S97 at exactly one expectation: `cmd backdrop: the bg press closed the preview`. This confirms the r2 follow-up (c). Trial 3 is the only guard against them, so keep it.
3. **Jest mock order differs from Obsidian.** `test/mocks/obsidian-core.ts:772-775` `SuggestModal.selectSuggestion` runs `onChooseSuggestion` THEN `close()`. Obsidian 1.15.1 runs `close()` first, then `onChooseSuggestion` (and `Modal.close` restores the saved selection before the choose). No current SC-601 test depends on the order. A future test about guard removal against the choose path would model it wrongly. The mock is pre-existing and outside this diff: a candidate Backlog ticket.
4. **Guard lifetime under an animated close.** Obsidian's `Modal.close` runs `onClose` (so `prefsOwner.unload` and the guard's removal timer) after `animateClose()` resolves when the close is animated. The search's guard can therefore outlive the close by the animation plus one task, where DseModal's lifecycle unloads synchronously in `close()`. This is harmless: only clicks through the search's own container are stopped. The measured backdrop close (R7 / M3 red) shows the non-animated path in the lifecycle vault.
5. **Other real routes that close the preview behind the search are handled by the backstop.** Measured on HEAD:
   - A real press on a Notice (`.notice-container` z-index 60, above the modal; the notice element was built in the DOM) closes the editing preview: Obsidian's rule, the same with no search open. The following pick is refused with the closed Notice for **both** commands, and nothing is written.
   - `leaf.rebuildView()` behind the search (pane) recreates the editor (`sameEditor: false`, old `cm.dom` disconnected). The pick is refused with the Notice and nothing is written. That is consistent with ruling (b). The wording "was closed" is slightly off there, because the note is still open in a rebuilt view; no action needed.

## 2. Mutant table

### r2's mutants (r2 runner, re-pointed at my scratch worktree; run over the three r2 suites, 195 tests)

M1 through M14: **all 14 KILLED**, with the same failure counts as r2's summary (11 / 16 / 5 / 3 / 3 / 11 / 4 / 19 / 1 / 2 / 3 / 3 / 5 / 6). Log `r3-r2mutate-run.log`, per-mutant `r3-r2mut-M*.log`.

### Mine (r3 runner `r3-mutate.py`, same three suites)

| # | Mutant | r2 suite | Note |
|---|---|---|---|
| R1 | guard installed for every search modal | KILLED (4) | |
| R2 | write target re-taken from `activeEditor` at choose time | **SURVIVED** | LOW-1; killed by a probe test |
| R3 | Notice shown but the text still written | KILLED (5) | |
| R4a | `some()` instead of `every()` | **SURVIVED** | LOW-1; killed by a probe test |
| R4b | connected check on the wrong object (`activeEditor` at choose time) | KILLED (2) | |
| R4c | check only for preview editors (closed pane writes) | **SURVIVED** | LOW-1; killed by a probe test |
| R4d | connected state captured once at command time | KILLED (3) | |
| R5 | guard bound to the global `document` | **SURVIVED** | LOW-1; killed by a probe test |
| R6 | guard in the capture phase | KILLED (15) | |
| R7 | guard removed by `queueMicrotask` | SURVIVED (jest) / **KILLED in real Obsidian** (G-S97 trial 3) | documented jsdom limit (owner ruling c) |
| R8 | guard never removed | KILLED (2) | |
| R9 | `stopImmediatePropagation` | KILLED (3) | |
| R10 | Shift inline link written before the check | KILLED (1) | |
| R11 | search guards its box only (backdrop unguarded) | KILLED (3) | |
| R12 | `editorCallback` context ignored | KILLED (11) | |
| R13 | `prefsOwner` never unloaded (guard never removed) | KILLED (2) | |
| R14 | DseModal guards its box only | KILLED (24) | |
| R15 | block check moved after `getEntity` (no early refusal) | SURVIVED | near-equivalent (still refuses; only loses the I/O-free early exit); the prescribed fix keeps both checks |

Totals: r2 suite: 10 killed, 5 survived of 15 jest mutants (R1-R15 with R4a-d), plus R7 / M3 killed in real Obsidian.

Re-run of the survivors with `r3Probe.test.ts` added (`r3-mutate-run-probe.log`): R2, R4a, R4c and R5 are each killed by their targeted probe test, beyond the 2 MEDIUM-1 tests that fail on HEAD anyway. R7 and R15 still pass every probe test except the 2 MEDIUM-1 tests (R15 fails only the `entity.model()` one).

## 3. What I probed and how

All probes ran in a scratch worktree (`git worktree add --detach … HEAD`, `node_modules` symlinked; removed with `git worktree remove --force <literal path>`) or in `git archive` exports. Real input is CDP throughout, as in G-S97.

| Probe | How | Result |
|---|---|---|
| G-S97 on the branch | part 6 `G-S92,G-S97` from the branch worktree (with build) | 2/2; G-S97 8/8, every hover trial `shown` + `editing` after the press and the pick, the reference on disk in the hovered note (`t.read` = `fs.readFileSync`), never in the host |
| G-S97 red on base | `git archive 5f7c5336`, symlinked `node_modules`, `node esbuild.config.mjs production` (bundle has 0 occurrences of the Notice text), `DSE_LIFECYCLE_BUNDLE=<that>` from the branch worktree | 15 broken expectations, exit 1: trials 1-5 and 8 red, 6-7 (controls) green |
| Closing trials repeated | probe mode | `cmd input click` 3/3, `cmd backdrop` 3/3 green (plus the part 6 run and 2 more backdrop runs) |
| Both commands, preview hidden behind the search before the pick | probe: `block preview hidden then keys`; G-S97 trial 8 (reference) | one closed Notice, nothing on disk, both commands |
| Block, preview hidden after the check (inside `getEntity`) | probe hook | **red on HEAD** (MEDIUM-1); green with the prescribed fix |
| Live Preview host | probe: `lp host cmd input click`, `lp host block box keys`, `lp host preview hidden then click` | all green (the preview kept and landed; the hidden case gives the Notice) |
| Mouse away / another hover | probe: input press, then Ctrl-mouse to the corners and the middle of the window, 1.6 s, pick | preview kept, landed, no Notice. In 1.15.1 an editing preview is `isFocused`, so `shouldShowSelf()` holds whatever the pointer does; a new hover is blocked by `.modal-bg`. Caveat: the link lookup returned a zero-size element, so the pointer did not cross the link itself |
| Escape before the pick | leak trial (Escape closes the search 12 times) | preview still `shown` + `.is-editing` after 12 cycles |
| Leak | page-side wrap of `Document.prototype.add/removeEventListener` for `click` on `document`, 12 open / input-press / Escape cycles | 1 live listener while open, **0 after**; jest: 30 cycles, 0 after one task |
| Normal pane | G-S97 trial 7 (lands); jest controls (no guard: R1 / M7 killed) | no change |
| Popout | app.js 1.15.1: `Modal.open` appends to `activeWindow.document.body` and then calls `onOpen`; the popover's hide listener is on `embed.containerEl.win`. Jest iframe test | the guard binds to the modal's document (correct); not driven in a real popout window (CDP drives the main window's target only); R5 survives the r2 suite (LOW-1) |
| False Notice for a live editor | probe: external `vault.process` edit of the hovered note behind the search, then a pick | landed, preview kept, **no Notice**; pane `rebuildView()`: Notice and nothing written (the editor really is new, INFO 5) |
| Another route that closes the preview | a real press on a Notice above the search | the preview closes (Obsidian's rule); the pick is refused with the Notice, both commands (INFO 5) |

## 4. Gates (measured)

- **jest full** (branch worktree, `rm -f main.js styles.css` first): `Tests: 1 skipped, 7713 passed, 7714 total`, `Test Suites: 1 skipped, 265 passed`, rc 0, 52 s, loadavg 1.6 → 11.
  - r2 measured `2 skipped, 7712 passed, 7714 total`. The difference is consistent with the SKILL's cache-dependent skip: `visual-harness/dist/obsidian-app.css` was written at 23:55 by r2's shots run, after r2's jest run.
- **Lifecycle part 5** `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91`: `done: 7/7 ok, 0 failed`, rc 0, 392 s with build.
- **Lifecycle part 6** `G-S92,G-S97`: `done: 2/2 ok, 0 failed`, rc 0, 153 s with build.
- e2e / shots / freeze / parity were not re-run. r2's numbers match the ledger baselines exactly, and the diff touches no surface those gates cover (no `data-dse-control`, no CSS, no e2e manifest).

## 5. Evidence (absolute paths)

Scratch `R` = `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc601-r3-a6817df7ce3df7360`:

- jest full: `R/r3-jest-full.log`, `R/r3-jest-full.rc`, `R/r3-jest-full.load`
- lifecycle: part 5 `R/r3-lc-p5.log`; part 6 `R/r3-lc-p6.log`; base red `R/r3-lc-base.log`; real-Obsidian mutants `R/r3-lc-mutR7.log`, `R/r3-lc-mutM3.log`; probes `R/r3-lc-probe-head.log`, `R/r3-lc-probe-wander.log`, `R/r3-lc-probe-notice2.log`, `R/r3-lc-probe-fixhook.log` (with the fix); `.rc` files alongside
- mutants: `R/r3-r2mutate-run.log` (r2's 14), `R/r3-mutate-run.log` (mine), `R/r3-mutate-run-probe.log` (survivors against the probe), per-mutant `R/r3-r2mut-M*.log`, `R/r3-mut-R*.log`, `R/r3-mut-R*-probe.log`; runners `R/r3-r2mutate.py`, `R/r3-mutate.py`
- probe jest: `R/r3Probe.test.ts.txt` (source); `R/r3-jest-probe-head.log` (HEAD: 2 failed = MEDIUM-1), `R/r3-jest-probe-fixed.log` (with the fix: 202/202)
- prescribed fix: `R/r3-prescribed-fix.diff`; probe harness changes: `R/r3-probe-harness-final.diff`
- bundles: base `R/base-5f7c5336/` (+ `R/r3-basebuild.log`), mutants `R/bundle-R7/`, `R/bundle-M3/`
- git status before / after: `R/status-before.txt`, `R/status-after.txt` (identical)
- the Obsidian 1.15.1 `app.js` extracted for the source reads: `R/asar/app.js`

The kept FAIL temp dirs printed by my runs were deleted by literal path: `/tmp/dse-obsidian-lifecycle-{s3PTYv,Zni99h,jsMA5z,hCDyQY,3ojcq3}`.
