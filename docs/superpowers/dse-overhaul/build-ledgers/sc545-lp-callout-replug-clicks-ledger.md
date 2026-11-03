# SC-545 decisions ledger

Ticket: SC-545 "DSE: after turning the plugin off and on, clicks on cards in an open Live Preview callout save nothing" (Linear, Backlog at start; labels DSE Plugin, Bug; related SC-537).
Owner: ticket-owner (Opus 5.5; posts with `--model opus-5.5`). Dispatcher lands.

## Ticket facts (verbatim from the description, 2026-11-02)
- "Seen by the SC-537 r3 review in real Obsidian 1.15.0. Cause not investigated. Also happens on dse develop f81a277, before SC-537."
- "**Steps:** open a note with a `ds-counter` inside a callout in Live Preview. Turn Draw Steel Elements off and back on in Community plugins, without closing the note. Click + on the counter."
- "**Result:** nothing is written to the file. There are no page errors."
- "**Expected:** the click saves, or the card is redrawn so that it does."
- Evidence: `.superpowers/sdd/sc537-lp-callout-twins/sc537-r3-review-report.md` §3 item 4 (INFO-4, `unload` probe): "after re-enabling the plugin, + on the still-open Live Preview callout cards wrote nothing. f81a277 does the same, so it is not SC-537." Probe tooling: `<scratchpad>/sc537-r3-review-rv3/` (harness-r537.mjs, r3-scenario.mjs, r3-instr.js, probe.sh).

## Dispatcher instructions (2026-11-02, verbatim where load-bearing)
- "Reproduce first in real Obsidian."
- "Related but not yours: SC-535 (plugin off/on hangs Obsidian with an LP tracker on screen; not in this project) — note any overlap in your ledger, don't fix it."
- "Do not edit .claude/skills/dse-verify/SKILL.md in your branch; put proposed text in a proposal file in the ledger dir."
- "if you add a lifecycle scenario it is G-S63, and propose where it goes (G-S56 must stay last in whichever part holds it)." Part 3 is near the ~540 s tool limit.
- "Other owners run lifecycle/e2e on this machine: set your own DSE_LIFECYCLE_PORT for every lifecycle run." -> SC-545 uses port 9545 (workers may use 9546+ for a second concurrent run).
- "Report land-ready to the dispatcher and stop; the dispatcher lands."

