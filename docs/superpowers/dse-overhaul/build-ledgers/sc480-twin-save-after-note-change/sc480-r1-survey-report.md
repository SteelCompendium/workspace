# SC-480 r1 survey: card writes that land in an identical twin (measured at dse f69b8fd6)

## Executive summary
- **Race case (click, edit moves the block, leave within ms): FIXED at f69b8fd6.** 40/40 twin trials and 20/20 controls correct (RV+LP, twin above/below, 2 and 3 identical blocks, N=5), plus 24/24 "stay" and 24/24 second-click trials. SC-552's per-round card pin does it: a no-pin discriminator build misroutes 12/12 Reading view twin trials (Live Preview lands even without the pin).
- **Deleted-block case: STILL MISROUTES, 100%.** 40/40 leave + 12/12 stay twin trials (and 12/12 callout-twin trials) write the +1 into a surviving twin with 0 Notices; the twin-free control gives exactly 1 Notice and leaves the file untouched (20/20). The pin misses correctly; the write then falls back to `resolveWriteTarget`, which lands in the twin by BOTH routes: the body search (RV always on "leave"; twin-above in LP) and the element's section (LP twin-below; RV twin-below on "stay").
- **Recommend option E:** a card write whose pin misses falls back to today's placement only when no other block (in the note as clicked, or as it is now) holds the same body; otherwise nothing is written and the existing "changed on disk first" Notice shows. One file, ~21 lines; fixes every twin cell (E at N=5: 40/40 deleted-twin trials refused with 1 Notice, 60/60 race trials still land).
- **E's measured cost:** only a twin note with >400 lines changed on both sides of the block during the 400 ms window (`long-twin`, 12/12 refused, was 12/12 OK). Every twin-free cost probe still saves (long >400-edit note, heading embed, embed with a twin, callout, unterminated fence, CRLF, moved block).
- Option A (refuse an ambiguous search) fixes only 3 of 12 deleted-twin cells (k=3 via search; never k=2, never the section route, no callout cell). Option B (pinned card writes pin-only) and C (B + refuse unpinned) fix every twin cell but also refuse a twin-FREE note after a >400-line outside edit (12/12, was 12/12 OK). Pinned form Saves behave the same under every option (still pin-only, SC-556).
- Notice: the existing text fits ("Draw Steel Elements: a change to a block in <note> was not saved — the block changed on disk first."); a deletion is a change on disk.

Measured in real Obsidian 1.15.1 (lifecycle harness, own Xvfb, OS-assigned CDP port) with a private copy of `visual-harness/obsidian-lifecycle.mjs` plus injected probe scenarios (nothing written into the repo). Load 2-26 during runs; every cell was unanimous across its trials. dse HEAD f69b8fd6 = origin/develop at survey time (fetched, unchanged).

## How the probes work
- Counter blocks (`ds-counter`, body `name: Twin / current_value: 5 / max_value: 20 / min_value: 0`). The clicked block is X. "k" = number of identical blocks INCLUDING X (k=2: one twin, k=3: two twins); k=1 = control (the neighbour has another body, `Other`, 3). Twins are separated by prose (TOP / M1 / GAP / BOTTOM), never only blank lines (SC-556 footgun).
- Race: twin ABOVE = 10 paragraphs inserted between the twin(s) and X (X moves down 20 lines); twin BELOW = 10 paragraphs above X deleted (X moves up 20 lines, past the stale line toward the twin).
- Deleted: X and its blank separator removed; twin(s) above or below.
- Trial: fresh note per trial (so the 5 s card-Notice rate limit never hides a Notice), open in Reading view (RV) or Live Preview (LP, cursor on line 0), wait for the cards, click X's "+" (`button.click()`), immediately apply the outside edit with `app.vault.process`, then either "leave" (30 ms later open another note: the unload flush) or "stay" (wait 2.5 s: the 400 ms debounce flush). "second" = click, wait 1.5 s (first write lands, redraw), click again, edit, leave.
- Read the file from disk 1.5 s later; values in document order. Notices counted from Obsidian's DOM (only DSE's "changed on disk first" / "can't tell where" Notices; Obsidian's "Indexing complete." is excluded).
- Path column: a page-side wrapper on `ReadingModeBlockHost.prototype` (`replaceSource`, `pinnedTarget`, `resolveWriteTarget`; minified names survive) logs whether the write carried a pin, whether the pin placed, and whether `resolveWriteTarget` used the element's section, the body search, or missed. Wrapping changes nothing it calls.
- Outcome: OK = values equal the expected values; TWIN = another block got the +1; REFUSED = nothing written (the edited note), with a Notice.

## Q1. Does each ticket case still misroute at f69b8fd6?

Baseline f69b8fd6. Notices column: `1x5` = 5 trials with 1 DSE Notice each. Path = pin placed (`pin->ok`) or missed, then `resolveWriteTarget`'s route (`section` / `search` / `miss`). Rows ending `-stay` / `-second` are the extra variants at N=3. (In the cross-option tables further down, `OK3 [5] N3` = 3 trials OK, final values, 3 DSE Notices in total.)

