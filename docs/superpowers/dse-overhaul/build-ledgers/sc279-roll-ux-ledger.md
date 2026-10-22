# SC-279 — Roll UI/UX cleanup — decisions ledger

Ticket: SC-279 "Roll UIUX for rolling in obsidian needs cleanup" (project DSE 7.0.0; labels Bug, DSE Plugin).
Related: SC-402 (standalone ds-roll block deferred from 7.0.0, hidden behind `experimental`; it will
"carry over whatever SC-279's roll UI/UX cleanup settles on").
Release audit (`draw-steel-elements/docs/superpowers/dse-7.0.0-release-audit.md`):
- line 207: `rollingEnabled` pref (default OFF) → roller on ability cards (roll bar, result card, history) — **Ship** in 7.0.0. "SC-279 (roll UI/UX cleanup, Todo in the 7.0.0 project) lands first".
- line 93: walkthrough "With rolling ON: click-to-roll, roll bar, result card, edges/banes, crit; native and Dice Roller engines (SC-279 cleanup lands first)".
=> SC-279 is a 7.0.0 release blocker; the shared `src/framework/kit/rollBar.ts` is used by BOTH ability cards (ships) and ds-roll (deferred).

Worktree: `/home/scott/code/steelCompendium/worktrees/sc279-roll-ux` (every submodule on branch `sc279-roll-ux`).
DSE base at creation: `f8693b5` (= origin/develop, 2026-10-16).

## Scott's rulings (verbatim, dated)

### 2026-10-16 (ticket description — the original ask)
> An entire of of content is added to `ds-roll` and barely has any information or context on what the input fields are for and what they do
>
> [screenshot: a single horizontal roll bar, 1313x120]
>
> I dont oppose this UI, but it needs to be more informative.  By default, I dont think many Directors will need the roll capability just because players are usually rolling these kinds of things, but maybe a player adds the `ds-roll` element or there is some reason the Director wants it - so Ill allow this.  That said, it should be minimal.  Maybe its just an icon by default that expands into the full UI
>
> The UI for making a roll in obsidian needs to be labeled better.  there are 6 value-change buttons, a toggle, an input field, a submit button, and a reset button and only the "Roll" submit button is clear in its functionality. Yes, there are tooltips, but its not very user friendly

(No comments on the thread as of 2026-10-16.)

## Owner decisions
- 2026-10-16: Plan = survey (reviewer) → implement (implementer) → independent review → Scott taste check on screenshots (collapsed + expanded, ability card + ds-roll) in ONE consolidated ask → land-ready.

## Deferred findings / follow-ups
(none yet)

## Worker roster (author-independence)
- r1 survey/design spec: reviewer a72c07e8aa66163d2 (Opus) — brief `sc279-brief-r1-survey.md`, report `sc279-r1-survey.md`. Not code author; may review later implementation.

## Concurrency notes
- A `sc406-gating` worktree exists (experimental gating work) — possible overlap with ds-roll's experimental gating; check rebase at landing.

