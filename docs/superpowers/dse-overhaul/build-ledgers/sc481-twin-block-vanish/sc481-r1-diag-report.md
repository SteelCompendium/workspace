# SC-481 r1 diagnosis: twin blocks in Reading view (dse 9be397e, Obsidian 1.15.0)

## Executive summary
1. **Reproduced in real Obsidian 1.15.0.** Reading view: yes (counter and montage, 2 and 3 twins, adoption on and off, form Save). Live Preview: yes (wrong value and the write goes to the other block; no vanish). Sidebar: no (pinning adds an anchor, so the blocks stop being identical). A second Reading pane is unaffected.
2. **It is worse than the ticket says.** The vanish is the last of three symptoms. The other two: the twin shows the wrong value, and a click on it **writes into the other block on disk**. After a form Save, that click also **silently undoes the form edit**. In the measured cases, a click on the LOWER twin never goes wrong. Only a write to a block that has an identical block below it does.
3. **Root cause.** After a write, Obsidian reuses the old rendered element of a block for the next block with the same text below it, and calls no post-processor for it. Reading view does this in `parseFinish` (app.js 1.15.0 @1815400: the first unused old section with equal html). Live Preview does the same with `R1(V,eh=>eh.lang===si&&eh.code===Vc)` @2656846. That reused element still holds the **writer's** live view. DSE does not notice:
   - the view shows the writer's value at the twin's position;
   - its next write fails the body check and is moved, by body, to the writer's block (`ReadingModeBlockHost.ts:704-720`);
   - when that view is later adopted, `adoptView.ts:117` moves its root out and leaves the reused element empty. That is the vanish.
4. **Recommended fix: Option 1.** On every DSE code-block processor call, rebuild any element Obsidian reused for a different block:
   - after adoption, mount a fresh view into the element the root left, if Obsidian still uses it (`prevCtx.getSectionInfo(prevEl) !== null`);
   - release and remount any live view whose element now resolves to a body different from the one it knows;
   - make the claim collision guard use the line the write landed at.

   It uses public API only and covers Reading view and Live Preview. A real-Obsidian in-page prototype of the remount fixed every measured case.
5. **SC-480 dependency: none.** The wrong write here is a relocation to the ONLY block matching the writer's body, so SC-480's "more than one match" rule would not catch it. The recommended fix never relies on choosing among equal bodies.

## 1. Measurements (real Obsidian 1.15.0 via the lifecycle harness, dse 9be397e, view adoption ON unless noted)
Counter fixtures are `current_value: 5`, `name: Twin`. DSE re-serializes a body when it writes it (key order changes), so a written block's text no longer equals the untouched fixture twin.

Card readout = `rootId:name=value` in DOM order. "proc adopt" / "proc fresh" = the code-block processor claimed the live view / built a new one. "rel" = a registry release on render-child unload.