| cell | n | outcome | values (expected) | Notices | path |
|---|---|---|---|---|---|
| race-above-k2-RV-leave | 5 | OK 5 | [5, 6] ([5, 6]) | 0x5 | pin->ok 5 |
| race-above-k3-RV-leave | 5 | OK 5 | [5, 5, 6] ([5, 5, 6]) | 0x5 | pin->ok 5 |
| race-below-k2-RV-leave | 5 | OK 5 | [6, 5] ([6, 5]) | 0x5 | pin->ok 5 |
| race-below-k3-RV-leave | 5 | OK 5 | [6, 5, 5] ([6, 5, 5]) | 0x5 | pin->ok 5 |
| race-above-k1-RV-leave | 5 | OK 5 | [3, 6] ([3, 6]) | 0x5 | pin->ok 5 |
| race-below-k1-RV-leave | 5 | OK 5 | [6, 3] ([6, 3]) | 0x5 | pin->ok 5 |
| race-above-k2-LP-leave | 5 | OK 5 | [5, 6] ([5, 6]) | 0x5 | pin->ok 5 |
| race-above-k3-LP-leave | 5 | OK 5 | [5, 5, 6] ([5, 5, 6]) | 0x5 | pin->ok 5 |
| race-below-k2-LP-leave | 5 | OK 5 | [6, 5] ([6, 5]) | 0x5 | pin->ok 5 |
| race-below-k3-LP-leave | 5 | OK 5 | [6, 5, 5] ([6, 5, 5]) | 0x5 | pin->ok 5 |
| race-above-k1-LP-leave | 5 | OK 5 | [3, 6] ([3, 6]) | 0x5 | pin->ok 5 |
| race-below-k1-LP-leave | 5 | OK 5 | [6, 3] ([6, 3]) | 0x5 | pin->ok 5 |
| del-above-k2-RV-leave | 5 | MISROUTED 5 | [6] ([5]) | 0x5 | pin->miss>search 5 |
| del-above-k3-RV-leave | 5 | MISROUTED 5 | [5, 6] ([5, 5]) | 0x5 | pin->miss>search 5 |
| del-below-k2-RV-leave | 5 | MISROUTED 5 | [6] ([5]) | 0x5 | pin->miss>search 5 |
| del-below-k3-RV-leave | 5 | MISROUTED 5 | [6, 5] ([5, 5]) | 0x5 | pin->miss>search 5 |
| del-above-k1-RV-leave | 5 | OK 5 | [3] ([3]) | 1x5 | pin->miss>miss 5 |
| del-below-k1-RV-leave | 5 | OK 5 | [3] ([3]) | 1x5 | pin->miss>miss 5 |
| del-above-k2-LP-leave | 5 | MISROUTED 5 | [6] ([5]) | 0x5 | pin->miss>search 5 |
| del-above-k3-LP-leave | 5 | MISROUTED 5 | [5, 6] ([5, 5]) | 0x5 | pin->miss>search 5 |
| del-below-k2-LP-leave | 5 | MISROUTED 5 | [6] ([5]) | 0x5 | pin->miss>section 5 |
| del-below-k3-LP-leave | 5 | MISROUTED 5 | [6, 5] ([5, 5]) | 0x5 | pin->miss>section 5 |
| del-above-k1-LP-leave | 5 | OK 5 | [3] ([3]) | 1x5 | pin->miss>miss 5 |
| del-below-k1-LP-leave | 5 | OK 5 | [3] ([3]) | 1x5 | pin->miss>miss 5 |
| race-above-k2-RV-stay | 3 | OK 3 | [5, 6] ([5, 6]) | 0x3 | pin->ok 3 |
| race-below-k2-RV-stay | 3 | OK 3 | [6, 5] ([6, 5]) | 0x3 | pin->ok 3 |
| race-above-k1-RV-stay | 3 | OK 3 | [3, 6] ([3, 6]) | 0x3 | pin->ok 3 |
| race-below-k1-RV-stay | 3 | OK 3 | [6, 3] ([6, 3]) | 0x3 | pin->ok 3 |
| del-above-k2-RV-stay | 3 | MISROUTED 3 | [6] ([5]) | 0x3 | pin->miss>search 3 |
| del-below-k2-RV-stay | 3 | MISROUTED 3 | [6] ([5]) | 0x3 | pin->miss>section 3 |
| del-above-k1-RV-stay | 3 | OK 3 | [3] ([3]) | 1x3 | pin->miss>miss 3 |
| del-below-k1-RV-stay | 3 | OK 3 | [3] ([3]) | 1x3 | pin->miss>miss 3 |
| race-above-k2-LP-stay | 3 | OK 3 | [5, 6] ([5, 6]) | 0x3 | pin->ok 3 |
| race-below-k2-LP-stay | 3 | OK 3 | [6, 5] ([6, 5]) | 0x3 | pin->ok 3 |
| race-above-k1-LP-stay | 3 | OK 3 | [3, 6] ([3, 6]) | 0x3 | pin->ok 3 |
| race-below-k1-LP-stay | 3 | OK 3 | [6, 3] ([6, 3]) | 0x3 | pin->ok 3 |
| del-above-k2-LP-stay | 3 | MISROUTED 3 | [6] ([5]) | 0x3 | pin->miss>search 3 |
| del-below-k2-LP-stay | 3 | MISROUTED 3 | [6] ([5]) | 0x3 | pin->miss>section 3 |
| del-above-k1-LP-stay | 3 | OK 3 | [3] ([3]) | 1x3 | pin->miss>miss 3 |
| del-below-k1-LP-stay | 3 | OK 3 | [3] ([3]) | 1x3 | pin->miss>miss 3 |
| race-above-k2-RV-second | 3 | OK 3 | [5, 7] ([5, 7]) | 0x3 | pin->ok 3 |
| race-below-k2-RV-second | 3 | OK 3 | [7, 5] ([7, 5]) | 0x3 | pin->ok 3 |
| race-above-k1-RV-second | 3 | OK 3 | [3, 7] ([3, 7]) | 0x3 | pin->ok 3 |
| race-below-k1-RV-second | 3 | OK 3 | [7, 3] ([7, 3]) | 0x3 | pin->ok 3 |
| race-above-k2-LP-second | 3 | OK 3 | [5, 7] ([5, 7]) | 0x3 | pin->ok 3 |
| race-below-k2-LP-second | 3 | OK 3 | [7, 5] ([7, 5]) | 0x3 | pin->ok 3 |
| race-above-k1-LP-second | 3 | OK 3 | [3, 7] ([3, 7]) | 0x3 | pin->ok 3 |
| race-below-k1-LP-second | 3 | OK 3 | [7, 3] ([7, 3]) | 0x3 | pin->ok 3 |

