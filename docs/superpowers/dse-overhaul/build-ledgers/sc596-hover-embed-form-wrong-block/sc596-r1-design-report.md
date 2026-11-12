# SC-596 r1 design / survey report (designer-r1), dse da2bdbc6 (= origin/develop after `fetch`, did not move)

**Executive summary**
- **Twin writes at base (jest, 2880 form-Save cells): 392.** Every non-list construct, with the form's block edited or deleted from outside before the pencil and no + first: heading hover, block hover, block embed (both twin layouts) and heading embed (twin in a same-name `## Tracker` section). Plus plain fences when the part was redrawn after a + (the text search runs before the own-write record). 0 after a + with the stale part, whole-note shapes, list items, footnotes. P4 still writes B (4 of 5 variants). P13 verbatim (null pin) still writes the upper callout.
- **LIVE in real Obsidian 1.15.1 at da2bdbc6.** With the source note also open in another pane, the redraw does NOT close the form (SC-552 `keepFormOpenOn`). Save then **wrote the twin, no Notice, in 5 of 6 cells**: block embed RV, heading embed RV, block hover RV, heading hover RV and LP. Without that pane the form closes 49-98 ms after open (7 of 7 cells) and nothing is written. Opening the form needs the pencil pressed between an outside write landing and the redraw (36-114 ms). After that, a Save at any time writes the twin.
- **Rule:** a block edit form's pin in an embed or hover preview of part of a note is placed exactly like a card's (SC-594 `rebaseCardPin`: the link checked by `cardLinkLine`, else this host's own write, else refused). It never uses `verifiedPinLine` or `searchedPinLine`. A form there that cannot be pinned gets a *refusing* pin (nothing written, Notice), never no pin.
- **Probe sweep:** TWIN 392 -> 0. Saved -> refused: 12 cells, all one class: a heading embed whose heading name and counter both occur twice (named below). Refused -> saved: 36 (hovers with an identical twin and no edit). The SC-584 r5 shapes still save (7 of 7). Real Obsidian, probe bundle: 13 of 13 cells write nothing; the 6 pane cells give one Notice and keep the form open. Full jest under the probe: 16 existing tests flip, all classified below.
- **Mutants:** 17 (8 of the rule's own guards, 9 of the card guards a form now relies on). 14 killed, 3 survived: 2 equivalent, 1 for a link shape Obsidian does not produce.
- **SC-607: no** (forms inherit the same limit: the rule follows what the link names now).
- **Open questions (owner):** (1) accept the 12 saved -> refused cells (same as cards), or keep the looser embed check (`verifiedPinLine`) for embeds; (2) a refusing pin makes `hasPin()` true, so such a form is kept open past its card; (3) G-S96 needs the second-pane shape or it is vacuous; (4) the card null-pin path (the same mechanism) is a follow-up.

## 0. Setup
- Worktree `/home/scott/code/steelCompendium/worktrees/sc596-hover-embed-form-wrong-block`, dse branch `sc596-hover-embed-form-wrong-block` at `da2bdbc6`. `git fetch origin`: origin/develop = `da2bdbc6eac75438ede1eeaf2fa52ef8747b0544` (did not move). `npm ci` done (fresh worktree).
- Jest probe: the scratch file `sc596-r1-probe.test.ts.txt` was copied to `test/dom/framework/` for each run and then deleted by its literal path (`sc596-r1-run-probe.sh.txt`).
- The rule was applied by `sc596-r1-apply-rule.py.txt` and restored with `git checkout --` after every run. Diff: `sc596-r1-probe-rule.diff.txt`.
- Real Obsidian runs never touched the worktree. Two `git archive da2bdbc6` exports in my scratch folder (base, and base plus the rule), `node_modules` symlinked. Each was built with `node esbuild.config.mjs production`. The harness copy is made by `sc596-r1-make-scratch.py.txt`: scenario `P596`, spliced in front of SCENARIOS of a copy (`sc596-r1-probe-lifecycle-scenario.mjs.txt`).
- Bundles: base main.js `2a528ffc…` (= SC-594 r6's da2bdbc6 build), probe main.js `f9728580…`, styles.css `5e5ff488…` for both.

## A. What is left at da2bdbc6 (jest)

**Sweep** (`sc596-r1-sweep-table.txt`; raw records in `sc596-r1-jest-sweep-base.log`). The cell is a form on counter A. Before the pencil, A is edited (or deleted) from outside, and the part Obsidian reports is still the one drawn before the edit. An identical counter B sits elsewhere. Save follows `FormModal.save` exactly: `pin ? replaceSource(body, {pin, pinOnly: true}) : replaceSource(body)`. Dimensions:
- 8 constructs: plain fence, callout, header-less quote, quote whose first line is the fence, nested callout, nested quote whose first line is the fence, list item, footnote.
- 6 link shapes: heading hover (part = the heading's BODY, `lineStart` 1, with the `hover-link` record and the popover DOM Obsidian draws), block hover, heading embed, block embed, whole-note hover, whole-note embed.
- Host: RV, or LP (the `.cm-embed-block` wrapper).
- Edit: none, own edited, own deleted.
- +: no +; a + on A first with the part still from before the + (B already reads like A after the +); a + first with the part redrawn after it.
- Metadata cache: fresh, or lagging the outside edit.
- Twin layout: B elsewhere (above, under `# N`), or B under a second `## Tracker` section below A's.

| base outcome | cells |
|---|---|
| A (the form's block) | 384 |
| **TWIN** | **392** |
| refused (nothing written, Notice) | 2104 |

Where the 392 TWIN cells are (every one has the own block edited or deleted; RV and LP alike; fresh and lagging cache alike):
- no +: 48 cells for each of heading hover, block hover and block embed, in each twin layout; heading embed 48, in the same-name layout only. In the twin-elsewhere layout the heading line in the part does not match the twin.
- + with the part redrawn after the +: 8 per shape in each layout, **plain fence only**. `rebasePin` tries `searchedPinLine` BEFORE the own-write record. The non-plain constructs are covered by SC-584's r7 guard, which takes the record first.
- + with the part from before the +: 0 cells (SC-584's record).
- Whole-note shapes, list items, footnotes: 0 cells.

**P4 / P13** (`sc596-r1-jest-sweep-base.log`, lines `NAMED|`):

| probe | base da2bdbc6 | probe rule |
|---|---|---|
| P4 verbatim (block hover, no hover-link record, section == known, A edited) | **wrote B** | refused, 1 Notice |
| P4 with the hover-link record Obsidian sends | **wrote B** | refused |
| P4e block embed `![[Note#^a]]`, fresh cache | **wrote B** | refused |
| P4h heading hover | **wrote B** | refused |
| P4he heading embed (part has the heading line) | refused | refused |
| P13 verbatim (callout `^cal` embed, the host knows 6, part 5, NO record) | **null pin, wrote the upper callout** | refused (refusing pin) |
| P13 with a real + first (record exists) | refused (SC-584) | refused |

So INFO-1/P4 is left as it was. SC-584 closed the stale-part shape after a +, but not the shape where the part is current and the block was edited before the pencil. INFO-3/P13 is left for every null pin.

**Null pins** (a form in an embed or hover gets `pinPosition() === null` in these shapes, at base):
- **list item, footnote** (every link shape; no own fence is found in the window). Save without a pin -> `resolveWriteTarget` -> 'abort' -> the "can't tell where … inside lists" Notice; nothing written (sweep: 720 cells, every list item / footnote cell).
- **a non-plain window (callout, quote) whose text holds no block with the known body, and no record of this host's own write** (P13 verbatim; N1: a second host wrote the block; N4: a heading-hover callout whose record was dropped). Save without `pinOnly` -> `resolveWriteTarget` with the part's line numbers against the whole note -> `locateByBody` -> **the twin**.
- **the section resolved once and is null at the pencil** (N3b) -> `locateByBody` near a part-relative line -> **the twin**.
- **the section never resolved** (N3) -> `canPersist` false: nothing written; FormModal's own "couldn't save" Notice.
- (`N2`, two identical counters in one callout with no DOM ordinal, gets a pin, not a null one: `locateInSection` picks by `near`. In Obsidian the ordinal is always readable, so it is not a hazard.)

## B. Reachability in real Obsidian 1.15.1 at da2bdbc6 — **LIVE**

Logs: `sc596-r1-obsidian-base.log`, `sc596-r1-obsidian-probe.log` (one `P596-REC` JSON line per cell).

How each cell runs:
1. Open the host note (RV or LP). For hovers, a real Ctrl-hover via `gs83Kit`, with the pointer on the card.
2. In ONE page task: `await app.vault.process(src, A -> 9)`, then a scripted click on A's pencil (the part is checked stale at open: `staleAtOpen: true` in 13 of 13).
3. Watch for 1.5 s whether the form closes. If it is still open, rename in the raw box and click Save.

"Pane" = the source note is also open in a second split leaf (Reading view).

| cell | base: form | base: Save | probe: form | probe: Save |
|---|---|---|---|---|
| block embed RV | closed 61 ms (card gone 49) | – | closed 62 ms | – |
| block embed LP | closed 49 ms (37) | – | closed 63 ms | – |
| heading embed RV, two `## Tracker` | closed 91 ms (82) | – | closed 100 ms | – |
| block hover RV | closed 76 ms (63) | – | closed 128 ms | – |
| heading hover RV (section is the last of the note) | closed 81 ms (65) | – | closed 164 ms | – |
| heading hover LP (same) | closed 98 ms (77) | – | closed 77 ms | – |
| heading hover RV (`## Tracker` followed by `## After`) | closed 56 ms (36) | – | closed 97 ms | – |
| **block embed RV, pane** | stays open (card gone 51) | **TWIN, no Notice** | open | nothing, 1 Notice |
| **heading embed RV, two `## Tracker`, pane** | stays open (114) | **TWIN, no Notice** | open | nothing, 1 Notice |
| **block hover RV, pane** | stays open (89) | **TWIN, no Notice** | open | nothing, 1 Notice |
| **heading hover RV (followed by `## After`), pane** | stays open (57) | **TWIN, no Notice** | open | nothing, 1 Notice |
| **heading hover LP (followed by `## After`), pane** | stays open (87) | **TWIN, no Notice** | open | nothing, 1 Notice |
| heading hover RV (section is the last), pane | stays open (83) | refused, 1 Notice | open | nothing, 1 Notice |

- **Verdict: LIVE.** The ticket's assumption that the outside edit's redraw closes the form first holds only when the source note is open nowhere else. `openFormModal` keeps a pinned form open when `keepFormOpenOn()` names the registry, and that only needs the note to be shown in some markdown leaf (`getLeavesOfType('markdown').some(… file.path === ctx.sourcePath)`). I measured a split pane. By the code, a background tab satisfies it too (not measured).
- SC-595's anchoring did not change the no-pane case: the form still closes with the card's unload (49-98 ms after open at base).
- Timing to reach it: the pencil must be pressed after an outside write (Sync, another app) lands and before the embed or preview redraws (the card was gone 36-114 ms after the open at base). A scripted click in the same task always lands inside that window; a real press lands there only by chance (the SC-594 "rare, real" class). Once the form is open, Save at ANY later time writes the twin and closes the form, with no Notice.
- The one pane cell that refused at base: the `## Tracker` section is the last of the note, so its part includes the trailing `END`, which the twin's body under `## Other` does not have. `searchedPinLine` found no run, so nothing was written. Change the fixture to a section followed by another heading (hh3) and the twin is written in RV and LP.
- Cells: 13, over the ~6 budget. The extra cells are the pane variants (the decisive ones) and the hh3 fixture correction; whole run 83 s base / 85 s probe.

## C. The rule (probe: `sc596-r1-probe-rule.diff.txt`, 73 lines, `ReadingModeBlockHost.ts` only)

1. **`takePin` — a form's pin in an embed or hover is placed like a card's.** `link = src ?? hoverLinkOf(…)` for forms too (was: cards only), and `pinRebased.set(pin, this.rebaseCardPin(…))` for forms too (was `rebasePin`). `rebaseCardPin` tries, in order:
   - the part IS the note;
   - `cardLinkLine`: the link must resolve to this note; the whole part must equal the note where the link starts (a heading hover hangs from an ATX heading line of the link's name); the fence at the card's line must hold the known body; a `^id` link needs its marker after the block; while the body occurs twice, the link must name ONE place;
   - this host's own last write, when it is of the known body;
   - else the pin stays partial and is refused.
   No text search and no `verifiedPinLine`. A whole-note hover (link without `#`) is a pin of the note, not a part.
2. **A form in an embed or hover never has a null pin.** No section, or no own fence and no usable own write, gives a *refusing pin* (`refusingPins`, also partial). `replaceSource` treats it as an unplaceable write: nothing written, `notifyUnsavableWrite` (forced for forms). List items and footnotes keep their "inside lists" wording (`looksLikeList`, as before).
3. Cards and non-embedded hosts are unchanged. After the rule, `rebasePin`, `verifiedPinLine`, `embedStartLine` and `searchedPinLine` have no caller left (grep): the implementer deletes them.

**Sweep under the probe** (same 2880 cells, `sc596-r1-jest-sweep-probe.log`): A 408 / TWIN **0** / refused 2472.

| base -> probe | cells | which |
|---|---|---|
| TWIN -> refused | 392 | all of section A |
| refused -> A | 36 | block hover (both layouts) and heading hover (twin elsewhere), nothing edited, no +, 6 constructs x RV/LP: placed by the hover's link, as cards are since SC-594 |
| **A -> refused** | **12** | **twin under a second `## Tracker` x heading embed x nothing edited x no + x 6 non-list constructs x RV/LP** |
| A -> A / refused -> refused | 372 / 2068 | |

- **The 12 saved -> refused cells, named and justified.** `![[note#Tracker]]` of a note with TWO `## Tracker` sections that hold identical counters, nothing edited. `cardLinkLine`'s one-place check refuses a link that names two places while the body occurs twice (cards do the same since SC-594). The check is what keeps Y1 safe: an identical `## Tracker` section pasted next to the own one, the cache lagging. Base writes the first of the two identical sections there (a guess); mutant m10 (check removed) writes it too. The heading hover of the same note is refused at base and under the probe alike.
- **SC-584 r5 shapes still save:** two identical counters, no + first, the form on the lower.
  - r5a: two plain counters in one `## Tracker`, heading embed RV and LP, and heading hover: lower.
  - r5b: a callout with two counters (DOM ordinal), block and heading embed, RV and LP: lower.
  - That is 7 of 7 on base and probe. The block-embed and twin-elsewhere "none" cells also save on both.
- Notice kinds: every T -> R cell shows the "changed on disk first" Notice. List items and footnotes keep "can't tell where" and "… inside lists" (`R -> R`, unchanged).
- Named probes, base -> probe:
  - P4 x4 wrote B -> refused. P13 verbatim, N1, N4, N3b TWIN -> refused (refusing pin). N3 refused -> refused.
  - W1 (whole-note hover, an identical block added above before the pencil): refused -> A.
  - X1 (a paragraph inside the embedded section edited from outside, the block untouched): A -> refused. By design: the part no longer equals the note.
  - X2 (the cache lags an insertion above, a twin under `## Other`): A -> refused. Base places that pin by the text search.
  - Y1e and Y2e (an identical section, or a block with its `^a`, pasted next to the own one, the cache lagging): base writes the first of the two identical places; probe refused. Y1h, Y2h, Y3e, Y3h, Y5, Y6: refused -> refused.

**Full jest under the probe** (`sc596-r1-jest-full-probe.log`): `Tests: 16 failed, 2 skipped, 7655 passed, 7673 total`, all 16 in `test/dom/framework/reading-mode-host-pin.test.ts`:
- **7 are model flips.** Each is re-modelled the way Obsidian draws it, and each re-model saves on base AND probe (V1-V10):
  - 609, 618 and 650 (`SC-556: a block edit form in a heading embed`, an embed element with no `src`) -> V1, V2, V3 with `src`;
  - 875 (a hover with no `hover-link` record) -> V5 with the record;
  - 1130 (a cache mock built from the pre-edit note while 1000 lines were inserted) -> V8 with a cache that follows the note;
  - 734 ("+ then the pencil" modelled without the +, so there is no record) -> V9 with a real +;
  - 925 (no `src`) -> V10.
- **3 are shapes Obsidian does not produce** (the `test.each` at 815): no `src`, a link without `#` on a part, a link to another note. They are refused now (no link).
- **6 are saved -> refused by design.** Each is a moment the cache or the part cannot be trusted, or the block itself changed before the open:
  - 768 and 780: a lagging cache (Obsidian catches up 6-45 ms after an outside edit);
  - 759: two identical `## Tracker` sections (the 12-cell class above);
  - 815 "a subpath that does not resolve": cache lag or a renamed heading;
  - 915: no metadata cache (a note not indexed yet);
  - 1402: a field removed from the block from outside, the part not redrawn. That is the ticket's own class: the block changed before the open.
- These tests, and the comments that say "the text search places the pin", are rewritten by the implementer.

**Mutants** (`sc596-r1-mutants.log`; runner `sc596-r1-mutate.py.txt`, `sc596-r1-run-mutants.sh.txt`, `sc596-r1-cmp-mutant.py.txt`). Killed = a named probe fails, or a named record or a sweep cell (outcome and Notice kind) differs from the probe's results:
- The rule's guards:
  - m1 (no refusing pin when there is no section): killed (N3b);
  - m2 (no refusing pin when there is no own fence): killed (P13 verbatim, N1, N4);
  - m3 (refusing pin -> `pinOnly` miss): killed by the Notice kind (720 list / footnote cells change to "changed on disk first");
  - m4 (refusing pin not added to `partialPins`): **survived, equivalent** (the refusing branch runs before `pinnedTarget`);
  - m5 (no `hoverLinkOf` for forms in `takePin`): killed (W1);
  - m6 (forms back on `rebasePin`): killed (392 TWIN, P4 x4);
  - m7 (forms on `rebasePin` with `verifiedPinLine` only, no search): killed. 0 TWIN, but the 36 hover cells refuse again (no `src`) and the 12 same-name heading-embed cells and X1 save. This is the "looser embed check" alternative of open question 1;
  - m8 (a whole-note hover stays partial for forms): killed (W1).
- The card guards a form now depends on:
  - m9 (whole-part check): killed (X1);
  - m10 (one-place check for a heading name): killed (Y1e, Y1h). With it removed the 24 same-name heading cells save and the sweep has 0 TWIN;
  - m10b (one `^id` marker line): killed (Y2e, Y2h);
  - m11 (`^id` marker after the block): killed (Y3e, Y3h);
  - m12 (`cardLinkLine`'s final body check): **survived, equivalent** (`pinnedTarget` checks the body; same as SC-594 mM);
  - m13 (`rebaseCardPin`'s own-write fallback): killed (V9 and 20 cells);
  - m14 (the link resolves to this note): **survived**. The only shape that reaches it is a link to another note, which Obsidian does not produce for a card (its `sourcePath` is the linked note); without the check the note's own cache is used and the own block is written;
  - m15 (`popoverShows`): killed (Y5);
  - m16 (a heading hover's hanging line must be that heading): killed (Y6).
- Total: 17 mutants, 14 killed, 3 survived (m4 and m12 equivalent; m14 not reachable).
- Test note for the implementer: m5 and m8 die only on W1's recorded outcome. W1's assert in the probe is weak (`not.toEqual(['Edited','Twin'])`). Assert `['Twin','Edited']`.

**Test plan (implementer).**
- jest: the sweep as a `test.each` asserting the probe's result per cell (never TWIN); P4 x5, P13 x2, N1, N3, N3b, N4, W1, X1, X2, Y1-Y6; V1-V10 replacing the 16 flipped tests; r5a and r5b as controls.
- lifecycle **G-S96**: the 6 pane cells (red on base: 5 TWIN, no Notice; green: nothing written, 1 Notice, the form open). The no-pane cells are vacuous controls like (zc) and (z). Part 6 (`G-S92 G-S96`): 13 cells took 83 s with start-up, so 6-8 cells should add about 50 s to G-S92's 103 s.

## D. SC-607 — No
SC-607 is a still-open preview whose part text did not change, so it is never redrawn (the hovered one of two identical `## Tracker` sections deleted, or two heading names swapped) and with a fresh cache. A write there follows what the link names NOW. My rule places a form through the same link (`cardLinkLine`), so forms get exactly that limit. The record-only probe D1 (the hovered section deleted, the other identical one left, the preview not redrawn, a fresh cache) is saved into the remaining `## Tracker` on base and under the probe alike. Base gets there by the text search, the probe by the link. Not a regression; not covered. What SC-607 needs is a pin of the note *as drawn at mount*, mapped at click/Save; neither the link nor the own-write record gives it. Not widened.

## Drive-by fixes
None.

## Follow-ups (left alone)
- **The card null-pin path** is the same mechanism and was not measured (out of scope). A card in a stale non-plain window with no own-write record gets no pin, and its write falls back to `resolveWriteTarget`. Owner: file or fold?
- The jest heading-hover model (`['', …block, '', '']`) assumes the section ends at a heading. A real part of the note's last section carries its trailing text (measured: the base heading-hover pane cell refused because its part ended in `END`). It makes no difference to the rule, but G-S96 fixtures must follow the section with another heading.

## Working tree
`git -C …/draw-steel-elements status --porcelain` was empty before and after every probe and mutant run, and at the end. The probe test file was deleted by its literal path each run; `ReadingModeBlockHost.ts` / `hoverLinks.ts` were restored with `git checkout --`. The real-Obsidian runs used scratch exports only. No Obsidian process of mine is left, and no lifecycle temp dir of mine is kept (every run passed).
