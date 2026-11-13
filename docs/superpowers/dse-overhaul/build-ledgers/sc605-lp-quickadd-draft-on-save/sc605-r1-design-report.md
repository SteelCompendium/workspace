# SC-605 r1: design and prototype report (reviewer R1)

**Executive summary**
- **Mechanism:** a sibling of SC-602's module. `livePreviewStateCarry.ts` captures the view's opt-in `carryState()` from SC-602's capture points (`ViewRegistry.beforeRelease`, and a CodeMirror update limited to Obsidian's `"set"` transaction). It is armed by an unused own-write ticket, not by focus, keyed by `writtenBlockKey` and scoped to the pane. The pipeline takes it **before `view.mount`** (`takeCarriedState`) and hands it to `receiveCarriedState`. It is one-shot and expires after 1500 ms.
- **Base `711844f3` → prototype (real Obsidian 1.14.4, Live Preview, end state at write + settle + 1 s):** (a) mouse Advance round: `"" / ""` → `2 / Feytouched`. (b) mouse +: `"" / ""` → kept. (c) Enter on Advance round: `"" / ""` → kept, with focus on `init.round.advance` +ring in both. In every case the hint is `""`, Add is enabled and there is no `aria-invalid`. Mouse cases end with focus on `body` in both builds.
- **Guards, all held:** outside edit carries nothing. In two trackers, only the written one gets the draft; the other is not redrawn and keeps its own. In identical twins, only the written twin gets it. With two panes, only the pane it was typed in gets it. Text typed after the press is carried. After Add, then an outside edit, the boxes stay empty. Hand-emptied boxes, then an outside edit, stay empty. The draft also survives in a callout. An LP embed is adopted, so there is nothing to carry.
- **Flash: none.** In every redraw (16 cases), the first pre-paint (rAF) sample of the new root already holds the draft. The root was in the document at take time in 16 of 16 cases, so the post-connect path was dropped.
- **Focus-in-box (ruling 3): reachable, and it costs nothing extra.** The case is: mouse +, then a click into the label inside the 400 ms debounce. Base: focus is carried into an empty label at caret 0-0. Prototype: the value and the caret are restored (4-4 and 3-3) with the focus SC-602 already carries.
- **Footprint:** 1 new file (116 lines) plus 5 edited files (+52/−2), jest +248, e2e +1 spec and 1 fixture. **No off-limits file is touched.** `ReadingModeBlockHost.ts` is only read, through `blockKey()` and `lastWriteLineStart`.
- **Gates on the prototype:**
  - Full e2e: `304/307 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` (= baseline). With the proposed spec: `313/316 ok, 0 failed, 3 known-bug, 174/174`.
  - jest: 10808 passed / 2 skipped (+24).
  - tsc and lint are clean, and styles.css is byte-identical (`5e5ff488…2b27`).
- dse worktree: porcelain empty, HEAD `711844f3` = origin/develop (fetched; not moved). The prototype diff applies cleanly with `git apply`.

## 1. Measurements (real Obsidian 1.14.4 pinned e2e app, Live Preview, `Initiative/tracker.md` unless noted)

**How the probes ran.** A scratch spec drove each case, with ids `ZZ605-*` (`sc605-r1-probe.e2e.ts.txt`).
- A page-side sampler ran on every animation frame and every 4 ms. It logged each LP tracker root's box values (by root identity and leaf), `activeElement` (with caret), and vault `modify`.
- The prototype runs also logged a trace of `arm` / `claim-pre` / `take-pre`, which was removed before the diff was saved.
- "End" means after the write, then `dse.settle()`, then 1000 ms.
- Draft typed: `2` / `Feytouched` by real clicks and keys, unless noted.

### 1.1 (a)–(c)

| Probe | Base 711844f3: end state | Prototype: end state | Timings, prototype (ms from the press) |
|---|---|---|---|
| (a) mouse click Advance round | `"" / ""`; hint `""`; Add enabled; no aria-invalid; Round 2; focus `body` | **`2 / Feytouched`**; hint `""`; Add enabled; no aria-invalid; Round 2; focus `body` | write 572 → arm 572 → take 580 |
| (b) mouse click Malice + | `"" / ""`; focus `body` | **`2 / Feytouched`**; focus `body` | write 513 → take 518 |
| (c) Enter on Advance round | `"" / ""`; focus `init.round.advance` +ring (SC-602) | **`2 / Feytouched`**; focus `init.round.advance` +ring | write 448 → take 459 |

