# SC-340 spike round 1: how Obsidian sequences a reading-mode rebuild

## Executive summary

- **Leaning: GO for B′, with conditions.** The ordering B′ needs is guaranteed by Obsidian's code, not by timing. After our write, the new section's processor runs first (4.7 ms median after `modify`). The old render child unloads only after the new mount's promise resolves (19.6 ms median after it). Across 15 of 15 self-writes, the old view was still alive and attached when the new mount ran.
- **Why it is guaranteed.** `MarkdownPreviewRenderer.onRender` holds `cleanupParentComponents()` until `asyncSections` is empty, and our processor returns `pipeline.run`'s promise. So the new mount can **claim the live old view directly at processor time.** In the happy path nothing needs to be parked.
- **E1.** At processor time the new `el` is detached (15/15). `ctx.getSectionInfo(el)` resolves correctly (15/15). The source is byte-identical to what we wrote (15/15). `ctx.docId` is the same across the rebuild (5/5 measured).
- **E2.** Obsidian re-renders only the sections whose text changed. An unchanged sibling DSE block never remounts, and neither does anything else on a plain-text edit, even one that shifts line numbers. The unchanged blocks' `getSectionInfo` follows the new line numbers. So matching on "the body we just wrote" is enough. The `rerender(true)` path (full re-render) does remount everything with unchanged bodies.
- **E3.** No unload or remount happens on scroll. Off-screen sections are detached from the DOM but stay loaded. A write from an off-screen block rebuilds immediately, with no deferral. The only laziness seen was the first render of a very large note (6,000 lines).
- **E4 is the main design constraint.** The same block can be live twice: once in a pane and once as an embed. Both instances rebuild, and the other instance rebuilds **first**, about 50–100 ms before the writer's (3/3). The two share `sourcePath`, line and body, and **only `ctx.docId` tells them apart**. So the adoption key must include docId. Embeds also sometimes leave a detached instance behind that never unloads and can write stale data.
- **E5.** A view parented under a Component the plugin owns survives the unload of its `MarkdownRenderChild`. An open modal stays open (at 2.5 s, against closing by 600 ms in the control run). Moving the root into the new container and re-pointing the host's `ctx`/`containerEl` restored writes: the edit landed and the modal stayed open. Without re-pointing, a parked view's writes are **silently dropped**, because `getSectionInfo` on a replaced section returns null.
- **Top 3 risks** (details in §6):
  1. Identity when one block is live in several places: docId is required, and the leftover embed instances make it worse.
  2. Once views are no longer children of the render child, every unload path becomes our responsibility. Obsidian has no reparent API: `removeChild` also unloads.
  3. The host has to be re-pointed, which reaches into private or readonly fields and every closure that holds `cx.host`, and `blockKey` moves with the line.

## 0. Method

- Spike branch `sc340-spike` (local only, commit `68578a6`, never pushed), based on `e4bcd0f`. The patch is in `sc340-spike-r1.patch`.
- The instrumentation lives in `src/framework/sc340Spike.ts`. Each event gets `performance.now()` and a counter that only increases, and is written to `window.__sc340` and `console.debug`. Instrumented points:
  - the processor entry: `proc`, with `connected`, `sec`, the body hash and the exact source;
  - `ReadingModeBlockHost` construction (`host.new`, with docId);
  - the render child's load and unload (`rc.load` / `rc.unload`);
  - the view's load and unload and `mount.done` (with connected, sec, embed, leaf and docId);
  - `replaceSource` start, process callback and resolve (`rs.start` / `rs.processCb` / `rs.resolve`);
  - a `vault.on('modify')` listener.
