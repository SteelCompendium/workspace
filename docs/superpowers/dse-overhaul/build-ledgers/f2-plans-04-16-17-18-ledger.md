# F2 build ledger (plan 04, worktree f2)
Plan: docs/superpowers/dse-overhaul/plans/2026-07-01-plan-04-data-integration.md
(read its "Status / Execution notes (2026-07-16)" prelude before any task)
BASE at start: draw-steel-elements 4d09614
SDK local pin source: ../data-sdk-npm at 057140c (dist built)
Landing gate: SDK 3.2.0 npm publish (Scott) -> Task 14 swaps file: pin to "3.2.0"

Task 1: dispatched (sonnet) — SDK pin + statblock B1 migration
Task 1: complete (commits 6340bec..30cff3f, review approved after 1 fix round — role-tint org fallback)
Task 2: fix round 1 in flight (8b9876a + fixes). ADJUDICATION: plan example code (join) vs plan constraint (SDK last-wins) — constraint governs, shim goes last-wins. F4 (partial-collision skips whole list) = spec-by-design, flag to final review.
Task 2: complete (commits 8b9876a..1993746, review approved after 1 fix round — SDK last-wins semantics)
Task 3: complete (commit b01118a, review approved clean — sccToFilePath Go-parity verified)
Task 4: complete (commit 50e233f, review approved clean)
  Minor carry-forwards for final review: (a) no direct test for handleChanged eviction/reindex, (b) no test for folder-at-derived-path miss (code guards both; add tests by Task 12).
Task 5: complete (commit baa5d25, review approved clean)
  Minor carry-forwards: (a) no committed idempotence test, (b) external-link class removal untested, (c) import-type nits from brief code.
Task 6: complete (commit 93b9096, review approved clean)
  Carry-forward INTO Task 7: refs.ts resolveBarePath still has its own DS_BLOCK_RE + old miss-error copy — swap to shared extractFirstDsBlock (implementer + reviewer both flagged; pointer comments in code at refs.ts:82/157).
Task 7: complete (commit 87db2cc, review approved clean)
  Info carry-forward: no test exercises real event delivery through registerWatchers/.on() (handlers tested directly) — pre-existing harness gap, note for final review alongside Task 4's handleChanged item.
Task 8: complete (commit 51d0854, review approved clean; nits recorded in task-8-review.md)
Task 9: complete (commits 6a37906..5b8d5bf, opus safety review approved; hardening round added traversal guard + 4 invariant pins; F4 case-insensitive-FS note + backslash-traversal-test nit carried to final review)
Task 10: complete (commit 1dc8f65, review approved clean; 4 deviations all judged sound)
  Low carry-forwards for final fix wave: (a) no test pins new sync-compendium command id, (b) no corrupt-non-empty-zip test through sync(), (c) zip layer lacks its own suspicious-path filter (single line of defense — applySync guard holds), (d) fileManager wiring branch untested (mock App lacks fileManager).
Task 11: complete (commit a86a532, review approved clean)
  Minors: stale SettingsTab header comment; dead hidden webLinkFallback descriptor to delete (cleanup candidates for final wave).
Task 12: complete (commit f6bb2ce, review approved; implementer died pre-report, gates re-verified by orchestrator: 1289 tests)
  Low carry-forward: registeredPostProcessors mock field unused — add plugin-wiring assertion or drop the field (final wave).
Task 13: complete (commits 9c7e533 + superproject 05d192a, review approved; docs slightly ahead of SDK version state — self-corrects at publish)
Final review: opus whole-branch NEEDS-FIXES -> fix wave (5 commits f678e2e..dbfef73: element-render scc rewrite wired, rejectedPaths surfaced, 3 cleanups) -> re-review READY-TO-MERGE-PENDING-GATES.
All gates green at dbfef73: tsc clean, jest 93/1292, shots 64/64, obsidian-shots 48/48.
LANDING GATE: Scott runs `just release 3.2.0` in data-sdk-npm -> then Task 14 (swap file: pin -> "3.2.0", npm install, re-run gates, live-release sync smoke) -> wt-finish f2.

