# SC-536 r1 — reproduce in real Obsidian + design survey

## Executive summary
- **Both bugs reproduced on dse `34f46cf` in real Obsidian 1.15.0.** Bug 1: `@Cyc.md` nested itself 137 levels in 20 s with 0 error cards and never settled. With lookups released one at a time, 8 of 8 levels started; the same happened for a `[[Cyc]]` alias, an A→B→A cycle and Live Preview. Bug 2 (two runs): two panes + plugin off/on 3/3 and 3/3; split + redraw in the same tick 3/5 and 4/5; every held variant 100% (redraw twice 2/2, two live copies 4/4, plugin off/on held 4/4).
- **Root cause, measured.** A nested block gets a fresh RenderContext, a fresh host and the `docId` blockKey fallback (`<note>::ds-feature::<random docId>`), so the guard key never matches. The nested block's element is already inside the parent card's root, and connected, when Obsidian calls the processor, when the view mounts and after its lookup. Obsidian calls the processor synchronously inside the parent's `MarkdownRenderer.render`.
- **Recommended design:** a DOM-ancestry guard in `RefUnwrapView` only. Each root that resolved a reference records `{targets, depth}` in a module `WeakMap<HTMLElement, RefChain>`. A new resolution walks `parentElement` to the nearest recorded ancestor. It refuses when that chain already holds its target (cycle), or when depth would exceed **5** (hard cap). The target is the resolved identity: `file:<path>` for `@`/`[[ ]]`; `scc:<code>` + `file:<path>` for SCC. Remove `IN_FLIGHT_REFS` and `isUnloaded()`; keep `resolveGen` unchanged.
- **The prototype works in real Obsidian.** Cycle: 2 lookups, then 1 error card, settled (all 5 cycle cases incl. alias and Live Preview). 7-chain: 5 cards + cap card. Bug 2: 0/5, 0/3 and all held variants clean, on 2 runs. jsdom: SC-525 form tests 28/28 green; probe 10/10 green (base 8/10 red); tsc and lint clean.
- **`ReadingModeBlockHost.ts` does not change** (SC-481 area untouched). Under the prototype, 6 existing guard tests and 1 `displayCardHybrid` test fail or run out of memory. They model nesting as siblings on one host, or pin Bug 2 as expected. They must be rewritten (§5).

