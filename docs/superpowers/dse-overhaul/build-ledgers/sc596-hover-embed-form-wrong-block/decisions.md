# SC-596 decisions ledger — a block edit form on a block embed or hover of a block can save into an identical block when the block was edited from outside before the form opened (latent)

Worktree: /home/scott/code/steelCompendium/worktrees/sc596-hover-embed-form-wrong-block (branch sc596-hover-embed-form-wrong-block in every submodule)
Cut from: dse develop da2bdbc6 (= origin/develop at cut), 2026-11-11.
Baseline at da2bdbc6: jest 7671 passed / 2 skipped (fresh worktree) · lifecycle 58/58 in SIX `--only` parts (21 + 16 + 9 + 4 + 7 + 1) ·
e2e `272/276 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` (known bugs SC-257, SC-355, SC-384, SC-580) · shots 592, host-leak
163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24.
Lifecycle parts: 1 `G-S7a … G-S9a` 21; 2 `G-S9b … G-S40` 16; 3 `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` 9 (~423-480 s: NO
new G-S64 phases); 4 `G-S57 G-S62 G-S61 G-S56` 4 (G-S56 stays LAST in SCENARIOS order); 5 `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S91` 7
(~395 s, full); 6 `G-S92` 1 (~103 s). A new scenario goes in part 6 or its own part. Lifecycle id reserved: G-S96.
Parallel owners: SC-603 (initiative focus after minion pool Apply / roster cell edit), SC-606 (montage logged-action edit, no skills list).
Related, not ours unless the same fix covers it (tell the dispatcher BEFORE widening): SC-607 (a still-open preview's card write follows
what its link names now), SC-524.
Prior art (landed; ledgers in docs/superpowers/dse-overhaul/build-ledgers/ and .superpowers/sdd/<effort>/): SC-594 (hover-link,
`rebaseCardPin`, `cardLinkLine`, G-S92; r1 design report open question 3 = this ticket's hover-form idea), SC-584 (filed this ticket;
`lastWrite`, `pinFromLastWrite`, G-S77; sc584-r2-review-report.md INFO-1 / INFO-3, probe sc584-r2-probe.test.ts.txt), SC-556, SC-480,
SC-595, SC-598.

