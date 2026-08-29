# SC-120 — §D2: Steel compositions for the remaining display families — decisions ledger

Effort: `sc120-d2-steel-compositions`
Worktree: `/home/scott/code/steelCompendium/worktrees/sc120-d2-steel-compositions`
(every submodule on branch `sc120-d2-steel-compositions`)
dse base: `16e25ff` = `origin/develop` tip at effort start (2026-08-28).
Freeze baseline: 210 lines (steel-print + steel-realprint pairs), machine-local.

## Ticket scope (from the SC-120 description, verbatim excerpts)

> Scope per family (class, career, ancestry, culture, title, perk, complication, treasure,
> condition, rule — judge which actually want a composition vs. staying a prose card): read
> the site counterpart's composition (`.sc-classhead`, `careerCard` stat boxes, …), express
> it as `layout.steel` band data + Steel-scoped CSS, and keep the legacy branch
> byte-identical.

> Each family needs its own sanctioned `*--steel-print.png` rebaseline sign-off. SC-100's
> Scott-approved rebaseline covered exactly one file (`kit--steel-print.png`); a Steel DOM
> composition for any other family necessarily changes that family's frozen steel-print
> shot, so each one requires its own Scott approval before its single hash line is replaced
> at landing (procedure: dse-verify skill, freeze section).

> The dark-mode material rule from SC-100's gate rounds: sunken surfaces inside a Steel card
> use the site's **translucent-black** fills so the card's own gradient bleeds through —
> never `--dse-surface-sunken` (a 6%-white wash under Steel dark, the opposite direction).

## Scott's ticket comments (verbatim, both 2026-08-03/04, pre-effort)

1. (2026-08-03) "Scope addition from SC-100's final review triage (2026-08-03): the
   hybrid-mode kit render has a cosmetic empty-band-head when a hand-authored note has no
   signature ability (corpus-safe today — no tooling produces such a note; deferred as
   minor [T3 M2] in the SC-100 ledger). This code is revisited here anyway — fold the small
   guard in so it isn't re-discovered."
2. (2026-08-04) "SC-121 sweep confirms + evidence: class/career/ancestry worst
   (inventory-C.md C-1) — every display family but kit still falls back to `renderLegacy()`
   (plain bold title, pill badges, loose label/value grid) since only `kitLayout` has a
   `.steel` composition in `layouts.ts`. Ancestry is the worst case (bare title, no
   chip/box at all for long-form fields). Example below." [attached class--steel-dark
   evidence shot]

## Rulings during this effort (Scott)

S1. (2026-08-29 01:16 UTC, replying to the Batch C sanction ask — verbatim) "Looks great,
    go for it." — **Batch C SANCTIONED**: all four families approved as shown; the 10 hash
    lines named in the ask ({ancestry, condition, perk, perk-narrow, rule} ×
    print+realprint) are cleared for the dispatcher's swap at landing. No family vetoed,
    no crest objection (rulings 4/5's named veto windows passed unexercised for Batch C).
S2. (2026-08-29 11:20 UTC, newest comment, posted after both remaining asks — verbatim)
    "All aproved" — **Batches A AND B SANCTIONED**: class, career, treasure, title,
    complication (incl. the complication-edit-btn sibling pair named in the ask), and
    culture approved as shown. Every named veto window passed unexercised (numeral
    Languages tile, Project Points strip, class body kept whole, package crest, echelon
    eyebrow, SC-280 flavor position not pulled forward). With S1, ALL 24 rebaseline lines
    are sanctioned — the swap at landing is fully cleared.

## Owner rulings (ticket-owner, 2026-08-28, after round-1 design review)

Design doc `sc120-r1-design.md` accepted as the implementation spec. On its §7 open items:

1. Treasure crest: `package` (worker recommendation). Scott sees it in the evidence round.
2. Crest icon ids MUST be verified against the Lucide set Obsidian bundles at implementation
   time (e.g. `octagon-alert` vs `alert-octagon`); a crest that resolves to nothing is a
   failure. Prefer an automated check (unit test) over eyeballing.
3. Culture `map` / condition `zap` — follow `cards.go` (the tile being ported). The site's
   self-inconsistency (Browse landing uses different icons) is filed as its own v2 Backlog
   ticket linking SC-120.
4. Crest collisions with statblock role vocabulary (`users`/`crown`/`zap`) accepted —
   different contexts, no selector overlap. Scott can object in the evidence round.
5. Band-head labels (`Basics`/`Potency`/`Career Benefits`/`Project`): implement as designed
   (labeled); the headless alternative is named in the evidence-round ask.
6. class body policy (A) keep whole, per the design's site-parity rationale.
7. `ds-rule` composition goes in `displayFamily.ts`'s `genericLayout` (shared with future
   `genericCard()` adopters) — confirmed wanted; scheduled at Batch C tail.
