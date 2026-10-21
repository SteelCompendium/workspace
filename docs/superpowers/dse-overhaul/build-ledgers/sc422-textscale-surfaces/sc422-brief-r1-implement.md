# SC-422 r1 — implement: text-size prefs reach the plugin surfaces outside any stamped root

You are an orchestration:implementer working for the SC-422 ticket-owner. Your final text goes to the owner, not a human.

## 1. Context loading (read first)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc422-textscale-surfaces/decisions.md` — the owner decisions O1–O5 there bind you.
- Origin design: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc372-textscale/sc372-r2-review-report.md` — read LOW-1 (lines 23-28) and §F2 (lines 129-140) only. §F1.4 explains the exactly-once registry and the `text scale once OK` sweep that SC-372 landed; skim it only if you need it.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc422-textscale-surfaces`; the dse repo is `/home/scott/code/steelCompendium/worktrees/sc422-textscale-surfaces/draw-steel-elements`, branch `sc422-textscale-surfaces`, currently at origin/develop `7817133`. First: `git -C <dse path> fetch origin` and rebase onto `origin/develop` if it moved (report the base sha you end on). Run `npm ci` if package.json changed.
- **Verify `pwd` before every write. Use `git -C <absolute path>` for every git command — never `cd X; git …`** (a failed cd once ran git in the shared main checkout).
- Never edit anything under `/home/scott/code/steelCompendium/workspace/` except your report files in the ledger dir. Workspace-level docs (e.g. `docs/superpowers/dse-overhaul/D3-token-map.md`) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc422-textscale-surfaces/…`.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault — expected, not yours, never touch it.
- **You never call the tracker (Linear)** — not to read history, not to post.

## 2. The task

The ticket (verbatim):

> The Small and Control text-size prefs only take effect inside roots the plugin stamps with the pref values: element roots and DseModal dialogs. These surfaces use the size tokens but sit outside any stamped root, so they ignore the prefs:
>
> * Compendium search modal hints (`.dse-compendium-suggest__type/__source/__code/__hint`). The modal is a `SuggestModal`, not a DseModal. **This ships in 7.0.0.**
> * Settings preview caption (`.dse-settings-preview__label`). It sits outside the stamped preview root.
> * Sidebar panel header (`.dse-sidebar__panel-header`) and sidebar empty message. Both are behind the experimental switch.
>
> Decision needed: should plugin chrome follow the text-size prefs at all? If yes, fix all four surfaces together. The search modal needs a lifetime owner for the pref subscription.

Owner decision O1 (ledger): build the YES answer. The contract is the pref help text in `src/prefs/catalog.ts` (:349, :361, :373).

Make every one of those surfaces follow the Small / Large / Control knobs exactly as text inside an element root does:

1. **Survey first (short).** Confirm each listed surface still ignores the knobs on current develop, and find any OTHER `--dse-fs-*` role consumer that renders outside a stamped root (`[data-dse-element]`, `.dse-modal`) — e.g. other SuggestModals/FuzzySuggestModals, notices, the settings tab itself (`.dse-settings-preview__label-hint` at styles-source.css:16445), the sidebar view. Report the list with file:line. Fix every one you find unless it needs a design call — then list it under Follow-ups and leave it.
2. **Stamp each surface's root with `prefs.reflectCss(rootEl, owner)`** (`src/framework/seams/prefs.ts:80/260`; model: `src/framework/kit/managedModal.ts:120-123`). Every stamp needs a `Component` lifetime owner whose unload releases the subscription:
   - Compendium search modal (`src/authoring/CompendiumSearchModal.ts`, a `SuggestModal`): give it an owned `Component` loaded in `onOpen` and unloaded in `onClose`, and stamp `modalEl` (or the element that contains the suggestion list). Confirm the prefs seam is reachable from where the modal is constructed (`main.ts:585`).
   - Settings preview caption (`src/views/SettingsPreview.ts`): stamp a container that includes the caption, owned by whatever already owns the preview root's subscription.
   - Sidebar header + empty message (`src/framework/sidebar/SidebarPanel.ts:199` per §F2; `src/framework/sidebar/DseSidebarView.ts`): §F2 specifies stamping the header; stamping one container that covers both header and empty message is acceptable if it does not create nested same-knob consumers.
3. **Add the new roots to the token rule's selector list** (the SC-372 rule `:root, :is([data-dse-element], .dse-modal)` in styles-source.css) — use a dedicated class/attribute for "stamped chrome root" rather than adding `.dse-modal` to a non-DseModal (that class carries modal styling). Keep the exactly-once registry correct for the new roots (O5).
4. **Tests:** jsdom tests that each new root carries `--dse-fs-small-scale` (and the other two) after `prefs.set`, and that the subscription is released on close/unload (no further writes after unload). Extend `scaleTokenScope` test 6 (the stampers list) per §F2.
5. **Browser gate:** the shots harness's in-run `text scale OK` / `text scale once OK` gates (shoot.mjs ~:6688-6711) find stamped roots by `[data-dse-element], .dse-modal`. Extend them to the new root selector, and add rows for the new surfaces to the `TEXT_SCALE_*` tables (shoot.mjs:101-151) wherever the harness renders them. If a surface is not rendered by the harness at all, say so and cover it with the strongest test you can (jsdom stamp test + a computed-size probe in obsidian-lifecycle or e2e if feasible). Prove non-vacuity: with your stamping removed, the new rows must fail — record the failure line.
6. **Docs:** `.repo-docs/font-sizes.md` (where stamped roots are listed) and the superproject `D3-token-map.md` if it lists the stamped roots. One CHANGELOG `## Unreleased` bullet in dse, user-facing: the text-size settings now also resize the Compendium search window's hints, the settings preview caption, and the sidebar header.
7. **Evidence for Scott (required).** For each surface, a before (origin/develop) / after (branch) pair at Small text 120% (and Control 120% if the surface has a control), plus one at default prefs showing nothing moved. Prefer the real Obsidian (`visual-harness/obsidian-camera.mjs`, `settings-evidence.mjs` are prior art) for the search modal and settings caption; the harness is fine where it renders the surface. Crop tight to the surface; a side-by-side composite per surface is ideal (≤4 images total). Save under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc422-textscale-surfaces/evidence/` with `sc422-` prefixed names. Captions in your report must name what changed in words (sizes in px), never by color — Scott is colorblind.

Commit after every coherent step on branch `sc422-textscale-surfaces` in the dse worktree. Do not push.

## 3. Gates — the `dse-verify` skill

Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` and run the FULL battery in its order: tsc (incl. `tsc -p e2e`), lint, jest, lifecycle (`npm run obsidian-lifecycle`), e2e (`npm run e2e`), shots, freeze check, parity last. Lifecycle and e2e are required for this change.

