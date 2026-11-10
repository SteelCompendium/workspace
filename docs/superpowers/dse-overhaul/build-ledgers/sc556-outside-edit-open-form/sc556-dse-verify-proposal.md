# SC-556 dse-verify proposal (for the owner to apply; the SKILL.md was NOT edited)

Final, for dse head `f69b8fd6` on develop `10db67e3`. No new lifecycle id: SC-556 extends SC-552's **G-S64** with phases, so the
scenario count (52) and the five-part `--only` split are unchanged. G-S68 was not needed. G-S56 stays last in SCENARIOS order.

## Row 4 (Lifecycle) text to add to the G-S64 description

> SC-556 (G-S64 phases (v) to (z)). A block edit form's Save is pin-only for EVERY form (it was only for a form kept open
> past its view): when the form's OWN block was edited or deleted from outside while the form is open, Save writes nothing,
> shows exactly one Notice `Draw Steel Elements: a change to a block in <note> was not saved — the block changed on disk
> first.`, the form stays open and the outside change is kept. A form Save's Notice is never rate limited (a second or third
> Save within 5 s shows it again); card writes keep the one-per-note-per-5 s limit.
> - (v) three plain twins with prose between them, Reading view, form on the middle block, its body edited on disk.
> - (w) the same, the middle block deleted in-app (its own note, `Lifecycle/form-strict-triplets.md`). The form's card is not
>   thrown away (it sits on block 2 / block 1 at Save). Checks: note byte-identical after Save, exact Notice text, form open,
>   no component left on the registry.
> - Embeds. A block in an embed of PART of a note is given only that part's text; its pin is rebased onto the whole note by the embed's
>   own link (see footgun 3). (x) HEADING embed `![[gs64-emb-src#Tracker]]` (source note of 1,220 lines with an identical counter above
>   the section), Reading view: Save lands in the embedded block, the twin above and every other byte untouched, no Notice. (y) the same
>   in Live Preview. (xa) / (ya): the + on the card and AT ONCE its pencil (SC-519 writes the + first; the embed has not redrawn, so the
>   section text Obsidian reports is still the old one when the form opens): Save lands, value 6. (xb) a BLOCK embed
>   `![[gs64-embb-src#^gs64blk]]` of the lower of two identical counters in a short note: Save writes the embedded block, not the one
>   above (the other block was written on base: a pre-existing bug).
> - (zh) a HOVER preview of a link to that block (`[[gs64-embb-src#^gs64blk]]`, Ctrl-hover; the card sits under
>   `.popover.hover-popover > .markdown-embed`, which has no `src`): the block's text occurs twice, so nothing can say which block the
>   preview shows, and Save writes NOTHING (the note stays byte for byte as it was, the block above is never written) and shows the one
>   Notice. The preview closes when the pointer leaves it and its form closes with it, so the phase does not assert the form stays open.
>   Before r8 the part's pin was mapped against the whole note and the block ABOVE was written.
> - (z) the embedded block is edited on disk while its form is open: nothing is ever written into the twin; the form closes with its
>   embed's redraw in Reading view (recorded), or stays open and Save shows the one Notice.
> Base (6270e84a): (v), (w) write the edit into the identical block that is left and the form closes; (x), (y) pass on base (long note
> saves) but fail with the r2 head; (xb) and (zh) write the block above on base.

## Footguns to record

1. The dropped-write Notice (`droppedWriteNotice.ts`, `DROPPED_WRITE_NOTICE_INTERVAL_MS`) is shown once per note per 5 s for
   **card (fromView) writes only**. Since r2 a form Save's Notice is forced, so lifecycle phases that expect the Notice from a
   FORM Save need no note of their own. (Phase (w) still has its own fixture; that is harmless.) A phase that expects the
   Notice of a dropped CARD write must use a note of its own, or be more than 5 s after the previous drop on that note.
2. Two identical blocks with identical surroundings (separated only by blank lines): a deletion of one cannot be told from a
   deletion of the other. The line diff trims the common head, so it always reads the LOWER one as deleted: a form on the
   upper block then saves into the surviving block, a form on the lower block is refused. A phase or test about "the form's own
   block was deleted" needs different prose between the twins (the lifecycle fixtures have TOP / M1 / M2 / BOTTOM).
3. Embeds of part of a note (`![[note#Heading]]`, `![[note#^id]]`, a hover preview): Obsidian gives the card only that part's text, line
   numbers from its first line (measured: `{lines: 10, lineStart: 2}`). `ReadingModeBlockHost.pinPosition` rebases the pin (async,
   `rebasePin`) when the card is inside `.internal-embed` / `.markdown-embed`: the embed element's `src` through Obsidian's
   `resolveSubpath` over the metadata cache gives the part's `start.line`, VERIFIED against the note text read (the line must read like
   the first line of the section; a fence of the host's language must open at the pin's line with the known body; for a `^id` subpath
   the first non-blank line after the closing fence must be `^id`), else a text search used only when the part's lines occur exactly
   once. A pin that cannot be placed stays PARTIAL (`partialPins`): `pinnedTarget` refuses it, so Save writes nothing and shows the
   Notice; it is never mapped against the whole note. An embed of a whole note (`src` with no `#`) is not partial. The jest mock
   `resolveSubpath` (`test/mocks/obsidian-core.ts`) works on a cache a test gives (`jest.spyOn(app.metadataCache, 'getFileCache')`).
   The jest mock `Vault.cachedRead` waits a macrotask, so under jest FAKE timers an awaited `cachedRead` never resolves: the rebase is
   gated on the embed ancestor (a plain form must not await it).
4. Fresh worktree: `node_modules` is a symlink to the main checkout's (`ln -s <workspace>/draw-steel-elements/node_modules`).
5. Under machine load above about 11 these time out and are NOT SC-556: e2e RECOV-R07 (SC-517), jest `initiative-default-keys` /
   `twin-reuse` SC-547 (SC-568), and (seen at r4, load 12-40) `chromeFocusHandoff` "SC-505 r3 LOW-A" (wall-clock windows in
   `chrome/focusHandoff.ts`), which passes alone. Lifecycle G-S59 no longer flakes since SC-561.

## CURRENT block (numbers at the final head `f69b8fd6`, on dse origin/develop 10db67e3)

jest (fresh worktree, plain and `--testTimeout=30000`, both clean): 6634 passed / 2 skipped / 258 of 259 suites (a clean 10db67e3 tree in
a scratch copy: 6588 passed / 4 skipped; the branch adds 44 tests); lifecycle 52/52 (parts 21 + 16 + 9 + 4 + 2); e2e
`OBSIDIAN-E2E done: 163/164 ok, 0 failed, 1 known-bug, coverage: 113/113 pairs`; styles.css sha256
`4295ca33cd77d5c337035c332dcf635b82072693fcca44cf760725f0bcb40a01`, byte-identical to a clean 10db67e3 build, so shots / freeze / parity carry
(the SC-558 baseline numbers). Logs: the r8 section of `sc556-r1-impl-report.md`.
