# SC-605 r3 independent review (reviewer R2)

**Executive summary**
- **Verdict: LAND-READY** (dse `54e37fed` on `dcc53f0f`; superproject `2ab866bc` on workspace origin/main `f108e5e9`). Fold LOW-1 (a one-word CHANGELOG fix) before landing. The other findings are optional.
- **Findings:** HIGH 0 · MEDIUM 0 · LOW 3 · INFO 3.
- **Gates (re-run by me on 54e37fed):** tsc (incl. `-p e2e`) and lint clean · jest **10814 passed / 2 skipped** (268 suites; 10787 + 27) · e2e **`313/316 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`** (176 s) · lifecycle **60/60** (21 / 16 / 9 / 4 / 7 / 3; walls 186 / 393 / 417 / 298 / 392 / 228 s) · styles.css sha256 `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27`, the CURRENT hash, with no CSS source in the diff. So shots, freeze and parity carry over and were skipped.
- **Real-Obsidian probes (1.14.4, Live Preview):** 20 run, 19 held as the rulings require. 1 INFO: a contrived resurrection that no human could time (§2, ZZR3-11). A popout window, Reset encounter → Yes (mouse and keyboard), the keyboard stepper, rapid presses, two trackers saving in one debounce and every remount case all held. A hidden `display:none` copy can be produced, but it is a Reading-view copy and can never take the carry.
- **Integrity:** after a carried Advance round, the note bytes are identical to the base build's save (241 B, `round: 2`, no draft text).
- **Vacuity:** with the src reverted to base, 7 of 9 new e2e tests go red (L09–L13, L15, L17). The 2 guards, L14 and L16, go red under their own mutations (ticket, one-shot), and L13 goes red under the live-key mutation. All 13 jest mutations go red. The pane-scope guard is pinned by jest only: no e2e test goes red without it (LOW-2).
- **SC-607 (c329ff35):** nothing this branch relies on changed. A trial merge has one changed-in-both file, CHANGELOG.md, and it auto-merges with no conflict (§6).

## 1. Gates (54e37fed on dcc53f0f, my runs)

| Gate | Result | Log |
|---|---|---|
| tsc + tsc -p e2e | clean, rc 0 | `tsc.log` |
| lint (src, main.ts, e2e) | clean, rc 0 | `lint.log` |
| jest (main.js/styles.css removed first) | `Tests: 2 skipped, 10814 passed, 10816 total`, `Test Suites: 1 skipped, 268 passed`, rc 0, 70 s | `jest-full.log` |
| e2e full | `OBSIDIAN-E2E done: 313/316 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` (known bugs SC-257, SC-384, SC-355), rc 0 | `e2e-full.log` |
| lifecycle part 1 | 21/21, 186 s | `lc-part1.log` |
| lifecycle part 2 | 16/16, 393 s (load 5–9) | `lc-part2.log` |
| lifecycle part 3 | 9/9, 417 s | `lc-part3.log` |
| lifecycle part 4 | 4/4, 298 s | `lc-part4.log` |
| lifecycle part 5 | 7/7, 392 s (G-S91 passed the first time) | `lc-part5.log` |
| lifecycle part 6 | 3/3, 228 s | `lc-part6.log` |
| styles.css | `5e5ff488…2b27` (built by the e2e run); `git diff dcc53f0f..HEAD` touches no `*.css` → shots / freeze / parity carry over | — |

