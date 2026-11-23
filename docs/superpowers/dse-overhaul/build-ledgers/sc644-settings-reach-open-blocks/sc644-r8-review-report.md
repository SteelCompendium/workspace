# SC-644 r8 review: scoped re-review of the r7 rebase delta

## Executive summary
- **Verdict: LAND.** Findings against this branch: 0 HIGH, 0 MEDIUM, 0 LOW. INFO: 3, all on develop already or describing how develop behaves. 1 follow-up, pre-existing on develop.
- Heads: dse `76644e80` on develop `3b47e55b`; superproject `e10f4e5c`. Both worktrees clean before and after this round.
- Range-diff `10c271fe..2762beb5` vs `3b47e55b..76644e80`: commits 1-7 `=` (identical). Commit 8 `76644e80` is new; I read its diff and it changes comments only (+7/-4: the doc block above `START_COLLAPSED_REACHES_OPEN_BLOCKS` and one `//` line in `live-behavioural.e2e.ts`).
- tsc (`tsc --noEmit` and `-p e2e`) rc 0; lint rc 0; jest `Tests: 1 skipped, 13897 passed, 13898 total` (expected 13897 / 1, shots cache present).
- e2e `--element=settings`: `80/82 ok, 0 failed, 2 known-bug` (SC-645 SET-L02, SC-647 SET-L03). SET-L01/L05/L06/G06 ok; SET-X03/X04 ok.
- Lifecycle, 7 parts: 21/21 + 16/16 + 9/9 + 4/4 (G-S61 green) + 7/7 + 4/4 + 3/3 = **64/64, 0 failed**.
- Extra e2e on the head (SC-652 / SC-662 / SC-656 surfaces): `--element=sidebar` 16/16; `CTR-K01,MONT-X15..X18` 5/5; `NEGO-O01..O19` 19/19. All 0 failed.
- Probes, run in my private copies and then removed: jsdom 30/30 green on the head (SC-652 shapes, O1 on non-boolean `collapsed:`, pinned sidebar, focus vs window hand-offs). The 5 sidebar feature probes fail on base `3b47e55b`, so they do detect the feature. Two new real-Obsidian e2e probes pass (2/2): a pinned card follows both settings, and a pending save survives a flip.
- Markers: zero `knownBug('SC-644'`. Develop added `setPrefs` callers in sidebar/pending-saves and negotiation/outside-edit, only in before/after hooks. Neither depends on the old `setPrefs` timing, and both ran green.

## 1. Range-diff
`git range-diff 10c271fe..2762beb5 3b47e55b..76644e80`: `1:16e60bc3 = 1:0188ef1f` … `7:2762beb5 = 7:2302b561`, and `-: > 8:76644e80`. Commit 8 changes:
- `src/framework/pipeline.ts:91-104`: the doc comment only. It cites S1 (2026-11-22), marks `false` as decided and `true` as NOT chosen and UNTESTED. The constant, its type and all code are untouched.
- `e2e/specs/settings/live-behavioural.e2e.ts:58`: `// SC-644, pending Scott's answer:` becomes `// SC-644 (Scott, 2026-11-22):`.

Judgement: no runtime change is possible from this commit. I did not rebuild for a hash because the diff is comment-only by inspection. r7 reported the same `main.js` sha256 before and after this commit.

## 2. Interaction with what develop gained

### SC-652 (write keeps `prefs:` and non-boolean `collapsed:`)
Probe `r8ProbeKeptKeys.test.ts` uses the real pipeline and a ReadingModeBlockHost over FakeVault, on a counter (chrome element) and ds-hero (raw splice). It tests 4 shapes: `prefs: compact` + `collapsed: yes`; a mixed prefs map + `collapsed: 1`; `collapsed: "true"`; and `prefs: [a, b]` + `collapsed: true`.
- Each probe flips five times (Collapsible off, Edit on, Collapsible on, Edit off, Edit on). After the flips the chrome is coherent: at most one panel and one bar. The counter has 1 Collapse and 1 pencil; the hero has 1 "Edit definition" and no generic pencil.
- The write that follows is **byte-identical to a control write made with no flips**, on all 8 cases. A second write after more flips keeps the same reserved lines. The chrome rebuild never touches `view.setSerializer`; the serializer is set once at `pipeline.ts:~575` and by SidebarPanel at `:335`. So SC-652's passthrough cannot be disturbed by our rebuild.
- The real-Obsidian SC-652 e2e on the head (CTR-K01, MONT-X15..X18) is 5/5.

### O1 on a non-boolean / passthrough `collapsed:` key
Probe R8-B tests `collapsed: yes`, `1` and `"true"`. In each case the reader collapses the block, then Collapsible is switched OFF. The block expands: no bar, no attribute. The session slot becomes `undefined` (`pipeline.ts:675-677`). Switching it ON again leaves the block expanded with 1 Collapse. The next write keeps the author's line once, and does not turn it into `collapsed: true/false`.

A second case: `collapsed: yes` with Start collapsed ON at draw time. The block is collapsed by the preference; Collapsible OFF expands it, and the session stays `undefined`. All green.