At base, SC-602 already carries focus in (c), but not the draft.

### 1.2 Guards

| Guard | Probe | Base | Prototype | Verdict |
|---|---|---|---|---|
| Outside edit (`vault.process`, no own-write ticket) | G1 | `"" / ""` | `"" / ""`; no `arm` traced | base behaviour kept |
| Two trackers, drafts `1/Alpha` and `2/Beta`, Advance in the 1st | G2 | 1st `"" / ""`; 2nd **not redrawn** (same root), keeps `2/Beta` | 1st `1/Alpha`; 2nd not redrawn, `2/Beta` | only the written one gets the draft |
| … Advance in the 2nd | G2b | 1st not redrawn (`1/Alpha`); 2nd `"" / ""` | 1st `1/Alpha`; 2nd `2/Beta` | same |
| Identical twins (`zz605-twins.md`), draft only in the 1st, Advance in the 1st | G3 | both redrawn, both `"" / ""` | 1st `1/Alpha`; 2nd `"" / ""` | only the written twin |
| … draft only in the 2nd, Advance in the 2nd | G3b | 1st not redrawn; 2nd `"" / ""` | 1st `"" / ""`; 2nd `2/Beta` | same |
| … drafts in both, Advance in the 1st | G3c | both `"" / ""` | 1st `1/Alpha`; 2nd `"" / ""` | the written twin keeps its draft. The 2nd twin's own draft is lost on base and prototype alike: for that block the write is an outside redraw (see Follow-ups) |
| Same note in two panes, draft in the active (right) pane, Advance there | G4 | both `"" / ""` | right `2/Right`; left `"" / ""` | only the typed pane |
| … drafts `1/Left` and `2/Right`, Advance in the right | G4b | both `"" / ""` | right `2/Right`; left `"" / ""` | the left pane's own draft is lost on base and prototype alike: an outside redraw for that pane |
| … draft only in the LEFT pane, Advance in the left | G4c | (not run on base) | left `1/Left`; right `"" / ""` | only the typed pane |
| One-shot after Add: draft, Advance, Add (saves), outside edit | G5 | the draft is already gone after Advance, so Add only flags "Amount required" | after Advance `2/Feytouched`; after Add `"" / ""`; Add's capture is empty, so it drops the key (`arm-empty`); log `{round 2, amount 2, Feytouched}`; after the outside edit `"" / ""` | holds |
| One-shot vs a hand-emptied draft: draft, Advance, boxes emptied by hand, outside edit about 700 ms later (inside the TTL) | G6 | `"" / ""` | `"" / ""` | holds |
| Text typed AFTER the press, before the save: `2/Fey`, mouse +, click into the label, type `X` | D | `"" / ""`; focus label @new caret 0-0 | **`2/FeyX`**; focus label @new +ring caret **4-4** | carried (ruling 2) |
| Mouse never moves focus | A, B, G* | `body` | `body` | unchanged: the carry path makes no focus call |
| Tracker inside a `> [!note]` callout | G7 | — | `2/Callout` kept; take before mount (root connected) | works |
| LP embed of `tracker.md` (`![[Initiative/tracker]]`) | G8 | — | same root kept (the embed adopts), so the draft is SC-589's own; nothing armed | n/a |
| Reading view and the sidebar | INIT-M10, INIT-M11, full e2e | ok | ok | unchanged: capture and take both need `.cm-content` |

### 1.3 Focus-in-box (owner ruling 3)

- **Reachable: yes.** Mouse + (or any persist), then a click into a quick-add box and typing or caret moves inside the 400 ms debounce. The write lands while focus is in the box.
- **D2** (caret moved to 3 with Home + 3×→):
  - Base: focus label @new, value `""`, caret 0-0.
  - Prototype: focus label @new +ring, value `Feytouched`, **caret 3-3**.
- **D** (typing): caret 4-4, as above.
- **Cost: zero extra code.** At release, focus is still in the box, so SC-589's `captureQuickAddDraft` records the caret. `buildMaliceQuickAdd` calls `setSelectionRange` on the not-yet-focused new box. SC-602's own claim focuses that box, and Chromium keeps the selection. SC-602's behaviour (focus, ring) is unchanged.
- The amount box is `type=number` and has no caret. Its focus is restored, and the caret is the browser's (as in SC-589).

