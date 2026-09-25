# SC-340 spike round 2: a B′ view-adoption prototype, measured end to end

## Executive summary

- **Verdict: GO for the real build.** On base `e4bcd0f`, with the unmodified ConditionsModal that persists on every click, every self-write was adopted and every modal survived. That held in S1 (6 writes while the modal was open, the 5/5 Done-then-reopen race and 4/4 pool-modal removals), S2 (4/4), S3 and S4. No view was ever adopted by the wrong instance, no write went to the wrong note or position, and there were 0 errors across 3 full runs. The control run with adoption off reproduced every base failure.
- **Numbers from the canonical run** (`sc340-r2-adopt-immediate.log`):
  - 38 adoptions, 0 ambiguous claims, 0 claim timeouts.
  - Root out of the DOM for 5–185 ms (median 41), with **0 frames painted** in that time (38/38), so there is no flicker.
  - Focus and caret were restored in 7/7 cases, and **0 of 310 keystrokes were lost** while typing at about 8 ms per character.
- **S6: every teardown path passes.** The pending write lands in every case (navigate-away, leaf close, Source toggle, plugin disable, detaching an embed's leaf), no modals are left orphaned, and note integrity is OK. **SC-336 is fixed**: after navigate-away the write lands through the durable identity.
- **S8: SC-198 is solved for self-writes without the pin.** With adoption and without `previewScrollPin`, scrollTop held at 2779 in 3/3 runs. With adoption off and no pin it clamped from 2779 to 2001 in 3/3.
- **Two design corrections came out of the build:**
  1. Move the root into the new `el` **synchronously at processor time**. Waiting until `el` connects stalled up to the 2 s backstop in 2 of 71 adoptions, because Obsidian can defer inserting an empty async section.
  2. The durable locate needs a **position refresh at persist() time**. Without it, with identical twin blocks, it wrote to the wrong twin (1/1).
- **A bug that already exists on base:**
  - **What happens.** A detached duplicate embed instance that stays loaded after A opens (seen in 4/4 r2 runs, each of which opened A) holds a stale `getSectionInfo`. If it writes, it **corrupts the note**: it leaves stray lines outside the fence and the round goes back from 5 to 3.
  - **Where reproduced.** In both the control run and the adopt run, with the new guard off.
  - **The prototype's guard.** Before splicing, it checks that the close fence exists and the body still matches, and otherwise falls back to the durable locate. That refused the stale write (0 writes, one console.warn).
- **Size estimate for the real build:** about 5 production files, about 400–550 lines of production code plus about 400 lines of tests. The SC-331 per-modal deferral is not needed. SC-339 and SC-336 are resolved by this work. The pin stays for rebuilds that are not adopted.

## 1. Prototype architecture

Branch `sc340-spike` @ `8c27426` (local, never pushed). Patch: `sc340-spike-r2.patch` (vs `e4bcd0f`, 6 files, +541/−22).

| unit | file | what it does |
|---|---|---|
| `AdoptionRegistry` | `src/framework/host/adoption.ts` (new) | A plugin-scoped `Component` (added with `plugin.addChild`) that **owns every reading-mode view**. It provides `own(view, host, root)`, `noteWrite(entry, body)`, `claim(docId, sourcePath, body)` and `release(entry, reason)`, plus claim/miss/release/ambiguity statistics. |
| `adopt()` | same file | On a claim it calls `host.rebind(el, ctx)`, captures focus and `appendChild`s the root into the new, still-detached `el` synchronously, then resolves. A `MutationObserver` restores focus and caret once `el` is inserted. The earlier `onConnect` variant is kept behind `__sc340moveMode` for comparison. |
| `ReadingModeBlockHost` | `src/framework/host/ReadingModeBlockHost.ts` | Covered in detail below the table. |
| pipeline | `src/framework/pipeline.ts` | A reading-mode host's view goes to `registry.own(view, host, root)` plus `host.setMountedBody(source)` instead of `host.addChild(view)`. Other hosts (sidebar) are unchanged. |
| processor | `src/framework/registerFrameworkElements.ts` | `registry.claim(ctx.docId, ctx.sourcePath, source)` runs first. On a hit it returns `adopt(...)`; otherwise it runs `pipeline.run` as before. |
| ElementView | `src/framework/view.ts` | `persist()` calls `cx.host.getBlockInfo()`, which refreshes the host's durable line position while the section is still live. This is a spike shortcut; the real build should add a proper host hook. |

**`ReadingModeBlockHost` changes:**

- **Mutable binding.** `containerEl`, `ctx` and `renderChild` can change, through `rebind(el, ctx)`, which makes a fresh render child.
- **Durable identity.** It tracks `lastKnownBody`, `lastKnownLineStart` and `lastKnownLanguage`.
- **Render-child unload.** `onRenderChildUnload(rc)`: if the render child has been superseded, do nothing. If it is current, `release()` the view, which unloads it and so runs its flush-on-unload.
- **`canPersist`.** True if the section resolves, or if a durable identity exists.
- **`replaceSource`, in order:**
  1. Record the claim ticket *before* `vault.process`.
  2. Take the section path only if the fence and body check out (the stale-section guard).
  3. Otherwise locate the block durably inside `vault.process` from the live content, using `listFences` and a body match, choosing the candidate nearest `lastKnownLineStart`.
  4. If nothing matches, drop the write and log `console.warn`.

**Design choices, with their reasons:**

- **Claim key: `(ctx.docId, sourcePath, body === one of the view's recent written bodies)`.**
  - Each write adds a *ticket*. A claim consumes the matching ticket and any older ones. Tickets have a 3 s TTL.
  - Only a loaded view that is not already being claimed and not released can be a candidate.
  - If several candidates match, the most recent writer wins. Across all runs there were 0 ambiguous claims.
- **Tickets are recorded before `vault.process`,** because `modify` (and so the rebuild's processor call) fires inside it (r1 E1).
- **The move is immediate, not on-connect.** The on-connect design held the section async and timed out at 2 s in 2 of 71 adoptions. In S8, Obsidian deferred inserting the empty section, and in one of those runs the probe's next reset then overlapped with a claim still in flight. With the immediate move there were 0 timeouts in 38, and Obsidian measures the section with the real content inside. That measurement is also why the SC-198 clamp disappears (§3, S8).
- **The same host object is rebound**, not swapped for another. Every closure holding `cx.host` stays valid: persist, the chrome menu's pin, and `openFormEditor`.
- **Durable identity is refreshed on every `getBlockInfo()`, which `persist()` now calls, and on every successful write.** Without the persist-time refresh, S7 wrote the wrong twin.
- **Stale-section guard.** Before splicing, it verifies `lines[lineEnd]` is a close fence and that the body between matches `lastKnownBody`. A mismatch falls back to the durable locate, and a miss drops the write with a warning. This prevents the corruption that already exists on base (§4).

## 2. Scenario results

Canonical run: `sc340-r2-adopt-immediate.log`. Control run (adoption off): `sc340-r2-control-s1.log` and `sc340-r2-control-s1-s4.log`. Obsidian 1.14.2, Chrome 106 (`moveBefore` is not available).

| # | scenario | result | key numbers (adopt) | control (adoption off) |
|---|---|---|---|---|
| S1 | ConditionsModal: add ×3, icon, duration, delete, then Done | **PASS** | Modal open through all 6 writes, one per change, about 400 ms after each click. The tracker row's icons stepped 1→2→3→3→3→2 with the modal rows matching. The root and view id stayed the same (6 claims, 0 misses). Done closed the modal. The final note had `bleeding{icon: skull, duration: save-ends}` and `dazed`, integrity OK. | The modal closed after add #1: 1 write, then "(modal gone)". |
| S1 | Done, then open the next combatant's modal 30/150/300/420/600 ms later (SC-331 MED-1) | **PASS 5/5** | The second modal was alive at 1.3 s at every gap; 1 write each. | Closed at 30 and 150 ms. Alive at 300 ms and later, because it opened after the rebuild. |
| S1 | Pool modal condition removal, grid and detail call sites | **PASS 2/2** | Two removals per site, modal alive after each (icons 5→4→3), 1 write each, same root. Disk: minion #1 keeps only `slowed`. | Modal closed after the first removal, at both sites. |
| S2 | Select an Ogre cell, then open its stamina modal 150/150/300/380 ms later (SC-339) | **PASS 4/4** | Modal alive at 1.5 s. The selection write landed (`selectedInstanceKey: 0-2/0-3`) with 1 write each, same root. | Modal closed in 4/4. |
| S3 | Type into the Malice label and amount inputs while the write from an earlier portrait click lands (about 404 ms after the click) | **PASS 2/2** | Text intact (`Feytouched-abcd`, `123456789012`), input still focused, caret at 15/15. **Caveat:** the input sees `blur` and `change` at the adoption and then `focus` again about 40–50 ms later (§5, risk 2). | Focus and text lost: the value was empty. |
| S3b | Type 62 characters as fast as possible (about 8 ms each) across the adoption, ×5 | **PASS** | **0 of 310 characters lost.** Focus held in 5/5. The root was out of the DOM for 38–60 ms with 0 frames painted. | Not run. |
| S4 | A embeds B, with B open in a split; four alternating writes from the pane and the embed | **PASS 4/4** | The writer was claimed each time, keeping the same root. The other instance was rebuilt fresh with the new data ("Round N" matched on both). 1 write per click. Integrity OK. | The writer was never kept. Also 1 write each. |
| S4 | Two panes of B; writes from left, right, left | **PASS 3/3** | Same as the previous row; claims always went to the writer's docId. | — |
| S4 | The detached, still-loaded duplicate embed instance | **Never claimed** (0 across all writes) | **With the guard on**, its script-triggered write was refused: `section-stale(close=false,body=false)→durable-miss`, 0 writes, 1 warning, disk unchanged. **With the guard off** it **corrupts** B: 2 fence openings, stray `temp_stamina/enemy_groups/malice` lines, round 5→3. | Corrupts the note in the same way (guard off is base's logic). |
| S5 | External body change (10→12); self-write then an undo-like revert; external edit while the ConditionsModal is open | **PASS 4/4** | External change: fresh view, old view released and unloaded, 1 entry per note, 0 claims. Self-write: claimed. Revert: fresh, old view released. External edit with the modal open: the modal closes (same as today), a fresh view shows "Alice Renamed", nothing is orphaned. | — |
| S6 | Every teardown path | **PASS** (table in §3) | The write lands on every pending-write path, 0 modals left, integrity OK throughout, 0 errors. | — |
| S7 | Two identical twin blocks; 4 lines inserted above; Increase on the lower twin | **PASS** | Lower twin 5→6, upper twin 5 untouched. The lower twin was claimed, and the upper twin was not remounted. | — |
| S7 | Twins identical, then shift by +4 or +16 lines, click the lower twin, navigate away after 30 ms (durable path) | **PASS with the persist-time refresh** | `[5,6]` both times. Durable locate at line 17 and line 29, 2 candidates each, the nearest one chosen. **Without the refresh: FAIL.** `[6,5]`: it wrote the *upper* twin, because it located the block at line 20 from a stale position. | — |
| S8 | Tall 25-hero tracker scrolled to 2779; click a portrait toggle | **PASS (3/3 runs)** | Adopt + pin: 2779 held. **Adopt without pin: 2779 held** (min = max = 2779). | No adopt, no pin: **2779→2001**, the SC-198 clamp (3/3). No adopt, with pin: held. |

Screenshots are in `sc340-spike-r2-evidence/shots-adopt/`:
- `s1-conditions-modal-after-edits.png`: modal open after 6 writes;
- `s1-pool-modal-after-2-removals.png`;
- `s2-stamina-modal-after-selection-write.png`;
- `s3-typed-after-write.png`;
- `s4-pane-embed.png`: both show Round 5;
- `s4-two-panes.png`.

`shots-control/` holds the control-run equivalents, where the modals are gone.

## 3. Every unload path and how it is handled

| path | what Obsidian does (measured) | prototype handling | result |
|---|---|---|---|
| Rebuild after the writer's own write | new processor call, then old render-child unload (r1) | claim → `rebind` + root moved; the old render child's unload sees it is superseded and does nothing | adopted in 38/38 |
| Rebuild of another instance of the block (another pane or embed) | same as above, with a different docId | ticket docId mismatch → fresh view; old render child → `release` | fresh with the new data; 1 write |
| External edit, sync or undo | changed section re-renders | body is not one of our tickets → fresh; `release` → flush; a pending write goes to the durable locate, which misses on the old body, so it is dropped with a warning | S5 pass |
| Navigate-away in the same leaf, with a write pending | renderer cleared; render child unloads; `getSectionInfo` returns null | `release` → flush → `replaceSource` → durable locate | **lands** (a, a2); SC-336 fixed |
| Leaf close, with a write pending | render child unloads (section still resolvable) | `release` → flush over the section path | lands |
| Reading → Source → Reading | **nothing unloads**; the preview stays rendered while hidden | views stay alive; a pending write lands; on return the rebuild is claimed (within the 3 s TTL) | same root; nothing leaks |
| `previewMode.rerender(true)` | every section re-renders with an unchanged body | no ticket → fresh; old view released | pass |
| Plugin disable (write pending) / enable | the registry (a plugin child) unloads, which unloads every view; sections re-render without the plugin | the flush runs over the section path while the render children still exist; a new registry on enable | lands; count after enable = rendered count (2 = 2) |
| Detach the leaf that embeds B (write pending in the embed) | embed render child unloads | `release` → flush over the section path | lands in B |
| An embed inside a leaf that navigates away | **the embed render child does not unload** until the leaf detaches (already true on base, r1) | not released; the view lingers, detached | leak exists on base, unchanged by B′ |
| The duplicate embed instance left over when A opens | never unloaded while the leaf lives; holds a stale section | never claimed; the guard refuses its stale write | its latent corruption on base is prevented |
| Canvas, hover, print hosts | `canPersist` false; never writes | owned by the registry; released on render-child unload | not exercised in this spike |

Live-view count check: after the last step, with only `other.md` open, the registry held 0 entries and 0 roots were rendered. During S6 the only extra entries were the leftover embed instances, whose leak already exists on base.

## 4. What broke or needed a workaround

1. **Moving on connect stalled.** Waiting for Obsidian to insert the empty new `el` before moving the root hit the 2 s backstop in 1/38 (final onConnect run) plus 1/33 (first run), both in S8. In the final run the probe's next file reset then overlapped with the claim still in flight, and the released view's root was appended late. **Fix: move synchronously at claim time.** That gave 0/38 timeouts, 0 frames painted without the root, and as a side effect fixed S8 without the pin.
2. **Focus.** Obsidian takes the section out of the document during its render, so a focused input inside inevitably blurs. With a real `blur` and `change`, focus and caret are restored when `el` lands. Chrome 106 has no `moveBefore`, so this cannot be avoided today.
3. **The stale-section write corrupts the note (already on base).** `replaceSource` trusts a `getSectionInfo` line range and only checks the opening fence. **Fix: the close-fence and body guard, then the durable fallback.** This is worth landing even without B′.
4. **The durable locate chose the wrong twin** when lines had shifted since the last position read. **Fix: refresh the position at persist() time.** A residual window remains: lines shifting between the click and the flush, about 400 ms.
5. **Not covered by the prototype (from reading the code):** the pipeline's `openFormEditor(view, cx, def, source, …)` closure captures the *mount-time* `source`. After an adoption the form editor would start from a stale body. The real build must pass the current serialised body.

## 5. Remaining risks

1. **The design relies on Obsidian behaviour, not API.** Three things are observed rather than contracted:
   - the old render child unloads only after async post-processors settle;
   - `ctx.docId` is stable per rendered document instance;
   - the processor call follows `modify` within milliseconds.

   All held in 100% of samples in r1 and r2, but a future Obsidian could change them. If one does, the failure mode is *degrade to today's behaviour* (a claim miss gives a fresh view), not corruption. The one exception is a docId collision between instances, which was never seen. Prescribe a real-Obsidian regression probe (S1, S4, S6) in the gate battery.
2. **`blur` and `change` fire on a focused input during adoption.** Any element that commits on `change` or `blur` (for example a stepper's text field) will commit halfway through typing, and may start another persist. Audit the handlers; alternatively mark adoption as in progress so handlers can ignore it.
3. **Claim tickets have a 3 s TTL.** A rebuild slower than that (a huge note with async parse, or a rebuild while the note is hidden in Source mode for more than 3 s) misses the claim, giving a fresh view and a closed modal, as today. It degrades safely.
4. **A pending write that meets an external edit** is dropped with a warning (a conflict). Base drops it silently. That is the correct outcome, but it is user-invisible; consider a Notice.
5. **Embed views leak until the leaf detaches**, and duplicate stale instances exist. Both already exist on base. B′ does not fix them; the guard only makes them harmless.
6. **Not exercised:** popout windows (`ownerDocument` is handled but untested), canvas and hover, and Live Preview (still a stub).

## 6. Verdict and rough size

**GO.** Every scenario passes on the design above. The only failures found were in the first design (on-connect move, no persist-time refresh) and in a write path that already exists on base, and each has a measured fix in the prototype.

Real implementation, estimated:

- **`host/adoption.ts` (new, about 150 lines).** Registry, claim tickets, the adopt move and focus restore. Minus instrumentation and the on-connect variant.
- **`host/ReadingModeBlockHost.ts` (+about 150 lines).**
  - Rebind: a mutable binding with private setters.
  - Durable identity, and a durable locate reusing `sidebar/anchor.ts` `listFences`/`findFenceByBody`.
  - The stale-section guard, and render-child unload → release.
- **`pipeline.ts` (about 15 lines).** Ownership, `setMountedBody`, and a fix so the form editor gets the current body.
- **`view.ts` (about 10 lines).** A proper "persist intent" host hook to replace the `getBlockInfo()` shortcut.
- **`registerFrameworkElements.ts` (about 10 lines).** Claim before run; create the registry.
- **`BlockHost.ts`.** Optional `rebind`/`docId` members, or keep them on the reading host only.
- **Tests (about 400 lines of jest).** Claim matching (docId, TTL, consuming a ticket, ambiguity); a durable locate with twins and shifts; guard cases; release on render-child unload; plugin-unload flush. Also a real-Obsidian probe scenario set, derived from `sc340-probe-r2.mjs`, as a gate.
- **Docs.** The framework architecture doc: the lifecycle diagram, and the fact that the registry now owns views.
- **Can be dropped or closed:**
  - SC-331's per-modal deferral branch: the unmodified modal just works.
  - SC-339 and SC-336: resolved by adoption and the durable flush.
  - **`previewScrollPin` stays for now:** adoption makes it redundant for self-writes (S8, 3/3), but rebuilds that are not adopted (external edits, the other instance) still clamp in principle. Delete it only after measuring those.

## 7. Artifacts

- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc340-view-adoption/sc340-spike-r2-report.md`
- Patch: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc340-view-adoption/sc340-spike-r2.patch`. Diff vs `e4bcd0f`; local branch `sc340-spike` @ `8c27426`.
- Probe: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc340-view-adoption/sc340-probe-r2.mjs`
- Evidence: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc340-view-adoption/sc340-spike-r2-evidence/`
  - `sc340-r2-adopt-immediate.log`: canonical, S1–S8 plus S3b.
  - `sc340-r2-adopt-onconnect.log` and `sc340-r2-adopt-onconnect-run1.log`: the first design.
  - `sc340-r2-control-s1.log` and `sc340-r2-control-s1-s4.log`: adoption off.
  - `sc340-r2-s3b-onconnect.log`.
  - `sc340-r2-s8-rep1.log` and `sc340-r2-s8-rep2.log`.
  - `timeline-adopt-immediate.json` and `timeline-adopt-onconnect.json`: raw event timelines.
  - `shots-adopt/` and `shots-control/`.