8. Treasure double-render defect: fixed by the Steel composition + body policy (B); the base
   (non-steel) render branch stays byte-identical per the ticket.
9. Batching C → A → B as proposed. Final `rebaseline.txt` is generated once from the
   completed tree (never stitched from per-batch files — dse-verify SC-185 lesson);
   per-family crops are produced per batch for the sanction asks.

## Owner rulings after Batch C review (2026-08-28)

Review verdict LAND-READY (0 CRIT / 0 HIGH / 1 MED / 4 LOW / 3 INFO; all gates
independently re-measured; probes proved the guard, crest test, and base-clone tests
can fail). Dispositions:

10. MED-1 (rule eyebrow can only ever say 'Rule'; in inline mode it duplicates the title
    verbatim "◆ RULE / RULE"): apply the one-line guard — suppress the eyebrow text when
    it case-insensitively equals the card title (crest stays). The rule pair is already
    moving this effort, so no extra freeze cost. The real enhancement (capture the rule
    group from `scc:` so the eyebrow can say 'Combat' like the site tile) is filed as its
    own Backlog ticket linking SC-120.
11. LOW (perk Prerequisites band lacks the duplicate-vs-body guard; inert today at 0/55):
    fix now — add the same guard pattern the flavor band uses.
12. LOW (titleCase/humanizeType duplication): consolidate now.
13. LOW (floating promise in a new test): fix now.
14. LOW (crest-validity test resolves npm `lucide` export names, which keep deprecated
    aliases — `octagon-alert` AND `alert-octagon` both pass): accepted for Batch C (its
    four ids are canonical). MUST be tightened in Batch B, whose complication crest is
    exactly the id class this misses. Batch B's brief carries this.

## Owner rulings after Batch A implementation (2026-08-28)

15. Batch A's deviation ACCEPTED: `stripCareerBodyLabels()` strips a 6th label,
    "Project Points", beyond the design's 5 — the Career Benefits tile row renders that
    value, so leaving the body line would recreate the double-render defect the design
    itself flags for treasure. Named in the Batch A evidence ask so Scott can veto.

## Owner rulings after Batch A review (2026-08-28)

16. Batch A review verdict FIX ROUND NEEDED (2 MED / 5 LOW / 4 INFO) — all seven findings
    ACCEPTED for the fix round, none deferred: MED-1 strip career's orphaned lead-in
    "You gain the following career benefits:" (band head is its structural replacement);
    MED-2 caption rule adds background:none/border:none/padding:0 (site's boxless mini +
    caption; screen-only, zero freeze cost); LOW regex colon made mandatory (stops
    **Wealth**-paragraph stripping; Batch B inherits); LOW indented-continuation lines not
    stripped; LOW unit test pinning the caption rule's Steel/print scope (freeze is blind
    to it this batch); LOW band lookup by head===undefined made precise; LOW void render()
    floating-promise shape fixed (same as ruling 13). INFO items: no action —
    languageCount matches the site source (design doc text was imprecise), policy (B)
    losslessness noted as evidence for ruling 15.

## Owner ruling 17 (2026-08-28, after Batch A fix round)