All logs are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc605-r3-review/`.

## 2. Real-Obsidian probes (scratch spec `probe.e2e.ts.txt`, ids ZZR3-*, parked in `e2e/specs/zzr3/` only during `--only` runs)

End state is read after write-idle + 1 s. Each row gives boxes `amount/label` and focus. HEAD runs are in `probe-head-1794498871.jsonl` and `probe-head12-1794498997.jsonl`; base (src at dcc53f0f) is in `probe-base-1794499650.jsonl`.

| Probe | What | HEAD | Base | Verdict |
|---|---|---|---|---|
| 01 | mouse Advance round | `2/Feytouched`, Round 2, hint "", no aria-invalid, focus body | `""/""` | held |
| 02 | **keyboard stepper**: Enter on +, then Space on − | kept after each; focus `init.malice.inc`+ring, then `init.malice.dec`+ring | `""/""` (focus same) | held |
| 03 | **Reset encounter → Yes (mouse)** | kept, Malice 0, focus body | `""/""` | held (mouse never moves focus) |
| 04 | Reset encounter → Yes (keyboard) | kept, focus `init.reset-encounter`+ring | — | held |
| 05 | **rapid presses**: 3 separate saves about 690 ms apart (each lands inside the previous one's 1500 ms) | kept, Malice 6, 1 write each | `""/""` | held |
| 06 | 3 + clicks inside one debounce | kept, 1 write, Malice 6 | — | held |
| 07 | two trackers, + in the 1st then + in the 2nd inside one debounce (SC-544 flush, 2 writes) | both kept (`1/Alpha`, `2/Beta`), Malice 2 / 3 | — | held |
| 07b | two trackers, Advance in the 2nd then in the 1st (the upper one grows a line, the lower one shifts) | both kept, both Round 2 | — | held |
| 08 | **remount**: draft, no press, leaf → other note → back (175 ms) | `""/""` | — | held |
| 09 | **remount**: +, navigate away inside the debounce (unload flush), back (200 ms) | `""/""`, Malice 4 written | — | held (the flush runs after release, so it has no ticket) |
| 10 | **remount**: + lands (carried), then away and back (165 ms) | `""/""` | — | held |
| 11 | contrived: leaf navigates away INSIDE the save's vault `modify` (ticket fresh), back in 281 ms | **`2/Feytouched` resurrected** | `""/""` | INFO-1 |
| 12 | **close the tab** within the debounce, reopen in a new tab (227 ms) | `""/""` | — | held |
| 13 | kept draft, then an outside edit straight after (one-shot, boxes NOT emptied) | `""/""` | — | held |
| 14 | split: LP embed of tracker.md (left) + tracker.md (right), drafts in both, Advance in right | right `2/Main`; embed `""/""` (its own draft lost, the SC-620 class); the embed never got `Main` | — | held |
| 15 | same note in two panes, draft only in the LEFT (inactive) pane, Advance there | left `1/Left`, right `""/""` | — | held |
| 16 | **popout window** (`isPop: true`), draft, Advance then + (script clicks) | popout kept after both; the main-window copy `""/""` | popout `""/""` | held |
| 18 | **hidden copy hunt**: LP → Reading → LP in one leaf | a `display:none` copy exists, but in `.markdown-reading-view` (not `.cm-content`); visible tracker kept, hidden copy untouched | — | held (INFO-2) |
| 19 | Reading view, Advance | Reading root kept (SC-589); the leaf's hidden LP widget is stale and untouched | — | unchanged |
| 20 | rich.md, Reset turns | kept | — | held |

17 (Reading → LP switch) failed in the driver: `dse.block` follows `state.viewMode='reading'` and chose the hidden Reading copy. That is a driver artefact. 18 covers the same case.

Mouse never moves focus: 01, 03, 05, 06, 07, 07b and 13 all end with focus on `body`, the same as base. Reading view and the pinned sidebar: INIT-M10 / M11 and every Reading / sidebar test pass in the full e2e run, and probe 19 shows Reading view unchanged.

## 3. Integrity

ZZR3-01 note text after the carried Advance round: HEAD and base are byte-identical (241 B; `malice: value: 3` + `round: 2`; no `Feytouched`). The carry only reads the boxes, in `carryState`, and seeds `quickAddDraft`; it has no write path. INIT-L09 also asserts that the note never contains the draft.

## 4. Vacuity and mutations

- **src reverted to dcc53f0f** (5 files; `e2e-base.log`): `INIT-L09..L13, L15, L17` FAIL; `L14`, `L16` ok. Those two are guards that should hold on base.
- **e2e mutations** (`e2e-<m>.log`):
  - `ticket` (capture without the ticket check): INIT-L14 red only.
  - `oneshot` (take does not delete): INIT-L16 red only.
  - `livekey` (`entry.host.blockKey()` instead of `writtenBlockKey`): INIT-L13 red.
  - `scope` (no pane/embed check): **all green, ZZR3-14 / 15 included**. See LOW-2.
- **jest mutations** (`jest-mutations.txt`, files livePreviewStateCarry / initiative-matrix / register-framework-elements, 225 tests): each of ticket(2), oneshot(2), scope(1), livekey(1), emptydrop(1), takecm(1), capcm(2), ttl(1), setfilter(1), usedset(1), pipetake(1), receive(2) and carrynull(1) goes red. Every source file was restored from HEAD after each run.
- **Passes on base for the wrong reason:** none of the bug claims (L09–L13, L15, L17 are red on base). L14 and L16 are guards and are green on base by design. Each is pinned by its own mutation.

## 5. Findings

### LOW-1: the workspace CHANGELOG has a broken sentence (`CHANGELOG.md:112-113`, superproject `2ab866bc`)
`…what you have typed is never written to the note. In` / `Since SC-605 this holds in Live Preview too.` The old "In Live Preview the boxes are still emptied…" was cut after "In", and the word was left dangling. Scenario: the SC-589 bullet reads "In Since SC-605…". The dse CHANGELOG (`CHANGELOG.md:68`) is correct. **Fix:** delete the trailing ` In` on line 112.

### LOW-2: INIT-L17 does not pin the pane-scope guard (`e2e/specs/initiative/malice-live-preview.e2e.ts:173`)
L17's title says "the draft comes back only in the pane it was typed in". With the scope check removed (`livePreviewStateCarry.ts:130`), L17 still passes, and so do my left-pane (ZZR3-15) and embed (ZZR3-14) variants. In Obsidian 1.14.4 the writer pane's redraw always mounts first and the one-shot take empties the carry before the other pane mounts, so what L17 actually holds is the mount order. Scenario: a future Obsidian that redraws the other pane first would hand the draft to the wrong pane, and no e2e test would catch it. Only jest S09 pins the guard. I1's report already calls the pane check "jest-only", but the e2e title claims more than it proves. **Fix:** either retitle or comment L17 ("…with jest S09 pinning the scope rule; Obsidian mounts the writer pane first"), or leave it as is and note it in the ledger. No code change needed.

### LOW-3: `carries` is never swept; an unclaimed entry keeps its pane element alive (`src/framework/host/livePreviewStateCarry.ts:64, 89, 109-116`)
An expired carry is deleted only when the same key is looked up again (`live()`), and nothing is cleared on plugin unload. A capture whose redraw never mounts keeps `{ state, scope: <workspace-leaf element> }` in a module-level Map until that exact block key is mounted again in Live Preview, which may be never. That happens when the redraw becomes an error card, or in the contrived ZZR3-11 shape where the note is then closed. Scenario: close the tab afterwards and the detached leaf DOM is retained for the rest of the session. It is bounded (one entry per block key) and rare, so this is not a functional bug. **Fix (optional):** in `carryOwnSaveState`, before `carries.set`, delete every entry with `expires <= now` (a few entries at most). Optionally also export a clear for `registerFrameworkElements`' unload.

### INFO-1: a draft can come back after a leaf navigates away and back inside the ticket→redraw window (ZZR3-11)
The capture runs on any `beforeRelease` with a fresh ticket, whatever the reason for the release. If the leaf leaves the note between `noteWrite` and the Live Preview redraw (about 10 ms; measured write → take 5–11 ms) and returns within 1500 ms in the same leaf, the new mount takes the draft. Base shows empty. This needs a navigation started inside a vault `modify` handler, which no human can time. The unload-flush path (ZZR3-09, a press then navigate inside the debounce) and close/reopen (ZZR3-12) both start empty. **Fix:** none needed. If wanted, add one sentence to the module header saying that a release during that window is treated as the save's redraw.

### INFO-2: R1 risk 2 (hidden `display:none` copy): what can be produced cannot take
Switching a leaf from Reading to Live Preview, or LP → Reading → LP, keeps a hidden tracker copy in `.markdown-reading-view` (ZZR3-17/18). In Reading view the leaf keeps a hidden, stale LP widget in `.cm-content` (ZZR3-19). Neither takes anything:
- The Reading copy fails the `.cm-content` test.
- The hidden LP widget in a Reading-mode leaf never gets a carry, because Reading view adopts and no `.cm-content` entry has a ticket.

I found no way to get a hidden `.cm-content` copy of the written block in the same pane during a Live Preview save. The module header's note stays accurate.

### INFO-3: release-hook ordering (`src/framework/registerFrameworkElements.ts:103-106`)
`beforeRelease` calls `carryOwnSaveFocus(entry)` and then `carryOwnSaveState(entry)` with no try/catch between them. A throw in the focus carry skips the state capture. `ViewRegistry.release` catches the throw and warns, so the release itself still goes ahead. Today neither function throws on real input. **Fix (optional):** wrap each call in its own try/catch.

### Code review notes (no finding)
- **Seam:**
  - `ElementView.carryState?` / `receiveCarriedState?` are optional. `InitiativeView` is the only implementer (grep: `src/elements/initiative/view.ts:214, 223`).
  - The pipeline take is gated on `host instanceof ReadingModeBlockHost && view.receiveCarriedState` (`pipeline.ts:737`).
  - Capture requires `typeof view.carryState === 'function'`.
  - No other element opts in by accident.
- **Ordering:**
  - Capture runs in `beforeRelease`, before `entry.released = true` and `removeChild(view)`, so it runs before the unload flush. The flush's `noteWrite` on a released entry adds no ticket.
  - Take runs after `prepareModel` and `host.addChild`, before `view.mount`.
  - `receiveCarriedState` validates the shape (Q22).
- **One-shot / expiry:**
  - Take deletes the entry.
  - TTL is 1500 ms (shorter than `CLAIM_WINDOW_MS` = 3000).
  - An empty capture deletes the key (the Add case, measured L15 / G5).
  - The `used` WeakSet is separate from SC-602's set, so the two carries do not consume each other's tickets.
- **Plugin reload:**
  - The state is module-level, but Obsidian re-evaluates `main.js` on enable, so a new instance starts with an empty Map.
  - The old CM extension is unregistered with the plugin.
  - Only LOW-3's retention applies within a session.

## 6. SC-607 (dse origin/develop `c329ff35`) vs this branch (read-only, per the owner's mid-task request)

- `git diff dcc53f0f c329ff35 -- src/framework/host/` touches `ReadingModeBlockHost.ts` (+175), `hoverLinks.ts` and `lineMap.ts`. The changes cover the drawn-note snapshot (`snapshotDrawn` / `drawn*`), strict pins for embeds and hover previews of part of a note (`strictPins`, `strictIfPart`, `mapLineStrict` / `mapLineFromTail`), `metaMatchesText`, and a `seq` on `lastWrite`.
- **What this branch relies on, all unchanged:**
  - `blockKey()`
  - `lastWriteLineStart` / `this.lastWriteLine = target.lineStart` (unchanged context)
  - `registry.noteWrite` ticket creation in `replaceSource`, and `dropTicket` on no-op or failed writes
  - `ViewRegistry` (not in the diff) and `beforeRelease` / `release` order
- **One addition in `onRenderChildUnload`:** SC-607 adds `drawn = null; drawnRead = null; drawnToken = null` before the existing `registry.release(...)`. That leaves the release order unchanged, and the carry does not read those fields.
- **Trial merge** (`git merge-tree dcc53f0f c329ff35 HEAD`, output `merge-tree-c329.txt`): the only changed-in-both file is `CHANGELOG.md`, and it merges with no conflict markers. No src or test file overlaps.
- **Behaviour:** SC-607 changes where card writes from embeds and hover previews of part of a note land. The Live Preview code-block own save that SC-605 hooks is not a part-of-note path, and an LP embed adopts, so nothing is carried there (R1 G8). I expect no change in behaviour.
- **After the rebase,** re-run the battery: lifecycle gains G-S99, so the CURRENT part lists change.

## 7. Docs

- **dse CHANGELOG bullet** (`CHANGELOG.md:25-33`): true to what I measured. That covers the mouse and keyboard cases, the stepper, Reset encounter, the caret, Add clearing, no note write, no focus pull, outside edits starting empty, SC-620 named plainly, and Reading view and the sidebar unchanged. The SC-602 and SC-589 sentences were edited correctly.
- **Workspace CHANGELOG:** true, except LOW-1.
- **`.repo-docs/architecture.md`:** the new table row and the "View state across an own save in Live Preview (SC-605)" paragraph are accurate (TTL, ticket-not-focus, writtenBlockKey, pane/embed scope, take-before-mount, the hidden-copy note, SC-620). The SC-602 paragraph's stale "Not carried … SC-605" clause is removed.

## 8. Working tree

- Before:
  - dse porcelain empty, HEAD `54e37fed`.
  - Superproject ` M draw-steel-elements` (the unstaged pointer, as I found it), HEAD `2ab866bc`.
- During: the probe spec and the fixture `e2e/vaults/shipped/Initiative/zzr3-embed.md` were parked untracked. Every src revert or mutation was restored with `git checkout HEAD -- <files>` inside its own script.
- After:
  - The parked files were removed (literal paths).
  - dse porcelain is empty and `git diff --quiet HEAD` holds, at HEAD `54e37fed`.
  - Superproject ` M draw-steel-elements` only, at HEAD `2ab866bc`.
- Nothing was committed. Ignored build outputs (`main.js`, `styles.css`) were rebuilt by the runs.

Follow-ups (left alone): LOW-3 sweep (optional); INFO-3 try/catch (optional).
