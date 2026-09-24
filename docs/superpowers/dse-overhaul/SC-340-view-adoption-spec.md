# SC-340 — View adoption: a block keeps its live view across its own save

**Status:** Draft for Scott's review. No product code is written until this spec and the
implementation plan are both approved.
**Ticket:** SC-340.
**Date:** 2026-09-23.
**Repo:** `draw-steel-elements/` (the DSE Obsidian plugin).
**Amends:** [F1](F1-element-framework-v2-spec.md): §3.4 (the `BlockHost` mode adapter),
§4.2 (the persisted write path), §4.5 (cleanup semantics), and the ownership sentences in
§2.4 steps 4–6.
**Depends on:** SC-343 (the stale-position write guard) landing first (§6.5).
**Evidence:** spike round 1 and round 2 reports and patches, in
`workspace/.superpowers/sdd/sc340-view-adoption/` (`sc340-spike-r1-report.md`,
`sc340-spike-r2-report.md`). All numbers below come from those runs in real Obsidian
1.14.2.

---

## 1. Problem

A DSE block saves its changes by rewriting its own fenced block in the note.

Obsidian reacts to that write by re-drawing the section that changed. It builds a new
section, runs our code-block processor on it, and then removes the old section. Today the
block's view belongs to the old section's `MarkdownRenderChild`, so the view is unloaded
with it. The processor then builds a brand-new view for the new section.

Anything that lived in the old view dies with it. Four tickets are this one cause:

- **SC-331.** The initiative tracker's condition dialog closes by itself about 400 ms
  after each click. Each click persists, the write re-draws the section, and the old
  view's unload closes its open dialog.
- **SC-339.** Selecting a creature and then opening its stamina dialog within about
  400 ms. The selection's write lands and closes the new dialog.
- **SC-336.** A click followed by navigating away within the 400 ms debounce loses the
  edit. The flush-on-unload runs, but by then the section is gone, so
  `getSectionInfo` returns `null` and `replaceSource` refuses.
- **SC-198.** Scroll jumps after a write from a tall, scrolled block. While the section
  is rebuilt its height collapses and the browser clamps `scrollTop`.
  `previewScrollPin` works around this today.

Focus, typed text, open collapsibles and in-progress selections are also lost on every
self-write. No ticket exists for those.

**Scope, corrected by spike r1 E2.** Only the section whose text changed is re-drawn.
Unchanged sibling blocks, and plain-text edits elsewhere in the note, remount nothing,
and their live `getSectionInfo` follows shifted line numbers. The earlier reading of
SC-198 ("any write tears down every rendered section") is wrong for DSE block mounts. The
preview does re-measure, but only the changed section remounts. The only whole-note
remount seen is Obsidian's own `previewMode.rerender(true)`.

## 2. Scott's rulings

Verbatim from the SC-340 decisions ledger.

- 2026-09-23: "Before going forward, this seems really fragile in general.  Is there any
  way to carry out the save in a more reliable way?  The 400ms window is small, but can be
  error prone (as evident from the backlog tickets you made).  What alternatives do we
  have?"
- 2026-09-23: "I think I choose B.  It seems like the "most correct" long-term decision,
  even if its a bit heavier of a task. Do you agree with that?"
- 2026-09-23: "The plugin isnt live, so im not super rushed to get sc-331 landed.  Id say
  kick off your refined version of B"
- 2026-09-23, answering the four asks: "1. yes / 2. yes / 3. yes / 4. yes". The ledger
  records the four asks as:
  1. Write the spec for B′ as prototyped (spec → Scott review → plan → build; no product
     code before both).
  2. Land SC-343 (stale-position corruption guard) first, standalone; SC-340 builds on
     it.
  3. Retire SC-331's per-modal fix instead of landing it; SC-331 closes when SC-340 lands;
     its branch (`sc331-condition-modal` @ 2cd5275) is kept only as a fallback until
     then.
  4. Add a real-Obsidian (headless) check of the key cases to the standard dse-verify
     battery.
- 2026-09-23: "After this work, I want to resolve sc-343". The owner read this to Scott
  as the sequence: SC-340 spec → SC-343 build and land → SC-340 plan and build.

## 3. Goals and non-goals

**Goals**

1. When a block's own write re-draws its section, the new section takes over the
   existing live view. No new view is built, so open dialogs, focus, typed text and
   collapse state survive. This is called **adoption**.
2. Writes stay live: every change still persists about 400 ms after the click. Nothing
   is held back while a dialog is open.