17. The reviewer's optional MED-2 addendum is ADOPTED: class's `rightPrimary`
    ("MIGHT · REASON") must render boxless like the site's mini, not as a chip — the site
    class head shows large boxless text over the boxless "primary characteristics"
    caption, and site parity is the design's stated intent for this rail (§3.1 note).
    Screen-only; class print pair must stay byte-identical.

## Owner ruling 18 (2026-08-29, owner eyeball of Batch A evidence)

18. Career's Languages tile renders the word "One" in the tile-value face, whose capital O
    reads as a digit zero — "0ne" looks like a typo in the evidence shot (owner zoom
    confirmed). Ruling: languageCount emits the NUMERAL ("One language" → "1"), matching
    the numeric grammar of every other tile value (21, +9, +1, —) and immune to the O/0
    ambiguity. Deliberate divergence from the site tile's count word (site is reference,
    not gospel); named in the Batch A ask. Career print pair moves again (already moving).
    Scoped re-review of this one-liner folds into Batch B's review round (explicitly
    listed there) rather than its own round — minimal-risk data mapping with direct tests.

## Owner rulings after Batch B implementation (2026-08-29)

19. Batch B deviation 1 REJECTED as-shipped; small fix directed pre-review. The treasure
    eyebrow's level suffix keys on `m.level` (0/127 — dead corpus-wide) per the design
    doc's literal string, while the live `m.echelon` (77/127) loses its only home — the
    base branch shows it as an Echelon badge, so the Steel composition would be an
    information REGRESSION for 77 real treasures. Ruling: the eyebrow suffix prefers
    echelon — `` `${type} · Echelon ${m.echelon}` `` when echelon exists, else
    `` `${type} · Level ${m.level}` `` when level exists, else bare type — matching
    title's echelon-eyebrow grammar (design §3.5) and the design's own intent ("Where
    `m.level`/`m.echelon` exist"). Named in the Batch B evidence ask so Scott can veto.
20. Batch B freeze surprise ACCEPTED: `complication-edit-btn--steel-{print,realprint}`
    moves with the complication pair (a sibling fixture of the same `complicationLayout`,
    same class as Batch C's perk-narrow; its bytes are identical to `complication`'s pair,
    proving the authoring-pencil pref is print-inert). Batch B cost is 10 lines, not the
    design doc's 8; effort total 24, baseline count still 210, hash swaps only.
21. Batch B deviation 2 ACCEPTED: `treasure/example.yaml` + its by-SCC fixture keep their
    pre-existing frontmatter gaps (no item_prerequisite/project_source/level_effects);
    band behavior proven via direct `bands()` tests on verbatim corpus text instead.
    Reviewer may still weigh in.

## Owner rulings after Batch B review (2026-08-29, r7: FIX ROUND NEEDED, 2 HIGH / 1 MED /
## 4 LOW / 7 INFO)

22. HIGH-1 (packed two-label line loses the Thunderhead Cloud variant — whole-line strip
    deletes real content) and HIGH-2 (labels stripped unconditionally while the replacing
    bands are field-gated — content deleted with no replacement, already baked into the
    treasure evidence bytes): ACCEPTED, fix now, together. Principles for the rework:
    (i) the strip list is BAND-GATED — a label is stripped only when its replacing band
    actually renders; (ii) stripping is SEGMENT-AWARE — when a matched line contains a
    subsequent bold-labeled segment, strip only the matched label's segment and preserve
    the rest (no value comparison needed); (iii) when in doubt, prefer DUPLICATION over
    DELETION — data loss is never acceptable; (iv) INVARIANT: class and career renders
    stay byte-identical to their r6/fix-round hashes — those bytes are under Scott's live
    Batch A sanction ask; if the rework would move them, STOP and report NEEDS_CONTEXT
    instead of moving them; (v) re-run the reviewer's real-corpus probe (all 306 Browse
    files of the four families) as proof of no deletion / no new over-strips.
