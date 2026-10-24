# SC-509 r1: diagnosis report (reviewer A)

## Executive summary
- **Root cause (confirmed by runtime evidence):** `ReadingModeBlockHost.replaceSource` (`src/framework/host/ReadingModeBlockHost.ts:571`) gives a view-adoption claim ticket to every write, whoever made it. The form's Save (`src/authoring/FormModal.ts:444`) writes through that same `cx.host`, so Obsidian's rebuild of the section (`src/framework/registerFrameworkElements.ts:75-78`) claims the old view (`viewRegistry.ts:137-198`). `adoptView` (`adoptView.ts:106-124`) then moves the old root, still holding the old model, into the new section. Nothing calls `update()`, so the card keeps the old content.
- **Sidebar copy, a second mechanism of the same kind:** `SidebarBlockHost.replaceSource` records every write as `lastWritten` (`SidebarBlockHost.ts:336`). The self-echo guard (`:438`) then treats the form's write as the panel's own echo and swallows it, so the panel stays stale.
- **Scope, measured in real Obsidian 1.15.0:** Reading view is stale for all three element kinds tested: montage (raw box), counter (raw box) and stamina-bar (typed fields). The sidebar panel is stale when the save comes from its own pencil. Live Preview is **not** affected (claim misses and the card redraws). The note's copy is fresh after a sidebar save.
- **Control:** with the adoption kill switch off at runtime, the same Reading-view save redraws correctly.
- **Recommended fix, outside FormModal:** tag the writes that come from a view. `ElementView.flushPersist` passes `{ fromView: true }` (`view.ts:322-323`). `ReadingModeBlockHost` creates a ticket only for those writes, and `SidebarBlockHost` keeps `lastWritten` only for those writes. `BlockHost.ts:90` gets the optional second parameter. FormModal and pipeline.ts do not change.
- **Fix tested as a throwaway patch (since reverted):** jest probe: all four cases redraw. Real Obsidian: Reading montage, counter and stamina, plus the sidebar, all show the new content. In-card click adoption still holds (same root, claim hit). 13 existing unit tests need a mechanical update (they call `host.replaceSource` directly or assert its exact arguments).
- **Why the gates miss it:** jest's form tests use a stub host or a fresh-host re-render, never the registered processor's claim. e2e has no form spec. Lifecycle G-S32 opens the form but cancels with Escape and never saves.
- **Tests:** a jest red test through the registered processor with the real FormModal, and lifecycle **G-S40** (spec in §5).

## 0. Tree and setup
- Worktree `/home/scott/code/steelCompendium/worktrees/sc509-form-save-refresh/draw-steel-elements` at `054c9c5`. `git status --porcelain` was empty before and is empty after.
- The worktree had no `node_modules`. I ran `npm ci` (ignored by git; left in place for the implementer). Build outputs `main.js`, `main.css` and `styles.css` were removed again by exact path.
- Throwaway edits, all restored: a jest probe file (deleted), a probe scenario appended to `visual-harness/obsidian-lifecycle.mjs` (restored with `git checkout`), and the candidate fix in 4 src files (restored with `git checkout`). No commits.
- Lifecycle probe runs used port 9309 and Xvfb `:160`/`:161`. Both temp dirs were auto-removed (no FAIL shot). No leftover processes.

## 1. Reproduction and scope (real Obsidian 1.15.0, probe scenario `ZZ-SC509` in the lifecycle harness)
Method: authoringControls on; JS click on the block's `Edit …` pencil; edit the form (the raw textarea, or the "Current stamina" field); **real CDP click on Save**; wait for the form to close; wait 3 s; read the card text, the file, whether the DOM root is the same (`__lcTag`), and a spy on `viewRegistry.claim` that logs each processor call's result.

| Case | File after Save | Card 3 s after Save | Same root | claim() for the rebuild | After leaving and reopening the note |
|---|---|---|---|---|---|
| Reading view, montage `title: The Heist` -> `Other Job` | `title: Other Job` | **old** ("The Heist") | yes | **hit** | new |
| Reading view, counter `name: Health` -> `Wounds` (raw box) | written | **old** | yes | **hit** | new |
| Reading view, stamina-bar `current_stamina 15` -> `7` (typed field) | written | **old** | yes | **hit** | new |
| Reading view, montage, **adoption off** (`viewRegistry.enabled=false`) | written | new | no | miss | — |
| Live Preview, montage | written | new | no | **miss** | — |
| Sidebar panel (pinned montage), Save from the panel's pencil | written (+`_dse_anchor`) | **old** in the panel | yes | miss (the note copy's rebuild) | — |
| The same, the note's own Reading copy | — | new | — | — | — |
| In-card control: counter Increase | `current_value: 4` | — | yes | hit (adoption contract) | — |

