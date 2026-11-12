# SC-594 decisions ledger — a + / - click in a hover preview of a heading link does nothing when an identical counter sits elsewhere in the note

Worktree: /home/scott/code/steelCompendium/worktrees/sc594-hover-heading-card-write (branch sc594-hover-heading-card-write in every submodule)
Cut from: dse develop ce4937ef, worktree superproject d85f7691, 2026-11-11.
Baseline at ce4937ef: jest 7286 passed / 2 skipped (fresh worktree) · lifecycle 56/56 (five --only parts) · e2e `264/269 ok, 0 failed,
5 known-bug, coverage: 164/164 pairs` (known bugs SC-257, SC-355, SC-384, SC-580, SC-588) · shots 592, host-leak 163/978,
modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24.
Lifecycle parts: `G-S7a … G-S9a` 21; `G-S9b … G-S40` 16; `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` 9 (~480 s: NO new
G-S64 phases); `G-S57 G-S62 G-S61 G-S56` 4 (G-S56 stays LAST); `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87` 6 (~347 s).
Lifecycle id reserved for this ticket: G-S92 (goes in part 5; must keep part 5 well under the 600 s tool-call limit, else propose a split).
Parallel owners: SC-588 (initiative tracker keyboard focus after a rebuild), SC-598 (fast second click in a modal opened from a hover
preview closes it — same hover preview, different code: the modal click guard). Not ours: SC-596 (Backlog, latent wrong-block write on
block embeds / null-pin forms), SC-599.
Prior art (landed; ledgers in docs/superpowers/dse-overhaul/build-ledgers/): SC-584 (filed this ticket; `lastWrite` record, G-S77,
G-S64 phases; sc584-r2-review-report.md INFO-2 = P14; sc584-r2-probe.test.ts.txt), SC-480 (refuse-when-ambiguous twin rule,
`twinned`/`countByBody`, G-S73), SC-556, SC-595, SC-597.

