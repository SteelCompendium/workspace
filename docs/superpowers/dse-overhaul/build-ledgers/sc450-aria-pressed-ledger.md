# SC-450 — decisions ledger

Ticket: SC-450 "DSE: audit in-place aria-pressed setters outside initiative for the same data-pressed drift as SC-423"
Worktree: /home/scott/code/steelCompendium/worktrees/sc450-aria-pressed (every submodule on branch `sc450-aria-pressed`)
DSE base: origin/develop @ 8ab5e91 (2026-10-19)
Owner session: be71a0a9-199f-4e14-967b-191935312b05 (Opus 5.5; posts with --model opus-5.5)
Prior art: docs/superpowers/dse-overhaul/build-ledgers/sc423-portrait-frame-ledger.md (SC-423 fix + assertPortraitMarkParity)

## Rulings (verbatim, dated)

- 2026-10-19 (ticket description, filed by the SC-423 ticket-owner from review INFO-2; no Scott comments at pickup). Spec verbatim:
  > For each: does it go through `iconButton`'s `setPressed` (which stamps both), or set `aria-pressed` by hand? If by hand, does the Steel sheen rule visibly differ between the in-place state and a rebuilt one? Probe computed styles the way `assertPortraitMarkParity` in `visual-harness/shoot.mjs` does. Fix any that drift; consider a lint/jest guard that forbids a bare `aria-pressed` write on a `.dse-btn` outside `iconButton`.
  Listed sites: negotiation `ArgumentView` / `MotivationsPitfallsView`; montage `LogActionModal`; `ConditionsModal`.

## Owner decisions

