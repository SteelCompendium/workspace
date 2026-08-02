# SDD ledger — SC-105 font token vocabulary (+ slab decision brief)
Phase 1: design recon (read-only, main checkout @ dse 0a3ce4d — steel-body stack landed).
Deliverables: (a) implementation plan for the SIX-slot token vocabulary (Title/Body/Card-body/
Label/Controls/Mono) that SC-112's prefs+UI will consume; (b) a facts-based decision brief for
Scott on the slab bundle (OFL candidates, sizes, weight coverage, what bundling entails).
Key constraints: token-coverage build guard (tokens.ts == D3-token-map == all 3 theme blocks);
freeze now 101/101 — introducing tokens must be a visual no-op (values = current effective
values); Scott rulings binding: six slots confirmed, Label & Controls are real settable slots,
"same as X" defaults, serif-everywhere baseline.
DESIGN COMPLETE (persisted: sc105-font-tokens-design.md). Keys: var()-chain risk NOT real (guard
is text-presence); Controls landmine — btn/tabs/collapse currently serif via inheritance, re-point
would move pixels → Option 1 adopted (SC-105 re-points ONLY the stepper; de-serif call is
SC-112's); font-display RETIRED in Task 2; worked guard numbers 69→74→73. Slab brief: SS4 ships
600/700 only (~32KB ea); options A free / B add-400-weight / C OFL slab 45-90KB — Scott's call,
non-blocking (vocabulary lands with current values; swap is a later one-liner).
CONTROLLER NOTE for Task 2: prefer the design's own simpler split alternative (keep broad Body
rule; add higher-specificity Card-body rule) over the :not()-chain sketch — values identical by
chain, so no race matters; re-verify specificity explicitly at SC-112.
Execution: wt-new steel-fonts → SDD Tasks 1-3.
Task 1: IMPL dse 647275f (tokens+guards) + superproject c054bc8 (D3-token-map). Gates: tsc ·
jest 2016/144 · freeze 101/101 · parity 0/10/exit0. Deviation (sound): theme-steel.test.ts has a
THIRD union guard the design's file list missed — same bump applied. Worked numbers all matched
(74 / 67+7 / 52+22). Review dispatched.
Task 1: review spec ✅ PASS / quality APPROVED (0C/0I/1 Minor). Deviation (third guard file)
ENDORSED — reviewer reimplemented the guard counting from raw CSS: 67/7 correct. All claims
independently reproduced (fresh freeze regen 101/101, parity, both guard recomputes).
Task 1: minor (deferred to Task 3): D3-token-map.md:95-96 stale footnote "there is deliberately
no separate --dse-font-body" — now false; fix in the docs task.
Task 1: complete (dse 0a3ce4d..647275f, superproject c054bc8, review clean)
Task 2: IMPL dse f6d464d (re-point all 7 consumers + stepper -> font-controls; font-display
retired; contract tests +6, jest 2022/144) + superproject 95601b6 (D3 row drop, mechanical for
the map-sync guard; prose rewrite = Task 3). Gates: tsc · jest 2022/144 · freeze 101/101 ·
parity 0/10/exit0. Concerns: specificity wrinkle documented inline for SC-112; D3 prose stale
until Task 3. Review dispatched.
Task 2: review spec ✅ PASS / quality APPROVED (0C/0I/2 Minor). Battery re-run independently;
retirement grep 0-hit verified; classification exact; guards recomputed (73/66/7/52/21); 2 of 7
can-fail scenarios reproduced; specificity comment VERIFIED ACCURATE via DOM trace
(pipeline.ts:354, (0,4,0) vs (0,3,0) math correct).
Task 2: complete (dse 647275f..f6d464d, superproject 95601b6, review clean)
Task 3 scope additions (deferred minors): D3-token-map stale footnote (:95-96, Task 1 review) +
D3 present-tense font-display prose + visual-harness/parity/README.md stray font-display mention.
Task 3: IMPL dse 2634568 (parity README + plugin changelog) + superproject 5e6aa39 (D3 rewrite +
workspace changelog). Sweep: no other stale hits. Gates identical to Task 2 (zero drift).
Task 3: complete pending final review (folded into whole-branch review — docs-only task).
NOTES: (1) implementer self-caught ANOTHER main-checkout edit leak (reverted, main verified
clean) — second occurrence this week; encode a hard guard in the future land-stack skill.
(2) Landing note: worktree superproject CHANGELOG is behind main's — expect a small changelog
merge/rebase reconcile at landing.
FINAL WHOLE-BRANCH REVIEW: dispatched (fable), covers Task 3 spec-check + branch coherence.
FINAL REVIEW (fable): READY TO LAND — 0C/0I/0M, 3 record-only notes (untracked artifacts stay
out of commits; land-stack guard idea -> FOLLOWUPS at authoring time; CHANGELOG keep-both at
landing). Reviewer re-ran full battery + broke a FRESH contract scenario (Legacy-root label
chain) + claim-by-claim docs check. "Zero rendering change" PROVEN.
LANDING NOTES: (1) worktree superproject is behind main — main gained sc-113-114 (another
session's site fix + DEPLOY 197eefe with pointer bumps f1107f0). Landing must commit ONLY the
dse gitlink; merge keeps main's newer steel-etl/v2/data pins (branch never committed those
gitlinks — verified safe). (2) CHANGELOG single-hunk keep-both conflict expected.
SWATCH BUILD: dispatched (throwaway experiment, tree must restore to 2634568 clean; real woff2
sizes replace design estimates).
Branch state: dse 0a3ce4d..2634568 (3 commits), superproject 3 docs commits, unpushed, ready to
land pending Scott's font pick + go.
