# SC-594 r1 design / survey report (designer-r1), dse ce4937ef (= origin/develop, did not move)

**Executive summary**
- **Rule:** a card (+/-) write whose pin is still in a PART's coordinates (an embed with a `#` link, or a hover preview) is written only through a position: the part's LINK (the embed's `src`, or for a hover the link Obsidian's `hover-link` event recorded for that very popover), verified against the note (the whole part equals the note where it starts, the card's line holds the known body, `^id` marker for a block link, the link names ONE place when the body has a twin); else this host's own last write (`lastWrite`); else refused with today's Notice. No text search (`searchedPinLine`) and no body fallback (`twinned` / `resolveWriteTarget`) for such a pin. Forms and non-embedded cards are unchanged.
- **Private Obsidian field: not needed.** The link comes from the `hover-link` workspace event (named in obsidian.d.ts `registerHoverLinkSource` docs; payload `{linktext, sourcePath, hoverParent}` untyped) matched by `hoverParent.hoverPopover.hoverEl` (public). The private `popover.embed.subpath / before / heading / text` exists (measured) and is NOT used. No record -> refused.
- **P14 reachable in real Obsidian: yes, but only in a 17-44 ms window** (n=10) between an outside edit landing and the preview's redraw. A scripted click inside it wrote the TWIN on base in 8 of 8 real-Obsidian cells (block hover RV/LP, P14-exact, heading hover long/short/twin-above RV+LP, callout heading hover). A CDP mouse click sent after the edit missed the window (no write). Probe: all 8 refused, one Notice each.
- **Ticket:** base refuses heading hover (long AND short note, RV and LP) and a block hover with a twin; probe saves all of them into the hovered counter (real Obsidian). Root cause measured: a hover card's part is the heading's BODY only (`"\n```...```\n\n"`, lineStart 1), which matches the twin's lines too.
- **Sweep (jest, 284 cells):** base 40 TWIN writes -> probe 0; 60 refused -> saved; 0 saved -> refused. 16 named probes; 13 mutants: 12 killed, 1 equivalent. Full jest with the probe: only 6 existing tests change (5 need the hover-link record modelled; 1 intended).
- **Still refused after the rule** (Notice, nothing written): see "What still refuses" (list items / footnotes (SC-461); the clicked block edited / deleted from outside before the click; any hover whose popover has no `hover-link` record; a stale part; a link naming two places while the body has a twin; a whole-note hover's block edited).
- G-S92 (9 trials) estimated ~70 s in part 5 -> part 5 ~420 s (< 480 s); no sixth part needed.

## 0. Setup
- Worktree `/home/scott/code/steelCompendium/worktrees/sc594-hover-heading-card-write`, dse HEAD ce4937ef = origin/develop after `fetch` (unchanged). `npm ci` done. Obsidian 1.15.1.
- Probes ran from uncommitted files, now removed (`git status --porcelain` empty in every submodule). Copies:
  `sc594-r1-probe-lifecycle.mjs.txt` (fixtures + scenario `P594`, spliced before `const SCENARIOS` of a copy of the harness),
  `sc594-r1-probe-jest.test.ts.txt` (sweep + named probes T1-T16), `sc594-r1-probe-rule.diff.txt` (the rule as a patch on ce4937ef, 193 lines),
  `sc594-r1-probe-rule.py.txt` (applies it), `sc594-r1-mutate.py.txt`.
- Bundles: base `main.js` 3c44cb8b…, probe `main.js` 3a2cb08a…, styles.css 5e5ff488 both.

## A. Measurements

### A1 the ticket in real Obsidian (log `sc594-r1-obsidian-base-a1-a3-a4.log`, dump `sc594-r1-obsidian-base-a1-dump.log`; summary `sc594-r1-obsidian-summary.txt`)
Real Ctrl-hover (CDP mouse), real click on + in the preview. Note `p594-long` = 120 paragraphs, `## Tracker` holding A (5), `## After` + 40 paragraphs, `## Other` holding B (identical), 80 paragraphs.

| cell | base ce4937ef | probe rule |
|---|---|---|
| `[[long#Tracker]]` RV | refused, 1 Notice, note unchanged | **A = 6**, B 5, no Notice |
| same, LP | refused, 1 Notice | **A = 6**, no Notice |
| twin ABOVE the section (`longa`), RV | refused, 1 Notice | **A = 6** |
| SHORT note, same layout, RV | refused, 1 Notice | **A = 6** |
| SHORT note, LP | refused, 1 Notice | **A = 6** |
| whole-note hover `[[long]]` (scrolled to A) | **A = 6** (lands) | A = 6 |
| block hover `[[blk#^a]]`, twin B (`^b`), no edit | refused, 1 Notice | **A = 6** |
| callout under `## Tracker`, identical callout elsewhere, RV / LP | refused / refused | **A** / **A** |
| second + in the ticket shape, 450 ms / 1500 ms after the first | refused (twice) | A = 7, B 5 (both) |

- The short note refuses too: the ticket's "long note" is not the cause.
- After a refused card write the card keeps showing the unsaved value (base: card shows 6 / 7, note 5). Pre-existing display desync, see INFO-3.
- Probe run 1 refused its FIRST hover: the probe registered its `hover-link` listener when the first host was built, after that hover's event. A warm-up then the same cell landed (`sc594-r1-obsidian-probe-a1-rerun.log`). Production must register in `onload` (test plan J9).

### A2 what the host can see at click time (dump log above)
| fact | value (heading hover, RV and LP identical) | how the plugin reaches it | stable RV/LP |
|---|---|---|---|
| `ctx.getSectionInfo(el)` | `text` = the heading's BODY only, no heading line: `"\n```ds-counter…```\n\n"` (9 lines), `lineStart 1`, `lineEnd 6`. Block hover: the block's lines, `lineStart 0`. Whole-note hover: the whole note, `isWhole true`, lineStart = absolute. | public | yes |
| that text in the note | occurs at 2 places (A and B) -> `searchedPinLine` null -> partial -> `twinned` -> refused | – | yes |
| card ancestors | `div.block-language-ds-counter` < `div.el-pre` < `div.markdown-preview-sizer.markdown-preview-section` < `div.markdown-preview-view…` < `div.markdown-embed-content` < **`div.markdown-embed.is-loaded[data-type=heading]`** (`data-type=block` for `#^id`) < `div.popover.hover-popover`. No `src`, no link, no other attributes. | DOM | yes |
| rendered preview | `H2` "Tracker" `data-heading="Tracker"`, then the card. Block hover: no heading, no id in the DOM. | DOM | yes |
| `ctx` keys | `docId, sourcePath, frontmatter, promises, addChild, getSectionInfo, replace, containerEl, el, replaceCode` – nothing about the link | – | yes |
| element expandos | none on `.markdown-embed` or `.hover-popover` | – | – |
| popover instance | RV: `leaf.view.previewMode.hoverPopover`; LP: `leaf.view.hoverPopover`. Keys incl. `targetEl` (the `a.internal-link`), `parent`, `hoverEl`, **`embed`** | `hoverPopover` + `hoverEl` public; the rest private | yes |
| `popover.embed` (class `vx`, PRIVATE) | `file`, `subpath: "#Tracker"` / `"#^p594a"`, `heading: "## Tracker\n"`, `text` (= the section text), `before` (note text before the heading), `after`, `data` (whole note as rendered), `editable: true` | private fields | yes |
| **`hover-link` event** | fired for every hover, RV `source: 'preview'`, LP `source: 'editor'`; `linktext: "p594-long#Tracker"`, `sourcePath: <host note>`; `hoverParent.hoverPopover.hoverEl.contains(card)` is TRUE | `app.workspace.on('hover-link', …)` (event named in public docs; payload untyped) + public `HoverParent.hoverPopover.hoverEl` | yes |

Only a hover's link (subpath) makes its position determinate; the DOM gives the heading's text but not a block id, and nothing gives a line.

### A3 P14 in real Obsidian (logs `…base-a1-a3-a4.log`, `…base-b-w.log`, `…probe-a1-a3-a4-b.log`)
Outside edit = `await app.vault.process(...)` turning A to 9, then the click:

| cell | base | probe |
|---|---|---|
| `[[blk#^a]]` RV, twin B (5) already there, scripted click in the same task | **wrote B** (9, 6), no Notice | refused (9, 5), 1 Notice |
| same, LP | **wrote B** | refused, 1 Notice |
| P14-exact: + lands (A 5->6, B already 6), then A -> 9, scripted + | **wrote B** (9, 7) | refused (9, 6), 1 Notice |
| `[[blk#^a]]` RV, CDP mouse click sent after the edit | no write, no Notice (redraw won) | same |
| **redraw window**: edit landed -> the card's root disconnected | block hover RV 20, 19, 43, 44 ms; heading hover RV 17, 22, 26, 43 ms; heading hover LP 44, 19 ms | – |

- Jest at ce4937ef: r2's P14 still writes B (`T3` base `[9,7]`); `T3b` (no hover record) too; `T3c` (no + first) writes B.
- Reachability: a human click must land inside 17-44 ms after an outside write (Sync, another app) lands. Rare, real.

### A4 heading-hover twin (A edited from outside before the click)
| cell | base | probe |
|---|---|---|
| `[[long#Tracker]]` RV, scripted click | **wrote B** (9, 6) | refused, 1 Notice |
| same, LP | **wrote B** | refused, 1 Notice |
| short note RV | **wrote B** | refused, 1 Notice |
| twin ABOVE (`longa`) RV | **wrote B** (6, 9) | refused, 1 Notice |
| callout under `## Tracker`, own callout edited, RV | **wrote the twin callout** (6, 9) | refused, 1 Notice |
| whole-note hover, own block edited | refused | refused |
| whole-note hover, identical block ADDED above | refused | **A** (5, 6) |
| real mouse click after the edit | no write (redraw won) | same |

Yes, a heading hover has a P14 twin under the current code (it is the same path: no link, so `searchedPinLine` finds the twin's lines once). The proposed rule refuses every one.

## B. The rule (probe patch `sc594-r1-probe-rule.diff.txt`; ReadingModeBlockHost.ts line numbers at ce4937ef)
1. **Record the hover's link (new, plugin-scoped).** In `onload`: `this.registerEvent(app.workspace.on('hover-link', noteHoverLink))`. Keep the last ~16 events `{linktext, sourcePath, hoverParent}`. `hoverLinkOf(el)`: the newest event whose `hoverParent.hoverPopover?.hoverEl` **is** `el.closest('.hover-popover')` (identity, not `contains`; nested / sibling popovers are separate elements). None -> null.
2. **`takePin(false)` (card, :815-849).** Same own-write logic as forms when embedded: `!ownFence -> pinFromLastWrite()` (:822) and the r7 multi-block-window guard (:832) for cards too. Partial marking (:844-845): a hover whose recorded link has no `#` (whole-note hover) is NOT partial (its part is the note as drawn; `mapLine` judges every edit since) – kills the "identical block added" refusal on whole-note hovers. The card pin is rebased by a new `rebaseCardPin` (forms keep `rebasePin`, unchanged).
3. **`rebaseCardPin`** (new): `whole === part` -> not partial. Else `cardLinkLine` -> place. Else this host's `lastWrite` (taken at pin time) when its body == the body known at click -> place at the record. Else stay partial. **Never `searchedPinLine`.**
4. **`cardLinkLine`** (new, beside `verifiedPinLine` :940): link = `src` or `hoverLinkOf`; `getFirstLinkpathDest(path, src ? ctx.sourcePath : record.sourcePath)` must be this note; `resolveSubpath` start line;
   - **one place**: only when the known body occurs more than once in the note now: the `^id` occurs on exactly one line / the heading text names exactly one heading in the cache; else null;
   - **part start**: `start` when the note's line there equals the part's first line (RV/LP embeds include the heading); else, for a heading link, `start + 1` (a hover's part is the heading's body, measured);
   - **whole part**: every line of the part (trailing blank lines dropped) equals the note's lines from the part start;
   - the fence at `partStart + relLine` holds the known body; `^id` marker after the fence (plain) / after the part (quoted), as `verifiedPinLine` :950-961.
5. **`replaceSource` (:1048-1110).** Wait for the card pin's rebase when it has one (`const r = pin && !options.pin ? pinRebased.get(pin) : undefined; if (r) await r;` – the conditional matters: an unconditional `await` broke SC-340 / SC-544 ordering tests). A card write whose pin is still partial -> `'miss'` (today's dropped-write Notice, no new string), never `twinned` / `resolveWriteTarget`.
6. **Second + in the same preview: use the record (yes, safe).** Base refuses it in the ticket shape (first + refused too), and refuses r3's shape (the + made A read like B). In a callout's stale window it **writes the twin callout** (jest T16 base `[7,6]`). With the record: real Obsidian 450 ms / 1500 ms -> A = 7; jest T5/T5b/T6/T16 -> A; T6b (A edited from outside between the two +) -> refused. Same safety argument as SC-584 r3 for forms: the record is the exact position of this host's own write, mapped by `mapLine` with the body check, dropped on unload and `setMountedBody`.
7. **Unchanged:** form pins (`pinPosition` -> `takePin(true)` -> `rebasePin`, record only for forms there, the r7 guard), `pinnedTarget`, `twinned`, `landsOnOtherBlock` for non-partial pins, non-embedded cards (no `rebaseCardPin`, `partialPins` never set).

## Sweep table
Full table: `sc594-r1-sweep-table.txt` (format of sc584-r7-sweep-table.txt plus an edit column; columns `construct | link shape | host | outside edit before the click | base ce4937ef | probe`). Constructs: plain fence, callout, header-less quote, quote whose first line is the fence, nested callout, list item, footnote. Shapes: heading hover (part = heading body, as measured), block hover, heading embed `![[note#Tracker]]` (part includes the heading), block embed `![[note#^a]]`, whole-note hover. Hosts: RV, LP-style (`.cm-embed-block` wrapper; hovers are the same popover in LP, measured). Edits: none, own edited, twin edited, identical added (a copy above everything).

| base -> probe | cells |
|---|---|
| A -> A | 90 |
| **TWIN -> refused+Notice** | **40** (own edited: heading hover, block hover, heading embed, block embed x 5 quote/fence constructs x RV/LP) |
| refused+Notice -> A | 60 (ticket: heading hover none / identical added; block hover none / identical added; whole-note hover twin edited / identical added) |
| refused+Notice -> refused+Notice | 94 (list item / footnote everywhere (SC-461); own edited whole-note; …) |
| A -> refused | **0** |

- Base writes the twin for EMBEDS with `src` too (heading/block embed, own block edited): `verifiedPinLine` fails on the body, `searchedPinLine` finds the twin. The rule closes those card cases; the FORM version is SC-596.
- No hover-link record (4 cells): refused on both.
- Named probes (same file; base -> probe): T1 ticket long `refused -> A`; T2 short `refused -> A`; T3 P14 `wrote B -> refused`; T3b P14 no record `wrote B -> refused`; T3c block hover own edited `wrote B -> refused`; T4 heading hover own edited `wrote B -> refused`; T5 second + stale `refused -> A`; T5b second + fresh `refused -> A`; T6 second + after A reads like B `refused -> A`; T6b outside edit between the + `wrote B -> refused`; T7 repeated heading, unique body `A -> A`; T8 same-name section inserted above (twin) `refused -> refused`; T9 two popovers `refused -> A`; T10 record of another popover `refused -> refused`; T11 RV embed repeated heading `A -> A`; T12 whole-note hover identical added `refused -> A`; T13 A deleted, B moved onto A's line `refused -> refused`; T14 immediate flush `refused -> A`; T15 cache points `^a` at B `refused -> refused`; T16 callout second + stale window `wrote the twin -> A`.

## What still refuses after the rule (Notice, nothing written) – for the CHANGELOG
- a counter inside a list item or a footnote (SC-461, unchanged);
- the clicked block edited or deleted from outside before the click (the preview not redrawn yet, 17-44 ms);
- a hover preview whose popover has no `hover-link` record (a popover not opened by Obsidian's page preview, or one already open when the plugin loaded);
- a part that no longer equals the note where it starts (anything in the embedded section changed from outside and the preview / embed not redrawn yet), unless this host's own last write places it;
- a link that names two places (two headings of that name, or two `^id`s) when the counter's body also occurs twice;
- a metadata cache that lags (the link's line does not verify);
- a whole-note hover whose block was edited from outside;
- (unchanged) everything a non-embedded card refused before.
Do NOT claim "an identical counter elsewhere is never written" for forms or for null-pin paths (SC-596).

## Test plan for the implementer
**Jest (new, `test/dom/framework/reading-mode-host-pin.test.ts` or a new suite), red on base where marked:**
- J1 ticket: heading hover, part = heading body (lineStart 1), twin elsewhere, long and short: lands A. RED on base.
- J2 block hover with twin, no edit: lands A. RED.
- J3 P14 (r2), J3b no record, J3c no + first, J4 heading hover own edited: never B, one Notice. RED (base writes B).
- J5 second + stale part, J5b fresh part, J6 + made A read like B then second +, J16 callout second + stale window: land in A. RED. J6b outside edit between the two +: refused. RED.
- J7 / J11 repeated heading, unique body (hover and RV embed): land (control, green on base).
- J8 identical same-name section inserted above with a twin: refused (control).
- J9 two popovers / J10 record of another popover: own popover's link only. J9 RED.
- J12 whole-note hover, identical block added: lands A. RED.
- J13 A deleted, B moves onto A's line (two counters in one section, blank-separated): refused (kills the whole-part check mutant).
- J14 write at once after the click (no settle): lands. RED.
- J15 cache points `^a` at B: refused (kills the marker mutant).
- the construct sweep (284 cells) as a `test.each` asserting "never TWIN / ADDED" and the expected A / refused per cell (copy from the probe file).
- onload registers a `hover-link` listener (spy on `workspace.on`).
**Existing tests that change** (`sc594-r1-jest-probe-full.log`): 6, all in `reading-mode-host-pin.test.ts`:
- 5 model hovers without the record Obsidian always has: "a heading hover of a long note: + then the form", P1, P1d, P3, "the same shape with no outside edit". Fix the helper: `hoverEl(link)` notes a `hover-link` record for its popover (with that record they pass: `sc594-r1-jest-probe-pin-withrecords.log`, 144/145). Also correct the heading-hover model: Obsidian gives a hover the heading's BODY (no heading line, lineStart 1); `part(SUB, 2)` is right only for `![[note#H]]` embeds.
- 1 intended: "a card (+/-) write's pin never uses the host's last write: a second + … is refused as before (SC-480)" -> now lands in the + block (the record); rename and flip.
**Mutants** (`sc594-r1-mutants.log`, all against the probe test file): mA no partial-card refusal (44 fail), mB `searchedPinLine` kept for cards (32), mC no `start+1` (9), mD no whole-part check (1: T13), mE no one-place check (1: T8), mF one-place check unconditional (2: T7, T11), mG newest record regardless of popover (2: T9, T10), mH no record for cards (2: T5, T6), mI whole-note hover still partial (1: T12), mJ card rebase not awaited (1: T14), mK no `^id` marker (1: T15), mL card `takePin` without the own-write record (1: T16): all killed. mM (no known-body check in `cardLinkLine`): survives, equivalent (`pinnedTarget` checks the body at write time).
**Lifecycle G-S92 (part 5, after G-S87, before G-S56)**: real hover (gs83Kit), real click on + unless noted, one note per trial (5 s card-Notice limit), notices hidden by CSS like G-S77:
- (a) `[[long#Tracker]]` RV, twin under another heading: A written, twin untouched, no Notice (base: refused);
- (b) same, LP; (c) short note RV; (d) `[[note#^a]]` RV, twin `^b`;
- (e) second real + 450 ms after the first (ticket shape): A = 7;
- (f) callout under `## Tracker`, identical callout elsewhere, RV;
- (g) control with teeth: `[[note#^a]]`, `await vault.process(A -> 9)` and a scripted `.click()` on + in the SAME page task (inside the 17-44 ms window): nothing written, one Notice (base: wrote B);
- (h) the same for `[[long#Tracker]]` (base: wrote B);
- (i) whole-note hover, identical block added above, scripted click: A written (base: refused).
- Wall time: probe runs measured ~8 s per trial incl. the 6 s same-note spacing (23 trials 203 s with start-up); 9 trials ≈ 70 s. Part 5 347-351 s + ~70 s ≈ 420 s < 480 s: no sixth part. No G-S64 phases.

## Open questions for the owner
1. **The `hover-link` record** is the only non-private signal that names a hover's subpath. The event is named in Obsidian's public docs but its payload is untyped (`linktext`, `sourcePath`, `hoverParent`), stable in 1.15.1 RV and LP. Acceptable, or does it need Scott? Fallback without it: refused (as today).
2. **Repeated headings:** the one-place check applies only when the body also has a twin (T7/T11 still land). Accept "a link naming two headings + a twin body -> refused"?
3. **Forms**: the same hover link would also place a FORM in a heading/block hover (and close SC-596's block-only-part hazard for forms). Out of scope here (brief: forms unchanged); fold into SC-596?
4. **INFO-3 (pre-existing, base and probe):** after a refused card write the card keeps showing the unsaved value (base: card 6/7, note 5) until the next redraw. File?

## INFO (pre-existing, found on the way)
- INFO-1: base writes the twin for card writes in RV/LP `![[note#Tracker]]` / `![[note#^id]]` embeds too when the block was edited before the click (40 sweep cells, all shapes). The rule closes them.
- INFO-2: base writes the twin callout on a second + inside a callout's stale window (T16; real Obsidian: own-callout-edited cell wrote the twin callout).
- INFO-3: see open question 4.
- INFO-4: the jest model of a heading hover (`part(SUB, 2)`, heading included) does not match Obsidian (heading body only); that is why the ticket's shape had no red jest test.

## Working tree
`git -C …/draw-steel-elements status --porcelain`: empty before and after; every submodule of the worktree 0 lines; superproject of the worktree empty. Probe files deleted by literal path; `ReadingModeBlockHost.ts` restored with `git checkout --` after every probe / mutant run. No Obsidian process of mine left.