### 1.4 Flash and latency

- **Flash** (`sc605-r1-flash-results.txt`): this is the first sample of every root that appeared after the write.
  - Base: always `["",""]`.
  - Prototype: every written root's first sample (rAF, which runs before paint) holds the draft. Examples: A `["2","Feytouched"]` at 601 ms, D `["2","FeyX"]`, G7 `["2","Callout"]`.
  - **No empty frame is ever painted.**
- **Root connected at take time: 16 of 16** (`claim-pre true` in every trace). This includes the callout, two panes and twins. The pipeline's `await prepareModel` runs after CodeMirror's synchronous DOM update.
- **Release → take latency: 4–23 ms** over 16 cases (`sc605-r1-probe-results-proto.txt`). The TTL of 1500 ms is a margin of about 65×.

### 1.5 Which guards e2e can make red (mutations, real Obsidian)

| Mutation | Effect | Caught by |
|---|---|---|
| M1: no editor-update capture | no change: initiative twins are released through `beforeRelease`, both twins redrawn | jest S14/S15 only |
| M2: no pane-scope check at take | no change: each pane's release and mount run in one transaction, and the other pane redrew before the arm (G4) or after the take (G4c) | jest S09 only |
| M3: take not one-shot | **G6 / INIT-L16 red**: the hand-emptied draft comes back on the outside edit | e2e INIT-L16, jest S01 |
| M4: no ticket check | **INIT-L14 red**: the outside edit carries the draft | e2e INIT-L14, jest S03 |

## 2. Design (line numbers at `711844f3`)

1. **Seam on `ElementView`** (`src/framework/view.ts`, after `chromeItems()` at :175-177). Add two optional methods with docs:
   - `carryState?(): unknown;`
   - `receiveCarriedState?(state: unknown): void;`

   `carryState` returns session state that is never note content, read at removal; `undefined` means nothing to carry. `receiveCarriedState` is called **before** `mount()`. Opt-in: only the initiative view implements them.
