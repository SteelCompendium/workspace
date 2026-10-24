# SC-510 r2 independent review — block edit form preview race

## Executive summary
- Verdict: **LAND-READY**. Reviewed dse be35c6a on base 253aa5f, superproject dca5433 on 104dd85. Findings: 0 HIGH, 0 MEDIUM, 1 LOW, 4 INFO.
- Red/green: the new suite has 13 failures and 4 passes out of 17 on 253aa5f's FormModal.ts, and 17/17 passes on HEAD.
- Mutants: 9 run, 8 killed. 1 survivor, M2: the host `containerEl` can be left as the box and every test stays green. That is LOW-1.
- Real Obsidian 1.15.0 run with real key input: char-by-char `@Ref.md` shows only Ref Strike with no error. When the lookups are held and released newest first, base shows "Reference file (R) not found" plus a Coverage Strike card, and HEAD is clean. Unhandled rejections: base 2, HEAD 0. The HEAD preview is pixel-identical to base.
- FU-1 is reachable only when the next keystroke lands within about 7 ms (2 of 12 hits in the sweep, 0 hits at page gaps of 35 ms or more). Do not fold it into SC-510. File it as an element ticket with an owner-aware guard (C3, proven). C1, the FormModal-only alternative, works but resets the preview's session state on every render.
- FU-2: the real card shows "Feature: failed to render (render) / Cannot read properties of null (reading 'effects')". The preview shows nothing. C2 (`renderErrorCard(slot, …)` in the catch) makes the preview match the card. Proven green.
- Gates on HEAD: tsc rc 0. Lint rc 0. Jest 6091 passed / 1 skipped / 246 of 247, both runs. Lifecycle 38/38. e2e 123/123 ok, 0 failed, 0 known-bug, 87/87. Shots 592, 0 FAIL, button host-leak 113/678. Freeze 280/280. Parity 0/0/24.
- origin/develop moved from 253aa5f to f89f69f (SC-512). The legacy merge-tree check shows 0 conflicts, and the two changes touch no files in common.

## Context checks
- `git fetch origin`: origin/develop is now **f89f69f** (SC-512: a706ff7, f89f69f). It is no longer 253aa5f.
  - SC-512 touches `visual-harness/entry.ts`, `visual-harness/shoot.mjs` and `test/dom/visual-harness/fixtures.test.ts`.
  - This branch touches `src/authoring/FormModal.ts` and `test/dom/authoring/formModalStalePreview.test.ts`. The two file sets do not overlap.
  - `git merge-tree <mb=253aa5f> be35c6a f89f69f` (git 2.34, so the legacy form; `--write-tree` is unsupported) gives 0 conflict markers and 0 "changed in both".
  - The branch's tests do not import `visual-harness/`. Per the owner, the rebase happens in the fix round.
- Tree state before and after: dse is clean at be35c6a. The superproject shows only ` M draw-steel-elements`, the unbumped pointer, exactly as found. My throwaway jest probe file was deleted by its literal path. A copy is kept as `sc510-r2-probe.test.ts.txt`.

## Red/green
- On 253aa5f FormModal.ts (the file swapped in, then restored): `Tests: 13 failed, 4 passed, 17 total`. Log: `sc510-r2-red-jest.log`.
- On HEAD: `Tests: 17 passed, 17 total`. Log: `sc510-r2-green-jest.log`.

## Mutants
Each mutant was applied to FormModal.ts and then restored. For each one I ran the new suite plus 6 other form and save suites (163 tests). Log: `sc510-r2-mutants.log`.

| Mutant | New suite | Other suites |
|---|---|---|
| M1 mount into `previewEl` (host still the slot) | 13 fail | 0 fail |
| **M2 host `containerEl: this.previewEl`** | **0 fail (SURVIVES)** | 0 fail |
| M3 `.catch` dropped (`void`) | 2 fail | 0 fail |
| M4 no `previewEl.empty()` (old slot not detached) | 13 fail | 1 fail |
| M5 no `lifecycle.removeChild` | 2 fail | 0 fail |
| M6 slot = box | 13 fail | 0 fail |
| M7 empty the old slot but keep it attached | 13 fail | 1 fail |
| M8 badge on the slot instead of the box | 8 fail | 2 fail |
| M9 badge not cleared | 2 fail | 1 fail |

## Findings

### LOW-1: D1's "the preview host's `containerEl` is that child too" is not pinned by any test
- Where: `src/authoring/FormModal.ts:442` (`containerEl: slot,`).
- What happens: mutant M2 reverts it to `this.previewEl` and all 17 new tests plus 163 others stay green.
- Why it is invisible today: the only reader of `host.containerEl` is `ElementPipeline.run` (`src/framework/pipeline.ts:464,496`). The preview never goes through the pipeline. I grepped every element, `src/framework/view.ts`, chrome and views: none of them reads `host.containerEl`, `parentElement` or siblings to write outside its root during a mount.
- Failure scenario: a later element that draws into `host.containerEl` during an async mount (for example a deferred notice) would write into the shared box. That brings back the SC-510 resurrection, and no test would notice.
- Fix: in the test's `createView` wrapper, record `cx.host.containerEl`. Then assert that, for the last view, it is the element passed to `mount` and a direct child `.dse-form__preview-slot` of `.dse-form__preview`. Alternatively assert `(view as any).rootEl === cx.host.containerEl`. This is one assertion in the "no leaked views" test.