## 1. What was run
- Worktree `/home/scott/code/steelCompendium/worktrees/sc536-ref-cycle-guard/draw-steel-elements`, HEAD `34f46cf8`, branch `sc536-ref-cycle-guard`. `git status --porcelain` was empty before and after. The only new ignored entry is `.devbox/`, created by the prescribed `devbox run -c <worktree>`.
- **No file in the worktree was edited, built or tested in.**
  - Everything ran in a scratch copy (`git archive 34f46cf`, `node_modules` symlinked read-only from `sc533-chrome-border-reflow`, same lock hash).
  - Location: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc536-r1-a8dc3ea22e7ab9edd/`.
- Bundles built from that copy (`sc536-r1-build-bundles.sh.txt`):
  - **base** = 34f46cf unchanged.
  - **instr** = base plus throwaway logging into `window.__sc536` (`sc536-r1-patch-instr.py.txt`).
  - **proto** = the recommended design (`sc536-r1-patch-proto.py.txt`; resulting diff `sc536-r1-proto-RefUnwrapView.diff.txt`).
- Real-Obsidian probes: the lifecycle harness plus my kit and scenarios (`sc536-r1-obsidian-{kit,scenarios}.js.txt`, runner `sc536-r1-obsidian-run.sh.txt`). Each run was one foreground call with its own Xvfb (:161) and its own port (9536/9537).
- Hold hooks (no timers):
  - `services.refs.resolve` on the current plugin instance.
  - `app.vault.read/cachedRead` by path. This hook survives a plugin re-enable.
  - "Settled" = no lookup or read in flight except the held ones, then 2 rAF, then the same check again.

## 2. Reproduction on 34f46cf (base)

| Probe | Run 1 | Run 2 |
|---|---|---|
| **Bug 1, natural speed**, fresh tab, `@Cyc.md` | lookups 41 @4.2 s, 84 @10 s, 137 @20 s; 138 roots, depth 137, **0 error cards**, never settled | — |
| Bug 1, held, released one level at a time (cap 8 steps): `@Cyc.md`→`@Cyc.md` | 8/8 levels started, still going | — |
| … `[[Cyc]]  ` → `@Cyc.md` (alias + trailing spaces) | 8/8, still going | — |
| … `@CycA.md`→`@CycB.md`→`@CycA.md` | 8/8, still going | — |
| … Live Preview `@Cyc.md` | 8/8, still going | — |
| … `@Chain1..7` (7 distinct, no cycle) | 7 cards, ended (no guard ever fires) | — |
| **Bug 2 D**: two panes, plugin disable + enable, natural | **3/3** nesting error (pane 2) | **3/3** |
| **Bug 2 C**: split + `rerender(true)` same tick, natural | **3/5** | **4/5** |
| Bug 2 A: two redraws while the first redraw's read is held | error while held and **after release** | same |
| Bug 2 H: pane 2 opens (read held), pane 1 redraws, release FIFO / LIFO | pane 1 refused at once (held 1), still refused after release, both orders | same |
| Bug 2 H3: two panes, read held across plugin off/on, release FIFO / LIFO | pane 2 refused (held 1), stays refused, both orders | same |

- In-the-wild data point (base run 1, `S536-CYCN` after other scenarios): reopening the cycle note hit **Bug 2 on a single pane**. The visible top-level card showed "`@Cyc.md` is already resolving in this block", because the previous render's runaway chain (94 lookups in about 0.7 s) still held the top-level key. A runaway cycle and Bug 2 compound.
- Logs: `sc536-r1-obsidian-base-run1.log`, `sc536-r1-obsidian-base-cycn.log`, `sc536-r1-obsidian-base-b2-run2.log`.

## 3. Nested render path, measured (instr bundle)
Logs: `sc536-r1-obsidian-instr-nest.log` (legitimate `@Outer.md` → effect `~~~ds-feature @Ref.md`) and `sc536-r1-obsidian-instr-cyc.log` (all 5 cycle cases, 7–8 levels each). The same values were seen at every level of every case.

| Question | Answer |
|---|---|
| Who renders the effect markdown | `ElementView.renderMarkdown` → Obsidian `MarkdownRenderer.render(app, md, el, cx.host.sourcePath, this)`. Obsidian then calls DSE's own registered `ds-feature` code-block processor (`registerFrameworkElements.ts:75`) **synchronously inside that call** (`renderDepth: 1` at the processor). |
| Nested `blockKey()` | `Lifecycle/sc536-cycle.md::ds-feature::e1649628693f66e5`: the `docId` fallback, because `getSectionInfo(el)` is `null` (`ReadingModeBlockHost.ts:723-731`). A new random docId each level, so the `IN_FLIGHT_REFS` key never matches. |
| Nested `sourcePath` | The OUTER note at every level (`ctx.sourcePath` = what `renderMarkdown` passed). So a raw reference resolves identically at every level. |
| Nested el inside the parent card's root? | **(a) At the processor call:** `el.isConnected = true`, root node is `document`, 1 DSE ancestor per level, and inside the exact element handed to `renderMarkdown`. **(b) At mount / guard:** the parent RefUnwrapView root contains it (`refAnc = [all ancestors]`), connected. **(c) After the lookup:** still contained, still connected. The top-level block (not nested) is detached at processor time (`top: DIV`), and connected by mount time. |
| RenderContext / host survive into the nested block? | No. A fresh RenderContext per level (cx ids 1,2,3… distinct), a fresh `ReadingModeBlockHost`. `ctx` keys: `docId, sourcePath, frontmatter, promises, addChild, getSectionInfo, replace, containerEl, el, displayMode, replaceCode`. No plugin object, no `remainingNestLevel`. `ctx.containerEl` is the element given to `renderMarkdown` (contains `el`). |
| Ordering | The parent's `finally` (which deletes its `IN_FLIGHT_REFS` entry) runs right after the nested view's guard check (`ruv-guard` id 8, then parent `ruv-finally` id 9). `renderFeature` renders effects fire-and-forget (`void renderMd`, `renderFeature.ts:601`). So in-flight state is not a reliable ancestry signal: a deeper or slower nested block can arrive after the parent's entry is gone. |
| Live Preview | The same `ReadingModeBlockHost` (mode `reading`), the same fallback key, the same DOM containment. |

## 4. Recommended design (one)

**DOM-ancestry reference guard in `src/elements/shared/RefUnwrapView.ts`; nothing else in `src/` except removing `isUnloaded()` from `view.ts`.**

### 4.1 Structure
- `const MAX_REF_DEPTH = 5;`
- `interface RefChain { targets: ReadonlySet<string>; depth: number }`
- `const REF_CHAIN = new WeakMap<HTMLElement, RefChain>();`
- `nearestChain(root)` walks `root.parentElement` upward and returns the first entry.
- `onMount` begins with `REF_CHAIN.delete(root)`, next to the existing `this.resolveGen++`. Every mount (inline, refused or a new reference, including `onUpdate`, which re-enters `onMount`) starts with no chain on this root. Nested blocks inside a now-inline card therefore never see a stale ancestor.
- In `resolveAndMount`, before any lookup: if `nearestChain(root)?.depth >= MAX_REF_DEPTH`, show the error card and return. **No lookup is made for the refused level.**
- `claimChain(root, raw, targets)` runs immediately before each `mountBase`, after the last `resolveGen` check:
  - If the parent chain intersects `targets`, show the cycle card and return false.
  - Otherwise set `REF_CHAIN(root) = { targets: parent ∪ targets, depth: parent.depth + 1 }`.
  - A superseded resolution can never stamp a chain.
- Children exist only after `mountBase` (they are in the base view's rendered markdown), so stamping before `mountBase` is always early enough. That holds even though nested processors run synchronously inside it.
- Prototype diff: `sc536-r1-proto-RefUnwrapView.diff.txt` (84 lines). tsc and eslint clean.

### 4.2 What "the same reference" means
- The **resolved target**, not the raw text.
  - Legacy `@path` / `[[wikilink]]`: `file:${resolved.file.path}`. Both built-in providers always set `.file` (`refs.ts:128-145`). Fallback for a custom provider without a file: `raw:${base.id}|${trimmed}`.
  - SCC ladder: `scc:${code}` **and** `file:${entity.file.path}`. A legacy `@path` to a compendium file and its SCC code then meet.
- Measured: `[[Cyc]]  ` (alias + 2 trailing spaces) then `@Cyc.md` is refused at level 2 (prototype). Raw-text matching would miss it, and base runs away.
- Trailing spaces are already trimmed (`raw.trim()`), and `codeFromRaw` drops `scc:`/`scc.v1:` and `#anchor`.
- The check runs after the lookup. A self-cycle therefore costs exactly one extra lookup (measured: 2 lookups total). A pre-lookup raw-text check could save that one lookup, but adds a second key family. Not recommended.
- Why `sourcePath` is not part of the key: nested renders reuse the outer note's `sourcePath` (measured), so the resolution is context-free inside one chain.

