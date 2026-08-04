# SDD ledger — plan: docs/superpowers/dse-overhaul/plans/2026-08-02-plan-23-sc112-font-settings.md
Linear: SC-112 (parent SC-97). Worktree: /home/scott/code/steelCompendium/worktrees/font-settings
(branch font-settings, dse base ccf465e). PARALLEL with plan-24 (worktree kit-tiles) — separate
checkouts, landings serialized. Plan amended 624f43d: "Default (Obsidian vault fonts)" first
picker option; Task 5 = Legacy-support investigation with Scott's easy-ship/hard-skip gate.
9 tasks. STOP CONDITION: do NOT land, do NOT push.
Task 1: complete (superproject worktree commit 7fcf532 — spike ledger; no dse code by design).
VERDICT: Outcome A — queryLocalFonts() exposed + unconditionally granted (no prompt/gesture),
424 fonts, byte-identical across 3 real-Obsidian CDP spawns incl. post-self-update. Task 8
builds the feature-detected "List installed fonts" path; curated+Custom unconditional fallback.
Review: controller-accepted (evidence definitive; wrong-verdict risk degrades gracefully via
feature-detect). NOTE: another self-caught main-checkout mis-commit (reverted; main == origin).
Task 2: IMPLEMENTER STALLED (watchdog 600s kill, no report, no commits) mid-fixing seams.test.ts
style-attribute assertions. Left ~400 lines of on-track uncommitted work (prefs.ts seam +98,
managedModal +10, main.ts wiring, 2 test files) + stray jsdom-check2.js. Takeover implementer
dispatched: judge inherited diff against brief, finish-or-redo, OWN all can-fail evidence itself
(cannot cite a dead agent's unwritten evidence), full battery, commit.
Task 2: takeover IMPL 24d759d (inherited work judged SOUND; one real bug fixed = the stall site:
jsdom style="" residue breaks hasAttribute('style') — now cssText assertions). jest 2039/144
(+17, all can-fail-verified) · tsc · shots 169 · freeze 101/101 · parity 0/10 · obsidian 132.
Forward footgun flagged for Task 6: use cssText/getPropertyValue never hasAttribute('style').
Review dispatched.
Task 2: review spec ✅ / quality APPROVED, 0 findings. Leak-class cross-check (from plan-24 I1):
NEGATIVE here, empirically — reflect() once per view/root pair (not in re-enterable onMount);
modal reflectCss wrapped by pre-existing dseOpen guard (5 open/close cycles = 1 sub each; no-op
opens = 0). can-fail probes x2 reproduced; jsdom fix genuine.
Task 2: complete (commit ccf465e..24d759d, review clean)
Task 3: IMPL 5444374 per spec BUT honest null result — flip produces ZERO pixel change (byte-cmp,
harness + real Obsidian). Gates all green (which is itself a clue). Implementer's trace
inconclusive (suspects :root/--font-text-on-body resolution; speculative Steel-block redeclare
"didn't help" — suspicious, needs verification). CONTROLLER HYPOTHESIS: SC-105 declared
font-controls as an INVARIANT in all three theme blocks — a :root-only flip loses to the Steel
block's var(--font-text); guards staying green corroborates. Debugging round dispatched
(systematic-debugging framing) before review.
Task 3 DEBUG ROUND: ROOT CAUSE PINNED — :root var() chains flatten at the DECLARING element
(html) where --font-text (body-scoped) is invalid => whole :root slot set IACVT-dead; consumers
fell back to INHERITED serif. Steppers already silently serif since SC-105 T2's rename (dead
token); prior "redeclare didn't help" was a misread (worked, identical pixels). FIX 07c06da:
Steel block chains font-controls -> var(--dse-font-body) (like card-body/label); guards 67/6;
+1 chain contract (3-angle can-fail). Probe evidence 15/15 empty->serif. Gates: jest 2043 ·
freeze 101/101 · parity 0/10.
HONEST CORRECTIONS TO RECORD: (a) SC-105's "zero rendering change" claim was false in the
stepper region of UNFROZEN steel shots (guards structurally blind there) — end state = Scott's
ruled target, no user-facing correction needed, but Task 9 changelog must tell the true story.
(b) FOLLOWUPS candidate / Task 5 LOAD-BEARING INPUT: entire :root font-slot set is IACVT-dead;
Legacy renders via inherit fallback only — Legacy custom-font support depends on fixing this.
Scoped re-review of 07c06da dispatched.
Task 3: debug-fix re-review CLEAN — root cause independently reproduced (minimal repro + live
harness probes match ROOTFIX-AFTER); fix teeth = revert -> exactly 3 claimed suites fail;
SC-105 claim HIGH confidence via git archaeology (f6d464d rename diff = primary source);
commit wording verified honest ("pixel-identical at defaults"). Battery from scratch all green.
Task 3: complete (commits 24d759d..07c06da incl. debug round, review clean)
Task 4: takeover IMPL 42086e9 (inherited diff judged SOUND, kept; card-body root compound +
9 label pins). jest 2049/144 (+6, can-fail x2 runs) · freeze 101/101 sha256 · parity 0/10 ·
LIVE divergence probe: card-body genuinely diverges from body; 9/9 label pins non-IACVT.
Note: stale --obsidian-* PNGs inflate naive shot counts (harmless). Review dispatched.
Task 4: review spec ✅ PASS / quality APPROVED (0C/0I/0M). Divergence probe independently
reproduced (fresh Playwright: card-body moves feature/fb/.dse-sb not encounter; label moves
statgrid labels not card-body scope); 9/9 pins == design §B exactly; freeze cmp-identical vs
parent regen; can-fails reproduced.
Task 4: complete (commit 07c06da..42086e9, review clean)
Task 5: VERDICT SHIP. Title/Body/Card-body/Label/Controls consumer rules widened Steel-only
-> theme-agnostic (Mono untouched, was never Steel-gated). 8/10 Steel-scoped sites bundled
font-family with a Steel-only visual property (weight/uppercase/color/etc) -> split, not a
literal qualifier-drop. First freeze run FAILED (22/22 steel-print shots broke) — bare
:not([data-dse-print="on"]) descendant selector doesn't anchor to the print-stamped root
(any ancestor lacking the attr trivially satisfies it); fixed with ONE uniform pattern
(:is([data-dse-element], .dse-modal):not(print) anchor, matching the SC-104 token-block
idiom) applied to 11/14 arms; re-ran once, clean — CONTAINED, not sprawling, hence SHIP not
SKIP. Live-probe: Legacy no-op at defaults confirmed + Legacy actually responds to a
per-root inline override (Task 6's future mechanism) confirmed. jest 2056/144 (+7) · freeze
101/101 · parity 0/10/exit0. Ledger:
docs/superpowers/dse-overhaul/build-ledgers/sc112-legacy-font-gate.md (workspace repo).
Task 5: review spec ✅ PASS / quality Approved-with-findings. I1 (Important): jest guard
didn't lock the print-anchor SHAPE, only its presence — passed unchanged on the buggy bare
:not(print) form, only freeze caught it. Fixed: findUnanchoredPrintExclusions() + 2 tests;
can-fail reverting .dse-head__primary--left to bare form -> exactly 1/2058 red (the new
test), restore clean. M1 (Minor): arm count wrong ("11 of 14") -> corrected to 18 total (15
anchored + 3 safe compound: Title 5/6, Body 2/3, Card-body 1/2, Label 1/1, Controls 6/6) in
report + ledger. M2 parked (reviewer's own CSS walk confirmed the live-probe claims).
Test-only fix round, freeze/parity not re-run (no CSS behavior change); tsc + jest
2058/144 clean.
Task 5: complete (dse commits a79e6a5, 5545092; workspace-repo ledger commits f879b2b, 3c48922)
Task 5: review spec PASS / quality Approved-with-findings (1I/2M). Reviewer re-ran battery
from scratch: all green incl. freeze 101/101 + parity 0/10 exact WARN set; 3 unanchored arms
independently judged sound (compound directly on the stamped element, no descendant hop).
I1: guard suite doesn't lock the print-anchor shape (bare-:not revert passes all 2056 jest,
only freeze catches). M1: "11/14 arms" totals wrong (actually 15 anchored + 3 compound).
M2 (parked): live-probe evidence interactive/deleted, unverifiable from diff — reviewer's own
CSS walk confirmed both claims.
Task 5: fix round 1 dispatched (resume implementer): I1 guard-with-teeth + M1 totals.
NOTE: implementer had prematurely written "Task 5: complete" above — completion is NOT final
until this fix round + scoped re-review clear.
Task 5: fix round 1 — dse 5545092 (I1 print-anchor shape guard, findUnanchoredPrintExclusions;
additive 66+/0-) + workspace 3c48922 (M1 counts corrected to 15 anchored + 3 compound = 18).
Scoped re-review CLEAN: teeth independently reproduced (bare-form revert of .dse-head__primary
--left arm -> exactly the guard red; restore -> green), 2058/144 confirmed, arm counts
independently recounted per-slot and match, no new problems.
Task 5: complete (dse a79e6a5..5545092; workspace f879b2b + 3c48922; VERDICT SHIP; review clean)
Task 6: IMPL DONE 48d03b8 — six font prefs (default '' sentinel -> toCss null), fontStacks.ts
(sanitizeFamily + fontCss + CURATED_FONTS), Typography group, SHIP help-text clause. jest
2093/146 (+32 sanitizer/builder, can-fail x2) · freeze 101/101 · parity 0/10. Notes: two
Task-8 typings landed early for tsc ('font' control kind, PrefUi.advanced) — Task 8 renders
against these, must not re-add; sanitizeFamily quotes every non-generic token (needed for
smoke expectation), generics stay bare. Review dispatched (sanitizer = flagged risk center).
Task 6: review spec PASS (1 disclosed justified deviation: quote-all-non-generic tokens) /
quality APPROVED (0C/0I/2M). Reviewer ran gates independently: jest 2093/146 · freeze 101/101
from-scratch · tsc clean (parity report-claimed only — zero CSS touched, freeze covers
inertness). Sanitizer probed empirically: setProperty custom-prop sink structurally
injection-proof; \3b, /*, !important, :, U+2028, quote-close all inert -> defense-in-depth.
Task 6: minor (deferred): split-before-strip mangles comma inside quoted family name
(hypothetical); exotic Unicode separators (U+2028) survive inside quoted tokens (inert in CSS
strings).
Task 6: complete (commit 5545092..48d03b8, review clean)
Task 7: IMPL fe4142a (dse) + 753a91d (workspace D3-token-map rows) — text/card scales, site
snap semantics, nested resets, real-Obsidian evidence (6 shots, programmatic asserts). Brief
guard arithmetic was stale; file truth used (STEEL_INVARIANT 6->8 not 9, overridden stays 67).
Task 7: review spec PASS / quality APPROVED (0C/0I/3M). Independent battery green; freeze
100/101 sole kit--steel-print = environmental PASS (SC-100 landed + sanctioned rebaseline;
reviewer verified independently). Zoom nesting: no double-zoom shape exists in corpus; both
cross-root forms covered.
Task 7: minor (deferred): (1) Task 5 print-anchor guard never scans the new scale rules —
vacuous pass there (exact-selector pins compensate); (2) zoom nested-reset arm anchors bare
[data-dse-element] compound — safe but would trip a generalized shape guard; (3) zoom-reset
test uses brittle substring predicate (fails loud).
Task 7: complete (dse 48d03b8..fe4142a + workspace 753a91d, review clean)
NEXT: rebase font-settings worktree onto new main (dse edc69b4 kit rebuild + rebaselined
freeze line) BEFORE Task 8; expect styles-source.css / theme-test conflicts; full battery
after (freeze should be 101/101 post-rebase).
REBASE onto post-SC-100 main: dse fe4142a -> ad0b662 (on edc69b4), workspace -> 6b198c3 (on
f459948). Zero textual conflicts; qlf-spike doc silently dropped by patch-id match
(main applied-then-reverted) — restored via cherry-pick 7fcf532; 2 jest fails (SC-100's
Steel-scoped font-var consumers vs SC-112 Legacy gate) reconciled test-only via
SC100_STEEL_CONSUMERS allowlist (ad0b662, no CSS changed). Battery: jest 2127/150 · freeze
101/101 TRUE (kit rebuild in tree + rebaselined line) · parity 0/10. rebase-report.md filed.
Task 8: IMPL c9a9d90 — Typography settings UI: 6 font dropdowns (Default sentinel, curated,
Custom... text input, List-installed-fonts affordance w/ queryLocalFonts + fallback), 2 percent
sliders, Advanced <details>. jest 2135/150 (+8 renderer, can-fail x2) · freeze 101/101 ·
Obsidian evidence via 2nd CDP connection to the Settings POPOUT target (1.13 opens Settings as
own window). Notes: (1) cosmetic double value label — Obsidian native "1.00" beside our "100%";
(2) brief's nested ui.slider superseded by T7's flat min/max/step (wired to shipped shape);
(3) installed-fonts fetch is once-per-tab-lifetime by design. Review dispatched.
Task 8: review spec ✅ all 7 / quality APPROVED (0C/0I/3M). Reviewer battery: jest 2135/150 ·
freeze 101/101 · tsc clean. Both screenshots verified (defaults + Georgia/120% live-apply).
Task 8: minor (deferred): (1) double value label "100%" + Obsidian native "1.00" — DEFER,
Scott sees screenshot first; FOLLOWUPS candidate at Task 9; (2) installed-fonts affordance
retires plugin-session-wide after silent failure (tab instance is plugin-lifetime) — accepted;
(3) dropdown shows Custom... when typed text matches curated family + per-keystroke persist —
idiom-consistent, accepted.
Task 8: complete (commit ad0b662..c9a9d90, review clean)
Task 9: IMPL 4d95a0b (plugin: changelog Typography entry w/ honest Controls+Legacy stories,
corrections to 2 earlier 7.0.0 bullets claiming the dead stepper sans exclusion; descriptor
docs) + 08d8861 (workspace: D3-token-map amendments, changelog + plan-22 correction, FOLLOWUPS
#42 double-slider-label / #43 generalize print-anchor guard, next-id -> 44, dse-verify numbers).
Battery verbatim: jest 2135/150 · shots 169 · freeze 101/101 · parity 0/10/exit0 ·
obsidian-shots 132/132. SC-112 comment d8c655ca posted w/ 4 inline images (stepper pair
byte-identical by cmp = the honest story); In Progress + Needs Review set. Review dispatched.
(Session-limit kill mid-task; resumed from transcript, on-disk state verified first.)
Task 9: review spec ✅ all 6 / quality APPROVED (0 findings, 2 non-blocking observations:
shots/obsidian-shots counts on report faith; dense-but-accurate SC-105 correction paragraph).
Changelog honesty clean (no overcorrection); every number re-verified live; Linear comment +
Needs Review verified via MCP.
Task 9: complete (dse c9a9d90..4d95a0b + workspace 08d8861, review clean)
ALL 9 TASKS COMPLETE. Final whole-branch review dispatched (dse edc69b4..4d95a0b + workspace
branch). Deferred-minors for triage: T6 sanitizer edges x2 (comma-in-quoted-name mangling,
U+2028 inert), T7 x3 (guard vacuous on scale rules -> FOLLOWUPS #43; bare-compound zoom-reset
anchor; brittle substring predicate), T8 x3 (double label -> FOLLOWUPS #42; session-wide
installed-fonts retire; Custom.../keystroke cosmetics). Landing = Scott's call on SC-112.
FINAL WHOLE-BRANCH REVIEW: MERGEABLE AFTER ONE FIX. 0C/1I/2 new obs. Battery independently
reproduced in full (incl. obsidian-shots 132/132). E2E walk clean; rebase allowlist principled;
all 8 deferred minors acceptable-deferred. I1: Legacy chained pickers (Controls/Card-body/
Label) silently no-op unless parent slot also set — fontCss tails var(--dse-font-body|title)
hit the IACVT-dead :root set; one invalid var() kills the inline override (Chromium repro).
Contradicts Legacy-SHIP claims; fix = nested var() fallback tails. Obs: modal text-scale
asymmetry (-> FOLLOWUPS #44); demo-vault appearance.json dirt (revert at fix round).
FINAL FIX ROUND dispatched (resume T6 implementer): fallback tails + string-level teeth test +
hygiene + FOLLOWUPS #44.
FINAL FIX ROUND: plugin 809b9e8 (nested var() fallback tails for controls/card-body/label +
string-level teeth tests) + workspace fee77dd (FOLLOWUPS #44, next-id 45). Chromium re-probe:
old tail = pick DROPPED (Arial), new tail = pick APPLIED (Georgia, Arial); Legacy root
--dse-font-body confirmed IACVT-dead. Scoped re-review CLEAN: teeth independently reproduced
(2 red on regress, 35/35 restore), jest 2138/150, freeze 101/101, FOLLOWUPS #44 actionable,
no new problems. demo-vault appearance.json was already clean.
PLAN 23 COMPLETE AND MERGEABLE. dse font-settings @ 809b9e8, workspace @ fee77dd. NOT LANDED —
awaiting Scott's SC-112 review (Needs Review set, evidence comment d8c655ca). Landing via
land-stack on his approval.
