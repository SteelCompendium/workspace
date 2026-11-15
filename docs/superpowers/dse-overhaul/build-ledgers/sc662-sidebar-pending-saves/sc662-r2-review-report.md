# SC-662 r2 review (reviewer R1)

**Executive summary**
- Verdict: **FIX**. The core mechanism is sound and measured in real Obsidian (OOS-1, OOS-2, OOS-3 and SC-550 all fixed; no false refusal found in 13 write-path probes; flush never lands in the wrong block, a deleted block, or twice). Two owner-ruled follow-ups show data loss on head, so per the r1 ruling they fold.
- Reviewed dse `5245240c` on `42c26272` (origin/develop re-fetched: still `42c26272`).
- Counts: CRIT 0 · HIGH 0 · MED 2 · LOW 4 · INFO 7 · OOS 3.
- MED-1: sidebar FormModal Save (pref `authoringControls`) overwrites an outside edit to the same block, silently (Reading view refuses it with the dropped-write Notice). Base and head alike. Owner ruling says fold.
- MED-2: sidebar stamina-bar (and hero) Undo toast after an outside edit to the same block: the Undo is silently lost and the card then shows numbers that are not in the note (12/30 shown, note 22/30 +4). Reading view refuses it with the Notice. Base and head alike. Owner ruling: fold if data loss; the user's Undo is lost.
- Battery at head: tsc + lint clean · jest 13467 passed / 3 skipped after shots (= 13469 / 1 in a workspace tree: +21 on base's 13448 / 1; 2 extra skips are `token-coverage`, which cannot find the workspace from my /tmp tree) · lifecycle 63/64 (G-S61 only; part 3's G-S63 failed once at load 31, then 9/9 on a re-run and G-S63 1/1 alone) · e2e `630/639 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0 / 0 / 24.
- G-S61: red at head 3 times (load 31, 3.5, 1.7) and red on clean base `42c26272` at load 1.5, same "disk read was torn" text: SC-668, not this branch.

## Findings

### MED-1 — sidebar form Save overwrites an outside edit to its block (follow-up (i))

- Where: `src/framework/host/SidebarBlockHost.ts:339` (the new guard covers `fromView: true` only) and `src/authoring/FormModal.ts:543-545` (a sidebar form has no pin, so it calls `replaceSource(body)` with no check).
- Scenario (RV-F01, real Obsidian, pref `authoringControls` on): pin a counter (max 9), open its Edit form, an outside edit sets `max_value: 7` in the same block, change `name: Health` to `Healed` in the form, Save. Note ends `name: Healed`, `max_value: 9`: the outside edit is gone, no Notice. Same on base and head.
- Reading view, same sequence (RV-F03): Save refused with "a change to a block in f-RV-F03 was not saved — the block changed on disk first.", the form stays open, `max_value: 7` kept.
- Outside edit elsewhere in the note (RV-F02 sidebar, RV-F04 Reading view): the Save lands and the outside edit stays (correct on both).
- Fix: make the sidebar form write strictly, as Reading view's `pinOnly` does: the form passes the body it opened from (`this.source`) and `SidebarBlockHost.replaceSource` refuses when `extractBody(content, info)` differs (the same `lost` path: dropped-write Notice, never rate limited for a form, form stays open). A small `BlockWriteOptions` field (e.g. `expectBody`) or a sidebar `getPin()` returning `{ body }` both fit. Add an e2e twin of RV-F01 (refused, outside edit kept) and RV-F02 (lands).

### MED-2 — Undo after an outside edit to the block is lost silently and the card shows values that are not in the note (follow-up (ii))

- Where: `src/elements/stamina-bar/view.ts:225-235` and `:245-262` (`const model = this.model` captured in the undo closure), the same shape in `src/elements/hero/view.ts:456-465` and `:483-500`. After `refreshFromOutside` replaced `this.model`, the Undo mutates the OLD model, redraws the bar from it (`updateBarDisplay(model)`), and `persist()` serializes the NEW model (no change).
- Scenario (RV-U02, real Obsidian): pinned bar 12/30, 3 of 6 Recoveries; Catch breath (note 22/30, 2 Recoveries); an outside edit sets `temp_stamina: 4`; press Undo on the toast. Note stays 22/30 +4, 2 Recoveries (the Undo never reached it), no Notice, and the card shows "12/30" with no temporary Stamina. Same on base and head.
- Reading view, same sequence (RV-U04): the Undo is refused with the dropped-write Notice and the card shows 22/30 +4 (the truth).
- Outside edit elsewhere (RV-U01 sidebar, RV-U03 Reading view): the Undo works (12/30, 3 Recoveries) on both. (On base the sidebar case only worked because the host's self-echo guard happened to swallow the change.)
- Fix: in both undo closures, refuse when the model was replaced: `if (this.model !== model) { notifyDroppedWrite(...) /* or new Notice(OUTSIDE_CLOSE_NOTICE)-style text */; return; }` before mutating, so nothing is redrawn from a dead model. Or close the live undo toast in `ElementView.refreshFromOutside` when the block changed (`liveUndo?.hide()` via a kit export). Either matches Reading view (the Undo cannot lie). Add a jest test next to PS11/PS12.

### LOW-1 — focus after a Conditions window closed by an outside edit goes to the card, not to "+ add condition"

- Where: `src/elements/conditions/panel.ts:50-63` (the add button is built with no `control` id), so `captureControlFocus` (`src/framework/kit/controlFocus.ts:82`) records `family: null` and `restoreControlFocus` falls back to the card root (`tabindex -1`).
- Scenario (RV-C01, RV-C03, keyboard open): head hands focus to `div.dse-cond-panel.dse-chrome-anchor` in the sidebar (base: `<body>`). Scott's Option 1 says focus goes to "the same control ... the one you opened the window from". The stamina bar does it right (RV-S02: `stamina.bar`). OE04 only asserts "in the sidebar, not body", so it does not see this. Hero conditions take the same path.
- Fix: give the strip's add button a control id (e.g. `control: 'cond.strip.add'`), with its manifest row and census entry, and tighten SIDE-OE04 to `focusedControl() === 'cond.strip.add'`.

### LOW-2 — a refresh in flight when the block is deleted re-adopts the old body, so the panel can stay on "Backing block not found" (new with the skip)

- Where: `src/framework/sidebar/SidebarPanel.ts:333-337` (`host.adoptViewBody(body)` after `await view.settlePendingWrite()`), with `handleAnchorLost` (`:392`) running outside the queue.
- Scenario (RJ08, jest, slow settle as PS20 stubs it): an outside edit to the block starts a refresh that waits on the view's save; the block is deleted meanwhile (panel degrades at once, `adoptViewBody(null)`); the refresh resumes and adopts the CHANGED body into a host whose view is gone; the user undoes the delete, restoring exactly that body: `body === host.loadedBody`, skipped, the panel stays on the degrade card. Base recovers (RJ08 base: `degradedAtEnd false`). The window is the settle (a write in flight) plus `prepareModel`: narrow.
- Fix: after the awaits, bail out when the view is no longer the mounted one: `if (host.lastMountedChild !== view || this.panelEl?.hasAttribute('data-dse-sidebar-unavailable')) return;` before `adoptViewBody` (or a generation counter bumped by `handleAnchorLost`). RJ08 is a ready test.

### LOW-3 — the remount branch's close-without-saving is untested by the branch

- Where: `src/framework/sidebar/SidebarPanel.ts:348-364` (`closeWindowsForOutsideEdit` + `discardPendingWrite` + the Notice in the parse-error path).
- Evidence: real Obsidian RV-E01 (conditions, "dazed" staged, an outside edit breaks the YAML): base writes the staged list over the outside text (data loss); head keeps the broken text, writes nothing, shows the Notice. Correct on head. But mutants N1 (no close in the remount branch) and N12 (no Notice there) survive every branch test (PS01-PS21, sidebarInitiative, montage/initiative outside-edit, all sidebar suites, 314 tests); only my RJ03/RJ04 kill them.
- Fix: add RJ03 (conditions) and RJ04 (stamina) from `zz-r2r1.test.ts` as PS22/PS23.

### LOW-4 — `queueExternalChange` swallows every error silently

- Where: `src/framework/sidebar/SidebarPanel.ts:371` (`.catch(() => undefined)`). Base's `void this.handleExternalChange(body)` surfaced a throw as an unhandled rejection in the console; now a refresh that throws (pipeline, a view's `update`) leaves no trace.
- Fix: `.catch((e: unknown) => console.error('Draw Steel Elements: sidebar refresh failed', e))`.

### INFO

- INFO-1 (test gap): mutant N5 (`adoptViewBody` keeps the echo record) survives every test. It matters: without that line, an outside edit back to the view's last written text (an editor undo) is swallowed as an echo, the card stays stale and the guard then refuses every press. A jest case would pin it.
- INFO-2: N6 (`closeManagedWindowsAt` returns the newest window's focus) and N14 (the host's `notifyAnchorLost` keeps `viewBody`; the panel's `handleAnchorLost` clears it too) survive: near-equivalent, no test needed.
- INFO-3 (SC-550 variant): a note card press and a sidebar press on the SAME block within 60 ms (RV-550C): one press is lost on base and head; head now shows the dropped-write Notice. This is the conflict rule, as ruled.
- INFO-4 (follow-up (iii), recoveries popover): presses then an outside edit elsewhere 50 ms later (RV-P01): base loses both presses and closes the popover; head writes both (Recoveries 5) and keeps the popover open. Outside edit to the block (RV-P02): head refuses the presses with the Notice, outside edit kept, exactly as Reading view (RV-P03). No finding.
- INFO-5: the queued refresh after the panel is removed (RJ06, RJ07; real Obsidian RV-Q01, RV-Q02): no exception, no write, no view mounted into the removed panel. `refreshFromOutside` still runs `update()` on the already-unloaded view (harmless: detached DOM, nothing loaded).
- INFO-6: `windowHandoff.ts` is additive only: two names added to an import line, `finishOutsideRefresh` appended; no existing export changed.
- INFO-7: jest in my scratch trees reads 13466 passed / 4 skipped (fresh) because `token-coverage.test.ts` skips its 2 tests outside the workspace (its map is found by a workspace-relative path). Total 13470 = the implementer's fresh 13468 + 2.

## Probe table (real Obsidian 1.14.4 e2e scratch spec, base `42c26272` vs head `5245240c`)

Every row checked the outside edit's text at the end, and the user's save in every non-conflict row. Raw records: `probe-full-{base,headp}.jsonl`, `probe-r2-{base,headp}.jsonl` (load at the runs: 6-14).

| id | scenario | base `42c26272` | head `5245240c` |
|---|---|---|---|
| RV-C01 | OOS-1: Conditions, "dazed" staged, outside edit adds "prone # sync" to the block | prone LOST, note has dazed; no Notice; focus `<body>` | prone and its comment kept, no dazed; window closed; 1 Notice; focus on the card root DIV (LOW-1) |
| RV-C02 | OOS-1: Conditions open, nothing staged, outside edit elsewhere; then dazed + Done | window closed, no Notice, focus `<body>` | window stays, no Notice; dazed + bleeding written, outside edit kept |
| RV-C03 | Conditions open, nothing staged, outside edit to the block | closed, no Notice, focus `<body>` | closed, 1 Notice, prone kept, focus card root (LOW-1) |
| RV-S01 | OOS-2: stamina 3 damage staged, outside edit elsewhere, Apply | window stays, Apply LOST (temp 5) | Apply lands (temp 2), outside edit kept, no Notice |
| RV-S02 | stamina staged, outside edit to the block (15 -> 9), Apply if open | window stays; its Apply wrote nothing | closed, 1 Notice, focus `stamina.bar` in the sidebar; 9 kept |
| RV-M050 / M250 / M700 | OOS-3: montage Log, outside edit elsewhere 50 / 250 / 700 ms later | LOST / LOST / written | written x3, outside edit kept, no Notice |
| RV-K050 / K250 / K700 | counter +, outside edit elsewhere 50 / 250 / 700 ms later | LOST / LOST / written | written x3, outside edit kept |
| RV-550A | SC-550: note card + on block B, sidebar + on block A 60 ms later | sidebar press LOST (A 1, B 3) | both (A 2, B 3) |
| RV-550B | sidebar + on A, note card + on B 60 ms later | both | both |
| RV-550C | note card + on A, sidebar + on the SAME A 60 ms later | one press lost, silent | one press lost, dropped-write Notice (INFO-3) |
| RV-XSB / XSB2 | conflict: sidebar +, outside edit to the SAME block 50 / 250 ms later | press lost, outside kept, NO Notice | press lost, outside kept, dropped-write Notice |
| RV-XRV / XRV2 | the same sequence on a Reading-view card | press lost, outside kept, Notice | same: the sidebar now matches |
| RV-T01 | two pinned Conditions: window on B with dazed, outside edit to A, then Done | window on B closed (dazed still written into B by its close) | window on B stays, no Notice; A redraws with prone; B gets dazed; ABOVE / BETWEEN / BELOW kept |
| RV-O01 | own write: stamina Apply | temp 2, no Notice | temp 2, no Notice, focus `stamina.bar` |
| RV-O02B | own write: Done, window reopened 50 ms later | reopened window gone by 1.5 s (OOS-1: anchor dropped) | same (OOS-1, not this branch) |
| RV-O03 | own write: Catch breath, stamina window opened 100 ms later | window stays through the write | same; no Notice |
| RV-F01 | FormModal: form open, outside edit to the block (max 9 -> 7), Save | outside edit OVERWRITTEN (max 9), no Notice | same (MED-1) |
| RV-F02 | FormModal, outside edit elsewhere, Save | lands, outside kept | same |
| RV-F03 / F04 | Reading view: to the block / elsewhere | refused with Notice, form stays, outside kept / lands | same |
| RV-U01 / U03 | Catch breath, outside edit elsewhere, Undo (sidebar / Reading view) | works / works | works / works |
| RV-U02 | sidebar: Catch breath, outside edit to the block (temp 0 -> 4), Undo | Undo lost silently; card shows 12/30, note 22/30 +4 | same (MED-2) |
| RV-U04 | Reading view, the same | Undo refused with Notice, card true | same |
| RV-P01 | popover: two + presses, outside edit elsewhere 50 ms later | both LOST (Recoveries 3), popover closed | both written (5), popover stays |
| RV-P02 / P03 | popover presses, outside edit to the block (sidebar / Reading view) | sidebar lost silently; RV refused with Notice | sidebar refused with Notice (= RV) |
| RV-R01 | guard: two own presses 100 ms apart | 3 | 3 |
| RV-R01B | three own presses 420 ms apart | 4 | 4 |
| RV-R02 | outside edit to the block, own press 600 ms later | written | written, no Notice |
| RV-R03 | `collapsible:` + `prefs:` wrapper keys, two Catch breaths | both written (prefs map dropped: OOS-3) | same, no refusal |
| RV-R04 | CRLF note, two presses 600 ms apart | 3, CRLF kept | 3, CRLF kept |
| RV-R04B | CRLF: press, edit elsewhere 50 ms later, press | first press LOST (2) | both (3) |
| RV-R05 | unterminated fence at EOF | cannot be pinned (OOS-2) | same |
| RV-R06 | paragraphs inserted above the block 50 ms after a press | press LOST | written |
| RV-R06B | block moved above, press 600 ms later | written | written |
| RV-R07 / R07B | block in a callout: press + edit elsewhere 50 ms / two presses | LOST / 3 | written / 3 |
| RV-R08 | press, edit elsewhere at 50 ms, press at 150 ms | 2 | 3 |
| RV-Q01 | outside edit to the block, sidebar closed the same tick | no error, outside kept | same |
| RV-Q02 | press, outside edit to the block 50 ms later, sidebar closed right after | outside edit OVERWRITTEN by the press | press refused (Notice), outside kept |
| RV-Q03 | press, outside edit DELETES the block 50 ms later | nothing written, other block intact, panel degrades | same |
| RV-Q04 | Conditions dazed staged, outside edit deletes the block | nothing written, window closed | same |
| RV-W01 | press on A, outside edit swaps A and B 50 ms later | press LOST | lands in A (now second) |
| RV-W02 | press on A, outside edit duplicates A (same anchor) | press LOST | lands in the first copy |
| RV-E01 | Conditions dazed staged, outside edit breaks the YAML (remount branch) | staged list written OVER the outside text, panel degrades | outside text kept, nothing written, 1 Notice, error card |
| RV-E02 | stamina staged, outside edit breaks the YAML | outside kept, window closed, no Notice | outside kept, window closed, 1 Notice |
| RV-E03 / E04 | initiative variants | not run: my fixture did not draw `init.cond.add` in the sidebar (probe defect, both trees) | not run |

jest probes (`zz-r2r1.test.ts` on the branch's harness): RJ01 hero Conditions window + outside edit to the hero block (head: closed, Notice, nothing staged written; base red), RJ02 hero Conditions + edit elsewhere (head: stays, Done writes; base red), RJ03 / RJ04 remount branch (head green, base red), RJ05 press + broken YAML in the same block (head keeps the outside text; base overwrote it), RJ06 / RJ07 queue after `removePanel` (no throw, no write, no view mounted; both trees), RJ08 (head: panel stuck on the degrade card; base recovers; LOW-2).

## Battery at head (`5245240c`, scratch tree `sc662-r2-R1/head`)

Run sequentially by `battery-r2.sh` (each gate through a script file, rc to its own file; summary lines read as truth).

| gate | result | load (1 min) at start / end |
|---|---|---|
| tsc (incl. `-p e2e`) | rc 0, clean | 18.7 / 15.3 |
| lint | rc 0, clean | 15.3 / 12.0 |
| jest (fresh) | 13466 passed, 4 skipped, 13470 total | 12.0 / 11.8 |
| jest (after shots) | 13467 passed, 3 skipped (the 2 extra skips: `token-coverage` cannot locate the workspace map from /tmp) | 7.2 / 23.5 |
| lifecycle part 1 | 21/21 | 11.8 / 1.6 |
| part 2 | 16/16 | 1.6 / 8.9 |
| part 3 | 8/9 (G-S63 FAIL "(a) counter in a callout: the fallback ran ... the normal off/on must not rebuild the note") at load 31; G-S63 alone 1/1 (load 29 -> 14); full part 3 re-run 9/9 (load 1.2 -> 3.6) | 8.9 / 31.4 |
| part 4 | 3/4 (G-S61 FAIL "(c) ... disk read was torn in 10 frames in a row") ; re-run 3/4 (G-S61 FAIL (a), torn 10) at load 3.5 -> 1.5; G-S61 alone at head 0/1 (torn 4, load 1.7 -> 1.0); **G-S61 alone on clean base `42c26272` 0/1 (torn 8, load 1.5 -> 1.7)** | 31.4 / 3.6 |
| part 5 | 7/7 | 3.6 / 1.9 |
| part 6 | 4/4 | 1.9 / 1.2 |
| part 7 | 3/3 | 1.2 / 1.3 |
| lifecycle union | 63/64: only G-S61, red on clean base too (SC-668); lifecycle runs on Obsidian 1.15.1 on this host | |
| e2e (full) | `630/639 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` | 1.3 / 6.5 |
| shots | 592 PNGs; button host-leak 163/978; modal button host-leak 40/240; capture clip 147 | 6.5 / 7.2 |
| freeze | `freeze OK (280/280 ...)` | 7.2 |
| parity (last gate) | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` | 7.2 |

