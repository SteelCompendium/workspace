# SDD ledger — plan: docs/superpowers/dse-overhaul/plans/2026-07-27-plan-22-steel-body-text-coherence.md

Linear: SC-99 (parent SC-97). Worktree: /home/scott/code/steelCompendium/worktrees/steel-body
(branch steel-body), dse submodule off b7ea4af. Task 1 Step 2 (broadened selector) was applied
UNCOMMITTED in the worktree on 2026-08-01 while generating the C1 A/B; freeze verified 98/98 at
that point. C1 decision: serif everywhere (SC-98, Done).

STOP CONDITION: do NOT land. Scott lands with `just wt-finish steel-body` from the MAIN checkout.

Carry-forward into Task 1 Step 3: encounter head `EV 0 / 40` chip loses numeric emphasis under
the broadened rule — fix with a targeted chip-value rule, never by narrowing the selector.
A/B evidence: .superpowers/sdd/shots-c1-ab/{before,after}/encounter--steel-dark.png

Task 1: IMPL df40203 (DONE_WITH_CONCERNS — implementer). Gates per report: tsc clean · jest
2010/144 · parity 0/10/exit0 unchanged · freeze 98/98 · 7 families read serif-coherent.
Deviations for review: (A) EV-chip — old numeric emphasis was an smcp font-rendering artifact,
CSS-only recreation impossible; shipped solid natural-size caps instead. (B) touched
steelTypography.test.ts (Task-2 file) — old font-identity assertion substring-matched the
4-root selector, mechanically broken by the required broadening. Review dispatched.
Task 1: review spec ✅ / quality APPROVED-with-follow-ups (0 Critical / 2 Important / 1 Minor).
  Deviations RULED: (A) EV-chip ACCEPTED — rightPrimary is a single text node (encounter/view.ts:187,
  cardHead.ts), literal size-disparity impossible without DOM; fix resolves real split-digit
  rendering. (B) test edit ACCEPTED — minimal, isolated to the one assertion the selector change broke.
  Important #1: Step-6 negotiation verdict FALSELY claims tier badges non-serif (.dse-pr__badge has
  no own font-family — genuinely serif now). #2: numeric stepper/counter inputs (font:inherit) went
  serif = literal violation of the "must not change numeric inputs/steppers" constraint.
  Minor (deferred): none beyond the accepted test-edit note.