3. Every rebuild that is not our own write gets a fresh view, as it does today. That
   covers sync, hand edits, undo, other panes and embeds of the same note, and Obsidian's
   `rerender`.
4. Every way a view can be torn down flushes its pending write to the right block, or
   drops it visibly. None of them drops it silently.
5. If Obsidian's behaviour changes, the plugin falls back to today's behaviour. It never
   writes to the wrong place.

**Non-goals**

- **Live Preview.** It stays unsupported (ADR 2024-08-18). `LivePreviewBlockHost`
  remains a stub.
- **The sidebar host.** `SidebarBlockHost` owns its own render and already ignores its
  own echo (`lastWritten`). It is unchanged.
- **Removing `previewScrollPin`.** It stays. Adoption keeps the scroll position for
  adopted self-writes (r2 S8: held in 3/3 without the pin), but rebuilds that are not
  adopted still need it. Examples are another pane or embed of the same note, and a claim
  that misses. Removing it is a separate decision after SC-340 lands.
- **Obsidian's own leaked embed copies.** Opening a note that embeds a block sometimes
  leaves a second, detached copy of the embedded view loaded until the leaf closes (4/4
  r2 runs). SC-343 refuses that copy's writes. SC-340 never adopts it (§6.2), and does
  not try to fix the leak.
- **ds-conditions' existing close-deferral** (`src/elements/conditions/panel.ts`
  ~:155–183, SC-186). It keeps working unchanged. Whether to return it to live persist is
  open question Q3.

## 4. The Obsidian behaviour this relies on

"API" means documented in `obsidian.d.ts` or the developer docs. "Observed" means
measured in 1.14.2, or read from its `app.js`.

| # | Behaviour | Measured | API or observed | If a future Obsidian changes it |
|---|---|---|---|---|
| B1 | The new section's processor runs **before** the old render child unloads. Obsidian's `cleanupParentComponents()` waits until every async post-processor (including our `pipeline.run` promise) has settled. | 15/15 (r1 E1); 38/38 adoptions (r2). The old unload came 44.7/52.1/96.1 ms (min/median/max) after the new processor call. | Observed | The old view unloads first, so it is no longer a candidate: the claim misses and a fresh view is built. **Same as today.** |
| B2 | The processor call follows `vault.modify` within milliseconds. | 2.5/4.7/9.8 ms (r1 E1, n=15). | Observed | A rebuild later than the 3 s claim window misses the claim. Same as today. |
| B3 | The processor's `source` equals the body we wrote. | 15/15 (r1 E1); 38/38 (r2). | Observed | We compare after trimming trailing whitespace. Any other difference misses the claim. Same as today. |
| B4 | `ctx.docId` stays the same for one rendered document across rebuilds, and differs between a pane, an embed, and a second pane of the same note. | Stable 5/5 (r1 E1) and in every r2 S4 write; distinct in every pane/embed pairing (r1 E4, r2 S4). | The field is API; stability and distinctness are observed. | Unstable across rebuilds: the claim misses. Same as today. **Collision between instances is the one case that does not fall back cleanly:** the wrong instance could take the view. The guard is in §6.2. |
| B5 | Only the changed section re-renders. | 0 sibling remounts over 3 self-writes and 4 plain edits (r1 E2). | Observed | Unchanged siblings get fresh views. They hold no claim ticket, so this is the same as today. |
| B6 | At processor time the new `el` is detached from the document, but `ctx.getSectionInfo(el)` already resolves. Once a section has been replaced, `getSectionInfo` on its old `el` returns `null`. | 15/15 (r1 E1); r1 E5b. | Observed | Rebind reads position lazily, and the durable locate (SC-343) covers `null`. |
| B7 | The section is taken out of the document and put back within one task: no frame is painted in between. | 0 painted frames in 38/38 adoptions; 5–185 ms wall time, median 41 ms (r2). | Observed | The block would be blank for one frame. Cosmetic only. |
| B8 | `Component.removeChild` always unloads the child. There is no reparent operation. | `app.js`: `splice` then `unload()`. | API (documented) | The design already avoids it: views are never children of the render child (§6.1). |
| B9 | Reading → Source does not unload the preview. Its views stay loaded while hidden. | r2 S6 c. | Observed | A later rebuild is claimed or misses. Either way it is safe. |
| B10 | Scrolling never unloads sections. Off-screen sections stay loaded (detached) and rebuild immediately after a write. | r1 E3, 4 notes up to 120 000 px. | Observed | Not relied on. The root moves synchronously whatever the insertion timing. |
| B11 | The Electron in Obsidian is Chrome 106, which has no `Element.moveBefore`. A focused input inside the section fires `change` (if dirty) and `blur` when the section leaves the document. | r2 S3: `change` and `blur` once each, then refocused. | Observed | A newer Chrome with `moveBefore` would let us avoid the blur. That is an optional later improvement. |

