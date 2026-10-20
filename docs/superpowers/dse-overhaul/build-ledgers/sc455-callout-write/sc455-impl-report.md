# SC-455 implementer report (round 1)

**Executive summary**
- STATUS DONE. dse branch `sc455-callout-write`, head `e4f60eb`, rebased onto `origin/develop` = `d58cf6a` (0 conflicts, no package.json change, `node_modules` from `npm ci` earlier). 6 commits: `8c14c95 d17445a efa3e9a 0eade9f 99ad387 e4f60eb`. Not pushed, no tag.
- Ruling implemented: writes go through the blockquote/callout prefix (plain quote, callout, nested to any depth, `>` with/without space, `>` or `> ` empty lines) in Reading view, Live Preview (callouts) and the sidebar (pin stamp + write). One shared helper `host/blockPrefix.ts`; every locate/write site uses it. A write that cannot land now shows a Notice (item 3).
- Gates on head (after the rebase): tsc + lint clean · jest **5024 passed / 1 skipped / 230 of 231** (base 4950; +74) · lifecycle **27/27** (G-S11 new) · e2e `OBSIDIAN-E2E done: 80/85 ok, 0 failed, 5 known-bug, coverage: 51/51 pairs` (base 71/76; +9) · shots 572, 0 FAIL, `pressed toggle parity OK (96 comparisons …)` · freeze `276/276` (no rebaseline) · parity 0 / 0 / 24 declared.
- FAIL-on-base: jest 48 of the 53 new SC-455 tests fail on base src (5 are regression guards that pass by design) + 1 pre-existing test I had to rewrite fails + the new `blockPrefix` suite cannot load (23 tests); e2e callout spec 9/9 FAIL on base (0/9 ok); lifecycle G-S11 FAIL on base.
- Real-Obsidian measurement (1.14.4): Reading view gives the WHOLE callout as the section; Live Preview gives a callout NO section (getSectionInfo null everywhere) so it was read-only; solved via `cm.posAtDOM`. Details below.
- Unsupported shapes: a fence indented inside a list item (no `>`), or indented a few spaces outside a quote: Notice + docs note; exact text below for the Backlog ticket.
- Not done by choice / for the owner: workspace CHANGELOG bullet text below; dse-verify expected numbers (lifecycle 27/27, e2e 80/85, jest 5024) are the owner's/dispatcher's edit.

## Measured `getSectionInfo` behaviour (real Obsidian 1.14.4, scratch vault, scripts in `logs/`)
Probe scripts: `logs/zz-sc455-probe.mjs.txt` + `logs/probe-scenarios.mjs` (lifecycle harness with temporary scenarios; raw outputs `logs/probe-out.log`, `probe-out2.log` are the LAST probe runs only, the earlier tables are summarised here).