### INFO-1 (FU-1): "Reference nesting too deep" when the same reference is retyped while an earlier mount of it is pending
This happens on base too, so it is not a regression. Measured:
- **Mechanism, in jsdom and real Obsidian.** Box `@Ref.md` with its lookup pending, then a real Space key gives the same trimmed reference and the same guard key `…::form-preview|@Ref.md`. The preview immediately shows "Feature: failed to render (render) Reference nesting too deep — `@Ref.md` is already resolving in this block". After the held lookup is released it **still** shows that text.
  - The unloaded view does **not** release its in-flight entry. `RefUnwrapView` has no unload hook. The guard is dropped only in the stale mount's `finally` (`src/elements/shared/RefUnwrapView.ts:229-231`).
  - Nothing redraws the current preview after that, so the error stays until the next keystroke.
  - Screenshot: `sc510-r2-shot-fu1-held.png`.
  - Feature and statblock both behave this way (jsdom probe).
- **Reachability by a person, real Obsidian, HEAD bundle, warm cache, small vault.**
  - Lookup time over 15 trials: 4.1–10.8 ms.
  - From the input event to Ref Strike appearing: 29–59 ms. The main thread is busy rendering for most of that, so a following key is processed after the guard is released.
  - Gap sweep (measurement only, not a gate): `@Ref.md` as one insertText, then a real Space after a requested gap. Nesting appeared in **2 of 12** runs, only at page-side gaps of 6.8 and 7.3 ms. It did not appear in any of the 10 runs with page gaps of 35–94 ms.
  - Key auto-repeat is about 33 ms or more, and normal typing is 100 ms or more. So a person reaches this only when a lookup is much slower than here (a large file, a cold disk, a big vault), or when two input events land within a few ms (paste or IME double-fire).
  - Log: `sc510-r2-obsidian-probe-head-p2-fu1.log`.
