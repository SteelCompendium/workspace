# SC-530 decisions ledger

Ticket: SC-530 — Host-leak button sweep keys ignore aria-checked, so a selected negotiation tier row is never compared.
Owner: ticket-owner (Opus 5.5). Worktree: /home/scott/code/steelCompendium/worktrees/sc530-hostleak-aria-checked (branch sc530-hostleak-aria-checked in every submodule).
dse base at worktree creation: develop f81a277 (2026-11-02). Superproject worktree base: e0f5c76a.

## Task (from the ticket description, verbatim)
"Found by SC-527's survey. The button host-leak sweep's kind key (`tagButtons` in `visual-harness/shoot.mjs`) includes `aria-pressed`, `aria-selected` and `disabled`, but not `aria-checked`. So a selected negotiation Power Roll tier row (`dse-pr__row`, `aria-checked=true`) gets the same key as an idle row, and the sweep only ever compares the first (idle) one. A host CSS leak that only hits the selected row would pass.

**Task:** decide whether `aria-checked` belongs in the kind key (it would add kinds wherever a radio-like control is checked at load and needs a reached-state click like SC-527's for the negotiation tier row), and measure the kind and boundary change."

## Dispatcher instructions (2026-11-02, verbatim excerpt)
"Adapter: ... obey every footgun, esp. 9/11/12/13: no compound `cd … &&`, never `rm` with a shell-variable target, no background gates except shots under load via poll-the-log (dse-verify row 5), `devbox run -c <abs path>`, one gate per Bash call (full lifecycle = two `--only` halves 22 + 21). ... dse develop is f81a277 ... Harness-only expected. Overlap: SC-526 (parked on Scott) will later mount the Recoveries popover in the same sweep code — don't mount it; keep your change easy to rebase under it. At land-ready put proposed dse-verify text in a proposal file (don't edit SKILL.md in the branch). ... Report land-ready to the dispatcher and stop; the dispatcher lands."

## Known facts (CURRENT, dse develop f81a277)
- tsc/lint clean; jest 6208 passed / 1 skipped / 249 of 250 suites; lifecycle 43/43 (halves 22 + 21); e2e 124/124, 0 failed, 0 known-bug, coverage 87/87 pairs; shots 592, 0 FAIL; button host-leak 157 kinds / 942 comparisons, 34-record boundary; modal 228; input 15 kinds / 176; checkbox 7 kinds / 116; prose 106 <p> [212]; freeze 280/280; parity 0 GAPs / 0 undeclared / 24 DECLARED.
- `tagButtons` (shoot.mjs:2297) key = element | sorted classes | in:chrome? | `|pressed` (data-pressed) | `|aria-pressed:<v>` (SC-356, full-value form) | `|selected` (aria-selected=true only) | `|disabled`. Used by the gallery button sweep and the SC-356 modal pass (prefix per scenario).
- SC-527 already clicks a negotiation tier in an appended section to enable Complete Argument (`SC527_EXTRA` negotiation sections), so a checked tier row likely already exists in the sweep DOM — survey must confirm.
- SC-526 (Recoveries popover mount + CSS fix) will edit the same sweep code later; parked on Scott.

## Owner rulings (2026-11-02)
- Inherit SC-513/SC-527 rules: states reached by REAL click (through the page) in the sweep's own load only; captures never perform these clicks, so zero shots / frozen bytes move. A photographed-state change would need a widening file and Scott's sanction — avoid.
- Every new kind must be asserted tagged (named FAIL, never skip). Existing kinds stay compared; no existing kind's first node may move. A key RENAME of an existing kind (same first node, new string) must be listed explicitly in the report, never silent.
- Key form is an open design question for r1: (A) `|checked` only when `aria-checked="true"` (mirrors `|selected`; renames nothing), vs (B) `|aria-checked:<v>` full value (mirrors SC-356's aria-pressed; renames every idle aria-checked kind), vs others the survey finds. Owner lean: (A) unless the survey shows `false`/`mixed` carry separate CSS that would otherwise merge. r1 measures and recommends; owner rules.
- Do NOT mount the Recoveries popover, add `staminaRecoveryPopover`, or click the pips (SC-526). Keep any SC-530 additions in their own named constants/helper (`SC530_*`) or in the existing SC-527 section data, one call site, so SC-526 rebases cleanly.
- No CHANGELOG bullet (harness-only). dse-verify text: owner drafts sc530-dse-verify-proposal.md at land-ready.

## Rounds
- r1 (survey + prototype, orchestration:reviewer): brief sc530-r1-brief.md, report sc530-r1-survey-report.md.
- r1 dispatched 2026-11-02 (orchestration:reviewer, agent a6e9f21b0f51c4756). Ticket Backlog -> Awaiting.

## 2026-11-02 (dispatcher): SC-536 landed — dse develop f81a277 -> fb24f8a2
"FYI develop moved: SC-536 landed, dse develop is now fb24f8a2 (was f81a277). It changes src/elements/shared/RefUnwrapView.ts and view.ts and adds lifecycle G-S56; no shots-harness change. New baselines at fb24f8a2: jest 6228 passed / 1 skipped / 249 of 250 · lifecycle 44/44 (halves 22 + 22) · e2e 124/124, 87/87 · shots 592, 0 FAIL, 157/942 · freeze 280/280 · parity 0/0/24. Rebase target is now fb24f8a2. No reply needed."
- ~~Base f81a277; jest 6208 / 249 of 250; lifecycle 43/43 (22 + 21)~~ superseded for land-ready: r1 survey continues on f81a277 (no harness change in SC-536, so its host-leak measurements carry); r2 cuts from / rebases onto fb24f8a2 and gates against jest 6228 (+ new tests) / 1 / 249 of 250, lifecycle 44/44 (halves 22 + 22), e2e 124/124 0 known-bug 87/87, shots 592 0 FAIL 157/942 base, freeze 280/280, parity 0/0/24.
- r1 told by SendMessage: stay on f81a277, do not rebase.

## r1 result (2026-11-02) — reviewer a6e9f21b0f51c4756, report sc530-r1-survey-report.md
- Recommend form (A) `|checked` iff `aria-checked="true"`. 48 aria-checked nodes per scheme (7 true / 41 false / 0 mixed), all negotiation `dse-pr__row` + `dse-track__slot` radios (sections 19, 38, 39); modal pass 0; host CSS 0 rules on aria-checked/role=radio; no rule on `aria-checked="false"`/`mixed` anywhere, so (B) only renames 2 kinds for no coverage. Input/checkbox sweeps have no such blind spot.
- Reach: no new click/section — SC-527's negotiation section 38 already clicks tier row #0; seal Patience 3 is checked at load.
- Proto `sc530-r1-proto` @ d1ab0bd (local, on f81a277), shoot.mjs +28/-2: tagButtons line, one `reached` selector in SC-527 section data, `SC530_EXPECT` + `assertSc530Tagged`, one call site after `assertSc527Tagged`.
- (A): button 159 / 954 (base 157 / 942), boundary 34 identical names, modal 228, input 15/176, checkbox 7/116, prose 106 [212], 592 PNG identical, freeze 280/280, tsc/lint 0, jest 6208/1/249 of 250, builds byte-identical. New kinds `negotiation|dse-pr__row|checked`, `negotiation|dse-track__slot|checked`; 0 renamed / 0 lost / 0 moved.
- Can-fail: leak probe on checked tier row rc 1 (18 problems, only the new kind), same on f81a277 rc 0 (gap real); tier click removed rc 1 named.
- Beyond-ticket gap: Interest's VERTICAL track seals share `negotiation|dse-track__slot` with Patience's horizontal ones (Patience first in DOM) though their own-box CSS differs (padding/width/border/colour; current seal background + inset ring). Host-only probe on it stays rc 0 on proto. Form (C) = (A) + `|in:track--vertical`: offline 161 / 966, +2 kinds, 0 renamed / 0 moved, no click.

## Owner rulings on r1 (2026-11-02)
- Key form: (A) `|checked` only when `aria-checked="true"`. Rejected (B): renames 2 kinds, adds no coverage.
- Vertical-seal context gap: FOLD as form (C) (`|in:track--vertical`, or the equivalent context suffix r2 finds cleanest). Same file, same sweep key, same failure class (a styled variant hidden behind a shared key), +2 kinds, no click. Both new vertical kinds go in `SC530_EXPECT` (named FAIL if untagged); r2 must measure (C) LIVE (r1 measured it offline only) and prove it can fail with r1's vertical-seal probe (head rc 1 naming the vertical kind).
- Expected at r2 head: button 161 / 966, boundary 34 (identical names to base), modal 228, input 15/176, checkbox 7/116, prose 106 [212], 592 PNGs identical to a clean fb24f8a2 run, freeze 280/280, parity 0/0/24; jest 6228 + new / 1 / 249 of 250; lifecycle 44/44 + e2e 124/124 87/87 either run or carried ONLY if built main.js + styles.css at head are byte-identical to clean fb24f8a2.
- r2 = fresh orchestration:implementer (r1 reviewer authored the prototype, so it neither implements r2's review nor reviews). r3 = fresh orchestration:reviewer.
- r2 dispatched 2026-11-02 (orchestration:implementer, agent a2155934e7dd01064). Brief sc530-r2-brief.md, report sc530-r2-impl-report.md. r3 = fresh orchestration:reviewer (brief sc530-r3-review-brief.md, staged).

## 2026-11-02 (dispatcher): SC-522 landed — dse develop fb24f8a2 -> ad018cd
"FYI develop moved: SC-522 landed, dse develop is now ad018cd (was fb24f8a2). Live Preview scroll-hold src + lifecycle G-S52; no shots-harness change. Lifecycle is now 45/45 and must run in THREE --only parts: `G-S7a … G-S9a` (21), `G-S9b … G-S40` (16), `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S56` (8). Baselines at ad018cd: jest 6245 passed / 1 skipped / 249 of 250 · e2e 124/124, 87/87 · shots 592, 0 FAIL, 157/942 · freeze 280/280 · parity 0/0/24. Rebase target is now ad018cd. No reply needed."
- ~~Rebase target fb24f8a2; jest 6228; lifecycle 44/44 (22 + 22)~~ superseded: r2 rebases onto ad018cd; jest 6245 + new / 1 / 249 of 250; lifecycle 45/45 in three --only parts (21 + 16 + 8) or carried only if head main.js + styles.css are byte-identical to clean ad018cd; e2e 124/124 87/87 same rule. PNG base: an fb24f8a2 list stays valid (SC-522 has no harness change) but any differing PNG must be attributed by a clean ad018cd run. Host-leak expectations unchanged (161/966, boundary 34).
- r2 told by SendMessage.

## r2 result (2026-11-02) — implementer a2155934e7dd01064, report sc530-r2-impl-report.md
- dse sc530-hostleak-aria-checked @ 2388872d (2831b6c6 r1 proto cherry-pick, a0000b88 form (C) + SC530_EXPECT 4 keys, 2388872d 4 jest tests) on origin/develop ad018cda, clean, not pushed; superproject only ` M draw-steel-elements`.
- (C) = `|in:track--vertical` appended last when `n.closest('.dse-track--vertical')` (track.ts:72). SC530_EXPECT: `negotiation|dse-pr__row|checked`, `negotiation|dse-track__slot|checked`, `negotiation|dse-track__slot|in:track--vertical`, `negotiation|dse-track__slot|checked|in:track--vertical`. 0 renamed / 0 lost / 0 moved.
- button 161/966 (base 157/942), boundary 34 identical text, modal 228, input 15/176, checkbox 7/116, prose 106 [212]; 592 PNG identical to fb24f8a2 base on both heads; tsc 0, lint 0, jest 6249/1/249 of 250 (+4); freeze 280/280; parity 0/0/24. main.js/styles.css byte-identical head vs clean ad018cda -> lifecycle 45/45 and e2e 124/124 87/87 carried.
- Can-fail (on fb24f8a2-based head; shoot.mjs unchanged by rebase): (a) rc 1 only pr__row|checked, (b) rc 1 named, (c) rc 1 only vertical checked seal. Jest breaks x5 rc 1.
- r3 dispatched: fresh orchestration:reviewer (not r1 author, not r2). Brief sc530-r3-review-brief.md (R2_HEAD 2388872d, R2_BASE ad018cda).
- r3 reviewer agent a0c4522cdcb4100bf dispatched 2026-11-02.

## 2026-11-02 (dispatcher): r3 killed by 429 session limit; dispatcher resumed it (same agent a0c4522cdcb4100bf) — owner does not re-spawn. SC-539 landed — dse develop ad018cda -> 88cb7db9
"dse develop is now 88cb7db9 (SC-539 landed: e2e pointer park, harness-only; baselines unchanged)."
- r3 keeps reviewing 2388872d on ad018cda. After r3: rebase round onto 88cb7db9 (with any r3 fixes), then re-gate the rebased head (tsc, lint, jest, shots 161/966 34 boundary 592 identical, freeze, parity; lifecycle/e2e carried only if main.js + styles.css byte-identical to clean 88cb7db9; e2e must be re-run if SC-539's e2e harness change interacts — it does not touch shoot.mjs, verify by diff).

## r3 review result (2026-11-02) — reviewer a0c4522cdcb4100bf (resumed by dispatcher after 429), report sc530-r3-review-report.md
- LAND-READY on 2388872d (ad018cda): 0 HIGH / 0 MED / 2 LOW / 5 INFO. Button 157 -> 161 / 966, 0 lost / renamed / moved, boundary unchanged; shots 592 identical; freeze 280/280; jest 6249/1. Merges cleanly onto 88cb7db9 (merge-tree 0 conflicts).

## Owner rulings on r3 (2026-11-02)
- LOW-1 (test "no existing kind is renamed" misses breaks K1 and K8; K8 silently moves `negotiation|dse-track__slot`'s first node): FOLD, reviewer's fix verbatim: "over every node `tagButtons` tagged (`[data-dse-hostleak]`), assert both of these: `key.includes('|checked') === (node.getAttribute('aria-checked') === 'true')` / `key.endsWith('|in:track--vertical') === !!node.closest('.dse-track--vertical')`. Optionally also assert that the node tagged `negotiation|dse-track__slot` is inside `.dse-track--horizontal`." — include the optional assertion too. K1 and K8 must then fail jest.
- LOW-2 (assertSc530Tagged body / new `reached` selector untested in jest): FOLD, reviewer's fix: "extract `assertSc530Tagged` the same way the test already extracts `tagButtons`. Call it with `[]` and expect 4 problems; call it with SC530_EXPECT and expect 0." Plus assert the `reached` list of SC-527's first negotiation section contains the `button.dse-pr__row[role="radio"][aria-checked="true"]` selector. K7 and K5 must then fail jest.
- INFO-2 (two overstated comments, shoot.mjs:2329-2330 and :2322-2325): FOLD — "which a horizontal seal sets differently"; and say the false-vs-absent statement holds because every swept `button.dse-pr__row` carries the attribute (the `[aria-checked]:focus-visible` presence rule).
- INFO-1 (lint does not cover shoot.mjs/test): DROP — project-wide lint scope, not this ticket; jest compiles the test file.
- INFO-3 (other variants share kinds: non-first tier rows, last-edge vertical seals, spent/on seals): DROP — reviewer shows no real host `button` rule (max specificity (0,1,1)) can reach these variants without also reaching the sampled node; nothing to file.
- INFO-4 (SC-526 trivial textual-merge risk near shoot.mjs:2956-2960): no action.
- INFO-5: r4 rebases onto 88cb7db9.
- r4 = r2 implementer a2155934e7dd01064 (author) fix round + rebase. Scoped re-review = r3 reviewer a0c4522cdcb4100bf (not the author).
- r4 dispatched 2026-11-02: SendMessage resume of r2 implementer a2155934e7dd01064 (LOW-1, LOW-2, INFO-2 + rebase onto 88cb7db9). Scoped re-review planned: r3 reviewer a0c4522cdcb4100bf.

## r4 result (2026-11-02) — r2 implementer, report sc530-r2-impl-report.md (r4 section)
- dse 97284051 (c59c4882 r1 proto, f9bdb873 (C)+SC530_EXPECT, 13e5d0c2 r2 tests, 97284051 r4) on origin/develop 88cb7db9, clean, not pushed; superproject only ` M draw-steel-elements`.
- r4: LOW-1 per-node invariant test, LOW-2 assertSc530Tagged extraction test + reached-selector test, INFO-2 comments (shoot.mjs comment-only +4/-2 vs 2388872d). 7 SC-530 tests. Breaks K1, K8, K7, K5 each rc 1.
- tsc 0, lint 0, jest 6252/1/249 of 250, shots rc 0 592 identical, button 161/966, boundary 34 identical, modal 228, input 15/176, checkbox 7/116, prose 106 [212], freeze 280/280, parity 0/0/24. main.js a37fbb6f… / styles.css ae45354b… identical to clean 88cb7db9 -> lifecycle 45/45 + e2e 124/124 87/87 carried. Can-fail (a)(b)(c) carried (shoot.mjs comment-only delta).
- Scoped re-review -> r3 reviewer a0c4522cdcb4100bf.

## r4 scoped re-review (2026-11-02) — r3 reviewer, report sc530-r3-review-report.md (r4 section)
- LAND-READY, 0 new findings. range-diff: reviewed commits unchanged by rebase; 97284051 = exactly LOW-1 + LOW-2 + INFO-2 (shoot.mjs comment-only +4/-2). K1/K8/K7/K5 each jest rc 1 on head. jest 6252/1/249 of 250, tsc 0; builds byte-identical to clean 88cb7db9.

## LAND-READY (2026-11-02)
- dse branch sc530-hostleak-aria-checked @ 97284051 (c59c4882, f9bdb873, 13e5d0c2, 97284051) on develop 88cb7db9, ancestor verified, tree clean; diff = visual-harness/shoot.mjs + test/dom/visual-harness/fixtures.test.ts only. Superproject worktree only dirt ` M draw-steel-elements` (pointer bump at landing).
- No widening, no rebaseline, no CHANGELOG (harness-only). dse-verify edits: sc530-dse-verify-proposal.md. No Backlog filed (INFO-1/INFO-3 dropped with reasons). Local branch sc530-r1-proto (d1ab0bd) is survey-only, must not land.
- Land-ready comment posted to SC-530 (sc530-comment-landready.md); state left Awaiting for the dispatcher to land and close.

## DONE (2026-11-02)
- Landed by the dispatcher: dse develop ff to 97284051; workspace main b27ec651 (pointer bump f8108803); docs 4fba48e5 applied sc530-dse-verify-proposal.md (host-leak bullet 161/966, new CURRENT) and preserved this ledger at docs/superpowers/dse-overhaul/build-ledgers/sc530-hostleak-aria-checked/. Worktree removed; sc530-r1-proto not landed. Ticket -> Done with closing comment.