## Owner decisions after r1 survey (2026-10-16)
- ADOPT the r1 recommended spec (`sc279-r1-survey.md` §4.1–4.7) as the implementation spec.
- Q1 (ds-roll collapsed = labeled one-liner `[Roll] [▸ Modifiers · summary]` vs icon-only): build the labeled one-liner — icon-only relies on tooltips, which Scott's ruling rejects ("Yes, there are tooltips, but its not very user friendly"). Show Scott; icon-only is a small delta if he prefers his "maybe just an icon".
- Q2 (card first click rolls at once vs only reveals modifiers): keep today's behavior (rolls at once, reveals strip collapsed). Ask Scott.
- Q3 (DESIGN.md rule 9 carve-out for the roller's click-disclosure): implement the carve-out in the worktree's DESIGN.md; ask Scott to confirm.
- §4.5 print: hide the whole `.dse-rollbar` in print (both surfaces). Do NOT fold modifiers into the printed caption (ds-roll is deferred; keep scope tight).
- §4.1 F2 flat mode: include (omit Edges/Banes/net in flat mode; keep Skill only if engine intends flat +2).
- §4.8 drop Reroll: DROPPED — not in the ticket; Reroll next to the result is a reasonable affordance and the change churns feature-roll/heroSheet tests.
- Freeze: predicted 2 lines move (`roll--steel-print.png`, `roll--steel-realprint.png`) → implementer ships `sc279-rebaseline.txt` + before/after crops; sanction ask goes to Scott in the same consolidated ask.
- r2 implementation: implementer a5e403ca695e56195 (Sonnet) — brief `sc279-brief-r2-implement.md`, report `sc279-r2-implement.md`. CODE AUTHOR — must not review.
- r3 review: planned = resume r1 reviewer a72c07e8aa66163d2 (not a code author).
- r2 DONE_WITH_CONCERNS: DSE `24e5a1e`, super `218031b`. Concern: checked checkbox = teal fill only, no check glyph → owner leaning fold a glyph into fix round (colorblind); reviewer to confirm. Follow-ups: white band below card shots (reviewer to diagnose); ShotManifest type narrower than shape — DROP (harmless typing nit) unless reviewer flags; obsidian-shots not run — reviewer/at evidence time.
- Owner eyeball of r2 evidence a/b (2026-10-16): design reads right. Nits to FOLD into the fix round: (1) Reason stepper's −/+ buttons sit ~6px lower than the Edges/Banes buttons (editable input taller) — align the three steppers' button rows; (2) "Reset modifiers" button's left edge is indented ~20px vs the checkboxes/captions column — align to the same left edge.

## r3 review rulings (owner, 2026-10-16) — review `sc279-r3-review.md`, verdict FIX-REQUIRED (1 HIGH, 1 MED, 5 LOW, 4 INFO); battery reproduced exactly; rebaseline.txt verified byte-for-byte.
- HIGH-1 (statblock/featureblock abilities share `roll.lastInput.0`/`roll.history.0`/`roll.modsOpen.0` → wrong-roll bug): FOLD into fix round (per-feature session prefix in `renderFeatureList`, as hero sheet does).
- MEDIUM-1 (Reset by keyboard drops focus to body): FOLD (focus Modifiers header after Reset).
- LOW-1 (characteristic stepper buttons 3px low) + LOW-2 (Reset indent): FOLD (same as owner eyeball nits).
- LOW-3 (300px card: row wraps to 3 lines, label breaks inside "19–20"): FOLD.
- LOW-4 (ds-roll Main-action checkbox not restored after re-render, pre-existing): FOLD (small, same file).
- LOW-5 (DESIGN.md carve-out says header states every modifier; it states only non-defaults): FOLD (wording).
- INFO-1 checkbox tick: owner leaning REFUTED (8.0:1 dark / 4.2:1 light fill contrast + worded summary). Not in this effort. Goes to Scott as an optional taste question (a tick would be a plugin-wide Steel checkbox change → separate ticket if he wants it).
- INFO-2 harness blank below 2400 device px (also blanks frozen print twin): FILED SC-409 (Backlog, related to SC-279). OUT OF SCOPE for the fix round.
- INFO-3/4: no action.
- Fix round → resume implementer a5e403ca695e56195; scoped re-review of the delta → a FRESH reviewer (r1/r3 reviewer a72c07e8aa66163d2 may also do it since it did not author code; prefer resuming it for context).
- r4 fix DONE: DSE `12aad64` (base f8693b5), super `a2740db`. jest 4392/1/215 of 216 · lifecycle 25/25 · shots 580 0 FAIL · freeze same 2 lines, rebaseline.txt unchanged · parity 0/0/24. Follow-up "no harness shot for multi-run featureblock with rolling" → DROPPED (jest covers it with a revert-proven test; rolling is default-off).
- r5 scoped re-review → resume reviewer a72c07e8aa66163d2 (not a code author).
- 2026-10-16 dispatcher notice: DSE develop moved to `05a6ff3` (SC-406 landed: experimental switch, deferred-surface gating incl. `roll/definition.ts`, legacy sync command removed; freeze 274/274 unchanged). Overlapping files with our branch: CHANGELOG.md, styles-source.css, visual-harness/entry.ts. Plan: let r5 re-review finish on 12aad64, then r6 = implementer rebases onto origin/develop + full battery; r7 = reviewer range-diff check of the rebase (conflict resolutions, ds-roll still renders in harness under gating, roll shots/freeze lines).

## r5 re-review rulings (owner, 2026-10-16) — `sc279-r5-rereview.md`: APPROVE at DSE 12aad64 / super a2740db; battery reproduced; all 7 FOLD findings verified with revert-probes.
- LOW-1 (statblock villain-band branch untested; reviewer's scratch test shape in report): FOLD into r6 (test only).
- INFO-1 (rolled tier row = one coral `--dse-select` fill for every tier, 2.49:1 text contrast dark; pre-existing): FILED SC-410 (Backlog, related). OUT OF SCOPE for SC-279; mentioned to Scott so he can pull it into 7.0.0.
- INFO-2 (super a2740db does bump the submodule pointer f8693b5→12aad64): no action; landing (land-stack) handles the pointer — note for dispatcher.
- INFO-3 (DESIGN.md carve-out sentence is one long unwrapped line): FOLD into r6 (wrap it).
- r6 rebase DONE: DSE `ae0efd8` on origin/develop `05a6ff3` (one CHANGELOG conflict, both bullets kept); super `41d9a0f` (DESIGN.md wrap; not rebased). jest 4455/1/218 of 219 · lifecycle 25/25 · shots 580 0 FAIL · freeze same 2 lines, rebaseline.txt unchanged · parity 0/0/24. r5 LOW-1 test added (revert-proven), INFO-3 wrapped. New shots byte-identical to r4 → r4 evidence stands.
- r7 scoped rebase re-review → reviewer a72c07e8aa66163d2.
- 2026-10-16: posted consolidated ask to SC-279 (Q1 one-line row vs icon-only; Q2 card first click rolls vs only opens; Q3 DESIGN.md rule 9 carve-out; Q4 optional plugin-wide checkbox tick; A1 sanction of the 2-line print rebaseline `sc279-rebaseline.txt`), state In Progress + Needs Review. Awaiting Scott. r7 rebase re-review still running.

## r7 rulings (owner, 2026-10-16) — `sc279-r7-rebase-review.md`: APPROVE at DSE ae0efd8 / super 41d9a0f; battery reproduced; gating verified (experimental OFF: ds-roll inert, card roller works collapsed; ON: strip renders).
- INFO-1: superproject 41d9a0f pins DSE at pre-rebase 12aad64 → LANDING NOTE for dispatcher: land-stack/wt-finish must re-bump the pointer to the landed DSE sha.
- INFO-2: CHANGELOG [FIX] bullet describes ds-roll, which SC-406 gates off in 7.0.0 → FOLD into the post-Scott round: reword the bullet to the ability-card roller (ds-roll inherits it via SC-402).
## STATE: parked awaiting Scott's answers to Q1–Q4 + A1 (posted 2026-10-16). Next: append his ruling verbatim, then one implementer round (Scott's changes + INFO-2), scoped re-review, report land-ready (with A1 sanction status for the dispatcher to apply `sc279-rebaseline.txt`).
- 2026-10-16 dispatcher notice: DSE develop moved to `a337460` (SC-407: docs/README/CHANGELOG prune to 7.0.0 shipping scope, docs-shots guard). Freeze 274/274 unchanged; develop jest baseline now 4432. Next round (after Scott answers) MUST rebase onto origin/develop first; expect a CHANGELOG reconcile (combine with INFO-2 reword: SC-279 bullet describes the ability-card roller only, consistent with SC-407's 7.0.0-scope prune) and check SC-407's docs-shots guard against our `docs/Roll.md` / `docs/Media/roll.png` edits (ds-roll docs may have been pruned as deferred — follow SC-407's choice, do not resurrect them).
- 2026-10-18 dispatcher notice: DSE develop now `1a4c6d3` (SC-372 per-root `--dse-fs-*` declaration + text-scale prefs; also SC-390/SC-411/SC-423/SC-408 since a337460). Develop expected numbers: jest 4732 · lifecycle 25/25 · **e2e now a REQUIRED gate: 59/71 ok / 12 known-bug / 47 pairs** · shots 572 (new in-run lines "text scale OK", "text scale once OK") · freeze 276/276 · parity 24 declared. Next round: rebase onto origin/develop; branch expectation shots 572+12 = 584, 0 FAIL, text-scale lines OK (our strip uses `--dse-fs-caption` → must honor SC-372's per-root declaration and text scaling); freeze = exactly the 2 roll print lines — if their hashes differ from `sc279-rebaseline.txt` after rebase (SC-372 may move type), REGENERATE it (2 deterministic runs) and tell me; the A1 ask covers the 2 lines, not specific hashes.

## 2026-10-17 — Scott's answer to the consolidated ask (Q1–Q4 + A1), verbatim
Comment f4f19ba6 (2026-10-17T14:44Z), replying to the 2026-10-16 ask which said 'Reply "all recommended" if the defaults are fine.':
> approved

Label `Ready for Agent` set by Scott. Owner reading (2026-10-21, ticket-owner session resumed on Opus 5.5):
- Q1 → keep the one-line collapsed row (Roll + Modifiers + summary). No change.
- Q2 → keep: card's first dice click rolls immediately, strip shown collapsed. No change.
- Q3 → DESIGN.md rule 9 carve-out for the roller's click-to-open panel APPROVED. Keep as written.
- Q4 → optional and carried no recommendation; Scott did not ask for a tick → NO tick, no ticket filed. Owner will state this reading in the land-ready comment so he can overturn it.
- A1 → 2-line print rebaseline (`roll--steel-print.png`, `roll--steel-realprint.png`) SANCTIONED. Per the 2026-10-18 note: the sanction covers the 2 lines, not specific hashes — regenerate `sc279-rebaseline.txt` on the new base.
=> No design delta from Scott. This round = rebase + r7 INFO-2 CHANGELOG reword + SC-407 reconcile + regenerated rebaseline + full battery incl. e2e + scoped re-review.

## 2026-10-21 — resume round (owner: Opus 5.5 ticket-owner)
- Base: DSE origin/develop `bc4a0c5`. Develop numbers (dispatcher, 2026-10-21): jest 5457 passed / 1 skipped, 232 of 233 suites · lifecycle 30/30 · e2e 89/93 ok, 4 known-bug, 64/64 pairs · shots 580 · freeze 280/280 (widened by SC-362) · parity 0/0/24. New lifecycle scenario, if any, uses id G-S22. SC-349 (parked) may re-hash 40 print lines — none are roll.
- 2026-10-21: ticket flipped Awaiting, `Ready for Agent` removed (labels now DSE Plugin, Bug).
- Pre-flight facts: develop DELETED `docs/Roll.md` + `docs/Media/roll.png` (SC-407 `454ce58`) → drop our edits to both, do not resurrect. Develop CHANGELOG has `## 7.0.0 (unreleased; previously numbered 6.0.0)`. Superproject origin/main `9f37173`.
- Branch expectations: shots 580+12 = 592, 0 FAIL; freeze = exactly 2 roll print mismatches of 280; jest 5457 + our added tests; lifecycle 30/30; e2e 89/93, 4 known-bug, 64/64; parity 0/0/24.
- r8 rebase+battery: FRESH implementer (prior session's workers unreachable) — brief `sc279-brief-r8-rebase.md`, report `sc279-r8-rebase.md`. CODE AUTHOR of the rebase resolutions — must not review.
- r9 scoped re-review: planned = FRESH orchestration:reviewer (not r8 author).
- 2026-10-21 dispatcher notice: dse develop bc4a0c5 → `772c3cd` (SC-457: shared `fenceLanguage` rule in src/framework/host/blockPrefix.ts; lifecycle G-S14). New develop baselines: jest 5536 / 1 skipped / 233 of 234 · lifecycle 31/31 · e2e 89/93, 4 known-bug, 64/64 · shots 580 · freeze 280/280 · parity 0/0/24. Land-ready must be on 772c3cd (or newer), superproject rebased onto origin/main. → r8 implementer retargeted mid-run via SendMessage. Branch expectations now: jest 5536 + ours, 233 of 234 · lifecycle 31/31 · rest unchanged.
- 2026-10-21 dispatcher notice: dse develop 772c3cd → `8d075db` (SC-422: text-size knobs on chrome roots — search modal, settings preview, sidebar; entry.ts + shoot.mjs gain chrome-surface text-scale gates). Baselines: jest 5552 / 1 skipped / 234 of 235 · lifecycle 31/31 · e2e 89/93, 4 known-bug, 64/64 · shots 580 incl. `text scale OK (1626 …)` + `text scale once OK (104184 / 208 loads …)` · freeze 280/280 · parity 0/0/24. Land-ready must be on 8d075db or newer. → r8 retargeted again via SendMessage (supersedes 772c3cd retarget).
- 2026-10-21 ~19:05Z: owner + r8 implementer killed by session-limit 429 (reset 6:20pm ET). Owner snapshot 22:22Z: DSE head 8afe930 on 772c3cd, uncommitted visual-harness/shoot.mjs diff, no rebase in progress, no live process. r8 implementer RESUMED via SendMessage (same agent) → re-orient from disk, void pre-8d075db gate results, rebase onto 8d075db, full battery.
- 2026-10-21 dispatcher notice: dse develop 8d075db → `95981f1` (SC-432: stamina modal Spend Recovery disabled for creatures + no-pool hero confirmation; new e2e STAM tests). Baselines: jest 5582 / 1 skipped / 234 of 235 · lifecycle 31/31 · e2e 95/98 ok, 0 failed, 3 known-bug, 66/66 · shots 580 · freeze 280/280 · parity 0/0/24. Land-ready must be on 95981f1 or newer. → r8 retargeted; standing rule given: fetch + rebase onto latest origin/develop (min 95981f1) immediately before the battery, report the base, don't chase moves after the battery starts.
- 2026-10-21 dispatcher notice: dse develop 95981f1 → `8d890f9` (SC-366 follow-up: styles-source.css removes `.dse-ref-notice` left stripe + 3 jest tests; no shots moved). Baselines: jest 5585 / 1 skipped / 234 of 235; rest unchanged (lifecycle 31/31, e2e 95/98 3 known-bug 66/66, shots 580, freeze 280/280, parity 0/0/24). Land-ready on 8d890f9 or newer. → r8 told min base 8d890f9; if battery already started, abort and rerun whole battery on the latest base (numbers must come from one base).
- 2026-10-21 dispatcher notice: dse develop 8d890f9 → `54f8f88` (SC-483: src/authoring/FormModal.ts + its test only; block edit form Save omits untouched selects). Baselines: jest 5601 / 1 skipped / 234 of 235; rest unchanged. Land-ready on 54f8f88 or newer, superproject rebased onto origin/main ("the CHANGELOG moved"). → r8 told min base 54f8f88.
- 2026-10-22 ~00:42Z: second 429 kill (reset 11:20pm ET). Owner snapshot 03:22Z: DSE clean @ `f3a4476` on 54f8f88 (= origin/develop); new commit f3a4476 "fix(harness): text-scale-once gate loads interaction shots with their prefs/width and replays thenClicks" — touches SC-422's gate → r9 reviewer must scrutinize it as possible gate weakening. Superproject @ 91aa692 on fc3bd71, origin/main now 46ae296 → needs another rebase. r8 logs present: shots1, shots2, jest2, freeze1, e2e. r8 resumed via SendMessage.
- r8 DONE (2026-10-22): DSE `f3a4476` on develop `54f8f88`; super `c139a7d` on main `46ae296` (pointer bumped). Conflicts: CHANGELOG (ability-card wording + new per-ability [FIX] bullet), Roll.md deleted, Media/roll.png commit skipped, settings.md dead Roll.md link removed. Gates: tsc/lint clean · jest 5627/1/234 of 235 (+26) · lifecycle 31/31 · e2e 95/98 ok, 0 failed, 3 known-bug, 66/66 · shots 592 ×2, 0 FAIL, text scale OK (1626), once OK (107256/214 loads) · freeze exactly 2 roll print mismatches of 280 · parity 0/0/24. Rebaseline hashes UNCHANGED (byte-identical to pre-r8); substitution → 280/280. Evidence byte-identical to r4. New harness commit f3a4476 extends SC-422's once-gate to load prefs/width/thenClicks (+6 loads, +3072 comparisons).
- r8 follow-up rulings (owner): commit-message "Roll.md" mention in f9f896b → DROP (history only). G-S22 lifecycle idea (modifiers state/focus survive re-render in real Obsidian) → DROP: jest covers session restore after re-render (r4 LOW-4 test) and rolling is default-off; not worth a scenario. Land note: pointer re-bump at landing (land-stack).
- r9 scoped re-review → FRESH orchestration:reviewer, brief `sc279-brief-r9-rereview.md`.
- 2026-10-22 dispatcher notice: dse develop 54f8f88 → `ea56712` (SC-356: modal pass in shoot.mjs host-leak sweep, option-chip A30 restyle in styles-source.css, assertModalRegistry — a new plugin modal must be opened by the sweep or declared unreachable). Baselines: jest 5607 / 1 skipped / 234 of 235 · lifecycle 31/31 · e2e 95/98, 3 known-bug, 66/66 · shots 580 incl. `modal button host-leak OK (10 … 228 …)` · freeze 280/280 · parity 0/0/24. Land-ready on ea56712 or newer.
  → r9 reviewer PAUSED (interim report `sc279-r9-rereview-interim.md`); r8 implementer resumed for rebase onto ea56712 + full battery; then r9 resumed on the new sha. SC-279 adds no modal (inline strip) — implementer to confirm assertModalRegistry passes.
- r9 interim (paused, `sc279-r9-rereview-interim.md`): battery on f3a4476 reproduced r8 exactly; range-diff clean (7 patch-identical, docs commit rebuilt, roll.png commit dropped, f3a4476 new); f3a4476 reads as widening (only 4 feature-rolled* shots change). Findings + owner rulings:
  - MEDIUM-1 `docs/Features.md:168` → `docs/Media/feature-roll.gif` (SC-411, from `visual-harness/docs-manifest.mjs:551-564`) still shows the OLD unlabelled roll row: FOLD into r8b (regenerate via `npm run docs-shots -- --only=feature-roll.gif --check-stable --browser-only`, commit).
  - LOW-1 superproject `DESIGN.md:271` roll-strip row links deleted `docs/Roll.md`: FOLD (point at `docs/settings.md` Rolling section).
  - INFO CHANGELOG paraphrase: no action.
- r8b = resume r8 implementer: rebase onto latest develop (≥ ea56712) + MEDIUM-1 + LOW-1 + full battery. Then resume r9 reviewer on new shas.
- r8b DONE (2026-10-22): DSE `edb90d2` on develop `ea56712` (clean rebase); super `fd59a61` on main `e5f329a`. MEDIUM-1 GIF regenerated + committed (378371 B); LOW-1 DESIGN.md → docs/settings.md. Gates: tsc/lint clean · jest 5633/1/234 of 235 · lifecycle 31/31 · e2e 95/98, 0 failed, 3 known-bug, 66/66 · shots 592 ×2, 0 FAIL, modal host-leak OK (228), text scale OK (1626), once OK (107256 / 107259 — ±3 timing noise, 0 violations) · freeze exactly 2 roll print of 280 · parity 0/0/24. Rebaseline hashes unchanged.
- Owner eyeball of `sc279-r8b-evidence/feature-roll-frame.png`: new GIF frame shows the labelled strip (Roll button + "› Modifiers  Might 0") and the result card; no old stepper row. OK. (Tier-1 coral fill is SC-410, filed.)
- once-gate comparison count 107256 vs 107259 across identical trees → reviewer to judge whether it is develop's SC-422 gate nondeterminism (not ours) — drop unless reviewer says otherwise.
- r9 resumed on edb90d2 / fd59a61.
- 2026-10-22 dispatcher notice: dse develop ea56712 → `3973b56` (SC-482: shared src/elements/shared/undeclaredDefaults.ts in counter/project/montage/party/encounter/negotiation/stamina-bar model writes). Baselines: jest 5696 / 1 skipped / 238 of 239; rest unchanged (lifecycle 31/31, e2e 95/98 3 known-bug 66/66, shots 580, freeze 280/280, parity 0/0/24). Land-ready on 3973b56 or newer.
  Owner check: ZERO file overlap between ea56712..3973b56 and our ea56712..edb90d2 diff (SC-482 touches other elements' model.ts, prefOverrides, collapsedKey, obsidian-lifecycle.mjs). Plan: let r9 finish its review on edb90d2 (content review stays valid); then r8c = implementer rebases onto latest develop + full battery; then r9 scoped confirmation (range-diff identical + gate numbers). Expected on branch at 3973b56: jest 5696+26 = 5722 / 1 / 238 of 239.
- r9 FINAL (2026-10-22, `sc279-r9-rereview.md`): APPROVE at DSE edb90d2 / super fd59a61. Battery reproduced exactly; f3a4476 proven necessary (develop loader → FAIL sweep exception on our pages) and non-weakening (126/131 pages identical, the 5 differing are SC-279's own; with them skipped both loaders = 104361/209). Gating OFF/ON verified; strip absent in both print PNGs; substitution 280/280.
  - LOW-1 `visual-harness/shoot.mjs` ~7086/~7103: once-gate count drifts +3 per natural crit because our feature-rolled* pages roll real dice there (screenshot pass pins them) → FOLD into r8c (our commit introduced the nondeterminism). Prescribed fix verbatim: "pass `fixedDice: n.fixedDice` into the page entry, and after `loads += 1` pin `Math.random = () => 0.5`, as the screenshot pass already does."
  - INFO-1 bases moved (DSE → 3973b56, super main → da28109): r8c rebases.
  - INFO-2 CHANGELOG dash paraphrase: no action.
- r8c = resume implementer: LOW-1 fix + rebase onto latest develop (≥ 3973b56) + super onto origin/main + full battery (once-gate count must be identical across both shots runs). Then r9 scoped confirmation.
- 2026-10-22 dispatcher notice: dse develop 3973b56 → `424f47b` (SC-361: Conditions-modal swatch check mark + focus ring, styles-source.css block "F.", new e2e COND-E07). Baselines: jest 5703 / 1 skipped / 238 of 239 · lifecycle 31/31 · e2e 96/99 ok, 0 failed, 3 known-bug, 66/66 · shots 580, no ALLOWLISTED line · freeze 280/280 · parity 0/0/24. Land-ready on 424f47b or newer. → r8c told min base 424f47b (branch expect jest 5729).
- r8c DONE (2026-10-22): DSE `4636cc8` on develop `424f47b` (clean); super `29274c5` on main `89bd345`. LOW-1 fix = `a76fd1e` (rebased; fixedDice pin in once-gate). Gates: tsc/lint clean · jest 5729/1/238 of 239 · lifecycle 31/31 · e2e 96/99 ok, 0 failed, 3 known-bug, 66/66 · shots 592 ×2, 0 FAIL, no ALLOWLISTED, modal host-leak 228 OK, text scale 1626 OK, once OK 107256/214 IDENTICAL both runs · freeze exactly 2 roll print of 280 · parity 0/0/24. Rebaseline unchanged; substitution 280/280.
- r10 scoped confirmation → resume r9 reviewer (not author): range-diff edb90d2→head, review the dice-pin commit, one shots run + freeze.
- 2026-10-22 dispatcher notice: dse develop 424f47b → `e4c5cf6` (SC-433: Stamina modal temp field direct edit; the 3 known-bug e2e tests now pass). Baselines: jest 5711 / 1 skipped / 238 of 239 · lifecycle 31/31 · e2e 101/101 ok, 0 failed, 0 known-bug, 66/66 · shots 580 · freeze 280/280 · parity 0/0/24. Land-ready on e4c5cf6 or newer.
  Owner check: ZERO overlap (SC-433 touches only StaminaEditModal.ts, its test, stamina e2e spec). Plan: let r10 finish on 4636cc8; then r8d = implementer rebases onto latest + full battery (branch expect jest 5737, e2e 101/101 0 known-bug 66/66); owner verifies the r8d range-diff is patch-identical mechanically (no review needed for a conflict-free, zero-overlap rebase) and reports land-ready. Will ask dispatcher to land SC-279 promptly to end the rebase treadmill (8 develop moves this round).
- 2026-10-22 dispatcher AGREED: owner sends one line when r8d starts (naming the develop sha rebased onto); dispatcher then holds all other landings until SC-279 lands; SC-279 lands first on land-ready. Develop at agreement: e4c5cf6.
- r10 APPROVE (2026-10-22, `sc279-r9-rereview.md` ## r10): range-diff 10 patch-identical + dice-pin commit as prescribed; SC-361 lines intact; one shots run: 592/0 FAIL/0 ALLOWLISTED, once 107256/214 (deterministic), freeze exactly 2 roll print, hashes = rebaseline. No new findings.
- r8d = FINAL rebase onto develop `e4c5cf6` (pinned; dispatcher holds other landings) + super onto origin/main + full battery. Expected: jest 5737/1/238 of 239 · lifecycle 31/31 · e2e 101/101 ok, 0 failed, 0 known-bug, 66/66 · shots 592/0 FAIL, once 107256 · freeze 2 roll print of 280 · parity 0/0/24.
- 2026-10-22 ~05:38Z: third 429 kill mid-r8d. Snapshot 08:21Z: DSE clean @ `c0e761b` on e4c5cf6; super clean @ 8f1fa96. r8d logs done: range-diff, tsc, lint, jest1, lifecycle, e2e. r8d resumed to finish shots×2/freeze/substitution/jest2/parity. Hold still active.
- r8d DONE (2026-10-22): DSE `c0e761b` on develop `e4c5cf6`; super `42116f9` on main `acaa6f4`. Owner verified logs: range-diff 11/11 `=`; tsc/lint/jest1/jest2/lifecycle/e2e/shots1/shots2/parity all exit 0; jest 5737/1/238 of 239; lifecycle 31/31; e2e 101/101 0 known-bug 66/66; shots 592 ×2 0 FAIL, once 107256/214 both runs; freeze exactly roll--steel-print + realprint of 280; substitution 280 OK; parity 0/0/24. Rebaseline unchanged.
- 2026-10-22: land-ready comment posted to SC-279 (state stays Awaiting until landed). LAND-READY reported to dispatcher. Landing notes: apply `sc279-rebaseline.txt` (A1 sanctioned 2026-10-17, "approved") with dated backup + dse-verify record; superproject pointer must equal landed DSE sha; copy this ledger to build-ledgers/ before wt-rm.
## STATE: LAND-READY — owner stops here; dispatcher lands.
- 2026-10-22 dispatcher request: workspace CHANGELOG `## Unreleased` bullet for SC-279. Owner wrote the text (`sc279-workspace-changelog-bullet.md`); chore worker committed it: super `b6fde5b` (CHANGELOG.md only, +9) on 42116f9 / main acaa6f4. DSE untouched → no battery rerun. Land-ready super sha = b6fde5b.
- 2026-10-22 LANDED (dispatcher): dse develop c0e761b, workspace merge 6d89ada; rebaseline applied (backup freeze-baseline.sha256.pre-sc279-bak), freeze 280/280. Owner posted landed comment and flipped SC-279 → Done (labels DSE Plugin, Bug; verified). Q4 reading left open for Scott in the comment.
## STATE: DONE.
