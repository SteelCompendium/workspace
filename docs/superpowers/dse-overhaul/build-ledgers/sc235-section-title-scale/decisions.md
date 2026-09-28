# SC-235 decisions ledger — Steel section-title type scale

Owner: ticket-owner (Opus 5.5). Worktree: `/home/scott/code/steelCompendium/worktrees/sc235-section-title-scale`
(branch `sc235-section-title-scale` in every submodule). DSE tracked branch: `develop`.
Base at cut: dse `origin/develop` = `272c444` (SC-231 landed; freeze baseline 260 lines,
55 lines rebaselined by SC-231; parity 8 declared entries = 16 DECLARED rows; lifecycle 19).

Workers read THIS file, never the tracker.

## Ticket framing (ticket body, 2026-08-28; not a Scott ruling)

- Site section-head title `.sc-ability__section-head .tag` (v2 `steel-ability-cards.css:186-187`):
  `font-size: .9rem` = 18px at the site's 20px rem base, `letter-spacing: .1em` = 1.8px,
  line-height 30.6px (1.7 ratio). Plugin `.dse-section__title`: 16px / 1.12px (.07em) / 27.2px.
- Declared in `visual-harness/parity/selector-map.json` `declaredDeferrals` as
  `section-tag:font-size` / `:line-height` / `:letter-spacing` (FOLLOWUPS #51) = 3 entries, 6 rows.
- "The fix, if Scott wants it, is two declarations in the existing Steel-scoped rule
  (`1.125rem` and `0.1em`) — screen-only, so the frozen legacy/print shots cannot move."
- Visible 12.5% enlargement of every Steel section title on feature/statblock/featureblock/kit
  cards: a pixel decision for Scott.

## Pairing with SC-232 (card-name size), per Scott via dispatcher 2026-09-27

- SC-232 is parked in Needs Review (A = per-family site parity / B = shared 27px / leave).
  Its ask already says: "SC-235 compares section titles at 16px in the plugin against 18px on
  the site. If you pick A here, choosing its site-size option there keeps the two consistent."
- SC-235's ask must sit beside SC-232's without contradicting it, use the same convention
  (raw computed px measured against the live site, parity README rule 4), and be self-contained.
- Landing conflict: both branches edit the parity declared-deferral set and its count guard
  (SC-232 16 -> 26 rows, +5 entries for SC-368 `ink`; SC-235 16 -> 10 rows, -3 entries).
  Combined after both land: 20 DECLARED rows. Land in sequence; the second rebases and
  re-derives the count.

## Session constraints (dispatcher, 2026-09-27)

- No tags/releases/RCs on draw-steel-elements, ever. Never touch DSE `main`. No `just deploy*`.
- No freeze-baseline change without Scott's written sanction ("sanctioned") on the ticket; never
  edit the shared baseline (`.superpowers/sdd/freeze-baseline.sha256`, 260 lines). If frozen
  print bytes move, ship `rebaseline.txt` + before/after crops in this dir.
- Kill processes only by PID, and only ones whose command line contains this worktree's path
  (never pkill/killall by pattern — PROJECT.md footgun 8.9).
- Run gates in the foreground with output redirected to files; never park on a background job.
- Commit after each coherent step.
- Post comments with `--model opus-5.5`. Do NOT land; report LAND-READY or PARKED-NEEDS-REVIEW.
- Other work in flight: SC-284 (`.dse-head` narrow stacking), SC-232 (card-name size, parked),
  SC-338 (`.dse-optchip`, parked), SC-317 (external-link arrow, parked).

## Scott rulings

### Scott ruling 1 (2026-09-28 00:24 UTC, comment 00d1a795) — VERBATIM

> Recommended approach is good.

Owner reading: the ask's recommendation was **B** — "B = 15px / 1.8px tracking (0.12em) —
matches the site's RENDERED letter height (8px); parity re-declares the resulting
font-size/line-height/letter-spacing rows citing SC-235." Scott chose B.
~~The branch stays at A~~ superseded by this ruling: the branch moves to B.

## Owner rulings (2026-09-27; not Scott's — he decides the size)

- **Implement the site-parity option on the branch as the proposal Scott will see:**
  section title 18px, letter-spacing 0.1em (line-height follows from the 1.7 ratio). The ask
  offers "A" (this branch) vs "leave". If the survey shows the site's per-family section
  titles are NOT all 18px/.1em, stop and report (NEEDS_CONTEXT) before choosing targets.
- **Unit rule:** the new size must scale exactly as today's does (Obsidian text-size setting,
  SC-230 modal scaling): i.e. a pure x1.125 of whatever today's rule resolves to, landing on
  18px at the default 16px. Do not swap an em-relative size for a fixed rem one (or vice versa)
  if that changes behavior at a non-default text size.