Discriminator (proves the probe catches the original race): the same race matrix with card pins switched off (`sc480-r1-discriminator-nopin.patch`, N=3): RV twin cells 12/12 TWIN (e.g. `race-above-k2` [6,5]), RV controls 6/6 OK; LP 18/18 OK (Live Preview places the write through the element's fresh section even without a pin). So the race is fixed at f69b8fd6 by SC-552's card pin, in Reading view.

Verdict per case: **race: fixed** (all 4 twin shapes x 2 modes x leave/stay/second). **Deleted block: misroutes** in every twin shape and mode (40/40 leave, 12/12 stay, 12/12 callout twins), silently; controls behave as specified (exactly one Notice, file untouched).

## Q2. Write-path map (f69b8fd6; all paths `src/framework/...`)

Card write (a control click), in order:
1. `view.ts:264-283` `persist()`: calls `host.notePersistIntent?.()` (view.ts:269) on EVERY persist call, then (re)arms the 400 ms debounce (`PERSIST_DEBOUNCE_MS`, view.ts:23).
2. `host/ReadingModeBlockHost.ts:672-680` `notePersistIntent()`: `pin = this.pinPosition()`; `if (pin && !this.pendingPin) this.pendingPin = pin` (:679). So the pin is taken at the FIRST intent of a debounce round and not refreshed by later clicks of that round (deliberate, SC-552: later clicks may come after a redraw).
3. `ReadingModeBlockHost.ts:780-793` `pinPosition()`: null when `readSection()` is null or `ownFence` is null (no section; a quote/callout window where `locateInSection` is ambiguous). Inside `.markdown-embed/.internal-embed` of a PART (`src` with `#`, or no `src`), the pin is added to `partialPins` (:789) and rebased asynchronously (`rebasePin`, :810).
4. Flush: the debounce timer, or the unload flush `view.ts:110` (`this.register(() => this.flushPersist())`) when the view is released (navigate-away / leaf close / section thrown away: `ReadingModeBlockHost.onRenderChildUnload` :505 -> `viewRegistry.ts:238 release()` -> `removeChild(view)`), or `ViewRegistry.flushPendingWrites` (viewRegistry.ts:110, called from ReadingModeBlockHost.ts:958 before ANY write of the same note, SC-544), or `settlePendingWrite` (view.ts:310, before a form opens). All call `flushPersist()` (view.ts:350) -> `host.replaceSource(yaml, { fromView: true })` (view.ts:383).
5. `ReadingModeBlockHost.ts:935-1060` `replaceSource()`:
   - :937 awaits `pinRebased` ONLY for `options.pin` (a form's pin). A card's `pendingPin` is NOT awaited: a card write that flushes before its embed rebase finished sees a still-partial pin.
   - :939-940 card write: `pin = this.pendingPin`; `this.pendingPin = null` (consumed by every `fromView` write, placed or not).
   - :963 `section = this.readSection()` (the element's section NOW: may be a twin's after an element hand-off).
   - :991 `pinned = pin ? this.pinnedTarget(content, pin) : null`.
   - :993 `target = pinned ?? (pin && options.pinOnly ? 'miss' : this.resolveWriteTarget(content, section))`  <-- THE twin fallback for cards. A card never passes `pinOnly`, so every pin miss reaches resolveWriteTarget.
6. `ReadingModeBlockHost.ts:925-933` `pinnedTarget()`: null when the pin is partial (:926), `mapLine` (host/lineMap.ts:28) returns null (line changed/deleted, or > `LINE_MAP_MAX_EDITS` = 400 edits, lineMap.ts:18), no fence of the language opens at the mapped line, or its body != knownBody.
7. `ReadingModeBlockHost.ts:1072-1136` `resolveWriteTarget()`: (a) SECTION path :1076-1128 - writes at the element's current section when the body there equals knownBody (also `locateInSection` for quote/callout windows); (b) SEARCH path :1130-1135 - `locateByBody(content, knownLanguage, knownBody, knownLineStart)` (:170-213) picks the NEAREST equal body; 'ambiguous' only when `nearLine === null` (:212). (a) and (b) both land in a twin (measured, deleted-twin cells: RV "leave" took (b) 20/20; RV "stay" twin-below took (a) 3/3; LP took (a) for twin-below 13/13 and (b) for twin-above 13/13).

Form Save: `authoring/FormModal.ts:133` pins at construction; `FormModal.ts:543-545` `replaceSource(body, { pin, pinOnly: true })` -> :993 gives 'miss' on any pin miss: forms with a pin can NOT reach resolveWriteTarget. A form whose `pinPosition()` was null (no section / ambiguous callout window) calls `replaceSource(body)` without a pin (:545) and DOES reach resolveWriteTarget (section path, then search). That is the only form path to the body search; it is not reached by any probe here.

Answers:
- When is a card write pinned? Every debounce ROUND, at its first click (pin taken at the first `persist()` of the round, consumed by the round's write). A second click AFTER the first round's write is a new round and is pinned again (measured: `race ... second` cells, pinAtClick2 non-null every trial).
- When does it fall back? Whenever `pinnedTarget` returns null: block deleted or its pinned line edited, >400-edit outside change around it, partial embed pin not rebased (or rebase not finished), or the body at the mapped line differs from knownBody. Also when there is no pin at all (pinPosition null at the first click).
- Unpinned card writes: only when `pinPosition()` was null at the round's first intent. Measured: 0 of 1041 card writes across every run carried no pin.

## Q3. Design options

Every prototype changes only `src/framework/host/ReadingModeBlockHost.ts`; each was applied to f69b8fd6, type-checked (`tsc --noEmit` clean for all), run against the 16 write-path jest suites (`reading-mode-host*`, `twin-reuse`, `view-adoption`, `formSave*`, `element-view`, `formModal*`, `view-registry`, `counter`: 571 tests; unpatched f69b8fd6: 16/16 suites, 571/571 passed, bundles/base-jest/jest.log), built, probed in real Obsidian, and reverted. Q1 cells per option at N=3 (E also at N=5), cost probes N=3 per cell.

| | rule (one sentence) | size | deleted-twin cells fixed (12 Q1 cells: 8 leave + 4 stay; plus 4 callout cells) | newly refused (measured) | jest suites broken |
|---|---|---|---|---|---|
| **A** | A search by body refuses (dropped-write Notice) when more than one block of the language holds the body. | 1 file, +4/-2 (`locateByBody` :212, `resolveWriteTarget` :1132) | 3 of 12: k=3 via search (`del-above-k3` RV+LP, `del-below-k3` RV). NOT k=2 (one twin left, the search finds exactly one), NOT the section route (LP twin-below, RV/LP stay twin-below), NOT callout twins. | `long-twin` RV leave 3/3 (search ambiguous); the stay / LP variants still land through the section path. | 4 tests / 3 suites (`locateByBody` nearest-twin unit test, the SC-343 "writes the twin nearest" test, the SC-457 spaced/unspaced twin test, the SC-556 "card write falls back" test). |
| **B** | A pinned write (card round or form Save) goes to its pin or nowhere; only an unpinned write uses `resolveWriteTarget`. | 1 file, +2/-1 (:993) | 12 of 12 + callout 4/4. | **Twin-free** `long` (>400 lines changed on both sides): 12/12 refused (RV+LP, leave+stay), was 12/12 OK. `long-twin` 12/12 refused. | 2 tests / 1 suite (`reading-mode-host-pin`: "a pin that cannot be placed falls back to the element's section", "SC-556: the view's own write is not pin-only"). |
| **C** | B, and a card write that carries no pin (its block had no section at the round's first click) is refused too. | 1 file, +2/-1 (:993) | 8 of 8 leave cells measured (24/24 trials); stay/callout not run (identical code path to B whenever a pin exists). | Same as B on every probe (all 1041 card writes across every run carried a pin, so C differs from B only on a path no probe reached). Unit tests show what that path is: any `fromView` write with no prior `notePersistIntent`. | 6 tests / 3 suites (B's 2, plus 2 SC-340 claim-ticket tests and 1 SC-556 rate-limit test that write without an intent, plus "the write uses the pin up"). |
| **E** | A card write whose pin misses falls back to today's placement only when the block's body is unique both in the note as it was clicked (`pin.text`) and in the note now; otherwise nothing is written (dropped-write Notice). | 1 file, +21/-1 (`countByBody` helper next to `locateByBody`; the condition at :993) | 12 of 12 + callout 4/4 (E at N=5: 40/40 leave deleted-twin trials refused with exactly 1 Notice; 60/60 race trials OK). | `long-twin` only: 12/12 refused (RV+LP, leave+stay), was 12/12 OK. Every twin-free probe still saves. | Same 2 tests as B (both assert a card write lands in a twin note after a pin miss: the behaviour SC-480 removes). |

Notes on the options:
- **Unpinned card writes (the brief's B question).** At f69b8fd6 a card write is pinned every ROUND (first click of each debounce window), and a second click after the first write is a new round with its own pin (24/24 `second` trials pinned and correct). Unpinned card writes happen only when `pinPosition()` is null at the round's first click (no section; a callout window whose twins `locateInSection` cannot tell apart). Observed: 0 of 1041. B and E leave that path as today (section, then nearest search). The no-pin discriminator shows what such a write does in RV with twins: 12/12 race trials landed in the twin.
- **C as written in the brief ("pin every card write, not just the first click")** is already true per round; re-pinning on every click inside a round would undo SC-552's reason for pinning only the first (a later click can come after the redraw that handed the element to a twin). So the C prototyped here is the only remaining delta: refuse the unpinned card write.
- **Why A cannot work alone:** after a deletion with one twin left, the body is unique again, so a uniqueness test on the note NOW cannot tell "my block moved" from "my block was deleted and its twin survives". E also counts the note AS CLICKED (`pin.text`), where the twin was already present. And A never touches the section route, which LP takes for a twin below.
- **Why not B:** B refuses a twin-FREE note's card write after a >400-line outside edit around the block (12/12; it saves today and has no twin it could land in). E keeps it (12/12 OK) because a twin-free body falls back exactly as today.
- **Form Saves:** unchanged by every option (still `pinOnly`, SC-556 ruling intact). A/E only narrow the fallback; B/C make cards as strict as forms.
- **Residual exposure under E:** (1) unpinned card writes (0 observed); (2) a pin miss whose fallback is legitimate but the body is twinned is refused (long-twin) - "save nothing with a notice" shape, no data written anywhere wrong; (3) `countByBody` counts closed fences (quoted ones included, via `listFences`) and the note's trailing unterminated fence, same scope as `locateByBody`.
- **E implementation notes for the fixer:** compute the counts only when `pinnedTarget` returned null (the prototype computes them for every write); update the two jest tests above (they encode the twin fallback) and add host tests: deleted twin above/below -> 'miss' + Notice; twin-free long (>400 edits) -> lands; twin long -> refused; a card write with no pin -> today's path. Real-Obsidian gate: a G-S73 lifecycle scenario for the deleted-twin case (RV + LP, twin above and below; the probes above are a ready template).

Cost probes (N=3 per cell; `REFUSED3 [5] N3` = 3 trials, nothing written, 3 Notices in total). `unterm-LP-*`: Obsidian's Live Preview does not draw a note's unterminated trailing fence as a card (nothing to click; same for every bundle), so the unterminated case is measured in RV only. `long` = 110 changed lines above + 110 below a twin-free block (440 edits > `LINE_MAP_MAX_EDITS`); `long-twin` = the same with an identical block just above it (one prose line between); `emb` = the block clicked inside `![[src#Sec]]` on another note; `emb-twin` = the same with an identical block under another heading of src, above the section; `callout-del-twin` = two identical callouts, the clicked one deleted; `del-solo` = twin-free deletion; `twin-preshift` = G-S7b shape (the edit lands and redraws BEFORE the click, then leave).

### Cost probes across options

| cell | expected | base | A | B | C | E |
|---|---|---|---|---|---|---|
| long-RV-leave | [6] | OK3 [6] N0 | OK3 [6] N0 | REFUSED3 [5] N3 | REFUSED3 [5] N3 | OK3 [6] N0 |
| long-RV-stay | [6] | OK3 [6] N0 | OK3 [6] N0 | REFUSED3 [5] N3 | REFUSED3 [5] N3 | OK3 [6] N0 |
| callout-RV-leave | [6] | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 |
| callout-RV-stay | [6] | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 |
| unterm-RV-leave | [6] | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 |
| unterm-RV-stay | [6] | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 |
| crlf-RV-leave | [3,6] | OK3 [3,6] N0 | OK3 [3,6] N0 | OK3 [3,6] N0 | - | OK3 [3,6] N0 |
| crlf-RV-stay | [3,6] | OK3 [3,6] N0 | OK3 [3,6] N0 | OK3 [3,6] N0 | - | OK3 [3,6] N0 |
| moved-RV-leave | [3,6] | OK3 [3,6] N0 | OK3 [3,6] N0 | OK3 [3,6] N0 | OK3 [3,6] N0 | OK3 [3,6] N0 |
| moved-RV-stay | [3,6] | OK3 [3,6] N0 | OK3 [3,6] N0 | OK3 [3,6] N0 | OK3 [3,6] N0 | OK3 [3,6] N0 |
| callout-del-twin-RV-leave | [5] | TWIN3 [6] N0 | TWIN3 [6] N0 | OK3 [5] N3 | - | OK3 [5] N3 |
| callout-del-twin-RV-stay | [5] | TWIN3 [6] N0 | TWIN3 [6] N0 | OK3 [5] N3 | - | OK3 [5] N3 |
| del-solo-RV-leave | [3] | OK3 [3] N3 | OK3 [3] N3 | OK3 [3] N3 | - | OK3 [3] N3 |
| del-solo-RV-stay | [3] | OK3 [3] N3 | OK3 [3] N3 | OK3 [3] N3 | - | OK3 [3] N3 |
| twin-upper-RV-stay | [6,5] | OK3 [6,5] N0 | OK3 [6,5] N0 | OK3 [6,5] N0 | - | OK3 [6,5] N0 |
| twin-lower-RV-stay | [5,6] | OK3 [5,6] N0 | OK3 [5,6] N0 | OK3 [5,6] N0 | - | OK3 [5,6] N0 |
| twin-preshift-RV-leave | [5,6] | OK3 [5,6] N0 | OK3 [5,6] N0 | OK3 [5,6] N0 | - | OK3 [5,6] N0 |
| emb-RV-stay | [6] | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 |
| emb-RV-leave | [6] | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 |
| emb-twin-RV-stay | [5,6] | OK3 [5,6] N0 | OK3 [5,6] N0 | OK3 [5,6] N0 | - | OK3 [5,6] N0 |
| emb-twin-RV-leave | [5,6] | OK3 [5,6] N0 | OK3 [5,6] N0 | OK3 [5,6] N0 | - | OK3 [5,6] N0 |
| long-LP-leave | [6] | OK3 [6] N0 | OK3 [6] N0 | REFUSED3 [5] N3 | REFUSED3 [5] N3 | OK3 [6] N0 |
| long-LP-stay | [6] | OK3 [6] N0 | OK3 [6] N0 | REFUSED3 [5] N3 | REFUSED3 [5] N3 | OK3 [6] N0 |
| long-twin-LP-leave | [5,6] | OK3 [5,6] N0 | OK3 [5,6] N0 | REFUSED3 [5,5] N3 | - | REFUSED3 [5,5] N3 |
| long-twin-LP-stay | [5,6] | OK3 [5,6] N0 | OK3 [5,6] N0 | REFUSED3 [5,5] N3 | - | REFUSED3 [5,5] N3 |
| callout-LP-leave | [6] | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 |
| callout-LP-stay | [6] | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 |
| unterm-LP-leave | null | HARNESS-ERROR3 null N0 | - | - | HARNESS-ERROR3 null N0 | - |
| unterm-LP-stay | null | HARNESS-ERROR3 null N0 | - | - | HARNESS-ERROR3 null N0 | - |
| crlf-LP-leave | [3,6] | OK3 [3,6] N0 | OK3 [3,6] N0 | OK3 [3,6] N0 | - | OK3 [3,6] N0 |
| crlf-LP-stay | [3,6] | OK3 [3,6] N0 | OK3 [3,6] N0 | OK3 [3,6] N0 | - | OK3 [3,6] N0 |
| moved-LP-leave | [3,6] | OK3 [3,6] N0 | OK3 [3,6] N0 | OK3 [3,6] N0 | OK3 [3,6] N0 | OK3 [3,6] N0 |
| moved-LP-stay | [3,6] | OK3 [3,6] N0 | OK3 [3,6] N0 | OK3 [3,6] N0 | OK3 [3,6] N0 | OK3 [3,6] N0 |
| callout-del-twin-LP-leave | [5] | TWIN3 [6] N0 | TWIN3 [6] N0 | OK3 [5] N3 | - | OK3 [5] N3 |
| callout-del-twin-LP-stay | [5] | TWIN3 [6] N0 | TWIN3 [6] N0 | OK3 [5] N3 | - | OK3 [5] N3 |
| del-solo-LP-leave | [3] | OK3 [3] N3 | OK3 [3] N3 | OK3 [3] N3 | - | OK3 [3] N3 |
| del-solo-LP-stay | [3] | OK3 [3] N3 | OK3 [3] N3 | OK3 [3] N3 | - | OK3 [3] N3 |
| twin-upper-LP-stay | [6,5] | OK3 [6,5] N0 | OK3 [6,5] N0 | OK3 [6,5] N0 | - | OK3 [6,5] N0 |
| twin-lower-LP-stay | [5,6] | OK3 [5,6] N0 | OK3 [5,6] N0 | OK3 [5,6] N0 | - | OK3 [5,6] N0 |
| twin-preshift-LP-leave | [5,6] | OK3 [5,6] N0 | OK3 [5,6] N0 | OK3 [5,6] N0 | - | OK3 [5,6] N0 |
| emb-LP-stay | [6] | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 |
| emb-LP-leave | [6] | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 | OK3 [6] N0 |
| emb-twin-LP-stay | [5,6] | OK3 [5,6] N0 | OK3 [5,6] N0 | OK3 [5,6] N0 | - | OK3 [5,6] N0 |
| emb-twin-LP-leave | [5,6] | OK3 [5,6] N0 | OK3 [5,6] N0 | OK3 [5,6] N0 | - | OK3 [5,6] N0 |
| long-twin-RV-leave | [5,6] | OK3 [5,6] N0 | REFUSED3 [5,5] N3 | REFUSED3 [5,5] N3 | - | REFUSED3 [5,5] N3 |
| long-twin-RV-stay | [5,6] | OK3 [5,6] N0 | OK3 [5,6] N0 | REFUSED3 [5,5] N3 | - | REFUSED3 [5,5] N3 |

### Q1 cells across options (N=3 unless the base column says 5; `-` = not run for that option)

| cell | expected | base | A | B | C | E | nopin |
|---|---|---|---|---|---|---|---|
| race-above-k2-RV-leave | [5,6] | OK5 [5,6] N0 | - | - | - | - | TWIN3 [6,5] N0 |
| race-above-k3-RV-leave | [5,5,6] | OK5 [5,5,6] N0 | - | - | - | - | TWIN3 [5,6,5] N0 |
| race-below-k2-RV-leave | [6,5] | OK5 [6,5] N0 | - | - | - | - | TWIN3 [5,6] N0 |
| race-below-k3-RV-leave | [6,5,5] | OK5 [6,5,5] N0 | - | - | - | - | TWIN3 [5,5,6] N0 |
| race-above-k1-RV-leave | [3,6] | OK5 [3,6] N0 | - | - | - | - | OK3 [3,6] N0 |
| race-below-k1-RV-leave | [6,3] | OK5 [6,3] N0 | - | - | - | - | OK3 [6,3] N0 |
| race-above-k2-LP-leave | [5,6] | OK5 [5,6] N0 | - | - | - | - | OK3 [5,6] N0 |
| race-above-k3-LP-leave | [5,5,6] | OK5 [5,5,6] N0 | - | - | - | - | OK3 [5,5,6] N0 |
| race-below-k2-LP-leave | [6,5] | OK5 [6,5] N0 | - | - | - | - | OK3 [6,5] N0 |
| race-below-k3-LP-leave | [6,5,5] | OK5 [6,5,5] N0 | - | - | - | - | OK3 [6,5,5] N0 |
| race-above-k1-LP-leave | [3,6] | OK5 [3,6] N0 | - | - | - | - | OK3 [3,6] N0 |
| race-below-k1-LP-leave | [6,3] | OK5 [6,3] N0 | - | - | - | - | OK3 [6,3] N0 |
| del-above-k2-RV-leave | [5] | TWIN5 [6] N0 | TWIN3 [6] N0 | OK3 [5] N3 | OK3 [5] N3 | OK3 [5] N3 | - |
| del-above-k3-RV-leave | [5,5] | TWIN5 [5,6] N0 | OK3 [5,5] N3 | OK3 [5,5] N3 | OK3 [5,5] N3 | OK3 [5,5] N3 | - |
| del-below-k2-RV-leave | [5] | TWIN5 [6] N0 | TWIN3 [6] N0 | OK3 [5] N3 | OK3 [5] N3 | OK3 [5] N3 | - |
| del-below-k3-RV-leave | [5,5] | TWIN5 [6,5] N0 | OK3 [5,5] N3 | OK3 [5,5] N3 | OK3 [5,5] N3 | OK3 [5,5] N3 | - |
| del-above-k1-RV-leave | [3] | OK5 [3] N5 | OK3 [3] N3 | OK3 [3] N3 | OK3 [3] N3 | OK3 [3] N3 | - |
| del-below-k1-RV-leave | [3] | OK5 [3] N5 | OK3 [3] N3 | OK3 [3] N3 | OK3 [3] N3 | OK3 [3] N3 | - |
| del-above-k2-LP-leave | [5] | TWIN5 [6] N0 | TWIN3 [6] N0 | OK3 [5] N3 | OK3 [5] N3 | OK3 [5] N3 | - |
| del-above-k3-LP-leave | [5,5] | TWIN5 [5,6] N0 | OK3 [5,5] N3 | OK3 [5,5] N3 | OK3 [5,5] N3 | OK3 [5,5] N3 | - |
| del-below-k2-LP-leave | [5] | TWIN5 [6] N0 | TWIN3 [6] N0 | OK3 [5] N3 | OK3 [5] N3 | OK3 [5] N3 | - |
| del-below-k3-LP-leave | [5,5] | TWIN5 [6,5] N0 | TWIN3 [6,5] N0 | OK3 [5,5] N3 | OK3 [5,5] N3 | OK3 [5,5] N3 | - |
| del-above-k1-LP-leave | [3] | OK5 [3] N5 | OK3 [3] N3 | OK3 [3] N3 | OK3 [3] N3 | OK3 [3] N3 | - |
| del-below-k1-LP-leave | [3] | OK5 [3] N5 | OK3 [3] N3 | OK3 [3] N3 | OK3 [3] N3 | OK3 [3] N3 | - |
| race-above-k2-RV-stay | [5,6] | OK3 [5,6] N0 | OK3 [5,6] N0 | OK3 [5,6] N0 | - | OK3 [5,6] N0 | - |
| race-below-k2-RV-stay | [6,5] | OK3 [6,5] N0 | OK3 [6,5] N0 | OK3 [6,5] N0 | - | OK3 [6,5] N0 | - |
| race-above-k1-RV-stay | [3,6] | OK3 [3,6] N0 | OK3 [3,6] N0 | OK3 [3,6] N0 | - | OK3 [3,6] N0 | - |
| race-below-k1-RV-stay | [6,3] | OK3 [6,3] N0 | OK3 [6,3] N0 | OK3 [6,3] N0 | - | OK3 [6,3] N0 | - |
| del-above-k2-RV-stay | [5] | TWIN3 [6] N0 | TWIN3 [6] N0 | OK3 [5] N3 | - | OK3 [5] N3 | - |
| del-below-k2-RV-stay | [5] | TWIN3 [6] N0 | TWIN3 [6] N0 | OK3 [5] N3 | - | OK3 [5] N3 | - |
| del-above-k1-RV-stay | [3] | OK3 [3] N3 | OK3 [3] N3 | OK3 [3] N3 | - | OK3 [3] N3 | - |
| del-below-k1-RV-stay | [3] | OK3 [3] N3 | OK3 [3] N3 | OK3 [3] N3 | - | OK3 [3] N3 | - |
| race-above-k2-LP-stay | [5,6] | OK3 [5,6] N0 | OK3 [5,6] N0 | OK3 [5,6] N0 | - | OK3 [5,6] N0 | - |
| race-below-k2-LP-stay | [6,5] | OK3 [6,5] N0 | OK3 [6,5] N0 | OK3 [6,5] N0 | - | OK3 [6,5] N0 | - |
| race-above-k1-LP-stay | [3,6] | OK3 [3,6] N0 | OK3 [3,6] N0 | OK3 [3,6] N0 | - | OK3 [3,6] N0 | - |
| race-below-k1-LP-stay | [6,3] | OK3 [6,3] N0 | OK3 [6,3] N0 | OK3 [6,3] N0 | - | OK3 [6,3] N0 | - |
| del-above-k2-LP-stay | [5] | TWIN3 [6] N0 | TWIN3 [6] N0 | OK3 [5] N3 | - | OK3 [5] N3 | - |
| del-below-k2-LP-stay | [5] | TWIN3 [6] N0 | TWIN3 [6] N0 | OK3 [5] N3 | - | OK3 [5] N3 | - |
| del-above-k1-LP-stay | [3] | OK3 [3] N3 | OK3 [3] N3 | OK3 [3] N3 | - | OK3 [3] N3 | - |
| del-below-k1-LP-stay | [3] | OK3 [3] N3 | OK3 [3] N3 | OK3 [3] N3 | - | OK3 [3] N3 | - |
| race-above-k2-RV-second | [5,7] | OK3 [5,7] N0 | - | - | - | OK3 [5,7] N0 | - |
| race-below-k2-RV-second | [7,5] | OK3 [7,5] N0 | - | - | - | OK3 [7,5] N0 | - |
| race-above-k1-RV-second | [3,7] | OK3 [3,7] N0 | - | - | - | OK3 [3,7] N0 | - |
| race-below-k1-RV-second | [7,3] | OK3 [7,3] N0 | - | - | - | OK3 [7,3] N0 | - |
| race-above-k2-LP-second | [5,7] | OK3 [5,7] N0 | - | - | - | OK3 [5,7] N0 | - |
| race-below-k2-LP-second | [7,5] | OK3 [7,5] N0 | - | - | - | OK3 [7,5] N0 | - |
| race-above-k1-LP-second | [3,7] | OK3 [3,7] N0 | - | - | - | OK3 [3,7] N0 | - |
| race-below-k1-LP-second | [7,3] | OK3 [7,3] N0 | - | - | - | OK3 [7,3] N0 | - |

E at N=5 (the recommended option, leave variant, all 24 Q1 cells): every race cell OK5 N0; every deleted cell OK5 with exactly 5 Notices (one per trial); file untouched. Table: q1-base-vs-E5.md in the scratch folder.

## Q4. Recommendation: option E

**Rule:** a card write whose pin cannot be placed falls back to today's placement only when no other block in the note (as it was when clicked, or as it is now) holds the same body; otherwise nothing is written and the dropped-write Notice shows. Form Saves stay pin-only (SC-556 unchanged).

Why E:
- It is the only option that fixes every measured twin cell (12/12 deleted-twin Q1 cells, 4/4 callout-twin cells; at N=5, 40/40 deleted-twin trials refused with exactly one Notice, file untouched) without a new refusal in a twin-free note. B and C fix the same cells but refuse a twin-free note's write after a >400-line outside edit (12/12), a write that saves today and has no twin to land in. A fixes 3 of 12.
- It answers the ticket's question with the narrowest yes: "when more than one block matches, refuse" applies only after the pin (the block's position) has failed, and "matches" includes the note as it was clicked, which is what makes the k=2 deletion (one twin left) refusable at all.
- It extends Scott's SC-556 ruling ("Save nothing with a notice is fine") to cards only where the pin is gone and a twin exists, the one situation where today's fallback can put the click into a block the user never touched.
- Its only measured cost (`long-twin`, 12/12: a twin note where more than 400 lines changed on both sides of the block within the 400 ms window) is a refusal with a Notice, never a wrong write.

**Notice text:** the existing one fits, no new string: `Draw Steel Elements: a change to a block in <note> was not saved — the block changed on disk first.` (`droppedWriteMessage`, host/droppedWriteNotice.ts:17; the refusal goes through `target = 'miss'` -> `notifyDroppedWrite`). For the deleted case it is accurate (a deletion is a change on disk). For the `long-twin` case the block itself did not change, the same known inaccuracy SC-556 accepted for form Saves (lineMap.ts:10-17). Card Notices keep the 5 s per-note rate limit (a burst of dropped card writes is one Notice).

Open points for the owner (not blocking):
- Should unpinned card writes (0/1041 observed) also get E's uniqueness test? Cheap, but the only measured case of an unpinned write is the discriminator build, so the cost is unmeasured.
- The two jest tests that E breaks (`reading-mode-host-pin.test.ts` "a pin that cannot be placed falls back to the element's section: no new refusal, the write lands" and "SC-556: the view's own write is not pin-only ...") both assert today's twin fallback in a three-twin note; SC-480 is the decision to stop doing that, so they become refusal tests.

## Evidence (all paths absolute)
- Report: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc480-twin-save-after-note-change/sc480-r1-survey-report.md
- Prototype patches (apply to dse f69b8fd6): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc480-twin-save-after-note-change/sc480-r1-proto-A.patch, sc480-r1-proto-B.patch, sc480-r1-proto-C.patch, sc480-r1-proto-E.patch (same dir)
- Scratch root: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc480-r1-reviewer/
  - probe sources: p480-fixtures.mjs, p480-scenarios.mjs, inject.mjs (builds vh/obsidian-lifecycle.mjs from the repo harness), run.sh, build-bundle.sh, proto.sh
  - discriminator (NOT a design option): sc480-r1-discriminator-nopin.patch
  - per-bundle build/tsc/jest logs: bundles/{base,nopin,A,B,C,E,base-jest}/ ({build,tsc,jest}.log; base has build.log only)
  - per-run lifecycle logs + per-trial JSON (values, Notices, path diagnostics, pin at click): out/base/, out/base-lt/ (long-twin RV, fixture fixed), out/nopin/, out/A/, out/B/, out/C/, out/E/, out/E5/ (E at N=5), out/pilot/ (first calibration, superseded)
  - tables: q1-base.md, q1-all.md, q1-base-vs-E5.md, cost-all.md; generators table.py, q1md.py, compare.py
  - status snapshots: status-before.txt (empty), status-before-ignored.txt (empty)
- Note: the EXTRA run's `second` cells (out/base/P480-EXTRA-*.json) are a probe artifact (the outside edit rewrote X's body with the original key order, so the refusal was correct); superseded by SECOND (out/base/P480-SECOND-*.json), excluded from every table.
- Worktree: dse HEAD f69b8fd6, `git status --porcelain` empty before and after; build artifacts removed. Left behind (ignored): `node_modules/` (npm ci; the fresh worktree had none) and `.devbox/`.