## Rulings (verbatim, dated)
- **2026-11-10 13:54 UTC, Scott (SC-556 comment; governs refusals in this area — option 1 was "Save nothing. The form stays open and a
  Notice says: 'Draw Steel Elements: a change to a block in <note> was not saved — the block changed on disk first.' The outside change
  is kept."):**
  > Save nothing with a notice is fine.

## Owner constraints (from the ticket's agent notes and SC-584/SC-480 history, not Scott rulings)
- Goal: a + / - in a hover preview of `[[long note#Heading]]` whose counter has an identical twin elsewhere in the note is SAVED (into
  the hovered counter) when the position is determinate; refuse (Notice, nothing written) when it is not.
- Invariant (SC-480, G-S73): never a card write into an identical twin. When unsure, refuse.
- P14 (pre-existing wrong-block write): a card write from a BLOCK-link hover (`[[note#^a]]`) writes the identical twin when the block
  was edited from outside before the click (`twinned` counts the known body in the stale `pin.text` = 0; `landsOnOtherBlock` skipped for
  a partial pin). The fix MUST refuse that shape too.
- SC-584 lesson (3 review rounds of the same class): a body search inside a stale multi-block window picks the twin. Any placement rule
  must be swept across constructs (plain fence, callout, header-less quote, quote whose first line is a fence, nested quote/callout,
  list item, footnote), link shapes (heading hover, block hover, whole-note hover), RV and LP, before review — not shape by shape after.

## Log
- 2026-11-11 owner: ticket read (Backlog, no comments). Worktree created at ce4937ef (= origin/develop). Ledger opened.
- 2026-11-11 owner: ticket Backlog -> Awaiting (verified). r1 design/survey dispatched (orchestration:reviewer, brief
  sc594-brief-r1-design.md): measure what a heading-hover card can see at click time, reproduce the ticket + P14 in real Obsidian,
  propose a click-time rule with a full construct sweep before any implementation. No product commits.
- Identities: designer-r1 = reviewer agent a109dc4c (designs only). Implementer = a fresh orchestration:implementer (r2). Review of
  the implementation = a fresh orchestration:reviewer identity (NOT designer-r1), so the review is not anchored on the design.
- 2026-11-11 dispatcher: SC-588 landed, dse develop e0e49d4d (supersedes ce4937ef): initiative tracker keyboard focus after whole-tracker
  rebuilds, new e2e INIT focus steps. New CURRENT: jest 7304 passed / 2 skipped (fresh worktree) · lifecycle 56/56 · e2e `270/274 ok,
  0 failed, 4 known-bug, coverage: 169/169 pairs` (known bugs SC-257, SC-355, SC-384, SC-580) · shots 592, host-leak 163/978, modal
  host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24. Must rebase onto e0e49d4d before land-ready.
  - Owner plan: r1 design worker stays on ce4937ef (no product commits; SC-588 touches the initiative tracker, not the host write path).
    The r2 implementer rebases the worktree branch onto e0e49d4d (or later develop) FIRST and gates there; common gates file updated.
- 2026-11-11 owner: r1 design DONE (sc594-r1-design-report.md; probe rule sc594-r1-probe-rule.diff.txt; sweep 284 jest cells: base writes
  the twin in 40 cells, probe 0; 60 refused -> saved, 0 saved -> refused; mutants 12/13 killed, mM equivalent). Measured: a hover card's
  section text is the heading's BODY only (no heading line, lineStart 1), so it matches the twin; the only non-private signal naming the
  hover's subpath is Obsidian's `hover-link` workspace event. P14 is real in Obsidian inside the 17-44 ms before the preview redraws
  (scripted click wrote the twin in 8/8 cells on base; probe refused all 8).
- Owner rulings on r1:
  - Rule: ADOPT the r1 rule (report §B, items 1-7) as the implementation spec, with the change below.
  - Q1 (`hover-link` payload, untyped but the event is named in the public docs; absent -> refuse): ACCEPTED, no Scott ask — its failure
    mode is a refusal, which Scott's ruling covers. Register the listener in the plugin's `onload` (the probe's lazy registration refused
    the first hover after start-up).
  - OWNER CHANGE to rule item 1 (pass-over hazard the design did not test): `hoverLinkOf` picks "the newest event whose
    `hoverParent.hoverPopover.hoverEl` is the card's popover". If the pointer passes over another link Y on the same hoverParent while
    popover X is open and Y's popover never opens (pointer left Y before the delay), Y's event becomes the newest one matching X; if Y names
    a heading whose body is identical to X's (the ticket's own shape: two headings each holding only the identical counter), the whole-part
    check passes at Y's place and X's + writes the twin. Required: bind the link to the popover ONCE, at the first lookup for that popover
    element (memo `WeakMap<hoverEl, record>`; the first card render in a popover happens right after that popover's own event), and reuse
    the memo for every later lookup in that popover (redraws, second +). Measure in real Obsidian when a hover card's host first looks up
    vs when the popover is created; if a lookup can come later than another event on the same hoverParent, say so and propose. Jest J17
    (Y event after X's first lookup -> X still writes A; Y identical-body heading) red without the memo + a mutant (no memo) that dies.
  - Q2 (a link naming two places + a twin body -> refused): ACCEPTED.
  - Q3 (hover link for FORMS): NOT in scope; appended as a fix idea to SC-596's agent notes (done 2026-11-11).
  - Q4 / INFO-3 (card keeps showing the unsaved value after a refused card write): appended to SC-524 (same cause class: card/remembered
    body move before the write is accepted). Not filed separately. Out of scope.
  - INFO-1 (card writes in RV/LP `![[note#H]]` / `![[note#^id]]` embeds write the twin when the block was edited before the click; 40
    cells) and INFO-2 (second + in a callout's stale window writes the twin callout): IN SCOPE — the rule closes them; tests required
    (sweep + J16).
  - Test plan (report §Test plan, J1-J16, sweep test.each, 6 changed existing tests, mutants mA-mL, G-S92 (a)-(i) in part 5): ADOPTED,
    plus J17 + the memo mutant above.
- 2026-11-11 owner: r2 implementation -> fresh orchestration:implementer (brief sc594-brief-r2-impl.md); rebase onto e0e49d4d first.
- Identities: implementer-r2 = agent aef741ab (author; fix rounds resume it). Review r3 = a FRESH orchestration:reviewer (not designer-r1
  a109dc4c, not the author). Scoped re-reviews resume the r3 reviewer.
- 2026-11-11 owner: r2 DONE_WITH_CONCERNS on base e0e49d4d. dse 0bf5989d (b9e0f7aa fix, 0d02f083/f37d9f00/9f1b1432 tests, 4250a2cb G-S92,
  0bf5989d CHANGELOG); superproject 088a24fb (CHANGELOG). jest 7616 passed / 2 skipped (+312); lifecycle 21/16/9/4/7 = 57/57 (p3 404 s,
  p5 425 s); e2e 270/274 0 failed 4 kb 169/169; styles 5e5ff488 = base -> shots/freeze/parity carry. Red on base: 119 jest, G-S92 9/9.
  Mutants 18/20 killed (mM equivalent; mL2 = r7 guard for cards, no distinguishing test found).
- Owner rulings on r2:
  - Deviation (memo binds at the first lookup OR when the next `hover-link` event on the same hoverParent arrives, whichever first;
    measured: a card is mounted detached and joins the popover 10-14 ms later, so the first lookup is the click, and a pass-over 656 ms
    in wrote the twin with the memo alone): ACCEPTED pending r3 — it satisfies the ruling's intent (the link is the one that opened the
    popover). r3 attacks the residual (another link's event before the popover exists).
  - Concern 1 (both CHANGELOGs' SC-595 bullet says "+ or - in a preview with an identical counter elsewhere is unchanged (SC-594)" —
    stale once this lands): FOLD into the next round (reword/remove that clause; Unreleased).
  - mL2 survivor: r3 judges equivalent vs test gap; if a gap, a test in the fix round, else document as equivalent.
  - Concern 3 (Bash tool backgrounds calls >180 s even with a long timeout): goes into sc594-dse-verify-proposal.md as a battery note
    (fold in the next round).
- 2026-11-11 owner: r3 independent review -> fresh orchestration:reviewer (brief sc594-brief-r3-review.md), range e0e49d4d..0bf5989d.
- Identities: reviewer-r3 = agent af5a9cc3 (fresh). Fix rounds -> implementer-r2 aef741ab (resume); scoped re-review -> reviewer-r3 (resume).
- 2026-11-11 owner: r3 review FIX FIRST on 0bf5989d: 0 CRIT, 1 HIGH, 1 MEDIUM, 3 LOW, 5 INFO (sc594-r3-review-report.md). Gates on HEAD
  green (jest 7616/2, p5 7/7 426 s, p3 9/9 408 s, e2e 270/274 0 failed 4 kb 169/169, styles = base). Memo deviation sound (INFO-1);
  G-S92 control real (INFO-2); conditional await load-bearing (mX13).
- Owner rulings on r3:
  - HIGH-1 (heading hover writes the wrong counter, no Notice, when the metadata cache lags an outside edit: `## Other` moved above
    `## Tracker` -> writes Other (regression; base refused); identical `## Tracker` pasted above -> writes the top one (regression);
    `## Tracker` deleted -> writes the counter under `## Other` (pre-existing); cause: `cardLinkLine` takes the heading line from the
    cache (`resolveSubpath(meta)` :980, `meta.headings` :990) and never checks line `start` against the note text (`partStart = start+1`
    :999)): FOLD into r4 with the reviewer's fix: place a heading link from the NOTE TEXT — the line the part hangs from must be, in the
    note text, an ATX heading line whose name is the link's heading; count matching heading lines in the text (not `meta.headings`) for
    the one-place check. Owner addition: 0 matching heading lines in the text -> refuse. If the hanging-line check plus a text count do
    not refuse all three shapes, keep the one-place check even when the body is unique (reviewer's variant) and say what that costs
    (J7/J11). Same principle for block links: the `^id` count comes from the text (see mX12). Tests: P9a/b/c as named jest tests (red on
    0bf5989d), and G-S92 trial (j) for the swap shape.
  - MEDIUM-1 (CHANGELOGs + proposal promise refusals the code does not give): FOLD — after r4, rewrite both CHANGELOG bullets and the
    proposal to state only what r4 guarantees; also the stale SC-595 clause (r2 ruling) and the >180 s Bash note.
  - LOW-1 (mL2 is a test gap; the r7 guard for cards is load-bearing; probe P1): FOLD — J19 named test; comment calls the guard
    load-bearing.
  - LOW-2 (the link binding can name another link's place: plugin-load + pass-over P2, r2's residual P3; with a whole-note link the
    whole-part check never runs; not reachable by a real pointer in 1.15.1): FOLD the reviewer's cheap hardening — cross-check the bound
    link against the popover's DOM (`.markdown-embed[data-type]` heading / block / whole, and the first heading's `data-heading` equal to
    the link's heading) and refuse on mismatch; previews already open when the listener registers get no link. P2/P2b/P3/P3b as jest
    tests (refused).
  - LOW-3 (`## Tracker: one` linked as `[[src#Tracker one]]` refused with a twin; safe, base also refused): proposal wording only (list it
    as refused). No code change.
  - INFO-3 test gaps mX10 (no link-destination check) and mX12 (no duplicate-`^id` count): FOLD — a test that kills each.
  - INFO-5 (G-S92 never hovers one link then another, T1 shape, ~8 s): FOLD as trial (k) if part 5 stays <= ~460 s with (j) and (k);
    otherwise keep it jest-only and say so.
  - INFO-1/2/4: no action.
- 2026-11-11 owner: r4 fix -> implementer-r2 aef741ab (resume). r5 scoped re-review -> reviewer-r3 af5a9cc3 (resume).
- 2026-11-11 dispatcher: SC-589 landed, dse develop b5d18f79 (supersedes e0e49d4d; initiative/view.ts Malice quick-add draft + caret
  survive rebuilds; e2e INIT-M10, INIT-M11). New CURRENT: jest 7328 passed / 2 skipped fresh · lifecycle 56/56 · e2e `272/276 ok, 0 failed,
  4 known-bug, coverage: 169/169 pairs` · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity
  0/0/24. Must rebase onto b5d18f79 before land-ready.
  - Owner: told implementer-r2 (SendMessage) to rebase onto b5d18f79 before its final gate run. Expected on the rebased branch: jest
    7328 + 312 (r2) + r4's new tests passed / 2 skipped; lifecycle 57/57; e2e 272/276 ok, 0 failed, 4 kb, 169/169; styles vs a clean
    b5d18f79 build. Common gates file updated.
- 2026-11-11 owner: r4 DONE on base b5d18f79. dse c36973e5, superproject bcdb8848. HIGH-1: heading placed from the note text (hanging
  line must be an ATX heading of the link's name; text count; 0 matches -> refuse); one-place check stays conditional on a twin body
  (hanging-line + text count refuse swap/paste/delete; J7/J11 still land). LOW-2: DOM cross-check (`data-type`, first `data-heading`) +
  no link for previews open at registration. J19 (mL2), J22 (mX10, mX12). G-S92 (j) red on 0bf5989d, (k) regression guard. jest 7658/2
  (7328 + 330); lifecycle 21/16/9/4/7 = 57/57 (p5 442 s); e2e 272/276 0 failed 4 kb 169/169; styles 5e5ff488 = clean b5d18f79. Mutants:
  all killed except mM (equivalent).
- Owner rulings on r4:
  - Conditional one-place check (not the reviewer's "always" variant): ACCEPTED pending r5 — the ruling allowed it if the three shapes
    refuse; r5 verifies in real Obsidian.
  - Follow-up 1 (setext heading refusal by logic only): r5 probes cheaply in real Obsidian (a `Tracker\n---` setext heading + twin: refuse
    or land in the hovered one, never the twin). If it writes the twin: fold.
  - Follow-up 2 (exact heading-name match): as ruled (LOW-3).
  - Follow-up 3 (pick the lifecycle node pid by /proc/<pid>/cwd when waiting): DROP as a separate item — dse-verify already says so
    (footgun 9 gap, SC-466).
- 2026-11-11 owner: r5 scoped re-review -> reviewer-r3 af5a9cc3 (resume), range 0bf5989d..c36973e5 (rebased onto b5d18f79).
- 2026-11-11 dispatcher: SC-598 landed, dse develop 8b84b635 (supersedes b5d18f79; `src/framework/kit/managedModal.ts` only: a modal opened
  from a hover preview focuses the preview for the opening click (preventDefault, one synthetic click on the anchor, `interactive-child`
  10 ms); an opener's test counting clicks through the preview now sees TWO; new lifecycle scenario G-S91). Lifecycle now 57 scenarios:
  part 5 = `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S91` (7; ~395 s, ceiling ~420 s) — NO room for G-S92; a new scenario needs a sixth part.
  New CURRENT: jest 7341 passed / 2 skipped fresh · lifecycle 57/57 (21+16+9+4+7) · e2e `272/276 ok, 0 failed, 4 known-bug, coverage:
  169/169 pairs` · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24. Must rebase
  onto 8b84b635 before land-ready.
  - Owner plan: r5 re-review continues on c36973e5 (not disrupted). Then one implementer round (fix round if r5 finds anything, else
    rebase-only) rebases onto 8b84b635 (or newer), resolves the SCENARIOS-order conflict (G-S91 and G-S92 both before G-S56; G-S56 stays
    LAST), and runs lifecycle in SIX parts: parts 1-5 as CURRENT (part 5 incl. G-S91), part 6 = `G-S92` alone (~95 s + start-up).
    sc594-dse-verify-proposal.md must propose the sixth part (list + wall times). Expected: jest 7341 + 330 passed / 2 skipped (~7671),
    lifecycle 58/58 (21+16+9+4+7+1), e2e 272/276 0 failed 4 kb 169/169, styles vs clean 8b84b635. Check that G-S92's real-mouse hover
    clicks still pass with SC-598's hover-preview modal change (G-S92 opens no modal, so expected unaffected) and that G-S91 passes.
- 2026-11-11 owner: r5 re-review FIX FIRST (docs only) on c36973e5: 0 CRIT/HIGH, 1 MEDIUM, 2 LOW, 4 INFO (sc594-r5-rereview-report.md).
  HIGH-1 closed in real Obsidian RV+LP; conditional one-place check fine; setext refused (twin never written); LOW-2 hardening holds, no
  false refusals; mutants reproduce; G-S92 (j) red on 0bf5989d. Gates on c36973e5 green (jest 7658/2, p5 7/7 445 s, p3 9/9 402 s, e2e
  272/276 0 failed 4 kb 169/169, styles = clean b5d18f79).
- Owner rulings on r5:
  - MEDIUM-1 (with a FRESH cache a + in a still-open preview follows the link's CURRENT target; the preview never redraws when its part
    text is unchanged; hovered one of two identical `## Tracker` sections deleted / heading names swapped -> writes the other counter, no
    Notice; base b5d18f79 writes too; docs claim refused): docs FOLD — reword both CHANGELOG bullets and proposal item (2), drop the
    "17-44 ms window" framing for edits that leave the part's text unchanged, add a known-limit line naming SC-607. The code fix (pin the
    card to the note as drawn at mount, map at click): FILED SC-607 (Backlog, Low, related SC-594/SC-480). Out of scope.
  - LOW-1 (two block links: an `^a` preview bound to `^b` still writes the twin in jest; DOM cannot tell block previews apart; not
    reachable by a real pointer): docs FOLD — say the DOM check closes the residual for heading links only.
  - LOW-2 (mutant mZ6: heading regex accepting `#Tracker` tag line survives): FOLD — add a tag line to the `atxHeadings` unit test; mZ6 dies.
  - INFO: no action.
- 2026-11-11 owner: r6 final round -> implementer-r2 (resume): docs + mZ6 test, rebase onto 8b84b635 (SC-598) or newer, lifecycle in SIX
  parts (G-S92 alone in part 6), full battery. No further reviewer round for the code (unchanged since r5's SHIP-on-code); owner checks
  the range-diff and the docs wording personally.
- 2026-11-11 owner: r6 DONE on base 8b84b635 (= origin/develop, verified). dse da2bdbc6 (15 commits), superproject 6b07b11c (CHANGELOG
  only). range-diff b5d18f79..c36973e5 vs 8b84b635..da2bdbc6: all fix/test commits `=`; lifecycle commit `!` (G-S91 merge + (j)/(k)
  folded); 3 new (`#tag` atxHeadings test, CHANGELOG reword, G-S92 header comment). jest 7671/2 (7341 + 330); lifecycle 21/16/9/4/7/1 =
  58/58 (p5 393 s, p6 G-S92 103 s); e2e 272/276 0 failed 4 kb 169/169; styles 5e5ff488 = clean 8b84b635. mZ6 killed.
  - Owner checks: range-diff and both CHANGELOG bullets read personally (accurate; stale SC-595 clause removed; SC-607 named). Fixed one
    stale phrase in sc594-dse-verify-proposal.md ("part 5, after G-S87" -> "its own part 6; after G-S91, before G-S56").
- 2026-11-11 owner: LAND-READY. Comment posted (sc594-comment-land-ready.md); ticket stays Awaiting until landed. Reported to the dispatcher.
  At landing: apply sc594-dse-verify-proposal.md (six lifecycle parts; CURRENT), preserve this ledger dir to build-ledgers/, then Done via
  linear-post.py `--state Done` and verify.
- 2026-11-11 owner: DONE. Dispatcher landed dse develop da2bdbc6, workspace main 3d81d85d (39bc1364 CHANGELOG squash, 435e6287 pointer, 288e76d0 bookkeeping); dse-verify proposal applied. Landed comment posted via linear-post.py with `--state Done`; state verified Done (labels DSE Plugin, Bug unchanged). Follow-ups live: SC-607 (new), SC-596, SC-524 (Backlog).