### SC-662 (pinned sidebar)
Probe `r8ProbeSidebar.test.ts` runs on the real sendToSidebar → DseSidebarView → SidebarPanel → SidebarBlockHost → ElementPipeline stack, with a fake clock.
- **S1:** a pinned counter follows both settings live. Each step has 1 root, 1 panel and 1 Unpin item.
- **S2:** a press inside the 400 ms debounce, then two flips: the press is written, and no Notice appears.
- **S3:** a press, a flip, an outside edit elsewhere and a flip back: both writes land, and the chrome is still single.
- **S4:** two outside edits on the fast path (`refreshFromOutside`, same root), then three flips: one chrome, no `console.error`, and the next press is written. Subscriptions do not pile up; the view is the same, and so is its subscription.
- **S5:** the remount branch (broken YAML, then fixed). The old root's HTML is unchanged by later flips, so the old view's subscription is gone. The new card follows, with no errors.
- **S6:** a pinned card carrying `prefs: compact` + `collapsed: yes`, with flips and then a press: both lines are kept, once each.
- **S7:** O1 on a pinned card: the reader collapses it, OFF expands it, ON leaves it expanded.
- On base `3b47e55b`, S1, S4, S5, S7 and F4 fail, so this is surface the branch adds. On the head they all pass.
- Real Obsidian, private-copy spec `r8-probe.e2e.ts`:
  - **R8E-01:** the note is open and its stamina bar is pinned. A real click on Collapsible by default (in the settings window) removes and then restores `chrome.collapse` on the pinned card AND on the note card. "Show edit button" adds the pencil to both. The pinned card ends with 1 `.dse-chrome`, 1 root and 1 Unpin.
  - **R8E-02:** a sidebar counter press and a `prefs.set('collapsibleDefault', false)` in the same task, so the flip lands inside the debounce. The press reaches the note (`current_value: 2`).
  - Result: 2/2 ok.
- Answer to the brief: pinned cards DO follow both settings live. There is no duplicate chrome, no lost pending save, and no conflict with the sidebar's own re-render.

### Focus: our restore vs windowHandoff / livePreviewFocusCarry / SC-662's finishOutsideRefresh
- `holdChromeFocus` (`focusHandoff.ts:77`) does nothing unless focus is on this block's own chrome control at flip time. Its restore (`:82`) runs only if `focusIsFree`. A window open over the block holds focus outside the root, so nothing is ever taken from it.
- **F1:** stamina window open over a pinned card, focus in its input. Two flips leave the window open and focus on the input, and the Apply is written.
- **F2:** this is PS13 (an existing SC-662 test) with a flip while the window is open. The outside edit still closes the window with 1 Notice and hands focus to the rebuilt `stamina.bar`.
- **F3:** a flip right after the outside-close hand-off: focus stays on the rebuilt bar.
- **F4:** keyboard focus on the pinned card's Collapse, then a flip of the other setting: focus goes to the new Collapse button, with one chrome.
- **F5:** a window opened with the mouse, focus inside it, two flips: focus is never pulled into the card.
- Reading-view hand-off (SC-650), probe `r8ProbeHandoff.test.ts`, which uses the `montage-outside-edit` harness:
  - **W1:** OW05 (window opened from the chrome item `montage.chrome.add-hero`) plus flips inside `HANDOFF_SETTLE_MS`. Focus goes back to the rebuilt chrome item and is still there after the settle; 1 panel, 1 Notice.
  - **W2:** the Live Preview order with a flip BEFORE the hand-off's `setTimeout(0)` act. Focus still lands on the rebuilt opener.
  - **W3:** OW01 (opener in the body) plus flips: focus stays on Log an action.
  - **W4:** the user moves focus to an outside field during the settle, then a flip: focus is not pulled back.
  - **W5:** the window is still open, then a flip: the window stays and focus stays in it.
- livePreviewFocusCarry and SC-518 requests: I checked this by reading, not with a probe. `claimChromeFocus` runs on every chrome mount, ours included. It is keyed by block key, it claims only while focus is free, and the LP carry is one-shot. A flip that lands while a request is armed for the same block can only claim when nothing holds focus, which is the same rule as the rebuild the request was armed for. Nothing new here.
- SC-656 (negotiation redraw memory) and SC-639 (Reset): both go through view unload or `update`, and our rebuild does neither. NEGO-O01..O19 e2e passed 19/19 on the head.

## 3. Markers and driver
- `grep -rn "knownBug('SC-644'" e2e test src` gives 0. The only SC-644 text in e2e is two comments in `live-behavioural.e2e.ts`.
- Develop added these `setPrefs` lines since `10c271fe` (from `git diff 10c271fe 3b47e55b -- e2e`):
  - `sidebar/pending-saves.e2e.ts`: `before(setPrefs({}, {experimental:true}))` and `after(setPrefs({}))`.
  - `negotiation/outside-edit.e2e.ts`: the same pair.
  - Two further `before(setPrefs({authoringControls:true}, {experimental:true}))` / `setPrefs({})` pairs, in files develop changed (settings/compendium, settings/dropdowns).
  - All of them are hook-level resets. None asserts on how long `setPrefs` takes or races it against a pending save. Our added `await diskData()` (`e2e/driver/dse.ts:546`) only waits for a pending pref save to reach disk first.
  - Measured on the head: sidebar 16/16, NEGO-O 19/19, settings 80/82 (2 known-bug); r7's full run had 0 failed.