2. **New `src/framework/host/livePreviewStateCarry.ts`** (copy it from `sc605-r1-prototype.diff`):
   - **Header.** Keep the "FUNKY LOGIC" header cross-reference to `livePreviewFocusCarry.ts`, and state that the capture point is the same one.
   - **`carryOwnSaveState(entry, now)`.** It returns false unless all of these hold, checked in this order:
     1. the view implements `carryState`;
     2. `root.isConnected && root.closest('.cm-content')`;
     3. there is a ticket younger than `CLAIM_WINDOW_MS` that is not in the module's own `used` `WeakSet<ClaimTicket>`.

     Then it marks every ticket of the entry used, `key = writtenBlockKey(entry)`, and `state = carryState()`.
     - `undefined`: **delete** `carries[key]`. An empty capture (for example after Add) drops any older carry.
     - Otherwise: `carries.set(key, { state, scope: scopeOf(root), expires: now + CARRY_TTL_MS })`.
     - `scopeOf` = `closest('.internal-embed, .markdown-embed') ?? closest('.workspace-leaf')`, the same rule as `focusHandoff.ts:94`.
   - **`onEditorUpdateState(u, registry)` / `livePreviewStateCarryExtension(registry)`.** A ViewPlugin.
     - It acts only when `u.docChanged` and every doc-changing transaction `isUserEvent('set')` (Obsidian's `setViewData`, as in `livePreviewScrollHold.ts:439`).
     - It calls `carryOwnSaveState` for every live entry whose root is inside `u.view.dom`.
     - This covers the identical-twin hand-off SC-602 measured for counters, where the writer's entry is still live and is released by `remountReused.reconcile` only after the DOM update, too late for the mount.
     - Not required for initiative twins (M1), but kept: without it a hand-off case would arm only at the late release, leaving a stale carry for ≤ 1.5 s.
   - **`takeCarriedState(blockKey, root, now)`.**
     - Returns `undefined` at once when `carries.size === 0`, so an ordinary mount costs one Map read (S13).
     - Otherwise it requires `root.isConnected && root.closest('.cm-content')`, `live(blockKey())` with lazy expiry, and `scope` matching `scopeOf(root)`.
     - Then it **deletes** the entry and returns the state.
     - A root that is not yet connected takes nothing. That degrades to base behaviour, and was never measured to happen.
   - **`CARRY_TTL_MS = 1500`**, plus `resetCarriedStateForTests()`.
   - **Decision: no post-connect path, no `mounted` flag.** It was prototyped first: a MutationObserver plus a direct box fill. It never ran in 16 cases and only adds surface.
3. **`src/framework/host/livePreviewFocusCarry.ts:43-44`.** Export `writtenBlockKey`, and add "Also SC-605's key" to its doc. Do not duplicate the regex.
4. **`src/framework/registerFrameworkElements.ts`.**
   - Import (:32).
   - After :99, `plugin.registerEditorExtension(livePreviewStateCarryExtension(registry));`.
   - In the hook (:100-102), call both `carryOwnSaveFocus(entry); carryOwnSaveState(entry);`. Both stay separate: the focus carry has its own `used` set and returns early without focus.
5. **`src/framework/pipeline.ts`.**
   - Import `takeCarriedState` next to the `focusHandoff` import (:41).
   - Between `host.registry.own(...)` / `host.addChild(view)` (:725-731) and `await runStageAsync('render', () => view.mount(root, model))` (:732):
     ```ts
     if (host instanceof ReadingModeBlockHost && view.receiveCarriedState) {
       const carried = takeCarriedState(() => host.blockKey(), root);
       if (carried !== undefined) view.receiveCarriedState(carried);
     }
     ```
   - `ReadingModeBlockHost` is already imported there. The sidebar host is excluded twice over: by the `instanceof` check, and because it has no `.cm-content`.
6. **`src/elements/initiative/view.ts`.**
   - After `QUICKADD_LABEL` (:127-128): add `isQuickAddDraft(s: unknown): s is QuickAddDraft`. It checks string amount and label, and a caret that is absent or has field `amount`/`label` and numeric start/end.
   - After `captureQuickAddDraft()` (ends :200):
     - `carryState()`: `this.captureQuickAddDraft()` (read the boxes **now**), then return `undefined` when both are `''`, else a copy `{amount, label[, caret]}`.
     - `receiveCarriedState(state)`: `if (isQuickAddDraft(state)) this.quickAddDraft = state;`. That is all; `buildMaliceQuickAdd` (:735-745) restores the values and the caret exactly as in SC-589. The hint, Add and the validation styling are rebuilt from the empty state.
   - Update the field doc at :144-145. It says "dies with the view (a remount starts empty)"; add "except across the tracker's own save in Live Preview, where it is handed to the next view (SC-605)".
7. **Expiry, in summary:** one-shot (take = delete) · an empty capture deletes · TTL 1500 ms with lazy expiry on read · tickets used once (`WeakSet`) · the ticket itself expires after `CLAIM_WINDOW_MS`. A later outside redraw finds nothing: G5, G6 and INIT-L15/L16, red under M3.

**Why take-before-mount and not claim-after-connect:**
- The open problem SC-602 named, that the pane is unknown at processor time, does not occur at **mount** time. By then the root is connected (16/16 measured), so the pane scope and `.cm-content` can be checked before mount, with no flash.
- Claim-after-connect would need a partial update of already-built DOM (a second code path in the view), and it ran 0 times.
- Two-pane and twin guards hold either way: the key and scope are checked at take, and both are measured.

## 3. Prototype

- **`sc605-r1-prototype.diff`** (254 lines) covers the 5 edited `src` files and the new module. It applies cleanly with `git apply` on `711844f3` (checked after the revert).
- **`sc605-r1-proposed-jest.diff`** adds `test/dom/framework/livePreviewStateCarry.test.ts` (new, S01–S15) and Q19–Q23 in `test/dom/elements/initiative-matrix.test.ts`. It also applies cleanly.
- **`sc605-r1-proposed-malice-live-preview.e2e.ts.txt`** goes to `e2e/specs/initiative/malice-live-preview.e2e.ts`. **`sc605-r1-proposed-fixture-Initiative-twins.md.txt`** goes to `e2e/vaults/shipped/Initiative/twins.md`.
- **Gates run on the prototype** (summaries in `sc605-r1-test-runs.txt`):
  - tsc (including `-p e2e`) and eslint on `src/framework`, `src/elements/initiative` and the new spec are clean.
  - jest full: `10808 passed / 2 skipped` (baseline 10784 + 24 new), 80 s.
  - e2e regression set (INIT-M10, INIT-M11, INIT-L01..L08, CTR-L01..L05, CALL-L04): 16/16 ok.
  - Full e2e (prototype src only, probe specs and fixtures parked in the scratch dir): `OBSIDIAN-E2E done: 304/307 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`, 173 s.
  - Full e2e (plus the proposed spec and fixture): `313/316 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`, 153 s.
  - styles.css sha256 is `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27`, identical to the baseline. Shots, freeze and parity carry.

## 4. File footprint

| File | Change | Off-limits? |
|---|---|---|
| `src/framework/host/livePreviewStateCarry.ts` | NEW, 116 lines including the header | no |
| `src/framework/view.ts` | +14, two optional seam methods | no |
| `src/framework/pipeline.ts` | +7, import and take-before-mount | no |
| `src/framework/registerFrameworkElements.ts` | +4, extension and hook | no |
| `src/framework/host/livePreviewFocusCarry.ts` | export `writtenBlockKey` (±2) | no |
| `src/elements/initiative/view.ts` | +25, guard, `carryState`, `receiveCarriedState`, field doc | no |
| `test/dom/framework/livePreviewStateCarry.test.ts` | NEW, 15 tests | no |
| `test/dom/elements/initiative-matrix.test.ts` | +Q19–Q23, 9 tests | no |
| `test/dom/framework/register-framework-elements.test.ts` | assert that the 2nd extension is registered and that the hook calls both (see §5) | no |
| `e2e/specs/initiative/malice-live-preview.e2e.ts` | NEW, INIT-L09..L17 | no |
| `e2e/vaults/shipped/Initiative/twins.md` | NEW fixture | no |
| `e2e/README.md` | fixture-table row for `Initiative/twins.md` (next to `Counter/twins.md`, :110) | no |
| `.repo-docs/architecture.md` | row next to `host/livePreviewFocusCarry.ts` (:124), and a sentence in the SC-602 paragraph (:651) | no |
| dse `CHANGELOG.md` | new `## Unreleased` bullet; edit :31 ("Not covered: … SC-605") and :54 ("In Live Preview the boxes are still emptied … (SC-605)") | no |
| worktree superproject `CHANGELOG.md` | new bullet; edit :15 and :101 (the same two claims) | no |

- **Off-limits:** none touched. `ReadingModeBlockHost.ts` (SC-607) is read only, through the existing public `blockKey()` and `lastWriteLineStart` (via `writtenBlockKey`). `hoverLinks.ts`, `lineMap.ts`, `visual-harness/obsidian-lifecycle.mjs` and `src/views/ConditionsModal.ts` are not touched.
- **Manifests:** no change. L09–L17 drive only pairs that are already listed: `init.round.advance` click and press:Enter, `init.malice.inc` click, `quickadd.amount` and `quickadd.label` type, `quickadd.add` click. The full run's coverage stayed 174/174.
- No CSS. No lifecycle scenario: e2e expresses every guard, so G-S107 stays unused.

## 5. Test plan for the implementer

### jest (all prototyped: `sc605-r1-proposed-jest.diff`, green on the prototype)

**`test/dom/framework/livePreviewStateCarry.test.ts`** uses fake entries: `{ root, host: { blockKey, lastWriteLineStart }, tickets, view: { carryState } }`, with roots in `div.workspace-leaf > div.cm-content`.

| Id | Case | Mutation that makes it red (measured) |
|---|---|---|
| S01 | capture, then take in the same pane: state returned once (one-shot) | take not deleting → S01 |
| S02 | no `.cm-content` (Reading view or sidebar): false, `carryState` not read | no `.cm-content` check at capture → S02 |
| S03 | no ticket; a ticket older than `CLAIM_WINDOW_MS` | no ticket check → S03, S04 |
| S04 | the same entry twice: second false, `carryState` read once | no `used.add` → S04 |
| S05 | view without `carryState` | — |
| S06 | empty capture deletes an armed carry | no `arm-empty` delete → S06 |
| S07 | detached old root | — |
| S08 | twin key: live `::13`, `lastWriteLineStart` 4 → `::13` gets nothing, `::4` gets the state | `entry.host.blockKey()` instead of `writtenBlockKey` → S08 |
| S09 | another pane with the same key gets nothing; the typed pane still gets it | no scope check → S09 |
| S10 | another note's key | — |
| S11 | detached new root, or one not in `.cm-content` (sidebar in the same leaf) → nothing; the real one still gets it | no `.cm-content` check at take → S11 |
| S12 | at `now + CARRY_TTL_MS` → nothing, and it is dropped | no expiry → S12 |
| S13 | no carry armed → `blockKey` never called | — |
| S14 | editor update with a `"set"` transaction captures an entry in this editor | — |
| S15 | non-`"set"` / no doc change / entry in another editor → nothing | no `"set"` filter → S15 |

**`initiative-matrix.test.ts` [Q] group.** It uses `mount()` with a host whose `addChild` gets the view (the pipeline calls `host.addChild(view)` immediately before `view.mount`, so this stands in for take-before-mount):

| Id | Case | Mutation → red |
|---|---|---|
| Q19 | `carryState` reads the boxes now (a value set after typing is seen); empty → `undefined`; amount-only / label-only are carried | `carryState` without `captureQuickAddDraft()` → Q19, Q20; no empty→`undefined` → Q19 |
| Q20 | caret recorded for the focused box | (above) |
| Q21 | received before mount: values and caret 3-3 in the boxes; hint `''`; no `[aria-invalid]`; Add enabled | — |
| Q22 ×5 | wrong shapes (null, string, missing label, numeric amount, bad caret field) are ignored | no `isQuickAddDraft` guard → 5 red |
| Q23 | a received draft survives Advance round, is not written, and Add commits it and empties the boxes | — |

- **Red on base:** Q19–Q23 give 9 failed on `711844f3`'s `src` (the methods do not exist). The S suite does not load on base (the module is absent).
- **Mutations:** every row above was measured red (`sc605-r1-jest-mutations.txt`).
- **Add to `register-framework-elements.test.ts`:** the extension count goes up by one (SC-602's assertion style), and `registry.beforeRelease` calls both carries. Prove it with a spy on each module, or with an entry whose view has `carryState`.
- **Pipeline (optional; not prototyped):** with a `ReadingModeBlockHost` built from `makeFakeContext` (as `livePreviewFocusCarry.test.ts` imports), a pre-armed carry reaches a view with `receiveCarriedState` before `onMount` runs. A view without the method does not consume it.

### e2e (prototyped: `sc605-r1-proposed-malice-live-preview.e2e.ts.txt`)

- **Spec:** `e2e/specs/initiative/malice-live-preview.e2e.ts`.
- **Ids:** INIT-L09..L17. These are verified free across `e2e/`, where only INIT-L01..L08 exist. No bracketed ticket id appears in any title.
- **Method:** each end state is read after `dse.settle()` + 1000 ms. Box values come from displayed LP roots (`offsetParent !== null`), together with the hint, `aria-invalid` and the active pane.

| Id | What | Base 711844f3 (measured) | Prototype |
|---|---|---|---|
| INIT-L09 | LP INIT-M10: mouse Advance, then mouse + (the stepper case), keep the draft; focus not in the tracker; the note has no draft; Add commits `{round 2, amount 2, Feytouched}` and empties the boxes | **red** | ok |
| INIT-L10 | (c) Enter on Advance: draft kept, and focus `init.round.advance` tracker 0 +ring | **red** | ok |
| INIT-L11 | text typed after the press: `Fey`, mouse +, click into the label, `X`, all inside `waitForWrite` → `2/FeyX`, focus label, caret [4,4], ring (also the focus-in-box case) | **red** | ok |
| INIT-L12 | two trackers, drafts in both, Advance in the 2nd → both keep their own | **red** | ok |
| INIT-L13 | identical twins (`twins.md`), draft in the 1st, Advance in the 1st → `[1/Alpha, "" ""]`; the 2nd fence has no `round` | **red** | ok |
| INIT-L14 | outside edit carries nothing (guard) | green | ok; **red under M4** |
| INIT-L15 | after a kept draft, Add empties, and an outside edit does not bring it back | **red** (at "kept") | ok |
| INIT-L16 | one-shot: boxes emptied by hand straight after the save, then an outside edit → empty (guard) | green | ok; **red under M3** |
| INIT-L17 | two panes: the draft comes back only in the active (typed) pane; the split is detached in `finally` | **red** | ok |

- **Totals:** 7 red on base, 2 guards green on base and proven by mutation (`sc605-r1-test-runs.txt`).
- **Not expressible as red in e2e:** the pane-scope check and the editor-update capture (M1/M2 change nothing in real Obsidian). These are jest-only (S09, S14/S15). Say so in the spec header comment.
- **Fixture:** `Initiative/twins.md`: two identical trackers (Alice Alpha 30, one Ogre 60, Malice 3) with ABOVE / BETWEEN / BELOW prose. Add a README fixture-table row.
- **INIT-L16 timing:** it must reach the outside edit within `CARRY_TTL_MS` of the save for M3 to show. Measured: about 700 ms. On a very slow host the test stays green, only less sensitive. It is never flaky on correct code.
- **INIT-L11 timing:** if the save landed before the typed key, the prototype still ends with `FeyX` (draft carried, then `X` typed) and base ends with `X`. So it stays red on base and is not flaky.
- **Lifecycle:** none. e2e expresses every guard. No G-S107.

## 6. Risks

1. **Obsidian ordering.**
   - Capture depends on SC-602's measured StateField release order.
   - Take-before-mount depends on the redraw's root being connected after `prepareModel`'s awaits (16/16 measured).
   - If either changes, nothing is carried. That is today's behaviour, never a wrong draft, and INIT-L09..L13/L15/L17 go red.
2. **Hidden widget copies.** Obsidian can keep a `display:none` copy of a widget in the same leaf (`focusHandoff.ts:20-21`). If such a copy of the written block were mounted first, it would take the one-shot carry. This was not observed: the visible root got the draft in every case. A visibility check is not possible before mount, because the root is empty then.
3. **Other copies lose their own drafts** (base behaviour, consistent with the outside-edit ruling):
   - an identical twin redrawn by its sibling's save (G3c);
   - the other pane of the same note (G4b).
4. **LP embed of another note:** measured adopted (G8), so it is not involved. An embed whose redraw is a fresh mount would take only inside the same embed element (scope rule).
5. **Popouts:** not measured. The code is document-relative.
6. **Per-mount cost:** none while nothing is armed (one `Map.size` read). While armed, at most one `blockKey()` per LP mount, for ≤ 1.5 s.

## Follow-ups (left alone)

- **Low:** in Live Preview a save of one copy of a block redraws other copies, and their own half-typed drafts are lost (base behaviour):
  - the identical twin below (G3c);
  - the other pane of the same note (G4b).
  Carrying them would need capture without an own-write ticket, which conflicts with the outside-edit guard.

## Artifacts

**Ledger dir:** `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc605-lp-quickadd-draft-on-save/`

- `sc605-r1-prototype.diff`: the src prototype.
- `sc605-r1-proposed-jest.diff`: S01–S15 and Q19–Q23.
- `sc605-r1-proposed-malice-live-preview.e2e.ts.txt` and `sc605-r1-proposed-fixture-Initiative-twins.md.txt`: the proposed spec and fixture.
- Probe harness:
  - `sc605-r1-probe.e2e.ts.txt` (ZZ605-*)
  - `sc605-r1-run-probe.sh.txt`
  - `sc605-r1-summarize.py.txt`
  - `sc605-r1-flash.py.txt`
  - `sc605-r1-fixture-zz605-{twins,callout,embed}.md.txt`

  Re-run it as SC-602 did: copy the probe to `e2e/specs/zz605/probe.e2e.ts` and the fixtures to `e2e/vaults/shipped/Initiative/`, run with `--only`, then remove them. Never run a full e2e with them in place.
- Results:
  - `sc605-r1-probe-results-base.txt`
  - `sc605-r1-probe-results-proto.txt` (the final prototype, with trace)
  - `sc605-r1-probe-results-mutations.txt` (M1+M2, M3)
  - `sc605-r1-flash-results.txt`
  - `sc605-r1-jest-mutations.txt`
  - `sc605-r1-test-runs.txt`: every gate summary named above.

**Scratch logs:** `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc605-r1-design/`
- `e2e-full-proto.log`
- `e2e-full-proto-withspec.log`
- `jest-full-proto.log`
- `probe-*.log` / `probe-*.jsonl`
- `jm-*.log`