- **Park mode (E5), off unless `window.__sc340park = true`.** The view is parented under a Component owned by the plugin instead of `host.addChild`. The render child's `onunload` records the view as parked and does not unload it.
- **Probe: `sc340-probe.mjs`.** It is built on the sc331 review probe. It uses its own Xvfb (`:150`, never `:1`), CDP port 9251 and its own `--user-data-dir`, on a scratch vault copied from the demo vault. Obsidian **1.14.2** (installer asar). The fixture notes live only in the scratch vault.
- **Runs.** `try1` (E1), `try2` (E2–E5, first pass), `r1` (everything), `r2` (everything, the canonical run), `r1e4` (E4 after the fixture fix) and `r2e4b` (E4b: the visible embed, plus the embed lifecycle). The numbers agree across runs, and E1's statistics pool 15 repetitions from three runs.
- **Obsidian internals were read from the 1.14.2 `app.js`:**
  - `Component.addChild` loads the child if the parent is loaded.
  - `Component.removeChild` does `splice` and then `child.unload()`, so there is no detach without unloading.
  - `cleanupParentComponents` removes every `MarkdownRenderChild` whose `containerEl` no longer `belongsToMe`.
  - `onRender` runs that cleanup only once `asyncSections.length === 0`.
  - Sections whose post-processors return promises go into `asyncSections` until `Promise.all(d)` resolves.

## 1. E1: order and gap on a self-write

Setup: a note with one writable `ds-initiative`; the real "Advance round" button is clicked, which runs `persist()` (debounced 400 ms). There are 5 repetitions per run. Pooled over 15 repetitions:

| interval | min | median | max (ms) |
|---|---|---|---|
| click → `vault.modify` (debounce + process) | 415.7 | 422.2 | 440.0 |
| `rs.start` → `modify` | 1.2 | 1.7 | 5.6 |
| `modify` → **new processor call** | 2.5 | 4.7 | 9.8 |
| `modify` → new `mount.done` | 31.9 | 39.0 | 71.5 |
| new `mount.done` → **old render child / view unload** | 15.0 | 19.6 | 32.8 |
| `modify` → old unload | 47.4 | 57.7 | 102.9 |
| **new processor call → old unload** (positive means the old unload comes later) | 44.7 | 52.1 | 96.1 |

The order is the same in every repetition:

```
rs.start → rs.processCb → vault.modify → rs.resolve → proc → host.new → rc.load → view.load →
mount.done(new) → view.unload(old) → rc.unload(old)
```

What held at processor time, and in the data:

- **`el.isConnected` was false** in 15/15.
- `ctx.getSectionInfo(el)` **resolves**, with the right range (`[4,17]`), in 15/15.
- The new `el` is connected by `mount.done` in 15/15.
- The processor's `source` is **byte-identical to the body we wrote** in 15/15.
- There is **exactly one** processor call per self-write.
- The old view's `unload` runs just before the old render child's own register callbacks. This fits the LIFO order: children unload first.
- `vault.modify` fires *inside* `vault.process`, before it resolves. The processor call comes after `rs.resolve`.
- `ctx.docId` of the new mount equals the old one in 5/5 (r2).

The 44–96 ms gap is not a race margin. The old unload happens inside `cleanupParentComponents`, and that runs only after every async post-processor of the re-rendered sections has resolved. That includes our `pipeline.run` promise, which is why the old unload came after `mount.done` in 15/15.

**Design implication.** Record the "pending self-write" entry `{path, docId, lineStart, body}` synchronously, *before* calling `vault.process`, because `modify` fires inside it. When the new processor call finds a matching entry, it takes the old view while that view is still live and attached. There is no gap in which the view is parked or dead, and no grace window is needed in the happy path. The claim can even happen after an `await`, since Obsidian will not unload the old child until our promise settles. What remains is to stop the old render child from unloading the claimed view (§5).

## 2. E2: who rebuilds

Setup: a note with `ds-initiative` (block 1), a paragraph, then `ds-counter` (block 2).

| action | remounted | processor calls |
|---|---|---|
| self-write from block 1 (×3) | block 1 only | 1 × `ds-initiative` |
| plain edit to the MIDDLE paragraph, same line count | nothing | 0 |
| plain edit BELOW both blocks | nothing | 0 |
| plain edit ABOVE both blocks, +2 lines (shifts both) | nothing | 0 |
| edit inside block 2's body | block 2 only | 1 × `ds-counter` |
| `previewMode.rerender(true)` (no write) | **both** | 2, bodies unchanged |

