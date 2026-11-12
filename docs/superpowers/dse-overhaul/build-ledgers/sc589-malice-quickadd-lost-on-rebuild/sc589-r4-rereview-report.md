# SC-589 r4 scoped re-review (reviewer identity B): delta `d12e4675..853f3f18` + superproject `f8796a1f`

**Executive summary**
- Verdict: **LAND.** The r2 folds are correct and do what the ruling asks. The LOW-1 wrapper restores focus and caret on the sidebar's outside refresh, and it never pulls focus in from outside the tracker.
- Findings: HIGH 0 · MEDIUM 0 · LOW 1 · INFO 3. LOW-1: the new `resetRebuild` flag is pinned by no test. Removing the flag, or making it stick, still passes all 171 matrix tests; it is correct today in code and in real Obsidian.
- Gates (mine, dse HEAD `853f3f18`): tsc rc 0 · lint rc 0 · jest fresh `7326 passed / 2 skipped`, 263 suites + 1 skipped, rc 0 · e2e `272/276 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` (SC-257, SC-384, SC-580, SC-355), rc 0 · lifecycle 21/21 + 16/16 + 9/9 + 4/4 + 6/6 = **56/56**, each rc 0, run one after another (each waited on its own PID; loadavg 1-6) · `styles.css` sha256 `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27`, unchanged.
- Red on r1 code (`src/` from `d12e4675` in a scratch copy):
  - jest matrix: `2 failed, 169 passed`, both of them Q15.
  - e2e INIT-M11: `ctl: null, inSidebar: false`. Selection `[2, 6]` already matched on r1, because the draft carried the caret; only the focus was missing.
- `origin/develop` is still `e0e49d4d`. The plugin tree is clean, and the superproject shows only ` M draw-steel-elements`, as I found it.

## Findings

### LOW-1: the `resetRebuild` flag is pinned by no test

- **Where:** `src/elements/initiative/view.ts:160` (`outside = model !== this.model && !this.resetRebuild`), set at `:298` and cleared in `finally` at `:303`.
- **Mutation probe** (scratch copy, matrix file, logs `r4-mut1-noflag.log` and `r4-mut2-stuck.log`):
  - Delete `&& !this.resetRebuild`: `171 passed`.
  - Delete the `finally` clear, so the flag sticks after the first Reset encounter: `171 passed`.
  - e2e INIT-M11 does no Reset before its outside write, so it misses this too.
- **Failure scenario:** a later edit that moves the set or the clear outside the `try`/`finally` would silently switch the LOW-1 fix off after the first Reset encounter in the sidebar, and nothing would go red.
- **Today:** correct.
  - The flag cannot stick: it is set straight before `await this.update(fresh)` inside the `try`, and `finally` always runs. The parse and ref-resolution errors are caught before the set, and there is no early return between set and clear.
  - The await chain inside is microtask-only (`ElementView.update` → sync `onMount`), and the root is `inert` throughout. So a concurrent outside refresh has a window of about one microtask, and it can find no focus inside the root to capture anyway.
  - Real Obsidian confirms it (PRB589-21 (e)): Reset encounter → Yes in the sidebar, then an outside write with the sidebar label focused. Focus comes back to the label with selection `[3, 7]`, and the draft `4 / AfterReset` is kept.
- **Prescribed fix (optional, small):** one jest case in `[Q]`, through the existing `outside()` helper:
  1. Reset encounter → Yes;
  2. focus the label and set selection `(2, 5)`;
  3. `refresh()`;
  4. expect focus on the rebuilt label with `[2, 5]`.

  This fails with the stuck-flag mutation. Pinning the flag's existence as well would need a spy on `focusControl` during the inert rebuild; I do not think that is worth it, because without the flag the restore inside the inert root just fails (no-op) and the reset path's own restore runs after `inert` is lifted.

### INFO

- **INFO-1: no double restore, and no fight with SC-588.** `rebuildAndPersist` passes `this.model`, so `outside` is false. `rebuildFromWrittenReset` is flagged, and when its parse fails `fresh === this.model`, so `outside` is false anyway. The only caller that passes another model is `SidebarPanel.ts:321`. PRB589-21 (f), the sidebar's own keyboard Enter on Advance round, keeps focus on the rebuilt Advance at settle and still at +1.5 s.
- **INFO-2: never pulls focus in** (PRB589-21):
  - (b) The main pane writes while focus is in the sidebar label: focus stays in the sidebar label, `[1, 1]`.
  - (c) Reverse: the sidebar writes while focus is in the main pane's label. The main pane's view is replaced (Reading-view remount, the r2 INFO-1 case), so focus goes to `<body>`. It is not pulled into the sidebar.
  - (d) Focus on an outside `<input>`, then an outside write: focus stays on the input.
  - (d2) Focus on `<body>`, then an outside write: focus stays on `<body>`.
  - jest Q16 pins the same rule.
- **INFO-3: dse-verify CURRENT needs `272/276` at land.** This is the dispatcher's bookkeeping, as already ruled.

## Probe results (real Obsidian 1.14.4)

Probe spec `zz-sc589-r4-probe.e2e.ts`, put into `e2e/specs/initiative/` only while it ran and deleted afterwards; observations in `probe-obs.jsonl`.

1. **The wrapper and the flag:** see LOW-1, INFO-1 and INFO-2.
2. **Sidebar outside write, label focused with selection (2,5)** (PRB589-21 (a)): the same root, the draft `2 / Sidebar` is kept, focus is on `init.malice.quickadd.label` in `.dse-sidebar`, and the selection is `[2, 5]`. All still hold at +1.5 s.
3. **The Reading-view paths from r2 are still green** (PRB589-01, -02, -05, -06, -08): every rebuild path keeps the draft, Add clears it with no resurrection, the invalid-amount table is unchanged, and caret and focus are restored with start and end only, which LOW-2 accepted. Focus outside the tracker is not pulled, the outside-write remount behaves as before, and a remount starts empty. No step left a draft in the note.
4. **INIT-M11** is red on r1 code and green at HEAD. Its title, `[INIT-M11] an outside change to the note keeps the draft, the focus and the caret of the sidebar tracker`, has no bracketed ticket id. Manifest row `M11` is on `init.malice.quickadd.label`, and coverage is 169/169.
5. **CHANGELOGs match the ruling.**
   - dse `CHANGELOG.md:25-30` and superproject `CHANGELOG.md:11-16` both say "in Reading view and in the pinned sidebar tracker".
   - Both mention the sidebar keeping your place on an outside change.
   - Both end "In Live Preview the boxes are still emptied when the note saves a moment later (SC-605)."
6. **LOW-2 fold:** `direction` is removed from the type, the capture and the restore (`view.ts:120-124`, `:188-190`, `:711`), and Q12 asserts `[2, 5]` only. **Q07** is retitled to what it tests.

## Artifacts

All in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc589-r4-rereview/`:
- gate logs: `r4-tsc.log`, `r4-lint.log`, `r4-jest-full.log`, `r4-e2e.log`, `r4-lc-1.log` … `r4-lc-5.log`;
- red-on-r1 and mutation logs: `r4-jest-matrix-on-r1.log`, `r4-e2e-M11-on-r1.log`, `r4-mut1-noflag.log`, `r4-mut2-stuck.log`;
- probes: `zz-sc589-r4-probe.e2e.ts`, `probe-obs.jsonl`, `r4-probe.log`;
- scratch copies: `r1copy/`, `mutcopy/` (restored to HEAD's `view.ts`).
