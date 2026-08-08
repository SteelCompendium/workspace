# SDD ledger — plan: docs/superpowers/dse-overhaul/plans/2026-08-07-plan-25-sc10x-structural-trio.md
Task 1: complete (capture-only, no commits). Baselines @ f09f6cc: jest 2190/154 · shots 179 ·
freeze 107-of-113 producible all OK (B6 widening env) · parity 0/10. D1-D7 all re-verified.
18 root attachments across SC-101/102/103; decision comment bfff78eb on SC-102 (S-1..S-5 w/
recommendations + evidence); SC-102 In Progress + Needs Review; SC-101/103 Awaiting.
EXECUTION POLICY: proceed under recommended S-answers (S-1 print-follows, S-2 full port,
S-3 site hue verbatim, S-4 shared frame, S-5 fixture yes); LANDING gated on Scott's explicit
sanction (Task 7 consolidated rebaseline request). If Scott flips an S, rework is contained
(print-exclusion scoping / hue value / frame scope).
Task 2 (SC-103 notch): dispatched.
Task 2 (SC-103): IMPL 37d8674 — Steel-scoped CSS only (126+/0-): .dse-sb > .dse-hr suppression
+ head-band ::after 9px role-hued notch (site .sb__head::after port). jest 2195/154 (+5
contract, can-fail) · freeze 106 OK + statblock--steel-print sole content mismatch (S-1
expected) + 6 env missing · parity 0/10 unchanged · obsidian 141/141. Role hue verified 2
variants (Leader grey / Controller red via temp fixture, reverted clean). Evidence-task2
complete incl. legacy byte-identical proof + print S-1 pair. Featureblock notch twin
deliberately deferred to SC-101 task (S-4 scope). Review dispatched (Sonnet).
Task 2: review spec ✅ all 6 / quality APPROVED (0 findings). Independent battery reproduced
exactly (freeze sole-mismatch statblock--steel-print + 6 env); can-fail reproduced; legacy
byte-identity sha256-verified; suppression collateral: none (fb divider under .dse-fb parent,
condition .dse-hr separately scoped). Task 2: complete (37d8674, review clean).
Task 3 (SC-102 pt 1 — villain ActionType): dispatched (Opus).
Task 3 (SC-102 pt1): IMPL 949a4d4 (dse) + 6ede9fb (workspace D3 row) — usage-dash fallthrough,
villain ActionType before action catch-all, --dse-act-villain across 5 blocks, guards 75->76
etc., false-villain pinned. REVIEW (Opus): spec ✅ / CHANGES REQUESTED 1H/2M/2L.
H-1: feature is a NO-OP on real content — steel-etl emits villain as cost:"Villain Action N"
+ usage:"-" with NO ability_type (site classifier keys off cost prefix); derivation never
reads cost; all 156 corpus villain actions still undefined. Fixtures used ability_type ->
suite blind (M-1). M-2: light twin #b03a2e invented — real convention = scheme-invariant
#e0584b (role-controller precedent). L-1 footgun propagation, L-2 "" semantics note.
FIX ROUND 1 dispatched (fresh Opus, original agent transcript gone): cost classifier w/ site
semantics, NEW corpus-shaped fixture (NOT extending existing statblock note — that would
break frozen legacy shots; caught at dispatch), scheme-invariant hue, guard-count truth.
SCOTT INPUT + ARCHAEOLOGY (cost formats): exactly TWO shapes ever existed in data-unified.
Legacy (pre 2026-07-16 regen, steel-etl RichFeature rollout): villain actions were BODY
MARKDOWN ONLY (> skull **Name ([Villain Action](scc) N)** callouts) — no YAML features, so
the plugin renderer never sees them; legacy-synced vaults degrade gracefully (prose, no
decoration) and re-sync brings the current shape. Current: cost:"Villain Action N" +
usage:'-', no ability_type. Zero historical hits for usage:/ability_type: Villain — NO
intermediate shape; no compat branch needed. Fix agent instructed: document, don't expand.
Task 6 (docs) must carry this into the plugin architecture notes/changelog.
Task 3 FIX ROUND: 59a3492 (dse) + 14e52a5 (workspace) — cost classifier (steel-etl semantics
verbatim incl. link-strip), corpus-shaped fixture triple-wired (browser sweep + obsidian
EXTRA_NOTES 141->145 + jest catcher), scheme-invariant #e0e... hue (STEEL_LIGHT_STABLE,
light-override 35->34), honest print-twin record, L-1/L-2 docs. Legacy-format line on
isVillainCost. Scoped re-review CLEAN: all 5 addressed; real-corpus replay (human-bandit-chief
x3 via real renderBlock path) -> villain+skull; can-fail reproduced (exactly 3 red); battery
green (freeze 106/113 sole statblock--steel-print + 6 env).
Task 3: complete (949a4d4 + 59a3492 dse; 6ede9fb + 14e52a5 workspace; review clean after 1 fix round)
Task 4 (SC-102 pt2 — standalone spine removal): dispatched (Sonnet).
Task 4 (SC-102 pt2): IMPL 54f6855 — standalone spine + lane removed (compound-scoped; first
attempt was a descendant-combinator NO-OP caught by shot-read — freeze CANNOT distinguish
no-op rules from success, guard pinned). jest 2213/154 (+7) · freeze 105/113 (feature +
statblock steel-print, exactly S-1 predicted) · parity 0/10 · S-5 feature-villain fixture
added (synthetic — no standalone villain exists on site).
Task 4: review spec 5/5 ✅ / APPROVED 0 findings. No-op guard independently reproduced (freeze
went SILENT on the no-op while jest went red — exactly the blindness class); lane-collapse
confirmed via diff crop. Task 4: complete (54f6855, review clean).
Task 5 (SC-101 featureblock + shared nested frame): dispatched (Opus).
Task 5 (SC-101): IMPL b80bcd6 — shared nested-card frame ([data-dse-theme=steel] :is(.dse-sb,
.dse-fb) .dse-feature__nested > .dse-feature; site literal fill, NOT surface-sunken), cost as
display text, featstyle:flat preserved (2 freeze-invisible defects caught via probing). jest
2224/154 (+11 mutations proven) · freeze 103/113 = 4 print mismatches (statblock/feature/
featureblock/featureblock-advancement, exactly S-1 predicted; brief said "104" — arithmetic
error, 103 correct) + 6 env · parity 0/10 structurally unaffected.
Task 5 REVIEW (Opus): spec Step 3 ❌ (fb notch twin — Task 2 deferred it HERE under S-4=shared,
omitted) = M-1; quality Approved w/ 1M/4L. Kit non-reach verified STRUCTURALLY (CardLayout
.dse-card path, runtime-probed); by-SCC splits correctly (sb/fb framed, kit missed x2
mechanisms). featstyle pinning independently confirmed incl. constructed light-arm mutation.
FIX ROUND dispatched (Sonnet): M-1 fb notch twin (no new frozen lines — fb prints already
moved), L-1 flat radius, L-2 flat-vs-nested-fb scoping, L-3 documented. L-4 (no
ability_type-bearing fb fixture) -> wrap notes.
Task 5 FIX ROUND: e655e63 — M-1 fb notch twin (hue chain var(--dse-role, var(--dse-role-
leader)) — fb CAN carry role via featureblock_type, traced), L-1 flat radius, L-2 nested-fb
scoping, L-3 documented. Scoped re-review CLEAN: all closed, independent Playwright probes
reproduced everything, 2 mutations red/restored. jest 2230/154 · freeze 103/113 (same 4+6) ·
parity 0/10. Task 5: complete (b80bcd6 + e655e63, review clean after 1 fix round).
ALL IMPLEMENTATION TASKS (2-5) COMPLETE. Task 6 (docs/wrap) dispatched (Sonnet). Then Task 7
(rebase + battery under declared contract + consolidated 4-print-shot sanction ask on SC-102).
Task 6 (docs/wrap): COMPLETE. dse commit 34b7632 (architecture.md convergence section incl.
villain-format archaeology + vocabulary; CHANGELOG 7.0.0 entries; visual-harness/README
corpus-shaped-fixture convention). Workspace commit d9f589e (CHANGELOG Unreleased bullet;
FOLLOWUPS #33/#34/#35 closed dated-done; #51/#52/#53 filed, next-id 51->54; gap-inventory §B
struck+closed w/ D2/D3/D4 findings; dse-verify skill: capture-width convention + honest
PENDING freeze note (4 print lines, NOT rebaselined — Task 7's job) + this branch's real
numbers [jest 2230/154, shots 189, obsidian 145, freeze 103/113, parity 0/10] recorded
separately from main's). D3-token-map.md needed no new edit — Task 3's 6ede9fb/14e52a5
already carry the --dse-act-villain row. SC-101 Linear description patched (stale #37
paragraph struck, D1 note added); no status changes (Task 7's job). No pointer bump, no
push. Freeze widening 107->110 (S-5 fixture) deliberately left unapplied per brief/global
stop condition — recorded as pending in the skill, not actuated.
Task 6: IMPL 34b7632 (dse docs/changelog/README convention) + d9f589e (workspace docs,
FOLLOWUPS #33/34/35 closed, #51/52/53 filed — COLLISION with landed guards #51/#52, renumber
at Task 7 incl. FOLLOWUPS.md:574 cross-ref) + FIX f20f007 (changelog CSS-only claim scoped
honestly; SC-101 patch redone via STALE-prefix fallback — Linear editor mangles nested-code
strikethrough on save, confirmed twice; missing report backfilled). Review: spec ✅ /
Approved 1M (fixed). Task 6: complete.
Task 7 (finale): dispatched (Opus) — rebase onto main (guards+B6; FOLLOWUPS renumber 51/52/53
-> post-rebase counter + :574 ref), battery under DECLARED parity contract (trio fb changes
may move sampled props — handle heals/gaps honestly), S-5 freeze widening (feature-villain +
statblock-villain-corpus fixtures), consolidated 4-print-shot sanction ask on SC-102.

LEDGER NOTE (final review L-2, 2026-08-07): the FOLLOWUPS renumber landed in the
rebase-replayed commit `79382ce` (`git log -S'next-id: 56'` / `-S'## 55.'` both point there),
but `79382ce`'s own message still says "File #51 …, #52 …, #53 …. next-id 51 -> 54" —
understating what it actually contains. The commit that narrates the renumber in detail
(`22957bf`, "docs(followups): renumber this branch's filings past the landed guards
#51/#52") is 5 lines of pure SHA refreshes and contains none of the renumber — overstating
its own content. Messages can't be rewritten post-rebase; recorded here so future archaeology
isn't misled by either message.