| Shape | Reading view | Live Preview |
|---|---|---|
| plain fence | section = the fence (lineStart is the fence) | same |
| plain blockquote `> ```x` | section = the whole quote (`lineStart` = first quote line); canPersist true | Obsidian does NOT draw the block at all (raw text) |
| callout `> [!note]` + text | section = whole callout, `lineStart` = the `> [!note]` header, NOT the fence | `getSectionInfo(el)` is **null** for el, its parent, the callout, `ctx.containerEl`, the widget; host was `canPersist=false`, `data-dse-readonly` |
| nested callout | section = the OUTER callout | null (same) |
| two blocks in one callout | both get the identical section | null |
| fence in a top-level list item | section = whole list | section = the fence only; mount body keeps its indentation |
| list inside a callout | whole quote | not drawn |

Other facts: at processor-call time `el` is detached (`isConnected` false) but its ancestor chain exists (`el.closest('.callout')`, in LP `el.closest('.cm-embed-block.cm-callout')`); in Reading the later sibling code blocks are still bare `<pre><code class="language-x">` at call time; `src` (the source the processor receives) is prefix-free. In LP `view.editor.cm.posAtDOM(widget)` maps the callout widget to its first document line (callout.md: 4, correct) once the widget is attached (not at construction). A real mouse click on a DSE control inside an LP callout makes Obsidian open that callout as source (selection = whole callout, measured +250 ms; native `click` handling the DSE shield does not stop; `mousedown` is stopped as before). The debounced write still lands (unload flush through the durable identity). Not addressed (follow-up/doc'd).

Base behaviour (probe before the fix): Reading callout/quote/nested/list: click rendered, 0 bytes written, 0 Notices. LP callout/nested: read-only. LP list: click, 0 bytes, 0 Notices.

## The prefix helper
`src/framework/host/blockPrefix.ts` (new, ~100 lines), used by `fenceLine.ts`, `anchor.ts`, `registration.ts`, `ReadingModeBlockHost.ts`, `SidebarBlockHost.ts`:
- Prefix = one or more `>` markers (each up to 3 leading spaces, one optional space after) + up to 3 more spaces (a list item's fence inside a callout: `>   ```x`). A fence run with no `>` before it must start at column 0 (as today): `  ```x` is NOT a block DSE addresses (unsupported shape).
- `matchFenceMarker(line)` -> {prefix, marker, rest}; `stripBlockPrefix(line, prefix)` -> text or **null when the line left the quote** (tolerates `>` vs `> `, `>>` vs `> >`; identity for prefix ''); `addBlockPrefix(prefix, text, trimBlank)`; `blankLinesAreTrimmed(prefix, oldBodyLines)` (an empty line is written as `>` unless the block already spells one `> ` and none `>`, so both styles round-trip; a block with no empty line yet gets the clean `>`).
- `fenceLine.ts`: `parseOpenFenceLine` gains `prefix`; `replaceFenceBlock` re-emits prefix on opening line, every body line, close line (close keeps its own run/prefix; unterminated EOF uses the opener's); new `replaceFenceBody` (anchor stamp: body only, fence lines untouched); `blockBodyLines` (prefix-free body). SC-453 EOL logic untouched and composed: the prefix is added before `terminateLines`/CR handling.
- `anchor.ts` scanner: openers may carry a prefix; a block closes only on a line in the SAME quote (a fence-looking line at another depth, or outside the quote, is never a close); a line that left the quote abandons the candidate (unterminated rule). An outer col-0 fence still makes a `> ```` inside it literal. Prefix '' behaves byte-for-byte as before (regression-guard tests).
- ReadingModeBlockHost: (1) `getSectionInfo(el) ?? livePreviewCalloutSection()` (LP: find the leaf whose `editor.cm` contains the callout widget, `posAtDOM` -> first line, end = last contiguous `>` line; null while unattached). (2) `findOwnFence`: if the section's first line is a plain un-prefixed fence -> exactly the old path; else `locateInSection` finds the block in the section window: by prefix-free body; several equal bodies (identical twins) by DOM order (`domOrdinal`: index among the same-language blocks of the outermost `.callout/blockquote/.cm-embed-block`, counting not-yet-processed `pre>code` siblings), else nearest the last known fence line, else 'ambiguous' (-> Notice, never a guess). (3) `getBlockInfo()` and `knownLineStart` now report the FENCE line (so the chrome "Pin to sidebar" `cursorLine` picks the right twin). (4) LP callout with no section: `lpCalloutSeen` gives the durable identity (so `canPersist` is true at first render) and writes locate by body nearest the cached fence line. Guard: a block inside a `[data-dse-element]` (ds-party hero_ref nested render) stays read-only (G-S6h still ok).

## Notice (item 3)
`droppedWriteNotice.ts`: `notifyUnsavableWrite` / `unsavableWriteMessage(note)`: "Draw Steel Elements: a change to a block in <note> was not saved — the plugin can't tell where this block sits in the note (blocks inside lists can't be edited yet)." (same prefix/pattern as the existing dropped-write Notice; plus a console.warn). Rate limit = the existing one (<=1 per note per 5 s) on its own clock, so it never hides the "changed on disk first" Notice. NOTE: this is one Notice per note per 5 s, not strictly per failed attempt; persist() already coalesces a click burst to one write per ~400 ms. Say if you want the limiter removed for this Notice.
Shown by: ReadingModeBlockHost `resolveWriteTarget -> 'abort'` (no readable fence at the section / no identity / twins that cannot be told apart) and a null splice; SidebarBlockHost.replaceSource when the block is gone from the LIVE content or the splice is null (reuses the existing `notifyDroppedWrite`, "changed on disk first", which is accurate there; previously silent).
NOT shown (unchanged): `!canPersist` (read-only UI, inert), file not a TFile, identical-content write (wrote=true, no change), the existing `'miss'` path (already had its Notice). Tests pin: identical-content no Notice; file-changed-underneath = exactly the one existing Notice.
One pre-existing jest test encoded "callout: no write and NO Notice" and one "close-fence hardening ... no Notice" (knownBody null, stale range): the first was replaced by the new behaviour tests, the second now expects the unsavable Notice (a lost write is never silent per the ruling).

