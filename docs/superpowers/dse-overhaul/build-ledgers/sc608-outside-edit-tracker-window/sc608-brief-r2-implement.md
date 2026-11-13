# SC-608 r2 — implement Option 1 (implementer)

Your final text goes to the ticket-owner, not a human: raw facts (verdict, shas, measured numbers), no prose padding.

## 1. Context loading

- Read first: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc608-outside-edit-tracker-window/decisions.md` (Scott's ruling and the owner rulings are binding), then the r1 survey `sc608-r1-survey-report.md` in the same dir (exec summary, §2 inventory, §3 measurements, §5 Option A, §8 risks). The r1 probe spec is a useful starting point for real-Obsidian tests: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc608-r1-survey/zz-probe608.e2e.ts.txt` (never committed; read-only for you — copy what you need).
- Prior art: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc603-focus-after-pool-apply-ledger.md` (the `openModal` focus restore), SC-602 (landed on develop: `src/framework/host/livePreviewFocusCarry.ts`, `src/framework/kit/controlFocus.ts`, `src/framework/chrome/focusHandoff.ts` — read them; reuse, no second focus mechanism), SC-589 (pinned sidebar outside refresh hands focus back).
- **You never call the tracker (Linear)** — not to read history, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc608-outside-edit-tracker-window`. dse is `draw-steel-elements/` on branch `sc608-outside-edit-tracker-window`, currently at `622b0904`, clean. Verify `pwd`/paths before any write. The workspace-level files (CHANGELOG.md etc.) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc608-outside-edit-tracker-window/` — never under `/home/scott/code/steelCompendium/workspace/`.
- **Rebase first:**
  - dse: `git -C <wt>/draw-steel-elements fetch origin`, then rebase onto `c329ff35` (= origin/develop at dispatch; do not take a later sha without telling me). Run `npm ci` if `package.json` changed.
  - superproject: `git -C <wt> fetch origin`, rebase the superproject branch onto `origin/main` (report the sha).
- Baseline at `c329ff35` (CURRENT): tsc/lint clean · jest 11595 passed / 2 skipped (fresh worktree) · lifecycle 61/61 in SIX `--only` parts · e2e `304/307 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` (known bugs SC-257, SC-355, SC-384) · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24.

## 2. The task

Scott's ruling (verbatim from the ledger): **"Option 1"** — answering the ask "should the window close or stay open?", where Option 1 was: "close the window (recommended). Focus goes to the same control in the reloaded tracker, the one you opened the window from. Anything typed or staged in the window is dropped [...] It cannot overwrite the outside change."

Owner rulings (from the ledger, binding):

- **Notice:** "TAKE the recommendation (the ask's first line: "a Notice says it closed without saving"; proposed text "The note changed outside, so this window closed without saving"). Show it only when the window closed BECAUSE of an outside edit (never on the tracker's own save/Apply)."
- **Sidebar silent write loss (folded):** "Under Option 1 the sidebar window closes the same way as Reading view, same Notice, same focus hand-off — but only when the tracker's block content actually changed (Reading view ZZ8-05 parity), not on every modify of the note."
- "Focus hand-off keyed by sourcePath + pane + tracker index (not `blockKey`); restore only when focus is free in the root's own document (popouts); treat focus on the dying view's own control as free (LP ZZ8-09). Reset encounter confirm hands off its own token too."

Concretely, for every window the initiative tracker opens (minion Stamina pool, hero Stamina, creature Stamina, Conditions, Reset encounter confirm — re-inventory on `c329ff35`, SC-580/582/583 changed ConditionsModal):

1. **Reading view and Live Preview:** an outside edit that redraws the tracker closes the window (as today), shows the Notice once, and keyboard focus lands on the reloaded tracker's replacement of the control that had focus when the window opened (same control family, same creature/instance). If that control is gone: the control that replaced it in the same place; failing that the tracker's own focusable root — never the page body. If focus was not inside the tracker when the window opened (e.g. mouse open with focus on the note container), restore nothing (SC-603 rule) — but the Notice still shows. If the tracker no longer exists in the note, restore nothing.
2. **Pinned sidebar tracker:** when the outside edit changes the tracker's block content, the window closes the same way (Notice, focus to the sidebar's rebuilt control). When the outside edit does NOT change the block (edit elsewhere in the note, a Sync that leaves the block alone), the window stays open AND its Apply/Add must actually write (today it silently writes nothing — survey ZZ8-06/07/08/11). No path may leave a window open whose writes go to a stale model.
3. **Never steal focus:** restore only when focus is free in the tracker root's own document (popout windows), or sits on the dying view's own control.
4. The tracker's own saves (Apply, Enter, Done, Cancel, Escape, a captain crossing 0, Reset) keep today's behaviour exactly — no Notice, SC-603/SC-602 focus restore unchanged.
5. Edits above/below the block in Reading view that do not redraw the block: window stays open, Apply works (today's ZZ8-05 behaviour) — keep it.

**Files:** `src/elements/initiative/view.ts` is shared with SC-605 (running in parallel, Live Preview quick-add draft). Keep your `view.ts` changes small and local to the unload hook and `openModal`/`giveFocusBack`; put logic in a helper (next to `focusHandoff.ts`/`controlFocus.ts` or a new kit file) and the sidebar refresh path (`src/framework/sidebar/SidebarPanel.ts`, `src/framework/host/SidebarBlockHost.ts`). Do NOT edit `src/elements/initiative/model.ts` (SC-600 running) or `ConditionsModal.ts` (SC-580 family, landed — touch only if unavoidable, and say why). If the fix needs either, stop and return NEEDS_CONTEXT.

SC-605 (parallel, not landed) only ADDS code in `src/elements/initiative/view.ts` (a type guard near `interface QuickAddDraft` ~line 127; methods `carryState()`/`receiveCarriedState()` between `captureQuickAddDraft()` and `onMount()` ~212-226). It also edits `src/framework/view.ts` (two optional hooks on ElementView), `src/framework/pipeline.ts`, `src/framework/registerFrameworkElements.ts`, `src/framework/host/livePreviewFocusCarry.ts` (exports `writtenBlockKey`), and adds `src/framework/host/livePreviewStateCarry.ts`. Avoid those regions/files where you can; if you must edit `src/framework/view.ts`, `pipeline.ts` or `livePreviewFocusCarry.ts`, keep it minimal and list the exact hunks in your report (whoever lands second rebases).

**Tests:**
- jest cases per behaviour, red on `c329ff35` (show it), green on HEAD.
- Real-Obsidian coverage in e2e (`e2e/specs/initiative/` or alongside SC-603's INIT-F07..F12 specs): at least — Reading view pool keyboard-open → outside edit in block → window closed, Notice once, focus on rebuilt `init.detail.stamina`; Reading view Conditions (half-typed text) → same, focus on rebuilt `init.cond.add`; hero Stamina; pinned sidebar pool → in-block edit → closed + Notice + focus on sidebar control; pinned sidebar pool → edit outside the block → window open, Apply writes the pool value to the note; Live Preview pool → closed, focus on rebuilt control; a tracker-own Apply shows NO Notice. e2e coverage pairs must stay `Y/Y` (add pairs if the runner asks). **Never put a bracketed ticket id in an e2e test title** (the runner parses titles for scenario ids).
- No new lifecycle scenario unless e2e cannot express something; if you need one, it is `G-S103` in its own part 7 — ask first (NEEDS_CONTEXT).
- Mutation check: revert each fix piece in turn and show the matching test goes red (list them).

**Docs:** a bullet under `## Unreleased` in the worktree superproject's `CHANGELOG.md` and in the dse `CHANGELOG.md`, SC-603/SC-589 style. It must name: the window closes with a Notice and focus returns to the tracker; and the sidebar fix ("in the pinned sidebar, a window's Apply after an outside edit was silently lost"). Views: Reading view, Live Preview, pinned sidebar (only those you verified). If dse `.repo-docs/` documents the "window closes when its view unloads" contract, update it.

