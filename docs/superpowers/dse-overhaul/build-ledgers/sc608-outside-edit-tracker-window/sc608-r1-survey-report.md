# SC-608 r1 survey report: an outside edit while a tracker window is open

**Executive summary**
- Reading view and Live Preview, outside edit **inside the tracker block**: every window measured (pool, hero Stamina, Conditions; keyboard-opened) **closes** about 20-40 ms after the write, and focus falls to **`BODY`** (ZZ8-01/03/04/09/10). Mouse-opened pool: closes, focus goes to `.markdown-preview-view` (ZZ8-02). An edit **outside** the block (above or below) does not redraw the section: the window stays open and Apply writes correctly (ZZ8-05).
- **NEW, worse than the ticket (pinned sidebar):** the window does **not** close. The sidebar calls `update(model)` on the same view, so the window keeps references into the OLD model. Its Apply / Add then writes **nothing** (the new model is serialized) and gives no Notice. Measured for pool (ZZ8-06, and ZZ8-11 where the edit was outside the block), Conditions (ZZ8-07) and hero Stamina (ZZ8-08). Focus is fine there. **Silent data loss: HIGH.**
- **Option A** (close, then focus the rebuilt opener in the new view): about 60-90 source lines in `view.ts` plus one small hand-off helper. **Not** in `ConditionsModal.ts`. It also needs about 5 lines in `view.ts` so that the sidebar closes the window too. A page-side simulation worked in Reading view (ZZ8-12/13, at the first microtask) and in Live Preview (ZZ8-14, after a MutationObserver wait of about 45 ms). Top risk: what the user staged or half-typed is thrown away. A Notice can say so.
- **Option B** (keep the window open, and Apply writes to the reloaded tracker): about 250-400 source lines in 5-7 files, including `ConditionsModal.ts`, `StaminaEditModal.ts`, `MinionStaminaPoolModal.ts` and `LivePreviewBlockHost.ts` (which has no keep-open hook). It also needs all of A's focus hand-off, because the opener's view is gone after Apply. Top risk: every Apply today writes an **absolute** value from the snapshot taken at open (pool, Stamina, the whole conditions list). Unless each window rebases its change as a delta, it **overwrites** the outside change to the same creature (for example, Sync's damage from another device).
- **Recommendation: A, plus the sidebar made consistent (it closes too), plus a Notice when staged input was lost.** It is the smallest change, it cannot overwrite anyone's edit, it stays out of SC-580's file, and the window is short-lived, so losing a staged edit is cheap. B is worth it only if Scott values the half-typed input more than about 4x the code and the overwrite risk.

## 1. Context

- Worktree `/home/scott/code/steelCompendium/worktrees/sc608-outside-edit-tracker-window`, dse `622b0904` (verified with `rev-parse` before and after). `git status --porcelain` was empty before and after, in both dse and the superproject. `npm ci` was run (`node_modules/` is gitignored). The throwaway spec was copied into `e2e/specs/zz-sc608/` for each run and removed by literal path after it.
- Harness: **e2e** (`node e2e/run.mjs --shards=1 --only=ZZ8-…`). Pinned Obsidian 1.14.4, private Xvfb. Lifecycle was not used: e2e has `externalEdit` (= `app.vault.process`) and a page-side sampler, so it was cheaper.
- Sampler: every 10 ms plus focusin/out, it logs `[ms, activeElement, modalOpen, tracker roots]`. A root gets a new number when it is a new element, which means a new view or a re-render. Load average was 8.6 for run 1 and 2.3 for run 2. No reds depended on timing. ZZ8-05's harness "content outside the blocks changed" FAIL is expected, because that probe edits outside the block on purpose. Its data was recorded.

## 2. Inventory: every window the tracker opens

All windows open through `openModal` (`src/elements/initiative/view.ts:231-251`). That captures the SC-603 focus token and wraps `onClose`. Closing on unload is explicit, not done through the Component lifecycle: the constructor registers `this.unloading = true; this.activeModal?.close()` (`view.ts:150-157`). After close, `giveFocusBack` (`view.ts:259-263`) skips when `this.unloading` is set. That skip is the gap this ticket names. No other modal or Menu is opened in `src/elements/initiative/`. FreeHealConfirmModal is nested inside StaminaEditModal.

| Window | Opened at | Holds at open | Apply / Save writes | Typed input lost on close |
|---|---|---|---|---|
| Hero Stamina (`StaminaEditModal`) | `view.ts:1642-1655` (`init.hero.stamina` / `init.hero.bar`) | A **copy** `StaminaBar.fromHero(character)` (`src/model/StaminaBar.ts:85-87`); the closure keeps a **reference** to the live `character` object and the row's DOM nodes | Absolute: `current = clamp(snapshotCurrent + pending)`, `temp = snapshotTemp + pendingTemp`, recoveries alike (`src/views/StaminaEditModal.ts:700-719`). Then `updateHero(character)` copies current, temp **and max** onto the captured object (`StaminaBar.ts:131-135`), repaints in place, and calls `persist()` | Yes: the Apply amount box, the Stamina/Temp stepper drafts, pending changes |
| Creature Stamina (`StaminaEditModal`) | `openCreatureStaminaModal` `view.ts:2085-2120`. Callers: grid double-click `view.ts:1891`, detail row `view.ts:2010` | Copy `StaminaBar.fromCreature(instance, creature)` (`StaminaBar.ts:89-91`); references to `instance`, `creature`, `group`, DOM nodes | Absolute, as above. `updateCreature(instance)`, an in-place repaint, `persist()`. A captain crossing 0 does a full `rebuildAndPersist` | Yes |
| Minion pool (`MinionStaminaPoolModal`) | grid double-click `view.ts:1882-1886`, detail row `view.ts:2003-2007` | References to the live `group` and `creature`; the pool is read once at open (`poolCurrentStamina`, `src/views/MinionStaminaPoolModal.ts:102`); kill checkboxes reference the live `instance` objects | Absolute: `setMinionPool(group, creature, clamp(snapshot + pending))`, plus `instance.isDead = true` for each ticked box (`MinionStaminaPoolModal.ts:292-310`). Then `rebuildAndPersist()`. Condition icons in the window write at once (`:684`) | Yes: damage amount, minion count, stepper draft, ticks |
| Conditions (`ConditionsModal`) | `view.ts:2296-2302` (`init.cond.add`) | A **copy** of `holder.conditions` (`src/views/ConditionsModal.ts:130-132`); a reference to the live holder (`Hero` or `CreatureInstance`) | Live, on every add, delete or customize: the **whole list**, absolute (`ConditionsModal.ts:227-229` → `character.conditions = updated; rerender(); persist()`). Done only closes (`:215`) | Only what is half-typed: the add combobox text, the icon search, an open customize editor. Committed changes are already written |
| Reset encounter confirm (`ResetEncounterModal`) | chrome item `view.ts:388-401`, `openModal(…, false)` | Nothing. The focus token is captured by the caller (`view.ts:392`) | `resetEncounter(this.model)` → `rebuildFromWrittenReset` | No input. It opts out of the SC-603 restore, so a fix must also hand off its own token (by code; not probed) |

## 3. Today's behaviour (measured on 622b0904)

Probe spec `zz-probe608.e2e.ts.txt`, timelines `probe-base1.txt` and `probe-base2.txt` (Evidence). Outside edit: `vault.process(c => c.replace('value: 3','value: 9'))` (Malice, inside the block) unless noted.

| Probe | Surface / route | Window | Focus after |
|---|---|---|---|
| ZZ8-01 | Reading, pool, keyboard (detail Stamina), 3 dmg staged | closes at 41 ms; new root (R1→R2) in the same sample | `BODY` |
| ZZ8-02 | Reading, pool, mouse double-click | closes at 30 ms | `.markdown-preview-view` (Obsidian's return to what held focus before the open) |
| ZZ8-03 | Reading, Conditions, keyboard, "daz" half-typed | new root at 29 ms, closes at 33 ms | `BODY` |
| ZZ8-04 | Reading, hero Stamina, keyboard, "5" typed | new root at 18 ms, closes at 22 ms | `BODY` |
| ZZ8-05 | Reading, pool, edit **below** / **above** the block | **stays open**, same root (no redraw) | Apply writes `minion_stamina_pool: 17` and keeps the outside text. Focus goes to the rebuilt `init.detail.stamina` with the ring (SC-603) |
| ZZ8-06 | **Pinned sidebar**, pool, keyboard, 3 dmg staged | **stays open**. The sidebar shows Malice 9 behind it | Apply: window closes, focus goes to the sidebar `init.detail.stamina` with the ring. **The note has no `minion_stamina_pool`; the sidebar shows 20/20. The 3 damage is lost, with no Notice** |
| ZZ8-07 | **Sidebar**, Conditions, "daz" typed, edit, then Enter (adds Dazed) | stays open, "daz" kept | Dazed is shown in the window. **Note and sidebar have no condition. Lost.** Focus goes to the sidebar `init.cond.add` after Escape twice |
| ZZ8-08 | **Sidebar**, hero Stamina, 5 dmg staged; the outside edit sets Alice to `current_stamina: 20` (the same field) | stays open | Apply: **nothing written**; the note stays at 20/30. The outside value survives, the user's 5 damage is lost. Focus goes to the sidebar `init.hero.stamina` with the ring |
| ZZ8-11 | **Sidebar**, pool, edit **outside** the block ("BELOW and more") | stays open | Apply: **lost** (20/20, no pool line). `SidebarBlockHost.applyFreshContent` (`src/framework/host/SidebarBlockHost.ts:421-445`) reports any modify of the note whose block body is not our last write, so even an unrelated edit or a Sync of the note triggers it |
| ZZ8-09 | **Live Preview**, pool, keyboard | at 13 ms, focus returns to the **old** `init.detail.stamina` (still connected); new root at 24 ms; closes | `BODY` (the old root is detached) |
| ZZ8-10 | Same note in Reading view **and** pinned; window opened from the Reading view copy | closes at 28 ms; Reading view root replaced (R20→R22), sidebar root kept (S21) | `BODY` |

Why the sidebar loses the write: `SidebarPanel.handleExternalChange` → `previous.update(model)` (`src/framework/sidebar/SidebarPanel.ts:312-322`). The view is not unloaded, so `activeModal` is not closed. `ElementView.update` sets `this.model = model` (`src/framework/view.ts:217-218`). Every window callback then mutates the old objects it captured. `persist()` serializes `this.model`, the new one, so the write is a no-op. The window closes as if it had saved.

## 4. Mechanism and reuse of SC-552's keep-open (K)

- The close is **explicit**: the view-lifetime `register` in the constructor (`view.ts:150-157`) runs when Obsidian unloads the old section's render child, and the outside edit makes Obsidian redraw that section. The window is not a child Component. SC-552's K is the same shape: `openFormEditor` hangs the close on `owner.register` and asks `cx.host.keepFormOpenOn()` first (`src/authoring/FormModal.ts:568-578`).
- K is reusable **only for Reading view**. `ReadingModeBlockHost.keepFormOpenOn` (`src/framework/host/ReadingModeBlockHost.ts:573-581`) returns the registry while the note is still shown in some markdown leaf and the plugin is loaded. That gives B the right lifetime: it closes on leaf close, navigate-away or plugin unload. `LivePreviewBlockHost` does **not** implement it, so B in Live Preview needs a new host method (about 20-30 lines) or a fallback to A there. Hover previews (not probed) are Reading-view hosts.
- K only keeps the window **alive**. The form's Save is position-based (a pin), but the tracker windows' callbacks are closures over the **old view, old model objects and old DOM nodes**. B therefore has to rewrite all five callbacks to an "identity + change" form that runs against the successor view's model.

## 5. Option A: close, then focus the rebuilt control in the new view

Feasibility (Q4):
- **Which view runs it.** The old view knows the token, because it captured it at open in `openModal`. Today the token lives only in the `onClose` closure, so it must be stored on the view, for example `activeFocus`. The new view does not. So the old view **arms** the hand-off in its unload `register`, and the restore must land in the **new** root.
- **Order.** In Reading view the new root is already in the document when the old view unloads (ZZ8-01/03/04: new root at or before the close). In Live Preview it is **not**: the close comes first (13 ms) and Obsidian's focus return lands on the old, still-connected control. The new root arrives at 24 ms. So the restore must wait, the way `claimChromeFocus` does (a MutationObserver plus TTL, `src/framework/chrome/focusHandoff.ts:222-272`). It must also treat focus on the **dying view's own control** as free, as SC-518's `staleOpener` rule does (`focusHandoff.ts:251-253`).
- **Finding the replacement control.** `controlFocus.ts` tokens are `{family, nth, ring}` relative to a root (`src/framework/kit/controlFocus.ts:47-67`), so they work on any root once it is found. A creature removed by the edit makes `nth` clamp to the last control of the family, else the root, and never `<body>`. The **root** is found as: the same `sourcePath`, the same scope (leaf or embed: `scopeOf`, `focusHandoff.ts:88`) and the same tracker index within that scope. `blockKey()` includes the fence line, which an edit above the block moves, so it is not a good key. ZZ8-10 shows the scope rule is needed: the sidebar copy of the same block must not take it.
- **The SC-589 sidebar hand-back does not cover this.** It captures and restores inside one `update()` on the same view (`view.ts:166-176`). In the sidebar, focus is already right after Apply (SC-603's `giveFocusBack`; the view never unloads). The sidebar's problem is the lost write, not focus.
- **Simulated (page-side, no product change).** In Reading view, a microtask after the window left the DOM, `init.detail.stamina` / `init.cond.add` were focused in the new root with the ring and held for 2 s (ZZ8-12 at 47 ms, ZZ8-13 at 32 ms). In Live Preview the microtask attempt found no control yet; the observer fallback focused it at 45 ms (ZZ8-14).
- **Mouse opens.** The token is null (focus was not in the tracker), so nothing is done and focus stays on `.markdown-preview-view`, as today (ZZ8-02).

Cost: `view.ts` about 15-25 lines (store the token, arm it in the unload `register` including Reset encounter's own token, claim it after mount). The hand-off helper (`claimChromeFocus`-shaped: arm, TTL, observer, scope, stale-opener rule) is about 50-70 lines, either new or generalised from `focusHandoff.ts`. Sidebar consistency is about 5 lines in `InitiativeView.update`: when `outside && this.activeModal`, close it before the rebuild; SC-603's `giveFocusBack` then lands on the successor, since the view is not unloading. A Notice when the window had staged input adds about 5-10 lines per window, or one generic line. Tests: jest about 100-150 lines, one e2e spec about 100 lines (Reading view pool + Conditions, sidebar, mouse no-op, two copies). A lifecycle scenario is optional. Files: `view.ts` and `focusHandoff.ts` (or a new `kit/` file). **Not `ConditionsModal.ts`.**

## 6. Option B: keep the window open, and Apply writes to the reloaded tracker

What B must do:
1. Keep the window open past unload (K): `view.ts` about 20 lines in Reading view. Live Preview needs a new `LivePreviewBlockHost.keepFormOpenOn`-like hook (about 20-30) or must fall back to A.
2. Find the successor view (the registry: same sourcePath, scope and index) about 30 lines. Sidebar: same view, new model.
3. Re-resolve targets by identity: hero by index plus name, group/creature/instance by indices plus `instance.id` (the instance key is `${creatureIndex}-${inst.id}`, `view.ts:1760`). About 40 lines.
4. **Rebase instead of overwriting.** Each Apply writes `snapshotAtOpen + pending` as an absolute value. If the outside edit changed the **same** field (ZZ8-08's setup: another device's 10 damage), an unrebased B writes 25 over 20 and **undoes** the other edit. A safe B passes the pending **deltas** (StaminaEditModal's `pendingStaminaChange` / `pendingTempStaminaChange` / `pendingRecoveriesChange`, `StaminaEditModal.ts:284-290`; the pool's `pendingStaminaChange`) and clamps against the **live** value. That means `StaminaEditModal.ts` and `MinionStaminaPoolModal.ts` change (about 20-40 lines each). Kill ticks must re-resolve instances by id; a minion already dead outside makes the tick count wrong. Conditions writes the **whole list** at once, so a safe B has to refresh the window's list from the live holder on an outside change, or turn its writes into add/remove operations. That is about 40-60 lines in **`ConditionsModal.ts`, SC-580's file**. The SC-580 branch (`b17044b0`, `eafa31c1`, `eecd2ff6`) changes 46 lines there.
5. The creature was removed: no write, a Notice, and the window stays open or closes (about 10-20 lines). The note was closed or navigated away: K already closes it (nothing written), same as SC-552 F2.
6. Focus after Apply or Cancel: the opener's view is gone, so B needs **all of Option A's hand-off** as well.

Cost: about 250-400 source lines in 5-7 files (`view.ts`, `focusHandoff.ts` or a new helper, `StaminaEditModal.ts`, `MinionStaminaPoolModal.ts`, `ConditionsModal.ts`, `LivePreviewBlockHost.ts`, possibly `BlockHost.ts`). Tests: about 400+ lines plus a lifecycle scenario (plugin off/on and leaf close with a window open, as G-S64 did).

## 7. Option C (variants)

- **C1 = A + Notice** ("The note changed outside, so this window closed without saving."). It is cheap, and it tells the user why their staged edit is gone. This is the recommendation.
- **C2 = B + "changed outside" banner**: the window stays open, its displayed current values refresh from the live model, and a notice line says the note changed. It is the only version of B that is honest about the overwrite case. It costs more than B: every window needs a refresh path.

## 8. Risks (one line each)

- **A, data:** staged or half-typed input is thrown away (pool damage and ticks, Stamina amount, Conditions combobox text). Committed Conditions changes are already saved.
- **A, focus theft:** while the window is open, focus is in the window, so no pane in that document can hold it. The restore runs only for a non-null token and while focus is free (or on the dying view's own control). **Popout windows**: a user typing in a popout while the window sits in the main window. The restore must check the root's own document (`focusIsFree(root.ownerDocument)`, plus `doc.hasFocus()`), or it moves the app's focus.
- **A, wrong copy:** the same block in two leaves, or pinned too (ZZ8-10), or `two-trackers.md`. Key by sourcePath + scope + index, never by `blockKey` alone.
- **A, Live Preview:** the old control briefly takes focus back (ZZ8-09 at 13 ms), so a naive "focus is free" check skips the restore. SC-602 still owns Live Preview's own write blink.
- **B, overwriting:** absolute writes from the snapshot at open undo an outside change to the same creature (Sync from another device). It needs delta rebasing in 3 window files.
- **B, wrong target:** an outside edit that reorders or removes creatures re-resolves to the wrong creature or instance unless identity is checked (name plus id).
- **B, scope and overlap:** it touches `ConditionsModal.ts` (SC-580, running), adds a keep-open hook to the Live Preview host, and runs to 4x A's code. A window kept past its view also needs SC-552's plugin-unload, leaf-close and navigate-away guarantees.
- **Both, sidebar:** today's silent loss (§3) must be fixed whichever option is chosen. For A, close on an outside `update()`. For B, re-resolve and rebase in the same view.

## 9. SC-580 overlap (Q6)

- A: `src/elements/initiative/view.ts` plus a focus hand-off helper (`src/framework/chrome/focusHandoff.ts` or a new `src/framework/kit/*` file). **No overlap** with SC-580.
- B: the files above **plus `src/views/ConditionsModal.ts`**, which SC-580 changes (`sc580-conditions-type-to-search`: `ConditionsModal.ts` +46 lines, its jsdom matrix and `cond-integrity.e2e.ts`), plus `StaminaEditModal.ts`, `MinionStaminaPoolModal.ts` and `LivePreviewBlockHost.ts`. Coordinate through the dispatcher before touching it.

## 10. Questions for Scott (for the owner's ask)

1. When the note changes from outside (Sync, another device) while a tracker window is open, should the window **close** (whatever you typed in it is dropped, focus goes back to the control you opened it from), or **stay open** and save onto the updated tracker?
2. If it closes: should a Notice say so?
3. (Information, not a choice) The pinned sidebar today keeps the window open and then silently drops its Apply. That gets fixed either way.

## Evidence

All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc608-r1-survey/`:

| What | Files |
|---|---|
| Probe spec (never committed; copied in for each run and removed) | `zz-probe608.e2e.ts.txt` |
| Runner and pretty-printer | `run-probe.sh`, `compact.py`, `npmci.sh` |
| Run logs, exit codes and load | `e2e-probe-base1.log` / `.rc` (ZZ8-01..10: 9/10 ok, ZZ8-05 = the expected outside-text invariant), `e2e-probe-base2.log` / `.rc` (ZZ8-11..14: 4/4 ok), `npmci.log` / `.rc` |
| Timelines | `probe-base1.jsonl` / `.txt`, `probe-base2.jsonl` / `.txt` |