The real-Obsidian gate (§10.2) re-measures B1, B3, B4 and B7 on every battery run. A
change in Obsidian shows up as a failed gate, not as a user report.

## 5. Design overview

```
processor(source, el, ctx)
  ├─ registry.claim(ctx.docId, ctx.sourcePath, source) ──hit──▶ adopt: host.rebind(el, ctx);
  │                                                              move view root into el (sync)
  └─ miss ──▶ pipeline.run(def, source, new ReadingModeBlockHost(...))
                 └─ registry.own(view, host)   (never host.addChild for reading mode)

host.replaceSource(body) ──▶ registry.noteWrite(entry, body) ──▶ vault.process(...)   [SC-343 guard + locate]

old render child unloads ──▶ superseded by rebind? do nothing
                          └─ current?            registry.release(entry): flush, then view.unload()
```

## 6. Design

### 6.1 `ViewRegistry`: ownership outside the render child

- **Purpose.** Own every reading-mode `ElementView` for its whole life, so that a view
  can outlive the section it was drawn in.
- **File.** `src/framework/host/viewRegistry.ts` (new).
- **Form.** A `Component` subclass. `main.ts` creates it once with `plugin.addChild()`
  in `onload`, before `registerFrameworkElements`. When the plugin unloads, it unloads
  every view it owns.
- **Interface.**
  - `own(view, host, root): RegistryEntry`: adds the view as the registry's child.
  - `noteWrite(entry, body)`: records a claim ticket.
  - `claim(docId, sourcePath, body): RegistryEntry | null`
  - `release(entry, reason)`
  - `enabled: boolean` (§6.6)
  - `size`: used by the gate and the tests.
- **Entry.** `{ view, host, root, tickets: {body, at}[], released: boolean }`.
- **Depends on.** Obsidian's `Component` only. It knows nothing about any element.

Why from the start: `Component.removeChild` always unloads (B8). A view that was ever a
child of the render child cannot be rescued later. This is the one structural change to
F1's lifecycle: F1 §2.4 step 4 ("`host.addChild(view)` ties the view's lifecycle to the
block") no longer holds for reading mode. The block's render child now only signals the
registry.

Non-reading hosts (sidebar, and a future Live Preview) keep `host.addChild(view)`.

### 6.2 Claim at processor time

**When.** It is the first thing the registered code-block processor does, before
`pipeline.run`.

**Key.** `(ctx.docId, ctx.sourcePath, source)`.

**Candidacy.** An entry can be claimed only if all of these hold:

1. Its view is loaded and not yet released.
2. `entry.host.docId === ctx.docId` and `entry.host.sourcePath === ctx.sourcePath`.
3. It holds a claim ticket whose body equals `source` after trimming trailing whitespace.
   The ticket must be younger than the **claim window of 3000 ms**.
4. It is not already being claimed by another processor call.

**Tickets.** `host.replaceSource` calls `noteWrite` synchronously, *before*
`vault.process`, because `modify` (and so the processor call) fires inside it. A
successful claim consumes the matching ticket and every older one. Only the writer holds
tickets, so only the writer's own instance can match. Another pane or embed of the same
note has a different `docId` and gets a fresh view with the new data. That held in 7/7
writes in r2 S4.

**More than one candidate.** It was never seen (0 ambiguous in r2). The entry with the
newest ticket wins, and the registry counts the event.

**`docId` collision guard (B4).** At `own()` time the registry records the view's
preview container: the root's closest `.markdown-preview-view` or `.markdown-embed`. If
two live entries share a `docId` but have different preview containers, the registry
marks that `docId` unsafe. From then on it refuses every claim for that `docId`, until
the entries release. Those blocks fall back to fresh views, as today.

**Adopt.** On a hit:

1. `entry.host.rebind(el, ctx)` (§6.3).
2. If the root holds focus, record the focused element and its selection range.
3. `el.appendChild(entry.root)`, **synchronously, while `el` is still detached.**
4. Resolve the processor's promise at once.
5. When `el` is inserted into the document (a `MutationObserver`, 5 s backstop), restore
   focus and selection if they were lost.

