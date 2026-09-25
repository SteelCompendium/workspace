# SC-340 — decisions ledger (view adoption, "B′")

Ticket: SC-340 "DSE framework: keep a block's live view alive across its own save (view adoption)".
Owner: top-level session 524e7562-85b1-4f85-bfbc-08f716269258 (Opus 5.5). Origin: SC-331 (ledger
`.superpowers/sdd/sc331-condition-modal/sc331-decisions.md`).

## Scott's rulings (verbatim, dated)

- 2026-09-23: "Before going forward, this seems really fragile in general.  Is there any way to carry out the save in a more reliable way?  The 400ms window is small, but can be error prone (as evident from the backlog tickets you made).  What alternatives do we have?"
- 2026-09-23 (options offered: A hold-saves-while-interacting, B modals-survive-rebuild, C stop-writing-per-click, D durable block identity, E sidebar-first): "I think I choose B.  It seems like the "most correct" long-term decision, even if its a bit heavier of a task. Do you agree with that?"
- 2026-09-23 (after the owner proposed B′ + a spike first): "The plugin isnt live, so im not super rushed to get sc-331 landed.  Id say kick off your refined version of B"

## The approved direction — B′ as proposed to Scott (owner's words, 2026-09-23)

"When a block's rebuild is caused by our own write, the new mount adopts the existing live view instead of
building a fresh one — the view's DOM subtree + Component tree are moved into the new container and the host
is re-pointed at the new section. The view never dies, so open modals, focus, typed text, collapsibles all
survive; saves stay live (no held edits). It's the reading-mode analogue of what the sidebar host already does
(it ignores its own echo). Matching needs 'last body we wrote + block position' — the same identity D needs, so
SC-336's fix falls out of the same machinery. If no matching rebuild arrives within a short grace window
(navigate-away, block not re-rendered because it's off-screen), the parked view unloads for real and flushes
via that remembered identity. A rebuild whose body doesn't match our last write (sync, hand edit, undo) gets a
fresh view, exactly as today."

Path: architectural (brainstorming). Stage now: **throwaway feasibility spike** (approved). Then written spec
→ Scott review → implementation plan → build. Spike code is throwaway — never landed.

## Key facts at start

- SC-198 (measured, Obsidian 1.13.7): ANY write to the open note → `setViewData → previewMode.set →
  renderer.set → queueRender` tears down every rendered section and re-measures; not plugin-specific.
  Workaround in place: `src/framework/host/previewScrollPin.ts`.
- `src/framework/host/ReadingModeBlockHost.ts`: one MarkdownRenderChild per block (`ctx.addChild`), host
  `addChild` proxies to it → the view unloads with the section. Identity via `ctx.getSectionInfo(el)`.
- `src/framework/host/SidebarBlockHost.ts`: owns its render; self-echo guard `lastWritten` (body compare);
  anchor/`findFenceByBody` identity (`src/framework/sidebar/anchor.ts`).
- `src/framework/session.ts` SessionStore keyed by `blockKey()` = `${sourcePath}::${language}::${lineStart}`.
- LivePreviewBlockHost is a stub; reading mode is the only supported render mode (ADR 2024-08-18).
- SC-331 reviewer measured echo timing: write ~400–450 ms after a change; old view unloaded by ~450–700 ms;
  close stack `… Component.unload ← removeChild ← cleanupParentComponents ← onRender`.

## Round log

- 2026-09-23 spike r1 (orchestration:reviewer; report `sc340-spike-r1-report.md`, patch `sc340-spike-r1.patch`,
  local branch `sc340-spike` @ 68578a6 — never pushed). Obsidian 1.14.2. Leaning **conditional GO**. Facts:
  - E1: NEW mount runs BEFORE the old view unloads, 15/15 — guaranteed (onRender awaits async post-processors,
    incl. pipeline.run, before removing the old render child). modify→new processor 2.5/4.7/9.8 ms;
    new-mount-done→old unload 15/19.6/32.8 ms. At processor time `el` is detached but getSectionInfo resolves;
    body == written body 15/15; `ctx.docId` stable across the rebuild.
  - E2: ONLY the changed section remounts; unchanged siblings and plain-text edits remount nothing (their live
    getSectionInfo follows shifted lines). Only `previewMode.rerender(true)` remounts all.
    **Correction:** the "Key facts at start" line paraphrasing SC-198 as "tears down every rendered section" is
    WRONG for DSE block mounts — the preview re-measures (sizer collapse), but only the changed section remounts.
  - E3: scrolling never unloads/remounts; off-screen sections stay loaded (detached); an off-screen write
    rebuilds immediately.
  - E4: embeds rebuild independently; the NON-writer instance (pane+embed) rebuilds FIRST by 50–100 ms; only
    `ctx.docId` distinguishes instances (stable per instance). 2/3 runs left a detached, never-unloaded embed
    instance (can still write a stale model); an embed's view isn't unloaded on leaf navigate-away (only detach).
  - E5: view parented under a plugin-owned Component outlives the render child; open ConditionsModal survived
    2.5 s (control closed by 600 ms). Without host re-point a later write is dropped (canPersist false); a manual
    claim (move root into new el + re-point ctx/containerEl) makes writes land. `Component.removeChild` always
    unloads → the view must be owned outside the render child FROM THE START.
  - Conditions: claim at processor time; key (docId, path, written body); own lifecycle outside the render
    child; a real host re-point op; an unclaimed-view flush path not relying on getSectionInfo.
  - Risks: (1) multi-instance identity (pane+embed, stale embed instances); (2) every unload path becomes ours
    (navigate-away, leaf close, Source↔Reading, plugin unload, external-edit rebuild, rerender(true), embed
    detach); (3) host re-point invasive (private ctx/containerEl, closures holding cx.host, blockKey/session keys
    moving with the line).
- 2026-09-23 owner: proceed to spike r2 (prototype) — same worker resumed, same throwaway branch.
- 2026-09-23 spike r2 (same worker; report `sc340-spike-r2-report.md`, patch `sc340-spike-r2.patch`, `sc340-spike`
  @ 8c27426, never pushed). Verdict **GO**. On base e4bcd0f (unmodified live-persisting ConditionsModal):
  S1 6/6 writes with modal open, Done→reopen 5/5, pool removals 4/4; S2 4/4; S3 focus/caret 7/7, 0/310
  keystrokes lost; S4 7/7 (writer-only adoption), stale embed copy never claimed; S5 4/4; S6 every teardown
  path lands its pending write (SC-336 fixed); S7 twins OK (needs position refresh at persist()); S8 scroll
  held without the pin 3/3 (control clamped). 38 adoptions, 0 ambiguous, 0 timeouts, 0 painted frames with root
  detached. Design corrections: move root synchronously at processor time; refresh position at persist().
  Risks: relies on observed (non-API) Obsidian behaviour → prescribe a real-Obsidian probe gate; blur/change
  fire once on a focused input during adoption → audit commit-on-blur handlers; form-editor button keeps the
  mount-time body after adoption (code-read). Size ≈ 5 prod files / 400–550 lines + ~400 test lines + probe.
  - Base corruption bug (stale getSectionInfo, only open fence checked; detached embed copy; script-triggered):
    owner ruling FILE → **SC-343** (Backlog, High). Recommend it land first, standalone.
  - previewScrollPin: KEEP for now (non-adopted rebuilds still need it).
- 2026-09-23 owner: next = Scott's approval of the design shape → written spec. Asks batched on SC-340.

## Scott's rulings — 2026-09-23 (terminal, answering the four asks on SC-340)

- "1. yes / 2. yes / 3. yes / 4. yes" — i.e.
  1. Write the spec for B′ as prototyped (spec → Scott review → plan → build; no product code before both).
  2. Land SC-343 (stale-position corruption guard) first, standalone; SC-340 builds on it.
  3. Retire SC-331's per-modal fix instead of landing it; SC-331 closes when SC-340 lands; its branch
     (`sc331-condition-modal` @ 2cd5275) is kept only as a fallback until then.
  4. Add a real-Obsidian (headless) check of the key cases to the standard dse-verify battery.
- "After this work, I want to resolve sc-343" — owner reading (stated to Scott): sequence is SC-340 spec →
  SC-343 build+land → SC-340 plan/build.
- 2026-09-23 spec drafted by the spike worker (`a2e6d57`), owner-reviewed and edited (`2428179`) on the worktree
  superproject branch `sc340-view-adoption`: `docs/superpowers/dse-overhaul/SC-340-view-adoption-spec.md` (593 lines).
  Owner edits: canPersist via durable identity requires a section that RESOLVED AT LEAST ONCE (else hover/print/
  nested renders become writable; nested durable-locate could write into the note); invariant "nothing an adopted
  view depends on is a child of the old render child" (verified: pipeline.ts:682 is the only host.addChild; nested
  renders parent to the view, view.ts:234); nested-block + hover rows in the unload table and gate G-S6; dropped the
  leaked-copy Notice-suppression heuristic (would hide real off-screen misses, B10). Owner decisions: Q1 position
  refresh → SC-343; Q3 ds-conditions stays close-deferred → follow-up **SC-344** (Backlog, blocked by SC-340);
  Q4 kill switch = hidden `viewAdoption` data.json key. Open for Scott: Q2 Notice vs console on a dropped save.
  Spec attached to SC-340; review ask posted; SC-340 → In Progress + Needs Review.

