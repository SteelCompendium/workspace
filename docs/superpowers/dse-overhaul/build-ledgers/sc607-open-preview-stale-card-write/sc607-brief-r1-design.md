# SC-607 r1 — design/survey round (orchestration:reviewer). NO product commits.

## Context loading (read first)
1. Ledger: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc607-open-preview-stale-card-write/decisions.md
2. Common gates/footguns (binding): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc607-open-preview-stale-card-write/sc607-brief-common-gates-footguns.md
3. dse-verify skill (/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md, ~375 KB — read in parts with
   offset/limit or grep, never whole): section "Block edit form Save and embeds (SC-556)" (line ~336-450): the "Two identical blocks
   separated only by blank lines" bullet (~339), "Embeds of part of a note" (~340, rewritten by SC-596), "Hover card writes (SC-594)"
   (~441) with its sub-bullets, especially "The 17-44 ms window" and "Known limit (SC-607)" (~450). Plus "Lifecycle and e2e notes"
   (~177) and whatever lifecycle-authoring notes you need to write a scratch scenario.
4. Prior art (tracked, read executive summaries; dive only where needed):
   /home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/
   - sc594-hover-heading-card-write/sc594-r5-rereview-report.md — MEDIUM-1 is THIS ticket (scratch scenario T9 measured: the cache
     catches up 6-45 ms after an outside edit; a preview whose part TEXT is unchanged is never redrawn, old card connected through
     1.5 s). Its probe files sc594-r5-probe-lifecycle-scenario.mjs.txt / sc594-r5-probe-make-scratch.py.txt are templates.
   - sc596-hover-embed-form-wrong-block/sc596-r1-design-report.md — §D says forms share this limit and what is needed: "a pin of the
     note as drawn at mount, mapped at click/Save; neither the link nor the own-write record gives it." Its sweep/mutation method
     (sc596-r1-probe.test.ts.txt, sc596-r1-mutate.py.txt, sc596-r1-run-probe.sh.txt, sc596-r1-probe-lifecycle-scenario.mjs.txt) is a
     good template.
5. Code (dse worktree at c6077860): src/…/ReadingModeBlockHost.ts (`rebaseCardPin`, `cardLinkLine`, `takePin`, `pinFromLastWrite`,
   `lastWrite`, `partialPins`, `refusingPins`, `pinnedTarget`, `mapLine` and whatever diff/line-mapping helper it uses,
   `setMountedBody`, `replaceSource`), src/framework/host/hoverLinks.ts, src/framework/host/headingNames.ts, FormModal.ts
   (`pinOnly`), test/dom/framework/reading-mode-host-pin.test.ts, reading-mode-host-hover-card.test.ts,
   reading-mode-host-form-pin.test.ts (the 2880-cell sweep).
Worktree: /home/scott/code/steelCompendium/worktrees/sc607-open-preview-stale-card-write
dse: …/draw-steel-elements, branch `sc607-open-preview-stale-card-write` at c6077860 (= origin/develop at dispatch). Run
`git -C <dse> fetch origin` and report whether origin/develop moved; stay on c6077860 for this round either way. Fresh worktree:
`npm ci` first. Workers never call the tracker.

## The ticket (verbatim from Linear)
> A hover preview is open on `[[note#Tracker]]`. While it stays open, the note changes elsewhere in a way that leaves the previewed
> text the same. For example, the first of two identical `## Tracker` sections is deleted, or two headings swap names. A + or -
> pressed in that preview then writes the counter the link points to NOW. That is a different counter that only looks the same. No
> Notice shows.
>
> Expected: the click is saved into the counter the preview was drawn from, or it is refused with the "changed on disk first"
> Notice. It must never go into a different counter.

Fix idea from the SC-594 reviewer (not a ruling, weigh it): pin the card to the note as drawn when it mounts (the note text plus the
card's line), then map that line through the outside edits at click time, the same way `mapLine` / `pinnedTarget` handle a
whole-note pin. A click whose line the edits cannot map is refused. Since SC-596 a block edit form's pin in an embed / hover is placed
by the same `rebaseCardPin`, so the fix must cover the form's Save as well.

Scott's governing ruling (verbatim, 2026-11-10, SC-556): "Save nothing with a notice is fine." Undeterminable -> refuse (nothing
written, the existing "changed on disk first" Notice), never a different counter.