# D6 build (plan 16, same worktree f2, on top of F2 dbfef73)
Plan: docs/superpowers/dse-overhaul/plans/2026-07-17-plan-16-d6-compendium-reference.md (opus-drafted, orchestrator pre-flighted)
Recon: workspace/.superpowers/sdd/d6-recon.md. Hover-preview deferred (OD-D6-5).
Task 1: dispatched — SccResolver read seam + data-scc stamping
D6 Task 1: complete (commit 8d5293c, review approved clean)
D6 Task 2: fix round 1 in flight (37f2053 + cache-race/getStatblock-bypass/LRU/scoped-invalidation fixes). ADJUDICATION: plan sample code vs plan constraints (single-source TYPE_ADAPTERS, LRU) — constraints govern. `available` gating (entries>0 vs manifest) reconcile at Task 10/11.
D6 Task 2: complete (commits 37f2053..08b190e, review approved after 1 fix round — generation-guarded LRU + shared dispatch)
D6 Task 3: complete (commits 6888e1a..7d28008, review approved after 1 fix round — @path/[[wikilink]] whole-block refs revived; followup #24 routed)
D6 Task 4: complete (commits dd795e9..73a627c, approved after 1 fix round — legacy-ref byte-original text + full e2e coverage)
D6 Task 5: complete (commit 602521a, review approved clean)
D6 Task 6: complete (commits 6cc74e9..2ba6c67, approved after 1 fix round — visual review caught YAML-dump + literal-markdown defects; features slot via renderFeatureList)
D6 Task 7: complete (commits c56b500..186cb08, approved after 1 fix round — systemic slot/body duplication suppressed with normalization)
  Nits for final wave: ancestry missing from exact-once describe block; career fix-report wording confusing.
D6 Task 8: complete (commits cb971c2..f7c6da5, approved; unknown-annotation + regex dedup fix pre-verified by reviewer)
D6 Task 9: complete (commits f7c6da5..2138c3e, approved; hybrid render + depth guard; real recursion deferred to Task 11 obsidian verification)
D6 Task 10: complete (commits 2138c3e..c8d62c0, approved; full-code insert adjudicated + documented)
D6 Task 11: complete (commits 7f7747b/ee57059/17161e3 — incl. PRODUCTION FIX cx.compendium never wired + obsidian-shots broken since Task 6, now 93/93 w/ by-SCC recursion camera). Task-11 detailed scrutiny folded into final review.
Known final-wave items: (a) kitLayout rows need omitWhenSource (chrome duplicates body Kit Bonuses); (b) md-dse kit body double-carries rendered ability + fence -> steel-etl emission should drop the rendered duplicate (OD-1 precedent) + regen + release-data re-cut; (c) available-gating semantics (entries>0 vs manifest) final call.
D6 MUST-FIX: complete (steel-etl 74d54d0 drops rendered kit dup sections from md-dse; plugin 68ba54e fixture refresh). Visual re-confirmed in real Obsidian. Items (a)(c) resolved per opus review (no plugin change; entries>0 kept).
D6 FINAL: READY-PENDING-GATES (opus). Branch gates: tsc clean · jest 1453 · shots 119 · obsidian-shots 93.
LANDING (both F2+D6, one branch): Scott publishes SDK 3.2.0 -> plan-04 Task 14 (pin swap + gates) -> wt-finish f2 -> just release-data re-cut (md-dse kit change published).

# D8 build (plan 17, same worktree f2, on top of D6)
Plan: docs/superpowers/dse-overhaul/plans/2026-07-18-plan-17-d8-gm-subsystems.md (opus-drafted). Recon: workspace/.superpowers/sdd/d8-recon.md.
Baseline at start: plugin 68ba54e, jest 1453, shots 119, obsidian-shots 93. ds-malice standalone deferred (OD-6).
D8 Task 1: complete (commits 96bf3e8..8f64fe3, approved; mock fidelity fixed incl. contentEl HIGH)
D8 Task 2: complete (commits f02178b..c09953e, approved after 1 fix round — CRITICAL fence-scanner opacity + HIGH silent-no-save net + race + cursor binding; spec §1.9b corrected on main c81e06e)
D8 Task 3 visual note: sidebar leaf FUNCTIONAL (camera-proven) but .dse-init layout collapses at sidebar width (stacked chips/awkward wrap) — Task 10 must add sidebar-width CSS (.dse-sidebar overrides or container queries) + re-shoot.
D8 Task 3: complete (commits c09953e..6100ffb, approved; in-place onUpdate via shared prepareModel helper — pipeline drift structurally closed; sidebar camera landed, obsidian-shots 94)
D8 Task 4: complete (commits 6100ffb..5ced0e4 incl. harness fix cd77cd8; approved after 1 fix round — CRITICAL minion per-four EV ported from site core, squad merge, allSettled isolation, victories param)
D8 Task 5: complete (commit 5cd3950, approved clean — malice panel + minimal round/log slice; byte-stability walked + proven)
  Lows for final wave: malice.log unbounded (cap policy); Reset Round vs Advance Round UX consolidation in Task 9.
D8 Task 6: complete (commit 8fca13e, approved clean — montage math verified against REF; roll via resolve() not the Dice Roller bridge, bridge-parity noted for Scott)
D8 Task 7: complete (commits 8fca13e..5f8d6e7, approved after quick fix — conditional project goals degrade visibly instead of silent wrong numbers)
D8 Task 8: complete (commits 5f8d6e7..a2b1e24, approved after quick fix — hero_tokens visible read-only + input clamp)
D8 Task 9: complete (commits a2b1e24..46c83af, approved after fix — Reset Round restored alongside Advance round; action checklist per-actor landed)
D8 Task 10 (FINAL): complete (plugin fc8080f..7c0f415, superproject c0c141e). Encounter sidebar hand-off wired (setEncounterSidebarHandoff -> sendToSidebar, cleared on unload) + tested through real onload()/onunload(). Sidebar-width CSS added (.dse-sidebar-scoped overrides) — visually confirmed fixed in real Obsidian (re-shot sidebar camera, before/after compared). malice.log capped at 50 (appendMaliceLogEntry, the one sanctioned push site) + tested. Harness fixtures/aliases already at 27 (per-task carry, reconciled not re-added). Docs-as-done: integration.md (sidebar host, turn/round economy, OD-1..OD-9), plugin CHANGELOG 6.0.0 extended, CLAUDE.md counts 23->27, initiative-tracker.md (malice log/round_gain/quick-add, action checklist, sidebar pinning). Workspace CHANGELOG.md Unreleased bullet added.
D8 FINAL GATES: tsc clean, jest 1725/1725 (was 1453), shots 139 (27 elements x5 + 4 gallery; was 119), obsidian-shots 110 (94 baseline + 4 elements x4 variants).
D8 status: BUILD COMPLETE PENDING FINAL REVIEW. All 10 tasks landed on branch f2 on top of D6 (dbfef73 base for plan-04, then D6 final c8h..., then D8). No fix-wave dispatched yet — orchestrator should run a final whole-branch review before merge/landing (same pattern as F2/D6).
D8 Task 10: complete (commits 46c83af..7c0f415 + superproject c0c141e; gates: jest 1725, shots 139, obsidian-shots 110; sidebar CSS visually confirmed by orchestrator)
D8 FINAL: opus whole-branch NEEDS-FIXES (1 docs-only) -> header fixed 5c6e33d + FOLLOWUPS #26 on main -> READY-PENDING-GATES.
D8 gates at 5c6e33d: tsc clean · jest 1725 · shots 139 · obsidian-shots 110.
ALL THREE BUILDS (F2, D6, D8) now ride the same landing gate: Scott's `just release 3.2.0`.

# D7 build (plan 18, same worktree f2, on top of D8)
Plan: docs/superpowers/dse-overhaul/plans/2026-07-18-plan-18-d7-hero-suite.md (opus-drafted). Recon: workspace/.superpowers/sdd/d7-recon.md.
Baseline: plugin 5c6e33d, jest 1725, shots 139, obsidian-shots 110. Elements 27→32 planned.
D7 Task 1: complete (commit e8f8ede, approved clean — extractions byte-neutral, 249 shots identical; PanelHost.readOnly spec-comment inversion flagged forward to Task 2)
D7 Task 2: complete (commit e601330, approved clean; fixtures.test title-string still says 27 — Task 3 folds the bump)
D7 Task 3: complete (commit e35fbdd, approved clean — ds-resource with visible generic fallback; Task 9 must supply gainHint on its ResourceSlice)
D7 Task 4: complete (commit c7eaa0b, approved clean; FOLLOWUPS #27 routed)
D7 Tasks 5+6: complete (commits 453c9b0 + e3d8b50, approved clean — ds-surges + ds-tokens; jest 1876)
D7 Task 7: complete (commits e3d8b50..20821e5, approved after 1 fix round — adversarial review caught 3 splitter corruption paths, fixed structurally; Task 9 note: re-parse on onUpdate (defnRaw is a snapshot), filter state from the form schema)
D7 Task 8: complete (commit 34b821e, approved clean — derivation cited vs real data; Ancestry-no-numeric-fields gap visibly surfaced)
  Lows for final wave: aggregation-loop as-casts index-lockstep; missing override+resolved-class gainHint combo test.
D7 Task 9: complete (706d768 + fix 74d2401 — sheet view; MUST-FIX removed fabricated tier>=2 surge auto-spend, surges player-spent only)
  Framework additions (additive): RenderContext.validation, ElementDefinition.noAuthoringButton.
  Deferred (disclosed, brief-sanctioned): tokens_ref read-through, char click-to-test, Victories->XP prompt, collapsibility.
  Lows for final wave: no sheet-level roll-disabled fallback test; onUpdate full-remount loses expand/tab UI state.
D7 Task 10: built (161bd45) — hero-in-sidebar e2e 6/6, camera shot added (real Obsidian, verified); ZERO sheet changes (mode-agnostic proof holds).
  Framework fix in-commit: prepareModel dataForSchemaValidation excludes _dse_anchor from schema validation (hero = first additionalProperties:false element sidebar-mounted). Review pending.
  Pre-existing break found: obsidian-shots chain fails on aliases.json id/dirname mismatch (heroic-resource/hero-tokens) — MUST fix in Task 11 sweep.
D7 Task 10: complete (161bd45 + fix 703b9ae — review PASS; anchor-exclusion narrowness pinned by negative test, doc edge noted)
D7 Task 11: complete (903fe4a plugin + 12ec6af superproject — sweep clean; gates tsc/jest 1936/shots 164/obsidian-shots 131).
  Fixed: notes-gen dirname bridge (heroic-resource/hero-tokens); camera step-3d stale-panel isolation (detach dse-sidebar leaves before ground-truth capture — pixel-diff caught initiative leftover).
  Noted (cosmetic, unfixed): conditions chip text run-together. Sub-repo CLAUDE.md count 27->32.
D7 whole-branch opus final review: dispatched (range 5c6e33d..903fe4a).
D7 whole-branch opus final review: SHIP (no MUST-FIX/HIGH). MED-1 trailing-comment-after-state absorption + six LOWs -> workspace FOLLOWUPS #28. Fabricated surge-spend confirmed fully gone; byte-stability/never-fabricate/roll-bridge/degrade/write-gating/additive-framework/32-invariant all verified.
D7 WRAP 2026-07-18: plan 18 stamped BUILT-SHIP; FOLLOWUPS #28 filed (workspace main); Linear SC-2 + HANDOFF next.
FOLLOWUPS #28 fix wave: complete (80abd63, review APPROVE no findings — jest 1946; MED-1 splice, NaN width, gainHint+roll-disabled coverage, CRLF anchor edge, chip CSS root-cause). #28 marked done on workspace main.
Next: FOLLOWUPS #27+#26 (plugin agent) and #25 (steel-etl agent) in parallel; #24 after.
FOLLOWUPS #25: complete (steel-etl 310ecef — resolveChildren in DSELinkedGenerator.WriteSection; red->green test; regen blast radius 25 heroes kits + 25 unified mirrors, spot-checked panther.md). Marked done on workspace main.
FOLLOWUPS wave complete 2026-07-18: #24 (0fe7c6b), #26 (d1d01d0), #27 (a165341 + e8b19e8 fix-round), #25 (steel-etl 310ecef), #28 (80abd63) — all reviewed/approved. Plugin tip now includes changelog commit; jest 1969/tsc clean at review. Review catches: stale aria-label via setTooltip mock/production divergence (mock now mirrors production), recoveries_max gate, recovery-spend math consolidated.
Workspace main: FOLLOWUPS #24-28 all marked done (6356672). Remaining open FOLLOWUPS: #2/#3 (settings panel, dormant/M), #7, #8, #15, #18, #23 — all v2-site/steel-etl, none DSE.
Release prep 2026-07-18: migration guide docs/migrating-to-6.md (a5657eb, all claims code-verified), sync-era docs corrections + compendium-sync.md rename (31482b8), statblock insert template converted to SDK-3.x keys (aa17e63 — jest 1969 green, zero shot diffs). Plugin tip aa17e63, superproject bumped.
Scorecard prep 2026-07-18: obsidianmd audit (30/34 fixed, 1cd00ba..d869a81) + sentence-case labels (662781a) + type-safety waves 1+2 (4a71338, ffbfec7): eslint 348 -> 3 (all documented in-place), zero test edits, all 295 shots byte-identical. Plugin tip ffbfec7.
=== SC-10 HFS Steel theme (plan 19, 2026-07-19) ===
Recon: .superpowers/sdd/hfs-recon.md + shots-hfs-recon/ (28 paired PNGs). Token values already match site; gaps = typography (font never ships), link teal, crest wiring, Steel styling of existing 6-slot grammar, statblock plate, fb band, tracker harmonization. Planner corrected recon: cardHead.ts already full sc-head port; divider ornament already in sb/fb views.
Taste calls resolved by "match the site" (Scott 2026-07-19): temp-stamina purple per site CSS (overrides my blue rec), crit gold, canonical act hues, Legacy-print colored question deferred (untouched).
Plan19 Task 1: complete (da4fe3d — Source Serif 4 bundled base64 +86KB, uppercase/emboss display, small-caps eyebrows, teal in-card links; legacy+print freeze sha-proven; self-caught print leak scoped out). Eyeballed vs site: good.
  Note for Task 3: tier badges' bracket chips read as strikethrough at small size (pre-existing, visible in before shot) — address in the card treatment.
Plan19 Task 2: complete (2761d43 — crest wired, kind-noun eyebrows, boxed diamond section headers; legacy freeze byte-proven after self-caught chip-hide drift rescope; jest 1972). Eyeballed: matches site grammar.
Plan19 Task 3: complete (1fe4b79 — boxed rail, forged chips, boxed diamond panels, dashed spend box; tier-badge strikethrough ROOT-CAUSED (line-height overflow, same bug invisible in Legacy) and fixed Steel-scoped; legacy freeze all 66 byte-identical; jest 1974). Eyeballed: matches site closely.
  Scope discipline: reverted a shared text-composition fix that drifted statblock--legacy (paren-wrap nit stays, noted in report).
Plan19 Task 4: complete (cec3065 — forged plate, role band, boxed stat/kv rows, embossed numerals; verified vs real Goblin fixtures; legacy+print freeze cmp-proven; jest 1978). Eyeballed: good.
  Flags: statblock-head crest = deliberate deviation from site (brief-instructed; 1-line revert, ask Scott); empty "KEYWORDS/TYPE: --" chips on villain actions could be dropped like the site (note for polish task); DOM label/value split attempt reverted to keep legacy freeze (documented in code).
Plan19 Task 5: complete (a324eae — grey gradient band, per-option SDK emoji glyphs replacing uniform crest; legacy+print freeze cmp-proven; jest 1979). Eyeballed: matches site malice band.
Plan19 Task 6: complete (6a2602e — temp-stamina purple flip, hero sheet forged chrome; legacy freeze proven; jest 1979) + grid fix 415c561 (hero characteristics 5-across — shared-layout selector bug hit both themes, hero-only legacy PNG change justified+documented; values-row CSS-contract test updated).
Plan19 Task 7: complete (48a4e30 — reference-card display titles + teal links, the one root Task 1's blanket rule missed; ds-conditions already token-correct; legacy+print freeze sha-proven; jest 1979).
Plan19 Task 8: complete (f1c142a empty-chip drop + 40d341e changelog; superproject 35eb2a8+5ac4949 — token map + workspace changelog). Full gates: tsc/jest 1981/shots 295/obsidian-shots 131; 8-family real-Obsidian audit all good.
Plan19 whole-branch opus review: SHIP (no MUST-FIX/HIGH). Freeze proof empirical: only sanctioned hero-grid drift (incl. hero--steel-print — MED-1: that print change is the same theme-agnostic grid bug fix, base rendered broken vertical stack; recorded here as the missing ledger line). Deviations kept for Scott: statblock-head crest (1-line revert available); spend-title paren nit deferred.
SC-10 BUILT-SHIP 2026-07-19. Plugin tip 40d341e.