23. MED-1 (flavor never renders in its designed first position — dedup guard suppresses
    the band and flavor lands below the structural bands) SPLIT:
    (a) treasure's coherence bug FIXED NOW: the Effect band absorbs the immediately
    following rider paragraphs (the "Additionally, …" text) when the `**Effect:**` line
    is stripped, so effect and rider stay together; if the Effect band does not render,
    line and rider stay in the body untouched.
    (b) the global flavor-position question DEFERRED to **SC-280** (Backlog, filed
    2026-08-29, linked to SC-120): flavor-below-bands was named in the sanctioned Batch C
    ask ("a SIGNATURE TRAIT band above the flavor") and Scott approved those shots, so
    repositioning mid-effort would stale a granted sanction. Ships uniformly as-is;
    named in the Batch B evidence ask so Scott can pull it forward.
24. All four LOWs ACCEPTED for the fix round per the r7 report's prescriptions, under
    ruling 22's principles (LOW-1 trim-semantics alignment between bodyLabeledLine and
    stripLabeledLines; LOW-2 consistent normalization of label set vs compared text,
    incl. treasure's data-derived per-tier labels; LOW-3 orphaned label-only lines under
    prefer-duplication; LOW-4 tests pin the corrected behavior, incl. a Thunderhead
    Cloud survival regression test). None deferred.
25. All seven INFOs: no action (rightEyebrow additivity, base-branch integrity, §4.2
    vacuous satisfaction, ruling-18/19 confirmations noted as review evidence).

## Owner rulings after the fix-round-2 delta re-review (2026-08-29, verdict CLEAN,
## Batch B land-ready at `6fb65b8`; 1 MED NOTED carried + 5 INFO)

26. The carried MED (career's strip list keeps r7's HIGH-2 latent shape: `Skills`/`Perk`
    labels stripped while their bands are conditional, and the Career Benefits tiles
    dash-fill while their labels strip unconditionally — a hand-authored career note with
    a body label but no matching field loses content) is FIXED NOW, not filed away:
    dse is an Obsidian plugin whose inputs are user-authored notes, so
    "corpus-unreachable" is not real cover, and ruling 22(iii) ("data loss is never
    acceptable") applies to career exactly as it did to treasure. Fix: gate each career
    label on the model field its replacing surface actually renders (the re-reviewer
    verified this shape is byte-neutral for the harness fixture). HARD GATE: `career--steel-{print,realprint}`
    (and class, and every other family pair) must stay byte-identical — those bytes are
    under Scott's live Batch A ask; if the fix moves them, STOP and report NEEDS_CONTEXT.
27. The re-reviewer's residual INFO window (first-occurrence-only strips by position, so
    a hand-authored variant occurrence placed BEFORE the canonical one would lose its
    value; corpus-safe, strictly better than pre-fix, closable only by the value
    comparison ruling 22(ii) declined) is ACCEPTED AS A DESIGN BOUNDARY — recorded here,
    no ticket: it is not deferred work but a limit of the chosen no-value-comparison
    design. Other INFOs: no action.

## Owner ruling after the fix-round-3 re-review (2026-08-29, verdict CLEAN, full stack
## land-ready at `ea786ed`; 1 LOW test-strength + 2 INFO)

28. LOW-1 (gap-direction regression coverage exists for only 3 of 6 career labels —
    reviewer's mutations M4 [reintroduce the Wealth bug] and M5 [mispair Languages onto
    `m.wealth`] both stayed GREEN) FIXED NOW as a test-only micro-round: parameterize the
    dash-fill/gap test over all four tile labels per the reviewer's prescription. The
    round's acceptance proof IS the re-review: the worker must re-run mutations M4 and M5
    and show both now go RED, then revert. Byte-neutral by construction (test files don't
    reach shots); jest/tsc/lint suffice, no shots/freeze run required. No separate
    re-review round — mechanical hardening with the reviewer's own prescribed acceptance
    test. INFOs: no action.

## Landing prerequisites

- 2026-08-28: SC-205 landed upstream — dse `origin/develop` moved `16e25ff` → `c09cf6f`
  (zero frozen bytes moved, no baseline change). This branch is still based on `16e25ff`:
  BEFORE landing, rebase onto the new develop tip, re-run the full battery, and generate
  the final `rebaseline.txt` from the REBASED tree (never from pre-rebase hashes —
  dse-verify SC-156/SC-185 lessons).

