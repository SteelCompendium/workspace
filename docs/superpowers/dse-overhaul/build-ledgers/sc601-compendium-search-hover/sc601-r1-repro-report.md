# SC-601 r1: reproduction report (real Obsidian 1.15.1)

## Executive summary

- **REPRODUCED, on every opening path.** With a hover preview made a source editor, opening the compendium search by its command (executeCommandById, a real hotkey, or the command palette) and then pressing in the search input, its box or its backdrop closes the preview 0-41 ms later. This happened in 54 of 54 trials in the final run, and the earlier run matched. A suggestion click, or keys alone (no click), keeps the preview and inserts correctly (12 of 12).
- **What the user sees:** after a click in the search box, the reference they then pick is silently lost. It goes into the detached CodeMirror editor of the closed preview, so nothing reaches disk, the host note, a Notice or the console (42 of 42 choices measured, 6.5 s watch).
- **The closer is Obsidian's.** The only `hide()` call comes from app.js 1.15.1 line 509, col 193553: `m=>{m.defaultPrevented||h.contains(m.targetNode)||d.hide()}`, the click-to-edit window BUBBLE listener. The window-capture `T3` listener plays no part, because the preview is already focused.
- **Host-wide mechanism (control ii):** Obsidian's own quick switcher and command palette close the editing preview the same way (9 of 9). Obsidian's own Insert template loses its insert too: nowhere with a Reading-view host (3 of 3), and in the WRONG (host) note with a Live Preview host (3 of 3).
- **Ours to guard anyway:** a DseModal opened inside the editing preview keeps it under title and input presses (6 of 6), because the SC-595 document guard stops the click. The SuggestModal has no such guard. Fix location is in §6. No product code was changed.
- **Probe:** `G-S97` at dse `0da7e1d3` (branch `sc601-compendium-search-hover`, on `5f7c5336`). `node visual-harness/obsidian-lifecycle.mjs --only=G-S97` exited 0 (114 trials, 0 harness errors, about 19 min).

## 1. Setup

