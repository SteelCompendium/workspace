# SC-126 — decisions ledger (effort `sc126-parity-bg`)

Ticket: SC-126 "Parity guard: compare background-color (polarity check first)".
Worktree: `/home/scott/code/steelCompendium/worktrees/sc126-parity-bg` (every submodule on branch `sc126-parity-bg`).
Owner: Fable ticket-owner, session 7694ddcf-550f-41a1-b639-c563d81974ca (dispatcher id). Scott is asleep 2026-09-13/14 — work is autonomous; genuine Scott decisions go on the ticket as self-contained asks.

## Current state at effort start (2026-09-13)

- **Step 1 (`bg-polarity` rule) LANDED 2026-08-26** — dse `origin/develop` `1cef8ec`. Nothing to redo there.
- **Step 2 = this effort:** full `background-color` comparison in `visual-harness/parity/compare.cjs`.
- Base: dse `origin/develop` = `e12c6bd` (worktree submodule already at it, 0 behind). Workspace superproject `728f514`.
- Gate baselines at dispatch: freeze `260/260` on `e12c6bd` (dse-verify SKILL.md, 2026-09-14 SC-202 entry); parity `0 GAP / 0 undeclared / 16 DECLARED / exit 0` (last recorded 2026-08-26 — VERIFY on e12c6bd before trusting); jest last recorded **3257 passed / 1 skipped / 185 suites**, shots 474 PNGs 0 FAIL (dse-verify, at `16e25ff`) — VERIFY on e12c6bd.
- Concurrent: SC-299 owner is working in draw-steel-elements; expect a rebase onto origin/develop before landing.

## Scott rulings (verbatim, dated)