- The stale result hits **every element the Reading-view form edits**: the montage and counter raw box, and the stamina-bar typed fields. The writer and the adoption path do not depend on the element.
- `ds-hero`'s "Edit definition" (`src/elements/hero/view.ts:257`) calls the same `openFormEditor` with the same `cx.host`, so by construction it has the same bug. I did not measure it.
- Live Preview: claim missed and the card redrew. This matches G-S18, where Live Preview trackers are always drawn fresh. I did not trace why the claim misses there; it does not affect the fix, which only removes tickets.
- Evidence: `sc509-r1-base-probe.json`, `sc509-r1-base-*.png`. In `sc509-r1-base-reading-montage.png` the card reads "THE HEIST" after Save, while the file reads `title: Other Job`.

## 2. Mechanism (file:line)
1. `FormModal.save()` calls `this.cx.host.replaceSource(this.currentBody())` (`FormModal.ts:444`). `cx.host` is the block's own `ReadingModeBlockHost`, the same host the view's `persist()` uses (D9 OD-D9-12, "no parallel writer").
2. `ReadingModeBlockHost.replaceSource` takes `const ticket = this.entry && this.registry ? this.registry.noteWrite(this.entry, newSource) : null` (`ReadingModeBlockHost.ts:571`). Nothing checks who wrote. Inside `vault.process` it then sets `this.knownBody = newSource` (`:601`), so `lastKnownBody` equals the new body.
3. Obsidian fires `modify` and runs the section's processor with the new body. `registerFrameworkElements.ts:75` calls `registry.claim(docId, sourcePath, source)`. Both of claim's tests pass: `lastKnownBody === wanted` (`viewRegistry.ts:155`) and a matching ticket (`:160`). claim returns the old entry.
4. `adoptView` (`adoptView.ts:113-117`) rebinds the host and does `el.appendChild(entry.root)`, the old root with the old model. The processor returns without `pipeline.run` (`registerFrameworkElements.ts:79`). No `view.update(model)` happens anywhere, so the card stays stale until the note is reopened and the section is built fresh.
5. Sidebar: `SidebarBlockHost.replaceSource` sets `this.lastWritten = extractBody(next, …)` for every write (`SidebarBlockHost.ts:336`). `applyFreshContent` returns early on `body === this.lastWritten` (`:438`), so `SidebarPanel.handleExternalChange` (`SidebarPanel.ts:269`, whose fast path would call `previous.update(model)`) never runs.

Runtime proof:
- Jest probe at base: adoption on gives `claims:1`, `adoptedSameRoot:true`, `cardHasOld:true`, and `ticketsAfterSave:["title: Other Job"]`. Adoption off gives a fresh view and the new content.
- Real-Obsidian claim spy: `{"body":"title: Other Job","hit":true}` for the Reading-view montage. The same spy shows hits for counter and stamina.

## 3. Why jest, e2e and lifecycle miss it
- `test/dom/authoring/formModal.test.ts:46-48` uses a stub `replaceSource` that only records writes.
- `test/dom/authoring/formModalEmptyYaml.test.ts:85-90` builds a `ReadingModeBlockHost` **without a registry** (so no ticket) and re-renders by calling `pipeline.run` on a **fresh host**. It never goes through the registered processor's `claim`.
- `test/dom/framework/view-adoption.test.ts:489-519` (SC-340 §9.2) exercises the pencil but mocks `openFormEditor`. Save is never reached.
- e2e (`e2e/`): no spec opens or saves the form.
- Lifecycle: G-S32 (`obsidian-lifecycle.mjs:2180-2270`) opens the form, closes it with Escape, and asserts the note is byte-identical. No scenario saves from the form.