- Obsidian 1.15.1 (printed by the harness), Xvfb, scratch vault (demo-vault copy, `livePreview: false`).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc601-compendium-search-hover`, dse HEAD `0da7e1d3`, a probe-only commit on `5f7c5336`. `origin/develop` was still `5f7c5336` when fetched. `node_modules` was copied from the main checkout (identical lock).
- The superproject pointer is left unbumped in the worktree (` M draw-steel-elements`) for the owner's landing flow.
- Fixtures: two compendium notes with `scc:` frontmatter (`Compendium/gs97/gsprobe-{goblin,kobold}.md`). Each trial gets its own fresh `Lifecycle/gs97-<k>-src.md` (prose "alpha line one", "beta line two") and a host that links it.
- Drive (all REAL CDP input; no `el.click()` anywhere in the main path):
  1. A real hover over the link.
  2. A real press on the preview's "beta line two" text. The preview becomes a source editor. In every hover trial: `.is-editing`, a visible `.cm-editor`, focus on `cm-content` in the preview, and `app.workspace.activeEditor` is the embed (`inPreview: true`, `paneView: false`).
  3. Open the search.
  4. A real press (input, backdrop, box, suggestion).
  5. State read at 1.5 s.
  6. A choice: a real press on the first suggestion, or ArrowDown + Enter.
  7. Landing read from disk (`fs`), from `app.vault.read`, from the vault `modify` events and from the captured editor (`editor.getValue()`, `editor.cm.dom.isConnected`), after waiting up to 5 s plus 1.5 s.
- Instrumentation:
  - a spy on the popover instance's `hide()`, with a stack;
  - a window BUBBLE click recorder, registered after Obsidian's listener, so its `defaultPrevented` is what Obsidian saw;
  - a MutationObserver that times the popover element's removal.
- Load: `/proc/loadavg` 1-min was 6.75 at start, then 2.69, 2.17 and 7.14 at the end of reps 1, 2 and 3 (final run; other efforts' lifecycles ran concurrently). Earlier run: 1.42, then 1.62, 6.67, 2.31. The results did not vary with load.

## 2. Openers available while the preview is editing

| Opener | Kind | Available with the preview editing? |
|---|---|---|
| `draw-steel-elements:insert-compendium-reference` (`compendiumInsert.ts:355-366`) | `editorCallback` | Yes. `executeCommandById` returned `true`; a real Ctrl+Shift+Y bound to it opened it; the palette lists it (`"Insert Draw Steel: compendium reference"`) and Enter runs it against the embed (activeEditor still the embed after the palette closes). |
| `draw-steel-elements:insert-compendium-block` (`:368-385`) | `editorCallback` | Yes. Same modal, same closure on an input press (3 of 3). Its choice was not driven. |
| Ribbon, menu, sidebar | none | The code has no other opener of `CompendiumSearchModal` (only these two commands construct it). |

## 3. Results (final run `0da7e1d3`, n = 3 per row; the earlier run `full1`, same matrix, had identical outcomes in every row)

Preview / search state is read 1.5 s after the press. "Lands" is where the chosen reference ended up.

| Opened by | Press on | Preview at 1.5 s | Search at 1.5 s | Choice | Lands |
|---|---|---|---|---|---|
| cmd / hotkey / palette | input (`INPUT.prompt-input`) | **gone** (3/3 each) | open, focus in input | real press on suggestion | **nowhere** (in the dead editor buffer) 9/9 |
| cmd / hotkey / palette | input | **gone** | open | ArrowDown + Enter | **nowhere** 9/9 |
| cmd / hotkey / palette | box (`DIV.prompt-results` empty area) | **gone** | open, focus on `body` | real press on suggestion | **nowhere** 9/9 |
| cmd / hotkey / palette | box | **gone** | open | ArrowDown + Enter (still works with focus on body) | **nowhere** 9/9 |
| cmd / hotkey / palette | backdrop (`.modal-bg`) | **gone** | closed (as usual) | none | n/a 9/9 |
| cmd / hotkey / palette | a suggestion | **shown, `.is-editing`** | closed (chosen) | the press itself | **the hovered note** 9/9 |
| cmd | nothing (Enter on the open search) | shown, `.is-editing` | closed | ArrowDown + Enter | the hovered note 3/3 |
| cmd, host in Live Preview | input | **gone** | open | press on suggestion | **nowhere** 3/3 (not the host note either) |
| cmd, vault `livePreview: true` (the preview's editor is LP) | input | **gone** | open | press on suggestion | **nowhere** 3/3 |
| block cmd | input | **gone** | open | not chosen | n/a 3/3 |

How the preview closes and what the lost insert leaves behind:

- **Popover removal:** the popover element was removed 0-41 ms after the press (window-bubble timestamp) in all 69 closing trials of the final run.
- **Hide stack:**
  - The first `hide()` is called from `app.js:509:193553`.
  - The second `hide()` (re-entrant, during unload) comes from `editMode.register(()=>d.hide())` at `509:193699`.
  - `T3` (window capture) never called `hide`.
- **Click flags:** at the window bubble phase every closing click had `defaultPrevented: false`. Suggestion clicks had `defaultPrevented: true` (SuggestModal's own handler), so they survive. This matches the ticket's reading.
- **After the preview closes:** `app.workspace.activeEditor` becomes the host pane's view. The command, however, had captured the embed's `Editor` at open (`compendiumInsert.ts:358/371`).
- **What the lost insert leaves:** `replaceSelection` runs on the detached editor without throwing. `getValue()` contains the reference, but `cm.dom.isConnected` is false. There were 0 modify events, 0 page errors and 0 Notices.

## 4. Controls

| Control | Trials | Result |
|---|---|---|
| (i) The note in a pane (source mode), same opens, presses and choices | 18 (6 rows x 3) | Every choice lands in the note (input / box with press or keys, suggestion press). The backdrop closes the search only. No `hide`. |
| (ii) Obsidian quick switcher (`switcher:open`) from the editing preview, press on its input | 3 | Preview **gone** 3/3, same call site `509:193553`. |
| (ii) Quick switcher, press on its box | 3 | Preview **gone** 3/3. |
| (ii) Command palette (`command-palette:open`), press on its input | 3 | Preview **gone** 3/3. |
| (ii) Obsidian **Insert template** (`insert-template`, a SuggestModal that inserts into the active editor), press on its input, then press on the template | 3 (Reading-view host) + 3 (Live Preview host) | Preview **gone** 6/6. The template lands **nowhere** with a Reading-view host (3/3), and in the **host note** with a Live Preview host (3/3: Templates reads `activeEditor` at choose time). |
| (ii) Insert template: suggestion press, or keys only | 6 | Preview stays, the template lands in the hovered note. |
| (ii) Insert template in a pane | 3 | Lands in the note. |
| (iii) DseModal (Stamina, opened by a real press on the bar inside the editing preview; vault `livePreview: true` so the editing preview draws the card), press on the title | 3 | Preview **shown, `.is-editing`**, modal open 3/3. The press never reached the window (document guard). |
| (iii) The same, press on the Apply input | 3 | Preview shown, modal open, focus in the input 3/3. |

**Verdict on ours vs host-wide:** the preview closing is Obsidian's general rule for an editing hover preview. Any non-default-prevented click outside it, including clicks in Obsidian's own modals, closes it, and Obsidian's own Insert template suffers the same loss, or worse (the wrong note). The DSE-specific part is that our modal holds an editor captured at open time. That makes the consequence a silent loss, never a wrong-note write. DSE already guards its DseModals against exactly this listener (SC-595), and the SuggestModal is outside that guard.

## 5. Evidence

- Final run log: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc601-r1-a51f2dfbca649fb6b/final-0da7e1d3.log` (one `G-S97-REC <json>` line per trial). Table: `.../final-0da7e1d3.table.txt`.
- Earlier full run (pre-commit probe, same main matrix, 99 trials, exit 0): `.../full1.log`. Template control runs: `.../extra3.log` (12) and `.../extra4.log` (3, Live Preview host).
- Tabulator: `.../tabulate.py`. Obsidian 1.15.1 `app.js` extracted for the call site: `.../app-1.15.1.js` (line 509, col 193553).
- Deciding screenshot pair (press on the input, cmd path, Reading view):
  - `.../shots-final/gs97-hover-rv-cmd-input-click-k1-1-before-click.png` (the preview's bottom edge, "END", is visible behind the search)
  - `.../shots-final/gs97-hover-rv-cmd-input-click-k1-2-after-click-1500ms.png` (the preview is gone, the search is still open)
- Native-control pair: `.../shots-final/gs97-hover-lp-template-input-click-k33-{1-before-click,2-after-click-1500ms}.png`.

(`...` = `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc601-r1-a51f2dfbca649fb6b`)

## 6. Where a fix would go (not implemented)

1. **Guard the SuggestModal's clicks at its document, as SC-595 does for DseModal.**
   - The guard to reuse is in `src/framework/kit/managedModal.ts:220-229`, `keepHoverPreviewAlive`:
     - a document BUBBLE listener;
     - `evt.composedPath().includes(this.containerEl)`, then `stopPropagation()`, never `preventDefault`;
     - removed one task after close.
   - Factor that block into a shared helper and call it from `CompendiumSearchModal.onOpen` (`src/authoring/CompendiumSearchModal.ts:95`). Install it only when the target editor lives in a `.hover-popover`.
   - Pass the anchor from the commands at `src/authoring/compendiumInsert.ts:358` and `:371`. `editorCallback`'s second argument is the embed (`MarkdownFileInfo`; its runtime `containerEl` is inside `.hover-popover`), or use the editor's `cm.dom`.
   - The `.modal-bg` press is inside `containerEl`, so the backdrop would then close only the search, as the DseModal guard does.
   - No keymap re-push and no `focusHoverPreviewNow` are needed. The search is opened by a command or key, not by a click inside the preview, and the preview is already focused. Measured: `T3` never fires here, and the only `hide()` is the bubble listener.
2. **Defence in depth, at choose time** (`CompendiumSearchModal.ts:161` `onChooseSuggestion`, or `compendiumInsert.ts:362/375`):
   - If the captured editor is no longer connected (`cm.dom.isConnected === false`), show a Notice and insert nothing, instead of the silent write into a dead buffer.
   - Do NOT re-target `app.workspace.activeEditor` at choose time. Obsidian's Templates does that and lands in the host note (control ii, Live Preview host).
3. **Landing test:** convert `G-S97` into assertions with a short plan (about 8 trials: input / box / backdrop with cmd, input with the palette, suggestion, a pane control). It is red today on every input / box / backdrop row. The full probe plan takes about 19 min, which is too long for a lifecycle part. A jest test can follow the SC-595 pattern (a window-bubble click spy as the popover stand-in).

## Drive-by fixes:

None.

## Follow-ups:

- **Not measured: pressing in the command palette's own input first.** The palette closes the preview (control ii). Our command chosen from that palette then runs against `activeEditor` = the host pane. With a Live Preview host it would insert into the host note; with a Reading-view host it is unavailable. This is a native-palette path, not the search modal.
- **The block command's choice after the closure was not driven.** `dispatchBlockChoice` writes to the same captured editor, so the expectation is the same silent loss.
- **Obsidian's Insert template writes into the host note** after a click closes an editing preview. That is an Obsidian bug, not ours; it is recorded here only as the host-wide evidence.

## SKILL proposals

- **Proving which listener hid a preview.** Override `hide` on the popover instance (`view.previewMode.hoverPopover` / `view.hoverPopover`) and push `new Error().stack`. In 1.15.1 the click-to-edit bubble listener is `app.js:509:193553`, and the re-entrant unload hide is `509:193699`. This is cheaper than reading app.js.
- **Live Preview is off in the scratch vault.** The lifecycle vault has `livePreview: false`, so a hover preview's click-to-edit editor is SOURCE mode and shows no DSE card. To get a card inside an editing preview, set `app.vault.setConfig('livePreview', true)` for the trial and restore it afterwards. A `querySelector` for a DSE control in an editing popover returns the hidden reading-view copy first (width 0): filter by rect width.
- **The Templates command id.** In 1.15.1 the core Templates command id is `insert-template` (no `templates:` prefix), and it needs `app.internalPlugins.getPluginById('templates').instance.options.folder` set.
- **Probe screenshots.** `t.shot` writes into the lifecycle's `shotsDir`, and the existence of that directory keeps the whole temp vault at exit. A probe should write its screenshots somewhere else (G-S97 uses `GS97_SHOTS`).