### 4.3 Where the ancestry lives: WeakMap, not a data attribute or RenderContext
- **RenderContext cannot carry it.** Obsidian's processor starts fresh: new cx, new host, no plugin handle on `ctx` (measured). Threading it would need a module-level "currently rendering" stack. That works only because the nested processor happens to run synchronously, and `pipeline.run` awaits `prepareModel` before mount, so the stack would have to be captured at processor entry and passed by hand. It is fragile, and it touches `registerFrameworkElements` and the pipeline.
- **WeakMap keyed on the root:**
  - No DOM footprint, so freeze, parity and shots are unaffected.
  - Markdown-authored HTML cannot forge it.
  - It moves with the root under SC-340 adoption (`adoptView` re-parents the same root node).
  - It dies with detached roots.
- A data attribute would work just as well functionally. It is only needed if a lifecycle or e2e probe must read the chain. The scenarios below assert visible outcomes instead.

### 4.4 Depth cap
- `MAX_REF_DEPTH = 5`, counted as the number of **reference-resolved** RefUnwrapView roots on the DOM chain, the outermost reference being 1. Inline cards and non-reference elements do not count.
- The 6th nested reference shows `Reference nesting too deep — more than 5 references inside one another.` without a lookup.
- Measured on the prototype: 7-chain shows 5 cards, then the cap card, then stops.
- Why 5: spec §9 calls practical depth 1, and homebrew chains are 2–3 deep. Branching blows up fast without a cycle: a 3-way fan-out is 3^5 = 243 cards at 5 and 6,561 at 8. Owner's call; anything 4–8 is defensible.
- What the cap backstops: any target-identity miss, for example a custom provider without a file or two files that mirror each other under different paths. Every such chain stays bounded.