## 4. Fix options
| # | Where | How | Adoption-contract risk | Outside FormModal? | Verdict |
|---|---|---|---|---|---|
| **A** | `view.ts:322-323`, `BlockHost.ts:90`, `ReadingModeBlockHost.ts:541,571`, `SidebarBlockHost.ts:302,~350` | A write says where it came from: `replaceSource(body, { fromView: true })` from `flushPersist` only. Reading host: a ticket only when `fromView`. Sidebar host: `lastWritten = null` when not `fromView`. Any other writer (form, hero definition editor, future callers) gets the external-edit path: a fresh view in Reading view, `update()` in the sidebar. | In-card writes are unchanged. Measured: counter Increase still adopts the same root with a claim hit. The SC-198/SC-470 scroll pin is still taken for the form write (`ReadingModeBlockHost.ts:612-618` does not depend on the ticket). The SC-478 Live Preview hold captures on every `modify`. A fresh rebuild after a form save is the path an external edit already takes, and that path is already gated (G-S5, G-S8 adoption-off, G-S15, G-S18 b1/b2). The defaults fail safe: a future writer that bypasses `persist()` gets a correct but fresh render, never a stale one. | **Yes.** FormModal and pipeline.ts are untouched. FormModal's preview host `replaceSource: async () => false` stays type-compatible. | **Recommended** |
| B | `pipeline.ts:664,715` | Pass the form a `cx` whose host is wrapped so its write drops the ticket. | The wrapper must forward getters (`lastWriteReported`, `canPersist`, `mode`, and others). A `{...host}` spread or `Object.create(host)` breaks private-field writes. It also misses hero's direct `openFormEditor(this, this.cx, …)` (`hero/view.ts:257`). | Yes | Reject |
| C | `registerFrameworkElements.ts:75` / `viewRegistry.claim` | On a claim, compare `serialize(view.currentModel())` with the body, and release on a mismatch. | Breaks coalesced in-flight writes: the view's model has already moved past the flushed body while the next `persist()` is pending, so in-card interactions would re-mount (G-S1/G-S3 regression). Serializers reorder keys (seen: the counter writes `max_value… current_value… name`). | Yes | Reject |
| D | the processor | Adopt, then `view.update(prepareModel(source))` when the body differs from the view's own last write. | Needs async `prepareModel` in the processor and a per-view "last own write" record. The default `update()` empties the root, so it is no smoother than a fresh view. | Yes | Reject (more code, no gain over A) |
| E | `FormModal.ts:444` | Save passes `{ adopt: false }` (opposite default). | Keeps today's default (tickets for everything), so no unit tests change. | **No** (conflicts with SC-494) | Fallback only if A is refused |

### Candidate A, measured (throwaway patch, now reverted; diff kept at `…/candidate-fix-src.diff`)
- `tsc --noEmit`: clean.
- Jest probe: all 4 cases (montage and counter, adoption on and off) give `cardHasNew:true` and `claims:0`.
- Real Obsidian, candidate bundle via `DSE_LIFECYCLE_BUNDLE` (`sc509-r1-candidate-probe.json`, `sc509-r1-candidate-*.png`):
  - Reading montage, counter and stamina: the new content shows, with a fresh root and a claim miss.
  - Sidebar panel: the new content shows, on the same root (the `update()` fast path).
  - Live Preview: new content, unchanged from base.
  - In-card Increase: same root, claim hit (the contract holds).
- Jest over `test/dom/framework`, `test/dom/authoring` and `test/dom/elements`: **13 failed / 2659 passed**. All 13 are mechanical:
  - 7 in `sidebarBlockHost.test.ts`: self-echo tests call `host.replaceSource(body)` directly; they should pass `{ fromView: true }`.
  - 2 in `view-registry.test.ts` (`:176`, `~:255`): ticket tests call the host directly; they should pass `{ fromView: true }`.
  - 3 in `element-view.test.ts` and 1 in `pipeline.test.ts`: they assert `replaceSource` was called with exactly `(yaml)`; they should expect `(yaml, { fromView: true })`.
- The implementer should run the full battery. I ran no full battery (brief bound).

