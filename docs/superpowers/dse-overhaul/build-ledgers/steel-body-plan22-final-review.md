# Final whole-branch review — plan 22 (Steel body-text coherence, SC-99)

Reviewed: dse submodule `b7ea4af..328cb63` (4 commits) in worktree
`/home/scott/code/steelCompendium/worktrees/steel-body/draw-steel-elements` + superproject
docs commit `5facf93` in `/home/scott/code/steelCompendium/worktrees/steel-body`.
Inputs: plan, ledger, both review packages, task-{1,2} reports + reviews. All gates below
were re-executed by this reviewer (devbox-wrapped, absolute paths).

## VERDICT: NEEDS FIXES — 1 Important (docs-only), then ready

The implementation is correct, complete, and honestly guarded; every execution gate is green
and was re-verified here. The one blocking item is a factual overclaim in **both CHANGELOG
bullets** about the EV-chip exclusion — a two-sentence wording fix (one submodule commit, one
superproject commit), no code change. Everything else is record-only.

Findings: **0 Critical / 1 Important / 2 Minor.**

---

## Gates personally re-executed (fresh, this session)

| Gate | Result | Notes |
|---|---|---|
| tsc (`npm run tsc`) | clean | |
| jest (full, `npx jest`) | **2011 tests / 144 suites / 3 snapshots, all green** | 2010 baseline + 1 new contract test |
| token-coverage guard | 9/9 green | only `--dse-*` reference added by the branch is consumption of existing `--dse-font-display`; stepper rule uses Obsidian's `--font-text`, not a `--dse-*` token |
| parity | **0 GAPs / 10 WARNs / exit 0** | exit code read via outer shell (the inline `PEXIT=$?` capture fell to the documented devbox footgun and came back empty — re-ran with parity as the last command; exit 0). WARN set verified line-by-line = exactly the FOLLOWUPS **#40** set (section-head letter-spacing + ink, pr-head ink, ×2 schemes = 6) + **#39** set (featureblock margin-top/bottom ×2 schemes = 4). `selector-map.json` `expectedGaps` lists exactly those 5 (pair, rule) deferrals; 12 mapped pairs, matching the changelog's "12 mapped pairs" claim. |
| shots (`npm run shots`, regenerated) | 164 non-obsidian files, no `--ERROR` | |
| freeze (`check-freeze.sh <worktree shots dir>`, run AFTER the fresh regen) | **freeze OK (98/98 legacy+print PNGs byte-identical)** | |
| contract can-fail (re-derived, not just re-read) | ✅ | Reverted `styles-source.css:3438` to the 4-root form myself → `npx jest test/dom/theme/steelTypography.test.ts` = **2 failed / 4 passed** (the new element-root shape test AND the font-identity test both fail — two independent assertions pin the broadened selector). `git checkout --` restore → 6/6 green, `git status` clean. The bare `[data-dse-element]` substring is genuinely not contained in `[data-dse-element='feature']`, so the shape test cannot pass on an allow-list. |
| obsidian-shots | **not re-executed** (needs a live display/Obsidian session) | verified 131 files on disk, matching both reports; same cost-based spot-check the task-2 reviewer made |

## Whole-branch constraint checks

- **No `src/` changes:** `git diff --name-only b7ea4af..328cb63 -- src/` is empty. Branch
  touches only `styles-source.css`, `test/dom/theme/steelTypography.test.ts`, `CHANGELOG.md`.
- **Superproject:** `5facf93` touches exactly 3 docs files; `git diff 5facf93^ 5facf93 --
  draw-steel-elements` is **empty** (no pointer bump — deliberately left for `wt-finish`);
  only ` M draw-steel-elements` unstaged, nothing staged.
- **Nothing pushed:** `git ls-remote origin steel-body` returns nothing in both the submodule
  and the superproject.
- **Commit hygiene:** full `%B` of all 4 submodule commits + `5facf93` read — no AI/Claude
  attribution, no co-author trailers anywhere.