| Case | Step | Cards shown (DOM) | Disk | What happened |
|---|---|---|---|---|
| A 2 twins | click upper | `R13=6`, `R9=6` (2 cards) | [6,5] | Fresh view drawn at the upper block. The OLD upper view R9 now sits at the lower block and shows 6 (disk 5). The lower view R11 is released. Claim missed through a false collision (collisions +1). |
| A 2 twins | then click lower card | `R9=7` (**1 card**) | **[7,5]** | **Click on the lower card wrote the UPPER block.** R9 was adopted into the upper; the lower block's element is empty, so the card vanished. |
| A 2 twins | then click lower again | 1 card, no control | [7,5] | Lower card gone until reopen. Reopen gives 2 cards, [7,5]. |
| A 2 twins | upper, upper, upper | `R20=6,7,8` + `R16=6` | [6,5]→[8,5] | The lower card stays frozen at 6 (disk 5). |
| A adjacent twins | upper, then lower | same as A | [7,5] | Same as A. |
| B 2 twins | click lower | `R31=5`, `R33=6` | [5,6] | Correct (adopted). |
| B 2 twins | lower, then upper | `R26=6`, `R29=6` | [6,6] | Correct. The blocks converge; Obsidian moves the lower element up; the bodies still match. |
| C 3 twins | click upper | `R44=6`, `R46=5` (**2 of 3**) | [6,5,5] | Vanished at once: adoption succeeded and left the middle element empty. |
| C 3 twins | click middle | `R52=5`, `R58=6`, `R54=6` | [5,6,5] | The lower card shows 6 (disk 5). |
| C 3 twins | middle, then lower card | `R52=5`, `R54=7` (2 of 3) | **[5,7,5]** | **Lower click wrote the MIDDLE block**, then a vanish. |
| C 3 twins | click lower | 3 cards, correct | [5,5,6] | Correct. |
| X different bodies | upper, then lower | correct | [6,6] | Never affected. |
| V converge (4,5 → upper +1) | upper, lower | correct | [5,5]→[5,6] | Benign. |
| D montage twins | End round upper, then lower | `R84 Round 2`, `R80 Round 2`; then `R80 Round 3` (1 card) | [2,1]→**[3,1]** | Same as counters: wrong round shown, lower click wrote the upper block, then the vanish. Lower first: correct ([1,2]→[2,2]). |
| E adoption OFF | upper, then lower | `=6,=6`; then `=7,=7` (2 cards) | [6,5]→**[7,5]** | No vanish. Wrong value and the wrong block written. |
| F1 form Save upper (Twin→Edited) | Save | `R6:Edited=5`, `R2:Twin=5` | names [Edited, Twin], [5,5] | Display correct (the stale view's model is the old body = the twin's). |
| F1 | then click lower card | `R2:Twin=6` (**1 card**) | names **[Twin, Twin]**, [6,5] | **The upper block was overwritten with the lower's content+1: the form edit is silently lost**, then a vanish. |
| F2 form Save lower | Save, then click upper | correct | [6,5], names [Twin, Edited] | Correct. |
| G Live Preview | upper, then lower, then lower | `W6/L5=6`, `W2/L1=6` → `=7,=7` → `=8,=8` (2 cards) | [6,5]→[7,5]→**[8,5]** | Old upper widget W2 (with view L1) reused at the lower position. Every lower click writes the upper block. No vanish (no adoption in LP). Lower first: correct. |
| I two Reading panes, click upper in pane A | — | A: `=6,=6`; B: `=6,=5` | [6,5] | Pane A has the bug. Pane B is correct: its old upper view knows the old body, which is the twin's. |
| H sidebar, pin upper + panel click | — | Reading `=6,=5`, panel ok | [6,5] | Not affected: the pin stamps `_dse_anchor` into the upper, so the bodies differ. |

Other facts:
- Remaining cards' controls do work, but on the wrong block (rows A, C, D, E, F1, G).
- Reopening the note always restores the correct cards and values (disk was never corrupted beyond the wrong-block writes listed).
- 0 Notices, 0 page errors in every case.

## 2. Root cause, with evidence

