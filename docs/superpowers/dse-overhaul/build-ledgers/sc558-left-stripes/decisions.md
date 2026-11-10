# SC-558 decisions ledger — remove the remaining decorative coloured left stripes from DSE

Worktree: `/home/scott/code/steelCompendium/worktrees/sc558-left-stripes` (every submodule on
branch `sc558-left-stripes`), cut 2026-11-04 from dse `develop` @ `248e202b`.
Ledger dir: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc558-left-stripes/`.

## Standing rules (verbatim)

- DESIGN.md rule 7 (Scott, 2026-08-10, SC-132): "No decorative colored left-borders … the wide
  colored left-border/accent-spine on cards and panels is banned for new work — Scott: *"it's
  become a cliche in the software community because claude agents always include it in their UI
  designs."* Carry state/category through the Steel grammars instead (materials, crests/glyph
  silhouettes, notches, banner grounds, borders-all-around). Existing components that ship one
  today may stay for now but **will be replaced** — don't copy the pattern into anything new."
- Scott is colourblind (docs/working-preferences.md, 2026-08-09): hue must never be the only
  channel for a state; colours are named in prose in every ask.
- Freeze: moving frozen print bytes needs Scott's explicit sanction (PROJECT.md §7); a branch
  that moves them ships `rebaseline.txt` + before/after crops.

## Rulings

- 2026-11-05, Scott on SC-366 (origin of this ticket): "I dont want to deal with the other left
  stripes in this ticket - make a new one if we need to" / "make a new one if we need to (todo,
  in the DSE 7.0.0 release)".

## Owner rulings

- 2026-11-04: design round first (Opus reviewer), crops of every stripe + candidates, posted to
  Scott as one consolidated ask. No production code until Scott picks.

## Rounds

- r1 design round — reviewer — brief `sc558-r1-design-brief.md`, report `sc558-r1-design-report.md`.
  Dispatched 2026-11-04 (orchestration:reviewer, agent a0a6c938b23d33af4). Ticket set Awaiting.
  Done 2026-11-04. Recommends A (remove) for all: error card, featureblock adv rail, tier rows +
  montage tier strip, action spine; statblock role rule `.dse-sb[data-dse-role]` (:3037-3039) is
  DEAD (overridden by steel `.dse-sb` :7536), delete as cleanup. All-A on a scratch copy: shots
  592 rc 0, freeze 210/280 (70 lines / 35 ids, all printed action spine), parity 0/0/24.
  Implementation sketch: report §7. Footgun: candidate CSS must be edited IN PLACE (appending
  ties specificity with featureblock flat mode and breaks the print-twin delta gate on
  `featureblock-featstyle-flat`). Worktree untouched at 248e202b.
  Reviewer slip: one `rm -f` with a variable target in its own scratch (harmless).
- r1 ask posted 2026-11-04 (7 images), ticket In Progress + Needs Review. Asked: letter per
  stripe (4), print rebaseline sanction (70 lines), v2 site follow (a/b/c, recommended a),
  sticky-chars confirm, ticket for Obsidian's violet print blockquote edge.

## Owner rulings (r1)

- Sequencing with SC-349 is NOT a Scott question: whichever lands second regenerates its
  rebaseline lines against the new baseline; fresh crops to Scott only if the spine removal
  looks different after that.
- Author-independence: r1 reviewer (a0a6c938b23d33af4) authored the design/recommendation; r2
  implementer is a fresh Sonnet; r2 review must not be a0a6c938b23d33af4's scratch-copy work
  re-checked by itself — use a fresh reviewer.
- On rulings: r2 = implementer in the worktree per report §7, DESIGN.md "Borders & cards" rewrite
  (worktree copy), CHANGELOG Unreleased bullet, rebaseline.txt + before/after crops if sanctioned.

## Scott's r1 rulings (2026-11-10, comment 83ee1898, verbatim)

> 1. C
> 2. C
> 3. A
> 4. A
> 5. new baselines are good
> 6. v2 site in a separate ticket in the backlog. high priority
> 7. 1px divider is correct.  Obsidian's left border on quotes should be removed

Mapping to the r1 ask (comment fdf6ab10):
- 1 = Error card → **C**: 1px border all around in the stage colour (mixed 60% toward the
  hairline), title ink follows the stage; stage still in words. (`sc558-r1-cand-errorcard-C.css`)
  ~~owner recommendation A~~ superseded by Scott's C.
- 2 = Featureblock "Level N Advancement" rail → **C**: sunken well, 1px `--dse-metal-faint`
  border all around, `--dse-surface-sunken`, head strip as its head band; SCREEN-ONLY (print =
  rail removed, same as A). (`sc558-r1-cand-role-fbadv-C.css`) ~~owner recommendation A~~ superseded.
- 3 = Power-roll tier rows + Montage tier strip → **A**: remove the stripe, keep wash + badge.
- 4 = Action-type spine → **A**: remove (screen and print).
- 5 = Print rebaseline **sanctioned** ("new baselines are good") for the action-spine removal
  (70 lines / 35 ids as measured on 248e202b). Lines must be recomputed on top of SC-349's
  rebaseline (dse develop 6270e84a).
- 6 = v2 site → separate **Backlog** ticket, **High** priority (owner files it).
- 7 = sticky-chars 1px divider **stays**. Obsidian's violet left border on plugin quotes (class/
  perk blockquotes in the print twin) **is removed in this ticket**.
- Statblock dead role rule (:3037-3039): deleted as cleanup (announced, no objection).

## Owner rulings (r2)

- Scott's item 7 ("should be removed") is his explicit instruction for those print bytes; with
  item 5 it covers: the action-spine ids + whatever ids carry a plugin blockquote in print. Any
  OTHER frozen id that moves → back to Scott with crops before land-ready.
- Error card C's `color-mix()` needs the `@supports` gate with a static fallback
  (`cssSupportFloor.test.ts`).
- Baseline moved: dse develop 6270e84a, workspace main e1d3d1e0 (SC-520, SC-349, SC-526 landed).
- 2026-11-10: filed **SC-564** (Backlog, High, related SC-558) for the v2 site stripes per item 6.
  SC-558 → Awaiting, labels = DSE Plugin only (Ready for Agent + Needs Review removed).

## Rounds (cont.)

- r2 implement — orchestration:implementer (agent a370c26c3e589f449), brief
  `sc558-r2-impl-brief.md`, report `sc558-r2-impl-report.md`, rebaseline `rebaseline.txt`,
  crops `sc558-r2-crops/`. Dispatched 2026-11-10. Next: r3 independent review by a fresh
  orchestration:reviewer (NOT a0a6c938b23d33af4 — it designed the candidates).
- r2 DONE 2026-11-10: dse `eb8b7949`, superproject `e8a55ef3`. Freeze 39 ids / 78 lines (35
  spine + 4 blockquote: class, perk, perk-headings, perk-narrow) — exactly the sanctioned set.
  jest 6497/1/257 of 258; e2e 128/128 89/89; shots 592 0 FAIL 163/978 clip 147; parity 0/0/24;
  lifecycle 50/51 run — G-S59 FAIL on branch AND on clean 6270e84a (host). Slips: a variable-target
  rm -rf of its own 4 lifecycle temp dirs; a stray scratch write (removed).
- Owner rulings on r2 follow-ups: (1) G-S59 → r3 reviewer re-classifies on a clean base; if
  pre-existing, report to dispatcher, not this ticket's blocker. (2) print quote padding → DROP:
  Scott asked for the border only; padding moves the same 4 ids again for no asked-for change.
  (3) 3px left shift → r3 probes alignment; drop unless it mis-aligns. (4) floor-engine neutral
  frame → DROP: stage still in words + title ink. (5) kit print cell flush to page right edge,
  pre-existing → Backlog ticket. (6) jest load timeouts → DROP, documented load-sensitive suites.
  (7) crit contrast 6.68:1 ≥ 3.0 → DROP. (8) SC-564. (9) frozen archive → DROP.
- r3 review dispatched — orchestration:reviewer, brief `sc558-r3-review-brief.md` (+ addendum).
- 2026-11-10 dispatcher FYI: SC-561 (G-S59 timeout, harness-only fix in obsidian-lifecycle.mjs,
  sc561 head d344e1e1, in review) is in flight. OWNER ruling: r3 proceeds now and runs G-S59 also
  on a scratch copy with SC-561's harness file; land-ready WAITS for SC-561 to land, then rebase
  onto the new develop and re-run lifecycle part 5 (and jest) so 52/52 is measured on the real base.
- 2026-11-10 r2 follow-up 5 filed as **SC-571** (Backlog, DSE 7.0.0, related SC-558). Out of scope.
- r3 review DONE 2026-11-10 (orchestration:reviewer a1350e312f0ba71ff): APPROVE, 0 CRIT/HIGH,
  1 MEDIUM, 5 LOW, 3 INFO. Freeze set verified = r2's 39 ids / 78 lines, all hashes check.
  G-S59: fails on clean 6270e84a too; branch + SC-561 harness 2/2 → 52/52. 3px shift (r2 FU-3)
  improves alignment → DROP confirmed.
- Owner rulings on r3 findings:
  - MEDIUM-1 (error-card title in stage hue 2.73:1 light parse/schema, 3.67 dark reference) →
    FOLD: title ink = `color-mix(in srgb, var(--dse-ec) 65%, var(--text-normal))` inside the
    existing @supports block, static `var(--dse-ec)` twin; still "title ink follows the stage"
    (Scott's C), just legible. Implementer measures contrast in all 3 stages × dark/light, ≥ 4.5
    target, never < 3.
  - LOW-1..LOW-5 → FOLD (small, same files).
  - INFO-1 (advancement head text 19px vs option 25px) → DROP: geometry of the candidate Scott picked.
  - INFO-2 → land-ready waits for SC-561 (unchanged ruling). INFO-3 → DROP (load-only).
- r4 fix round: resume implementer a370c26c3e589f449 with r3 findings verbatim. r5 scoped
  re-review of the delta: r3 reviewer a1350e312f0ba71ff (did not author the fixes).
- 2026-11-10 dispatcher: SC-561 LANDED — dse develop 6153acfe, workspace main 122117dd (harness
  only; main.js/styles.css byte-identical to 6270e84a; battery numbers unchanged). r4 addendum sent
  to implementer: after fixes, rebase dse → 6153acfe, superproject → 122117dd, then jest, shots,
  freeze, parity, lifecycle part 5 `G-S59 G-S49` (expect 2/2). Parts 1-4 (21/16/9/4) already green
  on r2+r3 with CSS-only delta → not re-run.
- 2026-11-10 dispatcher: SC-435 LANDED — dse develop 2ee2e405, workspace main 6f8f9b00 (tests +
  data-dse-control ids on minion pool modal, no CSS). New baseline: jest 6584/1 · lifecycle 52/52 ·
  e2e 163/164 ok, 0 failed, 1 known-bug (SC-572), 113/113 · shots 592 163/978 · freeze 280/280 ·
  parity 0/0/24. r4 addendum 2 sent: final base = 2ee2e405 / 6f8f9b00 (supersedes 6153acfe /
  122117dd as the rebase target); e2e re-run added.
- r4 DONE 2026-11-10: dse head 10db67e3 on 2ee2e405; superproject 8cf38a7f on fc48a0a1 (⊇ 6f8f9b00).
  All 6 r3 findings folded. Error-card title contrast now ≥ 4.85:1 in all 6 stage×theme combos.
  jest union 6591/1/258 of 259 (2 SC-568 load timeouts pass alone) · e2e 163/164 0 failed 1 known-bug
  113/113 · shots 592 0 FAIL 163/978 clip 147 · freeze same 39 ids/78 lines, hashes identical to
  rebaseline.txt · lifecycle part 5 2/2 (parts 1-4 green on r2/r3) · parity 0/0/24.
- r5 scoped re-review dispatched to r3 reviewer a1350e312f0ba71ff (delta only).
- r5 scoped re-review 2026-11-10: APPROVE. All r3 findings fixed; freeze 39/78 hashes = rebaseline.txt;
  range-diff '=' for SC-558 commits. Rulings: INFO-r5-1 (two inset-shadow spellings slip the guard)
  → DROP, optional tightening of a prescribed pattern; LOW-r5-1 (base jest is 6586 not 6584; delta
  +5) → recorded here + in sc558-r2-skill-proposal.md addendum for the dispatcher; INFO-r5-2
  (floor engine keeps raw hue, 2.73:1) → DROP, by design.
- LAND-READY 2026-11-10: dse sc558-left-stripes @ 10db67e3 (on develop 2ee2e405), superproject
  8cf38a7f (on fc48a0a1; submodule pointer bump left for wt-finish). rebaseline.txt 78 lines
  (Scott-sanctioned item 5 + item 7). Result comment posted on SC-558.