### 4.5 `IN_FLIGHT_REFS`, `isUnloaded()`, `resolveGen`
- **`IN_FLIGHT_REFS`: remove.** Its only job was cycle refusal. Its block-identity key is the cause of both bugs. The SC-525 owner token / takeover logic goes with it. The SC-525 form fix becomes structural: the preview slot has no RefUnwrapView ancestor, so it is never refused.
- **`ElementView.isUnloaded()`: remove.** `RefUnwrapView.ts:181` is its only caller (repo grep). Keep the private `unloaded` flag: SC-519's `openAfterPendingWrite` uses it (`view.ts:332`). INFO-1 of the SC-525 review (M3 OOM) no longer applies: nothing judges an owner dead any more.
- **`resolveGen`: keep exactly as is.** Every SC-525 r3/r3b/r5 re-entrance and await-window test passes on the prototype (refUnwrapView suite: 34 passed, the only 3 failures are the Bug-2 pins listed in §5.2). `claimChain` must stay after the last gen check (mutant to run: move it before, and test 5.2-10 must go red).
- The `IN_FLIGHT_REFS` doc comment (`RefUnwrapView.ts:38-70`) is rewritten for the new guard.

### 4.6 Hosts
- **Reading view:** measured (above).
- **Live Preview:** measured. It uses the same processor and host. Prototype: 2 lookups, then stopped.
- **Sidebar:** not measured, reasoned. `SidebarBlockHost` mounts the pinned card into its panel body. Nested blocks in that card go through the same `MarkdownRenderer` → processor path inside the panel's DOM, so ancestry holds the same way. A sidebar remount empties `bodyEl`, so old roots leave the tree and their WeakMap entries are no longer ancestors of anything.
- **Two panes, popouts, plugin re-enable, `rerender(true)`:** disjoint DOM, so never refused. Measured 0/5, 0/3 and all held variants clean on 2 runs.
- **jsdom form preview:** `FormModal.renderPreview` mounts each keystroke's view in its own `.dse-form__preview-slot` in the modal. No ancestor chain, so the SC-525 retype case cannot recur. `formModalStalePreview.test.ts` is 28/28 green on the prototype.
- **Hover popovers and embeds:** a popover is not inside the card, so it starts a fresh chain. That is correct: it is one level per user hover.

### 4.7 `ReadingModeBlockHost.ts`
- **No change.** The `docId` fallback blockKey stays: it is still the right key for session UI state.
- The design never reads `blockKey()` for refs, so SC-481 (reconcile/remountReused) is untouched and no dispatcher coordination is needed.

### 4.8 User-facing wording and docs
- Wording (owner/Scott): keep the `Reference nesting too deep` prefix, which existing tests and probes match with `/nesting too deep/i`.
  - Cycle: "`@Cyc.md` is already shown by a card this one is inside (a reference cycle)."
  - Cap: "more than 5 references inside one another."
  - "already resolving in this block" is no longer true and should go.
- Docs:
  - CHANGELOG `## Unreleased` bullet (user-facing fix).
  - dse-verify SKILL: add G-S56 to the lifecycle list and update CURRENT (lifecycle 42).
  - `view.ts:291-298` comment.

## 5. Plans

### 5.1 Lifecycle scenario G-S56 (deterministic; holds at hooks, never timers)
Fixtures:
- `Ref.md` (feature "Ref Strike").
- `Cyc.md`: a feature "Cycle Strike" whose effect is `|-` markdown holding `~~~ds-feature` / `@Cyc.md` / `~~~`. The kit's `sc536Nest()` builds it.
- `CycA.md` / `CycB.md` (optional).
- `Lifecycle/gs56-cycle.md` (`@Cyc.md`) and `Lifecycle/gs56-refcard.md` (`@Ref.md`).

Hooks: hold `services.refs.resolve` (phase a), and hold `app.vault.read`/`cachedRead` by path (phases b–d, because that hook survives a re-enable). "Settled" = no lookup or read in flight except held ones, then 2 rAF, then recheck.