### Obsidian (Obsidian code, not DSE)
- **Reading view.** In 1.15.0 `app.js`, `parseFinish` (@1815129) puts the old sections in a multimap keyed by `html`. For each new section in document order it takes the **first unused** old section with the same html (@1815400). `onRender` (@1816431) only renders sections with `rendered === false`, so a reused section gets **no post-processor call**. After the render, `cleanupParentComponents` (@1827042) unloads every `MarkdownRenderChild` whose element no longer belongs to the view. That unload is what releases the discarded twin's DSE view.
- **Live Preview.** The same first-match rule picks the code-block widget: `R1(V, eh => eh.lang === si && eh.code === Vc)` (@2656846).
- **Sequence for [A, A] → [A', A]** (write to the upper):
  1. New section 0 (A') is fresh, so the processor runs.
  2. New section 1 (A) reuses the OLD UPPER element, which holds the writer's view.
  3. The old lower element is discarded and its view released.

### Probe evidence (section and root tags across the click; `p481-read.json`, case A1)
- Before: `S1(R2)@4, S3(R4)@13`.
- After the upper click: `S5(R6)@4, S1(R2)@13`. The old upper section element S1 and its root R2 moved to line 13.
- Log: one processor call (`claim hit:false`), then `release render-child-unload R4`.
- Triplets, upper click: `S49(R44)@4, S43()@13, S45(R46)@22`. The claim adopted R44, and S43 (the old upper element, reused for the middle block) is empty: that is the vanish.

### DSE side (file:line, plugin at 9be397e)
- `src/framework/host/ReadingModeBlockHost.ts:384`: the host finds its block by ELEMENT (`ctx.getSectionInfo(containerEl)`). After the reuse, the writer's host reports the twin's lines (13) and `:395` copies that into `knownLineStart`.
- `ReadingModeBlockHost.ts:609`: every write (view click or form Save) sets `knownBody = newSource`.
- Measured predicate (`p481-hosts.json`): the stale host has `lineNow 13`, section body = the twin's, `knownBody` = the writer's new body, so `stale: true`. Every other host is `false`. This holds in Reading view and in Live Preview.
- `ReadingModeBlockHost.ts:704-720`: the stale view's next write fails `bodyOk` and `locateByBody(knownBody, knownLineStart)` finds the ONLY block with that body, the writer's own (upper). That is the wrong-block write.
- `src/framework/host/viewRegistry.ts:177-193`, the claim collision guard:
  - The winner's line comes from a live `getBlockInfo()`, so it is the reused element's new line (13).
  - The discarded twin's host has no section any more, so its line comes from the cache, also 13.
  - That produces a **false collision**: claim returns null and the writer is not adopted (collisions 0→1 on every first upper click with 2 twins).
  - This hides the vanish on the first click with 2 twins. With 3 twins there is no collision on line 13, so the vanish happens on the first click.
  - It also means the writer is not adopted, so SC-340's adoption (it keeps the clicked card's focus and open modal) is lost for 2 twins.
- `src/framework/registerFrameworkElements.ts:77-81` → `src/framework/host/adoptView.ts:113,117`: the claim adopts the (stale) view; `rebind` re-points the host and `el.appendChild(entry.root)` moves the root OUT of the reused element, which Obsidian keeps on screen with no processor call. That is the empty card.
- `ReadingModeBlockHost.ts:340` → `viewRegistry.ts:206`: the discarded twin's view is released when its render child unloads.
- **Option B check (Obsidian private API, in-page, case K):** after the vanish, setting the empty section's `rendered=false`, emptying it and queueing a render made Obsidian run the processor. The result was a fresh `R100=5`, and later clicks wrote correctly ([7,5]→[7,6]).

### Was it ever working (cheap answer, no bisect)
- With adoption OFF (the SC-340 kill switch, i.e. the pre-SC-340 claim behaviour), there is no vanish but the wrong value and wrong-block writes remain (row E).
- So the stale-view half predates SC-340; SC-340's adoption added the vanish.
- The SC-457 r1 probe (dse 772c3cd) saw the vanish on the first click with 2 twins and collisions 0. At 9be397e the false collision delays it to the second click. This changed in between and was not bisected.

## 3. Fix options

### Option 1 (recommended): rebuild any element Obsidian reused for a different block (DSE only, public API)
**Where it changes**
- `registerFrameworkElements.ts` (the processor), on every call for `(ctx.docId, ctx.sourcePath)`:
  - (a) **Adoption path:** capture `prevEl` / `prevCtx` from `claimed.host` before `adoptView`. After adoption, if `prevCtx.getSectionInfo(prevEl) !== null` (Obsidian still uses that element), mount a fresh view there from that section's fence body: a new `ReadingModeBlockHost(plugin, prevEl, prevCtx, alias, scrollPin, registry)`, `setMountedBody(body)`, `pipeline.run(def, body, host)`.
  - (b) **Every call (adoption or not):** for each live registry entry of the same docId and path whose host is a plain (un-nested) fence, whose section resolves by element, and whose fence body there is not equal to `normalizeBody(knownBody)`: release it (`'reused-by-twin'`), empty its element, and mount a fresh view there from that body.
- `ReadingModeBlockHost.ts`: a read-only predicate `showsOtherBlock()` that does not overwrite `knownLineStart`, expose `alias` and `ctx` (or a `remountTarget()`), and record `lastWriteLineStart` at the splice (`:594`).
- `viewRegistry.ts:177`: the winner's line is `lastWriteLineStart` (where its write landed) rather than a live read of an element Obsidian may have reused. Converge cases still collide on the right line, so they stay as today (fresh view, correct display).

**Cost**
- About 80–120 lines plus jest cases (predicate, remount, guard line).
- One lifecycle scenario G-S53.
- G-S50 twin phase re-run: SC-518's `staleOpener` clause becomes mostly dead for twins, because the stale opener is now removed.

**Prototype (in-page, real Obsidian, `p481-proto.json`)** of (b), run after the rebuild:

| Case | Before reconcile | After reconcile | Lower click | Upper click |
|---|---|---|---|---|
| Reading, adoption off | `6,6` | `6,5` | [6,6] | [7,6] |
| Reading, default | `6,6` | `6,5` | [6,6] | [7,6] |
| Form Save upper | — | — | names [Edited, Twin], [5,6] | — |
| Live Preview | `6,6` | `6,5` | [6,6] | [7,6] |

All lower and upper clicks landed in the right block. The display went stale again on the second upper click, because by then the blocks were re-converged twins and the prototype ran only once. The real fix runs on every processor call, so that does not apply.

**Risks**
- *Twin cross-talk:* closed. The twin's element gets a view bound to the twin's body and lines. The writer's view never stays bound to the twin's element.
- *SC-518 twin focus:* the old opener pencil is removed from the twin. Modal close then focuses a disconnected node, and the normal "focus is free" claim lands on the edited card's new pencil. G-S50 3b must stay green. Its comment "old root/pencil stay in the document (inside the twin)" (`obsidian-lifecycle.mjs:3228`) becomes untrue (the twin mode does not assert it).
- *SC-479 / SC-198 scroll pin:* the remount fills an element of the same height, but `pipeline.run` is async, so it can be empty for a few ms. The write already pinned the sizer (`ReadingModeBlockHost.ts:620-626`, SC-470 modify pin). Re-run G-S8, G-S15 and G-S42.
- *SC-340 adoption:* better than today. The 2-twin writer is now adopted on the first click (claims +1, collisions unchanged). Non-twin notes never satisfy the predicate. Re-run G-S1..G-S6i, G-S7a/b.
- *Writes in the right block:* the fresh twin host writes on the section path (body matches). A pending debounced edit on a released stale view flushes on unload through `locateByBody(knownBody)`, which finds the writer's real block, which is correct. The same-body ambiguity there is existing SC-480 territory, unchanged.
- *False positives:* the predicate runs only inside a processor call for the same docId, right after Obsidian re-parsed, so the section text is current. Blocks in quotes or callouts (SC-455 window sections) are skipped.

**G-S53 (lifecycle) asserts**, Reading view, then Live Preview, then a form Save phase:
- 2 twins, upper click:
  - DOM card count == block count;
  - each card's value equals its block on disk, per position;
  - the writer's tagged root is the upper card (adopted; claims +1);
  - no root sits at a position other than its own block;
  - then a lower click changes only the lower block ([6,6]), still 2 cards.
- 3 twins: upper click, then middle click.
- Montage End round on the upper twin.
- Adoption off: the same assertions minus the claim.
- Form Save on the upper twin, then a lower click: the note is the fixture with only those two changes.
- Live Preview: upper click, then lower click → [6,6], display equal to disk.
- Base bundle FAILs with the numbers in §1 (lower shows 6 with disk 5, [7,5], 1 card, names [Twin, Twin], LP [7,5]).

### Option 2: make Obsidian re-render the reused section itself (private API)
**Where it changes**
- After adoption, or when (b)'s predicate fires: find the renderer's section object for the element and set `rendered=false`, `el.empty()`, `renderer.queueRender()`. Obsidian then runs every post-processor for it, which is native and keeps heights right.
- Measured working (case K).

**Cost and risks**
- It needs private `previewMode.renderer.sections`, `Section.rendered` and `queueRender`.
- Embeds' renderers are not reachable from the workspace leaves.
- Live Preview needs a separate CodeMirror widget hack (no public hook).
- It breaks silently on an Obsidian update.
- It still needs Option 1's detection.
- Use it only as a fallback, if Option 1's remount has problems (e.g. a post-processor other than DSE's has to run).

