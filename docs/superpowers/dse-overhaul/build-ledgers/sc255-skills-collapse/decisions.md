# SC-255 decisions ledger — `ds-skills` double collapse

Effort: sc255-skills-collapse · Worktree: /home/scott/code/steelCompendium/worktrees/sc255-skills-collapse
Tracked branch: draw-steel-elements `develop` @ 6c4f6aa (2026-09-24). Owner: Fable ticket-owner.

## Scott's rulings (verbatim, dated)

1. **SC-169 round 2 ruling 3 (2026-08-18), general to every card element, quoted in the SC-255
   description:** "Remove the old. Replace with the consistent option that all card elements use."
   -> For `ds-skills`: delete the kit `collapsible()` whole-element "Skills" header in
   `src/elements/skills/view.ts`; the standard element-menu collapse (chrome) is the only
   whole-element collapse.

(No SC-255 thread comments as of 2026-09-24 — ticket had zero comments at start.)

## Precedent (not a ruling — the shape to copy)

- `ds-stamina` in SC-169 round 3: `docs/superpowers/dse-overhaul/build-ledgers/sc169-menu-panel-ledger.md`
  §4 "`ds-stamina`" and §7 freeze delta. Kit collapsible removed; content mounts on root;
  `collapse_default: true` still starts collapsed; block body byte-identical (model owns
  and re-emits the keys, `collapseKeysOwnedByModel: true`); `collapsible: false` honoured;
  toggle session-persisted by chrome. Freeze moved every capture id that renders the element
  (ticket predicted 2, reality was 10).

## Owner rulings

- 2026-09-24: Expected freeze delta is every frozen Skills print line (the baseline currently
  holds 20 skills lines = 10 capture ids x print twin + realprint, incl. `chrome-skills-menu`
  and the two `-hidden` ids), not the 2 the ticket predicted in August. Any NON-skills frozen
  line moving is a defect, not a rebaseline candidate.
- 2026-09-24: Per-GROUP collapsibles (Crafting / Exploration / ... group headers) stay. Only the
  whole-element wrapper is the double affordance.
- 2026-09-24: Rebaseline computed against the CURRENT 260-line baseline (post-SC-328 16-line
  rebaseline). Deliverable `.superpowers/sdd/sc255-skills-collapse/rebaseline.txt` + before/after crops.
  Sanction ask goes in ONE consolidated Needs Review comment; dispatcher applies at landing only
  after Scott's written sanction.

## Rounds

| Round | Worker (type) | Status | Report |
|---|---|---|---|
| r1 implement | orchestration:implementer | 2026-09-24: died silently at 22:34 after commits 8dc12b6/c4e6e8b/cbbb190 + all gates; NO report written. Owner read logs: tsc/lint clean, jest 3996 passed/1 skipped/206 of 207 (base 3997), lifecycle 6/6, freeze exactly 20 skills lines, rebaseline deterministic across 2 runs, parity 0/0/16 | sc255-r1-logs/ |
| r2 review | orchestration:reviewer | dispatched 2026-09-24 23:55 | sc255-r2-review-report.md |
| r2 review | orchestration:reviewer (Opus) | 2026-09-25: APPROVE-WITH-FIXES on cbbb190. 0 HIGH / 1 MED / 6 LOW / 4 INFO. Battery re-run: identical numbers; the 20 freeze names = rebaseline.txt, hashes match across an independent run | sc255-r2-review-report.md |

## Finding rulings (owner, 2026-09-25)

- MEDIUM-1 (false "no SessionPersist" claim, view.ts:11, skills.test.ts:183, :245-248) -> FOLD into r3.
- LOW-1 (dead resolveCollapsePrefs + ComponentWrapper declaredCollapsePrefs side channel) -> FILED SC-364 (Backlog,
  crosses into ComponentWrapper/catalog, which every element parses through). r3 fixes ONLY skills.test.ts:74-77, the comment this diff made false.
  SC-364 is OUT OF SCOPE for r3.