- **Fix options, all proven in jsdom with the probe and the relevant suites green; logs `sc510-r2-candidate-fixes.log` and `sc510-r2-candprobe-C1.log` / `-C3.log`.**
  - **C3, element code (recommended, as a separate Backlog ticket):** make `IN_FLIGHT_REFS` a `Map<guardKey, owner>`. Refuse only when the owner is a different view that has not unloaded (using ElementView's `unloaded` flag; add a public `isUnloaded()` accessor, since the flag is private today). In `finally`, delete the key only if this view is still the owner. That is about 6 lines in `RefUnwrapView.ts`, plus the accessor in `view.ts`.
    - Result: FU-1 is gone at the held, same-tick and one-macrotask timings.
    - The new suite, `refUnwrapView.test.ts` and the depth-guard test (`displayCardHybrid.test.ts` (d)) stay green.
    - A first attempt keyed on `_loaded` broke that depth-guard test, because pipeline views under a bare test host are never loaded. Use `unloaded`, not `_loaded`.
    - This also covers the same race outside the form, for a card whose blockKey is stable when it re-renders. D2 forbids element code here, so this belongs in a new ticket.
  - **C1, FormModal only (keeps D2):** a per-render blockKey, `…::form-preview#<n>`. It fixes FU-1, and the suite, tsc, lint and build are green.
    - Cost: every session slot the preview reads or writes resets on each keystroke. Measured: the statblock preview reads `sb.band.villain`; the feature preview reads none. The same would apply to hero, negotiation and skills tabs, roll history and modifiers, and montage.
    - The session map also gains one key per render that someone interacts with.
    - Not recommended, given that FU-1 is rarely reachable.
- **Recommendation:** do not fold. File C3 as a Backlog element ticket that links SC-510.

### INFO-2 (FU-2): a rejected preview mount shows nothing; the real card shows an error card
This happens on base too, apart from the rejections, which HEAD now catches.
- **Real card** (real Obsidian, `Lifecycle/sc510-bad-card.md`, body `@Bad510.md`, Bad510.md's block is `# only a comment`): `.dse-error-card` with stage `render`, text "Feature: failed to render (render) / Cannot read properties of null (reading 'effects')". Shot: `sc510-r2-shot-head-bad-card.png`.
  - jsdom gives the same frame for statblock: "Statblock: failed to render (render) / _a.map is not a function".
- **Preview, HEAD:** one empty slot, `data-dse-readonly="true"` on the box, and no text. The screenshot shows **nothing at all** below the box; even the badge is not visible on the 0-height box. Save stays enabled. Shot: `sc510-r2-shot-head-bad-preview.png`.
- **Base:** the same blank preview, plus 2 unhandled rejections (`TypeError … reading 'effects'` from `resolveLegacyRef`).
- **Smallest consistent behavior (C2):** in `src/authoring/FormModal.ts:456`, replace `.catch(() => {})` with `.catch((error: unknown) => renderErrorCard(slot, this.def, error))`, importing `renderErrorCard` from `@/framework/pipeline`. This is the exact frame the card uses.
  - A stale slot is detached, so a late failure is still invisible. The box keeps the badge, and the card now gives the box height, so the badge renders as it does in `sc510-r2-shot-fu1-held.png`. No new UI is invented.
  - It creates a new import cycle, pipeline → FormModal → pipeline, used at call time only. tsc, lint, the esbuild production build and 166 jest tests are green with it.
  - The preview then reads exactly like the card. Log: `sc510-r2-candprobe-C2.log`.
  - Test change: in "a referenced block the element cannot read", assert `preview.querySelector('.dse-error-card')` and the card's message.
  - This is a small fold or follow-up for the owner to rule on.

### INFO-3: the ticket's "self-referencing `@Note.md` → 12 rejections" does not reproduce in real Obsidian either
- Base and HEAD both have 0 page errors.
  - A note whose first block is `@SC510Self.md` shows the card "Failed to parse YAML in SC510Self.md: Plain value cannot start with reserved character @".
  - `@SC510Self2.md` (the edited block is the note's first block) shows that block's content.
- In real Obsidian, base with char-by-char real keys at natural speed did **not** show the stale "not found". The race at base needed lookups that finish out of order, which I reproduced by holding them at the hook (`sc510-r2-shot-base-ref-reverse.png`). The fix is still validated, because HEAD is clean under the same hold (`sc510-r2-shot-head-ref-reverse.png`).
- The ticket text may want correcting. That is the owner's call.

### INFO-4: other probes, all clean
- **Visual:** in real Obsidian, HEAD and base PNGs of the preview are byte-identical for `@Ref.md`, the bad preview and the bad card.
  - No CSS rule targets `.dse-form__preview` children.
  - The `:not([data-dse-readonly])` sticky-header rule (`styles-source.css:10890`) needs `data-dse-theme` and `data-dse-sb-sticky` on the root. The preview root never carries them, on base or HEAD, so moving the root into a slot changes nothing.
  - Shots and freeze confirm this.
- **Badge:** valid preview has `data-dse-readonly="true"` on the box. An emptied or invalid preview has it removed (M8 and M9 are killed).
- **Leak, real Obsidian:** after 21 keystrokes there is 1 `.dse-form__preview-slot` in the document and 1 child in the box.
  - In jsdom only the last preview view is `_loaded`.
  - Superseded mounts keep running in their detached slot. Their inner base view is added to an already-unloaded `RefUnwrapView`, so it is never loaded or unloaded.
  - Feature, statblock and ds-scc views register no window or document listeners, so only detached DOM, which can be garbage-collected, is left. This is the same as base.
- **ds-scc bare code:** covered by the jsdom test (red on base: the kit card resurrected under the notice; green on HEAD). Not probed in real Obsidian.

## Real Obsidian probe (throwaway, not committed)
- How it ran: a scratch copy of `visual-harness/obsidian-lifecycle.mjs` with two scenarios, SC510-P1 and SC510-P2. It used port 9294 and its own Xvfb, against the HEAD and base bundles via `DSE_LIFECYCLE_BUNDLE`.
- Input:
  - Typing: real `Input.dispatchKeyEvent` per character. The textarea was focused with a real mouse click.
  - Opening the form: the pencil was clicked with `.click()`, because the 1214 px card's centre is off-screen for the hover path.
  - Races were ordered by holding `services.refs.resolve` at a hook. No timed delays were used, apart from the labelled FU-1 measurement sweep.
- P1 summary:
  - HEAD: `natural=true reverse=true rejections=0/0/0/0/0`.
  - Base: `natural=true reverse=false rejections=0/0/0/0/2`.
- Logs: `sc510-r2-obsidian-probe-{head,base}-p1.log`, `sc510-r2-obsidian-probe-head-p2-fu1.log`. Source: `sc510-r2-obsidian-probe-{kit,scenarios}.js.txt`.
- The final preview shot is `sc510-r2-shot-head-ref-natural.png`.

## Full battery on HEAD be35c6a (dse-verify order; logs `sc510-r2-<gate>.log` with `.rc`)
- tsc (including `-p e2e`): rc 0, clean.
- lint: rc 0. The only message is the existing `.eslintignore` warning.
- jest (shots cache already present): rc 0, `Tests: 1 skipped, 6091 passed` / `246 of 247` suites. That is base 6074 plus the 17 new tests.
- lifecycle (port 9294): `OBSIDIAN-LIFECYCLE done: 38/38 ok, 0 failed`. No G-S46.
- e2e: `OBSIDIAN-E2E done: 123/123 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`.
- shots: rc 0. 592 files, 0 FAIL. Button host-leak 113 kinds / 678, modal host-leak 10 / 228. The run went past the tool timeout; I waited on its PID.
- jest after shots: rc 0, 6091 / 1 / 246 of 247.
- freeze: `freeze OK (280/280 …)`.
- parity: rc 0, `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.