## Round log

- 2026-08-28: effort started; worktree created; round 1 (Opus design/survey) dispatched.
- 2026-08-28: round 1 complete → `sc120-r1-design.md` + 26 site refs + 11 before shots in
  this dir. Owner reviewed doc + deciding evidence (class before vs site class head).
  Informational direction comment posted to SC-120. Round 2 (Batch C impl, Sonnet)
  dispatched.
- 2026-08-28: SC-268 filed (v2 crest self-inconsistency, Backlog, linked to SC-120).
- 2026-08-28: round 2 (Batch C) COMPLETE — dse commit `0061287` (ancestry/perk/condition
  Steel compositions in layouts.ts, rule in displayFamily.ts genericLayout, §8 kit guard,
  +23 tests incl. crest-icon validity). Gates: tsc/lint clean, jest 3279+1sk/3280,
  shots 0 FAIL, freeze = exactly 10 mismatches ({ancestry,condition,perk,perk-narrow,rule}
  × print+realprint — perk-narrow is a second fixture of the same ds-perk layout, not a
  leak; kit pair byte-identical = guard regression proof), determinism 2-run identical,
  parity 0/0/16 unchanged. Batch C freeze cost is 10 lines, not the design doc's 8 —
  effort total becomes 22, still hash-swaps only, baseline stays 210. Round 3 (independent
  Opus review) dispatched.
- 2026-08-28: round 3 review LAND-READY (1 MED, 4 LOW; probes proved guard/tests can-fail).
  SC-272 filed (rule-group eyebrow adapter fix, Backlog, linked). Fix round complete →
  dse commit `8a47807` (eyebrow==title suppression, perk prereq dedup guard, titleCase
  consolidation, awaited test promise; +3 tests, jest 3282+1sk/3283). Freeze still exactly
  10 mismatch names, only the rule pair's hashes moved vs round 2; kit pair still OK;
  parity 0/0/16. Scoped delta re-review dispatched.
- 2026-08-28: delta re-review CLEAN — Batch C LAND-READY at dse `8a47807`. Batch C
  sanction ask posted to SC-120 (4 before/after pairs inline); state flipped to
  In Progress + `Needs Review`. SC-272 filed. Round 4 (Batch A impl, Sonnet) dispatched:
  class/career + shared CSS (--dse-tiles-n, right-deck caption) + plainText/languageCount.
- 2026-08-28: Batch A implemented at `e66d2cf` (+30 tests, freeze 14 mismatches incl.
  class/career pairs, kit OK). Review verdict FIX ROUND NEEDED (2 MED / 5 LOW / 4 INFO;
  ruling 16 accepted all). Fix round 1 → `9cb615c` (seven findings; career pair moved,
  class print unchanged). Ruling 17 adopted the MED-2 addendum → fix round 2 `0d10e4e`
  (boxless rightPrimary; screen-only, class print byte-identical, jest 3318+1sk/3319).
  Original reviewer's transcript expired mid-pipeline — fresh Opus delta re-reviewer
  dispatched (brief rebuilt from ledger files; replacement-ready briefs paid off).
- 2026-08-29: delta re-review CLEAN — Batch A LAND-READY at `0d10e4e` (report appended to
  sc120-r5-batchA-review.md). Owner eyeball of Batch A evidence → ruling 18 → fix round 3
  `eadacc7` (languageCount numeral; career pair moved again, class untouched; jest
  3320+1sk/3321; freeze same 14 names; parity 0/0/16). Its scoped re-review folds into
  Batch B's review round per ruling 18. **Batch A is LAND-READY at `eadacc7`.**