- **Shot-reads (my own eyes, freshly regenerated shots):**
  - `hero--steel-dark`: labels/section heads/buttons/skills all serif + cool ink; stepper
    values ("31", "4", "1") correctly render sans inside their inputs. Coherent.
  - `negotiation--steel-dark`: body/motivations/pitfalls serif; tier badges serif (consistent
    with the card families since plan 21 — Task 1 fix-round's determination re-confirmed);
    checkboxes intact. Coherent.
  - `encounter--steel-dark`: serif throughout incl. table headers; "DIFFICULTY: TRIVIAL"
    keeps small-caps; "EV 0 / 40" renders solid, equal-size **serif** caps — legible, no
    split/shrunk-digit artifact. Compared against
    `.superpowers/sdd/shots-c1-ab/before/encounter--steel-dark.png` (pre-broadening: sans
    small-caps "EV" + large bold sans digits) — see Finding 1.
  - `feature--steel-dark` (card family): unchanged serif card look; chips/badges correct —
    the plugin-only families now genuinely read as one type system with it.
  - `hero--legacy-dark`: old sans rendering fully intact (and the freeze proves the whole
    98-file legacy+print set byte-identical).

---

## Findings

### Finding 1 (Important) — both CHANGELOGs misstate the EV-chip exclusion ("keeps its prior, non-serif rendering" is false on both counts)

Plugin `CHANGELOG.md` (commit `328cb63`): *"numeric stepper/counter values and the
encounter's `EV n / n` chip are deliberately excluded and keep their prior, non-serif
rendering."* Workspace `CHANGELOG.md` (commit `5facf93`): *"…both keep their prior,
non-serif rendering…"*.

Verified against the code and the pixels: **no rule anywhere in `styles-source.css` sets
`font-family` on `.dse-head__primary--chip`** (checked every occurrence), so the EV chip
inherits `var(--dse-font-display)` from the broadened element-root rule — under Steel it is
**serif** now. The plan-22 fix rule (`:3507`) sets only `font-variant-caps: normal;
text-transform: none` — i.e. the chip is excluded from the **small-caps treatment** (so
Source Serif 4's `smcp` digit-shrink can't collapse it), not from the serif routing. The
shots confirm it: pre-broadening the chip was sans small-caps "EV" + full-size bold digits;
the shipped chip is uniform natural-size serif caps. So the chip neither "keeps its prior
rendering" nor is "non-serif" — the claim inverts what actually shipped, for one of the two
exclusions the docs-honesty constraint specifically names.

The internal docs get it right (gap inventory: "keeps solid, natural-size caps instead of
collapsing under Source Serif 4's `smcp` digit-shrink"; D3-token-map: "keeps
`font-variant-caps: normal` so … digit-shrink doesn't collapse it"; the CSS comment and Task
1 report likewise). Only the two changelog bullets — the user-facing story — overclaim.

**Fix (docs-only):** reword both bullets to match the D3/gap-inventory framing: steppers
keep their prior non-serif rendering; the EV chip adopts the serif face but is excluded from
the small-caps treatment so it renders solid natural-size caps instead of collapsing (its
old label-vs-value size emphasis is not reproducible without a DOM boundary). One submodule
commit + one superproject commit; no code, no gate re-runs needed beyond jest being
unaffected.

### Finding 2 (Minor) — workspace changelog's "party awards" is the wrong example for the stepper exclusion

The workspace bullet lists the excluded stepper/counter values as "(hero stamina, party
awards, montage/initiative trackers, the standalone counter)". The party **award** control
(`.dse-party__award-input`, `party/view.ts:225`) is a raw `<input type="number">` that never
used `font: inherit` and was never affected by the routing (per the fix-round + re-review,
which I spot-checked); the party controls actually covered by the stepper exclusion are the
Victories/XP/Renown/Wealth stepper values. Reword to "party stat values" (or similar) while
editing the same bullet for Finding 1. Cosmetic; the rendered result matches the reader's
expectation either way.

### Finding 3 (Minor, record-only) — fix-round report undercounts the audited numeric-input classes

The ledger's deferred minor: the Task 1 fix-round report names 2 of the 4 non-stepper
numeric-input classes it claims were checked. The scoped re-review independently enumerated
and verified all four (incl. `.dse-mt__char-input`, `.dse-init__malice-quickadd-amount`) as
genuinely unaffected. Historical report artifact; nothing functional rides on it. No action.

---

## Triage of the ledger's two deferred minors

1. **Fix-round report undercount (names 2 of 4 classes): RECORD-ONLY.** The re-review
   closed the verification gap; the report is a frozen historical artifact and editing it
   now would add noise, not auditability. (Finding 3.)
2. **EV-chip label/value size disparity not restored: RECORD-ONLY as accepted — correctly
   ruled impossible without DOM.** Verified the load-bearing claim myself:
   `encounter/view.ts:187` builds `rightPrimary` as one template string
   (`` `EV ${computed.spent_ev} / ${computed.budget}` ``) rendered as a single text node —
   CSS cannot size part of a text node, and DOM changes are forbidden by the plan. The
   shipped rendering is legible and coherent. **However**, the way this acceptance was
   *described* in the changelogs is Finding 1 and must be fixed. If Scott considers the old
   numeric emphasis load-bearing, a future FOLLOWUPS item (wrap the value in its own span —
   a `src/` change, out of plan-22 scope by design) is the path; none exists today and none
   is required to merge.

## Spec-vs-implementation truth (whole-plan)

- Task 1 Steps 1–7 and Task 2 Steps 1–4 all verifiably delivered; the plan's known risk
  (over-reach onto controls) materialized exactly once (steppers), was caught by review, and
  fixed with the targeted-exclusion pattern the plan prescribed ("never by narrowing the
  selector") — the shipped CSS matches that instruction.
- The plan's §C1/§C2 goal is genuinely met: broadened rule at `styles-source.css:3438`
  subsumes the card families (DRY, no parallel rule); line-height/padding remain on the
  untouched plan-21 rule exactly as Task 1's report corrected the plan's own framing.
- Docs honesty: serif-not-slab ✅, 600/700-weights caveat ✅, screen-only ✅, no-parity-
  coverage-for-plugin-only-families caveat stated in both the workspace changelog and the
  gap-inventory CLOSED entry ✅ — all present; the sole honesty defect is Finding 1.
- The incident-recovery state (repacked self-sufficient worktree store) is sound from this
  session's perspective: all branch commits reachable, fsck-clean behavior observed
  indirectly (every git operation this session succeeded against the worktree store).

## Bottom line

Fix Finding 1 (fold Finding 2 into the same edit), re-run nothing but a quick jest sanity if
desired, and the branch is ready for Scott's `just wt-finish steel-body`. No code, test,
selector, or gate concern remains.