Task 1: fix round 1/5 dispatched (fresh implementer — original's transcript unavailable; findings
  #1 report-accuracy + badge-consistency determination, #2 targeted stepper exclusion CSS).
Task 1: fix round 1/5 IMPL 6996c00 (#1: no CSS change — badges CONSISTENT since plan 21, report
  corrected with byte-identical shot evidence; #2: .dse-stepper__input/.dse-stepper__value ->
  var(--font-text) targeted Steel-scoped rule ~:3511). Gates: tsc clean · jest 2010/144 · freeze
  98/98 · parity 0/10/exit0. Scoped re-review dispatched (df40203..6996c00).
Task 1: fix round 1/5 re-review — BOTH ADDRESSED (badge consistency proven via byte-identical
  feature shot + 4x glyph crop; stepper rule correctly scoped/targeted, var(--font-text) proven
  the pre-fix ambient value; coverage verified across all four non-stepper numeric inputs incl.
  two the report didn't name — .dse-mt__char-input, .dse-init__malice-quickadd-amount, both
  genuinely unaffected). No new breakage.
Task 1: minor (deferred): fix-round report undercounts checked numeric-input classes (names 2 of
  4) — auditability nit, not functional. For final review triage.
Task 1: complete (commits b7ea4af..6996c00, review clean after 1 fix round)

INCIDENT (2026-08-02 ~10:06): another Claude session (started 10:02, .kandev passthrough wrapper;
a second session alive since Jul 31) relocated the MAIN checkout's dse git store from
.git/modules/draw-steel-elements to an in-tree draw-steel-elements/.git — orphaning the steel-body
worktree's alternates and stranding Task 1's two commits as loose objects. RECOVERED: objects
backed up, alternates repointed, full `git repack -a -d` makes the worktree store self-sufficient
(5905 objects in-pack, fsck clean, b7ea4af..6996c00 reachable). Main checkout unharmed
(main == origin/main, clean, reflog intact). Scott alerted — concurrent-session hazard live again.
Task 2: IMPL submodule 6cc25ed (contract test) + 328cb63 (plugin changelog); superproject 5facf93
  (workspace changelog + gap-inventory C1/C2 CLOSED + D3-token-map note), rebased cleanly onto
  origin/main c4b71e1 first. jest 2011/144 (+1 contract test) · tsc clean · shots 164 ·
  obsidian-shots 131 (display available, ran) · parity 0/10/exit0 · freeze 98/98.
  Implementer self-caught+recovered a Write-truncation of the test file mid-task (git checkout,
  redid with Edit, full battery re-run post-recovery). Review dispatched — instructed to verify
  final test state for truncation residue and re-derive can-fail evidence if in doubt.
Task 2: review spec ✅ / quality APPROVED, ZERO findings. Reviewer independently reproduced the
  can-fail evidence (same failure output), re-ran the full battery (identical numbers), verified
  no pointer bump (git diff 5facf93^ 5facf93 -- draw-steel-elements empty), no truncation residue
  (183-line test file verified line-by-line).
Task 2: complete (submodule 6996c00..328cb63, superproject 5facf93, review clean)

Task 1: COMPLETE · Task 2: COMPLETE. Final whole-branch review dispatched.

FINAL REVIEW (fable, verify-by-execution): NEEDS FIXES — 0 Critical / 1 Important / 2 Minor.
  Reviewer re-executed: jest 2011/144 · tsc · token-coverage 9/9 · parity 0/10/exit0 (WARN set
  verified line-by-line == #39×4 + #40×6) · shots 164 regen + freeze 98/98 · can-fail re-derived
  (4-root revert → 2 failed, restore → 6/6) · no src/ changes · pointer unbumped · nothing pushed ·
  all 5 commits attribution-free · shot-reads: hero/negotiation/encounter/feature coherent,
  legacy unchanged.
  Important: BOTH changelogs claim EV chip "keeps prior non-serif rendering" — FALSE (chip
  inherits serif; only smcp small-caps dropped). Docs-only fix.
  Minor (fold into fix): workspace changelog names "party awards" as stepper example — wrong,
  raw input never affected. Minor (record-only): fix-round report 2-of-4 undercount.
  Deferred-minor triage: both record-only; EV-chip acceptance verified structurally sound
  (single template-string text node, encounter/view.ts:187).
FINAL FIX WAVE: dispatched (one subagent, complete findings list, docs-only).
FINAL FIX WAVE: re-review ALL ADDRESSED (rewording verified against CSS ground truth; scope
  CHANGELOG-only both commits; no new overclaims).
SCOTT RULING (2026-08-02, mid-final-review): "If there isn't a good reason for the EV chip to be
  inconsistent, then we shouldn't." Controller fact-check: the carve-out (:3507) is encounter-only
  and drops small-caps; the "uniquely numeric" rationale is shaky — "5 MALICE"/"VILLAIN ACTION 1"
  carry digits under the shared treatment. Ruling applied: REMOVE the carve-out, EV chip joins the
  uniform chip family; smcp cap-height digits ACCEPTED by design. Consistency-fix task dispatched
  (CSS deletion + third changelog wording pass + battery + chip-vs-chip visual verdict; BLOCKED
  escape hatch if genuinely illegible).
  NOTE for Scott (not acted on): the same consistency logic COULD apply to the stepper sans
  exclusion (a plan-text Global Constraint written pre-serif-decision). Left as-is pending his call.
CONSISTENCY FIX: IMPL dse 102bc9e (carve-out deleted + plugin changelog) + superproject 233d5f2
  (workspace changelog + gap-inventory + D3-token-map). Chip verdict: "EV 0 / 40" identical
  serif small-caps treatment to "5 MALICE"/"VILLAIN ACTION 1", legible. Gates: tsc clean ·
  jest 2011/144 · shots 164 · freeze 98/98 · parity 0/10/exit0. Scoped re-review dispatched.
STEPPER QUESTION RESOLVED (Scott, 2026-08-02): interactive components get their own "Controls"
  font slot in settings (SC-112 — now SIX slots; Label = static small-caps display text, a
  different role). No branch change: the plan-22 stepper exclusion (var(--font-text)) IS the
  Controls slot's future routing point; re-points to --dse-font-controls when SC-105's tokens
  land. Buttons/tabs default (Controls-sans vs body-serif) deferred to the SC-112 brainstorm.
CONSISTENCY FIX: re-review CLEAN (carve-out fully deleted, docs truthful everywhere, chip family
  visually uniform, hygiene verified incl. ls-remote empty both repos, jest 6/6 spot-check).
  Minor (record-only): stepper-exclusion comment still says "same pattern as the EV-chip fix just
  above" — now a dated cross-reference to a removed rule. Harmless.

## PLAN 22 / SC-99: COMPLETE (2026-08-02)
BRANCH STATE (not landed, per stop condition):
- dse submodule: b7ea4af..102bc9e on branch steel-body (7 commits: broadening df40203, stepper/
  report fix 6996c00, contract test 6cc25ed, plugin changelog 328cb63, changelog truth-fix
  7a999b5, EV-chip unification 102bc9e — plus its changelog edit)
- superproject: c4b71e1..233d5f2 on branch steel-body (3 docs commits: 5facf93, 54f30f1, 233d5f2);
  dse pointer deliberately UNSTAGED
- Nothing pushed (verified via ls-remote). Scott lands with `just wt-finish steel-body` from MAIN.
Final gates (verified by execution, multiple independent agents): tsc clean · jest 2011/144 ·
shots 164 · obsidian-shots 131 · parity 0 GAPs/10 WARNs/exit 0 (WARN set == #39×4+#40×6) ·
freeze 98/98 · token-coverage 9/9 · no src/ changes · all commits attribution-free.
Next on this branch: SC-108 (fixtures), then SC-104 (modals).
