# SC-422 decisions ledger — text-size prefs don't reach plugin surfaces outside an element root

Worktree: /home/scott/code/steelCompendium/worktrees/sc422-textscale-surfaces (every submodule on branch `sc422-textscale-surfaces`; dse cut from origin/develop 7817133)
Ledger dir: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc422-textscale-surfaces/ (files prefixed `sc422-`)
Origin: SC-372 r2 review LOW-1 / §F2 — docs/superpowers/dse-overhaul/build-ledgers/sc372-textscale/sc372-r2-review-report.md:23-28, :129-140

## Scott rulings (verbatim, dated)

- **2026-10-21 (Scott, on the land-ready ask showing plugin chrome following the text-size settings):** "looks good, land it" — confirms O1 (plugin chrome follows the text-size prefs) and sanctions landing.

## Ticket description (verbatim excerpt, the spec of record)

> The Small and Control text-size prefs only take effect inside roots the plugin stamps with the pref values: element roots and DseModal dialogs. These surfaces use the size tokens but sit outside any stamped root, so they ignore the prefs:
>
> * Compendium search modal hints (`.dse-compendium-suggest__type/__source/__code/__hint`). The modal is a `SuggestModal`, not a DseModal. **This ships in 7.0.0.**
> * Settings preview caption (`.dse-settings-preview__label`). It sits outside the stamped preview root.
> * Sidebar panel header (`.dse-sidebar__panel-header`) and sidebar empty message. Both are behind the experimental switch.
>
> Decision needed: should plugin chrome follow the text-size prefs at all? If yes, fix all four surfaces together. The search modal needs a lifetime owner for the pref subscription.

## Owner decisions (ticket-owner, 2026-10-20 — not Scott rulings)

- O1. **Answer to "should plugin chrome follow the prefs": YES, provisionally** — the pref catalog's own help text is the contract (src/prefs/catalog.ts:349, :361 "Applies everywhere, including print and export"; :373 control = "text on buttons, steppers, tabs and collapse headers"). The fix is built on the branch and Scott confirms or rejects it from before/after evidence at the land-ready ask (one round trip instead of two). If he says no, the branch is dropped and the catalog help text is reworded instead.
- O2. Fix all four surfaces together (search modal hints, settings preview caption, sidebar panel header, sidebar empty message) plus any other token consumer outside a stamped root that the survey finds.
- O3. Per-root stamping stays the mechanism (SC-372 O3): never stamp `<html>`/document root. Every new stamp has a Component lifetime owner whose unload releases the pref subscription.
- O4. At default prefs, zero frozen bytes move — freeze 276/276. Any frozen-byte movement is stop-and-explain.
- O5. Every knob still applies exactly once (SC-372 F1): the `text scale once OK` sweep must stay green and must cover the new roots.

## Rounds / authorship (for author-independence)

- r1 implement — orchestration:implementer. Brief: sc422-brief-r1-implement.md
  - r1 implementer agent a97b14934788e0d1c dispatched 2026-10-20 (it is the r3 fixer; the r2 review must be a fresh orchestration:reviewer).
- 2026-10-20: owner was killed once by an API usage limit right after wt-new (dispatcher relay); resumed with context intact. Ticket flipped Backlog -> Awaiting.
- 2026-10-20: dispatcher relay — dse origin/develop moved 7817133 -> b6b08f3 (SC-455 landed; lifecycle G-S11). New baselines: jest 5242/1/230 of 231; lifecycle 27/27; e2e 80/85 ok, 0 failed, 5 known-bug, 51/51; shots 572 + pressed-toggle parity; freeze 276/276; parity 0/0/24. Workspace main 8969a34. Relayed to r1 implementer via SendMessage: rebase onto b6b08f3 before the final battery.
- 2026-10-20: dispatcher relay — dse origin/develop moved b6b08f3 -> ab34293 (SC-431 landed: escapeConsumer registry; e2e STAM-T12, COND-E01). New baselines: jest 5262/1/230 of 231; lifecycle 27/27; e2e 83/87 ok, 0 failed, 4 known-bug, 57/57; shots 572 + pressed-toggle parity; freeze 276/276; parity 0/0/24. Workspace main b21e48b. Relayed to r1 implementer (rebase onto ab34293; check search-modal unload on every close path incl. Escape).
- r1 DONE 2026-10-20: dse 487b444 on ab34293 (4 commits); superproject c44b5b2 on b21e48b (D3-token-map.md). New `.dse-fs-root` class + `stampTextScaleRoot` helper; stamps: search modal modalEl (own Component, onOpen/onClose), settings preview wrapper (per-mount Component), `.dse-sidebar` container (view). Survey: no other out-of-root consumer. Gates: jest 5278/1/231 of 232 (+16, +1 suite), lifecycle 27/27, e2e 83/87 0 failed 4 known-bug 57/57 (rerun; first run RECOV-R07 flake at load 25), shots 572 0 FAIL + `text scale OK (1626 … 5 chrome surfaces)` + `text scale once OK (103821 / 204 loads)`, freeze 276/276, parity 0/0/24. Frozen bytes moved: NO. Non-vacuity: 116 `surface:` failures w/o stamping. Drive-by: shoot.mjs assertTextScale undefined.toFixed crash on missing root. No Control-sized text on these surfaces.
- r2 review — fresh orchestration:reviewer (not a97b14934788e0d1c). Brief: sc422-brief-r2-review.md
  - r2 reviewer agent aa81f6da07d3bb2e2 dispatched 2026-10-20