Moving immediately is required. The first prototype waited for `el` to be inserted. It
stalled at its 2 s backstop in 2 of 71 adoptions, because Obsidian can defer inserting an
empty async section. The immediate move gave 0 timeouts in 38, and it lets Obsidian
measure the section with its real content. That measurement is also why the SC-198 clamp
disappears for adopted writes.

**What the view keeps.** The same `ElementView`, `rootEl`, model, pending debounce
timer, open modals, `SessionStore` usage, and every DOM listener and afterRender hook
(keyed on `root`). Nothing in the pipeline re-runs.

### 6.3 Host rebind

**Purpose.** Re-point one `ReadingModeBlockHost` at a new section, so that every closure
holding `cx.host` stays valid. Those closures are `persist`, the chrome pin item, and the
form editor.

**Interface.** It lives on `ReadingModeBlockHost`, not on `BlockHost` (§7):

- `rebind(el: HTMLElement, ctx: MarkdownPostProcessorContext): void`: sets
  `containerEl` and `ctx`, creates a fresh `MarkdownRenderChild(el)`, and
  `ctx.addChild`s it.
- `readonly docId: string`

`containerEl` becomes a getter over a private field. Code outside the host cannot assign
it.

**The old render child.** Obsidian unloads it about 50 ms later. Its unload callback
compares itself with the host's current render child, and does nothing when superseded.

### 6.4 Release: flush, then unload

**Trigger.** Only the host's *current* render child unloading. The registry never
releases on a timer, so there is no grace window.

**Steps.**

1. Refresh the durable position while the section may still resolve.
2. `registry.release(entry)`: mark it released, then `registry.removeChild(view)`.
3. The view's registered `flushPersist` writes any pending body through
   `replaceSource`. If the section is gone, that uses the durable locate from SC-343.
4. The view's other registered callbacks run (for example `activeModal.close()`).

Every unload path, measured in r2 S6 unless noted:

| Path | What Obsidian does | Handling | Measured result |
|---|---|---|---|
| Own write re-draws the writer's section | new processor call, then the old render child unloads | claim → rebind; the old render child's unload is a no-op | adopted 38/38 |
| Rebuild of another pane or embed of the same note | same as above, with a different `docId` | no ticket → fresh view; release the old one | fresh with the new data, 1 write |
| External edit, sync or undo of the block | the section re-renders with a body we did not write | no ticket → fresh view; release → flush; a pending write whose block changed is a durable miss (§8) | S5 4/4 |
| Navigate away in the same leaf, write pending | preview cleared; `getSectionInfo` returns `null` | release → flush through the durable locate | lands (SC-336 fixed) |
| Close the leaf, write pending | render child unloads | release → flush through the section path | lands |
| Reading → Source → Reading | nothing unloads (B9) | the view stays alive; a pending write lands; the rebuild on return is claimed within 3 s, otherwise it is a fresh view | same root, no leak |
| `previewMode.rerender(true)` | every section re-renders, bodies unchanged | no tickets → fresh views; old ones released | pass |
| Plugin disable, write pending | the registry unloads with the plugin, taking every view with it | the flush runs while sections still resolve | lands; after re-enable, live views = rendered blocks (2 = 2) |
| Detach the leaf that embeds B, write pending in the embed | embed render child unloads | release → flush | lands in B |
| An embed inside a leaf that navigates away | embed render child is **not** unloaded until the leaf detaches (r1 E4b) | not released until then (this already happens today) | no loss; view lingers |
| Leaked detached embed copy | never unloaded while the leaf lives | never claimed (no rebuild ever carries its `docId`); its writes are refused by SC-343 | 0 claims; guard refused the stale write |
| Canvas, hover, print hosts | `canPersist` is false and they never write | owned and released like any other view; no ticket is ever recorded | not exercised by the spike; the gate adds hover (§10.2) |

### 6.5 Durable locate and the stale-position guard (SC-343), plus the position refresh

SC-343 lands first, standalone (ruling 2). SC-340 assumes SC-343 delivers exactly this
in `ReadingModeBlockHost`:

1. **Durable identity.** The host tracks `lastKnownBody` (set from the mount `source` and
   after every successful write), `lastKnownLineStart` (refreshed whenever
   `getSectionInfo` resolves) and `lastKnownLanguage`.