## Survey of write/locate sites
| Site | Disposition |
|---|---|
| `ReadingModeBlockHost.replaceSource` / `resolveWriteTarget` / `locateByBody` / `readSection` / `getBlockInfo` (Reading + LP writes) | changed (above) |
| `SidebarBlockHost` (`extractBody`, `locate` via anchor.ts, `replaceSource`) | changed: prefix-free body, `replaceFenceBlock`, Notice |
| `sidebar/registration.ts` `sendToSidebar` stamp (`replaceFenceBody`), `aliasAtLine` (live-editor scan: command availability inside a callout) | changed |
| `sidebar/anchor.ts` (`listFences/findAnchoredBlock/findFenceByBody/findFenceAtLine/findGeneratedBlock/findFirstFence`, `iterateFences`, `isFenceClose`, `matchFenceLine`) | changed (shared scanner); `FENCE_LINE` export removed (no other importer) |
| `main.ts:557` (initiative command alias via `listFences`), `elements/encounter/view.ts` (`findGeneratedBlock`, EOF append) | already fine through the scanner; unchanged |
| `pipeline.ts:742` chrome Pin (`getBlockInfo()` -> `requestPinToSidebar`) | already fine: `getBlockInfo` now returns the fence line |
| `LivePreviewBlockHost.replaceSource` | stub that throws; LP writes go through ReadingModeBlockHost (unchanged) |
| `authoring/{scaffold,insert,suggest,compendiumInsert,schemaSuggest}.ts` | insert new text with `editor.replaceSelection`; `authoring/fenceScan.ts` already prefix-aware. Out of scope (see Follow-ups) |
| `utils/CodeBlocks.ts` | dead legacy, untouched |

## Unsupported shapes (exact text for the Backlog ticket)
Report: they do NOT write today on base (silent). On this branch they show the Notice and are in `docs/writing-blocks.md` "Blocks inside callouts and quotes".
1. A fence indented inside a list item with no `>` in front:
````
- A list item
  ```ds-stamina-bar
  max_stamina: 30
  current_stamina: 12
  ```
````
(also `1. item`, and a fence indented 1-3 spaces outside a list: `  ```ds-counter`). Reading view and Live Preview both draw it; neither can save. Supporting it needs a list-indentation prefix; deliberately not added: allowing arbitrary indentation would make indented code blocks (documentation examples) look like fences to the scanner (sidebar pin/anchor), and in LP the mounted body keeps its indentation so body comparison would need dedenting.
2. Supported "for free" (same helper): a list inside a callout (`> - item` + `>   ```x`), Reading view (jest + measured; LP does not draw it).
3. Native Obsidian limits (not DSE bugs, documented): Live Preview does not draw DSE blocks inside a plain `>` quote; a click on a control inside an LP callout opens the callout as source (write still lands).