### Option 3: vanish-only (narrowest)
**Where it changes**
- Only (a): after adoption, remount into `prevEl` when it is still live.

**Cost and risks**
- Smallest change (about 30 lines). It fixes the empty card only.
- It leaves the wrong value and the wrong-block write in every non-adopted path:
  - 2 twins on the first click (the false collision);
  - the form Save data loss (row F1);
  - adoption off;
  - Live Preview.
- Not recommended: the hidden wrong-block write is the more serious bug.

## 4. SC-480 dependency
**Independent.**
- SC-480 asks whether a stale or relocated save should be refused when MORE THAN ONE block matches. SC-481's wrong write is a relocation to the ONLY matching block (the writer's own new body), so neither SC-480 answer would have stopped it.
- Option 1 never needs to choose among equal bodies: the twin writes through its own section, and the adopted writer writes through its rebound section.
- The only interaction is the flush of a pending edit on a released stale view. If the writer's body also exists elsewhere (converge), SC-480's answer decides "guess nearest" or "refuse + Notice", exactly as it does today for any relocated save. Either choice is compatible with Option 1.

## 5. Notes for the owner
- The ticket says "the file on disk is correct". That is true only for the first click. The next click on the wrong-looking card writes the other block (counters, montage, Live Preview), and after a form Save it erases the edit. This may justify a priority bump.
- The working tree was left clean: `git status --porcelain` was empty before and after in both the plugin and the superproject. The harness ran from a scratch copy; nothing in the worktree was modified except the git-ignored `main.js` / `styles.css` build output.