- **2026-08-08 (ticket description, step 2):** "**Full** `background-color` **comparison** as a follow-on — expect a burst of rows needing triage on first run (the B4/`--dse-chip-bg` discipline: verify each against the site before adopting or declaring)."
- **2026-08-08 (ticket description, step 3):** "No site re-capture needed — the data is already in the committed baseline."
- **2026-08-26 (landing comment, step 1):** "Step 2 (full `background-color` comparison) stays open on this ticket, with the finding from step 1 recorded: it needs a tolerance model, because 3 of the 16 pairs carry per-scheme alpha variation the site itself uses by design."
- Standing (selector-map.json `declaredDeferralsNote`): material rules `bg`, `bg-polarity`, `shadow`, `hairline-*` are NON-DECLARABLE. Whether the new full-comparison rule is declarable is an open design point (the ticket's own wording "adopting or declaring" implies declarable).

## Owner decisions

- **2026-09-13 D1:** Round 1 is a bounded survey+design round (reviewer tier), NOT implementation: dump the real bg-color distribution both sides/both schemes, propose the tolerance model + rule design, list exactly which rows would fire and adopt-vs-declare for each. Implementation waits on the design.
- ~~**2026-09-13 D2 (default, Scott may veto):** `bg` and `bg-polarity` stay non-declarable. The new value rule is proposed declarable (per the ticket's "adopting or declaring"), so the polarity floor can never be silenced but a by-design alpha residual can be declared with a cited reason.~~ superseded by D3.
- **2026-09-13 D3 (after r1 survey):** New rule `bg-color`, class **material / NON-declarable**, same as `bg` and `bg-polarity`. Grounds (r1 survey §C.2): all 32 real rows are byte-identical so nothing needs declaring; a declaration would match nothing and `diff.mjs` would fail the run as DEAD; every value in play is a `styles-source.css` token, i.e. always CSS-closable (the README's own test for material). Model: premultiplied deposit + alpha, `BG_ALPHA_TOL = 0.01`, `BG_DEPOSIT_TOL = 2`, either axis fires, unparseable → WARN. `owns` gets `bg-color` on exactly `section-head`, `pr-head`, `featureblock`. Scott is told in the status comment that this reverses the ticket's "adopting or declaring" wording and can veto; promotion to declarable later is a one-line `NON_DECLARABLE_CLASSES` change.
- **2026-09-13 correction of fact (not a ruling change):** Scott's 2026-08-26 "3 of the 16 pairs carry per-scheme alpha variation" does not reproduce — the data shows **2** pairs (`card`, `section`) and 4 distinct computed alphas (`.16`/`.18` dark, `.02`/`.024` light). Every mapped pair compares one rung against the same rung, so no tolerance is load-bearing today.
- **2026-09-13 D4 (deferred findings):** r1 §D.4 `card` pair site-selector capture-order hazard → Backlog ticket (needs a site re-capture, out of scope). r1 §A.3 `background-image` band hue/tint residual → Backlog ticket unless one already exists (step 2 does not close it). Neither is folded into r2. **Filed 2026-09-14: SC-321** (`card` selector hazard); **SC-322** (band hue/tint residual).

## Rounds

Base moved 2026-09-17: dse `origin/develop` `e12c6bd` → `96e2238` (SC-196). Shots baseline is now 524 (SC-196 added shots; freeze still 260 — additions only, not frozen classes).

| Round | Worker | Brief | Report |
|---|---|---|---|
| r1 survey+design | orchestration:reviewer (id a5cc0f8) | sc126-r1-brief.md | sc126-r1-survey.md — DONE 2026-09-13: 32/32 rows identical, 0 adopt / 0 declare, live hole on `section` wash |
| r2 implement | orchestration:implementer (id a9faa9c, DIED 429 with edits uncommitted) | sc126-r2-brief.md | — |
| r2b resume | orchestration:implementer (fresh, id a89f34e) | sc126-r2b-brief.md (+ r2 brief) | sc126-r2-report.md — DONE 2026-09-17: dse `32670a7` (rebased onto `origin/develop` `96e2238`, SC-196 landed), superproject `d5a0adf` (SKILL.md); jest 3879/1sk/202, shots 524, freeze 260/260, parity 0/0/16 exit 0, frozen bytes moved 0; live-hole proof 2 GAPs→0; can-fail proof 2 failed with tolerance widened |
| r3 review | orchestration:reviewer (fresh identity — NOT a5cc0f8, which authored the design) | sc126-r3-brief.md | sc126-r3-review.md |

## Interruption record (2026-09-17)

- The r2 implementer (id a9faa9c) was killed by an API session-limit 429 on 2026-09-13 22:48 after finishing every after-edit gate except the post-shots freeze check; it had committed NOTHING. Uncommitted at the time of death: dse `CHANGELOG.md`, `test/unit/parity/compare.test.ts`, `visual-harness/parity/{README.md,compare.cjs,selector-map.json}`; superproject `.claude/skills/dse-verify/SKILL.md`. `styles-source.css` clean (the live-hole deletion was reverted). Logs it left: `sc126-r2-*-20260913-*.log` (tsc/lint EXIT=0; jest baseline 3836 passed/201 suites → after 3845 (+9); parity baseline 0/0/16, live-hole `2 gap(s)` exit 1 on `section` dark+light `bg-color`, restored 0/0/16; shots after EXIT=0, 0 FAIL; freeze BASELINE 260/260 — freeze AFTER not run).
- **Jest baseline correction:** dse-verify's recorded 3257/185 is stale; measured on `e12c6bd` from the worktree = **3836 passed / 1 skipped / 201 suites (2 projects)**. Expected after r2 = **3845 / 1 skipped / 201 suites**.
- r2b (resume, fresh implementer): verify the uncommitted diff against `sc126-r2-brief.md` items 1–7, run the after-edit freeze check, commit dse + superproject SKILL.md, write the report. Brief addendum: `sc126-r2b-brief.md`.

## r3 review rulings (2026-09-17, D5)

r3 verdict LAND, 0 CRITICAL / 1 HIGH / 1 MEDIUM / 3 LOW / 3 INFO (`sc126-r3-review.md`). Rulings:
- **HIGH-1 (`excludes` has no non-declarable gate — pre-existing, proven at runtime to silence `bg-color`): FOLD into r4.** It falsifies the "never declarable / un-silenceable" claim that D3, the README and the CHANGELOG bullet rest on; 3 lines + 1 test, zero shipped `excludes` entries, same file.
- **MEDIUM-1 (stale step-1 comments in compare.cjs): FOLD.** **LOW-1 (GAP row prints a false comparison for the silent axis; `toFixed(1)` can print `Δ2.0 > 2`): FOLD.** **LOW-2 (SKILL.md dates): FOLD.**
- **LOW-3 (a `bg-color` WARN is undeclarable; a future `color-mix()`/`color(srgb)` background-color would make parity red with no escape path): DROP.** Reason: the WARN is a parser tripwire; the right response when it fires is to teach `ink()` the new syntax, not to declare it away, and reviewer confirmed no such value can reach it today (all 166 site + 56 plugin inventory values are `rgba()`). A declarable material WARN would be a second mute button of exactly the kind HIGH-1 is closing.
- **INFO-3 (shared main checkout `workspace/draw-steel-elements` pre-existing dirty: `demo-vault/Welcome.md`, `compendium-manifest.json`, mtime 2026-09-14): NOT this effort's** — report to the dispatcher at land-ready; `wt-finish`/`deploy*` will hard-abort on it.
- r4 fixer = r2b implementer (author, id a89f34e). r5 scoped re-review = r3 reviewer (id a3fef33; did not author the fix).

| r4 fix | orchestration:implementer (a89f34e resumed) | sc126-r4-brief.md | sc126-r4-report.md |
| r5 scoped re-review | orchestration:reviewer (a3fef33 resumed) | inline | sc126-r5-rereview.md |

## r4 result + rulings (2026-09-17, D6)

- r4 DONE: dse `b5dd4c8` on `32670a7` (base `96e2238`); superproject `58d9949` (SKILL.md LOW-2). HIGH-1 probe now fails at validation (`… is class "material" and can NEVER be excluded …`, exit 1). tsc/lint clean; jest **3887 passed / 1 skipped / 202 suites** (+8); parity 0/0/16 exit 0; shots/freeze not re-run (no CSS/fixture change — r2b/r3 numbers 524 / 260/260 stand). Frozen bytes moved 0.
- Follow-up "apply per-axis-verdict message shape to rule 7 (`ink`)": **DROP** — cosmetic uniformity nit, not a ticket.
- Follow-up "HIGH-1 merits its own Backlog ticket?": **DROP** — it is fixed on this branch for every material rule; nothing remains to track.
- Drive-by (README heading now says "step 2 this branch, unlanded"): accepted, but r5 must check that landing-status wording in README/SKILL.md/CHANGELOG stays true AFTER landing (prefer dateless wording); fold any such fix into a one-line r6 if r5 flags it.
- r5 = scoped re-review of the delta `32670a7..b5dd4c8` (+ superproject `d5a0adf..58d9949`) by the r3 reviewer (a3fef33), not a fresh full pass.

## r5 result + rulings (2026-09-17, D7)

- r5 (scoped re-review by a3fef33): **LAND**; HIGH-1/MEDIUM-1/LOW-1/LOW-2 all CLOSED by re-running the r3 probes against `b5dd4c8`; 7 new HIGH-1 tests + 3 LOW-1 tests can-fail proven; gates tsc/lint clean, jest 3887/1sk/202, parity 0/0/16. New: 0 CRIT / 0 HIGH / 3 MEDIUM / 1 LOW / 2 INFO, all doc-text (`sc126-r5-rereview.md`).
- **MEDIUM-R5-1 (README heading "step 2 this branch, unlanded" goes false at landing): FOLD** → status-less wording.
- **MEDIUM-R5-2 (SKILL.md "this branch … unlanded as of this writing" in current-state prose): FOLD** → `(SC-126 steps 1 and 2)`, no sha, no landing status.
- **MEDIUM-R5-3 (SKILL.md battery paragraph still says jest 3879 / +9): FOLD** → 3887, +17 this ticket, record `b5dd4c8`.
- **LOW-R5-1 (rule 7 `ink` prints the same false-comparison shape, LIVE on every green run's declared rows): FOLD** — reverses the D6 "drop" now that it is shown to be a live false statement in the report Scott reads, not a uniformity nit; 6-line fix in the same file; update any test asserting rule-7 text.
- r6 = implementer a89f34e (doc + 6-line message fix). r7 = scoped re-check of the r6 delta by a3fef33.
| r6 fix | orchestration:implementer (a89f34e resumed) | sc126-r6-brief.md | sc126-r6-report.md |
| r7 scoped re-check | orchestration:reviewer (a3fef33 resumed) | inline | sc126-r7-recheck.md |

## r6 result (2026-09-18)

- r6 DONE: dse `ebaedce` (on `b5dd4c8`, base `96e2238`); superproject `e69a706`. All four r5 findings applied per D7 wording; sweep found no other branch-relative claims. tsc/lint clean; jest **3889 passed / 1 skipped / 202 suites** (+2 ink message tests this round; rebased base = 3870 = r2b's 3879 − 9; ticket adds 9 + 8 + 2 = 19 → 3889); parity 0/0/16 exit 0; ink row now `(max channel 77 > 2 FIRES; alpha 0.000 ≤ 0.03)`. Frozen bytes moved 0. r7 = scoped re-check by a3fef33.

## Interruption record 2 (2026-09-18)

- r7 reviewer (a3fef33) killed by API session-limit 429 mid-round; left tsc/lint + two ink-msg probe logs, no report. Worktree verified clean (dse `ebaedce`, superproject `e69a706` + pointer bump only). Resumed via SendMessage with the surviving log list; if "No transcript found", dispatch a fresh reviewer with the r7 scope (delta `b5dd4c8..ebaedce` + `58d9949..e69a706` SKILL.md).

## r7 result + rulings (2026-09-18, D8)

- r7 (a3fef33, resumed after 429): **LAND**; all four r5 findings closed by probe; gates tsc/lint clean, jest 3889/1sk/202, parity 0/0/16; no CSS/fixture/baseline in the delta. New: 2 LOW / 2 INFO (`sc126-r7-recheck.md`).
- **LOW-R7-1 (compare.cjs:125-126 and SKILL.md:757-759 still quote the pre-r6 README heading "… is now fully compared"): FOLD** — two string requotes.
- **LOW-R7-2 (compare.cjs:559 `dRgb.toFixed(0)` lets the ink row print `max channel 2 > 2 FIRES`): FOLD** — same class r4 fixed for `bg-color`; `toFixed(3)` + 4 test literals; changes only the text of the 16 declared rows in parity-report.md, no gate number.
- INFO-R7-1 (SKILL.md:136 header date) — bump to 2026-09-18 in r8 since r8 edits that file anyway. INFO-R7-2 — no action.
- r8 = implementer a89f34e; r9 = reviewer a3fef33 confirms the delta (last round).

## r8 result (2026-09-18)

- r8 DONE: dse `5a5ed49` (on `ebaedce`); superproject `4cdb43f`. LOW-R7-1/R7-2/INFO-R7-1 applied; "is now fully compared" = 0 hits. tsc/lint clean; jest 3889/1sk/202 (unchanged); parity 0/0/16; ink row `(max channel 77.000 > 2 FIRES; alpha 0.000 ≤ 0.03)`. Frozen bytes moved 0. r9 = reviewer confirms delta `ebaedce..5a5ed49`.
| r8 fold | orchestration:implementer (a89f34e) | sc126-r8-brief.md | sc126-r8-report.md |
| r9 confirm | orchestration:reviewer (a3fef33) | inline | sc126-r9-confirm.md |

## LAND-READY (2026-09-18)

- r9 (a3fef33): **LAND**, 0 findings (1 INFO no-action). Whole-branch sanity: dse `96e2238..5a5ed49` touches only CHANGELOG.md, compare.test.ts, README.md, compare.cjs, selector-map.json (+467/−61); superproject `728f514..4cdb43f` = SKILL.md only. No CSS/fixture/baseline anywhere in the branch.
- Final: dse `sc126-parity-bg` @ **`5a5ed49`** (base `origin/develop` `96e2238`); superproject worktree branch `sc126-parity-bg` @ **`4cdb43f`** (pointer bump uncommitted, for wt-finish). Gates: tsc/lint clean; jest 3889 passed / 1 skipped / 202 suites; shots 524 / 0 FAIL; freeze 260/260; parity 0 GAP / 0 undeclared / 16 DECLARED exit 0. **No freeze rebaseline lines.** No Scott sanction needed.
- Landing blocker for the dispatcher (INFO-3/r9 reminder): shared main checkout `workspace/draw-steel-elements` is dirty (`demo-vault/Welcome.md` modified, `compendium-manifest.json` untracked, mtime 2026-09-14, not this effort's) — `wt-finish`/`deploy*` hard-abort until cleared.
- Scott ask on the ticket (non-blocking, veto-style): `bg-color` is non-declarable (D3) vs the ticket's "adopting or declaring" wording.
