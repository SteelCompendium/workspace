# SC-596 r1 — design/survey round (orchestration:reviewer). NO product commits.

## Context loading (read first)
1. Ledger: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc596-hover-embed-form-wrong-block/decisions.md
2. Common gates/footguns (binding): …/sc596-hover-embed-form-wrong-block/sc596-brief-common-gates-footguns.md
3. dse-verify skill (/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md, ~320 KB — read in parts with
   offset/limit or grep): section "Block edit form Save and embeds (SC-556)" (line ~336) incl. the SC-584 bullet and "Hover card
   writes (SC-594)", and "Hover preview modals (SC-595)" (line ~405). Also the lifecycle/Obsidian-driving sections you need.
4. Prior art (read executive summaries, dive only where needed):
   - SC-584: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc584-embed-form-save-refusals/sc584-r2-review-report.md
     (INFO-1 = P4, INFO-3 = P13) and its probe sc584-r2-probe.test.ts.txt in the same dir.
   - SC-594: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc594-hover-heading-card-write/sc594-r1-design-report.md
     (open question 3; the method of its sweep: sc594-r1-sweep-table.txt, sc594-r1-probe-rule.diff.txt, sc594-r1-mutate.py.txt are
     good templates), sc594-r6-final-report.md.
5. Code (dse worktree, at da2bdbc6): src/…/ReadingModeBlockHost.ts (`rebasePin`, `verifiedPinLine`, `searchedPinLine`,
   `pinFromLastWrite`, `takePin`, `findOwnFence`, `locateInSection`, `rebaseCardPin`, `cardLinkLine`, `partialPins`,
   `pinnedTarget`), src/framework/host/hoverLinks.ts, FormModal.ts (`pinOnly`, ~543-545 at 525115b0 — find the current lines),
   test/…/reading-mode-host-pin.test.ts.
Worktree: /home/scott/code/steelCompendium/worktrees/sc596-hover-embed-form-wrong-block (dse at da2bdbc6 = origin/develop). Run
`git -C <dse> fetch origin` and report whether origin/develop moved; stay on da2bdbc6 for this round either way.
Workers never call the tracker.

## The ticket (latent wrong-block write)
A note has two identical counters. The edit form (pencil) is opened on one of them from a block embed (`![[note#^a]]`), a heading
embed, or a hover preview of a block/heading link. Just before the form opens, that block is edited from outside. The form's Save
then writes into the OTHER, identical counter. Two named mechanisms (SC-584 r2): INFO-1/P4 `searchedPinLine` places a block-only part
(no context lines) on a twin; INFO-3/P13 a form opened with a NULL pin saves without `pinOnly`. SC-584 then added the `lastWrite`
record (covers + then pencil); SC-594 added link-verified placement for CARD writes only ("forms unchanged (SC-596)").

Scott's governing ruling (verbatim, 2026-11-10, SC-556): "Save nothing with a notice is fine." So any undeterminable case must refuse
(nothing written, the existing Notice), never write a twin.

## Task — four bounded parts. Answer each; do not implement for landing.
A. **What is left at da2bdbc6 (jest).** Re-run P4 and P13 (port from sc584-r2-probe.test.ts.txt) and sweep the form-Save shape
   "block edited from outside before the form opens, an identical twin elsewhere" across constructs (plain fence, callout, header-less
   quote, quote whose first line is a fence, nested quote/callout, list item, footnote) x link shapes (block embed, heading embed,
   block hover, heading hover, whole-note embed/hover) x {no + before, + before}. Also the null-pin path in general: which shapes give
   a form a null pin, and what does Save do then. Table: cell -> lower / upper (twin) / refused. Note any cell that writes the twin.
   Remember SKILL's jest notes (heading hover's part = heading BODY, `lineStart` 1, not the `part(SUB, 2)` jest model; `cachedRead`
   + fake timers).
B. **Reachability in real Obsidian 1.15.1 at da2bdbc6.** The ticket says the outside edit's redraw closes the form first (SC-584 r2: 4
   cells, closed 16-120 ms after open). SC-595 since anchored hover forms (`DseModal.anchorTo`). Re-measure a small set (at most ~6
   cells: block embed, heading embed, block hover, heading hover; RV and LP as budget allows): does the form still close, and if it stays
   open, what does Save write? A twin write here makes this a LIVE bug — say so prominently. Use a private scratch lifecycle scenario
   (not committed), per the SKILL's lifecycle authoring notes; obey every footgun in the common file (no pkill by name, no /tmp globs).
C. **Rule.** Propose ONE placement rule for FORM pins in a part-of-note embed or hover, with a probe diff (uncommitted; save it as
   sc596-r1-probe-rule.diff.txt; restore the tree after). Candidates to weigh (from the ticket): (1) reuse SC-594's link path for
   forms (embed `src` / `hover-link` bound link, `cardLinkLine`-style checks) ahead of `searchedPinLine`; (2) a block-only part may be
   placed by text search only with context lines or the `^id` marker; (3) a form with a null pin gets pin-only semantics (refuse) — or
   the own fence found by DOM ordinal. Sweep the table from A under the probe: count twin writes (must be 0), saved->refused (each one
   named and justified; the SC-584 r5 shape "two identical counters, no + first, pencil on the lower -> lower" must still save, block
   and heading embeds), refused->saved. Mutation-check the probe (at least 8 mutants of its guards; report killed/survived).
D. **SC-607** (a still-open preview's CARD write follows what its link names now): does your rule's mechanism also cover it? Yes/no and
   one paragraph. Do NOT widen into it.

## Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc596-hover-embed-form-wrong-block/sc596-r1-design-report.md
(<=10-line executive summary first: twin-writing cells at base; reachability verdict; proposed rule in two lines; probe sweep numbers;
mutants; open questions). Logs and probe files alongside, prefixed `sc596-r1-`. Final text: raw facts + every artifact path. State the
working tree is clean at the end (`git -C <dse> status --porcelain` empty) and no Obsidian process of yours is left.
