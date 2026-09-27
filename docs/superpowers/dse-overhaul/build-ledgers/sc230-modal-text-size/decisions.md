# SC-230 decisions ledger — text-size scale doesn't reach modal content

Worktree: /home/scott/code/steelCompendium/worktrees/sc230-modal-text-size (branch `sc230-modal-text-size`
in every submodule). Repo touched: draw-steel-elements (tracked branch `develop`).
Base: origin/develop f6fb208 (2026-09-24).

## Ticket text (the spec — no Scott comments on the ticket as of 2026-09-24)

> Of the two Task 7 scale prefs, card zoom applies inside DSE modals (the `.dse-modal` root is a
> Steel token-scope member and gets css-bearing prefs stamped via `reflectCss()` in
> `DseModal.open()`), but the text-size scale does not reach modal content — an asymmetry: the
> same modal honors one scale pref and ignores the other.
> ...likely the text-scale consumer selectors don't include the `.dse-modal` scope the card-zoom
> rules do. Decide whether modals SHOULD track text size (probably yes, for consistency) and
> widen the consumer scope accordingly; mind FOLLOWUPS #43's print-anchor shape concerns when
> touching those rules.

## Scott rulings (verbatim, dated)

- 2026-09-25 (Scott, SC-230 comment, answering the before/after + title A/B ask): "option A is good."
  -> title scales (option A, as shipped in 0dbab59); visual approved. No further Scott ask open.

## Owner rulings

- 2026-09-24 (owner): proceed on the ticket's "probably yes" — modals track the text-size scale
  exactly as rendered blocks in notes do. Final confirmation goes to Scott in the Needs Review
  ask with before/after images (visual change).
- 2026-09-24 (owner): SC-229 (generalized print-anchor shape guard) is OUT OF SCOPE. Any new or
  widened scale-consumer arm must still use the anchored idiom (exclusion compounded onto the
  stamped node, e.g. `:is([data-dse-element], .dse-modal)`), and get an exact-selector pin test.
- 2026-09-24 (owner): the freeze baseline (print only) must NOT move — default text scale is
  100% and print is excluded from scale prefs. Expected `freeze OK (260/260 …)`.

## Gate baselines at f6fb208 (from SC-240 fix2 ledger)

tsc clean; lint clean; jest 3937 passed / 1 skipped / 202 of 203 suites; shots 524 PNGs 0 FAIL;
freeze 260/260 exit 0; parity 0 GAPs / 0 undeclared / 16 DECLARED exit 0.

## Rounds

- r1 impl (orchestration:implementer, identity IMPL-1) dispatched 2026-09-24 — brief sc230-brief-r1-impl.md, report sc230-r1-impl-report.md
- 2026-09-24: r1 impl killed by HTTP 429 session limit before any edits; resumed via SendMessage.
- 2026-09-24: origin/develop moved to 3b25127 (SC-343 + SC-288 landed); implementer told to rebase and re-measure the jest base. Freeze stays 260.
- r1 DONE: IMPL-1 f2539d2 on 3b25127 (3 commits). Root cause: consumer rule lacked .dse-modal (styles-source.css:7672) + Obsidian app.css resets .modal-content font-size; fix re-applies multiplier at .dse-modal__body/__footer, title left unscaled. Gates: jest 3975/1/204 of 205; shots 524; freeze 260/260; parity 0/0/16.
- r2 review (orchestration:reviewer, identity REV-1) dispatched — brief sc230-brief-r2-review.md
- 2026-09-24 owner eyeball of r1 evidence: bug confirmed (before-140 crop byte-identical to after-100 crop); after-140 modal body visibly scaled, title 'CONDITIONS' unscaled by design. Evidence page lacks Obsidian modal chrome (title renders beside body) — Scott-facing evidence should come from real Obsidian (obsidian-shots / spawned Obsidian). Open taste question for Scott: should the modal TITLE scale too?
- 2026-09-24: origin/develop -> c524fd2 (SC-328: JSZip->fflate, 6.0.2 hotfix forward, 3 new skills). Freeze baseline: 16 Skills print lines replaced, count 260. Branch on 3b25127 will show those 16 as mismatches until rebased. Reviewer told. Next round must rebase onto c524fd2+ and npm ci if package.json changed.
- r2 review DONE (REV-1): APPROVE_WITH_FIXES, 0C/0H/2M/3L/5I. Report sc230-r2-review-report.md. Real Obsidian 1.14.2: base modal body 15px, head 21px at 140% (x1.4 = note ratio). Freeze vs new baseline: exactly the 16 SC-328 Skills lines, nothing else.