Commit after every coherent step (red tests, fix, sidebar fix, e2e, docs) — nothing uncommitted through a gate.

## 3. Gates

Follow `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (≈340 KB; read "The battery, in order", "Devbox wrapping", "Lifecycle and e2e notes (SC-480)", "THE exit-code footgun", and "Current expected numbers"). Full battery on the final HEAD, in order: tsc, lint, jest, lifecycle, e2e, shots, freeze, parity. Expected:

- tsc/lint clean; jest 11595 + your new tests, 2 skipped on a fresh worktree (1 after shots caches the css);
- lifecycle 61/61 as SIX separate foreground calls with comma-separated `--only=`: `G-S7a … G-S9a` 21; `G-S9b … G-S40` 16; `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` 9; `G-S57,G-S62,G-S61,G-S56` 4; `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` 7; `G-S92,G-S96,G-S97,G-S99` 4 (take the exact id lists for parts 1–2 from the skill). G-S91 has a known flake (SC-616): if it alone fails, re-run that part once and report both;
- e2e `N/N+3 ok, 0 failed, 3 known-bug, coverage: Y/Y pairs` (304/307 + your new specs);
- shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147; freeze 280/280; parity 0/0/24. If `styles.css` is byte-identical to clean `c329ff35` and the skill allows carrying shots/freeze/parity on that basis, say so with both sha256s; otherwise run them.

## 4. Rules (footguns — obey all)

- Every git command as `git -C <absolute path> …`; never `cd X; git …`.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc608-outside-edit-tracker-window/draw-steel-elements -- <cmd>`; never `cd` inside a compound command. Devbox eats `$?` and piping eats failures: record exit codes from a script FILE run through devbox (`devbox run -c <path> -- bash <script>`), and read each gate's own summary line.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc608-r2-impl/` — create it; uniquely named scripts/logs. Write scratch files with the Write tool, not heredocs.
- Never `rm -rf` a `/tmp` glob or any glob; no `rm` with a shell-variable target (it hangs on a permission prompt). Delete only literal paths you created.
- Never `pkill`/`killall` by pattern; kill only a PID you verified is yours (`readlink /proc/<pid>/cwd` inside your worktree).
- Never touch the shared `.superpowers/` dir beyond your report file; never the freeze baseline.
- The main checkout `/home/scott/code/steelCompendium/workspace` is shared: never edit there. Its dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault — expected, not foreign.
- Run each gate as ONE blocking foreground call (no `run_in_background`, no Monitor); split lifecycle into its six parts and e2e/shots into separate calls to stay under the 10-minute tool limit. Redirect output to a log file in your scratch dir, not streamed (the 600 s stream watchdog kills silent agents). Never key a wait-loop on a scratch filename or its contents — the scratch dir has stale files from other sessions and branches.
- Never create tags or releases. Never push. Never run `just deploy*`, `just wt-finish`, or `just wt-rm`.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report. If you ever message anyway, its first word must be `SC-608:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc608-outside-edit-tracker-window/sc608-r2-impl-report.md`. It MUST open with a ≤10-line executive summary: verdict, dse HEAD sha + per-commit shas, superproject sha, every gate number, red-on-base proof. Then: per-window before/after table (Reading view / LP / sidebar × in-block / out-of-block edit), files changed with line counts, mutation results, `Drive-by fixes:` and `Follow-ups:` lists. If the report-file write is blocked by your harness, return the report inline.

Final text: `STATUS: DONE|NEEDS_CONTEXT|BLOCKED`, the executive summary, and the absolute path of every artifact (report, logs).