## Scott's rulings — 2026-09-23 (terminal, answering the spec-review ask)

- "spec approved. plan adn implement with subagent driven dev.  Show the obsidian notice."
  → Spec `2428179` APPROVED (incl. owner decisions Q1/Q3/Q4). Q2 = show an Obsidian Notice on a dropped save
  (rate-limited one per note per 5 s, + console.warn; text per spec §8/§13). Execution method chosen by Scott:
  superpowers:subagent-driven-development; Scott waived a separate plan-review gate ("plan and implement").
  Sequence unchanged: SC-343 first (standalone, landing approved by ruling 2), then SC-340.
- 2026-09-23 plans written (plan worker): SC-343 plan `3b1b19b` (sc343 worktree superproject, 7 tasks T0–T6, 1465 lines);
  SC-340 plan `5593655` (sc340 worktree superproject, 9 tasks T0–T8). Both against dse origin/develop 0c132d8 (SC-278).
  Owner rulings on the planner's spec gaps (all ACCEPTED):
  1. Release ships with registry ownership (SC-340 T2, adoption off) — ownership without release leaks every view.
  2. Spec §6.4 unload-order text is wrong: Obsidian runs registered callbacks LIFO, so the view's flush runs AFTER a
     modal's close; better (a save scheduled by onClose still lands). T2 pins the real order. Spec to be corrected at land.
  3. docId collision guard by position (same docId+file+last-known line on two live views), not preview container
     (new el is detached at processor time — spike-measured).
  4. Hover read-only is asserted by the gate (G-S6g); if hover is writable on the pre-SC-340 build too → stop & report.
  5. Unspecified edge cases pinned "same as today": CRLF saves normally; non-column-0 fence: no write, no Notice;
     unterminated fence at EOF still saves and closes.
  6. Notice <note> = file basename without extension; rate limit keyed by sourcePath.
  7. CHANGELOG: SC-343 adds one [INTERNAL] bullet (incl. Notice text); SC-340 extends it (no [FIX]).
  8. Registry created inside registerFrameworkElements (plugin.addChild), returned to main.ts — equivalent to spec.
  9. Mock-fix breakage procedure in SC-340 T1 (two allowed causes; fix tests not mock; stop otherwise).
  SC-343 gate decision: SC-343 CREATES `visual-harness/obsidian-lifecycle.mjs` (5 scenarios: G-S7a/b, G-S6a/b, G-S5n)
  and battery step 4; SC-340 appends 13 → 18. Leaked-embed-copy scenario only in SC-340 (unreachable on base).