## Tests added (all from the repo's neighbours' conventions)
- jest (+74 net): `blockPrefix.test.ts` (new, 23), `anchor.test.ts` (+5), `reading-mode-host-durable.test.ts` (+27 SC-455 incl. 3 LP-callout tests, 1 rewritten, 1 removed), `sidebarBlockHost.test.ts` (+13), `registration.test.ts` (+6), `dropped-write-notice.test.ts` (+2). Coverage of the brief's list: plain quote; callout with header and text above/below; nested `> > `; `>` no space; empty body line `>` and `> ` round trip; multi-line growth/shrink prefixes every line; two same-kind blocks in one callout and in two callouts both orders (both hosts); identical twins in one callout (DOM order) in Reading and LP; content above/below byte-identical; info string (SC-290); CRLF callout all-CRLF; hand-edited block re-located after a write; un-nested byte-identical guards; unsupported shape Notice + file unchanged; identical-content and file-changed-underneath no new Notice; strict-body (ds-scc) bind in a callout; anchor stamp in callout / nested / `>` / CRLF / twin-by-cursor; command availability in a callout.
- e2e `e2e/specs/callout/callout-writes.e2e.ts` (9, new fixtures `e2e/vaults/shipped/Callout/*`): R01 callout, R02 nested, R03 plain quote, R04 identical twins (click the 2nd); L01 callout, L02 nested, L03 twins (2nd) in Live Preview; N01/N02 list-item fence Notice + note untouched (Reading / LP; two copies because the Notice is rate-limited per note). Real pointer clicks on Catch Breath, assert bytes: edit landed, prefix on every block line, both fence lines identical, everything else (skeleton) identical, other fence identical. Driver additions: `dse.openNote(rel, {mode:'live-preview'})` (cursor parked on line 0), view-aware `dse.block`, prefix-aware `skeletonOf/fencesOf/readBlock`. Coverage stays 51/51 (no new control).
- lifecycle G-S11 (27th): sidebar needs the experimental gate, which e2e runs with OFF, so (as SC-453's G-S10) the sidebar half is a lifecycle scenario: counter in a callout and in a nested callout, pin from the editor (stamp must be exactly one `> `/`> > ` anchor line inside the block, panel holds the same id), click Increase in the panel; bytes: edit landed, prefix on every block line, fence lines and outside text identical.

## FAIL-on-base counts (base src = `d58cf6a`, new tests at head)
jest (logs `logs/final-base.json`, `logs/final-base.log`): anchor 3/5 new fail (2 guards pass), dropped-write-notice 2/2, sidebarBlockHost 12/13 (1 guard), reading-mode-host-durable 25/27 (2 guards: un-nested byte-identical; nested-render stays read-only) + 1 pre-existing rewritten test, registration 6/6, blockPrefix suite fails to load (module absent; 23 tests). Total 48 new tests fail + 1 rewritten + 23 un-runnable. Passing-on-base guards are by design. e2e: `logs/e2e-callout-base.log` 0/9 ok, 9 failed (no write after click x7, no Notice x2). Lifecycle: `logs/lc-g11-base.log` G-S11 FAIL (anchor never stamped in a callout).

## Gate numbers (head `e4f60eb`, after rebase onto d58cf6a; logs in `logs/`)
- tsc (incl. `-p e2e`) clean rc 0 `gate-tsc.log`; lint clean rc 0 `gate-lint.log`.
- jest `gate-jest.log`: Tests 1 skipped, 5024 passed, 5025 total; Suites 230 passed, 230 of 231 (1 skipped).
- lifecycle `gate-lifecycle.log`: `OBSIDIAN-LIFECYCLE done: 27/27 ok, 0 failed`.
- e2e `gate-e2e.log`: `OBSIDIAN-E2E done: 80/85 ok, 0 failed, 5 known-bug, coverage: 51/51 pairs`.
- shots `gate-shots.log`: 572 PNGs, 0 FAIL; `pressed toggle parity OK (96 comparisons across 8 sites x dark/light x rest/hover/focus-visible ...)`; host-copy pin OK; button host-leak 112 kinds / 672 comparisons.
- freeze `gate-freeze.log`: `freeze OK (276/276 ...)`, no print bytes moved. parity `gate-parity.log`: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0.
(An earlier full battery on the pre-rebase head `6bcf9c8`: jest 4981/2 skipped (fresh worktree css skip), lifecycle 27/27, e2e 77/85 0 failed, then superseded by the above; the pre-rebase shots finished 572/0 FAIL.)

## Files changed (vs d58cf6a; 27 files, +1717/-108)
src: `framework/host/{blockPrefix(new),fenceLine,ReadingModeBlockHost,SidebarBlockHost,droppedWriteNotice}.ts`, `framework/sidebar/{anchor,registration}.ts`. e2e: `driver/{dse,invariants,state}.ts`, `specs/callout/callout-writes.e2e.ts`, `vaults/shipped/Callout/{callout,nested,quote,twins,list,list-lp}.md`, `README.md`. `visual-harness/obsidian-lifecycle.mjs` (G-S11). tests as above. docs: `docs/writing-blocks.md` (new "Blocks inside callouts and quotes" section: what works / what doesn't yet), dse `CHANGELOG.md` (bullet at the top of the 7.0.0 unreleased list; the file has no `## Unreleased`).

## Workspace CHANGELOG bullet (for the owner; not edited)
"- Fixed: Draw Steel blocks inside a callout or quote now save their changes (Reading view, Live Preview callouts, and the sidebar); a block that can't be saved (one inside a list item) now says so with a notice instead of failing silently."

## Drive-by fixes:
None.

## Follow-ups:
1. Backlog ticket: support a fence indented inside a list item / indented 1-3 spaces (text above; needs list-indentation prefix + dedent-tolerant body compare for the LP mount body).
2. Live Preview: a real click on a control inside a callout opens the callout as source (native `click`; the DSE shield only stops mousedown/pointerdown). Write lands, UX wart. A bubble-phase `click` stopPropagation at the root would fix it but could swallow Obsidian's own link handling; not tried.
3. Authoring inserts (`/ds`, Insert commands, compendium insert) use `editor.replaceSelection` with unprefixed multi-line text; inserted inside a callout the lines lose the `> `. Not a locate/rewrite of an existing block, so left; worth a ticket.
4. `blockKey()` for an LP-callout block is the sectionless fallback at first render and `path::lang::fenceLine` once attached (session-only state key could change once). Not measured to matter.
5. Rate-limited Notice: one per note per 5 s (existing limiter); say if per-attempt is required.
6. `ReadingModeBlockHost.replaceSource` still returns false silently when the note's TFile can't be found (deleted/renamed mid-write); outside this ticket's location scope.
7. dse-verify SKILL expected numbers need the owner's update: lifecycle 27/27, e2e 80/85 (+9), jest 5024 / 1 skipped / 230 of 231.
