# SC-596 dse-verify proposal (replacement text; the SKILL itself is NOT edited by the implementer)

Branch `sc596-hover-embed-form-wrong-block`, dse `c6077860` on `7866426e` (code last changed in the rebased `a65207fc` fold; r4 added tests and docs only). Line numbers are those of the
SKILL at the time of writing (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`).

## 1. "Embeds of part of a note" bullet (SKILL line ~340) — replace the whole bullet

- **Embeds of part of a note** (`![[note#Heading]]`, `![[note#^id]]`, a hover preview): Obsidian gives the card only that part's text, with
  line numbers from its first line (measured `{lines: 10, lineStart: 2}`). A pin made of that is not a position in the note, so a block
  inside `.internal-embed` / `.markdown-embed` (or a hover preview) gets a PARTIAL pin (`partialPins`) that `rebaseCardPin` (async) places
  onto the whole note: the part IS the note; else the LINK (the embed's `src`, or for a hover preview the link of Obsidian's `hover-link`
  event for THAT popover) checked by `cardLinkLine` over the whole part; else this host's own last write (`lastWrite`) when it is of the
  known body; else the pin stays partial and `pinnedTarget` refuses it (Save writes nothing and shows the Notice). **A block edit form's
  pin and a card write's pin are placed the same way since SC-596** (before, a form went through `rebasePin`: `verifiedPinLine`, then a
  text search for the part's lines in the note; both deleted). Nothing ever searches the note for the part's text or for the body, so a
  block edited from outside before the form opened can never be taken for its identical twin. A pin that cannot be made at all - no
  section, or a non-plain window (callout, quote) whose text holds no block with the known body and no record of this host's own
  write - is a REFUSING pin (`refusingPins`, partial too): `replaceSource` treats it as an unplaceable write and writes nothing. A form in an
  embed / hover preview therefore never has a NULL pin (a null pin saved without `pinOnly`: the part's line numbers and the body
  against the whole note, which finds the twin). The same refusing pin covers a CARD write there (SC-596 Q4: five measured shapes
  wrote the twin). An embed of a whole note (`src` without `#`, or a hover link without `#`) is not partial. The jest mock
  `resolveSubpath` (`test/mocks/obsidian-core.ts`) works on a cache a test supplies (`jest.spyOn(app.metadataCache, 'getFileCache')`);
  the jest mock `Vault.cachedRead` waits a macrotask, so under jest FAKE timers an awaited `cachedRead` never resolves (the rebase is
  gated on the embed ancestor, so a plain form never awaits it).
  - **A jest model of a form in an embed must be what Obsidian draws:** the embed element has its `src`; a hover preview has the
    `hover-link` record and the popover DOM (`hoverEl(link)` / `popoverEl(app, link)`); the metadata cache follows an outside edit
    (Obsidian re-reads within ~6-45 ms) unless the test is about the lag; a "+ then the pencil" test needs a real + by that host (a
    note whose host knows 6 while it holds 5 is not a +). A model without them is refused now (it saved by the text search before).
  - **Which Notice shows (measured: the sweep oracle and the named tests assert the kind in every cell).** Two messages, both prefixed
    `Draw Steel Elements: a change to a block in <note> was not saved — `:
    - **"the block changed on disk first."** (`droppedWriteMessage`): a pin exists and nothing places it - the block edited or deleted
      from outside, a heading link naming two places while the body occurs twice, a lagging or wrong cache, an unresolved subpath, no
      cache, a paragraph of the section edited, Y1-Y6, every refusal of a non-list shape that has an own fence in the part (1752 of the
      2880 sweep cells).
    - **"the plugin can't tell where this block sits in the note."** (`unsavableWriteMessage`): a REFUSING pin (stale non-plain window with
      no own-write record: P13, N1, N4; section null at the pencil: N3b; the same for a card write) and list items / footnotes; with
      **" (blocks inside lists can't be edited yet)"** appended when the note's lines at the part hold a list item (492 of the 720 list /
      footnote cells; the other 228, where the block was deleted, have the plain wording).
    - **No host Notice at all:** the section never resolved (N3): `canPersist` is false, `reported` stays false and FormModal says
      "Draw Steel Elements: couldn't save — the block may have moved."
    A card write's Notice is rate limited (once per note per 5 s per message); a form's is forced.
  - **Saved -> refused by design (SC-596 Q1, same as cards since SC-594):** a heading link of a note with TWO identical `## Tracker`
    sections and no + first; a cache that lags an outside edit or points at the wrong line; an unresolved subpath; no metadata cache;
    a paragraph inside the embedded section edited from outside before the pencil; the block itself edited before the open (a field
    removed, the part not redrawn). Each shows the "changed on disk first" Notice, nothing is written, the form stays open.
    Also refused where base saved (r3 LOW-2; all safe, all under Scott's 2026-11-10 ruling, all need a click within ~20-45 ms of an
    outside write or a transient section loss): **a refusing pin when the body is unique** - a stale callout window with no record of
    this host's own write, or a section gone at the click, is refused for a form AND a card + / - even when no identical counter exists
    anywhere ("can't tell where"); and a **nested heading link** (`![[note#P2#Tracker]]`; `## Tracker` under both `P1` and `P2` with
    identical counters): `cardLinkLine` counts every heading of that name in the text, so it is refused like two `## Tracker` sections
    (cards since SC-594).
  - **Refused -> saved:** a block hover or heading hover (twin elsewhere) with nothing edited and no +: the hover's link places it
    (36 sweep cells). `G-S64 (zh)` changed with it: a hover form on `[[note#^id]]` with an identical block above now LANDS in the linked
    block (it expected a refusal before).
  - **Jest coverage:** `test/dom/framework/reading-mode-host-form-pin.test.ts` (new; ~58 s alone because the sweep is a `test.each` of
    2880 cells: 8 constructs x 6 link shapes x RV/LP x edit x + x cache lag x 2 twin layouts, asserting outcome AND Notice kind AND that
    the form has a pin; plus the named shapes P4, P13, N1, N3, N3b, N4, W1, X1, X2, Y1-Y6, r5a / r5b controls and the card
    shapes) and the re-modelled tests in `reading-mode-host-pin.test.ts`.

## 2. SC-584 sub-bullets (SKILL lines ~346-349, ~357, ~391-393)

- Line ~348-349: replace "`rebasePin` (a block edit form's pin only, never a card write's) uses it as the LAST step, when the link (`verifiedPinLine`) and the unique-text search (`searchedPinLine`) place nothing and the body known at open is the body that write wrote" with "`rebaseCardPin` (a form's pin and a card write's pin alike since SC-596) uses it as the LAST step, when the link (`cardLinkLine`) places nothing and the body known at open is the body that write wrote".
- Line ~357: replace "`verifiedPinLine` looks for `^id` after the END OF THE EMBEDDED PART" with "`cardLinkLine` looks for `^id` after the END OF THE EMBEDDED PART".
- Line ~351 ("A form opened with NO + by that host on a stale part still refuses, as before SC-584."): append "A form or card write whose window holds no block with the known body and has no record is a REFUSING pin since SC-596 (before: no pin, and a write without `pinOnly` could land in the twin)."
- Line ~391-393 "Still refused (no data lost)": replace the last sentence "Pre-existing and out of SC-584: SC-596 (a block-only part edited before open without a +; general null-pin forms; forms in hover previews). SC-594 landed: card writes in hover previews and embeds, see below." with "SC-594 landed card writes in hover previews and embeds; SC-596 landed the form side (a block-only part edited before open without a +, null-pin forms, forms in hover previews: all placed like a card, or refused), see below."

## 3. Hover form bullet (SKILL line ~384, point (3)) — replace the last two sentences

"A FORM opened from a hover is placed the same way since SC-596 (the link, else the host's own last write, else refused): it LANDS in the hovered counter when the note confirms it (a block or heading hover with an identical twin elsewhere and no outside edit), and is refused (Notice, nothing written) when the block was edited from outside before the form opened. A phase that needs a form's Save to land in a heading hover no longer needs a different counter above the section, but a hover FIXTURE must follow the tracker section with another heading: the part of a last section carries trailing text (`END`) its twin's body under another heading does not have. **Block-hover residual shared with cards (r3 LOW-3, jest-only):** `popoverShows` cannot tell two BLOCK previews apart (no id is rendered: `data-type=block` for both), so a block hover showing A but bound to `Note#^b` (the identical counter B carries `^b`) saves into B for a card AND now for a form; base refused it for forms (they never used the hover link). A real pointer cannot produce it in 1.15.1 (the bind-at-first-lookup / bind-at-next-event rule), jest can; a jest model must not bind a popover to another block's link. Not widened (a refusal while the body occurs twice and the bound link is a `^id` would re-refuse the 36 hover cells)."

## 4. "Hover card writes (SC-594)" bullet (SKILL line ~394 and ~402)

- Line ~394: replace "`rebaseCardPin` (not the forms' `rebasePin`) places it" with "`rebaseCardPin` places it (and, since SC-596, a block edit form's pin too)"; replace "It never searches the note for the part's text (`searchedPinLine`) or for the body." with "It never searches the note for the part's text or for the body (`searchedPinLine` was deleted in SC-596)."
- Line ~402 "Still refused ... exactly:" — replace the sentence "Forms (`pinPosition` -> `rebasePin`) and null-pin paths are NOT covered (SC-596)." with "A form's pin is the same pin (SC-596) and refuses the same shapes. A block with no pin at all (no section, a stale callout window with no own-write record) is a REFUSING pin for card writes and forms alike (the "can't tell where" Notice; a card's is rate limited)." Also "The Edit form opened from a preview is unchanged (SC-596)" statements elsewhere become "placed like a card since SC-596".
- **Known limit SC-607 is unchanged and now applies to forms too** (the pin follows what the link names now).
- **Block-hover residual applies to forms too (r3 LOW-3).** The SKILL's "The DOM cross-check (r4, `popoverShows`)" bullet says it does NOT tell two BLOCK previews apart; since SC-596 that holds for a form's hover pin as well (a `^a` preview bound to `^b`'s link, the identical counter carrying `^b`: Save writes it). A real pointer cannot produce it (r3); jest can, so a block-hover jest model must bind the popover to the link of the block it shows.

## 5. G-S96 and the lifecycle part list (SKILL line ~30 and the lifecycle authoring sections)

- Part list: part 6 is `G-S92 G-S96` (2 scenarios; **59/59** in all; 21 + 16 + 9 + 4 + 7 + 2). Measured at SC-596 r4 on `7866426e` (r2 on `5f7c5336`: 185 / 324 / 406 / 298 / 393 / 176 s): part 1 185 s, part 2 323 s, part 3 409 s, part 4 294 s, part 5 390 s, **part 6 175 s** (G-S92 ~105 s + G-S96 ~71 s with the build and start-up). `--only=` takes COMMA-separated ids (`--only=G-S92,G-S96`; a space list names one unknown id and exits 2).
- **G-S96** (SC-596; after G-S92, before G-S56): the Edit FORM of a counter in an embed / hover preview, pressed between an outside write and the redraw it causes (the pencil is clicked by a script in the SAME page task as `await vault.process(...)`; a real press lands in that 36-114 ms window only by chance), with the SOURCE note also open in a second pane: the form is then KEPT OPEN past its card (SC-552 `keepFormOpenOn` needs only the note shown in some markdown leaf; without the pane the form closes 49-98 ms after open and nothing can be saved - the vacuous control cell). Eight cells: block embed RV (control, no pane), block embed RV and LP, heading embed RV of two `## Tracker` sections (A under the FIRST), block hover RV and LP, heading hover RV and LP (section followed by `## After`). Green: nothing written (the note is what the outside edit left), exactly one "changed on disk first" Notice, the form still open after Save, the outside edit (9) kept. **Red on `5f7c5336`: 7 of 7 pane cells wrote the twin with no Notice** (`sc596-r2-lifecycle-gs96-on-base.log`). Footguns: a hover fixture whose tracker section is the LAST of the note refuses at base (its part carries trailing `END`, which the twin's body does not): follow it with `## After`; the cell cancels / Escapes any form left open (a refused Save keeps the form open and a kept-open form outlives its card); one note per cell.
- G-S64 `(zh)` now expects the hover form to LAND in the linked block (see section 1).

## 6. CURRENT block draft

**CURRENT — dse `develop` @ `<sha after landing>` (SC-596 landed on `c6077860` on `7866426e` (SC-606, montage model only); a block edit form opened from an embed or hover preview of PART of a note (`![[note#^id]]`, `![[note#Heading]]`, a hover of a block or heading link) is placed exactly like a card's + / - (SC-594 `rebaseCardPin`: the link checked by `cardLinkLine`, else the host's own last write, else refused), never by a text search (`rebasePin`, `verifiedPinLine`, `embedStartLine`, `searchedPinLine` deleted), and a form or a card write that cannot be pinned at all gets a REFUSING pin (nothing written, one Notice: "the block changed on disk first" when a pin exists and nothing places it, "the plugin can't tell where this block sits" for a refusing pin or a list shape) instead of no pin; live bug closed: with the source note also open in a second pane the form stays open past its card and Save wrote the identical twin with no Notice (7 of 7 pane cells at `5f7c5336`); shapes that saved now refuse (heading link of a note with two identical sections, nested same-name headings, a stale callout or a vanished section even with no twin, a lagging cache); a block or heading hover with an identical twin and no edit now saves where it refused; known residuals: SC-607 and the block-hover popover residual now apply to forms; no CSS change; new lifecycle scenario G-S96 (59 scenarios, part 6 `G-S92 G-S96`); G-S64 (zh) re-targeted; filed none):**
tsc and lint clean · jest **10624 passed / 2 skipped** (7707 + 2917 new: `reading-mode-host-form-pin.test.ts`, 2880 sweep cells + 29 named + 8 card/non-embedded controls) · lifecycle **59/59** (six `--only` parts 21 + 16 + 9 + 4 + 7 + 2; 185 / 323 / 409 / 294 / 390 / 175 s) · e2e **`OBSIDIAN-E2E done: 278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`** (known bugs SC-257, SC-355, SC-384, SC-580) · `styles.css` `5e5ff488…dc2b27`, byte-identical to a clean `7866426e` build, so shots **592** / host-leak 163/978 / modal host-leak 39/234 / capture clip 147, freeze **280/280** and parity **0 / 0 / 24** carry (not re-run). Numbers as measured by the SC-596 implementer on the rebased branch (r4); r3 review LAND with three LOWs, all folded.