- LOW-2 (stale wrapper comments: definition.ts:1-4, skills.test.ts:1-4, styles-source.css:3395, chromeRound2.test.ts:460-473) -> FOLD.
- LOW-3 (docs/CHANGELOG say "Skills" header; it read "Skill List") -> FOLD.
- LOW-4 (CHANGELOG entry: tag per file convention, mention one-click expand) -> FOLD.
- LOW-5 (before/chrome-skills-menu--steel-dark.png is not a genuine before) -> FOLD as: delete that one file (not used in Scott's ask); no regeneration.
- LOW-6 (no test pins the one-click expand) -> FOLD: add probe P1 (+ P6/h3) as real tests.
- INFO-1 (SC-349: 30 CSS px more of the list now inside the 2400 px print window) -> goes in the Scott ask, no work.
- INFO-2 (1 CSS px bottom slack on two screen shots) -> DROP: not frozen, not visible at normal zoom.
- INFO-3 (sc169 spec still lists the double collapse as open) -> FOLD: mark resolved by SC-255.
- INFO-4 -> DROP (consequence of LOW-5).
- Behaviour-change list for Scott comes from r2 §1 (NOT the r1 commit comments): header gone; collapse_default:true / global
  collapseDefault now needs one click instead of two; collapsed:false + collapse_default:true now shows the list. Unchanged:
  collapsible:false, collapsibleDefault, session persistence, note writes, per-group collapse.
| r3 fix | orchestration:implementer (fresh; r1 identity is dead) | dispatched 2026-09-25 | sc255-r3-fix-report.md |
| r3 fix | (as above) | 2026-09-25: DONE. DSE e9780d3/20b188c/5724710/4ff0b88 (final 4ff0b88). jest 3998/1 skipped/206 of 207; lifecycle 6/6; shots 524 0 FAIL; freeze exactly 20 = rebaseline.txt, hashes byte-identical; parity 0/0/16. LOW-6 tests fail on base view.ts | sc255-r3-fix-report.md |
| r4 scoped re-review | r2 reviewer resumed (not author of r3) | dispatched 2026-09-25 | sc255-r2-review-report.md "## r3 delta re-review" |
| r4 scoped re-review | r2 reviewer | 2026-09-25: APPROVE on 4ff0b88. 0 H/M/L, 3 INFO -> DROP all (spec "sanctioned separately" wording becomes true at landing, which requires the sanction anyway; test-title and CSS-comment wrap nits) | sc255-r2-review-report.md |

## Status 2026-09-25
- Land candidate: DSE sc255-skills-collapse @ 4ff0b88 on develop 6c4f6aa (current tip). Needs Scott: visual OK + 20-line freeze sanction (rebaseline.txt). Consolidated ask: sc255-needs-review-comment.md.
- 2026-09-25: the r1 implementer came back late and ran the full battery on 4ff0b88 independently. Results were the same, the tree is clean, and rebaseline.txt still matches the shots on disk, so this is a third deterministic run. Its report is sc255-r1-impl-report.md. Its behaviour list is superseded by r2 §1 (MEDIUM-1).

## Scott ruling 2026-09-25 18:34 UTC (SC-255 comment ec5cf1c9), verbatim, answering owner ask 15a5f267 (visual OK? + 20-line freeze sanction; "Reply \"sanctioned\" to approve both, or tell me what to change."):

> "this looks good."

He then moved the ticket Needs Review -> Ready for Agent.
Owner reading: approves the visual AND the rebaseline. The rebaseline encodes only the change he approved, and the ask said one reply approves both. NOT the literal word "sanctioned"; this caveat goes to the dispatcher verbatim.

## Dispatcher update 2026-09-27
- origin/develop is now 36635e9 (SC-282/340/243/230/272 landed). SC-236 is landing on top with an 8-line feature-print rebaseline; fetch right before rebasing. The baseline stays at 260 lines.
- obsidian-lifecycle now runs 19 scenarios. The owner posts with --model opus-5.5.
- After the rebase, recompute rebaseline.txt against the then-current 260-line baseline and re-run the full battery.
| r5 rebase+regate | orchestration:implementer (fresh) | dispatched 2026-09-27 | sc255-r5-rebase-report.md |
| r5 rebase+regate | implementer | 2026-09-27: DONE. Rebased onto ade5064 (CHANGELOG-only conflicts, trivial, no review needed; owner checked the diff). DSE head b029baa (7 commits), superproject pointer commit 2a7402b (worktree, unpushed). Base freeze 260/260 OK. tsc/lint clean; jest 4101/1 skipped/211 of 212 (base 4100, +1); lifecycle 19/19; shots 524 0 FAIL; freeze exactly the 20 skills names; parity 0/0/16. rebaseline-r5.txt == rebaseline.txt byte-for-byte (20 lines). | sc255-r5-rebase-report.md |
- 2026-09-27: LAND-READY reported to dispatcher. Sanction record = ec5cf1c9 "this looks good." (not literally "sanctioned"; caveat passed on).