## 4. Gates (head `76644e80`)
| Gate | Measured | Expected (§3) |
|---|---|---|
| tsc + tsc -p e2e | rc 0, rc 0 | clean |
| lint | rc 0 (only the `.eslintignore` deprecation warning) | clean |
| jest (full) | `Tests: 1 skipped, 13897 passed, 13898 total`; suites 301 passed / 1 skipped | 13897 / 1 |
| e2e `--element=settings` | `80/82 ok, 0 failed, 2 known-bug` | (subset of 662/669) |
| lifecycle (7 parts) | 21+16+9+4+7+4+3 = 64/64, 0 failed; G-S61 ok | 64/64 |

Not run, per the brief: the full e2e, shots, freeze and parity.

## Findings

### HIGH / MEDIUM / LOW
None against this branch.

### INFO
- **I-1 (pre-existing on develop, not from this branch): a pinned card ignores an outside edit to its `collapsed:` key.**
  - Scenario: Sync or another pane adds `collapsed: true` to a pinned block. The card refreshes in place (`SidebarPanel.ts:358` `refreshFromOutside`) but stays expanded.
  - Cause: the pipeline's chrome resolves from `collapseKeys`, captured once at `pipeline.ts:528` and used at `:709`. SidebarPanel rebuilds only the serializer from the new read (`:335`). So writes keep the new line, but the screen does not show it until the card is re-pinned or reloaded.
  - Measured: probe I1 gives `sameRoot=true collapsedAttr=null bars=1` on BOTH head and base `3b47e55b`.
  - This branch's carry (`carriedCollapsedFor`, `pipeline.ts:128`) does not change the outcome here, because develop already re-resolved from the stale keys.
  - Prescribed: a Backlog follow-up. The fix is to let `refreshFromOutside` hand the new `collapseKeys` to the chrome closure. That is out of scope for SC-644.
- **I-2 (develop's own behaviour): SC-652's passthrough keeps values, not bytes.** A write turns `printPreview: "on"` into `printPreview: on`, and `prefs: [a, b]` into a block list. Measured as identical with and without flips (R8-A control comparison). Not ours; recorded only because the brief said "byte-for-byte".
- **I-3 (design, as reviewed in r2 LOW-5):** in real use the flip comes from the settings window, where focus is held outside the block. `holdChromeFocus` is then a no-op (`focusHandoff.ts:77`), so it can never steal focus from an open window. It acts only when focus is on the block's own chrome at the moment of the flip, which a programmatic flip produces, as do F4 and W1.

## Follow-ups
- I-1: a pinned sidebar card's chrome does not follow an outside edit to `collapsed:` / `collapsible:` / `collapse_default:`, because the chrome uses keys captured at the first pipeline run. Pre-existing on develop (measured on `3b47e55b`). Related: SC-662, SC-652, SC-169.

## Artifacts (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc644-r8-rev/`)
- Gates: `r8-head.txt`, `r8-tsc.log/.rc`, `r8-tsc-e2e.log/.rc`, `r8-lint.log/.rc`, `r8-jest.log/.rc`, `r8-e2e-settings.log/.rc/.head`, `r8-lc-{1..7}.log/.rc/.head`.
- Extra e2e on the head: `r8-e2e-sidebar-kept.log` (`--element=sidebar`), `r8-e2e-kept.log` (CTR-K01, MONT-X15..X18), `r8-e2e-nego-oe.log`.
- Probes (kept copies of the files; both private worktrees `probe/` and `probe-base/` were removed by literal path): `probe-files/r8ProbeKeptKeys.test.ts`, `probe-files/r8ProbeSidebar.test.ts`, `probe-files/r8ProbeHandoff.test.ts`, `probe-files/r8-probe.e2e.ts`.
- Probe logs: `r8-probe-a.log` (first run: 2 failures, both mine, from a too-literal line check; the control-equality assertion passed), `r8-probe-b.log` (24/24), `r8-probe-c.log` (5/5), `r8-probe-d.log` (13/13 incl. I1), `r8-probe-base-a.log` (base: S1/S4/S5/S7/F4 red, I1 the same as the head), `r8-probe-e2e-c.log` (2/2). `r8-probe-e2e-a/b.log` are runs where my probe queried the wrong window; the probe was fixed and re-run as `-c`.
- Scripts: `r8-g-tsc-lint-jest.sh`, `r8-g-e2e.sh`, `r8-g-lc.sh`, `r8-probe-jest.sh`, `r8-probe-base-jest.sh`, `r8-probe-e2e.sh`.