Expected (develop @ 7817133): jest **5013 passed / 1 skipped / 229 of 230 suites** (yours = that + your new tests; report the delta) · lifecycle **26/26** (or 26 + any scenario you add) · e2e **`OBSIDIAN-E2E done: 71/76 ok, 0 failed, 5 known-bug, coverage: 51/51 pairs`** · shots **572**, 0 FAIL, with `pressed toggle parity OK`, `text scale OK (…)`, `text scale once OK (…)` lines · freeze **`freeze OK (276/276 …)`** — O4: zero frozen bytes move at default prefs; any movement = stop and return NEEDS_CONTEXT with crops, never rebaseline · parity **0 GAPs / 0 undeclared / 24 DECLARED**.

## 4. Footguns

- Devbox: tools are not on PATH. `devbox run -c /home/scott/code/steelCompendium/worktrees/sc422-textscale-surfaces/draw-steel-elements -- bash -c 'cd … && <cmd>'`. Devbox's sh wrapper eats `$?`/`$PIPESTATUS`; never pipe a gate into `tail`. Run gates via a wrapper script file that captures the exit code, output redirected to a per-run unique file.
- **Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents.**
- **Run every gate in the foreground and read its own output.** Never start a gate in the background and "wait for a notification" — a job you start does not wake you.
- **Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.**
- **Never `pkill`/`killall` by a command pattern** — other efforts run the same shots/parity/obsidian commands concurrently. Kill only by PID whose command line contains `worktrees/sc422-textscale-surfaces/`.
- **Never `rm -rf` a shared `/tmp` glob** (e.g. `/tmp/dse-obsidian-lifecycle-*`) or the shared `.superpowers/` dir — delete only paths you created and recorded.
- Stale superproject pin: if `token-coverage.test.ts` goes red on token-map rows you did not touch, compare the worktree's `D3-token-map.md` with the main checkout's and use `DSE_TOKEN_MAP_PATH` — not a code defect.
- Concurrent batteries make jest/e2e load-sensitive; dse-verify has the guidance — re-run a single flaky test before believing it.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc422-textscale-surfaces/sc422-r1-implement-report.md`. It must OPEN with a ≤10-line executive summary (verdict, base sha, branch head sha, every gate number, frozen bytes moved yes/no). Then: survey list with file:line; what was stamped and its lifetime owner per surface; the non-vacuity failure line; evidence captions (px before → after per surface); `Drive-by fixes:` and `Follow-ups:` sections.

If the report-file write is blocked by your harness, return the report inline.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — STATUS (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED), base sha, head sha, gate numbers, frozen bytes moved — **plus the absolute path of every evidence artifact you produced** (report, screenshots, logs).

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see your completion notification and will resume you with the answer. If you ever do send a message anyway, its FIRST WORD must be `SC-422:`.