## Owner rulings on r2 findings (2026-09-24)
- MEDIUM-1 + MEDIUM-2: FOLD into r3 fix round, using the reviewer's prescribed selector shape.
- LOW-1 (title unscaled -> 15px uppercase title over 21px body at 140% in Obsidian 1.14.2, inverted hierarchy): owner default = SCALE THE TITLE too (consistent with "exactly as notes do"; note headings scale). 100% must stay identical to base. Scott confirms from a side-by-side (title scaled vs unscaled) in the Needs Review ask.
- LOW-2 (r1 evidence harness-only, overclaims): FOLD — r3 produces real-Obsidian captures for the Scott ask.
- LOW-3 (no CHANGELOG entry; help text src/prefs/catalog.ts:292 and docs/settings.md:41-42 don't mention dialogs): FOLD.
- INFO-1..5: no action (INFO-2 SuggestModal = Obsidian chrome, exempt; INFO-3 removed by MEDIUM-1 fix; INFO-5 is the known main-checkout dirt).
- r3 = fix round by IMPL-1 (resume); r4 = scoped re-review of the delta by REV-1 (author-independent).
- r3 fix round dispatched to IMPL-1 (resume) — brief sc230-brief-r3-fix.md
- 2026-09-24: IMPL-1 killed by 429 mid-evidence (head 0dbab59 on c524fd2, tree clean, gate logs present). Resumed.
- r3 DONE: IMPL-1 head 0dbab59 on c524fd2. All 5 findings fixed. Title via new .dse-modal__title-text span in setDseTitle(). Real Obsidian 1.14.2: head body+title 15->21px at 140%; x1.4 with .modal-content reset neutralized; head-100 byte-identical to base-100. Gates: jest 3990/1/205 of 206 (base 3983, +7); shots 524 0 FAIL; freeze 260/260; parity 0/0/16.
- r4 scoped re-review dispatched to REV-1 (resume) — brief sc230-brief-r4-rereview.md
- 2026-09-24 ~12:16: REV-1 (r4) killed by network outage after shots; resumed 16:40. develop still c524fd2, head 0dbab59 clean.
- r4 DONE (REV-1): APPROVE_WITH_FIXES — code approved as-is; 0C/0H/0M/1L/5I. Gates on 0dbab59: jest 3990/1/205 of 206; shots 524 0 FAIL + "modal text-scale anchoring OK"; freeze 260/260; parity 0/0/16. Runtime gate + pins proven non-vacuous.

## Owner rulings on r4 findings (2026-09-24)
- LOW-1 (focus ring differs between 100% and 140% evidence shots): DROP — the Scott ask only pairs 140% shots (base-140, head-140, head-140-title-unscaled all carry the same ring); the 100% claim rests on head-100 vs base-100 byte-identity, which both lack the ring.
- INFO-3 (help text "every dialog" vs compendium search suggest box): DROP — suggest box is Obsidian chrome (INFO-2 ruling); wording is accurate for DSE's own dialogs.
- INFO-5 (DSE dialog accessibility role is `generic`, pre-existing): FILE Backlog ticket linking SC-230.
- INFO-1/2/4: DROP (by-construction coverage; matches file convention; letter-spacing delta invisible).
- Code is land-ready pending Scott's visual/title confirmation (visual change → Needs Review per session rules).
- 2026-09-24 20:43: Needs Review ask posted (before/after 140% + title option A vs B composites); SC-230 -> In Progress + Needs Review. SC-355 filed (a11y role). Parked awaiting Scott: (1) visual OK? (2) title scales (A, shipped) or stays small (B)? If B: revert only the title arm/span commit portion (0dbab59 LOW-1 part).
- 2026-09-27: resumed on Scott's handback. develop now 619c4bd (SC-282, SC-340 view adoption; SC-243 landing on top). Owner now runs Opus 5.5 (--model opus-5.5). obsidian-lifecycle gate now 19 scenarios; freeze 260. Next: rebase + full battery (r5).
- r5 rebase+battery dispatched to IMPL-1 (resume) — brief sc230-brief-r5-rebase.md; develop tip e9bc15e (SC-243 landed). Overlap: CHANGELOG.md, test/dom/kit/managedModal.test.ts.
- r5 DONE: IMPL-1 head 1adfe29 on e9bc15e, clean rebase, range-diff all '=' (owner-verified), FF-OK. Gates: tsc/lint clean; jest 4070/1/210 of 211 (+7); lifecycle 19/19; shots 524 0 FAIL + anchoring OK; freeze 260/260; parity 0/0/16. No Scott ask open -> LAND-READY.