- The unchanged blocks' **live** `getSectionInfo` follows the new line numbers. The counter moved from `15,20` to `21,26` after block 1 grew, and the initiative moved from `4,17` to `6,19` after the insert above it.
- So Obsidian compares sections by their text and re-renders only the ones that changed. The ledger's SC-198 line "ANY write tears down every rendered section" is true of the sizer and height bookkeeping, **not** of DSE block mounts. That line should be corrected before the spec.

**Design implication.** Matching on "the body we just wrote" is enough for self-writes, because unchanged siblings never rebuild. "The same body as before" matching is not needed for correctness. It would only matter for the `rerender(true)` path, which is not a self-write, so today's fresh-view behaviour is acceptable there. Because `lineStart` shifts under edits the block doesn't see, the session `blockKey` (`path::lang::lineStart`) is already unstable. Adoption should not rely on a `lineStart` captured at mount; read it live, or leave it out of the key.

## 3. E3: off-screen and lazy rendering

Notes: the block at the bottom, top or middle of a note of about 10–13k px (250–300 filler paragraphs), plus a `huge.md` of about 120k px (3,000 paragraphs, 6,000 lines).

| observation | long notes (3) | huge note |
|---|---|---|
| block processed when the note opens, while off-screen? | **yes** (the processor runs at open with `el` detached) | **no**. The first processor call comes only when scrolled near. |
| scroll-only, far away and back ×4: any `rc.unload` or new processor call? | **none** | **none** |
| root `isConnected` while scrolled away | **false** (detached by virtualisation, still loaded) | false |
| script write from the block while it is off-screen (root detached) | `persist` → `ok:true`. `getSectionInfo` works on the detached element. The rebuild is **immediate** (new processor call about 4 ms after `modify`, `el` detached) and the old child unloads. | same, immediate |
| scroll the block back after that write | no further processor call (the new mount was already there) | same |

**Design implication.** In 1.14.2, "the block is off-screen, so the rebuild is deferred" does not happen for a section that has already been rendered. The rebuild after a self-write is always immediate. Obsidian does virtualise, but by detaching DOM, not by unloading, so scrolling never tears views down and needs no special handling. The grace window is therefore only a fallback for cases where no matching rebuild ever comes: navigating away in the ~0–10 ms between `modify` and the processor call, a write that doesn't change the text, or the leftover embed instance in §4. It can be short, for example 1–2 s. **Caution:** while a section is detached it is still in the renderer, so `getSectionInfo` works. Once its section has been *replaced* it returns null (§5). "Detached" and "dead" are different states.

## 4. E4: embeds

Setup: `A.md` contains `![[B]]`, and `B.md` holds a `ds-initiative`. The key results come from `r2e4b`, which targets the *visible* embed instance.

**The embedded instance.** `ctx.sourcePath` is `Spike/B.md`, the embedded file. `getSectionInfo` is relative to B (`[4,11]` / `[4,17]`, the same as when B is opened directly), and `canPersist` is true. `el.closest('.markdown-embed')` is false at processor time because the element is detached. It is true at `mount.done`.

**A only.** Each write from the embed rebuilds exactly that embed instance, with the same order and gaps as E1. The docId is stable across rebuilds.

**A and B both open, in split panes** (r2e4b, writing from the visible embed, docId `9e80…`, 3/3):

```
rs.start#1@434.6  modify@436.5
proc@440.8  mount.done#3(pane 419f…)@479.9  rc.unload#2(pane)@498.6     <- the OTHER instance rebuilds first
proc@520.8  mount.done#4(embed 9e80…)@554.4 rc.unload#1(embed)@575.4    <- the writer, 80–100 ms later
```

Writing from the B pane (r2, 2/2) produces the same pattern with the roles swapped: first the pane (the writer), then the embed. Each instance rebuilds on its own, and each is its own renderer with its own cleanup. Across the two, **the rebuild order follows the renderer, not the writer.** Both new mounts carry the same `sourcePath`, `lineStart` and body. Only **`ctx.docId`** differs, and it is stable per rendered document instance across rebuilds: the pane stays `419f…` and the embed stays `9e80…` through 3 writes.

**Leftover embed instance.** Seen in 2 of the 3 runs that opened A (r1e4 and r2; not in r2e4b):