## Rulings (verbatim, dated)
- **2026-11-10 13:54 UTC, Scott (SC-556 comment; governs refusals in this area — option 1 was "Save nothing. The form stays open and a
  Notice says: 'Draw Steel Elements: a change to a block in <note> was not saved — the block changed on disk first.' The outside change
  is kept."):**
  > Save nothing with a notice is fine.

## Owner constraints (from the ticket's agent notes and SC-584/SC-594 history, not Scott rulings)
- Goal: a block edit form opened in an embed of part of a note (`![[note#^a]]`, `![[note#Heading]]`) or a hover preview of a block or
  heading link never saves into an identical twin block. When the form's own block is determinate, Save writes it; when not, Save
  writes nothing and shows the existing Notice (Scott's ruling above).
- Invariant (SC-480/SC-556/SC-594): never a write into an identical twin. When unsure, refuse.
- The two named hazards: INFO-1/P4 (`searchedPinLine` places a block-only part, no context lines, on a twin when the block was edited
  before open) and INFO-3/P13 (a form with a NULL pin saves without `pinOnly`). Check what is left of each at da2bdbc6 after SC-584 and
  SC-594 before designing.
- SC-584 lesson (same class three review rounds): any placement rule must be swept across constructs (plain fence, callout, header-less
  quote, quote whose first line is a fence, nested quote/callout, list item, footnote), link shapes (block embed, heading embed, block
  hover, heading hover, whole-note embed/hover), RV and LP, before review — not shape by shape after.
- Do not regress the shapes that save today (SC-584 r5 probe: two identical counters, no + first, pencil on the lower, Save writes the
  lower, block and heading embeds, RV and LP).

## Log
- 2026-11-11 owner: ticket read (Backlog, no comments). Worktree created at da2bdbc6. Ledger opened.
- 2026-11-11 owner: ticket Backlog -> Awaiting (verified). r1 design/survey dispatched (orchestration:reviewer, brief
  sc596-brief-r1-design.md): what is left at da2bdbc6 (jest sweep), real-Obsidian reachability after SC-595, one placement rule for
  form pins with probe diff + sweep + mutants, SC-607 overlap yes/no. No product commits.
- Identities: designer-r1 = reviewer agent a6475695 (designs only). Implementer r2 = a fresh orchestration:implementer. Review of the
  implementation = a fresh orchestration:reviewer identity (NOT designer-r1).
- 2026-11-11 dispatcher: SC-603 landed, dse develop 5f7c5336 (supersedes da2bdbc6; initiative tracker focus after minion pool Apply and
  the Conditions window; new e2e focus-after-modal spec). New CURRENT: jest 7685 passed / 2 skipped (fresh worktree) · lifecycle 58/58
  (21 + 16 + 9 + 4 + 7 + 1) · e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs` · shots 592, host-leak 163/978, modal
  host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24. Must rebase onto 5f7c5336 before land-ready.
  - Owner plan: r1 design worker stays on da2bdbc6 (no product commits; SC-603 touches the initiative tracker, not the host write path).
    The r2 implementer rebases onto 5f7c5336 (or later develop) FIRST and gates there; common gates file updated.
- 2026-11-11 owner: r1 design DONE (sc596-r1-design-report.md; probe rule sc596-r1-probe-rule.diff.txt; sweep 2880 jest cells: base
  writes the twin in 392, probe 0; 36 refused -> saved; 12 saved -> refused; SC-584 r5 shapes 7/7 still save; mutants 17, 14 killed,
  m4/m12 equivalent, m14 unreachable). **LIVE in real Obsidian 1.15.1 at da2bdbc6**: with the source note also open in another pane
  the redraw does not close the form (SC-552 `keepFormOpenOn`); Save wrote the twin, no Notice, in 5 of 6 cells (block embed RV,
  heading embed RV, block hover RV, heading hover RV and LP). Without that pane the form closes 49-98 ms after open, nothing written.
  The probe bundle wrote nothing in 13/13 cells (pane cells: one Notice, form open).
- Owner rulings on r1:
  - Rule: ADOPT the r1 rule (report §C items 1-3) as the implementation spec: a form's pin in an embed / hover preview of PART of a
    note is placed exactly like a card's (`rebaseCardPin`: the link checked by `cardLinkLine`, else this host's own last write when it
    is of the known body, else refused); never `verifiedPinLine` / `searchedPinLine`. A form there that cannot be pinned gets a
    REFUSING pin (nothing written, forced Notice), never a null pin; list items / footnotes keep their "inside lists" wording. Cards and
    non-embedded hosts unchanged. Delete `rebasePin`, `verifiedPinLine`, `embedStartLine`, `searchedPinLine` once callerless.
  - Q1 (12 saved -> refused cells: heading embed of a note with two identical `## Tracker` sections, nothing edited; and the 6
    by-design flips incl. lagging cache, unresolved subpath, no cache, X1 paragraph edited inside the part): ACCEPTED, no Scott ask —
    same as SC-594 Q2 for cards, and refusals are covered by Scott's 2026-11-10 ruling. The looser `verifiedPinLine` alternative (m7)
    is rejected: it reopens Y1-class guesses and refuses the 36 hover cells again.
  - Q2 (a refusing pin makes `hasPin()` true, so the form is kept open past its card): ACCEPTED — it matches Scott's ruling's option
    text ("The form stays open and a Notice says…"); closing would silently drop typed text. CONDITION: the implementer lists every
    shape whose close-on-redraw behaviour changes (incl. list items / footnotes), and the reviewer checks none of them can write.
  - Q3 (G-S96 needs the second-pane cells; part 6 `G-S92 G-S96`, ~+50 s): ACCEPTED. Red on base must be shown (5 TWIN, no Notice).
    Fixtures follow the tracker section with another heading.
  - Q4 (card null-pin path, same mechanism, unmeasured): FOLD-IF-SAME. r2 measures it in jest first (stale non-plain window, no
    own-write record, card + / -, block/heading embed and hover, RV/LP). If any cell writes the twin, apply the same refusing pin to card
    writes there, with tests; if none does, report the numbers and leave the code alone.
  - SC-607: NOT covered (forms inherit the same limit). Not widened.
  - Test-plan note from r1 adopted: W1's assert must be `['Twin','Edited']` (m5/m8 die only on it).
- 2026-11-11 owner: r1 comment posted (the bug is live with a second pane; fix plan; the one rare shape that will refuse). No ask, state
  stays Awaiting. r2 implementation dispatched (orchestration:implementer a346a3ec, brief sc596-brief-r2-impl.md): rebase onto 5f7c5336
  first; rule + refusing pin; Q4 measured first; tests red on base; G-S96 red on base; CHANGELOG; dse-verify proposal file.
- 2026-11-11 owner: r2 DONE (implementer a346a3ec). dse HEAD c02598c1 on 5f7c5336; superproject CHANGELOG commit 88322232. jest 10600 /
  2 skipped (+2915, new file reading-mode-host-form-pin.test.ts; 1179 red on base); lifecycle 59/59 six parts (part 6
  `G-S92,G-S96` 176 s; G-S96 8 cells, 7 pane cells TWIN on base); e2e 278/282 0 failed 171/171; styles.css unchanged; mutants 18, 16
  killed (m4/m12 equivalent). Q4: card sweep 0 twin, but 5 named null-pin card shapes wrote the twin at base -> folded (refusing pin
  for cards too). G-S64 (zh) re-targeted (hover form on `[[note#^id]]` now saves into the linked block — the 36-cell class).
- Owner rulings on r2 follow-ups: card refusing-pin Notice rate-limited like other card Notices (5 s per note) — DROP (existing,
  documented card Notice policy, SC-556 bullet). Others are notes, no tickets.
- r3 review dispatched to a FRESH orchestration:reviewer (not designer-r1 a6475695, not implementer a346a3ec), brief sc596-brief-r3-review.md.
- 2026-11-12 dispatcher: SC-606 landed, dse develop 7866426e (supersedes 5f7c5336; `src/elements/montage/model.ts` only, +22 jest).
  New CURRENT: jest 7707 passed / 2 skipped (fresh worktree) · lifecycle 58/58 (six parts) · e2e `278/282 ok, 0 failed, 4 known-bug,
  coverage: 171/171 pairs` · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24.
  Must rebase onto 7866426e before land-ready.
  - Owner plan: r3 reviewer stays on c02598c1 (montage model only; disjoint from the host write path). The fix round (or a final
    rebase round) rebases onto 7866426e and re-runs the full battery there: expected jest 7707 + 2915 = 10622 / 2 skipped.
- 2026-11-12 owner: r3 review DONE (fresh reviewer af9dd0ce): verdict LAND on c02598c1, CRITICAL/HIGH/MEDIUM 0, LOW 3, INFO 9. Gates
  re-run match r2; G-S96 red on an independent base build (7/7 twin), green on head, not vacuous; (zh) re-target correct and has teeth
  (k25); Q4 fold confirmed (4/4 twin at base); Q2 condition holds. Mutants k-series 14, 11 killed (k8/k15 equivalent, k6 = LOW-1).
- Owner rulings on r3 (all FOLD into r4, the rebase round onto 7866426e):
  - LOW-1 (no test pins the `embedded ?` guard, ReadingModeBlockHost.ts:835; mutant k6 survives): FOLD — add the r3 k6 probe as a
    jest test (card in a callout of a NON-embedded note, second + while the callout still shows the pre-first-+ text: must land) plus
    `pinPosition()` null for a non-embedded list-item host. k6 must die.
  - LOW-2 (shapes that saved at base now refuse, unnamed in report/CHANGELOG): FOLD docs-only — name them in the CHANGELOG bullet and
    proposal §1. All safe; covered by Scott's 2026-11-10 ruling.
  - LOW-3 (forms share SC-594's block-hover residual: a block hover bound to another block's link; jest-only): FOLD docs-only into
    proposal §3/§4. No code change.
  - OWNER item: the CHANGELOG says the refusal Notice is "changed on disk first", the proposal §1 says a refusing pin shows "can't tell
    where". Make both say exactly which Notice appears in which case (measured, not assumed), and shorten the CHANGELOG bullet: plain
    words, the user-visible change first, the rare refusing shapes in one sentence.
- 2026-11-12 owner: r4 DONE (implementer a346a3ec): dse HEAD c6077860 on 7866426e; superproject CHANGELOG bb622f86 (6-line bullet).
  LOW-1 tests added (k6 and k6b die); LOW-2/LOW-3 docs; Notices measured ("changed on disk first" when a pin exists and nothing places
  it; "can't tell where" for a refusing pin; list / plain wordings; N3 FormModal "couldn't save — the block may have moved").
  Gates: tsc/lint 0; jest 10624 / 2 skipped (7707 + 2917); lifecycle 59/59 (185/323/409/294/390/175 s); e2e 278/282 0 failed 171/171;
  styles.css unchanged vs 7866426e. Owner read the CHANGELOG diff personally: accurate and plain.
- r5 scoped re-review of the r4 delta dispatched to the r3 reviewer af9dd0ce (not the author of the delta).
- 2026-11-12 owner: r5 scoped re-review DONE (af9dd0ce): LAND on c6077860 / 7866426e, 0 findings above INFO. Range-diff 7/7 `=`, product
  code unchanged since c02598c1; k6 and the reviewer's k6b die; docs match code; jest 10624 / 2 skipped; lifecycle/e2e carry (build sha
  match, reflog timing).
  - I-1 (proposal CURRENT count 31+6 -> 29+8): FIXED by owner in the proposal file (ledger file, one number).
  - I-2 (CHANGELOG omits two by-design refusals, cache lag and X1): DROP — proposal §1 holds them; the CHANGELOG stays short.
  - I-3 (gate logs should echo HEAD): DROP — process nit, verified by build sha this time.
- LAND-READY: dse c6077860 on develop 7866426e; superproject CHANGELOG bb622f86 (pointer not bumped); dse-verify proposal
  sc596-dse-verify-proposal.md for the dispatcher to apply. Gates: tsc/lint 0; jest 10624 / 2 skipped; lifecycle 59/59 (six parts,
  part 6 `G-S92,G-S96` 175 s); e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`; styles.css unchanged -> shots 592,
  host-leak 163/978, modal host-leak 39/234, capture clip 147, freeze 280/280, parity 0/0/24 carry.
- 2026-11-12 owner: DONE. Dispatcher landed dse develop c6077860 (7866426e..c6077860, 8 commits), workspace main 91e55314 (dbe7b9b7
  CHANGELOG re-applied after a superproject merge conflict, b6a0c6f8 pointer, 443d7595 bookkeeping); dse-verify proposal applied
  (59/59, part 6 `G-S92 G-S96`, CURRENT at c6077860); worktree removed; ledger preserved in build-ledgers/. Done comment posted via
  linear-post.py `--state Done`; state verified Done (labels DSE Plugin, Bug unchanged). Follow-ups live: SC-607 (Backlog).