## Artifacts
- Screenshots:
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/sc481-r1-twins-after-upper-click-lower-card-shows-6-disk-5.png` (state after the upper click; disk [6,5]; the last writer of this shot name was case E step 1 (adoption off), whose screen is the same as case A1 step 1: `6` / `6`)
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/sc481-r1-twins-after-lower-card-click-upper-written-lower-vanished.png` (case A2 after the lower-card click; disk [7,5]; one card)
- Probe output (scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc481-r1-diag-a69a8a02591085ed8/`):
  - `run2/p481-read.json` + `run2/lifecycle.log` (Reading view cases)
  - `run3/p481-other.json` (form Save, LP, two panes, sidebar)
  - `run4/p481-lp.json` (Live Preview with values)
  - `run5/p481-hosts.json` (stale predicate)
  - `run6/p481-proto.json` (Option 1 prototype)
  - `run1/` (first pass)
  - `run*/shots/`
- Probe scripts, in the same scratch folder:
  - `scripts/sc481-fixtures.mjs`
  - `scripts/sc481-kit.mjs`
  - `scripts/sc481-scenarios.mjs` (P481-READ / -OTHER / -LP / -HOSTS / -PROTO)
  - `scripts/sc481-inject.mjs`
  - `sc481-run.sh`
  - `extract-app.mjs`
  - `harness/obsidian-lifecycle-p481.mjs` (the injected scratch harness)
  - `obsidian-1.15.0-app.js` (the extracted Obsidian code the offsets refer to)