- Opening A rendered the embed **twice**, with two docIds. The first instance's render child never unloads while the leaf stays open, and its root is detached.
- It is still loaded, `canPersist` is true, and it **can write**. When clicked from a script, it wrote its own stale model. When that model's serialised body matched what was already on disk, no section changed and nothing rebuilt. A stale model that *differs* would overwrite another instance's newer edit. This is existing behaviour, unrelated to B′.

**Embed lifecycle.** After the split is closed and A's leaf navigates to another note, the embed's view is **still loaded after 5 s**. It unloads only when the leaf is detached. As a control, a block in B opened directly unloads immediately when you navigate away. This is also existing behaviour: flush-on-unload for embeds is delayed until the leaf closes.

**Design implication.** The adoption key must be `(docId, sourcePath, body we wrote)`, with `lineStart` optional or read live. Without docId, the first matching rebuild after a write from the embed is the *other pane's* mount, which arrives 50–100 ms earlier, and it would take the embed's view. That other instance then keeps the modal while the writer's own rebuild gets a fresh view: the wrong result. docId is a public field on `MarkdownPostProcessorContext`. The instance that did not write should keep today's behaviour, a fresh view. Because of the leftover instance, a writer's docId may never get a rebuild. So the pending entry needs its grace expiry, and on expiry it must not touch a view that is still in its render child.

## 5. E5: can a view outlive its render child, and does an open modal survive?

**Wiring today** (`src/framework/pipeline.ts`): `host.addChild(view)` goes to `ReadingModeBlockHost.addChild`, which is `renderChild.addChild(view)`. When `cleanupParentComponents` calls `owner.removeChild(renderChild)`, the render child unloads its children in LIFO order, which unloads the view. That runs the view's registered `activeModal.close()` and the flush-on-unload. The SC-331 close stack matches this.

**Probe.** In park mode the view is parented under a plugin-scoped `Component` (`plugin.addChild(owner); owner.addChild(view)`), and the render child's register hook records the view as parked. The test opens the initiative ConditionsModal and picks a condition, which persists live, and then samples:

| t after pick | park **off** (control): modal / old view loaded | park **on**: modal / old view loaded / old root connected |
|---|---|---|
| 200 ms | open / yes | open / yes / yes |
| 600 ms | **closed / no** | **open / yes** / no |
| 1000 ms | closed / no | open / yes / no |
| 1600 ms | closed / no | open / yes / no |
| 2500 ms | closed / no | open / yes / no |

Timeline with park on (r2), relative to the pick: `rs.start@401.7`, `modify@403.2`, `proc@405.8`, `mount.done(new)@439.5`, `rc.unload(old)@456.5`, then `view.parked(old)`, which still reports `loaded=true`. No errors were captured. Both runs (r1 and r2) matched.

- **E5b. A second edit through the modal of the parked view, with no re-pointing.**
  - The view's model updates (it now holds `bleeding`, `dazed`).
  - `persist()` resolves false because `canPersist` is false: `getSectionInfo(old el)` is null once its section has been replaced.
  - There was no `rs.start` and no write, and the file on disk was unchanged. **The edit is silently dropped.**
- **E5c. A manual "claim" of the parked view** (a probe-side script, not plugin code):
  - Steps: unload the fresh view, move the parked root into the new mount's `containerEl`, then set `oldHost.containerEl` and `oldHost.ctx` to the new ones.
  - Result: `canPersist` true, `getBlockInfo` `{4,17}`, and the root is connected.
  - A third pick in the still-open modal gives `rs.start` from the adopted host at `[4,17]` and `wrote=true`. Disk now holds `bleeding`, `dazed` and `frightened`.
  - The modal is **still open** after the following rebuild. Screenshot: `sc340-spike-r1-evidence/shots/e5-claim-after-pick3.png`.

**Answer: the mechanism is proven.** A view survives its render child's unload if it is not that child's child, and an open modal survives with it: the view's unload never ran, so `activeModal.close()` never ran. DOM listeners move with the nodes, and the pipeline chrome and afterRender hooks are keyed on root, so they move too. Two corrections to the ledger's B′ description:

1. **Nothing needs to park in the happy path** (E1 ordering). The claim happens while the old view is live, so the grace window is only for rebuilds that never come.
2. **A parked view cannot write through its old host.** A parked view that is never claimed must flush through the remembered identity, `(path, docId, body)` plus `findFenceByBody`-style location, and not through `getSectionInfo`.

The view must not sit in the render child's `_children` at all. `Component.removeChild` always unloads, and there is no public reparent API. So the view must be owned by a framework-held per-block Component from the start (as the spike does), and the render child's `onunload` must decide between "claimed, do nothing" and "unclaimed: unload now or after grace".

## 6. Leaning and top risks

**Conditional GO for B′.** The ordering it depends on is structural (Obsidian waits for our processor's promise before unloading the old child), not a timing race. Only the changed section rebuilds, rebuilds are never deferred for off-screen blocks, and the keep-alive-plus-re-point mechanism works in real Obsidian with an open modal. Conditions for the spec:

- key adoption on docId;
- own the view's lifecycle outside the render child;
- give the host a real "re-point" operation;
- give unclaimed views a flush path that does not depend on `getSectionInfo`.

**Top 3 risks surfaced:**

1. **Identity when the block is live in several places.** The same block in a pane and in an embed, or in two panes, produces rebuilds of the same `(path, line, body)`, and the instance that did not write rebuilds first, 50–100 ms earlier. `docId` is the only discriminator seen, and correctness depends on it staying stable (it did in every sample). Obsidian also sometimes leaves a detached embed instance behind that never unloads and can write stale data; for that one, a matching rebuild never arrives. Prescribe:
   - key on `(docId, path, body)`;
   - one pending entry per write, consumed by the first match;
   - the grace expiry never unloads a view that is still in its render child;
   - a regression probe for pane plus embed.
2. **Lifecycle ownership moves to us.** With the view parented outside the render child, every teardown path must unload it explicitly or it leaks, keeping its modal, timers and a stale writer alive:
   - navigate-away;
   - leaf close;
   - Source↔Reading toggle;
   - plugin unload;
   - an external edit or sync rebuild;
   - `rerender(true)`;
   - print/export and hover hosts;
   - the embed-in-navigated-away-leaf delay.

   Prescribe:
   - a per-host owner Component;
   - `rc.onunload`: if the view was claimed, do nothing; otherwise unload it (immediately if no pending self-write matches, else after grace);
   - an audit, in jest and in a real-Obsidian probe, that the number of live views returns to zero after each path.
3. **Re-pointing the host is invasive.** `ReadingModeBlockHost.ctx` and `containerEl` are private or readonly, and `cx.host` is captured by closures (the pipeline's pin and edit menu items, `openFormEditor`, and `persist` via `cx.host.replaceSource`). `blockKey()` (`path::lang::lineStart`) and the SessionStore keys move when the line moves. There is also a small window (≤10 ms) between `modify` and the new processor call during which a write from the old host still works, because its section is still present. Prescribe: a `host.rebind(el, ctx)` operation, or a stable host object that holds a swappable binding, rather than re-pointing a view to a different host. Decide the session-key story together with SC-336.

## 7. Artifacts

- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc340-view-adoption/sc340-spike-r1-report.md`
- Patch: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc340-view-adoption/sc340-spike-r1.patch`. Diff vs `e4bcd0f`; local branch `sc340-spike` @ `68578a6`.
- Probe: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc340-view-adoption/sc340-probe.mjs`
- Logs, timelines and screenshots: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc340-view-adoption/sc340-spike-r1-evidence/`
  - `sc340-probe-r2.log`: canonical E1–E5.
  - `sc340-probe-r2-e4b.log`: the visible embed, plus the embed lifecycle.
  - `sc340-probe-r1.log`, `sc340-probe-r1-e4.log`, `sc340-try1-e1.log`, `sc340-try2.log`: earlier passes.
  - `timeline-*.json`: raw `window.__sc340` timelines.
  - `shots/`: the E5 park-off, park-on and claim screenshots, and the E4 screenshots.
