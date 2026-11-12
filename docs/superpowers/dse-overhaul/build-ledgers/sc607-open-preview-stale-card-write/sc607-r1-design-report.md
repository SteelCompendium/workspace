# SC-607 r1 design / survey report (designer-r1), dse c6077860 (= origin/develop after `fetch`; it did not move)

**Executive summary**
- **A, base, real Obsidian 1.15.1: 10 of the 11 writing cells write a DIFFERENT counter, with no Notice.** The shapes: (a) heading hover RV/LP, (b) heading hover RV/LP, (c) heading embed (a) RV/LP and (b) RV, (d) block hover with markers swapped, (e2) form open in a block hover then the upper block deleted, (e3) form opened after the swap. The two controls behave as expected: the hovered survivor is written, and the form on the (a) heading hover is refused at base. Embeds are NOT redrawn either when the part text is unchanged (>1.5 s, 7/7). Jest sweep at base: 162 different-counter cells of 774.
- **B, feasible, with a window.** A card is DETACHED when it is mounted (30/30 mounts: not in an embed, not in a popover, not connected), so every card has to take the snapshot (`cachedRead` at `setMountedBody`; one is kept only when the section is a part). Window between Obsidian's own read and the snapshot: hover **104-128 ms** (n=9), embed **6.8-7.9 ms** (n=7). Obsidian keeps a better handle: the popover's `hoverPopover.embed.data` (`lastSavedData`) holds the exact text the preview was drawn from and keeps the OLD text after an edit that does not cause a redraw (6/6). It is internal API.
- **Rule (option 2, proposed):** a card or form pin in a part-of-note embed or hover is placed through the link as today, and only when the block the card was DRAWN from agrees with it. That block comes from the mount snapshot or this host's own last write, whichever is newer. It is mapped to the note now and must land on the link's line, with the head-first and tail-first line maps agreeing. Otherwise the write is refused. Pins of that origin are mapped strictly at write time too.
- **Probe sweep (774 cells):** different-counter 162 -> **0**. Saved->refused **16**, all one class (block link, lower of two ADJACENT identical blocks hovered, upper deleted: ambiguous to the line map). Refused->saved **0**: the rule can only remove writes base would make. No-edit and unrelated-edit cells: 288/288 save. Full jest under the probe: **2 failed / 10622 passed / 2 skipped**, both classified as accepted saved->refused. Real Obsidian, probe bundle: **12/12 A cells write nothing**, each with one "changed on disk first" Notice. This includes 1 control that base wrote correctly.
- **G-S92 + G-S96 on the probe bundle: 2/2 ok, 175 s.**
- **Mutants: 14 (option 2). 11 killed, 3 survived:** M5 and M7 are equivalent. M8 (strict miss -> fallback) is covered by SC-480's `twinned` / `landsOnOtherBlock`.
- **Open questions:** Q1 option 2 vs option 1 (option 1 writes the drawn-from counter in swaps; the ticket allows either). Q2 the saved->refused classes (Scott-visible: **Q2c**, >400 lines changed around an open embed). Q3 close the 104-128 ms hover window with `embed.data` (internal API). Q4 the cost of one `cachedRead` per card mount. Whole-note pins and plain forms do not change. The whole-note head-trim bias is a different-counter write: a follow-up.

## 0. Setup
- Worktree `/home/scott/code/steelCompendium/worktrees/sc607-open-preview-stale-card-write`, dse branch `sc607-open-preview-stale-card-write` at `c6077860`. `git fetch origin`: origin/develop = `c60778605a03…` (did not move). `npm ci` done.
- Real Obsidian runs never touched the worktree. They ran in `git archive c6077860` exports in my scratch folder, with `node_modules` symlinked, built with `node esbuild.config.mjs production`:
  - `base-tree`: main.js `7f619bd0…`.
  - `probe-tree`: base + option-2 diff, main.js `079714e0…`.
  - `probe-b-tree`: the same plus `window.__sc607Trace` calls for B (`sc607-r1-instrument.py.txt`), main.js `caad582c…`.
  - styles.css is `5e5ff488…dc2b27` in all three (no CSS change).