## Vacuity and mutants

- Red on base, jest: the branch's `sidebarPendingSave.test.ts` copied onto `42c26272`: 15 of 21 red (PS01-PS05, PS08-PS14, PS17-PS19), PS06/07/15/16/20/21 green as controls. Matches the implementer.
- Red on base, e2e: SIDE-OE01..OE08 with their fixtures on `42c26272`: 8 of 8 red.
- My mutants (jest: the branch's tests + every sidebar / form-save suite + montage/initiative outside-edit + my `zz-r2r1.test.ts`; RJ08 fails on unmutated head, so it is ignored in this column):

| mutant | what it breaks | killed by |
|---|---|---|
| N1 remount branch does not close the windows | `SidebarPanel.ts:348` | only R1's RJ03, RJ04 (branch tests: SURVIVE; LOW-3) |
| N2 no stale-write guard | `SidebarBlockHost.ts:339` | PS03, PS04, RJ05 |
| N3 no unchanged-block skip | `SidebarPanel.ts:306` | PS05, PS09, PS11, PS17, PS18, sidebarInitiative S08, RJ02 |
| N5 `adoptViewBody` keeps the echo record | `SidebarBlockHost.ts:268` | SURVIVES (INFO-1) |
| N6 newest window's focus | `managedModal.ts` `closeManagedWindowsAt` | SURVIVES (INFO-2, near-equivalent) |
| N11 a form write also becomes the view body | `SidebarBlockHost.ts:375` | SC-509 / SC-518 sidebar form-save tests |
| N12 remount branch shows no Notice | `SidebarPanel.ts:364` | only RJ03, RJ04 (branch tests: SURVIVE; LOW-3) |
| N13 `handleAnchorLost` keeps the loaded body | `SidebarPanel.ts:392` | sidebarInitiative "SC-288 r2 (LOW-2)" |
| N14 host `notifyAnchorLost` keeps `viewBody` | `SidebarBlockHost.ts:445` | SURVIVES (INFO-2, the panel clears it too) |
| N15 `refreshFromOutside` does not discard | `view.ts` `refreshFromOutside` | PS08 |

The implementer's M1-M12 were not re-run individually; N2, N3, N13, N15 overlap M5, M2, M12, M6 and agree with the report. Logs: `mut-<name>.log`, summary `mutants.out`; the mut tree was restored after each (`git status` clean apart from my untracked `zz-r2r1.test.ts`).

## Out of scope (OOS)

- OOS-1 (MED, pre-existing, base too): a pinned `ds-conditions` loses its `_dse_anchor` on its first own save (Done), so the panel degrades to "Backing block not found" right after the save, and the window re-opened from it closes. RV-O02B / RV-O02C, base and head; the note after the write has no `_dse_anchor` line (bundles `bundles/head-RV-O02C`, `bundles/base-RV-O02C`). SIDE-OE05 passes because it never looks at the panel after Done. The conditions model/serializer needs the `_dse_anchor` passthrough the file header of `SidebarBlockHost.ts` says every persisted element has. Separate ticket.
- OOS-2 (INFO, pre-existing): a block in an unterminated fence at EOF cannot be pinned at all (RV-R05 times out waiting for the panel on base and head), so the guard cannot be exercised there.
- OOS-3 (INFO, pre-existing, base too, Reading view too): a `prefs:` map whose keys are all rejected (`staminaRecoveryPopover`, `collapsibleDefault`) is deleted from the block by the first write (RV-R03, RV-R03C, RV-R03RV). By design per `prefOverrides.ts` (warned and ignored), but it removes author text; for SC-652 (owns that file) to judge.

## Artifacts

All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc662-r2-R1/`:

- probe specs: `zz-r2r1-probes.e2e.ts` (e2e), `zz-r2r1-jest.test.ts` (jest; copied as `test/dom/framework/zz-r2r1.test.ts` into the scratch trees)
- probe results: `probe-full-base.jsonl`, `probe-full-headp.jsonl`, `probe-r2-base.jsonl`, `probe-r2-headp.jsonl`; logs `probe-*.log`, `probe-*.rc`, `probe-*.meta` (load)
- jest probes: `jest-rj-head.log`, `jest-redbase.log` (branch tests + RJ on base), `jest-subset-head.log`
- red on base e2e: `e2e-redbase.log`
- mutants: `mut.py`, `mutants.sh`, `mutants.out`, `mut-N*.log`
- battery: `battery-r2.sh`, `bat.progress`, `bat-<gate>.log` / `.rc`; lifecycle re-runs `life-part3-head-r2.*`, `life-part4-head-r2.*`, `life-gs61-base-1.*`, `life-gs61-head-2.*`, `life-gs63-head-1.*` (each `.meta` has `uptime` before and after)
- failure bundles copied out: `bundles/head-RV-O02C`, `bundles/base-RV-O02C` (OOS-1: the note without `_dse_anchor` in `vault-copy/Probe/o02c.md`), `bundles/head-RV-R05`
- lifecycle FAIL temp dirs (kept by the harness): `/tmp/dse-obsidian-lifecycle-myTqqr` (G-S63, part 3), `/tmp/dse-obsidian-lifecycle-Mc1rnT` (G-S61, head re-run)
- scratch worktrees (detached, registered with the dse repo; left in place, not removed): `head`, `headp`, `base`, `mut`. The reviewed worktree is untouched: `git status --porcelain` empty before and after, HEAD `5245240c`.

## r4 re-review

**Summary**
- Verdict: **LAND**. Every r2 fold is fixed and measured in real Obsidian on head `944fda6a` (rebased on develop `bab0dbb2`; origin/develop re-fetched, still `bab0dbb2`). `git range-diff`: r1 commits 1, 3-6 identical (`=`); only c3d62639 changed (the SC-652 conflict in `handleExternalChange`).
- Counts (new in r4): CRIT 0 · HIGH 0 · MED 0 · LOW 1 (latent) · INFO 3 · OOS 1.
- LOW-5 (latent): the hero's "Edit definition" form is opened on `serializeStateSplice()`, not on the block's text, and that is now its `expectBody`: in the sidebar a hand-written hero's Save would be refused with a false "changed on disk first" Notice. Not reachable today (OOS-4 keeps the Save disabled for every pinned hero).
- OOS-4 (pre-existing, base too): the Edit form of any pinned (anchored) block whose schema forbids extra keys cannot be saved: the form validates `_dse_anchor` ("#/additionalProperties").
- Battery at head: tsc + lint rc 0 · jest 13651 / 3 skipped (= 13653 / 1 in a workspace tree; `token-coverage` 2 env skips) · lifecycle **64/64** (all seven parts green, G-S61 green at load 3.6-7) · e2e full: run 1 `635/646 ok, 2 failed` (SET-X03, SET-X04: SC-657 known flakes, coverage 416/418 because of them), re-run `637/646 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs` · shots 592, 163/978, 40/240, clip 147 · freeze 280/280 · parity 0 / 0 / 24.
- Mutants: 10 run on the branch's own tests (not R1's): 9 killed, including my r2 survivors N1, N12, N5 and the new N16, N18-N22. N17 survives: an equivalent mutant (INFO-9).

### r4 probe results (real Obsidian e2e, base `bab0dbb2` vs head `944fda6a`; raw `probe-r4-base.jsonl`, `probe-r4-headp.jsonl`, hero `probe-r4hero3/4.jsonl`, `probe-r4hero-base.jsonl`)

| ask | probe | base `bab0dbb2` | head `944fda6a` |
|---|---|---|---|
| 1 MED-1 | RV-F01 sidebar form, outside edit to the block, Save | outside edit OVERWRITTEN | refused with the dropped-write Notice, form stays open, max 7 kept (= RV-F03) |
| 1 | RV-F02 / F03 / F04 | lands / RV refused / RV lands | same |
| 1 no false refusal | RV-F05 (+ pressed, pencil 50 ms later inside the debounce, Save) · F06 (block moved by an edit above while the form was open) · F07 (CRLF note) · F08 (block in a callout) · F09 (`collapsible:` + `prefs:` wrapper keys) · F10 (two Saves back to back) | all land | all land, no Notice; F05 keeps the press (2), F07 keeps CRLF, F08 keeps `> `, F09 keeps both wrapper keys |
| 2 MED-2 | RV-U02 stamina: Catch breath, outside edit to the block, Undo | Undo lost silently, card shows 12/30 (note 22/30 +4) | refused with the Notice, card shows 22/30 +4 (= RV-U04) |
| 2 | RV-U07 Recoveries marker set, outside edit to the block, Undo | lost silently, card wrong | refused with the Notice, card true |
| 2 no false refusal | RV-U01 (edit elsewhere), RV-U05 (sidebar, no outside edit), RV-U06 (Reading view, no outside edit), RV-U03 (RV elsewhere) | Undo works | Undo works, no Notice |
| 2 hero | RV-HU2 hero Catch breath, outside edit to the block (47 -> 20), Undo | note 20, card shows 31/48 | refused with the Notice, card 20/48 |
| 2 hero | RV-HU1 (edit elsewhere), RV-HU3 (no edit) | Undo works | Undo works, no Notice |
| 3 LOW-1 | RV-C01 / RV-C03 conditions, keyboard open, outside edit to the block | focus `<body>` | focus on `cond.strip.add` in the sidebar |
| 3 hero | RV-HC1 hero Conditions from `cond.strip.add`, outside edit to the hero block | (no control id) | closed, 1 Notice, dazed not written, focus `cond.strip.add` in the sidebar |
| 5 OOS-1 | RV-O02 / O02B Done, window reopened 50 ms later | reopened window closed (anchor dropped) | stays open |
| 5 | RV-O02C Done, reopen after 1 s, outside edit elsewhere | add button gone (panel degraded) | window stays through the edit, no Notice |
| 5 | RV-O05 two pinned Conditions, Done on A then on B | (not run on base) | both anchors kept, both panels live, ABOVE / BETWEEN / BELOW kept |
| 5 RV | RV-C04 Reading view, block without an anchor, dazed + Done | written | written, no anchor added, reopen works |
| 5 RV | RV-C05 Reading view, block WITH an anchor line, Done | anchor DROPPED | anchor kept |
| 7 | RV-TK1 pinned `ds-tokens`, two + presses | (not run) | tokens 5, anchor kept, panel live |
| 6 wrapper keys | RV-WK1 own Catch breath with `collapsible:` + `prefs:` | keys kept | keys kept |
| 6 | RV-WK2 own Catch breath pending, outside edit changes `prefs:` 50 ms later; then Catch breath | press lost silently; next write keeps the new prefs | press refused with the Notice (the block changed: conflict rule), outside prefs kept; the next write keeps the NEW prefs value |
| 6 | RV-WK3 outside edit changes only `collapsible: true -> false` (not skipped: the body text differs); then own Catch breath | new value kept | new value kept |
| 6 | RV-WK4 stamina window open, outside edit changes only a `prefs:` value | window stays | window closes with the Notice (INFO-10) |
| 8 montage | RV-MWK montage Log window open, outside edit changes only `collapsible:`; Log submitted | window stays, Log written | same: SC-652's plain `disk.ser` and SC-662's `ownsOutsideWindows` both hold |
| r2 regressions | RV-C02, S01, S02, M050-M700, K050-K700, 550A-C, XSB/XRV, T01, O01, O03, P01-P03, R01-R08, Q01-Q04, W01-W02, E01-E02 | as r2 base | identical to r2 head (no regression) |

jest: R1's `zz-r2r1.test.ts` at head 8/8 (RJ08 now recovers: `degradedAtEnd false`).

### r4 findings

- **LOW-5 (latent) — hero Edit definition `expectBody` is not the block's text.** `src/elements/hero/view.ts:259-261` opens the form on `this.model.serializeStateSplice()`; `src/authoring/FormModal.ts:555` sends that as `expectBody`; `SidebarBlockHost.ts:345` compares it with `extractBody(content, info)`. A hand-written hero (flow-style `stamina: { current: 31, temp: 0 }`, a comment in `state:`) never equals the splice, which re-emits `state:` in block style (RV-HF2 shows the plugin's format). The Save would be refused with "the block changed on disk first" when nothing changed. Not reachable today: OOS-4 disables the Save of every pinned hero (RV-HDBG2, head and base). Fix: give the strict check the body the form was opened from on disk, not the form's seed, e.g. `FormModal` takes `expectBody` as an option, set by `openFormEditor` from `cx.host.currentBody?.()` (sidebar) at open time, falling back to `source`. One jest case: hero Edit definition in the sidebar on a flow-style block, Save lands.
- **INFO-8** (no false refusal found): F05-F10, U01/U03/U05/U06, HU1/HU3, R01-R08 all write; the strict form write and `undoIsStale` never fired on an own-write path.
- **INFO-9**: mutant N17 (the SC-652 wrapper rebuild applied BEFORE the settle, i.e. the rebase resolution reversed) survives every test. It is equivalent in practice: whenever the refresh path is reached the block text changed, so the pending own write that the settle flushes is always refused by the host and never serializes with either wrapper. The ordering I1 chose is the safe one; no test needed.
- **INFO-10**: an outside edit that only changes a wrapper key (`prefs:` / `collapsed:` / `collapsible:`) is a changed block for the sidebar: a stamina / conditions window closes with the Notice (RV-WK4) and a pending press is refused (RV-WK2), while montage / initiative keep their window because their own SC-650 / SC-608 rule compares models (RV-MWK). Both follow the ruled behaviour of their element; noted for Scott if he wants one rule.

### OOS (r4)

- **OOS-4 (MED as its own ticket, pre-existing, base `bab0dbb2` too):** the block edit form validates the raw block including the sidebar's `_dse_anchor` line, so for any anchored block whose schema has `additionalProperties: false` (hero proven: RV-HDBG2 "#/additionalProperties: must NOT have additional properties", Save disabled, head and base; by the same code path conditions, resource, surges, tokens, roll) the form can never be saved once the block has been pinned. `pipeline.ts`'s `dataForSchemaValidation` strips the anchor for rendering; `FormModal`'s validation does not. Affects Reading view too for a block that was ever pinned. Separate ticket (it touches the form's validation, not SC-662's refresh).

### r4 battery (scratch tree `sc662-r2-R1/head` at `944fda6a`; `battery-r4.sh`, logs `r4bat-*.log` / `.rc`, progress with load in `r4bat.progress`)

| gate | result |
|---|---|
| tsc, lint | rc 0, rc 0 |
| jest | 13651 passed / 3 skipped / 13654 (fresh and after shots) = 13653 / 1 in a workspace tree |
| lifecycle | 21/21, 16/16, 9/9, 4/4 (G-S61 green, load 7.1 -> 3.6), 7/7, 4/4, 3/3 = **64/64** |
| e2e | run 1 (in the battery, load 9 -> 6): `635/646 ok, 2 failed, 9 known-bug, coverage: 416/418` (SET-X03 picker timeout, SET-X04 data.json left by X03: SC-657); full re-run in `headp` (load 4.4 -> 17.9): **`637/646 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs`** |
| shots | 592; button host-leak 163/978; modal 40/240; capture clip 147 |
| freeze | 280/280 |
| parity | 0 gaps, 0 undeclared, 24 declared |

### r4 mutants (branch tests only: sidebarPendingSave, montage / initiative outside-edit, all sidebar suites, formSaveRedraw, formSaveFocus, formModal, heroInSidebar, dseSidebarView, persistedAnchorPassthrough, reservedKeysKept, staminaRecoveries; unmutated 482/482)

| mutant | killed by |
|---|---|
| N1 remount branch does not close windows | PS22, PS23 |
| N12 remount branch shows no Notice | PS22, PS23 |
| N5 `adoptViewBody` keeps the echo record | PS25 |
| N16 SC-652 wrapper rebuild never applied on a refresh | sidebarInitiative "SC-652: an outside edit adds an unknown pref and `collapsed: yes`", "an externally-injected prefs: key does not leak" |
| N17 wrapper rebuild before the settle | SURVIVES (equivalent, INFO-9) |
| N18 `undoIsStale` never refuses | PS26, PS30 |
| N19 no `expectBody` check in the host | SF01 |
| N20 no bail after the settle | PS24 |
| N21 conditions serialize drops the anchor | PS28, persistedAnchorPassthrough (conditions) |
| N22 tokens serialize drops the anchor | persistedAnchorPassthrough (hero-tokens) |

### Other checks

- SC-652 conflict: `handleExternalChange` keeps SC-652's `withReservedKeys` rebuild from the same `prepareModel` read and applies it after the settle (`SidebarPanel.ts` `nextSerializer`), before `refreshFromOutside`; the remount branch gets a fresh serializer from `pipeline.run`. `montage/view.ts` and `initiative/view.ts` differ from develop only by the 5-line `ownsOutsideWindows()` hunks; SC-652's plain `disk.ser` is intact. `pipeline.ts`, `collapsedKey.ts`, `prefOverrides.ts`: not touched by the branch. `windowHandoff.ts`: unchanged since r2 (additive only).
- Reviewed worktree untouched: `git status --porcelain` empty, HEAD `944fda6a`. My scratch trees `head`, `headp`, `mut` moved to `944fda6a`, `base` to `bab0dbb2` (detached, left in place).

### r4 artifacts (under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc662-r2-R1/`)