| Phase | Steps | Asserts | Base (measured) |
|---|---|---|---|
| (a) cycle, Reading view | Hold lookups. Open `gs56-cycle.md`. Repeat up to 6 times: settle; if nothing is held, stop; else release one. | Stopped after ≤ 2 lookups. Exactly 2 feature roots in the pane: the card plus one error card nested one level inside it, matching `/nesting too deep/` and naming `@Cyc.md`. Settled. No page error. | FAIL: a 3rd-level lookup starts (8/8 levels in the probe) |
| (a′) the same in Live Preview (`mode: 'source', source: false`, scope `.markdown-source-view`) | as (a) | as (a) | FAIL: 8/8 |
| (b) two live copies | Pane 1 shows the card. Hold `Ref.md` reads. Split pane 2 onto the note. `pane1.previewMode.rerender(true)`. | 2 reads held at once. Release FIFO, settle: each pane shows exactly one "Ref Strike" card and no nesting card. Repeat with LIFO. | FAIL: held 1; pane 1 refused, stays refused (both orders, 2 runs) |
| (c) plugin off/on | Two panes. Hold `Ref.md` reads. `disablePlugin` + `enablePlugin`. | 2 reads held. Release FIFO (then LIFO on a second pass): both panes show the card, no nesting card. | FAIL: pane 2 refused (both orders, 2 runs) |
| (d) redraw twice | Hold. `rerender(true)` twice. | 2 reads held. Release: one card, no nesting card. | FAIL: nesting while held and after |

- Optional anti-vacuity for (a): `@Chain1..7` shows 5 cards and the cap card, and only 5 lookups are made (base: 7 cards, no card for the cap).
- Leave the natural-timing variants (split + redraw same tick, base 3/5 and 4/5; plain plugin off/on, base 3/3) **out of the gate**: they are timing-dependent. (b) and (c) are their deterministic forms.
- After (a) on base the held lookup is simply never released, so the base run stays bounded.
- Measured cost: the 4 probe scenarios together run in about 60–90 s, so G-S56 alone is well under a minute. Put it in the second lifecycle half. Probe form: `S536-CYC` + `S536-B2` in `sc536-r1-obsidian-scenarios.js.txt`.

### 5.2 jsdom test plan
**Must change.** Measured on the prototype (`sc536-r1-jest-proto.log`, `sc536-r1-jest2-ruv-proto.log`).

In `test/dom/elements/refUnwrapView.test.ts`, describe `in-flight depth guard (SC-525)`. Its `setup()` nests by running the pipeline on the SAME host, so nested roots are siblings with one blockKey. That is not real nesting.
1. "a cycle A -> B -> A in one live block is refused at the second A": **OOM** under ancestry (siblings are never ancestors). Rewrite on the nested-host model below.
2. "a reference to itself (A -> A) is refused": **OOM**. Rewrite.
3. "a self-reference (A -> A) still stops when its view was updated while its lookup ran": **OOM**. Rewrite.
4. "two live views in one block resolving the same reference at once: the later one is refused…": **fails** (it pins Bug 2). Invert: both render, both release orders.
5. "a superseded owner's late finally leaves the new owner's entry in place: a third live view is still refused": **fails**. Delete (the map is gone) or invert to "three live views all render".
6. "the earlier resolution of an updated view settling leaves the later one's entry: another live view is still refused": **fails**. Same treatment as 5.
- Still green and kept: "once a resolution settles…", "an unloaded view's pending lookup does not block…", every `resolveGen` test (same-view re-entrance, A→B, SCC re-entrance, the r3b inline/refused supersede, each r5 await window). Retitle the describe and drop the INFO-3 per-setup blockKey comment.

In `test/dom/elements/displayCardHybrid.test.ts`:
- "(d) depth guard: a code already resolving in the SAME block is refused": **fails**. It re-enters during `getEntity`, before the outer card has mounted. That path does not exist in real Obsidian: nested blocks only exist after `mountBase`.
- Rewrite: after the outer `scc.v1:<SELF_REF_CODE>` card mounts, run the same code through a host whose `containerEl` is inside the outer root's `.dse-card__body` (what the processor does for the fixture's nested `ds-kit` fence). Assert the inner root shows the nesting card. This covers the SCC identity `scc:<code>` / `file:<path>`.

In `test/dom/authoring/formModalStalePreview.test.ts`: no assertion change (28/28 green on the prototype). Update the INFO-3 comment at :66 about the module-level map.

**New red-then-green tests** (new describe `reference ancestry guard (SC-536)` in `refUnwrapView.test.ts`).
- Model: the base view's `onMount` does `const slot = root.createDiv()`, then `pipeline.run(def, next, makeHost(slot, '<unique nested key>'))`. Run every nesting test twice: awaited and fire-and-forget (`void`, as `renderFeature` does).
- Include a probe-style view brake (cap of about 30) so the red run cannot OOM.
- Probe evidence: `sc536-r1-probe-jsdom.test.ts.txt`, base 8 of 10 red (`sc536-r1-jest2-probe-base.log`: 31 views for A→A and A→B→A, 7 cards for the 7-chain, Bug 2 refused). Prototype 10/10 green (`sc536-r1-jest2-probe-proto.log`).