## Env
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc545-lp-callout-replug-clicks` (created 2026-11-02 by owner), plugin branch `sc545-lp-callout-replug-clicks` at dse develop `f7c9c7ce`.
- Baseline (CURRENT @ f7c9c7ce): jest 6297 passed / 1 skipped / 251 of 252 suites; lifecycle 47/47 as 21 + 16 + 10 (part 3 = `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S57 G-S62 G-S56`); e2e 128/128, 0 failed, coverage 89/89.

## Overlaps (running efforts)
- SC-540 (landed f7c9c7ce): changed `armClickShield` in `src/framework/pipeline.ts`.
- SC-537 (landed): LP callout twin update listener (`registerEditorExtension`, `registerFrameworkElements.ts:75`).
- SC-544 (running, likely lands first): pending-write flush + lifecycle G-S61.
- SC-472 (running): scroll pin + G-S59.
- SC-551 (running): lifecycle/e2e CDP port handling.
- SC-535 (not ours): plugin off/on hangs Obsidian with an LP tracker on screen. Record overlap here when known.

## Rounds
- r1 (2026-11-02): diagnosis — orchestration:reviewer, brief `sc545-brief-r1-diagnose.md`, report `sc545-r1-diag-report.md`.

## r1 result (2026-11-02)
- Reproduced on f7c9c7ce every time. Cause: plugin toggle makes LP rebuild only code-block widgets; callout/embed widgets are reused with cached DOM, so no processor call reaches them; the old view's `registerDomEvent` listeners are gone and the stale click shield (`pipeline.ts:221-247`) swallows the press. Plain fences and Reading view are unaffected.
- SC-535 overlap: none found (hang not reproduced in 3 off/on runs with an LP tracker on screen; different cause). Not ours.

## Owner rulings on r1 (2026-11-02)
- Fix = option **AB**: A (stash at `ViewRegistry.onunload`, remount on layout-ready via `ReusedElementRemounter.mount`) is the normal path; B (`setViewData(getViewData(), true)` + ephemeral state) is a fallback ONLY for a view that still has a raw DSE fence or an unowned DSE card inside an LP callout or embed after A settles. Normal off/on must never trigger B (asserted).
- The stash is a cross-version contract (old build writes, new build reads, e.g. on a plugin update): pin a versioned key, store only Obsidian-owned objects and plain data (el, widget ctx, alias, body string) — never a reference to an old-instance DSE object/closure; the reader validates shape and falls through to B on mismatch. Document the contract in a comment at the key.
- B's costs are accepted for its rare cases (first update from a pre-fix build, a write pending at disable, a note opened while the plugin was off): undo history of that note is lost; implementer should try to keep the pixel scroll position (e.g. restore `scrollDOM.scrollTop` after rebuild) and report the measured shift — best effort, not a gate.
- Option C (route stale clicks to the live instance): rejected (r1 reasons).
- Option D (neutralise cards while the plugin is off): DROPPED — the plugin-off state is transient and enable now redraws the card; not worth a second code path.
- ~~Lifecycle scenario **G-S63** per the r1 proposal (phases a-g), placed in **part 2** (`G-S9b … G-S40`), appended at that part's end; part 3 unchanged (G-S56 stays last).~~ superseded 2026-11-02 by the dispatcher update below (G-S63 goes at the end of the new part 3). Proposed dse-verify text goes in `sc545-dse-verify-proposal.md` in this dir, NOT in SKILL.md.
- Jest: `test/dom/framework/replugRemount.test.ts` per r1 §3.

## Rounds
- r2 (2026-11-02): implementation — orchestration:implementer, brief `sc545-brief-r2-impl.md`, report `sc545-r2-impl-report.md`.

## Dispatcher update (2026-11-02, verbatim)
- "dse develop moved f7c9c7ce → 711f740d (SC-544 landed: ReadingModeBlockHost.replaceSource first flushes the note's other pending views via ViewRegistry.flushPendingWrites, with a re-entrancy guard — relevant to your plugin off/on + LP callout click path; new lifecycle G-S61). New baseline: jest 6307 passed / 1 skipped / 251 of 252 suites (fresh 6306 / 2); lifecycle 48/48 in FOUR `--only` parts, each with its own DSE_LIFECYCLE_PORT: part 1 `G-S7a … G-S9a` (21), part 2 `G-S9b … G-S40` (16), part 3 `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52` (7; 254 s), part 4 `G-S57 G-S62 G-S61 G-S56` (4; 295 s; G-S56 last); e2e 128/128 89/89; shots 592 0 FAIL 161/966; freeze 280/280; parity 0/0/24. Re-check your repro on 711f740d and rebase onto it. If you add G-S63 it fits in part 3 (254 s) or part 4 before G-S56."
- Owner ruling (2026-11-02): rebase onto 711f740d; re-confirm the bug reproduces on a 711f740d bundle (G-S63 red there). **G-S63 goes at the end of part 3** (`G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63`). Expected lifecycle 49/49 as 21 + 16 + 8 + 4. Expected jest 6307 + new tests / 1 skipped / 252 of 253 suites. Each lifecycle part gets its own port (SC-545: 9545, 9546, 9548, 9549 for the implementer; reviewer 9547, 9550-9552).
- r2 DONE (2026-11-02): plugin HEAD 1d655b8f on 711f740d; superproject c590a35b. Gates: jest 6327/1/252 of 253; lifecycle 49/49 as 21+16+8+4; e2e 128/128 89/89; shots 592 0 FAIL 161/966; freeze 280/280; parity 0/0/24. G-S63 red on 711f740d (a-f), green on HEAD (58 s). 8 mutants caught. Fallback scroll shift 0 px with pixel restore. Author: implementer ab0cfa92 (must not review).
- r3 (2026-11-02): independent review — orchestration:reviewer, brief sc545-brief-r3-review.md.
- Follow-up rulings on r2: hover popover / canvas LP cards uncovered -> DROP (not markdown leaves, plugin off/on with a popover open is transient; no report of it). Undo loss on fallback -> accepted per r1 ruling. lifecycle.mjs conflicts with SC-472/SC-551 -> landing note for the dispatcher.

## Dispatcher update 2 (2026-11-02, verbatim)
- "dse develop moved 711f740d → 367a2f1d (SC-551 landed, harness-only: lifecycle and the obsidian-shots camera start Obsidian with --remote-debugging-port=0 and talk only to a port proven theirs by scripts/cdp-owned.mjs; the start-up blocks of visual-harness/obsidian-lifecycle.mjs and obsidian-camera.mjs changed — possible textual overlap if you add G-S63 near them; docs-shots passes exit 2 through). main.js/styles.css byte-identical. New baseline: jest 6326 passed / 1 skipped / 252 of 253 suites (fresh 6325 / 2); everything else unchanged (lifecycle 48/48 in four parts, e2e 128/128 89/89, shots 592 0 FAIL 161/966, freeze 280/280, parity 0/0/24). A private DSE_LIFECYCLE_PORT is no longer needed after rebasing; a private DSE_CAMERA_TMP still is for concurrent shots (SC-554). Rebase onto 367a2f1d before your land-ready battery."
- Owner ruling: r3 reviews 1d655b8f on 711f740d as dispatched (SC-551 is harness-only, bundle byte-identical). The next implementer round (fix round, or a rebase-only round if r3 is clean) rebases onto 367a2f1d and runs the full land-ready battery there. Expected after rebase: jest 6346 passed / 1 skipped / 253 of 254 suites (6326 + 20 new tests, +1 suite); lifecycle 49/49 as 21 + 16 + 8 + 4; e2e 128/128 89/89; shots 592 0 FAIL 161/966 (private DSE_CAMERA_TMP); freeze 280/280; parity 0/0/24.

## r3 result (2026-11-02)
- NOT LAND-READY: 1 MEDIUM, 4 LOW, 5 INFO (report sc545-r3-review-report.md). Gates on 1d655b8f matched r2 (jest 6327/1/252 of 253; lifecycle 49/49; e2e 128/128 89/89). G-S63 red on 711f740d, green on HEAD, not vacuous. 22 real-Obsidian probes pass except P16a and a forged throwing-getter stash. SC-535 not seen (tracker in a callout off/on: no hang).

## Owner rulings on r3 (2026-11-02)
- MEDIUM-1 (a card CM6 has taken off the page at disable — about one screen away — is not stashed and stays dead when scrolled back): **FOLD into r4.** Stash such cards too; remount stashed cards when they come back into the editor DOM, from the editor update listener that already runs (`registerFrameworkElements.ts:77`); add G-S63 phase (h) for it (a tall note, the callout scrolled well off-screen at disable, scroll back, real `+` writes, card owned by the live registry, fallback not fired).
- MEDIUM-1 corollary (the one-time update from a pre-fix build when a card was off-screen at that moment): **document as a limit, do not code** — no viewport-time fallback rebuilds (risk of a rebuild mid-scroll). Recovers on reopening the note.
- LOW-1 (one throwing stash entry aborts the whole remount run + unhandled rejection): FOLD — per-element try/catch, `.catch(console.error)` on `replug.run()`.
- LOW-2 (the `disposed` check after the await is untested, mutant E): FOLD — jest case where `dispose()` lands during a slow remount with a raw fence present, asserting no `setViewData`.
- LOW-3 (CHANGELOG / `.repo-docs/architecture.md` / proposal overclaim): FOLD — state the limits plainly: canvas and hover-popover cards are not covered; an off-screen card during the one-time update from a pre-fix build stays dead until the note is reopened; the update that ships this fix redraws affected notes once and clears their undo history. Add a "Not covered" clause to the proposal's G-S63 text.
- LOW-4 (comment names a nonexistent `rebuildViewsWithUndrawnBlocks`): FOLD — fix the comment.
- INFO-1 (no G-S63 phase for the pre-fix-build update path): DROP — bundle-swap inside lifecycle is heavy; jest mutant A covers the logic and r3 P8 measured the real path.
- INFO-2: DROP (jest covers it; P9 shows the real code is right).
- INFO-3 (`onLayoutReady` runs synchronously on enable before processors/viewRegistry are set): DROP — harmless today, r3 measured; no code change.
- INFO-4 (canvas file-node card stays dead after off/on, same as base): DROP as a ticket — rare (plugin toggle with a canvas open), reopening heals; covered by LOW-3's "not covered" wording.
- INFO-5: no action.
- Rebase: r4 rebases onto 367a2f1d first (dispatcher update 2) and runs the full land-ready battery there.

## Rounds (cont.)
- r4 (2026-11-02): fix round — resume implementer ab0cfa92 (author of r2). r5: scoped re-review by r3 reviewer a55f7c8e (not an author).
- 2026-11-02: r4 implementer hit a session-limit 429 mid-battery (was starting lifecycle parts); dispatcher resumed it after reset and will relay completion. Owner does not resume/respawn it. Dispatcher update 2 (367a2f1d) was already folded into the r4 instructions.

## Dispatcher update 3 (2026-11-02, verbatim)
- "dse develop moved 367a2f1d → 0698550f (SC-472 landed: scroll pins/holds release on Obsidian's redraw with a load-aware backstop (2.5 s + 30 painted frames, 20 s cap) — src/framework/host/previewScrollPin.ts, livePreviewScrollHold.ts, new redrawBackstop; a leaf that navigates drops its pin; new lifecycle G-S59 in visual-harness/obsidian-lifecycle.mjs). Baseline: jest 6378 passed / 1 skipped / 253 of 254 suites (fresh 6377 / 2) · lifecycle 49/49 in FIVE `--only` parts: `G-S7a … G-S9a` (21), `G-S9b … G-S40` (16), `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52` (7), `G-S57 G-S62 G-S61 G-S56` (4), `G-S59` alone (1) · e2e 128/128 89/89 · shots 592 0 FAIL 161/966 · freeze 280/280 · parity 0/0/24. Your G-S63 makes it 50/50; place it in part 3 (241 s) or part 4 before G-S56 and say which in your proposal. Rebase onto 0698550f before land-ready (re-run any scenario near the plugin off/on path, e.g. G-S6e, since unload now tears down the backstop too)."
- Owner ruling: G-S63 stays at the END of part 3 (`G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63`). Land-ready battery runs on 0698550f. Expected: jest 6378 + all SC-545 tests / 1 skipped / 254 of 255 suites; lifecycle 50/50 as 21 + 16 + 8 + 4 + 1; e2e 128/128 89/89; shots 592 0 FAIL 161/966; freeze 280/280; parity 0/0/24. G-S6e (and the other off/on scenarios) are covered by the full lifecycle run; G-S63 (e) scroll phase must still hold with SC-472's backstop.

## r4 result (2026-11-02, relayed by dispatcher)
- DONE: plugin HEAD c0ce04cf (14 commits over 0698550f); superproject 586c82ef (CHANGELOG only). jest 6408/1/254 of 255; lifecycle 50/50 = 21+16+8+4+1 (part 3 302 s); e2e 128/128 89/89; shots 592 0 FAIL 161/966; freeze 280/280; parity 0/0/24. Phase (h) red on 0698550f and on the pre-MEDIUM-1 source, green on HEAD. Mutants 9-14 caught.
- New in r4: G-S63 (b) flake — Obsidian re-renders an LP embed's content at disable on ~2/3 runs (raw fence), so the fallback rebuilds the host note once (undo history lost). Phase (b) now allows <= 1 rebuild.
- Owner ruling: r5 scoped re-review checks the delta AND makes a bounded feasibility probe (≤ ~45 min) of redrawing just the raw embed (e.g. the embed component's own reload/rerender) instead of rebuilding the host note. If a safe targeted redraw exists, it is folded in r6; if not, file a Backlog ticket for it and keep the fallback.
- r5: resume r3 reviewer a55f7c8e (not an author of r2/r4).

## r5 result (2026-11-03)
- NOT LAND-READY: MEDIUM 1 (test only), LOW 2, INFO 3. Plugin delta correct in real Obsidian (P16a, P18-P21, P7g/P7h pass). jest 6408/1/254 of 255; part 3 8/8 (308 s); part 4 3/4 first run (G-S61 (e) 4 stale frames, limit 3), G-S61 3/3 on re-runs, base shows the same margin. G-S63 red on 0698550f, 4/4 green on HEAD.
- Embed raw-at-disable (r4's flake explanation): not reproduced, 0/18 toggles. Targeted embed redraw works only via Obsidian's private renderer prototype; public options fail.

## Owner rulings on r5 (2026-11-03)
- MEDIUM-1 (G-S63 (b)'s "≤ 1 rebuild" lets a mutant that rebuilds every embedding note on every off/on pass; jest only covers callouts at `replugRemount.test.ts:376`): FOLD — in (b) allow the one rebuild only if a raw fence was observed in the embed while the plugin was off, else require 0 rebuilds; add the jest embed twin of `:376` that mutant K must fail.
- LOW-1 (`.repo-docs/architecture.md:123` and proposal `:23` state "about two toggles in three" as fact; "(asserted)" wording): FOLD — qualify the wording (seen in r4 runs, not reproduced in r5's 18 toggles); "(asserted)" is true again after MEDIUM-1.
- LOW-2 (`replugRemount.ts:198` `dispose()` re-marks only connected in-flight elements): FOLD — drop the `el.isConnected` condition to match the stash side.
- INFO-1 (G-S61 (e) load flake, exists on base): FILED SC-557 (Backlog, related SC-545 + SC-544). Out of scope.
- INFO-2 (targeted embed redraw via private renderer prototype): DROP as a ticket — the raw-embed case was not reproduced (0/18), only a private-API hook would fix it, and the fallback already makes the card work; the cost (one undo-history reset) is documented.
- INFO-3: no action.
- r6: resume implementer ab0cfa92. Battery after r6: jest (expect 6408 + new / 1 / 254 of 255), lifecycle all five parts (50/50), e2e; shots/freeze/parity only if src beyond replugRemount.ts changed (bundle change is one condition — run shots+freeze anyway since main.js changes). r7: scoped re-review by a55f7c8e.
- 2026-11-03: r6 implementer hung (footgun 13) on the mutant-15 G-S63 Bash call; dispatcher TaskStopped and resumed it (literal-path single-gate call). Owner had also queued a resume message (harmless; same agent). Owner does not resume/respawn; dispatcher relays completion.

## Dispatcher update 4 (2026-11-03, verbatim)
- "dse develop moved 0698550f → ea78ebf8 (SC-547 landed: src/framework/host/ReadingModeBlockHost.ts and remountReused.ts — the LP callout twin check builds each callout's fence list once per `reconcile` pass via a `PassMemo`; your remountReattached / off-page stash work is in the same area — expect a possible textual conflict in remountReused.ts). Baseline: jest 6383 passed / 1 skipped / 253 of 254 suites (fresh 6382 / 2); everything else unchanged (lifecycle 49/49 in five parts, e2e 128/128 89/89, shots 592 0 FAIL 161/966, freeze 280/280, parity 0/0/24). Rebase onto ea78ebf8 before land-ready and re-run G-S57, G-S61 and G-S63."
- Owner ruling: r6 finishes its current step, rebases onto ea78ebf8, and runs the land-ready battery there. Expected: jest 6383 + all SC-545 tests / 1 skipped / 254 of 255 suites; lifecycle 50/50 as 21 + 16 + 8 + 4 + 1 (covers G-S57, G-S61, G-S63); e2e 128/128 89/89; shots 592 0 FAIL 161/966; freeze 280/280; parity 0/0/24.

## r6 result (2026-11-03, relayed)
- DONE: plugin HEAD 09ece2eb (16 commits over ea78ebf8, no rebase conflicts; PassMemo kept, mount public); superproject 586c82ef. jest 6415/1/254 of 255 (6383 + 32); lifecycle 50/50 = 21+16+8+4+1 (182/322/305/296/167 s); e2e 128/128 89/89; shots 592 0 FAIL 161/966; freeze 280/280; parity 0/0/24. Mutant K fails new jest embed test and G-S63 (b) (0 raw fences seen -> 0 rebuilds required). Mutant 16 (LOW-2 revert) fails jest.
- r7: scoped re-review of the r6 delta + SC-547 rebase interplay, by a55f7c8e (reviewer, not an author).

## r7 result (2026-11-03)
- LAND-READY: 0 HIGH/MEDIUM/LOW, 3 INFO. jest 6415/1/254 of 255; G-S57 G-S61 G-S63 3/3; mutant K fails jest + G-S63 (b) on HEAD source. SC-547 interplay fine.
- Owner rulings: INFO-1 no action (harness runs --only in file order). INFO-2/INFO-3 proposal slips fixed by owner in the ledger proposal file (305 s; r6; fresh 6414/2 marked inferred).
- LAND-READY (2026-11-03): plugin sc545-lp-callout-replug-clicks @ 09ece2eb on dse develop ea78ebf8; superproject 586c82ef (CHANGELOG). Proposal for dse-verify: sc545-dse-verify-proposal.md. Reported to dispatcher.
- 2026-11-03: land-ready comment posted on SC-545 (sc545-comment-landready.md, 1 image). Ticket stays Awaiting until the dispatcher lands.
- 2026-11-03 DONE: landed by the dispatcher — dse develop 09ece2eb; workspace main 94f45fd1 (merge) + 37017894 (bookkeeping: ledger preserved at docs/superpowers/dse-overhaul/build-ledgers/sc545-lp-callout-replug-clicks*, dse-verify proposal applied: row 4 50/50 with G-S63 at end of part 3, G-S63 clause, footguns addendum, CURRENT). CHANGELOG conflict with SC-547 resolved keeping both (SC-545 first). Worktree removed. Landed comment posted; SC-545 -> Done. Follow-up open: SC-557 (Backlog).