- probe spec `zz-r2r1-probes.e2e.ts` (r4 additions at the end; the r2 version kept as `zz-r2r1-probes.r2-final.e2e.ts`); results `probe-r4-headp.jsonl`, `probe-r4-base.jsonl`, `probe-r4hero3.jsonl`, `probe-r4hero4.jsonl`, `probe-r4hero5.jsonl`, `probe-r4hero-base.jsonl`, logs `probe-r4*.log`
- jest probes `jest-rj-r4.log`; mutants `mut.py`, `mutants-r4.sh`, `mutants-r4.out`, `mut4-N*.log`
- battery `battery-r4.sh`, `r4bat.progress`, `r4bat-*.log` / `.rc`; e2e re-run `e2e-full-headp.sh`, `r4-e2e-rerun.log`, `r4-e2e-rerun.rc`, `r4-e2e-rerun.meta`

## r6 re-review

**Summary**
- Verdict: **LAND**. The r5 delta `944fda6a..5774613e` (5c2cecfb, b76e1e0b, 0b053f1f, 5774613e) folds OOS-4 and LOW-5 correctly, measured in real Obsidian against base `bab0dbb2`. Nothing found blocks it.
- Counts (new in r6): CRIT 0 · HIGH 0 · MED 0 · LOW 1 (a code-read race, LOW-6) · INFO 5.
- Battery at `5774613e`: tsc + lint rc 0 · jest 13665 / 3 skipped (= 13667 / 1 in a workspace tree) · lifecycle 63/64 (G-S61 only, the SC-668 "disk read was torn" text; red again alone at load 2.5) · e2e `639/648 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs` · shots 592, 163/978, 40/240, clip 147 · freeze 280/280 · parity 0 / 0 / 24.
- **The branch moved while I reviewed.** The worktree HEAD is now `86a40ed9`: SC-662 rebased onto develop `d62f0b26` (SC-656 landed; not my doing). `git range-diff bab0dbb2..5774613e d62f0b26..86a40ed9`: 13 of 15 commits are `=`. Commit 2 (`windowHandoff.ts` import merge plus where `finishOutsideRefresh` is appended) and commit 4 (docs) carry the SC-656 conflict context only. At `86a40ed9` I ran tsc + lint rc 0; jest 13707 / 4 skipped (includes my 8 RJ probes; no shots cache in that tree); e2e full `658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs`. I did NOT re-run lifecycle, shots, freeze or parity at `86a40ed9`.
- Mutants: S1, S2, S3 killed by branch jest. S2b (no put-back of the anchor into `checked`) survives: it has no observable effect. My S4 (`expectBody` read at Save instead of at open) survives jest but is killed by e2e SIDE-OE09 (INFO-11).