- 2026-09-23 SC-343 execution started (subagent-driven). SDD ledger:
  /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/.superpowers/sdd/2026-09-23-sc343-stale-write-guard/progress.md
- 2026-09-24 note for SC-340 (from SC-343 Task 3 review): by design a stale section range that happens to cover a
  byte-identical twin passes the section guard and writes that twin; only a detached copy has a stale range —
  SC-340's registry/claim must keep detached copies from writing through a stale section path.
- 2026-09-24 from the SC-343 final review (real Obsidian 1.14.2, base == head): HOVER POPOVERS ARE WRITABLE — their
  section resolves and a click writes the correct block (also after the popover closes). Spec §6.4/§6.5-item-4 and
  BlockHost.ts's "hover is non-persistable" premise is FALSE; SC-340 plan's G-S6g ("hover renders read-only") WILL FAIL
  as specified — amend it (assert hover writes the RIGHT block, or drop the claim). The resolved-once rule still holds:
  nested renders (ds-party hero_ref) measured read-only.
- Invariant for SC-340 (SC-343 T3 note): `rebind` must keep `knownBody` non-null (only then is the tolerant-EOF +
  stale-range path unreachable).
- SC-343 carries a byte-identical copy of this spec (2428179) on its superproject branch → before SC-340 lands, merge
  origin/main into the sc340 superproject branch (add/add on the spec if SC-340 edited it first).
- 2026-09-24 SC-343 LANDED (dse 48ac20c, main 41058a4); SC-343 + SC-336 Done. SC-340 execution started (subagent-driven).
  SDD ledger: /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/.superpowers/sdd/2026-09-23-sc340-view-adoption/progress.md
  Superproject branch merged origin/main (a2e7862). Rulings: 6/6 baseline, 19/19 final gate; G-S6g rewritten (hover writes the
  RIGHT block); T8 corrects the SC-340 spec (§6.4 unload order, hover row, §6.2 collision mechanism).
- 2026-09-25 SC-340 LAND-READY: dse `sc340-view-adoption` @ 619c4bd (on develop 6c4f6aa); superproject @ 7e0dbda. Final review
  "Ready to merge: Yes". Battery: tsc/lint clean; jest 4038/1; lifecycle 19/19; shots 524 0 FAIL; freeze 260/260; parity 0/0/16.
  Evidence (real Obsidian, develop vs 619c4bd): evidence/*.png in this dir. Landing ask posted to SC-340 (In Progress + Needs Review).
  Filed during the build: SC-353, SC-363, SC-365; root cause posted on SC-352.

## Scott's ruling — 2026-09-25 (terminal, answering the landing ask)
- "land it" → land SC-340 on dse develop (no tag/release); then close SC-331, SC-339, SC-337; delete the sc331-condition-modal branch.