- Harness copy: `sc607-r1-make-scratch.py.txt` splices the fixtures and the scenario `P607` (`sc607-r1-probe-lifecycle-scenario.mjs.txt`) in front of SCENARIOS of a copy. Run script: `sc607-r1-run-obsidian.sh.txt`. The base run used the A cells and the handle search only; the B timing and race cells were added for the probe run.
- Jest probe: `sc607-r1-probe.test.ts.txt` was copied to `test/dom/framework/` for each run and deleted by its literal path (`sc607-r1-run-probe.sh.txt`). The rule was applied with `git apply` and restored with `git checkout --` (`sc607-r1-run-mutants.sh.txt`).

## A. Reproduction at c6077860, real Obsidian 1.15.1

Card cells: an outside `vault.process` edit, then a scripted + on the OLD card, clicked in the same page task once the metadata cache had caught up (cache catch-up 6-25 ms). Form cells are described in the table. Logs: `sc607-r1-obsidian-base.log` and `sc607-r1-obsidian-probe.log` (one `P607-REC` JSON line per cell). The base-tree had two identical counters (5, 5).

| cell | RV/LP | redrawn? | base: written / Notice | probe (option 2) |
|---|---|---|---|---|
| (a) heading hover `[[src#Tracker]]`, the first of two ADJACENT identical `## Tracker` sections deleted | RV | no (>1.5 s) | **survivor written (`[6]`), different counter**, no Notice | nothing written, 1 Notice |
| (a) same | LP | no | **different counter**, no Notice | nothing written, 1 Notice |
| (a ctl) `[[src#P2#Tracker]]` (the SECOND `## Tracker`), the first deleted | RV | no | hovered survivor written, correct | nothing written, 1 Notice (saved->refused: Q2b) |
| (b) heading hover, `## Tracker` / `## Other` names swapped | RV | no | **lower written (`[5,6]`), different counter**, no Notice | nothing written, 1 Notice |
| (b) same | LP | no | **different counter**, no Notice | nothing written, 1 Notice |
| (c) heading EMBED `![[src#Tracker]]`, shape (a) | RV | **no** | **different counter**, no Notice | nothing written, 1 Notice |
| (c) same | LP | **no** | **different counter**, no Notice | nothing written, 1 Notice |
| (c) heading embed, shape (b) | RV | **no** | **different counter**, no Notice | nothing written, 1 Notice |
| (d) block hover `[[src#^pa]]`, `^pa` / `^pb` swapped between identical blocks | RV | no | **lower written, different counter**, no Notice | nothing written, 1 Notice |
| (e) heading hover, FORM open, then shape (a), Save (SRC in a 2nd pane) | RV | no | refused, 1 Notice (the pin was never placed: two `## Tracker` sections and a twin) | refused, 1 Notice |
| (e2) block hover `^pa` on the upper of two ADJACENT blocks, FORM open, the upper deleted, Save (2nd pane) | RV | yes, at 54 ms (the form stayed open) | **survivor renamed `Edited`, different counter**, no Notice (head-trim bias of `mapLine`) | refused, 1 Notice |
| (e3) heading hover, shape (b), the cache fresh, THEN the pencil on the old card, Save | RV | no | **lower renamed, different counter**, no Notice | refused, 1 Notice |

- Different-counter writes at base: **10 of 11 writing cells** (the 12th, (e), is refused at base).
- **(c): an embed is not redrawn when its part's text is unchanged either.** The old card was connected through 1.5 s in 4/4 embed cells at base and 3/3 at probe.

## B. Feasibility of "the note as drawn"

Measured with the read log (a wrapper on `app.vault.cachedRead` / `read`) and the trace in the probe-b bundle:

- **Obsidian's read for a preview:**
  - Hover: one `vx.loadFile` (`cachedRead`).
  - Heading embed RV: two reads (the CodeMirror widget `Hx.initDOM`, and `Ho.postProcess`). Embed LP: one.
  - **After an outside edit that leaves the part unchanged, Obsidian does not read the note again** (`readsAfterEdit` shows only the card's own rebase read).
- **The card is detached at mount.** At `setMountedBody`: `closest('.markdown-embed, .internal-embed')` null, `closest('.hover-popover')` null, `isConnected` false, in **30/30** mounts (hover RV/LP, embed RV/LP, race trials). So a card cannot tell at mount that it is in a part-of-note view. The snapshot is taken for EVERY card and kept only when the section text differs from the note read (the section is a part). For a plain note the section IS the note: dropped at once, and nothing is held.
- **The window: Obsidian's read -> the card's `cachedRead` call.**

  | kind | gap | n |
  |---|---|---|
  | hover | **104.5-127.6 ms** (Obsidian loads the file on hover and draws ~110 ms later) | 9, RV and LP |
  | embed | **6.8-7.9 ms** after Obsidian's last read (13.9-30.5 ms after its first) | 7 |

  The read resolves 3-23 ms after the call.
- **The consistency check (`metaMatchesText`):** headings on their lines, and the last section ends where the text ends. It discards a snapshot whose cache lags its text. That only catches an edit within the cache lag (6-45 ms) before the snapshot. An edit that lands 45-128 ms before a hover card mounts, after Obsidian read the note, is NOT caught. jest N1 shows the check works for the lagging case (M4 kills it).
- **Race trials** (heading embed RV, names swapped 0-20 ms after the open starts, 6 trials): 6/6 had the write land AFTER both reads (`vault.process` resolved 56-71 ms after the open; the reads were done by 36-57 ms). The window was never hit, and every trial was refused (drawn = upper, link now = lower).
- **The Obsidian handle — better than a separate read for hovers:**
  - The popover object `hoverPopover` (keys include `embed`) holds `embed.data` and `embed.lastSavedData`: the WHOLE note text the preview was drawn from (`text` = the part, `after` = the rest).
  - Measured: `embed.data === note` at mount (6/6), and after an outside edit that did not redraw it is STILL the old note (6/6: `afterEditEqOldNote` true, `afterEditEqNewNote` false). It is exactly "the note as drawn" with no window.
  - It can be reached at click through the hover-link event this plugin already logs (`ev.hoverParent.hoverPopover`).
  - For embeds the embed component sits in the view's component tree (`view._children…data`, found by an object-graph search), not reachable from the card's element. The embed window is only ~7 ms anyway.
  - It is internal and untyped. See Q3.
- **Interaction with own writes:**
  - `lastWrite` (now carrying a `seq`) is a second "known position".
  - At click, the NEWER of {mount / rebind snapshot, own write} is used first, and the other is the fallback.
  - Re-bind (the adoption after the host's own write: Obsidian redrew the part) takes a new snapshot.
  - Each host mounted by `remountReused.mount` is new, so it gets a new snapshot.
  - Unload drops the snapshot (as `lastWrite`).
- **Memory:** one string per PART card (the vault's cached string, shared by reference while the note is unchanged) plus one metadata-cache object reference. It is dropped on unload, on re-mount and on re-bind. Cost: one `cachedRead` per card mount for every card (Q4).

## C. The rule (probe: `sc607-r1-probe-rule.diff.txt`, 304 lines, `ReadingModeBlockHost.ts` + `lineMap.ts`)

**In two lines:** a pin of PART of a note (embed or hover; card write and form alike) is placed through the link on the note as it is now, as today. It is placed only when the block the card was drawn from (the mount snapshot or this host's own last write, the newer first), mapped strictly to the note now, is that same line. The pin is then mapped strictly at write time. Strictly means the head-first and tail-first line maps must agree. Anything else is refused with the existing "changed on disk first" Notice.

Pieces:
- `lineMap.ts`: `mapLineFromTail`, the same Myers map over the reversed lines. It trims the common tail first and breaks every tie the other way.
- `snapshotDrawn()` at `setMountedBody` and `rebind`:
  - `cachedRead` plus `getFileCache` taken at the call.
  - Kept only when the text differs from the section (a part) and `metaMatchesText`.
  - `drawn.text === null` marks "the part was the whole note".
- `rebaseCardPin` for PARTIAL pins:
  - Await the snapshot.
  - `linkLine = cardLinkLine(note now, cache now)`. `cardLinkLine` now takes the metadata cache as a parameter.
  - When `linkLine` exists, `from` = the newer of `drawnFrom()` and `ownFrom()`, then the other. `drawnFrom()` is `cardLinkLine` on the snapshot text with the snapshot's cache.
  - Refused unless `mapLine(from) === mapLineFromTail(from) === linkLine`.
  - With no link placement (the part is stale right after this host's own +), the own write alone places it, as before.
  - Whole-note pins (no `#`) take the old path unchanged.
- `strictPins`: these pins, and own-write pins of part embeds taken in `takePin` (the r7 guard and the stale-window paths).
  - `pinnedTarget` refuses a strict pin whose two maps disagree.
  - A strict miss never falls back to `twinned` / `resolveWriteTarget`.

**The known trap, (a) both ways:**
- Heading links: the drawn note has two `## Tracker` sections and the counter twice. `cardLinkLine` refuses to place the drawn block (the link names two places), so `from` is null and the click is refused. Base refused the same preview with NO edit too.
- Upper hovered + upper deleted: refused (the drawn-from counter is gone, and nothing can say which survived). Real (a) cells, sweep `heading … del-upper-adj` 48/48 refused.
- Lower hovered + upper deleted, block links (`^pb` on the lower of two ADJACENT blocks): **refused**.
  - Head-first maps the lower fence to null (deleted). Tail-first maps it to the survivor. They disagree.
  - From the two texts' FENCE lines, "upper deleted" and "lower deleted" are the same edit.
  - That is the saved->refused class below. The survivor does carry `^pb`, so a marker-line refinement could save it (Q2a).
  - With the sections separated (`p-mid` between) both maps agree: lower hovered saves, upper hovered is refused (`del-upper-sep`).

**Jest sweep** (`sc607-r1-jest-sweep-{base,probe}.jsonl`, table `sc607-r1-sweep-table.txt`):
- Dimensions:
  - kind: heading / block link;
  - hover / embed;
  - RV / LP;
  - card + / form Save;
  - upper / lower hovered;
  - edit: none, unrelated, swap, del-upper-adj, del-upper-sep;
  - cache: fresh / lagging;
  - + first: none, + redrawn (rebind), + stale (own-write record).
  - A heading link cannot name the lower of two same-name sections, so those cells are skipped.
- That gives 768 cells, plus 6 named shapes N1-N7.

| | base | probe (option 2) |
|---|---|---|
| A (the hovered counter) | 442 | 426 |
| **different counter (TWIN)** | **162** | **0** |
| refused | 170 | 348 |

- Transitions:
  - TWIN -> refused: 162. By edit: del-upper-adj 80, del-upper-sep 16, swap 64, N1, N3.
  - **A -> refused: 16**, one class: block link, the LOWER of two adjacent identical blocks hovered, the upper deleted, cache fresh, no + / + redrawn, hover and embed, RV and LP, card and form.
  - **refused -> A: 0.**
- No-edit cells: 96/96 A, as at base. Unrelated-edit cells: 192/192 A, as at base.
- Every refusal shows the one "changed on disk first" Notice (348/348), and no save shows a Notice.

**Named shapes** (records in the same jsonl):

| shape | base | probe |
|---|---|---|
| N1: snapshot taken after the edit, the cache still lagging at mount | **different counter** | refused |
| N2: no-link hover whose section is the whole note | saves | saves |
| N3: callout block hover, +, the upper of two ADJACENT identical callouts deleted, form Save (the r7 own-write path) | **different counter** | refused |
| N4: +, outside deletion, redraw, + | saves | saves |
| N5: unique counter deleted, another edited to read like it | refused | refused |
| N6: unique counter deleted, an identical one pasted elsewhere | refused | refused (option 1 WROTE the pasted one) |
| N7: lines inserted above, cache fresh | saves | saves |

**Full jest under the probe** (`sc607-r1-jest-full-probe.log`): **10622 passed, 2 failed, 2 skipped (10626)**. Both are in `reading-mode-host-pin.test.ts`, SC-584 block:
1. "an identical block is added to the note after the form opened: Save still lands in the block the form was opened on". A stale-part own-write pin. The outside edit adds an identical counter right below, separated by one line. The texts are also exactly "a counter added ABOVE": head-first guesses the upper and base wrote it. The two maps disagree, so it is refused. Class Q2d. Re-model: keep the assertion for a non-adjacent addition; this adjacent case expects refused.
2. "the embed was redrawn after the +, … a note changed by hundreds of lines since still saves". 1000 lines are inserted around the block after the drawn / own position, and the line map gives up (`LINE_MAP_MAX_EDITS` 400). Base placed it by the link only. In Obsidian the part text is unchanged, so the embed is not redrawn: this is the real shape of class Q2c. It also models the redraw without a rebind.

**Real Obsidian under the probe:** see the table in A. 12/12 cells write nothing, each with one Notice.

**G-S92 + G-S96 on the probe bundle** (`sc607-r1-lifecycle-gs92-gs96-probe.log`): **2/2 ok, wall 175 s** (load 7.9). G-S92 (a)-(f), (i), (k) save as before; (g), (h), (j) are refused. G-S96: every pane cell writes nothing, with one Notice.

**Mutants** (`sc607-r1-mutate.py.txt`, `sc607-r1-mutants.log`, comparison `sc607-r1-mutants-cmp.txt`, baseline M0 = the unmutated probe):

| mutant | result | killed by |
|---|---|---|
| M1 no tail-first check in the rebase agreement | killed | 16 sweep cells -> TWIN (heading del-upper-adj after a +) |
| M1b no strict check in `pinnedTarget` (the ambiguity test at write time) | killed | 49 cells -> TWIN ('+ stale' own-write pins) |
| M2 `mapLineFromTail` = `mapLine` | killed | 65 cells -> TWIN |
| M3 no `at === linkLine` agreement | killed | 64 swap cells -> TWIN |
| M4 `metaMatchesText` always true | killed | N1 -> TWIN |
| M5 no whole-part branch | **survived** | equivalent: whole-now === section returns earlier |
| M6 own write always first | killed | N4 -> refused |
| M7 snapshot always first | **survived** | equivalent here: both positions are true positions |
| M8 a strict miss falls back to `twinned` / `resolveWriteTarget` | **survived** | SC-480's `twinned` / `landsOnOtherBlock` refuse every shape built (N5, N6); defence in depth |
| M9 `rebind` takes no new snapshot | killed | N4 -> refused |
| M10 own-write pins of part embeds not strict | killed | N3 -> TWIN |
| M11 the drawn placement uses the cache NOW | killed | 9 cells -> refused (block lower del-upper-sep) |
| M12 no own-write fallback when the link places nothing | killed | 216 cells -> refused, 30 host tests |
| M13 no drawn position: link only (= base) | killed | 25 cells -> TWIN |

**Option 1** (measured first; `sc607-r1-probe-rule-option1.diff.txt`, `sc607-r1-sweep-table-option1.txt`, `sc607-r1-mutants-option1.log`): place the pin from the drawn / own position ALONE and map it (no link agreement).
- Sweep: TWIN 160 -> 0 on 768 cells.
- Saved->refused: the same 16.
- **Refused->saved: 40** (lagging cache: placed from the snapshot, the right counter).
- Swaps write the drawn-from counter.
- Full jest: 4 flips.
- But N6 (the counter deleted and an identical one pasted elsewhere) **writes the pasted counter**: the line map reads it as a move.
- 12 mutants, 11 killed (after N3 / N4 were added); M8 survived.
- I propose option 2: it can only remove writes base would make, and N6 is refused.

## D. Open questions (owner), each with a recommendation
- **Q1: option 2 (refuse when the link now names another block) or option 1 (write the drawn-from counter)?**
  - The ticket's Expected allows both.
  - Option 2 refuses the swap shapes (b) and (d). Option 1 writes the counter the user clicked, even though the heading above it changed.
  - Recommendation: **option 2.** It writes a subset of what base writes (0 refused->saved). There is one source of identity fewer to get wrong (N6), and a moved / pasted counter is never followed by the line map alone.
  - Owner decision; no Scott decision needed (the ticket defines both outcomes as acceptable).
- **Q2: the saved->refused classes** (all safe: a Notice, nothing written; Scott's 2026-11-10 ruling applies):
  - (a) **Block link, the lower of two ADJACENT identical blocks hovered, the upper deleted** (16 sweep cells). Recommendation: accept. Optional refinement: map the `^id` marker line as well, and accept when both maps agree on the marker and the fence sits at the same offset above it. Not measured.
  - (b) **A preview that could not be placed when drawn stays refused after an edit makes the link unique** (real cell (a ctl), `#P2#Tracker`; heading hovers of a note with two same-name sections and identical counters). Base refused these previews with no edit already. Recommendation: accept.
  - (c) **More than 400 lines changed on both sides of the block since the card was drawn, the part unchanged, so the embed / hover is never redrawn** (jest flip 2). Example: a dashboard `![[note#Tracker]]` stays open while Sync brings a large rewrite of the source note. Every + is refused until the embed redraws (reopen the note). **A user could notice this. Flag it to Scott:** accept, or fall back to the link when the map gives up and the body is unique in both texts.
  - (d) **An identical block added right next to the card's block after its own + while the part is stale** (jest flip 1). The texts cannot tell "added below" from "added above", and base wrote the head-first guess. Recommendation: accept, and re-model the test.
- **Q3: close the hover window (104-128 ms) with `hoverPopover.embed.data`.** At click, require `snapshot.text === popover.embed.data` when it is a string, else refuse. Measured: it is the drawn text and is not updated by an edit that does not redraw. This is internal API (the plugin already reads `hoverParent.hoverPopover.hoverEl` from the untyped `hover-link` event). Without it, the residual is an outside write that lands in the ~100 ms between Obsidian's hover read and the card's mount, leaves the part unchanged, and leaves a cache consistent with the new text. 0/6 race trials hit the window. Recommendation: implement it, guarded by `typeof === 'string'`, plus a jest model. Owner decision.
- **Q4: cost.** One extra `cachedRead` per card mount for every card in every note (the card cannot tell at mount that it is embedded). It is dropped at once for whole-note sections. Recommendation: accept; the shots / freeze gates will show any regression. Alternative: start the read lazily at the first `notePersistIntent` / `pinPosition`. That reopens the window to "mount -> first click", so I do not recommend it.
- **Q5: G-S99.**
  - Cells: (a) heading hover RV and LP; (b) RV; (c) embed (a) RV; (d) block hover swap RV; (e2) the block-hover form with a 2nd pane; (e3) the form after the swap. Each must write nothing, give one "changed on disk first" Notice and keep the outside edit.
  - One control (no outside edit, the + saves) to keep it from being vacuous.
  - All 12 cells are red on the c6077860 bundle except (e) and the control. ~100 s for 12 cells, so part 6 becomes ~275 s, under 420 s.
  - One note per cell (card Notices are rate limited per note).
- **Q6: M8 survives.** Keep the strict-miss "no fallback" as defence in depth (recommended), or drop it.
- **Does the rule change whole-note (non-partial) pins or plain non-embedded forms? No.**
  - `takePin` for non-embedded hosts is unchanged.
  - The non-partial rebase path behaves exactly as before (a link without `#` never placed through `cardLinkLine`).
  - `strictPins` only holds pins of part embeds.
  - The only effect on plain cards is the snapshot read at mount, discarded for a whole section.
  - Full jest: no plain or whole-note test flips.
- **Follow-up (not widened):** the head-trim bias for WHOLE-NOTE pins (SKILL ~339) is a different-counter write. Two identical blocks separated only by blank lines, a form open on the upper, the upper deleted from outside: Save writes the survivor. Same for a SC-552 card pin. Applying the same strict (two-alignment) map to whole-note pins would refuse it.

## Drive-by fixes
None.

## Follow-ups (left alone)
- The whole-note head-trim bias (above).
- The jest models of a "redraw" (`sec.current = …` without `rebind`) do not take a new snapshot. Re-model with `host.rebind(el, ctx)` (the adoption Obsidian does).

## Working tree
- `git -C …/draw-steel-elements status --porcelain` was empty at the start and is empty at the end, HEAD `c6077860`.
- The probe test file was deleted by its literal path after each run. `ReadingModeBlockHost.ts` / `lineMap.ts` were restored with `git checkout --` after every probe and mutant run.
- The `main.js` / `styles.css` that jest's `cssNesting.test.ts` writes were removed by their literal paths (the fresh worktree had none).
- Real Obsidian ran only in scratch exports. No Obsidian process of mine is left. Every lifecycle run passed, so the harness deleted its temp vault.