2. **Stale-position guard.** Inside the `vault.process` callback, the section's line range
   is trusted only if the live content has an opening fence at `lineStart`, a closing
   fence at `lineEnd`, and a body in between equal to `lastKnownBody`. Otherwise it falls
   back to (3).
3. **Durable locate.** From the live content, find the fences of the same language whose
   body equals `lastKnownBody`, reusing `listFences` / `findFenceByBody` in
   `src/framework/sidebar/anchor.ts`. Choose the one nearest `lastKnownLineStart`. No
   match drops the write (§8).
4. **`canPersist`.** True when the section resolves, *or* when a durable identity exists.
   The durable case is what makes the flush after navigate-away possible.
5. **Position refresh at `persist()`.** `ElementView.persist()` calls a host hook
   (proposed `cx.host.notePersistIntent?.()`), which refreshes `lastKnownLineStart` while
   the section is still live.
   - Without it, r2 S7 wrote the wrong one of two identical blocks after a 16-line shift
     (`[6,5]` instead of `[5,6]`).
   - With it, the result was correct at 4- and 16-line shifts.

If SC-343 lands narrower (only item 2, say), the missing items become step 1 of the
SC-340 build. Open question Q1 asks where item 5 belongs.

### 6.6 Kill switch

**Form.** A hidden settings key, `viewAdoption` (default `true`), in the plugin's
`data.json`, read once in `onload` into `registry.enabled`. It is not shown in the
Settings UI.

**Off means today's behaviour.** `claim()` always returns `null`, so every rebuild builds
a fresh view and the old view is released and flushed. Ownership stays with the registry,
so there is one code path either way. That is observably identical to render-child
ownership, because release runs at the same moment the render child would have unloaded
the view.

**Why a hidden key rather than a visible setting or a build flag.** A build flag needs a
new release to switch off. A visible setting asks every user to understand an internal
mechanism. A hidden key lets Scott, or a user with a support problem, turn adoption off
with one line in `data.json` and a reload. The gate and the tests flip `registry.enabled`
directly.

## 7. Interfaces changed

| Area | Change |
|---|---|
| `BlockHost` (`host/BlockHost.ts`) | **No required member changes.** One optional member is added: `notePersistIntent?(): void` (§6.5 item 5). `rebind` and `docId` stay on `ReadingModeBlockHost`, because only the reading host is ever adopted. The `addChild` doc comment is amended: reading mode no longer ties *views* to the render child, only auxiliary components. |
| `ReadingModeBlockHost` | Adds `rebind(el, ctx)`, `docId`, and a mutable private binding. `containerEl` becomes a getter. SC-343 adds `setMountedBody` and the durable fields. The render-child unload calls `registry.release`. |
| `ElementView` (`framework/view.ts`) | `persist()` calls `cx.host.notePersistIntent?.()`. The flush-on-unload is unchanged, and it now also runs on registry release. |
| Pipeline (`framework/pipeline.ts`) | For a `ReadingModeBlockHost`, `registry.own(view, host, root)` replaces `host.addChild(view)`. The form-editor closures stop capturing the mount-time `source` (§9.2). |
| Processor registration (`registerFrameworkElements.ts`, `main.ts`) | `main.ts onload` creates the registry and passes it to `registerFrameworkElements`. Each processor calls `registry.claim` before `pipeline.run`. |
| `SessionStore` / `blockKey()` | `blockKey()` stays line-based, read live, and best-effort (F1 §4.3). Adoption makes session state *less* load-bearing, because an adopted view never re-reads it after its own write. The one captured key is the chrome's `persist: { blockKey: host.blockKey() }`, taken per chrome mount (`pipeline.ts` ~:603). It drifts only when lines above shift, exactly as today. No change is required. F1 §4.2 step 4 (re-hydrating session state on the echo rebuild) becomes true only for rebuilds that are not adopted. |

F1 amendments:

- **§2.4 step 4.** Reading-mode views are owned by the view registry, not
  `host.addChild`.
- **§2.4 step 5.** An echo rebuild of our own write adopts the live view; it no longer
  builds a fresh one.
- **§2.4 step 6 and §4.5 "No view references stored on the plugin".** The exception is
  the view registry, a plugin-scoped `Component` that releases each view when its section
  goes.
- **§4.2 step 3.** "This echo rebuild is **accepted**" is replaced by adoption; the view
  still ≡ the document, because a claim requires the new section's body to equal the
  body the view wrote.
- **§3.4.** Adds `notePersistIntent?` and documents `rebind` on the reading host.

## 8. Error handling

