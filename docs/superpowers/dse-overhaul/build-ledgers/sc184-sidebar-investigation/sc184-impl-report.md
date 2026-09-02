# SC-184 sidebar fix round — implementation report

**Verdict: DONE.** All 7 approved items + both doc pushes shipped. Full gate battery green
on the rebased tree. No frozen bytes moved, no rebaseline needed.

## Rebase (course-corrected mid-task)

Built the first 4 commits on top of `c09cf6f` (the brief's stated base), then received a
mid-task correction: `origin/develop` had moved twice (SC-190 hide-ds-hero, then SC-120
steel compositions with an already-applied 24-line sanctioned freeze rebaseline).

- `git fetch origin && git rebase origin/develop` → landed on `1619396` exactly.
- **One conflict**, in `docs/advanced-usage.md`'s "Trackers are what this is for" bullet —
  develop's SC-190 side dropped the "hero sheet" example (ds-hero is hidden) in favor of
  "heroic resource or surge counter"; my side added "each panel gets its own header" /
  "whichever notes they live in" prose. Resolved by keeping develop's hero-free example and
  merging in my prose addition (`docs/advanced-usage.md`, the "Worth knowing" bullet list).
  No other file conflicted (`writing-blocks.md` and `CHANGELOG.md` auto-merged clean).
- `package.json`/`package-lock.json` unchanged across the two bases — no `npm ci` needed.
- Full battery re-run post-rebase, all green (numbers below are the rebased-tree numbers).
- `heroElement`/`ds-hero` remain a real, harness-registered `ElementDefinition` post-SC-190
  (hidden from **production** `main.ts` registration only, per the SC-149 precedent) — my
  `chrome.test.ts` edits that render `heroElement` directly (not through the registry) kept
  passing unchanged.

## What was built (approved items, file:line against the rebased tree)

**1. "Unpin" chrome item.** `src/framework/host/BlockHost.ts:75` (optional `requestRemoval?()`
seam) → `src/framework/host/SidebarBlockHost.ts:293` (delegates to a ctor-injected callback)
→ `src/framework/sidebar/SidebarPanel.ts:52,126` (`onRemoveRequested`, threaded into the
host) → `src/framework/sidebar/DseSidebarView.ts` `mountPanel` (`panel = new
SidebarPanel(this.services, state, () => this.removePanel(panel))`, definite-assignment
closure) → `src/framework/pipeline.ts:645-654` (chrome item `id:'unpin'`, gated
`cx.mode==='sidebar' && cx.host.requestRemoval`, icon `pin-off`).

**2. "Pin to sidebar" chrome item.** `src/framework/pipeline.ts:631-644` (chrome item
`id:'pin'`, gated `cx.mode==='reading' && cx.host.canPersist`, reads
`cx.host.getBlockInfo().language`/`.lineStart` for the actual fence alias/position, icon
`pin`) → `src/framework/sidebar/registration.ts:44` (`dseSidebarPinTarget`, a late-bound
module seam mirroring `encounter/view.ts`'s existing `setEncounterSidebarHandoff`) →
`registration.ts:192` (`requestPinToSidebar`, degrades to a `Notice` instead of throwing
when no plugin instance has registered a sidebar) → `registration.ts:179`
(`unregisterDseSidebar`, called from `main.ts` `onunload`). Items 1+2 shipped in one
pipeline.ts diff, as the round-2 recommendation asked.

**3. Panel header.** `SidebarPanel.ts:147` `renderHeader()` — element label (registry
`def.name`, falls back to the raw alias) + a clickable note-name link
(`workspace.openLinkText`) — rendered unconditionally in `mount()` before the body splits
into `.dse-sidebar__panel-body` (the pipeline's mount target) so a degrade card still shows
under a real header. CSS: `styles-source.css`, new section "Sidebar panel chrome: header +
empty state (SC-184)" — `.dse-sidebar__panel` (border-bottom separator between stacked
panels, last-child exemption), `.dse-sidebar__panel-header/-label/-note`. Unscoped by
`data-dse-theme`/print (Obsidian theme vars only, same convention as the existing
`.dse-error-card` rule) — this is plugin chrome around an element, not themed element
content, and unreachable by the browser harness/freeze gate by construction (`.dse-sidebar`
only ever exists in a real Obsidian ItemView leaf).

**4. `requestSaveLayout()`.** `DseSidebarView.ts:162` (end of `addPanel`'s new-panel branch)
and `:225` (end of `removePanel`) — both call `this.services.app.workspace
.requestSaveLayout()`. Not called from the private `mountPanel`/the `setState` restore path
(would fire once per restored panel for no reason).

**7. Dismiss button on degrade cards.** `SidebarPanel.ts` `renderUnavailable` (~line 254) —
now takes an `iconButton` (icon `x`, label "Remove panel") calling
`this.onRemoveRequested()`, applied to **all three** degrade cases (unknown element, note
not found, backing block gone), not just "note not found" — same removal path as item 1,
reused rather than re-implemented.

**9. Empty state.** `DseSidebarView.ts:69` (`emptyStateEl` field) + `updateEmptyState()`
(idempotent either direction) — called from `onOpen`, `mountPanel`, `removePanel`, and once
more after `setState`'s restore loop (covers the zero-panels-restored case, where
`mountPanel` is never invoked). Copy: "No pinned blocks" + an explainer naming the new
"Pin to sidebar" chrome-menu action. CSS: `.dse-sidebar__empty/-title/-message`.

**10. Delete the dead `collapsed` field.** `DseSidebarView.ts` — `SidebarPanelState
.collapsed?: boolean` deleted from the type. `setState` now runs every restored panel
through `normalizePanelState()` (new function, end of file) which rebuilds a clean object
naming only the current fields — so a `workspace.json` written before this change actually
stops carrying the dead key forward after one save/restore cycle, not just "stops being
read." `samePanelTarget`'s doc comment (which referenced `collapsed`) updated to match.

## Embed reconciliation (the ~30 min timebox)

**Finding: the "embeds are read-only" claim was never true of the code — it's a comment
that outran what was ever implemented or tested.**

`ReadingModeBlockHost.canPersist` (`src/framework/host/ReadingModeBlockHost.ts:84-87`) is
exactly:
```ts
if (this.ctx.sourcePath === '') return false; // canvas: quarantined
return this.ctx.getSectionInfo(this.containerEl) !== null;
```
Nothing here — or anywhere else in the render/host path — special-cases an embed. Obsidian's
own `MarkdownPostProcessorContext` docs describe `sourcePath` as "the path to the associated
file" and `getSectionInfo` as resolvable "in many circumstances" with no embed exclusion; in
practice, when a code-block processor runs for a block inside an `![[embed]]`, Obsidian
re-renders it through its own `MarkdownRenderer` with a real, non-empty `sourcePath` (the
*embedded* note's path) and a working `getSectionInfo`. So `canPersist` resolves `true`, and
`replaceSource` writes to the same real file through the same `Vault.process` splice reading
mode uses — which is exactly what Scott's live test observed (`![[initiative]]` editable in
both reading and Live Preview).

The false claim traces to four comment sites, none of which gate on anything embed-specific
— they just assert it in prose:
- `src/framework/host/BlockHost.ts:45` ("false: embeds, print/export, hover popovers, canvas")
- `src/elements/stamina-bar/view.ts:109` ("canPersist === false (embeds, print/export, ...)")
- `src/elements/statblock/view.ts:318` ("an embed, an export render) is data-dse-readonly")
- `src/framework/host/ReadingModeBlockHost.ts:145` (blockKey fallback comment)

The round-2 report itself flagged this as "a consistently-held assumption... I could not
find a test that pins it" — that hedge was correct; there never was one. This most likely
originated as an over-generalization from the CANVAS exclusion (`sourcePath === ''`), which
*is* real and *is* tested (`docs/canvas-character-sheet.md`'s "read-only" doctrine, its own
quarantine code path) — embeds got lumped in by association, never independently verified,
and the assumption calcified into four separate comments over time.

**Consequence for docs (honored):** none of my doc edits claim embeds are read-only, and the
"only the sidebar serves multi-note setups" pitch is worded honestly — the sidebar's actual
edge is that it aggregates blocks from *different* notes into one column; a single embed
still only shows one note's block inline in another. I did **not** edit the four misleading
comments (out of the approved-scope list; flagging as a discovered tangent, not a ticket I
filed myself per the "workers never touch the tracker" rule) — worth a small fix-round
someday so the next reader doesn't re-inherit the same false assumption.

## Docs (also shipped)

- `docs/writing-blocks.md` "## Pinning a block to the sidebar" — reframed pitch ("a GM
  dashboard assembled from blocks that live in different notes"), the new chrome-menu
  Pin/Unpin path documented as primary, the two old commands kept as "still work" fallbacks,
  and a new "### One note instead?" section for the pinned-note-tab pattern.
- `docs/advanced-usage.md` "## The sidebar" — same reframe, condensed, cross-referencing
  writing-blocks.md; merged post-rebase against SC-190's hero-free wording (see Rebase
  above).
- `docs/initiative-tracker.md` "### Pinning to the Sidebar" — same reframe, same one-note
  pointer.
- `docs/Media/sidebar.png` regenerated (`npm run docs-shots -- --only=sidebar.png`, targeted
  — did not touch any other docs image) — now shows the new panel header on a real Obsidian
  capture.
- `CHANGELOG.md` (dse repo, `## 7.0.0 (unreleased)`) — `[FIX]` entry in the repo's own
  `[TAG] **Title** (SC-key)` convention, at the top of the unreleased list.
- Workspace superproject `CHANGELOG.md` `## Unreleased` bullet, committed separately (see
  Commits below) — the workspace-level user-facing summary.

## Explicitly out of scope (untouched, confirmed)

Item 5 (reorder arrows), item 6 (rename/delete vault listeners), item 8 (unify the session
key), tabs of any kind. `SC-184` docs/comments make no promises about these.

## Gates — rebased-tree numbers (base `1619396`)

| Gate | Result |
|---|---|
| `npm run tsc` | clean |
| `npm run lint` | clean, exit 0 |
| `npx jest` | **3395 passed / 1 skipped / 189 suites / 190 total, 3 snapshots**, exit 0 (base at c09cf6f pre-rebase was 3258/1/184/185; the rebase itself added the delta, my diff added net +1 test — the new `SidebarBlockHost.requestRemoval` coverage — against my own pre-rebase base of 3257) |
| `npm run shots` | **474 PNGs, 0 FAIL** (unchanged from pre-rebase — hero fixtures stay harness-registered even though SC-190 unregistered them from production) |
| `check-freeze.sh` | **freeze OK (210/210 …)**, 0 mismatches — confirms SC-120's already-applied 24-line rebaseline held and my diff moved zero additional frozen bytes |
| `npm run parity` | **0 GAPs / 0 undeclared WARNs / 16 DECLARED**, exit 0 |
| `npm run obsidian-shots` | **59/59 shots**, all ok, incl. the 6 sidebar-special captures (`initiative`/`hero`/`statblock`/`scc`/`negotiation` sidebar leaves) |

Zero frozen bytes moved anywhere in this round — expected per the standing-order note
(sidebar is Obsidian-camera territory, chrome menu is print-absent by construction, and the
new CSS is unscoped-by-theme so it can't touch a Steel-scoped print rule).

## Evidence (all captured via a one-off ad-hoc CDP camera, `visual-harness/sc184-evidence.mjs`
— not wired into any npm script)

Copied to `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc184-sidebar-investigation/`:

- `sc184-evidence-empty-state.png` — item 9, fresh sidebar leaf, zero panels.
- `sc184-evidence-multi-panel.png` — item 3, two panels (counter + surges) stacked, each
  with its own header and a separator between them.
- `sc184-evidence-chrome-pin.png` — item 2, a counter block in Reading mode with its chrome
  menu revealed, showing the plain "pin" icon.
- `sc184-evidence-chrome-unpin.png` — item 1, the same two-panel sidebar with the surges
  panel's chrome menu revealed, showing the "pin-off" (unpin) icon distinctly (slash through
  the pin glyph) — confirmed by side-by-side zoom against the reading-mode pin icon.
- `sc184-evidence-note-not-found.png` — item 7, a panel pinned to a nonexistent note, showing
  the header, the degrade card, and the "✕ Remove panel" dismiss button.

**Discovered CDP quirk, worth keeping:** `Page.captureScreenshot` with a `clip` region
silently drops a synthetic `:hover` state a real `Input.dispatchMouseEvent` just
established — verified live (`getComputedStyle` read the chrome panel's opacity back as `1`
immediately before both an unclipped and a clipped capture of the same instant; only the
unclipped one painted it). Worked around in the evidence script by capturing full-window and
cropping afterward with Python/Pillow (both present on this workstation) rather than trusting
CDP's clip for a hover-dependent shot. Documented in the script's own header comment in case
a future round needs another hover-revealed capture from `obsidian-camera.mjs` itself.

## Commits

`draw-steel-elements`, branch `sc184-sidebar-investigation`, now at `5b1149a` (rebased onto
`origin/develop` @ `1619396`):

```
5b1149a chore(harness): ad-hoc SC-184 sidebar evidence camera
2bc96b4 docs: reframe the sidebar pitch, document the pinned-note pattern (SC-184)
d9730d4 feat(chrome): "Pin to sidebar" / "Unpin from sidebar" chrome menu items (SC-184)
1279f23 feat(sidebar): panel removal, headers, empty state, restart persistence (SC-184)
```

Workspace superproject, branch `sc184-sidebar-investigation`, now at `4c2035c`:

```
4c2035c docs(changelog): SC-184 sidebar fix round — pin/unpin, headers, empty state, persistence
```

Not pushed. `wt-finish`/landing not run (per standing orders) — the submodule pointer bump
is left for the ticket-owner's landing flow. No tags, no releases created (standing order
honored).