## 5. Test plan
**Jest red test.** Add a `describe('SC-509 …')` to `test/dom/framework/view-adoption.test.ts`, or a new `test/dom/framework/formSaveRedraw.test.ts` reusing that file's `setup(…, enabled=true, authoring=true)` and `render()` helpers:
- Render the block through the **registered processor** (`plugin.registeredProcessors.get(alias)`). Click the real `.dse-btn[aria-label^="Edit "]` pencil, which opens the real FormModal.
- Type into `textarea.dse-form__raw` (`title: The Heist` -> `title: Other Job`) and click `.dse-modal__footer button[aria-label="Save"]`. Flush.
- Call `render(alias)` again, standing in for Obsidian's rebuild, then unload the old render child.
- Assert:
  - `ctx2.el.textContent` contains `Other Job` and not `The Heist`;
  - `ctx2.el.firstElementChild !== root1`;
  - `registry.stats.claims === 0`;
  - and, before the rebuild, `registry.liveEntries()[0].tickets.length === 0`.
- `test.each` over montage, counter and stamina-bar (typed fields: set the `Current stamina` input; register `FRAMEWORK_V2_DEPENDENCY_SCHEMAS` as `formModalEmptyYaml.test.ts:82` does).
- Contract pin in the same describe: an in-card Increase followed by the rebuild still adopts the same root (`claims === 1`).
- Sidebar red test in `test/dom/framework/sidebarBlockHost.test.ts`: `host.replaceSource(body)` with no `fromView` **does** fire `onExternalChange(body)`, and `host.replaceSource(body, { fromView: true })` does not.
- Measured red at base: my probe (`…/zzSc509Probe.test.ts.bak`) shows `cardHasOld:true` at 054c9c5 and `cardHasNew:true` with candidate A.

**Lifecycle G-S40** in `visual-harness/obsidian-lifecycle.mjs` (36 -> 37; update the header list and the dse-verify CURRENT line):
- Fixtures:
  - `Lifecycle/form-save.md`: `ds-montage` with `title: The Heist`, ABOVE and BELOW text;
  - a counter note (raw box);
  - a stamina-bar note (typed field).
  - Use your own notes; G-S32 leaves `stamina.md` collapsed.
- Steps per note, in Reading view:
  1. `authoringControls` on; hide the Notice stack (as G-S32 does).
  2. Tag the root.
  3. Real hover and real click on the pencil (G-S32's `hoverTo` + `realClick`).
  4. Edit the textarea or field; real click on Save; `waitFor` the form to close.
  5. `waitFor` the disk to read the new body.
  6. `waitFor` (a deadline, not a delay) the connected root's text to contain the new value.
- Assertions per note:
  - the card text contains the new value and not the old one;
  - `viewRegistry.stats.claims` did not increase across the save;
  - the tagged root is gone (anti-vacuity: proves a redraw);
  - no Notice; no page errors.
- Sidebar phase: pin (anchor stamped), click the panel's pencil, Save; the panel's montage reads `Other Job`; detach the sidebar.
- Contract control in the same scenario: an in-card counter Increase keeps the tagged root and raises `claims` by 1.
- Discrimination: run once with `DSE_LIFECYCLE_BUNDLE` pointing at a 054c9c5 build. It must FAIL on "card still reads The Heist" (Reading view) and on the sidebar phase. My probe measured exactly that at base.
- Live Preview phase optional: it passes at base, so it guards against regression only.

## Artifacts
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc509-form-save-refresh/sc509-r1-diagnose-report.md`
- Real-Obsidian probe data:
  - `…/sc509-form-save-refresh/sc509-r1-base-probe.json`
  - `…/sc509-form-save-refresh/sc509-r1-candidate-probe.json`
- Screenshots (ledger dir), each taken 3 s after Save:
  - `sc509-r1-base-reading-montage.png`, `sc509-r1-base-reading-counter.png`, `sc509-r1-base-reading-stamina.png`, `sc509-r1-base-reading-montage-adoption-off.png`, `sc509-r1-base-livepreview-montage.png`, `sc509-r1-base-sidebar-montage.png`
  - the same six as `sc509-r1-candidate-*.png`
- Scratch (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc509-r1-diag-abb0bbff5a200962d/`):
  - lifecycle probe logs: `probe-base.log`, `probe-candidate.log`
  - jest logs: `jest-probe-base.log`, `jest-probe-candidate-only.log`, `jest-candidate-dirs.log`
  - candidate diffs: `candidate-fix-src.diff` (src only), `candidate-fix.diff` (also includes the probe-scenario hunk)
  - probe sources: `zz-sc509-probe-scenario.mjs.txt`, `zzSc509Probe.test.ts.bak`
  - candidate bundle: `bundle-candidate2/`