- r2 review 2026-10-20: LAND-READY, 0 BLOCKER/HIGH/MEDIUM, 2 LOW, 4 INFO. Battery reproduced exactly at 487b444. Real Obsidian 1.14.4 probe: 674 comparisons / 6 surfaces (2 popouts), 0 problems; defaults identical base vs head; lifetimes clean over 12 close cycles (Escape, backdrop, choose); live update works; 4 mutations all bite.
## r2 rulings (owner, 2026-10-20)
- LOW-1 (mock SuggestModal has no modalEl, so jsdom + harness exercise only the `containerEl` fallback of CompendiumSearchModal.ts:102): **FOLD** — give the mock `SuggestModal` (test/mocks/obsidian-core.ts:628-693) a `modalEl` with class `prompt` holding `inputEl` and `resultContainerEl`, as the real host does; assert the stamp lands on `.prompt`.
- LOW-2 (r1 report says 116 `surface:` lines; saved log has 46): **FOLD** — correct the r1 report's number (documentation only).
- INFO-1 (evidence labelled before=7817133, after shot on b6b08f3): dropped — reviewer verified 7817133..ab34293 touches none of the surfaces and reproduced the px on ab34293 vs head. The Scott comment says so in mechanics.
- INFO-2 (reflectCss stamps all 11 css prefs on chrome roots; inert today): **FOLD** — one-line comment in textScaleRoot.ts making it explicit.
- INFO-3 (at Small 120% the code line 15.3px slightly exceeds the 15px result name; same in sidebar empty message vs title): no code change; mention in one line in the Scott ask.
- INFO-4 (DseSidebarView.onOpen could create a second .dse-sidebar if ensurePanelsEl ran first; no caller does): dropped — pre-existing, no caller, both owned by the view; not worth a ticket.
- §6 env incident (r2's first e2e ran in the sc432 worktree via a shared-scratchpad `gate.sh` overwritten by the SC-432 reviewer; may have clobbered sc432-r1-review-e2e.log): relayed to dispatcher.
- r3 fix = r1 implementer a97b14934788e0d1c (resume). r4 scoped re-review = r2 reviewer aa81f6da07d3bb2e2 (did not author the fix).
- r3 DONE 2026-10-20: dse 82ca38b on ab34293 (superproject unchanged c44b5b2). LOW-1 mock modalEl `.modal.prompt`, stamp asserted on `.prompt`; LOW-2 corrected (46 lines / 30 not stamped; 116 was unfiltered); INFO-2 comment. Gates: jest 5278/1/231 of 232, lifecycle 27/27, e2e 83/87 0 failed 4 known-bug 57/57, shots 572 0 FAIL, text scale OK 1626->1626, once OK 103821->103815 (-6), freeze 276/276, parity 0/0/24. 0 frozen bytes moved.
- r4 scoped re-review — r2 reviewer aa81f6da07d3bb2e2 resumed, delta 487b444..82ca38b only.
- 2026-10-20: dispatcher relay — dse origin/develop moved ab34293 -> 71ac43a (SC-454: deleted dead src/utils/CodeBlocks.ts + its test; main.js byte-identical). New baselines: jest 5257/1/229 of 230; rest unchanged. Plan: after r4 re-review (running on 82ca38b in the worktree), r1 implementer rebases onto 71ac43a + full battery; expected jest 5273/1/230 of 231 (base + 16).
- 2026-10-20: dispatcher relay — dse origin/develop moved 71ac43a -> 188755b (SC-364: deleted dead resolveCollapsePrefs in src/prefs/catalog.ts + declaredCollapsePrefs in ComponentWrapper.ts; main.js byte-identical). Baselines unchanged (jest 5257/1/229 of 230). Rebase target after r4 is now 188755b; expected jest 5273/1/230 of 231. Note: catalog.ts is the file whose help text O1 cites — check rebase touches no help text.
- r4 re-review 2026-10-20: LAND-READY, 0 BLOCKER/HIGH/MEDIUM/LOW, 1 INFO. Fallback-throws mutation: harness + all behavioural tests take modalEl. The -6 in `once OK` = empty Obsidian shell wrappers (no role) no longer in the swept root — benign. Measured jest 5278/1/231 of 232, shots 572 0 FAIL, text scale OK 1626, once OK 103815/204, freeze 276/276.
- INFO-r4-1 (test row built with createDiv; harness drives renderSuggestion by hand — mock has no chooser): dropped — reviewer says no action needed.
- r5 rebase — r1 implementer a97b14934788e0d1c resumed: rebase onto 188755b + full battery.
- r5 DONE 2026-10-20: dse bf8b99c on 188755b (5 commits); superproject 3e344b3 on origin/main 2d4dfeb (unstaged ` M draw-steel-elements` pointer, expected). catalog.ts help text unchanged. Gates: tsc/lint clean, jest 5273/1/230 of 231, lifecycle 27/27, e2e 83/87 0 failed 4 known-bug 57/57, shots 572 0 FAIL + text scale OK (1626) + once OK (103815/204) + pressed toggle parity OK (96), freeze 276/276, parity 0/0/24. 0 frozen bytes moved.
- 2026-10-21: land-ready ask posted (sc422-comment-landready.md, 3 images); SC-422 -> In Progress + Needs Review. LAND GATED ON SCOTT'S YES to O1. Reported land-ready-pending-Scott to dispatcher.
- For dse-verify CURRENT at landing (dispatcher): shots now print `text scale OK (1626 comparisons … 5 chrome surfaces)` and `text scale once OK (103815 / 204 loads)` (base 188755b printed fewer — r5 report has the base line).
- 2026-10-21: dispatcher relay — dse develop 188755b -> ba20072 (SC-366: small styles-source.css edit at plugin link-colour rules ~8901/8909; jest base 5260). NO ACTION until Scott replies. On his yes: r1 implementer rebases onto then-current develop + full battery; expected jest 5260+16 = 5276 / 1 / base suites +1; then report land-ready.
- 2026-10-21: Scott ruled "looks good, land it". Dispatcher relay: rebase onto dse develop bc4a0c5 + workspace origin/main; baselines jest 5457/1/232 of 233, lifecycle 30/30, e2e 89/93 4 known-bug 64/64, shots 580, freeze 280/280 (SC-362 widened), parity 0/0/24. Next lifecycle scenario id G-S21. r6 = r1 implementer rebase + full battery.
- 2026-10-21: dispatcher relay — dse develop bc4a0c5 -> 772c3cd (SC-457: shared fenceLanguage in blockPrefix.ts; lifecycle G-S14). Baselines: jest 5536/1/233 of 234, lifecycle 31/31, e2e 89/93 4 known-bug 64/64, shots 580, freeze 280/280, parity 0/0/24. r6 retargeted to 772c3cd; expected jest 5552/1/234 of 235.
- r6 DONE 2026-10-21: dse 8d075db on 772c3cd; superproject ae088de on origin/main 8f914ec. Conflicts: visual-harness/entry.ts (kept SC-362's earlier `targets` decl + own `surface=` early return), CHANGELOG (both bullets). Gates: tsc/lint clean, jest 5552/1/234 of 235, lifecycle 31/31, e2e 89/93 0 failed 4 known-bug 64/64, shots 580 0 FAIL, `text scale OK (1626 …)`, `text scale once OK (104184 / 208 loads)`, pressed toggle parity OK (96), freeze 280/280, parity 0/0/24. 0 frozen bytes moved. Owner verified shas + ancestry. LAND-READY reported to dispatcher.