Tests:
1. A→A: one card, one nesting card nested one level down, bounded views. (Red on base: 31.)
2. A→B→A: cards A, B; the nesting card inside B.
3. Alias: outer `[[A]]`, inner `@A.md`, both resolving `file:A.md`: refused at level 2. Also outer `@A.md  ` (trailing spaces).
4. SCC: a code whose body nests the same code is refused. An SCC entity whose `file` equals a nested `@path` target is refused.
5. Depth cap: 7 distinct references give 5 cards and the cap card. Assert `refs.resolve` was called exactly 5 times (no lookup for the refused level).
6. Legitimate nesting renders: A→B; A's body referencing B twice (siblings) gives both; a diamond A→{B,C}→D gives D twice.
7. Bug 2: two live copies with the same blockKey, both lookups held at once, FIFO and LIFO: two cards, no nesting card. (Red on base: held 1, refused.)
8. Updated to inline clears the chain: a ref card A updated to an inline body whose content nests `@A` → the nested A renders (`REF_CHAIN.delete` at `onMount`).
9. A superseded resolution never stamps a chain: hold `@A`, update the view to `@B` and let it draw, release the stale `@A`. A nested `@A` inside B renders, and a nested `@B` inside B is refused.

Mutants to run:

| Mutant | Must go red |
|---|---|
| Drop the cycle check | 1–4 |
| Drop the cap | 5 |
| Drop `REF_CHAIN.delete` at `onMount` | 8 |
| `claimChain` moved before the last gen check | 9 |
| Key on the raw text instead of the file | 3 |
| Walk only one parent level | 2 |

## 6. Risks and notes
- **DOM containment is the invariant the guard relies on.** Today every `renderMarkdown` caller passes an element created inside the card (`container.createDiv(...)` / `card.createDiv(...)`; `layouts.ts`, `CardLayout.ts`, `renderFeature.ts`, `party`, `montage`, `negotiation`, `featureblock`, `roll`). A future caller that renders into a detached element and moves it in later would defeat both the cycle check and the cap. Add one line to `renderMarkdown`'s doc comment, and keep the fire-and-forget jsdom variants.
- Cost is one `parentElement` walk (tens of nodes) per resolution.
- Untouched by this design: the `docId` fallback key, which is still used by session state (`cx.session`), and SC-525's form slot model.
- The kept FAIL temp dir from my first instr run (`/tmp/dse-obsidian-lifecycle-XQT5C6`, my own) was deleted by literal path. The Xvfb `:160`/`:161` processes seen afterwards belong to other sessions (cwd `sc522-lp-embed-scroll` and the workspace main checkout, started after my last run) and were not touched.

## 7. Artifacts (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc536-ref-cycle-guard/`)
- Scripts:
  - `sc536-r1-build-bundles.sh.txt`, `sc536-r1-patch-instr.py.txt`, `sc536-r1-patch-proto.py.txt`, `sc536-r1-proto-RefUnwrapView.diff.txt`
  - `sc536-r1-obsidian-kit.js.txt`, `sc536-r1-obsidian-scenarios.js.txt`, `sc536-r1-obsidian-run.sh.txt`
  - `sc536-r1-probe-jsdom.test.ts.txt`, `sc536-r1-jsdom-run.sh.txt`, `sc536-r1-jsdom-run2.sh.txt`
- Real-Obsidian logs:
  - `sc536-r1-obsidian-base-run1.log`, `sc536-r1-obsidian-base-cycn.log`, `sc536-r1-obsidian-base-b2-run2.log`
  - `sc536-r1-obsidian-instr-nest.log`, `sc536-r1-obsidian-instr-cyc.log`
  - `sc536-r1-obsidian-proto-run1.log`, `sc536-r1-obsidian-proto-cycn.log`, `sc536-r1-obsidian-proto-b2-run2.log`
- jsdom logs:
  - `sc536-r1-jest-base.log`, `sc536-r1-jest-proto.log`
  - `sc536-r1-jest2-probe-base.log`, `sc536-r1-jest2-probe-proto.log`
  - `sc536-r1-jest2-ruv-proto.log`, `sc536-r1-jest2-form-proto.log`