- **Claim miss.** A fresh view is built and the old view is released (flush, then
  unload). This is today's behaviour, so no message is shown.
- **Durable miss.** This happens when a pending write's block has changed or vanished on
  disk: an external edit or sync inside the debounce window, or the block was deleted.
  The write is dropped. **Recommendation: show an Obsidian `Notice` and log a
  `console.warn`**, rather than warn alone, because a dropped write is lost user data. A
  console-only warning is invisible to users.
  - Proposed text: "Draw Steel Elements: a change to a block in <note> was not saved —
    the block changed on disk first."
  - At most one Notice per note per 5 s.
  - SC-343 owns this message. SC-340 inherits it. See Q2.
- **Plugin unload.** The registry unloads every view, and each flushes through the
  section path while sections still resolve (r2 S6 e: lands, 0 errors). A write that
  resolves after unload still lands, because `vault.process` belongs to the app, not the
  plugin.
- **The leaked embed copy's write.** SC-343 refuses it as a durable miss. With a Notice,
  a user could see one message for a write they never made. That is acceptable, because
  it is rare and the dropped body is always a stale copy. Suppress the Notice when the
  host's root has been detached for more than 5 s and holds no focus, which marks it as a
  leaked copy.
- **Adoption failure mid-way** (an exception in `rebind` or the move). The processor
  catches it, releases the entry, and falls through to `pipeline.run`, so the block
  still renders.

## 9. Follow-through audits

### 9.1 Commit-on-`blur` / `change` handlers inside a view root

During adoption the section leaves the document (B11), so a focused input receives
`change` (if dirty) and `blur` once, then focus is restored. Handlers on controls
*inside the view root* see these. Handlers inside modals do not, because modals are
outside the root.

| Handler | Fires on adoption? | Required treatment |
|---|---|---|
| `src/framework/kit/stepper.ts:187`: `registerDomEvent(el, 'blur', () => commitDraft())` on the editable stepper input. It is used with `editable` by `counter/view.ts:50`, `tokens/view.ts:32`, `surges/panel.ts:51`, `resource/panel.ts:54`, `party/view.ts:126` and `:182`, and by the roll bar (`kit/rollBar.ts:75`). | **Yes.** It commits a half-typed draft and triggers another persist. | Ignore a blur while the input is disconnected: `if (!el.isConnected) return;` at the top of the handler. A removal blur always happens after the node has left the document. Add a jest test that removes and re-inserts the input and asserts that `onChange` was not called. |
| `negotiation/MotivationsPitfallsView.ts:44` and `ArgumentView.ts:63` (checkbox `change`) | No. Checkboxes fire `change` only on toggle. | None. |
| `views/MinionStaminaPoolModal.ts:165` (checkbox `change`) and `views/ConditionsModal.ts:393` (color `change`) | No. They are inside a modal, outside the root. | None. |
| Initiative malice quick-add inputs (`initiative/view.ts` ~:408–420) | `change` fires, but nothing listens. They are read on "Add". | None. The r2 S3/S3b text survived intact (0 of 310 keystrokes lost). |

The implementer re-runs this grep at build time:
`registerDomEvent\([^,]+, *'(change|blur|focusout)'` and `addEventListener\('(change|blur|focusout)'`.

### 9.2 The form-editor button holds the mount-time body

`pipeline.ts` ~:620 and ~:670 call `openFormEditor(view, cx, def, source, …)` with the
`source` captured when the pipeline ran. After an adoption, that closure still holds the
pre-write body, so the form would open stale and saving it would revert newer changes.

**Treatment:** pass the host's current body (`lastKnownBody`, from SC-343) at click time,
not the captured `source`. `ds-hero`'s own "Edit definition" already serialises its
current state (`hero/view.ts:257`) and needs no change. Add a jest test: mount, write,
adopt, click the pencil, and assert that the form receives the written body.

## 10. SC-331 retirement and testing

### 10.1 SC-331 retirement

Ruling 3 applies: SC-331's per-modal deferral (`sc331-condition-modal` @ 2cd5275,
commits `d00769e`..`2cd5275`) is **not landed**. The branch is kept unmodified as a
fallback until SC-340 lands. **SC-331 closes when SC-340 lands**, and so do SC-339 and
SC-336, which adoption and the durable flush resolve.

Of SC-331's tests (`test/dom/elements/initiative.test.ts`,
`test/dom/views/minion-stamina-pool-modal.test.ts`):