- 2026-08-29: ticket-owner session transcript expired; fresh owner respawned, state
  reconstructed from this ledger + reports (this entry onward is the respawn's).
- 2026-08-29: Scott sanctioned Batch C (ruling S1 above). Round 6 (Batch B impl, Sonnet)
  dispatched: rebase onto dse origin/develop `c09cf6f` (SC-205) first, then
  treasure/title/complication/culture + stripLabeledLines + ruling-14 crest-test
  tightening. Batch A sanction ask being prepared in parallel.
- 2026-08-29: owner eyeballed the final Batch A evidence (career shows the numeral "1";
  class boxless rightPrimary + both tile strips confirmed). Batch A sanction ask posted
  (`sc120-comment-3.md`, 4 before/after dark shots inline); state In Progress, label set
  fixed to include `Needs Review` (it had been dropped/never applied — verified present
  now). Waiting on Scott (Batch A) + round 6 worker (Batch B).
- 2026-08-29: round 6 (Batch B) COMPLETE — rebase onto `c09cf6f` clean (rewritten stack
  tip `05a09d7`), Batch B commit `3ab9d45` (treasure/title/complication/culture
  compositions; `stripLabeledLines` extracted to CardLayout.ts with career refactored
  onto it; `rightEyebrow` added to the composition seam; crest test tightened to Lucide
  canonical per-icon files — `alert-octagon` now fails, all 11 shipped ids pass, none
  changed). Gates: tsc/lint clean, jest 3375+1sk/3376 (+54), shots 474/0 FAIL ×2,
  freeze 24 mismatches (14 prior + treasure/title/complication/complication-edit-btn/
  culture pairs), kit pairs OK, parity 0/0/16. Rulings 19–21 issued on its two flagged
  deviations + the freeze surprise. Original Batch B implementer's transcript expired
  immediately after completion — fresh Sonnet fix-round worker dispatched for ruling 19
  (treasure eyebrow prefers echelon).
- 2026-08-29: Batch B fix round 1 complete → `a78845a` (eyebrow prefers echelon; 2 files,
  +28/−10; jest same 3375+1sk/3376; freeze same 24 names, only the treasure pair's hashes
  moved — print==realprint; determinism ×2; parity 0/0/16). Treasure fixture carries
  echelon:"1" so the shot now reads "TRINKET · ECHELON 1"; evidence re-copied. Round 7
  (independent Opus review of Batch B + the folded ruling-18 languageCount delta per
  ruling 18) dispatched.
- 2026-08-29: r7 review verdict FIX ROUND NEEDED (0 CRIT / 2 HIGH / 1 MED / 4 LOW /
  7 INFO; all gates independently re-measured green at `a78845a`; 8 can-fail probes RED;
  corpus probe over 306 Browse files; ruling-18 languageCount delta reviewed CLEAN —
  folded review obligation discharged). Rulings 22–25 issued; SC-280 filed (flavor
  position, Backlog, linked). Fix round 2 (fresh Sonnet) dispatched: band-gated
  segment-aware stripping, Effect-rider absorption, four LOWs; class/career byte-identity
  is a hard invariant (live Batch A sanction ask).
- 2026-08-29: fix round 2 complete → `6fb65b8` (band-gated + segment-aware +
  first-occurrence-only stripLabeledLines, matchLabeledLine, extractLabeledLineAndRider,
  LOW-1..4; +10 tests, jest 3385+1sk/3386; freeze same 24 names, only treasure pair moved
  `395c8bdf…`→`4d464d42…`; class/career byte-identity VERIFIED by direct sha256; corpus
  probe 306 files, 0 deletions). r7 reviewer's transcript expired — fresh Opus delta
  re-reviewer dispatched (scope: `6fb65b8` only; judgment calls flagged: the
  first-occurrence-only extension, career's latent unconditional strip list).
- 2026-08-29: delta re-review CLEAN — Batch B land-ready at `6fb65b8` (0 findings in the
  delta; 1 MED NOTED carried [career latent shape] + 5 INFO; 4 can-fail mutations RED;
  independent corpus scan incl. career, 0 losses; first-occurrence extension judged
  correct). Rulings 26–27 issued: career gating FIXED NOW (fix round 3, Sonnet,
  dispatched — byte-neutrality of all 24 hashes is the hard gate) and the ordering
  residual accepted as a design boundary. Owner eyeballed treasure + complication
  after-shots. Batch B sanction ask posted (`sc120-comment-4.md`, 4 before/after dark
  pairs, 8 images; veto items named: package crest, echelon eyebrow, SC-280 flavor
  position; `Needs Review` still set). Waiting on: Scott (Batch A + Batch B asks),
  fix-round-3 worker, then its scoped re-review.
- 2026-08-29: fix-round-3 worker hit the parked-on-a-background-job stall (backgrounded
  shots + Monitor); owner watched the real process, resumed the worker on exit — recovery
  worked. Fix round 3 complete → `ea786ed` (career labels caller-built + band/field-gated;
  +4 tests incl. a pre-existing test that had passed by accident, jest 3389+1sk/3390;
  freeze same 24 names, ALL hashes byte-identical to `6fb65b8` verified by
  stash/regenerate/diff — career `681db993…`, class `dd9650e6…` intact under the live
  Batch A ask; kit pairs OK; parity 0/0/16). Scoped re-review of `ea786ed` dispatched.
- 2026-08-29: fix-round-3 re-review CLEAN — full stack land-ready at `ea786ed` (0 CRIT/
  HIGH/MED, 1 LOW test-strength, 2 INFO; gate/surface pairing verified label-by-label
  against SDK field types; monotonicity argument: new labels ⊆ old for every model, so
  the delta can only reduce stripping; hard gate proven independently — all 24 hashes
  byte-identical cross-session, career/class values intact; 7 mutations: M1-M3/M6/M7 RED,
  M4/M5 GREEN = the LOW). Ruling 28 issued: test-only micro-round dispatched (parameterize
  gap-direction coverage over all four tile labels; acceptance proof = M4/M5 now RED;
  no separate re-review per ruling 28).
- 2026-08-29: ruling 28 discharged → `41c9e78` (test-only, 1 file +63/−17; jest
  3392+1sk/3393; M4 RED 1/30, M5 RED 1/30, both reverted, `git diff src/` empty
  throughout; tsc/lint clean; shots/freeze/parity exempt per ruling). Worker's widening
  deviation ACCEPTED as necessary-and-correct: each parameterized case populates every
  OTHER backing field — the reviewer's literal all-fields-absent shape provably cannot
  distinguish M5 (two absent fields are indistinguishable regardless of which the gate
  checks). The SC-120 stack is CODE-COMPLETE at `41c9e78`. Final pre-landing round
  dispatched: full battery at `41c9e78` + the effort's single `rebaseline.txt` generated
  from the completed rebased tree (ruling 9).
- 2026-08-29: FINAL BATTERY GREEN at `41c9e78` — tsc/lint clean, jest 3392+1sk/3393,
  shots 474/0 FAIL ×2, freeze 186 OK + 24 FAILED + 0 missing = 210 with the exact
  ruling-20 name set and kit pairs OK, determinism + twin invariant proven, parity
  0/0/16. origin/develop still `c09cf6f` — no further rebase needed. `rebaseline.txt`
  written (ledger dir, 24 lines, freeze-baseline line order, every hash cross-checked
  against the fix-round tables — 0 novel hashes; career `681db993…` / class `dd9650e6…`
  byte-identical to the bytes in Scott's live Batch A ask, treasure/title/complication/
  complication-edit-btn/culture identical to the Batch B ask's bytes, so both pending
  sanctions remain valid over the exact landing bytes). **EFFORT LAND-READY at
  `41c9e78`** — the only remaining gates are Scott's Batch A and Batch B sanction
  answers; Batch C is sanctioned (ruling S1). Landing is the dispatcher's move
  (land-stack; apply rebaseline.txt per dse-verify freeze section with dated backup +
  dated SKILL.md record; copy this ledger to build-ledgers/ before wt-rm).
- 2026-08-29: Scott: "All aproved" (ruling S2) — Batches A and B sanctioned, all 24
  rebaseline lines cleared. `Needs Review` label removed (nothing waits on Scott).
  **EFFORT FULLY SANCTIONED AND LAND-READY at `41c9e78`** — handed to the dispatcher for
  landing. Ticket stays In Progress until the dispatcher confirms the land; owner then
  posts the landed wrap-up and flips to Done. Deploy remains Scott's separate call.
