# SC-455 independent review — round 1

**Executive summary**
- VERDICT: **FIX-REQUIRED**. Reviewed dse `sc455-callout-write` @ `e4f60eb` against base `d58cf6a`. Worktree `git status` identical before and after (dse clean; superproject ` M draw-steel-elements` both times). No commits made.
- Findings: CRITICAL 0 · HIGH 1 · MEDIUM 0 · LOW 3 · INFO 4.
- HIGH-1: when the opening fence has no space after `>` (`>```ds-x`, `>>`, `> >`), any body line that starts with a space loses one space every time it is written. The prefix helper's write step and its read step do not match. One save from the edit form in raw mode moves a nested YAML key up a level. That is silent data corruption, and this shape is inside the ruling's scope ("with or without the space after `>`").
- Gates, re-run by me on e4f60eb: tsc + lint clean · jest **5024 passed / 1 skipped / 230 of 231** · lifecycle **27/27** · e2e **`80/85 ok, 0 failed, 5 known-bug, coverage: 51/51 pairs`** · shots **572**, 0 FAIL, `pressed toggle parity OK (96 comparisons …)` · freeze **`freeze OK (276/276 …)`** · parity **0 gaps / 0 undeclared / 24 declared**. All match the implementer's numbers.
- FAIL-on-base confirmed: 49 of the branch's tests fail on base src (48 new + 1 rewritten). The `blockPrefix` suite (23 tests) cannot load on base. 5 SC-455 regression guards pass on base, by design.
- Mutation checks on `blockPrefix.ts`: every mutant was caught. Dropping the prefix re-emit fails 35 tests, one-level-only fails 6, a single `>` marker fails 7, always-trim blank lines fails 3, strip-never-null fails 2.
- Real-Obsidian measurements (1.14.4) match the implementer's claims: in Reading view `getSectionInfo` returns the whole callout, and in Live Preview it returns null. Follow-up 4 (`blockKey` drift in a Live Preview callout) did not reproduce, so I recommend dropping it.
- Rebase onto 7817133 (SC-360): one textual conflict, in `anchor.ts` (removed `FENCE_LINE` vs. added `LEADING_LETTERS`/`generateAnchorId`), and it is trivial to resolve. `registration.ts` merges cleanly. Details are in the "Rebase hazards" section.

## Findings

### HIGH-1 — blocks whose opener has no space after `>`: body indentation shrinks by one space per write
- Where: `src/framework/host/blockPrefix.ts:84` (`addBlockPrefix`: `prefix + text`) vs `blockPrefix.ts:57-73` (`stripBlockPrefix` consumes one optional space after each `>`). The prefix comes from the opening fence line (`fenceLine.ts:117`/`:91`, `openFence.prefix`).
- Mechanism: with prefix `>` (or `>>`, `> >`), a body line `"  - x"` is written as `>  - x`. CommonMark, `stripBlockPrefix` and real Obsidian all read that line back as `" - x"`, one space short. Real Obsidian measured this: `Probe/nospace.md` with mounted body `heroes:\n - name: "Alice"\n   max_stamina: 30\n…\nmalice:\n value: 1` for disk lines `>  - name`, `>    max_stamina`, `>  value`. The write side never adds the extra space, so writing `x` and reading it back does not give `x`. Jest probe P1 fails for prefixes `>`, `>>` and `> >` and passes for `> `, `> > `, ` > ` and `>   `.
- Concrete failure:
  1. Raw-text writer (FormModal raw mode, `src/authoring/FormModal.ts:176-177`, which returns `rawText` verbatim). The note has `>```ds-x`, `>a:`, `>  b:`, `>    c: 1`, `>````. The mounted body is `a:\n b:\n   c: 1`. Saving once without editing writes `> b:` and `>   c: 1`, which reads back as `a:\nb:\n  c: 1`. `b` is no longer under `a` (`a: null`), and further saves keep moving lines left. Probe P2b output after 2 saves: `">```ds-counter\n>a:\n>b:\n>  c: 1\n>```"`.
  2. Two writes on one host (jest probe P2). `knownBody` is the 2-space text that was written, but disk now strips to 1 space. The second write returns false and shows the "changed on disk first" Notice for a write that should have landed. In real Obsidian, two `ds-initiative` round-advance clicks in a no-space callout both landed with no Notice, because each re-render mounts a fresh body. So this path needs a write before the re-render: the unload flush, or an identical-content write. Not reproduced live.
  3. Not probed: the sidebar self-echo guard (`SidebarBlockHost` compares `extractBody` with what it wrote). For a no-space callout with nested YAML, the bodies differ, so its own write probably looks like an external change and the panel rebuilds.
- Re-serialising elements are self-consistent: they always emit 2-space YAML, which reads back uniformly shifted, so the data stays intact. Only raw-text writes, or comparisons against the text that was written, break.
- Fix: in `addBlockPrefix`, when `prefix` does not end in a space and `text` starts with a space or tab, emit `prefix + ' ' + text`. Equivalently, guarantee `stripBlockPrefix(addBlockPrefix(p, t), p) === t` for every `p` and `t`. Add the P1 round-trip property as a `blockPrefix.test.ts` test.each over `['> ', '>', '> > ', '>>', '> >', ' > ', '>   ']` with bodies that hold leading-space lines and blank lines, plus a host-level two-writes test for a `>` prefix. Docs `docs/writing-blocks.md` say "The space after the `>` is optional", which is only true after this fix.

### LOW-1 — Live Preview callout written before the widget is attached: the write goes to the twin nearest line 0
- Where: `src/framework/host/ReadingModeBlockHost.ts:369` (`this.knownLineStart ??= 0`) together with `hasDurableIdentity` (`lpCalloutSeen`).
- Scenario (jest probe P6): two identical counters in one Live Preview callout, the widget not attached to the editor yet, and the LOWER host writes. `replaceSource` returns true, the UPPER block gets the value and no Notice is shown. In practice a user interaction attaches the widget and `notePersistIntent` refreshes the real fence line first. So this only matters for a write issued before the first attach, such as an element that persists on mount.
- Fix: do not default `knownLineStart` to 0. Leave it null until `livePreviewCalloutSection()` or the section resolves, and let `hasDurableIdentity` stay false until then (or return 'abort' with a Notice). Alternatively, use `domOrdinal()` in the durable path when bodies tie.

### LOW-2 — an unsavable write reached through the form editor shows two Notices
- Where: `src/authoring/FormModal.ts:265-268` (`couldn't save — the block may have moved`) on top of `ReadingModeBlockHost.ts:592` (`notifyUnsavableWrite`).
- Scenario: Edit form → Save on a list-indented block. The user gets "…was not saved — the plugin can't tell where this block sits…" and also "couldn't save — the block may have moved." That is two messages for one attempt, and the brief asks for one per attempt. The existing 'miss' path had the same double Notice before this branch.
- Fix: FormModal skips its own Notice when the host already reported (have `replaceSource` report a reason, or expose `host.lastWriteNotified`). Or accept it and record that the double Notice predates this branch.

### LOW-3 — e2e N01/N02 accept the wrong Notice and don't check for spam
- Where: `e2e/specs/callout/callout-writes.e2e.ts:84-92`. The tests wait for any `.notice` containing `was not saved`, which also matches `droppedWriteMessage` ("changed on disk first").
- Fix: assert the exact `unsavableWriteMessage` text (or "can't tell where") and that exactly one new DSE Notice appeared.

### INFO
- INFO-1: the unsavable-write wording (`droppedWriteNotice.ts:23`) always adds "(blocks inside lists can't be edited yet)". It is also shown for a fence in a callout that never closes inside the quote (jest probe P4a), where the list hint is misleading. Optional: drop the list hint when the reason is not a list shape.
- INFO-2: other paths that can still fail without a Notice: `ReadingModeBlockHost.ts:512` (TFile missing; follow-up 6, already FOLDED) and `!canPersist` (legitimate read-only). I found no other new silent-false path. `SidebarBlockHost.replaceSource` now shows `notifyDroppedWrite` when it loses the block, and the existing anchor-lost Notice still applies.
- INFO-3: column-0-only readers outside the write scope: `src/utils/ReferenceResolver.ts:26` and `src/services/typeAdapters.ts:26` (`extractFirstDsBlock[Text]`, the first `ds-*` block of a REFERENCED note). A referenced hero or statblock that sits inside a callout is not found. This is read-only, and the user sees an error card rather than silence. Possible Backlog item. `authoring/fenceScan.ts` keeps its own prefix-aware fence regex, so there is a second fence definition. It is authoring-only (SC-462 territory).
- INFO-4: the workspace `CHANGELOG.md` (worktree superproject) has no SC-455 bullet yet. The ledger already assigns it to the fix round. The dse `CHANGELOG.md` bullet is present and accurate apart from the HIGH-1 caveat.

## Probe results by brief item
1. **Write/locate site survey.** I independently grepped `vault.process|vault.modify|replaceRange|transaction|splice` and fence regexes. The writers are `ReadingModeBlockHost.ts:532`, `SidebarBlockHost.ts:301`, `registration.ts:216` (stamp, via `replaceFenceBody`) and `encounter/view.ts:456` (binds an existing tracker byte-identically via the prefix-aware `findGeneratedBlock`, or appends a new unprefixed block at EOF, which is fine). `utils/CodeBlocks.ts` is dead (no importers). Authoring `replaceRange` is SC-462, out of scope. The only remaining column-0 regex in a write path is `ReadingModeBlockHost.ts:74` `CLOSE_FENCE`, used only on the un-nested branch. No write site is left that assumes column 0. The read-only exceptions are listed in INFO-3.
2. **Integrity probes** (jest, `probe/zz-sc455-review-probe.test.ts`, 20 probes: 14 pass, 6 fail = HIGH-1 ×5 + LOW-1 ×1). Passing:
   - mixed `> >`/`>>` on adjacent lines, with trailing spaces after `>`: located, close fence `>>```` kept, outer lines identical. The rewritten body lines take the opener's spelling.
   - user un-quotes the block: written as a plain block, no prefix invented.
   - user deletes the block: false, 1 Notice, note unchanged.
   - block moved into another callout (`> > `): found by body and written with the new prefix.
   - two different-body blocks in one callout, both write orders.
   - CRLF nested callout with multi-line growth stays all-CRLF.
   - a quoted `ds-counter` inside an outer ```` ```` ```` fence is never a target.
   - an un-nested opener with a quoted close-looking line inside its body is not closed by it.
   - un-nested write outputs byte-identical to base: the same P5 battery on base src and head gives identical bytes. `listFences` differs only by also listing the quoted block, as intended.
   
   Also covered by the branch's own tests, which I read: two blocks in different callouts; hand-edited re-trigger; info string; `>` and `> ` empty lines.
3. **Notice paths.** Unsupported shapes show the Notice and leave the file unchanged. That is e2e CALL-N01/N02 (passed in my run), plus jest. Identical-content writes and file-changed writes show no new Notice (branch tests). Rate limit: one per note per 5 s (accepted). Wording is plain. See INFO-1 and LOW-2.
4. **Real Obsidian** (`rprobe-head.log`; scratch copy of the lifecycle harness built from e4f60eb, port 9391):
   - Reading view: callout section is lines 4..12, i.e. the whole callout; `getBlockInfo` gives the fence 6..11.
   - Live Preview: section null; `getBlockInfo` 6..11 via `posAtDOM`. A real click wrote 1 modify with the prefix on every line and no Notice.
   - Two `ds-initiative` round-advance clicks in a `> ` callout and in a `>` callout each landed (1 modify each, no Notice).
   - My own gate runs: e2e CALL-R01..R04 and L01..L03 (Reading view, Live Preview) and lifecycle G-S11 (sidebar pin + write in a callout and a nested callout).
5. **Not vacuous.** FAIL-on-base and mutation results are in the summary. Logs: `base-newtests.log/json`, `mut-*.log`.
6. **Docs.** `docs/writing-blocks.md` has a plain-language "Blocks inside callouts and quotes" section with "What works / What doesn't yet": list-item fences, Live Preview not drawing blocks in a plain quote, and the Live Preview click opening the callout as source. The dse `CHANGELOG.md` bullet is accurate. Caveats: HIGH-1 (the "space is optional" claim) and INFO-4.
7. **Gates.** All green; numbers are in the summary, and logs are listed under Artifacts.
- **Follow-up 4 (`blockKey`).** I hooked `ReadingModeBlockHost.prototype.blockKey` in real Obsidian and opened a callout counter in Live Preview. All 5 construction and attach-time calls returned `Probe/callout.md::ds-counter::6` with the element connected. After a write and re-render it was the same key. No session-state loss observed: **recommend DROP**.

## Rebase hazards vs 7817133 (SC-360)
Trial merge with `git merge-tree d58cf6a 7817133 e4f60eb`. Nothing was written to the worktree; I only ran `git fetch origin develop` so the object existed. Output: `rebase-trial-merge-tree.txt`.
- **Conflict (1 hunk): `src/framework/sidebar/anchor.ts`.** SC-455 deletes the `FENCE_LINE` export block. SC-360 adds `const LEADING_LETTERS = 'abcdf';` and the exported `generateAnchorId()` directly after it. Resolve by keeping the deletion plus SC-360's `LEADING_LETTERS`/`generateAnchorId` (export) and its `parseYaml` import and `SCALAR_TOKEN` readers.
- **Clean textual merge: `registration.ts`.** SC-360 moved `sendToSidebar`'s body into `bindBlockToSidebar` and added an `id === null` refusal. SC-455's `blockBodyLines(...)` and `replaceFenceBody(...)` land in the new function. Check after the rebase that no `lines`, `detectEol` or `terminateLines` reference remains, since SC-455 dropped those imports. tsc will catch it.
- **Semantics.** SC-360's `ensureAnchor` (`parseYaml(body)`, duplicate-key refusal) and its widened `ANCHOR_LINE`/`GENERATED_FROM_LINE` (allowing a next-line indented value) all work on SC-455's prefix-free bodies, so no behaviour change is expected. HIGH-1 interacts mildly: under a `>`-no-space prefix, an indented next-line anchor value shifts by one space but stays indented, so it is still read.
- **Tests and CHANGELOG.** `test/unit/framework/anchor.test.ts`, `test/dom/framework/registration.test.ts` and `CHANGELOG.md` were changed by both sides and merged with no conflict markers in the trial. Re-run the full battery on the rebased head. The SC-360 tests mention `FENCE_LINE` only in a comment (`anchor.test.ts:350`).

## Not probed
- The sidebar self-echo effect of HIGH-1 (see HIGH-1, point 3).
- A live demonstration of the HIGH-1 FormModal raw-mode corruption (shown in jest with the real host and helpers).
- A real-Obsidian Notice-count check for N01/N02 (see LOW-3).

## Artifacts (all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc455-callout-write/sc455-review-20261020-001424/`)
- Gates: `gate-{tsc,lint,jest,lifecycle,e2e,shots,freeze,parity}.log` + `.rc`, run via `gate.sh`.
- FAIL-on-base: `base-newtests.log`, `base-newtests.json`. Mutation: `mutate.sh`, `mut-M1-no-reemit.log` … `mut-M6-reemit-first-line-only.log`.
- Jest probes: `probe/zz-sc455-review-probe.test.ts`, `probe-head.log`, `probe-base-P5.log`.
- Real Obsidian: `probe/scenarios.mjs`, `head/visual-harness/zz-sc455-review-probe.mjs`, `rprobe-head.log`.
- Rebase: `rebase-trial-merge-tree.txt`. Worktree state: `status-{before,after}-{dse,super}.txt`.
- Scratch source copies: `base/` (d58cf6a + branch tests) and `head/` (e4f60eb). Both have `node_modules` symlinked to the worktree's.
