# SC-662 r1 implementation report (implementer I1)

**Executive summary**
- Verdict: DONE_WITH_CONCERNS. One lifecycle scenario, G-S61, is red at the head and ALSO red on clean base `42c26272` on this host (the recorder's "disk read was torn" check; nothing to do with the sidebar). Everything else is green.
- Final dse sha `5245240c` on branch `sc662-sidebar-pending-saves`, on `42c26272` (origin/develop re-fetched, unchanged). Nothing pushed.
- Battery at `5245240c`: tsc + lint clean; jest **13468 passed / 2 skipped** (fresh worktree, no shots cache; base fresh 13447/2, +21 tests); lifecycle **63/64** (parts 1-3, 5-7 all green: 21+16+9+7+4+3; part 4 3/4, G-S61 red on head twice and on base once); e2e **`630/639 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs`** (+8 tests, no new pair); shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147; freeze **280/280**; parity **0 / 0 / 24**.
- Red on base (`42c26272`, final tests): jest **15 of 21** (PS01-PS05, PS08-PS14, PS17-PS19; PS06, PS07, PS15, PS16, PS20, PS21 are controls that already pass), e2e **8 of 8** (SIDE-OE01..OE08). SC-550 reproduced on base (SIDE-OE02: sidebar press lost) and fixed.
- Mutants: 12 run, all 12 killed by a named test (M8 and M11 first survived; PS20 and PS21 were added and kill them).
- Conflict case measured in real Obsidian first: a Reading-view card keeps the outside edit, loses the pending press, and shows the dropped-write Notice. The sidebar now does exactly that (it used to lose the press silently).
- Census: all 22 registered elements can be pinned (experimental on); 13 are persisted, 2 of them (initiative, montage) were already handled, 4 hold windows that were broken (conditions, stamina bar, hero stamina window, hero conditions). **ds-hero CAN be pinned** and is fixed and tested. **ds-negotiation CAN be pinned** (registered alias, not deferred) and needs no change: its only popover is a native Menu whose item acts on the live `this.model`.

## Census (every element that can be pinned)

Pinning needs the experimental switch; `requestPinToSidebar` / `isMountableAlias` accept any registered alias, so all 22 can be pinned. Static and interactive elements hold no save and no window.

| element | persisted | window / popover reachable from the card | owner | close path before this ticket | status after |
|---|---|---|---|---|---|
| ds-counter | yes | none | | | (a) (b) fixed (PS01, PS05, PS07, PS21; e2e OE02, OE03) |
| ds-stamina-bar | yes | StaminaEditModal (`openManagedModal`, anchor = host container). Undo toast (Notice) after Catch breath / recoveries | the view | unload closes it; Apply/steppers write through the callback into the model object it was opened with, which the refresh replaced (OOS-2) | fixed (PS11-PS14; e2e OE06, OE07). Undo toast still holds the old model: follow-up |
| ds-conditions | yes | ConditionsModal via `openManagedModal` | child `ConditionsPanel` | child unload closes it; `onClose` persists the staged list into the replaced model (OOS-1) | fixed (PS08-PS10; e2e OE04, OE05) |
| ds-hero | yes | the sheet's StaminaEditModal (bridge model); the sheet's `ConditionsPanel` window; Edit definition is the pipeline form | view / child | same two shapes as above (code-read in the ticket) | fixed through the same shared path, jest PS18, PS19 (stamina window); the conditions window goes through the identical `panel.ts` path |
| ds-initiative | yes | Stamina pool, Conditions, free-heal, reset windows (own `activeModal`) | the view | SC-608 rule in `update()` | already handled (`sidebarInitiative` S08, INIT-W07/W08/W13); now behind the shared skip + flush too |
| ds-montage | yes | Log an action, edit sheet, Add a hero, Set limits (`openManagedModal` via `openTrackedModal`) | child component | SC-650 rule in `update()` | already handled; OOS-3 (pending Log lost) fixed (PS02, e2e OE01); PS15, PS16 pin the SC-650 behaviour through the real panel |
| ds-negotiation | yes | native `Menu` (options, Reset): not a window, no staged state; Reset acts on the live `this.model` | the view | n/a | **can be pinned; no change needed** (code read). (a) (b) apply to it like every view |
| ds-encounter | yes (`_computed` cache) | none | | | (a) (b) generic |
| ds-project, ds-party, ds-resource, ds-surges, ds-tokens | yes | none | | | (a) (b) generic |
| recoveries popover (stamina bar, hero; pref `staminaRecoveryPopover`, default off) | | DOM popover inside the card, each press writes | the strip | rebuilt with the card | not exercised; follow-up note below |
| FormModal (the edit pencil, pref `authoringControls`, default off) | | form window | pipeline, not the view | not closed by a refresh; Save writes with `fromView` false | unchanged; follow-up |
| statblock, feature, featureblock, characteristics, horizontal-rule, values-row, scc, skills, roll | no | none | | | nothing to lose |

## Design (what changed where)

All commits are in `draw-steel-elements`: `e05873bb` (red tests), `cd32bc86` (fix), `b47a92cc` + `20b823a5` (tests), `b2c7ab82` + `5245240c` (docs).

- `src/framework/sidebar/SidebarPanel.ts` `handleExternalChange` (rewritten, ~lines 289-370): changes are queued one at a time in arrival order (`queueExternalChange`). (b) a body equal to `host.loadedBody` returns at once. Otherwise the model is prepared, then (a) `view.settlePendingWrite()` writes the view's own debounced save against the block it was made from, then `view.refreshFromOutside(model)`; the remount fallback (parse error) does the same close/discard first. `mount()` and `handleAnchorLost()` set/clear the loaded body.
- `src/framework/host/SidebarBlockHost.ts`: new `viewBody` / `loadedBody` / `adoptViewBody()`; `replaceSource` refuses a VIEW write (`fromView: true`) when the block in the note is no longer `viewBody` (it reuses the existing `lost` path: dropped-write Notice, outside edit kept); a view write sets `viewBody`; `notifyAnchorLost` clears it. Form writes (`fromView` false) are not guarded.
- `src/framework/view.ts`: `discardPendingWrite()`, `ownsOutsideWindows()` (false), `closeWindowsForOutsideEdit()`, `refreshFromOutside(model)` (close windows without saving, drop what their close handlers scheduled, `update`, then `finishOutsideRefresh`).
- `src/framework/kit/managedModal.ts`: windows opened with an anchor are listed while open, with the focus token read before the window took focus; `closeManagedWindowsAt(anchor)`.
- `src/framework/chrome/windowHandoff.ts`: ADDITIVE only: `finishOutsideRefresh(root, closed, rules)` (restore focus + the one `OUTSIDE_CLOSE_NOTICE`), plus two names added to an existing import line.
- `src/elements/initiative/view.ts`, `src/elements/montage/view.ts`: `ownsOutsideWindows() { return true }` (5 lines each): their SC-608 / SC-650 handling in `update()` stays.
- Docs: `.repo-docs/integration.md` ("What a refresh may not lose"), `.repo-docs/architecture.md` (windowHandoff row pointer).

### Shared-file hunks (for SC-656)

`src/framework/chrome/windowHandoff.ts` (additive):
1. line 28-29: import line now also pulls `restoreControlFocus` (value) and `ControlFocusRules` (type) from `../kit/controlFocus`.
2. end of file (new, after `OUTSIDE_CLOSE_NOTICE`): `export function finishOutsideRefresh(root, closed: { focus: ControlFocus | null }, rules: ControlFocusRules = {}): void`.
No existing export renamed, re-signatured or changed.

`src/framework/sidebar/SidebarPanel.ts`:
1. imports: `Notice` from obsidian; `OUTSIDE_CLOSE_NOTICE` from `../chrome/windowHandoff`.
2. constructor wiring: the host's `onExternalChange` callback is now `queueExternalChange(body)`.
3. `mount()`: `host.adoptViewBody(body)` just before `pipeline.run`.
4. `handleExternalChange` body replaced (see Design), docstring gets an SC-662 paragraph; new members `externalChanges` / `queueExternalChange`.
5. `handleAnchorLost()`: one line `this.host.adoptViewBody(null)`.

Also outside `sidebar/`: `src/framework/host/SidebarBlockHost.ts` (viewBody, guard, getters), listed under Design.

## Conflict case: Reading view vs sidebar (measured, real Obsidian 1.14.4 via e2e scratch probe, counter, own press then an outside edit to the SAME block 50 ms later)

| | final note | Notice |
|---|---|---|
| Reading view (PRV-01), base | current_value 1 (press lost), max_value 5 (outside edit kept) | "Draw Steel Elements: a change to a block in counter was not saved — the block changed on disk first." |
| Reading view, edit elsewhere (PRV-02) | current_value 2 (press kept), outside edit kept | none |
| Reading view, 700 ms gap (PRV-03) | both written | none |
| Sidebar, base (PSB-01) | press lost, outside edit kept | NONE (silent) |
| Sidebar, base, edit elsewhere (PSB-02) | press LOST, outside edit kept | none (OOS-3 / SC-550) |
| Sidebar, head (SIDE-OE03 / PS03) | press lost, outside edit kept | the same dropped-write Notice |
| Sidebar, head, edit elsewhere (SIDE-OE01, PS01) | press kept, outside edit kept | none |

So Reading view does not silently lose a committed save in the conflict case (it says so), and the sidebar now matches it; no write rule was redesigned. Probe output: `.../sc662-r1-I1/probe-rv4.jsonl` and `probe-rv2.jsonl` (the probe spec is in `zz-probe-rv.e2e.ts`, scratch only, not committed).

## Integrity probes (every scenario ends by checking the outside edit's text and the user's save)

| property | test(s) |
|---|---|
| content above and below the block survives | PS01, PS17 (above, between, below), e2e OE08, OE01 |
| two pinned same-kind blocks do not cross-talk | PS17 and e2e OE08 (second block's Apply writes only its block; first block shows the outside value) |
| an outside edit to block A does not close or disturb a window on block B | PS17, OE08 (window stays, no Notice) |
| the outside edit text is present at the end of every scenario | PS01-PS04, PS08-PS12, PS17-PS19; e2e OE01-OE08 |
| the user's own save is present at the end of every non-conflict scenario | PS01, PS02, PS05, PS09, PS11, PS16-PS19, PS21; e2e OE01, OE02, OE05, OE06, OE08 |
| a close writes nothing (not even a re-serialization of the outside block) | PS08 (a YAML comment in the outside block survives), PS10 |
| two changes in quick succession end on the last | PS20 |

## Mutants (jest: sidebarPendingSave + montage-outside-edit + initiative-outside-edit + sidebarInitiative + sidebarBlockHost)

| mutant | killed by |
|---|---|
| M1 no `settlePendingWrite` before the refresh (flush) | PS03 |
| M2 no skip of an unchanged block | PS05, PS09, PS11, PS17, PS18, and sidebarInitiative S08 |
| M3 windows not closed | PS08, PS10, PS12, PS13, PS14, PS19 |
| M4 no Notice | PS08, PS10, PS12, PS14, PS19 |
| M5 no stale-write guard in the host | PS03, PS04 |
| M6 no `discardPendingWrite` after the close | PS08 |
| M7 no focus hand-back | PS13 |
| M8 no queue (changes handled concurrently) | PS20 (survived the first version of the test; PS20 now stubs a slow settle) |
| M9 view body adopted before the settle | PS03 |
| M10 no focus token captured at open | PS13 |
| M11 host does not record a view write as `viewBody` | PS21 (survived at first; PS21 added) |
| M12 `handleAnchorLost` keeps the loaded body | sidebarInitiative SC-288 r2 LOW-2 |

Logs: `.../sc662-r1-I1/mut-<name>.log`, summaries `mutants.out` (M1-M12 first run is in the individual logs; `mutants-batch2.out` is M8 and M11 re-run).

## Gate numbers

| gate | result |
|---|---|
| tsc (incl. `-p e2e`), lint | rc 0, rc 0 |
| jest, fresh worktree | 13468 passed, 2 skipped, 295 suites (base fresh 13447 / 2) |
| lifecycle | part 1 21/21, part 2 16/16, part 3 9/9, part 4 3/4 (G-S61 red), part 5 7/7, part 6 4/4, part 7 3/3 |
| e2e | `630/639 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` |
| shots | 592; host-leak 163/978; modal host-leak 40/240; capture clip 147 |
| freeze | 280/280 |
| parity | 0 gaps, 0 undeclared, 24 declared |

G-S61 (LP callouts, SC-544): `FAIL ... the recorder's disk read was torn in N frames in a row, so its stale-frame check did not run`. Head: phase (a) in the full part-4 run and in a re-run; clean base `42c26272`: phase (b) in one run. Not touched by this change (no sidebar, no modal in that scenario); lifecycle on this host reports obsidian 1.15.1. Failure temp dirs kept at `/tmp/dse-obsidian-lifecycle-QhHLcA`, `/tmp/dse-obsidian-lifecycle-mArVd6` (head), `/tmp/dse-obsidian-lifecycle-JBvUgM` (base). The brief's expected 64/64 was not reached for this reason.

## Drive-by fixes:
None.

## Follow-ups:
1. `FormModal` (authoringControls, default off) in the sidebar: not a window of the view, so a refresh does not close it, and its Save (`fromView` false) is not covered by the new stale-write guard; an outside edit to the block between open and Save can be overwritten by it. Reading view refuses that Save (`pinOnly`). Left alone: it is not a window an element holds, and the write rules are out of scope.
2. Undo toasts of the stamina bar and the hero (Catch breath, recoveries) close over the model they were made on; after an outside refresh of the block the Undo mutates the old model and writes nothing (silent). A different shape (a toast, not a window); not touched.
3. The recoveries popover (pref default off) is a DOM popover rebuilt silently by a refresh that changes the block; not exercised, code-read only.
4. G-S61 red on this host at base and head (see above): worth a ticket if it is not the known environment problem.
5. Reading view and Live Preview conditions window with an outside edit: not measured here (the ticket is the sidebar); the same `onClose` persists into the dropped-write path there.

## Artifacts

- Report: this file.
- Probe results: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc662-r1-I1/probe-rv2.jsonl`, `probe-rv4.jsonl`; probe spec `zz-probe-rv.e2e.ts` (same dir).
- Red-on-base: `jest-redbase.log`, `e2e-redbase.log`, `e2e-base1.log`, `e2e-base2.log` (earlier spec versions), (same dir).
- Battery logs `bat-*.log` / `bat-*.rc`, `battery.progress`, `bat-life4-rerun.log`, `bat-life61-base.log`; mutant logs `mut-*.log` (same dir).
- e2e failure bundles (base): `draw-steel-elements/e2e/.out/20261115-101317-41ff/` (worktree, gitignored).