- 2026-10-19: Thread had zero comments at pickup. No supersessions.
- 2026-10-19: Scope = EVERY in-place `aria-pressed` write in `src/`, not only the four listed sites (the listed set came from one review's grep; "consistency is important", Scott 2026-06-19). Each site is classified, not blindly changed.
- 2026-10-19: Build the guard (jest source-scan), not just "consider" it — it is what stops a fifth occurrence. Allowlist entries carry a one-line reason.
- 2026-10-19: Fix shape — use the iconButton handle's `setPressed` where a handle exists; where none does, one exported helper next to `setPressed` (no new ad-hoc `toggleAttribute('data-pressed')` copies scattered per view).

## Rounds

- R1 implementer: dispatched 2026-10-19 (brief sc450-brief-r1-implement.md)
- R1 implementer identity: implementer-A (agent ac14ab4c8af1c0f6a). Reviewer must be a different identity.
- 2026-10-19 dispatcher: dse origin/develop moved 8ab5e91 -> f818002 (SC-260, ReadingModeBlockHost scroll-pin). New baselines: jest 4810 passed / 1 skipped / 227 of 228 suites · lifecycle 25/25 · e2e 63/73 ok, 0 failed, 10 known-bug, coverage 47/47 pairs · shots 572 · freeze 276/276 · parity 0/0/24 DECLARED. Land-ready must be on f818002 -> rebase round needed after R1.
- 2026-10-19 R1 worker parked on its own shots job (pid 85690); owner armed watcher, resumed via SendMessage on exit.
- 2026-10-19 owner: told R1 worker (SendMessage) to rebase onto f818002 and re-run the full battery there in the same round. Watcher bh9g8aeg6 armed on report-mentions-f818002 / worker idle.
- R1 result (2026-10-19): DONE at 99ae762 on f818002 (58a7d89 red tests, f271a68 setPressedState fix, a34e161 harness gate `pressed toggle parity OK (32 comparisons across 8 sites x dark/light)`, 99ae762 jest guard test/unit/build/ariaPressedWriters.test.ts). Audit: every non-initiative aria-pressed write is on .dse-optchip/.dse-swatch (not .dse-btn), styled on [aria-pressed='true'] only -> NO DRIFT at all 8 probed sites on unfixed 8ab5e91. Initiative repaintTurn already stamped both; now routed via helper. Gates @f818002: tsc/lint clean, jest 4817/1/228 of 229, lifecycle 25/25, e2e 63/73 0 failed 10 known-bug 47/47, shots 572 0 FAIL (+ new parity line), freeze 276/276, parity 0/0/24. No crops (nothing visible). No CHANGELOG bullet (no user-visible change).
- Owner rulings on R1 follow-ups (2026-10-19):
  - Read-only `<span class="dse-init__action-toggle">` data-pressed writes (initiative/view.ts ~873, ~951) allowlisted in guard: DROP — static state displays, not toggles; routing them through setPressedState would add aria-pressed to a non-button span (a11y regression). Allowlist with reason is correct.
  - Harness gate borrows rendered-pressed motivation chip as reference for pitfall chip: DROP — a future restyle that differentiates them fails loud (false red, not false green); a new fixture would move the shot sweep for no user value.
- R2 reviewer dispatched 2026-10-19 (brief sc450-brief-r2-review.md), author-independent (reviewer identity != implementer-A).
- 2026-10-19 relay (SC-453 owner via dispatcher): its implementer ran `rm -rf /tmp/dse-obsidian-lifecycle-*` ~14:35-14:45; a lifecycle failing with a missing vault in that window is environmental — re-run. SC-450 impact: none — R1 lifecycle runs finished 14:07 and 14:25 (both 25/25); R2 had not started lifecycle by 14:56.
- R2 result (2026-10-19): APPROVE_WITH_FINDINGS at 99ae762; 0 HIGH/0 MED/3 LOW/6 INFO. Reviewer's harness blocked the report .md; findings returned inline and saved verbatim to sc450-r2-review-findings.md by owner. Own probe: 108 comparisons OK (rest/hover/focus-visible); 572/572 PNGs byte-identical base vs head; full battery green on head (jest 4817/1/228 of 229, lifecycle 25/25, e2e 63/73 0 failed 10 kb 47/47, shots 572 0 FAIL, freeze 276/276, parity 0/0/24).
- Owner rulings on R2 findings (2026-10-19):
  - LOW-1 (harness gate measures rest only; hover-only mutation M2 passes): FOLD into R3 — per-state measurement (rest/hover/focus-visible) as prescribed.
  - LOW-2 (guard misses dataset.pressed, ariaPressed assign shapes, built names, `//`-in-string comment stripping): FOLD into R3 — add the prescribed patterns + string-aware comment stripping.
  - LOW-3 (allowlist counts per file, a swap passes): FOLD into R3 — match allowed hits by line text with exact counts.
  - INFO (writer module iconButton.ts exempt as a whole file): FOLD into R3 with LOW-2 — scan iconButton.ts too; only setPressedState's body may write.
  - INFO (gate red-proof by revert impossible since base has no drift; mutation M1 proves non-vacuous): ACCEPT — no action.
  - INFO (scratchpad shared by the whole owner session; another worker overwrote r2 gate.sh): future briefs require worker-unique prefixes in the scratchpad (e.g. sc450-r3-impl-*). Not a ticket.
  - Other INFOs (DROP rulings stand; main-checkout vault dirt): no action.
- R3 fix round: resume implementer-A (author) with findings verbatim; R4 scoped re-review of the delta to the R2 reviewer identity (reviewer-B, a0380cdf7a34feeba).
- R3 result (2026-10-19): DONE at 84b27ac on f818002 (8f298d6 LOW-1 per-state gate, 1325acb LOW-2/LOW-3/INFO guard on TS AST + line-text allowlist, 84b27ac scroll-into-view before hover). Gate line: `pressed toggle parity OK (96 comparisons across 8 sites x dark/light x rest/hover/focus-visible)`. Red-proofs: M2 hover mutation red; each new guard shape red; second writer in iconButton.ts red; swap case red. Gates: tsc/lint clean, jest 4819/1/228 of 229, lifecycle 25/25, e2e 63/73 0 failed 10 kb 47/47, shots 572 0 FAIL, freeze 276/276, parity 0/0/24.
- Owner ruling 2026-10-19: one-off jest failure in test/dom/framework/sidebarInitiative.test.ts (data-dse-sidebar-unavailable assertion; passed alone 11/11 and in the next full run) — DROP unless R4 reproduces it; unrelated to this diff. If R4 reproduces on base too, file a Backlog ticket.
- R4 scoped re-review dispatched 2026-10-19 to reviewer-B (delta 99ae762..84b27ac).
- R4 result (2026-10-19): APPROVE_WITH_FINDINGS at 84b27ac. All R2 LOWs + iconButton INFO closed (M2 hover + focus-visible mutations red; 16/16 bypass shapes caught; swap case red; second writer red; gate green at 6 viewports). Gates: tsc/lint clean, jest 4819/1/228 of 229, shots 572 0 FAIL + `pressed toggle parity OK (96 …)`, freeze 276/276, parity 0/0/24; 572/572 PNGs byte-identical. Lifecycle/e2e skipped (delta test+harness only; green R2/R3). sidebarInitiative flake not reproduced (8x solo + full run) -> DROP stands.
- Owner rulings on R4 findings (2026-10-19):
  - R4 LOW-1 (`ariaPressedWriters.test.ts:146` name match case-sensitive; `setAttribute('ARIA-PRESSED',…)` bypasses): FOLD into R5 — `PRESSED_NAMES.has(v.toLowerCase())` + add `'ARIA-PRESSED'` to the can-fail shape list.
  - R4 INFO (data-pressed-only via `Object.assign(el.dataset,{pressed:''})`, dataset alias, non-literal key): FOLD only the Object.assign-on-`.dataset` key check at `:121` (same file, small); DROP alias/non-literal key — not the SC-423 drift shape and not statically tractable.
  - R4 INFO (runtime-built names via join/variable template): DROP — no static scan can see them.
  - R4 INFO (getAttribute/getAttributeNS reads flagged as hits): DROP — fails loud, never false green.
- R5 fix round: implementer-A; R6 scoped re-review of the R5 delta: reviewer-B.
- 2026-10-19 dispatcher: dse origin/develop moved f818002 -> 9ed8dc6 (SC-428: Catch Breath disabled states, shared labelWithReason, stamina-bar marker focus). New baselines: jest 4840 passed / 1 skipped / 227 of 228 suites · lifecycle 25/25 · e2e 68/76 ok, 0 failed, 8 known-bug, coverage 51/51 pairs · shots 572 · freeze 276/276 · parity 0/0/24. Land-ready must be on 9ed8dc6.
- Owner decision: after R5 commits, implementer-A rebases onto 9ed8dc6 and runs the FULL battery (develop changed src/). If SC-428 added any new aria-pressed/data-pressed writer the guard flags, route it through setPressedState (in scope: the guard is this ticket's contract) and report it for re-review.
- R5 result (2026-10-19): 4f5f318 on 84b27ac (test file only): case-insensitive attribute names + Object.assign(<x>.dataset,{pressed}) flagged; red-proof sc450-r5-guard-red.log; tsc/lint clean, jest 4819/1/228 of 229. Then rebased onto 9ed8dc6 -> head c616e22 (full battery running).
- Rebase result (2026-10-19): head c616e22 on 9ed8dc6 (8 commits), clean rebase, kit/index.ts auto-merged (setPressedState + labelWithReason). Guard green (SC-428 adds no writer). Gates: tsc/lint clean, jest 4849/1/228 of 229 (4840+9), lifecycle 25/25, e2e 68/76 ok 0 failed 8 kb 51/51, shots 572 0 FAIL + pressed toggle parity OK (96), freeze 276/276, parity 0/0/24. R6 scoped re-review -> reviewer-B.
- R6 result (2026-10-19): APPROVE at c616e22 (0 HIGH/MED/LOW, 1 INFO). R4 LOW-1 + Object.assign INFO closed (5 shapes red, 7 harmless cases clean); range-diff shows commits 1-7 identical + c616e22 only; index.ts merge correct. tsc/lint clean, jest 4849/1/228 of 229.
- Owner ruling: R6 INFO (computed-key / conditional object literal in Object.assign(el.dataset,…)) — DROP: same class as the dropped dataset variants, writes only data-pressed, not the SC-423 drift.
- Owner ruling: no CHANGELOG bullet (DSE or workspace) — no user-visible change (572/572 PNGs byte-identical).
- LAND-READY 2026-10-19: draw-steel-elements sc450-aria-pressed @ c616e22 on develop 9ed8dc6 (8 commits). Only the dse submodule changed.
- 2026-10-19: land-ready comment posted (no ask for Scott; state left Awaiting pending dispatcher landing). Reported land-ready to dispatcher.