## Tests added/updated

- New: `test/dom/framework/sidebarBlockHost.test.ts` — `requestRemoval` delegates to the
  injected callback (twice, proving it's not a one-shot).
- Updated for the new "pin" chrome item appearing on every reading-mode/persistable-host
  render: `test/dom/framework/chrome.test.ts` (3 assertions), `chromeRound2.test.ts` (3,
  incl. re-pointing two `collapsible:false` scenarios at a `canPersist:false` host to keep
  proving "no panel when it would be empty" now that pin is gated the same way the edit
  pencil is), `test/dom/elements/stamina-bar.test.ts` (1), `test/dom/elements/statblock.test.ts`
  (1).
- `test/dom/framework/dseSidebarView.test.ts` — dropped a sub-assertion that exercised the
  now-deleted `collapsed` field's exclusion from panel identity (the field no longer exists
  to test).
- `test/mocks/obsidian-core.ts` — `FakeWorkspace.requestSaveLayout()` added (tracked no-op)
  so the sidebar tests that now call it don't throw.

## Discovered tangents (report only — not filed; ticket-owner's call)

1. The four misleading "embeds are read-only" comments (BlockHost.ts:45,
   stamina-bar/view.ts:109, statblock/view.ts:318, ReadingModeBlockHost.ts:145) — see Embed
   reconciliation above. Low-risk prose-only fix, not in this round's approved scope.
2. Only 20 of 22 elements declare `chrome:` (`ds-hr`/`ds-roll` don't) — those two never get a
   Pin/Unpin item or a removal path if somehow pinned. Neither is a realistic sidebar
   candidate (a rule and a dice-roll affordance, not trackers), so not flagged as a gap, just
   noted for completeness.
3. `visual-harness/sc184-evidence.mjs` is left in the repo, uncommitted-to-nothing (it's in
   commit `5b1149a`) but not wired into `package.json`. Ticket-owner's call whether to keep
   it (it's a documented, reusable diagnostic — see its header) or drop it at landing.

## Report path

This file: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc184-sidebar-investigation/sc184-impl-report.md`