## A known trap you must address
The existing whole-note line diff trims the common HEAD, so for two identical blocks it always reads the LOWER one as deleted (SKILL
~339). The ticket's own shape (a) — the FIRST of two identical `## Tracker` sections deleted while its preview is open — is exactly
that: a head-trimming map sends the deleted upper section's line to the surviving (lower) one, i.e. the different counter. From the
before/after texts alone, "upper deleted" and "lower deleted" are the same edit. So a plain reuse of `mapLine` does NOT fix (a). Your
rule needs an ambiguity test (e.g. map with head-first AND tail-first alignment and refuse when they disagree on the pinned line, or
any equivalent) — or another source of truth. Show it on (a) both ways: upper hovered + upper deleted -> must refuse (the drawn-from
counter is gone); lower hovered + upper deleted -> the lower (surviving, drawn-from) counter is written, or refused — say which your
rule gives and why.

## Task — four bounded parts. Answer each; do not implement for landing.
A. **Reproduce at c6077860, real Obsidian 1.15.1 (scratch lifecycle scenario, not committed; at most ~12 cells).** Shapes:
   (a) two identical `## Tracker` sections, hover the first, delete it from outside (`vault.process`), wait for the cache (~100 ms),
   real or scripted + on the still-open card; also hover the SECOND and delete the first (control: must write the hovered one);
   (b) `## Tracker` / `## Other` with identical counters, swap the heading names from outside; (c) the same two shapes for a heading
   EMBED `![[note#Tracker]]` in another note (is an embed redrawn when its part text is unchanged?); (d) one block-hover shape if you
   can construct an unchanged-part edit for `[[note#^id]]` (e.g. `^a` / `^b` markers swapped between identical blocks); (e) the FORM
   side: one heading-hover cell where the form (pencil) is open, the outside edit (a) lands, and Save is pressed (the SC-596 r1
   finding: the form stays open when the source note is open in another pane, `keepFormOpenOn`). Table: cell -> RV/LP -> redrawn?
   -> what was written / Notice. Mark every different-counter write.
B. **Feasibility of "the note as drawn".** Measure when a hover-preview / embed card can capture the note text its part was drawn
   from: is a `cachedRead` / `vault.read` at construct / `setMountedBody` the drawn text, and how wide is the window in which an
   outside edit can land between Obsidian's own read and the card's snapshot (instrument a scratch build; a few trials RV/LP)? Is
   there any Obsidian-provided handle (the popover's / embed's file + subpath + the text Obsidian rendered) that is better than a
   separate read? How does the snapshot interact with this host's own writes (`lastWrite.text` should become the new snapshot?), with
   a redraw (new mount -> new snapshot), with `setMountedBody` re-mounts (`remountReused.ts`), and with memory (one string per card
   in an open preview/embed — bound it or share per file+mtime)?
C. **Rule.** Propose ONE rule for card writes AND form pins in a part-of-note embed / hover, with a probe diff (uncommitted; save as
   sc607-r1-probe-rule.diff.txt; restore the tree after; `git -C <dse> status --porcelain` empty at the end). It must make every
   different-counter write in A refuse or land in the drawn-from counter. Then, in jest (a probe test file copied in and removed by its
   literal path), sweep: the A shapes x {heading hover, block hover, heading embed, block embed} x {RV, LP} x {card +, form Save} x
   {upper hovered, lower hovered} x {fresh cache, lagging cache} x {no own + first, own + first}; plus the full existing jest suite
   under the probe (the 2880-cell form-pin sweep and the card suites) — every test that flips, classified. Counts: different-counter
   writes (must be 0), saved->refused (each class named and justified; a hover/embed with NO outside edit must still save), refused->
   saved. Re-run G-S92 and G-S96 on a probe bundle (part 6 `--only=G-S92,G-S96`; report pass/fail and wall time). Mutation-check the
   probe (at least 8 mutants of its guards, including the ambiguity test; killed/survived; name what kills each).
D. **Open questions** for the owner, each with your recommendation. Flag explicitly anything that needs a product decision from Scott
   (a behaviour a user would notice, e.g. new refusals in common shapes). Also: does your rule change whole-note (non-partial) pins or
   plain non-embedded forms? It should not; if the head-trim bias for whole-note forms (SKILL ~339) is also a different-counter write,
   say so as a follow-up, do NOT widen into it.

## Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc607-open-preview-stale-card-write/sc607-r1-design-report.md
(<=10-line executive summary first: A's different-counter cells at base; B's feasibility verdict and window; the rule in two lines;
probe sweep numbers; G-S92/G-S96 on the probe; mutants; open questions, Scott-needed ones marked). Logs and probe files alongside,
prefixed `sc607-r1-` (scratch .mjs/.ts/.py saved as `.txt`). Final text: raw facts + every artifact path. State the working tree is
clean at the end and no Obsidian process of yours is left.
