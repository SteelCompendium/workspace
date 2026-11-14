---
name: dse-verify
description: Use when verifying, testing, or gating any change to the draw-steel-elements plugin (CSS, TS, tokens, fixtures) — the full battery, its command shapes, and the freeze/parity rules
---

# DSE Verify

## Overview

`draw-steel-elements` (the DSE Obsidian plugin) gates every change through a fixed battery
of checks: type-check, lint, unit tests, the real-Obsidian lifecycle gate, the real-Obsidian e2e
functional gate (`npm run e2e`, required to land any change), visual shots, a byte-level freeze check, and a CSS/DOM parity check against the live v2 site. All commands
run through devbox and have specific footguns that silently produce false-green results if
you get the shape wrong. This skill is the command reference — read it before running (or
reporting on) any of these gates.

**Never edit `draw-steel-elements/` from the shared main workspace checkout.** Do this work
in an isolated worktree (`just wt-new <name>`) per the workspace CLAUDE.md.

## The battery, in order

Run these against a worktree's `draw-steel-elements/` (never the main checkout). Use
absolute paths — devbox ignores your shell's `cd`.

| Step | Command | Expects |
|---|---|---|
| 1. Type-check | `npm run tsc` | clean (no output) |
| 2. Lint | `npm run lint` | clean (no output), exit 0 — gated in CI as of SC-136/FOLLOWUPS #61 |
| 3. Unit tests | `npx jest` | all suites/tests green. On a fresh worktree jest reads one fewer passed and **2 skipped** until `npm run shots` has cached `visual-harness/dist/obsidian-app.css` (the `printTwinDeltaAllowedSet` test skips without it) — compare against CURRENT only after a shots run (SC-364 owner, 2026-10-20). Every new file in `src/framework/kit/` adds 2 tests: `test/dom/kit/kit-index.test.ts` runs two `test.each(kitFiles)` checks (zero colour literals, import boundary) (SC-601) |
| 4. Lifecycle (real Obsidian, headless) | `npm run obsidian-lifecycle` | `OBSIDIAN-LIFECYCLE done: 64/64 ok, 0 failed` (since SC-621; 63 since SC-619; 62 since SC-612; 61 since SC-607; 60 since SC-601; 59 since SC-596; 58 since SC-594; 57 since SC-598; 56 since SC-597; 55 since SC-595; 54 since SC-584; 53 since SC-480; since SC-479 the run takes about 14 min; since SC-522 (2026-11-02) two halves no longer fit a 600 s tool call, so run it as `--only` parts and report the union — SEVEN parts since SC-612 (2026-11-13; the six below plus part 7 `G-S108,G-S112,G-S115` since SC-621: 3 scenarios, 195-200 s at SC-621 r2 / r4 with the build already done (G-S108 about 67 s alone, 15 cells; G-S112 about 65 s alone; G-S115 about 73 s alone with the start-up, 9 cells; over the 180 s tool limit, so one part per call, output to a log, poll the node pid with `tail --pid`, as parts 1-6; ceiling for part 7 about 300 s; `G-S108,G-S112` 128-131 s at SC-619); SC-612 added G-S108 after G-S99 and before G-S56 in SCENARIOS order, in its own part because part 6 is at the 300 s line; SC-619 added G-S112 after G-S108, SC-621 added G-S115, G-S56 stays last); SIX parts since SC-594 (2026-11-12; G-S92 does not fit part 5 after SC-598's G-S91, so it runs alone as part 6; FIVE since SC-472, 2026-11-02; SC-544 split the old third part when G-S61 took it past 540 s, SC-472 added G-S59 as its own part): `G-S7a … G-S9a` (21; 183 s), `G-S9b … G-S40` (16; 320 s), `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9; 341 s at SC-552 r6; 444 s on a quiet host and 485-509 s under load at SC-584, 404 s at SC-595 r8 (504 s at SC-595 r2 under load), at the ~480 s line: add no more G-S64 phases, new block-form-in-embed phases go to G-S77 in part 5, and part 3 may need a split; G-S64 last in the part), `G-S57 G-S62 G-S61 G-S56` (4; 295 s) and `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S91` (7; 395 s at SC-598 r6 (loadavg 0.8 rising to 14 as other jobs started), 393 s at r4, 384 s at r2; SC-598 added G-S91 after G-S87 and before G-S56 in SCENARIOS order; G-S91 alone about 51 s with the build and the Obsidian start-up; the part-5 ceiling is about 420 s; as `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87` it was 6; 347-351 s at SC-597 r2 / r4, loadavg 1-7; SC-597 added G-S87 after G-S83 and before G-S56 in SCENARIOS order; G-S87 alone about 48 s with the build and the Obsidian start-up; as `G-S59 G-S49 G-S73 G-S77 G-S83` it was 5; 304 s at SC-595 r8, loadavg 5-15; SC-595 added G-S83 after G-S77 and before G-S56 in SCENARIOS order; G-S83 alone about 64 s with the build and the Obsidian start-up; as `G-S59 G-S49 G-S73 G-S77` it was 4; 272 s at SC-584 r9; SC-584 added G-S77 after G-S73 and before G-S56 in SCENARIOS order; as `G-S59 G-S49 G-S73` it was 3; 266 s at SC-480 r6 at loadavg 10-14; SC-480 added G-S73, which sits after G-S49 and before G-S56 in SCENARIOS order; as `G-S59 G-S49` it was 2; 207 s at SC-561 at loadavg 5-15; G-S59 alone about 120 s at loadavg 4-8 and about 160 s with 8 busy loops running at loadavg 20-50 (it was 156 s at SC-472 r8 and 160-240 s at SC-561 r1 before its 8x CPU throttle was taken out, SC-561); SC-520 added G-S49, which sits after G-S59 and before G-S56 in SCENARIOS order), and `G-S92 G-S96 G-S97 G-S99` (4; 298 s at SC-607 r4, about 300-310 s; G-S99 alone about 72 s with the build and start-up; SC-607 added G-S99 after G-S97 and before G-S56 in SCENARIOS order; part 6 is now at the 300 s line, so the next new scenario gets its own part; as `G-S92 G-S96 G-S97` it was 3; 230 s at SC-601 r4 with the build and start-up, loadavg 0.5-3 with one other lifecycle running; G-S97 alone 61 s; SC-601 added G-S97 after G-S96 and before G-S56 in SCENARIOS order; part 6 has room for about one more scenario of G-S97's size before it nears the 300 s line; as `G-S92 G-S96` it was 2; 175 s at SC-596 r4: G-S92 ~105 s + G-S96 ~71 s with the build and start-up; parts 1-5 at SC-596 r4: 185 / 323 / 409 / 294 / 390 s; `--only=` takes COMMA-separated ids, `--only=G-S92,G-S96`, a space list names one unknown id and exits 2; as `G-S92` alone it was 1; 103 s at SC-594 r6 with the build and start-up, 11 trials with one note each because a card Notice is rate limited per note; parts 1-5 at SC-594 r6: 183 s / 322 s / 423 s / 299 s / 393 s; part 5 is at its ~420 s ceiling, so a new scenario goes to part 6 or a new part; G-S56 stays LAST in SCENARIOS order), the other parts measured at SC-472 r8 (loadavg 1-8, 12 cores); since SC-551 each run takes an OS-assigned CDP port, so no private `DSE_LIFECYCLE_PORT` is needed (`npm run obsidian-lifecycle -- --only=<ids>`); G-S59 sits before G-S56 in SCENARIOS order, and G-S56 stays last in the fourth part; part 1 ids in file order `G-S7a G-S7b G-S6a G-S6b G-S6u G-S28 G-S5n G-S1 G-S2 G-S3 G-S4 G-S5 G-S6c G-S6d G-S6e G-S6f G-S6g G-S6h G-S6i G-S8 G-S9a`, part 2 `G-S9b G-S9d G-S9e G-S9f G-S9c G-S10 G-S11 G-S12 G-S13 G-S15 G-S14 G-S18 G-S32 G-S36 G-S33 G-S40`; G-S56 must stay last to stay under a 600 s tool timeout and report the union; SC-453 added G-S10, SC-455 G-S11, SC-460 G-S12, SC-326 G-S13, SC-457 G-S14 — a fence with whitespace before the language still saves after the note changed around it, SC-470 G-S15, SC-478 G-S18 — Live Preview keeps its reading position when a tracker is redrawn (adds about 1 minute), SC-477 G-S28 — an unterminated trailing fence's write keeps the note's final newline, SC-492 G-S32 — the stamina bar's menu buttons (Edit, Collapse, Pin) do not also open the Stamina modal, SC-498 G-S36 — a real Tab reaches the stamina bar and Enter/Space open the Stamina modal, focus back on the bar after, SC-487 G-S33 — Live Preview "Pin to sidebar" of a fence with a zero-width space after the name anchors, mounts the panel and saves, SC-509 G-S40 — a block edit form Save redraws the card at once (Reading view + sidebar) and leaves the note text outside the block untouched, SC-519 G-S45 — a block edit form opened while a card write is pending starts from the card (Reading view + sidebar), SC-502 G-S44 — Live Preview real-mouse clicks on the chrome panel: the stamina bar's Edit pencil opens only the edit form and Collapse collapses without moving the editor cursor; a click where the hidden panel would be still lands on the editor line above; the panel stays revealed when the pointer moves straight up across Obsidian's own \`</>\` button to Collapse; on the collapsed one-liner a real click on Expand expands and a real click on \`</>\` still enters the block's source; counter, feature and statblock: CodeMirror's height for the widget equals its on-screen height (the block's margins stay inside the widget), every panel button hit-tests to itself and real Collapse/Expand clicks work, SC-479 G-S42 — a Reading-view note that embeds a tracker keeps its scroll position (reader at the end), its on-screen text (reader below the embed) and its on-screen text (reader inside a tall embed) when the tracker's note is written, SC-518 G-S50 — after a keyboard Save in the block edit form focus lands on the redrawn card's Edit pencil with the focus ring (Reading view montage + stamina bar, sidebar, Live Preview, the upper of two identical blocks; a tall note keeps scrollTop and the card's top edge), a mouse open leaves focus where it was, and the note bytes change only by the edited value, SC-481 G-S53 — with two identical blocks in a note (plain, inside a quote, inside a callout), a card click or a block edit form Save on one leaves the other drawn with its own value and writes only the block it belongs to, adoption on and off; SC-533 G-S54 — the chrome panel keeps its placement (right edge 10 px inside the card, bottom edge on its top: the shots "chrome placement" numbers) for framed blocks below the first screen, Live Preview AND Reading view: `Lifecycle/chrome-frame.md` has 6 statblocks, 2 stamina bars and 2 trackers; each phase opens the note fresh, scrolls down half a screen at a time, waits (frames, not a timer) until each on-screen panel has its `--dse-chrome-frame-border-*` vars, then measures it; all 10 blocks must be measured. The vars are measured a frame after the mount, so a panel that is out of the document then must be measured later: Live Preview detaches a widget shortly after mounting it and re-attaches the same DOM when it scrolls into view, Reading view builds below-the-fold sections off-document. Anti-vacuity per phase: a hook on `createDiv`/`requestAnimationFrame` records panels that were out of the document at their first animation frame (needs at least one) and every anchor must have a non-zero border. Controls (temporary bundles via `DSE_LIFECYCLE_BUNDLE`, built from `git archive` exports): the frame-batched build that drops such panels (the batched-frame commit, 74a8e27) FAILs Live Preview AND Reading view (inset 11 / gap -1, no var on the panel); stock `458abe3` (border read at mount; a detached node reads 0) FAILs Reading view only; the shipped build passes both, SC-522 G-S52 — a LIVE PREVIEW host note that embeds a tracker note keeps its scroll position and its on-screen text when the tracker's note is written, a click in the embedded card does not scroll the host, and a block deleted from the tracker's note does not keep a blank band up. Fixtures `Lifecycle/lpembtracker.md` (25-hero tracker), `lpembhostend.md` (80 paragraphs, `![[lpembtracker]]`, 3 end lines), `lpembhosttall.md` (80 paragraphs, the embed, 80 paragraphs), `lpembtwo.md` (two 12-hero trackers) and `lpembhosttwo.md`. Phases (a) in-app `vault.process` of B, host parked at its end (stock scrollTop 6800 -> 3745), (b) a write on disk via the watcher, (c) a second Reading pane showing B makes the click (7486 -> 3745), (d) tall host parked below the embed, a hero added (the text must settle where it started; stock +69 px), (e) a REAL mouse click on a toggle in the embedded card, adoption on, host parked in the tracker (stock 5420 -> 3916, text +1528 px), (f) B holds two trackers, host at its end, the second block is DELETED: the embed shrinks 3437 -> 1806 px, the hold must be on at the redraw, released within 5 frames of it (head: 0; a release only on a fresh root keeps it ~150 frames until its timer), the host ends at its new end 5416 as on stock. Per phase: write landed; tagged root tagged and removed (anti-vacuity); hold on at the redraw; scrollTop and text identical every frame ((d): settled position); hold released and, for (a)-(d), never while the new tracker is already mounted; selection unmoved. Every phase runs even after one fails. Controls (temporary bundle variants via `DSE_LIFECYCLE_BUNDLE`): **"host embed hold disabled"** FAILs (a)-(d) and (f); **"hold released only by its timer"** (no MutationObserver) FAILs (a)-(d) and (f); **"no `interactive-child` mark"** FAILs (e) only; **"release only on a fresh root"** (the redraw-without-a-fresh-view release disabled) FAILs (f) only. Base bundle FAILs (a)-(f). Since SC-472 the embed hold is released by the redraw, and the timer is only a load-aware backstop (`PIN_TTL_MS` 2.5 s of wall clock, then 30 painted frames, the last 2 quiet; never while a root in the embed is still empty; 20 s hard cap), so a redraw that comes after 2.5 s no longer ends the hold early and a FAIL of (a)-(d) is a regression (G-S59 (b) covers the late redraw, made late by a 4 s busy main thread). The one load-related red that remains is phase (c)'s anti-vacuity timeout ("the embed was not redrawn within the harness cap") under heavy machine load: environment, check `/proc/loadavg` and re-run. A click inside a DSE card in an LP embed no longer selects the embed, SC-545 G-S63 — turning the plugin off and on without closing a Live Preview note leaves clickable cards in callouts and embeds. Obsidian rebuilds only its code-block widgets on `post-processor-change`; a callout or embed widget is reused with its cached DOM, so the card in it was the OLD instance's (view unloaded, listeners gone, owned by no live `ViewRegistry`) and a + click wrote nothing. `ViewRegistry.onunload` now stashes each such card's widget context (`__dseReplugV1` on its element, `replugRemount.ts`) and the new instance draws a fresh card at layout-ready; a card CodeMirror had taken out of the page at the toggle (about a screen or more away: its widget keeps its DOM, detached) is stashed too and drawn when the editor puts the DOM back (the update listener in `livePreviewReconcile.ts` calls `remountReattached`); only a note that still holds a raw DSE fence or an unowned card in the page is rebuilt with `setViewData(.., true)` (the fallback: a write pending at disable, a note opened while the plugin was off, an update from a build without the stash, and an embed whose card Obsidian replaced with the raw fence while the plugin was off: seen at SC-545 r4, not reproduced in r5's 18 toggles, trigger not identified). Every phase: a real + first (anti-vacuity), tag the cards, `disablePlugin` / `enablePlugin`, then wait (a poll) until every tagged card is out of the document and the same number of cards is drawn and OWNED by the live registry (`plugin.viewRegistry.liveEntries()`), a real click on the new card writes +1 and the card shows the note's value, no page error, no Notice, and NO `setViewData(.., true)` between disable and the end of the settle (a hook on the markdown view class counts them: the normal off/on never rebuilds the note). Phases (a) a counter in a callout (`Lifecycle/replug-callout.md`), (b) a counter in a note an LP host embeds (`replug-embed-host.md` / `replug-embed-src.md`; the embed is sampled at the end of the off dwell: only if a raw `pre > code.language-ds-counter` was seen in it while the plugin was off may the fallback rebuild once, otherwise 0 rebuilds are allowed; the phase reports which branch ran), (c) twin callouts (`twin-callouts.md`), real clicks on block 1, 0, 1 after the off/on: [6,5] -> [6,6] -> [7,6] -> [7,7], (d) a stamina bar in a callout (`replug-stamina.md`): the real click opens the Stamina modal before and after, (e) a callout mid-pane in a tall note (`replug-mid.md`): scrollTop and the card's top edge unchanged within 1 px (measured 2519 -> 2519, 522 -> 522, also with SC-472's backstop), (f) a + whose write is still pending when the plugin is turned off (fallback allowed, its count is reported): the write lands ([7]), the callout is a card after enable, the next + writes ([8]), (g) controls: a plain fence in `replug-mixed.md` is redrawn by Obsidian (no fallback) and its + writes, and the callout's + in Reading view writes, (h) a callout off the page at the toggle (`replug-far.md`: a callout, then 200 paragraphs; scrolled to the end until CodeMirror has taken the widget out of the document, the registry still holding its card): after enable nothing is drawn (still off the page), after scrolling back the card on screen is a fresh root owned by the live registry, a real + writes ([6] -> [7]) and no `setViewData(.., true)` ran. The scenario owns its leaf (its tab is in its keep set), hides Obsidian's Update notice, and in `finally` enables the plugin again if a phase died while it was off, restores `setViewData` and resets its fixtures. Measured (1.15.0): HEAD passes all eight phases. On the `0698550f` bundle (no fix; the SC-545 diff touches nothing SC-547 changed) it FAILs (a)-(f) and (h) (cards still the pre-disable DOM and owned by no live view; the + writes nothing: disk [6] -> [6]; (d) the modal never opens; (f) 0 cards drawn after enable (raw code)) and passes (g); on the bundle before the off-page fix it FAILs (h) only (old root on screen, owned by no live view, + wrote nothing). Controls (temporary bundles via `DSE_LIFECYCLE_BUNDLE`, built from the fix with one change): **no stash call**, **no remount** and **the fallback always firing** each FAIL (a), (c)-(e) and (g) on "the fallback ran (1 setViewData(.., true) call(s))" (the fallback heals every case, so the clicks still write; only the no-rebuild assertion sees the difference); **the fallback never firing** FAILs (f) only; **no stash of a detached card**, **no remount on reattach** and **the update listener not telling the remounter** each FAIL (h) only ("the card on screen is not a redrawn, owned card", + wrote nothing). Jest `test/dom/framework/replugRemount.test.ts` (32 tests) pins the stash (what is marked and what is not, detached widgets included, the contents; `dispose()` re-marks a detached in-flight element too), the shape validation, the remount, the reattach remount and its one-`querySelector` early out, the fallback detector (an owned card in an embed does not trigger it, as for a callout), the pixel scroll restore, a stash or draw that throws, `dispose()` during a slow remount with a raw fence (no `setViewData` after the unload), the off/on, off/on/off and off-page wiring, and that the normal path never calls `setViewData`. **Not covered:** cards on a canvas and in hover popovers (not markdown leaves: a canvas file node's card stays dead after an off/on, as on base); during the one-time update from a build that never stashed, a card that is off the page stays dead until the note is reopened (the fallback sees only what is in the page, and no rebuild runs at scroll time); and the update redraws each affected open note once through the fallback, which clears its undo history., SC-537 G-S57 — in LIVE PREVIEW, identical blocks inside callouts (2 and 3 callouts, two blocks per callout, nested, far apart in the note, and a click on the callout title right after the +) each keep their own value after a card click or a block edit form Save on one of them, and a click writes only the block it belongs to; an editor update listener (docChanged, viewportChanged, selectionSet) re-judges Live Preview callout widgets because Obsidian runs no processor for them after a write; FAILs on the pre-fix bundle, SC-540 G-S62 — in LIVE PREVIEW a click on a control of a DSE card inside a `> [!note]` callout (+ on a `ds-counter`), the Enter that opens the block edit form from the focused Edit pencil, a click on the card's own text, and a control whose click REBUILDS the card (ds-initiative's Advance round, ds-project's Add project roll) no longer select the whole callout. Obsidian's callout widget (`.cm-embed-block.cm-callout`) selects it unless the click target is under `.cm-editor, .interactive-child` when its deferred handler (10-150 ms later) walks up from the target; the card used to be replaced by its markdown (cursor inside, editor scrolled to it). `armClickShield` puts `interactive-child` on the DSE root inside such a widget (as SC-522 does inside an embed) and, in a bubble listener, on the top of the detached subtree when the click target was removed from the root during the click (a rebuilt card's old button; without that the walk ended at `null` and the callout/embed was selected anyway). Fixtures `Lifecycle/callout-click.md` (a callout with body text + counter Twin 5, a plain counter Plain 5 below), `callout-fold.md` (`> [!note]-` with a counter), `callout-link.md` (a callout holding a feature whose effect links `[[Lifecycle/other]]`), `callout-init.md` (a callout holding a one-hero initiative tracker), `callout-init-src.md` + `callout-init-host.md` (the tracker in a note that an LP host embeds with `![[…]]`). Real CDP mouse and a real Enter/Escape key; every phase opens its note fresh in Live Preview (cursor on line 0); the scenario owns its leaf (its own tab is in its keep set; it detaches the leaves it adds, so it is safe before G-S56 and when run alone). Phases (a) real click on + with the callout's top 30 px cut off (a selection WOULD scroll the editor): written ([6,5]), still a card (a connected DSE root inside a `.cm-callout` widget, no raw `> [!` line), selection and scrollTop unchanged; (b) Enter on the focused pencil opens the form, Escape closes it: card, selection unchanged at both points, note unchanged; (c) controls that keep Obsidian's behaviour: a real click on the callout's text, title and `</>` each open the source (also proves the scenario can see source mode), the `-` callout's chevron unfolds without moving the cursor; (d) an internal link in a card in a callout opens: plain click navigates the tab, Ctrl-click (CDP modifiers 2) opens a new tab, which must show its note and settle 1.5 s before the next phase detaches it (detaching a tab that is still loading made Obsidian log `RangeError: Field is not present in this state` from `saveHistory`, which G-S62's no-page-error assertion counts: 2 of 6 runs before the wait, 0 of 6 after); (e) a click on the card text: card, selection and scroll unchanged; (f) control: + on a plain fence; (g) Advance round on the tracker in a callout: written, card, selection unmoved; (h) Advance round on the tracker in an LP embed: written, host selection and scroll unmoved, card drawn; (i) Reading view: + in the callout note writes ([6,5]) and no card nor ancestor carries `interactive-child`. Every phase runs even after one fails. Measured (1.15.0): HEAD passes all nine phases (97 s alone). At r1 the `eaf64ba6` bundle FAILed (a), (b), (e) (phases (g)-(i) did not exist then); a `992375b6`-equivalent bundle (the r1 fix without the detached-target listener, `8f672965`) FAILs (g) (raw callout, selection 0-0 -> 316-151) and (h) (embed selected, 0-0 -> 243-212) and passes (a)-(f), (i). The r1 "no callout mark" bundle (the `.cm-callout` clause removed) FAILed (a), (b), (e); a "mark every `.callout`" bundle (`root.closest('.callout')`) FAILs (i) only (`[true,false]`). Jest `test/dom/framework/pipeline.test.ts` pins the selector (marks in a callout widget and in an embed; not Reading view, a plain widget or a line) and the detached-target case., SC-544 G-S61 — two quick clicks on identical blocks (the second inside the first block's 400 ms debounce) each write the block clicked, and every card shows its own block; `ReadingModeBlockHost.replaceSource` first writes every OTHER pending view of the note (`ViewRegistry.flushPendingWrites`, synchronous, before its own section read), because the first block's write makes Obsidian hand the waiting block's element to the next identical twin and the waiting edit was then placed through the twin's block. Fixtures `Lifecycle/twin-callouts-4.md` (4 callouts) and `twin-callouts-xy3.md` (3 callouts of two counters, X5 Y3); it also reuses `twin-callouts-3.md`, `twin-callouts.md` and `twin-triplets.md`. The first click is a real click (`t.realClick`), later ones are "quick" real clicks 120 ms after the one before (one eval for the point, then press and release, no scroll, no sleep); the click targets are found by block (a Live Preview card belongs to the n-th counter fence at or after its widget's line), so it does not matter whether a click leaves the callout drawn or turns it into source (SC-540). Phases (a) LP 3 callouts, + upper then + middle: want [6,6,5], then + lower [6,6,6]; (b) the same with a third click ~280 ms later: [6,6,6]; (c) LP 4 callouts, blocks 1 then 2: [5,6,6,5], then block 3 [5,6,6,6]; (d) LP callouts of two counters, X upper then Y middle: [6,3,5,4,5,3]; (e) LP, the upper's edit form open, a script + on the middle, Save 120 ms later: [5,6,5], names [Edited,Twin,Twin]; (f) LP plain fences: [6,6,5], then [6,6,6]; (g) Reading view callouts: [6,6,5], then [6,6,6]; (h) Reading view plain fences: [6,6,5]; (i) two panes (upper in Live Preview, middle in the Reading view pane): [6,6,5], then [6,6,6]; (j) controls that were clean before and must stay clean: LP middle then lower [5,6,6]; upper then middle 700 ms apart [6,6,5]; two callouts [6,6]; three slow clicks [6,5,5] [6,6,5] [6,6,6]. Per phase: anti-vacuity (click 2 logged before the note's first write, from the page's click and `modify` log), disk values, one card per block showing its block's value and name (cursor parked), text outside the blocks unchanged, and in Live Preview a per-frame recorder. It fails a phase for (1) a card with a pending edit on a block other than the one it was clicked on, in ANY frame; (2) 3 counted frames in a row in which a card with nothing pending does not match its block in the editor's document (`cm.state.doc`); (3) a card that is AHEAD of the document for more than `CATCH_UP_CAP_MS` (1000 ms) of wall time; (4) any frame in which the recorder's own disk read threw, or a disk read that was torn in 3 frames in a row (green: at most 2; the stale-frame check would be off). SC-557: the recorder reads the note from disk synchronously every frame. A stale card that shows the block's DISK value while the document has not taken it yet is "catching up" (under load the redrawn card is up to 6 frames / 117 ms ahead of the document). Catching-up frames are not counted for (2) and neither add to the run nor end it (only a frame with no wrong card ends it). A card that differs while the document already holds the disk value, or that matches neither, is counted as before. A TORN disk read (the file holds fewer values than the document: Obsidian opens the file and writes it only when the main thread gets to it, so a read can land between the two; reading again in the same frame does not help) extends a counted run that is already going and is otherwise judged catching up (bounded by the cap). The ok line carries per phase `[catching up: longest N frame(s) / M ms, document behind the disk up to K ms after the write; stale cards: catching up A, on a torn disk read U, document had the disk value B, neither C; disk reads: torn in T frame(s) (longest run L), failed in E; counted: <samples>]`; a failure message lists the counted frames first. 0 Notices, 0 page errors. Reset in `finally`. On the `f7c9c7ce` bundle (no fix; SC-540 does not change it) it FAILs (a)-(i) with the measured numbers: (a) [6,5,6] with 8 wrong-card frames, then [6,5,7]; (b) [6,5,7]; (c) [5,6,5,6]; (d) [6,3,5,3,5,4]; (e) [5,5,6]; (f), (g), (h), (i) [6,5,6]; (j) passes. The red bundle is a `git archive` export of `f7c9c7ce`'s `src/` built with `esbuild.config.mjs production` (main.js sha256 730f051c…; earlier red bundles: `eaf64ba6` ed429587…, and `423e798d` = `dabfb518` aa4efdf6…). Controls (temporary bundles via `DSE_LIFECYCLE_BUNDLE` built from `git archive` exports of the fix with one change): **no flush call** FAILs (a)-(i); **flush after `await Vault.process`** FAILs (a)-(f) only through the recorder (2-3 frames with a pending card on another block; the disk is right); **flush only for the view's own write (`fromView`)** FAILs (e) only; **flush only for callouts** (M4, the r3 reviewer's control) FAILs (f)-(i) (plain fences in Live Preview, Reading view, two panes). **Since SC-552 (dse `31d8f779`; SC-557 re-measured)** its position pins already place the Reading-view writes right without the flush, so on `31d8f779` the red bundle `f7c9c7ce` still FAILs (a)-(i) ((a)-(f) disk + pending, (g)-(i) disk) and flush-after-await still FAILs (a)-(f) by pending only, but **no flush** FAILs (a)-(f) only (by pending; (b) also disk), **`fromView` only** FAILs (e) by pending only, and **callout-only (M4)** FAILs (f) by pending only: nothing but the red bundle fails (g)-(i) any more. M4 is SC-544's exact sibling-based one-liner: in `ViewRegistry.flushPendingWrites` (`src/framework/host/viewRegistry.ts`), directly after the loop's `continue` guard that skips the excepted, released and other-note entries, insert `if (!entry.root.closest('.cm-callout')) continue;` (the writer always flushes; a writer-based variant at the `replaceSource` call is a different control: it fails (f)-(h) and passes (i)). **Standing probe controls for the stale-frame check and the cap (SC-557):** none of the red bundle or SC-544's controls fail through the stale-frame check or the cap, so four fault-injection probes exercise them, from a scratch copy of the harness made by `docs/superpowers/dse-overhaul/build-ledgers/sc557-gs61-stale-frame-flake/sc557-r5-tool-probe-patch.py` (never committed; run from a `git archive` copy with `node_modules` symlinked and `DSE_LIFECYCLE_BUNDLE` pointing at a built bundle; full commands and env in that dir's `sc557-dse-verify-proposal.md` §3): **X2** (`SC557_DOC_DELAY_MS=1500`, the document held back 1.5 s) FAILs all 9 LP phases by the cap; **X5** (`SC557_INJ=2:7:400`, block 2's card shows 7 for 400 ms) FAILs (a)-(f), (i), (j1) by the counted-stale check; **X6** (X5 + `SC557_BADREAD=1`, every disk read fails) FAILs those plus (j3) by "could not read the note from disk"; **T** (X5 + `SC557_BADREAD=torn`) FAILs all 9 by "the recorder's disk read was torn in N frames in a row"; X1 (document held back 600 ms) must PASS (36 frames / 600 ms catching up, 0 counted). ~100 s., SC-472 G-S59 — a scroll pin / hold is released by the redraw it protects, not by a 2.5 s timer a busy main thread can outrun, and a reader's scroll does not count as that redraw. Fixtures: existing `Lifecycle/tall.md`, `lpembtracker.md`, `lpembhostend.md`, and `pin-virt.md` (10 paragraphs, a 25-hero tracker, 110 paragraphs; added for (c)). **What discriminates, plainly (SC-472 r3, LOW-1).** (1) For (a) and (b) the lateness comes only from the 4 s busy spin: right after each write a `modify` listener spins `performance.now()` for 4 s (a slow handler of another plugin), so the redraw starts later than `PIN_TTL_MS` whatever order Obsidian's panes handle the write in. There is NO CPU throttle (SC-561 took out the CDP 8x throttle SC-472 had added: each write costs about 2 s of real style and layout work in Obsidian, which the throttle stretched to 14-20 s at idle against the 30 s cap and past it under load, so the scenario failed with "timed out waiting for the pin or hold released and the tracker redrawn"; do not add one back). Without the throttle the write -> redraw latency is 4.0-7.2 s and the whole wait 5.4-10.1 s at loadavg 4-50, against the 30 s cap. With the spin the build before SC-472 (`367a2f1d`) and the plain-timer control still FAIL 3 of 3 writes in each of (a) and (b), and the shipped build passes (about 120 s); without the spin both phases FAIL as vacuous (latencies 0.05-1.2 s). Under a throttle alone phase (b)'s embed redraw came 0.4 s after the write in some runs and 12 s in others (Obsidian's pane order), which made the phase vacuous one run in five. (2) The anti-vacuity check (a phase FAILs unless one write was redrawn later than `PIN_TTL_MS`) is met by construction (`BUSY_MS` 4000 > `PIN_TTL_MS` 2500); it only catches a spin that did not run. (3) G-S59 does NOT test the backstop's busy rules ("never while a root of ours is empty", "never while a started redraw is unfinished unless 60 quiet frames pass"): a build with every busy rule removed passes it. Those rules, and every other guard, are covered by jest mutation tests only (`redrawBackstop.test.ts`, `previewScrollPin.test.ts`, `livePreviewScrollHold.test.ts`; 65 mutations, all killed). Phases (a) and (b), 3 outside `vault.process` writes each, no CPU throttle, only the busy spin (the busy listener is removed in a `finally`): (a) a Reading pane and a Live Preview pane of `tall.md`, both parked in the tracker, the Reading pane observed (SC-470's sibling case; stock scrollTop 2779 -> 2001); (b) a Live Preview host (`lpembhostend.md`) parked at its end embedding `lpembtracker.md`, plus a Reading pane of that note parked in its tracker (SC-522; stock 7486 -> 3745). Event-based wait, no timer decides an outcome: until the pin / hold attribute was seen on and is gone AND the observed tracker was replaced and a mounted one is back (cap 30 s; recorder state in the FAIL text on a timeout). Per write: scrollTop identical in every frame, the pin / hold on when the tracker was replaced, released, the tracker redrawn; the write -> redraw latency is printed per write (observed 4.0-7.2 s; the wait after each write, to the 10th frame after the release, is printed too: 5.4-10.1 s at loadavg 4-50, against the 30 s cap of each wait). Phase (c), no spin: the pane's `setViewData` is held back (as G-S18 (d) does) so the redraw is late by construction; real CDP wheel scrolls (two large steps each: 2 x 3000, down then up 2 x 3000 and -1800, second tracker 2 x 6000: every wheel step makes Obsidian render the sections it passes, so ten small steps took 2-4 s at load), then the redraw is let go at write + 2.4 s (`PIN_TTL_MS` - 100 ms: a correct build is pinned until at least `PIN_TTL_MS` + 30 painted frames), after asserting that the scroll ended before then and the pin is on at that moment. A release at ANY earlier point is therefore caught, however delayed. Three scrolls: to the end of `pin-virt.md` and down then back up (Obsidian's scroll virtualisation takes the tracker's section out of the document, sizer untouched), and to the second tracker of `pin-virt2.md` (Obsidian draws the second tracker for the first time while the first tracker's redraw is held). It FAILs if the pin was released before the redraw, or if the scroller got shorter than at the arm while the sizer was collapsed; the final position must be at least `min(position before the redraw, arm-time scrollHeight - clientHeight) - 2` (the floor never rises to content Obsidian measured during the hold, so the page can settle about 500 px higher: -512 here, -448 on stock). Anti-vacuity: the root left the document (one tracker) / a second root was drawn (two), the sizer was untouched until the redraw was let go, then collapsed and came back. A scroll that takes longer than 2.4 s is environment, not a verdict (a correct build may then let go from its backstop), so that attempt is discarded (its recorder is stopped, not awaited, and its held redraw is let go; a scroll of 3 s or more finds the correct build's backstop already released, so the recorder would not finish for 40 s) and the variant is re-run, at most twice; only that precondition alone can trigger a re-run and the product assertions run on the valid attempt (the output names a discarded attempt; three too-slow attempts in a row FAIL with the environment message, also when the pin was already released: proved with a real 3.5 s delay on every attempt, no 30 s timeout). Measured at SC-561: scroll 0.1-2.4 s (worst: the second tracker's first mount, 2.38 s at loadavg 29 and 2.33 s at 32 with 8 busy loops), no attempt needed a re-run in 8 runs on the r2 harness and in 5 runs on the r4 harness; the reviewer saw 1 organic re-run in 6 runs (2682 ms, loadavg 45-62, it recovered). Proof of the re-run with a real delay (SC-561 r4, a scratch copy that sleeps 3.5 s after the wheels on the first attempt): all three variants discard (3.6-4.6 s, pin already off in two of them), re-run and pass. Every phase and write runs even after one fails; a FAIL line carries the screenshot. Controls (temporary bundles via `DSE_LIFECYCLE_BUNDLE`, built from `git archive` exports in a scratch dir): the pre-SC-472 develop build (`eafe76e1`; the pin and hold files are identical at `711f740d`) FAILs (a) and (b) (3 of 3 writes clamped in each); release-on-redraw with a plain 2.5 s timer instead of the load-aware backstop (`Backstop.afterDeadline` fires at once) FAILs (a) and (b) 3/3 each; the SC-472 first version (any removal of an arm-time root counts as "redraw started", `b8f7fcb2`) FAILs (c) in all three scrolls; the r4 version (`4a9e77fb`: a root new since the arm also counted) FAILs (c) "to the second tracker" only; a build with the first version's logic and its check delayed by 1 s (`b8f7fcb2` + `held.check = setTimeout(run, 1000)`) FAILs (c) in all three scrolls (with the old fixed 300 ms wait it passed "to the end"). (c) passes on the pre-SC-472 build and on the plain-timer control, which only shows that those hold a scrolling reader on their own terms (the timer is still running). A 10 s plain timer is NOT a gate control: it escapes about 42 % of runs. Re-measured without the throttle at SC-561 (once each, bundle via `DSE_LIFECYCLE_BUNDLE`): `367a2f1d` and the plain-timer control FAIL (a) 3/3 and (b) 3/3 writes (clamped scrollTop); `b8f7fcb2` FAILs (c) in all three scrolls ("the pin was released before the late redraw") and passes (a) and (b); at SC-561 r3 the `4a9e77fb` control still FAILs (c) "to the second tracker" only and `b8f7fcb2` with its check delayed by 1 s still FAILs (c) in all three scrolls. Neither commit is in the repo's object store any more: `b8f7fcb2` survives only as a bundle with main.js sha256 `d719e745…` (SC-472 r4 scratch, `bundles/prev`) and `4a9e77fb` only as `sc472-r3-a5a83f0e5db8b6abf/bundles/r4` (main.js sha256 `d496299b8fd7…`); archive them if the controls must outlive the session. A timeout of one of the 30 s waits is no longer a load symptom (waits are 5.4-10.1 s at loadavg up to 50, SC-561; the (c) re-run no longer waits on its recorder): treat it as a finding., SC-552 G-S64 — the block edit form opened on one of several identical blocks saves into the block it was opened on. The plugin's 400 ms debounce timer is HELD (G-S45's `setTimeout` hook) and fired by hand: a real click on + (held), the pencil of another block pressed with Enter (the Live Preview pencil cannot be clicked, SC-523), the held write fired, then the hand-over of the form's card is PROVED before Save (its registry entry is on the next block down, or released), then rename + Save and the disk, the names, one card per block (by block, G-S61's rule) and the text outside the blocks are checked. Phases: (a) LP callouts c3 + 0, form 1 · (b) LP plain · (c) Reading view callouts · (d) Reading view plain · (e) two panes (+ in LP, form in Reading view) · (f) LP c4, + 0, form 2 · (g) Reading view c2: the form on the lower block stays open when its view is thrown away, Save lands · (h) LP, form 1, in-app outside edit of block 0 · (i) Reading view plain, outside edit on disk · (k) outside edit that also inserts a paragraph above (catches an identity line map) · (l) a kept-open form closes when the plugin is disabled and the note is unchanged · (m) control: the form after the click's write landed · (n) SC-549: + on block 1 held, in-app outside edit of block 0, fire → [7,6,5] · (o) SC-549 LP: + on block 1 held, a character typed in block 0's title, fire (waits for the editor to take the written value before saving; Obsidian's "merging changes" Notice is allowed here) → [5,6,5] · (p) K-strict: Reading view plain pair, kept-open form, its block deleted from outside and the upper block back to the fixture text: Save writes nothing, one "was not saved" Notice (`t.noticesSince`), the form stays open · (q) a kept-open form on the unterminated trailing fence (blank lines added at the end of the note by an outside edit, so Obsidian draws that section again and releases the old view while the note is shown): Save writes that block only · (r) the note navigated away in its pane with a pinned form open and (s) its pane closed (a second pane): the form closes with its view and nothing is written (a form is kept open only while its note is still shown in some pane) · (t) a form that was cancelled leaves nothing on the registry when its view is thrown away later; phases (a)-(i), (k) and (t) also assert that the registry holds no component for the closed form (`window.__gs64.holders() === 0`) · (u) Live Preview, two callouts: a kept-open form, the plugin disabled and enabled again (SC-545's redraw): the form closes with nothing written, both cards are drawn again and a real click on the lower one counts in the lower block (`[6,6]`). Fixtures: `Lifecycle/form-pin-unterminated.md` (new), the existing `twin-callouts-3/-callouts/-callouts-4`, `twin-triplets`, `twin-pair`. Base (`09ece2eb`, main.js sha256 `fe88efc5…`; earlier bases `ea78ebf8`, `0698550f` and `367a2f1d` failed the same phases, measured before (u) existed) FAILs (a)-(i), (k), (l), (n), (o), (p), (q), (u) (names `[Twin,Twin,Edited]`; (n) `[7,5,6]`; (o) `[5,5,6]`; (g)(l)(p)(q) "the form closed by itself"), passes (m), (r), (s), (t). Mutants (temporary bundles, one source edit each): no pin at open FAILs (a)-(f), (h), (i), (k) and, by losing the keep-open, (g)(l)(p)(q); pin taken at Save FAILs (a)-(f), (h), (i), (k); line map = identity FAILs (k) only; keep-open removed FAILs (g)(l)(p)(q); kept form's close not hung on the registry FAILs (l) and (u); a disable that saves the form before closing it FAILs (u) only — (l) reads the note as soon as the form closes, so a late write is caught by (u)'s later name check, not by (l) (SC-552 r7 LOW-1, ruled no change); wide pin removed FAILs (n)(o); keep-open without the note-still-shown check FAILs (r)(s); the `closed` flag removed (a closed form is kept open when its view unloads later) FAILs (t) and the holder check of (a)-(i), (k); strict Save removed FAILs (p); unterminated-fence pin removed FAILs (q)., SC-556 extends G-S64 with phases (v) to (z) — a block edit form's Save is pin-only for EVERY form (before, only for a form kept open past its view): when the form's OWN block was edited or deleted from outside while it is open, Save writes nothing, shows exactly one Notice `Draw Steel Elements: a change to a block in <note> was not saved — the block changed on disk first.`, the form stays open and the outside change is kept; a form Save's Notice is never rate limited (card writes keep one per note per 5 s). (v) three plain twins with prose between them, Reading view, form on the middle block, its body edited on disk; (w) the same with the middle block deleted in-app (note `Lifecycle/form-strict-triplets.md`; checks: note byte-identical after Save, exact Notice text, form open, no component left on the registry); (x) HEADING embed `![[gs64-emb-src#Tracker]]` of a 1,220-line note with an identical counter above the section, Reading view: Save lands in the embedded block, nothing else changes, no Notice; (y) the same in Live Preview; (xa)/(ya) + on the card and AT ONCE its pencil (the embed has not redrawn yet): Save lands, value 6; (xb) a BLOCK embed `![[gs64-embb-src#^gs64blk]]` of the lower of two identical counters in a short note: Save writes the embedded block, not the one above; (zh) a Ctrl-hover preview of `[[gs64-embb-src#^gs64blk]]` (card under `.popover.hover-popover > .markdown-embed`, no `src`): the block's text occurs twice, so Save writes NOTHING and shows the one Notice (the preview closes with the pointer, so the form is not asserted open); (z) the embedded block edited on disk while its form is open: nothing is ever written into the twin (the form closes with the embed's redraw in Reading view, or stays open and Save shows the Notice). Base `6270e84a`: (v), (w) write the edit into the identical block that is left and close the form; (x), (y) pass on base but failed with the SC-556 r2 head; (xb) and (zh) write the block above on base. Since SC-596 (zh) expects the hover form to LAND in the linked block (the hover's link places it; it expected a refusal before). No new scenario id (G-S68 was not needed); SC-584 adds G-S64 phases (zk) hover preview of a short note: + then pencil lands, (zl) `[[long note#Tracker]]` hover: + then pencil lands (a different counter above the section stays untouched), (zm) the + made the block read like the one above it: Save lands in the lower (the + block), the upper untouched, (zn) control: the form's own block edited from outside AND a block with the old body added in one write: nothing written (form stays open, one Notice), (xc) `![[note#^id]]` of the lower of two identical callouts with text after the counter lands (Reading view), (yc) the same in Live Preview, (xd) / (yd) the same after + on the card and at once the pencil (RV / LP), (zc) smoke check only (the outside edit's redraw closes the form, so it is not a control; nor is (z)); fixtures `gs584-hov-short(-host)`, `gs584-hov-head-src/-host`, `gs584-hov-twin(-host)`, `gs584-cal-src/-host`; on the unpatched a339e7b3 bundle (`DSE_LIFECYCLE_BUNDLE`) G-S64 FAILs (zk) (zl) (zm) (xc) (yc) (xd) (yd) and passes (zn), SC-621 G-S115 — a counter in a hover preview or an embed of PART of a note (`#Tracker`, `#^p`) while ONE outside write (`vault.process`) deletes the counter the card was drawn from AND edits a line on one side of the pair; the part's own text is unchanged, so Obsidian does not redraw the preview, and a scripted + (or the pencil, then Save) on the OLD card must write nothing and show exactly one "changed on disk first" Notice; nine cells, one note each: (a) heading hover RV card, (b) heading hover LP form, (c) heading embed RV card, (d) heading embed LP form (sections `## Tracker` / `## Other` with identical counters, the Tracker section deleted, `## Other` renamed `## Tracker`, END edited); (e) block hover RV card, (f) block embed RV form (two identical counters separated by a blank line, `^p` under the lower one, the lower one deleted with its `^p` line left under the upper one, TOP edited); controls (g) TOP edited only: + saved into the hovered counter ([6,5]), (h) no edit: + saved into the lower counter ([5,6]), (i) the deletion with TOP edited instead of END: refused on both bundles; red on a 14521bf0 bundle: (a)-(f) wrote the OTHER counter, no Notice; (g)-(i) green there too; about 73 s alone, SC-619 G-S112 — a hover preview of a HEADING of a note saved with CRLF, one all-CRLF note per phase with two identical counters under `## Tracker` / `## Other`. (a) Reading view real + in the hover of `#Tracker`; (b) Live Preview, the same; (c) real + in the hover of `#Other` (the lower one); (d) the Edit form opened in the hover, renamed, real Save: each saved into the hovered counter, no Notice, the note stays all-CRLF, the text outside the fences and the twin untouched. (e) the heading names swapped from outside, real +; (f) two ADJACENT identical `## Tracker` sections, the hovered upper one deleted from outside, real +: each refused (nothing written, exactly one Notice). (g) the fence right under the heading (no blank line), real +: saved. Each phase also asserts the hover's part starts with `\n` (the CRLF slice was reached). Red at the `1f1ae442` bundle (measured): (a)-(d) and (g) fail (values `[5,5]` / names unchanged, one Notice), (e) and (f) pass there too (everything was refused) and hold the fix. Authoring: the checks compare values and names and the text outside the fences, never fixture text (the plugin rewrites the YAML in its own key order), SC-612 G-S108 — a form Save or a card + / - on one of two identical blank-line-separated counters after an outside edit deleted or added a twin, 15 cells, one note each: (a)/(b) form on the upper twin, the upper deleted, RV / LP; (c)/(d) + on the upper twin, the upper deleted inside the 400 ms round, RV / LP; (e) form on the lower twin, the lower deleted + TOP edited, RV; (f) + the same, LP; (g) the cost: a twin added below the form's block: refused, Cancel, reopen, Save lands, RV; (l)-(o) = (e) / (f) with a counter of ANOTHER value below the twins (three cards): form RV / LP, + RV / LP (the review's H1); controls (h) form no edit RV, (i) + no edit LP, (j) + twice RV, (k) a sibling twin's + then this card's, LP. Red at a c0995beb bundle: (a)-(g) and (l)-(o); (h)-(k) green there too; authoring: one note per cell (card Notices are rate limited per note); the form is opened by Enter on the focused pencil and the raw box renamed (`Twin` -> `Edited`), the outside edit by `t.edit`, 1.5 s for the redraw, Save by `.click()`; the cell's modal is cancelled in `finally`; the card count is read from the fixture; about 67 s alone, SC-607 G-S99 — a still-open hover or embed of part of a note after an outside edit that leaves its part unchanged, 8 cells, one note each: (a) heading hover RV + LP, (b) heading hover names swapped, (c) heading embed, (d) block hover markers swapped, (e2) block-hover form kept open by a second pane, (e3) form opened after the swap, control (no outside edit, real +). Green = nothing written, exactly one "changed on disk first" Notice, outside edit kept (control: [6,5], no Notice). Alone about 72 s with build and start-up. Red on a clean 622b0904 bundle: 7 of 7 cells (the control green); on 231f2a3b / 3ad68185 bundles (d) was green on one of three runs (refused at base once, wrote the other counter twice). About 72 s alone, SC-601 G-S97 — the compendium search over an editing hover preview (9 real-CDP-input trials, one `G-S97-REC <json>` line each, every trial runs even after one fails, the failures are listed together): the compendium search opened while a hover preview is a source editor (a real Ctrl-hover, a real press on the prose; anti-vacuity: the preview is shown, `.is-editing`, has a visible `.cm-editor` and owns `workspace.activeEditor`). 1. command (`executeCommandById`), press in the input, press a suggestion: preview still shown and `.is-editing` after the press and after the pick, the reference is on disk in the HOVERED note and not in the host. 2. command, press the box (`DIV.prompt-results`), ArrowDown + Enter: same. 3. command, press the backdrop (`.modal-bg`): the search closes, the preview stays. 4. command palette (real Ctrl+P, typed name, Enter), press in the input, press a suggestion: same as 1. 5. snapshot command (`insert-compendium-block`), press in the input, press a suggestion: same as 1, and the note holds a `ds-` fence. 6. command, press a suggestion at once (control): green on the base too. 7. the note in a pane, press in the input, press a suggestion (control): green on the base too. 8. the preview hidden by script behind the open search (`view.previewMode?.hoverPopover ?? view.hoverPopover` `.hide()`), then ArrowDown + Enter: exactly the Notice `The note you were editing was closed, so nothing was inserted.`, nothing in the hovered note or the host, the search was still open. 9. the snapshot command, press in the input, then the preview hidden FROM INSIDE `compendiumIndex.getEntity` (a one-shot page-side wrapper, `app.plugins.plugins['draw-steel-elements'].compendiumIndex.getEntity`, installed after the press and before the pick; it restores itself, hides `previewMode?.hoverPopover ?? hoverPopover` and calls through), then a press on a suggestion: the hook fired once and hid the preview, EXACTLY ONE `closed` Notice, nothing in the hovered note or the host. This is the block command's late re-check (the choose-time check has already passed; `getEntity`, `entity.model()` and `entity.body()` then run before the write). The wrapper is deleted in the trial's `finally`. Red on the base (`5f7c5336` bundle, footgun (9) recipe, 71 s): `15 broken expectations`: trials 1-5 and 8 are red (1, 2, 4: the press closed the preview, the pick did not land, the preview was gone after; 3: the backdrop press closed the preview; 5: also no `ds-` fence; 8: no Notice), trials 6 and 7 stay green. **Green on the branch**: 9/9, 61 s (r4). Trial 9 alone is red against the r2 bundle (built from `10f8aaf0` on `c6077860`: the r2 source, which has the early check but not the late one; also measured against `f9b0ceaf` on `7866426e`): `1 broken expectations: not exactly one "closed" Notice []` (the hook fired and hid the preview, nothing written, no Notice: the SC-601 symptom, still there for the block command); the other eight are green on it. About 61 s alone, SC-596 G-S96 — the Edit FORM of a counter in an embed / hover preview, pressed between an outside write and the redraw it causes (the pencil is clicked by a script in the SAME page task as `await vault.process(...)`; a real press lands in that 36-114 ms window only by chance), with the SOURCE note also open in a second pane: the form is then KEPT OPEN past its card (SC-552 `keepFormOpenOn` needs only the note shown in some markdown leaf; without the pane the form closes 49-98 ms after open and nothing can be saved - the vacuous control cell). Eight cells: block embed RV (control, no pane), block embed RV and LP, heading embed RV of two `## Tracker` sections (A under the FIRST), block hover RV and LP, heading hover RV and LP (section followed by `## After`). Green: nothing written (the note is what the outside edit left), exactly one "changed on disk first" Notice, the form still open after Save, the outside edit (9) kept. **Red on `5f7c5336`: 7 of 7 pane cells wrote the twin with no Notice** (`sc596-r2-lifecycle-gs96-on-base.log`). Footguns: a hover fixture whose tracker section is the LAST of the note refuses at base (its part carries trailing `END`, which the twin's body does not): follow it with `## After`; the cell cancels / Escapes any form left open (a refused Save keeps the form open and a kept-open form outlives its card); one note per cell. About 71 s alone, SC-594 G-S92 — hover card writes, its own part 6: trials (a)-(k) as listed in "Hover card writes (SC-594)"; red on the e0e49d4d bundle (a)-(i), (j) red on the 0bf5989d bundle; about 103 s alone, SC-598 G-S91 — the stamina modal opened from a hover preview by a REAL press on the bar's "15" (the helper's 150 ms path; the press point is asserted to hit the number's own element, as G-S83's stamtext), then a second real press inside the modal within 150 ms: on the title (Reading view and Live Preview), a double-click whose second press is queued while the modal opens (lands on the backdrop; Reading view and Live Preview) and the Apply input then Healing 3 + Apply (Reading view), plus `reopen rv` (r4: open, wait past 150 ms, Escape, open AGAIN from the now focused preview with the same press, title press within 150 ms: no `.cm-editor` visible, the keyboard focus not inside the preview, Escape closes only the modal; red on the base AND on the r2 head `47950f45`, where it is the only red). Red on the base: all 6 trials, the preview is gone 700 ms later (T3 hides it 5 ms after the second press). Green: preview shown, no visible .cm-editor in it, title: modal open and Escape closes only the modal, dblq: the backdrop press closes the modal and the preview stays, apply: current_stamina: 18 with no Notice; then the pointer away for 1.2 s keeps the preview and a real click outside closes it. The outcome line carries the measured gap (50-93 ms for title / apply / reopen, 99-133 ms for the queued double-click across runs); a gap of 140 ms or more fails title / apply / reopen as vacuous (a loaded host?). The gap is mostly the renderer opening the modal: 33-79 ms on an idle host, up to 110 ms at loadavg 6-14 (r6 part 5). A G-S91 FAIL whose only message is "the second click came N ms after the opening click" is a loaded host, not a regression: re-run part 5 alone on a quieter host before blaming the change; do not raise the 140 ms threshold (the helper waits 150 ms). Build the base bundle in a scratch git archive copy and pin it with DSE_LIFECYCLE_BUNDLE to see it red (G-S83 footgun 9). About 51 s alone, SC-597 G-S87 — a modal opened from a hover preview by the keyboard stays open: stamina Enter (Reading view and Live Preview), stamina Space, montage Enter; at 1.5 s the preview and the modal are open, a real click on the title keeps both, Healing 3 + a real click on Apply writes current_stamina: 18 with no Notice, Escape (also 450 ms after a reopen by the same key) closes only the modal, the preview stays with the pointer away and a real click outside closes it. Red on the 94133a5a bundle (all four trials fail at the 1.5 s step: preview and modal both gone), green on the fixed bundle. It does not assert a single modal or the 10 ms re-push order (those are jest: K4 and K6). Fixtures `Lifecycle/gs83-stam.md` / `gs83-stam-host.md` (shared with G-S83) and `Lifecycle/gs87-mont.md` (a `ds-montage`, `rounds: 3`, one participant Kira, `current_round: 2`; the opener is the first `.dse-mt__cell[role="button"][tabindex="0"]`, the round-1 past empty cell) with `gs87-mont-host.md`; about 48 s alone, SC-595 G-S83 — hover preview, real CDP mouse. The block edit form (+, pencil): a press and release in the raw box keeps preview and form, typed text and a real Save land (no Notice, preview shown), Escape closes a new form, Cancel closes another, a click outside closes the preview. The stamina modal (title click, free-heal Confirm keeps the Stamina modal with its staged heal) and the initiative Conditions modal (title click, "Add condition") stay open; Escape closes them. Reading view and Live Preview for all three; the stamina modal is also opened by a press on the bar's number text and closed by Escape 450 ms later (the 150 ms helper path), Reading view; red on the `eaa8742a` bundle; about 64 s alone, SC-584 G-S77 — a callout with TWO counters, embedded as a block (`![[note#^id]]`) and by its heading, RV and LP: + on the lower counter and at once the pencil, Save writes the LOWER counter, the upper untouched, no Notice (fixtures `gs77-cal(h)`, `gs77-hq(h)`, `gs77-li(h)` `-src/-host`: callout, header-less quote whose first line is the upper fence, list item, where the list item writes nothing and leaves the upper untouched; trials (a)-(j); the shared trial `gs77Trial` returns what the note says and asserts nothing, so a scratch scenario can probe a variant); the 796f5a87 (SC-584 r5) bundle fails (e)-(h) (the header-less quote: the upper counter written), the f2889351 base bundle fails (a)-(h) (block embeds refused with the Notice, heading embeds write the upper); about 60 s alone, SC-480 G-S73 — a card write whose block was DELETED from outside is never written into an identical twin. Two identical counters, a note of its own per trial (card Notices are limited to one per note per 5 s): click +, delete the clicked block at once, then leave the note (unload flush) or wait 2.5 s (debounce flush), Reading view and Live Preview, twin above and below: nothing written, the note is what the outside edit left, exactly one "changed on disk first" Notice. Controls: a twin-free deletion (one Notice) and the race (the outside edit only moves the clicked block, twin above or below): the + lands in the clicked block, no Notice. 18 trials (r4 added sync-del-bump and dup-move, r6 swap-solo, RV + LP, leave). FAILs on a pre-SC-480 bundle: the 6 deleted-twin trials; on the r2 build (cb665989): the 2 sync-del-bump trials; on a build without the `now` count: the 2 dup-move trials; on the r4 build (63492c9a): the 2 swap-solo trials, SC-520 G-S49 — a block that is the FIRST thing inside a `> [!note]` callout: real-mouse clicks on the chrome panel (Live Preview and Reading view): every button hit-tests to itself across its whole face (Obsidian's `</>` no longer covers Collapse's right edge in Live Preview), the pencil opens only the edit form, Collapse/Expand work, the callout neither opens as source nor folds, the cursor stays, CodeMirror's height for the callout widget equals its on-screen height (counter, feature, statblock), Obsidian's title, fold chevron and `</>` stay clickable, and a callout that also holds a table far wider than itself still scrolls sideways by a real wheel with the last column reachable, SC-536 G-S56 — the reference guard follows the DOM, in real Obsidian with lookups and file reads held at hooks and released by hand: (a) a card whose effect markdown references the same note stops after 2 lookups at one `Reference loop: @… is already shown by a card this one is inside.` card nested one level inside it, (a') the same in Live Preview (own tab leaf), (cap) seven distinct references stop at 5 cards and the `Reference nesting too deep: more than 5 references inside one another.` card with only 5 lookups, (b) two panes (split plus a redraw), (c) a plugin off/on with two panes and (d) two redraws each hold two reads at once and draw one card per pane, released FIFO then LIFO, never a refusal; it runs last and first replaces every other markdown and sidebar leaf with one fresh Reading-view leaf, because a leaf that was in Live Preview keeps an editor that looks up the next note's blocks too (a scenario added after it must set up its own leaves); on `f81a277`'s `src/` it FAILs every phase (cycle: 8 released and still going; cap: 7 lookups; b/c/d: 1 read held, the other pane refused); G-S16 reserved for SC-471), exit 0 (~14 min). Builds `main.js` itself, so it runs AFTER jest; own Xvfb `:160–:199`, started through `scripts/xvfb-owned.mjs` (SC-546): the display is used only after OUR Xvfb reports it is listening (`-displayfd`), so two lifecycle runs started in the same instant never share a display; a lost race moves on to the next number. CDP port (SC-551): by default Obsidian is started with `--remote-debugging-port=0` and the run uses the port OUR Obsidian reported in the `DevToolsActivePort` file of its own scratch `--user-data-dir`, after the browser id in that file equals the one `/json/version` serves on that port and the LISTEN socket on it belongs to our Obsidian's pid or a descendant (`scripts/cdp-owned.mjs`) — no CDP command is sent to anything else, so two runs started in the same instant get distinct ports and never share an Obsidian. Scratch vault — never `:1`. Exit 2 = environment (no Xvfb/asar/binary; a pinned `DSE_LIFECYCLE_PORT` that is already in use or that our Obsidian did not get), not a code failure |
| 4b. e2e (real Obsidian, headless) | `npm run e2e` | `OBSIDIAN-E2E done: N/M ok, 0 failed, K known-bug, coverage: Y/Y pairs` (today `484/504 ok, 0 failed, 20 known-bug, coverage: 287/287 pairs`, since SC-625 (+4: MONT-X11..X14, no new pair; the 2 SC-625 markers MONT-X09 and MONT-X10 are plain tests); 478/500 since SC-439 (negotiation `NEGO-*` and `CENSUS-13..15`, 52 pairs; 13 new known-bug markers for SC-637, SC-638, SC-639, SC-640, SC-641, SC-642, SC-648, SC-649); 437/446 since SC-626 (+9: MONT-F05..F13, +2 pairs; the 4 SC-626 markers MONT-F01..F04 are plain tests); 424/437 since SC-615 (+9: INIT-F17..INIT-F25); 415/428 since SC-438 (+83 e2e tests, 80 montage `MONT-*` and `CENSUS-10..12`, +57 pairs; new known bugs SC-625 x2, SC-626 x4 (one in Live Preview), SC-627, SC-628 x2, SC-629); 342/345 since SC-569 (+2: POOL-E06, POOL-E07); 340/343 since SC-614 (+2: INIT-F15, INIT-F16); 338/341 since SC-613 (+4: COND-N12..N15); 334/337 since SC-586 (+3: COND-H01..H03); 331/334 since SC-585; known bugs SC-257, SC-355, SC-384, and since SC-438 SC-627, SC-628 x2, SC-629 (SC-625 and SC-626 fixed), and since SC-439 SC-637, SC-638, SC-639, SC-640, SC-641, SC-642, SC-648, SC-649; the runner reads test titles for scenario ids, so a bracketed ticket id in a title is taken for one, SC-577; scenario ids are global: a duplicate id such as `[CENSUS-nn]` across two branches makes the runner exit 2 at start, SC-436), exit 0 (~36 s on 4 shards at 128 tests on a quiet host; about 3.5 min for 160 tests at loadavg 17-50, SC-435). Builds `main.js` itself, so it runs after lifecycle and jest; own Xvfb `:200–:239` — never `:1`, started through `scripts/xvfb-owned.mjs` (SC-546): the display is used only after OUR Xvfb reports it is listening (`-displayfd`), so two e2e runs started in the same instant never share a display; a lost race moves on to the next number. Probing the race needs no exclusive range: use a temporary, uncommitted private range (`:5300–:5339`) and a wall-clock barrier before `startXvfb`. Exit 1 = a test failed OR the coverage gate failed; exit 2 = usage/environment |
| 5. Visual shots | `npm run shots` | regenerates `visual-harness/shots/`. Under machine load the run can pass the 600 s tool timeout (SC-481 was killed twice at ~598 s, 2026-11-02): then start it with output to a unique log plus an rc file and poll that log/rc file — never wait on a background-completion notice (adapter footgun 13) |
| 6. Freeze check | `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <repo>/draw-steel-elements/visual-harness/shots` | all producible shots byte-identical, **0 FAILED** checksums — see "Current expected numbers" below for today's baseline size vs. how many of its lines a given branch can produce |
| 7. Parity (LAST) | `npm run parity` | `0 GAPs`, `0 undeclared WARNs`, exactly the documented declared-deferral set, exit 0 |
| 8. Obsidian shots (only if a display is available) | `npm run obsidian-shots` | regenerates ground-truth PNGs from a real spawned Obsidian |

Run parity last: it rebuilds the harness bundle itself (`harness:build` is a
`predependency` step inside `npm run parity`), so running it after the freeze check keeps
freeze's PNG comparison isolated from parity's own rebuild. `obsidian-shots` needs a real
display (`DISPLAY=:1` by default) and the system Obsidian binary — skip it in headless
environments, don't fake it.

**Lifecycle gate (SC-343 + SC-340, spec SC-340 §10.2).** `visual-harness/obsidian-lifecycle.mjs`
drives a real Obsidian through the block write lifecycle jest cannot reproduce (section re-draw and
unload, and — since SC-340 — view ADOPTION across that re-draw). One `OBSIDIAN-LIFECYCLE <id> ok (…)`
line per scenario; a failure prints `… FAIL: <assertion> [shot <path>]` and exits 1. `--only=<id,…>`
reruns a subset (an id it doesn't recognize — even mixed with valid ones — is a usage error, exit 2,
never a silent skip). SC-343's 6 scenarios: `G-S7a`/`G-S7b` (identical twins, section and durable
path), `G-S6a` (navigate-away flush, SC-336), `G-S6b` (leaf close), `G-S6u` (unterminated fence at
EOF, located again by body on the durable path), `G-S5n` (dropped-write Notice + rate limit). SC-340
adds 13 more: `G-S1` (ConditionsModal open across 5 live writes + the minion pool modal), `G-S2`
(stamina modal survives the selection write at 150/380 ms), `G-S3` (fast typing into a plain input,
and a half-typed EDITABLE stepper draft, both survive the adoption blur — committed only by a later
real blur), `G-S4` (pane+embed / two panes: writer-only adoption, a leaked copy never claimed), `G-S5`
(external edit / revert always rebuilds fresh, never adopts), `G-S6c` (Reading↔Live Preview/Source
with a pending write — same-leaf round trip, Live Preview then raw Source, methodology note in
the scenario), `G-S6d`
(`previewMode.rerender`), `G-S6e` (plugin disable/enable), `G-S6f` (embed leaf detach), `G-S6g`
(hover popovers ARE writable in Obsidian 1.14.2 — measured, supersedes the original read-only
assumption), `G-S6h` (a nested read-only `ds-counter` survives its parent's adoption), `G-S6i` (fast
navigation across several notes leaves no leak), `G-S8` (SC-198 scroll pin, two phases since SC-459: adoption on — scrollTop holds; adoption off — the tracker is redrawn, `data-dse-scroll-pin` is on the scroller when the sizer collapses, scrollTop held; FAILs with the pin's style rule never inserted), `G-S13` (SC-326 montage board keeps its sideways scroll across a write), `G-S15` (SC-470 every Reading view of the note — another pane, a popout, an outside write such as Sync — keeps its scroll position on a tracker write), `G-S42` (SC-479: a Reading-view HOST note keeps its scroll position and its on-screen text when a tracker in a note it embeds is written. Fixtures: `Lifecycle/embhost.md` (`C-TOP`, `![[embtracker]]`, `C-BOTTOM`; `embtracker.md` = the 25-hero tracker), `embhosttall.md` (30 paragraphs, the embed, 150 paragraphs), `embhostinside.md` + `embtrackerlong.md` (20-hero tracker + 25 paragraphs, 3602 px, in a host of 30 + 80 paragraphs). Phases (a) in-app `vault.process` of B, (b) a write on disk via the watcher, (c) the embed's own click with view adoption OFF, (d) a second Reading pane showing B makes the click, all with the host parked at its END (stock: scrollTop 2887 -> 0), (e) the tall host parked just BELOW the embed and a hero added (the embed grows 3190 -> 3299): the first visible paragraph's on-screen top must not move (stock Chrome does not compensate there: +110 px; the pin plus the embed stop gives 0), and (f) the reader parked INSIDE the tall embed 150 px below its tracker and a hero added (3602 -> 3712): the first visible embed paragraph, tracked by text, must not move (stock compensates; an embed stop that excludes the whole embed moved it 110 px). Per phase: write landed; tracker drawn; anti-vacuity (tagged root replaced, parking geometry as stated, embed grew); `data-dse-scroll-pin` on the host when the root left the document; scrollTop ((a)-(d)) or text top ((e), (f)) identical every frame until the pin is released + 10 frames; pin released. Every phase runs even after one fails. The pin = sizer floor + `overflow-anchor: none` on the host's `.internal-embed` elements, decided at pin time by where the reader is (a DSE root on screen, or no DSE-bearing embed on screen; not when the viewport meets a DSE-bearing embed off its roots). Controls (temporary bundle variants via `DSE_LIFECYCLE_BUNDLE`): **"host pins without the anchoring rule"** FAILs (a)-(e) ((a)-(d) 2887/3574 -> 0 with the pin present, (e) +110 px); **"host pin disabled"** FAILs every phase (no pin at the redraw); **"anchoring stop on the scroller"** (`.markdown-preview-view[...] { overflow-anchor: none }`) holds (a)-(d), (f) and FAILs (e) only (36 -> 146); **"embed stop with no geometry gate"** (the gate always says yes) holds (a)-(e) and FAILs (f) only (26 -> 136). Base bundle FAILs every phase.), `G-S14` (SC-457: a fence written with whitespace before the language, ```` ``` ds-counter ````, still saves after the note changed around it — skip leading spaces/tabs, the name ends at the first whitespace of any kind). `G-S18` (SC-478: Live Preview scroll hold — `Lifecycle/tall.md`, a Live Preview pane parked 1500 px into the tracker. Phases: (a) another pane's DSE write, (b1) in-app `vault.process`, (b2) a write on disk via the file watcher, (c) the pane's own write, (d) a second pane whose `setViewData` is held back while a real wheel -400 lands on it, released afterwards (the pane must end where the wheel left it: 2620, line 63+1100), (e) one outside write that inserts a paragraph at the fence AND changes the tracker (top line 2 lines down, offset up to 60 px higher; CodeMirror maps its own snapshot anchor before the insertion). Per phase: write landed; anti-vacuity (the parked tracker root left the document); scrollTop identical in every frame and the expected top line + offset; tracker drawn again at its old height; `data-dse-lp-hold` seen (mutation records) and released; selection unmoved. Controls, built as temporary bundle variants run with `DSE_LIFECYCLE_BUNDLE`: **"restore never dispatched"** (`view.dispatch({ effects: restore })` -> no-op) and "no hold" (`applyHolds` returns at once) FAIL every phase; **"scroll refresh disabled"** (`refresh` returns at once) FAILs phase (d) only; **"old equality match"** (the `iterChanges` widening removed) FAILs phase (e) only. Base bundle FAILs (3020 -> 2556, line 63 -> 160/285; (e) 3020 -> 5592.) **Lifecycle-scenario authoring rule (SC-478 r4):** never put a timed delay inside a lifecycle step to win a race against Obsidian (an 800 ms timer was measured to lose it under load); hold back Obsidian's redraw at a hook instead (e.g. wait for `setViewData`, act, then release), as G-S18 phase (d) does. **Live Preview probe rule (SC-543, 2026-11-02):** never count `.cm-embed-block` (or DSE roots) in the editor DOM to decide how many blocks Live Preview drew. CodeMirror 6 keeps only blocks near the visible area in the DOM (the viewport plus roughly 500 px above and below), so in a note with two ~1500 px cards a count at the top or the bottom reads 1 while both are drawn (SC-536 r3 INFO-4 misread this as a missing card; filed as SC-543, not a bug). Scroll each block into view and check its own widget there, or read the editor's decorations. Mandatory — unlike `obsidian-shots` it needs no real display. No port setup is needed (SC-551): the
default is an OS-assigned CDP port read back from your own Obsidian, so concurrent lifecycle runs on one
machine do not collide; the start line prints it (`port <n>`). `DSE_LIFECYCLE_PORT=<n>` still pins a port:
it must be free (any listener counts) and your Obsidian must report exactly it, otherwise the run exits 2
naming the port ("… another instance owns it"; a lost bind race takes up to 30 s to be reported) and
evaluates nothing in the other instance; pin ports below 32768 (outside the ephemeral range). The proof also
requires the LISTEN socket on the reported port to belong to the spawned Obsidian's pid or a descendant
(`/proc/net/tcp{,6}` inode found under `/proc/<pid>/fd`), and the helper deletes a stale `DevToolsActivePort`
before each proven spawn (`clearStaleReport`); lifecycle's scratch user-data-dir is always fresh and private.
`DSE_LIFECYCLE_BIN` / `DSE_CAMERA_BIN` may be a launcher wrapper that does not `exec` (a script, `flatpak run`):
a socket held by any descendant of the spawned pid is accepted, one held outside that tree is rejected, and a
`foreign-listener` failure names the holding pid and command. Before SC-551 a run that lost the bind race
attached to the OTHER run's Obsidian and ran its scenarios inside it (reproduced 11 of 11 pairs on base).
Mixed-fleet caveat: a worktree still on the pre-SC-551 runner can attach to a new run's Obsidian when both
pin the same port, so rebase before running lifecycle concurrently on a shared pinned port.

**Lifecycle authoring footguns (SC-540, 2026-11-02, measured):** a scenario that needs "its own leaf" must add its own tab (`getMostRecentLeaf()`, possibly an empty tab when run alone) to its keep set, or its cleanup of "leaves added since start" detaches it after the first phase. A control whose click handler rebuilds the card detaches the click target; any Obsidian handler that defers (`Ah`: 10 ms, 150 ms over text) and then walks up from the target meets `null`, not the root — mark the detached subtree, never stop or cancel the click. A scratch copy of the lifecycle harness must live in a directory that has a sibling `scripts/` (it imports `../scripts/xvfb-owned.mjs` since SC-546); symlink the worktree's `scripts/`. A fresh worktree has no `node_modules`: `npm ci` through devbox first. **(SC-544)** A Live Preview probe must find the card to click BY BLOCK, never by position in the list of drawn cards: a callout whose cursor is inside is raw source, so the list shifts and index 2 becomes block 3 (the first version of the SC-544 probe wrote [5,6,5,6] on the FIXED bundle for this reason). Obsidian's "Update Available" Notice sits over the right sidebar's panel (hit test: a `P` inside `.notice-message`): a scenario that clicks in the sidebar must hide `.notice-container` first, or the click lands on the Notice. **(SC-472)** `jest.useFakeTimers()` fakes `requestAnimationFrame` too (16 ms of faked time per frame), so tests that count painted frames use `test/dom/framework/_frames.ts` (a hand-driven queue whose `requestAnimationFrame` is locked against the fake-timer install). **(SC-545)** A scenario that turns the plugin off must turn it on again in `finally` (`if (!app.plugins.plugins[id]) await app.plugins.enablePlugin(id)`), or every later scenario in the part runs against no plugin. After `enablePlugin` wait (a poll) for `app.plugins.plugins[id].viewRegistry`, then for the thing you assert; a card's owner is `plugin.viewRegistry.liveEntries().some((e) => e.root === root)`, and a root tagged with an expando before the off/on is the way to prove it was redrawn rather than kept. Count the fallback by wrapping `setViewData` on the markdown view class (walk the prototype chain of a loaded markdown view to the object that owns it) and counting only `clear === true` calls: Obsidian makes those while it opens a note, so open the note before the window you count in. Obsidian's `post-processor-change` rebuilds Live Preview code-block widgets but NOT callout or embed widgets, so a probe of "is the card live" must look at those widgets specifically; and on some toggles an embed's card was replaced by the raw fence while the plugin was off (seen at r4, not at r5's 18 toggles; trigger unknown; the embed's renderer does not listen to `post-processor-change`) with nothing redrawn after enable, so a check on an embed must sample the off state before deciding whether a rebuild is allowed. CodeMirror takes a widget out of the document about a screen past it: scroll to the note's end and poll `!root.isConnected` instead of assuming a distance.

**e2e gate (SC-408; `draw-steel-elements/e2e/`, full guide `e2e/README.md`).** Functional tests of the
shipped UI in a real Obsidian, with real pointer/key input, asserting the NOTE FILE and the DOM (WebdriverIO +
`wdio-obsidian-service` behind a DSE-owned driver). Pilot surfaces: the StaminaEditModal, ds-stamina-bar
(Recoveries strip, Catch Breath, popover, undo toast) and initiative's stamina entry points. **`npm run e2e` is REQUIRED to land ANY `draw-steel-elements` change, not only
changes to the pilot surfaces' interactive code** (Scott, SC-408, 2026-10-18: "make it required to land
future changes"). A landing without a green full run (0 failed, coverage Y/Y) is not a landing.
`--element=<dir>` / `--only=<ID,…>` are for iteration only.
- **Never `--headed` on `:1` from an agent.** Agent shells export `DISPLAY=:1`, which is the person's REAL
  screen, and wdio's own `autoXvfb` only helps when `DISPLAY` is unset. `run.mjs` therefore always starts a
  private Xvfb (`:200–:239`) and passes `DISPLAY` explicitly; `--headed` opts onto a real display
  (`DSE_E2E_HEADED_DISPLAY`, default `:1`) — prove the headed path against your own throwaway Xvfb instead.
- **Xvfb ownership (SC-546).** e2e, lifecycle and docs-shots all start Xvfb through `scripts/xvfb-owned.mjs`
  and use a display only after their own Xvfb has written its number back (`-displayfd`). `Xvfb -displayfd`
  skips the `/tmp/.X<n>-lock` file (measured, Xvfb 21.1.24): do not use the lock file as an ownership proof; and a
  race loser started WITHOUT `-displayfd` can stay alive for at least ~1 s holding no socket (7 of 12 simultaneous
  cross-process pairs; depends on lock-file timing), so an exit-code check alone does not catch it. Mixed-fleet
  caveat: this holds once every worktree is on SC-546 or later. Until then, an un-rebased lifecycle or docs-shots
  run started in the same instant can still land on a new run's display, so rebase before running lifecycle
  concurrently.
- **One shared private display; the runner parks the X pointer (SC-539).** All shards' Obsidian windows live on
  the one private Xvfb (no window manager; each window opens at 1024x800+288+200, then the driver resizes it to
  1440x1100+288+200; both rectangles contain the screen centre). Xvfb starts its pointer at the screen centre,
  inside every window, and a window another shard maps or unmaps there sends our window a real Leave/Enter that
  drops the synthetic CDP hover (CHR-F02, CHR-F03, CHR-L01, INIT-DEF-E04 then time out waiting for the
  hover-revealed chrome panel; SC-534 confirmed it for CHR-L01 (SC-529 is its duplicate): with the park, 20/20 under a foreign window flipping every 150 ms and 10/10 with the renderer CPU slowed x20; with the park off, 0/5, and the old re-hover loop did not rescue a single run). `e2e/run.mjs` therefore parks the X pointer
  at 0,0 after Xvfb starts, with a dependency-free X11 client (`e2e/x11-pointer.mjs`: WarpPointer to the root at
  0,0, read back with QueryPointer). The park holds a connection open for the whole run: Xvfb resets and
  recentres the pointer when its last client disconnects, so a one-shot warp from a short-lived client (xdotool,
  say) is lost at once, and lost again whenever every Obsidian has exited between spec files. The Xvfb is also
  started with `-noreset` as a backstop. Expect the line
  `OBSIDIAN-E2E pointer parked at 0,0 on :200 (outside every window)` right before `start:`. If you see
  `OBSIDIAN-E2E WARN pointer NOT parked: <reason> — hover tests may flake (SC-539)` (printed at the start and
  again after the `done` line), the run continues, exit code unaffected: treat a hover-timeout red in that run as
  possibly this flake and re-run before believing it. No new tool is needed (no xdotool). Never done with
  `--headed`. If the window size or position in `driver/session.ts` ever changes, the pointer must stay outside
  the new rectangle. Spec rule (SC-534): do not rescue a hover-revealed control with a re-hover loop, a settle wait or a forced CDP click (`ClickOptions.cdp` was removed). One `dse.hover` must reveal it, and the driver's default click must hit-test it; a lost hover in an e2e run means the park failed (look for the WARN line), not timing.
- In agent shells `grep` is ugrep with `-I` (skip binary files) and reads `e2e/run.mjs` as binary, so a plain
  `grep` on it silently prints nothing. Use `command grep -a`.
- **Cache:** `${XDG_CACHE_HOME:-~/.cache}/dse-e2e-obsidian` (override `OBSIDIAN_CACHE`), shared across worktrees,
  ~1 GB per version set (pinned = app 1.14.4 + installer 1.14.4; `--obsidian=installed` = `/usr/bin/obsidian`).
  The first run of a new version downloads; copy the dir (`cp -a`) rather than re-downloading.
- **Coverage gate.** A FULL run (no `--only`/`--element`) exits 1 if any manifest (control, kind) pair in
  `e2e/manifest/*.ts` was driven by zero tests (it lists them) or a driven pair is in no manifest. A new control on
  a pilot surface needs a `data-dse-control` id (kit `control` option) AND a manifest row AND a scenario; the jsdom
  census (`test/dom/e2eCensus.test.ts`) and the real-Obsidian census (`e2e/specs/_census.e2e.ts`) fail first.
- **Known-bug rule.** A reproduced product bug is NOT fixed in the e2e change: encode the correct behaviour in
  `knownBug('SC-nnn', '[ID] …', fn)` (e2e) or `test.failing` (jest). It passes while the bug exists and FAILS
  once fixed ("known bug SC-nnn appears fixed — remove the marker") — delete the marker with the fix. Behaviour a ticket
  has ruled will CHANGE (but not yet designed) is pinned as a plain test with the title suffix
  `[current behaviour — SC-nnn will …]` (e.g. `SC-432 will relabel + confirm`); the fixer rewrites it. The older
  `[… ruling pending …]` wording is retired.
- No retries, ever: a flake is a bug in the test or the product. Read the failure bundle in
  `e2e/.out/<run>/<test-id>/` (screenshot, DOM, note diff, page events); copy it out before the 12-run retention
  prunes it.

### Devbox wrapping (every command above)

`devbox run --` executes from the devbox project root and **ignores your shell's `cd`**.
Always wrap with `bash -c` using an **absolute** path:

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/<name>/draw-steel-elements && npm run tsc'
```

`$PIPESTATUS` and `${var:-x}`-style substitutions **break under devbox's sh wrapper** — don't
rely on them to recover a command's exit code.

### Stale `main.js` shadows `main.ts` for jest (2026-08-18, FOLLOWUPS #77)

A built `main.js` at the plugin root silently replaces `main.ts` for any test that reaches
`visual-harness/entry.ts` (it imports `'../main'` relatively — the `'^main$'` mapper misses
it; jest prefers `.js`). **`cssNesting.test.ts` WRITES `main.js`, so each jest run plants the
artifact for the next.** Symptom: dozens of failures shaped `X is not a function` from a
bundle older than the source you're testing (67 on SC-169's fix round). **Protocol until
#77 lands: `rm -f main.js styles.css` in the plugin root before `npx jest`**, and if a jest
red mentions a method you just added, suspect this first.

### Jest timeouts under load (SC-568, 2026-11-13)

`jest.config.ts` sets `testTimeout: 30000` (top level: it is a GLOBAL jest option, jest-circus reads it from
`globalConfig`; inside a `projects` entry it is ignored), so it covers both the `unit` and the `dom` project. It is a
hang detector, not a perf gate. Before SC-568 the 5 s default failed ordinary async tests on a loaded host (load 12-57)
that take 1-3 s alone (`twin-reuse`, `initiative-default-keys`, `settings-tab`, `settings-preview`, first test of
`sidebarInitiative`, `initiative-sc417-minion-squad`, `formModalStalePreview`, `fixtures`). A synchronous test never times
out however slow it is; only a test that awaits macrotasks does. Headroom: about 6x over the time a test takes alone,
about 2x over the slowest async test under the 1-core repro (`twin-reuse` ~16 s).

- An "Exceeded timeout of 30000 ms" is now a real hang until proven otherwise: re-run the suite alone first, do not
  blame load.
- Hand-written `waitUntil` caps in tests follow the same rule: keep them below 30 s (25 s in `sidebarInitiative`,
  `formSaveRedraw`, `sidebarEncounterHandoff`) so the descriptive message wins, never 5 s.
- Tests whose verdict depends on elapsed time must not read the wall clock. Use `jest.useFakeTimers({ doNotFake:
  ['queueMicrotask', 'nextTick'] })` and `await jest.advanceTimersByTimeAsync(ms)` (see `chromeFocusHandoff`,
  `initiative-outside-edit`, `initiative-default-keys`). **A frozen fake clock never lets time pass on its own: advance
  realistic gaps between steps, with LITERAL numbers (never the product's constant, which shrinks with a mutant), or the
  window lengths go untested** (a window cut to 1 ms still passes a test that never advances the clock; the SC-568 r2b
  review measured it, and r3 added 2900 / 1400 ms gaps and boundary tests).
- A fixed `setTimeout(25)` as "the async read is done" loses to CHAINED work: the mock vault's `read` takes one
  `setTimeout(0)` hop each and the host chains reads, so on a starved host the 25 ms timer is already due before the second
  hop is scheduled (a single product timer, or a read started before the test's timer, is ordered correctly). Wait on the
  observable condition, bounded: `test/dom/_settleVaultReads.ts` (`settleVaultReads()`) counts `cachedRead`s in flight and
  waits until none is, two hops in a row, throwing after 1000 hops. A drain wait is only the floor: where the end state is
  observable, assert it after the wait (`reading-mode-host-pin`: the rebased pin is in the note's coordinates, `pin.text`
  equals the note), which turns a no-op wait red. The helper waits on real `setTimeout(0)` hops, so it is REAL TIMERS ONLY: under
  jest fake timers it hangs to the 30 s timeout (use `pump()` there). A fixed COUNT of hops is only a fallback: it is tied to
  how many hops a mock read takes (red at 8 per read, vacuous at 20). The same fixed-`setTimeout(25)` helper is still in
  `reading-mode-host-hover-card`, `-form-pin`, `-drawn-pin` (read-once, green under a 30 ms-per-hop burn mutant); if one of
  them ever adds a second read, switch it to `settleVaultReads()`. The mock vault's reads need the fake clock pumped
  (`pump()` in `initiative-default-keys.test.ts`), or they never resolve.
- Reproduce a load-shaped red deterministically, no loaded host needed: `taskset -c 0 npx jest -w 11` (the `-w` is
  required: with `taskset` jest sees one core and runs in band, which never reddens anything). Measured: 1-5 reds per
  full run, 2 of 2 runs at `1cc54eac` and 2 of 2 at `df92a3f6`; `taskset -c 0,1 -w 11` gave 1 red. A full run takes
  about 5-7 minutes.
- Do not add a per-test timeout below 30 s to a new test; a deliberately large one (`migrationCensus` 180 s, the
  `reading-mode-host-whole-pin-*` 600 s) is fine.

### Lifecycle and e2e notes (SC-480, 2026-11-11)

- A lifecycle assertion about a block the PLUGIN wrote cannot compare the note's text to a fixture: the plugin re-serializes the block's YAML in its own key order (`max_value` / `current_value` / `min_value` / `name`); compare the counters' values and the text outside the fences instead (G-S73's race controls).
- `RECOV-R07` used to fail with `w.count` 2 vs 1 on a slow host (SC-517, SC-570). Cause: the popover's - / + presses persist through `ElementView.persist()`'s 400 ms trailing debounce; when the Catch breath press came more than 400 ms after the last +, the stepper write (recoveries 4, Stamina 12) flushed after `waitForWrite`'s mark and was counted as one of Catch breath's two writes. The product is correct (each flush serializes the live model, `vault.process` serializes writes, the note always ends at 22 / 3). Fixed in the spec: `dse.settle()` plus `expectNoteBlock(... {current_stamina: 12, recoveries: 4})` before the Catch breath `waitForWrite`. Reproduce a debounce-straddle race deterministically by delaying the driver's page-eval replies by 250 ms (an env-gated sleep after `ev()` in `e2e/driver/page.ts`) or throttling the renderer 12x (`Emulation.setCPUThrottlingRate` via `browser.sendCommandAndGetResult` in a `beforeEach` in `e2e/driver/session.ts`); a loaded host is not needed. The SC-570 probe diff is preserved at `docs/superpowers/dse-overhaul/build-ledgers/sc570-recov-r07-double-write/sc570-r1-driver-probe.diff`. A RECOV-R07 red is now a real signal. The one-window path (Catch breath inside 400 ms: one write) and the two-window paths are pinned in jest (`test/dom/elements/staminaRecoveries.test.ts`, "SC-570").
- Authoring rule for a `waitForWrite(...)` that asserts `count`: settle every earlier edit to the same note (`dse.settle()` and assert its content) first. `waitForWrite` counts every modify of the path since its mark and cannot tell whose write it is counting.
- G-S91 (part 5, SC-616) used to flake ("title rv: 700 ms after the second press the preview was gone", 2 of 17 plain runs; "title lp: the second click came 155 ms after the opening click" under load); fixed in the harness, no product change. Cause: the title / apply / reopen trials sent a zero-length second press (down and up at once) 8-25 ms after the opening click's dispatch ended. Obsidian's click-to-edit helper arms its 10 ms timer at the end of that dispatch, and queued input is handled before a timer that is already due, so the press raced the timer and `T3` hid the preview 5 ms later: SC-598's documented residual (see "Hover preview modals"), not a new bug. With the title point cached the race went red in 16 of 20 trials. The 155 ms form was the validity gate measured from the START of the opening click, which counts the dispatch itself (20-62 ms idle, about 110 ms at 4x CPU). Now: title / apply / reopen release the second press only after an in-page 11 ms timer (DOM timers run in due order, so the helper's 10 ms timer has run first; on the base its timer is 150 ms and still pending, so the trial stays red there), the gate is `gapEnd < 140` (the second click's capture minus the END of the opening click's dispatch), and a trial whose ONLY problem is that gate is re-run from fresh state up to twice, named in the outcome line (`title lp (re-run 1x, the host was too slow to prove anything: 150 ms from the end of the opening dispatch)`). A product failure (preview or modal gone, source editor, focus) is never re-run. Measured: 0 of 33 natural runs red after the fix (implementer: 15 on earlier twins of the final commit and 4 on the final head `1cc54eac` on `3a5986d3`, 16 G-S91-alone runs and 3 full part-5 runs; independent reviewer: 13 on `33dd0a1b` (6 alone, 6 three-at-once, 1 part 5) and 1 alone on `1cc54eac`), `gapEnd` 23-107 ms (107 at load average 5.6), no retry fired without a CPU throttle, and 20 of 20 in the worst-case straddle (r1); red on the SC-598-reverted bundle in 4 of 4 runs (r1) and 2 of 2 (r2), all six trials red each time (title, apply, dblq: "preview gone"; reopen: "source editor"), no retry. At 6x CPU throttle the title trials FAIL inconclusive after their re-runs (by design); at 4x a re-run fires now and then and passes (r3). So a G-S91 FAIL is now a real signal, except an inconclusive gap that survived two re-runs (a host too slow to prove anything: free the host and re-run). The dblq trials have no gate and are unchanged.
- Running a lifecycle part (SC-594): The Bash tool moves any call that runs longer than 180 s to the background even with a 590000 ms timeout, and announces its completion by notification (nothing is lost; the log file still gets the whole output). Keep one lifecycle part per call, output to a log, and wait for the notification; while waiting, a read-only wait is `timeout 175 tail --pid=<pid> -f /dev/null` on YOUR OWN node pid. Other efforts run lifecycles at the same time: pick the pid whose `/proc/<pid>/cwd` is your worktree's `draw-steel-elements` (`pgrep -f "node visual-harness/obsidian-lifecycle.mjs"` lists all of them), never kill by name.
- Lifecycle flag syntax (SC-625): the filter is `--only=A,B,C` with an equals sign. `--only A,B,C` (a space) is silently ignored and the runner runs every scenario (about 30 min on a loaded host), so a "part 1" call ends up as the whole suite. Check the first lines of the log: a part must print only its own scenario ids.
- Montage e2e (SC-438): the montage strip / guide open state lives in the plugin session store keyed by the block, so it outlives a test; specs reset it with `closeDisclosures` (`e2e/driver/montage.ts`). jsdom `test.failing` markers for montage bugs: SC-631 (SC-625's `[K01]`/`[K02]` and SC-626's `[K03]` are plain tests; `test/dom/elements/montage-matrix.test.ts`). A montage write keeps the keys the montage does not read (SC-625): `model.ts` carries them as own properties of the model and of each entry, so never put a non-schema own property on either (`serialize` would write it into the note).

### THE exit-code footgun

A pipe or a trailing command can silently turn a real failure into an apparent success:

- `cmd 2>&1 | tail -20` reports **tail's** exit status (0), not `cmd`'s — and since
  `$PIPESTATUS` doesn't survive the devbox sh wrapper, you can't recover the real code that
  way either.
- `cmd; echo done` has the same effect: `echo`'s exit status (0) becomes the new `$?`.
- `devbox run -- bash -c "cmd; echo X=\$?"` (DOUBLE quotes) reported `X=0` for a jest run
  with 6 real failures (SC-165 review, 2026-08-16) — the escaped `\$?` is expanded by the
  outer shell/devbox wrapper before bash ever sees it.
- **SINGLE quotes do not save you either (SC-423 review, 2026-10-18).**
  `devbox run -- bash -c 'cmd; echo EXIT=$?'` printed `EXIT=0` for a jest run with 3 real
  failures, and `devbox run -- bash -c 'false; echo EXIT=$?'` prints `EXIT=0` too — the
  wrapper expands `$?` before bash runs the string regardless of quoting. Never trust an
  echoed `$?` inside a `bash -c` string, in any quoting. Either (a) make the gate the LAST
  command and read `devbox run`'s own exit status, (b) read the tool's own textual summary
  (jest's "Tests:" line, `freeze OK`, parity's counts) as the truth, or (c) run the gate
  through a **script file** that captures the code itself — `rc=$?` inside a file run as
  `devbox run -- bash /abs/path/gate.sh` reported the real `1`.

**Rule: whichever command's pass/fail you actually need, make it the LAST thing evaluated in
the `bash -c '...'` string** — no `| tail`, no `; echo`, nothing chained after it:

```bash
# WRONG — jest's real exit code is masked by tail's success
devbox run -- bash -c 'cd /abs/path/draw-steel-elements && npx jest 2>&1 | tail -3'

# RIGHT — jest is last, nothing after it
devbox run -- bash -c 'cd /abs/path/draw-steel-elements && npx jest'
```

If you also want trimmed output for readability, redirect to a log file and `tail` the file
in a **separate** command after you've already checked the exit code — don't pipe the
gate command itself.

## In-run gates inside `npm run shots` (SC-205, 2026-08-28)

`npm run shots` carries two loud in-run gates beyond the captures themselves. Both print an
OK line on success; read the lines, don't infer from exit code alone.

- **Host-copy pin** (`visual-harness/obsidian-host-pin.mjs` + `shoot.mjs`): verifies the
  harness's Obsidian button model (`OBSIDIAN_HOST_BUTTON_CSS` in `shoot.mjs`) AND the
  human-facing listing in `styles-source.css`'s host-rules comment against the newest
  installed Obsidian asar (`~/.config/obsidian/obsidian-*.asar`; the `/opt` installer copy
  is years stale and deliberately never used as a comparison source). Expected line:
  `host-copy pin OK (6 button-reaching rules + 14 tokens × dark/light + the
  styles-source.css listing … 18 further rules … excluded by documented ancestor scope, 0
  unclassifiable …)` (Obsidian 1.15.0; 1.14.4 read 20, older 21). On a machine with no asar at/above the pinned
  version (currently **1.15.0, SC-497**; a machine whose newest asar is 1.14.x): **`host-copy pin PARTIAL` — expected, not a failure**; the in-repo
  sheet-vs-model fence check still runs unconditionally, and the pin never compares
  against an asar older than the pinned version. Real failures print
  `HOST COPY DRIFTED` / `IN-REPO HOST-MODEL CHECK FAILED` with a drift-kind-specific
  remedy — follow the printed remedy (an Obsidian self-update means re-extract and update
  `PINNED_OBSIDIAN` + both copies; a sheet-listing drift means fix the comment/model, NOT
  re-extract). Deferred parser-hardening edge cases: SC-276. 1.15.0 ships a minified app.css
  (`@media(hover:hover)`, unquoted attribute values, `.7` for `0.7`); the copy is verbatim, so it keeps that
  spelling; the comparator is not whitespace-insensitive (SC-276).
- **Which Obsidian each gate uses (documented split, SC-497, 2026-10-23):** gates do not share one Obsidian
  version. Shots' host-copy model is checked against the newest installed asar (floor `PINNED_OBSIDIAN`,
  1.15.0). Shots' host-leak sweeps inject the real app.css pinned by content in `obsidian-app-css.pin.mjs`
  (1.13.7; bumping it needs its own sanctioned rebaseline, SC-376 — the `OBSIDIAN APP.CSS PIN DRIFT` warning
  is expected and leaves rc 0). `npm run obsidian-lifecycle` runs the newest installed Obsidian (1.15.0 since
  2026-10-22, 1.15.1 by 2026-11-10, SC-435). `npm run e2e` runs its own pinned 1.14.4 (`e2e/README.md`). An Obsidian self-update therefore
  moves shots' host-copy check and lifecycle, but not e2e or the app.css sweeps.
- **Button host-leak sweep** (`assertBtnHostLeak` in `shoot.mjs`): computed-style
  invariance of every gallery button kind with vs. without the injected host copy, now at
  **3 states (rest / hover / focus-visible) × dark/light**. Expected line as of SC-205:
  `button host-leak OK (111 button kinds × 3 states … = 666 comparisons …)`; **re-measured
  2026-09-24 (SC-338): 114 kinds / 684 comparisons — pre-existing drift from unrelated
  landings since SC-205, not caused by SC-338 (SC-338 never touches the gallery/harness DOM
  composition; the modal chips never mount there — the in-note negotiation chips
  `.dse-nt__chip` DO wear `.dse-optchip` and are in the gallery — see the SC-338 note
  below)**; **112 kinds / 672 comparisons as of 2026-10-20 (SC-364 owner re-measure; see
  CURRENT)**; **113 kinds / 678 comparisons with a 12-record boundary as of SC-501 (`054c9c5`)**:
  10× focus-visible `disabled` (montage, negotiation, party stepper, roll stepper and roll Reset
  disabled kinds, ×2 schemes) and 2× hover no hit point (`initiative|dse-btn.dse-init__stamina`,
  ×2). **114 kinds / 684 comparisons, same 12-record boundary, as of SC-512 (`f89f69f`)** — the 113 measured at `c2758a2` plus one kind; it only coincides with the stale SC-338 figure above. The new kind is the ENABLED roll Reset, `roll|dse-btn.dse-btn--ghost.dse-rollbar__reset` (the disabled kind is still compared). Reset is disabled while a strip sits at its authored values (`rollBar.ts:263`), so the button sweep's URL alone adds `galleryExtra=roll`: `entry.ts` appends a second roll strip (`data-dse-harness-extra="roll"`), and the sweep real-clicks its Edges "+" on every dark/light load after opening Modifiers. It FAILs if that strip does not end with exactly one enabled, boxed Reset, if the first strip's Reset is not still disabled, or if the enabled key was not tagged. No capture sends `galleryExtra`, so no shot or frozen byte moves. **145 kinds / 870 comparisons with a 28-record boundary as of SC-513 (`ed368f6`)**: the boundary is the 12 above plus 16 `focus-visible: disabled` records on the Reset and stepper of the click-mounted roll strips (feature, featureblock, statblock, hero; ×2 schemes) — disabled at authored values (`rollBar.ts:263`), so legitimate. SC-513 makes the sweeps CREATE controls that only exist after a click, by real Playwright clicks in the sweep's own dark/light loads, before tagging: (A) the ds-roll result card (Reroll / Clear), by clicking Roll on SC-512's extra roll strip; (B) the ability roll strip + result card in feature, featureblock and statblock — the button, input and checkbox sweep URLs add the pref `rollingEnabled:true` and `galleryExtra` sections `feature,featureblock,statblock`, and the sweep clicks the `.dse-roll-btn` in those appended sections only (clicking the gallery's own statblock moves `statblock|dse-collapse__header`'s first node); (C) hero ability bodies, via a gate-only probe hero with inline abilities (`galleryExtra` `hero:probe-inline-abilities`, a `probeSource` — not in FIXTURES, so no shot), whose expand toggles and then a body's Roll are clicked. Each mount FAILs by name if it produces nothing ("no ability Roll button …", "the probe hero … has no ability expand toggle", "the sweep tagged no `<key>` button …"). The prose sweep's gallery visit also expands the probe hero's bodies (prose line `106 bare <p> [212] + 9 <img> [18]`, was 99 [198]). Input **15 kinds / 176** (was 14 / 164), checkbox **7 kinds / 116** (was 3 / 60), modal 228 unchanged. No capture sends these prefs or sections, so no shot or frozen byte moves. The Recoveries popover is mounted since **SC-526** (see below); it was the one click-revealed control SC-513 left out, because its plain buttons leaked host CSS. **157 kinds / 942 comparisons with a 34-record boundary as of SC-527 (`4f73043`)**: the boundary is the 28 above plus 6 `focus-visible: disabled` records (`hero|dse-btn|disabled` — Catch Breath after Respite; `montage|dse-btn.dse-btn--accent|disabled` — Log an action once every hero has acted; `montage|dse-btn.dse-btn--icon.dse-mt__board-rowact|disabled` — row actions once the montage is complete; ×2 schemes), all legitimate. SC-527 makes the button sweep reach control STATES that exist only after a click, by real Playwright clicks in six appended default-fixture sections (`SC527_EXTRA` = `initiative,negotiation,negotiation,montage,montage,hero`, appended after every SC-512/SC-513 extra and addressed by `data-dse-harness-index`), in `reachStateKindsForSweep`, which runs before `mountClickRevealedForSweep`. The 12 new kinds: initiative pressed turn / portrait-toggle / action-toggle / cell (`aria-pressed:true`); negotiation chip pressed, spent (`is-spent|aria-pressed:false`), spent-and-pressed, and Complete Argument enabled (`negotiation|dse-btn.dse-btn--accent`, after picking a tier); montage Log disabled, Clear all (`montage|dse-btn.dse-btn--danger`) and row actions disabled (End round ×2); hero Catch Breath disabled (Respite). Each section FAILs by name if a click target is missing (`SC-527 <what> — could not click …`) or the state is not reached (`… the state was not reached: nothing in the extra <id> section matches …`), and after tagging for every expected key not tagged. Button sweep only: no non-modal state change creates an input or checkbox kind (measured). The SC-450 / SC-423 / SC-377 parity gates do not cover these: they compare toggled with rendered both with the host sheet in, so they prove repaint parity, not host invariance. `hero|…stepper__btn|disabled` was already compared since SC-513 (its first node is the probe hero's ability-body "Decrease Edges"), so the Surges "−" after Respite shares that key and is not the compared node. No capture sends these sections, so no shot or frozen byte moves (592 PNGs identical). **161 kinds / 966 comparisons, same 34-record boundary, as of SC-530 (`97284051`)**: `tagButtons` appends `|checked` when `aria-checked="true"` (only then — no rule anywhere targets `"false"`/`"mixed"`, so idle radios keep their old key and nothing is renamed), and `|in:track--vertical` (last in the key) for a seal inside `.dse-track--vertical`, whose own-box CSS differs from the horizontal seals' (padding, width, border, colour; the current seal's background and inset ring). Four new kinds, `SC530_EXPECT`: `negotiation|dse-pr__row|checked` (the tier row SC-527's first negotiation section already clicks — no new click or section), `negotiation|dse-track__slot|checked` (the gallery's Patience 3 seal, checked at load), and the vertical idle and checked seals (`negotiation|dse-track__slot|in:track--vertical`, `…|checked|in:track--vertical`). `assertSc530Tagged` (called once, right after `assertSc527Tagged`) FAILs by name for any expected key not tagged (`the sweep tagged no <key> button …`). Only negotiation's radios carry `aria-checked` (48 per scheme); the modal pass has none, and the input and checkbox sweeps have no such blind spot (inputs carry no `aria-checked`; the checkbox sweep drives `checked` / `indeterminate` as states). No capture changes, so no shot or frozen byte moves (592 PNGs identical). **163 kinds / 978 comparisons, same 34-record boundary, as of SC-526 (`6270e84a`)**: the button sweep's prefs add `staminaRecoveryPopover:true`, and `mountClickRevealedForSweep` (`{ recoveriesPopover: true }`, button sweep only — the popover has no inputs or checkboxes) ends with a real click on the gallery hero's `.dse-stamina-rec__pips`. It must be the LAST click: any later click outside the popover closes it (the state passes never click — hover is `mouse.move`, focus is Tab + `focus()`). Two new kinds, `hero|dse-stamina-rec__pop-btn` (− and +) and `hero|dse-stamina-rec__pop-cb` (Catch breath). It FAILs by name if no popover with three visible buttons opens (`clicking the hero Recoveries markers (staminaRecoveryPopover on) opened no popover holding its three visible buttons (SC-526)`), and `assertSc526Tagged` FAILs for either key not tagged. Before SC-526's CSS fix the mount measured `BUTTON HOST-LEAK VIOLATED`, 164 problems (height 18 → 30px, Obsidian's plate shadow, colour, font, `display:flex`); the fix re-grounds both classes in the SC-203 family at their own compact height (Scott, 2026-11-05: "A looks better than A30" — − and + ~18px, Catch breath ~26px, also on phones). The `ds-stamina-bar` popover is the same component and classes and is not mounted separately (measured green in SC-526 r1); StaminaEditModal has no Recoveries strip. No capture sends the pref, so no shot or frozen byte moves (592 PNGs identical). The sweeps pin dice after load (`Math.random = () => 0.5`, the same one-liner `fixedDice` captures use) so the mounted result cards are byte-stable in the sweep logs; no kind count depends on the roll (145 with and without the pin). Since SC-501 the printed boundary lists the kind keys under each reason (modal keys carry their scenario, e.g. `@StaminaEditModal`), so compare kinds,
  not just counts. **SC-279's roll strip starts its "Modifiers" disclosure collapsed
  (`rollBar.ts:112`)**, which hid its steppers and Reset (0×0) and grew the boundary to 20 records
  (6 hover zero-sized + 2 focus-visible no box were hidden buttons, not legitimate skips; SC-497
  first measured it on `d152ea4`). SC-501 makes the button, input and checkbox sweeps open that
  disclosure with a real click on every dark/light load and FAIL if any roll panel stays hidden; the input and checkbox sweeps also FAIL on any tagged node with no box (they used to compare it at 0×0 and print OK).
  A new collapsed-by-default disclosure in the gallery will show up the same way — as "zero-sized"
  / "no box" records naming its kinds — and wants the same treatment, never a wider boundary.
  Earlier: a printed **10-record** exemption boundary (8 focus-visible
  disabled, 2 hover no-hit-point — measured 2026-10-21, SC-356; the older "12-record"
  figure with 2 `visibility: hidden` records was stale). Kind counts drift
  as fixtures/chrome grow — treat them as "expect right now", and treat any per-record
  `matches(':focus-visible')` failure or a new unexplained exemption as a real red, not
  noise.
  **Modal pass (SC-356, `assertModalBtnHostLeak`, runs right after the gallery line):** the
  gallery never mounts a modal, so buttons that exist only inside one (the modal
  `.dse-optchip` chips, `.dse-swatch`, the icon choices) were invisible to the sweep. The pass
  opens 10 scenarios over 9 `Modal` classes (ConditionsModal with the editor open and a swatch
  pressed, LogActionModal new + edit, MontageAddHeroModal, MontageSetLimitsModal,
  StaminaEditModal, FreeHealConfirmModal (SC-432: swept as the topmost dialog, opened over the
  Stamina modal), MinionStaminaPoolModal, ResetEncounterModal, FormModal), tags every button
  under `.dse-modal` and runs the same with-vs-without-host comparison at the same 3 states ×
  dark/light by the same helpers. Expected as of SC-356: `modal button host-leak OK (10 modal
  scenarios over 9 modal classes, 38 button kinds × 3 states … = 228 comparisons …)` — **39 button kinds / 234 comparisons as of
  SC-572 (`a339e7b3`)**: one goblin in the shots fixture now carries a condition, so the minion pool modal's
  "Remove <condition>" button is swept — with
  **no** `ALLOWLISTED` line since SC-361 landed (2026-10-22; before it, a `100 property difference(s)
  ALLOWLISTED … (SC-361: .dse-swatch, 10 properties)` line followed), a `not openable in the harness (3 …)` line
  (CompendiumSearchModal, LegacyCompendiumModal, CompendiumMigrationModal — opened only
  from the command palette / `main.ts` onload flows; `assertModalRegistry` scans `src/` and
  fails on any NEW `Modal` subclass — direct or transitive (X extends Y extends DseModal) —
  or inline `new Modal(…)` that is neither swept nor declared, or a declared one that grows
  its own `<button>` in the same file; it does not follow button helpers across files), and its own 6-record exemption boundary (6 focus-visible
  disabled). A scenario whose modal does not open, opens the wrong one or lacks its expected
  controls FAILS as "the check would be blind" — never a silent skip. **`HOSTLEAK_KNOWN_LEAKS`
  has been EMPTY since SC-361 (2026-10-22)** — the swatch is now host-invariant; the mechanism is kept
  (a narrow per-modal, exact-class-list, per-property entry naming the owning ticket; the pass
  fails if a listed property stops leaking, forcing the entry's removal). Any new entry is the
  boundary to watch. `tagButtons` now keys on `aria-pressed` too (pressed vs idle chips are separate
  kinds); the gallery mounts only unpressed toggles, so its count did not move (112 / 672).
  The option chips' look (plugin fill + idle ink, height following Obsidian's
  `--input-height`, `display: inline-flex`) is pinned in `test/dom/theme/hostRegrounding.test.ts`,
  which also pins that the in-note `.dse-nt__chip`'s own (0,3,0) rule keeps winning over that
  unscoped block.

Battery numbers at SC-205 land-ready (dse branch `sc205-btn-host-leak`, 2026-08-28, base
`16e25ff`): jest 3257 passed / 1 skipped / 185 suites; shots 474 PNGs, 0 FAIL; freeze
210/210, 0 mismatches; parity 0 GAPs / 0 undeclared / 16 DECLARED. SC-205 moved zero
pixels and zero frozen bytes; shots runtime grew ~+35 s (+11%) from the two state passes.

Battery numbers at SC-126 step 2 land-ready (dse branch `sc126-parity-bg`, 2026-09-18, base
`96e2238` — rebased from `e12c6bd` onto `origin/develop` mid-round; SC-196 landed 6 commits
in between, unrelated to this change) — **the "SC-205" figures above are stale by 68+ commits
of unrelated feature work; verify against the current tree rather than trusting any row.**
Measured across the `sc126-parity-bg` branch series (this ticket's own rule round plus its
two review-fix rounds): tsc/lint clean throughout; jest 3836 (the `e12c6bd` baseline) ->
**3889** passed / 1 skipped / **202 of 203 suites** (net **+53**: +19 are this ticket's own
new tests — 9 in the rule round, 8 in the first review-fix round, 2 in the second — the
remaining +34 came in on an `origin/develop` rebase mid-series via SC-196's unrelated test
additions); shots 524 PNGs, 0 FAIL, unchanged; freeze `260/260`, unchanged; parity
**0 GAPs / 0 undeclared / 16 DECLARED / exit 0**, unchanged in composition — `bg-color` fires
0 rows on the real tree, so this series is a pure tightening. The first review-fix round
additionally closed an `excludes` hole — a material rule (`bg`, `bg-polarity`, `bg-color`,
`shadow`, `hairline-top`, `hairline-bottom`) can no longer be dropped from the contract via
`excludes`, only via a sibling pair that measures it honestly — and re-shaped the `bg-color`
GAP message to a per-axis verdict (each delta states its own true comparator and a `FIRES`
marker only on the axis that fired, instead of printing both deltas against `> tol`
unconditionally). The second review-fix round applied that same per-axis shape to rule 7
(`ink`)'s GAP message, since its 16 declared rows are the only ones visible on a green run
and one of them (`pr-chars` light) was printing a false `alpha 0.00 > 0.03`. Live-hole
proof at landing: temporarily deleting `.dse-section`'s `background:
var(--dse-surface-sunken)` in `styles-source.css` flipped the same run to `2 gap(s)` (the
`section` pair, both schemes, rule `bg-color`) — a hole every rule before this round left
silent — then reverted byte-clean (`git diff` empty) before the gate was re-measured green.

### Block edit form Save and embeds (SC-556)

- **The dropped-write Notice** (`droppedWriteNotice.ts`, `DROPPED_WRITE_NOTICE_INTERVAL_MS`) is limited to once per note per 5 s for **card (fromView) writes only**; a form Save's Notice is forced. A phase that expects the Notice of a dropped CARD write needs a note of its own, or more than 5 s after the previous drop on that note.
- **Two identical blocks separated only by blank lines:** a deletion of one cannot be told from a deletion of the other (the note that is left is the same). The head-first line diff reads the LOWER one as deleted, so before SC-612 a form or card on the upper block was saved into the surviving block (a different block that only looks the same) and a form on the lower block was refused. Since SC-612 (rule P) a pin whose known body occurs twice (in the note as pinned, or now; `twinned`) is placed only when the head-first answer is the UNIQUE cheapest placement of the pinned block (`placedUniquely` in `ReadingModeBlockHost`): the block paired with each block of the note now whose lines are identical to it, or deleted, priced by the line edits of everything before and after it (`editDistance`, lineMap.ts: common head and tail trimmed, a capped Myers diff). A tie, a cheaper placement elsewhere, or a head-first answer that is no identical block, is refused with the "changed on disk first" Notice (a form stays open; the next round, on the note as it is now, saves). The pricing is capped: when the head-first answer's placement cannot be priced at `LINE_MAP_MAX_EDITS` lines the head-first answer stands. `strictPins` (SC-607) keep their tail-first check at write time and get the same placement check when twinned. A note WITHOUT identical blocks is never refused by this rule and runs no placement; every pinned write still counts the known body (`twinned`: two scans of the note). A test about "the form's own block was deleted" that wants the SURVIVOR written needs different prose between the twins (the lifecycle fixtures G-S64 / G-S73 have TOP / M1 / M2 / BOTTOM); with only blank lines between, the correct outcome is a refusal (lifecycle G-S108, jest `reading-mode-host-whole-pin*.test.ts`). History: r2's rule R (tail-first map + two greedy maps) paired fence lines of blocks of OTHER values and so both wrote a different block (a counter of another value next to the run of twins) and refused unambiguous cases; the independent review found it with a fuzz (212 twinned ambiguous writes, 508 new unambiguous refusals in 234,064 cells) and P replaced it (0 / 0).
  - **Jest (SC-612):**
    - `test/dom/framework/reading-mode-host-whole-pin.test.ts`: T1-T14 (form and card; ticket shape; lower deleted + TOP edited; upper deleted + BOTTOM edited; the mirrors; a triple run; cost + not persistent; T6b interchangeable twin; prose-separated twins; unrelated edits; controls; own rounds; T14 the capped residual) and the review's H1, H1b, H1c (refused) / M1, M2, M3, M6 (saved) / the unterminated trailing fence.
    - `reading-mode-host-whole-pin-sweep.test.ts`: 14 layouts (the four with a counter of another value next to the twins: `twin-blank+diff-below`, `twin-blank+diff-above`, `tight-diff-neighbour`, `triple+diff`) x every counter x edits x form / 3 card section modes, plus own rounds, against a TS ambiguity oracle independent of lineMap. Asserts: no write in an ambiguous cell; one Notice per refusal; the next round saves; unrelated edits save; no refusal where the one cheapest placement is the pinned block and the head-first `mapLine` puts it there. Pinned totals: cells 10966, oracle-checked 10264, ambiguous 2288, saved 6003, refused 4029, other 934 (text-identical).
    - `reading-mode-host-whole-pin-fuzz.test.ts`: the seeded fuzz (seeds 1-3, 3000 notes each, 2-4 counters, callouts, CRLF, unterminated trailing fence, other-language twins, 0-3 random outside edits, truth tracked by block id, LCS oracle), ~9 s. Asserts: integrity (one block's body changed, every other byte kept), one Notice per refusal, no refusal without an outside edit, the next round saves, no write in a twinned tie, no refusal outside a tie. Pinned totals per seed in the file. The bigger r3 run (20000 notes x 3 seeds) is `sc612-r3-fuzz.test.ts.txt` + `sc612-r3-classify.py.txt` in the SC-612 ledger.
    - `lineMap.test.ts` "SC-612: editDistance" (6); `reading-mode-host-drawn-pin.test.ts` one added test (a strict pin of a part that is the whole note, checked against the placement rule at write time).
    - When the line maps or `placedUniquely` change, the sweep and the fuzz are the first place to look: a red names `layout/pinned/edit/construct` or the fuzz cell id and its edits.
  - **Jest (SC-621):**
    - `test/dom/framework/reading-mode-host-part-pin-twin.test.ts` (32 tests: ticket shapes, mirrors, controls, second timing, the twin-gate cells, persistence).
    - `reading-mode-host-part-pin-sweep.test.ts` (3 tests: sweep + two fuzz seeds; about 18 s jest wall; waits with SC-568's `settleVaultReads`, and its per-cell cleanup restores only its own `getFileCache` spy, not `restoreAllMocks`, so the helper's read counter survives the whole test). Oracle: SC-612's LCS placement cost, independent of lineMap. Subset by design: T1 only (the write lands before the click; T2 is refused by SC-612's write-time rule and pinned in the twin file), 2 of 18 click combinations per (layout, link, edit) = 1170 cells, fuzz seeds 1, 2 x 150 notes = 312 + 264 cells. The full 21,060-cell sweep SC-621 was designed on takes about 9 min and is not committed (r1 artifact `sc621-r1-part-sweep.test.ts.txt` in the SC-621 ledger).
- **Embeds of part of a note** (`![[note#Heading]]`, `![[note#^id]]`, a hover preview): Obsidian gives the card only that part's text, with
  line numbers from its first line (measured `{lines: 10, lineStart: 2}`). A pin made of that is not a position in the note, so a block
  inside `.internal-embed` / `.markdown-embed` (or a hover preview) gets a PARTIAL pin (`partialPins`) that `rebaseCardPin` (async) places
  onto the whole note: the part IS the note; else the LINK (the embed's `src`, or for a hover preview the link of Obsidian's `hover-link`
  event for THAT popover) checked by `cardLinkLine` over the whole part; else this host's own last write (`lastWrite`) when it is of the
  known body (and, since SC-607, the link's line is accepted only when the block the card was drawn from maps strictly to it; see "The drawn-from rule (SC-607)"); else the pin stays partial and `pinnedTarget` refuses it (Save writes nothing and shows the Notice). **A block edit form's
  pin and a card write's pin are placed the same way since SC-596** (before, a form went through `rebasePin`: `verifiedPinLine`, then a
  text search for the part's lines in the note; both deleted). Nothing ever searches the note for the part's text or for the body, so a
  block edited from outside before the form opened can never be taken for its identical twin. A pin that cannot be made at all - no
  section, or a non-plain window (callout, quote) whose text holds no block with the known body and no record of this host's own
  write - is a REFUSING pin (`refusingPins`, partial too): `replaceSource` treats it as an unplaceable write and writes nothing. A form in an
  embed / hover preview therefore never has a NULL pin (a null pin saved without `pinOnly`: the part's line numbers and the body
  against the whole note, which finds the twin). The same refusing pin covers a CARD write there (SC-596 Q4: five measured shapes
  wrote the twin). An embed of a whole note (`src` without `#`, or a hover link without `#`) is not partial. The jest mock
  `resolveSubpath` (`test/mocks/obsidian-core.ts`) works on a cache a test supplies (`jest.spyOn(app.metadataCache, 'getFileCache')`);
  the jest mock `Vault.cachedRead` waits a macrotask, so under jest FAKE timers an awaited `cachedRead` never resolves (the rebase is
  gated on the embed ancestor, so a plain form never awaits it).
  - **A jest model of a form in an embed must be what Obsidian draws:** the embed element has its `src`; a hover preview has the
    `hover-link` record and the popover DOM (`hoverEl(link)` / `popoverEl(app, link)`); the metadata cache follows an outside edit
    (Obsidian re-reads within ~6-45 ms) unless the test is about the lag; a "+ then the pencil" test needs a real + by that host (a
    note whose host knows 6 while it holds 5 is not a +). A model without them is refused now (it saved by the text search before).
  - **Which Notice shows (measured: the sweep oracle and the named tests assert the kind in every cell).** Two messages, both prefixed
    `Draw Steel Elements: a change to a block in <note> was not saved — `:
    - **"the block changed on disk first."** (`droppedWriteMessage`): a pin exists and nothing places it - the block edited or deleted
      from outside, a heading link naming two places while the body occurs twice, a lagging or wrong cache, an unresolved subpath, no
      cache, a paragraph of the section edited, Y1-Y6, every refusal of a non-list shape that has an own fence in the part (1752 of the
      2880 sweep cells).
    - **"the plugin can't tell where this block sits in the note."** (`unsavableWriteMessage`): a REFUSING pin (stale non-plain window with
      no own-write record: P13, N1, N4; section null at the pencil: N3b; the same for a card write) and list items / footnotes; with
      **" (blocks inside lists can't be edited yet)"** appended when the note's lines at the part hold a list item (492 of the 720 list /
      footnote cells; the other 228, where the block was deleted, have the plain wording).
    - **No host Notice at all:** the section never resolved (N3): `canPersist` is false, `reported` stays false and FormModal says
      "Draw Steel Elements: couldn't save — the block may have moved."
    A card write's Notice is rate limited (once per note per 5 s per message); a form's is forced.
  - **Saved -> refused by design (SC-596 Q1, same as cards since SC-594):** a heading link of a note with TWO identical `## Tracker`
    sections and no + first; a cache that lags an outside edit or points at the wrong line; an unresolved subpath; no metadata cache;
    a paragraph inside the embedded section edited from outside before the pencil; the block itself edited before the open (a field
    removed, the part not redrawn). Each shows the "changed on disk first" Notice, nothing is written, the form stays open.
    Also refused where base saved (r3 LOW-2; all safe, all under Scott's 2026-11-10 ruling, all need a click within ~20-45 ms of an
    outside write or a transient section loss): **a refusing pin when the body is unique** - a stale callout window with no record of
    this host's own write, or a section gone at the click, is refused for a form AND a card + / - even when no identical counter exists
    anywhere ("can't tell where"); and a **nested heading link** (`![[note#P2#Tracker]]`; `## Tracker` under both `P1` and `P2` with
    identical counters): `cardLinkLine` counts every heading of that name in the text, so it is refused like two `## Tracker` sections
    (cards since SC-594). Since SC-607 also refused (all a Notice, nothing written): a section with a unique body MOVED atomically (Sync, an outline drag) while its hover or embed stays open, until the preview is redrawn (F1, ruled under Scott's 2026-11-10 "Save nothing with a notice is fine."); the lower of two ADJACENT identical blocks hovered with the upper deleted; a preview that could not be placed when drawn stays refused after an edit makes the link unique; an identical block added right BESIDE the card's block after its own + while the part is stale; a >400-line rewrite with the body twice; an unrelated outside edit inside the hover mount window.
  - **Refused -> saved:** a block hover or heading hover (twin elsewhere) with nothing edited and no +: the hover's link places it
    (36 sweep cells). `G-S64 (zh)` changed with it: a hover form on `[[note#^id]]` with an identical block above now LANDS in the linked
    block (it expected a refusal before).
  - **Jest coverage:** `test/dom/framework/reading-mode-host-form-pin.test.ts` (new; ~58 s alone because the sweep is a `test.each` of
    2880 cells: 8 constructs x 6 link shapes x RV/LP x edit x + x cache lag x 2 twin layouts, asserting outcome AND Notice kind AND that
    the form has a pin; plus the named shapes P4, P13, N1, N3, N3b, N4, W1, X1, X2, Y1-Y6, r5a / r5b controls and the card
    shapes) and the re-modelled tests in `reading-mode-host-pin.test.ts`.
- **A form opened right after a + on a card in a hover preview or an embed (SC-584):**
  - **What Obsidian reports.** Right after a + the card's part (`getSectionInfo`) is still the one from BEFORE the + (about 20 ms
    after the + write lands it is fresh again), while the note and `host.lastKnownBody` already hold the new body (measured in real
    Obsidian 1.15.1; the form's open waits for the + write, `view.openAfterPendingWrite`). A hover preview has no `src`, so neither
    the link nor the part's text finds the block.
  - **The pin is the position of the host's own write (`ReadingModeBlockHost.lastWrite`).** `replaceSource` records, inside
    `Vault.process`, `{body, text: the note as the write left it, lineStart: the block's fence}` for a host drawn in an embed or
    hover preview. `rebaseCardPin` (a form's pin and a card write's pin alike since SC-596) uses it as the LAST step, when the link (`cardLinkLine`) places nothing and the body known at open is the body that write wrote. The pin is then an ordinary whole-note pin of the write's note text, so `mapLine` / `pinnedTarget` (pin-only, body
    check) judge every outside edit since the +: the block edited or deleted -> Save writes nothing + Notice; an identical block
    added or already there -> irrelevant (nothing searches the note for a body). The record is per host (a write by another host,
    a second pane, is not recorded), is replaced by the host's next write, dropped by `setMountedBody`, and the record and the known
    body are both taken when the pin is made (a write landing during the open-time read does not change the pin). A callout in an
    embed whose stale part holds no block with the known body (so no own fence) gets its pin from the same record
    (`pinFromLastWrite`). A form opened with NO + by that host on a stale part still refuses, as before SC-584. A form or card write whose window holds no block with the known body and has no record is a REFUSING pin since SC-596 (before: no pin, and a write without `pinOnly` could land in the twin).
  - **`^id` marker for a callout.** For a block inside a callout / quote `cardLinkLine` looks for `^id` after the END OF THE EMBEDDED PART (`start` + the part's last non-blank line; measured: the cache's block position runs over the whole callout and the
    id stands after a blank line under the callout's last line). A plain fenced block keeps the rule it had (after its closing
    fence), whatever the length of the stale part.
  - **One window, several blocks (r4 CRITICAL-1, r5, r6 CRITICAL-1, r7 — the same class three times).** `findOwnFence` takes the plain-fence shortcut only when the
    section's first line is an un-prefixed fence (the window IS the block); for every other window (callout, header-less quote, nested quote, list item, footnote)
    it finds the card's block BY BODY, and right after a + the window is stale, so the only block holding the known body can be the TWIN (two identical counters, the
    + made the lower read like the upper): pinned there, Save wrote the UPPER counter with no Notice. The guard is therefore structural, in `takePin`: for a FORM in an
    embed, unless `parseOpenFence(section.text, section.lineStart)` is an un-prefixed fence, the host's own-write record (`pinFromLastWrite`) is the pin when it exists
    and its body is the known body. (r5 compared `ownFence.lineStart !== section.lineStart`, which is false when the twin sits on the window's FIRST line, e.g. a
    header-less quote that starts with a fence.) Record-first for EVERY form was tried and breaks the intended test "the embed was redrawn after the +, so its part is
    current" (a plain block, 1000 lines changed since the +: the diff gives up, the link finds the block), hence the plain-block exception; a form in a multi-block window
    with an old record refuses after hundreds of lines changed on both sides (a Notice, never a twin). The record is dropped when the host's section unloads
    (`onRenderChildUnload`) and by `setMountedBody` (`remountReused.ts:63` re-mounts a host onto a twin with the same body: load-bearing, tested).
    Sweep (jest, `reading-mode-host-pin.test.ts`, 36 cells, base b4e7b4f4 / r5 / now; the host source is unchanged by the f2889351 rebase): callout, header-less
    quote with text first, nested callout, quote inside a list item: lower counter on r5 and now (base: block embed refused, heading embed UPPER); header-less quote and
    nested quote whose FIRST line is the upper fence: UPPER on r5, lower now (base: block embed refused, heading embed UPPER); list item (bulleted, ordered) and footnote:
    refused everywhere (the + itself is not written in a list shape). Real Obsidian (G-S77): callout, header-less quote, both embed shapes, RV and LP land in the lower;
    a list item (block and heading embed) writes nothing, upper untouched. Probe: two IDENTICAL counters, NO + first, form on the lower: lower on base and head (the DOM
    ordinal).
  - **Authoring footguns.** (1) The + write re-serializes the block's YAML in the plugin's own key order (`max_value`,
    `current_value`, `min_value`, `name`): a fixture whose "twin" must read the same after the + needs the twin in THAT order.
    (2) Hover popover (SC-595 corrected this again): since SC-595 a click inside a form (or any DseModal) opened from a hover preview
    no longer closes the preview or the form (`DseModal.anchorTo` / `openManagedModal(owner, factory, anchor)`; see "Hover preview
    modals (SC-595)" below). Before SC-595 the FIRST mouse click inside the form closed popover and form, typed text lost. Phases
    (zk)-(zn) still hold the popover with `hp.hide = () => {}` (`app.workspace.getMostRecentLeaf().view.hoverPopover`, restored in the
    cleanup): that is now only a click-free stand-in (the phases drive `.click()` / the keyboard, not a mouse); the real-mouse
    coverage of the hover form is lifecycle G-S83 (add no phases to G-S64). (3) A hover over `[[long note#Heading]]` is given the heading's BODY as its section (no heading line, `lineStart` 1; measured in Obsidian 1.15.1, Reading view and Live Preview alike), which an identical counter under another heading repeats. Since SC-594 a CARD's + / - in such a hover (or a block hover, or an embed) is placed through the link Obsidian's `hover-link` event recorded for that popover (see "Hover card writes (SC-594)" below) and LANDS in the hovered counter; before it was refused. A FORM opened from a hover is placed the same way since SC-596 (the link, else the host's own last write, else refused): it LANDS in the hovered counter when the note confirms it (a block or heading hover with an identical twin elsewhere and no outside edit), and is refused (Notice, nothing written) when the block was edited from outside before the form opened. A phase that needs a form's Save to land in a heading hover no longer needs a different counter above the section, but a hover FIXTURE must follow the tracker section with another heading: the part of a last section carries trailing text (`END`) its twin's body under another heading does not have. **Block-hover residual shared with cards (r3 LOW-3, jest-only):** `popoverShows` cannot tell two BLOCK previews apart (no id is rendered: `data-type=block` for both), so a block hover showing A but bound to `Note#^b` (the identical counter B carries `^b`) saves into B for a card AND now for a form; base refused it for forms (they never used the hover link). A real pointer cannot produce it in 1.15.1 (the bind-at-first-lookup / bind-at-next-event rule), jest can; a jest model must not bind a popover to another block's link. Not widened (a refusal while the body occurs twice and the bound link is a `^id` would re-refuse the 36 hover cells). (4) A jest test of this needs the host's own + write to exist: `plus(host)` = `host.notePersistIntent()`, a
    25 ms settle (the pin's rebase reads the note once, `cachedRead` waits a macrotask), then `host.replaceSource(body, { fromView:
    true })`; setting `setMountedBody(new body)` instead records nothing and the form is (correctly) refused. The `embedded()` helper
    returns `sec` so a test can redraw the part (`sec.current = …`).
  - **(zc) and (z) are NOT controls.** The outside edit's redraw of the embed closes the form (measured r2: 16-80 ms), so "nothing is
    written" holds whatever the code does. The controls with teeth are in the jest host suite (`reading-mode-host-pin.test.ts`:
    P1 P1d P2 P2n P3 and the callout edited after the +); (zn) is a real control only because the hover popover is held open.
  - Still refused (no data lost): the form's block edited or deleted between the + and Save; a hover preview or embed whose block the
    link and the text cannot place and that had no + from its own card; a `^id` line not directly under the callout; a metadata
    cache that points at another block. SC-594 landed card writes in hover previews and embeds; SC-596 landed the form side (a block-only part edited before open without a +, null-pin forms, forms in hover previews: all placed like a card, or refused), see below.
- **Hover card writes (SC-594).** A card's + / - in a hover preview (or an embed) of PART of a note is a write whose pin is in the part's coordinates. `rebaseCardPin` places it (and, since SC-596, a block edit form's pin too): the part IS the note; else the LINK (the embed's `src`, or for a hover preview the link of Obsidian's `hover-link` workspace event for THAT popover, `src/framework/host/hoverLinks.ts`) checked by `cardLinkLine` and accepted only when the block the card was drawn from maps strictly to that line (SC-607, see "The drawn-from rule (SC-607)"); else this host's own last write when it is of the known body; else the write is refused with today's dropped-write Notice. It never searches the note for the part's text or for the body (`searchedPinLine` was deleted in SC-596). No event, no link, a refusal.
  - **What `cardLinkLine` checks (r4).** The link must resolve to THIS note. EVERY line of the part (trailing blanks dropped) must equal the note from where the link starts; the card's fence must hold the known body; a `^id` link needs its `^id` marker after the block and, while the known body occurs twice, exactly ONE `^id` marker line in the text. A HEADING link is placed from the note TEXT, not from the metadata cache alone (`headingNames.ts`: `atxHeadings`, `normalizeHeadingName`): a heading hover's part is the heading's BODY, so the line it hangs from (`start`, from the cache) must be, in the text, an ATX heading line of the link's name (a cache that lags a moved / pasted / deleted section points at another heading or a blank line: refused), and while the known body occurs twice the text must hold exactly ONE heading of that name (count from the text, outside fences; the cache's count is not used).
  - **A CRLF heading hover (SC-619, measured in Obsidian 1.15.1).** Obsidian cuts a heading HOVER's part (`getSectionInfo().text`, the card's `lineStart`) from ONE character after the heading line's content. In an LF note that character is the line break, so the part starts on the line under the heading (`"\n```ds-counter\n…"`, `lineStart` 1). In a CRLF note it is only the CR, so the part starts with a stray LF (`"\n\r\n```ds-counter\r\n…"`, `lineStart` 2): every line sits one lower, the every-line compare failed and the write was refused ("changed on disk first", nothing written) although nothing changed. A heading EMBED (part starts at the heading), a block hover / embed, and a whole-note hover / embed were never affected. `cardLinkLine` now drops that one LF and uses `relLine - 1`, only for a hover (`hovered !== null`) of a heading link (no `^id`) whose part starts with `\n` and whose heading line in the note ends in `\r\n`; the part is then compared exactly like the same LF note's, so every refusal (swapped names, a deleted adjacent twin, a moved section, SC-607 / SC-612 rules) is the same in CRLF as in LF. The condition reads the HEADING line's terminator (`eols[start]`), not the next line's: in a mixed note (CRLF heading line over an LF-only blank line) the part is `"\n\n```ds-counter\r\n…"` and the fix saves it. CR-only notes (SC-460) are measured (r3): the part starts with `\r`, the branch never fires, and they save and refuse exactly like the LF note (as at base). **Residual (accepted by the owner, option (a), under Scott's 2026-11-10 "Save nothing with a notice is fine"):** a CRLF note converted to LF from outside (git autocrlf, a sync client, an editor's EOL conversion) while its heading hover is open: Obsidian redraws the preview with the LF part but the card keeps the CRLF snapshot it was mounted on, and the drawn-from call of `cardLinkLine` reads the heading terminator from that snapshot, so the branch fires on an LF part and drops its legitimate blank line: + is refused with the Notice (base saved), not persistent: a preview reopened on the LF note (a new card) saves (measured in real Obsidian too, Reading view and Live Preview, r5). So "an LF note never takes the branch" holds for a card mounted on an LF note, not for a CRLF-mounted card whose note became LF; the mirror (LF to CRLF while open) is refused at base and with the fix. Jest: `test/dom/framework/reading-mode-host-crlf-hover.test.ts` (23 tests: the 9 CRLF saves (incl. the mixed note), 7 LF/CRLF refusal parities, 4 controls, the model of Obsidian's slice, the 2 residual pins (refused; saved after reopening); its helper `hoverPart` slices at `heading end + 1` from the raw note, which is what a CRLF hover test must do, not `['', …].join('\n')`). Lifecycle `G-S112`.
  - **The hover-link log.** Registered once at load (`registerHoverLinks`, from `registerFrameworkElements`, so `onload`; a listener registered when the first card is built missed that hover's own event). The link is BOUND to a popover once: at the first lookup for that popover element, or at the arrival of the NEXT `hover-link` event (any link), whichever comes first (a null result is bound too). Previews already open when the listener registers are bound to NO link. Measured (r2, 1.15.1): a card is built and mounted while its element is still DETACHED (`closest('.hover-popover')` is null at construct and at `setMountedBody`; the card is attached 10-14 ms after the popover), so a card cannot ask which popover it is in until a click; a pass-over of another link on the same parent (event at ~650 ms, its popover never opened, `hoverParent.hoverPopover` still X's) used to become "the newest event of X's popover" and wrote the identical counter under Y's heading. The bind-at-next-event step closes that. `hoverParent.hoverPopover` is set only when the popover is shown (r3 read of `app.js`), so at a second link's event it is still the SHOWN popover: the next-event bind binds X to X.
  - **The DOM cross-check (r4, `popoverShows`).** The bound link must be what the popover's own DOM shows (measured: `.markdown-embed[data-type=heading]` with the first `[data-heading]` = the heading name; `data-type=block`; a whole-note hover has no `data-type`). Otherwise `hoverLinkOf` returns null and the write is refused. It closes the residual r2 named (another link's event before the popover exists) for HEADING links, and a whole-note link bound to a heading or block preview. It does NOT tell two BLOCK previews apart (no id is rendered: a `^a` preview bound to `^b`'s link still passes `data-type=block`); a real pointer cannot produce that in 1.15.1 (r3), jest can. Since SC-596 that block-hover residual holds for a FORM's hover pin as well (a `^a` preview bound to `^b`'s link, the identical counter carrying `^b`: Save writes it); a real pointer cannot produce it (r3), jest can, so a block-hover jest model must bind the popover to the link of the block it shows.
  - **Heading hover shape.** A heading hover's section is the heading's body (no heading line, `lineStart` 1 in an LF note; in a CRLF note the part starts with a stray `\n`, `"\n\r\n```ds-counter…"`, and the card's `lineStart` is 2: SC-619, `cardLinkLine` drops that LF); a block hover's is the block's own lines (`lineStart` 0); a whole-note hover's is the whole note (`isWhole`). A jest model of a heading hover must use the body (`part(SUB, 2)` with the heading line is the shape of `![[note#H]]` EMBEDS only) AND give the popover DOM the host checks (`hoverEl(link)` in `reading-mode-host-pin.test.ts` and `popoverEl(link)` in `reading-mode-host-hover-card.test.ts` note the `hover-link` record and draw `data-type` / `data-heading`). A jest cache mock must lag an outside edit by passing the OLD note's lines to `cacheFor` (`hovered(..., cachedNote)`); a cache mock that follows the note hides the whole heading-hover hazard class. A heading inside a callout gets no hover preview card in Obsidian 1.15.1 (measured, LF and CRLF), so there is no callout heading-hover shape to test. A jest model of a heading hover in a CRLF note must slice the RAW note at `heading end + 1` (see `hoverPart` in `reading-mode-host-crlf-hover.test.ts`), not `['', ...].join('\n')` (SC-619).
  - **The card guard in `takePin` is load-bearing.** The r7 guard for cards (`if (embedded)` -> `pinFromLastWrite()` for a window that is not the block's own plain fence) is killed by J19: a second + after an outside edit put the first + back, in a stale two-counter callout window, writes the SIBLING counter without it.
  - **The 17-44 ms window (only for edits that change the preview's text).** After an outside write lands (Sync, another app) the preview redraws its card 17-44 ms later (measured n=10 RV/LP) when the part's TEXT changed; a scripted `.click()` on + in the SAME page task as `await vault.process(...)` lands before that redraw. G-S92 (g) (block hover), (h) (heading hover, counter edited) and (j) (heading hover, the identical `## Other` section moved ABOVE `## Tracker`: the metadata cache still has the old lines for ~6-45 ms) drive exactly that: the note must stay as the edit left it, one dropped-write Notice. A real mouse click sent after the edit cannot land inside it. Look up the + button of the OLD card AFTER the edit resolved, inside the same task. An edit that leaves the part's text unchanged (the hovered one of two identical `## Tracker` sections deleted, two heading names swapped) does NOT redraw the preview (r5, measured over 1.5 s): no window, and since SC-607 the click is refused (G-S99), see "The drawn-from rule (SC-607)".
  - **G-S92** (its own part 6; in SCENARIOS order after G-S91, before G-S56; about 103 s alone as part 6 with the build and start-up): (a) `[[long#Tracker]]` Reading view, (b) Live Preview, (c) short note, (d) `[[note#^id]]` with an identical block carrying another id, (e) a second real + 450 ms after the first (A = 7), (f) a callout under the heading with an identical callout elsewhere; (g) (h) (j) the scripted-click trials above; (i) whole-note hover, an identical block added above from outside (the hovered block is written, not the added one); (k) hover `[[#Tracker]]`, then `[[#Other]]` with the first preview open, a real + in the second preview lands in ITS counter (the T1 shape; green on the r2 bundle too: a regression guard for the bind). One note per trial (a card Notice is rate limited per note). Red on the e0e49d4d bundle: (a)-(i); (j) is red on the 0bf5989d bundle (wrote the counter under the old line, no Notice).
  - **Still refused (Notice, nothing written) — exactly:** (1) a counter in a list item or a footnote (SC-461); (2) a counter edited from outside just before the click (the preview still shows its old value), or a hovered section moved, pasted over or removed from outside just before the click while the metadata cache has not caught up (the part no longer equals the note where the link starts, or the hanging heading line is not that heading in the text, or the heading name occurs twice in the text while the body occurs twice); (3) a hover with no `hover-link` record, one already open when the plugin loaded, or (heading links) one whose DOM shows another heading than the bound link names; (4) a link that names two places (two headings of that name, two `^id` lines) while the body also occurs twice; (5) a HEADING hover whose heading is written with an underline (setext) or whose text on the line differs from the link's name after trim / whitespace collapse / lower case (formatting, links, a colon: `## Tracker: one` linked as `[[note#Tracker one]]`; safe, base refused it too); (6) a block link whose `^id` marker is not directly after the block (a lagging cache points at another block); (7) a whole-note hover whose counter was edited from outside. (8) a preview of part of a note whose drawn-from block does not map strictly to the link's line (SC-607). A form's pin is the same pin (SC-596) and refuses the same shapes. A block with no pin at all (no section, a stale callout window with no own-write record) is a REFUSING pin for card writes and forms alike (the "can't tell where" Notice; a card's is rate limited). Unchanged: an unwritable list shape ("can't tell where").
  - **The drawn-from rule (SC-607).** A card's + / - or a block edit form's Save in a hover preview or an embed of PART of a note is placed through the link on the note as it is NOW (`cardLinkLine`), and accepted only when the block the card was DRAWN from maps STRICTLY to that same line. "Drawn from" is the note read when the card was mounted or re-bound (`snapshotDrawn`, one `cachedRead` per card mount, dropped for a whole-note section and when the metadata cache does not describe the text read: `metaMatchesText`) or this host's own last write (`lastWrite.seq`), the newer first. "Strictly" is `mapLineStrict` (lineMap.ts): the head-first and the tail-first line map must agree; the result says why not ('deleted', 'disagree' (a tie between identical blocks), or 'gave up' (more than LINE_MAP_MAX_EDITS)). Such pins are strict at write time too (`strictPins`, `pinnedTarget`: a strict miss never falls back to `twinned` / `resolveWriteTarget`). A preview whose part text did not change is never redrawn by Obsidian, so the link can name another identical counter (the hovered one of two identical `## Tracker` sections deleted, two heading names or `^id` markers swapped): that is refused with the "changed on disk first" Notice, never written into the other counter.
    - **Gave up (R-Q2c):** when either map gives up the link places the pin as before ONLY IF the known body occurs exactly once in the drawn-from text AND exactly once in the note now (`countByBody`); otherwise refused.
    - **Hover window guard (R-Q3):** for a hover MOUNT snapshot (not a re-bind, not an own-write position, not an embed) `hoverPopover.embed.data` (internal API, read by `hoverDrawnText` in hoverLinks.ts through the `hover-link` event's popover; absent or not a string: skipped, never a refusal) must equal the snapshot text, else refused - but only while that data still CONTAINS the card's part. Measured (G-S92 (e), Obsidian 1.15.1): `embed.data` is the note as FIRST drawn and is NOT refreshed when the preview is redrawn from a changed part, so a part the data does not hold was drawn from a newer note and the check is skipped. A first version of the guard that compared every snapshot refused G-S92 (e) (a second + 450 ms after the first).
    - **Residuals (writes that base also makes, or refusals):**
      1. The embed race: an outside write between Obsidian's own read and the card's `cachedRead` (hover 104-128 ms, embed 6.8-7.9 ms measured) that leaves the part unchanged and the cache consistent. Closed for hovers by the guard when the popover exposes `embed.data`; open for embeds (0 of 6 race trials hit it; no Obsidian handle).
      2. A redraw from a changed part whose new text also occurs in the stale `embed.data` (an identical counter) is refused (safe Notice).
      3. The redraw race (F2): an outside write changes the part, Obsidian mounts a NEW card, and a second outside write lands within ~20-23 ms (measured, no Obsidian read in between) before that card's snapshot; the guard is skipped (the new part is not in the stale data), and a section deleted with another counter edited to match is written into that counter. Base writes it too.
      4. An unrelated outside edit inside the hover mount window (~104-128 ms, F3): `embed.data` is not the text the card read, so that card refuses every click until the preview is redrawn (reopened). A refusal (base saved). Not narrowed: using `embed.data` as the drawn-from text was considered and not taken.
      5. The give-up fallback (F4): more than 400 lines changed around the block, the drawn counter deleted, another counter edited to the same body AND given the link's heading name or `^id`: the uniqueness test cannot see "another counter edited to read like it", and the link places it. Base writes it too; without the give-up the same edits are refused.
      6. (SC-612) Whole-note pins: see the "Two identical blocks" bullet and the P residuals below. `mapLine`, `mapLineFromTail`, `mapLineStrict` and `rebaseCardPin` are unchanged; `rebaseCardPin` kept a one-sided-edit residual for part-of-note pins (filed SC-621; fixed by SC-621, see "Part-of-note pins: rule P at the rebase" below).
    - **P residuals (SC-612, owner-accepted):**
      1. Text-identical moves and pastes: the note after a cut and paste within / next to a run of identical blocks (and N5: the pinned block deleted and another edited to read like it; N6: deleted and an identical one pasted elsewhere) is the same as another edit's, so no line map can see it. In the fuzz: 138 writes in oracle-ambiguous cells whose body is NOT twinned (P does not apply; 34 into another block), identical to base.
      2. A twin tie combined with a ONE-SIDED edit of more than `LINE_MAP_MAX_EDITS` (400) lines (the head-first map still places the block, the capped diff cannot price its placements): the head-first answer is written as at base. Pinned in jest (T14).
      3. The `rebaseCardPin` / `mapLineStrict` one-sided-edit residual for part-of-note pins: fixed by SC-621 (see "Part-of-note pins: rule P at the rebase" below).
      4. A closed copy pasted above a pinned UNTERMINATED trailing fence: the head-first map names the copy (base wrote it), P refuses it (the one cheapest placement is the pinned block further down, not where the head-first map says). A safe refusal.
      5. A counter of another value pasted directly above the pinned block (only blank lines between) is refused when the head-first map pairs the pinned fence line with the pasted block's fence line; the base refuses it too (not this rule's).
      6. (r5 MEDIUM, owner-accepted) An outside edit that changes only whitespace INSIDE the pinned block (E1 a trailing space on a body line, E2 a blank line before the closing fence) inside the form / click round, in a note with identical blocks: refused with the Notice (the block's lines are no longer identical to its pinned lines, so it is no candidate placement); base saved. The block did change on disk, it is safe (nothing written) and the next round saves; a note without twins is unaffected.
    - **Part-of-note pins: rule P at the rebase (SC-621, owner-accepted):**
      1. The rule (`rebaseCardPin`, `ReadingModeBlockHost.ts`): after `mapLineStrict` agrees with the link's line, a block twinned in the note it was drawn from OR in the note now (`twinned(whole, drawnPin)`) is placed only when `placedUniquely(whole, {text: from.text, lineStart: from.line}, at.line)` holds, i.e. SC-612's rule at the drawn -> now step. `mapLineStrict` and its tail-first check are unchanged. Reason: both maps trim an untouched side first, so a change on ONE side of a run of identical blocks leaves them agreeing on the survivor, and the write-time rule P compared now with now. Before SC-621, 16 of 16 reachable ticket cells in real Obsidian wrote the other counter.
      2. Repeat until reopen (accepted, ruled by the owner on SC-607 F1/F3 and SC-621 Q1): a refusal here repeats on every click of a preview or embed that is not redrawn, until it is reopened (measured: click 1 refused + 1 Notice, click 2 refused + 1 Notice, a card mounted on the note now saves with no Notice). Pinned in `reading-mode-host-part-pin-twin.test.ts` ("persistence").
      3. Residuals (base writes the same; no rule over the text can see R1 and R2, R3 is too large to price): R1 a move among text-identical blocks (the note's text does not change, SC-612 N5/N6 class); R2 the drawn-from section deleted while a neighbour is renamed to its name, where the cheapest reading keeps the drawn-from counter (same layering as SC-607 F4); R3 the ticket's shape combined with more than LINE_MAP_MAX_EDITS (400) lines changed around the block in the same write, so `placedUniquely` cannot price it and the agreed map stands (SC-612's accepted cap; r3 measured 474 such cells, all with a drawn -> now distance of at least 401; "refuse when twinned and over the cap" stopped only 9 of 132 other-counter writes and added 92 unambiguous refusals, so it was not taken). The sweep pins the R1 / R2 cell counts (R3 is not in the committed sweep subset).
      4. The twin gate must be `twinned(whole, drawnPin)` (the note as drawn OR now): a gate on the drawn note only lets an identical counter pasted above a UNIQUE drawn-from counter (+ TOP edited) through; the named twin test "an identical counter pasted right above the unique one the card was drawn from, TOP edited" kills that mutant.
    - **New refusals (all a Notice, nothing written; Scott 2026-11-10 "Save nothing with a notice is fine."):**
      - **A moved section (F1, ruled):** a section (heading or block) with a unique body, moved atomically (Sync, an outline drag) while its hover or embed stays open, is refused until the preview is redrawn (reopen). The line map anchors on the fence line, which is the same text in every counter, so a move reads as deleted or ties; the only narrower rule (treat 'deleted' like 'gave up' when the body is unique) writes a different counter in three shapes (an unique counter deleted and another edited to read like it and named by the link: P10b, P11c, P9c). Pinned in jest: hover and embed x heading and block link x moved to the end / below another section.
      - the lower of two ADJACENT identical blocks hovered with the upper deleted (the two maps disagree);
      - a preview that could not be placed when it was drawn stays refused after an edit makes the link unique;
      - an identical block added right BESIDE the card's block after its own + while the part is stale (a non-adjacent addition still saves);
      - the >400-line rewrite with the body twice (the give-up control);
      - an unrelated outside edit inside the hover mount window (residual 4).
      - SC-612: of identical counters (blank-line separated) in a note open in its own pane, the one the form / card is on deleted from outside inside the form / click round, alone or with an unrelated edit (a line above or below, a blank line) in the same write; the mirror (the OTHER twin deleted; base saved it by luck); any member of a run of identical counters;
      - an identical counter ADDED or REMOVED next to (or anywhere among interchangeable twins of) the pinned block inside the round, with or without an unrelated edit in the same write: refused exactly when the oracle sees a tie;
      - never without an outside edit, never persistent (the next round saves), never in a note without identical blocks.
      - Measured guarantee, "on the sweep's 14 layouts and the seeded fuzz", not a proof: in every cell the independent oracle calls ambiguous AND whose body is twinned, nothing is written (r3 fuzz, 234,064 cells: 0 writes, tip R had 212); no refusal where the one cheapest placement is the pinned block and the head-first map puts it there (0, tip R had 508).
      - Not refused (pinned in jest): a twin separated by prose from the pinned block when the other is deleted; an unrelated edit above / below / between; a prose line or blank line between the twins; the other twin's value bumped (a sibling write); a different counter pasted right above + TOP edited; a counter of another value deleted or added next to the run (H1/M1-M6 family); 500 lines inserted above; the user's own rounds with a stale section.
    - **Jest:** `reading-mode-host-drawn-pin.test.ts` (768-cell `test.each` asserting outcome AND Notice kind; N1-N7; the give-up pair of controls; the hover guard cases; the move cells; P19b; the whole-note strict pin; the whole-note-as-drawn path; the end-of-text cache check; the unload test), `lineMap.test.ts` (`mapLineStrict`). A jest model of a redraw calls `host.rebind(el, ctx)` (the adoption Obsidian does; the hover-card and form-pin redraw models were re-modelled in r4), and a hover model gives the popover `embed: { data }` = the note as FIRST drawn.

### Hover preview modals (SC-595)

- **What closes a preview.** Obsidian's page-preview popover (`Cf.create`) hides itself on any `click` that reaches its window in the BUBBLE phase and is neither default-prevented nor inside the popover; hiding unloads the card, which closes every modal its view opened (F1 §4.5), the block edit form included (SC-552's keep-open rule needs the note in a pane). A `DseModal` opened from an element inside `.hover-popover` (anchor: `cx.host.containerEl`, passed by every opener; a nested modal inherits `parent.anchor`) therefore:
  - **guards clicks at its own document**, bubble phase, `stopPropagation`, never `preventDefault` (that cancels label / checkbox activation: an Obsidian toggle stops toggling). It tests `evt.composedPath().includes(containerEl)`, not `target` + `contains()`: a control the modal redraws in its own click handler (Conditions "Add condition" and row controls, the pool's condition icons) is detached when the click reaches the document. The guard outlives `close()` by ONE task (`setTimeout(…, 0)`): the click that closes a modal (Cancel, Confirm, Apply, the backdrop) runs `close()` at target phase, before it reaches the document; with the guard gone at once it hid the preview and closed the parent modal (a free-heal Confirm lost the staged heal). Every other modal listener still dies synchronously.
  - **re-pushes its keymap scope** after the popover's own push, so Escape closes it. The popover's click-to-edit helper (a bubble listener on the embed container, so it runs after the opener's handler) arms a 10 ms timer, 150 ms when the click lands on text, and pushes its scope from it. The modal arms re-pushes at 10 ms and 150 ms (`HOVER_HELPER_DELAYS_MS`) from a window-bubble listener for the opening click (it runs after the container's), so equal timers fire in arming order: an ordering, not a margin, at any load. A modal opened outside a click arms them at once. Only the newest preview-opened modal re-pushes (a parent must not bury its child) and only when the modal's window is the active one (`pushScope` uses `activeWindow`'s stack). A 0 ms re-push left Escape dead in every G-S83 trial.
  - **focuses the preview itself for the click that opened it (SC-598).** Obsidian's window-CAPTURE click listener (`T3`, app.js 1.15.1, re-registered for each hover session) hides, 5 ms after any click, every shown preview that is not "focused" and does not contain the click; it ignores `defaultPrevented` and modals, and the document guard above (bubble, document) cannot reach a window capture listener. A preview is focused only by its click-to-edit helper's timer (10 ms after a click, 150 ms when the click landed on TEXT: the stamina bar's "15", a montage cell's skill text, a labelled button), so a second click inside the modal within that window closed the modal and the preview. `DseModal.focusHoverPreviewNow` runs from the opening click's window-BUBBLE listener, BEFORE `arm()` (the order is the point: the helper's timer, armed during this dispatch, must precede the re-pushes), for an anchor inside a `.hover-popover` that lacks `.is-editing`: it `preventDefault()`s the opening click (the helper's callback then skips it; left alone it ran at 150 ms and, with the focus moved off a button or input by a second click, switched the preview into a source editor), adds `interactive-child` to the anchor (only if absent) and dispatches ONE bubbling, cancelable, coordinate-less `click` on the anchor (built with the anchor's window's `MouseEvent`): the helper takes the 10 ms path, its "open the editor?" test says no because of `interactive-child`, and the class comes off from a 10 ms timer armed after the helper's. Public API only. Residual (measured at 4x/8x CPU slow-down and with zero-length scripted presses, which hid the preview in 2 of 17 plain G-S91 runs before SC-616): a second press queued in FULL (down and up) while the modal is still opening is handled before the helper's timer and still closes both, as before. G-S91's title / apply / reopen trials release their second press after an in-page 11 ms timer, so they test what SC-598 promises (a click after the preview had its 10 ms) and not this residual; the dblq trials keep the queued double-click, which the base fails at any gap (SC-616). A double-click on an opener still closes the WINDOW (its second press lands on the backdrop, in a pane too, SC-604); the preview now stays. **An opener's test that counts clicks through the preview now sees TWO: the opener's own click (target the opener) and the synthetic one (target the anchor, `cx.host.containerEl`).** A preview that is already `.is-editing` (focused: it was opened from before, the window closed, the same control pressed again) gets NO synthetic click and no class, but the opening click is still `preventDefault()`ed: the helper's timer for a re-open's click on text (150 ms) would otherwise re-run the focus step and its "open the editor?" test after a second press moved the focus to `body`, switching the preview to a source editor with the keyboard focus inside it behind the open window (r3 MEDIUM-1; the base did the same; G-S91 `reopen rv`). Modals opened outside a click (a delayed open) or by `dblclick` (the initiative grid) are untouched.
- **jest.** The stand-in for the popover is a `window` bubble click spy; the jest mock `App` has `keymap` (`FakeKeymap`, a scope stack), the mock `Modal` pushes / pops its scope, `activeWindow` is aliased in `test/setup/dom-setup.ts`. Use fake timers for anything about the 10 / 150 ms re-pushes (a 5 ms real wait raced the 10 ms timer under load), and write the popover's delays as LITERALS (10, 150) in the tests, never from `HOVER_HELPER_DELAYS_MS`: a test built from the production constant shrinks with it (r5 MEDIUM-1: `[10]` alone passed every jest test and G-S83). Real openers are driven: the pencil + Cancel (`formModalHoverPreview.test.ts`), the stamina bar (`stamina-bar.test.ts`), free-heal Confirm / Cancel (`stamina-edit-modal.test.ts`), the initiative + incl. "Add condition" (`initiative.test.ts`), the conditions panel (`conditions.test.ts`), the Montage sheet (`montage.test.ts`); DseModal-level cases in `managedModal.test.ts`. 32 SC-595 tests. SC-597: 22 tests (10 in `stamina-bar.test.ts`, 12 in `montage.test.ts`): Enter / Space send one bubbling click to the opener inside the preview, the modal is open synchronously, the modal's scope is above the popover's 20 ms after the key (K6 dies here; a check made only at 200 ms would miss it, because the 150 ms re-push masks it), a control outside a preview, and the keydown guards (Ctrl / Meta / Alt, a held key, an already-handled key, a key from a child). The popover stand-in is a click listener on the .hover-popover container that arms a literal 10 ms push. 23 mutants of the openers, the guards and `managedModal.ts` are all killed in jest. Of the 21 mutants of `sc595-r6-mutants.log` (M1-M16, R1-R4) every one is killed in jest except two by design: M7a (equivalent: a layered defence) and R4 (guard removed by `queueMicrotask`: invisible to jsdom, which runs no microtask checkpoint between script-dispatched listeners; G-S83's form Cancel and free-heal Confirm catch it). M16 (`[10]` only) is killed by two jest tests AND by G-S83's `stamtext` trial; the earlier "M16 killed" claim (r4 report, this proposal's r4 text) was wrong at `a53b0454`. SC-598: the preview stand-in for these tests is `test/dom/_hoverPreviewStandIn.ts` (a window CAPTURE click listener that, when the preview is not focused and does not contain the click, hides it 5 ms later even if it has become focused meanwhile, and the click-to-edit helper (its timer, like Obsidian's, `preventDefault()`s the click it handles, so a test must read `defaultPrevented` SYNCHRONOUSLY, before advancing timers; read later it is true whatever the product did): a bubble listener on the embed container that arms one timer per click, 150 ms for a click with coordinates ("on text") and 10 ms otherwise, skips a default-prevented click, focuses the preview, pushes its scope and switches it into an editor unless the focus is on a button / input or the target is inside a button, input or `.interactive-child`; Obsidian's delays are LITERALS 10 / 150, never `HOVER_HELPER_DELAYS_MS`; to model a press that moves the focus before the helper's timer, `blur()` the active element at 5 ms, a title CLICK at 5 ms would be a queued press and is the documented residual). 13 SC-598 tests (r4: unchanged count, the `.is-editing` one rewritten): 10 in `managedModal.test.ts` (title click at 20 and 100 ms, no editor after a focus move at 5 ms, scope order at 20 / 200 ms and after close, exactly two clicks reach the preview with the synthetic one's target, bubbling, cancelable, view and `interactive-child`, an `.is-editing` preview gets one click, default-prevented (read at once), no class, and the helper pushes nothing and does not switch to an editor after a focus move at 5 ms, a control outside a preview, a delayed open, the class removal at 10 ms and not before, with and without a pre-existing class) and 3 in `stamina-bar.test.ts` (a click on `.dse-stamina__ccur` with coordinates, then title and Apply input at 20 ms and the editor guard). The 6 SC-597 tests that assert "one click reaches the preview" now assert one click with the opener as target AND one synthetic click with the anchor as target. 21 SC-598 mutants (N1-N17 with a/b/c variants: base, no preventDefault, not bubbling, dispatched on the opener, no class, class removal armed first, `focusHoverPreviewNow` after `arm()`, the `.is-editing` branch without its preventDefault, without the branch, with the synthetic click too, class never removed, coordinates copied, `[10]` only, dispatch in the non-click branch, removal at 0 / 50 ms, always-add, not cancelable, no view) and the 23 SC-597 mutants are killed in jest (`sc598-r2-mutants.log`, `sc598-r4-mutants.log`); N7 (preventDefault above the preview guard) is equivalent since r4, because `keepHoverPreviewAlive` is not reached for an anchor outside a preview and the `.is-editing` branch default-prevents anyway. Runner shape: `sc598-r4-mutate.py.txt`.
- **G-S83 authoring footguns (measured).** (1) The pencil is in the chrome panel above the card and click-through until the card is `:hover`ed: move onto the card's top edge directly under it, then straight up (a diagonal leaves the card's box and the panel hides again); a click on the empty spot lands on the preview body, which turns the preview into a source editor. (2) A real hover finds the popover instance at `view.previewMode.hoverPopover` (Reading view) or `view.hoverPopover` (Live Preview); cleanup hides both. To prove which listener hid a preview, override `hide` on that popover instance and push `new Error().stack`; in 1.15.1 the click-to-edit bubble listener is `app.js:509:193553` (`registerDomEvent(containerEl.win, 'click', m => { m.defaultPrevented || h.contains(m.targetNode) || d.hide() })`), the re-entrant unload hide `509:193699` (SC-601). (3) A card taller than the preview (the tracker) is aimed at its visible top. (4) `authoringControls` must be on. (5) Every non-cancelled click in a preview runs Obsidian's `p()`, which leaks a window click listener and a keymap scope. (6) Do not set a long `TMPDIR`: Obsidian exits at start-up; use `DSE_CAMERA_TMP`. (7) A keyboard opener on a non-`<button>` element (Enter / Space on the stamina bar, Enter / Space on a montage board cell) activates with `el.click()` on the element the mouse clicks, never by calling the opener directly (SC-597): Obsidian marks a preview focused, and so stops its hover timer closing it, only when a `click` goes through the preview, so a direct call closed the preview, and the modal with it, about 300 ms after the key (the popover's `hide()` came from the hover timer, `setTimeout(() => shouldShow() ? transition() : hide(), waitTime)`, with no event). A new opener of this kind needs the same `el.click()` and a jest test like the SC-597 suites (`stamina-bar.test.ts`, `montage.test.ts`: one click reaches the popover's container with the opener as target, the modal is open synchronously, the modal's scope is above the popover's 20 ms after the key, and Escape then closes only the modal). A real `<button>` needs nothing: Enter / Space send it a native click. G-S87 drives the keyboard path with a real Ctrl-hover and CDP keys (below). (8) A modal opened by a real press ON a text node inside its opener (the stamina bar's "15") makes the popover's helper wait 150 ms, not 10, before it pushes its scope: G-S83's `stamtext` trial presses there, asserts `elementFromPoint` at the press point is the number's own element (not an ancestor; the outcome line records it: `"15" on dse-stamina__ccur`), waits 450 ms and sends Escape. (8b) In the Conditions modal, "Add condition" swaps in a combobox: the first Escape backs out of it (SC-431), the second closes the modal. (9) Red on a base without a second checkout: `git archive <base> | tar -x -C <scratch>`, symlink `node_modules`, `node esbuild.config.mjs production` there, then `DSE_LIFECYCLE_BUNDLE=<scratch> node visual-harness/obsidian-lifecycle.mjs --only=G-S83` from the worktree (new harness, old bundle). (10) Any FAIL screenshot or `t.shot` keeps the run's temp vault dir (a probe that takes screenshots should write them elsewhere, e.g. via its own env var, SC-601). Lifecycle's kept FAIL temp dirs are `/tmp/dse-obsidian-lifecycle-<random>`: delete only the literal path the run printed, never a glob. (11) (SC-597, measured) A CDP `Input.dispatchKeyEvent` `keyDown` with no `text` does NOT activate a real `<button>` (no keypress is generated, so no native click): a trial whose opener is a real button must send `text: '\r'` (Enter) with the `keyDown`. It is harmless for the `div` openers with a keydown handler (G-S87's stamina bar and montage cell). A keyboard probe whose "form never opened" on a real button is this, not the product. The opener is focused with a script `.focus()` (inert for hit-testing, measured in SC-595 r1), the pointer rests on the card inside the preview before the key is sent, and the assertions run at 1.5 s, past the hover timer's ~300 ms hide. (12) (SC-598, measured) A trial that needs the second press to land inside the helper's 150 ms must send it as soon as its point is known (no sleep): fetch the title / input point right after the opening release, `mouseMoved`, press: the in-page gap came out 50-93 ms. A queued double-click (`mousePressed` clickCount 2 sent 10 ms after the first release without awaiting it) has a gap of 99-133 ms and is red on the base at ANY gap (its second mousedown, detail 2, clears the helper's timer, so the preview is never focused), so the gap gate applies to title / apply / reopen only. A real double-click's second press hits `.modal-bg`, not the modal. The G-S91 `reopen` trial asserts `.is-editing` on the preview after the first Escape (a re-open test must start from a focused preview). The gap before the second press is mostly the renderer still busy opening the modal (it grows with host load: 35-70 ms idle, 100-135 ms at loadavg 6-14), and the validity gate must not count it: `gapEnd` is measured from the END of the opening click's dispatch (a window-bubble `click` listener; on the base the helper arms its 150 ms timer for that click just before, on the head the 10 ms timer is armed just after), and the trial proves something only when `gapEnd < 140`. Script-side lead stays short (one evaluation, an awaited `mouseMoved`, the press), but the RELEASE is sent after an in-page 11 ms timer (`await t.ev('new Promise(r => setTimeout(() => r(true), 11))')` between `mousePressed` and `mouseReleased`): input sent while the renderer is busy is handled before the helper's due 10 ms timer, which is the documented residual (a zero-length press went red in 16 of 20 trials with the title point cached, and in 2 of 17 plain runs), and a DOM timer armed after the press has run after the helper's, which was armed first. Do not take that wait out. Do not lengthen it: the hold is part of `gapEnd`, which must stay under 140 ms (at 4x CPU it already reaches about 120-175 ms, at 6x the title trials exhaust their re-runs); a longer hold only makes the trial inconclusive sooner, it never turns the base green (the gate catches a late release). The hold does nothing for `reopen` (the preview is already focused and gets no synthetic click, so there is no 10 ms timer; that trial tests the 150 ms editor switch). The `reopen` trial needs the first open to settle past the helper's 150 ms (450 ms) so the preview is `.is-editing` before the second open.
- **The compendium search is also guarded.** `CompendiumSearchModal` (an Obsidian `SuggestModal`, opened by the two editor commands `insert-compendium-reference` and `insert-compendium-block`) now installs the SC-595 document click guard when its target editor lives inside a `.hover-popover`. The guard is `guardHoverPreviewClicks(containerEl, owner)` in `src/framework/kit/hoverPreviewGuard.ts`, shared with `DseModal.keepHoverPreviewAlive` (same bubble phase, `composedPath().includes(containerEl)`, `stopPropagation`, never `preventDefault`, removed one task after the owner unloads; `owner` is DseModal's `lifecycle` or the search's `prefsOwner`). Unlike DseModal there is NO keymap re-push and NO `focusHoverPreviewNow`: the search is opened by a command or a key with the preview already focused, not by a click inside it (measured in 1.15.1: the window-capture `T3` never fires; the only `hide()` was the window-BUBBLE listener, `app.js:509:193553`).
- **Anchor.** The commands pass `editorCallback`'s second argument's `containerEl` as `opts.anchor` (`editorTarget()` in `compendiumInsert.ts`). Typed vs runtime: `containerEl` is typed on `MarkdownView` and only exists at runtime on the other `MarkdownFileInfo` (the page-preview embed, measured inside `.hover-popover`); no typed API gives an `Editor` its DOM, so `editor.cm.dom` (CodeMirror 6, undeclared) is the fallback anchor and the connection test.
- **Choose-time backstop.** The commands capture their `Editor` when they run; a pick after that editor went away used to write into the closed preview's detached buffer silently (no throw, no modify event, no Notice). Both choices (`dispatchReferenceChoice` for the reference and the Shift inline link, `dispatchBlockChoice` for the snapshot) now check that the captured editor's elements are still connected and otherwise show the Notice `The note you were editing was closed, so nothing was inserted.` and write nothing. Ctrl / Cmd (copy code) never touches the editor, so it is not gated. Never re-target `app.workspace.activeEditor` there: Obsidian's own Insert template does and lands the text in the HOST note (control, Live Preview host). (The block command also re-checks right before the write, see the r4 paragraph below.)
- **Host-wide, not ours:** Obsidian's Quick switcher, Command palette and Insert template close an editing preview too, and Insert template then loses its insert (nowhere with a Reading-view host, the host note with a Live Preview host). Not fixed here.
- **jest.** `test/dom/authoring/compendiumSearchHoverPreview.test.ts`, 33 tests (25 at r2; r4 adds: popout document, activeEditor write target (reference command), closed pane, CodeMirror element gone, block late re-check x2, `insertFullBlock` alone; r6 adds the activeEditor write target for the BLOCK command, which kills mutant R2c). The stand-in is a `window` BUBBLE click listener that removes the popover element unless the click is default-prevented or inside it (the closer the SC-601 reproduction found; `test/dom/_hoverPreviewStandIn.ts` models the capture-phase `T3` and the click-to-edit helper and is not needed here). Both commands are driven through their real `editorCallback` (the modal is captured by spying `CompendiumSearchModal.prototype.onOpen`, calling through): input, box and results-area press keep the preview; backdrop press (a `.modal-bg` that calls `close()` at target phase, as Obsidian's does) closes the search, the preview stays, and the closing click is stopped too; an editor outside a preview and a command with no context get no guard; the anchor can come from `editor.cm.dom`; a click outside the search still reaches the window; the click is stopped, not default-prevented; a document listener still sees it; a suggestion press still inserts and the preview stays; the guard is removed one task after close and not before (asserted on the guard function itself, because earlier tests' guards also leave during the task); the choose-time refusal for both commands (a Notice, nothing written, `activeEditor` not written), the block control, the Shift choice refused and Ctrl copy not, `dispatchBlockChoice` alone, the connection test through `editor.cm.dom`; (r4) the guard binds to the MODAL's document (a jsdom iframe as a popout window; `Modal.open` appends to `activeWindow.document.body` before `onOpen`, so the test redirects `document.body.appendChild` of the `.modal-container` into the iframe; this guards `DseModal` too, the helper is shared, and it was a gap since SC-595), a live different `activeEditor` never receives the pick, a closed PANE editor is refused, the container alive but the CodeMirror element gone is refused (`every`, not `some`), the preview closing inside `getEntity` or inside `entity.model()` (after the early check) writes nothing and shows one Notice, the early check refuses before any `getEntity` call, `insertFullBlock(..., () => false)` writes nothing and shows one Notice. The `DseModal` hover tests (`test/dom/kit/managedModal.test.ts` and the opener suites) pass unchanged: the refactor is behaviour-neutral.
- **Mutants** (`sc601-r4-mutants-summary.txt`; runner `sc601-r4-mutate.py.txt`; each run over the new file + `compendiumSearchModal.test.ts` + `managedModal.test.ts`, 202 tests; **23 of 23 killed; r6 splits R2 into R2b (reference command only) and R2c (block command only), both killed, files `sc601-r6-mutants-summary.txt` and `sc601-r6-mutate.py.txt`**): M1 no guard installed (12 failed), M2 `preventDefault` instead of `stopPropagation` (16: 10 SC-601 + 6 SC-595), M3 guard removed synchronously at close (5), M4 connected check dropped (7), M5 re-target `activeEditor` when the editor is gone, both commands, check dropped (7), M6 commands do not pass the anchor (12), M7 guard installed unconditionally (4), M8 guard stops every click, no `composedPath` test (19), M9 Ctrl copy gated by the connected check too (1), M10 block early check dropped, `isOpen` unused (1), M11 reference check dropped (5), M12 connection test ignores `editor.cm.dom` (4), M13 refusal without the Notice (10), M14 `DseModal` no longer calls the shared helper (6, all SC-595); r3's four survivors, now killed by one test each: R2 write target re-taken from `activeEditor` with the checks kept (1), R4a `some()` instead of `every()` (1), R4c connected check only for a preview editor, so a closed pane writes (1), R5 guard bound to the global `document` (1: the popout test); and the late re-check: L1 dropped (3), L2 `isOpen` not passed to `insertFullBlock` (2), L3 early check dropped, only the late one left (1: the early check must refuse before any `getEntity` call), L4 late check without the Notice (3), L5 late check refuses but still writes (3). Not mutated (as in SC-595): removal by `queueMicrotask` (invisible to jsdom; G-S97 trial 3 and G-S83's Cancel / Confirm catch it, r3 confirmed in real bundles for that and for synchronous removal).
- **Choose-time backstop, updated (r4).** `insertFullBlock(editor, entity, isOpen = () => true)` re-checks `isOpen` right before `replaceSelection` (after `entity.model()` / `entity.body()`, which can be a real vault read), and `dispatchBlockChoice` passes it on and keeps the early check; the user sees exactly one Notice either way. The earlier "residual" in this section is closed. Reference and Shift inline link have no await between the check and the write.
- **G-S97 (SC-601) fixtures and authoring.** two compendium notes under `Compendium/gs97/` built from the jest goblin statblock fixture (`test/fixtures/md-dse/monster/goblin/statblock/goblin-stinker.md`, renamed), so BOTH commands can resolve the entry (a front-matter-only note works for the reference command but the snapshot command needs a real `ds-sb` block). The reference marker on disk is `gsprobe-`, the snapshot marker is `Gsprobe `. open the search with `executeCommandById` while the focus is in the preview's editor (that is what a hotkey runs; `editorCallback`'s second argument is then the embed). Press at 900 ms is enough: on the base the popover was removed 0-41 ms after the press. A hover trial's preview needs a real press ON its text to become a source editor (150 ms helper timer), then 500 ms. A palette opener must NOT press in the palette's own input: Obsidian's native palette closes an editing preview (host-wide, not ours; ruled out of scope). The scratch vault has `livePreview: false`, so the editing preview is a source editor without a card. `.notice-container` is hidden for the run (the "Update Available" Notice covers the right sidebar).

### Capture-clip gate (SC-349)

The sweep's browser context is 900×1200 CSS px, and every screen-media capture runs under Obsidian's pinned app.css (`html, body { height: 100% }` + `body { overflow: clip }`), so the document is exactly one viewport tall. Before SC-349 Chromium painted anything below the viewport's bottom edge as blank white, while the PNG still came out at the element's full height. That is how the skills-family, statblock, montage and negotiation prints were frozen with blank lower halves. Since SC-349, `snap()` grows the viewport for any capture whose bottom edge (in page coordinates: an interaction click can scroll the page) is below it, and restores it afterwards. A capture that already fits is shot byte for byte as before. The arithmetic is in `visual-harness/capture-viewport.mjs` (jest `test/unit/build/captureViewport.test.ts`), and a shot-time rect check that is independent of the growth measurement runs on every capture. Success line: `capture clip OK (147 screen-media capture(s) whose element reached below the viewport were shot with it grown … 41 print-media capture(s) … NOT covered — named exemption(s): gallery--steel-dark.png (…SC-484); gallery--steel-light.png (…))` (counts as of `69b5c0d4`). A failure is `CAPTURE CLIPPED — N problem(s): part of a capture's element was outside …` and fails the run. The gallery shots are the one named exemption: they show only the first element (SC-484). Print-media (`--steel-realprint`) captures are immune, because the sheet's `@media print` block frees the body.

### Montage board-scroll gate (SC-326, SC-490)

`montage board scroll OK (14 rounds x 900px pane …)` proves, for BOTH a fine and a real `pointer: coarse` context, in BOTH dark and light theme (four contexts since SC-490: the pinned fills are per-theme literals, and a translucent light fill is a `PINNED CELL NOT OPAQUE` failure that a dark-only gate would miss), that: the board is a horizontal scroll container and a real wheel reaches its far end; the hero column (the corner + one name cell per hero = 6 cells) is `position: sticky`, has an OPAQUE background colour and an edge rule, sits within 0.5px of the frame's inner left edge at rest, mid-scroll and full scroll, and its centre hit-tests to itself while round cells really lie under it; every non-pinned cell can be scrolled fully inside the frame AND fully right of the pinned column (the gate scrolls by arithmetic, not by `scrollIntoView`, which knows nothing of the pinned column) and its centre hit-tests to itself; a real Tab walk AND a real Shift+Tab walk (85 stops each) leave every non-pinned stop fully visible, right of the pinned column and uncovered, and no stop in a pinned cell moves the board; a board that FITS (pane widened to 4000px) is not pinned (`data-overflow="off"`, `position` relative, translucent banding, no box-shadow) and narrowing the pane pins it again. Failure prefixes: `PINNED COLUMN MOVED`, `PINNED COLUMN NOT STICKY`, `PINNED CELL NOT OPAQUE`, `PINNED COLUMN HAS NO EDGE RULE`, `PINNED CELL COVERED`, `TAB FOCUS NOT FULLY VISIBLE — Shift+Tab: … lies under the … pinned hero column`. The gate adds about 13 s (14 s → 27 s standalone).

Can-fail proofs (SC-490): dropping `position: sticky; left: 0` from the pin rule gives `PINNED COLUMN NOT STICKY` and `PINNED COLUMN MOVED … -335.0px` on all 6 cells, both pointer contexts; the old `keepFocusedCellInView` (no pinned width) gives `TAB FOCUS NOT FULLY VISIBLE — Shift+Tab: …` (a forward Tab alone never fails it: it only enters a cell from the right, so the Shift+Tab walk is the one with teeth); the light name-cell fill back at `rgba(0,0,0,0.012)` gives `PINNED CELL NOT OPAQUE` in the light contexts only. The jest guard `CSS contract: each pinned-column fill literal stays inside its theme's --dse-card-bg gradient stops` goes red if `--dse-card-bg` is retuned without the fills.

Footguns (SC-490): the harness's `#mount` is capped at 760px (`visual-harness/vars.css`), so the "900px pane" is really 760px; a check that needs a wider pane must set `#mount`'s `max-width: none` as well as its width. A `position: sticky` cell that was already pinned when its row heights changed keeps painting its edges at the OLD sub-pixel offset in Chromium (a 1px hole under the row divider with 67.83px rows), so BoardView re-pins (attribute off, one forced layout, on) on every resize that leaves the board overflowing; `getBoundingClientRect` cannot see this (rects are identical), only pixels can (compare the pinned column's luminance with the pin on and with `data-overflow` removed). A fresh worktree's `node_modules` can be copied from the main checkout (`cp -a`, package-lock identical) instead of `npm ci`; then `npm run harness:build` and `npm run host-css` once before any harness probe.

## Modal checks inside the real-Obsidian camera (SC-334, 2026-09-23)

Every `MODAL_SHOTS` capture in `visual-harness/obsidian-camera.mjs` (step 3e — now six:
stamina, stamina-recovery, conditions, form, `modal-montage-edit`, `modal-montage-limits`)
also FAILS the capture on:

- `MODAL BODY SCROLLS SIDEWAYS` — `.dse-modal__body` `scrollWidth > clientWidth`, naming the
  offending elements and their px past the body's content edge (SC-334's clipped montage
  form: SC-202 GROUP 1's `box-sizing: content-box` had overridden a field's own
  `width: 100%; box-sizing: border-box`).
- `FOCUS RING CLIPPED BY THE MODAL BODY` — the auto-focused field's outline ring (width +
  offset) extends past the body's scroll box; the body's `padding: 4px; margin: -4px` is
  what gives it room. Skipped (printed, not failed) when the focused control draws no
  outline. **SC-338 (2026-09-24): `.dse-optchip` joined the shared kit ring, so
  `modal-montage-edit` no longer skips — its auto-focused Result chip now carries a real
  outline and the check runs for real, printing the ok line like every other MODAL_SHOTS
  capture.** The skip check itself is still generic (any focused control with no outline
  is skipped, not just this one) and stays in the code for the next control that ships
  without a ring. **Correction (SC-338 r1 review, LOW-2): the focused Success chip on
  `modal-montage-edit` sits 46.0px / 62.8px inside the body's scroll-box edges — real
  geometric slack, not a close fit against the 4px padding.** The check is proven live
  (`outline-offset: 50px !important` on the chip → `FAIL … cut off on top 6.0px`; 40px
  still passes), so it is not a no-op, but `modal-montage-edit` does not exercise the
  padding margin — that is `modal-montage-limits`'s job (padding zeroed →
  `FAIL … input.dse-mt__sheet-input … cut off on top 4.0px, right 4.0px`; restored → ok).

The ok line reads `modal confirmed; no sideways scroll; focus ring inside the body (…)`.
Run the camera on a PRIVATE Xvfb (`DSE_CAMERA_DISPLAY`) and a PRIVATE scratch root
(`DSE_CAMERA_TMP=<path under your own scratch>`), never Scott's `:1`. The default scratch root, and so the
camera's user-data-dir, is ONE machine-wide path shared by every camera, docs-shots and sc184 run (SC-554):
two runs on it write the same `DevToolsActivePort` and seed over each other's `obsidian.json`, so without a
private `DSE_CAMERA_TMP` concurrent camera runs are not isolated (since SC-551 the second one exits 2 instead
of driving the first one's Obsidian, but it still does not run). No port setup is needed (SC-551): the camera
starts Obsidian with `--remote-debugging-port=0` and talks CDP only to a port whose LISTEN socket belongs to
OUR Obsidian's pid and whose browser id matches `DevToolsActivePort` and `/json/version`
(`scripts/cdp-owned.mjs`). `DSE_CAMERA_PORT=<n>` still pins a port: it must be free and our Obsidian must
report it, else exit 2 "OBSIDIAN-CAMERA environment: … another instance owns it"; pin ports below 32768.
`obsidian-camera.mjs` and `docs-shots.mjs` return 2 for environment problems (port in use, no report,
ownership mismatch, our Obsidian exiting before CDP is up); a docs-shots run whose only failure is the
camera's exit 2 exits 2. Battery at SC-334 landing (dse `e4bcd0f`): jest 3919 passed / 1 skipped /
202 of 203 suites; shots 524, 0 FAIL; freeze 260/260; parity 0 / 0 / 16 DECLARED.

**Battery at SC-338** (dse `afd6ae3`, base `origin/develop` `825ea51` — rebased 2026-09-27
from `6c4f6aa`; no code change, comment-only re-point of the two `~:NNNNN` pointers that
moved with the rebase): tsc/lint clean; jest 4112 passed / 1 skipped / 4113 total / 211 of
212 suites (base grew from unrelated landings since `6c4f6aa`; SC-338 itself adds no new
`test()` blocks); obsidian-lifecycle `19/19 ok, 0 failed`; shots 532 PNGs, 0 FAIL,
host-copy pin OK, button host-leak `114 button kinds × 3 states × dark/light = 684
comparisons` (unchanged — still drift from before SC-338, not caused by it); freeze
`260/260`, exit 0 (the baseline itself moved under others' sanctioned landings between
rounds; SC-338 moves 0 of it); parity `0 gap(s), 0 undeclared, 16 declared`, exit 0;
real-Obsidian camera: `modal-montage-edit` ring-checked ok, `modal-montage-limits` ok. The
focused-chip crop is byte-identical (md5) to the one captured at the first landing — the
rebase moved zero chip pixels.

## Freeze semantics

`check-freeze.sh` (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh`)
compares real bytes because `visual-harness/shots/` is gitignored — a `git status` check on
that directory is vacuous. It runs `sha256sum -c` against
`.superpowers/sdd/freeze-baseline.sha256`, a flat list of **66** `<hash>  <filename>` lines —
**`*--steel-print.png` only**, one per browser capture id.

**Only print is frozen (SC-144, 2026-08-11).** The baseline used to be three classes
(`*--legacy-{dark,light}.png` + `*--steel-print.png`) and two thirds of it existed to hold
the legacy theme still. That theme is gone; those 134 lines were retired. What the gate is
now, and is not:

- **What it still catches:** `steel-print` renders the SAME DOM as the screen combos (print
  is a CSS attribute layered over whatever DOM the render produced — it cannot be branched
  around). So every theme-agnostic DOM or content regression still trips it — the class the
  SC-121 treasure fix tripped — just at one capture class instead of three. It also catches
  the specific accident worth a byte gate: a structure-tier Steel rule leaking into print.
- **What was genuinely lost:** byte coverage of *screen-only, base-layer* CSS regressions.
  Nothing pins steel-dark/steel-light bytes today.
- **Why Steel is deliberately NOT frozen:** Steel is under active design (SC-120's remaining
  family compositions, SC-117's token work). A frozen Steel would go red on every *intended*
  change and demand a sanctioned rebaseline each time — precisely the "a gate that always
  reads red trains people to skim it" failure the SC-117 M3 fix was written to eliminate.
  Revisit once 7.0.0 ships. `steel-print` is the right survivor because print is stable and
  is never itself the target of design work, so it goes red only when something leaked.

**The baseline covers the BROWSER camera only.** Obsidian-camera output
(`*--obsidian-*.png`, incl. the modal/settings/canvas/sidebar specials) is deliberately not
pinned: those shots come from a real, self-updating Obsidian against a live display and are
not byte-reproducible, so freezing them would produce noise, not a gate. Their regression
protection is the camera's own in-run ASSERTIONS (e.g. the canvas capture fails loudly if any
element root is missing `data-dse-readonly`; the by-SCC capture fails if the nested card
didn't mount) plus human review of the PNGs.

- **The `<shots-dir>` argument is mandatory** — the script's built-in default path points at
  a worktree that no longer exists.
- **`sha256sum -c` only validates the filenames literally listed in the baseline file.** A
  shot present in the directory but absent from the baseline is invisible to the check — not
  flagged, not reported. New fixtures produce new files that don't trip the freeze check by
  construction (they don't collide with an existing frozen name).
- **A reported mismatch means an existing frozen shot changed bytes** — almost always because
  a new/edited Steel CSS rule leaked into the print scheme. Fix it by narrowing the rule's
  selector scope (see "Steel scoping rule" below). **Never edit the baseline to accept the
  new bytes** — that defeats the entire check.
- **Division of labor (standardized 2026-08-11 → 08-16; role mapping updated for v2,
  2026-08-27): worktree agents NEVER edit the shared baseline — only the dispatcher applies
  changes, at landing.** When a branch legitimately moves frozen bytes, the agent's
  deliverable is a ready-to-apply hash file at `.superpowers/sdd/<effort>/rebaseline.txt`
  (`<sha256>  <filename>` lines, verified deterministic across 2 runs) plus before/after
  crops for the sanction ask. The **ticket-owner** then puts the sanction ask on the ticket
  and (1) gets Scott's explicit sanction on the ticket (his "sanctioned" / "good to go" quote
  is the record); at landing the **dispatcher** (2) backs the baseline up to a dated
  `freeze-baseline.sha256.pre-<effort>-bak`, (3) applies the lines, (4) appends a dated
  entry to this file quoting the sanction. Widenings (additions-only) need no sanction —
  the dispatcher verifies additions-only by sorted-diff and applies at landing.
  - **2026-11-10, SC-558 (no coloured left stripes in DSE: error card and featureblock
    "Level N Advancement" framed all round, power-roll and montage tier rows, the action-type
    spine and the dead statblock role rule removed; Obsidian's violet blockquote edge removed
    from plugin quotes in print; worktree `sc558-left-stripes`): SANCTIONED 78-line rebaseline,
    280 -> 280.** 39 ids, each `--steel-print` + `--steel-realprint`. 35 are the printed
    action-spine ids: `statblock`, 23 statblock variants (`charbox-on`, `charbox-onword`,
    `charline-two`, `collapsed`, `columns-wide`, `companion-corpus`, `disttarget-ledger`,
    `disttarget-text`, `edit-btn`, `kwusage-grid`, `kwusage-ledger`, `kwusage-text`,
    `roleless-corpus`, `stats-gridc`, `stats-ledger`, `sticky`, `sticky-narrow`, `sticky-nometa`,
    `sticky-off`, `sticky-unscrolled`, `villain-banded`, `villain-corpus`, `with-captain`),
    `featureblock`, `featureblock-advancement` (also loses its grey rail and indent),
    `featureblock-stats`, `featureblock-stats-ledger`, `kit`, `kit-collapsed`,
    `chrome-collapsed-rollout`, `chrome-collapsed-trio`, `chrome-hover-card`,
    `chrome-hover-statblock`, `chrome-placement-trio`. 4 carry a plugin blockquote and lose
    Obsidian's 2px violet `border-inline-start`: `class`, `perk`, `perk-headings`, `perk-narrow`.
    Hashes computed on dse `develop` @ `6270e84a` + the branch, identical across two clean
    `npm run shots` runs. **Scott's sanction, SC-558 comment 83ee1898 (2026-11-10): "5. new
    baselines are good"** (reply to ask fdf6ab10, item 2), and for the quote edge, item 7:
    "Obsidian's left border on quotes should be removed". Any branch that moves one of these
    ids recomputes its hashes on top of SC-558. Applied by the dispatcher at landing (dse `develop` `10db67e3`); backup `freeze-baseline.sha256.pre-sc558-bak`.
  - **2026-11-06, SC-349 (print shots taller than the 1200 px viewport are no longer clipped: the harness grows the viewport for the shot; worktree `sc349-skills-print-clip`, landed dse `develop` @ `69b5c0d4`): SANCTIONED 40-line rebaseline, 280 → 280.** All `<id>--steel-print.png`, no realprint line moves. Skills (8): skills, skills-narrow, skills-chips, skills-chips-narrow, skills-ledger, skills-ledger-narrow, skills-hero-picks, chrome-skills-menu. Statblock (17): statblock, statblock-charbox-on, statblock-charbox-onword, statblock-charline-two, statblock-collapsed, statblock-columns-wide, statblock-disttarget-ledger, statblock-disttarget-text, statblock-edit-btn, statblock-featstyle-flat, statblock-kwusage-grid, statblock-kwusage-ledger, statblock-kwusage-text, statblock-stats-gridc, statblock-stats-ledger, statblock-with-captain, chrome-hover-statblock. Montage (8): montage, montage-done, montage-failed, montage-guide-open, montage-mid, montage-narrow, montage-old-shape, montage-strip-pinned. Negotiation (2): negotiation-ended, negotiation-narrow. Other (5): ancestry, class, chrome-collapsed-rollout, chrome-collapsed-trio, chrome-placement-trio. This is a capture-artifact correction: the old bytes pinned blank rows. The moving set was the same 40 names with the same hashes on every base `0ce76dd` → `bc4a0c5` → `248e202b` → `7bd8040b`. 143 PNGs change bytes in all (every capture taller than 1200 CSS px, plus scroll-blanked tops), so any branch that moves one of them recomputes its hashes on top of SC-349. **Scott's sanction, SC-349 comment f5db4077 (2026-11-05T00:28Z): "sanctioned"**. It replies to ask `34b7ebbd`, where "sanctioned" covered all 40 lines and "skills only" covered 8. Applied by the dispatcher at landing: backup `freeze-baseline.sha256.pre-sc349-bak`, then 40 in-place replacements from `.superpowers/sdd/sc349-skills-print-clip/rebaseline-r5.txt` (identical to the sanctioned `rebaseline.txt` once sorted). The count is unchanged at 280. The dispatcher verified it against the landed head's shots: `freeze OK (280/280 …)`.
  - **2026-10-22, SC-279 (roll strip cleanup: one-line collapsed roll strip with labelled controls,
    the strip no longer prints; worktree `sc279-roll-ux`, landed dse `develop` @ `c0e761b`): SANCTIONED
    2-line rebaseline, 280 → 280.** `roll--steel-print.png` and `roll--steel-realprint.png` — the only
    frozen prints that move (the roll strip leaves print). Regenerated on the final base `e4c5cf6`;
    the owner's substitution check read `280/280 OK` with the two lines swapped into a copy.
    **Scott's sanction, SC-279 comment f4f19ba6 (2026-10-17T14:44Z): "approved"** — replying to the
    2026-10-16 consolidated ask whose item A1 was the 2-line print rebaseline. Applied by the
    dispatcher at landing: backup `freeze-baseline.sha256.pre-sc279-bak`, 2 in-place replacements from
    `.superpowers/sdd/sc279-roll-ux/sc279-rebaseline.txt`, count unchanged at 280.
  - **2026-10-21, SC-362 (the browser shots harness can render by-SCC display cards via a per-fixture
    compendium mode; worktree `sc362-harness-scc-cards`, landed dse `develop` @ `bc4a0c5`): 4-line
    WIDENING, additions-only, 276 → 280.** New capture ids `rule-by-scc` ("Combat" label,
    "Opportunity Attacks") and `condition-by-scc` (Bleeding), each print twin + realprint; 0 name
    collisions, 0 existing lines changed (sorted-diff checked by the dispatcher). Hashes stable
    across rebases `0ce76dd` → `08206e3` per the owner. Applied by the dispatcher at landing:
    backup `freeze-baseline.sha256.pre-sc362-bak`, 4 lines appended from
    `.superpowers/sdd/sc362-harness-scc-cards/sc362-widening.txt`. No sanction needed (widening);
    Scott was still asked on the ticket to confirm the two new cards look right.
  - **2026-10-18, SC-390 (beastheart companions become `type: statblock` in the data, so a
    `ds-scc` companion reference renders the statblock card; the card gains a Skills cell and
    omits the EV chip when `ev` is empty/whitespace/null; worktree `sc390-companion-ref`, landed
    dse `develop` @ `135716d`): SANCTIONED 2-line rebaseline + 2-line WIDENING, 274 → 276.**
    The rebaseline: `statblock-roleless-corpus` × steel-print twin + realprint — the only
    frozen prints that move, because that fixture's champion carries `ev: ""` and the empty
    "EV" chip under its role chip disappears (the keyword line tightens by a few px; nothing
    else moves; crops `sc390-r1b-ev-before.png` / `-after.png` in the ledger). Reproduced
    across 2 clean runs on three successive `develop` bases (a337460, 0ecb90e, be4f002) and
    by the independent reviewer; a detached `be4f002` run read `freeze OK (274/274)`. The
    widening: `statblock-companion-corpus` (the real Panther, print twin + realprint), 0
    collisions. **Scott's sanction, in-session 2026-10-18: "sanctioned. land it."** —
    replying to the SC-390 evidence comment whose ask was the 2-line sanction with the EV
    crops attached. Applied by the ticket-owner at landing on that instruction: backup
    `freeze-baseline.sha256.pre-sc390-bak`, 2 in-place replacements + 2 appended, 0 duplicate
    names (diff exactly 6 lines). Verified against the landed tree's shots:
    `freeze OK (276/276 …)`, exit 0. **Expected line now: `freeze OK (276/276 …)` on
    `origin/develop` `135716d`.**
  - **2026-10-09, SC-379 (negotiation tracker rebuilt in Steel — "A1 gauges, buttons in the
    tab": Patience on a horizontal rail and Interest on a vertical rail of the same numbered
    seals via the new kit `track()` part, appeal chips in the argument tab, "Mark spent" cards,
    the "Final offer" band; worktree `sc379-negotiation`, landed dse `develop` @ `e0ee273`):
    SANCTIONED 6-line rebaseline + 6-line WIDENING, 262 → 268.** The rebaseline: `negotiation`,
    `negotiation-checked`, `negotiation-pr-checked` × twin + realprint — the only element whose
    print moves (byte comparison of a clean `1ac4e5a` sweep vs the branch: exactly 6 moved;
    reproduced by the independent reviewer). The widening: `negotiation-appeal`,
    `negotiation-ended`, `negotiation-narrow` × twin + realprint, 0 collisions. **Scott's
    sanction, SC-379 comment `f997cf3b` 2026-10-09 12:46 UTC: "approved"** — replying to an ask
    whose two outcomes were approve (land + apply the lines) / decline; read as covering both
    the look and the lines, the SC-236/SC-255/SC-231 reading. Deliverables
    `.superpowers/sdd/sc379-negotiation/{rebaseline,widening}.txt` (identical across two clean
    runs). Applied by the SC-379 ticket-owner (no dispatcher session, on Scott's "land it"):
    backup `freeze-baseline.sha256.pre-sc379-bak`, 6 in place + 6 appended (diff exactly 18
    lines). Verified against the landed tree's shots: `freeze OK (268/268 …)`, exit 0.
    **Expected line now: `freeze OK (268/268 …)` on `origin/develop` `e0ee273`.** Note: the
    `negotiation-ended`/`-narrow` captures were cut by the harness's 1200 px viewport below the
    band. Fixed by SC-349 (2026-11-06): the viewport grows for the shot, and both lines were rebaselined (see the SC-349 entry above).
  - **2026-10-08, SC-127 (Print preview in a dark-theme vault draws its own light paper:
    a white page with black ink regardless of vault theme, plus a generated light-theme
    island of the Obsidian host tokens; worktree `sc127-print-preview`, landed dse `develop`
    @ `1ac4e5a`): SANCTIONED 131-line rebaseline, count unchanged 262 → 262 — every
    `*--steel-print.png` twin line moved once, 0 `*--steel-realprint.png` lines moved.**
    Cause: the twin is captured over the DARK vault scheme and now paints the paper; the
    realprint class already rendered under forced `theme-light`, and the paper is
    `@media screen` only, so paper bytes are untouched. **Scott's sanction, SC-127 comment
    `da76ab81` 2026-10-02 16:15 UTC, replying to the ask "Approve: re-pin all 131
    dark-theme print-preview shots … every one of the 131 real-print shots … is
    byte-identical": "approved".** Deliverable `.superpowers/sdd/sc127/sc127-rebaseline.txt`
    (131 lines, twin-only), regenerated from the rebased landing tree and deterministic
    across two clean sweeps; the independent reviewer reproduced the hashes. Applied by the
    dispatcher at landing: backup `freeze-baseline.sha256.pre-sc127-bak`, in place — 131
    lines changed, name set unchanged, 0 realprint lines changed. Verified against the
    landing tree's shots: `freeze OK (262/262 …)`, exit 0. **Expected line now:
    `freeze OK (262/262 …)` on `origin/develop` `1ac4e5a`.** Landing note: four capture
    ids on the tree are not yet in the baseline (`feature-ability-provenance`,
    `feature-trait-provenance`, `featureblock-narrow`, `statblock-narrow`); their twins move
    with SC-127, so any pending widening for them must use post-SC-127 hashes (listed in
    `.superpowers/sdd/sc127/sc127-r13-unbaselined-ids.sha256`), or freeze goes red on those
    four.
  - **2026-10-16, SC-377 (Initiative tweaks: resets in the chrome panel, round label +
    Advance round on the Heroes line, Malice-only bar, editable `name` title; worktree
    `sc377-initiative-tweaks`, landed dse `develop` @ `9ad919d`): SANCTIONED 38-line
    rebaseline + 6-line WIDENING, 268 → 274.** The 38: every `initiative*` id (19 ids ×
    twin + realprint). Cause: the Heroes `<h3>` is wrapped in a flex heading line that
    prints "Round N", the action bar is gone, the Malice bar re-flows, and the example
    fixture gained a name. **Scott's sanction, SC-377 comment `5bb62f58` 2026-10-09:
    "everything else is approved"** — replying to an ask whose third numbered item was
    the 38-line sanction with the print crops attached; read as the sanction, same as
    SC-236/SC-255/SC-231. The hashes were recomputed on the rebased landing tree
    (`e0ee273`, after SC-127's twin rebaseline): 19 twin hashes changed value for the same
    look, every realprint hash unchanged; reviewer reproduced across 2 clean runs, and a
    detached `e0ee273` run read `freeze OK (268/268)` (base clean). The widening's 3 ids:
    `initiative-named`, `initiative-named-narrow`, `chrome-initiative-menu` (0 collisions).
    Applied by the ticket-owner at landing (Scott: "land it"): backup
    `freeze-baseline.sha256.pre-sc377-bak`, 38 in-place replacements + 6 appended, 0
    duplicate names. Verified against the landed tree's shots: `freeze OK (274/274 …)`,
    exit 0. **Expected line now: `freeze OK (274/274 …)` on `origin/develop` `9ad919d`.**
    Known still-unfrozen ids (SC-381): `feature-ability-provenance`,
    `feature-trait-provenance`, `featureblock-narrow`, `statblock-narrow`.
  - **2026-09-29, SC-232 (Steel card-name type scale, option A: each family matches the site,
    27–41.4px, and heads ≤480px keep 20px; also fills the card-head slots the site fills: the
    ancestry/class/kit line, kind-noun eyebrow, Level chip, cost/"Signature", action type;
    worktree `sc232-cardname-scale`, landed dse `develop` @ `9ded832`): SANCTIONED 78-line
    rebaseline, count unchanged 262 → 262, across 39 capture ids.** Cause: the head-slot
    content renders in print, so every card family's print head moves. The ids: `feature*`
    (feature, -collapsed, -list, -spend), `featureblock*` (featureblock, -featstyle-flat, -stats,
    -stats-ledger), `kit`, `kit-collapsed`, the `chrome-*` hover/placement/rollout captures,
    and 24 `statblock*` ids. **Scott's sanction, SC-232 comment `bd88a398` 2026-09-29: "1. A /
    2. ok / 3. sanctioned".** Deliverable `.superpowers/sdd/sc232-cardname-scale/rebaseline.txt`
    (78 lines, with a per-line explanation in `rebaseline-map.md`). The hashes were byte-identical
    across two shots runs and reproduced by the independent reviewer. Applied by the dispatcher after
    landing: backup `freeze-baseline.sha256.pre-sc232-bak`, in-place (diff exactly 78 lines).
    Verified against the landed tree's shots: `freeze OK (262/262 …)`, exit 0. **Expected line
    now: `freeze OK (262/262 …)` on `origin/develop` `9ded832`.** Parity 14 → 24 declared.
  - **2026-09-28, SC-318 (heading sizes inside cards, option A: restores Obsidian's heading
    scale on screen; worktree `sc318-card-headings`, landed dse `develop` @ `dfb7395`):
    WIDENING, additions-only, 260 → 262.** New capture id `perk-headings` (an h1–h6 ladder
    plus a blockquote-h6 fixture), twin + realprint. The sorted diff shows 0 removed and 2 added, and
    neither name collides with an existing line. Scott also wrote it out, although a widening doesn't need
    sanction: SC-318 comment `8ee73a15` (2026-09-28 00:23 UTC) says "Option A is good.
    Sanctioned". The hashes held across two clean runs at the final tip and are identical to the
    pre-rebase round-2 hashes. Applied by the dispatcher after landing: backup
    `freeze-baseline.sha256.pre-sc318-bak`, appended the 2 lines. Verified against the
    landed tree's shots: `freeze OK (262/262 …)`, exit 0. **Expected line now:
    `freeze OK (262/262 …)` on `origin/develop` `dfb7395`.**
  - **2026-09-27, SC-284 (card header narrow/sidebar form: `.dse-head` becomes a size
    container, and at ≤480px the right-hand items stack under the name; worktree
    `sc284-cardhead-narrow`, landed dse `develop` @ `825ea51`): SANCTIONED 6-line rebaseline,
    count unchanged 260 → 260.** Cause: three frozen print captures are taken at 300px, so their
    headers now stack: `encounter-narrow`, `montage-narrow`, `statblock-sticky-narrow` (twin +
    realprint each). **Scott's sanction, SC-284 comment `4bf8299f` 2026-09-25 18:30 UTC:
    "1. thats fine 2. sanctioned".** Deliverable `.superpowers/sdd/sc284-cardhead-narrow/
    rebaseline.txt` (6 lines). It was recomputed after rebasing over SC-236/255/231, and the
    hashes are identical to the sanctioned set. Applied by the dispatcher after landing: backup
    `freeze-baseline.sha256.pre-sc284-bak`, in-place (the diff is exactly 6 lines). Verified
    against the landed tree's shots: `freeze OK (260/260 …)`, exit 0. **Expected line now:
    `freeze OK (260/260 …)` on `origin/develop` `825ea51`.** Note: SC-232 (parked) also
    declares `container-name: dse-head` and drops its duplicate when it lands.
  - **2026-09-27, SC-231 (one chip per keyword in the Steel feature/statblock keyword cells;
    worktree `sc231-keyword-chips`, landed dse `develop` @ `272c444`): SANCTIONED 55-line
    rebaseline, count unchanged 260 → 260, across 28 capture ids.** The ids: `feature`,
    `feature-collapsed`, `feature-spend`, `feature-list`, `chrome-collapsed-rollout`,
    `chrome-collapsed-trio`, `chrome-placement-trio`, `chrome-hover-statblock`, and 20
    `statblock*` ids. **Cause (a new mechanism worth knowing):** splitting a rendered text
    run into more than one text node shifts Chromium's sub-pixel glyph anti-aliasing. The
    first letter after each ", " moves by a sub-pixel amount, about 33×22 px boxes with
    ~325 px changed, and the prints read identically. The reviewer swept five alternative
    split layouts; every text-splitting layout moves the same prints. 8 of the 55 (the SC-236
    feature fixtures) were recomputed after rebasing over SC-236 and show the same glyph
    shift only. **Sanction wording (recorded exactly):** the ask said a "sanctioned, looks
    good" reply covers both the look and the 55 lines. Scott replied (comment `fb3a9458`,
    2026-09-25 18:31 UTC) "this looks good." and moved the ticket to Ready for Agent. That is not the
    literal word. It was read as covering both, the same reading as SC-236 and SC-255. **Scott
    confirmed it on 2026-10-02 in the dispatcher session with "sanctioned".** Deliverable
    `.superpowers/sdd/sc231-keyword-chips/rebaseline.txt` (55 lines, 2 matching clean runs).
    Applied by the dispatcher after landing: backup `freeze-baseline.sha256.pre-sc231-bak`,
    in-place (diff exactly 55 lines). Verified against the landed tree's shots:
    `freeze OK (260/260 …)`, exit 0. **Expected line now: `freeze OK (260/260 …)` on
    `origin/develop` `272c444`.**
  - **2026-09-27, SC-255 (ds-skills drops its own whole-element "Skill List" collapse header;
    worktree `sc255-skills-collapse`, landed dse `develop` @ `b029baa`): SANCTIONED
    20-line rebaseline, count unchanged 260 → 260.** Cause: the header is removed from every
    Skills capture — 10 ids, twin + realprint each: `skills`, `skills-narrow`, `skills-chips`,
    `skills-chips-narrow`, `skills-chips-hidden`, `skills-ledger`, `skills-ledger-narrow`,
    `skills-ledger-hidden`, `skills-hero-picks`, `chrome-skills-menu`. **Sanction wording
    (recorded exactly):** the ask (`15a5f267`) said "Reply "sanctioned" to approve both, or
    tell me what to change". Both = the look and the 20 lines. Scott replied (comment
    `ec5cf1c9`, 2026-09-25 18:34 UTC) "this looks good." and moved the ticket to Ready for
    Agent. That is not the literal word. It was read as approval of both, because the ask gave
    only two outcomes and he requested no change. **Scott confirmed it on 2026-10-02 in the
    dispatcher session with "sanctioned".** Deliverable
    `.superpowers/sdd/sc255-skills-collapse/rebaseline.txt` (20 lines, recomputed after the
    rebase onto `ade5064`, byte-identical to the approved set, 2 matching runs). Applied by the
    dispatcher after landing: backup `freeze-baseline.sha256.pre-sc255-bak`, in-place (diff
    exactly 20 lines). Verified against the landed tree's shots: `freeze OK (260/260 …)`,
    exit 0. **Expected line now: `freeze OK (260/260 …)` on `origin/develop` `b029baa`.**
  - **2026-09-27, SC-236 (the ds-feature `example.yaml` drops its contradictory `ability_type:
    Villain Action 1` line, "option A"; worktree `sc236-feature-example`, landed dse `develop` @
    `ade5064`): SANCTIONED 8-line rebaseline, count unchanged 260 → 260.** Cause: removing
    the line removes the "VILLAIN ACTION 1" chip from the example card, moving
    `feature`, `feature-collapsed`, `feature-spend` and `chrome-collapsed-rollout` (twin +
    realprint each). **Sanction wording (recorded exactly):** the ask told Scott to pick
    option A or B, "and if A, reply 'sanctioned'" for the 8 lines. Scott replied on SC-236
    (comment `b4241ded`, 2026-09-25 18:41 UTC): "Option A is good." Then he moved the ticket
    to Ready for Agent. The ticket-owner read that as the sanction, because option A cannot
    land without these 8 lines. It posted that reading on the ticket, inviting objection
    before landing. The dispatcher applied it on that basis. **Scott confirmed it on 2026-10-02 in
    the dispatcher session with "sanctioned", so this is now a full sanction.** Deliverable
    `.superpowers/sdd/sc236-feature-example/rebaseline.txt` (8 lines, unchanged across the
    rebase). Applied by the dispatcher after landing: backup
    `freeze-baseline.sha256.pre-sc236-bak`, in-place replacement (the diff is exactly 8
    lines). Verified against the landed tree's shots: `freeze OK (260/260 …)`, exit 0.
    **Expected line now: `freeze OK (260/260 …)` on `origin/develop` `ade5064`.**
  - **2026-09-24, SC-328 (JSZip → fflate + 6.0.2 hotfix merged forward, worktree
    `sc328-fflate`, landed dse `develop` @ `c524fd2`): SANCTIONED 16-line rebaseline,
    count unchanged 260 → 260.** Cause: the 6.0.2 merge-forward brings three skills
    (Carpentry and Cooking under Crafting, Strategy under Lore), which moves the Skills print
    captures — 8 twin+realprint pairs: `skills`, `skills-narrow`, `skills-chips`,
    `skills-chips-narrow`, `skills-ledger`, `skills-ledger-narrow`, `skills-hero-picks`,
    `chrome-skills-menu`. Reviewer-verified: with only those three skills reverted, all 260
    matched byte-for-byte. **Scott's sanction, SC-328 comment `afd0e15a` 2026-09-24 11:44 UTC:
    "sanctioned".** Deliverable `.superpowers/sdd/sc328-fflate/rebaseline.txt` (16 lines,
    unchanged across the final develop merge). Applied by the dispatcher after landing:
    backup `freeze-baseline.sha256.pre-sc328-bak`, in-place hash replacement (original line
    order kept; the diff is exactly 16 lines). Verified against the landed tree's shots:
    `freeze OK (260/260 …)`, exit 0. **Expected line now: `freeze OK (260/260 …)` on
    `origin/develop` `c524fd2`.** Known blind spot filed as SC-349: the Skills captures stop
    at 2400 px, so the lower skill list isn't byte-covered.
  - **2026-09-14, SC-202 (Obsidian host CSS in the harness, worktree
    `sc202-visual-harness-obsidian`, landed dse `develop` @ `e12c6bd`): SANCTIONED
    full-set rebaseline 252 → 260 — every one of the 252 frozen lines moved once, plus the
    pending round-3 (6) and round-4 (2) widening lines re-issued.** Cause: `--steel-
    realprint` now renders under Obsidian's real print conditions (option C: pinned
    1.13.7 `app.css` on, `body.theme-light` forced, `.print` container — black on white,
    serif) and `--steel-print` (the in-app preview twin) renders under the real sheet;
    the SC-170 twin==realprint byte rule is replaced by `assertPrintTwinDelta` (same DOM,
    no horizontal/size drift, vertical drift < 24 px, only the measured reachable print
    properties `color`/`fontFamily`/`webkitPrintColorAdjust`/`backgroundImage` + the
    native-control widening may differ; self-test can-fails built in). **Scott's sanction,
    SC-202 comment 2026-09-14, replying to the ask "Sanctioned = the dispatcher applies the
    rebaseline at landing and lands the branch … 'sanctioned' is enough": "Lets land this
    thing".** Deliverable `sc202-r6c-rebaseline.txt` (252) + `sc202-r6c-r{3,4}widening-
    update.txt` (8), deterministic across three clean sweeps, independently re-verified by
    the round-6c reviewer twice. Applied by the SC-202 ticket-owner (no dispatcher session):
    backup `freeze-baseline.sha256.pre-sc202-bak`; verified after applying against the
    landed worktree tree: `freeze OK (260/260 frozen print PNGs byte-identical — steel-print
    twin + steel-realprint since SC-170)`, exit 0. **Expected line now: `freeze OK
    (260/260 …)` on `origin/develop` `e12c6bd`.** Note for every future rebaseline: print
    shots now depend on the pinned Obsidian sheet (`visual-harness/obsidian-app-css.pin.mjs`);
    bumping that pin is itself a sanctioned-rebaseline event.
  - **2026-09-06, RESTORE after the scratch-dir wipe: 224 → 252, regenerated (not a
    rebaseline, not a sanction event).** An SC-306 session ran
    `rm -rf workspace/.superpowers` at 12:45 ET, deleting `check-freeze.sh`,
    `freeze-baseline.sha256` and every dated backup (plus every effort ledger). No copy
    existed anywhere. The SC-202 owner regenerated both from a fresh clean clone of
    `origin/develop` @ `d8bda06` (SC-277): two clean `npm run shots` sweeps byte-identical
    (508 PNGs / 126 ids), full frozen class hashed = **252 lines** (126 ids × twin +
    realprint, twin==realprint for all, 0 exclusions). Cross-checked before writing: all
    252 pairs matched by hash the SC-202 r4 branch sweep that had produced
    `freeze OK (224/224)` against the lost file that morning. The 28-line growth is the
    additions-only widening for the 14 capture ids landed after SC-191 whose widenings
    were never applied (their names cannot be listed — the old file is gone). Script
    re-implemented to this file's contract (mandatory `<shots-dir>` arg; missing vs
    mismatch distinguished; exit 0 on 0 mismatches, 1 on any mismatch, 2 on usage) and
    proven four ways (clean clone 252/252; SC-202 worktree 252/252; 1 corrupted byte →
    `FREEZE VIOLATED (1 checksum mismatches, 0 missing)` exit 1; 1 deleted file → `251/252
    producible OK, 1 missing …` exit 0). Record: `.superpowers/sdd/RESTORE-2026-09-06.md`;
    backup `freeze-baseline.sha256.restored-2026-09-06-bak`. **Expected line now:
    `freeze OK (252/252 …)` on `origin/develop` `d8bda06`.** Pending additions-only
    widenings at their landings: SC-202 r3 (6 lines) + r4 (2 lines) → 260.
  - **2026-08-26, SC-185 round 3 (six approved categories): 94 lines rebaselined, count
    unchanged at 210 — APPLIED at landing.** Scott approved six of the eight font-scale
    categories (A roll surfaces, B statblock display values, D notice/badge chrome, F
    initiative cell readout, G stamina numeral derivation, H the snap/derive tail) and
    declined C (stamina-editor modal) and E (sticky mini-header + char box). **His sanction,
    SC-185 comment 2026-08-26, in direct reply to an ask that spelled out the cost — "The
    freeze baseline moves for the set you pick … This is a **sanctioned rebaseline**, so it
    needs your word":**

    > "approved"

    47 capture ids × 2 (steel-print twin + steel-realprint) = 94 lines. **Expected 49 pairs,
    actual 47** — `statblock-kwusage-{grid,ledger}` are moved independently by BOTH category B
    and category H, so the union of the per-category sets is 47, not the arithmetic sum. This
    is exactly why a combined rebaseline must be generated from the real bytes of the combined
    tree and never stitched from per-category files. Verified at apply time: the 94 failing
    filenames were **identical** to the rebaseline's filename set (no collateral movement); the
    baseline's filename set is unchanged before/after (hashes only, 0 added, 0 removed); and
    `check-freeze.sh` returned `freeze OK (210/210)` afterwards. Determinism: 5 clean sweeps,
    all byte-identical, plus one more after rebasing onto `origin/develop` (SC-197 + SC-126),
    which left all 94 hashes valid — both are shot-neutral. Backup:
    `freeze-baseline.sha256.pre-sc185r3-bak`.
- **RETIREMENT — the fourth baseline operation (2026-08-11, SC-144).** Distinct from a
  widening (new names, additions-only), a sanctioned rebaseline (an approved change moves an
  existing frozen shot's bytes) and a capture-artifact correction (the harness was pinning
  the wrong thing). A **retirement removes lines for a surface that no longer exists** — the
  shots are not wrong, they are no longer producible at all, so leaving them in would make
  the gate permanently report "missing" for a reason no future branch can ever fix.
  - **The sanction is Scott's ruling on SC-144**: *"The 'legacy' theme option is completely
    broken. I dont particularly feel like fixing it. Instead lets just drop support for
    it."* Dropping the theme is what makes the 134 legacy lines unproducible; retiring them
    is the mechanical consequence, not a separate visual decision.
  - **200 → 66, removals-only.** 67 `*--legacy-dark.png` + 67 `*--legacy-light.png` deleted;
    all 66 `*--steel-print.png` lines kept **byte-identical**. Proof recorded at the time:
    a sorted diff of old vs. new shows **134 `<` lines, 0 `>` lines** (nothing added,
    nothing changed), and `diff <(grep -- '--steel-print.png$' <old>) <new>` is empty. The
    66 hashes were then re-verified against a fresh `npm run shots` on the SC-144 branch →
    `freeze OK (66/66 …)`, exit 0.
  - Backup kept forever: `freeze-baseline.sha256.pre-sc144-bak`.
  - **A retirement is removals-only by definition.** If applying one would change or add a
    hash, something else is going on — stop and diagnose it as its own case.
- **Baseline corrections — the CAPTURE-ARTIFACT case (rare): the baseline pinned an artifact, not
  a look.** Distinct from a widening (new name, additions-only) and a sanctioned rebaseline
  (an approved DOM/CSS change legitimately moves a frozen shot) — here the *harness itself*
  was capturing the wrong thing, so the frozen bytes never represented the surface they claim
  to.
  - **2026-08-07, SC-117 fix wave M1.** `shoot.mjs`'s interaction-shot click
    (`page.locator(opts.click).click()`) left the pointer sitting on the clicked row, so
    every `negotiation-pr-checked--*` shot captured `:hover` (`--dse-hover`,
    `rgba(77,184,199,.1)`) painted OVER the row's resting fill instead of the resting fill
    itself — the three frozen lines were pinned to a hover wash, not to consumer #16's
    actual at-rest surface. Fix: `await page.mouse.move(0, 0)` right after the click, before
    the screenshot (one line, `visual-harness/shoot.mjs`). Verified live before re-pinning: a
    standalone probe (click via `page.locator(...).click()`, then `mouse.move(0,0)`, then
    read `getComputedStyle`) reports `hover: false`, `background-color: rgba(0,0,0,.18)`
    steel-dark / `rgba(0,0,0,.02)` steel-light — the surface `.dse-pr__row[aria-checked=true]`
    is actually supposed to paint. Baseline backed up to
    `freeze-baseline.sha256.pre-hoverfix-bak` before editing; only **2 of the 3** frozen lines
    actually changed bytes on regeneration — `negotiation-pr-checked--legacy-{dark,light}.png`
    changed, but `--steel-print.png` came back byte-**identical**, because `:hover` does not
    apply under Playwright's print-media emulation regardless of pointer position, so that one
    line was never actually contaminated. All three lines were nonetheless re-pinned to the
    freshly regenerated at-rest bytes (the unchanged one is a no-op write), count unchanged at
    119. This is a **capture-artifact correction, not a visual change** — no CSS moved, no
    surface got lighter or darker; the fix only stopped the camera from pinning its own
    pointer position into the golden.
- **Widening the baseline is additions-only**, and only when you deliberately want new shots
  pinned against future regression: append the new hash lines, never touch/reorder the
  existing ones, and bump the two literal count strings in `check-freeze.sh`'s comment +
  success echo to match. Full procedure:
  `.superpowers/sdd/sc108-fixture-coverage-design.md` §3.
  - **Post-SC-144 arithmetic: a widening is ONE line per new capture id, not three.** Every
    historical entry below reads "3 lines each (legacy-dark, legacy-light, steel-print)"
    because all three classes were frozen then. Only `*--steel-print.png` is now, so a new
    fixture contributes exactly one line — don't pattern-match the examples and go looking
    for two more hashes that no longer exist.

  **2026-08-23, SC-188 (flat feature style): 4-line sanctioned rebaseline, count
  unchanged at 210.** The plugin drew an act-colored spine bar in flat mode that the
  site never draws — a previous round (SC-101) had only squared the bar's corners, on an
  assumption its own code comment recorded as fact ("the site's flat mode uses a plain
  square border-left"), which turned out to be false. Setting the flat-mode bar to
  `display:none` legitimately moves exactly two twin+realprint pairs:
  `statblock-featstyle-flat--steel-{print,realprint}` and
  `featureblock-featstyle-flat--steel-{print,realprint}`. **Scott's sanction: "sc-188
  approved" (2026-08-23)**, on an ask that named the four files and showed before/after.
  Verified before applying: the agent stash-proved the "before" hashes byte-identical to
  the then-live baseline, hashes deterministic across two clean sweeps, twin==realprint
  within each pair. Backup: `freeze-baseline.sha256.pre-sc188-bak`. Post-apply against
  the branch's shots: `0 checksum mismatches` (14 "missing" are SC-183's newer tracker
  ids, not producible on that older base — expected, not a failure).

  Widenings so far:
  - **2026-08-23, SC-183 promotion round: 196 → 210.** Seven new capture ids × twin +
    realprint (14 lines), from the tracker overhaul's new fixtures: `initiative-roster`,
    `-roster-500`, `-roster-narrow`, `initiative-squads`, `-squads-500`,
    `initiative-portraits-off`, `initiative-mark-seal`. **Additions-only, so no sanction
    needed** — verified before applying that none of the 7 names already existed in the
    196-line baseline (scripted collision check, zero hits), hashes deterministic across
    two clean sweeps, twin==realprint per pair. Backup:
    `freeze-baseline.sha256.pre-sc183-bak`. Post-apply: `freeze OK (210/210)`, exit 0.
    Note the four losing `initiative-mark-*` candidates (sheathe/shutter/laurel) were
    deleted in the same round and were never in the baseline, so this is a pure addition,
    not a swap. **`check-freeze.sh` needs no edit for a widening** — its counts are
    computed (`${ok_count}/${total}`), not literals; the "66" in its header comment is
    stale historical prose, not a live count.
  - **2026-08-02, SC-108 / FOLLOWUPS #37: 98 → 101.** The `featureblock/advancement`
    fixture (3 lines: legacy-dark, legacy-light, steel-print).
  - **2026-08-04, SC-121 Batch 4: 101 → 107.** Two new browser fixtures, 3 lines each —
    `negotiation-checked` (the first fixture anywhere that renders a CHECKED checkbox;
    batch-1 review M-4) and `perk-narrow` (the first fixture at a NARROW/sidebar width,
    300px; batch-3 review L-5). Verified before and after: the pre-existing 101 lines are
    byte-identical and the run reported the SAME 5 known-mismatch names both times
    (96/101 → 102/107; the 5 treasure/gallery lines are a deliberate open item awaiting
    Scott's sanction, not a leak). Batch 4's modal/settings/canvas/sidebar coverage is
    Obsidian-camera and therefore out of the baseline by construction (see above).
  - **2026-08-07, SC-117 Batch 6: 107 → 113.** Two new browser fixtures, 3 lines each —
    `feature/spend` (the `--dse-surface-sunken` audit's D9: `.dse-section--spend` never
    rendered anywhere, so the class's own dashed-box styling was unverified — a named
    fixture variant gives one effect a `cost` starting "Spend") and
    `negotiation-pr-checked`, the harness's first INTERACTION_SHOTS entry (`shoot.mjs`
    performs one real click on the production affordance between mount-done and the
    screenshot, `entry.ts`'s new `INTERACTION_SHOTS` list, same "own id, own manifest
    array" convention as `NARROW_SHOTS`) — closes consumer #16:
    `.dse-pr__row[aria-checked='true']` was reachable only by user selection, which no
    static fixture could express. Verified before and after: `check-freeze.sh` reported
    a clean `107/107` before this widening (the SC-121 C-5 rebaseline already covers the
    5 treasure/gallery lines — no open mismatches on this branch) and `113/113` after,
    with the pre-existing 107 lines untouched. Deliberately landed BEFORE SC-117 B1 (the
    `--dse-surface-sunken` token flip): both new fixtures render surfaces gated by that
    token, and it's a Steel-scoped rule, so legacy/print must be unaffected by the flip —
    pinning them now makes any future leak into legacy/print loud instead of silent.
  - **2026-08-07, plan 25 / SC-102 S-5 (worktree `sc10x-structural`, Task 7): 113 → 119.**
    Two new browser fixtures, 3 lines each — `feature/villain`, the only REAL standalone
    villain action anywhere (the D9 `feature/example.yaml` is a *permanent* false villain:
    `ability_type: Villain Action 1` alongside `usage: Main action`, and usage correctly
    wins — FOLLOWUPS #53), and `statblock/villain-corpus`, villain actions in the shape
    `steel-etl` actually emits (`cost: "Villain Action N"` + `usage: "-"`, **no**
    `ability_type` — the shape the task-3 review found made the whole feature a no-op on
    real content). Verified: `diff <(head -113 …) …pre-plan25-bak` is empty — the
    pre-existing 113 lines are byte-untouched — and both fixtures' **legacy** twins were
    green *before* the widening (they were simply unlisted), so pinning them records a
    proven-clean state, not a leak. **What this widening does NOT do:** it pins the trio's
    own after-bytes only for *new names with no prior frozen state*. The 5 pre-existing
    `*--steel-print.png` lines the trio moves are a separate, Scott-sanctioned rebaseline
    (below) applied at landing — never bundled into a widening.
- **Sanctioned single-line rebaselines — the third case (rare; Scott-approved only).** A
  Steel-only DOM rebuild of a display family necessarily changes that family's frozen
  `*--steel-print.png` (print is a pure CSS attribute over whatever DOM the active theme
  built, so it renders the new Steel DOM — it cannot be branched around). When Scott has
  explicitly approved the after-shots for exactly that family, replace **only** that one
  `<hash>  <name>` line in `freeze-baseline.sha256` with the approved worktree shot's
  `sha256sum`, **at landing time, never mid-plan** — count unchanged, then re-run
  `check-freeze.sh` → `freeze OK (101/101 …)`. During execution the expected result is a
  sole mismatch on that file (e.g. `100/101`, only that name); any other mismatch is still
  a leak to fix. Each rebaseline needs its own dated sign-off recorded here:
  - **2026-09-04, SC-191 montage element overhaul (worktree `sc191-montage-overhaul`,
    landed dse `c2a5cec` to develop): SANCTIONED 2-line rebaseline (1 twin+realprint pair)
    + 14-line WIDENING (7 new capture ids × twin+realprint), 210 → 224 — APPLIED at
    landing by the dispatcher.** The redesigned `ds-montage` element (board grid, log/roll
    modal, collapsible strip + guide) necessarily moves `montage--steel-print.png` /
    `-realprint.png` for the same reason every prior entry in this section does — print
    renders whatever DOM the active theme built, and a Steel-only DOM rebuild cannot be
    branched around it. **Scott's sanction: "Approved, lets land it" (SC-191 comment,
    2026-09-04 13:55 UTC)**, against a self-contained ask carrying before/after crops (the
    print card gaining visible gold ▲/▼ tier-pip triangles; a limit-ended montage's header
    correctly reading "ROUND 1/2/3 DONE" instead of stale "IN PLAY"). Both fixes were the
    subject of a review-2 FIX-ROUND (fix round 4) before the ask went out — the pip fill and
    the round-header state bug were both caught and closed prior to landing, not shipped
    then patched. The widening's 7 new capture ids: `montage-strip-pinned`,
    `montage-guide-open`, `montage-mid`, `montage-old-shape`, `montage-failed`,
    `montage-narrow`, `montage-done` — the redesign's own new fixture coverage, additions-
    only (0 collisions with the pre-existing 210-line baseline, scripted check). Verified
    before applying: the rebaseline+widening files were both generated from the final,
    fully-reviewed tree (`c2a5cec`) and deterministic across the branch's own repeated
    shots runs; every pair twin==realprint. Verified after applying, from a fresh
    `npm run shots` regenerated on the landed worktree tip (`c2a5cec`, matching
    `origin/develop`): `freeze OK (224/224 …)`, exit 0. Backup:
    `freeze-baseline.sha256.pre-sc191-bak`.
  - **2026-08-29, SC-120 §D2 Steel compositions for the remaining display families
    (worktree `sc120-d2-steel-compositions`, landed dse to develop): SANCTIONED 24-line
    rebaseline (12 twin+realprint pairs), count unchanged at 210 — APPLIED at landing by
    the dispatcher.** The effort built Steel compositions for twelve display families
    across three batches — Batch C: ancestry, condition, perk (+ perk-narrow), rule;
    Batch A: class, career; Batch B: treasure, title, complication (+
    complication-edit-btn), culture — each necessarily moving that family's frozen
    `*--steel-print.png`/`*--steel-realprint.png` pair for the same reason every prior
    entry in this section does: print renders whatever DOM the active theme built, and a
    Steel-only DOM rebuild cannot be branched around it. **Scott's sanction, in two
    parts:** Batch C — SC-120 comment, 2026-08-29 01:16 UTC, replying to the Batch C
    sanction ask verbatim: *"Looks great, go for it."* Batches A and B — SC-120 comment,
    2026-08-29 11:20: *"All aproved."* Both asks named their families and carried
    before/after crops; every "before" hash in `rebaseline.txt` was cross-checked against
    the fix-round tables with zero novel values before the ask went out. Applied on the
    REBASED landing tree (the branch was rebased onto `origin/develop` `6035d12` after
    SC-190 landed in between; full battery re-run post-rebase: tsc/lint clean, jest
    3394+1sk/3395, shots 0 FAIL deterministic across 2 runs, parity 0/0/16). Verified
    before applying: the 24 mismatch names from a fresh `check-freeze.sh` run on the
    rebased tree matched `rebaseline.txt`'s filename set exactly (diff empty both ways);
    every hash byte-identical across the 2 shots runs. Backup:
    `freeze-baseline.sha256.pre-sc120-bak`. Verified after: `freeze OK (210/210 …)`,
    exit 0.
  - **2026-08-22, SC-152 sheet styling + characteristics unification (worktree
    `sc152-sheet-styling`, landed dse to develop): SANCTIONED 20-line rebaseline
    (10 twin+realprint pairs), count unchanged at 196 — APPLIED at landing by the
    orchestrator.** Sanction: **Scott on SC-152, 2026-08-22: "sc-152 looks great, kick
    it off"** — against the round-3 self-contained ask that enumerated exactly this
    set. The ask grew from round 2's "2 lines" to 20: SC-170's realprint class doubled
    every line, and round 3 (Scott's same-comment direction: "The characteristics here
    should probably be the same css and code that is used in the statblocks") moved 8
    more pairs. The 10 pairs by cause: `heroic-resource` + `surges` — the round-2
    dead-selector padding repair (base-tier, legitimately reaches print, exactly as
    hero-tokens' always has); `characteristics`, `hero`, `hero-narrow`, `hero-sparse`,
    `hero-collapsed`, `chrome-hover-hero`, `chrome-placement-trio`,
    `chrome-collapsed-trio` — the characteristics DOM unification (ds-char + the hero
    sheet's region render the statblock's `.dse-sb__chars` rail via the shared kit
    builder; the three chrome/collapsed names are SC-169 fixtures that render the hero
    — the plan-25 "sibling fixture name-collateral" case, and collapsed prints
    expanded). **No statblock pair moved** — the statblock's renderChars delegation to
    the kit was proven byte-identical, which was the unification's own correctness
    gate. Every pair twin==realprint; deterministic across repeated clean sweeps;
    hashes computed from the REBASED landing tree (post-SC-168 develop), re-verified
    unchanged after the fresh-eyes fix round (docs-image regen + comment fixes +
    screen-only overflow guard — none touch print). Backup:
    `freeze-baseline.sha256.pre-sc152-bak`. Deliverable preserved in
    `.superpowers/sdd/sc152/`. Verified after: `freeze OK (196/196 …)`, exit 0.
  - **2026-08-20, SC-154 tracker layout + SC-162 (worktree `sc154-tracker-layout`, landed
    dse to develop): SANCTIONED 8-line rebaseline (4 twin+realprint pairs) + 14-line
    WIDENING (7 new capture ids × twin+realprint), 182 → 196 — APPLIED at landing by the
    orchestrator.** Sanction: **Scott on SC-154, 2026-08-20: "Option 1, sanctioned"** —
    covering (a) the round-0→2 encounter/initiative spacing + portrait-fallback changes
    (the "encounter/initiative print pair still pending from round 2") and (b) the round-3
    command-bar layout he picked becoming the default. The ask named 2 pairs
    (`encounter`, `initiative`); the applied set is 4 pairs because SC-169 landed in
    between and froze two NEW encounter-rendering fixtures (`encounter-collapsed`,
    `chrome-collapsed-rollout`) at the pre-SC-154 bytes — the plan-25 "sibling branch's
    new fixture enlarges your rebaseline ask" case. Diagnosed, not assumed:
    `encounter-collapsed--steel-print` was byte-identical to `encounter--steel-print` in
    the OLD baseline and is byte-identical to it again in the new bytes (a collapsed
    element prints expanded — chrome is print-absent), so the extra pairs are the same
    sanctioned pixels under new names; `chrome-collapsed-rollout` is the rollout stack
    containing the encounter. Every pair twin==realprint (in-run print-twin parity 98/98);
    deterministic across 3 full sweeps incl. one from an rm-rf'd shots dir (which caught
    stale round-3 review shots masquerading as producible — wipe before trusting a name
    list). The widening's 7 ids: `encounter-narrow`, `initiative-narrow`,
    `initiative-no-images`, `initiative-no-images-narrow` (rounds 0-2 fixtures that were
    never widened), `initiative-controls` (the mid-fight bar), `initiative-controls-narrow`
    and `initiative-log-open` (the drawer open — the promotion round's two permanent
    regression shots). Backup: `freeze-baseline.sha256.pre-sc154-bak`. Deliverable files
    preserved in `.superpowers/sdd/sc154/`. Verified after: `freeze OK (196/196 …)`,
    exit 0.
  - **2026-08-03, SC-100** (plan 24 kit stat-tile rebuild): `kit--steel-print.png` only —
    Scott approved the round-3 after-shots; rebaseline applied at landing. Future Steel
    compositions for the remaining display families (SC-120) each need their own entry.
  - **2026-08-04, SC-121 (C-5)**: 5 lines — `treasure--legacy-{dark,light}.png`,
    `treasure--steel-print.png`, `gallery--legacy-{dark,light}.png`. A theme-agnostic
    CONTENT fix (treasure Project row rendered a raw markdown literal; `markdown: true`
    in treasureLayout) necessarily reaches Legacy/print. Scott approved explicitly
    ("oh that's fine. Fix it."); rebaseline applied at landing, count unchanged at 107.
  - **2026-08-12, SC-123 defaults flip (worktree `sc123-defaults`): 18 lines rebaselined,
    count unchanged at 67 — APPLIED at landing.** All 18 statblock-family
    `*--steel-print.png` lines (and ONLY those — the untouched 49 cross-checked) moved by
    ONE ruling: Scott flipped the two site-divergent defaults to site parity
    (`sbCharLine` 'one'→'two', `sbVillain` 'inline'→'banded') — **his sanction, SC-123
    comment 2026-08-12: "nobody has this code yet... Lets do the correct thing"**, given in
    direct response to the gate ask that named the frozen-shot cost. Independent re-review
    hash-verified all 18 after-hashes against its own regenerated shots and eyeballed crops
    (only the characteristics/villain reshapes). Backup:
    `freeze-baseline.sha256.pre-sc123-defaults-bak`. Verified after: 67 lines, 0 duplicate
    names.
  - **2026-08-11, SC-146 round 2 (worktree `sc146-round2`): 17 lines rebaselined + 1-line
    widening, 66 → 67 — APPLIED at landing.** The 17 rebaselined `*--steel-print.png` lines
    (statblock + its preference-variant fixtures) all trace to ONE Scott-requested change:
    the head-notch diamond's clearance above the primary stat row (Scott's SC-146 round-2
    bug #4), which shifts print content below the head down ~9 CSS px. Pixel forensics
    (independent re-review) confirmed a pure vertical translation + sub-pixel glyph
    re-hinting, nothing structural; every "before" hash verified against the pre-sanction
    baseline. **Scott's approval 2026-08-11, SC-146 comment "146 is good to go"** against
    the self-contained sanction ask (comment `1cf8beb7`) carrying the before/after crop
    (`r2-item3-notch-print.png`). The widening adds `statblock-with-captain--steel-print.png`
    (the new 4-secondary-cell fixture). Backup: `freeze-baseline.sha256.pre-sc146r2-bak`.
    Verified after: `freeze OK (67/67 steel-print PNGs byte-identical)`, exit 0.
  - **2026-08-18, SC-169 element chrome panel + collapse (worktree `sc169-menu-panel`, landed
    dse `062a109`): SANCTIONED 10-line rebaseline (5 stamina pairs) + 38-line WIDENING (19 new
    capture ids × twin+realprint), 144 → 182 — APPLIED at landing by the orchestrator.**
    Sanction: Scott on SC-169, 2026-08-18: **"Option D and E3. Sanctioned"** — the stamina
    bar's old "Stamina Bar" disclosure header removed in favour of the framework chrome
    panel; every `ds-stamina` fixture (`stamina-bar`, `-dying`, `-recoveries`, `-winded`,
    `stamina-rail`) moves as a twin+realprint pair (each pair identical, deterministic; before
    hashes matched the live baseline; crops on the ticket). Widening: 19 chrome/collapse
    capture ids (`chrome-*`, `*-collapsed`, `stamina-bar-collapse-default`,
    `stamina-bar-not-collapsible`) — none had ever been widened because the branch spanned 3
    rounds; each pair twin==realprint, 0 collisions. Verified in one pass: 10 swapped, 38
    added, 0 removed, 0 duplicate names, `freeze OK (182/182 …)`. Backup:
    `freeze-baseline.sha256.pre-sc169-bak`. Panel itself is print-absent by construction
    (both classes) — verified on a real Obsidian PDF export by two independent reviewers.
  - **2026-08-18, SC-156 hero example codes (worktree `sc147-inserts`, landed dse `3bc7685`
    with SC-147/148): 6-line SANCTIONED rebaseline, count unchanged 144 → 144 — APPLIED at
    landing by the orchestrator. FIRST rebaseline under the twin+realprint pair rule.** The
    ask on SC-156 was 3 twin lines (`hero`, `hero-narrow`, `hero-sparse` `--steel-print`);
    landing after SC-170 froze the realprint class, each twin's `--steel-realprint` sibling
    moved identically → 6 lines applied as 3 PAIRS. Verified before applying: each pair's
    twin hash == realprint hash on the rebased tree; deterministic across 2 runs; check-freeze
    reported exactly these 6 and nothing else. Visible change = two ability-row titles in the
    starter hero (placeholders → `brutal-slam`/`thunder-roar`); crop of the entire pixel delta
    on the ticket. **Scott's sanction, 2026-08-18: "sanctioned"** (after asking what the ask
    was — lesson recorded in orchestrate/linear-flow: lead with the one-line ask, mechanics
    below). Hashes regenerated from the REBASED landing tree (da96da2 base), NOT the branch's
    old `sc156-rebaseline.txt` (which predates SC-170's class and 6 landings). Backup:
    `freeze-baseline.sha256.pre-sc156-bak`. Verified after: `freeze OK (144/144 …)`, exit 0.
  - **2026-08-18, SC-170 real `@media print` (worktree `sc170-real-print`, landed dse
    `da96da2`): 72-line widening (additions-only), 72 → 144 — APPLIED at landing by the
    orchestrator. THIS ADDS A SECOND FROZEN CLASS.** The harness now captures every
    element under Playwright `emulateMedia({media:'print'})` as `<id>--steel-realprint.png`
    alongside the existing print-preview twin `<id>--steel-print.png`. **Invariant pinned:
    every realprint hash equals its twin's hash** (verified 72/72 at landing on the REBASED
    tree; deterministic across clean sweeps) — real Ctrl-P/PDF export must render exactly
    what the print-preview twin renders. `npm run shots` also asserts this in-run
    ("print-twin parity 72/72") and asserts print-class coverage (a capture with one class
    but not the other fails). Backup: `freeze-baseline.sha256.pre-sc170-widening-bak`;
    `check-freeze.sh` echo label updated (backup `.pre-sc170-bak`; arithmetic unchanged —
    it was always `sha256sum -c` over the whole file). Verified after: `freeze OK (144/144
    …)`, exit 0. **Consequence for future rebaselines: a sanctioned change to a print twin
    now moves TWO lines (twin + realprint), and they must move together — a delta touching
    only one of the pair is a bug (real print diverging from the preview), not a rebaseline.**
  - **2026-08-17, SC-160 statblock sticky mini-header (worktree `sc160-sticky-header`,
    landed dse `c676d58`): 5-line widening (additions-only), 67 → 72 — APPLIED at landing by
    the orchestrator.** The 5 lines are `statblock-sticky{,-unscrolled,-nometa,-off,-narrow}
    --steel-print.png` — new fixture NAMES only; the sticky is screen-only chrome (reveal rule
    under `@media screen` + `:not([data-dse-print="on"])`), so three of the five print twins
    are byte-identical to each other (bar inert in print) — expected. Hashes generated from
    the REBASED tip in the landing tree, not the agent's rebaseline file. Additions-only proof:
    sorted diff 0 `<` / 5 `>`; no duplicate names. Backup:
    `freeze-baseline.sha256.pre-sc160-widening-bak`. Verified after: `freeze OK (72/72
    steel-print PNGs byte-identical)`, exit 0. No sanction needed (no existing hash moved).
  - **2026-08-11, SC-145 edit-button placement (worktree `sc145-edit-button`): 12-line
    widening (additions-only), 188 → 200 — APPLIED at landing by the orchestrator.** The 12
    lines are the frozen-class twins of 4 new `*-edit-btn` authoring-controls fixtures (the
    setting's first shot coverage). Hashes pre-verified byte-identical by the independent
    review (`sc145-freeze-widening-12.txt`, preserved in the sc145 build-ledger dir).
    Backup: `freeze-baseline.sha256.pre-sc145-landing-bak`. Duplicate-name check clean (200
    unique).
  - **2026-08-10, SC-123 settings-parity ports (worktree `sc123-settings-ports`):
    39-line widening (additions-only), 149 → 188 — APPLIED at landing by the orchestrator.**
    No rebaselined lines. 36 lines are the frozen-class twins (`legacy-{dark,light}`,
    `steel-print`) of SC-123's 12 new preference-variant fixtures
    (`statblock-{kwusage-{text,grid,ledger},disttarget-{text,ledger},charline-two,charbox-{on,onword},villain-banded}`,
    `featureblock-{stats,stats-ledger,featstyle-flat}`) — hashes verified byte-identical to a
    fresh capture by the delta re-review, applied verbatim from the branch-prepared
    `sc123-freeze-widening-36.txt` (preserved in the sc123 build-ledger dir). 3 more lines fix
    a PRE-EXISTING gap: `hero-sparse--{legacy-dark,legacy-light,steel-print}` (SC-107's sparse
    fixture landed 2026-08-10 without its widening — same missed-widening class as SC-128's,
    caught by the SC-123 fix-round agent). Backup:
    `freeze-baseline.sha256.pre-sc123-landing-bak`. Duplicate-name check clean (188 unique).
  - **2026-08-10, SC-146 statblock settings fixes (worktree `sc146-statblock-settings`):
    12-line widening (additions-only), 137 → 149 — APPLIED pre-landing.** No rebaselined
    lines: orchestrator-verified additions-only (sorted-diff, 0 changed/0 removed). The 12
    new lines are the frozen-class twins (`legacy-{dark,light}`, `steel-print`) of four new
    harness fixture variants added for regression coverage of the SC-146 pref fixes:
    `statblock-{stats-ledger,stats-gridc,featstyle-flat,columns-wide}`. Widening-only, so
    no Scott sanction required (existing hashes untouched); delta re-review eyeballed the
    new frozen shots for theme correctness. Backup:
    `freeze-baseline.sha256.pre-sc146-fixround-bak`. Verified after:
    `freeze OK (149/149 legacy+print PNGs byte-identical)`, exit 0.
  - **2026-08-10, SC-132 stamina redesign (worktree `sc132-stamina`): 5 lines rebaselined
    + 18-line widening, 119 → 137 — APPLIED at landing.** The five rebaselined lines —
    `hero--legacy-{dark,light}`, `hero--steel-print`, `gallery--legacy-{dark,light}` — all
    trace to ONE theme-agnostic change: deleting the duplicative `.dse-hero__stamina-stepper`
    row (the redesign itself is base-hidden/Steel-revealed and moves zero frozen pixels;
    proven by two independent reviews, both of which reproduced the 5-line set and its
    hashes). **Scott's approval 2026-08-10**, SC-132 comment `b3b6806d` item 4 ("approved"),
    against the gate ask (comment `02903859`) carrying the five before/after crops with
    every "before" hash-verified against the baseline. The widening adds the frozen-class
    lines for six fixtures: SC-132's five new stamina fixtures (`hero-narrow`,
    `stamina-bar-{dying,recoveries,winded}`, `stamina-rail`) and `statblock-roleless-corpus`
    — an SC-128 fixture whose widening was missed at that landing, caught here. Backup:
    `freeze-baseline.sha256.pre-sc132-bak` (keep forever). Verified after:
    `freeze OK (137/137 legacy+print PNGs byte-identical)`, exit 0.
  - **2026-08-08, plan 25 (SC-101/SC-102/SC-103, worktree `sc10x-structural`): 5 lines,
    count unchanged at 119 — APPLIED at landing.** The trio's structure-tier CSS (the shared
    nested-card frame, the standalone action-spine removal, the villain action type, the
    head-band notch — all "print follows structure" per S-1(a)) necessarily reaches print.
    The five, all `*--steel-print.png`: `statblock`, `feature`, `featureblock`,
    `featureblock-advancement`, `feature-spend`.
    - **Scott's approval, 2026-08-08**, against the self-contained sanction ask on **SC-102**
      — comment `f8bbaadf` (the five before/after pairs, every "before" regenerated and
      hash-verified byte-identical to the baseline line it replaces) plus its follow-up
      `a9e0158d`, which answers Scott's question about the shots and enumerates exactly what
      approval covers: *"Approve = I rebaseline exactly those five hashes at landing (dated
      sign-off, established procedure)."* Nothing else in the baseline was touched. The
      dark-on-dark look of the `steel-print` captures is a longstanding **harness capture
      artifact** (print tokens over the DARK scheme), shared by both halves of every pair —
      a separate follow-up will re-capture print over the light scheme, which will be its
      own deliberate all-print-lines re-pin, not part of this sanction. **Superseded
      2026-09-23, SC-127:** it was a real product bug (the print preview in a dark vault),
      fixed by the preview drawing its own paper; the twin stays captured over the dark
      scheme as that bug's regression gate.
    - Applied procedure: `npm run shots` re-run at the exact landing commit (post-rebase onto
      the SC-117 fix wave), baseline backed up to
      `freeze-baseline.sha256.pre-plan25-landing-bak`, exactly those 5 `<hash>  <name>` lines
      replaced (`diff` against the backup shows 5 changed lines and no others, `wc -l` still
      119), then `check-freeze.sh` → `freeze OK (119/119 legacy+print PNGs byte-identical)`,
      exit 0.
    - The 5th (`feature-spend`) appeared only at Task 7: it is a **SC-117 Batch 6** fixture
      that did not exist on this branch until the rebase, and it is a `feature`-element card
      — so the Task 4 spine-removal rule
      (`[data-dse-theme='steel'][data-dse-element='feature'] .dse-feature[data-dse-act]::before`)
      reaches it for exactly the same reason it reaches `feature--steel-print`. Diagnosed,
      not assumed: its **legacy** twins stayed byte-identical (so no theme-agnostic DOM
      change touched it — the move is Steel-structure-only), and its pre-trio bytes were
      regenerated at `origin/main` and **hash-matched the frozen baseline line exactly**,
      giving a real before/after pair for the sanction ask.
    - **Lesson worth keeping:** a sibling branch's new fixture can silently enlarge *your*
      rebaseline ask. Re-run the freeze check **after** the rebase, never only before, and
      count the mismatch names rather than trusting the plan's predicted number.
    - **Consequence for other in-flight branches:** the baseline now carries the trio's
      *after* bytes for those five names. Any branch still based on pre-plan-25 `main` will
      report exactly those 5 as `FAILED` until it rebases. That is the rebaseline showing
      through, not a leak — rebase, then re-check.

**2026-08-07, SC-117 fix wave M3 — exit-code semantics fixed: MISSING and MISMATCH used to
be conflated.** `sha256sum -c` reports both a not-yet-producible file and a real byte
mismatch as a non-`: OK` line, and the old script's logic (`grep -v ': OK$'`, nonempty ->
`FREEZE VIOLATED`, exit 1) treated them identically — so any branch that doesn't (yet) carry
every fixture the shared baseline has grown to (the normal state whenever one worktree
widens the baseline before another lands, e.g. plan 25's unlanded 113 -> 119) could never
exit 0. A gate that always reads red trains people to skim it, which is exactly the failure
mode the freeze check exists to prevent. Fixed to distinguish the two: `: FAILED$` (checksum
mismatch — still `FREEZE VIOLATED`, still exit 1) from `: FAILED open or read$` (missing —
not producible on this branch, reported by count but not fatal), and exit 0 whenever
mismatches are zero, regardless of how many are missing. The two count literals in the
success message are now computed from the actual run (`ok_count`/`total`) instead of
hardcoded, so they no longer drift the next time the baseline widens. **New proof-of-life
result** (first time the fixed script can ever say this on a branch missing sibling
fixtures): `freeze OK (113/119 producible OK, 6 missing (not producible on this branch), 0
checksum mismatches)`, exit 0 — the 6 missing are plan 25's `feature-villain--*` /
`statblock-villain-corpus--*` trio (unlanded `sc10x-structural`), same 6 the old script
reported as `FREEZE VIOLATED` for no actionable reason. A real mismatch still prints and
still exits 1, unchanged. Script backed up to `check-freeze.sh.pre-distinguish-bak` before
editing (main-checkout scratch, `.superpowers/sdd/`).

## Parity semantics

**Site reference captures (Scott's rule, 2026-08-03): always capture BOTH color schemes.**
The site's top-right toggle switches light/dark, and **dark mode carries design features light
lacks** (e.g. gradient treatment on the kit-bonus tiles) — Scott finds dark the richer
reference and reviews against it. A light-only reference capture is an incomplete reference;
any ad-hoc Playwright capture of a site page for design-reference purposes must produce a
dark-mode shot (and ideally the light twin), matching how `parity:site` already captures both
schemes.

`npm run parity` diffs plugin-rendered CSS/DOM against the live v2 site on a fixed set of
mapped selectors. **The gate contract is a biconditional (SC-110):**

> **exit 0 ⟺ 0 GAPs AND 0 undeclared WARNs.**

Expected clean result today: **0 GAPs / 0 undeclared WARNs / 24 DECLARED rows / exit 0**
(14 → 24 when SC-232 landed on dse `9ded832`, 2026-09-29. It adds the card-name `ink` rows, which
are parked under SC-368, the name-colour gap. Earlier, 16 → 14 when SC-235 landed on `6dca388`,
2026-09-28. Section-title letter spacing then matched the site, so that declaration went. The
font-size and line-height rows were re-declared and now cite SC-235: the site fakes small caps,
so its computed px understate what you see.)

A `WARN` now means "the comparison did not happen" (a selector that never rendered, an
unparseable value) and **fails the run** — before SC-110 it was printed and ignored, so a
pair could go blind with the gate still green. The only escape is an explicit
`declaredDeferrals` entry in `visual-harness/parity/selector-map.json`
(`{ pair, rule, scheme?, why }`), which prints as `DECLARED` and must cite a Linear ticket
(or, for entries predating the 2026-08-27 FOLLOWUPS→Linear migration, a historical
`FOLLOWUPS #N`). `compare.cjs` refuses to run on a declaration that
names a missing pair, an unknown rule, a **non-declarable** rule, a rule the pair doesn't own,
or carries no citation; `diff.mjs` fails on a declaration that **matched nothing** (anti-rot).
Unit-tested, can-fail proof included, in `test/unit/parity/compare.test.ts`.

**Which classes are declarable.** Every rule has a property class, and the class decides
whether a divergence in it can ever be excused:

| Class | Rules | Declarable? |
|---|---|---|
| **material** | `bg`, `bg-polarity`, `bg-color`, `shadow`, `hairline-top`, `hairline-bottom` | **NEVER** — a hard contract error |
| geometry | `padding-*`, `margin-top`, `margin-bottom` | yes |
| typography | `font-size`, `line-height`, `body-font`, `letter-spacing` | yes |
| ink | `ink` | yes |
| capture | `capture-site`, `capture-plugin` (directional — one does not silence the other) | yes |

A flat surface, a missing bevel or a missing hairline is always closable in
`styles-source.css`, and a wholly flat Steel theme that passed human review is the exact
failure this gate was built to catch (plan 19) — so no material row may be declared away.
Geometry/typography/ink stay declarable because that is where genuine pixel decisions live.
(Conservative by design; relaxing it is a one-line change to `NON_DECLARABLE_CLASSES` in
`compare.cjs`.)

**`background-color` is fully compared (SC-126 steps 1 and 2).** The `bg`
rule fires only when the site's `background-image` is non-flat and the plugin's is flat — it
never reads `background-color` at all, which is the hole SC-117 slipped through (13
declaration sites washed the wrong **polarity**, both schemes, every pair clean throughout
because neither side's `background-image` was `none`). Two more rules close it: `bg-polarity`
(step 1) buckets each side's `background-color` into black/white/unclassified and fires on
opposite buckets; `bg-color` (step 2) compares the actual value on a ground-independent
premultiplied deposit+alpha model (`BG_ALPHA_TOL = 0.01`, `BG_DEPOSIT_TOL = 2`, either axis
fires), closing the live hole `bg-polarity` couldn't — a wash that vanishes entirely (alpha 0
sends `bg-polarity` silent too). Both stay `material` (never declarable). On the real
committed inventories `bg-color` fires **0 rows** — every mapped pair's `background-color` is
byte-identical site-vs-plugin, both schemes — so it landed as a pure tightening: no CSS
change, no declaration, no frozen bytes moved. Residual, deliberately out of scope for step
2: `background-image` gradient hue/tint is still unasserted (SC-322), and the `card` pair's
site selector has a capture-order hazard unrelated to this rule (SC-321). Full reasoning:
`visual-harness/parity/README.md` → "Known limitation — `background-color` is fully
compared; the residual is `background-image`."

The 8 declared entries (16 rows — each covers both schemes) are three findings:
- **FOLLOWUPS #39** (8 rows) — `statblock-wrap` / `featureblock-wrap` `margin-top`/`-bottom`:
  site 34px (`1.7rem` on `.sb-wrap`/`.fb-wrap`) vs plugin 8px (the unscoped base's `0.5em`
  on the host — reworded from "Legacy base" by SC-144, matching `selector-map.json` and
  `parity/README.md`; the finding itself is unchanged, that `0.5em` is a base rule and it
  survived the theme removal). A **pixel decision** for Scott, no longer an invisible one.
- **FOLLOWUPS #51** (6 rows) — `section-tag` `font-size`/`line-height`/`letter-spacing`:
  site 18px/30.6px/1.8px vs plugin 16px/27.2px/1.12px. One type-scale decision for Scott.
- **FOLLOWUPS #40** (2 rows) — `pr-chars:ink`: the plugin's single-node power-roll caption is
  deliberately heading-emphasised where the site splits `.pre`/`.chars`.

**FOLLOWUPS #52 HEALED and was deleted (2026-08-07, SC-117 rider R1) — 9/18 → 8/16.** Its
one-selector fix (the statblock host joined the Plan 21 `line-height: 1.7` group) landed, and
the next `npm run parity` **failed** with `DEAD DECLARATION(S): … statblock-wrap:line-height
… Delete them` because the declaration matched nothing. Removing it is the required response,
not a rebaseline — and it is the shape every entry above is expected to end in. When you fix a
declared finding, expect the run to go red until you delete its declaration, and expect to move
`compare.test.ts`'s "the declared set is exactly the documented N entries" guard and
`visual-harness/parity/README.md` in the same commit.

If the DECLARED count or composition differs from this set, don't just accept a new number:
either it's a regression (fix it) or a new legitimate deferral (file a Linear Backlog ticket
and add a `declaredDeferrals` entry citing its SC-key).

**`owns`** is the sibling mechanism: when the plugin collapses two site nodes into one, two
pairs share the plugin selector and each declares which rules it is authoritative for. It can
only **move** a rule — `compare.cjs` requires, for **every** plugin selector (shared or named
by a single pair), that each rule be owned by exactly one pair, so nothing can be dropped or
double-counted. The one way to drop a rule is an explicit `excludes: [{ rule, why }]` entry
citing a Linear ticket's SC-key, priced exactly like a declared deferral; the shipped map
uses none.

> Until the SC-110 fix round that invariant ran **only on shared selectors**, so a pair naming
> a plugin node no one else named could narrow `owns` and silently drop the rest — exit 0, no
> error, no dead declaration. `statblock-wrap` was live proof, hiding two real `line-height`
> rows (now FOLLOWUPS #52). If you read a doc anywhere claiming the partition is unconditional
> and older than 2026-08-07, it was describing the intent, not the code.

## Capture-width convention (Scott's rule, 2026-08-07)

**Design-review evidence gets the standard main-pane width.** Narrow/sidebar captures are
only for when narrow behaviour is literally the thing under review (e.g. FOLLOWUPS #48's
hero-sheet sidebar overflow, or a `--width=` narrow-axis shot). Don't reach for a narrow
capture as a shortcut or as "extra thoroughness" on an ordinary design-review pass — it
answers a different question than the one being reviewed.

**The camera sets pane widths programmatically — never ask Scott to resize his vault.** Both
cameras already do this in code, not by hand: the browser harness fixes its page at
`viewport: { width: 900, height: 1200 }` (`visual-harness/shoot.mjs`) with an explicit
`?width=<px>` override for the narrow axis (`visual-harness/entry.ts`'s `NARROW_SHOTS`); the
Obsidian camera drives real sidebar-leaf width via `Emulation.setDeviceMetricsOverride` over
CDP (`visual-harness/obsidian-camera.mjs`). If a capture needs a specific width, set it in the
capture script/CDP call — don't ask a human to resize a window and hope the next run matches.

## Steel scoping rule

Every new Steel CSS rule must carry
`[data-dse-theme='steel']:not([data-dse-print="on"])`. Both halves still matter, for
different reasons since SC-144:

- **`:not([data-dse-print="on"])` is the load-bearing half — it is the whole freeze rule
  now.** Print is the only frozen class, so a screen-intended rule that forgets this
  exclusion leaks into `*--steel-print.png` and trips the check. Only the unfrozen
  steel-dark/steel-light shots may change freely.
- **`[data-dse-theme='steel']` is always true, and stays anyway.** With one theme, the
  prefix on ~297 rule blocks can never fail to match. **Do not strip it.** Removing it drops
  the specificity of every one of those rules by one attribute selector, which silently
  reorders the cascade against the unscoped base — putting all 66 frozen bytes and every
  Steel shot back in play for a pure-readability gain. It also keeps the snippet-theme door
  (D3 §6) open. Declined by default; if it is ever revisited, it is its own ticket with its
  own full battery.

**Where "legacy" went.** There is no second theme. Legacy was never a scoped rule set — it
was the unscoped `:root` base that Steel overrides, and that base **stays**, because Steel
inherits from it. SC-144 therefore deleted **zero** CSS; the sheet's own contract comment
(`styles-source.css`, the theming-contract block) is the authority. Anything you read that
says a rule "must not leak into legacy" means "must not leak into print" today.

## Rebuild before live-vault review

`main.js`/`styles.css` at the plugin root are **untracked build artifacts**. The harness
(`npm run shots`, `npm run parity`) compiles its own bundle via `harness:build` — so gates
stay green even while the vault-loaded `main.js`/`styles.css` lag behind. Before any live
Obsidian-vault review (Scott's or your own), rebuild explicitly:

```bash
devbox run -- bash -c 'cd /abs/path/draw-steel-elements && npm run build-no-check'
```

## Current expected numbers (drift — verify against current main)

**CURRENT — dse `develop` @ `7b9e82cf` (2026-11-14; SC-643 landed on `76520b1f`; the vault root can no longer reach Sync, Migrate or the trash, whatever is typed in the Destination folder field: new resolver `src/model/CompendiumDestination.ts` (a blank or spaces-only Destination means `DS Compendium`; a vault-root `/`, `.`, `./`, `//` or outside-vault `..` Destination is refused with a Notice), guards in `main.ts`, the sync and migration services, `LegacyCompendiumModal` and at the trash call, link resolvers use the same resolved folder, and a Destination changed while the "Existing compendium folder found" window is open makes both buttons do nothing with a Notice; `syncOptions()` can now return null; 106 new jest tests; filed SC-653 (High: that window offers to trash any non-empty folder named) and SC-654 (INIT-W10 e2e flaked once under load); no lifecycle id used (G-S126 free)):**
tsc and lint clean · jest **12681 passed / 2 skipped** in a fresh worktree · lifecycle **64/64** · e2e **`OBSIDIAN-E2E done: 484/504 ok, 0 failed, 20 known-bug, coverage: 287/287 pairs`** · `styles.css` `18730938…f1f9` identical to a `76520b1f` build, so shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147, freeze **280/280** and parity **0 / 0 / 24** carry (not re-run). Numbers as reported by the SC-643 owner (implementer and reviewer); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `76520b1f` (2026-11-14; SC-625 landed on `8a81c5a7`; any write of a `ds-montage` block kept only the keys the montage reads, deleting a Director's own top-level keys and the extra keys on a logged action; `src/elements/montage/model.ts` only (about 60 lines): the unknown keys are carried as own properties of the model and each entry and written back after the known keys, in their original order; `participants:` items already kept theirs; the 2 e2e `knownBug('SC-625')` markers MONT-X09/X10 and the 2 jsdom `test.failing` markers `[K01]`/`[K02]` are plain tests; new e2e MONT-X11..X14, new jsdom X09 (7 write paths), X10, X11 (4 paths), X12 and 11 unit tests; filed SC-652; no lifecycle id used (G-S125 free)):**
tsc and lint clean · jest **12575 passed / 2 skipped** in a fresh worktree (12551 + 24; with the shots cache 12576 / 1, derived) · lifecycle **64/64** · e2e **`OBSIDIAN-E2E done: 484/504 ok, 0 failed, 20 known-bug, coverage: 287/287 pairs`** · `styles.css` `18730938…f1f9` identical to a clean `8a81c5a7` build, so shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147, freeze **280/280** and parity **0 / 0 / 24** carry (not re-run). Numbers as reported by the SC-625 owner; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `8a81c5a7` (2026-11-14; SC-439 landed on `11fbded6`; real-Obsidian e2e and jsdom tests for the negotiation tracker: 52 (control, interaction) pairs, each with at least one plain test checking both the note file and the card; both control censuses scope over the negotiation card (`CENSUS-13..15`), e2e ids `NEGO-*`; jsdom matrix and note-integrity tests; the only `src/` change adds `data-dse-control` ids (kit `tabs.ts`, `track.ts` and the negotiation), with one visible side effect pinned by `NEGO-L01`: in Live Preview keyboard focus now stays on the seal or chip used after a save; bugs filed with known-bug markers SC-637..SC-642, SC-648, SC-649; no CHANGELOG; no lifecycle id used (G-S122 free)):**
tsc and lint clean · jest **12552 passed / 1 skipped** with the shots cache · lifecycle **64/64** · e2e **`OBSIDIAN-E2E done: 478/500 ok, 0 failed, 22 known-bug, coverage: 287/287 pairs`** · shots **592**, 0 FAIL, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze **280/280** (no rebaseline) · parity **0 / 0 / 24** (lifecycle, shots, freeze and parity on `1615843e`; the final round changed three test files only). Numbers as reported by the SC-439 owner; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `11fbded6` (2026-11-14; SC-626 landed on `a5313f9d`; the montage keeps keyboard focus after a write, a strip / guide toggle and a window close: focus goes to the rebuilt control, or a documented nearest equivalent (`src/elements/montage/focusRules.ts`; kit `controlFocus.ts` gains opt-in `data-dse-focus-at` and per-family `fallbacks`; the Live Preview carry reads an optional `controlFocusRules()` on the view); the 4 e2e `knownBug('SC-626')` markers MONT-F01..F04 and jsdom `[K03]` are plain tests; new jsdom F01-F27, new e2e MONT-F05..F13; 2 new manifest rows (`press:Enter` on `montage.quick.success`, `montage.bar.back`); filed SC-650; no lifecycle id used (G-S123 free)):**
tsc and lint clean · jest **12167 passed / 1 skipped** with the shots cache (fresh: 12166 / 2) · lifecycle **64/64** · e2e **`OBSIDIAN-E2E done: 437/446 ok, 0 failed, 9 known-bug, coverage: 235/235 pairs`** · shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze **280/280** (no rebaseline) · parity **0 / 0 / 24**. Numbers as reported by the SC-626 owner (implementer and reviewer both ran the battery); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `a5313f9d` (2026-11-14; SC-615 landed on `f6e504c7`; clicking a creature in the initiative roster while typing in a tracker text box (the Malice quick-add amount and label boxes in Reading view, the pinned sidebar tracker and Live Preview; the encounter title being edited, Reading view) moves keyboard focus to that creature's cell instead of the page, and the typed text stays: the tracker notes on mousedown whether focus was inside it, before the click shield takes it, and the roster cell's click uses that note once (`src/elements/initiative/view.ts` only); a click with focus outside the tracker still never pulls focus in; new jest +8, new e2e INIT-F17..INIT-F25; no lifecycle id used (G-S121 free)):**
tsc and lint clean · jest **12133 passed / 1 skipped** with the shots cache present · lifecycle **64/64** · e2e **`OBSIDIAN-E2E done: 424/437 ok, 0 failed, 13 known-bug, coverage: 233/233 pairs`** (+9) · shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze **280/280** (no rebaseline) · parity **0 / 0 / 24**. Numbers as reported by the SC-615 owner (the reviewer re-ran e2e); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `f6e504c7` (2026-11-14; SC-438 landed on `6785fa06`; real-Obsidian e2e and jsdom tests for ds-montage and its three windows (Log an action, Add a hero, Set limits): +83 e2e tests (`MONT-*`, `CENSUS-10..12`), +57 pairs, `test/dom/elements/montage-matrix.test.ts` + census tests; the only `src/` change is `data-dse-control` ids on the montage's controls; bugs filed with known-bug markers SC-625, SC-626, SC-627, SC-628, SC-629, SC-631, design questions SC-630, SC-632; no CHANGELOG; no lifecycle id used (G-S120 free)):**
tsc and lint clean · jest **12125 passed / 1 skipped** with the shots cache present (fresh worktree: one fewer passed, 2 skipped) · lifecycle **64/64** · e2e **`OBSIDIAN-E2E done: 415/428 ok, 0 failed, 13 known-bug, coverage: 233/233 pairs`** · shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147, freeze **280/280**, parity **0 / 0 / 24** (measured on the pre-rebase heads `0bbc1948` / `d5acaabb`; the montage `src/` change is attributes only). Numbers as reported by the SC-438 owner; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `6785fa06` (2026-11-14; SC-569 landed on `506786cb`; the minion pool window names the squad in its title when a group holds more than one: two squads of the same creature read "(squad 1)" / "(squad 2)", counted top to bottom as the tracker lists them, and a group with one squad keeps its old title (`src/views/MinionStaminaPoolModal.ts`, title helper `minionPoolModalTitle`); a creature name written as a plain number (`name: 300`) still opens the window; new jest +18, new e2e POOL-E06 / POOL-E07 with fixture `e2e/vaults/shipped/Initiative/two-squads.md`; follow-ups SC-634, SC-635, SC-636; no lifecycle id used (G-S119 free)):**
tsc and lint clean · jest **11918 passed / 1 skipped** with the shots cache present (fresh figure derived, not measured: 11917 / 2) · lifecycle **64/64** (seven parts) · e2e **`OBSIDIAN-E2E done: 342/345 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`** (+2: POOL-E06, POOL-E07) · `styles.css` `18730938…f1f9` unchanged, so shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147, freeze **280/280** (no rebaseline) and parity **0 / 0 / 24** carry. Numbers as reported by the SC-569 owner; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `506786cb` (2026-11-14; SC-614 landed on `27120710`; in the initiative tracker, removing a condition (mouse, or Enter / Space) no longer drops keyboard focus to the page: focus stays on Add condition or on the condition button that had it, and a click with focus outside the tracker still never pulls focus in (`src/elements/initiative/view.ts`, a small change to the shared `src/framework/kit/conditionIcons.ts`); new jest F23-F29, new e2e INIT-F15 / INIT-F16; no lifecycle id used (G-S117 free)):**
tsc and lint clean · jest **11900 passed / 1 skipped** with the shots cache present (fresh-worktree figure not reported; the 11892 / 2 at `27120710` is fresh) · lifecycle **64/64** (seven parts) · e2e **`OBSIDIAN-E2E done: 340/343 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`** (+2: INIT-F15, INIT-F16) · shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze **280/280** (no rebaseline) · parity **0 / 0 / 24**. Battery re-run by the reviewer on `283cb2f5`; `506786cb` changes one jest test title only. Numbers as reported by the SC-614 owner; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `27120710` (2026-11-13; SC-621 landed on `b1e4f027`; a + / - or a form Save in a hover preview or embed of PART of a note (`[[Note#Heading]]`, `[[Note#^id]]`) with two identical counters, after an outside write that deletes the counter the preview shows and edits a line on one side of the pair, writes nothing and shows the "changed on disk first" Notice instead of writing the other counter (rule P at the rebase, `rebaseCardPin`); the refusal repeats until the preview or embed is reopened; residuals R1 (a move among identical blocks), R2 (the shown section deleted while a neighbour is renamed to its name) and R3 (more than 400 lines changed in the same write) stay written as before; lifecycle id G-S115 used):**
tsc and lint clean · jest **11892 passed / 2 skipped** in a fresh worktree without the shots cache (11857 + 35: twin file 32, sweep/fuzz file 3) · lifecycle **64/64** (seven parts, part 7 `G-S108,G-S112,G-S115`, 200 s) · e2e **`OBSIDIAN-E2E done: 338/341 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`** · `styles.css` byte-identical to a clean `b1e4f027` build, so shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147, freeze **280/280** and parity **0 / 0 / 24** carry (not re-run). Battery run on `96955985`; `27120710` adds only a comment (`main.js` byte-identical). Numbers as reported by the SC-621 owner; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `b1e4f027` (2026-11-13; SC-568 landed on `9b94baf2`; jest's default per-test timeout is 30 s (global `testTimeout` in `jest.config.ts`, both projects); `chromeFocusHandoff`, `initiative-outside-edit`, `initiative-default-keys`, `reading-mode-host-pin` and `reading-mode-host-crlf-hover` no longer read the wall clock (fake clock with literal gaps, or `settleVaultReads()`); three hand-written 5 s waits are 25 s; test setup only, no `src/` change; see "Jest timeouts under load"; no lifecycle id used (G-S114 free)):**
tsc and lint clean · jest **11857 passed / 2 skipped** quiet (11853 + 4) · `taskset -c 0 npx jest -w 11` 0 failed in 4 of 4 runs (base 1-5 reds per run) · `main.js` `81a67cb8…9219` and `styles.css` `18730938…f1f9` byte-identical to a clean `9b94baf2` build, so lifecycle **63/63**, e2e **`OBSIDIAN-E2E done: 338/341 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`**, shots **592** / host-leak 163/978 / modal host-leak 40/240 / capture clip 147, freeze **280/280** and parity **0 / 0 / 24** carry (r1 ran lifecycle 63/63 and e2e 0 failed on the same change at `df92a3f6`). Numbers as reported by the SC-568 owner; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `9b94baf2` (2026-11-13; SC-613 landed on `14521bf0`; in the Conditions window, typing after a click on the window's title or blank space opens the Add search with what was typed (a second keydown listener on the window's own document, removed on close, hands a key to the SC-580 type-to-search handler only when focus is on the page itself, this window is top-most, no menu or suggestion popup is open and nothing else handled the key; Escape from a search opened this way focuses "+ Add condition"); no visual change; new e2e COND-N12..N15; no lifecycle id used (G-S116 free)):**
tsc and lint clean · jest **11853 passed / 2 skipped** in a fresh worktree without the shots cache (11833 + 20) · lifecycle **63/63** (seven parts, part 7 `G-S108,G-S112`; measured on `8978b6f0`, tests only after it) · e2e **`OBSIDIAN-E2E done: 338/341 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`** (+4: COND-N12..N15) · shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze **280/280** (no rebaseline) · parity **0 / 0 / 24** (shots, freeze and parity measured on `8978b6f0`; `styles.css` byte-identical to `14521bf0`). Numbers as reported by the SC-613 owner; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `14521bf0` (2026-11-13; SC-586 landed on `df92a3f6`; in the Conditions window a hand-written colour (`color: teal`, `#abc`, `rgb()`, `hsl()`, `oklch()` and other CSS Color 4 forms, the latter via a canvas pixel readback) opens the colour chooser at that colour instead of white, a colour the browser cannot read still opens at white; a blank or spaces-only `icon:` presses "Use default", `icon: "skull "` presses skull once; opening and closing the editor without a pick writes nothing; the two SC-436 `test.failing` markers for this ticket are plain tests; new e2e COND-H01..H03 on a hand-written fixture; no lifecycle id used (G-S113 free)):**
tsc and lint clean · jest **11833 passed / 2 skipped** in a fresh worktree without the shots cache (11817 + 16) · lifecycle **63/63** (seven parts, part 7 `G-S108,G-S112`; measured on `6be3d411`, same product code as the head) · e2e **`OBSIDIAN-E2E done: 334/337 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`** (+3: COND-H01..H03) · shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze **280/280** (no rebaseline) · parity **0 / 0 / 24** (shots, freeze and parity measured on `6be3d411`). Numbers as reported by the SC-586 owner; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `df92a3f6` (2026-11-13; SC-619 landed on `1cc54eac`; a + / - or a block edit form Save in a hover preview of a HEADING (`[[Note#Heading]]`) of a note saved with Windows line endings (CRLF) is saved into the hovered counter instead of refused with the "changed on disk first" Notice (Obsidian cuts such a hover's part one character after the heading line's content, which in CRLF leaves a stray LF at the start; `cardLinkLine` drops it); every refusal the LF note has stays a refusal; accepted residual: a CRLF note converted to LF from outside while its heading hover is open refuses + until the preview is reopened; new jest `reading-mode-host-crlf-hover.test.ts` (23 tests, 11 red at the pre-fix src, 12 pass there too), new lifecycle G-S112 (lifecycle part 7, G-S108 + G-S112)):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **11817 passed / 2 skipped** in a fresh worktree without the shots cache (11794 at `1cc54eac` + 23; 11818 / 1 once `visual-harness/dist/obsidian-app.css` is cached by a shots run) · lifecycle **63/63** (21 + 16 + 9 + 4 + 7 + 4 + 2; 185 / 323 / 404 / 296 / 394 / 294 / 128 s) · e2e **`OBSIDIAN-E2E done: 331/334 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`** (172 s) · shots **592**, 0 FAIL, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze **280/280** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. (`styles.css` is untouched by SC-619; the change is `ReadingModeBlockHost.ts` only.)

**PREVIOUS — dse `develop` @ `1cc54eac` (2026-11-13; SC-616 landed on `3a5986d3`; G-S91 (lifecycle part 5) no longer flakes: its title / apply / reopen trials release the second press after an in-page 11 ms timer (the helper's 10 ms timer has run first), its validity gate is measured from the END of the opening click's dispatch (`gapEnd < 140`), and a trial whose only problem is that gate is re-run up to twice, named in the outcome line; harness only, no `src/` or `styles.css` change; no lifecycle id used (G-S111 free)):**
tsc and lint clean · jest **11794 passed / 2 skipped** in a fresh worktree without the shots cache · lifecycle **62/62** (seven parts: 21 + 16 + 9 + 4 + 7 + 4 + 1; 184 / 324 / 408 / 295 / 393 / 296 / 67 s) · e2e **`OBSIDIAN-E2E done: 331/334 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`** · `main.js` `825bd341…fbd7` and `styles.css` `18730938…f1f9` byte-identical to a build of `3a5986d3`, so shots **592** / host-leak 163/978 / modal host-leak 40/240 / capture clip 147, freeze **280/280** and parity **0 / 0 / 24** carry (SC-557 precedent). G-S91 alone: 3 of 3 green on the final head (`gapEnd` 24-51 ms, no retry fired), 0 of 19 natural runs red across the head and its pre-rebase twins; red 6 of 6 trials in 2 of 2 runs on the SC-598-reverted bundle (r2, earlier twin). Numbers as reported by the SC-616 implementer on `1cc54eac` on `3a5986d3`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `3a5986d3` (2026-11-13; SC-585 landed on `1f1ae442`; in the Conditions window, removing the last condition by keyboard while the Add search is open keeps focus in the search's input (the search stays open and keeps what was typed) instead of dropping it to the page; unchanged: with the search closed the last removal focuses "+ Add condition", a non-last removal moves focus to the next condition (or the one above), and a MOUSE removal of the last condition with the search open closes the search and focuses "+ Add condition" (SC-474's click-outside rule); new e2e COND-R07 (real Shift+Tab and Enter); no lifecycle id used (G-S111 free)):**
tsc and lint clean · jest **11794 passed / 2 skipped** fresh without the shots cache (11788 + 6; 11795 / 1 with it) · lifecycle **62/62** (seven parts) · e2e **`OBSIDIAN-E2E done: 331/334 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`** · no CSS change, so shots **592** / host-leak 163/978 / modal host-leak 40/240 / capture clip 147, freeze **280/280** (no rebaseline) and parity **0 / 0 / 24**. Numbers as reported by the SC-585 ticket-owner at `3a5986d3` on `1f1ae442` (independent review re-ran the gates and probed 8 more removal paths, LAND-READY after a test-and-doc-only fix round; with the fix reverted 4 jest tests and COND-R07 fail; superproject branch on main with a CHANGELOG commit and one pointer bump); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `1f1ae442` (2026-11-13; SC-612 landed on `2074a152`; a form Save or card + / - on one of two identical blank-line-separated counters of a note open in its own pane is refused with the "changed on disk first" Notice when the note cannot tell which was meant, instead of being written into the surviving twin (rule P: the head-first placement is accepted only when it is the unique cheapest placement of the block, `placedUniquely` in `ReadingModeBlockHost`, `editDistance` in lineMap.ts capped at `LINE_MAP_MAX_EDITS`); never written into another counter on the sweep's 14 layouts and the seeded fuzz; new refusals and P residuals listed under "The drawn-from rule (SC-607)"; new jest suites listed under "Two identical blocks separated only by blank lines"; new lifecycle G-S108 as its own part 7; filed SC-621 (the same one-sided-edit gap for part-of-note pins)):**
tsc and lint clean · jest **11788 passed / 2 skipped** in a fresh worktree without the shots cache (11707 + 81) · lifecycle **62/62** (21 + 16 + 9 + 4 + 7 + 4 + 1; 185 / 322 / 404 / 297 / 391 / 296 / 67 s; G-S108 is part 7, 15 cells) · e2e **`OBSIDIAN-E2E done: 330/333 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`** · `styles.css` `18730938…f1f9` byte-identical to a clean `2074a152` build, so shots **592** / host-leak 163/978 / modal host-leak 40/240 / capture clip 147, freeze **280/280** and parity **0 / 0 / 24** carry. r3 fuzz (234,064 cells): 0 twinned-ambiguous writes, 0 new unambiguous refusals; mutants 17: 15 killed, 2 equivalent. Numbers as reported by the SC-612 ticket-owner at `1f1ae442` on `2074a152` (Opus design, Sonnet implementation, independent review FIX (rule R replaced by rule P), scoped re-review LAND; the r6 rebase onto `2074a152` brought no code change, range-diff checked by the owner, plus one 4-line comment in `ReadingModeBlockHost.ts`; superproject branch on main with one CHANGELOG commit, pointer bump at landing); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `2074a152` (2026-11-13; SC-581 landed on `1516f894`; the Conditions window's Color row starts with a **Default** button that removes the condition's `color:` key from the note, so the condition goes back to its normal look; clicking an already-selected swatch still keeps that colour; tooltip says "no color", matching the group's spelling; new e2e COND-D18 and COND-D19 (by click and by keyboard); the Default button is a new modal control, so modal host-leak goes 39/234 -> 40/240; no lifecycle id used (G-S110 free)):**
tsc and lint clean · jest **11707 passed / 2 skipped** without the shots cache (11692 + 15; 11708 / 1 with it) · lifecycle **61/61** (21 + 16 + 9 + 4 + 7 + 4; on `14513d4a`, plus G-S1 1/1 on `2074a152`) · e2e **`OBSIDIAN-E2E done: 330/333 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`** · shots **592**, 0 FAIL, host-leak 163/978, modal host-leak **40/240**, capture clip 147 · freeze **280/280** (no rebaseline) · parity **0 / 0 / 24**. Shots, freeze, parity and lifecycle measured on `14513d4a`; `2074a152` changes one tooltip string and its test, after which tsc, lint, full jest, full e2e and G-S1 were re-run. Numbers as reported by the SC-581 ticket-owner at `2074a152` on `1516f894` (independent review LAND, with real-note write checks in real Obsidian; 17 jest tests and both new e2e red without the fix; scoped re-review of the tooltip fix LAND; superproject branch on main with a CHANGELOG commit and one pointer bump); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `1516f894` (2026-11-13; SC-563 landed on `c0995beb`; in the Steel theme the ability and trait action crests, including abilities inside statblocks, draw the site's solid DrawSteelGlyphs glyphs instead of thin outline icons (Scott's pick I1); the "◆ TRAIT" eyebrow stays grey (Scott's pick E-B); the villain crest keeps its outline skull; nothing changes in print; the glyph font family is namespaced, and the licence notices of both bundled fonts (DrawSteelGlyphs CC BY-SA, Source Serif 4) now survive the minifier into the released `styles.css`; DESIGN.md Iconography and the README third-party credit updated; 76 screen shots change (38 test cards, dark and light), none frozen; filed SC-565, SC-622 (the Obsidian camera tool leaves the demo vault dirty, which also made G-S97 fail until the stray folders were deleted) and SC-623 (Source Serif 4 subset vs the OFL reserved-name clause); no lifecycle id used):**
tsc and lint clean · jest **11692 passed / 2 skipped** without the shots cache (11682 + 10; 11693 / 1 with it) · lifecycle **61/61** (21 + 16 + 9 + 4 + 7 + 4) · e2e **`OBSIDIAN-E2E done: 328/331 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`** · shots **592**, 0 FAIL, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze **280/280** (no rebaseline) · parity **0 / 0 / 24**. Numbers as reported by the SC-563 ticket-owner at `1516f894` on `c0995beb` (independent review found the minifier stripping the font licence notices plus four wording and test nits; fix round; scoped re-review LAND; superproject branch on main with two docs commits and one pointer bump); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `c0995beb` (2026-11-13; SC-608 landed on `63e00d7e`; in Reading view and Live Preview an outside edit that redraws an initiative tracker while one of its windows is open closes the window with a Notice and hands keyboard focus to the same control in the rebuilt tracker instead of the page; in the pinned sidebar an Apply after an outside edit is no longer silently lost: the window closes when the tracker block itself changed, and stays open and saves when the edit was elsewhere in the note; the hand-off is owned by the plugin, keeps focus through a burst of redraws, skips focus when the tracker count changed, and compares with what the view last loaded or wrote; changes in `src/elements/initiative/view.ts` and a `windowHandoff` row in `.repo-docs/architecture.md`; 13 new e2e (INIT-W01..W13); in Live Preview a condition write still closes the Conditions window, which is SC-384, unchanged; no lifecycle id used (G-S103 free)):**
tsc and lint clean · jest **11682 passed / 2 skipped** in a fresh worktree (11648 + 34; 11683 / 1 warm) · lifecycle **61/61** (21 + 16 + 9 + 4 + 7 + 4) · e2e **`OBSIDIAN-E2E done: 328/331 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`** · `styles.css` unchanged, so shots **592** / host-leak 163/978 / modal host-leak 39/234 / capture clip 147, freeze **280/280** (no rebaseline) and parity **0 / 0 / 24**. Battery on `eb46d58d`; `c0995beb` is docs and a code comment only, after which tsc, lint and jest were re-run. Numbers as reported by the SC-608 ticket-owner at `c0995beb` on `63e00d7e` (independent review LAND with 5 LOW, all fixed; scoped re-review LAND, its one LOW a docs drift fixed in `c0995beb`; superproject branch on main with one changelog and pointer-bump commit); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `63e00d7e` (2026-11-13; SC-605 landed on `d984b115`; in Live Preview a half-typed Malice quick-add (amount and label) now survives the tracker's own save instead of emptying about half a second later: the framework carries a view's state across the Live Preview remount (new `src/framework/host/livePreviewStateCarry.ts`; two optional `ElementView` hooks in `src/framework/view.ts`; `pipeline.ts` takes the carried state just before `view.mount`; wiring in `registerFrameworkElements.ts`; `livePreviewFocusCarry.ts` exports `writtenBlockKey`; additions only in `src/elements/initiative/view.ts`: `isQuickAddDraft()`, `carryState()`, `receiveCarriedState()`); filed SC-620 (another copy of the same tracker, an identical twin block or the note in a second pane, still loses its own draft when this copy saves, as before); no lifecycle id used (G-S107 free)):**
tsc and lint clean · jest **11648 passed / 2 skipped** in a fresh worktree · lifecycle **61/61** (21 + 16 + 9 + 4 + 7 + 4) · e2e **`OBSIDIAN-E2E done: 315/318 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`** (lifecycle and e2e from r4; only a jest test, S17, added after) · `styles.css` `5e5ff488…2b27` unchanged, so shots **592** / host-leak 163/978 / modal host-leak 39/234 / capture clip 147, freeze **280/280** and parity **0 / 0 / 24** carry. Numbers as reported by the SC-605 ticket-owner at `63e00d7e` on `d984b115` (independent review 0 HIGH / 0 MEDIUM / 3 LOW, all fixed; scoped re-review LAND-READY with one LOW, a missing test, added and owner-reviewed; the effort was paused about 17 h by the weekly usage limit and resumed; superproject branch on main, pointer bump at landing); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `d984b115` (2026-11-12; SC-600 landed on `c329ff35`; Scott's option A: when a creature's `amount` is hand-edited, the instances already in the tracker keep their conditions and stamina; a higher `amount` adds new instances at the end with full stamina and no conditions, a lower one removes from the end; squad minions keep their conditions the same way and the squad's shared stamina pool is untouched; `amount: .inf` / `.nan`, which froze Obsidian, now shows the usual invalid-amount error; `adjustInstances` helper in `src/elements/initiative/model.ts`; new e2e INIT-AMT-E01 and INIT-AMT-E02, both red on the old code; no lifecycle id used (G-S89 free)):**
tsc and lint clean · jest **11617 passed / 2 skipped** in a fresh worktree (11595 + 22; 11618 / 1 with the shots cache) · lifecycle **61/61** (21 + 16 + 9 + 4 + 7 + 4) · e2e **`OBSIDIAN-E2E done: 306/309 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`** · shots **592**, `button host-leak OK (163 … 978 …)`, modal host-leak 39 kinds / 234 comparisons, `capture clip OK (147 …)` · freeze **280/280** · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-600 ticket-owner at `d984b115` on `c329ff35` (independent review LAND-READY; one fix round for two comment fixes and the `.inf` hang; scoped re-review clean; superproject branch on main with one pointer bump); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `c329ff35` (2026-11-12; SC-607 landed on `dcc53f0f`; a + / - or a block edit form Save in a hover preview or an embed of PART of a note that stayed open while the note changed (the hovered one of two identical sections deleted, two heading names or `^id` markers swapped) is saved into the counter the preview shows or refused with the "changed on disk first" Notice, in the shapes tested; rule: the pin is placed through the link and accepted only when the block the card was drawn from (mount / re-bind snapshot, one `cachedRead` per card mount, or the host's own last write) maps strictly (head-first and tail-first line maps agree) to it; when the line map gives up (>400 lines) the link places it only while the body is unique in both notes; hover mount snapshots are checked against `hoverPopover.embed.data` while it holds the part; a moved section is refused while its preview stays open; residuals: embed race window, redraw race ~20 ms, give-up N5 family, persistent refusal after an unrelated edit in the hover mount window; new lifecycle G-S99 (61 scenarios, part 6 `G-S92 G-S96 G-S97 G-S99`); filed SC-612 (whole-note head-trim bias), SC-616 (G-S91 flake) and SC-619 (CRLF hover refusal), all out of scope):**
tsc and lint clean · jest **11595 passed / 2 skipped** in a fresh worktree as reported (10787 + 808; the logged run is 11596 / 1 warm) · lifecycle **61/61** (21 + 16 + 9 + 4 + 7 + 4; 187 / 327 / 408 / 298 / 395 / 298 s) · e2e **`304/307 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`** · `styles.css` `5e5ff488...dc2b27`, byte-identical to a clean dcc53f0f build · shots **592**, host-leak 163/978, modal host-leak 39/234, capture clip 147, freeze **280/280** (measured in r2 on 622b0904; carried, styles.css unchanged) · parity carries. Mutants (r4, 41 = r2's M1-M27 + the r3 review's N1-N18 that exist): 32 killed, 9 survived: M5, M7, M18, M22, N11, N15 equivalent; N18 survives: its branch (own write newer than the snapshot, the link placing) was unreached in measured runs (r5: 6 of 6 re-binds in real Obsidian kept their snapshot); it is reachable only when the metadata cache still lags this host's own + at a re-bind AND the write changed the block's line count, so the re-bind snapshot is discarded (r5 jest probe `sc607-r5-n18-probe.test.ts.txt`: saves on head, refused under N18); M8 and N1 defence in depth (strict miss no fallback, R-Q6; no re-bind lands between a pin and its rebase read). Numbers as reported by the SC-607 ticket-owner at `c329ff35` on `dcc53f0f` (Opus design, Sonnet implementation, independent review FIX on docs and tests, fix round, scoped re-review LAND; new jest red on base 201 of 816; superproject branch on main, pointer bump at landing); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `dcc53f0f` (2026-11-12; SC-582 landed on `711844f3`; in the Conditions window each colour swatch's accessible name is now its colour name ("Green") instead of its hex code ("Color #1e8449"); the hover tooltip still shows name and hex; the swatch lookup is case-insensitive; 8 jest tests fail without the fix; no e2e change; no lifecycle id used (G-S106 free)):**
tsc and lint clean · jest **10787 passed / 2 skipped** in a fresh worktree (10788 / 1 with the shots cache) · lifecycle **60/60** (21 + 16 + 9 + 4 + 7 + 3) · e2e **`OBSIDIAN-E2E done: 304/307 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`** (known bugs SC-257, SC-355, SC-384) · shots **592**, `button host-leak OK (163 … 978 …)`, modal host-leak 39 kinds / 234 comparisons, `capture clip OK (147 …)` · freeze **280/280** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-582 ticket-owner at `dcc53f0f` on `711844f3` (independent Opus review LAND with one LOW and one INFO folded, two INFO dropped; scoped re-review LAND; superproject branch on main with one pointer bump); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `711844f3` (2026-11-12; SC-602 landed on `d0561a68`; in Live Preview an element's own save mounts a fresh copy of the block (Reading view reuses it), which dropped keyboard focus to the page about half a second later; the framework now records which control had focus just before Obsidian removes the old copy and focuses the same control in the new copy, else the control that replaced it, else the element itself, never the page; the record is used once and only for that block, so an outside edit, another note or a twin block never takes focus; new `src/framework/host/livePreviewFocusCarry.ts` plus `viewRegistry.ts`, `chrome/focusHandoff.ts`, `kit/controlFocus.ts`, `registerFrameworkElements.ts`; measured on the counter, initiative tracker and stamina bar; the SC-588 / SC-609 / SC-603 CHANGELOG entries no longer say Live Preview loses focus; SC-605 not covered (a mouse press; the draft needs a view-to-view hand-off); no lifecycle id used (G-S104 free)):**
tsc and lint clean · jest **10784 passed / 2 skipped** in a fresh worktree (+25) · lifecycle **60/60** (six parts; part 5 first ran 6/7 with a G-S91 Reading-view hover-timing FAIL that passed alone and on a re-run, 7/7, and has also failed on the unchanged base) · e2e **`OBSIDIAN-E2E done: 304/307 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`** (14 new Live Preview tests, 10 red without the fix) · `styles.css` sha256 `5e5ff488…2b27` identical to a clean `d0561a68` build, so shots **592** / host-leak 163/978 / modal host-leak 39/234 / capture clip 147, freeze **280/280** and parity **0 / 0 / 24** carry. Numbers as reported by the SC-602 ticket-owner at `711844f3` on `d0561a68` (independent review 0 HIGH / 0 MEDIUM / 3 LOW, all fixed; scoped re-review LAND-READY; superproject branch on main, pointer bump at landing); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `d0561a68` (2026-11-12; SC-583 landed on `93e8e48c`; a condition key matches its standard condition regardless of case, so a hand-written `key: Dazed` is the standard Dazed and picking Dazed adds no second lowercase `dazed`; the note keeps the user's spelling; the SC-592 plain-string maps still compare exact spelling (commented); the SC-583 `test.failing` marker removed; new e2e COND-K01..K05 with fixture `Initiative/key-case.md`; filed SC-617 (the Add menu does not show conditions the creature already has) and SC-618 (a hand-written key with spaces, `High Ground`, `Hex Mark`, does not match its slug); no lifecycle id used (G-S105 free)):**
tsc and lint clean · jest **10760 passed / 1 skipped** with the shots cache (about 10759 / 2 in a fresh worktree) · lifecycle **60/60** · e2e **`OBSIDIAN-E2E done: 290/293 ok, 0 failed, 3 known-bug, coverage: 172/172 pairs`** (known bugs SC-257, SC-355, SC-384) · shots **592**, `button host-leak OK (163 … 978 …)`, modal host-leak 39 kinds / 234 comparisons, `capture clip OK (147 …)` · freeze **280/280** · parity **0 GAPs / 0 undeclared / 24 DECLARED** (lifecycle, shots, freeze and parity on `6453bc5d`; the last commit is one e2e test and one comment). With the fix turned off, 10 jest tests and 4 of the 5 new e2e tests fail. Numbers as reported by the SC-583 ticket-owner at `d0561a68` on `93e8e48c` (independent Opus review APPROVE with one LOW, a vacuous COND-K05, fixed; scoped re-review APPROVE; superproject branch on main with one pointer bump); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `93e8e48c` (2026-11-12; SC-580 landed on `622b0904`; a printable key in the Conditions window now opens the Add search with it typed (the docs' "or just start typing" made true rather than retracted; the owner offered Scott the reverse); if the search is open and focus is on another control the letter goes to the end of the search; Space, Enter, Tab, arrows, Escape, Cmd / Alt chords and text-field typing unchanged; Escape on a search a typed letter opened (nothing picked) returns focus to the control typed from; e2e COND-N07 is a plain test plus COND-N08..N10 and a `cond.add press:Space` pair (coverage 171 → 172), SC-580 off the known-bug list; filed SC-613 (typing after clicking the window's title or blank space does nothing); no lifecycle id used (G-S100 free)):**
tsc and lint clean · jest **10746 passed / 2 skipped** in a fresh worktree (10715 + 31; 10747 / 1 with the shots cache) · lifecycle **60/60** (21 + 16 + 9 + 4 + 7 + 3) · e2e **`OBSIDIAN-E2E done: 285/288 ok, 0 failed, 3 known-bug, coverage: 172/172 pairs`** (known bugs SC-257, SC-355, SC-384) · shots **592**, `button host-leak OK (163 … 978 …)`, modal host-leak 39 kinds / 234 comparisons, `capture clip OK (147 …)` · freeze **280/280** · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-580 ticket-owner at `93e8e48c` on `622b0904` (independent review LAND with two LOW, one fixed and one filed; scoped re-review LAND asking two tests, added; final test-only round checked by the owner; superproject branch's three commits squashed onto main by the dispatcher, interim pointer bumps dropped); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `622b0904` (2026-11-12; SC-609 landed on `231f2a3b`; in Reading view, with keyboard focus on the detail row's Stamina control (or any other detail-row control), a mouse click on another roster cell now moves focus to the clicked cell instead of dropping it to the page (the click redraws the grid and replaced the focused control); a click while focus is outside the tracker still does not pull it in; Live Preview still loses focus on the save (SC-602); new e2e INIT-F13 and INIT-F14; filed SC-614 (mouse removal of a condition while Add condition has focus) and SC-615 (roster click while typing in a quick-add box); no lifecycle id used (G-S102 free)):**
tsc and lint clean · jest **10715 passed / 2 skipped** in a fresh worktree (10716 / 1 with the shots cache) · lifecycle **60/60** (21 + 16 + 9 + 4 + 7 + 3) · e2e **`OBSIDIAN-E2E done: 280/284 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`** · shots **592**, `button host-leak OK (163 … 978 …)`, modal host-leak 39 kinds / 234 comparisons, `capture clip OK (147 …)` · freeze **280/280** · parity **0 GAPs / 0 undeclared / 24 DECLARED** (lifecycle, shots, freeze and parity from the first round; the fix round changed only comments in product code). Numbers as reported by the SC-609 ticket-owner at `622b0904` on `231f2a3b` (independent review: one MEDIUM, a no-pull-in test that could not fail, and three wording items, all fixed; scoped re-review clean; superproject branch already on main, pointer bump only); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `231f2a3b` (2026-11-12; SC-601 landed on `3ad68185`; reproduced, not only suspected: the compendium search (`CompendiumSearchModal`, a `SuggestModal` opened by `insert-compendium-reference` / `insert-compendium-block`) over an editing hover preview closed the preview on a press in its input, box or backdrop and the pick did not land; it now installs the SC-595 document click guard (`guardHoverPreviewClicks`, new `src/framework/kit/hoverPreviewGuard.ts`, shared with `DseModal.keepHoverPreviewAlive`) when its target editor is inside a `.hover-popover`, and both choices refuse with the Notice `The note you were editing was closed, so nothing was inserted.` when the captured editor is gone (the block command re-checks right before the write); Obsidian's own Quick switcher, Command palette and Insert template still close an editing preview (host-wide, not ours); new lifecycle scenario G-S97 (60 scenarios, part 6 `G-S92 G-S96 G-S97`); no e2e pair (the search has no `data-dse-control` ids); no CSS change):**
tsc and lint clean · jest **10711 passed / 2 skipped** in a fresh worktree (10676 + 33 in `compendiumSearchHoverPreview.test.ts` + 2 from `kit-index.test.ts` for the new kit file; 10712 / 1 with the shots cache) · lifecycle **60/60** (six parts 21 + 16 + 9 + 4 + 7 + 3; part 6 230 s; G-S97 red on the `5f7c5336` bundle, 15 broken expectations, trials 6 and 7 green as controls) · e2e **`OBSIDIAN-E2E done: 278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`** · shots **592**, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze **280/280** · parity **0 / 0 / 24**. Mutants 23 of 23 killed (r4), R2 split into R2b / R2c and both killed (r6). Numbers as reported by the SC-601 ticket-owner at `231f2a3b` on `3ad68185` (reproduction round, implementer, independent review with fix rounds, re-reviews through r7; superproject branch already on main, pointer bump only); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `3ad68185` (2026-11-12; SC-610 landed on `c6077860`; a hand-typed Montage block whose `participants` list holds an empty item, a bare word or number, or a hero with no name no longer breaks the board: the item is skipped on the board (reported in the developer console) and kept as typed, in its place, on write; an item with nothing in it (`- `, `- {}`, `- name:` with no value) is dropped on the next save; a non-list `participants` value is kept as typed and wrapped by add-hero; only `src/elements/montage/` (`model.ts`, `BoardView.ts`, `HeadView.ts`, `OutcomeBandView.ts`) and two montage test files; no lifecycle id used (G-S98 free)):**
tsc and lint clean · jest **10676 passed / 2 skipped** in a fresh worktree (10624 + 52; 10677 / 1 with the shots cache) · lifecycle **59/59** (21 + 16 + 9 + 4 + 7 + 2) · e2e **`OBSIDIAN-E2E done: 278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`** · shots **592**, `button host-leak OK (163 … 978 …)`, modal host-leak 39 kinds / 234 comparisons, `capture clip OK (147 …)` · freeze **280/280** · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-610 ticket-owner at `3ad68185` on `c6077860` (r2 review LAND with two LOW and three INFO, folds done; r4 scoped re-review LAND; superproject branch's two CHANGELOG commits re-applied onto main by the dispatcher, the branch predating the SC-596 landing); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `c6077860` (2026-11-12; SC-596 landed on `7866426e`; a block edit form opened from an embed or hover preview of PART of a note (`![[note#^id]]`, `![[note#Heading]]`, a hover of a block or heading link) is placed exactly like a card's + / - (SC-594 `rebaseCardPin`: the link checked by `cardLinkLine`, else the host's own last write, else refused), never by a text search (`rebasePin`, `verifiedPinLine`, `embedStartLine`, `searchedPinLine` deleted), and a form or a card write that cannot be pinned at all gets a REFUSING pin (nothing written, one Notice: "the block changed on disk first" when a pin exists and nothing places it, "the plugin can't tell where this block sits" for a refusing pin or a list shape) instead of no pin; live bug closed: with the source note also open in a second pane the form stays open past its card and Save wrote the identical twin with no Notice (7 of 7 pane cells at `5f7c5336`); shapes that saved now refuse (heading link of a note with two identical sections, nested same-name headings, a stale callout or a vanished section even with no twin, a lagging cache); a block or heading hover with an identical twin and no edit now saves where it refused; known residuals: SC-607 and the block-hover popover residual now apply to forms; no CSS change; new lifecycle scenario G-S96 (59 scenarios, part 6 `G-S92 G-S96`); G-S64 (zh) re-targeted; filed none):**
tsc and lint clean · jest **10624 passed / 2 skipped** (7707 + 2917 new: `reading-mode-host-form-pin.test.ts`, 2880 sweep cells + 29 named + 8 card/non-embedded controls) · lifecycle **59/59** (six `--only` parts 21 + 16 + 9 + 4 + 7 + 2; 185 / 323 / 409 / 294 / 390 / 175 s) · e2e **`OBSIDIAN-E2E done: 278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`** (known bugs SC-257, SC-355, SC-384, SC-580) · `styles.css` `5e5ff488…dc2b27`, byte-identical to a clean `7866426e` build, so shots **592** / host-leak 163/978 / modal host-leak 39/234 / capture clip 147, freeze **280/280** and parity **0 / 0 / 24** carry (not re-run). Numbers as measured by the SC-596 implementer on the rebased branch (r4); r3 review LAND with three LOWs, all folded; r5 scoped re-review LAND; superproject branch's two CHANGELOG commits re-applied onto main by the dispatcher after its first `wt-finish` merge conflicted (the branch predated SC-606's landing; dse had already pushed); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `7866426e` (2026-11-12; SC-606 landed on `5f7c5336`; a Montage hero whose entry has no `skills_used` list now works everywhere on the board (editing a logged action opens the full window instead of throwing in `onOpen` at `model.ts` `p.skills_used.slice()`, logging, correcting, removing, resetting; in a hover preview the window and the preview stay open on the next click); the note gains a `skills_used` key only once a skill is logged for that hero; an edit that changes neither hero nor skill leaves skills untouched; a hand-typed scalar `skills_used` reads as a one-item list; only `src/elements/montage/model.ts` changed plus 22 jest tests; filed SC-610 (an empty or nameless hero entry still throws); no lifecycle id used (G-S95 free)):**
tsc and lint clean · jest **7707 passed / 2 skipped** in a fresh worktree (7708 / 1 with the cached app CSS) · lifecycle **58/58** (six parts) · e2e **`OBSIDIAN-E2E done: 278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`** · shots **592**, `button host-leak OK (163 … 978 …)`, modal host-leak 39 kinds / 234 comparisons, `capture clip OK (147 …)` · freeze **280/280** · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-606 ticket-owner at `7866426e` on `5f7c5336` (first review: one MEDIUM, two LOW, all fixed; re-review clean on the code; real Obsidian red on the old build, green on the fix, Reading view and Live Preview; superproject CHANGELOG commit re-applied onto main by the dispatcher, the branch's stale pointer bumps dropped); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `5f7c5336` (2026-11-12; SC-603 landed on `da2bdbc6`; in Reading view and the pinned sidebar tracker keyboard focus now returns into the initiative tracker after Apply in the minion Stamina pool window (which rebuilds the whole tracker, as does a captain's Stamina edit that toggles its squad's bonus) and after closing the Conditions window (which rebuilds that conditions row): the window hands focus to the control that replaced its opener (the detail row's Stamina control, the same minion's roster cell, or Add Condition); Cancel and Escape still return to the pressed button; a mouse click never pulls focus in, nor does a window opened while focus was elsewhere; Live Preview still loses focus on the note's save (SC-602); new e2e focus-after-modal spec (coverage 169 → 171, keeps the `pool.apply` control id); no interaction with SC-598's `managedModal.ts`; filed SC-608, SC-609; no lifecycle id used (G-S94 free)):**
tsc and lint clean · jest **7685 passed / 2 skipped** in a fresh worktree · lifecycle **58/58** (six `--only` parts 21 + 16 + 9 + 4 + 7 + 1) · e2e **`OBSIDIAN-E2E done: 278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`** (known bugs SC-257, SC-355, SC-384, SC-580) · `styles.css` byte-identical to a clean `da2bdbc6` build, so shots **592** / host-leak 163/978 / modal host-leak 39/234 / capture clip 147, freeze **280/280** and parity **0 / 0 / 24** carry (not re-run). Numbers as reported by the SC-603 ticket-owner at `5f7c5336` on `da2bdbc6` (independent review LAND with two test gaps added in the fix round, scoped re-review LAND; superproject branch's CHANGELOG commit re-applied onto main by the dispatcher after a CHANGELOG conflict); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `da2bdbc6` (2026-11-12; SC-594 landed on `8b84b635`; code unchanged since r4 and judged by r5; a card's + / - in a hover preview of a heading or block link, or in an embed, is placed through the link the preview was opened for (Obsidian's `hover-link` event, bound once per popover, checked against the popover's own DOM for heading links) or the embed's `src`, confirmed by the note TEXT (a heading hover's hanging line must be that ATX heading in the text, headings counted in the text), else the host's own last write, else refused with the existing dropped-write Notice; forms unchanged (SC-596); known limit SC-607 (a still-open preview follows what its link names now, with a fresh cache); no CSS change; new lifecycle scenario G-S92 (58 scenarios, SIX `--only` parts: part 5 `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S91`, part 6 `G-S92`); filed SC-607):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **7671 passed / 2 skipped / 264 of 265 suites** in a fresh worktree (8b84b635's 7341 + 330) · lifecycle **58/58** (six `--only` parts 21 + 16 + 9 + 4 + 7 + 1; wall 183 s / 322 s / 423 s / 299 s / 393 s / 103 s, loadavg 1-6) · e2e **`OBSIDIAN-E2E done: 272/276 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs`** (126 s) · `styles.css` sha256 `5e5ff488…dc2b27` byte-identical to a clean `8b84b635` build, so shots **592** / host-leak 163/978 / modal host-leak 39/234 / capture clip 147, freeze **280/280** and parity **0 GAPs / 0 undeclared / 24 DECLARED** carry (not re-run). Mutants: every one killed except mM (equivalent) (`sc594-r4-mutants.log`, `sc594-r6-mutants.log`: mZ6, a `#tag` line counted as a heading, now dies). Numbers as reported by the SC-594 ticket-owner at `da2bdbc6` on `8b84b635` (design round, implementer, independent review, fix round, scoped re-review passing the product code, a final docs / test / rebase round checked by the owner by range-diff; superproject branch's three CHANGELOG commits squashed onto main by the dispatcher after a CHANGELOG conflict); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `8b84b635` (2026-11-11; SC-598 landed on `b5d18f79`: a second click inside a window opened from a hover preview, right after the click that opened it, no longer closes the window and the preview (the stamina bar's numbers, the montage cell text, labelled buttons: the helper's 150 ms path); a quick double-click on the stamina numbers still closes the window as in a note, the preview now stays (SC-604 asks whether the window should); `managedModal.ts` only, new lifecycle id G-S91; a window opened again from the same, already focused preview no longer switches the preview to the note's source text):**
tsc and lint clean · jest **7341 passed / 2 skipped** in a fresh worktree (+13 over SC-589's 7328: 10 in `managedModal.test.ts`, 3 in `stamina-bar.test.ts`; the 6 SC-597 one-click assertions updated, not added; the `.is-editing` test rewritten in r4) · lifecycle **57/57** (five `--only` parts 21 + 16 + 9 + 4 + 7; wall 184 / 323 / 404 / 297 / 395 s, loadavg 1-14) · e2e **`OBSIDIAN-E2E done: 272/276 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs`** (139 s; RECOV-R07 passed) · styles.css sha256 `5e5ff488…` identical to the `b5d18f79` build, so shots **592**, host-leak 163/978, modal host-leak 39/234, capture clip 147, freeze **280/280** and parity **0 GAPs / 0 undeclared / 24 DECLARED** carry (not re-run). G-S91 (6 trials) red on the `b5d18f79` bundle (6/6), `reopen rv` alone red on the r2 head, green on the r6 head; the part-5 gaps were 103 / 110 / 110 / 67 ms (title rv, title lp, apply rv, reopen rv; loadavg up to 14) and 130 / 131 ms for the queued double-clicks. Numbers as measured by the SC-598 r6 implementer (independent review LAND with one MEDIUM, the re-open editor switch, fixed; scoped re-review LAND; superproject branch's two CHANGELOG commits already on main, pointer bump only); filed SC-604, SC-606; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `b5d18f79` (2026-11-11; SC-589 landed on `e0e49d4d`; in Reading view and the pinned sidebar tracker a half-typed Malice quick-add (amount and label) survives every whole-tracker rebuild (Advance round, Make/Relieve captain, Reset turns, Reset encounter, the + / − stepper, collapsing the section): a per-view draft with the caret restored, never written to the note, emptied by Add; in the pinned sidebar tracker an outside change to the note now hands focus and caret back to the box being typed in and never pulls focus in (found in review); Live Preview still loses the draft when the tracker's own save redraws the block (filed SC-605, same cause as SC-602); the SC-437 jest marker `[M10]` is a plain test plus 24 new jest cases, each red on the base; new e2e INIT-M10 and INIT-M11; fix in `src/elements/initiative/view.ts`; no lifecycle id used (G-S93 free)):**
tsc and lint clean · jest **7328 passed / 2 skipped** in a fresh worktree · lifecycle **56/56** (21 + 16 + 9 + 4 + 6) · e2e **`OBSIDIAN-E2E done: 272/276 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs`** (known bugs SC-257, SC-355, SC-384, SC-580) · `styles.css` sha256 identical to the base, so shots **592** / host-leak 163/978 / modal host-leak 39/234 / capture clip 147, freeze **280/280** and parity **0 / 0 / 24** carry. Numbers as reported by the SC-589 ticket-owner at `b5d18f79` on `e0e49d4d` (independent review FIX on wording, fix round, scoped re-review LAND, a final test-only round reviewed by the owner; superproject branch already on main, pointer bump only); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `e0e49d4d` (2026-11-11; SC-588 landed on `ce4937ef`; in Reading view keyboard focus now stays in the initiative tracker after the actions that rebuild the whole tracker (Advance round, Make/Relieve captain, Reset turns, Reset encounter → Yes, Enter in the Malice quick-add): the control that replaced the pressed one takes focus; a mouse click never pulls focus in, nor does a rebuild that starts while focus is elsewhere; Live Preview still loses focus when the note saves about half a second later (filed SC-602, every element); also filed SC-603 (focus drops after Apply in the minion pool modal or a roster cell edit); INIT-F01 is a plain test and SC-588 is off the known-bug list; new e2e pairs (coverage 164 → 169); no lifecycle id used (G-S88 free)):**
tsc and lint clean · jest **7304 passed / 2 skipped** in a fresh worktree · lifecycle **56/56** (carried from the reviewed commit) · e2e **`OBSIDIAN-E2E done: 270/274 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs`** (RECOV-R07 passed) · shots **592**, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze **280/280** · parity **0 GAPs / 0 undeclared / 24 DECLARED** (lifecycle, shots, freeze and parity carried: built `main.js` and `styles.css` byte-identical before and after the last rebase). Numbers as reported by the SC-588 ticket-owner at `e0e49d4d` on `ce4937ef` (independent review: no code defect, one MEDIUM became SC-602, two LOW folded in; scoped re-review LAND-READY; owner range-diff of the final rebase 3/3 unchanged; superproject branch's two CHANGELOG commits squashed onto main by the dispatcher after a CHANGELOG conflict); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `ce4937ef` (2026-11-11; SC-570 landed on `e5b6f9f2`; test code only, plugin untouched: e2e RECOV-R07 settles and pins the popover's stepper write before it presses Catch breath (it failed once under load: the stepper write flushed after the mark and counted as Catch breath's); three jest cases pin the popover steppers then Catch breath at 399 ms / after the window / with the stepper write in flight, asserting each write's content; SC-517 closed as a duplicate; no CHANGELOG entry; no lifecycle id used (G-S90 free)):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **7286 passed / 2 skipped** in a fresh worktree (7283 / 2 at `e5b6f9f2` + 3) · lifecycle **56/56** (21 + 16 + 9 + 4 + 6) · e2e **`OBSIDIAN-E2E done: 264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`** · shots **592**, host-leak 163 / 978, modal host-leak 39 / 234, capture clip 147 · freeze **280/280** · parity **0 GAPs / 0 undeclared / 24 DECLARED** (shots / freeze / parity carried from `e5b6f9f2`: `main.js` sha256 `3c44cb8b…b536238` and `styles.css` sha256 `5e5ff488…dc2b27` are byte-identical to a clean `e5b6f9f2` build). Numbers as reported by the SC-570 ticket-owner at `ce4937ef` on `e5b6f9f2` (run by the implementer, re-run by an independent reviewer: 0 HIGH, 0 MED, 1 LOW fixed in this note, 4 INFO dropped; superproject fast-forwarded, pointer bump only); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `e5b6f9f2` (2026-11-11; SC-597 landed on `79da77f8`; Enter or Space on the stamina bar, or on a montage board cell, now activates it with a click (`bar.click()` / `cell.click()`), so the Stamina window / Montage log sheet opened from a hover preview by the keyboard stays open exactly like a mouse-opened one (before, the popover's hover timer hid the preview and the modal about 300 ms after the key); the montage cell's keydown also got the stamina bar's guards (target is the cell, no Ctrl/Meta/Alt, no held key, not default-prevented; the only user-visible one is Ctrl/Cmd/Alt+Enter no longer opening the sheet); a comment-only reword in `managedModal.ts`; new lifecycle scenario G-S87 (56 scenarios, part 5 `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87`); no CSS change; filed SC-601):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **7283 passed / 2 skipped / 262 of 263 suites** in a fresh worktree (+22 over SC-592's 7261 fresh: 10 in `stamina-bar.test.ts`, 12 in `montage.test.ts`) · lifecycle **56/56** (five `--only` parts 21 + 16 + 9 + 4 + 6; wall 184 s / 327 s / 417 s / 301 s / 347 s, loadavg 1-9; G-S87 alone about 48 s with the build and the Obsidian start-up; red on the `94133a5a` bundle (plugin source identical at `79da77f8`): all four trials fail at the 1.5 s step (preview and modal both gone), green on the fixed bundle) · e2e **`OBSIDIAN-E2E done: 264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`** (125 s) · `styles.css` sha256 `5e5ff488…` byte-identical to a clean `79da77f8` build, so shots **592** / host-leak 163/978 / modal host-leak 39/234 / capture clip 147, freeze **280/280** and parity **0 / 0 / 24** carry. Mutants: 23 of 23 killed in jest (K1-K5 per opener, K6 in `managedModal.ts`, each keydown guard per opener); an independent review (r3) measured the same in real Obsidian (the helper arms 10 ms for `el.click()`, Escape 116 ms after the key closes only the modal). Numbers as measured by the SC-597 r4 implementer on the branch rebased onto `79da77f8` (range-diff 4/4 `=`; superproject branch's two CHANGELOG commits already on main, pointer bump only); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `79da77f8` (2026-11-11; SC-592 landed on `4f0c87f2`; the initiative block's save code (`src/elements/initiative/model.ts`, the only source file changed) kept rewriting conditions typed as plain names (`- grabbed`) into `- key: grabbed` on every save, including saves that touch no condition such as Malice +1; plain-string conditions now stay plain strings, authored condition objects keep unknown keys (e.g. `source: trap`) and key order, and removing one condition in the minion pool modal deletes only that line; new e2e steps POOL-C09 and POOL-C10 (both red on the old code), COND-R06 reads a plain-name condition back as a string; owner ruled the rewrite unintended (SC-466 precedent); filed SC-599 (every save still drops quotes and `# comments` and splits one-line lists) and SC-600 (a creature group whose instance list does not match its `amount` loses its conditions); no lifecycle id used (G-S86 free)):**
tsc and lint clean · jest **7262 passed / 1 skipped** (css cached; about 7261 / 2 in a fresh worktree) · lifecycle **55/55** (21 + 16 + 9 + 4 + 5) · e2e **`OBSIDIAN-E2E done: 264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`** · shots **592**, `button host-leak OK (163 … 978 …)`, modal host-leak 39 kinds / 234 comparisons, `capture clip OK (147 …)` · freeze **280/280** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. tsc, lint, jest and e2e run on `79da77f8` by the implementer and the independent reviewer each; lifecycle, shots, freeze and parity carried from `1c66c5ca` (source diff since is a comment only, styles identical, reviewer-verified). Numbers as reported by the SC-592 ticket-owner (review r1 LAND-READY with two LOW and an INFO folded in, r2 scoped re-review clean; superproject branch already on main, pointer bump only); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `4f0c87f2` (2026-11-11; SC-593 landed on `94133a5a`; test code only, under `e2e/`, the plugin untouched: the e2e census (`e2e/driver/census.ts` `eventfulNodes`) asks CDP once per top-level scope element instead of once per node (380-526 round trips per initiative tracker scan down to 3), CENSUS-07 scans the open title editor once and asserts twice, and a listener CDP cannot tie to an element now stops the census with an error instead of being skipped; CENSUS-07 alone about 1.2 s quiet (was about 6 s) and about 10 s at loadavg 50-61 (was 42.6 s or the 45 s timeout), timeout kept at 45 s; old and new scans identical on all 13 census scans; no CHANGELOG entry; no lifecycle id used (G-S85 free)):**
tsc and lint clean · jest **7239 passed / 1 skipped** (css cached; 7238 / 2 in a fresh worktree) · lifecycle **55/55** (21 + 16 + 9 + 4 + 5) · e2e **`OBSIDIAN-E2E done: 262/267 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`** · shots **592**, `button host-leak OK (163 … 978 …)`, modal host-leak 39 kinds / 234 comparisons, `capture clip OK (147 …)` · freeze **280/280** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-593 ticket-owner at `4f0c87f2` on `94133a5a` (independent review, one fix round, scoped re-review LAND-READY; superproject fast-forwarded, pointer bump only); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `94133a5a` (2026-11-11; SC-595 landed on `ec26b709`; a click inside a block edit form (or any DseModal: Stamina, Conditions, minion pool, Reset encounter, Montage sheets, hero Stamina / Edit definition, free-heal confirm) opened from a hover preview no longer hides the preview and closes the modal: the modal guards clicks at its document (composedPath, bubble, stopPropagation; the guard outlives close by one task, so Cancel / Confirm / Apply do not hide the preview either) and Escape closes it (keymap scope re-pushed after the popover's own 10 / 150 ms push); only when the opener sits in `.hover-popover`; no write path changed; new lifecycle scenario G-S83 (55 scenarios, part 5 `G-S59 G-S49 G-S73 G-S77 G-S83`); no CSS change; filed SC-597, SC-598):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **7238 passed / 2 skipped / 261 of 262 suites** in a fresh worktree (+32 over `ec26b709`'s 7206 fresh-worktree count) · lifecycle **55/55** (five `--only` parts 21 + 16 + 9 + 4 + 5; wall 186 s / 324 s / 404 s / 298 s / 304 s; G-S83 alone about 64 s; red on the `eaa8742a` bundle, on the `0f5c9c98` bundle for the r4 steps, and on an M16 bundle for the `stamtext` step) · e2e **`OBSIDIAN-E2E done: 262/267 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`** (172 s) · `styles.css` sha256 `5e5ff488…` byte-identical to a clean `ec26b709` build, so shots **592** / host-leak 163/978 / modal host-leak 39/234 / capture clip 147, freeze **280/280** and parity **0 / 0 / 24** carry. Numbers as measured by the SC-595 r8 implementer (independent review rounds asked for fixes twice, the final re-check LAND with one INFO folded in; superproject branch already on main, pointer bump only); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `ec26b709` (2026-11-11; SC-574 landed on `c3fd8323`; custom conditions now appear in the minion pool modal with the same dashed-circle fallback icon the initiative tracker uses, and a click removes them; a click removes the clicked entry by its position (a safeguard: the double removal of a repeated plain-text condition never happened in the app, since reading a note already makes each copy its own entry, and the CHANGELOG mentions only the custom-condition fix); new e2e steps POOL-C07 and POOL-C08 with a squad-custom fixture; no lifecycle id used (G-S84 free)):**
tsc and lint clean · jest **7207 passed / 1 skipped** · lifecycle **54/54** · e2e **`OBSIDIAN-E2E done: 262/267 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`** · shots **592**, `button host-leak OK (163 … 978 …)`, modal host-leak 39 kinds / 234 comparisons, `capture clip OK (147 …)` · freeze **280/280** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Lifecycle, shots, freeze and parity measured at `580c9f84`; `ec26b709` changes only tests and the CHANGELOG (src identical). Numbers as reported by the SC-574 ticket-owner at `ec26b709` on `c3fd8323` (review r1 asked for a MEDIUM wording fix and a LOW test case, both folded in r2; scoped re-review LAND-READY; superproject fast-forwarded, pointer bump only); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `c3fd8323` (2026-11-11; SC-578 landed on `6c7216e8`; the initiative tracker's Malice log records the change the pool actually made, and when the pool stopped at 0 the entry also keeps the amount asked for in a new optional `requested` field, shown as `R2: -2 — Spend (-5, capped at 0)`; a change that applies nothing is still logged (`R3: 0 — Round gain (-3, capped at 0)`), a zero amount reads `0` not `+0`; one shared `applyMaliceChange` for Advance round and the quick-add; entries that were not capped look and save as before; the −/+ stepper still writes no log entry; INIT-M09 is a plain e2e test and SC-578 is off the known-bug list; no lifecycle id used (G-S82 free)):**
tsc and lint clean · jest **7200 passed / 1 skipped** · lifecycle **54/54** (21 + 16 + 9 + 4 + 4) · e2e **`OBSIDIAN-E2E done: 260/265 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`** · shots **592**, `button host-leak OK (163 … 978 …)`, modal host-leak 39 kinds / 234 comparisons, `capture clip OK (147 …)` · freeze **280/280** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-578 ticket-owner at `c3fd8323` on `6c7216e8` (Opus review r2 APPROVE, two LOW fixed in r3, scoped re-review r4 APPROVE; superproject branch's two CHANGELOG commits squashed onto main by the dispatcher after a CHANGELOG conflict); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `6c7216e8` (2026-11-11; SC-573 landed on `eaa8742a`; the minion pool modal enables Apply when the pool is at 0, or hand-edited below 0, with minions still alive: the label reads "Kill N minion(s)", an info line reads "The pool is at 0, so N minion(s) die.", and Apply marks those minions dead and writes the pool as 0; a negative pool counts as 0 for the stepper, the staged change and Apply (`currentPool()`); pools above 0 behave as before (the re-review compared 2438 modal states against develop, none differ); the SC-435 `test.failing` marker is now a plain test; new e2e step POOL-K07 with fixture `e2e/vaults/shipped/Initiative/squad-empty.md`; no lifecycle id used (G-S81 free)):**
tsc and lint clean · jest **7191 passed / 1 skipped** · lifecycle **54/54** (part 5 `G-S59 G-S49 G-S73 G-S77`) · e2e **`OBSIDIAN-E2E done: 259/265 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs`** · shots **592**, `button host-leak OK (163 … 978 …)`, modal host-leak 39 kinds / 234 comparisons, `capture clip OK (147 …)` · freeze **280/280** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-573 ticket-owner at `6c7216e8` on `eaa8742a` (review r1 LAND with one LOW and four INFO folded in, scoped re-review r2 LAND; superproject fast-forwarded, pointer bump only); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `eaa8742a` (2026-11-11; SC-584 landed on `93b3a382`; a block edit form opened right after a + on a card in a hover preview or an embed is pinned at the position of the host's own + write (`lastWrite`, recorded inside `Vault.process`; judged by `mapLine` / `pinnedTarget` like any pin): for a card that is a block on its own the link and the text come first and the record is the last step, for a card whose section window is anything but its own plain fenced block (callout, quote, nested quote, list item, footnote) the record is the pin, so two counters that read the same after the + save the lower one; a `![[note#^id]]` embed of a callout looks for its `^id` after the end of the part (a plain fenced block keeps its old rule); new lifecycle scenario G-S77 (54 scenarios, part 5 `G-S59 G-S49 G-S73 G-S77`), G-S64 phases (zk) (zl) (zm) (zn) (xc) (yc) (xd) (yd) plus the smoke check (zc), no CSS change):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **7177 non-skipped passed / 2 skipped / 260 of 261 suites** in a fresh worktree (7176 in the full run plus the SC-568 load timeouts, `initiative-default-keys` and `twin-reuse`, 78/78 green alone; the pin suite is 145 tests, 74 on the base) · lifecycle **54/54** (five `--only` parts 21 + 16 + 9 + 4 + 4; wall 187 s / 341 s / 444 s / 313 s / 272 s, loadavg 3-14; G-S77 alone about 60 s) · e2e **`OBSIDIAN-E2E done: 258/264 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs`** on the second full run (346 s; the first run failed RECOV-R07 (SC-517 / SC-570) at loadavg 12-21, which also failed alone at loadavg 21: a load flake) · `styles.css` sha256 `5e5ff488…` byte-identical to a clean `93b3a382` build, so shots **592** / host-leak 163/978 / modal host-leak 39 kinds / 234 comparisons / capture clip 147, freeze **280/280** and parity **0 / 0 / 24** carry. Red-on-base references, the 36-cell sweep table and the mutant list (killed 1-38 tests each; mF mL mN equivalent) are those of the r7 round on `f2889351` / `b4e7b4f4`: the host source, G-S77 and the pin suite are unchanged by the rebases (range-diff: every code commit `=`, the two CHANGELOG commits differ only by SC-577's bullet above them). Numbers as measured by the SC-584 r9 implementer (four independent review rounds, the last with no findings; superproject branch's four CHANGELOG commits squashed onto main by the dispatcher after a CHANGELOG conflict); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `93b3a382` (2026-11-11; SC-577 landed — Malice in the initiative tracker never goes below 0: the − stepper is disabled at 0 (it wrote `value: -1`), a negative `round_gain` floors at 0 and the round button reads "Advance round (-3 Malice)" not "(+-3 Malice)", a hand-edited negative value counts as 0 in the editable and read-only views (one shared floored helper for Advance round and the quick-add); the manifest declares the disabled − click INIT-M07 as a covered pair (coverage 163 → 164); SC-578 noted that Advance round now shares the quick-add's clamped-log gap; no lifecycle id used (G-S79 free)):**
tsc and lint clean · jest **7107 passed / 1 skipped** · lifecycle **53/53** · e2e **`OBSIDIAN-E2E done: 258/264 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs`** (SC-577 out of the known-bug list) · shots **592**, 0 FAIL, `button host-leak OK (163 … 978 …)`, `modal button host-leak OK (… 39 … 234 …)`, `capture clip OK (147 …)` · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-577 ticket-owner at `93b3a382` on `f2889351` (implementer and reviewer measured jest and e2e independently, same numbers; review plus a re-review clean; superproject branch rebased onto main by the dispatcher, CHANGELOG-only, no conflict); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `f2889351` (2026-11-11; SC-567 landed — when the damage drops below the number of ticked minions, the minion pool modal unticks the surplus boxes, latest pick first, so Apply is enabled again and kills only the boxes still ticked (owner chose this over keeping the ticks and rewording the tooltip, offered Scott the swap on the ticket); new e2e POOL-K06 drives the trim end to end; SC-573, SC-574, SC-591, SC-592 untouched; no lifecycle id used (G-S80 free)):**
tsc and lint clean · jest **7098 passed** (two SC-568 timeouts under full load, green on re-run) · lifecycle **53/53** · e2e **`OBSIDIAN-E2E done: 256/263 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs`** (+1 ok, POOL-K06) · shots **592**, 0 FAIL, `button host-leak OK (163 … 978 …)`, `modal button host-leak OK (… 39 … 234 …)`, `capture clip OK (147 …)` · freeze **`freeze OK (280/280 …)`** (no hash moved) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-567 ticket-owner (shots, freeze, parity measured on the first fix commit `dee48526`; later commits are tests and CHANGELOG only; independent review plus a scoped re-check clean); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `b4e7b4f4` (2026-11-11; SC-566 landed — the minion pool modal's Apply label and info line state the damage the pool actually loses (overkill: "Deal 20 damage, kill 5 minion(s)", not 495; a hand-edited negative pool reads 0, never a flipped sign); the preview bar still shows the full damage and what Apply writes is unchanged (byte-identical notes in 39 reviewer scenarios); the jsdom SC-566 marker is a plain test and e2e POOL-A02 checks the Apply label; the SC-567, SC-573, SC-574 markers still fail as before; no lifecycle id used (G-S78 free)):**
tsc and lint clean · jest **7088 passed / 1 skipped** (one SC-568 timeout under load, green alone) · lifecycle **53/53** · e2e **`OBSIDIAN-E2E done: 255/262 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs`** (third run; the first two each failed only RECOV-R07, the documented load flake, green alone) · shots **592**, 0 FAIL, `button host-leak OK (163 … 978 …)`, `modal button host-leak OK (… 39 … 234 …)`, `capture clip OK (147 …)` · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-566 ticket-owner at `b4e7b4f4` on `734d7745` (independent review plus a scoped re-review of the fix-ups); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `734d7745` (2026-11-11; SC-575 landed — Reset encounter clears a minion squad's shared action pips; the jest `test.failing` X07 in `test/dom/elements/initiative-matrix.test.ts` and e2e INIT-X07 are plain tests (INIT-X07 also asserts the on-screen pips); three unit cases in `test/unit/model/encounter-data.test.ts`; whether Reset should undo a captain promoted mid-fight stays SC-590; no lifecycle id used (G-S76 free)):**
tsc and lint clean · jest **7085 passed / 1 skipped** (worktree with the shots CSS cache; a fresh worktree reads 2 skipped; +3 over `a339e7b3`; two SC-568 timeouts at loadavg 27, green alone with `-w 2`, 78/78) · lifecycle **53/53** (21 / 16 / 9 / 4 / 3; part 5 `G-S59 G-S49 G-S73`) · e2e **`OBSIDIAN-E2E done: 255/262 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs`** · shots **592**, 0 FAIL, `button host-leak OK (163 … 978 …)`, `modal button host-leak OK (10 … 9 … 39 … 234 …)`, `capture clip OK (147 …)` · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as measured post-rebase at `734d7745` and reported by the SC-575 ticket-owner (independent review and scoped re-review LAND-READY; range-diff identical over the rebase); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `a339e7b3` (2026-11-11; SC-572 landed — each condition icon in the minion pool modal is a real button named "Remove <condition>" (built like the initiative tracker's condition icons); Enter and Space remove it; after a keyboard removal focus stays in the modal (next icon, else the previous one, else the damage field so a second Enter cannot reset the staged damage); a mouse click behaves as before; the tooltip reads "Remove Bleeding"; new e2e POOL-C05 (Space removes a condition) and POOL-C06 (removing a minion's only condition); the SC-572 known-bug markers are plain tests; filed SC-591, SC-592, SC-593 (CENSUS-07 can time out under heavy load)):**
tsc and lint clean · jest **7082 passed / 1 skipped** (worktree with the shots CSS cache; SC-568 load timeouts in full runs, green alone) · lifecycle **53/53** · e2e **`OBSIDIAN-E2E done: 254/262 ok, 0 failed, 8 known-bug, coverage: 163/163 pairs`** · shots **592**, 0 FAIL, every image byte-identical to an unchanged render, `button host-leak OK (163 … 978 …)`, `modal button host-leak OK (… 39 … 234 …)`, `capture clip OK (147 …)` · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-572 ticket-owner at `a339e7b3` (rebased over SC-576 and SC-480 with no conflicts, range-diff unchanged; final scoped re-review clean); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `eeed5182` (2026-11-11; SC-480 landed — a card write (a + / - click) whose pin cannot be placed because its block was deleted from outside is never written into another block: the fallback is used only when the block's body was unique in the note as clicked (`pin.text`) and is unique now, and the fallback block was not a different block of the note as clicked whose old body is gone (`landsOnOtherBlock`: one outside edit that deletes the clicked block and makes a neighbour read the same; a swap or reorder of twin-free blocks still lands); else nothing is written and the dropped-write Notice shows (`countByBody` beside `locateByBody`; form Saves stay pin-only, an unpinned card write keeps today's path; a refused click whose block is still in the note stays on the card, owner ruling C); lifecycle G-S73 (18 trials), no CSS change):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **7074 passed / 2 skipped / 258 of 261 suites** in a fresh worktree, plus the two SC-568 timeouts (`initiative-default-keys`, `twin-reuse`: 78/78 alone) = 7076 non-skipped, +20 over `fbaba3da`'s 7056 (the pin suite 74 tests) · lifecycle **53/53** (five `--only` parts 21 + 16 + 9 + 4 + 3; part 5 `G-S59 G-S49 G-S73` 266 s at loadavg 10-14) · e2e **`OBSIDIAN-E2E done: 251/260 ok, 0 failed, 9 known-bug, coverage: 161/161 pairs`** (342 s, loadavg 14-19) · `styles.css` sha256 `4295ca33…` byte-identical to a clean `fbaba3da` build, so shots **592** / host-leak 163/978 / capture clip 147, freeze **280/280** and parity **0 / 0 / 24** carry. Numbers as measured by the SC-480 r6 implementer (independent review final round LAND, 0 findings; superproject branch rebased onto main by the dispatcher, CHANGELOG-only, no conflict); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `fbaba3da` (2026-11-10; SC-576 landed — Reset encounter rebuilds the initiative tracker from a fresh parse of the reset note (the way a reload does) instead of the half-cleared in-memory copy; what Reset writes is unchanged; a failed re-parse draws the reload error card, which clears on the next outside update, pinned sidebar tracker included; the tracker is inert while it re-reads; e2e INIT-X05/X06 and the jsdom `[X05]` marker are plain assertions now; no lifecycle id used (G-S74 free)):**
tsc and lint clean · jest **7056 passed / 1 skipped** · lifecycle **52/52** · e2e **`OBSIDIAN-E2E done: 251/260 ok, 0 failed, 9 known-bug, coverage: 161/161 pairs`** (SC-576 ×2 markers removed, 11 → 9) · shots **592**, 0 FAIL, `button host-leak OK (163 … 978 …)`, `capture clip OK (147 …)` · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-576 ticket-owner at `fbaba3da` (independent review plus fix rounds; final re-review 0 findings above INFO; one full e2e run in the last review failed once in RECOV-R07, a stamina-bar test the change does not touch, green alone and on a second full run — SC-517 / SC-570); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `97a9c93b` (2026-11-10; SC-436 landed — e2e rollout Tier 1: the ConditionsModal is covered in real Obsidian (specs `e2e/specs/conditions-modal/`, driver `e2e/driver/conditions.ts`, fixtures `Initiative/conditions.md` and `Initiative/two-trackers.md`, census `[CENSUS-09]`) and by a jsdom matrix (`test/dom/views/conditions-modal-matrix.test.ts`); `data-dse-control` ids on every ConditionsModal control (`cond.remove`, `cond.option`, `cond.icon`, `cond.color-custom`, `cond.done`; DOM otherwise byte-identical); the native colour chooser is out of CDP reach, so COND-D11 drives Enter as real input and COND-D17 dispatches the chooser's commit page-side; known-bug markers SC-257, SC-355, SC-384, SC-580 (e2e) and SC-581, SC-582, SC-583, SC-585, SC-586 (jsdom)):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **7050 passed / 1 skipped** (worktree with the shots CSS cache; census + matrix suites alone 307/307) · lifecycle **52/52** · e2e **`OBSIDIAN-E2E done: 249/260 ok, 0 failed, 11 known-bug, coverage: 161/161 pairs`** (implementer and reviewer each on `97a9c93b`) · shots **592**, 0 FAIL, `button host-leak OK (163 … 978 …)`, `capture clip OK (147 …)` · freeze **`freeze OK (280/280 …)`** · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-436 ticket-owner (lifecycle, shots, freeze, parity last run on the pre-rebase branch on `f69b8fd6`; the `src/` delta against develop is still only the ConditionsModal attribute lines; independent review plus two re-reviews, the last after the SC-437 rebase, clean); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `32441332` (2026-11-10; SC-437 landed — e2e rollout Tier 1: the initiative tracker (title edit, round / turn, action pips, Malice, selection, captain, reset encounter) is covered in real Obsidian, every manifest pair driven and checked on both the note and the screen, plus a jsdom matrix; `data-dse-control` ids on every interactive node of the tracker (20 new, 29 in all; no behaviour change), both censuses scoped by the tracker root; `dse.blur` takes an optional away target; known-bug markers for SC-575, SC-576 (High: after Reset encounter the screen shows empty enemy groups and heroes at 0 Stamina / DYING while the note is right), SC-577, SC-578, SC-588, SC-589):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6765 passed / 1 skipped / 259 of 260 suites** (worktree with the shots CSS cache) · lifecycle **52/52** · e2e **`OBSIDIAN-E2E done: 199/206 ok, 0 failed, 7 known-bug, coverage: 142/142 pairs`** · shots **592**, 0 FAIL, `button host-leak OK (163 … 978 …)`, `capture clip OK (147 …)` · freeze **`freeze OK (280/280 …)`** · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-437 ticket-owner (lifecycle, shots, freeze, parity at `09644511`; the two commits after it change only tests; independent review r2 → r4 → r6 LAND-READY); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `f69b8fd6` (2026-11-10; SC-556 landed — every block edit form's Save is pin-only: when the form's own block was edited or deleted from outside while it was open, Save writes nothing, the "changed on disk first" Notice shows (never rate limited for a form Save), the form stays open and the outside change is kept; a form in an embed of part of a note finds its block by the embed's own link (`resolveSubpath`, verified against the note), by unique text otherwise, and refuses when it cannot tell; Scott chose option 1; lifecycle G-S64 phases (v) to (z), no new scenario; filed SC-584):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6634 passed / 2 skipped / 258 of 259 suites** on a fresh worktree (plain and `--testTimeout=30000`; a clean `10db67e3` tree measured the same way reads 6588 / 4, so +44; SC-558's 6591 / 1 was a cached-`obsidian-app.css` count) · lifecycle **52/52** (five `--only` parts 21 + 16 + 9 + 4 + 2) · e2e **`OBSIDIAN-E2E done: 163/164 ok, 0 failed, 1 known-bug (SC-572), coverage: 113/113 pairs`** · `styles.css` sha256 `4295ca33…` byte-identical to a clean `10db67e3` build, so shots **592** / host-leak 163/978 / capture clip 147, freeze **280/280** and parity **0 / 0 / 24** carry from `10db67e3`. Numbers as reported by the SC-556 ticket-owner (implementer's full battery at `f69b8fd6`; the independent reviewer re-ran tsc, lint, jest and lifecycle part 3 there with the same results, 21 of 21 mutants caught, verdict LAND); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `10db67e3` (2026-11-10; SC-558 landed — no decorative coloured left stripes in DSE (DESIGN.md rule 7): the error card and the featureblock "Level N Advancement" well are framed all round (the error card's title ink is mixed toward body ink behind an `@supports` gate), the power-roll and montage tier-row stripes, the action-type spine and a dead statblock role rule are gone, and Obsidian's 2px violet blockquote edge is removed from plugin quotes in print; a widened jest guard (inline-start borders, inset shadows) keeps stripes out; SANCTIONED 78-line print rebaseline, see Freeze semantics):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6591 passed / 1 skipped / 258 of 259 suites** (+5 over `2ee2e405`'s 6586 measured the same way, all in `test/dom/theme/steelMaterial.test.ts`; the full run under load also showed the two SC-568 timeouts, both green alone) · lifecycle **52/52** (parts 1-4 on the r2/r3 heads, CSS colour, comments, tests and docs only since; part 5 `G-S59 G-S49` 2/2 on `10db67e3`) · e2e **`OBSIDIAN-E2E done: 163/164 ok, 0 failed, 1 known-bug (SC-572), coverage: 113/113 pairs`** · shots **592**, 0 FAIL, `button host-leak OK (163 … 978 …)`, `capture clip OK (147 …)` · freeze **`freeze OK (280/280 …)`** after the sanctioned 78-line rebaseline (39 ids × `--steel-print` + `--steel-realprint`; implementer and reviewer each matched all 78 hashes against their own renders) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-558 ticket-owner (independent re-review approved the r4 fix round); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `2ee2e405` (2026-11-10; SC-435 landed — e2e rollout Tier 1: the minion stamina pool modal is covered in real Obsidian (scenarios, squad fixtures `Initiative/squad.md` and `squad-hurt.md`, pool driver `e2e/driver/pool.ts`, `minion-pool` modal kind, census) and by a jsdom logic matrix; `data-dse-control` ids on every MinionStaminaPoolModal control (the modal's DOM is otherwise byte-identical); `dse.block()` marks a block edited only on input inside it; known-bug markers for SC-566, SC-567, SC-572, SC-573, SC-574):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6584 passed / 1 skipped** (6586 / 1 measured in a worktree with `--json` by the SC-558 r5 reviewer; +92 over `6153acfe`'s 6492; the full run on a loaded host also showed 2 SC-568 timeouts, `twin-reuse` and `initiative-default-keys`, both 71/71 alone) · lifecycle **52/52** (five `--only` parts; part 5 `G-S59 G-S49` re-run on `2ee2e405` after the SC-561 rebase) · e2e **`OBSIDIAN-E2E done: 163/164 ok, 0 failed, 1 known-bug (SC-572), coverage: 113/113 pairs`** · shots **592**, 0 FAIL, `button host-leak OK (163 … 978 …)` · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-435 ticket-owner (e2e, jest, shots, freeze, parity at `9d446582` on `6270e84a`; tsc, lint, lifecycle part 5 and the two SC-568 suites at `2ee2e405` on `6153acfe`, which differs from `6270e84a` only in `visual-harness/obsidian-lifecycle.mjs`; independent review 0 C/H/M, 5 LOW fixed, scoped re-review clean); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `6153acfe` (2026-11-10; SC-561 landed — lifecycle G-S59 no longer times out under load: the CDP 8x CPU throttle SC-472 added is gone (each write's real ~2 s of style and layout work was stretched past the 30 s cap), G-S59 keeps its 4 s busy spin, phase (c) scrolls in fewer, larger wheel steps and discards and re-runs (at most twice) an attempt whose scroll alone was too slow; harness only, `main.js` sha256 `7aa1638e…` and `styles.css` `16e9aa64…` byte-identical to `6270e84a`):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6492 passed / 1 skipped / 257 of 258 suites** · lifecycle **52/52** (five `--only` parts 21 + 16 + 9 + 4 + 2; part 5 `G-S59 G-S49` 207 s; G-S59 passed 19 of 19 runs across the last two heads at loadavg 4-62) · e2e **`OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`** · shots **592**, 0 FAIL, `button host-leak OK (163 … 978 …)`, `capture clip OK (147 …)` · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-561 ticket-owner (lifecycle and jest at `6153acfe`; e2e, shots, freeze, parity, tsc and lint at the earlier head `d344e1e1`, the last fix touched only G-S59's part of the harness; independent re-review LAND); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `6270e84a` (2026-11-06; SC-526 landed — the Recoveries popover's −, + and Catch breath keep the plugin's own compact look in Obsidian instead of Obsidian's 30px button style (CSS only, SC-203 re-grounding family; Scott chose A); the button host-leak sweep opens the popover by a real click on the hero's markers, last):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6492 passed / 1 skipped / 257 of 258 suites** (+9 over `69b5c0d4`'s 6483) · lifecycle **52/52** (five `--only` parts 21 + 16 + 9 + 4 + 2) · e2e **`OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`** · shots **592**, 0 FAIL, `button host-leak OK (163 … 978 …)`, 34-record boundary unchanged; modal 228, input 15/176, checkbox 7/116, prose 106 [212] unchanged; `capture clip OK (147 …)`; 592 PNGs sha-identical to `69b5c0d4` · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-526 ticket-owner (battery by the r4 implementer at `6270e84a` on `69b5c0d4`; independent review LAND-READY; scoped re-review of the rebase + wording fixes); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `69b5c0d4` (2026-11-06; SC-349 landed — browser print and screen captures taller than the 900×1200 viewport are no longer clipped: `snap()` grows the viewport for the shot, and the new `capture clip OK` in-run gate fails any capture whose element lies outside it (gallery exempt, SC-484); harness-only, no plugin byte change; SANCTIONED 40-line freeze rebaseline, 280 → 280):**
tsc and lint clean · jest **6483 passed / 1 skipped / 257 of 258 suites** (+9 tests, +1 suite: `test/unit/build/captureViewport.test.ts`) · lifecycle **52/52** (five `--only` parts 21 + 16 + 9 + 4 + 2) · e2e **`OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`** · shots **592**, 0 FAIL, button host-leak 161/966, plus `capture clip OK (147 screen … 41 print …)` · freeze **`freeze OK (280/280 …)`** after the SC-349 rebaseline (dispatcher-verified against the landed head's shots) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-349 ticket-owner (r5 implementer at `69b5c0d4` on `7bd8040b`); the dispatcher relayed them and re-ran only the freeze check.

**PREVIOUS — dse `develop` @ `7bd8040b` (2026-11-05; SC-520 landed — a block that is the first thing inside a `> [!note]` callout has its hover menu clickable with the mouse in Live Preview and Reading view: Obsidian's `.callout-content` clip no longer cuts the panel off, in a Live Preview callout the panel sits ~14px further left so Obsidian's `</>` button does not cover Collapse (Scott chose B), and a callout that also holds wide content scrolls sideways as a whole (its title scrolls with it); three rules in the "Element chrome" section of `styles-source.css`, scoped to a callout whose first content child is a Steel screen chrome block; SC-540's `armClickShield` already covers the click path, so no click handler; new lifecycle G-S49 in the fifth part with G-S59):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6474 passed / 1 skipped / 256 of 257 suites** (fresh worktree 6473 / 2; +4 tests, all in `test/dom/framework/chromeLivePreviewClip.test.ts`) · lifecycle **52/52** (five `--only` parts 21 + 16 + 9 + 4 + 2; part 5 `G-S59 G-S49`) · e2e **`OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`** · shots **592**, 0 FAIL, button host-leak 161/966, modal 228, input 15/176, checkbox 7/116, prose 106 [212] · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as measured by the SC-520 r5 implementer at `91e03844` (on `248e202b`); `7bd8040b` only moves G-S49 before G-S56 (lint, tsc, lifecycle parts 4 and 5 re-run green; `main.js` / `styles.css` byte-identical); the dispatcher relayed, not re-ran. G-S59 timed out once in a part-5 re-run and passed on the next (SC-561, also on `develop`); fixed by SC-561: the 8x CPU throttle was taken out of G-S59 and phase (c)'s environment check re-runs a too-slow scroll.

**PREVIOUS — dse `develop` @ `248e202b` (2026-11-05; SC-490 landed — on a Montage board wider than its card the hero column (the "Hero" corner with its + button, and every hero's name with its row-action button) stays pinned at the left edge while the round columns and the Tally scroll under it: sticky, an opaque background that matches the card, a 1px right-edge rule in `--dse-metal-line`; only while the board overflows (`data-overflow="on"`, set by BoardView from a ResizeObserver measurement); Tab and Shift+Tab never land under it; the ≤420px stacked layout and print do not pin; no new lifecycle scenario, G-S13 extended; the fill literals are coupled to `--dse-card-bg` by comments and a jest guard):**
tsc and lint clean · jest **6470 passed / 1 skipped / 256 of 257 suites** (fresh worktree 6469 / 2; +10 tests over `d689b719`'s 6460, all in `test/dom/elements/montage.test.ts`) · lifecycle **51/51** (five `--only` parts 21 + 16 + 9 + 4 + 1; G-S13 now also asserts the pinned column on every sampled frame of every write, rebuild and adoption) · e2e **`OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`** · shots **592**, 0 FAIL, button host-leak 161/966, plus the extended `montage board scroll OK` line (four contexts: fine/coarse × dark/light; see "Montage board-scroll gate" above) · freeze **`freeze OK (280/280 …)`** (no rebaseline; all 34 `montage*` screen + print PNGs byte-identical to a base render) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-490 ticket-owner (r3 implementer at `248e202b`, the approved `e4f394fa` rebased onto `d689b719` with range-diff all `=`); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `d689b719` (2026-11-03; SC-557 landed — G-S61's stale-frame check is load-aware: a card showing its block's disk value while the editor document has not caught up is not counted, capped at 1000 ms; a failed or 3-frames-torn disk read fails the phase; harness-only, no user-visible change):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6460 passed / 1 skipped / 256 of 257 suites** (fresh worktree 6459 / 2; unchanged) · lifecycle **51/51** (five `--only` parts 21 + 16 + 9 + 4 + 1) · e2e **`OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`** · `main.js` / `styles.css` byte-identical to a `31d8f779` build, so shots 592 0 FAIL 161/966, freeze 280/280 and parity 0 GAPs / 0 undeclared / 24 DECLARED carry. G-S61 alone on the green build under 12 busy loops: before SC-557 (e) failed in 3 of 8 runs; after it 0 FAIL in 26+ loaded runs (loadavg up to 26; max catching-up run 6 frames / 117 ms) and 0 counted stale frames. Numbers as reported by the SC-557 ticket-owner (lifecycle/e2e/jest at `f2f25f9f`, tsc/lint + lifecycle part 4 at `d689b719`; later commits change only the G-S61 recorder); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `31d8f779` (2026-11-03; SC-552 landed — a block edit form opened on one of several identical blocks saves into the block it was opened on (before: one block down after a click inside the 400 ms debounce, an outside edit or Sync; with two identical blocks the form on the lower one closed by itself with nothing saved); the form stays open when the redraw throws its view away, but only while its note is still on screen; a card click followed within 400 ms by typing or an outside edit above it counts in the block clicked (SC-549); new lifecycle G-S64, after SC-545's G-S63):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6460 passed / 1 skipped / 256 of 257 suites** (cached `obsidian-app.css`; +45 tests, +2 suites over 09ece2eb's 6415/1/254 of 255) · lifecycle **51/51** (FIVE `--only` parts 21 + 16 + 9 + 4 + 1; 189 s, 324 s, 341 s, 294 s, 166 s) · e2e **`OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`** · `styles.css` byte-identical to `09ece2eb`'s, so shots 592 0 FAIL 161/966 (modal 228, input 15/176, checkbox 7/116, prose 106 [212]), freeze 280/280 and parity 0 GAPs / 0 undeclared / 24 DECLARED carry (last run on `0698550f` + SC-552 with the same `styles.css`). Numbers as measured by the SC-552 r6 implementer at `31d8f779`, confirmed by its r7 reviewer at low load; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `09ece2eb` (2026-11-03; SC-545 landed — turning Draw Steel Elements off and back on no longer leaves cards in Live Preview callouts and embeds unclickable: the unloading instance stashes each card's widget context on its element and the new instance redraws it at layout-ready (a card that was off the page at the toggle, when its widget comes back), with a `setViewData` rebuild only for a note that still holds an undrawn block; new lifecycle G-S63; `host/replugRemount.ts`):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6415 passed / 1 skipped / 254 of 255 suites** (fresh worktree expected 6414 / 2, inferred not measured; +32 tests, +1 suite) · lifecycle **50/50** (five `--only` parts 21 + 16 + 8 + 4 + 1; 182 s, 322 s, 305 s, 296 s, 167 s) · e2e **`OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`** · shots **592**, 0 FAIL, button host-leak 161/966, modal 228 (private `DSE_CAMERA_TMP`) · freeze **`freeze OK (280/280 …)`** (no rebaseline; no CSS change) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as measured by the SC-545 r6 implementer on branch head `09ece2eb` (rebased onto `ea78ebf8`); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `ea78ebf8` (2026-11-03; SC-547 landed — the Live Preview identical-callout check builds each callout's fence list once per pass (a per-`reconcile` `PassMemo`), so its cost grows linearly with the blocks in a callout: 40-block callout ~7 ms → ~0.9 ms per keystroke, scroll frame back to pre-SC-537; also checks every kind in a callout holding two or more blocks of two kinds; no new lifecycle scenario):**
jest **6383 passed / 1 skipped / 253 of 254 suites** (fresh worktree 6382 / 2; +5 tests) · every other number is the `0698550f` one, unchanged — tsc and lint clean · lifecycle **49/49** (five `--only` parts 21 + 16 + 7 + 4 + 1) · e2e **`OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`** · `styles.css` byte-identical to `0698550f`, so shots 592 0 FAIL 161/966, freeze 280/280 and parity 0 GAPs / 0 undeclared / 24 DECLARED carry (last full run on `cb56f128`, same CSS). Numbers as reported by the SC-547 ticket-owner at `ea78ebf8`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `0698550f` (2026-11-02; SC-472 landed — a scroll pin / hold is released by the redraw it protects, with a load-aware backstop (2.5 s + 30 painted frames, 20 s cap); a reader's scroll is not a redraw; a leaf that navigates drops its pin; the first pin no longer adds the scroller's 64 px of padding; new lifecycle G-S59):**
tsc and lint clean · jest **6378 passed / 1 skipped / 253 of 254 suites** (fresh worktree 6377 / 2; +52 tests over `367a2f1d`'s 6326: 12 in the new `redrawBackstop.test.ts`, +40 in the pin / hold files, 10 of the existing ones rewritten) · lifecycle **49/49** (five `--only` parts 21 + 16 + 7 + 4 + 1) · e2e **`OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`** · shots **592**, 0 FAIL, button host-leak 161/966 · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as measured by the SC-472 r8 implementer at `0698550f` (rebase onto `367a2f1d`, textual merge only; final review r7 approved with 0 HIGH / 0 MEDIUM); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `367a2f1d` (2026-11-02; SC-551 landed — lifecycle and the obsidian-shots camera start Obsidian on an OS-assigned CDP port and talk only to a port their own Obsidian reported and owns (`scripts/cdp-owned.mjs`), so two runs started together never share an Obsidian; docs-shots passes the camera's exit 2 through; harness-only, no user-visible change):**
jest **6326 passed / 1 skipped / 252 of 253 suites** (fresh worktree 6325 / 2; +19 tests, +1 suite) · every other number is the `711f740d` one, unchanged — tsc and lint clean · lifecycle **48/48** (four `--only` parts 21 + 16 + 7 + 4; a private port per part is no longer needed) · e2e **`OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`** · `main.js` / `styles.css` byte-identical to `711f740d`, so shots 592 0 FAIL 161/966, freeze 280/280 and parity 0 GAPs / 0 undeclared / 24 DECLARED carry. Numbers as reported by the SC-551 ticket-owner (lifecycle at `45eef821`, e2e at `38b4f856`, tsc/lint/jest at `367a2f1d`; later commits test-only); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `711f740d` (2026-11-02; SC-544 landed — two quick clicks on identical blocks each count in the block you clicked, in Live Preview (callouts and plain fences) and Reading view, one pane or two; new lifecycle G-S61; `ViewRegistry.flushPendingWrites` with a re-entrancy guard):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6307 passed / 1 skipped / 251 of 252 suites** (fresh worktree 6306 / 2) · lifecycle **48/48** (four `--only` parts 21 + 16 + 7 + 4, each with its own `DSE_LIFECYCLE_PORT`; 187 s, 326 s, 254 s, 295 s) · e2e **`OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`** · shots **592**, 0 FAIL, button host-leak 161/966 (34-record boundary), modal 228, input 15/176, checkbox 7/116, prose 106 [212] · freeze **`freeze OK (280/280 …)`** (no rebaseline; no CSS change) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as measured by the SC-544 r6 implementer on the branch rebased onto `f7c9c7ce` (G-S57 + G-S62 + G-S61 together 3/3); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `f7c9c7ce` (2026-11-02; SC-540 landed — in Live Preview, clicking a control on a card inside a callout (including buttons that redraw the whole card, such as Advance round) no longer turns the callout into its markdown, and Advance round in a tracker inside an embed no longer selects the embed; new lifecycle G-S62):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6297 passed / 1 skipped / 251 of 252 suites** (cached `obsidian-app.css`; a fresh worktree reads one fewer passed and 2 skipped) · lifecycle **47/47** (three `--only` parts 21 + 16 + 10) · e2e **`OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`** (plus the `pointer parked at 0,0` line) · shots **592**, 0 FAIL, button host-leak 161/966 (34-record boundary), modal 228, input 15/176, checkbox 7/116, prose 106 [212] · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as measured by the SC-540 r5 implementer at `f7c9c7ce`; reviewer r4 LAND on `31b6235b`, r6 LAND on `f7c9c7ce` (range-diff 7 `=`, G-S62 alone 3/3); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `eafe76e1` (2026-11-02; SC-511 landed — a keyboard "Unpin from sidebar" (or "Remove panel" on an unavailable panel) hands focus to the panel that took the removed one's place, else the panel above, else the "No pinned blocks" message, instead of dropping it to the page body; a mouse click is unchanged; the note link and that message show the shared focus ring; no new lifecycle scenario):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6287 passed / 1 skipped / 251 of 252 suites** (fresh worktree 6286 / 2; +15 tests, +1 suite) · lifecycle **46/46** (three `--only` parts 21 + 16 + 9; none added) · e2e **`OBSIDIAN-E2E done: 128/128 ok,
0 failed, 0 known-bug, coverage: 89/89 pairs`** (+4 tests, +2 pairs) · shots **592**, 0 FAIL, button host-leak 161/966 · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as measured by the SC-511 implementer at `c37d9b49` (full battery) and re-measured, all matching, by its independent reviewer; the r2 delta (`eafe76e1`: a comment in `focusHandoff.ts` plus the CHANGELOG bullet) re-ran tsc, lint and the two touched jest files (96/96). The dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `423e798d` (2026-11-02; SC-546 landed — e2e, lifecycle and docs-shots use a display only once their own Xvfb has reported it (`scripts/xvfb-owned.mjs`, `-displayfd`), so two runs started together never share a screen; harness-only, no user-visible change):**
jest **6272 passed / 1 skipped / 250 of 251 suites** (fresh worktree 6271 / 2; +10 tests, +1 suite) · every other number is the `eaf64ba6` one, unchanged — tsc and lint clean · lifecycle **46/46** (21 + 16 + 9) · e2e **`OBSIDIAN-E2E done: 124/124 ok,
0 failed, 0 known-bug, coverage: 87/87 pairs`** (run twice) · `main.js` / `styles.css` byte-identical to `eaf64ba6`, so shots 592 0 FAIL 161/966, freeze 280/280 and parity 0 GAPs / 0
undeclared / 24 DECLARED carry. Numbers as reported by the SC-546 ticket-owner (gates at `4b14600d`; `423e798d` is comment and docs only and re-ran tsc, lint and the new test file); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `eaf64ba6` (2026-11-02; SC-534 landed — e2e CHR-L01 hovers once and presses Collapse with the default click; the unused `ClickOptions.cdp` driver option is gone; test-only, no user-visible change):**
every number is the `dabfb518` one, unchanged — tsc and lint clean · jest **6262 passed / 1 skipped / 249 of 250 suites** (fresh worktree 6261 / 2) · lifecycle **46/46** (21 + 16 + 9) · e2e **`OBSIDIAN-E2E done: 124/124 ok,
0 failed, 0 known-bug, coverage: 87/87 pairs`** · `main.js` / `styles.css` byte-identical to `dabfb518`, so shots 592 0 FAIL 161/966, freeze 280/280 and parity 0 GAPs / 0
undeclared / 24 DECLARED carry. Numbers as reported by the SC-534 ticket-owner; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `dabfb518` (2026-11-02; SC-537 landed — in Live Preview, identical callouts each keep their own number, a click writes the callout you clicked, and a form edit on one is no longer erased by a click on the other; new lifecycle G-S57):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6262 passed / 1 skipped / 249 of 250 suites** · lifecycle **46/46** (three `--only` parts 21 + 16 + 9) · e2e **`OBSIDIAN-E2E done: 124/124 ok,
0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592**, 0 FAIL, button host-leak 161/966 (34-record boundary), modal 228, input 15/176, checkbox 7/116, prose 106 [212] · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-537 ticket-owner: tsc/lint/jest/shots/freeze/parity at `dabfb518`, lifecycle and e2e at `aca83702` by its reviewer (rebase + a comment since); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `97284051` (2026-11-02; SC-530 landed — the button host-leak sweep also compares a selected negotiation tier row, a checked track seal, and the vertical (Interest) track seals, which used to share a key with an idle row or a horizontal seal and so were never compared; harness-only, no user-visible change, no pixel or frozen-byte change):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6252 passed / 1 skipped / 249 of 250 suites** · lifecycle **45/45** (three `--only` parts 21 + 16 + 8) · e2e **`OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592**, 0 FAIL, with `button host-leak OK (161 … 966 …)` (34-record boundary), modal `228`, input `176` (15 kinds), checkbox `116` (7 kinds), prose `106 … [212]` · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-530 ticket-owner at `97284051` (on `88cb7db9`; lifecycle and e2e carried from develop `88cb7db9`, whose built `main.js` / `styles.css` are byte-identical to `97284051`); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `88cb7db9` (2026-11-02; SC-539 landed — the e2e runner parks the private Xvfb's pointer at 0,0 with a dependency-free X11 client (`e2e/x11-pointer.mjs`) and starts Xvfb with `-noreset`, so hover-revealed chrome tests (CHR-F02/F03, CHR-L01, INIT-DEF-E04) no longer flake when another shard maps a window; harness-only, no plugin byte change):**
tsc and lint clean · jest **6245 passed / 1 skipped / 249 of 250 suites** (fresh worktree 6244 / 2) · lifecycle **45/45** (three parts 21 + 16 + 8) · e2e **`OBSIDIAN-E2E done: 124/124 ok,
0 failed, 0 known-bug, coverage: 87/87 pairs`** (plus the `pointer parked at 0,0` line) · shots, freeze, parity carried from `ad018cd` (byte-identical `main.js`/`styles.css`): 592 0 FAIL 157/942 · 280/280 · 0 GAPs / 0
undeclared / 24 DECLARED. Numbers as reported by the SC-539 ticket-owner at `88cb7db9`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `ad018cd` (2026-11-02; SC-522 landed — a Live Preview note that embeds a tracker note keeps its scroll position and its text when that tracker's note is written, and a click on a control in the embedded tracker no longer scrolls the note or selects the embed; new lifecycle G-S52; lifecycle now runs in three `--only` parts):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6245 passed / 1 skipped / 249 of 250 suites** (fresh worktree: 6244 / 2) · lifecycle **45/45** (three `--only` parts 21 + 16 + 8) · e2e **`OBSIDIAN-E2E done: 124/124 ok,
0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592**, 0 FAIL, button host-leak 157/942 (34-record boundary) · freeze **`freeze OK (280/280 …)`** (no rebaseline; `styles.css` byte-identical to `fb24f8a`) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as measured by the SC-522 r6 implementer on `ad018cd` (on `fb24f8a`); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `fb24f8a2` (2026-11-02; SC-536 landed — the reference guard follows the DOM: a reference that points back to a card it sits inside (self, alias, A→B→A, Live Preview, sidebar) stops at one "Reference loop" card; a depth cap stops at 5 references inside one another; a note open in two panes no longer shows a false "Reference nesting too deep"; `ElementView.isUnloaded()` removed again; new lifecycle G-S56, which runs last):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6228 passed / 1 skipped / 249 of 250 suites** · lifecycle **44/44** (new G-S56; halves 22 + 22) · e2e **`OBSIDIAN-E2E done: 124/124 ok,
0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592**, 0 FAIL, button host-leak 157/942 (34-record boundary) · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-536 ticket-owner at `fb24f8a2` (on `f81a277`); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `f81a277` (2026-11-02; SC-533 landed — a tracker redraw is about 40 % faster (median ~840 → ~500 ms, Reading view and Live Preview): the chrome panel reads its card's border widths once per animation frame, batched (all reads before any write), and writes the `--dse-chrome-frame-border-*` vars on the panel, not the card; a panel out of the document at that frame is measured by an IntersectionObserver on its anchor when it scrolls in; fixes a 1 px misplacement of below-the-fold Reading-view panels; new lifecycle G-S54):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6208 passed / 1 skipped / 249 of 250 suites** · lifecycle **43/43** (new G-S54; halves 22 + 21) · e2e **`OBSIDIAN-E2E done: 124/124 ok,
0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592**, 0 FAIL (all 592 byte-identical to `458abe3`), button host-leak 157/942 (34-record boundary) · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-533 ticket-owner on `9c8cad5` (on `458abe3`), carried to `f81a277` (comments only; byte-identical `main.js`/`styles.css`); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `458abe3` (2026-11-02; SC-481 landed — with two identical blocks in a note, a card click or form Save on one no longer blanks the other, shows a wrong value or writes the wrong block: Reading view (plain blocks, blocks inside quotes and callouts, adoption on and off) and plain blocks in Live Preview; Live Preview callout twins remain (SC-537); new lifecycle G-S53):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6201 passed / 1 skipped / 249 of 250 suites** · lifecycle **42/42** (new G-S53; halves 21 + 21) · e2e **`OBSIDIAN-E2E done: 124/124 ok,
0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592**, 0 FAIL, button host-leak 157/942 (34-record boundary), modal 228, input 15/176, checkbox 7/116, prose 106 [212] · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-481 ticket-owner at `458abe3` (on `34f46cf`); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `34f46cf` (2026-11-02; SC-525 landed — retyping a reference in the block edit form while its lookup is still running no longer shows "Reference nesting too deep": the in-flight reference guard (`RefUnwrapView.ts` `IN_FLIGHT_REFS`) now records the owning view and refuses only when a different, still-loaded view owns the lookup; new `ElementView.isUnloaded()`; 31 new jest tests):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6184 passed / 1 skipped / 248 of 249 suites** · lifecycle **41/41** (halves 20 + 21) · e2e **`OBSIDIAN-E2E done: 124/124 ok,
0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592**, 0 FAIL, button host-leak 157/942 (34-record boundary) · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-525 ticket-owner: jest at `34f46cf`, the rest at `b1d5fa9` (the last commit is tests-only; same built plugin); the dispatcher relayed, not re-ran. Known flake seen in review: e2e CHR-F02 (SC-539).

**PREVIOUS — dse `develop` @ `4deb8cf` (2026-10-30; SC-531 landed — the lifecycle and e2e harnesses' trust-dialog script waits in the page (≤ 20 s) for `document.body` before installing its observer, so a start-up reload between check and install no longer exits 2; harness-only, no plugin byte change):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6153 passed / 1 skipped / 248 of 249 suites** (fresh worktree: 6152 / 2) · lifecycle **41/41** (halves 20 + 21) · e2e **`OBSIDIAN-E2E done: 124/124 ok,
0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots, freeze, parity carried from `4f73043` (not re-run; no plugin byte change): shots **592**, 0 FAIL, button host-leak 157/942 (34-record boundary) · freeze **280/280** · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-531 ticket-owner at `4deb8cf` (on `4f73043`); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `4f73043` (2026-10-29; SC-527 landed — the button host-leak sweep also checks control states reached only by a click (pressed initiative and negotiation toggles, enabled Complete Argument, disabled-after-Respite Catch Breath, the complete montage's Clear all and disabled buttons) by reaching them with real clicks in six sweep-only appended sections; harness-only, no user-visible change, no pixel or frozen-byte change):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6153 passed / 1 skipped / 248 of 249 suites** · lifecycle **41/41** · e2e **`OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592**, 0 FAIL, with `button host-leak OK (157 … 942 …)` (34-record boundary), modal `228`, input `176` (15 kinds), checkbox `116` (7 kinds), prose `106 … [212]` · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-527 ticket-owner at `4f73043` (on `9be397e`; lifecycle and e2e carried from develop `9be397e`, whose built `main.js` / `styles.css` are byte-identical to `4f73043`); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `9be397e` (2026-10-30; SC-518 landed — after a keyboard Save in the block edit form, focus returns to the redrawn card's Edit button with the focus ring (Reading view, sidebar, Live Preview; also the upper of two identical blocks); a mouse open leaves focus alone; new lifecycle G-S50):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6148 passed / 1 skipped / 248 of 249 suites** · lifecycle **41/41** (new G-S50; halves of 20 + 21) · e2e **`OBSIDIAN-E2E done: 124/124 ok,
0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592**, 0 FAIL, button host-leak 145/870 (28-record boundary), modal 228, input 15/176, checkbox 7/116, prose 106 [212] · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-518 ticket-owner at `9be397e` (on `71437da`); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `71437da` (2026-10-24; SC-479 landed — a Reading-view note that embeds a tracker no longer jumps to the top (or shifts its text) when the embedded note is written: the host pins its height and stops the browser's scroll anchoring on the embed for ~2.5 s, gated by where the reader is; new lifecycle G-S42; the full lifecycle now runs as two `--only` halves):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6127 passed / 1 skipped / 247 of 248 suites** (fresh worktree without a shots cache: one fewer / 2 skipped) · lifecycle **40/40** (new G-S42; two halves of 20) · e2e **`OBSIDIAN-E2E done: 124/124 ok,
0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592**, 0 FAIL, button host-leak 145/870 (28-record boundary), modal 228, input 15/176, checkbox 7/116, prose 106 [212] · freeze **`freeze OK (280/280 …)`** (no rebaseline; `styles.css` byte-identical to `ed368f6`) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-479 ticket-owner at `71437da` (on `ed368f6`); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `ed368f6` (2026-10-24; SC-513 landed — the host-leak sweeps also check controls that only exist after a click (ds-roll result card, ability roll strips in feature/featureblock/statblock, hero ability bodies) by mounting them with real clicks in the sweep's own load; harness-only, no user-visible change, no pixel or frozen-byte change; Recoveries popover left to SC-526):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6112 passed / 1 skipped / 247 of 248 suites** · lifecycle **39/39** · e2e **`OBSIDIAN-E2E done: 124/124 ok,
0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592**, 0 FAIL, with `button host-leak OK (145 … 870 …)` (28-record boundary), modal `228`, input `176` (15 kinds), checkbox `116` (7 kinds), prose `106 … [212]` · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-513 ticket-owner at `ed368f6` (on `c558759`; lifecycle and e2e measured on `324a68d`, whose built `main.js` / `styles.css` are byte-identical to `ed368f6`); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `c558759` (2026-10-24; SC-502 landed — in Live Preview the chrome menu buttons (Edit, Pin, Collapse/Expand) work with a real mouse on all 20 chrome elements (171/171 buttons): one shared rule lifts Obsidian 1.15's clip on the code-block box for blocks with a menu; collapsed Expand moved clear of Obsidian's `</>`; Reading view and every gate screenshot unchanged; new lifecycle G-S44 + e2e CHR-L01):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6105 passed / 1 skipped / 247 of 248 suites** · lifecycle **39/39** (new G-S44) · e2e **`OBSIDIAN-E2E done: 124/124 ok,
0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592**, 0 FAIL, button host-leak 114/684 · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-502 ticket-owner at `c558759`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `08c086c` (2026-10-24; SC-510 landed — the block edit form's preview always shows what is in the YAML box (no stale "Reference file … not found" while typing); an undrawable preview shows the same "failed to render" card as the block; `renderErrorCard` moved unchanged to `src/framework/errorCard.ts`, still re-exported by `pipeline.ts`):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6099 passed / 1 skipped / 246 of 247 suites** · lifecycle **38/38** · e2e **`OBSIDIAN-E2E done: 123/123 ok,
0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592**, 0 FAIL, host-leak 114/684 · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED** (lifecycle/shots/parity at `2d01bd8`; `08c086c` adds one test line). Numbers as reported by the SC-510 ticket-owner; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `f89f69f` (2026-10-24; SC-512 landed — the button host-leak sweep also compares the roll strip's Reset while it is enabled, via a sweep-only second roll strip (`galleryExtra=roll`); harness-only, no user-visible change, no pixel or frozen-byte change):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6078 passed / 1 skipped / 245 of 246 suites** · lifecycle **38/38** · e2e **`OBSIDIAN-E2E done: 123/123 ok,
0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592**, 0 FAIL, with `button host-leak OK (114 … 684 …)` (12-record boundary unchanged), modal `228`, input `164`, checkbox `60` · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-512 ticket-owner at `f89f69f`; the dispatcher relayed, not re-ran. Known shots flake under heavy load: the montage board mouse-wheel check (SC-521).

**PREVIOUS — dse `develop` @ `253aa5f` (2026-10-24; SC-519 landed — the block edit form includes a click made just before it opened (pending card write), so Save no longer undoes it; Reading view + sidebar (Live Preview: SC-523); new lifecycle G-S45):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6074 passed / 1 skipped / 245 of 246 suites** · lifecycle **38/38** (new G-S45) · e2e **`OBSIDIAN-E2E done: 123/123 ok,
0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592**, 0 FAIL · freeze **`freeze OK (280/280 …)`** (no rebaseline; shots/freeze at `1e97599`) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-519 ticket-owner at `253aa5f`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `c2758a2` (2026-10-24; SC-509 landed — `replaceSource` gains a `fromView` flag: only a card's own writes keep (adopt) the existing card; a block edit form Save redraws the card at once in Reading view and the sidebar; new lifecycle G-S40):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6058 passed / 1 skipped / 245 of 246 suites** · lifecycle **37/37** (new G-S40) · e2e **`OBSIDIAN-E2E done: 123/123 ok,
0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592**, 0 FAIL · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-509 ticket-owner at `c2758a2`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `a0365a4` (2026-10-24; SC-505 landed — in the shared chrome code, keyboard Collapse moves focus to Expand, Expand back to Collapse, and Pin to sidebar keeps it on Pin, with the focus ring; mouse unchanged; all 19 chrome-panel elements):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6052 passed / 1 skipped / 244 of 245 suites** · lifecycle **36/36** · e2e **`OBSIDIAN-E2E done: 123/123 ok,
0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592**, 0 FAIL · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-505 ticket-owner at `a0365a4`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `38f94f4` (2026-10-24; SC-500 landed — three initiative controls get e2e control ids (`init.hero.turn`, `init.reset-encounter`, `init.reset-encounter.confirm`; new `e2e/manifest/initiative.ts`); test infra only, no user-visible change):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6027 passed / 1 skipped / 243 of 244 suites** · lifecycle **36/36** · e2e **`OBSIDIAN-E2E done: 114/114 ok,
0 failed, 0 known-bug, coverage: 82/82 pairs`** · shots **592**, 0 FAIL, host-leak counts unchanged · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-500 ticket-owner (battery at `4f7aba6`; `38f94f4` is comment-only); the dispatcher relayed, not re-ran. Known e2e flake under heavy load: RECOV-R07 sees two writes after Catch Breath (SC-517).

**PREVIOUS — dse `develop` @ `7046eb0` (2026-10-24; SC-494 landed — the block edit form's Save keeps the block's `collapsed:` line; one shared helper `withReservedKeys` (`src/framework/chrome/collapsedKey.ts`) now orders reserved keys on every block write-back in `pipeline.ts` (388-case byte comparison unchanged)):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6026 passed / 1 skipped / 243 of 244 suites** · lifecycle **36/36** · e2e **`OBSIDIAN-E2E done: 114/114 ok,
0 failed, 0 known-bug, coverage: 79/79 pairs`** · shots **592**, 0 FAIL, in-run lines as at `054c9c5` · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-494 ticket-owner at `7046eb0`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `054c9c5` (2026-10-23; SC-501 landed — the shots host-leak sweeps open the roll strip's collapsed Modifiers disclosure before checking, so its steppers and Reset are compared instead of skipped; the gallery boundary prints the kinds under each reason; harness-only, no pixel or frozen-byte change):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6003 passed / 1 skipped / 242 of 243 suites** · lifecycle **36/36** · e2e **`OBSIDIAN-E2E done: 114/114 ok,
0 failed, 0 known-bug, coverage: 79/79 pairs`** · shots **592**, 0 FAIL, with `button host-leak OK (113 … 678 …)` (12-record boundary, kinds listed), `modal button host-leak OK (10 … 9 … 38 … 228 …)` (6-record boundary, listed ×2 each @MinionStaminaPoolModal, @MontageAddHeroModal, @StaminaEditModal), input `164` and checkbox `60` comparisons, and the expected `OBSIDIAN APP.CSS PIN DRIFT` warning · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-501 ticket-owner at `054c9c5`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `efc17de` (2026-10-23; SC-493 landed — the block edit form refuses Save on an emptied raw-YAML box for blocks that can't be empty (counter, negotiation, party, encounter, values row, characteristics, ds-scc), with an inline message; montage/project still save empty; shared `src/framework/blockBody.ts` reads block text for pipeline and form):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6003 passed / 1 skipped / 242 of 243 suites** · lifecycle **36/36** · e2e **`OBSIDIAN-E2E done: 114/114 ok,
0 failed, 0 known-bug, coverage: 79/79 pairs`** · shots **592**, 0 FAIL · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-493 ticket-owner at `efc17de`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `a993a60` (2026-10-23; SC-487 landed — DSE reads a block's name with Obsidian's Live Preview rule (letters, digits, `_ / + # -`); `~~~` fences follow Reading view; Pin to sidebar works with a zero-width space after the name; for a type the sidebar can't open, Pin writes nothing and shows one Notice; new lifecycle G-S33):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5958 passed / 1 skipped** · lifecycle **36/36** (new G-S33) · e2e **`OBSIDIAN-E2E done: 114/114 ok,
0 failed, 0 known-bug, coverage: 79/79 pairs`** · shots **592**, 0 FAIL · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-487 ticket-owner at `a993a60`; the dispatcher relayed, not re-ran. **SC-471 (parked) must handle the new `'unregistered'` result in its `sendFromCommand` and update the ```` ```js ```` command test when it lands.**

**PREVIOUS — dse `develop` @ `b624eef` (2026-10-23; SC-498 landed — the stamina bar is one Tab stop; Enter/Space open the Stamina modal and focus returns to the bar; 2px shared focus outline; chrome buttons' Enter/Space do only their own job; new lifecycle G-S36):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5889 passed / 1 skipped / 241 of 242 suites** · lifecycle **35/35** (new G-S36) · e2e **`OBSIDIAN-E2E done: 114/114 ok,
0 failed, 0 known-bug, coverage: 79/79 pairs`** · shots **592**, 0 FAIL · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-498 ticket-owner at `b624eef`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `c98bd82` (2026-10-23; SC-495 landed — the shared stepper keeps keyboard focus when "−" or "+" disables itself at its limit: focus moves to the number beside it, with the focus outline; mouse/touch unchanged):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5872 passed / 1 skipped / 241 of 242 suites** · lifecycle **34/34** · e2e **`OBSIDIAN-E2E done: 114/114 ok,
0 failed, 0 known-bug, coverage: 79/79 pairs`** · shots **592**, 0 FAIL · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-495 ticket-owner at `c98bd82`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `66f474b` (2026-10-23; SC-489 landed — the block edit form's Save no longer lowercases or trims values the user did not edit (`Climb` stays `Climb`; `style: Chips`/`Sheet` keep their capitals)):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5859 passed / 1 skipped / 241 of 242 suites** · lifecycle **34/34** · e2e **`OBSIDIAN-E2E done: 108/108 ok,
0 failed, 0 known-bug, coverage: 69/69 pairs`** · shots **592**, 0 FAIL, all in-run lines as at `907f55c` · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-489 ticket-owner at `66f474b`; the dispatcher relayed, not re-ran. Known load flake: `test/dom/elements/initiative-default-keys.test.ts:459` can time out at high load (SC-506).

**PREVIOUS — dse `develop` @ `9f08f06` (2026-10-23; SC-492 landed — the stamina bar ignores clicks from its own menu-panel buttons, so Edit, Collapse (released plugin) and Pin to sidebar no longer also open the Stamina modal; new lifecycle G-S32):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5847 passed / 1 skipped / 241 of 242 suites** · lifecycle **34/34** (new G-S32) · e2e **`OBSIDIAN-E2E done: 108/108 ok,
0 failed, 0 known-bug, coverage: 69/69 pairs`** · shots **592**, 0 FAIL, all in-run lines as at `907f55c` · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-492 ticket-owner at `9f08f06`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `53e1e48` (2026-10-23; SC-485 landed — initiative tracker writes add no keys the user never wrote (a hero turn toggle adds only `has_taken_turn: true`); a statblock-only combatant keeps following its statblock):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5840 passed / 1 skipped / 240 of 241 suites** · lifecycle **33/33** · e2e **`OBSIDIAN-E2E done: 108/108 ok,
0 failed, 0 known-bug, coverage: 69/69 pairs`** · shots **592**, 0 FAIL, all in-run lines as at `907f55c` · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED** (lifecycle/shots/freeze/parity from the pre-rebase head on `2c61511`; SC-488's delta is FormModal-only). Numbers as reported by the SC-485 ticket-owner at `53e1e48`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `0dff966` (2026-10-23; SC-488 landed — the block edit form's dropdowns (experimental authoring controls) show the value the block really uses, e.g. skills Style "Default (ledger)", roll Mode "Default (test)"):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5812 passed / 1 skipped / 239 of 240 suites** · lifecycle **33/33** · e2e **`OBSIDIAN-E2E done: 104/104 ok,
0 failed, 0 known-bug, coverage: 69/69 pairs`** · shots **592**, 0 FAIL, all in-run lines as at `907f55c` (incl. `text scale once OK (107256 … 214 loads …)`) · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-488 ticket-owner at `0dff966`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `2c61511` (2026-10-23; SC-478 landed — Live Preview panes keep their reading position when a tracker in the note changes, from another pane, a popout, the pane's own click or an outside edit (Sync, git, another plugin); new lifecycle G-S18):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5797 passed / 1 skipped / 239 of 240 suites** · lifecycle **33/33** (new G-S18; run on Obsidian 1.15.0) · e2e **`OBSIDIAN-E2E done: 104/104 ok,
0 failed, 0 known-bug, coverage: 69/69 pairs`** · shots **592**, 0 FAIL, with `host-copy pin OK (… 1.15.0 …)`, `button host-leak OK (113 … 678 …)`, `modal button host-leak OK (10 … 228 …)`, `text scale OK (1626 …)`, `text scale once OK (107256 comparisons over 214 loads …)` and the expected `OBSIDIAN APP.CSS PIN DRIFT` warning · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED** (lifecycle/e2e last run on `d152ea4`; SC-497's pin is shots-only). Numbers as reported by the SC-478 ticket-owner at `2c61511`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `907f55c` (2026-10-23; SC-497 landed — the shots harness's Obsidian host button copy is re-extracted from 1.15.0 after Obsidian updated itself, `PINNED_OBSIDIAN` 1.14.0 → 1.15.0; spelling-only change, no pixel or frozen-byte change):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5769 passed / 1 skipped / 238 of 239 suites** · lifecycle **32/32** · e2e **`OBSIDIAN-E2E done: 104/104 ok,
0 failed, 0 known-bug, coverage: 69/69 pairs`** · shots **592**, 0 FAIL, with `host-copy pin OK (… verbatim Obsidian 1.15.0; 18 further rules … excluded …, 0 unclassifiable …)`, `button host-leak OK (113 … 678 …)` (20-record boundary, see SC-501), `modal button host-leak OK (10 … 9 … 38 … 228 …)` (6-record boundary), no ALLOWLISTED line, `text scale OK (1626 …)`, `text scale once OK (107256 … 214 loads …)`, `pressed toggle parity OK (96 …)`, `pipette selected look OK`, `chrome host-leak OK (18 …)`, and the expected `OBSIDIAN APP.CSS PIN DRIFT` warning (installed 1.15.0 vs pinned 1.13.7, rc stays 0, SC-376) · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-497 ticket-owner at `6576fd4` (later commits comment-only; reviewer re-ran shots + freeze and matched); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `d152ea4` (2026-10-22; SC-477 landed — a write to a block with no closing fence at the end of the note keeps the note's final newline, on both the in-place and the durable path; new lifecycle G-S28):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5769 passed / 1 skipped / 238 of 239 suites** · lifecycle **32/32** (new G-S28) · e2e **`OBSIDIAN-E2E done: 104/104 ok,
0 failed, 0 known-bug, coverage: 69/69 pairs`** · shots **592**, 0 FAIL · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-477 ticket-owner at `d152ea4`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `e8f6a14` (2026-10-22; SC-465 landed — when Spend Recovery / Heal Recovery Value fills Stamina or spends the last Recovery and its button disables, keyboard focus moves to Reset instead of the page body; no write change):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5743 passed / 1 skipped / 238 of 239 suites** · lifecycle **31/31** · e2e **`OBSIDIAN-E2E done: 104/104 ok,
0 failed, 0 known-bug, coverage: 69/69 pairs`** · shots **592**, 0 FAIL · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-465 ticket-owner at `e8f6a14`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `c0e761b` (2026-10-22; SC-279 landed — roll strip: one-line collapsed row with labelled controls, the card's first dice click still rolls, statblock/featureblock abilities no longer share roll settings, the strip no longer prints; DESIGN.md rule 9 carve-out; freeze REBASELINED (2 roll print lines, sanctioned)):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5737 passed / 1 skipped / 238 of 239 suites** · lifecycle **31/31** · e2e **`OBSIDIAN-E2E done: 101/101 ok,
0 failed, 0 known-bug, coverage: 66/66 pairs`** · shots **592**, 0 FAIL (`text scale once OK (107256 …)`) · freeze **`freeze OK (280/280 …)`** after the rebaseline (a branch older than `c0e761b` reads `FREEZE VIOLATED (2 …)` on the two roll lines) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-279 ticket-owner at `c0e761b`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `e4c5cf6` (2026-10-22; SC-433 landed — the Stamina modal's Temporary Stamina field is a direct edit: "−" and a lower typed value lower temp (floor 0, "−" disabled at 0); a stored negative temp counts as 0; the last 3 e2e known-bug tests now pass):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5711 passed / 1 skipped / 238 of 239 suites** · lifecycle **31/31** · e2e **`OBSIDIAN-E2E done: 101/101 ok,
0 failed, 0 known-bug, coverage: 66/66 pairs`** (**no known-bug left**) · shots **580**, 0 FAIL, no ALLOWLISTED line · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-433 ticket-owner at `e4c5cf6` (reviewer re-ran tsc/lint/jest/e2e); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `424f47b` (2026-10-22; SC-361 landed — Conditions colour swatches: selected = white check mark inside (custom-colour swatch fills with its colour when selected), keyboard focus = the standard teal ring; all six swatches one size; swatch host-invariant so `HOSTLEAK_KNOWN_LEAKS` is empty; folds in SC-473; new e2e COND-E07):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5703 passed / 1 skipped / 238 of 239 suites** · lifecycle **31/31** · e2e **`OBSIDIAN-E2E done: 96/99 ok,
0 failed, 3 known-bug, coverage: 66/66 pairs`** · shots **580**, 0 FAIL, with `button host-leak OK (112 … 672 …)`, `modal button host-leak OK (10 … 9 … 38 … 228 …)` and **no ALLOWLISTED line**, new `pipette selected look OK (…)`, `pressed toggle parity OK (96 …)` and both text-scale lines · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-361 ticket-owner at `424f47b` (reviewer re-ran the battery at the reviewed head; rebase range-diff identical); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `3973b56` (2026-10-22; SC-482 landed — counter, project, montage, party, encounter and negotiation writes add no default keys the user never wrote (shared `src/elements/shared/undeclaredDefaults.ts`, also used by stamina-bar); fully-declared blocks save byte-identical):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5696 passed / 1 skipped / 238 of 239 suites** · lifecycle **31/31** · e2e **`OBSIDIAN-E2E done: 95/98 ok,
0 failed, 3 known-bug, coverage: 66/66 pairs`** · shots **580**, 0 FAIL, both text-scale lines + the modal host-leak line · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED** (lifecycle/e2e/shots/freeze/parity at `5e9a852`; `3973b56` adds one test file). Numbers as reported by the SC-482 ticket-owner; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `ea56712` (2026-10-22; SC-356 landed — the button host-leak sweep gains a modal pass (10 scenarios / 9 modal classes); a new plugin modal must be opened or declared unreachable; option chips take Scott's A30 look (plugin fill, 30px desktop, Obsidian control height on phones)):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5607 passed / 1 skipped / 234 of 235 suites** · lifecycle **31/31** · e2e **`OBSIDIAN-E2E done: 95/98 ok,
0 failed, 3 known-bug, coverage: 66/66 pairs`** · shots **580**, 0 FAIL, with `button host-leak OK (112 … 672 …)`, `modal button host-leak OK (10 modal scenarios over 9 modal classes, 38 button kinds … 228 …)`, `100 … ALLOWLISTED … (SC-361 …)` (goes away when SC-361 lands) and both text-scale lines · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-356 ticket-owner at `ea56712`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `54f8f88` (2026-10-21; SC-483 landed — the block edit form's Save (authoring controls, experimental) omits an untouched select whose field was absent from the block; skills no longer gains `style: list`, roll no longer gains `mode`/`difficulty`; an empty roll saves an empty body):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5601 passed / 1 skipped / 234 of 235 suites** · lifecycle **31/31** · e2e **`OBSIDIAN-E2E done: 95/98 ok,
0 failed, 3 known-bug, coverage: 66/66 pairs`** · shots **580**, 0 FAIL, both text-scale lines · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-483 ticket-owner at `54f8f88`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `8d890f9` (2026-10-21; SC-366 follow-up landed — the not-installed and notice ds-scc cards (`.dse-ref-notice`) lose the decorative left stripe banned by DESIGN.md rule 7; plain 1px border on all sides):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5585 passed / 1 skipped / 234 of 235 suites** · lifecycle **31/31** · e2e **`OBSIDIAN-E2E done: 95/98 ok,
0 failed, 3 known-bug, coverage: 66/66 pairs`** · shots **580**, 0 FAIL · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-366 ticket-owner at `8d890f9`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `95981f1` (2026-10-21; SC-432 landed — Spend Recovery is disabled for creatures ("Creatures have no Recoveries"); a hero with no Recoveries pool sees "Heal Recovery Value" and a first-press confirmation; heroes with a pool unchanged):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5582 passed / 1 skipped / 234 of 235 suites** · lifecycle **31/31** (one rc-2 environment race under load on the first attempt; re-run green) · e2e **`OBSIDIAN-E2E done: 95/98 ok,
0 failed, 3 known-bug, coverage: 66/66 pairs`** (all 3 known-bug are SC-433) · shots **580**, 0 FAIL, with both text-scale OK lines · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-432 ticket-owner at `95981f1`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `8d075db` (2026-10-21; SC-422 landed — Small/Large/Control text-size prefs now reach plugin surfaces outside an element root: Compendium search rows + empty-index hint, settings preview caption, experimental sidebar header + empty message; each root stamped exactly once):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5552 passed / 1 skipped / 234 of 235 suites** · lifecycle **31/31** · e2e **`OBSIDIAN-E2E done: 89/93 ok,
0 failed, 4 known-bug, coverage: 64/64 pairs`** · shots **580**, 0 FAIL, with `pressed toggle parity OK (96 …)`, `text scale OK (1626 comparisons: … on 5 chrome surfaces …)` and `text scale once OK (104184 comparisons over 208 loads … 5 chrome surfaces included …)` · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-422 ticket-owner at `8d075db`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `772c3cd` (2026-10-21; SC-457 landed — one shared rule `fenceLanguage` in `src/framework/host/blockPrefix.ts` for every save path, the sidebar and autocomplete (skip leading spaces/tabs; name ends at the first whitespace); a block with whitespace before its name keeps saving and can be pinned; new lifecycle G-S14):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5536 passed / 1 skipped / 233 of 234 suites** · lifecycle **31/31** · e2e **`OBSIDIAN-E2E done: 89/93 ok,
0 failed, 4 known-bug, coverage: 64/64 pairs`** · shots **580**, 0 FAIL · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-457 ticket-owner at `772c3cd` (reviewer r5 re-ran tsc/lint/jest/lifecycle/e2e); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `bc4a0c5` (2026-10-21; SC-362 landed — the shots harness renders by-SCC display cards (new fixtures `rule-by-scc`, `condition-by-scc`); an unresolved by-SCC card now fails the run; freeze WIDENED 276 → 280):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5457 passed / 1 skipped / 232 of 233 suites** · lifecycle **30/30** · e2e **`OBSIDIAN-E2E done: 89/93 ok,
0 failed, 4 known-bug, coverage: 64/64 pairs`** · shots **580** (572 + 8 new), 0 FAIL · freeze **`freeze OK (280/280 …)`** (widened; a branch older than `bc4a0c5` reads `276/280 producible OK, 4 missing`) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-362 ticket-owner at `bc4a0c5`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `08206e3` (2026-10-21; SC-466 landed — a write to a legacy `ds-stamina-bar` block keeps only the keys the user declared (no default keys added); a fully-declared block writes byte-identical; new e2e STAM-W11):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5446 passed / 1 skipped / 232 of 233 suites** · lifecycle **30/30** · e2e **`OBSIDIAN-E2E done: 89/93 ok,
0 failed, 4 known-bug, coverage: 64/64 pairs`** · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-466 ticket-owner (implementer's post-rebase run at `08206e3`); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `1c271b5` (2026-10-21; SC-470 landed — the scroll pin covers every open Reading view of a note, not just the pane that clicked: another pane, a popout and an outside write (Sync, git, another plugin) no longer jump the note to the top; new lifecycle G-S15):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5428 passed / 1 skipped / 231 of 232 suites** · lifecycle **30/30** (G-S13 + new G-S15) · e2e **`OBSIDIAN-E2E done: 88/92 ok,
0 failed, 4 known-bug, coverage: 64/64 pairs`** · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED** (shots/freeze/parity from the fix round; the re-review's changes were src/test only). Numbers as reported by the SC-470 ticket-owner at `1c271b5`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `0ce76dd` (2026-10-21; SC-326 landed — a long montage scrolls sideways inside its board instead of clipping later rounds and the Tally; scroll position survives a write; Tab scrolls a partly hidden cell into view; new lifecycle G-S13 and shots in-run check `montage board scroll OK (…)`):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5408 passed / 1 skipped / 231 of 232 suites** · lifecycle **29/29** (new G-S13) · e2e **`OBSIDIAN-E2E done: 88/92 ok,
0 failed, 4 known-bug, coverage: 64/64 pairs`** · shots **572**, 0 FAIL, with `montage board scroll OK (14 rounds x 900px pane …)` · freeze **`freeze OK (276/276 …)`** (no rebaseline; all 572 PNGs byte-identical) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-326 ticket-owner at `0ce76dd`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `aaa88b7` (2026-10-21; SC-476 landed — in-fence autocomplete reads a block's type as the first info word (```` ```ds-x extra ```` gets suggestions); mixed-case and backtick-in-info opening lines are not treated as DSE blocks; `src/authoring/fenceScan.ts` carries a local copy of SC-457's `fenceLanguage` rule until SC-457 lands):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5399 passed / 1 skipped / 231 of 232 suites** · lifecycle **28/28** · e2e **`OBSIDIAN-E2E done: 88/92 ok,
0 failed, 4 known-bug, coverage: 64/64 pairs`** · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-476 ticket-owner at `aaa88b7`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `e31e1a0` (2026-10-21; SC-474 landed — with the Conditions "Add condition" dropdown open, a click on a row's cog, swatch, duration or effect chip lands (dropdown closes on click, not on pointer-down); new e2e COND-E04/E05/E06 and control id `cond.icon-search`):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5384 passed / 1 skipped / 231 of 232 suites** · lifecycle **28/28** · e2e **`OBSIDIAN-E2E done: 88/92 ok,
0 failed, 4 known-bug, coverage: 64/64 pairs`** · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-474 ticket-owner at `e31e1a0`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `c03db7a` (2026-10-21; SC-456 landed — the e2e note-integrity check compares every fence's full opening/closing lines byte for byte, reading fences with the plugin's own parser; test-only, built `main.js`/`styles.css` byte-identical to `3480231`):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5374 passed / 1 skipped / 231 of 232 suites** (inferred: measured 5373 / 2 on a fresh worktree without the shots cache; +38 tests, +1 suite) · lifecycle **28/28** · e2e **`OBSIDIAN-E2E done: 85/89 ok,
0 failed, 4 known-bug, coverage: 63/63 pairs`** (under the stricter check) · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** · parity **0 GAPs / 0
undeclared / 24 DECLARED** (shots/freeze/parity carried from `3480231`: build byte-identical). Numbers as reported by the SC-456 ticket-owner; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `3480231` (2026-10-21; SC-468 landed — a keyboard pick of a colour/duration/effect in the Conditions window keeps focus on the picked option; new e2e COND-E02 (keyboard) and COND-E03 (mouse)):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5336 passed / 1 skipped / 230 of 231 suites** · lifecycle **28/28** · e2e **`OBSIDIAN-E2E done: 85/89 ok,
0 failed, 4 known-bug, coverage: 63/63 pairs`** · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-468 ticket-owner at `3480231`; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `0267b8a` (2026-10-21; SC-459 landed — lifecycle G-S8 now runs adoption on and off and FAILs with the SC-198 scroll pin disabled; only `obsidian-lifecycle.mjs` G-S8 and a `previewScrollPin.ts` header comment changed; built `main.js`/`styles.css` byte-identical to `84636a9`):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5329 passed / 1 skipped / 230 of 231 suites** (unchanged; a fresh worktree without the shots cache reads 5328 / 2) · lifecycle **28/28** · e2e **`OBSIDIAN-E2E done: 83/87 ok,
0 failed, 4 known-bug, coverage: 57/57 pairs`** · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** · parity **0 GAPs / 0
undeclared / 24 DECLARED** (shots/freeze/parity carried from `84636a9`: build byte-identical). Numbers as reported by the SC-459 ticket-owner; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `84636a9` (2026-10-21; SC-460 landed — a stray carriage return above a block no longer stops Reading-view, Live Preview, sidebar or encounter-builder edits from saving; new lifecycle scenario G-S12):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5329 passed / 1 skipped / 230 of 231 suites** (ba20072's 5260 + 69) · lifecycle **28/28** (new G-S12) · e2e **`OBSIDIAN-E2E done: 83/87 ok,
0 failed, 4 known-bug, coverage: 57/57 pairs`** · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED** (tsc/lint/jest/lifecycle/e2e re-run by the reviewer at `84636a9`; shots/freeze/parity from the implementer). Numbers as reported by the SC-460 ticket-owner; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `ba20072` (2026-10-21; SC-366 landed — the not-installed card's "View on steelcompendium.io" link uses the plugin's teal-cyan `--dse-accent` (steel theme, screen only); new jsdom pin `test/dom/theme/notInstalledLinkColour.test.ts`):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5260 passed / 1 skipped / 230 of 231 suites** (188755b's 5257 + 3) · lifecycle **27/27** · e2e **`OBSIDIAN-E2E done: 83/87 ok,
0 failed, 4 known-bug, coverage: 57/57 pairs`** · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** (no rebaseline — no shot covers the card, SC-469) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-366 ticket-owner (reviewer re-ran the full battery in r1, jest+parity after r2); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `188755b` (2026-10-20; SC-364 landed — dead `resolveCollapsePrefs` and the ComponentWrapper `declaredCollapsePrefs` side channel deleted; built `main.js` byte-identical across the branch):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5257 passed / 1 skipped / 229 of 230 suites** (unchanged) · lifecycle **27/27** · e2e **`OBSIDIAN-E2E done: 83/87 ok,
0 failed, 4 known-bug, coverage: 57/57 pairs`** · shots **572**, 0 FAIL (button host-leak 112 kinds / 672) · freeze **`freeze OK (276/276 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED** (full battery at `a22300d`; later two commits comment-only, tsc/lint/jest re-run at `188755b`). Numbers as reported by the SC-364 ticket-owner; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `71ac43a` (2026-10-20; SC-454 landed — dead `src/utils/CodeBlocks.ts` and its 5-test suite deleted; the minion pool modal test saves via `replaceFenceBody`; built `main.js` byte-identical to `ab34293`):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5257 passed / 1 skipped / 229 of 230 suites** (ab34293's 5262 minus the 5 deleted tests) · lifecycle **27/27** · e2e **`OBSIDIAN-E2E done: 83/87 ok,
0 failed, 4 known-bug, coverage: 57/57 pairs`** · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED** (shots/freeze/parity at `68e3f1e`; `main.js` sha256 identical at base, `68e3f1e` and `71ac43a`). Numbers as reported by the SC-454 ticket-owner; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `ab34293` (2026-10-20; SC-431 landed — Escape in a half-typed stepper field cancels only the draft, a second Escape closes; same for the Conditions add dropdown via the `escapeConsumer` registry):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5262 passed / 1 skipped / 230 of 231 suites** · lifecycle **27/27** · e2e **`OBSIDIAN-E2E done: 83/87 ok,
0 failed, 4 known-bug, coverage: 57/57 pairs`** (STAM-S06 known-bug removed; new STAM-T12, COND-E01) · shots **572**, 0 FAIL, with `pressed toggle parity OK (96 comparisons …)` · freeze **`freeze OK (276/276 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-431 ticket-owner at the rebased land-ready head; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `b6b08f3` (2026-10-20; SC-455 landed — blocks inside callouts/blockquotes write through the `> ` prefix in Reading view, Live Preview and the sidebar; an unsavable write shows one Notice):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5242 passed / 1 skipped / 230 of 231 suites** · lifecycle **27/27** (new G-S11) · e2e **`OBSIDIAN-E2E done: 80/85 ok,
0 failed, 5 known-bug, coverage: 51/51 pairs`** · shots **572**, 0 FAIL, with `pressed toggle parity OK (96 comparisons …)` · freeze **`freeze OK (276/276 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as re-run by the SC-455 independent reviewer at the land-ready head (shots/parity from the implementer); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `7817133` (2026-10-19; SC-360 landed — sidebar anchor ids always read as YAML strings; readers accept any scalar token; encounter builder shares the generator):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5013 passed / 1 skipped / 229 of 230 suites** (d58cf6a's 4950 + SC-360's 63) · lifecycle **26/26** · e2e **`OBSIDIAN-E2E done: 71/76 ok,
0 failed, 5 known-bug, coverage: 51/51 pairs`** · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** · parity **0 GAPs / 0
undeclared / 24 DECLARED** (shots/freeze/parity measured at `8c39741`, before later non-rendering fix rounds). Numbers as reported by the SC-360 ticket-owner (gates at `9cae8d3`; `7817133` is CHANGELOG-only); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `d58cf6a` (2026-10-19; SC-427 landed — Stamina editor clamps typed/stepped values, Apply label states the saved change, "1e3" reads as 1000, Reset clears the Apply box):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **4950 passed / 1 skipped / 229 of 230 suites** · lifecycle **26/26** · e2e **`OBSIDIAN-E2E done: 71/76 ok,
0 failed, 5 known-bug, coverage: 51/51 pairs`** (SC-427's 3 known-bug markers removed: STAM-S08, D09, F06) · shots **572**, 0 FAIL, with `pressed toggle parity OK (96 comparisons …)` · freeze **`freeze OK (276/276 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-427 ticket-owner at the land-ready head; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `6bcf9c8` (2026-10-19; SC-453 landed — CRLF notes: sidebar locates its block, every DSE write keeps the note's line ending):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **4908 passed / 1 skipped / 229 of 230 suites** · lifecycle **26/26** (new scenario G-S10, CRLF note stays all-CRLF) · e2e **`OBSIDIAN-E2E done: 68/76 ok,
0 failed, 8 known-bug, coverage: 51/51 pairs`** · shots **572**, 0 FAIL, with `pressed toggle parity OK (96 comparisons …)` · freeze **`freeze OK (276/276 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-453 ticket-owner at the land-ready head; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `c616e22` (2026-10-19; SC-450 landed — one `setPressedState` writes `aria-pressed` + `data-pressed` together; AST jest guard; new shots in-run gate):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **4849 passed / 1 skipped / 228 of 229 suites** (new suite `test/unit/build/ariaPressedWriters.test.ts`) · lifecycle **25/25** · e2e **`OBSIDIAN-E2E done: 68/76 ok,
0 failed, 8 known-bug, coverage: 51/51 pairs`** · shots **572**, 0 FAIL, with the NEW in-run line `pressed toggle parity OK (96 comparisons across 8 sites x dark/light x rest/hover/focus-visible)` · freeze **`freeze OK (276/276 …)`** (no rebaseline; 572/572 PNGs byte-identical) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-450 ticket-owner at the land-ready head; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `9ed8dc6` (2026-10-19; SC-428 landed — Catch Breath disabled at full Stamina / zero recovery value, popover button really disabled, shared name-first reasons, Recoveries marker keeps keyboard focus):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **4840 passed / 1 skipped / 227 of 228 suites** · lifecycle **25/25** · e2e **`OBSIDIAN-E2E done: 68/76 ok,
0 failed, 8 known-bug, coverage: 51/51 pairs`** (SC-428's 2 known-bug markers removed) · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-428 ticket-owner at `e7d869c` (`9ed8dc6` is a test retitle only; that file re-run 35/35); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `f818002` (2026-10-19; SC-260 landed — preview scroll pin taken only when `replaceSource` changes the file; a pin failure cannot abort the write):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **4810 passed / 1 skipped / 227 of 228 suites** (8ab5e91's 4806 + SC-260's 4) · lifecycle **25/25** · e2e **`OBSIDIAN-E2E done: 63/73 ok,
0 failed, 10 known-bug, coverage: 47/47 pairs`** · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-260 ticket-owner at the land-ready head; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `8ab5e91` (2026-10-19; SC-429 landed — minion pool modal: auto-ticks revert, focus on the damage box, minion count capped at living, idle info line hidden):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **4806 passed / 1 skipped / 227 of 228 suites** (c78a06b's 4787 + SC-429's 19) · lifecycle **25/25** · e2e **`OBSIDIAN-E2E done: 63/73 ok,
0 failed, 10 known-bug, coverage: 47/47 pairs`** · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-429 ticket-owner at the land-ready head; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `c78a06b` (2026-10-19; SC-290 landed — write-back keeps a fence's full info string via `src/framework/host/fenceLine.ts`):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **4787 passed / 1 skipped / 227 of 228 suites** (a89ffd9's 4769 + SC-290's 18) · lifecycle **25/25** · e2e **`OBSIDIAN-E2E done: 63/73 ok,
0 failed, 10 known-bug, coverage: 47/47 pairs`** (new `RECOV-I01`) · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-290 ticket-owner at the land-ready head; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `a89ffd9` (2026-10-19; SC-426 landed — roster-cell Stamina edit refreshes the initiative detail row):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **4769 passed / 1 skipped / 227 of 228 suites** · lifecycle **25/25** · e2e **`OBSIDIAN-E2E done: 62/72 ok,
0 failed, 10 known-bug, coverage: 47/47 pairs`** (SC-426's known-bug marker removed) · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-426 ticket-owner and its independent reviewer at `0d1c0cf` (`a89ffd9` is comment + CHANGELOG only; tsc/lint re-run clean); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `f8e050f` (2026-10-19; SC-324 landed — iconButton `label` is the hover tooltip; the discarded `tooltip` option is gone):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **4767 passed / 1 skipped / 227 of 228 suites** (7644fb3's 4761 + SC-324's 6) · lifecycle **25/25** · e2e **`OBSIDIAN-E2E done: 61/72 ok,
0 failed, 11 known-bug, coverage: 47/47 pairs`** · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-324 ticket-owner at the rebased land-ready head; the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `7644fb3` (2026-10-19; SC-430 landed — stamina + minion-pool modal Apply follows a half-typed draft so the first click lands):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **4761 passed / 1 skipped / 227 of 228 suites** · lifecycle **25/25** · e2e **`OBSIDIAN-E2E done: 61/72 ok,
0 failed, 11 known-bug, coverage: 47/47 pairs`** (SC-430's `[STAM-S13]` known-bug marker removed; new `[STAM-S13c]` scenario) · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-430 ticket-owner and its independent reviewer at the land-ready head (shots/freeze/parity measured at `e3d4158`; later commits do not change first paint); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `1a4c6d3` (2026-10-18; SC-372 landed — per-root `--dse-fs-*` declaration so the Small/Large/Control text-size prefs apply; each knob applies once):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **4732 passed / 1 skipped / 227 of 228 suites** (1640ed0's 4725 + SC-372's 7) · lifecycle **25/25** · e2e **`OBSIDIAN-E2E done: 59/71 ok,
0 failed, 12 known-bug, coverage: 47/47 pairs`** · shots **572**, 0 FAIL, with two NEW in-run lines `text scale OK (1146 comparisons)` and `text scale once OK (102969 comparisons over 199 loads)` beside `portrait mark parity OK (… 6 comparisons …)` and `turn mark parity OK (20 comparisons)` · freeze **`freeze OK (276/276 …)`** (no rebaseline, no widening) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-372 ticket-owner and its independent reviewer at the land-ready head (6737031; 1a4c6d3 is a CHANGELOG-only follow-up); the dispatcher relayed, not re-ran.

**PREVIOUS — dse `develop` @ `1640ed0` (2026-10-18; SC-408 landed — functional e2e pilot, e2e now required to land):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **4725 passed / 1 skipped / 226 of 227
suites** (the 4721 of the SC-408 branch on `e9502a8` + SC-423's 4) · lifecycle **25/25** · e2e **`OBSIDIAN-E2E done: 59/71 ok,
0 failed, 12 known-bug, coverage: 47/47 pairs`** (3 consecutive full runs at `--shards=4`, about 32-33 s of spec time each; the 12
known bugs are SC-426, SC-427 x3, SC-428 x2, SC-430, SC-431, SC-432, SC-433 x3 — each is a `knownBug` / `test.failing`
marker that must be removed by the ticket that fixes it) · shots **572**, 0 FAIL, with the in-run line `portrait mark parity OK
(… 6 comparisons …)` beside `turn mark parity OK (20 comparisons)` · freeze **`freeze OK (276/276 …)`** · parity **0 GAPs / 0
undeclared / 24 DECLARED** · `npm run docs-shots -- --only=initiative-tracker.gif --check-stable` → `stable`. Lint covers
`e2e/` too. Gate exit codes were read through a script file (see "THE exit-code footgun").

**PREVIOUS — dse `develop` @ `566888a` + SC-423 branch `sc423-portrait-frame` @ `f3585f0`
(2026-10-18; SC-411 landed on `566888a`, SC-423 measured at its land-ready head):** tsc/lint
clean · jest **4505 passed / 1 skipped / 222 of 223 suites** (SC-411 +43 tests / +2 suites,
SC-423 +4) · lifecycle **25/25** (measured at SC-423's pre-rebase head 379a5a5; SC-411 touched
no src/) · shots **572**, 0 FAIL (SC-390 added 4; SC-423 adds no PNGs but a new in-run gate
`portrait mark parity OK (… 6 comparisons …)` beside `turn mark parity OK (20 comparisons)`)
· freeze **`freeze OK (276/276 …)`** · parity **0 GAPs / 0 undeclared / 24 DECLARED** ·
`npm run docs-shots -- --only=initiative-tracker.gif --check-stable` → `stable`. Gate exit
codes this round were read through a script file (see "THE exit-code footgun": an echoed
`$?` inside `bash -c` is a false green under devbox in any quoting).

**PREVIOUS — dse `develop` @ `9ad919d` (2026-10-16; SC-377 landed on `e0ee273`):** tsc/lint
clean · jest **4367 passed / 1 skipped / 215 of 216 suites** · lifecycle **25/25** (19 + SC-377's
G-S9a–f real-click scenarios) · shots **568**, 0 FAIL (SC-377 added `initiative-named`,
`initiative-named-narrow`, `chrome-initiative-menu`; two new in-run gates: `title line stable
OK (52 comparisons)` and `turn mark parity OK (20 comparisons)`; button host-leak 112 kinds /
672, input host-leak 14 kinds / 164; print-twin delta OK across 141 ids) · freeze **`freeze OK
(276/276 …)`** after SC-390's sanctioned 2-line rebaseline + 2-line widening above · parity **0 GAPs
/ 0 undeclared / 24 DECLARED**. Known flake: `sidebarInitiative` "SC-288 r2" goes red in
~3% of runs — SC-383, a pre-existing product bug (unquoted `_dse_anchor` ids that look
numeric), not load and not the branch. The `sidebarEncounterHandoff` flake below was fixed
in SC-377 (the test now accepts a quoted anchor).

**PREVIOUS — dse `develop` @ `e0ee273` (2026-10-09; SC-379 landed):** tsc/lint clean · jest
**4309 passed / 1 skipped / 215 of 216 suites** · lifecycle **19/19** · shots **556**, 0 FAIL
(SC-379 added `negotiation-appeal`, `negotiation-ended`, `negotiation-narrow`; host-leak 114
kinds / 684 comparisons; print-twin delta OK across 138 ids) · freeze **`freeze OK (268/268 …)`**
after the sanctioned 6-line rebaseline + 6-line widening above · parity **0 GAPs / 0
undeclared / 24 DECLARED**. One known timing flake under load: `sidebarEncounterHandoff`
"persists the id it minted" (8 s under load, green on re-run) — same class as the
settings-tab timeouts above.

**PREVIOUS — dse `develop` @ `1ac4e5a` (2026-10-08; SC-127 landed):** tsc/lint clean · jest
**4254 passed / 1 skipped / 214 of 215 suites** · shots **544**, 0 FAIL, with the in-run
`SC-127 light island OK` at the default and a non-default accent and `print-twin delta OK`
across 135 ids · freeze **`freeze OK (262/262 …)`** after the sanctioned 131-line twin
rebaseline above · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Measured by the SC-127
fixer at the landing tree; lifecycle not re-run.

**PREVIOUS — dse `develop` @ `8a256c5` (2026-10-08; SC-378 landed):** tsc/lint clean · jest
**4219 passed / 1 skipped** · lifecycle **19/19** · shots **544**, 0 FAIL · freeze **`freeze OK
(262/262 …)`** · parity **0 GAPs / 0 undeclared / 24 DECLARED**. SC-378 added one jest test and
moved no frozen bytes. Its fix is screen-only: the power-roll outcome `<p>` margin that SC-202's
prose re-grounding had overridden.

**PREVIOUS — dse `develop` @ `9ded832` (2026-09-29; SC-232 landed on top of the 09-24→09-28
dispatcher wave):** tsc/lint clean · jest **4218 passed / 1 skipped** · lifecycle **19/19** ·
shots **544**, 0 FAIL · freeze **`freeze OK (262/262 …)`** · parity **0 GAPs / 0 undeclared /
24 DECLARED**. SC-232's 78-line rebaseline replaced hashes; the count stays 262.

**PREVIOUS — dse `develop` @ `dfb7395` (2026-09-28, after the 09-24→09-28 dispatcher wave:
SC-243, SC-230, SC-272, SC-236, SC-255, SC-231, SC-284, SC-338, SC-317, SC-235, SC-318):**
tsc/lint clean · jest **4147 passed / 1 skipped** · lifecycle **19/19** · shots **536**, 0 FAIL
(SC-318 added the `perk-headings` capture) · freeze **`freeze OK (262/262 …)`** · parity
**0 GAPs / 0 undeclared / 14 DECLARED**. Freeze moved 260 → 262 only by SC-318's additions-only
widening. The sanctioned rebaselines recorded above (SC-236 8, SC-255 20, SC-231 55, SC-284 6)
replaced hashes and kept the count. The SC-340 block below is the snapshot before that.

**PREVIOUS — SC-340, view adoption (branch `sc340-view-adoption`, 2026-09-24, based on dse
`develop`/`sc343-stale-write-guard` `48ac20c`, Task 0; landing measured after the pre-landing
`git rebase origin/develop`, onto `develop` `6c4f6aa` — SC-328's fflate swap, 6.0.2 hotfix
merge-forward, SC-288 and SC-282 sidebar fixes).** Task 0 (`48ac20c`) is SC-343's own landing
point — see its entry below. Full battery, same order (tsc → lint → jest → lifecycle → shots
→ freeze → parity):

| Gate | Task 0 (`48ac20c`) | Task 8 landing (rebased onto `6c4f6aa`) |
|---|---|---|
| `npm run tsc` | clean | clean |
| `npm run lint` | clean, exit 0 | clean, exit 0 |
| `npx jest` | 3969 passed / 1 skipped / 204 of 205 suites / 3 snapshots | **4038 passed / 1 skipped / 208 of 209 suites / 3 snapshots** at the landing head `619c4bd` (Tasks 1–7's own coverage plus what `develop` gained since Task 0, plus 2 from the final review's fix wave; Task 8 itself added none — it only extends the lifecycle gate) |
| `npm run obsidian-lifecycle` | `OBSIDIAN-LIFECYCLE done: 6/6 ok, 0 failed`, exit 0 (SC-343's 6) | **`OBSIDIAN-LIFECYCLE done: 19/19 ok, 0 failed`, exit 0** (SC-343's 6 + SC-340's 13 — see the lifecycle-gate paragraph above for the full id list; reproduced clean twice) |
| `npm run shots` | 524, 0 FAIL | **unchanged — 524, 0 FAIL** |
| `check-freeze.sh` | `freeze OK (260/260 …)`, exit 0 | **unchanged — `freeze OK (260/260 …)`, exit 0** (see the freeze note below for the mid-task detour: it read `FREEZE VIOLATED` before the rebase, for reasons unrelated to SC-340) |
| `npm run parity` | 0 GAPs / 0 undeclared / 16 DECLARED / exit 0 | **unchanged** |

View adoption itself (Tasks 1–7) is ON by default (`viewAdoption !== false`) and does not
touch any rendered DOM byte, so shots/freeze/parity are unchanged from Task 0 — only jest
(new unit coverage, Tasks 1–7, plus `develop`'s own growth) and the lifecycle gate (13 new
scenarios, Task 8) moved. The hidden kill switch (`"viewAdoption": false` in `data.json`)
proves the gate discriminates: with it set, `G-S1`/`G-S2`/`G-S3` all FAIL (modal closed /
typed text lost / not adopted) — reconfirmed at the rebased head.

**Freeze note (historical): a pre-landing base drift, not an SC-340 regression — resolved by
the rebase.** Before this branch's pre-landing rebase (while still based on `48ac20c`),
`check-freeze.sh` read `FREEZE VIOLATED (16 checksum mismatches, 0 missing)`, all
`skills-*`/`chrome-skills-menu--steel-{print,realprint}.png`. Traced (Task 8 review I-3): the
"Add missing Crafting/Lore skills" fix (`ae86693`/`f860156`, a 3-line `SkillsSchema.yaml`
addition) had reached `develop` via **SC-328**'s own sanctioned merge-forward (`b69ec1a`,
"merge 6.0.2 hotfix forward into develop") AFTER this branch's base (`48ac20c`) but BEFORE
the shared `freeze-baseline.sha256` was rebaselined for SC-328 — so this branch's still-old
`SkillsSchema.yaml` mismatched the newer baseline. No product defect and no manual port was
needed: the routine pre-landing `git rebase origin/develop` carried the branch onto the tree
the baseline already reflected, and `check-freeze.sh` reads clean (260/260) at the rebased
head, confirmed above. SC-340 itself makes zero `src/` changes (Tasks 1–7 are
framework/host-only; Task 8 is this harness file plus docs) and never touches
`SkillsSchema.yaml` — the drift was never caused by, nor fixed by, any SC-340 task.

**As of SC-343, the stale-write guard (branch `sc343-stale-write-guard`, 2026-09-24,
based on dse `develop` `0c132d8`, pre-landing rebase re-measured at `48ac20c`).** The base
moved to `f6fb208` (SC-241 + SC-240 initiative fixes landed on `develop` in between; neither
touches `src/framework/host/`) when the branch was rebased for landing. Measured at
`48ac20c`, full battery in the new order (Lifecycle now step 4, after jest and before
shots):

| Gate | Before (base `0c132d8`) | After (`48ac20c`) |
|---|---|---|
| `npm run tsc` | clean | clean |
| `npm run lint` | clean, exit 0 | clean, exit 0 |
| `npx jest` | 3925 passed / 1 skipped / 202 of 203 suites / 3 snapshots | **3969 passed / 1 skipped / 204 of 205 suites / 3 snapshots** |
| `npm run obsidian-lifecycle` | did not exist | **`OBSIDIAN-LIFECYCLE done: 6/6 ok, 0 failed`, exit 0** (`G-S7a`, `G-S7b`, `G-S6a`, `G-S6b`, `G-S6u`, `G-S5n`) |
| `npm run shots` | 524, 0 FAIL | **unchanged — 524, 0 FAIL** |
| `check-freeze.sh` | `freeze OK (260/260 …)`, exit 0 | **unchanged — `freeze OK (260/260 …)`, exit 0** |
| `npm run parity` | 0 GAPs / 0 undeclared / 16 DECLARED / exit 0 | **unchanged** |

The lifecycle gate is real-Obsidian-headless (own Xvfb `:160–:199`, own CDP port 9262,
scratch vault) and is mandatory, unlike `obsidian-shots` — see "The battery, in order"
above. `Cdp.connect()` falls back to the `ws` package on Node < 22 (native `WebSocket` on
22+); this landing measured on Node 20.11.1, so the fallback path is what ran. On success
it deletes its own per-run temp dir; it keeps (and prints the path of) that temp dir only
when a run leaves a FAIL screenshot behind. It exits 2 — not 1 — for an environment problem
(no Xvfb/asar/binary, the CDP port already busy), on SIGINT/SIGTERM, and when `--only`
names no scenario id that exists; only a genuine scenario assertion failure exits 1. Its
Notice capture records every plugin-authored Obsidian Notice except the host's own "Update
Available" banner, so a future scenario asserting zero Notices sees any other plugin's
chrome too, not just DSE's.

**As of SC-144, the legacy-theme removal (branch `sc144-legacy-removal`, 2026-08-11,
based on dse main `20a78e2` = post-SC-149).** Measured at the landing commit, full battery
in order:

| Gate | Before (base `20a78e2`) | After |
|---|---|---|
| `npm run tsc` | clean | clean |
| `npm run lint` | clean, exit 0 | clean, exit 0 |
| `npx jest` | 2680 passed / 1 skipped / **164 suites** (+1 skipped) / 3 snapshots | **2686 passed / 1 skipped / 164 suites / 3 snapshots** (net **+6**) |
| `npm run shots` | 334, 0 FAIL | **200, 0 FAIL** |
| `check-freeze.sh` | `freeze OK (200/200 …)`, exit 0 | **`freeze OK (66/66 …)`, exit 0** |
| `npm run parity` | 0 GAPs / 0 undeclared / 16 DECLARED / exit 0 | **unchanged** |
| `npm run obsidian-shots` | not run (display busy); last recorded 145 | not run; the theme axis halved, so expect roughly half |

Three of those want explaining before you treat a difference as a failure:

- **Shots 334 → 200 is the combo count, not lost coverage.** `shoot.mjs`'s `COMBOS` went
  5 → 3 (the two `legacy-*` entries are gone); 66 capture ids × 3 + 2 galleries = 200.
  Every `*--legacy-*.png` name simply no longer exists.
- **Jest went UP (+6), not down. This is not a miscount.** The plan predicted −7 to −9.
  The four theme-switching contracts in `displayCardThemeBranch.test.ts` did die (that file
  is now `displayCardBranch.test.ts` with 4 tests). Against that: 4 new `migrateSettings`
  cases, 6 harness cases pinning the theme-param clamp (`parseParams` ×4 + two rendered-root
  cases), and — the part that swallows the predicted deletions — several tests the plan
  said to DELETE were converted into stronger invariants instead. The descriptor's "carries
  the OD-5 options" pin (a fixture) became "carries NO `ui`" (the contract); tokens.test.ts's
  "no `[data-dse-theme="legacy"]` scope" (one banned literal) became "`steel` is the only
  `[data-dse-theme]` value in the sheet" (any second theme scope, under any name). All were
  can-fail proven by re-introducing the exact regression each catches. Deleting them to hit
  a predicted number would trade a real guard for a tidy figure — don't.
- **Jest counts are LOCATION-SENSITIVE — check where you ran from before believing a delta.**
  `test/dom/framework/token-coverage.test.ts` resolves the workspace D3 token map against a
  fixed list of known layouts (the main checkout and the worktrees dir). Run the suite from
  anywhere else — a scratch checkout under `/tmp`, say — and it silently SKIPS 2 tests:
  you get `3 skipped / 2680 passed` where the same commit reports `1 skipped / 2682 passed`
  in a proper worktree. Independently hit and confirmed during the SC-144 review while
  re-deriving the base numbers from a scratch tree. A −2 "regression" discovered this way is
  an artifact of your working directory, not the branch.
- **Every Steel shot is byte-identical across the whole ticket.** That was the primary
  correctness gate: a sha256 of all 200 `*--steel-*.png` was taken before any edit and
  re-diffed at phases 2, 3 and 7 — empty diff every time, including all 66 `steel-print`.
  Removing a theme changed nothing about the theme that remains.


As of dse SC-117 Batch 6 (branch `sc117-audit`, 2026-08-07, `f09f6cc` + this batch's
commit): jest **2191/154 suites** (+1: the new `feature/spend` fixture's own
fixtures.test.ts mount case), shots **189** (+10: `feature-spend`/`negotiation-pr-checked`
× 5 combos each), freeze **113/113 clean** (widened from 107 — no open mismatches on this
branch; the SC-121 C-5 rebaseline already covers the 5 treasure/gallery lines main was
still carrying).

As of dse SC-117 fix wave B1-B4 + riders (branch `sc117-audit`, 2026-08-07): jest
**2249/155 suites**, shots **189**, freeze **113 producible lines OK / 0 mismatches**, parity
**0 GAPs / 0 undeclared WARNs / 16 DECLARED / exit 0**.

Two branch-specific notes that will read as failures if you don't expect them:
- **The freeze baseline is 119 lines, but only 113 of them are producible here.** The other 6
  (`feature-villain--*`, `statblock-villain-corpus--*`) belong to plan 25's two new fixtures,
  which live on the unlanded `sc10x-structural` branch, so `sha256sum -c` reports them as
  `No such file or directory` rather than as checksum mismatches. **A missing file is not a
  leak; a `FAILED` checksum is.** Read the two categories separately before calling the gate
  red. (**Superseded 2026-08-08:** plan 25 landed, so those 6 lines are producible on `main`
  and this "6 missing" arm no longer fires there. The *category* distinction is permanent and
  still the point.) Equally: the 5 then-sanction-pending `*--steel-print.png` mismatches plan
  25 carried did NOT apply on any other branch at the time — but the sanctioned rebaseline
  has since been applied, so the baseline now holds the trio's *after* bytes and a branch
  still based on pre-plan-25 `main` will report exactly those 5 as `FAILED` until it rebases.
- Historical numbers: jest was **2248/155** on `guards` (before B6's fixture test) and parity
  was **18 DECLARED** until SC-117 R1 healed FOLLOWUPS #52. The old "10 WARNs" figure predates
  the declared-deferrals contract entirely (exit 0 ⟺ 0 GAPs AND every WARN declared; material
  classes `bg`/`shadow`/`hairline-*` are never declarable), and a "16 DECLARED" written before
  2026-08-07 means the pre-fix-round set, not this one — same number, different composition.
  `npm run parity` also runs in CI as of SC-109. These numbers change as the plugin
grows — treat them as "what to expect right now," not a hardcoded target. Always confirm the actual counts against whatever commit you're
gating, and if they differ, figure out why before treating it as either pass or fail.

**As of the SC-117 fix-wave FIX ROUND (branch `sc117-audit`, 2026-08-07, M1+M2+M4+L2
commits on top of R1):** jest **2249/155 suites, 3 snapshots** (unchanged — no test surface
touched), shots **189** (unchanged — no fixture added, M1 only changed what one existing
capture does with the mouse), freeze (fixed script, see "Baseline corrections" above) →
`freeze OK (113/119 producible OK, 6 missing (not producible on this branch), 0 checksum
mismatches)`, exit **0** — the first branch that can ever say this with the corrected
semantics. Parity **0 GAPs / 0 undeclared WARNs / 16 DECLARED / exit 0**, unchanged from R1
(M4 only edited README prose, no selector-map/compare.cjs change). M3 (`check-freeze.sh`
itself) has no branch/version number of its own — it's shared workspace scratch, not part
of this repo's test surface.

**LANDING STATE — `sc10x-structural` (plan 25, structural trio, rebased onto the SC-117
fix-wave main and rebaselined 2026-08-08):** jest **2289 passed / 155 suites / 3 snapshots**,
shots **199 browser** (0 FAIL), freeze **`freeze OK (119/119 legacy+print PNGs
byte-identical)`, exit 0** — the first fully-green freeze on this work, and the state the
five-line sanctioned rebaseline above produced. Parity **0 GAPs / 0 undeclared WARNs / 16
DECLARED / exit 0**, composition byte-for-byte identical to main's (`git diff
origin/main...HEAD -- visual-harness/parity/` is empty): none of the 16 declarations concerns
a surface this plan touched, and none of the trio's rules moved a sampled property.
`obsidian-shots` was NOT run at landing — a live Obsidian session owned display `:1`; the
last recorded value for this branch is 145.

Two numbers moved between this branch's own finale and its landing, both because the SC-117
**fix wave** landed on `main` in between:
- **Parity 18 → 16 DECLARED.** Not this branch's doing: the fix wave healed FOLLOWUPS #52,
  removing the two `statblock-wrap:line-height` declarations. This branch never touched
  `selector-map.json`, and the rebase must not resurrect the removed declaration — verified
  by the empty parity diff above.
- **Freeze 114/119 → 119/119.** The rebaseline, not new work.

Jest is unchanged at 2289 across the rebase, which is the correct answer and worth checking
rather than assuming: the fix wave added **zero** test cases (its only `test(...)` edit
renamed "the documented 9 entries" → "8"), so main's count did not move and the trio's own
+41 lands on the same base. The freeze denominator went 113 → **119** on this branch (this
plan's own S-5 widening, above). This whole block is exactly the "confirm the actual counts
against whatever commit you're gating" case the paragraph above warns about: the plan
predicted 4 print mismatches and the real post-rebase answer was 5, because a sibling
branch's new `feature-spend` fixture sits in a family this plan restyles. **Don't average,
don't assume, re-run — after the rebase.**