### r6 probes (real Obsidian; base `bab0dbb2` vs head `5774613e`; raw `probe-r6-base.jsonl`, `probe-r6-headp.jsonl`)

| ask | probe | base | head |
|---|---|---|---|
| RV-HDBG2 / pinned hero Save | RV-HF1, RV-HF11: pinned hand-written hero (flow-style `characteristics` and `stamina`, a `# hand note` comment in `state:`), Edit definition, rename, Save | Save disabled: "#/additionalProperties" | lands, no Notice, form closes, `_dse_anchor` kept, panel live |
| hand-written hero refused when the block really changed | RV-HF12: form open, outside edit `recoveries: 4   # sync`, rename, Save | Save disabled | refused with the dropped-write Notice, form stays open, outside edit kept |
| | RV-HF14: outside edit ELSEWHERE, Save | disabled | lands, outside edit kept |
| form opened inside the debounce right after an own press | RV-HF13: hero Catch breath, Edit definition 50 ms later, rename, Save | disabled | lands; the press is kept (47 / 5 Recoveries); no Notice. RV-F05 (counter, r4) still green |
| Reading view | RV-HF15: Reading view hand-written hero with an anchor line, Save | disabled | lands, anchor kept |
| pinned conditions / resource | RV-CF1: sidebar conditions pencil, add dazed, Save | disabled | lands, anchor kept, panel live, the strip window opens afterwards. Resource: e2e SIDE-OE11 / OE12 green in the full run; RV-UK3 (Reading-view resource with an anchor): Save lands, anchor kept |
| a block with NO anchor | RV-CF2: Reading view conditions, no anchor, pencil, add dazed, Save | lands, no anchor | same: no anchor added |
| a real unknown key next to the anchor | RV-UK1 (Reading view), RV-UK2 (sidebar): `ds-resource` with `bogus: 1` beside `_dse_anchor` | error card ("#/additionalProperties"), no pencil | same: the render path still refuses it, so the form is never reachable. The form-level case (unknown key typed into a form) is jest-only (I1's six formModal "still disables Save" cases, killed by S1). |
| a user-typed `_dse_anchor` with a bad value | RV-BA1 `[1, 2]`, RV-BA2 `{ a: 1 }`, RV-BA3 `""` (Reading view conditions) | the card draws (the render path already skipped the anchor since D7); form Save disabled | the card draws; form Save enabled; the value is written back re-stringified (`[1, 2]` -> a block list). INFO-13 |
| r2/r4 regressions | every earlier RV-* probe (79 records) | — | byte-identical to the r4 head records |

### r6 findings

- **LOW-6 (code-read, not reproduced: a narrow race, hero only).**
  - The hero's Edit definition form is seeded from the MODEL (`serializeStateSplice()`), but its strict `expectBody` is now the host's cached DISK body at open (`FormModal.ts` constructor, `currentBody()`).
  - The sidebar host updates that cache as soon as an outside modify is read. The panel's refresh, which replaces the model, follows a few ms later (queued, after `prepareModel` and the settle).
  - A form opened in that gap is seeded with the OLD state but expects the NEW body. Its Save therefore passes the strict check and writes the old state over the outside edit. The refresh does not close a FormModal.
  - The generic pencil is safe because its seed is `currentBody()` too.
  - Fix: take `expectBody` from what the view last loaded or wrote, `(host as SidebarBlockHost).loadedBody`, falling back to `currentBody()`, then to the seed. The model and the expectation then come from the same text, and every r6 probe above keeps its result (`loadedBody` equals the disk body whenever the card is up to date). The owner may DROP this given the window (a click within tens of ms after an outside edit lands).
- **INFO-11 (test gap): S4 survives jest.** S4 reads `expectBody` at Save time, which makes the strict check vacuous. It survives because SF01 / SF04 make the outside edit with `vault.setFile` and never fire `modify`, so the host's cache never learns of it, unlike the real vault. Only e2e SIDE-OE09 kills S4 (verified: `max_value` 3 written over the outside 7). e2e is a required gate, so it is covered. Firing `env.fireModify` in SF01 / SF04 would make jest catch it too.
- **INFO-12**: S2b (the anchor not put back into `checked`) is effectively equivalent: `checked` only feeds the preview parse and the validator.
- **INFO-13**: a user-typed `_dse_anchor` with a non-id value is now accepted by the form, exactly as the render path has always accepted it; the form never introduces one and writes back what the user typed.
- **INFO-14**: the hero's Edit definition Save normalises a hand-written block: flow style becomes block style, the `# hand note` comment in `state:` is dropped, and defaulted `resource`, `surges` and `victories` keys are written. This is the form's existing Reading-view behaviour (pre-r5, an unpinned hero did the same), now reachable for pinned heroes. Mention to Scott if comment loss matters.
- **INFO-15**: the branch was rebased onto `d62f0b26` during this review; see the summary for what was and was not re-run at `86a40ed9`.

### r6 mutants (branch tests: as r4 plus `test/dom/authoring`; unmutated 841/841)

| mutant | result |
|---|---|
| S1 no anchor strip | killed: SF03, SF04, six formModal "Save is enabled and writes the anchor line back" |
| S2 strip also removes the anchor from `working` | killed: SF03 and the six formModal cases |
| S2b no put-back into `checked` | survives (INFO-12) |
| S3 `expectBody` is the seed | killed: SF03 |
| S4 `expectBody` read at Save | survives jest; killed by e2e SIDE-OE09 (`mut-e2e-S4.log`; the mut tree restored) |

### r6 battery (`battery-r6.sh` in the scratch `head` tree at `5774613e`; `r6bat.progress` has load per gate)

| gate | result |
|---|---|
| tsc, lint | rc 0, rc 0 |
| jest | 13665 passed / 3 skipped / 13668 (fresh and after shots) |
| lifecycle | 21/21, 16/16, 9/9, **3/4** (G-S61 FAIL "(a) LP callouts, upper then middle: the recorder's disk read was torn in 6 frames in a row", load 2.1 -> 4.9), 7/7, 4/4, 3/3 = 63/64; G-S61 alone re-run 0/1 at load 2.5 ("(b) ... torn in 6"). SC-668, red on base too (r2) |
| e2e | `639/648 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs` (first run, no flake) |
| shots | 592; 163/978; 40/240; clip 147 |
| freeze | 280/280 |
| parity | 0 / 0 / 24 |
| at `86a40ed9` (rebased) | tsc rc 0, lint rc 0, jest 13707 / 4 (with my 8 RJ tests, no shots cache), e2e `658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs` (load 27 -> 6) |

### r6 artifacts (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc662-r2-R1/`)

- probe spec `zz-r2r1-probes.e2e.ts` (r6 additions at the end; the r4 version kept as `zz-r2r1-probes.r4-final.e2e.ts`); results `probe-r6-headp.jsonl`, `probe-r6-base.jsonl`, logs `probe-r6-*.log`
- mutants `mut.py`, `mutants-r6.sh`, `mutants-r6.out`, `mut6-S*.log`, `mut-e2e-S4.sh`, `mut-e2e-S4.log`, `mut-e2e-S4.rc`
- battery `battery-r6.sh`, `r6bat.progress`, `r6bat-*.log` / `.rc`; G-S61 re-run `life-gs61-r6-rerun.*`; lifecycle FAIL dir `/tmp/dse-obsidian-lifecycle-js1XKe`
- rebased head `86a40ed9`: `r6-new-head.sh`, `r6new-tsc.*`, `r6new-lint.*`, `r6new-e2e.log` / `.rc`, `r6new.meta`, `jest-r6new-full.log` / `.rc`
- reviewed worktree: not touched by me (`git status --porcelain` empty); its HEAD moved to `86a40ed9` through a rebase someone else ran. Scratch trees: `head` at `5774613e`; `headp`, `mut` at `86a40ed9`; `base` at `bab0dbb2`.

## r8 check

- Verdict **LAND** at dse `129beb18` (on develop `d62f0b26`), with one LOW the owner may drop. (1) LOW-6 fix read, and jest green: SF05, formModal, formSaveRedraw, every sidebar suite and the montage / initiative / negotiation outside-edit suites (792/792). Mutant T1 (`currentBody` first) is red on SF05. Real Obsidian (`probe-r8*.jsonl`): HF13 (Catch breath, then Edit definition 50 ms later: the press is kept and the Save lands), F05, F13 (pencil 0 ms after a press) and F12 / HF17 (a second form 20 ms after the first Save) all land; F01 and HF12 are still refused.
- **LOW-7 (new in r7, below human click speed).** For the generic pencil, `loadedBody` lags a FORM write (not a view write) until the panel's refresh adopts it, a few ms. A second pencil form opened in that gap is seeded from `currentBody()` (the new text) but expects `loadedBody` (the old text). Its Save is then refused with a false "changed on disk first" Notice, and pressing Save again does not help (RV-F11: refused 2 of 2 at `129beb18`, lands at `86a40ed9`; at 20 ms it lands).
  - Fix: expect the seed when the seed is the disk text, and `loadedBody` only otherwise (the hero), e.g. `expectBody = source === host.currentBody?.() ? source : (host.loadedBody ?? host.currentBody?.() ?? source)`. SF05 stays red under T1 with this.
- (2) Both conflict resolutions are whole. The `windowHandoff.ts` import line is develop's (`captureControlFocus`, SC-656) plus `restoreControlFocus` and the `ControlFocusRules` type. Every SC-656 export (`rememberFocus`, `FocusMemory`, `handOffAfterOutsideRedraw`, `handOffAfterOutsideClose`, ...) is untouched, with `finishOutsideRefresh` appended. The `architecture.md` `windowHandoff.ts` row equals develop's row plus the one SC-662 phrase (checked by string compare). The SC-656 suite `negotiation-outside-edit.test.ts` is green.
- Artifacts (scratch `sc662-r2-R1/`): `r8-jest.sh`, `r8-jest-head.log`, `r8-jest-T1.log`, `probe-r8.jsonl`, `probe-r8b.jsonl`, `probe-r8-prev.jsonl` (the `86a40ed9` control), `zz-r2r1-probes.e2e.ts` (r8 tests at the end). Reviewed worktree untouched (`git status` empty).
