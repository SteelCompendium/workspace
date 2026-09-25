# SDD ledger — plan: /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/docs/superpowers/dse-overhaul/plans/2026-09-23-sc340-view-adoption.md

Spec: /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/docs/superpowers/dse-overhaul/SC-340-view-adoption-spec.md @ 2428179 (APPROVED)
Effort ledger: workspace/.superpowers/sdd/sc340-view-adoption/sc340-decisions.md. Execution method: subagent-driven (Scott, 2026-09-23).
Superproject branch merged origin/main (a2e7862: SC-343 landed; identical spec add/add merged clean); steel-etl/v2/github.io worktree checkouts moved to main's pins.

## Pre-flight scan

| Pair / task | Produces → consumes | Finding |
|---|---|---|
| SC-343 (landed) → T0/T2/T8 | lifecycle gate FIXTURES/SCENARIOS/t | gate has 6 scenarios (G-S6u added) — plan says 5 |
| SC-343 → T2/T3/T6 | setMountedBody, lastKnownBody, lastKnownLineStart, normalizeBody, readSection, ctor (plugin, el, ctx, alias, scrollPin) | consistent (extra private helpers don't collide) |
| T1 → T2..T8 | mock load/unload semantics | consistent |
| T2 → T3 | registry, entry, makeRenderChild, onRenderChildUnload, noteWrite | consistent |
| T2/T3 → T4 | claim/finishClaim/release, rebind, docId | consistent |
| T4 → T5 | claim body; collision check before ticket consume | consistent |
| T6 ← SC-343 | lastKnownBody for the form editor | consistent (knownBody updated inside the process callback) |
| T7 → T8 | adoption ON before the gate runs | consistent |
| T8 self | G-S6g asserts hover read-only | CONFLICT with measured reality (hover writable, base == head) |
| T8 self | expected 18/18 | wrong: 19/19 |
| T4 self | pool-modal carry-over passes trivially on develop (no deferral code) | acceptable as a regression pin |

Ruling: every "5/5" → 6/6 and "18/18" → 19/19 (SC-343 landed with G-S6u) — cost if wrong: a number in a doc.
Ruling: G-S6g rewritten — assert a hover popover's counter is WRITABLE and a click there writes the RIGHT block of the right note (value +1, other content unchanged, no Notice, no error); its registry view is released when the popover closes. The stop-and-report branch is moot (the question is answered: writable on base and head) — cost if wrong: one scenario's assertion.
Ruling: T8 docs also correct the SC-340 spec (now on main): §6.4 unload-order text (registered callbacks run LIFO → the flush runs after a modal's close), the hover row ("canvas, print … read-only; hover resolves and writes"), and §6.2's collision-guard mechanism (by position, not preview container) — cost if wrong: doc text.
Ruling: T0 folded into T1's dispatch (setup folds into the first deliverable; no commit) — cost if wrong: none.

## Tasks
Task 0+1: dispatched (orchestration:implementer/Sonnet), BASE e4bcd0f → rebase onto origin/develop 48ac20c
Task 0: complete (rebased onto 48ac20c; baseline tsc/lint clean; jest 3969/1/204 of 205; lifecycle 6/6; shots ok; freeze 260/260; parity 0/0/16)
Task 1: implemented 48ac20c..8cc21b0 (mock LIFO; 19 tests fixed in 18 files, all 'unloaded without load'); review dispatched (orchestration:reviewer/Opus)
Task 1: review → Needs fixes. Mock exact; 20 (not 19) edited tests all faithful. Important-1: element-view.test.ts:333-344 "unload() with nothing pending is a harmless no-op" now VACUOUS (TestView never loaded) — mutation-proven. Important-2: managedModal.test.ts:261-271 "close is idempotent" VACUOUS (owner never loaded) — mutation-proven.
Ruling: fix both; PROMOTE Minor-3 (make each touched file's `fakeOwner()` return a LOADED Component — fixes Imp-2 at the root, stops print-media's leaked beforeprint/afterprint listeners, covers the cleanup-only owner.unload calls) and Minor-5 (self-test "a later load does not resurrect them" must actually re-load and assert the child's onload did not run again) — cost if wrong: test-only edits.
Ruling: Minor-4 (187 unloads on never-loaded components across suites with `addChild: (c) => c` fake hosts) → FILED SC-353 (Backlog) — too broad for this task; teardown-named assertions checked still measure DOM counts.
Task 1: minor (deferred): report count said 19 tests; actual 20.
Task 1: fix round 1/5 dispatched (resume implementer), FIX_BASE 8cc21b0
Task 1: fix round 1/5 (4 addressed, 0 open — both vacuous tests now mutation-discriminating; loaded fakeOwner helpers; selftest re-load assertion; commits 8cc21b0..c999e29)
Task 1: complete (commits 48ac20c..c999e29, review clean after 1 fix round)
Task 2: dispatched (orchestration:implementer/Sonnet), BASE c999e29
Task 2: implemented c999e29..8c82898 (+7 tests; jest 3980/1; lifecycle 6/6); review dispatched (orchestration:reviewer/Opus)
Task 2: review → Needs fixes. (b)(c)(d) clean; plugin-unload + release ordering correct. Important-1: a view OWNED after its render child already unloaded (render child unloads while pipeline.run awaits prepareModel/ref resolution) stays loaded in the registry until plugin unload — probe-proven (size 1, loaded true).
Ruling: fix Important-1 as prescribed (host remembers `renderChildGone`; ViewRegistry.own releases immediately if set; jest pins it) — cost if wrong: a few lines.
Ruling: FOLD Minor-1 (three now-false comments: main.ts:626, ReadingModeBlockHost.ts:5-8, BlockHost.ts addChild doc) and Minor-2 (`this.viewRegistry = null` in main.ts onunload) — they're in files this task touched — cost if wrong: comment text.
Task 2: minor (deferred): the LIFO test uses a bare Component (checks mock semantics, not ElementView's flush registration) — brief-mandated; the Task 4/8 real-view tests cover the real order.
Task 2: ⚠️ for Task 8 gate: render child never loaded (section dropped before load) can't be caught in-process; print/export & canvas off-screen unmount; registry.size == rendered after a fast navigate-away from a many-ref note — add to G-S6i-style assertions.
Task 2: fix round 1/5 dispatched (resume implementer), FIX_BASE 8c82898
Task 2: fix round 1/5 (3 addressed, 0 open — late-own release; comments; viewRegistry=null; commits 8c82898..2c53add). Re-review: renderChildGone resets per makeRenderChild (safe across rebind); immediate release can't write (persistScheduled false before mount).
Ruling: the re-review's new Minor (BlockHost.ts addChild doc ~:70-75 and ReadingModeBlockHost.ts:6-9 recommend host.addChild for a view's AUXILIARY components — contradicts spec §6.1: under adoption they'd die ~50 ms after the old render child unloads) is CARRIED into Task 3's dispatch (Task 3 edits ReadingModeBlockHost; same comment family) — cost if wrong: comment text.
Task 2: complete (commits c999e29..2c53add, review clean after 1 fix round)
Task 3: dispatched (orchestration:implementer/Sonnet), BASE 2c53add
Task 3: implemented 2c53add..8baffee (+3 tests; jest 3984/1); review dispatched (resume Task 2 reviewer — knows the host)
Task 3: review APPROVED (no Critical/Important). (a) mid-write rebind safe — SC-343 hint-then-revalidate; (b) cached getters unchanged across a claim; (c) scroll pin correct.
Ruling: carry Task 3 Minor-1 into Task 4 — a ticket recorded for a write that changes nothing (abort/miss/body equal to disk) is removed after Vault.process, so it can't mis-claim an identical-body twin's rebuild within 3 s — cost if wrong: a few lines + a test.
Ruling: carry Task 3 Minor-2 into Task 4 — strengthen the rebind test (lastKnownBody unchanged; lastKnownLineStart moves on a second-block rebind) — cost if wrong: test text.
Task 3: complete (commits 2c53add..8baffee, review clean)
Task 4: dispatched (orchestration:implementer/Sonnet), BASE 8baffee
Task 4: implemented 8baffee..9816e07 (eff111f adopt; 9816e07 carried fixes; jest 3995/1; lifecycle 6/6); review dispatched (fresh orchestration:reviewer/Opus)
Task 4: review → Needs fixes (small). Probes P1–P9 confirm claim/adopt/§8 fallback/render-child handling; P4 proves the SC-331 pin FAILS with adoption off. I-1: ticket survives a THROWING vault.process (carried fix 1 incomplete).
Ruling: fix I-1 (try/finally drop + reject-stub jest pin) — cost if wrong: few lines.
Ruling: FOLD M-2 — claim uses the NEWEST matching ticket (findLastIndex) and ties sort by that ticket; spec §6.2 says "the entry with the newest ticket wins" (binding over the plan's findIndex text); worst case of newest-first is a miss → fresh view (safe) — cost if wrong: a miss where oldest-first would adopt.
Ruling: FOLD M-1 (SC-331 pin: a second change after adoption also writes and re-adopts, claims===2; remove modalEl at the end), M-3 (jest pins for the §8 fallback: rebind throws; appendChild throws), M-5 (focus: watch the document that ends up hosting el; only refocus when activeElement is body/null — never steal focus the user moved), M-6 (afterEach real timers; docId test asserts one write per click) — all in Task 4's own area — cost if wrong: small.
Task 4: ⚠️ → Task 8 gate: M-4 (section whose render child never loads leaks a view — assert live views == rendered blocks); popout focus; NEW: Reading → Live Preview toggle with a pending write (LP code blocks also run this processor — if LP ctx.docId equals the hidden preview's, the hidden reading root could be adopted into an LP widget) → add a gate scenario.
Task 4: fix round 1/5 dispatched (resume implementer), FIX_BASE 9816e07
Task 4: fix round 1/5 (6 addressed, 0 open — I-1 ticket drop on throw; M-2 newest ticket wins; M-1/M-3/M-5/M-6; commit a375b90). Re-review approved; newest-first never consumes a newer ticket (A then B → B survives); A,B,A with three separate rebuilds → later two miss (safe fallback, needs 3 writes before the first rebuild).
Task 4: ⚠️ → Task 8 G-S3: focus restores only when activeElement is body/null — if Obsidian's re-render parks focus elsewhere (e.g. the preview container), G-S3 will fail → then loosen to "not an element outside the preview", don't drop the guard.
Task 4: complete (commits 8baffee..a375b90, review clean after 1 fix round)
Task 5: dispatched (orchestration:implementer/Sonnet), BASE a375b90
Task 5: implemented a375b90..5889eba (+2 tests; jest 4002/1); review dispatched (resume Task 4 reviewer)
Task 5: review → Needs fixes. Refused claim clean (no leak/double view). I-1 (plan-design): guard compares the OTHER entry's CACHED lastKnownLineStart, which goes stale after an edit above the block (B5: no re-render) → probe lines [6,2], collision missed, writer's view stolen by the other instance. Only reachable if B4 (distinct docIds per instance) breaks — never observed.
Ruling: fix I-1 now with the cheap part — on a hit, refresh each same-docId/same-sourcePath other's position via `other.host.getBlockInfo()?.lineStart ?? other.host.lastKnownLineStart` before comparing; the reviewer's "previous body on the ticket" extension is DECLINED (added state for a never-observed case; real-Obsidian B6 null falls back to the cached line) — cost if wrong: a stale-line miss when the other's section is mid-rebuild AND B4 is broken.
Ruling: FOLD Minor-1 (refused-claim test asserts ticket intact + claiming false; afterEach real timers), Minor-2 (ignore other entries whose CURRENT render child never loaded — a leaked never-loaded entry must not disable adoption for its block), Minor-3 (comment: a null-line other is skipped) — cost if wrong: small.
Task 5: fix round 1/5 dispatched (resume implementer), FIX_BASE 5889eba
Task 5: fix implemented 5889eba..589d173 (jest 4004/1). Note: sidebarEncounterHandoff.test.ts 'SC-153: Open in sidebar is idempotent' failed ONCE under loadavg 12.3, passed standalone + full rerun — logged as a load-sensitive flake for the final review to triage (sidebar path unchanged by SC-340, but Task 1 changed mock unload semantics).
Task 5: fix round 1/5 (4 addressed, 0 open — live-position refresh; ignore never-loaded others; test asserts; comment; commit 589d173). Re-review: getBlockInfo() refresh on other hosts is benign (probe: sibling writes its own block after the refresh).
Ruling: carry the re-review's Minor (line-shift pin asserts `not.toBe(a.el.firstElementChild)`, which passes even if adopted — assert `a.el.firstElementChild === aRoot`) into Task 6's dispatch (same test file) — cost if wrong: test text.
Task 5: ⚠️ → Task 8: renderChildLoaded assumes Obsidian loads a section's render children soon after the processor — record with the M-4 live==rendered check.
Task 5: complete (commits a375b90..589d173, review clean after 1 fix round)
Task 6: dispatched (orchestration:implementer/Sonnet), BASE 589d173
Task 6: implemented 589d173..5588bc4 (+3 tests; jest 4007/1; added isConnected guards to negotiation checkbox change handlers beyond the spec §9.1 audit table — reviewer to judge); review dispatched
Task 6: review → Needs fixes. I-1: the stepper's `isConnected` guard NEVER fires in a real browser — Chromium 149 probe: a focused input moved by appendChild fires change/blur/focusout while STILL CONNECTED (spec §9.1's premise "a removal blur always happens after the node left the document" is FALSE); the jsdom test was tautological. §9.2 form editor ✅ (2 adopted writes → latest body). Carried test fix ✅.
Ruling: fix I-1 order-independently — adoptView marks the root `data-dse-moving` around appendChild (removed in finally); the stepper blur handler returns when `!el.isConnected || el.closest('[data-dse-moving]')`; jsdom test drives the real order (marked ancestor, connected blur → no onChange; reinsert + real blur → commits); G-S3 (Task 8) must assert no extra write from a half-typed stepper draft in Obsidian's Chrome 106 — cost if wrong: a generic attribute coupling kit↔host.
Ruling: M-1 REVERT the negotiation checkbox guards (inert: adoption fires only blur on a checkbox; a real toggle is always connected; spec §9.1 table says "None"; reverting also undoes the 3-test churn) — cost if wrong: none (dead code).
Ruling: FOLD M-2 partly — a second adopted write before the pencil; the trailing-pencil entry point only if a view renders it with a small fixture (else note it) — cost if wrong: test text.
Spec correction for Task 8 docs: §9.1's premise is wrong (Chromium fires blur/change while the node is still connected during removal) — record the attribute mechanism instead.
Task 6: fix round 1/5 dispatched (resume implementer), FIX_BASE 5588bc4
Task 6: fix round 1/5 (3 addressed, 0 open — moving marker guard (Chromium-probed: change+blur during appendChild caught; draft survives; later real blur commits; marker removed on throw); negotiation guards reverted; 2-write form-editor test; commits 5588bc4..08bc50b)
Task 6: minor (deferred): MOVING_ATTR lives in host/adoptView.ts and the kit imports it — could move to a shared constants module (no runtime cycle; boundary check allows it).
Task 6: minor (deferred): the pipeline's trailing-pencil entry point has no currentBody() test (no small fixture renders it; same function as the chrome entry).
Task 6: ⚠️ → Task 8 G-S3: (1) Obsidian's Chrome 106 blurs during the move like Chromium 149 (marker catches it) — assert NO extra write from a half-typed stepper draft; (2) Obsidian doesn't detach the section a SECOND time after focus is restored (an unmarked blur would commit).
Task 6: complete (commits 589d173..08bc50b, review clean after 1 fix round)
Task 7: dispatched (orchestration:implementer/Sonnet), BASE 08bc50b
Task 7: implemented 08bc50b..5827b29 (+1 test; jest 4008/1; lifecycle 6/6 with adoption ON); review dispatched (orchestration:implementer/Sonnet as reviewer — small diff)
Task 7: complete (commits 08bc50b..5827b29, review clean) — adoption ON by default; `viewAdoption` never serialized when absent; enabled read once at load.
Task 8: dispatched (orchestration:implementer/Sonnet) with task-8-addendum.md (19/19; G-S6g rewritten; collisions/ambiguous==0 in G-S1..4; G-S3 stepper-draft phase; G-S6c LP + raw Source; G-S6i fast-nav live==rendered; spec corrections §6.2/§6.4/§9.1/hover), BASE 5827b29
Task 8: implemented dse 5827b29..7d739bd (ee78bfa scenarios, e7cd2b9 G-S3 trust-dialog harness fix, 7d739bd docs) + superproject a2e7862..823a736 (31bbad2 F1/spec/dse-verify, 823a736 freeze-row). Lifecycle 19/19 (twice); discrimination G-S1/2/3 FAIL with adoption off. Battery: jest 4008/1; shots 524; FREEZE VIOLATED 16; parity 0/0/16.
Ruling: the freeze violation is BASE DRIFT — SC-328 landed on develop (c524fd2, incl. the 6.0.2 hotfix skills data f860156) with Scott's sanctioned shared-baseline rebaseline applied 2026-09-24 08:01 (pre-sc328-bak); this branch sits on 48ac20c (pre-SC-328) → resolve by REBASING onto origin/develop (6c4f6aa, also carries SC-288/SC-282 sidebar changes) and re-running the battery; never touch the baseline — cost if wrong: a rebase round.
Order: Task 8 review (pre-rebase diff) → rebase onto origin/develop + full battery → final whole-branch review on the REBASED code (SC-282 r2 "catch persist rejection" may touch ElementView/persist).
Task 8: review dispatched (fresh orchestration:reviewer/Opus)
Task 8: review → Needs fixes (no Critical). Reviewer reproduced 19/19; G-S3 phase 2 fails with its stepper fix reverted (real discrimination). I-1: G-S6i/G-S3 generic `.modal-close-button` fallback closes ANY modal before the orphaned-modal count (can't fail). I-2: G-S6g "released after popover closes" can't fail (DOM .remove() leaves the view connected+registered; hoverPopover.hide() releases — product fine). I-3: dse-verify freeze note wrongly prescribes porting f860156 (develop already has it via SC-328) — should say base drift pending rebase. I-4: architecture.md says claim() refuses on ambiguity (it counts + newest wins).
Ruling: fix I-1..I-4 and FOLD Minor-1 (G-S6c: correct the comment — the hidden stale LP widget was clicked; assert exactly one connected entry inside .markdown-reading-view after returning), Minor-2 (scope clickIncrease/tag/sameRoot/root to the VISIBLE reading view), Minor-3 (spec stale lines: "gate adds hover", "8/8 ok"), Minor-4 (warm-up comments name the trust dialog; one deterministic trust-dialog handler) — all harness/doc — cost if wrong: small.
Ruling: COMBINE the rebase onto origin/develop (6c4f6aa: SC-328, SC-288, SC-282) + full battery into this fix dispatch; dse-verify numbers re-measured at the rebased head; stop (BLOCKED) on any conflict in src/framework/** — cost if wrong: a separate rebase round.
Task 8: minor → Backlog: after Live Preview → raw Source, one disconnected-but-loaded registry entry lingers until the leaf closes (released on leaf detach).
Task 8: note for final review: sidebarEncounterHandoff.test.ts:416 flaked again under load (7) — second occurrence; passes isolated.
Housekeeping: controller deleted /tmp/dse-obsidian-lifecycle-1ocfB3 (discrimination-run leftover).
Task 8: fix round 1/5 + rebase dispatched (resume implementer), FIX_BASE dse 7d739bd / superproject 823a736
Task 8: fix round 1 + rebase done. dse rebased onto origin/develop 6c4f6aa (all SC-340 shas rewritten: e446d51 … c23f744 adoption-on, b6498b0/cb1a27c/c3cbc7c gate+docs, 38040af fix round); superproject 1995a32 + f2faf8f. Rebased battery: tsc/lint clean; jest 4036/1/208 of 209/3; lifecycle 19/19 (x2 post-rebase); discrimination G-S1/2/3 FAIL with adoption off; shots 524 0 FAIL; FREEZE OK 260/260; parity 0/0/16. Trust dialog now handled by one MutationObserver (it's not a standard Modal; close is .modal-header-button).
Task 8: scoped re-review dispatched (resume Task 8 reviewer)
Task 8: fix round 1/5 (8 addressed, 0 open of the listed findings). Re-review: G-S6g release now FAILs on a DOM-remove close and on an unreleased view; orphaned DSE modal would fail G-S6i; trust handler never dismissed a DSE modal. NEW-1 (Important): the fix round silently weakened G-S3's focus assertion (`st.active` → a latched `st.refocused`) — unrequested, unreported; the strict assertion passes 19/19 at 38040af (reviewer probe).
Ruling: restore the strict `st.active && caret` assertion (New-1); FOLD New-2 (G-S6g asserts the tagged popover root is a live connected registry entry BEFORE hide()) and the trust-selector tightening (`.mod-trust-folder .modal-header-button`, not text) — cost if wrong: harness lines.
Environment: another session (sc231-keyword-chips) is running the lifecycle gate concurrently on :160 → our runs must set a distinct DSE_LIFECYCLE_PORT; /tmp/dse-obsidian-lifecycle-WDgfw9 left alone (ownership unclear).
Task 8: fix round 2/5 dispatched (resume implementer), FIX_BASE dse 38040af
Task 8: fix round 2/5 (3 addressed — strict G-S3 focus restored; G-S6g adoption-before-release; trust dialog by class; commit 8a33ca8). Approved.
Task 8: minor (deferred): AUTO_DISMISS_TRUST_DIALOG comment says "never on text" but the text fallback runs for non-trust containers (incl. DSE modals) — skip `.dse-modal` containers or reword.
Task 8: complete (dse 5827b29..8a33ca8 incl. rebase onto 6c4f6aa; superproject a2e7862..f2faf8f)
Final review: dispatched (fresh orchestration:reviewer/Opus) over dse 6c4f6aa..8a33ca8 + superproject merge-base..HEAD
Final review: READY TO MERGE — WITH FIXES (no Critical/Important). Real-Obsidian probes: LP editing steady (no growth, 0 LP adoptions); canvas file node writable + released on navigate. SC-282/288/328 interplay clean.
Ruling: ONE final fix dispatch: Minor-1 (architecture.md:116/:597 — the claim ticket is recorded by noteWrite inside replaceSource, not notePersistIntent) + Minor-2 (dse-verify SKILL.md:55 G-S6c = same leaf LP then raw Source; name DSE_LIFECYCLE_PORT for concurrent runs) [fix-before-merge]; FOLD Minor-3 (claim also requires normalizeBody(host.lastKnownBody) === wanted — closes the X,Y,revert-to-X view≠document gap; update view-registry.test.ts:200; add a refusal test), Minor-5 (jest: initiative ConditionsModal open + pick + render-child unload before the debounce → modal closed, note has the value), CHANGELOG mentions the hidden viewAdoption kill switch, and the T8 trust-dialog comment/fallback (skip `.dse-modal` containers) — cost if wrong: small.
Ruling: Minor-4 (adoption into a section replaced before its render child loads → view never released) + the print/export release probe → FILED SC-365 (Backlog). Minor-6 (sidebarEncounterHandoff flake) ROOT-CAUSED as a test bug (random anchor id sometimes quoted by stringifyYaml; test uses plain includes) → comment posted on existing SC-352; not SC-340.
Final-review triage accepted: all other deferred minors stay deferred (reasons in the final review); ⚠️ items covered by G-S3/G-S6c/G-S6i except popout focus (stay-deferred) and print/export (SC-365).
Final fix: dispatched (fresh orchestration:implementer/Sonnet), FIX_BASE dse 8a33ca8 / superproject f2faf8f
Final fix: dse 8a33ca8..619c4bd, superproject f2faf8f..7e0dbda; battery all green (jest 4038/1; lifecycle 19/19; shots clean; freeze 260/260; parity 0/0/16). Scoped re-review dispatched (resume final reviewer).
Final fix re-review: READY TO MERGE — Yes. Items 1–6 PASS. The claim body check can only refuse (→ fresh view, nothing lost) when a second write's callback lands inside the ~5 ms write→rebuild gap — effectively unreachable (debounce ≥400 ms; unload flush = release; FormModal save needs click+pencil+Save <400 ms).
Task parked — dse-verify SKILL.md :910 says jest 4036 (measured 4038 after the final fix) — Ruling: fixed at landing, where the numbers are re-measured anyway (develop may move again) — cost if wrong: a stale number.
Task parked — obsidian-lifecycle.mjs trust-dialog outer JSDoc (~:301-303) still says "never on text" — Ruling: parked (harness comment; the inline comment and code are correct) — cost if wrong: a misleading comment.
Evidence capture dispatched (before/after screenshots, develop 6c4f6aa vs 619c4bd).