- **Screen-only.** Print/export must not move: freeze must read 260/260. If it does not, stop
  (NEEDS_CONTEXT) — no rebaseline is planned for this ticket.
- **No knock-on geometry.** Anything em-relative to the title's own font-size (gap, ::before
  diamond if em, padding if em) must be checked; the strip's padding (10x18px, parity
  `section-head`) and section rhythm must stay as they are unless parity says the site differs.
- **Parity:** delete the three `section-tag` declarations (FOLLOWUPS #51) -> 5 entries /
  10 DECLARED rows; move `compare.test.ts`'s documented-N guard and `parity/README.md` in the
  same commit. dse-verify SKILL.md's expected numbers are workspace-level: the dispatcher
  updates them at landing (do not edit).
- **Narrow:** 0 new mid-word breaks and no new line wraps in section titles at 300px-wide
  captures vs base; report a table.
- **Comments** that state the section title is 16px/1em/.07em (e.g. styles-source.css ~8289
  SC-143 comment) are updated to the new truth in the same branch.
- **CHANGELOG:** one bullet under `## Unreleased` in the WORKTREE superproject's CHANGELOG.md;
  plus the DSE repo's own changelog if its AGENTS.md convention requires one.

## Round 1 dispatched (2026-09-27)

- Implementer (Sonnet), brief `sc235-brief-r1-implement.md`: measure -> implement -> gates ->
  evidence (`r1-evidence/`). Report `sc235-r1-implement-report.md`.

## Base moved (dispatcher, 2026-09-27)

- origin/develop = `825ea51` (SC-284 landed: `.dse-head` is a size container; at <=480px the
  head items stack; changes in styles-source.css cardHead block + cardHead test + harness
  entry). Freeze baseline changed 6 lines (encounter-narrow, montage-narrow,
  statblock-sticky-narrow x twin/realprint), still 260. Final gates must run on a head rebased
  onto `825ea51`; any rebaseline.txt must be computed against the current baseline.

## Round 1 result (implementer, 2026-09-27) — `sc235-r1-implement-report.md`

- dse head `43b76cc` on `825ea51` (f4fddaa CSS + parity; c8b054d test; 43b76cc dse CHANGELOG);
  superproject `eaad860` (CHANGELOG + pointer). Rule: `font-size: calc(var(--dse-fs-body) * 1.125)`
  + `letter-spacing: 0.1em` in the Steel screen-only rule ~8163. Site measured 18/30.6/1.8 on
  every family that renders a section title (live + committed inventory).
- Gates: tsc/lint clean; jest 4115 (4114 pass / 1 skip) vs base 4113 (+2 new); lifecycle 19/19;
  shots 532 / 0 FAIL (532 is develop's count after SC-284); freeze 260/260; parity 0/0/10 DECLARED;
  can-fail proof 6 GAPs with CSS reverted. x1.125 holds at 16/18/20px; modal x1.4 holds.
- Narrow: 0 mid-word breaks; 1 new line wrap ("Special (2 Malice)" at 300px).

## Owner rulings, round 1 (2026-09-27)

- ~~"Narrow: 0 new mid-word breaks and no new line wraps in section titles at 300px-wide
  captures vs base"~~ superseded by: the single clean wrap of "Special (2 Malice)" at 300px is
  ACCEPTED and disclosed in the Scott ask (narrow composite); no narrow guard (a container on
  sections risks the collapse SC-232 hit, for one label wrap). Scott can ask for a guard.
- Follow-up 1 (no featureblock fixture has a titled section) -> DROP: neither the site nor any
  real content renders one; the rule is a shared class selector.
- Follow-up 3 (em-relative gap / spend-chip padding grow 12.5%) -> DROP: correct em behaviour.
- **Owner eyeball of the wide composite: the site's rendered "EFFECT" glyphs look the same
  height as Today's 16px and smaller than the branch's 18px, despite 18px computed; site looks
  lighter and more tracked.** Round 2 reviewer probes font face / weight / real-vs-synthesized
  small-caps / rendered ink height before the ask is written. The ask must not claim "matches
  the site" if the rendered glyphs do not.

## Round 2 result (independent review, 2026-09-27) — `sc235-r2-review-report.md`

FIX-FIRST: 0 CRIT, 1 HIGH, 2 MED, 2 LOW, 5 INFO. Gates re-run green at `43b76cc`.
- Glyph probe: site renders Petrona 700 with browser-SYNTHESIZED small caps (Google's Petrona
  has no smcp) = capitals at 70% of 18px; plugin renders Source Serif 4 Bold REAL smcp (0.540em).
  Rendered letter height: site 8px, today (16px) 9px, branch (18px) 10px. Word "EFFECT": site
  55px, today 60, branch 68. The gap is face + fake-vs-real small caps, not font-size. 15px
  (+1.8px tracking) gives 8px letters, word 62px (`r2-review/glyph-options-6x.png`).
- HIGH-1 "matches the site" claims in both CHANGELOGs, styles-source.css ~8178/8180,
  parity README ~542. MED-1 spend chip (~9332) inherits 18px/1.8px (site chip 17.2px/.04em);
  chip 333->386px wide. MED-2 composite captions imply equal size. LOW-1 font-sizes.md names
  `--dse-fs-subheading`. LOW-2 at 240px "(2 Malice)" also wraps in 5 statblock captures.
- INFO: shots 532 is correct post-SC-284; superproject should rebase onto origin/main `601b44a`.

## Owner rulings, round 2 (2026-09-27)

- **The ask offers three options, recommending B:**
  **A** = 18px / 0.1em (1.8px) — the site's computed values; letters render 10px vs site 8px.
  **B** = 15px / 1.8px tracking (0.12em) — matches the site's RENDERED letter height (8px);
  parity re-declares the resulting font-size/line-height/letter-spacing rows citing SC-235.
  **Leave** = 16px / 0.07em unchanged; letters 9px; declarations stay, re-cited to SC-235
  with the true reason.
- **The branch stays at A** as built (the ticket's literal fix); B and Leave are shown by
  probe in the evidence. If Scott picks B or Leave, the branch is reworked before landing
  (same shape as SC-232's ask).
- HIGH-1 -> FIX: every claim says the COMPUTED values match the site and the letters render
  about 2px (25%) taller because the site fakes its small caps; never "matches the site's size".
- MED-1 -> FIX by pinning: the spend chip (`.dse-section--spend .dse-section__title`) keeps
  TODAY's 16px / 0.07em under A (it is a different site element, `.sc-ability__enh .cost`,
  out of this ticket's scope). Chip vs site gap -> DROP (no ticket): the chip has the same
  fake-small-caps effect, so its computed-px gap overstates the visible one.
- MED-2 -> FIX: rebuild evidence (see round-3 brief): 4-column wide composite Today / A (this
  branch) / B (probe) / Site at 1:1 with measured letter height in each caption, plus a plain-
  label glyph zoom strip (4 rows, no weight-400 probe).
- LOW-1 -> FOLD (one comment line explaining `--dse-fs-body * k` vs `--dse-fs-subheading`).
- LOW-2 -> disclose in the ask (A wraps "(2 Malice)" at 240px on statblocks; no mid-word breaks).
- Superproject: rebase onto origin/main (`601b44a` or later).
- Pairing note for the ask: names (SC-232) are ordinary letters; section titles are small caps,
  and the site fakes its small caps, so here computed px and visible size diverge.

## Base moved (dispatcher, 2026-09-27)

- origin/develop = `afd6ae3` (SC-338 landed: `.dse-optchip` joins the shared kit focus ring;
  styles-source.css + 2 guard tests). Freeze unchanged at 260. Round 3 rebases onto it; jest
  count will grow by develop's 2 guard tests (re-measure base).
- origin/develop = `5a20d5f` (SC-317 external-link arrow landed). Freeze unchanged at 260.
  Final gates on `5a20d5f` (or later). SC-232 is back in progress (Scott widened it to card-head
  slot content, 2026-09-27; its size ask will be re-posted later; working assumption Option A).
  Parity reconciliation: whoever lands second. SC-235 alone on develop: 16 -> 10 DECLARED.
  If SC-232 lands first (16 -> 26), SC-235 on top -> 20 DECLARED.

## Round 3 result (fix round, 2026-09-27) — `sc235-r3-fix-report.md`

- dse head `35d3b46` on `5a20d5f` (round-1 commits rebased to c4237f5/b73fac0/2b2d3dc);
  superproject `f0e566a` on origin/main `9a7e39b` (CHANGELOG conflict with SC-317 resolved,
  both bullets kept). HIGH-1/MED-1/MED-2/LOW-1/LOW-2 done; B adds 0 wraps at 300/240px.
- Gates: jest 4122 (4121 pass / 1 skip) vs base 4119 (+3); lifecycle 19/19; shots 532/0;
  freeze 260/260; parity 0/0/10; can-fail 6 GAPs.

## Round 4 result (scoped re-review, 2026-09-27) — `sc235-r4-rereview-report.md`

- LAND-READY-AS-PROPOSAL. 0 CRIT/HIGH/MED, 1 LOW, 3 INFO. Gates green at `35d3b46`.
  Evidence verified 1:1; A adds 11 wraps (1 at 300px, 10 at 240px), 0 mid-word; B adds 0.

## Owner rulings, round 4 (2026-09-27)

- LOW-1 (CHANGELOG bullets "real capitals read bigger") -> FOLD with the reviewer's wording.
- INFO-1 ("site parity" without "computed" in comments/test names) -> FOLD (comments only).
- INFO-2 (Today column labelled afd6ae3) -> DROP: section-title CSS identical, re-capture
  byte-identical at 5a20d5f.
- INFO-3 (main-checkout dse dirt) -> DROP: Scott's known vault dirt, dispatcher stash-wraps it.
- Owner eyeball of r3 glyph zoom + wide composite: ACCEPTED.

## Final state (2026-09-27)

- dse `845a491` on `develop` `5a20d5f`; worktree superproject `d3787af` on origin/main `9a7e39b`.
  Round 5 prose-only (built styles.css byte-identical to 35d3b46). jest 4122 (4121/1/0);
  lifecycle 19/19; shots 532/0; freeze 260/260; parity 0/0/10. No rebaseline.txt (print unchanged).
- Consolidated ask POSTED (A 18px / B 15px recommended / leave 16px), with glyph zoom, wide
  and narrow composites. Ticket In Progress + Needs Review. PARKED.
- Landing notes: dse-verify expected parity -> 10 DECLARED if SC-235 lands alone on develop;
  if SC-232 lands first (26), SC-235 on top -> 20 (the second to land reconciles
  selector-map.json declaredDeferrals + compare.test.ts's documented-N guard + parity README).
  If Scott picks B or leave, the branch is reworked first (B re-declares the 3 section-tag
  rows citing SC-235 -> count stays 16; leave drops the CSS and re-cites them -> 16).

## Owner rulings, round 6 (2026-09-28) — implementing Scott ruling 1 (B)

- Section title: `font-size: calc(var(--dse-fs-body) * 0.9375)` (15px at default) +
  `letter-spacing: 0.12em` (1.8px at 15px). Line-height follows (1.7 -> 25.5px).
- Spend chip stays pinned at today's 16px / 0.07em (unchanged ruling).
- Parity: re-declare whichever `section-tag` rows now fire (expect font-size, line-height; and
  letter-spacing only if it fires — 1.8px vs 1.8px should match, so likely NOT). Each `why`
  cites SC-235 and the reason: the site's Petrona has no small-caps glyphs, the browser
  synthesizes them at 70%, so the plugin (real smcp) matches the site's RENDERED letter height
  (8px) at 15px; Scott chose this 2026-09-28 (comment 00d1a795). Declared count is whatever the
  run proves (expected 16 - 6 + 4 = 14 if only font-size/line-height fire, x2 schemes).
  Move compare.test.ts's guard + parity README with it. The jest exact-value test pins 15px/0.12em.
- Every comment / CHANGELOG line describing A is rewritten for B: plain wording — "section
  titles are now 15px with wider letter spacing, so their letters match the site's height
  (the site fakes its small caps)". No "matches the site's size" claim.
- Narrow: B adds 0 wraps (measured r3/r4); re-verify on the final head.
- Freeze must stay 260/260 (screen-only).
- Round 6 dispatched (implementer, same identity as r1/r3/r5): brief `sc235-brief-r6-optionB.md`.
  Scoped re-review round 7 goes to the reviewer identity (r2/r4): brief `sc235-brief-r7-rereview.md`.

## Round 6 result (implementer, 2026-09-28) — `sc235-r6-optionB-report.md`

- dse `464838f` on `5a20d5f`; superproject `a5d230f` on origin/main `0cd7934`. B implemented:
  15px / 0.12em / 25.5px; spend chip unchanged. jest 4122 (base 4119, +3); lifecycle 19/19;
  shots 532/0; freeze 260/260; parity 0/0/14 DECLARED (section-tag font-size + line-height
  re-declared citing SC-235; letter-spacing matches and is not declared); can-fail 4 GAPs.
  Narrow 0 new wraps. Worker discarded uncommitted edits mid-round with `git checkout HEAD --`
  and reconstructed them — r7 reviewer to diff every line of 845a491..464838f.
- Expected parity at landing: 14 DECLARED on develop alone; if SC-232 lands first (26),
  SC-235 on top = 26 - 6 + 4 = 24.

## Round 7 result (scoped re-review, 2026-09-28) — `sc235-r7-rereview-report.md`

- FIX-FIRST, docs/comments only: 0 CRIT/HIGH, 1 MED, 1 LOW, 3 INFO. Reconstruction verified
  lossless. All gates green at `464838f`; letter height 8px = site; narrow 0 new wraps;
  can-fail 4 GAPs; option-A CSS restored -> DEAD DECLARATION + 2 jest failures.

## Owner rulings, round 7 (2026-09-28)

- MED-1 (styles-source.css:7344-7345 still says 0.1em) -> FOLD with the reviewer's wording.
- LOW-1 (README 536-563 + compare.test.ts:818/826 tell a two-step 8->5->7 history) -> FOLD:
  one dated entry for the net 8/16 -> 7/14 change.
- INFO-1 (CHANGELOGs explain B via the never-shipped 18px) -> FOLD: describe B directly.
- INFO-2 (rule comment cites `.superpowers/` files outside the repo) -> FOLD: drop those paths,
  keep the reasoning.
- Superproject rebase onto origin/main `89d7893`.

## Round 8 result + final state (2026-09-28)

- dse `6dca388` on develop `5a20d5f`; superproject `4e3498b` on origin/main `89d7893`. Prose-only
  (built styles.css byte-identical to 464838f). tsc/lint clean; jest 4122 (4121/1/0); parity
  0/0/14. Full battery at 464838f (r6 + r7 independent): lifecycle 19/19; shots 532/0; freeze
  260/260. No rebaseline. LAND-READY.
- Landing: dse-verify expected parity -> 14 DECLARED (7 entries) if SC-235 lands alone; if
  SC-232 lands first (26), SC-235 on top -> 24. Second to land reconciles selector-map.json
  declaredDeferrals, compare.test.ts guard, parity README.