- **Carry over and adapt:**
  - "opening and closing the modal with NO change persists nothing" (both modals).
  - "the view unloading while the modal is still open … still flushes the pending edit".
    This becomes the release-flush test.
  - The `test/fixtures/initiative/squad-condition.yaml` fixture.
- **Drop.** They pin the deferral contract, which adoption reverses (writes stay live):
  - "update the tracker icons live, but persist nothing even past the debounce";
  - "closing the modal (Done) persists exactly once …";
  - the MED-1 "modal close flushes the pending write immediately" group;
  - the pool-modal "does not persist while open" and "one write, not two" rewrites.
- **New regression pin.** A simulated self-write rebuild keeps the ConditionsModal open
  and the same view instance, and each click writes.
- **Probe scenarios from `sc331-review-probe.mjs`** become gate scenarios: the controls,
  close paths and Done-then-reopen race in G-S1, `selectrace` in G-S2, and
  `poolcond`/`poolunload` in G-S1/G-S6.

### 10.2 Testing

**Jest (unit).** New suites cover:

- **Registry:** own, ticket age-out at 3 s, claim key, consuming a ticket, multiple
  candidates, the `docId` collision guard, `enabled = false`.
- **Rebind:** the old render child's unload is a no-op; the new one releases.
- **Release:** flush-then-unload order; modal closed.
- **Adopt:** synchronous move; focus restored after insertion.
- **Stepper blur guard.**
- **Form-editor current body.**

SC-343 brings the durable locate and guard suites.

**SC-337 (the mock unloads in the wrong order).** `test/mocks/obsidian-core.ts`
`Component.unload` runs children in FIFO order, then `onunload`, then registered
callbacks. Real Obsidian runs children LIFO, then callbacks LIFO, then `onunload`.

**Recommendation: fix the mock first, as the first commit of the SC-340 build, and close
SC-337 with it.** SC-340's whole subject is unload order: flush before modal close, and
render-child callbacks after children. Tests written against a wrong order pass for the
wrong reason, and order-independent tests cannot assert the flush-then-close sequence the
design requires. Any existing test that breaks when the mock is corrected was pinning a
false order, and is fixed in the same commit, with the count recorded in the plan.

**Real-Obsidian gate (ruling 4).**

- **Script:** `npm run obsidian-lifecycle`, which runs
  `npm run build-no-check && node visual-harness/obsidian-lifecycle.mjs`.
- **Where:** `visual-harness/obsidian-lifecycle.mjs`. It is built from
  `sc340-probe-r2.mjs`, and reuses the Xvfb resolution and CDP plumbing of
  `visual-harness/docs-shots.mjs` and `obsidian-camera.mjs`.
- **Isolation:** its own Xvfb display (160–199), its own CDP port, its own
  `--user-data-dir`, and a scratch copy of `demo-vault` with generated fixture notes.
  Never `:1`, and never the worktree's `demo-vault`.
- **Scenarios:**

| id | from r2 | asserts |
|---|---|---|
| G-S1 | S1 | ConditionsModal open across 6 live writes; Done-then-reopen at 30/150/300/420/600 ms; pool removals at both call sites |
| G-S2 | S2 | stamina modal survives the selection write at 150 and 380 ms |
| G-S3 | S3 + S3b | text, focus and caret survive; 0 keystrokes lost across the adoption |
| G-S4 | S4 | pane + embed and two panes: writer-only adoption; the other instance fresh with the new data; 1 write per click; leaked embed copy never claimed |
| G-S5 | S5 | external edit and undo-like revert → fresh view, old view released |
| G-S6 | S6 | every §6.4 path: pending write lands; live-view count = rendered blocks (leaked copies excluded); 0 orphaned modals; note integrity |
| G-S7 | S7 | identical twin blocks with lines shifted: the write lands in the right twin, both through the section path and through the durable path |
| G-S8 | S8 | tall scrolled tracker: `scrollTop` held (pin on, as shipped) |

- **Every scenario also checks:** 0 page errors, and note integrity (every fence closed,
  block count unchanged, no stray text outside fences).
- **Pass lines:** one `OBSIDIAN-LIFECYCLE <id> ok (<key numbers>)` line per scenario,
  then `OBSIDIAN-LIFECYCLE done: 8/8 ok, 0 failed`. The process exits 0.
- **Failure:** a line naming the scenario, the assertion and the measured value, then
  exit 1.
- **Runtime:** about 4 minutes. The r2 probe ran S1–S8 in about 3.5 minutes plus about
  15 s of Obsidian start-up.
- **Battery slot:** step **4**, right after jest and before `npm run shots`.
  - *After jest:* it builds `main.js`, and a `main.js` built before jest would shadow
    `main.ts` (the dse-verify "stale main.js" footgun).
  - *Before shots:* it fails in about 4 minutes instead of after the longer shots,
    freeze and parity stages.
  - Parity stays last.
  - Unlike `obsidian-shots` it needs no real display, so it is **mandatory**, not
    optional.

The new order is: tsc → lint → jest → **obsidian-lifecycle** → shots → freeze → parity
→ (optional) obsidian-shots.

## 11. Sequencing

1. **SC-343** lands first, standalone: the durable identity, the stale-position guard,
   the durable locate, and `canPersist` over the durable identity. It also carries the
   persist-time refresh if Q1 is answered that way. It gets its own spec or plan and its
   own review.
2. **SC-340**, in plan-able steps. Headlines only; the implementation plan is a separate
   document.
   1. Correct the test mock's unload order (closes SC-337).
   2. `ViewRegistry` and ownership (with the kill switch at `enabled = false`, which is
      today's behaviour).
   3. Host rebind.
   4. Claim and adopt, with the synchronous move and focus restore.
   5. Release on render-child unload.
   6. The stepper blur guard and the form-editor current body.
   7. The `docId` collision guard.
   8. The real-Obsidian gate script and the battery wiring.
   9. Switch `enabled` on by default; full battery; the doc updates in §12.
3. Close SC-331, SC-339 and SC-336. Delete the SC-331 fallback branch after SC-340
   lands.

## 12. Docs to update when it lands

- **`F1-element-framework-v2-spec.md`:** a dated amendment note at the top, and inline
  notes at §2.4 steps 4–6, §3.4, §4.2 step 3 and §4.5, each pointing here.
- **`draw-steel-elements/.repo-docs/architecture.md`:**
  - the `view.ts`, `host/BlockHost.ts`, `host/ReadingModeBlockHost.ts` and
    `registerFrameworkElements.ts` rows;
  - a new `host/viewRegistry.ts` row;
  - one paragraph on the write → adopt → release lifecycle.
- **`.repo-docs/integration.md`:** next to the sidebar self-echo note, a sentence saying
  reading mode now adopts its own echo.
- **The dse-verify skill** (`.claude/skills/dse-verify/SKILL.md`):
  - the battery table gains step 4 `npm run obsidian-lifecycle` (expects
    `8/8 ok, 0 failed`, exit 0, about 4 minutes);
  - the run-order paragraph;
  - the new jest total in "Current expected numbers".
- **Workspace `ARCHITECTURE.md`:** no change. It does not describe the DSE write path.
- **CHANGELOG** (`draw-steel-elements/CHANGELOG.md`, 7.0.0 section): **one `[INTERNAL]`
  bullet, no `[FIX]` bullet.**
  - Why: every symptom (SC-331, SC-339, SC-336, SC-198) came from the unreleased 7.0.0
    framework; 5.1.1 users never saw them.
  - The bullet: "Reading-mode blocks keep their live view across their own saves (open
    dialogs, focus and typed text survive a write); the write path locates a block by its
    body when its position has moved."

## 13. Open questions for Scott

- **Q1. Does the persist-time position refresh (§6.5 item 5) land in SC-343 or in
  SC-340?**
  *Recommendation: SC-343.* It protects the durable locate SC-343 introduces. Without it,
  SC-343's durable path can pick the wrong one of two identical blocks. SC-343 alone would
  then also fix SC-336 (navigate-away) before SC-340 lands.
- **Q2. When a write is dropped because its block changed on disk first, show an Obsidian
  Notice or only log to the console?**
  *Recommendation: a Notice*, rate-limited to one per note per 5 s and suppressed for
  leaked embed copies (§8). A dropped write is lost user data, and the console is
  invisible to users.
- **Q3. Return ds-conditions (`conditions/panel.ts` ~:155–183) from "persist on dialog
  close" to live persist, now that adoption keeps its dialog open?**
  *Recommendation: not in SC-340.* It works and has its own tests. File a small follow-up
  so the two condition dialogs behave the same, and decide it after SC-340 has run in
  Scott's vault for a while.
- **Q4. Kill-switch form: a hidden `data.json` key (proposed), a visible Advanced
  setting, or none?**
  *Recommendation: the hidden key.* It allows an off switch without a release and without
  adding UI.
